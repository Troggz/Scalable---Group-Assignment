// InvoicePaid, arriving from payments.
//
// Payments retries on network errors and 5xx and stops on 2xx and 4xx, so this
// handler is called at least once and possibly several times for the same
// payment. It must be idempotent, and idempotent in a way that still makes
// progress -- which is the part that is easy to get wrong.
//
// The naive version writes the invoiceId into a "seen" table and returns 200 on
// any repeat. That breaks the case that actually happens: the first delivery
// books the request, then studio is down, so we answer 503 and payments retries.
// On the retry the invoice is already "seen", we return 200, and the commission
// is never queued. The slot is consumed and the client has paid for a job that
// does not exist.
//
// So the guard is the state transition itself -- UPDATE ... WHERE status =
// 'ACCEPTED' -- and queueing the commission is a separate step that runs on
// every delivery until it succeeds.

import { query, withTransaction } from './db.js';
import { queueCommission } from './studio.js';

export const UNKNOWN_REFERENCE = 'UnknownReference';

// Books the request if it is not booked yet. Returns the current row either way.
// `applied` says whether this call is the one that changed it, which is what the
// demo shows when the same callback is delivered twice.
async function book(reference, invoiceId, purpose) {
  return withTransaction(async (client) => {
    const { rows: found } = await client.query(
      'SELECT * FROM commission_requests WHERE id = $1 FOR UPDATE', [reference],
    );
    const req = found[0];
    if (!req) return { unknown: true };

    // Recorded for audit and so a duplicate delivery is visible rather than
    // merely harmless. It is deliberately NOT the thing that decides whether we
    // do the work -- see the note at the top of this file.
    const { rowCount: firstTime } = await client.query(
      `INSERT INTO processed_notifications (invoice_id, request_id, purpose)
       VALUES ($1, $2, $3)
       ON CONFLICT (invoice_id) DO NOTHING`,
      [invoiceId, reference, purpose],
    );

    const { rows: booked } = await client.query(
      `UPDATE commission_requests
          SET status = 'BOOKED'
        WHERE id = $1 AND status = 'ACCEPTED'
    RETURNING *`,
      [reference],
    );

    if (booked.length === 0) {
      // Already BOOKED, or DECLINED/EXPIRED and no longer bookable. Either way
      // nothing changes and payments must not retry, so this is still a 200.
      return { row: req, applied: false, duplicate: firstTime === 0 };
    }

    // The slot stops being held and becomes taken. kept + taken is unchanged,
    // so the window's capacity CHECK cannot be tripped by this.
    await client.query(
      `UPDATE commission_windows
          SET kept = kept - 1, taken = taken + 1
        WHERE id = $1`,
      [booked[0].window_id],
    );

    return { row: booked[0], applied: true, duplicate: false };
  });
}

// Queues the commission in studio if it is not queued already. Safe to call on
// every delivery: studio is idempotent on bookingRef, and we only call it while
// commission_id is still null.
async function ensureQueued(req) {
  if (req.commission_id) return req.commission_id;

  const commission = await queueCommission({
    bookingRef: req.id,
    artistId: req.artist_id,
    clientId: req.client_id,
    tier: { code: req.tier_code, name: req.tier_name },
    addOns: req.add_ons,
    brief: req.brief,
    referenceLinks: req.reference_links,
    quoteIDR: req.quote_idr,
    paidIDR: req.deposit_idr,
    revisionLimit: req.revision_limit,
  });

  await query(
    'UPDATE commission_requests SET commission_id = $2 WHERE id = $1',
    [req.id, commission.commissionId],
  );
  return commission.commissionId;
}

export async function invoicePaid({ invoiceId, reference, purpose }) {
  // Only the deposit books a slot. Anything else (a pelunasan notification that
  // reached the wrong service, say) is acknowledged and ignored, because a 4xx
  // would make payments retry forever over something we will never act on.
  if (purpose !== 'dp') return { ignored: true };

  const result = await book(reference, invoiceId, purpose);
  if (result.unknown) return { unknown: true };

  // Runs whether or not this delivery is the one that booked it, so a retry
  // after a studio outage still finishes the job.
  const commissionId = await ensureQueued(result.row);

  return { applied: result.applied, duplicate: result.duplicate, commissionId };
}
