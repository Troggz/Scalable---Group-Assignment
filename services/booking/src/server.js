// booking -- HTTP surface. Every route here must match
// contracts/booking.openapi.yaml; the contract is the specification, not this file.

import express from 'express';
import { config } from './config.js';
import { pool, ping } from './db.js';
import { InvalidInput } from './http.js';
import { pricelistRoutes } from './routes/pricelist.js';
import { windowRoutes } from './routes/windows.js';
import { requestRoutes } from './routes/requests.js';
import { notificationRoutes } from './routes/notifications.js';
import { startExpirySweep } from './expiry.js';

const app = express();
app.use(express.json({ limit: '128kb' }));

// Not in the contract. For humans and for the screencast, so it is visible which
// services are up while only one of them is restarted (requirement B4).
app.get('/health', async (_req, res) => {
  let database = 'up';
  try {
    await ping();
  } catch {
    database = 'down';
  }
  res.status(database === 'up' ? 200 : 503).json({
    service: 'booking',
    database,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.use(pricelistRoutes);
app.use(windowRoutes);
app.use(requestRoutes);
app.use(notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `No route for ${req.method} ${req.path}`,
  });
});

// Every error leaves in the shape the contract promises: { error, message }.
// `error` is a stable code; `message` is for humans and may change.
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(422).json({ error: 'InvalidInput', message: 'Body is not valid JSON' });
  }

  if (err instanceof InvalidInput) {
    // The contract names UnknownTier and UnknownAddOn as their own 422 codes;
    // anything else that fails validation is InvalidInput.
    const [head, ...rest] = err.message.split(':');
    const named = ['UnknownTier', 'UnknownAddOn', 'QuoteBelowListPrice'];
    const matched = named.includes(head);
    return res.status(422).json({
      error: matched ? head : 'InvalidInput',
      message: (matched ? rest.join(':').trim() : err.message),
    });
  }

  console.error('[booking]', err);
  res.status(500).json({ error: 'Internal', message: 'Unexpected error' });
});

const server = app.listen(config.port, () => {
  console.log(`[booking] listening on :${config.port}`);
  console.log(`[booking] payments at ${config.paymentsUrl}, studio at ${config.studioUrl}`);
  console.log(`[booking] DP deadline ${config.dpDeadlineMinutes} min, ` +
    `expiry sweep every ${config.expirySweepSeconds}s`);
});

const stopExpirySweep = startExpirySweep();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[booking] ${signal}, shutting down`);
    stopExpirySweep();
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
  });
}
