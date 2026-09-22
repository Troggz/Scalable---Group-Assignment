-- booking_db. Owned by booking and read by nothing else (requirement B2).
--
-- None of this shape is in contracts/booking.openapi.yaml, and that is the
-- point: the contract promises statuses and counts, not tables. Whether slots
-- are rows or counters, and how the pricelist snapshot is stored, are decisions
-- booking hides and can change without telling anyone (section 4.4).

BEGIN;

-- ---------------------------------------------------------------------------
-- Pricelist. A module inside booking, not a service of its own, so that the
-- assignment's three-service limit is not spent on it.
--
-- Tiers and add-ons are jsonb rather than child tables. For a thin build the
-- whole pricelist is read and written as one document and never queried by
-- tier, so rows would buy nothing. The contract does not reveal either way.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pricelists (
  artist_id        text PRIMARY KEY,
  version          integer     NOT NULL DEFAULT 1,
  tiers            jsonb       NOT NULL,
  add_ons          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  deposit_percent  integer     NOT NULL CHECK (deposit_percent BETWEEN 1 AND 100),
  revision_limit   integer     NOT NULL CHECK (revision_limit >= 0),
  published_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- CommissionWindow. Carries the hard rule.
--
-- kept   = slots held by a request that has not paid its DP yet
-- taken  = slots whose DP has been confirmed
--
-- The CHECK below is deliberate belt and braces. The application enforces the
-- limit with a conditional UPDATE, but if that logic were ever wrong the
-- database still refuses to oversell. A demo that passes because of this CHECK
-- is still a bug: the UPDATE must not return a row in the first place.
--
-- `status` is NOT stored. It is derived from opens_at, closes_at, closed_early
-- and kept + taken, so it can never disagree with the counts. The contract
-- exposes it; the table does not have it.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS commission_windows (
  id            text        PRIMARY KEY,
  artist_id     text        NOT NULL,
  title         text        NOT NULL,
  slot_count    integer     NOT NULL CHECK (slot_count >= 1),
  kept          integer     NOT NULL DEFAULT 0 CHECK (kept >= 0),
  taken         integer     NOT NULL DEFAULT 0 CHECK (taken >= 0),
  opens_at      timestamptz NOT NULL,
  closes_at     timestamptz NOT NULL,
  closed_early  boolean     NOT NULL DEFAULT false,
  pricelist     jsonb       NOT NULL,          -- snapshot taken when the window opened
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commission_windows_dates   CHECK (closes_at > opens_at),
  CONSTRAINT commission_windows_capacity CHECK (kept + taken <= slot_count)
);

CREATE INDEX IF NOT EXISTS commission_windows_by_artist
    ON commission_windows (artist_id);

-- ---------------------------------------------------------------------------
-- CommissionRequest.
--
-- deposit_percent and revision_limit are copied in at request time, not read
-- from the pricelist later. The artist may publish a new pricelist tomorrow;
-- the terms this client agreed to must not move underneath them.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS commission_requests (
  id                  text        PRIMARY KEY,
  window_id           text        NOT NULL REFERENCES commission_windows (id),
  artist_id           text        NOT NULL,
  client_id           text        NOT NULL,
  status              text        NOT NULL DEFAULT 'SUBMITTED',
  tier_code           text        NOT NULL,
  tier_name           text        NOT NULL,
  add_ons             jsonb       NOT NULL DEFAULT '[]'::jsonb,
  brief               text        NOT NULL,
  reference_links     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  list_price_idr      integer     NOT NULL CHECK (list_price_idr >= 0),
  quote_idr           integer     CHECK (quote_idr IS NULL OR quote_idr >= 0),
  deposit_idr         integer     CHECK (deposit_idr IS NULL OR deposit_idr >= 0),
  deposit_invoice_id  text,
  pay_by              timestamptz,
  commission_id       text,
  deposit_percent     integer     NOT NULL,   -- frozen at request time
  revision_limit      integer     NOT NULL,   -- frozen at request time
  submitted_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commission_requests_status
    CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'BOOKED', 'DECLINED', 'EXPIRED'))
);

-- One client holds at most one live slot per window -> 409 AlreadyHoldsSlot.
-- Partial on purpose: once a request is declined or expired the client is free
-- to try again, and a plain UNIQUE would forbid that.
CREATE UNIQUE INDEX IF NOT EXISTS commission_requests_one_live_per_client
    ON commission_requests (window_id, client_id)
 WHERE status IN ('SUBMITTED', 'ACCEPTED', 'BOOKED');

-- Drives the expiry sweep without scanning the table.
CREATE INDEX IF NOT EXISTS commission_requests_awaiting_deposit
    ON commission_requests (pay_by)
 WHERE status = 'ACCEPTED';

-- ---------------------------------------------------------------------------
-- Idempotency for InvoicePaid.
--
-- Payments retries on network errors and 5xx, so the same notification can and
-- will arrive twice. Inserting here first, with ON CONFLICT DO NOTHING, is what
-- makes the second delivery a no-op instead of a second slot being consumed.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS processed_notifications (
  invoice_id   text        PRIMARY KEY,
  request_id   text        NOT NULL,
  purpose      text        NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now()
);

COMMIT;
