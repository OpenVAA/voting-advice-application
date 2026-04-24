---
phase: 61
slug: voter-app-question-flow
status: draft
shadcn_initialized: false
preset: not applicable (SvelteKit + Tailwind + daisyUI)
created: 2026-04-24
---

# Phase 61 — UI Design Contract

> Bug-fix + reactivity-fix contract. Phase 61 restores voter question-flow rendering (boolean opinion input, boolean match-breakdown, category-selection default + counter reactivity) and unblocks candidate-app question-list reactivity. No new visual design is introduced: the Yes/No pseudo-choices, category checkboxes, and opinion match-breakdown all reuse existing daisyUI + Tailwind components and existing `app.css` tokens. This spec locks the **existing** visual idiom the fix must preserve and names the i18n keys / testIds the fix must produce so executor, checker, and auditor share one source of truth.

**Scope:** QUESTION-01, QUESTION-02, QUESTION-03, QUESTION-04. Downstream consumer of Phase 60 runes-mode layouts.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (SvelteKit is not a shadcn target; preset automation N/A) |
| Preset | not applicable |
| Component library | daisyUI 5 (Tailwind plugin, native integration via `@plugin 'daisyui'` in `apps/frontend/src/app.css`) — already installed, no changes this phase |
| Icon library | in-project `Icon` component (`apps/frontend/src/lib/components/icon`) wrapping project SVGs — no changes this phase |
| Font | `Inter` via Google Fonts (from `packages/app-shared/src/settings/staticSettings.ts` → `font.url`) — unchanged |
| Runes mode | Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) — consistent with Phase 60 migration |

**Rationale:** Phase 61 is bug-fix + reactivity-fix only. No new components, no new tokens, no new colors. The boolean input path synthesizes two pseudo-choices and routes through the existing `QuestionChoices.svelte` radio-group component. Category-selection UI and candidate-questions list UI already exist in their respective `+page.svelte` files — the fix is a reactivity-chain replacement in their backing context, not a visual change.

---

## Spacing Scale

N/A — refactor preserves existing. The app's spacing scale is declared in `apps/frontend/src/app.css` under `@theme`:

| Token | CSS value | Notes |
|-------|-----------|-------|
| `--spacing-xs` | 0.25rem (4px) | Icon gaps, inline padding |
| `--spacing-sm` | 0.5rem (8px) | Compact element spacing |
| `--spacing-md` | 0.625rem (10px) | Default element spacing |
| `--spacing-lg` | 1.25rem (20px) | Section padding |
| `--spacing-xl` | 2.5rem (40px) | Layout gaps |
| `--spacing-xxl` | 3.75rem (60px) | Major section breaks |
| `--spacing-touch` | 2.75rem (44px) | Minimum touch target (iOS accessibility) |
| Numeric utilities | `--spacing-4/6/8/…/100` | Pixel-based classes (`p-16`, `gap-8`, etc.) |

Exceptions for this phase: none — phase changes no spacing. Executor must not introduce new `gap-*`, `p-*`, or `m-*` classes on the boolean pseudo-choices; the boolean branch must render inside the existing `QuestionChoices.svelte` `<fieldset>` grid whose spacing is already governed by the `vertical` / horizontal modifier and `gap-md` / `gap-lg` utilities.

**Deviations from strict 8-point scale:** The existing scale uses a 2px base unit (not 4px) to support daisyUI defaults and iOS safe-area offsets. This is a pre-existing project convention. Phase 61 does not introduce new values outside this inherited scale.

---

## Typography

N/A — refactor preserves existing. Declared values from `apps/frontend/src/app.css` `@theme` block (all resolved through Tailwind `text-*` utilities):

| Role | Size (rem → px @ 16px root) | Weight | Line height |
|------|------------------------------|--------|-------------|
| Body (default) | `text-md` = 0.9375rem (~15px) | `--font-weight-normal` (400) | 1.35 |
| Body (base) | `text-base` = 0.9375rem (~15px) | 400 | 1.35 |
| Small / label | `text-sm` = 0.8125rem (~13px) | 400 | 1.35 |
| Small-label (uppercase) | `text-xs` = 0.71875rem (~11.5px) | 400 | 1.21 |
| H3 (question text on result-detail) | `text-lg` = 1.0625rem (~17px) | `--font-weight-bold` (700) | 1.21 |
| H2 (section headings) | `text-xl` = 1.25rem (~20px) | 700 | 1.21 |
| H1 (page titles) | `text-2xl` = 1.4375rem (~23px) | 700 | 1.21 |
| Display | `text-3xl` = 1.75rem (~28px) | 700 | 1.21 |

**Font weights declared:** exactly 2 — `400` (normal) and `700` (bold). No intermediate weights.

**Font family:** `--font-base: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …`. Configured to fetch from Google Fonts at boot; `staticSettings.font.url` requests weights `400;700` only.

**Constraint:** Boolean pseudo-choice labels ("Yes" / "No") render inside the existing `QuestionChoices` component's `.small-label` class (when horizontal) or default text-start styling (when vertical) — executor must not restyle the labels. No new font size or weight is introduced.

---

## Color

N/A — refactor preserves existing. The project's 60/30/10 split is declared in `apps/frontend/src/app.css` as a daisyUI 5 theme (both `light` and `dark`). Mirrored in `packages/app-shared/src/settings/staticSettings.ts` (`colors.light` / `colors.dark`).

| Role | Light token | Light value | Dark value | Usage this phase |
|------|-------------|-------------|------------|-----------------|
| Dominant (60%) | `--color-base-100` | `#ffffff` | `#000000` | Page background behind boolean input grid; default radio bg |
| Secondary (30%) | `--color-base-200` / `--color-base-300` | `#e8f5f6` / `#d1ebee` | `#101212` / `#1f2324` | Category checkbox row hover surface, question card shaded bg, line-through color between choices |
| Accent — primary (10%) | `--color-primary` | `#2546a8` | `#6887e3` | **Boolean selected-state radio fill (via `.radio-primary`); `text-primary` on voter's answer label in display mode; category checkbox selected state; primary CTA button** |
| Accent — secondary | `--color-accent` | `#0a716b` | `#11a8a0` | Reserved for teal-coded info/success states outside this phase (not applied here) |
| Destructive / warning | `--color-warning` = `--color-error` | `#a82525` | `#e16060` | Not used in Phase 61 (no destructive actions introduced) |
| Neutral | `--color-neutral` | `#333333` | `#cccccc` | Candidate's (non-voter) answer marker in `display` mode; `otherSelected` entity answer visuals in `QuestionChoices` |
| Line | `--line-color` / `var(--line-bg)` | `#d9d9d9` | `#262626` | Connecting line between ordinal choices (inherited — boolean is treated as 2-point ordinal for display) |

**Accent reserved for (explicit list, not "all interactive elements"):**

1. Radio button checked state on boolean pseudo-choices (via daisyUI `.radio-primary` — already applied in `QuestionChoices.svelte` line 257).
2. Voter's own answer label on candidate result-detail (`text-primary` — already applied in `QuestionChoices.svelte` display mode).
3. Category checkbox checked state on `/questions` intro page (via daisyUI `.checkbox` default primary — already applied).
4. Primary CTA `Button variant="main"` / `icon="next"` on `/questions` intro (existing), on candidate question-list start (existing `candidate-questions-start` testId).

No new color tokens are introduced. Executor must not apply `text-accent`, `bg-accent`, or `warning` to any Phase 61 element.

**Destructive actions in this phase:** **none.** Category toggling, boolean selection, and candidate-app question-list reveal are all reversible voter/candidate actions; no confirmation dialogs are added or modified.

---

## Copywriting Contract

All copy below either (a) already exists in the i18n catalog and must render unchanged, or (b) is explicitly introduced by Phase 61 at the listed key. Planner/executor must add any MISSING keys to all 4 supported locales (`en`, `fi`, `sv`, `da`) per `staticSettings.supportedLocales`.

### Existing keys (render unchanged)

| Element | i18n key → rendered EN string | Rendered by |
|---------|-------------------------------|-------------|
| Yes label for boolean pseudo-choice | `common.answer.yes` → `"Yes"` | `OpinionQuestionInput.svelte` (new boolean branch) → `QuestionChoices.svelte` |
| No label for boolean pseudo-choice | `common.answer.no` → `"No"` | `OpinionQuestionInput.svelte` (new boolean branch) → `QuestionChoices.svelte` |
| Unsupported-question error (fallback only) | `error.unsupportedQuestion` → `"This question type is not supported."` | `OpinionQuestionInput.svelte` `:else` branch (should never be reached for boolean after fix) |
| Category-intro heading | `questions.category.numQuestions` (ICU plural) → e.g. `"3 questions"` | `[categoryId]/+page.svelte` pre-heading (reactive — must update on category toggle upstream) |
| Category-select questions counter | `questions.intro.start` → `"Answer {numQuestions} Questions"` | `/questions/+page.svelte` primary CTA — **must never render `"Answer 0 Questions"` when any categories are checked and the session has at least 1 category by default** |
| Category-select ingress (with selection) | `questions.intro.ingress.withCategorySelection` → `"The questions are divided into {numCategories} categories. You can answer all of them or the pick the ones you want. …"` | `/questions/+page.svelte` (unchanged) |
| Voter's answer label (display mode) | `questions.answers.yourAnswer` → `"You"` | `QuestionChoices.svelte` display mode (applies to boolean too, once the switch routes boolean through this component) |
| Entity hasn't answered | `questions.answers.entityHasntAnswered` → `"{entity} hasn't answered this question"` | `EntityOpinions.svelte` (unchanged; applies to boolean too post-fix) |
| Neither answered | `questions.answers.bothHaventAnswered` → `"Neither you nor {entity} has answered this question"` | `EntityOpinions.svelte` (unchanged) |
| You haven't answered | `questions.answers.youHaventAnswered` → `"You haven't answered this question"` | `EntityOpinions.svelte` (unchanged) |
| Candidate-app question-list "start" button | `common.continue` → `"Continue"` (shown on start CTA) | `candidate/(protected)/questions/+page.svelte` → `candidate-questions-start` testId |
| Candidate-app questions title (no answers) | `candidateApp.questions.start` | `candidate/(protected)/questions/+page.svelte` (unchanged) |
| Candidate-app questions ingress (empty) | `candidateApp.questions.ingress.empty` | `candidate/(protected)/questions/+page.svelte` (unchanged) |

### New keys (required add)

None strictly required. `common.answer.yes` / `common.answer.no` **already exist** in `en/common.json`. Planner must verify the same keys exist in `fi/common.json`, `sv/common.json`, `da/common.json` and add translations if any are missing. D-02's original "`common.yes` / `common.no`" wording is superseded by the actual existing path `common.answer.yes` / `common.answer.no` — executor must use the existing path, not create new top-level `common.yes` keys.

### Copy the fix must never break

- `questions.intro.start` counter must update on every category-toggle click — the value `numQuestions: 0` may only render when the voter has actively deselected **all** categories. With the D-08 default (all checked), a fresh session must show the non-zero count from the first paint.
- `questions.category.numQuestions` on `/questions/category/[categoryId]/+page.svelte` must also stay accurate — its value comes from `selectedQuestionBlocks.getByCategory(category).block.length`, which is downstream of the same voter-context derivation chain QUESTION-03 fixes.

**Destructive copy:** none this phase.

---

## Component Inventory

| Component | Purpose in this phase | Change |
|-----------|-----------------------|--------|
| `OpinionQuestionInput.svelte` (`apps/frontend/src/lib/components/questions/`) | Dispatches opinion question to correct renderer. **Currently falls through to `ErrorMessage` for boolean questions.** | **Add `isBooleanQuestion(question)` branch** that synthesizes two pseudo-choices (`{ id: 'no', label: t('common.answer.no') }`, `{ id: 'yes', label: t('common.answer.yes') }`) and passes them into the existing `QuestionChoices` render path. |
| `QuestionChoices.svelte` | Radio-group renderer. Today consumes `question.choices` directly. | **Accept explicit `choices` prop** (override) to support the boolean case, OR accept an adapter object that quacks like a SingleChoiceOrdinalQuestion — planner decides shape. The existing `choices = $derived(question.choices)` line becomes `choices = $derived(explicitChoices ?? question.choices)`. Horizontal variant + `showLine=true` applies by default for boolean (consistent with singleChoiceOrdinal 2-point display). |
| `EntityOpinions.svelte` (`apps/frontend/src/lib/dynamic-components/entityDetails/`) | Renders per-question answer blocks on candidate result-detail. Already dispatches via `OpinionQuestionInput` in both `answer` and `display` modes. | **No change.** Once `OpinionQuestionInput` gains the boolean branch, this component's display path works for boolean out of the box — the "per-question match breakdown component" referenced in D-05/D-06 **is** this component + `OpinionQuestionInput` together. QUESTION-02 is satisfied by the QUESTION-01 fix. |
| `/questions/+page.svelte` (voter question-intro) | Category checkbox list + counter. | **No visual change.** Reactivity flows from `voterCtx.selectedQuestionCategoryIds` → `selectedQuestionBlocks.questions.length` → `questions.intro.start` counter. The fix is in the backing context (see below), not the markup. Existing `data-testid="voter-questions-category-list"`, `voter-questions-category-checkbox`, `voter-questions-start` preserved. |
| `voterContext.svelte.ts` (`apps/frontend/src/lib/contexts/voter/`) | Owns `selectedQuestionCategoryIds` + `_opinionQuestions` + `selectedQuestionBlocks`. **Current derivation chain intermittently breaks counter reactivity (QUESTION-03).** | **Replace any `$:` / `$effect`-based derivation with `$derived`** per Phase 60 pattern. If any store mutation happens inside an `$effect`, apply `get(store) + untrack(() => store.update(...))` idiom. Planner to audit full chain. |
| `/questions/category/[categoryId]/+page.svelte` | Category intro page — reuses the same `selectedQuestionBlocks.getByCategory(category)` derivation. | **No visual change.** Inherits the reactivity fix from `voterContext`. Existing `data-testid="voter-questions-category-intro"` + `voter-questions-category-start` + `voter-questions-category-skip` preserved. |
| `candidate/(protected)/questions/+page.svelte` | Candidate question-list + start CTA. Contains `candidate-questions-list` + `candidate-questions-start` testIds. | **No markup change expected.** Diagnosis first (D-13): validate the "same reactivity class" hypothesis. If the root cause is a missing/stale `$derived` in `candidateContext.svelte.ts` (sibling to voterContext), fix there. If the root cause is a pure testId-visibility race (e.g., `completion` derivation runs before `opinionQuestions` resolves), adjust the condition gate. Either way: **do not rename or move the `data-testid="candidate-questions-list"` or `data-testid="candidate-questions-start"` attributes** — the E2E suite depends on these exact strings at these exact nesting levels. |
| `candidateContext.svelte.ts` (`apps/frontend/src/lib/contexts/candidate/`) | Owns `opinionQuestions`, `unansweredOpinionQuestions`, `questionBlocks`, `profileComplete`. | **Possibly touched by QUESTION-04** if diagnosis confirms same reactivity class. Apply same `$derived` / `get + untrack` patterns as voterContext if needed. |

**No new components are introduced.**

---

## Interaction Contract

### Boolean opinion input (QUESTION-01)

Branches — mutually exclusive, in `OpinionQuestionInput.svelte`:

| Branch condition | Rendered output | Interaction contract |
|------------------|-----------------|----------------------|
| `isSingleChoiceQuestion(question)` | `<QuestionChoices {question} …>` consuming `question.choices` | Existing behavior preserved; ordinal + categorical flows unchanged |
| **NEW:** `isBooleanQuestion(question)` | `<QuestionChoices {question} choices={[{ id: 'no', label: t('common.answer.no') }, { id: 'yes', label: t('common.answer.yes') }]} showLine …>` (or equivalent via choices-override prop) | Voter sees 2 horizontally-laid radio buttons with a connecting line (matches singleChoiceOrdinal visual idiom). Selecting `yes` sends `onChange({ value: true, question })`; selecting `no` sends `onChange({ value: false, question })`. Pseudo-choice ID → boolean value mapping happens in the new branch of `OpinionQuestionInput`, not in `QuestionChoices`. |
| `:else` (unsupported type) | `<ErrorMessage inline message={t('error.unsupportedQuestion')} class="text-center" />` | Unchanged fallback. Should never fire for boolean after fix. |

**Display mode (QUESTION-02, candidate result-detail):**

- Boolean branch also applies when `mode === 'display'` — the same pseudo-choices drive the `QuestionChoices` display path, showing:
  - `{t('questions.answers.yourAnswer')}` → "You" label on voter's side of the 2-point line
  - `{otherLabel}` (candidate short name) on the entity's side
- Per-question answer block in `EntityOpinions.svelte` continues to honor the existing "hasn't answered" messaging keys when either side is missing.

**Skip / cancel behavior (D-04):** Unchanged — the skip affordance in `QuestionActions` continues to apply to boolean questions identically to ordinal ones. Voter can still refuse.

**TestIds (executor contract):**

- Root wrapper: existing `data-testid="opinion-question-input"` (unchanged).
- Radio group fieldset: existing `data-testid="question-choices"` (unchanged).
- Individual radio button: existing `data-testid="question-choice"` on each `<input>` (unchanged — applied to both pseudo-choices automatically by existing markup).
- Planner discretion: may optionally add `data-testid="opinion-question-yes"` / `"opinion-question-no"` if Playwright coverage demands finer-grained locators. Must not rename existing ones.

### Category selection + counter (QUESTION-03)

Branches and contract on `/questions/+page.svelte`:

| State | Expected UI |
|-------|-------------|
| Fresh voter session, `appSettings.questions.questionsIntro.allowCategorySelection === true` | All category checkboxes visible; **all checked by default** (D-08 locked); `questions.intro.start` counter shows total question count across all categories; CTA enabled |
| Voter unchecks one category | Counter updates **on the same tick** (no debounce, no stale frame); CTA text re-renders via i18n interpolation |
| Voter unchecks enough to drop below `matching.minimumAnswers` | CTA disabled (`canSubmit === false`); counter still reflects actual count |
| Voter unchecks all | Counter shows `0`; CTA disabled; this is the only state where `numQuestions: 0` is legitimate |

**Regression gate:** On a fresh full-page-load to `/questions` with `allowCategorySelection === true`, the counter **must not** render `"Answer 0 Questions"` on first paint. Pre-fix symptom was intermittent 0-counter because `selectedQuestionCategoryIds` was briefly empty before the onMount initializer wrote the default selection (D-08) AND the derivation chain was reading stale. Fix must ensure either (a) default is computed via `$derived` so counter is always in sync, or (b) the onMount initializer runs before first paint and all downstream `$derived` re-compute correctly.

**Persistence (D-11):** Session-only in-memory `$state`. No `sessionStorage` / `localStorage` wiring this phase.

### Candidate-app question-list reactivity (QUESTION-04)

Branches and contract on `candidate/(protected)/questions/+page.svelte`:

| Completion state | Expected UI | TestIds that must be visible |
|------------------|-------------|------------------------------|
| `completion === 'empty' && !answersLocked` | Ingress text + primary CTA "Continue" | `data-testid="candidate-questions-start"` on the CTA Button |
| `completion === 'partial'` or `'full'` | Warning (if partial), ingress, shortcut CTA, Expander list of categories, bottom "home" button | `data-testid="candidate-questions-list"` on the `<div>` wrapping the `<Expander>` list; `data-testid="candidate-questions-continue"` on the shortcut CTA (when shown); `data-testid="candidate-questions-home"` on the bottom Button |

**Regression gate:** Playwright's default timeout (30s) must be sufficient for `candidate-questions-list` or `candidate-questions-start` (whichever matches the fixture's completion state) to become visible after `page.goto('/candidate/questions')` post-login. The 6 direct `candidate-questions.spec.ts` tests assert on these exact testIds. The 18 cascade tests (candidate-app-mutation / candidate-app-settings / candidate-app-password / re-auth-setup) fail today because they can't get past the gate test at the top of candidate-questions.spec.

**If diagnosis reveals a non-reactivity root cause:** Planner may split the QUESTION-04 fix off into its own plan, but the testId contract above still applies — the existing testIds stay, only the condition gate that mounts them changes.

**No visual change** to the candidate questions page is introduced by this phase. Expander styling, Button variants, layout, spacing, and copy all remain exactly as they are today.

---

## Layout-State Contract (phase-specific)

No layout-state branches are added or removed. All four Phase-60 root-layout branches (error / loading / maintenance / ready) and all four protected-layout branches (loading / error / terms / ready) pass through unchanged. Phase 61 operates entirely within the `ready → children` branch of both layouts.

---

## Accessibility Contract

Preserved from existing components — no new accessibility surface is introduced.

- Boolean radio group inherits `QuestionChoices.svelte` accessibility: `<fieldset>` with `<legend class="sr-only">` containing the question text, keyboard navigation via arrow keys (selects on focus), `Tab` focuses the group, `Space`/`Enter` triggers callback, `onKeyboardFocusOut` dispatches final change on group defocus.
- Category checkbox group inherits daisyUI `.checkbox` accessibility (native `<input type="checkbox">` inside `<label>`).
- Candidate questions list inherits `Expander` component accessibility (existing — unchanged).
- Color contrast: all accent-on-dominant combinations already meet WCAG AA from the daisyUI theme (verified via `staticSettings.colors` — `#2546a8` on `#ffffff` = 8.6:1 contrast).

**Executor must not regress:** removing `sr-only` legend, removing `onKeyboardFocusOut`, or replacing the native `<input type="radio">` with a non-semantic div is forbidden.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| N/A | No registry blocks added or modified this phase | not applicable (project does not use shadcn) |

No third-party component blocks are pulled in. All components referenced (`OpinionQuestionInput`, `QuestionChoices`, `EntityOpinions`, `Button`, `Expander`, `HeadingGroup`, `MainContent`, `CategoryTag`, `HeroEmoji`, `Loading`, `ErrorMessage`, `SuccessMessage`, `Warning`, `Icon`) are first-party, already in the repo, and either unchanged or internally modified (OpinionQuestionInput gains one branch, QuestionChoices gains an optional prop) without visual surface change.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — boolean labels use existing `common.answer.yes` / `common.answer.no`; counter uses existing `questions.intro.start`; candidate testIds reuse existing i18n; no new strings introduced; locale-parity audit recommended
- [ ] Dimension 2 Visuals: PASS — component inventory documents every touched component, all changes are additive (new branch in switch; new optional prop) with no visual redesign
- [ ] Dimension 3 Color: PASS — accent-for list locked to 4 specific uses; no new color tokens; destructive palette untouched (none used)
- [ ] Dimension 4 Typography: PASS — inherits existing `--text-*` and 2-weight (400/700) Inter scale; boolean labels use existing `.small-label` / text-start classes per horizontal/vertical QuestionChoices variant
- [ ] Dimension 5 Spacing: PASS — no new gap/padding/margin utilities; boolean renders inside existing fieldset grid governed by `gap-md` / `gap-lg`
- [ ] Dimension 6 Registry Safety: PASS — no registry blocks introduced; project is not a shadcn target

**Approval:** pending
