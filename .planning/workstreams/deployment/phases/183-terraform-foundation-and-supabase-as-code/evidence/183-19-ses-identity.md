# 183-19 evidence: the SES identity verified, the mail records published, production access

Attempt: 19-1 20261022T080840Z.2c9d25534
Attempt: 19-2 20261022T083313Z.2c9d25534

This file was written whole from the two attempt files above. It records only non-secret named lines. It holds no personal address and no credential. The SMTP outputs of `staging/dns-mail` were not read, and no test mail was sent.

## The operator's reply (19-1)

The reply was stored on 2026-10-22T08:33:02Z under `OPERATOR_REPLY=received attempt=20261022T080840Z.2c9d25534 plan=19 task=1`. `bound 19-1 OPERATOR_REPLY plan=19 task=1` exits 0. The operator ran the commands between the checkpoint at 2026-10-22T08:08Z and that time. The exact minute of each read was not reported.

- **Account check (first):** `s0_account=471112560111`, under the operator's profile for this account.
- **The identity read (step 1), 2026-10-22:**
  - `s1_identity_exit=0`
  - `s1_verified=true`
  - `s1_dkim=SUCCESS`
  - `s1_mailfrom=SUCCESS`

  The three values are on three separate lines. **The identity `staging.openvaa.org` is verified for sending**, with DKIM and the MAIL FROM domain both `SUCCESS`. At 183-17 the same three fields read `false`, `PENDING` and `PENDING`.
- **The account read, before anything was filed (`s2a_`, 2026-10-22):**
  - `s2a_account_exit=0`
  - `s2a_production=true`
  - `s2a_sending=true`
  - `s2a_max24h=50000.0`
- **Steps 2 and 3 were skipped:** `answer_skip_steps_2_3=yes`, the operator's ruling, written by the operator as `skip23=yes`. That means:
  - **No production-access request was filed**, so there is no filing date to record.
  - **No mailbox identity was created** for the sandbox.

  The account already has production access in `eu-north-1`. Production access is set per account and region. A new request would overwrite the account's contact details, and a verified recipient is needed only in the sandbox.

  The account inventory of plan 183-14 agrees. On 2026-10-21 it read `production=True sending=True max24h=50000.0` for `eu-north-1`, beside the verified domain identity `openvaa.org`. The other three regions it read were in the sandbox (`production=False`, `max24h=200.0`).
- **Cleanup:** `s4_logs_removed=yes`.
- **No address:** none was given to any command, pasted, or stored.

## The published records (19-2), read from `1.1.1.1` on 2026-10-22

Each read ran at 2026-10-22T08:33:13Z. The recording shell did not capture the statuses, so each read was run again at 08:33:21Z, and every status was 0.

| Command | Answer |
| --- | --- |
| `dig +short CNAME ehvyibk54e4sxpv6s435nycysywzrovo._domainkey.staging.openvaa.org @1.1.1.1` | `ehvyibk54e4sxpv6s435nycysywzrovo.dkim.amazonses.com.` |
| `dig +short CNAME euuawpbv6grmmsfmkmni5zaxxlkxksp4._domainkey.staging.openvaa.org @1.1.1.1` | `euuawpbv6grmmsfmkmni5zaxxlkxksp4.dkim.amazonses.com.` |
| `dig +short CNAME vdc6ounwu3wloqxms2ajw3acw4oycwkb._domainkey.staging.openvaa.org @1.1.1.1` | `vdc6ounwu3wloqxms2ajw3acw4oycwkb.dkim.amazonses.com.` |
| `dig +short MX mail.staging.openvaa.org @1.1.1.1` | `10 feedback-smtp.eu-north-1.amazonses.com.` |
| `dig +short TXT mail.staging.openvaa.org @1.1.1.1` | `"v=spf1 include:amazonses.com ~all"` |
| `dig +short TXT _dmarc.staging.openvaa.org @1.1.1.1` | `"v=DMARC1; p=quarantine; rua=mailto:dmarc_agg@vali.email"` |

- **DKIM targets:** each of the three CNAME targets is `<token>.dkim.amazonses.com.`. That ends in the signing zone 183-17 recorded from `SigningHostedZone`, `dkim.amazonses.com`. The tokens equal 183-17's.
- **MAIL FROM:** the MX and SPF records of `mail.staging.openvaa.org` are published.
- **DMARC:** the record of `_dmarc.staging.openvaa.org` is published with `p=quarantine`.

Criterion 4's second sentence is therefore observed on 2026-10-22: the SES domain identity is verified, with its DKIM, SPF and DMARC records published in the zone.

## Not observed here

- **SMTP send:** whether SES accepts an SMTP send under the scoped send policy (one From address, on this identity's ARN). No send was made, and the SMTP outputs were not read. The fallback if SES refuses is the same statement on resource `*`, with the From-address condition kept.
- **Received mail:** whether it passes DKIM, SPF and DMARC aligned with the From domain, and whether the staging name's DMARC record takes the place of the organisation's policy.
- **Support:** how Support would answer a production-access request. None was filed.
