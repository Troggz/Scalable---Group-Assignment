# Evidence screenshots

What each file is, and which requirement it answers. Captured 2026-09-22 against all three services running
locally. Anything here is meant to be dropped straight into the report — take them wide enough that no line wraps.

| File | Command / moment | Requirement | What a grader should see |
|---|---|---|---|
| `01-db-isolation-9of9.png` | `bash infra/db/verify-isolation.sh` | **B2 / E7** | Nine checks, six of them `refused`. A service's credentials cannot open a neighbour's database |
| `02-hard-rule-under-load.png` | `node client/concurrency.mjs` | **R2 / E12** | 20 accepts in flight against 3 slots → exactly **3 × 200, 17 × 409 SlotsFull** |
| `03-uptime-before-restart.png` | `/health` on 3001–3003 | **B4 / E17** | Baseline `uptimeSeconds`: booking 29, payments 22, studio 14 |
| `04-uptime-after-restart.png` | same, after restarting booking alone | **B4 / E17** | booking **31** (reset), payments **324**, studio **317** — the other two never restarted |
| `05-changed-message-rule-holds.png` | `node client/concurrency.mjs` | **E17** | Booking's new message `(3 awaiting DP, 0 booked)`, and the rule still passing |
| `06-full-flow-28-passed.png` | `node client/flow.mjs` | **E14** | The whole main flow across all three services, **28 passed, 0 failed** |
| `07-event-storming-board.png` | the 90-minute session | **C3** | Board photo or export. The §3.1 hand-in |

## The pair that carries B4

Shots 3 and 4 only work together. The argument is that `uptimeSeconds` **would have reset** on payments and studio
if they had been redeployed, and it didn't — so they were never touched while booking changed and restarted. A
single screenshot cannot make that claim; the two together can.

## Shot 2 vs shot 5

Both are the concurrency check. Shot 2 is the hard rule on its own; shot 5 is the same rule still holding *after* a
service changed underneath it. Use shot 2 in report §4 for the hard rule, and shot 5 in the B4 section.
