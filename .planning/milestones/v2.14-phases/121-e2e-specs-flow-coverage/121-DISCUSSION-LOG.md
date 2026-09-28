# Phase 121: E2E Specs — Flow Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-16
**Phase:** 121-e2e-specs-flow-coverage
**Areas discussed:** EFLOW-08 analytics seed, EFLOW-09 voter conditional nav host, EFLOW-11 mobile smoke mechanism
**Note:** Discussed in batch with Phase 122 (both E2E-spec phases, same workstream). The bulk of WHAT-to-build was already locked by the operator-approved `v2.14-E2E-COVERAGE-PLAN.md`; this discussion only resolved the remaining build-time pins the plan explicitly deferred.

---

## EFLOW-08 analytics seed

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated perm node | New perm node (perm-analytics-tracking) with analytics overlay; voter-prefs-tracking depends on it; e2e/base untouched (additive) | ✓ |
| Add analytics to e2e/base | Enable umami analytics in e2e/base itself; simpler but NON-ADDITIVE to shared base | |

**User's choice:** Dedicated perm node (Recommended)
**Notes:** Keeps the shared base additive. Consent toggled at runtime, not seeded.

---

## EFLOW-09 voter conditional nav host

| Option | Description | Selected |
|--------|-------------|----------|
| Ride EPERM-02 perm datasets | Assert on perm-1e1cg1co / perm-disable-election-1co where not-selectable seed already exists | ✓ |
| New assertion in voter-journey | Single voter-nav home, but voter-journey runs on multi-selectable base — needs seed work | |

**User's choice:** Ride EPERM-02 perm datasets (Recommended)
**Notes:** Avoids a new dataset; asserts where the not-selectable seed already lives.

---

## EFLOW-11 mobile smoke mechanism (for EPERM-06/07 specs)

| Option | Description | Selected |
|--------|-------------|----------|
| Per-spec viewport override sub-test | One extra test block per spec with viewport/context override; no new projects | ✓ |
| Shared mobile project variant | New mobile project variants re-running the specs; more config + runtime | |

**User's choice:** Per-spec viewport override sub-test (Recommended)
**Notes:** Co-locates the mobile smoke with the feature. The dedicated voter-journey-mobile.spec.ts still uses its own mobile device-descriptor project.

---

## Claude's Discretion

- Exact seeded categorical filter surfacing the select-all/none control (above option-count threshold — confirm vs filter-dialog component).
- Concrete routes/actions for `startPageview`/`startEvent`/`track`; precise per-category subMatch expected values for the chosen candidate.
- Mobile device descriptor (`devices['Pixel 5']` vs explicit 390×844).

## Deferred Ideas

- EFLOW-02 (alliance card + member-orgs drawer) → Phase 130.
- EFLOW-10 / -10b (bank-auth) → Phase 122.
