---
title: Verify candidate distribution across parties and constituencies in the default seed
priority: low
created: 2026-04-23
context: Phase 58 UAT follow-up. Two distribution shapes are in play for the default seed but have only been spot-checked at the aggregate level.
---

# Check candidate distribution in the default seed

Two independent distributions govern the default-template candidates:

1. **By party** (`candidates-override.ts`, PARTY_WEIGHTS
   `[20, 18, 15, 12, 10, 10, 8, 7]`) — assigns each of 100 candidates
   to one of the 8 parties.
2. **By constituency** (`nominations-override.ts`,
   `allocateLinearFalloff(13, 100)` = `[12, 11, 10, 10, 9, 8, 8, 7, 6, 6, 5, 4, 4]`) —
   wires each candidate's nomination to a constituency.

Candidates are walked sequentially into constituencies in ref order,
so the first (largest) constituency receives mostly party_blue
candidates, the second a mix of blue + green, etc. This is
deterministic but not necessarily "realistic" — in a real election
you'd expect every party to have at least a token presence in every
constituency.

## What to check

- For each (party, constituency) pair, is the count `>= 1` when
  reasonable, or is any party entirely absent from any constituency?
- Does the voter app's per-constituency candidate list look
  plausibly diverse (multiple parties visible) in the small
  constituencies (counts of 4-6)?
- Does the compass / party-clustering view still show visible
  clustering by party when filtered to a single constituency, or
  does the small candidate count there collapse the clusters?

## Options if the distribution is too lumpy

- Interleave candidates across parties within each constituency
  (round-robin by party) before assigning to constituencies.
- Drop the party/constituency coupling entirely and assign party
  and constituency independently (weighted random with a seed).
- Keep the current shape but add a "party presence" floor
  (e.g. each party appears in at least 4 constituencies).

Not urgent — the current shape is correct at the aggregate level
and clustering is visible in the full candidate pool. Revisit if UAT
#1 (voter walkthrough + compass visual check) reveals a problem.
