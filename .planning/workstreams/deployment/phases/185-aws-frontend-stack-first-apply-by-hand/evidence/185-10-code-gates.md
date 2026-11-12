# 185-10 evidence: the gates on the phase's code before the first apply

Recorded 2026-11-12 (UTC) by the plan executor, which ran every gate and stack command itself from this checkout. Logs are in `tmp/185-gates/` (run 1) and `tmp/185-gates/run2/` (run 2, the run of record).

- **Commit:** `633d091518b01f4f29415175e02ed75dbe429e6f` (HEAD before and after every gate of run 2; `git status --short` was empty before and after)
- **Date:** 2026-11-12 (UTC)
- **Node:** v24.21.0 (`$HOME/.nvm/versions/node/v24.21.0/bin` first on `PATH`)
- **Turbo cache:** `TURBO_CACHE_DIR` set to a new private `mktemp -d` directory for each run
- **Status reading:** each gate's status was written to its own file by the command right after the gate (`<gate>.status`) and read from that file. No status was read through a pipe.

## Final lines (run 2, at `633d091518b01f4f29415175e02ed75dbe429e6f`)

```
lint:check exit=0
format:check exit=0
test:unit exit=0
```

| Gate | Status | Run | Start (UTC) | Log | Note |
| --- | --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 1 | 2026-11-12T18:39:29Z | `tmp/185-gates/lint.log` | at `a6b6e4c94c11f4d9d2bbe8559d5a001576de2103`, superseded by run 2 |
| `yarn format:check` | `format:check exit=0` | 1 | 2026-11-12T18:40:23Z | `tmp/185-gates/format.log` | at `a6b6e4c94…`, superseded by run 2 |
| `yarn test:unit` | `test:unit exit=1` (red, superseded) | 1 | 2026-11-12T18:40:42Z, ended 18:41:11Z | `tmp/185-gates/unit.log` | turbo `Tasks: 22 successful, 24 total`, `Failed: @openvaa/dev-seed#test:unit`; see below |
| `yarn lint:check` | `lint:check exit=0` | 2 | 2026-11-12T18:42:44Z | `tmp/185-gates/run2/lint.log` | Reached the last link. `No-inline-IAM-policies guard — 57 .tf file(s) read under 'infra'; 0 finding(s).` The hosted-settings parity guard: `every classified key holds`, with 366 tracked files scanned for a second writer of hosted settings |
| `yarn format:check` | `format:check exit=0` | 2 | 2026-11-12T18:43:35Z | `tmp/185-gates/run2/format.log` | `All matched files use Prettier code style!` (root and docs) |
| `yarn test:unit` | `test:unit exit=0` | 2 | 2026-11-12T18:43:54Z, ended 18:45:39Z | `tmp/185-gates/run2/unit.log` | turbo `Tasks: 25 successful, 25 total`, every `test:unit` task `cache bypass, force executing`; then `test:unit:tests` and `test:unit:infra` |

## The stack before the gates

The precondition held: `yarn db:status` exited 0. The shared local stack still held another checkout's schema, though. `supabase_migrations.schema_migrations` had `00001` to `00010`, and the edge runtime mounted `voting-advice-application-gsd/apps/supabase/supabase/functions`. This branch has one migration, `00001_initial_schema.sql`. No `e2e-run.sh`, `playwright test` or `functions serve` process from that checkout was running. The one vitest process found belonged to an unrelated project. So, under the standing stack authorisation, `yarn db:stop` (exit 0, `tmp/185-gates/db-stop.log`) and then `yarn db:reset` (exit 0, `tmp/185-gates/db-reset.log`) were run from this checkout. Afterwards the database held only `00001`, and `supabase_edge_runtime_openvaa-local` was Up, mounting this checkout's `apps/supabase/supabase/functions`.

## Run 1's red `test:unit` and its cause

The failing link was `@openvaa/dev-seed#test:unit`: `Test Files 1 failed | 79 passed (80)`, `Tests 1 failed | 1265 passed (1266)`. The failing case was `tests/infraValidateJobGate.test.ts > the infra-validate job checks what it claims to check > runs the validation and type-check steps even after an earlier step failed`. First error line: `AssertionError: expected [ 'if: ${{ !cancelled() }}', …(2) ] to have a length of 2 but got 3`, at `tests/infraValidateJobGate.test.ts:214:70`.

Cause: plan 185-07 (`4b27954cc`) added the step "Test every Terraform module that has tests" to `infra-validate`, with `if: ${{ !cancelled() }}`, as its plan required. The spec that guards the job still counted two such conditions. The workflow was right and the spec was stale. That is a defect of this phase, and its fix is in the spec, not in the job.

Fix, `633d09151` (`fix(185-10): require the !cancelled() condition on each check step of infra-validate`): the spec now reads the job's steps by name. It pins the three steps after the formatting check (`Validate every Terraform root`, `Test every Terraform module that has tests`, `Check the settings types of the Supabase module`) and requires the condition on each of them, with the total count tied to those steps. The gate is stronger than before: a new check step without the condition, or a module-test step that disappears, now fails by name. Mutation check: with the condition deleted from the module-test step of `main.yaml`, the spec failed with `AssertionError: Test every Terraform module that has tests: expected …`, and `main.yaml` was restored with `git checkout -- .github/workflows/main.yaml` (`git diff --stat` empty afterwards). The spec on its own: 32 of 32 passed.

Run 2 then repeated all three gates on the fix commit.

## Run 2's `test:unit`, link by link

- turbo: `Tasks: 25 successful, 25 total`
- `@openvaa/dev-seed#test:unit`, the link that failed in run 1: `Test Files 80 passed (80)`, `Tests 1266 passed (1266)`; it holds `✓ tests/infraValidateJobGate.test.ts (32 tests)`
- `@openvaa/frontend#test:unit`: `Test Files 261 passed | 1 skipped (262)`, `Tests 5980 passed | 31 skipped (6011)`. It holds the task-environment guard, `✓ src/lib/server/startup/taskEnvironment.test.ts (25 tests)`, and `✓ src/lib/server/shutdown/shutdownLog.test.ts (7 tests)`
- `@openvaa/supabase` 678, `@openvaa/data` 318, `@openvaa/app-shared` 149, `@openvaa/llm` 49, `@openvaa/matching` 43, `@openvaa/argument-condensation` 31, `@openvaa/filters` 22, `@openvaa/question-info` 22, `@openvaa/core` 8: all passed
- `test:unit:tests`: `Test Files 10 passed (10)`, `Tests 189 passed (189)`
- `test:unit:infra`, the infra suite: `Test Files 3 passed (3)`, `Tests 102 passed (102)`

The root vitest runs print only their summary in a non-interactive shell. So the infra suite's file names were read from one more run on the same commit, `yarn test:unit:infra --reporter=verbose` (exit 0, `tmp/185-gates/run2/infra-verbose.log`): `scripts/build-push-image.test.ts` 3 tests, `scripts/request-loop.test.ts` 3 tests, `scripts/probe-hosted.test.ts` 96 tests, all passed, 102 in total, matching the gate's count.

**Outcome of the repository gates:** all three exit 0 at `633d091518b01f4f29415175e02ed75dbe429e6f`.
