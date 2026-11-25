#!/usr/bin/env bash
# Restores the candidate registration mode `identity_provider` on staging's
# settings row, which the 189.1.1-12 rebuild did not write again (operator,
# 2026-11-25: "Yes, we want restored identity_provider on staging").
#
# One statement, over a verify-full connection. It appends the mode to
# contestantApp.servedEntityTypes.candidate.registrationModes when it is
# absent and changes nothing else; a second run changes nothing at all.
#
# Run it from a terminal:  bash <path to this file>
#
# Each step checks its own named lines and goes on by itself when they
# match; it asks y/n only on a mismatch. The database password is read
# without echo and lives only in this process. The reply is printed, copied
# to the clipboard and saved to tmp/supabase-rebuild/reply-restore-idp.txt.

cd "$(dirname "$0")" && cd "$(git rev-parse --show-toplevel)" || exit 2
ROOT=$PWD
export LC_ALL=C
NL=$'\n'
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-idp.XXXXXX")
(umask 077; : > "$L/reply.txt"; : > "$L/empty.pgpass")
REPLY_FILE=$ROOT/tmp/supabase-rebuild/reply-restore-idp.txt
CUR=0
STOPPED=
MODES_PATH='{contestantApp,servedEntityTypes,candidate,registrationModes}'
export MODES_PATH

rl() { printf '%s\n' "$*" | tee -a "$L/reply.txt"; }
say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
scrub() {
  sed -E -e "s/${PGHOST:-POOLER}/POOLER/g" \
    -e 's/[A-Za-z0-9*.-]*pooler[.]supabase[.]com/POOLER/g' \
    -e 's/\([0-9a-fA-F:.]+\)/(ADDRESS)/g' \
    -e 's/([0-9]{1,3}[.]){3}[0-9]{1,3}/ADDRESS/g' "$1" \
    | grep -v -e '^WARNING' -e '^ *$'
}
errline() {
  local x
  x=$(scrub "$2" | grep -m 1 -E 'ERROR|FATAL|error:')
  [ -n "$x" ] || x=$(scrub "$2" | tail -n 1)
  rl "$1=$x"
}

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

finish() {
  trap - EXIT INT TERM
  [ -z "$STOPPED" ] && [ "$CUR" -lt 9 ] && STOPPED=$CUR
  say "Clean-up and the reply"
  local body logs=no
  body=$(test -s "$L/reply.txt" && sed 's/^/answer_/' "$L/reply.txt")
  test -n "$L" && rm -rf "$L" && logs=yes
  unset PGPASSWORD
  mkdir -p "$(dirname "$REPLY_FILE")"
  (umask 077
   {
     [ -n "$body" ] && printf '%s\n' "$body"
     echo "answer_logs_removed=$logs"
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
    echo "Stopped at step $STOPPED."
  else
    echo "Finished."
  fi
}
trap finish EXIT
trap 'echo; echo "Interrupted."; exit 130' INT TERM

# modes NAME: prints NAME_modes=<json array> and NAME_track_events=<bool>.
modes() {
  psql -X -w -q -At -v k="$1" > "$L/$1.out" 2> "$L/$1.err" <<'SQL'
\set ON_ERROR_STOP on
SET statement_timeout = '5s';
\getenv p MODES_PATH
SELECT :'k' || '_modes=' || coalesce((settings #> :'p'::text[])::text, '(absent)')
FROM public.app_settings
WHERE project_id = '00000000-0000-0000-0000-000000000001';
SELECT :'k' || '_track_events='
  || coalesce((settings #> '{analytics,trackEvents}')::text, '(absent)')
FROM public.app_settings
WHERE project_id = '00000000-0000-0000-0000-000000000001';
SQL
  local s=$?
  rl "$1_exit=$s"
  [ "$s" -ne 0 ] && errline "$1_line" "$L/$1.err"
  grep "^$1_" "$L/$1.out" | tee -a "$L/reply.txt"
}

# ---- Step 0: the tools ------------------------------------------------------
CUR=0
say "Step 0: the tools"
PSQL_MAJOR=$(psql --version 2> /dev/null | sed -E 's/[^0-9]*([0-9]+).*/\1/')
rl "s0_psql_major=${PSQL_MAJOR:-none}"
gh auth status > /dev/null 2>&1 && rl "s0_gh_signed_in=yes" \
  || rl "s0_gh_signed_in=no"
gate 0 "Step 1 (the password and a test connection)" \
  's0_psql_major=1[6-9]' 's0_gh_signed_in=yes'

# ---- Step 1: the connection, verifying the server ---------------------------
CUR=1
say "Step 1: the database password and the connection"
REF=$(sed -n 's/^project_ref *= *"\([a-z]*\)".*/\1/p' \
  infra/envs/staging/supabase/terraform.tfvars)
rl "s1_ref=$REF"
printf 'database password: '; read -rs PGPASSWORD < /dev/tty
echo; export PGPASSWORD
unset PGHOSTADDR PGSERVICE
PGHOST=$(gh variable get SUPABASE_POOLER_HOST --env staging)
export PGHOST PGPORT=5432 PGUSER="postgres.$REF"
export PGDATABASE=postgres PGCONNECT_TIMEOUT=10
export PGPASSFILE="$L/empty.pgpass" PGSSLMODE=verify-full
export PGSSLROOTCERT="$PWD/infra/certs/supabase-root-2021-ca.crt"
psql -X -w -At -c 'select 1' > "$L/s1-conn.log" 2>&1
S=$?
rl "s1_conn_exit=$S"
[ "$S" -ne 0 ] && errline s1_conn_line "$L/s1-conn.log"
gate 1 "Step 2 (reading the modes, read-only)" \
  's1_ref=cofbsatfrdysyphajsky' 's1_conn_exit=0'

# ---- Step 2: the modes before, read-only ------------------------------------
CUR=2
say "Step 2: the modes before, read-only"
modes s2
gate 2 "Step 3 (adding identity_provider)" \
  's2_exit=0' 's2_modes=\[*"email"*\]' 's2_modes=*"code"*' \
  's2_track_events=true'

# ---- Step 3: the one statement ----------------------------------------------
CUR=3
say "Step 3: adding identity_provider when it is absent"
psql -X -w -q -At -F "$NL" > "$L/s3.out" 2> "$L/s3.err" <<'SQL'
\set ON_ERROR_STOP on
SET statement_timeout = '5s';
\getenv p MODES_PATH
WITH u AS (
  UPDATE public.app_settings
  SET
    settings = jsonb_set(
      settings,
      :'p'::text[],
      (settings #> :'p'::text[]) || '["identity_provider"]'::jsonb,
      false
    ),
    updated_at = now()
  WHERE project_id = '00000000-0000-0000-0000-000000000001'
    AND jsonb_typeof(settings #> :'p'::text[]) = 'array'
    AND NOT (settings #> :'p'::text[]) ? 'identity_provider'
  RETURNING updated_at
)
SELECT 's3_rows_changed=' || count(*),
  's3_updated_at=' || coalesce(string_agg(updated_at::text, ','), '(unchanged)')
FROM u;
SQL
S=$?
rl "s3_exit=$S"
[ "$S" -ne 0 ] && errline s3_line "$L/s3.err"
grep '^s3_' "$L/s3.out" | tee -a "$L/reply.txt"
gate 3 "Step 4 (reading the modes back)" \
  's3_exit=0' 's3_rows_changed=[01]'

# ---- Step 4: the modes after ------------------------------------------------
CUR=4
say "Step 4: the modes after"
modes s4
gate 4 "the clean-up" \
  's4_exit=0' 's4_modes=\[*"email"*\]' 's4_modes=*"code"*' \
  's4_modes=*"identity_provider"*' 's4_track_events=true'

CUR=9
exit 0
