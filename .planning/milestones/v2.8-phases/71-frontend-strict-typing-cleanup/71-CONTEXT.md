# Phase 71: Frontend Strict-Typing Cleanup - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Milestone:** v2.8 Alliance Card + Frontend Hygiene Sweep (Phase 3 of 4)

<domain>
## Phase Boundary

Resolve the 95 pre-existing `apps/frontend/` ESLint errors deferred under v2.7 Phase 68 Option C. After this phase, `yarn workspace @openvaa/frontend lint:check` exits 0 and the frontend matches the rest of the monorepo's lint-clean baseline (`@openvaa/core` / `data` / `matching` / `filters` / `app-shared` are already clean).

**Per-rule breakdown** (from `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md`, captured at HEAD `441b0ab54`):

| Count | Rule                                          |
| ----: | --------------------------------------------- |
|    67 | `@typescript-eslint/no-explicit-any`          |
|    13 | `@typescript-eslint/naming-convention`        |
|    11 | `func-style`                                  |
|     3 | `@typescript-eslint/consistent-type-imports`  |
|     1 | `@typescript-eslint/no-unused-expressions`    |

**In scope (per D-01 plan split — 4 parallelizable plans):**
- **Plan-71-01 — `no-explicit-any` sweep (67 errors).** Real type preferred (per D-03); `unknown` + runtime narrow + inline `// reason: …` only at unbounded boundaries. Concentrated in Supabase adapter + auth/OIDC SDK callbacks; smaller cluster in route handlers + utilities.
- **Plan-71-02 — `naming-convention` sweep (13 errors).** Fix at source per D-02: rename DB-row snake_case keys to camelCase at the adapter boundary; downstream code stays camelCase. Snake_case in non-adapter code is treated as a warning sign — not allowed by rule-tune or per-line disable except in genuinely-unavoidable cases (each disable carries an inline justification).
- **Plan-71-03 — `func-style` sweep (11 errors).** Convert top-level arrow-function-assigned-to-const into function declarations. Mechanical; concentrated in route handlers + a few utilities.
- **Plan-71-04 — Long-tail (4 errors).** 3× `consistent-type-imports` (mechanical fix; auto-fix-able where possible) + 1× `no-unused-expressions` (likely a stray expression statement or mis-typed assertion).

All 4 plans are independent and parallelizable. They may surface 27 additional `unused-imports/no-unused-vars` **warnings** (not errors); planner addresses these opportunistically (rename to `_`-prefixed args per the rule's `argsIgnorePattern: '^_'` config) but they don't gate `lint:check`.

**Verification:**
- `yarn workspace @openvaa/frontend lint:check` exits 0 with zero errors.
- `yarn workspace @openvaa/frontend check` (svelte-check) baseline does not regress beyond the v2.7-close baseline of 160 errors / 12 warnings without explicit acknowledgement (reductions welcome but not gated, per ROADMAP SC-2).
- Root `yarn lint:check` is green across the monorepo.
- `yarn test:unit` remains green; v2.7-close Playwright parity baseline continues to pass.

**Out of scope:**
- Reducing the svelte-check baseline below 160 err / 12 warn (not gated).
- New ESLint rules or rule-config tightening (Phase 68 already added the `unused-imports` + `no-restricted-imports` rules; Phase 71 is purely about clearing the existing error backlog).
- Refactoring the Supabase adapter beyond what typing changes require (e.g. structural reorganisation of `apps/frontend/src/lib/api/adapters/supabase/`).
- Changes to `@openvaa/supabase` lint pipeline (covered by Phase 72 LINT-01).
- The 27 `unused-imports/no-unused-vars` warnings — addressed opportunistically per plan but not gated.
- Adding tests for the typing-narrowed boundaries (existing unit + E2E parity is the gate).
- `apps/frontend/src/lib/paraglide/**` (already lint-ignored).

</domain>

<decisions>
## Implementation Decisions

### Plan Split

- **D-01: Split by rule — 4 parallelizable plans.** One plan per rule cluster: `no-explicit-any` (67), `naming-convention` (13), `func-style` (11), long-tail (4 = `consistent-type-imports` + `no-unused-expressions`). Each rule has a uniform fix pattern, so per-rule plans are easy to bisect and easy to parallelize. Same audit-pattern as v2.7 P65 + P68. Planner may merge `func-style` + long-tail into a single plan if scope warrants (they total only 15 errors), but the default is 4.

### Naming-Convention Strategy

- **D-02: Fix at source — rename to camelCase at the adapter boundary.** DB-row snake_case keys are converted to camelCase at the Supabase adapter boundary (`apps/frontend/src/lib/api/adapters/supabase/`). Downstream code (contexts, components, utilities) consumes camelCase only. Snake_case in non-adapter code is **treated as a warning sign** — a signal that the adapter boundary is leaking. No `naming-convention` rule-tuning. Per-line `// eslint-disable-next-line` is last-resort, with an inline justification, and only for genuinely-unavoidable cases (e.g. a third-party type's exported member that we can't rename).
- **Implication for the planner:** Plan-71-02 starts with an audit pass — for each of the 13 sites, classify as (a) adapter-boundary rename target (preferred), (b) third-party-type immutable (per-line disable + reason), or (c) something else (escalate). The 13 are concentrated in DB-row passthrough per the deferred-tech-debt note.

### `no-explicit-any` Policy

- **D-03: Real type preferred; `unknown` + narrow only at unbounded boundaries.** Default fix path is to import the SDK's own type or define a project-local type. `unknown` + runtime narrow + inline `// reason: <why unbounded>` comment is acceptable ONLY when the boundary genuinely admits unbounded shapes (e.g. raw JSON from a third-party webhook, OIDC SDK callback with an opaque payload). Matches ROADMAP SC-1 wording.
- **For the Supabase adapter cluster (~50 of 67 anys per the deferred-tech-debt note):** import `Database` types from `packages/supabase-types/` and propagate. The "real type preferred" rule applies maximally here — supabase-types/ exists specifically to make these types real.
- **For the OIDC / Signicat / auth callback cluster:** if the SDK exports types, import them. If not, narrow to a project-local type or `unknown` + narrow.

### Inline-Justification Format

- **D-04: `// reason: <one-line reason>` for `unknown`-typed narrowing.** Single-line; lowercase prefix matching the project's existing `// reason:` convention if any (planner verifies by grep). Distinct from the v2.7 P65 `// bind: keep —` family and from Phase 70's `// svelte-warning: accepted —` so a future grep can find each independently.

### svelte-check Baseline

- **D-05: Locked at "no regression beyond 160 err / 12 warn".** Per ROADMAP SC-2; reductions welcome but not gated. The phase verification report records the post-phase svelte-check counts and notes any reduction explicitly, but a non-reduction is not a phase failure.

### Claude's Discretion

- Whether to merge Plan-71-03 (`func-style`, 11) + Plan-71-04 (long-tail, 4) into a single small plan if the planner judges 15 errors not worth two plans.
- Whether the `no-explicit-any` sweep needs internal sub-batches (e.g. Supabase adapter sub-batch / auth sub-batch / routes sub-batch) for diff-cohesion vs one big plan.
- Exact wording of the CLAUDE.md / project anchor (if any) capturing "snake_case in non-adapter code is a warning sign". Planner picks whether this needs codifying or stays implicit via the lint-rule.
- Whether the 27 `unused-imports/no-unused-vars` warnings get addressed in Plan-71-04's diff or in a separate cleanup commit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v2.8 Milestone Anchors
- `.planning/ROADMAP.md` §"Phase 71: Frontend Strict-Typing Cleanup" — phase goal, dependencies (Phase 70), SC-1 through SC-4.
- `.planning/REQUIREMENTS.md` §TYPING-01 — single-requirement scope statement.

### Source — Per-Rule Breakdown
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md` — definitive per-rule breakdown captured at HEAD `441b0ab54`. The 95-error split + recommended cleanup approach (Phase 71 is the explicit follow-up referenced in this doc).

### Upstream Phase Context
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-CONTEXT.md` — Phase 68 Option C decision (defer, don't fix-now).
- v2.7 Phase 68 Plan 02 — added the `unused-imports/no-unused-imports` + `no-restricted-imports` rules; the rules Phase 71 is now cleaning under.

### Type Sources
- `packages/supabase-types/` — generated `Database` types from the Supabase schema. Primary type source for the Supabase adapter cluster (~50 of 67 anys).
- Supabase JS SDK types — ambient via `@supabase/supabase-js`.
- OIDC / Signicat SDK types — ambient via the relevant `@signicat/*` or generic OpenID-Connect type packages.

### ESLint Rule Configs
- `packages/shared-config/eslint.config.mjs` — current rule definitions including the v2.7 P68-02 additions (`unused-imports` + `no-restricted-imports`) and the `apps/frontend/src/lib/paraglide/**` ignore.
- `apps/frontend/eslint.config.mjs` (if present) — frontend-specific rule overrides.

### Project-Level Anchors
- `CLAUDE.md` §"Important Implementation Notes" — "Use TypeScript strictly — avoid `any`, prefer explicit types". Phase 71 enforces this at the rule level.
- `CLAUDE.md` §"Backend (Supabase)" — "Type generation: Run `yarn supabase:types` after schema changes". Reinforces that supabase-types/ is the canonical source for DB-row types.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`packages/supabase-types/`** — already exists, already populated. The Supabase adapter cluster's `no-explicit-any` fixes import from here; no new type-generation work needed.
- **Existing `// eslint-disable-next-line` + reason convention** — the codebase already uses inline justifications (per the Phase 68 Option C audit note). Plan-71-02's last-resort disables follow the existing convention.
- **Phase 68 P02's auto-fix sweep** — already ran `yarn lint:fix` monorepo-wide post-rule-addition. The 95 errors are the residual that auto-fix can't handle.
- **Other monorepo packages** (`core`, `data`, `matching`, `filters`, `app-shared`) — already lint-clean. They serve as reference for "what good looks like" when planner needs a model.

### Established Patterns
- **Per-rule plan split** — v2.7 P65 + P68 used per-rule cleanup plans. Phase 71 follows the same model.
- **`unknown` + runtime narrow over `any`** — already implicit in CLAUDE.md §"Important Implementation Notes". Phase 71 makes this explicit at the lint-rule level.
- **Adapter-boundary type conversion** — `apps/frontend/src/lib/api/adapters/supabase/` already does some snake_case → camelCase normalisation. Plan-71-02 extends this pattern to the 13 remaining sites.

### Integration Points
- **Phase 70 runs first** (per ROADMAP dependency). Phase 71's typing diffs land against a Svelte-5-warning-clean baseline.
- **The Supabase adapter cluster (~50 anys)** is the largest single change surface. Plan-71-01's diff there will be substantial; cohesive PR-review batching is helpful.
- **Phase 72 SHARED-02** (Phase 72 Plan-72-02) retires the `merge.ts` shim. If Phase 71 touches `merge.ts` or any of its consumers, planner sequences with awareness — though the shim retire is purely import-path, no type-changes overlap.
- **Phase 72 LINT-01** (separate concern) — Phase 71 does NOT touch the `@openvaa/supabase` lint pipeline. The supabase workspace's TypeScript lint is already clean per Phase 68; only the SQL/JS pipeline conflation is open, and that's Phase 72.

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose split-by-rule (4 plans) over split-by-file-cluster.
- User explicitly chose fix-at-source for naming-convention + treating snake_case in non-adapter code as a warning sign (no rule-tune, minimal per-line disables).
- User explicitly chose real-type-preferred over unknown+narrow as the `no-explicit-any` default.

</specifics>

<deferred>
## Deferred Ideas

- **svelte-check baseline reduction** — explicitly out of scope per ROADMAP SC-2 (not gated). A future hygiene phase may set a reduction target.
- **27 `unused-imports/no-unused-vars` warnings** — addressed opportunistically per plan; not gated. If any remain after Phase 71, capture as a small follow-up todo.
- **`apps/frontend/src/lib/paraglide/**` cleanup** — lint-ignored; not in this or any planned phase.
- **Refactoring the Supabase adapter structurally** — out of scope. Phase 71 changes types; the adapter shape stays.
- **Adding tests for type-narrowed boundaries** — existing unit + E2E parity is the gate; no new tests added.

### Reviewed Todos (not folded)
- The Phase 68 deferred-tech-debt doc is the authoritative source for Phase 71's scope; no separate todo file in `.planning/todos/pending/` for the 95-error backlog.

</deferred>

---

*Phase: 71-frontend-strict-typing-cleanup*
*Context gathered: 2026-05-09*
