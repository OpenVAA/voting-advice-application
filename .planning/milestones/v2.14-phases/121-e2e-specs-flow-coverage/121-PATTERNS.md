# Phase 121: E2E Specs — Flow Coverage - Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 13 (5 NEW, 8 MODIFIED)
**Analogs found:** 13 / 13

This is a pure Playwright E2E test-coverage phase. "Role" below uses test-domain classes (leaf-spec / spec-extension / dev-seed-template / setup+teardown / playwright-project-config). All new mechanism design is already done — every fixture this phase consumes was built + verified in Phase 119. This map is assembly, not invention.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/specs/voter/voter-dark-mode.spec.ts` | NEW leaf spec | read-only on base (request-response) | `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` | exact |
| `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` | NEW perm-hosted spec | event-driven (track-emission capture) | `tests/tests/specs/perm/perm-org-matching.spec.ts` (perm host shape) + `cold-entry-dataroot` (leaf body shape) | role-match |
| `tests/tests/specs/voter/voter-journey-mobile.spec.ts` | NEW leaf spec (mobile project) | read-only on base + viewport descriptor | `cold-entry-dataroot.spec.ts` (leaf) + `visual-regression.spec.ts:50-52` (mobile descriptor) | role-match |
| `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` | NEW dev-seed template | seed overlay (app_settings singleton) | `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` | exact |
| `packages/dev-seed/src/templates/index.ts` | MODIFIED registry | barrel export | existing `permOrgMatchingTemplate` import/map/export triad | exact |
| `tests/tests/setup/perm/perm-analytics-tracking.setup.ts` | NEW setup | seed import | `perm-org-matching.setup.ts` | exact |
| `tests/tests/setup/perm/perm-analytics-tracking.teardown.ts` | NEW teardown | prefix-scoped delete | `perm-org-matching.teardown.ts` | exact |
| `tests/tests/specs/voter/voter-journey.spec.ts` | MODIFIED extension | request-response (filters + subMatch read) | self (existing filter/subMatch steps) | exact |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | MODIFIED extension | SSR reload + state persist | self (existing langSelector machinery) | exact |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | MODIFIED extension | auth-state nav read | self (existing auth lifecycle) | exact |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | MODIFIED extension | axe scan (dark variant) | self (existing `assertAxeGates` scan) | exact |
| `tests/tests/specs/perm/perm-question-video.spec.ts` | MODIFIED extension | mobile-override sub-test | `visual-regression.spec.ts:50-52` (scoped describe.use) | role-match |
| `tests/tests/specs/perm/perm-interactive-info.spec.ts` | MODIFIED extension | mobile-override sub-test | `visual-regression.spec.ts:50-52` | role-match |
| `tests/playwright.config.ts` | MODIFIED project DAG | config | self (cold-entry leaf block L226-232 + perm-org-matching triad L892-908) | exact |

## Pattern Assignments

### `tests/tests/specs/voter/voter-dark-mode.spec.ts` (NEW leaf, read-only)

**Analog:** `tests/tests/specs/voter/cold-entry-dataroot.spec.ts`

**Leaf shape to copy** (`cold-entry-dataroot.spec.ts:26-32`): import `{ expect, test }` directly from `@playwright/test` (NOT from `views.ts` — no voter view fixtures needed), wrap in `test.describe`, HARD assertions only (no `expect.soft`, no try/catch). Header docstring states seed (`data-setup-base`), rigidity contract, and the mechanism note.

**Core pattern — drive theme via emulateMedia, NOT a toggle** (Research Code Examples + `theme.fixture.ts:63-77`):
```ts
import { createThemeReader } from '../../fixtures/shared/theme.fixture';
const theme = createThemeReader(page);
await theme.setColorScheme('dark');   // = page.emulateMedia (NO toggle button exists)
await page.goto('/en');
await theme.expectTheme('dark');      // polls matchMedia('(prefers-color-scheme: dark)').matches
await page.reload();
await theme.expectTheme('dark');      // survives reload (emulation persists) — NO storage assertion
```
**Binding correction (Pitfall 1):** there is NO dark-mode toggle and NO localStorage write — `darkMode.svelte.ts:20-38` derives from `matchMedia` only. Reject any task that says "click toggle" or "assert localStorage". There is NO `dark` root class to assert.

**Fixture signature to cite:** `createThemeReader(page): ThemeReaderFixture` → `setColorScheme(scheme: 'dark'|'light'): Promise<void>`, `expectTheme(scheme: 'dark'|'light'): Promise<void>` (`theme.fixture.ts:53-71`). DO NOT rebuild — built + verified Phase 119.

---

### `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` (NEW, perm-hosted)

**Analog:** `perm-org-matching.spec.ts` host shape + `cold-entry-dataroot.spec.ts` body shape.

**SINGLETON CONFLICT — surface to planner (Research A2 / Open Q3 / Pattern 2 NOTE):** the coverage plan lists this as a base leaf on `data-setup-base`, but D-01 requires the analytics overlay which is a singleton-clobbering perm node. **A base leaf CANNOT also depend on a perm node that clobbers `app_settings`.** RESOLUTION (default for planner): host the tracking-payload assertions UNDER the `perm-analytics-tracking` project (its own spec reads the analytics-armed singleton); co-locate the settings-agnostic prefs round-trip there too. Pin at plan time.

**Core pattern — tracking capture (consent vs suppression)** (Research Code Examples + `trackingIntercept.fixture.ts:42-69`):
```ts
import { createTrackingIntercept } from '../../fixtures/shared/trackingIntercept.fixture';
const tracking = await createTrackingIntercept(page);   // ASYNC factory; installs window.umami.track stub pre-nav
// navigate, grant consent via DataConsent "granted" button, perform a representative action ...
const calls = await tracking.getTrackCalls();           // Array<{ name: string; data: ... }>
expect(calls.length).toBeGreaterThan(0);                // consent granted → emits
await tracking.clear();
// suppression (deny/ungranted consent) → repeat action →
expect(await tracking.getTrackCalls()).toEqual([]);     // shouldTrack false → no emit
```
**Three arming conditions (Pitfall 2) — all required for emission:** (1) `analytics.platform.name === 'umami'`, (2) `analytics.trackEvents === true` (BOTH seeded by D-01 node), (3) `userPreferences.dataCollection.consent === 'granted'` (toggled at runtime via `DataConsent.svelte`, NOT seeded).

**Fixture signature to cite:** `createTrackingIntercept(page): Promise<TrackingInterceptFixture>` → `install(): Promise<void>`, `getTrackCalls(): Promise<Array<TrackCall>>`, `clear(): Promise<void>`; `interface TrackCall { name; data }` (`trackingIntercept.fixture.ts:58-69,92`). DO NOT rebuild.

**Persisted-prefs scope (A4):** `dataCollection.consent` + `feedback.status` + `survey.status` only — NO theme field in `userPreferences.type.ts`.

---

### `tests/tests/specs/voter/voter-journey-mobile.spec.ts` (NEW leaf, mobile project)

**Analog:** `cold-entry-dataroot.spec.ts` (leaf body) + `visual-regression.spec.ts:50-52` (mobile descriptor).

**Walk mechanism:** reuse the viewport-agnostic `answeredVoterPage` from `voter-journey.fixture.ts` — the descriptor is project-level config, the walk is unchanged. Do NOT re-implement a mobile walk (Don't Hand-Roll).

**Mobile nav:** `navMenu.openMobileNav()` (hydration-race-guarded `toPass` retry inside, `navMenu.fixture.ts:62-79`) then `navMenu.expectNavMenuItems([...])`.

**Descriptor lives in the project config, not the spec** (see config section below) — explicit `viewport:{390,844}, isMobile, hasTouch` matching visual-regression (Research A3/Open Q1 recommendation over `devices['Pixel 5']`).

---

### `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` (NEW template)

**Analog:** `perm-org-matching.ts` (read in full).

**Skeleton to copy** (`perm-org-matching.ts:42-72, 240-257`): import `{ MINIMAL_BASE_APP_SETTINGS, ... }` from `./shared`; `const P = 'e2e-perm-analytics-'`; `export const permAnalyticsTrackingTemplate: Template = { seed, externalIdPrefix: P, generateTranslationsForAllLocales: false, ... }`. Reuse a minimal 1-election/1-cg/1-co/candidates topology from the org-matching template (any walkable dataset suffices — the assertion is the tracking emission, not the data).

**The overlay — author the full `platform` OBJECT, not a bare string** (Pitfall 2 note; `staticSettings.type.ts:99-122`; base = `analytics: { trackEvents: false }` at `shared.ts:128`):
```ts
app_settings: {
  count: 0,
  fixed: [{
    external_id: 'app-settings',
    settings: {
      ...MINIMAL_BASE_APP_SETTINGS,
      analytics: {
        platform: { name: 'umami', code: 'e2e-dummy-code', infoUrl: 'https://example.test/umami' }, // DUMMY code — never a real key (Security Domain)
        trackEvents: true
      }
    }
  }]
}
```
Prefix discipline (`perm-org-matching.ts:45,71`): bare row `external_id`s, nested refs prefixed with `P`; additive own namespace, does NOT touch `e2e/base`.

---

### `packages/dev-seed/src/templates/index.ts` (MODIFIED registry)

**Analog:** the three existing `permOrgMatching` lines. Add the parallel triad:
- import (alongside `index.ts:39`): `import { permAnalyticsTrackingTemplate } from './e2e/perm/perm-analytics-tracking';`
- map entry (alongside `index.ts:104`): `'perm-analytics-tracking': permAnalyticsTrackingTemplate,`
- re-export (alongside `index.ts:154`): `export { permAnalyticsTrackingTemplate } from './e2e/perm/perm-analytics-tracking';`

**Build step required** (Research Runtime State): `yarn build --filter=@openvaa/dev-seed` (or `yarn build`) after adding, so the seed CLI picks it up — before running the new perm spec.

---

### `tests/tests/setup/perm/perm-analytics-tracking.setup.ts` + `.teardown.ts` (NEW triad)

**Analog:** `perm-org-matching.setup.ts` / `.teardown.ts` (read in full).

**setup** (mirror `perm-org-matching.setup.ts:14-21`):
```ts
import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';
setup('import perm-analytics-tracking dataset', async () => {
  await setupFromTemplate('perm-analytics-tracking', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
```
Unauthenticated (voter slice) — no minted storage state.

**teardown** (mirror `perm-org-matching.teardown.ts:9-19`):
```ts
import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
const PREFIX = 'e2e-perm-analytics-';  // MUST match the template's externalIdPrefix
teardown('delete perm-analytics-tracking dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

---

### `tests/tests/specs/voter/voter-journey.spec.ts` (MODIFIED — EFLOW-01, EFLOW-04)

**Analog:** self (existing filter step ~L997-1085 / research ~L1107-1175; subMatch step ~L724-766).

**EFLOW-01 filter extension** (`entityFilters.fixture.ts:147-175,304-336` + Research Code Examples):
```ts
const d = await entityFilters.openFilterDialog();
const mc = await d.getFilter(/* a >3-option categorical — confirm at build, threshold values.length > 3 */);
await mc.selectAll();   // hard-asserts isAllSelected()===true post-state
await mc.selectNone();
await d.close();
await entityFilters.setTextFilter('polar');        // text × dialog intersection
// + dialog filter, assert getEntityCards().toHaveCount(N) intersection (derive N at build)
await entityFilters.clearTextFilter();             // reset restores full list (13 cards)
```
Fixture methods to cite: `selectAll()/selectNone()/getSelectAllToggle()/isAllSelected()` (`entityFilters.fixture.ts:114-175`), `setTextFilter/clearTextFilter` (L304-312), `openFilterDialog/getFilter` (L323,216). DO NOT bypass the fixture — it guards the reactive mount race (Anti-Patterns).

**EFLOW-04 subMatch extension** — upgrade the current count-only `toHaveCount(4)`: assert (a) gauge count == voter-answered category count (4) AND (b) each gauge == expected score for candidate `test-ca-bb-1` (polar-max-vs-polar-max ≈ 100%). **DERIVE the displayed value at build by reading the rendered gauge** (Pitfall 4) — do not hard-guess. Pin candidate by name regex (`TEXT_RE.polarMax`), never `.first()`.

Follow the host's `expect.soft` convention for these result-page extensions (Pattern 3).

---

### `tests/tests/specs/perm/perm-localisation-positive.spec.ts` (MODIFIED — EFLOW-06)

**Analog:** self (`langSelector` machinery L120-172).

**Net-new in-flight slice (Pitfall 5):** the existing spec switches locale PRE-answer on home. Add: reach in-flight state (elections + constituency selected AND ≥1 opinion question answered), THEN `langSelector.switchTo('en')` / `('fi')`, asserting SELECTIONS + ANSWERS survive the full-reload switch (not just UI strings). Recommendation (Open Q4): compose via `walkUntilQuestionsIntro` + capped `answerAndAdvanceToResults(page,'max',1)` (`voter-journey.fixture.ts:387-389`) to reach a deterministic in-flight state.

`langSelector.switchTo(locale)` does a FULL reload (`perm-localisation-positive.spec.ts:163-166`) — the persisted-state read across that reload IS the test.

---

### `tests/tests/specs/candidate/candidate-journey.spec.ts` (MODIFIED — EFLOW-09)

**Analog:** self (auth lifecycle: registration→login→logout) + `navMenu.fixture.ts:81-87`.

**Pattern** (Research Code Examples):
```ts
const navMenu = createNavMenu(page);
await navMenu.expectNavMenuItems([/* logged-out: login/register present, profile/logout absent — derive labels at build */]);
// ... candidate login (this spec already owns the auth lifecycle) ...
await navMenu.expectNavMenuItems([/* logged-in: profile/questions/logout present, login/register absent */]);
```
`expectNavMenuItems(expected: Array<RegExp|string>): Promise<void>` asserts EXACT count+order via accessible name (`navMenu.fixture.ts:45`). The voter conditional-nav-item slice (D-02) rides EPERM-02 perm specs, NOT this file.

---

### `tests/tests/specs/a11y/a11y-smoke.spec.ts` (MODIFIED — EFLOW-07 dark contrast)

**Analog:** self (existing `assertAxeGates` scan, `AxeBuilder...withTags(WCAG_TAGS).analyze()` at L160,173).

**Pattern — add a dark-scheme variant of the existing scan** (Research Code Examples):
```ts
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
await route.settle(page);
const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
await assertAxeGates(results, testInfo, `${route.name}-dark`);
```
`WCAG_TAGS = ['wcag2a','wcag2aa','wcag21a','wcag21aa']` (L90); module-scope helper `assertAxeGates` (L128) — hoist any new asserts to module scope (`playwright/no-standalone-expect`, Anti-Patterns).

---

### `tests/tests/specs/perm/perm-question-video.spec.ts` + `perm-interactive-info.spec.ts` (MODIFIED — EFLOW-11 D-03)

**Analog:** `visual-regression.spec.ts:50-52` (scoped `describe.use`).

**Pattern — SCOPED mobile-override sub-test, never file-scope (Pitfall 6):**
```ts
test.describe('mobile viewport smoke', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('...', async ({ page }) => { /* one extra block, viewport scoped to this describe only */ });
});
```
`test.use` at file scope would leak the viewport to sibling tests — keep it inside its own `describe`.

---

### `tests/playwright.config.ts` (MODIFIED — 3 leaf projects + 1 perm triad)

**Analog:** cold-entry leaf block (L226-232) + perm-org-matching triad (L892-908).

**Leaf projects** (mirror L226-232; Pitfall 3 — a bare spec without a project never runs):
```ts
{ name: 'voter-dark-mode',      testDir: './tests/specs/voter', testMatch: /voter-dark-mode\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-base'] },
{ name: 'voter-journey-mobile', testDir: './tests/specs/voter', testMatch: /voter-journey-mobile\.spec\.ts/,
  use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  fullyParallel: false, dependencies: ['data-setup-base'] },
```
(`voter-prefs-tracking` is the perm-hosted spec — see triad below, NOT a base leaf, per the singleton conflict.)

**Perm triad appended after the current tail `perm-org-matching` (L892-908; A5 — verify tail unchanged at build):**
```ts
{ name: 'data-setup-perm-analytics-tracking', testMatch: /perm-analytics-tracking\.setup\.ts/,
  teardown: 'data-teardown-perm-analytics-tracking', dependencies: ['perm-org-matching'] },
{ name: 'data-teardown-perm-analytics-tracking', testMatch: /perm-analytics-tracking\.teardown\.ts/ },
{ name: 'voter-prefs-tracking', testDir: './tests/specs/voter', testMatch: /voter-prefs-tracking\.spec\.ts/,
  fullyParallel: false, use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-perm-analytics-tracking'] },
```
Setup depends on the previous perm SPEC (`perm-org-matching`) to maintain the strict serial chain over the shared `app_settings` singleton. `voter-journey`'s `testMatch` is `/voter-journey\.spec\.ts/` (exact) so it never picks up the new `voter-*.spec.ts` siblings.

## Shared Patterns

### Fixtures (built + verified Phase 119 — REUSE, do NOT rebuild)
**Apply to:** all new/extended specs. Cite the exact public signature; do not propose rebuilding.

| Fixture | Factory | Public methods | Source |
|---------|---------|----------------|--------|
| trackingIntercept | `createTrackingIntercept(page): Promise<...>` | `install()`, `getTrackCalls(): Promise<TrackCall[]>`, `clear()` | `tests/tests/fixtures/shared/trackingIntercept.fixture.ts:58-116` |
| theme | `createThemeReader(page)` | `setColorScheme('dark'\|'light')`, `expectTheme('dark'\|'light')` | `tests/tests/fixtures/shared/theme.fixture.ts:53-71` |
| navMenu | `createNavMenu(page)` | `menu` (Locator), `items()`, `openMobileNav()`, `expectNavMenuItems(Array<RegExp\|string>)` | `tests/tests/fixtures/shared/navMenu.fixture.ts:33-51` |
| entityFilters | (composed via `views.ts`) | per-filter `selectAll()/selectNone()/getSelectAllToggle()/isAllSelected()`, `setTextFilter/clearTextFilter`, `openFilterDialog/getFilter/setSelection` | `tests/tests/fixtures/voter/entityFilters.fixture.ts:65-350` |
| langSelector | (used in perm-localisation) | `switchTo(locale)` (full reload), `expectVisible([...])` | `perm-localisation-positive.spec.ts:122,147,163-166` |
| voter walk | `answeredVoterPage`/`locatedVoterPage` | viewport-agnostic 'max' walk; `walkUntilQuestionsIntro`, `answerAndAdvanceToResults` | `tests/tests/fixtures/voter/voter-journey.fixture.ts:387-389` |

### Rigidity contract (E2E Hard Rule)
**Apply to:** all NEW leaf specs (`voter-dark-mode`, `voter-prefs-tracking`, `voter-journey-mobile`) — HARD assertions only, no `expect.soft`, no try/catch around `expect()`, no `.catch` fallback (`cold-entry-dataroot.spec.ts:22-24`). Extensions to `voter-journey` follow the host's `expect.soft` convention (Pattern 3).

### Determinism gate
**Apply to:** every new/edited spec — must pass 3× (3× determinism standard). Per-task quick signal: `yarn test:e2e --project=<name> --no-deps` (run its setup project first if perm-seeded). Trusted signal: full `yarn test:e2e` ("did not run" counts as failure).

### Lint constraints
**Apply to:** all spec bodies — `playwright/no-standalone-expect` + `playwright/no-conditional-in-test`: hoist `expect()` out of `for`/`if` into module-scope helpers (model `a11y-smoke.spec.ts` `assertAxeGates`). No one-shot `locator.isVisible({timeout})` as a wait — use `waitFor`/`expect.poll`.

## No Analog Found

None. Every file maps to a strong in-repo analog (the three NEW leaf specs, the perm template, and the setup/teardown triad all have exact or role-match precedents; the mobile descriptor and a11y dark-scan are documented in Research Code Examples grounded in actual files).

## Metadata

**Analog search scope:** `tests/tests/specs/{voter,perm,candidate,a11y,visual}/`, `tests/tests/fixtures/{shared,voter}/`, `tests/tests/setup/perm/`, `tests/playwright.config.ts`, `packages/dev-seed/src/templates/{index.ts,e2e/perm/}`, `packages/app-shared/src/settings/staticSettings.type.ts`.
**Files scanned:** ~14 read in full or targeted; ~6 greps for signatures/tail-node.
**Pattern extraction date:** 2026-06-16

## PATTERN MAPPING COMPLETE
