---
created: "2026-09-04T00:00:00.000Z"
title: Local edge runtime needs a shell export to deliver PUBLIC_PROJECT_ID; the repo-root .env is not a source
area: infra
priority: medium
files:
  - apps/supabase/supabase/config.toml
  - tests/IDURA-TEST-RUNBOOK.md
---

## Problem

`identity-callback` now resolves its project from `PUBLIC_PROJECT_ID` through `requireEnv` and has no
fallback, so an unconfigured local edge runtime makes every invocation fail with a 500 rather than
silently assigning self-registered candidates to a hardcoded project.

The `[edge_runtime.secrets]` entry added alongside that change is necessary but **not sufficient**.
Measured on Supabase CLI v2.83.0 (edge runtime 1.71.0, Deno 2.1.4), with the entry
`PUBLIC_PROJECT_ID = "env(PUBLIC_PROJECT_ID)"` present and the repo-root `.env` declaring the key:

- `yarn db:stop && yarn db:start` with the value only in the repo-root `.env` -> the variable does
  **not** reach the function. `docker exec supabase_edge_runtime_openvaa-local env` carried 0
  occurrences of it, and invoking the function returned:

  ```
  HTTP 500 {"error":"Internal server error"}
  ```

  with the container log naming the cause:

  ```
  [Error] identity-callback error: Error: Missing required environment variable: IDENTITY_PROVIDER_TYPE.
    code: "ERR_ENV_UNCONFIGURED", variable: "IDENTITY_PROVIDER_TYPE"
  ```

- The same restart with the value **exported into the shell first** -> the variable is delivered and
  the function resolves it.

The `env(...)` indirection therefore reads the **process environment**, not the repo-root `.env`.
`yarn db:start` runs `supabase start` with its working directory at `apps/supabase`, and the CLI does
not walk up two levels to the repository root to find an env file.

Both directions were probed, so neither half is an untested assumption:

| config.toml entry | value exported in shell | variable reaches the runtime |
| --- | --- | --- |
| present | no  | no  |
| absent  | yes | no  |
| present | yes | yes |

The entry is load-bearing: without it an exported value is not forwarded either. Only the
conjunction works.

## Observing it: a stale container masks the gap

Re-measured 2026-09-08 (Phase 161 UAT, test 4) and reproduced exactly. One trap is worth writing
down, because it made the gap look absent on first inspection:

**The edge-runtime container caches the environment it was created with.** A container created from
a shell that HAD exported the value keeps carrying it — `docker inspect
supabase_edge_runtime_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' | grep
PUBLIC_PROJECT_ID` printed the value from a container built seven hours earlier, while the shell
doing the inspecting had the variable unset. Read on its own that looks like the gap is closed.

`yarn db:start` does not rebuild a container that already exists, so nothing about a running stack
tells you which shell it inherited. Only a clean restart measures the current shell:

```bash
yarn db:stop && yarn db:start                     # from a shell with PUBLIC_PROJECT_ID unset
docker exec supabase_edge_runtime_openvaa-local env | grep -c PUBLIC_PROJECT_ID   # -> 0
```

Confirmed again at that clean restart: the variable is absent from `.Config.Env` entirely, and
`POST /functions/v1/identity-callback` returns `HTTP 500 {"error":"Internal server error"}` with the
container log naming `code: "ERR_ENV_UNCONFIGURED", variable: "IDENTITY_PROVIDER_TYPE"` — the same
failure recorded above, still dying on `IDENTITY_PROVIDER_TYPE` before it ever reaches the project id.

Exporting and restarting delivers it. So the matrix above still holds; it just cannot be read off a
stack that was already running.

## Interim workaround (verified, not assumed)

Export the value before starting the stack:

```bash
export PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001
yarn db:stop && yarn db:start
```

Or use the runbook's existing Option A, which is unaffected because it passes the env file
explicitly and supplies all seven required variables rather than the one named in `config.toml`:

```bash
npx supabase functions serve identity-callback --no-verify-jwt --env-file ../../../.env
```

## Blast radius

Bounded and measured. The `bank-auth` and `bank-auth-journey` Playwright projects are gated behind
`PLAYWRIGHT_BANK_AUTH` and are excluded from the default `yarn test:e2e` run, so the default suite is
unaffected. What is affected is the Idura runbook and any local invocation of `identity-callback`
served through `supabase start`.

Note that only `PUBLIC_PROJECT_ID` is named in `[edge_runtime.secrets]`. The function requires seven
variables, so a `supabase start`-served function still fails on `IDENTITY_PROVIDER_TYPE` before it
ever reaches the project id. Serving all seven through the secrets block is a separate decision with
its own deployment implications and is deliberately not taken here.

## Solution

TBD — candidates:

- Add a `--env-file ../../../.env` equivalent to the `db:start` script, if the CLI supports it for
  `start` rather than only for `functions serve`.
- Create `apps/supabase/supabase/functions/.env` (currently absent, and it would be tracked rather
  than ignored, so it must not carry real secrets).
- Wire the remaining required variables into `[edge_runtime.secrets]` so a bare `yarn db:start`
  yields a working function.
- Re-measure on a newer CLI: v2.116.0 was available at the time of writing and may resolve env files
  differently.

## Update 2026-10-22 (Phase 179, plan 179-15): `identity-callback` no longer reads a project

`identity-callback` takes its project from the request (`project_id`, a required uuid) and reads no `PUBLIC_PROJECT_ID` from its environment, so this todo no longer affects it. It now requires `IDENTITY_CALLBACK_SERVER_SECRET` instead, which the `[edge_runtime.secrets]` block does not name, like the identity provider's other variables (whether a bare `yarn db:start` delivers any of them from `apps/supabase/supabase/functions/.env` was not measured by this plan). A request without the credential header is refused before any variable is read, so an unconfigured local function answers `401 refused` to an anonymous call rather than `500`.

The `PUBLIC_PROJECT_ID` entry of `[edge_runtime.secrets]` stays: `send-email` still requires the variable and refuses a request whose `project_id` differs from it. The gap this todo records (the entry reads the process environment, not the repo-root `.env`) is therefore unchanged for `send-email`.

The "Blast radius" paragraph is stale since Phase 179's harness: the bank-auth projects are part of every run, and `tests/scripts/e2e-run.sh` serves the function with a generated environment file for the length of the run.
