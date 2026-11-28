# 183-17 Zone and mail root apply, identity read, DKIM zone and account asserts

Second apply needed: no

The signing zone that SES reports for the identity equals the variable's value, so the three DKIM
records already point into the right zone. Plan 183-18 skips its step 0 and goes straight to the
delegation.

## Dates and provenance

- **Account and region:** the operator ran Task 1 in account `471112560111`, region `eu-north-1`,
  with Terraform 1.16.5. The shell was signed in through the Identity Center profile
  `openvaa-admin`, exported as `AWS_PROFILE=openvaa-admin`.
- **When the apply ran:** the Task 1 checkpoint was raised at 2026-10-21T19:46Z, and the reply was
  stored at 2026-10-22T06:56Z. The apply and every read-back below ran in one sitting inside that
  window. The exact time of the apply was not reported, so it is not stated here.
- **This file:** written at 2026-10-22T06:58Z.
- **How the commands were run:** the orchestrator wrapped the plan's commands at 60 characters for
  the operator. The commands were identical:
  - the two long `jq` filters were held in the shell variables `J6` and `J7`;
  - the inventory script's path was held in `INV`.

  Every line name is the plan's own.
- **Paste artifact:** the operator's paste of step 4 ended with a stray two-character line. It was a
  paste artifact, not part of the reply, and it is not stored.
- **No `s9_inv` lines:** both assert modes printed 0, so none were asked for.

Attempt: 17-1 20261021T194634Z.27ed35730
Attempt: 17-2 20261022T065643Z.27ed35730

Only non-secret named lines are recorded. The name servers, the zone id and the DKIM tokens are
public DNS data. The SMTP user name and the SMTP password were neither printed nor pasted, and this
file does not hold them. The record also holds:

- no access key id;
- no assumed-role session name;
- no line from a plan or apply log;
- no e-mail address other than the sender `noreply@staging.openvaa.org`.

## Apply

| Line                  | Value                                                         |
| --------------------- | ------------------------------------------------------------- |
| `s2_account`          | `471112560111`                                                |
| `s3_init_exit`        | `0`                                                           |
| `s4_plan_exit`        | `0`                                                           |
| `s4_plan_line`        | `Plan: 14 to add, 0 to change, 0 to destroy.`                 |
| `s5_apply_exit`       | `0`                                                           |
| `s5_apply_line`       | `Apply complete! Resources: 14 added, 0 changed, 0 destroyed.` |
| `s8_second_plan_exit` | `0` (with `-detailed-exitcode`: no changes)                   |
| `s10_state_sse`       | `AES256` (`hand/staging/dns-mail/terraform.tfstate`)          |
| `s11_logs_removed`    | `yes`                                                         |

The plan announced 14 to add, and the apply added 14. The code, with
`manage_account_suppression = false`, declares 14 resources:

- the zone: 1;
- the identity and its MAIL FROM attributes: 2;
- three DKIM records, the MX, the SPF and the DMARC records: 6;
- the SMTP user, its access key, the send policy, its attachment and the exclusive-inline-policies
  guard: 5.

That count comes from the code. The plan's per-resource list was not pasted, so what was observed is
only that the plan's count equals the apply's.

## Zone

- Zone id: `Z02494181MAM7OCUAIPKC`
- Name servers (`s6_name_server`):
  - `ns-1015.awsdns-62.net`
  - `ns-1109.awsdns-10.org`
  - `ns-1603.awsdns-08.co.uk`
  - `ns-34.awsdns-04.com`
- Sender (`s6_sender`): `noreply@staging.openvaa.org`

## DKIM tokens

| Index | From Terraform (`s6_dkim_cname_`)  | From SES (`s7_dkim_cname_`)        |
| ----- | ---------------------------------- | ---------------------------------- |
| 1     | `ehvyibk54e4sxpv6s435nycysywzrovo` | `ehvyibk54e4sxpv6s435nycysywzrovo` |
| 2     | `euuawpbv6grmmsfmkmni5zaxxlkxksp4` | `euuawpbv6grmmsfmkmni5zaxxlkxksp4` |
| 3     | `vdc6ounwu3wloqxms2ajw3acw4oycwkb` | `vdc6ounwu3wloqxms2ajw3acw4oycwkb` |

The three values are equal, in the same order.

## SES identity read (`aws sesv2 get-email-identity`)

| Line               | Value                |
| ------------------ | -------------------- |
| `s7_identity_exit` | `0`                  |
| `s7_verified`      | `false`              |
| `s7_dkim`          | `PENDING`            |
| `s7_zone`          | `dkim.amazonses.com` |
| `s7_mailfrom`      | `PENDING`            |

These are the states expected before the delegation. Nothing outside the zone answers for the name
yet, so neither DKIM nor MAIL FROM can be found.

## DKIM signing zone comparison

- **Reported:** `SigningHostedZone` = `dkim.amazonses.com`.
- **Variable:** `dkim_signing_hosted_zone = "dkim.amazonses.com"` in
  `infra/envs/staging/dns-mail/terraform.tfvars`.
- **Outcome:** equal. The default was confirmed for this identity, reported 2026-10-22.
  `terraform.tfvars` is unchanged.

Second apply needed: no

## INFRA-17 account clause

Read with the SMTP user in place, the last IAM user this phase creates. Reported 2026-10-22.

- **Every IAM user** (`--assert-no-inline-user-policies`): `s9_assert_users_exit=0`. No IAM user in
  the account carries an inline policy.
- **Roles and users under `/openvaa/`** (`--assert-managed-only /openvaa/`):
  `s9_assert_managed_exit=0`. Everything under the path has managed policies only.
- **The SMTP user `openvaa-staging-ses-smtp`:**
  - `s9_smtp_inline_count=0`;
  - `s9_smtp_attached=openvaa-staging-ses-send`, the one customer-managed send policy.
- **The applying identity:** an IAM Identity Center permission-set role using the AWS-managed
  `AdministratorAccess`, with no inline policy, as ruled in plan 183-14 (183-R1).

The account clause of INFRA-17 is met as of this read.

## Before the delegation

Read by the executor at 2026-10-22T06:56Z, with no credential. This is the red control of the
delegation check.

`dig +short NS openvaa.org @1.1.1.1`:

```
dora.ns.cloudflare.com.
ganz.ns.cloudflare.com.
```

`dig +norecurse NS staging.openvaa.org @dora.ns.cloudflare.com.`, the answer section and the
authority section:

```
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 35101
;; flags: qr aa; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; QUESTION SECTION:
;staging.openvaa.org.		IN	NS

;; AUTHORITY SECTION:
openvaa.org.		1800	IN	SOA	dora.ns.cloudflare.com. dns.cloudflare.com. 2415851076 10000 2400 604800 1800
```

`dig +short NS staging.openvaa.org @1.1.1.1`: empty output, exit 0.

- **Parent:** an authoritative `NXDOMAIN` with the zone's SOA. There is no referral.
- **Public resolver:** no answer.

This is the expected state: nobody has delegated the name yet.
