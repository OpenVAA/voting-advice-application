---
created: 2026-08-27T16:04:00.000Z
title: Two candidate failure-path states are unscanned — the portrait-upload error and the preview notFound error
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
---

## The gap

Two error states on already-scanned candidate `(protected)` routes were never rendered by Phase
147's 14 scans:

| state | marker | route |
|---|---|---|
| portrait-upload error | `profile-image-error` | `/candidate/profile` |
| preview `notFound` error | — | `/candidate/preview` |

Both are unknowns, not zeros. They are grouped because they share a shape (a failure branch of a
route whose success branch is scanned) and, more importantly, a **reason for exclusion**.

## Why Phase 147 did not take them

`147-SCOUT-INVENTORY.md` § 6 records both as **out of scope for a route-family scan**: reaching them
means forcing a failure — an invalid upload, a missing entity — which is a fault-injection concern
rather than a route-reach concern. A route-family scan settles on a surface and scans it; it does
not manufacture backend failures.

That reasoning is recorded so the exclusion reads as a **decision** rather than an oversight.

## Solution — decide before building

Two defensible answers, and they should be chosen between rather than drifted into:

1. **Scan them anyway**, in whichever spec family already knows how to force the failure (the
   candidate journey specs already exercise error paths), reusing `assertAxeScan` from
   `tests/tests/utils/axeScan.ts` so the gate is the same one — not a second copy that can drift.
2. **Record them as permanently out of the route-family scan's scope**, with this reasoning, so the
   candidate family's coverage claim is bounded explicitly rather than by omission.

Error surfaces are worth scanning — they are where terse, unlabelled, colour-only messaging tends to
live — so option 1 is not obviously the more expensive one.
