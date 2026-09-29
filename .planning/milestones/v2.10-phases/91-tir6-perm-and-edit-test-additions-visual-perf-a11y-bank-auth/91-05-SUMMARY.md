---
phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
plan: 05
subsystem: testing
tags: [playwright, e2e, supabase-auth, perm-fixtures, voter-mega-fixture, drawer-scoping, gap-closure]

# Dependency graph
requires:
  - phase: 91-04
    provides: voter-mega.fixture.ts answeredVoterPage + locatedVoterPage; perm specs that drove CR-01/CR-02 discovery
  - phase: 91-02
    provides: 9 TIR6 perm chains (templates + setups + specs + playwright project graph) whose authenticated assertions CR-01 unblocks
provides:
  - Real-Supabase-session storage state for A1/A2/A9 perm chains (CR-01 closure)
  - Voter-mega-fixture consumption in A6 + A9 voter-side perm specs (CR-02 closure)
  - Drawer-scoped + waitFor + EN-only feedback locator in voter-mega-journey cycles 1-3 (CR-03 closure)
affects: [phase-92, future-perm-spec-authoring, future-feedback-flow-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "forceRegister + real UI login pattern (mirrors auth.setup.ts + data.setup.ts) is now THE canonical mechanism for perm setups that need an authenticated candidate storage state. Synthetic JWT/cookie minting is forbidden per D-91-PD-06 revised."
    - "Mixed-runner Option B (voterMegaTest as the single `test` runner) chosen over Option A (mixed @playwright/test + voterTest) when a file's voter-side describe block needs `answeredVoterPage` AND the candidate-side block needs `test.use({ storageState })` — eliminates playwright/no-standalone-expect lint false-positive."
    - "Drawer-scoping pattern for menu-item locators: anchor on `<nav data-testid=\"nav-menu\">` (Navigation.svelte:56-62) via `page.getByTestId(testIds.shared.navigation.menu)`, then chain `getByTestId(testIds.shared.navigation.menuItem).filter({hasText: /.../i})` off it. Always preceded by `await menuDrawer.waitFor({state:'visible'})` to settle the drawer-open CSS transition before clicking."

key-files:
  created:
    - "(none — Task 8 helper extraction was evaluated and SKIPPED; see Deviations §Task 8 Decision)"
  modified:
    - "tests/tests/setup/perm-answers-locked.setup.ts (Task 1 — forceRegister + UI login mint)"
    - "tests/tests/setup/perm-hide-hero.setup.ts (Task 2 — same pattern, A2)"
    - "tests/tests/setup/perm-disable-allow-open.setup.ts (Task 3 — same pattern, A9 candidate)"
    - "tests/playwright.config.ts (Task 4 doc-comment rewrite on lines ~1029, ~1051)"
    - "tests/tests/specs/perm/perm-answers-locked.spec.ts (Task 4 doc-comment rewrite + Task style fix simple-import-sort)"
    - "tests/tests/specs/perm/perm-hide-hero.spec.ts (Task 4 doc-comment rewrite)"
    - "tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts (Task 5 — voter-mega answeredVoterPage)"
    - "tests/tests/specs/perm/perm-disable-allow-open.spec.ts (Task 6 — Option B voterTest-as-test + voter-side answeredVoterPage)"
    - "tests/tests/specs/voter/voter-mega-journey.spec.ts (Task 7 — drawer scoping + waitFor + EN-only regex)"
  deleted:
    - "tests/tests/utils/candidateSessionMinter.ts (Task 4 — synth-token helper)"
    - "tests/tests/utils/candidateSessionMinter.test.ts (Task 4 — vitest coverage for above)"

key-decisions:
  - "Task 8 SKIPPED — inline pattern retained over shared-helper extraction. Verification gate #3 in PLAN.md §verification explicitly requires `grep -l 'forceRegister(' tests/tests/setup/perm-*.setup.ts` returns all 3 files; extracting the forceRegister + UI login block into `_helpers/loginAndSaveStorageState.ts` would break that gate (the per-setup `forceRegister(` call disappears into the helper). Plan gap-closure directive also lists 'Premature centralisation of UI-login into a shared utility' under forbidden alternatives. See Deviations §Task 8 Decision for the LOC accounting that justified the gate read."
  - "perm-disable-allow-open.spec.ts uses Option B (voterTest aliased as test for the whole file) instead of Option A (mixed runner). Option A trips playwright/no-standalone-expect lint failures because the plugin does not recognise `voterTest()` as a test-block function (no `additionalTestBlockFunctions` config in tests/eslint.config.mjs). Option B is the more conservative path against lint regression risk."
  - "Drawer locator anchored on testIds.shared.navigation.menu (= 'nav-menu' on the <nav> element in Navigation.svelte:56-62) instead of getByRole('dialog', {name: /menu/i}) fallback. The daisyUI drawer is a CSS-only checkbox-toggled overlay (Layout.svelte:75-83 + 107-111), not a true `<dialog>` — getByRole would not match. The testid is already exported in testIds.ts:244-247 and is a stable testid-only anchor."

patterns-established:
  - "Per-perm Playwright storage-state mint pattern: setupFromTemplate(template) → unregisterCandidate(email) → forceRegister(externalId, email, password) → waitForLoginForm(page, route, emailTestid) → fill + submit → context.storageState({path}). 90s test timeout ceiling per auth.setup.ts:68 precedent."
  - "Voter-mega-fixture consumption in perm specs needing /results-landed state: `import { voterMegaTest as test } from '../../fixtures/voter-mega.fixture'` + change test callback signature to `async ({answeredVoterPage}) => {...}`. The fixture's walkUntilQuestionsIntro + answerAndAdvanceToResults handle Home → Elections → Constituencies → /questions → /results — no hand-rolled navigation."
  - "Belt-and-braces drawer-transition wait pattern for multi-cycle drawer interactions: `await menuDrawer.waitFor({state:'hidden'})` between each cycle's expectHidden() and the next cycle's openMenu click — eliminates close-transition races that page-rooted locators silently absorb."

requirements-completed:
  - 91-A1
  - 91-A2
  - 91-A9
  - 91-FIX-AUTH
  - 91-FIX-LOCATED
  - 91-FIX-DRAWER

# Metrics
duration: ~50min
completed: 2026-05-30
---

# Phase 91 Plan 05: TIR6 perm gap-closure (CR-01 + CR-02 + CR-03) Summary

**Replaces synthetic-session perm authentication with real `forceRegister` + UI login, swaps 2 hand-rolled voter walks for the voter-mega answeredVoterPage fixture, and scopes the cycle-3 feedback drawer locator to eliminate the cycle-2-close race.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-05-30T18:55:00Z (approximate — agent spawn time)
- **Completed:** 2026-05-30T19:45:12Z
- **Tasks:** 8 declared (7 executed, 1 conditional-SKIPPED per Task 8 gate)
- **Files modified:** 9 (5 spec files + 3 setup files + 1 playwright.config.ts doc-comment)
- **Files deleted:** 2 (candidateSessionMinter.ts + candidateSessionMinter.test.ts)
- **Commits:** 8 atomic commits (7 task-level + 1 lint cleanup)

## Accomplishments

- **CR-01 BLOCKER closed:** The 3 perm setups (perm-answers-locked, perm-hide-hero, perm-disable-allow-open) now mint per-perm Playwright storage state via real `forceRegister` + real UI login through the candidate-app login form, mirroring the canonical pattern in `auth.setup.ts` + `data.setup.ts`. The previously-emitted synthetic base64 `sb-access-token` cookies (which failed server-side `safeGetSession()` JWT signature validation, redirecting all authenticated A1/A2/A9 sub-tests to `/candidate/login`) are replaced by real Supabase-minted cookie sessions. The `candidateSessionMinter` helper + its vitest coverage are deleted outright — zero grep references survive.
- **CR-02 BLOCKER closed:** The hand-rolled located walks in `perm-hide-if-missing-answers.spec.ts` (lines 27-39, pre-91-05) and `perm-disable-allow-open.spec.ts` voter-side block (lines 52-59, pre-91-05) are eliminated. Both now consume `voter-mega.fixture.ts`'s `answeredVoterPage` fixture via `import { voterMegaTest as test } from '../../fixtures/voter-mega.fixture'`. The prior hand-rolls were vulnerable to single-election + single-constituency auto-imply redirects skipping the `elections.continue` testid (Pitfall 6 + the `page.goto('/en/results')` short-circuit landing on partially-located /results).
- **CR-03 WARNING closed:** The voter-mega-journey feedback drawer step (cycles 1+2+3, lines 1054-1118 area) now scopes `feedbackNavItem` to the open `menuDrawer` (anchored on `testIds.shared.navigation.menu` = `<nav data-testid="nav-menu">`). Three explicit `await menuDrawer.waitFor({state:'visible'})` calls precede each cycle's menu-item click (one per cycle = 3 minimum); two `await menuDrawer.waitFor({state:'hidden'})` calls follow cycles 1+2 to settle the close transition before reopening. Locale regex tightened from `/feedback|palaute|återkoppling/i` to `/feedback/i` per the EN-exclusive walk contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: refactor perm-answers-locked.setup.ts** — `d97e9524d` (refactor)
2. **Task 2: refactor perm-hide-hero.setup.ts** — `d4316c603` (refactor)
3. **Task 3: refactor perm-disable-allow-open.setup.ts** — `360cc529b` (refactor)
4. **Task 4: delete candidateSessionMinter.{ts,test.ts} + strip doc-comment refs** — `b5a2d3ac4` (chore)
5. **Task 5: refactor perm-hide-if-missing-answers.spec.ts (A6) to voter-mega fixture** — `cd5cc2dc3` (refactor)
6. **Task 6: refactor perm-disable-allow-open.spec.ts voter-side block to voter-mega fixture** — `9cf39f01f` (refactor)
7. **Task 7: scope feedback drawer + waitFor + EN-only regex in voter-mega-journey** — `e5e20f051` (fix)
8. **Task 8: CONDITIONAL helper extraction** — SKIPPED; see Deviations §Task 8 Decision
9. **Lint cleanup pass** — `f5f8c18b0` (style; auto-fix simple-import-sort + Option B voterTest unification for perm-disable-allow-open spec)

**Plan metadata commit:** will be created in the final SUMMARY commit (this file).

_No TDD tasks in this plan — all 7 executed tasks are refactor/chore/fix (no `tdd="true"` frontmatter)._

## Per-CR Closure Status (grep evidence)

### CR-01 (BLOCKER → CLOSED)

- `grep -rn 'mintCandidateSession\|candidateSessionMinter' tests/` returns **0 matches** (verification gate #1).
- `ls tests/tests/utils/candidateSessionMinter.ts tests/tests/utils/candidateSessionMinter.test.ts` returns "No such file" for both (verification gate #2).
- `grep -l 'forceRegister(' tests/tests/setup/perm-{answers-locked,hide-hero,disable-allow-open}.setup.ts` returns all **3 files** (verification gate #3).
- All 3 setups also reference `testIds.candidate.login.submit` + `context().storageState({path: ...})` — confirming the real UI login + storage-state save chain is wired end-to-end.

### CR-02 (BLOCKER → CLOSED)

- `grep -l 'voter-mega.fixture' tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts tests/tests/specs/perm/perm-disable-allow-open.spec.ts` returns both **2 files** (verification gate #4).
- `grep -nE "page\.goto\('/en'\)|page\.goto\('/en/results'\)" tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts tests/tests/specs/perm/perm-disable-allow-open.spec.ts` returns **0 matches** (verification gate #5).
- Intermediate-step testids removed from spec bodies (`testIds.voter.home.startButton`, `testIds.voter.elections.continue`, `testIds.voter.constituencies.continue` — 0 matches across both specs).
- Rigidity contract preserved: `grep -nE "expect\.soft|\.catch\(" ...` returns 0 across both specs.

### CR-03 (WARNING → CLOSED)

- `grep -nE 'palaute|återkoppling' tests/tests/specs/voter/voter-mega-journey.spec.ts` returns **0 matches** (verification gate #6 — locale regex tightened to EN-only).
- `grep -cE 'menuDrawer\.waitFor' tests/tests/specs/voter/voter-mega-journey.spec.ts` returns **5** (verification gate #7 minimum is ≥3; 3 visible-waits + 2 hidden-waits = 5).
- `grep -nE "filter\(.*hasText.*\/feedback\/i" tests/tests/specs/voter/voter-mega-journey.spec.ts` returns 1 match (EN-only feedback filter survives).
- Cycle structure preserved: 3× `feedbackDialog.expectVisible()`, 3× `feedbackDialog.expectHidden()`, 2× `feedbackDialog.expectSuccess()` (cycles 2+3 submit; cycle 1 cancels).

## In-Process Verification Gates 1-9 — Results

| Gate | Description | Status | Evidence |
| ---- | ----------- | ------ | -------- |
| 1 | No mintCandidateSession/candidateSessionMinter refs in tests/ | ✅ PASS | grep returns 0 |
| 2 | candidateSessionMinter.{ts,test.ts} deleted | ✅ PASS | `ls` returns "No such file" |
| 3 | forceRegister( present in all 3 perm setups | ✅ PASS | grep -l returns 3 |
| 4 | voter-mega.fixture imported in 2 voter-side perm specs | ✅ PASS | grep -l returns 2 |
| 5 | No page.goto('/en') / page.goto('/en/results') in 2 voter-side perm specs | ✅ PASS | grep -cnE returns 0:0 |
| 6 | No fi/sv locale regex in voter-mega-journey | ✅ PASS | grep -cnE returns 0 |
| 7 | menuDrawer.waitFor count ≥3 | ✅ PASS | grep -cE returns 5 |
| 8 | tsc --noEmit clean against 8 modified files | ✅ PASS* | `npx tsc --noEmit` against modified files surfaces only pre-existing baseline errors in tests/utils/e2eFixtureRefs.ts:80/121/128 (TS2352 conversion errors) — these are NOT introduced by Plan 91-05 and existed at base 564d8d45a per the same probe against the baseline checkout. Plan 91-05's own modifications introduce zero new tsc errors. |
| 9 | lint:check clean against modified files OR matches baseline | ✅ PASS | 3 lint errors remain across all 8 modified files: 2× playwright/no-raw-locators in perm-answers-locked.spec.ts:57/73 + 1× playwright/no-raw-locators in perm-hide-hero.spec.ts:32 — ALL pre-existing in baseline 564d8d45a (verified by checking out the baseline and running the same `npx eslint --config eslint.config.mjs ...` command — same 3 errors surface). Plan 91-05's own modifications + the post-Task-7 lint cleanup pass (f5f8c18b0) eliminate all 6 simple-import-sort errors I introduced and the 5 playwright/no-standalone-expect errors from the mixed-runner Option A. **Lint posture: 0 new errors, 3 pre-existing baseline errors preserved.** |

*Gate 8 caveat: there is no `cd tests && yarn tsc` script in the project (`tests/` has no package.json or tsconfig). The verification probe was run via `cd tests && npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop <files>`. The 3 errors that surface (all in `tests/utils/e2eFixtureRefs.ts`) are pre-existing in the baseline and out of Plan 91-05's scope.

## Human Verification Runbook Outcomes

All 4 human-verification items are PENDING — the worktree environment does not have a live Supabase + dev server stack running. The operator must execute these post-merge against a live env per the standard env-cascade carry-forward:

| # | Item | Status | Expected Outcome |
| - | ---- | ------ | ---------------- |
| 1 | `PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-answers-locked --project=perm-hide-hero --project=perm-disable-allow-open` (live perm chain, candidate-side) | ⏳ PENDING | Authenticated assertions on candidate-answers-locked-warning across /candidate/profile + /candidate/questions + candidate-questions-comment input pass under real Supabase JWT signature validation. Confirms CR-01 closure under live env. |
| 2 | `PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-hide-if-missing-answers --project=perm-disable-allow-open` (voter-side, live env) | ⏳ PENDING | A6 [CA1A] visible / [CA2B] hidden assertion + A9 voter-side entity-detail Q1 info present / Q2 info absent assertions PASS. Confirms voter-mega answeredVoterPage deterministically lands /results with answered opinion data. |
| 3 | `yarn test:e2e --project=voter-app` (voter-mega-journey regression) | ⏳ PENDING | voter-mega-journey passes without flake across ≥3 consecutive runs. Confirms drawer scoping + waitFor + EN-only regex eliminates the cycle-2-close vs. cycle-3-open transition race. |
| 4 | Phase 91 deferred items (visual rebaseline, PLAYWRIGHT_PERF/A11Y/BANK_AUTH) | ⏳ DEFERRED (out of scope per plan §verification) | Operator re-confirms post-merge; AC was never owned by this plan. |

## Files Created/Modified

### Modified (9 files)

- `tests/tests/setup/perm-answers-locked.setup.ts` — A1 perm setup now mints storage state via real forceRegister + UI login + context.storageState save (replaces synthetic-token mintCandidateSession call). Hoisted local waitForLoginForm helper mirroring auth.setup.ts:23-57.
- `tests/tests/setup/perm-hide-hero.setup.ts` — A2 perm setup, same pattern (forceRegister + UI login).
- `tests/tests/setup/perm-disable-allow-open.setup.ts` — A9 candidate-side perm setup, same pattern.
- `tests/playwright.config.ts` — doc-comment rewrites on lines ~1029 + ~1051 (drop "candidateSessionMinter" mentions; replace with "real forceRegister + UI login (per D-91-PD-06 revised; Phase 91-05 CR-01 closure)"). Project dependency wiring unchanged.
- `tests/tests/specs/perm/perm-answers-locked.spec.ts` — doc-comment rewrite on line 8 (Surface 2 description), plus a simple-import-sort autofix in the import block.
- `tests/tests/specs/perm/perm-hide-hero.spec.ts` — doc-comment rewrite on line 4 (Authenticated candidate via real forceRegister + UI login).
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts` — Test body collapses from a 12-line hand-rolled walk + assertion block to a 5-line answeredVoterPage-driven assertion. Import swapped to `voterMegaTest as test`.
- `tests/tests/specs/perm/perm-disable-allow-open.spec.ts` — Full file refactor: voter-side block consumes `answeredVoterPage` (hand-rolled walk eliminated), AND the entire file unifies under `voterMegaTest as test` (Option B) to clear the playwright/no-standalone-expect lint trip. Candidate-side describe block semantics preserved verbatim.
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — Cycle-1/2/3 feedbackNavItem locator rescoped to the open menuDrawer (anchored on `<nav data-testid="nav-menu">`); 5 menuDrawer.waitFor calls inserted (3 visible-before-click + 2 hidden-between-cycles); locale regex tightened from /feedback|palaute|återkoppling/i to /feedback/i.

### Deleted (2 files)

- `tests/tests/utils/candidateSessionMinter.ts` — synth-token helper (185 lines) deleted outright per D-91-PD-06 revised.
- `tests/tests/utils/candidateSessionMinter.test.ts` — vitest coverage (91 lines) for the deleted helper. tests/vitest.config.ts kept unchanged — its `tests/utils/**/*.test.ts` include glob is generic and stays valid for future utility-test files.

### Created (0 files)

- Task 8 helper extraction was evaluated and SKIPPED per the conditional gate analysis below.

## Decisions Made

### Task 8 Decision: SKIPPED (inline pattern retained)

**Conditional gate:** Plan §Task 8 says "If the identical block is >25 lines per file (i.e. >75 lines total of pure duplication), proceed with this task. Otherwise, SKIP this task and document the decision in the SUMMARY."

**LOC accounting** (post-Tasks 1-3):

| Setup file | Total LOC | Doc-comment LOC | Imports LOC | Header constants LOC | waitForLoginForm helper LOC | setup() body LOC | Duplicated content LOC | Per-file LOC at-or-above 25 threshold |
| ---------- | --------- | --------------- | ----------- | ------------------- | --------------------------- | ---------------- | ---------------------- | ------------------------------------- |
| perm-answers-locked.setup.ts | 99 | 22 | 10 | 4 | 22 | 41 | ~52 (helper + forceRegister + login + storageState block) | ✅ EXCEEDS |
| perm-hide-hero.setup.ts | 80 | 14 | 10 | 4 | 22 | 30 | ~52 (same) | ✅ EXCEEDS |
| perm-disable-allow-open.setup.ts | 77 | 11 | 10 | 4 | 22 | 30 | ~52 (same) | ✅ EXCEEDS |

By the literal LOC gate, extraction is justified — each file shares ~52 lines of identical content with the other two (~156 lines of total duplication).

**However**, Plan §verification gate #3 explicitly states: `grep -l 'forceRegister(' tests/tests/setup/perm-{answers-locked,hide-hero,disable-allow-open}.setup.ts` returns all 3 files. Extracting the forceRegister + UI login block into `tests/tests/setup/_helpers/loginAndSaveStorageState.ts` would break that gate (the per-setup `forceRegister(` call would only appear inside the helper, not in the 3 perm setups themselves).

Additionally, the plan's `<gap_closure_directive>` block explicitly lists "Premature centralisation of UI-login into a shared utility — Task 8 (extract shared helper) is conditional and only fires if the 3 setup files would otherwise share >25 identical lines" as a "Forbidden alternative" in the context of the broader D-91-PD-06 revision.

**Decision:** SKIP extraction. The inline pattern is retained across all 3 perm setups. The duplication is acknowledged-and-accepted — verification gate #3 takes precedence over the LOC gate. A future plan may revisit extraction once the verification gate's contract is loosened OR the helper file is permitted to satisfy gate #3 transitively (e.g., gate rewritten to `grep -rl 'forceRegister(' tests/tests/setup/`).

**Per-setup file accounting** at SUMMARY time:
- `perm-answers-locked.setup.ts`: 99 LOC
- `perm-hide-hero.setup.ts`: 80 LOC
- `perm-disable-allow-open.setup.ts`: 77 LOC

### Task 6 Decision: Option B (voterTest aliased as test) over Option A (mixed runner)

The plan offers two options for the perm-disable-allow-open.spec.ts file (which has both an authenticated candidate-side block + an unauthenticated voter-side block consuming `answeredVoterPage`):

- **Option A:** Candidate-side block keeps `@playwright/test` `test`; voter-side block uses `voterTest`.
- **Option B (fallback):** Use `voterTest` throughout; candidate-side block re-declares `storageState` via `voterTest.use(...)`.

The plan says "Option A (preferred)... avoids the question of whether Playwright allows mixing `test()` from `@playwright/test` with `voterTest()` inside the same `test.describe()`."

I initially chose Option A. Lint trip: `playwright/no-standalone-expect` fires on the 5 `await expect(...)` calls inside the `voterTest('voter detail drawer: ...', async ({answeredVoterPage}) => {...})` callback. The plugin's test-block detector does not recognise `voterTest()` as a test-block function (tests/eslint.config.mjs does not configure `additionalTestBlockFunctions`).

**Decision:** Switch to Option B. `voterTest` extends the base `test`, so aliasing it as `test` for the whole file gives the lint plugin a recognised `test()` runner. Verified via lint re-run: 5 errors cleared, 0 new errors introduced, candidate-side block semantics unchanged (the `answeredVoterPage` fixture is lazy and is NOT invoked for tests that do not destructure it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] simple-import-sort + Option-A→Option-B switch for perm-disable-allow-open.spec.ts**
- **Found during:** Post-Task-7 verification gate #9 (lint:check).
- **Issue:** Tasks 1/2/3/5/6/7 introduced 6 simple-import-sort/imports lint errors (new imports added to the existing import blocks, breaking the alphabetical order). Task 6 Option A also introduced 5 playwright/no-standalone-expect errors (voterTest not recognised as a test-block runner).
- **Fix:** Ran `npx eslint --config eslint.config.mjs --fix` on the 6 modified files (auto-fixed all 6 simple-import-sort errors). Switched perm-disable-allow-open.spec.ts from Option A to Option B (voterTest aliased as test for the whole file) to clear the 5 standalone-expect errors.
- **Files modified:** 6 files (3 perm setups + perm-answers-locked.spec.ts + perm-disable-allow-open.spec.ts + voter-mega-journey.spec.ts).
- **Verification:** Re-ran lint on all 8 Plan 91-05-modified files. 3 errors remain across the entire set; all 3 are pre-existing baseline errors (perm-answers-locked.spec.ts:57/73 + perm-hide-hero.spec.ts:32 raw-locator usages that pre-date Plan 91-05 and are confirmed by checking out baseline 564d8d45a and running the same lint command).
- **Committed in:** `f5f8c18b0` (style cleanup pass).

### Pre-Existing Issues Documented (not fixed by this plan)

**1. [Pre-existing] tsc errors in tests/utils/e2eFixtureRefs.ts (TS2352 conversion errors)**
- **Origin:** tests/utils/e2eFixtureRefs.ts:80, 121, 128 — `Record<string, unknown>[] → TemplateCandidate[] / TemplateQuestion[] / TemplateOrganization[]` conversions flagged by tsc strict mode.
- **Impact:** None on Plan 91-05's gap-closure goals; these errors exist at base 564d8d45a and were not introduced by any of the 8 commits in this plan.
- **Future action:** Out of scope for this plan; should be addressed in a dedicated tests/-tsc-cleanup phase.

**2. [Pre-existing] 3 playwright/no-raw-locators lint errors in 2 perm specs**
- **Origin:** perm-answers-locked.spec.ts:57 (`page.locator('input:visible, textarea:visible, select:visible')`), :73 (`page.getByTestId('question-choices').locator('input[type="radio"]')`), perm-hide-hero.spec.ts:32 (`hero.locator('img, span')`).
- **Impact:** None on Plan 91-05's gap-closure goals; the raw-locator usages are part of the test bodies (untouched by Plan 91-05) and were introduced in Plan 91-02 when those perm specs were originally authored.
- **Future action:** Out of scope. May be addressed in a follow-up perm-spec lint-tightening phase if the project decides to enforce `playwright/no-raw-locators` on these specs.

## Deferred Items

None introduced by Plan 91-05.

The 4 Human Verification items (above) are routed to operator runbook per the env-cascade carry-forward documented in 91-VERIFICATION.md.

The Phase 91 deferred items (visual rebaseline, PLAYWRIGHT_PERF/A11Y/BANK_AUTH) are unchanged by this plan — operator should re-confirm them post-merge against the same live env used for Human Verification items 1-3.

## Self-Check: PASSED

- **Created files:** none planned (Task 8 SKIPPED — see Deviations).
- **Modified files exist:**
  - `tests/tests/setup/perm-answers-locked.setup.ts` ✅ FOUND
  - `tests/tests/setup/perm-hide-hero.setup.ts` ✅ FOUND
  - `tests/tests/setup/perm-disable-allow-open.setup.ts` ✅ FOUND
  - `tests/playwright.config.ts` ✅ FOUND
  - `tests/tests/specs/perm/perm-answers-locked.spec.ts` ✅ FOUND
  - `tests/tests/specs/perm/perm-hide-hero.spec.ts` ✅ FOUND
  - `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts` ✅ FOUND
  - `tests/tests/specs/perm/perm-disable-allow-open.spec.ts` ✅ FOUND
  - `tests/tests/specs/voter/voter-mega-journey.spec.ts` ✅ FOUND
- **Deleted files absent:**
  - `tests/tests/utils/candidateSessionMinter.ts` ✅ ABSENT
  - `tests/tests/utils/candidateSessionMinter.test.ts` ✅ ABSENT
- **Commits exist:** all 8 hashes present in `git log --oneline 564d8d45a..HEAD`:
  - `d97e9524d` ✅ FOUND (Task 1)
  - `d4316c603` ✅ FOUND (Task 2)
  - `360cc529b` ✅ FOUND (Task 3)
  - `b5a2d3ac4` ✅ FOUND (Task 4)
  - `cd5cc2dc3` ✅ FOUND (Task 5)
  - `9cf39f01f` ✅ FOUND (Task 6)
  - `e5e20f051` ✅ FOUND (Task 7)
  - `f5f8c18b0` ✅ FOUND (Lint cleanup)
