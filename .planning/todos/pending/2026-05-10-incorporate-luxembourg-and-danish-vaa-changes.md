---
title: Forward-port relevant changes from Luxembourg + Danish VAA forks back into upstream
priority: medium
created: 2026-05-10
context: Captured at v2.8 milestone close. The Luxembourg and Danish VAA deployments have evolved with field-driven fixes and feature additions that have not yet been folded back into the upstream OpenVAA tree. Identify the deltas, classify them, and merge what's generally useful.
---

# Incorporate changes from Luxembourg and Danish VAAs

The Luxembourg and Danish VAA deployments are downstream forks (or
heavily configured deployments) of OpenVAA that have accumulated
deployment-specific fixes and customizations during their respective
election cycles. Some of those changes are general-purpose improvements
that should land upstream; others are deployment-specific and should
stay downstream.

## Goal

Inventory the deltas between each downstream fork and upstream HEAD,
classify each delta, and merge or reject explicitly.

## Approach

1. **Inventory** — for each fork:
   - Identify the fork point (commit hash on upstream main at the time
     the fork branched).
   - Run `git diff upstream-fork-point..fork-HEAD` to enumerate the
     full delta.
   - Bucket the delta by file/feature: bug fixes, UX polish,
     deployment configuration, brand-specific assets, accessibility
     improvements, locale additions, etc.
2. **Classify each delta:**
   - **Forward-port** — generally useful; cherry-pick into upstream
     with author attribution preserved.
   - **Skip** — deployment-specific; leave in fork only.
   - **Land in adapter / config layer** — generally useful but should
     land via the configuration system (StaticSettings,
     appCustomization) rather than as code changes.
3. **Apply** — open one PR per logical group. Rebase against current
   HEAD; the v2.8 hygiene work likely reshuffled some files the forks
   touched.
4. **Communicate** — let the fork maintainers know what landed so they
   can drop their local-only carries.

## Why this matters now

Upstream has just shipped v2.8 (frontend hygiene + alliance card). Any
divergence in the fork repos that touches the same files has become
harder to merge over time. Now is a good moment — between v2.8 and the
v2.9 E2E coverage workstream — to reconcile.

## Files of interest

- TBD per fork — populate during the inventory step.
- Likely candidates: `apps/frontend/src/lib/i18n/`,
  `apps/frontend/src/lib/components/`, candidate-app routes,
  identity-provider config.

## Cross-references

- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` — origin of this todo.
