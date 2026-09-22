// Applies db/schema.sql to payments' own database.
//
// The schema is idempotent (CREATE TABLE IF NOT EXISTS), so running this
// twice is harmless.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const dbDir = join(here, '..', 'db');

async function run(file) {
  const sql = await readFile(join(dbDir, file), 'utf8');
  await pool.query(sql);
  console.log(`[payments] applied ${file}`);
}

try {
  await run('schema.sql');
  console.log('[payments] database ready');
} catch (err) {
  console.error(`[payments] migration failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
