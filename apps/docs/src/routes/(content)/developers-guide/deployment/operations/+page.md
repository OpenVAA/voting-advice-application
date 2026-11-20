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

## SES: sandbox and production access

**When:** once, after the mail root's identity has verified, on an AWS account that has never sent mail through SES in the stack's region.

A new AWS account starts in the SES sandbox, which is set per account and per region. AWS documents that a sandboxed account sends only to verified addresses and domains or to the mailbox simulator, at most 200 messages in 24 hours and one a second, so invitations and password recovery reach nobody else until production access is granted. First read the account:

```bash
aws sesv2 get-account --region <region> --output json \
  | jq '{ProductionAccessEnabled, SendingEnabled, SendQuota}'
```

If `ProductionAccessEnabled` is `true`, file nothing: a new request would overwrite the account's contact details. Otherwise, with the account's suppression list taking bounces and complaints, file the production-access request:

```bash
aws sesv2 put-account-details --region <region> \
  --production-access-enabled --mail-type TRANSACTIONAL \
  --website-url https://<your-domain> \
  --use-case-description '<what is sent, and how much>' \
  --additional-contact-email-addresses <your-address> \
  --contact-language EN
```

Expected: the command exits 0 and AWS Support answers the request; AWS documents an initial response within 24 hours. While the account waits in the sandbox, verify your own mailbox by hand, so that the stack's mail can be followed to it, and follow the link in the mail SES sends:

```bash
aws sesv2 create-email-identity --region <region> \
  --email-identity <your-address>
```

No personal address is written into Terraform or the repository. On staging, on 2026-10-22, the account read showed production access already enabled in `eu-north-1`, with sending enabled and a 24-hour quota of 50000, so no request was filed and no mailbox was verified: for a fork with a new account, the request is the first step. See [Step 8](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#step-8-the-production-access-request) and [Step 9](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#step-9-your-own-mailbox-for-the-sandbox) of the mail runbook, and its [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#observations).

## Admin jobs and more than one task

**When:** before starting a long-running Admin App job, such as argument condensation or question info generation, on a stack that may run more than one task.

The Admin App keeps the state of its jobs, their progress, their messages and an abort request, in the memory of the server process that started the job: [`apps/frontend/src/lib/server/admin/jobs/jobStore.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/admin/jobs/jobStore.ts) holds them in two in-memory maps. The load balancer sends each request to any serving task, so a progress poll that reaches another task than the one running the job does not see the job.

- With exactly one task serving, progress polling is reliable.
- With two or more tasks serving, it is not: a poll may show the job missing or stale, and an abort may not reach it.
- Staging can run two tasks: its `terraform.tfvars` sets `task_floor = 1` and `task_ceiling = 2`, so target tracking starts a second task under load, and a rollout runs the old and the new task side by side for a while.

The workaround is to run Admin jobs while one task serves, at a quiet time and with no deploy in progress, or to pin the ceiling at one for the job's duration and put it back afterwards:

```hcl
task_ceiling = 1   # for the job's duration; back to 2 afterwards
```

The change is planned and applied like any other change of the root, with the running digest, and committed both ways. Expected: the plan changes the scalable target's `max_capacity` alone, from 2 to 1, and the service runs one task until the ceiling is raised again. A rollout still starts its new task beside the old one before stopping the old (`deployment_maximum_percent = 200`), so make no deploy while the job runs either way. Moving the job store out of memory, so that job progress holds with more than one task, is future work (FUT-01).

## Cost

**When:** when budgeting an instance, or checking a running one against the figures below.

The figures are staging's AWS stack of the frontend, in `eu-north-1`, at its floor of one task with 0.5 vCPU and 1 GB, recorded as they were read and not rounded further:

| Figure                                  | USD a month | Read                                                                   | What it counts                                                                                                                                                                                                           |
| --------------------------------------- | ----------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Priced inventory                        | 50.78       | 2026-11-14, 18:46Z, from the AWS price list                            | One task all month, the load balancer's hours and one LCU an hour, three public IPv4 addresses, 1 GB of logs, two alarms and 1 GB and 100 000 requests of CloudFront; the LCU, log and CloudFront lines are upper bounds |
| Measured, by the `Root=aws` cost tag    | 36.96       | 2026-11-18, 11:58Z, from Cost Explorer, over 2026-11-15 and 2026-11-16 | The two whole days the stack ran unchanged, scaled to a month: the load balancer, Fargate and the one public IPv4 address whose interface carries the tag                                                                |
| Measured, with the untagged public IPv4 | 44.26       | 2026-11-18, 11:58Z, the same read                                      | The tagged figure plus the load balancer's two public IPv4 addresses, whose interfaces AWS owns and does not tag, 7.30 a month                                                                                           |

The measured figures sit below the priced one by the inventory's upper-bound lines: idle staging used almost no LCUs and stayed within the free tiers for logs and CloudFront. A scale-out, an election-day floor or a rollout's overlap adds Fargate hours to every figure. None of them includes what lives outside the stack's root: the hosted zone and its queries, the image registry and the state bucket, and the hosted Supabase project, which Supabase bills under its own plan. See [Step 18 of the AWS runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-18-the-cost) for the reads.
