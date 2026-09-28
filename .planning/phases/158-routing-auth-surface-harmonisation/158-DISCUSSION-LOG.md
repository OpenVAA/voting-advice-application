# Phase 158 — Discussion Log

**This phase's decisions were not gathered in a per-phase session.** They were pre-resolved for the
whole v2.15 review-remediation run (Phases 152–164) in one consolidated pass, per the operator's
standing preference for batch discussion.

## Where the decisions live

- **Source of record:** [`.planning/v2.15-DISCUSSION-POINTS.md`](../../v2.15-DISCUSSION-POINTS.md) § **G**
- **Derived for planning:** [`158-CONTEXT.md`](./158-CONTEXT.md) — generated from § G per decision **N3(a)**

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

---

## Pointer verified — 2026-09-01, `158-08` Task 3

Decision **D-N3(a)** requires this file to exist as the pointer back to the source decision document,
and `158-CONTEXT.md` `<open>` #7 recorded that half as **not delivered**. It was delivered in the
interim. This task's job was therefore to verify it points at the right document rather than to
create it. **It does.** Checked at HEAD `3c958cccc`:

| Claim in this file | Verified |
|---|---|
| `../../v2.15-DISCUSSION-POINTS.md` resolves | ✅ `.planning/v2.15-DISCUSSION-POINTS.md`, 83,635 bytes |
| The target carries a **§ G** for this phase | ✅ `:530` — `## G. Phase 158 — Routing & Auth Surface Harmonisation` |
| § G holds the G1-G5 decisions this phase plans from | ✅ `:532` G1 ⚠ DECIDE, `:549` G2, `:561` G3 ⚠ DECIDE, `:575` G4, `:585` G5 |
| The precedence rule quoted above is the target's own | ✅ `:11` — `## How to read / fill` |

⚠ **One drift worth knowing about, in the target rather than in this pointer:** § G4's heading reads
`` hooks.server.ts:68 ``. That number is stale, and so is every other line number cited for that file
anywhere in the decision chain. Phase 158 anchors on **expressions** for `hooks.server.ts`, per
decision **C1(a)** and obligation **OB-4** — its anchors have drifted four times in eight days. See
`158-REQUIREMENT-DISCREPANCY-REGISTER.md` row 5 and `158-TRIAGE-DISPOSITIONS.md` § 2 item 1.

`158-CONTEXT.md` `<open>` #7 can be considered closed.
