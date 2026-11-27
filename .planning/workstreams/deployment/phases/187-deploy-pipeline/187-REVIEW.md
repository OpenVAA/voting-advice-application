---
phase: 187-deploy-pipeline
reviewed: 2026-11-15T06:10:00Z
depth: deep
files_reviewed: 45
files_reviewed_list:
  - .github/trufflehog-exclude-paths.txt
  - .github/workflows/deploy.yml
  - .github/workflows/destroy.yml
  - .github/workflows/infra-plan.yml
  - infra/README.md
  - infra/bootstrap/README.md
  - infra/bootstrap/example.tfvars
  - infra/bootstrap/main.tf
  - infra/bootstrap/terraform.tfvars
  - infra/bootstrap/variables.tf
  - infra/envs/example/aws/main.tf
  - infra/envs/example/aws/terraform.tfvars
  - infra/envs/example/aws/tests/plan.tftest.hcl
  - infra/envs/example/aws/variables.tf
  - infra/envs/example/dns-mail/tests/plan.tftest.hcl
  - infra/envs/example/supabase/tests/plan.tftest.hcl
  - infra/envs/staging/aws/README.md
  - infra/envs/staging/aws/main.tf
  - infra/envs/staging/aws/terraform.tfvars
  - infra/envs/staging/aws/variables.tf
  - infra/envs/staging/supabase/README.md
  - infra/modules/frontend-service/service.tf
  - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
  - infra/modules/frontend-service/variables.tf
  - infra/modules/github-oidc/deploy-policies.tf
  - infra/modules/github-oidc/policies.tf
  - infra/modules/github-oidc/tests/github_oidc.tftest.hcl
  - infra/modules/github-oidc/variables.tf
  - infra/scripts/bootstrap-tfvars.test.ts
  - infra/scripts/build-push-image.sh
  - infra/scripts/build-push-image.test.ts
  - infra/scripts/check-destroy-plan.sh
  - infra/scripts/check-destroy-plan.test.ts
  - infra/scripts/deploy-workflow.test.ts
  - infra/scripts/destroy-workflow.test.ts
  - infra/scripts/infra-plan-workflow.test.ts
  - infra/scripts/push-migrations.sh
  - infra/scripts/push-migrations.test.ts
  - infra/scripts/running-image-digest.sh
  - infra/scripts/running-image-digest.test.ts
  - infra/scripts/workflowGuards.ts
  - infra/scripts/workflows.test.ts
  - scripts/lint-workflows.mjs
  - package.json
  - tests/README.md
findings:
  critical: 1
  warning: 10
  info: 8
  total: 19
  necessity: 2
status: issues_found
---

# Phase 187: Code Review Report

**Reviewed:** 2026-11-15T06:10:00Z
**Depth:** deep
**Files Reviewed:** 45
**Status:** issues_found

## Summary

Scope: `git diff 5601c036d..HEAD -- . ':!.planning'`, which is the three workflows, the deploy-role IAM policies, the `image_digest` model, the four scripts and their tests, the guard module and the docs. `yarn.lock` was excluded. I also read the modules the changed code calls (`frontend-service/{main,edge,origin,service,scaling,alerts}.tf`, `github-oidc/main.tf`, `check-drift.sh`, `tests/playwright.deployed.config.ts`) so I could trace call chains and check the IAM action catalogue against the resources the root actually creates.

Offline checks run: `yarn test:unit:infra` passes (11 files, 302 tests). `terraform -chdir=infra/envs/example/aws test` passes. I reproduced the guard, the alert-stage and the regex findings below with local inputs. Nothing ran against GitHub, AWS or Supabase.

The workflow hygiene is good. There are no `${{ }}` expressions in any `run:` script. Top-level permissions are empty and every job sets its own. Every action is pinned by commit SHA, and every checkout sets `persist-credentials: false`. There is no `pull_request_target`, no artifact upload, and every secret is passed in step `env`. Fork PRs are excluded by `head.repo.full_name`. Concurrency is one shared group with `cancel-in-progress: false`. The step order is migrations, then functions, then apply, then stable, then smoke, as designed. The plan role has no lock write. The deploy role has no S3 grant beyond the pipeline key, and the state bucket has no bucket policy that could widen it.

Key concerns:

- **The tag scope of the CloudFront and ACM grants can be bypassed (CR-01).** The deploy role can put the root's tags on any distribution or certificate in the account, and then update or delete it.
- **One network create statement probably fails a create from nothing (WR-01).** It tests a request-tag key on the parent VPC or security group, where EC2 does not put that key in the request context. Bootstrap Step 9's simulator cases would not catch this, so the first sign would be the real destroy and redeploy (H10).
- **The destroy path has two holes.** It cannot be re-run after a partial destroy (WR-02). Its guard passes a plan that destroys nothing (WR-03).
- **Some failures are reported misleadingly or approved blind.** The alert names `setup` for failures that happen after migrations were pushed (WR-04). The approval that releases the migration push happens before any plan or pending list exists (WR-06).

## Critical Issues

### CR-01: The CloudFront and ACM tag scope can be bypassed: the deploy role can tag any distribution or certificate and then change or delete it

**File:** `infra/modules/github-oidc/deploy-policies.tf:418-436`, `:459-473` (with `:438-457`, `:475-493`)
**Issue:** The statement `CreateTaggedDistribution` grants `cloudfront:TagResource` on `distribution/*`, and its only conditions are on `aws:RequestTag/*`. CloudFront has no condition key that limits `TagResource` to a create, unlike EC2's `ec2:CreateAction`, which the network policy correctly uses at `:176-196`. So this statement lets the role call `TagResource` on **any existing distribution in the account** with `Project=openvaa, Root=aws`. Once that call succeeds, `ChangeTaggedDistribution` (`:438-457`, scoped only by `aws:ResourceTag`) allows `UpdateDistribution` and `DeleteDistribution` on that distribution.

ACM has the same hole. `RequestTaggedCertificate` grants `acm:AddTagsToCertificate` on `certificate/*` in both regions with only `aws:RequestTag` conditions, and `ChangeTaggedCertificate` then allows `DeleteCertificate`.

The comment at `:402-403` says these resources are "changed or deleted only while they carry" the tags. That is true, but the role itself can add the tags, so the tag scope does not confine the role. The other tag-scoped concerns do not have this gap: EC2 uses `ec2:CreateAction`, and ELB, ECS, logs, SNS and events are scoped by name.

None of Step 9's simulator cases (`infra/bootstrap/README.md`, the nine `sim` lines) tests a tag call on a foreign resource, so the hole would pass H1.

Exposure today depends on what else is in account 471112560111. The design treats this as a least-privilege boundary, and the boundary does not hold.

**Fix:** Close or record the hole explicitly. Concretely:
```hcl
# 1. Scope certificate requests to the two names the root asks for.
statement {
  sid       = "RequestTaggedCertificate"
  actions   = ["acm:RequestCertificate"]
  resources = local.certificate_arns
  condition {
    test     = "ForAllValues:StringEquals"
    variable = "acm:DomainNames"
    values   = [var.domain, "origin.${var.domain}"]
  }
  # ...the two aws:RequestTag conditions as now
}

# 2. Never let the role re-tag a resource another root (or no root of ours) owns.
statement {
  sid       = "DenyAdoptingForeignEdge"
  effect    = "Deny"
  actions   = ["cloudfront:TagResource", "acm:AddTagsToCertificate"]
  resources = concat(["arn:aws:cloudfront::${var.aws_account_id}:distribution/*"], local.certificate_arns)
  condition {
    test     = "StringNotEquals"
    variable = "aws:ResourceTag/Root"
    values   = ["aws"]
  }
  condition {
    test     = "Null"
    variable = "aws:ResourceTag/Root"
    values   = ["false"]
  }
}
```
An untagged foreign distribution or certificate is still adoptable after this, because CloudFront and ACM have no create-only key. So also:

- add an H1 read-back that lists the distributions in the account and the certificates in eu-north-1 and us-east-1, and shows no untagged foreign one;
- record the remainder under "Accepted risks" in `infra/README.md`;
- correct the comment at `:402-403`;
- add a refused simulator case: `cloudfront:TagResource` on a foreign distribution ARN with the request tags should read `explicitDeny`.

## Warnings

### WR-01: `CreateInTaggedParent` tests `aws:RequestTag` against the parent VPC or security group, which probably breaks every subnet, route table, security group and rule create

**File:** `infra/modules/github-oidc/deploy-policies.tf:145-174`
**Issue:** This statement allows `CreateSubnet`, `CreateRouteTable`, `CreateSecurityGroup` and `AuthorizeSecurityGroup{Ingress,Egress}` on the **parent** resource (`vpc/*`, `security-group/*`). It requires both `aws:ResourceTag/*` and `aws:RequestTag/*`.

In the EC2 service authorization reference, `aws:RequestTag` is listed only for the resource being created (subnet, route-table, security-group, security-group-rule). It is not listed for the parent resource of the same call. AWS's own example policies ("Create a security group in a specific VPC with tags") grant the parent VPC with no request-tag condition, and give the request-tag condition only to the created resource.

If EC2 leaves the request-tag key out of the context when it evaluates the parent, which is the documented behaviour, the parent statement never matches and the create is refused. That would break:

- every create of the network from nothing (H10, the planned destroy and redeploy);
- any replacement of a security-group rule.

It would not break an image-only deploy, which is why nothing observed so far shows it.

Step 9's simulator would not catch it either. `simulate-custom-policy` evaluates whatever context entries you pass, and the README's cases test only `ec2:CreateVpc`.

**Fix:** Drop the `aws:RequestTag` conditions from `CreateInTaggedParent` and keep the `aws:ResourceTag` ones. The created resource is still forced to carry the tags by `CreateTaggedResource` and `CreateTaggedRule`, so nothing is lost:
```hcl
statement {
  sid       = "CreateInTaggedParent"
  actions   = [...]   # unchanged
  resources = [local.network_arns["vpc"], local.network_arns["security-group"]]
  dynamic "condition" {
    for_each = local.root_tags
    content {
      test     = "StringEquals"
      variable = "aws:ResourceTag/${condition.key}"
      values   = [condition.value]
    }
  }
}
```
Before H10, also add a real check: a `CreateSecurityGroup --dry-run` (`DryRunOperation` vs `UnauthorizedOperation`) under the deploy role in the staging VPC. That evaluates the real request context, which the simulator does not.

### WR-02: Both destroy jobs (and every PR plan) depend on a running service, so a destroy cannot be re-run after a partial destroy

**File:** `.github/workflows/destroy.yml:113-131`, `:256-272`; `.github/workflows/infra-plan.yml:161-178`; `infra/scripts/running-image-digest.sh:107-112`
**Issue:**

- **Destroy.** Both destroy jobs read the digest from the live ECS service. If the service or the cluster is gone, `running-image-digest.sh` exits 1 (`services[0].taskDefinition` is `None`, or `ClusterNotFoundException`), and the job fails before it plans. The workflow's own comment says "A destroy plan replaces nothing, so the digest only satisfies the variable". So a destroy that stops half-way can never be finished by the workflow: a lost runner, the 45-minute timeout, or a CloudFront or ACM delete error after the service is deleted all leave the stack in that state, and the operator falls back to a hand destroy.
- **PR plans.** For the same reason, every infra pull-request plan fails between the real destroy (H10) and the next deploy.

The hand runbook already knows this. `infra/envs/staging/aws/README.md:73-75` says "after the destroy there is no service to read it from".
**Fix:** In `destroy.yml`, pass a fixed placeholder rather than the running digest. The value only satisfies the variable's validation:
```yaml
env:
  DIGEST: sha256:0000000000000000000000000000000000000000000000000000000000000000
```
Then drop the two "Read the digest" steps. For `infra-plan.yml`, either accept the red plans after a destroy and document it in the README's "Recovery", or fall back to the same placeholder when the script prints `failed=describe-services`. The plan then shows a task-definition change, which is correct when no service exists.

### WR-03: `check-destroy-plan.sh` passes a plan that destroys nothing, and compares counts rather than addresses

**File:** `infra/scripts/check-destroy-plan.sh:68-80`, `:115-119`
**Issue:** Reproduced locally:

- `{"resource_changes":[]}` with an empty state list gives `destroy_guard=pass`, exit 0.
- `{"format_version":"1.2"}` (no `resource_changes` at all) with an empty state list also gives pass.
- A state listing `module.frontend.aws_ecs_cluster.this` with a plan deleting `module.frontend.aws_vpc.other` gives pass, because only the counts are compared.

In the workflow, an empty state list means the backend read an empty or absent object. The workflow would then go green through plan, guard, apply and the "state is empty" check while the stack still stands. The header says the guard proves "the stack's destroy". An empty destroy is not that.
**Fix:**
```bash
# refuse an empty destroy, and compare the sets, not their sizes
[ "$state" -gt 0 ] || guard=fail
planned_set="$(jq -r '[.resource_changes[]? | select(.mode=="managed" and .change.actions==["delete"] and (.deposed|not)) | .address] | sort | .[]' "$PLAN_JSON")"
state_set="$(awk 'NF && $0 !~ /^(module\.[^.]+\.)*data\./' "$STATE_LIST" | sort)"
[ "$planned_set" = "$state_set" ] || guard=fail
```
Also require `.resource_changes` to be present, and an array. Add test cases for an empty destroy and for a count-equal address mismatch to `check-destroy-plan.test.ts`.

### WR-04: The alert names the stage `setup` for failures that happen after migrations and functions are already deployed

**File:** `.github/workflows/deploy.yml:505-523`, `:356`, `:424`; `infra/README.md:253-254`
**Issue:** The stage loop knows only the steps that have an `id`. If an unnamed step fails, no outcome reads `failure`, and `stage` falls through to `setup`. Unnamed steps include:

- "Assume the deploy role again for the apply" (after the migrations push and the functions deploy);
- "Install Playwright's Chromium" (after the rollout);
- "Show the plan", "Setup Node.js", "Setup Yarn", "Install psql" and "Initialise the staging AWS root" (after the image push).

Reproduced: with every named outcome `success`/`skipped` and `JOB_STATUS=failure`, the loop prints `alert_stage=setup`. The README says "`setup` means a step before the build". An operator who reads "failed at setup" after a failed re-assume would conclude nothing hosted changed, when the persistent Supabase project already has the new migrations and functions.
**Fix:** Give every step an `id`, and map each one to a stage: `credentials` to `setup`; `init`, `show` to `plan`; node, yarn, psql to `migrations`; `reassume` to `rollout`; `playwright` to `smoke`. Or derive the stage from the last step that succeeded: "after functions" is enough. Correct `infra/README.md:253-254` and the `stage=setup` assertion in `deploy-workflow.test.ts:400`.

### WR-05: The deploy role's credentials are in the environment of every step after the first assumption, including the third-party yarn action and the dependency install

**File:** `.github/workflows/deploy.yml:101-107`, `:186-189`, `:212-216`, `:424-425`
**Issue:** `configure-aws-credentials` exports `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` through `$GITHUB_ENV`, so every later step of the job inherits them. That includes:

- `threeal/setup-yarn-action`, a third-party action that runs `yarn install`, with postinstall scripts of `esbuild`, `supabase` (downloads a binary) and `unrs-resolver`;
- `apt-get`;
- every Supabase CLI call;
- `yarn playwright install --with-deps`.

Only the smoke step strips them (`:438`). The role these steps hold can push images, apply the root, change DNS and delete the stack. The ordering (build before install) is deliberate, but nothing requires the credentials to stay in the environment after the build.
**Fix:** After the build step, drop the credentials from the job environment:
```yaml
- name: "Drop the build credentials"
  run: |
    {
      echo "AWS_ACCESS_KEY_ID="
      echo "AWS_SECRET_ACCESS_KEY="
      echo "AWS_SESSION_TOKEN="
    } >> "$GITHUB_ENV"
```
The plan step then needs them back, so either move setup-node, setup-yarn, psql and the Supabase link above the "Plan" step with credentials cleared and re-assume right before the plan, or assume with `output-credentials: true` and pass them only to the Terraform and AWS-CLI steps through `env`. At minimum, assume the role again only after `setup-yarn-action` and the Playwright install have run. Add a guard test that no step between those installs and the next assumption runs with credentials in its environment.

### WR-06: The single approval is given before the plan or the pending migrations exist, so the reviewer approves a one-way migration push blind

**File:** `.github/workflows/deploy.yml:81-94`, `:261-292`; `infra/scripts/push-migrations.sh` (step 4 of the header)
**Issue:** The `staging` approval is granted at job start. The approval is then consumed, in one job and with no further human step, by:

- the image push;
- `terraform plan` (printed only for the log);
- `push-migrations.sh --confirmed-ref`, which pushes to the persistent project `cofbsatfrdysyphajsky` (one-way);
- the functions deploy;
- the apply.

`push-migrations.sh` documents the approval as standing "in for the typed ref". The typed ref was asked **after** the dry run had listed the pending versions. The approval is asked before anything is computed. The destroy workflow was split into two approvals for exactly this reason (F-01); the deploy path, which holds the only one-way write, has a single blind approval.
**Fix:** Add a gated plan job before the gated apply job: plan, dry-run of migrations, print both, approval 1. Then a second `staging` job that re-plans (no cross-job plan file), checks the same pending list, and then pushes, deploys and applies (approval 2). If one approval is kept by decision, record "the approval is given before the plan and the pending list are visible" as an accepted risk in `infra/README.md`, and correct the `--confirmed-ref` description in `push-migrations.sh`.

### WR-07: The README says a run waiting for approval is replaced by a newer one, but with workflow-level concurrency it holds the group

**File:** `infra/README.md:279-280` (also `:183-185`)
**Issue:** `concurrency` is set at workflow level (`deploy.yml:32-34`, `destroy.yml:42-44`). A run whose `deploy` job waits for review is already in progress: its `checks` job has run. With `cancel-in-progress: false` it is never replaced. Only a run *pending on the group* is replaced.

So a forgotten unapproved deploy holds `staging-aws` for up to the environment's wait limit. During that time it blocks every later deploy and every destroy, while the README tells the operator that a newer push supersedes it.
**Fix:** Change the Recovery bullet to say: "A run waiting for approval holds the group until it is approved, rejected or cancelled; reject or cancel a stale one before pushing again. A run waiting for the group is replaced by a newer one."

### WR-08: The `no-expression-in-run` guard misses any expression that contains a `}`

**File:** `infra/scripts/workflowGuards.ts:66`, `:178`
**Issue:** `EXPRESSION = /\$\{\{[^}]*\}\}/` stops at the first `}`. Reproduced with node: `` echo ${{ format('{0}', github.head_ref) }} `` gives `false`, while `` echo ${{ github.head_ref }} `` gives `true`. The `format()` form is the usual way to build strings, and it is exactly the script-injection shape the rule exists to stop. Any `{…}` inside the expression evades the guard.
**Fix:** Test for the opener alone: `const EXPRESSION = /\$\{\{/;`. Report the line with a slice of the text. Add a faulty-copy test with a `format('{0}', …)` expression.

### WR-09: Impossible-state guard: the deploy job's `if: github.event_name != 'pull_request'`

**File:** `.github/workflows/deploy.yml:85`
**Category:** necessity
**Issue:** The guarded event cannot occur. `deploy.yml`'s only triggers are `push` and `workflow_dispatch` (`:22-28`), and `deploy-workflow.test.ts:93` already asserts that `pull_request` is not among them. The `if` adds nothing. It also suggests that a pull-request path exists and is being defended against, and `deploy-workflow.test.ts:138` pins it in place.
**Fix:** Remove the `if` and the assertion at `deploy-workflow.test.ts:138`. The trigger assertion at `:93` is the real guard.

### WR-10: The `--confirmed-ref` gate takes its "environment" from a variable that a repository or organisation variable of the same name also satisfies

**File:** `.github/workflows/deploy.yml:269`; `infra/scripts/push-migrations.sh` (the `--confirmed-ref` refusals)
**Issue:** `vars.DEPLOY_ENVIRONMENT` resolves the environment variable first, then the repository variable, then the organisation variable. So any job in any workflow sees `staging` if someone ever adds a repository variable `DEPLOY_ENVIRONMENT=staging` (for example for another workflow). A workflow can also simply write `OPENVAA_DEPLOY_ENVIRONMENT: staging` as a literal. The check proves no environment, and from a workstation `GITHUB_ACTIONS=true OPENVAA_DEPLOY_ENVIRONMENT=staging` bypasses the typed confirmation entirely.

The real boundary is the environment-only `SUPABASE_DB_PASSWORD`. The script header and `infra/README.md` describe the variable check as if it were that boundary.
**Fix:** Describe the check as a guard against accidental use, not as proof of the environment. Name the database password, an environment secret, as the actual gate. Optionally also require `GITHUB_RUN_ID` and `GITHUB_REF` matching `refs/heads/deploy/staging` or `refs/heads/deploy-evidence/*`. That is still self-asserted, but narrower.

## Info

### IN-01: Redundant `if` on `apply-destroy`, and a redundant `github.ref` clause on both destroy jobs

**File:** `.github/workflows/destroy.yml:50`, `:224`
**Category:** necessity
**Issue:** `apply-destroy` has `needs: plan-destroy`. An `if` without a status function implies `success()`, so when `plan-destroy` is skipped, `apply-destroy` is skipped anyway, and repeating the condition adds nothing. The `github.ref == 'refs/heads/deploy-evidence/destroy-staging'` clause repeats the push trigger's only branch (`:30-32`). It is arguably defense in depth against a trigger edit, and that judgment is why this is Info.
**Fix:** Keep the full condition on `plan-destroy` only, and let `needs` carry it to `apply-destroy`.

### IN-02: The wrong-subject proof accepts any named STS error, so a mistyped role ARN or a missing OIDC provider also "passes"

**File:** `.github/workflows/infra-plan.yml:285-300`
**Issue:** STS answers `AccessDenied` for a role that does not exist, and `InvalidIdentityToken` for a missing provider. Both satisfy `[ -n "$deploy_code" ]`, so the run is green even if `AWS_PLAN_ROLE_ARN` is mistyped. The PR plan and deploy runs act as positive controls for the same ARNs, which keeps this Info.
**Fix:** Require `deploy_code = AccessDenied` and `plan_code = AccessDenied`, and cross-reference the record of the same-ARN positive runs in the evidence.

### IN-03: The `staging` branch policy also admits `deploy-evidence/destroy-staging`, so "no Supabase token in a destroy job" holds only for the workflow text

**File:** `.github/workflows/destroy.yml:3-8`; `infra/README.md:194`, `:199-200`
**Issue:** `deploy-evidence/*` matches the destroy branch. A destroy-branch commit whose `destroy.yml` names `environment: staging` would receive `SUPABASE_ACCESS_TOKEN` once approved. The approval prompt names the environment, so this is a reviewer-attention matter rather than a hole.
**Fix:** Give the destroy branch a prefix the `staging` policy does not admit (for example `destroy-evidence/staging`, admitted only by `staging-destroy`), or record the dependency on the approval prompt.

### IN-04: Account-wide scopes beyond the stack: `ecs:DeregisterTaskDefinition` on `*`, application-autoscaling writes on `scalable-target/*`, `sns:Subscribe`/`SetTopicAttributes` on the topic

**File:** `infra/modules/github-oidc/deploy-policies.tf:332-337`, `:649-663`, `:586-603`
**Issue:**

- The role can deregister any family's task definitions in the account (relevant once a second environment shares the account).
- It can register or deregister any scalable target. Application Auto Scaling's own check of `ecs:UpdateService` on the target limits this for ECS services only.
- It can subscribe any endpoint to, or rewrite the policy of, the deployment topic.
**Fix:** Add `application-autoscaling:service-namespace = ecs` and `application-autoscaling:scalable-dimension = ecs:service:DesiredCount` conditions. Note the account-wide task-definition remainder in "Accepted risks".

### IN-05: The function read-back has no time limit and does not check which slugs are served

**File:** `.github/workflows/deploy.yml:314-352`
**Issue:**

- `curl` has no `--max-time`, so a stalled Management API call holds the job until its 60-minute timeout. That happens after migrations were pushed.
- The check counts three ACTIVE functions with matching `verify_jwt`, but never checks that the slugs are the three directories of `apps/supabase/supabase/functions`. A stale function under an old name, alongside a skipped one, would still count as three.
**Fix:** Add `--max-time 20`. Compare the sorted slugs with `ls apps/supabase/supabase/functions | grep -v '^_'`.

### IN-06: The example-root mocks name `test.example.org`/`openvaa-test` while the root's tfvars use `vaa.example.org`/`openvaa-example`

**File:** `infra/envs/example/aws/tests/plan.tftest.hcl:8-99`
**Issue:** The `domain_validation_options` defaults are keyed by `origin.test.example.org` and `test.example.org`, but the root looks them up by `origin.vaa.example.org` and `vaa.example.org`. The test passes only because under `command = plan` those attributes stay unknown, so the mock values are never used. The comment says they "get the one its domain would have", which is not what happens.
**Fix:** Use the tfvars names in the mocks, or drop the unused mock defaults and their comment.

### IN-07: The pipeline alert has nowhere to go during a deploy from nothing

**File:** `.github/workflows/deploy.yml:528-532`
**Issue:** The topic ARN is a literal. After the real destroy, a deploy-from-nothing run that fails before its apply publishes to a topic that does not exist (`NotFound`). If it fails after the apply, it publishes to a new, unconfirmed subscription. Either way no mail arrives for that run, and only `alert_error=` in the log records it.
**Fix:** Note it under H10 in the runbook: watch the run in the Actions page, and confirm the subscription before relying on the alert.

### IN-08: The secret-scan exclusions are whole test files

**File:** `.github/trufflehog-exclude-paths.txt:31-32`
**Issue:** Two measured URI false positives are suppressed by excluding both files entirely. Any real credential later added to `mailedLink.test.ts` or `signInLink.test.ts` would go unscanned.
**Fix:** If the scanner supports it, use a line-level or detector-scoped allowance (`trufflehog:ignore` on the fixture line). Otherwise keep this as is, with a note to re-measure when either file changes.

---

_Reviewed: 2026-11-15T06:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
