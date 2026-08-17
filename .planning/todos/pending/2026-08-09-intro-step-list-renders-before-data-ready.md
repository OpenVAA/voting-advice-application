# Intro step list renders an incomplete list for ~½ s on client-side entry

**Captured:** 2026-08-09
**Source:** DEF-133-01 root-cause investigation (`.planning/phases/133-fix-phase-132-code-review-gaps/deferred-items.md`)
**Type:** product / CLS

## Observation

On client-side entry to `/intro` (home → Start), the step `<ol>` renders with the
**wrong number of steps** and then corrects itself. Measured: `<li>` count goes
**4 → 5 at t=529 ms** after the intro CTA becomes visible.

## Mechanism

`apps/frontend/src/routes/(voters)/intro/+page.svelte` builds the list from
`voterCtx.constituenciesSelectable` / `voterCtx.electionsSelectable`:

```ts
#constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));
```

`dataRoot` is populated by a `$effect` in `apps/frontend/src/routes/+layout.svelte`
that runs **after mount**. Until it fires, `dataRoot.elections` is empty, so
`.some(...)` returns `false` and the constituencies step is **omitted**. When the
effect lands, the step appears.

`electionsSelectable` has the mirror-image hazard: `dataRoot.elections?.length !== 1`
is `true` on an empty array, so a single-election VAA renders the elections step
and then removes it.

## Why it matters

The user sees a wrong instruction list, then a visible reflow. It is a genuine
CLS/content-flash defect on the first page that explains the flow to the voter.

## Why it was not fixed with DEF-133-01

DEF-133-01 turned out to be a *test-budget* defect, not this. Fixing this
properly needs a product decision — gate the intro list on data readiness
(skeleton / suspend), or make the pre-hydration state indistinguishable — which
is more than a flake fix should decide.

## Note

Not currently caught by any spec: the E2E flow clicks through the intro CTA at
~20 ms, well before the 529 ms correction, so the suite never observes the flip.
