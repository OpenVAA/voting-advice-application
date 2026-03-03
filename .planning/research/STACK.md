# Stack Research

**Domain:** E2E testing framework for SvelteKit 2 + Strapi v5 monorepo
**Researched:** 2026-03-03
**Confidence:** HIGH (Playwright docs verified, existing codebase audited)

## Context

OpenVAA already uses Playwright (`@playwright/test ^1.49.1`). This research determines the
complete stack for a modular, extensible E2E testing framework — not "what tool to use" but
"how to use the tool well." The current test suite (3 spec files, candidate app only) has four
structural problems this stack must solve:

1. Text-based selectors break on i18n/content changes
2. No state reset — tests depend on accumulated database state
3. No voter app coverage
4. No modular fixture system — copy-paste setup/teardown in each file

---

## Recommended Stack

### Core Technologies

| Technology         | Version                    | Purpose                                              | Why Recommended                                                                                                                                                                                            |
| ------------------ | -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@playwright/test` | `^1.58.2`                  | E2E test runner, fixture engine, API request context | Already in use; industry standard for SvelteKit. v1.58 is latest stable (Jan 2026). Includes `mergeTests()`, project dependencies, API testing, storageState — everything needed without additional tools. |
| TypeScript         | `^5.x` (inherits monorepo) | Type-safe test code                                  | Already the monorepo language. Fixtures are type-inferred; POM classes get IntelliSense. No overhead.                                                                                                      |
| `@faker-js/faker`  | `^8.4.1`                   | Generating unique test data per run                  | Already a root devDependency. Used in `candidateApp-advanced.spec.ts` via import. Prevents test data collisions in parallel runs. Seeded mode for reproducibility in CI.                                   |

### Supporting Libraries

| Library      | Version             | Purpose                                                     | When to Use                                                                                  |
| ------------ | ------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `dotenv`     | `^16.x` (inherits)  | Load `.env` for test environment config (Strapi URL, ports) | Already in use in `playwright.config.ts`. Required for Docker-based multi-service targeting. |
| `mailparser` | `^3.7.2` (inherits) | Parse emails from LocalStack SES in registration flow tests | Already used in `candidateApp-advanced.spec.ts`. Keep for email-based registration tests.    |
| `cheerio`    | `^1.0.0` (inherits) | Extract links from HTML email content                       | Already used alongside mailparser. Keep for link extraction from registration emails.        |

### Development Tools

| Tool                         | Purpose                                                | Notes                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Playwright HTML Reporter     | Visual test results with traces, screenshots, video    | Built-in. Already configured with `outputDir` and `reporter: [['html', ...]]`. Set `trace: 'on'` (already done) for failure debugging. |
| Playwright VS Code Extension | Test runner UI, step-through debugging, locator picker | Install separately (`ms-playwright.playwright`). Lets developers run individual tests and inspect elements interactively.              |
| Playwright `--ui` mode       | Interactive test runner with timeline, live browser    | `yarn test:e2e --ui`. Useful for authoring new tests against the live Docker stack.                                                    |
| `tsx`                        | `^4.x` (inherits)                                      | Run TypeScript test utilities directly                                                                                                 | Already a devDependency. Used for running setup scripts outside Playwright's runner. |

---

## Installation

No new packages required. The root `package.json` already has everything needed. The milestone
work is purely structural — reorganizing existing tests and adding new spec files, fixtures,
and page objects within the existing `tests/` workspace.

```bash
# Upgrade Playwright to latest stable (currently pinned to ^1.49.1)
yarn workspace root add -D @playwright/test@^1.58.2

# Install browser binaries after version bump
yarn playwright install chromium
```

---

## Key Patterns (The "How")

### Pattern 1: Project Dependencies Replace globalSetup

**Current approach (bad):** `globalSetup` in `playwright.config.ts` that manually launches
Chromium, logs in, saves `storageState`. This runs outside the reporter — no traces,
no HTML report visibility, errors are opaque.

**Recommended approach:** Replace with a `setup` project that has `testMatch: '**/*.setup.ts'`.
All test projects declare `dependencies: ['setup']`. Setup tests appear in the HTML report,
support fixtures, and produce traces.

```typescript
// playwright.config.ts
projects: [
  {
    name: 'setup',
    testMatch: '**/*.setup.ts',
    teardown: 'teardown',
  },
  {
    name: 'teardown',
    testMatch: '**/*.teardown.ts',
  },
  {
    name: 'voter-app',
    testDir: 'tests/voter',
    dependencies: ['setup'],
    use: {
      storageState: 'playwright/.auth/unauthenticated.json',
    },
  },
  {
    name: 'candidate-app',
    testDir: 'tests/candidate',
    dependencies: ['setup'],
    use: {
      storageState: 'playwright/.auth/candidate.json',
    },
  },
],
```

### Pattern 2: Strapi Admin API for Test Data (Not UI Automation)

**Current approach (bad):** Tests depend on mock data that is assumed to exist in the DB.
State is never reset. Candidate import is commented out because it's broken.

**Recommended approach:** Use Playwright's `request` API context to call Strapi's admin
REST endpoints directly. The admin-tools plugin already exposes `/api/openvaa-admin-tools/import-data`
and `/api/openvaa-admin-tools/delete-data`. Authentication uses Strapi admin JWT (obtained
via `POST /admin/login`).

```typescript
// fixtures/strapiApi.ts
import { request as playwrightRequest } from '@playwright/test';

export async function getStrapiAdminToken(strapiUrl: string): Promise<string> {
  const ctx = await playwrightRequest.newContext();
  const res = await ctx.post(`${strapiUrl}/admin/login`, {
    data: { email: 'mock.admin@openvaa.org', password: 'admin' }
  });
  const {
    data: { token }
  } = await res.json();
  await ctx.dispose();
  return token;
}

export async function importTestData(strapiUrl: string, token: string, data: object) {
  const ctx = await playwrightRequest.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` }
  });
  await ctx.post(`${strapiUrl}/api/openvaa-admin-tools/import-data`, { data: { data } });
  await ctx.dispose();
}

export async function deleteTestData(strapiUrl: string, token: string, spec: object) {
  const ctx = await playwrightRequest.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` }
  });
  await ctx.post(`${strapiUrl}/api/openvaa-admin-tools/delete-data`, { data: { data: spec } });
  await ctx.dispose();
}
```

This is faster than UI-driven import (no Strapi admin UI navigation), more reliable than
parsing Strapi's content manager HTML, and decoupled from Strapi UI changes.

**Fallback:** If the admin-tools API proves insufficient for certain data types, use
Playwright-driven Strapi admin UI as a secondary mechanism (same pattern as the current
commented-out CSV import code).

### Pattern 3: Page Object Model for Multi-App Coverage

Each distinct UI section gets a POM class. Locators are centralized; tests call methods.

```typescript
// tests/pages/CandidateLoginPage.ts
import type { Page, Locator } from '@playwright/test';

export class CandidateLoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByTestId('login-email');
    this.passwordInput = page.getByTestId('password-field');
    this.submitButton = page.getByTestId('login-submit');
    this.errorMessage = page.getByTestId('login-errorMessage');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Planned POM classes:

- `CandidateLoginPage` — login, logout actions
- `CandidateHomePage` — readiness status, navigation buttons
- `CandidateQuestionsPage` — answer flow, category expand/collapse
- `CandidateProfilePage` — basic info form, photo upload
- `VoterHomePage` — election selection, start button
- `VoterQuestionsPage` — question answering, skip
- `VoterResultsPage` — match display, candidate cards

### Pattern 4: Fixture-Based Test Setup

Replace `beforeEach`/`afterAll` hooks with Playwright fixtures. Fixtures compose cleanly,
are type-safe, and run teardown automatically.

```typescript
// tests/fixtures/index.ts
import { test as base, mergeTests } from '@playwright/test';
import { CandidateLoginPage } from '../pages/CandidateLoginPage';

type Fixtures = {
  loginPage: CandidateLoginPage;
  authenticatedCandidate: { email: string; password: string };
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new CandidateLoginPage(page));
  },
  authenticatedCandidate: async ({ page }, use) => {
    // Setup: login
    const loginPage = new CandidateLoginPage(page);
    await loginPage.login('test@example.com', 'Password1!');
    // Hand control to test
    await use({ email: 'test@example.com', password: 'Password1!' });
    // Teardown: nothing needed (storageState handles session isolation)
  }
});

export { expect } from '@playwright/test';
```

Use `mergeTests()` to combine voter and candidate fixture sets without coupling the two
test suites.

### Pattern 5: test-id Selector Convention

Use `data-testid` attributes (Playwright default, no config change needed) for all
interactive elements that don't have stable ARIA roles. The project already uses this
partially (`login-email`, `password-field`, `login-submit`, `login-errorMessage`,
`submitButton`). Extend this consistently to voter app elements.

Naming convention: `kebab-case`, `{component}-{element}` or `{action}-{noun}`.

```svelte
<!-- Good -->
<button data-testid="voter-start-quiz">Start</button>
<div data-testid="results-match-score">85%</div>

<!-- Use getByRole for semantic elements -->
<button aria-label="Open navigation menu">Menu</button>
<!-- Test: page.getByRole('button', { name: 'Open navigation menu' }) -->
```

Priority order for selectors:

1. `getByRole()` — for semantic elements (buttons, links, headings, inputs with labels)
2. `getByTestId()` — for elements without stable roles
3. `getByLabel()` — for form inputs associated with visible labels
4. Avoid: CSS selectors, text content, nth() — brittle and i18n-sensitive

### Pattern 6: Test Dataset Strategy

Multiple named datasets for different app configurations. Datasets are JSON files committed
to the repo, imported via the admin-tools API in setup projects.

```
tests/
  data/
    datasets/
      default/        # Standard mock data (single election, multi-party)
        election.json
        candidates.json
        questions.json
      multi-election/ # Multiple elections scenario
        ...
      single-candidate/ # Edge case: one candidate
        ...
  fixtures/
    datasets.ts       # Fixture that loads named dataset, tears down after test
```

The `teardown` project (registered in `playwright.config.ts`) calls delete-data to reset
the DB after the full test run. Individual tests that create ephemeral data (e.g.,
registration flow) delete their own data via fixture teardown.

---

## Directory Structure

```
tests/
  playwright.config.ts          # Updated: project dependencies, no globalSetup
  tests/                        # Renamed to tests/specs/ or restructured
    candidate/
      auth.setup.ts             # Login, save storageState
      basics.spec.ts            # Navigation, language, password
      registration.spec.ts      # Email registration flow (advanced)
      questions.spec.ts         # Answer opinion questions
      profile.spec.ts           # Basic info, photo upload
    voter/
      quiz.spec.ts              # Full voter flow: questions → results
      filters.spec.ts           # Candidate filtering
      results.spec.ts           # Match display
    data.teardown.ts            # Delete all imported test data
    data.setup.ts               # Import default dataset
  pages/                        # Page Object Models
    candidate/
      CandidateLoginPage.ts
      CandidateHomePage.ts
      CandidateQuestionsPage.ts
      CandidateProfilePage.ts
    voter/
      VoterHomePage.ts
      VoterQuestionsPage.ts
      VoterResultsPage.ts
  fixtures/
    index.ts                    # mergeTests() export
    candidate.fixtures.ts       # Candidate-specific fixtures
    voter.fixtures.ts           # Voter-specific fixtures
    strapi.fixtures.ts          # Strapi API helpers
  data/
    datasets/
      default/                  # JSON test datasets
  utils/
    buildRoute.ts               # Existing (keep)
    translations.ts             # Existing (keep)
    testsDir.ts                 # Existing (keep)
    strapiApi.ts                # New: admin API client
```

---

## Alternatives Considered

| Recommended                                       | Alternative                          | When to Use Alternative                                                                                                                 |
| ------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@playwright/test` project dependencies for setup | `globalSetup` file                   | Never for new work — project dependencies have HTML report integration, trace support, and fixture access that globalSetup lacks        |
| Direct Strapi admin API calls for test data       | Playwright-driven Strapi admin UI    | When the admin-tools API lacks a needed endpoint (e.g., complex relational data that the service doesn't support yet)                   |
| Page Object Model (POM)                           | Inline locators in spec files        | Only for one-off tests in small projects; POM is essential once you have 2+ spec files for the same page                                |
| `data-testid` + `getByRole`                       | CSS selectors, text content, `nth()` | Never — text selectors break on i18n, CSS classes break on refactoring                                                                  |
| Fixtures for setup/teardown                       | `beforeEach`/`afterEach` hooks       | Hooks are acceptable for local state (navigating to a page); fixtures are required for cross-cutting concerns (auth, test data)         |
| `@faker-js/faker` for generated data              | Static JSON test data files          | Static files for baseline state (DB seed); Faker for per-test unique records (users, emails) that must not collide across parallel runs |
| Playwright setup project + teardown project       | `afterAll` calling delete API        | The project teardown pattern ensures cleanup runs even if tests fail mid-suite                                                          |

---

## What NOT to Use

| Avoid                                                               | Why                                                                                                                           | Use Instead                                                                                                                                             |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `globalSetup` function (current pattern)                            | Runs outside reporter — no traces, no fixtures, opaque errors. Playwright docs explicitly say to prefer project dependencies. | Project `setup` with `testMatch: '**/*.setup.ts'`                                                                                                       |
| Text-based selectors (`getByText`) for navigation                   | Breaks when translations change (English text hardcoded in tests). Already causes maintenance burden in existing tests.       | `getByRole` for semantic elements, `getByTestId` for others                                                                                             |
| Shared mutable database state across tests                          | Makes tests order-dependent and breaks parallel execution. Current tests fail if run out of order.                            | Setup/teardown fixtures that create and delete their own data; `fullyParallel: false` only within a describe block where serial ordering is unavoidable |
| Playwright component testing (`@playwright/experimental-ct-svelte`) | Experimental, not stable, Svelte 5 compat unknown, adds build complexity for marginal gain over unit tests.                   | Vitest for component logic, Playwright E2E for integration flows                                                                                        |
| Cypress                                                             | Different ecosystem; team already has Playwright investment. No benefit to switching.                                         | `@playwright/test`                                                                                                                                      |
| Puppeteer                                                           | Lower-level, no built-in test runner or fixtures. Playwright is a strict superset.                                            | `@playwright/test`                                                                                                                                      |
| `page.waitForTimeout()` (current pattern)                           | Arbitrary timeouts cause flaky tests (too short) or slow tests (too long). Used 4+ times in existing specs.                   | Playwright's built-in auto-waiting; explicit `page.waitForResponse()`, `expect(locator).toBeVisible()`                                                  |

---

## Stack Patterns by Variant

**If testing voter app flows that require completed candidate data:**

- Use a dedicated setup spec (`voter-with-data.setup.ts`) that imports a candidate dataset
  via Strapi API, then runs voter tests against it
- Teardown deletes the imported candidates after voter tests complete

**If a test must run serially (e.g., registration flow changes user state):**

- Use `test.describe.configure({ mode: 'serial' })` within that describe block only
- Do not set serial mode globally — it defeats parallelism benefits

**If the Strapi admin-tools API doesn't support a data type needed for testing:**

- Write a Playwright-driven admin UI helper function in `utils/strapiApi.ts`
- Log the gap as a future admin-tools API enhancement

**For CI (GitHub Actions / any Docker-based CI):**

- Use `workers: 1` (already set for CI in existing config) — Docker stack is single-instance
- Use `retries: 3` (already set) — network-dependent tests occasionally flake in Docker
- Pass `STRAPI_PORT`, `FRONTEND_PORT`, `LOCALSTACK_ENDPOINT` as env vars (already wired)
- Use `mcr.microsoft.com/playwright:v1.58.2-noble` Docker image to avoid browser download on each run

---

## Version Compatibility

| Package                    | Compatible With                   | Notes                                                                                                                                                        |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@playwright/test@^1.58.2` | Node.js 20.18.1 (monorepo engine) | Playwright 1.57+ uses Chrome for Testing instead of Chromium. Tests should pass unchanged but update browser binary with `yarn playwright install chromium`. |
| `@playwright/test@^1.58.2` | SvelteKit 2 / Svelte 4            | Full compatibility — Playwright tests against the running app, not Svelte components directly                                                                |
| `@playwright/test@^1.58.2` | Strapi v5 admin API               | Compatible — uses Playwright's `request` API context (plain HTTP), no Strapi-specific integration                                                            |
| `@faker-js/faker@^8.x`     | `@playwright/test@^1.58.2`        | No direct coupling — Faker generates data, Playwright uses it. Both stable.                                                                                  |

---

## Sources

- Playwright official docs, fixtures: https://playwright.dev/docs/test-fixtures — HIGH confidence
- Playwright official docs, project dependencies: https://playwright.dev/docs/test-projects — HIGH confidence
- Playwright official docs, authentication / storageState: https://playwright.dev/docs/auth — HIGH confidence
- Playwright official docs, API testing: https://playwright.dev/docs/api-testing — HIGH confidence
- Playwright official docs, global setup: https://playwright.dev/docs/test-global-setup-teardown — HIGH confidence (explicit recommendation against globalSetup in favor of project dependencies)
- Playwright release notes (v1.49–v1.58): https://playwright.dev/docs/release-notes — HIGH confidence
- FakerJS framework guide: https://fakerjs.dev/guide/frameworks — HIGH confidence
- Playwright POM docs: https://playwright.dev/docs/pom — HIGH confidence
- DataFactory pattern article (playwrightsolutions.com): https://playwrightsolutions.com/the-definitive-guide-to-api-testcreating-a-datafactory-to-manage-test-data/ — MEDIUM confidence (community source, pattern verified against official API docs)
- Strapi auth blog (official): https://strapi.io/blog/guide-on-authenticating-requests-with-the-rest-api — MEDIUM confidence (Strapi blog, July 2025)
- Existing codebase audit: `/tests/` directory and admin-tools plugin source — HIGH confidence (primary source)

---

_Stack research for: E2E testing framework, SvelteKit 2 + Strapi v5 monorepo_
_Researched: 2026-03-03_
