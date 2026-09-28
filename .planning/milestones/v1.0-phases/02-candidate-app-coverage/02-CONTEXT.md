# Phase 2: Candidate App Coverage - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure existing candidate tests and fill all missing flows (CAND-01 through CAND-15) using Phase 1 infrastructure. Each spec file independently runnable and isolated. No voter app tests, no locale testing, no admin workflows.

</domain>

<decisions>
## Implementation Decisions

### Legacy spec migration
- Rewrite all specs from scratch using testIds and page objects — do not port legacy code line-by-line
- Reference legacy specs (`candidateApp-basics.spec.ts`, `candidateApp-advanced.spec.ts`) for coverage intent only
- Delete legacy spec files after new specs cover all their flows
- Defer locale/translation testing to ADV-02 (v2) — Phase 2 tests run English only
- `translations.spec.ts` also deleted after migration

### Registration email flow
- Trigger registration emails via direct API call (strapiAdminClient), not Strapi admin UI navigation
- Read emails from LocalStack SES inbox (`/_aws/ses`), parse with mailparser, extract links with cheerio — keep this real-email approach
- Test full end-to-end chain: trigger email -> extract link -> set password -> verify auto-login
- Password reset (CAND-08) follows the same pattern: trigger forgot-password, read SES, extract reset link, complete flow
- Pre-registration (admin importing candidates) is out of scope — assume candidate already exists in dataset

### App mode switching
- Toggle app modes (answersLocked, candidateApp disabled, underMaintenance) via API settings update using strapiAdminClient
- Single spec file covers all mode and settings tests (CAND-09 through CAND-15)
- Verify both redirect URL and target page content for disabled/maintenance modes
- Each mode test restores default settings after verification — self-contained, no pollution

### Dataset & candidate scope
- Extend default dataset with an unregistered candidate entry (has email+party, no password/login)
- Profile tests use the fresh/unregistered candidate (natural flow: register -> fill profile -> answer questions)
- Data persistence (CAND-12) verified inline within profile and questions specs (reload page after save, verify data persists)
- Test all question types (Likert, date, number, text, boolean, image) — at least one answer per type

### Claude's Discretion
- Page object design for new pages (ProfilePage, QuestionsPage, SettingsPage, PreviewPage, RegisterPage, ForgotPasswordPage)
- Exact test assertions and error message verification patterns
- Test ordering within spec files
- How to handle file upload in profile image test (CAND-03)
- Notification display test approach (CAND-13)
- Question visibility settings test approach (CAND-15 — hideVideo, hideHero)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoginPage` page object: email/password/submit locators + `login()` action method
- `HomePage` page object: statusMessage locator + `expectStatus()` method
- `auth.fixture.ts`: Worker-scoped re-authentication for tests that need to login again after logout
- `fixtures/index.ts`: Fixture registration pattern for page objects (extend + provide)
- `strapiAdminClient.ts`: API client for Admin Tools endpoints
- `testIds.ts`: 53 entries across candidate/voter/shared namespaces — candidate section has login, profile, home, questions, settings, preview, nav, forgotPassword, register
- `default-dataset.json`: Election, constituencies, question types (all 6), questions, candidates with answers
- `data.setup.ts` / `data.teardown.ts`: Dataset load/cleanup via API
- `auth.setup.ts`: Saves storageState for candidate-app project
- `buildRoute.ts`: Route URL builder utility
- `test_image_black.png`: Test image file for upload testing
- `mockUsers.json` + `mockCandidateForTesting.json`: Test user credentials

### Established Patterns
- Playwright project dependencies: `data-setup -> auth-setup -> candidate-app`
- `candidate-app` project uses storageState from auth-setup (pre-authenticated)
- Specs in `tests/tests/specs/candidate/` directory
- Page objects in `tests/tests/pages/candidate/` directory
- ESLint blocks `waitForTimeout` and raw text-based locators
- JSON imports use `assert { type: 'json' }` syntax

### Integration Points
- Candidate app routes: login, forgot-password, password-reset, register/password, help, privacy, preregister (protected)
- Protected routes: home (status), profile, questions, questions/[questionId], settings, preview
- LocalStack SES at `LOCALSTACK_ENDPOINT/_aws/ses` for email testing
- Strapi admin at `localhost:1337/admin` (not used for Phase 2 — API-first approach)
- App settings toggleable via API: answersLocked, candidateApp, underMaintenance

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-candidate-app-coverage*
*Context gathered: 2026-03-04*
