# The thin client

The main flow end to end and nothing else — no styling, no login, no admin panel
(requirement B1). Four files, because three of the sixteen demo steps cannot be
driven one request at a time.

| File | What it is | When to use it |
|---|---|---|
| [demo.http](demo.http) | The flow as a request collection, one block per step | The screencast and the live demo. Read top to bottom |
| [flow.mjs](flow.mjs) | The same steps with the expected answers asserted | After changing anything: one command says whether the flow still works |
| [concurrency.mjs](concurrency.mjs) | Step 6: 20 accepts at once on 3 slots | Proving the hard rule under load |
| [expiry.mjs](expiry.mjs) | Step 16: the DP deadline releasing a kept slot | Proving a slot is not held forever |

All four assume the three services are already running — see the root README.
The scripts need nothing installed: Node's own `fetch`, no dependencies.

## The collection

`demo.http` runs in the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension for VS Code. Each block has a *Send Request* link above it. **Send them
in order** — later blocks read ids out of earlier responses (`{{openWindow.response.body.$.windowId}}`),
so skipping one breaks the rest.

The four steps worth watching, all marked `**` in the file:

- **Step 3 → 4.** Four requests leave `slotsLeft` at 3. Three accepts take it to 0.
  A request holds nothing; accepting is what keeps a slot.
- **Step 5.** The fourth accept is `409 SlotsFull`. That is the hard rule.
- **Step 8.** The identical provider callback a second time returns `applied: false`.
- **Step 11.** The final is sent and `finalFileUrl` is *not* in the response. It
  appears at step 13, after the pelunasan, and nobody asked studio to release it.

## The scripts

```bash
node client/flow.mjs           # steps 0-15, asserted; exits non-zero on failure
node client/concurrency.mjs    # step 6
```

Step 16 needs booking restarted with a deadline short enough to watch:

```bash
# in services/booking, with DP_DEADLINE_MINUTES=0 and EXPIRY_SWEEP_SECONDS=3
npm start

node client/expiry.mjs
```

Override the ports with `BOOKING_URL`, `PAYMENTS_URL` and `STUDIO_URL` if you are
not on the defaults.

## Why three of these are not in the .http file

**Step 6** needs twenty accepts genuinely in flight together. Sent one at a time
they *all* pass, even against a read-then-write implementation that loses slots
under real load — which is the entire failure the hard rule exists to prevent.
A request-at-a-time client cannot show the difference, so it cannot be the proof.

**Step 16** needs booking restarted with a different deadline, and then a wait.

**The outage test** (stop studio, pay a DP, watch payments retry until it lands)
needs a service killed mid-flow. Done by hand during the demo; see the root README.

## Seed data

There is no user table in any of the three services. An artist or a client is
just an id travelling inside a request — `rara`, `budi`, `sari`, `dimas`, `ayu`
— which is one reason no service needs a shared database to talk about people.
So "seeding" is step 1 and step 2 of the flow: publish rara's pricelist, open a
window. Every script does both itself, and can be run against an empty database.
