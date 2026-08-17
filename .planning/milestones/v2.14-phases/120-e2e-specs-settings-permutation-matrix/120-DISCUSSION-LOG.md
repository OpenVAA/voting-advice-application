# Phase 120: E2E Specs — Settings-Permutation Matrix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 120-e2e-specs-settings-permutation-matrix
**Areas discussed:** Probe→spec relationship, Re-diagnosis structure, 119 closure sequencing, Existing-spec edits

> Context note: the EPERM *build* (what each spec asserts) was batch-decided in Phase 118 and is locked in `.planning/v2.14-E2E-COVERAGE-PLAN.md §Build List → EPERM`. This discussion covered only the post-118 addition — how the deferred Phase-119 probe-closure (`DEF-119-08-01`) folds into Phase 120.

---

## Probe→spec relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Probe seeds the spec | Wire the real perm-chain project per EPERM spec, get the probe green in isolation first (closes 119), then grow that same node into the full EPERM spec. One node per requirement, no throwaway _probes project. | |
| Standalone _probes first | Build a dedicated _probes Playwright project, get all 4 green standalone (closes 119 cleanly), THEN separately author the full EPERM specs. Closure & build as distinct gates. | ✓ |
| You decide at plan time | Defer the fold-vs-standalone choice to planner/researcher once isolation re-diagnosis reveals what's wrong. | |

**User's choice:** Standalone _probes first
**Notes:** The 4 deferred probes map 1:1 to EPERM-06/07/09/10. Green-in-isolation de-risks those four spec builds without growing the probe in-place into the spec. → D-01.

---

## Re-diagnosis structure (binding CONDITION 1 + 2)

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated isolation project + trace | A _probes/setup Playwright project running ONE probe at a time vs fresh server + clean DB, with a trace/measurement that SEPARATES the two conflated failure modes (mid-click detach vs never-mounts) and rules out the degraded-env confound — before proposing any fix. | ✓ |
| Re-diagnose inline per spec | Fold re-diagnosis into each EPERM spec build — fix as discovered while wiring the real project, no separate isolation harness. | |
| Spawn a debug session | Treat it as a /gsd-debug investigation producing a confirmed root cause before Phase 120 planning. | |

**User's choice:** Dedicated isolation project + trace
**Notes:** Directly satisfies the two binding `DEF-119-08-01` conditions — trace-first, fix-second; separate the conflated failure modes; address the env confound. → D-02.

---

## 119 closure sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Probes green → verify 119, then full specs | 4 probes green in isolation → /gsd-verify-work 119 closes it (UAT test #1 satisfied) → then build the full EPERM specs as Phase 120 proper. Clean sequential close. | ✓ |
| Close 119 at 120 completion | Fold everything into Phase 120; 119 closes only once the EPERM specs that subsume the probes pass 3×. Single combined gate. | |
| You decide | Let the planner sequence the closure gate based on the re-diagnosis outcome. | |

**User's choice:** Probes green → verify 119, then full specs
**Notes:** Phase 120 plans structured with Part-1 probe-closure first; the close gate precedes the spec-build plans. → D-03.

---

## Existing-spec edits

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — default additive | Keep seed changes additive (own namespaced perm datasets), edit existing specs only where genuinely non-additive (e.g. EPERM-05 org slice if it shifts voter-journey's rigid counts). EPERM-09 git mv + EPERM-11 consolidation as specified. | ✓ |
| Re-baseline opportunistically | While in each spec, also tighten/refactor adjacent rigid expectations beyond the minimum needed (broader cleanup pass). | |
| You decide at plan time | Defer additive-vs-edit calls to the planner per-spec, confirming non-additive ripples against base.ts at build time. | |

**User's choice:** Minimal — default additive
**Notes:** No opportunistic re-baselining of adjacent expectations; confirm the one likely non-additive case (EPERM-05 org slice) against base.ts org rows at build time. → D-04.

---

## Claude's Discretion

- Append order of the new/changed EPERM perm nodes within the serial chain tail (after `perm-disable-allow-open`).
- Whether to retire the `_probes` project once the EPERM specs subsume its assertions, or keep it as fast isolation smoke tests.
- Plan/wave decomposition (Part-1 probe-closure as wave 1; EPERM spec builds batched after).
- The actual confirmed root cause + fix, once isolation re-diagnosis produces it.
- Skip the `/gsd-ui-phase` auto-spawn (E2E-spec phase, no UI redesign despite ROADMAP `UI hint: yes`).

## Deferred Ideas

- EPERM-03 alliance-presence slice + EPERM-04 alliance tab-control → Phase 130 (UNBLK-06).
- EPERM-05 alliance-typed markers → OUT entirely (operator NOTE).
- EFLOW (121), bank-auth (122), EQTYP / EFLOW-02 / nominations cluster (129/130).
