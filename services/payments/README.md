    # payments

**Owner:** _TBD_ · **Reviewer:** _TBD_ · **Contract:** [../../contracts/payments.openapi.yaml](../../contracts/payments.openapi.yaml)

Collecting money exactly once. Owns **Invoice**. A generic service: `reference` and `purpose` are stored and
returned unchanged, and never interpreted.

## Needs

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3002` | HTTP port |
| `DATABASE_URL` | `postgres://payments_user:…@localhost:5432/payments_db` | Its **own** database and credentials |
| `NOTIFY_RETRY_SECONDS` | `5` | How often undelivered InvoicePaid notifications are retried |

No URLs for other services: it only calls the `notifyUrl` each invoice was created with.
It boots with only its database available.

## Run

_Not written yet. Code comes after `/contracts` is committed._

## Must not

- Know what a slot, DP policy, or sketch is. Branching on `purpose` is a design smell.
- Apply the same `providerRef` twice, or let pay and void both succeed.
- Read or write another service's database.
