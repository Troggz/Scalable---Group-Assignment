#!/usr/bin/env bash
# Proof for requirement B2 / checklist E7: a service's credentials are refused
# by every database except its own.
#
#   bash infra/db/verify-isolation.sh
#
# Expected: every own-database connection succeeds, every cross-database
# connection is refused. Any "UNEXPECTED" line means the isolation is not real
# and the assignment loses 10 points, so treat a failure here as a build break.

set -u

HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"

SERVICES=(booking payments studio)
declare -A PW=( [booking]=booking_pw [payments]=payments_pw [studio]=studio_pw )

fail=0

# Runs a trivial query and reports only whether the connection was allowed.
try_connect() {
  local user="$1" db="$2" pw="$3"
  PGPASSWORD="$pw" psql -h "$HOST" -p "$PORT" -U "$user" -d "$db" \
      -tAc 'SELECT 1' >/dev/null 2>&1
}

echo ""
echo "Database isolation check (B2 / E7)"
echo "-----------------------------------"

for svc in "${SERVICES[@]}"; do
  user="${svc}_user"
  pw="${PW[$svc]}"

  for target in "${SERVICES[@]}"; do
    db="${target}_db"

    if try_connect "$user" "$db" "$pw"; then
      allowed=yes
    else
      allowed=no
    fi

    if [ "$svc" = "$target" ]; then
      if [ "$allowed" = yes ]; then
        printf '  OK          %-14s -> %-14s connected (its own)\n' "$user" "$db"
      else
        printf '  UNEXPECTED  %-14s -> %-14s REFUSED from its own database\n' "$user" "$db"
        fail=1
      fi
    else
      if [ "$allowed" = no ]; then
        printf '  OK          %-14s -> %-14s refused\n' "$user" "$db"
      else
        printf '  UNEXPECTED  %-14s -> %-14s CONNECTED to a neighbour\n' "$user" "$db"
        fail=1
      fi
    fi
  done
done

echo ""
if [ "$fail" -eq 0 ]; then
  echo "PASS - each service reaches only its own database."
  echo "Screenshot this for the report (section 4, requirement B2)."
else
  echo "FAIL - isolation is not enforced. Re-run infra/db/bootstrap.sql and check"
  echo "       that REVOKE CONNECT ... FROM PUBLIC actually applied."
fi
echo ""

exit "$fail"
