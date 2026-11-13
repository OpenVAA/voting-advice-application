#!/bin/bash
# Spike 039 — prove the edge-runtime bundler and runtime resolve `functions/_shared/`.
#
# Run after `git apply .planning/spikes/039-shared-module/shared-module.patch`.
# Uses the edge-runtime image standalone, on its own port and container name, so a running
# local Supabase stack is not touched. Leaves nothing behind but the files under $OUT.
#
# usage: ./verify.sh [image]        default image: the one the local stack runs
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FUNCTIONS="$(cd "$HERE/../../../apps/supabase/supabase/functions" && pwd)"
IMG="${1:-public.ecr.aws/supabase/edge-runtime:v1.76.2}"
OUT="${OUT:-$(mktemp -d)}"
PORT="${PORT:-54991}"
NAME=spike039-edge
FNS="send-email invite-candidate identity-callback account-access"

echo "== bundle (what \`supabase functions deploy\` runs in Docker) and list each bundle's modules"
for fn in $FNS; do
  mkdir -p "$OUT/eszip" "$OUT/unbundled/$fn"
  docker run --rm -v "$FUNCTIONS:/home/deno/functions:ro" -v "$OUT/eszip:/out" -w /home/deno/functions \
    --entrypoint edge-runtime "$IMG" bundle --entrypoint "/home/deno/functions/$fn/index.ts" --output "/out/$fn.eszip" \
    > "$OUT/eszip/$fn.log" 2>&1
  echo "bundle $fn exit=$?"
  # Unbundle one directory deep: `../_shared/*` is extracted relative to the entrypoint, so
  # unbundling straight into the mount root would write it outside the mount and hide it.
  docker run --rm -v "$OUT/eszip:/in:ro" -v "$OUT/unbundled:/out" --entrypoint edge-runtime "$IMG" \
    unbundle --eszip "/in/$fn.eszip" --output "/out/$fn/fn" > /dev/null 2>&1
  (cd "$OUT/unbundled/$fn" && find . -type f | sort | sed 's/^/    /')
done

echo "== serve each function from source and call it"
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
  echo "$fn: OPTIONS $code | POST {} → $post"
  docker logs "$NAME" 2>&1 | grep -E 'Missing required environment variable' | head -1 | sed 's/^/    log: /'
  docker rm -f "$NAME" > /dev/null 2>&1
done
echo "artifacts in $OUT"
