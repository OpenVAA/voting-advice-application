# Phase 115: Straggler Clearance - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Clear the last `svelte/store` stragglers and the stray Svelte-4 reactive statement, then
widen the `svelte/store` ESLint guard to the whole frontend tree.

In scope (SWEEP-01/02/03):
- SWEEP-01: convert the `videoPreferences` writable in
  `apps/frontend/src/lib/components/video/component-stores.ts` to a rune; zero
  `svelte/store` imports remain anywhere in `apps/frontend/src/**` (test mocks excluded,
  documented).
- SWEEP-02: remove the stray `$: console.info(...)` Svelte-4 reactive statement in
  `TermsOfUseForm.svelte`; zero `$:` reactive statements remain frontend-wide.
- SWEEP-03: extend the `svelte/store` ESLint guard from `lib/contexts/**`+`routes/**` to
  the whole `apps/frontend/src/**` tree. SWEEP-03 MUST land AFTER SWEEP-01.

Out of scope: milestone-close green gate (Phase 116).
</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — focused cleanup phase.
Constraints from ROADMAP success criteria:
- `videoPreferences` → rune conversion must be behavior-preserving (same persisted
  semantics); follow the established rune-state pattern (e.g. the `persistedState` /
  `runeLocalStorage` helpers used elsewhere in the frontend).
- Zero `svelte/store` imports in `apps/frontend/src/**` (test mocks excluded + documented).
- Zero `$:` reactive statements frontend-wide.
- Widened ESLint guard: reintroducing a `svelte/store` import anywhere in the frontend
  fails lint, and the existing tree passes lint under the widened guard.
- `yarn lint:check` + `yarn build` + `yarn vitest run` green.
- Ordering: SWEEP-01 (convert) before SWEEP-03 (widen guard).
</decisions>

<code_context>
## Existing Code Insights

`videoPreferences` consumers, the existing rune-state helper to reuse, and the current
ESLint guard config location gathered during plan-phase research.
</code_context>

<specifics>
## Specific Ideas

No specifics beyond ROADMAP success criteria — infrastructure phase.
</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.
</deferred>
