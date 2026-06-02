# Phase 92: E2E test infrastructure hardening — Research

**Researched:** 2026-06-02
**Domain:** Playwright E2E test infrastructure (TypeScript typecheck wiring, ESLint locator rules, fixture paradigm, timeout config, Supabase seed-aware preconditions)
**Confidence:** HIGH (all findings verified against the live codebase + a running local DB + the installed `eslint-plugin-playwright@2.9.0` rule source)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Locator stability (WS1):**
- **D-01:** Forbidden locators (enforce via an eslint rule set to **error**): bare `page.locator(...)`, `getByText(...)`, and chained `.locator(...)`. Scout count = 7 (2 `page.locator` + 1 `getByText` + 4 chained `.locator`). Fix all. Prefer `eslint-plugin-playwright`'s `no-raw-locators` (or equivalent) if supported; otherwise custom rule.
- **D-02:** `getByRole(...)` stays **allowed** (NOT forbidden). Scout count = 115; do not blanket-migrate.
- **D-03:** **testId-preference sweep:** where a `getByRole(...)` element already has — or reasonably warrants — a stable testId, migrate to `getByTestId(...)`. One-time + code-review enforced; lint cannot detect "a testId exists."
- **D-04:** testIds via the shared `testIds` catalog (scout count = 333 `getByTestId`) are canonical — unchanged.
- **D-05:** Typecheck: `tests/` has no own `tsconfig.json`/`package.json` typecheck script. Establish how tests are typechecked and wire a green typecheck for everything under `tests/`, fixing all surfaced errors/warnings.

**goToPage / expectPageVisible (WS2):**
- **D-06:** `goToPage(locale?: string)` **navigates AND asserts visibility** — internally calls `expectPageVisible(true)`.
- **D-07:** `expectPageVisible(visible = true)` stays public for explicit re-checks + negative assertions.
- **D-08:** Locale handling: build locale-aware URL respecting the app's optional `[[lang=locale]]` segment (omitted ⇒ default locale).
- **D-09:** **Full coverage:** every page a spec navigates to OR asserts a URL/visibility on gets a fixture with `goToPage` + `expectPageVisible`. **Includes rebuilding voter-side fixtures** (home, intro, questions, results, entity-detail) whose `pages/voter/*` objects were deleted. Scout: ~22 fixtures; 69 raw `page.goto`. Each fixture's `expectPageVisible` keys on a stable testId; extend testIds where missing.

**Timeout consolidation (WS3):**
- **D-10:** Single exported object of named semantic buckets, union of current uses — e.g. `{ element, click, page, slowPage, testMax }`, each documented. Derive from actual current local `TIMEOUT` shapes.
- **D-11:** File: `tests/tests/helpers/timeouts.ts`, exported via the helpers barrel (`tests/tests/helpers/index.ts`).
- **D-12:** Documented exceptions stay inline with a required `// reason:` comment. Replace scattered hardcoded values (`10000/15000/30000/45000/60000`) + per-spec local `TIMEOUT` objects with central imports; `playwright.config.ts`'s global `timeout: 90000` is the per-test ceiling and may reference central `testMax`.

**Questionable-diagnosis flag (WS4):**
- **D-13:** Annotate the prior imgproxy/pooler diagnosis as **questionable** wherever recorded (inline + originating STATE/todo entry). Documentation/annotation task, NOT re-investigation.

**Freshness-guard fix (WS5):**
- **D-14:** Keep warn-only default; `E2E_REQUIRE_FRESH_DB=true` still opts into hard-fail. Behavior change limited to detection accuracy.
- **D-15:** Make detection **seed-aware via a sentinel prefix**. Reuse `seed_` (dev-seed default) or introduce a dedicated `global-seed` sentinel. Probe (`setupFromTemplate.ts:84-121` + mirror in `data.setup.ts`) currently excludes only `${prefix}%`; extend to also exclude the baseline-seed prefix.

### Claude's Discretion
- Exact eslint rule/config for D-01 (plugin rule vs custom), canonical timeout bucket names/values, the per-page stable testId for each `expectPageVisible`, and voter-side fixture structure — left to research/planning, consistent with existing fixture conventions.

### Deferred Ideas (OUT OF SCOPE)
- None. (The 4 todo-matcher hits — party-app generalization, app-shared paradigm, mergeSettings re-exports, alliance-tab — were spurious and not folded.)
</user_constraints>

<phase_requirements>
## Phase Requirements

No formal REQ IDs assigned in REQUIREMENTS.md (Phase 92 is post-v2.10-close infra hardening; ROADMAP marks Requirements as TBD). Below is the recommended workstream→coverage mapping the planner should adopt, derived from CONTEXT.md D-01..D-15.

| Workstream | Coverage | Research Support |
|-----------|----------|------------------|
| WS1-typecheck | A green typecheck command for everything under `tests/` exists and passes | §"WS1 — Typecheck wiring" — backlog is **~5 real errors**, config shape derived |
| WS1-lint | Bare `page.locator`, `getByText`, chained `.locator` are eslint-error; `getByRole`/`getByTestId` allowed | §"WS1 — Lint rule" — use `playwright/no-restricted-locators` |
| WS1-sweep | getByRole→getByTestId migrated where a testId exists/warrants | §"WS1 — testId-preference sweep" — inventory method provided |
| WS2 | Every navigated/asserted page has a fixture with `goToPage(locale?)`+`expectPageVisible(visible=true)`; voter fixtures rebuilt | §"WS2 — Fixture paradigm" — canonical template at `candidateQuestionsOverviewPage.fixture.ts:75-89` |
| WS3 | Single `tests/tests/helpers/timeouts.ts`; all local `TIMEOUT` objects + hardcoded literals migrated | §"WS3 — Timeout consolidation" — bucket union + value-conflict resolution |
| WS4 | Imgproxy/pooler diagnosis annotated questionable at all 3 recorded sites | §"WS4 — Questionable diagnosis" — exact file:line list |
| WS5 | Both freshness guards exclude the baseline-seed prefix; warn-only preserved | §"WS5 — Freshness guard" — root cause + exact query change |
</phase_requirements>

## Summary

Phase 92 is a surgical infrastructure-hardening pass over an already-mature Playwright suite. The codebase is in mid-refactor (uncommitted changes converting page-objects → function-fixtures), which means several CONTEXT scout counts are slightly stale but directionally correct. Every workstream is **smaller and more tractable than the scout numbers suggest**, and three of the five workstreams already have a working in-tree reference implementation to copy.

The single most important risk-quantification finding: **the `tests/` typecheck backlog is ~5 real errors, not a large pre-existing mess.** I built a probe `tsconfig` extending the shared base and ran `tsc --noEmit` over the whole `tests/` tree — with a correct `lib` (`DOM` included, since tests call `page.evaluate` with browser globals) the count drops to 5 genuine errors in 2 files (`e2eFixtureRefs.ts` ×3 + `candidate-bank-auth.spec.ts` ×1) plus one cross-package leak that proper project boundaries exclude. `tests/` is currently typechecked by **nothing** — there is no root `tsconfig.json`, `tests/` is not a yarn workspace (`workspaces: ["packages/*","apps/*"]`), and Playwright transpiles per-file with esbuild (no type checking).

**Primary recommendation:** (WS1) Add a committed `tests/tsconfig.json` extending `@openvaa/shared-config/ts` with `noEmit`, `lib: ["ES2022","DOM","DOM.Iterable"]`, fix the ~5 errors, and add a `yarn typecheck:tests` script wired into the lint/CI pipeline next to the existing `eslint … tests`. (WS1-lint) Switch the locator guard from `playwright/no-raw-locators` to the stronger **`playwright/no-restricted-locators`** rule listing `getByText` + `locator` as restricted types — `no-raw-locators` does NOT catch `getByText` (its own message *recommends* it) and silently misses non-string `.locator()` args. (WS2) Copy the `goToPage()`/`expectPageVisible(visible=true)` pair that already exists at `candidateQuestionsOverviewPage.fixture.ts:75-89`, adding the `locale?` param via the existing `buildRoute({route, locale})` util. (WS3) The canonical bucket union is `{ element, click, page, slowPage, testMax }` with documented value conflicts to resolve. (WS5) Reuse `seed_` as the baseline-seed sentinel (it's already the dev-seed `default` template prefix) and add `.not('external_id','like','seed_%')` to both probes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Typecheck of `tests/` | Build tooling (tsc) | CI/lint pipeline | Pure dev-tooling config; no runtime tier involved |
| Locator-stability lint | ESLint (test lint config) | CI pipeline | `tests/eslint.config.mjs` governs all `tests/**/*.ts` |
| `goToPage`/`expectPageVisible` | Test fixtures (`tests/tests/fixtures/`) | testId catalog (`utils/testIds.ts`) | Function-fixture is the navigation/assertion owner; testIds are the element-access surface |
| Locale-aware URL build | Test util (`utils/buildRoute.ts`) | Frontend `ROUTE` enum (read-only import) | buildRoute already strips route-groups + substitutes `[[lang=locale]]` |
| Timeout buckets | Test helper (`helpers/timeouts.ts`) | playwright.config.ts (`testMax` ceiling) | Single source consumed everywhere |
| Freshness precondition | Test setup (`setup/setupFromTemplate.ts` + `setup/data.setup.ts`) | Supabase seed (`seed.sql`) + dev-seed prefix | Guard reads DB state; seed/prefix defines what "baseline" means |

## Standard Stack

This phase installs **NO new external packages** — all tooling is already present.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 | E2E runner + assertions | The suite's foundation `[VERIFIED: node -e require]` |
| `eslint-plugin-playwright` | 2.9.0 | Playwright-aware lint rules incl. `no-restricted-locators` | Already in root devDeps; ships the rule WS1 needs `[VERIFIED: node -e require + dist source read]` |
| `typescript` | 5.9.3 | `tsc --noEmit` typecheck | Present in root node_modules `[VERIFIED: node -e require]` |
| `eslint` | catalog | Lint runner (flat config) | Already drives `tests/eslint.config.mjs` `[VERIFIED: package.json]` |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@openvaa/shared-config` | workspace | `./ts` tsconfig base + `./eslint` flat config | WS1 `tests/tsconfig.json` extends `@openvaa/shared-config/ts` |
| `@openvaa/dev-seed` | workspace | Seed templates + `SupabaseAdminClient` + `TEST_PROJECT_ID` + prefix conventions | WS5 baseline-prefix decision is grounded here |

**Installation:** None required.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `playwright/no-restricted-locators` | Keep `playwright/no-raw-locators` only | `no-raw-locators` does NOT catch `getByText` and misses non-string `.locator()` args — fails D-01. See §"WS1 — Lint rule" |
| `playwright/no-restricted-locators` | Custom rule / generic `no-restricted-syntax` selector | Unnecessary — the plugin rule is purpose-built and AST-correct for chained calls. Custom rule only needed if the plugin rule proves insufficient (it isn't) |
| Dedicated `tests/tsconfig.json` | Make `tests/` a yarn workspace | Heavier; `tests/` has no `package.json` and isn't published. A bare typecheck tsconfig + root script is the minimal change `[ASSUMED]` |
| Reuse `seed_` prefix (WS5) | Introduce new `global-seed` sentinel | Reusing `seed_` requires zero seed-mechanism changes (the `default` template already emits it). `global-seed` would require re-prefixing seed rows. See §"WS5" |

## Package Legitimacy Audit

> Not applicable — Phase 92 installs **zero** external packages. All tooling (`@playwright/test`, `eslint-plugin-playwright`, `typescript`, `eslint`) is already present in the repo's committed `package.json` and `node_modules`, verified via `node -e require(...)`. No registry lookup or slopcheck needed.

---

## WS1 — Typecheck wiring (D-05)

### Current mechanism: NOTHING typechecks `tests/`

- **No root `tsconfig.json`** — `ls tsconfig*.json` at repo root returns no matches. `[VERIFIED: ls]`
- **`tests/` is not a yarn workspace** — root `package.json` has `"workspaces": ["packages/*","apps/*"]`. `tests/` is excluded. `[VERIFIED: package.json]`
- **No `tests/tsconfig.json` and no `tests/package.json`** — confirmed absent. `[VERIFIED: ls]`
- **Playwright does NOT typecheck** — `@playwright/test` transpiles each spec with esbuild at runtime; it strips types without checking them. `[CITED: playwright.dev — esbuild transform]`
- **`test:e2e`** = `playwright test -c ./tests/playwright.config.ts ./tests` — runtime only. `[VERIFIED: package.json]`

Net: type errors in `tests/` are invisible today. This is the gap D-05 closes.

### Quantified backlog: ~5 real errors

I created a probe `tests/tsconfig.probe.json` and ran `./node_modules/.bin/tsc -p … --noEmit`. With `lib: ["ES2022","DOM","DOM.Iterable"]` (DOM required — `missingNominations.ts` uses `document` inside `page.evaluate`), the result was **5 errors** (probe deleted after measurement; not committed): `[VERIFIED: tsc --noEmit run]`

| File:line | Error | Fix |
|-----------|-------|-----|
| `tests/tests/utils/e2eFixtureRefs.ts:80` | TS2352 — `Record<string,unknown>[]` → `ReadonlyArray<TemplateCandidate>` cast; missing `external_id` | Cast via `unknown` first, or type `template.candidates.fixed` properly |
| `tests/tests/utils/e2eFixtureRefs.ts:120` | TS2352 — `→ TemplateQuestion` (missing `external_id`, `type`) | same |
| `tests/tests/utils/e2eFixtureRefs.ts:127` | TS2352 — `→ TemplateOrganization` (missing `external_id`) | same |
| `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:94` | TS2694 — `jose.KeyLike` no longer exported (jose 6.2.1 removed it) | Replace `jose.KeyLike` with `CryptoKey` or `jose.CryptoKey` type per jose v6 API |
| `apps/frontend/src/lib/i18n/translations/translations.type.ts:28` | TS2304 — `AppSettings` not found | **Cross-package leak** — excluded once the tsconfig scopes to `tests/` only (the import chain pulls a frontend type without the frontend's own tsconfig context). Verify it disappears with proper `include`/path scoping; if not, it's a frontend issue out of WS1 scope |

**Risk flag:** the `jose.KeyLike` error (TS2694) reflects a real API drift — `jose@6.2.1` is installed and v6 removed the `KeyLike` type alias. This is a genuine fix, not a config artifact. `[VERIFIED: tsc + node -e require('jose/package.json')]`

### Recommended config (D-05)

Create committed `tests/tsconfig.json`:

```jsonc
// tests/tsconfig.json
{
  "extends": "../packages/shared-config/tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "composite": false,        // override base — pure check, no project-refs/declaration output
    "declarationMap": false,   // override base
    "lib": ["ES2022", "DOM", "DOM.Iterable"],  // DOM required for page.evaluate browser globals
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["tests/**/*.ts", "*.ts"],
  "exclude": [
    "playwright-results/**",
    "playwright-results-cell4/**",
    "playwright-report/**",
    "node_modules/**",
    "playwright/**"
  ]
}
```

> Note: the shared base sets `composite: true` + `declarationMap: true` + `checkJs: true`; the override above neutralizes the project-refs machinery for a pure `--noEmit` check. The base does NOT include `DOM` in `lib` (`["es2022"]` only), which is why DOM must be added here.

Add a root `package.json` script and wire it into the lint pipeline:

```jsonc
// package.json scripts
"typecheck:tests": "tsc -p tests/tsconfig.json --noEmit"
// and extend the existing combined gates, e.g.:
// "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests"
```

**Alternative if `tsc` script-name resolution bites:** `yarn tsc` failed with "Couldn't find a script named tsc" in this repo (no `tsc` bin alias at root); invoke via `./node_modules/.bin/tsc` or add a `tsc` passthrough. `[VERIFIED: yarn tsc failed; ./node_modules/.bin/tsc works]`

---

## WS1 — Lint rule (D-01)

### Current state: `no-raw-locators` is ALREADY error — but insufficient

`tests/eslint.config.mjs` already sets `'playwright/no-raw-locators': 'error'` (Phase 73 bump). `[VERIFIED: read config]` So why do raw locators survive? Because **`no-raw-locators` only flags `.locator()` calls with a *string-literal* first argument** — and not `getByText` at all.

Rule source (`node_modules/eslint-plugin-playwright/dist/index.cjs:1707-1731`): `[VERIFIED: read dist source]`
```js
// no-raw-locators only fires when:
//   callee is a MemberExpression accessing `.locator`
//   AND (no args OR first arg is a string node)
// → page.locator('text=' + var)  is NOT flagged (BinaryExpression arg)
// → block.getByText(...)          is NOT flagged (different method)
// Its own message literally recommends getByText:
//   "Use methods like .getByRole() or .getByText() instead of raw locators."
```

### The 4 actual `.locator()`/`getByText` sites today (scout said 7; refactor reduced it)

`[VERIFIED: grep]`

| File:line | Code | Currently guarded? |
|-----------|------|--------------------|
| `tests/tests/utils/voterIntro.ts:208` | `has: page.locator('text=' + (...))` | `// eslint-disable-next-line playwright/no-raw-locators` inline — but rule wouldn't fire anyway (non-string arg) |
| `tests/tests/fixtures/candidate/voterNavFixture.fixture.ts:84` | `page.locator('#drawerCloseButton')` | `// eslint-disable-next-line playwright/no-raw-locators` + `// reason:` block (locale-stable id) |
| `tests/tests/specs/perm/perm-hide-hero.spec.ts:66` | `hero.locator('img, span')` | `// eslint-disable-next-line playwright/no-raw-locators` + `// reason:` block |
| `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts:95` | `choice.locator('xpath=..').getByTestId(...)` | **NOT disabled — this is the ONE error `no-raw-locators` actually reports today** |

The single `getByText`: `tests/tests/fixtures/entityDetails.fixture.ts:136` — `block.getByText(options.infoText)` — **unguarded and invisible to `no-raw-locators`.** `[VERIFIED: grep + lint run]`

### Recommendation: switch to `playwright/no-restricted-locators`

The plugin ships **`no-restricted-locators`** (verified in the dist rule registry). `[VERIFIED: grep rule list]` It matches ANY `MemberExpression` call whose property name equals a restricted type — so it catches `page.getByText(...)`, chained `block.getByText(...)`, `page.locator(...)` (string OR non-string arg), and chained `.locator(...)`. It does NOT touch `getByRole`/`getByTestId` unless you list them. Source: `dist/index.cjs:1758-1800`. `[VERIFIED: read source]`

```js
// tests/eslint.config.mjs — replace the no-raw-locators line with:
'playwright/no-restricted-locators': [
  'error',
  [
    { type: 'getByText', message: 'getByText is forbidden — use getByTestId (preferred) or getByRole. See CLAUDE.md.' },
    { type: 'locator',   message: 'Raw .locator() is forbidden — use getByTestId (preferred) or getByRole. Locale-stable exceptions need an inline // reason: + eslint-disable.' }
  ]
],
// keep 'playwright/no-raw-locators': 'error' too if you want belt-and-braces,
// but no-restricted-locators is the strict superset for these two patterns.
```

**Migration gotcha:** the 3 inline `// eslint-disable-next-line playwright/no-raw-locators` comments (at `voterNavFixture.fixture.ts:83`, `perm-hide-hero.spec.ts:65`, and `voterIntro.ts` ~207) must be updated to `playwright/no-restricted-locators` (or both rules kept active) or they'll fire under the new rule. `[VERIFIED: grep eslint-disable]`

### Pre-existing lint debt (NOT WS1 scope but the planner must know)

Running `eslint … tests` today reports **37 errors** — the suite is currently red because of the in-progress fixture refactor (uncommitted, see `git status`). Breakdown: `[VERIFIED: lint run]`

| Rule | Count | Note |
|------|-------|------|
| `playwright/expect-expect` | 23 | Mostly `setup`/`teardown` files flagged as "Test has no assertions" — refactor churn |
| `simple-import-sort/imports` | 5 | autofixable |
| `playwright/no-conditional-in-test` | 3 | |
| `playwright/no-wait-for-timeout` | 2 | `missingNominations.ts:159,167` |
| `playwright/no-raw-locators` | 1 | `candidatePreviewPage.fixture.ts:95` (the chained `.locator('xpath=..')`) |
| `@typescript-eslint/consistent-type-imports` | 1 | `a11y-smoke.spec.ts:92` |
| `playwright/no-skipped-test` | 1 | `perm-per-app-notifications.spec.ts:30` |
| `quotes` | 1 | |

**Risk flag:** WS1's "fix all warnings/errors" (D-05 wording) reads as typecheck-only, but the lint suite is also currently red. The planner must decide whether WS1 also greens the 37 lint errors or only the locator-specific ones. Recommend: green the full lint suite (these are mostly autofix + refactor-residue), since a red `lint:check` blocks the new typecheck gate from being meaningfully enforced in the same pipeline.

---

## WS1 — testId-preference sweep (D-03)

This is a **one-time manual sweep**, code-review enforced (no lint rule can detect "a testId exists"). 115 `getByRole(...)` call sites. `[VERIFIED: grep count]`

### Reliable inventory method for the planner

```bash
# Enumerate all getByRole sites with file:line:code
grep -rn 'getByRole(' tests/tests --include='*.ts'   # (zsh: quote the glob)

# Cross-reference: which testIds already exist (candidate to replace a role lookup)
grep -nE "': '|: '" tests/tests/utils/testIds.ts
```

The decision rule per site (from D-03):
- **Migrate to `getByTestId`** if the targeted element already carries a `data-testid` (check the component) OR clearly warrants one (a distinct, semantically-stable element).
- **Keep `getByRole`** for pure semantic roles with no distinct element (e.g. asserting "there is exactly one `combobox`", role-based counts, accessibility-name assertions like `toHaveAccessibleName`).

**Recommendation for plan structure:** treat this as a per-file review task list (the 115 sites cluster in a handful of files — `voter-mega-journey.spec.ts`, `entityDetails.fixture.ts`, `resultsPage.fixture.ts`, the perm specs). Do NOT try to migrate counting/accessible-name assertions; those are legitimately role-based. The `entityDetails.fixture.ts:130` `getByRole('radio', {checked:true})` pattern is a good example of a *keep* (it's a state-predicate, not an element-identity lookup).

**Confidence: MEDIUM** — the exact migrate/keep split requires reading each component for an existing testid; the planner should budget this as review work, not a mechanical codemod.

---

## WS2 — Fixture paradigm (D-06..D-09)

### The paradigm is already established — copy it

**Composition-root + function-fixture pattern** (`base.extend<...>({ fixtureName: async ({page}, use) => use(createXxx(page)) })`):
- Candidate root: `tests/tests/fixtures/candidate/candidate-mega.ts` (11 fixtures). `[VERIFIED: read]`
- Voter/results root: `tests/tests/fixtures/views.ts` (3 fixtures: resultsPage, entityFilters, entityDetails). `[VERIFIED: read]`
- Voter journey root: `tests/tests/fixtures/voter-mega.fixture.ts`. `[VERIFIED: grep]`

Each per-page fixture is `export function createXxxPage(page: Page) { return { async method() {...} } }` keyed on `testIds`. Canonical shape: `candidateHomePage.fixture.ts`. `[VERIFIED: read]`

### `goToPage`/`expectPageVisible` already exists — exact template

`tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts:75-89` is the **reference implementation** the planner should replicate: `[VERIFIED: read]`

```ts
async function expectPageVisible(visible = true): Promise<void> {
  const pageLocator = page.getByTestId(testIds.candidate.questions.intro);
  await expect(pageLocator).toBeVisible({ visible, timeout: 5_000 });
}
return {
  async goToPage(): Promise<void> {
    await page.goto('/en/candidate/questions');
    await expectPageVisible();
  },
  expectPageVisible,
  // ...
};
```

**Gap vs D-08:** this reference hardcodes `/en/candidate/questions` and takes NO `locale?` param. The phase must add the `locale?` param and build the URL via the existing locale-aware builder.

### Locale-aware URL build (D-08) — use `buildRoute`

`tests/tests/utils/buildRoute.ts` already does exactly what D-08 requires — strips route groups `(...)` and substitutes `[[lang=locale]]`: `[VERIFIED: read]`

```ts
export function buildRoute({ route, locale }: { route: Route; locale: string }): string {
  const parts = ROUTE[route].split('/');
  return parts
    .map((p) => {
      if (p === '[[lang=locale]]') return locale;   // locale segment
      if (p.startsWith('(')) return undefined;       // route group → dropped
      return p;
    })
    .filter((p) => p !== undefined)
    .join('/');
}
```

`ROUTE` (imported from `apps/frontend/src/lib/utils/route/route.ts`) has keys for every page: `Home`, `Intro`, `Questions`, `Results`, `CandAppHome`, `CandAppLogin`, `CandAppProfile`, etc. `[VERIFIED: read]`

**Recommended `goToPage(locale?)` shape:**
```ts
async goToPage(locale = 'en'): Promise<void> {
  await page.goto('/' + buildRoute({ route: 'Questions', locale }));  // route per-fixture
  await expectPageVisible(true);
}
```
> Caveat: `ROUTE[Home]` = `/(voters)` → buildRoute yields just the locale (e.g. `en`), so prepend `/`. For default-locale (omitted segment) behavior, decide whether `locale='en'` is the default or whether to support a no-locale path; the app's `[[lang=locale]]` is optional so `/candidate` (no locale) is also valid. Most existing `page.goto` calls hardcode `/en/...` (`[VERIFIED: grep]`), so defaulting `locale='en'` matches current behavior.

### The 69 (actually ~65) raw `page.goto` sites to migrate (D-09)

`[VERIFIED: grep — 65 `.goto(` in tests/tests/**.ts]` Distribution:

| File | count |
|------|-------|
| `specs/candidate/candidate-mega-journey.spec.ts` | 13 |
| `specs/voter/voter-mega-journey.spec.ts` | 6 |
| `specs/perm/perm-localisation-positive.spec.ts` | 6 |
| `specs/perm/perm-not-located-2e2cg.spec.ts` | 5 |
| `utils/voterNavigation.ts` | 3 |
| `specs/perm/perm-disable-voter-app.spec.ts` | 3 |
| `specs/perm/perm-disable-candidate-app.spec.ts` | 3 |
| `specs/perm/perm-answers-locked.spec.ts` | 3 |
| `helpers/settle.helper.ts` | 3 (generic `gotoAndSettle` — wrapper, likely stays) |
| `fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts` | 3 |
| `specs/visual/visual-regression.spec.ts` | 2 |
| `specs/perm/perm-per-app-notifications.spec.ts` | 2 |
| `setup/auth.setup.ts` | 2 |
| 12 other files | 1 each |

**Note:** some `page.goto` targets are **dynamic callback URLs** (`registrationCallbackUrl`, `resetCallbackUrl`, `deferredTarget` in `perm-not-located-2e2cg.spec.ts`, `candidate-mega-journey.spec.ts`). These are NOT page-fixture navigations — they go to OIDC/email-link callback URLs. The planner must scope D-09 to *page* navigations (named ROUTE keys), leaving genuine deep-link/callback `goto`s inline (with a `// reason:` if the lint rule ever forbids raw goto — currently it does not).

### Voter-side fixtures to REBUILD (D-09)

All `tests/tests/pages/voter/*` page objects are **deleted** (confirmed: `find tests/tests/pages` returns nothing; git status shows `D` for HomePage/IntroPage/QuestionsPage/ResultsPage/EntityDetailPage). `[VERIFIED: git status + find]` The rebuild targets, with their `expectPageVisible` anchor testId:

| New fixture | Route key | Load-confirming testId | Exists in catalog? |
|-------------|-----------|------------------------|--------------------|
| voterHomePage | `Home` | **GAP** — only `voter.home.startButton` exists; no page-content anchor | Extend catalog |
| voterIntroPage | `Intro` | **GAP** — only `voter.intro.startButton` exists | `voter.intro.startButton` usable but it's an action, not content; consider extending |
| voterQuestionsPage | `Questions` | `voter.questions.heading` = `voter-questions-heading` | ✅ exists |
| voterResultsPage | `Results` | `voter.results.list` = `voter-results-list` | ✅ exists (note: `resultsPage.fixture.ts` already exists but lacks goToPage — extend it) |
| voterEntityDetailPage | `ResultEntity` (drawer) | `voter.entityDetail.container` = `voter-entity-detail` | ✅ exists |

> `resultsPage.fixture.ts` already exists (`createResultsPage`) with `selectElection`/`getEntityCard`/etc. but **no `goToPage`/`expectPageVisible`** (`[VERIFIED: grep]`). Extend it rather than create a parallel fixture. `entityDetails.fixture.ts` similarly exists.

**testId catalog extension (D-09):** the catalog is `tests/tests/utils/testIds.ts` (289 lines, `testIds.<app>.<page>.<element>`). `[VERIFIED: read]` The two gaps are voter **home** and **intro** page-content load anchors. The planner must add a stable `data-testid` to the home/intro page root in the frontend (`apps/frontend/src/routes/[[lang=locale]]/(voters)/...`) and register it in the catalog, OR reuse an existing always-present element (e.g. the start button) as the anchor with a documented rationale.

---

## WS3 — Timeout consolidation (D-10..D-12)

### Canonical bucket union

The 4 local `TIMEOUT` objects (`[VERIFIED: read all 4]`):

| Source | element | click | page | slowPage | testMax |
|--------|---------|-------|------|----------|---------|
| `candidate-mega-journey.spec.ts:94` | 2_000 | 2_000 | 5_000 | 7_500 | 90_000 |
| `voter-mega-journey.spec.ts:68` | 2_000 | 2_000 | 4_000 | 10_000 | 120_000 |
| `voterIntro.ts:44` | 2_000 | 2_000 | 4_000 | 10_000 | — |
| `perm-localisation-positive.spec.ts:76` | — | — | — | 15_000 | 180_000 |

Plus `emailBucket.fixture.ts:40` `POLL_TIMEOUT = 15_000` (email polling — a distinct concern). `[VERIFIED: grep]`

**Canonical set (D-10):** `{ element, click, page, slowPage, testMax }`. Value conflicts the planner must resolve (recommend taking the **max** of each to avoid tightening any existing budget, then auditing failures):

| Bucket | Recommended value | Rationale |
|--------|-------------------|-----------|
| `element` | 2_000 | consistent across all sources |
| `click` | 2_000 | consistent |
| `page` | 5_000 | max of {4_000, 5_000}; the slower wins to avoid regressions |
| `slowPage` | 10_000 | the common value; 15_000 and 7_500 are outliers — see exceptions |
| `testMax` | 90_000 | matches the playwright.config global ceiling (do NOT exceed it as a generic default) |

**Documented inline exceptions (D-12)** — these do NOT fit a bucket and stay inline with `// reason:`:
- `perm-localisation-positive.spec.ts` `slowPage: 15_000` (l10n flows are slower) and `testMax: 180_000` (multi-flow perm spec exceeds the 90s global — note: a per-test `testMax` > the playwright.config `timeout: 90000` only works if the spec calls `test.setTimeout(...)`; flag this for the planner to verify).
- `voter-mega-journey.spec.ts` `testMax: 120_000` (raised from 50_000 for the 88-04 modal choreography — has an existing inline rationale block).
- `emailBucket.fixture.ts` `POLL_TIMEOUT = 15_000` — email polling; consider a separate `email`/`poll` bucket or keep inline.

### File + barrel (D-11)

Create `tests/tests/helpers/timeouts.ts` exporting a single `const TIMEOUTS = { element: 2_000, ... } as const` (or named exports), and add to the barrel `tests/tests/helpers/index.ts` (currently exports `assertDbRowCount`, `clickAndRaceSettle`, `expectLandedOn`, `iterateSelectOptions`, `gotoAndSettle`, `settleNetworkIdle`, `walkVoterIteration`). `[VERIFIED: read barrel]`

> Naming caution: the barrel header documents the `helpers/` vs `utils/` boundary — `helpers/` = "thin generic Playwright wrappers with NO domain knowledge." A pure timeout-constants module fits `helpers/` per D-11's explicit placement. `[VERIFIED: read barrel header]`

### Hardcoded literals to migrate (D-12)

`[VERIFIED: grep — 104 timeout-literal matches; 65 `timeout:` literals by file]` Top files: `voter-mega.fixture.ts` (15), `voterNavigation.ts` (12), `a11y-smoke.spec.ts` (8), `missingNominations.ts` (3), `answerQuestion.ts` (3). The `playwright.config.ts` global `timeout: 90000` (line 46) is the per-test ceiling and may reference the central `testMax`. `[VERIFIED: grep config]`

---

## WS4 — Questionable diagnosis annotation (D-13)

The exact diagnosis text appears at **3 actionable sites** (plus ROADMAP/CONTEXT which are phase-spec docs, not annotation targets): `[VERIFIED: grep -n across .planning + tests]`

| File | Lines | Action |
|------|-------|--------|
| `.planning/quick/260601-q22-step22-logout-bug-data-layer-disproven/260601-q22-SUMMARY.md` | 50-57 (§"Reproduction blocker (separate, environmental — logged, not fixed)") | Add a `> ⚠️ QUESTIONABLE (Phase 92 D-13): ...` note flagging the imgproxy/pooler diagnosis as unverified |
| `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` | 102-105 | Same questionable annotation |
| `tests/scripts/diff-playwright-reports.ts` | (contains `imgproxy`/`pooler` references) | Inspect — if it encodes the diagnosis as a DATA_RACE rationale, add `// reason:`-style questionable note inline `[ASSUMED — needs the planner to read the exact lines]` |

The canonical phrasing (q22 SUMMARY:54-57): *"Storage/imgproxy containers healthy; `supabase_edge_runtime` + `supabase_pooler` were stopped. This is the already-tracked imgproxy/storage-decoupling flakiness — it blocks reaching step 22 in a cold env but is unrelated to the answers data model."* `[VERIFIED: read]`

No inline annotation site exists in `tests/tests/setup/*` (the diagnosis lives in planning docs + the diff script, not in setup code). `[VERIFIED: grep tests/ for edge_runtime/imgproxy/pooler]`

**Recommendation:** use the repo's `// reason:` convention (CLAUDE.md) for the diff-script inline note, and a `> ⚠️ QUESTIONABLE — Phase 92 D-13` blockquote for the two markdown sites. This is pure annotation; do NOT re-investigate.

---

## WS5 — Freshness guard fix (D-14, D-15)

### Root cause — verified against the live local DB

The guard (`probeFreshDatabasePrecondition`) queries candidates + organizations for any row whose `external_id` is `.not('external_id','like','${prefix}%')`, scoped `.eq('project_id', TEST_PROJECT_ID)`. `[VERIFIED: read setupFromTemplate.ts:91-121 + data.setup.ts:28-39]`

**Two probe implementations, two prefixes:**
- `setup/setupFromTemplate.ts:159` passes `teardownPrefix` (the template's prefix).
- `setup/data.setup.ts:106` passes a module-local `PREFIX = 'test-'` (`data.setup.ts:14`). `[VERIFIED: read]`

**The ~2 false-positive rows are NOT the `seed.sql` candidate.** I verified on the running local DB: `[VERIFIED: psql to 127.0.0.1:54322]`
- `seed.sql` inserts one candidate (`id …020`, `external_id IS NULL`) and **no organizations** (`SELECT count(*) FROM organizations` = 0). `[VERIFIED: psql + read seed.sql:96-106]`
- In PostgreSQL, `NULL NOT LIKE 'test-%'` evaluates to NULL (unknown), so the `.not(...like...)` probe **excludes** the NULL-external_id seed candidate. Confirmed: `SELECT id FROM candidates WHERE project_id='…001' AND external_id NOT LIKE 'test-%'` returns **zero rows** on the current DB. `[VERIFIED: psql]`

**So where do the false positives come from?** From the **dev-seed `default` template**, which seeds candidates/organizations with `externalIdPrefix: 'seed_'` into the SAME `TEST_PROJECT_ID`. `[VERIFIED: read templates/default.ts:38 + ctx.ts:89]` When a developer runs `yarn db:reset-with-data` (= `supabase:reset` + `db:seed --template default`) and then runs e2e (which expects only `test-`/`e2e-perm-` prefixed rows), the `seed_`-prefixed candidates/orgs match `external_id NOT LIKE 'test-%'` → the guard reports "Database is NOT fresh". The `e2e` and `baseV1` templates use `externalIdPrefix: ''` with literal `test-…` ids, so they never collide. `[VERIFIED: read templates/e2e.ts:128 + baseV1.ts:349]`

### Recommendation: reuse `seed_` as the baseline sentinel (do NOT introduce `global-seed`)

`seed_` is **already** the dev-seed default prefix (`ctx.ts:89`, `writer.ts:142`, `templates/default.ts:38`). `[VERIFIED: read]` Reusing it requires **zero seed-mechanism changes** — every `default`-template baseline row already carries it. Introducing a new `global-seed` sentinel would require re-prefixing the `default` template's rows and any other persistent-baseline emitter, with no benefit over the existing, already-consistent `seed_`.

> Note on the `seed.sql` candidate: it has `external_id IS NULL`, not a `seed_` prefix. It is already invisible to the probe (NULL excluded by `NOT LIKE`). If you want it positively recognized as baseline rather than relying on NULL-exclusion semantics, optionally give it `external_id = 'seed_default-candidate'` in `seed.sql:96-106` — but this is NOT required to fix the reported false-positive (the NULL row is already not counted).

### Exact query change — BOTH probes

In **`tests/tests/setup/setupFromTemplate.ts`** (`probeFreshDatabasePrecondition`, ~lines 96-103) and **`tests/tests/setup/data.setup.ts`** (~lines 33-39), add a second `.not(...like...)` clause excluding the baseline prefix. Recommend a shared constant:

```ts
// add near the top of each file (or a shared helper)
const BASELINE_SEED_PREFIX = 'seed_';  // dev-seed `default` template prefix (ctx.ts:89)

// candidates probe — was:
//   .not('external_id', 'like', `${prefix}%`)
// becomes:
const { data: nonTestCands, error: candErr } = await client.query('candidates')
  .not('external_id', 'like', `${prefix}%`)
  .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
  .limit(5);
// identical change for the organizations probe
```

**Behavior preservation (D-14):** the `E2E_REQUIRE_FRESH_DB === 'true'` hard-fail branch and the default `console.warn` path are untouched — only the detection query narrows. `[VERIFIED: read guard logic]`

**PostgREST semantics confirmation:** chained `.not('external_id','like',X).not('external_id','like',Y)` produces `external_id NOT LIKE X AND external_id NOT LIKE Y` — both `seed_` and `test-` rows excluded, NULL rows still excluded. `[VERIFIED: psql behavior of NOT LIKE + AND]`

**Shared-constant opportunity:** the two probe implementations are near-duplicates (the `setupFromTemplate.ts` docstring says it was "hoisted out of data.setup.ts verbatim"). `[VERIFIED: read]` Consider extracting one shared `probeFreshDatabasePrecondition` to a helper so the prefix-list fix lives in one place — reduces the WS5 surface from 2 edits to 1 + 2 call-site updates.

---

## Runtime State Inventory

> Phase 92 is config/test-infra hardening, not a rename. But WS5 touches DB-state detection, so the relevant categories:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Local Supabase DB candidates/orgs: `seed.sql` baseline candidate (external_id NULL); `default`-template `seed_`-prefixed rows when `db:reset-with-data` was run | None — the guard CODE changes to recognize `seed_` as baseline; no data migration |
| Live service config | None — local Supabase only; no remote service config embeds these prefixes | None — verified by grep (no remote service refs) |
| OS-registered state | None — no OS-level registrations involved | None — verified (test infra only) |
| Secrets/env vars | `E2E_REQUIRE_FRESH_DB` env var (read by both guards) — NOT renamed, behavior preserved | None |
| Build artifacts | None new. `tests/tsconfig.json` is a new committed config, not a build artifact | None |

## Common Pitfalls

### Pitfall 1: Assuming `no-raw-locators` covers `getByText`
**What goes wrong:** The rule is named "raw locators" and is already set to error, so it looks like D-01 is half-done. But it only catches `.locator()` with a string arg — `getByText` slips through and its own message *recommends* `getByText`.
**Why it happens:** The rule's intent (in upstream) is to push people toward `getByRole`/`getByText`, not away from `getByText`.
**How to avoid:** Use `no-restricted-locators` listing `getByText` + `locator` explicitly. Verify by linting `entityDetails.fixture.ts:136` after the change.
**Warning signs:** Lint passes but `grep getByText tests/tests` still finds hits.

### Pitfall 2: Missing `DOM` lib in the tests tsconfig
**What goes wrong:** `tsc` reports `TS2584: Cannot find name 'document'` in `missingNominations.ts` and inflates the error count.
**Why it happens:** The shared base sets `lib: ["es2022"]` (no DOM); but `page.evaluate(() => document...)` callbacks reference browser globals that TS type-checks.
**How to avoid:** Set `lib: ["ES2022","DOM","DOM.Iterable"]` in `tests/tsconfig.json`.
**Warning signs:** A cluster of `document`/`window`/`HTMLElement` "cannot find name" errors.

### Pitfall 3: `testMax` > playwright.config `timeout` is a no-op without `test.setTimeout`
**What goes wrong:** A central `testMax: 120_000` doesn't actually extend a test past the 90_000 global ceiling unless the spec calls `test.setTimeout(testMax)`.
**Why it happens:** Per-test timeout is set by the config global; a constant is just a number until applied.
**How to avoid:** Where specs need > 90s (perm-localisation 180_000, voter-mega 120_000), confirm they call `test.setTimeout(...)`; keep those as inline `// reason:` exceptions per D-12.
**Warning signs:** A test still times out at 90s despite a higher `testMax`.

### Pitfall 4: Migrating callback/deep-link `page.goto` to `goToPage`
**What goes wrong:** D-09 says "every `page.goto` … gets a fixture", but ~6 `goto`s target dynamic OIDC/email callback URLs (`registrationCallbackUrl`, `resetCallbackUrl`, `deferredTarget`), not named pages.
**Why it happens:** Over-literal reading of "all page.goto".
**How to avoid:** Scope D-09 to *named-route* navigations. Leave genuine callback/deep-link gotos inline (no lint rule forbids raw `goto` today).
**Warning signs:** A fixture `goToPage` that takes a freeform URL string — that's a smell; it should take a `Route` key + locale.

### Pitfall 5: Editing only ONE freshness guard
**What goes wrong:** `setupFromTemplate.ts` and `data.setup.ts` both have a `probeFreshDatabasePrecondition`. Fixing one leaves the other false-positiving.
**How to avoid:** Change both (or extract a shared helper). They use DIFFERENT prefix sources (`teardownPrefix` vs module-local `PREFIX='test-'`).
**Warning signs:** Guard still warns from the unmigrated setup path.

## Code Examples

### `goToPage(locale?)` per-page fixture (D-06/D-08) — adapted from the in-tree reference
```ts
// Source: tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts:75-89 (VERIFIED reference)
//         + tests/tests/utils/buildRoute.ts (VERIFIED locale builder)
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

### `no-restricted-locators` config (D-01)
```js
// Source: eslint-plugin-playwright@2.9.0 dist/index.cjs:1758-1800 (VERIFIED rule source)
// tests/eslint.config.mjs — inside the rules block
'playwright/no-restricted-locators': ['error', [
  { type: 'getByText', message: 'getByText forbidden — use getByTestId or getByRole.' },
  { type: 'locator',   message: 'Raw .locator() forbidden — use getByTestId or getByRole.' }
]],
```

### Freshness-guard query change (D-15)
```ts
// Source: tests/tests/setup/setupFromTemplate.ts:96-103 + data.setup.ts:33-39 (VERIFIED)
const BASELINE_SEED_PREFIX = 'seed_'; // dev-seed default template prefix (packages/dev-seed/src/ctx.ts:89)
const { data: nonTestCands, error: candErr } = await client.query('candidates')
  .not('external_id', 'like', `${prefix}%`)
  .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
  .limit(5);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/voter/*` Page-Object classes | Function-fixtures + composition roots | Phases 88-91 (ongoing) | Voter page-objects deleted; WS2 rebuilds them as fixtures |
| Per-spec local `TIMEOUT` objects | Central `helpers/timeouts.ts` (this phase) | Phase 92 | WS3 consolidates |
| `no-raw-locators` only | `no-restricted-locators` (covers `getByText` + non-string `.locator`) | Phase 92 | WS1 closes the `getByText` gap |
| `tests/` untypechecked | Committed `tests/tsconfig.json` + `typecheck:tests` script | Phase 92 | WS1 |

**Deprecated/outdated:**
- `jose.KeyLike` type — removed in jose v6 (installed: 6.2.1). `candidate-bank-auth.spec.ts:94` must migrate to `CryptoKey`. `[VERIFIED: tsc + jose package.json]`
- `dev:*` script aliases — deprecated through v2.10 in favor of `db:*` (CLAUDE.md); irrelevant to this phase but note when writing new scripts: use `db:*`/canonical names.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding a bare `tests/tsconfig.json` (not making `tests/` a workspace) is the minimal correct typecheck wiring | WS1-typecheck | Low — if a future need for project-refs arises, the tsconfig can be promoted; the `--noEmit` check is independent |
| A2 | The `translations.type.ts` TS2304 error disappears once the tsconfig is scoped to `tests/` (cross-package leak) | WS1-typecheck | Low-Medium — if it persists, it's a frontend-side type issue out of WS1 scope; the planner should confirm with a scoped `tsc` run |
| A3 | `default = 'en'` for `goToPage(locale?)` matches current behavior (most `goto`s hardcode `/en/`) | WS2 | Low — verified most call sites use `/en/`; a few use `buildRoute({locale:'en'})` already |
| A4 | The `tests/scripts/diff-playwright-reports.ts` imgproxy/pooler reference encodes the questionable diagnosis | WS4 | Low — needs the planner to read the exact lines before annotating; flagged as `[ASSUMED]` |
| A5 | Reusing `seed_` (vs a new `global-seed` sentinel) is sufficient because the `default` template already emits it into TEST_PROJECT_ID | WS5 | Low — verified the `default` template prefix; if some OTHER persistent-baseline emitter uses a different prefix, that prefix must also be added to the exclusion list |

## Open Questions

1. **Does WS1 green the full lint suite or only locator rules?**
   - What we know: `eslint … tests` reports 37 errors today (mostly refactor-residue: `expect-expect` ×23, import-sort ×5).
   - What's unclear: D-05 says "fix all surfaced errors/warnings" but is framed around typecheck.
   - Recommendation: green the full lint suite — a red `lint:check` would make the new typecheck gate unenforceable in the same pipeline. Confirm scope with the operator at planning.

2. **`testMax` buckets > 90s — apply via `test.setTimeout`?**
   - What we know: playwright.config global `timeout: 90000`; two specs declare `testMax` of 120_000/180_000.
   - What's unclear: whether those specs already call `test.setTimeout`.
   - Recommendation: planner verifies per-spec; keep > 90s values as inline `// reason:` exceptions (D-12).

3. **Voter home/intro load-anchor testIds**
   - What we know: catalog has `voter.home.startButton`, `voter.intro.startButton` (action elements), but no page-content anchor.
   - What's unclear: whether to add new `data-testid`s to the frontend home/intro roots or reuse the start buttons.
   - Recommendation: add a minimal page-root `data-testid` to the home/intro pages and register in the catalog — keeps `expectPageVisible` semantically a "page loaded" check, not an "action button present" check.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript (`tsc`) | WS1 typecheck | ✓ | 5.9.3 (`./node_modules/.bin/tsc`) | — (note: `yarn tsc` fails; use the bin path or add a passthrough script) |
| ESLint + eslint-plugin-playwright | WS1 lint | ✓ | eslint catalog + plugin 2.9.0 | — |
| `@playwright/test` | suite | ✓ | 1.58.2 | — |
| Local Supabase DB (psql 54322) | WS5 verification (research only) | ✓ (was running) | local | Not needed at execution — WS5 is a code edit, not a DB op |
| `@openvaa/dev-seed` | WS5 prefix grounding | ✓ | workspace | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — all tooling present.

## Validation Architecture

> `workflow.nyquist_validation` is absent in `.planning/config.json` (workflow keys present: research/plan_check/verifier/use_worktrees). Treated as enabled per the absent=enabled rule. However, this phase's "tests" ARE the E2E suite itself, so validation is meta: the deliverables are validated by the suite's own green lint + green typecheck + green run.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (`@playwright/test`) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn eslint --flag v10_config_lookup_from_file tests` (lint) + `tsc -p tests/tsconfig.json --noEmit` (typecheck) |
| Full suite command | `yarn test:e2e` (requires `yarn dev` running) |

### Phase Requirements → Test Map
| WS | Behavior | Test Type | Automated Command | Exists? |
|----|----------|-----------|-------------------|---------|
| WS1-tc | tests/ typechecks clean | static | `tsc -p tests/tsconfig.json --noEmit` | ❌ Wave 0 (create tsconfig) |
| WS1-lint | forbidden locators error | static | `yarn eslint --flag v10_config_lookup_from_file tests` | ✅ (rule swap) |
| WS2 | fixtures navigate+assert | runtime | `yarn test:e2e` (existing specs exercise fixtures) | ✅ existing specs |
| WS3 | timeouts import-resolve | static | `tsc -p tests/tsconfig.json --noEmit` | ✅ via typecheck |
| WS4 | annotations present | manual/grep | `grep -rn QUESTIONABLE .planning tests` | ✅ |
| WS5 | guard excludes seed_ | runtime | run setup against a `db:reset-with-data` DB; assert no "NOT fresh" warn | ⚠️ manual verification |

### Sampling Rate
- **Per task commit:** `yarn eslint --flag v10_config_lookup_from_file tests` + `tsc -p tests/tsconfig.json --noEmit`
- **Per wave merge:** the above + a targeted `yarn test:e2e --project=<affected>` for WS2-touched specs
- **Phase gate:** full lint green + full typecheck green + a representative `yarn test:e2e` run before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/tsconfig.json` — create (WS1; ~5 errors to fix on first run)
- [ ] `tests/tests/helpers/timeouts.ts` — create (WS3)
- [ ] Root `typecheck:tests` script + lint-pipeline wiring (WS1)
- [ ] testId catalog extension for voter home/intro anchors (WS2)

## Security Domain

> `security_enforcement` is undefined in `.planning/config.json` (absent = enabled). However, Phase 92 touches only test-infrastructure tooling — no auth, session, access-control, crypto, or user-input-handling product code is modified.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase touches test infra, not auth code |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | No user-input surface changed |
| V6 Cryptography | marginal | `candidate-bank-auth.spec.ts:94` `jose.KeyLike→CryptoKey` is a TEST helper building a mock JWT — no production crypto. Do not weaken the mock; keep the same algorithm. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Test seed/baseline data leaking into a real DB | Tampering | The freshness guard itself (WS5) — keep warn-only default; `E2E_REQUIRE_FRESH_DB=true` for CI hard-fail |
| Forbidding `getByText` weakening a11y coverage | (false alarm) | `getByRole` stays allowed (D-02) — a11y-semantic access preserved |

## Sources

### Primary (HIGH confidence)
- Live codebase reads: `tests/eslint.config.mjs`, `tests/playwright.config.ts`, all 4 `TIMEOUT` objects, `candidateQuestionsOverviewPage.fixture.ts`, `candidate-mega.ts`, `views.ts`, `buildRoute.ts`, `testIds.ts`, `setupFromTemplate.ts`, `data.setup.ts`, `seed.sql`, dev-seed `ctx.ts`/`writer.ts`/`templates/*.ts`
- `eslint-plugin-playwright@2.9.0` `dist/index.cjs` rule source (read `no-raw-locators` :1707-1750 and `no-restricted-locators` :1758-1800)
- `tsc --noEmit` probe run over `tests/` (5-error backlog quantified)
- Live local Supabase DB via `psql 127.0.0.1:54322` (NULL external_id seed candidate, 0 orgs, NOT-LIKE-NULL exclusion confirmed)
- `node -e require(...)` version checks: playwright 1.58.2, eslint-plugin-playwright 2.9.0, typescript 5.9.3, jose 6.2.1
- `git status` + `find tests/tests/pages` (voter page-objects deleted)

### Secondary (MEDIUM confidence)
- `github.com/mskelton/eslint-plugin-playwright/blob/main/docs/rules/no-restricted-locators.md` (options confirmed; chained-call behavior confirmed via source read, not docs)

### Tertiary (LOW confidence)
- None used for load-bearing claims.

## Metadata

**Confidence breakdown:**
- WS1 typecheck: HIGH — backlog measured directly via `tsc`
- WS1 lint: HIGH — rule behavior read from installed source, not docs
- WS1 testId sweep: MEDIUM — split requires per-component review
- WS2 fixtures: HIGH — reference implementation + buildRoute verified in-tree
- WS3 timeouts: HIGH — all 4 TIMEOUT objects read; value-conflicts surfaced
- WS4 annotation: HIGH for the 2 markdown sites; MEDIUM for the diff-script (needs exact-line read)
- WS5 guard: HIGH — root cause verified against the live DB and template prefixes

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (stable infra; the only fast-mover is the uncommitted refactor in `git status` which may shift exact line numbers — re-grep at plan time)
