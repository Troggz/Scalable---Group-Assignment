# booking

**Owner:** Thomas · **Reviewer:** Asthar · **Contract:** [../../contracts/booking.openapi.yaml](../../contracts/booking.openapi.yaml)

Who gets a slot in this round. Owns **CommissionWindow**, **CommissionRequest**, and the **Pricelist** module.
Enforces the hard rule: kept + taken slots never exceed `slotCount`.

## Needs

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `DATABASE_URL` | `postgres://booking_user:…@localhost:5432/booking_db` | Its **own** database and credentials, never another service's |
| `PAYMENTS_URL` | `http://localhost:3002` | To create and void DP invoices |
| `STUDIO_URL` | `http://localhost:3003` | To send CommissionBooked |
| `PUBLIC_URL` | `http://localhost:3001` | Used to build `notifyUrl` for payments |
| `DP_DEADLINE_MINUTES` | `1440` (demo: `3`) | How long an accepted request waits for its DP |

It boots with only its database available. Payments and studio may be down at startup.

## Run

```bash
cp .env.example .env          # local dev values, already correct for a default Postgres
npm install
npm start                     # http://localhost:3001/health
```

Needs PostgreSQL running and `infra/db/bootstrap.sql` applied once. The service
starts even when the database is down -- `/health` reports `database: "down"`
until it is up, so any start order works (requirement B4).

## Must not

- Read or write `payments_db` or `studio_db`, or import another service's code or models.
- Check `slotsLeft` in application code and then write. Enforce the limit in one atomic statement (see docs/4-build-plan.md).
- Let other booking code query Pricelist tables directly. Go through the Pricelist module's functions.
