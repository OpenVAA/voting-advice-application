# Roadmap: OpenVAA E2E Testing Framework

## Overview

This roadmap covers Milestone 1 of the OpenVAA framework evolution: rebuilding the E2E test infrastructure from fragile, coverage-limited origins into a comprehensive, production-grade suite. The existing Playwright suite has three candidate app spec files plagued by text-based selectors, no database state reset, and zero voter app coverage. The work proceeds in strict dependency order — infrastructure foundations first, then candidate app restructure, then voter app coverage, then configuration variants, then CI integration, and finally advanced capabilities. No voter tests are written before the data isolation mechanism exists; no CI pipeline is wired before meaningful test coverage exists to run.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure Foundation** - Playwright upgrade, project dependencies pattern, API data management, testId attributes, fixture layer, ESLint plugin
- [ ] **Phase 2: Candidate App Coverage** - Restructure existing candidate tests and fill all missing flows using new infrastructure
- [ ] **Phase 3: Voter App Core Journey** - Cover landing through results for the primary user-facing surface currently at zero coverage
- [ ] **Phase 4: Voter App Settings and Edge Cases** - Cover configuration-driven voter features, optional pages, and app-mode edge cases
- [ ] **Phase 5: Configuration Variants** - Multi-dataset Playwright projects covering single vs. multi-election and constituency scenarios
- [ ] **Phase 6: CI Integration and Test Organization** - Wire CI pipeline, HTML report artifacts, and test tagging system
- [ ] **Phase 7: Advanced Test Capabilities** - Visual regression baseline suite and performance benchmark integration

## Phase Details

### Phase 1: Infrastructure Foundation

**Goal**: A test framework where any single test can run in isolation, in any order, with stable selectors and visible setup failures
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09
**Success Criteria** (what must be TRUE):

1. Running a single spec file in isolation produces the same result as running the full suite — no shared state leaks between tests
2. When the `data.setup.ts` project fails, the failure appears in the HTML report with a trace, not as a cryptic cascade of test failures
3. Every interactive element in both voter and candidate apps can be selected via `data-testid` attribute without using text content or CSS classes
4. The Admin Tools API can load and delete a complete test dataset in under 5 seconds, verified by a passing setup/teardown project
5. The ESLint Playwright plugin flags `waitForTimeout` calls and text-based click targets as errors in CI
   **Plans:** 10 plans

Plans:

- [x] 01-01-PLAN.md — Playwright upgrade to 1.58.2, project dependencies config, strapiAdminClient.ts, testIds constants
- [x] 01-02-PLAN.md — Default test dataset JSON, data setup/teardown projects, auth setup project
- [x] 01-03-PLAN.md — Add data-testid attributes to voter app route pages (14 files)
- [x] 01-04-PLAN.md — Add data-testid attributes to candidate auth/public pages and candidate-specific components (14 files)
- [x] 01-05-PLAN.md — Fixture layer (index.ts, auth.fixture.ts) and page object model stubs (LoginPage, HomePage, QuestionsPage)
- [x] 01-06-PLAN.md — ESLint Playwright plugin configuration (eslint-plugin-playwright)
- [x] 01-07-PLAN.md — Add data-testid attributes to shared/dynamic components used by voter app (16 files)
- [x] 01-08-PLAN.md — Add data-testid attributes to candidate protected pages including profile-submit rename (6 files)
- [x] 01-09-PLAN.md — [GAP CLOSURE] Reconcile testIds.ts constants with component values, fix naming mismatches, update page objects
- [x] 01-10-PLAN.md — [GAP CLOSURE] Add missing data-testid attributes to results, entity details, navigation, registration, settings, constituency components

### Phase 2: Candidate App Coverage

**Goal**: Complete candidate app coverage organized by user story, with each spec file independently runnable and isolated
**Depends on**: Phase 1
**Requirements**: CAND-01, CAND-02, CAND-03, CAND-04, CAND-05, CAND-06, CAND-07, CAND-08, CAND-09, CAND-10, CAND-11, CAND-12, CAND-13, CAND-14, CAND-15
**Success Criteria** (what must be TRUE):

1. A developer can run `candidate-auth.spec.ts` alone and it passes without any prior test having run — login, logout, password change, and reset flows all covered
2. The registration via email link flow is tested end-to-end: email received, link extracted, password set, candidate auto-logged in
3. All candidate question types (opinion questions with all field types, comments, translations) are covered with test IDs as selectors
4. The candidate preview page is tested and verifies that all entered profile and opinion data displays correctly
5. App-mode edge cases (answers locked, candidateApp disabled, underMaintenance) all redirect or show correct UI without manual intervention
   **Plans**: TBD

Plans:

- [ ] 02-01: Candidate auth spec (login, logout, password change, password reset)
- [ ] 02-02: Candidate registration spec (email link, pre-registration, auto-login)
- [ ] 02-03: Candidate profile spec (image upload, info questions, all field types)
- [ ] 02-04: Candidate questions spec (all opinion question types, translations, comments, editing)
- [ ] 02-05: Candidate app-mode and settings specs (locked answers, disabled app, maintenance, notifications, help/privacy, question visibility)

### Phase 3: Voter App Core Journey

**Goal**: The voter happy path from landing page through results and candidate detail is covered with isolated, reproducible tests
**Depends on**: Phase 1
**Requirements**: VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-05, VOTE-06, VOTE-07, VOTE-08, VOTE-09, VOTE-10, VOTE-11, VOTE-12
**Success Criteria** (what must be TRUE):

1. A voter can complete the full journey from landing page to results page in a single test run using the standard dataset — all steps (election selection if applicable, constituency, intro, questions, results) covered
2. All three results section types (candidates-only, organizations-only, candidates-plus-parties hybrid) are individually tested and display correct match rankings
3. Candidate detail and party detail pages display all tabs (info, opinions, submatches) and the voter can navigate between them
4. The minimum answers threshold is enforced — the results link does not appear until the required number of questions are answered
5. Election and constituency selection flows are tested for both single and hierarchical selection scenarios
   **Plans**: TBD

Plans:

- [ ] 03-01: Voter dataset and setup project (standard dataset with candidates, questions, parties)
- [ ] 03-02: Voter journey spec (landing, election/constituency selection, intro, questions flow)
- [ ] 03-03: Voter results spec (all three results section types, minimum answers threshold, results link)
- [ ] 03-04: Voter detail pages spec (candidate detail tabs, party detail tabs, submatches)

### Phase 4: Voter App Settings and Edge Cases

**Goal**: All configuration-driven voter features, optional pages, and UI behaviors are verified by tests
**Depends on**: Phase 3
**Requirements**: VOTE-13, VOTE-14, VOTE-15, VOTE-16, VOTE-17, VOTE-18, VOTE-19
**Success Criteria** (what must be TRUE):

1. The category selection feature (`allowCategorySelection`) shows the category picker when enabled and hides it when disabled — both states are tested
2. Feedback and survey popups appear after their configured triggers (delay and results display respectively) without using `waitForTimeout`
3. The nominations page renders with candidate listings when `showAllNominations=true`
4. The results link in the header appears only after the minimum answers threshold is reached — tested across a session boundary
5. Static pages (about, help, info, privacy, statistics) all render without errors for an unauthenticated visitor
   **Plans**: TBD

Plans:

- [ ] 04-01: Voter optional features spec (category selection, nominations page)
- [ ] 04-02: Voter popups and deferred UI spec (feedback popup, survey popup, results link timing)
- [ ] 04-03: Voter static pages spec (about, help, info, privacy, statistics)

### Phase 5: Configuration Variants

**Goal**: Multiple Playwright projects, each with a distinct dataset, cover the major deployment configuration combinations
**Depends on**: Phase 3
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06, CONF-07, CONF-08
**Success Criteria** (what must be TRUE):

1. Running `playwright test --project=single-election` executes a full voter journey without an election selection step and passes
2. Running `playwright test --project=multi-election` executes a voter journey that includes the election selection step and passes
3. The constituency-enabled project exercises the constituency selection step; the constituency-disabled project skips it — both pass independently
4. Each configuration variant has its own JSON dataset file loaded by a dedicated setup project
5. Organizations-only and candidates-only results configurations are each verified by a passing test in their respective project
   **Plans**: TBD

Plans:

- [ ] 05-01: Multi-election dataset and Playwright project configuration
- [ ] 05-02: Constituency variant datasets and projects (enabled and disabled)
- [ ] 05-03: Results section variant datasets (candidates-only, organizations-only)

### Phase 6: CI Integration and Test Organization

**Goal**: The full test suite runs automatically on every pull request with a visible HTML report and selective run capability
**Depends on**: Phase 2, Phase 3
**Requirements**: CI-01, CI-02, CI-03
**Success Criteria** (what must be TRUE):

1. Opening a pull request automatically triggers the full E2E suite in GitHub Actions and posts a pass/fail status check
2. After every CI run, an HTML test report artifact is available for download from the Actions run page
3. Running `playwright test --grep @smoke` executes only smoke-tagged tests in under 2 minutes; `--grep @voter` runs only voter tests; `--grep @candidate` runs only candidate tests
   **Plans**: TBD

Plans:

- [ ] 06-01: GitHub Actions workflow update (existing CI updated for new test structure, HTML report artifact upload)
- [ ] 06-02: Test tagging system (smoke, voter, candidate tags applied to all spec files)

### Phase 7: Advanced Test Capabilities

**Goal**: Visual regression baselines and performance benchmarks are established as first-class test suite members
**Depends on**: Phase 2, Phase 3
**Requirements**: INFRA-10, INFRA-11
**Success Criteria** (what must be TRUE):

1. Running `playwright test --grep @visual` captures or compares screenshots for the voter results page and candidate preview page — a UI diff fails the test
2. Running `playwright test --grep @perf` asserts that the voter results page loads within a defined time budget (e.g., Time to Interactive < 3s on the standard dataset)
3. Both visual and performance tests are gated and excluded from the default `yarn test:e2e` run to avoid false positives in development
   **Plans**: TBD

Plans:

- [ ] 07-01: Visual regression baseline capture and comparison tests
- [ ] 07-02: Performance benchmark tests with defined time budgets

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase                                   | Plans Complete | Status      | Completed |
| --------------------------------------- | -------------- | ----------- | --------- |
| 1. Infrastructure Foundation            | 8/10           | Gap closure | -         |
| 2. Candidate App Coverage               | 0/5            | Not started | -         |
| 3. Voter App Core Journey               | 0/4            | Not started | -         |
| 4. Voter App Settings and Edge Cases    | 0/3            | Not started | -         |
| 5. Configuration Variants               | 0/3            | Not started | -         |
| 6. CI Integration and Test Organization | 0/2            | Not started | -         |
| 7. Advanced Test Capabilities           | 0/2            | Not started | -         |
