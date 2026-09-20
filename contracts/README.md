# Contracts (v1)

One OpenAPI 3.1 file per service. They're **written and committed before any service code**, and services talk to each
other **only** through these contracts.

| Service | Contract | Port |
|---|---|---|
| booking | [booking.openapi.yaml](booking.openapi.yaml) | 3001 |
| payments | [payments.openapi.yaml](payments.openapi.yaml) | 3002 |
| studio | [studio.openapi.yaml](studio.openapi.yaml) | 3003 |

## Conventions (all services)

- **Money** is an integer number of rupiah. Field names end in `IDR`, e.g. `amountIDR: 175000`. No decimals.
- **Ids** are opaque strings, e.g. `req_7Hk2…`. Never parse them, and never rely on their format or ordering.
- **Times** are RFC 3339 with an offset, e.g. `2026-10-01T19:00:00+07:00`.
- **Errors** look like `{"error": "SlotsFull", "message": "…"}`. `error` is a stable code listed in the contract;
  `message` is for humans and may change.
- **Enums may grow.** Consumers must tolerate status values they don't know.
- **No auth in v1.** Actors pass `artistId` / `clientId` explicitly (the assignment forbids login in the thin build).
- **Notifications** (`InvoicePaid`) are HTTP POSTs to the `notifyUrl` the caller gave. The sender retries on network errors
  and 5xx, and stops on 2xx and 4xx. **Receivers must be idempotent.**

## Change policy

Response fields may be added at any time, and new request fields must be optional with a default. Removing or renaming a field or
status, or changing its meaning, needs a new path prefix (`/v2/...`) served next to the old one until all consumers move.

## Service cards

```
Service:    booking
Owner:      <name>
Exposes:    PUT  /artists/{artistId}/pricelist        -> 200 Pricelist
            POST /windows                             -> 201 {windowId, slotsLeft} | 409 NoPricelist
            GET  /windows/{windowId}                  -> 200 {status, slotCount, slotsLeft, pricelist}
            POST /windows/{windowId}/requests         -> 201 {requestId, status} | 409 SlotsFull | AlreadyHoldsSlot | WindowNotOpen
            GET  /requests/{requestId}                -> 200 {status, quoteIDR, depositIDR, depositInvoiceId, payBy, commissionId}
            POST /requests/{requestId}/accept         -> 200 | 409 InvalidTransition | 422 QuoteBelowListPrice | 503
            POST /requests/{requestId}/decline        -> 200 | 409 InvalidTransition
Consumes:   InvoicePaid (from payments)               at POST /payment-notifications
Calls:      payments POST /invoices, POST /invoices/{id}/void; studio POST /commissions
Hides:      how the slot limit is enforced (conditional update vs row locks), slot rows vs counter,
            the pricelist snapshot and versioning, the expiry sweep job, deposit rounding, id scheme
Change policy: as above
```

```
Service:    payments
Owner:      <name>
Exposes:    POST /invoices                            -> 201 Invoice | 200 Invoice (same reference+purpose)
            GET  /invoices/{invoiceId}                -> 200 {status, amountIDR, dueAt, paidAt}
            POST /invoices/{invoiceId}/void           -> 200 | 409 AlreadyPaid
            POST /provider/callbacks                  -> 200 {applied: true|false} | 409 InvoiceNotPayable | 422 AmountMismatch
Publishes:  InvoicePaid {invoiceId, reference, purpose, amountIDR, paidAt}  -> the invoice's notifyUrl
Hides:      the payment provider and its signature check, the settlement log that makes callbacks exactly-once,
            the notification outbox and retry schedule, id scheme
Change policy: as above; `reference` and `purpose` are returned unchanged and never interpreted
```

```
Service:    studio
Owner:      <name>
Exposes:    POST /commissions                         -> 201 Commission | 200 Commission (same bookingRef)
            GET  /commissions/{commissionId}          -> 200 {status, revisionsUsed, balanceDueIDR, finalFileUrl?}
            GET  /artists/{artistId}/queue            -> 200 {commissions: [...]}
            POST /commissions/{id}/sketch             -> 200 | 409 InvalidTransition
            POST /commissions/{id}/sketch/approve     -> 200 | 409 InvalidTransition
            POST /commissions/{id}/sketch/revisions   -> 200 | 409 RevisionLimitReached | InvalidTransition
            POST /commissions/{id}/final              -> 200 | 409 InvalidTransition | 503 PaymentsUnavailable
Consumes:   InvoicePaid (from payments)               at POST /payment-notifications
Calls:      payments POST /invoices
Hides:      internal stages (lineart, coloring) shown only as IN_PROGRESS, where links and revision notes are stored,
            queue ordering, the revision counter, id scheme
Change policy: as above
```
