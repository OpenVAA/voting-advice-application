---
title: Investigate whether destructuring of Svelte contexts should be banned
priority: medium
area: ui
created: 2026-04-25
promoted: 2026-04-29
context: Captured as a note (`.planning/notes/2026-04-25-investigate-destructuring-contexts-removed.md`) on 2026-04-25, after v2.6 Phase 61 Plan 03 diagnosed that destructuring a context object (e.g., `const { electionData, candidates } = ctx`) breaks Svelte 5's reactive tracking when the destructured locals are read inside `$derived` blocks. The fix in Phase 61 was to access via `ctx.X` non-destructured everywhere; the open question is whether destructuring should be banned codebase-wide.
---

# Investigate destructuring of Svelte contexts

v2.6 Phase 61 Plan 03 surfaced a subtle Svelte 5 reactivity bug:
destructuring a context object captures the value at destructure
time, breaking the reactive tracking that `$derived` / `$effect`
rely on. Restated:

```svelte
// BROKEN — captures snapshot, no reactivity
const { electionData, candidates } = ctx;
const visible = $derived(filterCandidates(electionData, candidates));

// WORKS — direct property access preserves reactive tracking
const visible = $derived(filterCandidates(ctx.electionData, ctx.candidates));
```

The fix in Phase 61 was to rewrite the candidate-app questions
layout consumer to non-destructured `ctx.X` access. This shipped.

The open question is whether the destructuring pattern is a hazard
codebase-wide and should be prevented going forward.

## What to investigate

- Audit `apps/frontend/src/**/*.svelte` and
  `apps/frontend/src/**/*.svelte.ts` for any `const { … } = ctx`
  / `const { … } = getContext(...)` / `const { … } = use*Context()`
  patterns that might be affected.
- For each: classify as broken, accidentally-working (e.g.,
  destructured value is itself a reactive `$state` proxy that holds
  through capture), or genuinely-fine (e.g., used outside any
  reactive computation).
- Decide: should destructuring be banned via lint rule? Or
  documented as "use direct property access for context-derived
  reactive reads, destructuring is fine for one-shot reads"?
- Document the chosen rule in `CLAUDE.md` and/or a per-package
  README so future contributors don't relearn this the hard way.

## Prevention

If we choose to ban destructuring:

- ESLint rule against `ObjectPattern` declarations targeting an
  identifier that came from `getContext()` / `use*Context()`.
- Or a custom svelte-eslint rule.
- Or a code-review checklist item.

If we choose "use direct property access for reactive reads, anything
goes for one-shot reads":

- Document the pattern with the failing example from Phase 61 Plan
  03's `61-03-DIAGNOSIS.md` (now in `.planning/milestones/v2.6-phases/`).

## Acceptance

- A documented decision (banned vs ok-with-rule) lives in `CLAUDE.md`
  or the appropriate package README.
- Codebase audit completed; any broken-by-destructure-but-working
  sites either rewritten or flagged with a justification.

## Related

- v2.6 Phase 61 Plan 03 (`61-03-DIAGNOSIS.md` in
  `.planning/milestones/v2.6-phases/61-voter-app-question-flow/`) —
  permanent record of the original diagnosis.
- `.planning/todos/pending/svelte5-cleanup.md` — sibling Svelte 5 audit
  sweeps (`bind:*` and `{#key}`).
