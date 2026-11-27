# 185-13: the first plan, the apply that stopped at 39 of 40, and the one-create follow-up

Recorded 2026-11-13 (UTC), 09:41 to 10:12. Run in the operator's administrator session
(`AWS_PROFILE=openvaa-admin`, the key variables unset, region `eu-north-1`); the account check read
`471112560111` before every Terraform and AWS call (`account_read_exit=0`, `account_match_exit=0`
each time). The alert address reached the plan as `TF_VAR_alert_email` from the operator's profile
(`RULING_ALERT_ADDRESS=profile`), checked only with `test -n` (exit 0) and never printed.
`image_tag` is `712947a1bd44a735f66ee8f51610f4748d76cd30`, 40 characters, plan 185-12's
`SOURCE_COMMIT`. Terraform 1.16.5, equal to `infra/.terraform-version`. Every plan file, log and
`terraform show` output stayed in a `umask 077` directory outside the repository and none of their
attribute values is recorded here.

**The first apply did not complete the stack.** It created 39 of the plan's 40 resources and exited
1. The stack was completed by a second saved plan of one create, made after a fix commit, and that
plan's apply exited 0. The single from-nothing apply that brings the whole stack up has therefore
not yet been seen; it is the re-apply after the destroy, later in this phase.

## The first plan and its apply (Task 1, 09:41 to 09:47)

```
FIRST_PLAN_LINE=Plan: 40 to add, 0 to change, 0 to destroy.
FIRST_PLAN_ONLY_CREATES=yes
FIRST_APPLY_EXIT=1
FIRST_APPLY_CREATED=39 of 40
FIRST_APPLY_FAILED_RESOURCE=module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront
```

- **Init.** `terraform init -input=false -no-color -lockfile=readonly` against the state bucket,
  exit 0; the tracked lock file was read and not changed (`git status --porcelain` empty afterwards).
- **The plan.** One plan of `infra/envs/staging/aws`, no `-target`, saved with `-out`, exit 0.
  Its line was `Plan: 40 to add, 0 to change, 0 to destroy.` Read from `terraform show -json` of the
  saved file (exit 0): `planned_create=40` and no other kind, `outside_module=0`, 40 resource changes
  in all, and 19 outputs to create. The stop rule of Step 5, item 4 held, so the saved file was
  applied.
- **The apply.** `terraform apply` of that saved file, in the background, 09:42:30Z to 09:47:12Z,
  exit 1. The log holds 39 `Creation complete` lines and one error:

  ```
  Error: creating VPC Security Group Rule
    with module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront,
  operation error EC2: AuthorizeSecurityGroupIngress, https response error StatusCode: 400,
  api error InvalidParameterValue: Invalid rule description. Valid descriptions are strings less
  than 256 characters from the following set:  a-zA-Z0-9. _-:/()#,@[]+=&;{}!$*
  ```

  The rule's description was `HTTPS from CloudFront's origin-facing addresses.`; the apostrophe is
  outside EC2's set. Among the 39 that were created: the distribution after 2m44s, the ECS service
  after 2m9s, both certificate validations after 0s and 1s (the certificates were already issued
  when Terraform reached them), and the alert's subscription. The saved plan file was removed after
  the apply.
- **What the operator decided.** Fix the description, add an offline test of the character set, and
  apply a new saved plan whose expected shape is the one missing create (option 1). No destroy, no
  `-target` and no edit of state.

## The fix (commit f80f94c74)

```
FIX_COMMIT=f80f94c74
```

- `infra/modules/frontend-service/main.tf`: the rule's description is now
  `HTTPS from the CloudFront origin-facing prefix list.` The other six descriptions of the module's
  security groups and rules (the two groups' own, `load_balancer_debug`, `load_balancer_to_task`,
  `task_from_load_balancer`, `task_https`) were read against the set and already lay inside it.
- `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`: a new run,
  `descriptions_use_the_ec2_character_set`, applies the module against the mocks with one debug
  address, so that the two debug rules exist, and asserts that all eight descriptions match
  `^[a-zA-Z0-9. _:/()#,@\[\]+=&;{}!$*-]{0,255}$`. Before the fix the module's tests read
  `Failure! 32 passed, 1 failed.`, the new run failing; after it `Success! 33 passed, 0 failed.`
  (`terraform test` exit 0). This is the suite CI's `infra-validate` job runs for every module with
  a `tests` directory. `terraform fmt -check -recursive infra` exit 0, and `terraform validate` of
  `infra/envs/staging/aws` and `infra/envs/example/aws` exit 0.

## The follow-up plan and its apply (10:09 to 10:10)

```
FOLLOWUP_PLAN_LINE=Plan: 1 to add, 0 to change, 0 to destroy.
FOLLOWUP_PLAN_ONLY_CREATES=yes
FOLLOWUP_PLAN_CHANGE=create module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_from_cloudfront
FOLLOWUP_APPLY_EXIT=0
```

- The account check again, then a new saved plan with the same inputs and no `-target`, exit 0:
  `Plan: 1 to add, 0 to change, 0 to destroy.`, one change, a create of the failed rule, nothing
  outside the module. This was the expected shape, so the saved file was applied.
- The apply, 10:10:02Z to 10:10:08Z, exit 0: `Apply complete! Resources: 1 added, 0 changed, 0
  destroyed.` The saved plan file was removed.

## The no-change plan, the state and the site (10:11)

```
SECOND_PLAN_EXIT=0
STATE_OBJECT=present sse=AES256 versioned=yes
HEALTH_HTTP=200
HEALTH_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30
HEALTH_BUILD_MATCHES_TAG=yes
HEALTH_X_CACHE=Miss from cloudfront
```

- **No change.** `SECOND_PLAN_EXIT` is the plan made with `-detailed-exitcode` right after the
  follow-up apply, the plan Step 5, item 6 calls the second: exit 0, `No changes. Your
  infrastructure matches the configuration.`, and no resource heading.
- **The state.** `aws s3api head-object` of `pipeline/staging/aws/terraform.tfstate` in
  `openvaa-tfstate-471112560111`, exit 0: `ServerSideEncryption` `AES256`, a version id present (not
  recorded), a non-zero size.
- **The site.** `curl -sS --max-time 20 https://staging.openvaa.org/api/health` at 10:11:33Z, exit 0:
  HTTP 200, `status` `ok`, `build` `712947a1bd44a735f66ee8f51610f4748d76cd30`, equal to the tag
  (`test` exit 0). The answer carried `x-cache: Miss from cloudfront` and a `via` header, so it came
  through the distribution, and the task that answered had started, which means ECS read both
  parameters under `/openvaa/staging/frontend/` with the execution role.

## Ordering

The apply came after plan 185-12's image push (2026-11-12T21:06:09Z) and before any observation
that changes the stack; nothing between the first plan and the health read changed the stack except
the two applies recorded above.

## The operator's confirmations (Tasks 2 and 3, 10:13 and 10:59)

```
SUBSCRIPTION_CONFIRMED=yes
COST_TAGS_ACTIVE=Project,Environment,Root
COST_TAGS_ALSO_ACTIVE=Election
OPERATOR_REPLY=received attempt=20261113T101336Z.daff992e1 plan=185-13 task=2
```

- **The reply.** Attempt `20261113T101336Z.daff992e1` (`attempt.sh new 185-13-2`). The operator
  answered `answer_subscription_confirmed=yes` and `answer_cost_tags_activated=yes`, received at
  2026-11-13T10:58Z with the words "Both tasks were done about an hour ago". It was stored with
  `attempt.sh put 185-13-2` (exit 0), the record line above was appended, and
  `attempt.sh bound 185-13-2 OPERATOR_REPLY plan=185-13 task=2` exits 0.
- **When the subscription was confirmed.** About 09:58Z by the operator's words; no precise minute
  is known. It lies after the apply that created the subscription, which ended at 09:47:12Z, and
  before the agent's first read, at 10:13Z, which already read it confirmed.
- **When the tags were activated.** About 09:58Z by the operator's words, but the operator first
  reported the activation before the plan's first dispatch, around 08:26Z, and Cost Explorer gives
  each of the four tags `LastUpdatedDate` 2026-11-13T08:23:36Z. The tags were already offered,
  because the bootstrap and `dns-mail` resources carried them (`LastUsedDate` 2026-11-01). The
  activation therefore came before this plan's apply, not at it.
- **The read-back,** run twice: at 10:13Z, before the reply, and at 10:59Z, after it, with the same
  result. The account check passed both times. `terraform output -raw deployment_alert_topic_arn`
  exit 0; `aws sns list-subscriptions-by-topic` exit 0: one subscription,
  `email confirmed` (its ARN is not `PendingConfirmation`; the endpoint was not printed).
  `aws ce list-cost-allocation-tags --region us-east-1` exit 0: `Project`, `Environment` and `Root`
  each `UserDefined` and `Active`.
- **Election.** `Election` is also `UserDefined` and `Active`, activated by the operator on their
  own initiative together with the three; this plan does not require it.
