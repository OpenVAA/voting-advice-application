---
phase: 187-deploy-pipeline
plan: "17"
subsystem: infra
tags: [deployed-smoke, contestant, github-environments, secrets]
status: complete

requires:
  - phase: 187-14
    provides: "the `staging` environment with its three secrets, to which this plan's two contestant secrets were added"
  - phase: 186-08
    provides: "the hosted contestant and its full deployed smoke run (`186-08-green-run.md`)"
provides:
  - "`evidence/187-17-smoke-contestant.md`: where plan 186-08 stood and the handoff's live check (Task 1), and the read-back of plan 186-08's outcome, the two contestant secrets by name and the keychain item (Task 3)"
  - "GitHub settings, set by the operator: `staging` environment secrets `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD`"
affects: [187-18, 187-19, 187-21]

actuals:
  tokens: 2600
  tasks: 3
  commits: 8
plan_head_before: 1b2af2af9052fb8030ed5a961b1392d9d3f26916
plan_head_after: 3ef203d051b66584a586a59e444e2948b46b27fc

tech-stack:
  added: []
  patterns:
    - "Secrets read back by name and count only, with `gh api` GETs filtered by `--jq`; the keychain item is checked by its exit status alone (no `-w`, output to `/dev/null`)"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-17-smoke-contestant.md
  modified: []

key-decisions:
  - "The pipeline's smoke step now has its contestant: plan 186-08 was already complete when Task 1 read it, so the handoff needed no resumption, and the operator added the two contestant secrets to the `staging` environment only, never as repository secrets"

requirements-completed: []
requirements-advanced: [PIPE-07, SUPA-08]

metrics:
  duration: "1h05min wall clock (20:03Z-21:08Z), almost all of it the operator checkpoint"
  completed: 2026-11-15
---

# Phase 187 Plan 17: The hosted contestant and its two secrets Summary

```
PLAN_186_08=complete
CONTESTANT_SECRETS_PRESENT=yes
```

**Plan 186-08 is complete, and its full deployed smoke run against staging passed. The operator then set `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD` as secrets of the `staging` environment. I read them back by name only: `staging` now lists five secret names, both contestant names among them. The keychain item they came from exists. No address or value was read or written.**

## What was recorded

| Line | Value | Source |
|---|---|---|
| `PLAN_186_08` | `complete` | `186-08-SUMMARY.md` (`status: complete`) and `186-08-green-run.md` |
| `GREEN_RUN_DIR` | `tests/e2e-runs/186-08-green-20261115T120003Z` | quoted from `186-08-green-run.md` |
| `GREEN_SMOKE_EXIT` / `GREEN_VERDICT_EXIT` / `CREDENTIAL_LEAK_CHECK` | `0` / `0` / `clean` | quoted from `186-08-green-run.md` |
| `HANDOFF_PRESENT` / `HANDOFF_STILL_VALID` | `yes` / `yes` | Task 1: staging served `712947a1b…`, equal to `HANDOFF_SMOKE_EXPECTED_SHA`; `apps packages tests` unchanged since `HANDOFF_TREE_REFERENCE` |
| `ENV_STAGING_SECRET_NAMES` (Task 1) | `ALERT_EMAIL,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD` | `gh api` GET, 20:03:25Z |
| `CONTESTANT_SECRETS_PRESENT` | `yes` | `gh api` GET, 21:08:15Z: `ALERT_EMAIL,SMOKE_CONTESTANT_EMAIL,SMOKE_CONTESTANT_PASSWORD,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD` |
| `ENV_STAGING_SECRETS` | `5` | `total_count` of the same endpoint |
| `KEYCHAIN_ITEM_PRESENT` | `yes` | `security find-generic-password -s openvaa-staging-smoke-contestant` exited 0 (no `-w`) |

GitHub updated the two contestant secrets at 21:05:58Z (`SMOKE_CONTESTANT_PASSWORD`) and 21:06:40Z (`SMOKE_CONTESTANT_EMAIL`). Both times fall after Task 1's read, which found neither secret.

## Task Commits

1. **Task 1: Where plan 186-08 stands, read-only.** Commit `dff44d18f`.
2. **Task 2: Operator checkpoint.** No commit. The operator's reply (`answer_186_08=complete`, `answer_contestant_secrets_state=set`) was stored with `attempt.sh put 187-17-2` under attempt `20261115T200426Z.dff44d18f`. The put exited 0, so the reply passed the screen.
3. **Task 3: The outcome of plan 186-08 and the two secrets, read back.** Commit `3ef203d05`. `attempt.sh bound 187-17-2 OPERATOR_REPLY plan=187-17 task=2` exited 0. The task's `<verify>` exited 0, and that includes the check that the evidence holds no address.

`commits: 8` is the measured `git rev-list --count` from `plan_head_before` to `plan_head_after`. That range also contains six commits made at the same time on this branch by other work: plans 187-12, 187-13, 187-15 and 187-16, and one `docs(infra)` commit. This plan's own commits are the two listed above.

## Deviations from Plan

None. The plan ran exactly as written.

## Requirements

PIPE-07 and SUPA-08 are advanced and not marked complete. Plans 187-19 and 187-21 still have to observe them in the pipeline's green run.

## Next Phase Readiness

The pipeline's smoke step can now sign the hosted contestant in. Nothing in the account set-up blocks the observed green run of PIPE-09.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-17-smoke-contestant.md`
- FOUND: `dff44d18f`, `3ef203d05` (both ancestors of HEAD)
