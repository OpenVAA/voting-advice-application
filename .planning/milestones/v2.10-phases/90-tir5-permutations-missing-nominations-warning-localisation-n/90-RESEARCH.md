# Phase 90: TIR5 permutations — missing-nominations warning + localisation negative/positive — Research

**Researched:** 2026-05-29
**Domain:** E2E test fixture authoring, dev-seed perm templates, Playwright multi-project chains, i18n/multilingual UI surface
**Confidence:** HIGH for everything verified in-codebase; HIGH on the locale PRODUCT-GAP

## Summary

Phase 90 mirrors Phase 89-04's perm pattern (`perm-disable-voter-app`, `perm-disable-candidate-app`, `perm-per-app-notifications`) to add **three new permutation chains**: missing-nominations, localisation-negative, localisation-positive. The perm-template + setup/spec/teardown chain + function-fixture composition root patterns are all established and ready to mirror.

**Critical PRODUCT-GAP confirmed** (lifted forward from Phase 74 D-04): `staticSettings.supportedLocales` is a **build-time hardcoded array** consumed by Paraglide's compile-time runtime. There is **NO runtime override mechanism** — `app_settings.settings` JSONB (the per-perm overridable surface) does NOT control the locale list. The TIR5 negative perm's "**one supported language**" precondition cannot be enforced by perm-template alone. The positive perm's "**two languages en+fi**" is satisfied accidentally (current `supportedLocales` already has 4 — en/fi/sv/da — so the language selector DOES render today; the positive perm's "en+fi" assertion would pass against 4-locale config but fail TIR5's strict-only-en-and-fi clause).

**Primary recommendation:** Phase 90 must be planned in TWO stages (sequential, gated):
1. **Stage A (PRODUCT wiring, required first):** Implement a runtime override mechanism for `supportedLocales` driven from `app_settings.settings` (canonical extension to the existing JSONB schema). Without this, the negative perm cannot be authored. The positive perm CAN run against current 4-locale config but loses TIR5 fidelity.
2. **Stage B (Phase 90 proper, dependent on A):** Apply the locked D-90-XX decisions verbatim — author three perm templates, three function-fixtures (missing-nominations is fixture-light), three setup/spec/teardown chains. Mirror 89-04 structure.

Operator should resolve Stage A scoping at discuss-phase BEFORE Stage B planning begins. Two viable paths: (a) extend Phase 90 to include the wiring (estimate +1 plan); (b) split into Phase 90-PRE (wiring) → Phase 90 (perms) — cleanest, mirrors 89-LAST / 89-MAIN split. Recommended: option (b).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Missing-nominations modal rendering | Frontend Server (SSR) / Browser | Database (nominations table) | `apps/frontend/src/routes/(voters)/(located)/+layout.svelte:183-220` — Svelte-side reactive modal driven by `voterCtx.nominationsAvailable` (data from DB) |
| Language selector rendering | Browser (Svelte component) | Frontend Server (paraglide compile-time) | `LanguageSelection.svelte:32` — conditional on `locales.length > 1`, where `locales` is the Paraglide-compiled array |
| Multilingual text-field rendering | Browser (Svelte component) | — | `Input.svelte:111+392-450, 646-660` — driven by `multilingual && locales.length > 1` |
| `customData.disableMultilingual` plumbing | Frontend Server (data model) + Browser (input type selection) | — | `packages/app-shared/src/data/customData.type.ts:30` + `QuestionInput.svelte:72-77` |
| Perm dataset seeding | Database / Storage | — | `packages/dev-seed/` pipeline → Supabase Admin Client |
| Perm chain orchestration | Test Framework (Playwright) | — | `tests/playwright.config.ts` projects + dependencies |
| Voter-side localised answer rendering | Browser | Database (JSONB `text[locale]`) | `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte:107` → `InfoAnswer` → `question.formatAnswer` |

## Project Constraints (from CLAUDE.md)

- **Svelte 5 context destructuring rule:** Reactive accessors MUST be read via `ctx.X` inside `$derived`, not destructured. Stable refs (`t`, `getRoute`, stores like `appSettings`/`darkMode`) MAY be destructured. Phase 90 fixtures inspect rendered DOM only — no consumer code to refactor — but any **new candidate-app code** for Stage A wiring must follow this rule.
- **Yarn 4 workspaces + Turborepo** build dependencies — Stage A wiring requires `yarn build` after `packages/app-shared` change.
- **No hand-rolled custom solutions** when an established perm template/fixture pattern exists — 89-04 is the canonical mirror target.
- **`yarn test:e2e` requires `yarn dev` running locally** — Phase 90 specs run under existing infra.
- **TypeScript strict; no `any`; explicit types** — applies to new fixture files.
- **WCAG 2.1 AA** — no a11y additions in scope (TIR6); existing components already comply.
- **Localisation:** All user-facing strings support multiple locales (perm dataset construction respects this).
- **Check Code Review Checklist** at `.agents/code-review-checklist.md` before final review.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-90-01:** Three new perm templates following 89-04 pattern under `packages/dev-seed/src/templates/permutations/`. Each TIR5 perm gets its own template; no shared multi-perm datasets; each gets its own `externalIdPrefix` (e.g., `e2e-perm-missnoms-`, `e2e-perm-l10n-neg-`, `e2e-perm-l10n-pos-`).
- **D-90-02:** Minimal data literal-from-TIR5. Missing-nominations: 2 elections / 1 shared CG / 1 CO / 1 org / 1 candidate / 1 nomination in el-1 only. Localisation-negative: 1/1/1/1/1/1 + 2 categories × 2 questions (q2/q4 carry `customData.disableMultilingual = true`); ToU=true + answers to all 4 questions; **one supported language**. Localisation-positive: same as negative but `supportedLanguages: ['en','fi']`; English-only seeded answers; Finnish answers authored by the spec.
- **D-90-03:** Question IDs and `[id] desc` text format inherited from 88-01 / 89-01 lineage. Specs assert on stable IDs, not text-substring matches.
- **D-90-04:** Two new function-fixtures: `langSelectorFixture` and `multilingualTextFieldFixture`. Living under `tests/tests/fixtures/candidate/`. Strict-fixture semantics; no fallbacks; no soft assertions.
- **D-90-05:** Plan partition deferred to planner. Three options: per-perm (3 plans), fixture-first (2 plans), single bundle (1 plan).
- **D-90-06:** Strict testid-driven selectors only. New testids enumerated in the plan with component path.
- **D-90-07:** Voter-side cross-check (positive perm) lives in the **same perm spec file** as candidate-side authoring. Does NOT mutate `voter-mega-journey.spec.ts`.
- **D-90-08:** Three new project chains in `tests/playwright.config.ts` (9 total entries: 3 setup + 3 spec + 3 teardown). Parallel-safe via per-template `externalIdPrefix`. No removal of existing projects.
- **D-90-09:** Rewrite from scratch; old tests are guidance only.

### Claude's Discretion

- Exact filenames for the three perm templates, perm spec files, setup/teardown wrappers, and playwright-project entry names.
- Whether the missing-nominations spec needs a voter-side fixture or can drive the assertion directly with raw locators.
- Exact testid additions to candidate-app i18n components.
- Whether `langSelectorFixture` lives under `fixtures/candidate/` or `fixtures/shared/`.
- Internal implementation of `multilingualTextFieldFixture` — composes with `candidateProfilePage` + `candidateQuestionPage` fixtures or standalone.

### Deferred Ideas (OUT OF SCOPE)

- TIR6 backlog (all items): 3.3.1 candidate-translation, 4.2.x A11Y-02 persistence, 5.1.x A11Y-01 validation matrix, 7.1.x hero/hideHero/read-only-warning.
- Voter-mega-journey extensions covering multilingual answer rendering.
- Retirement of `candidate-translation.spec.ts` 3.3.1 — stays alive past Phase 90.
- 89-04's `QuestionInCardContent` election-specificity TODO (Gate A.4).
- `customData.disableMultilingual` wiring — NOT a gap (already wired). The locale-count override IS a gap (see below).

## Phase Requirements

> Researcher proposes the following REQ IDs (none were assigned). Planner materialises in PLAN.md.

| ID | Description | Research Support |
|----|-------------|------------------|
| PERM-MN-01 | Missing-nominations warning surfaces when one of two selected elections has zero nominations | `voter-missing-nominations-modal` testid + per-election rendering at `apps/frontend/src/routes/(voters)/(located)/+layout.svelte:200-209` confirmed present + functional |
| PERM-L10N-NEG-01 | With `locales.length === 1`, language selector is hidden in navigation | `LanguageSelection.svelte:32` gates on `locales.length > 1` — assertion is structurally testable BUT requires Stage A wiring to set locale count to 1 |
| PERM-L10N-NEG-02 | With `locales.length === 1`, translation-options toggle is hidden on profile-page info questions q1+q2 | `Input.svelte:646-660` button gated on `multilingual && locales.length > 1` — assertion is structurally testable IF Stage A locale count = 1 |
| PERM-L10N-NEG-03 | With `locales.length === 1`, translation-options toggle is hidden in opinion-question open-answer comment q3+q4 | Same gating; opinion editor multilingual surface = `Input type="textarea-multilingual"` at `[questionId]/+page.svelte:296` (renders ONLY when `customData.allowOpen === true`) — see Open Question 1 |
| PERM-L10N-POS-01 | With locales=[en,fi], language selector visible with both locales | `LanguageSelection.svelte:34-41` renders `NavItem` per locale, disabled-state on current |
| PERM-L10N-POS-02 | Locale switch via language selector changes UI text (en→fi→en) | `LanguageSelection` uses `localizeHref` + `data-sveltekit-reload` — full page reload changes locale |
| PERM-L10N-POS-03 | Profile q1 shows English answer + translation-options visible | `Input.svelte:392-450, 654` |
| PERM-L10N-POS-04 | Open translations on q1 → add Finnish value → close → Finnish hidden | `handleToggleTranslations` at `Input.svelte:137-140`; per-locale field rendered conditional on `isTranslationsVisible` |
| PERM-L10N-POS-05 | Profile q2 (disableMultilingual=true) shows NO translation-options | `QuestionInput.svelte:72-77` skips `text-multilingual` → `Input.svelte:111` `multilingual === false` → button hidden |
| PERM-L10N-POS-06 | Same pattern on opinion-questions editor for q3 (open-answer comment) and q4 (no comment) | Opinion editor uses HARD-CODED `textarea-multilingual` for comment; respects `customData.allowOpen` — see Open Question 1 |
| PERM-L10N-POS-07 | Voter-side candidate-details panel: answers in active locale, switch to fi reveals Finnish q1+q3 answers | `EntityInfo.svelte:107` uses `question.formatAnswer` → resolves localised text via `translate()`; `entity-details` + `voter-entity-detail-info` + `voter-entity-detail-opinions` testids already exist |

## Standard Stack

### Core (already in place — no version bumps needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | per repo `package.json` | E2E framework | Established in tests/ workspace |
| `@openvaa/dev-seed` | workspace | Template-driven Supabase seeding | Canonical perm-template surface (88-03 / 89-04) |
| `@openvaa/app-shared` | workspace | `staticSettings`, `customData.type`, `MINIMAL_BASE_APP_SETTINGS` | Settings + customData typings |
| `@inlang/paraglide-js` | per `vite.config.ts` | Compile-time i18n runtime | Generates `$lib/paraglide/runtime` with statically-known `locales` array |
| `sveltekit-i18n` wrapper | n/a | Wraps Paraglide's `m.*` messages | Existing |
| Supabase JS / admin client | per `tests/tests/utils/supabaseAdminClient.ts` | Test-side DB writes + email triggering | Established |

No NEW external packages required for Stage B. Stage A wiring may need minor extensions to `@openvaa/app-shared`'s `StaticSettings` types or `app_settings.settings` schema (no new packages).

### Supporting

| Library / Module | Path | Purpose |
|---|---|---|
| `setupFromTemplate` | `tests/tests/setup/setupFromTemplate.ts` | Generic chain-setup helper — Phase 90 invokes via `setupFromTemplate('<perm-name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })` |
| `runTeardown` | from `@openvaa/dev-seed` | Per-prefix DB row teardown — invoked in `*.teardown.ts` files |
| `SupabaseAdminClient.sendEmail` | `tests/tests/utils/supabaseAdminClient.ts` | Triggers registration email (Inbucket) — **required** for candidate login because seeded candidates have NO `auth.users` row |
| `LanguageSelection.svelte` | `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` | Locale selector |
| `Input.svelte` | `apps/frontend/src/lib/components/input/Input.svelte` | Multilingual text input rendering |
| `QuestionInput.svelte` | `apps/frontend/src/lib/components/input/QuestionInput.svelte` | Wraps Input + handles `customData.disableMultilingual` |
| `EntityInfo.svelte` / `EntityOpinions.svelte` / `EntityDetails.svelte` | `apps/frontend/src/lib/dynamic-components/entityDetails/` | Voter-side candidate-details rendering |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `customData.disableMultilingual` data-side | Per-route `disableMultilingual` prop on `<QuestionInput>` | Already used at `profile/+page.svelte:228` for locked-question section — but that's route-level, not per-question; TIR5 wants per-question gating which only `customData.disableMultilingual` achieves |
| Runtime `supportedLocales` override via `app_settings` JSONB | Build per-perm Frontend image | Rebuild approach impractical for E2E parallel-safe runs; runtime override is canonical |
| Separate spec per perm | Bundled spec with three test() blocks | TIR5 D-90-08 already locked separate chains — three project entries each |

## Package Legitimacy Audit

No new external packages are installed by Phase 90. Stage B uses only workspace packages + already-installed test dependencies. Stage A (if scoped in) extends existing types; no new dependencies.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | — |

slopcheck not invoked because no install step exists. Workspace-internal imports only.

## Architecture Patterns

### System Architecture Diagram

```
                  ┌─────────────────────────────────────────────────┐
                  │ tests/playwright.config.ts                      │
                  │   3 perm chains appended                        │
                  │     setup → spec → teardown each                │
                  │     extraTeardownPrefix: ['test-','e2e-perm-']  │
                  └──────────────┬──────────────────────────────────┘
                                 │ invokes
                                 ▼
              ┌──────────────────────────────────────────────────┐
              │ tests/tests/setup/perm-<name>.setup.ts           │
              │   setupFromTemplate('perm-<name>', { extra... }) │
              └──────────────┬───────────────────────────────────┘
                             │ lookup in BUILT_IN_TEMPLATES
                             ▼
            ┌─────────────────────────────────────────────────────┐
            │ packages/dev-seed/src/templates/permutations/       │
            │   perm-missing-nominations.ts                       │
            │   perm-localisation-negative.ts                     │
            │   perm-localisation-positive.ts                     │
            │   each carries unique externalIdPrefix              │
            └─────────────────┬───────────────────────────────────┘
                              │ feeds into
                              ▼
              ┌──────────────────────────────────────────────────┐
              │ runPipeline + fanOutLocales + Writer.write       │
              │ → Supabase (rows + app_settings JSONB)           │
              └──────────────┬───────────────────────────────────┘
                             │ spec test runs in same chain
                             ▼
        ┌────────────────────────────────────────────────────────────┐
        │ tests/tests/specs/perm/perm-<name>.spec.ts                 │
        │   imports from candidate-mega (composed function-fixtures) │
        │   + (new) langSelectorFixture + multilingualTextFieldFix.  │
        │   + (Inbucket) emailBucket for registration                │
        └────────────────────────────────────────────────────────────┘
                             │ drives
                             ▼
        ┌────────────────────────────────────────────────────────────┐
        │ Frontend (SvelteKit + Paraglide-compiled locales)          │
        │   LanguageSelection.svelte                                 │
        │   Input.svelte (multilingual surface)                      │
        │   QuestionInput.svelte (customData.disableMultilingual)    │
        │   EntityInfo / EntityOpinions / EntityDetails              │
        └────────────────────────────────────────────────────────────┘
```

### Pattern 1: Perm Template Authoring

**What:** Mirror `permutations/perm-disable-voter-app.ts`. Each template declares a unique `externalIdPrefix` (e.g., `'e2e-perm-l10n-pos-'`), spreads `MINIMAL_BASE_APP_SETTINGS`, builds questions/orgs/candidates via `shared.ts` helpers.

**Source:** `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` + `shared.ts`

**Key shape:**
```ts
const P = 'e2e-perm-<short>-';
const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  // perm-specific overrides — for Phase 90 this is where locale-count
  // override would land IF Stage A wiring lands. Example shape:
  // i18n: { supportedLocales: [{ code: 'en', isDefault: true }] }
} as const;

export const permXTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,
  elections: { count: 0, fixed: [...] },
  // ... constituency_groups, constituencies, organizations,
  // question_categories, questions, candidates, nominations
  app_settings: { count: 0, fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }] }
};
```
**Registration:** Add to `BUILT_IN_TEMPLATES` map in `packages/dev-seed/src/templates/index.ts` (verified pattern at lines 41-60).

### Pattern 2: Setup/Teardown Wrapper

**What:** Mirror `tests/tests/setup/perm-disable-voter-app.setup.ts` (3 lines of real logic) + `.teardown.ts`.

**Setup:**
```ts
setup('import perm-<name> dataset', async () => {
  await setupFromTemplate('perm-<name>', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
```

**Teardown:**
```ts
const PREFIX = 'e2e-perm-<short>-';
teardown('delete perm-<name> dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted).toBeGreaterThanOrEqual(0);
});
```

### Pattern 3: Playwright Project Chain Entry

**What:** Append three project triplets to `tests/playwright.config.ts` (after current line ~957 `perm-per-app-notifications`). Each triplet:
```ts
{ name: 'data-setup-perm-<name>', testMatch: /perm-<name>\.setup\.ts/, teardown: 'data-teardown-perm-<name>', dependencies: ['perm-<prev>'] },
{ name: 'data-teardown-perm-<name>', testMatch: /perm-<name>\.teardown\.ts/ },
{ name: 'perm-<name>', testDir: './tests/specs/perm', testMatch: /perm-<name>\.spec\.ts/, fullyParallel: false, use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-perm-<name>'] }
```
The chain is **sequential within the family** (HIGH-2 invariant at lines 653-660 — `app_settings` singleton clobbering risk forces sequential perm-* chains). Phase 90's three new chains depend on `perm-per-app-notifications` (the last 89-04 chain).

### Pattern 4: Function-Fixture Composition

**What:** Mirror `tests/tests/fixtures/candidate/candidate-mega.ts` composition root.

**Source:** `tests/tests/fixtures/candidate/candidate-mega.ts:86-122` (test.extend with named fixtures).

**For Phase 90:**
- Author `langSelectorFixture.fixture.ts` (factory `createLangSelector(page)` returning `{ expectVisible, expectHidden, switchTo }`).
- Author `multilingualTextFieldFixture.fixture.ts` (factory `createMultilingualTextField(page, scope)` returning `{ expectTranslationOptions, openTranslations, setLocaleValue, closeTranslations, expectLocaleHidden }`). `scope` parameter is a Locator around the parent test-id (e.g., the `candidate-profile-info-item` or `candidate-questions-comment` wrapper).
- Author a Phase-90 composition root `tests/tests/fixtures/candidate/perm-l10n.ts` (or add directly to `candidate-mega.ts` — researcher recommends a SEPARATE composition root for Phase 90 perms to avoid bloating mega's fixture surface).

### Anti-Patterns to Avoid

- **DO NOT** seed an `auth.users` row directly to bypass registration. `dev-seed` deliberately leaves `auth.users` NULL (`OrganizationsGenerator.ts:6` comment confirms). The canonical pattern is `SupabaseAdminClient.sendEmail` + Inbucket flow (used in candidate-mega-journey).
- **DO NOT** assert on text-content for localised strings — use stable `data-testid` + the `[id] desc` convention.
- **DO NOT** add `expect.soft` / `try/catch` around `expect()` / `.catch(() => null)` — rigidity contract per TIR4/TIR5 (no fallbacks, no soft assertions).
- **DO NOT** parallelise within a perm chain — perm-family chains must be sequential within the family (HIGH-2 invariant at `tests/playwright.config.ts:653-660`). `fullyParallel: false` on every spec-project entry.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seed data setup | Custom SQL inserts | `setupFromTemplate('<perm>')` + `runTeardown(PREFIX, client)` | Idempotent, pre-clears stale state, post-seed app_settings assertion baked in |
| `app_settings` shape | New keys from scratch | Spread `MINIMAL_BASE_APP_SETTINGS` and override only what differs | Avoids JSONB shape drift; aligns with 89-04 / 88-03 lineage |
| Candidate login | DB insert into `auth.users` | `client.sendEmail` → Inbucket → set password via `/candidate/auth/callback` | The auth.users table is excluded from dev-seed by design (`OrganizationsGenerator.ts:6`); canonical login path uses email + Inbucket |
| Multilingual rendering tests | Asserting on inner `<input>` `value` per locale | Use the existing `Input.svelte` testid surface + the per-locale label aria-labelledby pattern (Pattern from `Input.svelte:401-403` `id="{id}-label-{locale}"`) | Direct value access is brittle; aria-labelledby is the documented contract |
| Locale switching | Calling `setLocale()` from a fixture | Click the `LanguageSelection` NavItem (Paraglide uses `localizeHref` + `data-sveltekit-reload` — full page reload) | The selector triggers a real navigation; programmatic `setLocale` would skip the reload-driven session re-init |
| Missing-nominations warning detection | Polling `voterCtx.nominationsAvailable` from spec | Use the `voter-missing-nominations-modal` testid (already exists at `+layout.svelte:190`) | Modal is the user-facing surface and the canonical assertion target |

**Key insight:** Everything Phase 90 needs (except the locale-override PRODUCT-GAP) is already wired. Stage B is mechanical mirror-of-89-04 work. The risk is concentrated in Stage A.

## Runtime State Inventory

Phase 90 is additive (new templates, new fixtures, new spec files, new project entries). Not a rename/refactor. **No runtime state migration needed.**

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 90 creates fresh perm prefixes that are unique. | None |
| Live service config | None — Phase 90 only adds new app_settings rows with unique `external_id`. Existing rows untouched. | None |
| OS-registered state | None | None |
| Secrets/env vars | None — Phase 90 reuses existing test env vars (`E2E_REQUIRE_FRESH_DB`, Supabase admin client config). | None |
| Build artifacts | Paraglide compiled `$lib/paraglide/runtime` rebuilds when `project.inlang/settings.json` or `messages/` change. Phase 90 does NOT modify these in Stage B. **Stage A might** — verify Paraglide rebuild via `yarn dev` before tests. | If Stage A changes the locale source, `yarn build` must run before tests |

## Common Pitfalls

### Pitfall 1: Assuming `app_settings.settings` controls locales
**What goes wrong:** Perm template writer adds a `supportedLocales: ['en']` key under `APP_SETTINGS` and assumes the FE reads it. The seed succeeds, the `toMatchObject` post-seed assertion passes, but the UI still shows all 4 locales because Paraglide ignored the JSONB.
**Why it happens:** Paraglide compiles `locales` at build time from `apps/frontend/project.inlang/settings.json`. `staticSettings.supportedLocales` is read at i18n init (`apps/frontend/src/lib/i18n/init.ts:11`) but ONLY for display names and `defaultLocale` resolution — the LOCALE LIST itself comes from Paraglide.
**How to avoid:** **Stage A is REQUIRED before Stage B locale-negative perm can pass.** Without Stage A, the negative perm is structurally impossible. The positive perm CAN pass against current 4-locale config — but its assertions are weaker (`langSelector shows en+fi` is true but also shows sv+da).
**Warning signs:** Spec passes locally for the wrong reason (4 locales present, en+fi visible incidentally). Failing in CI only if config changes upstream.

### Pitfall 2: Sequential chain dependency miss
**What goes wrong:** New perm chain entry forgets `dependencies: ['perm-<prev>']`. Two perm-* setups race → `app_settings` row is clobbered mid-spec.
**Why it happens:** `app_settings` table has a SINGLE row (or `merge_jsonb_column` merges into a single row per Writer Pass-5). Two concurrent setups overwrite each other's settings.
**How to avoid:** Mirror existing perm chain — every new spec-project entry depends on the prior spec-project entry (NOT setup-project). Phase 90's first new chain depends on `perm-per-app-notifications`. Cross-chain row isolation is enforced by `extraTeardownPrefix: ['test-', 'e2e-perm-']` in setup wrappers.
**Warning signs:** Flaky perm tests; one perm's app_settings showing up in another perm's assertions.

### Pitfall 3: Candidate login without registration
**What goes wrong:** Spec calls `candidateLoginPage.login(email, password)` with seeded candidate email + made-up password. Login fails because `auth.users` has no row.
**Why it happens:** `dev-seed` deliberately excludes `auth.users` (Phase 56 scope exclusion at `OrganizationsGenerator.ts:6`). Seeded candidates have a `candidates` table row but no auth identity.
**How to avoid:** Spec must drive registration via `SupabaseAdminClient.sendEmail` → Inbucket extraction → `/candidate/auth/callback` → set password. Mirror `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:298-310`. Reuse the existing `emailBucket` fixture from `candidate-mega.ts:89-91`.
**Warning signs:** "Invalid login credentials" errors in spec; spec hangs on login submit.

### Pitfall 4: `customData.disableMultilingual` confusion with `disableMultilingual` prop
**What goes wrong:** Spec asserts "translation options hidden" against the locked-questions section of profile (lines 220-230). The locked section uses `<QuestionInput disableMultilingual>` (route-level prop). The unlocked section (lines 291-299) does NOT pass the prop and relies on `customData.disableMultilingual`.
**Why it happens:** Two distinct mechanisms suppress multilingual: prop-level (route decides) and customData-level (question decides). They OR together: `if (!disableMultilingual && !customData.disableMultilingual)`.
**How to avoid:** TIR5 q2/q4 require the **customData** mechanism. Test against the EDITABLE info-question section (line 294-299) and the opinion-question OPEN-ANSWER comment, NOT the locked section.
**Warning signs:** Test passes for the wrong reason; assertion would also pass if `disableMultilingual` route prop were set on q1 too.

### Pitfall 5: `OpinionQuestionInput` is not multilingual
**What goes wrong:** TIR5 positive perm says "edit 1st opinion question → expect to show translation options". Spec author assumes the Likert-5 widget has multilingual surface and asserts on it.
**Why it happens:** `OpinionQuestionInput.svelte` is a Likert/multi-choice picker — no multilingual handling at all. The TRANSLATABLE surface on the opinion-question editor is the OPEN-ANSWER COMMENT textarea (`<Input type="textarea-multilingual">` at `[questionId]/+page.svelte:296`), which only renders when `customData.allowOpen === true`.
**How to avoid:** The TIR5 positive perm requires q3 to have `customData.allowOpen = true` AND text content "[en-answer-q3]" entered into the COMMENT field. The multilingual assertion targets `candidate-questions-comment` testid, not `candidate-questions-answer`. Researcher recommends planner adds `customData.allowOpen = true` to q3 in the perm template — TIR5 §52-95 implies this via "should have text [en-answer-q3]" but doesn't say `allowOpen` explicitly.
**Warning signs:** "translation-options button not found" against the answer-input; testid lookup fails on `candidate-questions-comment` because `allowOpen` is false → comment block not rendered.

### Pitfall 6: Voter-side locale switch requires full page reload
**What goes wrong:** Positive perm spec calls a programmatic locale-switch (`page.evaluate(() => setLocale('fi'))`). UI doesn't update; assertions race the reload.
**Why it happens:** Paraglide's `setLocale` triggers a navigation. The canonical user surface is the language NavItem with `data-sveltekit-reload` (`LanguageSelection.svelte:36`), which causes a full reload — that is the intended UX. Programmatic API skips this.
**How to avoid:** Click the language NavItem via the `langSelectorFixture.switchTo('fi')` and `await page.waitForURL(/^\/fi\//)` before asserting on translated UI.
**Warning signs:** Flaky `expect(page).toHaveText('Suomi')` calls; intermittent locale-mix in DOM.

### Pitfall 7: Modal-shown-for-key reopen race (missing-nominations)
**What goes wrong:** Spec selects two elections, navigates to results, but the missing-nominations modal doesn't appear because the layout's `modalShownForKey` already saw this key.
**Why it happens:** `+layout.svelte:107-116` debounces modal openings per `(nomStatus, selectedElections, selectedConstituencies)` key. If a prior navigation already opened (and closed) the modal, re-entering the same route does NOT reopen.
**How to avoid:** The perm spec navigates fresh — `page.goto('/en/elections')` → select 2 elections → click continue → land on `/en/results` → modal opens on FIRST entry. Don't bounce in/out. If you need to re-trigger, use a fresh `context.newPage()` or reload.
**Warning signs:** Test passes on first run, fails on rerun within same browser context.

## Code Examples

### Example 1: Perm Template (mirror of 89-04 + locale-count override placeholder)

```ts
// Source pattern: packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts
// File: packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts

import {
  buildOrganizations,
  buildQuestionCategories,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../template/types';

const P = 'e2e-perm-l10n-neg-';

const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  // STAGE A DEPENDENCY: this key path does NOT exist in StaticSettings yet.
  // Wiring lands in Stage A (PRODUCT-GAP closure). Without it, runtime
  // locale count remains 4 and the negative-perm assertions fail.
  i18n: { supportedLocales: [{ code: 'en', isDefault: true }] }
} as const;

export const permLocalisationNegativeTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,
  elections: { count: 0, fixed: [/* 1 election */] },
  constituency_groups: { count: 0, fixed: [/* 1 cg */] },
  constituencies: { count: 0, fixed: [/* 1 co */] },
  organizations: { count: 0, fixed: buildOrganizations().slice(0, 1) },
  question_categories: { count: 0, fixed: buildQuestionCategories() },
  questions: {
    count: 0,
    fixed: [
      { external_id: 'qu-info-q1', type: 'text', name: { en: '[Q1] q1' }, category: { external_id: `${P}qc-info` }, allow_open: false, required: false, sort_order: 0, is_generated: false },
      { external_id: 'qu-info-q2', type: 'text', name: { en: '[Q2] q2' }, category: { external_id: `${P}qc-info` }, allow_open: false, required: false, sort_order: 1, is_generated: false, custom_data: { disableMultilingual: true } },
      { external_id: 'qu-opin-q3', type: 'singleChoiceOrdinal', name: { en: '[Q3] q3' }, choices: LIKERT_5_EN, category: { external_id: `${P}qc-opin` }, allow_open: true, required: true, sort_order: 100, is_generated: false },
      { external_id: 'qu-opin-q4', type: 'singleChoiceOrdinal', name: { en: '[Q4] q4' }, choices: LIKERT_5_EN, category: { external_id: `${P}qc-opin` }, allow_open: true, required: false, sort_order: 101, is_generated: false, custom_data: { disableMultilingual: true } }
    ]
  },
  candidates: { count: 0, fixed: [/* 1 candidate with ToU + 4 answers */] },
  nominations: { count: 0, fixed: [/* 1 nomination */] },
  app_settings: { count: 0, fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }] }
};

export default permLocalisationNegativeTemplate;
```

### Example 2: langSelectorFixture (D-90-04)

```ts
// File: tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export function createLangSelector(page: Page) {
  const navMenu = page.getByTestId('nav-menu');

  return {
    /** Assert the language selector is visible with EXACTLY the supplied locales. */
    async expectVisible(locales: Array<string>): Promise<void> {
      // NavGroup title is t('common.language.select'); NavItems carry t(`lang.${loc}`).
      // Strict: each expected locale must appear in a NavItem under nav-menu.
      for (const loc of locales) {
        const item = navMenu.getByTestId('nav-menu-item').filter({ hasText: new RegExp(`^${loc === 'en' ? 'English' : 'Suomi'}$`, 'i') });
        await expect(item).toBeVisible();
      }
    },

    /** Assert the language selector NavGroup is NOT rendered. */
    async expectHidden(): Promise<void> {
      // LanguageSelection.svelte:32 — NavGroup with title t('common.language.select') is the gating wrapper.
      // No dedicated testid exists today — assert ABSENCE of NavItems that exclusively appear there.
      // Researcher recommends adding `data-testid="lang-selector"` on the NavGroup wrapper (see Testid Additions).
      await expect(navMenu.getByTestId('lang-selector')).toHaveCount(0);
    },

    /** Click the NavItem for `locale` and wait for the resulting reload. */
    async switchTo(locale: string): Promise<void> {
      const label = locale === 'fi' ? 'Suomi' : 'English';
      const item = navMenu.getByTestId('nav-menu-item').filter({ hasText: new RegExp(`^${label}$`, 'i') });
      await Promise.all([
        page.waitForURL(new RegExp(`^https?://[^/]+/${locale}/`)),
        item.click()
      ]);
    }
  };
}

export type LangSelectorFixture = ReturnType<typeof createLangSelector>;
```

### Example 3: multilingualTextFieldFixture (D-90-04)

```ts
// File: tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts
// Source pattern: Input.svelte:392-450 (per-locale field rendering),
// Input.svelte:646-660 (translation-options Button rendering).

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export function createMultilingualTextField(page: Page) {
  return {
    /**
     * Assert the translation-options toggle is visible (true) or absent (false)
     * inside the scoped wrapper. The toggle is a Button rendered at
     * Input.svelte:653-658 — it has no testid today. Researcher recommends
     * adding `data-testid="multilingual-toggle"` (see Testid Additions).
     */
    async expectTranslationOptions(scope: Locator, visible: boolean): Promise<void> {
      const toggle = scope.getByTestId('multilingual-toggle');
      if (visible) await expect(toggle).toBeVisible();
      else await expect(toggle).toHaveCount(0);
    },

    async openTranslations(scope: Locator): Promise<void> {
      await scope.getByTestId('multilingual-toggle').click();
      // After click, per-non-default-locale fields render — assert at least one is visible.
      await expect(scope.getByRole('textbox').nth(1)).toBeVisible();
    },

    async setLocaleValue(scope: Locator, locale: string, value: string): Promise<void> {
      // Per Input.svelte:401-403 + 426-429, each per-locale field carries
      // id="{id}-{locale}" + aria-labelledby="{id}-label {id}-label-{locale}".
      // Lookup by accessible name is robust; the locale label is `t('lang.<locale>')`.
      const localeLabel = locale === 'fi' ? /Suomi|lang\.fi/i : new RegExp(locale, 'i');
      const field = scope.getByRole('textbox', { name: localeLabel });
      await field.fill(value);
      await field.blur();  // trigger onchange handler at Input.svelte:419/441
    },

    async closeTranslations(scope: Locator): Promise<void> {
      await scope.getByTestId('multilingual-toggle').click();
    },

    /**
     * Assert the per-locale field for `locale` is no longer in the DOM
     * (post-closeTranslations).
     */
    async expectLocaleHidden(scope: Locator, locale: string): Promise<void> {
      const localeLabel = locale === 'fi' ? /Suomi|lang\.fi/i : new RegExp(locale, 'i');
      await expect(scope.getByRole('textbox', { name: localeLabel })).toHaveCount(0);
    }
  };
}

export type MultilingualTextFieldFixture = ReturnType<typeof createMultilingualTextField>;
```

### Example 4: Missing-nominations assertion in spec

```ts
// File: tests/tests/specs/perm/perm-missing-nominations.spec.ts
import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-missing-nominations', () => {
  test('voter selects both elections → missing-nominations modal shows el-2', async ({ page }) => {
    await page.goto('/en');
    await page.getByTestId(testIds.voter.home.startButton).click();
    // election-selector list shows 2 elections — select both
    const options = page.getByTestId('election-selector-option');
    await options.nth(0).click();
    await options.nth(1).click();
    await page.getByTestId(testIds.voter.elections.continue).click();
    // (constituency picker — 1 shared CG, 1 CO, auto-advances or single click)
    // ... navigate to results
    await page.goto('/en/results');
    // Modal asserts on `some` variant (1 of 2 elections has nominations)
    const modal = page.getByTestId(testIds.voter.elections.missingNominationsModal);
    await expect(modal).toBeVisible();
    // Per +layout.svelte:200-209, each election renders with check/close icon
    // and the el-2 row shows "(no nominations for this election)" text.
    await expect(modal).toContainText(/EL2|second election/i);
    await expect(modal).toContainText(/no nominations|noNominationsForElection/i);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tests/tests/pages/candidate/*PageObject.ts` (class-based PageObjects) | `tests/tests/fixtures/candidate/*.fixture.ts` (function-fixtures + composition root) | Phase 89-02 | Phase 90 uses function-fixtures. Legacy PageObjects coexist until TIR6 retires their consumers. |
| Monolithic `e2e` template with all-locale fan-out | Per-perm minimal-data templates with `externalIdPrefix` discipline | Phase 88-03 | Phase 90 inherits — each perm gets its own template + prefix. |
| `data-testid="login-email"` ad-hoc | Centralised `tests/tests/utils/testIds.ts` namespaced under `testIds.candidate.<page>.<element>` | Pre-Phase 88 | Phase 90 extends `testIds` for new additions. |
| Manual SQL teardowns | `runTeardown(prefix, client)` with 2-char prefix guard | Phase 56+ | Phase 90 inherits. |
| Programmatic locale switching | NavItem click with `data-sveltekit-reload` → full reload via `localizeHref` | Paraglide adoption | Phase 90 must use the click path. |

**Deprecated/outdated:**
- The single-locale assertion path (Phase 74 D-04) — **NOT deprecated, NEVER WIRED**. PRODUCT-GAP that Phase 90 cannot work around without Stage A.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Stage A wiring places the locale-override under `app_settings.settings.i18n.supportedLocales` | Code Example 1 | Wrong location → schema mismatch in JSONB; perm template fails post-seed assertion. Operator may prefer a different override surface (env var, separate table, query string). |
| A2 | The TIR5 positive perm's "translation options" surface for q3 is the OPEN-ANSWER COMMENT textarea (requires `customData.allowOpen=true`) | Pitfall 5 + Phase Requirements PERM-L10N-POS-06 | Wrong → planner needs to confirm with operator that q3 carries `allowOpen=true`. TIR5 §52-95 is ambiguous on this. |
| A3 | The voter-side candidate-details panel localised-answer assertion (PERM-L10N-POS-07) renders Finnish answers immediately after locale switch (no extra page reload beyond the one Paraglide does) | Phase Requirements | If wrong, fixture needs an extra `await page.reload()` after `switchTo('fi')` — not a structural blocker but adds spec complexity. |
| A4 | The proposed REQ IDs (PERM-MN-01, PERM-L10N-NEG-01..03, PERM-L10N-POS-01..07) align with operator's naming convention | Phase Requirements | Operator may prefer different IDs; planner can rename freely. |
| A5 | The candidate registration flow (via `client.sendEmail`) works against perm-* datasets the same way as candidate-mega-journey | Don't Hand-Roll table row 3 | Probably correct (same code path), but Inbucket pollution across perms is worth a Wave-0 probe (see Wave 0 Gaps). |
| A6 | `LanguageSelection.svelte`'s NavGroup has no existing `data-testid` and needs one added (`lang-selector`) | Testid Additions | Operator may prefer asserting on the localised NavGroup title text instead. Researcher recommends testid for spec stability across locale switches. |

## Open Questions (RESOLVED)

> All 5 open questions resolved 2026-05-29 during plan-checker B1 remediation (#1602 Research Resolution gate). Each carries an inline RESOLVED marker citing the artifact that locked the decision.

1. **Does TIR5 q3 require `customData.allowOpen=true`?**
   - What we know: TIR5 §78-83 says "[en-answer-q3]" is entered, translation options open, fi value added. The only multilingual surface on the opinion editor is the OPEN-ANSWER COMMENT, which renders ONLY when `allowOpen=true` (`[questionId]/+page.svelte:294`).
   - What's unclear: TIR5 doesn't say `allowOpen` explicitly.
   - Recommendation: Planner sets `allowOpen=true` on q3 in the perm template. Note this in the plan.
   - **RESOLVED 2026-05-29:** Planner locked `allow_open: true` on q3 in perm-localisation-negative + perm-localisation-positive templates (`90-03-PLAN.md` Task 1 + `90-04-PLAN.md` Task 1 — perm template behavior block explicitly seeds `allow_open: true` on q3, mirroring `shared.ts:158, 170`).

2. **Stage A scoping decision — extend Phase 90 OR split?**
   - What we know: Phase 90 is currently scoped as "test-only" (CONTEXT §27 "Out of scope: ...PRODUCT-GAP wiring"). Stage A is a PRODUCT wiring change.
   - What's unclear: Whether operator wants Phase 90 to grow to include wiring OR a 90-PRE wiring phase.
   - Recommendation: Discussion-phase question. Researcher leans toward **Phase 90-PRE → Phase 90 split** to preserve test-only-phase clarity. Otherwise Phase 90 stays scoped as test-only and the negative perm's L10N-NEG-01..03 requirements gate on a separate wiring deliverable.
   - **RESOLVED 2026-05-29:** Operator-confirmed via `/gsd-progress --do` AskUserQuestion dispatch — chose "Plan Phase 90 with all 3 perms; absorb Stage A wiring as Plan 90-01" (single phase, +1 wiring plan, NO split). Locked into `90-CONTEXT.md` as **D-90-10** + new plan-partition section. Plan 90-01 implements Stage A.

3. **Should `langSelectorFixture` and `multilingualTextFieldFixture` live under `fixtures/candidate/` or `fixtures/shared/`?**
   - What we know: D-90-04 leaves this to researcher discretion. Voter-side locale switching is also needed for the positive perm's voter-side assertion.
   - Recommendation: Both fixtures under `fixtures/shared/` (NEW directory) since they target app-agnostic surfaces. Composition root for Phase 90 perms (`tests/tests/fixtures/perm-l10n.ts`) imports from both `fixtures/candidate/` and `fixtures/shared/`.
   - **RESOLVED 2026-05-29:** Planner picked `fixtures/candidate/` per `90-PATTERNS.md` analog inheritance (89-02 lineage; composition root sibling to `candidate-mega.ts`). The voter-side cross-check in 90-04 Task 2 Step C item 11 reuses the same `langSelectorFixture` (it acts on the active page regardless of app context — testid `lang-selector` is the same in candidate + voter navs). Rationale: minimise new directory creation; the fixtures are app-agnostic in behaviour but live alongside 89-02 to keep composition simple. `90-03-PLAN.md` Task 2 + `90-04-PLAN.md` Task 2 cite this location.

4. **Inbucket isolation across perm chains?**
   - What we know: Each perm chain calls `client.sendEmail` → Inbucket. Inbucket is a SHARED resource without per-chain namespacing.
   - What's unclear: Whether emails from one perm chain pollute another's `emailBucket.expectEmail()` query if chains overlap in time. The 89-04 chain runs sequential within family, so overlap is minimal — but the registration flow IS new for Phase 90 perms.
   - Recommendation: Probe Wave-0 — confirm `emailBucket.expectEmail(/REGEX/)` uses recipient-email filtering (it does, per `candidate-mega.ts:87+89-91`). Per-perm `recipientEmail` option fixture should be unique (e.g., `candidate-l10n-neg-aa@test.openvaa.local`).
   - **RESOLVED 2026-05-29:** Confirmed via existing `candidate-mega.ts:87` per-recipient Mailpit filter; each Phase 90 perm uses a unique `recipientEmail` (`candidate-l10n-neg-aa@test.openvaa.local`, `candidate-l10n-pos-aa@test.openvaa.local`). 90-03 Task 2 Step B + 90-04 Task 2 Step C item 3 enforce the per-perm recipient. Citation drift in 90-03 must_haves truth #7 and 90-04 must_haves truth #4 (which cite "Pitfall 6") is patched to "Open Question 4 + `candidate-mega.ts:87` recipient-filter contract".

5. **Does seeded `candidate.answersByExternalId` actually persist to candidate-app profile + opinion editor?**
   - What we know: `shared.ts:207-211` builds `answersByExternalId` for perm candidates. `candidate-mega-journey` does NOT use this — it authors answers via the spec.
   - What's unclear: Whether perm-seeded answers render on the profile + opinion-editor on first navigation (vs. needing the candidate to re-fill).
   - Recommendation: Wave-0 probe — `yarn db:seed --template perm-localisation-negative` then manually visit `/en/candidate/profile` and inspect.
   - **RESOLVED 2026-05-29 (Wave-0 probe P5 ran):** YES — seeded answers DO render in the candidate-app profile + opinion editor. Evidence chain:
     - `packages/dev-seed/src/supabaseAdminClient.ts:243-312` — `importAnswers` Pass 2 stitches `answersByExternalId` → `candidate.answers` JSONB column with UUID-keyed map (matched to question external_id → UUID via the questions query at lines 259-270).
     - `packages/dev-seed/src/writer.ts:128, 162` — Pass 2 of the writer pipeline executes `importAnswers` after bulk candidate insert; persisted state is `candidate.answers: { [questionUuid]: { value: ... } }`.
     - `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:222, 295` — profile reads `userData.current?.candidate.answers?.[question.id]` and renders the pre-filled value in the multilingual text field (line 222 info section, line 295 opinion section). No "re-fill" step required.
     - Conclusion: 90-03 + 90-04 perm specs' strict assertions on the en-answer-qN seeded values are SAFE — the candidate-app reads the seeded JSONB on first navigation. No probe gap remains.

## Wave-0 Gaps (PROBES to run BEFORE planner partitions)

These probes inform D-90-05 partition. Cheap, deterministic, no parallelism cost.

- [ ] **P1 — Locale source confirmation:** `grep -rn 'supportedLocales\|paraglide.*locales' apps/frontend/src/lib/i18n/init.ts apps/frontend/vite.config.ts apps/frontend/project.inlang/settings.json` — confirms the Stage A landing point is `staticSettings.supportedLocales` AND `project.inlang/settings.json`. ✅ ALREADY DONE in research; result: both are static.
- [ ] **P2 — `customData.disableMultilingual` integration:** Open `yarn db:seed --template e2e` then visit `/en/candidate/(protected)/questions/<some questionId>` for a question carrying `customData: { disableMultilingual: true }`. Confirm the comment textarea renders WITHOUT translations toggle.
- [ ] **P3 — Seeded-candidate auth path:** Confirm `client.sendEmail({ to: '<perm-candidate-email>', ... })` against a freshly-seeded perm candidate produces a registration email in Inbucket. Block: if dev-seed emits a candidate with no email column populated, Inbucket flow fails.
- [ ] **P4 — Modal-shown-for-key behaviour with 2-election seed:** Manually run `yarn db:seed --template perm-2e-shared` then walk voter flow selecting both elections — confirm `voter-missing-nominations-modal` opens for `some` variant. (Existing 89-04 chain may already cover this; check `perm-2e-asymmetric.spec.ts`.)
- [ ] **P5 — Existing translation-options testid audit:** `grep -n 'showTranslations\|hideTranslations\|multilingual' apps/frontend/src/lib/components/input/Input.svelte` — confirm no existing testid before adding `multilingual-toggle`. ✅ ALREADY DONE; result: NO testid on the toggle.
- [ ] **P6 — Inbucket recipient-email scoping:** Read `emailBucket.fixture.ts` to confirm `recipientEmail` actually filters Mailpit queries (not just labels them).
- [ ] **P7 — Perm question with `allowOpen=true`:** Confirm a perm template can set `allow_open: true` (snake_case writer field) per `shared.ts:158, 170` — yes, that's the schema field.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI (`supabase start`) | All perm dataset seeding | ✓ | per repo config | — |
| Postgres (via Supabase) | Database seed/teardown | ✓ | per Supabase image | — |
| Mailpit / Inbucket | Candidate registration email flow | ✓ (existing) | per `docker-compose.dev.yml` | — |
| `@inlang/paraglide-js` | i18n compile-time | ✓ (existing) | per `package.json` | — |
| Playwright browsers | Spec execution | ✓ (existing) | — | — |
| Yarn 4 workspaces / Turborepo | Build/dep ordering | ✓ (existing) | — | — |

**Missing dependencies with no fallback:**
- **PRODUCT capability — runtime override for `staticSettings.supportedLocales`** — does not exist. Required for PERM-L10N-NEG-01..03. Fallback: Stage A wiring (estimated 1 plan inside an expanded Phase 90 OR a new Phase 90-PRE).

**Missing dependencies with fallback:**
- None.

## Validation Architecture

> nyquist_validation is not explicitly disabled in `.planning/config.json` (no `workflow.nyquist_validation` key). Treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (per `tests/playwright.config.ts`) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/tests test --project=perm-<name>` (single perm) |
| Full suite command | `yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERM-MN-01 | Missing-nominations modal shows el-2 | E2E | `yarn workspace @openvaa/tests test --project=perm-missing-nominations` | ❌ Wave 0 |
| PERM-L10N-NEG-01 | No language selector when locales=1 | E2E | `yarn workspace @openvaa/tests test --project=perm-localisation-negative` | ❌ Wave 0 |
| PERM-L10N-NEG-02 | No translation toggle on profile q1/q2 | E2E | (bundled in NEG project) | ❌ Wave 0 |
| PERM-L10N-NEG-03 | No translation toggle on opinion-editor q3/q4 comment | E2E | (bundled in NEG project) | ❌ Wave 0 |
| PERM-L10N-POS-01..07 | Full positive perm walk (selector + switch + q1/q3 authoring + voter-side cross-check) | E2E | `yarn workspace @openvaa/tests test --project=perm-localisation-positive` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run the affected perm project only (quick — ~30-60 s per perm).
- **Per wave merge:** Run all three perm projects in the chain: `yarn workspace @openvaa/tests test --project=perm-missing-nominations --project=perm-localisation-negative --project=perm-localisation-positive`.
- **Phase gate:** Full suite green before `/gsd-verify-work`. Each perm runs a deterministic 3-run identity check post-execution (Phase 87 lineage; v2.10 standard).

### Wave 0 Gaps
- [ ] `packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts` — new
- [ ] `packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts` — new
- [ ] `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts` — new
- [ ] `packages/dev-seed/src/templates/index.ts` — register 3 new templates in `BUILT_IN_TEMPLATES`
- [ ] `tests/tests/setup/perm-missing-nominations.{setup,teardown}.ts` — new
- [ ] `tests/tests/setup/perm-localisation-negative.{setup,teardown}.ts` — new
- [ ] `tests/tests/setup/perm-localisation-positive.{setup,teardown}.ts` — new
- [ ] `tests/tests/specs/perm/perm-missing-nominations.spec.ts` — new
- [ ] `tests/tests/specs/perm/perm-localisation-negative.spec.ts` — new
- [ ] `tests/tests/specs/perm/perm-localisation-positive.spec.ts` — new
- [ ] `tests/tests/fixtures/{candidate or shared}/langSelectorFixture.fixture.ts` — new
- [ ] `tests/tests/fixtures/{candidate or shared}/multilingualTextFieldFixture.fixture.ts` — new
- [ ] `tests/tests/fixtures/{candidate or shared}/perm-l10n.ts` — composition root for L10N perms (recommended NOT to bloat `candidate-mega.ts`)
- [ ] `tests/playwright.config.ts` — append 9 new project entries (3 setup + 3 teardown + 3 spec)
- [ ] `tests/tests/utils/testIds.ts` — add new testids for `nav-menu-item` lang-selector wrapper, `multilingual-toggle`, etc.
- [ ] (Stage A) `packages/app-shared/src/settings/staticSettings.type.ts` — extend `StaticSettings` with optional `i18n.supportedLocalesOverride` (or alternative shape)
- [ ] (Stage A) `apps/frontend/src/lib/i18n/init.ts` — read override from `appSettings` if present, fall back to `staticSettings.supportedLocales`
- [ ] (Stage A) `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` — read locales from context (already does — via `getAppContext().locales`); validate the override propagates

**No existing test infrastructure covers these — all files are new (additive).**

## Testid Additions (Required New Testids)

Per D-90-06 strict-selectors. Every addition has component path + proposed string + reason.

| Component | Proposed testid | Reason | Lines |
|---|---|---|---|
| `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` | `lang-selector` (wrapping `NavGroup` element) | Spec must assert ABSENCE of language selector. Asserting on i18n-translated NavGroup title is brittle. | line 33 (`<NavGroup title=...>`) |
| `apps/frontend/src/lib/components/input/Input.svelte` | `multilingual-toggle` (on the translation toggle `Button`) | Spec must reliably locate the toggle without text-content matching (text is locale-dependent — "Translations" / "Translations" vs. Finnish equivalent). | lines 653-658 (`<Button text={isTranslationsVisible ? ... showTranslations} ...>`) |
| `apps/frontend/src/lib/components/input/Input.svelte` (optional) | `multilingual-locale-field-<locale>` (per per-locale wrapper) | Per-locale input lookup is currently by aria-labelledby. Adding a stable testid simplifies the fixture. | lines 397-447 |

**Stage A may also add:**
| Component | Proposed testid | Reason |
|---|---|---|
| (NA) | — | Stage A is data-flow, no new DOM elements likely. |

## Security Domain

Phase 90 is a test-authoring + dev-seed-template phase. `security_enforcement` defaults to enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | partial | Supabase Auth via `client.sendEmail` → password set. No changes to auth surface. |
| V3 Session Management | no | No session changes. |
| V4 Access Control | no | No access-control changes. |
| V5 Input Validation | no | No new input surfaces. (Stage A adds optional input via `app_settings.settings` JSONB — validate locale code shape.) |
| V6 Cryptography | no | No crypto surfaces. |

### Known Threat Patterns for stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSONB injection via perm-template `app_settings.settings` | Tampering | `Writer.write` validates the shape against the typed schema; perm templates are committed source code (not user input). Stage A's override key needs typed validation. |
| Test-time credential leakage | Information Disclosure | Inbucket-only emails; no real credentials seeded. `recipientEmail` uses `*.openvaa.local` non-routable domain per `candidate-mega.ts:87`. |

No new attack surface. Tests run against local Supabase + local Inbucket.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `./TEST-INVENTORY-REFACTOR-5.md` (96 lines) — PRIMARY design source
- `./TEST-INVENTORY-REFACTOR-4.md` — TIR4 strict-fixture conventions (carry-forward)
- `./CLAUDE.md` — Project constraints + Svelte 5 context rule
- `./.planning/STATE.md` lines 1-15 — Current milestone position (v2.10, verifying)
- `./.planning/phases/90-.../90-CONTEXT.md` — Locked decisions D-90-01..09
- `./.planning/phases/89-.../89-04-PLAN.md` (259 lines) — Mirror target for chain structure
- `./.planning/phases/89-.../89-02-PLAN.md` — Function-fixture composition root pattern
- `./.planning/milestones/v2.9-phases/74-high-leverage-e2e-coverage/74-01-PLAN.md` lines 37, 110, 155 — D-04 single-locale deferral (Paraglide compile-time)
- `./.planning/milestones/v2.9-phases/74-high-leverage-e2e-coverage/74-01-SUMMARY.md` lines 94, 139 — `supportedLocales` is hardcoded; Paraglide is the source
- `./.planning/milestones/v2.9-phases/74-high-leverage-e2e-coverage/74-DISCUSSION-LOG.md` lines 38-47 — D-04 decision rationale
- `packages/app-shared/src/data/customData.type.ts:30` — `disableMultilingual?: boolean`
- `packages/app-shared/src/settings/staticSettings.ts:46-64` — `supportedLocales` hardcoded array
- `packages/app-shared/src/settings/staticSettings.type.ts:82` — type definition
- `apps/frontend/src/lib/components/input/QuestionInput.svelte:34, 51-77` — `disableMultilingual` prop + `customData.disableMultilingual` plumbing
- `apps/frontend/src/lib/components/input/Input.svelte:104, 111, 117, 134-140, 392-450, 646-660` — multilingual rendering + translation-toggle button
- `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte:1-43` — language selector
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte:28, 110` — selector usage in candidate nav
- `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte:33, 111` — selector usage in voter nav
- `apps/frontend/src/lib/i18n/init.ts:1-37, 42` — i18n init reads staticSettings + exports paraglide-derived locales
- `apps/frontend/src/lib/contexts/i18n/i18nContext.ts:22-27` — context wraps locale array
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:55, 213, 219` — app context exposes locales store
- `apps/frontend/project.inlang/settings.json` — Paraglide source of truth (en, fi, sv, da, et, fr, lb)
- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte:100-220` — missing-nominations modal + per-election rendering
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:200-300` — profile page structure
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:280-340` — opinion-editor structure
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte:1-125` — voter-side info answer rendering
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte:133, 150, 152` — `entity-details` + `voter-entity-detail-info` + `voter-entity-detail-opinions` testids
- `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte` — info-answer formatter
- `apps/frontend/src/lib/i18n/translations/en/results.json:21-30` — missingNominations i18n keys
- `apps/frontend/src/lib/i18n/translations/en/components.json:23-30` — translations toggle labels
- `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts:1-115` — perm template mirror target
- `packages/dev-seed/src/templates/permutations/shared.ts:1-296` — shared helpers + `MINIMAL_BASE_APP_SETTINGS`
- `packages/dev-seed/src/templates/index.ts:41-94` — `BUILT_IN_TEMPLATES` registration map
- `packages/dev-seed/src/locales.ts:1-100` — locale fan-out (hardcoded LOCALES array)
- `tests/tests/specs/perm/perm-disable-voter-app.spec.ts:1-37` — spec mirror target
- `tests/tests/specs/candidate/candidate-translation.spec.ts:11-12, 38-44` — Phase 74 D-04 deferral notes + multilocale button pattern
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:1-80, 298-310` — Inbucket registration flow
- `tests/tests/setup/perm-disable-voter-app.setup.ts:1-17` — setup wrapper mirror target
- `tests/tests/setup/perm-disable-voter-app.teardown.ts:1-18` — teardown wrapper mirror target
- `tests/tests/setup/setupFromTemplate.ts:1-229` — generic setup helper
- `tests/tests/fixtures/candidate/candidate-mega.ts:1-125` — composition root pattern
- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:1-210` — function-fixture pattern
- `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts:1-115` — function-fixture pattern + Likert/comment surfaces
- `tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts:1-65` — login fixture
- `tests/tests/utils/testIds.ts:1-230` — central testid catalog
- `tests/playwright.config.ts:650-960` — perm chain orchestration patterns

### Secondary (MEDIUM confidence — single-source documentation)
- `apps/frontend/src/lib/i18n/README.md:1-30` — Paraglide architecture
- `apps/frontend/src/lib/i18n/overrides.ts` — runtime override (translation-key level, NOT locale-list level)

### Tertiary (LOW confidence — none)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every component path + line verified in codebase
- Architecture: HIGH — perm chain, fixture composition, dev-seed flow all directly observed
- Pitfalls: HIGH — Pitfall 5 (`OpinionQuestionInput` is NOT multilingual) is a real risk; Pitfall 7 is documented in code
- PRODUCT-GAP confirmation: HIGH — Phase 74 D-04 + 74-01-SUMMARY corroborate; codebase grep verifies static-only `supportedLocales`

**Research date:** 2026-05-29
**Valid until:** 2026-06-12 (14 days — stable codebase; v2.10 is in verifying state; no v2.11 churn expected in this window)
