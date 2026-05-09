# `Expander.svelte` — `state_referenced_locally` warning on `defaultExpanded`

> **SUPERSEDED 2026-05-08:** Folded into the consolidated Svelte 5 / SSR / a11y warning
> sweep at `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`
> (see that file's Category A — Svelte 5 reactivity hazards). This file is preserved
> for history; safe to delete once the consolidated sweep is acknowledged.

**Captured:** 2026-05-08 during Phase 67 UAT
**Source:** vite-plugin-svelte build/dev warning (HMR-time, 11:41:07 AM)
**Resolves phase:** 70 (v2.8 Svelte 5 / SSR / a11y Warning Sweep, WARN-01 Category A — covered transitively via the consolidated sweep)

## Problem

```
[vite-plugin-svelte] src/lib/components/expander/Expander.svelte:76:24
This reference only captures the initial value of `defaultExpanded`.
Did you mean to reference it inside a closure instead?
https://svelte.dev/e/state_referenced_locally
```

This is a Svelte 5 runes-mode reactivity hazard: `defaultExpanded` is being read once at
component init and the value is captured statically. Subsequent updates to the prop will
not propagate to the consuming reactive expression.

This is the same class of bug that the v2.6 Phase 61 Plan 03 audit (Context Destructuring
Rule, see CLAUDE.md) was created to prevent — local capture of a reactive source.

## Why it matters

If `defaultExpanded` is intended to be reactive (e.g., parent toggles it after mount),
the Expander will silently ignore the update. Likely manifestation: an Expander that
should re-collapse / re-expand based on a parent-driven prop change does nothing.

## Scope

- Open `apps/frontend/src/lib/components/expander/Expander.svelte` line 76 column 24.
- Determine whether `defaultExpanded` is intended to be:
  - **Reactive (parent-driven)** → wrap the read in a closure (`$derived(() => …)`) or
    rebind via `$state.snapshot(defaultExpanded)` inside the appropriate effect.
  - **Init-only** → rename / annotate to make the static-capture intent explicit so future
    readers don't trip on the warning.
- Check the linked Svelte runtime error reference for the canonical fix:
  https://svelte.dev/e/state_referenced_locally
- Sweep for the same pattern across other Svelte 5 components migrated in v2.7
  (Phase 65 audit covered `bind:` / `{#key …}` but did NOT enumerate
  `state_referenced_locally` warnings). Worth running:
  ```
  yarn workspace @openvaa/frontend dev 2>&1 | grep -E 'state_referenced_locally'
  ```
  to surface every hit before touching individual files.

## Related

- `apps/frontend/src/lib/components/expander/Expander.svelte:76`
- CLAUDE.md "Context Destructuring Rule (Svelte 5)" — same anti-pattern class.
- `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md`
  (sibling Svelte-5 migration follow-up captured in same UAT session).
- `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md`
  (origin diagnosis for the destructure-captures-initial-value class of bugs).

## Suggested phase placement

Tag for v2.7 wrap-up or a Svelte 5 migration follow-up phase. If a v2.8 Svelte 5
hardening cycle is planned, fold into that scope and run the grep sweep above
to enumerate the full backlog before scoping.
