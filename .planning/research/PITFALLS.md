# Pitfalls Research

**Domain:** E2E testing framework for a SvelteKit 2 + Strapi v5 monorepo (Voting Advice Application)
**Researched:** 2026-03-03
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Serial Mode Test Dependency Chains

**What goes wrong:**
Tests are written with `test.describe.configure({ mode: 'serial' })` and each test depends on the side effects of the previous one. When test 3 of 10 fails, tests 4-10 are all skipped. The CI report shows 8 failures, but 7 of them are false negatives — you have no signal about whether the underlying features actually work. This pattern is already present in the existing tests (`candidateApp-basics.spec.ts` and `candidateApp-advanced.spec.ts` both use serial mode).

**Why it happens:**
Tests that need authenticated state, or that test multi-step flows, reach for serial mode as the path of least resistance. The existing test suite uses serial mode because the global-setup logs in once and shares session state across all tests in a file. When state-mutating tests (e.g., password change) are sequenced this way, isolation becomes impossible without resetting state between tests.

**How to avoid:**

- Replace serial describe blocks with independent tests. For multi-step flows (e.g., the full registration flow in `candidateApp-advanced.spec.ts`), combine the entire flow into a single test using `test.step()`.
- Use Playwright fixtures to set up per-test state (login, data seeding) rather than relying on execution order.
- Use `storageState` per test group with Playwright project dependencies (`setup` project) instead of a global pre-authenticated session that bleeds between tests.

**Warning signs:**

- `test.describe.configure({ mode: 'serial' })` in more than one place
- Test names that include "after previous test" or "then user should"
- A test that explicitly logs out before logging back in with a different user (currently in `candidateApp-advanced.spec.ts`)
- CI showing 8+ failures when only 1 test actually broke

**Phase to address:** Phase 1 (E2E Testing Framework foundation — before writing new tests)

---

### Pitfall 2: Shared Mutable Database State Without Reset

**What goes wrong:**
Tests run against the same database state across the entire suite. One test mutates state (changes a password, creates a candidate, modifies answers), and subsequent tests find unexpected data. The current test suite already handles this ad hoc — `candidateApp-basics.spec.ts` manually resets the password at the end of the password-change test. If the test fails midway, the database is left in an inconsistent state and the next run fails on login, not on the actual code under test.

**Why it happens:**
Seeding via `GENERATE_MOCK_DATA_ON_RESTART=true` is coarse-grained — it wipes and re-seeds everything, which is too slow for per-test reset. Per-test database reset via the Strapi API or Admin Tools plugin is not implemented, so tests share state.

**How to avoid:**

- Establish a clear data reset strategy before writing new tests. Options (in order of preference):
  1. Direct Strapi REST API calls in Playwright fixtures to create/delete test-specific entities (HIGH confidence this is feasible given existing API token mechanism).
  2. Use the existing Admin Tools "Delete Data" endpoint to reset between test groups, then re-import from a known JSON fixture.
  3. `GENERATE_MOCK_DATA_ON_RESTART=true` as a last resort — only acceptable for the full CI run, not individual test isolation.
- Never rely on manual cleanup at the end of a test. If a test fails, cleanup is skipped. Use `afterEach` or Playwright fixture teardown which runs even on failure.
- When the backend migrates to Supabase, design the reset mechanism against the API abstraction layer (not Strapi-specific endpoints) from day one.

**Warning signs:**

- Tests that manually reset state at the end (password change tests restoring the original password)
- `waitForTimeout(5000)` calls for email delivery — a sign the test is waiting for async side effects it cannot control
- Commented-out import functionality in tests (the Strapi import was broken and tests were adapted around it)
- Tests that fail differently on second run than on first

**Phase to address:** Phase 1 (establish reset strategy before first new test is written)

---

### Pitfall 3: Text-Content Selectors Embedded in Test Infrastructure

**What goes wrong:**
The existing test suite uses `getByRole('link', { name: T.en['candidateApp.questions.title'] })` and similar text-based selectors extensively. When i18n strings change, or when the Svelte 5 migration changes component structure, dozens of selectors break simultaneously. The migration to `data-testid` was identified as needed but is incomplete — only a few elements like `login-submit` use test IDs while most navigation and content assertions use translated text.

**Why it happens:**
Text-based selectors feel "user-centric" and are the Playwright default for codegen. They also work without modifying the production code. Test IDs require component changes, which creates friction.

**How to avoid:**

- Adopt a project-wide `data-testid` convention before writing new tests. Naming pattern: `[component-scope]-[action/element]` (e.g., `voter-app-results-list`, `candidate-question-save`). Document it.
- Use `getByRole()` only for semantic elements where the role is stable (buttons, headings, landmarks). Do NOT use it with `name:` based on translated text.
- The translation-lookup pattern already in `tests/tests/utils/translations.ts` is sound for verifying text _content_ but should not be used as the primary _selector_ mechanism.
- Keep `getByText()` for assertions on rendered content (verifying the right text is shown), not for interaction targets.

**Warning signs:**

- `getByRole('link', { name: T.en['...'] })` used as a click target
- `getByLabel(T.en['...'], { exact: true })` used to find form fields that could have test IDs
- Any selector that imports from the translations utility AND is used for `.click()` or `.fill()`

**Phase to address:** Phase 1 (establish convention) + ongoing enforcement via ESLint `eslint-plugin-playwright`

---

### Pitfall 4: Strapi Admin UI Automation as Primary Data Management

**What goes wrong:**
The existing `candidateApp-advanced.spec.ts` navigates the Strapi admin UI to send registration emails. Commented-out code attempted to use Strapi's import UI. Admin UIs are notoriously brittle targets for automation: they change between versions, they have complex async loading states, they use design system components with unstable selectors, and they are not semantically designed for programmatic access.

**Why it happens:**
The Admin Tools plugin exists precisely because the Strapi API lacks some operations. The natural approach is to automate the admin UI. But the import functionality was already broken and commented out, which is evidence this path is high-maintenance.

**How to avoid:**

- Use direct Strapi REST/GraphQL API calls (via Playwright `request.newContext()`) for data setup and teardown. The existing test already uses this for email checking — extend the pattern to data management.
- Reserve admin UI automation only for features that are genuinely only accessible via UI and have no API equivalent (e.g., testing the Admin Tools plugin UI itself as a user-facing feature).
- When the Supabase migration happens, admin UI automation becomes entirely worthless. API-based data management survives the migration (with endpoint changes, not structural changes).
- Invest in a thin data helper layer (`tests/helpers/data.ts`) that wraps API calls for common operations: create candidate, delete candidate, reset answers. This layer is swappable when backends change.

**Warning signs:**

- Test code navigating to `/admin` and using `getByRole('link', { name: 'Content Manager' })`
- Commented-out import workflows in test files
- Tests that take >30s to set up data (UI automation is slow)
- Any `waitForTimeout` after clicking admin UI buttons

**Phase to address:** Phase 1 (define data management strategy before new tests) + Phase migration when Supabase arrives

---

### Pitfall 5: Global Timeout Too Tight for Docker Environment

**What goes wrong:**
The current `playwright.config.ts` sets `globalTimeout: 100000` (100 seconds) and no explicit `timeout` per test. The Docker stack (frontend + strapi + postgres + localstack) can take 30-60 seconds to become healthy on first start. If the Docker stack is slow on CI, global setup consumes most of the timeout budget before any test runs, causing opaque failures attributed to "timeout exceeded" rather than the real issue.

**Why it happens:**
Timeout values are set locally where Docker starts fast. CI runners have less consistent performance, and Docker layer caches may not always be warm.

**How to avoid:**

- Separate Docker startup from test execution in CI. Use health checks with proper wait loops (`wait-for-it.sh` or `docker compose --wait`) before Playwright begins.
- Set `globalTimeout` to something reasonable for CI (300,000ms = 5 minutes), and set a separate, tighter `timeout` per test (30,000ms default) so slow tests are identified individually.
- Add `expect.timeout` and `navigationTimeout` separately from action timeout — page navigation in Docker is slower than localhost.
- Set `retries: process.env.CI ? 2 : 0` (the existing config uses 3 retries, which masks flakiness rather than fixing it).

**Warning signs:**

- CI failures with "Timeout of 100000ms exceeded" in global setup
- Tests that pass locally but fail on first CI run, then pass on retry
- `waitForTimeout(5000)` as the only mechanism for waiting for email delivery (already present)

**Phase to address:** Phase 1 (CI configuration) — fix before adding more tests that will compound the problem

---

## Moderate Pitfalls

### Pitfall 6: Over-Engineering the Test Abstraction Layer

**What goes wrong:**
A Page Object Model (POM) hierarchy is built with inheritance chains (BasePage → AuthenticatedPage → CandidateAppPage → CandidateQuestionsPage). The abstraction becomes the hardest part of the test codebase to maintain. When the voter app is added, it doesn't fit the existing hierarchy and forces architectural decisions mid-test-writing. New contributors struggle to know where to put interaction logic.

**Why it happens:**
POM is the default recommendation in test automation literature. It feels professional. It also delays writing actual tests while you architect the framework.

**How to avoid:**

- Use Playwright's built-in fixture system for shared setup (authentication, data seeding), not class hierarchies.
- Use functional helpers (plain functions) rather than page object classes. `fillLoginForm(page, email, password)` is more composable than `new LoginPage(page).login(email, password)`.
- If page objects are used, keep them flat (no inheritance) and focused on a single page's stable interactions.
- Start writing actual tests before building the framework. Extract helpers only when duplication appears in 3+ tests.

**Warning signs:**

- A `BasePage` class that tests extend
- More lines in helper/fixture code than in actual test code
- Test setup that requires understanding 4+ files before you can write a new test

**Phase to address:** Phase 1 — establish a "fixture-first, POM-never" convention in the test setup

---

### Pitfall 7: Locale-Switching Tests Depending on Browser Language Detection

**What goes wrong:**
Tests navigate to locale-specific URLs (`/en/candidate/...`, `/fi/candidate/...`) and check that the UI renders in the correct language. However, SvelteKit's i18n routing also reads the `Accept-Language` header. In some environments or test configurations, the browser locale overrides the URL locale, causing test assertions to check for Finnish text on an English URL.

**Why it happens:**
Playwright's default browser context uses the OS locale. On Finnish developer machines, Playwright-launched Chromium sends `fi` as the Accept-Language header. The existing tests handle this by hardcoding `LOCALE_EN = 'en'` and using URL routing, but the browser locale interaction is not explicitly controlled.

**How to avoid:**

- Set `locale: 'en-US'` in the Playwright project config for all test projects to eliminate OS-locale variance:
  ```typescript
  use: { locale: 'en-US', timezoneId: 'Europe/Helsinki' }
  ```
- Test locale switching as a deliberate test scenario (navigate to `/fi/`, assert Finnish content), not as incidental test behavior.
- Avoid using `getByText()` for locale-detection assertions — use URL assertions (`toHaveURL`) as the primary locale check.

**Warning signs:**

- Tests that pass on EN-locale CI but fail on FI-locale developer machines
- Assertions comparing translated strings without fixing the browser locale
- Tests checking both URL locale AND text content without explicit locale fixture

**Phase to address:** Phase 1 (configure baseline `locale` in playwright.config.ts)

---

### Pitfall 8: Tests Coupled to Mock Data File Internals

**What goes wrong:**
Test files directly import from `backend/vaa-strapi/src/functions/mockData/mockUsers.json`, `mockCandidateForTesting.json`, `mockQuestionTypes.json`, etc. (this already happens in `candidateApp-advanced.spec.ts` and `global-setup.ts`). When the mock data structure changes, or when the Supabase migration replaces mock data with seed scripts, 5+ import statements across test files need updating. The tests also construct expected values by looking up deeply into mock data structures (e.g., `mockQuestionTypes.find(({ name }) => name === 'Likert-5')?.settings.choices`).

**Why it happens:**
Mock data already exists in the backend. Importing it avoids duplication — the test uses the same data the backend seeded.

**How to avoid:**

- Create a single test-dedicated constants file (`tests/fixtures/testData.ts`) that re-exports only the values tests actually need (email, password, firstName, likert labels). The source of these values can be the mock JSON files, but the coupling point is centralized.
- Never import mock data structures directly into test files. Tests should work with simple string/number constants, not JSON tree traversal.
- When the backend migrates to Supabase, only `testData.ts` needs updating, not every test file.

**Warning signs:**

- `import mockUsers from '../../backend/vaa-strapi/src/functions/mockData/mockUsers.json'` in test files
- Test files with `mockQuestionTypes.find(...)` logic
- More than 3 mock data imports in a single test file

**Phase to address:** Phase 1 (establish test data abstraction before new tests are written)

---

### Pitfall 9: Missing Test Coverage for Voter App

**What goes wrong:**
The existing test suite covers only the candidate app. The voter app (question answering flow, results/matching, filtering) has zero E2E coverage. When the Svelte 5 migration happens or backend changes occur, regressions in the voter app are invisible until manual testing finds them — too late.

**Why it happens:**
The candidate app was built first and tests followed. The voter app is more complex to test (requires seeded questions, candidates with answers, correct matching weights) and has more configuration variants (single election vs. multiple, different question types). Nobody got around to it.

**How to avoid:**

- Treat voter app coverage as a first-class deliverable of the E2E milestone, not an optional addition.
- The voter app test data requirements are higher — plan and implement the data seeding strategy before attempting voter app tests.
- Start with the happy path: voter answers all questions, sees results, can filter. Add configuration variants later.

**Warning signs:**

- E2E milestone declared "complete" with only `candidateApp-*.spec.ts` files
- Voter app flows mentioned as "future work" at milestone end
- No `voterApp-*.spec.ts` file exists

**Phase to address:** Phase 1 (scope definition must include voter app)

---

### Pitfall 10: `waitForTimeout` as a Timing Mechanism

**What goes wrong:**
The existing tests use `waitForTimeout(500)` multiple times in `candidateApp-advanced.spec.ts` for UI transitions and `waitForTimeout(5000)` for email delivery. Fixed waits make tests slow and still flaky — 500ms is too long on fast machines and too short on slow CI runners. The 5-second email wait is a bet on LocalStack SES latency.

**Why it happens:**
The correct wait condition is not obvious (what exactly signals that the UI has updated after clicking "Save and Continue"?). `waitForTimeout` works locally, so it ships.

**How to avoid:**

- Replace `waitForTimeout(500)` with assertions on the resulting state: `await expect(page.getByText(nextQuestion)).toBeVisible()`.
- For email delivery, poll the LocalStack SES endpoint with `expect.poll()` or a retry loop with proper backoff instead of a fixed wait.
- Enable the ESLint Playwright plugin (`eslint-plugin-playwright`) with the `no-wait-for-timeout` rule to prevent new instances.

**Warning signs:**

- `waitForTimeout` anywhere in test code
- Comments like "Wait so that UI has time to change"
- Tests that are significantly slower on CI than locally

**Phase to address:** Phase 1 (fix existing instances before they multiply)

---

## Technical Debt Patterns

| Shortcut                                             | Immediate Benefit                                | Long-term Cost                                                                           | When Acceptable                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `test.describe.configure({ mode: 'serial' })`        | Tests can share state without fixtures           | Cascading failures, no parallel execution, broken CI signals                             | Never — multi-step flows belong in a single test with `.step()`      |
| Importing mock JSON files directly in tests          | No duplication, always in sync with backend      | Every backend refactor breaks tests, Supabase migration requires touching all test files | Never — centralize in a test data constants file                     |
| `waitForTimeout()` for timing                        | Works locally, easy to write                     | Flaky on CI, masks the real readiness condition                                          | Never in production tests — acceptable as a temporary debug aid only |
| Admin UI automation for data setup                   | Reuses existing UI, no API work needed           | Brittle selectors, slow execution, breaks on Strapi version upgrades                     | Only when the feature being tested IS the admin UI behavior          |
| Global authenticated session shared across all tests | Faster test execution (one login)                | State pollution between tests, password change test breaks subsequent login tests        | Acceptable only if no test mutates auth state — not true today       |
| Text-based selectors with translation lookup         | "User-centric" feel, no component changes needed | Breaks on any copy change, locale-dependent, slow to update across test suite            | Only for content _assertions_, never for interaction _targets_       |

---

## Integration Gotchas

| Integration                    | Common Mistake                                                                                                | Correct Approach                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Docker Compose + Playwright    | Starting Playwright before services are healthy, causing race conditions on first test                        | Use `docker compose up --wait` or health check polling before running `playwright test`                      |
| LocalStack SES (email testing) | Hardcoded `waitForTimeout(5000)` for email delivery                                                           | Poll `/_aws/ses` with `expect.poll()` with 10s timeout and 500ms intervals                                   |
| Strapi REST API (data setup)   | Using the admin JWT token from the test user session for data management                                      | Create a separate Strapi API token with elevated permissions for test data setup/teardown                    |
| Strapi Admin UI (data import)  | Using the Strapi import plugin via Playwright browser automation                                              | Use direct REST API calls via `request.newContext()` — faster, more stable, survives upgrades                |
| SvelteKit SSR + Playwright     | Asserting on content before hydration completes, getting server-rendered vs client-rendered mismatches        | Use `page.waitForLoadState('networkidle')` only if needed, but prefer asserting on specific visible elements |
| Yarn 4 workspaces + Playwright | The `tests/` workspace has its own `node_modules` — Playwright version mismatch if not kept in sync with root | Keep Playwright version in `tests/package.json` matching or pinned to root                                   |

---

## Performance Traps

| Trap                                                       | Symptoms                                                             | Prevention                                                                          | When It Breaks                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| Serial test execution on CI                                | Full suite takes 10+ minutes, parallel tests would take 2            | Remove serial mode, enable `fullyParallel: true`, fix data isolation                | With 20+ tests — already a problem at current scale |
| Admin UI navigation for every data reset                   | Each test takes 30-60 seconds for setup                              | Switch to direct API calls for data setup (< 1 second per call)                     | After 5+ tests that require data setup              |
| Trace recording set to `'on'` always                       | Large trace files accumulate, CI storage fills, slow artifact upload | Set `trace: 'on-first-retry'` on CI, `'on'` only for local debugging                | After 50+ test runs in CI                           |
| Running full Docker stack for unit-level integration tests | 60-second startup overhead for tests that only need the API          | Use a test-specific Docker profile that starts only postgres + strapi for API tests | Immediately — every test run pays this cost         |

---

## Security Mistakes

| Mistake                                                                                   | Risk                                                                                                                         | Prevention                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Hardcoded Strapi admin credentials in test files (currently `admin/admin`)                | If test files are in a public repo, these are exposed — acceptable for dev defaults but must never be production credentials | Keep default dev credentials as-is (they're already in the mock data), but document that production deployments must rotate these |
| Storing Playwright auth state (`playwright/.auth/user.json`) with real credentials in git | Tokens in version control                                                                                                    | The `playwright/` directory should be in `.gitignore` — verify this is the case                                                   |
| Using test API tokens in test code with broad permissions                                 | Test token could be used to access/modify data if leaked                                                                     | Scope test API tokens to minimum required permissions; rotate on each CI run if possible                                          |

---

## "Looks Done But Isn't" Checklist

- [ ] **Test isolation:** Tests appear to pass individually — verify they still pass when run in different order or in parallel (`--workers=4`)
- [ ] **State reset:** Password change test "resets" the password at the end — verify the reset runs even when the test fails midway (it currently does NOT — it relies on test success to reach the reset steps)
- [ ] **Voter app coverage:** "E2E coverage complete" milestone — verify at least one voter app test file exists and covers the happy path
- [ ] **test IDs present:** "Migrated to test IDs" — verify no `getByRole(..., { name: T.en['...'] })` is used as a click/fill target
- [ ] **CI green:** Tests pass locally — verify they pass on CI with `workers: 1` (current CI config) AND with `workers: 4` (future parallel config)
- [ ] **Data independence:** Tests use mock data — verify no test fails when `GENERATE_MOCK_DATA_ON_RESTART=true` is set and data is re-seeded (i.e., tests don't depend on specific database IDs)
- [ ] **Locale control:** i18n tests pass — verify they pass on a Finnish-locale OS, not just English-locale CI

---

## Recovery Strategies

| Pitfall                                            | Recovery Cost | Recovery Steps                                                                                                                     |
| -------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Serial mode chains throughout test suite           | HIGH          | Identify all serial blocks, convert multi-step flows to single tests with `.step()`, add fixtures for state setup, run in parallel |
| Shared database state with no reset mechanism      | HIGH          | Design and implement API-based reset helpers, audit every test for state mutations, add teardown to all mutating tests             |
| Strapi admin UI automation that breaks on upgrade  | MEDIUM        | Rewrite data management as API calls; the logic is the same, only the mechanism changes                                            |
| Text selectors that all broke on i18n update       | MEDIUM        | Add test IDs to components in bulk (can be done in a single PR), update selectors in tests to use `getByTestId()`                  |
| `waitForTimeout` causing flaky CI                  | LOW-MEDIUM    | Identify the intended wait condition for each instance, replace with appropriate assertion                                         |
| Mock data imports breaking after backend migration | MEDIUM        | Centralize all data references in `tests/fixtures/testData.ts`, update only that file                                              |

---

## Pitfall-to-Phase Mapping

| Pitfall                                 | Prevention Phase                                                                              | Verification                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Serial mode dependency chains           | Phase 1 foundation — ban serial mode in ESLint config before first new test                   | Run all tests in random order; no failures                            |
| Shared mutable database state           | Phase 1 foundation — define and implement reset strategy                                      | Each test passes in isolation when run standalone                     |
| Text-content selectors for interaction  | Phase 1 foundation — add test IDs to existing components, enforce with ESLint                 | No `getByRole(..., { name: T.en['...'] })` used as interaction target |
| Admin UI automation for data management | Phase 1 — establish API-based data helpers before writing new tests                           | Data setup completes in under 2 seconds per test                      |
| Docker timeout misconfiguration         | Phase 1 — update CI config and playwright.config.ts timeouts                                  | CI passes consistently on first run without retries                   |
| Over-engineered abstraction layer       | Phase 1 — write 3 tests before creating any helper; extract only when duplication is observed | No class inheritance in test code                                     |
| Locale-switching locale control         | Phase 1 — add `locale: 'en-US'` to playwright.config.ts                                       | Tests pass on Finnish-locale developer machines                       |
| Mock data coupling to backend files     | Phase 1 — create `tests/fixtures/testData.ts` before importing from backend                   | Zero direct imports from `backend/**` in test files                   |
| Missing voter app coverage              | Phase 1 — voter app tests are in milestone scope definition                                   | `voterApp-*.spec.ts` exists and covers happy path                     |
| `waitForTimeout` timing                 | Phase 1 — ESLint no-wait-for-timeout rule; fix existing instances                             | No `waitForTimeout` in any test file                                  |

---

## Sources

- Playwright official best practices: https://playwright.dev/docs/best-practices
- Playwright test parallelism: https://playwright.dev/docs/test-parallel
- "17 Playwright Testing Mistakes": https://elaichenkov.github.io/posts/17-playwright-testing-mistakes-you-should-avoid/
- "How to Avoid Flaky Tests in Playwright" (Semaphore CI): https://semaphore.io/blog/flaky-tests-playwright
- Mock database in Svelte E2E tests (Mainmatter, 2025): https://mainmatter.com/blog/2025/08/21/mock-database-in-svelte-tests/
- BrowserStack Playwright best practices: https://www.browserstack.com/guide/playwright-best-practices
- Test Data Strategies for E2E Tests: https://www.playwright-user-event.org/playwright-tips/test-data-strategies-for-e2e-tests
- Using translations with Playwright and i18n: https://medium.com/@jeremie.fleurant/using-translations-with-playwright-and-i18n-for-e2e-tests-ba90a667f309
- Playwright global setup and teardown: https://playwright.dev/docs/test-global-setup-teardown
- Existing test suite analysis: `tests/tests/candidateApp-basics.spec.ts`, `tests/tests/candidateApp-advanced.spec.ts`, `tests/tests/global-setup.ts`

---

_Pitfalls research for: E2E testing framework — SvelteKit 2 + Strapi v5 monorepo (OpenVAA)_
_Researched: 2026-03-03_
