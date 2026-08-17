# Phase 20: OXC Toolchain Exploration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Evaluate whether oxlint (and oxc-based tooling) can replace ESLint + Prettier in the OpenVAA monorepo. This is a lightweight spike — check current Svelte support status, document rule coverage gaps briefly, and produce a clear recommendation (migrate, defer, or reject).

</domain>

<decisions>
## Implementation Decisions

### Evaluation approach
- Lightweight spike, not a deep benchmark — check Svelte support status first
- If oxlint doesn't support .svelte files, recommend "defer" with a trigger condition
- No hands-on migration or config rewrite — just research and documentation

### Evaluation bias
- Bias toward adoption if feasible — accept minor rule gaps if performance gains are significant
- BUT: Svelte file linting is a dealbreaker — if oxlint can't lint .svelte, defer the whole migration

### Rule coverage bar
- Core rules (no-console, no-any, consistent-type-imports) must have equivalents
- Project-specific opinionated rules (no-enum via no-restricted-syntax, func-style declarations, naming conventions) can be dropped or noted as gaps
- Import sorting (simple-import-sort) gap is acceptable if documented

### Formatting
- Prettier replacement is out of scope — don't evaluate dprint or oxc_formatter
- Keep formatting discussion for a future milestone if linting migration happens

### Claude's Discretion
- Structure of the evaluation report
- Depth of rule-by-rule comparison (summary table vs detailed analysis)
- Whether to include a quick informal performance comparison (e.g., time a single oxlint run vs eslint run) or skip benchmarks entirely

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current linting config
- `packages/shared-config/eslint.config.mjs` — Shared ESLint flat config with all custom rules
- `packages/shared-config/prettier.config.mjs` — Shared Prettier config
- `apps/frontend/eslint.config.mjs` — Frontend ESLint with Svelte parser
- `apps/strapi/eslint.config.mjs` — Strapi ESLint overrides
- `apps/docs/eslint.config.js` — Docs ESLint config
- `tests/eslint.config.mjs` — Test ESLint config
- `turbo.json` — Turborepo lint task definition

### OXC project
- Research oxlint docs for current Svelte support status, available rules, and TypeScript support

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@openvaa/shared-config` package centralizes all lint/format config — migration would primarily touch this package
- Root `eslint.config.mjs` re-exports shared config — workspace configs extend it

### Established Patterns
- Flat config format (ESLint 9+) already adopted — no legacy .eslintrc migration needed
- Turborepo `lint` task with workspace-level execution
- `eslint-config-prettier` disables formatting rules — clean separation between lint and format

### Integration Points
- `turbo.json` lint task — would need oxlint command replacement
- `.husky/pre-commit` — may reference eslint
- CI workflow `main.yaml` — lint step in frontend/backend validation jobs
- 6 workspace-level eslint configs that extend shared config

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for the spike. Key deliverable is a clear recommendation document with Svelte support status as the primary gate.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-oxc-toolchain-exploration*
*Context gathered: 2026-03-18*
