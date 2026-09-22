# 2. The domain: findings

> **Answered by Eja, 2026-09-22.** An artist who runs open comms answered the six questions directly. His words are
> quoted below in the original; this is the first real evidence in this file and it overrides everything the earlier
> synthesis documents guessed at.
>
> The 90-minute event-storming session has still not happened, so the board export §3.1 asks for does not exist.

---

## 1. The hot spot (C11) — **SETTLED: the slot is kept at accept**

> "kalau aku, pas orang baru ngechat atau nanya itu belum aku anggap dapet slot sih. soalnya kadang baru nanya harga
> terus ilang 😭 … biasanya slot mulai aku **keep** pas aku udah liat briefnya terus aku bilang oke / aku accept
> commnya. dari situ aku udah ga kasih slot itu ke orang lain dulu. tapi kalau dibilang bener-bener confirmed atau
> booked, itu pas **DP-nya udah masuk**."  — Eja

| Moment | What happens to capacity |
|---|---|
| Client messages / submits a brief | **nothing** — not a slot yet |
| Artist accepts | slot is **kept**, held against the limit |
| DP arrives | slot is **taken**, "fix booked" |
| 1×24 jam passes with no DP | slot is **released** |

### And it is not first-to-pay

> "kalau tinggal 1 slot aku sebenernya sebisa mungkin ga bilang 'oke bayar aja' ke 2 orang sekaligus … aku bakal keep
> dulu buat orang yang aku accept pertama … jadi **bukan siapa yang transfer paling cepet**. kalau orang pertama udah
> aku kasih slot + deadline DP, menurutku ya itu hak dia selama masih di dalam deadline."  — Eja

This kills **Option B** outright. The artist deliberately avoids creating a payment race, because a race is a problem
he then has to clean up: *"kalau dua-duanya aku suruh bayar terus dua-duanya transfer malah aku yang bikin masalah
sendiri wkwk."*

### What this means for our contracts

Neither Option A nor Option B. Call it **Option C**, and it is a small change:

| Endpoint | Now | Must become |
|---|---|---|
| `POST /windows/{id}/requests` | keeps a slot; `409 SlotsFull` when none free | never refused for capacity; drop `SlotsFull` |
| `POST /requests/{id}/accept` | quote + DP invoice | **also consumes the slot**; gains `409 SlotsFull` |
| `POST /payment-notifications` | kept → taken | unchanged |

The conditional `UPDATE` moves from the request insert to the accept handler. `Window.slotsLeft` keeps its meaning
(`slotCount - (kept + taken)`); only the moment `kept` increments changes.

### Where the concurrency now lives (R2)

Two real races survive, and both are worth demonstrating:

1. **Concurrent accepts.** Eja's own near-miss: *"dua orang chat hampir barengan pas tinggal satu slot, jadi aku harus
   bilang ke yang satu kalau slot terakhir lagi di-keep orang lain dulu."* He handles this by hand today; the system
   must handle it atomically. Demo step 5 becomes **20 parallel accepts on 3 slots → 3 × 200, 17 × 409 SlotsFull**.
2. **Payment versus expiry.** The sweep releases a slot at the deadline while a DP may be landing on the same request.
   Getting this wrong either oversells or loses a paid slot. Our CommissionRequest card already names it.

## 2. Terms in Eja's own words

Straight from the transcript, spelled as he spells them. These replace our drafted equivalents in
[2-glossary.md](2-glossary.md) wherever the two disagree.

| Term | His definition | Where it lives |
|---|---|---|
| **di-keep** | "slot sementara ditahan setelah artist accept" | Booking |
| **DP masuk** | "deposit sudah diterima" | Payments |
| **fix booked** | "commission sudah confirmed" | Booking |
| **full** | "semua slot yang aku buka udah keisi / lagi di-keep orang" | Booking |
| **closed** | "aku memang udah ga nerima request lagi" | Booking |
| **brief** | "detail permintaan + reference dari client" | Booking |
| **revisi** | "yang ngubah gambar lumayan banyak" | Studio |
| **fix** | "koreksi kecil yang tidak dianggap revisi penuh" | Studio |
| **antrean / queue** | "urutan commission yang sudah booked" | Studio |
| **release slot** | "slot yang tadinya di-keep dibuka lagi" | Booking |
| **waitlist** | "orang yang menunggu kalau slot kembali tersedia" | (out of scope) |
| **baru chat / ngechat** | *"pas orang baru ngechat atau nanya itu belum aku anggap dapet slot"* | Booking — names the stage **before** a request |
| **comm** | *"buka comm"* / *"close comm"* = the round; *"aku accept commnya"* = one client's job | Booking **and** Studio — see §3 |

That is **13 terms**, past the 12 §3.2 asks for, and every one of them is a phrase he used rather than one we
translated for him.

The last two were sitting in the transcript unrecorded, and both earn their place:

**baru chat** is the most load-bearing word in this project. It names the stage where someone has messaged but has
nothing — *"kadang baru nanya harga terus ilang 😭"* — and it is the whole reason the hard rule lives in `accept()`
rather than at the request. Without this term the design reads as an arbitrary choice; with it, it reads as the
artist's own distinction. It is also a boundary marker: the stage is real to him and deliberately **outside** our
system, because a DM is not something we model.

**comm** has to be in the glossary because §3.2 wants the meaning-shifting terms to *be* glossary terms, and it was
only written up in §3 below. See there for the split.

**full and closed are different, and he was precise about it:** *"full itu soal slotnya, closed itu soal aku masih
nerima comm atau nggak."* He can close before full — *"kalau tiba-tiba sibuk atau ngerasa workload-nya udah
kebanyakan"* — which confirms our draft glossary was right to separate them.

**The revision line is about redraw effort, not message count:** *"aku lebih liat seberapa banyak yang harus digambar
ulang, bukan cuma jumlah chat 'tolong ubah ini'."* A pose change, an outfit change or a big added object is revisi; a
wrong eye colour or a detail he misread from the brief is not. That means the revision counter **cannot** be
automatic — the artist has to classify each change, which is a real requirement we had not modelled.

## 3. The two meaning-shifts (§3.2 requires two)

Both come out of Eja's own transcript, which is what makes them usable.

**1. "fix" — the good one.** He uses the same word for two unrelated things in two different parts of the business:

| Where | What "fix" means |
|---|---|
| Booking | **settled, confirmed** — *"DP masuk = **fix booked**"* |
| Studio | **a small correction** — *"kalau cuma hal kecil … biasanya aku anggap **fix** aja"* |

Neither side needs the other's version, and nobody outside the artist's head would guess they are the same word. This
is exactly the kind of find the handout calls the most useful thing in the exercise.

**2. "comm"** — the round versus the job. *"buka comm"* and *"close comm"* are the window; *"aku accept **commnya**"*
is one client's artwork. Same word, one meaning in Booking and another in Studio.

## 4. Domain events (27) — from the interview

The flow as Eja described it. The §3.1 hand-in has to be 20+ events **from the wall**, so this is the shape to compare
against what the session actually produces:

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
| §37 waitlist: slot offers, claim timers, scheduled openings, "notify me" | **A waitlist is already in our deliberately-left-out list** ([1-app.md](1-app.md)), as are push/email notifications. Adding it breaks the ten-feature cap and needs a context we have no service for |
| §21–22 artist and client dashboards | Presentation, not domain. The thin build is a `.http` collection (B1) |
| Artist / Profile / Portfolio aggregates | Same discovery creep, one layer down |

Keeping the four contexts we have (Booking, Pricelist, Payments, Studio) and three services.

## 6. Confirmed by the interview (no change needed)

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

## What the interview settled, and what is still open

| # | Item | Status |
|---|---|---|
| 1 | The C11 answer, plus the two-people-in-the-24h-window follow-up | ☑ Settled: kept at accept, and not first-to-pay |
| 2 | Both meaning-shifts, in his words | ☑ *fix* and *comm* — §3 above |
| 3 | 12+ glossary terms as he says them | ☑ 13 — §2 above. Still to merge into [2-glossary.md](2-glossary.md) |
| 4 | Load numbers — reach, time-to-full, enquiries per round | ☑ In [1-app.md](1-app.md) §1.e |
| 5 | An oversell story and a payment-confusion story | ☑ The two-at-once near-miss, quoted in §1 |
| 6 | The minor-fix vs revision line | ☑ Redraw effort, not message count — the counter cannot be automatic |
| 7 | **Board photo / export, and 20+ events from the wall** | ☐ **The session has not happened.** See [2-run-sheet.md](2-run-sheet.md) |
