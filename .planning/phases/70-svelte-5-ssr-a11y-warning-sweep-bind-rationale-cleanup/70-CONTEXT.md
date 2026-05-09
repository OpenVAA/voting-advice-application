# Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Milestone:** v2.8 Alliance Card + Frontend Hygiene Sweep (Phase 2 of 4)

<domain>
## Phase Boundary

Resolve **four** categories of dev/build warnings surfaced during v2.7 Phase 67 UAT (the original three from ROADMAP SC + SSR fetch-eagerness pulled in from the source todo per D-01) and strip the 92 single-line `// bind: keep — <rationale>` comments left over from v2.7 Phase 65 Plan 01.

After this phase, `apps/frontend/src/lib/**/*.svelte` is a clean tree:
- Cold `yarn dev` from a wiped `.svelte-kit` + `node_modules/.vite/` produces zero un-justified Svelte 5 / SSR / a11y warnings on cold load + voter-flow happy path.
- `yarn build` for `@openvaa/frontend` is warning-clean across these categories.
- `git grep -nE "// bind: (keep|ok|justified)" apps/frontend/src/lib/` returns zero matches; underlying `bind:*` directives untouched.

This is a hygiene phase. No behavioural code changes beyond the warning fixes themselves; the bind-cleanup diff is comment-only.

**In scope (per D-02 plan split — 5 parallelizable plans):**
- **Plan-70-01 — Category A: Svelte 5 reactivity hazards (`state_referenced_locally`).** Fix every confirmed site (`Expander.svelte:76 defaultExpanded`, `EnumeratedEntityFilter.svelte:48,65 filter/targets`, plus any others a fresh `yarn dev | grep state_referenced_locally` surfaces). Pattern matches CLAUDE.md §"Context Destructuring Rule (Svelte 5)" — wrap reads in `$derived(() => …)` or reference via the source object.
- **Plan-70-02 — Category B: Missing `<slot />` / `{@render children()}`.** Fix every site that triggers the missing-render warning. The original repro anchor is `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+layout.svelte` plus the `nominations?constituencyId=…` hanging-view path. In Svelte 5 runes mode, layouts must use `{@render children()}` instead of legacy `<slot />`.
- **Plan-70-03 — Category C: Accessibility (`a11y_no_noninteractive_element_interactions`).** Fix every WCAG 2.1 AA-relevant warning. Confirmed: `Input.svelte:521` `<label>` with click/key handlers. Sweep covers `Checkbox`, `Radio`, `Switch` analogs.
- **Plan-70-04 — Category D: SSR fetch-eagerness (NEW; pulled in from source todo per D-01).** Fix every module-time `fetch` call that triggers `Avoid calling fetch eagerly during server-side rendering`. Move data the page needs into `+page.ts` / `+layout.ts` `load(...)`; data only the browser needs into `onMount(...)`. Likely sweep target: `apps/frontend/src/lib/api/adapters/supabase/` plus any context that initialises data during module-load.
- **Plan-70-05 — BIND-01: Strip `// bind: keep —` rationale comments.** Remove all 92 single-line comments from `apps/frontend/src/lib/**/*.svelte`. `bind:*` directives remain untouched. Diff is comment-only. CLAUDE.md §"Context Destructuring Rule (Svelte 5)" already permanently captures the rationale.

All 5 plans are **independent** and may run in any order or in parallel. No shared mutation between them apart from possibly touching the same `.svelte` files (rare; manageable in PR review). The verification gate (cold-start + build + parity) runs once at phase close after all 5 land.

**Out of scope:**
- Restructuring the SvelteKit data-loading layer beyond moving fetch sites to the right lifecycle. SSR perf / cache hardening is a v2.9+ concern.
- New a11y features beyond fixing the warnings (e.g. focus-trap improvements, screen-reader announcement patterns) — separate workstream.
- Adding new svelte-eslint rules to enforce the Context Destructuring Rule — explicit lint enforcement is deferred per the CLAUDE.md "Lint enforcement is currently a guideline" note.
- Additional regression tests for sites that did NOT have a user-visible-bug history (per D-03).
- Touching `apps/frontend/src/lib/paraglide/**` (already lint-ignored per Phase 68 Plan 02).
- `@openvaa/supabase` SQL warnings (covered by Phase 72 LINT-01, NOT this phase).

</domain>

<decisions>
## Implementation Decisions

### Sweep Scope

- **D-01: Add Category D (SSR fetch-eagerness) to phase scope.** Pulled in from `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md` Category B' (~12 occurrences during a single voter-app session). Lands the full Phase 67 UAT warning surface in one phase rather than splitting it across v2.8 + v2.9. ROADMAP SC stays as written; REQUIREMENTS WARN-01 implicitly extends to Category D — planner adds an "SC-1b Category D" or equivalent during plan-phase, OR REQUIREMENTS.md is amended in a small docs commit before plan-phase (planner picks).
- **Implication for verification:** the cold-start protocol (`rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`) must produce zero un-justified warnings across all four categories (A + B + C + D) on cold load + voter-flow happy path.

### Plan Split

- **D-02: 5 parallelizable plans — A / B / C / D / BIND.** One plan per warning category (A/B/C/D) plus one plan for the bind-comment strip. Independent diffs, runnable in parallel waves. Same audit-pattern as v2.7 Phase 65. Planner may merge two plans if the sweep grep reveals very small per-category surface area (e.g. Category C may end up being 1-3 fixes), but the default split is 5.
- **Plan-70-05 (BIND) explicitly LAST in execute order if any A/B/C/D plan touches the same file.** Reasoning: stripping comments after the warning fixes ensures the comment-only diff doesn't get tangled with semantic changes. If a category plan touches a file with `// bind: keep —` comments, those comments survive that plan's diff and get stripped only by Plan-70-05.

### Regression Tests

- **D-03: Tests only for sites that surfaced user-visible bugs.** For Category A `state_referenced_locally` sites with a known production-like-bug history (the v2.6 P61-03 destructuring bug class), add a minimal Svelte 5 component reactivity test that would fail before the fix. For pure dev-warning sites without visible-bug history, the warning-gone gate + manual voter-flow smoke is sufficient. Cheap; aligns with ROADMAP SC-5 (parity gate continues to pass).
- **Concretely:** the planner's first step in Plan-70-01 is to enumerate the sites and tag each as "user-visible-bug history? Y/N". Y-sites get a regression test in the same plan.

### Cold-Start Verification Protocol

- **D-04: Cold-start = `rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`, then voter-flow happy path.** Standard cold protocol from the source todo. Phase verification runs this once at phase close and asserts zero un-justified warnings across A/B/C/D.

### Inline Justification Format

- **D-05: Accepted-warning inline justification format.** Where a warning is accepted (e.g. cosmetic-only a11y, or a render-omission that's intentional), the inline justification is a single-line comment on the source line in the format `// svelte-warning: accepted — <reason>`. Distinct from the v2.7 P65 `// bind: keep —` family so a future grep can find them. Planner may pick a different convention if a more idiomatic one already exists in the codebase — flag if so.

### Claude's Discretion

- Whether to bundle Category C into Plan-70-03 if the sweep finds only 1-3 a11y warnings (vs justifying a separate plan).
- Exact codemod / sed pattern for Plan-70-05 bind-comment strip — single regex, careful diff review, atomic commit per the source todo.
- Whether the Category D fix-pattern needs a one-line CLAUDE.md note about "module-time fetch is wrong; use load() / onMount()" — planner picks based on whether the rule is already implicit elsewhere in CLAUDE.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v2.8 Milestone Anchors
- `.planning/ROADMAP.md` §"Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup" — phase goal, dependencies (Phase 69), SC-1 through SC-5.
- `.planning/REQUIREMENTS.md` §WARN-01 + §BIND-01 — single-requirement scope statements per category.

### Source Todos
- `.planning/todos/pending/2026-05-08-results-layout-missing-slot-render-tag.md` — consolidated 4-category sweep (A/B/B'/C). Category B' pulled in per D-01.
- `.planning/todos/pending/2026-05-08-cleanup-65-01-bind-rationale-comments.md` — BIND-01 source todo + suggested codemod approach.
- `.planning/todos/pending/2026-05-08-expander-state-referenced-locally.md` — superseded; kept for history.

### Upstream Phase Context
- `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md` — origin diagnosis for the destructure-captures-initial-value bug class (Category A's structural mitigation).
- `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/65-CONTEXT.md` — v2.7 Phase 65 Plan 01 (where the 92 `// bind: keep —` comments came from).
- `.planning/milestones/v2.7-phases/67-default-seed-alliances/` — Phase 67 UAT (where the warnings surfaced).

### Project-Level Anchors
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — Category A's structural mitigation. Category A fixes follow this rule.
- `CLAUDE.md` §"Important Implementation Notes" — WCAG 2.1 AA requirement (Category C's compliance bar).
- `CLAUDE.md` §"Frontend (SvelteKit)" — `+page.ts` / `+layout.ts` `load()` is the canonical SSR data path (Category D's fix target).

### External References
- https://svelte.dev/e/state_referenced_locally — Category A error doc.
- https://svelte.dev/e/a11y_no_noninteractive_element_interactions — Category C error doc.
- SvelteKit `load()` docs — Category D fix pattern.

### Confirmed Warning Sites (anchors for grep enumeration)
- `apps/frontend/src/lib/components/expander/Expander.svelte:76:24` — Category A (`defaultExpanded`).
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:48,65` — Category A (`filter`, `targets`).
- `apps/frontend/src/lib/components/input/Input.svelte:521:8` — Category C (`<label>` with click/key handlers).
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+layout.svelte` — Category B (missing `{@render children()}`).
- Category D sweep target — `apps/frontend/src/lib/api/adapters/supabase/**` plus context-init module loads (specific sites enumerated by the planner via `yarn workspace @openvaa/frontend dev 2>&1 | grep "fetch.*eagerly"` + per-occurrence dev-server stack-trace walk).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CLAUDE.md §"Context Destructuring Rule (Svelte 5)"** — already documents the destructure-captures-initial-value class of bugs (the same class as Category A). Fixes follow the documented pattern; no new reasoning needed per site.
- **v2.7 Phase 65 Plan 01 audit list** — the 92 `// bind: keep —` annotations enumerate every reviewed `bind:*` site. The strip codemod targets exactly this annotation pattern.
- **Existing reactivity test infrastructure** — Vitest + Svelte 5 component tests exist (Phase 65 added some). Plan-70-01's regression tests can lean on the existing pattern, no new harness needed.

### Established Patterns
- **Cold-start verification protocol** — `rm -rf .svelte-kit node_modules/.vite/ && yarn dev` is the standard "warning sweep" trigger. v2.7 Phase 67 UAT used this; Phase 70 verification re-uses it.
- **Category-by-category plan split** — v2.7 Phase 65 used per-category plans (bind, key, etc.); v2.8 Phase 70 follows the same model.
- **Comment-only diff for hygiene strips** — v2.7 had similar comment-strip work (cleanup commits with no semantic change). Plan-70-05 follows that pattern.
- **`load()` over module-time fetch** — already canonical in CLAUDE.md §"Frontend Data Flow" / §"Backend (Supabase)". Plan-70-04 enforces existing convention.

### Integration Points
- **Plans 70-01 / 70-02 / 70-03 / 70-04 may all touch the same `.svelte` files.** No shared mutation, but execute order matters if two plans touch the same file — planner sequences (or accepts merge-friction in PR review). Plan-70-05 (BIND strip) **must run last** if any earlier plan touches a file with `// bind: keep —` comments (per D-02).
- **Phase 69 alliance card changes touch `EntityCard.svelte`** — Plan-70-01's reactivity sweep may surface new `state_referenced_locally` warnings introduced by the Phase 69 changes. The phase dependency (Phase 70 depends on Phase 69) ensures the sweep runs against the post-Phase-69 surface, not against a moving target.
- **Phase 71 typing cleanup runs after Phase 70.** Phase 71's `naming-convention` and `func-style` fixes will touch many of the same files; running typing on a warning-clean baseline prevents typing diffs from getting tangled with warning fixes.

</code_context>

<specifics>
## Specific Ideas

- User explicitly opted IN on Category D (SSR fetch-eagerness) — not a "best-effort" or "deferred" pick. This is a phase-gated category like A/B/C.
- User explicitly chose 5 parallelizable plans (one per category + bind-strip) — implicitly extending the original "4 plans A/B/C/BIND" answer to include Category D.
- User explicitly chose narrow regression-test investment — only sites with a user-visible-bug history get a regression test. Pure dev-warnings rely on the warning-gone gate.

</specifics>

<deferred>
## Deferred Ideas

- **Custom svelte-eslint rule for the Context Destructuring Rule.** CLAUDE.md notes this is a future possibility if violations recur. Phase 70 does NOT add the rule — fixes are manual + the existing CLAUDE.md guideline.
- **SSR perf / cache hardening beyond fixing fetch-eagerness.** The Category D fix is "move fetch to the right lifecycle". Broader SSR cache strategy (e.g. SvelteKit `load()` cache headers, redis-backed dedup) is v2.9+.
- **A11y feature work** (focus-trap, screen-reader announcements, etc.) — separate workstream beyond the warning-fix bar.
- **`apps/frontend/src/lib/paraglide/**` cleanup** — already lint-ignored per Phase 68 Plan 02; not revisited here.

### Reviewed Todos (not folded)
- The two source todos referenced in §Source Todos are folded into this phase (the phase IS the todo resolution).

</deferred>

---

*Phase: 70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup*
*Context gathered: 2026-05-09*
