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

