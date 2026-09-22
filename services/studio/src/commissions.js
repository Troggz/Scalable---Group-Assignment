import { query } from './db.js';
import { newId, InvalidInput, requireArray, requireInteger, requireObject, requireString, requireUrl } from './http.js';
import { createRemainderInvoice } from './payments.js';

// A route turns this into the stable 409 code promised by the OpenAPI contract.
// Keeping it separate from InvalidInput distinguishes a bad request from a
// request that is valid but not valid *at this point in the commission's life*.
export class Conflict extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// Studio owns this table. It receives a snapshot of booked terms from Booking,
// then never reaches back into Booking's database or pricelist.
const SELECT = 'SELECT * FROM commissions';

function item(value, field) {
  requireObject(value);
  return {
    code: requireString(value.code, `${field}.code`, { maxLength: 64 }),
    name: requireString(value.name, `${field}.name`, { maxLength: 200 }),
  };
}

export function parseBooked(body) {
  requireObject(body);
  const quoteIDR = requireInteger(body.quoteIDR, 'quoteIDR', { min: 0 });
  const paidIDR = requireInteger(body.paidIDR, 'paidIDR', { min: 0 });
  // Studio knows facts, not the deposit policy: its remaining balance is always
  // the agreed quote minus the amount Booking says has already been paid.
  if (paidIDR > quoteIDR) throw new InvalidInput('paidIDR must not exceed quoteIDR');
  return {
    bookingRef: requireString(body.bookingRef, 'bookingRef', { maxLength: 128 }),
    artistId: requireString(body.artistId, 'artistId', { maxLength: 64 }),
    clientId: requireString(body.clientId, 'clientId', { maxLength: 64 }),
    tier: item(body.tier, 'tier'),
    addOns: requireArray(body.addOns ?? [], 'addOns', { maxItems: 20 }).map((x, i) => item(x, `addOns[${i}]`)),
    brief: requireString(body.brief, 'brief', { maxLength: 4000 }),
    referenceLinks: requireArray(body.referenceLinks ?? [], 'referenceLinks', { maxItems: 10 })
      .map((x, i) => requireUrl(x, `referenceLinks[${i}]`)),
    quoteIDR, paidIDR,
    revisionLimit: requireInteger(body.revisionLimit, 'revisionLimit', { min: 0 }),
  };
}

export function toApi(row) {
  const result = {
    commissionId: row.id, bookingRef: row.booking_ref, artistId: row.artist_id, clientId: row.client_id,
    status: row.status, tier: row.tier, addOns: row.add_ons, brief: row.brief,
    referenceLinks: row.reference_links, revisionLimit: row.revision_limit, revisionsUsed: row.revisions_used,
    quoteIDR: row.quote_idr, balanceDueIDR: row.quote_idr - row.paid_idr,
    queuedAt: row.queued_at.toISOString(),
  };
  // Optional links appear only once that part of the workflow has occurred.
  if (row.sketch_url) result.sketchUrl = row.sketch_url;
  if (row.preview_url) result.previewUrl = row.preview_url;
  if (row.remainder_invoice_id) result.remainderInvoiceId = row.remainder_invoice_id;
  // The stored high-resolution URL is deliberately invisible until payment completes.
  if (row.status === 'COMPLETED' && row.final_file_url) result.finalFileUrl = row.final_file_url;
  return result;
}

export async function byId(id) {
  const { rows } = await query(`${SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function queue(input) {
  try {
    const { rows } = await query(
      `INSERT INTO commissions
       (id, booking_ref, artist_id, client_id, tier, add_ons, brief, reference_links, quote_idr, paid_idr, revision_limit)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8::jsonb,$9,$10,$11) RETURNING *`,
      [newId('com'), input.bookingRef, input.artistId, input.clientId, JSON.stringify(input.tier),
        JSON.stringify(input.addOns), input.brief, JSON.stringify(input.referenceLinks), input.quoteIDR,
        input.paidIDR, input.revisionLimit],
    );
    return { row: rows[0], created: true };
  } catch (err) {
    if (err.code !== '23505') throw err;
    // Booking may retry its CommissionBooked call after a timeout or Studio
    // outage. The unique booking_ref makes that retry return the original job,
    // rather than putting the artist's work in the queue twice.
    const { rows } = await query(`${SELECT} WHERE booking_ref = $1`, [input.bookingRef]);
    return { row: rows[0], created: false };
  }
}

async function transition(id, allowed, updates, params = []) {
  // Put the expected state in the UPDATE itself. This avoids a read-then-write
  // race where two requests could both believe they may advance a commission.
  const { rows } = await query(
    `UPDATE commissions SET ${updates} WHERE id = $${params.length + 1} AND status = ANY($${params.length + 2}) RETURNING *`,
    [...params, id, allowed],
  );
  if (rows[0]) return rows[0];
  const current = await byId(id);
  if (!current) return null;
  throw new Conflict('InvalidTransition', `Commission is ${current.status}`);
}

export function sendSketch(id, sketchUrl) {
  // A revision returns the work to the artist, so it reuses the sketch path.
  return transition(id, ['QUEUED', 'REVISION_REQUESTED'], 'sketch_url = $1, status = \'SKETCH_REVIEW\'', [sketchUrl]);
}
export function approveSketch(id) {
  return transition(id, ['SKETCH_REVIEW'], "status = 'IN_PROGRESS'");
}
export async function requestRevision(id, notes) {
  // The counter and state move are one statement. A request at the limit cannot
  // slip through if two revision requests arrive at almost the same time.
  const { rows } = await query(
    `UPDATE commissions
        SET revisions_used = revisions_used + 1,
            revision_notes = revision_notes || jsonb_build_array($2::text),
            status = 'REVISION_REQUESTED'
      WHERE id = $1 AND status = 'SKETCH_REVIEW' AND revisions_used < revision_limit
    RETURNING *`, [id, notes],
  );
  if (rows[0]) return rows[0];
  const current = await byId(id);
  if (!current) return null;
  if (current.status === 'SKETCH_REVIEW') throw new Conflict('RevisionLimitReached', 'The agreed revision limit has been reached');
  throw new Conflict('InvalidTransition', `Commission is ${current.status}`);
}

export async function sendFinal(id, { previewUrl, finalFileUrl }) {
  const current = await byId(id);
  if (!current) return null;
  // Retrying after a successful final must not create another invoice. Payments
  // is idempotent too, but avoiding the call here keeps this aggregate simple.
  if (current.status === 'AWAITING_BALANCE' || current.status === 'COMPLETED') return current;
  if (current.status !== 'IN_PROGRESS') throw new Conflict('InvalidTransition', `Commission is ${current.status}`);
  const balanceDueIDR = current.quote_idr - current.paid_idr;
  if (balanceDueIDR === 0) {
    // A full upfront payment needs no pelunasan invoice and can release at once.
    return transition(id, ['IN_PROGRESS'], "preview_url = $1, final_file_url = $2, status = 'COMPLETED'", [previewUrl, finalFileUrl]);
  }
  const invoice = await createRemainderInvoice({
    commissionId: current.id, clientId: current.client_id, artistId: current.artist_id, amountIDR: balanceDueIDR,
  });
  // The high-resolution URL is stored now but toApi deliberately withholds it
  // while the commission is AWAITING_BALANCE.
  return transition(id, ['IN_PROGRESS'], "preview_url = $1, final_file_url = $2, remainder_invoice_id = $3, status = 'AWAITING_BALANCE'", [previewUrl, finalFileUrl, invoice.invoiceId]);
}

export async function receiveInvoicePaid({ invoiceId, reference, purpose }) {
  // Payments treats purpose as opaque, but Studio uses it to ensure that only
  // its own pelunasan invoice can release this commission's final file.
  if (purpose !== 'pelunasan') return { unknown: true };
  const current = await byId(reference);
  if (!current || current.remainder_invoice_id !== invoiceId) return { unknown: true };
  // Payments delivers notifications at least once; completing twice is a safe
  // no-op, which lets Payments stop retrying with a successful HTTP response.
  if (current.status === 'COMPLETED') return { applied: false };
  if (current.status !== 'AWAITING_BALANCE') return { unknown: true };
  const { rows } = await query(
    "UPDATE commissions SET paid_idr = quote_idr, status = 'COMPLETED' WHERE id = $1 AND status = 'AWAITING_BALANCE' RETURNING *",
    [reference],
  );
  return { applied: rows.length === 1 };
}

export async function queueForArtist(artistId) {
  // Queue order is a Studio-only decision. Completed jobs are deliberately
  // omitted because the artist's antrian is work that still needs attention.
  const { rows } = await query(`${SELECT} WHERE artist_id = $1 AND status <> 'COMPLETED' ORDER BY queued_at ASC`, [artistId]);
  return rows;
}
