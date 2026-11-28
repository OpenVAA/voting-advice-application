#!/bin/bash
# OpenVAA cloud setup: Node 24, Supabase CLI, deps + build, GSD, and an `openvaa-stack-up` helper.
set -euo pipefail
NODE_VER=24.21.0
SB_VER=2.118.0
GSD_VER=1.42.3

# Node 24 (repo engines >=24.15.0) beside the image's Node 22; first on PATH for every shell.
if [ "$(/opt/node24/bin/node -v 2>/dev/null)" != "v$NODE_VER" ]; then
  mkdir -p /opt/node24
  curl -fsSL "https://nodejs.org/dist/v$NODE_VER/node-v$NODE_VER-linux-x64.tar.xz" | tar -xJ -C /opt/node24 --strip-components=1
fi
# NODE_USE_ENV_PROXY: Node's fetch (Paraglide's inlang plugin download) otherwise ignores HTTPS_PROXY.
export PATH=/opt/node24/bin:$PATH NODE_USE_ENV_PROXY=1
# Claude's shell resets PATH after ~/.bashrc, so link Node 24 into ~/.local/bin (ahead of /opt/node22/bin).
mkdir -p /root/.local/bin
for b in node npm npx; do ln -sf "/opt/node24/bin/$b" "/root/.local/bin/$b"; done
# The env var survives; it must sit above .bashrc's non-interactive `return`.
grep -q 'NODE_USE_ENV_PROXY' /root/.bashrc || sed -i '1i export NODE_USE_ENV_PROXY=1' /root/.bashrc
[ -x /opt/node24/bin/yarn ] || npm i -g yarn@1.22.22   # shim; the repo's yarnPath runs Yarn 4

# Supabase CLI, same version as CI (the npm package's postinstall download is disabled by Yarn).
if ! supabase --version 2>/dev/null | grep -qx "$SB_VER"; then
  curl -fsSL "https://github.com/supabase/cli/releases/download/v$SB_VER/supabase_linux_amd64.tar.gz" | tar -xz -C /usr/local/bin supabase
fi

if [ -d voting-advice-application ]; then
  # Non-fatal: a branch with another toolchain (e.g. the Strapi-era main) must not block the session.
  (cd voting-advice-application && yarn install --immutable && yarn build) || echo "setup: repo install/build failed; run it in-session"
fi

# GSD skills, agents and hooks into ~/.claude (user scope; never committed).
(cd /root && npx -y "get-shit-done-cc@$GSD_VER" --claude --global)

# Helper that brings Docker + local Supabase up so the E2E wrapper can run.
cat > /usr/local/bin/openvaa-stack-up <<'EOF'
#!/bin/bash
# Usage: openvaa-stack-up [repo-dir]. Starts dockerd, local Supabase, warms the Edge Function
# Deno cache through the egress proxy's CA, and writes the local stack keys into .env.
set -euo pipefail
export PATH=/opt/node24/bin:$PATH NODE_USE_ENV_PROXY=1 SUPABASE_INTERNAL_IMAGE_REGISTRY=${SUPABASE_INTERNAL_IMAGE_REGISTRY:-ghcr.io}
cd "${1:-$(git rev-parse --show-toplevel)}"
if ! docker info >/dev/null 2>&1; then
  (setsid nohup dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 60); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
yarn db:start >/tmp/openvaa-db-start.log 2>&1 || { yarn db:stop >/dev/null 2>&1; yarn db:start >/tmp/openvaa-db-start.log 2>&1; }
# The edge runtime trusts only its built-in roots, so it cannot fetch npm: through the proxy.
# Pre-fill its Deno cache volume from the host, where the proxy CA is trusted.
C=supabase_edge_runtime_openvaa-local
V=$(docker volume inspect -f '{{.Mountpoint}}' "$C")
(cd apps/supabase/supabase/functions && DENO_DIR="$V" DENO_CERT=/root/.ccr/ca-bundle.crt \
  ../../../../node_modules/.bin/deno cache --config deno.json ./*/index.ts >/dev/null)
docker restart "$C" >/dev/null
[ -f .env ] || cp .env.example .env
S=$(cd apps/supabase && supabase status -o env)
A=$(printf '%s\n' "$S" | grep '^ANON_KEY=' | cut -d= -f2- | tr -d '"')
R=$(printf '%s\n' "$S" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')
sed -i -e "s|^PUBLIC_SUPABASE_ANON_KEY=.*|PUBLIC_SUPABASE_ANON_KEY=$A|" -e "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$A|" \
  -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$R|" .env
for f in account-access identity-callback send-email; do
  for _ in $(seq 30); do
    c=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "http://127.0.0.1:54321/functions/v1/$f" || true)
    [ "$c" -lt 500 ] 2>/dev/null && break; sleep 2
  done
  echo "openvaa-stack-up: $f OPTIONS $c"
done
EOF
chmod +x /usr/local/bin/openvaa-stack-up

# Tell Claude in every session how to bring the stack up; replace this section if a previous run wrote it.
mkdir -p /root/.claude
F=/root/.claude/CLAUDE.md
touch "$F"
sed -i '/^## Cloud environment (OpenVAA)$/,/^## /{/^## Cloud environment (OpenVAA)$/d;/^## /!d}' "$F"
cat >> "$F" <<'EOF'
## Cloud environment (OpenVAA)
- Node 24 is at /opt/node24/bin, linked into ~/.local/bin; NODE_USE_ENV_PROXY=1 is set in ~/.bashrc.
- The box has 4 CPUs. E2E_SLOW_HOST=1 is set environment-wide: on branches with PR #909 (the v2.16 stack
  once restacked) it gives the suite 3 workers and a 180 s per-test ceiling, which runs it green (~42 min).
  Branches without it keep 6 workers/90 s and time out here: use `--project <name>` runs on those.
- Docker is not started at boot. Before `yarn db:*`, `yarn dev` or any E2E run, run `openvaa-stack-up`
  from the repo root: it starts dockerd and Supabase, warms the Edge Function cache and fills `.env`.
- Full E2E: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --no-watch`.
- If `supabase stop --no-backup` or a volume prune ran, re-run `openvaa-stack-up` before E2E.
EOF
