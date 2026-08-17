---
phase: 118-e2e-coverage-audit-coverage-plan
plan: 02
subsystem: e2e-coverage-audit
tags: [e2e, audit, coverage-map, eflow, eqtyp, bank-auth, idura, documentation]
requires:
  - .planning/v2.14-E2E-COVERAGE-PLAN.md (Wave 1 / Plan 01 output — header, catalog inventory, EPERM map, --likert-only finding)
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - .planning/idura-ftn-auth-plan.md
provides:
  - EFLOW-01..11 coverage map (verified verdicts, real spec paths, actions, evidence)
  - EFLOW-10 bank-auth Idura-only retarget verdict (122.2)
  - EQTYP-01..03 coverage map (all DEFERRED → Phase 130)
affects:
  - Phase 121 (EFLOW flow specs)
  - Phase 122 (EFLOW-10 bank-auth)
  - Phase 130 (EQTYP new-feature specs + EFLOW-02)
tech-stack:
  added: []
  patterns: [per-requirement coverage table, A5 verify-don't-assume audit, deferred-build marking]
key-files:
  created: []
  modified:
    - .planning/v2.14-E2E-COVERAGE-PLAN.md
decisions:
  - "EFLOW-03 + EFLOW-05 confirmed covered, no new code (A5 verified against voter-journey.spec.ts)"
  - "EFLOW-06 Open Question 1 resolved: locale switch covers UI/content re-localisation but NOT mid-flow voter answer-state preservation → net-new in Phase 121"
  - "EFLOW-10 retarget to Idura-only (sub-based identity + hetu/country), drop Signicat, keep direct-Edge-Function synthetic-JWE stub (no live IdP) — 122.2"
  - "All EQTYP-01..03 DEFERRED → Phase 130; features (UNBLK-01/02/05) built Phase 129 per 119.4 override"
metrics:
  duration: ~12m
  completed: 2026-06-14
---

# Phase 118 Plan 02: EFLOW + EQTYP Coverage Maps Summary

EFLOW-01..11 and EQTYP-01..03 per-requirement coverage maps appended to `.planning/v2.14-E2E-COVERAGE-PLAN.md`, every verdict grounded against the real repo-root `tests/` catalog (A5 — verify, don't assume), plus the EFLOW-10 bank-auth Idura-only retarget verdict (122.2). Documentation/audit only — no test, fixture, or seed code written.

## What Was Built

Three appended sections replacing the placeholder anchors Plan 01 (Wave 1) left in the deliverable:

1. **EFLOW Coverage Map** — 11-row table (Req | Verdict | spec path | Action | Evidence), each verdict confirmed by reading the cited spec.
2. **### EFLOW-10 bank-auth (Phase 122)** note — the Idura-only retarget verdict with the deterministic-green-gate decision flagged for the 122 plan.
3. **EQTYP Coverage Map** — 3-row table (Req | Verdict | spec path | Action | Deferred? | Notes), all rows tagged DEFERRED → Phase 130.

## EFLOW Verdicts (verified)

| Req | Verdict | Action |
|-----|---------|--------|
| EFLOW-01 entity filters | PARTIAL | extend (categorical select-all/none, text × filter intersection) |
| EFLOW-02 alliance card + drawer | MISSING | DEFERRED → 130 (UNBLK-06) |
| EFLOW-03 4-case voter-vs-entity | COVERED, no new code | none |
| EFLOW-04 subMatches breakdown | PARTIAL | extend (assert correct values) |
| EFLOW-05 skip/delete/back + CTA | COVERED, no new code | none |
| EFLOW-06 mid-session locale switch | PARTIAL (answer-state-preservation MISSING) | extend/new in 121 |
| EFLOW-07 dark-mode persist | MISSING | new |
| EFLOW-08 prefs + tracking payloads | MISSING | new (+ intercept fixture) |
| EFLOW-09 nav menus both apps | PARTIAL | extend (candidate logged-in/out) |
| EFLOW-10 bank-auth | PARTIAL → Idura retarget | extend/retarget (122) |
| EFLOW-11 mobile interactive journey | MISSING | new |

**Open Question 1 resolved (EFLOW-06):** `perm-localisation-positive.spec.ts` switches locale on the voter home *before* answering and does a results cross-check on *persisted seeded* answers — it covers UI + content re-localisation but does NOT assert in-flight VOTER answer/selection state survives a fi→en→fi switch. The answer-state-preservation slice is net-new in Phase 121.

## EQTYP Verdicts (verified, all DEFERRED → Phase 130)

| Req | Verdict | Blocker |
|-----|---------|---------|
| EQTYP-01 multi-choice categorical opinion | PARTIAL (single-choice categorical covered; multiple-choice variant MISSING) | UNBLK-02 |
| EQTYP-02 number-scale opinion | MISSING (no number opinion in seed) | UNBLK-05 |
| EQTYP-03 text + MultipleText | PARTIAL (text covered; MultipleText blocked) | UNBLK-01 |

**EQTYP-01 candidate finding (per NOTE):** candidate-journey walks + saves ALL applicable opinion questions (Base ×5 incl. categorical Base-4 + boolean Base-5) via the generic `walkRemainingOpinionQuestions` loop — so candidate categorical/boolean OPINION answering is exercised generically, but with generic choice-select assertions, NOT type-specific variant checks (those exist only for candidate INFO questions). The *multiple*-choice categorical opinion variant (the EQTYP-01 target) does not exist in seed → UNBLK-02 → Phase 130.

## EFLOW-10 Bank-Auth Verdict (122.2)

The existing `candidate-bank-auth.spec.ts` already POSTs a synthetic JWE id_token directly to the `identity-callback` Edge Function (no live IdP) and is provider-shape-agnostic. The 122 verdict: **retarget to Idura-only** — assert the Idura `sub`-based identity match + Idura claim set (incl. `hetu`/`country`), **drop Signicat**, keep the direct-Edge-Function synthetic-token stub. Flagged Open Question 2 as a 122-phase decision: configure the test decryption JWKS in `beforeAll` so the keys-configured path runs deterministically under the A6 green gate (else "did not run" = cardinal failure), and document the run command.

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed in order, each verified and committed atomically. The `state.advance-plan` quirk (prose STATE.md) noted in the execution rules is handled in the State Updates section below (manual update like Wave 1).

## Commits

- `7bddd3135` docs(118-02): append EFLOW-01..11 coverage map
- `0776a6dfb` docs(118-02): record EFLOW-10 bank-auth Idura-only retarget verdict (122.2)
- `8d89e6ee8` docs(118-02): append EQTYP-01..03 coverage map, all DEFERRED to Phase 130

## Verification

- EFLOW Coverage Map present, all 11 reqs classified with verified verdicts + real spec paths. PASS
- EFLOW-03/05 carry "confirmed covered, no new code". PASS
- EFLOW-10 records Idura-only retarget; Signicat dropped; no live IdP. PASS
- EQTYP Coverage Map present, all 3 reqs classified + tagged DEFERRED. PASS
- No test/fixture/seed code written (`git show --stat HEAD~3..HEAD` → no .ts/.js/.svelte/.sql files). PASS

## Known Stubs

None. The deliverable is a complete audit document; the placeholder anchors for Plan 03 (Build List, Extension-Scope Pins) and Plan 04 (Deferred-Build Markers, Cross-Cutting subsections) remain by design — those are the next waves' responsibility, not stubs of this plan.

## Self-Check: PASSED

- FOUND: `.planning/v2.14-E2E-COVERAGE-PLAN.md`
- FOUND: `.planning/phases/118-e2e-coverage-audit-coverage-plan/118-02-SUMMARY.md`
- FOUND commits: 7bddd3135, 0776a6dfb, 8d89e6ee8
