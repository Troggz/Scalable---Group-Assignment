# Week 2 proposal: OpenComm (working title)

**Team:** OpenComm · Thomas Nadandra Aryawida (24/536628/PA/22760) · Ryan Ethan Halim (24/536718/PA/22765) · Muhammad Asthar Bin Rizwan (24/546649/PA/23208)

## The app

Independent illustrators take paid commissions in rounds called "**open comm**". An artist announces a period
(e.g. October) and a small number of **slots** (e.g. 5). Most do this today with a Google Form, DMs, and a
spreadsheet, and that setup breaks at the worst moment. When an artist posts "OPEN COMM, 5 SLOTS", far more people
reply than there are slots, most of them within the hour. The artist ends up with more takers than slots, has to apologise and refund,
and then spends the month tracking who paid the **DP**, which sketch is waiting on approval, and who still owes
**pelunasan**. OpenComm gives each artist a booking page for their window that never oversells, and tracks every
commission from request to final file.

## Users

- **Artist**: opens windows, sets prices and terms, accepts or declines requests, delivers sketch and final.
  Cares about never being overbooked, getting the DP before starting, and a limited number of revisions.
- **Client**: requests a slot, pays DP and pelunasan, approves the sketch, receives the file.
  Cares about getting a slot fairly (first come, first served), knowing the price up front, and seeing progress.

## Main flow

1. The artist publishes a pricelist and opens a window with N slots.
2. A client sends a request with a brief. Nothing is held yet — a request is not an order.
3. The artist reads it and **accepts** (quoting at or above the start-from price) or declines. Accepting **keeps** a slot; when every slot is kept or taken, the answer is "slots full".
4. The client pays the DP within 1×24 hours. The slot becomes **taken** and the commission joins the artist's queue.
   If the DP isn't paid in time, the slot is freed.
5. The artist sends a sketch. The client approves it or asks for a revision (limited number).
6. The artist sends the final preview, and the client pays pelunasan.
7. Once the payment is confirmed, the hi-res file is released and the commission is complete.

Shape: **reserve a scarce thing** (steps 1–4) followed by **order, prepare, hand over** (steps 4–7).
It crosses three areas of the business: booking, payments, and the studio.

## Hard rule

**An artist never gets more commissions in a window than the slots they opened, however many clients are competing
for the last one.** The load is bursty and self-inflicted: the artist we interviewed reaches around a thousand people
with one post, and her last five-slot round drew fifteen to twenty serious enquiries and filled inside thirty to sixty
minutes. She has already had two clients arrive together for the last slot. A related rule: a payment is applied
exactly once, even if the payment provider's callback arrives twice.

## Why this is not a marketplace (R4)

There is no artist discovery, search, ranking, reviews, chat, escrow, or dispute handling. Each artist shares a link to their own
window on their own social media. Supporting more than one artist means more tenants, not a catalogue to browse.
We don't process images: sketches and finals are links, and watermarking is left to the artist.

## Who we will interview

**Eja** — Discord, `clasymore` — an illustrator who runs open comms in batches of about five slots. Eja answered our
six questions in writing on 22 September 2026, and joined our 90-minute event-storming session the same day.
