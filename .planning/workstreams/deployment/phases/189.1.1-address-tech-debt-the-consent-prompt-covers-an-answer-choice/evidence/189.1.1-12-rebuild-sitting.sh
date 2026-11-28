#!/usr/bin/env bash
# The staging rebuild sitting of 189.1.1-12 (attempt key 189.1.1-12-3) as
# one script: Steps 1 to 14 of 189.1.1-12-staging-rebuild.md, the same
# commands, run in order. After each step the script checks the named lines
# against what the step must print, shows each line with a tick or a cross,
# and asks whether to go on. Answer n (or press Ctrl-C) to stop; the
# clean-up (Step 14) then runs by itself and prints the reply with
# answer_stopped_at=. Nothing is retried.
#
# Run it from a terminal:  bash <path to this file> [--from N]
#
# --from N resumes a stopped sitting at step N (1 to 13). Steps 0 to 3
# (tools, ref, secrets, connection) always run; steps 4 to 6 run only when
# N is at most their number, so a resume after the reset never resets
# again; steps 7 and 8, both read-only, also run on any resume past the
# reset, so the history must already be the rebuild's four versions.
#
# Secrets are read with read -rs from the terminal, live only in this
# script's process, and are never printed. The reply holds no secret; it is
# printed, copied to the clipboard, and saved to
# tmp/supabase-rebuild/reply-189.1.1-12-3.txt (Git ignores tmp/).

ATTEMPT=20261124T212021Z.3c506322d
FROM=1
case ${1:-} in
  '') ;;
  --from)
    FROM=${2:-}
    case $FROM in
      [1-9] | 1[0-3]) ;;
      *) echo "--from takes a step number from 1 to 13" >&2; exit 2 ;;
    esac
    ;;
  *) echo "usage: bash $0 [--from N]" >&2; exit 2 ;;
esac

# want K: whether step K runs on this invocation.
want() {
  [ "$1" -le 3 ] || [ "$1" -ge "$FROM" ] \
    || { [ "$FROM" -gt 6 ] && { [ "$1" -eq 7 ] || [ "$1" -eq 8 ]; }; }
}
REBUILD_COMMIT=c84b1e373fde7e6e6ac30d502945535518006989
NL=$'\n'

cd "$(dirname "$0")" && cd "$(git rev-parse --show-toplevel)" || exit 2
ROOT=$PWD
export LC_ALL=C

L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-rebuild.XXXXXX")
(umask 077; : > "$L/reply.txt"; : > "$L/empty.pgpass")
REPLY_FILE=$ROOT/tmp/supabase-rebuild/reply-189.1.1-12-3.txt
CUR=0
STOPPED=
TE_AT=

rl() { printf '%s\n' "$*" | tee -a "$L/reply.txt"; }

scrub() {
  sed -E -e "s/${PGHOST:-POOLER}/POOLER/g" \
    -e 's/[A-Za-z0-9*.-]*pooler[.]supabase[.]com/POOLER/g' \
    -e 's/\([0-9a-fA-F:.]+\)/(ADDRESS)/g' \
    -e 's/([0-9]{1,3}[.]){3}[0-9]{1,3}/ADDRESS/g' "$1" \
    | grep -v -e '^WARNING' -e '^ *$' \
      -e 'new version of Supabase CLI' \
      -e 'We recommend updating'
}

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# errline NAME LOG: the first ERROR (or else last) line of LOG, scrubbed.
errline() {
  local x
  x=$(scrub "$2" | grep -m 1 -E 'ERROR|FATAL|error:')
  [ -n "$x" ] || x=$(scrub "$2" | tail -n 1)
  rl "$1=$x"
}

# ---- the check between steps ---------------------------------------------

# value_of NAME: the last collected value of NAME=, or a marker when absent.
value_of() {
  awk -v n="$1=" 'index($0, n) == 1 { f = 1; v = substr($0, length(n) + 1) }
    END { if (f) print v; else print "\001" }' "$L/reply.txt"
}

# gate STEP NEXT EXPECT...: each EXPECT is NAME=GLOB (NAME=!GLOB: must not
# match). Shows every line, then asks whether to go on to NEXT.
gate() {
  local step=$1 next=$2 bad=0 e name pat val ok
  shift 2
  echo
  echo "---- Step $step: check ----"
  for e in "$@"; do
    name=${e%%=*}
    pat=${e#*=}
    val=$(value_of "$name")
    if [ "$val" = $'\001' ]; then
      printf '  \033[31m✗ %s  (not printed; must be %s)\033[0m\n' \
        "$name" "$pat"
      bad=$((bad + 1))
      continue
    fi
    ok=no
    case $pat in
      '!'*) [[ $val == ${pat#!} ]] || ok=yes ;;
      *) [[ $val == $pat ]] && ok=yes ;;
    esac
    if [ "$ok" = yes ]; then
      printf '  \033[32m✓ %s=%s\033[0m\n' "$name" "$val"
    else
      printf '  \033[31m✗ %s=%s  (must be %s)\033[0m\n' \
        "$name" "$val" "$pat"
      bad=$((bad + 1))
    fi
  done
  if [ "$bad" -eq 0 ]; then
    echo "  Every line is what the step must print; going on to $next."
    return 0
  fi
  printf '  \033[31m%s line(s) differ: answer n.\033[0m\n' "$bad"
  local ans
  printf '\nGo on to %s anyway? [y/n] ' "$next"
  read -r ans < /dev/tty
  case $ans in
    y | Y | yes) ;;
    *) STOPPED=$step; exit 1 ;;
  esac
}

# ---- Step 14: the clean-up and the reply, on every exit --------------------

finish() {
  trap - EXIT INT TERM
  [ -z "$STOPPED" ] && [ "$CUR" -lt 14 ] && STOPPED=$CUR
  say "Step 14: the clean-up and the reply"
  local body logs=no
  body=$(test -s "$L/reply.txt" && sed 's/^/answer_/' "$L/reply.txt")
  rm -f "$L/s22c-service.h" "$L/s22c-user.h" "$L/s22c-token.json"
  test -n "$L" && rm -rf "$L" && logs=yes
  unset SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD PGPASSWORD \
    SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY \
    SUPABASE_SECRET_KEY TF_VAR_database_password \
    SMOKE_CONTESTANT_EMAIL SMOKE_CONTESTANT_PASSWORD
  mkdir -p "$(dirname "$REPLY_FILE")"
  (umask 077
   {
     echo "answer_attempt=$ATTEMPT"
     [ -n "$body" ] && printf '%s\n' "$body"
     echo "answer_s14_logs_removed=$logs"
     [ -n "$TE_AT" ] && echo "answer_track_events_true_at=$TE_AT"
     [ -n "$STOPPED" ] && echo "answer_stopped_at=$STOPPED"
   } > "$REPLY_FILE")
  echo
  echo "---- the reply ----"
  cat "$REPLY_FILE"
  echo "-------------------"
  command -v pbcopy > /dev/null && pbcopy < "$REPLY_FILE" \
    && echo "Copied to the clipboard."
  echo "Saved to $REPLY_FILE"
  if [ -n "$STOPPED" ]; then
    echo "The sitting stopped at step $STOPPED."
  else
    echo "The sitting finished."
  fi
}
trap finish EXIT
trap 'echo; echo "Interrupted."; exit 130' INT TERM

# ---- Step 0: the tools ------------------------------------------------------

CUR=0
say "Step 0: the tools"
PSQL_MAJOR=$(psql --version 2> /dev/null | sed -E 's/[^0-9]*([0-9]+).*/\1/')
[ "$FROM" -gt 1 ] && rl "s0_resumed_from=$FROM"
rl "s0_psql_major=${PSQL_MAJOR:-none}"
rl "s0_node=$(node --version 2> /dev/null | cut -d. -f1)"
for t in jq shasum curl security yarn; do
  command -v "$t" > /dev/null && rl "s0_$t=yes" || rl "s0_$t=no"
done
test -x node_modules/.bin/supabase && rl "s0_supabase_cli=yes" \
  || rl "s0_supabase_cli=no"
gh auth status > /dev/null 2>&1 && rl "s0_gh_signed_in=yes" \
  || rl "s0_gh_signed_in=no"
gate 0 "Step 1 (the ref)" \
  's0_psql_major=1[6-9]' 's0_node=v24' 's0_jq=yes' 's0_shasum=yes' \
  's0_curl=yes' 's0_security=yes' 's0_yarn=yes' \
  's0_supabase_cli=yes' 's0_gh_signed_in=yes'

# ---- Step 1: the lines that begin the sitting -------------------------------

CUR=1
say "Step 1: the lines that begin the sitting"
R=staging
REF=$(sed -n 's/^project_ref *= *"\([a-z]*\)".*/\1/p' \
  "infra/envs/$R/supabase/terraform.tfvars")
W=tmp/supabase-rebuild/$REF
Q="select version from supabase_migrations.schema_migrations"
Q="$Q order by version"
PUBLIC_PROJECT_ID=$(sed -n \
  's/^public_project_id *= *"\([0-9a-f-]*\)".*/\1/p' \
  "infra/envs/$R/supabase/terraform.tfvars")
export PUBLIC_PROJECT_ID
rl "s1_ref=$REF"
test "$REF" = cofbsatfrdysyphajsky && rl "s1_ref_ok=yes"
gate 1 "Step 2 (typing the four secrets)" \
  's1_ref=cofbsatfrdysyphajsky' 's1_ref_ok=yes'

# ---- Step 2: the secrets ----------------------------------------------------

CUR=2
say "Step 2: the secrets"
echo "Paste each value from your password manager; nothing is echoed."
echo "Anon and service-role keys: the legacy anon and service_role keys"
echo "of project cofbsatfrdysyphajsky (Project Settings, API Keys)."
printf 'access token: '; read -rs SUPABASE_ACCESS_TOKEN < /dev/tty
echo; export SUPABASE_ACCESS_TOKEN
printf 'database password: '; read -rs SUPABASE_DB_PASSWORD < /dev/tty
echo; export SUPABASE_DB_PASSWORD
export PGPASSWORD="$SUPABASE_DB_PASSWORD"
printf 'anon key: '; read -rs SUPABASE_ANON_KEY < /dev/tty
echo; export SUPABASE_ANON_KEY
printf 'service-role key: '; read -rs SUPABASE_SERVICE_ROLE_KEY < /dev/tty
echo; export SUPABASE_SERVICE_ROLE_KEY
N=0
for x in "$SUPABASE_ACCESS_TOKEN" "$SUPABASE_DB_PASSWORD" \
  "$SUPABASE_ANON_KEY" "$SUPABASE_SERVICE_ROLE_KEY"; do
  test -n "$x" && N=$((N + 1))
done
unset x
rl "s2_secrets_read=$N"
role_of() {
  printf '%s' "$1" | jq -R -r 'split(".")[1]
    | gsub("-"; "+") | gsub("_"; "/")
    | . + ("=" * ((4 - length % 4) % 4))
    | @base64d | fromjson | .role' 2> /dev/null
}
rl "s2_anon_role=$(role_of "$SUPABASE_ANON_KEY")"
rl "s2_service_role=$(role_of "$SUPABASE_SERVICE_ROLE_KEY")"
gate 2 "Step 3 (a read-only test connection)" \
  's2_secrets_read=4' 's2_anon_role=anon' 's2_service_role=service_role'

# ---- Step 3: the connection, verifying the server ---------------------------

CUR=3
say "Step 3: the connection, verifying the server"
unset PGHOSTADDR PGSERVICE
PGHOST=$(gh variable get SUPABASE_POOLER_HOST --env staging)
export PGHOST PGPORT=5432 PGUSER="postgres.$REF"
export PGDATABASE=postgres PGCONNECT_TIMEOUT=10
export PGPASSFILE="$L/empty.pgpass"
export PGSSLMODE=verify-full
CA=infra/certs/supabase-root-2021-ca.crt
export PGSSLROOTCERT="$PWD/$CA"
test -n "$PGHOST" && rl "s3_pooler_host_read=yes"
test -s "$PGSSLROOTCERT" && rl "s3_root_present=yes"
psql -X -w -At -c 'select 1' > "$L/s3-conn.log" 2>&1
S=$?
rl "s3_conn_exit=$S"
if [ "$S" -ne 0 ]; then
  rl "s3_conn_line=$(scrub "$L/s3-conn.log" | head -n 1)"
fi
gate 3 "Step 4 (reading the migration history, read-only)" \
  's3_pooler_host_read=yes' 's3_root_present=yes' 's3_conn_exit=0'

# ---- Step 4: the history before the reset, read-only ------------------------
if want 4; then

CUR=4
say "Step 4: the history before the reset, read-only"
psql -X -w -At -c "$Q" > "$L/s4-history.log" 2>&1
S=$?
rl "s4_history_exit=$S"
if [ "$S" -eq 0 ]; then
  rl "s4_versions_before=$(paste -sd' ' "$L/s4-history.log")"
else
  rl "s4_history_line=$(scrub "$L/s4-history.log" | head -n 1)"
fi
V24=$(seq -f '%05g' 1 24 | paste -sd' ' -)
gate 4 "Step 5 (the rebuild work directory and its link)" \
  's4_history_exit=0' "s4_versions_before=$V24"

fi

# ---- Step 5: the rebuild work directory and its link ------------------------
if want 5; then

CUR=5
say "Step 5: the rebuild work directory and its link"
C=$REBUILD_COMMIT
test -n "$REF" && rm -rf "$W"
mkdir -p "$W/supabase/migrations"
for p in config.toml functions; do
  ln -sfn "$PWD/apps/supabase/supabase/$p" "$W/supabase/$p"
done
git archive "$C" apps/supabase/supabase/migrations \
  | tar -x -C "$W/supabase/migrations" --strip-components=4
N=$(find "$W/supabase" -maxdepth 1 -type l | wc -l)
rl "s5_links=$((N))"
N=$(find "$W/supabase/migrations" -name '*.sql' | wc -l)
rl "s5_rebuild_migrations=$((N))"
rl "s5_files=$(ls "$W/supabase/migrations" | paste -sd, -)"
M=apps/supabase/supabase/migrations.manifest.json
OK=yes
for f in "$W"/supabase/migrations/*.sql; do
  b=$(basename "$f")
  want=$(jq -r --arg b "$b" \
    '.migrations[] | select(.file == $b) | .sha256' "$M")
  got=$(shasum -a 256 "$f" | cut -d' ' -f1)
  test -n "$want" && test "$got" = "$want" || OK=no
done
rl "s5_manifest_match=$OK"
node_modules/.bin/supabase link --project-ref "$REF" \
  --workdir "$W" --agent no --output-format text \
  > "$L/s5-link.log" 2>&1
rl "s5_rebuild_link_exit=$?"
rl "s5_linked_ref=$(cat "$W/supabase/.temp/project-ref" 2> /dev/null)"
test ! -e apps/supabase/supabase/.temp/project-ref \
  && rl "s5_shared_dir_linked=no"
F4=00001_initial_schema.sql,00002_refusal_codes.sql
F4=$F4,00003_invitation_caller_limit.sql,00004_access_caller_limit.sql
gate 5 "Step 6 (THE RESET: deletes staging's data)" \
  's5_links=2' 's5_rebuild_migrations=4' "s5_files=$F4" \
  's5_manifest_match=yes' 's5_rebuild_link_exit=0' \
  's5_linked_ref=cofbsatfrdysyphajsky' 's5_shared_dir_linked=no'

fi

# ---- Step 6: the reset, without the seed ------------------------------------
if want 6; then
printf '\n\033[1;31m%s\033[0m\n' \
  "Step 6 DELETES every row and auth user of staging."
printf 'Type y to run the reset: '
read -r ANS < /dev/tty
[ "$ANS" = y ] || { STOPPED=6; exit 1; }

CUR=6
say "Step 6: the reset, without the seed (about a minute)"
node_modules/.bin/supabase db reset --linked --no-seed \
  --workdir "$W" --agent no --output-format text --yes \
  > "$L/s6-reset.log" 2>&1
S=$?
rl "s6_reset_exit=$S"
AP=$(grep -c 'Applying migration' "$L/s6-reset.log")
rl "s6_reset_applied=$AP"
if [ "$S" -ne 0 ]; then
  rl "s6_reset_line=$(scrub "$L/s6-reset.log" | tail -n 1)"
fi
gate 6 "Step 7 (the history after the reset)" \
  's6_reset_exit=0' 's6_reset_applied=4'

fi

# ---- Step 7: the history after the reset ------------------------------------
if want 7; then

CUR=7
say "Step 7: the history after the reset"
psql -X -w -At -c "$Q" > "$L/s7-history.log" 2>&1
S=$?
rl "s7_history_exit=$S"
if [ "$S" -eq 0 ]; then
  rl "s7_versions_after=$(paste -sd' ' "$L/s7-history.log")"
else
  rl "s7_history_line=$(scrub "$L/s7-history.log" | head -n 1)"
fi
gate 7 "Step 8 (the server's logging settings)" \
  's7_history_exit=0' 's7_versions_after=00001 00002 00003 00004'

fi

# ---- Step 8: Step 19, the server's logging settings -------------------------
if want 8; then

CUR=8
say "Step 8: the server's logging settings (runbook Step 19)"
psql -X -w -At -F '=' > "$L/s19.out" 2>&1 <<'SQL'
SELECT 's19_setting.' || s.name,
  coalesce(current_setting(s.name, true), '(null)')
FROM (VALUES ('log_statement'),
  ('log_parameter_max_length'),
  ('log_min_duration_statement'),
  ('pgaudit.log'), ('pgaudit.log_parameter'),
  ('auto_explain.log_min_duration'),
  ('auto_explain.log_parameter_max_length')) AS s(name);
SQL
S=$?
rl "s19_psql_exit=$S"
[ "$S" -ne 0 ] && errline s19_line "$L/s19.out"
grep '^s19_setting\.' "$L/s19.out" | tee -a "$L/reply.txt"
gate 8 "Step 9 (the bootstrap, twice, and the seed check)" \
  's19_psql_exit=0' \
  's19_setting.log_statement=ddl' \
  's19_setting.log_parameter_max_length=-1' \
  's19_setting.log_min_duration_statement=-1' \
  's19_setting.pgaudit.log=none' \
  's19_setting.pgaudit.log_parameter=off' \
  's19_setting.auto_explain.log_min_duration=10s' \
  's19_setting.auto_explain.log_parameter_max_length=-1'

fi

# ---- Step 9: Step 20, the bootstrap, twice, and the seed check --------------
if want 9; then

CUR=9
say "Step 9: the bootstrap, twice, and the seed check (runbook Step 20)"
export BOOTSTRAP_STORAGE_URL="https://$REF.supabase.co"
export BOOTSTRAP_BEHIND_CLOUDFLARE=true
export BOOTSTRAP_OPEN_FOR_VOTERS=true
T='5s'
B="$L/s20-boot.sql"
printf '%s\n' '\set ON_ERROR_STOP on' \
  "SET statement_timeout = '$T';" \
  "SELECT 's20_session_timeout=' ||" \
  "  current_setting('statement_timeout');" \
  "SELECT current_setting('statement_timeout')" \
  "  = '$T' AS timeout_ok \gset" \
  '\if :timeout_ok' '\i infra/scripts/bootstrap.sql' \
  '\else' "SELECT 's20_timeout_guard=stopped';" \
  'SELECT 1/0;' '\endif' > "$B"
rl "s20_project_id=$PUBLIC_PROJECT_ID"
s20_rows() {
  psql -X -w -At -v k="$1" <<'SQL'
\getenv pid PUBLIC_PROJECT_ID
SELECT 's20_counts' || :'k' || '=' || concat_ws(',',
  (SELECT count(*) FROM public.accounts),
  (SELECT count(*) FROM public.projects),
  (SELECT count(*) FROM public.app_settings),
  (SELECT count(*) FROM public.storage_config),
  (SELECT count(*) FROM private.deployment_settings));
SELECT 's20_open_for_voters' || :'k' || '=' || open_for_voters
FROM public.projects WHERE id = :'pid'::uuid;
SELECT 's20_behind_cloudflare' || :'k' || '=' || behind_cloudflare
FROM private.deployment_settings;
SQL
}
psql -X -w -At -f "$B" > "$L/s20-boot1.log" 2>&1
S=$?
rl "s20_boot1_exit=$S"
[ "$S" -ne 0 ] && errline s20_boot1_line "$L/s20-boot1.log"
sed -n 's/^s20_session_timeout=/s20_boot1_session_timeout=/p' \
  "$L/s20-boot1.log" | tee -a "$L/reply.txt"
s20_rows 1 | tee -a "$L/reply.txt"
psql -X -w -At -f "$B" > "$L/s20-boot2.log" 2>&1
S=$?
rl "s20_boot2_exit=$S"
[ "$S" -ne 0 ] && errline s20_boot2_line "$L/s20-boot2.log"
sed -n 's/^s20_session_timeout=/s20_boot2_session_timeout=/p' \
  "$L/s20-boot2.log" | tee -a "$L/reply.txt"
s20_rows 2 | tee -a "$L/reply.txt"
psql -X -w -f infra/scripts/check-seed.sql \
  > "$L/s20-check-seed.log" 2>&1
S=$?
rl "s20_check_seed_exit=$S"
[ "$S" -ne 0 ] && errline s20_check_seed_line "$L/s20-check-seed.log"
gate 9 "Step 10 (the smoke dataset: 5 to 15 minutes)" \
  's20_project_id=00000000-0000-0000-0000-000000000001' \
  's20_boot1_exit=0' 's20_boot1_session_timeout=5s' \
  's20_counts1=1,1,1,2,1' 's20_open_for_voters1=true' \
  's20_behind_cloudflare1=true' \
  's20_boot2_exit=0' 's20_boot2_session_timeout=5s' \
  's20_counts2=1,1,1,2,1' 's20_open_for_voters2=true' \
  's20_behind_cloudflare2=true' \
  's20_check_seed_exit=0'

fi

# ---- Step 10: Step 22, the smoke dataset ------------------------------------
if want 10; then

CUR=10
say "Step 10: the smoke dataset (5 to 15 minutes, mostly portraits)"
export SUPABASE_URL="https://$REF.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY
yarn db:seed --template smoke --allow-remote \
  > "$L/s22-seed.log" 2>&1
S=$?
rl "s22_seed_exit=$S"
if [ "$S" -ne 0 ]; then
  rl "s22_seed_line=$(scrub "$L/s22-seed.log" | tail -n 1)"
fi
P=$PUBLIC_PROJECT_ID
Q2="select=id&project_id=eq.$P&limit=1"
curl -sS -o /dev/null -D "$L/s22-headers.txt" \
  -w 's22_read_http=%{http_code}\n' \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Prefer: count=exact' \
  "https://$REF.supabase.co/rest/v1/nominations?$Q2" \
  | tee -a "$L/reply.txt"
tr -d '\r' < "$L/s22-headers.txt" \
  | sed -n 's/^[Cc]ontent-[Rr]ange: */s22_rows_range=/p' \
  | tee -a "$L/reply.txt"
gate 10 "Step 11 (the smoke contestant again)" \
  's22_seed_exit=0' 's22_read_http=206' 's22_rows_range=0-0/1001'

fi

# ---- Step 11: Step 22, the smoke contestant again ---------------------------
if want 11; then

CUR=11
say "Step 11: the smoke contestant again (keychain may ask for access)"
test "$REF" = cofbsatfrdysyphajsky && rl "s22c_ref=ok"
unset SUPABASE_ACCESS_TOKEN SUPABASE_SECRET_KEY \
  SUPABASE_DB_PASSWORD TF_VAR_database_password \
  TF_VAR_smtp_user TF_VAR_smtp_password
SMOKE_CONTESTANT_EMAIL=$(security find-generic-password \
  -s openvaa-staging-smoke-contestant \
  | sed -n 's/^ *"acct"<blob>="\(.*\)"$/\1/p')
export SMOKE_CONTESTANT_EMAIL
X=$(printf '%s' "$SMOKE_CONTESTANT_EMAIL" | tr '[:upper:]' '[:lower:]')
case "$X" in
  '') rl "s22c_address_read=no" ;;
  *@openvaa.test) rl "s22c_address_read=refused" ;;
  *) rl "s22c_address_read=yes" ;;
esac
unset X
psql -X -w -q -At > "$L/s22c-users.out" \
  2> "$L/s22c-users.err" <<'SQL'
\set ON_ERROR_STOP on
SET statement_timeout = '5s';
SET log_parameter_max_length_on_error = 0;
\getenv a SMOKE_CONTESTANT_EMAIL
SELECT 's22c_users_before=' || count(*)
FROM auth.users WHERE lower(email) = lower($1)
\bind :a \g
SQL
S=$?
rl "s22c_users_exit=$S"
[ "$S" -ne 0 ] && errline s22c_users_line "$L/s22c-users.err"
tee -a "$L/reply.txt" < "$L/s22c-users.out"
SMOKE_CONTESTANT_PASSWORD=$(security find-generic-password \
  -s openvaa-staging-smoke-contestant -w)
export SMOKE_CONTESTANT_PASSWORD
rl "s22c_password_length=${#SMOKE_CONTESTANT_PASSWORD}"
gate 11 "Step 11, second half (creating the contestant user)" \
  's22c_ref=ok' 's22c_address_read=yes' 's22c_users_exit=0' \
  's22c_users_before=0' 's22c_password_length=43'

CUR=11
say "Step 11, second half: the user, the grant, the sign-in"
(umask 077
 printf 'apikey: %s\nAuthorization: Bearer %s\n' \
   "$SUPABASE_SERVICE_ROLE_KEY" \
   "$SUPABASE_SERVICE_ROLE_KEY" > "$L/s22c-service.h")
jq -n '{email: env.SMOKE_CONTESTANT_EMAIL,
  password: env.SMOKE_CONTESTANT_PASSWORD,
  email_confirm: true}' \
  | curl -sS -o "$L/s22c-user.json" \
    -w 's22c_create_http=%{http_code}\n' \
    -H @"$L/s22c-service.h" \
    -H 'Content-Type: application/json' \
    --data-binary @- \
    "https://$REF.supabase.co/auth/v1/admin/users" \
  | tee -a "$L/reply.txt"
rm -f "$L/s22c-service.h"
psql -X -w -f infra/scripts/grant-smoke-contestant.sql \
  > "$L/s22c-grant.out" 2> "$L/s22c-grant.err"
rl "s22c_grant_exit=$?"
sed 's/^/s22c_/' "$L/s22c-grant.out" | tee -a "$L/reply.txt"
grep -o 'grant-smoke-contestant: .*' "$L/s22c-grant.err" \
  | sed 's/^/s22c_grant_error=/' | tee -a "$L/reply.txt"
jq -n '{email: env.SMOKE_CONTESTANT_EMAIL,
  password: env.SMOKE_CONTESTANT_PASSWORD}' \
  | curl -sS -o "$L/s22c-token.json" \
    -w 's22c_signin_http=%{http_code}\n' \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H 'Content-Type: application/json' \
    --data-binary @- \
    "https://$REF.supabase.co/auth/v1/token?grant_type=password" \
  | tee -a "$L/reply.txt"
jq -r '.access_token | split(".")[1]
  | gsub("-"; "+") | gsub("_"; "/")
  | . + ("=" * ((4 - length % 4) % 4))
  | @base64d | fromjson
  | "s22c_claim_names=\(keys | join(","))",
    "s22c_claim_grants=\(.grants | tojson)"' \
  "$L/s22c-token.json" 2> /dev/null | tee -a "$L/reply.txt"
(umask 077
 jq -r '"Authorization: Bearer \(.access_token)"' \
   "$L/s22c-token.json" > "$L/s22c-user.h" 2> /dev/null)
curl -sS -o /dev/null -X POST \
  -w 's22c_logout_http=%{http_code}\n' \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H @"$L/s22c-user.h" \
  "https://$REF.supabase.co/auth/v1/logout" \
  | tee -a "$L/reply.txt"
rm -f "$L/s22c-token.json" "$L/s22c-user.h"
unset SUPABASE_SERVICE_ROLE_KEY
psql -X -w -f infra/scripts/check-seed.sql \
  > "$L/s22c-check-seed.log" 2>&1
S=$?
rl "s22c_check_seed_exit=$S"
[ "$S" -ne 0 ] && errline s22c_check_seed_line "$L/s22c-check-seed.log"
unset SMOKE_CONTESTANT_EMAIL SMOKE_CONTESTANT_PASSWORD
gate 11 "Step 12 (trackEvents true again)" \
  's22c_create_http=200' 's22c_grant_exit=0' \
  's22c_candidate=smoke_cand_0000' 's22c_grants=1' 's22c_terms=1' \
  's22c_signin_http=200' 's22c_claim_names=?*' \
  's22c_claim_grants=\[{*}\]' 's22c_claim_grants=!*},{*' \
  's22c_claim_grants=*"scope":"entity"*' \
  's22c_claim_grants=*"role":"editor"*' \
  's22c_logout_http=204' 's22c_check_seed_exit=0'

fi

# ---- Step 12: trackEvents true again ----------------------------------------
if want 12; then

# The statement of 189.1-07, run over the sitting's verify-full connection
# instead of the dashboard's SQL editor; it returns the same row.
CUR=12
say "Step 12: trackEvents true again"
psql -X -w -q -At -F "$NL" > "$L/s12.out" 2> "$L/s12.err" <<'SQL'
\set ON_ERROR_STOP on
SET statement_timeout = '5s';
WITH u AS (
  UPDATE public.app_settings
  SET
    settings = jsonb_set(
      settings,
      '{analytics}',
      coalesce(settings -> 'analytics', '{}'::jsonb)
        || '{"trackEvents": true}'::jsonb
    ),
    updated_at = now()
  WHERE project_id = '00000000-0000-0000-0000-000000000001'
  RETURNING settings #> '{analytics,trackEvents}' AS track_events,
    updated_at
)
SELECT 's12_rows=' || count(*),
  's12_track_events=' || coalesce(string_agg(track_events::text, ','), ''),
  's12_updated_at=' || coalesce(string_agg(updated_at::text, ','), '')
FROM u;
SQL
S=$?
rl "s12_exit=$S"
[ "$S" -ne 0 ] && errline s12_line "$L/s12.err"
grep '^s12_' "$L/s12.out" | tee -a "$L/reply.txt"
TE_AT=$(value_of s12_updated_at)
[ "$TE_AT" = $'\001' ] && TE_AT=
gate 12 "Step 13 (the settings check and the history, read back)" \
  's12_exit=0' 's12_rows=1' 's12_track_events=true' 's12_updated_at=?*'

fi

# ---- Step 13: the settings check and the history, read back -----------------
if want 13; then

CUR=13
say "Step 13: the settings check and the history, read back"
psql -X -w -f infra/scripts/check-deployment-settings.sql \
  > "$L/s13-settings.log" 2>&1
S=$?
rl "s13_settings_exit=$S"
if [ "$S" -ne 0 ]; then
  X=$(scrub "$L/s13-settings.log" | head -n 1)
  rl "s13_settings_line=$X"
fi
psql -X -w -At -c "$Q" > "$L/s13-history.log" 2>&1
S=$?
rl "s13_history_exit=$S"
if [ "$S" -eq 0 ]; then
  rl "s13_versions_final=$(paste -sd' ' "$L/s13-history.log")"
fi
gate 13 "Step 14 (the clean-up and the reply)" \
  's13_settings_exit=0' 's13_history_exit=0' \
  's13_versions_final=00001 00002 00003 00004'

fi

CUR=14
exit 0
