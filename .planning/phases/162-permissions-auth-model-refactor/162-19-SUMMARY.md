---
phase: 162-permissions-auth-model-refactor
plan: 19
subsystem: auth / database triggers / conformance record
tags: [criterion-7, level-1, nomination-confirmation, entity-confirmation, pgtap, flow-conformance, gap-closure]
status: complete
requires:
  - "162-18 (What-changed, census, invite-candidate, send-email, identity-callback sections; F-1, F-3..F-5; controls G1-G5)"
provides:
  - "32-level1-confirmation-flow.test.sql: a ProjectEditor (level 1) driven through enforce_nomination_confirmation and enforce_entity_immutability, with paired allowances"
  - "N1/N2 applied-database controls showing each confirmation assertion family can fail"
  - "F1/F2/F2i re-measured against the current flow-conformance corpus"
  - "162-FLOW-CONFORMANCE.md closed out: confirmation-flow section, F-2 re-derived, executable-half table rewritten, header/callout, WR-04 cross-reference"
  - "SKILL.md Service Patterns and the review checklist describe the user_can-through-the-caller's-token gate"
affects:
  - "162-VERIFICATION.md criterion 7 (re-verification)"
tech-stack:
  added: []
  patterns:
    - "a level-1 identity built as a single public.grants row and entered with an empty grant array, so set_test_user never re-seeds the fixture's admin grant; the single-grant state asserted at both ends of the file"
    - "trigger negative controls issued as DISABLE -> test:db -> ENABLE in one no-set-e script, with tgenabled read after each step"
key-files:
  created:
    - apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql
    - .planning/phases/162-permissions-auth-model-refactor/evidence/162-19/confirmation-controls.txt
    - .planning/phases/162-permissions-auth-model-refactor/evidence/162-19/flow-controls-rerun.txt
  modified:
    - .planning/phases/162-permissions-auth-model-refactor/162-FLOW-CONFORMANCE.md
    - .claude/skills/database/rls-policy-map.md
    - .claude/skills/database/SKILL.md
    - .agents/code-review-checklist.md
decisions:
  - "The confirmation flow conforms in all nine walked steps; it adds no finding, so the document stays at 5 findings (1 DEFERRED, 1 GAP, 3 CLOSED)"
  - "File 32 enters every identity with an empty grant array (set_test_user + set_test_grants) so the ProjectEditor never regains admin_b's project-B admin grant; the single-grant state is asserted first and last"
  - "F2 now reddens 1 of 46 where 162-17 measured 2 of 36; the corpus changed, and 162-17's ledger rows are cited as history, not rewritten"
metrics:
  duration: "~15 min"
  completed: 2026-09-19
  tasks: 2
  files: 7
estimate:
  tokens: 60000
  tasks: 2
actuals:
  tokens: 10200
  tasks: 2
  commits: 2
plan_head_before: 0aa1e5f3aa2a6740c79e4a506ac4a8b782632f58
---

# Phase 162 Plan 19: Level 1 through the confirmation flows, and the flow-conformance check closed out Summary

A new pgTAP file, `32-level1-confirmation-flow.test.sql`, drives a ProjectEditor through both confirmation triggers. The ProjectEditor is built from a single project-scope `editor` grant row. When it edits a confirmed nomination, the nomination becomes unconfirmed. When it tries to confirm one, it is refused with an error naming `nomination.confirm`. It can change an entity's confirmed flag. Each refusal has a paired allowance: a ProjectAdmin can edit and confirm in one statement, and an entity user is refused where the ProjectEditor succeeds. Disabling each trigger on the applied database turns the matching assertions red, and both triggers were confirmed re-enabled (`O`) afterwards. `162-FLOW-CONFORMANCE.md` is now closed out against the tree, and the two pieces of agent guidance that still prescribed the retired claim check have been corrected.

## What was done

**Task 1 (tracer), `3f2f1e46e`.** Created `32-level1-confirmation-flow.test.sql` with `plan (13)`:
- grant-state checks at both ends: `admin_b` holds exactly the one editor grant on project A
- two starting-state checks: the nomination and the candidate both start confirmed
- L0: `project.edit_nominations` ✓ and `nomination.confirm` ✗
- L1: the ProjectEditor's edit affects 1 row, and the nomination then reads unconfirmed
- L2: the ProjectEditor's confirm attempt is refused with `%nomination.confirm%`
- L3: a ProjectAdmin edits and confirms in one statement
- L4: the ProjectEditor's change to the entity flag succeeds and is stored
- L5: `candidate_a`'s change to its own flag is refused with `Entity confirmation requires the entity.confirm permission:%`

The edit helper is a `pg_temp` function and is not SECURITY DEFINER. `test:db` passed: Files=32, Tests=1204. Also in this task:
- added the policy-map row for file 32
- added the conformance section `## Nomination and entity confirmation — the database-enforced flow, checked at level 1`, with 9 steps across all seven columns and a closing level-1 paragraph

Tracer gate: all three automated verify blocks were re-run and passed before Task 2 started.

**Controls (applied database):**

| Control | Perturbation | File-32 assertions that failed | Allowances that stayed green |
|---|---|---|---|
| N1 | `enforce_nomination_confirmation_before_insert_or_update` on `public.nominations` disabled | 6-7 (L1 unconfirm, L2 refusal) | 5, 8 |
| N2 | `enforce_entity_immutability` on `public.candidates` disabled | 12 (L5) | 10-11 |

Each disable, its `test:db` run and its re-enable ran in one script. Final state: both triggers `O`. The restore run of `test:db` passed. `yarn db:reset` was not needed.

**Task 2, `8385cfbbb`.** Closed out the conformance document and corrected the guidance:
- **F-2** was re-derived using content anchors only. It is still a GAP, and WINDOWS 272 stays open.
- **F1, F2 and F2i were re-measured** in the scratch tree `apps/supabase/.m19-controls`, which has since been removed. T0 = 46. F1 turned 6 assertions red, F2 turned 1 red and F2i turned 1 red.
- **The executable-half table was rewritten.** The vitest half has one row per `it(` title and the pgTAP half has one row each for files 07, 12, 19, 23, 25 and 32. 162-17's F1/F2 ledger rows are cited as history.
- **Header:** HEAD `3f2f1e46e`, **56 tests across the four vitest files**, and file 32's plan of 13.
- **Callout:** **5 findings**.
- **WR-04** is cross-referenced as an open product decision, with no code change.
- **Guidance:** `SKILL.md` Service Patterns item 1 and the checklist's Edge Functions item now describe `user_can` asked through the caller's own token via `callerMayOnProject`.

Phase gates, each exit status read directly:

| Gate | Exit | Result |
|---|---|---|
| `yarn workspace @openvaa/supabase test:unit` | 0 | 164 passed |
| `test:db` | 0 | Files=32, Tests=1204, Result: PASS |
| `yarn test:unit` | 0 | 25/25 tasks |
| `yarn lint:check` | 0 | — |
| prettier | 0 | — |

The E2E coverage gate passed. Since `a3a2d3343`, the only changed paths outside `.planning` are the six allowed ones. The reference run `phase162-reviewfix-run01` is at `a3a2d3343`, exited 0, and recorded 0 unexpected, 0 flaky and 0 skipped.

## Deviations from Plan

**1. [Rule 2 - Correctness] Single-grant assertion at both ends of file 32.** The plan says to seed `admin_a`/`candidate_a` with `test_seed_identity_grants`. But passing a non-empty grant array to `set_test_user` re-seeds the whole fixture, which would hand `admin_b` its project-B admin grant back. So every identity is entered with `'[]'` plus `set_test_grants`. Two extra assertions (the first and the last) prove the ProjectEditor held only its editor grant throughout. Together with two starting-state checks, that gives 13 assertions instead of a bare L0–L5 count.

**2. [Scope note] F2 reddens 1, not 162-17's 2.** 162-17's second F2 failure is no longer triggered by a planted non-member. The bulk-send permission assertion now checks the specific permission, which F1 turns red instead. Recorded as measured.

Otherwise the plan was executed as written.

## Known Stubs

None.

## Self-Check: PASSED
- FOUND: apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql
- FOUND: evidence/162-19/confirmation-controls.txt, evidence/162-19/flow-controls-rerun.txt
- FOUND: commits 3f2f1e46e, 8385cfbbb
- Triggers: both `tgenabled = O`; `apps/supabase/.m19-controls` absent
