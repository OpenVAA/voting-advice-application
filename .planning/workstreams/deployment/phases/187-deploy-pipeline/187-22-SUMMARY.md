---
requirements-completed: [PIPE-10]   # marked at the v2.17 milestone audit (2026-11-21) from the phase VERIFICATION.md
phase: 187-deploy-pipeline
plan: "22"
subsystem: infra
status: complete
tags: [deploy-workflow, deploy-branch, staging, ecr-digest, image-reuse, environment-review]
requires:
  - 187-21 (the green commit 331b5db28 and its digest sha256:b4a14b89..., served on staging)
  - 187-14 (the two environments' branch policies, deploy-evidence/* and deploy/staging)
provides:
  - the standing per-environment branch deploy/staging at 331b5db28
  - run 44276384977, the first deploy from deploy/staging, green behind the staging review
  - PIPE-05's "built once" observed: build_exit=3 with the same digest, no plan change, no apply change
affects:
  - phase 189 (the dispatch, observable once deploy.yml is on the default branch)
  - every later staging deploy, now a push to deploy/staging
tech-stack:
  added: []
  patterns:
    - "A re-run of a built commit deploys the registry's image: build_exit=3 takes the digest, and plan and apply report no change"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-22-deploy-staging.md
  modified: []
decisions:
  - "331b5db28 was pushed as it stands, without a rebuild: a rebuild would carry plan 187-21's README row and so be a new commit, with no image in the registry (REBUILD_WOULD_CHANGE_COMMIT=yes); the operator approved this after the orchestrator recommended it"
  - "DISPATCH_OBSERVABLE=after-merge: GitHub offers no dispatch for a workflow that is not on the default branch, so phase 189 observes it"
metrics:
  duration: "about 55 min (Task 1 09:12Z; push 09:29Z; gate 09:30Z to 10:02Z; run green 10:06:45Z; reads to 10:08Z)"
  completed: 2026-11-18
actuals:
  tokens: 5575
  tasks: 3
  commits: 3
plan_head_before: 22a9d40ca8677a435a5b74edd9fe711cf8f8b803
plan_head_after: 48f20b1df4e6f0691064ad29b63fbf7055e023c4
---

# Phase 187 Plan 22: The first deploy from `deploy/staging` Summary

```
STAGING_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44276384977
BUILD_EXIT=3
PLAN_NO_CHANGES=yes
```

The orchestrator pushed `331b5db28` to the new branch `deploy/staging`. That push started `deploy.yml` run 44276384977. The run's deploy job waited at the `staging` review for about 32 minutes, until the operator approved it in the web interface. The job then succeeded on `ubuntu-24.04-arm` in 4.0 minutes, and it built nothing and changed nothing:

- The build step exited 3 with `tag_exists=yes` and plan 187-21's digest `sha256:b4a14b89…`.
- The plan and the apply both reported no changes.

Staging still serves the same commit on task definition `:8` by that digest.

## Stages (deploy job 134706135937)

1. **Build:** `build_exit=3` with `tag_exists=yes`. The digest is the same as plan 187-21's (`BUILD_DIGEST_SAME=yes`). The step took 2 s, against 184 s for the build.
2. **Plan:** `No changes. Your infrastructure matches the configuration.`, with `plan_exit=0`.
3. **Link:** `link_exit=0` on `cofbsatfrdysyphajsky`.
4. **Migrations:** `push_up_to_date=yes`, with no `push_pending=` line. History and manifest both read `00001..00022`, and `drift_status=0`. No migration was pushed.
5. **Functions:** all three were redeployed from the same commit (`functions_deploy_exit=0`). Each is `ACTIVE`, with `verify_jwt` as configured.
6. **Apply:** `Apply complete! Resources: 0 added, 0 changed, 0 destroyed.` (5 s).
7. **Stable:** one poll, `COMPLETED`, with `stable_task_definition_matches=yes`. There was no rollout to wait for.
8. **Smoke:** the five gate `PASS` lines, then `2 passed (15.9s)`.
9. **Re-read:** `served_build_after_smoke=331b5db28058a1f8bc4ef88a3841080a4610efa2`.
10. **Alert and artifacts:** `ALERT_STEP=skipped` and `STAGING_ARTIFACTS=0`. The run concluded `STAGING_RUN_CONCLUSION=success` on its only attempt.

Workstation reads afterwards, read-only, using the valid `openvaa-admin` session:

- `/api/health` serves `331b5db28…`.
- `running-image-digest.sh` reads task definition `:8`, reference `digest` and the same digest (`RUNNING_IMAGE_UNCHANGED=yes`).
- There is one deployment, `PRIMARY` and `COMPLETED`, last updated 09:05:53Z, when plan 187-21's rollout completed. This run rolled nothing, and it wrote only the functions (`HOSTED_WRITES=functions`).

## The `main` guard

- **No `main` trigger.** `deploy.yml` at the green commit has no `main` trigger (`MAIN_TRIGGER_IN_DEPLOY=no`).
- **No branch policy admits `main`.** Neither environment's branch policy admits `main` (`MAIN_ADMITTED=no`).
- **No push to `main`.** No push to `main` was made: `main` is still at `340a20070…` at the end.
- **The dispatch.** It can only be observed once the workflow is on the default branch (`DISPATCH_OBSERVABLE=after-merge`), so phase 189 observes it.

## Deviations from Plan

None. Task 1 and Task 2 ran as written. The orchestrator pushed after the binding, and this executor re-ran `bound` and `has` (exit 0 each) before recording. Task 3 recorded every line it lists.

- **Extra lines.** Task 3 also recorded the workstation re-reads and the `main` ref at the end.
- **The README row was not rebuilt into the commit.** The runbook row plan 187-21 added after the green commit was built is not in `331b5db28`. That is deliberate (`REBUILD_WOULD_CHANGE_COMMIT=yes` in § Task 1).
- **No runbook row.** The plan asks for none, so none was added.

## Notes for the verifier

- **Both verifies pass.** Task 3's verify exited 0 before commit `48f20b1df`, and Task 1's verify also exits 0 at that commit.
- **The cache warning.** GitHub's cache service was unavailable during the run (`Failed to save: … Our services aren't available right now`). The Yarn step succeeded without the cache, and no step failed.

## Commits

- `c76e378df`: docs(187-22): record readiness for the first deploy from deploy/staging (Task 1, a previous executor)
- `348a59473`: docs(187-22): record the push to deploy/staging, its run and the staging gate it waits at
- `48f20b1df`: docs(187-22): record the green deploy from deploy/staging that built nothing and changed nothing

The ledger `gsd-plan-head-before-187-22` holds `22a9d40ca`, and `git rev-list --count 22a9d40ca..48f20b1df` is 3.

## Threat model

- **T-187-56 (a push by a writer).** The run waited for the `staging` environment's required reviewer. The executor approved nothing, and the approvals GET shows one `approved` entry for `staging`.
- **T-187-57 (a second image for one commit).** The build script exited 3 without building, and the digest was checked equal to plan 187-21's.
- **T-187-SC.** Accepted: the installs came from the committed lockfile.
- **New surface.** `deploy/staging` now exists as the standing deploy path, as planned. Nothing else is new.

## Self-Check: PASSED

- FOUND: `evidence/187-22-deploy-staging.md`, holding the Task 1 and Task 3 sections.
- FOUND: commits `c76e378df`, `348a59473` and `48f20b1df`, each an ancestor of HEAD.
- Task 3's verify and Task 1's verify each exited 0. `bound 187-22-2 OPERATOR_REPLY plan=187-22 task=2` exited 0. `git ls-remote origin refs/heads/deploy/staging` names `331b5db28058a1f8bc4ef88a3841080a4610efa2`.
