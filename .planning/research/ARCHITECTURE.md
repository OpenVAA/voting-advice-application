# Architecture Research

**Domain:** E2E testing framework for SvelteKit 2 + Strapi v5 monorepo (VAA)
**Researched:** 2026-03-03
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TEST LAYER                                  │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  voter-app/      │  candidate-app/  │  strapi-admin/                │
│  *.spec.ts       │  *.spec.ts       │  *.spec.ts                    │
│                  │                  │                               │
│  (voter flows,   │  (registration,  │  (data import, email,         │
│   questions,     │   login, profile, │   registration triggers)      │
│   results,       │   questions,     │                               │
│   filtering)     │   settings)      │                               │
└────────┬─────────┴────────┬─────────┴─────────────────┬─────────────┘
         │                  │                            │
         ▼                  ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FIXTURE LAYER                                 │
├─────────────────┬───────────────────┬───────────────────────────────┤
│  test.ts        │  voterTest.ts     │  candidateTest.ts             │
│  (base extend)  │  (extend base,    │  (extend base,                │
│                 │   voter pages,    │   candidate pages,            │
│                 │   voter state)    │   auth state)                 │
└────────┬────────┴────────┬──────────┴──────────────────┬────────────┘
         │                 │                              │
         ▼                 ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PAGE OBJECT LAYER                               │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  voter/          │  candidate/      │  shared/                      │
│  QuestionsPage   │  LoginPage       │  NavPage                      │
│  ResultsPage     │  ProfilePage     │  LocaleSwitcher               │
│  FilterPanel     │  QuestionsPage   │  (common elements)            │
│  CandidatePage   │  SettingsPage    │                               │
└────────┬─────────┴────────┬─────────┴──────────────────┬────────────┘
         │                  │                             │
         ▼                  ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HELPER / UTILITY LAYER                          │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  data/           │  api/            │  utils/                       │
│  datasets/       │  strapiAdmin.ts  │  buildRoute.ts                │
│   standard.ts    │  (HTTP client    │  translations.ts              │
│   multiElection  │   for admin      │  testIds.ts                   │
│   .ts            │   API calls)     │  wait.ts                      │
│  factories/      │                  │                               │
│   candidate.ts   │                  │                               │
│   voter.ts       │                  │                               │
└────────┬─────────┴────────┬─────────┴──────────────────┬────────────┘
         │                  │                             │
         ▼                  ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SETUP / TEARDOWN LAYER                            │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  setup/          │  setup/          │  setup/                       │
│  auth.setup.ts   │  data.setup.ts   │  teardown.ts                  │
│  (login, store   │  (import test    │  (delete test data            │
│   session state) │   datasets via   │   by externalId prefix)       │
│                  │   Strapi API)    │                               │
└──────────────────┴──────────────────┴───────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RUNNING SERVICES (Docker)                         │
│  Frontend :5173  │  Strapi :1337  │  Postgres  │  LocalStack :4566  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component               | Responsibility                                                       | Communicates With                   |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| Spec files              | Assert user stories, orchestrate test scenarios                      | Fixtures (via `test()`)             |
| Fixture layer           | Extend Playwright `test` with pre-initialized page objects and state | Page objects, setup layer           |
| Page objects            | Encapsulate UI interactions for a single page or component           | Playwright `Page`, shared utilities |
| Data datasets           | Typed JSON/TS definitions of test data configurations                | Strapi Admin API (via setup)        |
| Data factories          | Programmatically create test-specific records                        | Strapi Admin API                    |
| Strapi Admin API client | HTTP wrapper for admin plugin endpoints                              | Strapi backend                      |
| Setup projects          | Load data, establish auth sessions before tests run                  | Strapi Admin API, auth storage      |
| Teardown project        | Delete data by `externalId` prefix after tests complete              | Strapi Admin API                    |
| `buildRoute.ts`         | Generate typed URL paths without SvelteKit runtime                   | Spec files, page objects            |
| `translations.ts`       | Load i18n strings from source files for assertions                   | Spec files, page objects            |
| `testIds.ts`            | Centralize `data-testid` constants                                   | Page objects                        |

## Recommended Project Structure

```
tests/
├── playwright.config.ts         # Projects, setup/teardown, base config
├── package.json                 # Playwright + test deps
│
├── setup/                       # Setup and teardown projects
│   ├── auth.setup.ts            # Login voter/candidate, save storageState
│   ├── data.setup.ts            # Import standard test dataset via Admin API
│   └── teardown.ts              # Delete test data by externalId prefix
│
├── tests/                       # Test specifications
│   ├── voter/                   # Voter app flows
│   │   ├── questions.spec.ts    # Question answering flow
│   │   ├── results.spec.ts      # Results page, matching display
│   │   ├── filtering.spec.ts    # Candidate/party filtering
│   │   └── navigation.spec.ts   # Elections, constituencies, locale
│   ├── candidate/               # Candidate app flows
│   │   ├── auth.spec.ts         # Login, logout, password reset
│   │   ├── registration.spec.ts # Email invite → register flow
│   │   ├── profile.spec.ts      # Basic info, profile picture
│   │   ├── questions.spec.ts    # Opinion question answering
│   │   └── settings.spec.ts     # Password change, language
│   ├── admin/                   # Strapi admin flows
│   │   ├── import.spec.ts       # Data import via Admin Tools UI
│   │   └── email.spec.ts        # Registration email sending
│   └── config/                  # Configuration variant tests
│       ├── singleElection.spec.ts
│       └── multiElection.spec.ts
│
├── pages/                       # Page Object Models
│   ├── voter/
│   │   ├── QuestionsPage.ts
│   │   ├── ResultsPage.ts
│   │   ├── FilterPanel.ts
│   │   └── CandidateCardPage.ts
│   ├── candidate/
│   │   ├── LoginPage.ts
│   │   ├── ProfilePage.ts
│   │   ├── QuestionsPage.ts
│   │   └── SettingsPage.ts
│   ├── admin/
│   │   └── StrapiAdminPage.ts
│   └── shared/
│       ├── NavPage.ts
│       └── LocaleSwitcherPage.ts
│
├── fixtures/                    # Extended test objects
│   ├── base.ts                  # test.extend() with shared fixtures
│   ├── voterFixtures.ts         # Voter page objects, voter session
│   └── candidateFixtures.ts     # Candidate page objects, candidate session
│
├── data/                        # Test data
│   ├── datasets/
│   │   ├── standard.ts          # Standard single-election data
│   │   └── multiElection.ts     # Multi-election configuration data
│   └── factories/
│       ├── candidateFactory.ts  # Generate candidate records
│       └── voterFactory.ts      # Generate voter answer sets
│
└── utils/                       # Shared utilities
    ├── buildRoute.ts            # (already exists — keep and extend)
    ├── translations.ts          # (already exists — keep)
    ├── testIds.ts               # Centralized data-testid constants
    ├── strapiAdminClient.ts     # HTTP client for Admin API endpoints
    └── testsDir.ts              # (already exists — keep)
```

### Structure Rationale

- **`setup/`:** Separating setup/teardown into Playwright "projects" (not `globalSetup`) gives traces and HTML report visibility into setup failures — critical for debugging.
- **`tests/voter/` and `tests/candidate/`:** Separating by app means test files are focused. Voter and candidate apps share no pages and have different auth states.
- **`tests/config/`:** Configuration variant tests (single vs. multi-election) warrant their own dataset + spec, not bolted onto per-page tests.
- **`pages/`:** Page Object Model organized by app mirrors the route hierarchy. One file per page (not one file per app) keeps files small and focused.
- **`fixtures/`:** Fixtures compose page objects into typed test extensions — tests use `test.extend()` not raw `page.goto()`.
- **`data/`:** Datasets are typed TypeScript definitions (not raw JSON) so they can be validated. Factories create dynamic records when datasets are insufficient.
- **`utils/`:** Everything that isn't a page object or fixture. Existing utilities (`buildRoute.ts`, `translations.ts`) stay and are extended.

## Architectural Patterns

### Pattern 1: Fixture-Extended Test Objects

**What:** Extend Playwright's `test` base with pre-constructed page objects and auth state, so every spec file gets typed, ready-to-use page objects without manual setup.

**When to use:** For all spec files. Replaces raw `page.goto()` calls in `beforeEach`.

**Trade-offs:** Setup is centralized and reusable; the tradeoff is a layer of indirection. Worth it beyond 3-4 spec files.

**Example:**

```typescript
// fixtures/candidateFixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/candidate/LoginPage';
import { ProfilePage } from '../pages/candidate/ProfilePage';

export const candidateTest = base.extend<{
  loginPage: LoginPage;
  profilePage: ProfilePage;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  }
});

// tests/candidate/profile.spec.ts
import { candidateTest as test } from '../../fixtures/candidateFixtures';

test('should save basic info', async ({ profilePage }) => {
  await profilePage.goto();
  await profilePage.fillGender('Female');
  await profilePage.submit();
  await profilePage.expectRedirectToQuestions();
});
```

### Pattern 2: Page Object Model with Locator-Based Selectors

**What:** Encapsulate all element interactions in a typed class. Locators use `data-testid` (via `getByTestId`) as the primary strategy, falling back to semantic roles.

**When to use:** For any page tested in more than one spec file, or any interaction repeated more than twice.

**Trade-offs:** More upfront code; dramatically reduces maintenance when UI changes because selectors live in one place.

**Example:**

```typescript
// pages/candidate/LoginPage.ts
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TEST_IDS } from '../../utils/testIds';
import { buildRoute } from '../../utils/buildRoute';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(locale = 'en') {
    await this.page.goto('/' + buildRoute({ route: 'CandAppHome', locale }));
  }

  async login(email: string, password: string) {
    await this.page.getByTestId(TEST_IDS.login.email).fill(email);
    await this.page.getByTestId(TEST_IDS.login.password).fill(password);
    await this.page.getByTestId(TEST_IDS.login.submit).click();
  }

  async expectLoginError() {
    await expect(this.page.getByTestId(TEST_IDS.login.errorMessage)).toBeVisible();
  }
}

// utils/testIds.ts
export const TEST_IDS = {
  login: {
    email: 'login-email',
    password: 'password-field',
    submit: 'login-submit',
    errorMessage: 'login-errorMessage'
  },
  profile: {
    submitButton: 'submitButton'
  }
} as const;
```

### Pattern 3: Setup-Project Data Management via Strapi Admin API

**What:** Load test data before tests and delete it after using the existing Admin Tools API (`/import-data`, `/delete-data`). All test records use a prefixed `externalId` (e.g., `test::candidate::alice`) so teardown can delete them without touching production-seeded data.

**When to use:** For all tests that depend on specific data state. Prefer API-based data management over Playwright-driven UI navigation through Strapi admin for setup — it's faster and more reliable.

**Trade-offs:** Requires Strapi admin auth token during setup. The Admin Tools API requires `isAuthenticatedAdmin` policy — use a JWT obtained by logging in as the admin user (same as existing `global-setup.ts` pattern but for the admin, not the candidate).

**Example:**

```typescript
// setup/data.setup.ts
import { test as setup } from '@playwright/test';
import { StrapiAdminClient } from '../utils/strapiAdminClient';
import { STANDARD_DATASET } from '../data/datasets/standard';

setup('load test data', async () => {
  const client = await StrapiAdminClient.login();
  await client.importData(STANDARD_DATASET);
});

// setup/teardown.ts
import { test as teardown } from '@playwright/test';
import { StrapiAdminClient } from '../utils/strapiAdminClient';

teardown('delete test data', async () => {
  const client = await StrapiAdminClient.login();
  await client.deleteData({ candidates: 'test::', parties: 'test::' });
});
```

### Pattern 4: Playwright Projects for Logical Test Groups

**What:** Use Playwright's `projects` array to define dependencies: a `setup` project runs first, then `voter-tests` and `candidate-tests` run in parallel against the live stack.

**When to use:** Whenever tests require different preconditions (auth state, datasets) or must run in a specific order relative to setup/teardown.

**Trade-offs:** Adds configuration complexity; provides clear failure visibility and trace support for setup failures — a significant operational advantage.

**Example:**

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // 1. Load data and authenticate
    { name: 'setup', testMatch: /setup\/(auth|data)\.setup\.ts/ },

    // 2. Voter tests (unauthenticated, uses loaded data)
    {
      name: 'voter-tests',
      testMatch: /tests\/voter\/.+\.spec\.ts/,
      dependencies: ['setup']
    },

    // 3. Candidate tests (uses saved auth state)
    {
      name: 'candidate-tests',
      testMatch: /tests\/candidate\/.+\.spec\.ts/,
      use: { storageState: CANDIDATE_STORAGE_STATE },
      dependencies: ['setup']
    },

    // 4. Admin tests (uses separate admin auth state)
    {
      name: 'admin-tests',
      testMatch: /tests\/admin\/.+\.spec\.ts/,
      use: { storageState: ADMIN_STORAGE_STATE },
      dependencies: ['setup'],
      teardown: 'teardown'
    },

    // 5. Cleanup
    { name: 'teardown', testMatch: /setup\/teardown\.ts/ }
  ]
});
```

## Data Flow

### Test Data Flow (Setup to Teardown)

```
datasets/standard.ts (typed TS definition)
    │
    ▼
setup/data.setup.ts
    │ POST /api/openvaa-admin-tools/import-data
    ▼
Strapi backend (persists to Postgres)
    │
    ▼ (data visible to frontend via public API)
Test specs execute
    │ (read-only for voter; read-write for candidate)
    ▼
setup/teardown.ts
    │ POST /api/openvaa-admin-tools/delete-data
    ▼
Strapi backend (deletes by externalId prefix)
```

### Auth State Flow

```
setup/auth.setup.ts
    │ Browser: navigate to login page → fill credentials → click submit
    ▼
context.storageState() → playwright/.auth/candidate.json
                        → playwright/.auth/admin.json
    │
    ▼ (candidate-tests project uses storageState: candidate.json)
Tests start with authenticated session already established
```

### Test Request Flow (Page Object Pattern)

```
Spec file calls: profilePage.fillGender('Female')
    │
    ▼
ProfilePage.fillGender()
    │ page.getByTestId(TEST_IDS.profile.genderSelect).selectOption('Female')
    ▼
Playwright browser interaction
    │
    ▼
SvelteKit frontend (renders updated state)
    │ (if answer saved: PATCH /api/candidates/:id)
    ▼
Strapi API (persists to Postgres)
```

### Configuration Variant Flow (Multi-Election Tests)

```
datasets/multiElection.ts → data.setup.ts → Strapi
    │
    ▼ (separate Playwright project with its own setup)
tests/config/multiElection.spec.ts
    │ (navigates through election/constituency selectors)
    ▼
teardown deletes multiElection-prefixed records
```

## Scaling Considerations

| Scale        | Architecture Adjustments                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 20-50 tests  | Current approach is appropriate — one global setup per run, serial within auth-dependent suites                                             |
| 50-150 tests | Enable `fullyParallel: true` for voter tests (stateless); keep candidate tests serial or use per-test auth isolation                        |
| 150+ tests   | Consider worker-scoped fixtures for shared auth state; explore dedicated test database with `GENERATE_MOCK_DATA_ON_RESTART=true` per worker |

### Scaling Priorities

1. **First bottleneck:** Auth setup time. If each test creates its own session, startup dominates. Fix: use saved `storageState` (already the right pattern).
2. **Second bottleneck:** Data contamination in parallel candidate tests. Candidate tests mutate data (answers, passwords). Keep them serial (`mode: 'serial'`) or scope mutations to test-specific records using unique `externalId` prefixes per test run.

## Anti-Patterns

### Anti-Pattern 1: Text-Based Selectors for Assertions

**What people do:** `page.getByText('Submit')`, `page.getByRole('button', { name: T.en['common.login'] })`

**Why it's wrong:** Translation strings change. Content editors change labels. The existing tests are brittle because of this — the `translations.ts` utility was created to work around the brittleness, but using `data-testid` eliminates the problem at the root.

**Do this instead:** Add `data-testid` attributes to interactive elements in Svelte components; use `page.getByTestId(TEST_IDS.x.y)` in page objects. Keep translation-based assertions only for verifying visible content (not for locating elements).

### Anti-Pattern 2: State Carry-Over Between Tests

**What people do:** Each test assumes the previous test left the app in a particular state (e.g., questions already answered).

**Why it's wrong:** Tests become order-dependent. A single failure breaks all subsequent tests in the file. The existing candidate tests use `mode: 'serial'` and `test.beforeEach` navigation — tolerable for the current scope but fragile.

**Do this instead:** Each test navigates explicitly to its starting point and works with pre-seeded data rather than relying on prior test actions. Use setup projects to create the data state, not prior tests.

### Anti-Pattern 3: Test Data Defined Inside Test Files

**What people do:** Define user credentials, names, and expected values inline in spec files or import directly from `mockData/*.json`.

**Why it's wrong:** Data is scattered across files; changes require hunting. The `externalId` prefix pattern cannot be enforced if data definitions are spread across files.

**Do this instead:** All test data definitions live in `data/datasets/`. Spec files import typed constants from there. Mock data files in the backend (`backend/vaa-strapi/src/functions/mockData/`) are for backend seeding only — not for test data definitions.

### Anti-Pattern 4: Playwright-Driven UI for Data Setup

**What people do:** Navigate through Strapi admin UI to import CSV data as part of test setup.

**Why it's wrong:** Slow (3-5x slower than direct API calls), fragile (UI changes break setup), produces confusing traces that mix test infrastructure with application testing.

**Do this instead:** Use the Admin Tools REST API (`/import-data`, `/delete-data`) directly from `setup/data.setup.ts`. Keep Playwright-driven Strapi admin navigation only for tests that specifically test the admin UI itself (in `tests/admin/`).

### Anti-Pattern 5: Single Monolithic Spec File Per App

**What people do:** `candidateApp-basics.spec.ts` and `candidateApp-advanced.spec.ts` — everything in two files.

**Why it's wrong:** Serial test suites become slow. Failures in one feature block all other feature tests. Hard to run a single flow in isolation during development.

**Do this instead:** One spec file per user flow (auth, profile, questions, settings). Use Playwright's `--grep` or file-level filters to run individual flows. Parallelism within a flow is limited by state, but parallelism across flows is free.

## Integration Points

### External Services

| Service                  | Integration Pattern                                  | Notes                                                                                     |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Strapi REST API (public) | Direct HTTP via `request` fixture for GET assertions | No auth needed for public endpoints                                                       |
| Strapi Admin API         | HTTP via `StrapiAdminClient` wrapper (JWT auth)      | Required for import/delete data; uses same admin creds as `candidateApp-advanced.spec.ts` |
| LocalStack SES           | HTTP GET to `LOCALSTACK_ENDPOINT/_aws/ses`           | For verifying registration emails in `admin` test suite                                   |
| Frontend (:5173)         | Playwright browser navigation via `baseURL`          | Must be running before tests start                                                        |

### Internal Boundaries

| Boundary                            | Communication                     | Notes                                                                     |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| Spec files ↔ Page objects          | Direct method calls               | Page objects never import from spec files                                 |
| Page objects ↔ Playwright          | Playwright `Page` / `Locator` API | Page objects accept `Page` in constructor                                 |
| Fixtures ↔ Page objects            | Instantiation in fixture setup    | Fixtures own page object lifecycle                                        |
| Setup ↔ Strapi                     | HTTP (Admin API)                  | Auth via JWT stored in fixture, not `storageState`                        |
| Tests ↔ `translations.ts`          | Import `TRANSLATIONS` constant    | Read-only; translations utility is a test-only concern                    |
| Tests ↔ `buildRoute.ts`            | Import `buildRoute()` function    | Route builder avoids SvelteKit runtime dependency; keep extending         |
| `testIds.ts` ↔ Frontend components | Convention (not import)           | Frontend uses string values; test IDs file centralizes those same strings |

## Build Order for Implementation

The components above have the following dependency order for implementation:

1. **`utils/testIds.ts` + `utils/strapiAdminClient.ts`** — No dependencies on other test components. Unblocks everything.
2. **`data/datasets/` + `data/factories/`** — Depends only on testIds and type definitions from Strapi.
3. **`pages/` (page objects)** — Depends on `testIds.ts` and `buildRoute.ts`. Can be built in parallel per app (voter, candidate, admin, shared).
4. **`setup/` (setup + teardown projects)** — Depends on `strapiAdminClient.ts` and `data/datasets/`. Must work before any spec runs.
5. **`fixtures/`** — Depends on page objects. Composes them into typed `test.extend()`.
6. **`tests/` (spec files)** — Depends on fixtures. Write against page objects via fixtures, not raw Playwright.
7. **`playwright.config.ts` projects** — Wires everything. Finalize after all setup/teardown/fixture patterns are established.

## Sources

- [Page Object Models | Playwright](https://playwright.dev/docs/pom) — HIGH confidence (official docs)
- [Fixtures | Playwright](https://playwright.dev/docs/test-fixtures) — HIGH confidence (official docs)
- [Projects | Playwright](https://playwright.dev/docs/test-projects) — HIGH confidence (official docs)
- [Global Setup and Teardown | Playwright](https://playwright.dev/docs/test-global-setup-teardown) — HIGH confidence (official docs)
- [Database Rollback Strategies in Playwright | The Green Report](https://www.thegreenreport.blog/articles/database-rollback-strategies-in-playwright/database-rollback-strategies-in-playwright.html) — MEDIUM confidence (verified against official docs pattern)
- [Mock database in Svelte e2e tests | Mainmatter](https://mainmatter.com/blog/2025/08/21/mock-database-in-svelte-tests/) — MEDIUM confidence (Svelte-specific, 2025)
- [Setting Up E2E Testing in a Monorepo | Kyrre Gjerstad](https://www.kyrre.dev/blog/end-to-end-testing-setup) — MEDIUM confidence (practical monorepo guidance)
- Existing codebase analysis — HIGH confidence (direct inspection of `tests/`, `frontend/src/`, `backend/`, admin-tools plugin)

---

_Architecture research for: E2E testing framework, SvelteKit 2 + Strapi v5 VAA monorepo_
_Researched: 2026-03-03_
