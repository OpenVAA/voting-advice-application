#!/usr/bin/env tsx
/**
 * Compare two Playwright JSON reports (baseline vs post-swap) per D-59-04.
 *
 * Parity rules (from 59-CONTEXT.md D-59-04, refined by baseline/summary.md):
 *
 *   - Every test in the baseline PASS_LOCKED_TESTS set (41 tests) MUST pass
 *     post-swap. A previously-passing test failing or cascading is a BLOCKER.
 *   - Every test in CASCADE_TESTS (25 tests) may remain non-passing or become
 *     passing. Cascade -> pass is acceptable. Cascade -> cascade is acceptable.
 *     Cascade -> data-race-pool (within DATA_RACE_TESTS) is acceptable.
 *     Cascade -> a NEW data-race-like failure OUTSIDE the pool is a BLOCKER.
 *   - Tests in DATA_RACE_TESTS (10 tests) may flake differently post-swap —
 *     they live in the flake pool. Pool membership change within the pool is
 *     acceptable.
 *   - The data-race pool does NOT grow. No test in PASS_LOCKED_TESTS or
 *     CASCADE_TESTS may enter the pool, and no previously-unknown test may
 *     appear failing.
 *   - SOURCE_SKIP_TESTS (13 tests with `test.skip()` in source) are not part
 *     of the parity contract — listed for reconciliation only.
 *
 * "Did not run" / timedOut is counted as a failure per D-59-04 + stored
 * memory feedback_e2e_did_not_run.md (load-bearing for the delta-rule
 * interpretation).
 *
 * Exit codes:
 *   0 — parity satisfied; prints `PARITY GATE: PASS`.
 *   1 — regression detected; prints `PARITY GATE: FAIL` with diff table.
 *   2 — usage error or IO failure.
 *
 * Usage:
 *   tsx diff-playwright-reports.ts <baseline.json> <post-swap.json>
 *
 * Self-identity smoke test (comparing a report to itself yields PARITY PASS):
 *   tsx diff-playwright-reports.ts baseline/playwright-report.json \
 *                                  baseline/playwright-report.json
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

// -----------------------------------------------------------------------------
// PHASE 79 REGEN (2026-05-13, Phase 79 Plan 03 Task 6 — DETERM-05 constants regen
// against the post-fix v2.10 verification anchor. Source: post-fix/run-6.json
// (the canonical D-09 fresh-trio SHA-identical baseline; see post-fix/sha256.txt
// for full audit). Regen script: .planning/phases/79-determinism-recovery-cascading
// -race-fix-constants-regen/post-fix/regen-constants.mjs.
//
// PHASE 79 STORY — the cascading-race fix unlocked +33 PASS_LOCKED tests.
// DETERM-04 resolved the candidate-profile.spec.ts:51 URL-predicate bug that
// cascade-skipped the registration test's downstream chain at every prior
// v2.9 verification gate (deferred-with-rationale through Phases 76 → 78).
// With the fix landed, the suite now exposes:
//   - The full candidate-app-mutation tree (registration + A11Y-01 + downstream)
//   - voter-app A11Y-02 reload-persistence tests
//   - SETTINGS-02 voter-allowopen variant + per-tab voter-results entries
//   - Many voter-app entries that were CASCADE in Phase 75
//
// PRIOR REGEN (Phase 75, 2026-05-11) replaced by this regen:
// 47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE = 95 tests.
// Phase 79 baseline: 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE = 152 tests.
//   PASS_LOCKED: grew +33 (47 → 80). DETERM-04 fix promoted previously-
//                cascade-blocked tests into PASS_LOCKED. Notable promotions:
//                candidate-app-mutation full suite (registration + A11Y-01
//                cells), voter-app A11Y-02 persistence, voter-allowopen variant,
//                voter-results matrix (SETTINGS-01 wave B + URL/coupling tests).
//                NET-POSITIVE delta vs Phase 75 baseline.
//   DATA_RACE:   unchanged at 15 — D-09 binding preserved (Phase 73 CONTEXT D-08
//                IMGPROXY_TIED_TITLES audit clean across all Phase 79 captures;
//                pool MUST NOT grow). The 14 IMGPROXY-tied + 1 dual-project
//                re-auth.setup.ts entries are preserved verbatim.
//   CASCADE:     grew +24 (33 → 57). The new entries are downstream of the
//                still-failing image-upload test (CAND-03; previously masked by
//                the registration cascade — now exposed). Image-upload is the
//                next cascade source in the candidate-profile.spec.ts serial
//                describe block AND the new variant-project chain seed
//                (data-setup-variants → variant-allowopen + variant-hidden-required
//                etc.) gate-cascades. These are NOT DETERM-04 regressions; they
//                are pre-existing pool-eligible cascades surfaced by the fix.
//                Routed to v2.11+ per Phase 79 SUMMARY.
//   FAILURE-CLASS  ~11 tests deterministically FAIL × 3 in Phase 79 baseline
//   (NOT pooled):  (timedOut / failed). Includes the image-upload root cause
//                + 2 known voter-app intermittents (voter-matching 'should show
//                worst match candidate as last result' + voter-detail 'should
//                open party detail drawer') flagged via D-09 protocol — see
//                .planning/phases/79-…/post-fix/sha256.txt. Both voter-app
//                flakes are NOT IMGPROXY-tied (cannot be classified into
//                DATA_RACE per Phase 73 D-09); they reproduce ~33% of runs (2/6
//                across the Phase 79 captures). Filed as follow-up at
//                .planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md.
//
// The 14 imgproxy-tied tests (1 direct + 13 cascades; 15 IDs because re-auth.setup.ts
// runs in two projects) classify exclusively into DATA_RACE_TESTS per D-09 — RESEARCH
// Pitfall 5 documents the rationale (intermittent infrastructure flake, not
// deterministic). The pool MUST NOT grow.
//
// Phase 79 SC #4 (determinism gate): initial 3-run cold-start (run-1/2/3) FAILED
// the strict D-08 identity gate due to the voter-app flakes documented above.
// D-09 instability protocol triggered: 3 additional cold-start runs (run-4/5/6)
// were SHA-identical at hash
// ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5.
// Run-2 (from the initial trio) also matches this hash — 4 of 6 total runs
// converged on the stable baseline. PARITY GATE: PASS on (4,5,6) trio
// pair comparisons. Run-6 promoted to canonical regen source.
//
// Format: '<projectName> :: <specFile> > <specTitle>' — matches `flattenReport`
// output below. Re-embed by running the regen script after a new canonical capture.
// -----------------------------------------------------------------------------

/** 81 tests locked PASSING on Phase 82 baseline (Phase 79 baseline 80 + 1 net-addition: Phase 82 A11Y-07 required-empty save-gate cell). NOTE: Phase 81's +2 NET-ADDITIONS (A11Y-05 email + A11Y-06 url) were deferred from Phase 81 P01 close per Phase 81 VERIFICATION §"Anchor preservation: PASS by additivity" — they are NOT folded here; the v2.10 milestone-close pre-release regen is the canonical home for backfilling both. Any regression vs. THIS list is a BLOCKER. */
const PASS_LOCKED_TESTS: ReadonlyArray<string> = [
  'auth-setup :: setup/auth.setup.ts > authenticate as candidate',
  'candidate-app :: specs/candidate/candidate-auth.spec.ts > should login with valid credentials',
  'candidate-app :: specs/candidate/candidate-auth.spec.ts > should show error on invalid credentials',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should answer a Likert opinion question and save (CAND-04)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should display entered profile and opinion data on preview page (CAND-06)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should display question cards organized by category (CAND-05)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should edit a previously answered question (CAND-05)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should navigate between categories (CAND-05)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should persist comment text on a question after page reload (CAND-12)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should persist question answers after page reload (CAND-12)',
  'candidate-app :: specs/candidate/candidate-questions.spec.ts > should show specific candidate data (name or answered question) in preview (CAND-06)',
  'candidate-app :: specs/candidate/candidate-translation.spec.ts > multilocale candidate authors a translation and the value persists across reload',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 image-size rejection surfaces oversizeFile error',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 image-type rejection surfaces invalidFile error',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 name-too-long caps input value at maxlength=50 on display-name',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should register the fresh candidate via email link',
  'candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete forgot-password and reset flow via Inbucket email',
  'candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete registration via email link',
  'candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should send registration email and extract link',
  'data-setup :: setup/data.setup.ts > import test dataset',
  'data-teardown :: setup/data.teardown.ts > delete test dataset',
  'data-teardown :: setup/variant-data.teardown.ts > delete variant test dataset',
  'data-teardown-variants :: setup/variant-data.teardown.ts > delete variant test dataset',
  'voter-app :: specs/voter/voter-allowopen.spec.ts > SETTINGS-02 entity comment surface is absent when entity has no answer.info',
  'voter-app :: specs/voter/voter-allowopen.spec.ts > SETTINGS-02 entity comment surface present even when allowOpen flipped after authoring',
  'voter-app :: specs/voter/voter-allowopen.spec.ts > SETTINGS-02 entity comment surface renders for allowOpen-true questions',
  'voter-app :: specs/voter/voter-browse-without-match.spec.ts > voter completes location, skips opinions, browses entity list without match scores',
  'voter-app :: specs/voter/voter-detail.spec.ts > case (a) — both answered: voter row and entity row rendered',
  'voter-app :: specs/voter/voter-detail.spec.ts > case (b) — voter answered, entity missing: voter row only',
  'voter-app :: specs/voter/voter-detail.spec.ts > case (c) — voter missing, entity answered: entity row only',
  'voter-app :: specs/voter/voter-detail.spec.ts > directional-metric SubMatch row exists for a candidate who answered the categorical question',
  'voter-app :: specs/voter/voter-detail.spec.ts > per-category SubMatch grid renders Manhattan + directional metric path categories',
  'voter-app :: specs/voter/voter-detail.spec.ts > should display candidate answers correctly in info and opinions tabs',
  'voter-app :: specs/voter/voter-detail.spec.ts > should display candidate info and opinions tabs',
  'voter-app :: specs/voter/voter-detail.spec.ts > should open candidate detail drawer when clicking a result card',
  'voter-app :: specs/voter/voter-journey.spec.ts > should answer all Likert questions with navigation',
  'voter-app :: specs/voter/voter-journey.spec.ts > should auto-imply election and constituency',
  'voter-app :: specs/voter/voter-journey.spec.ts > should load home page and display start button',
  'voter-app :: specs/voter/voter-journey.spec.ts > should show questions intro page with start button',
  'voter-app :: specs/voter/voter-locale-switching.spec.ts > locale switches via LanguageSelection widget (when present)',
  'voter-app :: specs/voter/voter-locale-switching.spec.ts > locale switches via route prefix',
  'voter-app :: specs/voter/voter-matching.spec.ts > should NOT show hidden candidate (no termsOfUseAccepted)',
  'voter-app :: specs/voter/voter-matching.spec.ts > should confirm category intros were not shown during journey (VOTE-05 partial negative coverage)',
  'voter-app :: specs/voter/voter-matching.spec.ts > should confirm results accessible after all questions answered (VOTE-07 partial above-threshold coverage)',
  'voter-app :: specs/voter/voter-matching.spec.ts > should display candidates in correct match ranking order',
  'voter-app :: specs/voter/voter-matching.spec.ts > should show partial-answer candidate in results with valid score',
  'voter-app :: specs/voter/voter-matching.spec.ts > should show perfect match candidate as top result',
  'voter-app :: specs/voter/voter-matching.spec.ts > should show worst match candidate as last result',
  'voter-app :: specs/voter/voter-questions.spec.ts > counter updates reactively on category toggle',
  'voter-app :: specs/voter/voter-questions.spec.ts > fresh session defaults to all opinion categories checked + counter non-zero on first paint',
  'voter-app :: specs/voter/voter-results.spec.ts > Browser Back steps through tab+drawer changes (D-13)',
  'voter-app :: specs/voter/voter-results.spec.ts > SETTINGS-01 wave B — ChoiceQuestionFilter (categorical)',
  'voter-app :: specs/voter/voter-results.spec.ts > SETTINGS-01 wave B — FilterGroup AND',
  'voter-app :: specs/voter/voter-results.spec.ts > SETTINGS-01 wave B — MISSING_FILTER_VALUE',
  'voter-app :: specs/voter/voter-results.spec.ts > SETTINGS-01 wave B — NumberFilter',
  'voter-app :: specs/voter/voter-results.spec.ts > SETTINGS-01 wave B — TextFilter',
  'voter-app :: specs/voter/voter-results.spec.ts > canonical URL: /results redirects to /results/candidates (RESEARCH A3)',
  'voter-app :: specs/voter/voter-results.spec.ts > coupling-rule redirect: singular without id → list view (D-11)',
  'voter-app :: specs/voter/voter-results.spec.ts > deeplink edge case: organizations list + candidate drawer (D-08 shape 4)',
  'voter-app :: specs/voter/voter-results.spec.ts > deeplink list+drawer URL renders both (RESULTS-03, D-08 shape 3)',
  'voter-app :: specs/voter/voter-results.spec.ts > drawer paints before list on cold deeplink (D-10 source-order + content-visibility)',
  'voter-app :: specs/voter/voter-results.spec.ts > filter state resets on plural tab switch (D-14)',
  'voter-app :: specs/voter/voter-results.spec.ts > filter state survives drawer open/close (D-15)',
  'voter-app :: specs/voter/voter-results.spec.ts > invalid plural matcher returns 404 (D-11)',
  'voter-app :: specs/voter/voter-results.spec.ts > should display candidates section with result cards',
  'voter-app :: specs/voter/voter-results.spec.ts > should display entity type tabs for switching between candidates and organizations',
  'voter-app :: specs/voter/voter-results.spec.ts > should switch to organizations/parties section and back',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > about page renders correctly',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > info page renders correctly',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > privacy page renders correctly',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > should redirect to home when showAllNominations is false',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > should render nominations page with entries',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should show feedback popup after delay on results page',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should enforce minimum answers before results available',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should filter questions to selected categories',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should hide results link when showResultsLink is false',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should show category checkboxes when allowCategorySelection enabled',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should show category intro page before each category',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should show question intro page when questionsIntro.show enabled',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should skip category when skip button clicked'
];

/** 15 tests in the flake pool (14 imgproxy-tied per D-09 binding, ×2 for re-auth dual project); Phase 73 D-09 structural binding preserved verbatim across Phases 74→75→79. Pool MUST NOT grow. */
const DATA_RACE_TESTS: ReadonlyArray<string> = [
  'auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)',
  'candidate-app-password :: specs/candidate/candidate-password.spec.ts > should change password and login with new password',
  'candidate-app-password :: specs/candidate/candidate-password.spec.ts > should logout and return to login page',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should display notification popup when enabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should hide hero when hideHero is enabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render help page correctly',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render privacy page correctly',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show hero when hideHero is disabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when underMaintenance is true',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show read-only warning when answers are locked',
  're-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate'
];

/** 57 tests cascaded (skipped / did-not-run) on Phase 79 baseline (+24 vs Phase 75 — image-upload cascade now visible post-DETERM-04 fix, plus new variant setup/spec entries); must not NEW-regress. */
const CASCADE_TESTS: ReadonlyArray<string> = [
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > A11Y-02 should persist bio after page reload',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > A11Y-02 should persist display name after page reload',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > A11Y-02 should persist social link after page reload',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — access.voterApp',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — elections.showElectionTags',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — entities.hideIfMissingAnswers.candidate',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — entities.showAllNominations',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — header.showFeedback',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — header.showHelp',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — notifications.voterApp',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — questions.showCategoryTags',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — questions.showResultsLink',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — results.sections',
  'data-setup-1e-Nc :: setup/variant-1e-Nc.setup.ts > import 1e-Nc dataset',
  'data-setup-Ne-Nc :: setup/variant-Ne-Nc.setup.ts > import Ne-Nc dataset',
  'data-setup-allowopen :: setup/variant-allowopen.setup.ts > import allowopen dataset',
  'data-setup-constituency :: setup/variant-constituency.setup.ts > import constituency dataset',
  'data-setup-hidden-required :: setup/variant-hidden-required.setup.ts > import hidden-required dataset',
  'data-setup-low-minimum-answers :: setup/variant-low-minimum-answers.setup.ts > import low-minimum-answers dataset',
  'data-setup-multi-election :: setup/variant-multi-election.setup.ts > import multi-election dataset',
  'data-setup-startfromcg :: setup/variant-startfromcg.setup.ts > import startfromcg dataset',
  'variant-1e-Nc :: specs/variants/1e-Nc.spec.ts > 1e × Nc — election selection bypassed; constituency selector shown with 3 options',
  'variant-Ne-Nc :: specs/variants/Ne-Nc.spec.ts > Ne × Nc — both selectors shown; constituency dropdown filters by selected election (no cross-bleed)',
  'variant-allowopen :: specs/voter/voter-allowopen.spec.ts > SETTINGS-02 entity comment surface is absent when entity has no answer.info',
  'variant-allowopen :: specs/voter/voter-allowopen.spec.ts > SETTINGS-02 entity comment surface present even when allowOpen flipped after authoring',
  'variant-allowopen :: specs/voter/voter-allowopen.spec.ts > SETTINGS-02 entity comment surface renders for allowOpen-true questions',
  'variant-constituency :: specs/variants/constituency.spec.ts > SETTINGS-01 wave B — constituency-filter (PRODUCT-GAP / PASS-WITH-DEFERRAL)',
  'variant-constituency :: specs/variants/constituency.spec.ts > should allow constituency selection and proceed to questions',
  'variant-constituency :: specs/variants/constituency.spec.ts > should answer questions and reach results',
  'variant-constituency :: specs/variants/constituency.spec.ts > should display constituency-filtered results',
  'variant-constituency :: specs/variants/constituency.spec.ts > should show constituency selection page after election selection',
  'variant-constituency :: specs/variants/constituency.spec.ts > should show election accordion in multi-election results',
  'variant-constituency :: specs/variants/constituency.spec.ts > should show missing nominations warning for partial-coverage constituency',
  'variant-hidden-required-candidate :: specs/candidate/candidate-required-info.spec.ts > SETTINGS-03 unanswered required info question disables profile-dependent CTAs on CandAppHome',
  'variant-hidden-required-voter :: specs/voter/voter-visibility-required.spec.ts > SETTINGS-03 hidden question absent from voter question flow',
  'variant-low-minimum-answers :: specs/voter/voter-browse-without-match.spec.ts > voter completes location, skips opinions, browses entity list without match scores',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > Ne × 1c — election selector shown; constituency auto-implied (single)',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should bypass election selection when disallowSelection is true',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should display election-specific questions',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should display questions and reach results',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should show election accordion and results after selecting election',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should show election selection page with 2 elections',
  'variant-results-sections :: specs/variants/results-sections.spec.ts > should show both sections with tabs when sections is ["candidate", "organization"]',
  'variant-results-sections :: specs/variants/results-sections.spec.ts > should show only candidates when sections is ["candidate"]',
  'variant-results-sections :: specs/variants/results-sections.spec.ts > should show only organizations when sections is ["organization"]',
  'variant-startfromcg :: specs/variants/startfromcg.spec.ts > should complete journey through questions to results',
  'variant-startfromcg :: specs/variants/startfromcg.spec.ts > should handle orphan municipality without error',
  'variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show constituency selection first (reversed flow)',
  'variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show election selection after constituency selection',
  'variant-startfromcg :: specs/variants/startfromcg.spec.ts > startFromConstituency — constituency selector shown first; elections list hidden; constituency URL segment present',
  'voter-app :: specs/voter/voter-navigation.spec.ts > browser-back preserves answer state across navigation',
  'voter-app :: specs/voter/voter-not-located-redirect.spec.ts > CLEAN-02 — election pre-selected via URL bounces only to constituency selector and resumes deferred target',
  'voter-app :: specs/voter/voter-not-located-redirect.spec.ts > CLEAN-02 — multi-election multi-constituency bounces twice and resumes deferred target with query params preserved',
  'voter-app :: specs/voter/voter-not-located-redirect.spec.ts > CLEAN-02 — open-redirect attempt to external URL is rejected by whitelist (defense-in-depth)',
  'voter-app :: specs/voter/voter-not-located-redirect.spec.ts > CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should not show any popup when disabled',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should show survey popup after delay on results page'
];

// -----------------------------------------------------------------------------
// Playwright JSON reporter types — inline to avoid coupling the script to the
// tests/ workspace's @playwright/test dependency graph.
// -----------------------------------------------------------------------------

interface PlaywrightErrorSnapshot {
  message?: string;
  stack?: string;
}

interface PlaywrightTestResult {
  status?: string;
  error?: PlaywrightErrorSnapshot;
  errors?: Array<PlaywrightErrorSnapshot>;
}

interface PlaywrightTest {
  projectName?: string;
  projectId?: string;
  results?: Array<PlaywrightTestResult>;
  status?: string;
}

interface PlaywrightSpec {
  title?: string;
  file?: string;
  tests?: Array<PlaywrightTest>;
}

interface PlaywrightSuite {
  title?: string;
  file?: string;
  specs?: Array<PlaywrightSpec>;
  suites?: Array<PlaywrightSuite>;
}

interface PlaywrightReport {
  suites?: Array<PlaywrightSuite>;
}

// -----------------------------------------------------------------------------
// Core diff logic (pure functions — importable for testing).
// -----------------------------------------------------------------------------

/** Categorized test status. `cascade` = did-not-run / skipped-by-upstream. */
type TestStatus = 'pass' | 'fail' | 'cascade';

interface FlatTest {
  id: string;
  status: TestStatus;
  rawStatus: string;
  errorMessage: string;
}

/**
 * Walk a Playwright JSON report and produce one `FlatTest` per test entry.
 * ID format matches the baseline/summary.md entries:
 *   `<projectName> :: <specFile> > <specTitle>`.
 */
export function flattenReport(report: PlaywrightReport): Array<FlatTest> {
  const out: Array<FlatTest> = [];
  const walk = (suites: Array<PlaywrightSuite> | undefined): void => {
    if (!suites) return;
    for (const suite of suites) {
      const suiteFile = suite.file ?? suite.title ?? '';
      for (const spec of suite.specs ?? []) {
        const specFile = spec.file ?? suiteFile;
        const specTitle = spec.title ?? '';
        for (const t of spec.tests ?? []) {
          const projectName = t.projectName ?? '';
          const firstResult = t.results?.[0] ?? {};
          // Playwright emits cascaded "did not run" tests with `results: []`
          // but a top-level `status: 'skipped'` on the test object itself.
          // Prefer results[0].status when present; fall back to t.status.
          const raw = firstResult.status ?? t.status ?? 'unknown';
          const err =
            firstResult.error?.message ??
            firstResult.errors?.[0]?.message ??
            '';
          const id = `${projectName} :: ${specFile} > ${specTitle}`;
          const status = categorizeStatus(raw, err);
          out.push({ id, status, rawStatus: raw, errorMessage: err });
        }
      }
      walk(suite.suites);
    }
  };
  walk(report.suites);
  return out;
}

/**
 * Categorize a raw Playwright status + error message into our tri-state.
 * - `passed` -> `pass`
 * - `skipped` with no error OR with cascade markers -> `cascade`
 * - anything else (`failed`, `timedOut`, `interrupted`) -> `fail`
 *
 * "Did not run" / cascade detection is based on empty error on a `skipped`
 * test — Playwright emits `skipped` both for `test.skip()` source markers
 * AND for upstream-dependency-failed cascades. The markdown summary.md curated
 * the 13 source-skip names; here we conservatively treat all `skipped` as
 * `cascade` and rely on the SOURCE_SKIP set filter below to exclude them from
 * regression checks if needed.
 */
function categorizeStatus(raw: string, err: string): TestStatus {
  if (raw === 'passed') return 'pass';
  if (raw === 'skipped') return 'cascade';
  // Any failure-family status counts as fail. Cascade patterns in the error
  // message demote it back to cascade (Playwright sometimes emits failed with
  // an "upstream dependency failed" message — treat as cascade).
  if (/did not run|setup.*failed|dependency.*failed/i.test(err)) return 'cascade';
  return 'fail';
}

export interface DiffRegression {
  id: string;
  from: TestStatus;
  to: TestStatus;
  reason: string;
}

export interface DiffResult {
  satisfied: boolean;
  regressions: Array<DiffRegression>;
  summary: {
    baseline: { pass: number; fail: number; cascade: number };
    post: { pass: number; fail: number; cascade: number };
    dataRacePoolSize: number;
    passLockedSize: number;
    cascadeBaselineSize: number;
  };
}

/**
 * Compare two reports and determine whether post-swap satisfies D-59-04.
 *
 * A regression is recorded when:
 *   1. A baseline-passing test is no longer passing post-swap, UNLESS the
 *      baseline-passing test is also in the data-race pool (never observed
 *      at present; defensive only).
 *   2. A test in CASCADE_TESTS moves into a failing state OUTSIDE the
 *      data-race pool post-swap (cascade -> fail is a BLOCKER; cascade ->
 *      pass or cascade -> cascade is acceptable; cascade -> data-race-pool
 *      is acceptable).
 *   3. A test NOT in PASS_LOCKED_TESTS, CASCADE_TESTS, DATA_RACE_TESTS, or
 *      SOURCE_SKIP appears in the post-swap report with status `fail` or
 *      `cascade` (new test regression — should not happen unless the
 *      report shape has changed).
 *
 * Summary.md's 13 source-skip tests (SOURCE_SKIP below) are excluded from all
 * gates per baseline/summary.md's "not part of the parity contract".
 */
export function diffReports(baseline: PlaywrightReport, post: PlaywrightReport): DiffResult {
  const baseFlat = flattenReport(baseline);
  const postFlat = flattenReport(post);
  const postById = new Map(postFlat.map((t) => [t.id, t]));

  const passLocked = new Set(PASS_LOCKED_TESTS);
  const dataRace = new Set(DATA_RACE_TESTS);
  const cascadeBaseline = new Set(CASCADE_TESTS);

  const regressions: Array<DiffRegression> = [];

  for (const b of baseFlat) {
    const p = postById.get(b.id);
    const postStatus: TestStatus = p?.status ?? 'cascade';

    // Rule 1: baseline-passing tests must still pass.
    if (passLocked.has(b.id)) {
      if (postStatus !== 'pass') {
        regressions.push({
          id: b.id,
          from: 'pass',
          to: postStatus,
          reason: 'baseline-passing test regressed (D-59-04 PASS_LOCKED violation)'
        });
      }
      continue;
    }

    // Rule 2: cascade-baseline tests — only block on fail-outside-pool.
    if (cascadeBaseline.has(b.id)) {
      if (postStatus === 'fail' && !dataRace.has(b.id)) {
        regressions.push({
          id: b.id,
          from: 'cascade',
          to: 'fail',
          reason:
            'cascade-baseline test entered new fail state outside the data-race pool ' +
            '(D-59-04 pool-growth violation)'
        });
      }
      continue;
    }

    // Data-race pool — flake acceptable; pool may shrink but not grow outward.
    if (dataRace.has(b.id)) {
      continue;
    }

    // If we reach here the baseline test is not tracked by any list —
    // source-skip markers or unexpected tests. Not part of the parity
    // contract. Skip.
  }

  // Rule 3: detect new failing tests in post report that weren't in baseline.
  const baselineIds = new Set(baseFlat.map((t) => t.id));
  for (const p of postFlat) {
    if (baselineIds.has(p.id)) continue;
    if (p.status === 'fail' || p.status === 'cascade') {
      regressions.push({
        id: p.id,
        from: 'cascade',
        to: p.status,
        reason: 'new test appeared post-swap in failing/cascade state'
      });
    }
  }

  const tally = (xs: Array<FlatTest>): { pass: number; fail: number; cascade: number } => ({
    pass: xs.filter((x) => x.status === 'pass').length,
    fail: xs.filter((x) => x.status === 'fail').length,
    cascade: xs.filter((x) => x.status === 'cascade').length
  });

  return {
    satisfied: regressions.length === 0,
    regressions,
    summary: {
      baseline: tally(baseFlat),
      post: tally(postFlat),
      dataRacePoolSize: dataRace.size,
      passLockedSize: passLocked.size,
      cascadeBaselineSize: cascadeBaseline.size
    }
  };
}

// -----------------------------------------------------------------------------
// CLI direct-invocation guard.
// -----------------------------------------------------------------------------

const isDirectInvocation =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('diff-playwright-reports.ts') ||
    process.argv[1].endsWith('diff-playwright-reports.js'));

if (isDirectInvocation) {
  const parsed = parseArgs({ allowPositionals: true, strict: false, options: {} });
  const positionals = parsed.positionals ?? [];
  if (positionals.length !== 2) {
    process.stderr.write('Usage: tsx diff-playwright-reports.ts <baseline.json> <post.json>\n');
    process.exit(2);
  }
  try {
    const basePath = positionals[0];
    const postPath = positionals[1];
    const baseRaw = readFileSync(basePath, 'utf8');
    const postRaw = readFileSync(postPath, 'utf8');
    // Strip optional dotenv banner line (Phase 73 captures via `yarn playwright …` write a
    // `[dotenv@…] injecting env …` line ahead of the JSON; the P64 captures did not). Split
    // on first '\n{' rather than first newline so the strip is robust to multi-line banners.
    const stripBanner = (raw: string): string => {
      const idx = raw.indexOf('\n{');
      return idx === -1 ? raw : raw.slice(idx + 1);
    };
    const baseParsed: unknown = JSON.parse(stripBanner(baseRaw));
    const postParsed: unknown = JSON.parse(stripBanner(postRaw));
    const result = diffReports(baseParsed as PlaywrightReport, postParsed as PlaywrightReport);

    process.stdout.write(
      `Baseline: ${result.summary.baseline.pass}p / ${result.summary.baseline.fail}f / ${result.summary.baseline.cascade}c\n`
    );
    process.stdout.write(
      `Post:     ${result.summary.post.pass}p / ${result.summary.post.fail}f / ${result.summary.post.cascade}c\n`
    );
    process.stdout.write(
      `Contract: ${result.summary.passLockedSize} pass-locked, ${result.summary.dataRacePoolSize} data-race pool, ${result.summary.cascadeBaselineSize} cascade-baseline.\n`
    );

    if (result.regressions.length === 0) {
      process.stdout.write('PARITY GATE: PASS — no regressions detected per D-59-04.\n');
      process.exit(0);
    }

    process.stdout.write(`PARITY GATE: FAIL — ${result.regressions.length} regression(s):\n`);
    for (const r of result.regressions) {
      process.stdout.write(`  - [${r.from} -> ${r.to}] ${r.id}\n`);
      process.stdout.write(`      ${r.reason}\n`);
    }
    process.exit(1);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(2);
  }
}
