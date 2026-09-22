# Event storming — facilitator run sheet

One page, for whoever is running the 90 minutes. Keep it on your phone. The reasoning behind each step is in
[2-event-storming.md](2-event-storming.md); this is only what to do and when.

**Session:** three members + Eja. **Length:** 90 minutes. **Hand-ins:** board photo/export, typed list of 20+ events.

---

## Before anyone sits down

- [ ] **Roles fixed.** Facilitator (talks, watches the clock). Scribe (types events live into a second file — do not
      rely on reading the photos back). Photographer (also plays the clock/system actor when ordering).
- [ ] Orange, blue, yellow and red notes, or four colours in Miro / FigJam / Excalidraw.
- [ ] Phone charged. The board photo is a hand-in and cannot be reconstructed afterwards.
- [ ] **Nothing of ours is on screen.** No app demo, no contracts, no 30-event candidate list, no findings doc.

> **The one rule.** We built the thing already, which means the whole value of this session is that it can still
> contradict us. If she only confirms what exists, we walk away with nothing for report §5.c. When she says something
> that clashes with the build, *write it down as a clash* — do not explain the build at her. Explaining comes after
> minute 85, if at all.

---

## The 90 minutes

**0–5 · Set the scope.** Say it out loud, once:

> "From you deciding to open comms, to the client having the final file. Anything in between is fair game."

**5–30 · Flood the wall. Silent.** Orange notes. Past tense. One event per note. No ordering, no debate, no talking —
including us. Quantity first. If she stalls around minute 20, prompt with a *phase*, never with an event: "what about
after the sketch?" not "what about Sketch Approved?"

📸 **Photo 1** — the messy wall, before any ordering.

**30–50 · Put them in order.** Rough timeline, left to right. **Keep duplicates.** When something is argued about or
uncertain, stick a red note on it and move on — do not resolve it now.

📸 **Photo 2** — the timeline with the red notes visible. *This is the most valuable photo for the report.*

**50–65 · Add who and what.** Blue = the action that caused the event. Yellow = who did it: artist, client, payment
provider, clock.

**65–85 · Find the aggregates.** Group events that happen to the same *thing* across its life. Name each group **in
her words**, not ours — if the group is "comm", it is called comm.

📸 **Photo 3** — the grouped board.

**85–90 · Find the contexts.** Which groups talk constantly to each other and rarely to anything else? Where does a
word change meaning across the gap? That gap is the boundary.

📸 **Photo 4** — final board. Then export, if it is online.

---

## Say this whenever it happens

> **"Wait — say that again?"**

Every time she uses a word we have not written down, or uses one of ours to mean something different. Both meaning
shifts we already have (*fix*, *comm*) came out of exactly that moment. The glossary is at **13 terms**, past the 12
required — so this is now about confirming the ones we have and catching anything new, not scraping for a quota.

---

## Probes — only after minute 30, only if they have not come up

Do not read these during the flood. They are decisions the code currently makes on its own authority:

1. A DP arrives **after** the deadline, slot already given away. What do you actually do? *(The build has no answer
   for the money. Real gap.)*
2. The 1×24 jam — counted from when they ask, or from when you say yes?
3. Have you ever taken back a slot after saying yes? What happened to the DP?
4. Can one person take two slots in one round, for two characters?
5. Do you ever close comms early, before the slots are gone?
6. When you quote a price — is that a back-and-forth, or do you just say the number and they accept?

## While she is here, unrelated to the wall

- [ ] One **oversell story** and one **payment-confusion story**, told as incidents. These are the two hard rules,
      in her voice.
- [ ] Permission to quote her by name in the report, and to use the board photo.

---

## Within an hour of finishing, before anyone goes home

- [ ] Type the event list up — **20+, from the wall, not from our candidate list.**
- [ ] Merge the new terms into [2-glossary.md](2-glossary.md), spelled the way she spells them.
- [ ] Write down every place the wall and the build disagree. That list *is* report §5.c, and an honest one scores
      better than a tidy story.
- [ ] Dump the photos into the repo now, while you still know which is which.
