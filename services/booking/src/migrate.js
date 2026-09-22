// Applies db/schema.sql to booking's own database, then optionally db/seed.sql.
//
//   npm run migrate          schema only
//   npm run migrate -- seed  schema, then seed data
//
// The schema is idempotent (CREATE TABLE IF NOT EXISTS), so running this twice
// is harmless. Requirement B6 is checked by cloning the repo and following the
// README, so this has to work on an empty database with no manual steps.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const dbDir = join(here, '..', 'db');

async function run(file) {
  const sql = await readFile(join(dbDir, file), 'utf8');
  await pool.query(sql);
  console.log(`[booking] applied ${file}`);
}

try {
  await run('schema.sql');
  if (process.argv.includes('seed')) await run('seed.sql');
  console.log('[booking] database ready');
} catch (err) {
  console.error(`[booking] migration failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
