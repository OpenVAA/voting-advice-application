---
phase: 190
slug: multi-deployment-bootstrap
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-24
---

# Phase 190 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: 190-RESEARCH.md § Validation Architecture; decisions in 190-CONTEXT.md.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (`infra/vitest.config.ts`, `tests/vitest.config.ts`); Terraform 1.16.5 `terraform test` (`*.tftest.hcl`); actionlint 1.7.12 container |
| **Config file** | existing; new `infra/bootstrap/tests/deployments.tftest.hcl` |
| **Quick run command** | `yarn test:unit:infra <file-filter>` plus `terraform fmt -check -recursive infra` |
| **Full suite command** | `terraform fmt -check -recursive infra && infra/scripts/terraform-checks.sh validate && infra/scripts/terraform-checks.sh test-modules && infra/scripts/terraform-checks.sh plan-examples && infra/scripts/terraform-checks.sh test-bootstrap && yarn test:unit:infra && yarn test:unit:tests && yarn lint:workflows && yarn lint:check && yarn format:check` |
| **Move proof** | `infra/scripts/check-bootstrap-moves.sh --base 46554181e` |
| **Estimated runtime** | ~10 s quick; ~5 min full (without E2E) |

---

## Sampling Rate

- **After every task commit:** quick command for the touched files
- **After every plan wave:** full suite command
- **Phase gate:** full suite green, move proof green, the operator's live move plan through the plan guard, then one full E2E run judged against the last full run of this tree
- **Baseline, not a verdict:** `yarn test:unit:infra` has 6 host-only failures in `workflow-errexit.test.ts` (accepted at the Phase 191 close); plans must not add to them
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

Filled in by the planner; task ids follow `190-NN-TT`. Requirement ids INFRA-21 to INFRA-24, PIPE-13 and PIPE-14 (REQUIREMENTS.md). "File Exists" ❌ W0 means the test file is created by that task.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 190-01-01 | 01 | 1 | INFRA-22 | T-190-01 | Terraform 1.16.5 checksum-verified, outside the repo; unit baseline recorded | setup | `"$HOME/.cache/openvaa-terraform/1.16.5/terraform" version` | n/a | ⬜ pending |
| 190-01-02 | 01 | 1 | INFRA-22 | T-190-02, T-190-04 | Guard refuses delete, replace, failed move, stray create; never echoes input | vitest | `yarn test:unit:infra check-bootstrap-plan` | ❌ W0 | ⬜ pending |
| 190-01-03 | 01 | 1 | INFRA-22 | T-190-03 | Harness plans with fake keys and refresh off; control on the unchanged tree is clean | script | `bash infra/scripts/check-bootstrap-moves.sh --base 46554181e` | ❌ W0 | ⬜ pending |
| 190-02-01 | 02 | 1 | INFRA-21 | T-190-15 | Map holds staging's values byte for byte | jq | `jq -e '.deployments.staging' infra/bootstrap/deployments.auto.tfvars.json && yarn format:check` | ❌ W0 | ⬜ pending |
| 190-02-02 | 02 | 1 | PIPE-13 | T-190-05 to T-190-08 | Resolver picks exactly one owned entry or exits 1 by name; staging literals pinned | vitest | `yarn test:unit:infra resolve-deployment` | ❌ W0 | ⬜ pending |
| 190-03-01 | 03 | 1 | PIPE-13 | T-190-10, T-190-13 | Confirmed migration push only for the named deployment, its ref and its environment | vitest | `yarn test:unit:infra push-migrations` | ✅ | ⬜ pending |
| 190-03-02 | 03 | 1 | PIPE-13 | T-190-12, T-190-13 | Smoke gate keyed by SMOKE_DEPLOYMENT, default staging, target bound to public_origin | vitest | `yarn test:unit:tests deployedTarget deployedSmokeGuards` | ✅ | ⬜ pending |
| 190-04-01 | 04 | 2 | INFRA-21 | T-190-14, T-190-18 | One provider module; per-deployment IAM prefix; staging names pinned | terraform test | `terraform -chdir=infra/modules/github-oidc test` | ✅ | ⬜ pending |
| 190-04-02 | 04 | 2 | INFRA-21 | T-190-16, T-190-17 | Root over the map validates; four moved blocks | terraform validate | `terraform -chdir=infra/bootstrap validate` | ✅ | ⬜ pending |
| 190-04-03 | 04 | 2 | INFRA-22 | T-190-14, T-190-15 | Schema-subset and staging pins; move proof: no delete, replace or create; map-bearing control against MOVE_COMMIT | vitest + harness | `yarn test:unit:infra bootstrap-tfvars workflows && bash infra/scripts/check-bootstrap-moves.sh --base 46554181e` | ✅ | ⬜ pending |
| 190-05-01 | 05 | 3 | INFRA-21 | T-190-19 | Two entries plan apart; every map validation refuses | terraform test | `terraform -chdir=infra/bootstrap test` | ❌ W0 | ⬜ pending |
| 190-05-02 | 05 | 3 | INFRA-21 | T-190-20, T-190-21 | CI runs the bootstrap test credential-free; empty glob fails | script + vitest | `infra/scripts/terraform-checks.sh test-bootstrap && yarn test:unit:infra terraform-checks infra-plan-workflow` | ✅ | ⬜ pending |
| 190-06-01 | 06 | 3 | INFRA-23 | T-190-22, T-190-23, T-190-25 | Environment tag in deploy scopes; plan deny own key; ids required | terraform test | `terraform -chdir=infra/modules/github-oidc test` | ✅ | ⬜ pending |
| 190-06-02 | 06 | 3 | INFRA-23 | T-190-24, T-190-26 | Tag denies where SAR allows; tightening proven update-only | harness | `bash infra/scripts/check-bootstrap-moves.sh --base <MOVE_COMMIT>` | ✅ | ⬜ pending |
| 190-07-01 | 07 | 4 | PIPE-13 | T-190-28 | Cross-workflow rules over resolved values, each with red copies | vitest | `yarn test:unit:infra workflows` | ✅ | ⬜ pending |
| 190-07-02 | 07 | 4 | PIPE-13 | T-190-29, T-190-32, T-190-33 | deploy.yml routed via resolve; settings check before any AWS call | vitest + actionlint | `yarn test:unit:infra deploy-workflow && yarn lint:workflows` | ✅ | ⬜ pending |
| 190-07-03 | 07 | 4 | PIPE-13 | T-190-30, T-190-31 | destroy.yml routed via resolve; one constant concurrency group | vitest + actionlint | `yarn test:unit:infra destroy-workflow workflows deploy-workflow && yarn lint:workflows` | ✅ | ⬜ pending |
| 190-11-01 | 11 | 4 | INFRA-24 | — | Runbook steps for the map, both applies and adding an entry | doc | `yarn format:check` | ✅ | ⬜ pending |
| 190-11-02 | 11 | 4 | INFRA-22 | T-190-45, T-190-47, T-190-48 | Live move plan passes --pure-move before apply | manual (operator) | `check-bootstrap-plan.sh --pure-move` over the live plan (evidence/190-11-applies.md) | ✅ | ⬜ pending |
| 190-11-03 | 11 | 4 | INFRA-23 | T-190-46 | Tag inventory clean; live tightening update-only; staging deploy green | manual (operator) | guard over the live plan; deploy run URL (evidence/190-11-applies.md) | ✅ | ⬜ pending |
| 190-08-01 | 08 | 5 | PIPE-13 | T-190-34, T-190-35, T-190-38 | deploy.yml stage values from resolve; no staging literal | vitest + actionlint | `yarn test:unit:infra deploy-workflow workflows && yarn lint:workflows` | ✅ | ⬜ pending |
| 190-08-02 | 08 | 5 | PIPE-13 | T-190-36, T-190-37 | destroy.yml confirm text and Supabase key from resolve | vitest + actionlint | `yarn test:unit:infra destroy-workflow workflows && yarn lint:workflows` | ✅ | ⬜ pending |
| 190-09-01 | 09 | 6 | PIPE-13 | T-190-39, T-190-40, T-190-41a | PR plan matrix over owned deployments with per-deployment plan role; push trigger excludes deploy-evidence/destroy-* (wrong-subject never runs on a trusted ref) | vitest + actionlint | `yarn test:unit:infra infra-plan-workflow && yarn lint:workflows` | ✅ | ⬜ pending |
| 190-09-02 | 09 | 6 | PIPE-13 | T-190-41 | No literal role ARN in any workflow | vitest | `yarn test:unit:infra workflows infra-plan-workflow deploy-workflow destroy-workflow` | ✅ | ⬜ pending |
| 190-10-01 | 10 | 7 | INFRA-24, INFRA-23 | T-190-42, T-190-43, T-190-44 | Docs describe two deployments and the downstream path; accepted risks complete | doc + grep | `yarn format:check` | ✅ | ⬜ pending |
| 190-10-02 | 10 | 7 | PIPE-14 | T-190-43 | Every env root compared to staging's wiring | vitest | `yarn test:unit:infra rootCopies` | ✅ | ⬜ pending |
| 190-12-01 | 12 | 7 | PIPE-13 | T-190-49 | Probe masks the token and prints claims only | actionlint + grep | grep checks on evidence/190-12-probe-workflow.yml | ✅ | ⬜ pending |
| 190-12-02 | 12 | 7 | PIPE-13 | T-190-49, T-190-50, T-190-51 | Downstream subjects observed; empty environment runs as none; arm runner observed | manual (operator) | evidence/190-12-observations.md verdict lines | ✅ | ⬜ pending |
| 190-12-03 | 12 | 7 | PIPE-13 | T-190-52 | Deployed smoke green with SMOKE_DEPLOYMENT unset and staging | manual (operator) | `yarn test:e2e:deployed` (tests/README.md § Deployed smoke run) | ✅ | ⬜ pending |
| 190-14-01 | 14 | 8 | PIPE-13 | T-190-57 | Evidence commit free of .planning/, equal to HEAD; local resolution recorded | git + script | `git ls-tree -r --name-only <EVIDENCE_COMMIT> \| grep -c '^.planning/'` prints 0 | n/a | ⬜ pending |
| 190-14-02 | 14 | 8 | PIPE-13 | T-190-58 | Rewritten deploy.yml green on staging; infra-plan resolve and wrong-subject green | manual (operator) | DEPLOY_RUN, INFRA_PLAN_RUN in evidence/190-14-pipeline.md | n/a | ⬜ pending |
| 190-14-03 | 14 | 8 | PIPE-13 | T-190-56, T-190-59 | Destroy resolves staging, plan-destroy green, apply-destroy rejected; wrong-confirm dispatch skips both | manual (operator) | DESTROY_RUN, DISPATCH_RUN in evidence/190-14-pipeline.md | n/a | ⬜ pending |
| 190-13-01 | 13 | 9 | all six | T-190-54 | Every gate green on GATES_HEAD; requirements traced | full suite | the Full suite command above, plus the move proof | ✅ | ⬜ pending |
| 190-13-02 | 13 | 9 | all six | T-190-53 | Full E2E green, title set equal to 191-06-full, summed delta 0 | e2e | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/190-13-full --no-db-reset --no-watch` | ✅ | ⬜ pending |
| 190-13-03 | 13 | 9 | — | — | Validation contract signed | doc | `grep nyquist_compliant 190-VALIDATION.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Terraform 1.16.5 in a temp dir (checksum verified, untracked); record the `workflow-errexit` baseline
- [ ] `infra/bootstrap/tests/deployments.tftest.hcl` — two-entry isolation, staging name pins
- [ ] `infra/scripts/check-bootstrap-plan.sh` + test with fixture plan JSONs (clean move, replace, delete, stray create)
- [ ] `infra/scripts/check-bootstrap-moves.sh` (base archive, scratch copy, harness, guard)
- [ ] `infra/scripts/resolve-deployment.sh` + test
- [ ] `terraform-checks.sh` runs the bootstrap tests, with its test and an `infra-plan.yml` step

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live move plan: 0 add, 0 change, 0 destroy, N moved | INFRA-22 | Needs AWS credentials for account 471112560111 | Operator runs the runbook's plan of `infra/bootstrap`, pipes `terraform show -json` through `check-bootstrap-plan.sh` |
| Downstream OIDC subject form on GitHub Free (no environments) | PIPE-13 | Needs a token minted in the private downstream | Operator runs a probe job in `OpenVAA/deploy-nuortenvaalikone` that prints its token's `sub`; the entry's subjects are edited to match |
| Applies 1 (move) and 2 (policy tightening) | INFRA-22, INFRA-23 | Live account | Operator applies through the guard, in that order |
| Rewritten workflows on GitHub against staging | PIPE-13 | Needs pushes, gate approvals and a gate rejection | Plan 190-14: deploy-evidence deploy, destroy approved at plan-destroy and rejected at apply-destroy, wrong-confirm dispatch |
| Empty environment name runs as no environment; arm runner on the private downstream | PIPE-13 | Needs runs in the downstream | Same probe as the subject probe (plan 190-12 Task 2) |
| Deployed smoke with SMOKE_DEPLOYMENT unset and `staging` | PIPE-13 | Needs the staging smoke inputs | tests/README.md § Deployed smoke run, twice (plan 190-12 Task 3) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
