# 2. The domain: findings

> **Answered by Eja, 2026-09-22.** An artist who runs open comms answered the six questions directly. Her words are
> quoted below in the original; this is the first real evidence in this file and it overrides everything the earlier
> synthesis documents guessed at.
>
> Two caveats the source itself flags. The Q5 load figures are labelled *"MOCK PLACEHOLDER — ganti dengan angka asli
> dari Eja sebelum dipakai sebagai bukti"*, so they are **not yet usable as evidence**. And the 90-minute event-storming
> session has still not happened, so the board export §3.1 asks for does not exist.

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
she then has to clean up: *"kalau dua-duanya aku suruh bayar terus dua-duanya transfer malah aku yang bikin masalah
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
   bilang ke yang satu kalau slot terakhir lagi di-keep orang lain dulu."* She handles this by hand today; the system
   must handle it atomically. Demo step 5 becomes **20 parallel accepts on 3 slots → 3 × 200, 17 × 409 SlotsFull**.
2. **Payment versus expiry.** The sweep releases a slot at the deadline while a DP may be landing on the same request.
   Getting this wrong either oversells or loses a paid slot. Our CommissionRequest card already names it.

## 2. Terms in Eja's own words

Straight from the transcript, spelled as she spells them. These replace our drafted equivalents in
[2-glossary.md](2-glossary.md) wherever the two disagree.

| Term | Her definition | Where it lives |
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

**full and closed are different, and she was precise about it:** *"full itu soal slotnya, closed itu soal aku masih
nerima comm atau nggak."* She can close before full — *"kalau tiba-tiba sibuk atau ngerasa workload-nya udah
kebanyakan"* — which confirms our draft glossary was right to separate them.

**The revision line is about redraw effort, not message count:** *"aku lebih liat seberapa banyak yang harus digambar
ulang, bukan cuma jumlah chat 'tolong ubah ini'."* A pose change, an outfit change or a big added object is revisi; a
wrong eye colour or a detail she misread from the brief is not. That means the revision counter **cannot** be
automatic — the artist has to classify each change, which is a real requirement we had not modelled.

## 3. The two meaning-shifts (§3.2 requires two)

Both come out of Eja's own transcript, which is what makes them usable.

**1. "fix" — the good one.** She uses the same word for two unrelated things in two different parts of the business:

| Where | What "fix" means |
|---|---|
| Booking | **settled, confirmed** — *"DP masuk = **fix booked**"* |
| Studio | **a small correction** — *"kalau cuma hal kecil … biasanya aku anggap **fix** aja"* |

Neither side needs the other's version, and nobody outside the artist's head would guess they are the same word. This
is exactly the kind of find the handout calls the most useful thing in the exercise.

**2. "comm"** — the round versus the job. *"buka comm"* and *"close comm"* are the window; *"aku accept **commnya**"*
is one client's artwork. Same word, one meaning in Booking and another in Studio.

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
| §37 waitlist: slot offers, claim timers, scheduled openings, "notify me" | **A waitlist is already in our deliberately-left-out list** ([1-app.md](1-app.md)), as are push/email notifications. Adding it breaks the ten-feature cap and needs a context we have no service for |
| §21–22 artist and client dashboards | Presentation, not domain. The thin build is a `.http` collection (B1) |
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
