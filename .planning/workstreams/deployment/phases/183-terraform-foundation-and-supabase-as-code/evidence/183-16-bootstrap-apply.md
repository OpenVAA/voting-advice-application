# 183-16 Bootstrap apply, state migration, read-backs, simulator and lock

Date (UTC): 2026-10-21. The operator ran every step on that date in account `471112560111`, region
`eu-north-1`. The Task 1 checkpoint was raised at 2026-10-21T13:20Z and its reply was stored at about
14:04Z. The Task 2 checkpoint was raised at 2026-10-21T14:04Z and its reply was stored at about 19:30Z.
This file was written at 2026-10-21T19:35Z.

Attempt: 16-1 20261021T132008Z.e3cc5a1c1
Attempt: 16-2 20261021T140454Z.e3cc5a1c1

Only non-secret named lines are recorded. There is no e-mail address, no assumed-role session name,
no resource id from an apply log and nothing from a log. The alert address was typed in the
operator's terminal as `TF_VAR_alert_email` and appears nowhere.

## Provenance of the Task 1 lines

The operator removed the Task 1 log directory with step 11 before five lines had been copied. Those
lines are absent here. None was reconstructed into its original name.

| Line the plan asked for          | Status     | What stands for it                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `s3_account`                     | not pasted | Every s10 output names `471112560111`, and `s0_account=471112560111` was pasted at the start of Task 2 (inferred for Task 1, pasted for Task 2).                                                                                                                                                                                  |
| `s5_override_ignored_exit`       | re-run     | `s5_override_ignored_exit=0`, from the same command re-run after the apply and pasted.                                                                                                                                                                                                                                           |
| `s6_init_exit`, `s6_backend_line` | not pasted | A read-only re-check: the backend type recorded in `.terraform/terraform.tfstate` gave `s6b_backend_type=local` with `s6b_check_exit=0`, and `backend.tf` and `backend_override.tf` were both present.                                                                                                                         |
| `s9_apply_exit`, `s9_apply_line` | not pasted | The `Apply complete!` line is not on record. `s9b_state_resources=30` is the line count of `terraform state list` after the apply, re-run and pasted. The code declares 23 resource blocks and 7 data blocks with no resource-level `count` or `for_each`, so 30 − 7 = 23, the plan's count to add. Task 2's `s3_managed_count=23`, read through the S3 backend, confirms it. |

The operator ruled the plan amendment that checks these lines in place of the five (`answer_amend=yes`,
in the Task 2 reply).

## Task 1 lines (attempt 16-1)

```
s5_override_ignored_exit=0
s6b_backend_type=local
s6b_check_exit=0
s7_plan_exit=0
s7_plan_line=Plan: 23 to add, 0 to change, 0 to destroy.
s7_plan_address_lines=0
s9b_state_resources=30
s10_state_bucket_name=openvaa-tfstate-471112560111
s10_registry_url=471112560111.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend
s10_plan_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
s10_deploy_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
s10_budget_name=openvaa-monthly
s11_logs_removed=yes
answer_fallback=no
```

## Criterion rows

### Applied in the account and region: seen

- `s0_account=471112560111` (Task 2 start). Every `s10_` output names the account, and the registry
  URL names `eu-north-1`.
- `s7_plan_exit=0`, `s7_plan_line=Plan: 23 to add, 0 to change, 0 to destroy.`,
  `s7_plan_address_lines=0`.
- The apply itself: `s9b_state_resources=30`, which is 23 managed resources and 7 data sources, matching
  the plan's 23 to add. Task 2's `s3_managed_count=23` confirms it. The apply's own `Apply complete!`
  line was not pasted (see the provenance above).
- Date: 2026-10-21.

### State object encrypted and versioned: seen

```
s2_migrate_exit=0
s3_head_exit=0
s3_state_size=57492
s3_state_sse=AES256
s3_state_versioned=true
s3_state_list_exit=0
s3_managed_count=23
s4_local_state_removed=yes
```

The remote object `hand/bootstrap/terraform.tfstate` was read with `head-object` and the state was
listed through the new backend. Both reads came before step 4 removed the local files.
`s4_local_state_removed=yes` comes with `s3_head_exit=0`.

### Bucket closed and TLS-only: seen

```
s6_sse=AES256
s6_versioning=Enabled
s6_public_block=True,True,True,True
s6_is_public=False
s6_tls_only_statements=1
```

### State locked during an apply: seen

```
s9_t2_account=471112560111
s9_locked_plan_exit=1
s9_lock_error_lines=1
s9_lock_object_during_exit=0
s9_lock_object_after_exit=254
s9_terminal2_logs_removed=yes
answer_lock_seen=yes
```

Terminal 1 waited at the approval prompt of
`terraform apply -var budget_limit_usd=1 -replace=module.budget.aws_budgets_budget.monthly`. While it
waited, terminal 2's plan with `-lock-timeout=0s` failed on the lock, and the lock object
`hand/bootstrap/terraform.tfstate.tflock` was present. After terminal 1 answered `no`, the object was
gone (`head-object` exit 254). Nothing was applied. Terminal 2 was checked to be signed in to the same
account (`s9_t2_account`).

### OIDC provider, two roles and registry with immutable tags: seen

```
s7_registry=openvaa-frontend,IMMUTABLE
s7_oidc_providers=arn:aws:iam::471112560111:oidc-provider/token.actions.githubusercontent.com
s10_plan_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
s10_deploy_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
```

### Second plan with no change: seen

```
s5_second_plan_exit=0
s5_plan_line=No changes. Your infrastructure matches the configuration.
```

The status was read directly from `-detailed-exitcode`, printed by the command after the plan.

### Both roles without an inline policy: seen

```
s7_plan_inline_count=0
s7_deploy_inline_count=0
s7_plan_attached=ReadOnlyAccess,openvaa-plan-deny,openvaa-plan-lock
s7_deploy_attached=openvaa-ecr-push,openvaa-tfstate-staging-aws
s7_assert_managed_exit=0
```

### The plan role's deny and the pipeline allow: seen

`s8a` gives `explicitDeny` for `hand/staging/supabase/terraform.tfstate` and `allowed` for
`pipeline/staging/aws/terraform.tfstate`. `s8b` gives `explicitDeny` for both secret actions. The
full table follows.

### The budget at the test amount, with the spend it computed: seen

```
s10_budget_limit=1.0
s10_budget_actual=6.475
s11_logs_removed=yes
```

The arithmetic: the actual alert is set at 80 percent of the 1 USD test amount, so it can fire once the
computed spend passes 0.80 USD. The computed spend, 6.475 USD, is past that threshold. That makes the
actual alert eligible to fire. Whether its mail arrives, and when, is observed in plan 183-20, which
also raises the budget.

## The three statements this plan checked

1. **Backend override:** the untracked `backend_override.tf` with a local backend overrode the tracked
   S3 block. The fallback was not taken (`answer_fallback=no`). The re-check read `local` as the
   backend recorded by `init`, with both files present. Terraform 1.16.5, 2026-10-21.
2. **Lock at the approval prompt:** held. The second plan exited 1 with 1 lock-error line. The lock
   object was present during the wait (exit 0) and absent afterwards (exit 254).
3. **The plan role's deny:** an explicit deny, per the simulator table below.

## Simulator decisions (step 8)

Each line is the CLI's text output: action, resource, decision, tab-separated. Step 8(a) was run as
two calls, one resource each (see the deviations below).

| Role   | Action                          | Resource or list prefix                                     | Decision       | Expected       |
| ------ | ------------------------------- | ----------------------------------------------------------- | -------------- | -------------- |
| plan   | `s3:GetObject`                  | `hand/staging/supabase/terraform.tfstate`                   | `explicitDeny` | `explicitDeny` |
| plan   | `s3:GetObject`                  | `pipeline/staging/aws/terraform.tfstate`                    | `allowed`      | `allowed`      |
| plan   | `secretsmanager:GetSecretValue` | `*`                                                         | `explicitDeny` | `explicitDeny` |
| plan   | `kms:Decrypt`                   | `*`                                                         | `explicitDeny` | `explicitDeny` |
| plan   | `s3:GetObject`                  | `pipeline/staging/aws/terraform.tfstate.tflock`             | `allowed`      | `allowed`      |
| plan   | `s3:PutObject`                  | `pipeline/staging/aws/terraform.tfstate.tflock`             | `allowed`      | `allowed`      |
| plan   | `s3:DeleteObject`               | `pipeline/staging/aws/terraform.tfstate.tflock`             | `allowed`      | `allowed`      |
| plan   | `s3:ListBucket`                 | prefix `pipeline/staging/aws/terraform.tfstate`             | `allowed`      | `allowed`      |
| plan   | `s3:ListBucket`                 | prefix `env:/`                                              | `allowed`      | `allowed`      |
| deploy | `s3:GetObject`                  | `pipeline/staging/aws/terraform.tfstate`                    | `allowed`      | `allowed`      |
| deploy | `s3:PutObject`                  | `pipeline/staging/aws/terraform.tfstate`                    | `allowed`      | `allowed`      |
| deploy | `s3:GetObject`                  | `pipeline/staging/aws/terraform.tfstate.tflock`             | `allowed`      | `allowed`      |
| deploy | `s3:PutObject`                  | `pipeline/staging/aws/terraform.tfstate.tflock`             | `allowed`      | `allowed`      |
| deploy | `s3:DeleteObject`               | `pipeline/staging/aws/terraform.tfstate.tflock`             | `allowed`      | `allowed`      |
| deploy | `s3:ListBucket`                 | prefix `pipeline/staging/aws/terraform.tfstate`             | `allowed`      | `allowed`      |
| deploy | `s3:ListBucket`                 | prefix `env:/`                                              | `implicitDeny` | `implicitDeny` |
| deploy | `s3:GetObject`                  | `hand/staging/supabase/terraform.tfstate`                   | `implicitDeny` | `implicitDeny` |

Every resource is in bucket `openvaa-tfstate-471112560111`.

- The plan role may read the lock object of the pipeline state, which the backend reads to report who
  holds a lock. The object lies under `pipeline/`, outside the explicit deny.
- The deploy role's refused list call for `env:/` is the refusal that Terraform 1.16.5 tolerates (plan
  183-03 cites the source). It is not a gap.
- Every call the backend needs is allowed. The CLI accepted the `--context-entries` form, so all four
  list-prefix decisions were printed.

The pasted lines:

```
s8a_decision=s3:GetObject	arn:aws:s3:::openvaa-tfstate-471112560111/hand/staging/supabase/terraform.tfstate	explicitDeny
s8a_decision=s3:GetObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate	allowed
s8b_decision=secretsmanager:GetSecretValue	*	explicitDeny
s8b_decision=kms:Decrypt	*	explicitDeny
s8c_decision=s3:GetObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate.tflock	allowed
s8c_decision=s3:PutObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate.tflock	allowed
s8c_decision=s3:DeleteObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate.tflock	allowed
s8d1_decision=s3:ListBucket	arn:aws:s3:::openvaa-tfstate-471112560111	allowed
s8d2_decision=s3:ListBucket	arn:aws:s3:::openvaa-tfstate-471112560111	allowed
s8e_decision=s3:GetObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate	allowed
s8e_decision=s3:PutObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate	allowed
s8f_decision=s3:GetObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate.tflock	allowed
s8f_decision=s3:PutObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate.tflock	allowed
s8f_decision=s3:DeleteObject	arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate.tflock	allowed
s8g1_decision=s3:ListBucket	arn:aws:s3:::openvaa-tfstate-471112560111	allowed
s8g2_decision=s3:ListBucket	arn:aws:s3:::openvaa-tfstate-471112560111	implicitDeny
s8h_decision=s3:GetObject	arn:aws:s3:::openvaa-tfstate-471112560111/hand/staging/supabase/terraform.tfstate	implicitDeny
```

## Deviations in how the lines were obtained

- **Step 8(a), a defect in the plan's command.** The plan passed both state objects to one
  `simulate-principal-policy` call. The simulator then returns one top-level result per action, with
  the decision `explicitDeny` and a placeholder resource name. The per-resource results appear only
  under `ResourceSpecificResults`. So the command could not print the two `s8a` lines the check
  expects. The operator re-ran (a) as two calls, one resource each, and those two lines are the reply.
  The plan and the runbook now make one call per resource.
- **Steps 3, 5 and 6, line names.** Commands written by the orchestrator, with other line names, were
  run first. The operator then re-ran the plan's exact read-only commands, and the values were the same
  both times. Only the plan-named lines are recorded.
- **Signed-in account.** The operator's default credentials pointed at another account. The account
  check at the start of Task 2 caught it before any command ran. Every command recorded here then ran
  under a named profile against `471112560111`.
- **Extra lines.** `s0_account`, `s0_dir`, `s1_override_removed` and `s9_t2_account` are not in the
  plan's list. They are recorded as pasted.

## Gaps

None for the rows above. The only item not observed is the first apply's own `Apply complete!` line.
The state count and the managed count through the new backend stand for it, under the amendment the
operator ruled.
