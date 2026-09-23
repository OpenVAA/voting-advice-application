---
phase: 161-project-scoping-project-id-parameterisation
plan: 05
subsystem: testing
tags: [playwright, supabase, dev-seed, e2e, multi-tenancy, idempotency, bash]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "PUBLIC_PROJECT_ID plumbed into the running frontend (161-01), so a project id delivered on the dev-server spawn actually reaches the served application"
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "the project-scoped adapter and its lint:check guard (161-01, 161-04), which the harness's project now feeds"
provides:
  - E2E_PROJECT_ID and resolveE2eProjectId() on packages/dev-seed/src/supabaseAdminClient.ts, exported from the package barrel
  - ensureProject(projectId?) — idempotent public.projects + public.app_settings bootstrap, no accounts row, no delete path
  - the tests/ SupabaseAdminClient subclass defaulting its project to the E2E project while the dev-seed base keeps the default project
  - setupFromTemplate threading the resolved id into runPipeline and the Writer, so seeded rows land in the project the harness reads
  - globalSetup creating the E2E project immediately after the served-application assertion
  - "tests/scripts/e2e-run.sh --no-db-reset, which still starts Supabase, and PUBLIC_PROJECT_ID on the dev-server spawn"
  - the unowned-row probe re-aimed at the run's own project, with BASELINE_SEED_PREFIX deleted
affects: [161-06, 161-07, 161-08, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 10879
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Per-suite project ownership: the harness creates and owns a project distinct from the default one, so contamination between a test run and a local development session is structurally impossible rather than swept by prefix filters"
    - "Subclass-scoped default: a project default is overridden in the tests/ subclass and at the two seeding call sites, never in the shared base constructor, so one package serves two audiences with opposite defaults"
    - "Reachability-gated integration tier: a test tier gates on whether the local service answers, not on an env var vitest never loads, so it runs on a plain developer machine instead of skipping silently"
    - "A boolean flag that skips a step must preserve that step's side effects: --no-db-reset still starts Supabase, because the block it guards was also the start"

key-files:
  created:
    - packages/dev-seed/tests/ensureProject.test.ts
    - .planning/todos/pending/2026-08-28-promote-e2e-freshness-probe-to-hard-failure.md
  modified:
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/index.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/setup/shared/setupFromTemplate.ts
    - tests/global-setup.ts
    - tests/scripts/e2e-run.sh

key-decisions:
  - "The app_settings ON DELETE CASCADE gap the plan asked to file was measured CLOSED in both trees — 13 of 13 project_id foreign keys carry the cascade — so the todo was deliberately not filed, per the plan's own branch A"
  - "The plan's task-3 verify regex (REFERENCES public\\.projects\\(id\\)) cannot match the tree's sqlfluff-formatted `public.projects (id)`; the instrument was corrected to tolerate the space rather than the branch being forced"
  - "ensureProject names a created project `Project <uuid>` rather than 'E2E Test Project', because the method is on the dev-seed base class and can create any project, not only the harness's"
  - "The live half of ensureProject.test.ts gates on local Supabase REACHABILITY rather than on SUPABASE_URL, because vitest does not load the repo-root .env and an env-gated tier would skip on every developer machine"
  - "The tests/ subclass default is asserted from its SOURCE, because vitest.workspace.ts enumerates packages/** only and tests/ has no vitest project to assert it at runtime"
  - ".env.example needed no edit — plan 161-01 had already written the E2E_PROJECT_ID line commented out, which is the state task 1 asks for"

patterns-established:
  - "Two consecutive no-reset runs are taken as the acceptance evidence for anything claiming reset-independence, not one"
  - "A comment this repository's hygiene guard accepts is one paragraph per line; wrapped prose is a lint error, not a style preference"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "resolveE2eProjectId() returns the committed constant when unset, normalises an override, and refuses both a default-project collision and a non-canonical uuid"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/ensureProject.test.ts#resolveE2eProjectId (6 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ensureProject() is idempotent, creates the required app_settings row, reuses the default account, and honours an explicit project argument"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "packages/dev-seed/tests/ensureProject.test.ts#ensureProject against the live local database (4 cases, run against local Supabase)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every tests/ admin client and every seeded row targets the E2E project, while the dev-seed base class and ctx.ts keep targeting the default project so yarn db:seed is unaffected"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/ensureProject.test.ts#project-id defaults at the two construction sites (4 cases)"
        status: pass
      - kind: other
        ref: "post-run database read: default project holds 328 candidates untouched, E2E project holds the run's content and is torn down to 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "globalSetup creates the E2E project immediately after the served-application assertion, and no globalTeardown was added"
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "awk '/assertServedApp/{a=NR} /ensureProject/{b=NR} END{exit !(a>0 && b>a)}' tests/global-setup.ts — exit 0; grep -c globalTeardown tests/playwright.config.ts — 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/161-05-smoke-a and -b — the E2E project row and its app_settings row exist after runs that started without them"
        status: pass
    human_judgment: false
  - id: D5
    description: "--no-db-reset exists, still starts Supabase, documents itself in the header contract, and the spawned dev server receives the E2E project id"
    requirement: PRESHIP-01
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-05-smoke-{a,b} --project a11y-smoke --no-db-reset — both exit 0, 18/18, preflight-failures 0, env-posture records db_reset=false and e2e_project_id"
        status: pass
      - kind: other
        ref: "bash -n exit 0; --help exit 0 listing the flag; --bogus still exits 2"
        status: pass
    human_judgment: false
  - id: D6
    description: "The unowned-row probe describes what it now asks, BASELINE_SEED_PREFIX and both exclusion clauses are gone, and the warn-by-default polarity survives"
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "grep -c BASELINE_SEED_PREFIX tests/tests/setup/shared/setupFromTemplate.ts — 0; one live E2E_REQUIRE_FRESH_DB read still gating a throw"
        status: pass
      - kind: e2e
        ref: "no probe warning in either back-to-back no-reset run (grep -c setupFromTemplate over both stdout.log — 0)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The two follow-ups are dispositioned: the probe promotion is filed with its evidence prerequisite, and the app_settings cascade was measured closed and deliberately not filed"
    verification:
      - kind: other
        ref: "the plan's task-3 node verify, with its regex corrected for the space before (id) — 'probe re-aim ok; cascade closed upstream, not filed', exit 0"
        status: pass
    human_judgment: false

duration: 20 min
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 05: E2E Project Ownership Summary

**The E2E suite now creates and owns project `00000000-0000-0000-0000-0000000000e2`, reads and writes only into it, delivers its id to the dev server it tests against, and runs green twice in a row with no database reset between the runs.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-04T14:44:17Z
- **Completed:** 2026-09-04T15:04:22Z
- **Tasks:** 3
- **Files modified:** 8 (2 created, 6 modified)

## Accomplishments

- **`ensureProject()` exists and is idempotent against a live database.** It performs the `seed.sql` bootstrap as two ordered conflict-ignoring upserts — `public.projects` first, then the required `public.app_settings` row — creates no `accounts` row, and has no delete path anywhere.
- **The harness reads and writes one project that is not the default project.** A single constructor override on the `tests/` subclass re-points every argument-less `new SupabaseAdminClient()` inside `tests/`; `setupFromTemplate` threads the same resolved id into `runPipeline` and the `Writer`, so seeded rows land where the client reads.
- **`yarn db:seed` is untouched.** `ctx.ts` and the dev-seed base constructor are byte-identical to HEAD, `resolveE2eProjectId` has no call site inside `packages/` other than its own definition and barrel export, and the `.env.example` line stays commented out. Measured directly: after two full E2E runs the default project still holds its 328 dev-seed candidates.
- **`--no-db-reset` runs the suite without a reset while still starting Supabase**, and records `db_reset` and the resolved project id in the run's `env-posture.txt`.
- **The dev server is pointed at the same project**, via `PUBLIC_PROJECT_ID` on the existing `set -m` spawn prefix — no Playwright `webServer` was added.
- **The freshness probe now asks a question it can answer.** `BASELINE_SEED_PREFIX` and both of its exclusion clauses are deleted; the probe, its docblock and its message all describe unowned rows inside the run's own project.

## Task Commits

1. **Task 1 (RED): failing tests for the resolver and ensureProject** — `e00a2ae3d` (test)
2. **Task 1 (GREEN): the constant, resolver, ensureProject and the harness re-point** — `8d4430dbb` (feat)
3. **Task 2: globalSetup ensureProject + `--no-db-reset` + the spawn's project id** — `2e7b4478b` (feat)
4. **Task 3: probe re-aim and the follow-up filings** — `452eaef3f` (refactor)
5. **Gate-driven fixes: `quotes` rule and comment-hygiene guard** — `c260a285a` (fix)

## Files Created/Modified

- `packages/dev-seed/src/supabaseAdminClient.ts` — `E2E_PROJECT_ID`, `CANONICAL_UUID`, `DEFAULT_ACCOUNT_ID`, `resolveE2eProjectId()` and the `ensureProject()` method. The base constructor's `projectId ?? TEST_PROJECT_ID` is unchanged.
- `packages/dev-seed/src/index.ts` — both new symbols exported and described in the public-API docblock.
- `packages/dev-seed/tests/ensureProject.test.ts` — 15 cases in three tiers: six pure resolver cases, four construction-site/default cases (two of them source-reading), and four live cases against local Supabase, plus a named test recording whether the live tier ran.
- `tests/tests/utils/supabaseAdminClient.ts` — an explicit constructor defaulting `projectId` to `resolveE2eProjectId()`, re-exports of both new symbols, and a docblock that now states the two-defaults arrangement and lists `ensureProject` as inherited.
- `tests/tests/setup/shared/setupFromTemplate.ts` — the id resolved once and threaded into the client, a spread copy of the template for `runPipeline`, and `new Writer({ projectId })`; the probe re-aimed and `BASELINE_SEED_PREFIX` deleted.
- `tests/global-setup.ts` — `await new SupabaseAdminClient().ensureProject();` after `assertServedApp`, with the ordering invariant stated.
- `tests/scripts/e2e-run.sh` — `--no-db-reset` and its `DB_RESET` guard over a renamed step 3, the `yarn db:start` branch, `PUBLIC_PROJECT_ID` on the spawn, two new posture lines, and three header-contract edits (`Usage:`, the numbered list's item 3, the exit-code table's row 3).
- `.planning/todos/pending/2026-08-28-promote-e2e-freshness-probe-to-hard-failure.md` — the promotion proposal, its evidence prerequisite and its cross-reference.

## Verification Results

Every gate was run as its own foreground command with its exit code read directly, never through a pipe.

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/dev-seed test:unit` | **exit 0** — 58 files, 649 tests; `ensureProject.test.ts` 15, reported by name |
| `yarn typecheck:tests` | **exit 0** |
| `TURBO_FORCE=true yarn lint:check` | **exit 0** — the full 17-link chain |
| `bash -n tests/scripts/e2e-run.sh` | **exit 0** |
| `tests/scripts/e2e-run.sh --help` | **exit 0**, output contains `--no-db-reset` |
| `tests/scripts/e2e-run.sh --run-dir /tmp/x --no-db-reset --bogus` | **exit 2**, `unknown argument '--bogus'` |
| Smoke run A (`--no-db-reset`) | **exit 0** — 18 expected / 0 unexpected / 0 flaky / 0 skipped; preflight failures 0, successes 1 |
| Smoke run B, immediately after A, no reset between | **exit 0** — same counts |
| `git grep -n "DELETE FROM public.projects"` | **nothing** |

### The isolation was measured, not assumed

Read back from the live database after the runs:

```
projects rows:
  00000000-0000-0000-0000-000000000001 | Default Project
  00000000-0000-0000-0000-0000000000e2 | Project 00000000-0000-0000-0000-0000000000e2
app_settings project_ids: 00000000-...-0001, 00000000-...-00e2
candidates in 00000000-0000-0000-0000-000000000001 = 328
candidates in 00000000-0000-0000-0000-0000000000e2 = 0
scratch project rows left behind: 0
```

The E2E project and its `app_settings` row exist where nothing created them before; the default project's 328 dev-seed candidates are untouched by two full E2E runs; the E2E project's own content is back to zero because the run's `data-teardown-base` cleared it while the project row stayed. That is the stated teardown posture, observed rather than described. The scratch project the integration tier writes to is fully cleaned up.

### The two consecutive no-reset runs

Not required by this plan's criteria — plan `161-07` owns the full-suite version — but run because this plan's whole value is that `161-07` can trust it. Both runs green, `db_reset=false` in both postures, no reset between them, and **zero probe warnings in either** (`grep -c setupFromTemplate` over both `stdout.log` → 0, 0). That is an early positive reading on the promotion todo's evidence prerequisite, at single-project scope.

### Non-vacuity of the instruments used

- **The RED phase was real.** The failing run reported **11 failed / 4 passed**, and the live tier RAN rather than skipping — its four failures are `TypeError: client.ensureProject is not a function`, not a skip and not a collection error.
- **The cascade measurement.** The grep harvested **13** `REFERENCES public.projects` lines per tree (non-zero), and the `grep -v "ON DELETE CASCADE"` filter returned nothing. Flipped: on a `sed`-stripped copy of `106-app-settings.sql` the same filter fires and names line 7. The corrected node regex likewise returns `true` on the real file and `false` on a cascade-stripped copy.
- **The comment-hygiene guard.** It reported **61 violations across 1655 files scanned** before the reflow and **0 across 1655** after — the same corpus, so the zero is a verdict rather than an empty scan.
- **The project-scoped query guard** (161-01/04's, re-run here as part of `lint:check`): `5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 0 violation(s)`.

## Decisions Made

See `key-decisions` in the frontmatter. The one with the longest reach is the naming of `ensureProject`'s created project: because the method lives on the dev-seed base class and can create any project, it names the row `Project <uuid>` rather than claiming the row is the E2E one. A later caller creating a second project therefore gets an honest name for free.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A `quotes` lint error only the full chain sees**

- **Found during:** the plan-level `TURBO_FORCE=true yarn lint:check` gate.
- **Issue:** the collision throw contained a template literal with no interpolation (it held `session's`, so the apostrophe had pushed it into backticks). `packages/dev-seed/src/supabaseAdminClient.ts:74 error Strings must use singlequote`. Three targeted vitest runs and `typecheck:tests` were all green with it present — the same class `161-04` recorded.
- **Fix:** the segment became a double-quoted string, the form the rule accepts for a string containing an apostrophe.
- **Verification:** `TURBO_FORCE=true yarn lint:check` — dev-seed lint 0 errors on the re-run; the resolver's 15 tests still pass.
- **Committed in:** `c260a285a`

**2. [Rule 1 - Bug] 61 comment-hygiene violations, all of them mine**

- **Found during:** the same gate, one link further along.
- **Issue:** `scripts/assert-comment-hygiene.mjs` rule 2 forbids a comment line that ends without terminal punctuation when the line under it continues the same comment at the same indent. Every multi-line comment this plan wrote violated it — 61 across all seven touched files. The surrounding files already write one long line per paragraph; the guard is what enforces that.
- **Fix:** every comment added by this plan reflowed to one line per paragraph, then Prettier re-applied to the test file.
- **Verification:** `node scripts/assert-comment-hygiene.mjs` — exit 0, 0 violations over 1655 files, down from 61 over the same 1655. All task acceptance criteria re-run afterwards and still pass.
- **Committed in:** `c260a285a`

### Measured corrections to filed documents

Each is a place a document disagreed with the live tree. The measurement was taken as authoritative in every case, and the invariant the document was reaching for was satisfied rather than the number being manufactured.

- **DR-4's central premise is stale: the `app_settings` cascade gap is CLOSED.** The plan states that twelve of thirteen `project_id` foreign keys carry `ON DELETE CASCADE` and that `app_settings` does not, citing `apps/supabase/supabase/schema/106-app-settings.sql:8` and `apps/supabase/supabase/migrations/00001_initial_schema.sql:916`. Measured at HEAD: **13 of 13 carry the cascade in both trees**, and the two sites are at **`106-app-settings.sql:7`** and **`00001_initial_schema.sql:934`**, both reading

  ```sql
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,
  ```

  Task 3's branch A therefore applies: the cascade todo was **deliberately not filed**. Filing a register entry for something already fixed is the stale-register class this milestone exists to close. This phase's teardown posture never depended on the gap either way — it does not delete the project row.

- **Task 3's verify command cannot match the tree it inspects.** Its regex is `REFERENCES public\.projects\(id\)[^,]*ON DELETE CASCADE`; the tree is sqlfluff-formatted as `public.projects (id)`, with a space. Run verbatim it evaluates `cascaded = false`, and since `filed = false` it reports **"cascade is absent and no todo was filed"** and exits 1 — which would have pressured the executor into filing a todo for a gap that does not exist. The instrument was corrected to `public\.projects\s*\(id\)`, and proven non-vacuous in both directions before being trusted (true on the real file, false on a cascade-stripped copy). With the correction the plan's own verify passes: `probe re-aim ok; cascade closed upstream, not filed`.

- **Task 3's `grep -c "E2E_REQUIRE_FRESH_DB" … returns 1` was already false before this plan touched the file.** The raw count is **3** — a docblock mention, the live read, and a call-site comment — and it was 3 at `HEAD~2` as well. The invariant the criterion reaches for holds exactly: the **comment-filtered** count is **1**, before and after, and `requireFresh` still gates a `throw` with `console.warn` as the default. The code was not bent to reach the number 1.

- **Task 2's acceptance criterion names artefacts the script does not produce.** It asks that the smoke run's `provenance.txt` record `preflight-fail: 0`. `e2e-run.sh` writes no `provenance.txt` and no `preflight-fail` key; the equivalent evidence is the file **`preflight-failures`** containing `0`, alongside `preflight-successes` containing `1` and `exit` containing `0`. All three were checked, for all three smoke runs.

- **`tests/global-setup.ts` is 31 lines, not the 53 the plan and `161-PATTERNS.md` § 13 both state**, and `e2e-run.sh`'s cited line ranges (`:110-153`, `:274-280`, `:353`) no longer locate the described code. Both files were read in full and edited by content anchor. The described *shapes* were accurate in every case.

- **`.env.example` needed no edit.** Task 1 item (4) asks the executor to comment out the `E2E_PROJECT_ID` line if `161-01` wrote it live. Measured: `161-01` had already written it commented out, with the two-loader rationale in place. `git show HEAD:.env.example | grep -E '^#\s*E2E_PROJECT_ID='` matched before any change here. No correction was needed and none was made.

---

**Total deviations:** 2 auto-fixed (both bugs, both surfaced only by the full `lint:check` chain), plus 6 measured document corrections.
**Impact on plan:** no stated behaviour was dropped and no scope added. The correction that carries weight downstream is the cascade measurement — plan `161-07` and any later reader should not expect `2026-08-28-app-settings-fk-missing-on-delete-cascade.md` to exist, because the gap it would have described is closed.

## Issues Encountered

- **A smoke run was raced by a live edit and failed spuriously.** The first `--no-db-reset` smoke ran while task 3's probe edit was half-applied — the `BASELINE_SEED_PREFIX` constant had been deleted but its two usages had not — and Playwright reported `ReferenceError: BASELINE_SEED_PREFIX is not defined`, 1 failed / 16 skipped. Not a defect in anything committed: the run observed a working tree that existed for about ninety seconds. Re-run after the edit completed: 18/18, exit 0. The lesson is narrow and worth keeping — do not start a background suite run and then keep editing the files it is about to load.
- **`yarn lint:check` again caught what four green runs did not.** Two vitest runs, a full dev-seed suite and `typecheck:tests` were all green while a `quotes` error and 61 hygiene violations sat in the tree. It is the slowest gate and the only one that sees them. Run in the background with a polled exit file, as `161-04` recommended; that worked and cost nothing.
- **The `E2E_PROJECT_ID` env var is now read by two independent resolvers** — `resolveE2eProjectId()` in TypeScript and `read_env_var E2E_PROJECT_ID` in `e2e-run.sh` — each with its own copy of the committed default. They agree today and a mismatch would be silent. Not fixed here (the shell cannot import the constant); noted for `161-07`, whose runs are the thing that would expose a divergence.

## User Setup Required

None. This plan adds no dependency, no external service and no required environment variable. `E2E_PROJECT_ID` is an optional override whose `.env.example` line is deliberately commented out; the committed default makes the harness correct with no configuration.

## Next Phase Readiness

- **Criterion 3's mechanism is in place and exercised.** The suite owns its project, creates it idempotently after the preflight, seeds and reads only inside it, points the dev server at it, and `--no-db-reset` removes the reset from the run's preconditions while still guaranteeing Supabase is up.
- **What plan `161-07` inherits, concretely:** `tests/scripts/e2e-run.sh --run-dir <dir> --no-db-reset` is the invocation for both of its runs. Its `env-posture.txt` will record `db_reset=false` and `e2e_project_id`, and its `preflight-failures` / `preflight-successes` / `exit` files are the verdict triple. Two consecutive no-reset runs of a single project family are already green at this HEAD; the full suite is `161-07`'s to prove.
- **What `161-07` should watch.** All test families still share the one E2E project, so cross-family residue from an aborted run is still possible and would surface as the probe's warning. Zero warnings across both of its runs is also the evidence prerequisite named in the freshness-probe promotion todo, so record it either way.
- **Open, deliberately:** the probe's polarity is not promoted (filed, with its prerequisite), and the two `E2E_PROJECT_ID` resolvers are not unified.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-04*

## Self-Check: PASSED

All 8 created/modified files present on disk. All 6 commits (`e00a2ae3d`, `8d4430dbb`, `2e7b4478b`, `452eaef3f`, `c260a285a`, `4b962ca1e`) resolve in `git log --all`. The conditionally-forbidden artefact `.planning/todos/pending/2026-08-28-app-settings-fk-missing-on-delete-cascade.md` is confirmed absent, which is the branch the cascade measurement requires.
