# Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup
**Areas discussed:** Sweep scope (Category D), plan split, regression-test investment

---

## SSR fetch-eagerness scope (Category B' / D from source todo)

| Option | Description | Selected |
|--------|-------------|----------|
| In scope — add as Category D | Sweep all three ROADMAP categories + the fetch-eagerness category. ROADMAP SC for Category D added implicitly via REQUIREMENTS update. | ✓ |
| Defer — capture as new todo, leave a note in phase verification | Stay strictly within ROADMAP SC: A/B/C + BIND-01. Capture a fresh todo for SSR fetch-eagerness for v2.9. | |
| Best-effort during the sweep, no phase gate | Fix any fetch-eagerness sites the planner naturally touches while doing A/B/C. Anything left over goes in the deferred todo. | |

**User's choice:** In scope — add as Category D.
**Notes:** Lands the full Phase 67 UAT warning surface in one phase rather than splitting it across v2.8 + v2.9.

## Plan split for the categorical sweep + bind cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| 4 plans, parallelizable: A / B / C / BIND | One plan per ROADMAP category + BIND-01 strip. | ✓ (extended to 5 with Category D) |
| 2 plans: Warning sweep (A+B+C combined) + BIND cleanup | One plan does all warning categories sequentially, one plan does the strip. | |
| 1 plan: Combined sweep + bind strip | Single plan handles everything. | |

**User's choice:** 4 plans, parallelizable: A / B / C / BIND.
**Notes:** Extending to **5 plans** total because Category D was added to scope: A / B / C / D / BIND. All parallelizable. BIND runs last when files overlap with category-fix files.

## Regression-test investment for Category A reactivity fixes

| Option | Description | Selected |
|--------|-------------|----------|
| Add minimal unit/component test per A-category fix | For each state_referenced_locally site, add a small reactivity assertion. ~30–60min per site, ~4–6 sites. | |
| No new tests — rely on warning-gone + manual smoke | Cold-start dev produces zero state_referenced_locally warnings; voter-flow happy path runs without reactivity bugs in manual smoke. | |
| Tests only for sites that surfaced user-visible bugs | Already-fixed-once sites (Expander.svelte, EnumeratedEntityFilter where reactivity was visibly broken) get a regression test. Pure dev-warning sites without visible-bug history get the warning-gone gate. | ✓ |

**User's choice:** Tests only for sites that surfaced user-visible bugs.
**Notes:** Cheapest investment that still locks the regression for the bug-class that actually broke production paths.

---

## Claude's Discretion

- Whether to bundle Category C into Plan-70-03 if the sweep finds only 1-3 a11y warnings.
- Exact codemod / sed pattern for Plan-70-05 bind-comment strip.
- Whether the Category D fix-pattern needs a one-line CLAUDE.md note about "module-time fetch is wrong; use load() / onMount()".
- Whether REQUIREMENTS.md is amended for Category D or the planner extends ROADMAP SC implicitly during plan-phase.
- Exact accepted-warning inline-justification format (suggested: `// svelte-warning: accepted — <reason>`).

## Deferred Ideas

- **Custom svelte-eslint rule for the Context Destructuring Rule** — future possibility per CLAUDE.md note.
- **SSR perf / cache hardening beyond fixing fetch-eagerness** — v2.9+.
- **A11y feature work** (focus-trap, screen-reader announcements) — separate workstream.
- **paraglide cleanup** — already lint-ignored.
