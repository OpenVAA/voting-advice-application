#!/usr/bin/env bash
# Phase 191 plan 05 evidence: a fixture instance made only of files added under instance/ changes
# settings, theme, font, favicon, logo and messages in a local build, a served build and the
# production Docker image; invalid overlays fail the build; with the fixture removed the build
# returns to its base output and the image still builds.
#
# Usage (from the repo root, with a clean working tree and the stack up via openvaa-stack-up):
#   bash .planning/workstreams/nuorten-2027/phases/191-instance-overlay-upstream/191-05-instance-smoke.sh [--no-docker]
# DOCKER_BUILD_EXTRA holds extra `docker build` flags, e.g. `--network host` on a host whose
# containers reach the network only through the host.
set -euo pipefail

NO_DOCKER=0
[ "${1:-}" = "--no-docker" ] && NO_DOCKER=1

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

EVIDENCE=${EVIDENCE:-tests/e2e-runs/191-05-instance-smoke/evidence.log}
WORK=$(dirname "$EVIDENCE")
mkdir -p "$WORK"
: >"$EVIDENCE"

if [ -n "$(git status --porcelain)" ]; then
  echo "refusing to start: the working tree is not clean" >&2
  git status --short >&2
  exit 2
fi

# A per-run nonce in the fixture keeps every run a cache miss, so the miss assertion holds on reruns.
NONCE=$(date +%s)
SMOKE_EMAIL="instance-smoke-${NONCE}@example.org"
PORT=4391
ASSETS=apps/frontend/build/client/_app/immutable/assets
FIXTURE_PATHS=(instance/staticSettings.json instance/static instance/messages)
IMG_OVERLAY=openvaa-frontend:instance-smoke
IMG_BASE=openvaa-frontend:no-instance
read -r -a DOCKER_EXTRA <<<"${DOCKER_BUILD_EXTRA:-}"

FAILED=0
SERVER_PID=""
FIXTURE_PRESENT=0

log() { echo "$*" | tee -a "$EVIDENCE"; }
pass() { log "PASS $1"; }
fail() {
  log "FAIL $1: $2"
  FAILED=1
}
# check <name> <command...>: PASS when the command exits 0.
check() {
  local name=$1
  shift
  if "$@" >>"$WORK/check.out" 2>&1; then pass "$name"; else fail "$name" "\`$*\` exited non-zero"; fi
}

stop_server() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    SERVER_PID=""
  fi
}

remove_fixture() {
  rm -rf "${FIXTURE_PATHS[@]}" apps/frontend/.instance apps/frontend/build
  FIXTURE_PRESENT=0
}

on_exit() {
  local status=$?
  stop_server
  if [ "$FIXTURE_PRESENT" = 1 ]; then
    log "cleanup after an early exit: removing the fixture and rebuilding the base output"
    remove_fixture
    yarn build --filter=@openvaa/frontend >"$WORK/cleanup-build.log" 2>&1 || log "FAIL cleanup build: see $WORK/cleanup-build.log"
    status=1
  fi
  if [ "$NO_DOCKER" = 0 ]; then docker image rm -f "$IMG_OVERLAY" "$IMG_BASE" >/dev/null 2>&1 || true; fi
  [ "$FAILED" = 1 ] && status=1
  exit "$status"
}
trap on_exit EXIT

css_files() { find "$ASSETS" -maxdepth 1 -name '*.css'; }
css_listing() { ls "$ASSETS" | grep -E '\.css$' | sort; }

# The SSR server's view of the merged settings, run from a frontend directory.
settings_check_js() {
  echo "import('@openvaa/app-shared').then(m => process.exit(m.staticSettings.admin.email === '$1' && m.staticSettings.font.url === '$2' ? 0 : 1))"
}

# --- Baseline -------------------------------------------------------------------------------------
log "== baseline build"
# A turbo cache replay writes the outputs over build/ without removing files that are no longer
# outputs, so every build here that is compared starts from an absent build/.
rm -rf apps/frontend/build
yarn build --filter=@openvaa/frontend >"$WORK/baseline-build.log" 2>&1
css_listing >"$WORK/baseline-css.txt"
log "baseline CSS assets: $(wc -l <"$WORK/baseline-css.txt")"

# --- 1. Fixture -----------------------------------------------------------------------------------
log "== fixture"
FIXTURE_PRESENT=1
mkdir -p instance/static/fonts instance/static/images instance/messages
write_valid_settings() {
  cat >instance/staticSettings.json <<EOF
{
  "admin": { "email": "${SMOKE_EMAIL}" },
  "colors": { "light": { "primary": "#123456", "primary-content": "#fefefe" } },
  "font": { "name": "Smoke Sans", "url": "/fonts/smoke.css" },
  "logo": { "url": "/images/instance-logo.svg" }
}
EOF
}
write_valid_messages() {
  cat >instance/messages/en.json <<'EOF'
{ "common": { "account": { "emailRequired": "INSTANCE SMOKE TEXT" } } }
EOF
}
write_valid_settings
write_valid_messages
printf '/* instance-smoke-font %s */\n.instance-smoke { font-family: "Smoke Sans", sans-serif; }\n' "$NONCE" >instance/static/fonts/smoke.css
cp apps/frontend/static/images/error.svg instance/static/images/instance-logo.svg
cp apps/frontend/static/images/hero.png instance/static/favicon.png
check "fixture favicon differs from the base favicon" bash -c '! cmp -s instance/static/favicon.png apps/frontend/static/favicon.png'

# --- 2. Build -------------------------------------------------------------------------------------
log "== build with the fixture"
if yarn build --filter=@openvaa/frontend >"$WORK/fixture-build.log" 2>&1; then pass "build with the fixture exits 0"; else fail "build with the fixture exits 0" "see $WORK/fixture-build.log"; fi
check "turbo: @openvaa/app-shared:build is a cache miss" grep -q '@openvaa/app-shared:build: cache miss' "$WORK/fixture-build.log"
check "turbo: @openvaa/frontend:build is a cache miss" grep -q '@openvaa/frontend:build: cache miss' "$WORK/fixture-build.log"
check "app-shared dist holds the overlaid admin email" grep -q "$SMOKE_EMAIL" packages/app-shared/dist/index.js
check "SSR view: staticSettings.admin.email and font.url are overlaid" \
  bash -c "cd apps/frontend && node -e \"$(settings_check_js "$SMOKE_EMAIL" /fonts/smoke.css)\""
check "compiled CSS holds the overlaid primary #123456" bash -c "grep -qil '#123456' $(css_files | tr '\n' ' ')"
check "compiled CSS holds the font family Smoke Sans" bash -c "grep -ql 'Smoke Sans' $(css_files | tr '\n' ' ')"
check "compiled CSS no longer holds the base primary #2546a8" bash -c "! grep -qil '#2546a8' $(css_files | tr '\n' ' ')"
check "build/client/favicon.png is the instance favicon" cmp apps/frontend/build/client/favicon.png instance/static/favicon.png
check "build/client/fonts/smoke.css is the instance font file" cmp apps/frontend/build/client/fonts/smoke.css instance/static/fonts/smoke.css
check "build/client/images/instance-logo.svg is present" test -f apps/frontend/build/client/images/instance-logo.svg
check "build/client/fonts/inter.css (base only) is kept" test -f apps/frontend/build/client/fonts/inter.css
check "compiled Paraglide messages hold the instance text" grep -rlq 'INSTANCE SMOKE TEXT' apps/frontend/src/lib/paraglide
check "the build holds the overlaid logo url" grep -rlq '/images/instance-logo.svg' apps/frontend/build packages/app-shared/dist

# --- 3. Served and linked -------------------------------------------------------------------------
log "== served build"
PORT=$PORT ORIGIN="http://127.0.0.1:$PORT" node --env-file=.env apps/frontend/build/index.js >"$WORK/server.log" 2>&1 &
SERVER_PID=$!
up=0
for _ in $(seq 1 60); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/fonts/smoke.css" || true)" = 200 ]; then
    up=1
    break
  fi
  sleep 1
done
if [ "$up" = 1 ]; then
  pass "the built server answers 200 for /fonts/smoke.css"
  check "served /fonts/smoke.css is the instance file" bash -c "curl -s http://127.0.0.1:$PORT/fonts/smoke.css | grep -q instance-smoke-font"
  curl -sL "http://127.0.0.1:$PORT/" >"$WORK/root.html" || true
  check "the served page links the instance font stylesheet" \
    grep -Eq '<link[^>]*href="/fonts/smoke\.css"[^>]*rel="stylesheet"|<link[^>]*rel="stylesheet"[^>]*href="/fonts/smoke\.css"' "$WORK/root.html"
else
  fail "the built server answers 200 for /fonts/smoke.css" "no 200 within 60 s; see $WORK/server.log"
fi
stop_server

# --- 4. Negative builds ---------------------------------------------------------------------------
log "== invalid overlays fail the build"
echo '{ "colours": {} }' >instance/staticSettings.json
status=0
yarn build --filter=@openvaa/app-shared >"$WORK/negative-settings.log" 2>&1 || status=$?
if [ "$status" != 0 ] && grep -q 'Unrecognized key' "$WORK/negative-settings.log"; then
  pass "an unknown settings key fails the app-shared build with Unrecognized key"
else
  fail "an unknown settings key fails the app-shared build with Unrecognized key" "exit $status; see $WORK/negative-settings.log"
fi
write_valid_settings
# The failed build emptied app-shared's dist, which the message compile imports.
yarn build --filter=@openvaa/app-shared >"$WORK/restore-app-shared.log" 2>&1

echo '{ "common": { "publishedBy": "Published by {someoneElse}" } }' >instance/messages/en.json
status=0
yarn workspace @openvaa/frontend paraglide:compile >"$WORK/negative-messages.log" 2>&1 || status=$?
if [ "$status" != 0 ] && grep -q 'common.publishedBy' "$WORK/negative-messages.log"; then
  pass "a changed placeholder fails the message compile naming common.publishedBy"
else
  fail "a changed placeholder fails the message compile naming common.publishedBy" "exit $status; see $WORK/negative-messages.log"
fi
write_valid_messages

# --- 5. Docker with the overlay -------------------------------------------------------------------
if [ "$NO_DOCKER" = 0 ]; then
  log "== production image with the overlay"
  if docker build ${DOCKER_EXTRA[@]+"${DOCKER_EXTRA[@]}"} --progress=plain --file apps/frontend/Dockerfile --target production --tag "$IMG_OVERLAY" . >"$WORK/docker-overlay.log" 2>&1; then
    pass "docker build of the production image with the overlay exits 0"
    check "image SSR view: staticSettings.admin.email and font.url are overlaid" \
      docker run --rm -w /opt/apps/frontend "$IMG_OVERLAY" node -e "$(settings_check_js "$SMOKE_EMAIL" /fonts/smoke.css)"
    check "image: favicon and font file are the instance files" \
      docker run --rm "$IMG_OVERLAY" sh -c 'cmp /opt/apps/frontend/build/client/favicon.png /opt/instance/static/favicon.png && cmp /opt/apps/frontend/build/client/fonts/smoke.css /opt/instance/static/fonts/smoke.css'
  else
    fail "docker build of the production image with the overlay exits 0" "see $WORK/docker-overlay.log"
  fi
fi

# --- 6. Cleanup -----------------------------------------------------------------------------------
log "== cleanup"
remove_fixture
if yarn build --filter=@openvaa/frontend >"$WORK/cleanup-build.log" 2>&1; then pass "the base build after cleanup exits 0"; else fail "the base build after cleanup exits 0" "see $WORK/cleanup-build.log"; fi
check "the working tree is clean" bash -c 'test -z "$(git status --porcelain)"'
check "git ls-files instance is instance/README.md only" bash -c 'test "$(git ls-files instance)" = instance/README.md'
check "apps/frontend/.instance is absent" test ! -e apps/frontend/.instance
check "the CSS asset names equal the baseline" bash -c "diff <(ls $ASSETS | grep -E '\\.css\$' | sort) $WORK/baseline-css.txt"
check "build/client/favicon.png is the base favicon again" cmp apps/frontend/build/client/favicon.png apps/frontend/static/favicon.png
check "build/client/fonts/smoke.css is gone" test ! -e apps/frontend/build/client/fonts/smoke.css
check "SSR view: the base admin email is back" \
  bash -c "cd apps/frontend && node -e \"$(settings_check_js first.last@openvaa.org /fonts/inter.css)\""

# --- 7. Docker without the overlay ----------------------------------------------------------------
if [ "$NO_DOCKER" = 0 ]; then
  log "== production image without the overlay"
  if docker build ${DOCKER_EXTRA[@]+"${DOCKER_EXTRA[@]}"} --progress=plain --file apps/frontend/Dockerfile --target production --tag "$IMG_BASE" . >"$WORK/docker-base.log" 2>&1; then
    pass "docker build of the production image without the overlay exits 0"
    check "image SSR view: the base admin email" \
      docker run --rm -w /opt/apps/frontend "$IMG_BASE" node -e "$(settings_check_js first.last@openvaa.org /fonts/inter.css)"
    check "image: /opt/instance holds README.md only" \
      docker run --rm "$IMG_BASE" sh -c 'test "$(ls -A /opt/instance)" = README.md'
  else
    fail "docker build of the production image without the overlay exits 0" "see $WORK/docker-base.log"
  fi
fi

log "== $(grep -c '^PASS' "$EVIDENCE") passed, $(grep -c '^FAIL' "$EVIDENCE" || true) failed"
