# OpenComm: slot booking for art commissions

> Working title. Semester project for *Scalable Software Engineering* (UGM, Ganjil 2026/2027), starting with Assignment 1.

Independent artists post "**open comm**": a window (e.g. October) with a fixed number of **slots**.
A client requests a slot and sends a brief. The artist accepts or declines it. The client pays a **DP** (deposit), and
the artist then works sketch → revisions → final. The hi-res file is released once the client pays the rest (**pelunasan**).

**Hard rule:** an artist never gets more commissions in a window than the slots they opened, even when
hundreds of clients press *Request* in the same second.

This is **not a marketplace** (rule R4). There is no browsing, search, ratings, chat, or escrow. Each artist shares a link to their own window.

## Services

| Service    | Bounded context(s)            | Port | Database / credentials         | Owner | Reviews   |
|------------|-------------------------------|------|--------------------------------|-------|-----------|
| `booking`  | Booking (+ Pricelist module)  | 3001 | `booking_db` / `booking_user`  | Thomas | `payments`|
| `payments` | Payments                      | 3002 | `payments_db` / `payments_user`| Ethan | `studio`  |
| `studio`   | Studio                        | 3003 | `studio_db` / `studio_user`    | Asthar | `booking` |

Every member owns one service and reviews the next one. Put the names in once they're decided.

## Repository layout

```
/README.md            what it is, how to run it, who owns what
/docs/                design docs that feed the report (start at docs/README.md)
/contracts/           one contract per service, committed BEFORE any service code
/services/<name>/     one folder per service, each with its own README
```

## How to run

_Not written yet. Service code comes after the contracts are committed._ This section will list:

1. Prerequisites (runtime and PostgreSQL version).
2. How to create the three databases and their users (a script in each service folder).
3. What to start and on which port. Design goal: **any start order works**, because a service needs only its own database to boot.
4. How to load seed data (artist `rara`, clients `budi`, `sari`, `dimas`, `ayu`).
5. The demo script for the main flow (see [docs/4-build-plan.md](docs/4-build-plan.md)).

## Ground rules (these carry grade deductions)

- Commit `/contracts` **before** any code in `/services`. Writing contracts after the code costs −5.
- No shared database, tables, or entity classes. Services talk only through `/contracts`. Breaking this costs −10.
- At most **three** services. A fourth costs −5.
- Each owner commits their own service's code. Uneven contribution with no explanation costs up to −10 per person.
