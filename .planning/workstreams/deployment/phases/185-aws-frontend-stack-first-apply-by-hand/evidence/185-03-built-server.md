DIAG_NEW_HEADERS=yes
DIAG_ORIGIN_HEADER_ABSENT=yes
DIAG_CLIENT_ADDRESS_DEPTH2=yes
SHUTDOWN_LINE_SEEN=yes
SERVER_EXIT=0
E2E_RUN_DIR=tests/e2e-runs/185-03-20261112T165725Z
E2E_WRAPPER_EXIT=0
E2E_TARGETED=green
E2E_COUNTS=total 4, passed 4, failed 0, flaky 0, skipped 0, did not run 0

# The production build: the stop line, the diagnostics allow-list and the voter journey

Every status above was read from the command itself, written to a status file by the same shell that ran it, never through a pipe: the build's and the type check's exit status, the server's own exit status taken with `wait` on the process this plan started, the HTTP status from `curl -s -o <file> -w '%{http_code}'`, and the wrapper's exit status.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-11-12, 16:38:03Z (build start) to 16:59:30Z (E2E end) |
| Commit | `5909e37d88750664607279771d4b926f3a66001f`, the `HEAD` for the build, the server and the E2E run |
| Tracked changes in the worktree | none before the build (`git status --porcelain --untracked-files=no` empty) and none at the E2E run (`worktree-status.txt` empty) |
| Node | v24.21.0 |
| `@sveltejs/kit` | 2.70.3 |
| `@sveltejs/adapter-node` | 5.5.7 |

## Type check and the build

| Command | Status | Result |
|---------|--------|--------|
| `yarn workspace @openvaa/frontend typecheck` | 0 | `COMPLETED 2326 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `TURBO_CACHE_DIR=<a new empty directory under tmp/185-03/> yarn build --filter=@openvaa/frontend` | 0 | `Tasks: 11 successful, 11 total`, `Cached: 0 cached, 11 total`, `Time: 2m11.046s` |

Both ran in the background with output and status in files under `tmp/185-03/`. The build id on disk, `apps/frontend/build/client/_app/version.json`, is `{"version":"1794501555761"}`.

## The built server

Started from the repository root as:

```
env -i PATH=<node 24.21.0 bin>:/usr/bin:/bin:/usr/sbin:/sbin HOME=<home> \
  PORT=3185 ORIGIN=http://127.0.0.1:3185 \
  PUBLIC_SUPABASE_URL=http://127.0.0.1:9 PUBLIC_SUPABASE_ANON_KEY=unused \
  PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001 \
  ADDRESS_HEADER=x-forwarded-for XFF_DEPTH=2 DEPLOYMENT_DIAGNOSTICS=true \
  node ./apps/frontend/build/index.js
```

Port 3185 was free before the start and free after the exit (`lsof -nP -iTCP:3185 -sTCP:LISTEN` empty both times). Nothing listens on `127.0.0.1:9`, so no Supabase was contacted. The root `.env` was not opened; `env -i` gave the process only the variables on that line.

### The diagnostics request

```
curl -s -o diag.json -w '%{http_code}' \
  -H 'x-forwarded-for: 203.0.113.99, 198.51.100.4, 192.0.2.10' \
  -H 'cloudfront-viewer-address: 198.51.100.4:443' \
  -H 'x-amz-cf-id: test-request-id' \
  -H 'x-origin-verify: planted' \
  http://127.0.0.1:3185/api/diagnostics
```

HTTP status `200`. The body, unedited:

```json
{"origin":"http://127.0.0.1:3185","clientAddress":"198.51.100.4","clientAddressError":null,"headers":{"host":"127.0.0.1:3185","x-forwarded-for":"203.0.113.99, 198.51.100.4, 192.0.2.10","cloudfront-viewer-address":"198.51.100.4:443","x-amz-cf-id":"test-request-id"}}
```

- `DIAG_NEW_HEADERS=yes`: `cloudfront-viewer-address` and `x-amz-cf-id` are both in `headers`, with the values sent.
- `DIAG_ORIGIN_HEADER_ABSENT=yes`: `grep -c 'x-origin-verify' diag.json` and `grep -c 'planted' diag.json` are both `0`.
- `DIAG_CLIENT_ADDRESS_DEPTH2=yes`: `clientAddress` is `198.51.100.4`, the second entry from the right of the three-entry `x-forwarded-for`, as `XFF_DEPTH=2` asks.

### The stop

`kill -TERM <pid>`, then `wait <pid>`: exit status `0` (`SERVER_EXIT=0`). Standard output held only `Listening on http://0.0.0.0:3185`. Standard error held the one shutdown line, unedited:

```
{
  level: 40,
  time: 1794501714261,
  msg: 'The server is exiting after its stop.',
  severityText: 'WARN',
  attributes: {
    reason: 'SIGTERM',
    signal: 'SIGTERM',
    inFlightAtSignal: 0,
    drainMs: 1
  }
}
```

`grep -c 'The server is exiting after its stop.' server.err` is `1` (`SHUTDOWN_LINE_SEEN=yes`). Level 40 is `warn`. The line carries the reason, the signal name and two numbers, and nothing taken from the request.

## The targeted E2E run

| Item | Value |
|------|-------|
| Command | `FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-03-20261112T165725Z --no-db-reset --project voter-journey`, in the background, polled |
| Started / ended | 2026-11-12T16:57:33Z / 2026-11-12T16:59:30Z |
| Wrapper status | 0 (`E2E_WRAPPER_EXIT=0`); `playwright exit 0`; preflight failures 0, successes 1 |
| Void marker | absent (`VOID-host-suspend.txt` not in the run directory) |
| Tests | `data-setup-base`, two `voter-journey` tests, `data-teardown-base`: 4 passed in 1.1 min |
| `node tests/scripts/e2e-spec-verdict.mjs <run-dir> --no-flaky` | status 0, `VERDICT OK: 4 tests -- passed 4, failed 0, flaky 0, skipped 0, did not run 0` |
| `node tests/scripts/e2e-evidence.mjs <run-dir>` | `total 4, passed 4, failed 0, flaky 0, skipped 0, didNotRun 0` |

### The stack it ran on

- At the precondition check (`test -f .env` status 0, `yarn db:status` status 0) the shared local Supabase stack held the `voting-advice-application-gsd` checkout's schema (21 applied migrations, up to `00021`) and its edge runtime mounted that checkout's `functions` directory, because a full-suite E2E run from that checkout (`tests/e2e-runs/179.2/179.2-final-3`) was in flight on it. This checkout has one migration, `00001_initial_schema.sql`.
- This plan did not touch the stack while that run was in flight. It waited until the run's own exit file held `0`, checked that no `e2e-run.sh`, `playwright test` or `functions serve` process remained, then ran `yarn db:stop` (status 0) and `yarn db:reset` (status 0) from this checkout under the standing stack authorisation.
- After the reset the stack held one applied migration (`00001`) and the edge runtime mounted `voting-advice-application-infra/apps/supabase/supabase/functions`. The E2E run then used `--no-db-reset`, as planned.

### The port

Port 5173 was held by a Vite dev server of an unrelated project (`*:5173`, a wildcard bind, started 2026-11-05). It was left alone, and the run used the documented one-off override `FRONTEND_PORT=5273`, free at the start of the run.
