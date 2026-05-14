---
date: "2026-05-14"
status: pending
scope: v2.11+
origin: Phase 86 Plan 04 Task 2 (PASSED-WITH-DEFERRAL)
related:
  - .planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/post-fix/sha256.txt
  - .planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/post-fix/sha256.txt
  - .planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-RESEARCH.md (§3.11 + Open-Q-6)
  - .planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-01-SUMMARY.md (Task 5 — Plan 01's hardening attempt, commit 9cc115469)
priority: medium
---

# Party-drawer boundary flake — residual after Phase 86 hardening

## Symptom

In the Phase 86 3-run cold-start gate, runs 2 + 3 SHA-diverged on EXACTLY ONE cell:

```
voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs
```

Run 2 reported this as `fail`; run 3 reported it as `pass`. Same symptom pattern Phase 84 + Phase 85 hit. (Run 1 was operator-acknowledged invalid baseline — excluded from comparison.)

## Root cause classification

Per Phase 83 DETERM-07b: this is a **PASS_LOCKED-boundary graduate**, not a deterministic regression. The cell's hydration-completeness-guard boundary classification means it can pass or fail across cold-start runs — the test interacts with the party-drawer modal during a hydration-sensitive window.

## Phase 86 mitigation (landed but insufficient)

Plan 01 Task 5 (`commit 9cc115469`, `test(86-01): harden party-drawer boundary flake via expect.poll guard`) added an `expect.poll()` settle guard around the drawer-open assertion. This reduced the flake frequency vs Phase 85's baseline, but did not fully eliminate the boundary classification — runs 2 and 3 still diverge on this cell.

## v2.11+ proposed action

Investigate the root hydration race in the party-drawer component itself (not just the test):
- Suspect: `apps/frontend/src/lib/voter/.../PartyDrawer.svelte` (or equivalent) — the drawer-open transition likely renders its inner content (info, candidates, opinions tabs) asynchronously after the modal mounts.
- Possible fix: add a hydration-completeness signal to the drawer component (e.g., `data-hydrated="true"` attribute set after all tabs mount) and assert against it in the test instead of polling visible content.
- Alternative: route the test to a fixture state that guarantees the drawer is pre-hydrated before the test interaction.

## Acceptance for v2.11+ close

3-run cold-start gate produces strict SHA-identity on FIRST attempt — no party-drawer divergence across any pair of runs.

## Phase 87 implication

Phase 87 (v2.10 milestone close) entry condition is "fresh 3-run cold-start gate SHA-identical FIRST attempt." Phase 86 closes with PASSED-WITH-DEFERRAL on this contract — Phase 87 inherits the residual boundary flake unless it's resolved as part of Phase 87 scope OR explicitly carried into v2.11+ as documented here.
