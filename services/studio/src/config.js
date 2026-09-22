// Everything Studio needs from its environment, in one place.
//
// Note what is NOT here: connection details for booking_db or payments_db.
// Studio knows its neighbours only by an HTTP base URL.

const missing = [];

function required(name) {
  const value = process.env[name];
  if (!value) missing.push(name);
  return value;
}

function number(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number, got "${raw}"`);
  return parsed;
}

const port = number('PORT', 3003);

export const config = {
  port,
  databaseUrl: required('DATABASE_URL'),
  paymentsUrl: process.env.PAYMENTS_URL ?? 'http://localhost:3002',
  // Given to Payments as notifyUrl so InvoicePaid can return to this service.
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${port}`,
};

if (missing.length > 0) {
  console.error(`[studio] missing required environment variable(s): ${missing.join(', ')}\n` +
    '         copy .env.example to .env and fill it in');
  process.exit(1);
}
