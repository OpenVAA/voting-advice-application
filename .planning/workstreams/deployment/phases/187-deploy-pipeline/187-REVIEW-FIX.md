---
phase: 187-deploy-pipeline
fixed_at: 2026-11-15T04:25:00Z
review_path: .planning/workstreams/deployment/phases/187-deploy-pipeline/187-REVIEW.md
iteration: 1
findings_in_scope: 19
fixed: 14
skipped: 5
status: partial
---

# Phase 187: Code Review Fix Report

**Fixed at:** 2026-11-15T04:25:00Z
**Source review:** .planning/workstreams/deployment/phases/187-deploy-pipeline/187-REVIEW.md
**Iteration:** 1

**Scope:** CR-01 and WR-01 to WR-10 as directed, and every Info finding judged for being cheap and
safe. WR-09 and IN-01 are necessity findings. Nothing under `apps/`, `packages/` or `tests/` was
changed: `git diff --quiet 54e79823b -- apps packages tests` exits 0.

**Summary:**

- Findings in scope: 19
- Fixed: 14 (CR-01, WR-01, WR-02, WR-03, WR-04, WR-05, WR-07, WR-08, WR-09, WR-10, IN-02, IN-04,
  IN-05, IN-06)
- Needs an operator decision: 1 (WR-06)
- Deferred: 3 (IN-01, IN-03, IN-08)
- No change needed: 1 (IN-07, already recorded)

**Where verification ran:** in the main checkout (`workflow.use_worktrees` is false). No worktree was
created. Every gate below can be reproduced from the tree at the last fix commit.

## Fixed Issues

### CR-01: The CloudFront and ACM tag scope can be bypassed

**Status:** fixed: requires human verification (IAM evaluation, offline only until Step 9 and the
deploy from nothing)
**Files modified:** `infra/modules/github-oidc/deploy-policies.tf`,
`infra/modules/github-oidc/tests/github_oidc.tftest.hcl`, `infra/bootstrap/README.md`,
`infra/README.md`
**Commit:** f0b2287f2
**Applied fix:**

- `cloudfront:TagResource` and `acm:AddTagsToCertificate` are no longer in any statement that tests
  only `aws:RequestTag`. Both sit in one new statement, `TagOwnedEdge`, which requires
  `aws:ResourceTag/Project=openvaa` and `aws:ResourceTag/Root=aws`. A distribution or certificate
  without both tags can no longer be tagged and then changed.
- The create path still works. The IAM condition-key reference says of `aws:ResourceTag`: "This
  key is included in the request context when the requested resource already has attached tags or
  in requests that create a resource with an attached tag"
  (docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html). So
  `CreateDistributionWithTags` and `RequestCertificate` with tags pass the tag check on the tags they
  attach.
- I used `Resource "*"` for `TagOwnedEdge`, because AWS does not document which resource the tag
  check inside a create is evaluated against. Only the tag conditions confine it.
- Two further defects in the same statements, found while reading the AWS documents:
  - CloudFront's developer guide says: "For the CreateDistribution action, specify the wildcard (*)
    character for the Resource instead of a wildcard for the distribution ARN"
    (AmazonCloudFront/latest/DeveloperGuide/security_iam_id-based-policy-examples.html). The service
    authorization reference lists `CreateDistribution` with no resource type. The old grant on
    `distribution/*` would therefore have refused the create. It is now granted on `"*"`, still with
    the request-tag conditions.
  - The service authorization reference also lists `acm:RequestCertificate` with no resource type.
    It is now granted on `"*"`, held to `acm:DomainNames` of the two names (`ForAllValues`) and to
    `aws:RequestedRegion` of the root's region and us-east-1, which keep the region scope the ARN
    used to give.
- Tests and runbook cases:
  - A new module test run, `edge_tag_scope`, pins the tag scope, the create resource and the
    request conditions.
  - Step 9 has six new simulator cases. Refused: `cloudfront:TagResource` on a foreign distribution,
    `acm:AddTagsToCertificate` on a foreign certificate, and a request for another name. Allowed:
    the create, a tag call on an owned distribution, and the viewer certificate request. Step 9 now
    expects seventeen decision lines.
  - A new "Not yet observed" row records that a create with tags passing on `aws:ResourceTag` is
    first seen at the deploy from nothing.
- What remains is a resource that already carries both tags, such as one from a second
  environment's AWS root. It is recorded under Accepted risks in `infra/README.md`.
- Not done from the review's suggestion, and why:
  - The Deny on a foreign `Root` value is not needed, because the allow itself now requires our
    tags.
  - The H1 read-back of untagged distributions and certificates is not needed, because those are
    no longer within the role's reach.

### WR-01: `CreateInTaggedParent` tested `aws:RequestTag` on the parent

**Status:** fixed: requires human verification (the real EC2 request context is first seen at the
deploy from nothing)
**Files modified:** `infra/modules/github-oidc/deploy-policies.tf`,
`infra/modules/github-oidc/tests/github_oidc.tftest.hcl`, `infra/bootstrap/README.md`
**Commit:** fab4d7f97
**Applied fix:**

- The EC2 service authorization reference (list_ec2.html) shows the cause:
  - The `vpc` row of CreateSubnet, CreateRouteTable and CreateSecurityGroup lists `aws:ResourceTag`
    and not `aws:RequestTag`.
  - The `security-group` row of AuthorizeSecurityGroupIngress is the same.
  - `aws:RequestTag` appears only on the created resource's row.
- The parent statement now tests the parent's resource tags only. The created resource must still
  carry the request tags, through `CreateTaggedResource` and `CreateTaggedRule`.
- A new module test run, `network_parent_scope`, pins the statement's shape. The existing request-tag
  test now leaves that statement out.
- Step 9 has two new simulator cases: a subnet in a VPC that carries the tags (allowed), and a subnet
  in an untagged VPC with only request tags (refused).
- The review also asked for a `--dry-run` under the deploy role. It is not feasible from the
  operator's shell, because the deploy role trusts only GitHub OIDC subjects. Step 9's text says the
  real context is first seen at the deploy from nothing.

### WR-02: A destroy could not be re-run after a partial destroy

**Status:** fixed
**Files modified:** `.github/workflows/destroy.yml`, `infra/scripts/destroy-workflow.test.ts`,
`infra/README.md`
**Commit:** 5e46441af
**Applied fix:**

- Both destroy jobs now pass the fixed placeholder digest `sha256:000…0`, which only satisfies the
  variable's form. The two "Read the digest the service runs" steps are gone, and `running-digest.txt`
  is gone from the cleanup.
- Tests assert that no destroy step reads a running digest, and that the plan step's environment
  holds the placeholder.
- For `infra-plan.yml` I took the review's first option: the pull-request plan keeps reading the
  running digest, and the README's Recovery now says it is red between a real destroy and the next
  deploy. Recovery also says how to finish a part-way destroy.

### WR-03: `check-destroy-plan.sh` passed an empty destroy and compared counts

**Status:** fixed: requires human verification (guard logic)
**Files modified:** `infra/scripts/check-destroy-plan.sh`, `infra/scripts/check-destroy-plan.test.ts`,
`infra/README.md`
**Commit:** 6db3a5507
**Applied fix:** The guard now requires:

- a `resource_changes` array; without one the plan is not a plan document and the guard prints
  `destroy_guard=fail` alone;
- at least one managed resource in the state;
- the sorted, unique set of deleted addresses (deposed objects excluded) to equal the state's managed
  addresses.

It prints `destroy_unmatched=<n>` as a sixth line. The two former "passes an empty …" cases are now
expected to fail. New cases cover a count-equal address mismatch and index keys that look like data
sources.

### WR-04: The alert named `setup` for failures after the migrations push

**Status:** fixed: requires human verification (stage mapping)
**Files modified:** `.github/workflows/deploy.yml`, `infra/scripts/deploy-workflow.test.ts`,
`infra/README.md`
**Commit:** acfcc20ca (extended by aea57c1e9 for the WR-05 steps)
**Applied fix:**

- Every step of the deploy job now has an `id`, and the alert maps each one to the stage it follows.
  The final mapping, after WR-05 added its steps:

  | Stage        | Steps                                                                              |
  | ------------ | ---------------------------------------------------------------------------------- |
  | `setup`      | checkout, credentials                                                              |
  | `build`      | build                                                                              |
  | `plan`       | drop-build-credentials, node, yarn, psql, terraform, plan-credentials, init, plan, show |
  | `migrations` | drop-plan-credentials, link, migrations                                            |
  | `functions`  | functions                                                                          |
  | `rollout`    | reassume, apply                                                                    |
  | `stable`     | stable                                                                             |
  | `smoke`      | drop-rollout-credentials, playwright, smoke, served-build                          |
  | `cleanup`    | cleanup                                                                            |

- A failed job with no failed step now reads `unknown` instead of `setup`.
- A test fails when any step before the alert lacks an id or a stage. I checked the mapping locally
  by running the alert script's stage loop in bash, with `reassume`, `playwright`, `show`, `psql`,
  `checkout`, `cleanup` and no step failing in turn.
- The README's "Reading a red run" now says which stages follow the migrations push, and has a
  `cleanup` row.

### WR-05: The deploy role's credentials reached install and CLI steps

**Status:** fixed: requires human verification (first observed on a real run)
**Files modified:** `.github/workflows/deploy.yml`, `infra/scripts/deploy-workflow.test.ts`,
`infra/README.md`
**Commit:** aea57c1e9
**Applied fix:**

- Three new steps empty `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` in
  `$GITHUB_ENV`: after the build, after the plan, and after the stable check.
- A new "Assume the deploy role for the plan" step comes before `init`. The apply and the alert
  already assumed the role again.
- The Node, Yarn, psql and Terraform setup moved to between the build and the plan's assumption. The
  stage order (build, plan, migrations, functions, apply, stable, smoke) is unchanged.
- As a result, none of these runs with the role's credentials: setup-yarn-action's `yarn install`,
  setup-terraform, psql, every Supabase CLI call, the Playwright install and the smoke run.
- A test walks the steps and fails when an install or Supabase CLI step holds the credentials, or
  when an AWS step lacks them. A red copy without the first drop step shows the test working.
- The old guard "writes nothing to $GITHUB_ENV" now admits exactly the three drop steps, each with its
  exact script and no `env`.

### WR-07: The README said a run waiting for approval is replaced

**Status:** fixed
**Files modified:** `infra/README.md`, `.github/workflows/deploy.yml` (comment)
**Commit:** e5e406e25
**Applied fix:**

- The Recovery bullet now says a run waiting for approval holds the group, and blocks every later
  deploy and destroy until it is approved, rejected or cancelled. It tells the operator to reject or
  cancel a stale run before pushing again.
- The order section and the workflow's concurrency comment now say the group is workflow-wide.

### WR-08: The `no-expression-in-run` guard missed expressions holding a brace

**Status:** fixed
**Files modified:** `infra/scripts/workflowGuards.ts`, `infra/scripts/infra-plan-workflow.test.ts`
**Commit:** 49d8ec823
**Applied fix:** The guard now tests for the opener `${{` alone and reports a slice of the script. A
new red copy, `echo ${{ format('{0}', github.head_ref) }}`, failed before the fix and passes after
it.

### WR-09: The deploy job guarded against a `pull_request` event

**Status:** fixed: requires human verification (necessity finding: code removed)
**Files modified:** `.github/workflows/deploy.yml`, `infra/scripts/deploy-workflow.test.ts`
**Commit:** 1cb0dbb27
**Applied fix:** Removed the deploy job's `if: github.event_name != 'pull_request'` and the
assertion that pinned it. The trigger assertion, which fails if `pull_request` is ever added, remains
the guard.

### WR-10: The `--confirmed-ref` gate was described as the environment boundary

**Status:** fixed
**Files modified:** `infra/scripts/push-migrations.sh`, `infra/scripts/push-migrations.test.ts`,
`.github/workflows/deploy.yml` (comment), `infra/README.md`, `infra/envs/staging/supabase/README.md`
**Commit:** 3cbb75298
**Applied fix:**

- Four places now describe the flag's conditions as a guard against a mistake that proves no
  environment: the script header (step 4, the flag's description, Prerequisites, exit 2), the
  workflow comment, and both READMEs. They name `SUPABASE_DB_PASSWORD`, an environment secret of
  `staging`, as the boundary.
- They also say the approval is given before the pending versions are listed. That is the
  documentation half of WR-06.
- The flag now also requires `GITHUB_REF` to be `refs/heads/deploy/staging` or a
  `refs/heads/deploy-evidence/` branch. New tests cover `main`, a look-alike branch, a tag, an empty
  ref and an evidence branch.

### IN-02: The wrong-subject proof accepted any named STS error

**Status:** fixed
**Files modified:** `.github/workflows/infra-plan.yml`, `infra/scripts/infra-plan-workflow.test.ts`,
`infra/README.md`
**Commit:** 5b8dc39b2
**Applied fix:** The proof now passes only when both roles answer `AccessDenied`, so
`InvalidIdentityToken` (a missing OIDC provider) fails it. The README notes that STS also answers
`AccessDenied` for a role that does not exist. The same-ARN positive runs are therefore what show
the ARNs are right.

### IN-04: Account-wide scopes in the scaling, ECS and topic grants

**Status:** fixed: requires human verification (IAM condition keys, first exercised by the deploy
from nothing)
**Files modified:** `infra/modules/github-oidc/deploy-policies.tf`,
`infra/modules/github-oidc/tests/github_oidc.tftest.hcl`, `infra/README.md`
**Commit:** 6bf28e0e1
**Applied fix:**

- I checked the service authorization reference (list_application-autoscaling.html). It lists
  `application-autoscaling:service-namespace` and `application-autoscaling:scalable-dimension` for
  the six scaling writes, and for neither TagResource nor UntagResource.
- The six writes now require `ecs` and `ecs:service:DesiredCount`. The two tag calls moved to a
  statement of their own, scoped by ARN only.
- A new module test run, `scaling_scope`, pins the conditions.
- The two remainders are recorded under Accepted risks: task definitions of any family, and the
  topic's subscriptions and policy.

### IN-05: The function read-back had no time limit and no slug check

**Status:** fixed
**Files modified:** `.github/workflows/deploy.yml`, `infra/scripts/deploy-workflow.test.ts`,
`infra/README.md`
**Commit:** 37116b9d4
**Applied fix:**

- `curl` now has `--max-time 20`.
- The sorted slugs served must equal the commit's function directories, found with `find … -type d
  ! -name '_*'`, so `.env.example` and any `_shared` directory are not counted. The comparison is
  printed as `functions_expected=` and `functions_served=`.
- The directory is only read. On this tree the expected slugs are `account-access`,
  `identity-callback` and `send-email`.

### IN-06: The example root's mocks named other domains and prefixes

**Status:** fixed
**Files modified:** `infra/envs/example/aws/tests/plan.tftest.hcl`
**Commit:** fae5efa8a
**Applied fix:** The mocks now use the tfvars names: `test.example.org` became `vaa.example.org`, and
`openvaa-test` became `openvaa-example`. With this, the mock comment is true.

## Needs an Operator Decision

### WR-06: The single approval comes before the plan or the pending migrations exist

**File:** `.github/workflows/deploy.yml` (the `deploy` job), `infra/scripts/push-migrations.sh`

**Why it is not fixed:** Closing it changes the shape of the pipeline. CONTEXT locks "one gated job
in `staging`" and the fixed C-03 step order. Neither the review's fix nor any alternative meets the
property, an approval given with the plan and the pending migrations in view, inside those decisions.

**Done within the decisions:** WR-10's commit (3cbb75298) corrects the `--confirmed-ref` description
in `push-migrations.sh`, the workflow comment and the Supabase runbook. They now state that the
approval is given when the job starts, before the pending versions are listed. I did not add an
"accepted risk" line, because that would pre-empt the decision.

**Options:**

1. **Two gated jobs in `staging`, as the destroy workflow is already split (F-01).**
   - Job 1 (approval 1): build and push, plan, a migrations dry run (`push-migrations.sh` gains a
     `--dry-run-only` mode that stops after printing `push_pending=`), and print both. It outputs the
     digest and the pending versions, neither of which is secret.
   - Job 2 (approval 2): plan again with the same digest, so that no plan file crosses jobs. Refuse
     if the dry run's pending list differs from job 1's. Then push, deploy the functions, apply,
     check stability and run the smoke entry.
   - Cost: a second approval on every deploy, a second plan, and a rewrite of the step-order tests
     and of plans 187-14 to 187-25's expectations of the run's shape.
2. **Keep one approval and record it as an accepted risk.** Add "the approval is given before the
   plan and the pending list are visible; the reviewer approves the commit, whose
   `apps/supabase/supabase/migrations/` diff since the last deploy is the pending list" under
   Accepted risks in `infra/README.md`. Cheapest. It relies on the reviewer reading the commit diff.
3. **A pre-gate job with a read-only database credential.** A separate environment without review
   (for example `staging-plan`) holds a read-only database role's password and the plan role. It
   prints the plan and the pending list before the gated job asks for approval. One approval still
   covers it, but it needs a new hosted read-only role and another secret, so it is the most
   infrastructure for the least gain.

**Recommendation:** Option 1, decided before the first gated run (H7). The migration push is the
pipeline's only one-way write, the destroy path was split for the same reason, and no run has yet
been observed against the current shape, so changing it now costs no re-observation. If the operator
wants deploys to stay single-approval, Option 2 is the honest fallback.

## Deferred and Unchanged

### IN-01: The redundant `if` on `apply-destroy` (necessity)

**File:** `.github/workflows/destroy.yml:206` (line 224 when reviewed)
**Reason:** Deferred. This is a necessity finding on the job that destroys the stack. The review
itself calls the ref clause arguably defence in depth. Removing a guard condition from the
destructive job is a scope decision for the operator, not a fix.
**Original issue:** `needs: plan-destroy` already carries the condition, and the `github.ref` clause
repeats the push trigger's only branch.

### IN-03: The `staging` branch policy also admits `deploy-evidence/destroy-staging`

**File:** `.github/workflows/destroy.yml:3-8`; `infra/README.md`
**Reason:** Deferred, not cheap. Renaming the destroy branch to a prefix that the `staging` policy
does not admit changes the destroy trigger, the deploy workflow's exclusion, the environment branch
policies (hand-set in H2), the guard tests and the evidence plans. The review rates it a
reviewer-attention matter, because the approval prompt names the environment.
**Original issue:** A destroy-branch commit whose `destroy.yml` named `environment: staging` would
receive the Supabase token once approved.

### IN-07: The pipeline alert has nowhere to go during a deploy from nothing

**File:** `.github/workflows/deploy.yml` (alert step)
**Reason:** No change needed. `infra/README.md` § Accepted risks already says: "Between a real
destroy and the redeploy the alert topic does not exist, so a failure in that window sends no alert,
and the new subscription has to be confirmed again."
**Original issue:** The topic ARN is a literal, so a deploy from nothing that fails publishes to a
topic that does not exist yet, or to an unconfirmed subscription.

### IN-08: The secret-scan exclusions are whole test files

**File:** `.github/trufflehog-exclude-paths.txt:31-32`
**Reason:** Deferred. A line-level `trufflehog:ignore` allowance would mean editing the two fixture
files, which are under `apps/`, and this fix pass must leave `apps/`, `packages/` and `tests/`
unchanged. Re-measure when either file changes.
**Original issue:** A real credential later added to `mailedLink.test.ts` or `signInLink.test.ts`
would go unscanned.

## Verification

All gates ran in the main checkout on the tree at 6bf28e0e1. Each status was read directly from its
own command, not through a pipe:

| Gate                                                                                                                 | Result                                             |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `yarn test:unit:infra`                                                                                               | 0: 11 files, 314 tests (302 before this pass)       |
| `yarn lint:workflows` (actionlint container)                                                                         | 0: nothing found in 3 workflows                    |
| `terraform fmt -check -recursive infra`                                                                              | 0                                                  |
| `terraform test`, `infra/modules/github-oidc`                                                                        | 0: 11 passed (8 before this pass)                  |
| `terraform test`, `infra/modules/frontend-service`                                                                   | 0: 33 passed                                       |
| `terraform test`, `infra/envs/example/{aws,dns-mail,supabase}` (scratch `TF_DATA_DIR`, `init -backend=false`)        | 0, 0, 0: 1 passed each                             |
| `node scripts/assert-no-inline-iam-policies.mjs`                                                                     | 0: 58 files, 0 findings                            |
| `node scripts/assert-comment-hygiene.mjs`                                                                            | 0: 0 violations                                    |
| Prettier and ESLint on every changed file                                                                            | 0, 0                                               |
| `git diff --quiet 54e79823b -- apps packages tests`                                                                  | 0                                                  |

Not verifiable offline: the IAM changes (CR-01, WR-01, IN-04). Step 9's simulator evaluates only the
context it is given. The real request contexts are first seen at the hand apply (H1) and at the
pipeline's deploy from nothing after the real destroy (H10).

---

_Fixed: 2026-11-15T04:25:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
