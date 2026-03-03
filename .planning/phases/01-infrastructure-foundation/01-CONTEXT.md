# Phase 1: Infrastructure Foundation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the E2E test framework plumbing: Playwright upgrade, project dependencies pattern replacing globalSetup, API-based data management via Admin Tools, data-testid attributes across both apps, fixture-extended page object model, and ESLint Playwright plugin. No new test specs are written in this phase — only infrastructure that Phases 2-7 build on.

</domain>

<decisions>
## Implementation Decisions

### TestId naming convention

- kebab-case naming (matches existing 6 attributes: `login-email`, `password-field`, `login-submit`)
- Page-scoped prefix: IDs include the page/route context (e.g., `login-email`, `profile-submit`, `questions-card`)
- Central constants file (`testIds.ts`) exports all IDs — tests import from it, no inline strings. Enables autocomplete, prevents typos, single place to refactor

### Test dataset design

- Realistic but compact: 1 election, 2-3 constituencies, ~10 questions across 2-3 categories, 5-8 candidates with answers, 2-3 parties
- All question types included (Likert, date, number, text, boolean, image) — one of each minimum
- Obvious test markers for content: 'Test Candidate Alpha', 'Test Opinion Question 1', 'Test Party A'
- English only for default dataset (locale-specific testing deferred to v2 ADV-02)

### Data isolation strategy

- Database reset per spec file via Playwright project dependencies pattern
- Dedicated setup project with trace recording — failures show as 'data-setup FAILED' in HTML report, dependent test projects are skipped (not cascading)
- Auth handled via Playwright fixture per app: candidate tests get logged-in session, voter tests unauthenticated by default. Auth state per-worker (parallel safe)
- Standalone API client utility (`strapiAdminClient.ts`) wrapping Admin Tools `/import-data`, `/delete-data` endpoints — usable in setup projects, fixtures, or external scripts

### Page object model

- Page-level objects: one class per page/route (LoginPage, QuestionsPage, ResultsPage)
- Provided via Playwright fixtures (`test.extend<Fixtures>()`) — tests receive as parameters: `test('login', async ({ loginPage }) => ...)`
- Phase 1 creates stubs only: fixture infrastructure + 2-3 example page objects as templates. Phase 2+ fills in the rest as tests are written
- Page objects expose both high-level methods (`loginPage.login()`) and raw Locators (`loginPage.emailInput`) for flexible assertions

### Claude's Discretion

- Shared component testId handling (whether to prefix or use component-only names)
- Exact testId constants file structure and organization
- Playwright config structure for project dependencies
- ESLint Playwright plugin rule selection and severity levels
- API client error handling and retry logic
- Specific page objects chosen as Phase 1 stubs

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>

## Existing Code Insights

### Reusable Assets

- 6 existing `data-testid` attributes in kebab-case (login page, password field, error message, profile submit)
- Admin Tools plugin with `/import-data`, `/delete-data`, `/find-data`, `/find-candidates` endpoints ready
- Route builder utility (`buildRoute.ts`) and translation utilities already in test utils
- Mock user credentials in `/backend/vaa-strapi/src/functions/mockData/mockUsers.json`
- `@faker-js/faker` already installed as dependency

### Established Patterns

- Playwright config at `tests/playwright.config.ts` with HTML reporter, trace recording, Chromium-only
- Tests in `tests/tests/` directory with utils in `tests/tests/utils/`
- Global setup authenticates via browser login (to be replaced by fixture)
- Storage state pattern at `playwright/.auth/user.json`
- ESLint shared config in `@openvaa/shared-config` with TypeScript and import plugins

### Integration Points

- Admin Tools API requires admin auth + `plugin::openvaa-admin-tools.import-data` permission
- Frontend port configurable via `FRONTEND_PORT` env var (default 5173)
- Existing 3 spec files (candidateApp-basics, candidateApp-advanced, translations) will need migration to new patterns in Phase 2
- `IMPORTABLE_COLLECTIONS` whitelist in Admin Tools controls which collections can be imported

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-infrastructure-foundation_
_Context gathered: 2026-03-03_
