# Phase 190: Multi-deployment bootstrap - Research

**Researched:** 2026-11-24
**Domain:** Terraform state refactoring (`moved` across `for_each`), AWS IAM multi-tenant scoping in one account, GitHub Actions workflow parameterisation for an unedited downstream mirror
**Confidence:** HIGH for the Terraform mechanics (prototyped in this session on Terraform 1.16.5 against the real bootstrap root); HIGH for the inventory of staging literals (read from the tree); MEDIUM for GitHub plan/environment availability on the private downstream (docs reached only through search snippets, and the decisive facts are the org's plan, which this session cannot read)

## Summary

`infra/bootstrap` today is a single-deployment root: one call each of `state_bucket`, `registry`, `budget`, `github_oidc` and `frontend_task_role`, fed by flat variables (`deploy_environment`, `plan_subjects`, `deploy_subjects`, `github_repository_id`, `deploy_hosted_zone_id`, `deploy_domain`, `pipeline_state_key`, `frontend_environment`). The `github-oidc` module bundles the account-wide OIDC provider with one plan role, one deploy role and eleven customer-managed policies, **nine of whose names carry no environment** (`openvaa-plan`, `openvaa-plan-deny`, `openvaa-ecr-push`, `openvaa-deploy-{alert,network,load-balancing,ecs,pass-role,edge,dns,observability,scaling}`). IAM names are unique per account regardless of path, and `name`, `path` and `description` of an `aws_iam_policy` force replacement, so the map must reproduce staging's existing names byte for byte while giving every other entry its own. The deploy role's EC2, CloudFront and ACM scopes test only `Project=openvaa` and `Root=aws`; the README records that as an accepted risk **because** the account hosts one deployment. Phase 190 removes that premise, so those conditions must gain `Environment=<key>` (an in-place policy update; staging's AWS resources already carry `Environment = var.environment` through `default_tags`).

The hard requirement, "staging moves into the map with no destroy and no replace", can be proven **offline and deterministically** before any operator plan. In this session a `terraform test` harness was built and run against the real bootstrap: run 1 applies the base commit's bootstrap tree (extracted with `git archive 46554181e infra/bootstrap infra/modules`) under a mock provider into a shared `state_key`; run 2 plans the working tree under the **real** AWS provider with fake credentials, `plan_options { refresh = false }` and an `override_data` for `aws_kms_alias`; `terraform test -json -verbose` then emits the plan's `resource_changes` with `previous_address` and `actions`, which a guard script can assert. Mock providers alone are not enough: a mocked plan reported a renamed `aws_iam_policy` as `update`, while the real provider in run 2 reported `["delete","create"]` with `replace_paths [["name"]]`. The unchanged tree's control plan showed no delete and no replace (only `update`s from mocked policy JSON). The same guard then gates the operator's live `terraform show -json` of the bootstrap plan.

The workflows name staging in 39 (`deploy.yml`), 42 (`destroy.yml`) and 8 (`infra-plan.yml`) lines, and two scripts and one test-support module hold staging literals the pipeline depends on: `infra/scripts/push-migrations.sh` (`CONFIRMING_ENVIRONMENT="staging"`, `refs/heads/deploy/staging`) and `tests/tests/utils/deployedTarget.ts` (`DEDICATED_SUPABASE_TFVARS = 'infra/envs/staging/supabase/terraform.tfvars'`, `DEFAULT_SMOKE_BASE_URL`). A downstream that may not edit upstream files cannot deploy until **all** of them resolve the deployment from data. GitHub does not allow expressions in `on:` triggers, so the trigger set must become a static superset (`deploy/*`, `deploy-evidence/**`) and a credential-free resolve step must map the ref to exactly one deployment entry that this repository owns (`github.repository_id`), failing closed otherwise.

**Primary recommendation:** Make the bootstrap map a JSON tfvars file (`infra/bootstrap/deployments.auto.tfvars.json`) keyed by the deployment name (`staging`, `nuorten-2027`), flat `for_each` on `github_oidc`, `frontend_task_role` and `registry`, the OIDC provider extracted into its own module, `state_bucket` and `budget` left exactly where they are; apply it in three separate operator applies (pure move with "0 to add, 0 to change, 0 to destroy"; then the in-place policy tightening; then, in Phase 193, the new entry), and have the three workflows read that same file through one tested `infra/scripts/resolve-deployment.sh`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Account-wide OIDC provider, state bucket, budget | Bootstrap root (hand-applied, admin) | — | One per account by AWS rule (provider) or by choice (bucket, budget); never per deployment |
| Per-deployment roles, policies, execution role, registry | Bootstrap root, `for_each` over the map | — | IAM is applied by hand only; no workflow role may create or change IAM (existing invariant) |
| Deployment identity (key, domain, zone, repo ids, subjects, branches) | Committed data: the bootstrap map JSON | GitHub Environment variables (secrets only) | Reviewable in git, read by Terraform and by `jq` alike; secrets stay in GitHub |
| Resolving "which deployment does this run target" | CI resolve step (no credential) | — | Must happen before any job names an environment or assumes a role |
| App/stack facts (registry_url, task_floor, project_ref, public_origin) | Env roots' `terraform.tfvars` under `infra/envs/<key>/` | — | Already read by the workflows today; downstream owns these files under its allowlist |
| Isolation between deployments | IAM policy conditions (names, `Environment` tag, state key, zone, repo) | GitHub Environment branch policy | IAM is the only boundary that holds across repositories |
| Proof of no destroy/replace | Offline `terraform test` harness + JSON plan guard script | Operator live plan through the same guard | Live plan is an operator checkpoint; offline proof runs here and in CI |

## Standard Stack

No new external package. Everything is already in the repository or is the pinned Terraform.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Terraform | 1.16.5 (`infra/.terraform-version`) | `moved` blocks, `for_each`, `terraform test` with `mock_provider`, `state_key`, `override_data`, `plan_options` | Pinned project-wide; `state_key` and cross-module test runs verified working in 1.16.5 this session [VERIFIED: local run] |
| hashicorp/aws provider | `~> 6.60` (locked in `infra/bootstrap/.terraform.lock.hcl`) | Real-provider offline plans detect ForceNew (`replace_paths`) | Already locked; no new provider so no lock change [VERIFIED: local run] |
| Vitest (root devDependency) | repo's | `infra/scripts/**/*.test.ts` via `yarn test:unit:infra` | Existing infra test harness (530 tests) [VERIFIED: local run] |
| jq | 1.7 in container; on GitHub runners | Resolve step reads the map JSON; plan guard reads plan JSON | Already used by every workflow [VERIFIED: `jq --version`] |
| actionlint | 1.7.12 container pinned by digest in `scripts/lint-workflows.mjs` | Lint of the three workflows incl. shellcheck | Existing `yarn lint:workflows` (needs Docker) [VERIFIED: codebase] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `moved` blocks | `terraform state mv` by the operator | Not reviewable, not plannable, no CI proof; Terraform's documented refactoring path is `moved` [CITED: developer.hashicorp.com/terraform/language/modules/develop/refactoring] |
| Offline real-provider plan harness | Mock-only `terraform test` | Mock plans never report replacement (measured: renamed policy shown as `update`) |
| Flat `for_each` on three modules | One composite `deployment` module | Composite nests addresses one level deeper; both move cleanly (verified); flat keeps the "thin root calls modules" shape |

**Installation (local verification only, never into the repo):**
```bash
d="$(mktemp -d)"; cd "$d"
curl -sSO https://releases.hashicorp.com/terraform/1.16.5/terraform_1.16.5_linux_amd64.zip
curl -sSO https://releases.hashicorp.com/terraform/1.16.5/terraform_1.16.5_SHA256SUMS
grep linux_amd64 terraform_1.16.5_SHA256SUMS | sha256sum -c -   # 2bc2fcff...aab5e4 observed
python3 -c "import zipfile;zipfile.ZipFile('terraform_1.16.5_linux_amd64.zip').extractall('.')"; chmod +x terraform
export PATH="$d:$PATH"
```

## Package Legitimacy Audit

No package is installed by this phase. The only downloaded artefact is the Terraform 1.16.5 binary from `releases.hashicorp.com`, checked against HashiCorp's published SHA256SUMS (match observed). slopcheck: not applicable.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed:** none. **Packages flagged:** none.

## Current Shape (what the phase changes)

### `infra/bootstrap` today [VERIFIED: codebase]

- `backend.tf`: literal S3 backend, bucket `openvaa-tfstate-471112560111`, key `hand/bootstrap/terraform.tfstate`, `use_lockfile = true`. **Unchanged by this phase** (same state, addresses move inside it).
- `main.tf`: provider `allowed_account_ids = [var.aws_account_id]`, `default_tags { Environment = "shared", Root = "bootstrap" }`; modules `state_bucket`, `registry` (`openvaa-frontend`), `budget` (`openvaa-monthly`, 100 USD), `github_oidc`, `frontend_task_role`. Comment: "The root declares no resource of its own".
- `variables.tf`: flat inputs listed above; `pipeline_state_key` validated `pipeline/…/terraform.tfstate`.
- `terraform.tfvars` (HCL, tracked): `deploy_environment = "staging"`, `plan_subjects = ["repo:OpenVAA/voting-advice-application:pull_request"]`, `deploy_subjects = [… :environment:staging, … :environment:staging-destroy]`, `github_repository_id = "546467466"`, `github_repository_owner_id = "115159211"`, `deploy_hosted_zone_id = "Z02494181MAM7OCUAIPKC"`, `deploy_domain = "staging.openvaa.org"`, `pipeline_state_key = "pipeline/staging/aws/terraform.tfstate"`, `frontend_environment = "staging"`.
- `outputs.tf`: singular `plan_role_arn`, `deploy_role_arn`, `registry_url`, `frontend_execution_role_arn`, … (become maps).

### Live resource names that must not change (staging) [VERIFIED: codebase]

| Address today | Name | Derived from |
|---|---|---|
| `module.github_oidc.aws_iam_openid_connect_provider.github` | `token.actions.githubusercontent.com` | account-wide |
| `module.github_oidc.aws_iam_role.plan` | `openvaa-plan` | `name_prefix` only |
| `module.github_oidc.aws_iam_role.deploy` | `openvaa-staging-deploy` | `name_prefix-environment` |
| `module.github_oidc.aws_iam_policy.tfstate_pipeline` | `openvaa-tfstate-staging-aws` | env-scoped |
| `module.github_oidc.aws_iam_policy.ecr_push` | `openvaa-ecr-push` | **no env** |
| `module.github_oidc.aws_iam_policy.plan_deny` | `openvaa-plan-deny` | **no env** |
| `module.github_oidc.aws_iam_policy.deploy_{alert,network,load_balancing,ecs,pass_role,edge,dns,observability,scaling}` | `openvaa-deploy-<concern>` | **no env** |
| `module.frontend_task_role.aws_iam_role.execution` | `openvaa-staging-frontend-execution` | env-scoped |
| `module.frontend_task_role.aws_iam_policy.parameters` | `openvaa-staging-frontend-parameters` | env-scoped |
| `module.registry.aws_ecr_repository.frontend` | `openvaa-frontend` | **no env**; `force_delete = false`, IMMUTABLE tags |
| `module.budget.aws_budgets_budget.monthly` | `openvaa-monthly` | stays at root |
| `module.state_bucket.*` | `openvaa-tfstate-471112560111` | stays at root; `prevent_destroy` |

Plus every `aws_iam_role_policy_attachment` and `aws_iam_role_policies_exclusive` (ForceNew on `role`/`policy_arn`/`role_name`). Policy **descriptions** are ForceNew too, and one already names staging: `deploy_dns` "…records in the staging zone…". Render it from a variable so staging's text stays byte-identical.

### The three workflows: every staging-specific literal [VERIFIED: codebase]

**`deploy.yml`** (39 lines):
- `name: "Deploy staging"`; triggers `deploy/staging`, `deploy-evidence/**`, `!deploy-evidence/destroy-staging`; `workflow_dispatch`.
- Workflow-level `concurrency.group: staging-aws` (shared with `destroy.yml`), `cancel-in-progress: false`.
- `checks` job: `terraform -chdir=infra/envs/staging/aws init -backend=false … validate`.
- `deploy` job: `environment: { name: staging, url: https://staging.openvaa.org }`; four `configure-aws-credentials` steps with `role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}`, `aws-region: eu-north-1`, `allowed-account-ids: "471112560111"`.
- Reads `registry_url` and `task_floor` from `infra/envs/staging/aws/terraform.tfvars`, `project_ref` from `infra/envs/staging/supabase/terraform.tfvars`.
- `terraform -chdir=infra/envs/staging/aws` for init, plan, show, apply, three outputs; step-summary heading "Plan of infra/envs/staging/aws".
- Migrations: `OPENVAA_DEPLOY_ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}` → `push-migrations.sh`, which **hard-codes** `CONFIRMING_ENVIRONMENT="staging"` and `refs/heads/deploy/staging | refs/heads/deploy-evidence/?*`.
- Smoke: `yarn test:e2e:deployed` with no `SMOKE_BASE_URL`, so `DEFAULT_SMOKE_BASE_URL = 'https://staging.openvaa.org'` and the gate reads `infra/envs/staging/supabase/terraform.tfvars`.
- Re-read: `curl … https://staging.openvaa.org/api/health`.
- Alert: `--topic-arn arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments`, subject `openvaa staging deploy failed at $stage`, message "The staging deploy failed…".

**`destroy.yml`** (42 lines): `name: "Destroy staging AWS"`; trigger `deploy-evidence/destroy-staging`; dispatch input confirm text `destroy staging aws`; job `if`s repeat both; `concurrency.group: staging-aws`; `environment: staging-destroy` on both jobs; `role-to-assume: arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy` literal (the environment holds no setting); `terraform -chdir=infra/envs/staging/supabase init` and `aws s3api head-object --bucket openvaa-tfstate-471112560111 --key hand/staging/supabase/terraform.tfstate` (the out-of-reach proof); `infra/envs/staging/aws` for init/state list/plan -destroy/show/apply; `check-destroy-plan.sh` (generic: `module.frontend.` prefix).

**`infra-plan.yml`** (8 lines): `plan` job `role-to-assume: ${{ vars.AWS_PLAN_ROLE_ARN }}` (repository variable), `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend`, `infra/envs/staging/aws` init/plan/show; `wrong-subject` job `DEPLOY_ROLE_ARN: arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy`. `checks` already globs `infra/envs/*/*/` (so downstream roots are validated automatically).

**Role / subject / state-key layout today:** plan role `openvaa-plan` trusts `repo:OpenVAA/voting-advice-application:pull_request` + `repository_id 546467466` + `repository_owner_id 115159211`; deploy role `openvaa-staging-deploy` trusts `…:environment:staging` and `…:environment:staging-destroy` + both ids; deploy role reaches `pipeline/staging/aws/terraform.tfstate` and its `.tflock` only; plan role reads `pipeline/*` objects only and is denied `hand/*`, `env:/*`.

**Tests that pin these literals** (all must change with the workflows): `infra/scripts/workflows.test.ts` (`APPLY_ROOT = 'infra/envs/staging/aws'`, `SHARED_CONCURRENCY = { group: 'staging-aws' }`, environments map, `DEPLOY_ROLE_ARN` derived from flat `deploy_environment` in bootstrap tfvars), `deploy-workflow.test.ts` (20 staging mentions), `destroy-workflow.test.ts`, `infra-plan-workflow.test.ts`, `workflow-errexit.test.ts`, `bootstrap-tfvars.test.ts` (regex-parses flat HCL vars), `push-migrations.test.ts`, `terraform-checks.test.ts`, `tests/tests/utils/deployedTarget.test.ts`, `modules/github-oidc/tests/github_oidc.tftest.hcl` (provider created inside the module).

### Downstream facts [VERIFIED: GitHub API through the session proxy, and the downstream checkout]
- `OpenVAA/deploy-nuortenvaalikone`: `id 1468971368`, `owner_id 115159211`, `private: true`, `created_at 2026-11-23T15:50:31Z`.
- Created after 2026-07-15, so its OIDC subjects use the id-bearing form: `repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:<context>` [CITED: GitHub OIDC reference via search; MEDIUM, confirm against a real token's `sub`].
- Allowlist fixes the deployment key: `infra/envs/nuorten-2027/**`. The downstream adds no upstream file and runs `deploy.yml`, `destroy.yml` and `infra-plan.yml` unedited. They are disabled there until Phase 193/195.
- Branch protection and rulesets return HTTP 403 "Upgrade to GitHub Pro" on the downstream, so the org is very likely on GitHub Free for private repositories (see Open Decision D7).

## Open Decisions

Each needs an operator ruling at discuss-phase; the recommendation is what the planner should assume if none is given.

### D1. Image registry: one repository per deployment, or a tag prefix in `openvaa-frontend`
| Option | Trade-offs |
|---|---|
| **A. One ECR repository per deployment** (staging keeps `openvaa-frontend` by an explicit `registry_name` in its entry; others default to `<name_prefix>-<key>-frontend`) | IAM scopes push to one repository ARN, so one deployment's role cannot write another's images. The lifecycle `max_images = 50` (rollback window) is per deployment. `build-push-image.sh` already takes `--repository-url` from each env's tfvars. Costs one more repository (storage per GB only). |
| B. Shared repository, tag prefix `<key>-<sha>` | ECR has no IAM condition on image tag, so each deploy role can push any tag. Nuorten's role could pre-push `staging-<future sha>`, and staging's build would then report status 3 "already holds this commit's image" and deploy the planted image. The lifecycle policy's newest-50 is shared, so one deployment's pushes shrink the other's rollback window. Today's tags are bare commit ids, so the build script and lifecycle rules would change too. |
| C. Shared repository, bare commit tags | Breaks once the instance overlay (Phase 191) makes images differ per instance: the same SHA built for two instances collides on an IMMUTABLE tag. |

**Recommendation: A.** Never rename `openvaa-frontend`: a name change forces replacement, and `force_delete = false` would make the destroy fail with images present.

### D2. Where the per-repository deployment configuration lives, and how a downstream supplies it
| Option | Trade-offs |
|---|---|
| **A. The bootstrap map itself, as `infra/bootstrap/deployments.auto.tfvars.json`** (upstream-owned, keyed by deployment), read by Terraform automatically and by the workflows with `jq`; app facts stay in `infra/envs/<key>/*/terraform.tfvars` (downstream-owned, already read today) | One source of truth for key, domain, zone, repository ids, subjects and branches. Role and topic ARNs are derived by the same naming rules the modules use, pinned by a test. The downstream adds nothing outside its allowlist: the entry arrives by sync, and the env roots are its own files. Ownership is checked by `github.repository_id`, so the upstream file can safely carry the downstream's entry, and the other way round. Cost: a change to the downstream's domain or branch needs an upstream PR, which it needs anyway because the bootstrap entry (DNS policy, trust) is upstream. |
| B. A per-deployment file `infra/envs/<key>/deployment.json` plus a repository variable naming the key | Downstream-owned and allowlist-legal. But it duplicates what the bootstrap entry already holds (domain, zone, subjects) with no single source, and needs a GitHub variable to pick the key for PR plans. |
| C. GitHub repository/environment variables only (`DEPLOY_ENVIRONMENT`, domain, role ARNs, state key) | No file at all. But the values are unreviewed and invisible in git, a typo targets the wrong stack, and on a private Free-plan repository environment variables do not exist (D7). |

**Recommendation: A**, with secrets and `SUPABASE_POOLER_HOST` staying in GitHub Environments. Also compare the environment's `DEPLOY_ENVIRONMENT` with the resolved key, and fail closed when they differ: a misconfigured environment is then caught before any write.

### D3. The map's key and schema
**Key:** the deployment name, which is also the GitHub Environment name, the `infra/envs/<key>/` directory, the state key segment (`pipeline/<key>/aws/terraform.tfstate`), the SSM path `/openvaa/<key>/frontend/` and the `Environment` tag. Values: `staging` (no subject change, no state-key change) and `nuorten-2027` (fixed by the downstream allowlist). Validate `^[a-z][a-z0-9-]*$` and `length("${name_prefix}-${key}-frontend") <= 32` (the ALB target group name in `frontend-service`; with `openvaa` that bounds the key to 15 characters, and `nuorten-2027` is 12).

**Recommended entry schema** (every field declared; see Pitfall 6 on silently dropped attributes):
```hcl
variable "deployments" {
  type = map(object({
    github_repository_id       = string
    github_repository_owner_id = string
    plan_subjects              = list(string)
    deploy_subjects            = list(string)
    deploy_branches            = list(string)           # exact names or a one-segment "<prefix>/*"; mirrors the Environment's branch policy
    hosted_zone_id             = string
    domain                     = string
    registry_name              = optional(string)       # staging: "openvaa-frontend"; default "<name_prefix>-<key>-frontend"
    iam_name_prefix            = optional(string)       # staging: "openvaa" (keeps openvaa-plan, openvaa-ecr-push, openvaa-deploy-*); default "<name_prefix>-<key>"
  }))
}
```
Derived and not input: `pipeline_state_key = "pipeline/${key}/aws/terraform.tfstate"`, `frontend_environment = key`, deploy role `"${name_prefix}-${key}-deploy"` (unchanged formula), `tfstate` policy `"${name_prefix}-tfstate-${key}-aws"` (unchanged formula). Cross-entry validations: distinct domains, zone+domain pairs, registry names and repository-id/subject sets. Keep `github_repository_id`/`owner_id` required, not optional as today: with two repositories in one account, an id-less trust is a cross-repo risk.

Alternative considered: a single `legacy_names = true` flag on staging instead of `iam_name_prefix`. It is simpler but less explicit, and a flag that changes nine names at once is the kind of input a later edit flips by mistake. Use the explicit prefix.

### D4. Budget: shared or per deployment
| Option | Trade-offs |
|---|---|
| **A. Keep the one account budget `openvaa-monthly` at root, unchanged; raise `budget_limit_usd` when the second instance goes live** | Zero move, zero risk, and the alert covers the whole account (which is what a cost limit is for). It cannot say which deployment spent. |
| B. Add per-deployment budgets filtered by the cost allocation tag `Environment` | Attribution per instance, but the tag must be activated as a cost allocation tag (account-level; `aws_ce_cost_allocation_tag` can manage it) and only covers spend after activation [ASSUMED]. Untagged costs (data transfer, some CloudFront and Route 53 lines) escape the filter. Budgets beyond the free allowance cost a little [ASSUMED]. Supabase spend is outside AWS either way. |

**Recommendation: A** now; B is a deferred idea. The budget module stays out of the `for_each`, so no `moved` block touches it.

### D5. The downstream's trigger branch, and how a run finds its deployment
`on.push.branches` takes no expression, so the trigger list is a static superset in upstream's file:
| Option | Trade-offs |
|---|---|
| **A. `deploy/*` (one segment) plus `deploy-evidence/**` minus `deploy-evidence/destroy-*`. A resolve step picks the one entry with `repository_id == github.repository_id` whose `deploy_branches` match `github.ref_name`. Downstream branch: `deploy/nuorten-2027`; destroy: `deploy-evidence/destroy-nuorten-2027`, confirm text `destroy nuorten-2027 aws`** | Upstream behaviour is identical for staging (its entry lists `deploy/staging` and `deploy-evidence/*`). A push of `deploy/nuorten-2027` upstream, or `deploy/staging` downstream, resolves to nothing and goes red before any environment is named or role assumed. |
| B. Branch name alone (`deploy/<key>`), with evidence branches always meaning "the repository's only deployment" | Simpler, but "only deployment" is a second rule, and it breaks the day a repository owns two. |
| C. A repository variable `OPENVAA_DEPLOYMENT` | Works for PR plans and dispatch, but is configuration outside git, and Free-plan private repositories get no organisation variables (repository variables still work [ASSUMED]). |

**Recommendation: A.** The PR plan job (no ref to derive from) plans every entry whose `repository_id` equals `github.repository_id` and whose `infra/envs/<key>/aws` exists in the checkout, as a matrix built by the resolve job. Concurrency: workflow-level groups accept only `github`, `inputs` and `vars` [CITED: GitHub contexts reference, via search], and groups are per repository [ASSUMED]. A constant group (for example `aws-pipeline`) shared by `deploy.yml` and `destroy.yml` keeps today's semantics, in which the whole run, both destroy jobs included, holds the group. A job-level group on the resolved key would let a deploy slip between `plan-destroy` and `apply-destroy`. Use the constant.

### D6. Plan role: one shared, or one per deployment
| Option | Trade-offs |
|---|---|
| **A. One plan role per entry** (staging keeps `openvaa-plan`; nuorten gets `openvaa-nuorten-2027-plan`), each trusting only its repository's `pull_request` subject, with `plan_deny`'s object-read exception narrowed from `pipeline/*` to that entry's own key | A downstream PR cannot read staging's pipeline state (which holds the origin secret), and the other way round. Narrowing staging's deny is an in-place update. |
| B. Keep one `openvaa-plan` trusting both repositories | Fewer resources, but every PR in either repository reads every deployment's state; the trust's `repository_id` condition becomes a two-value list. |

**Recommendation: A.** `ReadOnlyAccess` still lets either plan role read the other deployment's CloudFront and ALB configuration (the origin secret header) and SSM String parameters. Either add `Deny` statements on those reads conditioned on `aws:ResourceTag/Environment` not equal to the role's own key, or record it under Accepted risks. The planner should present both; tag-conditioned denies on `cloudfront:GetDistribution*` and `elasticloadbalancing:Describe*` may not be supported for every action (verify in the Service Authorization Reference before writing them) [ASSUMED].

### D7. GitHub Environments on the private downstream (gating, needs the operator)
Docs say environments, environment secrets and deployment branch policies in **private** repositories need GitHub Pro/Team/Enterprise, and required reviewers on private repositories are not offered on Free/Pro/Team [CITED: docs.github.com manage-environments, via search snippet; MEDIUM]. The downstream's branch-protection 403 points to Free. The whole staging gate (reviewer approval, branch policy, environment secrets, `environment:` subject) may therefore not exist downstream.
| Option | Trade-offs |
|---|---|
| A. Upgrade the org to Team | Environments, branch policies and environment secrets downstream; the subject stays `environment:nuorten-2027`. Required reviewers may still be unavailable [MEDIUM], so the gate is branch policy plus write access. |
| B. Stay on Free: no environment downstream; the deploy trust subject becomes `…:ref:refs/heads/deploy/nuorten-2027` and secrets become repository secrets | No cost. But any writer can push the deploy branch, the secrets reach every workflow of the repository, and `deploy.yml` needs a mode without `environment:` (whether `environment: ''` behaves as none is unverified [ASSUMED]). |
| C. Make the downstream public | Free environments and reviewers, but the repository was made private on purpose. |

**Recommendation:** the operator reads the org plan first (`gh api orgs/OpenVAA --jq .plan.name`, which this session cannot run) and runs one probe job in the downstream that names an environment and prints its token's `sub`. Phase 190's upstream work should **not** depend on the outcome. Keep the subject list and branch list as data, so either ruling is an entry edit, and make the workflow tolerate both (D7-A by default).

### D8. Apply sequencing of the bootstrap change
**Recommendation:** three operator applies, each through the plan guard.
1. Pure move: the map with staging only, the provider extracted, names reproduced. Expected `Plan: 0 to add, 0 to change, 0 to destroy`, with the moved count equal to the number of moved addresses.
2. Tightening: the `Environment` tag in `root_tags`, the narrowed `plan_deny`, the required ids. Updates only, all `aws_iam_policy`/`aws_iam_role` in place.
3. The `nuorten-2027` entry, in **Phase 193**, because its `hosted_zone_id` comes from the downstream's dns-mail root, which does not exist yet. Creates only.

Phase 190 tests the second entry offline with a stand-in entry, as in `example.tfvars`.

## Architecture Patterns

### System Architecture Diagram

```
                 push deploy/<key> | deploy-evidence/* | dispatch | pull_request
                                        |
                                        v
   +--------------------- resolve (no credential, contents: read) ----------------------+
   | read infra/bootstrap/deployments.auto.tfvars.json                                   |
   | keep entries with github_repository_id == github.repository_id                      |
   | match github.ref_name against entry.deploy_branches  --(0 or >1 match)--> exit red |
   | derive: key, domain, account, region, aws/supabase root dirs, state key,            |
   |         deploy/plan role ARNs, SNS topic ARN, destroy branch, confirm text          |
   +------------------------------------------+------------------------------------------+
                                              | outputs (non-secret)
               +------------------------------+---------------------------+
               v                              v                           v
        checks (fmt, validate          deploy job, environment:       infra-plan: plan matrix
        infra/envs/<key>/aws,          needs.resolve.outputs.key      over owned entries,
        test:unit:infra)               (GitHub: reviewer, branch      plan role per entry
               |                       policy, env secrets)
               +---------------------------->|
                                             v
             assume role (derived ARN == vars.AWS_DEPLOY_ROLE_ARN when set) --> STS trust:
                                                                               subject + repo ids
             build -> ECR repo of <key> -> plan/apply infra/envs/<key>/aws
             (state pipeline/<key>/aws only) -> Supabase ref from envs/<key>/supabase
             -> smoke (SMOKE_DEPLOYMENT=<key>, base URL = public_origin of that tfvars)
             -> alert to <name_prefix>-<key>-frontend-deployments

   bootstrap (operator, admin, hand/bootstrap state):
      deployments map --for_each--> github_oidc[key] / frontend_task_role[key] / registry[key]
      account-wide:   github_oidc_provider, state_bucket, budget
```

### Recommended file layout (upstream)
```
infra/bootstrap/
├── main.tf                         # for_each modules + moved blocks
├── moves.tf                        # all moved blocks in one file, easy to review and to keep
├── deployments.auto.tfvars.json    # the map (D2-A); terraform.tfvars keeps account-level values
├── tests/                          # bootstrap's own terraform tests (isolation of two entries)
infra/modules/github-oidc-provider/ # the one aws_iam_openid_connect_provider
infra/modules/github-oidc/          # per-deployment roles and policies, takes oidc_provider_arn
infra/scripts/resolve-deployment.sh (+ .test.ts)   # the workflows' single resolver
infra/scripts/check-bootstrap-plan.sh (+ .test.ts) # JSON plan guard: no delete, no replace, moves only, creates only for new keys
infra/scripts/check-bootstrap-moves.sh             # offline proof harness: git archive <base> + terraform test -json
```

### Pattern 1: `moved` blocks for "module into for_each" plus "resource out of a module"
**What:** keep the state key; move addresses. Both kinds of move can be declared in the root, and nesting them works (verified on 1.16.5).
```hcl
# Source: prototype run in this session; Terraform refactoring docs
moved {
  from = module.github_oidc.aws_iam_openid_connect_provider.github
  to   = module.github_oidc_provider.aws_iam_openid_connect_provider.github
}
moved {
  from = module.github_oidc
  to   = module.github_oidc["staging"]
}
moved {
  from = module.frontend_task_role
  to   = module.frontend_task_role["staging"]
}
moved {
  from = module.registry
  to   = module.registry["staging"]
}
```
Observed plan of the equivalent prototype: provider `previous_address = module.github_oidc.…provider`, `no-op`; staging role `previous_address = module.github_oidc.…role`, `no-op`; new key `create`. Without the `moved` blocks: `delete` + `create` for every staging address.

### Pattern 2: offline no-replace proof (`terraform test`, shared `state_key`, mock then real provider)
```hcl
# Source: prototype run in this session against the real bootstrap (control: unchanged tree -> no delete, no replace)
mock_provider "aws" {
  alias = "mock"
  mock_data "aws_kms_alias"            { defaults = { target_key_arn = "arn:aws:kms:eu-north-1:471112560111:key/00000000-0000-0000-0000-000000000000" } }
  mock_data "aws_iam_policy_document"  { defaults = { json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}" } }
  mock_resource "aws_iam_policy"       { defaults = { arn = "arn:aws:iam::471112560111:policy/openvaa/mock" } }
  mock_resource "aws_iam_role"         { defaults = { arn = "arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution" } }
  mock_resource "aws_iam_openid_connect_provider" { defaults = { arn = "arn:aws:iam::471112560111:oidc-provider/token.actions.githubusercontent.com" } }
  mock_resource "aws_s3_bucket"        { defaults = { arn = "arn:aws:s3:::openvaa-tfstate-471112560111" } }
  mock_resource "aws_ecr_repository"   { defaults = { arn = "arn:aws:ecr:eu-north-1:471112560111:repository/openvaa-frontend" } }
}
provider "aws" {            # real provider, fake keys, nothing reaches an account
  region = "eu-north-1"
  access_key = "AKIAFAKEFAKEFAKEFAKE"
  secret_key = "fake"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
}
variables { alert_email = "ops@example.org" }
run "pre_map" {
  state_key = "bootstrap"
  providers = { aws = aws.mock }
  module { source = "../../base/infra/bootstrap" }   # git archive <base> extracted beside the tree
}
run "map" {
  command   = plan
  state_key = "bootstrap"
  plan_options { refresh = false }
  override_data {
    target = module.frontend_task_role["staging"].data.aws_kms_alias.ssm
    values = { target_key_arn = "arn:aws:kms:eu-north-1:471112560111:key/00000000-0000-0000-0000-000000000000" }
  }
}
```
```bash
terraform test -json -verbose | jq -c 'select(.type=="test_plan") | .test_plan.resource_changes[]
  | {address, prev: .previous_address, actions: .change.actions, replace: .change.replace_paths}'
```
The harness has to run in a scratch copy (it writes `.terraform/` and needs the base tree beside it), so it fits a script, not a permanent file under `infra/bootstrap/tests/`. Terraform-test variables from the root's `terraform.tfvars` and `*.auto.tfvars(.json)` also apply to the `pre_map` run (observed). Because the base commit's bootstrap reads flat variables, the new tree must not delete `terraform.tfvars` values the base run needs, or the harness must pass them explicitly in `run "pre_map" { variables { … } }`.

### Pattern 3: one resolver script for the workflows
`run:` scripts may hold no `${{ }}` (`no-expression-in-run` rule, Phase 187-08), so values go through `env:`. Put the resolution in `infra/scripts/resolve-deployment.sh` (bash + jq, `--ref`, `--repository-id`, `--map`, prints `key=… domain=…` lines and writes `$GITHUB_OUTPUT`). Unit-test it with fixture maps in vitest like every other script; red cases: unknown ref, foreign repository id, two matches, a key failing the regex, an `infra/envs/<key>/aws` that is missing. Every consumer (`environment.name`, `-chdir`, tfvars paths, topic ARN, `allowed-account-ids`, `role-to-assume`) then reads `needs.resolve.outputs.*`. `jobs.<id>.environment` may use the `needs` context [CITED: GitHub contexts reference; HIGH for `needs`, which every version lists].

### Pattern 4: scope every shared-tag deploy policy by `Environment`
Add `Environment = var.environment` to `local.root_tags` in `modules/github-oidc/deploy-policies.tf`. Every statement that loops over `root_tags` (network create/change, load-balancing create, edge create/change/tag, certificates) then also tests the environment. Staging's AWS root sets `Environment = var.environment` in both providers' `default_tags` [VERIFIED: `infra/envs/staging/aws/main.tf`].

### Anti-Patterns to Avoid
- **A `legacy`/`count` switch that renames:** any expression whose value for staging differs by one character from today's name or description is a replace. Pin staging's rendered names in a test.
- **Expressions in `on:`:** not supported; filter in the resolve job instead.
- **Deriving the deployment from a GitHub variable alone:** unreviewed, and absent on Free private repositories.
- **Removing staging literals from tests without replacing them by derived pins:** the guards must stay red-capable (each rule keeps a mutation that turns it red).
- **Editing `backend.tf` or the state key:** not needed; the map lives inside the same state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Moving addresses into `for_each` | `terraform state mv` instructions in a runbook | `moved` blocks | Plannable, reviewable, provable offline |
| Proving no replace | Grepping `terraform plan` text | `terraform show -json` / `terraform test -json` → `resource_changes[].change.actions` and `previous_address` | Text format is unstable; JSON is the documented interface |
| Detecting ForceNew offline | Mock-only tests | Real provider with fake creds, `refresh = false` | Mock providers never report replacement (measured) |
| Workflow parsing in tests | New YAML parser | `workflowGuards.ts` (`loadWorkflow`, `jobSteps`, `sharedViolations`) | Already shared by four test files |
| Workflow step execution in tests | New harness | `workflow-errexit.test.ts` stub runner | Runs `run:` scripts under `bash -e` with stub commands |
| Destroy plan check | New checker | `check-destroy-plan.sh` (generic `module.frontend.` prefix) | Already root-agnostic; only its callers change |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Bootstrap state `hand/bootstrap/terraform.tfstate`: every address under `module.github_oidc`, `module.frontend_task_role`, `module.registry`. Pipeline state `pipeline/staging/aws/terraform.tfstate`: unaffected (its root is unchanged). ECR images in `openvaa-frontend`: kept in place. | `moved` blocks (code). No data migration and no `state mv`. |
| Live service config | GitHub Environments `staging` and `staging-destroy` (branch policy `deploy/staging` + `deploy-evidence/*`, variables `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`, `DEPLOY_ENVIRONMENT=staging`, five secrets); repository variable `AWS_PLAN_ROLE_ARN` and secret `ALERT_EMAIL`; in-flight runs holding concurrency group `staging-aws`. Downstream: all three workflows disabled in GitHub. | Staging Environments: no change if subjects and names stay. If the destroy branch pattern becomes `deploy-evidence/destroy-*`, the policy `deploy-evidence/*` already admits it. Rename of the concurrency group: make sure no run is waiting when the change lands. Downstream environments and variables: Phase 195 (and D7). |
| OS-registered state | None: no scheduler, launchd or systemd registration is involved (verified by reading `infra/`, the workflows and the runbooks). | None |
| Secrets/env vars | `DEPLOY_ENVIRONMENT` read by `push-migrations.sh` through `OPENVAA_DEPLOY_ENVIRONMENT`; `SMOKE_BASE_URL` (unset in CI); `TF_VAR_alert_email`. Secret names unchanged. | Code edit: `push-migrations.sh` accepts the resolved key, not the literal `staging`; the smoke config takes `SMOKE_DEPLOYMENT`. |
| Build artifacts | `infra/bootstrap/.terraform.lock.hcl` (no new provider, so unchanged); operators' local `.terraform/` dirs (need `terraform init` after the module source set changes: new module `github-oidc-provider`). | Operator re-runs `init` before the move plan. |

**Canonical question answered:** after every file is updated, the live bootstrap state still holds the old addresses until the operator applies step 1 of D8; the staging Environments keep their settings; nothing else caches the old names.

## Common Pitfalls

### Pitfall 1: One OIDC provider per issuer URL
**What goes wrong:** a second `aws_iam_openid_connect_provider` for `https://token.actions.githubusercontent.com` in the same account fails with `EntityAlreadyExists` [CITED: module comment; AWS IAM docs (one provider per URL)].
**How to avoid:** extract it into a single account-wide module; pass `oidc_provider_arn` into every per-deployment `github_oidc[key]`. Move it with its own `moved` block, declared alongside the module move (verified to compose).
**Warning signs:** a plan that shows `create` for the provider.

### Pitfall 2: IAM names are account-unique, path or not
**What goes wrong:** the nine env-less policy names and the plan role name collide for the second entry (`EntityAlreadyExists`), or get "fixed" for staging and force a replace.
**How to avoid:** `iam_name_prefix` per entry (staging `"openvaa"`); keep the deploy role, tfstate policy and execution role formulas, which already include the key. A terraform test with two entries asserts all names are distinct, and asserts staging's rendered names equal today's list.
**Warning signs:** `replace_paths` containing `name` in the offline harness.

### Pitfall 3: ForceNew attributes hidden by mocks
**What goes wrong:** a mocked plan shows `update` for a renamed policy; the live plan then shows `must be replaced`, and the replace cannot even run cleanly, because the new policy's name collides with the old one until the old is deleted.
**How to avoid:** the real-provider plan run of Pattern 2. Treat policy `description`, `name`, `path`, role `name`/`path`, ECR `name`, budget `name`, attachment `role`/`policy_arn` and `policies_exclusive.role_name` as frozen for staging.

### Pitfall 4: Mock state lacks provider defaults (false positives)
**What goes wrong:** in the harness, a resource whose ForceNew attribute is left to a provider default (example: an `aws_iam_policy` without `path`) is stored as `null` by the mock and planned as a replace by the real provider (observed `replace_paths [["path"]]`).
**How to avoid:** always run the unchanged-tree control (observed clean for the current bootstrap, which sets `path` everywhere); if a false positive appears, add the default in `mock_resource … defaults`, never weaken the guard.

### Pitfall 5: Moving across `for_each` needs a literal key and every address
**What goes wrong:** forgetting one module (for example `registry`) yields `delete` + `create` of the ECR repository, which `force_delete = false` turns into a failed apply with images present.
**How to avoid:** the guard fails on any `delete` and requires every pre-map address to appear as `previous_address`. Keep the `moved` blocks after the apply: they are harmless, and the downstream never applies bootstrap, so remove them only in a later, deliberate cleanup.

### Pitfall 6: Extra or misspelt attributes in the map are silently dropped
**What goes wrong:** Terraform converts an object with unknown attributes to the declared object type without a warning (verified on 1.16.5). A typo such as `registy_name` on staging silently falls back to the default `openvaa-staging-frontend`, which means a replace of the ECR repository.
**How to avoid:** a vitest test that the JSON entries' keys are a subset of the schema's attribute names, and a terraform test asserting staging's registry name is `openvaa-frontend`.

### Pitfall 7: Tightening tag conditions before every resource carries the tag
**What goes wrong:** adding `Environment` to `root_tags` makes the next staging deploy fail with AccessDenied on any network, edge or certificate resource that lacks `Environment=staging`.
**How to avoid:** before D8 step 2, the operator lists `Root=aws` resources with the Resource Groups Tagging API and confirms that each carries `Environment=staging`. The next deploy after the apply is the observation.

### Pitfall 8: Cross-deployment reach that tags cannot close
ECS `RegisterTaskDefinition`/`DeregisterTaskDefinition` are granted on `*`. Application Auto Scaling writes are scoped only by namespace and dimension, so either deploy role can change the other's desired-count target. `ReadOnlyAccess` lets either plan role read the other's distribution and ALB configuration. With two repositories these become cross-tenant. **How to avoid:** tighten where a condition key exists, and list the remainder in `infra/README.md` § Accepted risks with "two deployments in one account" as the premise. The current text says one account holds one deployment and must be rewritten, without historical narrative per the comment-hygiene rule.

### Pitfall 9: Dynamic environment names and GitHub's auto-create
GitHub creates an environment a job names when it does not exist, with no protection [VERIFIED: infra/README.md, observed in 187]. The resolve job must refuse before the deploy job exists, so a run never names an environment that is not in the map. The trust policies remain the boundary: only listed subjects assume a role.

### Pitfall 10: The smoke run and the migration push still assume staging
`deployedTarget.ts` reads `infra/envs/staging/supabase/terraform.tfvars` and defaults to `https://staging.openvaa.org`; `push-migrations.sh` refuses `--confirmed-ref` unless the environment is `staging` and the ref is `deploy/staging`. Both are upstream files the downstream cannot edit, so Phase 195 cannot go green without changing them here. The gate's "no input can name another target" property must hold: accept only a key that matches the regex and names an existing `infra/envs/<key>/supabase/terraform.tfvars`, and keep the base URL bound to that file's `public_origin`.

### Pitfall 11: Runner and minutes on a private repository
`deploy.yml` runs on `ubuntu-24.04-arm`. Availability and billing of arm64 hosted runners for private repositories on the org's plan are unverified here [ASSUMED]. A job that never gets a runner waits silently. The operator confirms it at Phase 195, and the workflow keeps `runs-on` literal (upstream-owned).

### Pitfall 12: `terraform-checks.sh validate` in the downstream
It globs `infra/envs/*/*/` with `-lockfile=readonly`, so the downstream roots must carry their `.terraform.lock.hcl` copied from `example` (with hashes for the runner platforms). Generalise `rootCopies.test.ts` from a fixed list to every `infra/envs/<name>/<root>` (except `scratch`) so the downstream copies are held to staging's wiring automatically.

## Code Examples

### Guard rules for the bootstrap plan JSON (offline harness and live plan alike)
```bash
# Source: plan JSON shape verified on terraform test -json output this session.
# $NEW_KEYS is a jq regex alternation of the keys this apply may create, e.g. 'nuorten-2027'; empty for the pure move.
jq -e --arg new "$NEW_KEYS" '
  [.resource_changes[] | select(.mode == "managed")] as $rc
  | ([$rc[] | select(.change.actions | index("delete"))] | length) == 0                    # no delete, no replace
  and ([$rc[] | select(.previous_address != null)
              | select(.change.actions != ["no-op"] and .change.actions != ["update"])] | length) == 0
  and ([$rc[] | select(.change.actions == ["create"])
              | select(($new == "") or (.address | test("\\[\"(" + $new + ")\"\\]") | not))] | length) == 0
' plan.json
```
(A planner-level sketch: the script should print named lines such as `bootstrap_plan_delete=0` and `bootstrap_plan_moved=<n>` in the runbook style, and be unit-tested with fixture JSON as `check-destroy-plan.test.ts` is.)

### Derived ARNs the resolver prints (pin them against the module formulas in a test)
```
deploy_role_arn = arn:aws:iam::<aws_account_id>:role<iam_path><name_prefix>-<key>-deploy
plan_role_arn   = arn:aws:iam::<aws_account_id>:role<iam_path><iam_name_prefix>-plan
topic_arn       = arn:aws:sns:<aws_region>:<aws_account_id>:<name_prefix>-<key>-frontend-deployments
cluster/service = <name_prefix>-<key> / <name_prefix>-<key>-frontend
state_key       = pipeline/<key>/aws/terraform.tfstate
```
For staging these reproduce today's literals exactly (`openvaa-staging-deploy`, `openvaa-plan`, `openvaa-staging-frontend-deployments`, `openvaa-staging`/`openvaa-staging-frontend`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `terraform state mv` | `moved` blocks (1.1+), incl. into `for_each` and across modules | Terraform 1.1 | Plannable refactor |
| Module-only `terraform test` | Alternate `module { source }` per run plus shared `state_key` | `state_key` works in 1.16.5 (verified) | Old tree → new tree in one test |
| Name-based OIDC `sub` | Id-bearing `repo:OWNER@ID/REPO@ID:…` for repos created/renamed/transferred after 2026-07-15 | 2026-07-15 [CITED: GitHub changelog 2026-04-23 and OIDC docs via search] | Downstream subjects differ in form from upstream's |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cost allocation tag activation is needed for tag-filtered budgets and only covers later spend; extra budgets cost a little | D4 | Only matters if D4-B is chosen |
| A2 | Concurrency groups are scoped per repository | D5 | A constant group name could serialise across repos (harmless) or not at all (unchanged risk) |
| A3 | Free-plan private repositories still get repository variables | D5-C | Only matters if D5-C is chosen |
| A4 | `environment: ''` behaves as no environment | D7-B | D7-B would need a second job shape |
| A5 | Arm64 hosted runners are available to the private downstream on its plan | Pitfall 11 | Deploy job never starts |
| A6 | Tag-conditioned `Deny` works for the CloudFront/ELB read actions in question | D6 | The plan-role isolation remains an accepted risk |
| A7 | Required reviewers are unavailable for private repos below Enterprise | D7 | The downstream gate design |

## Open Questions (RESOLVED)

1. **Which GitHub plan is the OpenVAA org on, and what does an `environment:` job in the private downstream produce?** Known: branch protection 403 there. Unclear: environments, the token `sub`. Recommendation: an operator probe before Phase 195; Phase 190 keeps subjects and branches as data.
   RESOLVED: CONTEXT D7, the org is on GitHub Free, so the private downstream has no GitHub Environments and uses ref-based subjects. Plan 190-12's token probe records the exact `sub` and shows whether an empty environment name runs as none.
2. **Base commit for the move proof.** Use the tree whose bootstrap is live. Precondition: the operator's plan of the unchanged tree reads `No changes` before the refactor plan, so base = live.
   RESOLVED: the base is 46554181e. Plan 190-11 Task 2 first requires the operator's live plan of that tree to read `No changes.`
3. **Should the move-proof harness run in CI permanently?** It needs the base tree (`git archive` and full history) and a provider download. Recommendation: a script run in the phase's verification and the operator step; permanent CI coverage is the two-entry isolation test, not the move.
   RESOLVED: CONTEXT § Deferred Ideas puts permanent CI for the harness out of scope. The harness runs in phase verification (plans 190-04, 190-06, 190-13), and the two-entry isolation test runs in CI (plan 190-05).
4. **The environment value `DEPLOY_ENVIRONMENT`.** Keep it and compare it with the resolved key (fail closed), or drop it? Recommendation: keep and compare.
   RESOLVED: CONTEXT D5 keeps `DEPLOY_ENVIRONMENT`, and the deploy job fails when it differs from the resolved key (plan 190-07, settings check).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Terraform | validate, fmt, module/root tests, move proof | ✗ in PATH; downloadable (releases.hashicorp.com 200, registry.terraform.io 200), checksum verified | 1.16.5 | Install to a temp dir per the snippet above |
| hashicorp/aws provider download | `terraform init` | ✓ through the proxy (init succeeded) | ~> 6.60 | — |
| Node / Yarn / Vitest | `yarn test:unit:infra`, `yarn test:unit:tests` | ✓ | v24.21.0 / 4.18.1 | — |
| jq | resolver, guards | ✓ | 1.7 | — |
| Docker + Docker Hub | `yarn lint:workflows` (actionlint image) | Docker installed, daemon not started at boot; registry reachable (401 = auth challenge) | 29.10.0 | `openvaa-stack-up` starts dockerd; or skip lint locally and rely on CI |
| actionlint, shellcheck binaries | direct lint | ✗ (GitHub release download blocked 403) | — | Container via `yarn lint:workflows` |
| AWS CLI and credentials | live plans | ✗ (by design) | — | Operator checkpoints |
| `gh` | repo reads | Partially: repo-scoped reads only, org endpoints blocked | 2.89.0 | Operator |

**Baseline observed in this container:** `yarn test:unit:infra`: 524 passed, **6 failed**, all in `workflow-errexit.test.ts` (the wrong-subject step, the deploy alert step, and destroy's Supabase-root step). The cause was not diagnosed; it is likely environmental, since every failing step calls `aws`/`grep` on stubbed output. The planner must reproduce and settle this baseline first (CI result on the base commit), so the phase is not judged against a red that predates it. `yarn test:unit:tests deployedTarget`: 132 passed. The github-oidc module's `terraform test`: 12 passed.

**Missing dependencies with no fallback:** live AWS plan and apply (operator checkpoints by design).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (infra scripts, workflow guards, smoke gate); Terraform 1.16.5 `terraform test` (modules, example roots, new bootstrap tests); actionlint 1.7.12 container |
| Config file | `infra/vitest.config.ts`, `tests/vitest.config.ts`; `*.tftest.hcl` under each tested module/root |
| Quick run command | `yarn test:unit:infra <file-filter>` (~10 s), plus `terraform -chdir=infra/modules/github-oidc test` |
| Full suite command | `terraform fmt -check -recursive infra && infra/scripts/terraform-checks.sh validate && infra/scripts/terraform-checks.sh test-modules && infra/scripts/terraform-checks.sh plan-examples && yarn test:unit:infra && yarn test:unit:tests && yarn lint:workflows && yarn lint:check && yarn format:check`; the move proof `infra/scripts/check-bootstrap-moves.sh --base <sha>`; at the phase's end the full E2E run (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --no-watch`) per CLAUDE.md |

### Phase Requirements → Test Map (proposed IDs; REQUIREMENTS.md says TBD)
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-21 | Bootstrap takes a `deployments` map; two entries plan with distinct names, keys, registries, roles; one OIDC provider | terraform test (mock) | `terraform -chdir=infra/bootstrap test` | ❌ Wave 0 (`infra/bootstrap/tests/deployments.tftest.hcl`) |
| INFRA-21 | Staging's rendered names equal today's list (roles, 11 policies, execution role, ECR, budget) | terraform test | same | ❌ Wave 0 |
| INFRA-21 | Map JSON keys ⊆ schema; key regex and length; distinct domains/zones | vitest + variable validation | `yarn test:unit:infra bootstrap-tfvars` | ✅ rewrite `bootstrap-tfvars.test.ts` |
| INFRA-22 | Staging moves with no delete and no replace (offline, real-provider) | script + terraform test -json | `infra/scripts/check-bootstrap-moves.sh --base 46554181e` | ❌ Wave 0 |
| INFRA-22 | Plan guard refuses delete/replace/unexpected create; accepts moves | vitest with fixture plans | `yarn test:unit:infra check-bootstrap-plan` | ❌ Wave 0 |
| INFRA-22 | Live plan: 0 add, 0 change, 0 destroy, N moved | manual (operator) | runbook step, guard over `terraform show -json` | operator checkpoint |
| INFRA-23 | Deploy policies test `Environment`; ECR push scoped to own repo; plan_deny reads own key only; tfstate own key | terraform test (real provider, fake creds) | `terraform -chdir=infra/modules/github-oidc test` | ✅ extend `github_oidc.tftest.hcl` |
| PIPE-13 | Resolver maps ref + repository id to exactly one entry; refuses foreign/unknown/ambiguous | vitest (runs the script) | `yarn test:unit:infra resolve-deployment` | ❌ Wave 0 |
| PIPE-13 | No workflow names `staging` as a literal except as data; every `-chdir`, environment, role, topic and URL comes from resolve outputs; rules stay red-capable | vitest (workflow guards) | `yarn test:unit:infra workflows deploy-workflow destroy-workflow infra-plan-workflow workflow-errexit` | ✅ rewrite |
| PIPE-13 | `push-migrations.sh` accepts the resolved key and ref | vitest | `yarn test:unit:infra push-migrations` | ✅ extend |
| PIPE-13 | Smoke gate reads `infra/envs/<SMOKE_DEPLOYMENT>/supabase/terraform.tfvars`, defaults to staging, refuses bad keys | vitest | `yarn test:unit:tests deployedTarget` | ✅ extend |
| PIPE-13 | Workflows lint clean | actionlint | `yarn lint:workflows` | ✅ |
| PIPE-14 | Env-root copies (any `infra/envs/<name>/`) keep staging's wiring | vitest | `yarn test:unit:infra rootCopies` | ✅ generalise |
| INFRA-24 | `infra/README.md`, `infra/envs/example`, bootstrap README and the docs guide describe adding a deployment from a downstream | doc guards + review | `yarn test:unit:infra hosted-settings-reference` (pattern), `yarn format:check` | ✅ partial |

### Sampling Rate
- **Per task commit:** the quick command for the touched file, plus `terraform fmt -check -recursive infra`.
- **Per wave merge:** the full suite without E2E.
- **Phase gate:** full suite green, move proof green, the operator's live move plan through the guard, then one full E2E run (deltas judged per CLAUDE.md).

### Wave 0 Gaps
- [ ] Install Terraform 1.16.5 to a temp dir (not tracked) and record the six-test `workflow-errexit` baseline.
- [ ] `infra/bootstrap/tests/deployments.tftest.hcl`: two-entry isolation and staging name pins.
- [ ] `infra/scripts/check-bootstrap-plan.sh` and `.test.ts` with fixture plan JSONs (clean move, a replace, a delete, a stray create).
- [ ] `infra/scripts/check-bootstrap-moves.sh` (git archive base, scratch copy, harness, guard).
- [ ] `infra/scripts/resolve-deployment.sh` and `.test.ts`.
- [ ] `terraform-checks.sh` gains bootstrap tests (a new `test-roots` check, or bootstrap added to the tested set), with `terraform-checks.test.ts` and an `infra-plan.yml` step.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (workload identity) | GitHub OIDC → STS, exact `sub` plus `repository_id`/`repository_owner_id` claims |
| V3 Session Management | yes | Short STS sessions, role re-assumed before apply, credentials dropped between steps (unchanged) |
| V4 Access Control | yes, central | Per-deployment IAM names, `Environment` tag conditions, own-key state access, own-zone DNS, own-repo ECR, plan-role deny narrowed |
| V5 Input Validation | yes | Terraform variable validations on the map; resolver regex on key and ref; smoke gate key validation |
| V6 Cryptography | no new | — |
| V14 Configuration | yes | Map in git (reviewed), secrets only in GitHub, no secrets in tfvars |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Downstream pipeline changes staging's VPC/CDN/certs via shared tags | Tampering / EoP | `Environment` in `root_tags` conditions |
| Image poisoning across deployments in a shared repository | Tampering | Per-deployment ECR repository (D1-A) |
| A PR in one repo reads another deployment's pipeline state (origin secret) | Information disclosure | Per-deployment plan role, deny narrowed to own key (D6-A) |
| A token from the wrong repo assumes a role (name reuse) | Spoofing | Required numeric id conditions on every trust |
| A dynamic environment name creates an unprotected environment | EoP | Resolver refuses before any job names an environment; subjects listed exactly |
| A push to an unprotected deploy branch on the private downstream | EoP | D7 ruling (plan upgrade or accepted risk) |
| ECS task-definition and autoscaling writes across tenants | Tampering | Accepted risk, documented (no resource-level scope available) |

## Sources

### Primary (HIGH confidence)
- Local runs on Terraform 1.16.5 (this session, scratch copies only): `state_key` across `module { source }` runs; `moved` into `for_each` and out of a module (composed); mock plan hides ForceNew; real-provider `refresh = false` plan shows `replace_paths`; control plan of the real bootstrap clean; extra object attributes silently dropped; `github_oidc.tftest.hcl` 12/12.
- Codebase: `infra/bootstrap/*`, `infra/modules/{github-oidc,frontend-task-role,registry,budget,state-bucket,frontend-service}`, `.github/workflows/{deploy,destroy,infra-plan}.yml`, `infra/scripts/*`, `tests/tests/utils/deployedTarget.ts`, `infra/README.md`, `infra/bootstrap/README.md`, `.planning/workstreams/deployment/{ROADMAP,STATE,REQUIREMENTS}.md`, downstream `.github/README.md` and `ROADMAP.md`.
- GitHub API (repo-scoped): `repos/OpenVAA/deploy-nuortenvaalikone` id, owner id, created_at, private.

### Secondary (MEDIUM confidence)
- [GitHub: manage environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) and [deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments): plan requirements for private repositories (search snippets; docs.github.com was not fetchable from this session).
- [GitHub community discussion 202852](https://github.com/orgs/community/discussions/202852): required reviewers on private repositories.
- [GitHub changelog: immutable subject claims](https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens), [GitHub OIDC reference](https://docs.github.com/en/actions/reference/security/oidc), [Microsoft Entra: immutable subjects](https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-github-immutable-subjects): the id-bearing format and the 2026-07-15 date.
- [AWS IAM CreatePolicy](https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreatePolicy.html) and [Ansible iam_managed_policy](https://docs.ansible.com/ansible/10/collections/amazon/aws/iam_managed_policy_module.html): names unique per account, path irrelevant.
- [GitHub contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts): context availability for `concurrency` and `environment`.

### Tertiary (LOW confidence)
- Behaviour of `environment:` jobs on Free-plan private repositories (no source found).

## Metadata

**Confidence breakdown:**
- Terraform refactor and proof: HIGH (prototyped on the real root and pinned version)
- Workflow literal inventory: HIGH (read and counted)
- GitHub plan/environment constraints downstream: MEDIUM to LOW (docs via snippets; the org plan is unreadable here)
- IAM cross-tenant scoping: MEDIUM (codebase plus AWS rules; condition-key support for D6 denies unverified)

**Research date:** 2026-11-24
**Valid until:** 2026-12-24 (Terraform and the stack are pinned; the GitHub plan facts should be re-read at Phase 195)

## Project Constraints (from CLAUDE.md)

- Comment hygiene for every comment under `infra/`, `tests/`, `apps/`, `packages/`: no historical narrative (the github-oidc and README "one account hosts one deployment" text is rewritten to describe the new state, not the change), no planning references beyond `see phase N`, nothing addressed to reviewers.
- E2E hard rule: no task is done while an E2E test fails. Within the phase, targeted runs; one full-suite run at the phase's end, judged against the last full run. This phase touches the deployed smoke config (`tests/playwright.deployed.config.ts`, `tests/tests/utils/deployedTarget.ts`), not the local E2E projects. A void run (exit 8) is re-run.
- Never commit secrets; the bootstrap `alert_email` stays `TF_VAR_alert_email`; tracked tfvars hold no secret.
- TypeScript strict, no `any`, in the new `.test.ts` files; TSDoc on exported symbols.
- Run `yarn lint:check`, `yarn format:check` and the code-review checklist (`.agents/code-review-checklist.md`).
- Hosted Supabase settings are written only by `infra/modules/supabase` (no dashboard or `config push`); not touched here.
- Downstream rule (`.claude/rules/nuorten-2027.md`): the downstream adds files only under its allowlist and never edits upstream files. Every seam this phase needs (resolver, smoke key, push-migrations key, the map) must therefore be upstream, and the downstream supplies only `infra/envs/nuorten-2027/**`, GitHub settings, and an upstream PR for its bootstrap entry (Phase 193).
- Planning writes for this phase go under `.planning/workstreams/deployment/`.
