// booking -- HTTP surface. Every route here must match
// contracts/booking.openapi.yaml; the contract is the specification, not this file.

import express from 'express';
import { config } from './config.js';
import { pool, ping } from './db.js';

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

// ---------------------------------------------------------------------------
// Routes, one module per resource, added as each is implemented:
//
//   PUT  /artists/{artistId}/pricelist
//   GET  /artists/{artistId}/pricelist
//   POST /windows
//   GET  /windows/{windowId}
//   POST /windows/{windowId}/requests      <- the hard rule lives behind this
//   GET  /requests/{requestId}
//   POST /requests/{requestId}/accept
//   POST /requests/{requestId}/decline
//   POST /payment-notifications            <- must be idempotent
// ---------------------------------------------------------------------------

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
  console.error('[booking]', err);
  res.status(500).json({ error: 'Internal', message: 'Unexpected error' });
});

const server = app.listen(config.port, () => {
  console.log(`[booking] listening on :${config.port}`);
  console.log(`[booking] payments at ${config.paymentsUrl}, studio at ${config.studioUrl}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[booking] ${signal}, shutting down`);
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
  });
}
