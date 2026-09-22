// POST /invoices
// GET  /invoices/{invoiceId}
// POST /invoices/{invoiceId}/void

import { Router } from 'express';
import * as invoices from '../invoices.js';
import {
  fail, route, requireObject, requireString, requireInteger,
  requireOptionalTimestamp, requireUrl,
} from '../http.js';

export const invoiceRoutes = Router();

function parseInput(body) {
  requireObject(body);
  return {
    reference: requireString(body.reference, 'reference', { maxLength: 200 }),
    purpose: requireString(body.purpose, 'purpose', { maxLength: 200 }),
    payerId: requireString(body.payerId, 'payerId', { maxLength: 200 }),
    payeeId: requireString(body.payeeId, 'payeeId', { maxLength: 200 }),
    amountIDR: requireInteger(body.amountIDR, 'amountIDR', { min: 1 }),
    dueAt: requireOptionalTimestamp(body.dueAt, 'dueAt'),
    notifyUrl: requireUrl(body.notifyUrl, 'notifyUrl'),
  };
}

invoiceRoutes.post('/invoices', route(async (req, res) => {
  const input = parseInput(req.body);
  const { row, created } = await invoices.create(input);
  res.status(created ? 201 : 200).json(invoices.toApi(row));
}));

invoiceRoutes.get('/invoices/:invoiceId', route(async (req, res) => {
  const row = await invoices.byId(req.params.invoiceId);
  if (!row) return fail(res, 404, 'NotFound', `No invoice ${req.params.invoiceId}`);
  res.status(200).json(invoices.toApi(row));
}));

invoiceRoutes.post('/invoices/:invoiceId/void', route(async (req, res) => {
  try {
    const result = await invoices.voidInvoice(req.params.invoiceId);
    if (result.notFound) return fail(res, 404, 'NotFound', `No invoice ${req.params.invoiceId}`);
    res.status(200).json(invoices.toApi(result.row));
  } catch (err) {
    if (err instanceof invoices.Conflict) return fail(res, 409, err.code, err.message);
    throw err;
  }
}));
