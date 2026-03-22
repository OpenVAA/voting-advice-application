# Phase 31: Schema Reorganization - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete numbered files, p_ parameter prefixes, and public. qualifiers in the Supabase schema. However, HANDOFF.json confirms tasks 1-7 (the actual reorganization work) are already done on the parallel branch. Phase 30 copies those files as-is.

</domain>

<decisions>
## Implementation Decisions

### Verification-only phase
- **D-01:** Phase 31 is a verification gate, not an implementation phase. The schema reorganization was completed on the parallel branch (HANDOFF.json tasks 1-7 done).
- **D-02:** After Phase 30 completes, verify the 4 success criteria are already met:
  1. All migration files use numbered naming convention
  2. Function parameters use p_ prefix convention
  3. All table/view references use public. schema qualifiers
  4. pgTAP tests pass
- **D-03:** If all criteria pass, mark phase complete with a verification report. No code changes expected.
- **D-04:** If any criterion fails, fix the specific issue (not a full reorganization — just gap closure).

### Claude's Discretion
- Verification methodology (grep patterns, manual inspection, etc.)
- Whether to generate a formal VERIFICATION.md or just confirm in plan completion

</decisions>

<specifics>
## Specific Ideas

- This should be a quick verification pass, not an implementation effort
- HANDOFF.json task 8 (14 E2E failures) is explicitly Phase 37's scope, not this phase

</specifics>

<canonical_refs>
## Canonical References

### Schema reorganization status
- `git show feat-gsd-supabase-migration:.planning/HANDOFF.json` — Tasks 1-7 done, task 8 (E2E failures) in progress
- `apps/supabase/supabase/schema/` — Schema files after Phase 30 copies them (numbered 000-900)

### Success criteria source
- `.planning/ROADMAP.md` §Phase 31 — 4 success criteria to verify

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- pgTAP test suite (229 tests) serves as the primary verification tool for criterion 4

### Established Patterns
- Schema files use numbered convention: 000 (enums), 010-011 (utility), 100-108 (tables), 200 (indexes), 300-303 (auth/RLS), 400 (storage), 500-504 (RPCs), 900 (test helpers)
- p_ prefix pattern confirmed in auth functions and RLS policies

### Integration Points
- Depends on Phase 30 having copied schema files successfully
- pgTAP verification requires `supabase start` (which Phase 30 already validates)

</code_context>

<deferred>
## Deferred Ideas

- 14 E2E test failures from schema reorg — Phase 37
- SQL linting/formatting tooling — captured as TODO

</deferred>

---

*Phase: 31-schema-reorganization*
*Context gathered: 2026-03-22*
