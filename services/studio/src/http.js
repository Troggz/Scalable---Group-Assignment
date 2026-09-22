// Small helpers local to Studio. They follow shared contract conventions
// without importing a shared entity/helper package from another service.

import { randomBytes } from 'node:crypto';

// Opaque IDs may have a readable prefix for logs, but consumers must not parse it.
export function newId(prefix) { return `${prefix}_${randomBytes(9).toString('base64url')}`; }
// `error` is stable for clients; `message` is only human-readable context.
export function fail(res, status, error, message) { return res.status(status).json({ error, message }); }
export class InvalidInput extends Error {}
export function route(handler) { return (req, res, next) => Promise.resolve(handler(req, res)).catch(next); }

export function requireObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new InvalidInput('body must be a JSON object');
  return value;
}
export function requireString(value, field, { maxLength = 4000 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') throw new InvalidInput(`${field} must be a non-empty string`);
  if (value.length > maxLength) throw new InvalidInput(`${field} must be at most ${maxLength} characters`);
  return value;
}
export function requireInteger(value, field, { min, max } = {}) {
  if (!Number.isInteger(value)) throw new InvalidInput(`${field} must be an integer`);
  if (min !== undefined && value < min) throw new InvalidInput(`${field} must be at least ${min}`);
  if (max !== undefined && value > max) throw new InvalidInput(`${field} must be at most ${max}`);
  return value;
}
export function requireArray(value, field, { maxItems = 1000 } = {}) {
  if (!Array.isArray(value)) throw new InvalidInput(`${field} must be an array`);
  if (value.length > maxItems) throw new InvalidInput(`${field} must have at most ${maxItems} item(s)`);
  return value;
}
export function requireUrl(value, field) {
  requireString(value, field, { maxLength: 2000 });
  try { return new URL(value).toString(); } catch { throw new InvalidInput(`${field} must be a valid URL`); }
}
export function requireTimestamp(value, field) {
  requireString(value, field, { maxLength: 64 });
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new InvalidInput(`${field} must be an RFC 3339 timestamp`);
  return new Date(parsed);
}
