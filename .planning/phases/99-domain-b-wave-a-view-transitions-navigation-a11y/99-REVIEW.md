---
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
reviewed: 2026-06-04T14:49:18Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
  - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
  - apps/frontend/src/routes/MainContent.svelte
  - apps/frontend/src/routes/SingleCardContent.svelte
  - apps/frontend/src/routes/+layout.svelte
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 99: Code Review Report (gaps-only re-execution — plan 99-04)

**Reviewed:** 2026-06-04T14:49:18Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

> This report covers ONLY the gap-closure delta produced by plan 99-04
> (CR-01 / NAVA11Y-01: localize the route announcer). The prior full-phase
> review of phase 99 is superseded by this file for the listed files.

## Summary

The gap-closure replaces the hardcoded-English `#route-announcer` (which leaked the opaque DB `questionId` slug) with a per-route, already-localized page title sourced via a new `routeTitle` rune signal on the layout context. `MainContent` / `SingleCardContent` register their localized `title` via `setRouteTitle(...)`; `+layout.svelte` reads `layoutCtx.routeTitle.current` via property access (correctly NOT destructured, per the CLAUDE.md Context Destructuring Rule) and renders it into the always-present `aria-live="polite"` `aria-atomic="true"` region.

The signal definition, the reactive read in `+layout.svelte`, and the SSR-safe empty-default behavior are correct. But the **test assertion that is supposed to bind CR-01** is wrong: it asserts the announcer label exactly equals the visible question-heading `textContent`, while the announcer is fed only the bare question *title* and the asserted heading element is the `<hgroup>` whose `textContent` also includes the localized pre-heading (category tag + `N/M` counter + election tags). Under the `e2e/base` seed (`showCategoryTags: true`) these are never equal, so the load-bearing CR-01 gate will fail. Secondary concerns are a redundant `$effect`-inside-`$effect` registrar (transient empty-string flash) and a cross-component cleanup race.

## Critical Issues

### CR-01: Announcer-equals-heading assertion compares the title against the full hgroup text — the CR-01 gate will fail under the real seed

**File:** `tests/tests/specs/a11y/a11y-smoke.spec.ts:251-255`
**Issue:**
The binding CR-01 assertion is:

```ts
const headingText = (await page.getByTestId(testIds.voter.questions.heading).textContent())?.trim() ?? '';
expect(headingText.length).toBeGreaterThan(0);
expect(questionLabel).toBe(headingText);
```

The two values are sourced differently:

- `questionLabel` = `#route-announcer` text = the `routeTitle` signal = the `title` prop passed to `MainContent`. On the question route that is `MainContent title={text}` where `text` is **only** the question text (`apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:168`).
- `headingText` = `textContent` of `data-testid="voter-questions-heading"`, which is the `QuestionHeading` root — an `<hgroup>` (`HeadingGroup.svelte`) wrapping a `PreHeading` **plus** the `<h1>`. The `PreHeading` renders `CategoryTag` (category name + `N/M` suffix) and `ElectionTag`s (`QuestionHeading.svelte` `<hgroup>` body).

The `a11y-smoke` project seeds `e2e/base` (`data-setup-base`), and that template sets `questions.showCategoryTags: true` (`packages/dev-seed/src/templates/e2e/base.ts:198`). `CategoryTag` renders `{category.name}` + `{suffix}` as visible text (`CategoryTag.svelte:43-48`). So `headingText` = `"<category name><N/M counter><question text>"` whereas `questionLabel` = `"<question text>"`. They are not equal, and `expect(questionLabel).toBe(headingText)` fails.

Consequence: the assertion meant to *prove* CR-01 (announcer speaks the localized title and matches the visible heading) does not hold against the seed the project actually runs. The slug-non-containment check (line 249) and the intro-vs-question difference (line 240) are sound, but the equality check is the load-bearing proof and it is incorrect — either it was never run green against `e2e/base`, or it asserts a contract the implementation does not provide.

**Fix:** Assert containment (the announcer title is a substring of the full heading group), or compare against the inner `<h1>` only:

```ts
const headingText = (await page.getByTestId(testIds.voter.questions.heading).textContent())?.trim() ?? '';
expect(headingText.length).toBeGreaterThan(0);
// The announcer carries the localized question TITLE; the heading hgroup also
// includes the pre-heading (category tag + N/M counter + election tags), so the
// title is a SUBSTRING of — not equal to — the full heading textContent.
expect(headingText).toContain(questionLabel);
```

Or, to keep an equality check, target the `<h1>` specifically:
`page.getByTestId('voter-questions-heading').getByRole('heading', { level: 1 })`. Either way, run it green via `yarn db:seed --template e2e/base` before merging.

## Warnings

### WR-01: Redundant `$effect`-inside-`$effect` registrar causes a transient empty-string announcer flash

**File:** `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:171-188`
**Issue:**
`setRouteTitle` is invoked from the consumer's own `$effect` (`MainContent.svelte:59-61`, `SingleCardContent.svelte:48-50`):

```ts
$effect(() => { setRouteTitle(title); });   // consumer (outer) effect
```

and internally creates a *second* `$effect`:

```ts
setRouteTitle(title) {
  $effect(() => {                            // inner/child effect
    untrack(() => { routeTitleValue = title; });
    return () => { untrack(() => { routeTitleValue = ''; }); };
  });
}
```

Because the inner effect reads `title` only inside `untrack`, it has no tracked dependencies and never re-runs on its own. It is recreated each time the outer effect re-runs (on `title` change). Svelte destroys a parent effect's children before re-running the parent, so a `title` change runs: child cleanup (`routeTitleValue = ''`) → outer body → new child (`routeTitleValue = title_new`). That produces a transient `''` between the two title values on every same-component title change (e.g. question A → B, which reuses the `[questionId]` `+page.svelte` per the spike findings). With `aria-atomic="true"` + `aria-live="polite"` the empty intermediate is usually coalesced, but it is fragile and the inner `$effect` contributes nothing the outer consumer effect does not already provide.

**Fix:** Drop the inner `$effect`; make the registrar a plain write that returns its reset, and let the *consumer's* effect own cleanup — mirroring `SettingsOverlay.use()`:

```ts
setRouteTitle(title) {
  untrack(() => { routeTitleValue = title; });
  return () => { untrack(() => { routeTitleValue = ''; }); };
}
```

```ts
$effect(() => setRouteTitle(title));   // returned cleanup auto-registered by the effect
```

This collapses to one effect, removes the flash, and matches the established pattern. (`setRouteTitle: (title: string) => void` at `layoutContext.type.ts:39` would become `=> (() => void)`.)

### WR-02: Cross-component navigation can blank the announcer if the outgoing component's cleanup runs after the incoming component's mount

**File:** `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:178-187`
**Issue:**
The registrar is "last-writer-wins" against a single shared `routeTitleValue`, with the cleanup unconditionally writing `''`. The doc comment assumes "only one title-bearing layout component is mounted per page." On a navigation that swaps `MainContent` → `SingleCardContent` (or vice versa), both the destroyed component's cleanup (`routeTitleValue = ''`) and the new component's mount write (`routeTitleValue = newTitle`) run. If the outgoing component's teardown fires *after* the incoming component's mount effect, the announcer is left at `''` and never announces the new route — the `aria-atomic` region then has nothing to speak.

**Fix:** Either guard the cleanup so it only clears when the value it wrote is still live:

```ts
return () => { untrack(() => { if (routeTitleValue === title) routeTitleValue = ''; }); };
```

or adopt the token-keyed approach `SettingsOverlay` already uses (push `{ id, title }`, revert only that id, derive `current` from the last live entry), which removes the "wrong cleanup blanks the live title" hazard entirely.

### WR-03: Registrar contract is inconsistent with the other three `use*` overlay registrars

**File:** `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:171-197`
**Issue:**
The context now exposes two registrar mechanisms: `useTopBar` / `usePageStyles` / `useNavigation` delegate to `settingsOverlay.use()` (which wraps `$effect(() => push(overlay))` and lets the returned revert handle cleanup), while `setRouteTitle` hand-rolls a nested `$effect` with a manual `''` reset. The divergence is the root of WR-01/WR-02 and makes the registrar surface harder to reason about. Aligning `setRouteTitle` with the `use()` shape (return a revert; the caller's effect owns it) makes all four registrars structurally identical.

**Fix:** Same refactor as WR-01, framed as API consistency — return a revert from `setRouteTitle` and rely on the caller's `$effect` for cleanup.

## Info

### IN-01: Stale/incorrect doc comments after the equality assertion is corrected

**File:** `tests/tests/specs/a11y/a11y-smoke.spec.ts:204-210, 251-252`
**Issue:**
The helper doc-comment (lines 204-210) and the inline comment at 251-252 state the announcer "equals the visible question heading textContent." That contract is not what the implementation provides (the heading element includes the pre-heading), and once CR-01 is fixed to containment these comments become wrong.
**Fix:** Reword both to state the announcer carries the question *title*, which is a substring of the full heading group text (category tag + counter + title).

### IN-02: Import-formatting nit in a touched file

**File:** `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:10`
**Issue:**
`import type { OptionalVideoProps,Video, VideoMode  } from '$lib/components/video';` is missing a space after the first comma and has a double space before the closing brace. Pre-existing, but in a file this delta touches. Cosmetic.
**Fix:** Run `yarn format`; expected `import type { OptionalVideoProps, Video, VideoMode } from '$lib/components/video';`.

---

_Reviewed: 2026-06-04T14:49:18Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
