// Applies db/schema.sql to Studio's own database.
//
// The schema is idempotent (CREATE TABLE IF NOT EXISTS), so a clean clone and a
// repeated local run both work without manual database changes.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
try {
  await pool.query(await readFile(join(here, '..', 'db', 'schema.sql'), 'utf8'));
  console.log('[studio] database ready');
} catch (err) {
  console.error(`[studio] migration failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
