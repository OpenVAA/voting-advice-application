# Phase 183: Terraform Foundation and Supabase as Code - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 183-Terraform Foundation and Supabase as Code
**Areas discussed:** 183-1 DNS, 183-2 long-lived AWS resources, 183-3 layout, 183-4 first bootstrap apply, 183-5 IAM, 183-6 OIDC trust, 183-8 parity guard coverage, 183-9 how the guard reads HCL, 183-10 throwaway project, 183-11 SES identity, 183-12 budget, 183-13 secrets and applies, 183-14 split, 183-15 action pinning, operator inputs

---

## How this discussion was held

The discussion was not interactive. Every decision of phases 181, 182 and 183 was written into one document,
`.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md`, with its options as checkboxes and one
option marked ★ RECOMMENDED. The operator filled it in one pass on 2026-10-11. An unticked decision takes its ★;
a note beats a box. That document holds every option presented, with its cost, and the table "Rulings as read,
2026-10-11" at its end. It is the full record and is not repeated here.

## The operator's choices

Every decision was left unticked and took its ★ RECOMMENDED option.

## Notes the operator wrote

Operator inputs, as written: applying identity "TBA"; DNS host "Cloudflare"; Supabase region left blank (★ `eu-north-1`); Supabase organisation and token holder "TBA"; budget "ok" (100 USD a month to the operator's address); DMARC mailbox "TBA"; mail volume "peak 2000, expected 100"; reading 3 "ok". Whether `staging` is unused at Cloudflare was not answered.

## Claude's Discretion

See the "Claude's Discretion" list of `183-CONTEXT.md`.

## Deferred Ideas

See the "Deferred Ideas" section of `183-CONTEXT.md`.
