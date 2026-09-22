# 1. The app

> Step 1 hand-in, two pages at most. Step 1 deliberately uses no microservice vocabulary.

## 1.a The app in one paragraph

OpenComm is a booking desk for independent illustrators who take commissions in rounds ("open comm"). An
artist opens a window, for example *October, 5 slots*, and clients request those slots. Today most artists run this
with a Google Form, DMs, and a spreadsheet. The result is overbooking when a popular post goes viral, lost track of who
paid the DP, and arguments over how many revisions were free. OpenComm makes sure a window never sells more slots than
exist, holds a slot only while its DP is still expected, and tracks each commission from sketch to final file. The file is
released only once the client has paid in full.

## 1.b Users

| User | What they do | What they care about |
|---|---|---|
| **Artist** (illustrator) | Publishes a pricelist and terms (TOS), opens windows, accepts or declines requests, sends sketch, revisions, and final | Never overbooked; DP in hand before starting; revisions capped; not chasing payments; no ghosting |
| **Client** (commissioner) | Requests a slot with a brief and references, pays DP and pelunasan, approves the sketch or asks for a revision, downloads the final | A fair first-come chance at a slot; a known price up front; seeing where their commission stands; getting the file they paid for |

The payment provider is an external system, not a user.

## 1.c Must-have features (10)

1. The artist publishes a **pricelist**: tiers with start-from prices, add-ons, DP percentage, and number of free revisions.
2. The artist opens a **window**: title, number of slots, open and close time.
3. Anyone can see a window, its prices, and how many **slots are left**.
4. A client **sends a request** (tier, add-ons, brief, reference links). One live request per client per window; no slot is held yet.
5. The artist **accepts** with a quote (at or above the start-from price) or **declines**. Accepting keeps a slot; declining holds nothing.
6. The client **pays the DP**. An unpaid DP past the deadline frees the slot.
7. The artist sends a **sketch**. The client **approves** it or **requests a revision**, up to the agreed limit.
8. The artist sends the **final**: a preview link and a hi-res link.
9. The client **pays pelunasan**, and the hi-res link is released.
10. The artist sees their **queue**, and each client sees their commission's status.

**Deliberately left out:** artist discovery, search, ratings, reviews · chat (artists already use DMs) · login and
accounts (not needed for the thin version) · refunds, disputes, escrow · a waitlist · paid extra revisions ·
image upload, storage, and watermarking (we store links; no image processing, per R4) · a real payment gateway (simulated) ·
notifications by email or push · a mobile app.

## 1.d Main flow

1. Artist *rara* publishes a pricelist (Half body from Rp250.000, Background +Rp50.000, DP 50%, 2 free revisions).
2. Rara opens *October comms* with **3 slots**, from 1 Oct 19:00 WIB to 31 Oct.
3. At 19:00, clients send requests. A request holds nothing — the artist decides.
4. Rara reviews a request against her TOS and **accepts** it with a quote of Rp350.000. Accepting **keeps** one slot, and a DP invoice for Rp175.000 is issued, due in 1×24 hours.
5. When every slot is kept or taken, the next **accept** is rejected with **"slots full"**. (If she declines instead, nothing was held.)
6. The client pays. The payment provider confirms it, the slot becomes **taken**, and the commission joins Rara's **queue**.
   (If the DP isn't paid by the deadline, the slot is freed.)
7. Rara sends a sketch. The client asks for one revision, then approves the new sketch.
8. Rara sends the final preview. A pelunasan invoice for Rp175.000 is issued.
9. The client pays. The provider confirms it, the hi-res link is released, and the commission is **completed**.

## 1.e Hard rule and load

**Hard rule:** an artist never gets more commissions in a window than the slots they opened, however many clients
are competing for the last one. *(Related rule: a payment is applied exactly once, even if the provider's callback
arrives twice.)*

**Load:** load arrives in spikes. Eja, the artist we interviewed, reaches about a thousand people with one post; her
last five-slot round drew fifteen to twenty serious enquiries and was full inside thirty to sixty minutes. The
collisions are few but real — she has already had two clients arrive together for the last slot, and handles it today
by telling one of them to wait. Everyone who misses out needs a quick, clean "slots full". A
second, smaller burst follows as accepted clients pay their DP before the 1×24-hour deadline and the provider sends its
callbacks, sometimes more than once.
