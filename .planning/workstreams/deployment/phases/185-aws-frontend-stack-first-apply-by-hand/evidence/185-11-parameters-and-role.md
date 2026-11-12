# 185-11 evidence: the frontend's parameters and its execution role, read back

PARAMETERS=2 type=SecureString key=alias/aws/ssm root_tag=absent
POSTHOG_KEY=real
BOOTSTRAP_APPLY=yes second_plan_exit=0
ROLE_INLINE_POLICIES=0
ROLE_SIMULATOR_OWN_PATH=allowed
ROLE_SIMULATOR_OTHER_PATH=implicitDeny
INVENTORY_NO_INLINE_USERS_EXIT=0
INVENTORY_NO_INLINE_UNDER_OPENVAA_EXIT=0
ROLE_ARN_MATCHES_TFVARS=yes
SERVICE_LINKED_ROLES=AWSServiceRoleForInternetMonitor,AWSServiceRoleForOrganizations,AWSServiceRoleForResourceExplorer,AWSServiceRoleForSSO,AWSServiceRoleForSupport,AWSServiceRoleForTrustedAdvisor

- **Date (UTC):** 2026-11-12
- **Attempts:** `20261112T185000Z.2a494b5af` (key `185-11-1`, the parameters, Step 2 of `infra/envs/staging/aws/README.md`) and `20261112T193809Z.6ef5b0568` (key `185-11-2`, the role, Step 8 of `infra/bootstrap/README.md`)
- **Who did what:** the operator created the two parameters and applied bootstrap's additive plan, each in their own terminal, and pasted the named lines; the replies were stored in the two attempt files. The executor appended `OPERATOR_REPLY=received attempt=<id> plan=185-11 task=1` and `... task=2` to them (`attempt.sh bound` exits 0 for both), then ran the read-back below itself. It applied nothing.
- **How the read-back ran:** one shell, `AWS_PROFILE=openvaa-admin`, `AWS_REGION=eu-north-1`, the key variables unset, raw output in a private `mktemp -d` directory outside the repository, removed at the end (`s3_logs_removed=yes`). The caller's account read 471112560111 (`s3_account_read_exit=0`, `s3_account_match_exit=0`); its ARN was not printed. No parameter value was read: `describe-parameters` was queried for name, type and key id only (not `LastModifiedUser`, which is a session ARN), and the tags for their keys only.

## The parameters (Task 1, then the executor's read-back)

The operator's reply (attempt `20261112T185000Z.2a494b5af`), every status 0:

```
answer_posthog_kind=real
s2_account_read_exit=0
s2_account_match_exit=0
s2_anon_put_exit=0
s2_posthog_put_exit=0
s2_describe_exit=0
s2_parameter=/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY SecureString alias/aws/ssm
s2_parameter=/openvaa/staging/frontend/PUBLIC_SUPABASE_ANON_KEY SecureString alias/aws/ssm
s2_tags_anon_exit=0
s2_tag_names_anon=Environment,Project
s2_tags_posthog_exit=0
s2_tag_names_posthog=Environment,Project
s2_ssm_key_exit=0
s2_logs_removed=yes
```

The executor's read-back:

```
p_describe_exit=0
p_parameter=/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY SecureString alias/aws/ssm
p_parameter=/openvaa/staging/frontend/PUBLIC_SUPABASE_ANON_KEY SecureString alias/aws/ssm
p_count=2
p_tags_exit_PUBLIC_SUPABASE_ANON_KEY=0
p_tag_keys_PUBLIC_SUPABASE_ANON_KEY=Environment,Project
p_tags_exit_ANALYTICS_POSTHOG_KEY=0
p_tag_keys_ANALYTICS_POSTHOG_KEY=Environment,Project
p_kms_describe_exit=0
p_kms=AWS Enabled
```

Two parameters under `/openvaa/staging/frontend/`, both SecureString under `alias/aws/ssm`, which `kms describe-key` reads as an AWS-managed key, enabled. Each carries the tag keys `Environment` and `Project` and no `Root`, so the destroy check, which lists `Root=aws`, does not list them. The PostHog value is the real project key (`answer_posthog_kind=real`), not a stand-in.

## The bootstrap apply (Task 2)

The operator's reply (attempt `20261112T193809Z.6ef5b0568`):

```
s8_account_match_exit=0
s8_alert_set_exit=0
s8_init_exit=0
s8_plan_exit=2
s8_plan_line=Plan: 5 to add, 0 to change, 0 to destroy.
s8_show_exit=0
s8_planned=create module.frontend_task_role.aws_iam_policy.parameters
s8_planned=create module.frontend_task_role.aws_iam_role.execution
s8_planned=create module.frontend_task_role.aws_iam_role_policies_exclusive.execution
s8_planned=create module.frontend_task_role.aws_iam_role_policy_attachment.managed
s8_planned=create module.frontend_task_role.aws_iam_role_policy_attachment.parameters
s8_apply_exit=0
s8_apply_line=Apply complete! Resources: 5 added, 0 changed, 0 destroyed.
s8_second_plan_exit=0
s8_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution
s8_logs_removed=yes
answer_applied=yes
```

The plan met Step 8's stop rule before it was applied: status 2, the line `5 to add, 0 to change, 0 to destroy`, and five `create` lines, each under `module.frontend_task_role`. The apply exited 0 with five added, and the second plan exited 0, no change. The operator's notes: the first plans exited 1 with `No value for required variable` for `alert_email`, because the variable was set in the shell but not exported (`printenv` exit 1); after the export (`printenv` exit 0) the plan above ran. An indented paste of item 2 split its `jq` filter into two arguments; the unindented paste ran cleanly.

## The role (the executor's read-back, Step 3 of the staging AWS runbook)

```
s3_get_role_exit=0
s3_role_path=/openvaa/
s3_role_trust=ecs-tasks.amazonaws.com
s3_role_trust_actions=sts:AssumeRole
s3_role_tag_keys=Environment,ManagedBy,Project,Root
s3_role_arn_matches_tfvars_exit=0
s8_role_arn_matches_tfvars_exit=0
s3_attached_exit=0
s3_attached=AmazonECSTaskExecutionRolePolicy,openvaa-staging-frontend-parameters
s3_attached_arn=arn:aws:iam::471112560111:policy/openvaa/openvaa-staging-frontend-parameters
s3_attached_arn=arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
s3_inline_exit=0
s3_inline_count=0
s3_simulate_own_exit=0
s3_own_path_decision=allowed
s3_simulate_other_exit=0
s3_other_path_decision=implicitDeny
```

- The role lies under `/openvaa/` and its trust policy admits `ecs-tasks.amazonaws.com` alone, for `sts:AssumeRole`.
- It carries the AWS-managed `AmazonECSTaskExecutionRolePolicy` and the customer-managed `openvaa-staging-frontend-parameters` (under `/openvaa/`), and no inline policy.
- The simulator allows it `ssm:GetParameters` on `arn:aws:ssm:eu-north-1:471112560111:parameter/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` and gives `implicitDeny` on `.../parameter/openvaa/staging/other/X`.
- The ARN `get-role` returns equals `execution_role_arn` in `infra/envs/staging/aws/terraform.tfvars`, and so does `s8_role_arn` (string equality, both 0).

## The account reads

```
s3_no_inline_user_policies_exit=0
s3_no_inline_under_openvaa_exit=0
assert: PASS: 3 IAM users, none with an inline policy
assert: PASS: 4 roles and users under /openvaa/, none with an inline policy
slr_exit=0
slr_names=AWSServiceRoleForInternetMonitor,AWSServiceRoleForOrganizations,AWSServiceRoleForResourceExplorer,AWSServiceRoleForSSO,AWSServiceRoleForSupport,AWSServiceRoleForTrustedAdvisor
```

Both inventory asserts exit 0, the account read of INFRA-17 repeated with the new role in place: four roles and users under `/openvaa/`, the new execution role among them, none with an inline policy. The inventory skips service-linked roles, so they were listed by name with `aws iam list-roles --path-prefix /aws-service-role/`: the six above. None is ECS's (`AWSServiceRoleForECS`); AWS creates that one when the account's first ECS cluster or service is created, so the first apply of the staging AWS root is expected to create it. That is a note for plan 185-12, not a finding against this plan.

## What is not in this file

No parameter value, no session ARN, no caller ARN and no address. The account id and the role's ARN are not secrets.

## The SSM key's creation

Read afterwards with the same lines (metadata only): `kms describe-key --key-id alias/aws/ssm` gives the key's creation time as 2026-11-12T19:36:00.642Z, and `describe-parameters` gives `PUBLIC_SUPABASE_ANON_KEY` version 1 at 19:36:00.626Z and `ANALYTICS_POSTHOG_KEY` version 1 at 19:36:16.802Z. AWS created the managed key with the first SecureString parameter that used it, 16 ms after that parameter.
