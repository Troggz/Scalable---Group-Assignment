// Everything payments needs from its environment, in one place.
//
// Note what is NOT here: any URL for booking or studio. Payments only ever
// calls the notifyUrl each invoice was created with, and boots with only its
// own database available (see README "Must not").

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
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number, got "${raw}"`);
  }
  return parsed;
}

export const config = {
  port: number('PORT', 3002),
  databaseUrl: required('DATABASE_URL'),

  // How often an undelivered InvoicePaid notification is retried.
  notifyRetrySeconds: number('NOTIFY_RETRY_SECONDS', 5),
};

if (missing.length > 0) {
  console.error(
    `[payments] missing required environment variable(s): ${missing.join(', ')}\n` +
    `           copy .env.example to .env and fill it in`,
  );
  process.exit(1);
}
