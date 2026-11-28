---
phase: "181"
slug: "deployability-and-migration-model"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-11"
audited: "2026-11-21"
---

# Phase 181 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (catalog version) for unit tests and gate specs; Playwright for E2E; Node guard scripts with their own self-tests; shell and psql check scripts whose exit status is the verdict |
| **Config file** | `apps/frontend/vitest.config.ts`; `packages/dev-seed/vitest.config.ts` (gate specs under `packages/dev-seed/tests/`); `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit <file>`, `yarn workspace @openvaa/dev-seed test:unit <file>`, and `node scripts/assert-schema-migration-parity.mjs` when `apps/supabase` or the guard changed |
| **Full suite command** | `yarn build`, then `yarn test:unit`, then `yarn lint:check`, then `yarn format:check`, one at a time in the background, each status read from the command itself |
| **Phase gate** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>` with a database reset, on a stack started from this worktree, behind a `blocking-human` checkpoint (plans 181-16 and 181-19). Green means wrapper status 0, zero failed, zero did-not-run. Status 8 is a void run and is made again. |
| **Estimated runtime** | quick: under 60 seconds; full suite: several minutes, backgrounded and polled; database and Docker observations: minutes each, on isolated instances |

Every command runs with `PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`. A status is never read through a pipe.

---

## Sampling Rate

- **After every task commit:** the quick run command for the workspace the task touched, as written in the task's `<verify>`
- **After every plan wave:** nothing beyond the plans' own commands until wave 7; plan 181-15 (wave 7) and plan 181-18 (wave 10) run the full suite command
- **Before `/gsd-verify-work`:** the full suite and the closing E2E gate of plan 181-19 must be green
- **Max feedback latency:** 60 seconds for unit-level tasks; observation tasks are bounded by their own background polling

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 181-01-01 | 01 | 1 | SUPA-10 (setup) | T-181-01 | The install cannot rewrite the lockfile; it runs on a clean tree at a named commit | check | attempt guard first (the record is the copy of the attempt file the pointer `181-01-toolchain.current` names, each key once); `yarn install --immutable`; `TREE_CLEAN_BEFORE_INSTALL=yes`, `TREE_CLEAN_AFTER_INSTALL=yes`, `HEAD_AFTER_INSTALL` equal to `HEAD` in `evidence/181-01-toolchain.md`; `git diff --quiet HEAD -- yarn.lock .yarnrc.yml package.json` | ✅ | ✅ green (recorded, `evidence/181-01-toolchain.md`) |
| 181-01-02 | 01 | 1 | SUPA-10 (setup) | T-181-02 | The baseline is taken on a clean tree at a named commit, and its lines come from one attempt | gates | attempt guard first (pointer `181-01-baseline.current`); build, test:unit, lint:check, format:check, parity guard; statuses, `TREE_CLEAN_BEFORE_GATES=yes`, `TREE_CLEAN_AFTER_GATES=yes` and `HEAD_AFTER_GATES` equal to `HEAD` in `evidence/181-01-baseline.md` | ✅ | ✅ recorded (baseline; `TEST_UNIT_EXIT=1` is the stack-less dev-seed integration link, measured, not a gate of this task) `evidence/181-01-baseline.md` |
| 181-02-01 | 02 | 2 | SUPA-04, SUPA-06 (toward) | T-181-03 | The harness refuses the shared project id and any port in use | script | `bash apps/supabase/scripts/isolated-instance.sh start --name 'Bad Name' …` exits 4 | ✅ | ✅ green (recorded, `evidence/181-02-harness-spike.md`) |
| 181-02-02 | 02 | 2 | SUPA-04 (toward) | T-181-03, T-181-04 | The shared stack's containers are unchanged; no key in the record | spike | verdict lines in `evidence/181-02-harness-spike.md` | ✅ | ✅ green (recorded, `evidence/181-02-harness-spike.md`) |
| 181-03-01 | 03 | 2 | INFRA-05 (toward) | T-181-07 | The check returns names, never values | unit | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/requiredEnv.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-03-02 | 03 | 2 | INFRA-05 (toward) | T-181-06 | A production start without `ORIGIN` throws | unit + lint | `routeConsistency.test.ts`; `yarn workspace @openvaa/frontend exec eslint src/hooks.server.ts src/lib/server/startup` | ✅ | ✅ green (run 2026-11-21) |
| 181-03-03 | 03 | 2 | INFRA-06 (toward) | T-181-08, T-181-09 | 404 unless enabled; allow-listed headers; no log call | unit | `yarn workspace @openvaa/frontend test:unit src/routes/api/diagnostics/server.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-04-01 | 04 | 2 | INFRA-04 (toward) | T-181-10 | Health reads neither the client nor the address | unit | `yarn workspace @openvaa/frontend test:unit src/routes/api/health/server.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-04-02 | 04 | 2 | PIPE-07, INFRA-09 (toward) | T-181-12 | Exec-form `CMD`; empty `BUILD_SHA` becomes undefined | unit + gate specs | `svelte.config.test.ts`; `ciDockerImageBuildGate.test.ts`; `turboBuildInputsGate.test.ts` | ✅ (new cases) | ✅ green (run 2026-11-21) |
| 181-05-01 | 05 | 2 | INFRA-05, SUPA-05 (toward) | T-181-15 | The spec fails on a live proxy line | spec, seen red | `SPEC_EXIT_BEFORE` non-zero in `evidence/181-05-templates-red.md` | ✅ | ✅ green (recorded, `evidence/181-05-templates-red.md`) (`SPEC_EXIT_BEFORE=1`) |
| 181-05-02 | 05 | 2 | INFRA-05, INFRA-06 (toward) | T-181-13, T-181-15 | Defaults are the non-spoofable depth; lines stay commented | spec + guard | `localSupabaseUrl.test.ts`; `node scripts/assert-env-pair-registry.mjs` | ✅ | ✅ green (run 2026-11-21) |
| 181-05-03 | 05 | 2 | SUPA-05 (toward) | T-181-14 | The JWT setting is declared | spec | `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-06-01 | 06 | 2 | SUPA-10 | T-181-16, T-181-18 | Every rule of the checker is in `FROZEN_RULES` and has a fixture that yields exactly one finding of its kind; the fixture set is derived from the rule list, not counted | spec over fixtures | `yarn workspace @openvaa/dev-seed test:unit tests/schemaMigrationFreezeGate.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-06-02 | 06 | 2 | SUPA-10 | T-181-16 | The verdict is withheld when a fixture stops failing or a rule loses its fixture; the controls run against the committed guard | guard self-test, seen red | `node scripts/assert-schema-migration-parity.mjs --self-test`; `SELF_TEST_CAN_FAIL_EXIT=1`, `RULE_WITHOUT_FIXTURE_EXIT=1`, `SCRATCH_HAS_CODE_UNDER_TEST=yes` in `evidence/181-06-freeze-checker-red.md`; `git grep` for `FROZEN_RULES` and the self-test flag at `SCRATCH_FROM_COMMIT` | ✅ | ✅ green (run 2026-11-21); red controls recorded in `evidence/181-06-freeze-checker-red.md` |
| 181-07-01 | 07 | 2 | SUPA-10 | T-181-19 | The exclusion is exact, reported and fails closed; the controls run against the committed guard | guard, seen red | `node scripts/assert-comment-hygiene.mjs`; three control lines and `SCRATCH_HAS_CODE_UNDER_TEST=yes` in `evidence/181-07-hygiene-exclusion-red.md`; `git grep` for `FROZEN_MIGRATIONS_PREFIX` at `SCRATCH_FROM_COMMIT` | ✅ | ✅ green (run 2026-11-21); red controls in `evidence/181-07-hygiene-exclusion-red.md` |
| 181-07-02 | 07 | 2 | SUPA-10 | T-181-20 | Tests read the current view of the schema | unit | `permittedKeys.test.ts`; `allowedTeardownTables.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-08-01 | 08 | 3 | SUPA-04 (toward) | T-181-21 | `private-assets` is inserted as not public | guards | parity guard; prettier on `schema/`; three `schema/` guards | ✅ | ✅ green (run 2026-11-21) (parity guard) |
| 181-08-02 | 08 | 3 | SUPA-04 (toward) | T-181-22 | Two bucket rows on a database with no storage service | isolated DB observation | `BUCKET_ROWS_DB_ONLY=2` in `evidence/181-08-buckets.md` | ✅ | ✅ green (recorded, `evidence/181-08-buckets.md`) |
| 181-08-03 | 08 | 3 | SUPA-04 (toward) | T-181-23 | No key in the record | isolated DB measurement | `CONFIG_BUCKET_BLOCKS=` and `PGTAP_EXIT=` in the same record | ✅ | ✅ green (recorded, `evidence/181-08-buckets.md`) (`PGTAP_EXIT=0`) |
| 181-09-01 | 09 | 3 | INFRA-05 (toward) | T-181-24, T-181-26 | A start without a required variable exits non-zero for that reason: its error line is the message naming exactly that variable | built-server observation | five `MISSING_*_EXIT` lines non-zero and five `MISSING_*_MESSAGE` lines ending with the exact message, in `evidence/181-09-production-start.md` | ✅ | ✅ green (recorded, `evidence/181-09-production-start.md`) |
| 181-09-02 | 09 | 3 | INFRA-04, PIPE-07 (toward) | T-181-25 | Health makes no upstream request and is 200 with the upstream refusing connections; diagnostics 404 by default | built-server observation | `STUB_REQUESTS_FROM_ROUTE` at least 1, `STUB_REQUESTS_FROM_HEALTH=0`, `UPSTREAM_CONNECT_CURL_EXIT=7`, `STUB_BODIES=minimal-valid` (or `-adapted`), `UPSTREAM_DISCRIMINATOR` one of `status`, `inlined-fetches`, `server-error-lines` with `ROUTE_WITH_STUB` different from `ROUTE_WITH_REFUSED` (the value `none` fails and ends in a blocking checkpoint after the routes `/` and `/contestant/login`), `HEALTH_SUPABASE_UNREACHABLE_HTTP=200`, `DIAGNOSTICS_DEFAULT_HTTP=404` | ✅ | ✅ green (recorded, `evidence/181-09-production-start.md`) |
| 181-10-01 | 10 | 4 | SUPA-10 | T-181-28 | An empty comparison cannot pass | script | `bash apps/supabase/scripts/check-schema-equivalence.sh --no-such-flag` exits 2 | ✅ | ✅ green (run 2026-11-21) (exit 2) |
| 181-10-02 | 10 | 4 | SUPA-10 | T-181-27, T-181-29 | A lost column grant, policy, body, bucket row or role setting is seen | isolated DB, seen red | six `RED_*` lines and `EQUIVALENCE_TREE_EXIT=0` in `evidence/181-10-equivalence.md` | ✅ | ✅ green (recorded, `evidence/181-10-equivalence.md`) |
| 181-11-01 | 11 | 5 | SUPA-06 (toward) | T-181-30, T-181-34 | No secret in the script; the key is a bound parameter | static check | no JWT or URL in `infra/scripts/bootstrap.sql`; `prettier --check infra` | ✅ | ✅ green (run 2026-11-21) (grep 0 hits; prettier exit 0) |
| 181-11-02 | 11 | 5 | SUPA-06 (toward) | T-181-31, T-181-33 | The key is absent from the server log; a rerun keeps admin changes | isolated DB, seen red | `MISSING_VAR_EXIT=3`, `RUN2_EXIT=0`, `KEY_OCCURRENCES_IN_SERVER_LOG=0` | ✅ | ✅ green (recorded, `evidence/181-11-bootstrap-and-seed-check.md`) |
| 181-11-03 | 11 | 5 | SUPA-06 (toward) | T-181-32 | Seed users and the local URL are named | isolated DB, seen red | `SEED_CHECK_SEEDED_EXIT=3`, `SEED_CHECK_URL_ONLY_EXIT=3`, `SEED_CHECK_AFTER_CLEANUP_EXIT=0` | ✅ | ✅ green (recorded, `evidence/181-11-bootstrap-and-seed-check.md`) |
| 181-12-01 | 12 | 6 | SUPA-10 | — | N/A | measurement | `A2=` and `A10=held` in `evidence/181-12-drift.md` | ✅ | ✅ green (recorded, `evidence/181-12-drift.md`) (`A10=held`) |
| 181-12-02 | 12 | 6 | SUPA-10 | T-181-37, T-181-38 | No URL flag; the diff is never piped | script | `bash infra/scripts/check-drift.sh --manifest infra/scripts/no-such-manifest.json` exits 2 | ✅ | ✅ green (run 2026-11-21) (exit 2) |
| 181-12-03 | 12 | 6 | SUPA-10 | T-181-35, T-181-36, T-181-39 | Planted DDL and a history mismatch give status 1 | isolated DB, seen red | `DRIFT_CLEAN_EXIT=0`, `DRIFT_PLANTED_DDL_EXIT=1`, `DRIFT_CANNOT_RUN_EXIT=2` | ✅ | ✅ green (recorded, `evidence/181-12-drift.md`) |
| 181-13-01 | 13 | 4 | INFRA-06 (toward) | T-181-42 | The proxy image is pinned by digest | static check | `docker compose -f infra/local/docker-compose.proxy.yml config --quiet`; digest pattern | ✅ | ✅ green (run 2026-11-21) (compose config exit 0; digest pinned) |
| 181-13-02 | 13 | 4 | INFRA-06 (toward) | T-181-40, T-181-41 | A foreign origin is refused 403; a spoofed address is not attributed | topology check with controls | `TOPOLOGY_CHECK_EXIT=0` and the control lines in `evidence/181-13-proxy-topology.md`; second command: `LOGIN_LEG=run` needs `LOGIN_POST_HTTP=303` and a final URL on the configured origin, `LOGIN_LEG=deferred` needs `HARNESS_FULL_MODE=failed` in the spike record | ✅ | ✅ green (recorded, `evidence/181-13-proxy-topology.md`) (`LOGIN_LEG=run`, `LOGIN_POST_HTTP=303`) |
| 181-14-01 | 14 | 5 | INFRA-09 (toward) | T-181-44 | Process 1 is node; the in-flight request completes | topology check, `--sigterm` leg | `PID1_COMMAND=node…`, `IN_FLIGHT_HTTP=` in `evidence/181-14-sigterm.md` | ✅ | ✅ green (recorded, `evidence/181-14-sigterm.md`) |
| 181-14-02 | 14 | 5 | INFRA-09 (toward) | T-181-45, T-181-46 | The process ends after draining | unit (only if installed) | `SHUTDOWN_HANDLER=` verdict; `shutdown.test.ts` in the installed branch | n/a | ✅ green (recorded `SHUTDOWN_HANDLER=not-needed` in `evidence/181-14-sigterm.md`; no handler installed, so no `shutdown.test.ts`) |
| 181-15-01 | 15 | 7 | SUPA-10 | T-181-47, T-181-48 | Only read-only checks have a key; none is in `lint:check` | spec | `yarn workspace @openvaa/dev-seed test:unit tests/deploymentChecksWiring.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| 181-15-02 | 15 | 7 | SUPA-10 | — | Gates run only on a tree with no uncommitted tracked change, on a named commit; the record holds one run of one attempt | full suite | attempt guard first (the record is the copy of the attempt file the pointer `181-15-local-gates.current` names, each key once); four `*_EXIT=0` lines, `TREE_CLEAN_BEFORE_GATES=yes`, `TREE_CLEAN_AFTER_GATES=yes` and `HEAD_AFTER_GATES` equal to `HEAD` in `evidence/181-15-local-gates.md` | ✅ | ✅ green (recorded, `evidence/181-15-local-gates.md`) |
| 181-16-01 | 16 | 8 | SUPA-10 | T-181-51 | `.env` is checked by name only; the tree is clean and the local gates cover `HEAD`; the task starts a new attempt | readiness | attempt guard first (the record is the first part of the attempt file the pointer `181-16-e2e-gate.current` names); `TREE_CLEAN=yes` and the readiness lines in `evidence/181-16-e2e-gate.md`; second command: the local-gate record is the copy of its own current attempt, and `git diff --quiet` between its `HEAD=` and this record's `HEAD=`, over every path outside `.planning/`, with the four local gates at 0 | ✅ | ✅ green (recorded, `evidence/181-16-e2e-gate.md`) |
| 181-16-02 | 16 | 8 | SUPA-10 | T-181-49 | No stack command before the operator's confirmation; the confirmation answers one question | checkpoint (`blocking-human`) | `CHECKPOINT_PRESENTED attempt=… head=…` then `OPERATOR_CONFIRMED_STACK_FREE=yes attempt=… head=…` with the same two values, in the current attempt's file; the reply must hold the attempt id | n/a | manual (checkpoint; `OPERATOR_CONFIRMED_STACK_FREE=yes` in `evidence/181-16-e2e-gate.md`) |
| 181-16-03 | 16 | 8 | SUPA-10; SUPA-05 (toward) | T-181-50, T-181-52 | A void or partial run is not green; the run is tied to one clean commit and to one attempt; the confirmation is for that attempt and that commit and is used once; a deferred observation is made here | E2E gate | precondition: the answer check of the plan's attempt protocol exits 0; first command: attempt guard (record is the copy of the pointer-named attempt file, each key once), the last confirmation line reads `yes attempt=<this id> head=<E2E_HEAD>` and precedes `TASK3_STARTED=`, then `E2E_WRAPPER_EXIT=0`, `E2E_FAILED=0`, `E2E_DID_NOT_RUN=0`; `E2E_HEAD` = `E2E_RUN_HEAD` = `E2E_HEAD_AFTER` with three tree lines `yes`; second command: attempt guard, then where plan 08 recorded `PGTAP_EXIT=not-run` this record holds `PGTAP_EXIT=0`, and where plan 13 recorded `LOGIN_LEG=deferred` it holds `DEFERRED_LOGIN_CHECK_EXIT=0`, `LOGIN_POST_HTTP=303` and a final URL on the configured origin; third command: both records are copies of their current attempts, `E2E_RUN_DIR` is `tests/e2e-runs/181-16-<this id>`, `git diff --quiet` between the local-gate record's `HEAD=` and `E2E_HEAD` outside `.planning/`, and the run directory's own `head` and `worktree-status.txt` show `E2E_HEAD` and no tracked change | ✅ | ✅ green (recorded, `evidence/181-16-e2e-gate.md`) (341 passed, 0 failed, 0 did not run) |
| 181-17-01 | 17 | 9 | SUPA-10 | T-181-54 | Both branches hold the same schema bytes; readiness is taken on a clean tree, by a new attempt | readiness + isolated DB | attempt guard first (the record is the first part of the attempt file the pointer `181-17-freeze-readiness.current` names, each key once); `READY_TO_FREEZE=`, `TREE_CLEAN=`, `HEAD_AT_READINESS=` and `V216_TIP=` (the v2.16 branch tip the comparison was made for) in `evidence/181-17-freeze-readiness.md`; second command: `READY_TO_FREEZE=yes` must agree with every verdict line, with the tree clean before and after the checks on one `HEAD` and `V216_TIP` a 40-character sha | ✅ | ✅ green (recorded, `evidence/181-17-freeze-readiness.md`) (`READY_TO_FREEZE=yes`) |
| 181-17-02 | 17 | 9 | SUPA-10 | T-181-54 | Nothing is frozen without the operator's selection; the selection answers one question | checkpoint (decision, `blocking-human`) | `CHECKPOINT_PRESENTED attempt=… head=…` then `OPERATOR_DECISION=freeze attempt=… head=…` (or `freeze-without-commit`, `not-yet`) with the same two values, in the current attempt's file; the reply must hold the attempt id; the last decision line is in force | n/a | manual (checkpoint; `OPERATOR_DECISION=freeze` in `evidence/181-17-freeze-readiness.md`) |
| 181-17-03 | 17 | 9 | SUPA-10 | T-181-53, T-181-54, T-181-55 | The manifest's hash equals the blob at the named commit; a missing manifest is a finding; the freeze was made on the decision in force for this attempt and for the freeze commit's parent | guard + spec | precondition: the answer check of the plan's attempt protocol exits 0 (last decision `freeze` for the current attempt and the current `HEAD`, not used before, `READY_TO_FREEZE=yes`, no change outside `.planning/` since readiness); verify: the readiness record is the copy of the pointer-named attempt file and `evidence/181-17-freeze.md` is that file's part from `TASK3_STARTED=`; `git rev-parse` of the freeze commit's parent equals `FREEZE_PARENT`; the last `OPERATOR_DECISION` line is `freeze attempt=<this id> head=<FREEZE_PARENT>` and precedes `TASK3_STARTED=`; `V216_TIP_AT_FREEZE=` is a sha and equals `V216_TIP`, or `V216_SCHEMA_AT_FREEZE=identical-after-recheck` is recorded; `node scripts/assert-schema-migration-parity.mjs`; `schemaMigrationFreezeGate.test.ts`; `TREE_CLEAN_AT_FREEZE=yes` and the hash lines | ✅ | ✅ green (run 2026-11-21) (parity guard + gate spec); freeze record `evidence/181-17-freeze.md` |
| 181-18-01 | 18 | 10 | SUPA-10 | T-181-57, T-181-58 | `lint:check` fails on the edited real baseline, in a scratch checkout only | gate, seen red and green | attempt guard first (pointer `181-18-frozen-model-observations.current`); `LINT_CHECK_EDITED_BASELINE_EXIT` non-zero, `LINT_CHECK_APPENDED_MIGRATION_EXIT=0`, drift 0 and 1; `TREE_CLEAN_BEFORE=yes`, `TREE_CLEAN_AFTER=yes`, and `SCRATCH_HEAD` and `HEAD_AFTER` equal to `OBSERVED_HEAD` | ✅ | ✅ green (recorded, `evidence/181-18-frozen-model-observations.md`) |
| 181-18-02 | 18 | 10 | SUPA-10 | T-181-59 | No document teaches the old model | static check | tracked search; `node scripts/assert-grant-permission-enum.mjs`; prettier on the three documents | ✅ | ✅ green (run 2026-11-21) (grant-enum guard exit 0) |
| 181-18-03 | 18 | 10 | SUPA-10 | — | Gates run only on a tree with no uncommitted tracked change, on a named commit; the record holds one run of one attempt | full suite | attempt guard first (the record is the copy of the attempt file the pointer `181-18-local-gates.current` names, each key once); four `*_EXIT=0` lines, `TREE_CLEAN_BEFORE_GATES=yes`, `TREE_CLEAN_AFTER_GATES=yes` and `HEAD_AFTER_GATES` equal to `HEAD` in `evidence/181-18-local-gates.md` | ✅ | ✅ green (recorded, `evidence/181-18-local-gates.md`) |
| 181-19-01 | 19 | 11 | SUPA-10 | T-181-61 | The gate is tied to the frozen commit and a clean tree; outstanding deferred observations are named; the task starts a new attempt | readiness | attempt guard first (the record is the first part of the attempt file the pointer `181-19-closing-e2e-gate.current` names); `TREE_CLEAN=yes`, `DEFERRED_PGTAP_OUTSTANDING=`, `DEFERRED_LOGIN_OUTSTANDING=` in `evidence/181-19-closing-e2e-gate.md`; second command: the local-gate record is the copy of its own current attempt, and `git diff --quiet` between its `HEAD=` and this record's `HEAD=`, over every path outside `.planning/`, with the four local gates at 0 | ✅ | ✅ green (recorded, `evidence/181-19-closing-e2e-gate.md`) |
| 181-19-02 | 19 | 11 | SUPA-10 | T-181-60 | No stack command before the operator's confirmation; the confirmation answers one question, and plan 16's does not answer this one | checkpoint (`blocking-human`) | `CHECKPOINT_PRESENTED attempt=… head=…` then `OPERATOR_CONFIRMED_STACK_FREE=yes attempt=… head=…` with the same two values, in the current attempt's file; the reply must hold the attempt id | n/a | manual (checkpoint; `OPERATOR_CONFIRMED_STACK_FREE=yes` in `evidence/181-19-closing-e2e-gate.md`) |
| 181-19-03 | 19 | 11 | SUPA-10 | T-181-61, T-181-62 | The closing run is green on the frozen tree; the guard stays green; the run and the confirmation belong to one attempt and one commit | E2E gate | precondition: the answer check of the plan's attempt protocol exits 0; first command: attempt guard, the last confirmation line reads `yes attempt=<this id> head=<E2E_HEAD>` and precedes `TASK3_STARTED=`, then `E2E_WRAPPER_EXIT=0`, `E2E_FAILED=0`, `E2E_DID_NOT_RUN=0`; frozen-mode guard exit 0; `E2E_HEAD` = `E2E_RUN_HEAD` = `E2E_HEAD_AFTER` with three tree lines `yes`; second command: attempt guard, then every observation plan 08 or 13 deferred has a green verdict in this record or in plan 16's record (which counts only when it is the copy of its own current attempt), else the phase does not close; third command: both records are copies of their current attempts, `E2E_RUN_DIR` is `tests/e2e-runs/181-19-<this id>`, `git diff --quiet` between the local-gate record's `HEAD=` and `E2E_HEAD` outside `.planning/`, and the run directory's own `head` and `worktree-status.txt` show `E2E_HEAD` and no tracked change | ✅ | ✅ green (recorded, `evidence/181-19-closing-e2e-gate.md`) (548 passed, 0 failed, 0 did not run) |

"File Exists" reads: ✅ the test or gate exists today; ❌ W0 the task itself creates it first (the spec or script is written and seen failing before what it checks). "(toward)" marks a requirement this phase builds toward and a later phase closes; only SUPA-10 is closed here. Evidence paths are relative to this phase directory.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No framework is installed: Vitest and Playwright are already pinned. Each item below is created by the task named, before what it checks, and is seen failing first where it is a spec or a guard.

- [x] `yarn install --immutable` in this worktree under Node 24.21.0 — plan 181-01, task 1
- [x] The baseline of every local gate on the unchanged tree — plan 181-01, task 2
- [x] `apps/supabase/scripts/isolated-instance.sh` and its spike record — plan 181-02 (SUPA-04, SUPA-06, SUPA-10). Every database observation depends on it.
- [x] `apps/frontend/src/lib/server/startup/requiredEnv.test.ts` — plan 181-03, task 1 (INFRA-05)
- [x] `apps/frontend/src/routes/api/diagnostics/server.test.ts`, with the `$env/dynamic/private` stub — plan 181-03, task 3 (INFRA-06, off by default)
- [x] `apps/frontend/src/routes/api/health/server.test.ts` — plan 181-04, task 1 (INFRA-04)
- [x] New cases in `apps/frontend/svelte.config.test.ts` for the version name — plan 181-04, task 2 (PIPE-07)
- [x] `packages/dev-seed/tests/deploymentTemplates.test.ts`, seen failing on the unchanged templates — plan 181-05, task 1 (INFRA-05, SUPA-05)
- [x] `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts` and `scripts/fixtures/schema-migration-freeze/` — plan 181-06, task 1 (SUPA-10)
- [x] `packages/dev-seed/tests/deploymentChecksWiring.test.ts` — plan 181-15, task 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The shared local stack is free for an E2E run | SUPA-10 (phase gate) | Only the operator knows whether the v2.16 session is using the stack. A stop and a reset from this worktree discard that session's local database state. | Plans 181-16 and 181-19, task 2: the checkpoint shows an attempt id and a commit and lists what will be run; reply "stack is free" followed by that attempt id. The confirmation is for that attempt and that commit and is used for one run: a commit landing in the checkout before the run starts, or a run that has to be made again, voids it and the question is asked again. Pause other phases' executors until the run has finished. Afterwards the v2.16 session runs `yarn db:reset` from its own worktree. |
| The freeze goes ahead | SUPA-10 | A one-way decision that binds both streams. Its three preconditions depend on another session's work. | Plan 181-17, task 2: the checkpoint shows an attempt id and a commit; read `evidence/181-17-freeze-readiness.md`; re-check with the three commands the checkpoint names; select `freeze`, `freeze-without-commit` or `not-yet`, followed by that attempt id. The selection is for that attempt and that commit and is used once; a later `not-yet` overrides an earlier `freeze`; a commit landing before the freeze voids it. Pause other phases' executors until the freeze commit exists. |
| This worktree has a root `.env` with the local keys | SUPA-10 (phase gate) | `.env` is untracked and the operator's; an executor does not copy it between worktrees. | Before plan 181-16: copy the `.env` of the other worktree into this one. |
| Another phase's uncommitted changes are in the checkout | SUPA-10 (every whole-repo gate and the freeze) | Executors of phases 182 and 183 work in the same checkout. Only the orchestrator knows when their work is committed, and an executor of this phase must not stash, revert or commit their files. | Plans 181-01 (tasks 1 and 2), 181-15 (task 2), 181-16 (tasks 1 and 3), 181-17 (tasks 1 and 3), 181-18 (tasks 1 and 3) and 181-19 (tasks 1 and 3) stop at a checkpoint that quotes `git status --porcelain --untracked-files=no` verbatim and names the paths. Let the other phase commit, then resume. Commits of phases 182 and 183 on the branch are expected and are not pollution; each gate record names the `HEAD` it ran on. |

| The three operator checkpoints (181-16-02, 181-17-02, 181-19-02) | SUPA-10 | Each is a `blocking-human` answer bound to an attempt and a commit; no command can stand in for the operator's reply. | Covered by the answer lines in `evidence/181-16-e2e-gate.md` (`OPERATOR_CONFIRMED_STACK_FREE=yes`), `evidence/181-17-freeze-readiness.md` (`OPERATOR_DECISION=freeze`) and `evidence/181-19-closing-e2e-gate.md` (`OPERATOR_CONFIRMED_STACK_FREE=yes`); each is followed by its task 3, whose automated verify passed. |

Every other behaviour of the phase has an automated check whose status is read directly. The Docker and isolated-database observations (plans 181-02, 08 to 14, 18) are scripts with their own exit status; they are recorded green in `evidence/` and accepted by `181-VERIFICATION.md` truths 1, 3, 4 and 5, and were not re-run in the 2026-11-21 audit.

## Clean-Tree Rule and Deferred Observations

- **Clean tree.** The install and the baseline of plan 181-01, every whole-repo gate (build, unit tests, lint, format, E2E), the post-freeze observations and the freeze run only on a tree where `git status --porcelain --untracked-files=no` prints nothing. The assertion is whole-tree, never limited to this phase's paths, and `.planning/` is not excluded from it. A dirty tree is recorded verbatim and ends in a checkpoint, not in a failed or a passed gate. If `HEAD` or the status changes while a gate runs, that run is not evidence and is made again.
- **Evidence is written after the last tree sample.** A tracked evidence record must never be an uncommitted change when a tree sample is taken, by a task or by the E2E wrapper. During a gate task every line goes to `tmp/181-evidence/` (ignored by git: `git check-ignore -q tmp/181-evidence/probe` exits 0 on `.gitignore`'s `tmp/` entry; the fallback is `${TMPDIR:-/tmp}/openvaa-181-evidence/` outside the repository). The tracked record is copied from the current attempt's file only after the task's last tree sample and is committed at once. A checkpoint task writes to the current attempt's file only. A dirty-tree stop leaves the tracked record untouched.
- **Every line a check reads comes from the current attempt** (plans 181-01, 181-15, 181-16, 181-17, 181-18, 181-19). An attempt begins with a new attempt id (a UTC time and a 12-character short sha joined by a dot), a new attempt file `<record>.<attempt id>.txt` whose first line is `ATTEMPT=<attempt id>`, and the pointer file `<record>.current` set to that file's name. Every start of such a task, every re-run of its gates and every resumption after a dirty-tree stop is a new attempt; files of earlier attempts are kept, never read and never deleted. Status and output files of background commands carry the attempt id, and the E2E run directory is `tests/e2e-runs/181-NN-<attempt id>`. Each verdict key is written once per attempt. The tracked record is a `cp` of the pointer-named attempt file (in plan 181-17 the freeze record is that file's part from `TASK3_STARTED=` on). Every affected verify command begins with the same guard and fails on a missing pointer, a pointer that names no attempt file, a key written twice, or a record that differs from the current attempt's file. The verify commands therefore pass only in the checkout that holds the scratch directory; losing it fails them, and the repair is a new attempt.
- **An operator's answer is bound to what it answers** (plans 181-16, 181-17, 181-19). Task 1 starts the attempt; the checkpoint task writes `CHECKPOINT_PRESENTED attempt=<id> head=<sha>` when it shows the question and one answer line with the same two values when the reply arrives, and only a reply that holds the attempt id can be a `yes` or a `freeze`; the last answer line is in force. Task 3 starts with the plan's answer check, which passes only when the question and the answer in force carry the current attempt id and the current `git rev-parse HEAD`, the answer follows the question, and no `TASK3_STARTED=` line exists; it then writes that line, so an answer is used once. A refused answer is never used: Task 2 asks again in the same attempt when `HEAD` has not moved and the answer is unused, and Task 1 starts a new attempt in every other case. In plans 181-16 and 181-19 one attempt makes one wrapper run; a void, red or non-evidence run ends it.
- **Local gates describe the commit the suite ran on.** Decided by `git diff --quiet` between two recorded shas (the `HEAD=` line of the local-gate record, and `E2E_HEAD`), over every path outside `.planning/`, in the verify commands of plans 181-16 and 181-19, after the operator's wait. A re-run of the local gates is a new attempt of the local-gate record, made by Task 1 and never between the confirmation and the run; the record then holds that one run, and the verify commands require it to be the copy of its own current attempt.
- **Deferred observations.** Plan 181-13 may record `LOGIN_LEG=deferred` only when the spike recorded `HARNESS_FULL_MODE=failed`, and plan 181-08 may record `PGTAP_EXIT=not-run` for a harness reason. Neither closes anything. Plan 181-16, task 3, makes each deferred observation in its window and its second verify command fails unless the verdict is green. Plan 181-19, task 3, reads the same two source records again and fails unless a green verdict exists in plan 181-16's record or its own; while one is outstanding the phase does not close.

---

## Red Controls (each check seen failing once)

| Guard, check or probe | Red control | Recorded in |
|-----------------------|-------------|-------------|
| Template spec | Run on the unchanged templates | `evidence/181-05-templates-red.md` |
| Frozen-mode checker | One fixture for each rule of `FROZEN_RULES`, each yielding exactly one finding; a scratch run with one expectation emptied; a scratch run with one fixture directory deleted; a one-byte edit of a copied fixture. The scratch checkout is made from the commit that holds the guard under test | `evidence/181-06-freeze-checker-red.md` |
| Comment-hygiene exclusion | A prefix that matches nothing; the same bad line in `migrations/` and in `schema/`. The scratch checkout is made from the commit that holds the new constant | `evidence/181-07-hygiene-exclusion-red.md` |
| Bucket rows from the migration | Zero rows on the unchanged tree, before the insert existed | `evidence/181-02-harness-spike.md` |
| Start-up check | Each of four variables removed, and two at once; each run's error line must be the message naming exactly the removed variable, so a crash for another reason does not count | `evidence/181-09-production-start.md` |
| Health without Supabase | A counting stub upstream that gives the minimal valid answers sees the calls of a page's root load and none from health; the configured upstream refuses a connection (curl status 7); the same page then differs in the first of three values that does (final status, inlined fetches, server error lines). The search is bounded to the routes `/` and `/contestant/login` and one adaptation of the stub; with no difference the task ends in a blocking checkpoint and the verify command fails | `evidence/181-09-production-start.md` |
| Attempt guard and answer check | Exercised at planning time against fixture repositories, not by an executor: a missing pointer, a stale green record beside a later red attempt, a green and a red status in one attempt file, a record edited after the copy, a confirmation for another commit or another attempt, a `freeze` followed by `not-yet`, an answer already used, and a run directory of an earlier attempt each make the command fail | the plans' `fails_when` texts |
| Build id | A build with no `BUILD_SHA` names a number | `evidence/181-09-production-start.md`, `evidence/181-13-proxy-topology.md` |
| Diagnostics switch | 404 by default, 200 when enabled | `evidence/181-09-production-start.md`, `evidence/181-13-proxy-topology.md` |
| Equivalence check | Column grant, policy, function body, bucket row, role setting; the floor | `evidence/181-10-equivalence.md` |
| Bootstrap | A missing variable; a malformed project id; a forced statement failure and a log search | `evidence/181-11-bootstrap-and-seed-check.md` |
| Seed check | A database with `seed.sql` applied | `evidence/181-11-bootstrap-and-seed-check.md` |
| Drift check | Planted DDL; a manifest version never pushed; a pushed version not in the manifest; an unreachable database | `evidence/181-12-drift.md`, `evidence/181-18-frozen-model-observations.md` |
| Form post behind the proxy | A foreign `Origin` is refused 403 | `evidence/181-13-proxy-topology.md` |
| Spoofed forwarded address | `XFF_DEPTH=2` reports the spoofed address | `evidence/181-13-proxy-topology.md` |
| `SIGTERM` delivery | The shell-form entry point, recorded whichever way it goes | `evidence/181-14-sigterm.md` |
| `yarn lint:check` in frozen mode | One byte appended to the real baseline, in a scratch checkout | `evidence/181-18-frozen-model-observations.md` |
| `yarn schema:regenerate` | The command refuses after the freeze | `evidence/181-17-freeze.md`, `evidence/181-18-frozen-model-observations.md` |

## Assumptions Measured Before They Are Relied On

| Research assumption | Measured by | If it goes the other way |
|---------------------|-------------|--------------------------|
| A1: an isolated database-only instance has the platform's storage and auth schemas | Plan 181-02 | `supabase start` with services excluded; if no isolated mode works, database plans halt and the operator rules on follow-up X-2 |
| A2: `supabase db diff` is empty on a clean build | Plan 181-12, task 1 | The drift check's schema half uses the dump comparison of plan 181-10 |
| A3: the CLI tolerates existing bucket rows | Plan 181-08, task 3 | The `[storage.buckets.*]` blocks are deleted (D-07) |
| A4: which role and scope a dump can use | Plan 181-02 | The equivalence check dumps the three named schemas |
| A5: a failed statement's bound parameter is not logged | Plan 181-11, task 2 | The plan stops at a blocking checkpoint: the script would leak the key |
| A6: the process exits non-zero when `init` throws | Plan 181-09, task 1 | `init` ends the process with status 1 |
| A8: the stored `file_size_limit` | Plan 181-02 (read back) | The insert copies the value read |
| A10: the CLI accepts and orders a five-digit name | Plan 181-12, task 1 | Blocking checkpoint naming D-05 |
| A11: a throttled upload stays open long enough | Plan 181-14, task 1 | Blocking checkpoint; no delay is added to a route without a ruling |
| A13: no network call for a request without cookies (counted on a stub upstream); process exit after draining | Plan 181-09, task 2; plan 181-14 | The client is not constructed for the health path; one bounded shutdown listener is added |
| A15: the columns of the migration history table | Plan 181-02 | The drift check reads the recorded column |
| `verify_jwt` default of the local stack | Plan 181-16, task 3 | Recorded for phase 184; the declaration stays |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (the three checkpoint tasks are manual-only by nature and each is followed by an automated task 3)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s for unit-level tasks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-21 (reconcile audit; `181-VERIFICATION.md` status passed, 5/5)

---

## Validation Audit 2026-11-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |

Reconcile audit: no test or source file written. Re-run on HEAD 6c7fe7801, Node 24.21.0, each status read from its own file, not through a pipe:
- `yarn workspace @openvaa/frontend test:unit` of `requiredEnv.test.ts`, `api/diagnostics/server.test.ts`, `api/health/server.test.ts`, `svelte.config.test.ts`, `routeConsistency.test.ts`: exit 0, 5 files, 112 passed
- `yarn workspace @openvaa/dev-seed test:unit` of `ciDockerImageBuildGate`, `turboBuildInputsGate`, `localSupabaseUrl`, `deploymentTemplates`, `schemaMigrationFreezeGate`, `deploymentChecksWiring`, `template/permittedKeys`, `cli/allowedTeardownTables`: exit 0, 8 files, 174 passed
- `node scripts/assert-schema-migration-parity.mjs`: exit 0 (24 manifest entries, 16 fixtures, 15 rules); `--self-test`: exit 0
- `node scripts/assert-comment-hygiene.mjs`, `assert-env-pair-registry.mjs`, `assert-grant-permission-enum.mjs`: exit 0 each
- `check-schema-equivalence.sh --no-such-flag`: exit 2; `check-drift.sh --manifest infra/scripts/no-such-manifest.json`: exit 2 (both the expected refusal)
- `prettier --check infra`: exit 0; secret/URL grep of `infra/scripts/bootstrap.sql`: 0 hits; `docker compose -f infra/local/docker-compose.proxy.yml config --quiet`: exit 0

Not re-run (recorded green, cited per row): the isolated-instance harness, bucket, equivalence, bootstrap, seed, drift, proxy-topology and SIGTERM observations, the local-gate runs (`evidence/181-15-local-gates.md`, `evidence/181-18-local-gates.md`) and the two E2E gates (`evidence/181-16-e2e-gate.md`: 341 passed; `evidence/181-19-closing-e2e-gate.md`: 548 passed on `4c9fba56b`). `181-01-02` is a baseline measurement and records `TEST_UNIT_EXIT=1` from the stack-less dev-seed integration link on the unchanged tree; later gates record 0.
