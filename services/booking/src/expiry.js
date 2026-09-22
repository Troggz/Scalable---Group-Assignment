// The DP deadline: releasing a slot that was kept but never paid for.
//
// This is the other half of the hard rule. accept() keeps a slot, InvoicePaid
// turns it into a taken one -- and without this sweep a client who accepts and
// then never pays holds that slot until the window closes. Eja described the
// same thing happening to her:
//
//   "ada yang bilang mau, terus ilang. slotnya nyangkut."
//
// Order matters, and it is the one thing to get right here. Void the invoice
// FIRST, then release the slot. The contract says a void loses to a settlement
// that already landed (409 AlreadyPaid), so voiding first means payments -- the
// service that actually knows whether money arrived -- decides the race. If we
// released the slot first and then discovered the client had paid, we would
// have given away a slot that was bought and paid for.

import { query, withTransaction } from './db.js';
import { config } from './config.js';
import { voidInvoice, PaymentsUnavailable } from './payments.js';

// Expires one overdue request. Returns what happened, for the log and the tests.
async function expireOne(row) {
  // Step 1: ask payments to cancel the unpaid invoice.
  const { alreadyPaid } = await voidInvoice(row.deposit_invoice_id);
  if (alreadyPaid) {
    // The DP landed while we were sweeping. Leave everything alone: the
    // InvoicePaid notification is on its way and will book the request.
    return { requestId: row.id, outcome: 'paid-in-time' };
  }

  // Step 2: release the slot. Guarded on status = 'ACCEPTED' so that an
  // InvoicePaid that booked the request between the void and here cannot be
  // overwritten -- if that happened the UPDATE matches nothing and we stop.
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE commission_requests
          SET status = 'EXPIRED'
        WHERE id = $1 AND status = 'ACCEPTED'
    RETURNING window_id`,
      [row.id],
    );
    if (rows.length === 0) return { requestId: row.id, outcome: 'already-moved' };

    // The slot stops being kept and goes back to the pool. taken is untouched,
    // so kept + taken only ever falls here and the capacity CHECK is safe.
    await client.query(
      'UPDATE commission_windows SET kept = kept - 1 WHERE id = $1',
      [rows[0].window_id],
    );
    return { requestId: row.id, outcome: 'expired' };
  });
}

// One pass. Uses the partial index on (pay_by) WHERE status = 'ACCEPTED', so
// this stays cheap however many requests the table holds.
export async function sweep() {
  const { rows } = await query(
    `SELECT id, deposit_invoice_id
       FROM commission_requests
      WHERE status = 'ACCEPTED' AND pay_by <= now()
      LIMIT 50`,
  );

  const results = [];
  for (const row of rows) {
    try {
      results.push(await expireOne(row));
    } catch (err) {
      // Payments being down is not a reason to release a slot -- we would be
      // guessing about money. Leave the request ACCEPTED and try next sweep.
      if (err instanceof PaymentsUnavailable) {
        results.push({ requestId: row.id, outcome: 'deferred' });
        continue;
      }
      throw err;
    }
  }
  return results;
}

export function startExpirySweep() {
  const everyMs = config.expirySweepSeconds * 1000;
  const timer = setInterval(() => {
    sweep()
      .then((results) => {
        const expired = results.filter((r) => r.outcome === 'expired');
        if (expired.length > 0) {
          console.log(`[booking] DP deadline passed, released ${expired.length} slot(s): ` +
            expired.map((r) => r.requestId).join(', '));
        }
      })
      .catch((err) => console.error('[booking] expiry sweep error:', err.message));
  }, everyMs);
  return () => clearInterval(timer);
}
