// POST /commissions
// GET  /commissions/{commissionId}
// GET  /artists/{artistId}/queue
// POST /commissions/{commissionId}/sketch
// POST /commissions/{commissionId}/sketch/approve
// POST /commissions/{commissionId}/sketch/revisions
// POST /commissions/{commissionId}/final

import { Router } from 'express';
import * as commissions from '../commissions.js';
import { fail, requireObject, requireString, requireUrl, route } from '../http.js';
import { PaymentsUnavailable } from '../payments.js';

export const commissionRoutes = Router();

function result(res, row) { return res.status(200).json(commissions.toApi(row)); }
function conflict(res, err) { return fail(res, 409, err.code, err.message); }

commissionRoutes.post('/commissions', route(async (req, res) => {
  // Booking is the sole sender of this fact. queue() handles a retry by
  // returning the original commission with 200 rather than creating another.
  const { row, created } = await commissions.queue(commissions.parseBooked(req.body));
  res.status(created ? 201 : 200).json(commissions.toApi(row));
}));

commissionRoutes.get('/commissions/:commissionId', route(async (req, res) => {
  const row = await commissions.byId(req.params.commissionId);
  if (!row) return fail(res, 404, 'NotFound', `No commission ${req.params.commissionId}`);
  return result(res, row);
}));

commissionRoutes.get('/artists/:artistId/queue', route(async (req, res) => {
  const rows = await commissions.queueForArtist(requireString(req.params.artistId, 'artistId', { maxLength: 64 }));
  res.status(200).json({ artistId: req.params.artistId, commissions: rows.map(commissions.toApi) });
}));

commissionRoutes.post('/commissions/:commissionId/sketch', route(async (req, res) => {
  const body = requireObject(req.body);
  try {
    const row = await commissions.sendSketch(req.params.commissionId, requireUrl(body.sketchUrl, 'sketchUrl'));
    if (!row) return fail(res, 404, 'NotFound', `No commission ${req.params.commissionId}`);
    return result(res, row);
  } catch (err) { if (err instanceof commissions.Conflict) return conflict(res, err); throw err; }
}));

commissionRoutes.post('/commissions/:commissionId/sketch/approve', route(async (req, res) => {
  try {
    const row = await commissions.approveSketch(req.params.commissionId);
    if (!row) return fail(res, 404, 'NotFound', `No commission ${req.params.commissionId}`);
    return result(res, row);
  } catch (err) { if (err instanceof commissions.Conflict) return conflict(res, err); throw err; }
}));

commissionRoutes.post('/commissions/:commissionId/sketch/revisions', route(async (req, res) => {
  const body = requireObject(req.body);
  const notes = requireString(body.notes, 'notes', { maxLength: 2000 });
  try {
    const row = await commissions.requestRevision(req.params.commissionId, notes);
    if (!row) return fail(res, 404, 'NotFound', `No commission ${req.params.commissionId}`);
    return result(res, row);
  } catch (err) { if (err instanceof commissions.Conflict) return conflict(res, err); throw err; }
}));

commissionRoutes.post('/commissions/:commissionId/final', route(async (req, res) => {
  const body = requireObject(req.body);
  try {
    const row = await commissions.sendFinal(req.params.commissionId, {
      previewUrl: requireUrl(body.previewUrl, 'previewUrl'),
      finalFileUrl: requireUrl(body.finalFileUrl, 'finalFileUrl'),
    });
    if (!row) return fail(res, 404, 'NotFound', `No commission ${req.params.commissionId}`);
    return result(res, row);
  } catch (err) {
    if (err instanceof commissions.Conflict) return conflict(res, err);
    if (err instanceof PaymentsUnavailable) {
      // Studio leaves the commission IN_PROGRESS, so retrying final after
      // Payments recovers is safe and does not expose the hi-res file early.
      return fail(res, 503, 'PaymentsUnavailable', err.message);
    }
    throw err;
  }
}));
