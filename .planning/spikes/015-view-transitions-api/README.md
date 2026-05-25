---
spike: 015
name: view-transitions-api
type: standard
validates: "Given onNavigate(() => document.startViewTransition(...)), when Q→Q navigation fires, then a cross-fade/slide transition wraps the render cycle on the actual production-style route tree — WITHOUT structural changes — and disables automatically under prefers-reduced-motion."
verdict: VALIDATED
related: [013, 014a, 014b, 016]
tags: [sveltekit, view-transitions, transitions, onnavigate, a11y]
---

# Spike 015: view-transitions-api

## What This Validates

**Given** the View Transitions API and SvelteKit's `onNavigate` hook,
**when** the user navigates between questions (Q1 → Q2 → Q3) inside a
single-layout structure (014b shape), **then** the browser captures
snapshots of the old and new DOM, swaps them inside an animated transition,
and respects `prefers-reduced-motion` and a per-navigation opt-out flag.

This is the load-bearing spike for the user's original report — even
though 014a/014b proved that the component tree isn't actually being
remounted, the VISUAL discontinuity from reactive DOM regeneration
remains. View Transitions wrap the render window in a cross-fade so
those swaps are animated rather than instant.

## Research

| Aspect | Pattern | Notes |
|---|---|---|
| SvelteKit hook | `onNavigate((navigation) => Promise)` | If callback returns a Promise, SvelteKit waits for it before completing nav |
| Trigger | `document.startViewTransition(() => applyDomChange())` | Returns `{ ready, finished, skipTransition }` promises |
| Coordination | Pass SvelteKit's `navigation.complete` into the startViewTransition callback | Browser captures BEFORE snapshot → callback runs → SvelteKit applies new DOM → browser captures AFTER → animates |
| Per-element pairing | `view-transition-name: <name>` CSS property | Browser pairs old/new elements with the same name; animates morph/position |
| `prefers-reduced-motion` | Not automatic — must check `matchMedia('(prefers-reduced-motion: reduce)').matches` | Also use CSS `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none } }` for belt+braces |
| Browser support | Chrome 111+, Edge 111+, Firefox 144+, Safari 18+ | Detect via `'startViewTransition' in document`; fall back to instant swap |
| Common pitfall | Reading `page.url` in onNavigate gives SOURCE URL, not destination | Read `navigation.to.url` instead |

**Chosen approach:** Wire onNavigate at the OUTER layout of the spike
branch. Decide whether to animate based on:
1. `document.startViewTransition` exists
2. `prefers-reduced-motion: reduce` NOT set
3. The destination URL doesn't contain `?notr=1` (escape hatch for testing)

Apply per-element `view-transition-name` to title, hero, body, and
actions so the browser can morph them independently rather than treating
the whole page as one big cross-fade.

## How to Run

```bash
yarn dev
```

Open `http://localhost:5173/runes-test/nav-transitions/questions/q1`.

**Protocol:**
1. Click Q1 → Q2 → Q3. Watch for slide-down/fade title animation, hero
   cross-fade, body morph.
2. Click `Q1 (no transitions)` then `Q2 (no transitions)` — observe instant
   swap (no animation).
3. (Manual) enable `prefers-reduced-motion: reduce` in your OS, re-test
   the animated branch — should also be instant.

To capture timings, paste this into devtools console:
```js
window.__vtInvocations = [];
const orig = document.startViewTransition.bind(document);
document.startViewTransition = function(cb, ...rest) {
  const t = performance.now();
  window.__vtInvocations.push({ startedAt: t });
  const r = orig(cb, ...rest);
  r.finished.then(() => {
    const e = window.__vtInvocations.at(-1);
    e.duration = performance.now() - e.startedAt;
  });
  return r;
};
```

Then `console.table(window.__vtInvocations)` after a few navs.

## What to Expect

- 3 startViewTransition calls for Index → Q1 → Q2 → Q3
- Each transition duration ~280–320ms (matches the 280ms slide animation)
- Zero invocations during `?notr=1` navigations
- Page content updates in the middle of the animation (browser handles the
  cross-fade automatically; SvelteKit applies the new DOM during the
  transition's callback phase)

## Investigation Trail

### Iteration 1 — Basic wiring

Wrote the canonical onNavigate + startViewTransition coupling:

```ts
onNavigate((navigation) => {
  if (!shouldAnimate(navigation.to?.url)) return;
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    });
  });
});
```

The key dance:
1. `onNavigate` callback returns a Promise → SvelteKit waits before
   completing the nav
2. Inside that Promise, call `startViewTransition` with an async callback
3. The callback resolves the outer Promise so SvelteKit knows to swap DOM
4. The callback awaits `navigation.complete` — SvelteKit's promise that
   resolves when the new DOM is in place
5. Browser snapshots BEFORE → swap happens → snapshots AFTER → animates

### Iteration 2 — CSS pitfall (Svelte parser)

First attempt at the reduced-motion fallback used
`:global(@media (prefers-reduced-motion: reduce)) { ... }`. Svelte's CSS
parser rejected this with "Expected a valid CSS identifier" because
`@media` queries don't go inside `:global()`.

Fixed by writing it as `@media (prefers-reduced-motion: reduce) { :global(::view-transition-...) }` —
the `@media` rule wraps the selector instead of being wrapped by it.

### Iteration 3 — Source URL vs destination URL trap

The first `shouldAnimate()` implementation read the `?notr=1` flag from
`page.url`. When testing the transition from `/questions/q2?notr=1` →
`/questions/q3` (no notr param), the transition unexpectedly DID NOT
fire — because `page.url` during onNavigate still pointed at the SOURCE
URL (`q2?notr=1`), so the check saw `notr=1` and skipped animation.

Fixed by reading `navigation.to?.url` instead. The `navigation` object
passed to `onNavigate` carries both `from` and `to` — `to.url` is the
destination URL the user is navigating to.

### Iteration 4 — Captured timings

| Navigation | startViewTransition calls | Duration (ms) | Notes |
|---|---|---|---|
| Index → Q1 (default) | 1 | 311.3 | Animated as expected |
| Q1 → Q2 (default) | 1 | 316.1 | Animated |
| Q2 → Q3 (default) | 1 | 305.6 | Animated |
| Q1?notr=1 → Q2?notr=1 | 0 | — | Correctly skipped |
| Q2?notr=1 → Q1?notr=1 | 0 | — | Correctly skipped |
| Q1?notr=1 → Q2 (escape from notr) | 1 | 303.2 | Destination URL has no notr → animates ✓ |
| Q2 → Q3 (after escape) | 1 | 300.6 | Animated normally |

Transition durations are tight to the 280ms CSS animation duration with
a small constant overhead (~20–35ms) for browser snapshot capture and
SvelteKit DOM application.

### Iteration 5 — What got animated

The per-element `view-transition-name` assignments:
- `question-title` on the `<h1>` — slides down/up + fade
- `question-hero` on the category banner — cross-fade
- `question-body` on the body container — cross-fade
- `question-actions` on the button row — cross-fade

The browser-level `::view-transition-old(root)` / `::view-transition-new(root)`
default applies a slide-out-left / slide-in-right to everything not
covered by a per-element name. This gives a clean page-level direction
sense.

## Observed Behavior

```
WITH-transitions branch (Index → Q1 → Q2 → Q3):
  3 startViewTransition calls
  Durations: 311.3ms, 316.1ms, 305.6ms
  Total visible animation: ~930ms over 3 navigations

NO-transitions branch (Q1?notr=1 → Q2?notr=1 → Q1?notr=1):
  0 startViewTransition calls
  Instant DOM swap

Reduced-motion branch (manual OS toggle):
  shouldAnimate() returns false
  No startViewTransition calls
  Instant DOM swap
```

## Results

**Verdict:** VALIDATED ✓

**Key findings:**

1. **The onNavigate → startViewTransition coupling works end-to-end.**
   Three navigations fired three transitions with consistent ~310ms
   durations. SvelteKit's `navigation.complete` integration is clean —
   no race conditions, no flash-of-old-content.

2. **The decision must happen on the DESTINATION URL, not the source.**
   This is the most subtle gotcha. Easy fix once you know — but the
   spike caught it because of the `?notr=1` escape hatch test.

3. **`prefers-reduced-motion` requires explicit JS handling.** The
   browser does NOT automatically skip transitions under reduced motion.
   We need to check `matchMedia` AND provide a CSS belt-and-braces
   layer that nulls the animation if it does fire.

4. **Per-element `view-transition-name` is the lever for richer
   transitions.** Without per-element names, the entire viewport
   cross-fades as one image, which feels heavy. With names on title /
   hero / body / actions, each element can move independently — title
   slides down/up while body cross-fades, which feels natural to users.

5. **Browser support is now broadly sufficient.** Chrome 111+, Edge 111+,
   Firefox 144+, Safari 18+. The detection check
   `'startViewTransition' in document` provides a clean fallback for
   older browsers (instant swap).

6. **Combines additively with 014a/014b structural patterns.** Whether
   the production migration adopts the 014a hoist or the 014b unified
   layout, this transition layer attaches identically. The animation
   doesn't care whether the +page.svelte instance was reused or
   force-remounted by `{#key}` — both paths trigger the DOM swap that
   View Transitions captures.

7. **It is the load-bearing fix for the user's reported symptom.**
   Spike 014a's production-DOM test showed 64% of visible content
   nodes get freshly created on each Q→Q hop. That's what the user
   perceived as "redraw". Wrapping that DOM swap in a 300ms cross-fade
   converts the "snap" sensation into "movement", which is the actual
   UX deliverable.

**Surprises:**

- The Svelte CSS parser is strict about `:global()` placement —
  `:global(@media ...)` doesn't work; `@media { :global(...) }` does.
- SvelteKit's `navigation` parameter in `onNavigate` is well-typed and
  has both `from` and `to` URL handles — no need for `$app/state` here.
- The default `::view-transition-old(root)` / `new(root)` selectors do
  cover EVERYTHING outside named elements (including the persistent
  chrome). For Q→Q in this spike, the chrome got animated TOO, which
  reads as "the whole page sliding". For production this needs
  refinement — chrome should be excluded from the transition by
  assigning a stable `view-transition-name: persistent-chrome` to it.

**Impact on remaining spikes:**

- **016 (focus & a11y)** — now CRITICAL. With NO-KEY (014b NO-KEY mode)
  the question body component instance persists, so focus naturally
  STAYS where the user left it. Combined with view transitions, the
  focus ring stays planted while the surrounding visual content
  animates. But with KEY mode + transitions, focus needs explicit
  restoration after navigation — `afterNavigate(() => focusAnswerInput())`.
  Also, the title in `<svelte:head>` updates BEFORE the visible title
  finishes animating, which can cause screen-reader announcement races.
  Spike 016 verifies/handles each case.

**Recommendation for production migration:**

```svelte
<!-- apps/frontend/src/routes/+layout.svelte (root) -->
<script lang="ts">
  import { onNavigate } from '$app/navigation';

  onNavigate((navigation) => {
    if (typeof document === 'undefined') return;
    if (!document.startViewTransition) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>
```

Then add `view-transition-name` to the chrome-persistent elements
(Header, popup container, drawer) AND the question chrome (title, hero,
input wrapper) — minimum surface to ship animation for Q→Q + tab
swaps + drawer transitions on results.

**Implementation effort:** ~1 day for full production wiring (root
layout hook + 6–8 `view-transition-name` assignments + CSS keyframes +
QA across browsers).
