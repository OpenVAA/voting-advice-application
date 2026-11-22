---
requirements-completed: [SUPA-09]   # marked at the v2.17 milestone audit (2026-11-21) from the phase VERIFICATION.md
phase: 186-deployed-smoke-entry
plan: "08"
subsystem: testing
tags: [deployed-smoke, staging, supabase, contestant, sc1, supa-09]
status: complete
requires:
  - phase: 186-07
    provides: "the closing local E2E run (superseded as tree reference by 187-13's handoff)"
  - phase: 186-04
    provides: "infra/scripts/grant-smoke-contestant.sql and Step 22's contestant items"
provides:
  - "evidence/186-08-readiness.md: staging serves 712947a1b, tree unchanged since the handoff reference, smoke_cand_0000 with 6 answers, voter half green"
  - "evidence/186-08-sitting.md: the one approved hosted write, every s22c_ line as expected"
  - "evidence/186-08-green-run.md: the full deployed smoke run green, GREEN_SMOKE_EXIT=0, verdict OK 2/2"
  - "Hosted: one contestant auth user, its editor grant on smoke_cand_0000 and a terms acceptance on cofbsatfrdysyphajsky; keychain item openvaa-staging-smoke-contestant holds the address and password"
affects: [187, 188]
tech-stack:
  added: []
  patterns:
    - "A sitting run from one script that prints status lines only and stops at the first missing expected line"
key-files:
  created:
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-08-readiness.md
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-08-sitting.md
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-08-green-run.md
  modified:
    - infra/envs/staging/supabase/README.md
key-decisions:
  - "Approval taken under the standing staging authorisation the operator ticked at 186 D-02, stored and bound as attempt 20261115T113054Z.6f59bc0c6 of 186-08-2."
  - "The persistent project's service-role key and database password live in keychain service openvaa-184-staging, accounts service_role_key and db_password."
metrics:
  duration: "about 35 min"
  completed: 2026-11-15
actuals:
  tasks: 3
  commits: 3
plan_head_before: 54a96cbea
plan_head_after: 95d1d6ad5
---

# Phase 186 Plan 08: The hosted contestant sitting and the green deployed run Summary

**GREEN_SMOKE_EXIT=0. Gate: `PASS service-role-key-absent`, `PASS origin`, `PASS sha`, `PASS ref`, `PASS project-id`, then `DEPLOYED SMOKE GATE OK build=712947a1bd44a735f66ee8f51610f4748d76cd30 ref=cofbsatfrdysyphajsky`. `s22c_candidate=smoke_cand_0000`. Both specs passed against `https://staging.openvaa.org` (`2 passed (10.4s)`, verdict `--no-flaky` OK), with no service-role key in the run's environment: success criterion 1 (SUPA-09) is observed in full.**

## What was done

1. **Readiness (Task 1, executor, read-only).** The readiness record was made again on the current tree, using the inputs of the superseded-inputs note (the 187-13 handoff). Staging serves the expected build. `git diff` over `apps packages tests` since `HANDOFF_TREE_REFERENCE` is empty. `smoke_cand_0000` has 6 answers and a nomination. The voter half passed alone (`tests/e2e-runs/186-08-ready-voter-20261115T112846Z`). Commit `6f59bc0c6`.
2. **Approval (Task 2).** The operator stored the address in the keychain themselves and named the credential items. The reply was stored with `attempt.sh put`. `bound … OPERATOR_REPLY plan=186-08 task=2` and `has … answer_sitting=approve` both exited 0.
3. **Sitting and green run (Task 3, orchestrator).** Step 22's contestant items 3 to 13 ran at 11:59:37Z–11:59:42Z UTC. Every expected `s22c_` line was printed, and the token held exactly one `entity`/`editor` grant on a candidate. The full `yarn test:e2e:deployed` ran 12:00:03Z–12:00:15Z with the contestant's credentials read from the keychain (`tests/e2e-runs/186-08-green-20261115T120003Z`). The leak check is clean and the tree is still unchanged. A dated Observations row was added to the staging Supabase runbook. Commit `95d1d6ad5`.

## Deviations

- **The first sitting attempt stopped at item 4, before anything hosted was written.** The script's guard captured stderr as well as stdout. `security delete-generic-password` writes `password has been deleted.` to stderr, so the guard saw more than the two expected lines. A hand check on a throwaway item showed that `security -i` echoes nothing. The guard was narrowed to stdout, and the sitting was made again from its first line. Both runs are in `186-08-sitting.md`.
- **The gate now prints five `PASS` lines** (`origin` was added since 2026-11-14). The plan names four, and its verify checks those four, so it still passes.
- **`PLAYWRIGHT_HTML_OUTPUT_DIR` has no effect:** the deployed config has no HTML reporter.
- **The runbook diff is large.** Prettier re-pads the whole Observations table for the new, wider row. Ignoring whitespace, the diff is the one added row.

## Follow-ups

- **186 C-02 operator note (reuse existing helpers).** `contestant.smoke.ts` is built entirely from the existing fixtures. `voter.smoke.ts` uses `navigateToFirstQuestion` and `answerAndAdvanceToResults` (`walkVoterStages`/`resolveVoterStage`). Its three results assertions (lines 21–23) could use `resultsPage.fixture.ts` (`expectPageVisible`, `getEntityCards`) instead of raw locators. This plan could not touch `tests/`, so this is left for a later plan.
- **Removal.** The contestant persists by design. Its removal is Step 22's "Removing the contestant".

## Self-Check: PASSED

Task 1's and Task 3's verify commands exited 0. No address, password, key or token is in any file this plan wrote: the `grep -qF` search for both values and the address/JWT-shape search both came back clean.
