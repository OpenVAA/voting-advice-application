# Phase 37: E2E Failure Resolution - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all remaining E2E test failures and address all FIXMEs/TODOs in test files. The target is 100% E2E pass rate against the Supabase backend.

</domain>

<decisions>
## Implementation Decisions

### Known failures (TEST-06)
- **D-01:** Fix the 14 E2E failures documented in HANDOFF.json:
  - Auth-setup failure (candidate login succeeds but page stays on /login URL) — cascades to 8 candidate tests
  - voter-detail (party) — entity data rendering issue
  - voter-matching — matching algorithm or data format issue
  - voter-results (3 failures) — results display or data format issues
- **D-02:** GoTrue auth.users NULL column bug — verify seed.sql UPDATE workaround is in place, investigate if ALTER TABLE is possible via migration
- **D-03:** Investigate auth-setup cascade first — fixing this likely unblocks 8 candidate tests

### FIXMEs and TODOs (TEST-07)
- **D-04:** Collect all FIXMEs and TODOs in E2E test files
- **D-05:** Resolve each one: fix the underlying issue or convert to tracked Future requirement if out of scope
- **D-06:** No silent FIXMEs left after this phase — everything either fixed or explicitly tracked

### Approach
- **D-07:** Debug systematically — auth-setup first (highest cascade impact), then voter failures individually
- **D-08:** Each fix verified by running the specific test before moving to next failure

### Claude's Discretion
- Debugging methodology and investigation order
- Whether some failures need dataset fixes vs code fixes vs both
- Whether to use `test.fixme` for any remaining infrastructure-level issues

</decisions>

<specifics>
## Specific Ideas

- Auth-setup cascade is the highest priority — fixing 1 issue potentially unblocks 8 tests
- GoTrue NULL column bug may need a migration-level fix rather than seed.sql workaround
- This is pure debugging work — no architectural decisions needed

</specifics>

<canonical_refs>
## Canonical References

### Failure documentation
- `git show feat-gsd-supabase-migration:.planning/HANDOFF.json` — 14 failures documented with progress and blockers
- `.planning/STATE.md` — Blockers/Concerns section lists known issues

### Test files to inspect
- `tests/tests/specs/candidate/` — candidate specs (auth-setup cascade target)
- `tests/tests/specs/voter/voter-detail.spec.ts` — party detail failure
- `tests/tests/specs/voter/voter-matching.spec.ts` — matching failure
- `tests/tests/specs/voter/voter-results.spec.ts` — 3 results failures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- HANDOFF.json has detailed failure descriptions and workarounds
- `test.fixme` pattern established for tests with known infrastructure issues

### Established Patterns
- Serial project execution for shared-state tests prevents flaky races
- Re-auth setup project pattern for tests after session-invalidating operations
- safeListUsers workaround for GoTrue NULL column bug

### Integration Points
- Phase 36 provides SupabaseAdminClient and migrated specs — this phase builds on that
- All adapter code from Phases 34-35 must be working for E2E tests to pass
- Auth infrastructure from Phases 32-33 must correctly handle session flows

</code_context>

<deferred>
## Deferred Ideas

- Context system runes rewrite — CTX-01, only after 100% E2E pass (this phase achieves that gate)
- Visual regression baseline updates — if screenshots changed

</deferred>

---

*Phase: 37-e2e-failure-resolution*
*Context gathered: 2026-03-22*
