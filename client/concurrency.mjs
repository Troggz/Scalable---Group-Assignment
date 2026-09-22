// Step 6 of the demo: the hard rule under load.
//
// This is the one step demo.http cannot do. A request-at-a-time client sends
// twenty accepts one after another, and twenty accepts one after another will
// pass even against a read-then-write implementation that is completely wrong.
// The bug only appears when they are genuinely in flight together.
//
//   node client/concurrency.mjs
//
// Expect exactly 3 x 200 and 17 x 409 on a fresh 3-slot window. Anything else
// -- 4 accepted, or a 500 from the capacity CHECK firing -- is the hard rule
// broken, and a demo that passes because the database refused the oversell is
// still a failure: the UPDATE should not have matched a row in the first place.

const BOOKING = process.env.BOOKING_URL ?? 'http://localhost:3001';
const SLOTS = 3;
const CONTENDERS = 20;

// The window has to be open NOW, not on a date that has drifted into the past
// or the future since this was written. A window that has not opened yet
// refuses requests with 409 WindowNotOpen, which looks like a bug and is not.
const OPENS_AT = new Date(Date.now() - 60_000).toISOString();
const CLOSES_AT = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();

async function call(method, path, body) {
  const res = await fetch(BOOKING + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// The pricelist the window will snapshot.
await call('PUT', '/artists/rara/pricelist', {
  tiers: [{ code: 'HALF_BODY', name: 'Half body', startFromIDR: 250000 }],
  addOns: [{ code: 'BG', name: 'Background', priceIDR: 50000 }],
  depositPercent: 50,
  revisionLimit: 2,
});

const window = await call('POST', '/windows', {
  artistId: 'rara',
  title: `Concurrency check ${new Date().toISOString()}`,
  slotCount: SLOTS,
  opensAt: OPENS_AT,
  closesAt: CLOSES_AT,
});
const windowId = window.body.windowId;
console.log(`window ${windowId} with ${SLOTS} slots`);

// Submitting is not the contended part, so these go in one at a time.
const requestIds = [];
for (let i = 0; i < CONTENDERS; i++) {
  const r = await call('POST', `/windows/${windowId}/requests`, {
    clientId: `client${String(i).padStart(2, '0')}`,
    tier: 'HALF_BODY',
    brief: `Contender ${i}`,
  });
  requestIds.push(r.body.requestId);
}
console.log(`${requestIds.length} requests submitted, slotsLeft still ` +
  `${(await call('GET', `/windows/${windowId}`)).body.slotsLeft}`);

// ---- the contended part: every accept leaves at the same moment ------------
console.log(`\nsending ${CONTENDERS} accepts at once...`);
const started = Date.now();
const results = await Promise.all(
  requestIds.map((id) => call('POST', `/requests/${id}/accept`, { quoteIDR: 350000 })),
);
const elapsed = Date.now() - started;

const accepted = results.filter((r) => r.status === 200);
const refused = results.filter((r) => r.status === 409);
const other = results.filter((r) => r.status !== 200 && r.status !== 409);

console.log(`\n  ${accepted.length} x 200 accepted`);
console.log(`  ${refused.length} x 409 refused` +
  (refused.length ? ` (${refused[0].body.error}: ${refused[0].body.message})` : ''));
if (other.length) {
  console.log(`  ${other.length} x other -- ${JSON.stringify(other[0])}`);
}
console.log(`  in ${elapsed}ms`);

const after = await call('GET', `/windows/${windowId}`);
console.log(`  window now: slotsLeft ${after.body.slotsLeft}, status ${after.body.status}`);

const ok = accepted.length === SLOTS && refused.length === CONTENDERS - SLOTS && other.length === 0;
console.log(`\n${ok ? 'PASS' : 'FAIL'}: expected exactly ${SLOTS} x 200 and ` +
  `${CONTENDERS - SLOTS} x 409, got ${accepted.length} and ${refused.length}`);
process.exitCode = ok ? 0 : 1;
