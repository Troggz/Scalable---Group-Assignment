// POST /provider/callbacks -- called by the payment provider (simulated).

import { Router } from 'express';
import * as invoices from '../invoices.js';
import { fail, route, requireObject, requireString, requireInteger } from '../http.js';

export const providerRoutes = Router();

providerRoutes.post('/provider/callbacks', route(async (req, res) => {
  const body = req.body;
  requireObject(body);
  const providerRef = requireString(body.providerRef, 'providerRef', { maxLength: 200 });
  const invoiceId = requireString(body.invoiceId, 'invoiceId', { maxLength: 200 });
  const amountIDR = requireInteger(body.amountIDR, 'amountIDR', { min: 1 });
  const status = requireString(body.status, 'status', { maxLength: 32 });
  if (status !== 'SETTLED') {
    return fail(res, 422, 'InvalidInput', 'status must be SETTLED');
  }

  try {
    const result = await invoices.applySettlement({ providerRef, invoiceId, amountIDR });
    if (result.notFound) return fail(res, 404, 'NotFound', `No invoice ${invoiceId}`);
    res.status(200).json({ applied: result.applied, invoiceStatus: result.row.status });
  } catch (err) {
    if (err instanceof invoices.Conflict) return fail(res, 409, err.code, err.message);
    throw err;
  }
}));
