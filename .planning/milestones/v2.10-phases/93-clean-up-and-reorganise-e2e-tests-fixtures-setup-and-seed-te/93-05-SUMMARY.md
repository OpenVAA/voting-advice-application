---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
plan: 05
subsystem: e2e-testing
tags: [playwright, specs, rename, a11y, docs, zero-token-proof, role-based-taxonomy]

# Dependency graph
requires:
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 03
    provides: "role-based fixture taxonomy + voterJourneyTest symbol + candidate-journey.ts/candidateJourneyConstants rename"
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 04
    provides: "playwright graph rewrite (voter-journey/candidate-journey testMatch regexes) + orphaned-spec note"
provides:
  - "Journey specs renamed voter-journey.spec.ts / candidate-journey.spec.ts (re-attach the orphaned testMatch set from Plan 04)"
  - "Playwright list restored to the Wave 1 baseline (84 tests / 72 files)"
  - "a11y-smoke comment refs aligned to the base voter-journey fixture (imports already repointed in Plan 03)"
  - "tests/README.md fully rewritten to the new project graph (data-setup-base + voter-journey/candidate-journey + perm-* + opt-in families)"
  - "CLAUDE.md --template e2e -> --template e2e/base"
  - "ZERO mega/baseV1 tokens across tests/ + packages/dev-seed/src/ (D-09 gate met)"
affects:
  - "Plan 07 (external_id prefix workstream): base.teardown.ts PREFIX='test-' + the D-05 test-e2e-base- rename still owned there; this plan renamed the single test-app-settings-baseV1 external_id literal -> test-app-settings-base as a zero-token side-effect"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zero-token gate: grep -rn 'mega|baseV1' across tests/ + dev-seed/src/ as the hard D-09 acceptance proof"
    - "Doc-as-graph-mirror: tests/README.md project inventory regenerated from the live playwright.config.ts after a structural rewrite"

key-files:
  created:
    - .planning/phases/93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te/93-05-SUMMARY.md
  modified:
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/specs/voter/voter-journey.README.md
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/candidate/candidate-journey.README.md
    - tests/tests/specs/visual/visual-regression.spec.ts
    - tests/tests/specs/perf/performance-budget.spec.ts
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/tests/specs/perm/ (perm-hide-category-tags, perm-hide-election-tags, perm-disable-allow-open, perm-hide-if-missing-answers, perm-localisation-positive)
    - tests/README.md
    - CLAUDE.md
    - tests/tests/fixtures/candidate/candidate-journey.ts
    - packages/dev-seed/src/templates/e2e/base.ts
    - tests/tests/setup/ (candidate-journey + 6 perm + shared base/setupFromTemplate docstrings)
    - tests/tests/utils/ (testIds, candidateJourneyConstants, voterIntro)
    - tests/tests/fixtures/ (views, minimalVoterResultsPage, voterQuestionsPage, entityDetails, resultsPage, candidateLoginPage, candidateProfilePage, emailBucket, feedbackDialog)
    - tests/tests/helpers/timeouts.ts
    - packages/dev-seed/src/templates/index.ts
  renamed:
    - tests/tests/specs/voter/voter-mega-journey.spec.ts -> voter-journey.spec.ts
    - tests/tests/specs/voter/voter-mega-journey.README.md -> voter-journey.README.md
    - tests/tests/specs/candidate/candidate-mega-journey.spec.ts -> candidate-journey.spec.ts
    - tests/tests/specs/candidate/candidate-mega-journey.README.md -> candidate-journey.README.md

key-decisions:
  - "Plan 03 had already repointed the visual/perf/a11y/perm FIXTURE IMPORT LINES (atomicity rule) and the 6 perm views-consumers to fixtures/voter/views + voterJourneyTest. This plan's Task 1/2 work therefore reduced to the FILE renames + comment-token cleanup — the import edits the plan anticipated were largely no-ops because the symbols already resolved."
  - "Renamed two TypeScript type identifiers (CandidateMegaFixtureOptions/CandidateMegaFixtures -> CandidateJourney*) in candidate-journey.ts — they are file-local (no external consumers, grep-confirmed) so the rename is a pure zero-token cleanup that keeps typecheck green."
  - "Renamed the data literal external_id 'test-app-settings-baseV1' -> 'test-app-settings-base' in e2e/base.ts: it is referenced nowhere else (grep-confirmed; no spec asserts it) and dev-seed base-app-settings.test.ts stayed green. This is a Plan-07-adjacent prefix touch done here only because the bare 'baseV1' literal would fail the D-09 zero-token gate; the broader test-e2e-base- prefix rename (D-05) remains Plan 07's."
  - "tests/README.md treated as a FULL SECTION REWRITE (FLAG-10): the stale doc described the deleted data-setup + 20-project variant-* chain. Regenerated the project inventory + dependency graph from the live playwright.config.ts (data-setup-base, voter-journey, candidate-journey, the sequential perm-* family, and the 4 env-gated opt-in projects), added a role-based fixture/setup taxonomy section, and preserved the genuinely-still-accurate Run / missing-nominations-modal / Where-to-look-next sections."

requirements-completed: [WS3, WS4, D-04, D-09, D-11, FLAG-3, FLAG-10]

# Metrics
duration: ~30min
completed: 2026-06-03
---

# Phase 93 Plan 05: Workstreams 3 + 4 — spec renames + a11y rewire + docs + zero-token proof Summary

**Renamed the journey specs (`voter-mega-journey.spec.ts`/`candidate-mega-journey.spec.ts` -> `voter-journey.spec.ts`/`candidate-journey.spec.ts` + their READMEs) to re-attach the Plan 04 `voter-journey`/`candidate-journey` testMatch set — restoring `playwright test --list` to the Wave 1 baseline (84 tests / 72 files) from the 82/70 transient orphan — aligned the a11y spec's comment refs to the base `voter-journey` fixture (imports already repointed in Plan 03), fully rewrote the stale `tests/README.md` project graph to the new `data-setup-base` + journey + perm + opt-in families, updated `CLAUDE.md` `--template e2e` -> `e2e/base`, and drove `mega`/`baseV1` tokens to ZERO across `tests/` + `packages/dev-seed/src/`. `yarn typecheck:tests` + `eslint tests` + dev-seed `test:unit` + `playwright test --list` all green.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3
- **Files changed:** 43 across 3 commits (4 git renames + 39 edits; 1339 insertions / 1729 deletions — net deletion driven by the README graph shrink + token cleanup)

## Accomplishments

**Task 1 — journey spec renames + import repoint (`3c4c58e68`):**
- `git mv` `voter-mega-journey.spec.ts`/`.README.md` + `candidate-mega-journey.spec.ts`/`.README.md` to the `*-journey.*` names matching the Plan 04 testMatch regexes (`/voter-journey\.spec\.ts/`, `/candidate-journey\.spec\.ts/`).
- Cleaned every `mega`/`baseV1` token inside the renamed specs + READMEs (dataset comment refs `baseV1`->`base`, `baseV1.ts`->`e2e/base.ts`, `MEGA_TEST_MAX`->`JOURNEY_TEST_MAX`, `voter mega-journey`/`candidate mega-journey` describe titles -> `... journey`, `data-setup-baseV1`->`data-setup-base`).
- Repointed `visual-regression.spec.ts` + `performance-budget.spec.ts` comment refs to `voter/voter-journey.fixture.ts` + `candidate/candidate-journey.ts` (their import LINES were already repointed in Plan 03).
- `playwright test --list` returned to **84 tests / 72 files** (re-attached the 2 orphaned journey specs flagged in the Plan 04 SUMMARY).

**Task 2 — a11y rewire + perm comment cleanup (`cc73f8172`):**
- a11y-smoke: dropped the residual `voter-mega.fixture.ts` / `voter-mega fixture` comment refs (the import was already `voterJourneyTest from '../../fixtures/voter/voter-journey.fixture'` + the `data-setup-base` project dep, done in Plan 03/04 per D-04).
- 5 perm specs: cleaned `voter-mega`/`candidate-mega`/`voterMegaTest` comment tokens (perm-hide-category-tags, perm-hide-election-tags, perm-disable-allow-open, perm-hide-if-missing-answers, perm-localisation-positive). The 6 `views`-consuming perm imports were already at `fixtures/voter/views` (Plan 03).

**Task 3 — docs rewrite + zero-token proof (`604a5a035`):**
- `tests/README.md` FULL REWRITE (FLAG-10): replaced the stale `data-setup` + 20-project `variant-*` chain documentation with the live graph (`data-setup-base` -> `voter-journey` + `data-setup-candidate-journey` -> `candidate-journey` -> candidate settings-perm chain; the parallel sequential voter perm-* family; the 4 env-gated opt-in projects). Added a role-based fixture/setup taxonomy section; `--template e2e` -> `e2e/base` throughout.
- `CLAUDE.md`: `--template e2e` -> `--template e2e/base` (L285/286/293); `--likert-only` note clarified for the base dataset.
- Cleaned all residual `mega`/`baseV1` comment/docstring tokens across `tests/setup`, `tests/utils`, `tests/fixtures`, `tests/helpers`, and `packages/dev-seed/src/templates/{index.ts,e2e/base.ts}`.
- Renamed the file-local TS types `CandidateMega*` -> `CandidateJourney*` and the unreferenced data literal `test-app-settings-baseV1` -> `test-app-settings-base`.
- **Zero-token proof:** `grep -rn "mega|baseV1" tests/ packages/dev-seed/src/` returns EMPTY (FLAG-3: the `e2e-perm-` external-id prefix namespace is a separate stable namespace, NOT matched by the `mega`/`baseV1` literal grep).

## Task Commits

1. **Task 1: rename journey specs + repoint spec imports** — `3c4c58e68` (refactor)
2. **Task 2: clean a11y + perm spec comment tokens** — `cc73f8172` (refactor)
3. **Task 3: rewrite README/CLAUDE.md docs + zero-token cleanup** — `604a5a035` (refactor)

## Deviations from Plan

### Scope reductions (work pre-completed by Plan 03's atomicity rule)

- **Task 1/2 import repointing was largely a no-op.** The plan's `<action>` blocks anticipated repointing the fixture import LINES in visual/perf/a11y + the 6 perm `views` consumers. Plan 03 had already done all those import-line repoints (its atomicity rule lands importer rewires in the same commit as each fixture move). This plan's actual work narrowed to the FILE renames + the documentary comment-token cleanup. Net effect: same end-state, fewer edits than the plan envisioned — not a behavioural deviation.

### Auto-fixed / in-scope extensions (zero-token gate coverage)

**1. [Rule 3 - Blocking the D-09 gate] Renamed file-local TS type identifiers + one data literal to clear the zero-token grep**
- **Found during:** Task 3
- **Issue:** the hard D-09 `grep -rn "mega|baseV1"` gate covers ALL of `tests/` + `packages/dev-seed/src/`, not just the per-task file lists. Two `CandidateMega*` TS type names (candidate-journey.ts) and one `test-app-settings-baseV1` external_id literal (e2e/base.ts) contained the banned tokens.
- **Fix:** renamed `CandidateMegaFixtureOptions`/`CandidateMegaFixtures` -> `CandidateJourney*` (file-local, grep-confirmed no external consumers) and `test-app-settings-baseV1` -> `test-app-settings-base` (grep-confirmed unreferenced; dev-seed `base-app-settings.test.ts` stayed green).
- **Files modified:** `tests/tests/fixtures/candidate/candidate-journey.ts`, `packages/dev-seed/src/templates/e2e/base.ts`
- **Commit:** `604a5a035`

## Out-of-Scope (left untouched — present in working tree at session start)

A large set of pre-existing uncommitted working-tree changes (deleted legacy Page-Object classes under `tests/tests/pages/`, deleted `variant-*` templates + setups, deleted legacy voter/candidate specs, the modified `perm-startfromcg.spec.ts` from commit `468bb90da`, and the root `TEST-INVENTORY*.md` deletions) were present BEFORE this plan started and are NOT part of plan 93-05's file set. They were not staged or committed by this plan. The `e2e-perm-` external-id prefix namespace and the `test-` base prefix (D-05 `test-e2e-base-` rename) remain owned by Plan 07.

## Threat Surface

No production attack surface — test spec/doc relocation + comment cleanup only (matches the plan's threat register: T-93-05 accept). No new endpoints, auth logic, file-access, or schema changes. The one data-literal change (`test-app-settings-base` external_id) is test-seed-only.

## Verification

- `yarn typecheck:tests` — exits 0 after each task and at plan close.
- `npx playwright test --list -c tests/playwright.config.ts` — exits 0; **84 tests / 72 files** (Wave 1 baseline restored; orphaned journey specs re-attached).
- `eslint --flag v10_config_lookup_from_file tests` — exits 0.
- `grep -rn "mega|baseV1" tests/ packages/dev-seed/src/` — EMPTY (D-09 zero-token gate met; FLAG-3 e2e-perm- namespace excluded by construction).
- `grep -nE "template e2e([^/]|$)" CLAUDE.md tests/README.md` — EMPTY (no bare `--template e2e`; all are `e2e/base`).
- `@openvaa/dev-seed` `tsc --noEmit` + `test:unit` — green (450 passed / 17 skipped; `test-app-settings-base` rename did not break `base-app-settings.test.ts`).

## Self-Check: PASSED

All renamed/created/modified files verified on disk; old mega-named specs confirmed absent; all 3 task commits present in git history (verified below).

---
*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Completed: 2026-06-03*
