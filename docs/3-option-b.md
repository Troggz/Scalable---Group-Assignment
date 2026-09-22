# 3. Option B: move the race to the payment step

> **Never applied — kept as a record of the road not taken.** This was the revision prepared in case a slot turned
> out to become the client's **at DP** rather than at accept.
>
> Eja settled it the other way ([2-findings.md](2-findings.md) §1): the slot is kept **at accept**, and she
> deliberately avoids a payment race — *"bukan siapa yang transfer paling cepet"*. So this option is dead, and the
> hard rule lives in `accept()`. Worth keeping in the report as evidence that the domain decided the design.

## What changes, in one sentence

Requests stop consuming capacity; **the DP payment consumes it**, first-come, and the artist may accept more
requests than there are slots.

## Why this still satisfies R2

The worry with a DP-time answer is that it kills the concurrency: if the *artist* consumes capacity by accepting,
and the artist works by hand one at a time, nothing races and **R2** is not met.

Option B avoids that by letting the artist accept more requests than slots — which is what they already do in
practice, because they expect ghosting. The contention then falls where several **clients** are paying inside the
same 24-hour window, which is:

- genuinely concurrent, and driven by **external payment callbacks** rather than by a human clicking;
- still one conditional `UPDATE`, so the hard rule is enforced the same way;
- in the same place as the exactly-once rule, which makes payments the interesting service and gives the
  coupling table a sharper story.

The demo gets better too: five accepted clients pay simultaneously for three slots, exactly three are booked.

## The contract diff — `booking.openapi.yaml`

Everything below is the complete set of changes. **`payments.openapi.yaml` and `studio.openapi.yaml` do not change
at all** — which is itself worth a sentence in report §3: the boundary absorbed a change to the core business rule
without touching its neighbours.

### 1. `POST /windows/{windowId}/requests` — no longer holds a slot

| | Now | Option B |
|---|---|---|
| summary | `Client requests a slot (keeps one slot if any is left)` | `Client submits a request (no slot is held)` |
| 201 | `A slot is kept for this client; status SUBMITTED` | `Request recorded; status SUBMITTED. No capacity is consumed.` |
| 409 | `SlotsFull`, `AlreadyHoldsSlot`, `WindowNotOpen` | **`SlotsFull` is removed** · `AlreadyHoldsSlot` → **`AlreadyRequested`** · `WindowNotOpen` stays |

`SlotsFull` moving out of this endpoint is the whole change. A window that is full still accepts requests — the
artist may want a queue for the next round, and a client whose payment loses the race has to have been accepted first.

### 2. `POST /requests/{requestId}/accept` — unchanged, but now may overbook

Still `200`, still issues the DP invoice with `depositIDR` and `payBy`. It does **not** consume a slot.

Add two read-only fields to the response so the artist can see their exposure before accepting again:

```yaml
    AcceptResult:
      allOf:
        - $ref: '#/components/schemas/CommissionRequest'
        - type: object
          properties:
            slotsLeft:
              type: integer
              minimum: 0
              description: Slots not yet confirmed by a paid DP
            awaitingDeposit:
              type: integer
              description: >
                Accepted requests whose DP is unpaid and still within payBy.
                When this exceeds slotsLeft the artist has deliberately overbooked,
                which is allowed; the payment race decides.
```

### 3. `CommissionRequest.status` gains one value

```yaml
        status:
          type: string
          description: May gain values.
          enum: [SUBMITTED, ACCEPTED, BOOKED, DECLINED, EXPIRED, PAID_NO_SLOT]
```

`PAID_NO_SLOT` — the DP arrived, but the last slot was confirmed by someone else first. No commission is created
and the money is **not** auto-refunded; it is flagged for the artist, who offers the next window or refunds out of
band. This keeps refunds out of scope, exactly as [1-app.md](1-app.md) intends.

Adding an enum value is allowed by our own change policy ("enums may grow; consumers must tolerate values they
don't know"), so this is not a breaking change.

### 4. `Window.slotsLeft` changes meaning

| | Now | Option B |
|---|---|---|
| `slotsLeft` | `slotCount − (kept + taken)` | `slotCount − confirmed` |
| new field | — | `awaitingDeposit`: accepted, unpaid, still within `payBy` |

`status` still reaches `FULL`, but now when `confirmed == slotCount`.

This is the one genuinely breaking change in the set — the same field name with a different meaning. Since no
consumer code exists yet it costs nothing today, but **say so in report §3.4**: it is a textbook example of the
change our own policy says needs a new path prefix once consumers exist.

### 5. `POST /payment-notifications` — where the hard rule now lives

The endpoint's signature does not change. Its behaviour does: receiving `InvoicePaid` with `purpose: dp` is now the
moment capacity is consumed.

- capacity left → `BOOKED`, create the commission in studio, return 200
- no capacity → `PAID_NO_SLOT`, create nothing, return 200
- already `BOOKED` or `PAID_NO_SLOT` → return 200, change nothing (idempotent, unchanged)

## The hard rule, restated

Moves out of the request insert and into the DP notification handler:

```sql
UPDATE commission_windows
   SET confirmed = confirmed + 1
 WHERE id = $1 AND confirmed < slot_count
RETURNING id;          -- 0 rows -> PAID_NO_SLOT, create nothing
```

Same shape as before — one conditional `UPDATE`, never read-then-write. Two constraints must hold with it:

- it runs **in the same transaction** as the request's move to `BOOKED`;
- the handler stays idempotent on `invoiceId`, so a duplicate `InvoicePaid` cannot consume a second slot. This is
  the failure mode to watch: the old design got idempotency for free because the slot was already held.

The expiry sweep still exists but no longer releases capacity — it just moves `ACCEPTED` past `payBy` to `EXPIRED`
and voids the invoice, so the artist's `awaitingDeposit` figure stays honest.

## Aggregate card changes

**CommissionWindow** — slots become `free | confirmed`; `kept` disappears. Hard rule becomes *confirmed slots never
exceed slotCount, under any concurrency*. Add to Hides: *whether the artist has overbooked, and by how much*.

**CommissionRequest** — states become `Submitted → Accepted → Booked`, `Accepted → PaidNoSlot`, plus the existing
`Declined` and `Expired`. Drop the rule *"created only together with a kept slot"*; add *"a paid DP confirms at most
one slot, and never more than the window has"*.

## Demo script changes

| # | Now | Option B |
|---|---|---|
| 3 | 3 requests → `slotsLeft: 0` | 5 requests → all 201, `slotsLeft: 3` unchanged |
| 4 | 4th request → **409 SlotsFull** | artist accepts all 5 → `awaitingDeposit: 5`, `slotsLeft: 3` |
| 5 | 20 parallel requests on 3 slots → 3×201, 17×409 | **5 parallel DP callbacks on 3 slots → 3 `BOOKED`, 2 `PAID_NO_SLOT`** |

Step 5 is still the money shot for the screencast, and it now exercises both hard rules in a single action.

## What to do if they say "at request" after all

Nothing. Delete this file, keep the contracts as they are, and note in report §3 that the design was tested against
a plausible alternative and held.
