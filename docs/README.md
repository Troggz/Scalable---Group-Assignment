# Docs index and assignment checklist

Each file matches one section of the report (8 pages max). Anything marked **DRAFT** was written *before* the interview
and the event-storming session. The assignment grades the domain language the outside person actually uses,
so after the session, go back and replace or confirm every draft term.

| File | Report section | Status |
|---|---|---|
| [0-checklist.md](0-checklist.md) | Every requirement, done and not done | Tick as you go |
| [proposal.md](proposal.md) | Week 2 one-page proposal | Draft: fill in names and the interviewee |
| [1-app.md](1-app.md) | 1 The app (Step 1, items 1.a–1.e) | Draft |
| [2-event-storming.md](2-event-storming.md) | 2 The domain: interview guide, session agenda, candidate events | Prep; the session hasn't happened |
| [2-glossary.md](2-glossary.md) | 2 The domain: glossary and context-dependent terms | **DRAFT**: confirm in interview |
| [2-aggregates.md](2-aggregates.md) | 2 The domain: aggregate cards | Draft |
| [2-contexts.md](2-contexts.md) | 2 The domain: bounded contexts | Draft |
| [3-boundaries.md](3-boundaries.md) | 3 The boundaries: diagram, coupling, cost of change, what each service hides | Draft |
| [4-build-plan.md](4-build-plan.md) | 4 The build: thin-build script, hard-rule enforcement, screencast plan, incident log | Plan |
| [../contracts/](../contracts/) | Contracts (4.4) | v1 draft: commit before any code |

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
| 15 | Event storming with the outside person; 20+ events; glossary with 2 context-dependent terms | 2-event-storming.md, 2-glossary.md, board photo | ☐ |
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

- [ ] Final app name. "OpenComm" is a working title.
- [ ] Who owns which service; reviewer rotation.
- [ ] Interviewee: an artist who has run at least one open comm with slots. They must also attend the 90-minute session.
- [ ] Stack. Suggested: Node.js 24 + PostgreSQL, with one database and one login role per service (makes B2 easy to prove).
- [ ] Hold durations for the demo (real: DP within 1×24 hours; demo: a few minutes, set by an environment variable).
