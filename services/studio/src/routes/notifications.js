// POST /payment-notifications -- InvoicePaid from Payments.

import { Router } from 'express';
import * as commissions from '../commissions.js';
import { fail, requireInteger, requireObject, requireString, requireTimestamp, route } from '../http.js';

export const notificationRoutes = Router();

// This is called by Payments, not the thin client. Payments retries network and
// 5xx failures, so commissions.receiveInvoicePaid must be idempotent.
notificationRoutes.post('/payment-notifications', route(async (req, res) => {
  const body = requireObject(req.body);
  const invoiceId = requireString(body.invoiceId, 'invoiceId', { maxLength: 128 });
  const reference = requireString(body.reference, 'reference', { maxLength: 128 });
  const purpose = requireString(body.purpose, 'purpose', { maxLength: 64 });
  requireInteger(body.amountIDR, 'amountIDR', { min: 1 });
  requireTimestamp(body.paidAt, 'paidAt');
  const result = await commissions.receiveInvoicePaid({ invoiceId, reference, purpose });
  if (result.unknown) {
    // A 4xx tells Payments this will never become valid, so it stops retrying.
    return fail(res, 422, 'UnknownReference', `No pending pelunasan for ${reference}`);
  }
  return res.status(200).json({ applied: result.applied });
}));
