---
phase: 187-deploy-pipeline
plan: "01"
subsystem: infra
tags: [terraform, aws-iam, github-oidc, deploy-role, terraform-test]
status: complete

requires:
  - phase: 185
    provides: "frontend-service module names, frontend-task-role execution role, github-oidc deploy role"
provides:
  - "Nine customer-managed deploy-role policies (openvaa-deploy-*) attached to the deploy role, written but not applied"
  - "ecr:DescribeImages in the image push policy"
  - "github-oidc inputs aws_account_id, aws_region, frontend_execution_role_arn, hosted_zone_id, domain, wired from bootstrap"
  - "bootstrap inputs deploy_hosted_zone_id and deploy_domain, set in the tracked tfvars"
  - "The github-oidc module's first offline terraform test (8 runs)"
affects: [187-16 hand apply of bootstrap, deploy workflow, destroy workflow, PIPE-08]

actuals:
  tokens: 9950
  tasks: 3
  commits: 3
plan_head_before: 5601c036d64f105dc05ec05c5a7048c970616550
plan_head_after: ee3bf95c39fe20be649a731204d034cfff5e845d

tech-stack:
  added: []
  patterns:
    - "Deploy-role policy per concern: data document -> aws_iam_policy under var.iam_path -> per-role attachment"
    - "Offline module test: real aws provider with fake keys and skips, command = plan, assertions on jsondecode(policy) with flatten([s.Action])"
    - "Tag conditions written once as dynamic condition blocks over local.root_tags"

key-files:
  created:
    - infra/modules/github-oidc/deploy-policies.tf
    - infra/modules/github-oidc/tests/github_oidc.tftest.hcl
  modified:
    - infra/modules/github-oidc/variables.tf
    - infra/modules/github-oidc/policies.tf
    - infra/bootstrap/main.tf
    - infra/bootstrap/variables.tf
    - infra/bootstrap/terraform.tfvars
    - infra/bootstrap/example.tfvars

key-decisions:
  - "Network creates are split by what IAM evaluates: new resources need the request tags; a create that names a parent (subnet, route table, security group in a VPC; a rule in a security group) also needs the root's tags on that parent"
  - "creates_carry_request_tags checks an explicit list of the calls that create a tagged resource; CreateRoute, CreateTags on an existing resource, CreateListener and CreateRule fall outside it (untaggable or name-scoped)"
  - "Load balancer and target group creates are scoped both by name ARN and by the request tags"
  - "bootstrap example.tfvars gained stand-ins for the two new required inputs"

requirements-completed: [PIPE-01, PIPE-05, PIPE-06, INFRA-16]

coverage:
  - id: D1
    description: "Nine deploy policies, each at most 6,144 non-whitespace characters, under /openvaa/ and named openvaa-deploy-<concern>"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#policy_sizes"
        status: pass
  - id: D2
    description: "iam:PassRole is the only IAM action, on the execution role only, for ecs-tasks.amazonaws.com"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#iam_actions_are_pass_role_only, #pass_role_scope"
        status: pass
  - id: D3
    description: "No S3, SSM, Secrets Manager, KMS or log-event read in any deploy policy"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#no_state_or_secret_reads"
        status: pass
  - id: D4
    description: "Record changes in one zone, types A/AAAA/CNAME, the frontend's names only"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#dns_scope"
        status: pass
  - id: D5
    description: "ecr:DescribeImages on the one repository"
    requirement: PIPE-05
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#ecr_describe_images"
        status: pass
  - id: D6
    description: "sns:Publish on the deployment topic only, for the pipeline failure alert"
    requirement: INFRA-16
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#alert_policy"
        status: pass
  - id: D7
    description: "Every tagged create requires Project=openvaa and Root=aws on the request"
    requirement: PIPE-01
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/github-oidc test#creates_carry_request_tags"
        status: pass
  - id: D8
    description: "bootstrap validates with every new input wired; the tracked tfvars hold the zone id and domain"
    requirement: PIPE-06
    verification:
      - kind: other
        ref: "terraform -chdir=infra/bootstrap validate (fresh TF_DATA_DIR, init -backend=false -lockfile=readonly)"
        status: pass

duration: 9min
completed: 2026-11-15
---

# Phase 187 Plan 01: Deploy-role policies Summary

**Nine customer-managed deploy-role policies under `/openvaa/`, scoped by the frontend-service names, the root's `Project`/`Root` tags and the one staging zone, plus `ecr:DescribeImages`. All of it is written and asserted offline by the module's first `terraform test`, and none of it is applied.**

## Policies and their non-whitespace sizes

Measured with `length(replace(policy, "/\\s/", ""))` on the test's stand-in inputs. The account id, zone id and domain have the same lengths as the real values, so the real sizes match.

| Policy | Size (limit 6,144) |
|---|---|
| `openvaa-deploy-network` | 3,310 |
| `openvaa-deploy-load-balancing` | 1,713 |
| `openvaa-deploy-ecs` | 963 |
| `openvaa-deploy-pass-role` | 273 |
| `openvaa-deploy-edge` | 1,548 |
| `openvaa-deploy-dns` | 694 |
| `openvaa-deploy-observability` | 1,378 |
| `openvaa-deploy-scaling` | 954 |
| `openvaa-deploy-alert` | 195 |
| (existing) `openvaa-ecr-push`, with `ecr:DescribeImages` | 427 |

The deploy role now has 11 managed-policy attachments (`grep -c 'role *= aws_iam_role.deploy.name'` prints 11), within the default quota of 20.

## Performance

- **Duration:** about 9 min (2026-11-15T01:38:41Z to 01:47:49Z)
- **Tasks:** 3 of 3
- **Files:** 2 created, 6 modified

## Accomplishments

- `github-oidc` gained five validated string inputs. Every policy JSON is therefore known at plan time and can be asserted offline.
- `deploy-policies.tf` holds nine policies, each with its own attachment. It has no inline policy and no `iam:` action other than `iam:PassRole`.
- Bootstrap passes the account, region, `module.frontend_task_role.execution_role_arn`, zone and domain to the module. The tracked tfvars gained two public values.
- `tests/github_oidc.tftest.hcl` has 8 runs, and all of them pass. Each assertion was mutation-checked in a scratch copy. Each of these changes failed the run named after it:
  - adding `iam:CreateRole`
  - adding `s3:GetObject` or `logs:FilterLogEvents`
  - adding an untagged `acm:RequestCertificate`
  - adding `MX` to the record types
  - removing `ecr:DescribeImages`
  - changing `iam:PassedToService`

## Task Commits

1. **Task 1 (tracer): alert permission end to end:** `79033c838` (feat). The tracer gate re-ran `<verify>` end to end and it passed, so the plan continued.
2. **Task 2: public inputs in the bootstrap tfvars:** `f58ce773a` (chore)
3. **Task 3: the other eight concern policies, `ecr:DescribeImages`, assertions:** `ee3bf95c3` (feat)

## Verification

- `terraform -chdir=infra/modules/github-oidc init -backend=false` passed, then `validate` passed, then `test`: `Success! 8 passed, 0 failed.`
- `terraform -chdir=infra/bootstrap init -backend=false -input=false -lockfile=readonly` followed by `validate`: valid (run in a fresh `TF_DATA_DIR`, see Deviations)
- `terraform fmt -check -recursive infra`: clean
- `node scripts/assert-no-inline-iam-policies.mjs`: 58 files, 0 findings. `--self-test`: pass.
- `yarn test:unit:infra`: 3 files, 102 tests passed
- Nothing was applied and no AWS call was made. The test provider uses fake keys and skips every account call.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] bootstrap `example.tfvars` stand-ins**
- **Found during:** Task 2
- **Issue:** `deploy_hosted_zone_id` and `deploy_domain` are required inputs with no default. A fork that copies `example.tfvars` would fail at plan.
- **Fix:** Added stand-ins (`Z00000000000000000000`, `vaa.example.org`) with a two-line comment.
- **Files modified:** `infra/bootstrap/example.tfvars`
- **Commit:** `f58ce773a`

**2. [Rule 1 - Correctness] Network creates split by evaluated resource**
- **Found during:** Task 3
- **Issue:** The plan's first network statement put every create action on every network type with request tags only. That statement alone would allow, for example, `CreateSubnet` in any VPC, so a separate parent-tag statement would add nothing.
- **Fix:** The creates are now four statements:
  - `CreateTaggedVpc`: `CreateVpc` and `CreateInternetGateway` on vpc and internet-gateway
  - `CreateTaggedResource`: subnet, route table and security group creates on their own new types
  - `CreateTaggedRule`: `Authorize*` on security-group-rule
  - `CreateInTaggedParent`: the same creates on the parent vpc or security-group, with both the request tags and the resource tags

  `TagOnCreate` (`ec2:CreateTags` with `ec2:CreateAction`) and `ChangeTaggedNetwork` (resource tags) follow the plan.
- **Files modified:** `infra/modules/github-oidc/deploy-policies.tf`
- **Commit:** `ee3bf95c3`

**3. [Rule 1 - Test predicate] `creates_carry_request_tags` uses an explicit list of tagged creates**
- **Found during:** Task 3
- **Issue:** The plan's own statements put `ec2:CreateRoute` and `ec2:CreateTags` in the resource-tag statement, and `elasticloadbalancing:CreateListener` and `CreateRule` in the name-scoped statement. A prefix predicate on `ec2:Create` or `elasticloadbalancing:Create` would therefore fail on statements the plan prescribes.
- **Fix:** The run checks the 12 calls that create a tagged resource. These are the five ec2 creates, the two `Authorize*` calls, `CreateLoadBalancer`, `CreateTargetGroup`, `CreateDistribution`, `CreateDistributionWithTags` and `RequestCertificate`. A second assertion requires every one of them to be granted, so the check cannot pass on an empty set.
- **Commit:** `ee3bf95c3`

**4. [Rule 3 - Environment] bootstrap init in a scratch `TF_DATA_DIR`**
- **Found during:** Task 1
- **Issue:** The operator's `infra/bootstrap/.terraform/` was initialised against the S3 backend by the hand applies. `init -backend=false` in that directory still tried to configure the S3 backend, and failed with `No valid credential sources found` (an IMDS probe only, with no account reached).
- **Fix:** Bootstrap `init`/`validate` ran with `TF_DATA_DIR` set to a scratchpad directory. This is equivalent to the clean checkout CI uses, and it leaves the operator's `.terraform/` untouched.

**Total deviations:** 4 (one Rule 2, two Rule 1, one Rule 3). None is architectural.

## Notes for plan 187-16 (simulator and CloudTrail cross-check)

- `ec2:AuthorizeSecurityGroupIngress` with `prefix_list_id` may also be evaluated against the AWS-owned `prefix-list` resource, which carries no `openvaa` tags. If the simulator shows a denial there, it needs an action on `arn:aws:ec2:<region>:aws:prefix-list/*`.
- Assumptions A1 and A2 from the research still stand. They cover whether the action catalogue is complete and how the CloudFront, ACM and Route 53 condition keys behave, and the simulator is where they are checked.

## Known Stubs

None.

## Threat Flags

None. The mitigations for T-187-01, T-187-02 and T-187-03 are implemented and asserted by `iam_actions_are_pass_role_only`, `pass_role_scope`, `no_state_or_secret_reads` and `dns_scope`.

## Self-Check: PASSED

- FOUND: infra/modules/github-oidc/deploy-policies.tf
- FOUND: infra/modules/github-oidc/tests/github_oidc.tftest.hcl
- FOUND: 79033c838, f58ce773a, ee3bf95c3 (ancestors of HEAD)
