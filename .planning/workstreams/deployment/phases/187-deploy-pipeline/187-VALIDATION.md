---
phase: "187"
slug: "deploy-pipeline"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-15"
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

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | Deploy policies hold the needed actions, no `iam:Create*/Put*/Attach*/Delete*`, every policy ≤ 6,144 non-whitespace chars, `ecr:DescribeImages` present, `plan_lock` gone | tf unit | `terraform -chdir=infra/modules/github-oidc test` | ❌ Wave 0 |
| PIPE-01 | bootstrap tfvars set both numeric ids and the `staging-destroy` subject | unit | `yarn test:unit:infra workflows` (or a bootstrap tfvars test) | ❌ |
| PIPE-01 | The wrong subject is refused | manual-only (needs GitHub) | the `infra-plan.yml` wrong-subject job on the H8 push | ❌ |
| PIPE-02 | Every root formatted and validated; PR plan job shape | unit + CI | the infra-validate loop; `workflows.test.ts` | partial |
| PIPE-03 | Credentialed jobs carry the fork `if:`; no `pull_request_target` | unit | `yarn test:unit:infra workflows` | ❌ |
| PIPE-04 | `environment:` on the apply jobs; concurrency group `staging-aws`, `cancel-in-progress: false`; `timeout-minutes` set | unit | same | ❌ |
| PIPE-05 | Image by digest; `image_digest` regex refuses a tag, upper case or empty | tf unit | `terraform -chdir=infra/modules/frontend-service test` (rewrite the 3 `image_tag_refuses_*` runs) | ✅ (update) |
| PIPE-05 | Build context excludes an ignored file | script self-test | `yarn test:unit:infra build-push-image` (new case name asserted) | ✅ (extend) |
| PIPE-06 | Step order: build → plan → migrations → functions → apply → stable → smoke; failure alert last | unit | `yarn test:unit:infra workflows` | ❌ |
| PIPE-06 | `--confirmed-ref` refusals (mismatch, not Actions, wrong environment value) exit 2 before the CLI | unit | `yarn test:unit:infra push-migrations` | ❌ |
| PIPE-07 | The smoke step has `SMOKE_EXPECTED_SHA`, no `SUPABASE_SERVICE_ROLE_KEY`/`SECRET_KEY` anywhere, no `DEV_SEED_ALLOW_REMOTE` | unit | `yarn test:unit:infra workflows`; existing `deployedSmokeGuards.test.ts` | partial |
| PIPE-08 | The destroy workflow names only `infra/envs/staging/aws` for plan/apply; no Supabase secret; refusal step present | unit | `yarn test:unit:infra workflows` | ❌ |
| PIPE-09 | Red commit fails `vite build` locally | local proof | `git archive <red> \| tar -x` + `docker buildx build --target production` → non-zero | ❌ |
| PIPE-10 | No `push` trigger of deploy/destroy matches `main`; branch list exact; `!deploy-evidence/destroy-staging` | unit | `yarn test:unit:infra workflows` | ❌ |
| INFRA-16 | The `if: failure() \|\| cancelled()` publish step is the last step and names the topic | unit | same | ❌ |
| INFRA-19 | Three example roots mock-plan; floor 2, ceiling 4, two zones | tf unit | `terraform -chdir=infra/envs/example/<r> test -verbose` | ❌ Wave 0 |
| INFRA-19 | No workflow runs `apply`/`destroy` outside `infra/envs/staging/aws` | unit | `yarn test:unit:infra workflows` | ❌ |
| SUPA-08 | No `upload-artifact`; plan file only under `$RUNNER_TEMP`; actions SHA-pinned; `permissions: {}` at top; `persist-credentials: false` | unit + lint | `yarn test:unit:infra workflows`; `yarn lint:workflows` | ❌ |

### Sampling Rate
- **Per task commit:** `yarn test:unit:infra` plus the touched module's or root's `terraform test`, plus `yarn lint:workflows` when a workflow changed.
- **Per wave merge:** `terraform fmt -check -recursive infra`, the infra-validate loop, `yarn test:unit`.
- **Phase gate:** `yarn test:unit`, `yarn lint:check`, `yarn format:check`, `yarn lint:workflows`, and one full `tests/scripts/e2e-run.sh` run, all green before `/gsd-verify-work`. The outward observations (H-steps) are evidence files, not automated gates.

### Wave 0 Gaps
- [ ] `infra/modules/github-oidc/tests/github_oidc.tftest.hcl`: real provider offline (fake keys and skips) for plan-time JSON.
- [ ] `infra/envs/example/{aws,dns-mail,supabase}/tests/plan.tftest.hcl`, with the infra-plan.yml loop that runs them; infra-validate's loop does not reach roots.
- [ ] `infra/scripts/workflows.test.ts`, plus `js-yaml` in root devDependencies.
- [ ] `infra/scripts/push-migrations.test.ts`.
- [ ] Root script `lint:workflows`.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

Every outward action in `187-DISCUSSION-POINTS.md` section H (H1–H10) is an operator checkpoint, observed and recorded by hand.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
