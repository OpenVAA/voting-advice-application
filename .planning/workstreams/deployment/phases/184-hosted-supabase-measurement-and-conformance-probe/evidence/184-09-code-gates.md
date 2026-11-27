# 184-09 evidence: the three repository gates on the tree after the code plans

## Attempt 1 (2026-10-26)

- **Commit:** `f64a1335042ba5348cc80514bfce51ab46b343b2` (HEAD before and after every gate; `git status --porcelain --untracked-files=no` printed 0 lines before and after each)
- **Node:** v24.21.0
- **Runner:** one background script, `tmp/184-gates/run.sh`, running the three gates one after another with `TURBO_CACHE_DIR` set to a fresh `mktemp -d` directory. Each gate's stdout and stderr went to `tmp/184-gates/<gate>.log`, and its status was written to `tmp/184-gates/<gate>.status` by the command after it, never read through a pipe.
- **Shared stack:** another worktree's E2E run (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/179.1-e2e/179.1-08-close`) was in flight at 15:19Z. The gates were started only after two consecutive polls, at 15:25:22Z and 15:25:42Z, found no `e2e-run.sh` or `playwright test` process. `yarn db:status` exited 0 before the run.

| Gate | Status | Start (UTC) | End (UTC) | Note |
| --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 2026-10-26T15:26:02Z | 2026-10-26T15:26:58Z | It reached the last link: the parity guard printed `every classified key holds`, with 346 tracked files scanned for a second writer |
| `yarn format:check` | `format:check exit=0` | 2026-10-26T15:26:58Z | 2026-10-26T15:27:17Z | `All matched files use Prettier code style!` (root and docs) |
| `yarn test:unit` | **1** | 2026-10-26T15:27:17Z | 2026-10-26T15:27:49Z | turbo: `Tasks: 23 successful, 25 total`, `Failed: @openvaa/dev-seed#test:unit`. The `&&` chain stopped there, so `test:unit:tests` and `test:unit:infra` did not run within it |

### The failing link

`@openvaa/dev-seed#test:unit`: `Test Files 1 failed | 79 passed (80)`, `Tests 2 failed | 1262 passed (1264)`. Both failures are in `tests/integration/default-template.integration.test.ts`, which seeds the shared local stack:

1. `applies default template and meets the NF-01 operation budget + assertions`. First error line: `Error: bulkImport failed: Nomination constituency <uuid> is no constituency of its election <uuid>`
2. `the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)`. First error line: `AssertionError: anon-visible candidate nominations: expected 0 to be greater than 0`. This follows from the first failure, because the import wrote no rows.

### Why it fails: the shared database holds another branch's schema

This was checked with three read-only observations, made after the run while no E2E was in flight:

- No file of this branch under `apps/supabase/supabase/` contains the message `is no constituency of its election`.
- The shared database has it: `public.validate_nomination` is the one function whose source holds it.
- `supabase_migrations.schema_migrations` in the shared database holds 18 versions, the last of them `00018`. This branch has one migration, `00001_initial_schema.sql`.

The schema in the shared database is therefore the one the other worktree's E2E run applied, not this branch's. It refuses a nomination shape that this branch's dev-seed writes. No file this phase changed is involved. The only fix is a `db:reset` of the shared stack to this branch's migrations, and the standing rules forbid that.

### Re-run and the links not reached

| Command | Status | Result |
| --- | --- | --- |
| `yarn workspace @openvaa/dev-seed vitest run tests/integration/default-template.integration.test.ts` (one re-run, no E2E in flight) | 1 | the same `bulkImport failed: Nomination constituency … is no constituency of its election …`; `Tests 2 failed | 1 passed (3)` |
| `yarn test:unit:tests` | 0 | `Test Files 10 passed (10)`, `Tests 189 passed (189)` |
| `yarn test:unit:infra` | 0 | `Test Files 1 passed (1)`, `Tests 96 passed (96)` |

The turbo summary reported `Cached: 11 cached, 25 total` even though the cache directory was empty. Whether turbo 2.11.4 honours `TURBO_CACHE_DIR` was not checked, so this is UNCONFIRMED. The failing dev-seed task ran live.

**Outcome of attempt 1:** `test:unit` is not green on this tree while the shared stack holds another branch's schema. This record does not yet hold `test:unit exit=0`.

## Attempt 2 (2026-11-08)

- **Commit:** `8319f4540254a73ae8bf81a9703b2e5ec1ce2e59` (HEAD before and after every gate; `git status --porcelain --untracked-files=no` printed 0 lines after each)
- **Node:** v24.21.0
- **Runner:** `tmp/184-gates/attempt2/run.sh`, attempt 1's runner with its output directory changed to `tmp/184-gates/attempt2/`: the three gates one after another, in the background, with `TURBO_CACHE_DIR` set to a fresh `mktemp -d` directory. Each status was written to `<gate>.status` by the command after the gate and read from that file, never through a pipe.
- **Shared stack:** before this attempt the operator chose to reset the shared stack to this branch's schema, and `yarn db:reset` was run from this worktree (exit 0). Before the run `yarn db:status` exited 0, no `e2e-run.sh` or `playwright test` process was running, and `supabase_migrations.schema_migrations` held exactly one version, `00001`; after the run it still held only `00001`.

| Gate | Status | Start (UTC) | End (UTC) | Note |
| --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 2026-11-08T19:02:44Z | 2026-11-08T19:03:33Z | It reached the last link: the parity guard printed `every classified key holds` |
| `yarn format:check` | `format:check exit=0` | 2026-11-08T19:03:33Z | 2026-11-08T19:03:49Z | `All matched files use Prettier code style!` (root and docs) |
| `yarn test:unit` | `test:unit exit=0` | 2026-11-08T19:03:49Z | 2026-11-08T19:04:31Z | turbo: `Tasks: 25 successful, 25 total`; then `test:unit:tests` (`Test Files 10 passed (10)`, `Tests 189 passed (189)`) and `test:unit:infra` (`Test Files 1 passed (1)`, `Tests 96 passed (96)`) |

`@openvaa/dev-seed#test:unit`, the link that failed in attempt 1: `Test Files 80 passed (80)`, `Tests 1264 passed (1264)`, with `tests/integration/default-template.integration.test.ts` passing its 3 tests against the reset stack. `@openvaa/frontend#test:unit`: `259 passed | 1 skipped (260)` test files; the skipped file is not one this phase touched.

On the turbo summary's `Cached: 11 cached, 25 total`, which attempt 1 left open: the per-task lines show that every `test:unit` task ran as `cache bypass, force executing`, and the 11 hits are all `build` tasks (`replaying logs`). Where turbo found those build entries with an empty `TURBO_CACHE_DIR` was not checked, so it is UNCONFIRMED; no test task's result was replayed.

**Outcome of attempt 2:** all three gates exit 0 at `8319f4540254a73ae8bf81a9703b2e5ec1ce2e59`. Attempt 1's red `test:unit` came from the shared stack holding another branch's schema, and it went away with the reset and no change to any file.
