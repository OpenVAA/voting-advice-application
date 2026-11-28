# Delegation of `staging.openvaa.org`

This file records the records changed by hand at the DNS host of the parent zone `openvaa.org`, so
that the delegation of the staging name can be checked and undone.

Observed on 2026-10-11 in public DNS: the parent zone `openvaa.org` was served by two Cloudflare name
servers, `dora.ns.cloudflare.com` and `ganz.ns.cloudflare.com`; it had no `DS` and no `DNSKEY` record,
so it was unsigned; and it answered `NXDOMAIN` for `staging.openvaa.org` and for names under it.

| Type | Name      | Content                   | Entered (UTC)     |
| ---- | --------- | ------------------------- | ----------------- |
| NS   | `staging` | `ns-1015.awsdns-62.net`   | 2026-10-22T07:25Z |
| NS   | `staging` | `ns-1109.awsdns-10.org`   | 2026-10-22T07:25Z |
| NS   | `staging` | `ns-1603.awsdns-08.co.uk` | 2026-10-22T07:25Z |
| NS   | `staging` | `ns-34.awsdns-04.com`     | 2026-10-22T07:25Z |

The four name servers are those of the hosted zone `Z02494181MAM7OCUAIPKC`, read from the root's
`name_servers` output after the first apply (reported 2026-10-22). They were entered at Cloudflare in
the zone `openvaa.org`, each with Type `NS`, Name `staging` and TTL Auto. The time is when the
operator saved the last of the four, as reported by the operator.

## Before the records were entered

- **2026-10-11, public DNS:** the parent zone answered `NXDOMAIN` for `staging.openvaa.org` and for
  names under it.
- **2026-10-22T06:56Z, public DNS:** the parent zone's name server `dora.ns.cloudflare.com` answered
  `NXDOMAIN` for `staging.openvaa.org` with no referral, and `1.1.1.1` returned no NS records for it.
- **2026-10-22, the dashboard:** before adding the four records, the operator searched the zone
  `openvaa.org` in the Cloudflare dashboard for `staging` and found no record at or under the name.
  Nothing was shadowed by the delegation.

## Signing

- No `DS` record was added at the parent zone.
- On 2026-10-22T08:03Z neither zone was signed: `1.1.1.1` returned no `DS` record for
  `staging.openvaa.org` and no `DNSKEY` record for `openvaa.org`.

## After the records were entered

- **2026-10-22T07:25Z:** the operator's own query to `dora.ns.cloudflare.com` returned the referral
  with the four name servers.
- **2026-10-22T08:03Z:** both of the parent's name servers, `dora.ns.cloudflare.com` and
  `ganz.ns.cloudflare.com`, returned a referral (status `NOERROR`, no `aa` flag, TTL 300) naming
  exactly the four name servers in the table.
- **2026-10-22T08:03Z, first public answer:** `1.1.1.1` was first seen answering with the four name
  servers, and with an SOA from `ns-1015.awsdns-62.net` and `awsdns-hostmaster.amazon.com`. This is
  the first time anyone checked a public resolver after the records were entered. It may have
  answered earlier.

## Checking the delegation

No credential is needed. The first command names the parent's name servers. The second asks one of
them for a referral. Its authority section must list the four name servers in the table, and its
flags must not include `aa`:

```bash
dig +short NS openvaa.org @1.1.1.1
dig +norecurse NS staging.openvaa.org @dora.ns.cloudflare.com
dig +short NS staging.openvaa.org @1.1.1.1
dig +short SOA staging.openvaa.org @1.1.1.1
```

The last two ask a public resolver. They return the same four names, and an SOA naming an `awsdns`
server.

## Undoing the delegation

Remove the four NS records named `staging` from the zone `openvaa.org` at Cloudflare. Resolvers keep
an answer they have cached until its TTL runs out; the parent's referral has a TTL of 300 s. Once
the cached answers expire, the mail identity and every name under `staging.openvaa.org` stop
resolving.
