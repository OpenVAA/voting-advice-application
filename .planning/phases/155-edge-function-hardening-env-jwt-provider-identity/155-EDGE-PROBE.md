# Phase 155 — Spec-less Edge Probe Report

**Generated:** 2026-08-28, by `/gsd-plan-phase 155` step 7.95 (spec-less probe fallback).

Phase 155 has no `155-SPEC.md`, so neither a `## Edge Coverage` nor a `## Prohibitions`
section was supplied. The deterministic edge probe (`gsd-core/bin/lib/edge-probe.cjs`) was
therefore run over the verbatim requirement text of `REVIEW-EDGE-01..05`
(`.planning/REQUIREMENTS.md:113-117`), and its report was handed to the planner as the
`$COVERAGE` input to the `<downstream_consumer>` else-branch lift.

This file exists so the 8-in/8-out accounting is auditable after the fact — the plan-checker
could not reconcile the count without it.

## Raw report

```json
{
  "items": [
    { "requirement_id": "REVIEW-EDGE-01", "category": "unclassified", "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "unclassified — review manually" },
    { "requirement_id": "REVIEW-EDGE-02", "category": "adjacency",    "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "When two things are exactly equal or just touch, do they merge, collide, or separate?" },
    { "requirement_id": "REVIEW-EDGE-02", "category": "empty",        "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "What is the result for empty, single-element, or null input?" },
    { "requirement_id": "REVIEW-EDGE-02", "category": "ordering",     "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "When elements compare equal, is output order specified and stable?" },
    { "requirement_id": "REVIEW-EDGE-03", "category": "unclassified", "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "unclassified — review manually" },
    { "requirement_id": "REVIEW-EDGE-04", "category": "idempotency",  "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "What happens if this runs twice on the same input?" },
    { "requirement_id": "REVIEW-EDGE-04", "category": "concurrency",  "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "If interrupted or run in parallel, what is guaranteed?" },
    { "requirement_id": "REVIEW-EDGE-05", "category": "unclassified", "status": "unresolved", "verification": null, "resolution": null, "reason": null, "probe": "unclassified — review manually" }
  ],
  "coverage": { "applicable": 8, "resolved": 0, "unresolved": 8, "byVerification": { "explicit": 0, "backstop": 0 } }
}
```

## Disposition (8 in, 8 out)

Per §C of `gsd-core/references/specless-probe-fallback.md`: a resolvable row is authored into
`must_haves` (plain string when a defensible acceptance criterion exists; a flat-scalar
`{ statement, verification: backstop }` marker otherwise), and an `unclassified` row stays
`unresolved` and is surfaced as a flagged assumption — never auto-resolved with backstop and
never auto-dismissed.

| # | Requirement | Category | Disposition | Where |
|---|---|---|---|---|
| 1 | REVIEW-EDGE-01 | unclassified | **flagged assumption** (unresolved) — behaviour on input valid in neither alphabet | `155-02-PLAN.md` `<flagged_assumptions>` |
| 2 | REVIEW-EDGE-02 | adjacency | authored into `must_haves.truths` — empty string treated as missing | `155-02-PLAN.md` |
| 3 | REVIEW-EDGE-02 | empty | authored into `must_haves.truths` | `155-02-PLAN.md` |
| 4 | REVIEW-EDGE-02 | ordering | authored — request-body operand stays first in the `:197` chain; guard operand order | `155-03-PLAN.md` / `155-05-PLAN.md` |
| 5 | REVIEW-EDGE-03 | unclassified | **flagged assumption** (unresolved) — known-key-but-empty-value vs unknown-key pass-through | `155-04-PLAN.md` `<flagged_assumptions>` |
| 6 | REVIEW-EDGE-04 | idempotency | authored into `must_haves.truths` as a plain string | `155-03-PLAN.md` |
| 7 | REVIEW-EDGE-04 | concurrency | authored as a flat-scalar `{ statement, verification: backstop }` marker | `155-03-PLAN.md` |
| 8 | REVIEW-EDGE-05 | unclassified | **flagged assumption** (unresolved) — a token carrying no `aud`/`iss` claim at all | `155-01-PLAN.md` `<flagged_assumptions>` |

**Accounting:** 8 surfaced = 5 authored into `must_haves` + 3 surfaced as flagged assumptions.
No silent drops.

## Prohibitions

There is no compiled prohibition engine; §B's recall pass was run in-prompt by the planner.
Three prohibitions survived the precision filter and are authored **descriptor-less** (no
`check_*` scalars) under `must_haves.prohibitions`, so each disposes flagged-unverified.
