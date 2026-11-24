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

## Restore

**When:** the hosted project's data is lost or damaged, by a migration, a mistaken delete or an incident, and has to be put back from a backup.

The AWS stack holds no application data of its own, so a restore concerns the Supabase project alone. Supabase makes the backups and runs the restore; this section gives what its documentation says, read on 2026-11-21, and the order in which this repository's parts are applied to the restored project. No restore has been run on staging or on the throwaway project.

### What Supabase keeps

[Supabase's page on database backups](https://supabase.com/docs/guides/platform/backups), read on 2026-11-21, says:

- A Pro project is backed up once a day and can be restored to any of its last 7 daily backups (Team 14, Enterprise up to 30). Projects on Postgres `15.8.1.079` and newer have physical backups, which cannot be downloaded; a copy of your own is made with `supabase db dump` or `pg_dump`.
- Point-in-time recovery (PITR) is a paid add-on of Pro, Team and Enterprise projects. It restores to a chosen second, with a worst-case recovery point of two minutes, and is priced by how far back it reaches: about 100 USD a month for 7 days. Enabling it stops the daily backups.
- **Storage objects are not in the database backup.** The database holds only their metadata, so a restore brings back no object deleted after the backup was taken.
- The daily backups keep no password of a custom role.

Staging's organisation is on the Pro plan. On staging, on 2026-11-20 at 13:55Z, the backups read of [Step 24 of the Supabase runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-24-the-backups-read) answered 200: PITR off, WAL-G archiving on, eight backups, all eight `COMPLETED`, in `eu-north-1`. The earliest and the latest physical backup times both came back `null`, so the answer gave no physical-backup range, and the read did not list the days the eight backups cover. The read is one `GET` of the Management API, which [Supabase's API reference](https://supabase.com/docs/reference/api/v1-list-all-backups) lists under the scope `database:read`; the token goes to `curl` on its standard input:

```bash
REF=<project-ref>
printf 'access token: '; read -rs SUPABASE_ACCESS_TOKEN; echo
printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" \
  | curl -sS -K - \
    "https://api.supabase.com/v1/projects/$REF/database/backups" \
  | jq '{region, pitr_enabled, walg_enabled,
      backups: [.backups[] | {status, inserted_at}]}'
unset SUPABASE_ACCESS_TOKEN
```

Expected: `pitr_enabled` false on a project without the add-on, and its backups each with a `status` and the time it was taken.

### Restoring in place

A restore in place replaces the project's database with the backup. Choose the closest backup taken before the damage, in the dashboard's Database > Backups, and confirm. Supabase documents that **the project is inaccessible while it restores**, for longer the larger the database, so every page of the application that reads data fails meanwhile; plan the restore for a quiet hour. With PITR, the restore is to a point in time, from the dashboard or from the Management API's [PITR restore](https://supabase.com/docs/reference/api/v1-restore-pitr-backup) (scope `database:write`):

```bash
printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" \
  | curl -sS -K - -X POST -H 'Content-Type: application/json' \
    -d '{"recovery_time_target_unix": <unix seconds>}' \
    "https://api.supabase.com/v1/projects/$REF/database/backups/restore-pitr"
```

Expected: status 201, and the dashboard's notice once the restore is done. Afterwards, from what the database holds and what it does not:

- Migrations pushed after the backup's time are gone, and so are their rows in the migration history, so `infra/scripts/push-migrations.sh` lists them as pending again and pushes them ([§ The Supabase project](/developers-guide/deployment#the-supabase-project) of the guide); the next deploy pushes them too.
- The rows `infra/scripts/bootstrap.sql` writes are back at their values of the backup's time. Run the script again if the service-role key or the project's address has changed since.
- Accounts created after the backup's time are gone with it.
- Objects uploaded after the backup's time stay in the buckets with no row pointing at them, and objects deleted after it stay deleted.
- The project's auth and API settings, its functions and their secrets are not in the database and stay as they were, and a plan of the Supabase root is the check: it reads `No changes`.

### Restoring to a new project

Restoring to a new project keeps the damaged project as it is, which Supabase advises when its present data is still wanted. [Supabase's page on restoring to a new project](https://supabase.com/docs/guides/platform/clone-project), read on 2026-11-21, marks the feature Beta and says that it needs a paid plan with physical backups, and that it starts from the source project's Database > Backups > "Restore to a New Project". The new project is in the source's region and gets the schema, the data, the roles, the auth users and the encryption root key. **It gets no Storage object and no bucket configuration, no Edge Function, no auth setting and no API key**, and none of the Realtime and extension settings. Extensions that call out, `pg_net` among them, run from the moment the restore completes.

The new project is then brought up in the repository's order, the order of [§ The Supabase project](/developers-guide/deployment#the-supabase-project) of the guide:

1. **The Supabase root.** Write the new project's ref and name into the root's `terraform.tfvars` and commit it; the deploy workflow reads the ref from that file. Take the old project out of the root's state with `terraform state rm module.supabase.supabase_project.this`, which deletes nothing on Supabase. Then plan and apply as in the guide: the root's `import` block imports the new project, and the apply writes its auth and API settings, its hooks, the function secrets and, only while the send-email hook is off, the auth service's SMTP settings. Read the plan first: it destroys no project.
2. **The functions.** Deploy them from a work directory linked to the new ref.
3. **`bootstrap.sql`**, with `BOOTSTRAP_STORAGE_URL` and the service-role key of the new project, before the new project takes any write. The copied `storage_config` rows still hold the old project's address and key, and the storage cleanup triggers send their deletes there through `pg_net`.
4. **The Storage objects.** Check that both buckets, `public-assets` and `private-assets`, exist. The migration that creates them is recorded as applied in the copy and does not run again, so a missing bucket is created by hand with the settings of `apps/supabase/supabase/schema/400-storage.sql`. Then copy the objects of both buckets from the old project to the new one, for example with the Supabase CLI's `storage cp`, downloading from one and uploading to the other.

Last, point the frontend at the new project: overwrite the anon key parameter as in [§ The two parameters](#the-two-parameters), set `PUBLIC_SUPABASE_URL` in the AWS root's `environment_values`, and deploy. The conformance probe of [Step 23](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-23-the-conformance-probe) is the check that the new project serves what the repository declares.

## Secret rotation

**When:** a secret has leaked or may have, someone who held it leaves, or a scheduled rotation is due.

Each procedure below says what the secret protects, where it lives, how it reaches what uses it, the steps in order, what breaks in between and the check afterwards. Every command takes the secret at a prompt, on standard input or from a file only you can read, so that no value reaches a command line, the process list or a shell history, and no step prints one. Of these procedures, the origin header secret's was carried out on staging, on 2026-11-20, and its window measured; the others are written from the mechanism in the files they name.

### The two parameters

`PUBLIC_SUPABASE_ANON_KEY`, the Supabase project's anon key, and `ANALYTICS_POSTHOG_KEY`, the PostHog project key the analytics relay forwards events with, are SecureStrings of the AWS parameter store under `/openvaa/<your-environment>/frontend/`, created by hand outside Terraform. Both are `parameter` entries of [`task-environment.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/modules/frontend-service/task-environment.json), and the module's `container_secrets` in `infra/modules/frontend-service/main.tf` gives the task definition each parameter's unversioned ARN. ECS reads the value **when a task starts**, so a running task keeps the value it started with, and a new value reaches only tasks started after it was written.

1. Overwrite the value, typed at the prompt. AWS refuses tags on an overwrite, and the parameter keeps its own:

   ```bash
   P=/openvaa/<your-environment>/frontend
   N=PUBLIC_SUPABASE_ANON_KEY   # or ANALYTICS_POSTHOG_KEY
   printf '%s: ' "$N"; read -rs V; echo
   printf '%s' "$V" | aws ssm put-parameter --name "$P/$N" \
     --type SecureString --value file:///dev/stdin --overwrite
   echo "put_exit=$?"; unset V
   ```

2. Start new tasks. The first route is a deploy: push a new commit to `deploy/staging`, whose new image makes a new task definition and so a rollout. Without a new commit, a forced new deployment of the service starts new tasks from the same task definition:

   ```bash
   C=openvaa-staging; S=openvaa-staging-frontend   # your cluster and service
   aws ecs update-service --cluster "$C" --service "$S" \
     --force-new-deployment --query 'service.serviceName' --output text
   aws ecs wait services-stable --cluster "$C" --services "$S"
   echo "stable_exit=$?"
   ```

In between, tasks started before step 1 hold the old value, and tasks started after it, by a scale-out or by the rollout, the new one; a rollout runs both side by side for a while. If the old value no longer works once the new one is issued, as the anon key after a new JWT secret, the old tasks fail with it until the rollout has replaced them. Expected afterwards: the rollout steady, `/api/health` answering 200 through the public name, and a plan of the AWS root with the running digest reading `No changes.`. See [Step 2 of the AWS runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-2-the-two-parameters).

### The origin header secret

The load balancer forwards a request to the tasks only when it carries the origin header with the value CloudFront sends, and answers every other request with a fixed 403, so the tasks are reached through CloudFront alone. The value is one `random_password`, `origin_verify` in `infra/modules/frontend-service/origin.tf`, kept in the AWS root's state. Two resources read it: the listener rule `from_cloudfront` in the same file, whose header condition forwards, and the origin's `custom_header` of the distribution in `edge.tf`.

The rotation is one plan and one apply of the AWS root, with the running digest and the password replaced, `T` and `DIGEST` set as in [§ Election-day scaling](#election-day-scaling). The staging root instantiates the module as `module "frontend"`, so the address is `module.frontend.random_password.origin_verify`:

```bash
terraform -chdir="$T" plan -input=false -var "image_digest=$DIGEST" \
  -replace=module.frontend.random_password.origin_verify -out=tfplan
terraform -chdir="$T" apply -input=false tfplan
```

Apply the plan only if it changes exactly three things: the password replaced, the listener rule updated (or replaced) and the distribution updated. Make no deploy meanwhile. Terraform updates the listener rule and the distribution in parallel, since nothing orders them: the rule takes the new value within seconds, while the distribution's change reaches the edge locations over minutes, and the apply waits until it reads deployed. **In between, a request an edge location forwards with the old value is answered 403**, so a short window of 403s through the public name is expected. Poll `/api/health` once a second from before the apply until ten minutes after it, and keep the workstation awake, so that the window is measured; only health that is not back to 200 by then, or any 5xx, is a failure. The step's recovery is in the runbook.

On staging, on 2026-11-20, the plan read `Plan: 1 to add, 2 to change, 1 to destroy.`: the password replaced, the listener rule and the distribution updated in place, and nothing else. The apply exited 0 and completed at 21:44:56Z. The poll, with no gap over 3 seconds, read **5 answers of 403 from 21:44:14Z to 21:44:19Z, a window of 5 seconds**, which closed 37 seconds before the apply did, and no 5xx; health was 200 for the rest of the ten minutes. The window is what the edge location this one workstation reached saw; another edge location takes the new value at its own moment within the apply. A plan of the same digest afterwards read `No changes.`, which reads the listener rule and the distribution back from AWS, the value's hash had changed, and `/api/health` through CloudFront answered 200, so the header CloudFront sends is the one the rule forwards. The three requests sent to the load balancer directly, without the header, with a wrong value and with the right one, got no answer at all (`000`, curl exit 28): its security group admits CloudFront's addresses only, so they never reached the listener rule. The rule's own 403 to a direct request was read in Step 9, through an address opened for that step and closed after it. The value was never printed. See [Step 19 of the AWS runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-19-the-origin-header-secret-rotated) and its [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#observations).

### The SES SMTP key

The SMTP credential is how the Edge Functions send mail through SES, and Supabase Auth too while the send-email hook is off: invitations, sign-in links and password recovery all depend on it. It is the access key `aws_iam_access_key.smtp` of the SMTP user in `infra/modules/mail-ses/smtp.tf`, kept in the zone-and-mail root's state; the root's outputs `smtp_username` (the key's id) and `smtp_password` (the SMTP password SES derives from the key's secret) are what the operator reads into `TF_VAR_smtp_user` and `TF_VAR_smtp_password` for the Supabase root. That root sends them to the Edge Functions as `SMTP_USER` and `SMTP_PASS`, and to the auth service's SMTP settings through `supabase_settings.smtp_secret` in `infra/modules/supabase/main.tf` only while `enable_send_email_hook` is `false`.

1. Replace the key in the zone-and-mail root, where the staging root calls the module `mail_ses`:

   ```bash
   D=infra/envs/<your-environment>/dns-mail
   terraform -chdir="$D" plan -input=false \
     -replace=module.mail_ses.aws_iam_access_key.smtp -out=tfplan
   terraform -chdir="$D" apply -input=false tfplan; rm -f "$D/tfplan"
   ```

   Expected: `Plan: 1 to add, 0 to change, 1 to destroy.`, the access key alone.

2. At once, apply the Supabase root with the new outputs read into the two variables, with the commands of [§ The Supabase project](/developers-guide/deployment#the-supabase-project) of the guide. Expected: the plan updates the function secrets, and the auth service's SMTP credential too while the send-email hook is off, and a second plan reads `No changes`.

The replacement deletes the old key before it creates the new one, and the module sets no other order, so **every mail fails from the first apply until the second**: run both in one sitting, at a quiet hour. The plan files hold the credential in clear text and are removed after each apply. Afterwards, send one mail that the stack sends, such as a password recovery to your own address, and follow it.

### The function secrets

The Edge Functions' secrets set by Terraform are `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER` and `SMTP_PASS`, and, with bank authentication on, the six identity-provider secrets of `identity-callback`, written by `supabase_edge_function_secrets.this` in `infra/modules/supabase/function-secrets.tf` from the Supabase root's inputs: `public_project_id`, `public_origin`, the `smtp` object, the two SMTP variables, the `identity_provider` object and its two secret variables. That resource is their only writer, and the values are kept in the root's state in clear text, which is why the state is in the encrypted bucket. To change one, change its input and plan and apply the Supabase root as the guide does. [Supabase documents](https://supabase.com/docs/guides/functions/secrets) that functions read a new secret at once, with no new deploy, so one apply leaves no window but the SMTP one above. Expected: a second plan reads `No changes`, and the read-back of [Step 18 of the Supabase runbook](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-18-the-settings-and-the-function-secrets) lists the secrets by name, never by value. [Hosted Supabase settings](/developers-guide/deployment/hosted-settings) lists each.

### The identity-callback server secret

`IDENTITY_CALLBACK_SERVER_SECRET` proves to the `identity-callback` function that a call comes from the frontend server: the server's `constants.IDENTITY_CALLBACK_SERVER_SECRET` (`apps/frontend/src/lib/server/constants.ts`) is sent in the `x-identity-callback-secret` header by the bank-authentication callback, and the function refuses every call whose header does not match its own value. The two sides must hold the same value. With bank authentication on, the Supabase root sends it to the function from `TF_VAR_identity_callback_server_secret`, and the AWS task reads it from its parameter of that name ([§ Identity provider settings](/developers-guide/deployment#identity-provider-settings) of the guide); neither root reads the other's. With bank authentication off, neither side holds it and there is nothing to rotate.

Make one new value in a file that only you can read, and set it on both sides back to back:

```bash
L=$(umask 077; mktemp -d)
(umask 077; openssl rand -hex 32 > "$L/callback")
```

1. Overwrite the parameter `IDENTITY_CALLBACK_SERVER_SECRET` under the AWS root's `parameter_path` with the file's value, as the anon key is overwritten in [§ The two parameters](#the-two-parameters).
2. In the Supabase root's shell, `export TF_VAR_identity_callback_server_secret="$(cat "$L/callback")"`, then plan and apply the root. Expected: the plan updates `supabase_edge_function_secrets.this` in place and nothing else.
3. Start new tasks, as in [§ The two parameters](#the-two-parameters).

Remove the file with `rm -rf "$L"` afterwards. From the apply until the new tasks serve, every bank identification is refused by the function and ends on the error screen with `configuration_error`. Expected afterwards: one identification through the provider signs in.

### The database password

The password of the `postgres` role lives in the Supabase project. The Supabase root's `database_password` variable is required by the provider but never sent: the project resource ignores changes to it (`ignore_changes` in `infra/modules/supabase/main.tf`), so a new password needs no Terraform change. It is used by the deploy job, as the `staging` environment's secret `SUPABASE_DB_PASSWORD`, to link the project, push the migrations and check the deployment settings, and by the operator's shells for `psql`, the migrations and the bootstrap.

1. Reset it in the dashboard's Database Settings. [Supabase documents](https://supabase.com/docs/guides/database/postgres/roles) that the change causes no downtime and that its own services follow it.
2. Update the GitHub secret, typed at the prompt, and the store you keep it in:

   ```bash
   gh secret set SUPABASE_DB_PASSWORD --env staging
   ```

A deploy between the two steps fails at the link of the migrations, so make none. Expected afterwards: `psql` connects with the new password read at a prompt, and the next deploy passes its migrations step.

### The service-role key and the anon key

The service-role key bypasses row-level security. It is in no task and no workflow: `infra/scripts/bootstrap.sql` writes it into the `service_role_key` row of `public.storage_config`, for the storage cleanup triggers to send to the Storage API, and the platform gives the functions their own copy. The anon key is the parameter above. Both are the legacy keys, JWTs signed with the project's legacy JWT secret, so **they rotate only with the JWT secret, and only together**. Supabase's page on [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys), read on 2026-11-21, says that with the legacy JWT secret the users signed in at the time of a rotation are signed out at once, and that the anon and service-role keys must be rotated simultaneously.

1. Make a new legacy JWT secret in the project's JWT settings in the dashboard. From here, **every user is signed out**, and the old anon and service-role keys stop working.
2. Overwrite the anon key parameter with the new anon key and start new tasks, as in [§ The two parameters](#the-two-parameters). Until the new tasks serve, the old ones send the old key, which the project refuses, so the application serves no data.
3. Run `infra/scripts/bootstrap.sql` again with the new service-role key typed at the prompt, as in the guide's bootstrap; its header says that a rotated key is applied by running it again. Until then the storage cleanup's deletes are refused, so a deleted row leaves its object behind.
4. The functions need nothing: the platform sets their keys itself.

Make all four steps in one sitting, at an hour with few users. Expected afterwards: voter pages show their data, and the conformance probe of [Step 23](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-23-the-conformance-probe) passes. The future path is the publishable and secret keys, which are not JWTs: [Supabase's page on API keys](https://supabase.com/docs/guides/api/api-keys), read on 2026-11-21, says it is deprecating the anon and service-role keys by the end of 2026, its page on [rotating a leaked key](https://supabase.com/docs/guides/security/rotate-leaked-api-keys) rotates a secret key by creating a new one and deleting the old one, and the signing keys page says that a rotation of signing keys signs no user out. Moving the deployment to them is future work (FUT-02).

### The Supabase access token

The access token is a personal token of the operator's Supabase account, and it reaches every project of that account, not one alone. The deploy job holds it as the `staging` environment's secret `SUPABASE_ACCESS_TOKEN`, to link the project, push the migrations and deploy the functions; the operator's shells give it to the Supabase provider, the CLI and the Management API reads.

1. Create a new token in the dashboard's account tokens page.
2. Update the GitHub secret, typed at the prompt, and the store you keep it in:

   ```bash
   gh secret set SUPABASE_ACCESS_TOKEN --env staging
   ```

3. Revoke the old token on the same page.

Nothing breaks in between, as long as the old token is revoked last. Expected afterwards: the backups read of [§ Restore](#what-supabase-keeps) answers with the new token, and the next deploy passes its functions step.

### The GitHub secrets

The repository's workflows use seven stored secrets. `GITHUB_TOKEN`, which GitHub issues for each run, is not one of them. Each is updated with `gh secret set <name>`, with `--env staging` for an environment secret, and its value typed at the prompt.

| Secret                      | Where                                        | What it is for                                                         | Used by                                                          | Rotation                                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALERT_EMAIL`               | The `staging` environment and the repository | The address of the alert topic's subscription, as `TF_VAR_alert_email` | `deploy.yml` and the pull-request plan of `infra-plan.yml`       | Set both; the next apply changes the subscription, which is confirmed again by mail                                                                                                                                                                                                            |
| `SUPABASE_ACCESS_TOKEN`     | The `staging` environment                    | The Supabase CLI and provider in the deploy job                        | `deploy.yml`                                                     | [§ The Supabase access token](#the-supabase-access-token)                                                                                                                                                                                                                                      |
| `SUPABASE_DB_PASSWORD`      | The `staging` environment                    | The link, the migrations push and the settings check in the deploy job | `deploy.yml`                                                     | [§ The database password](#the-database-password)                                                                                                                                                                                                                                              |
| `SMOKE_CONTESTANT_EMAIL`    | The `staging` environment                    | The smoke contestant's address, for the deployed smoke run             | `deploy.yml`                                                     | With the password                                                                                                                                                                                                                                                                              |
| `SMOKE_CONTESTANT_PASSWORD` | The `staging` environment                    | The smoke contestant's password                                        | `deploy.yml`                                                     | Give the user a new password, then update this secret and the keychain item `openvaa-staging-smoke-contestant` that `yarn test:e2e:deployed` reads ([Step 22](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-22-the-smoke-dataset)) |
| `TURBO_TOKEN`               | The repository                               | Turborepo's remote cache, outside the deployment                       | `docs.yml`, `release.yml`                                        | A new token, the secret, then the old token revoked                                                                                                                                                                                                                                            |

The environments and their settings are listed in [§ The environments and their settings](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#the-environments-and-their-settings) of the infrastructure README.

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
