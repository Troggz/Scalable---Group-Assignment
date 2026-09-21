# 2. The domain: findings (PROVISIONAL)

> **Status: provisional — not yet evidence.** Everything here comes from a simulated walkthrough written against
> [2-interview.md](2-interview.md), not from a real artist. The source document says so itself. It is a **hypothesis sheet**:
> it tells us what to expect and what to test, and it is not the §3.1 hand-in.
>
> **Confirm with a real artist on 2026-09-22.** After that session, tick the Confirm column, rewrite anything they
> contradict, and delete this banner.

The point of writing it down now is that the real interview stops being a discovery exercise and becomes a
twenty-minute confirm-or-correct pass, which is a far better use of an artist's time anyway.

---

## 1. The hot spot (C11) — provisional answer: **at DP**

Asked *"at what point is the slot definitely theirs?"*, the answer was **"When I receive the DP"**, with a temporary
reservation of about 24 hours beforehand, and the reservation created **after the artist accepts**, not when the
request arrives.

That is a different shape from what our contracts assume:

| Step | Our current design | Provisional finding |
|---|---|---|
| Request arrives | slot **kept** immediately; `409 SlotsFull` if none free | artist just receives it — requests are **not** capacity-limited |
| Artist accepts | quote issued, DP invoice created | **now** the slot is reserved, ~24h |
| DP paid | slot becomes `taken` | "officially booked" |

### Why this is not a detail

Our hard rule sits at the request step, and that is where the **concurrency** comes from — hundreds of clients racing
in the same second. That race is what satisfies **R2** and what demo step 5 proves with 20 parallel requests.

If slots are only consumed when the artist accepts, and the artist accepts by hand one at a time, **there is no race
left**, and R2 is the reason this project qualifies for the course.

### The two branches

**Option A — keep slot-at-request (no change).** Defend it as the product decision: the oversell is the problem we
are solving, so capacity gates requests. Costs nothing. Contradicts how the artist actually works.

**Option B — move the race to the DP.** The artist accepts *more* requests than slots (they already expect ghosting),
each accepted request gets 24 hours, and the slot is confirmed by **whoever pays first**. The contention becomes
clients paying concurrently: a real race, driven by external payment callbacks, still one conditional `UPDATE` with
`confirmed <= capacity`. Both hard rules then live in the same place.

Option B needs no refund logic — the losing payment is handled the way the source document suggests: *payment received
after the slot is gone → do not create a commission → flag for artist review*.

**Leaning B**, conditional on tomorrow. Contracts stay untouched until then.

### The question that decides it

> *"When you accept someone and send payment details — if two people are both inside that 24-hour window for your
> last slot, who gets it?"*

Ask it as a follow-up to B3. Their answer picks A or B outright.

---

## 2. Glossary terms this surfaced

To fold into [2-glossary.md](2-glossary.md) **once a real artist uses them**:

| Term | Provisional meaning | Status |
|---|---|---|
| **Booked** | DP received and the commission confirmed — distinct from "accepted" | ☐ Confirm |
| **Minor fix** | A small correction (eye colour) that does **not** consume a revision | ☐ Confirm |
| **Major revision** | A real change (whole pose) that **does** consume one | ☐ Confirm |
| **Final preview** | Watermarked or low-res, sent before pelunasan | ☐ Confirm |
| **Final file** | Full-resolution, released only after pelunasan | ☐ Confirm |
| **Antrian / queue** | The ordered list of booked commissions, with a rough position told to clients | ☐ Confirm |

The **minor fix vs revision** line is sharper than anything in our current glossary and is worth a question of its own:
artists apparently arbitrate it case by case, which means the revision counter cannot be fully automatic.

## 3. The two meaning-shifts (§3.2 requires two)

Both of our draft candidates held up:

| Word | While filling slots | While drawing |
|---|---|---|
| **comm / komisi** | a slot in the round — a unit of capacity | the artwork itself, with stages and revisions |
| **pricelist vs quote** | the advertised *start-from* price | the agreed price for this one request, which may be far higher |

The pricing example was concrete: full body advertised from Rp400k, but armour, a weapon, an extra character and a
background take the agreed price to Rp725k. **Existing commissions keep their agreed price when the pricelist
changes** — which is exactly the snapshot rule already in our CommissionWindow card.

⚠ These only count when a real artist says them. Get both on the recording tomorrow.

## 4. Domain events (27) — provisional

For the §3.1 hand-in we need 20+ **from the session**. This is the expected shape, to compare against what the wall
actually produces:

```
Pricelist Updated -> Commission Window Created -> Commissions Opened
-> Commission Request Submitted -> Request Reviewed -> Quote Proposed
-> Quote Accepted -> Request Accepted -> Slot Reserved
-> Deposit Invoice Created -> Deposit Received -> Slot Confirmed
-> Commission Booked -> Commission Added To Queue -> Work Started
-> Sketch Uploaded -> Revision Requested -> Sketch Updated -> Sketch Approved
-> Rendering Started -> Final Preview Uploaded -> Remaining Payment Requested
-> Remaining Payment Received -> Final File Released -> Commission Completed
```

Alternative paths: `Request Declined` · `Deadline Passed -> Request Expired -> Slot Released` ·
`Revision Limit Reached -> Additional Fee Requested`

Note the two events our draft list did not have: **Quote Proposed** and **Quote Accepted**. If real, the quote is a
negotiation step with its own back-and-forth, not a single artist action — worth watching for on the wall.

**Actors:** artist · client · system · payment provider · clock.

## 5. Scope guards — what we are deliberately *not* taking

The source document drifts into a marketplace. These are rejected on purpose, and the reasons are graded:

| In the document | Why we reject it |
|---|---|
| Discovery: search, style/budget filters, ratings, artist cards, portfolios | **R4** forbids marketplaces; already excluded by name in [1-app.md](1-app.md) |
| Six bounded contexts (adds Discovery, Messaging, Delivery) | Assignment allows 3–5 contexts, and **more than three services is −5** |
| A 16-item MVP | Item 1.c caps the feature list at **ten**; we have exactly ten |
| Artist / Profile / Portfolio aggregates | Same discovery creep, one layer down |

Keeping the four contexts we have (Booking, Pricelist, Payments, Studio) and three services.

## 6. Confirmed by this walkthrough (no change needed)

- **Exactly-once settlement.** Providers resend callbacks; a transaction id must count once. Matches our
  `UNIQUE (provider_ref)` design.
- **Price snapshot.** Pricelist changes must not alter agreed prices on existing commissions. Already our rule.
- **Internal stages hidden from clients.** The artist tracks sketching / rendering / review; the client sees a
  simpler set. Exactly what the studio service is supposed to hide.
- **Capacity is about workload, not inventory** — around five slots because more means stress and long waits. Good
  sentence for report §1.
- **Requests are not orders.** The artist reviews and may decline; this is not click-to-buy.

## 7. A gift for the reflection

The source document concludes that for an MVP *a modular monolith would likely be much simpler*. That is reflection
**5.b** nearly pre-written, and the handout says an honest answer there scores full marks. Keep the observation; write
it in our own words once we have hit a real distributed-systems cost during the build.

---

## Tomorrow's 20 minutes: confirm, don't rediscover

Work the ★ questions in [2-interview.md](2-interview.md) as written — do **not** read this file's answers to them, or
you will lead the witness and lose the glossary. Use this list only afterwards, to check coverage.

| # | Must come out of the session | Why |
|---|---|---|
| 1 | The C11 answer, plus the two-people-in-the-24h-window follow-up | Picks Option A or B; blocks the build |
| 2 | Both meaning-shifts, in their words, recorded | Graded explicitly in §3.2 |
| 3 | 12+ glossary terms as they say them | Graded |
| 4 | Real load numbers — followers, time-to-full, messages in the first hour | Report §1.e; replaces invented figures |
| 5 | One oversell story and one payment-confusion story | The two hard rules, told as incidents |
| 6 | The minor-fix vs revision line | Decides whether the revision counter is automatic |
| 7 | **Board photo / export** | A hand-in. Cannot be reconstructed afterwards |
