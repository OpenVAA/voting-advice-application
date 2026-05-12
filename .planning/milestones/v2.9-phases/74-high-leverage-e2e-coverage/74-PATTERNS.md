# Phase 74: High-Leverage E2E Coverage - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 19 (16 new + 3 modifications/extensions)
**Analogs found:** 19 / 19 (100% — all phase work is additive to existing test infrastructure)

## File Classification

| New/Modified File | Plan | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|------|-----------|----------------|---------------|
| `tests/tests/setup/templates/variant-low-minimum-answers.ts` | 02 | variant template | base e2e + settings-only overlay → seeded rows | `tests/tests/setup/templates/variant-multi-election.ts` | role-match (settings-only overlay; no new rows) |
| `tests/tests/setup/templates/variant-1e-Nc.ts` | 04 | variant template | base e2e + 1 election × N constituencies overlay | `tests/tests/setup/templates/variant-constituency.ts` | exact (constituency hierarchy shape) |
| `tests/tests/setup/templates/variant-Ne-Nc.ts` | 04 | variant template | base e2e + N elections × N constituencies overlay | `tests/tests/setup/templates/variant-multi-election.ts` | exact (multi-election shape; extend constituencies) |
| `tests/tests/setup/variant-low-minimum-answers.setup.ts` | 02 | variant setup driver | reads template → writes Supabase via dev-seed pipeline | `tests/tests/setup/variant-multi-election.setup.ts` | exact |
| `tests/tests/setup/variant-1e-Nc.setup.ts` | 04 | variant setup driver | reads template → writes Supabase via dev-seed pipeline | `tests/tests/setup/variant-constituency.setup.ts` | exact |
| `tests/tests/setup/variant-Ne-Nc.setup.ts` | 04 | variant setup driver | reads template → writes Supabase via dev-seed pipeline | `tests/tests/setup/variant-multi-election.setup.ts` | exact |
| `tests/playwright.config.ts` (MOD) | 02, 04 | Playwright project config | declarative project graph + dependency chain | same file (existing variant block lines 217-273) | exact (additive) |
| `tests/tests/specs/candidate/candidate-translation.spec.ts` | 01 | E2E test spec (candidate) | reads candidate-question page DOM + asserts UI contract | `tests/tests/specs/candidate/candidate-questions.spec.ts` | exact (sibling spec, same project + storageState) |
| `tests/tests/specs/voter/voter-browse-without-match.spec.ts` | 02 | E2E test spec (voter, variant project) | reads results-page DOM under low-min variant + asserts no match scores | `tests/tests/specs/voter/voter-results.spec.ts` | role-match (results-page navigation + assertions) |
| `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` | 03 | E2E test spec (voter) | feedback-modal sequence: open → modify → assert | `tests/tests/specs/voter/voter-popups.spec.ts` (VOTE-15 block, lines 75-143) | exact (feedback dialog open/close pattern) |
| `tests/tests/specs/voter/voter-navigation.spec.ts` | 03 | E2E test spec (voter) | sequence: answer → delete → re-assert CTA state | `tests/tests/specs/voter/voter-journey.spec.ts` | role-match (sequence-test pattern with module-level helpers) |
| `tests/tests/specs/variants/1e-Nc.spec.ts` | 04 | E2E test spec (variant) | reads selector pages under 1e-Nc variant + asserts | `tests/tests/specs/variants/constituency.spec.ts` | exact |
| `tests/tests/specs/variants/Ne-Nc.spec.ts` | 04 | E2E test spec (variant) | reads selector pages under Ne-Nc variant + asserts cross-bleed-free dropdown | `tests/tests/specs/variants/multi-election.spec.ts` | exact |
| `tests/tests/specs/voter/voter-detail.spec.ts` (EXT for E2E-05 + E2E-07) | 05 | E2E test spec (voter, extension) | additive `test.describe` blocks reading 4-case fixture + SubMatch DOM | itself (existing exemplar at lines 73-122 + 124+ for party detail) | exact (self-extension) |
| `tests/tests/specs/variants/multi-election.spec.ts` (EXT for E2E-04 cell 3) | 04 | E2E test spec (variant, extension) | additive matrix assertions on existing variant | itself (existing CONF-01..06 blocks) | exact (self-extension; NO modifications to CONF invariants) |
| `tests/tests/specs/variants/startfromcg.spec.ts` (EXT for E2E-04 cell 5) | 04 | E2E test spec (variant, extension) | additive matrix assertions on existing variant | itself (existing startFromConstituencyGroup blocks) | exact (self-extension) |
| `tests/tests/specs/voter/voter-locale-switching.spec.ts` | 06 | E2E test spec (voter) | navigates `/en` ↔ `/fi` URLs + widget click | `tests/tests/specs/voter/voter-static-pages.spec.ts` (lines 31-69 multi-page navigation) | role-match (locale-prefixed `buildRoute` calls; static-page-style navigation) |
| `packages/dev-seed/src/templates/e2e.ts` (EXT for E2E-05 D-07) | 05 | dev-seed template | data-source for variant pipelines (compile-time `Template` object) | itself (additive `fixed[]` entries on candidate + voter answers) | exact (self-extension) |
| `tests/tests/utils/selectorMatrix.ts` (OPTIONAL) | 04 | utility helper | shared helper for matrix assertions | `tests/tests/utils/buildRoute.ts` | role-match (utility module shape — single exported helper) |

## Pattern Assignments

### 1. `tests/tests/setup/templates/variant-low-minimum-answers.ts` (variant template, settings-only overlay)

**Analog:** `tests/tests/setup/templates/variant-multi-election.ts`
**Why this analog:** Closest minimal-overlay shape in the existing variants. `variant-constituency.ts` and `variant-startfromcg.ts` both fork the base's constituency hierarchy; `variant-multi-election.ts` is the only one with a *real* `OVERLAY` constant (popup-suppression keys). Low-minimum-answers is a settings-only overlay — narrower than multi-election, but follows the same header/imports/baseFixed scaffolding.

**Imports + base-guard pattern** (analog lines 32-37):
```typescript
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-low-minimum-answers: BUILT_IN_TEMPLATES.e2e is undefined.');
```

**OVERLAY constant pattern** (analog lines 48-60):
```typescript
const LOW_MIN_ANSWERS_APP_SETTINGS_OVERLAY = {
  // Bypass the now-default questions intro so voter lands directly on /results.
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  // E2E-02 contract: voter completes location, skips opinions, stays under minimumAnswers.
  matching: {
    minimumAnswers: 1   // verified path: dynamicSettings.matching.minimumAnswers (dynamicSettings.ts:42)
  }
} as const;
```

**baseFixed helper** (analog lines 64-77):
```typescript
type FixedRow = Record<string, unknown>;

function baseFixed(
  table: 'elections' | 'constituency_groups' | 'constituencies' | 'organizations'
    | 'question_categories' | 'questions' | 'candidates' | 'nominations'
): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}
```

**Export shape — no new rows; all tables pass-through; only `app_settings` overlay differs** (analog lines 87-93, 308-318):
```typescript
export const variantLowMinimumAnswersTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  organizations:        { count: 0, fixed: baseFixed('organizations') },
  elections:            { count: 0, fixed: baseFixed('elections') },
  constituencies:       { count: 0, fixed: baseFixed('constituencies') },
  constituency_groups:  { count: 0, fixed: baseFixed('constituency_groups') },
  question_categories:  { count: 0, fixed: baseFixed('question_categories') },
  questions:            { count: 0, fixed: baseFixed('questions') },
  candidates:           { count: 0, fixed: baseFixed('candidates') },
  nominations:          { count: 0, fixed: baseFixed('nominations') },

  app_settings: {
    count: 0,
    fixed: [{
      external_id: 'test-app-settings-low-minimum-answers',
      settings: mergeSettings(E2E_BASE_APP_SETTINGS, LOW_MIN_ANSWERS_APP_SETTINGS_OVERLAY)
    }]
  }
};

export default variantLowMinimumAnswersTemplate;
```

**Deltas from analog:**
- DO NOT add new elections / constituencies / candidates / nominations / questions / categories — this variant is settings-only.
- OVERLAY contains the `matching.minimumAnswers: 1` knob (E2E-02 specific). Keep `questions.questionsIntro.show: false` from the canonical overlay so the voter journey reaches `/results` without an intro page.
- `external_id` MUST be `test-app-settings-low-minimum-answers` (matches D-07 / planning expectations and the `'test-'` prefix runs through `runTeardown`).
- Replace every section header that says "Phase 63 E2E-02" with the Phase 74 context (E2E-02 — browse-without-match).

---

### 2. `tests/tests/setup/templates/variant-1e-Nc.ts` (variant template, 1 election × 3 constituencies)

**Analog:** `tests/tests/setup/templates/variant-constituency.ts`
**Why this analog:** Constituency template extends base with a region/municipality hierarchy under 2 elections; `variant-1e-Nc` keeps only one election but extends with N constituencies (target N = 3). The constituency-group + per-row `constituencies` declarations are the load-bearing shape.

**Imports + base-guard** (analog lines 52-57): identical to template 1; only the throw-message string differs (`'variant-1e-Nc: ...'`).

**OVERLAY constant** (analog lines 68-74):
```typescript
const ONE_E_NC_APP_SETTINGS_OVERLAY = {
  questions: { questionsIntro: { allowCategorySelection: false, show: false } }
} as const;
```

**elections — keep base 1 election, scope its `constituency_groups` link** (adapted from analog lines 120-140; drop the test-election-2 NEW row):
```typescript
elections: {
  count: 0,
  fixed: [
    ...baseFixed('elections').map((row) => ({
      ...row,
      constituency_groups: [{ external_id: 'test-cg-1e-Nc' }]
    }))
    // NO test-election-2 — 1e-Nc is single-election
  ]
},
```

**constituency_groups — 1 NEW CG containing 3 constituencies** (adapted from analog lines 145-167):
```typescript
constituency_groups: {
  count: 0,
  fixed: [
    {
      external_id: 'test-cg-1e-Nc',
      name: { en: '1e-Nc Constituencies' },
      sort_order: 10,
      is_generated: false,
      constituencies: [
        { external_id: 'test-const-1e-Nc-a' },
        { external_id: 'test-const-1e-Nc-b' },
        { external_id: 'test-const-1e-Nc-c' }
      ]
    }
  ]
},
```

**constituencies — 3 NEW (no hierarchy)** (simpler than analog's region/municipality parent-tree at lines 173-209):
```typescript
constituencies: {
  count: 0,
  fixed: [
    {
      external_id: 'test-const-1e-Nc-a',
      name: { en: '1e-Nc Constituency A' },
      sort_order: 10,
      is_generated: false
    },
    // ... B, C with sort_order 11, 12
  ]
},
```

**candidates + nominations — keep base candidates; re-nominate alpha/beta/gamma onto the 3 new constituencies on test-election-1** (analog nominations pattern lines 380-441):
```typescript
nominations: {
  count: 0,
  fixed: [
    ...baseFixed('nominations'),
    {
      external_id: 'test-nom-1e-Nc-alpha',
      candidate: { external_id: 'test-candidate-alpha' },
      election: { external_id: 'test-election-1' },
      constituency: { external_id: 'test-const-1e-Nc-a' },
      election_round: 1
    }
    // ... beta → -b, gamma → -c
  ]
},
```

**app_settings export** (analog lines 446-455):
```typescript
app_settings: {
  count: 0,
  fixed: [{
    external_id: 'test-app-settings-1e-Nc',
    settings: mergeSettings(E2E_BASE_APP_SETTINGS, ONE_E_NC_APP_SETTINGS_OVERLAY)
  }]
}
```

**Deltas from analog:**
- DROP the test-election-2 NEW row (`variant-constituency.ts` has 2 elections; `variant-1e-Nc` has only 1).
- DROP the parent-tree hierarchy (region/municipality) — the 1e-Nc constituencies are flat siblings.
- 3 NEW constituencies (target N = 3 per CONTEXT D-03).
- DROP new questions/categories — base questions suffice for the matrix-shape assertion (E2E-04 cell 2 is selector-visibility + cross-bleed, not question-content).
- `externalIdPrefix` must be 'test-' (inherits from base); all new IDs MUST start with `test-` to be torn down by `runTeardown('test-', ...)`.

---

### 3. `tests/tests/setup/templates/variant-Ne-Nc.ts` (variant template, 2 elections × 3 constituencies each)

**Analog:** `tests/tests/setup/templates/variant-multi-election.ts`
**Why this analog:** Multi-election template adds Election-2 with 1 constituency; Ne-Nc extends that to 3 constituencies-per-election (the strongest cross-bleed assertion target per CONTEXT D-05).

**OVERLAY** (analog lines 48-60) — same shape; `results.showFeedbackPopup: 0` + `results.showSurveyPopup: 0` suppression is REQUIRED for matrix assertions because the answer-flow tests will land on /results.

**elections — 2 elections each with its own CG** (analog lines 99-119):
```typescript
elections: {
  count: 0,
  fixed: [
    ...baseFixed('elections').map((row) => ({
      ...row,
      constituency_groups: [{ external_id: 'test-cg-Ne-Nc-e1' }]
    })),
    {
      external_id: 'test-election-2',
      name: { en: 'Test Election 2 (Ne×Nc)' },
      short_name: { en: 'Election 2' },
      election_type: 'general',
      election_date: '2026-06-15',
      sort_order: 1,
      is_generated: false,
      multiple_rounds: false,
      current_round: 1,
      constituency_groups: [{ external_id: 'test-cg-Ne-Nc-e2' }]
    }
  ]
},
```

**constituency_groups — 2 CGs, each with 3 constituencies** (analog lines 185-200 extended):
```typescript
constituency_groups: {
  count: 0,
  fixed: [
    ...baseFixed('constituency_groups').map((row) => ({
      ...row,
      external_id: 'test-cg-Ne-Nc-e1',
      constituencies: [
        { external_id: 'test-const-Ne-Nc-e1-a' },
        { external_id: 'test-const-Ne-Nc-e1-b' },
        { external_id: 'test-const-Ne-Nc-e1-c' }
      ]
    })),
    {
      external_id: 'test-cg-Ne-Nc-e2',
      name: { en: 'Election 2 Constituencies' },
      sort_order: 20,
      is_generated: false,
      constituencies: [
        { external_id: 'test-const-Ne-Nc-e2-a' },
        { external_id: 'test-const-Ne-Nc-e2-b' },
        { external_id: 'test-const-Ne-Nc-e2-c' }
      ]
    }
  ]
},
```

**constituencies — 6 NEW (3 per election)** + nominations distributing alpha/beta/gamma across each election's constituencies (analog lines 255-302 with 6 new triangles).

**app_settings**: `external_id: 'test-app-settings-Ne-Nc'`.

**Deltas from analog:**
- Extend test-cg-1 → test-cg-Ne-Nc-e1 with 3 constituencies instead of 1.
- Election-2 CG (test-cg-Ne-Nc-e2) has 3 constituencies instead of 1.
- 6 NEW constituencies (test-const-Ne-Nc-e1-{a,b,c} + e2-{a,b,c}) — replace the multi-election analog's 1 NEW constituency (test-constituency-e2).
- Nominations: alpha/beta/gamma each get 6 nominations (1 per constituency × 2 elections). This is the seed for the cross-bleed assertion: the constituency dropdown for Election-1 MUST show only the e1-* constituencies, not the e2-* ones.

---

### 4. `tests/tests/setup/variant-low-minimum-answers.setup.ts` (variant setup driver)

**Analog:** `tests/tests/setup/variant-multi-election.setup.ts`
**Why this analog:** All three existing variant setup files are nearly identical; multi-election is the canonical reference per CONTEXT D-02.

**Full setup body** (analog lines 1-61, verbatim shape — only the import + describe-name differ):
```typescript
import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import variantLowMinimumAnswersTemplate from './templates/variant-low-minimum-answers';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

setup('import low-minimum-answers dataset', async () => {
  const template = variantLowMinimumAnswersTemplate;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();
  await runTeardown(PREFIX, client);

  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // Post-seed assertion — verify variant app_settings persisted (subset match per
  // Pitfall 3: merge_jsonb_column is additive).
  {
    const expected = template.app_settings?.fixed?.[0]?.settings;
    expect(expected, '...').toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted).toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
```

**Deltas from analog:**
- Import `variantLowMinimumAnswersTemplate` from `./templates/variant-low-minimum-answers`.
- `setup('import low-minimum-answers dataset', ...)` — the title is descriptive; not a test-name collision risk (does not match `IMGPROXY_TIED_TITLES`).
- The `'variant template has no candidates'` sanity-check assertion still passes because base candidates pass through.

### 5. `tests/tests/setup/variant-1e-Nc.setup.ts` and 6. `tests/tests/setup/variant-Ne-Nc.setup.ts`

Both follow the same shape as setup file 4. Deltas:
- Template imports: `variant-1e-Nc` and `variant-Ne-Nc` respectively.
- Setup titles: `'import 1e-Nc dataset'` and `'import Ne-Nc dataset'`.

---

### 7. `tests/playwright.config.ts` (MODIFICATION — 3 new variant project pairs)

**Analog:** Same file, existing variant block (lines 217-273 — multi-election + results-sections + constituency + startfromcg projects).
**Why this analog:** This is a self-modification; the existing variant chain shape is the binding pattern.

**Existing chain shape** (lines 217-273):
```typescript
// Variant: multi-election (CONF-01, CONF-02, CONF-04)
{
  name: 'data-setup-multi-election',
  testMatch: /variant-multi-election\.setup\.ts/,
  teardown: 'data-teardown-variants',
  dependencies: ['candidate-app-password', 'voter-app-popups']
},
{
  name: 'variant-multi-election',
  testDir: './tests/specs/variants',
  testMatch: /multi-election\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-multi-election']
},
// ... results-sections (depends on variant-multi-election)
// ... data-setup-constituency (depends on variant-results-sections)
// ... variant-constituency
// ... data-setup-startfromcg (depends on variant-constituency)
// ... variant-startfromcg
```

**Insertion point:** AFTER the `variant-startfromcg` block (line 273) and BEFORE the opt-in specialized projects (line 275). Add 3 new variant pairs in this order: low-minimum-answers → 1e-Nc → Ne-Nc.

**Each new pair** — adapted from lines 219-231:
```typescript
// Variant: low-minimum-answers (E2E-02)
{
  name: 'data-setup-low-minimum-answers',
  testMatch: /variant-low-minimum-answers\.setup\.ts/,
  teardown: 'data-teardown-variants',
  dependencies: ['variant-startfromcg']   // SEQUENTIAL after prior variant
},
{
  name: 'variant-low-minimum-answers',
  testDir: './tests/specs/voter',         // E2E-02 spec lives under voter/, NOT variants/
  testMatch: /voter-browse-without-match\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-low-minimum-answers']
},

// Variant: 1e-Nc (E2E-04 cell 2)
{
  name: 'data-setup-1e-Nc',
  testMatch: /variant-1e-Nc\.setup\.ts/,
  teardown: 'data-teardown-variants',
  dependencies: ['variant-low-minimum-answers']   // SEQUENTIAL
},
{
  name: 'variant-1e-Nc',
  testDir: './tests/specs/variants',
  testMatch: /1e-Nc\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-1e-Nc']
},

// Variant: Ne-Nc (E2E-04 cell 4)
{
  name: 'data-setup-Ne-Nc',
  testMatch: /variant-Ne-Nc\.setup\.ts/,
  teardown: 'data-teardown-variants',
  dependencies: ['variant-1e-Nc']                  // SEQUENTIAL
},
{
  name: 'variant-Ne-Nc',
  testDir: './tests/specs/variants',
  testMatch: /Ne-Nc\.spec\.ts/,
  fullyParallel: false,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-Ne-Nc']
}
```

**Deltas from analog (CRITICAL — Pitfall 5):**
- `data-setup-low-minimum-answers.dependencies` MUST be `['variant-startfromcg']` — the PREVIOUS variant in the chain. NOT `['data-setup']` or `['candidate-app-password', 'voter-app-popups']`. Parallel setups race the Supabase DB and `runTeardown` deletes mid-write.
- `variant-low-minimum-answers.testDir` is `./tests/specs/voter` (E2E-02 spec lives under voter/, per CONTEXT D-13). The other two new variant test projects keep `./tests/specs/variants`.
- All three new spec project regexes must NOT collide with existing project regexes (`/voter-browse-without-match\.spec\.ts/`, `/1e-Nc\.spec\.ts/`, `/Ne-Nc\.spec\.ts/` are all unique).

---

### 8. `tests/tests/specs/candidate/candidate-translation.spec.ts` (E2E-01)

**Analog:** `tests/tests/specs/candidate/candidate-questions.spec.ts`
**Why this analog:** Same Playwright project (`candidate-app`), same pre-authenticated storageState, same fixtures (`candidateQuestionsPage`, `questionPage`), same `buildRoute({ route: 'CandAppQuestions', locale: 'en' })` navigation pattern.

**Imports + describe pattern** (analog lines 14-25):
```typescript
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

test.describe('candidate translation surface', { tag: ['@candidate'] }, () => {
  test.beforeEach(async ({ page, candidateQuestionsPage }) => {
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));
    await candidateQuestionsPage.expandAllCategories();
  });

  // ... tests
});
```

**Translation-surface assertion** (per RESEARCH §"Code Examples / E2E-01" + Pitfall 2 — Button NOT Tab):
```typescript
test('multilocale candidate can author translations on a non-disabled question', async ({
  page, candidateQuestionsPage, questionPage
}) => {
  await candidateQuestionsPage.navigateToQuestion(0);
  await expect(questionPage.answerInput).toBeVisible();

  // The translations toggle is a BUTTON (Input.svelte:641-647), not a tab.
  // Renders only when `multilingual && locales.length > 1`. Default supportedLocales
  // = 4 locales → button is present.
  const translationsBtn = page.getByRole('button', { name: /^Translations$/i });
  await expect(translationsBtn).toBeVisible();
  await translationsBtn.click();

  // After expansion, per-locale inputs appear; each has aria-labelledby pointing
  // to a label rendered with t(`lang.${locale}`).
  const fiInput = page.getByLabel(/Suomi/i);
  await expect(fiInput).toBeVisible();
  await fiInput.fill('Translation persistence test (fi)');

  await questionPage.saveAnswer();
  await page.reload();

  // Re-open the same question + expand translations + assert persisted value
  await candidateQuestionsPage.navigateToQuestion(0);
  await page.getByRole('button', { name: /^Translations$/i }).click();
  await expect(page.getByLabel(/Suomi/i)).toHaveValue('Translation persistence test (fi)');
});
```

**Deltas from analog:**
- Locator targets the translations Button (NOT a tab) — Pitfall 2.
- New test name `'multilocale candidate can author translations on a non-disabled question'`. **IMGPROXY guard:** verify the title does NOT end with any of the 14 bound titles at `tests/scripts/diff-playwright-reports.ts:64-78` (this title is safe — distinctive, ends with `'a non-disabled question'`).
- Single-locale absence test is DEFERRED per D-04 — do not write it.

---

### 9. `tests/tests/specs/voter/voter-browse-without-match.spec.ts` (E2E-02)

**Analog:** `tests/tests/specs/voter/voter-results.spec.ts`
**Why this analog:** Results-page assertion shape. The `voter-results.spec.ts` exemplar uses `getByTestId(testIds.voter.results.list)`, `getByTestId(testIds.voter.results.card)`, and entity-card filters — all canonical for E2E-02's "entity list renders, no match scores" contract.

**Imports + describe pattern** (analog lines 31-78):
```typescript
import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { testIds } from '../../utils/testIds';
import { buildRoute } from '../../utils/buildRoute';

// Variant runs in its own Playwright project; data is the low-minimum-answers variant.
test.describe('voter browse without match (E2E-02)', { tag: ['@voter', '@variant'] }, () => {
  // ...
});
```

**Spec body** (adapted from RESEARCH §"Code Examples / E2E-02"):
```typescript
test('voter completes location, skips opinions, browses entity list without match scores', async ({ page }) => {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  // Single election + constituency (1e×1c base) → auto-implied. Land on /questions or /intro.
  // Navigate directly to /results without answering opinion questions.
  await page.goto(buildRoute({ route: 'Results', locale: 'en' }));

  const list = page.getByTestId(testIds.voter.results.list);
  await list.waitFor({ state: 'visible' });

  // Assertion 1: entity cards still render (browse path open)
  await expect(page.getByTestId(testIds.voter.results.card).first()).toBeVisible();

  // Assertion 2: match-score badges ABSENT. In the no-match path, match.score is
  // undefined and SubMatches/score-gauges do not render. Asserting no "%" text in
  // the list is the proxy.
  await expect(list.getByText(/%/)).toHaveCount(0);

  // Assertion 3: intro/header copy is the alternative "browse" form.
  const ingress = page.getByTestId(testIds.voter.results.ingress);
  await expect(ingress).toBeVisible();
  // Translation key for browse mode is assumed `results.title.browse` per RESEARCH A1;
  // confirm at PLAN.md by reading the rendered text once the variant data setup runs.
});
```

**Deltas from analog:**
- Test runs under variant project `variant-low-minimum-answers`, NOT the base `voter-app` project. Fixtures must NOT include `answeredVoterPage` (voter has NOT answered — opposite of the standard fixture).
- Cannot reuse `voterTest.answeredVoterPage` — use raw `page` from `voterTest` or `test` and navigate manually.
- Test title MUST NOT match `IMGPROXY_TIED_TITLES` — this one ends with `'without match scores'`, safe.
- Confirm at PLAN.md: the exact translation key string for the browse-mode ingress (per RESEARCH Assumption A1).

---

### 10. `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (E2E-03)

**Analog:** `tests/tests/specs/voter/voter-popups.spec.ts` (VOTE-15 block, lines 75-143)
**Why this analog:** Feedback dialog open/close pattern is already exercised at VOTE-15. The dialog locator (`getByRole('dialog')`) + close-button (`{ name: /close|sulje|stäng|luk/i }`) + reload-and-reassert sequence is the canonical shape.

**Imports + describe pattern** (analog lines 20-32):
```typescript
import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { testIds } from '../../utils/testIds';

// Anchored to a child element to avoid Pitfall 8 (multiple dialogs match getByRole('dialog')).
// The feedback dialog contains a [data-testid="feedback-form"] element per Feedback.svelte:158.

test.describe('feedback persistence (E2E-03)', { tag: ['@voter'] }, () => {
  // ...
});
```

**Spec body** (per RESEARCH §"Code Examples / E2E-03"):
```typescript
test('feedback text persists across dismiss + resets after send', async ({ answeredVoterPage: page }) => {
  // Open feedback modal via the nav-menu feedback button
  const openFeedbackBtn = page.getByRole('button', { name: /feedback/i }).first();
  await openFeedbackBtn.click();

  // Filter dialog to the feedback form (Pitfall 8)
  const feedbackDialog = page.getByRole('dialog').filter({ has: page.getByTestId('feedback-form') });
  await expect(feedbackDialog).toBeVisible();

  // reason: textarea has aria-label tied to t('feedback.description.label'); multiple
  // locales make a stable getByLabel regex fragile. Anchor to testid per v2.8 P70 Cat A.
  const description = feedbackDialog.getByTestId('feedback-description');
  await description.fill('persistence test text');

  // Dismiss (cancel does NOT trigger reset — Feedback.svelte:132-137 reset is in onSent only)
  await feedbackDialog.getByTestId('feedback-cancel').click();
  await expect(feedbackDialog).toBeHidden();

  // Reopen — Feedback component is kept mounted (FeedbackModal bind:this); $state survives.
  await openFeedbackBtn.click();
  await expect(feedbackDialog).toBeVisible();
  await expect(description).toHaveValue('persistence test text');

  // Type new text, send — modal auto-closes after CLOSE_DELAY via onSent timeout.
  await description.fill('new text for send-reset');
  await feedbackDialog.getByTestId('feedback-submit').click();
  await expect(feedbackDialog).toBeHidden({ timeout: 5000 });

  // Reopen — reset cleared description to ''.
  await openFeedbackBtn.click();
  await expect(feedbackDialog).toBeVisible();
  await expect(description).toHaveValue('');
});
```

**Deltas from analog:**
- Uses `answeredVoterPage` fixture (the standard post-answer-loop page where the feedback button is in the nav menu).
- Dialog locator is filtered to the feedback form via `has: page.getByTestId('feedback-form')` — avoids Pitfall 8 collision with VOTE-15/VOTE-16 popup dialogs.
- Test title `'feedback text persists across dismiss + resets after send'` — distinctive, no IMGPROXY collision risk.
- VOTE-15 has `test.use({ storageState: ..., trace: 'off' })` at file level because popups mutate global settings; E2E-03 does NOT need this because it doesn't mutate settings.

---

### 11. `tests/tests/specs/voter/voter-navigation.spec.ts` (E2E-06)

**Analog:** `tests/tests/specs/voter/voter-journey.spec.ts`
**Why this analog:** Sequence-test pattern (navigate → answer → re-navigate → re-assert state). Uses module-level helpers + `test.describe.configure({ mode: 'serial' })` + shared `sharedPage` — the canonical shape for multi-step voter-flow tests.

**Module-level helper pattern** (analog lines 30-72):
```typescript
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

test.use({ trace: 'off' });   // serial spec → trace writer ENOENT avoidance

// Module-level helper (DETERM-03 no-conditional-in-test compliance — conditionals
// inside helpers are valid; only test() callback bodies are banned).
async function answerNQuestions(page: Page, n: number, answerOptionIndex = 2): Promise<void> {
  // ... navigate question by question, click answerOption.nth(answerOptionIndex),
  // wait for URL change OR explicit next-button click; loop n times.
}
```

**Test body** (per RESEARCH §"Code Examples / E2E-06"):
```typescript
test.describe('voter navigation: skip/delete/back (E2E-06)', { tag: ['@voter'] }, () => {
  test.describe.configure({ mode: 'serial' });
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => { sharedPage = await browser.newPage(); });
  test.afterAll(async () => { await sharedPage.close(); });

  test('results-CTA toggles per minimumAnswers threshold', async () => {
    // answeredVoterPage fixture has answered 16 ≥ minimumAnswers default 5; CTA enabled.
    const resultsNav = sharedPage.getByTestId('voter-nav-results');
    // ... navigate back through answers, delete via testIds.shared.questionDelete, assert CTA toggles
    // ... re-answer, assert CTA re-enabled
  });

  test('browser-back does not corrupt answer state', async () => {
    await sharedPage.goBack();
    // ... assert answer state survives nav
  });
});
```

**Deltas from analog:**
- New helpers (e.g. `deleteAnswer(page, questionIndex)`) live at module scope, NOT in test bodies — DETERM-03 enforcement.
- Use `testIds.shared.questionDelete` for the delete action; `voter-nav-results` testId for the results CTA.
- Per RESEARCH §"Code Examples / E2E-06", asserting `resultsNav.toHaveText(/browse/i)` vs `/results/i` is the toggle contract (`VoterNav.svelte:84-88` switches text via `voterCtx.resultsAvailable`).
- Test titles to avoid: anything matching `IMGPROXY_TIED_TITLES`. Suggested distinctive titles: `'results-CTA toggles per minimumAnswers threshold'`, `'browser-back preserves answer state across navigation'` — both safe.

---

### 12. `tests/tests/specs/variants/1e-Nc.spec.ts` (E2E-04 cell 2)

**Analog:** `tests/tests/specs/variants/constituency.spec.ts`
**Why this analog:** Constituency-selection-shown-because-multiple-constituencies pattern. 1e×Nc collapses Election selection (auto-implied) but SHOWS Constituency selection — exactly the constituency-spec.ts shape minus its multi-election complexity.

**Imports + helpers + describe** (analog lines 24-77):
```typescript
import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

test.use({ trace: 'off' });

// Module-level answerUntilResults helper (analog lines 47-77)
async function answerUntilResults(...): Promise<number> { /* ... */ }

test.describe('1e × Nc selector matrix (E2E-04 cell 2)', { tag: ['@variant'] }, () => {
  // ...
});
```

**Test body — matrix assertion shape** (adapted from RESEARCH §"Code Examples / E2E-04"):
```typescript
test('1e × Nc — election selection BYPASSED; constituency selector SHOWN with N options', async ({ page }) => {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  // 1. Election selection page NOT shown (1 election → auto-implied)
  await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();

  // 2. Constituency selection page SHOWN (N constituencies)
  const constSelector = page.getByTestId(testIds.voter.constituencies.selector);
  await constSelector.waitFor({ state: 'visible' });

  // 3. Dropdown shows 3 options (N = 3 per the variant template)
  const options = constSelector.getByRole('option');
  await expect(options).toHaveCount(3);

  // 4. Continuing with a selection reaches questions/results
  await options.first().click();
  await page.getByTestId(testIds.voter.constituencies.continue).click();
  // ... assertion that we navigated to /intro or /questions
});
```

**Deltas from analog:**
- Drop multi-election plumbing (no election accordion).
- Constituency selector is the focal assertion target (NOT auto-implied because N > 1).
- Test title `'1e × Nc — election selection BYPASSED; constituency selector SHOWN with N options'` — distinctive, safe.

---

### 13. `tests/tests/specs/variants/Ne-Nc.spec.ts` (E2E-04 cell 4)

**Analog:** `tests/tests/specs/variants/multi-election.spec.ts`
**Why this analog:** Election-selection pattern + accordion options. Ne-Nc extends multi-election with the cross-bleed assertion (constituency options filter to selected election only).

**Imports + helpers** (analog lines 22-96): same imports; `clickAccordionOptionByName` helper applies.

**Test body — Ne×Nc cross-bleed assertion** (per RESEARCH §"Code Examples / E2E-04" Ne×Nc exemplar):
```typescript
test('Ne × Nc — both selectors shown; constituency dropdown filters by selected election (no cross-bleed)', async ({ page }) => {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  // 1. Election selector visible (2 elections)
  await page.getByTestId(testIds.voter.elections.list).waitFor({ state: 'visible' });
  await expect(page.getByTestId(testIds.voter.elections.card)).toHaveCount(2);

  // 2. Select Election 1
  await page.getByTestId(testIds.voter.elections.card).first().click();
  await page.getByTestId(testIds.voter.elections.continue).click();

  // 3. Constituency selector visible (N=3 for E1)
  const constSelector = page.getByTestId(testIds.voter.constituencies.selector);
  await constSelector.waitFor({ state: 'visible' });
  const election1Options = await constSelector.getByRole('option').allTextContents();
  expect(election1Options).toHaveLength(3);

  // 4. Reverse: back, pick Election 2 — assert dropdown rebuilds with E2's CGs only
  await page.goBack();
  await page.getByTestId(testIds.voter.elections.card).nth(1).click();
  await page.getByTestId(testIds.voter.elections.continue).click();
  const election2Options = await constSelector.getByRole('option').allTextContents();
  expect(election2Options).toHaveLength(3);

  // 5. CROSS-BLEED NEGATIVE ASSERTION: no E1 option text appears in E2 dropdown
  for (const e1Option of election1Options) {
    expect(election2Options).not.toContain(e1Option);
  }
});
```

**Deltas from analog:**
- Cross-bleed assertion is the strongest matrix contract — additive to existing CONF-01..06 invariants in multi-election.spec.ts.
- Test title `'Ne × Nc — both selectors shown; constituency dropdown filters by selected election (no cross-bleed)'` — distinctive, safe.

---

### 14. `tests/tests/specs/voter/voter-detail.spec.ts` (EXTENSION for E2E-05 + E2E-07)

**Analog:** itself (`tests/tests/specs/voter/voter-detail.spec.ts` lines 73-122 — the existing voter-detail exemplar with `entitySelected` class + "You" label assertion).
**Why this analog:** Self-extension. The existing test "should display candidate answers correctly in info and opinions tabs" already exercises the case-(a) shape (both voter and entity answered). E2E-05 extends with 3 more cases; E2E-07 extends with SubMatch per-category assertions.

**Existing exemplar pattern** (lines 73-122 — KEEP UNCHANGED; add new `test.describe` block AFTER):
```typescript
// Pattern to copy for new test blocks: anchor the entity-card to a distinctive
// hasText, then operate inside the dialog's opinionsTab.
await page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.last_name! }).click();
const dialog = page.getByRole('dialog');
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

// Per-question-input scoping
const firstQuestionInput = opinionsTab.getByTestId('opinion-question-input').first();

// Inline-justified raw locator (analog lines 98-106)
// eslint-disable-next-line playwright/no-raw-locators
// reason: 'entitySelected' is a CSS class set by OpinionQuestionInput; no aria role
// (role lives on underlying <input type="radio">), no associated text. Inline-justified per
// RESEARCH §"Pitfall" + §"Anti-Patterns" + the candidate-questions.spec.ts:104 precedent.
await expect(firstQuestionInput.locator('.entitySelected')).toHaveCount(1);

await expect(firstQuestionInput.getByRole('radio', { checked: true })).toHaveCount(1);
await expect(firstQuestionInput.getByText('You')).toBeAttached();
```

**E2E-05 4-case extension** (per RESEARCH §"Code Examples / E2E-05" — add as new `test.describe('voter-detail answer cases (E2E-05)', ...)` block):
```typescript
test.describe('voter-detail answer cases (E2E-05)', { tag: ['@voter'] }, () => {
  test('case (a) — both answered: voter + entity rows rendered', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseA-Both' }).click();
    // ... assert .entitySelected count + getByRole('radio', {checked: true}) + 'You' label
  });
  test('case (b) — voter answered, entity missing: only voter row rendered', async (/*...*/) => { /* ... */ });
  test('case (c) — voter missing, entity answered: only entity row rendered', async (/*...*/) => { /* ... */ });
  test('case (d) — both missing: neither row rendered', async (/*...*/) => { /* ... */ });
});
```

**E2E-07 SubMatch extension** (per RESEARCH §"Code Examples / E2E-07"):
```typescript
test.describe('voter-detail per-category SubMatches (E2E-07)', { tag: ['@voter'] }, () => {
  test('per-category SubMatch grid renders 4 ScoreGauge instances', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.card).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // SubMatches.svelte:28-32 renders inline-style grid; anchor by inline style.
    // eslint-disable-next-line playwright/no-raw-locators
    // reason: SubMatches.svelte has no testId, no role, no aria-label on the grid.
    const subMatchGrid = dialog.locator('[style*="grid-template-columns"]').first();
    await expect(subMatchGrid).toBeVisible();

    // Per-category labels (ScoreGauge label = questionGroup.name)
    for (const categoryName of [
      'Test Category: Economy',
      'Test Category: Social',
      'Test Voter Category: Economy',
      'Test Voter Category: Social'
    ]) {
      await expect(subMatchGrid.getByText(categoryName)).toBeVisible();
    }
  });
});
```

**Deltas from analog:**
- Both new describe blocks are ADDITIVE — do NOT modify the existing tests at lines 33-122 (or the party-detail block at 124+).
- New tests depend on D-07 dev-seed extension: case markers `CaseA-Both`/`CaseB-VoterOnly`/`CaseC-EntityOnly`/`CaseD-Neither` (or similar) must exist in the e2e template's candidates list.
- Test titles include the `(E2E-05)` and `(E2E-07)` suffixes; verify none end with `IMGPROXY_TIED_TITLES` patterns.

---

### 15. `tests/tests/specs/variants/multi-election.spec.ts` (EXTENSION for E2E-04 cell 3)

**Analog:** itself (existing CONF-01..06 test blocks).
**Why this analog:** Self-extension. The existing tests already cover the multi-election selector flow; E2E-04 cell 3 (`Ne×1c`) adds matrix assertions ON TOP of CONF-01..06 invariants.

**Existing describe shape** (lines 41-96 — KEEP UNCHANGED; add new `test.describe('matrix cell: Ne × 1c (E2E-04 cell 3)', ...)` block):

**Additive matrix assertion** (per CONTEXT D-05):
```typescript
test.describe('matrix cell: Ne × 1c (E2E-04 cell 3)', { tag: ['@variant', '@matrix'] }, () => {
  test('Ne × 1c — election selector shown; constituency auto-implied (single)', async ({ page }) => {
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible();
    await page.getByTestId(testIds.voter.elections.card).first().click();
    await page.getByTestId(testIds.voter.elections.continue).click();
    // Single constituency → auto-implied; constituency selection page NOT shown
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.constituencies.selector)).toBeHidden();
  });
});
```

**Deltas from analog:**
- ADDITIVE only — do NOT modify the existing CONF-01..06 blocks (CONTEXT D-05).
- Test title `'Ne × 1c — election selector shown; constituency auto-implied (single)'` — distinctive, safe.

---

### 16. `tests/tests/specs/variants/startfromcg.spec.ts` (EXTENSION for E2E-04 cell 5)

**Analog:** itself (existing `startFromConstituencyGroup` test blocks).
**Why this analog:** Self-extension. The existing tests cover the reversed-flow shape; E2E-04 cell 5 adds the matrix-aligned URL state + selector visibility assertion.

**Additive matrix assertion** (analogous to entry 15):
```typescript
test.describe('matrix cell: startFromConstituency (E2E-04 cell 5)', { tag: ['@variant', '@matrix'] }, () => {
  test('startFromConstituency — constituency selector shown first; election auto-bound by selection', async ({ page }) => {
    // ... reversed flow: pick constituency → election is bound by the CG-to-election relationship
  });
});
```

**Deltas from analog:**
- ADDITIVE only.
- Test title distinctive; no IMGPROXY collision.

---

### 17. `tests/tests/specs/voter/voter-locale-switching.spec.ts` (E2E-08)

**Analog:** `tests/tests/specs/voter/voter-static-pages.spec.ts`
**Why this analog:** Static-pages spec uses `buildRoute({ route, locale })` for multi-locale-targeted navigation (lines 33-69). The route-prefixed pattern + `getByRole('heading')` + per-page testId assertions are the canonical shape for locale-route navigation.

**Imports + describe + storageState pattern** (analog lines 19-30):
```typescript
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

// Ensure unauthenticated voter context
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('voter locale switching (E2E-08)', { tag: ['@voter'] }, () => {
  // ...
});
```

**Spec body** (per RESEARCH §"Code Examples / E2E-08"):
```typescript
test('locale switches via route prefix', async ({ page }) => {
  // 1. Visit home in en (default locale — NO URL prefix; routes do NOT use [[lang=locale]] dir)
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();

  // 2. Visit /fi directly (route-prefixed form, asserted by SC #8)
  await page.goto('/fi');
  // Finnish translation of the start button (or similar high-signal en-only string)
  await expect(page.getByRole('button', { name: /Aloita/i })).toBeVisible();
});

test('locale switches via LanguageSelection widget (when present)', async ({ page }) => {
  await page.goto('/fi');
  await expect(page.getByRole('button', { name: /Aloita/i })).toBeVisible();

  // The widget renders only when locales.length > 1 (LanguageSelection.svelte:25);
  // default supportedLocales = 4 → present. Open nav menu, click English entry.
  // reason: nav menu button has aria-label tied to t('common.menu.open'); regex tolerates locales.
  await page.getByRole('button', { name: /open menu|toggle menu/i }).click();
  await page.getByRole('link', { name: /^English$/ }).click();

  // After click, LanguageSelection.svelte:30 forces full reload via data-sveltekit-reload.
  // URL prefix is dropped (en is default).
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();
});
```

**Deltas from analog:**
- Direct URL navigation (NOT `buildRoute(...)` for the locale-prefixed forms) — Paraglide handles `/fi/` prefix dynamically; `buildRoute` always emits the `en` (no-prefix) form for default locale.
- Per RESEARCH Pitfall 3: routes do NOT use `[[lang=locale]]` dir; locale is prefix-only via Paraglide runtime. Do NOT write `/en/results` — write `/results` (default) or `/fi/results`.
- Widget-click assertion is conditional on widget presence (per VALIDATION "Manual-Only Verifications" — present iff `locales.length > 1`); current default = 4 locales so it IS present, but the test docstring notes the gate.
- Test titles `'locale switches via route prefix'` + `'locale switches via LanguageSelection widget (when present)'` — distinctive, safe.

---

### 18. `packages/dev-seed/src/templates/e2e.ts` (EXTENSION for E2E-05 D-07)

**Analog:** itself (existing candidates `fixed[]` entries at lines 230+).
**Why this analog:** Self-extension. The dev-seed template is the canonical source of voter + candidate answer fixtures; D-07 extends the `candidates.fixed[]` (and/or voter answer dataset) with 4 marker pairs.

**Existing candidate shape** (paraphrased from grep output at e2e.ts):
```typescript
{
  external_id: 'test-candidate-alpha',
  // ...
  answersByExternalId: {
    'test-question-1': { value: '4', info: { en: '...' } },
    // ...
  }
}
```

**E2E-05 4-case extension shape** — add 4 entities with comment markers per RESEARCH §"Specific Ideas" E2E-05 marker convention:
```typescript
// E2E-05/case-(a): both answered
{
  external_id: 'test-candidate-CaseA-Both',
  first_name: 'CaseA',
  last_name: 'Both',
  // ... required fields
  answersByExternalId: {
    'test-question-1': { value: '4' }   // entity answered; voter will answer too via voter-fixture
  }
},
// E2E-05/case-(b): voter answered, entity missing
{
  external_id: 'test-candidate-CaseB-VoterOnly',
  // ... NO answersByExternalId entry for the marker question
},
// E2E-05/case-(c): voter missing, entity answered
{
  external_id: 'test-candidate-CaseC-EntityOnly',
  answersByExternalId: { 'test-voter-q-1': { value: '5' } }   // entity answered a question voter won't answer
},
// E2E-05/case-(d): both missing
{
  external_id: 'test-candidate-CaseD-Neither',
  // ... no relevant answers
}
```

**Deltas from analog:**
- 4 NEW candidates (or 4 new answer-cells if the voter-dataset is the cleaner extension target — planner's call per CONTEXT D-07).
- Each entity's external_id MUST start with `test-` (teardown filter).
- Re-run `yarn build` for `@openvaa/dev-seed` AFTER edit (CONTEXT D-07: "Re-runs `yarn build` for `@openvaa/dev-seed`").
- Optional: add a `58-E2E-AUDIT.md`-style addendum documenting the 4 case markers per CONTEXT Claude's Discretion.

---

### 19. `tests/tests/utils/selectorMatrix.ts` (OPTIONAL, Plan 04)

**Analog:** `tests/tests/utils/buildRoute.ts`
**Why this analog:** Single utility module exporting a focused helper. `buildRoute.ts` is the canonical shape — small file, 1-2 functions, no test-framework imports beyond types.

**Analog shape** (whole file, 20 lines):
```typescript
// Use direct import to avoid loading other modules which depend on `$app/...`
import { ROUTE } from '../../../apps/frontend/src/lib/utils/route/route';
import type { Route } from '../../../apps/frontend/src/lib/utils/route/route';

export function buildRoute({ route, locale }: { route: Route; locale: string }): string {
  // ...
}
```

**Proposed `selectorMatrix.ts` shape** (per RESEARCH §"Specific Ideas" E2E-04 matrix helper):
```typescript
import { expect, type Page } from '@playwright/test';
import { testIds } from './testIds';

interface SelectorCellExpectation {
  page: Page;
  expectElectionVisible: boolean;
  expectConstituencyVisible: boolean;
  expectConstituencyOptionCount?: number;   // optional; undefined skips this assertion
  expectURLContains?: RegExp;
}

export async function assertSelectorCell({
  page,
  expectElectionVisible,
  expectConstituencyVisible,
  expectConstituencyOptionCount,
  expectURLContains
}: SelectorCellExpectation): Promise<void> {
  if (expectElectionVisible) {
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible();
  } else {
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
  }
  if (expectConstituencyVisible) {
    const sel = page.getByTestId(testIds.voter.constituencies.selector);
    await sel.waitFor({ state: 'visible' });
    if (expectConstituencyOptionCount !== undefined) {
      await expect(sel.getByRole('option')).toHaveCount(expectConstituencyOptionCount);
    }
  } else {
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  }
  if (expectURLContains) {
    await expect(page).toHaveURL(expectURLContains);
  }
}
```

**Deltas from analog:**
- Imports Playwright types (`expect`, `Page`) — analog has none.
- Function exports a Playwright-aware assertion helper, NOT a pure URL builder.
- Per CONTEXT D-05 Claude's Discretion — planner may instead inline per-cell assertion blocks; selectorMatrix.ts is OPTIONAL.

---

## Shared Patterns

### Cross-cutting: Variant template scaffolding
**Source:** `tests/tests/setup/templates/variant-multi-election.ts:32-77`
**Apply to:** Templates 1, 2, 3 (variant-low-minimum-answers, variant-1e-Nc, variant-Ne-Nc)
```typescript
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-<name>: BUILT_IN_TEMPLATES.e2e is undefined.');

const <NAME>_APP_SETTINGS_OVERLAY = { /* keys */ } as const;

type FixedRow = Record<string, unknown>;
function baseFixed(table: /* ... */): Array<FixedRow> { /* ... */ }
```

### Cross-cutting: Variant setup pipeline + post-seed assertion
**Source:** `tests/tests/setup/variant-multi-election.setup.ts:29-61`
**Apply to:** Setup files 4, 5, 6
- Imports from `@openvaa/dev-seed`: `BUILT_IN_OVERRIDES`, `fanOutLocales`, `runPipeline`, `runTeardown`, `Writer`.
- Imports from `@playwright/test`: `expect`, `test as setup`.
- 6-step pipeline: get template → derive overrides/seed/prefix → `new SupabaseAdminClient()` → `runTeardown('test-', client)` → `runPipeline + fanOutLocales + writer.write` → `expect(client.getAppSettings()).toMatchObject(template.app_settings.fixed[0].settings)` + sanity-check candidates count > 0.

### Cross-cutting: Playwright project sequential dependency chain
**Source:** `tests/playwright.config.ts:217-273` (existing variant block)
**Apply to:** Plans 02 + 04 modifications to playwright.config.ts
- Each new `data-setup-<name>` project lists the PREVIOUS variant's SPEC project (not the base `data-setup`) — Pitfall 5.
- Each new spec project (`variant-<name>`) lists ONLY its own setup as dependency.
- All new setup projects share `teardown: 'data-teardown-variants'`.
- `fullyParallel: false` on spec projects.

### Cross-cutting: Role/aria locator preference + inline `// reason:` justification
**Source:** `tests/tests/specs/voter/voter-detail.spec.ts:98-106` (canonical exemplar)
**Apply to:** All new spec files (entries 8-17)
```typescript
// reason: <specific reason — CSS class is the contract, no aria equivalent, etc.>
// eslint-disable-next-line playwright/no-raw-locators
await expect(elem.locator('.entitySelected')).toHaveCount(1);
```
- Default: `getByRole({ name: t('...') })`, `getByLabel(...)`, `getByText(...)`.
- `getByTestId(...)` is allowed BUT requires inline `// reason:` per CONTEXT D-11.
- Raw `page.locator('.css-class')` requires BOTH `// reason:` AND `// eslint-disable-next-line playwright/no-raw-locators` (per Phase 73 DETERM-03 lint at `'error'`).

### Cross-cutting: Module-level helper hoisting (DETERM-03 compliance)
**Source:** `tests/tests/specs/voter/voter-journey.spec.ts:42-72` and `tests/tests/specs/variants/multi-election.spec.ts:73-96`
**Apply to:** Spec files 9, 10, 11, 12, 13 (entries with sequence/branching logic)
- Conditional `if`/`try-catch` logic MUST live in module-level helpers, NOT in `test()` callback bodies.
- Helpers return values or void; the test body issues unconditional `await` calls.
- Lint rule `playwright/no-conditional-in-test` at `'error'` (post-Phase 73).

### Cross-cutting: IMGPROXY_TIED_TITLES collision avoidance
**Source:** `tests/scripts/diff-playwright-reports.ts:64-80` (the 14 bound titles list)
**Apply to:** All new spec test() names + describe() names (entries 8-17)
- The 14 bound titles per `regen-constants.mjs:55-70`:
  1. `should upload a profile image (CAND-03)`
  2. `should show editable info fields on profile page (CAND-03)`
  3. `should persist profile image after page reload (CAND-12)`
  4. `should show read-only warning when answers are locked`
  5. `should show maintenance page when candidateApp is disabled`
  6. `should show maintenance page when underMaintenance is true`
  7. `should display notification popup when enabled`
  8. `should render help page correctly`
  9. `should render privacy page correctly`
  10. `should hide hero when hideHero is enabled`
  11. `should show hero when hideHero is disabled`
  12. `should change password and login with new password`
  13. `should logout and return to login page`
  14. `re-authenticate as candidate`
- Test ID match: `id.endsWith('> ' + title)`. New tests MUST NOT end with any of these 14 strings.
- All proposed test titles in this PATTERNS.md document are checked: none match.

### Cross-cutting: Race-tolerant assertion (`expect.poll` + `waitFor`)
**Source:** v2.6 P64 D-11 + `tests/tests/specs/voter/voter-results.spec.ts` precedents
**Apply to:** Spec files 9, 12, 13 (where DOM state lags behind navigation)
```typescript
// Eventual-presence (count-based)
await expect.poll(async () => element.count(), { timeout: 5000 }).toBeGreaterThan(0);

// Single-anchor visibility (preferred over networkidle)
await element.waitFor({ state: 'visible', timeout: 10000 });
```
- NO `waitForLoadState('networkidle')` — banned by lint at `'error'`.
- NO `waitFor` on already-visible anchors (Pitfall 7 negative-control timing — false-positive).

### Cross-cutting: Dialog locator anti-collision (Pitfall 8)
**Source:** `tests/tests/specs/voter/voter-popups.spec.ts:103-109` + `voter-detail.spec.ts:42-43`
**Apply to:** Spec file 10 (E2E-03 feedback dialog)
```typescript
// Anchor to distinguishing child element
const feedbackDialog = page.getByRole('dialog').filter({ has: page.getByTestId('feedback-form') });
```
- Multiple components render `<dialog role="dialog">` — feedback modal, popup modal, entity-details drawer. Always filter by a distinguishing testId or text.

## No Analog Found

None. All 19 work items have a clear analog in the existing codebase:
- 16 entries have an existing file as analog (variant templates, setup files, spec patterns).
- 3 entries (entries 14, 15, 16, 18) are self-extensions where the analog is the file being extended.

## Metadata

**Analog search scope:**
- `tests/tests/setup/templates/` (3 existing variant templates analyzed)
- `tests/tests/setup/` (2 setup files analyzed)
- `tests/tests/specs/candidate/` (1 file analyzed — candidate-questions)
- `tests/tests/specs/voter/` (5 files analyzed — voter-results, voter-popups, voter-journey, voter-static-pages, voter-detail)
- `tests/tests/specs/variants/` (2 files analyzed — constituency, multi-election)
- `tests/tests/utils/` (2 files analyzed — buildRoute, testIds)
- `tests/playwright.config.ts` (existing variant block)
- `packages/dev-seed/src/templates/e2e.ts` (existing dev-seed template)
- `tests/scripts/diff-playwright-reports.ts` (IMGPROXY_TIED_TITLES list)

**Files scanned:** ~14 source files + 3 planning docs (CONTEXT, RESEARCH, VALIDATION).

**Pattern extraction date:** 2026-05-11

**Confidence:** HIGH for all 19 entries. The phase is content-authoring against a deterministic baseline; every new file has a structurally identical analog in the existing codebase.

**IMGPROXY collision audit:** All proposed test titles in this document are confirmed to NOT end with any of the 14 `IMGPROXY_TIED_TITLES` patterns at `regen-constants.mjs:55-70` / `diff-playwright-reports.ts:64-78`. Per-plan PR verification MUST repeat this check on the final test titles (titles may evolve at PLAN.md time).

**Project conventions applied:**
- CLAUDE.md "Context Destructuring Rule (Svelte 5)" — NOT relevant to this PATTERNS.md (no spec destructures Svelte context; spec extensions to voter-detail use `getByTestId` + dialog locators, not Svelte runes).
- CLAUDE.md "Development Commands" — `yarn build` for `@openvaa/dev-seed` is required after entry 18 modification.
- CLAUDE.md "Path aliases" — not relevant (test specs use relative imports from `../../fixtures` + `../../utils`).
- Project skills (`.claude/skills/`) — no test-authoring skill exists; no skill rules apply.
