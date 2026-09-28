---
phase: 162-permissions-auth-model-refactor
plan: 18
subsystem: auth / edge-functions / conformance record
tags: [criterion-7, flow-conformance, user_can, edge-functions, gap-closure]
status: complete
requires:
  - "162-REVIEW-FIX run (CR-05 729964a56, WR-09 3e3c2a0f1, WR-02 0ae0b7565, WR-07 30a40f0ca, WR-06 e3e9ecb45, WR-03 ae6ed6395, IN-05 9f84cfc50)"
provides:
  - "invite-candidate and send-email flow gates that redden when the gate's answer is ignored, shadowed, re-hand-rolled, or bound to the wrong RPC parameters or project"
  - "162-FLOW-CONFORMANCE.md re-derived against the tree: What-changed, invite-candidate, send-email, identity-callback, census, F-1..F-5"
  - "evidence/162-18/flow-controls.txt (G1-G5 + s variants) and evidence/162-18/census.txt"
affects:
  - "162-19 (closes the document out, adds nomination-confirmation flow)"
tech-stack:
  added: []
  patterns:
    - "source-order assertions (gate -> refusal condition -> 403 message -> service-role key) to prove a gate's answer is used, not only present"
    - "RPC argument names asserted by import against parameter names parsed from the declarative schema"
key-files:
  created:
    - .planning/phases/162-permissions-auth-model-refactor/evidence/162-18/flow-controls.txt
    - .planning/phases/162-permissions-auth-model-refactor/evidence/162-18/census.txt
  modified:
    - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
    - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
    - .planning/phases/162-permissions-auth-model-refactor/162-FLOW-CONFORMANCE.md
    - .planning/WINDOWS.md
decisions:
  - "162-FLOW-CONFORMANCE.md is superseded, not amended: 162-17's version stays readable at 85ae062aa"
  - "The account-to-project reach is recorded CLOSED (F-4) by CR-05/WR-09, pinned by the pgTAP 'an account admin is denied every permission on a project in another account'; WINDOWS 263 fixed"
  - "Every re-derived conformance table walks each authority step across all seven § 5 columns (F-5: the branch-by-branch comparison is why 162-17 missed two non-conforming invite steps)"
metrics:
  duration: "~11 min"
  completed: 2026-09-19
  tasks: 3
  files: 6
estimate:
  tokens: 50000
  tasks: 3
actuals:
  tokens: 19650
  tasks: 3
  commits: 3
plan_head_before: 400366a27932f0f8442cce0c930c4e2ac20f346a
---

# Phase 162 Plan 18: Criterion-7 flow conformance re-derived against the user_can gate Summary

The invite-candidate and send-email flow gates now fail when the `callerMayOnProject` → `user_can` answer is ignored, shadowed, replaced by a hand-rolled claim check, or bound to the wrong RPC parameters or project. Nine planted controls each turned at least one named assertion red. `162-FLOW-CONFORMANCE.md` was re-derived from the current tree. Every step is checked against all seven matrix columns. The account-to-project reach is recorded CLOSED (F-4) and WINDOWS 263 is marked fixed.

## What was done

**Task 1 (tracer), invite-candidate, `5e2b19665`.** Four assertions were added, with the titles the plan specifies:
- the permission-literal membership check is non-vacuous
- the gate is imported from `./callerAuthority.ts` and is not declared locally
- `if (!mayInvite)`, then `status: 403` and the Forbidden message, all come before the first `SUPABASE_SERVICE_ROLE_KEY`
- the helper's RPC keys equal the `user_can` parameter names parsed from `301-auth-functions.sql` (pinned at 3), and `p_scope` is a parsed `grant_scope_type` member (pinned at 4)

Controls, run in a scratch copy with T0 = 17:
- G1 (refusal forced to `if (false)`): 1 red
- G2 (local shadow function): 1 red
- G3 (hand-rolled claim check): 3 red
- G4 (`p_target_id` renamed in the scratch schema): 1 red

Document changes: the What-changed section (eight SHAs), the invite table (15 walked steps, all seven columns) and F-5.

**Task 2, send-email, `ff233807a`.** Three assertions were added: B′ (the gate comes from the shared module), C′ (the refusal is conditioned on the gate's answer) and E. E checks this order: gate refusal, then `requireEnv('PUBLIC_PROJECT_ID'`, then the `Invalid project_id` refusal, then `rpc('resolve_email_variables'`. It also requires `p_project_id: configuredProjectId` and forbids `p_project_id: project_id`.

Controls, T0 = 16:
- G1s: 1 red
- G2s: 1 red
- G3s: 3 red
- G5: 1 red

Document changes: the send-email table (11 steps, including a CLOSED row for F-4), F-3 re-derived and F-4 added. `gsd-tools windows fixed 263` succeeded on the first call and did not refuse. Row 272 (F-2) is still open.

**Task 3, census and identity-callback, `75d7f285d`.** The census was re-derived from `git grep` runs, and the raw output is in `census.txt`. Totals:
- **3 claim readers:** `roles.ts`, `passwordLogin.ts`, `supabaseDataWriter.ts`, plus `requireAdminIdentity.ts`, which reads the claim through the normalised role.
- **3 `user_can` asking sites:** the two `callerAuthority.ts` copies and `supabaseAdminWriter.ts`.
- **New to the census:** `passwordLogin.ts`, `supabaseAdminWriter.ts` and `callerAuthority.ts`.
- `jwtSegment.ts` is imported by no non-test file.

The identity-callback table covers 9 steps, including `requireVerifyClaimBinding`, `entity.confirm`, WR-06 and the F-1 DEFERRED row. F-1 was re-derived using content anchors only.

**Executable half, final counts:**

| File | Tests |
|---|---|
| invite flow | 17 |
| send-email flow | 16 |
| identity-callback flow | 13 |
| `callerAuthority.test.ts` | 10 |

All pass. The full `@openvaa/supabase` unit suite is 164/164 and `assert-edge-env-defaults.mjs` passes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1: Stale record] Updated parts of the document that were stale but outside the plan's four named sections**
- **Found during:** Task 3
- **Issue:** Several parts of the document still described deleted code or cited line numbers:
  - the header claimed "36 assertions"
  - the callout claimed "two" findings
  - F-2 cited `invite-candidate/index.ts:139`, which is now the wrong line
  - two rows of "What the executable half enforces" described the retired `(scope, role)` pair matching and the scope-matched project branch
- **Fix:**
  - header counts replaced with the vitest-measured ones
  - callout now states the five findings
  - F-2 re-anchored by content (the `redirectTo` assignment)
  - the two stale table rows replaced with five rows, one for each new property and its control
- **Files modified:** `162-FLOW-CONFORMANCE.md`
- **Commit:** `75d7f285d`

**2. [Rule 3: Lint] Used a type-only import in the invite flow gate**
- **Found during:** Task 1
- **Issue:** eslint `import/consistent-type-specifier-style` rejects the inline `type RpcClient` specifier.
- **Fix:** Split it into `import type { RpcClient }`, sorted with `eslint --fix`.
- **Note:** `callerAuthority.test.ts` has the same pre-existing violation. This plan may not modify that file, and no `yarn lint:check` step lints `apps/supabase`, so it was left alone.

## Controls record

All controls are in `evidence/162-18/flow-controls.txt`. Each line gives the exact plant command, `plant applied: 1`, T0, passed, `reddened: N` and the failing titles. Red counts follow D-37: T0 minus passed, taken from vitest's JSON `numPassedTests`. The scratch tree `apps/supabase/.m18-controls` was deleted after each task, and `git status --porcelain` was recorded afterwards. No control reddened 0, so no assertion needed a second run.

## E2E reasoning

This plan changed only two vitest files next to the Edge Functions, plus planning documents. No Playwright spec serves, bundles or exercises either file. The Edge Function sources are byte-identical to `a3a2d3343`, checked with `git diff --quiet`: every `index.ts`, both `callerAuthority.ts`, both `entityGrant.ts`, `callerAuthority.test.ts` and the identity-callback flow gate. So `tests/e2e-runs/phase162-reviewfix-run01` (165/0/0/0) is still the suite's state for every byte E2E exercises. 162-19 re-proves this by diff when it closes the phase.

## Known Stubs

None.

## Threat Flags

None. No runtime code changed. All threat-register mitigations T-162-18-01..06 are implemented by assertions and shown by the controls.

## Self-Check: PASSED

- FOUND: apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
- FOUND: apps/supabase/supabase/functions/send-email/flowConformance.test.ts
- FOUND: .planning/phases/162-permissions-auth-model-refactor/162-FLOW-CONFORMANCE.md
- FOUND: .planning/phases/162-permissions-auth-model-refactor/evidence/162-18/flow-controls.txt
- FOUND: .planning/phases/162-permissions-auth-model-refactor/evidence/162-18/census.txt
- FOUND commits: 5e2b19665, ff233807a, 75d7f285d
