# Phase 159: Component & Context Consolidation - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 26 new-or-modified files (grouped into 9 pattern assignments)
**Analogs found:** 9 / 9 (every assignment has a concrete in-tree analog; none fall back to RESEARCH.md prose)

> Read with `159-CONTEXT.md` (decisions) and `159-RESEARCH.md` (mechanics). This file answers only:
> **what existing file does each new/changed file copy from, and which lines.**

---

## File Classification

| New/Modified file | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `.planning/phases/159-.../159-EFFECT-CENSUS.md` (new) | artifact / measurement table | batch | `.planning/phases/137-.../137-NEGATIVE-CONTROL.md` | exact |
| `.planning/phases/159-.../classify-effects.mjs` (new, committed script) | utility (throwaway-adjacent) | transform | `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` (source-scan + narrow parser) | role-match |
| `PasswordValidator.svelte:110`, `candidate/register/+page.svelte:50`, `questions/+layout.svelte:169`, `elections/+page.svelte:65` (the 4 CONVERTIBLE sites) | component | event-driven → derived | `apps/frontend/src/routes/(voters)/elections/+page.svelte:43-44` (safe `dataRoot` read) | exact |
| `PasswordSetter.svelte` (checkpoint: option A) | component | request-response (form) | same as above + Svelte docs `$effect`→`$derived` | role-match |
| `EntityCard.svelte` (snippet absorbs `EntityCardAction`) | component | event-driven (click) | `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:56-99` | **exact** |
| `EntityCardAction.svelte` + `.type.ts` (DELETE) | component + type | — | n/a (deletion) | n/a |
| `lib/components/input/parts/*.svelte` (new: MultipleText, MultilingualText, SelectMultiple, Image) | component (extracted branch) | request-response (form input) | `lib/components/questions/QuestionChoices.svelte` + `QuestionChoices.type.ts` as consumed by `OpinionQuestionInput.svelte:144-216` | **exact** |
| `Input.svelte` / `Input.type.ts` / `input/index.ts` / `QuestionInput.svelte` | component + type + barrel | request-response | `OpinionQuestionInput.svelte` (branching parent) · `questions/index.ts` (barrel) | exact |
| `contexts/utils/questionRollup.ts` (new) + `questionRollup.test.ts` (new) | utility (context) | transform | `contexts/utils/inheritContextMembers.ts` + `inheritContextMembers.test.ts` | **exact** |
| `contexts/utils/reactiveHandle.type.ts` (moved) | type | — | siblings in `contexts/utils/` (direct-path imports, **no barrel**) | exact |
| `voterContext.svelte.ts` (`sameRefs` to file bottom, rollup call) | service / orchestrator class | event-driven | `candidateContext.svelte.ts:355-360` (safe in-effect read) | exact |
| `candidateContext.svelte.ts` (rollup call) | service / orchestrator class | event-driven | itself, `:137-139` (safe `$derived` over `dataRoot`) | exact |
| `trackingService.type.ts` / `trackingService.svelte.ts` (collapse to one) | service + type | pub-sub / event | `trackingService.type.ts:1-30` (doc-comment-per-member house style) | exact |
| `appContext.spread.svelte.test.ts` (drop `sessionId`, `shouldTrack`) | test | — | itself `:165-185` (the forwarded-member list) | exact |
| `lib/layouts/main/*` (9 moved files) + `lib/layouts/main/index.ts` + `lib/layouts/index.ts` (new barrels) | component + barrel | request-response (SSR render) | `lib/components/questions/index.ts` (barrel) · `lib/dynamic-components/entityCard/index.ts` (small barrel) | exact |
| `apps/frontend/svelte.config.js` | config | — | itself `:11-15` | exact |
| `apps/frontend/vitest.config.ts` | config | — | itself `:13-28` | exact |
| `Alert.svelte:114,:117` | component | — | `apps/frontend/src/app.css:150-179` (`@theme` scale) + `QuestionActions.svelte:86` (named-token house style) | exact |
| new guard tests ×3 (source-scan vitest) | test | file-I/O | `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts:1-60` · `apps/frontend/src/lib/i18n/tests/translations.test.ts:1-22` | role-match |
| `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` (extend) | test (E2E) | request-response | itself `:1-53` | exact |
| `lib/utils/constants.ts:10` · `lib/utils/multiChoiceValidity.ts:28` + its test | utility + test | transform | existing `multiChoiceValidity.test.ts` describes | exact |

---

## Pattern Assignments

### 1. The canonical safe `dataRoot` read — binds EVERY converted `$effect` and the criterion-5 extraction

**Analog:** `apps/frontend/src/routes/(voters)/elections/+page.svelte:35-66` — CLAUDE.md's own named
analog. Note the file contains **both** the safe pattern *and* one of the four CONVERTIBLE `$effect`
sites (`:65`), two lines apart.

```svelte
<!-- apps/frontend/src/routes/(voters)/elections/+page.svelte:35, :43-44, :65-67 -->
  const appSettings = $derived(voterCtx.appSettings);   // value-replacing accessor: alias is SAFE
  ...
  let elections = $derived.by(() => {
    let result = voterCtx.dataRoot.elections;           // ← DIRECT read INSIDE the tracking scope
    ...
  });

  $effect(() => {                                       // ← the CONVERTIBLE site (:65)
    selected = (voterCtx.selectedElections.length ? voterCtx.selectedElections : elections).map((e) => e.id);
  });
```

**Copy:** the `$derived.by(() => { … voterCtx.dataRoot.<prop> … })` shape — the thunk itself takes the
`#version` dependency. **Change:** when converting `:65` to `$derived`, do not "tidy" `:43-44` into an
alias; the conversion sits two lines from the carve-out.

**Counter-example to pattern-match against — the FORBIDDEN shape**
(`.planning/spikes/024-derived-alias-stable-ref-skip/README.md:31-34`, restated verbatim at
`tests/tests/specs/voter/cold-entry-dataroot.spec.ts:4-11`):

```ts
const dataRoot = $derived(ctx.dataRoot);                 // intermediate alias   ← NEVER
const elections = $derived.by(() => dataRoot.elections); // reads through alias  ← goes STALE on cold entry
```

**Class-side analogs (criterion 5 operates here):**

```ts
// apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:137-139  — SAFE $derived
  #electionsSelectable = $derived(this.#dataRoot.elections?.length !== 1);
  #constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));

// apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:355-356  — SAFE in-effect read
    $effect(() => {
      const dr = this.#dataRoot;   // read INSIDE the effect's tracking scope; pass `dr` BY VALUE
```

**What to copy / change:** call `rollUpQuestionCategories({ dataRoot: dr, … })` from **inside** the
existing `$effect`, passing the already-read `dr`. Never `#rollup = $derived(rollUp({ dataRoot: this.#dataRoot }))`,
never a `dataRoot: () => this.#dataRoot` thunk the utility invokes outside a tracking scope.

---

### 2. Snippet replacing a wrapper component (criterion 3)

**Analog:** `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:56-99` — the closest
in-tree shape to "wrap children in a clickable action": a parameterless `{#snippet content()}` holding
the interactive element, rendered from two branches, with the interactive class defined in the
component's own scoped `<style>`.

```svelte
<!-- apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:56-91 -->
{#snippet content()}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svelte:element
    this={href == null ? 'button' : 'a'}
    href={disabled ? undefined : href}
    onclick={...}
    disabled={href == null && disabled ? true : undefined}
    aria-disabled={href != null && disabled ? 'true' : undefined}
    data-testid="nav-menu-item"
    {...concatClass(restProps, classes)}>
    ...
    {@render children?.()}
  </svelte:element>
{/snippet}

{#if inNavGroup}
  <div role="listitem">{@render content()}</div>
{:else}
  {@render content()}
{/if}

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .nav-item[disabled], ...
</style>
```

**What to copy:** the snippet-plus-two-render-sites structure, and the `<svelte:element this={…}>`
button/anchor switch (a legitimate alternative to `EntityCardAction`'s `{#if}` ladder, if the plan
prefers it — but the ladder's 500-error branch must survive either way).

**What to change:** `EntityCard`'s snippet takes **four** parameters, because it has two nested call
sites with different classes (`EntityCard.svelte:220-222` outer, `:229-232` inner passing
`class={gridClasses}`):

```svelte
{#snippet cardAction(action, shadeOnHover, extraClass, content)}
```

The two wrapped bodies each become their own `{#snippet}`.

**Source being replaced** (`EntityCardAction.svelte:31-52`) — the three-way branch, both
`data-testid="entity-card-action"` attributes, `data-sveltekit-noscroll` on the `<a>`, and the
`{error(500, …)}` fallback are all load-bearing and must transfer verbatim.

**⚠ Style relocation — snippets carry NO style scope.** `EntityCardAction.svelte:54-59`:

```postcss
<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .hover-shaded {
    @apply hover:bg-base-content/20 hover:ring-base-content/20 rounded-md hover:ring-4;
  }
</style>
```

**Destination:** `EntityCard.svelte`'s **existing** `<style lang="postcss">` block at `:362` — no new
style block is needed. Note the `@reference` path stays `"../../../tailwind-theme.css"` (same directory
depth), so the rule moves unchanged.

**Also:** `dynamic-components/entityCard/index.ts` currently exports only `EntityCard` + its type —
no barrel edit is required by the deletion.

---

### 3. Extracted sub-component consumed by a large branching parent (criterion 2)

**Analog:** `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — the parent
dispatches a type union across a `{#if}/{:else if}` ladder into two extracted siblings, each with its
own co-located `.type.ts`, all re-exported from one barrel.

```ts
// OpinionQuestionInput.svelte:39-41 — extracted siblings imported by RELATIVE path (not via the barrel)
  import NumberScaleInput from './NumberScaleInput.svelte';
  import QuestionChoices from './QuestionChoices.svelte';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
```

```svelte
<!-- OpinionQuestionInput.svelte:144-216 — the branch ladder -->
  {#if isSingleChoiceQuestion(question)}
    <QuestionChoices ... />
  {:else if isBooleanQuestion(question)}
    <QuestionChoices ... />
  {:else if isNumberQuestion(question) && question.isMatchable}
    <NumberScaleInput ... />
  {:else if isMultipleChoiceQuestion(question)}
    <QuestionChoices ... />
  {:else}
```

Prop-contract style to copy — `QuestionChoices.type.ts:11-30`: a `SvelteHTMLElements['fieldset'] & {…}`
intersection with a doc comment on **every** member including `@default`:

```ts
export type QuestionChoicesProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The `ChoiceQuestion` object. `BooleanQuestion` is also accepted when an
   * explicit `choices` prop is supplied to synthesize the Yes/No pseudo-choices.
   */
  question: SingleChoiceCategoricalQuestion | ... ;
  /** Whether to disable all the buttons. @default false */
```

**What to copy:** one part-component per complex branch (`Input.svelte` branches **1, 3, 4** plus the
absorbed `MultipleTextInput`), each with a co-located `<Part>.type.ts`; parent imports them relatively;
branches 2 and 5 stay inline.

**What to change:** `MultipleTextInput.type.ts` (55 lines) becomes the extracted part's prop contract
(it is *moved*, not deleted). Barrel to copy: `lib/components/input/index.ts` uses the
`export { default as X } from './X.svelte'; export * from './X.type';` pair-per-component convention —
identical to `lib/components/questions/index.ts:1-8`. The `MultipleTextInput` pair is **removed** from
that barrel; the new `parts/` subdirectory is internal and should **not** be re-exported (parity with
`questions/`, where every component is public, is *not* wanted here — parts are implementation detail).

**Completion signal (typecheck-enforced):** `QuestionInput.svelte:40, :61-72, :150-152` — once
`multipleText` is an `Input` type, the `Exclude<QuestionType, typeof QUESTION_TYPE.MultipleText>` in
the `Record` key, the `as Exclude<>` cast, the `isMultipleText` `$derived` and the `{#if isMultipleText}`
branch all delete. Multilingual promotion extends the existing ladder at `QuestionInput.svelte:78-82`.

---

### 4. A `contexts/utils/` module + its unit test (criterion 5's destination)

**Analogs:** `apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts` (+ `.test.ts`) and
`persistedState.svelte.ts` (+ `.test.ts`).

Module header style to copy — `inheritContextMembers.ts:1-25`:

```ts
/**
 * Forward all own-enumerable members of a source context onto a target context,
 * **preserving accessor semantics**.
 *
 * see phase 113 converted `appContext`'s `appSettings` / `dataRoot` / `locale` from
 * stable `{ current }` handle objects into BARE own-enumerable reactive accessors ...
 *
 * This helper copies each own-enumerable member by its property descriptor:
 * - **Accessor** members ... re-installed as a live forwarding accessor ...
 * - **Data** members ... copied by value ...
 */
```

Test header + assertion style to copy — `inheritContextMembers.test.ts:1-30`:

```ts
import { describe, expect, test } from 'vitest';
import { inheritContextMembers } from './inheritContextMembers';

/**
 * see phase 113 CR-01 regression guard. inheritContextMembers must forward accessor
 * members as LIVE accessors (not snapshot their current value the way Object.assign
 * does) ... A regression here silently freezes the reactivity of inherited bare
 * reactive accessors (appSettings / dataRoot / locale) ...
 */
describe('inheritContextMembers', () => {
  test('forwards a getter accessor as a LIVE accessor (reads current value, not a snapshot)', () => {
    ...
    // Object.assign would have frozen this at 1 — the live forward re-reads.
    expect(target.value).toBe(999);
```

**What to copy:** the `<name>.ts` + sibling `<name>.test.ts` pairing; the "see phase NNN" provenance
line naming the regression the file guards; a test whose comment states what the *wrong*
implementation would have produced.

**What to change / conventions to honour:**
- `contexts/utils/` has **9 files and NO `index.ts`** — imports are direct file paths
  (`from '../utils/persistedState.svelte'`). Do **not** add a barrel for `questionRollup.ts` or the
  moved `reactiveHandle.type.ts`.
- `reactiveHandle.type.ts` (10 lines) has exactly **2** importers to rewrite:
  `contexts/app/survey.svelte.ts:1` (`'./reactiveHandle.type'` → `'../utils/reactiveHandle.type'`) and
  `contexts/app/tracking/trackingService.svelte.ts:6` (`'../reactiveHandle.type'` → `'../../utils/reactiveHandle.type'`).
- `sameRefs` (`voterContext.svelte.ts:37`) moves to the **bottom of its own file** with its 12-line
  comment at `:27-36` (F17) — both call sites (`:416`, `:451`) are file-local.
- The utility file is a plain `.ts`, **not** `.svelte.ts` — it must contain no runes; it receives
  `dataRoot` by value.

---

### 5. Path-alias registration triple (`$layouts`, criterion 6b)

**(a) `apps/frontend/svelte.config.js:9-16`** — copy the entry shape exactly:

```js
  kit: {
    adapter: adapter({}),
    alias: {
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate')
    },
```
Add `$layouts: path.resolve('./src/lib/layouts')`.

**(b) `apps/frontend/tsconfig.json`** — extends `./.svelte-kit/tsconfig.json`, which SvelteKit
**generates** from `kit.alias`. **No hand edit.** Verify with a typecheck after `svelte-kit sync`.

**(c) `apps/frontend/vitest.config.ts:13-28` — HAND-MAINTAINED; breaks silently if missed:**

```js
    alias: [
      // Paraglide generated output doesn't exist during tests.
      // These must come before the $lib alias to prevent $lib from matching first.
      { find: '$lib/paraglide/runtime', replacement: path.resolve(__dirname, '...') },
      ...
      // SvelteKit built-in aliases (not available via @sveltejs/vite-plugin-svelte)
      { find: '$lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '$types', replacement: path.resolve(__dirname, 'src/lib/types') },
      { find: '$voter', replacement: path.resolve(__dirname, 'src/lib/voter') },
      { find: '$candidate', replacement: path.resolve(__dirname, 'src/lib/candidate') },
```

**What to change:** add `{ find: '$layouts', replacement: <root>/src/lib/layouts }` alongside the other
three SvelteKit built-ins. ⚠ **Do not write `__dirname`** if Phase 153 Plan 153-04 has landed — use the
`import.meta.url`/`fileURLToPath` constant it introduces, or 153-09's `grep -c '__dirname' == 0` gate
fails on 159's new line. See RESEARCH § criterion 6b for the full three-way collision.

**(d) Barrel shape.** Two live analogs, both the same convention:

```ts
// apps/frontend/src/lib/dynamic-components/entityCard/index.ts (minimal)
export { default as EntityCard } from './EntityCard.svelte';
export * from './EntityCard.type';

// apps/frontend/src/lib/components/questions/index.ts:1-8 (multi-component, alphabetical, pair-per-component)
export { default as NumberScaleInput } from './NumberScaleInput.svelte';
export * from './NumberScaleInput.type';
export { default as OpinionQuestionInput } from './OpinionQuestionInput.svelte';
export * from './OpinionQuestionInput.type';
```

**Copy for `lib/layouts/main/index.ts`:** alphabetical `export { default as X } from './X.svelte';`
followed by `export * from './X.type';` where a `.type.ts` exists (Layout, MainContent,
MaintenancePage have one; Banner, Header, SingleCardContent do not). `lib/layouts/index.ts` re-exports
`./main`. Post-condition for the 51-file codemod: zero remaining relative imports of the moved names
anywhere under `apps/frontend/src/`.

---

### 6. Committed source-scan guard tests (three needed)

**Analog A — the narrow-parser, states-its-own-failure-meaning shape:**
`packages/dev-seed/tests/cli/allowedTeardownTables.test.ts:1-60`.

```ts
/**
 * ALLOWED_TEARDOWN_TABLES completeness check (see phase 140 review WR-04).
 * ...
 * If this test ever fails, it means `bulk_delete`'s collection arrays changed
 * (a table added/removed) without `ALLOWED_TEARDOWN_TABLES` being updated to
 * match — exactly the coverage hole WR-04 named.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

// packages/dev-seed/tests/cli/ -> repo root is four levels up.
const SCHEMA_MIGRATION_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'apps/...');
```
Its parser doc-comment states: *"Deliberately narrow (matches only this one declaration shape) — this
is a completeness CHECK against a known fact, not a general SQL parser. Throws rather than returning
empty when the declaration is not found: a silent `[]` would make every comparison pass vacuously."*

**Analog B — the tree-walking shape:** `apps/frontend/src/lib/i18n/tests/translations.test.ts:1-22`
(`fs.readdirSync` + `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', …)`, with a
comment explaining what each scanned root *is*).

**What to copy:** resolve roots from `import.meta.url` (never `__dirname` in frontend test files);
a header stating what a failure *means*; a scan narrow enough to name the offending file:line; a
throw-not-empty guard so the assertion can never pass vacuously.

**What to build (three guards, per the project's "demonstrate both failure modes first" rule):**
1. no `$derived(<anything>.dataRoot)` intermediate alias anywhere in `apps/frontend/src`;
2. no surviving relative import of the moved route-root component names (`MainContent.svelte`,
   `Layout.svelte`, `Header.svelte`, `Banner.svelte`, `MaintenancePage.svelte`, `SingleCardContent.svelte`);
3. `.hover-shaded` is still defined in exactly one `<style>` block after the snippet conversion.

⚠ These new unit tests move the frontend suite count, which Phase 153's `Tests 816 passed` gate pins —
file the amendment against 153-04/153-09 (RESEARCH § criterion 6b).

---

### 7. Cold-entry E2E negative control (extend, do not reinvent)

**Analog:** `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:1-53` — Phase 117's purpose-built
control. Its header is the discipline:

```ts
/**
 * Cold / direct-URL entry dataRoot reactivity regression (see phase 117).
 * ... These tests are the negative control for the codemod: they FAIL against
 * the pre-fix (aliased) source (the data-dependent region never appears → timeout)
 * and PASS once each consumer reads `ctx.dataRoot.<prop>` directly in its tracking
 * scope. NO intro→Continue walk — a bare hard navigation IS the cold entry; the
 * warm intro walk MASKS the bug ...
 * Rigidity contract (project E2E Hard Rule): every assertion is HARD — no
 * expect.soft, no try/catch around expect(), no .catch fallback.
 */
test('cold direct-URL entry to /en/elections renders the populated elections list', async ({ page }) => {
  await page.goto('/en/elections');                     // COLD: bare hard navigation
  await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await expect(page.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUTS.element });
});
```

**What to copy:** one `test()` per converted/extracted consumer route — `page.goto('<direct URL>')`
then a **waiting** `toBeVisible({ timeout })` on a region that is empty when `dataRoot` is stale.
**What to change:** add cases for the routes whose contexts change (criterion-5 rollup consumers and
any converted `$effect` in a `dataRoot`-consuming route); use `testIds` constants, never raw selectors;
never `isVisible()`.

Note `EntityCardAction`'s `data-testid="entity-card-action"` is depended on by
`tests/tests/fixtures/voter/resultsPage.fixture.ts:213`,
`tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:209` and
`tests/tests/specs/voter/voter-alliance.spec.ts:123`, all via `.first()` DOM ordering — the snippet must
preserve both the testid and the nested element order.

---

### 8. The census artifact (criterion 1)

**Analog:** `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md:1-35`
— the operator's cited precedent for a committed measurement document living in a phase directory.

```md
# Phase 137 — Negative Control: the E2E served-application preflight

**Two runs, four halves, all observed on one machine in one session.** ...

- **Date:** 2026-08-13
- **Plan:** `137-03-PLAN.md` (wave 2)
- **Decisions discharged:** D-11, D-12, D-13
- **Requirements:** INTEG-04, INTEG-05
- **Precedent followed:** `.planning/milestones/v2.14-phases/136-.../136-VISUAL-DISCRIMINATION-EVIDENCE.md`

---

## 1. Why this run existed
```

**What to copy:** the frontmatter block (Date · Plan · Decisions discharged · Requirements · Precedent
followed), then a "why this artifact exists" section quoting the criterion verbatim, then the data.
**What to change:** the payload is a 92-row table with columns `# · Site · Pure fn of inputs? · Bucket ·
Disposition · Contract change?`, sorted by path then line; file name `159-EFFECT-CENSUS.md`; cite
`159-CONTEXT.md` F1–F5 for why the number is 92 and not the roadmap's 211.

---

### 9. `@theme` spacing tokens and named-token house style (criterion 6a)

**Token source** — `apps/frontend/src/app.css:87-90` clears Tailwind's scale, `:150-179` redefines it:

```css
@theme {
  /* Clear TW4 defaults for restrictive design system */
  --spacing-*: initial;
  ...
  --spacing-2: 0.125rem;    --spacing-xs: 0.25rem;
  --spacing-8: 0.5rem;      --spacing-sm: 0.5rem;
  --spacing-16: 1rem;       --spacing-lg: 1.25rem;
```

**Named-token usage analogs** (house style — token classes, no bracket values):
`apps/frontend/src/lib/components/questions/QuestionActions.svelte:86` →
`'mt-lg grid w-full grid-cols-3 items-stretch gap-md'`;
`apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:241` →
`class="mt-md gap-md grid"`.

**Target** — `apps/frontend/src/lib/components/alert/Alert.svelte:114, :117`:

```svelte
      <Button onclick={closeAlert} color="warning" text={t('common.close')} class="-mt-[1rem] sm:mt-0" />
  <button onclick={closeAlert} class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">
```

**What to copy / change:**
- `:114` → `class="-mt-16 sm:mt-0"` — `--spacing-16: 1rem`, so **−16px, exactly identical**; removes the
  bracket syntax, which is the actual defect.
- `:117` → recommend **leave `top-2 right-2`** and record why: it is already a `@theme` token
  (`--spacing-2`), and the same `btn btn-circle btn-ghost btn-sm absolute top-2 right-2` string is the
  four-site house idiom (`Video.svelte:858`, `Modal.svelte:100`, `Drawer.svelte:90`). The reviewer's
  `top-sm` is 0.5rem = **4× the current 0.125rem**, violating D-H6's own "must render identically".
  → `checkpoint:decision`.
- `Alert.svelte` already owns a `<style lang="postcss">` block at `:123` with
  `@reference "../../../tailwind-theme.css"` — no new block needed if a rule is ever wanted.

---

## Shared Patterns

### Import ordering and path style
**Source:** `apps/frontend/src/lib/components/input/Input.svelte:12-28`
**Apply to:** every new/edited `.svelte` and `.ts` file.
```ts
  import { isLocalizedString } from '@openvaa/app-shared';   // 1. workspace packages
  import { isEmptyValue } from '@openvaa/core';
  import { Button } from '$lib/components/button';           // 2. $lib aliased barrels
  import { getComponentContext } from '$lib/contexts/component';
  import { iconBadgeClass, ... } from './shared';            // 3. relative siblings
  import type { Id } from '@openvaa/core';                   // 4. type-only, same order
  import type { InputProps } from './Input.type';
```
Sibling components are imported **relatively** even where a barrel exists (`OpinionQuestionInput.svelte:39-41`).
⚠ Per 159-CONTEXT `<domain>`, `logDebugError` from `$lib/utils/logger` is renamed and moved to
`app-shared` by **Phase 157** — plan every touched import against the new name.

### Documentation comments
**Source:** `contexts/app/tracking/trackingService.type.ts:3-30` (one doc block per member, `@param`/`@returns`),
`QuestionChoices.type.ts:11-30` (`@default` on every optional prop), `inheritContextMembers.ts:1-25`
(module header naming the regression it guards).
**Apply to:** the new snippet's replacement docs, the extracted `parts/*` type files, `questionRollup.ts`.
⚠ **Phase 152 constraint (D-N1):** no `\uXXXX` escapes in comments — write a literal `–`/`—`. The
`lint:check` scan fails the build otherwise. This is precisely what `EntityCardAction.svelte:12`
(`– default: The contents to wrap.`) got wrong.

### Svelte 5 context consumption (CLAUDE.md — HARD constraint)
**Source:** `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79` and
`elections/+page.svelte:35-44`.
**Apply to:** every `.svelte` file this phase touches.
- Stable members (`t`, `getRoute`, `answers`, lifecycle fns) — destructuring is fine.
- Value-replacing accessors (`appSettings`, `locale`, `selectedElections`, `opinionQuestions`,
  `matches`) — `const X = $derived(ctx.X)` alias is fine.
- **`dataRoot`** — `ctx.dataRoot.<prop>` read DIRECTLY inside the consuming tracking scope. No alias.

### Test-count and cross-phase collision hygiene
**Apply to:** every wave that adds a unit test or edits `vitest.config.ts`.
Phase 153 pins `Tests 816 passed (816)` / `Test Files 54 passed (54)` and declares "no collision" with
159. File the amendment rather than letting it surface as a merge conflict.

---

## No Analog Found

| File | Role | Data flow | Reason |
|---|---|---|---|
| *(none)* | — | — | Every 159 file has an in-tree analog. The two weakest are noted below. |

Two assignments are role-matches rather than exact:
- **`classify-effects.mjs`** — the repo has no committed one-off analysis script under a phase
  directory. Nearest discipline is the narrow-parser style of `allowedTeardownTables.test.ts`. Keep it
  out of `src/` so it never enters the unit suite.
- **`PasswordSetter.svelte`** — no in-tree precedent exists for "local `$derived` + one thin push
  effect into a `$bindable` prop". RESEARCH § criterion 1 recommends option A; it is a
  `checkpoint:decision`, not an executor call.

---

## Metadata

**Analog search scope:** `apps/frontend/src/{lib,routes}`, `apps/frontend/{svelte.config.js,vitest.config.ts,src/app.css}`,
`packages/dev-seed/tests/`, `tests/tests/specs/`, `.planning/phases/137-*`, `.planning/spikes/024-*`.
**Files read this pass:** 24
**Pattern extraction date:** 2026-08-28 (branch `integration/ship-12-squash`)
