---
created: "2026-08-24T19:33:00.000Z"
title: Hand-authored con_01..con_05 now share ConstituenciesGenerator's synthetic namespace
area: dev-seed
files:
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/generators/ConstituenciesGenerator.ts
---

## Problem

Phase 145 plan 06 renamed the `default` template's hand-authored constituency identifiers
`c_01`–`c_05` to `con_01`–`con_05`, adopting the typecode read from
`ConstituenciesGenerator.ts:65`. That achieved the intended idiom consistency, but it put
hand-authored ids inside the generator's **synthetic** `con_NN` namespace, whose counter
restarts at `i=0` regardless of any `fixed[]` rows already present.

It also contradicts the convention `default.ts:36-38` states in its own header — semantic names
for hand-authored rows, zero-padded numeric for generated ones.

Latent today because the collection declares `count: 0`, so no synthetic constituency is ever
generated. The pre-rename `c_01` form could not collide; the post-rename form can. Anyone who
later sets a non-zero `count` on that collection gets an external-id collision, and because
`external_id` is the bulk upsert's key, the symptom would be silently overwritten rows rather
than an error.

## Solution

Pick one, and state which in the template header so the convention stops being ambiguous:

1. Give the hand-authored rows a distinguishable form within the same typecode
   (e.g. `con_fixed_01`, or a semantic slug like `con_uusimaa`), keeping the typecode consistent
   while leaving the synthetic counter's namespace free. Preferred — it satisfies TMPL-04's
   idiom goal without re-arming the collision.
2. Make `ConstituenciesGenerator` start its counter past any `fixed[]` rows. Fixes the class for
   every collection, but is a wider change with its own ordering assumptions.

Whichever is chosen, `ALLIANCE_MEMBERSHIP` and any other by-value consumer must move with it —
plan 06 established that it is the only such map in `packages/dev-seed`, and phase 145's strand
proof (`S1`…`S4`) is the template for showing a rename does not strand rows.

## Source

Phase 145 code review, finding WR-04.
