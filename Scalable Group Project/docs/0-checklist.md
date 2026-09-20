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
| A1 | Git repository initialised | §6 Repository | ⚠ ☐ | `git init` has never been run here |
| A2 | First commit is `/docs` + `/contracts`, no service code | Deduction −5 | ⚠ ☐ | Must land before anyone writes a service |
| A3 | Public repo on GitHub/GitLab, link submitted | §6 | ☐ | Private is fine if the instructor is a collaborator |
| A4 | Layout: `/README.md`, `/docs/`, `/contracts/`, `/services/<name>/` | §6 | ☑ | Matches the handout |
| A5 | `.gitignore` (no `.env`, no `node_modules`) | B2 hygiene | ☑ | |
| A6 | Team name, three names, three NIMs | §6 front page | ☐ | Placeholders in [proposal.md](proposal.md) |
| A7 | One owner per service, each reviews another | B5 | ◐ | Rotation designed in [../README.md](../README.md); names are `_TBD_` |
| A8 | Stack decided (language, framework, database) | §5 | ☐ | Open decision in [README.md](README.md) |
| A9 | Week 2 proposal submitted to LMS | Week 2, mandatory | ☐ | [proposal.md](proposal.md) still has `_name_`, `_date_`; app claim is first-come |
| A10 | Outside person confirmed, interview + session booked | §2, §3.1 | ☐ | Artist who has run an open comm with slots |

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
| C1 | 20-minute interview conducted | §3.1 | ☐ | Guide is written in [2-event-storming.md](2-event-storming.md) |
| C2 | 90-minute event storming with the outside person | §3.1, App. B | ☐ | Agenda is written; session has not happened |
| C3 | Board photo or export | §3.1 hand-in | ☐ | Photograph at every step, not just the end |
| C4 | Typed list of 20+ events **from the session** | §3.1 hand-in | ☐ | The 30 candidate events are prep, explicitly not the hand-in |
| C5 | Glossary, 12+ terms in the artist's own words | §3.2 | ◐ | 21 terms in [2-glossary.md](2-glossary.md), none ticked Confirmed |
| C6 | Two terms that change meaning across the business | §3.2 | ◐ | "Comm" and "price" drafted, plus two backups; unconfirmed |
| C7 | Four or more aggregate cards: identity, states, rules, hides | §3.3 | ☑ | Five cards in [2-aggregates.md](2-aggregates.md) |
| C8 | One aggregate carries the hard rule | §3.3 | ☑ | CommissionWindow |
| C9 | Three to five bounded contexts, each aggregate in exactly one | §3.4 | ☑ | Four contexts in [2-contexts.md](2-contexts.md) |
| C10 | Contexts are business activities, not tables | §3.4 quick check | ☑ | Booking, Pricelist, Payments, Studio |
| C11 | Resolve the hot spot: is a slot kept at request, accept, or DP? | §3.1 | ☐ | **Blocks the build.** A "DP" answer moves the hard rule and redraws the boundary |

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
| D9 | Contracts committed **before** the code | §4.4, −5 | ⚠ ☐ | Written but uncommitted; depends on A2 |
| D10 | Three hidden decisions per service + what stops a breaking change | §4.4 | ☑ | [3-boundaries.md](3-boundaries.md) §3.4 |

## E. Step 4 — The thin build (10 + 10 + 5 pts)

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| E1 | Two or three services plus a thin client, not four | B1 | ◐ | Three service folders exist, but hold only READMEs |
| E2 | `booking` service running | §5 | ☐ | |
| E3 | `payments` service running | §5 | ☐ | |
| E4 | `studio` service running | §5 | ☐ | |
| E5 | Thin client: `.http`, Postman, Bruno, or a CLI | B1 | ☐ | Nothing exists yet |
| E6 | Own database and own login role per service | B2 | ☐ | SQL drafted in [4-build-plan.md](4-build-plan.md) |
| E7 | Proof: a neighbour's credentials are refused | B2 | ☐ | `psql -U booking_user -d payments_db` must fail |
| E8 | No shared entity classes; dependency files show plumbing only | B3 | ☐ | |
| E9 | Hard rule as one conditional `UPDATE`, never read-then-write | Hard rule | ☐ | The read-then-write version passes the demo and fails E12 |
| E10 | Exactly-once settlement: unique `provider_ref` | Hard rule | ☐ | |
| E11 | Idempotent receivers for InvoicePaid | Contracts | ☐ | |
| E12 | Concurrency check: 20 parallel requests on 3 slots → 3×201, 17×409 | Hard rule under load | ☐ | Step 5 of the demo script |
| E13 | Duplicate callback returns `applied: false` | Hard rule | ☐ | Step 8 of the demo script |
| E14 | Demo script steps 1–14 pass end to end | §5 | ☐ | [4-build-plan.md](4-build-plan.md) |
| E15 | Seed data (`rara`, `budi`, `sari`, `dimas`, `ayu`) | B6 | ☐ | |
| E16 | Root README "How to run", verified on a clean clone | B6 | ☐ | Placeholder in [../README.md](../README.md) |
| E17 | Change one service, restart only it, others stay up | B4 | ☐ | |
| E18 | Each owner commits their own service | B5, −10 | ☐ | |

## F. Report, screencast, submission

| # | Item | Required by | Status | What's left |
|---|---|---|---|---|
| F1 | Report PDF, 8 pages max, front page with team and NIMs | §6 | ☐ | The docs are sources, not the report |
| F2 | §1 The app | §6.1 | ◐ | Source ready |
| F3 | §2 The domain, with the board photo | §6.2 | ☐ | Blocked on C1–C4 |
| F4 | §3 The boundaries | §6.3 | ◐ | Source ready; diagrams need exporting |
| F5 | §4 The build, what runs and what does not | §6.4 | ☐ | |
| F6 | §5.a Which Chapter 1 cost hit first, named incident | §6.5 | ☐ | Incident log in [4-build-plan.md](4-build-plan.md) is empty |
| F7 | §5.b Would a modular monolith have been better? | §6.5 | ☐ | Honest answer scores full marks |
| F8 | §5.c What event storming changed about the design | §6.5 | ☐ | Blocked on C2 |
| F9 | Screencast, 3 minutes, in the prescribed order | §5.1 | ☐ | Flow with the rejection, then one service restarted alone |
| F10 | `docs/report.pdf` in the repo | §6 layout | ☐ | |
| F11 | Submitted to LMS by end of Week 4, 23:59 WIB | §1 | ☐ | |
| F12 | Week 5 lab demo, 7 minutes live + 8 of questions | §1 | ☐ | |

## G. Deduction guards

| # | Guard | Cost | Status | Note |
|---|---|---|---|---|
| G1 | No shared database, no cross-service table access | −10 | ◐ | Designed, not yet provable |
| G2 | No services that must be deployed together | −10 | ◐ | Cost-of-change test says no; the build must confirm |
| G3 | No service named after a layer or table | −5 | ☑ | booking, payments, studio |
| G4 | At most three services | −5 | ☑ | Pricelist stays a module for this reason |
| G5 | Contracts committed before the code | −5 | ⚠ ☐ | See A2 and D9 |
| G6 | Even contribution, visible in README and history | up to −10 each | ☐ | Depends on A7 and E18 |

---

## The short version

1. `git init`, commit `/docs` and `/contracts`, push. Do this before any service code (A1, A2, G5).
2. Fill in the team, owners, and interviewee; submit the proposal (A6, A7, A9).
3. Interview, then event storming. Rewrite the glossary in the artist's words and settle C11 (C1–C6, C11).
4. Pick the stack; each owner builds their service against the contracts, stubbing the others (A8, E2–E4).
5. Wire up, run the demo script including the concurrency check, write the README from a clean clone (E14–E16).
6. Screencast, then the report PDF (F1–F11).
