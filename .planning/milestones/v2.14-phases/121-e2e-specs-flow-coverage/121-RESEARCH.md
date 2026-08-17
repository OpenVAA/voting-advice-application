# Phase 121: E2E Specs — Flow Coverage - Research

**Researched:** 2026-06-16
**Domain:** Playwright E2E test authoring (SvelteKit VAA) — extend existing specs + add read-only leaf specs + one dev-seed perm node. NO production/UI code change, NO DB migration.
**Confidence:** HIGH (every claim grounded by reading the actual repo files this session; no external packages introduced)

## Summary

This is a pure E2E test-coverage phase executing the operator-APPROVED, LOCKED master coverage plan (`.planning/v2.14-E2E-COVERAGE-PLAN.md` §EFLOW build list + §Extension-Scope Pins). All four open build-time pins (D-01/D-02/D-03 + the EFLOW-09 host) resolved to the plan-recommended option in CONTEXT.md, so the planner's job is to turn the plan into PLAN-ready detail, not to redesign. Nine requirements: EFLOW-01/03/04/05/06/07/08/09/11. EFLOW-03 and EFLOW-05 are confirmed-already-covered (re-confirm only, no code). The rest split into A4 extensions of `voter-journey`/`perm-localisation-positive`/`candidate-journey`, three NEW read-only leaf specs (`voter-dark-mode`, `voter-prefs-tracking`, `voter-journey-mobile`), one a11y-smoke extension, two mobile-override sub-tests on existing perm specs, and ONE new dev-seed perm node (`perm-analytics-tracking`, D-01).

The three Phase-119 fixtures the plan depends on are already built and verified: `trackingIntercept` (`window.umami.track` capture seam + 3-part arming prerequisite), `theme` (dark-mode via `emulateMedia`, NOT a toggle), and `navMenu` (drawer + `expectNavMenuItems`). The `entityFilters` fixture already exposes `selectAll()`/`selectNone()`/`getSelectAllToggle()` with the select-all/none threshold confirmed in-code as `values.length > 3`. The Playwright config is a strict serial project DAG; new leaf specs mirror `cold-entry-dataroot` (depend on `data-setup-base`, scoped `testMatch`, no own setup/teardown), and the new perm node appends to the perm tail after `perm-org-matching`.

**Primary recommendation:** Execute the EFLOW (Phase 121) build-list blocks verbatim, with ONE binding correction the planner MUST honor: the EFLOW-07 dark-mode mechanism is `prefers-color-scheme` emulation (`theme.fixture.setColorScheme`), NOT a UI toggle + localStorage — the coverage-plan's EFLOW-07 prose (and CONTEXT.md/CLAUDE.md) are factually wrong on this and were already superseded by the verified `theme.fixture` (see Pitfall 1).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (EFLOW-08 analytics seed):** Create a **dedicated perm node** (e.g. `perm-analytics-tracking`) carrying the analytics overlay (`analytics.platform='umami'` + `analytics.trackEvents=true`) that the `trackingIntercept` fixture requires as its arming prerequisite; `voter-prefs-tracking` depends on it. e2e/base stays untouched (additive). Consent (`userPreferences.dataCollection.consent`) is toggled at runtime in-app, NOT seeded.
- **D-02 (EFLOW-09 voter conditional nav items):** Assert the "Select elections" / "Select constituencies" nav-menu items are omitted-when-unavailable by **riding the existing EPERM-02 perm datasets** (`perm-1e1cg1co` / `perm-disable-election-1co`) where the not-selectable seed already exists — no new dataset. The candidate logged-in-vs-out nav slice stays in `candidate-journey.spec.ts`.
- **D-03 (EFLOW-11 mobile smoke for EPERM-06/07):** Add the mobile-viewport smoke to `perm-question-video` and `perm-interactive-info` as a **per-spec viewport-override sub-test** (one extra test block per spec using a context/viewport override) — NOT a new shared mobile project variant. (The dedicated `voter-journey-mobile.spec.ts` still uses its own mobile device-descriptor project per the plan.)

### Claude's Discretion
- Exact seeded categorical filter to surface the select-all/none control (must exceed the option-count threshold — confirm against the filter-dialog component at build time).
- Which concrete routes/actions exercise `startPageview` / `startEvent` / `track` (one representative each), and the precise per-category expected subMatch values for the chosen candidate (derive deterministically from the answeredVoterPage answer set).
- The exact mobile device descriptor (`devices['Pixel 5']` vs explicit 390×844 matching visual-regression's config).

### Deferred Ideas (OUT OF SCOPE)
- **EFLOW-02** (alliance card + member-orgs drawer) — deferred to Phase 130 (depends on UNBLK-06 alliance render, built Phase 129).
- **EFLOW-10 / -10b** (bank-auth) — Phase 122.
- None outside phase scope surfaced during discussion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EFLOW-01 | Voter-results entity filters: apply / reset / persistence | EXTEND `voter-journey` filter step (~L1107–1175). `entityFilters` fixture already has `selectAll()`/`selectNone()` (threshold `values.length > 3`) + `setTextFilter`/`clearTextFilter`. Add: categorical select-all/none, text×dialog intersection, reset-restores-full-list. |
| EFLOW-03 | Voter-vs-entity 4-case answer comparison | CONFIRMED COVERED — `voter-journey.spec.ts` L938–999 (`entityDetails.expectQuestionDisplay` 4-case matrix). Re-confirm only, cite the existing assertions. |
| EFLOW-04 | Per-category subMatches breakdown | EXTEND `voter-journey` subMatches step (L759–766, currently `toHaveCount(4)`). Upgrade to per-category correct values for the polar-max candidate `test-ca-bb-1`. |
| EFLOW-05 | Skip / delete / back nav + answer-count + results-CTA | CONFIRMED COVERED — `voter-journey.spec.ts` (skip L700–705; min-answers gate; delete/re-enable). Re-confirm only. |
| EFLOW-06 | Mid-session locale switch (fi→en→fi), state preserved | EXTEND `perm-localisation-positive.spec.ts` (owns `langSelector` + locale machinery, L120–172). Add in-flight answer/selection-state-preserved slice. |
| EFLOW-07 | Dark-mode applied + persisted across reload | NEW `voter-dark-mode.spec.ts` (leaf, read-only base). Use `theme.fixture` (`setColorScheme`/`expectTheme`) — emulateMedia, NOT a toggle. PLUS extend `a11y-smoke.spec.ts` dark-mode contrast scan. |
| EFLOW-08 | User-prefs round-trip + tracking-payload (consent vs suppression) | NEW `voter-prefs-tracking.spec.ts`. Uses `trackingIntercept` fixture + D-01 `perm-analytics-tracking` node. Consent via `DataConsent.svelte`/popup. |
| EFLOW-09 | Nav-menu contents both apps incl. candidate auth-state | EXTEND `candidate-journey.spec.ts` (auth lifecycle) for logged-in/out; ride `perm-1e1cg1co`/`perm-disable-election-1co` for voter conditional items (D-02). Use `navMenu` fixture. |
| EFLOW-11 | Interactive voter journey at mobile viewport | NEW `voter-journey-mobile.spec.ts` (mobile project, explicit 390×844 isMobile/hasTouch). PLUS D-03 mobile-override sub-tests on `perm-question-video` + `perm-interactive-info`. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Entity filters (EFLOW-01) | Browser/Client | — | Filtering is client-side over already-fetched entities (`entityFilters` fixture drives the dialog UI). |
| subMatches display (EFLOW-04) | Browser/Client | API/matching pkg | Scores computed by `@openvaa/matching` at load; the spec asserts the *rendered* gauge values. |
| Locale switch (EFLOW-06) | Frontend Server (SSR) | Browser | `langSelector.switchTo` triggers a full reload; Paraglide URL-prefix routing is SSR-resolved, state re-hydrated client-side. |
| Dark mode (EFLOW-07) | Browser/Client | — | `DarkMode` class reads `window.matchMedia('(prefers-color-scheme: dark)')` ONLY — pure browser-media-driven, no server, no storage. |
| Tracking emission (EFLOW-08) | Browser/Client | — | `TrackingService` → `sendTrackingEvent` rune → `window.umami.track`; gated client-side by `shouldTrack`. |
| Consent persistence (EFLOW-08) | Browser/Client | — | `userPreferences` is client-persisted; `setDataConsent` writes `dataCollection.consent`. |
| Nav-menu contents (EFLOW-09) | Browser/Client | API (auth) | Menu items render from auth state + settings; candidate auth state is cookie/session driven (API), menu render is client. |
| Mobile journey (EFLOW-11) | Browser/Client | — | Viewport/touch is a Playwright project-level descriptor; the walk is the same viewport-agnostic fixture. |

## Standard Stack

No new packages. Everything is the existing test toolchain (verified present in `tests/` + repo `package.json`).

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | as installed (root) | E2E runner + assertions | The project's sole E2E framework (`tests/playwright.config.ts`). [VERIFIED: tests/playwright.config.ts] |
| `@axe-core/playwright` | as installed | WCAG 2.1 AA scan (EFLOW-07 dark-mode contrast) | Already the a11y-smoke engine. [VERIFIED: a11y-smoke.spec.ts:35] |
| `@openvaa/dev-seed` | workspace | Seed templates (D-01 `perm-analytics-tracking`) | The seed authoring package; perm templates live in `packages/dev-seed/src/templates/e2e/perm/`. [VERIFIED: ls] |

### Supporting (fixtures already built — REUSE, do not rebuild)
| Fixture | Path | Purpose | Surface |
|---------|------|---------|---------|
| `trackingIntercept` | `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | EFLOW-08 capture seam | `install()`, `getTrackCalls(): {name,data}[]`, `clear()`; ASYNC factory (`createTrackingIntercept(page)`). [VERIFIED] |
| `theme` | `tests/tests/fixtures/shared/theme.fixture.ts` | EFLOW-07 dark mode | `setColorScheme('dark'\|'light')` (emulateMedia), `expectTheme(...)` (polls `matchMedia` match). [VERIFIED] |
| `navMenu` | `tests/tests/fixtures/shared/navMenu.fixture.ts` | EFLOW-09/11 nav menu | `menu`, `items()`, `openMobileNav()`, `expectNavMenuItems([...])` (exact count+order via `toHaveAccessibleName`). [VERIFIED] |
| `entityFilters` | `tests/tests/fixtures/voter/entityFilters.fixture.ts` | EFLOW-01 filters | dialog `getFilter`, per-filter `setSelection`/`setNumberRange`/`selectAll`/`selectNone`/`getSelectAllToggle`/`isAllSelected`, `setTextFilter`/`clearTextFilter`, `openFilterDialog`. [VERIFIED] |
| `voter-journey.fixture` | `tests/tests/fixtures/voter/voter-journey.fixture.ts` | `answeredVoterPage`/`locatedVoterPage` | Viewport-agnostic walk; `answerMode:'max'` default (last/polar-max option each opinion Q). [VERIFIED] |
| `langSelector` | `tests/tests/fixtures/shared/` (used in perm-localisation) | EFLOW-06 | `switchTo(locale)` (full reload), `expectVisible([...])`. [VERIFIED: perm-localisation-positive.spec.ts:122,147] |
| candidate page-objects | `tests/tests/fixtures/candidate/` | EFLOW-09 | `candidateHomePage`, `candidateLoginPage`, `candidateLogoutButton`. [VERIFIED: ls] |
| `views.ts` composition root | `tests/tests/fixtures/voter/views.ts` | voter spec root | `base.extend` exposing `resultsPage`/`entityFilters`/`entityDetails`/`voterHomePage`/`voterIntroPage`/`voterQuestionsPage`/`aboutPage`/`questionInfo`. [VERIFIED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Explicit `viewport:{390×844},isMobile,hasTouch` for EFLOW-11 | `devices['Pixel 5']` | Pixel 5 is 393×851 DPR-2.75 — diverges from `visual-regression`'s 390×844. RECOMMEND the explicit config to match visual-regression (consistency, no surprise touch/DPR drift). See Open Questions. |

**Installation:** None — no packages added or upgraded this phase.

**Version verification:** N/A — no new dependencies. (Package Legitimacy Audit therefore not required; see that section.)

## Package Legitimacy Audit

**Not applicable.** This phase installs NO external packages — it adds test specs, extends existing specs, and adds one in-repo dev-seed template. `package.json` is modified only incidentally (pre-existing `M package.json` in git status, unrelated to this phase's deliverables). No `npm install` / `pip install` / `cargo add` step exists in the build list.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram (test-execution flow)

```
                          yarn test:e2e  (host Vite :5173 + local Supabase :54321)
                                   │
                                   ▼
                   ┌──────── Playwright serial project DAG ────────┐
                   │                                               │
        data-setup-base ──► voter-journey ─┐                       │
              │             candidate-journey ─┐                   │
              ├──► cold-entry-dataroot (LEAF, read-only)           │
              ├──► voter-dark-mode      (NEW LEAF, read-only)  ◄── EFLOW-07
              ├──► voter-prefs-tracking (NEW LEAF) + dep perm  ◄── EFLOW-08
              ├──► voter-journey-mobile (NEW LEAF, mobile desc)◄── EFLOW-11
              ├──► a11y-smoke (default-on; +dark-contrast)     ◄── EFLOW-07
              └──► performance (default-on)
                   │
   perm family (STRICT serial chain — app_settings singleton clobber):
     [voter-journey, candidate-journey] ► perm-1e1cg1co ► … ► perm-org-matching
                                                                   │
                                                       perm-analytics-tracking (NEW, D-01)  ◄── EFLOW-08 dep
                   │
   spec assertions reach the app at the BROWSER boundary:
     filters/subMatches/nav/dark-mode/tracking → rendered DOM + window.umami.track stub
```

File-to-implementation mapping is in Component Responsibilities (below), not in the diagram.

### Component Responsibilities

| File (to create / edit) | Responsibility | Action |
|--------------------------|----------------|--------|
| `tests/tests/specs/voter/voter-journey.spec.ts` | EFLOW-01 (filter step ~L1107–1175), EFLOW-04 (subMatch step L759–766), EFLOW-03/05 re-confirm evidence | EDIT |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | EFLOW-06 in-flight state-preserved slice | EDIT |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | EFLOW-09 candidate logged-in/out nav | EDIT |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | EFLOW-07 dark-mode contrast re-scan | EDIT |
| `tests/tests/specs/perm/perm-1e1cg1co.spec.ts` and/or `perm-disable-election-1co.spec.ts` | EFLOW-09 voter conditional nav-item omission (D-02) | EDIT |
| `tests/tests/specs/perm/perm-question-video.spec.ts` | EFLOW-11 mobile-override sub-test (D-03) | EDIT |
| `tests/tests/specs/perm/perm-interactive-info.spec.ts` | EFLOW-11 mobile-override sub-test (D-03) | EDIT |
| `tests/tests/specs/voter/voter-dark-mode.spec.ts` | EFLOW-07 NEW leaf spec | CREATE |
| `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` | EFLOW-08 NEW leaf spec | CREATE |
| `tests/tests/specs/voter/voter-journey-mobile.spec.ts` | EFLOW-11 NEW leaf spec (mobile project) | CREATE |
| `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` | D-01 analytics overlay seed | CREATE |
| `packages/dev-seed/src/templates/index.ts` | register the new perm template | EDIT |
| `tests/tests/setup/perm/perm-analytics-tracking.setup.ts` + `.teardown.ts` | D-01 seed setup/teardown | CREATE |
| `tests/playwright.config.ts` | 3 new leaf projects + 1 new perm chain triad | EDIT |

### Pattern 1: New read-only leaf spec (mirror `cold-entry-dataroot`)
**What:** A spec that reads `e2e/base` read-only, imports `{ expect, test }` directly from `@playwright/test` (NOT from `views.ts` unless it needs the voter view fixtures), depends on `data-setup-base`, has NO own setup/teardown, and is excluded from `voter-journey` via scoped `testMatch`.
**When:** EFLOW-07 (`voter-dark-mode`), EFLOW-08 (`voter-prefs-tracking`), EFLOW-11 (`voter-journey-mobile`).
**Example (project wiring, mirror lines 226–232 of config):**
```ts
// Source: tests/playwright.config.ts:226-232 (cold-entry-dataroot)
{
  name: 'voter-dark-mode',
  testDir: './tests/specs/voter',
  testMatch: /voter-dark-mode\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base']
},
```
For `voter-journey-mobile`, replace `use` with the mobile descriptor:
```ts
// Mirror visual-regression's mobile config (tests/specs/visual/visual-regression.spec.ts:52)
use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
fullyParallel: false,
```

### Pattern 2: New perm chain node appended to the tail (D-01)
**What:** Each new perm spec needs (a) a template, (b) a setup/teardown pair, (c) a project triad in the config appended after the current tail node (`perm-org-matching`), with `dependencies: [perm-org-matching]` on the setup.
**Example:**
```ts
// Append after perm-org-matching (config L891-908). setup depends on the previous perm SPEC.
{ name: 'data-setup-perm-analytics-tracking', testMatch: /perm-analytics-tracking\.setup\.ts/,
  teardown: 'data-teardown-perm-analytics-tracking', dependencies: ['perm-org-matching'] },
{ name: 'data-teardown-perm-analytics-tracking', testMatch: /perm-analytics-tracking\.teardown\.ts/ },
{ name: 'perm-analytics-tracking', testDir: './tests/specs/perm', testMatch: /perm-analytics-tracking\.spec\.ts/,
  fullyParallel: false, use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-perm-analytics-tracking'] },
```
**NOTE — host placement decision (Open Question 3):** the coverage plan places `voter-prefs-tracking` as a voter LEAF on `data-setup-base`, but D-01 says it "depends on" the `perm-analytics-tracking` node. A leaf on `data-setup-base` CANNOT also depend on a perm node that clobbers the `app_settings` singleton — the two states conflict. RESOLUTION: the tracking ASSERTIONS that need `analytics.platform='umami'` + `trackEvents=true` must run UNDER the perm-analytics-tracking project (its spec reads the analytics-armed singleton), not as a base leaf. The prefs round-trip portion (consent/feedback/survey persistence) is settings-agnostic and could be a base leaf, but co-locating both in the perm-analytics-tracking spec is simpler and avoids the singleton conflict. Pin at plan time; default = single spec under the perm node.

### Pattern 3: Soft vs hard assertions
**What:** `voter-journey.spec.ts` uses `expect.soft` for its result-page assertions (so one card-content miss doesn't abort the whole 1177-line walk); fixtures (`entityFilters`, `entityDetails`, `theme`, `navMenu`) use HARD assertions per their rigidity contract. New leaf specs (`cold-entry-dataroot`) use HARD assertions throughout.
**When to use:** Follow the host file's convention — extensions to `voter-journey` may use `expect.soft` to match surrounding code; standalone leaf specs use HARD assertions.

### Anti-Patterns to Avoid
- **Toggle-click + localStorage for dark mode:** WRONG mechanism (see Pitfall 1). Use `emulateMedia`.
- **`locator.isVisible({ timeout })` as a wait:** one-shot snapshot that ignores its timeout; use `waitFor({state:'visible',timeout})` or `expect.poll`. [VERIFIED: voter-journey.fixture.ts:151-159]
- **Reading filter option count before the row settles:** `getFilter()` auto-expands reactively and returns before options mount; `setSelection`/`isAllSelected` already guard with `expect(options.first()).toBeVisible()` first. Do not bypass the fixture. [VERIFIED: entityFilters.fixture.ts:69-76]
- **Plain `.click()` on category-intro start links:** href is post-hydration `$derived`; navigate to the resolved href instead (the fixture's `followLinkWhenHrefResolved`). [VERIFIED: voter-journey.fixture.ts:85-94]
- **Standalone `expect()` inside `for`/`if` in a test body:** the suite enforces `playwright/no-standalone-expect` + `playwright/no-conditional-in-test` — hoist to module-scope helpers (see `a11y-smoke.spec.ts` `assertAxeGates`, `advancePastCategoryIntro`).
- **Adding a `dark` class assertion:** the app has NO `dark` root class — the only theme signal is the `prefers-color-scheme` media match. [VERIFIED: theme.fixture.ts:28-35]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Capture tracking payloads | A `page.route()` network interceptor for Umami | `trackingIntercept.fixture` (`window.umami.track` stub via `addInitScript`) | Umami emits client-side via `window.umami.track`; there is no outbound network in test. The fixture is the verified seam. [VERIFIED: trackingIntercept.fixture.ts:9-17] |
| Dark-mode control | A toggle-button locator + localStorage read | `theme.fixture.setColorScheme`/`expectTheme` | No toggle/storage exists; `DarkMode` reads `matchMedia` only. [VERIFIED] |
| Categorical select-all/none | A custom click-every-checkbox loop | `entityFilters` `selectAll()`/`selectNone()` | Already built; handles the single flip-toggle + post-state hard-assert + the >3-option threshold. [VERIFIED: entityFilters.fixture.ts:147-175] |
| Nav-menu contents assertion | Manual item enumeration | `navMenu.expectNavMenuItems([...])` | Exact count+order via accessible name; handles the mobile hydration-race open. [VERIFIED] |
| Mobile nav open | A bespoke hamburger click | `navMenu.openMobileNav()` | Hydration-race-guarded `toPass` retry already inside. [VERIFIED: navMenu.fixture.ts:62-79] |
| Voter walk at mobile viewport | A re-implemented mobile walk | `answeredVoterPage` under a mobile-descriptor project | The fixture is viewport-agnostic — the descriptor is project-level config. [VERIFIED: COVERAGE-PLAN L266] |
| Locale switch | Manual URL rewrite | `langSelector.switchTo(locale)` | Handles Paraglide baseLocale (no `/en/` prefix) + full reload. [VERIFIED: perm-localisation-positive.spec.ts:163-166] |

**Key insight:** Phase 119 already built and verified every fixture this phase consumes (incl. the EFLOW-08 intercept and the select-all/none filter methods). The phase is assembly of verified parts, not new mechanism design — the single place where the upstream plan text is wrong is the dark-mode mechanism, already corrected in the fixture.

## Runtime State Inventory

> This is a test-authoring phase (specs + one seed template). It does, however, add a perm node that writes to the shared `app_settings` JSONB singleton — the one piece of runtime/stored state that matters here.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | The `perm-analytics-tracking` seed writes rows under a NEW `externalIdPrefix` (e.g. `e2e-perm-analytics-`) + the shared `app_settings` singleton (analytics overlay) | New template + setup/teardown; teardown clears its own prefix (mirror `perm-org-matching.teardown`). The singleton is re-clobbered by the next perm setup in the serial chain — append at the TAIL so nothing downstream depends on a non-analytics singleton. |
| Live service config | None — local Supabase only, seeded via templates committed to git | None |
| OS-registered state | None | None |
| Secrets/env vars | None new. The `trackingIntercept` fixture deliberately embeds NO Umami website key (stub only) — CLAUDE.md "never commit secrets" satisfied | None |
| Build artifacts | `@openvaa/dev-seed` must be rebuilt after adding the template so the seed CLI picks it up (`yarn build --filter=@openvaa/dev-seed`, or `yarn build`) | Add a build step before running the new perm spec; the dev-seed template registry (`packages/dev-seed/src/templates/index.ts`) must export the new template. |

**Canonical question (post file-edit):** after the specs land, the only runtime state touched is the `app_settings` singleton during the perm-analytics-tracking setup — already handled by the serial-chain clobber discipline. Verified by reading `perm-org-matching.ts` (same pattern).

## Common Pitfalls

### Pitfall 1: Dark mode is OS-media-driven, NOT a toggle (binding correction)
**What goes wrong:** The coverage-plan EFLOW-07 block (L242–243) and CONTEXT.md/CLAUDE.md describe "toggle dark mode ON … persisted via localStorage `runeLocalStorage`." There is NO toggle button and NO storage write.
**Why it happens:** `DarkMode` (`apps/frontend/src/lib/contexts/component/darkMode.svelte.ts:20-38`) derives `#dark` SOLELY from `window.matchMedia('(prefers-color-scheme: dark)')` (constructor read + `change` listener). No web-storage, no class on the root.
**How to avoid:** Drive the theme with `theme.fixture.setColorScheme('dark'|'light')` (= `page.emulateMedia`), assert with `expectTheme(...)` (polls the media match). "Persisted across reload" is AUTOMATIC because the emulated media preference survives reloads — no storage assertion is possible or needed. The fixture header documents this as a verified SCOPE FLAG for Phase 121. [VERIFIED: theme.fixture.ts:7-42]
**Warning signs:** A plan task that says "click the dark-mode toggle" or "assert localStorage" — reject it.

### Pitfall 2: tracking emission requires ALL THREE arming conditions
**What goes wrong:** `getTrackCalls()` is empty and the test wrongly concludes "no tracking."
**Why it happens:** `shouldTrack` (and the `sendTrackingEvent` wiring) require: (1) `appSettings.analytics.platform.name === 'umami'` (so `UmamiAnalytics` mounts), (2) `appSettings.analytics.trackEvents === true`, (3) `userPreferences.dataCollection.consent === 'granted'`. Unit truth-table confirms: `shouldTrack` true ONLY when `browser && trackEvents && consent === 'granted'`. [VERIFIED: trackingIntercept.fixture.ts:23-40; trackingService.svelte.test.ts:53-85]
**How to avoid:** Seed (1)+(2) via the D-01 `perm-analytics-tracking` node; grant (3) at runtime via `DataConsent.svelte`/`DataConsentPopup` (the "granted" button) — consent is NOT seeded. The SUPPRESSION assertion is consent-ungranted: stub installed, `getTrackCalls()` stays empty.
**Note on the analytics overlay shape:** `analytics.platform` is an OBJECT `{ name:'umami', code:string, infoUrl:string }`, not a bare string. CONTEXT.md's shorthand `analytics.platform='umami'` must be authored as the full object (mirror `staticSettings.type.ts:99-122`). The base perm settings set `analytics: { trackEvents: false }` with no platform (`shared.ts:128`), so the overlay must ADD the `platform` object AND flip `trackEvents:true`. [VERIFIED: staticSettings.type.ts:99-122; shared.ts:128]

### Pitfall 3: a bare new `*.spec.ts` does not run
**What goes wrong:** A new spec file is added but never executes (or `voter-journey` accidentally picks it up).
**Why it happens:** The config is an explicit project list; a spec runs only if a project's `testDir`+`testMatch` selects it. `voter-journey`'s `testMatch` is `/voter-journey\.spec\.ts/` (exact), so a new `voter-*.spec.ts` is NOT picked up by it — but it also won't run until you add its own project with a scoped `testMatch`. [VERIFIED: playwright.config.ts:212-232]
**How to avoid:** For each NEW spec add the project entry (leaf or perm triad). For perm specs also add the template + setup/teardown + registry export + dev-seed rebuild.

### Pitfall 4: subMatch correct-values must be DERIVED, not guessed
**What goes wrong:** Hard-coding gauge values that don't match the matching algorithm output → flake/false-fail.
**Why it happens:** `answeredVoterPage` answers `'max'` (last/polar-max option) on every reachable opinion question; the top candidate `test-ca-bb-1` ('Polar-Max BB One') is polar-max. A polar-max voter vs a polar-max candidate scores 100% in each answered category; categories the voter did NOT answer (e.g. the Opt-A category is SKIPPED at L700–705) must NOT produce a gauge. [VERIFIED: voter-journey.fixture.ts:326; voter-journey.spec.ts:700-705,747-766]
**How to avoid:** Assert (a) the gauge COUNT equals the number of voter-answered categories (currently 4) AND (b) each gauge reads the expected per-category score for `test-ca-bb-1` (≈100% for polar-max-vs-polar-max). Derive the exact displayed value at build time by reading the rendered gauge for that candidate; do not invent it. Pin the candidate by name regex (`TEXT_RE.polarMax`), never `.first()`.

### Pitfall 5: EFLOW-06 must reach IN-FLIGHT state before switching
**What goes wrong:** Re-asserting the already-covered pre-answer locale switch (no net-new coverage).
**Why it happens:** `perm-localisation-positive` switches locale on the home page BEFORE answering (L134–172). The net-new slice is: select elections/constituencies AND answer ≥1 opinion question, THEN switch fi→en→fi, asserting the SELECTIONS + ANSWERS survive (not just UI strings). [VERIFIED: perm-localisation-positive.spec.ts:134-172; COVERAGE-PLAN L88,236]
**How to avoid:** Use `langSelector.switchTo` AFTER reaching an in-flight answering state (compose via `answeredVoterPage`/`locatedVoterPage` or the manual walk helpers). Note `switchTo` does a FULL reload — the assertion proves state is persisted across that reload, which is the real test.

### Pitfall 6: mobile-override sub-test must not leak viewport to sibling tests (D-03)
**What goes wrong:** A `test.use({ viewport })` at file scope changes the whole perm spec's viewport.
**Why it happens:** `test.use` applies to its enclosing scope. The visual-regression pattern scopes it inside a `describe` block: `describe.configure({ mode:'serial' })` + `describe.use({ viewport:{390×844}, isMobile, hasTouch })`. [VERIFIED: visual-regression.spec.ts:50-52]
**How to avoid:** Put the D-03 mobile smoke in its OWN `test.describe` block within `perm-question-video`/`perm-interactive-info`, with a scoped `.use({ viewport, isMobile, hasTouch })` — NOT at file scope.

## Code Examples

### EFLOW-08 — tracking intercept (consent vs suppression)
```ts
// Source: trackingIntercept.fixture.ts (createTrackingIntercept) + DataConsent.svelte:81-94
const tracking = await createTrackingIntercept(page);   // installs window.umami.track stub pre-nav
// ... navigate, grant consent via the "granted" Button (privacy page / DataConsentPopup), perform an action ...
const calls = await tracking.getTrackCalls();           // [{ name, data }]
expect(calls.length).toBeGreaterThan(0);                // consent granted → emits
// suppression: fresh context (or deny consent) → repeat action →
await tracking.clear();
expect(await tracking.getTrackCalls()).toEqual([]);     // shouldTrack false → no emit
```

### EFLOW-07 — dark mode (emulateMedia, persists automatically)
```ts
// Source: theme.fixture.ts:63-77
const theme = createThemeReader(page);
await theme.setColorScheme('dark');
await page.goto('/en');
await theme.expectTheme('dark');     // matchMedia('(prefers-color-scheme: dark)').matches === true
await page.reload();
await theme.expectTheme('dark');     // survives reload (emulation persists) — no storage assertion
```

### EFLOW-07 — a11y dark-mode contrast extension (a11y-smoke)
```ts
// Source: a11y-smoke.spec.ts:160 + theme.fixture.ts. Add a dark-scheme variant of the existing scan.
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
await route.settle(page);
const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
await assertAxeGates(results, testInfo, `${route.name}-dark`);
```

### EFLOW-01 — categorical select-all/none + text×filter intersection
```ts
// Source: entityFilters.fixture.ts:147-175,304-336 + voter-journey.spec.ts:1138-1145
const d = await entityFilters.openFilterDialog();
const mc = await d.getFilter(/pick multiple|multipleChoiceCategorical/i); // pick a >3-option categorical
await mc.selectAll();   // all checked (hard-asserts post-state)
await mc.selectNone();  // none checked
await d.close();
// text × dialog intersection:
await entityFilters.setTextFilter('polar');
const d2 = await entityFilters.openFilterDialog();
const f2 = await d2.getFilter(/Party/i);
await f2.setSelection([/No answer/i]);
await d2.close();
await expect(resultsPage.getEntityCards()).toHaveCount(/* intersection count, derive at build */);
await entityFilters.clearTextFilter(); // + reset → full list restored
```

### EFLOW-09 — candidate nav-menu logged-in vs logged-out
```ts
// Source: navMenu.fixture.ts:81-87 + candidate page-objects
const navMenu = createNavMenu(page);
// logged-out:
await navMenu.expectNavMenuItems([/* login/register present, profile/logout absent — derive labels at build */]);
// ... candidate login (candidate-journey already owns registration→login→logout) ...
await navMenu.expectNavMenuItems([/* profile/questions/logout present, login/register absent */]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dark mode "toggle + localStorage" (assumed in CONTEXT/plan prose) | `prefers-color-scheme` emulation only | Phase 119 (theme.fixture verified) | EFLOW-07 spec must use `emulateMedia`; no toggle/storage tasks. |
| `track`/`startEvent`/`startPageview` as 3 distinct payload shapes | All event data routed via `track` at submission; they differ only in bundling/timing | Per `trackingService.type.ts` doc | EFLOW-08 asserts the `track`-boundary emission + `shouldTrack` gate, not 3 shapes. |
| Per-app maintenance specs (`perm-disable-voter-app`/`-candidate-app`) | Consolidated `perm-access-disable` | Phase 120 | Already done; not this phase, but confirms the perm tail layout. |
| EPERM-09 `perm-header-show-feedback` | Renamed `perm-show-feedback-survey` | Phase 120-07 | Chain position confirmed in config L683–706. |

**Deprecated/outdated:**
- The coverage-plan EFLOW-07 prose ("toggle … localStorage runeLocalStorage") — superseded by the verified `theme.fixture` mechanism. Treat the fixture as authoritative.
- `voterNavigation.ts` helpers `walkToQuestion`/`waitForNextQuestion`/`clickThroughIntroPages`/`walkToQuestionsIntro` are deletion candidates per the plan — do NOT build new specs on them; use the `voter-journey.fixture` walk.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Polar-max voter vs polar-max candidate `test-ca-bb-1` ⇒ ≈100% in each of the 4 answered subMatch categories | Pitfall 4 / EFLOW-04 | LOW — exact displayed value must still be read off the rendered gauge at build time (plan task says "derive deterministically"); the *count* (4) is already proven. |
| A2 | `voter-prefs-tracking` is best hosted UNDER the `perm-analytics-tracking` perm project (not a base leaf) because the analytics-armed singleton conflicts with `data-setup-base` | Pattern 2 / Open Q3 | MEDIUM — if the planner keeps a base leaf, the analytics-dependent assertions won't have `trackEvents/platform` set; resolve before building. |
| A3 | Explicit `viewport:{390×844},isMobile,hasTouch` (matching visual-regression) is preferred over `devices['Pixel 5']` for EFLOW-11 | Standard Stack / Open Q1 | LOW — both work; explicit avoids DPR/size drift. Operator may prefer Pixel 5. |
| A4 | Dark mode is NOT a persisted user preference, so EFLOW-08's "every persisted preference field" = `dataCollection.consent` + `feedback.status` + `survey.status` only | EFLOW-08 / Validation | LOW — confirmed by `userPreferences.type.ts` (no theme field). |
| A5 | The new perm node appends after `perm-org-matching` (current tail) | Pattern 2 | LOW — verified current tail in config; if Phase 120 added another tail node since, append after the actual last node. |

## Open Questions

1. **EFLOW-11 mobile device descriptor (discretion item):**
   - What we know: visual-regression uses explicit `viewport:{390×844}, isMobile:true, hasTouch:true` (NOT `devices['Pixel 5']`).
   - What's unclear: operator preference for Pixel 5's real-device profile vs the existing explicit config.
   - Recommendation: use the EXPLICIT config to stay consistent with visual-regression (no DPR/size surprise). [VERIFIED: visual-regression.spec.ts:52]

2. **EFLOW-01 which categorical filter surfaces select-all/none (discretion item):**
   - What we know: the toggle renders only `{#if values.length > 3}` (threshold confirmed in `entityFilters.fixture.ts:109-112` — "threshold > 3 confirmed"). The base dialog has 3 filter rows: Party, pick-multiple (`multipleChoiceCategorical`), years-of-experience (numeric).
   - What's unclear: whether the Party filter or the pick-multiple filter has >3 options in `e2e/base`.
   - Recommendation: confirm at build time by counting options on each; pick the one with >3 (likely pick-multiple/categorical) for select-all/none, and optionally assert the toggle ABSENT on a ≤3-option filter (Party "No answer" + parties may be ≤4). Derive from `e2e/base.ts`.

3. **EFLOW-08 spec host (analytics singleton vs base leaf):**
   - What we know: D-01 requires the analytics overlay (singleton-clobbering perm) AND the plan lists `voter-prefs-tracking` as a base leaf.
   - What's unclear: a base leaf cannot depend on a singleton-clobbering perm node.
   - Recommendation: run the tracking-payload assertions UNDER the `perm-analytics-tracking` project (its own spec). Pin the exact spec/project shape in the plan. (See Pattern 2 / A2.)

4. **EFLOW-06 minimal in-flight host:**
   - What we know: `perm-localisation-positive` is the host; it owns `langSelector` + multi-locale dataset.
   - What's unclear: whether to reach in-flight state via the shared `answerAndAdvanceToResults` helper (exported) or a bespoke partial walk.
   - Recommendation: use the exported `walkUntilQuestionsIntro` + a capped `answerAndAdvanceToResults(page,'max',1)` to reach a known in-flight state deterministically, then switch locale. [VERIFIED: voter-journey.fixture.ts:387-389]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Host Vite dev server (:5173) | all specs | ✓ (per MEMORY: -gsd repo runs clean via host Vite) | — | — |
| Local Supabase (:54321) | data-setup projects | ✓ | — | — |
| Playwright Chromium | all specs | assume installed (`yarn playwright install`) | — | run `yarn playwright install` |
| `@openvaa/dev-seed` build | `perm-analytics-tracking` seed | needs rebuild after template add | — | `yarn build --filter=@openvaa/dev-seed` |

**Missing dependencies with no fallback:** none (per MEMORY `project_gsd_repo_e2e_runs_clean.md`, this repo runs E2E clean via host Vite + local Supabase, no Docker/LocalStack blocker).
**Missing dependencies with fallback:** dev-seed rebuild before the new perm spec runs.

## Validation Architecture

The E2E specs ARE the validation instruments. Framework + commands:

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `@playwright/test` (repo-root `tests/`) |
| Config file | `tests/playwright.config.ts` [VERIFIED] |
| Quick run command | `yarn test:e2e --project=<project> --no-deps` (single spec; run its setup project first if perm-seeded) |
| Full suite command | `yarn test:e2e` (must be green; "did not run" counts as failure per cardinal rule) |
| Determinism standard | every new/edited spec must pass 3× (3× determinism gate); whole-suite run is the trusted signal |

### Phase Requirements → Test Map
| Req | Observable behaviour | Assertion(s) (fixture/selector/expected) | Seed/project | Determinism rationale |
|-----|----------------------|------------------------------------------|--------------|------------------------|
| EFLOW-01 | filter select-all/none + text×filter intersection + reset restores | `entityFilters.selectAll()`→`isAllSelected()===true`; `selectNone()`→all unchecked; text+dialog→`getEntityCards().toHaveCount(N)`; reset→13 cards | `voter-journey` (base) | deterministic seed counts; fixture guards reactive mount race (no time/network) |
| EFLOW-03 | 4-case voter-vs-entity comparison | RE-CONFIRM existing `entityDetails.expectQuestionDisplay` matrix at `voter-journey.spec.ts:938-999` (numSelected 2/1/1/0 + infoText) | `voter-journey` (base) | already-green assertions; no change |
| EFLOW-04 | per-category subMatch correct values for one candidate | `subMatches.getByTestId(scoreGauge)` count == answered categories (4) AND each gauge == expected score for `test-ca-bb-1` (≈100% polar-max) | `voter-journey` (base) | answeredVoterPage = fixed 'max' walk; candidate pinned by name regex → deterministic |
| EFLOW-05 | skip/delete/back + answer-count→CTA | RE-CONFIRM existing skip (L700–705), min-answers gate, delete→results-link re-disabled | `voter-journey` (base) | already-green; no change |
| EFLOW-06 | in-flight state survives fi→en→fi | reach in-flight (elections+constituency+≥1 answer) → `langSelector.switchTo('en')`/('fi') → assert selections+answers persist across the switch-reload | `perm-localisation-positive` | full-reload switch + persisted-state read; no race (waits on reload settle) |
| EFLOW-07 | theme applied + persists; dark contrast clean | `theme.expectTheme('dark')` after `setColorScheme('dark')` + reload; a11y `AxeBuilder...analyze()` 0 violations in dark | `voter-dark-mode` (NEW leaf, base); `a11y-smoke` ext | emulateMedia is deterministic + survives reload; axe gate already deterministic |
| EFLOW-08 | prefs round-trip + tracking emit/suppress | `getTrackCalls().length>0` under consent; `===[]` under suppression; consent/feedback/survey fields re-read after reload | `perm-analytics-tracking` (NEW node) | stub captures synchronously; consent toggled in-app; no network |
| EFLOW-09 | nav-menu differs by app/auth state | `navMenu.expectNavMenuItems([...])` logged-out vs logged-in (candidate); voter conditional items omitted on `perm-1e1cg1co`/`perm-disable-election-1co` | `candidate-journey` ext; EPERM-02 perms | exact item-set assertions; auth lifecycle deterministic in candidate-journey |
| EFLOW-11 | interactive mobile walk + feedback + nav + filters | full `answeredVoterPage` walk under mobile project + `navMenu.openMobileNav()` + feedback + filters; D-03 mobile sub-tests on video/interactive-info | `voter-journey-mobile` (NEW leaf, base); perm video/interactive-info ext | same viewport-agnostic fixture; descriptor is project config → deterministic |

### Sampling Rate
- **Per task commit:** the specific edited/new spec via `--project=<name> --no-deps` (after its setup project) — quick signal.
- **Per wave merge:** `yarn test:e2e` (full suite) — the trusted signal per the E2E Hard Rule.
- **Phase gate:** full suite green 3× before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/tests/specs/voter/voter-dark-mode.spec.ts` — EFLOW-07 (new)
- [ ] `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` — EFLOW-08 (new)
- [ ] `tests/tests/specs/voter/voter-journey-mobile.spec.ts` — EFLOW-11 (new)
- [ ] `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` + registry export + `tests/tests/setup/perm/perm-analytics-tracking.setup.ts`/`.teardown.ts` — D-01
- [ ] `tests/playwright.config.ts` — 3 leaf projects + 1 perm triad
- [ ] Framework install: none needed (Playwright + axe already present)

*(All fixtures EFLOW-07/08/09/11 depend on were built + verified in Phase 119 — no fixture-build gap remains.)*

## Security Domain

> `security_enforcement` posture: this phase writes NO production/security code. The only security-adjacent surfaces are test-only.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (test-only) | candidate auth reused via existing page-objects; no new auth code |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | specs assert, do not accept untrusted input |
| V6 Cryptography | no | the `trackingIntercept` stub embeds NO Umami key (CLAUDE.md "never commit secrets" satisfied) [VERIFIED: trackingIntercept.fixture.ts:5-8] |
| V7 Data Protection | minor | EFLOW-08 exercises CONSENT gating (tracking suppressed without consent) — this is a privacy-by-design assertion, strengthening V7 coverage, not a new control |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Committing an analytics website key in the seed/fixture | Information Disclosure | Stub `window.umami.track` only; seed `analytics.platform.code` with a dummy value (no real Umami id) |
| Tracking without consent | Repudiation/Privacy | EFLOW-08 ASSERTS suppression-without-consent — the spec is the regression guard for the consent gate |

## Sources

### Primary (HIGH confidence)
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — LOCKED master plan (EFLOW map, build list L212–268, extension-scope pins L308–326)
- `tests/playwright.config.ts` — full project DAG (read in full)
- `tests/tests/fixtures/shared/{trackingIntercept,theme,navMenu}.fixture.ts` — verified fixture surfaces
- `tests/tests/fixtures/voter/{entityFilters,views,voter-journey}.fixture.ts` — filter methods, composition root, walk mechanism
- `tests/tests/specs/voter/{voter-journey,cold-entry-dataroot}.spec.ts` — host + leaf model
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts` — EFLOW-06 host
- `tests/tests/specs/candidate/candidate-journey.spec.ts` — EFLOW-09 host
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — EFLOW-07 contrast host
- `tests/tests/specs/visual/visual-regression.spec.ts` — mobile descriptor reference
- `packages/dev-seed/src/templates/e2e/perm/{perm-org-matching,shared}.ts` — perm template pattern + analytics base
- `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` — dark-mode mechanism (matchMedia only)
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts` + `trackingService.svelte.test.ts` — shouldTrack truth table
- `apps/frontend/src/lib/contexts/app/userPreferences.type.ts` + `dynamic-components/dataConsent/DataConsent.svelte` — persisted prefs + consent UI
- `packages/app-shared/src/settings/staticSettings.type.ts` — analytics.platform object shape

### Secondary (MEDIUM confidence)
- MEMORY `project_gsd_repo_e2e_runs_clean.md` — E2E runs clean in -gsd repo via host Vite + local Supabase

### Tertiary (LOW confidence)
- none (all claims grounded in repo files this session)

## Metadata

**Confidence breakdown:**
- Standard stack / fixtures: HIGH — all fixtures read directly; surfaces verified.
- Architecture / project DAG: HIGH — full config read; tail node + leaf pattern confirmed.
- Pitfalls: HIGH — dark-mode + tracking-arming + subMatch-derivation grounded in source.
- Exact derived values (subMatch scores, filter intersection counts, nav item labels): MEDIUM — must be read off the rendered app at build time (plan explicitly defers these to build time).

**Research date:** 2026-06-16
**Valid until:** 2026-07-16 (stable test infra; revalidate the perm tail node + fixture surfaces if Phase 120 follow-ups land new perm chain nodes)

## RESEARCH COMPLETE
