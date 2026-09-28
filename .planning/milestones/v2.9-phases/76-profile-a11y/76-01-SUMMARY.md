---
phase: 76-profile-a11y
plan: 01
subsystem: testing
tags: [playwright, e2e, candidate, profile, validation, a11y, fixture-extension, dev-seed]

requires:
  - phase: 73-determinism-baseline
    provides: 3-run --workers=1 cold-start determinism contract; IMGPROXY_TIED_TITLES bound-pattern list; playwright/no-conditional-in-test + no-raw-locators + no-wait-for-timeout lint rules at 'error'
  - phase: 74-high-leverage-e2e-coverage
    provides: Single-template fixture extension pattern (P05 directional question + Alpha answer cell); PASS-WITH-DEFERRAL precedent for unimplemented surfaces
  - phase: 75-question-rendering-specs
    provides: Module-level for...of parameterized cell runner pattern (P01 boolean spec); scope-marked filename convention (voter-question-rendering-boolean.spec.ts); deferred-todo file shape (qspec-02 multi-choice variant)
provides:
  - 3-cell A11Y-01 candidate profile validation rejection spec (image-type, image-size, name-too-long via HTML5 maxlength)
  - Test fixture file `tests/tests/data/test-not-an-image.txt` (4-byte plain text) for image-type rejection cell
  - 3 new e2e seed info questions (test-question-displayname @ sort 19, test-question-bio @ sort 20, test-question-social-1 @ sort 21) + 3 Alpha answer cells
  - PRODUCT-GAP follow-up todo capturing 3 deferred A11Y-01 cells (email-format + url-format + name-too-short / required-empty) with file+line refs to missing capabilities
  - Stabilization recipe for macOS Chromium filechooser flake in serial-mode IMAGE_CELLS iteration (pre-filechooser settle delay)
  - Phase 76 deferred-items.md capturing stale ProfilePage.uploadImage page-object selector + pre-existing candidate-profile.spec.ts registration flake
affects: 76-02-plan (consumes the same fixture additively for A11Y-02 displayName + bio + social-link reload-persistence assertions); 76-04-plan (verification gate inherits the 3-run smoke determinism contract)

tech-stack:
  added: []  # no new deps — Phase 76 P01 is content-heavy spec authoring + a fixture extension
  patterns:
    - "PRODUCT-GAP deferral: spec ships the reliably-renderable subset; deferred cells captured in a single follow-up todo with per-cell missing-capability + scope-when-picked-up + effort sizing (mirrors Phase 75 P02b qspec-02 shape)"
    - "Scope-marked filename for additive spec: candidate-profile-validation.spec.ts decouples from candidate-profile.spec.ts happy paths (Phase 75 D-04 precedent extended to candidate suite)"
    - "Value-disjointness invariant for fixture extensions: new answer values must not contain substrings that existing test assertions key off (CAND-06 'Alpha' substring lookup)"
    - "Pre-filechooser settle delay for macOS Chromium filechooser actor flake in serial-mode iteration"
    - "Module-level for...of cell runner pattern with separate IMAGE_CELLS + TEXT_CELLS arrays to satisfy playwright/no-conditional-in-test"
    - "Inline reason: justification for setInputFiles + waitForTimeout sites in test code (Phase 73 D-07 / CONTEXT D-11a convention)"

key-files:
  created:
    - tests/tests/specs/candidate/candidate-profile-validation.spec.ts (220 lines)
    - tests/tests/data/test-not-an-image.txt
    - .planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md (186 lines)
    - .planning/phases/76-profile-a11y/deferred-items.md
  modified:
    - packages/dev-seed/src/templates/e2e.ts (+57 lines for fixture extension; +14 lines for value-disjointness fix)
    - tests/playwright.config.ts (regex extension for candidate-app-mutation testMatch)

key-decisions:
  - "Bypass ProfilePage.uploadImage() page-object: its legacy label[tabindex=\"0\"] selector no longer exists post-70-03 component refactor; spec drives the filechooser via getByRole('button').first() instead. Page-object update filed as a follow-up in 76-deferred-items.md."
  - "Use Test Candidate Alpha credentials (data-setup auth.setup.ts pre-registered) rather than registering a new E2E_ADDENDUM_CANDIDATES entry — avoids the candidate-profile.spec.ts registration flake which is pre-existing and unrelated to Phase 76 P01."
  - "Switch fixture answer values from 'Alpha The Test'/'Alpha biography...' to 'Display Name Sentinel 76'/'Phase 76 biography sentinel...' after CAND-06 strict-mode 'Alpha' substring lookup tripped on the additive answer cells. Value-disjointness invariant codified inline at the fixture site."
  - "Add 500ms pre-filechooser settle delay (with inline reason justification) to mitigate macOS Chromium filechooser actor flake; smallest reproducible buffer that takes the second IMAGE_CELLS iteration from intermittent-timeout to deterministic-pass across 3+ rapid serial runs."
  - "Extend tests/playwright.config.ts candidate-app-mutation testMatch regex to include candidate-profile-validation.spec.ts (Rule 3 blocking-issue auto-fix; without this, the spec is silently ignored)."

patterns-established:
  - "Pattern: Value-disjointness invariant comment at the fixture site documents which existing tests rely on substring-unique values (CAND-06 'Alpha' lookup, etc.) so future additive fixture extensions don't accidentally regress."
  - "Pattern: Pre-filechooser settle delay with inline reason for macOS Chromium serial-mode iteration; documented inline so future maintainers know the production contract is unchanged, only the test harness is augmented."
  - "Pattern: Single-todo PRODUCT-GAP deferral capturing N cells with per-cell missing-capability + scope-when-picked-up + effort-sizing per cell (mirrors Phase 75 P02b qspec-02 shape, extended to multi-cell + per-cell sub-bullets)."

requirements-completed: [A11Y-01]

duration: 1h 45m
completed: 2026-05-12
---

# Phase 76 Plan 01: A11Y-01 Candidate Profile Validation Rejection Paths Summary

**3-cell candidate profile validation spec (image-type, image-size, name-too-long via HTML5 maxlength) lands alongside a 3-info-question seed extension; 3 PRODUCT-GAP cells deferred via single follow-up todo per RESEARCH LANDMINE-2 — no production frontend changes.**

## Performance

- **Duration:** ~1h 45m (including extensive smoke + flake-debugging)
- **Started:** 2026-05-12T~06:35Z (Phase 76 execution start per STATE.md)
- **Completed:** 2026-05-12 (current session)
- **Tasks:** 4 (all auto, no checkpoints)
- **Files modified:** 6 (2 modified + 4 created)

## Accomplishments

- Authored 3-cell A11Y-01 candidate profile validation spec covering image-type rejection (`components.input.error.invalidFile`), image-size rejection (`components.input.error.oversizeFile`), and name-too-long via HTML5 maxlength=50 on `test-question-displayname`. Each cell asserts the validation error UI surfaces AND the unsaved state is preserved.
- Extended the dev-seed `e2e` template with 3 new editable info questions at sort 19/20/21 (displayname + bio + social-1) plus 3 corresponding Alpha answer cells. Voter fixture's `voterAnswerCount=16` Likert loop unaffected.
- Filed PRODUCT-GAP follow-up todo at `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` capturing 3 deferred cells (email-format, url-format, name-too-short / required-empty) with file+line refs to the missing customData schema, render path, and i18n keys.
- Stabilized the macOS Chromium filechooser flake in serial-mode IMAGE_CELLS iteration via a 500ms pre-filechooser settle delay; 3 isolated `--workers=1 --grep "A11Y-01"` runs = 19/19 PASS each (9/9 A11Y-01 PASS total).
- Captured 2 pre-existing follow-ups in `76-deferred-items.md`: (1) stale `ProfilePage.uploadImage()` page-object selector (post-70-03 component refactor drift) and (2) pre-existing candidate-profile.spec.ts registration test flake (Inbucket/Auth race, unrelated to Phase 76).

## Task Commits

Each task was committed atomically with `git -c core.hooksPath=/dev/null` per project memory:

1. **Task 1: Extend e2e dev-seed template with 3 info questions + 3 Alpha answer cells** — `f6001723b` (feat)
2. **Task 1 follow-up: Make A11Y-02 anchor answer values disjoint from 'Alpha' substring** — `60d3c6501` (fix; Rule 1 auto-fix discovered during Task 2 smoke)
3. **Task 2: A11Y-01 candidate profile validation rejection paths spec + data fixture + playwright.config regex** — `b93a6ebe8` (feat)
4. **Task 3: PRODUCT-GAP follow-up todo for 3 deferred A11Y-01 cells** — `8cd87aaf5` (docs)
5. **Task 4 stabilization: Pre-filechooser settle delay for macOS Chromium flake** — `15107e336` (fix; Rule 1 auto-fix discovered during Task 4 smoke)

## Files Created/Modified

- `packages/dev-seed/src/templates/e2e.ts` — extended `questions.fixed[]` with sort 19/20/21 info questions (Phase 76 A11Y-01/02 anchors); extended `candidates.fixed[0].answersByExternalId` with 3 Alpha answer cells using disjoint-from-'Alpha' sentinel values.
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — NEW spec, 220 lines. Module-level for...of cell runner across IMAGE_CELLS (2) + TEXT_CELLS (1). Uses Test Candidate Alpha pre-registered credentials. Drives the filechooser via the role-based portrait button (bypasses stale ProfilePage page-object) with a 500ms settle delay.
- `tests/tests/data/test-not-an-image.txt` — NEW 4-byte plain-text fixture for image-type rejection cell.
- `tests/playwright.config.ts` — extended candidate-app-mutation testMatch regex to include `candidate-profile-validation.spec.ts`.
- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — NEW 186-line follow-up todo with per-cell rationale + scope + effort + cross-links.
- `.planning/phases/76-profile-a11y/deferred-items.md` — NEW phase-local deferred-items log capturing (a) the stale ProfilePage.uploadImage selector and (b) the pre-existing candidate-profile.spec.ts registration flake.

## Decisions Made

- **Bypass `ProfilePage.uploadImage()` page-object**: its `label[tabindex="0"]` selector no longer matches the post-70-03 button-based component. Spec drives the filechooser via `getByRole('button').first()` directly. Page-object fix is a follow-up Rule 1 candidate filed in `76-deferred-items.md`.
- **Use Test Candidate Alpha credentials** (Option X in Plan 01 Task 2) rather than registering a new addendum candidate. Avoids the pre-existing `candidate-profile.spec.ts` registration test flake (Inbucket/Auth race) which is unrelated to Phase 76 P01.
- **Switch fixture answer values to 'Sentinel 76' disjoint strings** after CAND-06's strict-mode `getByText('Alpha', { exact: false })` tripped on the additive answer cells. Value-disjointness invariant codified inline at the fixture site (commit `60d3c6501`).
- **500ms pre-filechooser settle delay** (with inline `// reason:` + eslint-disable + `// eslint-disable-next-line playwright/no-wait-for-timeout` justification) — smallest reproducible buffer to deterministically pass the second IMAGE_CELLS iteration on macOS Chromium across 3 consecutive runs.
- **Extend `tests/playwright.config.ts` candidate-app-mutation testMatch regex** to include `profile-validation` so the new spec file is discovered. Without this change the spec is silently ignored.
- **PRODUCT-GAP deferral path** (per CONTEXT D-03) for email-format / url-format / required-empty cells — each requires schema + component + i18n additions that exceed v2.9 coverage-phase scope. Captured in single follow-up todo with per-cell scope + effort sizing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tests/playwright.config.ts testMatch regex did not pick up new spec file**
- **Found during:** Task 2 (spec authoring + smoke)
- **Issue:** The `candidate-app-mutation` project's `testMatch: /candidate-(registration|profile)\.spec\.ts/` regex literally matches only `candidate-profile.spec.ts` and `candidate-registration.spec.ts`. The new `candidate-profile-validation.spec.ts` file was silently ignored.
- **Fix:** Extended regex to `/candidate-(registration|profile|profile-validation)\.spec\.ts/`.
- **Files modified:** `tests/playwright.config.ts`
- **Verification:** Spec runs under `candidate-app-mutation` project; per-plan smoke discovers all 3 tests.
- **Committed in:** `b93a6ebe8` (Task 2 commit).

**2. [Rule 1 - Bug] Fixture extension's 'Alpha The Test' value broke existing CAND-06 strict-mode 'Alpha' substring lookup**
- **Found during:** Task 2 (smoke; surfaced as test #13 failure in initial run)
- **Issue:** Task 1 seeded Alpha's three new answer cells with values containing 'Alpha' (e.g., `'Alpha The Test'`, `'Alpha biography...'`, `'https://example.com/alpha'`). The existing `candidate-questions.spec.ts:271` assertion `previewPage.container.getByText('Alpha', { exact: false })` is in Playwright's strict mode — it expects exactly ONE element matching the locator, but the new answer cells rendered as additional matches (4 total) and the assertion failed.
- **Fix:** Renamed the 3 sentinel values to disjoint strings (`'Display Name Sentinel 76'`, `'Phase 76 biography sentinel...'`, `'https://example.com/sentinel-76'`). Codified the value-disjointness invariant as an inline comment at the fixture site so future additive extensions don't regress.
- **Files modified:** `packages/dev-seed/src/templates/e2e.ts`
- **Verification:** Re-ran smoke; CAND-06 passes (test #13 = 1.1s) + A11Y-01 cells pass.
- **Committed in:** `60d3c6501` (separate Rule 1 fix commit on top of Task 1).

**3. [Rule 1 - Bug] macOS Chromium filechooser flake in serial-mode IMAGE_CELLS iteration**
- **Found during:** Task 4 (3× per-plan smoke; Run 1 failure on image-size cell at 90s waitForEvent timeout)
- **Issue:** The second IMAGE_CELLS iteration's `page.waitForEvent('filechooser')` intermittently timed out at 90s on macOS Chromium when run in rapid serial-mode after the first iteration. Root cause: OS-level filechooser actor not always surfacing on rapid successive invocations. Attempted fix via `setInputFiles()` direct on hidden `<input class="hidden">` did NOT work — hidden Tailwind inputs do not always fire onchange in headless Chromium when files are programmatically set, so the rejection branch never rendered the error.
- **Fix:** Added a 500ms `page.waitForTimeout(500)` between the portrait-button enabled-assertion and the `waitForEvent('filechooser')` invocation. Smallest reproducible buffer that takes the second iteration from intermittent-timeout to deterministic-pass. Justified inline with `// reason:` + `// eslint-disable-next-line playwright/no-wait-for-timeout` per CONTEXT D-11a / Phase 73 D-07 convention.
- **Files modified:** `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`
- **Verification:** Re-ran smoke 3× — 3/3 PASS (9/9 A11Y-01 PASS, 19/19 total per run, 38-41s per run).
- **Committed in:** `15107e336` (Task 4 stabilization).

---

**Total deviations:** 3 auto-fixed (1 blocking-issue, 2 bug-fix).
**Impact on plan:** All 3 auto-fixes essential for Phase 76 P01 to deliver A11Y-01 SC #1. No scope creep — each fix stayed within the additive-only contract and the existing test surface. The 2 follow-ups captured in `76-deferred-items.md` (stale `ProfilePage.uploadImage` page-object + pre-existing registration flake) are out-of-scope for Phase 76 P01 per SCOPE BOUNDARY ("Only auto-fix issues DIRECTLY caused by the current task's changes").

## Issues Encountered

- **Stale ProfilePage.uploadImage page-object** — discovered while authoring the spec. The page-object's `label[tabindex="0"]` selector no longer matches the post-70-03 `<button>`-based component. Worked around by driving the filechooser via the role-based button directly in the new spec. Page-object update filed as follow-up.
- **Pre-existing candidate-profile.spec.ts registration test flake** — `should register the fresh candidate via email link` intermittently fails on the terms-checkbox visibility after registration (Inbucket / Auth race). NOT a Phase 76 P01 regression — captured in `76-deferred-items.md` for Phase 76 P04 verification gate triage.
- **CAND-06 strict-mode 'Alpha' lookup regression** — surfaced as a Rule 1 bug, fixed via value-disjointness sentinel rename (see Deviations #2).
- **macOS Chromium filechooser flake** — surfaced as a Rule 1 bug, fixed via 500ms pre-filechooser settle delay (see Deviations #3).

## User Setup Required

None — no external service configuration required. The new spec uses existing data-setup project credentials (Test Candidate Alpha) and consumes the additive seed extension via the standard `yarn supabase:reset && yarn dev:seed --template e2e` flow.

## Next Phase Readiness

- **Plan 02 (A11Y-02 profile reload-persistence extension)** can start immediately. The 3 new info questions (`test-question-displayname`, `test-question-bio`, `test-question-social-1`) + Alpha's answer cells are seeded, accessible via `getByLabel(/Display name|Biography|Social link/)`, and verified to round-trip across `page.reload()` in the existing CAND-12 flow's neighborhood. Plan 02 extends `candidate-profile.spec.ts` CAND-12 (or splits to `candidate-profile-persistence.spec.ts`) with assertions on these three fields.
- **Plan 03 (A11Y-03 axe smoke wiring)** is independent of Plan 01 outputs and may run in parallel with Plan 02.
- **Plan 04 (verification gate)** inherits the per-plan smoke determinism contract (3 runs × 19 tests = 57 PASS observed in Task 4) and will add the cold-start 3-run gate per CONTEXT D-09 + D-11.

### Known Stubs

None. All 3 cells render real validation UI assertions against the existing production paths; no placeholder or mock components were introduced.

## Self-Check: PASSED

All claimed outputs verified to exist on disk and in git:

- `packages/dev-seed/src/templates/e2e.ts` — modified (commits `f6001723b` + `60d3c6501`)
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — created (commit `b93a6ebe8`)
- `tests/tests/data/test-not-an-image.txt` — created (commit `b93a6ebe8`)
- `tests/playwright.config.ts` — modified (commit `b93a6ebe8`)
- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — created (commit `8cd87aaf5`)
- `.planning/phases/76-profile-a11y/deferred-items.md` — created (commit `b93a6ebe8`)

All commit hashes present in `git log --oneline -10`. Per-plan smoke logs at `/tmp/76-01-run-{1,2,3}.log` confirm 3/3 PASS (19 tests each).

---

*Phase: 76-profile-a11y*
*Completed: 2026-05-12*
