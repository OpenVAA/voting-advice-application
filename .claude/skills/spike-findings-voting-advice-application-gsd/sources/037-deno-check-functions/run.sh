#!/bin/bash
# Spike 037 — typecheck the Edge Functions with Deno.
# usage: DENO=/path/to/deno ./run.sh        (defaults to `deno` on PATH)
# Places the spike's deno.json in supabase/functions/ if none is there, runs `deno check .` from
# that directory (Deno discovers its config from the CWD, not from the checked file), and removes
# the config again if this script put it there. Exit status is deno's own.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FUNCTIONS="$(cd "$HERE/../../../apps/supabase/supabase/functions" && pwd)"
DENO="${DENO:-deno}"
placed=0
if [ ! -f "$FUNCTIONS/deno.json" ]; then cp "$HERE/deno.json" "$FUNCTIONS/deno.json"; placed=1; fi
( cd "$FUNCTIONS" && NO_COLOR=1 "$DENO" check . ); rc=$?
[ "$placed" = 1 ] && rm -f "${FUNCTIONS:?}/deno.json"
echo "deno check exit=$rc"
exit $rc
