---
phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
verified: 2026-05-30T23:30:00Z
status: passed
score: 22/22 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 14/22
  gaps_closed:
    - "candidateSessionMinter helper deleted; A1/A2/A9 perm setups mint real Supabase sessions via forceRegister + UI login (CR-01 BLOCKER)"
    - "perm-hide-if-missing-answers + perm-disable-allow-open voter-side block consume voter-mega.fixture.ts answeredVoterPage; hand-rolled located walks eliminated (CR-02 BLOCKER)"
    - "voter-mega-journey cycle-3 (and cycles 1+2) feedback drawer reopen scoped to open menuDrawer testid; 5 explicit waitFor calls inserted; locale regex tightened to EN-only (CR-03 WARNING)"
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "All 9 TIR6 perm chains run green via PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-*"
    addressed_in: "Operator-driven runtime verification (env-cascade carry-forward documented Phase 89-03 / 89-04 / 90 / 91-02 / 91-03 / 91-05)"
    evidence: "Plan 91-05 §Human Verification items 1-3 explicitly defer runtime to operator runbook post-merge. Static-grep + spec-load gates PASS in-process. CR-01 fix (forceRegister + real UI login) is the prerequisite for items 1-2 to PASS; now unblocked."
  - truth: "Visual regression baselines regenerated via PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression --update-snapshots"
    addressed_in: "CI follow-up commit (D-91-RS-01 contract)"
    evidence: "Plan 91-04 SUMMARY §CI Rebaseline Follow-up: PNG baselines at tests/tests/specs/visual/__screenshots__/ must be regenerated on canonical CI runner. Developer-font-rendering nondeterminism; explicit CI-driven rebaseline locked in plan. Not impacted by Plan 91-05 changes."
human_verification:
  - test: "Run yarn db:reset && yarn dev (wait healthy), then PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-answers-locked --project=perm-hide-hero --project=perm-disable-allow-open (sequential chain anchored on perm-localisation-positive setup)"
    expected: "All 3 projects PASS. Authenticated assertions on candidate-answers-locked-warning across /candidate/profile + /candidate/questions (A1), candidate-questions-hero hide (A2), and candidate-side comment-input block (A9) survive server-side safeGetSession() JWT validation. Confirms CR-01 closure under live env."
    why_human: "Live Supabase + dev server required. forceRegister + real UI login mint is structurally correct (verified by code inspection) but the JWT must be validated by GoTrue at runtime."
  - test: "Run PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-hide-if-missing-answers --project=perm-disable-allow-open (voter-side blocks) against live env"
    expected: "A6 [CA1A] visible / [CA2B] hidden assertion on /results PASSES. A9 voter-side entity-detail Q1 info present / Q2 info absent PASSES. Confirms voter-mega answeredVoterPage deterministically lands /results with answered opinion data."
    why_human: "Live dev server + Supabase required for the voter-mega fixture walks."
  - test: "Run yarn test:e2e --project=voter-app against live env (at least 3 consecutive runs)"
    expected: "voter-mega-journey passes without flake. Confirms drawer-scoping + 5 waitFor calls + EN-only regex eliminates the cycle-2-close vs. cycle-3-open transition race."
    why_human: "Flakiness only observable under runtime; serial-mode containment is not a reliable substitute for the waitFor fix."
  - test: "Run PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression --update-snapshots on canonical CI runner, then re-run without --update-snapshots"
    expected: "4 PNG files regenerate; subsequent re-run produces 0 visual diffs."
    why_human: "Requires canonical CI runner font rendering (D-91-RS-01 contract)."
  - test: "Run PLAYWRIGHT_PERF=1 npx playwright test --project=performance against live yarn dev"
    expected: "domContentLoaded < 8000ms + loadComplete < 15000ms thresholds satisfied post-fixture-migration."
    why_human: "Live dev server + Supabase required; perf is a regression gate."
  - test: "Run PLAYWRIGHT_A11Y=1 npx playwright test --project=a11y-smoke against live yarn dev"
    expected: "All 6 routes pass per-rule axe-id assertions AND global 0-violation gate."
    why_human: "Live dev server required for the fixture walks; axe scan runs against rendered DOM."
  - test: "Run PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth with Supabase Edge Function served via cd apps/supabase && npx supabase functions serve --no-verify-jwt"
    expected: "All 6 bank-auth tests pass with @playwright/test direct import."
    why_human: "Bank-auth Edge Function must be served separately with --no-verify-jwt; operator-driven runbook."
---

# Phase 91: TIR6 perm + edit test additions + visual/perf/a11y/bank-auth refactor — Re-Verification Report

**Phase Goal:** Close the v2.10 TIR backlog by landing TIR6's 9 new settings-permutation perm chains, 3 new edit-step blocks absorbed into the canonical mega-journey specs, and migrating 4 existing spec families onto voter-mega fixtures — all without regressing the all-green-suite invariant.

**Verified:** 2026-05-30T23:30:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plan 91-05, commits d97e9524d through adda740ef)

## Re-verification Focus

The prior verification (2026-05-30T22:00:00Z) returned `gaps_found` with score 14/22 and three Critical findings:

- **CR-01 BLOCKER** — `candidateSessionMinter.ts` emitted synthetic base64 tokens that failed server-side `safeGetSession()` JWT signature validation; authenticated perm specs A1/A2/A9 would redirect to /candidate/login.
- **CR-02 BLOCKER** — `perm-hide-if-missing-answers.spec.ts` + `perm-disable-allow-open.spec.ts` (voter-side block) hand-rolled the located walk, vulnerable to single-election + single-constituency auto-imply.
- **CR-03 WARNING** — voter-mega-journey cycle-3 feedback drawer reopen used a page-rooted locator with no `waitFor`, racing against the cycle-2 close transition; locale regex over-broad for EN-only walk.

Plan 91-05 (committed 2026-05-30) addresses all three. This re-verification confirms closure.

## In-Process Gates — Results

All 7 in-process gates from Plan 91-05 `<verification>` block were executed. Results:

| Gate | Command | Expected | Result | Status |
| ---- | ------- | -------- | ------ | ------ |
| CR-01 G1 | `grep -rn 'mintCandidateSession\|candidateSessionMinter' tests/` | 0 source matches | 1 match — vitest cache in `tests/node_modules/.vite/vitest/*.json` only (not source code) | PASS — cache artifact, not source |
| CR-01 G2 | `ls tests/tests/utils/candidateSessionMinter.ts` | "No such file" | No such file | PASS |
| CR-01 G2b | `ls tests/tests/utils/candidateSessionMinter.test.ts` | "No such file" | No such file | PASS |
| CR-01 G3 | `grep -l 'forceRegister(' tests/tests/setup/perm-{answers-locked,hide-hero,disable-allow-open}.setup.ts` | all 3 files | all 3 files | PASS |
| CR-01 G3b | `grep -l 'testIds.candidate.login.submit' tests/tests/setup/perm-{answers-locked,hide-hero,disable-allow-open}.setup.ts` | all 3 files | all 3 files | PASS |
| CR-02 G4 | `grep -l 'voter-mega.fixture' tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts tests/tests/specs/perm/perm-disable-allow-open.spec.ts` | both files | both files | PASS |
| CR-02 G5 | `grep -nE "page\.goto\('/en'\)\|page\.goto\('/en/results'\)" tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts tests/tests/specs/perm/perm-disable-allow-open.spec.ts` | 0 matches | 0 matches | PASS |
| CR-02 G5b | `grep -nE "expect\.soft\|\.catch\(" tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts tests/tests/specs/perm/perm-disable-allow-open.spec.ts` | 0 matches | 0 matches | PASS |
| CR-03 G6 | `grep -nE 'palaute\|återkoppling' tests/tests/specs/voter/voter-mega-journey.spec.ts` | 0 matches | 0 matches | PASS |
| CR-03 G7 | `grep -cE 'menuDrawer\.waitFor' tests/tests/specs/voter/voter-mega-journey.spec.ts` | >= 3 | 5 (3 visible-waits + 2 hidden-waits) | PASS |
| CR-03 G7b | `grep -nE 'getByRole..dialog\|menuDrawer = page\.getByTestId' tests/tests/specs/voter/voter-mega-journey.spec.ts` | >= 1 match | line 1072: `menuDrawer = page.getByTestId(testIds.shared.navigation.menu)` | PASS |

**Note on Gate 1 cache hit:** The single grep match for `candidateSessionMinter` falls within `tests/node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` — a vitest run-cache file recording historical test results. This is not source code and does not affect the build, TypeScript compilation, or Playwright execution. The actual source files `candidateSessionMinter.ts` and `candidateSessionMinter.test.ts` are absent (confirmed via `ls`). No import or call-site survives in tests/ source.

## Goal Achievement

### Observable Truths (Full Re-Verification)

Previously-VERIFIED truths are spot-checked for regression; previously-FAILED/PARTIAL truths receive full 3-level re-verification.

| # | Truth | Status | Evidence / Change from prior |
| --- | ----- | ------ | ---- |
| 1 | buildMinimal helper exists with full API + barrel export | ✓ VERIFIED | Unchanged from prior — no regression introduced by Plan 91-05 |
| 2 | A1/A2/A9 perm setups mint a real authenticated Supabase session (CR-01) | ✓ VERIFIED | `candidateSessionMinter.ts` deleted. All 3 setups contain `forceRegister(` + `testIds.candidate.login.submit` + `context().storageState({path})`. Code-inspected: perm-answers-locked.setup.ts:86, perm-hide-hero.setup.ts:70, perm-disable-allow-open.setup.ts:67. The waitForLoginForm helper (auth.setup.ts pattern) is hoisted inline in each file (Task 8 extraction SKIPPED per plan gate). |
| 3 | shared.ts builders use named-params signatures | ✓ VERIFIED | Unchanged — no regression |
| 4 | 6 minimal-topology perm templates ported to buildMinimal | ✓ VERIFIED | Unchanged — no regression |
| 5 | 7 new testids land on Banner / candidate login / 3 protected surfaces | ✓ VERIFIED | Unchanged — no regression |
| 6 | testIds.ts gains 8 new entries | ✓ VERIFIED | Unchanged — no regression |
| 7 | 9 new TIR6 perm templates exist with correct externalIdPrefixes | ✓ VERIFIED | Unchanged — no regression |
| 8 | templates/index.ts registers 9 BUILT_IN_TEMPLATES + 9 re-exports | ✓ VERIFIED | Unchanged — no regression |
| 9 | 9 new setup + 9 new teardown files under tests/tests/setup/ | ✓ VERIFIED | Files present; import of deleted `candidateSessionMinter` removed from 3 files by Plan 91-05. All 9 setup files call `setupFromTemplate` (grep confirms 22 matches across all 9 perm-*.setup.ts files — 9 setup + 9 teardown present). |
| 10 | 9 new perm spec files use strict-fixture pattern (no expect.soft / .catch) | ✓ VERIFIED | All 9 present; ZERO `expect.soft` / `.catch()` matches across all 9. Prior CR-02 PARTIAL now fully resolved for A6 + A9 voter-side blocks (see Truth 11-12 below). |
| 11 | A1 perm spec exercises FULL 3-SURFACE coverage; runtime path unblocked by CR-01 fix | ✓ VERIFIED (structural) | Spec structure intact: 2 describe blocks (unauthenticated surface 1 + authenticated surfaces 2+3 via storageState). Runtime path now depends on real Supabase JWT from `forceRegister` + UI login — unblocked structurally. Runtime confirmation deferred to Human Verification item 1. |
| 12 | perm-disable-allow-open implements D-91-PD-04 typo resolution; both sides functional | ✓ VERIFIED (structural) | Candidate-side: authenticated block preserved, storage-state minted by real forceRegister + UI login (CR-01 closed). Voter-side: hand-rolled walk eliminated; `answeredVoterPage` fixture consumed (CR-02 closed). Runtime deferred to Human Verification items 1-2. |
| 13 | 27 new playwright.config.ts project entries form sequential chain | ✓ VERIFIED | Unchanged — doc-comment rewrites only in Task 4; dependency wiring untouched |
| 14 | feedbackDialog.fixture.ts exists with full factory + RESEARCH §Pattern 2 surface | ✓ VERIFIED | Unchanged — no regression |
| 15 | Feedback.svelte submit button gains data-status={status} attribute | ✓ VERIFIED | Unchanged — no regression |
| 16 | Input.svelte:641 inline ErrorMessage gains data-testid="input-error" | ✓ VERIFIED | Unchanged — no regression |
| 17 | candidate-mega-journey.spec.ts gains step 13.5 invalidUrl | ✓ VERIFIED | Unchanged — no regression |
| 18 | voter-mega-journey.spec.ts gains feedbackDialog + all-nominations steps; cycle-3 drawer scoped (CR-03) | ✓ VERIFIED | CR-03 closed: `menuDrawer = page.getByTestId(testIds.shared.navigation.menu)` (line 1072); `feedbackNavItem` anchored on `menuDrawer` (line 1073-1075); 5 `menuDrawer.waitFor` calls (3 `visible` + 2 `hidden`); locale regex `/feedback/i` EN-only. Cycle structure verified: 3 expectVisible, 3 expectHidden, 2 expectSuccess. |
| 19 | voter-feedback-persistence.spec.ts deleted | ✓ VERIFIED | Unchanged — file still absent |
| 20 | voter-mega.fixture.ts gains locatedVoterPage; voter.fixture.ts gains @deprecated JSDoc | ✓ VERIFIED | Unchanged — no regression |
| 21 | visual + perf + a11y specs migrated to voter-mega fixtures; bank-auth import swapped | ✓ VERIFIED | Unchanged — no regression |
| 22 | Audit clean: no Phase 88-91 new specs import legacy voter.fixture.ts | ✓ VERIFIED | All 9 perm specs + 2 mega-journey specs: ZERO legacy `voter.fixture` import matches. Legacy imports in pre-existing voter/ specs (voter-detail.spec.ts, voter-popups.spec.ts, etc.) are pre-91 and out of scope. |

**Score:** 22/22 truths VERIFIED.

### Deferred Items

Items not yet met but explicitly addressed in later operator-driven verification phases.

| # | Item | Addressed In | Evidence |
| --- | --- | --- | --- |
| 1 | All 9 TIR6 perm chains run green via `yarn test:e2e --project=perm-*` | Operator-driven runtime verification post-merge | Plan 91-05 §Human Verification items 1-2 explicit deferral; CR-01 + CR-02 structural fixes unblock the runtime path. |
| 2 | Visual regression baselines regenerated | CI follow-up commit (D-91-RS-01) | Plan 91-04 SUMMARY §CI Rebaseline Follow-up; not impacted by Plan 91-05 changes. |

### Required Artifacts (Regression Spot-Check)

| Artifact | Status | Notes |
| -------- | ------ | ----- |
| `tests/tests/utils/candidateSessionMinter.ts` | ✓ DELETED (correct) | Absent per CR-01 closure |
| `tests/tests/utils/candidateSessionMinter.test.ts` | ✓ DELETED (correct) | Absent per CR-01 closure |
| `tests/tests/setup/perm-answers-locked.setup.ts` | ✓ VERIFIED | forceRegister + real UI login; exports STORAGE_STATE_PATH; calls setupFromTemplate |
| `tests/tests/setup/perm-hide-hero.setup.ts` | ✓ VERIFIED | Same pattern, A2 prefix |
| `tests/tests/setup/perm-disable-allow-open.setup.ts` | ✓ VERIFIED | Same pattern, A9 prefix (e2e-perm-no-allowopen-) |
| `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts` | ✓ VERIFIED | Imports `voterMegaTest as test`; `answeredVoterPage` consumed in callback; 0 hand-rolled walk; asserts [CA1A] visible / [CA2B] absent |
| `tests/tests/specs/perm/perm-disable-allow-open.spec.ts` | ✓ VERIFIED | Option B (voterMegaTest as test for whole file); candidate-side block preserved; voter-side `answeredVoterPage`; 0 hand-rolled walk |
| `tests/tests/specs/voter/voter-mega-journey.spec.ts` | ✓ VERIFIED | menuDrawer scoped to `testIds.shared.navigation.menu`; 5 waitFor calls; EN-only regex |

### Key Link Verification (Gap-Closure Items)

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| A1/A2/A9 perm setups | `forceRegister` in SupabaseAdminClient | `client.forceRegister(externalId, email, password)` call after `unregisterCandidate` | ✓ WIRED | All 3 setup files contain the invocation chain: unregisterCandidate → forceRegister → UI login → storageState |
| A1/A2/A9 perm setups | Real Supabase session storage | `context().storageState({ path: STORAGE_STATE_PATH })` after successful `expect(page).not.toHaveURL(/.*login.*/)` | ✓ WIRED | All 3 setup files: the storageState write is gated on confirmed non-login URL post-submit |
| `perm-hide-if-missing-answers.spec.ts` | `voter-mega.fixture.ts` answeredVoterPage | `import { voterMegaTest as test }` + `async ({ answeredVoterPage }) => {}` | ✓ WIRED | File line 33 import + line 37-47 test callback consuming `answeredVoterPage` |
| `perm-disable-allow-open.spec.ts` voter-side | `voter-mega.fixture.ts` answeredVoterPage | `import { voterMegaTest as test }` + voter-side block `async ({ answeredVoterPage }) => {}` | ✓ WIRED | File line 39 import; voter-side test callback at line 66 |
| voter-mega-journey cycle-1/2/3 | open `menuDrawer` nav element | `menuDrawer = page.getByTestId(testIds.shared.navigation.menu)` + `menuDrawer.waitFor({state:'visible'})` | ✓ WIRED | Line 1072 drawer anchor; lines 1079, 1094, 1109 waitFor calls preceding each menu-item click |
| feedbackNavItem locator | open menuDrawer scope | `menuDrawer.getByTestId(testIds.shared.navigation.menuItem).filter({hasText: /feedback/i})` | ✓ WIRED | Lines 1073-1075; anchored on the open drawer, not page root |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| CR-01 source excised | `grep -rn 'mintCandidateSession\|candidateSessionMinter' tests/` | 1 cache-only hit in `node_modules/.vite/vitest/` — no source match | PASS |
| candidateSessionMinter files deleted | `ls tests/tests/utils/candidateSessionMinter.{ts,test.ts}` | No such file (both) | PASS |
| forceRegister in all 3 A1/A2/A9 setups | `grep -l 'forceRegister(' tests/tests/setup/perm-{answers-locked,hide-hero,disable-allow-open}.setup.ts` | all 3 | PASS |
| CR-02 voter-mega fixture imported | `grep -l 'voter-mega.fixture' tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts tests/tests/specs/perm/perm-disable-allow-open.spec.ts` | both files | PASS |
| CR-02 hand-rolled walk eliminated | `grep -nE "page\.goto\('/en'\)\|page\.goto\('/en/results'\)" perm-hide-if-missing-answers.spec.ts perm-disable-allow-open.spec.ts` | 0 matches | PASS |
| CR-02 rigidity contract | `grep -nE "expect\.soft\|\.catch\(" perm-hide-if-missing-answers.spec.ts perm-disable-allow-open.spec.ts` | 0 matches | PASS |
| CR-03 EN-only regex | `grep -nE 'palaute\|återkoppling' voter-mega-journey.spec.ts` | 0 matches | PASS |
| CR-03 waitFor count | `grep -cE 'menuDrawer\.waitFor' voter-mega-journey.spec.ts` | 5 (>= 3 minimum) | PASS |
| CR-03 drawer scoped | `grep -nE 'menuDrawer = page\.getByTestId' voter-mega-journey.spec.ts` | 1 match at line 1072 | PASS |
| CR-03 EN-only feedback filter survives | `grep -nE 'filter.*hasText.*/feedback/i' voter-mega-journey.spec.ts` | 1 match at line 1075 | PASS |
| Cycle structure intact | expectVisible × 3, expectHidden × 3, expectSuccess × 2 | 3/3/2 confirmed | PASS |
| Audit clean (new specs) | `grep -lE "from '../../fixtures/voter\.fixture'" tests/tests/specs/perm/` | 0 files | PASS |
| Rigidity across all 9 perm specs | `grep -nE "expect\.soft" tests/tests/specs/perm/*.spec.ts` | 0 matches | PASS |

### Requirements Coverage (Plan 91-05 requirements only)

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| 91-FIX-AUTH | ✓ SATISFIED | `candidateSessionMinter` deleted; A1/A2/A9 setups use forceRegister + UI login |
| 91-FIX-LOCATED | ✓ SATISFIED | Both voter-side perm specs consume `answeredVoterPage`; hand-rolled walks removed |
| 91-FIX-DRAWER | ✓ SATISFIED | Drawer-scoped locator + 5 waitFor calls + EN-only regex in voter-mega-journey |
| 91-A1 | ✓ SATISFIED (structural) | Setup mints real session; spec structure intact; runtime deferred to human verification |
| 91-A2 | ✓ SATISFIED (structural) | Same as A1 |
| 91-A9 | ✓ SATISFIED (structural) | Both candidate-side (CR-01 closed) and voter-side (CR-02 closed) blocks correct |

### Anti-Patterns Scan (Plan 91-05 modified files)

No new anti-patterns introduced. Pre-existing items from prior verification:

| File | Line | Pattern | Severity | Status |
| ---- | ---- | ------- | -------- | ------ |
| `tests/tests/specs/perm/perm-answers-locked.spec.ts` | 57, 73 | `playwright/no-raw-locators` pre-existing lint warnings | ⚠️ WARNING | Pre-existing baseline (also present at commit 564d8d45a); not introduced by Plan 91-05 |
| `tests/tests/specs/perm/perm-hide-hero.spec.ts` | 32 | `playwright/no-raw-locators` pre-existing lint warning | ⚠️ WARNING | Pre-existing baseline |
| `tests/tests/utils/e2eFixtureRefs.ts` | 80, 121, 128 | TS2352 conversion errors (pre-existing) | ⚠️ WARNING | Pre-existing; not introduced by Plan 91-05; isolated to tests/utils/ infra file |

All three CRs from the prior verification report have been remediated. The `candidateSessionMinter` helper is fully excised from source (only a vitest run-cache artifact remains in node_modules). The synthetic-token anti-pattern (prior 🛑 BLOCKER CR-01) no longer exists in any source file.

### Human Verification Required

See `human_verification` section in YAML frontmatter — 7 items routed to operator for live-environment execution. The first 3 (perm chain candidate-side, perm chain voter-side, voter-mega-journey regression) directly confirm the 3 CR closures under runtime. Items 4-7 are carry-forward from the prior verification's env-cascade deferred items.

1. **Live perm chain runs, candidate-side** — `PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-answers-locked --project=perm-hide-hero --project=perm-disable-allow-open` against live Supabase. Confirms CR-01 closure: forceRegister + UI login produce a real signed Supabase JWT that survives `safeGetSession()` server-side JWT validation on the protected candidate layout.
2. **Live perm chain runs, voter-side** — `PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-hide-if-missing-answers --project=perm-disable-allow-open` against live env. Confirms CR-02 closure: voter-mega `answeredVoterPage` lands deterministically on /results with answered opinion data, enabling card-visibility and entity-detail assertions.
3. **voter-mega-journey regression** — `yarn test:e2e --project=voter-app` x 3 consecutive runs. Confirms CR-03 closure: drawer-scoped locator + waitFor + EN-only regex eliminate the cycle-2-close transition race.
4. **Visual rebaseline** — `PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression --update-snapshots` on canonical CI runner per D-91-RS-01 contract.
5. **PLAYWRIGHT_PERF=1** against live dev — budgets unchanged; regression gate only.
6. **PLAYWRIGHT_A11Y=1** against live dev — per-rule axe IDs + 0-violation gate.
7. **PLAYWRIGHT_BANK_AUTH=1** with Edge Function `--no-verify-jwt` — operator-driven runbook per plan AC.

### Gaps Summary

No actionable gaps remain. All 3 CRs from the prior verification are structurally closed by Plan 91-05:

- **CR-01 (BLOCKER) — CLOSED:** `candidateSessionMinter.ts` and its vitest coverage are deleted. All 3 A1/A2/A9 perm setups now mint Playwright storage state via real `forceRegister` + real UI login + `context().storageState({path})`, mirroring the canonical pattern from `auth.setup.ts` + `data.setup.ts`. The synthetic base64 token that failed `safeGetSession()` JWT signature validation is gone from all source files.

- **CR-02 (BLOCKER) — CLOSED:** `perm-hide-if-missing-answers.spec.ts` and the voter-side block of `perm-disable-allow-open.spec.ts` both consume `voter-mega.fixture.ts`'s `answeredVoterPage` fixture. The hand-rolled `page.goto('/en') → home.startButton → elections.continue → constituencies.continue → goto('/en/results')` chains are fully removed. The fixture's `walkUntilQuestionsIntro` + `answerAndAdvanceToResults` handle the canonical located walk robustly under single-election + single-constituency auto-imply.

- **CR-03 (WARNING) — CLOSED:** The voter-mega-journey feedback drawer step (cycles 1+2+3) now anchors `feedbackNavItem` on `menuDrawer = page.getByTestId(testIds.shared.navigation.menu)` (the `<nav data-testid="nav-menu">` element in Navigation.svelte). Five explicit `menuDrawer.waitFor` calls are present (3 `{state:'visible'}` before each menu-item click + 2 `{state:'hidden'}` between cycles). Locale regex tightened from `/feedback|palaute|återkoppling/i` to `/feedback/i` per the EN-exclusive walk contract.

The 7 human verification items are environmental (live Supabase + dev server) and are routed to operator post-merge per the env-cascade carry-forward established in Phase 89. They do not constitute plan-level gaps — the structural implementation enabling their PASS is in place.

---

_Verified: 2026-05-30T23:30:00Z_
_Verifier: Claude (gsd-verifier) — Re-verification after Plan 91-05 gap closure_
