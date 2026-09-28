# Phase 92: E2E test infrastructure hardening - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 11 (3 new, 8 modified)
**Analogs found:** 11 / 11 (every workstream has an in-tree reference)

> All analogs verified against the live tree on this date. The codebase is mid-refactor (uncommitted `git status` changes converting `pages/voter/*` page-objects → function-fixtures), so re-grep exact line numbers at plan time — the *shapes* below are stable.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tsconfig.json` (NEW) | config | transform (tsc) | `packages/core/tsconfig.json` | role-match (test-scoped override) |
| `tests/tests/helpers/timeouts.ts` (NEW) | config/util | transform (constants) | `tests/tests/utils/voterIntro.ts:44` local `TIMEOUT` | exact (shape donor) |
| `tests/tests/helpers/index.ts` (MOD) | barrel | re-export | (self — extend existing barrel) | exact |
| voter page fixtures (NEW): home, intro, questions, results, entity-detail | test fixture | request-response (nav+assert) | `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts:75-89` | exact (reference impl) |
| `tests/tests/fixtures/views.ts` / `resultsPage.fixture.ts` / `entityDetails.fixture.ts` (MOD) | test fixture | request-response | `candidateQuestionsOverviewPage.fixture.ts:75-89` | exact |
| `tests/eslint.config.mjs` (MOD) | config | static lint | (self — rule swap) | exact |
| `tests/tests/setup/setupFromTemplate.ts` (MOD) | test setup | CRUD probe (DB read) | (self — `probeFreshDatabasePrecondition`) | exact |
| `tests/tests/setup/data.setup.ts` (MOD) | test setup | CRUD probe (DB read) | (mirror of `setupFromTemplate.ts`) | exact |
| `tests/tests/utils/testIds.ts` (MOD) | catalog | data | (self — extend `voter.home`/`voter.intro`) | exact |
| root `package.json` (MOD) | config | script | (self — add `typecheck:tests`) | role-match |
| WS4 annotation sites (MOD): 2 markdown + `tests/scripts/diff-playwright-reports.ts` | docs/annotation | n/a | CLAUDE.md `// reason:` convention | n/a |

---

## Pattern Assignments

### `tests/tsconfig.json` (NEW — config, transform)

**Analog:** `packages/core/tsconfig.json` (canonical package paradigm — extends the shared base via the package alias).

**Canonical `extends` form** (every workspace tsconfig uses the package alias, NOT a relative path):
```jsonc
// packages/core/tsconfig.json (VERIFIED)
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",   // ← resolves to packages/shared-config/tsconfig.base.json via the "./ts" export
  "compilerOptions": { ... },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"]
}
```

> **DISCREPANCY to resolve at plan time:** RESEARCH.md:146 proposes `"extends": "../packages/shared-config/tsconfig.base.json"` (relative path). The repo convention (VERIFIED across `packages/*/tsconfig.json`) is the package alias `"@openvaa/shared-config/ts"` (the `package.json` `exports["./ts"] → "./tsconfig.base.json"`, VERIFIED). **`tests/` is not a yarn workspace**, so the alias may not resolve from `tests/` without a node_modules symlink — the planner must verify which form resolves. If the alias fails from the non-workspace `tests/` dir, fall back to the relative path (research's form). Prefer the alias if it resolves, to stay consistent with the canonical paradigm.

**What the base provides** (`packages/shared-config/tsconfig.base.json`, VERIFIED — these are the values the test config must OVERRIDE):
```jsonc
{
  "compilerOptions": {
    "allowJs": true, "checkJs": true,
    "composite": true,          // ← override to false (pure --noEmit, no project-refs)
    "declarationMap": true,     // ← override to false
    "esModuleInterop": true,
    "lib": ["es2022"],          // ← override: add "DOM","DOM.Iterable" (page.evaluate browser globals)
    "module": "ESNext", "moduleResolution": "Bundler",
    "resolveJsonModule": true, "skipLibCheck": true,
    "strict": true, "target": "es2020"
  }
}
```

**Recommended override block** (from RESEARCH.md:143-166 — base has no DOM, sets composite/declarationMap which must be neutralized for `--noEmit`):
```jsonc
{
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "noEmit": true,
    "composite": false,
    "declarationMap": false,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext", "moduleResolution": "Bundler", "target": "ES2022",
    "types": ["node"], "skipLibCheck": true
  },
  "include": ["tests/**/*.ts", "*.ts"],
  "exclude": ["playwright-results/**", "playwright-results-cell4/**", "playwright-report/**", "node_modules/**", "playwright/**"]
}
```

**Backlog to fix (5 real errors, from RESEARCH.md:129-137):** `e2eFixtureRefs.ts:80,120,127` (TS2352 casts missing `external_id`/`type` — cast via `unknown` first), `candidate-bank-auth.spec.ts:94` (TS2694 — `jose.KeyLike` removed in jose v6; replace with `CryptoKey`). The `translations.type.ts:28` TS2304 is a cross-package leak that proper `include` scoping should drop.

---

### `tests/tests/helpers/timeouts.ts` (NEW — config/util, transform constants)

**Analog:** `tests/tests/utils/voterIntro.ts:44-49` — the local `TIMEOUT` object whose shape + JSDoc the new central file should adopt.

**Shape donor** (VERIFIED at `voterIntro.ts:44-49`, with the documenting JSDoc the central file should generalize):
```ts
/**
 * - element:  per-element visibility/enabled budget.
 * - click:    action-ack budget (click registered, dropdown opened).
 * - page:     URL-change / route-transition wait.
 * - slowPage: multi-network-roundtrip + render boundary (cold-start friendly).
 */
const TIMEOUT = {
  element: 2_000,
  click: 2_000,
  page: 4_000,
  slowPage: 10_000
} as const;
```

**Canonical bucket union + value-conflict resolution** (RESEARCH.md:382-401 — take the max to avoid tightening any budget):
```ts
export const TIMEOUTS = {
  element: 2_000,   // consistent across all 4 sources
  click: 2_000,     // consistent
  page: 5_000,      // max of {4_000, 5_000}
  slowPage: 10_000, // common value; 15_000 / 7_500 are inline exceptions
  testMax: 90_000   // matches playwright.config global ceiling — do NOT exceed as a default
} as const;
```

**Inline exceptions that DO NOT migrate** (stay at the call site with `// reason:` per D-12 / CLAUDE.md convention): `perm-localisation-positive.spec.ts` `slowPage:15_000` + `testMax:180_000`; `voter-mega-journey.spec.ts` `testMax:120_000`; `emailBucket.fixture.ts` `POLL_TIMEOUT=15_000`. Values > the playwright.config `timeout:90000` only take effect via `test.setTimeout(...)` (Pitfall 3).

---

### `tests/tests/helpers/index.ts` (MOD — barrel, re-export)

**Analog:** self — the existing barrel. Append the new module following the established `export { X } from './module'` style.

**Current barrel** (VERIFIED — `helpers/` = "thin generic Playwright wrappers with NO domain knowledge"; a timeout-constants module fits per D-11's explicit placement):
```ts
export { assertDbRowCount } from './db-precondition.helper';
export { clickAndRaceSettle, expectLandedOn } from './navigation.helper';
export { iterateSelectOptions } from './select.helper';
export { gotoAndSettle, settleNetworkIdle } from './settle.helper';
export { walkVoterIteration } from './voter-iteration.helper';
// ADD:
export { TIMEOUTS } from './timeouts';
```

---

### Voter page fixtures (NEW — test fixture, request-response): home, intro, questions, results, entity-detail

**Analog (THE reference implementation):** `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts:49-89`.

**Composition-root + function-fixture shape** (VERIFIED `candidateQuestionsOverviewPage.fixture.ts:40-89`) — copy this structure exactly:
```ts
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export function createCandidateQuestionsOverviewPage(page: Page) {
  // ... private helpers ...

  /**
   * Expect the page to be visible.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    const pageLocator = page.getByTestId(testIds.candidate.questions.intro);
    await expect(pageLocator).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Go to the overview page via its canonical URL and await to be visible.
     */
    async goToPage(): Promise<void> {
      await page.goto('/en/candidate/questions');   // ← GAP: hardcoded URL, no locale param (see D-08 below)
      await expectPageVisible();
    },
    expectPageVisible,
    // ... other surface methods ...
  };
}

export type CandidateQuestionsOverviewPageFixture = ReturnType<typeof createCandidateQuestionsOverviewPage>;
```

**D-08 locale gap + the fix (use `buildRoute`):** the reference HARDCODES `/en/candidate/questions` and takes no `locale?`. Replace with the locale-aware builder.

**`buildRoute` util** (VERIFIED `tests/tests/utils/buildRoute.ts` — strips `(route-group)` segments and substitutes `[[lang=locale]]`; returns NO leading slash):
```ts
import { ROUTE } from '../../../apps/frontend/src/lib/utils/route/route';
import type { Route } from '../../../apps/frontend/src/lib/utils/route/route';

export function buildRoute({ route, locale }: { route: Route; locale: string }): string {
  const parts = ROUTE[route].split('/');
  return parts
    .map((p) => {
      if (p === '[[lang=locale]]') return locale;
      if (p.startsWith('(')) return undefined;   // route group → dropped
      return p;
    })
    .filter((p) => p !== undefined)
    .join('/');
}
```

**Target `goToPage(locale?)` shape** (RESEARCH.md:529-551 — adapted reference; `default='en'` matches current call sites; prepend the `/` buildRoute omits):
```ts
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

export function createVoterQuestionsPage(page: Page) {
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.questions.heading))
      .toBeVisible({ visible, timeout: 5_000 });
  }
  return {
    async goToPage(locale = 'en'): Promise<void> {
      await page.goto('/' + buildRoute({ route: 'Questions', locale }));
      await expectPageVisible(true);
    },
    expectPageVisible
  };
}
```

**Per-fixture `expectPageVisible` load anchors** (VERIFIED in `testIds.ts:125-203`):

| New fixture | `ROUTE` key | Load-anchor testId | Catalog status |
|-------------|-------------|--------------------|----------------|
| voterHomePage | `Home` | only `voter.home.startButton`='voter-home-start' | **GAP — extend catalog** with a page-root anchor |
| voterIntroPage | `Intro` | only `voter.intro.startButton`='voter-intro-start' | **GAP — action, not content;** extend or document reuse |
| voterQuestionsPage | `Questions` | `voter.questions.heading`='voter-questions-heading' | ✅ exists |
| voterResultsPage | `Results` | `voter.results.list`='voter-results-list' | ✅ exists — **extend existing `resultsPage.fixture.ts` (`createResultsPage`), do NOT fork** |
| voterEntityDetailPage | `ResultEntity` | `voter.entityDetail.container`='voter-entity-detail' | ✅ exists — extend existing `entityDetails.fixture.ts` |

> `resultsPage.fixture.ts` (`createResultsPage`) and `entityDetails.fixture.ts` already exist (composed in `views.ts`) but lack `goToPage`/`expectPageVisible` — ADD the pair to them rather than create parallel fixtures.

**Composition roots** (where new fixtures register — function-fixture `base.extend<...>({ name: async ({page}, use) => use(createXxx(page)) })`): `tests/tests/fixtures/candidate/candidate-mega.ts` (11 candidate fixtures), `tests/tests/fixtures/voter-mega.fixture.ts` (voter journey), `tests/tests/fixtures/views.ts` (resultsPage/entityFilters/entityDetails). Specs import the composition root directly; no per-fixture barrel.

**Callback/deep-link gotos that DO NOT migrate** (Pitfall 4): `registrationCallbackUrl`, `resetCallbackUrl`, `deferredTarget` in `perm-not-located-2e2cg.spec.ts` + `candidate-mega-journey.spec.ts` are dynamic OIDC/email-link URLs, not named pages — leave inline. Scope D-09 to named-`ROUTE`-key navigations only. A `goToPage` taking a freeform URL string is a smell.

---

### `tests/eslint.config.mjs` (MOD — config, static lint)

**Analog:** self — swap the existing `playwright/no-raw-locators` line.

**Current rule** (VERIFIED `tests/eslint.config.mjs` — already `error`, but `no-raw-locators` ONLY flags `.locator()` with a string-literal arg and does NOT catch `getByText`; its own message recommends `getByText`):
```js
'playwright/no-raw-locators': 'error',
```

**Replacement (RESEARCH.md:553-561 — `no-restricted-locators` is the strict superset for D-01):**
```js
'playwright/no-restricted-locators': ['error', [
  { type: 'getByText', message: 'getByText forbidden — use getByTestId (preferred) or getByRole. See CLAUDE.md.' },
  { type: 'locator',   message: 'Raw .locator() forbidden — use getByTestId (preferred) or getByRole. Locale-stable exceptions need an inline // reason: + eslint-disable.' }
]],
// optionally keep 'playwright/no-raw-locators': 'error' for belt-and-braces.
```

**Migration gotcha:** 3 inline `// eslint-disable-next-line playwright/no-raw-locators` comments (`voterNavFixture.fixture.ts:~83`, `perm-hide-hero.spec.ts:~65`, `voterIntro.ts:~207`) must be updated to `playwright/no-restricted-locators` (or both rules kept active) or they fire under the new rule. `getByRole`/`getByTestId` stay allowed (D-02) — do NOT list them.

---

### `tests/tests/setup/setupFromTemplate.ts` + `tests/tests/setup/data.setup.ts` (MOD — test setup, CRUD probe)

**Analog:** each other — `setupFromTemplate.ts`'s `probeFreshDatabasePrecondition` was "hoisted out of data.setup.ts verbatim". Both are near-duplicate PostgREST probes. **Fix BOTH** (Pitfall 5) or extract one shared helper.

**Current probe query shape** (VERIFIED `setupFromTemplate.ts:96-103` ≡ `data.setup.ts:33-40`):
```ts
const candQuery = client.query('candidates');
const { data: nonTestCands, error: candErr } = await candQuery
  .not('external_id', 'like', `${prefix}%`)
  .limit(5);
const orgQuery = client.query('organizations');
const { data: nonTestOrgs, error: orgErr } = await orgQuery
  .not('external_id', 'like', `${prefix}%`)
  .limit(5);
```

**Prefix sources differ** (do not unify the prefix, only the exclusion list): `setupFromTemplate.ts:159` passes `teardownPrefix` (template prefix, falls back to `'test-'`); `data.setup.ts:106` passes module-local `const PREFIX = 'test-'` (`data.setup.ts:14`).

**The fix (RESEARCH.md:563-571 — D-15: reuse `seed_`, the dev-seed `default` template prefix; add a second `.not(...like...)`):**
```ts
const BASELINE_SEED_PREFIX = 'seed_'; // dev-seed default template prefix (packages/dev-seed/src/ctx.ts:89)

const { data: nonTestCands, error: candErr } = await client.query('candidates')
  .not('external_id', 'like', `${prefix}%`)
  .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
  .limit(5);
// identical second .not(...) on the organizations probe
```

**Behavior preservation (D-14):** the `E2E_REQUIRE_FRESH_DB === 'true'` hard-fail branch and the default `console.warn` path are UNTOUCHED — only the detection query narrows. PostgREST chains `.not().not()` as `NOT LIKE x AND NOT LIKE y`; the NULL-external_id `seed.sql` candidate stays excluded (`NULL NOT LIKE` → NULL). Do NOT introduce a `global-seed` sentinel (would require re-prefixing seed rows; `seed_` already exists).

---

### `tests/tests/utils/testIds.ts` (MOD — catalog, data)

**Analog:** self — the existing `testIds.<app>.<page>.<element>` shape (VERIFIED `testIds.ts:125-203`). Extend `voter.home` and `voter.intro` with a page-root load anchor (the gap for `expectPageVisible`).

**Current voter home/intro entries** (VERIFIED — only action buttons, no content anchor):
```ts
voter: {
  home: { startButton: 'voter-home-start' },
  // ...
  intro: { startButton: 'voter-intro-start' },
```

**Extension pattern** (add a content anchor key alongside the action; mirror an existing component testId like `voter.questions.heading`='voter-questions-heading'). The planner must also add the corresponding `data-testid` to the frontend home/intro page root (`apps/frontend/src/routes/[[lang=locale]]/(voters)/...`) OR document reusing `startButton` with a rationale.

---

### root `package.json` (MOD — config, script)

Add a script + wire into the lint pipeline (RESEARCH.md:173-178). `yarn tsc` fails (no root bin alias) — use `./node_modules/.bin/tsc` or a passthrough:
```jsonc
"typecheck:tests": "tsc -p tests/tsconfig.json --noEmit"
// extend the combined gate, e.g.:
// "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests"
```

---

### WS4 annotation sites (MOD — docs/annotation)

Pure annotation (D-13), NOT re-investigation. Markdown sites get a `> ⚠️ QUESTIONABLE — Phase 92 D-13` blockquote; the diff-script gets a `// reason:`-style inline note (CLAUDE.md convention).

| Site | Lines | Note style |
|------|-------|-----------|
| `.planning/quick/260601-q22-step22-logout-bug-data-layer-disproven/260601-q22-SUMMARY.md` | 50-57 | `> ⚠️ QUESTIONABLE` blockquote |
| `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` | 102-105 | same |
| `tests/scripts/diff-playwright-reports.ts` | imgproxy/pooler refs | `// reason:` inline (read exact lines first — `[ASSUMED]`) |

---

## Shared Patterns

### `goToPage`/`expectPageVisible` fixture contract
**Source:** `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts:75-89`
**Apply to:** ALL new/extended voter fixtures (D-06/D-07/D-08).
- `expectPageVisible(visible = true)` keys on a stable load-anchor testId, `toBeVisible({ visible, timeout: 5_000 })`.
- `goToPage(locale = 'en')` navigates via `'/' + buildRoute({route, locale})` THEN internally calls `expectPageVisible(true)`.
- No `expect.soft`, no `try/catch` around `expect(...)`, no `.catch(() => null)` on assertion locators (rigidity contract).

### `// reason:` inline-rationale convention
**Source:** CLAUDE.md ("Svelte Warning-Accepted Format" + `// reason:` blocks)
**Apply to:** WS3 timeout exceptions (`perm-localisation-positive`, `voter-mega-journey`, `emailBucket`), WS1 eslint-disable lines, WS4 diff-script annotation.

### `external_id` prefix-based row scoping
**Source:** `tests/tests/setup/*` probes + `packages/dev-seed/src/ctx.ts:89`
**Apply to:** Both freshness guards (WS5). The `.not('external_id','like','${prefix}%')` idiom extends to the baseline `seed_` prefix.

### Canonical workspace tsconfig
**Source:** `packages/core/tsconfig.json` + `packages/shared-config/package.json` exports
**Apply to:** `tests/tsconfig.json` — `extends "@openvaa/shared-config/ts"` (verify alias resolves from non-workspace `tests/`; fall back to relative path if not).

---

## No Analog Found

None. Every workstream has an in-tree reference (three have working reference implementations: the fixture pair, the freshness probe, the tsconfig base).

## Metadata

**Analog search scope:** `tests/tests/fixtures/`, `tests/tests/helpers/`, `tests/tests/utils/`, `tests/tests/setup/`, `tests/eslint.config.mjs`, `packages/core/tsconfig.json`, `packages/shared-config/`
**Files scanned:** ~12 read + grep across `tests/tests/utils/testIds.ts`, `voterIntro.ts`
**Pattern extraction date:** 2026-06-02
