// Delivers InvoicePaid to each invoice's notifyUrl: retried on network errors
// and 5xx, stopped on 2xx and 4xx, per contracts/README.md.
//
// The invoices table doubles as the outbox: notify_done/notify_next_attempt_at
// track delivery per invoice, so there is nothing extra to keep in sync. Every
// attempt (immediate, after marking PAID, or from the periodic sweep) goes
// through claimAndDeliver, which advances notify_next_attempt_at BEFORE
// sending. That is what keeps two overlapping attempts for the same invoice
// from both firing.

import { query } from './db.js';
import { config } from './config.js';

const TIMEOUT_MS = 5_000;

async function claimAndDeliver(invoiceId) {
  const { rows } = await query(
    `UPDATE invoices
        SET notify_attempts = notify_attempts + 1,
            notify_next_attempt_at = now() + ($2 || ' seconds')::interval
      WHERE id = $1 AND status = 'PAID' AND notify_done = false
  RETURNING *`,
    [invoiceId, config.notifyRetrySeconds],
  );
  const invoice = rows[0];
  if (!invoice) return;

  const payload = {
    invoiceId: invoice.id,
    reference: invoice.reference,
    purpose: invoice.purpose,
    amountIDR: invoice.amount_idr,
    paidAt: invoice.paid_at.toISOString(),
  };

  let res;
  try {
    res = await fetch(invoice.notify_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return; // network error: already scheduled for retry above
  }

  if (res.ok) {
    await query('UPDATE invoices SET notify_done = true WHERE id = $1', [invoice.id]);
    return;
  }
  if (res.status >= 500) {
    return; // already scheduled for retry above
  }
  // Any other 4xx: stop, per "stopped on 2xx and 4xx".
  await query('UPDATE invoices SET notify_done = true WHERE id = $1', [invoice.id]);
}

// Called right after a settlement marks an invoice PAID, so delivery is not
// left waiting for the next sweep.
export function scheduleImmediate(invoiceId) {
  claimAndDeliver(invoiceId).catch((err) => {
    console.error('[payments] notify delivery error:', err.message);
  });
}

async function sweep() {
  const { rows } = await query(
    `SELECT id FROM invoices
      WHERE status = 'PAID' AND notify_done = false AND notify_next_attempt_at <= now()
      LIMIT 50`,
  );
  for (const row of rows) {
    await claimAndDeliver(row.id);
  }
}

export function startNotifier() {
  const timer = setInterval(() => {
    sweep().catch((err) => console.error('[payments] notify sweep error:', err.message));
  }, config.notifyRetrySeconds * 1000);
  return () => clearInterval(timer);
}
