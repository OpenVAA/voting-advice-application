---
phase: 136-real-guards-visual-repair-sweep-remediation
plan: 03
subsystem: testing
tags: [ci, github-actions, playwright, vitest, dev-seed, supabase, guard-integrity]

# Dependency graph
requires:
  - phase: 135-close-phase-134-coverage-carry-overs
    provides: "The NF-01 operation budget (GUARD-03) whose CI execution this plan establishes"
  - phase: 119-e2e-fixtures-helpers-seed
    provides: "The four base/read-only probe specs (119-08) that this plan retires"
  - phase: 120-e2e-specs-settings-permutation-matrix
    provides: "The `_probes` project + `--grep-invert @probe` default-suite exclusion (7f8441951)"
provides:
  - "A blocking `dev-seed-integration` CI job that actually executes the NF-01 operation budget"
  - "A loud-fail guard (DEV_SEED_INTEGRATION_REQUIRED) making the CI wiring non-silently-revertible"
  - "Removal of 4 orphaned probe specs (6 tests reachable from no command since Phase 119)"
  - "An orphan-probe guard in playwright.config.ts enforcing the enumerated-testMatch invariant"
  - "A corrected GUARD-03 record in REQUIREMENTS.md — it had narrated a local-only guard as if it protected main"
affects: [ci-pipeline, e2e-suite-maintenance, dev-seed, future-guard-audits]

actuals:
  tokens: 10771
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Guard-of-the-guard: an env flag asserting a test is REQUIRED to execute here, so losing the wiring is a red build rather than a green skip"
    - "Config-load enumeration check: where a testMatch lists files by name, assert the directory contains no file outside the list"

key-files:
  created: []
  modified:
    - .github/workflows/main.yaml
    - packages/dev-seed/tests/integration/default-template.integration.test.ts
    - tests/playwright.config.ts
    - tests/tests/specs/_probes/numberScale.probe.spec.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Wired the op budget into CI rather than narrowing GUARD-03 — the cost is runner minutes, not critical-path wall clock, because e2e-tests already does a strict superset of the setup"
  - "Dedicated job, not a step in e2e-tests: the test writes 327 `seed_` candidates that would contaminate the e2e/base dataset, and appending it after test:e2e would let a red E2E run mask a seed-path regression"
  - "No paths-filter on the new job — the guarded surface spans dev-seed, supabase-types, apps/supabase's schema and the core/matching/app-shared chain, so an honest filter covers most of the repo; and a conditional guard is how F5 happened"
  - "Deleted the four orphaned probes rather than wiring them: every fixture method they smoke-tested is now covered by a spec in the blocking default suite, in each case at least as strongly"
  - "Added guards for both defect CLASSES (loud-fail env flag; orphan-probe config check), not just the two instances"

patterns-established:
  - "Reproduce-then-fix for CI-only defects: move the repo-root .env aside to recreate CI conditions locally, and prove the green skip before claiming the fix"
  - "A deletion rationale grounded in method-level supersession (grep each fixture method against shipped specs) rather than in a pass/fail run"

requirements-completed: [REAL-03]

coverage:
  - id: D1
    description: "The Phase-135 NF-01 operation budget executes in CI via a blocking `dev-seed-integration` job instead of skipping green"
    requirement: REAL-03
    verification:
      - kind: integration
        ref: "packages/dev-seed/tests/integration/default-template.integration.test.ts#applies default template and meets the NF-01 operation budget + D-58-20 assertions (simulated job: root .env moved aside, env from `supabase status -o env`)"
        status: pass
    human_judgment: true
    rationale: "GitHub Actions cannot be executed from this environment. The job was proven structurally (skip condition + the step that satisfies it) and by local simulation under CI conditions, but the first real CI run is the only thing that confirms runner-side behaviour (supabase/setup-cli version drift, `supabase status -o env` key names on the `latest` CLI)."
  - id: D2
    description: "The loud-fail guard turns a lost Supabase wiring into a red build rather than a silent green skip"
    requirement: REAL-03
    verification:
      - kind: integration
        ref: "DEV_SEED_INTEGRATION_REQUIRED=1 with root .env moved aside -> `Test Files 1 failed | 41 passed (42)`"
        status: pass
    human_judgment: false
  - id: D3
    description: "The four orphaned probe specs are gone; no test file in the tree matches no runner"
    requirement: REAL-03
    verification:
      - kind: e2e
        ref: "npx playwright test -c ./tests/playwright.config.ts ./tests --list -> Total: 142 tests in 93 files (unchanged), plus per-entry-point counts"
        status: pass
    human_judgment: false
  - id: D4
    description: "An orphan-probe guard in playwright.config.ts prevents F4 from recurring"
    requirement: REAL-03
    verification:
      - kind: e2e
        ref: "negative control: planted scratchOrphan.probe.spec.ts -> config throws by name; removed -> Total: 142 restored"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-08-11
status: complete
---

# Phase 136 Plan 03: F5 CI wiring + F4 orphaned probe specs Summary

**The NF-01 operation budget now runs in CI in a dedicated Supabase-backed job (it previously skipped green on every run and executed locally only by accident of a `loadEnvFile` side effect), and the four probe specs that matched no Playwright project are deleted with their invariant made machine-checked.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-08-11T21:11:00+03:00
- **Completed:** 2026-08-11T21:33:00+03:00
- **Tasks:** 2
- **Files modified:** 5 (+ 4 deleted)

## Accomplishments

- **F5 resolved by wiring, not by narrowing the claim.** A new blocking `dev-seed-integration` job starts Supabase, exports `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` off the running instance, and runs the dev-seed suite — so the Phase-135 operation budget executes in CI for the first time.
- **Found and documented the real reason it "worked locally".** The guard was not merely unwired in CI; it ran on developer machines by accident. `packages/dev-seed/src`'s barrel re-exports `cli/teardown`, whose module scope calls `process.loadEnvFile('<repo-root>/.env')`. ESM evaluates that import before the test module body, so `SUPABASE_URL` is populated before `hasSupabase` is computed. Nobody chose that; it is why the gap survived Phase 135's own verification.
- **F5 reproduced under CI conditions before fixing it** — root `.env` moved aside: `↓ default-template.integration.test.ts (1 test | 1 skipped)`, `Test Files 41 passed | 1 skipped (42)`, **EXIT=0**. A green build with the guard absent.
- **The wiring is itself guarded.** `DEV_SEED_INTEGRATION_REQUIRED=1` in the job + a module-scope throw in the test means removing the env turns CI red instead of reverting to a silent skip.
- **F4 resolved by deletion with a supersession argument**, not a pass/fail run: every fixture method the four probes smoke-tested is exercised by a spec in the blocking default suite, in each case at least as strongly.
- **The `_probes` enumerated-testMatch invariant is now machine-checked** — a probe file not listed in the pattern fails config load by name.

## Task Commits

1. **Task 1: Make the op-budget run in CI** — `118de4c54` (ci)
2. **Task 2: Resolve the four orphaned probe specs** — `6c9ddfb55` (test)

## Task 1 — evidence that the budget now executes in CI

### The skip condition, and the step that satisfies it

`packages/dev-seed/tests/integration/default-template.integration.test.ts`:

```ts
const hasSupabase = Boolean(process.env.SUPABASE_URL);
...
describe.skipIf(!hasSupabase)('default template integration (DX-03)', () => {
```

The new job in `.github/workflows/main.yaml` provides exactly that variable, read off the running instance rather than hard-coded:

```yaml
      - name: "Start Supabase"
        working-directory: apps/supabase
        run: supabase start

      - name: "Export Supabase connection env"
        working-directory: apps/supabase
        run: |
          STATUS="$(supabase status -o env)"
          API_URL="$(printf '%s\n' "$STATUS" | grep '^API_URL=' | cut -d= -f2- | tr -d '"')"
          SERVICE_ROLE_KEY="$(printf '%s\n' "$STATUS" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')"
          test -n "$API_URL" || { echo "::error::API_URL missing from supabase status"; exit 1; }
          test -n "$SERVICE_ROLE_KEY" || { echo "::error::SERVICE_ROLE_KEY missing from supabase status"; exit 1; }
          echo "SUPABASE_URL=$API_URL" >> "$GITHUB_ENV"
          echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> "$GITHUB_ENV"

      - name: "Run dev-seed tests (incl. the NF-01 operation budget)"
        run: yarn workspace @openvaa/dev-seed test:unit
```

With `SUPABASE_URL` set, `skipIf(!hasSupabase)` is `skipIf(false)` — the describe executes.

The `supabase status -o env` variable names were verified against the local CLI (v2.83): `API_URL` and `SERVICE_ROLE_KEY` both present; the extraction snippet was run locally and returned `API_URL=http://127.0.0.1:54321` and a 164-char `SERVICE_ROLE_KEY`. Reading the keys off the instance (rather than hard-coding the demo JWT) is deliberate: the CLI has been migrating to `sb_secret_…`-style keys, and a hard-coded legacy key would fail as a confusing authorization error on a future CLI.

### Measured, not asserted from structure alone

Since GitHub Actions cannot be run here, the job was simulated locally under CI conditions — repo-root `.env` moved aside so the `loadEnvFile` side effect cannot fire, env supplied exactly as the job supplies it:

| Run | Condition | Result |
|---|---|---|
| **F5 repro** | no root `.env`, no flag (today's CI) | `1 skipped`; `Test Files 41 passed \| 1 skipped (42)`; **EXIT=0** |
| **Negative control** | no root `.env`, `DEV_SEED_INTEGRATION_REQUIRED=1` | `Test Files 1 failed \| 41 passed (42)` — guard fires by name |
| **Simulated job** | no root `.env`, `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `supabase status -o env`, flag set | **444/444, 0 skipped**; integration test **EXECUTES in 11570 ms**; `[NF-01] seed step elapsed: 8608 ms` |

The first row is the defect and the third is the fix, measured under the same conditions.

### Added CI time

- **Critical-path wall clock: no increase.** The job runs in parallel with `e2e-tests`, which performs a strict superset of its setup (same checkout / install / build / `supabase start`) *plus* a Playwright install and the full E2E suite.
- **Runner minutes: one additional runner, estimated ~5-8 min**, dominated by `supabase start` image pulls. The measured part is small: the whole dev-seed suite is **11.3-13.6 s** locally, of which the integration test is **~10-11.5 s**. The `supabase start` portion is an estimate by analogy with the existing `supabase-tests` / `e2e-tests` jobs — not measured here.
- The build step is narrowed to `yarn build --filter=@openvaa/dev-seed` (7 tasks — the dependency closure) rather than a full `yarn build`.

### GUARD-03's record

GUARD-03's **requirement text** is accurate as written (it asks for a load-independent assertion, and the operation budget is one), so it was not rewritten. What overclaimed was its **completion note**, which narrated negative controls and N+1 catches as though the guard were protecting `main`. A correction was appended recording that everything in it was true locally only, why (the `loadEnvFile` side effect), the reproduction, and the resolution.

## Task 2 — the four orphaned probe specs

### Intent established first

`7f8441951` (Phase 120) excluded `@probe` from the default suite **deliberately** — but the commit message scopes that to "the 4 deferred probes [that] need out-of-band per-probe seeding". The four base/read-only probes (`entityFilters`, `navMenu`, `theme`, `trackingIntercept`, added in `7d4002333` / Phase 119-08 and never touched since) were simply left out of the `_probes` project's enumerated `testMatch`. Their own headers document a RUN command that does not work:

```
$ npx playwright test tests/tests/specs/_probes/entityFilters.probe.spec.ts -c tests/playwright.config.ts --list
Error: No tests found.
```

So the non-run was **not** intentional — the exclusion rationale in the config ("so a project run never serially clobbers the singleton") does not apply to probes that read the base dataset and touch no `app_settings` singleton.

### Deleted, because every behaviour is superseded

All four were fixture-development scaffolding for specs that have since shipped. Each fixture method they exercised was grepped against the shipped specs:

| Probe surface | Now covered by (runs in blocking default suite) | Relative strength |
|---|---|---|
| `selectAll` / `selectNone` | `voter-journey.spec.ts` | Stronger — exact **13 / 0 / 13** card counts on a **named** filter (`getFilter(/Party/i)`), plus the toggle-absent negative case on the ≤3-option filter. Probe: `toBeVisible()` on an **index-picked** first row. |
| `openMobileNav`, `items()`, `expectNavMenuItems` | `candidate-journey.spec.ts`, `voter-journey-mobile.spec.ts`, 2 perm specs | Stronger — **exact ordered 10-item list**, asserted logged-out *and* logged-in, plus an inequality check between the two sets. Probe: "one Home item exists" + first item's accessible name. |
| `setColorScheme`, `expectTheme` | `voter-dark-mode.spec.ts` | Superset — the probe's three steps **verbatim**, plus an extra reload on the light flip. |
| `getTrackCalls` | `voter-prefs-tracking.spec.ts` | Stronger — emit driven through the **real in-app consent path**, which the probe's own header documented itself as unable to arm. |

The `trackingIntercept` probe deserves a specific note: its "capture seam" test called `window.umami.track(...)` from `page.evaluate` and asserted the stub had recorded it — i.e. it tested the test harness, not the app. Under this phase's own criteria that is not a guard.

No fixture becomes dead code: all four fixtures retain live consumers.

### Counts — before and after

| Entry point | Before | After |
|---|---|---|
| `npx playwright test -c ./tests/playwright.config.ts ./tests --list` | **142 tests / 93 files** | **142 tests / 93 files** |
| `yarn test:e2e` (`--grep-invert @probe`) | **134 tests / 88 files** | **134 tests / 88 files** |
| `yarn test:e2e:probes` (`--project=_probes`) | **8 tests / 5 files** | **8 tests / 5 files** |

**Every count is unchanged, and that is the proof.** Deleting 4 files containing 6 tests removed nothing from any runner, because those 6 tests were in no runner's total to begin with. The default `yarn test:e2e` count was deliberately **not** changed.

### The invariant is now checked, not commented

`_probes` is the one project whose `testMatch` enumerates files by name (deliberately — probes must be invocable one at a time). The cost is that adding a file without adding it to the pattern silently produces an unreachable test. A comment asking authors to keep the list in sync would be the same kind of non-guard this phase exists to remove, so `tests/playwright.config.ts` now reads the directory at config load and throws by name on any `*.probe.spec.ts` outside `PROBE_TEST_MATCH`.

Negative control (planted a scratch orphan):

```
Error: Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project and run
from NO command: scratchOrphan.probe.spec.ts. Add each to the `_probes` project's testMatch
(PROBE_TEST_MATCH in this file), or delete the file. ...
```

Removing the planted file restored `Total: 142 tests in 93 files`.

## Files Created/Modified

- `.github/workflows/main.yaml` — new blocking `dev-seed-integration` job (10 steps) with a comment block recording why it is a separate job and why it carries no paths-filter
- `packages/dev-seed/tests/integration/default-template.integration.test.ts` — header now states where this runs in CI; module-scope loud-fail guard on `DEV_SEED_INTEGRATION_REQUIRED`
- `tests/playwright.config.ts` — hoisted `PROBE_TEST_MATCH`, added the orphan-probe guard, rewrote the stale `_probes` comment
- `tests/tests/specs/_probes/numberScale.probe.spec.ts` — "Probe convention" pointer redirected from the deleted `entityFilters.probe.spec.ts` to `video.probe.spec.ts`
- `.planning/REQUIREMENTS.md` — correction appended to GUARD-03's completion note
- **Deleted:** `tests/tests/specs/_probes/{entityFilters,navMenu,theme,trackingIntercept}.probe.spec.ts`

## Decisions Made

- **Wire it in rather than narrow GUARD-03.** The plan permitted correcting the requirement text if the cost were disproportionate. It is not: the job is off the critical path because `e2e-tests` is strictly longer, so the cost is runner minutes for a guard that protects the seed write path on every push.
- **Dedicated job over a step in `e2e-tests`.** Reusing the E2E job's Supabase would have been cheaper in runner minutes, but this test writes 327 `seed_` candidates that would contaminate the `e2e/base` dataset the suite asserts against. Placing it *after* `yarn test:e2e` avoids that but couples the guard to E2E being green — a red E2E run would then mask a seed-path regression.
- **No `paths-filter`** (unlike `supabase-tests`). The guarded surface spans dev-seed, supabase-types, `apps/supabase`'s schema and the core/matching/app-shared chain the latent answer model uses, so an honest filter would cover most of the repo — and a conditionally-running guard is the shape of the defect being fixed.
- **Keys read from `supabase status -o env`**, not hard-coded demo keys, so local-key-format drift in the CLI cannot turn into a confusing auth failure.
- **Delete the probes rather than wire them.** Wiring would have added 6 tests duplicating covered surface with weaker assertions, on a command nobody runs.
- **Did not run the four probes before deleting them.** Stated plainly because the plan asked for a run if they were wired: they matched no project, so running them would have required wiring them first, and the deletion rationale is supersession — which does not depend on their pass state. A probe that passed would still be a weaker duplicate of a spec that runs on every push.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Loud-fail guard on the CI wiring**

- **Found during:** Task 1
- **Issue:** Wiring the job satisfies the plan literally, but leaves the fix silently revertible — a future edit renaming or dropping the env export returns the file to a green skip, recreating F5 exactly. A fix to a "guard that doesn't run" that can itself stop running without noise is not a fix.
- **Fix:** The job sets `DEV_SEED_INTEGRATION_REQUIRED=1`; the test throws at module scope if that is set while `SUPABASE_URL` is not. Deliberately **not** keyed on `CI === 'true'`, because `frontend-and-shared-module-validation` legitimately runs `yarn test:unit` without Supabase and must keep skipping rather than failing.
- **Files modified:** `packages/dev-seed/tests/integration/default-template.integration.test.ts`, `.github/workflows/main.yaml`
- **Verification:** Negative control — no root `.env` + flag set → `Test Files 1 failed | 41 passed (42)`, error text quoted above.
- **Committed in:** `118de4c54`

**2. [Rule 2 - Missing Critical] Orphan-probe guard in playwright.config.ts**

- **Found during:** Task 2
- **Issue:** Deleting the four files closes the instance but not the class. The enumerated `testMatch` will silently orphan the next probe file the same way; the plan's own must-have truth is "no test file sits in the tree matching no runner".
- **Fix:** Config-load check over `tests/specs/_probes` against the hoisted `PROBE_TEST_MATCH`; throws by name listing the offending files.
- **Files modified:** `tests/playwright.config.ts`
- **Verification:** Negative control with a planted orphan (fires), then removal (clears, `Total: 142` restored). `typecheck:tests` exit 0.
- **Committed in:** `6c9ddfb55`

**3. [Rule 2 - Record accuracy] Corrected GUARD-03's completion note**

- **Found during:** Task 1
- **Issue:** The plan offered correcting GUARD-03's text *as an alternative* to wiring. Wiring alone would still leave a historical record claiming the guard had been protecting `main` since Phase 135, which it had not.
- **Fix:** Appended a correction to GUARD-03's completion note in `.planning/REQUIREMENTS.md` recording the local-only scope, the `loadEnvFile` mechanism, the reproduction, and the resolution.
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Committed in:** `118de4c54`

---

**Total deviations:** 3 auto-fixed (2 missing-critical guards, 1 record correction)
**Impact on plan:** Both added guards close the defect *class* the plan's must-have truths name, at ~35 lines total. No scope creep — nothing outside CI config, the one test file, the Playwright config, and the requirement record was touched.

## Issues Encountered

- **`git add` aborted the intended Task-2 staging.** The four probe paths were already staged as deletions by `git rm`, so `git add` on those pathspecs failed with `fatal: pathspec ... did not match any files` and staged nothing — the commit landed with only the deletions. Caught immediately by reading the commit's file list (`4 files changed`, no config file), fixed with `git commit --amend` after staging the two remaining files. Final commit `6c9ddfb55` = 6 files.
- **The "does it run locally?" question was initially confusing** — the integration test executed with no `SUPABASE_URL` in the shell, while a scratch probe test printed `process.env.SUPABASE_URL=undefined`. Resolved by finding the barrel's `cli/teardown` → `process.loadEnvFile` side effect, which only fires for modules that import the barrel. This is what made F5 invisible to Phase 135.

## Verification Commands Run

| Command | Result |
|---|---|
| `yarn workspace @openvaa/dev-seed test:unit` (simulated job env, no root `.env`) | 444/444, integration EXECUTES 11570 ms |
| same, no flag, no root `.env` (F5 repro) | 443 passed, **1 skipped**, EXIT=0 |
| same, flag set, no root `.env` (negative control) | `Test Files 1 failed \| 41 passed` |
| `yarn build --filter=@openvaa/dev-seed` | 7 tasks successful |
| `npx playwright test ... --list` (3 entry points) | 142/93, 134/88, 8/5 — all unchanged |
| orphan guard negative control | throws by name; clears on removal |
| `yarn typecheck:tests` | exit 0 |
| `yarn format:check` | exit 0 — "All matched files use Prettier code style!" |
| `yarn lint:check` | exit 0 — 2 pre-existing warnings in untouched files (`candidate-bank-auth-journey.spec.ts:208`, `mockOidcIssuerEntry.ts:33`) |
| `yarn db:seed:teardown` | 751 rows + 327 storage objects removed — local DB restored after 3 integration runs |

Working tree: only `supabase/.temp/cli-latest` dirty, as permitted.

## Limits Stated Rather Than Absorbed

1. **The first real CI run is still the confirmation.** GitHub Actions cannot be executed here. The evidence is structural (skip condition + the step that satisfies it) plus a local simulation under CI conditions. Two runner-side unknowns remain: `supabase/setup-cli@v1` with `version: latest` installs a newer CLI than the local v2.83, so `supabase status -o env` key names and `supabase start` behaviour are assumed-stable, not observed. Both failure modes are loud (the `test -n` assertions `::error::` out; the loud-fail guard reds the build) rather than silent, which is the property that matters.
2. **The `supabase start` share of the added CI minutes is an estimate**, by analogy with the existing `supabase-tests` / `e2e-tests` jobs. Only the test's own ~10-11.5 s is measured.
3. **`REAL-03` was left unchecked in `.planning/REQUIREMENTS.md`** — the orchestrator owns that checkbox and the traceability row. Only GUARD-03's completion note was edited, per the plan's explicit narrow permission.
4. **The full E2E suite was not run.** This plan touched no application code and no spec that runs in the default suite; the three `--list` counts prove the default suite's composition is byte-identical. A full run would confirm nothing this change could have broken.

## Next Phase Readiness

- F5 and F4 are closed. The two remaining sweep findings owned by this phase's other plans are unaffected by these changes.
- The `dev-seed-integration` job will appear as a new required check on the next PR — worth watching on its first run for the two runner-side unknowns above.

## Self-Check: PASSED

Files:
- FOUND: `.github/workflows/main.yaml` (job `dev-seed-integration` parses; 10 steps)
- FOUND: `packages/dev-seed/tests/integration/default-template.integration.test.ts`
- FOUND: `tests/playwright.config.ts`
- FOUND: `tests/tests/specs/_probes/numberScale.probe.spec.ts`
- CONFIRMED DELETED: `tests/tests/specs/_probes/{entityFilters,navMenu,theme,trackingIntercept}.probe.spec.ts`

Commits:
- FOUND: `118de4c54` ci(136-03): run the NF-01 op budget in CI (F5)
- FOUND: `6c9ddfb55` test(136-03): delete 4 orphaned probe specs + guard the invariant (F4)

---
*Phase: 136-real-guards-visual-repair-sweep-remediation*
*Completed: 2026-08-11*
