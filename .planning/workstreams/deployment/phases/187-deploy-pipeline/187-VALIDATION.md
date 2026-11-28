---
phase: "187"
slug: "deploy-pipeline"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-15"
audited: "2026-11-21"
---

# Phase 187 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Seeded from `187-RESEARCH.md` § Validation Architecture (reproduced below); the planner fills the per-task map.

---

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (root catalog), with `infra/vitest.config.ts` collecting `scripts/**/*.test.ts`; Terraform 1.16.5 `terraform test`; actionlint 1.7.12 |
| Config file | `infra/vitest.config.ts` (exists); `*.tftest.hcl` per module or root |
| Quick run command | `yarn test:unit:infra` (or `yarn test:unit:infra workflows`) |
| Full suite command | `yarn test:unit && yarn lint:check && yarn format:check && yarn lint:workflows`, plus the infra-validate loop locally, plus `terraform test` in each `infra/envs/example/*`, plus the one closing `tests/scripts/e2e-run.sh` run |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| PIPE-01 | Deploy policies hold the needed actions, no `iam:Create*/Put*/Attach*/Delete*`, every policy ≤ 6,144 non-whitespace chars, `ecr:DescribeImages` present, `plan_lock` gone | tf unit | `terraform -chdir=infra/modules/github-oidc test` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-01 | bootstrap tfvars set both numeric ids and the `staging-destroy` subject | unit | `yarn test:unit:infra workflows` (or a bootstrap tfvars test) | ✅ | ✅ green (run 2026-11-21) |
| PIPE-01 | The wrong subject is refused | manual-only (needs GitHub) | the `infra-plan.yml` wrong-subject job on the H8 push | — | manual (run 44088753527, `wrong-subject` success, both roles `AccessDenied`) |
| PIPE-02 | Every root formatted and validated; PR plan job shape | unit + CI | the infra-validate loop; `workflows.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-03 | Credentialed jobs carry the fork `if:`; no `pull_request_target` | unit | `yarn test:unit:infra workflows` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-04 | `environment:` on the apply jobs; concurrency group `staging-aws`, `cancel-in-progress: false`; `timeout-minutes` set | unit | same | ✅ | ✅ green (run 2026-11-21) |
| PIPE-05 | Image by digest; `image_digest` regex refuses a tag, upper case or empty | tf unit | `terraform -chdir=infra/modules/frontend-service test` (rewrite the 3 `image_tag_refuses_*` runs) | ✅ | ✅ green (run 2026-11-21) |
| PIPE-05 | Build context excludes an ignored file | script self-test | `yarn test:unit:infra build-push-image` (new case name asserted) | ✅ | ✅ green (run 2026-11-21) |
| PIPE-06 | Step order: build → plan → migrations → functions → apply → stable → smoke; failure alert last | unit | `yarn test:unit:infra workflows` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-06 | `--confirmed-ref` refusals (mismatch, not Actions, wrong environment value) exit 2 before the CLI | unit | `yarn test:unit:infra push-migrations` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-07 | The smoke step has `SMOKE_EXPECTED_SHA`, no `SUPABASE_SERVICE_ROLE_KEY`/`SECRET_KEY` anywhere, no `DEV_SEED_ALLOW_REMOTE` | unit | `yarn test:unit:infra workflows`; existing `deployedSmokeGuards.test.ts` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-08 | The destroy workflow names only `infra/envs/staging/aws` for plan/apply; no Supabase secret; refusal step present | unit | `yarn test:unit:infra workflows` | ✅ | ✅ green (run 2026-11-21) |
| PIPE-09 | Red commit fails `vite build` locally | local proof | `git archive <red> \| tar -x` + `docker buildx build --target production` → non-zero | ✅ | ✅ green (recorded: `RED_LOCAL_BUILD_EXIT=1` in `187-12-evidence-commits.md`; hosted red run 44088753181) |
| PIPE-10 | No `push` trigger of deploy/destroy matches `main`; branch list exact; `!deploy-evidence/destroy-staging` | unit | `yarn test:unit:infra workflows` | ✅ | ✅ green (run 2026-11-21) |
| INFRA-16 | The `if: failure() \|\| cancelled()` publish step is the last step and names the topic | unit | same | ✅ | ✅ green (run 2026-11-21) |
| INFRA-19 | Three example roots mock-plan; floor 2, ceiling 4, two zones | tf unit | `terraform -chdir=infra/envs/example/<r> test -verbose` | ✅ | ✅ green (run 2026-11-21) |
| INFRA-19 | No workflow runs `apply`/`destroy` outside `infra/envs/staging/aws` | unit | `yarn test:unit:infra workflows` | ✅ | ✅ green (run 2026-11-21) |
| SUPA-08 | No `upload-artifact`; plan file only under `$RUNNER_TEMP`; actions SHA-pinned; `permissions: {}` at top; `persist-credentials: false` | unit + lint | `yarn test:unit:infra workflows`; `yarn lint:workflows` | ✅ | ✅ green (run 2026-11-21) |

### Sampling Rate
- **Per task commit:** `yarn test:unit:infra` plus the touched module's or root's `terraform test`, plus `yarn lint:workflows` when a workflow changed.
- **Per wave merge:** `terraform fmt -check -recursive infra`, the infra-validate loop, `yarn test:unit`.
- **Phase gate:** `yarn test:unit`, `yarn lint:check`, `yarn format:check`, `yarn lint:workflows`, and one full `tests/scripts/e2e-run.sh` run, all green before `/gsd-verify-work`. The outward observations (H-steps) are evidence files, not automated gates.

### Wave 0 Gaps
- [x] `infra/modules/github-oidc/tests/github_oidc.tftest.hcl`: real provider offline (fake keys and skips) for plan-time JSON.
- [x] `infra/envs/example/{aws,dns-mail,supabase}/tests/plan.tftest.hcl`, with the infra-plan.yml loop that runs them; infra-validate's loop does not reach roots.
- [x] `infra/scripts/workflows.test.ts`, plus `js-yaml` in root devDependencies.
- [x] `infra/scripts/push-migrations.test.ts`.
- [x] Root script `lint:workflows`.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 187-01-T1 | 01 | 1 | INFRA-16, PIPE-01 | T-187-01 | `sns:Publish` on the one topic only | tf unit | `terraform -chdir=infra/modules/github-oidc test` + bootstrap validate | ❌ W0 (new test file) | ✅ green (run 2026-11-21) |
| 187-01-T2 | 01 | 1 | PIPE-01 | — | only public values in tracked tfvars | grep + validate | `grep -qE '^deploy_hosted_zone_id' infra/bootstrap/terraform.tfvars` + validate | ✅ | ✅ green (grep + validate, run 2026-11-21) |
| 187-01-T3 | 01 | 1 | PIPE-01, PIPE-05, PIPE-06 | T-187-01, T-187-02, T-187-03 | no iam action but PassRole; no state/secret reads; DNS scope | tf unit | module test (8 runs) + `assert-no-inline-iam-policies.mjs --self-test` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-02-T1 | 02 | 1 | PIPE-05 | T-187-04 | digest form validated | tf unit | `terraform -chdir=infra/modules/frontend-service test` | ✅ (update) | ✅ green (run 2026-11-21) |
| 187-02-T2 | 02 | 1 | PIPE-05 | T-187-04 | no image value in tfvars | validate + grep | example validate + `! git grep -q -e '^image_tag *=' ... -- infra/envs` | ✅ | ✅ green (grep + validate, run 2026-11-21) |
| 187-03-T1 | 03 | 1 | PIPE-05 | T-187-06 | ignored file absent from context | script self-test | `vitest run --config infra/vitest.config.ts build-push-image` | ✅ (extend) | ✅ green (run 2026-11-21) |
| 187-03-T2 | 03 | 1 | PIPE-05 | T-187-07 | contract documented | help + unit | `build-push-image.sh --help` + vitest | ✅ | ✅ green (run 2026-11-21) |
| 187-04-T1 | 04 | 1 | PIPE-06 | T-187-08 | `--confirmed-ref` refused outside a staging Actions job | unit | `vitest run --config infra/vitest.config.ts push-migrations` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-04-T2 | 04 | 1 | PIPE-06 | T-187-09 | — | docs + unit | prettier on the runbook + vitest | ✅ | ✅ green (prettier of the runbooks run 2026-11-21; greps recorded in SUMMARY) |
| 187-05-T1 | 05 | 2 | PIPE-01, PIPE-02, PIPE-08 | T-187-10, T-187-11 | id conditions; plan role read-only | unit + tf unit | `vitest ... bootstrap-tfvars` + module test | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-05-T2 | 05 | 2 | PIPE-01, SUPA-08 | T-187-12 | Step 9 stop rules before apply | docs | prettier + named-line greps | ✅ | ✅ green (prettier of the runbooks run 2026-11-21; greps recorded in SUMMARY) |
| 187-06-T1 | 06 | 2 | PIPE-05 | T-187-13 | image field only | unit | `vitest ... running-image-digest` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-06-T2 | 06 | 2 | PIPE-05 | T-187-14 | — | docs + grep | prettier + `grep -c 's/^image_tag'` == 0 | ✅ | ✅ green (grep + validate, run 2026-11-21) |
| 187-07-T1 | 07 | 2 | INFRA-19 | T-187-15 | mocks only, account guard intact | tf mock plan | `terraform -chdir=infra/envs/example/aws test -verbose` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-07-T2 | 07 | 2 | INFRA-19, PIPE-02 | T-187-15 | — | tf mock plan | three example roots `test -verbose` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-08-T1 | 08 | 3 | PIPE-02, INFRA-19, SUPA-08 | T-187-16, T-187-17, T-187-18 | shared rules red on mutated copies | unit + lint | `vitest ... infra-plan-workflow` + actionlint container | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-08-T2 | 08 | 3 | PIPE-01, PIPE-02, PIPE-03 | T-187-16, T-187-19, T-187-20 | fork skip; `-lock=false`; token masked | unit + lint | same | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-09-T1 | 09 | 4 | PIPE-04, PIPE-05, PIPE-07, PIPE-10, INFRA-16, SUPA-08 | T-187-21, T-187-22, T-187-23, T-187-25, T-187-26 | gate, order, no smoke secrets, no upload, alert last | unit + lint | `vitest ... deploy-workflow` + actionlint + `deployedSmokeGuards` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-09-T2 | 09 | 4 | PIPE-06 | T-187-22, T-187-24 | Supabase secrets in three steps only | unit + lint | same | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-10-T1 | 10 | 4 | PIPE-08 | T-187-28 | delete-only, in-module, count equal | unit | `vitest ... check-destroy-plan` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-10-T2 | 10 | 4 | PIPE-08, PIPE-04, PIPE-10 | T-187-27, T-187-29 | no secret; one root; two approvals | unit + lint | `vitest ... destroy-workflow` + actionlint | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-11-T1 | 11 | 5 | PIPE-10, INFRA-19, PIPE-01 | T-187-30, T-187-32 | no apply outside staging/aws; no `main`; ARN non-vacuous | unit + lint | `vitest ... workflows` + `yarn lint:workflows` | ❌ W0 | ✅ green (run 2026-11-21) |
| 187-11-T2 | 11 | 5 | SUPA-08, PIPE-10 | — | settings documented | docs | prettier + heading/phrase greps | ✅ | ✅ green (prettier of the runbooks run 2026-11-21; greps recorded in SUMMARY) |
| 187-11-T3 | 11 | 5 | PIPE-07, SUPA-08 | T-187-31 | exact-path exclusions only | docs + grep | prettier + `grep -qxF` of both exclusions | ✅ | ✅ green (grep + validate, run 2026-11-21) |
| 187-12-T1 | 12 | 6 | SUPA-08, INFRA-19 | — | — | repo gates | `lint:check`, `format:check`, `test:unit`, `lint:workflows`, infra loops (evidence lines) | ✅ | ✅ green (recorded: `evidence/187-12-final-gates.md`) |
| 187-12-T2 | 12 | 6 | PIPE-05 | T-187-33 | no `.planning/` path | local build | green archive build exit 0 (evidence + ref checks) | ✅ | ✅ green (recorded: `evidence/187-12-evidence-commits.md` `GREEN_LOCAL_BUILD_EXIT=0`) |
| 187-12-T3 | 12 | 6 | PIPE-09 | T-187-34 | red fails at the frontend build | local build | red archive build non-zero (evidence + ref checks) | ✅ | ✅ green (recorded: red build exit 1 in the frontend build, `evidence/187-12-evidence-commits.md`) |
| 187-13-T1 | 13 | 7 | PIPE-07 | T-187-35 | void run never counted | E2E | `D=$(sed -n 's/^E2E_RUN_DIR=//p' "$E"); test -d "$D" && test ! -e "$D/VOID-host-suspend.txt" && node tests/scripts/e2e-spec-verdict.mjs "$D" --no-flaky` | ✅ | ✅ green (recorded: `evidence/187-13-closing-e2e.md`, 548 passed, `E2E_VERDICT_EXIT=0`, no void marker) |
| 187-13-T2 | 13 | 7 | SUPA-08 | T-187-36, T-187-66 | no address in the handoff; no hosted or remote read; 186-08's plan changed by the note only | record | handoff lines against `186-08-readiness.md` + address search + the note in `186-08-PLAN.md` (0 deleted lines against `NOTE_BASE_BLOB=`, `verify.plan-structure` exit 0) | ✅ | ✅ green (recorded: `HANDOFF_STATUS=closed` in `evidence/187-13-186-08-handoff.md`) |
| 187-14-T1..T3 | 14 | 8 | PIPE-04, PIPE-10, PIPE-08, SUPA-08 | T-187-37, T-187-38, T-187-39 | gate exists before any push; bypass off; names only | manual (H2, H3) + read-back | `gh api` GET lines in `187-14-environments.md` | ✅ | manual (evidence) |
| 187-15-T1..T3 | 15 | 9 | SUPA-08, PIPE-02 | T-187-40, T-187-41 | covered source-only tree; findings by file only | manual (H4b) + CI | job-level conclusions in `187-15-ci-evidence.md` | ✅ | manual (evidence) |
| 187-16-T1..T3 | 16 | 9 | PIPE-01, PIPE-06, PIPE-08, INFRA-16, SUPA-08 | T-187-42, T-187-43, T-187-44 | simulator refusals before apply | manual (H1) | `s9` lines in `187-16-bootstrap-apply.md` | ✅ | manual (evidence) |
| 187-17-T1..T3 | 17 | 9 | PIPE-07, SUPA-08 | T-187-45, T-187-46 | names only, keychain never read with `-w` | manual (H9) | lines in `187-17-smoke-contestant.md` | ✅ | manual (evidence) |
| 187-26-T1..T7 | 26 | 10 | SUPA-08, PIPE-02, PIPE-06 | T-187-67 to T-187-73 | the developer's functions env never read and always restored; findings by location only; push only while the standing conditions hold | local scan + unit + E2E + manual (H4b) + CI | lines in `187-26-ci-closure.md`; job-level conclusions | ✅ | manual (evidence + CI job conclusions) |
| 187-27-T1..T8 | 27 | 11 | SUPA-08, PIPE-02, PIPE-06 | T-187-74 to T-187-83 | the developer's functions env never read and always restored; no hosted read or write; throttle and negative-control mutations never committed; push only while the standing conditions hold | gates + db + local scan + throttled E2E controls + full E2E + manual (H4b) + CI | lines in `187-27-ci-closure.md`; job-level conclusions | ✅ | manual (evidence + CI job conclusions) |
| 187-28-T1..T5 | 28 | 12 | SUPA-08, PIPE-02, PIPE-06 | T-187-84 to T-187-89 | the developer's functions env never read and always restored; no file outside .planning/ changed; findings by location only; no CI job re-run; push only while the standing conditions hold | gates + local scan + full E2E + manual (H4b) + CI | lines in `187-28-ci-closure.md`; job-level conclusions | ✅ | manual (evidence + CI job conclusions) |
| 187-29-T1..T7 | 29 | 13 | PIPE-09, PIPE-01, INFRA-16, INFRA-19, PIPE-04, PIPE-02, PIPE-05, PIPE-06, PIPE-07, PIPE-08 | T-187-90 to T-187-96 | every status-reading step runs under bash -e to its own diagnosis, and an unread status still ends its step; the harness reaches no host command or credential; the wrong-subject pass condition unchanged; no hosted write; nothing re-run | unit (red first) + lint + gates + local build + local scan + manual (H8) + run | `vitest ... workflow-errexit`; lines in `187-29-red-rerun.md` | ✅ | ✅ green unit (`workflow-errexit`, run 2026-11-21) + manual (H8 evidence, run 44088753181) |
| 187-30-T1..T5 | 30 | 14 | PIPE-09, PIPE-05, PIPE-06, INFRA-16 | — | every root lock carries one h1 hash per provider for linux_arm64 as well as the other three platforms; an ARM job never initialises a root whose lock lacks it | unit (red first) + lint + manual push | `vitest run --config infra/vitest.config.ts workflows` (rules `arm-lock`, `lock-platforms`); lines in `187-30-arm64-lock.md` | ✅ | ✅ green unit (run 2026-11-21; red at start recorded `ARM_LOCK_RED_AT_START=2`, `ARM_LOCK_GREEN=yes`) + manual (evidence) |
| 187-31-T1..T4 | 31 | 15 | PIPE-06, PIPE-09, PIPE-05, INFRA-16 | — | the stable step reads the rollout at most 60 times 15 s apart and re-reads only IN_PROGRESS on the applied task definition; every other outcome decides at once | unit (red first) + lint + manual push | `vitest run --config infra/vitest.config.ts workflow-errexit deploy-workflow` (rule `rollout-poll`, five stable-step cases); lines in `187-31-stable-poll.md` | ✅ | ✅ green unit (run 2026-11-21) + manual (evidence: attempt 4, run 44270824581 success) |
| 187-18-T1..T3 | 18 | 14 | PIPE-09, PIPE-01, PIPE-04, INFRA-16, INFRA-19, PIPE-02 | T-187-47, T-187-48, T-187-49 | no hosted write; branch subject refused | manual (H8) + run | lines in `187-18-red-run.md`; alert mail human-check | ✅ | manual (evidence) |
| 187-19-T1..T3 | 19 | 15 | PIPE-02, INFRA-19, PIPE-01, SUPA-08 | T-187-50, T-187-51 | no artifact; pr-evidence names trigger no push | manual (H5) + run | lines in `187-19-pr-plan.md` | ✅ | manual (evidence) |
| 187-20-T1..T3 | 20 | 16 | PIPE-03 | T-187-52 | fork job skipped, no assume step | manual (H6) + run | lines in `187-20-fork-pr.md` | ✅ | manual (evidence) |
| 187-21-T1..T3 | 21 | 16 | PIPE-09, PIPE-04, PIPE-05, PIPE-06, PIPE-07, PIPE-10, SUPA-08 | T-187-53, T-187-54, T-187-55 | covered tree; migrations listed before approval | manual (H4, H7) + run | lines in `187-21-green-run.md` | ✅ | manual (evidence) |
| 187-22-T1..T3 | 22 | 17 | PIPE-10, PIPE-05, PIPE-04 | T-187-56, T-187-57 | `main` not admitted; image reused | manual (H4) + run | lines in `187-22-deploy-staging.md` | ✅ | manual (evidence) |
| 187-23-T1..T3 | 23 | 18 | PIPE-08, PIPE-04 | T-187-58, T-187-59 | Supabase root refused; apply rejected | manual + run | lines in `187-23-destroy-plan.md` | ✅ | manual (evidence) |
| 187-24-T1..T3 | 24 | 19 | PIPE-08 | T-187-60, T-187-61, T-187-62 | other roots unchanged | manual (H10) + run | lines in `187-24-destroy.md` (on or after 2026-11-23) | ✅ | manual (evidence) |
| 187-25-T1..T3 | 25 | 20 | PIPE-08, PIPE-06, INFRA-16, PIPE-01 | T-187-63, T-187-64, T-187-65 | Supabase untouched before redeploy; subscription confirmed | manual (H10) + run | lines in `187-25-redeploy.md` | ✅ | manual (evidence) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

Every outward action in `187-DISCUSSION-POINTS.md` section H (H1–H10) is an operator checkpoint, observed and recorded by hand.

| Outward action | Plan | Observed as |
|----------------|------|-------------|
| H2, H3 environments, secrets, variables | 187-14, 187-17 (contestant secrets) | `gh api` read-backs, names only |
| H4b `ci-evidence/187-final`, `ci-evidence/187-final-2`, `ci-evidence/187-final-3` and `ci-evidence/187-final-4` (secret-scan, infra-validate, dependency-audit, the module validation, the E2E jobs) | 187-15, 187-26, 187-27, 187-28 | job-level conclusions |
| H1 bootstrap hand apply | 187-16 | Step 9 `s9` lines pasted by the operator |
| H9 plan 186-08's sitting | 187-17 | 186-08's own evidence |
| H8 red run and its alert mail | 187-18, 187-29 (the re-run on `deploy-evidence/187-red-2`) | run steps; mail arrival as an end-of-phase human check |
| H5 draft pull request plan | 187-19 | the plan job's log and summary |
| H6 fork pull request | 187-20 | the plan job skipped |
| H4/H7 green run, then `deploy/staging` | 187-21, 187-22 | stage-by-stage step conclusions |
| plan-only destroy evidence run | 187-23 | plan job approved, apply job rejected |
| H10 real destroy and redeploy (on or after 2026-11-23) | 187-24, 187-25 | empty state, Supabase plan `No changes`, probe, subscription confirmed |
| A manual dispatch of `deploy.yml` | after the stream merges | GitHub offers dispatch only once the workflow is on the default branch (`DISPATCH_OBSERVABLE=after-merge`, plan 187-22). Note, 2026-11-20: re-targeted from phase 189, which closes before the merge and so cannot observe the dispatch (plan 189-19) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (each new test file is created by the task that first runs it)
- [x] No watch-mode flags
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** reconciled 2026-11-21 against `187-VERIFICATION.md` (status passed, 12/12) and the evidence files

---

## Validation Audit 2026-11-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |

Reconcile mode: no test or source file written, no auditor spawned. Plans 187-30 and 187-31 had no row and were added from their PLAN and SUMMARY. Run on HEAD `6c7fe7801`, each status read directly, not through a pipe:
- `node_modules/.bin/vitest run --config infra/vitest.config.ts` (= `yarn test:unit:infra`): exit 0, 17 files, 458 passed (it includes `workflows`, `deploy-workflow`, `destroy-workflow`, `infra-plan-workflow`, `workflow-errexit`, `push-migrations`, `check-destroy-plan`, `running-image-digest`, `bootstrap-tfvars`, `build-push-image`)
- `node scripts/lint-workflows.mjs` (= `yarn lint:workflows`): exit 0, actionlint found nothing in 3 workflows
- `terraform test` with mock providers: `infra/modules/github-oidc` exit 0 (11 passed), `infra/modules/frontend-service` exit 0 (38 passed), `infra/envs/example/{aws,dns-mail,supabase}` exit 0 (1 passed each)
- `terraform fmt -check -recursive infra`: exit 0
- `node scripts/assert-no-inline-iam-policies.mjs --self-test`: exit 0; `build-push-image.sh --help`: exit 0
- `grep -qE '^deploy_hosted_zone_id' infra/bootstrap/terraform.tfvars`: exit 0; `git grep -q -e '^image_tag *=' -- infra/envs`: exit 1 (absent); `upload-artifact` in the three workflows: 0
- `prettier --check` of `infra/README.md`, `infra/bootstrap/README.md`, `infra/envs/staging/aws/README.md`, `infra/envs/staging/supabase/README.md`: exit 0

Rows marked manual are outward actions (GitHub environments, bootstrap hand apply, pipeline runs on `deploy-evidence/**` and `deploy/staging`, the fork PR, the destroy and the redeploy, the CI evidence branches). They are backed by the run ids `187-VERIFICATION.md` re-read with `gh run view` (44270824581, 44276384977, 44285713407, 44088753181, 44088753527, 44042442257, 44104573552, 44124810789; CI 44033456141) and were not re-run. The smoke step's red is code- and test-guarded, not observed (VERIFICATION note B); the roadmap's red run is the broken build, observed. A manual dispatch of `deploy.yml` stays in Manual-Only, observable only after the merge.
