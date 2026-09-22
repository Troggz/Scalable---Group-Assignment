// Step 16 of the demo: the DP deadline releases a kept slot.
//
// Restart booking with a deadline short enough to watch before running this:
//
//     DP_DEADLINE_MINUTES=0 EXPIRY_SWEEP_SECONDS=3 npm start   (in services/booking)
//     node client/expiry.mjs
//
// Two things are being shown, and the second matters more than the first.
//
//   A. A client who accepts and then goes quiet does not hold the slot forever.
//      Eja described exactly this: "ada yang bilang mau, terus ilang."
//
//   B. A DP that lands at the last second KEEPS the slot. The sweep voids the
//      invoice before it releases anything, and payments refuses to void an
//      invoice that was already settled (409 AlreadyPaid). So payments -- the
//      service that actually knows whether money arrived -- decides the race,
//      and booking never gives away a slot that was paid for.

const BOOKING = process.env.BOOKING_URL ?? 'http://localhost:3001';
const PAYMENTS = process.env.PAYMENTS_URL ?? 'http://localhost:3002';

let pass = 0, fail = 0;

// The window has to be open NOW, not on a date that has drifted into the past
// or the future since this was written. A window that has not opened yet
// refuses requests with 409 WindowNotOpen, which looks like a bug and is not.
const OPENS_AT = new Date(Date.now() - 60_000).toISOString();
const CLOSES_AT = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  PASS ${name}${detail ? ` -- ${detail}` : ''}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ` -- ${detail}` : ''}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await call('PUT', `${BOOKING}/artists/rara/pricelist`, {
  tiers: [{ code: 'HALF_BODY', name: 'Half body', startFromIDR: 250000 }],
  addOns: [{ code: 'BG', name: 'Background', priceIDR: 50000 }],
  depositPercent: 50,
  revisionLimit: 2,
});

async function openWindow(title) {
  const w = await call('POST', `${BOOKING}/windows`, {
    artistId: 'rara', title, slotCount: 1,
    opensAt: OPENS_AT, closesAt: CLOSES_AT,
  });
  return w.body.windowId;
}
async function requestAndAccept(windowId, clientId) {
  const r = await call('POST', `${BOOKING}/windows/${windowId}/requests`, {
    clientId, tier: 'HALF_BODY', brief: `Expiry demo for ${clientId}`,
  });
  const a = await call('POST', `${BOOKING}/requests/${r.body.requestId}/accept`, { quoteIDR: 350000 });
  return { requestId: r.body.requestId, invoiceId: a.body.depositInvoiceId };
}

// ---------------------------------------------------------------------------
console.log('\n[A] a slot kept by a client who never pays');
// ---------------------------------------------------------------------------
const windowA = await openWindow('DP deadline demo A');
const budi = await requestAndAccept(windowA, 'budi');
check('the single slot is kept',
  (await call('GET', `${BOOKING}/windows/${windowA}`)).body.slotsLeft === 0);

// Sari wants the same slot and cannot have it -- yet.
const sariRequest = await call('POST', `${BOOKING}/windows/${windowA}/requests`, {
  clientId: 'sari', tier: 'HALF_BODY', brief: 'Waiting for a slot',
});
const sariBlocked = await call('POST', `${BOOKING}/requests/${sariRequest.body.requestId}/accept`, { quoteIDR: 350000 });
check('sari is refused while budi holds it', sariBlocked.status === 409,
  `${sariBlocked.status} ${sariBlocked.body.error}`);

console.log('  waiting for the deadline to pass and the sweep to run...');
let expired;
for (let i = 0; i < 40; i++) {
  expired = await call('GET', `${BOOKING}/requests/${budi.requestId}`);
  if (expired.body.status === 'EXPIRED') break;
  await sleep(1000);
}
check('budi\'s request is EXPIRED', expired.body.status === 'EXPIRED', `status=${expired.body.status}`);
check('the slot came back',
  (await call('GET', `${BOOKING}/windows/${windowA}`)).body.slotsLeft === 1);
check('payments voided the unpaid invoice',
  (await call('GET', `${PAYMENTS}/invoices/${budi.invoiceId}`)).body.status === 'VOID');

const sariRetry = await call('POST', `${BOOKING}/requests/${sariRequest.body.requestId}/accept`, { quoteIDR: 350000 });
check('sari can now take the released slot', sariRetry.status === 200, `${sariRetry.status}`);

// ---------------------------------------------------------------------------
console.log('\n[B] a DP that lands at the last second keeps its slot');
// ---------------------------------------------------------------------------
const windowB = await openWindow('DP deadline demo B');
const dimas = await requestAndAccept(windowB, 'dimas');
await call('POST', `${PAYMENTS}/provider/callbacks`, {
  providerRef: `PROV-LASTSECOND-${Date.now()}`,
  invoiceId: dimas.invoiceId, amountIDR: 175000, status: 'SETTLED',
});
console.log('  paid. Now sitting through several sweeps, which must leave it alone...');
await sleep(12_000);

const stillBooked = await call('GET', `${BOOKING}/requests/${dimas.requestId}`);
check('the paid request is BOOKED, never EXPIRED', stillBooked.body.status === 'BOOKED',
  `status=${stillBooked.body.status}`);
check('the slot stays taken',
  (await call('GET', `${BOOKING}/windows/${windowB}`)).body.slotsLeft === 0);
check('the invoice is still PAID, not voided',
  (await call('GET', `${PAYMENTS}/invoices/${dimas.invoiceId}`)).body.status === 'PAID');

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'}: ${pass} passed, ${fail} failed`);
process.exitCode = fail === 0 ? 0 : 1;
