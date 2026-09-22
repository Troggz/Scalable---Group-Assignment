# Docs index and assignment checklist

Each file matches one section of the report (8 pages max). Anything marked **DRAFT** was written *before* the interview
and the event-storming session. The assignment grades the domain language the outside person actually uses,
so after the session, go back and replace or confirm every draft term.

| File | Report section | Status |
|---|---|---|
| [0-checklist.md](0-checklist.md) | Every requirement, done and not done | Tick as you go |
| [proposal.md](proposal.md) | Week 2 one-page proposal | Draft: fill in names and the interviewee |
| [1-app.md](1-app.md) | 1 The app (Step 1, items 1.a–1.e) | Draft |
| [2-interview.md](2-interview.md) | 2 The domain: the 20-minute interview guide | Done — ran with Eja, 2026-09-22 |
| [2-event-storming.md](2-event-storming.md) | 2 The domain: session agenda, candidate events, hot spots | Prep. The session ran 2026-09-22 — results in [2-board.md](2-board.md) |
| [2-run-sheet.md](2-run-sheet.md) | 2 The domain: how the 90 minutes was run | Session done 2026-09-22 |
| [2-board.md](2-board.md) | 2 The domain: the board, 24 events, and what it found the build does not do | The §3.1 hand-in |
| [2-findings.md](2-findings.md) | 2 The domain: findings from the interview, C11 settled, scope guards | Real evidence from Eja |
| [2-glossary.md](2-glossary.md) | 2 The domain: glossary and context-dependent terms | Done — 13 terms in Eja's words, plus both meaning-shifts |
| [2-aggregates.md](2-aggregates.md) | 2 The domain: aggregate cards | Draft |
| [2-contexts.md](2-contexts.md) | 2 The domain: bounded contexts | Draft |
| [3-option-b.md](3-option-b.md) | 3 The boundaries: the contract revision we prepared in case C11 resolved to "at DP" | Never applied — Eja settled it at accept. Keep as evidence the domain decided the design |
| [3-boundaries.md](3-boundaries.md) | 3 The boundaries: diagram, coupling, cost of change, what each service hides | Draft |
| [4-build-plan.md](4-build-plan.md) | 4 The build: thin-build script, hard-rule enforcement, screencast plan, incident log | Built and passing; incident log started |
| [../client/](../client/) | 4 The build: the thin client (B1) | `demo.http` plus three scripts |
| [../contracts/](../contracts/) | Contracts (4.4) | v1, committed before any service code |

## Deadlines

| When | What |
|---|---|
| End of Week 2 | One-page proposal on the LMS. **If two teams pick the same app, the first proposal wins**, so submit early. |
| End of Week 4, 23:59 WIB | Report PDF, repository link, and a 3-minute screencast |
| Week 5 lab | 15-minute demo: 7 minutes live, 8 minutes of questions |

## Grading map

| Pts | Criterion | Where we answer it | Done |
|---|---|---|---|
| 15 | App fits R1–R4; users, features, main flow, hard rule | 1-app.md | ☐ |
| 15 | Event storming with the outside person; 20+ events; glossary with 2 context-dependent terms | [2-board.md](2-board.md), [2-glossary.md](2-glossary.md), board export | ☑ |
| 15 | Aggregates with real rules; contexts drawn from the domain, not the tables | 2-aggregates.md, 2-contexts.md | ☐ |
| 15 | Coupling table labelled correctly; one bad coupling found and fixed | 3-boundaries.md §3.2 | ☐ |
| 10 | Cost-of-change test; contracts written before code; what each service hides | 3-boundaries.md §3.3–3.4, /contracts | ☐ |
| 10 | Main flow runs from a clean clone by following the README | README.md, 4-build-plan.md | ☐ |
| 10 | Data ownership enforced (B2, B3) | 4-build-plan.md §B2 proof | ☐ |
| 5 | One service changed and restarted alone, on video and live (B4) | 4-build-plan.md §Screencast | ☐ |
| 5 | Reflection: specific and honest | 4-build-plan.md incident log → report §5 | ☐ |

**Deductions to avoid:** shared DB or cross-service table access (−10) · services that must be deployed together (−10) ·
services named after layers or tables (−5) · more than 3 services (−5) · contracts written after code (−5) ·
uneven contribution (up to −10 each).

## Open decisions (team)

- [x] App name **OpenComm**; also the team name. Decided 2026-09-21.
- [x] Owners: Thomas → `booking`, Ethan → `payments`, Asthar → `studio`; each reviews the next.
- [ ] Interviewee: an artist who has run at least one open comm with slots. They must also attend the 90-minute session.
- [x] **Stack: Node.js + PostgreSQL**, one database and one login role per service (makes B2 easy to prove). Decided 2026-09-21.
- [ ] Hold durations for the demo (real: DP within 1×24 hours; demo: a few minutes, set by an environment variable).
