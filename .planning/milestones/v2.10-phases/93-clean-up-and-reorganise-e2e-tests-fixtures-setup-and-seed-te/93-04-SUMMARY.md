---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
plan: 04
subsystem: e2e-testing
tags: [playwright, setup, project-graph, relocation, rename, merge, role-based-taxonomy]

# Dependency graph
requires:
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 02
    provides: "canonical e2e/base seed family + retired bare-e2e template + e2e/perm/*"
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 03
    provides: "role-based fixture taxonomy + candidateJourneyConstants rename + voterJourneyTest export"
provides:
  - "Role-based setup taxonomy: setup/shared/ + setup/candidate/ + setup/perm/ + setup/voter/"
  - "Single merged base seeding chain (data-setup-base/data-teardown-base) — data-setup/data-teardown eliminated"
  - "Base chain DECOUPLED from the perm anchor (FLAG-6) — opt-in-only runs work standalone"
  - "Rewritten playwright.config project graph: data-setup-base, voter-journey, data-setup-candidate-journey, candidate-journey keys; zero mega/baseV1 tokens"
  - "Self-contained testCredentials.ts (no throwing e2eFixtureRefs dependency)"
affects:
  - "Plan 05 (spec FILE renames): voter-mega-journey.spec.ts -> voter-journey.spec.ts + candidate-mega-journey.spec.ts -> candidate-journey.spec.ts MUST land to un-orphan the voter-journey/candidate-journey project testMatch set here"
  - "Plan 07 (external_id prefix workstream): base.teardown.ts PREFIX='test-' left untouched; D-05 test-e2e-base- rename owned there"
  - "Follow-up opt-in/auth-chain plan: merged base (e2e/base) seeds no test-candidate-alpha + no candidate emails; auth-setup has no registered base candidate to log in as"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-based setup folder shape: setup/shared/ (cross-role infra) + setup/{voter,candidate,perm}/ (role-specific)"
    - "Single base chain merged from two seeding paths (D-06); opt-in projects repoint to the merged base"
    - "Perm-anchor decoupling: base seeds independently; cross-namespace isolation via the base setup's own extraTeardownPrefix pre-clear (not a graph dependency)"

key-files:
  created:
    - tests/tests/setup/voter/.gitkeep
  modified:
    - tests/tests/setup/shared/auth.setup.ts
    - tests/tests/setup/shared/setupFromTemplate.ts
    - tests/tests/setup/shared/base.setup.ts
    - tests/tests/setup/shared/base.teardown.ts
    - tests/tests/setup/candidate/candidate-journey.setup.ts
    - tests/tests/setup/candidate/candidate-journey.teardown.ts
    - tests/tests/setup/perm/ (22 perm-* pairs relocated + import-repointed)
    - tests/tests/utils/testCredentials.ts
    - tests/tests/utils/candidateJourneyConstants.ts
    - tests/playwright.config.ts
  deleted:
    - tests/tests/setup/data.setup.ts
    - tests/tests/setup/data.teardown.ts
    - tests/tests/utils/e2eFixtureRefs.ts
    - tests/debug-questions.ts
    - tests/debug-setup.ts

key-decisions:
  - "FLAG-6 decoupling expressed as a graph-dependency DROP (data-setup-base loses ['perm-not-located-2e2cg']) + retention of the base setup's own defensive extraTeardownPrefix: 'e2e-perm-' pre-clear (idempotent, separate namespace). Isolation moved off the base anchor onto the base setup itself per the plan's reason-note instruction."
  - "auth-setup now declared under PLAYWRIGHT_VISUAL alone (not all 4 opt-in flags) — only visual-regression consumes the candidate storageState; perf/a11y/bank-auth depend on data-setup-base directly, so gating auth-setup on all flags would orphan it under PERF/A11Y/BANK-only runs."
  - "Deleted e2eFixtureRefs.ts (and the 2 dead debug-*.ts scripts) outright rather than retargeting to base — its only real consumer (data.setup.ts) was deleted, and the alpha-email derivation cannot survive against the base dataset (base has no test-candidate-alpha + no candidate emails). testCredentials.ts self-contains the email literal instead."
  - "voter-journey/candidate-journey spec project testMatch set to the clean no-mega regex now, accepting a transient zero-match orphan of the still-mega-named spec files until Plan 05/06 renames them — forced by the mutually-exclusive D-09 zero-mega-token gate (a transitional /voter-mega-journey|voter-journey/ regex would contain 'mega' and fail the gate)."

requirements-completed: [WS2, D-06, D-07, D-08, D-10, D-11, FLAG-6, FLAG-8]

# Metrics
duration: ~50min
completed: 2026-06-03
---

# Phase 93 Plan 04: Workstream 2 — setup taxonomy + base merge + playwright graph rewrite Summary

**Reorganised `tests/setup/` into the role-based taxonomy (`shared/` + `candidate/` + `perm/` + `voter/`), MERGED the two base-seeding paths into one (`data-setup-base`/`data-teardown-base`, deleting the redundant `data-setup`/`data-teardown` chain + their files), DECOUPLED the merged base from the perm anchor (FLAG-6), renamed `baseV1.*`→`base.*` and `candidate-mega.*`→`candidate-journey.*`, and fully rewrote `playwright.config.ts` — project-key renames, `testMatch` for new subdir basenames, repointed dependency graph, and zero `mega`/`baseV1` tokens. `yarn typecheck:tests` + `playwright test --list` (82 tests/70 files) + `eslint` all green.**

## Performance

- **Duration:** ~50 min
- **Tasks:** 3
- **Files changed:** 64 (across 3 commits; 385 insertions / 740 deletions — net deletion from merging the duplicate seeding path + retiring dead inspection scripts)

## Accomplishments

**Task 1 — setup taxonomy + base/candidate-journey rename (`d1035ef93`):**
- `git mv` `auth.setup.ts` + `setupFromTemplate.ts` → `setup/shared/`; `baseV1.setup.ts`→`shared/base.setup.ts` (changed `setupFromTemplate('baseV1')`→`'e2e/base'`); `baseV1.teardown.ts`→`shared/base.teardown.ts` (PREFIX='test-' left for Plan 07).
- `candidate-mega.setup/teardown.ts`→`candidate/candidate-journey.*` (already importing `candidateJourneyConstants` from Plan 03; repointed `../utils`→`../../utils`, dropped `mega` comments).
- Relocated 22 `perm-*` setup/teardown pairs into `setup/perm/`; repointed their broken relative imports (`./setupFromTemplate`→`../shared/setupFromTemplate`, `../utils/*`→`../../utils/*`).
- `setup/voter/.gitkeep` (FLAG-8 — no voter-specific setup asset; keep the dir per D-07).
- Fixed `auth.setup.ts` `authFile` relative depth (`../../`→`../../../playwright/.auth/user.json`) after the move into `shared/`.

**Task 2 — base-chain merge + e2eFixtureRefs decouple (`9760472ba`, D-06):**
- DELETED `data.setup.ts` + `data.teardown.ts` (the old bare-`e2e` seeding path; `shared/base.setup.ts` is the single surviving seeding path via `e2e/base`).
- Confirmed `base.setup.ts` has no in-file perm import (decoupling is graph-level, applied in Task 3).
- DELETED `e2eFixtureRefs.ts` — its only real consumer (`data.setup.ts`) was gone, and it derived constants from the retired `BUILT_IN_TEMPLATES.e2e` (deleted in Plan 02), throwing at module load.
- Rewrote `testCredentials.ts` self-contained: `TEST_CANDIDATE_EMAIL` literal (`mock.candidate.2@openvaa.org`, its previously-resolved value) + `TEST_CANDIDATE_PASSWORD` — removing the throwing import that had broken the default-suite perm-* setups.
- DELETED dead `debug-questions.ts` + `debug-setup.ts` (developer inspection scripts for the retired e2e template; no script references).
- Updated stale `baseV1.ts`/`e2eFixtureRefs.ts` comment refs in `candidateJourneyConstants.ts` → `e2e/base`.

**Task 3 — playwright.config full rewrite (`a9b20222f`, D-08):**
- DELETED `data-setup` + `data-teardown` projects; renamed base chain `data-setup-baseV1`→`data-setup-base` (testMatch `/base\.setup\.ts/`), `data-teardown-baseV1`→`data-teardown-base`.
- DROPPED the `data-setup-base` perm anchor (FLAG-6) with an inline `// reason:` note; isolation now lives in the base setup's own `extraTeardownPrefix`.
- Renamed voter chain → `voter-journey` (testMatch `/voter-journey\.spec\.ts/`); candidate chain → `data-setup-candidate-journey`/`data-teardown-candidate-journey`/`candidate-journey`.
- D-06 dep repoints: `auth-setup`/`performance`/`a11y-smoke`/`bank-auth`→`['data-setup-base']`; `visual-regression`→`['data-setup-base','auth-setup']`; `auth-setup` gated under `PLAYWRIGHT_VISUAL` only.
- `data-setup-perm-disable-voter-app` dep `['candidate-mega-journey']`→`['candidate-journey']`.
- Removed all 37 `mega` + `baseV1` comment/JSDoc tokens → zero.

## Task Commits

1. **Task 1: setup taxonomy + base/candidate-journey rename** — `d1035ef93` (refactor)
2. **Task 2: base-chain merge + e2eFixtureRefs decouple** — `9760472ba` (refactor)
3. **Task 3: playwright.config project-graph rewrite** — `a9b20222f` (refactor)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Repointed broken relative imports in 22 relocated perm setup files**
- **Found during:** Task 1
- **Issue:** moving `perm-*.setup/teardown.ts` into `setup/perm/` broke their `./setupFromTemplate` (now `../shared/`) and `../utils/*` (now `../../utils/*`) imports — `yarn typecheck:tests` went RED with ~44 TS2307 errors.
- **Fix:** sed-repointed both import patterns across all perm files; eslint `--fix` resolved the resulting `simple-import-sort/imports` ordering errors (3 files).
- **Files modified:** all `tests/tests/setup/perm/*.ts`
- **Commit:** `d1035ef93`

**2. [Rule 3 - Blocking issue] Decoupled testCredentials.ts from the throwing e2eFixtureRefs module**
- **Found during:** Task 2
- **Issue:** `e2eFixtureRefs.ts` derives `TEST_CANDIDATE_ALPHA_EMAIL` via a module-load IIFE reading `BUILT_IN_TEMPLATES.e2e` — which Plan 02 (D-01) retired (`undefined`), so the IIFE threw. `testCredentials.ts` re-exported that value, so any importer crashed at module load — including the DEFAULT-suite perm-* setups (`perm-answers-locked`, `perm-hide-hero`, `perm-disable-allow-open`), which actually only need the `TEST_CANDIDATE_PASSWORD` literal. This was the latent D-06 breakage Plan 02 explicitly deferred to this plan.
- **Fix:** rewrote `testCredentials.ts` to self-contain `TEST_CANDIDATE_EMAIL` as a literal + deleted the now-dead `e2eFixtureRefs.ts` (only consumer was the deleted `data.setup.ts`) and its 2 dead debug scripts.
- **Files modified:** `tests/tests/utils/testCredentials.ts`; deleted `e2eFixtureRefs.ts`, `debug-questions.ts`, `debug-setup.ts`
- **Commit:** `9760472ba`

### Deferred (architectural — out of this plan's gated scope)

**Opt-in/auth-chain base-candidate contract (D-06 / FLAG-6 consequence):** the merged base dataset (`e2e/base`) does NOT seed a `test-candidate-alpha` row, and base candidates carry no email column (Phase 89 Wave-0 R8: candidates table has no email). The opt-in `auth-setup` project (consumed by `visual-regression`) logs in as `TEST_CANDIDATE_EMAIL` and therefore has no registered base candidate to authenticate against. The dependency repoint to `data-setup-base` keeps the project graph resolving (and these projects are env-gated, excluded from the default `yarn test:e2e`), but a FOLLOW-UP plan rewiring the opt-in/auth chain against base must establish a registered base-candidate + email (`forceRegister`) contract before the visual opt-in run can pass. This is documented inline in `testCredentials.ts` and `playwright.config.ts`. The research premise ("RESEARCH expects none unique") underestimated this; surfaced here per the plan's "surface as a deviation" instruction.

**Transient spec orphan (D-09 vs no-orphan tension):** the `voter-journey`/`candidate-journey` spec projects' `testMatch` was set to the clean no-`mega` regex now (per the plan's explicit per-chain instruction + the hard D-09 zero-`mega`-token gate). The still-`mega`-named spec FILES (`voter-mega-journey.spec.ts`, `candidate-mega-journey.spec.ts`, renamed by Plan 05/06) therefore match zero tests until those renames land — `--list` enumerates 82 tests/70 files vs the baseline 84/72 (exactly the 2 journey specs). A transitional `/(voter-mega-journey|voter-journey)/` regex would have kept them enumerated but contains `mega` and would fail the zero-token gate, so the two requirements are mutually exclusive within this plan; the gate wins per the plan's per-chain instructions.

## Threat Surface

No production attack surface — test setup + playwright config relocation only (matches the plan's threat register: T-93-04 accept). No new endpoints, auth logic, file-access, or schema changes.

## Verification

- `yarn typecheck:tests` — exits 0 after each task and at plan close.
- `npx playwright test --list -c tests/playwright.config.ts` — exits 0 (graph resolves); 82 tests in 70 files; no stale dependency references to deleted projects; all required keys (`data-setup-base`, `data-teardown-base`, `voter-journey`, `data-setup-candidate-journey`, `candidate-journey`) present.
- `grep -nE "mega|baseV1" tests/playwright.config.ts` — empty (zero tokens, D-09/D-10).
- `eslint --flag v10_config_lookup_from_file tests/tests/setup tests/tests/utils` — exits 0.
- `setup/` split into `shared/` + `candidate/` + `perm/` (22 pairs = 44 files) + `voter/` per D-07.

## Self-Check: PASSED

All claimed created/modified files exist on disk; deleted files confirmed absent; all 3 task commits present in git history (verified below).

---
*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Completed: 2026-06-03*
