---
phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
verified: 2026-05-30T22:00:00Z
status: gaps_found
score: 14/22 must-haves verified
overrides_applied: 0
gaps:
  - truth: "candidateSessionMinter helper mints a usable authenticated Supabase session for A1/A2/A9 perm specs (D-91-PD-06)"
    status: failed
    reason: "Helper synthesises base64-encoded `${authUserId}.${candidateEmail}.${Date.now()}` strings and writes them as `sb-access-token` / `sb-refresh-token` cookies + `sb-auth-token` localStorage. None of these are real JWTs signed by Supabase GoTrue. The candidate-protected layout calls `safeGetSession()` server-side which validates the JWT signature — synthetic base64 will fail validation and the protected layout will redirect every authenticated A1/A2/A9 sub-test to /candidate/login. The doc-comment on lines 118-131 of the helper acknowledges this is a synth-stub awaiting live-Supabase integration but Plan 91-02 consumes it as if it were the real integration."
    artifacts:
      - path: "tests/tests/utils/candidateSessionMinter.ts"
        issue: "Lines 132-134 emit `Buffer.from(sessionTokenBase).toString('base64')` instead of calling `client.client.auth.admin.generateLink({ type: 'magiclink' })` + exchangeCodeForSession. 5 perm specs (perm-answers-locked surfaces 2+3, perm-hide-hero, perm-disable-allow-open candidate-side) depend on this for live runs."
    missing:
      - "Replace synth-token block with `auth.admin.generateLink({ type: 'magiclink', email })` + exchangeCodeForSession to mint a real signed session, OR use `auth.admin.setSession()` pattern mirrored from tests/tests/setup/auth.setup.ts"
      - "Verify live E2E run of perm-answers-locked surfaces 2+3 + perm-hide-hero + perm-disable-allow-open candidate-side after the fix"
  - truth: "perm-hide-if-missing-answers + perm-disable-allow-open voter walks use the canonical located voter flow (per Pitfall 6 + D-91-RS-02b located-fixture pattern)"
    status: failed
    reason: "Both specs hand-roll page.goto('/en') + click(home.startButton) + waitFor(elections.continue) + click + waitFor(constituencies.continue) + click + page.goto('/en/results'). With single-election + single-constituency baseline the home start often auto-redirects past /en/elections, leaving the elections.continue testid never to appear → toBeVisible() times out → goto('/en/results') short-circuits to a partially-located /results. The natural redirect chain constituencies.continue → /questions → /results is also bypassed without a waitForURL settle."
    artifacts:
      - path: "tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts"
        issue: "Lines 27-39 hand-roll the located walk instead of consuming voterMegaTest fixtures or adding waitForURL"
      - path: "tests/tests/specs/perm/perm-disable-allow-open.spec.ts"
        issue: "Lines 52-59 same anti-pattern"
    missing:
      - "Consume locatedVoterPage / answeredVoterPage fixture from voter-mega.fixture.ts OR add waitForURL settle after constituencies.continue.click()"
  - truth: "voter-mega-journey feedbackDialog step is robust against drawer-close races between cycles (per Pitfall 7 + strict-fixture contract)"
    status: partial
    reason: "Cycle 3 reopen relies on `page.getByTestId(testIds.shared.navigation.menuItem).filter({ hasText: /feedback|palaute|återkoppling/i })` without scoping to the open drawer dialog. If the menu drawer is still in DOM during cycle-2 close transition, the menuItem locator can race against the drawer close. Additionally, the locale-regex hardcodes 2 non-EN locales (fi + sv) but the mega-journey is EN-only — over-broad for the EN-only walk and under-broad if any non-EN contingency runs."
    artifacts:
      - path: "tests/tests/specs/voter/voter-mega-journey.spec.ts"
        issue: "Lines 1067-1102 — feedbackNavItem locator unscoped to the drawer; no openMenu drawer.waitFor({state:'visible'}) between drawer toggle click and menu-item click"
    missing:
      - "Scope feedbackNavItem to the open drawer locator (getByRole('dialog', { name: /menu/i }) or use the drawer's testid)"
      - "Add explicit await openMenu drawer.waitFor({state:'visible'}) between toggle click and menu-item click"
deferred:
  - truth: "All 9 TIR6 perm chains run green via PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-*"
    addressed_in: "Operator-driven runtime verification (env-cascade carry-forward documented Phase 89-03 / 89-04 / 90 / 91-02 / 91-03)"
    evidence: "Plan 91-02 SUMMARY §E2E Run Status acknowledges runtime e2e requires live yarn dev + Supabase; static-grep + spec-load gates PASS in-process; runtime PASS deferred to operator runbook. Phase 91-04 SUMMARY §Acceptance criterion reconciliation similarly defers PLAYWRIGHT_PERF/A11Y/BANK_AUTH project runs."
  - truth: "Visual regression baselines regenerated via PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression --update-snapshots"
    addressed_in: "CI follow-up commit (D-91-RS-01 contract)"
    evidence: "Plan 91-04 SUMMARY §CI Rebaseline Follow-up: 'The visual-regression PNG baselines at tests/tests/specs/visual/__screenshots__/ are NOT regenerated in this plan's commits. The rebaseline must happen on the canonical CI runner via PLAYWRIGHT_VISUAL=1 PLAYWRIGHT_LEGACY=1 npx playwright test ... --update-snapshots'. Developer-font-rendering nondeterminism per D-91-RS-01 contract; explicit CI-driven rebaseline locked in plan."
human_verification:
  - test: "Run yarn dev + execute PLAYWRIGHT_PERM=1 yarn test:e2e --project=perm-answers-locked through --project=perm-disable-allow-open against a clean local Supabase instance"
    expected: "All 9 new TIR6 perm projects exit 0 (sequential chain anchored on perm-localisation-positive). Specifically, the A1 authenticated surfaces 2+3, the A2 authenticated /candidate/questions hero hide, and the A9 candidate-side describe block all PASS (not redirected to /candidate/login by a session validation failure)."
    why_human: "Live Supabase + dev server + sequential chain required; in-process verifier cannot execute Playwright projects. CR-01 (candidateSessionMinter) means runtime is REQUIRED to confirm the authenticated specs actually fire their assertions against the protected route — currently the gap is structural; runtime confirms whether the synth-token bypasses guard or fails as the reviewer predicts."
  - test: "Run PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression --update-snapshots on canonical CI runner, then PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression to confirm the project goes green"
    expected: "4 PNG files regenerate at tests/tests/specs/visual/__screenshots__/ (voter-results-desktop/mobile, candidate-preview-desktop/mobile); subsequent re-run with the same canonical runner produces 0 visual diffs."
    why_human: "Requires canonical CI runner font rendering (D-91-RS-01 contract); developer machines vary. The spec-migration code lands clean; only the PNG baselines remain CI-driven."
  - test: "Run PLAYWRIGHT_PERF=1 npx playwright test --project=performance against live yarn dev"
    expected: "domContentLoaded < 8000ms + loadComplete < 15000ms thresholds satisfied post-fixture-migration (no threshold tightening per D-91-RS-02)."
    why_human: "Live dev server + Supabase required; perf is a regression gate, not an absolute target — operator verification of post-migration P90."
  - test: "Run PLAYWRIGHT_A11Y=1 npx playwright test --project=a11y-smoke against live yarn dev"
    expected: "All 6 routes (home, elections-selector, constituencies-selector, questions, results, voter-detail-drawer) pass per-rule axe-id assertions AND global 0-violation gate. Located routes now consume voter-mega fixtures rather than SupabaseAdminClient.findData UUID resolution; WCAG 2.1 AA discipline preserved."
    why_human: "Live dev server + Supabase required for the fixture walks; axe scan runs against rendered DOM in real browser."
  - test: "Run PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth with Supabase Edge Function served via `cd apps/supabase && npx supabase functions serve --no-verify-jwt`"
    expected: "All 6 bank-auth tests pass with @playwright/test direct import (JWE synthesis intact, env-gating intact, ZERO soft assertions in 313-line spec body)."
    why_human: "Bank-auth Edge Function must be served separately with --no-verify-jwt; operator-driven runbook explicitly documented in plan AC."
  - test: "Visual confirmation that the conditional `data-testid={answersLocked ? 'login-answers-locked-info' : undefined}` on candidate/login/+page.svelte:156 renders the testid attribute ONLY when access.answersLocked=true seeds the DOM"
    expected: "perm-answers-locked surface 1 (unauthenticated /en/candidate) shows the testid; default e2e seed (no perm overlay) shows no testid on the same <p>."
    why_human: "Runtime DOM inspection under perm seed vs default seed — exercises the conditional binding correctness."
---

# Phase 91: TIR6 perm + edit test additions + visual/perf/a11y/bank-auth refactor — Verification Report

**Phase Goal:** Land the foundation helpers (buildMinimal, candidateSessionMinter, named-params shared.ts), the 9 new TIR6 settings-permutation chains (A1–A9), the 3 mega-journey edit-step extensions (candidate invalidUrl, voter feedbackDialog, voter all-nominations + shared feedbackDialog fixture), and refactor 4 existing spec families (visual, perf, a11y, bank-auth) onto voter-mega.fixture's answeredVoterPage + locatedVoterPage extension.

**Verified:** 2026-05-30T22:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | buildMinimal helper exists at packages/dev-seed/src/templates/_helpers/buildMinimal.ts with full BuildMinimalOptions API + barrel export | ✓ VERIFIED | File present; exports `buildMinimal` + `BuildMinimalOptions`; barrel at `_helpers/index.ts` re-exports both; 8/8 vitest cases PASS (default shape, settingsOverlay deep-merge, nominationsInElectionIndices, customDataByQuestion, explicit answersByCandidate override, multi-cand default-all, per-candidate 'none', global 'none'). |
| 2 | candidateSessionMinter helper mints a usable authenticated Supabase session for A1/A2/A9 perm specs (D-91-PD-06) | ✗ FAILED | File exists; vitest 3/3 PASS (but tests mock SupabaseAdminClient). Implementation at lines 132-134 emits `Buffer.from('${authUserId}.${email}.${Date.now()}').toString('base64')` as `sb-access-token` cookie — NOT a real JWT. The protected candidate layout calls `safeGetSession()` server-side which signature-validates JWTs; synthetic base64 will fail and the layout redirects to /candidate/login. 5 perm specs depend on this for live runs (perm-answers-locked surfaces 2+3, perm-hide-hero, perm-disable-allow-open candidate-side). |
| 3 | shared.ts builders use named-params signatures (D-91-PD-07) | ✓ VERIFIED | `BuildCandidateOptions` + `BuildElectionConstituencyNomsOptions` exported; `answersByExternalId` parameterised on buildCandidate (7 occurrences in shared.ts). `grep "buildCandidate(P, "` matches only a doc-comment historical reference (line 289). All 13 perm template call sites migrated to named-params. |
| 4 | 6 minimal-topology perm templates ported to consume buildMinimal preserving prefixes byte-for-byte | ✓ VERIFIED | All 6 perm template files contain `buildMinimal(...)` calls; per-perm externalIdPrefixes preserved (`e2e-perm-1e1cg1co-`, `e2e-perm-disable-voter-`, `e2e-perm-disable-cand-`, `e2e-perm-per-app-notif-`, `e2e-perm-missnoms-`, `e2e-perm-l10n-`). Hybrid port for perm-localisation-positive documented in 91-01-SUMMARY decision log. |
| 5 | 7 NEW testids land on Banner / candidate login / 3 protected surfaces / ElectionTag / CategoryTag / EntityOpinions | ✓ VERIFIED | Banner.svelte: 1 header-feedback + 1 header-help; candidate login conditional `data-testid={answersLocked ? 'login-answers-locked-info' : undefined}`; candidate-answers-locked-warning on 3 surfaces (`(protected)/+page.svelte`, `/profile/+page.svelte`, `/questions/[questionId]/+page.svelte`); ElectionTag + CategoryTag + EntityOpinions each carry their testid. |
| 6 | tests/tests/utils/testIds.ts gains 7 entries (answersLockedInfo, answersLockedWarning, opinionOpenAnswer, electionTag, categoryTag, header.feedback, header.help) + Plan 91-03's shared.inputError | ✓ VERIFIED | grep confirms all 8 entries present (`answersLockedInfo`, `answersLockedWarning`, `opinionOpenAnswer`, `electionTag`, `categoryTag`, `header.feedback`, `header.help`, `inputError`). |
| 7 | 9 new TIR6 perm templates exist under packages/dev-seed/src/templates/permutations/ with correct externalIdPrefixes | ✓ VERIFIED | All 9 files present (perm-answers-locked / hide-hero / header-show-feedback / header-show-help / hide-all-nominations / hide-if-missing-answers / hide-election-tags / hide-category-tags / disable-allow-open); each carries its expected `e2e-perm-{name}-` prefix. |
| 8 | packages/dev-seed/src/templates/index.ts registers 9 BUILT_IN_TEMPLATES + 9 re-exports | ✓ VERIFIED | `grep -E "'perm-(answers-locked|...)'"` returns 9 matches in templates/index.ts. |
| 9 | 9 new setup + 9 new teardown files under tests/tests/setup/ — A1/A2/A9 mint per-perm storage state | ✓ VERIFIED | All 18 files present; `mintCandidateSession` invoked in perm-answers-locked.setup.ts, perm-hide-hero.setup.ts, perm-disable-allow-open.setup.ts (2 grep matches each = import + call). |
| 10 | 9 new perm spec files under tests/tests/specs/perm/perm-{name}.spec.ts use strict-fixture pattern | ⚠️ PARTIAL | All 9 spec files present; grep returns ZERO `expect.soft` / `.catch()` matches (clean). HOWEVER — see Truth #11 below: A6 + A9 voter walks bypass located redirect chain (CR-02 BLOCKER per code review). |
| 11 | A1 perm spec exercises FULL 3-SURFACE coverage (unauthenticated login + authenticated profile + authenticated questions) | ⚠️ PARTIAL | Spec structure has 2 describe blocks (unauthenticated + authenticated via storageState); asserts on login-answers-locked-info, candidate-answers-locked-warning across /candidate/profile + /candidate/questions, and toBeDisabled on inputs/radios. BUT runtime path is BLOCKED by Truth #2 (CR-01) — authenticated tests will be redirected to /candidate/login since synth-token cookies fail JWT validation. |
| 12 | perm-disable-allow-open implements D-91-PD-04 typo resolution (info on BOTH Q1+Q2; allowOpen=false on Q2 suppresses rendering) | ⚠️ PARTIAL | Template grep confirms `allowOpen.*false` + `info.*Q[12]` patterns present; spec has 2 describe blocks (candidate-side authenticated + voter-side unauthenticated). Candidate-side blocked by CR-01 (synth-token); voter-side blocked by CR-02 (hand-rolled located walk). |
| 13 | 27 new playwright.config.ts project entries form sequential chain anchored on perm-localisation-positive | ✓ VERIFIED | 9 `data-setup-perm-*` entries present, each with `dependencies: ['data-setup-perm-{previous}']` forming the linear chain perm-localisation-positive → perm-answers-locked → ... → perm-disable-allow-open. Total 95 grep matches across config (3 entries × 9 perms = 27 project blocks + cross-references). |
| 14 | tests/tests/fixtures/shared/feedbackDialog.fixture.ts exists with full createFeedbackDialog(page) factory + RESEARCH §Pattern 2 surface | ✓ VERIFIED | File exports `FeedbackDialogFixture` interface + `createFeedbackDialog` function; barrel at `shared/index.ts` re-exports. |
| 15 | Feedback.svelte submit button gains data-status={status} attribute (Pitfall 10 locale-resilient assertion) | ✓ VERIFIED | grep confirms `data-status={status}` present on Feedback.svelte. |
| 16 | Input.svelte:641 inline ErrorMessage gains data-testid="input-error" | ✓ VERIFIED | grep confirms `data-testid="input-error"` present. |
| 17 | candidate-mega-journey.spec.ts gains step 13.5 invalidUrl on Link-type question (TIR6:16-22) | ✓ VERIFIED | 2 grep matches confirm `TIR6:16-22` + `shared.inputError` present in candidate-mega-journey.spec.ts. baseV1 already seeds URL-type info question (`subtype: 'link'`, `settings: { type: 'link' }`) per RESEARCH Assumption A1; no baseV1 extension needed. |
| 18 | voter-mega-journey.spec.ts gains feedbackDialog step (TIR6:34-61) + all-nominations step (TIR6:63-66) | ⚠️ PARTIAL | 6 grep matches confirm `TIR6:34-61` + `TIR6:63-66` + `createFeedbackDialog` all present. Steps are appended after 'filters: dialog' step. HOWEVER cycle-3 menu-item reopen lacks drawer scoping + open-state waitFor — CR-03 documents race risk; locale-regex over-broad for EN-only walk (warning, not blocker for the EN baseline). |
| 19 | tests/tests/specs/voter/voter-feedback-persistence.spec.ts deleted (absorbed by voter-mega) | ✓ VERIFIED | `ls` returns 'No such file or directory'. |
| 20 | tests/tests/fixtures/voter-mega.fixture.ts gains locatedVoterPage variant + voter.fixture.ts gains @deprecated JSDoc banner (no runtime warn per Pitfall 8) | ✓ VERIFIED | 8 grep matches for `locatedVoterPage` in voter-mega.fixture.ts; voter.fixture.ts top contains `/** @deprecated — Phase 91. ... */`; NO console.warn / console.log added. |
| 21 | visual + perf + a11y specs migrated to voter-mega fixtures; SupabaseAdminClient.findData removed from a11y-smoke; bank-auth import swapped to @playwright/test direct | ✓ VERIFIED | visual-regression.spec.ts: 2 voter-mega.fixture matches; performance-budget.spec.ts: 2 matches; a11y-smoke.spec.ts: 7 matches with locatedVoterPage AND 0 SupabaseAdminClient.findData matches (admin-client UUID resolution removed); candidate-bank-auth.spec.ts: 1 `from '@playwright/test'` match + 0 `from '../../fixtures'` matches. |
| 22 | Audit clean: no Phase 88-91 new specs import legacy voter.fixture.ts (tightened regex per checker WARNING 4) | ✓ VERIFIED | `grep -RE "from '\\.\\./\\.\\./fixtures/voter\\.fixture'[;]?$\|from '\\.\\./\\.\\./fixtures'[;]?$"` across all 91 new specs returns ZERO matches. |

**Score:** 14/22 truths VERIFIED, 5 PARTIAL/FAILED, 3 deferred to operator-driven runtime.

### Deferred Items

Items not yet met but explicitly addressed in later operator-driven verification phases. These do NOT count as actionable gaps for the planner; they are part of the documented env-cascade carry-forward.

| # | Item | Addressed In | Evidence |
| --- | --- | --- | --- |
| 1 | All 9 TIR6 perm chains run green via `yarn test:e2e --project=perm-*` | Operator-driven runtime verification | Plan 91-02 SUMMARY §E2E Run Status explicitly defers runtime to operator runbook; static-grep + spec-load PASS in-process. |
| 2 | Visual regression baselines regenerated | CI follow-up commit (D-91-RS-01) | Plan 91-04 SUMMARY §CI Rebaseline Follow-up documents the canonical CI runner contract for `--update-snapshots`. |

### Required Artifacts (file-level)

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` | Helper module composing Template fragments | ✓ VERIFIED | exists; vitest 8/8 PASS |
| `packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts` | vitest coverage | ✓ VERIFIED | exists; 8/8 PASS |
| `packages/dev-seed/src/templates/_helpers/index.ts` | Barrel | ✓ VERIFIED | exists; re-exports buildMinimal + BuildMinimalOptions |
| `tests/tests/utils/candidateSessionMinter.ts` | Storage-state minter | ⚠️ HOLLOW | exists + wired; emits synthetic base64 cookies, not real Supabase JWTs (CR-01 BLOCKER) |
| `tests/tests/utils/candidateSessionMinter.test.ts` | vitest coverage | ✓ VERIFIED | exists; 3/3 PASS (mocks SupabaseAdminClient — does not exercise the synth-token JWT validation gap) |
| `tests/vitest.config.ts` | vitest config for tests/ workspace | ✓ VERIFIED | exists; restricted to tests/utils/**/*.test.ts |
| `packages/dev-seed/src/templates/permutations/perm-{1e1cg1co,disable-voter-app,disable-candidate-app,per-app-notifications,missing-nominations,localisation-positive}.ts` | Ported templates | ✓ VERIFIED | all 6 contain buildMinimal calls + preserve externalIdPrefixes byte-for-byte |
| `packages/dev-seed/src/templates/permutations/perm-{answers-locked,hide-hero,header-show-feedback,header-show-help,hide-all-nominations,hide-if-missing-answers,hide-election-tags,hide-category-tags,disable-allow-open}.ts` | 9 new TIR6 perm templates | ✓ VERIFIED | all 9 present with correct externalIdPrefixes; 9 BUILT_IN_TEMPLATES + 9 re-exports in templates/index.ts |
| `tests/tests/setup/perm-{name}.{setup,teardown}.ts` × 9 perms (18 files) | Setup + teardown wrappers | ✓ VERIFIED | all 18 files present |
| `tests/tests/specs/perm/perm-{name}.spec.ts` × 9 perms | Strict-fixture perm specs | ⚠️ PARTIAL | all 9 present + ZERO `expect.soft` / `.catch()`. A6 + A9 voter walks bypass located redirect chain (CR-02). |
| `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` | Shared feedbackDialog fixture | ✓ VERIFIED | exists; FeedbackDialogFixture interface + createFeedbackDialog factory exported; barrel re-exports |
| `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` | data-status attribute | ✓ VERIFIED | data-status={status} present on submit button |
| `apps/frontend/src/lib/components/input/Input.svelte` | input-error testid | ✓ VERIFIED | data-testid="input-error" present |
| `tests/tests/utils/testIds.ts` | 7 new entries + shared.inputError | ✓ VERIFIED | all 8 entries present |
| `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` | step 13.5 invalidUrl | ✓ VERIFIED | TIR6:16-22 + shared.inputError present |
| `tests/tests/specs/voter/voter-mega-journey.spec.ts` | feedbackDialog + all-nominations steps | ⚠️ PARTIAL | TIR6:34-61 + TIR6:63-66 + createFeedbackDialog present; CR-03 drawer-scoping race risk on cycle 3 |
| `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` | DELETED | ✓ VERIFIED | file does not exist |
| `tests/tests/fixtures/voter-mega.fixture.ts` | locatedVoterPage extension | ✓ VERIFIED | 8 grep matches for locatedVoterPage |
| `tests/tests/fixtures/voter.fixture.ts` | @deprecated banner, no runtime warn | ✓ VERIFIED | top contains JSDoc @deprecated; no console.warn / console.log |
| `tests/tests/specs/visual/visual-regression.spec.ts` | Migrated to voter-mega + candidatePreviewPage | ✓ VERIFIED | imports voter-mega.fixture |
| `tests/tests/specs/perf/performance-budget.spec.ts` | Migrated to voter-mega.fixture | ✓ VERIFIED | imports voter-mega.fixture |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | Migrated to voter-mega fixtures; SupabaseAdminClient.findData removed | ✓ VERIFIED | 7 voter-mega.fixture/locatedVoterPage matches; 0 SupabaseAdminClient.findData matches |
| `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` | Import swap to @playwright/test direct | ✓ VERIFIED | 1 @playwright/test match; 0 ../../fixtures matches |
| `tests/playwright.config.ts` | 27 new project entries forming sequential chain | ✓ VERIFIED | 9 data-setup-perm-* entries with dependencies chained linearly |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| buildMinimal helper | shared.ts builders | `from '../permutations/shared'` import | ✓ WIRED | confirmed via grep; helper composes via the refactored named-params builders |
| Each ported perm template | buildMinimal helper | `from '../_helpers/buildMinimal'` import | ✓ WIRED | 6 ported templates each contain buildMinimal call |
| candidateSessionMinter helper | SupabaseAdminClient | `new SupabaseAdminClient()` + `client.findData('candidates', { external_id })` | ⚠️ WIRED but HOLLOW | Lookup is real (would throw on candidate-not-found per Test 3); token synthesis is fake (CR-01) — produces a storage-state shape but the tokens won't authenticate against the Supabase GoTrue signature check at the protected layout |
| A1/A2/A9 perm setups | candidateSessionMinter | `import { mintCandidateSession } from '../utils/candidateSessionMinter'` + invocation after setupFromTemplate | ✓ WIRED | 3 setup files each have 2 grep matches (import + call); writes per-perm storage-state file at playwright/.auth/perm-{name}.json |
| Each new perm spec | testid selectors | `page.getByTestId(testIds.X.Y)` | ✓ WIRED | all 9 specs use testIds.* references; no locale-text matching (Pitfall 3 mitigated) |
| Each setup project entry | Sequential dependency on previous perm | `dependencies: ['data-setup-perm-{previous}']` | ✓ WIRED | linear chain perm-localisation-positive → perm-answers-locked → ... → perm-disable-allow-open |
| voter-mega-journey feedbackDialog step | shared/feedbackDialog.fixture.ts | `createFeedbackDialog(page)` factory | ✓ WIRED | 6 grep matches in voter-mega-journey.spec.ts |
| feedbackDialog.fixture.ts expectSuccess() | Feedback.svelte data-status='sent' | submit button data-status attribute | ✓ WIRED | data-status={status} present; locale-resilient per Pitfall 10 |
| candidate-mega-journey invalidUrl step | Input.svelte input-error testid | `page.getByTestId(testIds.shared.inputError)` | ✓ WIRED | grep confirms |
| voter all-nominations step | Nominations route → candidate-nominations list | `buildRoute({ route: 'Nominations', locale: 'en' })` + `testIds.voter.nominations.list` | ✓ WIRED | grep confirms TIR6:63-66 block uses buildRoute + nominations.list testid |
| Visual + perf specs | voter-mega.fixture.ts answeredVoterPage | `import { voterMegaTest as voterTest } from '../../fixtures/voter-mega.fixture'` | ✓ WIRED | grep confirms both specs |
| a11y-smoke located routes | voter-mega.fixture.ts locatedVoterPage / answeredVoterPage | imports from voter-mega.fixture | ✓ WIRED | 7 grep matches; located routes consume the fixture; pre-location routes keep raw page.goto |
| candidate-bank-auth import | @playwright/test direct | `import { expect, test } from '@playwright/test'` | ✓ WIRED | grep confirms |

### Data-Flow Trace (Level 4)

Level 4 checks data populating the test artifacts at runtime.

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| candidateSessionMinter cookies | `accessToken`, `refreshToken` | `Buffer.from('${authUserId}.${email}.${Date.now()}').toString('base64')` (lines 132-134) | NO — synthetic base64 string; not a JWT signed by GoTrue | ✗ DISCONNECTED — Supabase server-side signature validation will reject these tokens; protected layout redirects to /candidate/login. Reviewer CR-01 BLOCKER. |
| 9 new perm templates → seeded DB rows | `Template` object from buildMinimal | runs through runPipeline writer on setupFromTemplate invocation | YES — buildMinimal vitest cases confirm Template shape; runPipeline is the existing 88-03 writer | ✓ FLOWING (static structural verification; runtime exercised in operator runbook) |
| testIds.ts inventory | testId string values | static constants | YES — plain strings | ✓ FLOWING |
| Banner.svelte header-feedback testid | data-testid attribute | gated on `topBarSettings.current.actions.feedback === 'show'` | YES at runtime when perm settings enable; verified statically | ✓ FLOWING |
| candidate/login data-testid | `data-testid={answersLocked ? '...' : undefined}` | gated on `answersLocked` from page data | YES — conditional binding present (verified via grep) | ✓ FLOWING (operator must confirm runtime conditional behaviour via Human Verification item 6) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| buildMinimal vitest cases pass | `cd packages/dev-seed && yarn vitest run --reporter=basic` | 511/513 PASS; 8/8 buildMinimal-specific PASS | ✓ PASS (the 2 failures are pre-existing e2eTemplate row-count drift + default-template integration test — out of Phase 91 scope per both 91-01-SUMMARY §Pre-Existing Issues and 91-02-SUMMARY) |
| candidateSessionMinter vitest cases pass | `cd tests && yarn vitest run --config vitest.config.ts` | 3/3 PASS in 358ms | ✓ PASS (but tests mock SupabaseAdminClient — see Truth #2 / CR-01: the mock-coverage gap is exactly what hides the synth-token bug) |
| Audit grep across new specs | `grep -RE "from '\.\./\.\./fixtures/voter\.fixture'[;]?$\|from '\.\./\.\./fixtures'[;]?$"` (tightened per checker WARNING 4) | ZERO matches across all 22 perm specs + 2 mega-journey specs | ✓ PASS |
| Strict-fixture grep | `grep -E "expect\.soft" tests/tests/specs/perm/perm-{answers-locked,hide-hero,header-show-feedback,header-show-help,hide-all-nominations,hide-if-missing-answers,hide-election-tags,hide-category-tags,disable-allow-open}.spec.ts` | ZERO matches | ✓ PASS |
| Live perm chain runs | `yarn test:e2e --project=perm-answers-locked --project=perm-hide-hero ... --project=perm-disable-allow-open` | NOT EXECUTED (live yarn dev + Supabase required; deferred per env-cascade carry-forward) | ? SKIP — routed to Human Verification item 1 |
| Live visual / perf / a11y / bank-auth | `PLAYWRIGHT_{VISUAL,PERF,A11Y,BANK_AUTH}=1 npx playwright test --project=...` | NOT EXECUTED (live env required) | ? SKIP — routed to Human Verification items 2-5 |

### Probe Execution

No formal probe scripts (`scripts/*/tests/probe-*.sh`) declared by Phase 91. Verification relies on vitest suites + Playwright project list + grep-based static gates. Probes are not applicable for this test-infrastructure phase.

### Requirements Coverage

Phase 91 declares informal requirement IDs (91-A1..91-Audit) in plan frontmatter; these are NOT formally enumerated in `.planning/REQUIREMENTS.md` (REQUIREMENTS.md tracks DETERM/A11Y IDs only — Phase 91 was ROADMAP-Listed but not back-mapped to formal v2.10 REQs). The mapping below is verifier-derived from plan frontmatter `requirements:` arrays.

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| 91-Helper | 91-01 | buildMinimal helper authored | ✓ SATISFIED | Truth #1 + buildMinimal vitest 8/8 PASS |
| 91-Port | 91-01 | 6 minimal-topology perms ported | ✓ SATISFIED | Truth #4 |
| 91-Auth (alias for D-91-PD-06 session-minter) | 91-01 | candidateSessionMinter helper | ✗ BLOCKED | Truth #2 — helper emits synth tokens, will fail at server-side JWT validation |
| 91-NamedParams | 91-01 | Named-params refactor (D-91-PD-07) | ✓ SATISFIED | Truth #3 |
| 91-A1 | 91-02 | perm-answers-locked FULL 3-surface coverage | ⚠️ BLOCKED (template + spec correct; runtime blocked by CR-01) | Truth #11 — structural artifacts present but the authenticated surfaces 2+3 cannot fire against the candidateSessionMinter synth token |
| 91-A2 | 91-02 | perm-hide-hero authenticated candidate | ⚠️ BLOCKED (template + spec correct; runtime blocked by CR-01) | Same as 91-A1 — A2 setup invokes mintCandidateSession |
| 91-A3 | 91-02 | perm-header-show-feedback unauthenticated voter | ✓ SATISFIED | unauthenticated; not affected by CR-01 |
| 91-A4 | 91-02 | perm-header-show-help unauthenticated voter | ✓ SATISFIED | unauthenticated |
| 91-A5 | 91-02 | perm-hide-all-nominations redirect assertion | ✓ SATISFIED | Truth #10 — toHaveURL(/\/en\/?$/) per Pitfall 5 |
| 91-A6 | 91-02 | perm-hide-if-missing-answers candidate visibility | ⚠️ AT RISK | CR-02 — voter walk bypasses located redirect chain; assertion target is correct but walk may not fully locate |
| 91-A7 | 91-02 | perm-hide-election-tags | ⚠️ AT RISK | WR-03 — needs positive control to confirm tag actually renders in showElectionTags=true topology; assertion as written may be vacuously true |
| 91-A8 | 91-02 | perm-hide-category-tags | ✓ SATISFIED | Template + assertion present |
| 91-A9 | 91-02 | perm-disable-allow-open D-91-PD-04 typo resolution | ⚠️ BLOCKED | CR-01 (candidate-side authenticated block) + CR-02 (voter-side walk) |
| 91-B1 | 91-03 | candidate-mega step 13.5 invalidUrl | ✓ SATISFIED | Truth #17 |
| 91-B2 | 91-03 | voter-mega feedbackDialog step | ⚠️ PARTIAL | Truth #18 — CR-03 drawer-scoping risk |
| 91-B3 | 91-03 | voter-mega all-nominations step | ✓ SATISFIED | Truth #18 |
| 91-C1 | 91-04 | visual-regression migration | ✓ SATISFIED (rebaseline deferred) | Truth #21; deferred item #2 |
| 91-C2 | 91-04 | performance-budget migration | ✓ SATISFIED (runtime deferred) | Truth #21; deferred item #1 |
| 91-C3 | 91-04 | a11y-smoke migration + per-rule gates | ✓ SATISFIED | Truth #21; SupabaseAdminClient.findData removed; per-rule axe IDs + 0-violation gate preserved |
| 91-C4 | 91-04 | bank-auth import swap | ✓ SATISFIED | Truth #21; JWE + env-gating intact |
| 91-D1 | 91-03 | voter-feedback-persistence deletion | ✓ SATISFIED | Truth #19 |
| 91-D2 | 91-04 | voter.fixture.ts @deprecated banner | ✓ SATISFIED | Truth #20 |
| 91-Audit | 91-04 | Legacy-fixture audit clean (tightened regex) | ✓ SATISFIED | Truth #22 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| tests/tests/utils/candidateSessionMinter.ts | 132-134 | Synthetic base64 token labelled as Supabase session token | 🛑 BLOCKER (CR-01) | Authenticated perm specs A1 surfaces 2+3, A2, A9 candidate-side will fail at the protected layout's safeGetSession() signature validation — redirect to /candidate/login → assertions on candidate-answers-locked-warning + candidate-questions-hero + candidate-questions-comment cannot fire. |
| tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts | 27-39 | Hand-rolled located walk without waitForURL settle; vulnerable to auto-imply redirect on single-election + single-constituency topology | 🛑 BLOCKER (CR-02) | A6 assertion target on `[CA1A]` cards may run against a partially-located /results — flaky / silent vacuous pass. |
| tests/tests/specs/perm/perm-disable-allow-open.spec.ts | 52-59 | Same hand-rolled located walk anti-pattern | 🛑 BLOCKER (CR-02) | A9 voter-side block — same risk |
| tests/tests/specs/voter/voter-mega-journey.spec.ts | 1067-1102 | Cycle 3 feedbackNavItem locator unscoped to open drawer; no openMenu drawer.waitFor({state:'visible'}); locale-regex over-broad for EN-only walk | ⚠️ WARNING (CR-03) | Cycle 3 reopen races against menu close transition; flaky in mega-journey (contained by serial mode but contract fragile) |
| tests/tests/utils/candidateSessionMinter.ts | 179-182 | `void opts.locale;` accepts but ignores parameter | ⚠️ WARNING (WR-01) | Interface promises behaviour not delivered |
| tests/tests/setup/perm-{answers-locked,hide-hero,disable-allow-open}.teardown.ts | 22-24 | FS unlink sequenced AFTER DB delete; if DB throws, file persists | ⚠️ WARNING (WR-02) | Cross-CI run leak risk; recommend try/finally wrap |
| tests/tests/specs/perm/perm-hide-election-tags.spec.ts | 19-26 | Assertion on `electionTag` absence with no positive control to confirm tag actually renders in the topology with `showElectionTags: true` | ⚠️ WARNING (WR-03) | Test may vacuously pass; recommend cross-link or sibling positive-control test |
| tests/tests/specs/perm/perm-hide-hero.spec.ts | 30-31 | `figure.locator('img, span').toHaveCount(0)` may over-match sr-only spans | ⚠️ WARNING (WR-04) | Brittle assertion intent; better expressed as content-emptiness check |
| apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte | 103-127 | ERROR_TIMEOUT race vs sendFeedback .then; status writes can interleave | ⚠️ WARNING (WR-05) | Pre-existing; Phase 91 expectSuccess() exposes the race more often |
| apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte | 125-141 | Stale `parseSelected` doc-comment; file appears in diff but is out-of-Phase-91-scope | ⚠️ WARNING (WR-06) | Documentation drift; either remove file from phase 91 changeset or update comment |
| tests/tests/fixtures/voter.fixture.ts | 1-4 | `@deprecated` JSDoc only — no ESLint enforcement on imports | ⚠️ WARNING (WR-07) | 12 legacy consumers continue to import without compiler warning |
| tests/tests/specs/candidate/candidate-mega-journey.spec.ts | 162-173, 530, 673 | MAX_STEPS=20 ceiling silent on overflow; step 13.5 clears link but step 21 comment claims sample includes link | ⚠️ WARNING (WR-08 + WR-09) | Test diagnostics quality |
| packages/dev-seed/src/templates/_helpers/buildMinimal.ts | 131-148 | `deepMerge` relies on JSON.stringify to strip undefined; non-JSON-safe inputs silently mangled | ℹ️ INFO (IN-01) | Document contract |
| packages/dev-seed/src/templates/_helpers/buildMinimal.ts | 125-148 | `MINIMAL_BASE_APP_SETTINGS as const` casts through deepMerge | ℹ️ INFO (IN-02) | Future type-narrowing risk |
| tests/tests/setup/perm-*.setup.ts | 9 files | Copy-paste `extraTeardownPrefix: ['test-', 'e2e-perm-']` | ℹ️ INFO (IN-03) | Centralise constant |
| tests/tests/specs/perm/perm-*.spec.ts | 9 files | STORAGE_STATE_PATH duplicated between setup + spec | ℹ️ INFO (IN-04) | Import constant from setup |
| tests/tests/fixtures/shared/feedbackDialog.fixture.ts | 73 | `RATINGS` constant single-use | ℹ️ INFO (IN-05) | Inline or export |
| tests/tests/fixtures/voter-mega.fixture.ts | 229-242 | `walkVoterMegaJourney` exported but possibly unused | ℹ️ INFO (IN-06) | Audit + remove if no callers |

### Human Verification Required

See `human_verification` section in YAML frontmatter — 6 items routed to operator for live-environment execution:

1. Live perm chain runs (`yarn test:e2e --project=perm-*`) against clean local Supabase — CRITICAL to confirm CR-01 BLOCKER manifests as predicted (authenticated specs fail) OR if some surface accident makes the synth token coincidentally work.
2. Visual regression `--update-snapshots` on canonical CI runner per D-91-RS-01 contract.
3. PLAYWRIGHT_PERF=1 against live `yarn dev` (budgets unchanged).
4. PLAYWRIGHT_A11Y=1 against live `yarn dev` (per-rule axe IDs + 0-violation gate preserved).
5. PLAYWRIGHT_BANK_AUTH=1 with Supabase Edge Function served `--no-verify-jwt` (operator runbook).
6. Visual confirmation of `data-testid={answersLocked ? ...}` conditional binding behaviour under perm vs default seed.

### Gaps Summary

Phase 91 lands **substantial structural correctness** across 79 modified/created files — the foundation helpers (buildMinimal, named-params refactor, shared feedbackDialog fixture, locatedVoterPage extension), the testid wiring on Svelte components, the testIds.ts inventory, the playwright config sequential chain, the visual/perf/a11y/bank-auth spec migrations, and the audit-clean import surface are ALL in place and pass static verification.

The **three Critical findings** documented in 91-REVIEW.md are confirmed by direct codebase inspection:

- **CR-01 (BLOCKER):** `candidateSessionMinter.ts` lines 132-134 emit a base64-encoded `${authUserId}.${email}.${Date.now()}` string as the `sb-access-token` cookie value, NOT a real JWT signed by the Supabase GoTrue server. The candidate-protected layout calls `safeGetSession()` server-side which signature-validates the JWT — synthetic base64 will fail and the layout will redirect to `/candidate/login`. **5 perm specs** (perm-answers-locked surfaces 2+3, perm-hide-hero, perm-disable-allow-open candidate-side) cannot run their authenticated assertions until this is fixed. The vitest 3/3 PASS on the helper does NOT cover this gap because the tests mock SupabaseAdminClient and never exercise real Supabase auth.
- **CR-02 (BLOCKER):** perm-hide-if-missing-answers + perm-disable-allow-open voter-side specs hand-roll the located walk without consuming the canonical `locatedVoterPage` / `answeredVoterPage` fixture (which Plan 91-04 introduced for exactly this purpose). The hand-roll is vulnerable to single-election + single-constituency auto-imply (selectors never appear → timeout) AND short-circuits the natural redirect chain after constituencies.continue.click() via direct `goto('/en/results')`. A6 + A9 voter assertions may run against partially-located /results — flaky pass/fail or silent vacuous pass.
- **CR-03 (WARNING):** voter-mega-journey feedbackDialog cycle-3 menu-item reopen is unscoped to the open drawer dialog + lacks `await drawer.waitFor({state:'visible'})`. Locale-regex over-broad for EN-only walk. Contained by serial mode but contract fragile.

Additionally, **runtime verification of all 4 opt-in projects** (perm chain, visual, perf, a11y, bank-auth) is deferred to operator-driven environment per the env-cascade pattern established Phase 89 onwards — these are NOT phase-91-introduced gaps but standard env-cascade carry-forward documented explicitly in each plan SUMMARY.

The **deferred items** (full e2e chain runs + visual baseline regeneration) are NOT actionable gaps for the planner — they require live `yarn dev` + Supabase + (for bank-auth) Edge Function `--no-verify-jwt` and are routed via the human verification block.

**Recommendation:** Re-plan one gap-closure plan (or absorb into a Phase 92 head) addressing CR-01 (live-Supabase integration of candidateSessionMinter via `auth.admin.generateLink` + `exchangeCodeForSession` OR `auth.admin.setSession`) + CR-02 (refactor the 2 voter-side perm specs to consume `locatedVoterPage` / `answeredVoterPage` fixture instead of hand-rolled walk) + CR-03 (drawer scoping for cycle-3 feedback reopen). Once those land, the operator-driven runtime verification block closes the remaining deferred items.

---

_Verified: 2026-05-30T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
