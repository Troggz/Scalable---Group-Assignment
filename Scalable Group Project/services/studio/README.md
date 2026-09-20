# studio

**Owner:** _TBD_ · **Reviewer:** _TBD_ · **Contract:** [../../contracts/studio.openapi.yaml](../../contracts/studio.openapi.yaml)

Making the artwork and handing it over. Owns **Commission**: queue, sketch, revisions, final, and releasing the
hi-res link once nothing is left to pay.

## Needs

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3003` | HTTP port |
| `DATABASE_URL` | `postgres://studio_user:…@localhost:5432/studio_db` | Its **own** database and credentials |
| `PAYMENTS_URL` | `http://localhost:3002` | To request the pelunasan invoice |
| `PUBLIC_URL` | `http://localhost:3003` | Used to build `notifyUrl` for payments |

It boots with only its database available.

## Run

_Not written yet. Code comes after `/contracts` is committed._

## Must not

- Compute money from a DP percentage. Use `quoteIDR − paidIDR` exactly as booking sent them.
- Return `finalFileUrl` before the status is `COMPLETED`.
- Read or write another service's database.
