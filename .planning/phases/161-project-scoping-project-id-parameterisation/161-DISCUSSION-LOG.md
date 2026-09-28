# Phase 161 — Discussion Log

**This phase's decisions were not gathered in a per-phase session.** They were pre-resolved for the
whole v2.15 review-remediation run (Phases 152–164) in one consolidated pass, per the operator's
standing preference for batch discussion.

## Where the decisions live

- **Source of record:** [`.planning/v2.15-DISCUSSION-POINTS.md`](../../v2.15-DISCUSSION-POINTS.md) § **J**
- **Derived for planning:** [`161-CONTEXT.md`](./161-CONTEXT.md) — generated from § J per decision **N3(a)**

## How to read the source document

Its § "How to read / fill" is binding and non-obvious:

- Each decision lists its options as checkboxes; exactly one carries `★ RECOMMENDED`.
- **Every box unchecked = the ★ option is CHOSEN** — a positive answer, not an omission.
- A ticked `[x]` non-recommended box **overrules** the ★.
- `**EDIT:**` / `**NOTE:**` / `**NOTES**:` free text **beats every box** and is binding scope.

61 decisions across the run; 18 marked ⚠ DECIDE as shape-changing rather than detail.

## Baseline

§ 0 of the source document is a 33-row table of facts measured at HEAD `bff94f382` on 2026-08-28,
18 of them (⚑) contradicting what the roadmap said. Operator decision **0.1(c)** authorised
correcting `.planning/ROADMAP.md` in place, which was done the same day. **Where a roadmap
criterion and a § 0 fact disagree, the fact wins.**

## Not covered here

Phase 162 (Permissions & Auth Model Refactor) is **deliberately left open** — the operator's note
under § K defers it. It is excluded from this planning run, and the source document marks it
**blocking ship**.
