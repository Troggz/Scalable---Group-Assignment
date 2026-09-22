// CommissionRequest, and the hard rule.
//
// Eja, the artist we interviewed, was precise about when a slot is really taken:
//
//   "baru chat = belum dapet slot.  aku bilang yes = slot di-keep.
//    DP masuk = fix booked."
//
// So submitting a request consumes nothing -- a full window still accepts them --
// and the capacity check lives in accept(), below.

import { query, withTransaction } from './db.js';
import * as windows from './windows.js';
import * as pricelist from './pricelist.js';
import { createInvoice } from './payments.js';
import { InvalidInput, newId, requireArray, requireObject, requireString } from './http.js';

export class Conflict extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'Conflict';
    this.code = code;
  }
}

export function parseInput(body) {
  requireObject(body);
  return {
    clientId: requireString(body.clientId, 'clientId', { maxLength: 64 }),
    tier: requireString(body.tier, 'tier', { maxLength: 64 }),
    addOns: requireArray(body.addOns ?? [], 'addOns', { maxItems: 20 })
      .map((c, i) => requireString(c, `addOns[${i}]`, { maxLength: 64 })),
    brief: requireString(body.brief, 'brief', { maxLength: 4000 }),
    referenceLinks: requireArray(body.referenceLinks ?? [], 'referenceLinks', { maxItems: 10 })
      .map((l, i) => requireString(l, `referenceLinks[${i}]`, { maxLength: 2000 })),
  };
}

export function toApi(row) {
  const out = {
    requestId: row.id,
    windowId: row.window_id,
    artistId: row.artist_id,
    clientId: row.client_id,
    status: row.status,
    tier: { code: row.tier_code, name: row.tier_name },
    addOns: row.add_ons,
    brief: row.brief,
    referenceLinks: row.reference_links,
    listPriceIDR: row.list_price_idr,
    submittedAt: row.submitted_at.toISOString(),
  };
  // Present only from ACCEPTED onward, exactly as the contract describes.
  if (row.quote_idr !== null) out.quoteIDR = row.quote_idr;
  if (row.deposit_idr !== null) out.depositIDR = row.deposit_idr;
  if (row.deposit_invoice_id !== null) out.depositInvoiceId = row.deposit_invoice_id;
  if (row.pay_by !== null) out.payBy = row.pay_by.toISOString();
  if (row.commission_id !== null) out.commissionId = row.commission_id;
  return out;
}

export async function byId(requestId) {
  const { rows } = await query('SELECT * FROM commission_requests WHERE id = $1', [requestId]);
  return rows[0] ?? null;
}

// Submitting holds nothing. The only reasons to refuse are that the window is
// not taking requests at all, or that this client already has one open.
export async function submit(windowRow, input) {
  const status = windows.statusOf(windowRow);
  if (status === 'SCHEDULED' || status === 'CLOSED') {
    throw new Conflict('WindowNotOpen', `Window ${windowRow.id} is ${status.toLowerCase()}`);
  }

  const priced = pricelist.listPriceIDR(windowRow.pricelist, input.tier, input.addOns);

  try {
    const { rows } = await query(
      `INSERT INTO commission_requests
           (id, window_id, artist_id, client_id, tier_code, tier_name, add_ons, brief,
            reference_links, list_price_idr, deposit_percent, revision_limit)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10,$11,$12)
       RETURNING *`,
      [
        newId('req'), windowRow.id, windowRow.artist_id, input.clientId,
        priced.tier.code, priced.tier.name, JSON.stringify(priced.addOns), input.brief,
        JSON.stringify(input.referenceLinks), priced.listPriceIDR,
        windowRow.pricelist.depositPercent, windowRow.pricelist.revisionLimit,
      ],
    );
    return rows[0];
  } catch (err) {
    // The partial unique index on (window_id, client_id) over live statuses.
    if (err.code === '23505') {
      throw new Conflict('AlreadyRequested', `Client ${input.clientId} already has a live request in this window`);
    }
    throw err;
  }
}

// DP = quote x depositPercent, rounded up to the nearest Rp1.000. Rounding is
// booking's own decision and appears nowhere in any contract.
export function depositFor(quoteIDR, depositPercent) {
  return Math.ceil((quoteIDR * depositPercent) / 100 / 1000) * 1000;
}

// --------------------------------------------------------------------------
// accept(): the hard rule.
//
// The slot is consumed by ONE conditional UPDATE. Never read kept/taken and then
// write them back -- that version passes a single-user demo and loses slots the
// moment two accepts land together, which is the exact failure Eja described:
//
//   "dua orang chat hampir barengan pas tinggal satu slot."
//
// The UPDATE and the request's move to ACCEPTED share a transaction, and the
// call to payments sits inside it too. That holds a row lock for the duration of
// one HTTP call, which is a real cost -- but it means a failure anywhere rolls
// the slot back automatically, so a request can never end up ACCEPTED without an
// invoice, or consume a slot it did not get. At this scale that trade is worth
// it; at a larger one this would become an outbox.
// --------------------------------------------------------------------------
export async function accept(requestId, quoteIDR, { dpDeadlineMinutes, publicUrl }) {
  return withTransaction(async (client) => {
    const { rows: reqRows } = await client.query(
      'SELECT * FROM commission_requests WHERE id = $1 FOR UPDATE', [requestId],
    );
    const req = reqRows[0];
    if (!req) return { notFound: true };

    // Idempotent: a retry after success returns the same request and invoice,
    // and must not consume a second slot.
    if (req.status === 'ACCEPTED') return { row: req };
    if (req.status !== 'SUBMITTED') {
      throw new Conflict('InvalidTransition', `Request is ${req.status}, not SUBMITTED`);
    }

    const quote = quoteIDR ?? req.list_price_idr;
    if (quote < req.list_price_idr) {
      throw new InvalidInput(
        `QuoteBelowListPrice: ${quote} is below the list price of ${req.list_price_idr}`,
      );
    }

    // ---- the hard rule, in one statement -------------------------------
    const { rows: kept } = await client.query(
      `UPDATE commission_windows
          SET kept = kept + 1
        WHERE id = $1
          AND kept + taken < slot_count
          AND NOT closed_early
          AND now() < closes_at
      RETURNING id, slot_count, kept, taken`,
      [req.window_id],
    );
    if (kept.length === 0) {
      // Either the window filled up or it closed. Tell them apart for the
      // message only -- both are a 409 and neither changed anything.
      const { rows: w } = await client.query(
        'SELECT * FROM commission_windows WHERE id = $1', [req.window_id],
      );
      const status = w[0] ? windows.statusOf(w[0]) : 'CLOSED';
      if (status === 'CLOSED') {
        throw new Conflict('WindowNotOpen', `Window ${req.window_id} is closed`);
      }
      throw new Conflict(
        'SlotsFull',
        `All ${w[0].slot_count} slots in "${w[0].title}" are kept or taken`,
      );
    }
    // --------------------------------------------------------------------

    const deposit = depositFor(quote, req.deposit_percent);
    const payBy = new Date(Date.now() + dpDeadlineMinutes * 60_000);

    const invoice = await createInvoice({
      reference: req.id,
      purpose: 'dp',
      payerId: req.client_id,
      payeeId: req.artist_id,
      amountIDR: deposit,
      dueAt: payBy.toISOString(),
      notifyUrl: `${publicUrl}/payment-notifications`,
    });

    const { rows } = await client.query(
      `UPDATE commission_requests
          SET status = 'ACCEPTED', quote_idr = $2, deposit_idr = $3,
              deposit_invoice_id = $4, pay_by = $5
        WHERE id = $1
    RETURNING *`,
      [req.id, quote, deposit, invoice.invoiceId, payBy.toISOString()],
    );
    return { row: rows[0] };
  });
}

// Declining holds nothing back, because nothing was held: a SUBMITTED request
// never consumed a slot. This is the part of the model that changed after the
// interview -- the old design released a slot here.
export async function decline(requestId) {
  const { rows } = await query(
    `UPDATE commission_requests
        SET status = 'DECLINED'
      WHERE id = $1 AND status = 'SUBMITTED'
  RETURNING *`,
    [requestId],
  );
  return rows[0] ?? null;
}
