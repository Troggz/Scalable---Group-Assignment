// POST /windows/{windowId}/requests
// GET  /requests/{requestId}
// POST /requests/{requestId}/accept      <- the hard rule
// POST /requests/{requestId}/decline

import { Router } from 'express';
import * as requests from '../requests.js';
import * as windows from '../windows.js';
import { PaymentsUnavailable } from '../payments.js';
import { config } from '../config.js';
import { fail, requireInteger, route } from '../http.js';

export const requestRoutes = Router();

requestRoutes.post('/windows/:windowId/requests', route(async (req, res) => {
  const windowRow = await windows.byId(req.params.windowId);
  if (!windowRow) return fail(res, 404, 'NotFound', `No window ${req.params.windowId}`);

  const input = requests.parseInput(req.body);

  try {
    const row = await requests.submit(windowRow, input);
    res.status(201).json(requests.toApi(row));
  } catch (err) {
    if (err instanceof requests.Conflict) return fail(res, 409, err.code, err.message);
    throw err;
  }
}));

requestRoutes.get('/requests/:requestId', route(async (req, res) => {
  const row = await requests.byId(req.params.requestId);
  if (!row) return fail(res, 404, 'NotFound', `No request ${req.params.requestId}`);
  res.status(200).json(requests.toApi(row));
}));

requestRoutes.post('/requests/:requestId/accept', route(async (req, res) => {
  const body = req.body ?? {};
  const quoteIDR = body.quoteIDR === undefined
    ? undefined
    : requireInteger(body.quoteIDR, 'quoteIDR', { min: 0 });

  try {
    const result = await requests.accept(req.params.requestId, quoteIDR, {
      dpDeadlineMinutes: config.dpDeadlineMinutes,
      publicUrl: config.publicUrl,
    });
    if (result.notFound) return fail(res, 404, 'NotFound', `No request ${req.params.requestId}`);
    res.status(200).json(requests.toApi(result.row));
  } catch (err) {
    if (err instanceof requests.Conflict) return fail(res, 409, err.code, err.message);
    if (err instanceof PaymentsUnavailable) {
      // The transaction rolled back, so the slot was released and the request is
      // still SUBMITTED. Retrying once payments is up is safe.
      return fail(res, 503, 'PaymentsUnavailable', err.message);
    }
    throw err;
  }
}));

requestRoutes.post('/requests/:requestId/decline', route(async (req, res) => {
  const row = await requests.decline(req.params.requestId);
  if (row) return res.status(200).json(requests.toApi(row));

  const existing = await requests.byId(req.params.requestId);
  if (!existing) return fail(res, 404, 'NotFound', `No request ${req.params.requestId}`);
  return fail(res, 409, 'InvalidTransition', `Request is ${existing.status}, not SUBMITTED`);
}));
