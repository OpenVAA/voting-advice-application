---
created: 2026-10-21T12:35:50.242Z
title: Migrate openvaa.org DNS from Cloudflare to Route 53
area: infra
severity: minor
files:
  - infra/envs/staging/dns-mail/
  - infra/modules/dns-zone/main.tf
  - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-18-PLAN.md
---

## Problem

The parent zone `openvaa.org` is hosted at Cloudflare, managed by hand in the dashboard. Phase 183
(v2.17, workstream `deployment`) keeps it there: the `staging/dns-mail` root creates a Route 53
hosted zone for `staging.openvaa.org` only, and plan 183-18 delegates it by NS records the operator
enters at Cloudflare. So DNS is split across two providers, one of which sits outside Terraform:
records at or under the apex (and the delegation itself) cannot be planned, reviewed or reproduced
as code, and every new subdomain environment needs another manual Cloudflare step.

The operator wants the deployment to be fully on AWS.

## Solution

TBD. Points to settle when this is picked up:

- Inventory every record in the Cloudflare zone (including proxied / orange-cloud records, which
  stop being proxied after a move, and any Cloudflare-only features in use: page rules, redirects,
  workers, email routing, WAF) and decide what replaces each on AWS (CloudFront, etc.) or whether it is dropped.
- Create an `openvaa.org` hosted zone as code (likely its own long-lived root beside `staging/dns-mail`), import or recreate all
  records, then switch the registrar's nameservers to Route 53; lower TTLs first, keep Cloudflare
  live until propagation is confirmed.
- Existing SES domain identity `openvaa.org` (verified, eu-north-1, production access) has its
  DKIM/SPF/DMARC records at Cloudflare today; they must move intact or mail sending breaks.
- Once the apex is in Route 53, the `staging.openvaa.org` delegation becomes an in-account NS record
  that Terraform can own, replacing the manual step of plan 183-18.
- Check where the domain is registered (a registrar transfer to Route 53 Domains is optional and
  separate from moving the DNS).
