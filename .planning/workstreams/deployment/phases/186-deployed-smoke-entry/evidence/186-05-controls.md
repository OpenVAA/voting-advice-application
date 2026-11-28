# 186-05 evidence: the three negative controls of the deployed smoke gate

- **Date (UTC):** 2026-11-14 (local date 2026-11-15)
- **Commit (`git rev-parse HEAD`):** `a43a3ac9db308410bcf3752c392e725a65a824df` for every run below
- **Run form:** plan 186-02's: `env -u SUPABASE_SERVICE_ROLE_KEY -u SUPABASE_SECRET_KEY SMOKE_EXPECTED_SHA=<sha> PLAYWRIGHT_JSON_OUTPUT_FILE=<dir>/results.json PLAYWRIGHT_HTML_OUTPUT_DIR=<dir>/html yarn test:e2e:deployed --output <dir>/results > <dir>/smoke.log 2>&1`, no spec argument, in the background, its status read from `$?` on the next line and written to `<dir>/exit-status.txt`.
- **Root `.env`:** never read; neither the deployed config nor its global setup loads it.

Every status below was read directly, never through a pipe. No key value appears in this file.

## Control 1: a wrong expected SHA against staging

```
DEPLOYED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30
SERVED_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30
CONTROL_SHA_EXPECTED=a43a3ac9db308410bcf3752c392e725a65a824df
```

`DEPLOYED_SHA` is `image_tag` of `infra/envs/staging/aws/terraform.tfvars`. `SERVED_BUILD` is the `build` field of `curl -s https://staging.openvaa.org/api/health` (`{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`), read just before the run: the two are equal, so staging had not been redeployed. `CONTROL_SHA_EXPECTED` is `git rev-parse HEAD`, a valid 40-hex commit id that differs from `DEPLOYED_SHA`.

Target `https://staging.openvaa.org` (`SMOKE_BASE_URL` unset). Run window 2026-11-14T23:16:34Z to 23:16:35Z.

```
CONTROL_SHA_RUN_DIR=tests/e2e-runs/186-05-sha-20261114T231634Z
CONTROL_SHA_EXIT=1
```

The gate's lines and the headline, quoted from `smoke.log`:

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
FAIL sha: observed 712947a1bd44a735f66ee8f51610f4748d76cd30, expected a43a3ac9db308410bcf3752c392e725a65a824df
PASS ref
PASS project-id
Error: DEPLOYED SMOKE GATE FAILED — 1 of 4 checks failed
  FAIL sha: observed 712947a1bd44a735f66ee8f51610f4748d76cd30, expected a43a3ac9db308410bcf3752c392e725a65a824df
See tests/README.md § Deployed smoke run.
```

The error was thrown at `deployed-global-setup.ts:27`, in global setup: no spec ran.

## The unit refusals beside the controls

`node_modules/.bin/vitest run --config tests/vitest.config.ts deployedTarget`, run 2026-11-14T23:16:39Z:

```
SUPA09_UNIT_EXIT=0
SUPA09_UNIT_CASES=76 passed (76), 1 test file
```

Those 76 cases of `tests/tests/utils/deployedTarget.test.ts` refuse a made-up ref, the production ref `begckvkapaopoztbreqc`, the local stack by address and by name (`http://127.0.0.1:54321`, `http://localhost:54321`), foreign and malformed hosts, a document with no env block or an unparsable one, and every environment key that might widen the ref ("no input widens the ref": a foreign ref is still refused when every input names it, and a crowded environment gives the same checks as the expected commit alone). That the run cannot be pointed at a production project rests on these refusals: the expected ref is read only from the committed `infra/envs/staging/supabase/terraform.tfvars`, never from an input.

## The local production build of the deployed tree

Precondition: `git diff --quiet 712947a1bd44a735f66ee8f51610f4748d76cd30 -- apps packages` exited 0 (the build is of the deployed tree), and `yarn db:status` exited 0 (the shared local stack was up; the standing authorisation of 2026-10-20 covers its use).

`BUILD_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30 TURBO_CACHE_DIR=tmp/186-05/turbo-cache yarn build --filter=@openvaa/frontend`, in the background, 2026-11-14T23:17:35Z to 23:18:33Z: `Tasks: 11 successful, 11 total`, `Cached: 0 cached, 11 total`, `Time: 56.794s`. `apps/frontend/build/client/_app/version.json` is `{"version":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`.

```
CONTROL_BUILD_EXIT=0
CONTROL_BUILD_VERSION=712947a1bd44a735f66ee8f51610f4748d76cd30
```

Each server was started from the repository root as

```
env -i PATH=<node 24.21.0 bin>:/usr/bin:/bin:/usr/sbin:/sbin HOME=<home> \
  HOST=127.0.0.1 PORT=3186 ORIGIN=http://127.0.0.1:3186 \
  PUBLIC_SUPABASE_URL=<control's URL> PUBLIC_SUPABASE_ANON_KEY=<key, from a shell variable> \
  PUBLIC_PROJECT_ID=<control's id> \
  node ./apps/frontend/build/index.js > tmp/186-05/server-<n>.log 2>&1 &
```

so no `.env` and no other shell variable reached it. Port 3186 was free (`lsof -nP -iTCP:3186 -sTCP:LISTEN` empty) before each start and after each stop. Each server was stopped with `kill -TERM <pid>` after the smoke's status had been read, and `wait <pid>` returned 0 both times; each log holds `Listening on http://127.0.0.1:3186` and the one `The server is exiting after its stop.` line (reason `SIGTERM`, `inFlightAtSignal: 0`). The smoke ran in plan 186-02's form with `SMOKE_BASE_URL=http://127.0.0.1:3186` and `SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30`.

## Control 2: a wrong project id

The hosted anon key was read from the `PUBLIC_SUPABASE_ANON_KEY` field of the env block `https://staging.openvaa.org/` serves, into a shell variable (208 characters; the value is withheld). Server: `PUBLIC_SUPABASE_URL=https://cofbsatfrdysyphajsky.supabase.co`, that key, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000ff`; up at 2026-11-14T23:18:47Z.

Before the run: `/api/health` answered 200 with `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`. `/` answered 200 and carried `data-project-id="00000000-0000-0000-0000-0000000000ff"` and `"PUBLIC_SUPABASE_URL":"https://cofbsatfrdysyphajsky.supabase.co"` in its env block, so research assumption A3 holds: a project id with no rows still serves its identity. Run window 2026-11-14T23:18:49Z to 23:18:50Z.

```
CONTROL_PROJECT_ID_RUN_DIR=tests/e2e-runs/186-05-project-id-20261114T231849Z
CONTROL_PROJECT_ID_EXIT=1
```

Quoted from `smoke.log`:

```
DEPLOYED SMOKE GATE http://127.0.0.1:3186
PASS service-role-key-absent
PASS sha
PASS ref
FAIL project-id: observed 00000000-0000-0000-0000-0000000000ff, expected 00000000-0000-0000-0000-000000000001
Error: DEPLOYED SMOKE GATE FAILED — 1 of 4 checks failed
  FAIL project-id: observed 00000000-0000-0000-0000-0000000000ff, expected 00000000-0000-0000-0000-000000000001
See tests/README.md § Deployed smoke run.
```

## Control 3: a target that is not the dedicated project

The local anon key was read from `ANON_KEY=` of `supabase status -o env`, run in `apps/supabase` with `../../node_modules/.bin/supabase`, into a shell variable (153 characters; the value is withheld); the command's output was held in a variable and never written to a file. Server: `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, that key, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`; up at 2026-11-14T23:18:59Z.

Before the run: `/api/health` answered 200 with `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`. `/` answered 200 and carried `data-project-id="00000000-0000-0000-0000-000000000001"` and `"PUBLIC_SUPABASE_URL":"http://127.0.0.1:54321"`. Run window 2026-11-14T23:19:00Z to 23:19:01Z.

```
CONTROL_REF_RUN_DIR=tests/e2e-runs/186-05-ref-20261114T231900Z
CONTROL_REF_EXIT=1
```

Quoted from `smoke.log`:

```
DEPLOYED SMOKE GATE http://127.0.0.1:3186
PASS service-role-key-absent
PASS sha
FAIL ref: observed http://127.0.0.1:54321 (not https://<ref>.supabase.co), expected cofbsatfrdysyphajsky (https://cofbsatfrdysyphajsky.supabase.co)
PASS project-id
Error: DEPLOYED SMOKE GATE FAILED — 1 of 4 checks failed
  FAIL ref: observed http://127.0.0.1:54321 (not https://<ref>.supabase.co), expected cofbsatfrdysyphajsky (https://cofbsatfrdysyphajsky.supabase.co)
See tests/README.md § Deployed smoke run.
```

The project id agrees; only the ref check refuses the target.

## After the controls

```
CONTROL_PORT_FREE=yes
CONTROL_TREE_CLEAN=yes
```

- `CONTROL_PORT_FREE=yes`: `lsof -nP -iTCP:3186 -sTCP:LISTEN` printed nothing (status 1) after the second server stopped.
- `CONTROL_TREE_CLEAN=yes`: `git status --porcelain` listed nothing outside `.planning/` after the build and both controls.
- Key search: `grep -cE 'eyJ[A-Za-z0-9_-]{10,}\.'` is 0 for `tmp/186-05/server-2.log` and for `tmp/186-05/server-3.log`; `grep -rlE` of the same pattern finds no file under `tmp/186-05/` and none under the three `tests/e2e-runs/186-05-*` run directories; this file holds none.
- No file under `apps/`, `packages/`, `tests/` (outside the ignored run directories) or the config was changed; every control failed on its own check alone, so nothing had to be stopped.
