#!/usr/bin/env bash
#
# a5-cli-tls.sh -- Does the pinned Supabase CLI's linked `db push` connection honour PGSSLMODE and PGSSLROOTCERT?
#
# Runs `supabase db push --linked --dry-run` on the linked pooler path against a local Postgres that serves TLS
# with a certificate signed by a throwaway CA, under five environments, and records what the CLI did and what the
# server saw. Nothing leaves the host: the profile's API URL is a closed loopback port, the access token is a dummy,
# and the pooler host is a localtest.me name, which resolves to 127.0.0.1.
#
# Usage: a5-cli-tls.sh <out-dir>      (Docker running; TCP 127.0.0.1:5432 free; `yarn install` done)
#   A5_PROJECT_HOST=localtest.me a5-cli-tls.sh <out-dir> makes the direct host db.<ref>.localtest.me reachable, so the
#   CLI takes its direct path instead; every case is then only observed. Unset, the direct host does not resolve and
#   the CLI takes the pooler path, the one a GitHub-hosted runner takes for an IPv6-only project.
#   A5_MODE=db-url a5-cli-tls.sh <out-dir> runs the call infra/scripts/push-migrations.sh makes instead:
#   `db push --db-url postgresql://<user>@<host>:<port>/postgres`, the password in PGPASSWORD alone.
# Output: one `A5_<case>_exit=`, `A5_<case>_path=`, `A5_<case>_connected=`, `A5_<case>_reason=` and `A5_<case>_server_ssl=` line per case.
# Exit: 0 when every case met its expectation, 1 otherwise, 2 on a setup failure.

set -euo pipefail
export LC_ALL=C

OUT="${1:?usage: a5-cli-tls.sh <out-dir>}"
REPO_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ] || [ ! -x "$REPO_ROOT/node_modules/.bin/supabase" ]; then
  REPO_ROOT="${A5_REPO_ROOT:?set A5_REPO_ROOT to the repository root}"
fi
CLI="$REPO_ROOT/node_modules/.bin/supabase"
SUPABASE_ROOT="$REPO_ROOT/infra/certs/supabase-root-2021-ca.crt"
CONTAINER="a5-cli-tls-pg"
REF="aaaaaaaaaaaaaaaaaaaa"
GOOD_HOST="aws-0-a5.pooler.localtest.me"
OTHER_HOST="aws-0-other.pooler.localtest.me"
PASSWORD="a5-local-only"

cleanup() { docker logs "$CONTAINER" >"$OUT/server.log" 2>&1 || true; docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM HUP

mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd -P)"
PKI="$OUT/pki"
rm -rf "$PKI" "$OUT/wd" "$OUT/logs"
mkdir -p "$PKI" "$OUT/wd/supabase/migrations" "$OUT/wd/supabase/.temp" "$OUT/logs"

# --- PKI: CA A signs the server; CA B signs nothing the server holds ------------------------------
for ca in a b; do
  openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj "/CN=a5-test-ca-$ca" \
    -keyout "$PKI/ca-$ca.key" -out "$PKI/ca-$ca.crt" 2>/dev/null
done
openssl req -newkey rsa:2048 -nodes -subj "/CN=$GOOD_HOST" -keyout "$PKI/server.key" -out "$PKI/server.csr" 2>/dev/null
printf 'subjectAltName=DNS:%s\n' "$GOOD_HOST" >"$PKI/san.ext"
openssl x509 -req -in "$PKI/server.csr" -CA "$PKI/ca-a.crt" -CAkey "$PKI/ca-a.key" -CAcreateserial \
  -days 2 -extfile "$PKI/san.ext" -out "$PKI/server.crt" 2>/dev/null
chmod 644 "$PKI"/*

# --- the local "pooler": Postgres 17 with TLS and connection logging ------------------------------
cleanup
docker run -d --name "$CONTAINER" -p 127.0.0.1:5432:5432 -e POSTGRES_PASSWORD="$PASSWORD" \
  -v "$PKI:/pki:ro" postgres:17-alpine sh -c '
    cp /pki/server.crt /pki/server.key /tmp/ && chown postgres /tmp/server.* && chmod 600 /tmp/server.key &&
    exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/tmp/server.crt -c ssl_key_file=/tmp/server.key \
      -c log_connections=on' >/dev/null || exit 2
for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null || { echo "A5 setup: postgres did not start" >&2; exit 2; }
docker exec "$CONTAINER" psql -U postgres -qc "CREATE ROLE \"postgres.$REF\" LOGIN SUPERUSER PASSWORD '$PASSWORD'" >/dev/null || exit 2

# --- a profile whose pooler domain is localtest.me, and a linked work directory -----------------
cat >"$OUT/profile.json" <<EOF
{"name": "a5-local", "api_url": "http://127.0.0.1:9", "dashboard_url": "http://127.0.0.1:9",
 "project_host": "${A5_PROJECT_HOST:-a5.invalid}", "pooler_host": "localtest.me"}
EOF
cp "$REPO_ROOT/apps/supabase/supabase/config.toml" "$OUT/wd/supabase/config.toml"
printf 'select 1;\n' >"$OUT/wd/supabase/migrations/00001_a5_probe.sql"
printf '%s' "$REF" >"$OUT/wd/supabase/.temp/project-ref"

if [ -n "${A5_PROJECT_HOST:-}" ]; then OBSERVE_ONLY=1; else OBSERVE_ONLY=0; fi
# case name | pooler host | PGSSLMODE (- = unset) | PGSSLROOTCERT (- = unset) | expected: connect or refuse
CASES=(
  "green_right_root|$GOOD_HOST|verify-full|$PKI/ca-a.crt|connect"
  "red_wrong_root|$GOOD_HOST|verify-full|$PKI/ca-b.crt|refuse"
  "red_pipeline_root|$GOOD_HOST|verify-full|$SUPABASE_ROOT|refuse"
  "red_wrong_host|$OTHER_HOST|verify-full|$PKI/ca-a.crt|refuse"
  "control_unset|$GOOD_HOST|-|-|observe"
)

status=0
for row in "${CASES[@]}"; do
  IFS='|' read -r name host mode root expect <<<"$row"
  [ "$OBSERVE_ONLY" -eq 1 ] && expect=observe
  printf 'postgresql://postgres.%s@%s:6543/postgres' "$REF" "$host" >"$OUT/wd/supabase/.temp/pooler-url"
  log="$OUT/logs/$name.log"
  since="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  envs=(PATH="$PATH" HOME="$OUT/home" SUPABASE_ACCESS_TOKEN="sbp_$(printf '0%.0s' {1..40})"
    SUPABASE_DB_PASSWORD="$PASSWORD" SUPABASE_TELEMETRY_DISABLED=1)
  [ "$mode" != "-" ] && envs+=(PGSSLMODE="$mode")
  [ "$root" != "-" ] && envs+=(PGSSLROOTCERT="$root")
  mkdir -p "$OUT/home"
  rc=0
  if [ "${A5_MODE:-linked}" = db-url ]; then
    env -i "${envs[@]}" PGPASSWORD="$PASSWORD" "$CLI" db push --db-url "postgresql://postgres.$REF@$host:5432/postgres" \
      --dry-run --skip-vault --debug --workdir "$OUT/wd" --agent no --output-format text >"$log" 2>&1 </dev/null || rc=$?
  else
    env -i "${envs[@]}" "$CLI" db push --linked --dry-run --skip-vault --debug --profile "$OUT/profile.json" \
      --workdir "$OUT/wd" --agent no --output-format text >"$log" 2>&1 </dev/null || rc=$?
  fi
  sleep 1
  server="$(docker logs --since "$since" "$CONTAINER" 2>&1 | grep -E 'connection authorized' | tail -1 || true)"
  case "$server" in
    *"SSL enabled"*) server_ssl=yes ;;
    "") server_ssl=no-session ;;
    *) server_ssl=no ;;
  esac
  # The CLI prints no line naming its path, so the path is read from the user it signed in as: postgres.<ref> on
  # the pooler path, postgres on the direct one, taken from the server's session line or from the CLI's error.
  pooler=no
  { printf '%s' "$server" | grep -q -F "user=postgres.$REF"; } || grep -q -F "user=postgres.$REF" "$log" || pooler=direct
  [ "$pooler" = no ] && pooler=yes
  reason="$(grep -m1 -iE 'certificate|self.signed|altnames|hostname|verify|ERR_TLS|unable to' "$log" | tr -s ' ' | cut -c1-240 || true)"
  connected=no
  { grep -q -F "00001_a5_probe.sql" "$log" || grep -q -F "is up to date." "$log"; } && connected=yes
  echo "A5_${name}_exit=$rc"
  echo "A5_${name}_path=$([ "$pooler" = yes ] && echo pooler || echo direct)"
  echo "A5_${name}_connected=$connected"
  echo "A5_${name}_server_ssl=$server_ssl"
  echo "A5_${name}_reason=${reason:-none}"
  echo "A5_${name}_server_session=$(printf '%s' "$server" | sed -E 's/^.*connection authorized: //' | cut -c1-200)"
  case "$expect" in
    observe) ;;
    connect) [ "$rc" -eq 0 ] && [ "$connected" = yes ] && [ "$server_ssl" = yes ] && [ "$pooler" = yes ] || status=1 ;;
    refuse) [ "$rc" -ne 0 ] && [ "$connected" = no ] && [ "$server_ssl" = no-session ] && [ "$pooler" = yes ] || status=1 ;;
  esac
done
echo "A5_RESULT=$([ "$status" -eq 0 ] && echo pass || echo fail)"
exit "$status"
