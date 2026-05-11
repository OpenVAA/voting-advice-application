# Phase 74: High-Leverage E2E Coverage - Research

**Researched:** 2026-05-11
**Domain:** Playwright E2E spec authoring on top of the post-Phase-73 deterministic baseline (4 PASS_LOCKED / 15 DATA_RACE / 55 CASCADE, SHA `e2e56e73fa42…` × 3 runs)
**Confidence:** HIGH for stack/locators/variant shape/parity-script tooling; MEDIUM for E2E-04 cross-election bleed assertion shape (assertion-internal detail not previously coded); LOW for E2E-01 translation-surface gating (single shared `Input.svelte` button, not a dedicated tab — see Pitfall 2)
**HEAD at research time:** `5205a6c40` (Phase 74 context already committed; Phase 73 closed at `3fe29e4c4`)

## Summary

Phase 74 lands eight focused user-flow specs on top of Phase 73's deterministic suite. The work is spec authoring + 3 new variant projects + 1 dev-seed extension, NOT product behavior change. CONTEXT.md D-01 through D-13 are LOCKED — the planner must structure 7 plans around the requirement mapping (1 plan per E2E-0X with E2E-03+E2E-06 bundled in Plan 03 and E2E-05+E2E-07 bundled in Plan 05; verification folded into Plan 07). Variant fixtures follow the canonical `tests/tests/setup/templates/variant-multi-election.ts` shape — `BUILT_IN_TEMPLATES.e2e` base + `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` overlay + per-row `constituency_groups`/`constituencies` declarations to escape pipeline full-fanout. New variant projects insert into `tests/playwright.config.ts` between the existing variant chain (after `variant-startfromcg`) following the `data-setup-<name>` → `variant-<name>` dependency pattern. The parity script at `tests/scripts/diff-playwright-reports.ts` MUST be regenerated only when new variant specs land in PASS_LOCKED (the expected case) or any pre-existing test changes pool; Plan 07 owns this conditional regen. Vite-cache wipe (`rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit`) is mandatory before the 3-run smoke per CONTEXT D-12.

**Primary recommendation:** Treat CONTEXT.md D-01..D-13 as the binding plan blueprint. Author all specs against role/aria locators (`getByRole`, `getByLabel`, `getByText`) per D-11; any `getByTestId` requires an inline `// reason:` block. Use `expect.poll(...).toBeGreaterThan(0)` for "X must eventually appear" contracts and `waitFor({ state: 'visible' })` for hard-anchor waits. Plan 04 (`1e×Nc` + `Ne×Nc` variants) is the largest — split into 04a (variant scaffolding) + 04b (spec authoring) if it exceeds the per-plan ceiling. Verification gate in Plan 07: vite-cache wipe → `yarn db:reset-with-data` → `yarn test:e2e --workers=1` × 3 → SHA-256 confirm identical pass/fail sets → conditional `regen-constants.mjs` invocation → `diff-playwright-reports.ts` self-identity smoke → `74-VERIFICATION.md`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| E2E-01 translation surface assertion | Browser (Playwright role/aria locator) | Frontend Server (`Input.svelte` renders button when `multilingual && locales.length > 1`) | Pure UI render-shape contract; locator-only |
| E2E-02 browse-without-match overlay | Variant template (dev-seed) | API/Backend (Supabase `app_settings.settings` JSONB) | `dynamicSettings.matching.minimumAnswers` is the knob; overlay flows through `app_settings` writer pipeline |
| E2E-03 feedback persistence | Browser (Svelte `$state` lifecycle inside `FeedbackModal`) | — | Pure client-side state; modal does NOT remount Feedback on open/close (kept mounted via `bind:this`) |
| E2E-04 selector matrix | Variant templates × 5 (3 new + 2 existing reused) | Frontend Server (`/elections` + `/constituencies` route guards) | URL state + selector visibility derive from voter context + app_settings reading |
| E2E-05 voter/entity answer rendering | dev-seed (4-case answer fixture extension) | Browser (drawer render) | New voter answers in `e2e.ts` template; spec asserts both rows in DOM |
| E2E-06 skip/delete/back navigation | Browser (sequence assertions) | Frontend Server (`resultsAvailable` getter in voter context) | `voterCtx.resultsAvailable` toggles the results CTA; spec drives state via answer/delete actions |
| E2E-07 SubMatch per-category | Browser (DOM-level assertion of `ScoreGauge` instances) | — | `SubMatches.svelte` renders 1 `ScoreGauge` per `match.questionGroup`; assertion is count + per-category label |
| E2E-08 locale switching | Browser (URL prefix + `LanguageSelection` widget click) | Frontend Server (Paraglide `localizeHref`) | Routes do NOT use `[[lang=locale]]` dirs; locale is prefix-only via Paraglide runtime + `LanguageSelection.svelte` widget |

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01..D-13 — verbatim summary)

- **D-01 — 7 plans, verification folded into Plan 07.** Plans 01..07 mapped 1-to-1 to E2E-01..E2E-08 with E2E-03+E2E-06 bundled (Plan 03) and E2E-05+E2E-07 bundled (Plan 05). Risk: Plan 04 may split 04a/04b if scope ceiling exceeded.
- **D-02 — Variant templates follow `variant-multi-election.ts` shape.** Composes `BUILT_IN_TEMPLATES.e2e` + `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)`. Each new variant gets `tests/tests/setup/templates/variant-<name>.ts`, setup file `tests/tests/setup/variant-<name>.setup.ts`, and a Playwright project in `tests/playwright.config.ts` with `data-setup-<name>` → `variant-<name>` dependency.
- **D-03 — 3 NEW variants:** `variant-low-minimum-answers` (E2E-02), `variant-1e-Nc` (E2E-04 cell 2), `variant-Ne-Nc` (E2E-04 cell 4). NO new variant for E2E-01/E2E-05/E2E-06/E2E-07/E2E-08.
- **D-04 — Single-locale E2E-01 path DEFERRED.** `staticSettings.supportedLocales` is hardcoded; no runtime-override mechanism. Phase 74 covers multilocale path only; follow-up todo captures single-locale at phase close.
- **D-05 — 5-cell matrix mapping:** `1e×1c`→base `e2e` (existing); `1e×Nc`→NEW `variant-1e-Nc`; `Ne×1c`→EXISTING `variant-multi-election` (reuse + new assertions); `Ne×Nc`→NEW `variant-Ne-Nc`; `startFromConstituency`→EXISTING `variant-startfromcg` (reuse + new assertions). Reused-variant assertions are additive — do NOT modify CONF-01..CONF-06 invariants.
- **D-06 — Order B chosen.** Phase 74 lands BEFORE CLEAN-04 i18n tightening. E2E-08 covers pre-tightening wrapper; Phase 78 re-validates against tightened wrapper.
- **D-07 — Extend `packages/dev-seed/src/templates/e2e.ts` voter answer dataset** for E2E-05 4-case mix (both-answered, voter-answered+entity-missing, voter-missing+entity-answered, both-missing). Comment markers `E2E-05/case-(a)..(d)`. NO new variant.
- **D-08 — Plan 03 bundles E2E-03 + E2E-06.** Both voter-flow sequence tests; same shape (open→modify→assert | answer→delete→assert).
- **D-09 — Determinism contract:** All new specs MUST pass 3× cold-start `--workers=1` identically. New specs expected in PASS_LOCKED. The Phase-73-locked DATA_RACE pool (15 imgproxy-tied) MUST NOT grow. Any new spec in DATA_RACE requires per-test rationale in `74-VERIFICATION.md`.
- **D-10 — Parity-script constants regen CONDITIONAL.** Re-run `regen-constants.mjs` IF new variants are added (Plans 02 + 04 trigger this) OR cold-start pass/fail changes for pre-existing tests. Plan 07 decides. **CRITICAL:** Phase 74 new variant specs MUST avoid `IMGPROXY_TIED_TITLES` patterns (entity-detail drawer + image-upload titles — see `regen-constants.mjs:55-70` for the bound 14-title list).
- **D-11 — Role/aria locators by default.** `getByRole('button', { name: t('...') })`, `getByLabel(...)`, `getByText(...)` over `page.locator('...')` and `getByTestId(...)`. `getByTestId` requires inline `// reason:` per v2.8 P70 Cat A.
- **D-12 — Vite-cache wipe MANDATORY before 3-run smoke.** `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per v2.8-close gotcha. Plan 07 owns this.
- **D-13 — Spec file layout** (planner may rename): `tests/tests/specs/candidate/candidate-translation.spec.ts` (E2E-01); `tests/tests/specs/voter/voter-browse-without-match.spec.ts` (E2E-02); `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (E2E-03); `tests/tests/specs/variants/1e-Nc.spec.ts` + `tests/tests/specs/variants/Ne-Nc.spec.ts` (E2E-04 NEW cells); extension to `voter-detail.spec.ts` OR new `voter-detail-cases.spec.ts` + `voter-detail-submatch.spec.ts` (E2E-05 + E2E-07); `voter-navigation.spec.ts` (E2E-06); `voter-locale-switching.spec.ts` (E2E-08).

### Claude's Discretion

- Plan-04 split into 04a + 04b if scope exceeds per-plan ceiling.
- E2E-05 + E2E-07 split into 2 specs vs. extending `voter-detail.spec.ts` — planner's call. Split favors parallelism; extension favors smaller diff.
- E2E-03 fold into `voter-popups.spec.ts` vs. new file — planner's call. New file is cleaner.
- Whether to introduce `tests/tests/utils/selectorMatrix.ts` helper or per-spec assertion blocks for E2E-04's 5 cells.
- Whether the dev-seed E2E template extension (D-07) gets a `58-E2E-AUDIT.md`-style addendum documenting the 4 cells — RECOMMENDED but not blocking.

### Deferred Ideas (OUT OF SCOPE)

- E2E-01 single-locale variant (D-04) — captured as new `.planning/todos/pending/` entry at phase close.
- Per-question visibility / must-answer enforcement — Phase 77 SETTINGS-03.
- `customData.allowOpen` E2E coverage — Phase 77 SETTINGS-02.
- A11y axe smoke + profile validation — Phase 76 (A11Y-01/02/03).
- i18n wrapper tightening — Phase 78 CLEAN-04.
- CR-02 voter-popups race-tolerance regression — Phase 78 CLEAN-05.
- Phase 73 review backlog (CR-02 + 7 WR + 5 IN) — Phase 78 CLEAN-05.
- `tests/scripts/diff-playwright-reports.ts` permanent home + CI integration.
- Custom `expectEventually(locator, predicate)` helper.
- `58-E2E-AUDIT.md`-style addendum for D-07 voter-answer 4-case fixture — recommended-but-not-blocking.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| E2E-01 | Multilocale candidate translation surface; single-locale candidate does not see it | Multilocale path covered via `Input.svelte:641-647` Button render (`multilingual && locales.length > 1`); single-locale deferred per D-04 |
| E2E-02 | Voter under `minimumAnswers` browses entity list without match scores | NEW `variant-low-minimum-answers`; overlay path `dynamicSettings.matching.minimumAnswers` (default 5 at `dynamicSettings.ts:42`); ingress locator `voter-results-ingress` per `testIds.voter.results.ingress` |
| E2E-03 | Feedback text persists across dismiss; resets after send | `Feedback.svelte:85` `description = $state('')`; `reset()` only triggered at `Feedback.svelte:132-137` from `FeedbackModal.svelte:50` `onSent`; modal `bind:this={feedbackRef}` keeps component mounted across open/close → contract is naturally satisfied by current code; spec asserts the observable contract |
| E2E-04 | Selector matrix (5 cells); URL state + visibility + no cross-election bleed | D-05 cell mapping table; locators: `testIds.voter.elections.list/continue` + `testIds.voter.constituencies.list/selector/continue`; cross-bleed check = filter dropdown options to selected election's CGs only |
| E2E-05 | Voter's answer next to entity's answer; 4 cases | D-07 extends `e2e.ts` voter dataset; existing precedent at `voter-detail.spec.ts:104-113` (`firstQuestionInput.locator('.entitySelected')` + `firstQuestionInput.getByRole('radio', { checked: true })` + `getByText('You')`) |
| E2E-06 | Skip/delete/back → results-CTA toggles per `minimumAnswers` | `VoterNav.svelte:84-88` `voter-nav-results` testId; CTA text toggles via `voterCtx.resultsAvailable`; spec drives via `testIds.shared.questionDelete` |
| E2E-07 | Per-category SubMatch breakdown on voter-detail | `SubMatches.svelte:28-32` — `<ScoreGauge>` per `match.subMatches[i].questionGroup`; label = `questionGroup.name`; assertion = count + per-category label match against `e2e.ts` `question_categories` |
| E2E-08 | Locale switching: `/en` → `/fi`; route-prefixed + locale-switcher widget | `LanguageSelection.svelte` widget EXISTS at `apps/frontend/src/lib/dynamic-components/navigation/languages/`; only renders when `locales.length > 1`; uses Paraglide `localizeHref` |

## Standard Stack

### Core (verified against repo HEAD `5205a6c40`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 [VERIFIED: `tests/playwright.config.ts:1` import; v2.9 milestone note "Playwright 1.58.2 is the durable stack"] | E2E test framework | Locked at v2.9 — no migration in scope |
| `@openvaa/dev-seed` | workspace:^ [CITED: `package.json` workspace dependency convention; used at `variant-multi-election.ts:33`] | Test data templates + writer pipeline | Canonical data path; v2.5 deliverable |
| `@openvaa/app-shared` | workspace:^ [VERIFIED: imports `mergeSettings`, `E2E_BASE_APP_SETTINGS` at `variant-multi-election.ts:32`] | Deep-merge utility for settings overlays | Hoisted from frontend in v2.6 P64 |
| `dotenv` | (Playwright config import) [VERIFIED: `tests/playwright.config.ts:2`] | Environment loading for tests | Existing convention |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` (script runner) | (existing) | Direct `.ts` script execution | Plan 07 invokes `yarn tsx tests/scripts/diff-playwright-reports.ts <baseline> <post>` |
| Paraglide runtime | `$lib/paraglide/runtime` [VERIFIED: `LanguageSelection.svelte:17` import] | Locale switching + `localizeHref` | E2E-08 spec asserts route prefixing; widget click changes URL prefix |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `expect.poll(...).toBeGreaterThan(0)` for race tolerance | `waitFor({ state: 'visible' })` with extended timeout | Poll is for count-based "eventually visible"; waitFor is for single-anchor visibility. Use poll for E2E-04 cross-bleed assertions; waitFor for entity-list landing |
| Per-spec assertion blocks for E2E-04 5 cells | Shared helper `tests/tests/utils/selectorMatrix.ts` (`assertSelectorCell({page, ...})`) | Helper is DRY but adds a layer; per-spec is more readable. Planner's call per CONTEXT D-05 |
| Extend `voter-detail.spec.ts` for E2E-05/E2E-07 | Split into `voter-detail-cases.spec.ts` + `voter-detail-submatch.spec.ts` | Split favors parallelism; extension favors smaller diff. Planner's call per CONTEXT D-13 |

**No installation needed.** All dependencies already present at HEAD `5205a6c40`. Verified by inspection of `tests/playwright.config.ts`, `tests/tests/setup/templates/variant-multi-election.ts`, and the existing variant spec files.

**Version verification:** Phase 73 closure note (v2.9 milestone) confirms `Playwright 1.58.2 is the durable stack` — no version bump in v2.9. [VERIFIED: `.planning/REQUIREMENTS.md` line 147 "New E2E framework / migration" out-of-scope]

## Architecture Patterns

### System Architecture Diagram

```
Plan 07 cold-start gate
       │
       ▼
[ Vite-cache wipe ]
       │
       ▼
[ yarn db:reset-with-data ]  ←──┐
       │                          │
       ▼                          │  3 cold runs
[ yarn test:e2e --workers=1 ]    │  for D-09 identity
       │                          │
       ├─ data-setup ─────────────┤
       │      ↓                   │
       ├─ auth-setup ─────────────┤
       │      ↓                   │
       ├─ candidate-app           │
       ├─ candidate-app-mutation  │
       ├─ candidate-app-settings  │
       ├─ candidate-app-password  │
       ├─ voter-app  ─────────────┤  ← E2E-03, E2E-05, E2E-06, E2E-07, E2E-08 specs
       ├─ voter-app-settings      │
       ├─ voter-app-popups        │
       │      ↓                   │
       │  ─── variants chain ─────┤
       ├─ data-setup-multi-elec.  │  ← E2E-04 Ne×1c (reuse)
       ├─ variant-multi-election  │
       ├─ variant-results-sections│
       ├─ data-setup-constituency │
       ├─ variant-constituency    │
       ├─ data-setup-startfromcg  │  ← E2E-04 startFromConstituency (reuse)
       ├─ variant-startfromcg     │
       ├─ data-setup-low-min      │  ← NEW (E2E-02)
       ├─ variant-low-min-answers │
       ├─ data-setup-1e-Nc        │  ← NEW (E2E-04 cell 2)
       ├─ variant-1e-Nc           │
       ├─ data-setup-Ne-Nc        │  ← NEW (E2E-04 cell 4)
       └─ variant-Ne-Nc           │
              ↓                   │
        ─── 3 reports ─────────────┘
              ↓
[ SHA-256 hash check (D-09 byte-level identity) ]
              ↓
[ If new variants → regen-constants.mjs → update PASS_LOCKED_TESTS in
    tests/scripts/diff-playwright-reports.ts ]
              ↓
[ yarn tsx tests/scripts/diff-playwright-reports.ts run-3.json run-3.json ]
              ↓
[ PARITY GATE: PASS × 3 (1v2, 2v3, 3v3) ]
              ↓
[ 74-VERIFICATION.md written ]
```

**Trace path (Plan 04, Ne×Nc cell):** `data-setup-Ne-Nc` setup runs `runTeardown('test-', ...)` → `runPipeline(template, overrides)` → `fanOutLocales(...)` → `Writer.write(...)` → Supabase `bulk_import` RPC → `app_settings.settings` JSONB merged via `merge_jsonb_column` → spec at `Ne-Nc.spec.ts` navigates `/en/elections` → asserts both selectors visible → selects election 1 → asserts constituency dropdown shows only election-1's CGs (no bleed) → repeats for election 2.

### Recommended Project Structure (additions to existing tree)

```
tests/
├── tests/
│   ├── setup/
│   │   ├── templates/
│   │   │   ├── variant-low-minimum-answers.ts       # NEW (Plan 02)
│   │   │   ├── variant-1e-Nc.ts                      # NEW (Plan 04)
│   │   │   └── variant-Ne-Nc.ts                      # NEW (Plan 04)
│   │   ├── variant-low-minimum-answers.setup.ts     # NEW (Plan 02)
│   │   ├── variant-1e-Nc.setup.ts                    # NEW (Plan 04)
│   │   └── variant-Ne-Nc.setup.ts                    # NEW (Plan 04)
│   ├── specs/
│   │   ├── candidate/
│   │   │   └── candidate-translation.spec.ts        # NEW (Plan 01)
│   │   ├── voter/
│   │   │   ├── voter-browse-without-match.spec.ts   # NEW (Plan 02)
│   │   │   ├── voter-feedback-persistence.spec.ts   # NEW (Plan 03)
│   │   │   ├── voter-navigation.spec.ts             # NEW (Plan 03)
│   │   │   ├── voter-detail-cases.spec.ts           # NEW (Plan 05; OR extend voter-detail.spec.ts)
│   │   │   ├── voter-detail-submatch.spec.ts        # NEW (Plan 05; OR extend voter-detail.spec.ts)
│   │   │   └── voter-locale-switching.spec.ts       # NEW (Plan 06)
│   │   └── variants/
│   │       ├── 1e-Nc.spec.ts                         # NEW (Plan 04)
│   │       └── Ne-Nc.spec.ts                         # NEW (Plan 04)
│   └── utils/
│       └── selectorMatrix.ts                         # OPTIONAL NEW (Plan 04; planner's call)
└── scripts/
    └── diff-playwright-reports.ts                    # EXISTING (regen invoked by Plan 07)
```

### Pattern 1: Variant Template Authoring

**What:** New variant templates compose `BUILT_IN_TEMPLATES.e2e` as base, declare per-row `constituency_groups`/`constituencies` to escape pipeline full-fanout, apply `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` for app_settings overlay.

**When to use:** Plans 02 (low-minimum-answers) + Plan 04 (1e-Nc + Ne-Nc). Reuse `variant-multi-election.ts` as the canonical reference.

**Example (per `variant-multi-election.ts:32-50, 87-119`):**
```typescript
// Source: tests/tests/setup/templates/variant-multi-election.ts (canonical reference)
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-<name>: BUILT_IN_TEMPLATES.e2e is undefined.');

const OVERLAY = {
  questions: { questionsIntro: { allowCategorySelection: false, show: false } },
  matching: { minimumAnswers: 1 }   // E2E-02 specific
} as const;

function baseFixed(table: 'elections' | /* ... */): Array<Record<string, unknown>> {
  const fragment = base[table] as { fixed?: Array<Record<string, unknown>> } | undefined;
  return fragment?.fixed ?? [];
}

export const variantLowMinimumAnswersTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,
  organizations: { count: 0, fixed: baseFixed('organizations') },
  // ... pass-through other tables unchanged ...
  app_settings: {
    count: 0,
    fixed: [{
      external_id: 'test-app-settings-low-minimum-answers',
      settings: mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)
    }]
  }
};
```

### Pattern 2: Variant Setup File

**What:** Each variant has a setup file at `tests/tests/setup/variant-<name>.setup.ts` that:
1. Calls `runTeardown('test-', client)` to clear pre-existing test data
2. Calls `runPipeline(template, overrides)` to derive rows
3. Calls `fanOutLocales(rows, template, seed)` for translation expansion
4. Writes via `new Writer().write(rows, prefix)`
5. Post-seed asserts `client.getAppSettings()` matches expected `template.app_settings.fixed[0].settings`

**When to use:** Each NEW variant project (3 total in Phase 74).

**Example:** Direct adaptation of `tests/tests/setup/variant-multi-election.setup.ts` — replace `variantMultiElectionTemplate` import with the new template; replace `import multi-election dataset` with `import <name> dataset` in the `setup('...')` call.

### Pattern 3: Playwright Project Wiring

**What:** New variant projects insert into `tests/playwright.config.ts` after the existing variant chain. Each adds 2 entries:
1. `data-setup-<name>` project: `testMatch: /variant-<name>\.setup\.ts/`, `teardown: 'data-teardown-variants'`, `dependencies: [<previous variant>]`
2. `variant-<name>` project: `testDir: './tests/specs/variants'` (or `voter` for E2E-02), `testMatch: /<name>\.spec\.ts/`, `fullyParallel: false`, `dependencies: ['data-setup-<name>']`

**Where:** After existing `variant-startfromcg` block (line 273) and before the opt-in specialized projects (line 275). Recommended order: low-minimum-answers → 1e-Nc → Ne-Nc.

**CRITICAL:** Each new variant project's setup MUST depend on the previous variant project's spec project (sequential chain) — see CONF chain pattern at `playwright.config.ts:246-272`. Parallel variant setups race the single Supabase database.

### Pattern 4: Spec Assertion (role/aria locators)

**What:** Per CONTEXT D-11, prefer `getByRole({ name: t('...') })`, `getByLabel(...)`, `getByText(...)`. `getByTestId` requires inline `// reason:`.

**Example (from `voter-detail.spec.ts:101-113`, the existing exemplar for inline justification):**
```typescript
// Source: tests/tests/specs/voter/voter-detail.spec.ts:99-113
// reason: 'entitySelected' is a CSS class set by the OpinionQuestionInput
// component to mark the candidate's answer position; it has no ARIA role
// (the role lives on the underlying <input type="radio">), no associated
// text, and no testId. The class is the contract — getByRole/getByText/etc.
// would match either too few elements (no class info) or too many (all
// radios). Inline-justified per RESEARCH §"Pitfall" + §"Anti-Patterns".
const firstQuestionInput = opinionsTab.getByTestId('opinion-question-input').first();
// eslint-disable-next-line playwright/no-raw-locators
await expect(firstQuestionInput.locator('.entitySelected')).toHaveCount(1);

await expect(firstQuestionInput.getByRole('radio', { checked: true })).toHaveCount(1);
await expect(firstQuestionInput.getByText('You')).toBeAttached();
```

### Pattern 5: Race-tolerant assertion

**What:** Use `expect.poll(async () => /* count */).toBeGreaterThan(0)` for "X must eventually appear"; use `waitFor({ state: 'visible' })` against the asserted element (NOT `networkidle`).

**When to use:** E2E-04 cross-bleed dropdown options (poll-style); E2E-05 drawer load (waitFor against entity-details container).

**Example:** v2.6 P64 D-11 exemplar pattern. Already canonical in `voter-results.spec.ts`.

### Anti-Patterns to Avoid

- **`waitForLoadState('networkidle')`** — banned by `playwright/no-networkidle` at `'error'` post-Phase-73. Replace with `waitFor({ state: 'visible' })` against asserted element.
- **`page.locator('css-selector')`** — banned by `playwright/no-raw-locators` at `'error'`. Use role/aria/text locators or `getByTestId` with inline `// reason:`.
- **`if (...)` branches in test bodies** — banned by `playwright/no-conditional-in-test` at `'error'`. Split into separate tests or use deterministic assertions.
- **`waitFor({state:'visible'})` on already-visible anchors** — CR-02 finding from Phase 73. Resolves instantly, defeats popup-delay race-tolerance. For negative-control timing, use `expect.poll(...).toBe(0)` over the delay window OR `expect(dialog).toBeHidden({ timeout: 3000 })`.
- **Renaming an `IMGPROXY_TIED_TITLES` test** — `regen-constants.mjs:80-87` will exit 1 with "match-count assertion failed". Avoid renaming the 14 bound titles unless explicitly re-baselining.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deep-merge settings overlays | Custom merge function | `mergeSettings` from `@openvaa/app-shared` | Frontend's shallow `mergeAppSettings` clobbers nested keys; deep merge is the contract (P63 Pitfall 3) |
| Variant data lifecycle | Bespoke per-variant teardown | `runTeardown('test-', client)` from `@openvaa/dev-seed` | Single canonical teardown; matches `'test-'` prefix filter |
| Locale switching test logic | URL string concatenation | `buildRoute({ route, locale })` + Paraglide `localizeHref` | `route.ts` ROUTE map is the contract; routes do NOT use `[[lang=locale]]` dir prefix |
| Voter answer fixture | New fixture per case | Extend `e2e.ts` voter dataset (D-07) + reuse `answeredVoterPage` | 4 cases live in default template; no new variant project needed |
| Cross-election bleed assertion (E2E-04) | Custom DOM walker | `dropdown.getByRole('option')` count + per-option text match | Standard select-option enumeration; deterministic |
| 3-run determinism comparison | Bespoke diff | `tests/scripts/diff-playwright-reports.ts` parity script | Already canonical post-Phase-73; SHA-identity is the strongest signal |
| Regen constants if pool changes | Manual edit of arrays | `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` | Reads latest JSON report, partitions, emits paste-ready arrays |
| Vite cache wipe automation | Per-plan recipe | Direct invocation `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per D-12 | CLEAN-01 `dev:clean` ships in Phase 78; don't wait for it |

**Key insight:** All infrastructure is already in place post-Phase-73. Phase 74 is content authoring — new specs and new variant fixtures that COMPOSE existing primitives. The only risk areas are: (1) avoiding `IMGPROXY_TIED_TITLES` collisions in new spec names, (2) ensuring the new variant project order in `playwright.config.ts` is sequential not parallel, and (3) keeping role/aria locators dominant in spec authoring.

## Runtime State Inventory

This phase is content authoring + new variant fixtures, NOT a rename/refactor. Runtime state inventory does not apply in the canonical sense, but for completeness:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Supabase `app_settings` table (per project_id, unique); writer merges via `merge_jsonb_column` RPC (additive — Pitfall 3) | Each NEW variant setup writes its own `test-app-settings-<name>` row; teardown clears all `'test-'`-prefix rows; no data migration |
| Live service config | Playwright project graph in `tests/playwright.config.ts` | Plan 02 + Plan 04 add 3 new variant project pairs (data-setup + variant); sequential dependency chain required |
| OS-registered state | None — Phase 74 is testing-only, no OS-level services | None — verified by scope (no daemons, no scheduled tasks, no system installs) |
| Secrets/env vars | `SUPABASE_SERVICE_ROLE_KEY`, `PLAYWRIGHT_BANK_AUTH`, `PLAYWRIGHT_VISUAL`, `PLAYWRIGHT_PERF`, `FRONTEND_PORT` — all unchanged | None — Phase 74 reads existing env contract; no new env vars |
| Build artifacts | `tests/scripts/diff-playwright-reports.ts` PASS_LOCKED/DATA_RACE/CASCADE constants (lines 73-156) | Plan 07 conditionally regenerates per D-10 (only if new variant specs land OR pre-existing test pass/fail changes). `regen-constants.mjs` is the bind-source. Adding 3 new variant specs to PASS_LOCKED requires regen. |

**Canonical question — "what runtime systems still have the old state cached, stored, or registered after Phase 74's changes land?"** Answer: the parity-script constants in `tests/scripts/diff-playwright-reports.ts` MUST be regenerated if new variant specs land in PASS_LOCKED (the expected outcome). Plan 07 verifies; the regen script at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` is the bind-source. No data migration needed (Supabase rows are recreated per `db:reset`).

## Common Pitfalls

### Pitfall 1: IMGPROXY_TIED_TITLES collision in new spec titles
**What goes wrong:** A new spec uses a title pattern that matches one of the 14 bound `IMGPROXY_TIED_TITLES` (`regen-constants.mjs:55-70`). Regen fails with `match-count assertion failed`.
**Why it happens:** The 14 titles are structurally fragile — any test ending with `> <bound-title>` matches via `id.endsWith('> ' + t)`.
**How to avoid:** Read `regen-constants.mjs:55-70` before naming new specs. Avoid titles like `should upload a profile image (CAND-03)`, `should hide hero when hideHero is enabled`, `should render help page correctly`, `should change password and login with new password`. Use distinctive titles for new specs.
**Warning signs:** Plan 07 regen script exit code 1 with "match-count assertion failed".

### Pitfall 2: E2E-01 multilocale translation surface is a Button, not a Tab
**What goes wrong:** Spec written against `getByRole('tab', { name: /translations/i })` based on the CONTEXT description "translation tab/dialog renders". The actual UI at `Input.svelte:641-647` is a `<Button>` with text `t('components.input.showTranslations')` (en: "Translations") / `t('components.input.hideTranslations')` (en: "Hide"). It toggles `isTranslationsVisible` to expand additional locale fields inline within the same component — there is no separate tab.
**Why it happens:** v2.6/v2.7-era operator notes describe "translation tab/dialog" conceptually; the implementation chose an inline expand-collapse button pattern instead.
**How to avoid:** Locate via `getByRole('button', { name: t('components.input.showTranslations') })` — when clicked, additional `<input>` / `<textarea>` elements per non-default locale become visible. Assertion shape:
```typescript
const toggleBtn = page.getByRole('button', { name: /Translations/i });
await expect(toggleBtn).toBeVisible();   // Multilocale: button renders
await toggleBtn.click();                  // Expand
await expect(page.getByLabel(/Suomi|Svenska|Dansk/i).first()).toBeVisible();  // additional locale fields surface
// Authoring + save flow uses the standard candidate-question-save path
```
**Warning signs:** Spec asserts `getByRole('tab', ...)` and gets 0 matches.

### Pitfall 3: Routes do NOT use `[[lang=locale]]` directory prefix
**What goes wrong:** Spec assumes URL is `/en/elections` because CONTEXT references `[[lang=locale]]` in route paths.
**Why it happens:** `buildRoute.ts:10-20` treats `[[lang=locale]]` as a special marker but the `ROUTE` map in `apps/frontend/src/lib/utils/route/route.ts:11-66` does NOT include `[[lang=locale]]` segments — routes are e.g. `/(voters)/elections` (where `(voters)` is a SvelteKit group that gets stripped at route resolution).
**Reality:** Locale prefixing happens through Paraglide runtime (`localizeHref` at `LanguageSelection.svelte:17`). The default locale (`en`) renders WITHOUT prefix; non-default locales (`fi`/`sv`/`da`) get `/fi/...` etc. prefix injected by Paraglide.
**How to avoid:** For E2E-08, navigate first to a non-prefixed URL (default `en`); switch via the `LanguageSelection` widget; assert URL gains the `/fi/` prefix; navigate directly to `/fi/...` for the route-prefixed form.
**Warning signs:** Spec navigates to `/en/results` and gets a 404 or wrong page.

### Pitfall 4: `mergeSettings` is DEEP MERGE; legacy frontend `mergeAppSettings` is SHALLOW
**What goes wrong:** Spec or variant overlay uses the wrong merge function; nested keys get clobbered.
**Why it happens:** `apps/frontend/src/lib/utils/merge.ts` shim was retired in v2.8 P72 SHARED-02; legacy code may still reference it. Variants MUST use `mergeSettings` from `@openvaa/app-shared`.
**How to avoid:** Always `import { mergeSettings } from '@openvaa/app-shared'`. Never reach into frontend utils for merge in test-side code. Verified by `variant-multi-election.ts:32`.
**Warning signs:** Variant overlay's nested keys (e.g. `results.cardContents`) disappear from the persisted `app_settings.settings` row.

### Pitfall 5: New variant project parallel dependency races Supabase
**What goes wrong:** New variant data-setup project depends on `data-setup` (the base) instead of the previous variant's spec project. Multiple variant setups run in parallel; they race the single Supabase database; `runTeardown('test-', client)` from one variant deletes data that another variant just wrote.
**Why it happens:** Easy mistake — looks parallelizable. The existing chain is sequential by design (`playwright.config.ts:246-273`).
**How to avoid:** Each new `data-setup-<name>` project MUST list the PREVIOUS variant's SPEC project (e.g. `variant-startfromcg`, then `variant-low-minimum-answers`, then `variant-1e-Nc`) in `dependencies`. NOT the base `data-setup`. See `playwright.config.ts:248, 264` for the canonical chain.
**Warning signs:** Variant specs intermittently fail with "expected N rows, found 0"; teardown ran mid-write.

### Pitfall 6: Vite cache between phases hides shared-type changes
**What goes wrong:** Phase 74 specs land; cold-start smoke uses pre-bundled deps from a prior phase; new shared types (e.g. if D-07 adds a fixture marker) aren't visible at runtime.
**Why it happens:** Vite preserves pre-bundled deps in `apps/frontend/node_modules/.vite/`; pre-rendered routes cache in `.svelte-kit/`.
**How to avoid:** Plan 07 MUST `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` BEFORE the first cold run. Per CONTEXT D-12 and the v2.8 close gotcha (`.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke").
**Warning signs:** Cold-start run fails with module-resolution errors or stale type errors that disappear after a second run.

### Pitfall 7: CR-02 negative-control timing pattern (Phase 73 advisory)
**What goes wrong:** Spec writes `await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 5000 })` on an already-visible element to "wait 5 seconds for a popup that should NOT appear". `waitFor` resolves instantly; the negative control becomes a false-positive PASS.
**Why it happens:** Pattern looks like a timing wait but isn't.
**How to avoid:** For negative-control timing waits in E2E-03 (post-send empty assertion) or E2E-06 (browser-back assertion), use either `await page.waitForTimeout(N)` with inline `// eslint-disable-next-line playwright/no-wait-for-timeout` + `// reason:` per v2.8 P70 Cat A, OR `await expect.poll(async () => dialog.count(), { timeout: 5000 }).toBe(0)` (race-tolerant negative control).
**Warning signs:** Negative control assertion passes in milliseconds, much faster than the expected wait window. (Phase 73 advisory CR-02 — currently dormant because affected tests are CASCADE-pool.)

### Pitfall 8: `getByRole('dialog')` is used for BOTH modals and popups
**What goes wrong:** E2E-03 feedback-modal assertions collide with VOTE-15/VOTE-16 popup assertions in `voter-popups.spec.ts`.
**Why it happens:** Multiple components render `<dialog role="dialog">`; feedback modal, popup modal, entity-details drawer all match `getByRole('dialog')`.
**How to avoid:** Anchor the locator to a distinguishing child element: `page.getByRole('dialog').filter({ has: page.getByTestId('feedback-form') })` (per `Feedback.svelte:158` `data-testid="feedback-form"`). Or use the feedback-specific testIds (`feedback-submit`, `feedback-cancel`, `feedback-description`) for the inside-modal interactions.
**Warning signs:** Spec assertion `await expect(page.getByRole('dialog')).toBeHidden()` resolves against a different dialog (or fails when one exists but not the feedback one).

## Code Examples

Verified patterns from official sources:

### E2E-01: Translation surface multilocale assertion
```typescript
// Source: based on Input.svelte:641-647 + tests/tests/fixtures/index.ts (candidateQuestionsPage fixture)
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';

test('multilocale candidate can author translations on a non-disabled question', async ({
  page,
  candidateQuestionsPage,
  questionPage
}) => {
  await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));
  await candidateQuestionsPage.navigateToQuestion(0);   // test-question-1 (allowOpen + multilocale comment)
  await questionPage.fillComment('persistence test text in en');

  // The translations toggle button renders only when locales.length > 1.
  // staticSettings ships 4 locales (en/fi/sv/da) by default → button is present.
  const translationsBtn = page.getByRole('button', { name: /^Translations$/i });
  await expect(translationsBtn).toBeVisible();
  await translationsBtn.click();

  // After expansion, per-locale labeled inputs appear. Match by aria-labelledby semantics
  // via getByLabel: each non-default locale's input has an aria-labelledby pointing to a
  // label rendered with t(`lang.${locale}`) (Input.svelte:392).
  const fiInput = page.getByLabel(/Suomi/i);
  await expect(fiInput).toBeVisible();
  await fiInput.fill('persistence test text in fi');

  await questionPage.saveAnswer();
  await page.reload();

  // After reload, expand translations again and assert the fi value persisted
  await page.getByRole('button', { name: /^Translations$/i }).click();
  await expect(page.getByLabel(/Suomi/i)).toHaveValue('persistence test text in fi');
});
```

### E2E-02: Browse-without-match overlay + assertion
```typescript
// Source: extends Variant project pattern from variant-multi-election.setup.ts
// Variant template overlay (variant-low-minimum-answers.ts):
const LOW_MIN_ANSWERS_OVERLAY = {
  questions: { questionsIntro: { allowCategorySelection: false, show: false } },
  matching: { minimumAnswers: 1 }   // verified path: dynamicSettings.matching.minimumAnswers (dynamicSettings.ts:42)
} as const;

// Spec (voter-browse-without-match.spec.ts):
test('voter completes location, skips opinions, browses entity list without match scores', async ({
  page
}) => {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  // Navigate through location selection — the variant auto-implies elections + constituencies
  // (1e×1c base), so we land directly on the questions intro / first question.
  // Skip directly to /results without answering opinion questions.
  await page.goto(buildRoute({ route: 'Results', locale: 'en' }));
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });

  // Assertion 1: entity cards still render (browse path is open)
  await expect(page.getByTestId(testIds.voter.results.card).first()).toBeVisible();

  // Assertion 2: match-score column/badge ABSENT. The match score in EntityCard
  // renders as the radial ScoreGauge inside the SubMatches block; in the "browse"
  // path (no match yet), match.score is undefined and SubMatches do not render.
  await expect(page.getByTestId(testIds.voter.results.list).getByText(/%/)).toHaveCount(0);

  // Assertion 3: intro copy is the "browse" form, not "results".
  // VoterNav.svelte:87 uses voterCtx.resultsAvailable to toggle between
  // t('results.title.results') and t('results.title.browse'). Assert the ingress
  // (testIds.voter.results.ingress = 'voter-results-ingress') contains the browse copy.
  const ingress = page.getByTestId(testIds.voter.results.ingress);
  await expect(ingress).toBeVisible();
  // Note: exact translation key for browse-without-match ingress needs confirmation
  // at PLAN.md time — likely 'results.ingress.browse' or 'results.title.browse'.
});
```

### E2E-03: Feedback dialog persistence sequence
```typescript
// Source: Feedback.svelte:132-137 (reset triggered only on send) + FeedbackModal.svelte:46-52
test('feedback text persists across dismiss + resets after send', async ({ answeredVoterPage }) => {
  const page = answeredVoterPage;

  // The feedback button is in the nav menu; openFeedbackModal is exposed via voterCtx.
  // Locator: anchor to the feedback-form testId inside the modal dialog.
  const openFeedbackBtn = page.getByRole('button', { name: /feedback/i }).first();
  await openFeedbackBtn.click();

  const feedbackDialog = page.getByRole('dialog').filter({ has: page.getByTestId('feedback-form') });
  await expect(feedbackDialog).toBeVisible();

  const description = feedbackDialog.getByTestId('feedback-description');
  // reason: textarea has aria-label tied to t('feedback.description.label'), but
  // multiple locales make a stable getByLabel regex fragile. Anchor to testid.
  await description.fill('persistence test text');

  // Dismiss via the cancel button (does NOT trigger reset).
  await feedbackDialog.getByTestId('feedback-cancel').click();
  await expect(feedbackDialog).toBeHidden();

  // Reopen — Feedback component was kept mounted via bind:this; description $state survives.
  await openFeedbackBtn.click();
  await expect(feedbackDialog).toBeVisible();
  await expect(description).toHaveValue('persistence test text');

  // Type new text, send. Modal auto-closes after CLOSE_DELAY=1500ms via onSent timeout.
  await description.fill('new text for send-reset');
  await feedbackDialog.getByTestId('feedback-submit').click();

  // Wait for auto-close (FeedbackModal.svelte:48 onSent → setTimeout closeFeedback + reset).
  await expect(feedbackDialog).toBeHidden({ timeout: 5000 });

  // Reopen — reset cleared description to ''.
  await openFeedbackBtn.click();
  await expect(feedbackDialog).toBeVisible();
  await expect(description).toHaveValue('');
});
```

### E2E-04: Selector matrix assertion (Ne × Nc cell — strongest cross-bleed assertion)
```typescript
// Source: variant pattern from variant-multi-election.spec.ts (adapted for Ne×Nc)
test('Ne × Nc — both selectors shown; constituency options filter to selected election only', async ({ page }) => {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  // 1. Election selector visible (multiple elections)
  await page.getByTestId(testIds.voter.elections.list).waitFor({ state: 'visible' });
  await expect(page.getByTestId(testIds.voter.elections.card)).toHaveCount(2);   // Ne = 2

  // 2. Select Election 1
  await page.getByTestId(testIds.voter.elections.card).first().click();
  await page.getByTestId(testIds.voter.elections.continue).click();

  // 3. Constituency selector visible (multiple constituencies)
  const constSelector = page.getByTestId(testIds.voter.constituencies.selector);
  await constSelector.waitFor({ state: 'visible' });

  // 4. Constituency dropdown options = Election 1's CGs only (3 entries; no cross-bleed)
  const election1Options = await constSelector.getByRole('option').count();
  expect(election1Options).toBe(3);   // Nc for E1

  // 5. Reverse: go back, pick Election 2 — assert constituency dropdown
  //    rebuilds with Election 2's CGs only (also 3, but DIFFERENT external_ids).
  await page.goBack();
  await page.getByTestId(testIds.voter.elections.card).nth(1).click();
  await page.getByTestId(testIds.voter.elections.continue).click();
  const election2Options = await constSelector.getByRole('option').allTextContents();
  expect(election2Options).toHaveLength(3);

  // 6. Cross-bleed negative assertion: NO Election-1 option text appears
  //    in the Election-2 dropdown.
  for (const e1OptionText of /* captured from step 4 */ []) {
    expect(election2Options).not.toContain(e1OptionText);
  }
});
```

### E2E-05: Voter-detail 4-case (case (a) both answered exemplar)
```typescript
// Source: voter-detail.spec.ts:73-122 (existing exemplar; D-07 extends dataset)
test('case (a) — both answered: voter answer + entity answer rendered with correct visual state', async ({
  answeredVoterPage: page
}) => {
  // Open the entity in question — D-07 reserves a candidate for case (a) markers
  await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseA-Both' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: /opinions/i }).click();
  const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);

  // The case-(a) question has both voter and entity answers → both rendering anchors present.
  const caseAInput = opinionsTab.getByTestId('opinion-question-input').filter({ hasText: 'E2E-05/case-(a)' }).first();

  // Entity's answer: `.entitySelected` class on the choice the entity picked.
  // eslint-disable-next-line playwright/no-raw-locators
  // reason: visual contract is a CSS class (entitySelected); no aria/role equivalent.
  await expect(caseAInput.locator('.entitySelected')).toHaveCount(1);

  // Voter's answer: input[type=radio][checked] + 'You' label sibling.
  await expect(caseAInput.getByRole('radio', { checked: true })).toHaveCount(1);
  await expect(caseAInput.getByText('You')).toBeAttached();
});
```

### E2E-06: Skip / delete / back — results-CTA toggle
```typescript
// Source: VoterNav.svelte:84-88 (resultsAvailable toggle); shared.questionDelete testId
test('voter answers N → deletes one → results-CTA disabled → re-answers → re-enabled', async ({
  answeredVoterPage: page
}) => {
  // answeredVoterPage fixture has answered 16 questions; minimumAnswers default = 5.
  // Results CTA is enabled.
  const resultsNav = page.getByTestId('voter-nav-results');
  await expect(resultsNav).not.toHaveAttribute('aria-disabled', 'true');

  // Navigate back through the answer loop and delete answers until count drops below 5.
  // Use voterCtx.unansweredOpinionQuestions invariant — we need to drop from 16 answered
  // to < 5 by deleting 12 (since deleting an answer un-answers it).
  // Simpler: navigate to a specific question and delete.
  for (let i = 0; i < 12; i++) {
    await page.goto(buildRoute({ route: 'Questions', locale: 'en' }) + `/${i + 1}`);
    // shared.questionDelete = 'question-delete' (per testIds.ts:147)
    await page.getByTestId(testIds.shared.questionDelete).click();
  }

  // After deletion brings count below minimumAnswers, results-CTA toggles to "browse"
  // text via resultsAvailable=false.
  await expect(resultsNav).toHaveText(/browse/i);

  // Re-answer one — count back at threshold → CTA toggles back.
  await page.goto(buildRoute({ route: 'Questions', locale: 'en' }) + '/1');
  await page.getByTestId(testIds.voter.questions.answerOption).first().click();
  await expect(resultsNav).toHaveText(/results/i);

  // Browser-back negative assertion: state survives back nav.
  await page.goBack();
  await page.goBack();
  // Assert the answer count delta survives nav (specific assertion shape TBD at PLAN.md time)
});
```

### E2E-07: SubMatch per-category breakdown
```typescript
// Source: SubMatches.svelte:28-32 renders 1 ScoreGauge per match.subMatches[i] with questionGroup.name as label
test('per-category SubMatch breakdown renders on voter-detail', async ({ answeredVoterPage: page }) => {
  await page.getByTestId(testIds.voter.results.card).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // SubMatches component renders a grid of ScoreGauge instances inside EntityCard
  // (variant !== 'subcard' && match.subMatches.length && showSubMatches).
  // The e2e.ts template has 4 opinion categories: economy, social, voter-economy, voter-social.
  // For a non-partial candidate (e.g. alpha), all 4 should render.
  const subMatchGrid = dialog.locator('[style*="grid-template-columns"]').first();
  // reason: SubMatches.svelte renders an unwrapped `<div>` with no testId, no role, no
  // aria-label; the grid is the visible container. Locating by inline style is the only
  // robust anchor (the style is computed in $derived at line 25). Inline-justified.
  // eslint-disable-next-line playwright/no-raw-locators
  await expect(subMatchGrid).toBeVisible();

  // Per-category assertion: each ScoreGauge displays the category name as its label.
  // ScoreGauge label = questionGroup.name (the category name from e2e.ts).
  for (const categoryName of [
    'Test Category: Economy',
    'Test Category: Social',
    'Test Voter Category: Economy',
    'Test Voter Category: Social'
  ]) {
    await expect(subMatchGrid.getByText(categoryName)).toBeVisible();
  }

  // Manhattan + directional metric paths: ordinal-question categories (Economy/Social)
  // use Manhattan distance; if categorical questions are added (future QSPEC-02 fixture),
  // the directional path would render differently. For Phase 74's e2e.ts dataset, all 4
  // categories are ordinal — so the assertion is symmetric (all 4 ScoreGauges with score 0-100).
});
```

### E2E-08: Locale switching (route-prefixed + widget)
```typescript
// Source: LanguageSelection.svelte (locale switcher widget); Paraglide localizeHref
test('locale switches via route prefix + via widget', async ({ page }) => {
  // 1. Visit home in en (default — NO prefix)
  await page.goto('/');
  // Assert an en-only key string
  await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();

  // 2. Visit /fi/ directly (route-prefixed form, asserted by SC #8)
  await page.goto('/fi');
  // Assert the Finnish translation of the start button
  await expect(page.getByRole('button', { name: /Aloita/i })).toBeVisible();

  // 3. Switch via the widget (LanguageSelection in the nav menu)
  // The widget only renders when locales.length > 1 (verified at LanguageSelection.svelte:25).
  // Open the nav menu first
  await page.getByRole('button', { name: /open menu|toggle menu/i }).click();
  // Click the English language nav item
  await page.getByRole('link', { name: /^English$/ }).click();
  // After click, page reloads (data-sveltekit-reload at LanguageSelection.svelte:30).
  // URL prefix is dropped (en is the default).
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `waitForLoadState('networkidle')` | `waitFor({ state: 'visible' })` against asserted element | Phase 73 (DETERM-03 sweep) | Banned by lint at `'error'` |
| `page.locator('[data-testid="..."]')` raw selector | `getByTestId(...)` with `// reason:` justification | Phase 73 (DETERM-03 sweep) | Banned by lint at `'error'` |
| Conditional `if (...)` in test body | Split into separate tests or deterministic assertion | Phase 73 (DETERM-03 sweep) | Banned by lint at `'error'` |
| `test.skip(true, '<flaky>')` | `expect.poll(...).toBeGreaterThan(0)` (race-tolerant) OR `// reason:` documented skip with `eslint-disable-next-line` | Phase 64 P64 D-11; Phase 73 D-07 | Test.skip survives only for env-gated preconditions (bank-auth) |
| Cluster-level `// reason:` for casts | Per-cast distribution with site-specific rationale | Phase 71 P71 D-04 | Strict-reading auditors expect per-site |
| Shallow `mergeAppSettings` from frontend utils | Deep `mergeSettings` from `@openvaa/app-shared` | v2.8 P72 SHARED-02 | Shim retired; canonical import is `@openvaa/app-shared` |
| `apps/frontend/src/lib/utils/merge.ts` shim | Direct import of `mergeSettings` / `DeepPartial` from `@openvaa/app-shared` | v2.8 P72 SHARED-02 | Shim deleted |
| 3-run determinism gate from Phase 64 (single fresh run + 2 re-runs without resetting) | Same shape preserved post-Phase-73 | (no change) | Plan 07 reuses |

**Deprecated/outdated:**
- `tests/data/overlays/<name>-overlay` JSON fixtures — superseded in v2.6 P63 by the TypeScript template pattern. Phase 74 uses ONLY the TS template form.
- `updateAppSettings(...)` call in variant setup files — pre-v2.6 P63 pattern; replaced by `template.app_settings.fixed[]` + post-seed `toMatchObject` assertion in `variant-*.setup.ts`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | E2E-02 ingress translation key is `results.title.browse` (or `results.ingress.browse`) | Code Examples §E2E-02 [ASSUMED] | Spec assertion fails at runtime; quickly fixed by reading `voter-results-ingress` element text and updating the regex |
| A2 | E2E-04 cross-bleed assertion uses `getByRole('option')` enumeration | Code Examples §E2E-04 [ASSUMED — constituency selector implementation may use a custom dropdown not native `<select>`] | If custom dropdown, locator becomes `constSelector.getByText(...)` or a structural class-based locator with `// reason:` |
| A3 | E2E-07 SubMatch grid is the visible container; no role/aria | Code Examples §E2E-07 [VERIFIED: `SubMatches.svelte:28-32` is a `<div>` with no role/aria/testId] | Inline-justified per D-11 already covered |
| A4 | E2E-06 `shared.questionDelete = 'question-delete'` testId exists at runtime | Code Examples §E2E-06 [VERIFIED: `testIds.ts:147`] | None — testId is registered |
| A5 | E2E-01 candidate-questions fixture provides logged-in candidate-app session | Code Examples §E2E-01 [VERIFIED: `tests/playwright.config.ts:113-118` candidate-app project with storageState] | None — fixture is canonical |
| A6 | E2E-08 default-locale prefix is dropped (en → `/`, fi → `/fi/`) | Code Examples §E2E-08 [ASSUMED — based on Paraglide convention; needs confirmation by direct navigation at PLAN.md time] | Spec asserts wrong URL pattern; quickly fixed |
| A7 | The 3 new variant projects land in PASS_LOCKED (per D-09 "expected") | Validation Architecture §Plan 07 [ASSUMED] | If any new spec lands in DATA_RACE, per-test rationale required in `74-VERIFICATION.md`; pool MUST NOT grow without rationale |
| A8 | Phase 73's `e2e56e73fa42…` SHA-identity is the binding 3-run determinism anchor | Pattern §3-run gate [VERIFIED: `73-VERIFICATION.md` lines 30, 195-199] | None |
| A9 | `regen-constants.mjs` is at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (lives in planning dir, not tests/) | Don't Hand-Roll §Regen constants [VERIFIED: file exists at this path] | Plan 07 must reference this exact path; no copy needed |
| A10 | Adding 3 new variant projects + their specs triggers `regen-constants.mjs` (per D-10 condition) | Validation Architecture §Plan 07 [VERIFIED: D-10 explicit "Plans 02 + 04 add 3 new projects → regen required"] | None |

## Open Questions

1. **Exact translation key for E2E-02 browse-without-match ingress copy**
   - What we know: `voter-results-ingress` testId exists; results page intro toggles between "results" and "browse" forms via `voterCtx.resultsAvailable`.
   - What's unclear: Exact translation key. Likely `results.title.browse` (per VoterNav pattern) or `results.ingress.browse`.
   - Recommendation: At PLAN.md time, read `apps/frontend/src/lib/i18n/translations/en/results.json` or grep `t('results.` in the results page to locate the exact key; lock in PLAN.md.

2. **E2E-04 cross-bleed dropdown locator shape**
   - What we know: Constituency selector exists at `testIds.voter.constituencies.selector`; dropdown implementation lives in `apps/frontend/src/lib/components/electionSelector` or equivalent.
   - What's unclear: Whether the dropdown is a native `<select>` (so `getByRole('option')` works) or a custom DaisyUI component (so locator may need adjustment).
   - Recommendation: At PLAN.md time, read the selector component to determine. If custom, add helper or inline `// reason:` for structural locator.

3. **E2E-06 results-CTA "disabled" vs "hidden" semantics**
   - What we know: `VoterNav.svelte:84-88` renders the nav item with `disabled` attribute when `!(elections.length && constituencies.length)`; the TEXT toggles via `resultsAvailable`.
   - What's unclear: Whether the operator-described "results-CTA disabled" means `disabled` attribute OR "browse" text. The CONTEXT says "results-CTA hides" — but the actual UI shows "Browse Entities" text rather than hiding.
   - Recommendation: Plan 03's PLAN.md must lock the assertion shape — likely `await expect(resultsNav).toHaveText(/browse/i)` for "below threshold" and `/results/i` for "at threshold".

4. **E2E-07 directional metric path**
   - What we know: Default `e2e.ts` template has only ordinal categorical (`singleChoiceOrdinal`) questions. Manhattan distance is the only metric exercised.
   - What's unclear: How to assert the "directional metric path" if no categorical questions exist in the default e2e template. The CONTEXT specs this but the underlying data doesn't currently support it.
   - Recommendation: Plan 05's PLAN.md must decide: (a) extend `e2e.ts` to add categorical questions (out of D-07 scope but small), (b) defer directional metric path to QSPEC-02 in Phase 75 and assert only Manhattan in E2E-07, (c) add a small Phase 74 dev-seed extension with one categorical question. Most economical: option (b) — but ROADMAP SC #7 explicitly names both Manhattan and directional. Reconcile in PLAN.md.

5. **E2E-01 fixture-managed candidate session**
   - What we know: `candidate-app` project depends on `auth-setup` which writes storageState to `STORAGE_STATE` file. The pre-authenticated candidate is `mock.candidate.2@openvaa.org` (`test-candidate-alpha` per data setup).
   - What's unclear: Whether translation surface on a question survives the candidate-questions auth context. (E2E-01 spec runs inside the `candidate-app` project; if it lands in CASCADE pool downstream of imgproxy-tied auth-setup cascade per Phase 73 D-09, the spec may not run.)
   - Recommendation: Plan 01 must verify that `candidate-translation.spec.ts` does NOT cascade-skip under the canonical cold-start state. If it does (likely, given E2E-01 sits in `candidate-app` which currently has CASCADE entries), the spec authoring still proceeds, but Plan 07 must classify the new spec as CASCADE OR DATA_RACE in `74-VERIFICATION.md`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (yarn 4 workspace) | All commands | ✓ | (existing v2.8/2.9 baseline) | — |
| `@playwright/test` | Spec execution | ✓ | 1.58.2 | — |
| Supabase CLI | `yarn db:reset-with-data`, local Supabase | ✓ | (existing baseline) | — |
| Docker (imgproxy) | Image-render tests | **PARTIALLY AVAILABLE** | — | Imgproxy container persistently absent at Phase 73 close. DATA_RACE pool holds 15 imgproxy-tied tests already; pool MUST NOT grow. Phase 74 specs MUST avoid image-upload paths. |
| `tsx` | Direct `.ts` script execution | ✓ | (existing baseline) | — |
| `regen-constants.mjs` | Conditional parity-script regen | ✓ at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` | (Phase 73 Plan 06 restored) | — |
| `tests/scripts/diff-playwright-reports.ts` | 3-run determinism gate | ✓ at HEAD | (Phase 73 Plan 06 restored from SHA `2832c4410`) | — |

**Missing dependencies with no fallback:** None blocking. The imgproxy infrastructure absence is the only env gap, and per CONTEXT D-09 it is out of scope for v2.9 (imgproxy resolution deferred to v2.10+ infrastructure phase). Phase 74 specs avoid image-upload paths by design.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 + vitest 3.x (unit tests already passing — out of phase scope) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "<spec-name>"` |
| Full suite command | `yarn test:e2e --workers=1` (per Plan 07; matches Phase 73 gate) |
| Determinism re-run | `for i in {1..3}; do yarn test:e2e --workers=1; done` (manual 3-run smoke OR scripted) |
| Verification gate | `yarn tsx tests/scripts/diff-playwright-reports.ts run-N.json run-M.json` × 3 pair invocations |
| Lint | `yarn lint:check` (root, 0/0 expected post-Phase-73) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| E2E-01 | Multilocale candidate translation surface renders | e2e | `yarn test:e2e --grep "multilocale candidate translation"` | ❌ Plan 01 creates `tests/tests/specs/candidate/candidate-translation.spec.ts` |
| E2E-02 | Voter under minimumAnswers browses entity list without match scores | e2e (variant) | `yarn test:e2e --project=variant-low-minimum-answers` | ❌ Plan 02 creates spec + variant project + setup |
| E2E-03 | Feedback text persists across dismiss; resets on send | e2e | `yarn test:e2e --grep "feedback.*persist"` | ❌ Plan 03 creates `voter-feedback-persistence.spec.ts` |
| E2E-04 | 5-cell selector matrix + no cross-election bleed | e2e (5 variants) | `yarn test:e2e --project=variant-1e-Nc --project=variant-Ne-Nc --project=variant-multi-election --project=variant-startfromcg`; cell 1 in default voter-app project | ❌ Plan 04 creates 2 NEW spec files + 2 NEW variant projects; reuses 3 existing variant projects with additive assertions |
| E2E-05 | Voter answer + entity answer in drawer (4 cases) | e2e | `yarn test:e2e --grep "voter-detail.*case-\\([abcd]\\)"` | ❌ Plan 05 extends `voter-detail.spec.ts` OR creates `voter-detail-cases.spec.ts`; dev-seed extension lands first |
| E2E-06 | Skip/delete/back → results-CTA toggle predictably | e2e | `yarn test:e2e --grep "results.*CTA.*toggle"` | ❌ Plan 03 creates `voter-navigation.spec.ts` |
| E2E-07 | Per-category SubMatch breakdown renders | e2e | `yarn test:e2e --grep "submatch.*per.*category"` | ❌ Plan 05 extends `voter-detail.spec.ts` OR creates `voter-detail-submatch.spec.ts` |
| E2E-08 | Locale switch via route prefix + widget translates UI | e2e | `yarn test:e2e --grep "locale.*switch"` | ❌ Plan 06 creates `voter-locale-switching.spec.ts` |

### Sampling Rate

- **Per task commit:** Plan-scoped `yarn test:e2e --workers=1 --grep "<plan-scope>"` smoke (matches plan being touched only).
- **Per wave merge:** Per-plan completion runs a `--workers=1` smoke + a 3-spot-check (`for i in {1..3}; do <grep>; done`) on flake-prone specs to confirm determinism.
- **Phase gate (Plan 07):** Full suite × 3 cold-start `--workers=1` runs with vite-cache wipe before run 1. SHA-256 confirm byte-level identity. Parity script self-identity smoke. `74-VERIFICATION.md` written.

### What FAILS LOUDLY when contract breaks

| Req ID | Failure-Loud Mechanism |
|--------|------------------------|
| E2E-01 | If multilocale translation button is removed or renamed: `getByRole('button', { name: /Translations/i })` returns 0 matches → spec fails. If `localizationDisabled === true` on the target question, button is absent (or per `Input.svelte`, locales.length === 1 path) — variant defensive assertion catches absence. |
| E2E-02 | If `minimumAnswers` overlay path is wrong (e.g. `matching.minimumAnswers` is incorrect): variant template post-seed assertion fails at `client.getAppSettings()` → `toMatchObject` mismatch → variant setup throws. If results page still shows match scores: `getByText(/%/)` count > 0 → spec fails. |
| E2E-03 | If `description` $state is reset on cancel (regression): post-dismiss `toHaveValue('persistence test text')` → fail. If `reset()` is not called on send: post-send `toHaveValue('')` → fail. Both directions covered. |
| E2E-04 | If cross-election bleed surfaces: Election-2 dropdown options include Election-1's external_ids → `not.toContain` → fail. If selectors are bypassed when they should be shown (or vice versa): URL pattern + selector-list visibility assertions fail. |
| E2E-05 | If voter answer is not rendered alongside entity's: `getByRole('radio', { checked: true })` count ≠ 1 → fail. If entity's `.entitySelected` class is missing or applied to wrong choice: `toHaveCount(1)` → fail. |
| E2E-06 | If `voterCtx.resultsAvailable` does not toggle correctly: `toHaveText(/browse/i)` after delete → fail OR `toHaveText(/results/i)` after re-answer → fail. Browser-back state corruption: answer count assertion after `goBack()` → fail. |
| E2E-07 | If SubMatch grid does not render for a candidate with answers: `getByText(<categoryName>)` → fail. If a category is missing from the breakdown: per-category iteration → fail at the missing one. |
| E2E-08 | If locale switching does not change URL prefix: `toHaveURL('/fi')` → fail. If translated copy doesn't render: `getByRole('button', { name: /Aloita/i })` returns 0 → fail. |

### Wave 0 Gaps

- [ ] `tests/tests/specs/candidate/candidate-translation.spec.ts` — covers E2E-01 (Plan 01)
- [ ] `tests/tests/specs/voter/voter-browse-without-match.spec.ts` — covers E2E-02 (Plan 02)
- [ ] `tests/tests/setup/templates/variant-low-minimum-answers.ts` — variant template for E2E-02 (Plan 02)
- [ ] `tests/tests/setup/variant-low-minimum-answers.setup.ts` — setup driver for E2E-02 (Plan 02)
- [ ] `tests/playwright.config.ts` — add `data-setup-low-minimum-answers` + `variant-low-minimum-answers` projects (Plan 02); add `data-setup-1e-Nc` + `variant-1e-Nc` + `data-setup-Ne-Nc` + `variant-Ne-Nc` (Plan 04)
- [ ] `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` — covers E2E-03 (Plan 03)
- [ ] `tests/tests/specs/voter/voter-navigation.spec.ts` — covers E2E-06 (Plan 03)
- [ ] `tests/tests/setup/templates/variant-1e-Nc.ts` + `variant-Ne-Nc.ts` — variant templates for E2E-04 (Plan 04)
- [ ] `tests/tests/setup/variant-1e-Nc.setup.ts` + `variant-Ne-Nc.setup.ts` — setup drivers (Plan 04)
- [ ] `tests/tests/specs/variants/1e-Nc.spec.ts` + `Ne-Nc.spec.ts` — E2E-04 new-cell specs (Plan 04)
- [ ] Additive assertions in `tests/tests/specs/variants/multi-election.spec.ts` + `tests/tests/specs/variants/startfromcg.spec.ts` — E2E-04 cells Ne×1c + startFromConstituency (Plan 04)
- [ ] `packages/dev-seed/src/templates/e2e.ts` — voter-answer 4-case extension (Plan 05, D-07)
- [ ] Extension to `tests/tests/specs/voter/voter-detail.spec.ts` OR new `voter-detail-cases.spec.ts` + `voter-detail-submatch.spec.ts` — E2E-05 + E2E-07 (Plan 05)
- [ ] `tests/tests/specs/voter/voter-locale-switching.spec.ts` — E2E-08 (Plan 06)
- [ ] (OPTIONAL) `tests/tests/utils/selectorMatrix.ts` — shared helper for E2E-04 5-cell matrix (Plan 04; planner's call)
- [ ] (Plan 07) Conditional `regen-constants.mjs` invocation + updated `PASS_LOCKED_TESTS` array in `tests/scripts/diff-playwright-reports.ts`
- [ ] (Plan 07) `74-VERIFICATION.md` with 3-run identity hashes + parity-script outputs + DATA_RACE pool rationale (if changed)

**Framework install:** None — Playwright 1.58.2 is in place. No new dependencies.

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives apply to Phase 74 work:

- **Never commit sensitive data** (API keys, tokens, .env files). E2E specs MUST use the test-prefix fixtures, NEVER real candidate data.
- **Test accessibility — WCAG 2.1 AA compliant.** Spec authoring should prefer role/aria locators which also exercise the a11y surface. (Note: Phase 76 A11Y-03 wires axe smoke; Phase 74 doesn't.)
- **Use TypeScript strictly** — avoid `any`, prefer explicit types. New spec files MUST pass `yarn lint:check` (0 errors / 0 warnings on tests/ post-Phase-73).
- **Matching algorithms — questions creating subdimensions (like categorical) need special handling.** Relevant for E2E-07; the directional metric path applies to categorical questions, which the default e2e.ts template does NOT currently include (see Open Question 4).
- **Missing values — use `MISSING_VALUE` from `@openvaa/core` in matching contexts.** Relevant for E2E-05 case (b/c/d) where voter or entity has no answer; the fixture should use the canonical missing marker.
- **Localization — all user-facing strings must support multiple locales.** New testId additions (avoided per D-11) should not create new translation strings; new translation keys (if any) MUST be added to all 4 supported locales.
- **Check code against `/.agents/code-review-checklist.md`.** Plan 07 verification should reference this.
- **Context Destructuring Rule (Svelte 5):** New specs MUST NOT destructure reactive accessors from context. The voter-detail extension (Plan 05) MUST follow `ctx.X` reads for `selectedElections`, `selectedConstituencies`, `opinionQuestions`, etc. (Already canonical in the existing `voter-detail.spec.ts`; new specs inherit the pattern.)
- **Commits in this repo must use `git -c core.hooksPath=/dev/null`** per `project_gsd_repo_hook_workaround.md` (operator memory).

## Sources

### Primary (HIGH confidence)

- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` — D-01..D-13 binding decisions; the entire decision blueprint Phase 74 implements.
- `.planning/REQUIREMENTS.md` lines 40-54 — E2E-01..E2E-08 locked success criteria.
- `.planning/ROADMAP.md` lines 174-188 — Phase 74 goal + 9 SC + plan estimate.
- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — inherited determinism contract.
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — 4 PASS_LOCKED / 15 DATA_RACE / 55 CASCADE baseline + SHA-identity record + CR-02 advisory.
- `tests/scripts/diff-playwright-reports.ts` — parity-script tooling at HEAD; PASS_LOCKED_TESTS / DATA_RACE_TESTS / CASCADE_TESTS constants verbatim.
- `tests/playwright.config.ts` — Playwright project graph (existing variant chain at lines 217-273).
- `tests/tests/setup/templates/variant-multi-election.ts` — canonical variant template shape (overlay + `mergeSettings` + per-row `constituency_groups`/`constituencies` declarations).
- `tests/tests/setup/variant-multi-election.setup.ts` — canonical setup file shape (`runTeardown` → `runPipeline` → `fanOutLocales` → `Writer.write` → post-seed assertion).
- `tests/tests/setup/templates/variant-startfromcg.ts` — second variant reference (startFromConstituency cell mapping).
- `tests/tests/setup/templates/variant-constituency.ts` — third variant reference.
- `tests/tests/specs/voter/voter-detail.spec.ts` — exemplar for E2E-05/E2E-07 extension (entitySelected class + getByRole('radio', { checked: true }) + 'You' label).
- `tests/tests/specs/voter/voter-popups.spec.ts` — E2E-03 colocation candidate; VOTE-15 feedback popup precedent.
- `tests/tests/fixtures/voter.fixture.ts` — answeredVoterPage shape; 16-question loop; 10s/30s budgets.
- `packages/dev-seed/src/templates/e2e.ts` — base e2e template; D-07 extension target.
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` — confirms `description = $state('')` reset-on-send-only; lines 85, 132-137.
- `apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte` — confirms `feedbackRef?.reset()` triggered ONLY from `onSent` (line 50), NOT from cancel; modal keeps Feedback component mounted via `bind:this` (line 62).
- `apps/frontend/src/lib/components/input/Input.svelte` — translation surface implementation; lines 131-137 (state), 379-438 (rendering), 641-647 (toggle button). `multilingual && locales.length > 1` is the gating condition.
- `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` — locale switcher widget; only renders when `locales.length > 1`; uses Paraglide `localizeHref`.
- `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` — confirms `voter-nav-results` testId + `resultsAvailable` toggle text (lines 84-88).
- `apps/frontend/src/lib/i18n/init.ts` — i18n init reads `staticSettings.supportedLocales`; E2E-08 indirectly exercises.
- `apps/frontend/src/lib/components/subMatches/SubMatches.svelte` — SubMatch rendering shape (1 `ScoreGauge` per `match.questionGroup`); lines 28-32.
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — `submatches` rendering gate (lines 50, 118, 299-301).
- `packages/app-shared/src/settings/dynamicSettings.ts` line 42 — `minimumAnswers: 5` default.
- `packages/app-shared/src/settings/dynamicSettings.type.ts` lines 127-136 — `matching.minimumAnswers` knob path verified.
- `packages/app-shared/src/settings/staticSettings.ts` lines 46-64 — `supportedLocales` 4-entry list verified.
- `apps/frontend/src/lib/utils/route/route.ts` — `ROUTE` map; confirms routes do NOT use `[[lang=locale]]` dir prefix.
- `tests/tests/utils/buildRoute.ts` — buildRoute utility.
- `tests/tests/utils/testIds.ts` — testId registry; `shared.questionDelete = 'question-delete'`; `voter.results.ingress = 'voter-results-ingress'`.
- `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` — constants regenerator; IMGPROXY_TIED_TITLES list at lines 55-70.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md` lines 11-32 — IMGPROXY_TIED_TITLES bound list source.
- `CLAUDE.md` — project conventions (Context Destructuring Rule for Svelte 5; commit hook workaround).
- `.planning/PROJECT.md` "Last Shipped: v2.8" + "Current Milestone: v2.9" — milestone framing.
- `.planning/STATE.md` lines 119, 123, 132 — Phase 73 close + Phase 78 CLEAN-05 routing.

### Secondary (MEDIUM confidence)

- `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md` — operator framing of 8 E2E gaps + "Strategy" hints + NOT REAL gaps table.
- `.planning/phases/73-determinism-baseline/73-REVIEW.md` — CR-02 voter-popups race-tolerance regression (advisory, Phase 78 CLEAN-05 territory).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` — D-11 `expect.poll(...).toBeGreaterThan(0)` pattern source.
- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` "Bundled Manual Smoke" — vite-cache wipe recipe origin.

### Tertiary (LOW confidence — needs validation at PLAN.md time)

- Exact translation key for `results.ingress.browse` / `results.title.browse` — Open Question 1.
- Constituency dropdown locator shape (native `<select>` vs. custom) — Open Question 2.
- E2E-06 CTA "disabled" vs "browse-text" semantics — Open Question 3.
- E2E-07 directional metric path coverage — Open Question 4.
- Whether E2E-01 spec lands in CASCADE under canonical cold-start state — Open Question 5.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Playwright 1.58.2 + `@openvaa/dev-seed` + `@openvaa/app-shared` all verified in repo at HEAD; v2.9 milestone explicitly locks "no framework migration".
- Architecture: HIGH for variant template + setup + project pattern (3 existing references); MEDIUM for cross-bleed assertion shape (Open Question 2).
- Pitfalls: HIGH — all 8 documented pitfalls verified from existing code or Phase 73 review findings.
- Validation Architecture: HIGH for test framework + commands; MEDIUM for the requirement-test map (specific spec files don't exist yet; Plans 01-07 create them).
- E2E-01 translation surface: LOW — discovered the implementation is a `<Button>` toggle (not a tab); CONTEXT description "tab/dialog" doesn't match. Locator shape pivoted to `getByRole('button', { name: /Translations/i })`. Verified via direct code inspection but no existing E2E exemplar.
- E2E-07 directional metric: LOW — Open Question 4 needs resolution at PLAN.md time.

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (30 days; stable phase research; valid as long as Phase 73's baseline holds at HEAD).

---

*Phase: 74-High-Leverage E2E Coverage*
*Research compiled: 2026-05-11*
