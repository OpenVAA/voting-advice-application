# 183-14 Account inventory of 471112560111

Date (UTC): 2026-10-21. The inventory and its assert mode were run by the operator on that date (reply stored at 2026-10-21, attempt `14-1`); the re-run of the assert mode after Task 2's change was made later the same day (attempt `14-2`). This file was written at 2026-10-21T13:13Z.

Attempt: 14-1 20261021T081907Z.e5728aa99
Attempt: 14-2 20261021T113817Z.df495bf05
Attempt: 14-3 20261021T131347Z.8936b9dca

Only non-secret named lines are recorded here. No access key id, no e-mail address other than the two allowed, no assumed-role session name and no IAM user name outside `/openvaa/` (the inventory prints such a user as `user-<n>`).

## 183-R1: the identity that applies Terraform by hand

- Ruling: `answer_r1=identity-center`; policies `answer_r1_policies=AdministratorAccess` (the AWS-managed policy, through an IAM Identity Center permission set).
- Account: `s3_account=471112560111`.
- Applying identity: kind `assumed-role`, permission-set role `AWSReservedSSO_AdministratorAccess_db367c2a46e6e25b` (as `s3_principal` gives it, session name cut off by the command). The inventory lists that role with `inline=[]`.

## Tool versions on the operator's workstation

- `s2_terraform=Terraform v1.16.5` (the version pinned in `infra/.terraform-version`; the plan had recorded 1.14.7 on the workstation before this step)
- `s2_jq=jq-1.7.1-apple`
- `s2_aws=aws-cli/2.34.7`
- `s2_dig=DiG 9.10.6`
- `s2_curl=curl 8.7.1`
- `s2_shasum=6.02`
- `s2_git=git version 2.50.1 (Apple Git-155)`

## Status lines

- `s4_inventory_exit=0`
- `s5_assert_users_exit=1` (Task 1: one IAM user carried an inline policy)
- `s5b_assert_users_exit=0` (Task 2, after the operator's conversion)
- `s9_logs_removed=yes`, `s5b_logs_removed=yes`

## Inventory lines as pasted (Task 1)

```
s4_inv=== caller
s4_inv=caller account=471112560111 principal=assumed-role/AWSReservedSSO_AdministratorAccess_db367c2a46e6e25b expected-account=471112560111 match=yes
s4_inv=== organisation
s4_inv=organisation member=yes
s4_inv=== account-summary
s4_inv=summary users=2 groups=1 roles=7 policies=0 providers=1
s4_inv=== iam-users
s4_inv=user user-1 path=other inline=[] attached=[] groups=[AWSSESSendingGroupDoNotRename] tags=[<redacted>]
s4_inv=user user-2 path=other inline=[s3-static-media-access] attached=[] groups=[] tags=[<redacted>]
s4_inv=users examined=2
s4_inv=== iam-groups
s4_inv=group AWSSESSendingGroupDoNotRename inline=[AmazonSesSendingAccess]
s4_inv=groups examined=1
s4_inv=== iam-roles
s4_inv=role AWSReservedSSO_AdministratorAccess_db367c2a46e6e25b path=/aws-reserved/sso.amazonaws.com/eu-north-1/ inline=[]
s4_inv=roles examined=1
s4_inv=== oidc-providers
s4_inv=oidc-providers count=0
s4_inv=== hosted-zones
s4_inv=hosted-zones count=0
s4_inv=== ses eu-north-1
s4_inv=ses eu-north-1 production=True sending=True max24h=50000.0 suppression=[BOUNCE,COMPLAINT]
s4_inv=ses-domain eu-north-1 openvaa.org status=SUCCESS
s4_inv=ses-address-identities eu-north-1 count=1
s4_inv=== ses eu-west-1
s4_inv=ses eu-west-1 production=False sending=True max24h=200.0 suppression=[BOUNCE,COMPLAINT]
s4_inv=ses-address-identities eu-west-1 count=0
s4_inv=== ses eu-central-1
s4_inv=ses eu-central-1 production=False sending=True max24h=200.0 suppression=[BOUNCE,COMPLAINT]
s4_inv=ses-address-identities eu-central-1 count=0
s4_inv=== ses us-east-1
s4_inv=ses us-east-1 production=False sending=True max24h=200.0 suppression=[BOUNCE,COMPLAINT]
s4_inv=ses-address-identities us-east-1 count=0
s4_inv=== budgets
s4_inv=budget My_Monthly_Cost_Budget limit=1000.0 actual=6.43
s4_inv=budgets count=1
s4_inv=== repositories eu-north-1
s4_inv=repositories eu-north-1 count=0
s4_inv=== buckets
s4_inv=bucket duf-vaa-2025
s4_inv=bucket nuortenvaalikone
s4_inv=bucket openvaa-vaalikone
s4_inv=bucket projects-471112560111-eu-north-1-an
s4_inv=bucket static.openvaa.org
s4_inv=buckets count=5
s5_inv=assert: FAIL: 1 of 2 IAM users carry an inline policy or could not be read
s5_inv=user user-2 path=other inline=[s3-static-media-access] attached=[] groups=[] tags=[<redacted>]
```

## Answers

- Cloudflare, zone `openvaa.org`: `answer_cloudflare_staging=none` (no record at or under `staging`, disabled or proxied ones included).
- `answer_credits=no`: the account does not run on credits.
- `answer_oidc_immutable=no`: the GitHub organisation has not opted in to immutable OIDC subjects.
- `answer_repo_move_planned=no`: no rename or transfer of the repository is planned.
- 183-R2: `answer_r2=per-session`. The budget alert address is given per session as `TF_VAR_alert_email` and is not tracked.
- 183-R3: `answer_r3=keep`. DMARC aggregate reports go to `dmarc_agg@vali.email`.

## Task 2: IAM users with an inline policy

The assert mode exited 1, so Task 2 was raised. One user carried an inline policy.

| User (inventory label) | Inline policy | Decision | Recorded as |
| ---------------------- | ------------- | -------- | ----------- |
| `user-2` | `s3-static-media-access` | `convert`: keep the user, move the permission to a customer-managed policy | `OPERATOR_DECISION=convert attempt=20261021T113817Z.df495bf05 user=user-2` |

The decision record carries the inventory's label `user-2`, not the IAM user name: the inventory prints no user name outside `/openvaa/`, and the executor never received it.

The operator carried out the conversion and re-ran the assert mode in a later sitting:

```
s5b_assert_users_exit=0
s5b_inv=assert: PASS: 2 IAM users, none with an inline policy
s5b_logs_removed=yes
```

INFRA-17's account clause (no IAM user carries an inline policy, the applying identity included) holds as of 2026-10-21: the assert mode exited 0 over 2 IAM users, and the applying identity is a permission-set role whose policy is the AWS-managed `AdministratorAccess`.

The first paste of the Task 2 reply was refused by the helper's screen (line 5, class `secret-name`): the inventory's own verdict `assert: PASS: …` read `PASS` as a secret-word name. Nothing of that paste was stored. The operator confirmed in their own words on 2026-10-21 that the refused line held no secret, and ruled (option (a)) that the screen exempt exactly the inventory's fixed verdict forms; the exemption was committed as `8936b9dca86cc5b3386984d46c4f405574a6f959` and the same reply was then stored unchanged.

## Consequences

What the inventory of 2026-10-21 showed, per kind of finding, and what this plan did about it. A thing the inventory did not show is not present on that date, not absent for good.

1. GitHub OIDC provider. `oidc-providers count=0`. The account summary's `providers=1` is the `Providers` count of `get-account-summary`, not the OIDC list; which provider it counts was not observed (IAM Identity Center places a SAML provider in each account it assigns, which would account for it, but that is not checked here). No provider for `token.actions.githubusercontent.com` was present on 2026-10-21, so the bootstrap root creates it. No `infra/bootstrap/imports.tf` was written.
2. Route 53 hosted zones. `hosted-zones count=0`: neither `openvaa.org` nor `staging.openvaa.org` was hosted in Route 53 on 2026-10-21 (the parent zone is in Cloudflare, and `answer_cloudflare_staging=none`: no record at or under `staging` there). No blocker.
3. SES in `eu-north-1`. No identity `staging.openvaa.org` was present, so no `infra/envs/staging/dns-mail/imports.tf` was written. Other identities were present: the domain identity `openvaa.org` (verified) and one address identity. The suppression reasons were already `[BOUNCE,COMPLAINT]`, which is what the module would set; because other identities in the region share that account-level setting, `manage_account_suppression = false` was set in `infra/envs/staging/dns-mail/terraform.tfvars` with a one-line reason, so this root does not take ownership of a setting the existing identities rely on.
4. Same-named budget, repository or IAM entity. The one budget is `My_Monthly_Cost_Budget`, not `openvaa-monthly`; `repositories eu-north-1 count=0`, so no `openvaa-frontend`; no IAM user, group or non-service-linked role lies under `/openvaa/` (both users print `path=other`, the one listed role lies under `/aws-reserved/sso.amazonaws.com/eu-north-1/`), and the account summary reported `policies=0` customer-managed policies. Nothing collided on 2026-10-21. The customer-managed policy the operator created for the conversion in Task 2 was not inventoried, and its name and path are not observed here.
5. State bucket. The five buckets listed do not include `openvaa-tfstate-471112560111`. Not present on 2026-10-21; no blocker.
6. Budgets access. The budgets call returned a budget line and `budgets count=1`, with no access error code: billing access for IAM identities answered for the applying identity on 2026-10-21. Nothing to settle before plan 183-16 on this account.
7. Organisation membership. `organisation member=yes`: the account belongs to an AWS Organization. A service control policy could refuse calls that the roots make; none was observed refusing anything, and the inventory does not read the organisation's policies. Recorded for plans 183-16 and later: an `AccessDenied` there that names no IAM policy of this account may come from an SCP.

Also observed, outside the seven kinds:
- One IAM group (`AWSSESSendingGroupDoNotRename`, the group the SES console creates for SMTP credentials) carries the inline group policy `AmazonSesSendingAccess`, and `user-1` is its member. This is a group policy, not a user policy, so the assert mode (which judges users) does not count it and INFRA-17's user clause is not affected. Not changed by this plan; left for the operator.
- `user-2` carried the inline user policy `s3-static-media-access`. The operator decided `convert` (Task 2): the permission was moved to a customer-managed policy, and the assert mode then exited 0.

Rulings and answers drawn into the code:
- 183-R1: `identity-center`, permission set using `AdministratorAccess`; no code change.
- 183-R2: per-session; `infra/bootstrap/terraform.tfvars` keeps no `alert_email` line.
- 183-R3: keep; `dmarc_report_address = "dmarc_agg@vali.email"` stays.
- OIDC immutable subjects: no, so the two subject strings in `infra/bootstrap/terraform.tfvars` stand.
- Repository move planned: no.

183-R2: per-session
Credits: no
