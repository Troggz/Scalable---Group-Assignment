# studio

**Owner:** Asthar · **Reviewer:** Ethan · **Contract:** [../../contracts/studio.openapi.yaml](../../contracts/studio.openapi.yaml)

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

```bash
cp .env.example .env
npm install
npm run migrate
npm start                     # http://localhost:3003/health
```

Needs PostgreSQL running and `infra/db/bootstrap.sql` applied once (already done;
your role and database exist). Copy the shape of `services/booking/` — its
`package.json`, `src/config.js`, `src/db.js` and `src/server.js` are generic, and
`src/http.js` has the validators and the `{error, message}` helpers. Change the
port and the `DATABASE_URL`, then build the endpoints in your contract.

## Must not

- Compute money from a DP percentage. Use `quoteIDR − paidIDR` exactly as booking sent them.
- Return `finalFileUrl` before the status is `COMPLETED`.
- Read or write another service's database.
