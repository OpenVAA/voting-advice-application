# Phase 183: applies after the code-review fix pass

Date: 2026-10-26. Tree: 48db3ec8e (the fix pass and its disposition). The operator ran two sittings. The lines below are the
operator's pasted lines, copied verbatim. No address, token or password went into any file, and no log, state or plan file was read.

## infra/bootstrap: WR-01 and WR-02 (the plan role's deny policy)

Plan, then apply of the saved plan, then a second plan:

```
p1_plan_exit=0
p1_plan_line=Plan: 2 to add, 0 to change, 2 to destroy.
p1_plan_resource=  # module.github_oidc.aws_iam_policy.plan_deny must be replaced
p1_plan_resource=  # module.github_oidc.aws_iam_role_policy_attachment.plan_deny must be replaced
s0_account=471112560111
p2_apply_exit=0
s7_plan_attached=ReadOnlyAccess,openvaa-plan-deny,openvaa-plan-lock
s8a_decision=explicitDeny
s8a_decision=allowed
s8a_decision=explicitDeny
s8b_decision=secretsmanager:GetSecretValue explicitDeny
s8b_decision=kms:Decrypt explicitDeny
s8b_decision=dynamodb:GetItem explicitDeny
s8b_decision=logs:GetLogEvents explicitDeny
p3_second_plan_exit=0
p4_logs_removed=yes
```

The three `s8a` lines are s3:GetObject against three keys, in this order: the state under `hand/staging/supabase/`, the pipeline key
`pipeline/staging/aws/terraform.tfstate`, and the workspace key `env:/x/hand/staging/supabase/terraform.tfstate`. The orchestrator added
an `awk` to the block that prints only the decision, so that no ARN reached the paste.

Notes:
- `s0_account` was printed and checked inside the apply block, which would not apply on another account. The plan block's own
  `s0_account` line was left out of the paste.
- The simulator's (c) to (h) checks were not re-run in this sitting. The fix changed only `plan_deny`, and the plan touched no other
  resource.

## infra/envs/staging/supabase: WR-17 (the import block)

This sitting ran init and a plan only. No apply ran.

```
c1_init_exit=0
c2_plan_exit=0
c2_plan_line=No changes. Your infrastructure matches the configuration.
c3_logs_removed=yes
```

The operator's paste also carried the echoed `unset` command line. The project is already in state, and the `import` block plans nothing,
as expected.

## Operator rulings (2026-10-26)

- **WR-04:** keep decision A-08. The plan role keeps write and delete on the pipeline lock, and the risk that a PR job holds or deletes it
  is accepted. Revisit in phase 184, once the PR and deploy workflows exist.
- **WR-01:** option (a). Keep `ReadOnlyAccess` with the current denies. The reads still allowed (S3 objects, SSM String parameters,
  Lambda/ECS environments, CloudFormation templates) are deferred to phase 184.
- **WR-03:** deferred to phase 184: the numeric GitHub repository and owner ids, which need AWS's support for those claim keys confirmed
  first; pinning the plan trust to a workflow; and the staging Environment's deployment branch policy.
