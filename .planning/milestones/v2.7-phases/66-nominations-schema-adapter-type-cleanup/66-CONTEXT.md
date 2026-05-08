# Phase 66: Nominations Schema + Adapter Type Cleanup - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Milestone:** v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phase 2 of 4)

> **⚠ SCOPE NARROWED DURING DISCUSSION.** ROADMAP.md and REQUIREMENTS.md as of 2026-04-29 morning describe a **schema migration + adapter retype** phase. The user decided during discussion that the `nominations` table will stay as is (no column drops). **Phase 66 is now adapter-retype only.** ROADMAP.md, REQUIREMENTS.md, and STATE.md must be updated to reflect:
> - DB-01 requirement → moved to "Future Requirements (deferred)" in REQUIREMENTS.md (the table works fine as is; the cleanup is nice-to-have, not blocking)
> - Phase 66 description in ROADMAP.md → narrowed to ADAPTER-01 only
> - Phase 66 plan count in ROADMAP.md → reduced from 3 plans to ~1 plan
> - Total v2.7 plan count → reduced from 11 to ~9
> Updates land in the same commit cluster as this CONTEXT.md.

<domain>
## Phase Boundary

Clean up the type story over `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` so the v2.6 Phase 64 reverse-fill pass uses real types end-to-end. Specifically: **two `as unknown as { ... }` casts** remain at lines 377 and 396 (the parent/child reverse-fill loops). Both get replaced by a real intermediate type (`InternalFlatNomination` or similar) defined once and reused across both loops.

**Schema change:** none. The `nominations` table (`apps/supabase/supabase/migrations/00001_initial_schema.sql:704-744`) stays as is — `name` (jsonb) and `entity_type` (STORED GENERATED column derived from FKs) both retained. The user's reasoning for keeping the table: `entity_type` is structurally safe today (generated-always-stored from the FK columns; cannot drift), and `name` is harmless even if rarely populated. Cleanup deferred to v2.8+ or backlog.

**Goal anchor:** ROADMAP SC-3 + SC-4 (the two adapter-related criteria) — `supabaseDataProvider.ts` carries zero `as unknown as { ... }` casts, zero `any` types (already true), and the v2.6 P64 reverse-fill pass uses a single named intermediate type defined once at the top of a sibling `.types.ts` file and reused across the parent/child mapping loops. `yarn workspace @openvaa/frontend check` passes; v2.6 parity gate at HEAD `2c7ad2dea` continues to pass.

**In scope:**
- Define `InternalFlatNomination` (or similar; planner names) in **a new sibling file** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.types.ts` — keeps adapter-internal type colocated but separates from runtime code
- Replace both `as unknown as { ... }` casts (lines 377, 396) with the real type
- Verify no other `as unknown as` casts elsewhere in the file (scout: only 2 today; plan still does the verification grep)
- Verify zero `any` types remain (scout: zero today; plan asserts the invariant)
- Run `yarn workspace @openvaa/frontend check` to PASS
- Run v2.6 parity gate (`yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` against the post-fix baseline) to confirm no regression

**Out of scope:**
- Any schema change (no migration; no column drops; no pgTAP edits) — DB-01 deferred per scope decision
- Restructuring `supabaseDataProvider.ts` mapping pipeline beyond the 2 cast sites — explicit OoS per REQUIREMENTS.md ("ADAPTER-01 is type-only")
- Touching `@openvaa/supabase-types` — that package mirrors DB schema; an adapter-internal intermediate type doesn't belong there
- Refactoring the v2.6 P64 reverse-fill algorithm — only the type story changes, not the logic
- Wider `as unknown as` sweep across the frontend — out of scope; the todo is targeted at this one file

</domain>

<decisions>
## Implementation Decisions

### Schema Scope (NARROWED FROM ROADMAP)

- **D-01: Keep the `nominations` table as is.** No migration. `name` (jsonb) and `entity_type` (STORED GENERATED column) both retained. The user's reasoning: `entity_type` is structurally safe today (generated-always; cannot drift from FK), and `name` is harmless. **Implication:** DB-01 requirement moves to REQUIREMENTS.md "Future Requirements (deferred)"; ROADMAP Phase 66 description narrows to adapter-only; total v2.7 plan count drops from 11 to ~9.

### Migration Safety

- **D-02: N/A — no migration.** Skipped per D-01.

### Intermediate Type Location

- **D-03: New sibling file** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.types.ts`. Reasoning: keeps the adapter-internal intermediate type colocated with the consumer (no cross-package leak; not in `@openvaa/supabase-types`), but separates types from runtime so the main `.ts` file stays focused on logic. Type is exported but only consumed by `supabaseDataProvider.ts` for now — naming and shape are the planner's call (suggested: `InternalFlatNomination` or `FlatNominationRow`).

### Plan Split

- **D-04: ~1 plan (down from 3 in original ROADMAP).** Suggested single plan structure:
  - **Plan 66-01: Adapter retype + verification** — Define `InternalFlatNomination` in sibling `.types.ts`, replace the 2 `as unknown as` casts at lines 377 + 396, run `yarn workspace @openvaa/frontend check`, run v2.6 parity gate, write phase verification report.
  - The work is small enough (2 cast sites + 1 new file + 2 verification commands) that splitting into multiple plans would be administrative overhead. If the planner discovers unexpected complexity (e.g., the supabase-types row shape doesn't compose cleanly with the intermediate type), a 2-plan split (type design vs cast replacement) is acceptable.

### Claude's Discretion

- Exact name + shape of the intermediate type (`InternalFlatNomination` is a suggestion; planner picks). Anchor: the type must capture the reverse-fill loop's input shape (parent + children flat rows) without leaking supabase row shape into downstream consumers.
- Whether `InternalFlatNomination` is a single type or a small type family (`FlatParent`, `FlatChild`, etc.) — planner's call based on what reads cleanest at the call sites.
- Whether to add JSDoc to the new types pointing at the v2.6 Phase 64 Plan 01 reverse-fill rationale (recommended for future-reader benefit, but optional).
- Whether to add a unit test scaffold for the typed reverse-fill (no existing test file; likely deferred since the integration test is the Playwright parity run).

### Folded Todos

- **`2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md`** — folded as the entire scope of D-03 + D-04. Closed by Phase 66 completion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 66 — Goal, success criteria (SC-3 + SC-4 are the in-scope criteria; SC-1 + SC-2 are dropped per D-01)
- `.planning/REQUIREMENTS.md` §ADAPTER (ADAPTER-01) — adapter-retype acceptance text
- `.planning/REQUIREMENTS.md` §DB (DB-01) — being deferred to "Future Requirements" per D-01
- `.planning/STATE.md` §Roadmap Evolution — v2.7 milestone scope rationale

### Source Todos (folded into this phase)
- `.planning/todos/pending/2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` — adapter retype source todo

### Source Todos (NOT folded — moved to deferred per D-01)
- `.planning/todos/pending/2026-04-28-cleanup-nominations-table.md` — schema cleanup; user opted to keep the table as is

### Prior-Phase Context (LOCKED — do not contradict)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` — Phase 64 architecture LOCKED; the reverse-fill pass at lines ~365-419 of `supabaseDataProvider.ts` is the surface Phase 66 retypes
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-VERIFICATION.md` — v2.6 parity baseline post-fix; Phase 66 must not regress

### Files Targeted by the Cleanup
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` lines 377, 396 — the 2 `as unknown as { ... }` cast sites in the reverse-fill loops
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.types.ts` — **NEW FILE**; sibling location for `InternalFlatNomination` per D-03

### Reference Files (read-only, for type composition)
- `packages/supabase-types/src/types.ts` (or equivalent) — supabase-generated row types; the new intermediate type composes off these
- `packages/data/src/objects/nominations/variants/*.ts` — `Nomination` / `OrganizationNomination` / `AllianceNomination` / `CandidateNomination` types from `@openvaa/data`; the reverse-fill output shape

### Verification References
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — v2.6 parity gate; Phase 66 re-runs but does NOT regenerate constants
- v2.6 parity baseline at HEAD `2c7ad2dea` — Phase 66 must not regress

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`@openvaa/supabase-types`** — generated row types for the supabase schema; the new intermediate type composes off these (don't redeclare row shape)
- **`@openvaa/data` Nomination variants** — output shape of the reverse-fill; the intermediate type bridges from supabase rows to these
- **`yarn workspace @openvaa/frontend check`** — canonical typecheck invocation; PASS criterion for Phase 66
- **v2.6 P64 reverse-fill pass** — already correctly implemented in `supabaseDataProvider.ts:365-419`; the type story is the only thing that needs cleanup. Logic is LOCKED.

### Established Patterns

- **Adapter-internal types live next to the adapter** — sibling `.types.ts` file is consistent with the SvelteKit/TypeScript convention used in `apps/frontend/src/lib/types/` and route-local `.type.ts` files
- **`packages/supabase-types/` mirrors DB schema** — adapter-internal intermediates do NOT belong there (would leak adapter concerns into a shared package, violating layering)
- **Phase 64 single-file principle** — `supabaseDataProvider.ts` was deliberately kept as a single ~600-line file with all mapping logic colocated. Extracting just the type to a sibling preserves this; full splitting is OoS

### Integration Points

- **`supabaseDataProvider.ts` is the only consumer** of the new `InternalFlatNomination` type — no cross-file dependencies introduced
- **`yarn workspace @openvaa/frontend check`** is the gate — type errors should surface here, not in downstream dynamic-components
- **v2.6 parity gate** — same Playwright invocation as Phase 64; Phase 66 must keep it green

</code_context>

<specifics>
## Specific Ideas

- **Two cast sites, not three or more** — verified during scout. Lines 377 (`const c = child as unknown as { ... }`) and 396 (`const p = parent as unknown as { ... }`). The fix is mechanical; risk is low.
- **Zero `any` types in this file today** — verified during scout. ADAPTER-01 SC-3's "no `any` types remain" is already satisfied; Phase 66 only needs to assert the invariant.
- **Sibling `.types.ts` file is a NEW file**, not a modification — flag for the planner so the file is created, not edited.
- **The user's "keep the table as is" decision pre-empts a multi-plan migration phase.** Phase 66 collapses from 3 plans to ~1 plan; v2.7 total drops from 11 to ~9 plans. ROADMAP/REQUIREMENTS/STATE updates are mandatory and land in the same commit as this CONTEXT.md.

</specifics>

<deferred>
## Deferred Ideas

- **DB-01 schema cleanup** (drop `nominations.name` + `nominations.entity_type`) — user opted to keep the table as is. Moved to REQUIREMENTS.md "Future Requirements (deferred)". Revisit when there's a stronger reason than "redundant by structural reasoning" (e.g., a real downstream bug, or a column-shape simplification opportunity in a multi-tenant migration).
- **Wider `as unknown as` sweep across the frontend** — todo `2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` is targeted at this one file. A monorepo-wide sweep would be a larger DX phase.
- **Restructuring `supabaseDataProvider.ts` mapping pipeline** — explicit OoS per REQUIREMENTS.md. The file is ~600 lines but the v2.6 P64 design is current; restructure when there's a concrete need (e.g., adding a new entity type breaks the existing pattern).
- **Adding a unit test scaffold for the typed reverse-fill** — Playwright parity gate covers integration; unit tests would add type-level + edge-case coverage. Not in v2.7 scope; revisit if regressions surface.

### Reviewed Todos (not folded)

- **`2026-04-28-cleanup-nominations-table.md`** — reviewed; deferred per D-01 (user opted to keep the table). Stays in `.planning/todos/pending/` for future revisit; the file's reasoning ("redundant by structural argument") is preserved verbatim.

</deferred>

---

*Phase: 66-nominations-schema-adapter-type-cleanup*
*Context gathered: 2026-04-29*
