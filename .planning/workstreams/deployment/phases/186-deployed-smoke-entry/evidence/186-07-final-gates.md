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
