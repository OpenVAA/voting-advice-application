# 190-11 operator applies

Operator workstation, account 471112560111, profile `openvaa-admin`, Terraform 1.16.5 darwin_arm64, checkout `planning/deployment-190` at 89f7e48a1. Lines pasted by the operator on 2026-11-24, verbatim.

## Setup

```
s9_account_read_exit=0
s9_account_match_exit=0
s9_alert_set_exit=0
```

## Deviations before apply 1

1. The first base plan ran under Terraform 1.17.2 built for darwin_amd64 and failed with `timeout while waiting for plugin to start` (the amd64 AWS provider under Rosetta). Re-run with Terraform 1.16.5 darwin_arm64; init 0.
2. The base precondition then read `Plan: 0 to add, 2 to change, 0 to destroy.` (`s11_base_plan_exit=2`). The two changes, by address and attribute name only:

```
s11_base_change=module.budget.aws_budgets_budget.monthly actions=update attrs=notification
s11_base_change=module.github_oidc.aws_iam_policy.plan_deny actions=update attrs=policy
s11_deny_sid=DenyDataPlaneReads live=true tree=true same=true
s11_deny_sid=DenyHandAppliedState live=true tree=true same=true
s11_deny_sid=DenyObjectReadsOutsidePipeline live=false tree=true same=false
s11_deny_sid=DenySecretReads live=true tree=true same=true
```

   - The budget change was a mistyped `TF_VAR_alert_email`; corrected.
   - `DenyObjectReadsOutsidePipeline` (Deny `s3:GetObject`, `s3:GetObjectVersion` on NotResource `arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/*`) was never applied live: the bootstrap state was last written 2026-11-16T06:58:40Z, and the statement first appears in be6e289c8 (2026-11-22). Every other statement and resource matched 46554181e.
3. Operator ruling: catch the account up to 46554181e first (one in-place update of the plan-deny policy, through the plan guard), then run the move.

## Catch-up apply (46554181e)

```
s11c_plan_exit=0
s11c_plan_line=Plan: 0 to add, 1 to change, 0 to destroy.
s11c_show_exit=0
bootstrap_plan_delete=0
bootstrap_plan_replace=0
bootstrap_plan_moved=0
bootstrap_plan_failed_move=0
bootstrap_plan_update=1
bootstrap_plan_create=0
bootstrap_plan_unexpected_create=0
bootstrap_plan_guard=pass
s11c_guard_exit=0
s11c_change=module.github_oidc.aws_iam_policy.plan_deny update
s11c_apply_exit=0
s11_base_plan_exit=0
s11_base_plan_line=No changes. Your infrastructure matches the configuration.
```

## Apply 1 (MOVE_COMMIT ce17178c6)

```
s11_move_worktree_exit=0
s11_init_exit=0
s11_plan_exit=0
s11_plan_line=Plan: 0 to add, 0 to change, 0 to destroy.
s11_show_exit=0
bootstrap_plan_delete=0
bootstrap_plan_replace=0
bootstrap_plan_moved=37
bootstrap_plan_failed_move=0
bootstrap_plan_update=0
bootstrap_plan_create=0
bootstrap_plan_unexpected_create=0
bootstrap_plan_guard=pass
s11_guard_exit=0
s11_apply_exit=0
s11_apply_line=Apply complete! Resources: 0 added, 0 changed, 0 destroyed.
s11_second_plan_exit=0
s11_second_plan_line=No changes. Your infrastructure matches the configuration.
answer_step11=applied
```

`bootstrap_plan_moved=37` equals the offline move proof's count against 46554181e (190-04).

## Apply 2 (TIGHTEN_COMMIT 7d4ab1242)

Pending.
