// Everything booking needs from its environment, in one place.
//
// Note what is NOT here: any connection detail for payments_db or studio_db.
// Booking knows its neighbours only by their HTTP base URL, which is what
// requirement B2 is checking for.

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

const port = number('PORT', 3001);

export const config = {
  port,
  databaseUrl: required('DATABASE_URL'),
  paymentsUrl: process.env.PAYMENTS_URL ?? 'http://localhost:3002',
  studioUrl: process.env.STUDIO_URL ?? 'http://localhost:3003',

  // Used to build the notifyUrl we hand to payments, so it can call us back.
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${port}`,

  // How long an accepted request waits for its DP before expiring.
  // Real: 1440 (1x24 hours). Demo: a few minutes, so the screencast is watchable.
  dpDeadlineMinutes: number('DP_DEADLINE_MINUTES', 1440),

  // How often the expiry sweep looks for overdue deposits. The deadline is what
  // matters; this only decides how soon after it the slot comes back.
  expirySweepSeconds: number('EXPIRY_SWEEP_SECONDS', 30),
};

if (missing.length > 0) {
  console.error(
    `[booking] missing required environment variable(s): ${missing.join(', ')}\n` +
    `          copy .env.example to .env and fill it in`,
  );
  process.exit(1);
}
