# 2. The domain: ubiquitous language

> **DRAFT, written before the interview.** The assignment wants the words the outside person *actually used*.
> After the interview, tick **Confirmed**, change the wording to theirs, and delete terms they never used.

| # | Term | How artists say it (ID / EN) | Meaning | Context | Confirmed |
|---|---|---|---|---|---|
| 1 | **Open comm** | "open comm", "buka komisi" | A period in which the artist takes requests for a fixed number of slots. We model it as a *commission window*. | Booking | ☐ |
| 2 | **Slot** | "slot", "sisa 2 slot" | One unit of the artist's capacity in a window. | Booking | ☐ |
| 3 | **Keep** | "di-keep", "keep slot 1×24 jam" | A slot held for a client who hasn't paid DP yet. | Booking | ☐ |
| 4 | **Slot full / close comm** | "slot full", "close comm" | *Full*: no slot is free right now. *Closed*: the window no longer takes requests at all. | Booking | ☐ |
| 5 | **Pricelist** | "pricelist", "PL", "start from" | The artist's advertised prices per tier and add-on, plus DP percentage and free revisions. | Pricelist | ☐ |
| 6 | **Tier** | "headshot / half body / full body" | How much of the character is drawn. It sets the base price. | Pricelist | ☐ |
| 7 | **Add-on** | "tambahan karakter", "+BG" | An extra with its own price (extra character, background). | Pricelist | ☐ |
| 8 | **TOS** | "TOS", "syarat & ketentuan" | The artist's rules: what they will and won't draw, the DP, revisions, refunds. | Pricelist / Booking | ☐ |
| 9 | **Brief / ref** | "brief", "ref", "referensi" | The client's description plus reference links for the character. | Booking | ☐ |
| 10 | **Quote** | "harga deal", "harga final" | The price agreed for *this* request. Never below the start-from price. | Booking | ☐ |
| 11 | **DP** (down payment) | "DP 50%" | The deposit that turns a kept slot into a taken one. | Booking / Payments | ☐ |
| 12 | **Pelunasan** | "pelunasan", "lunas" | Paying the remaining balance. The hi-res file waits for it. | Payments / Studio | ☐ |
| 13 | **Tagihan** (invoice) | "tagihan", "invoice" | A request for a specific amount from a specific payer. | Payments | ☐ |
| 14 | **Ghosting** | "ghosting", "kabur" | A client disappears without paying. The kept slot expires. | Booking | ☐ |
| 15 | **Antrian** (queue) | "antrian", "queue", "Trello" | The order in which the artist works on booked commissions. | Studio | ☐ |
| 16 | **Sketch** | "sketsa", "sketch" | The first rough version the client must approve before rendering. | Studio | ☐ |
| 17 | **Revisi** (revision) | "revisi", "free 2× revisi" | A round of changes the client asks for. Capped by the TOS agreed at request time. | Studio | ☐ |
| 18 | **WIP** | "WIP" | A progress update between sketch and final. | Studio | ☐ |
| 19 | **Preview** | "preview", "watermark" | A low-res or watermarked final the client sees before pelunasan. | Studio | ☐ |
| 20 | **File final** | "file HD", "no watermark" | The hi-res deliverable, released only after pelunasan. | Studio | ☐ |
| 21 | **Comm / komisi** | "comm", "komisi" | See context-dependent terms below. | Booking / Studio | ☐ |

## Terms that change meaning across the business

These mark our boundaries. Confirm at least two with the artist. If the session turns up a better pair, use that pair instead.

### 1. "Comm" (commission)

- **In Booking**, a comm is **a claim on one slot with a price.** "3 comms taken, 2 left." It is counted against the
  window. It has a quote and a DP deadline. Nobody here cares how the drawing is going.
- **In the Studio**, a comm is **a piece of artwork moving through sketch → revisions → final.** "Comm #2 is at sketch."
  It has a brief, a revision count, and file links. Nobody here cares how many slots the window had.

Neither side needs the other's version. Booking passes the Studio one fact, "this one is booked, here is the brief and
the agreed terms", and never hears about sketches.

### 2. "Price" / "harga"

- **In the Pricelist** it's an **advertised start-from price** ("half body start from 250k"). It's public, belongs to a tier, and can change for the next round.
- **In Booking** it's the **quote**: the price agreed for one request, fixed once the DP is paid.
- **In Payments** it's the **amount due on one invoice** (the DP *or* the pelunasan). Payments never knows or cares why the
  amount is what it is.

### Backups, if the session doesn't confirm the two above

- **"Slot"**: in Booking it's a unit of capacity ("2 slots left"). In the Studio, artists reuse the number as a queue position
  ("slot 1 is at coloring").
- **"Approve / ACC"**: in Booking, the *artist* accepts the *client's* request. In the Studio, the *client* approves the
  *artist's* sketch. The actor is reversed, and so is who waits on whom.
