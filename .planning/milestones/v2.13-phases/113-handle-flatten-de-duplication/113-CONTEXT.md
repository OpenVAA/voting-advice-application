# Phase 113: Handle Flatten + De-duplication - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

With every context now a class (Phases 106–112), collapse the redundant `{ current }`
handles and `reactiveFoo` mirrors so consumers read bare class fields, with the
destructure-trap contract verified intact.

Scope is the mechanical flatten/de-dup only:
- Collapse `reactiveFoo`/`Foo` duplicate handle pairs to single reactive class fields
  (`reactiveDataRoot`+`dataRoot` → `dataRoot`, `reactiveAppSettings`+`appSettings` →
  `appSettings`, `reactiveLocale`+`locale` → `locale`, and the spike-017
  `{ current, instance }` dataRoot split → a single reactive `dataRoot` field).
- Flatten all consumer `.current` reads on migrated handles to bare class-field reads
  via an idempotent codemod; remove back-compat handles from producers.

Out of scope: the `*Store` → `*State` rename (Phase 114), straggler `svelte/store`
clearance (Phase 115), milestone-close green gate (Phase 116).
</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure/refactor
phase. Decisions are constrained by the ROADMAP success criteria and the established
project contracts:

- **Destructure-trap contract (NON-NEGOTIABLE):** Consumers read `ctx.X` for reactive
  accessors, never destructure them. See CLAUDE.md "Context Destructuring Rule (Svelte 5)".
  The spike-009 audit (PASS 4) must pass after the flatten.
- **Green at every commit boundary:** The codemod must not leave a red build at any
  step. Stage the work so each commit independently builds.
- **Idempotent codemod:** The `.current` → bare-field flatten must be re-runnable as a
  no-op.
- **Runs alone:** FLATTEN-02 is a ~524-site mechanical rewrite — must NOT run concurrently
  with any other large rewrite (v2.12 collision lesson).
</decisions>

<code_context>
## Existing Code Insights

Codebase context (exact handle sites, codemod mechanism, consumer inventory) will be
gathered during plan-phase research. Relevant prior artifacts:
- spike-findings-voting-advice-application-gsd skill (Svelte 5 rune migration, spikes 001–012)
- Phases 106–112 CONTEXT/SUMMARY files (the class conversions this flatten builds on)
- CLAUDE.md Context Destructuring Rule (the contract to preserve)
</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the ROADMAP success criteria — infrastructure phase.
Refer to Phase 113 success criteria and the destructure-trap contract.
</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.
</deferred>
