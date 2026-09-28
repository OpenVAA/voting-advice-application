# Phase 71: Frontend Strict-Typing Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 71-frontend-strict-typing-cleanup
**Areas discussed:** Plan split, naming-convention strategy, no-explicit-any policy

---

## How to split the 95-error cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| By rule: 4 plans (any / naming / func-style / long-tail) | Plan-71-01: ~67 no-explicit-any. Plan-71-02: ~13 naming-convention. Plan-71-03: ~11 func-style. Plan-71-04: ~4 long-tail. Each rule has a uniform fix pattern — easy to parallelize, easy to bisect. | ✓ |
| By file cluster: ~3 plans (Supabase adapter / auth+OIDC / routes+misc) | Diffs cluster well in PR review. | |
| Hybrid: any sweep first, then mixed cleanup of the rest | Plan-71-01 handles all 67 no-explicit-any across files. Plan-71-02 handles the remaining 28. | |

**User's choice:** By rule: 4 plans (any / naming / func-style / long-tail).

## Naming-convention strategy for snake_case DB-row passthrough

| Option | Description | Selected |
|--------|-------------|----------|
| Fix at source: rename to camelCase at the adapter boundary | Adapter converts DB-row snake_case keys to camelCase at the boundary; downstream code stays camelCase. | ✓ |
| Tune the rule: allow snake_case via PropertyDefinition selector | Update naming-convention to accept snake_case for object property accesses originating from DB rows. | |
| Per-line // eslint-disable-next-line with reason | Each of the ~13 sites gets an inline disable + reason comment. | |

**User's choice:** Fix at source.
**Notes:** Snake_case in non-adapter code is treated as a warning sign — no rule-tune. Per-line disables are last-resort with inline justification.

## no-explicit-any policy — unknown+narrow vs real-type preference

| Option | Description | Selected |
|--------|-------------|----------|
| Real type preferred; unknown+narrow only at unbounded boundaries | Default: import the SDK's own type or define a project-local type. Use unknown + runtime narrow + // reason: comment ONLY when the boundary genuinely admits unbounded shapes. Matches ROADMAP SC-1 wording. | ✓ |
| unknown+narrow first, real types as upgrade path | Faster initial sweep, defers the deep type-modeling work. | |
| You decide — planner audits per-site | Planner reads each any site, picks per the ROADMAP SC-1 rule. | |

**User's choice:** Real type preferred; unknown+narrow only at unbounded boundaries.

---

## Claude's Discretion

- Whether to merge Plan-71-03 (func-style, 11) + Plan-71-04 (long-tail, 4) if 15 errors aren't worth two plans.
- Whether the no-explicit-any sweep needs internal sub-batches (Supabase adapter / auth / routes) for diff cohesion.
- Exact wording of any project anchor codifying "snake_case in non-adapter code is a warning sign".
- Whether the 27 unused-imports/no-unused-vars warnings get addressed in Plan-71-04 or in a separate cleanup commit.

## Deferred Ideas

- **svelte-check baseline reduction** — explicitly out of scope per ROADMAP SC-2.
- **27 `unused-imports/no-unused-vars` warnings** — addressed opportunistically; not gated.
- **paraglide cleanup** — already lint-ignored.
- **Refactoring the Supabase adapter structurally** — out of scope.
- **Adding tests for type-narrowed boundaries** — existing unit + E2E parity is the gate.
