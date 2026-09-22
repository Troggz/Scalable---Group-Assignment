// PUT /artists/{artistId}/pricelist
// GET /artists/{artistId}/pricelist

import { Router } from 'express';
import * as pricelist from '../pricelist.js';
import { fail, route } from '../http.js';

export const pricelistRoutes = Router();

pricelistRoutes.put('/artists/:artistId/pricelist', route(async (req, res) => {
  const input = pricelist.parseInput(req.body);
  const published = await pricelist.publish(req.params.artistId, input);
  res.status(200).json(published);
}));

pricelistRoutes.get('/artists/:artistId/pricelist', route(async (req, res) => {
  const found = await pricelist.get(req.params.artistId);
  if (!found) {
    return fail(res, 404, 'NotFound', `No pricelist for artist ${req.params.artistId}`);
  }
  res.status(200).json(found);
}));
