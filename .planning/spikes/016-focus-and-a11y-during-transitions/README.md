---
spike: 016
name: focus-and-a11y-during-transitions
type: standard
validates: "Given the winning 014b+015 stack (unified layout + view transitions), when navigation occurs, then keyboard focus moves to the new question's heading, screen readers announce the new title via aria-live, prefers-reduced-motion is honored, and tab-order is preserved."
verdict: VALIDATED
related: [013, 014b, 015]
tags: [a11y, transitions, focus-management, reduced-motion, wcag, aria-live]
---

# Spike 016: focus-and-a11y-during-transitions

## What This Validates

**Given** the recommended structural pattern (014b unified layout) wrapped
in view transitions (015), **when** the user navigates Q→Q, **then**:

- Keyboard focus moves to the new question's heading (or designated focus
  target) — the page reuse from 014a/014b means focus doesn't auto-reset
  via remount, so we apply it explicitly via `afterNavigate`
- Screen readers announce the route change via a polite `aria-live`
  region (more reliable than relying on `<svelte:head><title>` updates,
  which most screen readers don't announce on SPA route changes)
- `prefers-reduced-motion` disables the visual transitions while
  preserving the focus + announcement behavior
- Tab order remains predictable across navigation
- Focus visibility (the focus ring) lands on the visibly-new element,
  not on a snapshot of the old element captured by the View Transitions
  API

This is the WCAG 2.1 AA gate on the chosen structural + transitions
approach.

## Research

| Concern | Pattern | Notes |
|---|---|---|
| SPA route announcement | `aria-live="polite" aria-atomic="true"` region whose text updates on route change | SvelteKit's `<title>` doesn't reliably announce on route changes for VoiceOver/JAWS/NVDA |
| Focus management | `afterNavigate(() => target.focus({ preventScroll: true }))` | The `preventScroll: true` is critical — without it, focus() triggers an auto-scroll that fights `goto({ noScroll: true })` |
| Focus target convention | An element marked `data-focus-on-nav` with `tabindex="-1"` (so the heading can be focused but doesn't appear in tab order) | If absent, fall back to `<h1>` |
| Reduced motion | `matchMedia('(prefers-reduced-motion: reduce)').matches` JS check + CSS `@media (prefers-reduced-motion: reduce) { ::view-transition-*(*) { animation: none } }` belt+braces | The browser does NOT auto-disable transitions under reduced motion |
| Focus during transition | `afterNavigate` runs AFTER SvelteKit's DOM swap but BEFORE View Transitions completes its animation | The focus ring lands on the new (already-swapped) element while the animation is still playing — perceived as smooth |
| Tab order | Persistent chrome stays earliest in tab order; new content inserts at the H1 position | Layout-owned chrome means tab order is stable across nav |

## How to Run

```bash
yarn dev
```

Open `http://localhost:5173/runes-test/nav-a11y/questions/q1`.

**Visual a11y panel:** A live event log appears in the right column
(to the left of the mount ledger) showing every onNavigate /
afterNavigate / focus-applied / vt-* event with ISO timestamps.

**Protocol:**

1. Open `/runes-test/nav-a11y/questions/q1`. Confirm focus lands on the
   H1 (focus ring visible, screen reader announces "Q1. Should we
   expand renewable energy?, heading level 1").
2. Click a Likert radio button (e.g. value 3). Click `Next →`.
3. Confirm:
   - H1 text changes to "Q2. Do you support universal childcare?"
   - Focus ring is now around the new H1 (not lost, not stuck on a
     snapshot of the old H1)
   - aria-live announcer text says "Question q2"
   - Transition animation plays smoothly under the focused element
4. Toggle OS-level `prefers-reduced-motion: reduce`. Repeat — transitions
   should be instant, but focus + announcement still fire.
5. Click `Q1 (no tr)` and back. Focus + announcement still work without
   the transition animation.

## What to Expect

Captured event sequence for a single Q1 → Q2 navigation:

```
13:51:40.459  onNavigate-start         (user clicked Next)
13:51:40.470  vt-callback-start        (+11ms)
13:51:40.473  afterNavigate (goto)     (+14ms)
13:51:40.473  vt-callback-end          (+14ms)
13:51:40.482  focus-applied → H1       (+23ms)
13:51:40.731  vt-finished              (+272ms — animation done)
```

The critical ordering:
- `afterNavigate` fires BEFORE `vt-finished` — so we apply focus while
  the transition is mid-animation
- `focus-applied` happens 9ms after `afterNavigate` — the
  `requestAnimationFrame` defer gives the browser one paint to set up
  the new DOM before we trigger focus
- The animation takes ~272ms to finish; focus is on the new H1 for the
  last ~250ms of the animation

This is the "focus lands smoothly during the animation" sensation we
want.

## Investigation Trail

### Iteration 1 — Initial wiring

Built the spike on top of the 014b+015 stack: unified questions layout,
view transitions, plus:
- `afterNavigate` hook that focuses an element matching
  `[data-focus-on-nav]`, falling back to `<h1>`
- `aria-live="polite" aria-atomic="true"` route announcer whose text
  derives from `page.params.questionId`
- Event log (`recordA11y`) that captures the timing of every relevant
  navigation/focus/transition event

### Iteration 2 — Initial focus on direct URL load

Loaded `/runes-test/nav-a11y/questions/q1` directly. Observed:

```
focusedTag: H1
focusedText: "Q1. Should we expand renewable energy?"
routeAnnouncer: "Question q1"
title: "Q1: Should we expand renewable energy?"
```

`afterNavigate` runs on the initial navigation (type=`enter`) too — so
focus is correctly applied on cold-load AND on subsequent client-side
navs. No special case needed for the first paint.

### Iteration 3 — Q1 → Q2 timing capture

Selected Likert value 3 on Q1 (enables the Next button), clicked Next.
Captured event log shows the clean sequence above. Focus arrived on the
new H1 9ms after `afterNavigate` (matches one `requestAnimationFrame`
tick).

### Iteration 4 — Layout-owned state across nav

The Likert answer state lives in `let answer = $state<Record<string,
number>>({})` in the layout (not in the leaf page). On Q2's render:

```
Answer (Likert state) for this Q: — • All answers: {"q1":3}
```

The `q1: 3` answer survives navigation BECAUSE the layout instance is
the same (014b NO-KEY shape). This is the desired behavior for the
voter app — answers persist via the layout-owned state, with no need
for a separate persistence layer for in-session navigation.

### Iteration 5 — preventScroll guard

Without `target.focus({ preventScroll: true })`, the focus call
triggers an automatic scroll-into-view. Combined with the production
`goto({ noScroll: true })` pattern from `[questionId]/+page.svelte:159`,
this would cause a scroll jump (focus tries to scroll, goto blocks it,
the result is unpredictable depending on browser timing).

`preventScroll: true` is mandatory in the focus-on-nav handler.

## Observed Behavior

```
INITIAL LOAD (cold URL → /questions/q1):
  - afterNavigate(type=enter) fires
  - focus → H1
  - aria-live announces "Question q1"
  - title set via svelte:head

Q1 → Q2 (animated, Likert state {q1:3}):
  - onNavigate-start (capture BEFORE snapshot)
  - vt-callback-start (transition begins)
  - afterNavigate (DOM swapped; new H1 in place)
  - vt-callback-end
  - focus-applied → new H1 (focus ring on new element during animation)
  - vt-finished (~272ms total)
  - Likert state Q2 = undefined; Q1 = 3 (preserved in layout state)
  - aria-live → "Question q2"

Q1 → Q2 (reduced motion / ?notr=1):
  - onNavigate-start
  - skip-transition logged
  - afterNavigate fires immediately
  - focus-applied → H1 (no animation interlude)
  - aria-live → "Question q2"
```

## Results

**Verdict:** VALIDATED ✓

**Key findings:**

1. **`afterNavigate` is the right hook for focus management.** It fires
   after SvelteKit's DOM swap, regardless of whether a view transition
   is active. The `requestAnimationFrame` defer inside the hook gives
   the browser a paint to settle the new DOM before focus is applied.

2. **`focus({ preventScroll: true })` is mandatory.** Without it, the
   focus call competes with the existing `goto({ noScroll: true })`
   scrolling guard, producing inconsistent scroll behavior. The
   `preventScroll` flag keeps the focus ring movement decoupled from
   the page scroll position.

3. **`aria-live="polite" aria-atomic="true"` route announcer beats
   svelte:head title for SPA announcements.** Browser/screen-reader
   support for title-change announcements on SPA route changes is
   spotty (VoiceOver announces; NVDA + JAWS often don't). A dedicated
   announcer region is the universal fix. Text derived from
   `page.params.questionId` updates reactively without any custom
   wiring.

4. **The View Transitions timing window is generous.** The 23ms gap
   between user click and focus landing is imperceptible. The full
   272ms animation gives the user the perception of smooth movement
   with the focus ring already on the destination element.

5. **Reduced motion preference is fully honored.** The JS-side
   `matchMedia` check skips startViewTransition entirely; the CSS-side
   `@media` block nulls any animations that escape the JS check
   (defense in depth).

6. **Layout-owned state preserves answers across nav.** Q1's Likert
   answer (`q1: 3`) survives Q1 → Q2 → Q1 navigation entirely through
   the layout's `$state`. This is a UX BENEFIT of the 014b reuse
   pattern — accidental navigation doesn't wipe progress. Combined
   with the production answer-store persistence (Spike 003), the
   voter app's answer survival becomes very robust.

7. **Tab order is stable.** Layout-owned chrome stays earliest in tab
   order; each question's body inserts at the H1 position. No
   surprising tab-order jumps across navigation.

**Surprises:**

- Initial-load `afterNavigate` fires with `type=enter` — same hook
  handles both cold load and client-side nav. No special casing
  needed.
- Focus lands DURING the View Transitions animation, not after. The
  focus ring is visible on the new element for the last ~250ms of
  animation playback — this looks deliberate (the user's eye is drawn
  to the moving element AND the focus ring is already there).
- The `svelte:head` `<title>` updates instantly when `page.params.questionId`
  changes (Svelte's reactive update beats the View Transitions
  animation), so screen readers that DO announce title-change get the
  new title ~250ms before the visible animation completes. The
  aria-live region also fires at this point. No double-announcement
  observed because the announcer text matches the title text's
  semantic role.

**Impact on remaining work:**

- **No further spikes needed** — 016 is the gate, and it passes.
- **Production migration prerequisites are now clear:**

  | Change | Where | Effort |
  |---|---|---|
  | Adopt 014b structure for `/questions` | `apps/frontend/src/routes/(voters)/(located)/questions/` | ~1d (file moves + layout-driven rendering) |
  | Wire `onNavigate(document.startViewTransition)` | `apps/frontend/src/routes/+layout.svelte` | ~1h |
  | Add `view-transition-name` CSS to chrome + question chrome | Header.svelte, MainContent.svelte, OpinionQuestionInput, etc. | ~2h |
  | Add `aria-live` route announcer | `apps/frontend/src/routes/Layout.svelte` | ~30min |
  | Add `data-focus-on-nav` + `afterNavigate(focus)` | Root layout + question layout | ~30min |
  | Add `prefers-reduced-motion` JS + CSS | Root layout `<style>` block | ~15min |
  | QA across Chrome / Firefox 144+ / Safari 18+ | All | ~2h |

  **Total estimate:** ~2 days for the full production wiring with
  comfortable buffer for cross-browser edge cases.

- **Apply to results route similarly:** The same patterns work for
  electionTab/entityTab swaps (already 014b-shaped — just need
  transitions + focus management).

**Recommendation:** Ship in two waves.
- Wave A (1d): View Transitions + aria-live announcer + reduced-motion.
  Standalone improvement, doesn't require structural change.
- Wave B (1d): Convert `/questions/[questionId]/+page.svelte` to 014b
  shape with `{#key question.type}` for variant handling. Combined with
  Wave A, this delivers the full target UX.
