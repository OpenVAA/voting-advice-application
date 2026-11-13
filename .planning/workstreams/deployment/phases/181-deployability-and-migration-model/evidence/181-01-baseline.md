ATTEMPT=20261012T155907Z.3cef33c0d7d2
HEAD=3cef33c0d7d2d674568bc2479118be06d1f2155f
TREE_CLEAN_BEFORE_GATES=yes
PARITY_GUARD_EXIT=0
BUILD_EXIT=0
TEST_UNIT_EXIT=1
LINT_CHECK_EXIT=0
FORMAT_CHECK_EXIT=0
HEAD_AFTER_GATES=3cef33c0d7d2d674568bc2479118be06d1f2155f
TREE_CLEAN_AFTER_GATES=yes
SUPPLEMENT_FRONTEND_TEST_UNIT_STATUS=0
SUPPLEMENT_HARNESS_TEST_UNIT_STATUS=0
DATE=2026-10-12T16:05:38Z

How the run was made
- The five gates ran one after another, each in the background, under Node v24.21.0, from the repository root: node scripts/assert-schema-migration-parity.mjs, yarn build, yarn test:unit, yarn lint:check, yarn format:check. Each status was written by the command itself to a status file of this attempt id and read from there.
- TURBO_CACHE_DIR pointed at a directory private to this attempt, empty before the first gate. With its default settings turbo 2.11.4 uses one cache for all worktrees of this repository (its banner reads "using shared worktree cache"), so a gate on this tree can exit 0 by replaying results that another worktree produced. With the private directory every turbo task was executed in this worktree at least once in this attempt, and nothing was written to the shared cache.
- This worktree has no root .env file, and SUPABASE_URL was not set in the shell.
- Both tree samples are a whole-tree git status --porcelain --untracked-files=no with empty output. No gate rewrote a tracked file.

Parity guard, census line verbatim
    Schema-migration parity guard (phase 156: REVIEW-DB-07) — census: 29 schema file(s) -> 7859 line(s); 00001_initial_schema.sql -> 7859 line(s); apps/supabase/supabase/migrations holds 1 .sql file(s); generated copy is current.

Build (exit 0)
- All 14 build tasks were executed and none was replayed from a cache. The summary lines:
     Tasks:    14 successful, 14 total
    Cached:    0 cached, 14 total
      Time:    1m0.87s 

Unit tests (exit 1): the gate is red on the unchanged tree
- Failing link: the second link of yarn test:unit, turbo run test:unit, in the task @openvaa/dev-seed#test:unit. The first link, yarn assert:unit-coverage, passed.
- Failing test: packages/dev-seed/tests/integration/default-template.integration.test.ts > integration tier wiring (always runs — never skipped) > the integration tier either RUNS or is provably unavailable — it is never quietly dropped
- This test reached 127.0.0.1:54321. With SUPABASE_URL unset it sends one GET to http://127.0.0.1:54321/rest/v1/ and fails when anything answers. The shared local stack answered. The cause is the state of this worktree and host (no root .env, and a local Supabase running), not a line of the tree. No stack was started, stopped or reset for it, and the two tests of the integration tier itself were skipped, so nothing was written to the shared database.
- Its message, verbatim:
    @openvaa/dev-seed:test:unit: AssertionError: A local Supabase is answering on port 54321, but SUPABASE_URL is unset, so this file just skipped — the anon-RLS guard (TMPL-03), the NF-01 operation budget and the relational assertions did NOT run, and the suite would still have exited 0. Copy `.env.example` to `.env` at the repo root (dev-seed reads PUBLIC_SUPABASE_URL from it), or export SUPABASE_URL, then re-run. This assertion exists because a did-not-run is a failure, not a pass.: expected true to be false // Object.is equality
- The dev-seed summary lines:
    @openvaa/dev-seed:test:unit:  Test Files  1 failed | 67 passed (68)
    @openvaa/dev-seed:test:unit:       Tests  1 failed | 1038 passed | 2 skipped (1041)
- Did not run, and so not shown green by this gate: the task @openvaa/frontend#test:unit was cancelled by turbo before it printed a summary, and the third link, yarn test:unit:tests, was never started. Nine other test:unit tasks completed and passed: core, supabase, app-shared, matching, filters, question-info, llm, argument-condensation, data.
- The last 30 lines of the gate's output (colour codes removed):
    @openvaa/dev-seed:test:unit: - Expected
    @openvaa/dev-seed:test:unit: + Received
    @openvaa/dev-seed:test:unit: 
    @openvaa/dev-seed:test:unit: - false
    @openvaa/dev-seed:test:unit: + true
    @openvaa/dev-seed:test:unit: 
    @openvaa/dev-seed:test:unit:  ❯ tests/integration/default-template.integration.test.ts:116:7
    @openvaa/dev-seed:test:unit: 
    @openvaa/dev-seed:test:unit:     114|         'to `.env` at the repo root (dev-seed reads PUBLIC_SUPABASE_UR…
    @openvaa/dev-seed:test:unit:     115|         'then re-run. This assertion exists because a did-not-run is a…
    @openvaa/dev-seed:test:unit:     116|     ).toBe(false);
    @openvaa/dev-seed:test:unit:        |       ^
    @openvaa/dev-seed:test:unit:     117|
    @openvaa/dev-seed:test:unit:     118|     // reachable === false: no local instance at all. The skip is legi…
    @openvaa/dev-seed:test:unit: 
    @openvaa/dev-seed:test:unit: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
    @openvaa/dev-seed:test:unit: 
    @openvaa/dev-seed:test:unit:  Test Files  1 failed | 67 passed (68)
    @openvaa/dev-seed:test:unit:       Tests  1 failed | 1038 passed | 2 skipped (1041)
    @openvaa/dev-seed:test:unit:    Start at  18:00:33
    @openvaa/dev-seed:test:unit:    Duration  41.42s (tests 58%, transform 24%, import 18%, worker 1%)
    @openvaa/dev-seed:test:unit: 
    @openvaa/dev-seed#test:unit:  ERROR  command (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/packages/dev-seed) /private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/xfs-020cdb67/yarn run test:unit exited (1)
    
     Tasks:    23 successful, 25 total
    Cached:    14 cached, 25 total
      Time:    44.944s 
    Failed:    @openvaa/dev-seed#test:unit
    
     ERROR  run failed: command  exited (1)

Supplementary observations (not gates of the plan)
- Made after the five gates and before the last tree sample, to give a status to the two parts that the red link kept from running. They do not change TEST_UNIT_EXIT.
- yarn workspace @openvaa/frontend test:unit, status in SUPPLEMENT_FRONTEND_TEST_UNIT_STATUS:
     Test Files  194 passed | 1 skipped (195)
          Tests  3575 passed | 20 skipped (3595)
- yarn test:unit:tests, status in SUPPLEMENT_HARNESS_TEST_UNIT_STATUS:
     Test Files  7 passed (7)
          Tests  102 passed (102)

Lint check (exit 0)
- turbo run lint: 12 tasks executed, none replayed. turbo run typecheck: 13 typecheck tasks executed; its 10 build dependencies were replayed from this attempt's own cache. The summary lines of the two turbo runs:
     Tasks:    12 successful, 12 total
    Cached:    0 cached, 12 total
     Tasks:    23 successful, 23 total
    Cached:    10 cached, 23 total

Format check (exit 0)
- Its build of @openvaa/app-shared and dependencies was replayed from this attempt's own cache. The prettier lines:
    All matched files use Prettier code style!
    All matched files use Prettier code style!

Database and shared stack
- Lines of gate output that name port 54321 or 54322: one, the message quoted above. No output holds a refused connection.
- docker ps listed the same 13 containers named *_openvaa-local before Task 1 and after the last gate: yes.
