---
spike: 014b
name: single-page-url-keyed
type: comparison
validates: "Given a single layout that owns ALL rendering with active question derived from page.params.questionId, when navigating Q→Q, then there is exactly ONE +page.svelte mount across the session; a {#key questionId} block can be opted into when surgical remount is desired."
verdict: VALIDATED
related: [013, 014a, 015]
tags: [sveltekit, url-as-state, key-block, comparison]
---

# Spike 014b: single-page-url-keyed

## What This Validates

**Given** a `/runes-test/nav-keyed-content/` route where the layout
(`questions/+layout.svelte`) owns ALL rendering — title, hero, body,
actions — with the active question derived from `page.params.questionId`,
**when** the user navigates Q1 → Q2 → Q3, **then**:

- The `+page.svelte` is an empty stub (SvelteKit requires a leaf) — one
  mount for the whole session
- The entire rendered tree is owned by the layout, identical to the
  production `results/[[electionTab]]/+layout.svelte` pattern
- A `{#key questionId}` block lets the layout opt into per-question
  component remount when needed; without the key, the same component
  instance reactively updates

This spike specifically tests the **KEY vs NO-KEY** trade-off — when the
remount is wanted (state-reset semantics) and when reactive update wins
(state-preservation, no DOM churn).

## Research

Production already uses this pattern at
`apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`
— the layout owns the entire results render, the deepest +page.svelte is
empty, and a `{#key activeElectionId:activeEntityType}` block at
line 398 force-remounts `EntityListWithControls` to scope filter state
per (electionId, entityType) tuple (Phase 62 D-14 per Sequel codebase).

This spike replicates the production pattern in the question domain and
toggles the `{#key}` block via `?nokey=1` to enable head-to-head
observation.

| Approach | Pattern | When it wins | When it loses |
|---|---|---|---|
| **A. Reactive update (no key)** | Same component instance; props change drive Svelte's diff | Identical question shape (e.g. Likert→Likert); want state preservation across nav | Different question variant requires different component (open-text vs Likert) |
| **B. `{#key questionId}` force-remount** | Component destroys + remounts on every Q | Different question types per Q; need clean teardown of subscriptions, effects, focus rings | DOM churn cost is real (mirrors what Spike 013 captured for production's KeyedEntityList) |
| **C. Hybrid — key only on the variant-dependent leaf** | `{#key question.type}` (not `question.id`) — keys only when question TYPE changes, not on every Q | Voter app's reality (most Q→Q is Likert→Likert) — minimum churn, maximum state preservation | Requires careful identification of which sub-component truly needs the key |

**Chosen approach:** Build both A and B in the spike with a runtime toggle
(`?nokey=1`), capture the head-to-head behavior, and recommend **C** for
the production migration based on observed trade-offs.

## How to Run

```bash
yarn dev
```

Open `http://localhost:5173/runes-test/nav-keyed-content/questions/q1`.

**Protocol:**

1. Click **Clear** in the ledger panel
2. Type something into the scratchpad input on Q1
3. Click `Q2`, then `Q3`. Watch the ledger AND the scratchpad value
4. Repeat with the `Q1 (no key)` / `Q2 (no key)` links — note the
   different behavior

Compare with spikes 013 (production-mirror) and 014a (layout-hoisted).

## What to Expect

**KEY mode (default):**
- 1 destroy event per Q→Q hop (KeyedQuestionBody destroys)
- Scratchpad clears on every nav
- DOM `data-mount-id` for the body changes

**NO-KEY mode (`?nokey=1`):**
- 0 events
- Scratchpad PERSISTS across multiple navigations
- DOM `data-mount-id` for the body stays constant

## Investigation Trail

### Iteration 1 — Build the unified-layout pattern

Created `questions/+layout.svelte` that owns the entire render: title,
hero, body (via `QuestionBody.svelte`), and actions. Used `[[questionId]]`
optional param so `/questions` and `/questions/qN` both match this layout.
Made `+page.svelte` an empty stub.

The layout reads `useKey = $derived(page.url.searchParams.get('nokey') !== '1')`
and renders the body inside `{#key questionId}` or outside it, toggled by
the URL search param.

### Iteration 2 — KEY mode trial

```
Q1 → typed "TYPED-ON-Q1-KEYED" → Q2 → Q3
Captured ledger:
  13:41:48.765  ▽ destroy  KeyedQuestionBody  90ab5820
  13:41:49.273  ▽ destroy  KeyedQuestionBody  59ffe5f0
Final scratchpad value: "" (empty)
```

Two destroys captured (Q1→Q2 and Q2→Q3) corresponding to the
`{#key questionId}` block tearing down the body on each URL change.
The mounts for the replacements aren't recorded (same instrumentation
race as Spike 013), but the destroys + the empty scratchpad confirm
remount-and-state-reset behavior.

### Iteration 3 — NO-KEY mode trial

```
Q1?nokey=1 → typed "TYPED-ON-Q1-NOKEY" → Q2?nokey=1 → Q1?nokey=1 (return)
Captured ledger:
  (no events)
Final scratchpad value: "TYPED-ON-Q1-NOKEY" ← PRESERVED!
Final mount-id for .body element: e836683f (same as initial)
```

ZERO ledger events. The body's `data-mount-id` stayed constant across
two navigations. The scratchpad text survived the entire trip. The
component reactively updated its visible content (`questionId` text and
`Q: <text>` headline) without ever being torn down.

### Iteration 4 — Head-to-head with 014a

| Property | 014a (page-with-body) | 014b NO-KEY | 014b KEY |
|---|---|---|---|
| Layout-owned chrome | yes | yes | yes |
| `+page.svelte` mount cycles | 0 (per Svelte-Kit reuse) | 0 (empty stub) | 0 |
| `QuestionBody`-equivalent mount cycles | 0 | 0 | 1 per Q→Q hop |
| Local `$state` in body | persists | persists | resets per Q |
| DOM `data-mount-id` for body | stable | stable | changes per Q |
| Suitable for | mixed question types (since SvelteKit's same-component reuse already happens) | same question type across all Q (no input swap) | mixed question types (Likert vs text vs slider) |
| Code complexity | medium (snippets across layout boundary) | low (single layout file) | low + 1 line |

Both achieve mount stability for the chrome. The DIFFERENCE between 014a
and 014b NO-KEY is purely organizational. 014b KEY is the only variant
that actually changes runtime behavior (forces remount). The KEY pattern
exists for cases where state reset is REQUIRED (different question
variant components, dirty subscriptions, etc.).

## Observed Ledger

**KEY mode:**
```
13:41:48.765  ▽ destroy  KeyedQuestionBody  90ab5820  ← Q1→Q2 destroy
13:41:49.273  ▽ destroy  KeyedQuestionBody  59ffe5f0  ← Q2→Q3 destroy
```

**NO-KEY mode:**
```
(0 events; mountIds constant; scratchpad value preserved)
```

## Results

**Verdict:** VALIDATED

**Key findings:**

1. **The unified-layout pattern (production results pattern, applied to
   questions) works end-to-end.** Layout owns rendering, `+page.svelte`
   is a no-op stub, URL drives the active question via per-field reads
   on `page` (CONVENTIONS.md §9).

2. **`{#key}` is a runtime opt-in for force-remount.** Without it, the
   component reactively updates and preserves local `$state`. With it,
   the component destroys + remounts and resets state. The choice
   depends on what the per-Q variation actually needs.

3. **For the OpenVAA voter app today: NO-KEY is the right default.**
   Most opinion questions are Likert-scale variants of the same shape.
   The current `OpinionQuestionInput` already takes `question` as a
   prop and re-renders its choices based on the prop. State preservation
   across nav is mildly nice (e.g. a "save-as-draft" textarea for an
   open-question variant would survive accidental nav).

4. **`{#key question.type}` (hybrid C) is the recommended production
   pattern.** It keys on the question VARIANT (Likert / open-text /
   numeric / categorical) rather than the question ID. Within a run of
   Likert questions, the input stays mounted; when switching from
   Likert to open-text, it remounts cleanly. This matches the
   production `EntityListWithControls` `{#key activeElectionId:activeEntityType}`
   pattern at a different granularity.

5. **014a vs 014b is a code-style choice, not a behavior choice.** Both
   achieve mount stability identically (because SvelteKit already reuses
   `+page.svelte` across param-only URL changes). 014b is closer to
   production's results pattern; 014a is closer to a familiar
   "page contains the page" pattern. The codebase already uses BOTH
   patterns in different places (results = 014b shape, questions = 014a
   shape minus the layout hoist), so consistency is a wash.

**Surprises:**

- The optional `[[questionId]]` param matches both `/questions` and
  `/questions/qN` with the SAME layout instance. Navigating
  `/questions/q1` → `/questions` keeps `KeyedQuestionsLayout` alive (the
  ledger confirms this — no destroy when transitioning through the
  index URL).
- The "no key" mode preserved the scratchpad even across Q1 → Q2 → Q1
  return-trip. This is more state-preservation than a user would
  intuitively expect from a routed app — a feature, not a bug, but
  worth flagging for a11y considerations (focus management) in
  Spike 016.

**Impact on remaining spikes:**

- **015 (view-transitions-api)** — now the LOAD-BEARING spike for the
  user's reported symptom. Whether we ship 014a or 014b structure, the
  visual redraw the user perceives needs to be animated. View
  Transitions wraps the render cycle regardless of structural pattern.
- **016 (a11y gate)** — needs to handle the NO-KEY case explicitly.
  Focus management on Q→Q navigation no longer happens "for free" via
  remount (because there IS no remount). An `afterNavigate` hook or
  `$effect(() => questionId)` is needed to e.g. focus the answer input
  after each Q→Q.

**Recommendation for the production migration:**

Adopt the **014b shape** (layout owns rendering, empty leaf page) for
the questions branch, MATCHING the existing results pattern. Add a
`{#key question.type}` wrapper around the input component to handle
mixed question variants cleanly. The migration is mostly file-shuffling
plus one `$derived(page.params.questionId)` lookup added to the layout.
