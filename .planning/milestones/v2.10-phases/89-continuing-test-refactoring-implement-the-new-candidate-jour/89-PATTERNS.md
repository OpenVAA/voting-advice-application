# Phase 89: continuing-test-refactoring-implement-the-new-candidate-jour — Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** ~31 (12 new fixtures + composition root + 3 perm templates + 3 perm specs + 3 setup/teardown pairs + candidate-mega spec + setup/teardown + README + several modifies)
**Analogs found:** 31 / 31 (every file has at least a strong analog in the codebase)

---

## File Classification

### Plan 89-01 — baseV1 dataset + voter-mega assertions

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/templates/baseV1.ts` (MODIFY) | template (data) | batch | itself (extend existing arrays) | self (in-place mutation) |
| `tests/tests/specs/voter/voter-mega-journey.spec.ts` (MODIFY) | spec | request-response | itself (extend existing steps) | self (in-place mutation) |
| `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` (MODIFY) | component | view-only | itself (add `data-testid` on hero figure / info Expander) | self (in-place attribute) |
| `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` (MODIFY) | component | view-only | itself (add `data-testid` on hero) | self (in-place attribute) |
| `tests/tests/utils/testIds.ts` (MODIFY) | utility (constants) | n/a | itself (extend voter / candidate namespaces) | self |

### Plan 89-02 — Candidate fixture library

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `tests/tests/fixtures/candidate-mega.fixture.ts` (composition root) | fixture (test util) | request-response | `tests/tests/fixtures/views.ts` | exact |
| `tests/tests/fixtures/candidate/emailBucket.fixture.ts` | fixture (wrapper) | external API (Mailpit) | `tests/tests/utils/emailHelper.ts` (wrap) + `tests/tests/fixtures/entityDetails.fixture.ts` (function-fixture shape) | role-match (wrap helper as fixture) |
| `tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/entityDetails.fixture.ts` (function-fixture pattern) | exact |
| `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/entityDetails.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/resultsPage.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/entityDetails.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/entityDetails.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/resultsPage.fixture.ts` + `entityDetails.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/resultsPage.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/resultsPage.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/entityDetails.fixture.ts` | exact |
| `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts` | fixture (page object) | request-response | `tests/tests/fixtures/entityDetails.fixture.ts` | exact |
| (possible) `apps/frontend/src/lib/...` testid additions per Testid Additions Catalog | component | view-only | n/a (attribute extension) | n/a |

### Plan 89-03 — Candidate mega-journey spec

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` | spec (serial mega-journey) | request-response | `tests/tests/specs/voter/voter-mega-journey.spec.ts` + `tests/tests/specs/candidate/candidate-registration.spec.ts` (unauth setup) | exact |
| `tests/tests/specs/candidate/candidate-mega-journey.README.md` | docs (pattern) | n/a | `tests/tests/specs/voter/voter-mega-journey.README.md` | exact |
| `tests/tests/setup/candidate-mega.setup.ts` | setup (project) | batch | `tests/tests/setup/baseV1.setup.ts` | exact |
| `tests/tests/setup/candidate-mega.teardown.ts` | teardown (project) | batch | `tests/tests/setup/baseV1.teardown.ts` + auth-unregister branch from `tests/tests/setup/data.teardown.ts` | exact + role-match |
| `tests/playwright.config.ts` (MODIFY — append 3 project entries) | config | n/a | existing `data-setup-baseV1`/`voter-mega-journey` triple at `:618-643` | exact |

### Plan 89-04 — 3 settings permutations

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` | template (data) | batch | `packages/dev-seed/src/templates/permutations/perm-disable-election-1co.ts` | exact |
| `packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts` | template (data) | batch | same | exact |
| `packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts` | template (data) | batch | same | exact |
| `packages/dev-seed/src/templates/index.ts` (MODIFY — register 3 new templates) | template registry | n/a | itself (extend `BUILT_IN_TEMPLATES`) | self |
| `tests/tests/setup/perm-disable-voter-app.setup.ts` + `.teardown.ts` | setup/teardown (project) | batch | `tests/tests/setup/perm-disable-election-1co.setup.ts` + paired `.teardown.ts` | exact |
| `tests/tests/setup/perm-disable-candidate-app.setup.ts` + `.teardown.ts` | setup/teardown (project) | batch | same | exact |
| `tests/tests/setup/perm-per-app-notifications.setup.ts` + `.teardown.ts` | setup/teardown (project) | batch | same | exact |
| `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` | spec | request-response | `tests/tests/specs/perm/perm-disable-election-1co.spec.ts` | exact |
| `tests/tests/specs/perm/perm-disable-candidate-app.spec.ts` | spec | request-response | same | exact |
| `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` | spec | request-response | same | exact |
| `tests/playwright.config.ts` (MODIFY — append 9 project entries) | config | n/a | existing `data-setup-perm-disable-election-1co`/spec/teardown triple at `:786-805` | exact |

### Plan 89-LAST — Legacy retirement

| File | Action | Analog |
|------|--------|--------|
| `tests/tests/specs/candidate/candidate-{auth,password,registration,questions,required-info}.spec.ts` | DELETE (5 files) | n/a — pure removal |
| `tests/tests/specs/candidate/candidate-settings.spec.ts` | MODIFY (excise 7.1.2/3/4 — see file lines 166-271) | itself |
| `tests/tests/pages/candidate/*Page.ts` | conditional DELETE (per-class consumer audit via grep) | n/a — pure removal |
| `tests/playwright.config.ts` | MODIFY (lines 122-247 PLAYWRIGHT_LEGACY block: prune defunct testIgnore + project entries) | itself |
| `tests/tests/fixtures/index.ts` | UNCHANGED through 89; only audited (per D-89-04) | n/a |

---

## Pattern Assignments

### Pattern A — Per-page function-fixture (89-02, applied to all 11 page-object fixtures + emailBucket)

**Analog:** `tests/tests/fixtures/entityDetails.fixture.ts:14-163`

**Imports + docstring + rigidity contract** (lines 1-19):
```typescript
/**
 * @file <name> fixture — Phase 89 Plan 02.
 *
 * Function-fixture for the <surface>. Sibling to other candidate-fixtures.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6, inherited):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';
```

**Factory + return-object shape** (lines 46-160 — the canonical function-fixture shape; no class, no Page-Object base):
```typescript
export function createEntityDetails(page: Page) {
  // private internal locators / helpers (closures over page)
  function activeContainer(): Locator { ... }

  return {
    async selectTab(tabType: 'info' | 'children' | 'opinions'): Promise<void> {
      const details = page.getByTestId(testIds.voter.results.entityDetails);
      await details.getByRole('tab', { name: TAB_LABELS[tabType] }).click();
    },

    async expectTabs(expectedTypes: Array<...>): Promise<void> {
      const details = page.getByTestId(testIds.voter.results.entityDetails);
      const tabs = details.getByRole('tab');
      await expect(tabs).toHaveCount(expectedTypes.length);
      for (let i = 0; i < expectedTypes.length; i++) {
        await expect(tabs.nth(i)).toHaveAccessibleName(TAB_LABELS[expectedTypes[i]]);
      }
    },

    getInfoItems(): Locator {
      return activeContainer().getByTestId(testIds.voter.results.infoItem);
    }
    // ... more methods
  };
}

export type EntityDetailsFixture = ReturnType<typeof createEntityDetails>;
```

**Key extraction rules (apply to every 89-02 fixture):**
1. Single file, single `createXxx(page: Page)` factory.
2. Return-value is an OBJECT LITERAL with named methods (NO class, NO `this`).
3. Export the inferred type via `ReturnType<typeof createXxx>` named `XxxFixture`.
4. All assertion-bearing methods use `await expect(...)`. NO soft/try-catch/catch(()=>null) on assertions.
5. Rigidity-contract comment at the top of every fixture file (verbatim from analog).
6. All testid string constants land under `testIds.candidate.*` in `tests/tests/utils/testIds.ts`.

---

### Pattern B — Composition root (89-02 → `tests/tests/fixtures/candidate-mega.fixture.ts`)

**Analog:** `tests/tests/fixtures/views.ts` (51 lines, complete file)

**Full file shape** (lines 25-51):
```typescript
import { expect, test as base } from '@playwright/test';
import { createEntityDetails } from './entityDetails.fixture';
import { createEntityFilters } from './entityFilters.fixture';
import { createResultsPage } from './resultsPage.fixture';
import type { EntityDetailsFixture } from './entityDetails.fixture';
import type { EntityFiltersFixture } from './entityFilters.fixture';
import type { ResultsPageFixture } from './resultsPage.fixture';

type ViewFixtures = {
  resultsPage: ResultsPageFixture;
  entityFilters: EntityFiltersFixture;
  entityDetails: EntityDetailsFixture;
};

export const test = base.extend<ViewFixtures>({
  resultsPage: async ({ page }, use) => {
    await use(createResultsPage(page));
  },
  entityFilters: async ({ page }, use) => {
    await use(createEntityFilters(page));
  },
  entityDetails: async ({ page }, use) => {
    await use(createEntityDetails(page));
  }
});

export { expect };
```

**For 89-02's candidate-mega.fixture.ts:** mirror exactly, but extend with all 12 candidate fixtures (and the option-fixture pattern for `emailBucket`'s `recipientEmail` per Pattern C). Per RESEARCH §"Plan 89-02 Files to CREATE", file lives at `tests/tests/fixtures/candidate-mega.fixture.ts` (sibling to `voter-mega.fixture.ts` and `views.ts`).

---

### Pattern C — Option-fixture (89-02 `emailBucket.recipientEmail`)

**Analog:** `tests/tests/fixtures/voter-mega.fixture.ts:42-47, 177-179`

**Option-fixture declaration + default** (lines 42-52):
```typescript
type VoterMegaFixtureOptions = {
  /** Which extreme to pick on each opinion question. Default: 'max'. */
  answerMode: AnswerMode;
  /** Optional: cap total answers (for partial-answer scenarios). Default: undefined (answer all). */
  answerCount?: number;
};

type VoterMegaFixtures = VoterMegaFixtureOptions & {
  /** A page on /results with all reachable opinion questions answered per answerMode. */
  answeredVoterPage: import('@playwright/test').Page;
};
```

**Registration with `[default, { option: true }]`** (lines 177-185):
```typescript
export const voterMegaTest = base.extend<VoterMegaFixtures>({
  answerMode: ['max', { option: true }],
  answerCount: [undefined, { option: true }],

  answeredVoterPage: async ({ page, answerMode, answerCount }, use) => {
    await walkVoterMegaJourney(page, answerMode, answerCount);
    await use(page);
  }
});
```

**Apply in 89-02:** `emailBucket` fixture takes `recipientEmail: string` as an option fixture defaulted to `'unregistered-aa@test.openvaa.local'`. Spec sets it via `test.use({ recipientEmail: '...' })` once at file top.

---

### Pattern D — emailBucket surface, wrapping `emailHelper.ts`

**Analog:** `tests/tests/utils/emailHelper.ts` (full file 187 lines)

**Existing helpers to wrap** (signatures from emailHelper.ts):
```typescript
// :45 — list emails for a recipient, newest-first
export async function fetchEmails(recipientEmail: string): Promise<Array<MailpitMessageSummary>>;

// :59 — HTML body of newest (or skip-N) email
export async function getLatestEmailHtml(
  recipientEmail: string,
  skipCount = 0
): Promise<string | undefined>;

// :82 — extract first <a href>
export function extractLinkFromHtml(html: string): string | undefined;

// :129 — transform Supabase verify link → frontend /auth/callback
export function toCallbackUrl(verifyLink: string, callbackPath = '/en/candidate/auth/callback'): string;

// :144 — count for stale-skip baseline
export async function countEmailsForRecipient(recipientEmail: string): Promise<number>;

// :178 — per-recipient queue purge
export async function clearMailboxForRecipient(recipientEmail: string): Promise<void>;
```

**Canonical polling pattern (apply inside `expectEmail`):** `candidate-registration.spec.ts:97-103`:
```typescript
const emailsBefore = await countEmailsForRecipient(candidateEmail);
// ... trigger email send ...
await expect
  .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
    message: 'Waiting for registration email',
    timeout: 15000,
    intervals: [1000, 2000, 3000]
  })
  .toBeTruthy();
```

**89-02 emailBucket surface** (TIR4:60-63 verbatim):
- `expectEmail(subject: string | RegExp): Promise<void>` — internally calls `fetchEmails` and `expect.poll` until ≥1 email with matching `Subject` arrives (timeout 15s).
- `getEmail(subject: string | RegExp, nth?: number): Promise<MailpitMessage>`.
- `getLinksInEmail(subject: string | RegExp, nth?: number): Promise<Array<string>>` — uses `cheerio.load(html)` then `$('a').toArray().map(el => $(el).attr('href'))`.

---

### Pattern E — baseV1 dataset row extensions (89-01)

**Analog:** `packages/dev-seed/src/templates/baseV1.ts`

**Opinion question row** (lines 716-726, the row to extend with hero + info content):
```typescript
{
  external_id: 'test-qu-opin-base-1-likert5',
  type: 'singleChoiceOrdinal',
  name: { en: '[qu-opin-base-1-likert5] Base opinion 1 — Likert 5.' },
  choices: LIKERT_5_EN,
  category: { external_id: 'test-qg-opin-base' },
  allow_open: true,
  required: true,
  sort_order: 100,
  is_generated: false
}
```
**For 89-01:** add `custom_data: { hero: { emoji: '🗳️' } }` and `info: { en: '[qu-opin-base-1-info] Hero info content for Likert-5 question 1.' }`. For Q2 (lines 727-737): add `custom_data: { hero: { url: '/images/test-hero-q2.svg', type: 'image' } }`. Per Hero.svelte type-discriminator (`{ emoji: string } | { url: string; type: 'image' }`).

**Required-flag flip** (lines 640-648 in `test-qu-info-text`): change `required: false → true`.

**Candidate row pattern** (lines 874-902, CA-AA-Special — the closest analog for a fixed candidate row):
```typescript
{
  external_id: 'test-ca-aa-special',
  first_name: 'Special',
  last_name: 'Candidate AA',
  terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
  sort_order: 0,
  is_generated: false,
  organization: { external_id: 'test-or-aa' },
  answersByExternalId: withInfoAnswers({ ... })
}
```
**For 89-01 (unregistered candidate):** OMIT `terms_of_use_accepted` (line 907 precedent: CA-AA-Hidden DELIBERATELY omits it), OMIT `answersByExternalId` (unregistered → no answers), add `email: 'unregistered-aa@test.openvaa.local'`. Schema verification of `email` column: see `packages/supabase-types/src/database.ts` candidates table.

**Nomination row pattern** (lines 1232-1238, OR-AA in CO-Reg-N):
```typescript
{
  external_id: 'test-nom-reg-n-or-aa',
  organization: { external_id: 'test-or-aa' },
  parent_nomination: { external_id: 'test-nom-reg-n-al-a' },
  election: { external_id: 'test-el-reg' },
  constituency: { external_id: 'test-co-reg-n' },
  election_round: 1
}
```
**For 89-01:** mirror with `candidate: { external_id: 'test-ca-aa-unregistered' }` + `election_symbol: '999'` (TIR4:90) + `parent_nomination: { external_id: 'test-nom-reg-n-or-aa' }`.

---

### Pattern F — setupFromTemplate consumer (89-03 + 89-04 setups)

**Analog:** `tests/tests/setup/baseV1.setup.ts` (29 lines, complete file) + `tests/tests/setup/perm-disable-election-1co.setup.ts` (13 lines, complete file)

**baseV1.setup.ts** (lines 16-29):
```typescript
import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import baseV1 dataset', async () => {
  // `extraTeardownPrefix: 'e2e-perm-'` defends against the race with the
  // perm-* family's final teardown ... [doc comment retained verbatim].
  await setupFromTemplate('baseV1', { extraTeardownPrefix: 'e2e-perm-' });
});
```

**perm-disable-election-1co.setup.ts** (lines 8-13 — same shape, different `extraTeardownPrefix` array):
```typescript
import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-disable-election-1co dataset', async () => {
  await setupFromTemplate('perm-disable-election-1co', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
```

**For 89-03 `candidate-mega.setup.ts`:** mirror `baseV1.setup.ts` (consumes the SAME `'baseV1'` template after 89-01 mutates it — D-89-01 explicit). EITHER reuse `baseV1.setup.ts` directly via the project graph, OR create a 1-line wrapper (RESEARCH:199 recommends the wrapper for graph clarity).

**For 89-04 perm setups:** mirror `perm-disable-election-1co.setup.ts` with new template name + new `extraTeardownPrefix` (each perm uses distinct `e2e-perm-novapp-` / `e2e-perm-nocand-` / `e2e-perm-notif-`).

---

### Pattern G — teardown (89-03 candidate-mega.teardown.ts + 89-04 perm teardowns)

**Analog (data-only):** `tests/tests/setup/baseV1.teardown.ts` (lines 19-29):
```typescript
import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

teardown('delete baseV1 dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

**For 89-04 perm teardowns:** mirror exactly with `PREFIX = 'e2e-perm-novapp-'` / `'e2e-perm-nocand-'` / `'e2e-perm-notif-'`.

**For 89-03 `candidate-mega.teardown.ts`:** mirror BUT also add an `unregisterCandidate` call BEFORE `runTeardown` (per RESEARCH R4 — the registration step creates an auth.users entry that must be wiped). The pattern lives at `tests/tests/setup/data.teardown.ts` (auth-unregister branch). Add:
```typescript
await client.unregisterCandidate('unregistered-aa@test.openvaa.local');
const { rowsDeleted } = await runTeardown(PREFIX, client);
```

---

### Pattern H — Perm template shape (89-04)

**Analog:** `packages/dev-seed/src/templates/permutations/perm-disable-election-1co.ts` (123 lines, complete file)

**Imports + prefix + settings override** (lines 17-35):
```typescript
import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  buildQuestionCategories,
  buildQuestions,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../template/types';

const P = 'e2e-perm-disable-elec-1co-';

const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  elections: {
    ...MINIMAL_BASE_APP_SETTINGS.elections,
    disallowSelection: true
  }
} as const;
```

**Full template shape** (lines 37-121 — Template object with `seed`, `externalIdPrefix`, `generateTranslationsForAllLocales`, then all collections):
```typescript
export const permDisableElection1coTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: { count: 0, fixed: [ ... bare external_id rows ... ] },
  constituency_groups: { count: 0, fixed: [ ... ] },
  constituencies: { count: 0, fixed: [ ... ] },
  organizations: { count: 0, fixed: buildOrganizations() },
  question_categories: { count: 0, fixed: buildQuestionCategories() },
  questions: { count: 0, fixed: buildQuestions(P) },
  candidates: { count: 0, fixed: [ buildCandidate(P, 1, 'A', 'ca-1-1a', 0), ... ] },
  nominations: { count: 0, fixed: [ ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a'], 1) ] },
  app_settings: { count: 0, fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }] }
};

export default permDisableElection1coTemplate;
```

**For 89-04's three perms:** mirror exactly. The ONLY differences are:
1. `P` prefix constant (`'e2e-perm-novapp-'` / `'e2e-perm-nocand-'` / `'e2e-perm-notif-'`).
2. `APP_SETTINGS` override branch:
   - `perm-disable-voter-app.ts`: `access: { ...MINIMAL_BASE_APP_SETTINGS.access, voterApp: false }`
   - `perm-disable-candidate-app.ts`: `access: { ...MINIMAL_BASE_APP_SETTINGS.access, candidateApp: false }`
   - `perm-per-app-notifications.ts`: `notifications: { voterApp: { show: true, title: {...}, content: {...} }, candidateApp: { ... } }`
3. Minimal data: 1 election + 1 CG + 1 CO + 1-2 candidates (smallest topology that lets `/` and `/candidate` routes resolve to landing pages).

**Registration:** add to `packages/dev-seed/src/templates/index.ts` `BUILT_IN_TEMPLATES` map (researcher confirms the exact registration shape during 89-04 implementation).

---

### Pattern I — Perm spec shape (89-04)

**Analog:** `tests/tests/specs/perm/perm-disable-election-1co.spec.ts` (21 lines, complete file):
```typescript
/**
 * perm-disable-election-1co — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: 2 elections share 1 CG with 1 CO; `disallowSelection: true`.
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:185-188
 *
 * Rigidity contract: every assertion HARD.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectQuestion } from '../../utils/voterIntro';

test.describe('perm-disable-election-1co', () => {
  test('disallowSelection + 1 shared CO: no election OR constituency selector', async ({ page }) => {
    await bypassIntroAndExpectQuestion(page);
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  });
});
```

**For 89-04 specs (route-availability assertions, mirroring existing 7.1.2 pattern in `candidate-settings.spec.ts:166-187`):**
```typescript
test('voterApp disabled: / + /elections show maintenance; /candidate available', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

  await page.goto('/en/elections');
  await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

  await page.goto('/en/candidate');
  await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
});
```

**For perm-per-app-notifications spec:**
```typescript
test('voter route shows voter notification only', async ({ page }) => {
  await page.goto('/en/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(/\[notif-voter\]/);
  await expect(dialog).not.toContainText(/\[notif-cand\]/);
});
test('candidate route shows candidate notification only', async ({ page }) => {
  await page.goto('/en/candidate');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(/\[notif-cand\]/);
  await expect(dialog).not.toContainText(/\[notif-voter\]/);
});
```

---

### Pattern J — Playwright project chain (89-03 + 89-04)

**Analog (mega-journey triple):** `tests/playwright.config.ts:618-643`:
```typescript
{
  name: 'data-setup-baseV1',
  testMatch: /baseV1\.setup\.ts/,
  teardown: 'data-teardown-baseV1',
  // Anchor the mega-journey chain AFTER the perm-* family finishes ...
  dependencies: ['perm-not-located-2e2cg']
},
{
  name: 'data-teardown-baseV1',
  testMatch: /baseV1\.teardown\.ts/
},
{
  name: 'voter-mega-journey',
  testDir: './tests/specs/voter',
  testMatch: /voter-mega-journey\.spec\.ts/,
  fullyParallel: false, // single-test serial journey
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-baseV1']
}
```

**Analog (perm triple):** `tests/playwright.config.ts:786-805`:
```typescript
{
  name: 'data-setup-perm-disable-election-1co',
  testMatch: /perm-disable-election-1co\.setup\.ts/,
  teardown: 'data-teardown-perm-disable-election-1co',
  dependencies: ['perm-disjoint-1co']  // sequential after previous perm
},
{
  name: 'data-teardown-perm-disable-election-1co',
  testMatch: /perm-disable-election-1co\.teardown\.ts/
},
{
  name: 'perm-disable-election-1co',
  testDir: './tests/specs/perm',
  testMatch: /perm-disable-election-1co\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-perm-disable-election-1co']
}
```

**For 89-03 candidate-mega chain:** mirror the mega-journey triple. Sequence AFTER `voter-mega-journey` via `dependencies: ['voter-mega-journey']` (shared `'test-'` prefix → must serialize). Spec project ALSO sets `use: { storageState: { cookies: [], origins: [] } }` to start unauthenticated (per RESEARCH R13 + `candidate-registration.spec.ts:22`).

**For 89-04 three perm triples:** mirror the perm triple. Chain them sequentially: each new perm depends on the previous perm's spec project name; the first new perm (`perm-disable-voter-app`) depends on `candidate-mega-journey` (RESEARCH:288 — append at the end after `candidate-mega-journey`).

---

### Pattern K — Voter-mega-journey spec shape (89-03 candidate-mega-journey.spec.ts)

**Analog:** `tests/tests/specs/voter/voter-mega-journey.spec.ts` (991 lines)

**File-scope constants + helpers** (lines 67-79, 81-124, 127-305):
- `const TIMEOUT = { element: 2_000, click: 2_000, page: 4_000, slowPage: 10_000, testMax: 120_000 } as const;`
- `const TEXT_RE = { ... } as const;`
- Module-scope helpers (NOT inside test()) for any conditional walks (`playwright/no-conditional-in-test` rule).

**Serial describe + single test + many steps** (lines 311-339, the canonical skeleton):
```typescript
test.describe('voter mega-journey', () => {
  test.describe.configure({ mode: 'serial' });

  test('full voter journey end-to-end', async ({ page, resultsPage, entityFilters, entityDetails }) => {
    test.setTimeout(TIMEOUT.testMax);

    await test.step('static: home page renders + start button (MOVED 9.1.1)', async () => {
      await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
    });

    await test.step('static: about page renders correctly (MOVED 9.9.1)', async () => {
      await page.goto(buildRoute({ route: 'About', locale: 'en' }));
      await expect(page.getByTestId(testIds.voter.about.content)).toBeVisible({ timeout: TIMEOUT.slowPage });
      await expect(page.getByTestId(testIds.voter.about.returnButton)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
    // ... N more test.step blocks
  });
});
```

**Imports** (lines 43-46): `import { expect, test } from '../../fixtures/views';` — the candidate-mega spec uses the composition root from 89-02 instead: `import { expect, test } from '../../fixtures/candidate-mega.fixture';`.

**Unauthenticated start (89-03):** `test.use({ storageState: { cookies: [], origins: [] } });` at file top (verbatim from `candidate-registration.spec.ts:22`).

**Sub-tests breakdown:** see RESEARCH §"Plan 89-03 Spec step-by-step shape" — 22 named `test.step` blocks corresponding to TIR4:108-256.

---

### Pattern L — Frontend testid attribute additions (89-01 + 89-02 + 89-03)

**Analog:** Phase 88-04 Wave 1.5 — 12 testids added in commit `ccac7691a` (per RESEARCH §"Testid Additions Catalog" + CONTEXT §"Established Patterns").

**Convention:**
1. Add the testid constant to `tests/tests/utils/testIds.ts` under `testIds.voter.*` or `testIds.candidate.*`.
2. Add `data-testid={...}` to the target component element (Svelte components forward via `restProps` where possible).
3. Land ALL testid additions per file in a single commit (per 88-04 lineage).
4. Use kebab-case for the testid value (matches existing values).

**Catalog (see RESEARCH §"Testid Additions Catalog" lines 393-420 for the authoritative list):**
- Plan 89-01: `voter-questions-hero`, `voter-questions-category-hero`, `voter-questions-info-button`.
- Plan 89-02: `terms-of-use-submit`, `candidate-questions-category-expander`, `candidate-questions-hero`, `candidate-questions-intro`, `profile-image-error`, `candidate-profile-nominations`, `candidate-profile-info-item`, `candidate-questions-completed` (where confirmed needed).

---

## Shared Patterns

### Strict assertions (every spec + every fixture)
**Source:** TIR4:8-12 + Phase 88-04 SCOPE acceptance #6 (transcribed verbatim into `entityDetails.fixture.ts:11-14`).
**Apply to:** all 89-02 fixtures, all 89-03/89-04 specs.
```typescript
// NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
// `.catch(() => null)` on assertion-bearing locator interactions.
```

### Central testid namespace
**Source:** `tests/tests/utils/testIds.ts`.
**Apply to:** every fixture method and every spec assertion.
**Convention:** `testIds.candidate.<page>.<element>` (camelCase keys → kebab-case values). Existing surface lines 12-66.

### Mandatory `[id] desc` heading format
**Source:** Phase 88-04 lineage + RESEARCH §"Established Patterns".
**Apply to:** every new dataset row label in baseV1.ts AND every new perm template question/election/notification name.
**Example:** `name: { en: '[qu-opin-base-1-likert5] Base opinion 1 — Likert 5.' }`. Note the closing period inside the locale string.

### Serial-only mega-journey
**Source:** TIR4:11 + voter-mega-journey precedent.
**Apply to:** 89-03 candidate-mega-journey spec uses `test.describe.configure({ mode: 'serial' })` + single `test()` + many `test.step()`.

### Parallel-safe perm templates via per-template externalIdPrefix
**Source:** Phase 88-03 sanctioned at `perm-disable-election-1co.ts:27` (`const P = 'e2e-perm-disable-elec-1co-'`).
**Apply to:** 89-04 perm templates use `e2e-perm-novapp-` / `e2e-perm-nocand-` / `e2e-perm-notif-`.
**Plus:** `setupFromTemplate({ extraTeardownPrefix: ['test-', 'e2e-perm-'] })` pre-clears cross-chain leftovers.

---

## No Analog Found

None — every Phase 89 file has a strong analog in the existing codebase. The phase is by-design a continuation of Phase 88 patterns (Phase 88 established the mega-journey + parallel-landing + strict-fixtures conventions; Phase 89 applies them to the candidate app).

Edge case worth flagging during planning:
- **emailBucket fixture method internals** — TIR4 surface (`expectEmail`/`getEmail`/`getLinksInEmail`) has no direct analog as a fixture (the existing pattern is utility functions in `emailHelper.ts` consumed inline in specs). Planner must compose the function-fixture shape (Pattern A) WITH the emailHelper wrapping (Pattern D).
- **`candidateLogoutButton.clickWithDialog()` vs `.clickWithoutDialog()` discrimination** — no existing fixture method does this conditional pattern. Apply Pattern A's function-fixture shape with two SEPARATE methods (NOT a single method with a boolean param) to keep the rigidity contract clean. Underlying behavior at `LogoutButton.svelte:58-64` documented in RESEARCH:386 + RESEARCH R11.

---

## Metadata

**Analog search scope:**
- `tests/tests/fixtures/` (all .ts)
- `tests/tests/setup/` (all .ts)
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` + `.README.md`
- `tests/tests/specs/perm/perm-disable-election-1co.spec.ts`
- `tests/tests/specs/candidate/candidate-registration.spec.ts`
- `tests/tests/utils/{emailHelper,testIds,supabaseAdminClient}.ts`
- `tests/playwright.config.ts`
- `packages/dev-seed/src/templates/baseV1.ts`
- `packages/dev-seed/src/templates/permutations/perm-disable-election-1co.ts`

**Files scanned:** ~15 direct reads + targeted grep across `tests/`, `packages/dev-seed/`, `apps/frontend/src/lib/` and `apps/frontend/src/routes/candidate/`.

**Pattern extraction date:** 2026-05-29
