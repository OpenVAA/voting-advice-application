# Phase 119: E2E Fixtures & Helpers + Seed - Research

**Researched:** 2026-06-14
**Domain:** Playwright E2E fixtures/helpers, production `data-testid` additions, `@openvaa/dev-seed` templates, default-seed tooling bug (UNBLK-03)
**Confidence:** HIGH (all live-code claims verified by file reads + a running-app seed run this session)

## Summary

Phase 119 is the **fixtures-first foundation layer** for the existing-feature E2E spec phases (120 EPERM / 121 EFLOW / 122 bank-auth). It builds the fixtures/helpers + production `data-testid`s those specs consume, the dev-seed template changes (new/renamed/consolidated perm templates + `e2e/base` additions), fixes the default-seed bug (UNBLK-03), removes `--likert-only` entirely, deletes 4 dead `voterNavigation.ts` helpers, and smoke-probes each new fixture — all BEFORE any spec is authored. It writes NO `*.spec.ts`, NO Playwright project wiring, and NO `tests/tests/setup/**` files (those are 120–122). [CITED: 119-CONTEXT.md]

The codebase is in excellent shape for this work. The fixture composition pattern (`base.extend` + `create<Name>(page)` factories in `tests/tests/fixtures/voter/views.ts`), the `testIds` central registry (`tests/tests/utils/testIds.ts`), the `buildMinimal()` perm-template authoring helper, and the dev-seed `BUILT_IN_TEMPLATES`/`BUILT_IN_OVERRIDES` registry are all clean, documented, and unit-tested. Most new helpers hang off existing fixtures/test-ids; most new test-ids land in well-isolated component files.

**Two findings materially change the plan and must reach the planner:**
1. **EFLOW-07 (dark mode) premise is WRONG.** Dark mode is driven SOLELY by `window.matchMedia('(prefers-color-scheme: dark)')` (`darkMode.svelte.ts`). There is **NO toggle button** and **NO localStorage persistence** — the CONTEXT.md/CLAUDE.md note "theme persisted via runeLocalStorage" is incorrect. The EFLOW-07 helper must use Playwright `page.emulateMedia({ colorScheme })`, not a toggle click, and "persisted across reload" is automatic.
2. **UNBLK-03 does NOT reproduce as a seed-WRITE failure today.** A clean `yarn db:reset && yarn db:seed:default` this session wrote 8 organizations, 327 candidates (all answering all 24 questions), 24 questions, 377 nominations — all valid and wired. The June-6 todo symptoms ("0 parties / candidates tab empty") were observed in the running app during Phase 101 and may be (a) already resolved by intervening fixes or (b) a frontend-read issue not visible in the DB. **UNBLK-03 verification MUST be a running-app check, not a unit/DB assertion** (per ROADMAP SC3). The "inconsistent naming" symptom IS confirmed: `default.ts`'s docstrings are stale (claim "13 constituencies / 100 candidates / 18 ordinal + 5 categorical"; body emits 5 / 327 / matches).

**Primary recommendation:** Sequence the work as (1) `--likert-only` removal + dev-seed rebuild + unit-suite-green gate; (2) `voterNavigation.ts` dead-helper deletion; (3) UNBLK-03 diagnose-in-running-app then minimal fix + docstring reconciliation; (4) new test-ids in production source; (5) new fixtures/helpers hanging off existing roots; (6) dev-seed template authoring (new/rename/consolidate/extend); (7) one smoke/probe per new fixture via the dev-seed CLI + standalone probe spec (no Playwright project wiring).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| New `data-testid`s (Video, popups, filter select-all, dark-mode, About disclosure) | Frontend (Svelte components) | — | A helper cannot read a test-id that does not exist; adding it is part of "build the helper" [CITED: 119-CONTEXT.md] |
| New fixtures/helpers (`expectVideo`, `expectInfoMode`, `trackingIntercept`, etc.) | E2E test layer (`tests/tests/fixtures/**`, `utils/**`) | — | Behaviour-via-fixtures (A3); routed through `testIds` + `getByTestId` |
| dev-seed templates (perm + e2e/base) | dev-seed package (`packages/dev-seed/src/templates/**`) | DB (write via Supabase RPC) | SC4 places template authoring in 119 |
| UNBLK-03 default-seed fix | dev-seed (`default.ts` + overrides) | Frontend read-path (verification) | Bug surfaces in running app; fix is in the template/tooling |
| `--likert-only` removal | dev-seed CLI + docs | E2E docstrings | CLI-only filter, zero live consumers |
| Tracking intercept boundary | E2E browser fixture | Frontend (`window.umami.track` seam) | Tracking emits via Umami's external `window.umami.track`; intercept at that seam |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **A8 — Fixtures-first hard gate.** No spec is authored before its fixtures exist + typecheck + pass a smoke/probe. Phase 119 satisfies the "exist + typecheck + locator-guard + smoke" half for 120–122.
- **A3 — Behaviour via fixtures, not selectors.** All new fixtures/helpers must pass `yarn typecheck:tests` and the `no-restricted-locators` (ESLint) locator guard. Use `data-testid`-based locators via `testIds` util conventions; no raw CSS/text locators.
- **CRITICAL path correction:** the E2E suite lives at the **repo-root `tests/`**, NOT `apps/frontend/tests/`. The voter fixture is `tests/tests/fixtures/voter/voter-journey.fixture.ts`. `answeredVoterPage`/`locatedVoterPage` already answer boolean/categorical/number opinion types natively (per-question scoped option-count loop).
- **A1 (OPERATOR OVERRIDE) — `--likert-only` removed COMPLETELY**, no shim, no fixture change. Pure deletion + doc-scrub. Rebuild `@openvaa/dev-seed` after.
- **Seed-data changes (SC4)** — perm templates land in 119 (dev-seed layer); spec phases only wire Playwright projects + setup/teardown + specs around them. Existing perm templates are named `perm-<name>.ts` under `packages/dev-seed/src/templates/e2e/perm/`.
- **NEW `perm-question-video`** (EPERM-06) — own `e2e-perm-qvid-` prefix; category-intros shown; 5-question / 3-category layout with `customData.video` on three *questions* only (q1, q3, q5), none on category intros. **Additive.**
- **NEW `perm-interactive-info`** (EPERM-07) — own prefix; one `interactiveInfo.enabled=true` (popup-modal) + one default (static-expander) question, PLUS `customData.infoSections` (≥1 question), `customData.arguments` on **three separate questions — one Likert/ordinal, one Boolean, one Categorical**. **Additive.**
- **RENAME + EXTEND `perm-header-show-feedback` → `show-feedback-survey`** (EPERM-09); set `results.showSurveyPopup=true`, `results.showFeedbackPopup`, `survey.showIn=['results']`. Update registry/index. **Additive.**
- **NEW `perm-org-matching`** (EPERM-10) — sets `matching.organizationMatching`, org with SOME own answers AND member candidates with answers on the questions the org leaves blank. Three modes re-seed the singleton. **Additive.**
- **CONSOLIDATE `perm-disable-voter-app` + `perm-disable-candidate-app` → one `perm-access-disable`** (EPERM-11) able to set `access.voterApp=false` / `candidateApp=false` / `underMaintenance=true`. **Additive.** (Old `*.spec.ts` deletion + project removal = Phase-120 half; 119 owns the TEMPLATE consolidation.)
- **`e2e/base` additive — `customData.terms`** (EPERM-07 NOTE): ADD to a question in the main `e2e/base` dataset.
- **`e2e/base` — EPERM-05 org missing-data:** default to additive (assert-only) if an existing party already lacks symbol/answer; making a party answer-incomplete is NON-ADDITIVE.

### Claude's Discretion

- The exact internal shape of each new helper (method signatures, where it hangs off an existing page-object vs a new fixture), as long as it typechecks, passes `no-restricted-locators`, and has a smoke/probe.
- The smoke/probe mechanism (standalone probe spec seeded via the dev-seed CLI + driven against the running app vs a minimal Playwright project) — pick the lightest approach proving prep steps + view manipulation without the out-of-scope full project wiring.
- The exact UNBLK-03 fix once the root cause is diagnosed.

### Deferred Ideas (OUT OF SCOPE)

- **Playwright project wiring + setup/teardown + spec files** — Phases 120 (EPERM), 121 (EFLOW), 122 (bank-auth).
- **Deferred-cluster fixtures** (multi-select / number-scale / MultipleText answering, alliance card/drawer readers, re-enabled nominations path) — Phase 129. Only cheap generic helpers land in 119.
- **`buildTestIdToken` shared-util extraction + Option-B mock OIDC issuer harness** — Phase 122 build implications (extraction flagged for research — see decision below).
- **New opinion-question-type seed additions + the 119.3 non-additive re-baselines** — Phase 129/130 (UNBLK-02/05), not 119.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UNBLK-03 | The default seed template (`yarn db:seed:default`) produces a valid dataset — parties present, candidates tab populated, consistent naming. | §UNBLK-03 Root-Cause Diagnosis (below); a running-app verification procedure is specified. The DB-write path is verified valid this session; the residual risk is a frontend-read symptom + the confirmed stale-docstring "inconsistent naming". |

## Standard Stack

This phase adds **no external packages.** It works entirely within the existing stack:

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `@playwright/test` | as installed (`tests/`) | E2E fixtures + probes | The project's E2E runner [VERIFIED: tests/playwright.config.ts] |
| `eslint-plugin-playwright` | installed | `no-restricted-locators` guard | Enforces behaviour-via-testid (A3) [VERIFIED: tests/eslint.config.mjs read] |
| `@openvaa/dev-seed` | workspace | template authoring + CLI | The seed layer; runs from source via `tsx` (no compiled `dist`) [VERIFIED: build "Nothing to build"] |
| `vitest` | catalog | dev-seed unit suite | `yarn workspace @openvaa/dev-seed test:unit` [VERIFIED: package.json] |
| `tsc` (tests project) | installed | `yarn typecheck:tests` | `tsc -p tests/tsconfig.json --noEmit` [VERIFIED: package.json:32] |

**Installation:** none — no `npm install` / `yarn add` in this phase.

## Package Legitimacy Audit

> Not applicable — Phase 119 installs **no external packages**. All work uses already-installed workspace deps (`@playwright/test`, `eslint-plugin-playwright`, `vitest`, `tsc`, `@openvaa/dev-seed`). No `package.json` dependency edits are expected.

## Architecture Patterns

### System Architecture Diagram

```
                         PHASE 119 DELIVERABLES (consumable substrate)
                         ┌───────────────────────────────────────────┐
  Frontend source        │  data-testid additions                    │
  (apps/frontend/src) ───┼─►  Video.svelte, EnumeratedEntityFilter,  │
                         │    QuestionExtendedInfoButton, Feedback/   │
                         │    SurveyPopup, About disclosure <p>       │
                         └──────────────┬────────────────────────────┘
                                        │ read via getByTestId(testIds.…)
  testIds registry        ┌─────────────▼──────────────┐
  (utils/testIds.ts) ─────►  central kebab-case map     │
                         └─────────────┬──────────────┘
                                        │
  Fixtures (views.ts      ┌─────────────▼──────────────────────────────┐
  base.extend root) ──────►  expectVideo / expectInfoMode / expectArgs   │
                         │   trackingIntercept / entityFilters.selectAll │
                         │   expectTheme / expectNavMenuItems / …        │
                         └─────────────┬──────────────────────────────┘
                                        │ each proven by
  Smoke/probe specs       ┌─────────────▼──────────────┐
  (standalone) ───────────►  seed template via CLI →    │
                         │   drive app → exercise helper │
                         └─────────────┬──────────────┘
                                        │
  dev-seed templates      ┌─────────────▼──────────────────────────────┐
  (templates/e2e/perm)────►  NEW perm-question-video / perm-interactive- │
                         │   info / perm-org-matching; RENAME header-    │
                         │   show-feedback→show-feedback-survey;         │
                         │   CONSOLIDATE access-disable; e2e/base +terms │
                         │   + registry (index.ts BUILT_IN_TEMPLATES)    │
                         └─────────────┬──────────────────────────────┘
                                        │ CLI --template <name> → pipeline → writer → Supabase RPC
  default.ts (UNBLK-03)   ┌─────────────▼──────────────┐
                         │  diagnose-in-app + min fix + │
                         │  docstring reconciliation     │
                         └────────────────────────────┘
```

### Recommended Work Structure (no new dirs)

```
tests/tests/
├── fixtures/
│   ├── voter/        # extend entityFilters.fixture.ts, resultsPage.fixture.ts; views.ts wiring
│   ├── shared/       # NEW trackingIntercept.fixture.ts; expectNavMenuItems reader
│   └── candidate/    # (no 119 work unless a candidate-side reader is needed)
├── utils/
│   └── voterNavigation.ts  # DELETE 4 dead helpers; scrub --likert-only NOTE
└── specs/_probes/    # NEW lightweight smoke/probe specs (discretion — keep out of perm chain)

packages/dev-seed/src/
├── templates/e2e/perm/   # NEW + RENAME + CONSOLIDATE perm templates
├── templates/e2e/base.ts # ADD customData.terms (+ EPERM-05 org slice if additive)
├── templates/index.ts    # registry edits (BUILT_IN_TEMPLATES + re-exports)
├── templates/default.ts  # UNBLK-03 docstring reconciliation + min fix
└── cli/likert-only.ts    # DELETE (+ seed.ts/help.ts/index.ts edits)
```

### Pattern 1: Fixture composition root (`base.extend` + factory)
**What:** New fixtures are exposed by extending the `views.ts` test object and wiring a `create<Name>(page)` factory.
**When to use:** any new voter-view fixture the specs destructure (`resultsPage`, `entityFilters`, …).
**Example:**
```ts
// Source: tests/tests/fixtures/voter/views.ts (VERIFIED read)
export const test = base.extend<ViewFixtures>({
  entityFilters: async ({ page }, use) => { await use(createEntityFilters(page)); },
  // NEW Phase-119 fixtures register the same way, e.g.:
  // trackingIntercept: async ({ page }, use) => { await use(await createTrackingIntercept(page)); },
});
```
Note: `trackingIntercept` joins the **shared** root, not the voter root — register where the shared fixtures (`feedbackDialog`, `langSelector`) are composed, or in `views.ts` if voter-only consumers.

### Pattern 2: `data-testid` via `testIds` registry + `getByTestId`
**What:** Every `data-testid` is declared in `tests/tests/utils/testIds.ts` (kebab-case, `testIds.<app>.<page>.<element>`) and read via `page.getByTestId(testIds.…)`. Raw `.locator()`/`getByText` is forbidden by the locator guard.
**Example:**
```ts
// Source: tests/tests/utils/testIds.ts (VERIFIED read) — existing reusable anchors
testIds.shared.navigation.menu       // 'nav-menu'
testIds.shared.navigation.menuItem   // 'nav-menu-item'  ← expectNavMenuItems hangs off this
testIds.shared.navigation.menuToggle // 'nav-menu-toggle' ← mobile-nav-open helper
testIds.voter.results.scoreGauge     // 'score-gauge'    ← org-match-score / expectSubMatch
testIds.voter.about.content          // 'voter-about-content' ← org-matching disclosure assertable here
```

### Pattern 3: Perm template authoring via `buildMinimal()`
**What:** Most perm templates are authored with `buildMinimal({ externalIdPrefix, candidates, opinionQuestions, customDataByQuestion, settingsOverlay, … })`.
**When NOT to use:** `buildMinimal` only emits **Likert-5 opinion + text info** questions, with a single `qc-opin`/`qc-info` category pair (`buildQuestionCategories()`). It **cannot** express EPERM-06's 5-question/3-category video layout or EPERM-07's Likert+Boolean+Categorical opinion mix. For those, EITHER extend `buildMinimal` (add multi-category + multi-type support) OR hand-author (analogs: `perm-2e-shared.ts`, `perm-startfromcg.ts` are hand-authored).
**Example:**
```ts
// Source: packages/dev-seed/src/templates/e2e/perm/perm-hide-hero.ts (VERIFIED read)
export const permHideHeroTemplate: Template = buildMinimal({
  externalIdPrefix: 'e2e-perm-hide-hero-',
  candidates: 1, opinionQuestions: 1, infoQuestions: 0,
  customDataByQuestion: { 'qu-opin-l5-1': { hero: '🗳️' } },  // ← customData on a question
  settingsOverlay: { candidateApp: { questions: { hideHero: true } } }
});
```

### Pattern 4: Registry registration (two edits per new template)
**What:** A new built-in template ships in two edits to `templates/index.ts`: (1) add to `BUILT_IN_TEMPLATES` map, (2) add a re-export. Perm keys stay FLAT (`'perm-question-video'`) even though files live under `e2e/perm/`. The CLI resolves `--template <name>` via `BUILT_IN_TEMPLATES` first, then falls through to filesystem-path resolution.
**Example:**
```ts
// Source: packages/dev-seed/src/templates/index.ts (VERIFIED read)
import { permQuestionVideoTemplate } from './e2e/perm/perm-question-video';
export const BUILT_IN_TEMPLATES = { …, 'perm-question-video': permQuestionVideoTemplate };
export { permQuestionVideoTemplate } from './e2e/perm/perm-question-video';
```

### Anti-Patterns to Avoid
- **Raw `.locator()` / `getByText()`** — rejected by `playwright/no-restricted-locators` (error). Only `getByTestId`/`getByRole` are allowed; locale-stable exceptions need an inline `// reason:` + `eslint-disable-next-line`.
- **Building a dark-mode toggle-click helper** — there is no toggle in the app; use `page.emulateMedia({ colorScheme })` (see Pitfall 1).
- **Asserting Video mount/unmount churn** — Video is NOT destroyed between page loads (`class:hidden={!hasContent}`); assert visibility, not attach/detach (EPERM-06 caveat, VERIFIED).
- **Authoring multi-type/multi-category perms via `buildMinimal` unchanged** — it only emits Likert-5 + text (Pattern 3).
- **Treating `--likert-only` mentions in `base.test.ts`/`dev-seed/README.md` as deletion targets** — those are the word "Likert"/"likert5" as question names, NOT the flag (false positives, see Pitfall 4).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Perm dataset authoring | A bespoke template literal per perm | `buildMinimal()` (`_helpers/buildMinimal.ts`) for Likert/text shapes | Handles election/CG/constituency/org/nomination wiring + JSONB-safe deep-merge + answer fill |
| Settings overlay merge | Manual object spread | `buildMinimal`'s `settingsOverlay` (deep-merge w/ undefined strip) | JSONB drops `undefined`; the helper strips it (Pitfall 9 in-file) |
| Test-id strings | Inline string literals in fixtures | `testIds.<app>.<page>.<element>` registry | Single source of truth between component + Playwright |
| Tracking payload capture | A custom network parser | `page.addInitScript` stubbing `window.umami.track` (the real emit seam) | The app emits via `window.umami.track`; stub it to capture (see Pitfall 5) |
| Dark-mode theme control | A toggle-click sequence | `page.emulateMedia({ colorScheme: 'dark' \| 'light' })` | Theme is `prefers-color-scheme`-driven only (Pitfall 1) |

**Key insight:** Almost every Phase-119 helper hangs off an existing fixture + an existing-or-new test-id; the heavy lifting (seeding, wiring, merge safety) is already solved by `buildMinimal` and the `views.ts`/`testIds` conventions. The genuinely-new mechanism is the `trackingIntercept` fixture and (for EPERM-06/07 perms) possibly a `buildMinimal` extension.

## UNBLK-03 Root-Cause Diagnosis (highest priority)

**Live evidence gathered this session (HIGH confidence):**

A clean `yarn db:reset && yarn db:seed:default` succeeded with this summary [VERIFIED: seed run output]:

| Table | Created |
|-------|---------|
| organizations | 8 |
| candidates | 327 |
| questions | 24 |
| nominations | 377 (327 candidate + 40 org + 10 alliance) |
| constituencies | 5 |
| app_settings | 1 |

DB inspection confirms [VERIFIED: psql queries]:
- All 8 parties present with correct names (`Blue Coalition` … `Values Coalition`), fanned out to en/fi/sv.
- **All 327 candidates answer all 24 questions** (`hideIfMissingAnswers.candidate:true` therefore does NOT hide them — they are fully answered).
- 327 candidate nominations distributed across 5 constituencies (80/74/66/59/48), all wired to the single election.
- `app_settings.settings` contains `results.sections: ['candidate','organization','alliance']` and `entities: { showAllNominations:true, hideIfMissingAnswers:{candidate:true} }`.

**Conclusion: the seed-WRITE path is valid today.** The June-6 todo (`.planning/todos/pending/2026-06-06-fix-broken-default-seed-template.md`) reported "0 parties / candidates tab empty / mixed naming" observed in the running app during Phase 101. The Phase-67 fix that added the full `results` block + `'alliance'` to `sections` (commits `ac46a2cbf`, `df6e17207`, 2026-04-30) **predates** that todo, so it did not resolve it. [VERIFIED: git show dates]

**Three candidate root causes the planner must triage IN THE RUNNING APP (UNBLK-03 SC3 requires running-app verification):**

1. **Frontend-read symptom (most likely residual).** The seed data is valid but a frontend results-render bug (since fixed or still latent) made parties/candidates not display. The decisive test: `yarn db:seed:default` → load `http://localhost:5173/en` → select a constituency → answer ≥5 questions → open `/results` → confirm the **parties tab renders parties** and **the candidates tab is populated**. If this passes, UNBLK-03's symptoms 1–2 are already resolved and the phase work is reduced to the confirmed naming fix (below) + documenting the running-app verification as the close gate.
2. **`hideIfMissingAnswers.candidate:true` interaction (lower risk).** `default.ts` writes `entities.hideIfMissingAnswers.candidate:true`; `e2e/base` (the known-good template) writes `false` and `matching.minimumAnswers:5`. Because the shallow-by-root-key merge (`mergeAppSettings`, VERIFIED) only REPLACES keys default.ts writes and falls back to TS dynamicSettings defaults otherwise, `default.ts` inherits `matching.minimumAnswers:5` and `entityDetails.contents` from the TS defaults. With all candidates fully answered this should not hide anything — but if a future seed leaves any candidate under-answered, this flag would empty the tab. Recommend the fix set `hideIfMissingAnswers.candidate:false` in `default.ts` to match the known-good `e2e/base` posture (defensive, removes the symptom class).
3. **"Inconsistent naming" (CONFIRMED — symptom 3).** `default.ts`'s module docstring is stale: it claims "13 constituencies", "100 candidates", "24 questions (18 ordinal + 5 categorical + 1 boolean)" while the body emits **5 constituencies, 327 candidates** (`candidates.count:327`, `PARTY_WEIGHTS` sum 327) and the questions-override TYPE_PLAN is **18 ordinal + 5 categorical + 1 boolean** (the question split IS accurate, the candidate/constituency counts in the docstring are NOT). [VERIFIED: default.ts + candidates-override.ts + questions-override.ts reads]. The todo's "mixed naming of constants" refers to this docstring/body drift and the divergence from `e2e/base`'s `test-e2e-base-*` external-id convention vs default's `seed_*` / `party_*` / `c_0N` / `cat_*` mix. **Minimal fix:** reconcile the docstrings to the actual emitted counts and (optionally) note the external-id convention explicitly. This is the only part of UNBLK-03 that is unambiguously still broken.

**Recommended minimal fix (pending running-app triage):**
- Reconcile `default.ts` docstrings (counts) — REQUIRED (confirmed symptom 3).
- Set `entities.hideIfMissingAnswers.candidate:false` in `default.ts` app_settings — RECOMMENDED (defensive; matches `e2e/base`).
- If the running-app check still shows empty parties/candidates: bisect the frontend results path (the bug is in the shared render path or the default-specific app_settings shape) — escalate as a real fix, not just docstrings.
- **Verification (running-app, the SC3 gate):** `yarn db:reset && yarn db:seed:default` → load app → select constituency → answer ≥5 → `/results` → assert parties present + candidates tab populated + names consistent.

## `--likert-only` Deletion Surface (verified against live code)

The deletion-surface table in the coverage plan is **ACCURATE**. Verified per-file [VERIFIED: grep + reads]:

| File | Action | Verified |
|------|--------|----------|
| `packages/dev-seed/src/cli/likert-only.ts` | DELETE | exists |
| `packages/dev-seed/tests/cli/likert-only.test.ts` | DELETE | exists |
| `packages/dev-seed/src/cli/seed.ts` | remove import (line 34), flag parse (line 65 `'likert-only': {type:'boolean'}`), the `if (values['likert-only'])` block (lines 85–98) | confirmed |
| `packages/dev-seed/src/cli/help.ts` | remove `--likert-only` help line | confirmed (grep hit) |
| `packages/dev-seed/src/index.ts` | remove `applyLikertOnlyFilter` export (line 50) + `LikertOnlyFilterStats` type export (line 74) | confirmed |
| `packages/dev-seed/tests/cli/help.test.ts` | update expected help text (drop the `--likert-only` line) | confirmed (grep hit) |
| `tests/tests/utils/voterNavigation.ts` | remove the `--likert-only` NOTE comment | confirmed (grep hit) |
| `tests/tests/setup/shared/setupFromTemplate.ts` | drop the `likertOnly` "not supported" docstring paragraph | confirmed (grep hit) |
| `CLAUDE.md` | remove the "Note on `--likert-only`" + "Yarn arg-forwarding caveat" paragraphs + the seeding-table row | confirmed (grep hit) |
| `tests/README.md` | scrub `--likert-only` mentions | confirmed (grep hit) |
| `packages/dev-seed/README.md` | scrub `--likert-only` mentions | **NO `--likert-only` matches found** — the only "Likert" hit (line 83) is the question-mix description ("18 ordinal Likert"), NOT the flag. The plan listed this file but it has nothing to scrub. [VERIFIED: grep] |

**Unit tests referencing the flag:** ONLY `packages/dev-seed/tests/cli/likert-only.test.ts` (delete) and `packages/dev-seed/tests/cli/help.test.ts` (update). `packages/dev-seed/tests/templates/base.test.ts:95` references `qu-opin-base-1-likert5` (a question external_id, NOT the flag) — **do NOT touch it**. [VERIFIED: grep context]

**Post-removal:** rebuild `@openvaa/dev-seed`. NOTE: dev-seed runs from source via `tsx` and `yarn build --filter=@openvaa/dev-seed` reports "Nothing to build" (no `dist` exports), so the "rebuild removes dist exports" concern is moot here — but run `yarn workspace @openvaa/dev-seed test:unit` to confirm the suite stays green after deletion.

## `voterNavigation.ts` Hygiene Deletion (grep-verified caller map)

[VERIFIED: grep across `tests/tests/{specs,fixtures,setup,utils}`]

| Helper | Callers (outside voterNavigation.ts) | Disposition |
|--------|--------------------------------------|-------------|
| `walkToQuestion` | **ZERO** | DELETE |
| `waitForNextQuestion` | **ZERO** | DELETE |
| `clickThroughIntroPages` | **ZERO** | DELETE |
| `walkToQuestionsIntro` | **ZERO** external; called only internally by `walkToQuestion` (line 335) | DELETE (the 4 form a self-contained dead cluster — `walkToQuestion`→`walkToQuestionsIntro`; deleting all four together leaves no dangling ref) |
| `navigateToFirstQuestion` | **USED** by `perm-hide-category-tags.spec.ts`, `perm-hide-election-tags.spec.ts`, `perm-hide-if-missing-answers.spec.ts` (comment ref), `perm-disable-allow-open.spec.ts` (comment ref), and `minimalVoterResultsPage.fixture.ts:53` | **KEEP** |

**Re-verify zero callers at execution time** (CONTEXT.md hard rule) — a spec written between now and execution could add a caller.

## New `data-testid` Additions in Production Source

For each helper that needs a test-id [VERIFIED: component reads]. Naming convention: kebab-case, declared in `testIds.ts`. Components currently emit ids via explicit `data-testid="…"` attributes (and `Video.svelte` spreads `restProps` onto its root div via `concatClass`, so a passed-through `data-testid` would also land there).

| Helper need | Component (file) | Existing test-id? | Action |
|-------------|------------------|-------------------|--------|
| Generic Video reader (EPERM-06) | `apps/frontend/src/lib/components/video/Video.svelte` — root `<div>` line 655, `class:hidden={!hasContent}` line 660 | **NO** | ADD a generic `data-testid` on the root `<div>` (NOT the hero `<figure>`). Element is hidden-not-destroyed → `expectVideo(true)` = `toBeVisible()`, `expectVideo(false)` = `not.toBeVisible()`. Caveat VERIFIED. |
| Interactive-info popup mode (EPERM-07) | `apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte` (popup, line 240 in questions `+layout.svelte`) vs `QuestionBasicInfo.svelte` (expander, has `voter-questions-info-button`) | popup: **NO**; expander: yes (`voter-questions-info-button`) | ADD a popup-mode test-id on `QuestionExtendedInfoButton` (+ on the opened modal/dialog body). NOTE: info button only renders when `!customData.video` (layout line 237). |
| Arguments reader (EPERM-07) | `apps/frontend/src/lib/components/questions/QuestionArguments.svelte` — groups by `choiceId` for categorical (line 59) | **NO** | ADD per-argument / per-group test-id(s); categorical groups by `choiceId` (`question.getChoice(choiceId)`). |
| InfoSections reader (EPERM-07) | `QuestionExtendedInfo.svelte` (uses `Expander`, lines 56/68) | **NO** | ADD a test-id per section (title + html content). |
| Terms trigger (EPERM-07, e2e/base) | `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` (`addTermsToTitle`, line 61; renders `Term` component) + `apps/frontend/src/lib/components/term/Term.svelte` (definition popup) | **NO** | ADD test-id on the in-text term trigger + the definition popup. |
| Survey/feedback popup (EPERM-09) | `apps/frontend/src/lib/dynamic-components/{feedback/popup/FeedbackPopup.svelte, survey/popup/SurveyPopup.svelte}` | **NO** (neither has a test-id) | ADD distinct test-ids to FeedbackPopup + SurveyPopup roots (for dismiss-and-reload persistence assertions). |
| Org-match-score readout (EPERM-10) | results card uses `MatchScore` (`EntityCard.svelte:49`); existing `score-gauge` test-id (`testIds.voter.results.scoreGauge`) | partial (`score-gauge` exists) | REUSE `score-gauge` where it suffices; ADD an org-card-scoped readout test-id only if the org match-score needs distinguishing from candidate gauges. |
| About-page disclosure (EPERM-10) | `apps/frontend/src/routes/(voters)/about/+page.svelte` — org-matching block (lines 54–57) inside `voter-about-content` (line 50) | partial (`voter-about-content` exists) | The disclosure text is already assertable via `voter-about-content`; ADD a dedicated test-id on the `about.organizationMatching.content` `<p>` for a tighter assertion. |
| Nav-menu items (EFLOW-09) | `Navigation.svelte` (`nav-menu`, line 58), `NavItem.svelte` (`nav-menu-item`, line 74) | **YES** | REUSE `testIds.shared.navigation.menu`/`menuItem` — `expectNavMenuItems` needs no new id. |
| Mobile hamburger (EFLOW-11) | `Header.svelte` (`nav-menu-toggle`, line 85) | **YES** | REUSE `testIds.shared.navigation.menuToggle` — mobile-nav-open helper needs no new id. |
| Filter select-all/none (EFLOW-01) | `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` — `toggleSelectAll()` button line 221, rendered only `{#if values.length > 3}` (line 219) | **NO** | ADD a test-id on the toggle button. **THRESHOLD CONFIRMED: > 3 options** (single toggle button, text flips `selectAll`/`unselectAll` via `allSelected`). The seeded categorical filter must have ≥4 options to surface it. [VERIFIED] |
| Dark-mode theme (EFLOW-07) | n/a — NO toggle exists | **N/A** | NO toggle to add a test-id to. `expectTheme` asserts via `page.emulateMedia` + a rendered dark-mode CSS signal (see Pitfall 1). |

## Fixtures / Helpers Inventory + Conventions

For each NEW Phase-119 helper [grounded in VERIFIED reads]:

| Helper (CONTEXT.md) | Hangs off | Convention / anchor |
|---------------------|-----------|---------------------|
| `expectVideo(present)` (EPERM-06) | new generic reader; usable from voter + candidate roots | reads the new Video test-id via `getByTestId`; assert `toBeVisible()` |
| `expectInfoMode(q,'popup'\|'expander')`, `expectInfoSections`, `expectArguments(q,type)` (EPERM-07) | new readers; can ride a small `questionInfo` fixture or hang off `voterQuestionsPage.fixture.ts` | popup → modal/dialog test-id; expander → existing `voter-questions-info-button`; arguments → new per-group test-ids (categorical grouped by `choiceId`) |
| survey/feedback popup handle + dismiss-and-reload (EPERM-09) | shared (rides `feedbackDialog.fixture.ts` neighbour) | reads new FeedbackPopup/SurveyPopup test-ids; reload via `page.reload()` |
| org-match-score readout + About-disclosure handle (EPERM-10) | `resultsPage.fixture.ts` (score readout) + a small About reader | reuse `score-gauge`; About via `voter-about-content` (+ optional new disclosure id) |
| `entityFilters.selectAll() / selectNone()` (EFLOW-01) | **EXTEND `tests/tests/fixtures/voter/entityFilters.fixture.ts`** (the `createFilter` returned object already has `setSelection`/`getFilter`) | add a method clicking the new toggle button; note the single-toggle semantics (not separate all/none) |
| `expectSubMatch(category,score)` (EFLOW-04, optional) | `resultsPage.fixture.ts` | reads `sub-matches` / `score-gauge` test-ids |
| dark-mode toggle handle + `expectTheme` (EFLOW-07) | new shared reader | **use `page.emulateMedia({colorScheme})`** — NOT a toggle (Pitfall 1) |
| `trackingIntercept` (EFLOW-08) | **NEW `tests/tests/fixtures/shared/trackingIntercept.fixture.ts`** | captures `window.umami.track` calls (see §Tracking Emission Boundary); exposes `getTrackCalls()` |
| `expectNavMenuItems([...])` (EFLOW-09, optional) | shared reader | reuse `nav-menu` + `nav-menu-item` |
| mobile-nav-open helper (EFLOW-11) | shared | reuse `nav-menu-toggle` |

**Composition root:** register voter-scoped fixtures in `tests/tests/fixtures/voter/views.ts` (`base.extend<ViewFixtures>`); register cross-app fixtures (`trackingIntercept`, `expectNavMenuItems`, dark-mode) in the shared composition path. [VERIFIED: views.ts read]

## Tracking Emission Boundary (EFLOW-08)

[VERIFIED: trackingService.type.ts, trackingService.svelte.ts, +layout.svelte, UmamiAnalytics.svelte]

- `TrackingService` exposes `track`, `startEvent`, `startPageview`, `submitAllEvents`, plus rune handles `sendTrackingEvent` (writable handler), `shouldTrack` (read-only gate), `sessionId`.
- **All event data is routed via `track` when submitted** (type-doc) → the boundary to capture is the single handler in `sendTrackingEvent.current`.
- **The handler is Umami.** `+layout.svelte:152` does `sendTrackingEvent.set(umamiRef.trackEvent)`; `UmamiAnalytics.svelte`'s `sendUmamiEvent` calls `window.umami.track(name, data)` (guarded by `'umami' in window`). The Umami component mounts only when `appSettings.analytics.platform` is set, and loads the external script `https://cloud.umami.is/script.js`.
- **`shouldTrack` gate** = `browser && appSettings.analytics.trackEvents && userPreferences.dataCollection.consent === 'granted'` [VERIFIED: trackingService.svelte.ts:121].

**Recommended `trackingIntercept` design:** `page.addInitScript` to define `window.umami = { track: (name, data) => (window.__trackCalls ||= []).push({name, data}) }` BEFORE navigation, so the app's `sendUmamiEvent` captures into `window.__trackCalls`; `getTrackCalls()` reads it via `page.evaluate`. **Prerequisite:** the fixture must arrange (a) `analytics.platform='umami'` + `analytics.trackEvents=true` (so `UmamiAnalytics` mounts AND `shouldTrack` can be true) and (b) consent granted in `userPreferences` (so `shouldTrack===true`). Without these, `sendTrackingEvent` is never wired and nothing emits. The consent-suppression case (assert NO emit) is exercised by leaving consent ungranted. NOTE: stubbing `window.umami` avoids any real network to `cloud.umami.is` (cardinal-rule safe). `default`/perm seeds set `analytics` via `app_settings` settings overlay; staticSettings default is `analytics.trackEvents:false`.

## `customData` Seed Shapes (EPERM-06/07)

[VERIFIED: packages/app-shared/src/data/customData.type.ts read]

```ts
// VideoContent — sits on BOTH Question.video AND QuestionCategory.video (CONFIRMED: both keys present)
type VideoContent = {
  title: string;
  sources: Array<string>;   // e.g. ['…/video.webm','…/video.mp4']
  captions: string;         // VTT url
  poster: string;           // image url
  aspectRatio: number;      // required for sizing pre-load
  transcript?: string;      // optional HTML
};

// infoSections — Question.infoSections
type QuestionInfoSection = { title: string; content: string /* html */ };

// arguments — Question.arguments: Array<QuestionArguments>
type QuestionArguments = { arguments: Array<Argument>; type: ArgumentType; choiceId?: Id /* categorical grouping */ };
type Argument = { id?: string; content: string };
// ArgumentType — imported from './argumentType' (ARGUMENT_TYPE enum incl. *Pros/*Cons per Likert/Boolean/Categorical;
//   QuestionArguments.svelte uses ARGUMENT_TYPE.BooleanCons / LikertCons for ordering). The seed must populate
//   one QuestionArguments per opinion type (Likert/Boolean/Categorical), with choiceId set for the categorical carrier.

// terms — Question.terms: Array<TermDefinition>
type TermDefinition = { triggers: Array<string>; title?: string; content: string };
```
**Confirmed:** `customData.video` can sit on a `Question` AND a `QuestionCategory` (both declared in `CustomData['Question']` and `CustomData['QuestionCategory']`). The EPERM-06 perm deliberately seeds video on questions only (none on category intros). The frontend gates the question info button on `!customData.video` (questions `+layout.svelte:237`) — i.e. a question with video shows the video instead of the info button.

## `e2e/base` Org Rows (EPERM-05 additive vs non-additive)

[VERIFIED: base.ts:458–502 + answer rows read]

- 5 organizations: `or-aa`, `or-ab`, `or-ba`, `or-bb`, `or-c`. None carry an own `answersByExternalId` and none carry an `election_symbol` on the org entity (symbols live on nominations). Org match scores derive from member candidates via imputation.
- For the org-typed `showMissingAnswers.organization` / `showMissingElectionSymbol.organization` markers to render, an org needs member candidates that leave a question blank (missing answer) and/or a nomination lacking an election symbol.
- **Recommendation (default to additive):** confirm at build whether an existing org already has a member candidate leaving a question blank AND/OR a symbol-less nomination — if so, the EPERM-05 org slice is **additive/assert-only** (zero seed change). Only if no org qualifies must a party be made answer-incomplete, which is **NON-ADDITIVE** (shifts org card counts the journey asserts ~lines 749–781). The 119 default is additive; making a party answer-incomplete is a flagged non-additive escalation owned at 120 build time (per the build-list block) — 119 only lands the additive `customData.terms` change to base for certain.

## `buildTestIdToken` Extraction Decision (EFLOW-10b)

[VERIFIED: candidate-bank-auth.spec.ts:40–115 read]

`buildTestIdToken(claims, sigPriv, encPubJwk)` is a clean, self-contained async function (builds a signed inner JWT then JWE-encrypts via `jose`), but it depends on the spec-local `generateTestKeys()` helper for its key material. **Recommendation: LEAVE IT IN PHASE 122.** Rationale: (1) there is **no Phase-119 consumer** — the only second consumer (the Option-B mock OIDC issuer) is itself a Phase-122 deliverable; (2) the plan explicitly tags this a "Phase-122 build implication," and the default is to leave it in 122 unless the extraction is clean AND cheap with a 119 consumer. Extracting it into a shared util in 119 would create a util with zero callers until 122. Defer to 122, where the mock issuer and the retargeted Edge-Function spec both consume it.

## Smoke / Probe Mechanism (SC2)

[Discretion — grounded in serial-DAG + perm-singleton facts]

**Recommended lightest approach:** a standalone probe spec per new fixture under e.g. `tests/tests/specs/_probes/` (kept OUT of the perm serial chain), that:
1. Seeds the relevant template via the dev-seed CLI directly (`yarn db:seed --template <name>`), NOT via the serial-DAG `data-setup-*` machinery.
2. Drives the running app and exercises the helper's preparatory steps + view manipulation end-to-end.
3. Asserts the helper's observable effect (e.g. `expectVideo(true)` on a video question).

**Critical caveat (perm-singleton clobber):** perm templates set the **shared `app_settings` JSONB singleton** (single DB, no interleave). A probe that seeds a perm template clobbers `app_settings` for any concurrently-running test. The serial-DAG normally serializes this; a standalone probe MUST run in isolation (its own run, or `fullyParallel:false` if wired). The lightest fully-isolated form: a dev-seed CLI seed of the perm template, then a single-file Playwright run against the app — without adding the out-of-scope project/setup/teardown wiring. Probes need not be deterministic-to-3× (that is the spec phases' bar) but should pass cleanly once.

## Common Pitfalls

### Pitfall 1: Dark mode has no toggle and no persistence (EFLOW-07 premise is wrong)
**What goes wrong:** Building a dark-mode helper that clicks a toggle button and asserts a localStorage-persisted theme — neither exists.
**Why it happens:** CONTEXT.md/CLAUDE.md state "theme persisted via runeLocalStorage" and "the toggle is a UI affordance." This is FALSE for the current app.
**How to avoid:** `darkMode.svelte.ts` derives state SOLELY from `window.matchMedia('(prefers-color-scheme: dark)')` with a `change` listener; there is no setter and no localStorage write. Build `expectTheme` around `page.emulateMedia({ colorScheme: 'dark' | 'light' })` and assert a rendered dark-mode signal. "Persisted across reload" is automatic (the media preference persists). **Flag this to the planner so EFLOW-07's Phase-121 spec scope is corrected too.**
**Warning signs:** searching for a toggle test-id returns nothing; `grep darkMode.set` returns no app callers.

### Pitfall 2: `buildMinimal` only emits Likert-5 + text (EPERM-06/07 need more)
**What goes wrong:** Authoring `perm-question-video` (5 questions / 3 categories) or `perm-interactive-info` (Likert+Boolean+Categorical) via `buildMinimal` produces only Likert-5 opinion + text info in a single category pair.
**Why it happens:** `buildMinimal` hardcodes `type:'singleChoiceOrdinal'` opinion + `type:'text'` info, with `buildQuestionCategories()` returning one `qc-opin` + one `qc-info`.
**How to avoid:** EITHER extend `buildMinimal` (add `opinionQuestionTypes[]` + multi-category support + per-question customData — already supported via `customDataByQuestion`) OR hand-author these two templates (analogs: `perm-2e-shared.ts`, `perm-startfromcg.ts`). Recommend extending `buildMinimal` if the change is small, else hand-author.
**Warning signs:** the seeded perm shows only Likert questions / a single category.

### Pitfall 3: A renamed/consolidated template touches 5 surfaces split across 119/120
**What goes wrong:** Renaming `perm-header-show-feedback` → `show-feedback-survey` or consolidating the two access perms breaks if not all surfaces move together.
**Why it happens:** Each perm name appears in: the template file, `templates/index.ts` (map + re-export), `tests/tests/setup/perm/<name>.{setup,teardown}.ts`, `tests/playwright.config.ts` (project + setup + teardown nodes), and the `*.spec.ts`. **119 owns the template + registry; the setup/teardown + playwright project + spec are 120.** The dev-seed unit suite (`tests/templates/*.test.ts`) may assert on template names.
**How to avoid:** In 119, rename ONLY the template file + registry entry/key + re-export + any dev-seed unit-test reference, keeping the dev-seed suite green. Document the 120-side surfaces (setup/teardown/project/spec) for the spec phase. For the consolidation, author the new `access-disable` template + register it; the two old per-app TEMPLATES can stay registered until 120 deletes their specs/projects (or remove them in 119 if nothing else references them — verify no setup/spec still imports them first).
**Warning signs:** CLI `--template perm-show-feedback-survey` resolves but a setup file still imports the old name; dev-seed unit test asserts the old key.

### Pitfall 4: False-positive `--likert-only` / "Likert" matches
**What goes wrong:** Deleting/editing `packages/dev-seed/README.md:83` or `tests/templates/base.test.ts:95` thinking they reference the flag.
**Why it happens:** Both contain "Likert"/"likert5" as a question-mix description / question external_id, NOT the `--likert-only` flag.
**How to avoid:** Scrub only `--likert-only` / `applyLikertOnlyFilter` / `LikertOnlyFilterStats` / `likertOnly` tokens; leave plain "Likert" alone.

### Pitfall 5: trackingIntercept captures nothing because tracking is gated off
**What goes wrong:** The intercept fixture sees zero `track` calls.
**Why it happens:** `sendTrackingEvent` is only wired when `analytics.platform` is set (UmamiAnalytics mounts), and `shouldTrack` needs `analytics.trackEvents===true` + consent `granted`. Default staticSettings has `analytics.trackEvents:false`.
**How to avoid:** Seed `analytics.platform='umami'` + `analytics.trackEvents=true` via app_settings, grant consent in userPreferences, and stub `window.umami.track` via `addInitScript` before navigation. Use the consent-ungranted state for the suppression assertion.

### Pitfall 6: UNBLK-03 "fixed" without running-app verification
**What goes wrong:** Reconciling docstrings and declaring UNBLK-03 done, when the running-app symptom (empty parties/candidates) may still exist or may already be gone.
**Why it happens:** The DB-write path is valid today, so a unit/DB assertion passes regardless.
**How to avoid:** SC3 requires a running-app check. Load the app post-seed, select a constituency, answer ≥5, open `/results`, and confirm parties + candidates render. Only then close UNBLK-03.

## Runtime State Inventory

> Phase 119 is primarily a code/seed/tooling change, but it includes a rename (`perm-header-show-feedback` → `show-feedback-survey`) and a consolidation (two access perms → one). The relevant runtime state:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | dev-seed writes to the **shared `app_settings` JSONB singleton** + entity tables per template. Perm seeds clobber the singleton (single DB). Default seed writes 750 rows. | Code/seed edits only; no migration of existing records (templates re-seed from scratch). |
| Live service config | None — no external service config embeds the renamed template names. | None — verified by scope (renames are in-repo template/registry keys). |
| OS-registered state | None. | None. |
| Secrets/env vars | None for 119 (tracking-intercept stubs `window.umami`, no real Umami key; bank-auth env is 122). | None. |
| Build artifacts | `@openvaa/dev-seed` runs from source via `tsx` (no `dist`); `yarn build --filter=@openvaa/dev-seed` reports "Nothing to build". | Run `yarn workspace @openvaa/dev-seed test:unit` after `--likert-only` deletion to confirm green; no dist reinstall needed. |

**The canonical question — after every file is updated, what runtime systems still have the old string?** The renamed/removed template KEYS (`perm-header-show-feedback`, `perm-disable-voter-app`, `perm-disable-candidate-app`, `--likert-only`) live ONLY in the dev-seed registry, CLI, and (for the renames) the 120-owned setup/playwright/spec files — there is no DB-stored or OS-registered copy. The dev-seed unit suite asserts some template behaviour and is the green gate.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (`@playwright/test`) for fixtures/probes; Vitest for dev-seed unit suite |
| Config file | `tests/playwright.config.ts` (read-only in 119); `packages/dev-seed/vitest.config.ts` (implied) |
| Quick run command | `yarn typecheck:tests` (tsc) + `node_modules/.bin/eslint --flag v10_config_lookup_from_file tests` (locator guard) |
| Full suite command | `yarn workspace @openvaa/dev-seed test:unit` (dev-seed green gate); standalone probe specs run per-fixture |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|--------------|
| SC1 | Every new fixture typechecks + passes locator guard | static | `yarn typecheck:tests` + eslint on `tests/` | ✅ infra exists |
| SC2 | Each new fixture has a smoke/probe | e2e probe | per-fixture probe spec: `npx playwright test tests/tests/specs/_probes/<name>.probe.spec.ts -c tests/playwright.config.ts` | ❌ Wave 0 (probe specs to author) |
| UNBLK-03 / SC3 | Default seed valid in running app | manual+e2e | `yarn db:reset && yarn db:seed:default` → load app → constituency → answer ≥5 → `/results` parties+candidates present | ❌ Wave 0 (verification step) |
| SC4 | Seed changes landed + dev-seed unit suite green | unit | `yarn workspace @openvaa/dev-seed test:unit` | ✅ suite exists; update help.test.ts |

### Sampling Rate
- **Per task commit:** `yarn typecheck:tests` + the dev-seed unit suite when seed files change.
- **Per fixture:** its smoke/probe passes once cleanly.
- **Phase gate:** dev-seed unit suite green + `yarn typecheck:tests` green + locator-guard green + UNBLK-03 running-app check passes + each new fixture's probe green.

### Wave 0 Gaps
- [ ] `tests/tests/specs/_probes/*.probe.spec.ts` — one smoke/probe per new fixture (SC2). No probe-spec convention exists yet; establish a lightweight one (CLI-seed + drive-app, outside the perm serial chain).
- [ ] UNBLK-03 running-app verification procedure (manual or a one-off probe) — SC3 requires running-app, not DB/unit.
- [ ] `packages/dev-seed/tests/cli/help.test.ts` — update expected help text after `--likert-only` removal.
- [ ] (If `buildMinimal` is extended for EPERM-06/07) extend `_helpers/buildMinimal.test.ts` for the new option(s).

*(Dev-seed unit infrastructure already exists and is comprehensive — `tests/templates/*.test.ts`, `tests/cli/*.test.ts`, `tests/generators/*.test.ts`. The gaps are the new probe specs + the help-test update.)*

## Security Domain

> `security_enforcement` is not explicitly set in `.planning/config.json` (treated as enabled). Phase 119 is test-infra + seed tooling with NO authentication, session, access-control, or cryptography surface of its own (bank-auth JWE/JWKS is Phase 122). The tracking-intercept stubs `window.umami` (no real key, no real network). No new ASVS-relevant attack surface is introduced.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | (bank-auth is Phase 122) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no (no user input surface added) | — |
| V6 Cryptography | no | — |

**Project security note (CLAUDE.md):** never commit secrets; the tracking-intercept must NOT embed a real Umami website key (stub `window.umami` instead). WCAG 2.1 AA still applies to any test-id additions (test-ids are non-visual; no a11y impact).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `--likert-only` CLI filter shim for non-ordinal opinion types | Fixtures answer all opinion types natively (per-question scoped option-count loop) | v2.13/v2.14 | The flag is dead code; remove completely (A1) |
| `apps/frontend/tests/` E2E path (stale in some docs) | repo-root `tests/` | (already migrated) | Use `tests/tests/**` paths |
| Page-Object spec pattern (`index.ts` root) | Function-fixture pattern (`views.ts` `base.extend` root) | ongoing | New fixtures use the `views.ts` composition root |

**Deprecated/outdated:**
- The CONTEXT.md/CLAUDE.md claim that dark mode is "a UI affordance persisted via runeLocalStorage" — NOT true in the current app (prefers-color-scheme only).
- `default.ts` docstrings (counts) — stale vs the emitted dataset.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UNBLK-03 symptoms 1–2 (empty parties/candidates) may already be resolved in the running app (data is valid in DB) | UNBLK-03 Root-Cause | If still broken in-app, the fix is larger than docstring reconciliation — a frontend results-path bisect is needed. Mitigation: SC3 mandates a running-app check before closing. |
| A2 | `expectTheme` via `page.emulateMedia` is sufficient for EFLOW-07 (no toggle exists) | Pitfall 1 | If a dark-mode toggle is intended as a NEW product feature, EFLOW-07 would need a frontend toggle first (out of 119 scope) — escalate to operator. The current app has no toggle (VERIFIED). |
| A3 | The org-typed EPERM-05 markers can be made additive (some org already qualifies) | e2e/base Org Rows | If no org qualifies, making one answer-incomplete is NON-ADDITIVE and ripples journey counts — but this is owned at 120 build time, not 119; 119 only lands `customData.terms` for certain. |
| A4 | Extending `buildMinimal` for EPERM-06/07 is preferable to hand-authoring | Pitfall 2 | If the extension balloons, hand-authoring (per `perm-2e-shared` analog) is the fallback — either path is viable. |
| A5 | `analytics` settings can be seeded via the `app_settings` settings overlay to arm tracking | Tracking Boundary | If `analytics` is a static-only setting not overridable via dynamic app_settings, the intercept must arm it another way (e.g. addInitScript setting userPreferences). staticSettings holds `analytics`; dynamic override path needs build-time confirmation. |

## Open Questions

1. **Is the UNBLK-03 running-app symptom still present?**
   - What we know: DB seed-write is valid today (8 parties, 327 fully-answered candidates, 377 noms). Docstrings are stale (confirmed naming bug).
   - What's unclear: whether the June-6 "empty parties/candidates" symptom still reproduces in the live UI.
   - Recommendation: run the SC3 running-app procedure FIRST; if it passes, scope UNBLK-03 to docstring reconciliation + defensive `hideIfMissingAnswers:false`; if it fails, bisect the frontend results path.

2. **Can `analytics.trackEvents` / `analytics.platform` be overridden via dynamic `app_settings`?**
   - What we know: `analytics` lives in staticSettings (`trackEvents:false`); `mergeAppSettings` is shallow-by-root-key over static∪dynamic∪DB.
   - What's unclear: whether a dynamic `app_settings.analytics` override propagates to `appSettings.analytics.trackEvents` at runtime (the `shouldTrack` gate reads `appSettings.current.analytics.trackEvents`).
   - Recommendation: confirm at build by seeding `analytics` in a probe and checking `shouldTrack`. Fallback: arm via `addInitScript` + a granted-consent userPreferences seed.

3. **`buildMinimal` extension vs hand-authoring for EPERM-06/07 perms.**
   - What we know: `buildMinimal` is Likert/text-only, single category pair.
   - Recommendation: prototype a minimal `buildMinimal` extension; if it stays small, prefer it; else hand-author.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase | seed runs, UNBLK-03 verification, probes | ✓ | CLI v2.83.0 (running) | — |
| Frontend dev server (5173) | running-app verification, probes | ✓ (this repo, feat-gsd-roadmap) | — | `yarn dev` |
| `psql` | DB inspection (research) | ✓ | — | Supabase Studio @ 54323 |
| Playwright browsers | probe specs | assumed (suite runs) | — | `yarn playwright install` |
| `@openvaa/dev-seed` (tsx) | seeding | ✓ (source-run) | workspace | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none material — all required tooling is present.

## Sources

### Primary (HIGH confidence)
- Live code reads this session: `packages/dev-seed/src/templates/{default.ts, index.ts, e2e/base.ts, e2e/perm/perm-hide-hero.ts, defaults/*-override.ts, _helpers/buildMinimal.ts}`; `tests/tests/fixtures/voter/views.ts`; `tests/tests/utils/{testIds.ts, voterNavigation.ts}`; `tests/eslint.config.mjs`; `apps/frontend/src/lib/components/video/Video.svelte`; `apps/frontend/src/lib/contexts/app/tracking/{trackingService.type.ts, trackingService.svelte.ts}`; `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts`; `apps/frontend/src/lib/components/analytics/umami/UmamiAnalytics.svelte`; `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte`; `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte`; `apps/frontend/src/routes/(voters)/about/+page.svelte`; `packages/app-shared/src/data/customData.type.ts`; `packages/app-shared/src/settings/dynamicSettings.ts`; `apps/frontend/src/lib/utils/settings.ts`; `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:40–115`.
- Running-app evidence: `yarn db:reset && yarn db:seed:default` run + psql DB inspection (organizations, app_settings, candidate answer coverage, nomination wiring).
- `git show` commit dates (Phase 67 vs the June-6 todo).

### Secondary (MEDIUM confidence)
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` (operator-approved build list + cross-cutting findings).
- `.planning/phases/119-e2e-fixtures-helpers-seed/119-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/todos/pending/2026-06-06-fix-broken-default-seed-template.md`.

### Tertiary (LOW confidence)
- None — all factual claims are tool-verified or cited from approved planning docs.

## Metadata

**Confidence breakdown:**
- Fixture/test-id/dev-seed conventions: HIGH — every claim from a file read this session.
- UNBLK-03: HIGH on the diagnosis (DB-write valid, naming-drift confirmed); MEDIUM on whether the running-app symptom persists (must be verified live in the phase — SC3).
- `--likert-only` + voterNavigation deletion surfaces: HIGH — grep-verified per file, plan corrected (README.md has nothing to scrub).
- Tracking boundary + dark-mode: HIGH — emit seam (`window.umami.track`) and prefers-color-scheme-only behaviour both confirmed by source reads.

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable internal codebase; re-verify voterNavigation callers + UNBLK-03 running-app state at execution time per CONTEXT.md hard rule)

## RESEARCH COMPLETE
