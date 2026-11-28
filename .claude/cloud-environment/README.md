# OpenVAA cloud environment (Claude Code on the web)

The settings and setup script for a [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web) environment that runs this repository: builds, unit tests, the local Supabase stack and the E2E suite. Nothing here runs in CI or in a local checkout; it only describes the cloud container.

## Create the environment

claude.ai/code → environment menu → **Add environment**, with:

- **Name:** `voting-advice-application`
- **Network access:** Limited
  - Allow package managers: on
  - Allow MCP servers: on
  - Allowed hosts:
    - `pkg-containers.githubusercontent.com` (GHCR image blobs for local Supabase)
    - `cdn.jsdelivr.net` (Paraglide's inlang plugins)
- **Environment variables:**
  - `SUPABASE_INTERNAL_IMAGE_REGISTRY=ghcr.io`
  - `E2E_SLOW_HOST=1`
- **Secrets:** none
- **Setup script:** paste [`setup.sh`](./setup.sh) verbatim
- **Repository:** `openvaa/voting-advice-application` (the account needs GitHub access to it)

A Claude session can also create it for you: ask it to "set up a cloud environment from `.claude/cloud-environment/`", and it will propose these settings for your approval.

## What the setup script does

It runs as root each time a container is built fresh, from the directory that holds the checkout.

1. Installs Node 24 at `/opt/node24` beside the image's Node 22, links it into `~/.local/bin`, and sets `NODE_USE_ENV_PROXY=1` so Node's `fetch` honours the egress proxy.
2. Installs the Supabase CLI at the version CI uses.
3. Runs `yarn install --immutable && yarn build` in the checkout. A failure here is reported but does not block the session, so a branch with another toolchain still opens.
4. Installs the GSD skills, agents and hooks into the user's `~/.claude` (never into the repository).
5. Writes `/usr/local/bin/openvaa-stack-up`, which starts `dockerd` and local Supabase, warms the Edge Function Deno cache through the proxy's CA, and fills `.env` with the local stack keys.
6. Appends a short "Cloud environment (OpenVAA)" section to the user's `~/.claude/CLAUDE.md`, so every session knows to run `openvaa-stack-up` first.

## Using it in a session

Docker is not started at boot. From the repository root:

```bash
openvaa-stack-up
```

Then `yarn db:*`, `yarn dev` and E2E runs work as described in the root `CLAUDE.md`. A full E2E run on this 4-CPU box:

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --no-watch
```

`E2E_SLOW_HOST=1` gives the suite 3 workers and a 180 s per-test ceiling on branches that read it; on branches that don't, use `--project <name>` runs. Re-run `openvaa-stack-up` after `supabase stop --no-backup` or a Docker volume prune.

## Changing it

Edit `setup.sh` here, then paste it into the environment's settings again: the environment stores its own copy and does not read this file. Keep the script idempotent and non-interactive, and never put secrets in it or in the environment variables.
