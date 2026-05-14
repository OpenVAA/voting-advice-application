---
phase: 84
plan: 02
status: not_executed
contingent: true
contingent_trigger_fired: false
auto_complete: skipped-ladder-halted-at-plan-01
requirements_addressed:
  - DETERM-09
created: 2026-05-14
---

# Plan 84-02 — DETERM-09 Contingent Fallback (NOT EXECUTED)

> **Status: SKIPPED.** This contingent plan did not execute because Plan 01's cheapest-first ladder halted at the D-03 gate — DETERM-08 alone shrank DATA_RACE 15 → 3 (Phase 84 mission target met).

## Contingent Trigger

Plan 02's frontmatter defined the trigger as: *"Plan 01 Task 3 checkpoint resumes with `escalate-to-determ-09` (Plan 01 Task 2 smoke shows DATA_RACE pool > 3 after the project-graph repoint)."*

**Trigger outcome:** Not fired. Plan 01 Task 2's 1-run cold-start smoke (after the Rule 1 deviation fix at commit `86e94d3d1`) measured DATA_RACE pool = 3 — exactly matching the structural binding target (3 image-intrinsic IMGPROXY_TIED_TITLES survivors: CAND-03 upload + CAND-12 readback + CAND-03 readback). The D-03 gate verdict was `approved` (proceed to Task 4), NOT `escalate-to-determ-09`.

## Why Skipped (Per CONTEXT D-03 + D-04 Cheapest-First Ladder)

CONTEXT.md's D-03 / D-04 locked the cheapest-first ordering:

> **D-03 — Cheapest-first ladder cadence:** DETERM-08 first → 1-run smoke → DETERM-09 only if pool > 3.
> **D-04 — DETERM-09 (config tuning) is FALLBACK only.** If escalated, tune all 4 knobs atomically.

DETERM-08's structural decoupling (re-auth-setup project-graph repoint + Rule 1 deviation file-scoped re-auth) was sufficient on its own. The Supabase imgproxy infrastructure flake (Phase 73 D-09 binding rationale) was not the proximate cause of the 11 candidate-app-settings + 2 password + 2 re-auth-dual cascade — the cascade was a Playwright project-dependency chain rooted in `re-auth-setup` waiting for `candidate-app-mutation` to finish (which it no longer does after the repoint).

No `[storage.image_transformation]` knob tuning was needed.

## What Plan 02 Would Have Done (For Reference)

If the trigger had fired, Plan 02 would have applied an atomic 4-knob tune to `apps/supabase/supabase/config.toml [storage.image_transformation]`:
- `concurrency` (parallel image-transformation workers)
- `read_timeout` (per-request timeout)
- `connection_timeout` (connection-pool acquisition timeout)
- `max_concurrency` (cap on simultaneous transformations)

The numeric values, an entry-checkpoint for trigger confirmation, and a re-smoke verification step are documented in `84-02-PLAN.md` and remain useful as a reference for any future imgproxy-tuning work.

## Phase 84 Anchor (Post Plan 01 Close)

| Bucket | Phase 83 | Phase 84 | Delta |
|--------|----------|----------|-------|
| PASS_LOCKED | 94 | **106** | **+12** |
| DATA_RACE | 15 | **3** | **−12** |
| CASCADE | 47 | **47** | **0** |
| **Total** | **156** | **156** | **0** |

**New v2.10 All-Green Suite anchor SHA-256:** `04ddfdd85cfbcd6505626eb8fb50f3e6f35c11e5385df1f4c8695b22ed0655aa` (run-1 ≡ run-3; run-2 differed by 1 cell — `voter-detail party-drawer` flake routed to Phase 86 per ROADMAP).

Phase 83 anchor `d6bfeebdb0…` is ABSORBED by this regen.

## Files Modified

None. Plan 02 made zero changes — it never executed.

## Commits

None.

## Verification Status

- ✓ Contingent trigger evaluation: D-03 gate at Plan 01 Task 3 returned `approved`, not `escalate-to-determ-09`.
- ✓ Cheapest-first ladder honored: Plan 02 correctly skipped (per CONTEXT D-03 + D-04).
- ✓ Phase 84 SCs achieved without DETERM-09 (see `84-01-SUMMARY.md`).
- ✓ `apps/supabase/supabase/config.toml` UNCHANGED (the file remains at Phase 83 post-D-01c state with `[storage.image_transformation] enabled = true`).

## DETERM-09 Requirement Disposition

DETERM-09 requires that `apps/supabase/supabase/config.toml [storage.image_transformation]` be **tunable for cold-start resilience** — NOT that tuning be applied in every case. The REQUIREMENTS.md DETERM-09 acceptance criteria phrase reads (per CONTEXT.md Phase Boundary item 2): *"Parallel lever to DETERM-08; not a substitute for the structural decoupling."*

The structural decoupling (DETERM-08) achieved the DATA_RACE shrinkage target without DETERM-09 tuning being required. DETERM-09 thus closes as **DEFERRED-UNNECESSARY** for the Phase 84 anchor. If a future cold-start hits imgproxy 502s that exceed Phase 73 Pitfall 5 recovery (supabase stop/start), DETERM-09 tuning remains available — Plan 02's prescribed 4-knob tune is documented and ready to execute.

---

*Plan 02 SKIPPED 2026-05-14 (post Plan 01 close). Anchor binding: 84-01-SUMMARY.md.*
