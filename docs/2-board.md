# 2. The domain: the event storming board

**Session:** 22 September 2026, with Eja (artist). Compiled by Thomas Nadandra, R. Ethan and Muhammad Asthar.
**Scope agreed at the start:** from deciding to open commissions until the client has the final file.
**Board:** `screenshots/` — the §3.1 hand-in.

This file is the typed list §3.1 asks for. It is what came off the wall, not our prepared candidate list.

---

## Domain events (24)

Past tense, in the order they occur, grouped by the column they ended up in.

### Pricelist (2)

| # | Event | Actor |
|---|---|---|
| 1 | Pricelist created / published | Eja |
| 2 | Pricelist updated | Eja |

### Booking — slots and requests (8)

| # | Event | Actor |
|---|---|---|
| 3 | Slot requested | Client |
| 4 | Request accepted | Eja |
| 5 | Slot kept (reserved) | System |
| 6 | Request declined | Eja |
| 7 | Slots full | System |
| 8 | Request cancelled (by client) | Client |
| 9 | Slot released (expired) | System / clock |
| 10 | Commissions closed | Eja |

### Payments (6)

| # | Event | Actor |
|---|---|---|
| 11 | DP invoice issued | System |
| 12 | DP paid | Client |
| 13 | DP deadline passed | Clock |
| 14 | Payment failed | Payment provider |
| 15 | Slot released (auto) | System |
| 16 | Duplicate payment ignored | System |

### Studio — work, revisions and delivery (8)

| # | Event | Actor |
|---|---|---|
| 17 | Sketch sent | Eja |
| 18 | Revision requested | Client |
| 19 | Sketch approved | Client |
| 20 | Rendering started | Eja |
| 21 | Revisi limit reached | System |
| 22 | Additional fee requested (if needed) | Eja |
| 23 | Final file released | System |
| 24 | Commission completed | System |

## Actors

Eja (artist) · Client (commissioner) · System (clock) · Payment provider (e.g. Midtrans)

## Commands

| Context | Commands |
|---|---|
| Pricelist | Set up pricelist · Update commission info / TOS |
| Booking | Request commission (slot) · Review request + decide (accept/decline) · Keep slot (reserve) · Manage slots / waitlist |
| Payments | Pay DP · Confirm payment (webhook) |
| Studio | Send sketch (WIP) · Request revisions · Approve sketch · Continue rendering · Send final file |

## The hotspot, resolved on the board

**"When is a slot really theirs?"**

> *"baru chat = belum dapet slot. aku bilang yes = slot di-keep. baru fix booked pas DP masuk."* — Eja

Three distinct moments, and the middle one is where capacity is consumed.

## Business rules, in Eja's framing

1. Only tell one person to pay for the last slot (at a time)
2. Slot is kept after I accept the request
3. Final file is only given after full payment
4. Revision count must be tracked accurately
5. Expired / cancelled slots must be released

## Questions raised in the session

1. If two people are told to pay for the last slot, how do you handle it?
2. Is "full" the same as "closed" to you, or different?
3. What's the line between a small fix and a proper revisi?
4. Rough numbers: how many people saw your last open comm, and how fast did slots go?
5. Ever had someone end up with a slot that didn't exist, or pay you twice by accident?

---

## What the board confirmed, and what it did not

The board's four columns are the four bounded contexts we had already drawn — Pricelist, Booking, Payments, Studio
— which is the §3.4 grouping arrived at independently and then matched. Rules 1, 2, 3 and 5 are the hard rule, the
C11 answer, the file-release rule and the expiry sweep, all of which are built and passing.

**Three events on the wall have nothing behind them in the code.** They are genuine gaps, not oversights we can
argue away, and they are what §5.c is about.

| # | Event on the board | What exists today | What it would take |
|---|---|---|---|
| 8 | **Request cancelled (by client)** | Nothing. A client cannot withdraw. Only the artist declines (before accept) or the DP deadline expires it | Booking gains a cancel route, and it must release a kept slot the same way the sweep does: void the invoice first, then release. One service, no contract change for the neighbours |
| 14 | **Payment failed** | Nothing. `POST /provider/callbacks` accepts only `status: SETTLED` and answers 422 to anything else | Payments gains a failure path and a `PaymentFailed` notification. Booking would have to decide whether a failure ends the hold early or lets the deadline run |
| 22 | **Additional fee requested** | Nothing. Hitting the revision limit returns `409 RevisionLimitReached` and stops there | Studio raising a second invoice mid-flow, which it already does for the pelunasan. Cheapest of the three |

Rule 4, *"revision count must be tracked accurately"*, is built — but the interview already established that the
count **cannot be automatic**, because Eja classifies each change by redraw effort rather than message count. The
system stores the count; the artist decides what increments it.

**Event 15, "Slot released (auto)", landed in the Payments column** while event 9, "Slot released (expired)", landed
in Booking. Both describe the same release. Our build puts it in Booking — the sweep lives in `booking/src/expiry.js`
and calls Payments to void the invoice — because the slot is Booking's to give away. The board's split is a fair
description of what the artist sees (the money side triggers it), not a contradiction of where the rule belongs.

**"Manage slots / waitlist"** appeared as a command. The waitlist stays out of scope, as
[1-app.md](1-app.md) already records, and Eja's own glossary entry for it describes people waiting outside the
system rather than a feature he runs.
