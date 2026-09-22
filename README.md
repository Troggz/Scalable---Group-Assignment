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
/client/              the thin client: the main flow and nothing else
```

## How to run

Prerequisites: **Node.js 20+** (for `--env-file-if-exists` and a built-in `fetch`)
and **PostgreSQL 14+** (verified on 17). Nothing else — no Docker, no global npm
packages. On Windows, run the shell steps in **Git Bash**.

> **`psql` is probably not on your PATH** if you installed PostgreSQL on Windows
> with the standard installer. It lives in `C:\Program Files\PostgreSQL\<version>\bin`.
> Add that to PATH first, or the next command will simply not be found.

**1. Create the three databases and their roles.** Once, as a superuser:

```bash
psql -U postgres -f infra/db/bootstrap.sql
```

> **This will ask for the `postgres` password and the prompt is easy to miss** —
> it prints nothing until you answer, so a silent terminal here means it is
> waiting for you, not hanging.

That makes `booking_db`, `payments_db` and `studio_db`, each owned by its own
login role, and revokes `CONNECT` from `PUBLIC` so one service's credentials are
refused by its neighbours' databases. It is safe to re-run. Prove it:

```bash
bash infra/db/verify-isolation.sh      # expects 9/9
```

**2. Configure and migrate each service.** In `services/booking`, `services/payments`
and `services/studio`:

```bash
cp .env.example .env     # local dev passwords, deliberately not secret
npm ci
npm run migrate
```

**3. Start them, in any order,** each in its own terminal:

```bash
cd services/booking  && npm start     # :3001
cd services/payments && npm start     # :3002
cd services/studio   && npm start     # :3003
```

Any start order works, and any one of them can be restarted alone, because a
service needs only its own database to boot. It learns about its neighbours from
a URL in `.env` and discovers they are down by getting a connection refused —
never by failing to start. `GET /health` on each port says who is up.

**4. Run the flow.** There is no seed step: an artist or client is just an id
inside a request (`rara`, `budi`, `sari`, `dimas`, `ayu`), so the client creates
what it needs against an empty database.

```bash
node client/flow.mjs           # the main flow, steps 0-15, asserted
node client/concurrency.mjs    # the hard rule under load: 3 x 200, 17 x 409
```

For the demo itself, open [client/demo.http](client/demo.http) in VS Code with the
REST Client extension and send the blocks in order. See [client/README.md](client/README.md)
for what each step proves, and for the two steps that need a restarted service.

**5. The outage test** (worth showing live). Stop `studio`, then pay a DP. Booking
books the request, fails to hand it to studio, and answers 503; payments keeps
retrying. Start studio again and the commission lands on its own.

## Ground rules (these carry grade deductions)

- Commit `/contracts` **before** any code in `/services`. Writing contracts after the code costs −5.
- No shared database, tables, or entity classes. Services talk only through `/contracts`. Breaking this costs −10.
- At most **three** services. A fourth costs −5.
- Each owner commits their own service's code. Uneven contribution with no explanation costs up to −10 per person.
