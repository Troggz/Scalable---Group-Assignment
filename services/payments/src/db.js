// The one place payments talks to its own database.
//
// The pool connects lazily, so the service starts even when PostgreSQL is not
// up yet; /health reports the database as down until it is.

import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// An idle client failing must not take the process down with it.
pool.on('error', (err) => {
  console.error('[payments] idle client error:', err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

// Runs fn inside a transaction, rolling back on any throw.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function ping() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}
