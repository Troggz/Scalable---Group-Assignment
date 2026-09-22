// The whole main flow, asserted, in one command:
//
//     node client/flow.mjs
//
// demo.http is the client a human drives during the demo. This is the same
// steps with the expected answers written down, so that after anyone changes
// anything, one command says whether the flow still crosses all three services.
// Steps 6 and 16 live in their own scripts -- they need concurrency and a
// restarted booking, which do not belong in a straight-through run.

const BOOKING = process.env.BOOKING_URL ?? 'http://localhost:3001';
const PAYMENTS = process.env.PAYMENTS_URL ?? 'http://localhost:3002';
const STUDIO = process.env.STUDIO_URL ?? 'http://localhost:3003';

let pass = 0, fail = 0;
const state = {};

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

// Waits for something a neighbouring service does in the background, so the
// run does not depend on how fast a retry sweep happens to fire.
async function eventually(what, get, done, seconds = 15) {
  for (let i = 0; i < seconds * 2; i++) {
    const r = await get();
    if (done(r)) return r;
    await sleep(500);
  }
  console.log(`  (gave up waiting for ${what} after ${seconds}s)`);
  return get();
}

console.log('[0] all three services answering');
for (const [name, url] of [['booking', BOOKING], ['payments', PAYMENTS], ['studio', STUDIO]]) {
  const h = await call('GET', `${url}/health`);
  check(`${name} is up`, h.status === 200, `database ${h.body.database}`);
}
if (fail > 0) {
  console.log('\nStart all three services first -- see the root README.');
  process.exit(1);
}

console.log('\n[1] the artist publishes a pricelist');
{
  const r = await call('PUT', `${BOOKING}/artists/rara/pricelist`, {
    tiers: [{ code: 'HALF_BODY', name: 'Half body', startFromIDR: 250000 },
            { code: 'FULL_BODY', name: 'Full body', startFromIDR: 400000 }],
    addOns: [{ code: 'BG', name: 'Background', priceIDR: 50000 }],
    depositPercent: 50, revisionLimit: 2,
  });
  check('200', r.status === 200, `got ${r.status}`);
}

console.log('\n[2] a window with three slots');
{
  const r = await call('POST', `${BOOKING}/windows`, {
    artistId: 'rara', title: 'October open comm', slotCount: 3,
    opensAt: OPENS_AT, closesAt: CLOSES_AT,
  });
  check('201 with slotsLeft 3', r.status === 201 && r.body.slotsLeft === 3,
    `${r.status} slotsLeft=${r.body.slotsLeft}`);
  state.window = r.body.windowId;
}

console.log('\n[3] four requests -- and a request holds nothing');
{
  state.req = {};
  for (const c of ['budi', 'sari', 'dimas', 'ayu']) {
    const r = await call('POST', `${BOOKING}/windows/${state.window}/requests`, {
      clientId: c, tier: 'HALF_BODY', addOns: ['BG'], brief: `Half body, dark background, ${c}`,
    });
    check(`${c} accepted for consideration`, r.status === 201, `${r.status}`);
    state.req[c] = r.body.requestId;
  }
  const w = await call('GET', `${BOOKING}/windows/${state.window}`);
  check('slotsLeft is STILL 3', w.body.slotsLeft === 3, `slotsLeft=${w.body.slotsLeft}`);
}

console.log('\n[4] the artist accepts three -- booking calls payments');
{
  for (const c of ['budi', 'sari', 'dimas']) {
    const r = await call('POST', `${BOOKING}/requests/${state.req[c]}/accept`, { quoteIDR: 350000 });
    check(`${c}: 200, DP 175000, invoice issued`,
      r.status === 200 && r.body.depositIDR === 175000 && !!r.body.depositInvoiceId,
      `${r.status} deposit=${r.body.depositIDR} invoice=${r.body.depositInvoiceId}`);
    if (c === 'budi') state.budiInvoice = r.body.depositInvoiceId;
  }
  const w = await call('GET', `${BOOKING}/windows/${state.window}`);
  check('slotsLeft 0, window FULL', w.body.slotsLeft === 0, `slotsLeft=${w.body.slotsLeft} status=${w.body.status}`);
}

console.log('\n[5] THE HARD RULE: the fourth accept is refused');
{
  const r = await call('POST', `${BOOKING}/requests/${state.req.ayu}/accept`, { quoteIDR: 450000 });
  check('409 SlotsFull', r.status === 409 && r.body.error === 'SlotsFull',
    `${r.status} ${r.body.error}: ${r.body.message}`);
}

console.log('\n[6] under load -- see client/concurrency.mjs');

console.log('\n[7] budi pays the DP');
{
  state.providerRef = `PROV-FLOW-DP-${Date.now()}`;
  const r = await call('POST', `${PAYMENTS}/provider/callbacks`, {
    providerRef: state.providerRef, invoiceId: state.budiInvoice, amountIDR: 175000, status: 'SETTLED',
  });
  check('200 applied true', r.status === 200 && r.body.applied === true, JSON.stringify(r.body));
}

console.log('\n[8] EXACTLY ONCE: the identical callback again');
{
  const r = await call('POST', `${PAYMENTS}/provider/callbacks`, {
    providerRef: state.providerRef, invoiceId: state.budiInvoice, amountIDR: 175000, status: 'SETTLED',
  });
  check('200 applied false', r.status === 200 && r.body.applied === false, JSON.stringify(r.body));
}

console.log('\n[9] payments -> booking -> studio, with nobody asking');
{
  const r = await eventually('the booking to reach studio',
    () => call('GET', `${BOOKING}/requests/${state.req.budi}`),
    (r) => r.body.status === 'BOOKED' && !!r.body.commissionId);
  check('BOOKED with a commissionId', r.body.status === 'BOOKED' && !!r.body.commissionId,
    `status=${r.body.status} commissionId=${r.body.commissionId}`);
  state.commission = r.body.commissionId;

  const queue = await call('GET', `${STUDIO}/artists/rara/queue`);
  check('it is in the artist queue', queue.status === 200 &&
    JSON.stringify(queue.body).includes(state.commission));
}

console.log('\n[10] sketch, then the client approves it');
{
  const s = await call('POST', `${STUDIO}/commissions/${state.commission}/sketch`,
    { sketchUrl: 'https://files.example/sketch-1.png' });
  check('SKETCH_REVIEW', s.status === 200 && s.body.status === 'SKETCH_REVIEW', `${s.status} ${s.body.status}`);
  const a = await call('POST', `${STUDIO}/commissions/${state.commission}/sketch/approve`, {});
  check('IN_PROGRESS', a.status === 200 && a.body.status === 'IN_PROGRESS', `${a.status} ${a.body.status}`);
}

console.log('\n[11] the final is sent -- and the hi-res file is withheld');
{
  const r = await call('POST', `${STUDIO}/commissions/${state.commission}/final`, {
    previewUrl: 'https://files.example/preview-watermarked.png',
    finalFileUrl: 'https://files.example/final-hires.png',
  });
  check('AWAITING_BALANCE with a remainder invoice',
    r.status === 200 && r.body.status === 'AWAITING_BALANCE' &&
    !!r.body.remainderInvoiceId && r.body.balanceDueIDR === 175000,
    `${r.body.status} balanceDue=${r.body.balanceDueIDR}`);
  check('finalFileUrl is NOT in the response', !r.body.finalFileUrl,
    r.body.finalFileUrl ? 'LEAKED: ' + r.body.finalFileUrl : 'withheld');
  state.remainderInvoice = r.body.remainderInvoiceId;
}

console.log('\n[12] budi pays the rest');
{
  const r = await call('POST', `${PAYMENTS}/provider/callbacks`, {
    providerRef: `PROV-FLOW-BAL-${Date.now()}`,
    invoiceId: state.remainderInvoice, amountIDR: 175000, status: 'SETTLED',
  });
  check('200 applied true', r.status === 200 && r.body.applied === true, JSON.stringify(r.body));
}

console.log('\n[13] payments -> studio releases the file');
{
  const r = await eventually('studio to release the file',
    () => call('GET', `${STUDIO}/commissions/${state.commission}`),
    (r) => r.body.status === 'COMPLETED' && !!r.body.finalFileUrl);
  check('COMPLETED with finalFileUrl', r.body.status === 'COMPLETED' && !!r.body.finalFileUrl,
    `status=${r.body.status} file=${r.body.finalFileUrl}`);
}

console.log('\n[14] declining frees nothing, because nothing was held');
{
  const before = await call('GET', `${BOOKING}/windows/${state.window}`);
  const d = await call('POST', `${BOOKING}/requests/${state.req.ayu}/decline`, { reason: 'Not my style' });
  check('200 DECLINED', d.status === 200 && d.body.status === 'DECLINED', `${d.status} ${d.body.status}`);
  const after = await call('GET', `${BOOKING}/windows/${state.window}`);
  check('slotsLeft unchanged', before.body.slotsLeft === after.body.slotsLeft,
    `${before.body.slotsLeft} -> ${after.body.slotsLeft}`);
}

console.log('\n[15] an artist cannot decline a slot they already kept');
{
  const r = await call('POST', `${BOOKING}/requests/${state.req.sari}/decline`, { reason: 'changed my mind' });
  check('409 InvalidTransition', r.status === 409, `${r.status} ${r.body.error}: ${r.body.message}`);
}

console.log('\n[16] the DP deadline -- see client/expiry.mjs');

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exitCode = fail === 0 ? 0 : 1;
