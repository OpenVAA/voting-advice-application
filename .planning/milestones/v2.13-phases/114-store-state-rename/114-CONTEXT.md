# Phase 114: Store → State Rename - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Rename the rune-native `*Store` identifiers to `*State` — there are no Svelte stores
behind them — with the genuine exceptions documented. Purely mechanical, no behavior
change.

In scope (rename identifiers, file names, type names, test names):
`answerStore`→`answerState`, `editedAnswersStore`, `filterStore`, `popupStore`,
`matchStore`, `candidateUserDataStore`, `questionBlockStore`, `questionCategoryStore`,
`questionStore`, `nominationAndQuestionStore`, `paramStore`, `pageDatumStore`, and the
client `admin/jobStores` context.

Out of scope (intentional exceptions, must be documented):
- Server-side `jobStore` (`lib/server/admin/jobs/jobStore.ts`) — a genuine server store.
- The `cookieStore` test mock.

Depends on Phase 113 (rename touches the same `*Store` files the class conversion +
flatten just rewrote). Out of scope: straggler `svelte/store` clearance (Phase 115),
milestone-close green gate (Phase 116).
</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure mechanical rename.
Constraints from the ROADMAP success criteria:
- Rename covers identifiers, file names, type names, AND test names.
- Grep gate confirms zero remaining rune-context `*Store` identifiers (minus documented exclusions).
- Server `jobStore` + `cookieStore` mock excluded and documented; client `admin/jobStores` IS renamed.
- `yarn build` + `yarn vitest run` + `yarn svelte-check` green; no behavior change.
- Use git-mv for file renames to preserve history where practical.
</decisions>

<code_context>
## Existing Code Insights

Exact symbol inventory, import-graph, and file-rename mechanics gathered during
plan-phase research. Builds directly on the Phase 113 class/flatten work.
</code_context>

<specifics>
## Specific Ideas

No specifics beyond ROADMAP success criteria — infrastructure phase.
</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.
</deferred>
