// Small helpers so every response leaves in the shape the contract promises.

import { randomBytes } from 'node:crypto';

// Opaque ids. The prefix helps a human reading a log; consumers must never parse
// one, and contracts/booking.openapi.yaml says so. That is what lets us change
// the scheme later without breaking anybody.
export function newId(prefix) {
  return `${prefix}_${randomBytes(9).toString('base64url')}`;
}

// `error` is a stable code listed in the contract; `message` is for humans and
// may change. Nothing else belongs in an error body.
export function fail(res, status, error, message) {
  return res.status(status).json({ error, message });
}

// Thrown by anything that validates input; the route turns it into a 422.
export class InvalidInput extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidInput';
  }
}

// Lets a route be written as a plain async function without every one of them
// needing its own try/catch around the await.
export function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

export function requireObject(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new InvalidInput('body must be a JSON object');
  }
  return body;
}

export function requireString(value, field, { maxLength = 4000 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidInput(`${field} must be a non-empty string`);
  }
  if (value.length > maxLength) {
    throw new InvalidInput(`${field} must be at most ${maxLength} characters`);
  }
  return value;
}

export function requireInteger(value, field, { min, max } = {}) {
  if (!Number.isInteger(value)) {
    throw new InvalidInput(`${field} must be an integer`);
  }
  if (min !== undefined && value < min) {
    throw new InvalidInput(`${field} must be at least ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new InvalidInput(`${field} must be at most ${max}`);
  }
  return value;
}

// RFC 3339 with an offset, per the shared conventions in contracts/README.md.
export function requireTimestamp(value, field) {
  requireString(value, field, { maxLength: 64 });
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new InvalidInput(`${field} must be an RFC 3339 timestamp`);
  }
  return new Date(parsed);
}

export function requireArray(value, field, { minItems = 0, maxItems = 1000 } = {}) {
  if (!Array.isArray(value)) throw new InvalidInput(`${field} must be an array`);
  if (value.length < minItems) {
    throw new InvalidInput(`${field} must have at least ${minItems} item(s)`);
  }
  if (value.length > maxItems) {
    throw new InvalidInput(`${field} must have at most ${maxItems} items`);
  }
  return value;
}
