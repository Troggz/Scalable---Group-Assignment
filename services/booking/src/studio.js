// The only place booking talks to studio. HTTP, through the contract, never
// into studio_db.

import { config } from './config.js';

export class StudioUnavailable extends Error {
  constructor(message) {
    super(message);
    this.name = 'StudioUnavailable';
  }
}

const TIMEOUT_MS = 5_000;

// POST /commissions. Idempotent on bookingRef: a repeat returns the existing
// commission with 200, which is what lets payments retry a notification without
// queueing the same job twice.
export async function queueCommission(booked) {
  let res;
  try {
    res = await fetch(`${config.studioUrl}/commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booked),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new StudioUnavailable(`cannot reach studio at ${config.studioUrl}: ${err.message}`);
  }

  if (res.status >= 500 || res.status === 429) {
    throw new StudioUnavailable(`studio returned ${res.status}`);
  }
  if (res.status !== 200 && res.status !== 201) {
    const body = await res.text().catch(() => '');
    throw new Error(`studio rejected the commission (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json();
}
