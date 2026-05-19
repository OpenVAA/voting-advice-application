---
title: E2E Test Inventory — pre-v2.8
captured: 2026-05-08
purpose: Coverage evaluation input for v2.8 (E2E coverage milestone). Lists every Playwright test in `tests/tests/specs/` with a one-line user story, grouped by directory + describe block.
source: `tests/tests/specs/**/*.spec.ts` (22 spec files)
totals:
  candidate: 33
  voter: 47
  variants: 18
  visual: 4
  perf: 1
  grand_total: ~103
---

# E2E Test Inventory — pre-v2.8

The `tests/README.md` file is currently a one-line description with no test catalog. This document is built directly from the `test()` and `voterTest()` calls in each spec, grouped first by directory (which reflects the natural product-area split) then by describe block.

## Tag legend

- `@smoke` — minimal cross-cutting subset (subset of `@candidate` / `@voter`)
- `@candidate` — candidate app surface
- `@voter` — voter app surface
- `@variant` — multi-config / overlay-driven scenarios
- `@visual` — screenshot regression (opt-in via `PLAYWRIGHT_VISUAL`)
- `@perf` — performance budget (opt-in via `PLAYWRIGHT_PERF`)
- `@bank-auth` — Idura/Signicat OIDC auth flow (opt-in; needs Edge Function keys)

---

## Candidate app — `tests/tests/specs/candidate/` (33 tests)

### `candidate-auth.spec.ts` (2 tests, `@candidate @smoke`)

Group: **candidate authentication**

- `should login with valid credentials` — Candidate logs in with valid email/password and lands on the candidate home page.
- `should show error on invalid credentials` — Candidate submits wrong credentials and sees an error message; remains on the login page.

### `candidate-bank-auth.spec.ts` (6 tests, `@bank-auth`, opt-in)

Group: **candidate bank authentication**

- `should create candidate via identity-callback Edge Function` — A bank-authenticated identity (Signicat or Idura) hits the identity-callback Edge Function and a new candidate row is created.
- `should return session with magic link when candidate is created` — The Edge Function returns a session magic link the frontend can use to complete first-time login. (Conditionally skipped when Edge Function keys are not configured.)
- `should handle CORS preflight correctly` — Preflight `OPTIONS` requests against the identity-callback function return correct CORS headers.
- `should reject requests without id_token` — Calls without an `id_token` body field are rejected with a clear error.
- `should reject invalid tokens` — Calls with malformed/expired/invalid `id_token` are rejected without creating a candidate.

### `candidate-password.spec.ts` (2 tests, `@candidate` / `@candidate @smoke`)

Group: **candidate password change**

- `should change password and login with new password` — Logged-in candidate changes their password from settings and can subsequently log in with the new password.

Group: **candidate logout**

- `should logout and return to login page` — Candidate logs out and is redirected back to the login page; subsequent protected-route access redirects to login.

### `candidate-profile.spec.ts` (4 tests, `@candidate`)

Group: **candidate profile (fresh candidate)**

- `should register the fresh candidate via email link` — Fresh candidate completes registration via the magic-link email and lands on the protected profile.
- `should upload a profile image (CAND-03)` — Candidate uploads a profile image and sees it rendered in their profile.
- `should show editable info fields on profile page (CAND-03)` — Profile page renders editable info fields (name, email, etc.) for the candidate.
- `should persist profile image after page reload (CAND-12)` — Uploaded profile image survives a full page reload (persisted to backend, not just in-memory).

### `candidate-questions.spec.ts` (8 tests, `@candidate`)

Group: **candidate opinion questions**

- `should display question cards organized by category (CAND-05)` — Candidate questions page groups question cards under their respective categories.
- `should answer a Likert opinion question and save (CAND-04)` — Candidate selects an answer to a Likert question and the answer is persisted.
- `should navigate between categories (CAND-05)` — Candidate can move between categories and the question list updates accordingly.
- `should edit a previously answered question (CAND-05)` — Candidate revisits a previously answered question, changes the answer, and the new answer is persisted.
- `should persist question answers after page reload (CAND-12)` — Saved answers survive a full page reload.
- `should persist comment text on a question after page reload (CAND-12)` — Comment text on a question survives a full page reload.

Group: **candidate preview**

- `should display entered profile and opinion data on preview page (CAND-06)` — Preview page shows the candidate's filled-in profile and opinion data the way voters will see it.
- `should show specific candidate data (name or answered question) in preview (CAND-06)` — Preview page renders specific data points (name, answered question text) that prove the data round-trips.

### `candidate-registration.spec.ts` (3 tests, `@candidate`)

Group: **candidate registration via email**

- `should send registration email and extract link` — Pre-registered candidate receives a registration email; test extracts the magic link from Inbucket/Mailpit.
- `should complete registration via email link` — Candidate clicks the registration link, sets a password, and lands authenticated in the candidate app.

Group: **candidate password reset**

- `should complete forgot-password and reset flow via Inbucket email` — Candidate requests a password reset, receives an email, sets a new password, and can log in with it.

### `candidate-settings.spec.ts` (8 tests, `@candidate`)

Group: **app mode: answers locked (CAND-09)**

- `should show read-only warning when answers are locked` — When `appCustomization.candidate.appMode = 'answers-locked'`, a read-only banner is shown and answers cannot be edited.

Group: **app mode: disabled (CAND-10)**

- `should show maintenance page when candidateApp is disabled` — When `appCustomization.candidate.appMode = 'disabled'`, candidates see the maintenance page instead of the candidate app.

Group: **app mode: maintenance (CAND-11)**

- `should show maintenance page when underMaintenance is true` — When the dynamic maintenance flag is set, candidates see the maintenance page.

Group: **candidate notifications (CAND-13)**

- `should display notification popup when enabled` — When notifications are enabled in settings, the candidate sees a notification popup on landing.

Group: **help and privacy pages (CAND-14)**

- `should render help page correctly` — `/candidate/help` renders the configured help page content.
- `should render privacy page correctly` — `/candidate/privacy` renders the configured privacy page content.

Group: **question visibility settings (CAND-15)**

- `should hide hero when hideHero is enabled` — When `appSettings.candidate.questions.hideHero = true`, the hero section above the questions is hidden.
- `should show hero when hideHero is disabled` — When `hideHero = false` (default), the hero is shown.

---

## Voter app — `tests/tests/specs/voter/` (47 tests)

### `voter-journey.spec.ts` (4 tests, `@voter @smoke`)

Group: **voter journey**

- `should load home page and display start button` — Voter lands on the home page and sees a clear primary "start" CTA.
- `should auto-imply election and constituency` — When only one election + one constituency exist, the voter is auto-routed past selection screens.
- `should show questions intro page with start button` — Questions intro page renders with a "start" CTA.
- `should answer all Likert questions with navigation` — Voter answers a full set of Likert questions using next/back navigation and reaches the end of the question flow.

### `voter-questions.spec.ts` (2 tests, `@voter`)

Group: **voter questions intro**

- `fresh session defaults to all opinion categories checked + counter non-zero on first paint` — On the questions intro page, all opinion categories are checked by default and the question counter shows a non-zero count immediately.
- `counter updates reactively on category toggle` — Toggling a category checkbox immediately updates the question counter without delay or full reload.

### `voter-settings.spec.ts` (7 tests, `@voter`)

Group: **category selection (VOTE-13)**

- `should show category checkboxes when allowCategorySelection enabled` — When `allowCategorySelection = true`, voters see category checkboxes on the intro page.
- `should filter questions to selected categories` — Unchecking a category removes its questions from the answer flow.

Group: **category intros (VOTE-05)**

- `should show category intro page before each category` — When category intros are enabled, voters see an intro screen before each category's questions.
- `should skip category when skip button clicked` — On a category intro, clicking "skip" jumps past that category's questions.

Group: **question intro page (VOTE-04)**

- `should show question intro page when questionsIntro.show enabled` — When `questionsIntro.show = true`, voters see a single intro page before any questions.

Group: **minimum answers threshold (VOTE-07)**

- `should enforce minimum answers before results available` — When `minAnswers > 0`, voters cannot reach results until they have answered at least that many questions.

Group: **results link visibility (VOTE-17)**

- `should hide results link when showResultsLink is false` — When `showResultsLink = false`, the results link is hidden from navigation.

### `voter-static-pages.spec.ts` (5 tests, `@voter @smoke` / `@voter`)

Group: **static pages (VOTE-18)**

- `about page renders correctly` — `/about` renders the configured about-page content.
- `info page renders correctly` — `/info` renders the configured info-page content.
- `privacy page renders correctly` — `/privacy` renders the configured privacy-policy content.

Group: **nominations page (VOTE-19)** > **when enabled**

- `should render nominations page with entries` — When `showAllNominations = true`, `/nominations` renders nomination entries.

Group: **nominations page (VOTE-19)** > **when disabled**

- `should redirect to home when showAllNominations is false` — When `showAllNominations = false`, visiting `/nominations` redirects to the home page.

### `voter-popups.spec.ts` (4 tests, `@voter`)

Group: **feedback popup (VOTE-15)**

- `should show feedback popup after delay on results page` — On the results page, a feedback popup appears after the configured delay.
- `should remember dismissal after page reload` — Once dismissed, the feedback popup does not reappear on subsequent reloads (within retention window).

Group: **survey popup (VOTE-16)**

- `should show survey popup after delay on results page` — On the results page, a survey popup appears after the configured delay.

Group: **popups disabled**

- `should not show any popup when disabled` — When all popup toggles are off, neither feedback nor survey popups appear.

### `voter-popup-hydration.spec.ts` (1 test, `@voter`)

Group: **setTimeout popup on full page load (LAYOUT-03 regression gate)**

- `popup appears on full page load to /results (LAYOUT-03 hydration path)` — A `setTimeout`-driven popup mounts correctly on a full page load (not just SPA nav) — regression gate against the v2.6 popup hydration class of bug.

### `voter-detail.spec.ts` (4 tests, `@voter`)

Group: **voter entity detail**

- `should open candidate detail drawer when clicking a result card` — Clicking a result card opens the candidate detail drawer.
- `should display candidate info and opinions tabs` — The candidate drawer renders both info and opinions tabs.
- `should display candidate answers correctly in info and opinions tabs` — Candidate answers (including comments) render correctly in the drawer's tabs.
- `should open party detail drawer with info, candidates, and opinions tabs` — Clicking a party result card opens a drawer with info, member-candidates, and opinions tabs.

### `voter-matching.spec.ts` (7 tests, `@voter`)

Group: **matching algorithm verification**

- `should display candidates in correct match ranking order` — Candidates appear in match-distance tier order; ties may shuffle within a tier.
- `should show perfect match candidate as top result` — A candidate whose answers exactly match the voter's appears first.
- `should show worst match candidate as last result` — A candidate whose answers are maximally opposite appears last.
- `should show partial-answer candidate in results with valid score` — A candidate who answered only some questions still appears with a valid match score (not first, not last).
- `should NOT show hidden candidate (no termsOfUseAccepted)` — Candidates without ToU acceptance are excluded from results entirely.
- `should confirm category intros were not shown during journey (VOTE-05 partial negative coverage)` — Negative-path check that disabled category intros are absent from the journey.
- `should confirm results accessible after all questions answered (VOTE-07 partial above-threshold coverage)` — When the voter has answered all questions (above any threshold), the results page is reachable.

### `voter-results.spec.ts` (13 tests, `@voter`)

Group: **voter results**

- `should display candidates section with result cards` — Results page renders the candidates section with the expected number of cards.
- `should display entity type tabs for switching between candidates and organizations` — Entity-type tab strip is visible with at least 2 tabs (candidates + organizations).
- `should switch to organizations/parties section and back` — Voter can switch to the organizations tab, see the party section, and switch back to candidates.
- `canonical URL: /results redirects to /results/candidates (RESEARCH A3)` — Bare `/results` redirects to the canonical `/results/candidates` URL.
- `filter toggle narrows list without effect_update_depth_exceeded (RESULTS-01 + RESULTS-02)` — Toggling a filter narrows the visible list and does not trigger the v2.6 reactivity infinite-loop.
- `filter state resets on plural tab switch (D-14)` — Switching the entity-type tab resets the filter state for the new tab.
- `filter state survives drawer open/close (D-15)` — Opening and closing an entity drawer preserves the active filter state.
- `deeplink list+drawer URL renders both (RESULTS-03, D-08 shape 3)` — A deeplink URL containing both list and drawer parameters renders both surfaces correctly.
- `deeplink edge case: organizations list + candidate drawer (D-08 shape 4)` — Cross-type URL (organizations list + candidate drawer) renders correctly.
- `Browser Back steps through tab+drawer changes (D-13)` — Browser-back navigates through tab/drawer state changes one at a time.
- `invalid plural matcher returns 404 (D-11)` — A URL with an invalid plural-tab segment returns a 404.
- `coupling-rule redirect: singular without id → list view (D-11)` — A URL with the singular segment but no id is redirected to the list view (coupling guard).
- `drawer paints before list on cold deeplink (D-10 source-order + content-visibility)` — On a cold deeplink load, the drawer renders before the list body (perceived-performance optimization).

---

## Configuration variants — `tests/tests/specs/variants/` (18 tests, `@variant`)

### `multi-election.spec.ts` (5 tests)

Group: **Multi-election voter journey**

- `should show election selection page with 2 elections` — Voter lands on an election-selection page when 2+ elections are configured.
- `should display questions and reach results` — After selecting an election, voter answers questions and reaches the results page.
- `should show election accordion and results after selecting election` — Results page shows an accordion grouping results by selected election.
- `should display election-specific questions` — The question set is scoped to the selected election.

Group: **disallowSelection mode**

- `should bypass election selection when disallowSelection is true` — When the variant disallows selection, voter is auto-routed past the election picker.

### `constituency.spec.ts` (6 tests)

Group: **Constituency selection variant**

- `should show constituency selection page after election selection` — When the variant requires constituency selection, voter sees the constituency picker after election.
- `should allow constituency selection and proceed to questions` — Voter selects a constituency and proceeds to the questions flow.
- `should answer questions and reach results` — Voter completes the questions flow under a constituency-scoped variant and reaches results.
- `should show election accordion in multi-election results` — Results page shows the election accordion in multi-election + constituency mode.
- `should display constituency-filtered results` — Results are filtered to the selected constituency.
- `should show missing nominations warning for partial-coverage constituency` — When a constituency has partial coverage, a warning appears in results.

### `results-sections.spec.ts` (3 tests)

Group: **Results section variants**

- `should show only candidates when sections is ["candidate"]` — `app_settings.results.sections = ['candidate']` shows only the candidates surface.
- `should show only organizations when sections is ["organization"]` — `sections = ['organization']` shows only the organizations surface.
- `should show both sections with tabs when sections is ["candidate", "organization"]` — `sections = ['candidate', 'organization']` shows both with the entity-tabs strip.

### `startfromcg.spec.ts` (4 tests)

Group: **startFromConstituencyGroup variant**

- `should show constituency selection first (reversed flow)` — When `startFromConstituencyGroup = true`, the constituency picker comes before the election picker.
- `should show election selection after constituency selection` — Selecting a constituency surfaces the election picker scoped to that constituency.
- `should complete journey through questions to results` — Reversed-flow journey reaches results successfully.
- `should handle orphan municipality without error` — A municipality not linked to any election does not break the reversed flow.

---

## Visual regression — `tests/tests/specs/visual/visual-regression.spec.ts` (4 tests, `@visual`, opt-in)

Group: **Voter Results - Desktop @visual**

- `screenshot matches baseline` — Voter results page (desktop viewport) matches its baseline screenshot.

Group: **Voter Results - Mobile @visual**

- `screenshot matches baseline` — Voter results page (mobile viewport) matches its baseline screenshot.

Group: **Candidate Preview - Desktop @visual**

- `screenshot matches baseline` — Candidate preview page (desktop viewport) matches its baseline screenshot.

Group: **Candidate Preview - Mobile @visual**

- `screenshot matches baseline` — Candidate preview page (mobile viewport) matches its baseline screenshot.

Baselines stored at `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/{candidate-preview-{desktop,mobile},voter-results-{desktop,mobile}}.png`.

---

## Performance budget — `tests/tests/specs/perf/performance-budget.spec.ts` (1 test, `@perf`, opt-in)

Group: **Performance budgets**

- `voter results page loads within budget` — Voter results page meets a documented performance budget on a full page load.

---

## Coverage observations (for v2.8 scoping)

Surfaces / scenarios with **no current E2E coverage** (or known thin coverage) that the user may want to fill in v2.8:

### Voter app gaps
- **Filter type matrix** — only `EnumeratedFilter` via `nominate_for` (party affiliation) is covered. `NumberFilter`, `TextFilter` (modal-based, not the search bar), categorical-question filters, constituency-based filters, and `FilterGroup` AND/OR composition are uncovered. (Captured in pending todo `2026-04-27-extend-e2e-filter-type-coverage.md`.)
- **Alliance results surface** — Phase 67 added alliances to default seed but the alliance card render path is deferred (3 lanes captured in pending todo `2026-04-30-alliance-tab-rendering-and-sections-config.md`); no E2E covers the Alliance tab's user story.
- **Match comparison / political compass** — projection to lower-dimensional spaces (mentioned as a feature of `@openvaa/matching`) has no voter-flow E2E.
- **Match SubMatches by category** — voter-detail tests verify info+opinions tabs but not the per-category match breakdown.
- **Locale switching** — i18n is a v1.2 milestone capability; no E2E covers a voter switching locale and verifying translated UI.
- **Boolean question rendering** — v2.6 added `BooleanQuestion` voter-flow rendering but the smoke is single-shot (was Phase 61 verification); no permanent E2E gate exists.
- **Categorical (single/multi-choice) question rendering** — similar to boolean; covered indirectly by matching tests but not as a focused user story.
- **Question comments** — `voter-detail` shows comments rendering in the drawer but voter cannot author comments; if voters ever can comment that's a gap.
- **Embeds / shareable links / "share my results"** — if these features exist or are planned, currently zero coverage.
- **Accessibility (axe / keyboard / screen-reader smoke)** — the project commits to WCAG 2.1 AA; no automated a11y E2E sweep is wired into the suite.

### Candidate app gaps
- **Profile field validation** — happy paths covered; rejection paths (invalid email format, name length, image type/size) uncovered.
- **Profile field persistence beyond the image** — `CAND-12` covers image + answers + comment text reload; other profile fields (name, bio, social links) lack reload-persistence E2E.
- **Question visibility / answer-required logic** — `hideHero` is covered; per-question visibility flags or "must answer" enforcement not covered.
- **Pre-registration → invite → registration full chain** — `candidate-registration.spec.ts` covers the email + link path; the admin-side pre-registration step (Edge Function `preregister-candidate`) has no end-to-end coverage outside of unit tests.
- **Bank-auth full integration** — `should return session with magic link when candidate is created` is conditionally skipped when keys are not configured; no permanent gate.
- **Logout while answering questions / in profile flow** — only login-page logout is covered.
- **Multi-session / concurrent edit** — flagged in `2026-03-28-investigate-migrating-candidate-answer-store.md`.

### Variant / config gaps
- **`appCustomization` toggles individually** — `candidate-settings.spec.ts` covers app-mode + notifications + hideHero + help/privacy; the matrix of all `appSettings` / `appCustomization` toggles is far larger.
- **Multi-language `app_settings.fixed[]` paths** — variants exercise toggles but not localized variants.
- **Question `customData.allowOpen`** — flagged as a known gap in v2.0 milestone notes; still uncovered.
- **`disallowSelection` for constituencies** — multi-election covers it; constituency-only path doesn't.

### Infrastructure / deterministic-suite gaps
- **`test.skip(true, …)` audit** — Phase 64 cleared `voter-results.spec.ts`; the rest of the suite has not been swept (pending todo `2026-04-27-remove-e2e-skip-modifiers.md`).
- **Test rerun stability / 19 known data-loading race failures** — captured in `PROJECT.md` Future as "resolve 19 pre-existing data-loading race E2E failures."
- **Performance budgets** — only 1 perf test (voter results page); other surfaces (candidate questions, results drawer cold deeplink) have no perf gate.
- **Visual baselines** — only 4 (voter results × 2 viewports + candidate preview × 2 viewports); no voter-questions, voter-detail, candidate-questions, candidate-profile baselines.
- **Negative-path tagging** — no tag like `@negative` to easily run only sad-path / error-handling tests.

### Currently flaky / cascading
- 19 pre-existing data-loading race E2E failures (carried forward from v2.6).
- 1 conditional skip in `candidate-bank-auth.spec.ts` (Edge Function keys).

---

## Suggested v2.8 coverage workstream shape

Based on the gaps above, three plausible cuts:

1. **Determinism first** — remove all `test.skip(true, …)`, fix the 19 data-loading race failures, then add new coverage on top of a stable base.
2. **Surface-completeness first** — fill in alliance, filter-type matrix, locale switching, a11y sweep so the suite reflects shipped product breadth, then stabilize.
3. **Pyramid view** — split into smoke-tier (must-pass, deterministic), feature-tier (`@candidate` / `@voter`), and audit-tier (`@visual` / `@perf` / `@a11y`); enforce different stability bars per tier.

The user is the right voter on which cut shapes v2.8 best.
