import { config } from './config.js';

// The only place Studio talks to Payments.
//
// Over HTTP, through the published contract, and never into payments_db. Studio
// asks only for an invoice; it neither sees provider callbacks nor decides that
// money has settled. Payments later tells Studio that through notifyUrl.
const TIMEOUT_MS = 5_000;
export class PaymentsUnavailable extends Error {}

// POST /invoices. Payments is idempotent on (reference, purpose), so a retry
// returns the same pelunasan invoice rather than billing the client twice.
export async function createRemainderInvoice({ commissionId, clientId, artistId, amountIDR }) {
  let response;
  try {
    response = await fetch(`${config.paymentsUrl}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Payments stores and echoes reference/purpose without understanding
        // commissions. The reference lets its later notification find us again.
        reference: commissionId,
        purpose: 'pelunasan',
        payerId: clientId,
        payeeId: artistId,
        amountIDR,
        notifyUrl: `${config.publicUrl}/payment-notifications`,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // Connection refused, timeout, or DNS failure: Payments is not available.
    throw new PaymentsUnavailable(`cannot reach payments at ${config.paymentsUrl}: ${err.message}`);
  }
  if (response.status >= 500 || response.status === 429) {
    // Nothing in Studio has changed yet, so the artist can safely retry final.
    throw new PaymentsUnavailable(`payments returned ${response.status}`);
  }
  if (response.status !== 200 && response.status !== 201) {
    // A 4xx means Studio sent an invalid invoice request; retrying cannot fix it.
    throw new Error(`payments rejected pelunasan (${response.status}): ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}
