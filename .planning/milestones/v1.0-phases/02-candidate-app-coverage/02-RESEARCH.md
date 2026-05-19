# Phase 2: Candidate App Coverage - Research

**Researched:** 2026-03-04
**Domain:** Playwright E2E test authoring for SvelteKit candidate application (authentication flows, profile management, question answering, app mode settings)
**Confidence:** HIGH

## Summary

This phase writes the complete candidate app E2E test suite (CAND-01 through CAND-15) using the infrastructure established in Phase 1. The technical domain is Playwright test authoring -- creating page objects, spec files, and test utilities for candidate authentication, registration, profile setup, opinion question answering, preview verification, and app mode/settings management.

The Phase 1 infrastructure is solid: project dependencies pattern, fixture-extended test base, testId constants (53 entries), `StrapiAdminClient` with import/delete/find operations, `LoginPage` and `HomePage` page objects, auth fixture, and default dataset with 5 candidates, 10 questions, 2 categories. The key new challenges are: (1) email-based registration/password-reset flows requiring LocalStack SES integration with `mailparser` and `cheerio`, (2) app settings manipulation via Strapi admin content-manager API (no public update endpoint exists), (3) profile page with file upload using Playwright's `filechooser` event, and (4) creating 6 new page objects while following the established patterns.

The candidate app routes are well-structured with clear testId coverage: login page has 10 testIds, registration flow has 8, profile has 6, questions has 8, settings has 6, preview has 1, plus nav elements. All pages use `data-testid` attributes on interactive elements. The app mode toggling (maintenance, disabled, locked) happens at the settings.access component level -- `underMaintenance`, `candidateApp`, and `answersLocked` booleans need to be updated via Strapi admin API since no public update route exists.

**Primary recommendation:** Use `StrapiAdminClient` for all API-driven setup (registration emails, password resets, settings changes), create 6 new page objects (ProfilePage, QuestionsPage, SettingsPage, PreviewPage, RegisterPage, ForgotPasswordPage), extend the default dataset with an unregistered candidate, and organize specs by user story with each file independently runnable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Legacy spec migration:**
- Rewrite all specs from scratch using testIds and page objects -- do not port legacy code line-by-line
- Reference legacy specs (`candidateApp-basics.spec.ts`, `candidateApp-advanced.spec.ts`) for coverage intent only
- Delete legacy spec files after new specs cover all their flows
- Defer locale/translation testing to ADV-02 (v2) -- Phase 2 tests run English only
- `translations.spec.ts` also deleted after migration

**Registration email flow:**
- Trigger registration emails via direct API call (strapiAdminClient), not Strapi admin UI navigation
- Read emails from LocalStack SES inbox (`/_aws/ses`), parse with mailparser, extract links with cheerio -- keep this real-email approach
- Test full end-to-end chain: trigger email -> extract link -> set password -> verify auto-login
- Password reset (CAND-08) follows the same pattern: trigger forgot-password, read SES, extract reset link, complete flow
- Pre-registration (admin importing candidates) is out of scope -- assume candidate already exists in dataset

**App mode switching:**
- Toggle app modes (answersLocked, candidateApp disabled, underMaintenance) via API settings update using strapiAdminClient
- Single spec file covers all mode and settings tests (CAND-09 through CAND-15)
- Verify both redirect URL and target page content for disabled/maintenance modes
- Each mode test restores default settings after verification -- self-contained, no pollution

**Dataset & candidate scope:**
- Extend default dataset with an unregistered candidate entry (has email+party, no password/login)
- Profile tests use the fresh/unregistered candidate (natural flow: register -> fill profile -> answer questions)
- Data persistence (CAND-12) verified inline within profile and questions specs (reload page after save, verify data persists)
- Test all question types (Likert, date, number, text, boolean, image) -- at least one answer per type

### Claude's Discretion
- Page object design for new pages (ProfilePage, QuestionsPage, SettingsPage, PreviewPage, RegisterPage, ForgotPasswordPage)
- Exact test assertions and error message verification patterns
- Test ordering within spec files
- How to handle file upload in profile image test (CAND-03)
- Notification display test approach (CAND-13)
- Question visibility settings test approach (CAND-15 -- hideVideo, hideHero)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAND-01 | Login/logout flow tested with new fixture pattern and test IDs | LoginPage page object exists, testIds.candidate.login has 4 entries, auth fixture for re-auth after logout |
| CAND-02 | Password change flow tested with new pattern | Settings page has testIds for currentPassword, newPassword, confirmPassword, updateButton; PasswordSetter component with testId props |
| CAND-03 | Profile setup tested (image upload, info questions, all field types) | Profile page has testIds, `filechooser` event pattern from legacy spec, `test_image_black.png` exists |
| CAND-04 | Opinion question answering tested (all question types, translations, comments) | Question page has testIds for answer, comment, save; dataset has 8 Likert questions; need to extend with other types |
| CAND-05 | Answer editing and category navigation tested | Questions list page has category expanders, edit buttons with testIds, individual question pages for editing |
| CAND-06 | Preview page tested (all entered data displays correctly) | Preview page loads EntityDetails component inside testId container; data from profile+answers should render |
| CAND-07 | Registration via email link tested | Admin Tools `/send-email` endpoint, LocalStack SES inbox at `/_aws/ses`, `mailparser` + `cheerio` installed; register page has testIds |
| CAND-08 | Password reset flow tested | Admin Tools `/candidate-auth/forgot-password` endpoint returns resetUrl; password-reset page has testIds |
| CAND-09 | Answers locked mode tested | `access.answersLocked` boolean in app-settings single type; home/profile/questions pages show Warning component |
| CAND-10 | App disabled mode tested | `access.candidateApp` boolean; candidate layout shows MaintenancePage when false |
| CAND-11 | Maintenance mode tested | `access.underMaintenance` boolean; root layout shows MaintenancePage |
| CAND-12 | Data persistence tested | Inline in profile/questions specs: save -> reload page -> verify data persists |
| CAND-13 | Candidate notification display tested | `notifications.candidateApp` with show/title/content fields; shown as Notification popup on mount |
| CAND-14 | Help and privacy pages render correctly | Both pages have testIds (help-contact-support, help-home, privacy-home); static content pages |
| CAND-15 | Question content visibility settings tested | `candidateApp.questions.hideVideo` and `hideHero` booleans; conditional Hero/video rendering on question page |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 | E2E test framework | Already installed from Phase 1; project dependencies, fixtures, page objects |
| `mailparser` | ^3.7.2 | Parse raw SES email data | Already installed; parses MIME format to extract HTML content |
| `cheerio` | ^1.0.0 | Extract links from email HTML | Already installed; jQuery-like API for HTML parsing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | ^16.4.7 | Environment variable loading | Already configured in playwright.config.ts |
| `@types/mailparser` | ^3.4.5 | TypeScript types for mailparser | Already installed |
| `@types/cheerio` | ^0.22.35 | TypeScript types for cheerio | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mailparser + cheerio | Regex email parsing | Brittle, breaks on format changes; libraries handle MIME properly |
| LocalStack SES inbox | Mock email service | Real email flow proves full integration; LocalStack already running |
| Admin API for settings | Direct DB manipulation | API approach mirrors how settings actually change; DB approach bypasses validation |

**Installation:**
No new installations needed. All dependencies already exist in root `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
tests/tests/
  specs/
    candidate/
      candidate-auth.spec.ts        # CAND-01, CAND-02 (login, logout, password change)
      candidate-registration.spec.ts # CAND-07, CAND-08 (registration email, password reset)
      candidate-profile.spec.ts     # CAND-03, CAND-12 partial (profile, image, persistence)
      candidate-questions.spec.ts   # CAND-04, CAND-05, CAND-12 partial (questions, editing, persistence)
      candidate-settings.spec.ts    # CAND-09-15 (app modes, notifications, help, privacy, visibility)
  pages/
    candidate/
      LoginPage.ts        # EXISTS - email, password, submit, login()
      HomePage.ts         # EXISTS - statusMessage, expectStatus()
      ProfilePage.ts      # NEW - image upload, info fields, submit, cancel
      QuestionsPage.ts    # NEW - question list, categories, edit buttons
      QuestionPage.ts     # NEW - single question answer, comment, save
      SettingsPage.ts     # NEW - password change fields, update button
      PreviewPage.ts      # NEW - preview container, close button
      RegisterPage.ts     # NEW - registration code, password set, submit
      ForgotPasswordPage.ts # NEW - email input, submit, success message
  utils/
    strapiAdminClient.ts  # EXISTS - needs updateAppSettings() method
    emailHelper.ts        # NEW - SES inbox fetch, email parse, link extract
    testIds.ts            # EXISTS - may need new entries
    buildRoute.ts         # EXISTS
```

### Pattern 1: Email Helper for SES Inbox
**What:** Utility that fetches emails from LocalStack SES, parses with mailparser, extracts links with cheerio.
**When to use:** Registration (CAND-07) and password reset (CAND-08) tests.
**Example:**
```typescript
// tests/tests/utils/emailHelper.ts
import { load } from 'cheerio';
import { simpleParser } from 'mailparser';
import { request } from '@playwright/test';

interface SESEmail {
  Id: string;
  Region: string;
  Source: string;
  RawData: string;
  Timestamp: string;
}

interface SESMailbox {
  messages: Array<SESEmail>;
}

const SES_INBOX_URL = `${process.env.LOCALSTACK_ENDPOINT ?? 'http://localhost:4566'}/_aws/ses`;

/**
 * Fetch all emails from LocalStack SES inbox.
 */
export async function fetchEmails(): Promise<Array<SESEmail>> {
  const ctx = await request.newContext();
  const response = await ctx.fetch(SES_INBOX_URL);
  const mailbox: SESMailbox = await response.json();
  await ctx.dispose();
  return mailbox.messages;
}

/**
 * Get the latest email sent to a specific recipient address.
 * Returns the parsed HTML content.
 */
export async function getLatestEmailHtml(recipientEmail: string): Promise<string | undefined> {
  const emails = await fetchEmails();
  // Filter by recipient and get the latest
  for (let i = emails.length - 1; i >= 0; i--) {
    const parsed = await simpleParser(emails[i].RawData);
    const to = parsed.to;
    if (to && 'value' in to) {
      const addresses = to.value.map((a) => a.address?.toLowerCase());
      if (addresses.includes(recipientEmail.toLowerCase())) {
        return parsed.textAsHtml ?? parsed.html ?? undefined;
      }
    }
    // Fallback: check raw data for recipient
    if (emails[i].RawData.includes(recipientEmail)) {
      return parsed.textAsHtml ?? parsed.html ?? undefined;
    }
  }
  return undefined;
}

/**
 * Extract the first link from email HTML content.
 */
export function extractLinkFromHtml(html: string): string | undefined {
  const $ = load(html);
  return $('a').first().attr('href') ?? undefined;
}

/**
 * Combined: fetch latest email to recipient and extract the first link.
 */
export async function getRegistrationLink(recipientEmail: string): Promise<string> {
  const html = await getLatestEmailHtml(recipientEmail);
  if (!html) throw new Error(`No email found for ${recipientEmail}`);
  const link = extractLinkFromHtml(html);
  if (!link) throw new Error(`No link found in email to ${recipientEmail}`);
  return link;
}
```

### Pattern 2: App Settings Update via Strapi Admin API
**What:** Extend `StrapiAdminClient` with a method to update app-settings single type via Strapi's content-manager admin API.
**When to use:** CAND-09 through CAND-15 (toggling answersLocked, candidateApp, underMaintenance, notifications, hideVideo/hideHero).
**Critical detail:** The content API route for app-settings only exposes `find` (read). Updates must go through the Strapi admin content-manager API at `PUT /content-manager/single-types/api::app-setting.app-setting`. This requires the admin JWT token (which `StrapiAdminClient` already has).
**Example:**
```typescript
// Add to StrapiAdminClient:

/**
 * Update the app-settings single type via Strapi admin content-manager API.
 * Use this to toggle access.candidateApp, access.underMaintenance,
 * access.answersLocked, notifications.candidateApp, etc.
 *
 * @param data - Partial settings object to merge with existing settings
 */
async updateAppSettings(data: Record<string, unknown>): Promise<void> {
  this.ensureAuthenticated();
  const response = await this.requestContext!.put(
    '/content-manager/single-types/api::app-setting.app-setting',
    {
      headers: this.headers,
      data
    }
  );
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Update app settings failed with status ${response.status()}: ${body}`);
  }
}
```

### Pattern 3: Page Object with File Upload
**What:** Page object handling Playwright's `filechooser` event for image upload.
**When to use:** CAND-03 profile image upload.
**Example:**
```typescript
// ProfilePage.ts
import type { Locator, Page } from '@playwright/test';
import { testIds } from '../../utils/testIds';

export class ProfilePage {
  readonly page: Page;
  readonly imageUpload: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;

  constructor(page: Page) {
    this.page = page;
    this.imageUpload = page.getByTestId(testIds.candidate.profile.imageUpload);
    this.submitButton = page.getByTestId(testIds.candidate.profile.submit);
    this.cancelButton = page.getByTestId('profile-cancel');
    this.firstName = page.getByTestId('profile-first-name');
    this.lastName = page.getByTestId('profile-last-name');
  }

  async uploadImage(filePath: string): Promise<void> {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.imageUpload.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
```

### Pattern 4: Spec File with Self-Contained Auth
**What:** Spec files that handle their own authentication state, not relying on the project-level storageState for tests that need fresh/different users.
**When to use:** Registration spec (CAND-07) and password reset spec (CAND-08) need unauthenticated context. Auth spec (CAND-01) needs to test logout then re-login.
**Example:**
```typescript
// candidate-registration.spec.ts
import { test, expect } from '../../fixtures';
import { getRegistrationLink } from '../../utils/emailHelper';
import { StrapiAdminClient } from '../../utils/strapiAdminClient';

// This spec needs a fresh browser context without pre-existing auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('candidate registration', () => {
  test('should register via email link and set password', async ({ page }) => {
    // 1. Trigger registration email via API
    const client = new StrapiAdminClient();
    await client.login();
    // ... send email, fetch link, complete registration
    await client.dispose();
  });
});
```

### Pattern 5: Settings Toggle with Cleanup
**What:** Tests that modify app settings must restore defaults after verification.
**When to use:** CAND-09 through CAND-15.
**Example:**
```typescript
test.describe('app mode: answers locked', () => {
  const client = new StrapiAdminClient();

  test.beforeAll(async () => {
    await client.login();
  });

  test.afterAll(async () => {
    // Restore default settings
    await client.updateAppSettings({
      access: { answersLocked: false, candidateApp: true, underMaintenance: false }
    });
    await client.dispose();
  });

  test('shows editing not allowed warning when answers are locked', async ({ page }) => {
    await client.updateAppSettings({ access: { answersLocked: true } });
    // Navigate and verify warning is shown
  });
});
```

### Anti-Patterns to Avoid
- **Serial test execution within spec files:** Use `test.describe.configure({ mode: 'serial' })` only when tests within a describe block genuinely depend on each other (e.g., registration flow: send email -> extract link -> set password). Otherwise, let tests run in parallel.
- **Relying on `waitForTimeout` for email delivery:** The legacy spec uses `page.waitForTimeout(5000)` -- ESLint blocks this. Instead, use polling with `expect.poll()` or retry logic when fetching SES emails.
- **Hardcoding translation strings:** Legacy specs use `T.en['candidateApp.settings.password.current']` for locators. New specs use testIds exclusively. Translation-based assertions (like "success message contains X text") are acceptable for content verification but not for element targeting.
- **Shared mutable state between describe blocks:** Each test or describe block should be independently runnable. Use `beforeAll`/`afterAll` within describe blocks to set up and tear down state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email parsing | Regex-based email content extraction | `mailparser` + `cheerio` | MIME format is complex; libraries handle encoding, multipart, edge cases |
| Settings manipulation | Direct database queries to toggle booleans | `StrapiAdminClient.updateAppSettings()` via admin content-manager API | Preserves data integrity, triggers Strapi lifecycle hooks |
| Auth state for tests | Manual cookie manipulation | `test.use({ storageState })` + auth fixture | Playwright handles storage state serialization, cookie security |
| Registration email trigger | Browser-based Strapi admin UI navigation | `StrapiAdminClient` API call to `/send-email` | API is instant, deterministic, not flaky |
| Password reset trigger | Frontend forgot-password form | `StrapiAdminClient` API call to `/candidate-auth/forgot-password` | Returns resetUrl directly, no email parsing needed for code extraction |
| File upload | Custom input interaction | Playwright's `page.waitForEvent('filechooser')` | Native browser file chooser API, handles all input types |

**Key insight:** The Admin Tools plugin has comprehensive candidate auth management endpoints (`/candidate-auth/search`, `/candidate-auth/info`, `/candidate-auth/force-register`, `/candidate-auth/forgot-password`, `/candidate-auth/set-password`, `/candidate-auth/generate-password`) that can be used for test setup. The registration email flow uses `/send-email` with `{LINK}` placeholder. The password reset flow has a dedicated endpoint that returns the reset URL directly.

## Common Pitfalls

### Pitfall 1: Registration Email Timing
**What goes wrong:** Test fetches SES inbox before the email has been delivered, gets an empty result or stale email.
**Why it happens:** Email sending is asynchronous. LocalStack SES may take a moment to process and store the email.
**How to avoid:** Use `expect.poll()` to retry fetching the SES inbox until the expected email appears, with a reasonable timeout (10-15 seconds). Do NOT use `waitForTimeout`.
**Warning signs:** Flaky test that passes sometimes but fails with "No email found" errors.

### Pitfall 2: App Settings Update Scope
**What goes wrong:** Updating `access.answersLocked = true` via the admin API accidentally resets other settings to their defaults.
**Why it happens:** Strapi's `PUT` endpoint for single types replaces the entire component if you only send partial data. Sending `{ access: { answersLocked: true } }` may clear `access.candidateApp`, `access.underMaintenance`, etc.
**How to avoid:** Always read the current settings first, merge the change, then send the complete object. Or send the full `access` component: `{ access: { candidateApp: true, voterApp: true, underMaintenance: false, answersLocked: true } }`.
**Warning signs:** Tests that toggle one setting break other tests by clearing adjacent settings.

### Pitfall 3: StorageState Conflicts Between Spec Files
**What goes wrong:** Registration spec clears auth state (`test.use({ storageState: { cookies: [], origins: [] } })`), but this affects tests in other spec files running in parallel.
**Why it happens:** If the storageState override is not properly scoped, it can leak to other tests.
**How to avoid:** `test.use()` at the file level or describe level is scoped correctly. Each spec file gets its own browser context. The candidate-app project's storageState is only a default; individual specs can override it without affecting others.
**Warning signs:** Tests pass individually but fail when run together.

### Pitfall 4: Admin Content-Manager API Authentication
**What goes wrong:** The `PUT /content-manager/single-types/...` endpoint returns 403 even with valid admin JWT.
**Why it happens:** The content-manager admin API may require additional permissions beyond basic admin auth, or the URL path format is wrong.
**How to avoid:** Verify the exact URL format. In Strapi v5, the content-manager API path for single types is: `PUT /content-manager/single-types/api::app-setting.app-setting`. The admin JWT from `POST /admin/login` should have full admin permissions.
**Warning signs:** 403 or 404 responses from the content-manager API.

### Pitfall 5: JSON.stringify for Admin Tools Controllers
**What goes wrong:** API calls to Admin Tools endpoints (send-email, candidate-auth) fail with "Missing data" errors.
**Why it happens:** All Admin Tools controllers do `JSON.parse(ctx.request.body ?? '{}')`. The body must be sent as a stringified JSON string.
**How to avoid:** Use `data: JSON.stringify({ ... })` in Playwright's `request.post()`, matching the existing `StrapiAdminClient` pattern.
**Warning signs:** "Invalid request: Missing data" or "Missing candidateId" errors.

### Pitfall 6: Unregistered Candidate Dataset Entry
**What goes wrong:** The unregistered candidate in the dataset gets registered during one test, causing subsequent tests to fail.
**Why it happens:** Registration creates a user linked to the candidate. If the test data isn't reset, the candidate remains registered.
**How to avoid:** The data-setup project runs before each test project, resetting the database. Ensure the registration spec runs within a single test that creates AND verifies the registration. If parallel tests need independent unregistered candidates, add multiple entries to the dataset.
**Warning signs:** "The user associated with the registration key is already registered" errors in subsequent test runs.

### Pitfall 7: Password Change Side Effects
**What goes wrong:** The password change test (CAND-02) changes the candidate's password but doesn't restore it, causing auth-setup to fail in subsequent runs.
**Why it happens:** Auth-setup uses hardcoded password "Password1!". If the test changes it and doesn't change it back, the setup fails.
**How to avoid:** The password change test must restore the original password at the end (as the legacy spec does). OR use a separate candidate for password change testing. The data-setup reset between runs would also fix this, but only if the test run completes.
**Warning signs:** auth-setup project fails with login errors on the second test run.

## Code Examples

### Verified Pattern: SES Email Polling
```typescript
// Source: Existing candidateApp-advanced.spec.ts pattern, adapted for testId approach
import { expect } from '@playwright/test';
import { fetchEmails, getLatestEmailHtml, extractLinkFromHtml } from '../../utils/emailHelper';

// Poll for email arrival instead of waitForTimeout
const html = await expect.poll(
  async () => {
    return await getLatestEmailHtml('unregistered.candidate@openvaa.org');
  },
  {
    message: 'Waiting for registration email to arrive in SES inbox',
    timeout: 15000,
    intervals: [1000, 2000, 3000]
  }
).toBeTruthy();

const link = extractLinkFromHtml(html!);
```

### Verified Pattern: Registration Email via Admin Tools API
```typescript
// Source: Admin Tools email controller + sendToAll service analysis
// The /send-email endpoint requires:
// - candidateId: string (Strapi documentId, NOT externalId)
// - subject: string
// - content: string (must contain {LINK} placeholder for registration URL)
// - requireRegistrationKey: boolean (optional)

// Step 1: Find the candidate's documentId
const findResult = await client.findData('candidates', {
  email: { $eq: 'unregistered.candidate@openvaa.org' }
});
const candidateDocumentId = findResult.data?.[0]?.documentId;

// Step 2: Send registration email
await client.sendEmail({
  candidateId: candidateDocumentId,
  subject: 'Registration',
  content: 'Click here to register: {LINK}',
  requireRegistrationKey: true
});
```

### Verified Pattern: Password Reset via Admin Tools API
```typescript
// Source: Admin Tools candidateAuth controller analysis
// The /candidate-auth/forgot-password endpoint:
// - Takes documentId of a REGISTERED candidate
// - Generates a reset token, saves it on the user
// - Sends a password reset email
// - Returns { type: 'success', resetUrl: string }

const result = await client.sendForgotPassword({ documentId: candidateDocumentId });
// result.resetUrl contains the full URL with ?code=<token>
// Format: http://localhost:5173/candidate/password-reset?code=<hex-token>
```

### Verified Pattern: File Upload with Playwright
```typescript
// Source: Playwright docs + existing candidateApp-advanced.spec.ts
import path from 'path';
import { TESTS_DIR } from '../../utils/testsDir';

// Wait for the file chooser event before clicking
const fileChooserPromise = page.waitForEvent('filechooser');
await page.getByTestId(testIds.candidate.profile.imageUpload).click();
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles(path.join(TESTS_DIR, 'test_image_black.png'));
```

### Verified Pattern: Clearing Auth State for Unauthenticated Tests
```typescript
// Source: Playwright docs - https://playwright.dev/docs/auth#testing-without-authentication
// File-level override: all tests in this file use empty auth state
test.use({ storageState: { cookies: [], origins: [] } });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `page.waitForTimeout(5000)` for emails | `expect.poll()` with retry | ESLint rule enforced in Phase 1 | Eliminates flaky waits, faster when email arrives quickly |
| Translation-based locators | TestId-based locators | Phase 1 decision | Locale-independent, refactor-safe |
| Strapi admin UI navigation | Admin Tools API calls | Phase 1 infra + admin tools API | 10-100x faster, deterministic |
| `test.describe.configure({ mode: 'serial' })` everywhere | Parallel by default, serial only when needed | Playwright best practice | Faster test execution |

**Deprecated/outdated:**
- `globalSetup`-based auth: Replaced by auth-setup project + per-worker auth fixture
- Translation-based element selectors (`getByLabel`, `getByText`, `getByRole`): Replaced by testId selectors
- `waitForTimeout`: Blocked by ESLint rule

## Open Questions

1. **Admin content-manager API exact URL format for Strapi v5**
   - What we know: In Strapi v4, the URL was `/content-manager/single-types/api::app-setting.app-setting`. Strapi v5 may differ slightly.
   - What's unclear: Whether the path includes a version prefix or document ID for single types.
   - Recommendation: Test the URL during implementation. If 404, try `/content-manager/single-types/api::app-setting.app-setting/update` or check Strapi v5 admin API docs.

2. **Candidate notification popup timing**
   - What we know: The notification popup is queued on `onMount` of the candidate layout component. It shows only if `$appSettings.notifications.candidateApp?.show` is true.
   - What's unclear: Whether the popup has a testId or if we need to add one. The Notification component may need a testId.
   - Recommendation: During implementation, check if the Notification component has a testId. If not, add one (e.g., `candidate-notification`). The popup uses the `popupQueue` system from AppContext.

3. **Question type coverage in dataset**
   - What we know: The default dataset has 8 Likert questions and 2 info questions (date, number). The CONTEXT.md requires testing all types: Likert, date, number, text, boolean, image.
   - What's unclear: Whether the candidate app actually renders all these types on the questions page (some may be info questions on the profile page, not opinion questions).
   - Recommendation: The dataset needs to be extended to include text, boolean, and possibly image question types as info questions (for profile) or opinion questions. The question types exist in the dataset (`test-qt-text`, `test-qt-boolean`, `test-qt-image`) but no questions use them. Add info questions linked to these types.

4. **StrapiAdminClient `sendEmail` and `sendForgotPassword` method additions**
   - What we know: These Admin Tools endpoints exist but `StrapiAdminClient` does not have wrapper methods for them yet.
   - What's unclear: Whether to add them to `StrapiAdminClient` or create a separate helper.
   - Recommendation: Add `sendEmail()` and `sendForgotPassword()` methods to `StrapiAdminClient` since they follow the same authentication pattern (admin JWT, JSON.stringify body).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=candidate-app` |
| Full suite command | `yarn test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAND-01 | Login/logout flow | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-auth.spec.ts` | Wave 0 |
| CAND-02 | Password change | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-auth.spec.ts` | Wave 0 |
| CAND-03 | Profile setup | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-profile.spec.ts` | Wave 0 |
| CAND-04 | Opinion question answering | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | Wave 0 |
| CAND-05 | Answer editing | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | Wave 0 |
| CAND-06 | Preview page | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | Wave 0 |
| CAND-07 | Registration email link | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-registration.spec.ts` | Wave 0 |
| CAND-08 | Password reset | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-registration.spec.ts` | Wave 0 |
| CAND-09 | Answers locked mode | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | Wave 0 |
| CAND-10 | App disabled mode | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | Wave 0 |
| CAND-11 | Maintenance mode | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | Wave 0 |
| CAND-12 | Data persistence | e2e | Inline in profile + questions specs | N/A (inline) |
| CAND-13 | Notification display | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | Wave 0 |
| CAND-14 | Help and privacy pages | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | Wave 0 |
| CAND-15 | Question visibility settings | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-settings.spec.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test:e2e --project=candidate-app` (runs only candidate specs)
- **Per wave merge:** `yarn test:e2e` (full suite including data setup/teardown)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/tests/specs/candidate/candidate-auth.spec.ts` -- covers CAND-01, CAND-02
- [ ] `tests/tests/specs/candidate/candidate-registration.spec.ts` -- covers CAND-07, CAND-08
- [ ] `tests/tests/specs/candidate/candidate-profile.spec.ts` -- covers CAND-03
- [ ] `tests/tests/specs/candidate/candidate-questions.spec.ts` -- covers CAND-04, CAND-05, CAND-06
- [ ] `tests/tests/specs/candidate/candidate-settings.spec.ts` -- covers CAND-09 through CAND-15
- [ ] `tests/tests/pages/candidate/ProfilePage.ts` -- page object
- [ ] `tests/tests/pages/candidate/QuestionsPage.ts` -- page object (candidate version)
- [ ] `tests/tests/pages/candidate/QuestionPage.ts` -- single question page object
- [ ] `tests/tests/pages/candidate/SettingsPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/PreviewPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/RegisterPage.ts` -- page object
- [ ] `tests/tests/pages/candidate/ForgotPasswordPage.ts` -- page object
- [ ] `tests/tests/utils/emailHelper.ts` -- SES email fetch + parse utility
- [ ] Dataset extension: unregistered candidate + additional question types

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: all frontend candidate route files (`+page.svelte`), all test infrastructure from Phase 1
- Admin Tools plugin source: `backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/` -- controllers, services, routes for email, candidateAuth, data
- App settings schema: `backend/vaa-strapi/src/api/app-setting/content-types/app-setting/schema.json` + component schemas (access, candidate-app, notifications)
- Existing test files: `candidateApp-basics.spec.ts`, `candidateApp-advanced.spec.ts` -- coverage intent reference
- Phase 1 research: `.planning/phases/01-infrastructure-foundation/01-RESEARCH.md` -- established patterns and conventions
- [Playwright File Upload](https://playwright.dev/docs/input#upload-files) -- filechooser event pattern

### Secondary (MEDIUM confidence)
- Strapi v5 admin content-manager API path format -- inferred from v4 conventions, needs runtime verification
- SES email delivery timing -- based on LocalStack behavior observation, may vary

### Tertiary (LOW confidence)
- Notification popup testId availability -- needs investigation during implementation
- Admin content-manager API permission requirements for single type update -- may need additional Strapi v5 verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified in Phase 1
- Architecture (page objects, spec structure): HIGH - extends established Phase 1 patterns with well-understood Playwright APIs
- Email flow (registration, password reset): HIGH - full source code analysis of Admin Tools email service, controller, and SES integration
- App settings manipulation: MEDIUM - approach is sound but admin content-manager API URL needs runtime verification in Strapi v5
- Pitfalls: HIGH - identified from legacy spec analysis and source code review

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days - test infrastructure is stable, frontend routes unlikely to change)
