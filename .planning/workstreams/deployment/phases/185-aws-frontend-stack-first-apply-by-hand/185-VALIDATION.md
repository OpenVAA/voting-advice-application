---
phase: "185"
slug: "aws-frontend-stack-first-apply-by-hand"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-12"
audited: "2026-11-21"
---

# Phase 185 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend `vitest run`; infra `infra/vitest.config.ts`); Terraform `fmt`/`validate`; Node `assert:*` guards; Playwright E2E |
| **Config file** | `apps/frontend/vitest.config.ts`, `infra/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit -- src/routes/api/diagnostics src/lib/server/startup` |
| **Full suite command** | `yarn lint:check && yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-final --no-db-reset` |
| **Estimated runtime** | ~30 seconds (quick); full suite several minutes |

---

## Sampling Rate

- **After every task commit:** the quick vitest command for touched files, plus `terraform fmt -check` / `validate` for touched roots
- **After every plan wave:** `yarn lint:check` (includes the IAM guard) and `yarn test:unit` (needs the local stack up)
- **Before `/gsd-verify-work`:** a full green, non-void E2E run after the last code change
- **Max feedback latency:** 60 seconds (quick command)

---

## Per-Task Verification Map

Built from the 22 PLANs and SUMMARYs at the audit of 2026-11-21 (the planner's seed rows and plan-to-check map are folded in). Terraform commands carry the `TF_PLUGIN_CACHE_DIR` export of their plans, left out here.

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 185-01-T1 | 01 | 1 | INFRA-11 | Execution role home, push and alert address decided | decision + grep | `grep -c 'module "github_oidc"' infra/bootstrap/main.tf` | ✅ | ✅ green (recorded) |
| 185-01-T2 | 01 | 1 | INFRA-11, INFRA-05 | Execution role module from bootstrap; managed policies only | smoke + guard | module + bootstrap `init -backend=false` + `validate` · `assert-no-inline-iam-policies.mjs` and `--self-test` | ✅ | ✅ green |
| 185-01-T3 | 01 | 1 | INFRA-05 | Bootstrap inputs, output and runbook Step 8 | smoke + docs check | bootstrap validate · tfvars and README greps | ✅ | ✅ green |
| 185-02-T1 | 02 | 1 | INFRA-05, OBS-08 | Task env ⊇ `REQUIRED_ENV`, ⊆ `.env.example`, no service-role key | unit (TDD) | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts` | ✅ | ✅ green |
| 185-02-T2 | 02 | 1 | INFRA-05 | Guard seen red on the real test path | red control | `red_missi…` lines in `evidence/185-02-guard-red.md` | ✅ | ✅ green (recorded) |
| 185-03-T1 | 03 | 1 | INFRA-09 | SIGTERM and `sveltekit:shutdown` each one line, once | unit (TDD) | `yarn workspace @openvaa/frontend test:unit src/lib/server/shutdown/shutdownLog.test.ts src/lib/server/startup` | ✅ | ✅ green |
| 185-03-T2 | 03 | 1 | OBS-04 | Allow-list adds the two CloudFront headers; never echoes the origin secret or a cookie | unit (TDD) | `yarn workspace @openvaa/frontend test:unit src/routes/api/diagnostics` | ✅ | ✅ green |
| 185-03-T3 | 03 | 1 | INFRA-09, OBS-04 | Both on the production build; voter-journey E2E | built server + E2E | `evidence/185-03-built-server.md` · `tests/e2e-runs/185-03-20261112T165725Z`, `VERDICT OK: 4 tests` | ✅ | ✅ green (recorded) |
| 185-04-T1 | 04 | 2 | INFRA-02, 04, 06, 08, 09, 11 | Serving path explicit; offline test | terraform test (mock providers) + guard | `terraform -chdir=infra/modules/frontend-service test` · `assert-no-inline-iam-policies.mjs` | ✅ | ✅ green |
| 185-04-T2 | 04 | 2 | INFRA-05, INFRA-10 | Staging root calls the module; lock pins aws 6.68.0; tfvars names equal the list | smoke | staging/aws `init -backend=false -lockfile=readonly` + `validate` · key comparison | ✅ | ✅ green |
| 185-05-T1 | 05 | 1 | INFRA-01 | Build-and-push refuses a dirty tree, a non-commit, `.planning/`, an unpushed head, a foreign account | unit | `node_modules/.bin/vitest run --config infra/vitest.config.ts build-push-image` · `bash -n` | ✅ | ✅ green |
| 185-05-T2 | 05 | 1 | INFRA-09 | Request loop | unit | `… --config infra/vitest.config.ts request-loop` · `yarn test:unit:infra` · coverage guard | ✅ | ✅ green |
| 185-06-T1 | 06 | 3 | INFRA-03, INFRA-14 | CDN, viewer certificate, apex records | terraform test + root validate | module `test` · staging/aws validate | ✅ | ✅ green |
| 185-06-T2 | 06 | 3 | INFRA-07, 12, 13 | Scaling, deployment alert, ceiling 2 | terraform test + guard | module `test` · staging validate · `task_ceiling = 2` grep · IAM guard | ✅ | ✅ green |
| 185-07-T1 | 07 | 4 | INFRA-02, INFRA-10 | Example root with stand-ins, byte-equal variables and outputs | smoke | example/aws validate · `cmp` of `variables.tf` and `outputs.tf` | ✅ | ✅ green |
| 185-07-T2 | 07 | 4 | INFRA-10 | `infra-validate` runs every module test; every root validates | CI-equivalent loop | `fmt -check -recursive` · every root validate · every module `test` · workflow greps | ✅ | ✅ green |
| 185-08-T1–T2 | 08 | 5 | INFRA-12, INFRA-10 | Runbook frame and steps 1 to 6; `infra/README.md` regions | docs check | heading and negated greps over the two READMEs | ✅ | ✅ green (recorded) |
| 185-08-T3 | 08 | 5 | OBS-08 | Guard reads the runbook table and both AWS roots | unit (TDD) | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts` | ✅ | ✅ green |
| 185-09-T1–T2 | 09 | 6 | INFRA-07, 09, 13, 14, OBS-04, 06, 10, SUPA-12 | Runbook steps 7 to 18 | docs check | heading loop over `infra/envs/staging/aws/README.md` | ✅ | ✅ green (recorded) |
| 185-10-T1–T2 | 10 | 7 | INFRA-05, INFRA-11 | Seven gates on one code tree `633d09151` | full gates | `evidence/185-10-code-gates.md` | ✅ | ✅ green (recorded) |
| 185-11-T1–T3 | 11 | 8 | INFRA-05, INFRA-11 | Two SecureString parameters; execution role applied and read back | operator sitting + record check | `attempt.sh bound 185-11-*`; `evidence/185-11-parameters-and-role.md` | — | manual (evidence) |
| 185-12-T1–T2 | 12 | 9 | INFRA-01 | Image tagged by commit; second push refused | hosted (ECR) + record check | `SECOND_PUSH_EXIT=1` in `evidence/185-12-image.md` | — | manual (evidence) |
| 185-13-T1–T3 | 13 | 10 | INFRA-01, 02, 03, 05, 10, 13 | First apply; site through the CDN; subscription and cost tags | hand apply + operator | `FIRST_APPLY_EXIT=0`, `SUBSCRIP…` lines in `evidence/185-13-first-apply.md` | — | manual (evidence) |
| 185-14-T1–T3 | 14 | 11 | INFRA-03, 04, 06, 08, 10–14, OBS-08 | Certificates, redirect, voter page, form post, caching, network, tags, logs, state lock | hosted reads + record check | `evidence/185-14-served-stack.md` | — | manual (evidence) |
| 185-15-T1–T3 | 15 | 12 | OBS-04, INFRA-06, 11, 03 | Header record and depth; both locks refusing; diagnostics off | hosted reads + record check | `evidence/185-15-headers-and-locks.md` | — | manual (evidence) |
| 185-16-T1–T3 | 16 | 13 | INFRA-05, 09, 04 | Failed rollout rolls back; alert mail; restore; stop signal | hand apply + operator mailbox | `ROLLBACK=yes` etc. in `evidence/185-16-rollout-alert-signal.md` | — | manual (evidence) |
| 185-17-T1–T2 | 17 | 14 | INFRA-07, INFRA-09 | Scheduled pair raises the floor; count within bounds | hand apply + record check | `PAIR_APPLY_E…` lines in `evidence/185-17-scaling.md` | — | manual (evidence) |
| 185-18-T1–T3 | 18 | 15 | OBS-10, OBS-06, INFRA-14 | Feedback limit per client on two networks; invitation mail signs in | operator sitting + mailbox | `AGENT_INSERT_HTTP=201` etc. in `evidence/185-18-feedback-and-invitation.md` | — | manual (evidence) |
| 185-19-T1–T2 | 19 | 16 | SUPA-12, INFRA-10, INFRA-08 | Destroy removes the stack; Supabase untouched; residue ruled | hand destroy + record check | `DESTROY_EXIT=0` in `evidence/185-19-before-and-destroy.md` | — | manual (evidence) |
| 185-20-T1–T3 | 20 | 17 | SUPA-12, INFRA-10 | Supabase plan "No changes" and probe PASS after destroy; reapply 40 added | hand apply + operator | `REAPPLY_EXIT=0` in `evidence/185-20-after-and-reapply.md` | — | manual (evidence) |
| 185-21-T1 | 21 | 18 | INFRA-05, INFRA-11 | Three gates on the final tree | full gates | `evidence/185-21-final-gates.md` | ✅ | ✅ green (recorded) |
| 185-21-T2 | 21 | 18 | all | Closing full E2E | E2E | `evidence/185-21-closing-e2e.md`: `E2E_GATE=green`, 548/548, not void | ✅ | ✅ green (recorded) |
| 185-22-T1–T2 | 22 | 18 | INFRA-13 | Priced inventory 50.78 USD/month; seven-day window decision | hosted read + decision | `COST_INVENTORY…`, `COST_RULING=follow-up` in `evidence/185-22-cost.md` | — | manual (evidence) |
| 185-22-T3 | 22 | 18 | INFRA-13 | Monthly estimate measured on the applied stack | hosted read (Cost Explorer) | `COST_MEASURED_USD_MONTH=36.96` (`COST_MEASURED_WITH_UNTAGGED_IPV4_USD_MONTH=44.26`), read `2026-11-18T11:58Z` over a two-day window under the operator's short-window ruling, in `evidence/185-22-cost.md`; todo `.planning/todos/completed/2026-11-14-measure-the-staging-aws-stack-monthly-cost.md` | — | manual (evidence) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · manual (evidence): hosted or operator-only, backed by the named lines in `evidence/185-NN-*.md` · escalated: not observed, carried by an operator ruling*

The standalone `terraform -chdir=infra/modules/frontend-service validate` in the verify of plans 185-04 and 185-06 exits 1 on 1.16.5 with "Provider configuration not present" for `aws.us_east_1` (the module declares `configuration_aliases`). The module is covered by its `terraform test` (38 passed) and by the validate of the staging and example AWS roots that pass the alias; CI runs those, not the standalone validate. Not a gap; the plan text is stale.

---

## Wave 0 Requirements

- [x] `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` — the D-13 guard
- [x] `apps/frontend/src/lib/server/<shutdown module>.test.ts` — the D-16 lines
- [x] Extend `apps/frontend/src/routes/api/diagnostics/server.test.ts` for the two new names and the secret header's absence
- [x] `infra/envs/staging/aws/README.md` runbook with "Not yet observed" / "Observations" (D-24)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hosted behaviours of the applied stack (HTTPS, redirect, cert, rollback, SIGTERM, autoscaling, CDN caching, logs, destroy/reapply, cost tags/estimate) | INFRA-01, 03, 04, 06–09, 12–14, SUPA-12, OBS-10 | Observed on the applied AWS stack, by design | Runbook steps in `infra/envs/staging/aws/README.md`, each with exit status and evidence file |
| Invitation mail via real SMTP arrives with staging origin and signs in | OBS-06 | Requires reading a real mailbox | Runbook step; record observation with date (185-18, 2026-11-14) |
| Monthly cost estimate measured on the applied stack | INFRA-13 | Cost Explorer needs seven full days of the applied stack | Observed 2026-11-18: 36.96 USD/month (44.26 with untagged IPv4), two-day window under the operator's short-window ruling, `evidence/185-22-cost.md` (the 2026-11-14 ruling `COST_RULING=follow-up` deferred it; plan 189-19 closed the todo) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (operator tasks verify the record lines of their evidence file)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (each hosted plan ends in a record-check verify)
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter: the INFRA-13 measured estimate (185-22-T3) was observed on 2026-11-18 (`evidence/185-22-cost.md`)

**Approval:** reconciled by validate-phase audit, 2026-11-21

---

## Validation Audit 2026-11-21

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 (INFRA-13 measured monthly estimate: observed 2026-11-18, `evidence/185-22-cost.md`) |
| Escalated | 0 |
| Rows green | 22 |
| Rows manual (evidence) | 12 |

Reconcile mode: no test or source file was written, and no auditor was spawned. Re-run now on HEAD `6c7fe7801`, each status read from a file:
- `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts src/lib/server/shutdown/shutdownLog.test.ts src/routes/api/diagnostics src/routes/api/health`: exit 0, 4 files, 49 tests passed
- `node_modules/.bin/vitest run --config infra/vitest.config.ts build-push-image request-loop`: exit 0, 2 files, 6 tests passed
- `terraform -chdir=infra/modules/frontend-service test` (mock providers, fresh `TF_DATA_DIR`): exit 0, 38 passed; `terraform -chdir=infra/envs/example/aws test`: exit 0, 1 passed
- `infra/modules/frontend-task-role` `init -backend=false` + `validate`: exit 0
- bootstrap, staging/aws and example/aws `init -backend=false -lockfile=readonly` + `validate`, `terraform fmt -check -recursive infra`, the IAM guard and its self-test, `assert-unit-test-coverage.mjs`: exit 0 (shared with the phase-183 and phase-184 audit runs)
- standalone `validate` of `infra/modules/frontend-service`: exit 1 (provider alias, see the note under the map)

Recorded, not re-run: the gates of 185-10 and 185-21, the voter-journey run of 185-03 and the closing 548/548 E2E of 185-21. The manual rows rest on 185-VERIFICATION.md (status passed, 5/5) and the evidence files. Open review findings (CR-01 build context includes gitignored files, WR-01 to WR-06) are code-review items, not validation gaps.
