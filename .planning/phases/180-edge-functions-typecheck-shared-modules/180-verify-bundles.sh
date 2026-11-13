#!/bin/bash
# Phase 180 — prove the edge-runtime bundler and runtime resolve `functions/_shared/` on an
# export of the committed tree. Adapted from spike 039's `verify.sh`.
#
# Uses the edge-runtime image standalone, on its own port and container name, so a running
# local Supabase stack is not touched. Run it on a `git archive` export, never on the working
# tree (a mount of the working tree would carry the ignored `functions/.env`).
#
# usage: bash 180-verify-bundles.sh <functions-dir> <artefact-dir> <record-dir> [image]
#   all three paths absolute; default image: the one the local stack runs
#
# Heavy outputs (eszips, unbundled trees) go under <artefact-dir>; text records under
# <record-dir>: bundle-<fn>.exit, bundle-<fn>.log, files-<fn>.txt, eszip-<fn>.sha256, serve.txt.
# Exits 1 when any bundle exits non-zero or any OPTIONS answer is not 200.
set -u
usage() {
  echo "usage: bash $(basename "$0") <functions-dir> <artefact-dir> <record-dir> [image]   (absolute paths)" >&2
  exit 2
}
[ $# -ge 3 ] && [ $# -le 4 ] || usage
for p in "$1" "$2" "$3"; do
  case "$p" in /*) ;; *) usage ;; esac
done
FUNCTIONS="$(cd "$1" && pwd)" || usage
ART="$2"
REC="$3"
IMG="${4:-public.ecr.aws/supabase/edge-runtime:v1.76.2}"
PORT=54992
NAME=p180-edge
mkdir -p "$ART/eszip" "$ART/unbundled" "$REC"

# Every directory with an `index.ts`, so `_shared/` is never bundled or served.
FNS=""
for entry in "$FUNCTIONS"/*/index.ts; do
  [ -f "$entry" ] || continue
  FNS="$FNS $(basename "$(dirname "$entry")")"
done
[ -n "$FNS" ] || { echo "no function directory with an index.ts under $FUNCTIONS" >&2; exit 1; }

trap 'docker rm -f "$NAME" > /dev/null 2>&1' EXIT
failed=0

echo "== bundle (what \`supabase functions deploy\` runs in Docker) and list each bundle's modules"
for fn in $FNS; do
  rm -rf "$ART/unbundled/$fn"
  mkdir -p "$ART/unbundled/$fn"
  docker run --rm -v "$FUNCTIONS:/home/deno/functions:ro" -v "$ART/eszip:/out" -w /home/deno/functions \
    --entrypoint edge-runtime "$IMG" bundle --entrypoint "/home/deno/functions/$fn/index.ts" --output "/out/$fn.eszip" \
    > "$REC/bundle-$fn.log" 2>&1
  code=$?
  echo "$code" > "$REC/bundle-$fn.exit"
  echo "bundle $fn exit=$code"
  [ "$code" -eq 0 ] || failed=1
  (cd "$ART/eszip" && shasum -a 256 "$fn.eszip" 2> /dev/null) > "$REC/eszip-$fn.sha256"
  # Unbundle one directory deep: `../_shared/*` is extracted relative to the entrypoint, so
  # unbundling straight into the mount root would write it outside the mount and hide it.
  docker run --rm -v "$ART/eszip:/in:ro" -v "$ART/unbundled:/out" --entrypoint edge-runtime "$IMG" \
    unbundle --eszip "/in/$fn.eszip" --output "/out/$fn/fn" > /dev/null 2>&1
  (cd "$ART/unbundled/$fn" && find . -type f | sed 's|^\./||' | LC_ALL=C sort) > "$REC/files-$fn.txt"
  sed 's/^/    /' "$REC/files-$fn.txt"
done

echo "== serve each function from source and call it"
: > "$REC/serve.txt"
for fn in $FNS; do
  docker rm -f "$NAME" > /dev/null 2>&1
  docker run -d --name "$NAME" -p "127.0.0.1:$PORT:9000" -v "$FUNCTIONS:/home/deno/functions:ro" \
    --entrypoint edge-runtime "$IMG" start --main-service "/home/deno/functions/$fn" -p 9000 > /dev/null
  code=000
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "http://127.0.0.1:$PORT/")
    [ "$code" != "000" ] && break
    sleep 0.5
  done
  post=$(curl -s -w ' [%{http_code}]' -X POST -H 'content-type: application/json' -d '{}' "http://127.0.0.1:$PORT/")
  echo "$fn: OPTIONS $code | POST {} → $post" | tee -a "$REC/serve.txt"
  docker logs "$NAME" 2>&1 | grep -E 'Missing required environment variable' | head -1 | sed 's/^/    log: /' |
    tee -a "$REC/serve.txt"
  [ "$code" = "200" ] || failed=1
  docker rm -f "$NAME" > /dev/null 2>&1
done
echo "artefacts in $ART, records in $REC"
exit "$failed"
