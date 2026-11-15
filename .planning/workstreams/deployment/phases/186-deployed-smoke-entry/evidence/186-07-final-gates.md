# 186-07 evidence: the repository gates and the unchanged-local-gate proofs on the phase's final tree

Recorded 2026-11-14 (UTC) by the plan executor, which ran every gate and stack command itself from this checkout. Logs are in `tmp/186-gates/186-07/`.

- **Commit:** `0ac8151e4a5fc2a003db02bbd776e22f8bcf5bce` (HEAD before and after every gate; `git status --short` listed only the orchestrator's two uncommitted `.planning/workstreams/deployment/config.json` and `state.json` edits, before and after, and nothing outside `.planning/`)
- **Date:** 2026-11-14 (UTC), gates from 23:28:35Z to 23:30:25Z
- **Node:** v24.21.0 (`$HOME/.nvm/versions/node/v24.21.0/bin` first on `PATH`)
- **Turbo cache:** `TURBO_CACHE_DIR` set to a new private `mktemp -d` directory under `tmp/186-gates/` for this attempt (`tmp/186-gates/turbo-cache.17q8AU`); the 11 cached tasks of `test:unit` are `build` tasks that the earlier `lint:check` of the same attempt populated
- **Status reading:** each gate's status was written to its own file by the command right after the gate (`<gate>.status`) and read from that file. No status was read through a pipe.

## Final lines

```
lint:check exit=0
format:check exit=0
test:unit exit=0
GUARD_DEPLOYED_TARGET=passed
GUARD_DEPLOYED_SMOKE=passed
SC4_LOCAL_GATE_DIFF=empty
LOCAL_LIST=Total: 548 tests in 127 files
DEPLOYED_TREE_DIFF=empty
```

| Gate | Status | Start (UTC) | End (UTC) | Log | Note |
| --- | --- | --- | --- | --- | --- |
| `yarn db:status` (precondition) | exit 0 | 2026-11-14T23:28Z | | `db-status.log` | The stack held this checkout's schema (`schema_migrations` = `00001` only) and `supabase_edge_runtime_openvaa-local` was Up, mounting this checkout's `apps/supabase/supabase/functions`; no restart was needed |
| `yarn lint:check` | `lint:check exit=0` | 2026-11-14T23:28:35Z | 23:29:21Z | `lint.log` | Reached the last link. `No-inline-IAM-policies guard — 57 .tf file(s) read under 'infra'; 0 finding(s).` The hosted-settings parity guard: `every classified key holds` |
| `yarn format:check` | `format:check exit=0` | 2026-11-14T23:29:21Z | 23:29:37Z | `format.log` | `All matched files use Prettier code style!` (root and docs) |
| `yarn test:unit` | `test:unit exit=0` | 2026-11-14T23:29:37Z | 23:30:25Z | `unit.log` | turbo `Tasks: 25 successful, 25 total`; then `test:unit:tests` (`Test Files 12 passed (12)`, `Tests 276 passed (276)`) and `test:unit:infra` (`Test Files 3 passed (3)`, `Tests 102 passed (102)`) |

## The two guards

`yarn test:unit:tests` prints only the totals under the default reporter when its output is a file, so `unit.log` holds `Test Files 12 passed (12)` without file names. To name the two files, the same config was run once more, read-only, with the verbose reporter: `node_modules/.bin/vitest run --config tests/vitest.config.ts --reporter=verbose` (exit 0, `unit-tests-files.status`; log `unit-tests-files.log`), again `Test Files 12 passed (12)`, `Tests 276 passed (276)`, no failure.

- **`GUARD_DEPLOYED_TARGET=passed`**: 76 test lines, every one `✓ tests/utils/deployedTarget.test.ts > …` (the ref, project-id and SHA checks, the service-role refusal and the all-checks-printed gate).
- **`GUARD_DEPLOYED_SMOKE=passed`**: 11 test lines, every one `✓ tests/utils/deployedSmokeGuards.test.ts > …` (no allow-remote token, the config shape, the value-import closure).

## The proofs

- **`SC4_LOCAL_GATE_DIFF=empty`**: `git diff --quiet a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exited 0. `a7a4222a8` is the phase's first commit; the local gate suite and its preflight are byte-identical across the phase (E-04, success criterion 4).
- **`LOCAL_LIST=Total: 548 tests in 127 files`**: the last line of `node_modules/.bin/playwright test --list -c tests/playwright.config.ts ./tests --grep-invert @probe`, which exited 0 (`list.log`).
- **`DEPLOYED_TREE_DIFF=empty`**: `git diff --quiet 712947a1bd44a735f66ee8f51610f4748d76cd30 -- apps packages` exited 0, so the deployed tree is still the checkout's application (E-04).

## F-02

No pending todo was folded into this phase (F-02). No commit of the phase, from its first (`a7a4222a8`, 2026-11-14) to this tree, touches `.planning/todos/` (`git log a7a4222a8^..HEAD -- .planning/todos` is empty).

**Outcome:** all three repository gates exit 0 at `0ac8151e4a5fc2a003db02bbd776e22f8bcf5bce`, both guards pass, and the local gate suite, its list and the deployed application tree are unchanged.

## Re-run after the code-review fixes (2026-11-15)

Recorded 2026-11-15 (UTC) by an executor spawned by the orchestrator as an ad-hoc follow-up to plan 186-07, after the code-review fixes (`186-REVIEW-FIX.md`) and the follow-up `a2fa17061`, which makes the deployed setup's first line withhold user info. That executor ran every gate itself from this checkout. Logs are in `tmp/186-gates/rerun/`. The lines above the heading record the run at `0ac8151e4`; the lines below record the re-run at the new HEAD. Each gate's status was written to its own `<gate>.status` file by the command right after the gate and read from that file, never through a pipe.

- **Commit:** `a2fa170619315dfa6078c7f9f32cb05fb4604efc` when the gates started. Four phase-187 docs commits (`0d6864d8b`..`ee85b83a3`) landed while they ran, touching `.planning/` only. `git diff --quiet a2fa17061 ee85b83a3 -- . ':!.planning'` exited 0, so `ee85b83a38488f052edc7a00c7a80facd6602871`, the tree of the closing E2E re-run, has the same code.
- **Date:** 2026-11-15 (UTC), gates from 00:26:04Z to 00:28:37Z
- **Node:** v24.21.0
- **Turbo cache:** a new private `mktemp -d` directory under `tmp/186-gates/` (`tmp/186-gates/rerun/turbo-cache-dir.txt` names it)
- **Precondition:** `yarn db:status` exit 0, with `supabase_edge_runtime_openvaa-local` Up and mounting this checkout's `apps/supabase/supabase/functions`

### The follow-up fix and its gates

`a2fa17061 fix(186): withhold user info from the deployed setup's first line`: `gateTargetLine` in `tests/tests/utils/deployedTarget.ts` prints a base URL without user info as given, prints one with user info without it and with `(user info withheld)`, and does not print a value that is not an absolute URL. `tests/deployed-global-setup.ts` prints only through it. Seven new unit cases, plus a guard in `deployedSmokeGuards.test.ts` that refuses a raw `${baseURL}` in the setup file. `tests/README.md` § Reading the gate says so.

| Gate | Status |
| --- | --- |
| `node_modules/.bin/vitest run --config tests/vitest.config.ts deployed` | exit 0, 2 files, 134 tests passed (127 before) |
| `yarn typecheck:tests` | exit 0 |
| `node_modules/.bin/eslint` on the four changed `.ts` files | exit 0 |
| `node scripts/assert-comment-hygiene.mjs` | exit 0, 0 violations |
| `prettier --check` on the five changed files | exit 0 |
| `yarn test:e2e:deployed --list --reporter=list` | exit 0, `Total: 2 tests in 2 files` |

### Final lines of the re-run

```
lint:check exit=0
format:check exit=0
test:unit exit=0
GUARD_DEPLOYED_TARGET=passed
GUARD_DEPLOYED_SMOKE=passed
SC4_LOCAL_GATE_DIFF=empty
LOCAL_LIST=Total: 548 tests in 127 files
DEPLOYED_TREE_DIFF=empty
```

| Gate | Status | Start (UTC) | End (UTC) | Log | Note |
| --- | --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 00:26:04Z | 00:26:50Z | `lint.log` | `No-inline-IAM-policies guard — 57 .tf file(s) read under 'infra'; 0 finding(s).`; the hosted-settings parity guard: `every classified key holds` |
| `yarn format:check` | `format:check exit=0` | 00:26:50Z | 00:27:07Z | `format.log` | `All matched files use Prettier code style!` |
| `yarn test:unit` | `test:unit exit=0` | 00:27:07Z | 00:28:37Z | `unit.log` | turbo `Tasks: 25 successful, 25 total`; `test:unit:tests` `Test Files 12 passed (12)`, `Tests 323 passed (323)` (276 before the review fixes); `test:unit:infra` `Test Files 3 passed (3)`, `Tests 102 passed (102)` |

- **`GUARD_DEPLOYED_TARGET=passed`**, **`GUARD_DEPLOYED_SMOKE=passed`**: `node_modules/.bin/vitest run --config tests/vitest.config.ts --reporter=verbose` exited 0 (`unit-tests-files.status`), `Tests 323 passed (323)`; 118 lines `✓ tests/utils/deployedTarget.test.ts > …` and 16 lines `✓ tests/utils/deployedSmokeGuards.test.ts > …`, and no failed line.
- **`SC4_LOCAL_GATE_DIFF=empty`**: `git diff --quiet a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts` exited 0.
- **`LOCAL_LIST=Total: 548 tests in 127 files`**: the last line of `node_modules/.bin/playwright test --list -c tests/playwright.config.ts ./tests --grep-invert @probe`, exit 0 (`list.log`).
- **`DEPLOYED_TREE_DIFF=empty`**: `git diff --quiet 712947a1bd44a735f66ee8f51610f4748d76cd30 -- apps packages` exited 0.
- **F-02:** no pending todo was folded into this phase. `git log a7a4222a8^..HEAD -- .planning/todos` is still empty.

**Outcome:** all three repository gates exit 0 on the tree with the code-review fixes, both guards pass, and the local gate suite, its list and the deployed application tree are unchanged. The closing E2E re-run is in `186-07-closing-e2e.md` § Re-run after the code-review fixes, `E2E_TREE_SHA=ee85b83a38488f052edc7a00c7a80facd6602871`.

