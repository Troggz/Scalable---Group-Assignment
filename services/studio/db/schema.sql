-- studio_db. Owned by Studio and read by nothing else.
-- Storage choices here are deliberately not part of the public contract.

BEGIN;

CREATE TABLE IF NOT EXISTS commissions (
  id                   text        PRIMARY KEY,
  booking_ref          text        NOT NULL UNIQUE,
  artist_id            text        NOT NULL,
  client_id            text        NOT NULL,
  status               text        NOT NULL DEFAULT 'QUEUED',
  tier                 jsonb       NOT NULL,
  add_ons              jsonb       NOT NULL DEFAULT '[]'::jsonb,
  brief                text        NOT NULL,
  reference_links      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  revision_limit       integer     NOT NULL CHECK (revision_limit >= 0),
  revisions_used       integer     NOT NULL DEFAULT 0 CHECK (revisions_used >= 0),
  revision_notes       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  quote_idr            integer     NOT NULL CHECK (quote_idr >= 0),
  paid_idr             integer     NOT NULL CHECK (paid_idr >= 0 AND paid_idr <= quote_idr),
  sketch_url           text,
  preview_url          text,
  final_file_url       text,
  remainder_invoice_id text,
  queued_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commissions_status CHECK (status IN (
    'QUEUED', 'SKETCH_REVIEW', 'REVISION_REQUESTED',
    'IN_PROGRESS', 'AWAITING_BALANCE', 'COMPLETED'
  )),
  CONSTRAINT revisions_do_not_exceed_limit CHECK (revisions_used <= revision_limit)
);

CREATE INDEX IF NOT EXISTS commissions_queue
  ON commissions (artist_id, queued_at)
  WHERE status <> 'COMPLETED';

COMMIT;
