---
phase: 187-deploy-pipeline
plan: "23"
subsystem: infra
status: complete
tags: [destroy-workflow, staging-destroy, environment-review, supabase-root-refused, destroy-guard, staging]
requires:
  - 187-22 (the green commit 331b5db28, served on staging and the tip of deploy/staging)
  - 187-14 (the staging-destroy environment, its branch policy deploy-evidence/* and its one reviewer)
provides:
  - the standing branch deploy-evidence/destroy-staging at 331b5db28
  - run 44285713407, a destroy run approved at plan-destroy and rejected at apply-destroy, which destroyed nothing
  - PIPE-08's refusal half observed in a run: the deploy role refused both the Supabase root's init and the head-object of its hand state key
affects:
  - 187-24 (the real destroy, which starts from this destroy run and this plan's 40-resource count)
  - 187-25 (the re-apply after the destroy)
tech-stack:
  added: []
  patterns:
    - "A rejected environment review fails the waiting job with no runner assigned and no step run, and the run concludes failure"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-23-destroy-plan.md
  modified: []
decisions:
  - "The once-a-minute poll did not see apply-destroy in waiting, because the operator rejected it within 28 s. Its wait is shown by the run's rejected review for staging-destroy and the job's check-run annotation, not by a status read"
metrics:
  duration: "about 24 min (Task 1 10:11:55Z; push 10:28:18Z; plan-destroy approved 10:30:45Z and green 10:31:27Z; apply-destroy rejected 10:31:56Z; reads after to 10:34Z)"
  completed: 2026-11-18
actuals:
  tokens: 6300
  tasks: 3
  commits: 6
plan_head_before: 6bd92f72df3ac96268b58164cd7e5597de1f00b8
plan_head_after: 4f079cb7c8d6a72e7ee6dacb083f9b54979e3946
---

# Phase 187 Plan 23: The destroy path up to its apply Summary

```
SUPABASE_ROOT_REFUSED=yes
DESTROY_PLAN_SUMMARY=0 to add, 0 to change, 40 to destroy
APPLY_JOB_REVIEW=rejected
```

The orchestrator pushed `331b5db28` to `deploy-evidence/destroy-staging`. That push started "Destroy staging AWS" run [44285713407](https://github.com/OpenVAA/voting-advice-application/actions/runs/44285713407) and the `infra-plan.yml` run 44285713394, and no `deploy.yml` run. `plan-destroy` waited at `staging-destroy` until the operator approved it, and then went green in 42 s:

- The deploy role was assumed through the `environment:staging-destroy` subject.
- The Supabase root was refused twice: its `init` exited 1 and the `head-object` of its state key exited 254.
- The guard passed, with 40 planned deletes equal to 40 managed resources in the state, none of them outside `module.frontend`.
- The shown plan read `Plan: 0 to add, 0 to change, 40 to destroy.`

`apply-destroy` waited at its own review. The operator rejected it, and it ran no step. The run concluded `failure`. Staging still serves the same build, from the same image and with the same state as before.

## Stages

1. **The push.** `DESTROY_BRANCH_PUSHED=yes`. `DEPLOY_RUN_FOR_BRANCH=none`, because `deploy.yml`'s negative pattern held. `infra-plan.yml` ran its two no-credential jobs green and skipped its credentialed plan, as Task 1 predicted.
2. **plan-destroy waited and was approved.** The job waited at `staging-destroy`, which had one `User` reviewer and no wait timer. The run's approvals record `approved` for `staging-destroy`, and the job started at 10:30:45Z.
3. **The plan job's lines.** `supabase_root_init_status=1`, `supabase_state_head_status=254` and `supabase_root_refused=yes`. The guard printed `destroy_planned=40`, `destroy_state_resources=40`, `destroy_outside_module=0`, `destroy_other_actions=0`, `destroy_unmatched=0` and `destroy_guard=pass`. The plan showed 40 `will be destroyed` headers, all under `module.frontend.`.
4. **apply-destroy was rejected.** The approvals record `rejected` for `staging-destroy`, and the check-run annotation reads "The deployment was rejected or didn't satisfy other protection rules." The job has 0 steps and no runner, and its log answers 404. `DESTROY_RUN_CONCLUSION=failure`, `DESTROY_ARTIFACTS=0`.
5. **After the run.** `SERVED_BUILD_AFTER` equals `SERVED_BUILD_BEFORE` (`331b5db28…`). The output of `running-image-digest.sh` and the output of `state list` are each byte-identical to Task 1's. Task definition `:8` is `COMPLETED`, 1 of 1 running. `STACK_INTACT=yes`.

## Verification

- Task 3's `<automated>` verify exited 0, and so did Task 1's, re-run.
- `destroy_planned` equals `destroy_state_resources`, and each key appears exactly once in the evidence.

## Deviations from Plan

None. The plan was executed as written. The orchestrator made the push at top level, as the execution rules require. The plan executor did not push, and it approved and rejected nothing. The one observation that differs from the plan's wording is that no poll saw `apply-destroy` in `waiting`, so `APPLY_JOB_WAITED=yes` rests on the run's rejected review and the job's annotation. The evidence states this.

## Known Stubs

None.

## Threat Flags

None. No file outside the evidence and this summary was changed.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-23-destroy-plan.md`
- FOUND in HEAD's history: 3c8a4fc08, 919ea809b, cc0c59d3e, be58019a6, 41c2916d2, 4f079cb7c
