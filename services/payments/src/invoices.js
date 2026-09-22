// Invoice: the only thing payments owns.
//
// Two guarantees live here, both from the README's "Must not":
//   - a providerRef is applied at most once (settlements table + ON CONFLICT)
//   - pay and void can't both win (each is a conditional UPDATE guarded by
//     the invoice's current status, holding a row lock for the duration)

import { query, withTransaction } from './db.js';
import { newId, InvalidInput } from './http.js';
import { scheduleImmediate } from './notifier.js';

export class Conflict extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'Conflict';
    this.code = code;
  }
}

export function toApi(row) {
  const out = {
    invoiceId: row.id,
    reference: row.reference,
    purpose: row.purpose,
    payerId: row.payer_id,
    payeeId: row.payee_id,
    amountIDR: row.amount_idr,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
  if (row.due_at) out.dueAt = row.due_at.toISOString();
  if (row.paid_at) out.paidAt = row.paid_at.toISOString();
  return out;
}

export async function byId(invoiceId) {
  const { rows } = await query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
  return rows[0] ?? null;
}

// Idempotent on (reference, purpose): a repeat returns the existing invoice
// instead of issuing a second one. Insert-first, and fall back to a lookup
// on the unique-index violation, rather than check-then-insert, so two
// concurrent callers can't both pass the check and both insert.
export async function create(input) {
  try {
    const { rows } = await query(
      `INSERT INTO invoices
           (id, reference, purpose, payer_id, payee_id, amount_idr, due_at, notify_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        newId('inv'), input.reference, input.purpose, input.payerId, input.payeeId,
        input.amountIDR, input.dueAt ?? null, input.notifyUrl,
      ],
    );
    return { row: rows[0], created: true };
  } catch (err) {
    if (err.code === '23505') {
      const { rows } = await query(
        'SELECT * FROM invoices WHERE reference = $1 AND purpose = $2',
        [input.reference, input.purpose],
      );
      return { row: rows[0], created: false };
    }
    throw err;
  }
}

// Voiding a VOID invoice returns 200 unchanged. Voiding a PAID one is refused:
// paid and void are exclusive, and the guard is the conditional UPDATE, not a
// read-then-write.
export async function voidInvoice(invoiceId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [invoiceId],
    );
    const invoice = rows[0];
    if (!invoice) return { notFound: true };
    if (invoice.status === 'VOID') return { row: invoice };
    if (invoice.status === 'PAID') {
      throw new Conflict('AlreadyPaid', `Invoice ${invoiceId} is already PAID`);
    }

    const { rows: voided } = await client.query(
      `UPDATE invoices SET status = 'VOID' WHERE id = $1 AND status = 'ISSUED' RETURNING *`,
      [invoiceId],
    );
    // Lost the race to a settlement landing between the SELECT and here.
    if (voided.length === 0) {
      throw new Conflict('AlreadyPaid', `Invoice ${invoiceId} is already PAID`);
    }
    return { row: voided[0] };
  });
}

// Exactly-once settlement. The settlement log's PRIMARY KEY on provider_ref,
// inserted with ON CONFLICT DO NOTHING inside this transaction, is what makes
// a repeated callback a no-op: if the insert doesn't happen, nothing below it
// runs either.
export async function applySettlement({ providerRef, invoiceId, amountIDR }) {
  return withTransaction(async (client) => {
    const { rows: found } = await client.query(
      'SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [invoiceId],
    );
    const invoice = found[0];
    if (!invoice) return { notFound: true };

    const { rowCount: firstTime } = await client.query(
      `INSERT INTO settlements (provider_ref, invoice_id, amount_idr)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider_ref) DO NOTHING`,
      [providerRef, invoiceId, amountIDR],
    );
    if (firstTime === 0) {
      return { applied: false, row: invoice };
    }

    if (invoice.status === 'VOID') {
      throw new Conflict('InvoiceNotPayable', `Invoice ${invoiceId} is VOID`);
    }
    if (amountIDR !== invoice.amount_idr) {
      throw new InvalidInput(`AmountMismatch: settled ${amountIDR} does not match invoice amount ${invoice.amount_idr}`);
    }
    if (invoice.status === 'PAID') {
      // Already paid by an earlier, different settlement. Nothing left to do.
      return { applied: false, row: invoice };
    }

    const { rows: paid } = await client.query(
      `UPDATE invoices
          SET status = 'PAID', paid_at = now()
        WHERE id = $1 AND status = 'ISSUED'
    RETURNING *`,
      [invoiceId],
    );
    return { applied: true, row: paid[0] };
  }).then((result) => {
    if (result.applied) scheduleImmediate(result.row.id);
    return result;
  });
}
