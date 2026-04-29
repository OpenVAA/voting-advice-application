# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- 🚧 **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (started 2026-04-29)

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for archived roadmaps + requirements.

## Phases

<details>
<summary>✅ v2.5 Dev Data Seeding Toolkit (Phases 56-59) — SHIPPED 2026-04-24</summary>

- [x] Phase 56: Generator Foundations & Plumbing (10/10 plans) — completed 2026-04-23
- [x] Phase 57: Latent-Factor Answer Model (7/7 plans) — completed 2026-04-23
- [x] Phase 58: Templates, CLI & Default Dataset (10/10 plans) — completed 2026-04-23
- [x] Phase 59: E2E Fixture Migration (7/7 plans) — completed 2026-04-24

Full details: `.planning/milestones/v2.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.6 Svelte 5 Migration Cleanup (Phases 60-64) — SHIPPED 2026-04-28</summary>

- [x] Phase 60: Layout Runes Migration & Hydration Fix (5/5 plans) — completed 2026-04-24
- [x] Phase 61: Voter-App Question Flow (3/3 plans) — completed 2026-04-25
- [x] Phase 62: Results Page Consolidation (3/3 plans) — completed 2026-04-26
- [x] Phase 63: E2E Template Extension & Greening (3/3 plans) — completed 2026-04-27
- [x] Phase 64: Voter Results Reactivity Completion (Phase 62-bis) (4/4 plans) — completed 2026-04-28

Full details: `.planning/milestones/v2.6-ROADMAP.md`

</details>

### 🚧 v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (In Progress)

**Milestone Goal:** Close the v2.6 supabase-adapter cleanup tail and complete the deferred Svelte 5 audit sweeps in one cohesive milestone. The DB-01 + ADAPTER-01 + SEED-01 cluster all touches `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` and `@openvaa/dev-seed`, so closing them together means one round of integration testing.

- [x] **Phase 65: Svelte 5 Audit Sweeps** — Codebase-wide `bind:*` audit, `{#key}` audit, and context-destructuring reactivity rule documented and applied (completed 2026-04-29)
- [ ] **Phase 66: Adapter Type Cleanup** — Clean up the 2 `as unknown as` casts in `supabaseDataProvider.ts` (v2.6 P64 reverse-fill pass) using a real intermediate type (`InternalFlatNomination`) in a sibling `.types.ts` file (scope narrowed 2026-04-29: schema migration deferred per Phase 66 CONTEXT D-01; the `nominations` table stays as is)
- [ ] **Phase 67: Default Seed Alliances** — `~2-3` alliances grouping subsets of the default seed's 8 parties; empirically exercises the v2.6 P64 alliance branch of the adapter reverse-fill
- [ ] **Phase 68: Dev-Tooling Trio** — Frontend autoreload on package source / env-var changes, lint-all-imports rules + monorepo-wide cleanup, Deno tooling scoped strictly to `apps/supabase/functions/*`

## Phase Details

### Phase 65: Svelte 5 Audit Sweeps
**Goal**: Every `bind:*` and `{#key …}` use under `apps/frontend/src/lib/**/*.svelte` is classified, justified inline, or removed; the context-destructuring reactivity hazard surfaced during v2.6 Phase 61 Plan 03 is documented as a project rule and the codebase is audit-clean against it.
**Depends on**: Nothing (first phase of v2.7; runs over the v2.6 baseline at HEAD `2c7ad2dea`)
**Requirements**: SVELTE5-01, SVELTE5-02, SVELTE5-03
**Success Criteria** (what must be TRUE):
  1. `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'` lists only sites that are either (a) classified keep with inline justification or (b) match a documented pattern in `CLAUDE.md`. The dev server emits zero `binding_property_non_reactive` warnings during a 9-step manual smoke of the voter flow + a candidate-app smoke.
  2. `grep -rn "{#key" apps/frontend/src --include='*.svelte'` lists only retained `{#key}` blocks that carry an inline justification or are gated by a test demonstrating the remount is observable behavior. Defensive `{#key item}`-inside-`{#each}` patterns are removed unless a test exercises them.
  3. `CLAUDE.md` (or the appropriate per-package README) records the project rule for `const { … } = ctx` / `const { … } = getContext(...)` / `const { … } = use*Context()` patterns: either banned via lint rule, or "use direct property access for reactive reads, destructuring is fine for one-shot reads." Any broken-by-destructure-but-working sites identified in the audit are either rewritten or carry an inline justification.
  4. The v2.6 parity gate at HEAD `2c7ad2dea` continues to pass after the audit fixes land — no E2E regressions.
**Plans**: 3 plans
- [x] 65-01-PLAN.md — bind:* audit + inline justifications across 93 sites under apps/frontend/src/lib
- [x] 65-02-PLAN.md — {#key} audit + context-destructure audit + CLAUDE.md rule subsection
- [x] 65-03-PLAN.md — Verification (svelte-check + vitest + Playwright parity gate + voter 9-step + candidate 4-step manual smoke)

**UI hint**: yes

### Phase 66: Adapter Type Cleanup
**Goal**: `supabaseDataProvider.ts` carries zero `as unknown as { ... }` casts over the v2.6 P64 reverse-fill pass, with a real intermediate type (e.g., `InternalFlatNomination`) defined once in a sibling `.types.ts` file and reused across the parent/child mapping loops. The `nominations` table is unchanged (schema migration deferred — see Phase 66 CONTEXT D-01).
**Depends on**: Phase 65 (clean Svelte 5 baseline before touching adapter typing)
**Requirements**: ADAPTER-01 (DB-01 deferred to Future Requirements per 2026-04-29 scope reframe)
**Success Criteria** (what must be TRUE):
  1. `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` carries zero `as unknown as { ... }` casts (or each remaining one is justified inline with `// @ts-expect-error — reason: …` or a comment), zero `any` types remain (already true at scout — invariant asserted), and the v2.6 P64 reverse-fill pass uses a single named intermediate type defined once in a sibling `supabaseDataProvider.types.ts` file.
  2. The intermediate type bridges from `@openvaa/supabase-types` row shapes to `@openvaa/data` Nomination variants without leaking adapter concerns into either package.
  3. Type errors surface at the call site, not in downstream consumers — `yarn workspace @openvaa/frontend check` passes.
  4. The v2.6 parity gate at HEAD `2c7ad2dea` continues to pass after the adapter retyping lands.
**Plans**: 1 plan (reduced from 3 per 2026-04-29 scope reframe)

### Phase 67: Default Seed Alliances
**Goal**: After `yarn dev:reset-with-data`, the default voter flow shows a populated alliances surface; the v2.6 P64 supabase-adapter reverse-fill of `organizationNominationIds` on alliance parents — implemented but never empirically exercised — is now exercised on every dev-seed run.
**Depends on**: Phase 66 (alliance nominations write through the cleaned-up `nominations` shape; reverse-fill code path is exercised over the cleaned-up adapter typing)
**Requirements**: SEED-01
**Success Criteria** (what must be TRUE):
  1. The default template (`packages/dev-seed/src/templates/default/`) emits ~2-3 alliances grouping named subsets of the existing 8 parties into coalitions, plus the corresponding `alliance_nominations` linking the contributing party nominations per constituency.
  2. After `yarn dev:reset-with-data`, the voter results page shows a populated alliances entity tab (or wherever the alliances surface lives), and filtering / grouping by alliance works on real seeded data — no empty-tab dev-blind state.
  3. The supabase adapter's reverse-fill of `organizationNominationIds` on `Alliance` parents (the v2.6 P64 Plan 01 path) returns non-empty arrays when queried; this path is no longer dev-blind.
  4. `@openvaa/matching` and `@openvaa/filters` handle alliances correctly with the seeded data — no runtime errors, no empty match-breakdown sections caused by alliance entities the algorithms didn't anticipate.
**Plans**: 2 plans
**UI hint**: yes

### Phase 68: Dev-Tooling Trio
**Goal**: Three independent dev-tooling cleanups land together — the frontend dev loop autoreloads on package and env changes without manual restarts, ESLint catches cross-cutting import inconsistencies monorepo-wide, and Deno tooling is scoped strictly to where it belongs.
**Depends on**: Nothing (independent of Phases 65-67; can run in parallel with any of them, but scheduled last per the milestone close cadence)
**Requirements**: DEVTOOLS-01, DEVTOOLS-02, DEVTOOLS-03
**Success Criteria** (what must be TRUE):
  1. Editing a `@openvaa/*` package source file or the root `.env` file triggers a frontend reload during `yarn dev` without manual `yarn dev:reset` or restart. The chosen mechanism — Vite HMR watching `packages/*/dist/`, `vite-plugin-restart`, Turborepo `--watch` composed with Vite HMR, or another option — is documented in the relevant README.
  2. `yarn lint:check` is green at HEAD with rules covering `@typescript-eslint/consistent-type-imports`, `import/order`, `import/newline-after-import`, `import/no-duplicates`, unused imports, and a project-specific preference for `$lib/...` over deep relative imports actively enforced. Monorepo-wide cleanup applied where the new rules surface violations.
  3. Top-level `deno.json` / `deno.jsonc` / `deno.lock` files (if any exist outside `apps/supabase/functions/`) are removed or scoped; VSCode `deno.enable` / `deno.enablePaths` config matches; no `deno lint` or `deno check` runs against non-edge-function code in CI.
  4. The v2.6 parity gate at HEAD `2c7ad2dea` continues to pass after the dev-tooling changes — `yarn build`, `yarn test:unit`, and `yarn lint:check` all green.
**Plans**: 3 plans

### 🆕 Next milestone — Not yet planned

Run `/gsd-new-milestone` to question → research → write requirements → roadmap the next milestone.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 56. Generator Foundations & Plumbing | v2.5 | 10/10 | Complete | 2026-04-23 |
| 57. Latent-Factor Answer Model | v2.5 | 7/7 | Complete | 2026-04-23 |
| 58. Templates, CLI & Default Dataset | v2.5 | 10/10 | Complete | 2026-04-23 |
| 59. E2E Fixture Migration | v2.5 | 7/7 | Complete | 2026-04-24 |
| 60. Layout Runes Migration & Hydration Fix | v2.6 | 5/5 | Complete | 2026-04-24 |
| 61. Voter-App Question Flow | v2.6 | 3/3 | Complete | 2026-04-25 |
| 62. Results Page Consolidation | v2.6 | 3/3 | Complete | 2026-04-26 |
| 63. E2E Template Extension & Greening | v2.6 | 3/3 | Complete | 2026-04-27 |
| 64. Voter Results Reactivity Completion | v2.6 | 4/4 | Complete | 2026-04-28 |
| 65. Svelte 5 Audit Sweeps | v2.7 | 3/3 | Complete    | 2026-04-29 |
| 66. Adapter Type Cleanup | v2.7 | 0/1 | Not started | — |
| 67. Default Seed Alliances | v2.7 | 0/2 | Not started | — |
| 68. Dev-Tooling Trio | v2.7 | 0/3 | Not started | — |
