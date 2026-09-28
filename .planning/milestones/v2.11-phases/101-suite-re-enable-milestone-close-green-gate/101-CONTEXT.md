# Phase 101: Suite Re-enable + Milestone-Close Green Gate - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

The 2 quarantined `perm-per-app-notifications` E2E tests — whose quarantine was explicitly gated on this migration — are re-enabled, and the full E2E + unit suites are proven green with no behavior regression versus the v2.10 ship baseline.

**Depends on:** ALL of 95–100 (final gate, runs last).
Requirements: **SUITE-01**.
</domain>

<decisions>
## Implementation Decisions

### Determinism rigor
- **D-01 (101-1):** Require a **3× determinism run** of the full suite before declaring the gate green — the milestone churned the context layer broadly, so single-run green is insufficient.

### Residual flake handling
- **D-02 (101-2):** If a re-enabled `perm` test is still flaky, **investigate + fix in-phase** (the migration was the gating reason; treat residual flake as a real finding). Re-deferral is only acceptable if root cause is conclusively unrelated to the migration.

### Target baseline
- **D-03 (101-3 + DX-4):** Baseline = the **v2.10 close baseline as-is** (82 passed / 2 skipped) — no fresh pre-milestone baseline run was taken (DX-4). Target after un-quarantine = the **2 `perm` tests now PASS, 0 of them skipped** (i.e. v2.10 count **+2** passing).

### Locked (SUITE-01)
- **D-04:** Un-quarantine both `perm-per-app-notifications` tests (remove `test.skip`); full E2E + unit suites green, prior PASS_LOCKED tests stay passing. (Context: the perm-teardown auth-user leak that previously blocked re-runs was fixed 2026-06-02.)

### Claude's Discretion
- Whether the 3× determinism run is the full suite or a targeted subset around the touched surfaces plus a single full pass — as long as the perm tests + context-touched specs get the 3× treatment.
</decisions>

<specifics>
## Specific Ideas
- This is the milestone-close gate; pair with `/gsd-complete-milestone` afterward.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `.planning/v2.11-DECISIONS.md` (101-x + DX-4).
- `.planning/REQUIREMENTS.md` → SUITE-01.
- v2.10 close audit (`.planning/milestones/v2.10-MILESTONE-AUDIT.md`) for the 82/2 baseline.
- Memory: perm-teardown auth-user leak fix (2026-06-02).
</canonical_refs>
