# Operations

This page is for whoever runs a deployed OpenVAA instance after it is up. It covers scaling the frontend for election day, rolling back a release, tearing an environment down, restoring the database, rotating secrets, the email sending limits of Amazon SES and the job limit of the Admin App. Standing the instance up in the first place is described on the [Deployment](/developers-guide/deployment) page, and the settings of the hosted Supabase project on [Hosted Supabase settings](/developers-guide/deployment/hosted-settings).

Each section below says when the procedure is used, gives its command and the result to expect, and links to the step of the staging runbooks where it was carried out and measured. The runbooks hold the full procedure, with every check; this page is the summary. The values quoted are staging's, each with the date it was read.

## Election-day scaling

**When:** ahead of a peak whose time is known, such as an election day. Target tracking adds tasks only once it sees the load, so for a known peak the floor is raised beforehand by a scheduled action, and the tasks are running when the voters arrive.

1. Write two entries in the AWS root's `terraform.tfvars`: one that raises the floor before the peak, with a ceiling no lower than the floor, and one that lowers it back to `task_floor` and `task_ceiling` afterwards. The schedules are read in UTC, so convert the peak's local times first. The numbers are an example:

   ```hcl
   scheduled_floor_changes = [
     {
       name         = "election-day-raise"
       schedule     = "at(2027-04-11T05:00:00)"
       min_capacity = 4
       max_capacity = 6
     },
     {
       name         = "election-day-lower"
       schedule     = "at(2027-04-11T20:00:00)"
       min_capacity = 1
       max_capacity = 2
     },
   ]
   ```

2. Well before the raise, plan with the digest the service runs, so that the plan shows the two scheduled actions alone, and apply that plan once. Commit the change of `terraform.tfvars`.

   ```bash
   T=infra/envs/staging/aws   # your AWS root
   DIGEST=$(infra/scripts/running-image-digest.sh \
     --cluster openvaa-staging --service openvaa-staging-frontend \
     | sed -n 's/^running_image_digest=//p')
   terraform -chdir="$T" plan -input=false \
     -var "image_digest=$DIGEST" -out=tfplan
   terraform -chdir="$T" apply -input=false tfplan
   ```

   Expected: the plan reads `Plan: 2 to add, 0 to change, 0 to destroy.` and creates the two scheduled actions and nothing else. Any other plan is not applied.

3. Make no apply and no deploy between the two actions. Inside that window the scalable target's bounds are the raising entry's, a plan shows them as a change, and an apply, including the one a push to `deploy/staging` makes, would put back `task_floor` and `task_ceiling` in the middle of the peak.
4. After the lowering has run and the task count is back at the floor, remove both entries, plan again with the running digest, apply once and commit. Expected: `Plan: 0 to add, 0 to change, 2 to destroy.`, the two scheduled actions alone.

On staging, on 2026-11-13, a pair that raised the floor from 1 to 2 and lowered it ten minutes later was planned as `Plan: 2 to add, 0 to change, 0 to destroy.` and applied. Each action ran within a minute of its time, the service ran 2 tasks at the first minute read after the raise, and target tracking brought it back to 1 task within a minute of the lowering, at idle CPU. The removal's plan read `Plan: 0 to add, 0 to change, 2 to destroy.`. See [Step 12 of the AWS runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-12-the-floor-raised-ahead-of-time-and-lowered-again) and its [§ Election day](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#election-day).

### Capacity

On staging, on 2026-11-19, the load check replayed one recorded voter journey in five-minute steps of 2, 5, 10, 20 and 40 journeys a minute against build `a7003b490`, and every step met its thresholds. Staging served at least 40 voter journeys a minute with `trackEvents` false: at that step one task served them, at 44.86 % CPU at most and 20.46 % memory, and the service did not scale out. This is **a lower bound, not a maximum**: 40 journeys a minute was the highest step run, the step cap set from the hosted Supabase project's plan, and no resource limited it. It also holds only under the condition it was measured in: `trackEvents` was false on staging, so the journey sent pageviews only. A deployment with `trackEvents` true sends more events through the analytics relay for each voter, which the figure does not cover. Size the election-day floor from the expected peak with that in mind, and measure your own instance with the load check. See the [capacity row of the AWS runbook's Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#observations) and the method in [`infra/scripts/load-check/README.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/scripts/load-check/README.md).

## Rollback

**When:** a release that does not start or does not pass its checks.

A release whose tasks fail to start is rolled back by the ECS deployment circuit breaker without anyone acting: the service counts the tasks that fail to start, returns to its last completed deployment and keeps the old task serving meanwhile. The rollback publishes `SERVICE_DEPLOYMENT_FAILED`, which the stack's alert rule mails to the alert address. On staging, on 2026-11-13, a revision with `ORIGIN` left out was applied: three of its tasks failed, the circuit breaker rolled the service back to the previous revision, which was steady 72 seconds later, and a request loop through the public name counted 692 requests over the fault with no answer that was not 2xx. The alert mail arrived. See [Step 10 of the AWS runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-10-a-rollout-that-fails-its-rollback-and-its-alert).

After such a rollback the service runs the old revision while the Terraform state names the failed one. The fix goes forward: commit it and push the commit to `deploy/staging`, which starts the deploy workflow's gated job.

```bash
git push origin <fixed commit>:refs/heads/deploy/staging
```

Expected: the deploy job waits for the `staging` environment's reviewer, and once approved builds, plans, runs the migrations and the functions, applies, waits for the rollout to read `COMPLETED`, runs the smoke specs and reads `/api/health` serving the pushed commit. A red run keeps what it already did, pushed migrations included, so a later fix is again a new commit on `deploy/staging`. See [§ The gated job and its order](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#the-gated-job-and-its-order) and [§ Recovery](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#recovery) of the infrastructure README, and [Step 11](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-11-the-restore-and-the-stop-signal) for the apply that brought staging's state and service back together.

A release that starts but fails the smoke run is not rolled back automatically: the stack keeps serving it until a fixed commit is deployed. Rolling back to the previous task definition when the smoke run fails is future work (FUT-10).

## Teardown

**When:** an environment is no longer needed, or is to be rebuilt from nothing.

The `destroy.yml` workflow destroys the AWS stack of the frontend. It starts on a push to the branch `deploy-evidence/destroy-staging`, or on a dispatch from the `deploy/staging` ref whose `confirm` input is exactly `destroy staging aws`; any other text skips both jobs. Each of its two jobs, `plan-destroy` and `apply-destroy`, waits for its own approval in the `staging-destroy` environment, and each checks that its plan deletes exactly the managed resources the state holds and nothing outside the module.

```bash
# Either a push of the commit whose root is to be destroyed:
git push origin <commit>:refs/heads/deploy-evidence/destroy-staging
# or, once the workflow is on the default branch, a dispatch:
gh workflow run destroy.yml --ref deploy/staging \
  -f confirm='destroy staging aws'
```

Expected: `plan-destroy` prints `supabase_root_refused=yes`, then `destroy_planned=40` and `destroy_guard=pass` on staging; `apply-destroy` applies with `Apply complete! Resources: 0 added, 0 changed, 40 destroyed.` and prints `destroy_state_after=0`. On staging this was run on 2026-11-18, started by the push, and a deploy from nothing afterwards brought the stack back with `Plan: 40 to add, 0 to change, 0 to destroy.`. A destroy that stopped part-way is finished by running the workflow again. See [§ The destroy workflow](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#the-destroy-workflow) and [§ Recovery](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#recovery).

By hand, the root is destroyed by applying a saved destroy plan whose count equals the managed resources in the state, and then reading the Resource Groups Tagging API in both regions for anything tagged with the root. The plan takes the running digest, as above, and the alert address as `TF_VAR_alert_email`:

```bash
terraform -chdir=infra/envs/staging/aws plan -destroy -input=false \
  -var "image_digest=$DIGEST" -out=tfplan
terraform -chdir=infra/envs/staging/aws apply -input=false tfplan
```

Expected: on staging, on 2026-11-14, `Plan: 0 to add, 0 to change, 40 to destroy.` and `40 destroyed` in about four and a half minutes, and an empty state. The task definition revisions stay listed as `INACTIVE` until they are deleted, and the `INACTIVE` cluster and service remain listed as residue. The image, the two parameters, the delegated zone and the execution role, which live outside this root, are kept. See [Step 16](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-16-the-destroy). The stack is brought back by one plan and one apply from the same image, `Plan: 40 to add, 0 to change, 0 to destroy.`, as in [Step 17](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-17-the-re-apply); the re-created alert topic's subscription has to be confirmed again by mail. The whole sequence is in [§ The destroy, the re-apply and the cost](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#the-destroy-the-re-apply-and-the-cost).

**The Supabase project is never destroyed by Terraform.** The Supabase root imports the project, and the module's `supabase_project` resource carries `prevent_destroy = true`, so a plan that would delete it fails. `prevent_destroy` is not kept in the state: it protects the project only while that block exists, so renaming the block needs a `moved` block and removing it needs a `removed` block that does not destroy. The destroy workflow cannot reach the Supabase root at all: the deploy role is refused its state. A plan of a Supabase root that shows a destroy or a replacement is never applied. After staging's hand destroy on 2026-11-14, the Supabase root's plan read `No changes` and the conformance probe passed every check.
