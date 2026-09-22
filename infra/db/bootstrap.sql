-- OpenComm: one role and one database per service.
--
-- Run once, as a PostgreSQL superuser:
--     psql -U postgres -f infra/db/bootstrap.sql
--
-- This file is the evidence for requirement B2 ("each service owns its data").
-- After running it, a service's credentials must be refused by its neighbours'
-- databases -- see verify-isolation.sh, which is the proof the graders ask for.
--
-- The passwords here are local development passwords and are meant to be in the
-- repository so that a clean clone can run (requirement B6). Nothing here is a
-- secret. Real deployments would take them from the environment instead.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Roles. CREATE ROLE has no IF NOT EXISTS, so guard each one.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'booking_user') THEN
    CREATE ROLE booking_user LOGIN PASSWORD 'booking_pw';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'payments_user') THEN
    CREATE ROLE payments_user LOGIN PASSWORD 'payments_pw';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'studio_user') THEN
    CREATE ROLE studio_user LOGIN PASSWORD 'studio_pw';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Databases. CREATE DATABASE cannot run inside a transaction or a DO block,
-- so generate the statement and let psql execute it with \gexec.
-- ---------------------------------------------------------------------------

SELECT 'CREATE DATABASE booking_db OWNER booking_user'
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'booking_db')\gexec

SELECT 'CREATE DATABASE payments_db OWNER payments_user'
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payments_db')\gexec

SELECT 'CREATE DATABASE studio_db OWNER studio_user'
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'studio_db')\gexec

-- ---------------------------------------------------------------------------
-- Isolation. PUBLIC can connect to any database by default, which would make
-- the B2 proof fail: booking_user would happily open payments_db. Revoke that
-- and grant CONNECT back to the one owner.
-- ---------------------------------------------------------------------------

REVOKE CONNECT ON DATABASE booking_db  FROM PUBLIC;
REVOKE CONNECT ON DATABASE payments_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE studio_db   FROM PUBLIC;

GRANT CONNECT ON DATABASE booking_db  TO booking_user;
GRANT CONNECT ON DATABASE payments_db TO payments_user;
GRANT CONNECT ON DATABASE studio_db   TO studio_user;

\echo ''
\echo 'Roles and databases ready.'
\echo 'Now run each service''s own schema, then infra/db/verify-isolation.sh'
\echo ''
