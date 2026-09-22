// The Pricelist module.
//
// It stays a module inside booking rather than becoming a fourth service, which
// is how the assignment's three-service limit is spent on the things that
// actually need to be deployed separately.
//
// Everything else in booking goes through these functions. Nothing else in this
// service touches the `pricelists` table, so that the rules below -- what a tier
// costs, what counts as a valid add-on -- have exactly one home.

import { query } from './db.js';
import {
  InvalidInput, requireArray, requireInteger, requireObject, requireString,
} from './http.js';

function parseItems(raw, field, priceField, { min }) {
  const items = requireArray(raw, field, { maxItems: 50 });
  const seen = new Set();

  return items.map((item, i) => {
    requireObject(item);
    const code = requireString(item.code, `${field}[${i}].code`, { maxLength: 64 });
    if (seen.has(code)) throw new InvalidInput(`${field} has a duplicate code "${code}"`);
    seen.add(code);

    return {
      code,
      name: requireString(item.name, `${field}[${i}].name`, { maxLength: 200 }),
      [priceField]: requireInteger(item[priceField], `${field}[${i}].${priceField}`, { min }),
    };
  });
}

// Validates a PricelistInput and returns it normalised. Throws InvalidInput.
export function parseInput(body) {
  requireObject(body);

  const tiers = parseItems(body.tiers, 'tiers', 'startFromIDR', { min: 1 });
  if (tiers.length < 1) throw new InvalidInput('tiers must have at least 1 item');

  return {
    tiers,
    addOns: parseItems(body.addOns ?? [], 'addOns', 'priceIDR', { min: 0 }),
    depositPercent: requireInteger(body.depositPercent, 'depositPercent', { min: 1, max: 100 }),
    revisionLimit: requireInteger(body.revisionLimit, 'revisionLimit', { min: 0 }),
  };
}

function toApi(row) {
  return {
    artistId: row.artist_id,
    tiers: row.tiers,
    addOns: row.add_ons,
    depositPercent: row.deposit_percent,
    revisionLimit: row.revision_limit,
    publishedAt: row.published_at.toISOString(),
  };
}

// Publishing replaces the artist's current pricelist and bumps an internal
// version. Windows already open are untouched: each holds its own snapshot,
// so a price change tomorrow cannot move a quote agreed today.
export async function publish(artistId, input) {
  const { rows } = await query(
    `INSERT INTO pricelists
         (artist_id, tiers, add_ons, deposit_percent, revision_limit, published_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, now())
     ON CONFLICT (artist_id) DO UPDATE
        SET tiers           = EXCLUDED.tiers,
            add_ons         = EXCLUDED.add_ons,
            deposit_percent = EXCLUDED.deposit_percent,
            revision_limit  = EXCLUDED.revision_limit,
            published_at    = now(),
            version         = pricelists.version + 1
      RETURNING *`,
    [
      artistId,
      JSON.stringify(input.tiers),
      JSON.stringify(input.addOns),
      input.depositPercent,
      input.revisionLimit,
    ],
  );
  return toApi(rows[0]);
}

export async function get(artistId) {
  const { rows } = await query('SELECT * FROM pricelists WHERE artist_id = $1', [artistId]);
  return rows[0] ? toApi(rows[0]) : null;
}

// The snapshot a window carries. Same shape as the API pricelist minus the
// identity fields, because a window's prices are a copy, not a reference.
export function snapshot(pricelist) {
  return {
    tiers: pricelist.tiers,
    addOns: pricelist.addOns,
    depositPercent: pricelist.depositPercent,
    revisionLimit: pricelist.revisionLimit,
  };
}

// Start-from price for a tier plus its add-ons, against a window's snapshot.
// Throws InvalidInput for a tier or add-on the snapshot does not contain, which
// the request route reports as 422 UnknownTier / UnknownAddOn.
export function listPriceIDR(snap, tierCode, addOnCodes = []) {
  const tier = snap.tiers.find((t) => t.code === tierCode);
  if (!tier) throw new InvalidInput(`UnknownTier: ${tierCode}`);

  let total = tier.startFromIDR;
  const addOns = [];

  for (const code of addOnCodes) {
    const addOn = snap.addOns.find((a) => a.code === code);
    if (!addOn) throw new InvalidInput(`UnknownAddOn: ${code}`);
    total += addOn.priceIDR;
    addOns.push({ code: addOn.code, name: addOn.name });
  }

  return { listPriceIDR: total, tier: { code: tier.code, name: tier.name }, addOns };
}
