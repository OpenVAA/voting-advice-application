# Project Research Summary

**Project:** E2E Testing Framework for OpenVAA (SvelteKit 2 + Strapi v5 Monorepo)
**Domain:** End-to-end test infrastructure — existing Playwright suite refactored into a comprehensive, production-grade framework
**Researched:** 2026-03-03
**Confidence:** HIGH

## Executive Summary

OpenVAA already has Playwright installed and three working spec files covering the candidate app. The E2E milestone is not about choosing a test tool — it is about rebuilding the structural foundations of the existing suite to make it reliable, extensible, and complete. Four systemic problems make the current suite fragile: text-based selectors that break on i18n changes, no database state reset so tests accumulate side effects, a globalSetup pattern that hides setup failures from the HTML reporter, and zero voter app coverage despite the voter app being the primary user-facing surface. Fixing these in the wrong order will result in building new tests on top of the same broken foundation.

The recommended approach is to treat Phase 1 entirely as infrastructure: establish test data management via the Admin Tools API, replace globalSetup with Playwright project dependencies, add data-testid attributes to components, configure browser locale and CI timeouts, and write the fixture layer. Only then should new spec files be written. This ordering is critical — writing voter app tests before the data reset mechanism exists will recreate the same cascading failure problem that already plagues the candidate tests. The Admin Tools plugin (`/import-data`, `/delete-data`) is the correct mechanism for all data management; Playwright-driven Strapi admin UI navigation is explicitly an anti-pattern here.

The biggest risk is investing in the wrong abstractions too early. Research from PITFALLS.md strongly warns against building a POM inheritance hierarchy before duplication is observed in actual tests. The right sequence is: utilities and constants first, then setup/teardown projects, then page objects (flat, no inheritance), then fixtures composing page objects, then spec files consuming fixtures. No new npm packages are required. All dependencies already exist in the monorepo. The Playwright version should be bumped from 1.49.1 to 1.58.2 to access project teardown improvements and the latest auto-waiting behavior.

## Key Findings

### Recommended Stack

The existing stack already contains everything needed. `@playwright/test`, TypeScript, `@faker-js/faker`, `dotenv`, `mailparser`, and `cheerio` are all installed. The only required action is bumping `@playwright/test` from `^1.49.1` to `^1.58.2` and running `yarn playwright install chromium` to update browser binaries. No new packages should be added.

The key architectural change is eliminating `globalSetup` in favor of Playwright project dependencies. Project dependencies (`setup` project with `testMatch: '**/*.setup.ts'`) appear in the HTML reporter, produce traces on failure, and compose cleanly with fixtures — `globalSetup` does none of these. The Strapi admin API is the data management mechanism: `POST /admin/login` for JWT, then `/api/openvaa-admin-tools/import-data` and `/api/openvaa-admin-tools/delete-data` for state management.

**Core technologies:**

- `@playwright/test ^1.58.2`: Test runner, fixture engine, API request context, project dependencies — already installed, needs version bump only
- TypeScript (monorepo version): Type-safe page objects and fixtures — already the monorepo language, no setup needed
- `@faker-js/faker ^8.4.1`: Per-run unique test data to prevent parallel-run collisions — already installed as root devDependency

**Supporting tools:**

- Playwright HTML Reporter: Already configured, needs CI artifact upload step added
- Playwright VS Code Extension: Install separately for development ergonomics
- `eslint-plugin-playwright`: Add to enforce `no-wait-for-timeout` and discourage text-based selectors

### Expected Features

The feature research draws a clear line between P1 (required for the milestone to deliver value) and P2 (should add after P1 is stable). The dependency graph is strict: test IDs must exist before page objects can be written; dataset management must work before voter tests can be written; fixture layer must exist before spec files should be written.

**Must have (table stakes — P1):**

- Test ID attributes on all interactive elements in both apps — without this, all selector work is fragile
- Pre-defined JSON test datasets (minimum: `standard`, `multi-election`) — required for reproducible and isolated test runs
- API-based dataset load/reset helper wrapping Admin Tools endpoints — replaces the broken UI-driven import pattern
- Authentication fixture replacing manual beforeEach login — eliminates serial mode dependency for auth state
- Voter app core journey coverage (landing → questions → results → candidate detail) — zero coverage currently is a P1 gap
- CI GitHub Actions workflow with HTML report artifact upload — tests without CI are not production-grade
- User story file organization (`candidate-registration.spec.ts`, `voter-journey.spec.ts`, etc.) — replaces `basics`/`advanced` complexity grouping

**Should have (P2 — add after P1 stable):**

- Page Object Model layer — extract after 3+ spec files share the same interaction sequence
- Multi-configuration Playwright projects (one per dataset/configuration) — add second dataset project once single-dataset suite is stable
- Test tagging (`@smoke`, `@voter`, `@candidate`) — enable selective CI runs per trigger type
- Locale-aware test helpers — parameterize critical flows across `en` and `fi` once English coverage is complete

**Defer (v2+):**

- Visual regression baseline suite — defer until after Svelte 5 migration; baselines would need full rebuild
- Supabase-compatible data layer — design fixture API to be backend-agnostic now, implement swap when migration happens

### Architecture Approach

The test framework is organized as five discrete layers, each with a single responsibility: spec files assert user stories; the fixture layer provides typed pre-initialized page objects and state; the page object layer encapsulates UI interactions per page; the helper/utility layer provides shared functions (route builder, translations, test ID constants, Strapi API client); and the setup/teardown layer manages data and auth state via Playwright projects. These layers have strict dependency direction — spec files depend on fixtures, fixtures depend on page objects, page objects depend on utilities, setup/teardown depends on the Strapi API client.

**Major components:**

1. `setup/` (Playwright projects) — auth.setup.ts establishes storageState; data.setup.ts imports standard dataset via Admin Tools API; teardown.ts deletes by externalId prefix
2. `pages/` (Page Object Models) — flat TypeScript classes per page, organized by app (voter/, candidate/, shared/), using TEST_IDS constants as primary selector mechanism
3. `fixtures/` — Playwright `test.extend()` providing typed page objects and session state; `mergeTests()` combines voter and candidate fixture sets
4. `data/datasets/` — typed TypeScript definitions (not raw JSON) for test scenarios; factories for dynamic per-test records
5. `utils/` — `testIds.ts` (centralized data-testid constants), `strapiAdminClient.ts` (HTTP wrapper for Admin API), existing `buildRoute.ts` and `translations.ts` (keep and extend)

The build order for implementation is: utilities and testIds first (unblocks everything), then datasets and factories, then page objects (voter, candidate, shared in parallel), then setup/teardown projects, then fixtures, then spec files, then playwright.config.ts projects.

### Critical Pitfalls

1. **Serial mode dependency chains** — The existing tests use `test.describe.configure({ mode: 'serial' })` causing cascading failures where one broken test shows 8+ failures. Avoid by combining multi-step flows into single tests with `test.step()` and using fixtures for state setup. Never use serial mode as a substitute for proper state isolation.

2. **Shared mutable database state without reset** — Tests currently share the Docker-seeded database. Password changes leave state behind; if the change test fails midway, subsequent tests fail on login. Fix with API-based teardown in fixtures that runs even when tests fail — never rely on manual cleanup steps within a test body.

3. **Text-content selectors as interaction targets** — The existing suite uses `getByRole('link', { name: T.en['...'] })` for click targets extensively. These break on i18n changes. Use `getByTestId(TEST_IDS.x.y)` for interaction targets; reserve text-based assertions for verifying visible content only.

4. **Strapi Admin UI automation for data management** — The existing `candidateApp-advanced.spec.ts` navigates the Strapi admin to trigger emails; CSV import was commented out because it broke. Admin UIs are brittle automation targets. Use direct REST API calls via `request.newContext()` for all data setup and teardown.

5. **`waitForTimeout` as a timing mechanism** — The existing tests use `waitForTimeout(500)` and `waitForTimeout(5000)` for UI transitions and email delivery. These are both slow and flaky. Replace with state-based assertions (`expect(locator).toBeVisible()`) and `expect.poll()` for async conditions like email delivery.

## Implications for Roadmap

Based on combined research, the phase structure must be: infrastructure foundations before any new test writing, then candidate app gap-filling, then voter app coverage, then advanced features. Attempting to write voter app tests before the infrastructure phases are complete will recreate the same problems that exist in the current suite.

### Phase 1: Test Infrastructure Foundation

**Rationale:** All current test failures trace back to missing infrastructure. Building new tests on the existing broken foundation is actively harmful — it creates more technical debt to unwind later. Every pitfall identified maps to Phase 1. This phase is entirely infrastructure: no new user-story tests are written.
**Delivers:** A test framework where any single test can run in isolation, any test can run in any order, setup failures appear in the HTML report with traces, and the selector strategy is stable across i18n changes.
**Addresses:** Test ID attributes on components, API-based dataset reset helper, authentication fixture, global timeout and CI configuration, locale control in playwright.config.ts
**Avoids:** Serial mode dependency chains (Pitfall 1), shared mutable database state (Pitfall 2), text-content selectors (Pitfall 3), Admin UI data management (Pitfall 4), waitForTimeout timing (Pitfall 5)
**Research flag:** Standard patterns — Playwright project dependencies, fixture system, and Admin Tools API are all well-documented. Skip research-phase; implement directly from STACK.md patterns.

### Phase 2: Candidate App Gap-Fill and Restructure

**Rationale:** The candidate app already has partial coverage but is organized by complexity (`basics`, `advanced`) rather than user story, and missing flows (pre-registration, all question types, preview). Restructuring and filling gaps before adding the voter app gives a proven testing pattern to replicate.
**Delivers:** Complete candidate app coverage organized by user story: auth, registration, questions, profile, settings. Each spec file is independently runnable and isolated.
**Addresses:** User story file organization, candidate registration flow, all question type coverage, profile and settings coverage
**Avoids:** Monolithic spec files per app (Architecture Anti-Pattern 5), state carry-over between tests (Architecture Anti-Pattern 2)
**Research flag:** Standard patterns — no additional research needed. The existing test patterns extended with Phase 1 infrastructure are sufficient.

### Phase 3: Voter App Core Coverage

**Rationale:** The voter app is the primary user-facing surface with zero current E2E coverage. It cannot be tested until Phase 1 data infrastructure exists (voter tests require pre-loaded questions and candidates). This phase delivers the highest value per effort after foundations are established.
**Delivers:** Voter happy path covered: landing → constituency selection (if applicable) → intro → questions (complete flow) → results page → candidate detail. Minimum: `voter-journey.spec.ts`, `voter-results.spec.ts`.
**Addresses:** Voter app core journey coverage (P1 feature), voter-specific test datasets (`standard` with complete candidate data)
**Avoids:** Missing test coverage for voter app (Pitfall 9), tests coupled to mock data internals (Pitfall 8)
**Research flag:** Needs research consideration — the voter app has more configuration variants than the candidate app (single vs. multi-election, constituency selection on/off, different question types affecting matching output). Consider a brief research-phase to identify the minimum viable voter app test scenarios and data requirements before implementation.

### Phase 4: CI Integration and Test Organization Maturity

**Rationale:** Tests without CI are not production-grade. Once both apps have coverage, wiring CI, adding HTML report artifact upload, and introducing test tagging enables selective per-trigger runs. This phase also introduces the Page Object Model layer, which should only be extracted after duplication is observed in actual spec files.
**Delivers:** GitHub Actions workflow running full suite on PR, `@smoke`/`@voter`/`@candidate` tags enabling selective runs, HTML report uploaded as artifact, Page Object Model layer extracted from repeated interaction patterns.
**Addresses:** CI GitHub Actions workflow (P1), test tagging (P2), Page Object Model layer (P2)
**Avoids:** Over-engineering the abstraction layer (Pitfall 6) — POM is only introduced after duplication is observed, not upfront
**Research flag:** Standard patterns for GitHub Actions + Playwright CI. Use `mcr.microsoft.com/playwright:v1.58.2-noble` Docker image. No additional research needed.

### Phase 5: Multi-Configuration and Locale Coverage

**Rationale:** VAA deployments vary significantly (single vs. multi-election, feature flags, constituency on/off). Once the core suite is stable, adding a second Playwright project with a different dataset covers configuration variants. Finnish locale parameterization catches i18n regressions automatically.
**Delivers:** Multi-configuration Playwright projects (`multi-election` dataset), locale-aware test helpers running critical flows in both `en` and `fi`.
**Addresses:** Multi-configuration projects (P2), locale-aware test helpers (P2)
**Avoids:** Tests only verifying mock-data-default configuration (missed coverage gap)
**Research flag:** Standard patterns for Playwright multi-project configuration. The locale parameterization builds on the `buildRoute.ts` pattern already in the codebase. No additional research needed.

### Phase Ordering Rationale

- Phase 1 must come first because every other phase depends on data isolation. Building voter app tests without data reset creates the same cascading failure problem that already plagues candidate tests.
- Phase 2 before Phase 3 because the candidate app patterns provide a proven template for voter app tests. Getting the fixture and page object patterns right on familiar ground is lower risk than learning the patterns on the more complex voter app.
- Phase 4 CI integration is placed after core coverage exists so the CI workflow runs a meaningful test suite from day one rather than running 3 candidate tests.
- Phase 5 multi-configuration is last because it requires a stable single-configuration suite as a baseline. Multi-config tests that fail intermittently in a flaky single-config suite are impossible to debug.
- The entire roadmap is structured to respect the Supabase migration planned for 2026. The Admin Tools API wrapper (`strapiAdminClient.ts`) should be designed with a backend-agnostic interface from Phase 1 so only the implementation changes when Strapi is replaced, not the fixture API.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (Voter App Coverage):** The voter app has multiple configuration variants affecting what routes are reachable and what data is required. A brief research-phase to enumerate the minimum viable test scenarios and map data requirements to Admin Tools API capabilities is recommended before spec writing begins.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Infrastructure):** Playwright project dependencies, fixture system, Admin Tools API, testId conventions — all well-documented with verified patterns in STACK.md and ARCHITECTURE.md.
- **Phase 2 (Candidate Gap-Fill):** Extends existing candidate test patterns; no novel integration problems.
- **Phase 4 (CI Integration):** GitHub Actions + Playwright CI is a solved problem with official documentation.
- **Phase 5 (Multi-Config/Locale):** Builds directly on Playwright projects documentation and existing `buildRoute.ts` pattern.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                    |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Verified against Playwright official docs; existing codebase audited directly. No new packages required — high confidence the plan is feasible without dependency surprises.             |
| Features     | HIGH       | P1/P2 prioritization verified against official Playwright best practices. Feature dependencies are internally consistent across FEATURES.md and ARCHITECTURE.md.                         |
| Architecture | HIGH       | Five-layer architecture follows official Playwright fixture/project patterns. Component boundaries and build order derived from existing codebase analysis plus official documentation.  |
| Pitfalls     | HIGH       | Pitfalls 1-5 are directly observed in the existing test suite (not theoretical). Prevention strategies are grounded in official Playwright documentation and verified community sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Admin Tools API capability coverage:** Research assumes the `/import-data` and `/delete-data` endpoints support all data types needed for voter app test scenarios (elections with questions, candidates with answers, parties, constituencies). This should be verified against the admin-tools plugin source before Phase 3 data setup is designed. If gaps exist, a Playwright-driven admin UI fallback may be needed for specific data types only.

- **Voter app route enumeration:** The voter app has 10+ routes (landing, intro, questions per category, results, candidate detail, party detail, constituency selection, nominations). The research identifies the happy path but does not enumerate the minimum viable coverage set. This should be defined explicitly in Phase 3 planning to prevent scope creep.

- **Playwright 1.58 upgrade side effects:** Playwright 1.57+ switches from Chromium to Chrome for Testing. The bump from 1.49.1 to 1.58.2 should be tested against the existing suite before any new tests are written to catch any browser behavior differences.

- **ESLint Playwright plugin configuration:** The research recommends `eslint-plugin-playwright` for enforcing `no-wait-for-timeout` and discouraging text-based selectors. The exact rule configuration (errors vs. warnings, which rules to enable) should be decided during Phase 1 setup to avoid churn when the plugin is introduced later.

## Sources

### Primary (HIGH confidence)

- Playwright official docs (fixtures, projects, auth, API testing, global setup): https://playwright.dev/docs — comprehensive, directly applicable
- Playwright release notes v1.49–v1.58: https://playwright.dev/docs/release-notes — verified version compatibility
- Playwright best practices: https://playwright.dev/docs/best-practices — informed P1/P2 prioritization
- Playwright POM docs: https://playwright.dev/docs/pom — architecture patterns
- FakerJS framework guide: https://fakerjs.dev/guide/frameworks — test data patterns
- Existing codebase audit (`tests/`, admin-tools plugin, frontend components): direct analysis — informed all pitfall identifications

### Secondary (MEDIUM confidence)

- DataFactory pattern (playwrightsolutions.com) — dataset and factory pattern validation
- Database rollback strategies in Playwright (thegreenreport.blog) — data reset strategy options
- Mock database in Svelte E2E tests (Mainmatter, 2025) — Svelte-specific data management patterns
- Setting up E2E testing in a monorepo (kyrre.dev) — monorepo project structure patterns
- BrowserStack Playwright best practices (2026) — CI configuration recommendations
- "17 Playwright Testing Mistakes" (elaichenkov.github.io) — pitfall cross-validation
- Strapi auth blog (official Strapi): https://strapi.io/blog — Strapi API token patterns

---

_Research completed: 2026-03-03_
_Ready for roadmap: yes_
