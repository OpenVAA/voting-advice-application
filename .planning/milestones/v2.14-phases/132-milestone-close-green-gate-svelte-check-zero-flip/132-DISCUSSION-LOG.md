# Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 132-milestone-close-green-gate-svelte-check-zero-flip
**Mode:** `--auto` (all gray areas auto-selected; recommended option chosen per question; no interactive prompts)
**Areas discussed:** Escalated-flake disposition, 3× gate protocol, svelte-check CI gate flip, Milestone-close anchor recording

---

## Escalated flake (candidate-journey:661) disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Fix-first | Harden the step-13.5 wait per the todo's Solution section BEFORE starting the 3× count; prove isolated + under full-DAG load; todo → FIXED → `todos/completed/` | ✓ |
| Gate-first | Start the 3× gate and only fix if the flake reproduces | |

**Auto-selected:** Fix-first (recommended default)
**Notes:** A mid-gate failure restarts the count anyway (D-05), and the todo already carries a
characterized root cause (cold-start load contention; 2/2 green isolated). Test-only harden by
default; product change only if a genuine product race is proven (Phase 131 D-09 carried forward).

---

## 3× full-suite gate protocol

| Option | Description | Selected |
|--------|-------------|----------|
| Strict per-run reset | 3 consecutive full-suite runs, EACH with fresh `:5173` server + clean DB (`db:reset`); any failure → fix → restart count at 0 | ✓ |
| v2.13-style run 2 | Middle run reuses server + suite self-reseed (as the v2.13 anchor did) | |

**Auto-selected:** Strict per-run reset (recommended default)
**Notes:** The v2.13 anchor itself recorded run-3 flaking from accumulated dev-server load and
concluded "restart the dev server between runs" — that lesson is locked here as mandatory.
Environment wedges (storage-502, imgproxy 502) invalidate a run (discard + re-run + log in the
anchor), they do not count as suite failures. New flakes mid-gate: fix in-phase, restart count,
never skip (cardinal rule).

---

## svelte-check CI gate flip mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking step in main.yaml + `--fail-on-warnings` | Add svelte-check to the frontend CI job; fails on errors AND warnings; frontend-scoped per TYPE-10; prefer strictening the existing `check` script (single source of truth) | ✓ |
| Turbo-wide `check` task | Add a monorepo-wide turbo `check` pipeline task | |

**Auto-selected:** Blocking step in main.yaml (recommended default)
**Notes:** Scout finding drove this area: NO svelte-check step exists in CI today — the
"≤ 151 baseline" was phase-acceptance bookkeeping only, so the "flip" = ADD the gate.
`svelte-check` fails on errors only by default; `--fail-on-warnings` is required for the
0-warnings half. Live re-verify 0/0 at phase start + close (drift since Phase 128 possible).

---

## Milestone-close anchor recording

| Option | Description | Selected |
|--------|-------------|----------|
| Phase-dir anchor doc | `132-MILESTONE-CLOSE-ANCHOR.md` matching the v2.13 `116-MILESTONE-CLOSE-ANCHOR.md` shape (static gates + 3× run table + preconditions + anchor SHA) | ✓ |
| MILESTONES.md inline | Record the close directly in `.planning/MILESTONES.md` | |

**Auto-selected:** Phase-dir anchor doc (recommended default)
**Notes:** SC #3 names the v2.10/v2.11/v2.13 close pattern explicitly; the v2.13 close produced
exactly this artifact. `/gsd-complete-milestone` consumes it downstream.

---

## Claude's Discretion

- CI step naming/placement + fail-fast ordering within the frontend job.
- Exact wait-condition mechanics for the step-13.5 harden (within the todo's Solution direction).
- Plan split (flake-fix / flip / gate) vs one orchestrated plan — under the single-`:5173`
  serialization constraint.

## Deferred Ideas

- Milestone archive/close ceremony (`/gsd-complete-milestone`) — after this phase.
- Docs-app svelte-check CI gating — TYPE-10 scopes `apps/frontend`; docs currently 0/0.
- RPC RETURNS-TABLE nullability audit — backend follow-up, untouched.

## Todo-folding deviation (logged)

Auto-mode's blanket "fold score ≥ 0.4" rule was overridden by the scope guardrail: 41 matches
surfaced, but 39 are keyword-noise product/infra backlog unrelated to a close-gate phase. Only
the two `resolves_phase: 132` todos were folded (candidate-journey:661 flake; svelte-check-zero
baseline clear). The 39 remain pending for next-milestone triage — matches Phase 131's
reviewed-not-folded precedent.
