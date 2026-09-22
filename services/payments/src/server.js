// payments -- HTTP surface. Every route here must match
// contracts/payments.openapi.yaml; the contract is the specification, not this file.

import express from 'express';
import { config } from './config.js';
import { pool, ping } from './db.js';
import { InvalidInput } from './http.js';
import { invoiceRoutes } from './routes/invoices.js';
import { providerRoutes } from './routes/provider.js';
import { startNotifier } from './notifier.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

// Not in the contract. For humans, so it is visible whether payments is up
// independently of booking or studio (requirement B4).
app.get('/health', async (_req, res) => {
  let database = 'up';
  try {
    await ping();
  } catch {
    database = 'down';
  }
  res.status(database === 'up' ? 200 : 503).json({
    service: 'payments',
    database,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.use(invoiceRoutes);
app.use(providerRoutes);

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
    // The contract names AmountMismatch as its own 422 code; anything else
    // that fails validation is InvalidInput.
    const [head, ...rest] = err.message.split(':');
    const named = ['AmountMismatch'];
    const matched = named.includes(head);
    return res.status(422).json({
      error: matched ? head : 'InvalidInput',
      message: (matched ? rest.join(':').trim() : err.message),
    });
  }

  console.error('[payments]', err);
  res.status(500).json({ error: 'Internal', message: 'Unexpected error' });
});

const stopNotifier = startNotifier();

const server = app.listen(config.port, () => {
  console.log(`[payments] listening on :${config.port}`);
  console.log(`[payments] retrying undelivered InvoicePaid every ${config.notifyRetrySeconds}s`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[payments] ${signal}, shutting down`);
    stopNotifier();
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
  });
}
