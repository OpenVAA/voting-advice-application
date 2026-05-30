# Phase 91: TIR6 perm + edit test additions + visual/perf/a11y/bank-auth refactor — Research

**Researched:** 2026-05-30
**Domain:** E2E test infrastructure (Playwright + per-perm @openvaa/dev-seed templates + function-fixtures)
**Confidence:** HIGH

## Summary

Phase 91 closes the v2.10 TIR backlog by:

1. Adding 9 new TIR6 settings-permutation chains (template + spec + setup + teardown × 9 → 27 new playwright project entries) under the per-perm `externalIdPrefix` discipline established in 88-03 / 89-04 / 90.
2. Appending 3 new edit-step blocks (invalidUrl, feedbackDialog, all-nominations) into the existing `voter-mega-journey.spec.ts` and `candidate-mega-journey.spec.ts` per 89-D-89-01 absorption precedent + authoring a new shared `feedbackDialog.fixture.ts` under a NEW `tests/tests/fixtures/shared/` directory.
3. Refactoring 4 existing spec families (visual, perf, a11y, bank-auth) to migrate off the legacy `voter.fixture.ts` `voterTest.answeredVoterPage` onto `voter-mega.fixture.ts` `answeredVoterPage` (visual + perf + a11y) and to tighten any soft assertions / legacy-fixture leaks (bank-auth, with intact env-gating).
4. Deleting `voter-feedback-persistence.spec.ts` (absorbed by the voter-mega feedbackDialog step) and marking the legacy `voter.fixture.ts` `@deprecated` (deletion deferred to v2.11+).

The full backlog is ~16 deliverables organised into four groups (A / B / C / D). Every group is testing-only — no production code changes other than new `data-testid` attributes on currently un-testid'd render surfaces touched by the new perms (~7-9 new testids).

**Primary recommendation:** Partition into 4 plans (91-01 helper + ports → 91-02 nine perm chains → 91-03 mega-journey edits + shared fixture + voter-feedback-persistence deletion → 91-04 visual/perf/a11y/bank-auth refactor + voter.fixture.ts deprecation banner). 91-01 must land before 91-02; 91-03 is independent of 91-01/02; 91-04 depends only on the testid additions in 91-02/03 landing first if any are required for the routes it scans.

<user_constraints>

## User Constraints (from 91-CONTEXT.md)

### Locked Decisions

**Group B — Mega-journey vs new-spec:**

- **D-91-MJ-01:** Append edit-journey extensions INTO existing mega-journey specs (TIR4-style absorption per 89-D-89-01). Item 10 (invalidUrl) → `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` profile section. Item 11 (feedbackDialog) → `tests/tests/specs/voter/voter-mega-journey.spec.ts`. Item 12 (all-nominations) → `tests/tests/specs/voter/voter-mega-journey.spec.ts`. No new spec files for these three steps.
- **D-91-MJ-02:** `feedbackDialog` as NEW SHARED function-fixture at `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` (new directory). Strict testid-only locators. Surface: `expectVisible/Hidden`, `expectSendDisabled/Enabled`, `setRating(n)`, `setComment(text)`, `submit/cancel`, `expectSuccess`, `expectRatingValue/CommentValue`. Voter-mega consumes immediately; candidate flows reuse later.
- **D-91-MJ-03:** Two-stage spec deletion. Phase 91 deletes ONLY `tests/tests/specs/voter/voter-feedback-persistence.spec.ts`. Other voter-* / candidate-* legacy specs STAY untouched (deferred to v2.11+ legacy-retirement phase).

**Group C — Refactor scope:**

- **D-91-RS-01:** Visual regression — rebaseline + fixture-tighten. Run `--update-snapshots` after Group A/B lands to capture post-89 baselines. Swap candidate-preview from raw `STORAGE_STATE + page.goto` to `candidatePreviewPage` function-fixture wrap (89-02).
- **D-91-RS-02:** Perf budget — minimal pass. Migrate from legacy `voterTest.answeredVoterPage` to new `voter-mega.fixture.ts` `answeredVoterPage`. No threshold tightening.
- **D-91-RS-02b:** A11Y route classification. Pre-location (raw `page.goto`, unauthenticated): home, elections-selector, constituencies-selector. Located (use new fixture): questions, results, voter-detail-drawer.
- **D-91-RS-03:** Fixture migration scope — TIR6 refactor targets ONLY + audit new tests for legacy-fixture leaks. Migrate visual + perf + a11y to new `voter-mega.fixture.ts`. Audit new mega-journeys + perm specs for legacy imports; refactor any found. NOT migrated: 12 other voter-* / candidate-settings specs.
- **D-91-RS-04:** `tests/tests/fixtures/voter.fixture.ts` — deprecated, not deleted. Add `@deprecated` JSDoc banner; deletion deferred to v2.11+.
- **D-91-RS-05:** Bank-auth — minimal pass. Audit for legacy-fixture imports + soft assertions. Leave JWE-token synthesis + `PLAYWRIGHT_BANK_AUTH=1` env-gating intact. No perm dataset.

**Group A — Per-perm dataset boundaries:**

- **D-91-PD-01:** New `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` helper (new directory) — authors fresh-minimal Template objects. Each perm template passes its own `externalIdPrefix` to preserve per-perm runtime decoupling (88-D-88-03 / 90-D-90-01 invariant).
- **D-91-PD-02:** Helper authors a FRESH-MINIMAL seed: 1 election / 1 CG / 1 CO / 1 org / N cands / M opinion questions / optional K info questions. No hero, no info, no filtered-info, no required `test-qu-info-text`. NOT derived from baseV1.
- **D-91-PD-03:** Port existing perms with compatible 1e/1cg/1co topology to the helper: `perm-1e1cg1co`, `perm-disable-voter-app`, `perm-disable-candidate-app`, `perm-per-app-notifications`, `perm-missing-nominations`, `perm-localisation-positive`. NOT ported (stay bespoke): `perm-2e-asymmetric`, `perm-2e-shared`, `perm-disjoint-1co`, `perm-disable-election-1co`, `perm-disable-election-2co`, `perm-not-located-2e2cg`, `perm-startfromcg`. Each port preserves existing assertions byte-for-byte.
- **D-91-PD-04:** TIR6 typos resolved. (i) TIR6:122 `!has info` is a typo — candidate authors info on BOTH Q1 & Q2; allowOpen=false on Q2 SUPPRESSES rendering. (ii) TIR6:111-115 + 117-119 `showCategoryTags=false` duplicate — single perm.
- **D-91-PD-05:** Per-perm template + per-perm spec + per-perm setup/teardown + per-perm playwright chain (27 new project entries: 9 setup + 9 spec + 9 teardown). Parallel-safe via per-template `externalIdPrefix`. Mirrors 89-04 + 90-D-90-08 lineage.

### Claude's Discretion

- Exact filenames for perm templates, perm specs, setup/teardown wrappers, helper signature/parameters, playwright project-chain names (follow 89-04 / 90 / 88-04 conventions).
- Exact testid additions to candidate-app + voter-app Svelte components where TIR6 expectations require selectors that don't yet exist. Researcher inventories — see §"New TestId Inventory" below.
- Whether to use `expect.toBeVisible()` vs `expect.toBeDisabled()` vs `expect.toBeHidden()` per perm's negative assertion (strict-fixture, no soft).
- Internal implementation of `feedbackDialog` fixture — function-fixture composition with `voter-mega.fixture.ts` chain or standalone (recommend standalone in `fixtures/shared/`).
- Helper API surface for `buildMinimal()` — object-args vs builder-chain. Recommend object-args per existing perm template authoring ergonomics.
- Whether to fold `feedbackDialog` cancel/reopen state-persistence assertions into one test.step or multiple within voter-mega — follow voter-mega's existing discipline.

### Deferred Ideas (OUT OF SCOPE)

- Broader supersession sweep for other voter-* / candidate-* specs.
- Full migration of remaining 12 legacy `voter.fixture.ts` consumers.
- `voter.fixture.ts` deletion (v2.11+).
- Bank-auth dataset authoring.
- Candidate-side feedback fixture consumption (shared location enables, Phase 91 does not consume).
- Helper extension for non-minimal topologies (bespoke perms stay bespoke).
- TIR draft hygiene flags (informational).
- 89/90 carry-over deferred items (orthogonal).

</user_constraints>

## Project Constraints (from CLAUDE.md)

- **Yarn 4 monorepo** — workspace dependencies declared via `workspace:^`.
- **Turborepo build orchestration** — packages must be built before consumed; `yarn build` is cached and incremental.
- **TypeScript strict** — avoid `any`, prefer explicit types. Helper signature for `buildMinimal` must be fully typed against the existing `Template` type (`packages/dev-seed/src/template/types.ts:86`, `z.infer<typeof TemplateSchema>`).
- **Svelte 5 Context Destructuring Rule** — reactive accessors (`unansweredOpinionQuestions`, `unansweredRequiredInfoQuestions`, `answersLocked`) MUST be read via `ctx.X` (NOT destructured). For Phase 91 this means: when adding new `data-testid` attributes to surfaces gated on `candCtx.answersLocked` or `$appSettings.X`, the rendering code reads those values via the canonical pattern already in place — Phase 91 does NOT introduce new context reads; it only annotates existing elements.
- **WCAG 2.1 AA compliance** — preserve the global 0-violation gate when refactoring `a11y-smoke.spec.ts`. Adding new `data-testid` attributes is a11y-neutral, but the refactor MUST NOT regress per-rule-id assertions (aria-required-parent / list / button-name).
- **Sensitive data discipline** — never commit `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` (bank-auth spec reads these from env per Phase 78 CLEAN-05 IN-01).
- **`db:reset-with-data` flag-forwarding caveat** — when running mega-journey + perm chains locally, the canonical Likert-only invocation is the manual chain `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`. The new mega-journey + perm chains use `setupFromTemplate`, NOT `db:seed`, so they sidestep this — but contributors verifying locally need the workaround.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-perm dataset authoring | `@openvaa/dev-seed` package (templates) | — | Single source of truth for seed shape per 88-03 |
| Per-perm settings overlay | `@openvaa/dev-seed` template's `app_settings.fixed[]` | — | DynamicSettings flow through `app_settings` row at seed time |
| Per-perm playwright project chain | `tests/playwright.config.ts` | `tests/tests/setup/*.setup.ts` + `*.teardown.ts` | Project graph + setup-test-teardown sequencing |
| Per-perm spec assertions | `tests/tests/specs/perm/*.spec.ts` | `tests/tests/utils/testIds.ts` (selectors) | Strict-fixture pattern + testid-driven locators |
| Mega-journey edit-step append | `tests/tests/specs/{voter,candidate}/*-mega-journey.spec.ts` | `tests/tests/fixtures/{voter-mega.fixture.ts,candidate/candidate-mega.ts}` | Append `test.step()` blocks into the canonical single-test journey |
| Shared `feedbackDialog` fixture | `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` (NEW dir) | Function-fixture composition root | Cross-app reuse without coupling to voter-mega or candidate-mega chains |
| TestId additions | `apps/frontend/src/lib/...` Svelte components + `tests/tests/utils/testIds.ts` | — | New testids land at the render site + the central inventory |
| Visual baseline regeneration | `tests/tests/__screenshots__/` (CI-driven `--update-snapshots`) | Playwright config `PLAYWRIGHT_VISUAL=1` opt-in | Per D-91-RS-01: CI capture only; never developer-machine font-rendering |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | (workspace pinned) | E2E framework | Established baseline |
| `@openvaa/dev-seed` | `workspace:^` | Per-perm dataset authoring | 88-03 / 89-04 / 90 lineage |
| `@axe-core/playwright` | (workspace pinned) | A11Y axe-core scan | Phase 80 cite-and-fix gate |
| `jose` | (workspace pinned) | JWE token synthesis for bank-auth | Phase 78 CLEAN-05 IN-01 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | (workspace pinned) | Bank-auth Edge Function direct calls | Bank-auth spec body |
| Built-in `tests/tests/utils/buildRoute.ts` | n/a | Locale-aware URL construction | All voter-route navigations in perm specs |
| Built-in `tests/tests/utils/testIds.ts` | n/a | Central testid inventory | All strict-fixture locators |
| Built-in `tests/tests/setup/setupFromTemplate.ts` | n/a | Generic per-perm seed runner | All perm setup files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `buildMinimal()` helper | Hand-copy each perm template from `perm-1e1cg1co` | Helper reduces 9 × ~100 lines of boilerplate; explicit copy preserves per-perm divergence at the cost of duplication. CONTEXT D-91-PD-01 locks helper approach. |
| Shared `feedbackDialog` fixture in `fixtures/shared/` | Inline in voter-mega.fixture.ts | CONTEXT D-91-MJ-02 locks shared location to enable candidate-side reuse later. |
| `feedback-success` testid on submit button text | Assert on submit-button text (`t('feedback.thanks')`) | Locale-fragile. Strict testid is canonical per CLAUDE.md / Phase 90-D-90-06. Recommend adding `data-testid="feedback-success"` on the submit button OR on a new sr-only sibling marker (researcher prefers ON the submit button via dynamic testid: `feedback-submit-status-{status}`, see §"New TestId Inventory"). |

**Installation:** No new packages. All required dependencies already installed.

**Version verification:** N/A — all stack pieces already locked at the repo level.

## Package Legitimacy Audit

> No external packages introduced. Phase 91 consumes `@playwright/test`, `@openvaa/dev-seed`, `@axe-core/playwright`, `jose`, `@supabase/supabase-js` — all already installed and pinned. Skipping slopcheck per protocol.

## Architecture Patterns

### Render Diagram (per-perm chain)

```
playwright.config.ts project entry           tests/tests/setup/data-setup-perm-X.setup.ts
  ↳ dependencies: [<previous-perm-spec>]  →    ↳ setupFromTemplate('perm-X', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })
                                                  ↳ runs runTeardown(prefix, client)
                                                  ↳ writes Template via writer.ts (prepends externalIdPrefix to bare external_ids)
                                                  ↳ asserts app_settings row JSONB matches template (post-seed parity check)

playwright.config.ts spec project entry      tests/tests/specs/perm/perm-X.spec.ts
  ↳ dependencies: ['data-setup-perm-X']   →    ↳ imports { expect, test } from '@playwright/test'
                                                  ↳ test.describe('perm-X', () => { test('<scenario>', async ({ page }) => { ... }) })

playwright.config.ts teardown entry           tests/tests/setup/data-teardown-perm-X.teardown.ts
  ↳ triggered by setup's `teardown:` key  →    ↳ runTeardown('e2e-perm-X-', client)
```

### Render Diagram (Group A — Group B — Group C overall sequence in default mode)

```
                          (FIRST)                                                             (LAST)
perm-1e1cg1co ─→ perm-2e-shared ─→ ... ─→ perm-not-located-2e2cg ─→ baseV1 setup ─→ voter-mega-journey ─→ candidate-mega setup ─→ candidate-mega-journey
                                                                                          │                                                       │
                                                                                          └──→ visual / perf / a11y refactor consumes ─→ this chain's `answeredVoterPage`
                                                                                                                                                  │
                                                                            ┌─────────────────────────────────────────────────────────────────────┘
                                                                            ↓
                                              perm-disable-voter-app ─→ perm-disable-candidate-app ─→ perm-per-app-notifications ─→ perm-missing-nominations ─→ perm-localisation-positive
                                                                                                                                                                                 │
                                                              ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                              ↓
                                  perm-answers-locked (NEW) ─→ perm-hide-hero ─→ perm-header-show-feedback ─→ perm-header-show-help ─→ perm-hide-all-nominations ─→ perm-hide-if-missing-answers ─→ perm-hide-election-tags ─→ perm-hide-category-tags ─→ perm-disable-allow-open
                                                                                                                                                                                                                                                                       (END)
```

### Recommended Project Structure
```
packages/dev-seed/src/templates/
├── _helpers/                         # NEW directory (D-91-PD-01)
│   └── buildMinimal.ts               # NEW — helper authoring fresh-minimal Template objects
├── permutations/
│   ├── perm-1e1cg1co.ts              # PORT to helper
│   ├── perm-disable-voter-app.ts     # PORT to helper
│   ├── perm-disable-candidate-app.ts # PORT to helper
│   ├── perm-per-app-notifications.ts # PORT to helper
│   ├── perm-missing-nominations.ts   # PORT to helper (2 elections variant of helper)
│   ├── perm-localisation-positive.ts # PORT to helper (single-org + 4 question variant)
│   ├── perm-answers-locked.ts        # NEW (TIR6:3-14)
│   ├── perm-hide-hero.ts             # NEW (TIR6:24-32)
│   ├── perm-header-show-feedback.ts  # NEW (TIR6:68-77)
│   ├── perm-header-show-help.ts      # NEW (TIR6:79-88)
│   ├── perm-hide-all-nominations.ts  # NEW (TIR6:90-93)
│   ├── perm-hide-if-missing-answers.ts  # NEW (TIR6:95-102)
│   ├── perm-hide-election-tags.ts    # NEW (TIR6:104-108)
│   ├── perm-hide-category-tags.ts    # NEW (TIR6:111-115)
│   ├── perm-disable-allow-open.ts    # NEW (TIR6:121-142)
│   └── shared.ts                     # UNCHANGED (helper consumes its building blocks)
└── index.ts                          # ADD 9 BUILT_IN_TEMPLATES entries + 9 re-exports

tests/tests/fixtures/
├── shared/                           # NEW directory (D-91-MJ-02)
│   └── feedbackDialog.fixture.ts     # NEW — shared function-fixture
├── voter-mega.fixture.ts             # MAY EXTEND if a11y refactor needs `locatedVoterPage` variant
├── voter.fixture.ts                  # ADD @deprecated banner only
└── (other fixtures unchanged)

tests/tests/setup/
├── perm-answers-locked.setup.ts      # NEW × 9
├── perm-answers-locked.teardown.ts   # NEW × 9
└── ... (8 more setup/teardown pairs)

tests/tests/specs/perm/
├── perm-answers-locked.spec.ts       # NEW × 9
└── ... (8 more)

tests/tests/specs/voter/
├── voter-mega-journey.spec.ts        # EXTEND with feedbackDialog + all-nominations steps
├── voter-feedback-persistence.spec.ts  # DELETE (D-91-MJ-03)
└── ... (other specs unchanged)

tests/tests/specs/candidate/
├── candidate-mega-journey.spec.ts    # EXTEND with invalidUrl step into profile section
├── candidate-bank-auth.spec.ts       # AUDIT + minor refactor
└── ... (other specs unchanged)

tests/tests/specs/visual/visual-regression.spec.ts   # MIGRATE fixture imports + rebaseline (CI)
tests/tests/specs/perf/performance-budget.spec.ts    # MIGRATE fixture import
tests/tests/specs/a11y/a11y-smoke.spec.ts            # MIGRATE located-route fixtures
tests/tests/__screenshots__/*.png                    # REBASELINED via CI --update-snapshots after Group A/B
```

### Pattern 1: `buildMinimal` helper (D-91-PD-01) — proposed signature

```typescript
// packages/dev-seed/src/templates/_helpers/buildMinimal.ts

import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  buildQuestionCategories,
  buildQuestions,
  MINIMAL_BASE_APP_SETTINGS
} from '../permutations/shared';
import type { Template } from '../../template/types';

export interface BuildMinimalOptions {
  /** Required: unique per-perm prefix (e.g. 'e2e-perm-answers-locked-'). */
  externalIdPrefix: string;
  /** Number of candidates. Default: 1. Helper builds them via buildCandidate(P, n%2 === 0 ? 1 : 2, ...). */
  candidates?: number;
  /** Number of opinion questions. Default: 1. */
  opinionQuestions?: number;
  /** Number of info questions. Default: 0. */
  infoQuestions?: number;
  /** Number of elections. Default: 1. Each election shares the same CG/CO unless `elections > 1`. */
  elections?: number;
  /** Number of organisations. Default: 2 (`buildOrganizations()`). Pass 1 to truncate to a single org (perm-localisation-positive pattern). */
  organizations?: 1 | 2;
  /**
   * Per-question custom_data overrides. Keyed by question external_id BARE (e.g. 'qu-opin-l5-1').
   * Example: { 'qu-opin-l5-1': { hero: '🗳️' }, 'qu-opin-l5-2': { allowOpen: false } }
   */
  customDataByQuestion?: Record<string, Record<string, unknown>>;
  /**
   * Per-candidate answer overrides. Keyed by candidate external_id BARE.
   * Allows the hide-if-missing-answers perm to give cand-2 only one answer.
   */
  answersByCandidate?: Record<string, Record<string, { value: unknown; info?: { en: string } }>>;
  /**
   * Settings overlay applied via deep-merge onto MINIMAL_BASE_APP_SETTINGS.
   * Example: { access: { answersLocked: true } } or { header: { showFeedback: true } }.
   */
  settingsOverlay?: Partial<typeof MINIMAL_BASE_APP_SETTINGS>;
  /**
   * Optional: when `elections > 1`, controls which elections receive nominations.
   * Default: all elections receive the standard 2-org + N-cand nomination set.
   * Pass `[0]` to give nominations only to el-1 (perm-missing-nominations pattern).
   */
  nominationsInElectionIndices?: Array<number>;
}

export function buildMinimal(opts: BuildMinimalOptions): Template {
  // returns Template with seed=42, externalIdPrefix=opts.externalIdPrefix,
  // generateTranslationsForAllLocales: false, ...all fragments composed from the
  // existing shared.ts building blocks.
  // ... implementation
  return /* ... */ ;
}
```

**Why this shape:** Object-args mirrors the existing `Template` declaration style (every perm template under `permutations/` is a flat object literal). Builder-chain API would require new fluent infra; object-args reuses what dev-seed authors already read every day.

**When to use:** Every perm template with 1e/1cg/1co topology. The 6 ports listed in D-91-PD-03 + the 9 new TIR6 perms all fit. The 7 bespoke perms (`perm-2e-asymmetric`, etc.) keep their hand-authored layouts.

**Source:** Derived from `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` + `perm-localisation-positive.ts` + `perm-missing-nominations.ts` inventory.

### Pattern 2: Shared `feedbackDialog` function-fixture

```typescript
// tests/tests/fixtures/shared/feedbackDialog.fixture.ts

import type { Page, Locator } from '@playwright/test';

export interface FeedbackDialogFixture {
  /** Resolved locator for the dialog (testid-bound: feedback-form filter on role=dialog). */
  readonly dialog: Locator;
  /** Assertion: dialog visible. */
  expectVisible(): Promise<void>;
  /** Assertion: dialog hidden (form testid removed from DOM). */
  expectHidden(): Promise<void>;
  /** Assertion: submit button disabled (no rating + no description). */
  expectSendDisabled(): Promise<void>;
  /** Assertion: submit button enabled (rating OR description present). */
  expectSendEnabled(): Promise<void>;
  /** Click rating star N (1..5). */
  setRating(n: 1 | 2 | 3 | 4 | 5): Promise<void>;
  /** Fill the comment textarea. Use empty string to clear. */
  setComment(text: string): Promise<void>;
  /** Click submit. Does NOT wait for dialog close — caller asserts. */
  submit(): Promise<void>;
  /** Click cancel. Does NOT wait for dialog close. */
  cancel(): Promise<void>;
  /** Assertion: submit button text = t('feedback.thanks') (status === 'sent'). Uses dynamic testid feedback-submit-status-sent OR asserts on submit button's aria-label / current text. */
  expectSuccess(): Promise<void>;
  /** Assertion: rating N is checked. */
  expectRatingValue(n: 1 | 2 | 3 | 4 | 5 | null): Promise<void>;
  /** Assertion: comment textarea has the given value. */
  expectCommentValue(text: string): Promise<void>;
}

export function createFeedbackDialog(page: Page): FeedbackDialogFixture { /* ... */ }
```

**Composition:** Use the factory pattern (same as `tests/tests/fixtures/candidate/candidate*.fixture.ts`) — `createFeedbackDialog(page)` returns the API. Standalone (not extended into voter-mega's fixture).

**Consumption shape in `voter-mega-journey.spec.ts`:**

```typescript
import { createFeedbackDialog } from '../../fixtures/shared/feedbackDialog.fixture';

// inside the existing test():
const feedbackDialog = createFeedbackDialog(page);
// ... navigate to nav menu, click feedback ...
await feedbackDialog.expectVisible();
await feedbackDialog.expectSendDisabled();
await feedbackDialog.setRating(3);
await feedbackDialog.expectSendEnabled();
// etc.
```

**Source pattern:** `tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts` (same factory shape).

### Pattern 3: Per-perm spec body

```typescript
// tests/tests/specs/perm/perm-answers-locked.spec.ts

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { buildRoute } from '../../utils/buildRoute';

test.describe('perm-answers-locked', () => {
  test('answersLocked: candidate sees read-only warning + disabled inputs + disabled choice radios', async ({ page }) => {
    // 1. Navigate to candidate login.
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));
    // 2. Assert the answersLocked info text on the login page.
    await expect(page.getByText(/* t('candidateApp.login.answersLockedInfo') seeded marker */)).toBeVisible();
    // 3. Login (test-perm seeded candidate has ToU accepted; login lands on candidate home).
    //    Existing perm pattern: candidate-mega chain provides the login flow.
    //    For this perm: use SupabaseAdminClient to mint a session or follow forgot-password.
    //    NOTE: simpler alternative — assert on the read-only warning visible on /candidate/profile via STORAGE_STATE.
    // ... (TBD by planner: which auth path is most determinate)
    // 4. Navigate to /candidate/profile, assert Warning + disabled question inputs.
    // 5. Navigate to /candidate/questions/[firstQuestionId], assert choice radios disabled.
  });
});
```

**Source pattern:** `tests/tests/specs/perm/perm-disable-voter-app.spec.ts:19-37`.

### Anti-Patterns to Avoid

- **Wiring `feedbackDialog` into `voter-mega.fixture.ts` `extend()` chain** — couples the shared fixture to voter-mega's options. CONTEXT D-91-MJ-02 specifies standalone via `fixtures/shared/`.
- **Asserting on `t('feedback.thanks')` text instead of a testid** — locale-fragile. Add `feedback-success` testid (or use `feedback-submit` with content selector via `data-state`).
- **Running visual `--update-snapshots` on a developer machine** — font rendering differs across OS/browser. Per D-91-RS-01, baseline capture is CI-driven only.
- **Adding `expect.soft` to any new perm spec assertion** — perm specs use the strict-fixture pattern (88-04 acceptance #6 / 89-02 inheritance / 90-D-90-06).
- **Forking `voter-mega.fixture.ts` to add a "located but unanswered" variant** — extend in-place per D-91-RS-03; a single fixture file with multiple option fixtures is preferred.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-perm dataset seed | Custom SQL or hand-loops | `setupFromTemplate('perm-X')` + `buildMinimal` helper | Per-perm `externalIdPrefix` invariant + idempotent teardown already centralised in `setupFromTemplate.ts` |
| Per-perm teardown | Custom DELETE queries | `runTeardown(prefix, client)` from `@openvaa/dev-seed` | Cross-table FK ordering already encoded |
| Feedback dialog opening | Search by role/text | `feedback-form` testid + the new shared fixture | Locale-resilient + already-present testids |
| URL construction in perm specs | Hardcoded paths | `buildRoute({ route, locale })` | Locale-prefix discipline + ROUTE constant single source of truth |
| Located-route prefill in a11y | Replicate SupabaseAdminClient.findData logic | New `voter-mega.fixture.ts` `answeredVoterPage` (or `locatedVoterPage` extension) | Drops UUID resolution + URL search-param construction entirely |
| Visual baselines | Hand-place PNG files | Playwright `toHaveScreenshot({ fullPage: true, animations: 'disabled' })` + `--update-snapshots` | Already wired; only baseline file generation is needed |

**Key insight:** Almost every helper, fixture, and setup hook this phase needs is already in the codebase. Phase 91 is overwhelmingly an *application* of existing infrastructure to new permutations — not new infrastructure.

## Runtime State Inventory

> Phase 91 is purely additive. No rename / refactor / migration. Skipping this section.

## New TestId Inventory

> Required for Group A perms whose render surfaces lack stable testid selectors. Each row identifies the file, current state (present/absent), and the proposed testid addition. **Add to both the component AND `tests/tests/utils/testIds.ts`** in the same plan that authors the perm spec.

### A1 — answersLocked perm (TIR6:3-14)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Read-only warning on login page (`t('candidateApp.login.answersLockedInfo')`) | `apps/frontend/src/routes/candidate/login/+page.svelte:156` | NO testid; text is rendered inside a `<p>` based on `answersLocked` boolean | Add `data-testid="login-answers-locked-info"` on the `<p>` element |
| Warning banner on `/candidate` home | `apps/frontend/src/routes/candidate/(protected)/+page.svelte:86-92` | `<Warning>` wraps `editingNotAllowed` text; NO testid | Add `data-testid="candidate-answers-locked-warning"` on the `<Warning>` element |
| Warning banner on `/candidate/profile` | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:183-189` | Same `<Warning>` pattern; NO testid | Same testid (`candidate-answers-locked-warning`) — single canonical testid reused across surfaces |
| Warning banner on `/candidate/questions/[questionId]` | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:257-261` | Same `<Warning>` pattern via `{#snippet note()}`; NO testid | Same testid |
| Disabled profile inputs | profile/+page.svelte:283-304 via `locked={candCtx.answersLocked}` | `<QuestionInput>` rendered with `locked` prop; the underlying `<Input>` applies `disabled` to the form element | NO new testid — existing `candidate-profile-info-item` wrapper + native `:disabled` selector suffice (`expect(input).toBeDisabled()`) |
| Disabled choice radios on opinion question page | `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:218 (fieldset testid="question-choices"), :265 (radio testid="question-choice")` | Existing testids present; when `mode === 'display'` the radio is `disabled` | NO new testid — existing `question-choice` + `:disabled` selector |

### A2 — hideHero perm (TIR6:24-32)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Hero figure on candidate question page | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:264-270` | Has `data-testid="candidate-questions-hero"` on the `<figure>`. Inner `<Hero>` only renders when `!hideHero && customData?.hero` | NO new testid — assert `figure[data-testid=candidate-questions-hero]` has no children (empty) OR that `getByTestId('candidate-questions-hero').locator('img, span')` has count 0 |

### A3 — header.showFeedback perm (TIR6:68-77)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Header feedback button | `apps/frontend/src/routes/Banner.svelte:65-67` | `<Button onclick={openFeedbackModal.current} variant="icon" icon="feedback" text={t('feedback.send')} />` — NO testid | Add `data-testid="header-feedback"` to the `<Button>` |

### A4 — header.showHelp perm (TIR6:79-88)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Header help button | `apps/frontend/src/routes/Banner.svelte:69-71` | `<Button href={getRoute.current('Help')} variant="icon" icon="help" text={t('help.title')} />` — NO testid | Add `data-testid="header-help"` to the `<Button>` |

**Note:** `getRoute('Help')` resolves to `'/(voters)/about'` per `apps/frontend/src/lib/utils/route/route.ts:17`. The TIR6 assertion `expect url getRoute.current('Help')` becomes `expect(page).toHaveURL(/\/en\/about/)`.

### A5 — entities.showAllNominations=false perm (TIR6:90-93)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| `/nominations` redirect | `apps/frontend/src/routes/(voters)/nominations/+layout.ts:19-27` | `redirect(307, buildRoute({ route: 'Home' }))` on server. NO testid needed | NO new testid — assert via `expect(page).toHaveURL(/\/en\/?$/)` after `page.goto('/en/nominations')` |

### A6 — entities.hideIfMissingAnswers.candidate perm (TIR6:95-102)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Voter results entity cards | `apps/frontend/src/lib/dynamic-components/...` (per existing card pattern) | `entity-card` + `entity-card-title` testids already on every card | NO new testid — assert `expect(resultsPage.getEntityCards().filter({ hasText: /\[CA1A\]/i })).toHaveCount(1)` AND `expect(resultsPage.getEntityCards().filter({ hasText: /\[CA2A\]/i })).toHaveCount(0)` |

### A7 — elections.showElectionTags=false perm (TIR6:104-108)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| ElectionTag on question heading | `apps/frontend/src/lib/components/electionTag/ElectionTag.svelte` | NO testid | Add `data-testid="election-tag"` to the ElectionTag root element |

**Asssertion shape:** `await expect(page.getByTestId('election-tag')).toHaveCount(0)` when on the voter questions page.

### A8 — questions.showCategoryTags=false perm (TIR6:111-115)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| CategoryTag on question heading | `apps/frontend/src/lib/components/categoryTag/CategoryTag.svelte` | NO testid | Add `data-testid="category-tag"` to the CategoryTag root element |

### A9 — customData.allowOpen=false perm (TIR6:121-142)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Candidate-side info input visibility | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:294` | `{#if customData.allowOpen}` gates `<Input data-testid="candidate-questions-comment" />` | NO new testid — assert `expect(page.getByTestId('candidate-questions-comment')).toHaveCount(0)` for Q2 |
| Voter-side info rendering | `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte:78` | `{#if answer?.info && customData?.allowOpen !== false}` gates `<QuestionOpenAnswer>` | Need a testid on `<QuestionOpenAnswer>` to assert presence/absence. Add `data-testid="entity-opinion-open-answer"` to the QuestionOpenAnswer wrapper |

### B1 — invalidUrl edit-step (TIR6:16-22)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Input error message | `apps/frontend/src/lib/components/input/Input.svelte:640-642` | `<ErrorMessage inline message={error} />`; error text from `t('components.input.error.invalidUrl')` — NO dedicated testid | Add `data-testid="input-error"` to the inline ErrorMessage on Input.svelte:641 |

**Assertion shape:** `await expect(page.getByTestId('input-error')).toHaveText(/components.input.error.invalidUrl|invalid url|virheellinen/i)` (locale-resilient regex). Discretion: scope the testid to the parent `<Input>` element rather than to ErrorMessage globally if planner prefers narrower selectors.

### B2 — feedbackDialog edit-step (TIR6:34-61)

| Surface | File:Line | Currently | Proposed Addition |
|---------|-----------|-----------|-------------------|
| Feedback form root | `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:158` | `data-testid="feedback-form"` (present) | None |
| Rating stars 1..5 | Feedback.svelte:184 | `data-testid="feedback-rating-{value}"` (present) | None |
| Description textarea | Feedback.svelte:197 | `data-testid="feedback-description"` (present) | None |
| Submit button | Feedback.svelte:235 | `data-testid="feedback-submit"` (present); text varies by `status`: 'default' → t('feedback.send'); 'sending' → t('feedback.sending'); 'sent' → t('feedback.thanks'); 'error' → t('common.close') | Add `data-testid` attribute that incorporates status: `data-testid="feedback-submit"` + new `data-status={status}` attribute. Spec asserts `await expect(submit).toHaveAttribute('data-status', 'sent')` |
| Cancel button | Feedback.svelte:247 | `data-testid="feedback-cancel"` (present) | None |
| Success state ("expect success message" TIR6:53/60) | Feedback.svelte:236 | Status conveyed only via submit-button text change | Use the `data-status` attribute added above — `expectSuccess()` asserts `data-status === 'sent'` |

**Alternative approach (simpler):** Add a separate `data-testid="feedback-success"` element rendered when `status === 'sent'` (e.g., an sr-only `<span>` inside the form). Researcher prefers `data-status` on the existing submit button (one fewer DOM element, cleaner to add).

### Central inventory updates (`tests/tests/utils/testIds.ts`)

```typescript
// ADDITIONS:
candidate: {
  // ... existing entries ...
  login: {
    // ... existing ...
    answersLockedInfo: 'login-answers-locked-info'   // A1
  },
  common: {
    answersLockedWarning: 'candidate-answers-locked-warning'  // A1 (reused)
  }
},
voter: {
  // ... existing ...
  entityDetail: {
    // ... existing ...
    opinionOpenAnswer: 'entity-opinion-open-answer'   // A9 voter-side
  }
},
shared: {
  // ... existing ...
  electionTag: 'election-tag',                       // A7
  categoryTag: 'category-tag',                       // A8
  inputError: 'input-error',                         // B1
  header: {
    feedback: 'header-feedback',                     // A3
    help: 'header-help'                              // A4
  }
}
```

**Total: ~9 new testid keys + 1 new HTML attribute (`data-status` on feedback-submit).**

## Mega-Journey Absorption Points

> Per CONTEXT D-91-MJ-01, TIR6 edit-steps are appended into existing mega-journey specs. Researcher-recommended insertion points:

### Candidate mega-journey — invalidUrl step (item 10)

**Target:** `tests/tests/specs/candidate/candidate-mega-journey.spec.ts`, between existing `test.step('13. profile: portrait errors + valid upload + fill info except required + first + submit', ...)` (line 473) and `test.step('14. profile: revisit + fill required + submit → questions overview', ...)` (line 508).

**Why here:** Step 13 already inhabits the profile page with portrait-upload error paths (parallel reasoning surface). The invalidUrl step belongs inside the same profile-editing flow before the final submit. Recommended new step:

```typescript
await test.step('13.5. profile: invalid URL into Link-type question surfaces invalidUrl error (TIR6:16-22)', async () => {
  // Pre-condition: we're still on /candidate/profile from step 13.
  // Locate the Link-type question's <Input> field.
  // ... fill with invalid URL ('not-a-url') ...
  // ... blur or trigger validation ...
  await expect(page.getByTestId(testIds.shared.inputError)).toContainText(/invalidUrl|invalid url|virheellinen/i);
  // Clear field so step 14 isn't blocked by validation.
});
```

**Caveat:** baseV1 may not yet have a Link-type info question. Researcher confirmed `Input.svelte:296` handles `type === 'url'`, but the planner must verify baseV1's info question type assignments include at least one URL-type field. If absent, plan must extend baseV1 with a URL-type info question (low-cost, single-line addition to `packages/dev-seed/src/templates/baseV1.ts`).

### Voter mega-journey — feedbackDialog step (item 11)

**Target:** `tests/tests/specs/voter/voter-mega-journey.spec.ts`, immediately after the existing 'filters: dialog' step (line 973-1041, the last test.step in the journey). The feedback dialog is exercised via the voter nav menu, which is available on the /results page where the journey ends.

**Recommended new step shape:**

```typescript
await test.step('feedback dialog: open + persistence + send (TIR6:34-61, NEW Phase 91)', async () => {
  const feedbackDialog = createFeedbackDialog(page);
  // Open the nav menu, click feedback.
  // ... open hamburger / drawer per existing VoterNav pattern ...
  // ... click <NavItem onclick={openFeedbackModal} ... /> ...
  await feedbackDialog.expectVisible();
  await feedbackDialog.expectSendDisabled();
  await feedbackDialog.setRating(3);
  await feedbackDialog.expectSendEnabled();
  await feedbackDialog.setComment('test feedback');
  await feedbackDialog.cancel();
  // Reopen — expect rating + comment preserved (state survives close).
  // ... reopen via nav menu ...
  await feedbackDialog.expectRatingValue(3);
  await feedbackDialog.expectCommentValue('test feedback');
  await feedbackDialog.submit();
  await feedbackDialog.expectSuccess();
  // Reopen — expect cleared (reset() ran post-send via onSent timeout).
  // ... reopen via nav menu ...
  await feedbackDialog.expectRatingValue(null);
  await feedbackDialog.expectCommentValue('');
  await feedbackDialog.setComment('text-only feedback');
  await feedbackDialog.expectSendEnabled();
  await feedbackDialog.submit();
  await feedbackDialog.expectSuccess();
});
```

### Voter mega-journey — all-nominations step (item 12)

**Target:** Immediately AFTER the feedbackDialog step. Brief; just navigates `/nominations` and asserts the list.

**Recommended shape:**

```typescript
await test.step('nominations: /nominations renders candidate-nominations list (TIR6:63-66, NEW Phase 91)', async () => {
  await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));
  const list = page.getByTestId(testIds.voter.nominations.list);
  await expect(list).toBeVisible({ timeout: TIMEOUT.slowPage });
  // baseV1 candidate count for the selected election + constituency
  // (CO-Reg-N has 7 candidates from EL-Reg). Researcher leaves the exact
  // count to the planner — depends on whether /nominations renders all
  // candidates across all elections or scoped to the located constituency.
  // Conservative assertion: at least 1 entity-card visible.
  await expect(list.getByTestId(testIds.voter.results.card).first()).toBeVisible();
});
```

## Visual Baseline Strategy (D-91-RS-01)

**Where baselines live:** `tests/tests/__screenshots__/` (per `tests/tests/specs/visual/visual-regression.spec.ts:11-12`).

**Per-project diff threshold:** Playwright defaults to a small pixel-diff tolerance via `toHaveScreenshot({...})` defaults. The existing spec passes `fullPage: true, animations: 'disabled'` — no custom threshold.

**Capture strategy:** Per CONTEXT D-91-RS-01, baselines are CI-captured via `--update-snapshots`. Developer machines vary in font rendering (macOS subpixel vs Linux), so local capture would create non-portable baselines. The plan should:

1. Author the refactored spec (migrate to `voter-mega.fixture.ts` `answeredVoterPage` + candidate-preview function-fixture wrap).
2. Land the refactored code.
3. Trigger CI baseline regeneration (operator-driven `--update-snapshots` run).
4. Commit the regenerated PNGs in a follow-up commit.

**Candidate-preview fixture wrap:** The candidate-preview tests currently do `test.use({ storageState: STORAGE_STATE })` + `await page.goto(buildRoute({ route: 'CandAppPreview' }))`. Migrate to the `candidatePreviewPage` function-fixture from `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts` (89-02). The candidate-mega spec project's `data-setup-candidate-mega` already seeds the unregistered + registered candidates needed; the visual project would need its own storageState OR the planner adds a `data-setup-baseV1`-only candidate-preview path (researcher recommends the latter — visual project should not depend on candidate-mega's storage state).

## A11Y Route Refactor + `locatedVoterPage` Fixture Extension

**Pre-location routes** (raw `page.goto` retained per D-91-RS-02b):
- home (`buildRoute({ route: 'Home', locale: 'en' })`)
- elections-selector (`buildRoute({ route: 'Elections', locale: 'en' })`)
- constituencies-selector (`buildRoute({ route: 'Constituencies', locale: 'en' })`)

**Located routes** (migrate per D-91-RS-02b):
- questions (`buildRoute({ route: 'Questions' })` — needs election + constituency selected)
- results (`buildRoute({ route: 'Results' })`)
- voter-detail-drawer (Results + entity-card click)

**Current state:** `a11y-smoke.spec.ts:128-152` resolves UUIDs via `SupabaseAdminClient.findData` for `'test-election-1'` + `'test-constituency-alpha'` and constructs `?electionId=…&constituencyId=…` URL prefill. This is brittle (the e2e seed uses these external_ids; baseV1 uses different ones — `test-baseV1-el-1` / `test-baseV1-co-reg-n` etc).

**`voter-mega.fixture.ts` current capability:** Exposes `answeredVoterPage` which walks the full intro → election → constituency → questions → answer-all → results journey. This is OVER-walked for the questions a11y scan (it lands on /results, not /questions).

**Recommended extension:** Add a `locatedVoterPage` option to `voter-mega.fixture.ts` that walks Home → Intro → Elections → Constituencies → questions intro → STOPS on /questions (does NOT answer). Spec body for the questions route then consumes `locatedVoterPage` and runs axe there. For the voter-detail-drawer route, the existing `answeredVoterPage` is correct (need to be on results + click an entity card).

**Proposed signature:**

```typescript
// In voter-mega.fixture.ts — additional option fixture
type VoterMegaFixtureOptions = {
  answerMode: AnswerMode;
  answerCount?: number;
  /** NEW: stop before answering. Lands on /questions intro. Phase 91 D-91-RS-02b. */
  stopBeforeAnswering?: boolean;
};

type VoterMegaFixtures = VoterMegaFixtureOptions & {
  answeredVoterPage: Page;
  /** NEW: page navigated to /questions (intro), no answers given. */
  locatedVoterPage: Page;
};
```

Alternative (preferred for simplicity): two separate fixtures (`answeredVoterPage` + `locatedVoterPage`) without an option, each invoking the walk function with different terminal URL patterns.

**Line-count savings:** Migration drops ~30 lines from `a11y-smoke.spec.ts` (the `beforeAll` UUID resolution + `buildLocatedUrl` helper).

## Bank-Auth Minimal-Pass Scope (D-91-RS-05)

**Audit results:**

1. **Legacy-fixture import (`candidate-bank-auth.spec.ts:25`):** `import { expect, test } from '../../fixtures'`. The barrel `tests/tests/fixtures/index.ts` extends `@playwright/test` with PageObject classes only (lines 49-74); it does NOT transitively pull from `voter.fixture.ts`. The spec body uses only raw `expect` + `test` + `page`. **Safe to swap to `@playwright/test` direct** — no behaviour change, but tightens the import surface per D-91-RS-05.

2. **Soft assertions / `.catch` fallbacks:** Grep needed in plan. Initial scan of the first 100 lines shows none; planner verifies entire file (313+ lines). Likely none — the spec was authored Phase 78 CLEAN-05 with throw-on-missing-env discipline (lines 29-42 throw rather than soft-fallback).

3. **JWE token synthesis:** Lines 60-100+ generate RSA key pairs via `jose.generateKeyPair` then construct a JWE-encrypted id_token. **Leave intact** per D-91-RS-05.

4. **Env-gating:** `PLAYWRIGHT_BANK_AUTH=1` opt-in remains. **Leave intact.**

**Minimal-pass scope:** 2 atomic edits — (a) swap the import to `'@playwright/test'`; (b) verify no soft assertions / `.catch` on assertion-bearing locators (probably none). Total expected diff: ~3 lines.

## Playwright Project Chain (D-91-PD-05)

**27 new entries** appended to `tests/playwright.config.ts` after the existing `perm-localisation-positive` block (lines 992-1009). Recommended naming + ordering:

| # | Setup project | Spec project | Teardown project | Depends on (prior spec) |
|---|---------------|--------------|------------------|-------------------------|
| 10 | `data-setup-perm-answers-locked` | `perm-answers-locked` | `data-teardown-perm-answers-locked` | `perm-localisation-positive` |
| 11 | `data-setup-perm-hide-hero` | `perm-hide-hero` | `data-teardown-perm-hide-hero` | `perm-answers-locked` |
| 12 | `data-setup-perm-header-show-feedback` | `perm-header-show-feedback` | `data-teardown-perm-header-show-feedback` | `perm-hide-hero` |
| 13 | `data-setup-perm-header-show-help` | `perm-header-show-help` | `data-teardown-perm-header-show-help` | `perm-header-show-feedback` |
| 14 | `data-setup-perm-hide-all-nominations` | `perm-hide-all-nominations` | `data-teardown-perm-hide-all-nominations` | `perm-header-show-help` |
| 15 | `data-setup-perm-hide-if-missing-answers` | `perm-hide-if-missing-answers` | `data-teardown-perm-hide-if-missing-answers` | `perm-hide-all-nominations` |
| 16 | `data-setup-perm-hide-election-tags` | `perm-hide-election-tags` | `data-teardown-perm-hide-election-tags` | `perm-hide-if-missing-answers` |
| 17 | `data-setup-perm-hide-category-tags` | `perm-hide-category-tags` | `data-teardown-perm-hide-category-tags` | `perm-hide-election-tags` |
| 18 | `data-setup-perm-disable-allow-open` | `perm-disable-allow-open` | `data-teardown-perm-disable-allow-open` | `perm-hide-category-tags` |

**Per-template `externalIdPrefix`** (matches per-perm naming):

| Perm | externalIdPrefix |
|------|------------------|
| perm-answers-locked | `e2e-perm-answers-locked-` |
| perm-hide-hero | `e2e-perm-hide-hero-` |
| perm-header-show-feedback | `e2e-perm-header-feedback-` |
| perm-header-show-help | `e2e-perm-header-help-` |
| perm-hide-all-nominations | `e2e-perm-hide-all-noms-` |
| perm-hide-if-missing-answers | `e2e-perm-hide-missing-` |
| perm-hide-election-tags | `e2e-perm-hide-eltags-` |
| perm-hide-category-tags | `e2e-perm-hide-cattags-` |
| perm-disable-allow-open | `e2e-perm-no-allowopen-` |

**Each setup file** uses `setupFromTemplate('perm-X', { extraTeardownPrefix: ['test-', 'e2e-perm-'] })` per the established 89-04 / 90 pattern (`tests/tests/setup/perm-disable-voter-app.setup.ts:15-17`). Each teardown file calls `runTeardown(PREFIX, client)` (per `perm-disable-voter-app.teardown.ts:14-18`).

**Anchoring downstream:** After the 9 new perm chains, the next existing project must depend on `perm-disable-allow-open` (currently `perm-localisation-positive` was the LAST perm; baseV1 setup anchored on `perm-not-located-2e2cg`). The planner must update `data-setup-baseV1.dependencies` from `['perm-not-located-2e2cg']` to `['perm-disable-allow-open']` — OR keep baseV1 anchored where it is and insert the new perms before/after baseV1 differently. Researcher recommends:

- Keep baseV1 anchor at `perm-not-located-2e2cg` (mega-journey runs once early).
- Append 9 new perms at the END after candidate-mega-journey + the existing 89-04 + 90 perm chains.

This preserves the established invariant "perm-* family runs sequentially; baseV1 + mega chains follow." Concrete sequence:

```
... → perm-not-located-2e2cg → data-setup-baseV1 → voter-mega-journey → data-setup-candidate-mega
    → candidate-mega-journey → perm-disable-voter-app → ... → perm-localisation-positive
    → perm-answers-locked → perm-hide-hero → ... → perm-disable-allow-open (END)
```

## Common Pitfalls

### Pitfall 1: TIR6:122 `!has info` typo
**What goes wrong:** Authoring the customData.allowOpen=false perm template with cand omitting info text on both Q1+Q2 (literal interpretation of `!has`) means there's nothing to ASSERT-VISIBLE on Q1.
**Why it happens:** TIR6 reads `1 candidate / !has info in answers to BOTH questions`. The `!` is a typo per D-91-PD-04.
**How to avoid:** Per D-91-PD-04, candidate authors info on BOTH answers. `allowOpen=false` on Q2 SUPPRESSES rendering (suppresses *visibility*, not data). Q1 has info visible (allowOpen default true), Q2 has info hidden.
**Warning signs:** Spec assertion `expect(infoText).toBeVisible()` on Q1 returns no element if you took TIR6 literally.

### Pitfall 2: baseV1 reuse for visual rebaseline
**What goes wrong:** Visual baselines are coupled to baseV1's exact row order + content. Phase 89-01 mutations (hero emoji on Q1, hero image on Q2, hero on base category, info content on Q1) shifted the screenshots. Running pre-mutation baselines against post-mutation rendering fails the diff.
**Why it happens:** Visual baselines are PNG byte-comparisons; any UI change invalidates them.
**How to avoid:** Per D-91-RS-01, rebaseline AFTER Phase 91's Group A/B lands (the 89-01 mutations are already in baseV1 as of Phase 89 — visual baselines have been stale since then).
**Warning signs:** Visual tests fail with pixel diffs in the hero area or the info button area.

### Pitfall 3: Locale fragility on Help/Feedback button assertions
**What goes wrong:** Asserting `await expect(button).toHaveText('Send feedback')` fails when locale switches to Finnish ('Lähetä palautetta').
**Why it happens:** `t('feedback.send')` resolves at render time.
**How to avoid:** Use testids (`header-feedback`, `header-help`) added per §"New TestId Inventory" A3/A4. Regex match acceptable for negative assertions (`/feedback|palaute|återkoppling/i`).
**Warning signs:** Tests pass under en but fail under fi/sv perm runs.

### Pitfall 4: Per-perm spec authentication flow for answers-locked
**What goes wrong:** The answers-locked perm requires logging in as the seeded candidate. The candidate-mega chain has its own auth flow (registration via email). The simpler perm chains use STORAGE_STATE or skip auth.
**Why it happens:** Seeded candidates in perm templates have ToU accepted (`terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` per shared.ts) but no `auth.users` row (no password set).
**How to avoid:** Two paths: (a) extend the perm template to ALSO seed an `auth.users` row + set candidate.user_id (requires SupabaseAdminClient extension in the setup file); (b) use the login page to assert the read-only warning, then assert at the public route surface that doesn't need auth (Banner / static page). Researcher recommends path (b) — assertions on the read-only warning text on `/candidate/login` (page renders `t('candidateApp.login.answersLockedInfo')` when `answersLocked` is true, no auth required, per `apps/frontend/src/routes/candidate/login/+page.svelte:156`). For the disabled inputs / disabled choice radios assertions, either skip those (login surface is sufficient evidence) OR use SupabaseAdminClient to mint a session (more complex).
**Warning signs:** Spec authors find themselves needing the email-registration flow inside a perm chain.

### Pitfall 5: showAllNominations=false uses a 307 redirect (NOT a client-side guard)
**What goes wrong:** Asserting on a `home` testid after navigating to `/nominations` may flake if the test inspects DOM before redirect completes.
**Why it happens:** `apps/frontend/src/routes/(voters)/nominations/+layout.ts:19-27` issues a 307 server redirect via SvelteKit's `redirect()` helper.
**How to avoid:** Use `await expect(page).toHaveURL(/\/en\/?$/)` — Playwright waits for the navigation event.
**Warning signs:** Race between `page.goto` completion and DOM-based assertion.

### Pitfall 6: hideIfMissingAnswers also gates organisations on results
**What goes wrong:** Per CONTEXT and `supabaseDataProvider.ts:384`, `hideIfMissingAnswers.candidate` also filters orgs from results if ALL their candidates are filtered. With a 2-candidate perm where cand-2 is filtered, the org may or may not still appear depending on whether cand-1 has answers.
**Why it happens:** The setting cascades to org visibility via the data adapter.
**How to avoid:** TIR6 expects only the candidate visibility outcome (cand-1 visible, cand-2 hidden). Researcher recommends explicitly NOT asserting on org count in this perm — scope to candidate cards only.
**Warning signs:** Spec asserts on a 2-cand-1-org count but observes 0 orgs.

### Pitfall 7: Voter mega-journey hits the new nav-menu drawer in headless mode
**What goes wrong:** Opening the voter nav drawer (where the feedback menu item lives) requires clicking the hamburger menu. The voter-mega-journey currently does NOT open the drawer; the feedback step needs to.
**Why it happens:** `<NavItem onclick={$openFeedbackModal} ... />` lives inside `<Navigation>` which is hidden until the drawer opens.
**How to avoid:** Plan adds drawer-open handling to the feedbackDialog step. The existing voter-mega-journey doesn't have a drawer-open helper — the feedbackDialog fixture should expose `openViaNavDrawer(page)` OR the spec body does the drawer open inline.
**Warning signs:** `getByRole('button', { name: /feedback/i })` returns no element in headless test runs because the drawer never opened.

### Pitfall 8: `voter.fixture.ts` `@deprecated` banner may emit warnings during E2E runs
**What goes wrong:** If the plan adds `console.warn` to `voter.fixture.ts` (per D-91-RS-04's "Optional: add a runtime `console.warn` in development mode" suggestion), every test run emits noise.
**Why it happens:** Many specs still consume `voterTest` — each fixture invocation warns.
**How to avoid:** Researcher recommends **JSDoc `@deprecated` banner ONLY** — no runtime warning. The banner shows up in IDE hovers + on import autocomplete; runtime noise is avoided.
**Warning signs:** CI logs flood with deprecation warnings during E2E runs.

### Pitfall 9: setupFromTemplate's app_settings JSONB parity assertion
**What goes wrong:** Settings overlays that include keys whose JSONB roundtrip drops fields (e.g., `undefined` values) cause setupFromTemplate's post-seed assertion to fail.
**Why it happens:** `shared.ts:107` documents: "the `elections.startFromConstituencyGroup` key is OMITTED entirely per Plan 88-01 Deviation T1 (JSONB drops `undefined` keys and breaks `toMatchObject` parity in setupFromTemplate's post-seed assertion)."
**How to avoid:** Helper's `settingsOverlay` must use explicit `false` or omit the key entirely; never `undefined`.
**Warning signs:** Setup step fails post-seed with `toMatchObject` mismatch on app_settings.

### Pitfall 10: Feedback success text in different locales
**What goes wrong:** `t('feedback.thanks')` text varies. The status state `'sent'` is the stable signal; text is not.
**Why it happens:** i18n.
**How to avoid:** Use the proposed `data-status="sent"` attribute on the submit button (§B2). The `expectSuccess()` fixture method asserts on the attribute, not text.

## Code Examples

### Helper-based perm template (post-port)
```typescript
// packages/dev-seed/src/templates/permutations/perm-answers-locked.ts
// Source: extrapolated from perm-disable-voter-app.ts + the proposed buildMinimal API.

import { buildMinimal } from '../_helpers/buildMinimal';
import type { Template } from '../../template/types';

export const permAnswersLockedTemplate: Template = buildMinimal({
  externalIdPrefix: 'e2e-perm-answers-locked-',
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 1,
  settingsOverlay: {
    access: { answersLocked: true }
  }
});

export default permAnswersLockedTemplate;
```

### Visual-regression refactor (post-D-91-RS-01)

```typescript
// tests/tests/specs/visual/visual-regression.spec.ts (proposed)
// Source: derived from current spec + voter-mega.fixture.ts + candidatePreviewPage.fixture.ts

import { voterMegaTest as voterTest } from '../../fixtures/voter-mega.fixture';
import { test, expect } from '../../fixtures/candidate/candidate-mega';
import { testIds } from '../../utils/testIds';

voterTest.describe('Voter Results - Desktop @visual', { tag: ['@visual'] }, () => {
  voterTest.describe.configure({ mode: 'serial' });
  voterTest.use({ viewport: { width: 1280, height: 720 } });

  voterTest('screenshot matches baseline', async ({ answeredVoterPage: page }) => {
    await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible' });
    await voterTest.expect(page).toHaveScreenshot('voter-results-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

// ... candidate-preview tests migrate to the candidatePreviewPage function-fixture ...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy `voter.fixture.ts` `voterTest.answeredVoterPage` | New `voter-mega.fixture.ts` `answeredVoterPage` (function-fixture on baseV1) | Phase 88-01 | Phase 91 migrates 3 of 15 consumers (visual + perf + a11y); other 12 stay on legacy until v2.11+ |
| Hand-authored perm templates duplicating shared.ts boilerplate | `buildMinimal` helper authoring fresh-minimal Templates | Phase 91 (D-91-PD-01) | Reduces 9 × ~100 lines of boilerplate; ports 6 existing perms (reduces them by ~50 lines each) |
| SupabaseAdminClient.findData + URL-prefill in a11y-smoke for located routes | `voter-mega.fixture.ts` `locatedVoterPage` (new) + `answeredVoterPage` | Phase 91 (D-91-RS-02b) | Drops ~30 lines from a11y-smoke; eliminates `test-election-1` external_id coupling |
| Inline `t('feedback.thanks')` text assertions for feedback success | `data-status="sent"` attribute on submit button | Phase 91 (B2) | Locale-resilient; replaces 14 sequential text assertions in voter-feedback-persistence with the fixture API |

**Deprecated/outdated:**
- Legacy `voter.fixture.ts` — `@deprecated` banner only (D-91-RS-04); deletion deferred to v2.11+.
- `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` — DELETED in Phase 91 (D-91-MJ-03); absorbed by voter-mega feedbackDialog step.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | baseV1 has a Link-type (URL-type) info question for the invalidUrl step | Mega-Journey Absorption Points / B1 | Plan must extend baseV1 to add one; small additional task |
| A2 | The candidate-preview visual test can land via a STORAGE_STATE-only candidate without needing the unregistered-candidate flow | Visual Baseline Strategy | If the candidate-preview surface requires answered opinions, planner must wire `data-setup-baseV1`-only auth (researcher recommends fixing in 91-04) |
| A3 | The voter-mega-journey reaches /results in a state where `voterCtx.openFeedbackModal` is truthy (existing precedent: voter-feedback-persistence.spec.ts:21 confirms this) | Mega-Journey Absorption Points B2 | Low — already verified by the legacy spec |
| A4 | `setupFromTemplate` handles app_settings overlay with arbitrary nested overrides via the writer's JSONB roundtrip | Helper signature | Low — established by perm-disable-voter-app + perm-per-app-notifications |
| A5 | The hideIfMissingAnswers perm cand-1 visible / cand-2 hidden assertion can be made without asserting org count | Pitfall 6 | Medium — if org filtering cascade is observable, researcher's recommendation may need tightening |
| A6 | Per-perm chains run sequentially (not parallel) within the perm-* family | Playwright Project Chain | Low — established by 88-03 HIGH-2 invariant (app_settings singleton clobbering) |
| A7 | Adding `data-status="sent"` on the feedback submit button is a11y-neutral | TestId Inventory B2 | Low — `data-*` attributes are inert for screen readers |
| A8 | The feedbackDialog can be opened via the voter nav drawer in headless Chromium (not blocked by drawer-animation timing) | Pitfall 7 | Low — existing voter-mega flows interact with NavItems |

**Risk-level overall:** LOW. Eight assumptions, all with mitigations identified.

## Open Questions (RESOLVED — per planner revision 2026-05-30, checker WARNING 2)

All five Open Questions reached resolution during the planning + revision pass. Each carries an explicit RESOLVED marker with the locked decision below; the Recommendations remain for traceability.

1. **(RESOLVED)** **Should `buildMinimal` accept the `terms_of_use_accepted` date as a parameter, or always seed `'2025-01-01T00:00:00.000Z'`?**
   - **RESOLVED:** Default to the shared constant `'2025-01-01T00:00:00.000Z'`. Optional parameter `candidateToUDateByExternalId` is deferred until a future perm needs missing-ToU semantics.
   - What we know: every existing perm hardcodes the same value.
   - What's unclear: future perms may want missing ToU (untoured candidate variant).
   - Recommendation: default to the shared constant; expose as optional `candidateToUDateByExternalId` later if needed.

2. **(RESOLVED)** **For the answers-locked perm, is the login-page assertion sufficient or must we also assert disabled inputs on /candidate/profile?**
   - **RESOLVED:** Implement FULL 3-surface coverage per CONTEXT.md Group A item 1 (login warning + profile disabled inputs + opinions disabled radios). Path (b) — author a reusable session-minting helper. The helper `mintCandidateSession` lives at `tests/tests/utils/candidateSessionMinter.ts` (Plan 91-01 Task 3, locked by D-91-PD-06). A1, A2, and A9 perm specs consume it via per-perm storageState files. NO scope reduction to the login surface (closes checker BLOCKER 1).
   - What we know: TIR6:8-14 expects 3 surfaces (login warning, profile disabled, opinions disabled).
   - What's unclear: whether a perm chain should mint an `auth.users` row to log in as the seeded candidate.
   - Recommendation: Plan 91-02 decides based on auth complexity. Researcher leans toward authoring a SupabaseAdminClient helper that mints a session for any seeded candidate (could be reusable for future perms). Cost: ~30 lines of helper + 5 lines in the perm setup. Alternative: scope assertions to the login surface only and skip the disabled-inputs cells.

3. **(RESOLVED)** **Where should the `locatedVoterPage` fixture live — as a second option fixture on `voter-mega.fixture.ts` or as a separate file?**
   - **RESOLVED:** Extend voter-mega.fixture.ts in-place with a second `locatedVoterPage` fixture (two-fixture split — researcher's preferred approach). Plan 91-04 Task 1 owns the extension. The Walking helper is shared between answeredVoterPage and locatedVoterPage; the only divergence is whether the walk advances past /questions or stops there.
   - What we know: voter-mega.fixture.ts already has the walking logic; sharing it is natural.
   - What's unclear: whether a11y-smoke would also benefit from sharing the answeredVoterPage variant or needs a fully independent setup.
   - Recommendation: extend `voter-mega.fixture.ts` in-place with a `locatedVoterPage` fixture that walks Home → /questions intro and stops. Single file, two fixtures.

4. **(RESOLVED)** **Should the new `feedback-success` testid (or `data-status` attribute) be added to `Feedback.svelte` AND `FeedbackPopup.svelte`?**
   - **RESOLVED:** Phase 91 adds the `data-status` attribute (not a testid) to Feedback.svelte:235 ONLY (Plan 91-03 Task 1). FeedbackPopup.svelte gets the attribute when first consumed by a future candidate-mega-journey extension — deferred to a later phase.
   - What we know: TIR6 only exercises the dialog form (`Feedback.svelte`), not the popup.
   - What's unclear: candidate-mega may later assert on feedback via popup.
   - Recommendation: Phase 91 — add to `Feedback.svelte` only. Popup gets it when consumed.

5. **(RESOLVED)** **What happens if multiple perm chains land in parallel on the same Supabase instance during CI matrix runs?**
   - **RESOLVED:** Maintain sequential dependencies in Plan 91-02 per HIGH-2 invariant. Each new perm spec project in playwright.config.ts depends on the previous spec via `dependencies: ['<previous-perm-spec>']` — chain anchored on perm-localisation-positive (the last 90-04 spec) and ending at perm-disable-allow-open. No parallel execution within the perm-* family.
   - What we know: the HIGH-2 invariant enforces sequential chains within the perm-* family.
   - What's unclear: nothing — the invariant is established.
   - Recommendation: maintain sequential chain via `dependencies` array. No change needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase local (Docker) | `setupFromTemplate` per-perm seed | Yes | (workspace pinned) | None — required |
| `yarn` 4 / Node | Workspace install | Yes | (workspace pinned) | None — required |
| Playwright browsers | E2E run | Yes | (workspace pinned) | `yarn playwright install` |
| CI environment with stable font rendering | Visual baseline regeneration | Yes (CI provided) | n/a | Defer rebaseline until CI run available |
| `PLAYWRIGHT_BANK_AUTH=1` env + Edge Function `--no-verify-jwt` | Bank-auth opt-in | Yes (manual flag) | n/a | Skipped in default suite |
| `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY` env | Bank-auth + admin seeding | Yes (developer env) | n/a | Spec throws if absent (Phase 78 CLEAN-05 IN-01) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (workspace-pinned) + Vitest (unit tests in dev-seed package) |
| Config file | `tests/playwright.config.ts` + per-package `vitest.config.ts` |
| Quick run command | `yarn test:e2e --project=perm-answers-locked` (or any single new perm project) |
| Full suite command | `yarn test:e2e` (runs full default chain — ~all perm chains sequentially + mega-journeys) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| 91-A1 | answersLocked perm: candidate sees read-only warning | e2e (perm) | `yarn test:e2e --project=perm-answers-locked` | ❌ Wave 0 (new spec) |
| 91-A2 | hideHero perm: hero hidden on opinion question | e2e (perm) | `yarn test:e2e --project=perm-hide-hero` | ❌ Wave 0 |
| 91-A3 | header.showFeedback perm: header feedback button + dialog | e2e (perm) | `yarn test:e2e --project=perm-header-show-feedback` | ❌ Wave 0 |
| 91-A4 | header.showHelp perm: header help button + Help URL | e2e (perm) | `yarn test:e2e --project=perm-header-show-help` | ❌ Wave 0 |
| 91-A5 | showAllNominations=false perm: /nominations → / | e2e (perm) | `yarn test:e2e --project=perm-hide-all-nominations` | ❌ Wave 0 |
| 91-A6 | hideIfMissingAnswers perm: cand-2 filtered | e2e (perm) | `yarn test:e2e --project=perm-hide-if-missing-answers` | ❌ Wave 0 |
| 91-A7 | showElectionTags=false perm: no election-tag on questions | e2e (perm) | `yarn test:e2e --project=perm-hide-election-tags` | ❌ Wave 0 |
| 91-A8 | showCategoryTags=false perm: no category-tag on questions | e2e (perm) | `yarn test:e2e --project=perm-hide-category-tags` | ❌ Wave 0 |
| 91-A9 | allowOpen=false perm: candidate + voter Q2 info hidden | e2e (perm) | `yarn test:e2e --project=perm-disable-allow-open` | ❌ Wave 0 |
| 91-B1 | invalidUrl edit-step | e2e (mega) | `yarn test:e2e --project=candidate-mega-journey` | ✅ (existing spec, extended) |
| 91-B2 | feedbackDialog edit-step | e2e (mega) | `yarn test:e2e --project=voter-mega-journey` | ✅ (existing spec, extended) |
| 91-B3 | all-nominations edit-step | e2e (mega) | `yarn test:e2e --project=voter-mega-journey` | ✅ (existing spec, extended) |
| 91-C1 | Visual regression rebaseline | e2e (visual) | `PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression` | ✅ (existing spec, refactored) |
| 91-C2 | Perf budget migration | e2e (perf) | `PLAYWRIGHT_PERF=1 npx playwright test --project=performance` | ✅ (existing spec, refactored) |
| 91-C3 | A11Y axe smoke migration | e2e (a11y) | `PLAYWRIGHT_A11Y=1 npx playwright test --project=a11y-smoke` | ✅ (existing spec, refactored) |
| 91-C4 | Bank-auth minimal pass | e2e (bank-auth) | `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth` | ✅ (existing spec, minor tightening) |
| 91-D1 | voter-feedback-persistence.spec.ts deletion | static | `! test -f tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (or `ls`) | ✅ (file exists; deletion is the change) |
| 91-D2 | voter.fixture.ts @deprecated banner | static | `grep -q "@deprecated" tests/tests/fixtures/voter.fixture.ts` | ✅ (file exists; banner added) |

### Sampling Rate

- **Per task commit:** the single corresponding perm chain (`yarn test:e2e --project=perm-X` for the perm being authored) + the mega-journey project for B1/B2/B3 commits.
- **Per wave merge:** full perm-family suite (`yarn test:e2e --project=perm-*` is not a direct selector — planner uses sequential project selectors or `yarn test:e2e` minus the opt-in projects).
- **Phase gate:** Full default `yarn test:e2e` green + opt-in `PLAYWRIGHT_VISUAL=1` / `PLAYWRIGHT_PERF=1` / `PLAYWRIGHT_A11Y=1` / `PLAYWRIGHT_BANK_AUTH=1` green before `/gsd:verify-work`.

### Wave 0 Gaps

- [ ] 9 new perm spec files under `tests/tests/specs/perm/` — Wave 0 of each plan creates the file.
- [ ] 9 new perm template files under `packages/dev-seed/src/templates/permutations/` — Wave 0.
- [ ] 9 new setup/teardown pairs under `tests/tests/setup/` — Wave 0.
- [ ] `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` — Wave 0 of Plan 91-01.
- [ ] `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` — Wave 0 of Plan 91-03.
- [ ] `tests/tests/utils/testIds.ts` extensions — Wave 0 of each plan that adds a perm.
- [ ] 9 testid additions to Svelte components per §"New TestId Inventory" — Wave 0.
- [ ] Playwright config 27 new entries — Wave 0 of Plan 91-02 (after templates exist).
- [ ] No framework install needed — all dependencies already wired.

## Security Domain

Phase 91 is testing infrastructure only. No new authentication flows, no new data flows, no new external endpoints. ASVS categories:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (perm chains use seeded candidates without auth.users rows; bank-auth is unchanged) | n/a |
| V3 Session Management | No | n/a |
| V4 Access Control | No (perm chains exercise existing authorization gates; never bypass them) | n/a |
| V5 Input Validation | Yes (the invalidUrl edit-step asserts that `Input.svelte`'s url validation gate works) | Existing `Input.svelte:289-297` `checkUrl` validation |
| V6 Cryptography | No (bank-auth JWE token synthesis is unchanged) | `jose` library (already in use) |

**Threat patterns for the perm chains:**
- Per-perm `externalIdPrefix` isolation prevents cross-chain row leakage (88-03 / 89-04 / 90 invariant maintained).
- No secrets are seeded into perm templates — only test data.

## Sources

### Primary (HIGH confidence)
- `./TEST-INVENTORY-REFACTOR-6.md` — Authoritative source for all 9 perms + 3 edit-steps + 4 refactor families.
- `.planning/phases/91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth/91-CONTEXT.md` — User decisions (D-91-*).
- `packages/dev-seed/src/templates/permutations/shared.ts` — `MINIMAL_BASE_APP_SETTINGS` + `buildCandidate` / `buildElectionConstituencyNoms` builders.
- `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` + `perm-localisation-positive.ts` + `perm-missing-nominations.ts` — Reference shape for the new helper.
- `packages/dev-seed/src/template/types.ts` — Template type derivation (`z.infer<typeof TemplateSchema>`).
- `tests/tests/fixtures/voter-mega.fixture.ts` — Current `answeredVoterPage` + the walking helper.
- `tests/tests/fixtures/voter.fixture.ts` — Legacy fixture to be deprecated.
- `tests/tests/fixtures/views.ts` + `tests/tests/fixtures/candidate/candidate-mega.ts` — Composition root patterns.
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — Voter mega-journey target.
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` — Candidate mega-journey target (22 test.step blocks).
- `tests/tests/specs/perm/perm-1e1cg1co.spec.ts` + `perm-disable-voter-app.spec.ts` + `perm-missing-nominations.spec.ts` — Perm spec shape reference.
- `tests/tests/setup/perm-disable-voter-app.setup.ts` + `.teardown.ts` + `baseV1.setup.ts` — Setup/teardown wiring reference.
- `tests/playwright.config.ts` (lines 620-1011) — Project chain shape + dependencies graph.
- `tests/tests/utils/testIds.ts` — Central testid inventory.
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` — Feedback testid surface + status state machine.
- `apps/frontend/src/routes/Banner.svelte` (lines 65-71) — Header feedback/help button surface (no testids).
- `apps/frontend/src/routes/(voters)/+layout.svelte` (lines 78-97) — TopBarActions wiring for header.showFeedback/showHelp.
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` (lines 264-305) — hideHero + allowOpen render branches.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` (lines 183-189, 280-304) — answersLocked render surfaces.
- `apps/frontend/src/routes/candidate/login/+page.svelte` (line 156) — login answersLockedInfo render.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte` (line 78) — Voter-side allowOpen gate.
- `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` (lines 74, 79) — showElectionTags + showCategoryTags gates.
- `apps/frontend/src/lib/components/electionTag/ElectionTag.svelte` + `categoryTag/CategoryTag.svelte` — Currently no testids (confirmed via grep).
- `apps/frontend/src/lib/components/input/Input.svelte` (line 296 + 640-642) — invalidUrl error surface.
- `apps/frontend/src/routes/(voters)/nominations/+layout.ts` (lines 19-27) — showAllNominations redirect.
- `apps/frontend/src/lib/utils/route/route.ts` (line 17) — `Help: VOTER + /about` aliasing.

### Secondary (MEDIUM confidence)
- `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-04-PLAN.md` — Perm chain partition reference.
- `.planning/phases/90-tir5-permutations-missing-nominations-warning-localisation-n/90-CONTEXT.md` — Most recent perm precedent.
- `.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-CONTEXT.md` — Parallel-landing + `setupFromTemplate` lineage.
- Operator memory:
  - `project_all_green_suite_priority.md` — must not regress determinism.
  - `feedback_e2e_did_not_run.md` — "did not run" cascades count as failures; preserved by sequential chain.
  - `feedback_skip_ui_spec_for_a11y_only_phases.md` — Phase 91 a11y refactor is fixture-rework, NOT visual redesign — skip ui-phase auto-spawn.

### Tertiary (LOW confidence)
- None — all critical findings cross-verified against the source tree.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all already in repo.
- Architecture (per-perm chain, mega-journey absorption, fixture composition): HIGH — established by 88/89/90 precedent.
- Helper signature: MEDIUM — proposed shape derived from existing templates; ergonomics test in 91-01.
- Pitfalls: HIGH — derived from explicit source code observation + lineage docs.
- TestId additions: HIGH — every render surface inspected; current state confirmed.
- Visual baseline strategy: MEDIUM — relies on operator-provided CI capture; researcher cannot pre-validate baseline portability.

**Research date:** 2026-05-30
**Valid until:** 2026-06-29 (30 days — stack is stable; refresh if Phase 92 lands first)

## RESEARCH COMPLETE

**Phase:** 91 - TIR6 perm + edit test additions + visual/perf/a11y/bank-auth refactor
**Confidence:** HIGH

### Key Findings

- **The helper API is a thin wrapper over `shared.ts` builders** — proposed `buildMinimal({ externalIdPrefix, candidates, opinionQuestions, infoQuestions, settingsOverlay, customDataByQuestion, answersByCandidate, elections, organizations, nominationsInElectionIndices })` covers every Group A perm + the 6 D-91-PD-03 ports without forking from the existing `Template` shape.
- **9 testid additions needed** across `Banner.svelte` (feedback + help), `ElectionTag.svelte`, `CategoryTag.svelte`, `EntityOpinions.svelte` (open-answer wrapper), `Input.svelte` (error message), `Feedback.svelte` (new `data-status` attr on submit button), candidate login (`login-answers-locked-info`), and a shared `candidate-answers-locked-warning` across 3 candidate surfaces. Disabled state for inputs + choice radios uses native `:disabled` (no new testid needed).
- **27 new playwright project entries** sequenced after `perm-localisation-positive` → `perm-answers-locked` → ... → `perm-disable-allow-open` (sequential per HIGH-2 invariant). Each chain has its own `externalIdPrefix` for parallel safety.
- **`voter-mega.fixture.ts` extension** (D-91-RS-02b): add `locatedVoterPage` fixture variant (walks Home → /questions intro, no answers) for a11y questions-route scan. `answeredVoterPage` already covers results + drawer routes.
- **Bank-auth minimal-pass is ~3 lines:** swap `import { expect, test } from '../../fixtures'` → `'@playwright/test'`; verify no soft assertions exist (initial scan: none). Leave JWE synthesis + `PLAYWRIGHT_BANK_AUTH=1` env-gating intact per D-91-RS-05. Visual rebaseline is CI-driven per D-91-RS-01; deferred to after Group A/B lands.

### File Created
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth/91-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All deps already pinned in monorepo |
| Architecture (perm chain + fixture composition) | HIGH | 88/89/90 precedent fully maps to TIR6 needs |
| Helper API shape | MEDIUM | Object-args proposed; refinement during 91-01 implementation possible |
| TestId additions | HIGH | Every render surface inspected; gaps identified concretely |
| Pitfalls catalogue | HIGH | Derived from explicit source observation + lineage docs |
| Visual baseline strategy | MEDIUM | CI-capture dependency; cannot pre-validate baseline portability |

### Open Questions

1. Should the answers-locked perm mint an `auth.users` session for the seeded candidate (full deep walk) or scope to the login page warning only (simpler)?
2. Will baseV1 need a URL-type info question for the invalidUrl edit-step, or does it already have one?
3. Where to land the new `locatedVoterPage` fixture — extend `voter-mega.fixture.ts` in-place (recommended) or a separate file?
4. Should `feedback-success` be conveyed via `data-status` attribute (recommended) or a dedicated testid element?
5. Should the visual-regression candidate-preview test have its own setup project, or fold into existing `data-setup-baseV1`?

### Ready for Planning
Research complete. Planner has full insight into:
- Helper API shape + 6 ports + 9 new perm chains (Plan 91-01 + 91-02).
- Mega-journey absorption points + new `feedbackDialog` fixture surface + voter-feedback-persistence deletion (Plan 91-03).
- Refactor scope per spec family + testid additions per surface (Plan 91-04).
