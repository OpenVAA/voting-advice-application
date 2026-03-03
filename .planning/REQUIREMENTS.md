# Requirements: OpenVAA E2E Testing Framework

**Defined:** 2026-03-03
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## v1 Requirements

Requirements for Milestone 1: E2E Testing Framework. Each maps to roadmap phases.

### Test Infrastructure

- [ ] **INFRA-01**: All interactive elements in both voter and candidate apps have `data-testid` attributes
- [ ] **INFRA-02**: Playwright upgraded from 1.49.1 to latest stable (1.58+)
- [ ] **INFRA-03**: Global setup replaced with Playwright project dependencies pattern
- [ ] **INFRA-04**: Fixture-extended page object model established for all apps
- [ ] **INFRA-05**: API-based data management using Admin Tools endpoints (`/import-data`, `/delete-data`)
- [ ] **INFRA-06**: Database state resets reliably between test runs via API
- [ ] **INFRA-07**: Pre-defined JSON test datasets for default configuration
- [ ] **INFRA-08**: Test helper utilities for common tasks (navigation, authentication, data setup)
- [ ] **INFRA-09**: ESLint Playwright plugin configured for test quality enforcement
- [ ] **INFRA-10**: Visual regression testing capability with screenshot comparison
- [ ] **INFRA-11**: Performance benchmarks integrated into test suite

### Candidate App

- [ ] **CAND-01**: Login/logout flow tested with new fixture pattern and test IDs
- [ ] **CAND-02**: Password change flow tested with new pattern
- [ ] **CAND-03**: Profile setup tested (image upload, info questions, all field types)
- [ ] **CAND-04**: Opinion question answering tested (all question types, translations, comments)
- [ ] **CAND-05**: Answer editing and category navigation tested
- [ ] **CAND-06**: Preview page tested (all entered data displays correctly)
- [ ] **CAND-07**: Registration via email link tested (email extraction, password set, auto-login)
- [ ] **CAND-08**: Password reset flow tested (forgot password, email link, reset, validation)
- [ ] **CAND-09**: Answers locked mode tested (read-only state, edit buttons disabled)
- [ ] **CAND-10**: App disabled mode tested (access denied/redirect when `candidateApp=false`)
- [ ] **CAND-11**: Maintenance mode tested (maintenance page shown when `underMaintenance=true`)
- [ ] **CAND-12**: Data persistence tested (data survives page reload/session restart)
- [ ] **CAND-13**: Candidate notification display tested
- [ ] **CAND-14**: Help and privacy pages render correctly
- [ ] **CAND-15**: Question content visibility settings tested (`hideVideo`, `hideHero`)

### Voter App

- [ ] **VOTE-01**: Home/landing page loads and displays correctly
- [ ] **VOTE-02**: Election selection flow tested (multi-election scenario)
- [ ] **VOTE-03**: Constituency selection flow tested (single and hierarchical)
- [ ] **VOTE-04**: Question intro page tested (shown/hidden based on settings)
- [ ] **VOTE-05**: Category intro pages tested (shown with skip option based on settings)
- [ ] **VOTE-06**: Question answering flow tested (all opinion question types)
- [ ] **VOTE-07**: Minimum answers threshold tested (results available only after N answers)
- [ ] **VOTE-08**: Results display tested with candidates section
- [ ] **VOTE-09**: Results display tested with organizations/parties section
- [ ] **VOTE-10**: Results display tested with hybrid (candidates + parties) section
- [ ] **VOTE-11**: Candidate detail page tested (info tab, opinions tab, submatches)
- [ ] **VOTE-12**: Party detail page tested (candidates list, info, opinions tabs)
- [ ] **VOTE-13**: Category selection feature tested (`allowCategorySelection` setting)
- [ ] **VOTE-14**: Statistics page tested
- [ ] **VOTE-15**: Feedback popup tested (displays after configured delay)
- [ ] **VOTE-16**: Survey popup tested (displays in results)
- [ ] **VOTE-17**: Results link in header tested (appears after minimum answers)
- [ ] **VOTE-18**: About, help, info, and privacy pages render correctly
- [ ] **VOTE-19**: Nominations page tested (when `showAllNominations=true`)

### Configuration Variants

- [ ] **CONF-01**: Single election configuration tested end-to-end (no election selection step)
- [ ] **CONF-02**: Multiple elections configuration tested (election selection, per-election results)
- [ ] **CONF-03**: Constituency enabled configuration tested (constituency step in flow)
- [ ] **CONF-04**: Constituency disabled configuration tested (no constituency step)
- [ ] **CONF-05**: Candidates-only results section configuration tested
- [ ] **CONF-06**: Organizations-only results section configuration tested
- [ ] **CONF-07**: Separate test datasets created for each configuration variant
- [ ] **CONF-08**: Playwright projects configured per dataset for multi-configuration testing

### CI Pipeline

- [ ] **CI-01**: Existing CI pipeline updated to work with new test structure
- [ ] **CI-02**: HTML test report artifact uploaded from CI runs
- [ ] **CI-03**: Test tagging system for selective test runs (smoke, full, per-app)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Testing

- **ADV-01**: Bank authentication (Signicat/OIDC) pre-registration flow tested
- **ADV-02**: Full locale-specific testing (Finnish, Swedish, Danish)
- **ADV-03**: All settings permutation matrix tested
- **ADV-04**: Network failure and error state testing
- **ADV-05**: Concurrent operation testing
- **ADV-06**: Session timeout behavior testing
- **ADV-07**: Email template verification (beyond registration)
- **ADV-08**: Interactive info feature testing (experimental)

## Out of Scope

| Feature                                     | Reason                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| Bank authentication (Signicat/OIDC) testing | Complex external dependency, requires mock IdP setup          |
| Mobile/responsive testing                   | Web-first, responsive testing deferred                        |
| Load/stress testing                         | Different tool category, not E2E scope                        |
| Unit test improvements                      | Separate concern from E2E framework                           |
| Backend API testing                         | Focus is on user-facing E2E flows                             |
| Admin app E2E testing                       | Admin app is preliminary, will change with Supabase migration |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement                         | Phase | Status |
| ----------------------------------- | ----- | ------ |
| (populated during roadmap creation) |       |        |

**Coverage:**

- v1 requirements: 46 total
- Mapped to phases: 0
- Unmapped: 46 (pending roadmap)

---

_Requirements defined: 2026-03-03_
_Last updated: 2026-03-03 after initial definition_
