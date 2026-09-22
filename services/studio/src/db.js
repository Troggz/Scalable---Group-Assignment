// The one place Studio talks to its own database.
// The lazy pool lets the service boot before PostgreSQL; /health then reports
// whether the database is ready, satisfying the independent-start requirement.

import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// An idle client failing must not take the HTTP process down.
pool.on('error', (err) => console.error('[studio] idle client error:', err.message));

export function query(text, params) {
  return pool.query(text, params);
}

export async function ping() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}
