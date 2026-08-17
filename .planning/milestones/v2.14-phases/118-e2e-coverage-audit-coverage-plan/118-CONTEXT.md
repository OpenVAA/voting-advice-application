# Phase 118: E2E Coverage Audit + Coverage Plan - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning
**Source:** Batched discuss-phase stand-in (`.planning/v2.14-E2E-DISCUSSION-POINTS.md`)

<domain>
## Phase Boundary

Phase 118 produces an **approved, written coverage plan** — a per-requirement coverage map
(covered / partial / missing) for every EPERM-01..11, EFLOW-01..11, EQTYP-01..03, plus an explicit
build list (new spec files, existing specs to extend, seed-data changes, semantic steps, fixtures/helpers)
covering the whole v2.14 E2E workstream — **including** the deferred-build end-cluster specs (129-130).

**No E2E test code is written in this phase.** The deliverable is a markdown coverage plan in `.planning/`,
reviewed and approved (operator gate) before any fixture/spec code lands in Phase 119+.

This is the audit-first approval gate that shapes every downstream E2E phase (119-122, 129-132).
</domain>

<decisions>
## Implementation Decisions (locked — from the batched discussion doc)

### Audit methodology
- **A5 — Verify, don't assume.** Re-run/inspect the cited specs and classify covered/partial/missing per
  requirement. Default = verify ALL, including the 6 "already covered" items (EPERM-01/03/08/11, EFLOW-03/05).
- **A9 / 118.3 — Semantic-step granularity.** One behaviour-level block per new/edited spec ("use e2e/base →
  results all-answered polar-max → open candidate X > opinions → expect …"), behaviour not selectors. Enough
  that 120-122/130 execution needs no further discovery. Operator re-checks the deliverable before execution.
- **118.3 — Already-covered treatment.** List the 6 confirmed-covered requirements with the confirming spec
  path + a one-line "confirmed covered, no new code" verdict, so the map is complete.
- **118.4 — Pin extension scopes** for the partials: EPERM-06/07/09 and EFLOW-01/04/08/09 — state exactly what
  each extension adds so spec phases don't re-scope.

### Cross-cutting (carried into the plan as constraints on downstream phases)
- **A1 (OPERATOR OVERRIDE) — Kill `--likert-only` entirely, no backward-compat shim.** The audit MUST assess
  whether `--likert-only` can be removed completely, with the preferred direction being to make the **voter
  fixtures handle non-Likert opinion question types** (boolean/categorical/number) natively rather than seeding
  them out. This replaces the original "guard new types behind `--likert-only`" default.
- **A3 — Behaviour via fixtures, not selectors** (enforced by `typecheck:tests` + `no-restricted-locators`).
- **A4 — Extend an existing perm/spec over adding a new one** where the NOTEs direct it; the audit pins each case.
- **A6 — Per-phase live-E2E green gate** at the end of each spec phase (120/121/122/130), not just at 132.
- **A7 — New spec files** follow the post-Phase-93/94 reorganised catalog layout; the 118 plan lists exact paths.
- **A8 — Fixtures-first is a hard gate** (no spec authored before its fixtures exist + typecheck + smoke).
- **119.3 (note) — Editing existing specs' rigid expectations is ALLOWED** when a seed/fixture change ripples;
  surface non-additive seed changes but spec edits are not off-limits.
- **119.4 (OPERATOR OVERRIDE) — Build the deferred-cluster fixtures alongside the unblockers (Phase 129)**, not
  deferred piecemeal to 130. Generic helpers still land in 119 if cheap.
- **122.2 (note) — Test the Idura OIDC flow ONLY; drop Signicat (outdated).** Stub/mock the IdP; reuse the
  Phase-91 / `idura-ftn-auth-plan.md` stub seam.
- **129.2 — Separate UI-SPEC** for the new input components + alliance card, grounded in existing
  Button/Input/EntityCard conventions.

### Deferred-build marking (Success Criterion 3)
- The plan MUST explicitly mark EQTYP-01/02/03, EFLOW-02 (alliance card + member-orgs drawer), the
  nominations-route spec, and the EPERM-03 alliance-presence slice as **deferred-build → end cluster
  (Phases 129-130)** — planned now, built after the new features land.

### Claude's Discretion
- Exact format/structure of the coverage-map markdown deliverable (table vs per-requirement sections), as long
  as it satisfies the four success criteria and is reviewable at semantic-step depth.
- How deeply to re-run vs statically inspect each cited spec during the audit.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning.**

### Batched discuss-phase decisions (PRIMARY)
- `.planning/v2.14-E2E-DISCUSSION-POINTS.md` — every gray-area decision for the E2E workstream, with the
  operator's `★ DECISIONS LOCKED` header (A1/119.4/122.2 overrides + confirmed defaults).

### Requirements + roadmap
- `.planning/REQUIREMENTS.md` — EPERM/EFLOW/EQTYP/UNBLK/HARDN definitions + per-requirement NOTEs + the
  operator-mandated E2E ordering.
- `.planning/ROADMAP.md` — v2.14 Phases 118-132 detail (this phase + every downstream phase it plans for).

### Determinism precedent
- v2.10 final suite (82/2) and v2.11 gate (84/0) as the 3×-green determinism standard.

### E2E catalog / fixtures (for the audit to inspect)
- `apps/frontend/tests/` — current spec catalog (post-Phase-93/94 reorganised layout).
- `apps/frontend/tests/tests/fixtures/voter.fixture.ts` — voter fixture (the `--likert-only` coupling lives here).
- `packages/dev-seed/` — seed templates incl. `e2e/base`; `--likert-only` flag implementation.
- `.planning/idura-ftn-auth-plan.md` — bank-auth stub seam precedent (Phase 91).
</canonical_refs>

<specifics>
## Specific Ideas

- The audit deliverable is the operator approval gate: per A9 note, the operator re-checks it before Phase 119
  execution begins. Plan should treat "deliverable written + committed" as the phase's completion, with the
  approval being an explicit operator step.
- `--likert-only` removal is the highest-leverage cross-cutting finding to nail down in the audit, since it
  ripples into 119 fixtures, 119.3, and 130.4 seed.
</specifics>

<deferred>
## Deferred Ideas

- RUNES (123-124) and TYPE/svelte-check (125-128) are separate, independent workstreams — NOT in scope of this
  audit or its coverage plan.
- All actual fixture/spec/seed code — built in 119-122, 129-130; this phase only plans it.
</deferred>

---

*Phase: 118-e2e-coverage-audit-coverage-plan*
*Context gathered: 2026-06-14 via batched discuss-phase stand-in*
