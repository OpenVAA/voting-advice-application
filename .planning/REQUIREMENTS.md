# Milestone v2.7: Svelte 5 Polish + Supabase-Adapter Loose Ends — Requirements

**Goal:** Close the v2.6 supabase-adapter cleanup tail and complete the deferred Svelte 5 audit sweeps in one cohesive milestone. The DB-01 + ADAPTER-01 + SEED-01 cluster all touches `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` and `@openvaa/dev-seed`, so closing them together means one round of integration testing.

**Context sources:**

- `.planning/todos/pending/svelte5-cleanup.md` — items 4 (`bind:*` audit) + 5 (`{#key}` audit), surfaced during v2.6 Phase 64 manual smoke
- `.planning/todos/pending/2026-04-25-investigate-destructuring-contexts.md` — context-destructuring reactivity hazard surfaced during v2.6 Phase 61 Plan 03
- `.planning/todos/pending/2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` — `as unknown as { ... }` casts introduced by v2.6 Phase 64 Plan 01 + Plan 03 reverse-fill
- `.planning/todos/pending/2026-04-28-cleanup-nominations-table.md` — drop redundant `nominations.name` + `nominations.entityType`
- `.planning/todos/pending/2026-04-28-add-alliances-to-default-test-data.md` — exercise the alliance branch of the v2.6 Phase 64 Plan 01 adapter reverse-fill
- `.planning/todos/pending/2026-04-25-dev-tooling-cleanup-trio.md` — three small dev-tooling cleanups bundled at user request
- `.planning/STATE.md` "Next milestone seed" (selected 2026-04-29) — scope rationale and out-of-scope decisions

---

## v2.7 Requirements

### SVELTE5 — Svelte 5 audit sweeps + reactivity-rule documentation

- [x] **SVELTE5-01**: Codebase-wide `bind:*` audit is complete. Every `bind:*` use under `apps/frontend/src/lib/**/*.svelte` has been classified as keep / migrate / remove. Zero `binding_property_non_reactive` warnings on any voter-flow path during dev. Each retained `bind:*` site has an inline justification (or matches a documented pattern in `CLAUDE.md`).
- [ ] **SVELTE5-02**: Codebase-wide `{#key …}` audit is complete. Every retained `{#key}` block has either an inline justification or a test demonstrating that the remount is observable behavior. Defensive `{#key item}`-inside-`{#each}` patterns are removed unless the test gates them.
- [ ] **SVELTE5-03**: Context-destructuring reactivity rule is documented. `CLAUDE.md` (or the appropriate per-package README) records the decision for `const { … } = ctx` / `const { … } = getContext(...)` / `const { … } = use*Context()` patterns: either banned via lint rule, or "use direct property access for reactive reads, destructuring is fine for one-shot reads." Codebase audit complete; any broken-by-destructure-but-working sites are either rewritten or flagged with an inline justification.

### ADAPTER — Supabase adapter type cleanup

- [ ] **ADAPTER-01**: `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` carries zero `as unknown as { ... }` casts (or each remaining one is justified inline with `// @ts-expect-error — reason: …` or a comment). No `any` types remain. The reverse-fill pass uses a real intermediate type (e.g., `InternalFlatNomination`) defined once in a sibling `supabaseDataProvider.types.ts` file and reused across the parent/child mapping loops. Type errors surface at the call site, not in downstream consumers.

### DB — _(no v2.7 requirements; DB-01 deferred — see Future Requirements below)_

### SEED — Default seed completion

- [ ] **SEED-01**: Alliances are present in the default seed. After `yarn dev:reset-with-data`, the default voter flow shows a populated alliances surface (entity tab on the results page, or wherever the alliances UI lives). The default template emits ~2-3 alliances grouping subsets of the existing 8 parties into named coalitions, and `alliance_nominations` link the contributing party nominations. The supabase adapter reverse-fill of `organizationNominationIds` on alliance parents (the v2.6 Phase 64 Plan 01 path that was previously dev-blind) is empirically exercised. `@openvaa/matching` and `@openvaa/filters` handle alliances correctly with seeded data.

### DEVTOOLS — Dev tooling cleanup trio

- [ ] **DEVTOOLS-01**: Frontend autoreloads on `@openvaa/*` package source changes and on root `.env` edits without manual `yarn dev:reset` or restart. Whichever mechanism is chosen — Vite HMR watching `packages/*/dist/`, `vite-plugin-restart`, Turborepo `--watch` composed with Vite HMR, or another option — is documented in the relevant README.
- [ ] **DEVTOOLS-02**: ESLint catches cross-cutting import inconsistencies. Rules covering `@typescript-eslint/consistent-type-imports`, `import/order`, `import/newline-after-import`, `import/no-duplicates`, unused imports, and a project-specific preference for `$lib/...` over deep relative imports are configured and tuned. Fixes applied across the monorepo so `yarn lint:check` is green at HEAD.
- [ ] **DEVTOOLS-03**: Deno tooling is scoped strictly to `apps/supabase/functions/*`. Top-level `deno.json` / `deno.jsonc` / `deno.lock` (if any exist outside `apps/supabase/functions/`) are removed or scoped. VSCode `deno.enable` / `deno.enablePaths` config matches. No `deno lint` or `deno check` runs against non-edge code in CI.

---

## Future Requirements (deferred)

_Items tracked but not in v2.7 scope. Carry forward to v2.8+ or backlog._

- **DB-01 (deferred 2026-04-29 during Phase 66 discussion)** — `nominations` table cleanup: drop redundant `name` (jsonb) and `entity_type` (STORED GENERATED column) columns. Original acceptance: row shape becomes just relationship + `parent_nomination_id`; nothing in the codebase reads either column after the migration; pgTAP tests updated; `yarn supabase:types` produces a tighter type. **Why deferred:** user opted to keep the table as is — `entity_type` is structurally safe today (generated-always-stored from the FK columns; cannot drift), and `name` is harmless even if rarely populated. Cleanup is nice-to-have, not blocking. Source todo `.planning/todos/pending/2026-04-28-cleanup-nominations-table.md` stays open. Revisit when there's a stronger reason than "redundant by structural reasoning" (e.g., a real downstream bug, or column-shape simplification in a future multi-tenant migration).
- **Results URL refactor** — switch results detail route to `/results/[entType]/[nominationId]`; drop redundant `nominationId` / `electionId` / `constituencyId` search params; consider extending the `[electionId]` path prefix to upstream voter routes; evaluate shorter URL IDs (`.planning/todos/pending/results-url-refactor-followups.md`). Pairs naturally with **frontend-project-id-scoping** as a "sharable URLs + multi-tenant" milestone in v2.8.
- **Frontend project-id scoping** — multi-tenant prep (`.planning/todos/pending/frontend-project-id-scoping.md`).
- **Generalize candidate app to support parties** — PROJECT.md §Milestones #17.
- **Admin App migration** — PROJECT.md §Milestones #14.
- **Settings & Configuration paradigm reorg** — PROJECT.md §Milestones #16.
- **Automated security and secrets scanning** — PROJECT.md §Milestones #15.
- **Trusted publishing for npm (OIDC)** — deferred until after initial manual publish (PROJECT.md Future).
- **165 pre-existing intra-package circular deps** in `@openvaa/data` / `@openvaa/matching` / `@openvaa/filters` (the `internal.ts` barrel pattern) — dedicated structural refactor milestone.
- **Claude Skills: architect, components, LLM** — deferred to post-Svelte 5 stabilization (PROJECT.md Future).

## Out of Scope

- **New features** — v2.7 is cleanup + audit only. No new user-facing capabilities.
- **Upstream Svelte 5 audits beyond `bind:*` / `{#key}` / context destructuring** — other Svelte 5 idioms (e.g. `$effect.pre`, `$state.raw`, `$state.snapshot`) are not swept in this milestone.
- **`supabaseDataProvider.ts` refactor beyond type cleanup** — restructuring the adapter's mapping pipeline is out of scope; ADAPTER-01 is type-only.
- **Adapter package loading via TSConfig** (`adapter-package-loading.md`), **rename AdminWriter** (`rename-admin-writer.md`), **SQL linting/formatting tooling** (`sql-linting-formatting.md`), **configurable mock data** (`configurable-mock-data.md`) — indefinitely deferred per the 2026-04-29 STATE.md triage.
- **E2E carry-forward greening** — v2.6 closed the parity gate at HEAD `2c7ad2dea`; v2.7 must not regress that baseline but is not chartered to drive it further green.
- **Local imgproxy intermittent crash** — infrastructure debt, not a code issue (fix with `supabase stop && supabase start`).

---

## Traceability

Phase assignments mapped to `.planning/ROADMAP.md`. Success-criterion references point to the numbered criteria under each phase's `**Success Criteria**` block in ROADMAP.md.

| REQ-ID | Phase | Phase Goal | Success Criterion |
|--------|-------|------------|-------------------|
| SVELTE5-01 | Phase 65: Svelte 5 Audit Sweeps | Every `bind:*` and `{#key …}` use under `apps/frontend/src/lib/**/*.svelte` is classified, justified inline, or removed; the context-destructuring reactivity hazard is documented as a project rule and the codebase is audit-clean against it. | SC-1 (`bind:*` audit complete; zero `binding_property_non_reactive` warnings; inline justification per retained site) |
| SVELTE5-02 | Phase 65: Svelte 5 Audit Sweeps | Every `bind:*` and `{#key …}` use under `apps/frontend/src/lib/**/*.svelte` is classified, justified inline, or removed; the context-destructuring reactivity hazard is documented as a project rule and the codebase is audit-clean against it. | SC-2 (`{#key}` audit complete; retained blocks carry inline justification or test gate; defensive `{#key item}`-in-`{#each}` removed) |
| SVELTE5-03 | Phase 65: Svelte 5 Audit Sweeps | Every `bind:*` and `{#key …}` use under `apps/frontend/src/lib/**/*.svelte` is classified, justified inline, or removed; the context-destructuring reactivity hazard is documented as a project rule and the codebase is audit-clean against it. | SC-3 (Context-destructuring rule documented in `CLAUDE.md` or per-package README; codebase audit complete; broken-but-working sites rewritten or flagged) |
| ~~DB-01~~ | _(deferred 2026-04-29)_ | Moved to Future Requirements — user opted to keep the `nominations` table as is. See Future Requirements above. | — |
| ADAPTER-01 | Phase 66: Adapter Type Cleanup | `supabaseDataProvider.ts` carries zero `as unknown as { ... }` casts; the v2.6 P64 reverse-fill pass uses a real intermediate type (`InternalFlatNomination`) in a sibling `.types.ts` file. | SC-1 through SC-4 (zero `as unknown as` casts; intermediate type bridges supabase-types ↔ @openvaa/data; `yarn workspace @openvaa/frontend check` passes; v2.6 parity gate continues to pass) |
| SEED-01 | Phase 67: Default Seed Alliances | After `yarn dev:reset-with-data`, the default voter flow shows a populated alliances surface; the v2.6 P64 supabase-adapter reverse-fill of `organizationNominationIds` on alliance parents — implemented but never empirically exercised — is now exercised on every dev-seed run. | SC-1 through SC-4 (default template emits ~2-3 alliances + `alliance_nominations`; populated alliances surface in voter results; reverse-fill of `organizationNominationIds` on `Alliance` parents returns non-empty; matching/filters handle alliances correctly) |
| DEVTOOLS-01 | Phase 68: Dev-Tooling Trio | Three independent dev-tooling cleanups land together — frontend dev loop autoreloads on package + env changes, ESLint catches cross-cutting import inconsistencies monorepo-wide, and Deno tooling is scoped strictly to where it belongs. | SC-1 (Frontend reloads on `@openvaa/*` package source + `.env` edits without manual `yarn dev:reset`; chosen mechanism documented) |
| DEVTOOLS-02 | Phase 68: Dev-Tooling Trio | Three independent dev-tooling cleanups land together — frontend dev loop autoreloads on package + env changes, ESLint catches cross-cutting import inconsistencies monorepo-wide, and Deno tooling is scoped strictly to where it belongs. | SC-2 (`yarn lint:check` green at HEAD with new import rules enforced; monorepo-wide cleanup applied) |
| DEVTOOLS-03 | Phase 68: Dev-Tooling Trio | Three independent dev-tooling cleanups land together — frontend dev loop autoreloads on package + env changes, ESLint catches cross-cutting import inconsistencies monorepo-wide, and Deno tooling is scoped strictly to where it belongs. | SC-3 (Top-level `deno.*` scoped or removed outside `apps/supabase/functions/`; VSCode config matches; no Deno lint/check on non-edge code in CI) |
