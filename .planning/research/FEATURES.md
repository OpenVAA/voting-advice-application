# Feature Research

**Domain:** E2E Testing Framework for SvelteKit + Strapi Monorepo (VAA)
**Researched:** 2026-03-03
**Confidence:** HIGH (Playwright docs + official guidance) / MEDIUM (ecosystem patterns from verified sources)

---

## Context

OpenVAA has an existing Playwright E2E suite covering the candidate app only. This research covers what features a _comprehensive, production-grade_ E2E framework needs for a monorepo with two distinct apps (voter app, candidate app), a Strapi backend, Docker-based infrastructure, and a planned migration path away from Strapi.

The milestone goal is not a greenfield framework — it is filling specific, identified gaps in an existing suite:

- Text-based selectors (fragile across i18n)
- No pre-defined datasets
- No database state reset between tests
- No voter app coverage
- No multi-configuration test runs
- No user story-driven organization

---

## Feature Landscape

### Table Stakes (Tests Are Unreliable Without These)

| Feature                                    | Why Expected                                                                                                                                                                                   | Complexity | Notes                                                                                                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test ID-based element selection**        | Text selectors break with i18n and content changes; `data-testid` attributes are stable                                                                                                        | MEDIUM     | Existing tests already partially use `getByTestId` (e.g. `login-submit`, `login-email`). Needs systematic coverage of all interactive elements in both apps.                                    |
| **Database state reset between test runs** | Shared mutable state causes cascading failures; password-change tests in `candidateApp-basics.spec.ts` already attempt manual cleanup and fail if interrupted                                  | HIGH       | Admin Tools plugin has `import` and `delete` API. Direct Strapi API calls are the right path — avoid UI-driven import via Playwright because it adds brittle UI dependency on top of tests.     |
| **Pre-defined, isolated test datasets**    | Tests currently depend on mock data seeded by `GENERATE_MOCK_DATA_ON_INITIALISE` flag at boot time, which cannot be varied per test                                                            | HIGH       | Need JSON dataset files per test scenario (e.g., `single-election`, `multi-election`, `no-nominations`). Admin Tools `import` service accepts structured JSON — datasets feed directly into it. |
| **Voter app test coverage**                | Voter app is the primary user-facing surface; currently completely uncovered                                                                                                                   | HIGH       | Voter app has 10+ routes: landing, intro, questions (per question and category), results, candidate detail, party detail, constituency selection, nominations. Each is a distinct flow.         |
| **Global setup and teardown**              | Authentication state must be established before tests run; current `global-setup.ts` handles candidate login but nothing else                                                                  | LOW        | Extend existing `global-setup.ts` to handle voter app state and dataset loading. Use Playwright's `project dependencies` pattern rather than bare `globalSetup` for better trace visibility.    |
| **Stable locator strategy policy**         | Team must apply consistent selector hierarchy or tests will diverge: `getByRole` for accessibility-bound elements, `getByTestId` for UI-only elements, never CSS class or structural selectors | LOW        | Document and enforce via ESLint custom rule or code review checklist. No build tooling required.                                                                                                |
| **Fixture-based test helpers**             | `beforeEach`/`afterEach` in specs is repetitive and error-prone; Playwright fixtures with `test.extend()` provide scoped, typed setup/teardown                                                 | MEDIUM     | Replace ad-hoc `beforeEach` blocks in specs with named fixtures: `authenticatedCandidatePage`, `freshDataset`, `voterPage`.                                                                     |
| **CI pipeline integration**                | Tests must run on every PR; current setup has no CI configuration                                                                                                                              | MEDIUM     | GitHub Actions workflow: checkout, install Playwright browsers, start Docker stack (or mock), run tests, upload HTML report as artifact with `if: always()` retention.                          |
| **HTML test reporting**                    | Playwright generates self-contained HTML report with traces per failed test; needed for debugging CI failures                                                                                  | LOW        | Already configured in `playwright.config.ts` via `['html', ...]` reporter. Needs CI artifact upload step.                                                                                       |
| **Trace collection on failures**           | Without traces, debugging CI failures requires guessing; traces show exact DOM state, network calls, screenshots                                                                               | LOW        | Already configured as `trace: 'on'`. For CI, change to `trace: 'on-first-retry'` to reduce storage while still capturing failures.                                                              |

### Differentiators (Competitive Advantage for This Framework)

| Feature                                            | Value Proposition                                                                                                                                                                                                                                                                  | Complexity | Notes                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Multi-configuration test projects**              | VAA deployments differ: single election vs. multiple elections, different feature flags, constituency selection on/off. Tests must verify behavior across configurations, not just the mock-data default                                                                           | HIGH       | Playwright `projects` array in config — one project per dataset/configuration combination. Each project loads a different JSON dataset via Admin Tools before tests run. Uses project-level `globalSetup` or project dependencies pattern. |
| **User story-driven test file organization**       | Current files (`candidateApp-basics`, `candidateApp-advanced`) group by complexity, not by user journey. Refactoring to user-story files (`candidate-registration.spec.ts`, `voter-questions.spec.ts`, `voter-results.spec.ts`) makes test intent clear and aligns with PR reviews | LOW        | Organizational change only — no new tooling. High payoff for maintainability.                                                                                                                                                              |
| **Page Object Model (POM) layer**                  | Candidate app has repeated sequences (log in, navigate, interact) scattered across specs. POMs encapsulate page interactions, so UI changes require updating one file not ten specs                                                                                                | MEDIUM     | Implement `CandidateLoginPage`, `VoterQuestionsPage`, `ResultsPage` etc. as TypeScript classes in `tests/poms/`. Playwright's built-in locator API makes POMs lightweight — no Selenium-style boilerplate needed.                          |
| **Test tagging by app and scenario type**          | `@voter`, `@candidate`, `@smoke`, `@registration`, `@matching` tags enable selective CI runs (e.g., only `@smoke` on every push, full suite on release branches)                                                                                                                   | LOW        | Tags via Playwright annotations API (`test.describe('...', { tag: ['@voter', '@smoke'] }, ...)`). Zero additional dependencies.                                                                                                            |
| **API-based data setup (not UI-driven)**           | Setting up test data through the Strapi API is 5-10x faster than navigating the Admin UI via Playwright, and removes a dependency on Strapi Admin UI stability. Admin Tools service already accepts structured JSON                                                                | MEDIUM     | Use Playwright `request` context (already used in `candidateApp-advanced.spec.ts` for email fetching) to call Admin Tools `/import` and `/delete` endpoints. Auth via Strapi API token stored in env vars.                                 |
| **Locale-aware test helpers**                      | Tests currently hardcode English locale and use `TRANSLATIONS` object. A helper `testAsLocale(locale)` that wraps common flows for both `en` and `fi` would surface i18n regressions automatically                                                                                 | MEDIUM     | Extend `buildRoute.ts` pattern. Create a `withLocale` fixture that parameterizes tests across supported locales. Run locale variants only in full suite (not smoke).                                                                       |
| **Screenshotter for visual regression baselining** | Capturing baseline screenshots of key pages (voter results page, candidate preview) before migrations (Svelte 5, Supabase) provides a safety net for visual regressions                                                                                                            | MEDIUM     | Playwright `toHaveScreenshot()` with stored snapshots checked into `tests/snapshots/`. Only run in dedicated visual regression project, not in main suite. Requires baseline update discipline.                                            |

### Anti-Features (Explicitly Avoid)

| Feature                                          | Why Requested                  | Why Problematic                                                                                                                                                                                                                            | Alternative                                                                                                                                                                     |
| ------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Parallel test execution with shared database** | Faster CI times                | Tests mutate shared Postgres state; without transaction-level isolation (unavailable when using the Strapi API layer), parallel runs cause non-deterministic failures. The existing config already sets `workers: 1` on CI for this reason | Keep CI serial (`workers: 1`). Use test tagging to run only smoke tests on every push; full serial suite on PR merge to main.                                                   |
| **UI-driven data import via Strapi Admin**       | "Tests the import feature too" | Strapi Admin UI is unstable across versions and already has commented-out import tests in `candidateApp-advanced.spec.ts`. Adds fragile dependency on Strapi UI not being the subject under test                                           | Use Admin Tools REST API directly via Playwright `request` context instead.                                                                                                     |
| **Full visual regression suite**                 | Catches CSS regressions        | Snapshot tests are extremely fragile across OS/browser rendering differences in CI vs. local; produce high false-positive rates; require constant baseline updates. This becomes a maintenance tax, not a safety net                       | Use visual regression only for a small set of critical rendered outputs (e.g., voter results page layout). Keep this as an opt-in project, not part of the main test run.       |
| **Testing Strapi Admin UI flows**                | "It's part of the system"      | Strapi is being migrated to Supabase. Investment in Strapi Admin UI tests has a short shelf life and actively resists the migration by creating coupling                                                                                   | Limit Strapi testing to API-level calls only. Admin UI flows are not end-user flows for OpenVAA.                                                                                |
| **Per-test database recreation**                 | Perfect isolation              | Recreating the full Postgres schema + Strapi init per test takes 10-30 seconds per test. With 50+ tests, this becomes a 25-minute suite                                                                                                    | Use pre-seeded fixed datasets loaded once per project via Admin Tools. Tests within a project that mutate state should clean up via `afterEach` API calls, not full recreation. |
| **Mocking the Strapi API in E2E tests**          | Faster, no Docker needed       | E2E tests exist to verify the real integration between frontend and backend. Mocking the API converts them into integration tests and loses the value of the E2E layer                                                                     | Keep E2E tests against the real running stack. Use unit/integration tests (already using Vitest) for mocking scenarios.                                                         |
| **End-to-end tests for the matching algorithm**  | "Cover everything"             | The matching algorithm is a pure function with comprehensive unit tests in `packages/matching`. E2E coverage of matching outputs is fragile (depends on exact data) and provides low signal above what unit tests already provide          | Trust unit tests for algorithm correctness. E2E tests verify that the voter sees _a_ results page with _some_ results — not exact match scores.                                 |

---

## Feature Dependencies

```
[Test ID-based selectors]
    └──enables──> [Locale-aware test helpers]  (selectors stable across locales)
    └──enables──> [Page Object Model layer]    (POMs use testId selectors as primary)

[Pre-defined test datasets]
    └──requires──> [API-based data setup]      (datasets are loaded via Admin Tools API)
    └──requires──> [Database state reset]      (datasets need clean slate to load into)
    └──enables──> [Multi-configuration projects] (each project = one dataset)

[Multi-configuration projects]
    └──requires──> [Pre-defined test datasets]
    └──requires──> [Database state reset]
    └──enables──> [Test tagging by scenario]   (tags select which config to run against)

[Fixture-based test helpers]
    └──requires──> [Global setup/teardown]     (fixtures compose on top of global state)
    └──enables──> [Page Object Model layer]    (POMs are a type of fixture)
    └──enables──> [Voter app test coverage]    (voter flows need auth/data fixtures)

[CI pipeline integration]
    └──requires──> [HTML test reporting]
    └──requires──> [Trace collection on failures]
    └──enhanced-by──> [Test tagging]           (selective runs per pipeline trigger)

[Voter app test coverage]
    └──requires──> [Test ID-based selectors]
    └──requires──> [Pre-defined test datasets]
    └──requires──> [Fixture-based test helpers]
```

### Dependency Notes

- **Pre-defined datasets require API-based data setup:** Loading JSON datasets into a running Strapi instance via the Admin Tools REST API is the only mechanism that works without full Docker restart. The Admin Tools `import` and `delete` services exist for exactly this purpose.
- **Multi-configuration projects require database state reset:** Each Playwright project must start from a known dataset. Without reset, project 2 inherits mutations from project 1.
- **Voter app coverage requires fixtures:** Voter app has no authentication but does need a specific data state (elections with questions) to be navigable. Without pre-loaded data fixtures, voter tests cannot reach the questions or results flows.
- **Test IDs enable everything downstream:** Without stable `data-testid` attributes on components, POMs and locale helpers must fall back to text selectors which break across i18n changes. Adding test IDs to the SvelteKit components is the foundational enabler.

---

## MVP Definition

### Launch With (v1 — E2E Framework Milestone)

- [ ] **Test ID attributes on all interactive elements in both apps** — Without this, all other selector work is built on sand. Add `data-testid` to login forms, navigation items, submit buttons, question inputs, result cards.
- [ ] **Pre-defined JSON test datasets (minimum 2: `standard`, `multi-election`)** — Required for reproducible test runs and multi-config testing.
- [ ] **API-based dataset load/reset helper** — TypeScript module wrapping Admin Tools API calls for import and delete. Used in global setup and per-test fixtures.
- [ ] **Fixture layer for authentication** — `authenticatedCandidatePage` fixture replacing the manual beforeEach login pattern in current specs.
- [ ] **Voter app test coverage (core journey)** — Landing → constituency selection (if applicable) → intro → questions (complete flow) → results page → candidate detail.
- [ ] **Candidate app test coverage (fill gaps)** — Pre-registration flow, registration link follow-through, all question types, preview.
- [ ] **User story file organization** — Rename and restructure spec files by user story: `candidate-registration.spec.ts`, `candidate-questions.spec.ts`, `voter-journey.spec.ts`, `translations.spec.ts`.
- [ ] **CI GitHub Actions workflow** — Run full suite on PR, upload HTML report artifact with `if: always()`.

### Add After Validation (v1.x)

- [ ] **Page Object Model layer** — Implement after MVP specs are written and patterns emerge. Refactor repeated interactions into POM classes. Trigger: more than 3 spec files share the same interaction sequence.
- [ ] **Multi-configuration Playwright projects** — Add second configuration project (`multi-election` dataset) once single-dataset suite is stable.
- [ ] **Test tagging** — Add `@smoke`, `@voter`, `@candidate` tags. Configure CI to run `@smoke` on push, full suite on PR.
- [ ] **Locale-aware test helpers** — Add Finnish locale parameterization to critical flows once English coverage is complete.

### Future Consideration (v2+)

- [ ] **Visual regression baseline suite** — Defer until after Svelte 5 migration (baselines would need to be rebuilt anyway). Implement as opt-in project.
- [ ] **Screenshotter integration** — Same rationale as visual regression; defer post-migration.
- [ ] **Supabase-compatible data layer** — When Strapi is replaced with Supabase, the Admin Tools API calls in test helpers must be replaced. The fixture interface should be stable; only the implementation changes. Design the fixture API to be backend-agnostic from the start.

---

## Feature Prioritization Matrix

| Feature                          | Dev Value | Implementation Cost | Priority |
| -------------------------------- | --------- | ------------------- | -------- |
| Test ID attributes on components | HIGH      | MEDIUM              | P1       |
| Pre-defined test datasets (JSON) | HIGH      | MEDIUM              | P1       |
| API-based dataset reset helper   | HIGH      | MEDIUM              | P1       |
| Voter app core journey coverage  | HIGH      | HIGH                | P1       |
| Authentication fixture           | HIGH      | LOW                 | P1       |
| CI GitHub Actions workflow       | HIGH      | LOW                 | P1       |
| User story file organization     | MEDIUM    | LOW                 | P1       |
| Page Object Model layer          | HIGH      | MEDIUM              | P2       |
| Multi-configuration projects     | HIGH      | MEDIUM              | P2       |
| Test tagging                     | MEDIUM    | LOW                 | P2       |
| Locale-aware test helpers        | MEDIUM    | MEDIUM              | P2       |
| Visual regression suite          | LOW       | HIGH                | P3       |

**Priority key:**

- P1: Must have for the E2E milestone to deliver value
- P2: Should have; add after P1 is stable
- P3: Nice to have; future milestone

---

## Competitor / Reference Analysis

| Pattern           | Existing OpenVAA                                                           | Industry Standard                                                         | Recommended Approach                                                                                               |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Element selection | Mix: `getByTestId` for some, `getByLabel`/`getByRole`/`getByText` for most | `getByRole` first (a11y-aligned), `getByTestId` for non-semantic elements | Audit and add testIds to all non-semantic interactive elements; keep `getByRole` for buttons, links, form controls |
| Test data         | Shared database from Docker boot-time seed                                 | Per-test or per-project isolated datasets loaded via API                  | JSON datasets + Admin Tools API for load/reset                                                                     |
| Test organization | By complexity (`basics`, `advanced`)                                       | By user story or feature                                                  | By user story (`voter-journey`, `candidate-registration`)                                                          |
| Auth setup        | UI-driven login in `globalSetup`                                           | Storage state reuse via Playwright `storageState`                         | Keep current storage state approach; add fixture wrapper for clean API                                             |
| State reset       | Manual cleanup in test (fragile)                                           | API-based cleanup in `afterEach` fixture                                  | Fixture wraps import + delete API calls                                                                            |
| CI                | Not configured                                                             | GitHub Actions with artifact upload                                       | Standard GitHub Actions workflow                                                                                   |
| Reporting         | HTML reporter (local)                                                      | HTML + artifact upload on CI                                              | Add upload step                                                                                                    |
| Multi-browser     | Chromium only                                                              | Chrome for CI; optional Firefox/WebKit                                    | Keep Chromium-only for speed; document adding browsers is straightforward                                          |

---

## Sources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — Official, HIGH confidence
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures) — Official, HIGH confidence
- [Playwright Test Annotations / Tags](https://playwright.dev/docs/test-annotations) — Official, HIGH confidence
- [Playwright Projects Configuration](https://playwright.dev/docs/test-projects) — Official, HIGH confidence
- [Playwright Global Setup and Teardown](https://playwright.dev/docs/test-global-setup-teardown) — Official, HIGH confidence
- [Playwright Page Object Models](https://playwright.dev/docs/pom) — Official, HIGH confidence
- [Database Rollback Strategies in Playwright](https://www.thegreenreport.blog/articles/database-rollback-strategies-in-playwright/database-rollback-strategies-in-playwright.html) — MEDIUM confidence, verified against Playwright docs
- [E2E Testing Monorepo Setup](https://www.kyrre.dev/blog/end-to-end-testing-setup) — MEDIUM confidence
- [BrowserStack Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) — MEDIUM confidence
- [Mainmatter: Mock database in Svelte e2e tests](https://mainmatter.com/blog/2025/08/21/mock-database-in-svelte-tests/) — MEDIUM confidence (Svelte-specific patterns)
- [17 Playwright Testing Mistakes to Avoid](https://elaichenkov.github.io/posts/17-playwright-testing-mistakes-you-should-avoid/) — MEDIUM confidence

---

_Feature research for: E2E Testing Framework — OpenVAA SvelteKit Monorepo_
_Researched: 2026-03-03_
