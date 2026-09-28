---
phase: 92-e2e-test-infrastructure-hardening
plan: 01
subsystem: testing
tags: [typescript, tsc, eslint, eslint-plugin-playwright, playwright, jose, locators]

# Dependency graph
requires:
  - phase: 91-tir6-perm-edit-additions
    provides: in-flight Page-Object→function-fixture migration that this plan typechecks + lints
provides:
  - committed tests/tsconfig.json (--noEmit typecheck scope for tests/)
  - typecheck:tests script wired into lint:check
  - playwright/no-restricted-locators enforced (errors on bare page.locator, chained .locator, getByText)
  - all 5 raw-locator sites guarded with // reason: + eslint-disable
  - green tests/ lint + typecheck gate
affects: [92-02-goToPage-fixtures, 92-03-testid-sweep-frontend-anchors, 92-04-timeout-consolidation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tests/ typechecked via a dedicated --noEmit tsconfig extending @openvaa/shared-config/ts (alias resolves under local tsc)"
    - "no-restricted-locators replaces no-raw-locators as the locator-stability guard; getByRole/getByTestId stay allowed (D-02)"
    - "setup/teardown projects exempted from assertion-semantics lint rules via a scoped eslint override"

key-files:
  created:
    - tests/tsconfig.json
  modified:
    - package.json
    - tests/eslint.config.mjs
    - tests/tests/utils/e2eFixtureRefs.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
    - tests/tests/fixtures/entityDetails.fixture.ts
    - tests/tests/fixtures/candidate/voterNavFixture.fixture.ts
    - tests/tests/specs/perm/perm-hide-hero.spec.ts
    - tests/tests/utils/voterIntro.ts
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
    - tests/tests/utils/missingNominations.ts

key-decisions:
  - "extends form: @openvaa/shared-config/ts ALIAS resolved cleanly under the local tsc (5.9.3); no relative-path fallback needed"
  - "typecheck:tests must invoke node_modules/.bin/tsc directly — `yarn tsc` resolves an ancient global tsc 3.8.3 via PATH"
  - "Cross-package AppSettings leak resolved by adding apps/frontend/src/lib/types/global.d.ts to include (scoping fix, no frontend logic touched)"
  - "setup/teardown eslint override (expect-expect + no-conditional-in-test off) — these projects seed/clean the DB, they are not assertion tests"
  - "testId-sweep (Task 3): 0 in-scope migrations — all entityDetails/views getByRole sites are legitimate role predicates; the one real candidate is deferred to 92-03"

patterns-established:
  - "Forbidden-locator trio (bare page.locator / chained .locator / getByText) is a hard eslint error; locale-stable exceptions carry // reason: + eslint-disable-next-line playwright/no-restricted-locators"
  - "Assertion-wrapper helpers matched by ^expect[A-Z] OR ^assert[A-Z] in expect-expect assertFunctionPatterns"

requirements-completed: [TYPECHECK, LOCATORS]

# Metrics
duration: ~25min
completed: 2026-06-02
---

# Phase 92 Plan 01: Typecheck wiring + locator-stability hardening Summary

**tests/ now typechecks green via a committed --noEmit tsconfig wired into lint:check, the locator guard is upgraded to no-restricted-locators (errors on bare page.locator, chained .locator, and getByText while keeping getByRole/getByTestId), and all 5 raw-locator sites are guarded — `yarn lint:check` exits 0.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-02T20:16Z
- **Completed:** 2026-06-02T20:27Z
- **Tasks:** 3 (Task 3 was a 0-migration review sweep — no code change)
- **Files modified:** 12 (+1 created)

## Accomplishments
- Committed `tests/tsconfig.json` (`--noEmit`, `composite:false`, `declarationMap:false`, `lib: ES2022+DOM+DOM.Iterable`) extending `@openvaa/shared-config/ts`
- `typecheck:tests` script wired into `lint:check`; fixed the 5 real type errors (3× TS2352 casts, 1× jose v6 `KeyLike→CryptoKey`) and resolved the cross-package `AppSettings` leak by including the frontend `global.d.ts`
- Swapped `no-raw-locators` → `no-restricted-locators`; guarded all 5 raw-locator sites; re-pointed the 2 existing disables; greened the full `tests/` lint suite (setup/teardown override + assert-helper pattern + 4 spec-file fixes)
- testId-preference sweep reviewed the 3 scoped clusters and concluded 0 in-scope migrations (all legitimate role predicates / no-testId tab buttons)

## Task Commits

1. **Task 1: tests/tsconfig.json + typecheck:tests + fix 5 type errors** - `a59a24f45` (feat)
2. **Task 2: no-restricted-locators swap + green tests/ lint gate** - `5a171b28b` (feat)
3. **Task 3: testId-preference sweep** - no commit (0-migration review outcome; see Decisions)

**Plan metadata:** (final docs commit)

## Files Created/Modified
- `tests/tsconfig.json` - NEW. `--noEmit` typecheck scope for tests/; extends shared base, overrides composite/declarationMap, adds DOM lib + frontend global.d.ts
- `package.json` - Added `typecheck:tests` (invokes `node_modules/.bin/tsc`); wired into `lint:check`
- `tests/eslint.config.mjs` - `no-restricted-locators` rule (error); `^assert[A-Z]` added to expect-expect patterns; setup/teardown override
- `tests/tests/utils/e2eFixtureRefs.ts` - 3× TS2352 casts now go via `unknown`
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` - `jose.KeyLike` → `CryptoKey` (jose v6)
- `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts` - xpath-parent locator hoisted + guarded
- `tests/tests/fixtures/entityDetails.fixture.ts` - localized-marker `getByText` guarded with // reason:
- `tests/tests/fixtures/candidate/voterNavFixture.fixture.ts` - disable re-pointed
- `tests/tests/specs/perm/perm-hide-hero.spec.ts` - disable re-pointed
- `tests/tests/utils/voterIntro.ts` - dynamic-text `page.locator('text=...')` guarded
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` - inline `import()` type → `import type { TestInfo }`
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` - intentional describe.skip guarded
- `tests/tests/utils/missingNominations.ts` - 2× stability-window waitForTimeout guarded

## Decisions Made
- **`extends` form:** the `@openvaa/shared-config/ts` package alias RESOLVED cleanly under the local `tsc` 5.9.3 (no `TS6053`); the relative-path fallback was NOT needed.
- **tsc resolution:** `yarn typecheck:tests` initially resolved an ancient global `tsc` 3.8.3 via PATH (flooding `@types/node/util.d.ts` parse errors). Fixed by invoking `node_modules/.bin/tsc` directly in the script.
- **Cross-package `AppSettings` leak:** `tests/tests/utils/translations.ts` imports the frontend i18n barrel, transitively pulling `translations.type.ts` which references the ambient global `AppSettings` (defined in `apps/frontend/src/lib/types/global.d.ts`). Resolved by adding that `global.d.ts` to the tsconfig `include` — a pure scoping fix; no frontend source touched. (Plan said this might persist as out-of-scope; the include-scoping fully dropped it.)
- **testId sweep (Task 3 / D-03):** reviewed `entityDetails.fixture.ts`, `views.ts`, `voter-mega-journey.spec.ts`. `views.ts` has 0 getByRole. All 5 `entityDetails` sites are KEEPs (tab buttons have no testId — the catalog `infoTab`/`opinionsTab`/`childrenTab` are the CONTENT panels; `getByRole('radio',{checked:true})` is the canonical state-predicate KEEP). `voter-mega-journey` sites are overwhelmingly role-semantic (dialog/heading/listbox/option/checkbox/tab/button-by-name against dynamic `TEXT_RE`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] typecheck:tests resolved the wrong tsc**
- **Found during:** Task 1
- **Issue:** `yarn typecheck:tests` ran a global `tsc` 3.8.3 (PATH resolution), producing hundreds of bogus parse errors and failing to resolve the `extends` alias + modern lib/target/moduleResolution values.
- **Fix:** Changed the script to invoke `node_modules/.bin/tsc` directly (the local 5.9.3). RESEARCH already flagged `yarn tsc` fails at root.
- **Files modified:** package.json
- **Verification:** `yarn typecheck:tests` exits 0.
- **Committed in:** a59a24f45

**2. [Rule 3 - Blocking] Cross-package AppSettings ambient not in program**
- **Found during:** Task 1
- **Issue:** Tests transitively import the frontend i18n barrel → `translations.type.ts` references the ambient global `AppSettings`, which lives in the frontend's `global.d.ts` (not in the tests program). One residual `TS2304`.
- **Fix:** Added `apps/frontend/src/lib/types/global.d.ts` to the tsconfig `include`. Scoping-only; no frontend logic touched.
- **Files modified:** tests/tsconfig.json
- **Verification:** typecheck exits 0.
- **Committed in:** a59a24f45

**3. [Rule 2 - Missing critical] tests/ lint suite was red (in-flight refactor residue)**
- **Found during:** Task 2
- **Issue:** Wiring typecheck into `lint:check` is meaningless if `lint:check` is already red. The in-flight Phases 88-91 refactor left ~30 lint errors (23 expect-expect on setup/teardown, 5 import-sort, 3 no-conditional-in-test, 2 no-wait-for-timeout, 1 no-skipped-test, 1 consistent-type-imports, 1 quotes).
- **Fix:** Autofixed import-sort + quotes; added a scoped eslint override exempting `setup/**/*.{setup,teardown}.ts` from `expect-expect`/`no-conditional-in-test` (they are not assertion tests); extended `expect-expect` patterns with `^assert[A-Z]`; fixed the 4 spec-file artifacts (import-type, describe.skip guard, 2× waitForTimeout guards).
- **Files modified:** tests/eslint.config.mjs + the 4 spec files above
- **Verification:** `yarn eslint … tests` exits 0.
- **Committed in:** 5a171b28b

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing-critical). No scope creep — all required to make the new gate enforceable and green.
**Impact on plan:** All within the plan's stated WS1 scope-boundary resolution (green the full tests/ lint suite; do not absorb frontend-side issues).

## Issues Encountered
- **Accidental `git stash` during commit prep (recovered).** While trying to isolate an incidental import-sort autofix on two in-flight files, I ran `git stash push --keep-index`, which stashed my entire Task 2 working set. Recovered immediately via `git stash pop stash@{0}` (the unambiguous top-of-stack WIP I had just created) — all Task 2 edits restored, stash dropped cleanly, both gates re-verified green. No data lost. Lesson re-confirmed: never use `git stash` on a tree with shared/in-flight state.

## In-flight-boundary handling
The working tree carries the uncommitted Phases 88-91 Page-Object→fixture refactor. Per the sequential-executor directive, every commit staged ONLY the explicit paths I edited (never `git add -A`/`.`). Two files received an incidental `simple-import-sort` autofix needed for the gate but are otherwise owned by the in-flight refactor (`tests/tests/setup/perm-hide-hero.teardown.ts`, `tests/tests/specs/visual/visual-regression.spec.ts`) — these were intentionally LEFT in the working tree (uncommitted) so their import-sort lands with the refactor commit that owns them; the working-tree lint gate is green regardless.

## Deferred follow-ups (for Plan 92-03)
- **getByRole → getByTestId migrate-candidate:** `voter-mega-journey.spec.ts` ~:1078-1115 uses `getByRole('button', { name: /open menu/i })` (×3) for the nav menu toggle, which HAS `testIds.shared.navigation.menuToggle` ('nav-menu-toggle') and is locale-fragile (the `/open menu/i` regex fails on /fi). This is a genuine element-identity migration, but `voter-mega-journey.spec.ts` is mid-refactor; migrating it here would entangle the commit with unrelated in-flight content. Defer to 92-03 (which owns the WS2 fixture rebuild and will touch this file).
- **entityDetails missing-answer marker testId:** `entityDetails.fixture.ts` `infoText` assertion (the localized "hasn't answered" marker) currently uses a guarded `getByText`. A stable frontend `data-testid` on the missing-answer message element would let it migrate cleanly — frontend-testid work deferred to 92-03.

## Next Phase Readiness
- `yarn lint:check` (turbo lint + tests eslint + typecheck:tests) is the green gate for all subsequent 92 plans.
- 92-02 (goToPage/expectPageVisible fixtures) and 92-03 (testId sweep + frontend anchors) can proceed; the locator + typecheck gates will enforce their work.

## Self-Check: PASSED

- FOUND: tests/tsconfig.json
- FOUND: .planning/phases/92-.../92-01-SUMMARY.md
- FOUND commit: a59a24f45 (Task 1)
- FOUND commit: 5a171b28b (Task 2)

---
*Phase: 92-e2e-test-infrastructure-hardening*
*Completed: 2026-06-02*
