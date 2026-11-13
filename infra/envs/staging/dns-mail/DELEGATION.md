# Delegation of `staging.openvaa.org`

This file records the records changed by hand at the DNS host of the parent zone `openvaa.org`, so
that the delegation of the staging name can be checked and undone.

Observed on 2026-10-11 in public DNS: the parent zone `openvaa.org` was served by two Cloudflare name
servers, `dora.ns.cloudflare.com` and `ganz.ns.cloudflare.com`; it had no `DS` and no `DNSKEY` record,
so it was unsigned; and it answered `NXDOMAIN` for `staging.openvaa.org` and for names under it.

| Type | Name      | Content                           | Entered (UTC) |
| ---- | --------- | --------------------------------- | ------------- |
| NS   | `staging` | to be filled when the zone exists |               |
| NS   | `staging` | to be filled when the zone exists |               |
| NS   | `staging` | to be filled when the zone exists |               |
| NS   | `staging` | to be filled when the zone exists |               |

Public resolvers have not yet been seen answering for `staging.openvaa.org` with these name servers.

Once the records are entered, this file also states:

- that no record existed at or under `staging` at the parent zone before the four were added, as the
  DNS host's dashboard showed it;
- that no `DS` record was added;
- the date on which a public resolver was first seen answering with the four name servers.
