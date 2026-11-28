# 185-21 evidence: the repository gates on the phase's final tree

Recorded 2026-11-14 (UTC) by the plan executor, which ran every gate and stack command itself from this checkout. Logs are in `tmp/185-gates/185-21/`.

- **Commit:** `e7dc9b72123d53e6ba587286b04a3bbe420a3574` (HEAD before and after every gate; `git status --short` was empty before and after)
- **Date:** 2026-11-14 (UTC), gates from 18:24:45Z to 18:26:44Z
- **Node:** v24.21.0 (`$HOME/.nvm/versions/node/v24.21.0/bin` first on `PATH`)
- **Turbo cache:** `TURBO_CACHE_DIR` set to a new private `mktemp -d` directory for this attempt; every `test:unit` task read `cache bypass, force executing`, and the 11 cached tasks are `build` tasks that the earlier `lint:check` of the same attempt populated
- **Status reading:** each gate's status was written to its own file by the command right after the gate (`<gate>.status`) and read from that file. No status was read through a pipe.

## Final lines

```
lint:check exit=0
format:check exit=0
test:unit exit=0
GUARD_TASK_ENVIRONMENT=passed
GUARD_INLINE_IAM=passed
```

| Gate | Status | Start (UTC) | End (UTC) | Log | Note |
| --- | --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 2026-11-14T18:24:45Z | 18:25:35Z | `tmp/185-gates/185-21/lint.log` | Reached the last link. `No-inline-IAM-policies guard — 57 .tf file(s) read under 'infra'; 0 finding(s).` The hosted-settings parity guard: `every classified key holds`, with 366 tracked files scanned for a second writer of hosted settings |
| `yarn format:check` | `format:check exit=0` | 2026-11-14T18:25:35Z | 18:25:53Z | `tmp/185-gates/185-21/format.log` | `All matched files use Prettier code style!` (root and docs) |
| `yarn test:unit` | `test:unit exit=0` | 2026-11-14T18:25:53Z | 18:26:44Z | `tmp/185-gates/185-21/unit.log` | turbo `Tasks: 25 successful, 25 total`; then `test:unit:tests` and `test:unit:infra` |

## The two guards

- **`GUARD_TASK_ENVIRONMENT=passed`** (INFRA-05): the unit output holds `✓ src/lib/server/startup/taskEnvironment.test.ts (25 tests)` under `@openvaa/frontend:test:unit`. That spec checks that the list holds `REQUIRED_ENV`, that every name is in `.env.example`, the runbook and both AWS roots, and that no `SERVICE_ROLE` name is in it.
- **`GUARD_INLINE_IAM=passed`** (INFRA-11): the lint output holds the guard's summary line, `No-inline-IAM-policies guard — 57 .tf file(s) read under 'infra'; 0 finding(s).`, and `lint:check` exited 0 after it.

## `test:unit`, link by link

- `@openvaa/frontend`: `Test Files 261 passed | 1 skipped (262)`, `Tests 5980 passed | 31 skipped (6011)`
- `@openvaa/dev-seed`: `Test Files 80 passed (80)`, `Tests 1266 passed (1266)`
- `@openvaa/supabase` 678, `@openvaa/data` 318, `@openvaa/app-shared` 149, `@openvaa/llm` 49, `@openvaa/matching` 43, `@openvaa/argument-condensation` 31, `@openvaa/filters` 22, `@openvaa/question-info` 22, `@openvaa/core` 8: all passed
- `test:unit:tests`: `Test Files 10 passed (10)`, `Tests 189 passed (189)`
- `test:unit:infra`: `Test Files 3 passed (3)`, `Tests 102 passed (102)`

The counts equal those of 185-10's run of record. Outside `.planning/`, the tree changed since that run (`633d09151`) in seven files: four READMEs, `infra/envs/staging/aws/terraform.tfvars`, `infra/modules/frontend-service/main.tf` and the module's `tftest.hcl` file. The task-environment guard reads the AWS runbook among them, and it passed on this tree.

## The stack before the gates

The precondition held: `yarn db:status` exited 0 (`tmp/185-gates/185-21/db-status.log`), after the restart below. Before it, the shared local stack held the -gsd checkout's schema, and `supabase_edge_runtime_openvaa-local` mounted `voting-advice-application-gsd/apps/supabase/supabase/functions`. The -gsd session had said the stack was free. So, under the standing stack authorisation, three commands were run from this checkout: `yarn db:stop` (exit 0), `yarn db:start` (exit 0) and `yarn db:reset` (exit 0). Their logs are `db-stop.log`, `db-start.log` and `db-reset.log`. Afterwards `supabase_migrations.schema_migrations` held only `00001`, which is this branch's one migration. The edge runtime was running and mounted this checkout's `apps/supabase/supabase/functions`.

## D-25

No pending todo was folded into this phase (D-25). No commit of the phase, from its first (`d3da5d1b2`, 2026-11-12) to this tree, touches `.planning/todos/` (`git log d3da5d1b2^..HEAD -- .planning/todos` is empty).

**Outcome:** all three repository gates exit 0 at `e7dc9b72123d53e6ba587286b04a3bbe420a3574`, and both guards pass.
