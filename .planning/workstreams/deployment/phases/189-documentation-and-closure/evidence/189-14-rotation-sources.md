# 189-14 — the sources of the restore and secret-rotation sections (E-02, E-03)

Measured 2026-11-21 on `feat/deployment-terraform-supabase`, HEAD `fa8d8376c` before this plan.

## E-02 — Supabase's documentation, read

Each page was fetched with one `GET` (`curl -sSL`, status 200 for every page) and read from its
article text; nothing was sent to Supabase but the page request. The WebFetch tool was not
available to this executor, so `curl` made the same page request. Each page's `<link
rel="canonical">` is the URL recorded.

E02_DOCS_READ_AT=2026-11-21T07:27Z
E02_DOC=https://supabase.com/docs/guides/platform/backups
E02_DOC=https://supabase.com/docs/guides/platform/clone-project
E02_DOC=https://supabase.com/docs/reference/api/v1-list-all-backups
E02_DOC=https://supabase.com/docs/reference/api/v1-restore-pitr-backup

What each page said on that date, as the operations page cites it:

- `guides/platform/backups`: Pro, Team and Enterprise projects are backed up daily; a Pro project can
  reach the last 7 days of daily backups (Team 14, Enterprise up to 30); projects on Postgres
  `15.8.1.079` and newer use physical backups; daily backups store no password of a custom role;
  database backups do not include Storage objects, only their metadata, and restoring an old backup
  does not restore objects deleted after it; a restore is started in Database > Backups, the
  dashboard asks for confirmation, and the project is inaccessible during the restore, for longer the
  larger the database; subscriptions and replication slots are dropped before and re-created after
  (Realtime's slot excepted); PITR is an add-on of Pro, Team and Enterprise projects, with a worst-case
  RPO of two minutes, priced by retention (7 days about 100 USD a month, 14 about 200, 28 about 400);
  enabling PITR stops the daily backups; restoring to an earlier point replaces the current database,
  and "to preserve your current data, restore to a new project first"; physical backups are not
  downloadable, and a logical copy is made with `supabase db dump` or `pg_dump`. The page's
  Management API examples are the list `GET` and the PITR restore `POST` only.
- `guides/platform/clone-project` ("Restore to a new project", marked Beta): paid plans with
  physical backups; Database > Backups > "Restore to a New Project"; transferred: schema, data and
  indexes, roles, permissions and users, auth user data, the encryption root key; needing manual
  reconfiguration: Storage objects and settings (files and bucket configurations not copied), Edge
  Functions, auth settings and API keys, Realtime settings, database extensions and settings, read
  replicas; the new project is in the source's region; extensions that carry out external operations
  (`pg_net`, `pg_cron`, wrappers) start running as soon as the restore completes, with no way to
  pause them; a project created this way cannot itself be cloned.
- `reference/api/v1-list-all-backups`: `GET /v1/projects/{ref}/database/backups`, OAuth scope
  `database:read`, fine-grained permission `backups_read`; the 200 body holds `region`,
  `walg_enabled`, `pitr_enabled`, `backups[]` (`id`, `is_physical_backup`, `status` of
  `COMPLETED|FAILED|PENDING|REMOVED|ARCHIVED|CANCELLED`, `inserted_at`) and `physical_backup_data`.
- `reference/api/v1-restore-pitr-backup`: `POST /v1/projects/{ref}/database/backups/restore-pitr`,
  OAuth scope `database:write`, permission `backups_write`, required body
  `recovery_time_target_unix` (integer), answer 201.

The staging values the page uses are plan 189-06's read (`evidence/189-06-backups.md`,
`E2_READ_AT=2026-11-20T13:55Z`): `E2_PITR_ENABLED=false`, `E2_WALG_ENABLED=true`, `E2_BACKUPS=8`,
`E2_COMPLETED=8`, `E2_EARLIEST_UTC=null`, `E2_LATEST_UTC=null`, region `eu-north-1`.

## E-03 — each rotation mechanism, re-derived

Each line was derived with `grep -n -m1 -F` on its quoted anchor at run time, on 2026-11-21 at HEAD
`200e88fdc` (this plan's Task 1 commit); the line numbers belong to this file only, and the
operations page names the file and the symbol, never a line. Format:
`E03_SOURCE_<NAME>=<path>:<line> <symbol>`.

E03_SOURCE_PUBLIC_SUPABASE_ANON_KEY=infra/modules/frontend-service/task-environment.json:10 task-environment.json entry, source parameter
E03_SOURCE_ANALYTICS_POSTHOG_KEY=infra/modules/frontend-service/task-environment.json:94 task-environment.json entry, source parameter
E03_SOURCE_PARAMETER_VALUE_FROM=infra/modules/frontend-service/main.tf:45 local.container_secrets valueFrom, the unversioned parameter ARN
E03_SOURCE_PARAMETER_TASK_SECRETS=infra/modules/frontend-service/service.tf:33 aws_ecs_task_definition container secrets
E03_SOURCE_PARAMETER_PUT=infra/envs/staging/aws/README.md:345 Step 2 put-parameter, value on stdin
E03_SOURCE_PARAMETER_OVERWRITE=infra/envs/staging/aws/README.md:373 Step 2 overwrite rule
E03_SOURCE_ORIGIN_VERIFY=infra/modules/frontend-service/origin.tf:46 random_password.origin_verify
E03_SOURCE_ORIGIN_LISTENER_RULE=infra/modules/frontend-service/origin.tf:115 aws_lb_listener_rule.from_cloudfront http_header
E03_SOURCE_ORIGIN_DEFAULT_403=infra/modules/frontend-service/origin.tf:97 aws_lb_listener.https default fixed_response
E03_SOURCE_ORIGIN_CUSTOM_HEADER=infra/modules/frontend-service/edge.tf:88 aws_cloudfront_distribution.this origin custom_header
E03_SOURCE_ORIGIN_WAIT=infra/modules/frontend-service/edge.tf:70 aws_cloudfront_distribution.this wait_for_deployment
E03_SOURCE_ORIGIN_ADDRESS=infra/envs/staging/aws/main.tf:62 module.frontend (replace address module.frontend.random_password.origin_verify)
E03_SOURCE_ORIGIN_STEP19=infra/envs/staging/aws/README.md:3658 Step 19 heading
E03_SOURCE_SES_SMTP_KEY=infra/modules/mail-ses/smtp.tf:9 aws_iam_access_key.smtp
E03_SOURCE_SES_SMTP_USERNAME=infra/modules/mail-ses/outputs.tf:26 output smtp_username (access key id)
E03_SOURCE_SES_SMTP_PASSWORD=infra/modules/mail-ses/outputs.tf:32 output smtp_password (ses_smtp_password_v4)
E03_SOURCE_SES_MODULE_ADDRESS=infra/envs/staging/dns-mail/main.tf:49 module.mail_ses (replace address module.mail_ses.aws_iam_access_key.smtp)
E03_SOURCE_SES_AUTH_SMTP=infra/modules/supabase/main.tf:52 supabase_settings.smtp_secret (smtp_user, smtp_pass)
E03_SOURCE_SES_TF_VARS=infra/envs/staging/supabase/README.md:678 sitting lines: TF_VAR_smtp_user/TF_VAR_smtp_password from the dns-mail outputs
E03_SOURCE_FUNCTION_SECRETS=infra/modules/supabase/function-secrets.tf:20 supabase_edge_function_secrets.this
E03_SOURCE_FUNCTION_SECRET_NAMES=infra/modules/supabase/function-secrets.tf:14 local.function_secret_names (PUBLIC_PROJECT_ID, SITE_URL, SMTP_HOST, SMTP_PORT, SMTP_FROM, SMTP_USER, SMTP_PASS)
E03_SOURCE_FUNCTION_SECRETS_ONLY_WRITER=infra/modules/supabase/function-secrets.tf:1 header comment: the only writer
E03_SOURCE_IDENTITY_CALLBACK_SERVER_SECRET=apps/frontend/src/lib/server/constants.ts:4 constants.IDENTITY_CALLBACK_SERVER_SECRET (frontend server)
E03_SOURCE_IDENTITY_CALLBACK_SERVER_SECRET_SENT=apps/frontend/src/routes/api/oidc/callback/+server.ts:173 GET handler, sent as x-identity-callback-secret
E03_SOURCE_IDENTITY_CALLBACK_SERVER_SECRET_FUNCTION=apps/supabase/supabase/functions/identity-callback/index.ts:201 identity-callback caller check (requireEnv)
E03_SOURCE_DATABASE_PASSWORD=infra/modules/supabase/main.tf:32 supabase_project.this lifecycle ignore_changes
E03_SOURCE_DATABASE_PASSWORD_VARIABLE=infra/modules/supabase/variables.tf:16 var.database_password (never sent)
E03_SOURCE_DATABASE_PASSWORD_PIPELINE=.github/workflows/deploy.yml:258 deploy job, link step env
E03_SOURCE_SERVICE_ROLE_KEY=infra/scripts/bootstrap.sql:5 bootstrap.sql header
E03_SOURCE_SERVICE_ROLE_KEY_ROWS=infra/scripts/bootstrap.sql:156 storage_config upsert
E03_SOURCE_SERVICE_ROLE_KEY_READER=apps/supabase/supabase/migrations/00001_initial_schema.sql:5991 storage cleanup trigger function reads the key
E03_SOURCE_SUPABASE_ACCESS_TOKEN=.github/workflows/deploy.yml:257 deploy job, link step env (also the migrations and functions steps)
E03_SOURCE_SUPABASE_ACCESS_TOKEN_PROVIDER=infra/envs/staging/supabase/main.tf:29 provider "supabase" reads it from the shell
E03_SOURCE_GITHUB_ALERT_EMAIL=.github/workflows/deploy.yml:212 deploy job plan step
E03_SOURCE_GITHUB_ALERT_EMAIL_PR=.github/workflows/infra-plan.yml:192 pull-request plan job
E03_SOURCE_GITHUB_SUPABASE_ACCESS_TOKEN=.github/workflows/deploy.yml:257 deploy job
E03_SOURCE_GITHUB_SUPABASE_DB_PASSWORD=.github/workflows/deploy.yml:318 deploy job, migrations step
E03_SOURCE_GITHUB_SMOKE_CONTESTANT_EMAIL=.github/workflows/deploy.yml:518 deploy job, smoke step
E03_SOURCE_GITHUB_SMOKE_CONTESTANT_PASSWORD=.github/workflows/deploy.yml:519 deploy job, smoke step
E03_SOURCE_GITHUB_ANTHROPIC_API_KEY=.github/workflows/claude-code-review.yml:37 also claude.yml and claude-solve-issue.yml
E03_SOURCE_GITHUB_TURBO_TOKEN=.github/workflows/docs.yml:24 also release.yml
E03_SOURCE_GITHUB_ENVIRONMENT_SECRETS=infra/README.md:206 the staging environment secrets table row

The seven GitHub secrets are the distinct `secrets.<NAME>` uses of `.github/workflows/` other than
`GITHUB_TOKEN`, which GitHub issues per run: `ALERT_EMAIL`, `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD`, `ANTHROPIC_API_KEY`,
`TURBO_TOKEN` (`grep -n 'secrets\.[A-Z_]*' .github/workflows/*.yml`). Where each is stored is
`infra/README.md` § The environments and their settings: the five deployment secrets in the
`staging` environment, `ALERT_EMAIL` also in the repository for the pull-request plan.

Supabase's pages read for the rotation section, by the same one-`GET` fetch as above:

E03_DOCS_READ_AT=2026-11-21T07:35Z
E03_DOC=https://supabase.com/docs/guides/auth/signing-keys
E03_DOC=https://supabase.com/docs/guides/api/api-keys
E03_DOC=https://supabase.com/docs/guides/security/rotate-leaked-api-keys
E03_DOC=https://supabase.com/docs/guides/functions/secrets
E03_DOC=https://supabase.com/docs/guides/database/postgres/roles

- `guides/auth/signing-keys`: the legacy JWT secret signs the anon and service-role keys and all user
  access tokens; its comparison table reads, for the legacy JWT secret, "Users signed out during
  rotation: Currently active users get immediately signed out" and "anon and service_role must be
  rotated simultaneously", and for the signing keys "No users get signed out".
- `guides/api/api-keys`: "Supabase is deprecating the anon and service_role keys by the end of 2026";
  publishable (`sb_publishable_`) and secret (`sb_secret_`) keys are not JWTs; creating them does not
  revoke the legacy keys.
- `guides/security/rotate-leaked-api-keys`: a leaked secret or service-role key is replaced by a new
  secret key, then the compromised key deleted or the legacy keys deactivated (which deactivates both).
- `guides/functions/secrets`: "Your functions read a new secret immediately, so you don't need to
  redeploy"; `supabase secrets set --env-file` sets the secrets of a file.
- `guides/database/postgres/roles`: the `postgres` password is changed in the dashboard's Database
  Settings; "Changing the password does not result in any downtime", Supabase's managed services
  follow it, and an external service with the old password needs a manual update.

What the page takes from 189-07 (`evidence/189-07-origin-rotation.md`, read 2026-11-21):
`R1_SITTING=approved`, the three `R1_CHANGE` lines and
`R1_PLAN_SUMMARY=Plan: 1 to add, 2 to change, 1 to destroy.`, `R1_APPLY_EXIT=0`,
`R1_APPLY_COMPLETE_AT=2026-11-20T21:44:56Z`, `R1_HEALTH_MAX_GAP_SECONDS=3`,
`R1_HEALTH_FIRST_NON200=2026-11-20T21:44:14Z`, `R1_HEALTH_LAST_NON200=2026-11-20T21:44:19Z`,
`R1_WINDOW_SECONDS=5`, `R1_HEALTH_403=5`, `R1_HEALTH_5XX=0`, `R1_HEALTH_RECOVERED=yes`,
`R1_AFTER_PLAN_NO_CHANGES=yes`, `R1_VALUE_CHANGED=yes`, `R1_CDN_HEALTH_AFTER=200`, and the three
direct requests `000` with curl exit 28. The page says the direct requests got no answer, never that
they were answered 403.

What the page states from mechanism and was not rehearsed in this phase (E-03 rehearses the origin
header secret only): the parameter overwrite and the forced new deployment (research assumption A2:
the page gives the deploy of a new commit as the first route, and a plan of `No changes.` as the
check), the SES key replacement and its mail window (assumption A3: Terraform's default replacement
order, destroy before create, with no `create_before_destroy` in `smtp.tf`), the function secrets,
the callback secret, the database password, the JWT secret and the access token.
