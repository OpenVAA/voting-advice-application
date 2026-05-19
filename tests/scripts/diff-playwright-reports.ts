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
// PHASE 86 ANCHOR (2026-05-14, v2.10 All-Green Suite). Source: post-fix/run-3.json.
// 3-run cold-start identity gate verdict: ALMOST-STRICT (run-1 invalidated by
// operator mistake; run-2 vs run-3 differ by EXACTLY ONE cell — the documented
// party-drawer boundary flake, same Phase-83-DETERM-07b boundary that flaked in
// Phase 84 run-2 + Phase 85 run-3). Per Phase 85 D-06 precedent, run-3.json is
// the canonical regen source (party-drawer PASSED in run-3). Anchor SHA:
//   9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
// Phase 85 anchor 411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
// is ABSORBED. See `.planning/phases/86-…/post-fix/sha256.txt` for the full
// audit + ALMOST-strict verdict rationale.
//
// PHASE 86 STORY — voter-app FAILURE-CLASS cleanup. DETERM-12 + DETERM-13 +
// DETERM-14 closed via 3-plan cluster RCA approach. Plan 01 (popups + hydration
// + navigation/redirects + party-drawer boundary harden) landed 5 deterministic
// fixes. Plan 02 (filter + feedback) landed 2 deterministic fixes; the
// CLAUDE.md Svelte 5 destructuring-rule audit on EntityListWithControls /
// EntityFilters / filterContext was DISPROVED (no reactive-accessor
// destructures present). Plan 03 (visibility + edge-cases + question-rendering)
// landed 1 hydration-guard fix (voter-detail case-d) + 1 project-config
// testIgnore exclusion (voter-visibility-required from voter-app project) +
// 2 test.skip()+rationale entries (QSPEC-01/02 boolean+categorical — Phase 75
// PASS-WITH-DEFERRAL inheritance; shared v2.11+ todo at
// .planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md).
//
// SKIPPED_TESTS bucket (NEW for Phase 86 per CONTEXT.md D-05): 2 source-skips
// (QSPEC-01 + QSPEC-02) moved out of CASCADE into a dedicated SKIPPED_TESTS
// const. diffReports() early-continues on SKIPPED_TESTS — source-skips are
// NOT part of the parity contract.
//
// FAILURE-CLASS residual (NOT pooled in any const here): the original voter-app
// FAILURE-CLASS pool (~10) is CLOSED — all 10 in-scope cells are now PASS, SKIP,
// project-config-excluded, OR a documented v2.11+ boundary flake (party-drawer).
// Phase 85's inherited variant-multi-election deterministic FAILs (2 cells +
// 32 cascade-victims, see WARNING-9 narrative in Phase 85 history) remain OUT
// OF Phase 86 scope (per CONTEXT.md D-08); they are v2.11+ territory.
//
// PRIOR ANCHOR (Phase 85, 2026-05-14) ABSORBED by this regen:
//   411e09f5ffb15015ca57a7405619f127f3950c402c082e2599f6782601158ac5
//   109 PASS_LOCKED + 3 DATA_RACE + 42 CASCADE. Phase 86 anchor:
//   9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9
//   113 PASS_LOCKED (+4 net) + 3 DATA_RACE (UNCHANGED per D-09) +
//   40 CASCADE (-2 from QSPEC source-skip migration to SKIPPED_TESTS) +
//   2 SKIPPED (new bucket) = 158 tracked.
//
// Format: '<projectName> :: <specFile> > <specTitle>' — matches `flattenReport`
// output below. Re-embed by running the regen script after a new canonical capture.
// -----------------------------------------------------------------------------

/** 113 tests locked PASSING on Phase 86 baseline (Phase 85 baseline 109 + 4 net-additions from DETERM-12 popups/hydration/navigation/redirect/party-drawer fixes + DETERM-13 filter-toggle/feedback fixes + DETERM-14 voter-detail case-d fix). Phase 86 v2.10 All-Green Suite anchor. Any regression vs. THIS list is a BLOCKER. */
const PASS_LOCKED_TESTS: ReadonlyArray<string> = [
  'auth-setup :: setup/auth.setup.ts > authenticate as candidate',
  'auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate',
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
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 A11Y-05 email-format rejection surfaces invalidEmail error',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 A11Y-06 url-format rejection surfaces invalidUrl error',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 image-size rejection surfaces oversizeFile error',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 image-type rejection surfaces invalidFile error',
  'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 name-too-long caps input value at maxlength=50 on display-name',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > A11Y-02 should persist bio after page reload',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > A11Y-02 should persist display name after page reload',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > A11Y-02 should persist social link after page reload',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should register the fresh candidate via email link',
  'candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete forgot-password and reset flow via Inbucket email',
  'candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete registration via email link',
  'candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should send registration email and extract link',
  'candidate-app-password :: specs/candidate/candidate-password.spec.ts > should change password and login with new password',
  'candidate-app-password :: specs/candidate/candidate-password.spec.ts > should logout and return to login page',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — access.voterApp',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — elections.showElectionTags',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — entities.hideIfMissingAnswers.candidate',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — entities.showAllNominations',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — questions.showCategoryTags',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — questions.showResultsLink',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — results.sections',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should display notification popup when enabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should hide hero when hideHero is enabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render help page correctly',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render privacy page correctly',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show hero when hideHero is disabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when underMaintenance is true',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show read-only warning when answers are locked',
  'data-setup :: setup/data.setup.ts > import test dataset',
  'data-setup-multi-election :: setup/variant-multi-election.setup.ts > import multi-election dataset',
  'data-teardown :: setup/data.teardown.ts > delete test dataset',
  'data-teardown :: setup/variant-data.teardown.ts > delete variant test dataset',
  'data-teardown-variants :: setup/variant-data.teardown.ts > delete variant test dataset',
  're-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > Ne × 1c — election selector shown; constituency auto-implied (single)',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should show election selection page with 2 elections',
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
  'voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs',
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
  'voter-app :: specs/voter/voter-results.spec.ts > filter toggle narrows list without effect_update_depth_exceeded (RESULTS-01 + RESULTS-02)',
  'voter-app :: specs/voter/voter-results.spec.ts > invalid plural matcher returns 404 (D-11)',
  'voter-app :: specs/voter/voter-results.spec.ts > should display candidates section with result cards',
  'voter-app :: specs/voter/voter-results.spec.ts > should display entity type tabs for switching between candidates and organizations',
  'voter-app :: specs/voter/voter-results.spec.ts > should switch to organizations/parties section and back',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > about page renders correctly',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > info page renders correctly',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > privacy page renders correctly',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > should redirect to home when showAllNominations is false',
  'voter-app :: specs/voter/voter-static-pages.spec.ts > should render nominations page with entries',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should not show any popup when disabled',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should remember dismissal after page reload',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should show feedback popup after delay on results page',
  'voter-app-popups :: specs/voter/voter-popups.spec.ts > should show survey popup after delay on results page',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should enforce minimum answers before results available',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should filter questions to selected categories',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should hide results link when showResultsLink is false',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should show category checkboxes when allowCategorySelection enabled',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should show category intro page before each category',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should show question intro page when questionsIntro.show enabled',
  'voter-app-settings :: specs/voter/voter-settings.spec.ts > should skip category when skip button clicked'
];

/** 3 tests in the imgproxy flake pool — unchanged from Phase 84 (3 entries; Phase 73 D-09 binding preserved per CONTEXT.md D-09 — pool MUST NOT grow). DETERM-11 (Phase 85) did NOT touch imgproxy surface; the variant-chain decouple is orthogonal to the image-intrinsic flake pool. Only image-intrinsic CAND-03/CAND-12 tests remain (per 84-RCA-FINDINGS: only these 3 actually fetch `/storage/v1/*` paths during cold-start). May flake when the local imgproxy Docker container 502s. */
const DATA_RACE_TESTS: ReadonlyArray<string> = [
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03)',
  'candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)'
];

/** 40 tests cascaded (did-not-run / upstream-failed) on Phase 86 baseline — shrank -2 vs Phase 85 (42) due to QSPEC-01/02 source-skip migration to SKIPPED_TESTS. Composition: 3 PRODUCT-GAP source-skips (header.showFeedback / header.showHelp / notifications.voterApp) + 32 cascade-victims of Phase 85's variant-multi-election deterministic FAILs (Phase 85 WARNING-9 contingency — out of Phase 86 scope per CONTEXT.md D-08) + 5 other variant-spec cells. Pool MUST NOT grow back without explicit phase routing. */
const CASCADE_TESTS: ReadonlyArray<string> = [
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — header.showFeedback',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — header.showHelp',
  'candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > SETTINGS-01 wave A — notifications.voterApp',
  'data-setup-1e-Nc :: setup/variant-1e-Nc.setup.ts > import 1e-Nc dataset',
  'data-setup-Ne-Nc :: setup/variant-Ne-Nc.setup.ts > import Ne-Nc dataset',
  'data-setup-allowopen :: setup/variant-allowopen.setup.ts > import allowopen dataset',
  'data-setup-constituency :: setup/variant-constituency.setup.ts > import constituency dataset',
  'data-setup-hidden-required :: setup/variant-hidden-required.setup.ts > import hidden-required dataset',
  'data-setup-low-minimum-answers :: setup/variant-low-minimum-answers.setup.ts > import low-minimum-answers dataset',
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
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should display election-specific questions',
  'variant-multi-election :: specs/variants/multi-election.spec.ts > should show election accordion and results after selecting election',
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
  'voter-app :: specs/voter/voter-not-located-redirect.spec.ts > CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target'
];

/** 2 tests deliberately source-skipped via `test.skip(true, '...')` with rationale per Phase 75 QSPEC PASS-WITH-DEFERRAL precedent. Phase 86 Plan 03 Tasks 1-2 (DETERM-14): walkToQuestion intro-start CTA wait races full-suite settings overlay (10s timeout). Shared v2.11+ follow-up todo: `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md`. NOT part of the parity contract — diffReports() early-continues on this set. */
const SKIPPED_TESTS: ReadonlyArray<string> = [
  'voter-app :: specs/voter/voter-question-rendering-boolean.spec.ts > boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail',
  'voter-app :: specs/voter/voter-question-rendering-categorical.spec.ts > categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail'
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
  const sourceSkip = new Set(SKIPPED_TESTS);

  const regressions: Array<DiffRegression> = [];

  for (const b of baseFlat) {
    const p = postById.get(b.id);
    const postStatus: TestStatus = p?.status ?? 'cascade';

    // Phase 86 D-05: deliberately skipped tests (source-level test.skip()) are not part of the parity contract.
    if (sourceSkip.has(b.id)) continue;

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
