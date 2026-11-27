# 187-16 — The bootstrap hand apply of the deploy permissions

Root: `infra/bootstrap`, Step 9 of `infra/bootstrap/README.md`. Names, counts and forms only: no login, no address, no credential, no resource id from a log.

## Task 1 — The tree the operator will apply, read-only (2026-11-15T20:05Z)

Run with no AWS credential in the shell (`AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` unset), Terraform 1.16.5, each status read on its own line:

- `terraform -chdir=infra/modules/github-oidc init -backend=false -input=false` exit 0, then `terraform -chdir=infra/modules/github-oidc test -no-color`: `Success! 11 passed, 0 failed.`
- `node_modules/.bin/vitest run --config infra/vitest.config.ts bootstrap-tfvars`: 1 file, 7 tests passed.
- `terraform -chdir=infra/bootstrap validate -no-color`: `Success! The configuration is valid.` The root's existing `.terraform/` (S3 backend recorded) was used as it was; no init was run in `infra/bootstrap`, so the operator's item 2 init finds it unchanged.

```
READ_AT=2026-11-15T20:05Z
MODULE_TEST_EXIT=0
BOOTSTRAP_GUARD_EXIT=0
BOOTSTRAP_VALIDATE_EXIT=0
APPLY_COMMIT=b2a3c5dbd8644076c59fe50f0cea844ca61452b9
ENVIRONMENTS_READ_BACK=yes
STEP9_PRESENT=yes
```

Readings:

- `APPLY_COMMIT` is the tree's HEAD when the gates ran. The last commit touching `infra/bootstrap` or `infra/modules/github-oidc` is `6bf28e0e1`; the two commits after plan 187-14 (`dff44d18f`, `b2a3c5dbd`) touch only the evidence files of plans 187-17 and 187-15, so any later HEAD whose `git diff --quiet b2a3c5dbd -- infra` exits 0 applies the same code.
- `ENVIRONMENTS_READ_BACK=yes`: plan 187-14's evidence holds `ENV_STAGING_ADMIN_BYPASS=false` and `ENV_STAGING_DESTROY_ADMIN_BYPASS=false` (read 2026-11-15T19:59Z), so the `staging-destroy` subject the new deploy trust names belongs to an environment that exists and is protected.
- `STEP9_PRESENT=yes`: the runbook holds `## Step 9: The deploy role's permissions, the id conditions and the plan role's lock`, items 1 to 7.

### The reply's line forms against the attempt screen

Every line form Step 9 prints, with its expected values, was passed through `attempt.sh put` in a throwaway `ATTEMPT_DIR` (removed afterwards). Every key passes rule 2: no field's last word is a secret word (`s9b_pass_ecs_exit` and `s9a_add_address=...deploy_pass_role` end in `exit` and `address`; `s9c_uncovered_count`, `answer_step9` and the unstripped `token.actions.githubusercontent.com:` condition form pass too).

One value form is refused. The two Route 53 decision lines of item 3 (cases `dns_a` and `dns_mx`) print the simulator's resource name `arn:aws:route53:::hostedzone/Z02494181MAM7OCUAIPKC`, in which `hostedzone/Z02494181MAM7OCUAIPKC` is a run of 32 base64 characters holding a capital, a lower-case letter and a digit, so rule 3 refuses the line (`class=token-shape`, exit 3) and with it the whole reply. The same line with the `/` after `hostedzone` given as a space passes (exit 0), as does a line naming the case label, the action and the decision only. Raised at the checkpoint for the orchestrator to settle before the operator runs item 3; the runbook was not changed by this task.

```
SCREEN_KEYS=pass
SCREEN_DNS_DECISION_LINES=refused-token-shape
```

## Task 2 — The operator's Step 9 sitting (2026-11-16)

The operator ran Step 9 items 1 to 7 in their own terminal, a zsh shell signed in with the admin profile, on 2026-11-16 before 07:01Z, when the orchestrator stored the reply with `attempt.sh put 187-16-2` (exit 0). The reply carries no clock time of its own. `attempt.sh bound 187-16-2 OPERATOR_REPLY plan=187-16 task=2` exited 0 when Task 3 began (2026-11-16T07:05Z).

```
OPERATOR_REPLY=received attempt=20261115T200552Z.81f16e2ae plan=187-16 task=2
REPLY_STORED_AT=2026-11-16T07:01Z
BOUND_EXIT=0
RUN_HEAD=14d497af16dd38cc81f36f29059f4595f65e7bfd
RUN_HEAD_INFRA_DIFF_FROM_APPLY_COMMIT=infra/bootstrap/README.md
```

`RUN_HEAD` is the checkout's current HEAD, taken as the HEAD the operator ran at: the reply names no commit. It is not `APPLY_COMMIT`. Between the two, `infra/` changed only in `infra/bootstrap/README.md`, by `1e10dff7f`, which prints the hosted zone id apart in item 3's decision lines (`git diff --quiet b2a3c5dbd HEAD -- infra ':!infra/bootstrap/README.md'` exit 0). The reply's Route 53 decision lines read `hostedzone Z02494181MAM7OCUAIPKC`, the form `1e10dff7f` introduced, so the operator ran a runbook at or after it; `git diff --quiet 1e10dff7f HEAD -- infra` exits 0, so every HEAD in that range holds the same `infra/` tree, and the Terraform code applied is that of `APPLY_COMMIT`.

The reply, as stored (the operator's `note:` lines included):

```
answer_attempt=20261115T200552Z.81f16e2ae
answer_step9=applied
note: a first item 2 used another alert address (budget notification change, s9a_change=4, s9a_addresses_match_exit=1); not applied; items 1-2 rerun with the address the budget holds
note: the paste printed s9a_add=18 twice on one line; recorded once
s9_account_read_exit=0
s9_account_match_exit=0
s9_alert_set_exit=0
s9a_init_exit=0
s9a_plan_exit=2
s9a_plan_line=Plan: 18 to add, 3 to change, 2 to destroy.
s9a_show_exit=0
s9a_add=18
s9a_change=3
s9a_destroy=2
s9a_replace=0
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_alert
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_dns
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_ecs
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_edge
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_load_balancing
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_network
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_observability
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_pass_role
s9a_add_address=module.github_oidc.aws_iam_policy.deploy_scaling
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_alert
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_dns
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_ecs
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_edge
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_load_balancing
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_network
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_observability
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_pass_role
s9a_add_address=module.github_oidc.aws_iam_role_policy_attachment.deploy_scaling
s9a_change_address=module.github_oidc.aws_iam_policy.ecr_push
s9a_change_address=module.github_oidc.aws_iam_role.deploy
s9a_change_address=module.github_oidc.aws_iam_role.plan
s9a_destroy_address=module.github_oidc.aws_iam_policy.plan_lock
s9a_destroy_address=module.github_oidc.aws_iam_role_policy_attachment.plan_lock
s9a_addresses_match_exit=0
s9b_policies=11
s9b_vpc_tagged_exit=0
s9b_decision=ec2:CreateVpc arn:aws:ec2:eu-north-1:471112560111:vpc/vpc-00000000000000000 allowed
s9b_vpc_untagged_exit=0
s9b_decision=ec2:CreateVpc arn:aws:ec2:eu-north-1:471112560111:vpc/vpc-00000000000000000 implicitDeny
s9b_subnet_in_tagged_vpc_exit=0
s9b_decision=ec2:CreateSubnet arn:aws:ec2:eu-north-1:471112560111:vpc/vpc-00000000000000000 allowed
s9b_subnet_in_foreign_vpc_exit=0
s9b_decision=ec2:CreateSubnet arn:aws:ec2:eu-north-1:471112560111:vpc/vpc-00000000000000000 implicitDeny
s9b_dns_a_exit=0
s9b_decision=route53:ChangeResourceRecordSets arn:aws:route53:::hostedzone Z02494181MAM7OCUAIPKC allowed
s9b_dns_mx_exit=0
s9b_decision=route53:ChangeResourceRecordSets arn:aws:route53:::hostedzone Z02494181MAM7OCUAIPKC implicitDeny
s9b_pass_ecs_exit=254
s9b_pass_lambda_exit=254
s9b_create_distribution_exit=0
s9b_decision=cloudfront:CreateDistribution * allowed
s9b_tag_owned_distribution_exit=0
s9b_decision=cloudfront:TagResource arn:aws:cloudfront::471112560111:distribution/EOWNED0000000 allowed
s9b_tag_foreign_distribution_exit=0
s9b_decision=cloudfront:TagResource arn:aws:cloudfront::471112560111:distribution/EFOREIGN000000 implicitDeny
s9b_tag_foreign_certificate_exit=254
s9b_cert_viewer_exit=0
s9b_decision=acm:RequestCertificate arn:${Partition}:acm:$region:${Account}:certificate/* allowed
s9b_cert_other_name_exit=0
s9b_decision=acm:RequestCertificate arn:${Partition}:acm:$region:${Account}:certificate/* implicitDeny
s9b_publish_topic_exit=0
s9b_decision=sns:Publish arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments allowed
s9b_publish_other_exit=0
s9b_decision=sns:Publish arn:aws:sns:eu-north-1:471112560111:openvaa-other implicitDeny
s9b_hand_state_exit=0
s9b_decision=s3:GetObject arn:aws:s3:::openvaa-tfstate-471112560111/hand/staging/supabase/terraform.tfstate implicitDeny
s9b_pass_ecs_err=InvalidInput ResourceNames are not in a valid ARN format
s9b_pass_lambda_err=InvalidInput ResourceNames are not in a valid ARN format
s9b_tag_foreign_certificate_err=InvalidInput ResourceNames are not in a valid ARN format
note: zsh read $A:role and $A:certificate as the :r and :c modifiers, so two ARNs lost a letter; the three cases were rerun with ${A}
s9b_pass_ecs_exit=0
s9b_decision=iam:PassRole arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution allowed
s9b_pass_lambda_exit=0
s9b_decision=iam:PassRole arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution implicitDeny
s9b_tag_foreign_certificate_exit=0
s9b_decision=acm:AddTagsToCertificate arn:aws:acm:us-east-1:471112560111:certificate/00000000-0000-0000-0000-000000000000 implicitDeny
s9c_lookup=eu-north-1 09:47:00Z exit=0
s9c_lookup=eu-north-1 18:00:00Z exit=0
s9c_lookup=us-east-1 09:47:00Z exit=0
s9c_lookup=us-east-1 18:00:00Z exit=0
s9c_events=626
s9c_actions=119
s9c_compare_exit=0
s9c_uncovered=autoscaling:DeleteScalingPolicy
s9c_uncovered=autoscaling:DeregisterScalableTarget
s9c_uncovered=autoscaling:DescribeScalableTargets
s9c_uncovered=autoscaling:DescribeScalingPolicies
s9c_uncovered=autoscaling:ListTagsForResource
s9c_uncovered=autoscaling:PutScalingPolicy
s9c_uncovered=autoscaling:RegisterScalableTarget
s9c_uncovered=iam:GetPolicy
s9c_uncovered=iam:GetPolicyVersion
s9c_uncovered=iam:GetUser
s9c_uncovered=iam:ListAccessKeys
s9c_uncovered=iam:ListAttachedUserPolicies
s9c_uncovered=iam:ListUserPolicies
s9c_uncovered=ses:GetEmailIdentity
s9c_uncovered=ses:ListTagsForResource
s9c_uncovered=sso:GetRoleCredentials
s9c_uncovered_count=16
note: 7 autoscaling = Application Auto Scaling, logged under autoscaling.amazonaws.com, granted as application-autoscaling:* in deploy_scaling
note: 8 iam/ses = the dns-mail root at 09:55:11Z-09:55:12Z on 2026-11-14 (openvaa-staging-ses-smtp user, openvaa-staging-ses-send policy, identity staging.openvaa.org)
note: the sso events (16, both windows) are the admin session fetching its SSO role credentials
note: operator applied after confirming the three groups from the trail; no call of the staging aws root is uncovered
s9d_apply_exit=0
s9d_apply_line=Apply complete! Resources: 18 added, 3 changed, 2 destroyed.
s9d_second_plan_exit=0
s9e_plan_policies_exit=0
s9e_plan_policy=ReadOnlyAccess
s9e_plan_policy=openvaa-plan-deny
s9e_plan_trust_exit=0
s9e_plan_condition=StringEquals sub repo:OpenVAA/voting-advice-application:pull_request
s9e_plan_condition=StringEquals repository_id 546467466
s9e_plan_condition=StringEquals repository_owner_id 115159211
s9e_plan_condition=StringEquals aud sts.amazonaws.com
s9e_deploy_policies_exit=0
s9e_deploy_policy=openvaa-deploy-alert
s9e_deploy_policy=openvaa-deploy-dns
s9e_deploy_policy=openvaa-deploy-ecs
s9e_deploy_policy=openvaa-deploy-edge
s9e_deploy_policy=openvaa-deploy-load-balancing
s9e_deploy_policy=openvaa-deploy-network
s9e_deploy_policy=openvaa-deploy-observability
s9e_deploy_policy=openvaa-deploy-pass-role
s9e_deploy_policy=openvaa-deploy-scaling
s9e_deploy_policy=openvaa-ecr-push
s9e_deploy_policy=openvaa-tfstate-staging-aws
s9e_deploy_trust_exit=0
s9e_deploy_condition=StringEquals sub repo:OpenVAA/voting-advice-application:environment:staging
s9e_deploy_condition=StringEquals sub repo:OpenVAA/voting-advice-application:environment:staging-destroy
s9e_deploy_condition=StringEquals aud sts.amazonaws.com
s9e_deploy_condition=StringEquals repository_owner_id 115159211
s9e_deploy_condition=StringEquals repository_id 546467466
s9e_bucket_encryption_exit=0
s9e_bucket_versioning_exit=0
s9e_bucket_blocks_exit=0
s9e_bucket_encryption=AES256
s9e_bucket_versioning=Enabled
s9e_bucket_public_blocks=4
s9e_assert_users_exit=0
s9e_assert_no_inline_exit=0
s9_logs_removed=yes
```

## Task 3 — The lines checked (2026-11-16T07:05Z)

| Item | Expected                                                                                                  | Read                                                                                                                                         | Holds |
| ---- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1    | three `s9_` exits 0                                                                                       | 0, 0, 0                                                                                                                                      | yes   |
| 2    | plan exit 2, `18 to add, 3 to change, 2 to destroy.`, add 18, change 3, destroy 2, replace 0, match 0     | as expected, in the rerun; the first item 2 read `s9a_change=4` and `s9a_addresses_match_exit=1` and was not applied                         | yes   |
| 3    | `s9b_policies=11`, every case exit 0, seventeen decisions, eight `allowed` and nine `implicitDeny`        | 11; three cases exit 254 first (zsh), 0 on the rerun; seventeen decisions, eight `allowed` and nine `implicitDeny`, each the expected one   | yes   |
| 4    | four lookups exit 0, `s9c_events` above 0, `s9c_compare_exit=0`, no uncovered line, `s9c_uncovered_count=0` | lookups 0, 626 events, 119 actions, compare 0, **16 uncovered**                                                                              | no    |
| 5    | apply exit 0, `18 added, 3 changed, 2 destroyed.`, second plan exit 0                                     | as expected                                                                                                                                  | yes   |
| 6    | two plan policies, eleven deploy policies, both trusts' conditions, bucket `AES256`/`Enabled`/4, asserts 0 | as expected: both trusts name `repository_id 546467466` and `repository_owner_id 115159211`, the deploy trust both environment subjects   | yes   |
| 7    | `s9_logs_removed=yes`                                                                                     | yes                                                                                                                                          | yes   |

Item 4 does not hold as the plan states it: the step requires `s9c_uncovered_count=0` and read 16. The operator applied after reading the trail, and ruled each of the sixteen not a call of the staging AWS root the pipeline applies, in three groups. The groups were checked against the tree, with no AWS call:

- Seven `autoscaling:` actions (`RegisterScalableTarget`, `DeregisterScalableTarget`, `DescribeScalableTargets`, `DescribeScalingPolicies`, `PutScalingPolicy`, `DeleteScalingPolicy`, `ListTagsForResource`) are Application Auto Scaling's, whose CloudTrail event source is `autoscaling.amazonaws.com` while its IAM prefix is `application-autoscaling`. `deploy_scaling` in `infra/modules/github-oidc/deploy-policies.tf` grants all seven under that prefix (`application-autoscaling:Describe*` and `ListTagsForResource` in `ReadScaling`, the four writes in `ScalableTarget`). A defect of item 4's mapping, not of the policies.
- Eight `iam:`/`ses:` reads (`GetPolicy`, `GetPolicyVersion`, `GetUser`, `ListAccessKeys`, `ListAttachedUserPolicies`, `ListUserPolicies`, `ses:GetEmailIdentity`, `ses:ListTagsForResource`) are the `dns-mail` root's, at 09:55:11Z to 09:55:12Z on 2026-11-14, on its SMTP user `openvaa-staging-ses-smtp`, its policy `openvaa-staging-ses-send` and its SES identity `staging.openvaa.org` (the operator's reading of the trail's request parameters). In the tree, IAM user and SES resources are declared only in `infra/modules/mail-ses`; neither `infra/envs/staging/aws` nor its one module, `frontend-service`, declares an IAM user, an `aws_iam_policy` or an SES resource (grep exit 1). A hand run of another root inside the destroy window.
- `sso:GetRoleCredentials` (16 events, both windows) is the admin session's SSO credential fetch, made with the portal's access token and needing no IAM permission; the pipeline assumes its role through OIDC and never makes it.

The plan's stop rule ("MUST NOT apply when ... an uncovered call is listed") was not met as written; the apply rests on the operator's ruling above. Item 4 of the runbook now maps the Application Auto Scaling names, leaves out `sso:GetRoleCredentials` with `sts:GetCallerIdentity`, and says how to recognise another root's hand run in the windows. On the 2026-11-14 trail it would print the eight `dns-mail` lines alone (tested on a synthetic trail only; not rerun against the account).

```
STEP9_RESULT=applied
STEP9_DEVIATION=s9c_uncovered_count=16 where item 4 requires 0; applied on the operator's ruling that none is a call of the staging aws root: 7 Application Auto Scaling actions logged under autoscaling.amazonaws.com and granted as application-autoscaling in deploy_scaling, 8 iam/ses reads of the dns-mail root at 09:55:11Z-09:55:12Z on 2026-11-14, 1 sso:GetRoleCredentials of the admin session
STEP9_DEVIATION=item 3 cases pass_ecs, pass_lambda and tag_foreign_certificate first exited 254 (InvalidInput, ResourceNames are not in a valid ARN format) because zsh read $A:role and $A:certificate as the :r and :c modifiers, dropping the colon and the letter after it; rerun with ${A}, all three exited 0 with the expected decisions, seventeen decisions in all
STEP9_DEVIATION=a first item 2 ran with another alert address (s9a_change=4 incl. module.budget.aws_budgets_budget.monthly, s9a_addresses_match_exit=1); not applied; items 1 and 2 rerun clean
S9C_UNCOVERED_BY_GROUP=application-autoscaling:7 dns-mail-root:8 sso-credential-fetch:1
S9B_DECISIONS=17
S9E_DEPLOY_POLICIES=11
S9E_PLAN_POLICIES=2
RUNBOOK_FIXED=zsh braces, item 4 autoscaling mapping, sso:GetRoleCredentials left out, another root's hand run
```
