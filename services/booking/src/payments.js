// The only place booking talks to payments.
//
// Over HTTP, through the published contract, and never into payments_db. That
// restraint is what requirement B2 is checking for, and it is why this file
// exists at all rather than a shared database helper.

import { config } from './config.js';

// Payments is unreachable, slow, or broken. The accept route turns this into
// 503 PaymentsUnavailable and leaves the request SUBMITTED, so the artist can
// simply try again once payments is back.
export class PaymentsUnavailable extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentsUnavailable';
  }
}

const TIMEOUT_MS = 5_000;

// POST /invoices. Idempotent on (reference, purpose): a repeat returns the
// existing invoice with 200 instead of issuing a second one, so retrying an
// accept cannot bill the same client twice.
export async function createInvoice({ reference, purpose, payerId, payeeId, amountIDR, dueAt, notifyUrl }) {
  let res;
  try {
    res = await fetch(`${config.paymentsUrl}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, purpose, payerId, payeeId, amountIDR, dueAt, notifyUrl }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // Connection refused, DNS failure, timeout: payments is simply not there.
    throw new PaymentsUnavailable(`cannot reach payments at ${config.paymentsUrl}: ${err.message}`);
  }

  // 5xx and 429 are payments' problem and worth retrying. A 4xx is ours and
  // retrying will not help, so it surfaces as a real error instead.
  if (res.status >= 500 || res.status === 429) {
    throw new PaymentsUnavailable(`payments returned ${res.status}`);
  }
  if (res.status !== 200 && res.status !== 201) {
    const body = await res.text().catch(() => '');
    throw new Error(`payments rejected the invoice (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json();
}

// POST /invoices/{id}/void. Used by the expiry sweep when a DP deadline passes.
//
// The contract is blunt about the race: "Paid and void are exclusive. If a
// settlement landed first this returns 409 AlreadyPaid, and the caller must
// wait for InvoicePaid rather than give the slot away." So a 409 is not an
// error here -- it is payments telling us the client paid at the last second
// and the slot is theirs. We report it and the sweep leaves the request alone.
export async function voidInvoice(invoiceId) {
  let res;
  try {
    res = await fetch(`${config.paymentsUrl}/invoices/${encodeURIComponent(invoiceId)}/void`, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new PaymentsUnavailable(`cannot reach payments at ${config.paymentsUrl}: ${err.message}`);
  }

  if (res.status === 409) return { alreadyPaid: true };
  if (res.status >= 500 || res.status === 429) {
    throw new PaymentsUnavailable(`payments returned ${res.status}`);
  }
  if (res.status !== 200) {
    const body = await res.text().catch(() => '');
    throw new Error(`payments refused the void (${res.status}): ${body.slice(0, 200)}`);
  }

  return { alreadyPaid: false };
}
