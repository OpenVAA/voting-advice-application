# Phase 187: Deploy Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-15
**Phase:** 187-deploy-pipeline
**Areas discussed:** Credentials and trust, Triggers and workflow shape, The deploy run, Smoke stage and alerts, The example environment, The destroy path, Proofs and records

The operator was away. No question was asked: every decision was written as checkboxes in `187-DISCUSSION-POINTS.md` and read as its ★ RECOMMENDED option. The "User's choice" lines below record that reading, not an answer.

---

## Credentials and trust

| Option | Description | Selected |
|--------|-------------|----------|
| A-01 customer-managed deploy policies | Per-concern policies in `github-oidc`, tag/name-scoped, `iam:PassRole` on the execution role only, `sns:Publish` on one topic; pipeline applies the whole AWS root | ✓ |
| A-01 `PowerUserAccess` | One AWS-managed policy; broad account access for every `staging` job | |
| A-01 image-only deploy | ECS register/update only; state drifts, destroy still needs every delete | |
| A-02 set numeric ids, no workflow pin, AR-183-01 accepted | Ids `546467466`/`115159211`; removed by one hand apply if AWS does not evaluate them | ✓ |
| A-02 name-based subjects only | TR-183-02 stays open | |
| A-02 also pin `job_workflow_ref` | Unverified AWS support; no gain against a writer | |
| A-03 `-lock=false`, drop `plan_lock` | Plan role read-only in fact | ✓ |
| A-03 keep lock write | PR job can hold or delete the apply's lock | |
| A-04 `staging` + `staging-destroy`, reviewer, branch policy `deploy/staging`, `deploy-evidence/*` | Corrects `infra/README.md` "default branch only" | ✓ |
| A-04 one environment | Destroy runs where the Supabase secrets are | |
| A-04 wait timer | Gate anyone can sit out | |
| A-05 environment secrets; no service-role key anywhere | | ✓ |
| A-05 repository secrets | Readable outside the gate | |
| A-06 same-repository `if:` → visible skip; no `pull_request_target` | | ✓ |
| A-06 rely on GitHub withholding | Red run instead of a skip | |

**User's choice:** not asked; ★ options read (A-01, A-04 marked ⚠ DECIDE).
**Notes:** The deploy role today reaches only its state key and ECR (`policies.tf:187-195`), so A-01 is required before any pipeline apply.

---

## Triggers and workflow shape

| Option | Description | Selected |
|--------|-------------|----------|
| B-01 source-only commits via temporary index | `ci-evidence` recipe; each push an operator checkpoint | ✓ |
| B-01 push this branch | Publishes `.planning/`; image script refuses it | |
| B-01 wait for `main` | Nothing observable in this phase | |
| B-02 three files (`infra-plan.yml`, `deploy.yml`, `destroy.yml`) | SHA-pinned actions, explicit permissions | ✓ |
| B-02 one event-switched file | Permissions side by side | |
| B-03 shared concurrency group, no cancel, generous timeout | | ✓ |
| B-03 Terraform lock alone | Lock errors and possibly held locks | |
| B-04 PRs to any base; draft PR between source-only branches | No public PR against `main` | ✓ |
| B-04 PRs to `main` only | Public PR needed | |

**User's choice:** not asked; ★ options read (B-01 ⚠ DECIDE).

---

## The deploy run

| Option | Description | Selected |
|--------|-------------|----------|
| C-01 required `image_digest`, not in tfvars; PR/hand plans pass the running digest | | ✓ |
| C-01 `-var image_tag=` | Not "by digest" | |
| C-01 pipeline commits tfvars | Pipeline writes to its trigger branch | |
| C-02 fix CR-01 with `git archive` context; native `ubuntu-24.04-arm` | | ✓ |
| C-02 QEMU on x86 | Slow | |
| C-02 move service to X86_64 | Changes the running stack | |
| C-03 one gated job: build, plan, migrations, functions, apply, stable, smoke | One approval; no plan artifact | ✓ |
| C-03 one job per stage | Approval per job; plan must cross jobs as an artifact | |
| C-03 migrations after rollout | Against PIPE-06 | |
| C-04 `--confirmed-ref` only under `GITHUB_ACTIONS` and `GITHUB_ENVIRONMENT=staging`; session pooler | | ✓ |
| C-04 raw `supabase db push` | Bypasses refusals and drift check | |
| C-05 deploy all three, read back | | ✓ |
| C-05 changed only | Extra change detector | |
| C-06 post-apply check of primary deployment and rollout state | | ✓ |
| C-06 trust apply status | A rollback can end steady | |

**User's choice:** not asked; ★ options read (C-01 ⚠ DECIDE).

---

## Smoke stage and alerts

| Option | Description | Selected |
|--------|-------------|----------|
| D-01 smoke last; green run waits for 186-08; no skip switch | | ✓ |
| D-01 contestant-skip input | Green run proves less than PIPE-07 | |
| D-02 `if: failure()` publish to the existing SNS topic | One channel with the rollout alert | ✓ |
| D-02 GitHub's mail to the triggering actor | Depends on who pushed and their settings | |
| D-02 chat webhook | Second channel and secret | |
| D-03 deliberately failing frontend build on `deploy-evidence/187-red` | Stops before any hosted write | ✓ |
| D-03 broken rollout | Repeats 185-16 on the live stack | |
| D-03 failing smoke | Not a broken build | |

**User's choice:** not asked; ★ options read (D-01, D-02 ⚠ DECIDE).

---

## The example environment

| Option | Description | Selected |
|--------|-------------|----------|
| E-01 `terraform test` with `mock_provider`, `command = plan` | No credentials | ✓ |
| E-01 real plan role with account override | A path to applying the template for real | |
| E-01 validate only | Not a plan | |
| E-02 three guards (account, state key, workflow test) | | ✓ |
| E-02 stand-in account alone | | |

**User's choice:** not asked; ★ options read.

---

## The destroy path

| Option | Description | Selected |
|--------|-------------|----------|
| F-01 `destroy.yml` in `staging-destroy` (no secrets), Supabase-root refusal first, scoped `plan -destroy` | | ✓ |
| F-01 destroy input on `deploy.yml` | Runs beside the Supabase secrets | |
| F-02 real destroy once after 2026-11-23, then redeploy from nothing | Keeps INFRA-13 window | ✓ |
| F-02 real destroy as soon as green | Restarts the cost window | |
| F-02 `plan -destroy` and refusal only | "Removes" never seen through the pipeline | |

**User's choice:** not asked; ★ options read (F-02 ⚠ DECIDE).

---

## Proofs and records

| Option | Description | Selected |
|--------|-------------|----------|
| G-01 evidence-only job with no environment must be refused | | ✓ |
| G-01 policy simulator | Does not evaluate real tokens | |
| G-02 no `main` trigger + branch policy + unit test | | ✓ |
| G-02 push to `main` | Not possible before the merge | |
| G-03 diagnose `secret-scan`, observe `infra-validate`, todo for `dependency-audit` | | ✓ |
| G-03 leave all three to 189 | SUPA-08 claimed with a red scan | |
| G-04 pinned actionlint (container) + vitest guard tests | | ✓ |
| G-04 first run on GitHub | Each mistake is an outward push | |
| G-05 `infra/README.md` § The deploy pipeline; one closing local E2E run | | ✓ |
| G-05 phase evidence only | | |

**User's choice:** not asked; ★ options read.

---

## Claude's Discretion

- Workflow validation tooling, documentation placement, E2E gate procedure, the image script's exit-3 handling on re-runs, tool versions, plan printing, the alert message format and the post-destroy checks: recorded under "Decided autonomously" in `187-CONTEXT.md`.

## Deferred Ideas

- FUT-10 rollback on a failed smoke run.
- Pinning the plan trust to `job_workflow_ref`.
- Narrowing `ReadOnlyAccess` (AR-183-01), kept as an accepted risk.
- `dependency-audit` CI failure, unless caused by this workstream: todo for phase 189.
- Reading the first push to `main` after the merge: phase 189.
- 185 review WR-01 to WR-06: open for triage, not in this phase.
