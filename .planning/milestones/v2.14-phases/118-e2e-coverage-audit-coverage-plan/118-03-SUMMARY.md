---
phase: 118-e2e-coverage-audit-coverage-plan
plan: 03
subsystem: e2e-coverage-planning
tags: [e2e, playwright, coverage-plan, build-list, audit]
requires:
  - "118-01 (EPERM map + --likert-only finding)"
  - "118-02 (EFLOW + EQTYP maps)"
provides:
  - "Build List (EPERM Phase 120 + EFLOW Phase 121 + Bank-Auth Phase 122) at semantic-step depth"
  - "Extension-Scope Pins (118.4) for EPERM-06/07/09 + EFLOW-01/04/08/09 (+EPERM-05 org slice)"
affects:
  - "Phases 120/121/122 spec execution (each build block is self-contained — no re-audit)"
tech-stack:
  added: []
  patterns:
    - "Serial perm-* DAG append pattern (new perm node depends on perm-disable-allow-open tail)"
    - "Leaf voter-spec read-only-on-base pattern (mirrors cold-entry-dataroot, no setup/teardown pair)"
    - "Mobile-viewport project via device descriptor at project-config level"
key-files:
  created: []
  modified:
    - ".planning/v2.14-E2E-COVERAGE-PLAN.md"
decisions:
  - "EFLOW-06 answer-state-preservation slice pinned to EXTEND perm-localisation-positive (owns locale-switch machinery)"
  - "EFLOW-09 candidate logged-in/out nav pinned to EXTEND candidate-journey (owns auth lifecycle)"
  - "EFLOW-07/08/11 are new LEAF voter specs (own testMatch, depend on data-setup-base, read-only)"
  - "EFLOW-08 names a new shared trackingIntercept fixture intercepting at the tracking-service emit boundary (121.4)"
metrics:
  duration: "~25m"
  completed: "2026-06-14"
  tasks: 3
  files: 1
---

# Phase 118 Plan 03: EPERM/EFLOW/EQTYP Build List + Extension-Scope Pins Summary

Appended the actionable BUILD LIST (per-spec project wiring + seed delta + fixtures-first + behaviour-level semantic steps) and the 118.4 extension-scope pins to `.planning/v2.14-E2E-COVERAGE-PLAN.md`, turning the Plan 01/02 partial/missing verdicts into self-contained build entries that Phases 120–122 execute without re-auditing.

## What was built

- **Build List section** with a serial-DAG anchor preamble (base/voter chain, perm-family tail = `perm-disable-allow-open`, new-perm append rule, leaf read-only pattern), grounded in a fresh read of `tests/playwright.config.ts`.
- **EPERM (Phase 120) subsection** — one block per partial/missing EPERM verdict: EPERM-04/05/11 (extensions), EPERM-06/07/10 (new perm specs with full project/setup/teardown/dependencies wiring + new perm templates), EPERM-09 (extends the existing feedback perm per A4).
- **EFLOW (Phase 121) subsection** — EFLOW-01/04 (extend voter-journey, A4), EFLOW-06 (extend perm-localisation-positive), EFLOW-09 (extend candidate-journey), EFLOW-07/08/11 (new leaf voter specs). EFLOW-08 names the new `trackingIntercept` fixture; EFLOW-11 names the mobile-viewport project with a device descriptor.
- **Bank-Auth EFLOW-10 (Phase 122) block** — retarget `candidate-bank-auth.spec.ts` to Idura-only (sub-based identity match + hetu/country claims), keep the synthetic-JWE direct-Edge-Function stub, with the deterministic-green-gate `beforeAll` JWKS configuration note (A6 / Open Question 2).
- **Extension-Scope Pins (118.4) section** — tight net-new-delta pins for EPERM-06/07/09 + EFLOW-01/04/08/09 (plus EPERM-05 org slice), so spec phases do not re-scope.

## Verification

- Task-level greps PASS for all three tasks (Build List + EPERM/EFLOW headers + project-wiring + semantic-step + intercept + mobile-viewport + bank-auth tokens; all seven 118.4 pins present).
- Reachability: every partial/missing requirement (EPERM-04/05/06/07/09/10/11, EFLOW-01/04/06/07/08/09/11, EFLOW-10) has exactly one `#### <id>` build block.
- A4 extensions point at named existing specs: EPERM-09 → `perm-header-show-feedback.spec.ts`; EFLOW-01/04 → `voter-journey.spec.ts`.
- `git diff --stat 178515937 HEAD` shows ONLY `.planning/v2.14-E2E-COVERAGE-PLAN.md` changed — no test code, fixtures, or seed changes written (this is the PLAN for them).

## Deviations from Plan

None — plan executed exactly as written. (Plan placeholder header was "## Build List (Plan 03)"; replaced with "## Build List" + "### EPERM (Phase 120)" subsection per the Task 1 action text, which the verify grep `### EPERM` confirms.)

## Notes for downstream phases

- The build list deliberately covers **representative cells, not the full cartesian product** (120.6).
- The deferred-cluster entries (EQTYP-01/02/03, EFLOW-02 alliance, nominations-route, EPERM-03 alliance slice, EPERM-04 alliance tab control, EPERM-05 alliance markers) are NOT in this build list — they are finalised in Plan 04's Deferred-Build Markers section.
- Several new fixtures/helpers are named for Phase 119 (fixtures-first, A8): `trackingIntercept` fixture, dark-mode/theme reader, candidate/voter `expectNavMenuItems`, interactive-info mode helper, video testid handle, About-disclosure testid handle, categorical select-all/none on `entityFilters`.

## Self-Check: PASSED

- FOUND: `.planning/phases/118-e2e-coverage-audit-coverage-plan/118-03-SUMMARY.md`
- FOUND: `.planning/v2.14-E2E-COVERAGE-PLAN.md`
- FOUND commits: 733fbc9ca (EPERM build list), 6d62b2e46 (EFLOW + Bank-Auth), 56889c4cf (Extension-Scope Pins)
