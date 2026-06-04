---
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - apps/frontend/src/lib/utils/viewTransition.ts
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/Header.svelte
  - apps/frontend/src/routes/MainContent.svelte
  - apps/frontend/src/lib/components/questions/QuestionActions.svelte
  - apps/frontend/src/lib/components/tabs/Tabs.svelte
  - apps/frontend/src/lib/components/tabs/Tabs.type.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 99: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

The View-Transitions + navigation-a11y stack is structurally sound: `shouldAnimate()` correctly short-circuits on SSR / missing-API / reduced-motion / `?notr=1`; the `onNavigate` hook reads `navigation.to?.url` (not `page.url`) and follows the canonical `startViewTransition(async () => { resolve(); await navigation.complete; })` pattern; the reduced-motion CSS guard uses the parser-valid `@media { :global(...) }` nesting; and `view-transition-name`s appear unique per rendered page. No `any` was introduced in the typed wrapper.

However, the **WCAG 2.1 AA route-announcer (NAVA11Y-01) is broken in two ways that the test suite does not catch**, and the **focus-reset fallback (NAVA11Y-02) silently no-ops on the majority of pages**. Both are blocking because the phase's stated deliverable is WCAG 2.1 AA correctness, and CLAUDE.md makes localization + a11y mandatory. There is also a real type-safety hole in the `Tabs` `onChange` payload.

## Critical Issues

### CR-01: Route announcer text is hardcoded English and exposes opaque IDs — violates localization mandate and is meaningless to screen-reader users

**File:** `apps/frontend/src/routes/+layout.svelte:232-234`

The aria-live region is the NAVA11Y-01 deliverable, yet its text is:

```svelte
<div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">
  {page.params.questionId ? `Question ${page.params.questionId}` : 'Questions list'}
</div>
```

Two defects:

1. **Hardcoded English literals** (`` `Question ...` `` / `'Questions list'`). CLAUDE.md: "all user-facing strings must support multiple locales." A screen-reader region IS user-facing. On a non-English VAA the announcer speaks English into an otherwise-localized app.

2. **`page.params.questionId` is an opaque DB id** (e.g. `seed_q_abc123`). Announcing "Question seed_q_abc123" is useless to a screen-reader user — it should announce the page title / question text, not the route slug. The phase notes even claim the announcer "derives text from page params (not `<svelte:head><title>`)" as a design choice, but the param chosen carries no human-readable content.

Additionally the announcer only distinguishes `questionId` present/absent — every other route (`/elections`, `/results`, `/constituencies`, candidate pages) collapses to the literal `'Questions list'`, which is actively wrong on those routes.

**Fix:** Drive the announcer from a localized, human-readable label. The `<svelte:head><title>` value (already localized via `t('dynamic.appName')` and the per-page `MainContent` `title`) is the natural source, or expose a derived page-title in a context. Example using a translated label + readable title:

```svelte
<script lang="ts">
  // Derive a localized, human-readable announcement. Prefer the page title that
  // MainContent already sets; fall back to a translated generic label.
  import { page } from '$app/state';
  // assuming a layout-level store/context that mirrors the current page title
  const announcement = $derived(
    page.data.pageTitle ?? t('common.pageChanged') // localized fallback
  );
</script>

<div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">
  {announcement}
</div>
```

At minimum, replace the English literals with `t(...)` keys and use the question's `text` (localized) rather than its `id`.

---

### CR-02: `afterNavigate` focus fallback silently no-ops on every page that relies on the default `<h1>` — NAVA11Y-02 contract is not met app-wide

**File:** `apps/frontend/src/routes/+layout.svelte:176-182`, `apps/frontend/src/routes/MainContent.svelte:82`

The focus reset is:

```ts
const target =
  document.querySelector<HTMLElement>('[data-focus-on-nav]') ?? document.querySelector<HTMLElement>('h1');
target?.focus({ preventScroll: true });
```

The `[data-focus-on-nav]` marker is only placed on the two question-heading callsites (voter + candidate `QuestionHeading`, which also carry `tabindex="-1"`). For **every other route**, the fallback selects the default heading rendered by `MainContent`:

```svelte
<h1>{title}</h1>   <!-- MainContent.svelte:82 — no tabindex -->
```

A bare `<h1>` is **not focusable**. `HTMLElement.focus()` on a non-focusable element is a silent no-op — no error, no focus move. So on the results page, elections selector, constituencies selector, home, and all candidate pages without an explicit marker, the navigation focus reset does nothing: focus stays where it was (often on the activated link, or lost to `<body>`), defeating the WCAG 2.4.3 / 3.2.x intent the phase set out to satisfy.

The a11y test (`assertFocusOnHeading`) only exercises the question route, which *does* have the marker — so the suite is green while the contract is broken everywhere else. This is a false sense of coverage.

**Fix:** Make the fallback target focusable. Either add `tabindex="-1"` to the default `<h1>` in `MainContent.svelte`:

```svelte
<h1 tabindex="-1" data-focus-on-nav>{title}</h1>
```

or make the layout fallback robust by applying a temporary tabindex before focusing:

```ts
const target =
  document.querySelector<HTMLElement>('[data-focus-on-nav]') ?? document.querySelector<HTMLElement>('h1');
if (target) {
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}
```

Then extend the a11y spec to assert focus landing on at least one non-question route (e.g. results) so the regression is caught.

## Warnings

### WR-01: `Tabs.onChange` payload can pass `undefined` as `tab` while the type declares it required — type-safety hole + downstream cast hazard

**File:** `apps/frontend/src/lib/components/tabs/Tabs.svelte:53`, `apps/frontend/src/lib/components/tabs/Tabs.type.ts:15`

```ts
onChange?.({ index, tab: tabs[index] });   // tabs[index] is Tab | undefined
```

The type is `onChange?: (details: { index?: number; tab: Tab }) => void;` — `tab` is **non-optional**. Indexed array access can yield `undefined` (e.g. if `activate(index)` is ever called with an out-of-range index, or `tabs` mutates between render and click). The compiler does not flag this because element access on `Array<Tab>` returns `Tab` unless `noUncheckedIndexedAccess` is on. Consumers then treat `tab` as definitely present:

- `EntityDetails.handleContentTabChange({ tab })` does `(tab as ContentTab).content` — a cast that would read `.content` off `undefined` and crash.
- `results/+layout.svelte:handleEntityTabChange` reads `tab as EntityTab | undefined` (this one is defensively typed — good), but the source type contract is still wrong.

**Fix:** Either make the contract honest (`tab?: Tab`) and force callers to guard, or guard at the source so the invariant holds:

```ts
function activate(index: number): void {
  const tab = tabs[index];
  if (tab == null) return;            // do not fire onChange / mutate for an invalid index
  // ... transition / assignment ...
  onChange?.({ index, tab });
}
```

### WR-02: View-Transition update callback can produce an unhandled promise rejection if `navigation.complete` rejects

**File:** `apps/frontend/src/routes/+layout.svelte:164-169`

```ts
return new Promise<void>((resolve) => {
  startViewTransition(async () => {
    resolve();
    await navigation.complete; // SvelteKit swaps the DOM here
  });
});
```

`resolve()` is called first (correct — unblocks SvelteKit), then `await navigation.complete`. If the navigation fails (rejects), the async callback's returned promise rejects. That promise is handed to `document.startViewTransition` and surfaces via `transition.updateCallbackDone` / `transition.finished`, neither of which is awaited or `.catch()`-ed here. Depending on browser, a failed navigation produces an unhandled rejection logged to the console. The outer `Promise<void>` already resolved, so SvelteKit is unaffected, but the dangling rejection is noise and can trip error-tracking.

**Fix:** Swallow the post-resolve rejection explicitly:

```ts
startViewTransition(async () => {
  resolve();
  await navigation.complete.catch(() => {}); // navigation failure already handled by SvelteKit
});
```

### WR-03: `aria-atomic="true"` + identical announcer text across consecutive same-type navigations may not re-announce

**File:** `apps/frontend/src/routes/+layout.svelte:232-234`

Because the text only varies on `questionId` presence (CR-01), navigating question → question changes `Question <idA>` → `Question <idB>` (re-announces, OK), but navigating between two routes that both fall into the `'Questions list'` branch (e.g. `/results` → `/elections`) leaves the text **byte-identical**. Screen readers generally do not re-announce an `aria-live` region whose text content did not change, so those route changes are announced as nothing. This is the same root cause as CR-01 (text not derived from a per-route human-readable label) and will be resolved by fixing CR-01, but is called out separately because it is a distinct a11y failure mode (no announcement at all, vs. wrong-language announcement).

**Fix:** Ensure the announcer text is unique per landed route (a localized page title per CR-01 naturally is).

### WR-04: `?notr=1` escape-hatch param leaks into the rendered/canonical URL and persists across subsequent navigations

**File:** `apps/frontend/src/lib/utils/viewTransition.ts:41`, consumed via `apps/frontend/src/routes/+layout.svelte:163`

`shouldAnimate` honors `destUrl.searchParams.get('notr') === '1'`. The voter question flow builds next/previous URLs with `$getRoute(...)` and `results/+layout.svelte:buildListRoute` appends `page.url.search` verbatim (line 262). Once a user (or a deeplink) lands on a URL carrying `?notr=1`, that param is preserved through `page.url.search` concatenation into every subsequent results navigation, permanently disabling transitions for the session and polluting shareable URLs. The test fixture relies on this stickiness, but in production it is a latent UX defect: a single `?notr=1` deeplink silently kills animation site-wide for that user with no way to clear it short of editing the URL.

**Fix:** Treat `notr` as session-scoped rather than URL-sticky (e.g. read it once, store in a non-persistent flag), or strip it from `page.url.search` in `buildListRoute` / route builders so it does not propagate:

```ts
const search = new URLSearchParams(page.url.search);
search.delete('notr');
const qs = search.toString();
return `/results${electionSegment}${pluralSegment}${qs ? `?${qs}` : ''}`;
```

### WR-05: `getNextQuestionId` dead-branch condition — `findIndex` never returns `null`, so the `index != null` guard masks the real `-1` (not-found) case

**File:** `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:105-110`

```ts
const index = unansweredOpinionQuestions.findIndex((q) => q.id === question.id);
return index != null && index < unansweredOpinionQuestions.length - 1
  ? unansweredOpinionQuestions[index + 1]?.id
  : undefined;
```

`Array.prototype.findIndex` returns `-1` when not found, never `null`/`undefined`. So `index != null` is always `true` and is dead. More importantly, when the current question is **not** in `unansweredOpinionQuestions` (already answered — a real case on this page), `index === -1`, and `-1 < length - 1` is `true`, so it returns `unansweredOpinionQuestions[0]?.id` — the *first* unanswered question, not "no next question." This is a logic bug: re-visiting an already-answered question computes a wrong `nextQuestionId` and therefore a wrong submit route/label.

**Fix:** Guard on the real not-found sentinel:

```ts
const index = unansweredOpinionQuestions.findIndex((q) => q.id === question.id);
if (index === -1) return undefined; // current question is not in the unanswered set
return index < unansweredOpinionQuestions.length - 1
  ? unansweredOpinionQuestions[index + 1]?.id
  : undefined;
```

## Info

### IN-01: Commented-out "Stashed for video" block is dead code

**File:** `apps/frontend/src/routes/Header.svelte:47-61`

A sizable block of commented-out `videoHeight`/`videoWidth`/`invertLogo` logic plus the `<!-- {hasVideo ? ... } -->` template comment (line 64) and inline comments (lines 81, 92) are retained. Per the review checklist, commented-out code should be removed (git history preserves it) or tracked behind a real TODO with a ticket.

**Fix:** Delete the stashed block, or replace with a single `// TODO(<issue>): restore video-aware header` reference.

### IN-02: Announcer relies on an `id` selector as its only test/contract hook — brittle

**File:** `apps/frontend/src/routes/+layout.svelte:232`, `tests/tests/specs/a11y/a11y-smoke.spec.ts:209`

The `#route-announcer` element has no `role` and no `data-testid`; the test reaches it via a raw `page.locator('#route-announcer')` with two eslint-disable lines. This works but couples the test to an id and required suppressing project lint rules. A `data-testid` (or relying on the implicit `status`/`log` role via `aria-live`) would be a more stable contract and avoid the lint escape hatches.

**Fix:** Add `data-testid={testIds...}` to the announcer and select by it.

### IN-03: `transitionOnChange` is opt-in but every navigation-driven `Tabs` callsite must remember to leave it `false` — easy to misuse

**File:** `apps/frontend/src/lib/components/tabs/Tabs.svelte:39-54`, `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:381-386`

The results-page `Tabs` (navigation-driven) correctly omits `transitionOnChange`, and `EntityDetails` (local-state) opts in — both correct today. But the design is footgun-prone: a future navigation-driven `Tabs` that sets `transitionOnChange` would wrap a local `activeIndex` mutation in a view transition that then races the global `onNavigate` transition (double transition / flicker). Worth a guard comment in the component, or an assertion that `transitionOnChange` and an `onChange` that triggers `goto` are mutually exclusive.

**Fix:** Document the constraint at the `activate()` site, or detect/warn in dev when both a transition wrap and a navigating `onChange` are configured.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
