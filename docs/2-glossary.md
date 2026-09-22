# 2. The domain: ubiquitous language

> **Confirmed against Eja's interview, 2026-09-22.** §3.2 asks for at least twelve terms in the words the outside
> person actually used. The first table is that set — **thirteen terms, each one a phrase he said**, transcribed from
> [2-findings.md](2-findings.md) §2 and spelled the way he spells them. The second table holds the terms our model
> needs that he did not name himself, kept separate on purpose so the graded set stays honest.

## Terms in the artist's own words (13)

| # | Term | How he said it | Meaning | Context |
|---|---|---|---|---|
| 1 | **baru chat / ngechat** | *"pas orang baru ngechat atau nanya itu belum aku anggap dapet slot"* | Someone has messaged or asked a price and has **nothing yet**. The stage before a request, and deliberately outside our system | Booking (boundary) |
| 2 | **comm** | *"buka comm"*, *"close comm"*, *"aku accept commnya"* | The round, or one client's job. See the meaning shift below | Booking / Studio |
| 3 | **brief** | *"detail permintaan + reference dari client"* | What the client wants, plus reference links | Booking |
| 4 | **di-keep** | *"slot sementara ditahan setelah artist accept"* | A slot held for a client the artist has accepted, before the DP arrives | Booking |
| 5 | **release slot** | *"slot yang tadinya di-keep dibuka lagi"* | A kept slot going back into the pool when the DP never comes | Booking |
| 6 | **DP masuk** | *"deposit sudah diterima"* | The deposit has landed. This is what turns a kept slot into a taken one | Payments |
| 7 | **fix booked** | *"commission sudah confirmed"* | Settled — the commission is really happening | Booking |
| 8 | **full** | *"semua slot yang aku buka udah keisi / lagi di-keep orang"* | No slot is free right now | Booking |
| 9 | **closed** | *"aku memang udah ga nerima request lagi"* | He is not taking requests at all any more — a different thing from *full* | Booking |
| 10 | **antrean / queue** | *"urutan commission yang sudah booked"* | The order he works booked commissions in | Studio |
| 11 | **revisi** | *"yang ngubah gambar lumayan banyak"* | A change big enough to count against the limit, judged by redraw effort | Studio |
| 12 | **fix** | *"koreksi kecil yang tidak dianggap revisi penuh"* | A small correction that does **not** count as a revision | Studio |
| 13 | **waitlist** | *"orang yang menunggu kalau slot kembali tersedia"* | People waiting for a slot to come back. Named by him, **out of scope** for us | (excluded) |

Two of these carry design decisions that would otherwise look arbitrary:

- **baru chat** is why the hard rule lives in `accept()` and not at the request. A message is not a slot, in his words
  before it was in our code.
- **full vs closed** — *"full itu soal slotnya, closed itu soal aku masih nerima comm atau nggak."* He can close
  before full, *"kalau tiba-tiba sibuk atau ngerasa workload-nya udah kebanyakan"*. Capacity and availability are two
  different states, so `Window.status` derives both.
- **revisi vs fix** means the revision counter **cannot be automatic**. He classifies each change by how much has to
  be redrawn, not by how many messages arrive.

## Terms our model needs that he did not name

Ours, not his. Listed separately so the graded set above is not padded.

| Term | Meaning | Context |
|---|---|---|
| **Window** (commission window) | Our name for one round of open comms with a slot count and an open/close time | Booking |
| **Slot** | One unit of the artist's capacity in a window | Booking |
| **Pricelist** | Tiers with start-from prices, add-ons, DP percentage, revision limit | Pricelist |
| **Tier** | How much of the character is drawn; sets the base price | Pricelist |
| **Add-on** | A priced extra (extra character, background) | Pricelist |
| **TOS** | The artist's stated terms: what they will draw, DP, revisions, refunds | Pricelist / Booking |
| **Quote** | The price agreed for *this* request, at or above the start-from price | Booking |
| **Pelunasan** | The remaining balance. The hi-res file waits on it | Payments / Studio |
| **Invoice** | A request for a specific amount from a specific payer | Payments |
| **Sketch** | The rough version the client approves before rendering | Studio |
| **Preview** | A watermarked or low-res final, visible before pelunasan | Studio |
| **Final file** | The hi-res deliverable, released only after pelunasan | Studio |

## Terms that change meaning across the business

§3.2 asks for two. Both of these are his, which is what makes them usable — see [2-findings.md](2-findings.md) §3.

### 1. "fix"

The same word for two unrelated things, in two different parts of the business:

| Where | What "fix" means |
|---|---|
| **Booking** | **Settled, confirmed** — *"DP masuk = **fix booked**"* |
| **Studio** | **A small correction** — *"kalau cuma hal kecil … biasanya aku anggap **fix** aja"* |

Neither side needs the other's version, and nobody outside the artist's head would guess they are the same word.

### 2. "comm"

- **In Booking**, a comm is **a claim on one slot with a price**. *"buka comm"*, *"close comm"* — it is the round, and
  it is counted against the window. Nobody here cares how the drawing is going.
- **In the Studio**, a comm is **one piece of artwork** moving sketch → revisions → final. *"aku accept commnya"* — it
  has a brief, a revision count and file links. Nobody here cares how many slots the window had.

Booking passes the Studio one fact — this one is booked, here is the brief and the agreed terms — and never hears
about sketches. That gap is the service boundary.

### Further shifts we noticed, not needed for the two required

- **"price" / "harga"**: an advertised *start-from* in the Pricelist, a fixed *quote* in Booking, and merely *an amount
  due* in Payments, which never knows why the number is what it is.
- **"approve / ACC"**: in Booking the **artist** accepts the **client's** request; in the Studio the **client**
  approves the **artist's** sketch. The actor is reversed, and so is who waits on whom.
