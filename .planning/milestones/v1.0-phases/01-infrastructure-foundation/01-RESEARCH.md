# Phase 1: Infrastructure Foundation - Research

**Researched:** 2026-03-03
**Domain:** Playwright E2E test infrastructure, SvelteKit component testId instrumentation, Strapi Admin Tools API integration
**Confidence:** HIGH

## Summary

This phase establishes the foundational E2E testing infrastructure that all subsequent phases depend on. The core technical domains are: (1) upgrading Playwright from 1.49.1 to 1.58.x and replacing `globalSetup` with the project dependencies pattern, (2) building an API client for the existing Admin Tools plugin endpoints (`/import-data`, `/delete-data`), (3) adding `data-testid` attributes to ~167 Svelte component/route files across both voter and candidate apps, (4) creating a fixture-extended page object model, and (5) configuring `eslint-plugin-playwright` for test quality enforcement.

The existing codebase already has strong foundations to build on: the Admin Tools plugin is fully functional with transactional import/delete operations supporting 12 collection types via `externalId`-based referencing, 6 `data-testid` attributes already exist in kebab-case convention, and the Playwright config is cleanly structured. The main migration effort is replacing the browser-based `globalSetup` (which logs in via the UI and saves `storageState`) with a dedicated setup project that uses the Admin Tools API for data management and a fixture for auth state.

**Primary recommendation:** Upgrade to Playwright 1.58.2, use project dependencies with a `data-setup` project for database management and a separate `auth-setup` project for candidate login state, and install `eslint-plugin-playwright@2.9.0` with the `flat/recommended` preset plus custom `no-raw-locators` and `no-wait-for-timeout` error rules.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**TestId naming convention:**

- kebab-case naming (matches existing 6 attributes: `login-email`, `password-field`, `login-submit`)
- Page-scoped prefix: IDs include the page/route context (e.g., `login-email`, `profile-submit`, `questions-card`)
- Central constants file (`testIds.ts`) exports all IDs -- tests import from it, no inline strings. Enables autocomplete, prevents typos, single place to refactor

**Test dataset design:**

- Realistic but compact: 1 election, 2-3 constituencies, ~10 questions across 2-3 categories, 5-8 candidates with answers, 2-3 parties
- All question types included (Likert, date, number, text, boolean, image) -- one of each minimum
- Obvious test markers for content: 'Test Candidate Alpha', 'Test Opinion Question 1', 'Test Party A'
- English only for default dataset (locale-specific testing deferred to v2 ADV-02)

**Data isolation strategy:**

- Database reset per spec file via Playwright project dependencies pattern
- Dedicated setup project with trace recording -- failures show as 'data-setup FAILED' in HTML report, dependent test projects are skipped (not cascading)
- Auth handled via Playwright fixture per app: candidate tests get logged-in session, voter tests unauthenticated by default. Auth state per-worker (parallel safe)
- Standalone API client utility (`strapiAdminClient.ts`) wrapping Admin Tools `/import-data`, `/delete-data` endpoints -- usable in setup projects, fixtures, or external scripts

**Page object model:**

- Page-level objects: one class per page/route (LoginPage, QuestionsPage, ResultsPage)
- Provided via Playwright fixtures (`test.extend<Fixtures>()`) -- tests receive as parameters: `test('login', async ({ loginPage }) => ...)`
- Phase 1 creates stubs only: fixture infrastructure + 2-3 example page objects as templates. Phase 2+ fills in the rest as tests are written
- Page objects expose both high-level methods (`loginPage.login()`) and raw Locators (`loginPage.emailInput`) for flexible assertions

### Claude's Discretion

- Shared component testId handling (whether to prefix or use component-only names)
- Exact testId constants file structure and organization
- Playwright config structure for project dependencies
- ESLint Playwright plugin rule selection and severity levels
- API client error handling and retry logic
- Specific page objects chosen as Phase 1 stubs

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                             | Research Support                                                                                                   |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| INFRA-01 | All interactive elements in both voter and candidate apps have `data-testid` attributes | TestId naming convention, component inventory (167 Svelte files, 38 page routes), existing 6 attributes as pattern |
| INFRA-02 | Playwright upgraded from 1.49.1 to latest stable (1.58+)                                | Playwright 1.58.2 verified as latest stable; breaking changes documented (selector removals, Chrome for Testing)   |
| INFRA-03 | Global setup replaced with Playwright project dependencies pattern                      | Project dependencies pattern fully documented with config examples, trace/reporting advantages over globalSetup    |
| INFRA-04 | Fixture-extended page object model established for all apps                             | Playwright `test.extend()` pattern, worker-scoped fixtures for auth, page object class pattern documented          |
| INFRA-05 | API-based data management using Admin Tools endpoints (`/import-data`, `/delete-data`)  | Full Admin Tools API analyzed: routes, auth, data types, importable collections, externalId-based relations        |
| INFRA-06 | Database state resets reliably between test runs via API                                | Delete-by-externalId-prefix pattern, transactional operations, setup project triggers before each test project     |
| INFRA-07 | Pre-defined JSON test datasets for default configuration                                | ImportData type format documented, 12 importable collections mapped, externalRelation linking pattern understood   |
| INFRA-08 | Test helper utilities for common tasks (navigation, authentication, data setup)         | Existing utils (buildRoute, translations), new strapiAdminClient.ts, fixture utilities pattern                     |
| INFRA-09 | ESLint Playwright plugin configured for test quality enforcement                        | eslint-plugin-playwright@2.9.0, flat/recommended preset, rule selection for waitForTimeout and raw locators        |

</phase_requirements>

## Standard Stack

### Core

| Library                    | Version | Purpose                         | Why Standard                                                                   |
| -------------------------- | ------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `@playwright/test`         | 1.58.2  | E2E test framework              | Latest stable; project dependencies, improved trace viewer, Chrome for Testing |
| `eslint-plugin-playwright` | 2.9.0   | Lint rules for Playwright tests | Official community plugin, 60+ rules, flat config support, recommended preset  |

### Supporting

| Library           | Version | Purpose                      | When to Use                                               |
| ----------------- | ------- | ---------------------------- | --------------------------------------------------------- |
| `dotenv`          | ^16.4.7 | Environment variable loading | Already installed; used in test config for ports/URLs     |
| `@faker-js/faker` | ^8.4.1  | Test data generation         | Already installed; available for future dataset expansion |

### Alternatives Considered

| Instead of               | Could Use             | Tradeoff                                                                 |
| ------------------------ | --------------------- | ------------------------------------------------------------------------ |
| eslint-plugin-playwright | Custom ESLint rules   | Plugin has 60+ battle-tested rules; custom rules would miss edge cases   |
| Project dependencies     | globalSetup (current) | globalSetup lacks trace viewer, HTML report integration, fixture support |
| API-based data setup     | UI-based data setup   | API is 10-100x faster, deterministic, no flaky UI interactions           |

**Installation:**

```bash
yarn add -D @playwright/test@^1.58.2 eslint-plugin-playwright@^2.9.0
npx playwright install
```

**Note:** The `@playwright/test` version in root `package.json` is currently `^1.49.1`. Update to `^1.58.2`. After upgrading, run `npx playwright install` to get matching browser binaries.

## Architecture Patterns

### Recommended Project Structure

```
tests/
  playwright.config.ts          # Main config with project dependencies
  tests/
    setup/
      data.setup.ts             # Data import/delete via Admin Tools API
      auth.setup.ts             # Candidate app login, saves storageState
    specs/
      candidate/                # Candidate app spec files (Phase 2+)
      voter/                    # Voter app spec files (Phase 3+)
    fixtures/
      index.ts                  # Re-exports extended test with all fixtures
      auth.fixture.ts           # Worker-scoped auth fixture
    pages/
      candidate/
        LoginPage.ts            # Page object for candidate login
        HomePage.ts             # Page object for candidate home
      voter/
        QuestionsPage.ts        # Page object for voter questions
    utils/
      strapiAdminClient.ts      # Admin Tools API client
      testIds.ts                # Central testId constants
      buildRoute.ts             # Existing route builder (moved)
      translations.ts           # Existing translation loader (moved)
      testsDir.ts               # Existing path helper (moved)
    data/
      default-dataset.json      # Default test dataset (or split into multiple files)
```

### Pattern 1: Project Dependencies Config

**What:** Replace `globalSetup` with a `data-setup` project that runs as a regular test, gaining trace viewer, HTML report integration, and fixture support.

**When to use:** Always for test setup that involves browser or API interactions.

**Example:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: './playwright-report' }]],

  use: {
    baseURL: process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173',
    trace: 'on'
  },

  projects: [
    // 1. Data setup - imports test dataset via Admin Tools API
    {
      name: 'data-setup',
      testMatch: /data\.setup\.ts/,
      teardown: 'data-teardown'
    },

    // 2. Data teardown - cleans up after all tests
    {
      name: 'data-teardown',
      testMatch: /data\.teardown\.ts/
    },

    // 3. Auth setup - logs in as candidate, saves storageState
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      dependencies: ['data-setup']
    },

    // 4. Candidate app tests - depend on auth-setup (logged in)
    {
      name: 'candidate-app',
      testDir: './tests/specs/candidate',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['auth-setup']
    },

    // 5. Voter app tests - depend on data-setup only (no auth needed)
    {
      name: 'voter-app',
      testDir: './tests/specs/voter',
      use: {
        ...devices['Desktop Chrome']
      },
      dependencies: ['data-setup']
    }
  ]
});
```

Source: [Playwright Project Dependencies Docs](https://playwright.dev/docs/test-global-setup-teardown)

### Pattern 2: Strapi Admin API Client

**What:** A standalone utility class that authenticates with the Strapi admin API and calls Admin Tools plugin endpoints for data import/delete.

**When to use:** In setup/teardown projects and potentially in test fixtures for mid-test data manipulation.

**Example:**

```typescript
// tests/tests/utils/strapiAdminClient.ts
import type { APIRequestContext } from '@playwright/test';
import { request } from '@playwright/test';

interface ImportDataResult {
  type: 'success' | 'failure';
  created?: Record<string, number>;
  updated?: Record<string, number>;
  cause?: string;
}

interface DeleteDataResult {
  type: 'success' | 'failure';
  deleted?: Record<string, number>;
  cause?: string;
}

export class StrapiAdminClient {
  private baseUrl: string;
  private token: string | null = null;
  private requestContext: APIRequestContext | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? `http://localhost:${process.env.STRAPI_PORT ?? '1337'}`;
  }

  async login(email = 'mock.admin@openvaa.org', password = 'admin'): Promise<void> {
    this.requestContext = await request.newContext({
      baseURL: this.baseUrl
    });
    const response = await this.requestContext.post('/admin/login', {
      data: { email, password }
    });
    if (!response.ok()) {
      throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
    }
    const body = await response.json();
    this.token = body.data?.token;
    if (!this.token) {
      throw new Error('No token in admin login response');
    }
  }

  private get headers(): Record<string, string> {
    if (!this.token) throw new Error('Not authenticated. Call login() first.');
    return { Authorization: `Bearer ${this.token}` };
  }

  async importData(data: Record<string, unknown[]>): Promise<ImportDataResult> {
    const response = await this.requestContext!.post('/openvaa-admin-tools/import-data', {
      headers: this.headers,
      data: JSON.stringify({ data })
    });
    return response.json();
  }

  async deleteData(data: Record<string, string>): Promise<DeleteDataResult> {
    const response = await this.requestContext!.post('/openvaa-admin-tools/delete-data', {
      headers: this.headers,
      data: JSON.stringify({ data })
    });
    return response.json();
  }

  async dispose(): Promise<void> {
    await this.requestContext?.dispose();
  }
}
```

**Critical detail about the Admin Tools API:** The data controller reads `ctx.request.body` and then `JSON.parse()`s it (line 9 of `data.ts` controller). This means the body must be sent as a JSON string, NOT as a pre-parsed object. Use `data: JSON.stringify({ data })` or ensure the request sends raw JSON. Verify this during implementation.

### Pattern 3: Fixture-Extended Test with Page Objects

**What:** Custom test fixture that provides page objects as test parameters.

**When to use:** All test files should import from the custom fixture instead of `@playwright/test`.

**Example:**

```typescript
// tests/tests/fixtures/index.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/candidate/LoginPage';
import { HomePage } from '../pages/candidate/HomePage';

type Fixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  }
});

export { expect } from '@playwright/test';
```

```typescript
// tests/tests/pages/candidate/LoginPage.ts
import type { Locator, Page } from '@playwright/test';
import { testIds } from '../../utils/testIds';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId(testIds.candidate.login.email);
    this.passwordInput = page.getByTestId(testIds.candidate.login.password);
    this.submitButton = page.getByTestId(testIds.candidate.login.submit);
    this.errorMessage = page.getByTestId(testIds.candidate.login.errorMessage);
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Source: [Playwright Page Object Model](https://playwright.dev/docs/pom), [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)

### Pattern 4: TestId Constants Organization

**What:** Central constants file organizing all testIds by app and page.

**When to use:** Every `data-testid` attribute in the codebase and every test locator.

**Recommendation for Claude's Discretion:** Use a nested object structure organized by app > page > element. Shared components that appear in multiple pages should use a `shared` namespace (e.g., `testIds.shared.errorMessage`, `testIds.shared.navigation.menu`). This avoids duplication while keeping the page-scoped prefix in the final testId string.

**Example:**

```typescript
// tests/tests/utils/testIds.ts
export const testIds = {
  candidate: {
    login: {
      email: 'login-email', // existing
      password: 'password-field', // existing
      submit: 'login-submit', // existing
      errorMessage: 'login-errorMessage' // existing
    },
    profile: {
      submit: 'profile-submit' // existing (currently 'submitButton')
    },
    home: {
      readyMessage: 'candidate-home-ready'
    },
    questions: {
      card: 'candidate-questions-card',
      answerInput: 'candidate-questions-answer',
      commentInput: 'candidate-questions-comment'
    },
    settings: {
      currentPassword: 'settings-current-password',
      newPassword: 'settings-new-password',
      confirmPassword: 'settings-confirm-password',
      updateButton: 'settings-update-password'
    },
    nav: {
      menu: 'candidate-nav-menu',
      logout: 'candidate-nav-logout'
    }
  },
  voter: {
    home: {
      startButton: 'voter-home-start'
    },
    elections: {
      list: 'voter-elections-list',
      card: 'voter-elections-card'
    },
    questions: {
      card: 'voter-questions-card',
      answerOption: 'voter-questions-option',
      skipButton: 'voter-questions-skip',
      nextButton: 'voter-questions-next'
    },
    results: {
      list: 'voter-results-list',
      card: 'voter-results-card',
      score: 'voter-results-score'
    }
  },
  shared: {
    errorMessage: 'error-message',
    loading: 'loading-indicator',
    navigation: {
      menu: 'nav-menu',
      menuItem: 'nav-menu-item'
    }
  }
} as const;
```

### Anti-Patterns to Avoid

- **Text-based selectors in tests:** Never use `page.getByText('Login')` or `page.getByRole('button', { name: 'Login' })` for primary element selection. These break on translation changes. Use `page.getByTestId()` as the primary strategy. Role-based selectors (`getByRole`) are acceptable for accessibility testing, not for flow navigation.
- **Inline testId strings:** Never write `page.getByTestId('login-email')` directly. Always import from `testIds.ts`. This ensures the string used in the Svelte component matches the string in the test.
- **Shared storageState across workers:** Each worker must have its own auth state. Use Playwright's per-worker storage state pattern, not a single global file when running in parallel.
- **Using `globalSetup` for anything that needs traces or fixtures:** The whole point of the migration is to get these capabilities. Don't fall back to `globalSetup` for convenience.

## Don't Hand-Roll

| Problem                | Don't Build                                      | Use Instead                                          | Why                                                                      |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Test data management   | Custom Strapi REST API calls for each collection | Admin Tools `/import-data` with externalId relations | Already handles 12 collections, transactional, resolves cross-references |
| Test data cleanup      | Manual DELETE queries per table                  | Admin Tools `/delete-data` with externalId prefix    | Handles cascading deletes, transactional, prefix-based matching          |
| ESLint test rules      | Custom no-waitForTimeout rule                    | `eslint-plugin-playwright` recommended preset        | 60+ rules maintained by community, auto-fixable, covers edge cases       |
| Auth state persistence | Custom cookie management                         | Playwright `storageState`                            | Built-in, handles cookies + localStorage + IndexedDB                     |
| Test isolation         | Custom beforeEach/afterEach hooks                | Playwright project dependencies                      | Framework-level, appears in reports, supports teardown                   |

**Key insight:** The Admin Tools plugin is the single most valuable existing asset for this phase. It already supports all 12 collection types needed for test datasets (elections, constituencies, candidates, parties, questions, questionTypes, questionCategories, nominations, alliances, constituencyGroups, feedbacks, appCustomization). The `externalId`-based relation system means datasets can reference related objects by predictable IDs rather than Strapi-generated `documentId`s.

## Common Pitfalls

### Pitfall 1: Admin Tools API Authentication

**What goes wrong:** The Admin Tools endpoints use `admin::isAuthenticatedAdmin` policy, which requires Strapi admin panel authentication, NOT content API authentication.
**Why it happens:** Strapi has two separate auth systems: content API (`/api/auth/local`) and admin panel (`/admin/login`). The Admin Tools is an admin-type plugin.
**How to avoid:** Use `POST /admin/login` with `{ email: 'mock.admin@openvaa.org', password: 'admin' }` to get a JWT token, then include `Authorization: Bearer <token>` in all Admin Tools API requests.
**Warning signs:** 403 Forbidden responses, "Forbidden" error messages, `admin::hasPermissions` policy failures.

### Pitfall 2: Admin Tools Data Controller Parses Body as String

**What goes wrong:** The data controller does `JSON.parse(ctx.request.body ?? '{}')` which means it expects the raw body to be a JSON string, not a pre-parsed object.
**Why it happens:** Koa/Strapi body parsing middleware may or may not have already parsed the body depending on Content-Type headers and middleware order.
**How to avoid:** When using Playwright's `request.post()`, send the data as `data: JSON.stringify({ data: dataObject })` with `headers: { 'Content-Type': 'application/json' }`. Test with a simple import first to verify the request format works.
**Warning signs:** "Invalid request: Missing data" error, `data` being `undefined` in the controller.

### Pitfall 3: ExternalId Consistency Between Import and Delete

**What goes wrong:** Test dataset import uses `externalId` values, but delete uses `externalId` prefixes. If the prefix doesn't match, data won't be cleaned up.
**Why it happens:** The delete API uses `$startsWith` filter on `externalId`. If you name your test data `test-candidate-1` but delete with prefix `test_`, nothing gets deleted.
**How to avoid:** Use a consistent prefix for ALL test data externalIds (e.g., `test-`). Delete all collections with the same prefix: `{ elections: 'test-', candidates: 'test-', ... }`.
**Warning signs:** Test data accumulating in the database, tests seeing stale data from previous runs.

### Pitfall 4: Playwright Version Upgrade Breaking Changes

**What goes wrong:** Tests fail after upgrading from 1.49.1 to 1.58.x due to removed selectors or changed behavior.
**Why it happens:** Between 1.49.1 and 1.58.2: `_react`/`_vue` selectors removed, `:light` suffix removed, `page.accessibility` removed, Chrome for Testing replaces Chromium.
**How to avoid:** The existing tests don't use any of the removed features. Run existing tests after upgrade to verify. The biggest change is Chrome for Testing (slightly different rendering than Chromium), but since there are no screenshot comparisons yet, this is low risk.
**Warning signs:** "Unknown selector engine" errors, visual differences in screenshots.

### Pitfall 5: TestId Attribute on Wrong Svelte Element

**What goes wrong:** `data-testid` is placed on a wrapper `<div>` instead of the interactive element (button, input, link), making `getByTestId().click()` not work as expected.
**Why it happens:** Svelte components often have a root wrapper element. Placing testId on the component's outermost element instead of the interactive child means Playwright targets the wrong element.
**How to avoid:** Always place `data-testid` on the actual interactive element: the `<input>`, `<button>`, `<a>`, or `<select>`. For composite components (e.g., a card with a link), place it on the clickable element.
**Warning signs:** `click()` does nothing, `fill()` throws "not an input element" error.

### Pitfall 6: ESLint Plugin Conflicts with Existing Config

**What goes wrong:** `eslint-plugin-playwright` rules conflict with existing shared config rules (e.g., `func-style`, `no-restricted-syntax`).
**Why it happens:** The shared config at `packages/shared-config/eslint.config.mjs` enforces `func-style: declaration` which conflicts with Playwright's `test()` callback pattern. The existing tests eslint config imports shared config.
**How to avoid:** The `eslint-plugin-playwright` should be added as an override in the `tests/eslint.config.mjs` file, scoped to test files only. Disable conflicting shared config rules within that scope.
**Warning signs:** ESLint errors in test files about arrow functions, import sorting conflicts.

## Code Examples

### Setup Project Test File

```typescript
// tests/tests/setup/data.setup.ts
import { test as setup, expect } from '@playwright/test';
import { StrapiAdminClient } from '../utils/strapiAdminClient';
import defaultDataset from '../data/default-dataset.json';

const TEST_DATA_PREFIX = 'test-';

setup('import test dataset', async () => {
  const client = new StrapiAdminClient();
  await client.login();

  // Clean up any existing test data first
  const deleteResult = await client.deleteData({
    nominations: TEST_DATA_PREFIX,
    candidates: TEST_DATA_PREFIX,
    parties: TEST_DATA_PREFIX,
    questions: TEST_DATA_PREFIX,
    questionCategories: TEST_DATA_PREFIX,
    questionTypes: TEST_DATA_PREFIX,
    elections: TEST_DATA_PREFIX,
    constituencies: TEST_DATA_PREFIX,
    constituencyGroups: TEST_DATA_PREFIX,
    alliances: TEST_DATA_PREFIX
  });
  expect(deleteResult.type).toBe('success');

  // Import fresh test data
  const importResult = await client.importData(defaultDataset);
  expect(importResult.type).toBe('success');

  await client.dispose();
});
```

### Auth Setup Project

```typescript
// tests/tests/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate as candidate', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: 'en' })}`);

  await page.getByTestId(testIds.candidate.login.email).fill('mock.candidate.2@openvaa.org');
  await page.getByTestId(testIds.candidate.login.password).fill('Password1!');
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for successful login
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
```

Source: [Playwright Auth Setup](https://playwright.dev/docs/auth)

### Test Dataset JSON Structure

```json
{
  "questionTypes": [
    {
      "externalId": "test-qt-likert5",
      "name": "Likert-5",
      "settings": {
        "type": "singleChoiceOrdinal",
        "choices": [
          { "key": 1, "label": { "en": "Fully disagree" } },
          { "key": 2, "label": { "en": "Somewhat disagree" } },
          { "key": 3, "label": { "en": "Neutral" } },
          { "key": 4, "label": { "en": "Somewhat agree" } },
          { "key": 5, "label": { "en": "Fully agree" } }
        ]
      }
    }
  ],
  "elections": [
    {
      "externalId": "test-election-1",
      "name": { "en": "Test Election 2025" },
      "date": "2025-06-15",
      "constituencyGroups": { "externalId": ["test-cg-1"] }
    }
  ],
  "constituencies": [
    {
      "externalId": "test-constituency-1",
      "name": { "en": "Test Constituency Alpha" }
    }
  ],
  "constituencyGroups": [
    {
      "externalId": "test-cg-1",
      "name": { "en": "Test Constituency Group" },
      "constituencies": { "externalId": ["test-constituency-1"] }
    }
  ],
  "questionCategories": [
    {
      "externalId": "test-category-1",
      "name": { "en": "Test Category: Economy" },
      "order": 1,
      "elections": { "externalId": ["test-election-1"] }
    }
  ],
  "questions": [
    {
      "externalId": "test-question-1",
      "text": { "en": "Test Opinion Question 1" },
      "category": { "externalId": "test-category-1" },
      "questionType": { "externalId": "test-qt-likert5" },
      "order": 1
    }
  ],
  "parties": [
    {
      "externalId": "test-party-a",
      "name": { "en": "Test Party A" },
      "shortName": { "en": "TPA" }
    }
  ],
  "candidates": [
    {
      "externalId": "test-candidate-alpha",
      "firstName": "Test Candidate",
      "lastName": "Alpha",
      "email": "test.alpha@openvaa.org",
      "answersByExternalId": {
        "test-question-1": { "value": 4 }
      }
    }
  ],
  "nominations": [
    {
      "externalId": "test-nom-alpha",
      "candidate": { "externalId": "test-candidate-alpha" },
      "election": { "externalId": "test-election-1" },
      "constituency": { "externalId": "test-constituency-1" },
      "party": { "externalId": "test-party-a" }
    }
  ]
}
```

**Important:** The import order matters because of external relations. The Admin Tools API resolves `externalId` references at import time, so dependent collections must be imported after their dependencies. The `import` service iterates through keys in order, so the JSON keys should be ordered: `questionTypes` -> `elections` -> `constituencies` -> `constituencyGroups` -> `questionCategories` -> `questions` -> `parties` -> `candidates` -> `nominations`.

### ESLint Flat Config for Tests

```javascript
// tests/eslint.config.mjs
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  ...sharedConfig,
  {
    ignores: ['playwright*']
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Enforce testId usage over raw locators
      'playwright/no-raw-locators': 'error',
      // Enforce no waitForTimeout (already in recommended but make explicit)
      'playwright/no-wait-for-timeout': 'error',
      // Recommended rules that are already included:
      // - playwright/missing-playwright-await
      // - playwright/no-page-pause
      // - playwright/prefer-web-first-assertions
      // - playwright/no-focused-test
      // - playwright/no-skipped-test

      // Disable shared config rules that conflict with test patterns
      'func-style': 'off' // Tests use arrow functions in test() callbacks
    }
  }
];
```

### Adding data-testid to a Svelte Component

```svelte
<!-- Example: Button component with testId prop -->
<script lang="ts">
  // ... existing props
  export let testId: string | undefined = undefined;
</script>

<button
  data-testid={testId}
  on:click
  class={classes}
>
  <slot />
</button>
```

```svelte
<!-- Example: Page using Button with testId -->
<script lang="ts">
  import Button from '$lib/components/button/Button.svelte';
</script>

<Button testId="voter-home-start" on:click={handleStart}>
  {$t('common.start')}
</Button>
```

**For route-level pages:** Add `data-testid` directly on interactive elements within the page component. For shared components (Button, Input, Select, etc.), add an optional `testId` prop that passes through to the rendered HTML element.

## State of the Art

| Old Approach              | Current Approach            | When Changed            | Impact                                                 |
| ------------------------- | --------------------------- | ----------------------- | ------------------------------------------------------ |
| `globalSetup` function    | Project dependencies        | Playwright 1.31+ (2023) | Setup appears in HTML report with traces               |
| `globalTeardown` function | `teardown` project property | Playwright 1.34+ (2023) | Cleaner lifecycle management                           |
| Chromium browser          | Chrome for Testing          | Playwright 1.57 (2025)  | More realistic browser behavior, closer to real Chrome |
| `page.accessibility` API  | axe-core or similar         | Playwright 1.57 (2025)  | Removed after 3 years deprecated                       |
| `_react`/`_vue` selectors | `getByTestId`/`getByRole`   | Playwright 1.58 (2026)  | Custom framework selectors fully removed               |
| `:light` selector suffix  | Standard selectors          | Playwright 1.58 (2026)  | Shadow DOM handling changed                            |

**Deprecated/outdated:**

- `globalSetup`: Still functional but officially recommended to migrate to project dependencies for better reporting and debugging
- `_react` and `_vue` selectors: Fully removed in 1.58. Not used in this project.
- `page.accessibility`: Removed in 1.57. Not used in this project.

## Open Questions

1. **Admin Tools API body format verification**

   - What we know: The controller does `JSON.parse(ctx.request.body)` which suggests it may receive the body as a string
   - What's unclear: Whether Playwright's `request.post({ data })` sends pre-parsed JSON or a string, and whether Strapi's middleware has already parsed it
   - Recommendation: First implementation task should include a smoke test that verifies a simple import/delete roundtrip works with the chosen request format. If `data:` doesn't work, try `data: JSON.stringify()` with explicit Content-Type header.

2. **Admin login endpoint response format**

   - What we know: `POST /admin/login` exists in Strapi's admin module (confirmed in compiled source)
   - What's unclear: Exact response shape (likely `{ data: { token: string, user: object } }` based on Strapi conventions)
   - Recommendation: Log the response during first implementation to confirm format. Fallback: use the existing browser-based login pattern from `global-setup.ts` to extract cookies.

3. **Existing testId `submitButton` naming inconsistency**

   - What we know: The profile page uses `data-testid="submitButton"` which is camelCase, not kebab-case
   - What's unclear: Whether to rename it immediately or leave as legacy
   - Recommendation: Rename to `profile-submit` as part of the testId migration. The only reference is in `candidateApp-advanced.spec.ts` which will be migrated in Phase 2 anyway.

4. **Import order dependency for external relations**
   - What we know: The `import` service iterates through `Object.entries(data)` in order
   - What's unclear: Whether JS object key ordering is guaranteed (it is in modern JS for string keys, per spec)
   - Recommendation: If in doubt, implement the API client to accept an ordered array of `[collection, data]` tuples instead of a single object. Or make multiple sequential `importData()` calls in dependency order.

## Sources

### Primary (HIGH confidence)

- Existing codebase analysis: `tests/playwright.config.ts`, `tests/tests/global-setup.ts`, Admin Tools plugin source
- [Playwright Project Dependencies Documentation](https://playwright.dev/docs/test-global-setup-teardown)
- [Playwright Authentication Documentation](https://playwright.dev/docs/auth)
- [Playwright Fixtures Documentation](https://playwright.dev/docs/test-fixtures)
- [Playwright Page Object Model Documentation](https://playwright.dev/docs/pom)
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) - Confirmed 1.58.2 as latest stable

### Secondary (MEDIUM confidence)

- [eslint-plugin-playwright GitHub](https://github.com/playwright-community/eslint-plugin-playwright) - v2.9.0, flat/recommended preset, rule list
- [eslint-plugin-playwright npm](https://www.npmjs.com/package/eslint-plugin-playwright) - Version and installation
- [Strapi Admin Panel Routes Convention](https://docs.strapi.io/cms/backend-customization/routes) - Admin type routes prefix
- Strapi admin login endpoint confirmed via compiled `@strapi/admin` source at `node_modules/@strapi/admin/dist/server/index.mjs`

### Tertiary (LOW confidence)

- Admin login response format: inferred from Strapi conventions, not verified against running instance
- `JSON.parse(ctx.request.body)` behavior: depends on middleware configuration, needs runtime verification

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Playwright 1.58.2 and eslint-plugin-playwright 2.9.0 verified from npm/official docs
- Architecture: HIGH - Project dependencies, fixtures, POM patterns all from official Playwright docs with code examples
- Admin Tools API: HIGH - Full source code analysis of controller, service, routes, types, and importable collections
- Pitfalls: MEDIUM - Admin auth and body parsing need runtime verification; other pitfalls from code analysis
- TestId strategy: HIGH - Based on existing 6 attributes and user-locked naming convention

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days - Playwright is stable, eslint-plugin-playwright may update)
