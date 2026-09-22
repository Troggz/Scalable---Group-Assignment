-- payments_db. Owned by payments and read by nothing else (requirement B2).
--
-- `reference` and `purpose` are stored and returned unchanged, never
-- interpreted -- there is no FK to booking or studio, on purpose.

BEGIN;

-- ---------------------------------------------------------------------------
-- Invoice.
--
-- The UNIQUE(reference, purpose) index is what makes createInvoice idempotent:
-- a repeat POST /invoices hits it and we return the existing row instead of
-- issuing a second invoice.
--
-- notify_* columns track delivery of InvoicePaid to notify_url. Retried on
-- network errors and 5xx, stopped on 2xx and 4xx -- see src/notifier.js.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS invoices (
  id                     text        PRIMARY KEY,
  reference              text        NOT NULL,
  purpose                text        NOT NULL,
  payer_id               text        NOT NULL,
  payee_id               text        NOT NULL,
  amount_idr             integer     NOT NULL CHECK (amount_idr >= 1),
  status                 text        NOT NULL DEFAULT 'ISSUED',
  due_at                 timestamptz,
  paid_at                timestamptz,
  notify_url             text        NOT NULL,
  notify_done            boolean     NOT NULL DEFAULT false,
  notify_attempts        integer     NOT NULL DEFAULT 0,
  notify_next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT invoices_status CHECK (status IN ('ISSUED', 'PAID', 'VOID'))
);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_reference_purpose
    ON invoices (reference, purpose);

-- Drives the retry sweep without scanning the table.
CREATE INDEX IF NOT EXISTS invoices_notify_due
    ON invoices (notify_next_attempt_at)
 WHERE status = 'PAID' AND notify_done = false;

-- ---------------------------------------------------------------------------
-- Settlement log. Exactly-once for the provider callback: INSERT ... ON
-- CONFLICT (provider_ref) DO NOTHING, then only apply the settlement if this
-- call was the one that inserted the row -- see src/invoices.js.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS settlements (
  provider_ref  text        PRIMARY KEY,
  invoice_id    text        NOT NULL REFERENCES invoices (id),
  amount_idr    integer     NOT NULL,
  received_at   timestamptz NOT NULL DEFAULT now()
);

COMMIT;
