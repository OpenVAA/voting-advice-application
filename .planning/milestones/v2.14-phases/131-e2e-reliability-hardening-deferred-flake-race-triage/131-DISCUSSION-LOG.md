# Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-22
**Phase:** 131-e2e-reliability-hardening-deferred-flake-race-triage
**Areas discussed:** Evidence standard, Coverage parity, perm-hide-election-tags disposition, Records + gate

---

## Scout reframing (pre-discussion)

Before presenting gray areas, the codebase scout established that the ROADMAP premise was
outdated: the v2.14 rebuild (Phases 118–130) deleted every spec the older 6 todos reference
and removed the entire skip mechanism (`diff-playwright-reports.ts` + `SKIPPED_TESTS` gone;
zero `test.skip` in the suite). Phase 117 fixed the cold-deeplink race shared by 4 of the 7
todos, now guarded by `cold-entry-dataroot.spec.ts`. Only `perm-hide-election-tags` remains a
live spec. This reframed all four questions from "how to un-skip" to "how to confirm-stale
rigorously + the one genuine fix."

---

## Evidence standard (stale-closure)

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Phase 130 gate + cite fix | Map todo → covering spec + cite Phase 130's 3× gate + Phase 117 fix; no fresh re-runs | |
| Fresh 3× re-run per surface | Independently re-run each covering spec 3× cold-start now as this-phase evidence | ✓ |
| Full-suite 3× once + per-todo mapping | Run whole suite 3× once; map each todo to its green cells | |

**User's choice:** Fresh 3× re-run per surface.
**Notes:** Prefers per-todo determinism evidence dated to this phase over leaning on Phase 130's aggregate gate. Cold-deeplink cluster additionally proven via `cold-entry-dataroot.spec.ts` 3×.

---

## Coverage parity

| Option | Description | Selected |
|--------|-------------|----------|
| Parity check; fix gaps in-phase | Verify current suite still asserts old contract; add missing assertion in 131 if gap | ✓ |
| Parity check; file follow-up on gaps | Same check, but defer any gap to a new todo | |
| No parity check | Close purely on "spec rewritten + suite green" | |

**User's choice:** Parity check; fix gaps in-phase.
**Notes:** Guards against closing a flake by silently dropping the assertion it protected. Pre-identified risk: feedback text-persists-across-cancel (todo #4) may not be covered. Not-located CLEAN-02 (todo #5) parity already confirmed during scout.

---

## perm-hide-election-tags disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Harden shared helper + 3× prove | Root-cause + harden `navigateToFirstQuestion` wait; prove 3× green; regression-check consumers | ✓ |
| Reproduce first, then decide | Attempt reproduction; close-as-stale if not reproducible, else harden | |
| Close-as-stale on the helper switch | Treat the already-landed robust-helper switch as the fix; confirm 3× green | |

**User's choice:** Harden shared helper + 3× prove.
**Notes:** Fixes the `navigateToFirstQuestion` class (5 consumers), not just this one spec. Test-helper fix preferred; escalate if root cause is a genuine product race.

---

## Records + gate

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox TRIAGE doc + move todos; targeted 3× | Per-todo checkbox doc; stamp + move todos; targeted 3× here, full-suite 3× → Phase 132 | ✓ |
| CONTEXT table only; full-suite 3× in 131 | Disposition table in CONTEXT; run full-suite gate here | |
| Checkbox doc + move todos; full-suite 3× in 131 | Checkbox doc + move todos AND full-suite gate here | |

**User's choice:** Checkbox TRIAGE doc + move todos; targeted 3×.
**Notes:** Matches the user's directive for a checkbox markdown doc capturing all points. Full-suite 3× stays in Phase 132. Todo files move to `todos/completed/` per the `resolves_phase:` precedent (option preview said `done/`; aligned to actual convention).

## Claude's Discretion

- Exact per-todo covering-spec run order and evidence-artifact filenames (execution detail).
- Whether reproduction of the perm-hide run-1 race precedes or is bypassed by defensive helper harden (bounded attempt, then defensive — recorded in CONTEXT §4.5).
- `todos/completed/` vs `done/` chosen by convention (completed/) rather than re-asking.

## Deferred Ideas

- Full-suite 3× green gate + svelte-check 0/0 flip → Phase 132.
- Any product-code refactor surfaced by triage (Modal `data-state`, party-drawer `data-hydrated`) only if a parity gap requires it; otherwise a follow-up, not scope creep.
- ~40 lower-relevance backlog todos surfaced by the match scan (candidate→party app, answer-store migration, Paraglide locale reconciliation, filter OR-mode UI) — reviewed, not folded; not flake/race items.
