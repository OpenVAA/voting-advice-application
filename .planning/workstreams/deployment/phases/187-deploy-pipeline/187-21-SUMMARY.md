---
phase: 187-deploy-pipeline
plan: "21"
subsystem: infra
status: complete
tags: [deploy-workflow, green-run, staging, ecs, ecr-digest, supabase-migrations, smoke-gate, environment-review]
requires:
  - 187-17 (the smoke contestant's secrets)
  - 187-19 (the pull request's plan of the staging AWS root)
  - 187-30 (linux_arm64 hashes in the provider locks; evidence commits 9d6a55ca3 / 1a3ee822f)
  - 187-31 (the stable step's bounded poll; evidence commits 331b5db28 / f4a440553)
provides:
  - the first green pipeline deploy of staging, run 44270824581, every stage in order behind the staging review
  - staging serving 331b5db28 on task definition :8 by digest sha256:b4a14b89...
  - the call-time privilege of 00018 / 00020 read on the persistent project (operator-reported)
affects:
  - 187-22 and later plans that read 187-21's evidence
  - the phase's verification (PIPE-04 to PIPE-07, PIPE-09, PIPE-10, SUPA-08 observed on one gated run)
tech-stack:
  added: []
  patterns:
    - "A red attempt's record is kept under A<n>_ names and its current lines renamed *_SUPERSEDED, so no line of a red run satisfies a later attempt's whole-line check"
    - "Each attempt pushes a new deploy-evidence/187-green-<n> branch; no force push, no re-run"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-21-green-run.md
  modified:
    - infra/envs/staging/aws/README.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/deferred-items.md
decisions:
  - "Four attempts, each a new approval of key 187-21-2 and a new branch; no red run was re-run, and every fix was its own plan (187-30, the operator's secret update, 187-31)"
  - "The Step 18 hand apply of the staging Supabase settings, made before attempt 1's approval, stands for every attempt"
  - "The operator's answer_constraints=ok of attempt 3 (the Supabase lock constraints line) stands for attempt 4"
  - "MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED closed as yes on the operator's reported has_table_privilege read, relayed by the orchestrator"
metrics:
  duration: "about 40 h across four attempts (attempt 4: 08:27Z to 09:12Z, 2026-11-18)"
  completed: 2026-11-18
actuals:
  tokens: 43132
  tasks: 3
  commits: 3
plan_head_before: e49b8f86efec626397b8aed42e33bd56a4fbee49
plan_head_after: db50c2dda1b69e0b6ac1a902ca17ba87addb1150
---

# Phase 187 Plan 21: The first green pipeline deploy of staging Summary

```
GREEN_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44270824581
GREEN_JOB_MINUTES=10.1
GREEN_RUN_CONCLUSION=success
```

Run 44270824581 deployed `331b5db28` to staging from `deploy-evidence/187-green-4`. The deploy job waited at the `staging` review and started once the operator approved it. Every stage then succeeded, in order, on `ubuntu-24.04-arm` in 10.1 of its 60 minutes. Staging now serves that commit, on task definition `:8`, with the image named by the digest the build printed.

## Stages (deploy job 134687271397)

1. **Build:** `build_exit=0` with a new digest `sha256:b4a14b890f13…` (184 s).
2. **Plan:** `Plan: 1 to add, 1 to change, 1 to destroy.` The task definition was replaced and its image moved from `…@sha256:ccfaa586…` to `…@sha256:b4a14b89…`; the service was updated in place.
3. **Link:** `link_exit=0` on `cofbsatfrdysyphajsky`.
4. **Migrations:** `push_up_to_date=yes` with no `push_pending=` line. The drift check read history `00001..00022` on both sides and `drift_status=0`. No migration was pushed (120 s).
5. **Functions:** `account-access`, `identity-callback` and `send-email` are each `ACTIVE`, with `verify_jwt` as configured.
6. **Apply:** `Apply complete! Resources: 1 added, 1 changed, 1 destroyed.` (112 s).
7. **Stable:** four `stable_poll=` reads, 15 s apart. Reads 1–3 were `IN_PROGRESS` and read 4 was `COMPLETED`, so plan 187-31's poll was observed doing its job (56 s).
8. **Smoke:** the five gate `PASS` lines (service-role-key-absent, origin, sha, ref, project-id), then the contestant and voter specs, `2 passed (21.1s)`.
9. **Served-build re-read:** `served_build_after_smoke=331b5db28058a1f8bc4ef88a3841080a4610efa2`.
10. **Alert:** `ALERT_STEP=skipped`. **Artifacts:** `GREEN_ARTIFACTS=0`.

Workstation reads afterwards, read-only, using the valid `openvaa-admin` session:

- `SERVED_BUILD_AFTER=331b5db28058a1f8bc4ef88a3841080a4610efa2`
- `RUNNING_IMAGE_REFERENCE=digest`
- `RUNNING_IMAGE_DIGEST` equals `BUILD_DIGEST`
- one deployment, `PRIMARY`, `COMPLETED`

## The four attempts

| Attempt | Run | Branch / commit | Outcome | Cause | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | 44165083175 | `deploy-evidence/187-green` / `0a73bb6df` | approved, red at the plan step | the staging AWS root's lock held no linux_arm64 hash for the ARM runner | plan 187-30 added the linux_arm64 hashes to all eight locks and rebuilt the evidence commits |
| 2 | 44250710034 | `deploy-evidence/187-green-2` / `9d6a55ca3` | approved, red at the link step; staging unchanged | the `SUPABASE_ACCESS_TOKEN` secret held a stale, rejected token | the operator updated the secret; no code change |
| 3 | 44258126898 | `deploy-evidence/187-green-3` / `9d6a55ca3` | approved; steps 1–19 green (21 migrations `00002`–`00022` pushed, functions deployed, plan applied); red at step 20 | the stable step's single read raced ECS's `rolloutState`, which went `COMPLETED` 25–32 s later (diagnosis confirmed) | plan 187-31 made the step poll up to 60 reads 15 s apart and rebuilt the evidence commits |
| 4 | 44270824581 | `deploy-evidence/187-green-4` / `331b5db28` | **green** | – | – |

No run was re-run. Each attempt had its own approval of key `187-21-2`, and the current one is `20261118T083012Z.e49b8f86e`, read back by `bound` and `has` (exit 0).

## Carried and closed items

- **The Step 18 hand apply.** Before attempt 1's approval, the operator applied runbook Step 18 of the staging Supabase settings by hand: `mailer_otp_length` 10, and the redirect paths to `/auth/confirm`. It stands for every attempt and was not repeated.
- **The Supabase lock constraints line confirmed.** The operator's `answer_constraints=ok` of attempt 3 confirmed plan 187-30's rewrite, `constraints = "1.11.0, ~> 1.11"`. It stands for attempt 4 (`SUPABASE_LOCK_CONSTRAINTS_CONFIRMED=yes`).
- **`MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=yes`: closed.** The item was live on staging once attempt 3 pushed `00018` and `00020`, because their SECURITY DEFINER functions then existed on the persistent project. On 2026-11-18 the operator ran `select has_table_privilege('postgres', 'auth.users', 'UPDATE')` against staging's database and reported `true`, and the orchestrator relayed it. So hosted `postgres`, which owns those functions, holds UPDATE on `auth.users`. This is the operator's reported read; the executor did not run the query. § Task 2's `=no` line is renamed `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED_SUPERSEDED=no`.
- **`A2_RUNNING_IMAGE_READ_STILL=owed`.** It stays as recorded. Attempt 3's apply replaced the state it was meant to read.

## Deviations from Plan

- **Recording only, at the coordinator's direction.** Mid-run, the coordinator relayed two things from the operator: the `staging` approval, which the executor confirmed itself from the approvals GET, and the privilege read. The executor recorded the privilege read in the evidence, as above. This is outside Task 3's listed lines (commit `23a62e6bc`).
- **[Rule 3 — out of scope, deferred]** The 2026-11-17 Observations row of `infra/envs/staging/aws/README.md`, written by plan 187-29, renders split into extra cells. Prettier does not flag it. This plan added only its own row, and Prettier changed nothing else but the separator's width. The row is logged in `deferred-items.md`, cause UNCONFIRMED.

Otherwise, Task 3 ran as the plan and its attempt-4 note describe.

## Notes for the verifier

- **Task 1's verify fails at HEAD, and that is expected.** Task 3 adds a row to `infra/envs/staging/aws/README.md`, so the tree outside `.planning/` now differs from `refs/evidence/187/green`, and Task 1's tree-equality line fails. It passed (exit 0) just before Task 3's evidence commit. A later green or red push would need the evidence commits rebuilt, per this plan's execution rules.
- **Task 3's verify passes.** It exited 0 before commit `db50c2dda`.

## Commits (attempt 4)

- `e49b8f86e`: docs(187-21): record attempt 4's readiness for the rebuilt green commit (Task 1, a previous executor)
- `b5a71c457`: docs(187-21): record attempt 4's push, its run and the staging gate it waits at
- `23a62e6bc`: docs(187-21): record the operator's read of the call-time privilege, closing the open item
- `db50c2dda`: docs(187-21): record attempt 4's green run and the staging runbook's observation

The ledger `gsd-plan-head-before-187-21-a4` holds `e49b8f86e`, and `git rev-list --count e49b8f86e..db50c2dda` is 3. Across all four attempts the plan made 11 commits matching `(187-21)` (from ledger `1c5ed8deb`), interleaved with the commits of plans 187-30 and 187-31.

## Threat model

- **T-187-53 (an uncovered tree).** The tree was checked against HEAD and the closing E2E tree before the push: `GREEN_TREE_OK=yes` and `E2E_TREE_COVERS_GREEN=yes`.
- **T-187-54 (an unexpected migration).** None pending and none pushed, with `drift_status=0`.
- **T-187-55 (disclosure).** No artifact was uploaded, the evidence copies named lines only, and the address search came back clean.
- **New surface.** None.

## Self-Check: PASSED

- FOUND: `evidence/187-21-green-run.md` and `infra/envs/staging/aws/README.md`, holding the 2026-11-18 row.
- FOUND: commits `e49b8f86e`, `b5a71c457`, `23a62e6bc` and `db50c2dda`, each an ancestor of HEAD.
- Task 3's verify exited 0, and so did `bound 187-21-2 OPERATOR_REPLY plan=187-21 task=2`.
