// CommissionWindow: the aggregate that carries the hard rule.
//
// `status` is never stored. It is derived from the dates and the counts every
// time a window is read, so it cannot drift out of step with kept + taken the
// way a stored copy would. The contract exposes status; the table has no such
// column, and nobody outside booking can tell.

import { query } from './db.js';
import * as pricelist from './pricelist.js';
import {
  InvalidInput, newId, requireInteger, requireObject, requireString, requireTimestamp,
} from './http.js';

export function parseInput(body) {
  requireObject(body);

  const opensAt = requireTimestamp(body.opensAt, 'opensAt');
  const closesAt = requireTimestamp(body.closesAt, 'closesAt');
  if (closesAt <= opensAt) throw new InvalidInput('closesAt must be after opensAt');

  return {
    artistId: requireString(body.artistId, 'artistId', { maxLength: 64 }),
    title: requireString(body.title, 'title', { maxLength: 200 }),
    slotCount: requireInteger(body.slotCount, 'slotCount', { min: 1, max: 1000 }),
    opensAt,
    closesAt,
  };
}

// SCHEDULED -> OPEN <-> FULL -> CLOSED. Closed wins over full: a window that has
// ended is closed even if it never filled.
export function statusOf(row, now = new Date()) {
  if (row.closed_early || now >= row.closes_at) return 'CLOSED';
  if (now < row.opens_at) return 'SCHEDULED';
  if (row.kept + row.taken >= row.slot_count) return 'FULL';
  return 'OPEN';
}

export function toApi(row, now = new Date()) {
  return {
    windowId: row.id,
    artistId: row.artist_id,
    title: row.title,
    status: statusOf(row, now),
    slotCount: row.slot_count,
    slotsLeft: row.slot_count - (row.kept + row.taken),
    opensAt: row.opens_at.toISOString(),
    closesAt: row.closes_at.toISOString(),
    pricelist: row.pricelist,
  };
}

// Returns null when the artist has no pricelist yet, which the route reports as
// 409 NoPricelist. A window without prices could not quote anything, so this is
// a real precondition rather than a validation error.
export async function open(input) {
  const current = await pricelist.get(input.artistId);
  if (!current) return null;

  const { rows } = await query(
    `INSERT INTO commission_windows
         (id, artist_id, title, slot_count, opens_at, closes_at, pricelist)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [
      newId('win'),
      input.artistId,
      input.title,
      input.slotCount,
      input.opensAt.toISOString(),
      input.closesAt.toISOString(),
      JSON.stringify(pricelist.snapshot(current)),
    ],
  );
  return rows[0];
}

export async function byId(windowId) {
  const { rows } = await query('SELECT * FROM commission_windows WHERE id = $1', [windowId]);
  return rows[0] ?? null;
}
