// studio -- HTTP surface. Every route here must match
// contracts/studio.openapi.yaml; the contract is the specification, not this file.

import express from 'express';
import { config } from './config.js';
import { pool, ping } from './db.js';
import { InvalidInput } from './http.js';
import { commissionRoutes } from './routes/commissions.js';
import { notificationRoutes } from './routes/notifications.js';

const app = express();
app.use(express.json({ limit: '128kb' }));
app.get('/health', async (_req, res) => {
  let database = 'up';
  try { await ping(); } catch { database = 'down'; }
  res.status(database === 'up' ? 200 : 503).json({ service: 'studio', database, uptimeSeconds: Math.round(process.uptime()) });
});
// Keep the Payment notification endpoint separate from the artist/client flow.
app.use(commissionRoutes);
app.use(notificationRoutes);
app.use((req, res) => res.status(404).json({
  error: 'NotFound',
  message: `No route for ${req.method} ${req.path}`,
}));

// Every error leaves in the shared { error, message } shape. `error` is stable
// for callers; `message` is for a human and can change without breaking them.
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(422).json({ error: 'InvalidInput', message: 'Body is not valid JSON' });
  if (err instanceof InvalidInput) return res.status(422).json({ error: 'InvalidInput', message: err.message });
  console.error('[studio]', err);
  return res.status(500).json({ error: 'Internal', message: 'Unexpected error' });
});

const server = app.listen(config.port, () => console.log(`[studio] listening on :${config.port}, payments at ${config.paymentsUrl}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(async () => { await pool.end().catch(() => {}); process.exit(0); }));
}
