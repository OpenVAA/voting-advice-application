---
quick_id: 261008-g2-g4-g6
status: complete
commits:
  - e4bea9dad
  - 0633e4023
  - a80be44e1
  - 4a92f6427
decisions: "v2.16-OPERATOR-DECISIONS-2026-10-08.md § G: G2 (a), G4 (a), G6 (a)"
---

# Summary — three E2E harness fixes ahead of Phase 175 (G2, G4, G6)

Three test-infrastructure defects left by Phase 174, ruled as quick tasks on 2026-10-08. All three are done, and
the closing gate is green on the first attempt.

| Task | Commit | One line |
| --- | --- | --- |
| G6 | `e4bea9dad` | `safeListUsers` deleted; every lookup of an auth user reads all users and throws when the listing fails |
| G4 | `0633e4023` | `yarn test:unit` runs `tests/tests/utils/*.test.ts`, and the unit-coverage guard holds the link |
| G2 | `a80be44e1` | the wrapper's `db-start.log` and `db-reset.log` no longer hold the stack's keys |

## G6 — `safeListUsers`

`tests/tests/utils/supabaseAdminClient.ts`. The helper read the first page of users and answered a failed listing
with an empty list. It had eight callers, derived by grep: `userIdForEmail`, `revokeEntityGrant`, `setPassword`,
`acceptTermsOfUse`, `getAuthUserByEmail`, `deleteBankAuthCandidateBySub`, `unregisterCandidate`,
`deleteAllTestUsers`. All eight now read through `listAllUsers`, seven of them by way of one private by-address
lookup, `findAuthUser`, which `hasAuthUser` and `grantRowsForUser` share. The helper is deleted, and one call of
`auth.admin.listUsers` is left in `tests/`.

- **No caller keeps a tolerance for a failed listing.** The cleanups that used to return quietly
  (`revokeEntityGrant`, `deleteBankAuthCandidateBySub`, `unregisterCandidate`, `deleteAllTestUsers`) now throw
  before anything is deleted. A teardown that cannot list the users fails, naming the method.
- **The address comparison is now trimmed and lower-cased** for the eight, as it already was for the strict
  readers. They compared exactly before. No call is known to resolve differently.
- **`listAllUsers` carries `app_metadata`**, which `getAuthUserByEmail` returns to the bank-auth journey.
- **The "GoTrue NULL column bug"** the old docblock cited: no tolerance kept. The listing failed in no call of the
  closing run. Whether the pinned CLI still fails on a user row inserted by SQL was not tested; nothing outside the
  pgTAP helpers inserts one.

`tests/README.md` gained one pitfall line, and one comment in `base.teardown.ts` was corrected.

## G4 — six ungated test files

`tests/` is not a workspace, so turbo never ran `tests/vitest.config.ts`.

- `package.json`: a root script `test:unit:tests` = `vitest run --config tests/vitest.config.ts`, chained as the
  last link of `test:unit`, the shape `lint:check` uses for `eslint tests` and `typecheck:tests`. CI and the `unit`
  row of the phase gate scripts both call `yarn test:unit`, so neither changed.
- `scripts/assert-unit-test-coverage.mjs`: Check 3. The suite is named by its config, and the guard fails when the
  root script does not run that config or `test:unit` does not chain it as an `&&` link of its own. Three controls,
  each exit 1, each restored: link removed, `|| true` appended, script emptied.
- `tests/vitest.config.ts` and `tests/README.md` describe the wiring.

Red, then green: with `expect(1).toBe(2)` appended to `mailedLink.test.ts` (never committed), `yarn test:unit`
exited 1 with turbo at 25 of 25 tasks and the last link at `1 failed | 102 passed`. Without it: exit 0, 7 files,
102 tests (the six files' 95, plus 7 in the file G2 added).

The todo `2026-08-27-147-tests-vitest-config-runs-in-no-command.md` named this hole for three files; it is closed
with this task.

## G2 — keys in run logs

`supabase start` ends with the stack's status. `e2e-run.sh` now writes the output of `yarn db:start`, and of
`yarn db:reset`, which starts the stack first and held the same status, through
`tests/scripts/withhold-stack-keys.mjs`. The filter replaces the status with a marker line, in the JSON form the
pinned CLI (2.118.0) prints to a pipe and in the boxed-table form older logs hold, and copies every other line
unchanged; two further rules catch a labelled key line and a key inside an ordinary line.

- **Readers.** Nothing parses either log. `e2e-run.sh` names them in its exit-3 message, `determinism-batch.sh`
  mentions one in a sentence, and CI uploads the run directory as an artifact. Nothing of the status is kept.
- **Failure.** The step fails when the start fails and when the filter fails (`pipefail`); nothing unfiltered is
  written in either case.
- **The check.** One pattern, written apart from the filter's, counting lines without printing them:

  | File | Lines | Key-shaped |
  | --- | --- | --- |
  | `261008-quick-g2-g4-g6/db-start.log` (this run) | 5 | 0 |
  | `c6-heartbeat-close/db-start.log` (unfiltered wrapper) | 5 | 1 |
  | `167-gate/db-reset.log` (unfiltered wrapper) | 75 | 4 |

  Each of the two old logs through the filter, written to scratch: 0.
- **Held from now on** by `tests/tests/utils/withholdStackKeys.test.ts`, which G4 put under `yarn test:unit`: the
  filter over each form with made-up keys, and a scan that fails on a script under `tests/scripts/` writing that
  output to a file without the filter. Three mutations turned it red: the object rule removed, the table rule
  removed, the wrapper's old redirect restored.
- **Old logs** are as they were: 326 start and reset logs under `tests/e2e-runs/`, 325 with a key-shaped line.

## Closing gate

All on commit `c030a0d4f`: the three code commits above plus two another agent added on top while this task ran
(`26a34e4ee`, a frontend unit test file; `c030a0d4f`, planning documents). Outside `.planning/`, the tree of
`a80be44e1` differs from it by that one test file.

| Command | Exit | Notes |
| --- | --- | --- |
| `yarn lint:check` | 0 | `TURBO_FORCE=true`, 0 tasks cached |
| `yarn format:check` | 0 | |
| `yarn test:unit` | 0 | `TURBO_FORCE=true`; 25 of 25 turbo tasks, then 7 files and 102 tests in the new link |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/261008-quick-g2-g4-g6 --no-db-reset` | 0 | below |

E2E: **220 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**, 107 projects, 5.3 minutes, preflight 1 success
and 0 failures, no void marker, heartbeat 174 beats with a largest lateness of 287 ms. Every project is at its
total in the last full run before it (`174-e2e/174.1-02-close`, 220 in 107). No run was void and none was red;
this was the only E2E run made. Each status was read from the command itself, never through a pipe.

## What went wrong on the way

- **`yarn test:unit` was red once on this task's own change.** The README sentence written with G2 named the reset
  command, and `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` accounts for every mention of it. The
  sentence was reworded and the correction folded into the G2 commit before the closing gate.
- **The first red demonstration for G4 was red for another reason**: a probe test another agent had placed under
  `apps/frontend/coverage/` failed the frontend's unit task before the new link ran. It was repeated once that
  file was gone.

## Not done

- **The bank-auth driver.** `174-bankauth.sh` still writes the unfiltered output; the closed todo asked for the
  change in the next phase's copy, not in a finished phase's. Filed:
  `todos/pending/2026-10-08-bank-auth-driver-copy-must-filter-the-db-start-output.md`.
- **No red control for G6.** No test makes a listing fail or pushes a user past the first page.
- **Not run:** the wrapper's `yarn db:reset` branch, a cold start of the stack, the opt-in bank-auth projects, and
  any CI run.

## Out of scope, reported and not fixed

- `setPassword` and `deleteAllTestUsers` on the E2E admin client have no caller.
- CI's own `supabase start` steps print the same status into the Actions log.
- `scripts/assert-unit-test-coverage.mjs` fails `eslint` when linted directly (58 findings before this task, 61
  after, the same two rules); no gate lints `scripts/`.
- The local `node` on `PATH` is 24.14.1, below the `engines` floor of 24.15.0. Every command here ran with 24.21.0
  put first on `PATH`, as the phase gate scripts do.

## Records

- Closed, with a Resolution each (commit `4a92f6427`):
  `todos/done/2026-10-07-174-safelistusers-reads-one-page-and-answers-a-failure-with-empty.md`,
  `todos/done/2026-10-07-174-e2e-drivers-write-db-start-output-with-the-local-keys.md`,
  `todos/done/2026-08-27-147-tests-vitest-config-runs-in-no-command.md`.
- Run directory: `tests/e2e-runs/261008-quick-g2-g4-g6/` (gitignored), with `summary.json` and `provenance.txt`.
