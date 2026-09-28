# Phase 116: Milestone-Close Green Gate - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Auto-generated (terminal verification phase — discuss skipped)

<domain>
## Phase Boundary

Run the full milestone-close green gate, proving the v2.13 context-as-class migration
(Phases 106–115) landed without regression, and record the result as the milestone-close
anchor.

In scope (GATE-01):
- Full E2E suite (default run: voter-journey + candidate + a11y-smoke) green.
- Full unit suite green (`yarn test:unit` / `yarn vitest run`).
- `typecheck` (svelte-check) + `lint` (`yarn lint:check`, incl. the widened svelte/store
  guard) green.
- Milestone-close anchor grep gates: zero `svelte/store` imports in `apps/frontend/src/**`
  (test mocks excepted); every context is a class; zero `reactiveFoo` duplicate handles;
  zero rune-context `*Store` identifiers.
- Record the result as the milestone-close anchor artifact.

Terminal verification — depends on everything (106–115). No new feature code.
</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
This is a gate-running / verification phase — no feature code. Constraints:
- E2E run procedure: `yarn db:reset && yarn db:seed --template e2e/base --likert-only`,
  then `yarn dev` with a MANDATORY dev-server restart before the run (Vite HMR serves
  stale SSR/large modules mid-run — a known project hazard for these large context
  modules), then `yarn test:e2e`.
- "Did not run" E2E results count as failures (cascade-failure policy).
- Record the anchor (commit SHA, gate results) so the milestone close has a verifiable
  green reference.
</decisions>

<code_context>
## Existing Code Insights

Static gates already verified green across Phases 113–115: `yarn build` 14/14,
`yarn vitest run` 766 passed, `yarn svelte-check` 151 (baseline), `yarn lint:check`
11/11 green (milestone lint debt cleared in Phase 115). Grep-gate anchors confirmed in
each phase's VERIFICATION.md. The new gate this phase adds is the full LIVE E2E suite
(incl. a11y-smoke). E2E default projects: voter-journey, candidate, a11y-smoke
(tests/playwright.config.ts).
</code_context>

<specifics>
## Specific Ideas

No specifics beyond ROADMAP success criteria — terminal verification phase.
</specifics>

<deferred>
## Deferred Ideas

None.
</deferred>
