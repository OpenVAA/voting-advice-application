# Phase 90: TIR5 permutations — missing-nominations warning + localisation negative/positive — Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 16 (3 perm templates + 1 index registration + 3 setup + 3 teardown + 3 spec + 2 fixtures + 1 fixture composition root + 1 playwright config edit + 1 testIds extension; Stage A adds: staticSettings.type + i18n/init + appContext.svelte plumbing)
**Analogs found:** 16 / 16 (100% — Phase 89-04 / 89-02 / 88-03 lineage covers every file)

## File Classification

### Plan 90-01 (Stage A: runtime supportedLocales override wiring)

| File | New/Mod | Role | Data Flow | Closest Analog | Match |
|------|---------|------|-----------|----------------|-------|
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | MOD | type (settings schema) | config | `packages/app-shared/src/settings/staticSettings.type.ts:82-95` (`supportedLocales` field) | exact (mirrors the staticSettings field, made optional in dynamic) |
| `apps/frontend/src/lib/i18n/init.ts` | MOD | i18n bootstrap | config-read + transform | (self — extend existing `const { supportedLocales } = staticSettings;` at line 11) | self-extend |
| `packages/app-shared/src/utils/mergeAppSettings.ts` (if separate file) OR appContext wiring | MOD | settings merger | merge | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:74` (`mergeAppSettings(staticSettings, dynamicSettings)`) | role-match |
| `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` | possibly MOD | context provider | request-response | self — line 22-27 already returns `locales` from `$lib/i18n` | self-extend |

### Plan 90-02 (missing-nominations permutation)

| File | New/Mod | Role | Data Flow | Closest Analog | Match |
|------|---------|------|-----------|----------------|-------|
| `packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts` | NEW | dev-seed template | config (seed) | `packages/dev-seed/src/templates/permutations/perm-2e-shared.ts` (2 elections, 1 shared CG, 1 CO) | exact — same topology minus the second election's nomination row |
| `packages/dev-seed/src/templates/index.ts` | MOD | registry | lookup | `packages/dev-seed/src/templates/index.ts:41-60` (existing `BUILT_IN_TEMPLATES` map + re-export block at 80-93) | self-extend |
| `tests/tests/setup/perm-missing-nominations.setup.ts` | NEW | setup wrapper | event-driven (Playwright project) | `tests/tests/setup/perm-disable-voter-app.setup.ts` | exact |
| `tests/tests/setup/perm-missing-nominations.teardown.ts` | NEW | teardown wrapper | event-driven (Playwright project) | `tests/tests/setup/perm-disable-voter-app.teardown.ts` | exact |
| `tests/tests/specs/perm/perm-missing-nominations.spec.ts` | NEW | E2E spec | request-response | `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` (single-test perm structure) | role-match (different surface, same scaffold) |
| `tests/playwright.config.ts` | MOD | test orchestration | config | `tests/playwright.config.ts:903-921` (variant-1 triplet) | self-extend |

### Plan 90-03 (localisation-negative perm + new fixtures)

| File | New/Mod | Role | Data Flow | Closest Analog | Match |
|------|---------|------|-----------|----------------|-------|
| `packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts` | NEW | dev-seed template | config (seed) | `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` (1e/1cg/1co + `APP_SETTINGS` override pattern) | exact (override path differs: `i18n.supportedLocales` instead of `access.voterApp`) |
| `packages/dev-seed/src/templates/permutations/shared.ts` | MOD (optional) | helper module | utility | self — extend `buildQuestions(P)` to accept the q1/q2/q3/q4 + `customData.disableMultilingual` permutation (lines 151-175) | self-extend |
| `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts` | NEW | fixture | request-response | `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts` (smallest function-fixture factory in 89-02 set) | role-match |
| `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts` | NEW | fixture | request-response | `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` (multi-method fixture with `expect*` + action methods) | role-match |
| `tests/tests/fixtures/candidate/perm-l10n.ts` (composition root) | NEW | fixture composition root | config | `tests/tests/fixtures/candidate/candidate-mega.ts:86-122` (test.extend with named fixtures + option fixture) | exact |
| `tests/tests/specs/perm/perm-localisation-negative.spec.ts` | NEW | E2E spec | request-response | `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` + login flow from `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:298-310` | role-match (composed) |
| `tests/tests/setup/perm-localisation-negative.{setup,teardown}.ts` | NEW (×2) | setup/teardown wrappers | event-driven | same as Plan 90-02 setup/teardown | exact |
| `tests/playwright.config.ts` | MOD | test orchestration | config | same triplet pattern as 89-04 | self-extend |
| `tests/tests/utils/testIds.ts` | MOD | testid catalog | config | existing structure (per RESEARCH §"Standard Stack" — namespaced `testIds.<area>.<page>.<element>`) | self-extend |
| `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` | MOD | Svelte component | request-response | self (add `data-testid="lang-selector"` to NavGroup at line 33) | self-extend |
| `apps/frontend/src/lib/components/input/Input.svelte` | MOD | Svelte component | request-response | self (add `data-testid="multilingual-toggle"` to Button at lines 653-658) | self-extend |

### Plan 90-04 (localisation-positive perm)

| File | New/Mod | Role | Data Flow | Closest Analog | Match |
|------|---------|------|-----------|----------------|-------|
| `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts` | NEW | dev-seed template | config (seed) | `perm-localisation-negative.ts` (90-03) — same shape, supportedLocales=['en','fi'] + `customData.allowOpen=true` on q3 | exact (sibling) |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | NEW | E2E spec | request-response | `perm-localisation-negative.spec.ts` (90-03) + voter-side patterns from `tests/tests/specs/voter/voter-mega-journey.spec.ts` (entity-details + locale switch) | role-match (composed) |
| `tests/tests/setup/perm-localisation-positive.{setup,teardown}.ts` | NEW (×2) | setup/teardown wrappers | event-driven | same as 90-02/90-03 | exact |
| `tests/playwright.config.ts` | MOD | test orchestration | config | same triplet pattern | self-extend |

## Pattern Assignments

### `perm-missing-nominations.ts` (Plan 90-02 — dev-seed template, CRUD seed)

**Analog:** `packages/dev-seed/src/templates/permutations/perm-2e-shared.ts` + `perm-disable-voter-app.ts`

**File header pattern** (perm-disable-voter-app.ts lines 1-19):
```ts
/**
 * perm-missing-nominations minimal-data template — Phase 90 Plan 02.
 *
 * Topology: 2 elections sharing 1 CG with 1 CO. 1 organisation, 1 candidate.
 * 1 nomination in el-1 only — el-2 has ZERO nominations. The voter selects
 * both elections and the missing-nominations modal surfaces the 'some'
 * variant with a per-election check/close icon list (el-2 = close).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:15-26.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-missnoms-'` per D-90-01
 * (distinct from the other 89-04 + 90 perm templates).
 */
```

**Imports + prefix constant** (perm-disable-voter-app.ts lines 21-31):
```ts
import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  buildQuestionCategories,
  buildQuestions,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../template/types';

const P = 'e2e-perm-missnoms-';
```

**APP_SETTINGS shape (no override needed for this perm)** (perm-2e-shared.ts pattern — verbatim MINIMAL_BASE_APP_SETTINGS):
```ts
// app_settings block omitted from spread — uses MINIMAL_BASE_APP_SETTINGS verbatim
app_settings: {
  count: 0,
  fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
}
```

**Two-election topology** (perm-2e-shared.ts lines 33-61):
```ts
elections: {
  count: 0,
  fixed: [
    {
      external_id: 'el-1',
      name: { en: '[EL1] First election' },
      short_name: { en: 'EL1' },
      election_type: 'general',
      election_date: '2026-06-15',
      sort_order: 0,
      is_generated: false,
      multiple_rounds: false,
      current_round: 1,
      constituency_groups: [{ external_id: `${P}cg-1` }]
    },
    {
      external_id: 'el-2',
      name: { en: '[EL2] Second election' },
      short_name: { en: 'EL2' },
      election_type: 'local',
      election_date: '2026-06-15',
      sort_order: 1,
      is_generated: false,
      multiple_rounds: false,
      current_round: 1,
      constituency_groups: [{ external_id: `${P}cg-1` }]
    }
  ]
}
```

**Asymmetric nomination pattern (el-1 only)** — DEVIATION from `perm-2e-shared.ts` (only inject `buildElectionConstituencyNoms(P, 'el-1', ...)` once; SKIP the second-election call):
```ts
nominations: {
  count: 0,
  fixed: [
    ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a'], 1)
    // INTENTIONAL: el-2 has zero nominations to trigger the missing-nominations modal
  ]
}
```

---

### `perm-localisation-negative.ts` (Plan 90-03 — dev-seed template, CRUD seed)

**Analog:** `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` (APP_SETTINGS override pattern)

**APP_SETTINGS with locale override** (mirror perm-disable-voter-app.ts lines 33-39 — replace `access.voterApp` path with `i18n.supportedLocales` path):
```ts
const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  // STAGE A DEPENDENCY (Plan 90-01): the i18n.supportedLocales override key
  // exists on the runtime AppSettings surface ONLY AFTER Plan 90-01 lands.
  // The shape mirrors staticSettings.supportedLocales (code/name/isDefault).
  i18n: {
    supportedLocales: [{ code: 'en', name: 'English', isDefault: true }]
  }
} as const;
```

**Custom questions block** (replace `buildQuestions(P)` with a literal `fixed[]` carrying q1..q4 + `custom_data.disableMultilingual`). Source pattern: `shared.ts:151-175` (existing buildQuestions shape, snake_case fields):
```ts
questions: {
  count: 0,
  fixed: [
    {
      external_id: 'qu-info-q1',
      type: 'text',
      name: { en: '[Q1] Tell us about yourself' },
      category: { external_id: `${P}qc-info` },
      allow_open: false,
      required: false,
      sort_order: 0,
      is_generated: false
    },
    {
      external_id: 'qu-info-q2',
      type: 'text',
      name: { en: '[Q2] Second info question' },
      category: { external_id: `${P}qc-info` },
      allow_open: false,
      required: false,
      sort_order: 1,
      is_generated: false,
      custom_data: { disableMultilingual: true }
    },
    {
      external_id: 'qu-opin-q3',
      type: 'singleChoiceOrdinal',
      name: { en: '[Q3] First opinion question' },
      choices: LIKERT_5_EN,
      category: { external_id: `${P}qc-opin` },
      allow_open: true,    // gates the OPEN-ANSWER COMMENT textarea (Pitfall 5)
      required: true,
      sort_order: 100,
      is_generated: false
    },
    {
      external_id: 'qu-opin-q4',
      type: 'singleChoiceOrdinal',
      name: { en: '[Q4] Second opinion question' },
      choices: LIKERT_5_EN,
      category: { external_id: `${P}qc-opin` },
      allow_open: true,
      required: false,
      sort_order: 101,
      is_generated: false,
      custom_data: { disableMultilingual: true }
    }
  ]
}
```

**Candidate with 4 answers** — extend `buildStandardCandidateAnswers(P)` (shared.ts:207-211) to provide 4 keys instead of 2:
```ts
candidates: {
  count: 0,
  fixed: [{
    external_id: 'ca-1-1a',
    first_name: '[CA1A]',
    last_name: 'Candidate One A',
    terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
    sort_order: 0,
    is_generated: false,
    organization: { external_id: `${P}or-1` },
    answersByExternalId: {
      [`${P}qu-info-q1`]: { value: { en: '[en-answer-q1]' } },
      [`${P}qu-info-q2`]: { value: { en: '[en-answer-q2]' } },
      [`${P}qu-opin-q3`]: { value: '3', info: { en: '[en-answer-q3]' } },
      [`${P}qu-opin-q4`]: { value: '3' }
    }
  }]
}
```

---

### `perm-localisation-positive.ts` (Plan 90-04 — dev-seed template, CRUD seed)

**Analog:** `perm-localisation-negative.ts` (sibling). Difference is the APP_SETTINGS override:
```ts
const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  i18n: {
    supportedLocales: [
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fi', name: 'Suomi' }
    ]
  }
} as const;
```

Candidate seeded answers stay English-only at template seed time — the spec authors Finnish via `multilingualTextFieldFixture.setLocaleValue('fi', '[fi-answer-q1]')`.

---

### `packages/dev-seed/src/templates/index.ts` (Plan 90-02/03/04 — registry MOD)

**Analog:** `packages/dev-seed/src/templates/index.ts:53-60` (Phase 89-04 registration block).

**Import block addition** (mirror lines 26-29):
```ts
import { permLocalisationNegativeTemplate } from './permutations/perm-localisation-negative';
import { permLocalisationPositiveTemplate } from './permutations/perm-localisation-positive';
import { permMissingNominationsTemplate } from './permutations/perm-missing-nominations';
```

**BUILT_IN_TEMPLATES extension** (mirror lines 53-59 — append after `perm-per-app-notifications` entry):
```ts
// Phase 90 Plans 02-04 — 3 TIR5 permutation templates.
// Each carries its own distinct externalIdPrefix ('e2e-perm-missnoms-',
// 'e2e-perm-l10n-neg-', 'e2e-perm-l10n-pos-') per D-90-01.
'perm-missing-nominations': permMissingNominationsTemplate,
'perm-localisation-negative': permLocalisationNegativeTemplate,
'perm-localisation-positive': permLocalisationPositiveTemplate
```

**Re-export block extension** (mirror lines 80-93):
```ts
export { permLocalisationNegativeTemplate } from './permutations/perm-localisation-negative';
export { permLocalisationPositiveTemplate } from './permutations/perm-localisation-positive';
export { permMissingNominationsTemplate } from './permutations/perm-missing-nominations';
```

---

### `perm-*.setup.ts` (Plans 90-02/03/04 — Playwright setup wrapper)

**Analog:** `tests/tests/setup/perm-disable-voter-app.setup.ts` (full file — 17 lines).

**Verbatim template** (substitute `<perm-name>` per plan):
```ts
/**
 * perm-<perm-name> data-setup project — Phase 90 Plan 0<N>.
 *
 * Invokes setupFromTemplate('perm-<perm-name>').
 * Prefix: 'e2e-perm-<short>-' per D-90-01.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from baseV1 / candidate-mega-journey / prior perm chains still
 * mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-<perm-name> dataset', async () => {
  await setupFromTemplate('perm-<perm-name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
```

---

### `perm-*.teardown.ts` (Plans 90-02/03/04 — Playwright teardown wrapper)

**Analog:** `tests/tests/setup/perm-disable-voter-app.teardown.ts` (full file — 18 lines).

**Verbatim template** (substitute prefix per plan):
```ts
/**
 * perm-<perm-name> data-teardown project — Phase 90 Plan 0<N>.
 *
 * Scoped to PREFIX='e2e-perm-<short>-' per D-90-01.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-<short>-';

teardown('delete perm-<perm-name> dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

Per-perm prefix values:
- Plan 90-02: `PREFIX = 'e2e-perm-missnoms-'`
- Plan 90-03: `PREFIX = 'e2e-perm-l10n-neg-'`
- Plan 90-04: `PREFIX = 'e2e-perm-l10n-pos-'`

---

### `perm-missing-nominations.spec.ts` (Plan 90-02 — E2E spec, request-response)

**Analog:** `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` (single `test.describe` with one `test`).

**File header + imports + skeleton** (mirror lines 1-19):
```ts
/**
 * perm-missing-nominations — Phase 90 Plan 02 (TIR5:15-26).
 *
 * Topology: 2 elections, 1 shared CG/CO, 1 candidate, 1 nomination in el-1
 * only. The voter selects both elections → the missing-nominations modal
 * surfaces the 'some' variant with el-2 marked (no nominations for this
 * election).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:15-26.
 *
 * Rigidity contract (TIR5:5-13 + Phase 88 lineage): every assertion HARD —
 * no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-missing-nominations', () => {
  test('voter selects both elections → missing-nominations modal shows el-2', async ({ page }) => {
    // ... see RESEARCH.md "Example 4" for the assertion body
  });
});
```

**Modal assertion pattern** (see `+layout.svelte:183-220` — modal carries `data-testid="voter-missing-nominations-modal"`, per-election rows render with check/close icons + `t('results.missingNominations.noNominationsForElection')` text):
```ts
const modal = page.getByTestId('voter-missing-nominations-modal');
await expect(modal).toBeVisible();
// el-1 row shows check; el-2 row shows close + no-nominations text
await expect(modal).toContainText(/\[EL1\]/);
await expect(modal).toContainText(/\[EL2\]/);
await expect(modal).toContainText(/no.*nominations.*this.*election/i);
```

---

### `langSelectorFixture.fixture.ts` (Plan 90-03 — new function-fixture)

**Analog:** `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts` (smallest 89-02 fixture — factory shape).

**Factory + types pattern**:
```ts
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * @file langSelectorFixture — Phase 90 Plan 03.
 *
 * Function-fixture for the LanguageSelection NavGroup at
 * `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte`.
 *
 * Surface (D-90-04):
 *  - expectVisible(locales)  — assert selector visible with the given locales
 *  - expectHidden()          — assert selector NOT rendered (locales.length === 1)
 *  - switchTo(locale)        — click the locale's NavItem; wait for full reload
 *
 * **Rigidity contract** (TIR5:5-13 + Phase 88 lineage): NO `expect.soft`,
 * NO try/catch around expect(), NO `.catch(() => null)`.
 */

export function createLangSelector(page: Page) {
  return {
    async expectVisible(locales: Array<string>): Promise<void> { /* see RESEARCH §"Code Example 2" */ },
    async expectHidden(): Promise<void> { /* see RESEARCH §"Code Example 2" */ },
    async switchTo(locale: string): Promise<void> { /* see RESEARCH §"Code Example 2" */ }
  };
}

export type LangSelectorFixture = ReturnType<typeof createLangSelector>;
```

The full method bodies are documented in RESEARCH.md §"Code Examples — Example 2" (lines 386-426). Critical patterns:
- `expectHidden()` asserts `page.getByTestId('lang-selector').toHaveCount(0)` — relies on the new testid added to `LanguageSelection.svelte`.
- `switchTo(locale)` uses `data-sveltekit-reload` full-reload semantics — must `Promise.all([page.waitForURL(...), item.click()])` (Pitfall 6).

---

### `multilingualTextFieldFixture.fixture.ts` (Plan 90-03 — new function-fixture)

**Analog:** `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` (multi-method fixture with `expect*` + action methods).

**Factory pattern** — scoped by Locator parameter (allows reuse across profile-info and opinion-editor surfaces):
```ts
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * @file multilingualTextFieldFixture — Phase 90 Plan 03.
 *
 * Surface (D-90-04):
 *  - expectTranslationOptions(scope, visible)  — toggle Button visible/absent
 *  - openTranslations(scope)                    — click toggle to expand
 *  - setLocaleValue(scope, locale, value)       — fill per-locale field + blur
 *  - closeTranslations(scope)                   — click toggle to collapse
 *  - expectLocaleHidden(scope, locale)          — assert per-locale field gone
 *
 * Source surface: `Input.svelte:392-450` (per-locale field rendering) +
 * `Input.svelte:646-660` (translation-options Button).
 *
 * **Rigidity contract** as per 90-03 plan.
 */

export function createMultilingualTextField(page: Page) {
  return {
    async expectTranslationOptions(scope: Locator, visible: boolean): Promise<void> { /* see RESEARCH §"Code Example 3" */ },
    async openTranslations(scope: Locator): Promise<void> { /* see RESEARCH §"Code Example 3" */ },
    async setLocaleValue(scope: Locator, locale: string, value: string): Promise<void> { /* see RESEARCH §"Code Example 3" */ },
    async closeTranslations(scope: Locator): Promise<void> { /* see RESEARCH §"Code Example 3" */ },
    async expectLocaleHidden(scope: Locator, locale: string): Promise<void> { /* see RESEARCH §"Code Example 3" */ }
  };
}

export type MultilingualTextFieldFixture = ReturnType<typeof createMultilingualTextField>;
```

Full bodies in RESEARCH.md §"Code Examples — Example 3" (lines 428-484).

---

### `perm-l10n.ts` composition root (Plan 90-03)

**Analog:** `tests/tests/fixtures/candidate/candidate-mega.ts` (lines 1-125, full file).

**Composition root pattern** (excerpt of canonical shape — mirror lines 38-91):
```ts
/**
 * @file Composition root for Phase 90 localisation-perm function-fixtures.
 *
 * Sibling to `candidate-mega.ts`. SEPARATE root recommended (researcher
 * 90-RESEARCH §Pattern 4) to avoid bloating mega's fixture surface.
 *
 * Re-exports `test` (Playwright extended) + `expect`. Specs:
 *   import { test, expect } from '../../fixtures/candidate/perm-l10n';
 *
 * Includes: candidateLoginPage, candidateProfilePage, candidateQuestionPage,
 * candidateLogoutButton, candidatePasswordSetter, emailBucket (for the
 * Inbucket registration flow — see Pitfall 3) + the two NEW fixtures
 * langSelector + multilingualTextField + the recipientEmail option fixture.
 */

import { expect, test as base } from '@playwright/test';
import { createCandidateLoginPage } from './candidateLoginPage.fixture';
// ... (mirror imports from candidate-mega.ts lines 39-49)
import { createLangSelector } from './langSelectorFixture.fixture';
import { createMultilingualTextField } from './multilingualTextFieldFixture.fixture';
import type { LangSelectorFixture } from './langSelectorFixture.fixture';
import type { MultilingualTextFieldFixture } from './multilingualTextFieldFixture.fixture';

type PermL10nFixtureOptions = {
  recipientEmail: string;
};

type PermL10nFixtures = PermL10nFixtureOptions & {
  // ... (mirror candidate-mega.ts CandidateMegaFixtures lines 72-84)
  langSelector: LangSelectorFixture;
  multilingualTextField: MultilingualTextFieldFixture;
};

export const test = base.extend<PermL10nFixtures>({
  recipientEmail: ['candidate-l10n-aa@test.openvaa.local', { option: true }],
  // ... (mirror candidate-mega.ts test.extend body lines 89-121)
  langSelector: async ({ page }, use) => {
    await use(createLangSelector(page));
  },
  multilingualTextField: async ({ page }, use) => {
    await use(createMultilingualTextField(page));
  }
});

export { expect };
```

---

### `perm-localisation-negative.spec.ts` (Plan 90-03 — E2E spec)

**Analog:** `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` (scaffold) + `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:298-310` (Inbucket login flow).

**Composed spec pattern**:
```ts
import { test, expect } from '../../fixtures/candidate/perm-l10n';
import { testIds } from '../../utils/testIds';

test.use({ recipientEmail: 'candidate-l10n-neg-aa@test.openvaa.local' });

test.describe('perm-localisation-negative', () => {
  test('locales.length=1: no lang selector, no translation toggles', async ({
    page,
    emailBucket,
    candidateLoginPage,
    candidateProfilePage,
    candidateQuestionPage,
    langSelector,
    multilingualTextField
  }) => {
    // 1. Voter root: nav menu has NO language selector
    await page.goto('/en');
    await langSelector.expectHidden();

    // 2. Candidate login via Inbucket (Pitfall 3 — auth.users absent)
    // ... emailBucket.expectEmail(...) → password-setter → login
    // Mirror candidate-mega-journey.spec.ts:298-310

    // 3. Profile page: q1 + q2 BOTH have no translation options
    await candidateProfilePage.expectQuestionsVisible([/\[Q1\]/, /\[Q2\]/]);
    const q1Scope = candidateProfilePage.getQuestion(/\[Q1\]/);
    await multilingualTextField.expectTranslationOptions(q1Scope, false);
    const q2Scope = candidateProfilePage.getQuestion(/\[Q2\]/);
    await multilingualTextField.expectTranslationOptions(q2Scope, false);

    // 4. Opinion editor: q3 + q4 comment fields have no translation options
    // (Pitfall 5 — multilingual surface is the OPEN-ANSWER COMMENT, not the
    //  Likert widget — requires customData.allowOpen=true on q3/q4)
    // ...
  });
});
```

---

### `perm-localisation-positive.spec.ts` (Plan 90-04 — E2E spec)

**Analog:** `perm-localisation-negative.spec.ts` (90-03 sibling) + voter-side patterns from `voter-mega-journey.spec.ts` (entity-details panel + locale switch).

**Voter-side fragment** (PERM-L10N-POS-07 — after candidate logout, switch to voter app):
```ts
// 7. Voter side: results page → open candidate details → assert English answers
await page.goto('/en/results');
await page.getByTestId(testIds.voter.results.candidateCard).first().click();
await expect(page.getByTestId('voter-entity-detail-info')).toContainText(/\[en-answer-q1\]/);
await expect(page.getByTestId('voter-entity-detail-opinions')).toContainText(/\[en-answer-q3\]/);
// 8. Switch to Finnish — full reload via langSelector
await langSelector.switchTo('fi');
await page.waitForURL(/^\/fi\//);
// Re-open candidate details (may need re-navigation post-reload)
await expect(page.getByTestId('voter-entity-detail-info')).toContainText(/\[fi-answer-q1\]/);
await expect(page.getByTestId('voter-entity-detail-opinions')).toContainText(/\[fi-answer-q3\]/);
```

Voter entity-details testids confirmed at `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte:133, 150, 152` (`entity-details`, `voter-entity-detail-info`, `voter-entity-detail-opinions`).

---

### `tests/playwright.config.ts` extension (Plans 90-02/03/04 — config MOD)

**Analog:** `tests/playwright.config.ts:903-921` (Variant 1 — perm-disable-voter-app triplet).

**Triplet pattern per perm** (append after the last 89-04 entry — line 961):
```ts
// Phase 90 Plan 02: perm-missing-nominations (1 test)
{
  name: 'data-setup-perm-missing-nominations',
  testMatch: /perm-missing-nominations\.setup\.ts/,
  teardown: 'data-teardown-perm-missing-nominations',
  dependencies: ['perm-per-app-notifications']  // chain after last 89-04 perm
},
{
  name: 'data-teardown-perm-missing-nominations',
  testMatch: /perm-missing-nominations\.teardown\.ts/
},
{
  name: 'perm-missing-nominations',
  testDir: './tests/specs/perm',
  testMatch: /perm-missing-nominations\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-perm-missing-nominations']
},

// Phase 90 Plan 03: perm-localisation-negative (1 test) — sequential after missing-nominations
{
  name: 'data-setup-perm-localisation-negative',
  testMatch: /perm-localisation-negative\.setup\.ts/,
  teardown: 'data-teardown-perm-localisation-negative',
  dependencies: ['perm-missing-nominations']
},
// ... teardown + spec triplet ...

// Phase 90 Plan 04: perm-localisation-positive (1 test) — sequential after l10n-negative
{
  name: 'data-setup-perm-localisation-positive',
  testMatch: /perm-localisation-positive\.setup\.ts/,
  teardown: 'data-teardown-perm-localisation-positive',
  dependencies: ['perm-localisation-negative']
},
// ... teardown + spec triplet ...
```

**Sequential dependency chain** (HIGH-2 invariant at lines 653-660 + 895-961): perm-* family is SEQUENTIAL — each new chain depends on the prior spec project. Phase 90's first chain anchors on `perm-per-app-notifications` (last 89-04 spec).

---

### Stage A (Plan 90-01) — runtime supportedLocales override wiring

**Analog 1: `packages/app-shared/src/settings/staticSettings.type.ts:82-95`** (the `supportedLocales` field shape — mirror into `DynamicSettings` as OPTIONAL):
```ts
// Add to DynamicSettings type (dynamicSettings.type.ts):
/**
 * Optional runtime override for `staticSettings.supportedLocales`. When
 * present, replaces the static array AT RUNTIME (preserves Paraglide
 * compile-time bundles). Phase 90 Plan 01 — enables locale-count-1
 * permutation testing (TIR5:28-50).
 */
readonly i18n?: {
  readonly supportedLocales?: ReadonlyArray<{
    readonly code: string;
    readonly name: string;
    readonly isDefault?: boolean;
  }>;
};
```

**Analog 2: `apps/frontend/src/lib/i18n/init.ts:11`** (current static read — extend to honour override):
```ts
// CURRENT (line 11):
const { supportedLocales } = staticSettings;

// AFTER (read override from appSettings if present):
import { appSettings } from '$lib/contexts/app/appSettings';  // or relevant accessor
const overriddenLocales = appSettings?.i18n?.supportedLocales;
const supportedLocales = overriddenLocales ?? staticSettings.supportedLocales;
```

NOTE on read path: `appContext.svelte.ts:74` merges `staticSettings + dynamicSettings` via `mergeAppSettings`. If `init.ts` runs BEFORE the appContext is initialised (SSR boot), Stage A may need to read from the same SSR-loaded source (`hooks.server.ts` + `+layout.server.ts`) — Plan 90-01 must trace this carefully.

**Analog 3: `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte:32`** (consumes `locales` from `getAppContext()` — should propagate the override automatically AFTER init.ts honours it). No change expected to this file beyond the testid addition (D-90-03 wave).

---

### Testid additions to Svelte components (Plan 90-03 — UI MOD)

**Analog:** Existing testid usage across components (e.g., `voter-missing-nominations-modal` at `+layout.svelte:190` — `data-testid` attribute on the rendered element).

**1. `LanguageSelection.svelte` line 33 — add to NavGroup**:
```svelte
<!-- BEFORE -->
<NavGroup title={t('common.language.select')}>

<!-- AFTER -->
<NavGroup title={t('common.language.select')} data-testid="lang-selector">
```
Verify `NavGroup` component forwards `data-testid` to its root element. If not, wrap in a `<div data-testid="lang-selector">`.

**2. `Input.svelte` lines 653-658 — add to translation-toggle Button**:
```svelte
<!-- BEFORE -->
<Button
  text={isTranslationsVisible ? t('components.input.hideTranslations') : t('components.input.showTranslations')}
  icon={isTranslationsVisible ? 'hide' : 'language'}
  class="!w-auto"
  onclick={handleToggleTranslations} />

<!-- AFTER -->
<Button
  data-testid="multilingual-toggle"
  text={isTranslationsVisible ? t('components.input.hideTranslations') : t('components.input.showTranslations')}
  icon={isTranslationsVisible ? 'hide' : 'language'}
  class="!w-auto"
  onclick={handleToggleTranslations} />
```
Verify `Button` forwards `data-testid` (most likely yes; if not, wrap).

---

## Shared Patterns

### Pattern: Per-perm externalIdPrefix discipline (D-90-01)
**Source:** `packages/dev-seed/src/templates/permutations/shared.ts:10-27` (header comment + `setupFromTemplate.ts:131-137` derivation logic — see RESEARCH §"Pattern 1").
**Apply to:** All 3 perm templates (90-02/03/04) — distinct prefixes:
- `'e2e-perm-missnoms-'` (90-02)
- `'e2e-perm-l10n-neg-'` (90-03)
- `'e2e-perm-l10n-pos-'` (90-04)

Row external_ids are AUTHORED BARE (`external_id: 'el-1'`); the Writer prepends the prefix. Nested refs use the FULL prefixed form (`{ external_id: '${P}or-1' }`).

### Pattern: Rigidity contract (TIR5:5-13)
**Source:** `tests/tests/fixtures/candidate/candidate-mega.ts:33-36` + `tests/tests/specs/perm/perm-disable-voter-app.spec.ts:12-14` (every fixture + spec carries the same header block).
**Apply to:** All 3 perm specs (90-02/03/04) + both new fixtures (langSelector, multilingualTextField).
```
// Standard header block:
// **Rigidity contract** (TIR5:5-13 + Phase 88 lineage):
// - NO `expect.soft`, NO try/catch wrapping `expect(...)`, NO
//   `.catch(() => null)` on assertion-bearing locator interactions.
```

### Pattern: setupFromTemplate + extraTeardownPrefix
**Source:** `tests/tests/setup/perm-disable-voter-app.setup.ts:15-17` (verbatim 3-line body).
**Apply to:** All 3 perm setup wrappers (90-02/03/04).
```ts
setup('import perm-<name> dataset', async () => {
  await setupFromTemplate('perm-<name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
```

### Pattern: runTeardown + numeric-assert (rigid contract)
**Source:** `tests/tests/setup/perm-disable-voter-app.teardown.ts:14-18`.
**Apply to:** All 3 perm teardown wrappers (90-02/03/04).
```ts
teardown('delete perm-<name> dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

### Pattern: Sequential perm-* chain dependency
**Source:** `tests/playwright.config.ts:653-660, 895-961` (HIGH-2 invariant comment + 89-04 chain).
**Apply to:** All 3 perm Playwright project entries (90-02/03/04).
- `fullyParallel: false` on every spec-project entry.
- `dependencies: ['<prior-spec-project-name>']` on every setup-project entry — Phase 90's first chain anchors on `perm-per-app-notifications`.
- Each spec depends on its own setup; each setup declares its own teardown.

### Pattern: Inbucket registration flow (when spec drives candidate login)
**Source:** `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:298-310` + `tests/tests/fixtures/candidate/candidate-mega.ts:87-91` (`recipientEmail` option fixture + `emailBucket`).
**Apply to:** Plans 90-03 + 90-04 (both localisation perms need candidate login — seeded candidates have NO `auth.users` row per `OrganizationsGenerator.ts:6`).
**Per-perm unique email**: Each perm uses a distinct `recipientEmail` to avoid Inbucket cross-perm pollution:
- 90-03: `'candidate-l10n-neg-aa@test.openvaa.local'`
- 90-04: `'candidate-l10n-pos-aa@test.openvaa.local'`

### Pattern: Function-fixture factory + Type alias
**Source:** `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts:34-115` (factory + `ReturnType<typeof create...>` type export).
**Apply to:** Both new fixtures (`langSelectorFixture`, `multilingualTextFieldFixture`).
```ts
export function create<Name>(page: Page) { return { /* methods */ }; }
export type <Name>Fixture = ReturnType<typeof create<Name>>;
```

### Pattern: `[id] desc` text convention in seed rows
**Source:** `packages/dev-seed/src/templates/permutations/shared.ts:5-9` (header comment) + every seeded `name: { en: '[<ID>] <description>' }` field.
**Apply to:** All 3 perm templates — every `name` field carries the `[<SYMBOL>] <description>` format. Specs assert via `/\[<SYMBOL>\]/i` substring, NOT on the descriptive portion. Examples used in 90-03/04: `[Q1]`, `[Q2]`, `[Q3]`, `[Q4]`, `[EL1]`, `[EL2]`, `[CA1A]`.

### Pattern: TestId catalog namespacing (D-90-06)
**Source:** `tests/tests/utils/testIds.ts:1-230` (existing namespaced `testIds.candidate.<page>.<element>` shape).
**Apply to:** Plan 90-03 testIds.ts MOD — register new testids:
- `testIds.shared.langSelector` (or `testIds.nav.langSelector`)
- `testIds.input.multilingualToggle`

(Exact namespace path follows the existing convention — executor decides at write time.)

## No Analog Found

None. Every Phase-90 deliverable has a direct codebase analog from Phase 89-04 / 89-02 / 88-03 / candidate-mega-journey. The only NOVEL surface is Stage A's runtime override mechanism (Plan 90-01), which extends — but does not replace — the existing `staticSettings` → `dynamicSettings` → `appContext` merger path (`appContext.svelte.ts:74` `mergeAppSettings`). The analog for Stage A's typing change is the `staticSettings.type.ts:82-95` `supportedLocales` field itself.

## Metadata

**Analog search scope:**
- `packages/dev-seed/src/templates/permutations/` (12 existing perm templates)
- `packages/dev-seed/src/templates/index.ts` (registry)
- `tests/tests/setup/perm-*.{setup,teardown}.ts` (all 89-04 + 88-03 setup/teardown wrappers)
- `tests/tests/specs/perm/perm-*.spec.ts` (89-04 spec scaffolds)
- `tests/tests/fixtures/candidate/` (89-02 function-fixture library)
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` (Inbucket login flow)
- `tests/playwright.config.ts` (chain orchestration)
- `apps/frontend/src/lib/i18n/init.ts` + `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` + `apps/frontend/src/lib/components/input/Input.svelte` + `QuestionInput.svelte` (locale + multilingual surfaces)
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` + `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` (context flow)
- `packages/app-shared/src/settings/staticSettings.{ts,type.ts}` + `dynamicSettings.type.ts` (settings schema)

**Files scanned:** ~25 (read directly) + ~20 referenced via grep/RESEARCH cross-check.

**Pattern extraction date:** 2026-05-29
**Source priority:** Direct codebase analogs (Phase 89-04 lineage) over RESEARCH.md sketched examples — RESEARCH §"Code Examples" 1-4 are validated as accurate against the live source files.

---

*Phase: 90-tir5-permutations-missing-nominations-warning-localisation-n*
*Pattern map authored: 2026-05-29*
