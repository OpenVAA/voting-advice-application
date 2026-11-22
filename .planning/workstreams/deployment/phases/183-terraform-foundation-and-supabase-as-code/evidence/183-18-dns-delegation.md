# 183-18 Delegation of `staging.openvaa.org` at Cloudflare, seen from outside

The referral equals the table. Both of the parent's name servers refer `staging.openvaa.org` to
exactly the four name servers of `DELEGATION.md`, compared as sets. A public resolver answers the NS
and SOA queries from Route 53.

Attempt: 18-1 20261022T070416Z.9a595c791
Attempt: 18-2 20261022T080311Z.9a595c791

Every query below was run by the executor with `dig` and no credential. Name servers, DKIM tokens and
record values are public DNS data. The only address in this file is the DMARC report address, which
is already published in public DNS and named in the tracked `terraform.tfvars`. Times are UTC; the
`WHEN:` lines that `dig` prints are in the workstation's local time (EEST, UTC+3).

## Times

| What                                                             | When (UTC)           | Source                        |
| ---------------------------------------------------------------- | -------------------- | ----------------------------- |
| Last of the four records saved at Cloudflare                     | 2026-10-22T07:25Z    | operator (`answer_saved_utc`) |
| Operator's own referral query to `dora.ns.cloudflare.com`        | 2026-10-22T07:25:41Z | operator, reported            |
| Executor's referral check, both parent name servers              | 2026-10-22T08:03:11Z | executor                      |
| First public answer seen (`1.1.1.1`, NS and SOA)                 | 2026-10-22T08:03:11Z | executor                      |
| Public resolver queried again at the end of the task             | 2026-10-22T08:04:20Z | executor                      |

The first public answer is the first time a public resolver was asked after the records were entered.
It answered at once, so no poll was needed. It may have answered earlier; that was not observed.

## The operator's reply (Task 1)

The reply was stored in attempt `18-1 20261022T070416Z.9a595c791` under
`OPERATOR_REPLY=received attempt=20261022T070416Z.9a595c791 plan=18 task=1 head=9a595c791cfedb58271d12340783edd8077650c1 zone=Z02494181MAM7OCUAIPKC`.
`bound 18-1 OPERATOR_REPLY plan=18 task=1 zone=Z02494181MAM7OCUAIPKC` exits 0.

| Line                             | Value                     |
| -------------------------------- | ------------------------- |
| `answer_ns_1`                    | `ns-1015.awsdns-62.net.`  |
| `answer_ns_2`                    | `ns-1109.awsdns-10.org.`  |
| `answer_ns_3`                    | `ns-1603.awsdns-08.co.uk.` |
| `answer_ns_4`                    | `ns-34.awsdns-04.com.`    |
| `answer_saved_utc`               | `2026-10-22T07:25Z`       |
| `answer_existing_staging_record` | `none`                    |

Provenance, as stored on `note:` lines of the attempt file:

- **The records:** the operator entered the four NS records in the Cloudflare dashboard and said
  that all passed as expected.
- **Where the four values come from:** the operator did not type the four `answer_ns_` values from
  the dashboard. They were taken from the operator's own pasted output of
  `dig +norecurse NS staging.openvaa.org @dora.ns.cloudflare.com`. That output had status `NOERROR`,
  `AUTHORITY: 4` and TTL 300, at 2026-10-22T07:25:41Z, and listed exactly the four values of
  `DELEGATION.md` with trailing dots. They show what the parent serves. They are not a reading of the
  dashboard's fields.
- **The saved time:** `answer_saved_utc` is the operator's `date -u` output, run right after saving.
- **No existing record:** `answer_existing_staging_record=none` was confirmed explicitly by the
  operator in a separate message.
- **No refusal:** no dashboard message; no record was refused.
- **No step 0:** plan 183-17 recorded `Second apply needed: no`
  (`has 17-2 '^Second apply needed: yes$'` exits 1). The reply holds no `s0_` line.

## 1. The parent's name servers

`dig +short NS openvaa.org @1.1.1.1`, 2026-10-22T08:03:11Z:

```
dora.ns.cloudflare.com.
ganz.ns.cloudflare.com.
```

## 2. The referral

`dig +norecurse NS staging.openvaa.org @dora.ns.cloudflare.com.`, 2026-10-22T08:03:11Z:

```
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 61425
;; flags: qr; QUERY: 1, ANSWER: 0, AUTHORITY: 4, ADDITIONAL: 1

;; QUESTION SECTION:
;staging.openvaa.org.		IN	NS

;; AUTHORITY SECTION:
staging.openvaa.org.	300	IN	NS	ns-1015.awsdns-62.net.
staging.openvaa.org.	300	IN	NS	ns-1109.awsdns-10.org.
staging.openvaa.org.	300	IN	NS	ns-1603.awsdns-08.co.uk.
staging.openvaa.org.	300	IN	NS	ns-34.awsdns-04.com.

;; SERVER: 173.245.58.108#53(173.245.58.108)
```

`dig +norecurse NS staging.openvaa.org @ganz.ns.cloudflare.com.`, 2026-10-22T08:03:11Z:

```
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41735
;; flags: qr; QUERY: 1, ANSWER: 0, AUTHORITY: 4, ADDITIONAL: 1

;; QUESTION SECTION:
;staging.openvaa.org.		IN	NS

;; AUTHORITY SECTION:
staging.openvaa.org.	300	IN	NS	ns-1015.awsdns-62.net.
staging.openvaa.org.	300	IN	NS	ns-1109.awsdns-10.org.
staging.openvaa.org.	300	IN	NS	ns-1603.awsdns-08.co.uk.
staging.openvaa.org.	300	IN	NS	ns-34.awsdns-04.com.

;; SERVER: 172.64.35.40#53(172.64.35.40)
```

- **Flags:** `qr` only. There is no `aa`, so this is a referral, not an authoritative answer from the
  parent.
- **The set comparison:** the four names in the authority section, with the trailing dot removed and
  sorted, equal the four in the table of `DELEGATION.md`:
  - `ns-1015.awsdns-62.net`
  - `ns-1109.awsdns-10.org`
  - `ns-1603.awsdns-08.co.uk`
  - `ns-34.awsdns-04.com`

  No name in the referral is outside the table, and none in the table is missing.
- **The red control:** the same query to `dora.ns.cloudflare.com` answered `NXDOMAIN` with no
  referral at 2026-10-22T06:56Z (plan 183-17's "Before the delegation") and again at
  2026-10-22T07:03Z, just before the checkpoint was raised.

Task 1's verify (the four distinct Route 53 names in a parent name server's referral) exits 0.

## 3. A public resolver

`dig +short NS staging.openvaa.org @1.1.1.1`, 2026-10-22T08:03:11Z:

```
ns-1015.awsdns-62.net.
ns-1109.awsdns-10.org.
ns-1603.awsdns-08.co.uk.
ns-34.awsdns-04.com.
```

`dig +short SOA staging.openvaa.org @1.1.1.1`, 2026-10-22T08:03:11Z:

```
ns-1015.awsdns-62.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400
```

The SOA names an `awsdns` server and `awsdns-hostmaster.amazon.com`, so the answer comes from the
Route 53 zone. Both queries were run again at the end of the task, at 2026-10-22T08:04:20Z. They
returned the same four NS names and the same SOA.

An extra `dig +trace SOA staging.openvaa.org` timed out from this host (exit 9, "no servers could be
reached"). It is not one of the plan's queries, and it shows nothing about the zone.

## 4. Signing

At 2026-10-22T08:03:12Z:

- `dig +short DS staging.openvaa.org @1.1.1.1`: empty output, exit 0. No `DS` record.
- `dig +short DNSKEY openvaa.org @1.1.1.1`: empty output, exit 0. The parent zone is not signed.

No `DS` record was added.

## 5. The mail records

Through `1.1.1.1`, at 2026-10-22T08:03:12Z.

| Query                                                                 | Answer                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `CNAME ehvyibk54e4sxpv6s435nycysywzrovo._domainkey.staging.openvaa.org` | `ehvyibk54e4sxpv6s435nycysywzrovo.dkim.amazonses.com.`     |
| `CNAME euuawpbv6grmmsfmkmni5zaxxlkxksp4._domainkey.staging.openvaa.org` | `euuawpbv6grmmsfmkmni5zaxxlkxksp4.dkim.amazonses.com.`     |
| `CNAME vdc6ounwu3wloqxms2ajw3acw4oycwkb._domainkey.staging.openvaa.org` | `vdc6ounwu3wloqxms2ajw3acw4oycwkb.dkim.amazonses.com.`     |
| `MX mail.staging.openvaa.org`                                         | `10 feedback-smtp.eu-north-1.amazonses.com.`               |
| `TXT mail.staging.openvaa.org`                                        | `"v=spf1 include:amazonses.com ~all"`                      |
| `TXT _dmarc.staging.openvaa.org`                                      | `"v=DMARC1; p=quarantine; rua=mailto:dmarc_agg@vali.email"` |

- **DKIM:** the three CNAMEs carry the three tokens of plan 183-17, in the same order, into
  `dkim.amazonses.com`, the signing zone SES reported.
- **MAIL FROM:** the MX and the SPF record of `mail.staging.openvaa.org` resolve.
- **DMARC:** the DMARC record resolves.

The SES identity's own state (verified, DKIM and MAIL FROM `SUCCESS`) is not read here. That is
plan 183-19.
