# 2. The domain: interview and event storming

The outside person should be an **artist who has run at least one open comm with slots**. A frequent commissioner is
the second-best choice. They give a 20-minute interview first, then join the 90-minute session.

## 20-minute interview

Moved to its own file: **[2-interview.md](2-interview.md)** — roles, a minute-by-minute budget, the questions
marked by priority, how to harvest the glossary in the artist’s own words, and the probe for the two terms that
change meaning across the business.

## 90-minute session agenda (Appendix B)

| Min | Step | Notes |
|---|---|---|
| 0–5 | Set the scope | "From deciding to open comms to the client having the final file." |
| 5–30 | **Flood the wall** (silent) | Orange notes, past tense, one event per note. **Don't show the candidate list below yet**; it would bias the flood. |
| 30–50 | Put them in order | Timeline left to right. Keep duplicates. Mark disagreements with a red "hot spot" note. |
| 50–65 | Add who and what | Blue: the action (command). Yellow: who did it (artist, client, provider, clock). |
| 65–85 | Find aggregates | Group events that happen to the same *thing*. Name each group in the artist's words. |
| 85–90 | Find contexts | Look for groups that talk constantly to each other, and for words that change meaning across a gap. |

**When two people argue about what a word means, stop and write both meanings down.**
Photograph the wall at every step. The report needs the photo or board export.

Tip: Miro, FigJam, or Excalidraw work well if you run it online. Export the board at the end.

## Candidate events (team prep, 30 events)

This is our own list, used to check coverage **after** the silent flood. The typed list in the report must come from
the session. Keep what the artist confirms, rename to their words, and drop what they reject.

| # | Event | Triggered by | Probable aggregate |
|---|---|---|---|
| 1 | Pricelist Published | Artist | Pricelist |
| 2 | Window Scheduled | Artist | CommissionWindow |
| 3 | Comms Opened | Clock | CommissionWindow |
| 4 | Slot Requested | Client | CommissionRequest |
| 5 | Slot Kept | System | CommissionWindow |
| 6 | Request Rejected: Slots Full | System | CommissionWindow |
| 7 | Window Went Full | System | CommissionWindow |
| 8 | Request Accepted | Artist | CommissionRequest |
| 9 | Quote Raised Above Start-From Price | Artist | CommissionRequest |
| 10 | Request Declined | Artist | CommissionRequest |
| 11 | Slot Released | System | CommissionWindow |
| 12 | DP Invoice Issued | Booking | Invoice |
| 13 | Settlement Received | Payment provider | Invoice |
| 14 | Duplicate Settlement Ignored | Payment provider | Invoice |
| 15 | Invoice Paid | Payments | Invoice |
| 16 | Slot Taken | System | CommissionWindow |
| 17 | Request Booked | System | CommissionRequest |
| 18 | DP Deadline Passed | Clock | CommissionRequest |
| 19 | Invoice Voided | Booking | Invoice |
| 20 | Request Expired | System | CommissionRequest |
| 21 | Commission Queued | Studio | Commission |
| 22 | Sketch Sent | Artist | Commission |
| 23 | Revision Requested | Client | Commission |
| 24 | Revision Limit Reached | System | Commission |
| 25 | Sketch Approved | Client | Commission |
| 26 | Final Preview Sent | Artist | Commission |
| 27 | Pelunasan Invoice Issued | Studio | Invoice |
| 28 | Final File Released | System | Commission |
| 29 | Commission Completed | System | Commission |
| 30 | Comms Closed | Artist / Clock | CommissionWindow |

## Hot spots to raise if they don't come up on their own

**Settled already — do not re-ask as open questions.** The 20-minute interview answered these
([2-findings.md](2-findings.md)), and the build now implements them. Raise them only to *check* the wall against what
we have, and only after the flood:

- **When is a slot kept?** Settled: at **accept**, not at request and not at DP. Booked at DP. Explicitly *not*
  first-to-pay — Eja keeps it for whoever he accepted first.
- **Is "full" the same as "closed"?** Settled: no. *"full itu soal slotnya, closed itu soal aku masih nerima comm
  atau nggak."* He can close before full.
- **Is the revision counter automatic?** Settled: no. He classifies each change by redraw effort, not message count.

**Genuinely open — these are what the session is for.** Each one is a decision the code currently makes on its own
authority, with nobody outside the team having confirmed it:

| Hot spot | What the build assumes today |
|---|---|
| A DP lands **after** the deadline, once the slot is already released. What then? | The invoice is `VOID` and the money is **unmodelled**. This is a real gap, not a hypothetical |
| Is the 1×24 jam counted from the client's request or from the artist's accept? | From accept |
| Can the artist take back a slot after accepting? What happens to the DP? | Forbidden: `decline` works only before accept |
| One slot per client per window, or two for two characters? | One, enforced by a partial unique index |
| Does he ever close comms early, before the slots run out? | Supported |
| Is **Quote Proposed → Quote Accepted** a real back-and-forth, or one artist action? | One action: accept carries the quote. [2-findings.md](2-findings.md) §4 flags this as worth watching for on the wall |

**When two people argue about what a word means, stop and write both meanings down.** Both meaning-shifts we already
have (*fix*, *comm*) came out of that kind of moment.
