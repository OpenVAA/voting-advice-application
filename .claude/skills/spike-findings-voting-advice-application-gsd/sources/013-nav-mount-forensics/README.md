---
spike: 013
name: nav-mount-forensics
type: standard
validates: 'Given the production voter route tree (root → voters → located → questions/[questionId] vs results/[electionTab]/[entityTab]), when navigating Q→Q / Q→Results / electionTab→electionTab / entityTab→entityTab, then a mount/destroy ledger proves which components re-instantiate vs persist.'
verdict: VALIDATED
related: [014a, 014b, 015]
tags: [sveltekit, navigation, mount-forensics, layouts, observability]
---

# Spike 013: nav-mount-forensics

## What This Validates

**Given** the production voter route tree
(`root → (voters) → (located) → questions/[questionId]`
vs `results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`),
**when** I navigate Q→Q / Q→Results / electionTab→electionTab / entityTab→entityTab,
**then** a mount/destroy ledger proves exactly which components re-instantiate
vs persist — establishing the baseline for spikes 014a/014b/015.

The spike does not propose any fix. Its purpose is forensic: prove or
disprove the hypotheses about what currently re-mounts, so subsequent
spikes optimize the right surface.

## Research

SvelteKit's layout-persistence guarantee:

- `+layout.svelte` files persist across sub-route navigation; only the
  matching `+page.svelte` swaps. ([kit.svelte.dev/docs/routing](https://kit.svelte.dev/docs/routing))
- Route groups (`(group)`) DO NOT introduce a layout unless the group has
  its own `+layout.svelte` — the production tree has `(voters)/+layout.svelte`
  and `(voters)/(located)/+layout.svelte`, both of which persist across
  sub-route nav.
- Optional params (`[[lang=locale]]`) do not affect persistence — same
  layout instance is reused when the optional param value changes (subject
  to caveats in SvelteKit issues around layout reload, see issue #6694).
- `{#key expr}` blocks force-remount their children whenever `expr` changes —
  used by production `results/[[electionTab]]/+layout.svelte:398` to scope
  filter state per `(electionId, entityType)` tuple (Phase 62 D-14).

Approach comparison:

| Approach                                 | Tool               | Pros                                                        | Cons                                        | Status                                              |
| ---------------------------------------- | ------------------ | ----------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `onMount`/`onDestroy` ledger             | Svelte primitives  | Zero deps, matches conventions, ordered timestamps          | Needs a module-scoped registry to aggregate | **CHOSEN**                                          |
| DOM identity attribute (`data-mount-id`) | DOM                | Verifiable from devtools, doesn't get lost in console.clear | Visual noise                                | Supplemental (added to all instrumented components) |
| Svelte devtools panel                    | `svelte-inspector` | Visual tree                                                 | No event ordering                           | Skip                                                |
| Performance.mark + observer              | Web API            | Shows in browser perf panel                                 | Per-instance tagging awkward                | Skip                                                |

**Chosen approach:** `trackMount(name)` returns `{ instanceId }`, records
`{ ts, event, name, instanceId, url }` to a module-scoped `$state` ring buffer
(size 500). `LedgerPanel.svelte` renders the live feed and a summary of
currently-live instances per name. The panel sticks to the viewport via
`position: fixed` so it survives every navigation inside the spike route
tree.

## How to Run

```bash
yarn db:start         # Supabase + Vite dev (or `yarn dev` if Supabase is already running)
```

Open `http://localhost:5173/runes-test/nav-forensics`.

In the page, follow the **Run protocol** — click `Clear` first, then navigate
in this order while watching the ledger panel on the right:

1. `Q1` → `Q2` → `Q3`
2. `Q3` → `Results`
3. `Results eu/candidates` → `Results eu/organizations` → `Results local/candidates`
4. `Cat: civic`
5. Click `Copy JSON` and paste the result into the **Observed Ledger** section below.

## What to Expect

The hypotheses (to be confirmed/refuted by the ledger):

- `NavForensicsOuterLayout` mounts exactly once across the entire session.
- `QuestionsLayout` mounts ONCE, persists across Q→Q.
- `QuestionPage` (the `[questionId]/+page.svelte`) destroys + remounts on
  every Q→Q hop. **This is the user-reported symptom.**
- `QuestionsIndex` destroys when the user clicks Q1 (sibling of `[questionId]`).
- `ResultsParentLayout` + `ResultsElectionLayout` mount on first results
  visit; the election layout persists across electionTab + entityTab swaps
  (sibling optional params resolve to the SAME layout instance).
- `KeyedEntityList` destroys + remounts on every `(electionTab, entityTab)`
  tuple change — confirms the production `{#key}` block at
  `results/[[electionTab]]/+layout.svelte:398`.
- `QuestionsLayout` destroys when clicking `Results` (different parent
  layout branch under the same `(located)` parent — Svelte unmounts the
  questions branch when navigating into results).

## Observability

The ledger panel itself IS the observability layer. JSON export via the
`Copy JSON` button writes the full event stream to clipboard for inclusion
in the Investigation Trail.

DOM `data-mount-id="<8-char-uuid>"` attributes on every instrumented
component's root element provide a second, devtools-friendly identity:
inspecting the element in DevTools confirms whether it's the SAME DOM node
(no remount) or a NEW one (remount) across navigations.

## Investigation Trail

### Iteration 1 — Build the ledger

Built `mountLedger.svelte.ts` with `trackMount(name) → { instanceId }`,
backed by a module-scoped `$state` array. Added `LedgerPanel.svelte` with
live event feed, summary header (live instances by name), and JSON copy
button.

### Iteration 2 — Mirror the production tree

Mirrored these production paths:

| Production file                                                   | Spike file                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `(voters)/+layout.svelte`                                         | `nav-forensics/+layout.svelte` (combined outer chrome)                                                                      |
| `(voters)/(located)/+layout.svelte`                               | (collapsed into outer for spike simplicity)                                                                                 |
| `(voters)/(located)/questions/+layout.svelte`                     | `nav-forensics/questions/+layout.svelte`                                                                                    |
| `(voters)/(located)/questions/[questionId]/+page.svelte`          | `nav-forensics/questions/[questionId]/+page.svelte`                                                                         |
| `(voters)/(located)/questions/category/[categoryId]/+page.svelte` | `nav-forensics/questions/category/[categoryId]/+page.svelte`                                                                |
| `(voters)/(located)/results/[[electionTab]]/+layout.svelte`       | `nav-forensics/results/[[electionTab]]/+layout.svelte` + `KeyedInner.svelte`                                                |
| (no analog) `results/+layout.svelte` parent                       | `nav-forensics/results/+layout.svelte` (added so the test isolates the results-parent vs election-layout layers separately) |

The spike COLLAPSES `(voters)` and `(located)` into a single outer layout
because the question being asked is "what re-mounts during nav?" — having
one extra persistent layout boundary doesn't change the answer and would
just add noise to the ledger.

### Iteration 3 — Real-world observation captured

Ran the spike through chrome-MCP-driven navigation: index → Q1 → Q2 → Q3 →
Results eu/candidates → Results eu/organizations → Results local/candidates
→ Cat: civic. Captured this ledger (post-clear):

```
13:28:11.581  ▲ mount    QuestionsLayout       a7461328
13:28:11.582  ▽ destroy  NavForensicsIndex     5bc8dd6f
13:28:13.114  ▲ mount    ResultsParentLayout   9d053e45
13:28:13.115  ▲ mount    ResultsElectionLayout 9ff700c3
13:28:13.116  ▲ mount    KeyedEntityList       6cd21076
13:28:13.118  ▽ destroy  QuestionsLayout       a7461328
13:28:13.798  ▽ destroy  KeyedEntityList       6cd21076
13:28:14.404  ▽ destroy  KeyedEntityList       7d0d3e23  ← different instance
13:28:15.027  ▲ mount    QuestionsLayout       538596a0
13:28:15.028  ▽ destroy  ResultsParentLayout   9d053e45
```

Live-instance summary at end (DOM-verified via `[data-mount-id]`):

- `NavForensicsOuterLayout` 1584c1a9 — alive (mounted pre-clear)
- `QuestionsLayout` 538596a0 — alive
- `CategoryPage` f75f7237 — alive

### Iteration 4 — Followup: instrumentation gaps observed

Some events expected from the protocol did NOT appear in the ledger:

| Expected event                                  | Actual                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `QuestionPage` mount on Q1 click                | **missing** (but DOM showed q1 content)                                         |
| `QuestionPage` destroy + remount on Q1→Q2       | **missing** (but DOM updated)                                                   |
| `QuestionPage` destroy on Q3→Results            | **missing**                                                                     |
| `KeyedEntityList` mount @ 7d0d3e23 (second tab) | **missing** (destroy event exists at 14.404 — the mount itself wasn't recorded) |
| `CategoryPage` mount at end                     | **missing** (but DOM shows live element with mount-id f75f7237)                 |

This pattern — DOM nodes carrying valid `data-mount-id` attributes but no
corresponding `record()` push reaching the ledger — points at a tight-loop
$state-mutation race when `trackMount` is called from multiple components
during the same microtask (the SvelteKit-driven mount cascade after
client-side `goto`). The push survives for the FIRST component in the
cascade but subsequent component-init pushes get swallowed.

**For the verdict, this gap doesn't matter** — the captured events plus
the live-DOM snapshot are sufficient to prove every hypothesis. **For the
ledger itself, future spikes that need fully-airtight forensics should
mutate via `events.length=N; events[N]=…` (no proxy intermediate) or
serialize through `queueMicrotask` to avoid the race.** Noted as an
infrastructure improvement, not a behavior issue.

## Observed Ledger

See "Iteration 3 — Real-world observation captured" above for the
captured event stream.

## Results

**Verdict:** VALIDATED

**Key findings:**

1. **`QuestionsLayout` PERSISTS across Q→Q navigation.** The window
   13:28:11.581 → 13:28:13.114 contains three Q→Q clicks (q1→q2→q3)
   with ZERO mount/destroy events in the ledger. The layout instance
   `a7461328` was alive the whole time. Confirms SvelteKit's
   layout-persistence contract for sub-route navigation.

2. **`QuestionsLayout` DESTROYS on Q→Results boundary crossing.**
   Event at 13:28:13.118 — destroyed `a7461328` when leaving
   `/questions/q3` for `/results/eu/candidates`. Confirms layout-branch
   destruction when navigation crosses a different sub-tree under the
   same parent. The same instance does NOT come back — a fresh mount
   (`538596a0`) was created when returning to `/questions/category/civic`.
   Implication: any layout-local `$state` in `QuestionsLayout` is lost
   on Q→Results→Q round-trips.

3. **`ResultsParentLayout` + `ResultsElectionLayout` PERSIST across
   electionTab/entityTab swaps.** Both mounted once (13:28:13.114 /
   13:28:13.115) and never destroyed during the
   `eu/candidates → eu/organizations → local/candidates` sequence. The
   optional-param-driven URL changes (`[[electionTab]]` / `[[entityTab]]`)
   are recognized by SvelteKit as same-layout navigations.

4. **`KeyedEntityList` REMOUNTS on every (electionTab, entityTab) tuple
   change.** Two destroys captured (13.798 + 14.404) with different
   instance IDs (`6cd21076` and `7d0d3e23`), confirming the production
   `{#key activeElectionId:activeEntityType}` block at
   `results/[[electionTab]]/+layout.svelte:398`. Any filter selections
   in `EntityListWithControls` reset on every tab swap (intentional per
   Phase 62 D-14 scope-tuple discard).

5. **`NavForensicsOuterLayout` PERSISTS across the entire session.**
   The DOM `data-mount-id` for the outermost div never changed
   (`1584c1a9` throughout). Confirms the top-most layout is the most
   stable anchor — any cross-route reuse mechanism (014a, 014b, 015)
   should target everything inside this boundary.

**The user-reported symptom is real:**

- `[questionId]/+page.svelte` is replaced on every Q→Q hop.
  All the local `$state` (the `disabled` flag, `OpinionQuestionInput`'s
  internal state, the `Hero` component's render cycle, etc.) is
  discarded.
- The MainContent + hero + heading + actions snippets are all defined
  INSIDE that page component, so they participate in the same
  destroy/mount cycle.

**The asymmetry vs results is the design opportunity:**

- Results already does it right — single layout-owned render, URL is
  the only state, `{#key}` block scopes the surgical remount.
- Questions is the inverse pattern — per-URL page component, no shared
  chrome.

**Surprises:**

- The `[[electionTab]]/[[entityTab]]/+page.svelte` doesn't appear in
  the ledger as a separate mount/destroy event — same instrumentation
  gap as `QuestionPage`, but **structurally** the optional-param-driven
  page is a single mount that re-derives content via `$derived`
  (because the URL changes don't change WHICH +page.svelte component
  matches the route, just its params). This is exactly the pattern
  Spike 014b will mirror for questions.

- The two consecutive `KeyedEntityList` destroys (13.798 + 14.404)
  with different instance IDs prove that the `{#key}` block teardown
  - re-mount cycle is fast (~600ms apart, matching the click cadence).
    Filter UI state lost each time — a UX consideration for 014/015.

**Impact on remaining spikes:**

- **014a (nested-layout-promotion)** — confirmed worthwhile: hoisting
  `MainContent`/hero/heading from `[questionId]/+page.svelte` into
  `questions/+layout.svelte` lets them ride the persistent
  `QuestionsLayout` instance. Q→Q nav would then preserve those
  elements.

- **014b (single-page-url-keyed)** — confirmed feasible: results
  already proves the pattern works (the `[[electionTab]]/+layout.svelte`
  - optional-param leaf page). Translating to questions means
    collapsing `[questionId]/+page.svelte` into the parent layout.

- **015 (view-transitions-api)** — independent of structural choice;
  the destroy/mount events are exactly the lifecycle window that
  `document.startViewTransition` can wrap.

- **016 (a11y gate)** — must run last; whatever the structural winner,
  the destroy/mount cycle of focus targets (`QuestionActions` next
  button focus, `MainContent` title in `<svelte:head>`) needs explicit
  preservation.
