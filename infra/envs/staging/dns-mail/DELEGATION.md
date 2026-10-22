# Delegation of `staging.openvaa.org`

This file records the records changed by hand at the DNS host of the parent zone `openvaa.org`, so
that the delegation of the staging name can be checked and undone.

Observed on 2026-10-11 in public DNS: the parent zone `openvaa.org` was served by two Cloudflare name
servers, `dora.ns.cloudflare.com` and `ganz.ns.cloudflare.com`; it had no `DS` and no `DNSKEY` record,
so it was unsigned; and it answered `NXDOMAIN` for `staging.openvaa.org` and for names under it.

| Type | Name      | Content                   | Entered (UTC)   |
| ---- | --------- | ------------------------- | --------------- |
| NS   | `staging` | `ns-1015.awsdns-62.net`   | not yet entered |
| NS   | `staging` | `ns-1109.awsdns-10.org`   | not yet entered |
| NS   | `staging` | `ns-1603.awsdns-08.co.uk` | not yet entered |
| NS   | `staging` | `ns-34.awsdns-04.com`     | not yet entered |

The four name servers are those of the hosted zone `Z02494181MAM7OCUAIPKC`, read from the root's
`name_servers` output after the first apply (reported 2026-10-22). They are not yet entered at the
parent zone. On 2026-10-22T06:56Z the parent zone's name server `dora.ns.cloudflare.com` answered
`NXDOMAIN` for `staging.openvaa.org` with no referral, and `1.1.1.1` returned no NS records for it.

Public resolvers have not yet been seen answering for `staging.openvaa.org` with these name servers.

Once the records are entered, this file also states:

- that no record existed at or under `staging` at the parent zone before the four were added, as the
  DNS host's dashboard showed it;
- that no `DS` record was added;
- the date on which a public resolver was first seen answering with the four name servers.
