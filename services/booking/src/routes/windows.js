// POST /windows
// GET  /windows/{windowId}

import { Router } from 'express';
import * as windows from '../windows.js';
import { fail, route } from '../http.js';

export const windowRoutes = Router();

windowRoutes.post('/windows', route(async (req, res) => {
  const input = windows.parseInput(req.body);
  const row = await windows.open(input);

  if (!row) {
    return fail(
      res, 409, 'NoPricelist',
      `Artist ${input.artistId} has not published a pricelist yet`,
    );
  }
  res.status(201).json(windows.toApi(row));
}));

windowRoutes.get('/windows/:windowId', route(async (req, res) => {
  const row = await windows.byId(req.params.windowId);
  if (!row) return fail(res, 404, 'NotFound', `No window ${req.params.windowId}`);
  res.status(200).json(windows.toApi(row));
}));
