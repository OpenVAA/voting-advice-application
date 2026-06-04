---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
plan: 02
subsystem: dev-seed
tags: [dev-seed, templates, vitest, e2e-seed, relocation, rename]

# Dependency graph
requires:
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 01
    provides: green dev-seed test:unit gate (trustworthy exit 0) + quarantined e2e test surfaces
provides:
  - "Canonical `e2e/base` seed family on disk (e2e/base.ts + e2e/perm/*)"
  - "Retired bare `e2e` template name (no alias); discarded old e2e dataset"
  - "Renamed public symbols: baseTemplate / BASE_APP_SETTINGS (FLAG-9)"
  - "Base-dataset dev-seed template coverage (base.test.ts / base-app-settings.test.ts), green + un-skipped"
affects:
  - "93-XX setup reorg (D-06/D-10): tests/ consumers of retired `e2e` key + `baseV1` setup name must repoint"
  - "93-07 external_id prefix workstream (test-app-settings-baseV1 + e2e-perm-* prefixes untouched here)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seed-family folder shape: e2e/base.ts (canonical base dataset) + e2e/perm/* (flat invocation keys)"
    - "Derive-from-source template tests: read counts/ids from the live template object, not hardcoded"

key-files:
  created:
    - packages/dev-seed/tests/templates/base.test.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
  modified:
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/e2e/perm/
    - packages/dev-seed/src/templates/index.ts
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - packages/dev-seed/src/index.ts
    - packages/dev-seed/src/cli/resolve-template.ts
    - packages/dev-seed/tests/cli/likert-only.test.ts
    - tests/seed-test-data.ts
  deleted:
    - packages/dev-seed/src/templates/e2e.ts

key-decisions:
  - "Folded the likert-only.test.ts smoke retarget (e2eTemplate→baseTemplate) into Task 1 as a Rule 3 blocking-issue fix — deleting e2e.ts broke its module-load import, and it is not owned by Task 2's e2e.test.ts rewrite."
  - "Left tests/ setup/spec/config baseV1 + retired-e2e references UNTOUCHED — they belong to the later setup-reorg plans (D-06/D-10), explicitly out of Plan 02 (WS5) scope."
  - "Preserved all external_id literals (incl. test-app-settings-baseV1) and e2e-perm-* prefixes — Plan 07 owns the prefix workstream."

requirements-completed: [WS5, D-01, D-02, D-03, FLAG-4, FLAG-9]

# Metrics
duration: ~30min
completed: 2026-06-03
---

# Phase 93 Plan 02: Workstream 5 — e2e/base + e2e/perm seed family Summary

**Restructured `@openvaa/dev-seed` templates into the canonical `e2e/base.ts` + `e2e/perm/*` family: moved `baseV1.ts`→`e2e/base.ts` (renamed `baseTemplate`/`BASE_APP_SETTINGS`), deleted the old `e2e.ts`, relocated all 24 permutation files under `e2e/perm/` (flat invocation keys preserved), remapped the barrel + resolver + public surface, retired the bare `e2e` name, and rewrote the dev-seed template tests to assert the surviving base dataset — full `test:unit` gate green (450 passed / 17 skipped / 0 failed).**

## Performance

- **Duration:** ~30 min
- **Tasks:** 2 (+ 1 doc follow-up)
- **Files modified:** 30 (1 file deleted, 2 test files created, 22 perm renames + shared.ts, base.ts rename, barrel/resolver/index/buildMinimal/likert-only/seed-test-data edits)

## Accomplishments

**Task 1 — relocation + remap (`d783e81fc`):**
- `git mv baseV1.ts → e2e/base.ts`; renamed `baseV1Template`→`baseTemplate`, `BASE_V1_APP_SETTINGS`→`BASE_APP_SETTINGS` (FLAG-9). Fixed the import depth (`../template/types`→`../../template/types`).
- Deleted `e2e.ts` entirely (D-01); `e2eTemplate` + `E2E_BASE_APP_SETTINGS` retired.
- `git mv permutations/ → e2e/perm/` (22 `perm-*` files + `shared.ts`). Fixed relative-import depth in all perm files (`../_helpers/`→`../../_helpers/`, `../../template/types`→`../../../template/types`; `./shared` siblings unchanged) and the sibling `_helpers/buildMinimal.ts` import (`../permutations/shared`→`../e2e/perm/shared`).
- Remapped `index.ts` barrel: deleted the `e2e:` map entry, changed `baseV1: baseV1Template`→`'e2e/base': baseTemplate` (D-01), repathed 23 imports + 23 re-exports to `./e2e/perm/*`, KEPT all 24 perm map KEYS flat (FLAG-4).
- Updated `src/index.ts` re-exports, `resolve-template.ts` JSDoc, and retargeted `tests/seed-test-data.ts` to `BUILT_IN_TEMPLATES['e2e/base']`.

**Task 2 — base-dataset test rewrite (`81759e29c`, D-03):**
- Renamed `e2e.test.ts`→`base.test.ts`, `e2e-app-settings.test.ts`→`base-app-settings.test.ts`; REWROTE both bodies against the surviving base dataset (2 elections, 2 CGs, 6 constituencies, 5 orgs, 2 alliances, 8 question categories = 1 info + 7 opinion; hierarchical parent refs; `_elections`/`_constituencies` scoping sentinels; nomination triangle closure + polymorphic-ref XOR).
- Asserted `BASE_APP_SETTINGS` shape (11 top-level blocks incl. the `test-qu-info-text` submatch cardContents ref) + registry visibility under `BUILT_IN_TEMPLATES['e2e/base']`.
- Removed the Wave-0 `it.skip` quarantine — assertions now run green (61 new tests).

## Task Commits

1. **Task 1: move/relocate/remap** — `d783e81fc` (refactor)
2. **Task 2: base-dataset test rewrite** — `81759e29c` (test)
3. **Doc follow-up: perm shared.ts comment** — `ab3f69fb5` (docs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Retargeted likert-only.test.ts smoke from the deleted e2eTemplate**
- **Found during:** Task 1
- **Issue:** `packages/dev-seed/tests/cli/likert-only.test.ts:117` dynamically imports `e2eTemplate` from `../../src/templates/e2e` (the file deleted by Task 1). Deleting `e2e.ts` broke the test at module-load, turning the dev-seed `test:unit` gate RED. This file is not owned by Task 2 (which owns only `e2e.test.ts` / `e2e-app-settings.test.ts`).
- **Fix:** Repointed the smoke test to `baseTemplate` (the surviving dataset) and replaced the hardcoded `ordinalCount === 16` with a count derived from the base template's own opinion-ordinal questions (no over-keep/over-drop invariant preserved against the new dataset).
- **Files modified:** `packages/dev-seed/tests/cli/likert-only.test.ts`
- **Commit:** `d783e81fc`

## Out-of-Scope Items Deferred (NOT fixed — owned by later plans)

These `tests/` consumers still reference the retired `e2e` runtime key or the `baseV1` setup name. They are the explicit province of the setup-reorg plans (D-06 merge / D-10 baseV1→base rename) and the a11y plan, NOT Plan 02 (WS5 = the dev-seed package only). Flagged here so the next plan / verifier repoints them:
- `tests/tests/setup/data.setup.ts` — reads `BUILT_IN_TEMPLATES.e2e` (now `undefined`; D-06 merges this chain into the base chain).
- `tests/tests/utils/e2eFixtureRefs.ts` — reads `BUILT_IN_TEMPLATES.e2e` (D-06).
- `tests/tests/setup/baseV1.setup.ts` / `baseV1.teardown.ts` — call `setupFromTemplate('baseV1')`; the resolver now only knows `'e2e/base'` (D-10 renames these to `base.*`).
- `tests/playwright.config.ts` — `data-setup-baseV1` project keys + `baseV1` testMatch (D-08/D-10).
- `tests/README.md`, `CLAUDE.md`, `packages/dev-seed/README.md` — `--template e2e` doc references (D-01 §F).

These do NOT affect the dev-seed package build/typecheck/test:unit (all green); they are runtime-only and surface only when the relevant Playwright setup projects run, which the later plans rewire.

## Issues Encountered

- **Broken global commit hook:** normal `git commit` failed (the global hook runs a `yarn`/translation-key step from the wrong directory — "Couldn't find a package.json file"). Resolved per project memory via `git -c core.hooksPath=/dev/null commit ...`. Not a lint/test failure in the changes themselves.

## Verification

- `yarn build --filter=@openvaa/dev-seed` — succeeds (dev-seed is tsx-only, no build step).
- `yarn typecheck:tests` — exits 0.
- `yarn workspace @openvaa/dev-seed test:unit` — 43 files passed / 1 skipped (the Plan-01-quarantined `variant-app-settings.test.ts`); 450 tests passed / 17 skipped / 0 failed.
- Structure: `e2e/base.ts` present; `e2e.ts` + `permutations/` gone; `e2e/perm/` holds 23 files (22 perm-* + shared.ts); `index.ts` carries the `'e2e/base'` map key; zero `e2eTemplate`/`baseV1Template`/`BASE_V1_APP_SETTINGS`/`E2E_BASE_APP_SETTINGS` references remain in `packages/dev-seed/src/`.

## Self-Check: PASSED

All claimed files exist on disk; all 3 task commits (`d783e81fc`, `81759e29c`, `ab3f69fb5`) present in git history.

---
*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Completed: 2026-06-03*
