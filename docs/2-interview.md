# 2. The domain: the 20-minute interview

> **Done — run with Eja on 2026-09-22.** His answers are in [2-findings.md](2-findings.md) and his vocabulary is in
> [2-glossary.md](2-glossary.md). This file stays as the record of how the interview was conducted, and because the
> same rules apply again at the [90-minute session](2-event-storming.md), which has not happened yet.

The outside person should be an **artist who has run at least one open comm with slots**. A frequent commissioner is
the second-best choice. They give this interview first, then join the [90-minute session](2-event-storming.md).

The interview has three jobs, in this order of value:

1. **Collect their words.** The glossary is graded on the language *they* use (§3.2). Every term written in their
   phrasing is a mark; every term written in ours is a mark lost.
2. **Settle the hot spot.** When is a slot really theirs? This decides where the hard rule lives, and it blocks the build.
3. **Get real numbers.** How many followers, how fast a window fills, how many comms a month. Report §1.e needs two
   sentences on where the load comes from, and invented figures will not survive the Week 5 demo.

## Before you walk in

- **Split the roles.** One person asks. One person writes **verbatim quotes**, not summaries. One person watches the
  clock and tracks which must-asks are still unanswered. Do not all three ask questions.
- **Ask permission to record** at the start, and say why: "so we can quote your exact words, not our paraphrase."
  If they say no, the note-taker's job becomes the whole interview — slow down and accept fewer questions.
- **Bring** the pricelist or open-comm post from their last round if it is public. Asking about a real artefact in
  front of you beats asking in the abstract.
- **The one rule:** never say a word first that you want them to say back. Do not ask "so the slot is *kept*?" —
  ask "what do you call that?" Our draft vocabulary (window, keep, taken, quote) is a hypothesis, not a script.

## Time budget

| Min | Part | Must leave with |
|---|---|---|
| 0–2 | Consent, what we're building, warm-up | Them talking, not us |
| 2–7 | **A. The last round, start to finish** | The narrative in their sequence, their nouns |
| 7–11 | **B. Slots and the hot spot** | When a slot becomes theirs — the C11 answer |
| 11–14 | **C. Money** | DP timing, ghosting, any double-payment story |
| 14–17 | **D. The work** | Revisions, what counts, when the file goes out |
| 17–19 | **E. Load and the worst day** | Real numbers, one horror story |
| 19–20 | Close | Session confirmed, permission to follow up |

Twenty minutes is about **12 real questions**. Every question below is marked ★ (must ask), ○ (ask if on time),
or · (drop first). If you get an hour instead of twenty minutes, ask everything.

---

## A. The last round, start to finish (2–7)

★ **A1. Walk me through your last open comm — from the moment you decided to open, to sending the final file.**

Let this run. Do not interrupt for three minutes. This single answer usually produces half the glossary and the whole
event timeline. The note-taker writes down every noun and verb they use, spelled their way.

○ **A2.** *(after they finish)* **Was that round typical, or was something unusual about it?**

· **A3.** How did you run comms before you settled on this way? What changed?

## B. Slots and the hot spot (7–11) — the part that cannot be skipped

★ **B1. How did you decide on that number of slots last time?**
*Listening for: is capacity about time, money, energy, or a round number? This is why the limit exists at all.*

★ **B2. Someone messages you wanting a slot. Walk me through what happens between that message and you starting to draw.**
*Let them narrate. Do not offer stages.*

★ **B3. At what point in that is the slot actually theirs — so that if someone else asked, you would say no?**

This is **the** question. Our draft assumes the slot is held at request time. If they say "only once DP masuk," the
hard rule moves to the payment step and the contracts need revising before anyone writes code. Push gently for
precision: *"So if two people fill the form and neither has paid, how many slots are left?"*

★ **B4. Has anyone ever ended up with a slot that didn't exist — more takers than slots? What did you do?**
*This is the hard rule, told as a story. Get the story; it belongs in the report.*

○ **B5.** Can one person take two slots in the same round? Has anyone tried?

○ **B6.** What do you say when someone asks and there is nothing left? What do you call that state?
*Listening for whether "full" and "closed" are the same thing to them. The glossary currently claims they differ.*

## C. Money (11–14)

★ **C1. How much do you ask up front, and how long do you wait for it?**
*Get the number and the unit in their words — "DP 50%", "1×24 jam".*

★ **C2. What happens when someone doesn't pay in time? Tell me about the last time that happened.**

○ **C3. Has it ever been unclear whether someone actually paid? Or have you ever been paid twice for the same thing?**
*This is the second hard rule — exactly-once settlement. A real story here is worth a paragraph in the report.*

○ **C4.** Do you ever charge more than the pricelist says? When?
*Probing whether the agreed price is a separate thing from the advertised one — a likely meaning-shift.*

· **C5.** How do people pay you? Does anything about that process annoy you?

## D. The work (14–17)

★ **D1. After someone has paid and you start drawing — what are the stages, and what does the client see at each one?**
*Listening for: how many internal stages they have, and which of them the client is shown. The gap between those two
is exactly what the studio service should hide.*

★ **D2. What counts as a revision? What doesn't?**
*The line between "revisi" and "fixing a small thing" is usually fuzzy and always contested. Get their line.*

○ **D3.** When do you send the full-resolution file? Has anyone ever got it before finishing payment?

· **D4.** Do you watermark previews? Has anyone used a preview without paying?

## E. Load and the worst day (17–19)

★ **E1. When you post "open comm", how many people see it, and how fast do the slots go?**
*Needed for report §1.e. Ask for the last round's actual numbers: followers, how long until full, how many messages
in the first hour.*

★ **E2. What is the most annoying part of running comms?**
*Almost always produces the sharpest quote in the interview, and often reveals a rule nobody had modelled.*

○ **E3.** Has a round ever gone really badly? What happened?

## Close (19–20)

- Confirm the 90-minute session: date, time, place or link.
- Ask if you may message them with follow-up questions as you build.
- Ask whether they would be willing to look at the thing once it runs.

---

## Harvesting the glossary while you talk

The graded artefact is **12+ terms in their words**, so collect them during the interview, not from memory afterwards.

- The note-taker keeps a **separate word list** running down the side of the page. Every time the artist uses a domain
  noun — *slot, keep, DP, pelunasan, antrian, revisi, WIP, TOS, close comm* — it goes on the list as they said it,
  Indonesian or English, before it is understood.
- When a word appears that you don't know, **ask them to define it and write the definition in their sentence**:
  *"You said 'di-keep' — what does that mean exactly?"* Their sentence is the glossary entry. Ours isn't.
- Do **not** correct their terminology to match [2-glossary.md](2-glossary.md). Where it disagrees with them, they are
  right and it is wrong. That is exactly what happened: the terms Eja used now lead that file, and our drafted
  equivalents were moved into a separate table below them.

## Hunting the two meaning-shifts

The grading criterion names this explicitly, and it is the most useful thing you can come out with, because a word that
changes meaning marks a service boundary. It rarely appears on its own — you have to fish for it.

The probe, used live whenever they repeat a word in two different situations:

> **"You used *[word]* just now about [situation A], and earlier about [situation B]. Is it the same thing to you?"**

Candidates worth watching for, from the draft glossary:

| Word | Might mean, while filling slots | Might mean, while drawing |
|---|---|---|
| **comm / komisi** | a slot in the round — a unit of capacity | the artwork itself, with stages and revisions |
| **price / harga** | the advertised start-from in the pricelist | the deal agreed with this one client |
| **full** | no free slot right now | no longer accepting anything at all |
| **selesai / done** | the client has paid | the file has been delivered |

If they hesitate, say *"well, it depends"*, or give two different answers — **stop and write both down**. That hesitation
is the finding. You need two of these, and getting them here means you are not depending on the storming session for a
graded item.

## If you only get five minutes

Ask **B3, B4, C1, D2, E1**. Those five carry the hot spot, the hard rule, the money rule, the contested boundary, and
the load figures.

## In the ten minutes after

Do this before leaving the room or closing the call — not that evening.

1. Each of the three writes down, separately, **the one thing that surprised them**. Compare. Disagreements are hot spots.
2. Transfer the word list into [2-glossary.md](2-glossary.md): tick **Confirmed** on terms they actually used, rewrite the
   wording to theirs, delete terms they never said.
3. Write the C11 answer at the top of [0-checklist.md](0-checklist.md) in one sentence. If it is not "at request", raise it
   with the whole team the same day — it changes the contracts.
4. Note anything that contradicts [1-app.md](1-app.md) or [2-aggregates.md](2-aggregates.md). Those are cheap to fix now and
   expensive to fix after the build.

## What not to do

- Don't ask yes/no questions. "Do you keep the slot when they ask?" gets a yes and teaches you nothing.
- Don't ask about the system you are building. Ask about the work they already do.
- Don't explain microservices, aggregates, or bounded contexts. They do not need the vocabulary, and it will bend their
  answers toward ours.
- Don't defend the draft design when they contradict it. Write down the contradiction and thank them for it.
