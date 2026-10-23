# 183-23: The persistent project, its import and its first plan, read against the stop rules

**Review: ok (2026-10-23).**

- **The project.** The operator created the persistent project `cofbsatfrdysyphajsky`
  (`openvaa-staging`) by hand in `eu-north-1`. It is imported into `infra/envs/staging/supabase`.
- **What the provider read.** On import it read the persistent project's name and region. The ref
  is not the throwaway project's.
- **The first plan.** It creates `module.supabase.supabase_settings.this` and touches nothing else:
  no change to the project resource, no line for `database_password`, and nothing destroyed or
  replaced.
- **What the go-ahead covers.** It holds only for the plan file with SHA-256
  `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590`, for project
  `cofbsatfrdysyphajsky`. Nothing was applied.

Clause C5.1 import: seen

Attempt: 23-1 20261023T064142Z.88053dd0f
Attempt: 23-2 20261023T074732Z.88053dd0f
Attempt: 23-3 20261023T105701Z.88053dd0f

Recorded: 2026-10-23T10:58Z (UTC).

**Where the values come from.**
- Every value below comes from the operator's named lines, as relayed by the orchestrator.
- They are stored in the attempt files named above, under `tmp/183-evidence/`, which Git ignores.
- Each reply passed `attempt.sh put` with no refusal.
- Neither the access token nor the database password was pasted, and neither is in any file.

## Task 1: the region decision (attempt 23-1)

The checkpoint was raised at 2026-10-23T06:41Z.

**What was checked before it was raised.** The rehearsal is on record as passed:
- The current 22-2 review is `PLAN_REVIEWED=ok` with sha256
  `b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e`.
- 24-1 holds `OPERATOR_APPLIED=yes` for that checksum.
- 24-1 holds the destroy plan's refusal: `s5_destroy_plan_exit=1` and `s5_refusal_lines=3`.
- The 183-24 evidence file names `Attempt: 24-2 20261023T063404Z.8f89f0e63`.
- `init -backend=false` and `validate` of the staging root passed.

**The operator's answer:**

| Line | Value |
| --- | --- |
| `answer_option` | `eu-north-1` |
| `answer_ref` | `cofbsatfrdysyphajsky` |
| `answer_slug` | `gulgrbzofwnwepdnrgrl` |
| `answer_name` | `openvaa-staging` |
| `answer_region_shown` | `North EU` (the dashboard's label, stored verbatim) |
| `answer_region_shown_id` | `eu-north-1`, mapped from the label by the orchestrator |

**The region shown.** The dashboard showed a label, "North EU", not a region id. Taking the label to
mean `eu-north-1` (Stockholm) was the orchestrator's inference, and a `note:` line records it. The
provider's read on import confirms it: `s5_region=eu-north-1` (Task 2). So the region shown equals
the region chosen.

**The organisation.** The project is in the same organisation as the throwaway, `OpenVAA`
(`gulgrbzofwnwepdnrgrl`). The orchestrator takes the operator's creating it there as the
operator's statement that this is the Pro organisation used for staging. The operator did not say
so separately.

**The record lines:**

```
OPERATOR_REPLY=received attempt=20261023T064142Z.88053dd0f plan=23 task=1 head=88053dd0f0802ab575d3df0cc4a91fc608ac36a7
OPERATOR_DECISION=eu-north-1 attempt=20261023T064142Z.88053dd0f ref=cofbsatfrdysyphajsky region=eu-north-1 head=88053dd0f0802ab575d3df0cc4a91fc608ac36a7
```

Terraform created nothing. The operator created the project in the dashboard.

## Task 2: the import and the first plan (attempt 23-2)

The operator ran steps 1 to 9 on 2026-10-23, in `infra/envs/staging/supabase`, at HEAD
`88053dd0f0802ab575d3df0cc4a91fc608ac36a7`, with the step 2 change to `terraform.tfvars` in the
working tree. The UTC times of the individual steps were not recorded.

The reply is stored under:

```
OPERATOR_REPLY=received attempt=20261023T074732Z.88053dd0f plan=23 task=2 head=88053dd0f0802ab575d3df0cc4a91fc608ac36a7 ref=cofbsatfrdysyphajsky sha256=065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590
```

| Line | Value |
| --- | --- |
| `s1_account` | `471112560111` |
| `s3_init_exit` | `0` |
| `s4_import_project_exit` | `0` |
| `s6_plan_exit` | `0` |
| `s7_plan_sha256` | `065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590` |
| `s8_plan_line` | `9:  # module.supabase.supabase_settings.this will be created` |
| `s8_plan_line` | `60:Plan: 1 to add, 0 to change, 0 to destroy.` |
| `s9_logs_removed` | `yes` |

**The project's attributes as the provider read them (step 5):**

| Attribute | Value read | Required | |
| --- | --- | --- | --- |
| `s5_project_ref` | `cofbsatfrdysyphajsky` | the decision's ref | equal |
| `s5_organization` | `gulgrbzofwnwepdnrgrl` | the slug given at Task 1 | equal |
| `s5_name` | `openvaa-staging` | the name given at Task 1 | equal |
| `s5_region` | `eu-north-1` | the decision's region | equal |
| `s5_password_in_state` | `false` | `false` | equal |

**The import.** The imported project is the persistent one:
- its name and region are the ones given at Task 1;
- its ref is the decision's, and differs from the throwaway's (`suxeqyhafjueinxnojge`, the current
  21-1 reply line);
- the state holds no database password.

The settings resource was not imported (A-05). So the plan shows it as a creation.

**The variable file.** `git diff infra/envs/staging/supabase/terraform.tfvars`, run on its own,
shows that the operator's change appends exactly three assignments, after a blank line:

```
organization_id = "gulgrbzofwnwepdnrgrl"
project_name    = "openvaa-staging"
region          = "eu-north-1"
```

- **The values.** They equal `s5_organization`, `s5_name` and `s5_region`.
- **`terraform fmt`** left the file unchanged.
- **What was kept.** `public_origin`, `enable_access_token_hook` and `enable_send_email_hook` are
  as they were.
- **No secret is assigned.**
- **The header comment.** The executor reworded it to the file's present state. It had said that
  the three values were given as `TF_VAR_` values until the import.

## Task 3: the stop rules (attempt 23-3)

| Rule | Verdict | Supporting line |
| --- | --- | --- |
| 1. No resource heading names `module.supabase.supabase_project.this` | holds | The only heading is line 9, for `module.supabase.supabase_settings.this` |
| 2. No pasted line contains `database_password` | holds | Neither `s8_plan_line` contains it |
| 3. The summary shows `0 to destroy`, and no line says a resource must be replaced | holds | Line 60: `Plan: 1 to add, 0 to change, 0 to destroy.`, with no `must be replaced` or `forces replacement` line |
| 4. The only resource heading is for `module.supabase.supabase_settings.this`, to be created | holds | Line 9: `will be created`, with no other heading |
| 5. The reply holds `s6_plan_exit=0` | holds | `s6_plan_exit=0` |

**What step 8 covers.** It prints every resource heading, the summary line and every line that
names the password, a replacement or a destroy. So the plan log held one resource heading and none
of those other lines. No setting value was seen.

**The settings resource.** Its creation is the provider's partial update of the keys the module
sends (D-15, A-05). It is not a new project. The SMTP resource `smtp_secret` has count 0, because
`smtp` is null, so it has no heading.

### The review line

```
PLAN_REVIEWED=ok attempt=20261023T105701Z.88053dd0f sha256=065a419e31ef13ae8f20b194178eb213fe053c643a7c9f5c74646a0872d43590 head=88053dd0f0802ab575d3df0cc4a91fc608ac36a7 root=staging ref=cofbsatfrdysyphajsky
```

This line is the go-ahead for plan 183-25's apply. It covers only `tfplan` with the checksum above,
on project `cofbsatfrdysyphajsky`. Any new plan is a different file and needs a new review. The
operator keeps `tfplan` in `infra/envs/staging/supabase` for that apply. It holds the persistent
project's settings and database password in clear text.

### What this observes, and what it does not

**Observed (2026-10-23):**
- the import of the persistent project into its own root, with `prevent_destroy` and the password
  ignore in the module;
- the attributes the provider read;
- the first plan's headings and summary.

**Not observed:**
- the apply;
- the second plan;
- the read-back;
- the refused destroy on this root;
- the state object in the bucket.

Those are plan 183-25's.

## Provenance

- **Task 1.** The operator's lines were relayed by the orchestrator, with leading whitespace
  stripped.
- **Task 2's delivery.** The commands were handed out in six blocks:
  - A: step 1;
  - B: the secrets, `L`, `REF`, and the step 2 append (a `printf` the executor added; the plan
    leaves the edit to the operator);
  - steps 3 and 4;
  - step 5;
  - steps 6 to 8;
  - step 9, printed at a separate prompt after the `s6` to `s8` lines.
- **The `cd`** ran in two steps: the repository root, then `infra/envs/staging/supabase`.
- **The filter and the pattern.** The orchestrator built step 5's jq filter and step 8's pattern in
  shell variables. It checked both byte-identical to the plan before handing them out.
- **The orchestrator's own check.** It also checked the change to `terraform.tfvars` with
  `git diff`.
- **The plan's verify commands.**
  - **Task 3's second verify had to be amended.** Its secret-name pattern matched
    `enable_access_token_hook = true`, the assignment the plan itself requires to be kept. As in plan
    183-21, the pattern now requires the secret word at the end of the name:
    `/^[a-z_]*(secret|password|token) *=/`. A red control holding `database_password = "x"` still
    fails it (exit 1).
  - **It ran with a throwaway `TF_DATA_DIR`,** because the operator's step 3 recorded the S3
    backend in the root's `.terraform/` (see `deferred-items.md`).
  - **Both of Task 3's verify commands exit 0.**
