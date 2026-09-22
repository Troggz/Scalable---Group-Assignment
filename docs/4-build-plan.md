# 4. The build: plan

**Scope rule:** the main flow end to end, crossing contexts and exercising the hard rule, and **nothing else**. That means no styling,
no login, and no admin panel. The client can be an `.http` / Postman / Bruno collection or a small CLI script.

## Order of work

1. **Commit `/docs` and `/contracts` first** (one commit, before any service code). That commit is the proof for "contracts before code".
2. Each owner builds their service against the contracts only, and fakes the other services with a stub if they aren't ready.
3. The owners wire the services together, run the demo script, and write the "How to run" section of the root README from a clean clone.
4. Record the screencast and fill in the incident log (below) as problems happen, not afterwards.

## Thin-build demo script

Seed data: artist `rara`; clients `budi`, `sari`, `dimas`, `ayu`.

| # | Call | Expect | Proves |
|---|---|---|---|
| 1 | booking `PUT /artists/rara/pricelist` (Half body 250k, +BG 50k, DP 50%, 2 revisions) | 200 | |
| 2 | booking `POST /windows` (3 slots, open now) | 201 `slotsLeft: 3` | |
| 3 | booking `POST /windows/{w}/requests` as budi, sari, dimas, ayu | 201 ×4, `slotsLeft` **still 3** | A request holds nothing |
| 4 | booking `POST /requests/{id}/accept {quoteIDR: 350000}` for budi, sari, dimas | 200 ×3, `depositIDR: 175000`, `depositInvoiceId`, then `slotsLeft: 0` | Accepting keeps the slot; booking → payments |
| 5 | booking `POST /requests/{ayu}/accept` | **409 `SlotsFull`** | **Hard rule** |
| 6 | *(concurrency)* a new 3-slot window, 20 requests, then **20 parallel accepts** | **exactly 3 × 200, 17 × 409** | **Hard rule under load** |
| 7 | payments `POST /provider/callbacks` for that invoice | 200 `applied: true` | |
| 8 | **the same callback again** | 200 `applied: false` | **Exactly once** |
| 9 | booking `GET /requests/{budi}` | `BOOKED`, `commissionId` | payments → booking → studio |
| 10 | studio `POST /commissions/{c}/sketch`, then `/sketch/approve` | `SKETCH_REVIEW` → `IN_PROGRESS` | |
| 11 | studio `POST /commissions/{c}/final` | `AWAITING_BALANCE`, `remainderInvoiceId`, `balanceDueIDR: 175000`, no `finalFileUrl` | studio → payments |
| 12 | payments `POST /provider/callbacks` for the pelunasan | 200 `applied: true` | |
| 13 | studio `GET /commissions/{c}` | `COMPLETED`, `finalFileUrl` present | payments → studio |
| *14* | *optional:* booking `POST /requests/{sari}/decline`, then ayu requests again | *200, then 201* | *A slot is released* |

## How the rules will be enforced (internal, not part of any contract)

**Hard rule (booking).** The slot is consumed **on accept**, not on request — Eja was explicit that a message is not
a slot and *"aku bilang yes = slot di-keep"*. One conditional update, inside the same transaction as the request's move
to ACCEPTED:

```sql
UPDATE commission_windows
   SET kept = kept + 1
 WHERE id = $1 AND kept + taken < slot_count
   AND NOT closed_early AND now() < closes_at
RETURNING id;               -- 0 rows → 409 SlotsFull (or WindowNotOpen)
-- + partial UNIQUE (window_id, client_id) over live statuses → 409 AlreadyRequested
```

Don't do *read slotsLeft, then write* in application code. That version passes the single-user demo and fails step 6.
**Verified:** 20 parallel accepts on 3 slots give exactly 3 × 200 and 17 × 409.

**Exactly once (payments).** Record `UNIQUE (provider_ref)` in the settlement log with
`INSERT … ON CONFLICT DO NOTHING`, then `UPDATE invoices SET status='PAID' WHERE id=$1 AND status='ISSUED'`. Notify
only if a row actually changed. Void uses the same guard (`WHERE status='ISSUED'`), so pay and void can't both win.

**Idempotent receivers (booking, studio).** InvoicePaid for a request that is already `BOOKED`, or a commission that is already `COMPLETED`,
returns 200 and changes nothing. If booking can't reach studio, it answers 503, and payments retries later.

## B2 proof: each service owns its data

PostgreSQL with one database and one login role per service:

```sql
CREATE ROLE booking_user LOGIN PASSWORD '…';
CREATE DATABASE booking_db OWNER booking_user;
REVOKE CONNECT ON DATABASE booking_db FROM PUBLIC;
-- repeat for payments and studio
```

Show it: `psql -U booking_user -d payments_db` fails with *permission denied for database*.
Also: no shared `models/` or `entities/` package between services. Each service's dependency file lists only plumbing.

## B4 and the screencast (3 minutes)

| Time | Show |
|---|---|
| 0:00–1:40 | Demo script steps 2–13, including **409 SlotsFull** and **applied: false** on the duplicate callback |
| 1:40–2:20 | Change one service. Suggestion: booking's `SlotsFull` message also says the window title. Restart **only booking**; the other two terminals stay up. |
| 2:20–3:00 | Run steps 2–4 again and show the changed message. Point at payments and studio uptime (untouched). |

Bonus for the live demo: stop `studio`, pay a DP (booking answers 503 to payments), start `studio`, and watch
payments' retry deliver the booking.

## Incident log (feeds reflection 5.a)

Write it down the day it happens: what broke, which Chapter 1 cost it was, and how long it took.

| Date | What happened | Chapter 1 cost | Time lost |
|---|---|---|---|
| | | | |
