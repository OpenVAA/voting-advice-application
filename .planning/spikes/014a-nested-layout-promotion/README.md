---
spike: 014a
name: nested-layout-promotion
type: comparison
validates: "Given a /runes-test/nav-promoted-layout/ route, when MainContent + hero + heading + primaryActions are hoisted into +layout.svelte and [questionId]/+page.svelte renders only the question body, then Q→Q nav keeps MainContent + hero + actions mounted (verifiable via the spike-013 ledger)."
verdict: VALIDATED
related: [013, 014b, 015]
tags: [sveltekit, layouts, restructure, comparison]
---

# Spike 014a: nested-layout-promotion

## What This Validates

**Given** a `/runes-test/nav-promoted-layout/` route that hoists the chrome
(MainContent, hero, heading, primaryActions, the answer input row) out of
`[questionId]/+page.svelte` and into `questions/+layout.svelte`, **when** the
user navigates Q1 → Q2 → Q3, **then** every hoisted component keeps its
mount identity across navigation, eliminating the snippet/chrome rebuild
cost.

Compared with the production pattern (chrome IN the page) the structural
move clarifies which surface area is question-specific (body only) vs
shared (everything else).

## Research

Three plausible patterns for hoisting:

| Approach | Pattern | Pros | Cons |
|---|---|---|---|
| **A. Layout owns chrome, page provides named-snippet content** | Page consumes layout-level named snippets via context | Maximum structural reuse | Snippets across layout boundary in Svelte 5 are awkward |
| **B. Layout owns chrome, page contributes via children slot** | Layout derives active question from `page.params.questionId`, renders `<MainContent>` with hero / heading / actions snippets defined IN THE LAYOUT, page just `{@render children()}`'s into the body | Cleanest mental model; uses standard layout/children contract; URL-driven | Title / actions live one file away from the body content |
| **C. URL-derived everything in layout, page is empty** | Layout renders the entire page; child `+page.svelte` is a no-op stub | Identical to production results pattern | Effectively converges with spike 014b |

**Chosen approach:** **B**. Layout derives `activeQuestion` via
`$derived(page.params.questionId)` per CONVENTIONS.md §9 (per-field reads
on `page`), renders MainContentMock with hero/heading/primaryActions
snippets owned by the layout. Child `[questionId]/+page.svelte` renders
only the question-specific body via `{@render children()}`.

Note: deferring to **C** would converge with spike 014b. Doing **B** here
means the comparison vs 014b stays meaningful — B keeps a real `+page.svelte`
for question-specific markup that legitimately varies per question (custom
embeds, comments threads, extended info per question id).

## How to Run

```bash
# Supabase + frontend dev server (seeded default template)
yarn dev
```

Open `http://localhost:5173/runes-test/nav-promoted-layout/questions/q1`.

Click **Clear** in the ledger panel, then click `Q1 → Q2 → Q3` in any order.
Observe ledger: ZERO events should appear during sub-route param changes.

For side-by-side comparison, open spike 013 at
`http://localhost:5173/runes-test/nav-forensics` in a second tab.

## What to Expect

- Ledger shows 0 mount/destroy events across Q→Q navigation
- DOM `data-mount-id` attributes stay constant across navigation (proves
  Svelte didn't even rebuild the elements — just reactively updated their
  contents)
- `<title>` updates per Q (the Svelte 5 reactive `<svelte:head>` resolves
  through the layout-owned MainContentMock without remount)
- The "Clicks survived this session" counter inside QuestionActionsMock
  persists across Q→Q clicks (state preserved by the layout-owned actions
  instance)
- The page-local `pageScopedCounter` inside `[questionId]/+page.svelte`
  ALSO survives Q→Q (this was a surprise — see Investigation Trail)

## Investigation Trail

### Iteration 1 — Build the promoted layout

Created `+layout.svelte` that owns `<MainContentMock>` with all snippets
(hero, heading, primaryActions). The child page `[questionId]/+page.svelte`
contributes only a small "body" div via `{@render children()}`.

### Iteration 2 — First navigation test (huge surprise)

Loaded `/questions/q1`, captured the 5 initial mount events (PromotedOuter,
PromotedQuestionsLayout, PromotedMainContent, PromotedQuestionPage,
PromotedQuestionActions). Clicked **Clear**, then clicked Q2.

**Observed:** ZERO events. Mount-ids identical before/after:

| Element | Before Q2 | After Q2 |
|---|---|---|
| outer | 2bc8e274 | 2bc8e274 |
| ql | 19ffa9fd | 19ffa9fd |
| main-content | 7edb1af5 | 7edb1af5 |
| **body (page-level)** | **9dd9d39f** | **9dd9d39f** |
| actions | 79b11438 | 79b11438 |

The PAGE-LEVEL `[questionId]/+page.svelte` ALSO kept its mount-id. This
contradicted the spike's pre-flight hypothesis (carried over from the
user's report) that `+page.svelte` re-instantiates on every param change.

**Key insight:** SvelteKit reuses a `+page.svelte` instance when only URL
params change AND the same route matches the new URL. The component
persists; `$derived(page.params.X)` re-evaluates reactively. Q1 → Q2 → Q3
under `[questionId]/+page.svelte` keeps the same component instance.

### Iteration 3 — Verify against production

Loaded the real voter app at `/questions/__first__` (after seeding the DB
and selecting Pirkanmaa constituency). Tagged every `<main>`/`<header>`
element with a `__navIdProd` marker. Clicked the question's SKIP button to
advance to the next question.

**Element survival after Q→Q in production:**
- **9 of 25** tracked content elements (`<h1>`, `<figure>`, `<p>`,
  `<button>`, `<section>`, elements with `data-testid`) survived
- **16 of 25** were freshly created
- ~36% reuse rate

**What survives:** outermost `<main>` and `<header>`, the `MainContent`
wrapper structure, static labels/buttons in chrome.

**What gets replaced:** the `<h1>` title, the hero `<figure>` (per-question
emoji), the QuestionHeading progress dots (Likert dots are non-keyed
`{#each}` items), the QuestionBasicInfo `<p>` elements (different text
per question), the OpinionQuestionInput Likert buttons (re-rendered for
each new question because their `value`/`label` props change).

### Iteration 4 — What the user is actually perceiving

The user-reported "the whole page seems to be redrawn with no components
reused" is **half right**:

- **Wrong half:** The `+page.svelte` component and its chrome ARE reused.
  No remount happens. Mount IDs are stable.
- **Right half:** ~64% of VISIBLE DOM nodes (the content-bearing elements
  inside the chrome) ARE freshly created on each Q→Q hop, because their
  parent components' reactive updates regenerate them from new `$derived`
  values.

**The actual mechanism:**
1. URL changes from `/questions/q1` → `/questions/q2`
2. `+page.svelte`'s `question = $derived.by(...)` re-evaluates → new value
3. Svelte's reactive update runs: `<MainContent title={text}>` props
   propagate, hero/heading/primaryActions snippets re-render
4. Inside snippets, `<Hero content={customData?.hero} />` and
   `<QuestionHeading question={question}>` get new prop values
5. Those components' children (e.g. `QuestionHeading`'s `<div>`s for
   progress dots) are re-rendered as fresh nodes because they're inside
   non-keyed `{#each}` blocks
6. The page LOOKS like a full redraw because all the high-attention
   content (title, hero, body text) flashes to new values simultaneously

### Iteration 5 — What 014a actually fixes vs doesn't

**Fixes (vs the user's mental model):**
- Confirms the chrome WAS already persistent — no need to add a "first-fix"
  pattern; the production code already gets this right
- Provides a cleaner code layout where the layout file is the single
  source for "what this section's pages look like"
- Makes selectively-keyed remounts possible at the LAYOUT level (e.g.
  `{#key activeQuestion.category}` around hero to scope hero swaps)

**Does NOT fix:**
- The 64% DOM churn during Q→Q (those nodes will keep churning because
  their parent components' props legitimately differ per question)
- The visual perception of "redraw" — this is a render-cycle problem,
  not a mount-cycle problem; structural reuse alone won't quiet it

**What WILL fix the perception:**
- Spike 015 (View Transitions API) — wraps the render cycle in a
  cross-fade transition so the DOM churn is animated rather than
  instant
- Stable identity on the high-attention content (key the hero on
  `activeQuestion.id` with a transition; key the OpinionQuestionInput on
  question.id; etc.)

## Observed Ledger

```
(post-clear, after q1→q2→q3→q1 in /runes-test/nav-promoted-layout/)

events: 0
liveByName: { PromotedOuter:1, PromotedQuestionsLayout:1,
              PromotedMainContent:1, PromotedQuestionPage:1,
              PromotedQuestionActions:1 }
mountIds: outer:d9965481 | ql:52f502e5 | main-content:fb3815ce
        | body:230141cb | actions:e76bdc74
        — ALL IDENTICAL across all 3 hops
```

Compare against spike 013 captured ledger: in 013 with the production-mirroring
shape (chrome IN the page), only QuestionsLayout was guaranteed persistent.

## Results

**Verdict:** VALIDATED (with a reframe — see surprises)

**Key findings:**

1. **Layout-promotion works as designed.** Hoisting MainContent + hero +
   heading + primaryActions into `questions/+layout.svelte` results in
   ZERO mount/destroy events during Q→Q navigation. Layout-owned `$state`
   (the "Clicks survived" counter inside QuestionActionsMock) survives
   across navigations.

2. **The premise was partially wrong.** The user's reported symptom
   "components reload" implied SvelteKit was remounting components on
   each Q→Q. **It isn't.** SvelteKit keeps the `+page.svelte` instance
   alive across param changes; only the reactive content updates. The
   spike's mock confirmed this, and the production-page DOM-tagging test
   confirmed it for the real voter app.

3. **The real symptom is DOM regeneration inside reactive child
   components.** ~64% of visible content nodes are freshly created on
   each Q→Q hop because their parent components' props change and Svelte
   regenerates the bits that depend on those props. The wrapper / chrome
   nodes survive; the content nodes don't.

4. **The structural pattern is still worthwhile** — but as a code-clarity
   move, not as a mount-stability fix. Hoisting clarifies that the
   layout owns "what the section looks like" and child pages own "what's
   different per child route". Production already gets the mount
   stability right via SvelteKit's same-route param reuse.

5. **Implications for production migration:** Most of `[questionId]/+page.svelte`
   could be moved into `questions/+layout.svelte` with no behavior change.
   The remaining child page would contain only the question-specific
   `OpinionQuestionInput` body (or even nothing, converging with 014b).
   The benefit is readability, not performance.

**Surprises:**

- `+page.svelte` instance reuse across param-only URL changes is **not
  documented prominently** in SvelteKit docs (it's implicit in the routing
  contract). Established here by direct DOM-tagging observation.
- The page-level `pageScopedCounter` `$state` in
  `[questionId]/+page.svelte` ALSO survives Q→Q — because the component
  instance survives. State preservation is automatic, not a feature of
  014a's hoisting.
- Production's 36% DOM survival rate is sufficient to count as "real
  redraw" for users perceptually, even though the mount tree is
  technically unchanged.

**Impact on remaining spikes:**

- **014b (single-page-url-keyed)** — converges naturally with 014a's
  result. If the `+page.svelte` already reuses across param changes, the
  difference between 014a (layout owns chrome, page owns body) and 014b
  (layout owns everything, page is empty) becomes purely organizational.
  014b will spike the CONVERGED form for completeness, then we pick the
  cleaner code shape head-to-head.
- **015 (view-transitions-api)** — confirmed essential. The actual user
  complaint is about VISUAL discontinuity during the 64% DOM regeneration.
  View Transitions wrapping the render cycle will smooth those swaps into
  cross-fades.
- **016 (focus + a11y)** — needs to handle the reuse case: when `+page.svelte`
  persists across param change, programmatic focus management (e.g. focus
  the answer input after navigation) needs an explicit hook (afterNavigate,
  $effect on questionId) — it doesn't happen "for free" as it would if
  the page remounted.
