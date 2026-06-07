# Phase 100: Domain B Wave B — Questions Layout Restructure - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

The `/questions` route adopts the unified-layout-with-empty-leaf shape (mirroring the production `results/[[electionTab]]/+layout.svelte` pattern), so the layout owns rendering and variant remounting happens cleanly only at question-type boundaries while accumulated answers survive Q→Q navigation.

**Depends on:** Phase 99 (View-Transition names + post-nav focus target land in Wave A). Independent of Domain A.
Requirements: **QLAYOUT-01, QLAYOUT-02**. **UI hint: yes.**
</domain>

<decisions>
## Implementation Decisions

### Where `load` lives after the hoist (QLAYOUT-01)
- **D-01 (100-1):** Hoist **both rendering and the data `load`** up to `questions/+layout.ts` / `questions/+layout.svelte` (full parity with the production results pattern). `[questionId]/+page.svelte` becomes an empty stub.

### Variant remount (QLAYOUT-02) — locked
- **D-02:** Use **`{#key question.type}`** (NOT `{#key question.id}`): the input stays mounted across a run of same-variant questions and remounts cleanly only at Likert↔open-text↔slider boundaries; layout-owned `$state` answers survive Q→Q.

### Verification gate
- **D-03 (100-2):** Add an **explicit E2E assertion that accumulated answers survive a multi-step Q→Q run** after the restructure — **add it to the existing voter-journey spec** (not a new standalone spec). This is the exact behavior the restructure must preserve.

### Claude's Discretion
- Whether any shared sub-components are extracted during the hoist, as long as the leaf `+page.svelte` ends up an empty stub and the layout owns rendering.
</decisions>

<specifics>
## Specific Ideas
- Reference implementation already in the codebase: `results/[[electionTab]]/+layout.svelte` (unified-layout-with-empty-leaf). Match its shape.
- Coordinate with Phase 99's `view-transition-name` + `data-focus-on-nav` targets so they survive the restructure.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")` (Domain B section).
- Spikes: `014a-nested-layout-promotion`, `014b-single-page-url-keyed` (WINNER), `016-focus-and-a11y-during-transitions`.
- `.planning/v2.11-DECISIONS.md` (100-x decisions).
- Production pattern: `apps/frontend/src/routes/.../results/[[electionTab]]/+layout.svelte`.
- Phase 99 outputs (transition names + focus target).
</canonical_refs>
