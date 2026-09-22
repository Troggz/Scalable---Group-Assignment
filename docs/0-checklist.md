# Assignment 1 checklist

Every requirement from the handout, with where it lives and what is left. Tick as you go.

**Legend:** ☑ done · ◐ drafted, needs confirming or exporting · ☐ not started · ⚠ losing points right now

| Status | Meaning |
|---|---|
| ☑ | Finished; nothing left unless the domain changes |
| ◐ | Written, but unconfirmed, unproven, or not in its final form |
| ☐ | Not started |
| ⚠ | Costs a deduction or points if the assignment were graded today |

---

## A. Repository and admin

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| A1 | Git repository initialised | §6 Repository | ☑ | Pushed to `Troggz/Scalable---Group-Assignment` |
| A2 | First commit is `/docs` + `/contracts`, no service code | Deduction −5 | ☑ | Committed with no service code present; keep it that way until the contracts are final |
| A3 | Public repo on GitHub/GitLab, link submitted | §6 | ◐ | Confirmed public (unauthenticated API read succeeds); **link still to submit** |
| A4 | Layout: `/README.md`, `/docs/`, `/contracts/`, `/services/<name>/` | §6 | ☑ | At the repository root, as the handout requires |
| A5 | `.gitignore` (no `.env`, no `node_modules`) | B2 hygiene | ☑ | |
| A6 | Team name, three names, three NIMs | §6 front page | ☑ | Team **OpenComm**; three names and NIMs in [proposal.md](proposal.md) and [proposal.pdf](proposal.pdf) |
| A7 | One owner per service, each reviews another | B5 | ☑ | Thomas → `booking`, Ethan → `payments`, Asthar → `studio`; each reviews the next ([../README.md](../README.md)) |
| A8 | Stack decided (language, framework, database) | §5 | ☑ | **Node.js + PostgreSQL**, one DB and one role per service |
| A9 | Week 2 proposal submitted to LMS | Week 2, mandatory | ◐ | [proposal.pdf](proposal.pdf) complete except the four interviewee fields (name, rounds, platform/handle, two dates). Fill after 2026-09-22 and submit; app claim is first-come |
| A10 | Outside person confirmed, interview + session booked | §2, §3.1 | ◐ | Eja confirmed and interviewed 2026-09-22; **the 90-minute session still needs booking** |

## B. Step 1 — The app (15 pts)

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| B1 | 1.a The app in one paragraph | 1.a | ☑ | [1-app.md](1-app.md) |
| B2 | 1.b At least two kinds of users | 1.b, R1 | ☑ | Artist and client |
| B3 | 1.c Ten features max, plus exclusions | 1.c | ☑ | Exactly 10, with a "left out" list |
| B4 | 1.d Main flow as a numbered sequence | 1.d, R3 | ☑ | Crosses booking, payments, studio |
| B5 | 1.e Hard rule in one sentence + two on load | 1.e, R2 | ☑ | |
| B6 | Not a marketplace, no ML or image processing | R4 | ☑ | Argued in [proposal.md](proposal.md) |
| B7 | Section 1 copied into the report | §6.1 | ☐ | |

## C. Step 2 — The domain (15 pts)

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| C1 | 20-minute interview conducted | §3.1 | ☑ | Eja, 2026-09-22, six questions answered in writing |
| C2 | 90-minute event storming with the outside person | §3.1, App. B | ☐ | Agenda is written; session has not happened |
| C3 | Board photo or export | §3.1 hand-in | ☐ | Photograph at every step, not just the end |
| C4 | Typed list of 20+ events **from the session** | §3.1 hand-in | ☐ | The 30 candidate events are prep, explicitly not the hand-in |
| C5 | Glossary, 12+ terms in the artist's own words | §3.2 | ☑ | **13 terms** in Eja's own words, leading [2-glossary.md](2-glossary.md); our own terms kept in a separate table below them |
| C6 | Two terms that change meaning across the business | §3.2 | ☑ | **"fix"** (booked vs a small correction) and **"comm"** (the round vs the job), both from Eja's own words |
| C7 | Four or more aggregate cards: identity, states, rules, hides | §3.3 | ☑ | Five cards in [2-aggregates.md](2-aggregates.md) |
| C8 | One aggregate carries the hard rule | §3.3 | ☑ | CommissionWindow |
| C9 | Three to five bounded contexts, each aggregate in exactly one | §3.4 | ☑ | Four contexts in [2-contexts.md](2-contexts.md) |
| C10 | Contexts are business activities, not tables | §3.4 quick check | ☑ | Booking, Pricelist, Payments, Studio |
| C11 | Resolve the hot spot: is a slot kept at request, accept, or DP? | §3.1 | ☑ | **Answered by Eja: kept at accept, booked at DP, and explicitly not first-to-pay.** Contracts need the Option C change ([2-findings.md](2-findings.md)) |

## D. Step 3 — The boundaries (15 + 10 pts)

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| D1 | Which contexts become services, which stay modules | §4.1 | ☑ | Three services, Pricelist as a module |
| D2 | One diagram: services, aggregates, every call | §4.1 | ◐ | Mermaid in [3-boundaries.md](3-boundaries.md); export to PNG for the PDF |
| D3 | Three Chapter 1 properties per service | §4.1 | ☑ | Table in [3-boundaries.md](3-boundaries.md) |
| D4 | Coupling table, one row per call, labelled from Appendix A | §4.2 | ☑ | Six rows, all Domain |
| D5 | One sentence of justification per row | §4.2 | ☑ | |
| D6 | One bad coupling found and fixed, before and after | §4.2 | ☑ | Two: pass-through and common |
| D7 | Cost-of-change test on three realistic changes | §4.3 | ☑ | Two touch one service, one touches two |
| D8 | A contract per service in `/contracts` | §4.4 | ☑ | Three OpenAPI 3.1 files |
| D9 | Contracts committed **before** the code | §4.4, −5 | ☑ | Committed while `/services` held only READMEs |
| D10 | Three hidden decisions per service + what stops a breaking change | §4.4 | ☑ | [3-boundaries.md](3-boundaries.md) §3.4 |

## E. Step 4 — The thin build (10 + 10 + 5 pts)

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| E1 | Two or three services plus a thin client, not four | B1 | ☑ | Three services plus [client/](../client/); no fourth service |
| E2 | `booking` service running | §5 | ☑ | All contract routes live, including the DP expiry sweep ([services/booking/src/expiry.js](../services/booking/src/expiry.js)) |
| E3 | `payments` service running | §5 | ☑ | Verified in the 2026-09-22 integration run |
| E4 | `studio` service running | §5 | ☑ | Verified in the 2026-09-22 integration run |
| E5 | Thin client: `.http`, Postman, Bruno, or a CLI | B1 | ☑ | [client/demo.http](../client/demo.http) for the demo, plus three scripts for the steps a request-at-a-time client cannot drive |
| E6 | Own database and own login role per service | B2 | ☑ | [infra/db/bootstrap.sql](../infra/db/bootstrap.sql) applied; three roles, three databases |
| E7 | Proof: a neighbour's credentials are refused | B2 | ☑ | `verify-isolation.sh` passes 9/9. **Screenshot the output for report §4** |
| E8 | No shared entity classes; dependency files show plumbing only | B3 | ☑ | All three depend on express + pg only, and on nothing shared |
| E9 | Hard rule as one conditional `UPDATE`, never read-then-write | Hard rule | ☑ | In `accept()`, [services/booking/src/requests.js](../services/booking/src/requests.js) |
| E10 | Exactly-once settlement: unique `provider_ref` | Hard rule | ☑ | `settlements.provider_ref` PK; duplicate callback returns `applied: false` |
| E11 | Idempotent receivers for InvoicePaid | Contracts | ☑ | Both tested. Studio killed mid-flow: booking answered 503, payments retried 6x, commission landed on restart |
| E12 | Concurrency check: 20 parallel **accepts** on 3 slots → 3×200, 17×409 | Hard rule under load | ☑ | **Passes**: 3 accepted, 17 `SlotsFull`, 168ms |
| E13 | Duplicate callback returns `applied: false` | Hard rule | ☑ | Step 8 passes |
| E14 | Demo script steps 1–16 pass end to end | §5 | ☑ | `flow.mjs` 28/28, `concurrency.mjs` 3×200/17×409 in 152ms, `expiry.mjs` 9/9 |
| E15 | Seed data (`rara`, `budi`, `sari`, `dimas`, `ayu`) | B6 | ☑ | No user table exists anywhere: an id travels in the request, and each client script sets up its own pricelist and window |
| E16 | Root README "How to run", verified on a clean clone | B6 | ☑ | **Verified 2026-09-22**: fresh `git clone`, followed the README as written, `flow.mjs` 28/28 and `concurrency.mjs` 3×200/17×409. Two snags found and documented (psql not on PATH, silent password prompt) |
| E17 | Change one service, restart only it, others stay up | B4 | ☑ | **Done 2026-09-22.** Changed booking's `SlotsFull` message, restarted booking alone. `uptimeSeconds` booking 29→31 (reset), payments 22→324, studio 14→317 (never restarted). Rule still holds: 3×200/17×409 |
| E18 | Each owner commits their own service | B5, −10 | ☑ | Thomas → booking, Ethan → payments, Asthar → studio, visible in `git log` |

## F. Report, screencast, submission

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| F1 | Report PDF, 8 pages max, front page with team and NIMs | §6 | ☐ | The docs are sources, not the report |
| F2 | §1 The app | §6.1 | ◐ | Source ready |
| F3 | §2 The domain, with the board photo | §6.2 | ☐ | Interview and glossary ready; blocked on C2–C4 (the board) |
| F4 | §3 The boundaries | §6.3 | ◐ | Source ready; diagrams need exporting |
| F5 | §4 The build, what runs and what does not | §6.4 | ☐ | |
| F6 | §5.a Which Chapter 1 cost hit first, named incident | §6.5 | ◐ | Two incidents logged in [4-build-plan.md](4-build-plan.md); pick one and write it up |
| F7 | §5.b Would a modular monolith have been better? | §6.5 | ☐ | Honest answer scores full marks |
| F8 | §5.c What event storming changed about the design | §6.5 | ☐ | Blocked on C2 |
| F9 | Screencast, 3 minutes, in the prescribed order | §5.1 | ☐ | Flow with the rejection, then one service restarted alone |
| F10 | `docs/report.pdf` in the repo | §6 layout | ☐ | |
| F11 | Submitted to LMS by end of Week 4, 23:59 WIB | §1 | ☐ | |
| F12 | Week 5 lab demo, 7 minutes live + 8 of questions | §1 | ☐ | |

## G. Deduction guards

| # | Guard | Cost | Status | Note |
|---|---|---|---|---|
| G1 | No shared database, no cross-service table access | −10 | ☑ | `verify-isolation.sh` 9/9; three databases, three roles, no cross-service connection string anywhere |
| G2 | No services that must be deployed together | −10 | ☑ | Confirmed: studio was down while booking and payments took a request, an accept and a payment |
| G3 | No service named after a layer or table | −5 | ☑ | booking, payments, studio |
| G4 | At most three services | −5 | ☑ | Pricelist stays a module for this reason |
| G5 | Contracts committed before the code | −5 | ☑ | See A2 and D9 |
| G6 | Even contribution, visible in README and history | up to −10 each | ◐ | Three owners, three service commits. Keep it that way through the report |

---

## The short version

1. ~~`git init`, commit `/docs` and `/contracts`, push~~ — done. Contracts are on record before any service code (A1, A2, G5).
2. ~~Fill in the team and owners~~ — done. The proposal still needs the interviewee fields and submitting (A9).
3. ~~Each owner builds their service against the contracts~~ — done. All three run, and the whole main flow was
   verified together on 2026-09-22: 24/24 checks, including 20 parallel accepts on 3 slots and a studio outage
   mid-payment (E2–E4, E10–E13, E17, G1, G2).
4. **Event storming with the artist, and the hand-in that comes out of it** (C2–C4). This is the next thing to do,
   and it blocks report §2 and §5.c. Photograph the board at every step.
5. Thin client, seed data, and the root README written from a clean clone (E5, E14–E16).
6. Screencast, then the report PDF (F1–F11).
