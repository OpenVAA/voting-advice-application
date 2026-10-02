---
phase: 166-retire-auth-user-id-entity-identity-from-grants
plan: 04
subsystem: testing
tags: [gates, e2e, playwright, pgtap, bank-auth, idura, docs, claude-skills, todos]

requires:
  - phase: 166-01
    provides: get_candidate_user_data through private.caller_entity_ids; idx_grants_one_candidate_editor; the 36 anon census
  - phase: 166-02
    provides: Edge Functions and the E2E admin client resolving identity through grants; compensating delete in identity-callback
  - phase: 166-03
    provides: the link column and its indexes dropped; census un-wrapped; final source tree (6e0e2d968)
provides:
  - GATES.md recording D-20 links 1-6 on the final tree, every one exit 0 with decoded totals, and a PASS verdict
  - the full E2E suite at 171/171 (0 failed, 0 flaky, 0 skipped, 0 did-not-run) on a freshly reset database
  - bank-auth 8/8 x3 and bank-auth-journey 131/131 x3 on the grant-only identity path, with no env file or TLS bypass in the repository
  - .claude/skills/database (four files) describing the grant as the only link from an auth user to an entity
  - the saved-answers todo annotated with the grant-based lookup; two residue todos filed (nominations.created_by readable by anon; a failed compensating delete in identity-callback)
affects: [phase 167 (nominations.created_by residue), phase 169 (pgTAP gate re-runs the census), /gsd-verify-work 166]

actuals:
  tokens: 10200
  tasks: 3
  commits: 5
plan_head_before: 6e0e2d96845900c9642bdc019c0ecf2fff3de10f
plan_head_after: 9181b361cafba0109419d6ba716a4b9b71f1c504

tech-stack:
  added: []
  patterns:
    - "E2E verdicts are decoded from the embedded report.json and cross-checked against results.json; total == expected establishes 0 did-not-run"
    - "Bank-auth Edge env lives only in the session scratchpad; the journey's env differs from bank-auth's by IDENTITY_PROVIDER_ISSUER alone"

key-files:
  created:
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-04-gate-evidence/GATES.md
    - .planning/todos/pending/2026-10-01-nominations-created-by-readable-by-anon.md
    - .planning/todos/pending/2026-10-01-identity-callback-compensating-delete-failure.md
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-04-SUMMARY.md
  modified:
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/rls-policy-map.md
    - .claude/skills/database/extension-patterns.md
    - .planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md

key-decisions:
  - "The full suite ran at 25.7 GiB free in the VM. The user's 2026-10-02 approval to run at 13.8 GiB is recorded in GATES.md but turned out to be unneeded, because about 12 GiB was freed outside this plan between sessions"
  - "bank-auth and bank-auth-journey are opt-in (PLAYWRIGHT_BANK_AUTH=1) and are not part of the default full suite; link 5's six runs are their D-20 evidence"
  - "The wrapper writes no console.log of its own, so its tee'd output was copied into the run directory as console.log for the ENOSPC check"

patterns-established:
  - "A disk-floor checkpoint is re-measured on resume before the user's below-floor approval is relied on"

requirements-completed: [AUTHID-08, AUTHID-09]

coverage:
  - id: D1
    description: "D-20 links 1-4 on the final tree: lint:check, format:check, test:unit, db:reset + db:lint:sql + test:db, candidate-journey and candidate-a11y-scan, each exit 0"
    requirement: AUTHID-08
    verification:
      - kind: other
        ref: "yarn lint:check (exit 0); yarn format:check (exit 0); yarn test:unit (exit 0, 25/25 tasks)"
        status: pass
      - kind: integration
        ref: "yarn db:reset && yarn db:lint:sql (0 errors) && yarn workspace @openvaa/supabase test:db (Files=36, Tests=1335, PASS)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/166-04-candidate-journey (5/5) and 166-04-candidate-a11y (17/17), decoded clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "bank-auth and bank-auth-journey each pass three consecutive runs on the grant-only identity path with the keys-configured create path taken, and leave no orphan and no env leak"
    requirement: AUTHID-08
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/166-04-bank-auth-{1,2,3} (8/8 each) and 166-04-bank-auth-journey-{1,2,3} (131/131 each), decoded clean"
        status: pass
      - kind: other
        ref: "psql orphan counts 0 / 0 / 0 / 0; git status shows no env file and nothing under functions/"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full E2E suite passes on a freshly reset database under the cardinal rule"
    requirement: AUTHID-08
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-full (exit 0; report.json total 171, expected 171, unexpected 0, flaky 0, skipped 0; results.json agrees; preflight 0/1; ENOSPC 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The four database skill files describe the grant as the only user-to-entity link and name nothing that no longer exists; the saved-answers todo is annotated; both residues are filed"
    requirement: AUTHID-09
    verification:
      - kind: other
        ref: "test \"$(git grep -l auth_user_id -- apps packages tests .claude/skills)\" = apps/supabase/supabase/tests/database/36-entity-identity.test.sql (exit 0); Task 3 docs-present check (exit 0)"
        status: pass
    human_judgment: false

duration: 41min
completed: 2026-10-02
status: complete
---

# Phase 166 Plan 04: Final Gates and the Grant-Only Identity Docs Summary

**Every D-20 gate is green on the final grant-only tree: lint, format, unit, SQL lint, pgTAP (1335), candidate-journey (5/5), candidate-a11y-scan (17/17), bank-auth (8/8, three runs), bank-auth-journey (131/131, three runs) and the full E2E suite (171/171, 0 failed / 0 flaky / 0 skipped / 0 did-not-run). Every status was read directly and every E2E count was decoded from report.json. The database skill now teaches that the editor grant is the only link from an auth user to an entity, and the two residues are filed as todos.**

## Performance

- **Duration:** about 41 min of active work over two sessions: 2026-10-01T21:32:44Z to 21:58:00Z, then
  2026-10-02T05:34Z to about 05:50Z. Wall-clock time was about 8 h 20 min, most of it waiting at the
  disk-floor checkpoint.
- **Started:** 2026-10-01T21:32:44Z
- **Completed:** 2026-10-02T05:50Z
- **Tasks:** 3 of 3
- **Files modified:** 8 (one evidence file, four skill files, three todos), plus this summary

## Accomplishments

- D-20 links 1-6 are recorded in `166-04-gate-evidence/GATES.md` in order. For each link the file gives the
  command, the exit status (read without a pipe), the decoded totals and the time window, and it ends with
  a PASS verdict.
- Full suite: `tests/e2e-runs/166-04-full` ran on a freshly reset database. It exited 0 with
  `total 171, expected 171, unexpected 0, flaky 0, skipped 0`, and results.json agrees. 100 Playwright projects
  ran, the preflight was 0/1, and no ENOSPC appeared in any log.
- The bank-auth projects are deterministic on the grant-only identity path. Each run took the keys-configured
  create path, and in bank-auth-journey step 6b found exactly one candidate through the editor grant. No orphan
  auth user or candidate was left behind, and no test key or TLS bypass left the session scratchpad.
- `.claude/skills/database/SKILL.md` gains RLS and Auth Patterns § 9 ("Which entity am I"):
  `private.caller_entity_ids`, editor role only, per project, `ERR_ENTITY_IDENTITY_AMBIGUOUS`,
  `idx_grants_one_candidate_editor`, `writeEntityGrant`'s named idempotent key, the anon census, and the two-query
  service-role pattern. `schema-reference.md`, `rls-policy-map.md` and `extension-patterns.md` no longer name the
  dropped column. Only the census file names it now.
- The 2026-06-01 saved-answers todo is annotated with the grant-based lookup. Two residue todos are filed:
  `nominations.created_by` readable by anon (the census's single exemption, for Phase 167), and the
  identity-callback case where both the grant write and the compensating delete fail.

## Task Commits

1. **Task 1 (tracer): D-20 links 1-4 on the final tree** - `853dcdcdb` (test)
2. **Task 2: bank-auth x3 and bank-auth-journey x3** - `26a868690` (test)
3. **Task 3: skill docs, todos, full suite**
   - `c7a906e18` (docs): the four database skill files, the saved-answers annotation, two residue todos
   - `c82b111ce` (test): doc checks recorded, disk shortfall recorded at the checkpoint
   - `9181b361c` (test): full suite 171/171 and the GATES.md verdict

**Plan metadata:** recorded in the docs commit that adds this summary.

## Files Created/Modified

- `.planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-04-gate-evidence/GATES.md` - the D-20 gate record and verdict
- `.claude/skills/database/SKILL.md` - § 9 "Which entity am I", protected-column lists, Service Patterns bullets, Freshness Record entry
- `.claude/skills/database/schema-reference.md` - entity tables without the column; `idx_grants_one_candidate_editor`; the grant-only statement
- `.claude/skills/database/rls-policy-map.md`, `extension-patterns.md` - the dropped column removed from the protected lists and patterns
- `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` - annotated with the `caller_entity_ids` lookup
- `.planning/todos/pending/2026-10-01-nominations-created-by-readable-by-anon.md` - residue (D-02), for Phase 167
- `.planning/todos/pending/2026-10-01-identity-callback-compensating-delete-failure.md` - residue (D-09), deferred

## Decisions Made

- The checkpoint's below-floor approval was recorded, but the run did not rely on it. A re-measurement on resume
  showed 25.7 GiB free, above the 15 GiB floor. This plan pruned nothing, did not restart Docker, and did not
  re-run `docker builder prune -af`, which had reclaimed 0 B in the first session.
- bank-auth and bank-auth-journey count as covered by link 5's six runs, because the default full suite does not
  include them (they need `PLAYWRIGHT_BANK_AUTH=1`).

## Deviations from Plan

### Checkpoint

**1. [Disk floor] The full suite was held at a blocking-human checkpoint**
- **Found during:** Task 3 step 4 (first session)
- **Issue:** The VM had 13.8 GiB free after `docker builder prune -af`, below the 15 GiB floor. Images and volumes
  could not be pruned because an unrelated Supabase stack runs on the host.
- **Resolution:** The user ruled "Run at 13.8 GiB" (2026-10-02). On resume the VM had 25.7 GiB free, so the run
  happened above the floor anyway. Both facts are recorded in GATES.md.
- **Committed in:** `c82b111ce` (shortfall), `9181b361c` (result)

### Minor

**2. [Rule 3 - Blocking] console.log is copied into the run directory, not written there by the wrapper**
- **Found during:** Task 3 step 4
- **Issue:** The plan's ENOSPC check reads `tests/e2e-runs/166-04-full/console.log`, but `e2e-run.sh` does not
  create that file.
- **Fix:** The wrapper's output was redirected to the session scratchpad and copied into the run directory as
  `console.log` after the run. `stdout.log`, `devserver.log` and `db-reset.log` were checked for ENOSPC too
  (0 in each).
- **Files modified:** none tracked (`tests/e2e-runs/` is gitignored)

---

**Total deviations:** 1 checkpoint (resolved by a user ruling) and 1 minor blocking fix.
**Impact on plan:** None on the result. Every gate passed as written, and no source file changed
(`git diff --exit-code -- apps packages tests` exits 0).

## Issues Encountered

- None beyond the disk checkpoint. No test failed, flaked, was skipped or did not run in any of the 11 E2E runs.

## Known Stubs

None. This plan changes documentation and evidence only.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 166 is ready for `/gsd-verify-work 166`. All four plans are summarised, and AUTHID-01..09 are satisfied
  as far as this plan can verify them.
- Phase 167 owns the `nominations.created_by` residue (todo filed). Phase 169's pgTAP gate re-runs the
  `36-entity-identity` census.

## Self-Check: PASSED

- FOUND: `.planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-04-gate-evidence/GATES.md`
- FOUND: `.planning/todos/pending/2026-10-01-nominations-created-by-readable-by-anon.md`
- FOUND: `.planning/todos/pending/2026-10-01-identity-callback-compensating-delete-failure.md`
- FOUND: commits `853dcdcdb`, `26a868690`, `c7a906e18`, `c82b111ce`, `9181b361c`
- MEASURED: `git rev-list --count 6e0e2d968..HEAD` = 5 before the metadata commit
