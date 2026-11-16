# 187-27 evidence: the rebased branch made sound and carried to CI

Repository `OpenVAA/voting-advice-application`, branch `feat/deployment-terraform-supabase`. Read and written by the plan executor from this checkout, 2026-11-16. Remote reads were `gh api` GETs and `git ls-remote` only. Nothing was pushed, and no GitHub, AWS or Supabase setting was read or changed. Logs and status files are under `tmp/187-27/` (ignored).

**Pre-rebase commit ids.** Every commit id cited in this workstream's evidence before the rebase of 2026-11-16, including every id in `187-26-ci-closure.md` and the superseded sections of `187-12-evidence-commits.md` and `187-13-closing-e2e.md`, names a commit of `backup/deployment-pre-rebase-20261116`, not of HEAD. Those lines are left as written. A new line that needs a pre-rebase base uses the rebased commit with the same subject and records both ids.

## The rebase (2026-11-16)

```
REBASE_HEAD_AT_START=dbe69d1a6fe8cbacedbbc7648eece958a82a4cbc
REBASE_BACKUP_TIP=30202494344883b74d2025731e07404b994142a4
REBASE_ONTO=c2b3bff15c78168ae73fa244f1e443f05a34269e
REBASE_COUNTERPART_ee85b83a3=d35c1bb6aa558aa6988e048e62b90c7d96f62b9f
REBASE_COUNTERPART_a7a4222a8=36a67601889033d1ef783ff6ccb0d845d4226f7f
PRE_REBASE_SHAS_RESOLVE_IN_BACKUP_ONLY=yes
```

- `REBASE_HEAD_AT_START` is `git rev-parse HEAD` before this plan's first commit (the plan's own commit `dbe69d1a6`, one past the planning-time HEAD `201a6320a`). `REBASE_BACKUP_TIP` is `git rev-parse backup/deployment-pre-rebase-20261116`.
- The counterparts are the commits of `c2b3bff15..HEAD` (466 commits) whose subjects are `docs(187): pattern map` and `docs(186): discussion points and context (recommendations, operator away)`, one each.
- For each id 187-26 cited (`27ee4fcea`, `a21f94b99`, `02a1530b2`, `6c8d41c6f`, `97a631eb9`), `git merge-base --is-ancestor <id> backup/deployment-pre-rebase-20261116` exited 0 and `git merge-base --is-ancestor <id> HEAD` exited 1.
- Every earlier evidence id names the backup's history and is left as written.

## Task 1: the gates on the rebased tree, the local database, the archive build and the scan

```
REBASE_GATE_INSTALL_EXIT=0
REBASE_GATE_BUILD_EXIT=0
REBASE_GATE_DB_RESET_EXIT=0
LOCAL_MIGRATIONS_APPLIED=22
REBASE_GATE_DB_LINT_SQL_EXIT=0
REBASE_GATE_PGTAP_EXIT=0
REBASE_GATE_DB_TYPES_DIFF=empty
REBASE_PLAYWRIGHT_BROWSER=unchanged (playwright-core 1.63.0 at the backup and at HEAD, chromium revision 1243 already installed)
REBASE_GATE_LINT_CHECK_EXIT=0
REBASE_GATE_FORMAT_CHECK_EXIT=0
REBASE_GATE_FORMAT_CHECK_FIRST_ATTEMPT_EXIT=1
REBASE_GATE_TYPECHECK_EXIT=0
REBASE_GATE_TEST_UNIT_EXIT=0
REBASE_GATE_LINT_WORKFLOWS_EXIT=0
REBASE_GATE_SKILL_DRIFT_EXIT=0
REBASE_GATE_SKILL_DRIFT_ON_BRANCH_HISTORY_EXIT=1
REBASE_GATE_E2E_SELF_TEST_EXIT=0
REBASE_GATE_TF_FMT_EXIT=0
REBASE_GATE_TF_ROOTS_VALIDATED=8
REBASE_GATE_TF_MODULES_TESTED=frontend-service,github-oidc
REBASE_GATE_TF_EXAMPLE_PLANS=example/aws,example/dns-mail,example/supabase
REBASE_PROBE_COMMIT=e98e7de458d92f6c504037360ae38046b2ca05af
REBASE_PROBE_TREE=64ae8ba1836aea92a9bb112501992fc1dd84d678
REBASE_GATE_ARCHIVE_BUILD_EXIT=0
REBASE_SCAN_PROBE_EXIT=0
REBASE_SCAN_PROBE_RESULTS=0
REBASE_PROBE_REFS_DELETED=yes
REBASE_FALLOUT=format:check: apps/frontend/src/hooks.server.ts (deployment; the rebase's hand-resolved conflict in a -gsd file): the merged five-handle sequence() call was left on one line past the print width
```

How each line was read:

- **Install, build and the database** (`tmp/187-27/t1/step2.sh`, in the background, each status written by the command on the line after it, `TURBO_CACHE_DIR=tmp/187-27/turbo-cache`; 17:29:58Z to 17:31Z). `yarn install --immutable` exit 0, `yarn build` exit 0, `yarn db:reset` exit 0. `docker exec supabase_db_openvaa-local psql -U postgres -tAc 'select count(*) from supabase_migrations.schema_migrations'` printed `22`, the number of `.sql` files under `apps/supabase/supabase/migrations/` at HEAD (`git ls-tree`). `yarn db:lint:sql` exit 0 (`Summary: 0 error(s), 3 warning(s)`, the advisor's non-failing foreign-key-index notes), and `yarn workspace @openvaa/supabase test:db` exit 0 (`Result: PASS`).
- **The generated types.** The first `yarn db:types` ran directly after the pgTAP tests, as the plan orders them, and `git diff --quiet -- packages/supabase-types` exited 1: 18 added lines, every one a test helper the pgTAP run leaves in the schema (`create_test_data`, `set_test_user`, `test_user_id` and their siblings). CI's `supabase-types-drift` job generates on a database no test has run against. So the generated file was restored with `git checkout --` (it is this plan's own output), `yarn db:reset` was run again (exit 0, 22 migrations), and `yarn db:types` then exited 0 with `git diff --quiet` exit 0. That is the line recorded. It is a measurement-order correction, not fallout.
- **The repository gates** (`tmp/187-27/t1/run-gates.sh`, one after another, at HEAD `dbe69d1a6`). `lint:check` exit 0, including upstream's `assert:test-keys-scope` and `assert:no-preregister` and this branch's `assert:hosted-settings-parity`, and ESLint's ban on `unroute()`; no call was found. `typecheck` exit 0. `test:unit` exit 0, which includes `apps/frontend/src/hooks.server.test.ts`, so no test asserts a handle sequence other than the merged one. `lint:workflows` exit 0 (`actionlint found nothing in 3 workflows`). `tests/scripts/e2e-run.sh --self-test` exit 0 (`self-test passed: 13 case(s)`, the Linux key-server bind cases among them). `format:check` exited 1 first, on `apps/frontend/src/hooks.server.ts` alone: the fallout below. After the fix, `format:check` exit 0 (`All matched files use Prettier code style!`).
- **The skill-drift audit.** On the branch, `.claude/scripts/audit-skill-drift.sh` exits 1 (four skills drifted). The audit counts commits to each skill's targets since the last commit touching the skill's own directory, so it reads history, not the tree. CI runs it on the pushed source-only commit, whose single commit touches every skill directory. Run that way, in the scan repository of the probe commit below (with `origin/main`'s history and the probe commit checked out), it exited 0 with `Checked: 6  Drifted: 0  Skipped: 2`. `REBASE_GATE_SKILL_DRIFT_EXIT` is that reading, and the branch reading is recorded beside it.
- **Terraform** (`tmp/187-27/run-tf.sh t1`, after the gates, alone). `terraform fmt -check -recursive -diff infra` exit 0. The eight roots each `init -backend=false -lockfile=readonly` and `validate` exit 0. `terraform test` of `frontend-service` `Success! 33 passed, 0 failed.` and of `github-oidc` `Success! 11 passed, 0 failed.`. The three example roots each `Success! 1 passed, 0 failed.`. `git status --porcelain` afterwards listed only the untracked ledger.
- **The probe.** HEAD `527d9e866` (after the fallout fix), its tree without `.planning/` written in a temporary index (`read-tree HEAD`, `rm -r --cached --quiet .planning`, `write-tree`), committed with parent `refs/remotes/origin/main` (`340a20070`, no fetch) and message `deploy: staging`, held by `refs/evidence/187/build-probe`. Its tree has 0 planning paths and equals HEAD's outside `.planning/` (`git diff --quiet` exit 0).
- **The archive build.** `tmp/187-27/build-archive.sh probe`: `git archive` of the probe, extracted into a scratch directory, then `docker buildx build --platform linux/arm64 --target production --provenance=false --sbom=false -f apps/frontend/Dockerfile --output type=cacheonly`, exit 0 in 90 s.
- **The scan.** `tmp/187-27/scan.sh probe 340a200708c28fb7ed078d452138712f3400c789 refs/evidence/187/build-probe`, 187-26 Task 1's command (`ghcr.io/trufflesecurity/trufflehog:3.97.9`, digest `sha256:52e67fef4d054ecff5c2ce4b4ae376626d1ef54aa0898b53cac19c25e92e14db`, main.yaml's `extra_args`), in a fresh `git init` repository fetched from this checkout. The `--github-actions` run exit 0, `"verified_secrets": 0, "unverified_secrets": 0` over 4186 chunks, no annotation. The `--json` run exit 0; `jq` selected no result, so there is no `REBASE_SCAN_FINDING=` line. Its mode-700 directory was deleted, the scan repository removed, and `tmp/187-27/scan/` removed after it.
- **Clean-up.** `git update-ref -d refs/evidence/187/build-probe`; `git show-ref --quiet` of it and of `refs/evidence/187/scan-probe` each exit 1. `docker builder prune -af` exit 0 (2.565 GB).
- **The fallout.** `apps/frontend/src/hooks.server.ts` holds the conflict this branch's rebase resolved by hand. `prettier --write` split the `sequence(...)` call over seven lines, with the order unchanged. Committed as `527d9e866` (`fix(187-27): format the merged handle sequence of hooks.server.ts`). No other gate or the scan was red, so no exclusion entry and no test change was needed.


## Task 2: what the rebase carries to the staging Supabase project, from records only

```
HOSTED_READS_BY_AGENT=0
HOSTED_WRITES_BY_AGENT=0
MIGRATIONS_AT_HEAD=22
MIGRATIONS_ON_STAGING=00001
MIGRATION_00001_UNCHANGED_SINCE_STAGING_PUSH=yes
MIGRATIONS_FIRST_PIPELINE_PUSH=21
MIGRATION_PENDING=00002_claim_excludes_identity_provider_accounts.sql lines=107 blob=10a88aaae4c612fc98784b3265dc25e4ef6d3f7d
MIGRATION_PENDING=00003_address_confirmation_request.sql lines=97 blob=0410a2101c66716f92992ff0d14f564ca233bd8a
MIGRATION_PENDING=00004_user_entities_pending_email_taken.sql lines=92 blob=663234bc8f269df39169d4c193e6eb7b7a4d9800
MIGRATION_PENDING=00005_invitation_link_bounds.sql lines=234 blob=d9adad8c9ecadbf8a89c6a4897082b8bc84fce74
MIGRATION_PENDING=00006_nomination_write_guards.sql lines=973 blob=49251e0c638dd9d5e8da6292d55ee32a8839c5b2
MIGRATION_PENDING=00007_nomination_write_kept_constituency.sql lines=425 blob=277555b609e66aa26806fddc9deaf594e4863cf3
MIGRATION_PENDING=00008_bulk_import_key_quoting.sql lines=136 blob=81f00c6a4b8faaa5733777b40219e53e73a30095
MIGRATION_PENDING=00009_contestant_app_public_config_bounded.sql lines=67 blob=c6b7c4a3e8582227e17d72fb41974dd3756eaa70
MIGRATION_PENDING=00010_claim_grant_key_conflict_target.sql lines=106 blob=1e10b25e9dc6c76e9d3040763bfabcef44e13c6f
MIGRATION_PENDING=00011_invitation_email_target_open_rows.sql lines=15 blob=5bebf0d83ae93477adb9adcc2153596ffd884afe
MIGRATION_PENDING=00012_bulk_import_constituency_links.sql lines=158 blob=b73c035146aec7a7a0bb52f6432418952e8bcbed
MIGRATION_PENDING=00013_nomination_constituency_rule.sql lines=177 blob=c859f6a1c7c95242b4d352798a100dea810e5d0f
MIGRATION_PENDING=00014_set_entity_nominations_constituency_once.sql lines=413 blob=ed0207ad708fc678752e68325026e40903191cb0
MIGRATION_PENDING=00015_answers_lock_entity_rows.sql lines=264 blob=3872052d1f42e5801615402401df9ce0a8df361f
MIGRATION_PENDING=00016_answers_lock_nominations_storage.sql lines=777 blob=fc0b0b0e04ff60ebc2059e060dc955c6b218b98b
MIGRATION_PENDING=00017_user_can_reads_grants.sql lines=143 blob=aa4b8300aa297f26749675e45edd5f53c9792ef1
MIGRATION_PENDING=00018_identity_entity_find_or_create.sql lines=157 blob=61737636fc218ba03312361dc0d50aa04dd5bcd3
MIGRATION_PENDING=00019_address_holds_open_invitation.sql lines=46 blob=47e9196b8b5175f84b700167566953bc53f27471
MIGRATION_PENDING=00020_identity_metadata_written_under_lock.sql lines=183 blob=22d85d4786c49a512f8a4e9c6441a904acb603b2
MIGRATION_PENDING=00021_email_holds_global_or_account_grant.sql lines=55 blob=dfa5a29f676149210f9350e852f8260e01a6947d
MIGRATION_PENDING=00022_grants_reaching_a_project.sql lines=117 blob=63b3a68a10935d3eb175f3c0833d0c94b5e8aa55
MIGRATIONS_NEEDING_HAND_STEP=none
MIGRATIONS_CALLTIME_PRIVILEGE_NOTE=00018_identity_entity_find_or_create.sql and 00020_identity_metadata_written_under_lock.sql define SECURITY DEFINER functions, owned by the pushing role, that UPDATE auth.users at call time; 00001 writes auth.users nowhere; a db push creates them without exercising that privilege, and whether the hosted postgres role holds it is unread by this plan
PUSH_MIGRATIONS_UNCHANGED_BY_REBASE=yes
187_21_EXPECTED_PENDING_STALE=yes (187-21-PLAN.md Task 1 records EXPECTED_PENDING=none for a commit holding 00001 alone; its green commit will hold 22 files, 21 pending)
HOSTED_SETTINGS_KEYS_CHANGED=auth.mailer_otp_length 6 -> 10; redirect_callback_paths ["/api/auth/callback","/*/api/auth/callback"] -> ["/auth/confirm","/*/auth/confirm"] (settings.tf joins each path onto public_origin into auth.uri_allow_list)
PARITY_SCRIPT_CHANGE=the expected values follow the JSON (redirect paths and config.toml's additional_redirect_urls now /auth/confirm, its three redirect-path mutation cases rewritten on /auth/confirm) and two row reasons are reworded (mailer_otp_length: a mailed link also mints a one-time code accepted in its place; mailer_secure_email_change_enabled: an identity-provider account's address confirmation relies on it); no row, key or rule is added or removed
PARITY_ASSERT_EXIT=0
STAGING_SETTINGS_HAND_APPLY=needed-before:187-21
STAGING_SETTINGS_HAND_APPLY_REASON_redirect_callback_paths=the functions staging serves (deployed 2026-11-11 from 0e6ba4f90, a pre-rebase commit) mail links to <site>/<locale>/api/auth/callback, and HEAD's account-access refuses to issue a link unless <site>/<locale>/auth/confirm is admitted (linkIssue.ts: "SITE_URL is not admitted by the auth redirect allowlist; no link issued"); deploy.yml deploys functions and frontend but sets no auth setting, so the allow list must change by hand in the same sitting as 187-21's deploy, immediately before its approval: earlier breaks the served functions' links, later leaves the new ones refusing
STAGING_SETTINGS_HAND_APPLY_REASON_mailer_otp_length=staging serves 6 since the hand apply of 2026-11-11 (runbook Observations: every managed setting served as declared, read back from the then hosted-settings.json); 10 keeps the one-time code each mailed link mints out of reach of guessing; the module sends both keys in one apply, so the shorter code stays until the same sitting
STAGING_SETTINGS_HAND_APPLY_REASON_187_18=187-18's red run fails at the build step, before any hosted write, and deploys nothing, so it needs no apply
STAGING_SETTINGS_RUNBOOK_STEP=Step 18 of infra/envs/staging/supabase/README.md
FUNCTION_ENV_NAMES_NEW=IDENTITY_CALLBACK_SERVER_SECRET
STAGING_FUNCTION_SECRETS_CHANGE=none
FRONTEND_ENV_NAMES_NEW=IDENTITY_CALLBACK_SERVER_SECRET (default '' in apps/frontend/src/lib/server/constants.ts; the OIDC callback answers configurationError while it is empty; not in infra/modules/frontend-service/task-environment.json, so the AWS root does not set it)
PROBE_IDENTITY_CALLBACK_CHECK_AFTER_FIRST_DEPLOY=would-fail
```

How each line was read (this checkout and its records only; no Terraform plan or apply, no Supabase CLI call against a project, no Management API read):

- **`MIGRATIONS_ON_STAGING=00001`.** `evidence/184-21-persistent-apply-push-functions.md` (phase 184): the push table reads `push_pending` `00001`, then none on the second run, and the drift report `history: database: 00001`. The staging runbook's Observations row of 2026-11-11 says the same (`push-migrations.sh` pushed the frozen baseline `00001`, `push_status=0`, clean drift check). No later row (2026-11-12, 2026-11-14, 2026-11-15) records a push.
- **`MIGRATION_00001_UNCHANGED_SINCE_STAGING_PUSH=yes`.** The head 184-21 records is `0e6ba4f902faa64e8393404a304e295d91c7105a`, an ancestor of the backup (`git merge-base --is-ancestor` exit 0). `git rev-parse 0e6ba4f90:apps/supabase/supabase/migrations/00001_initial_schema.sql` and the same at HEAD both print `2b07ce7c378db9c59b09165762b2b0bf0af351cf`. At `0e6ba4f90` and at the backup the migrations directory holds that one file.
- **The pending files.** `git ls-tree` at HEAD, less `00001`; each line count from `git show HEAD:<file> | wc -l` and each blob from `git rev-parse HEAD:<file>`.
- **`MIGRATIONS_NEEDING_HAND_STEP=none`.** Every top-level statement of the 21 files was listed (lines that begin with `CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE`, `SET` and so on). They are `CREATE OR REPLACE FUNCTION` and `DROP FUNCTION` in `public` and `private`, `GRANT` and `REVOKE` of `EXECUTE`, eight `DROP POLICY` and `CREATE POLICY` pairs on `public` entity and nomination tables (00015, 00016), and one `DROP INDEX` and `CREATE UNIQUE INDEX` on `public.invitations` (00011). A grep for `CREATE EXTENSION`, `ALTER SYSTEM`, `CREATE ROLE`, `ALTER ROLE`, `storage.buckets`, `ALTER DATABASE`, `CREATE SCHEMA`, `OWNER TO`, publications, `pg_cron`, `vault.` and `pgsodium` found none. 00016's name says "storage", but it changes only the nomination policies and `public.storage_path_can`, not the storage schema. The only hook it mentions is `custom_access_token_hook`, in comments, unchanged. So nothing needs a hosted step before a pooler `db push` by `postgres`. The call-time note above is recorded for 187-21's reviewer and is not a push step.
- **`PUSH_MIGRATIONS_UNCHANGED_BY_REBASE=yes`.** `git diff --quiet backup/deployment-pre-rebase-20261116 HEAD -- infra/scripts/push-migrations.sh infra/scripts/check-drift.sh` exit 0.
- **For 187-21's reviewer.** Its first pipeline deploy pushes these 21 migrations under the one environment approval, the single-approval risk C-04 accepts; the push is one-way. Its Task 1 still expects `EXPECTED_PENDING=none`, which held only while `00001` was the one file; the green commit 187-21 reads will hold 22.
- **`HOSTED_SETTINGS_KEYS_CHANGED`.** `git diff backup/deployment-pre-rebase-20261116 HEAD -- infra/modules/supabase/hosted-settings.json`: two hunks, `mailer_otp_length` and `redirect_callback_paths`. `infra/modules/supabase/settings.tf` line 36 builds `uri_allow_list = join(",", [for p in local.hosted.redirect_callback_paths : "${var.public_origin}${p}"])`. `apps/supabase/supabase/config.toml` changed the same two values (`otp_length = 10`, `additional_redirect_urls` on `/auth/confirm`).
- **`PARITY_ASSERT_EXIT=0`.** `yarn assert:hosted-settings-parity` exit 0 (`tmp/187-27/t1/parity.log`).
- **The served build.** `185-12-SUMMARY.md` and `185-13-SUMMARY.md` (phase 185) record the image `712947a1bd44a735f66ee8f51610f4748d76cd30` served at `https://staging.openvaa.org/api/health`; the AWS runbook records the root destroyed and applied again on 2026-11-14; STATE.md records `712947a1b` as what staging serves. At `712947a1b` the frontend has `routes/api/auth/callback/+server.ts` and no `routes/auth/confirm/`; at HEAD it has both. At `0e6ba4f90`, the functions' `signInLink.ts` has `CALLBACK_PATH = '/api/auth/callback'`; at HEAD it has `LINK_PATH = '/auth/confirm'`.
- **`FUNCTION_ENV_NAMES_NEW`.** Every `Deno.env.get('…')` and `requireEnv('…')` name in the functions' non-test `.ts` files, at the backup and at HEAD: the one name at HEAD alone is `IDENTITY_CALLBACK_SERVER_SECRET`. `identity-callback/index.ts` refuses a request without the `x-identity-callback-secret` header before it reads the variable, and an unset value then answers `configuration`.
- **`STAGING_FUNCTION_SECRETS_CHANGE=none`.** `infra/modules/supabase/function-secrets.tf` sets seven names (`PUBLIC_PROJECT_ID`, `SITE_URL` and five `SMTP_`). The new name serves only bank authentication through `identity-callback`, and the staging root configures no identity provider (none of the `IDENTITY_PROVIDER_` names is set either), so nothing is missing for what staging runs. C-05 leaves function secrets alone; no change is proposed.
- **`FRONTEND_ENV_NAMES_NEW`.** Every `env.X`, `process.env.X` and `env['X']` in the frontend's non-test sources at the backup and at HEAD.
- **`PROBE_IDENTITY_CALLBACK_CHECK_AFTER_FIRST_DEPLOY=would-fail`.** The conformance probe of runbook Step 23 (`infra/scripts/probe/checks.mjs`, check `functions.identity-callback-unverified`) expects `identity-callback` to answer a keyless GET with 405 and `{"error":"Method not allowed"}`, and a keyless POST of `{}` with 500 and `{"error":"Internal server error"}`. That is the function at the backup (`index.ts`: `status: 405` for a method other than POST). At HEAD it answers a GET with `bad_request`, status 400, and a POST without the server credential header with `refused`, status 401, each as `{"result":"…"}` (`requestContract.ts`). So once 187-21 deploys HEAD's functions, that check fails; the gateway still demands no JWT, which is what the check guards. Plan 187-25 runs the probe before its redeploy. Recorded as a blocker entry in `deferred-items.md`; no probe or runbook file is changed here.

The operator's step, from Step 18 of `infra/envs/staging/supabase/README.md`, with `R=staging`, after the lines that begin a sitting of that part of the runbook. Agents run none of it. Part A is one sitting; the go-ahead for the saved plan is given on its lines; Parts B and C follow.

1. The account check (prints `s18_account=471112560111`):

   ```bash
   A=$(aws sts get-caller-identity --query Account \
     --output text)
   echo "s18_account=$A"
   ```

2. Initialise, plan and save the plan (prints `s18_init_exit=0` and `s18_plan_exit=0`):

   ```bash
   T="infra/envs/$R/supabase"
   terraform -chdir="$T" init -input=false -no-color \
     > "$L/s18-init.log" 2>&1
   echo "s18_init_exit=$?"
   terraform -chdir="$T" plan -input=false -no-color \
     -out=tfplan > "$L/s18-plan.log" 2>&1
   echo "s18_plan_exit=$?"
   ```

3. The checksum and the plan's lines (prints `s18_plan_sha256=<hex>`, then `s18_plan_line=` lines; expected: one heading `module.supabase.supabase_settings.this` updated in place, a `Plan: 0 to add, 1 to change, 0 to destroy.` line, and no line naming the password, a replacement or a destroy):

   ```bash
   S=$(shasum -a 256 "$T/tfplan" | cut -d' ' -f1)
   echo "s18_plan_sha256=$S"
   grep -n -E -e '^  # |^Plan:|^No changes' \
     -e 'database_password|must be replaced' \
     -e 'will be destroyed|forces replacement' \
     "$L/s18-plan.log" | sed 's/^/s18_plan_line=/'
   ```

4. Part B, after the go-ahead names that SHA-256: compare the checksum, then apply the saved plan (prints the same `s18_plan_sha256=`, then `s18_apply_exit=0`, `s18_apply_line=Apply complete! Resources: 0 added, 1 changed, 0 destroyed.` and `s18_plan_file_removed=yes`):

   ```bash
   S=$(shasum -a 256 "$T/tfplan" | cut -d' ' -f1)
   echo "s18_plan_sha256=$S"
   ```

   ```bash
   terraform -chdir="$T" apply -input=false -no-color \
     tfplan > "$L/s18-apply.log" 2>&1
   echo "s18_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s18-apply.log" \
     | sed 's/^/s18_apply_line=/'
   grep -E '^Error: ' "$L/s18-apply.log" \
     | sed 's/^/s18_error=/'
   rm -f "$T/tfplan"; echo "s18_plan_file_removed=yes"
   ```

5. Plan again (prints `s18_second_plan_exit=0` and a `No changes` line):

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s18-plan2.log" 2>&1
   echo "s18_second_plan_exit=$?"
   grep -n -E '^  # |^Plan:|^No changes' \
     "$L/s18-plan2.log" | sed 's/^/s18_plan2_line=/'
   ```

6. Part C, the read-back: Step 18 item 8 as the runbook gives it (expected: `s18_auth.mailer_otp_length=10` and `s18_auth.uri_allow_list=` naming the staging origin's `/auth/confirm` and `/*/auth/confirm`), then item 9, which removes the plan file and the logs and prints `s18_logs_removed=yes`.

The expected plan lines in item 3 are a reading of the module and the JSON, not of a plan; whoever reads the real lines reads them against Step 4's stop rules.

## Task 3: the two CI-only contestant readiness timeouts under CPU throttling (stopped: not reproduced)

```
DIAG_COPY=tmp/187-27/diag
FAILURE1_FIX_IN_HEAD=yes
FAILURE1_WITNESS_USES_ROUTE_UNTIL_ENDED=yes
FAILURE1_NO_PAGE_REQUEST_USES_ROUTE_UNTIL_ENDED=yes
FAILURE1_ESLINT_BAN=yes
FAILURE1_UNROUTE_RACE=13/600
FAILURE1_FALLBACK_RACE=0/600
FAILURE1_DIAGNOSIS_READINGS=unroute 6/600 and 1/300, fallback 0/600
CI_TRACE_CAND_HOME=goto at 0 s; the page's load ended and the data-next-step wait began at 2.16 s; the wait failed at 12.35 s (10.19 s later); the test's steps hold no focus-reset wait, so the trace cannot say whether the reset had landed
CI_TRACE_TERMS=goto at 0 s; terms-of-use-submit visible at 1.32 s; the box checked at 2.47 s; toBeEnabled of terms-of-use-submit began at 2.60 s and failed at 7.61 s (5.0 s later); the fixture CI ran has no focus-reset wait in open()
CI_CONTESTANT_SCAN_MARGINS=slowest passing contestant scans in CI, whole-test durations: cand-questions (dark) 19.2 s, cand-nominations (dark) 17.7 s, cand-question 17.2 s, cand-question (dark) 17.0 s, cand-questions 16.8 s, cand-nominations 16.7 s, cand-preview 16.4 s; cand-home passed in 12.7 s and failed in 13.4 s (dark); results.json carries no step timings, so the time each passing entry spent inside its 10 s wait is not readable
THROTTLE_MECHANISM=a temporary top-level test.beforeEach in the two specs: when E2E_DIAG_CPU_RATE is a number of at least 2, it opens a DevTools Protocol session for the test's page and sends Emulation.setCPUThrottlingRate with that rate, as eperm07-term-trigger.spec.ts's knob does for its own spec; the setup projects are unthrottled; the suite has no project-wide throttle
NEG_CONTROL_CAND_HOME_RATE4=passed (tests/e2e-runs/187-27-thr-a11y-r4-20261116T174957Z: 44 passed, 0 failed; cand-home 6.0 s, cand-home (dark) 6.0 s)
NEG_CONTROL_CAND_HOME_RATE6=passed (tests/e2e-runs/187-27-thr-a11y-r6-20261116T175341Z: 44 passed, 0 failed; cand-home 7.9 s, cand-home (dark) 7.9 s)
THROTTLED_TERMS_AT_HEAD_RATE4=passed (tests/e2e-runs/187-27-thr-terms-head-r4-20261116T175142Z: 6 passed)
THROTTLED_TERMS_AT_HEAD_RATE6=passed (tests/e2e-runs/187-27-thr-terms-head-r6-20261116T175530Z: 6 passed; the two terms tests 4.6 s each)
NEG_CONTROL_TERMS_RATE4=passed (tests/e2e-runs/187-27-thr-terms-mut-r4-20261116T175236Z: 6 passed; 2.5 s each)
NEG_CONTROL_TERMS_RATE6=passed (tests/e2e-runs/187-27-thr-terms-mut-r6-20261116T175626Z: 6 passed; 3.7 s each)
NEG_CONTROL_TERMS_RESTORED=yes
THROTTLE_REPRODUCES_CI=no
THROTTLE_PATCH_REVERTED=yes
TASK3_STOPPED=yes
```

How each line was read:

- **The copy.** The diagnosis directory was copied whole to `tmp/187-27/diag/` (`cp -R`, exit 0) before anything ran from it.
- **Failure 1.** `git merge-base --is-ancestor b64c1cf18 HEAD` exit 0 (`fix(e2e): end mid-test routes without turning request interception off`). In `tests/tests/fixtures/shared/invitationFlow.fixture.ts`, `witnessPageRequest` registers `addWitness` with `const endWitnessing = await routeUntilEnded(page, ACCOUNT_ACCESS_ROUTE, addWitness)` and calls `endWitnessing()`; `expectNoPageRequest` registers `count` with `routeUntilEnded` and calls `endCounting()`. Neither calls `unroute()`. `tests/eslint.config.mjs` forbids `CallExpression[callee.property.name=/^unroute(All)?$/]` with the message naming `routeUntilEnded`.
- **The harness.** The copied `scripts/race2.cjs`, in the background, 600 iterations in unroute mode and then 600 with its `flag` argument (the handler falls back once ended, as `routeUntilEnded` does). Unroute: `hung 13/600`, exit 0, at delays 0 (2), 1 (6), 2 (1), 4 (1) and 5 (3). Fallback: `hung 0/600`, exit 0. The race fires on about 1 to 2% of calls, so a green run cannot show it closed; the harness readings are its evidence, and the code is not changed.
- **CI's readings.** `scripts/act.py` over the three copied traces: `1c571c65…` is cand-home (dark), `b4a32f93…` is contestant-terms-gate-phone, `0d03b565…` is failure 1. Times are from each trace's own `before`/`after` records, relative to its `goto`. `scripts/res.py` over `art/results.json` for the margins.
- **The throttle.** The patch `tmp/187-27/throttle/throttle.patch` (14 added lines over the two specs) was applied with `git apply` for the six runs and reverted with `git apply -R`; `git diff --quiet HEAD -- tests` exit 0 afterwards. It was never committed. That the variable reached the test is shown by the durations: against the unthrottled closing run of 187-26 on this host (`tests/e2e-runs/187-26-close-20261116T083717Z`), cand-home went from 4.4 s to 6.0 s at rate 4 and 7.9 s at rate 6, cand-questions from 3.8 s to 10.3 s and 11.1 s, and the terms test from 1.5 to 1.9 s to 2.5 s and 4.6 s.
- **The controls** (`tmp/187-27/throttle/negctl.sh <rate>`, in the background; each run `E2E_DIAG_CPU_RATE=<rate> tests/scripts/e2e-run.sh --run-dir <dir> --no-db-reset --project <project>`). Every run's wrapper exited 0 with preflight successes 1 and failures 0, no `VOID-host-suspend.txt`, and `e2e-spec-verdict.mjs <dir> --no-flaky` exit 0. The terms mutation deleted the one line `      await waitForNavigationFocusReset(page);` from `open()` (count 1; diffstat `1 -`), which is the fixture CI ran; after each mutation run `git checkout --` of the fixture and `git diff --quiet` exit 0.
- **The result.** At rate 4 and at rate 6, neither control fails: cand-home's `data-next-step` wait holds within its 10 s, and with the hydration wait removed, terms-of-use-submit enables within 5 s. The slowest throttled run is still well inside CI's times (cand-home 7.9 s against CI's 12.7 to 13.4 s; the terms test 3.7 s against CI's failure at 7.6 s). By the plan, `THROTTLE_REPRODUCES_CI=no`: the cause stays unconfirmed on this host, the patch is reverted, Task 3 stops, and no fix is committed. Browser CPU throttling slows only the page's own script; on CI's 4-CPU runner the dev server, the database and six workers share the CPU as well, and that part is not modelled here. The readings above are put to the operator.
