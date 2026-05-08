# Phase 68: Dev-Tooling Trio - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Milestone:** v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phase 4 of 4)

<domain>
## Phase Boundary

Three independent dev-tooling cleanups bundled under one phase per the user's "trio" framing. Each is small enough that splitting into separate phases would be administrative overhead.

1. **Frontend autoreload on package + env changes** (DEVTOOLS-01) — Vite dev server doesn't reliably autoreload when `@openvaa/*` package source files change or when root `.env` is edited. Both currently require manual `yarn dev:reset` or restart.
2. **ESLint cross-cutting import inconsistencies** (DEVTOOLS-02) — Most rules from the source todo are **already present** in `packages/shared-config/eslint.config.mjs` (`@typescript-eslint/consistent-type-imports`, `simple-import-sort/imports`, `import/no-duplicates`, `import/newline-after-import`, `import/first`, `import/consistent-type-specifier-style`). Gaps: no unused-imports plugin; no `no-deep-relative-imports` / `$lib`-preference rule.
3. **Deno tooling scope inversion** (DEVTOOLS-03) — `.vscode/settings.json` `deno.enablePaths` currently lists `packages/core, matching, data, filters, app-shared, _deno_shims` — all NON-edge-function paths! `apps/supabase/functions/` is NOT listed. No `deno.json` files exist anywhere in the repo (already clean at the file level). Inversion fixes the IDE-level mis-scoping.

**Goal anchor:** ROADMAP SC-1 (autoreload works), SC-2 (`yarn lint:check` green at HEAD with new rules), SC-3 (Deno scoped to `apps/supabase/functions/*`), SC-4 (v2.6 parity gate at HEAD `2c7ad2dea` continues to pass).

**In scope:**
- **Item 1 (autoreload):** Add Turborepo `--watch` composition with Vite HMR. Frontend dev workflow becomes `yarn dev` → triggers `turbo watch build` for packages + `vite dev` for frontend; package source edits → turbo rebuilds dist/ → Vite HMR picks up the change. Add `vite-plugin-restart` watching root `.env` to trigger Vite server restart on env changes. Document the chosen mechanism in `apps/frontend/README.md` (or root README — planner picks).
- **Item 2 (lint):** Add `eslint-plugin-unused-imports` (auto-removes unused imports). Add a custom `no-restricted-imports` (or equivalent) rule preferring `$lib/...` over deep relatives like `../../../lib/...`. Run `yarn lint:fix` + manual fixes for any non-auto-fixable violations across the monorepo. Land as one sweep PR.
- **Item 3 (deno):** Update `.vscode/settings.json` `deno.enablePaths` from the current 5 non-edge entries (`packages/core, matching, data, filters, app-shared, _deno_shims`) to **only** `apps/supabase/functions`. Verify `_deno_shims/` directory: if it's a valid leftover, document why; if dead, remove. Verify no CI step runs `deno lint` or `deno check` against non-edge code (scout: no `deno.json` files outside edge functions, so unlikely; verification step is small).

**Out of scope:**
- Replacing Vite or the dev server toolchain — keep current stack
- Adding `import/order` rule (overlaps with existing `simple-import-sort/imports`; would create rule conflicts)
- SQL linting/formatting tooling (separate todo; explicit OoS per REQUIREMENTS.md)
- Wider TypeScript config refactor — only Deno-related TS config touched
- Adding pre-commit hooks for lint — out of scope; existing lint workflow stays
- Migrating any non-edge code to Deno — Deno scope only narrows, never widens

</domain>

<decisions>
## Implementation Decisions

### Item 1: Frontend Autoreload Mechanism

- **D-01: Turborepo `--watch` + Vite HMR (composed); `vite-plugin-restart` for `.env` reload.**
  - **Package autoreload:** Add a `dev:packages` script that runs `turbo watch build --filter=@openvaa/*` (or equivalent) in parallel with `vite dev`. Vite's `preserveSymlinks: true` (already set in `vite.config.ts:13`) means it picks up rebuilt `dist/` outputs via its existing module graph. The `yarn dev` script is updated to launch both processes (e.g., via `concurrently` or a Turborepo pipeline).
  - **Env reload:** Add `vite-plugin-restart` to `vite.config.ts` watching `../../.env` (relative to `apps/frontend/`). Triggers a Vite server restart on `.env` edits — full reload (not HMR), but env changes inherently invalidate runtime state, so a full restart is correct.
  - **Documentation:** `apps/frontend/README.md` gets a "Dev workflow" section documenting the chosen mechanism (per ROADMAP SC-1's "documented in the relevant README").
  - **Rationale:** The todo's preferred path; composes with existing tooling (Turborepo already in use); no custom Vite plugin maintenance burden.

### Item 2: ESLint Gap Fill

- **D-02: Add `eslint-plugin-unused-imports` + custom `$lib`-preference rule. Skip `import/order` (overlaps with `simple-import-sort/imports`).**
  - **`eslint-plugin-unused-imports`:** Auto-removes unused imports during `yarn lint:fix`. Configure with `unused-imports/no-unused-imports: error`. Pairs cleanly with the existing `simple-import-sort` setup.
  - **`$lib`-preference rule:** Add a `no-restricted-imports` rule (or a custom plugin) preferring `$lib/...` over deep relatives. Targets paths like `../../../lib/...` inside `apps/frontend/src/`. Allow exceptions for sibling/parent imports within the same feature directory (e.g., `./helpers`, `../types`).
  - **Skip `import/order`:** `simple-import-sort/imports` (already configured at line ~140 of `packages/shared-config/eslint.config.mjs`) covers ordering. Adding `import/order` would create rule conflicts.
  - **Rule location:** Both new rules added to `packages/shared-config/eslint.config.mjs` so all workspaces inherit. The existing `eslint.config.mjs` re-export pattern (root `eslint.config.mjs` is a 1-line re-export) means no per-workspace changes needed.

### Item 3: Deno Scope Inversion

- **D-03: Replace `.vscode/settings.json` `deno.enablePaths` with `["apps/supabase/functions"]` only.**
  - **Current state (verified during scout):** `deno.enablePaths` lists `packages/core, packages/matching, packages/data, packages/filters, packages/app-shared, _deno_shims` — none of these are edge functions. `apps/supabase/functions/` is NOT listed at all.
  - **New state:** `deno.enablePaths` = `["apps/supabase/functions"]`. All 5 non-edge entries removed. `_deno_shims` directory: investigate during execution (if it's a paused-v2.2 leftover, remove the directory; if it's still load-bearing for something, document why and keep — but exclude from `deno.enablePaths`).
  - **CI verification:** No `deno.json` files exist anywhere in the repo (verified during scout). CI does not run `deno lint` or `deno check` against non-edge code today (no Deno step in the existing CI). Phase 68 verifies this remains true post-changes.
  - **VSCode reload:** `.vscode/settings.json` changes take effect on VSCode reload; no migration ceremony needed.

### Cleanup Blast Radius

- **D-04: One sweep PR with auto-fix + manual fixes.** After D-02 rule additions, run `yarn lint:fix` to auto-fix unused imports + simple violations. Manually resolve any remaining `$lib`-preference violations (likely a few dozen across the frontend; planner estimates). Commit as a single cleanup wave inside the lint plan (Plan 68-02). Matches the v2.6 milestone close cadence (atomic cleanup, not per-package incremental).

### Plan Split

- **D-05: 3 plans (per ROADMAP), one per trio item.**
  - **Plan 68-01: Autoreload** (D-01) — Turborepo `--watch` integration, `vite-plugin-restart` for `.env`, `apps/frontend/README.md` documentation update
  - **Plan 68-02: ESLint cleanup** (D-02 + D-04) — Add `eslint-plugin-unused-imports` + `$lib`-preference rule to `packages/shared-config/eslint.config.mjs`, run `yarn lint:fix`, resolve manual violations, ensure `yarn lint:check` PASSes monorepo-wide
  - **Plan 68-03: Deno scope inversion** (D-03) — Update `.vscode/settings.json` `deno.enablePaths`, audit `_deno_shims/` directory (keep + document or remove), verify CI has no Deno-on-non-edge step
  - Plans are **independent** and could run in parallel (no dependencies between the three trio items). Sequential default for simplicity; planner may parallelize if clean.
- **Verification:** Phase 68 verification step (folded into Plan 68-02 or a separate Plan 68-04 — planner picks) runs `yarn build && yarn test:unit && yarn lint:check` + v2.6 parity gate.

### Claude's Discretion

- Specific `concurrently` invocation vs Turborepo pipeline orchestration for D-01 — planner picks based on what reads cleanest in `package.json` scripts
- Specific `no-restricted-imports` regex pattern for the `$lib`-preference rule — planner picks; suggest matching `^(\.\./){2,}lib` (3+ parent traversals)
- `_deno_shims/` directory disposition — investigation during execution; if it's a leftover from paused v2.2, remove; if load-bearing for anything (e.g., type stubs for Deno-specific globals used in edge functions), document and keep
- Whether to bundle Plan 68-01 + Plan 68-02 + Plan 68-03 verification into one verification plan or fold into the last item plan — planner picks
- README location for D-01 documentation — `apps/frontend/README.md` is suggested; root `README.md` is acceptable if dev workflow lives there today

### Folded Todos

- **`2026-04-25-dev-tooling-cleanup-trio.md`** — folded as the entire scope of D-01, D-02, D-03, D-04. Closed by Phase 68 completion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 68 — Goal, dependencies (none — independent of 65-67), success criteria
- `.planning/REQUIREMENTS.md` §DEVTOOLS — DEVTOOLS-01, DEVTOOLS-02, DEVTOOLS-03 acceptance text
- `.planning/STATE.md` §Roadmap Evolution — v2.7 milestone scope rationale

### Source Todos (folded into this phase)
- `.planning/todos/pending/2026-04-25-dev-tooling-cleanup-trio.md` — full trio investigation + acceptance criteria

### Files Targeted by Phase 68

**Item 1 (autoreload):**
- `apps/frontend/vite.config.ts` — add `vite-plugin-restart` plugin config
- `apps/frontend/package.json` — add `vite-plugin-restart` dependency
- Root `package.json` — possibly update the `dev` script to launch Turborepo `--watch` alongside `vite dev` (planner picks orchestration)
- `turbo.json` — possibly add or refine a watch task definition
- `apps/frontend/README.md` — **NEW** "Dev workflow" section per SC-1 documentation requirement

**Item 2 (lint):**
- `packages/shared-config/eslint.config.mjs` — add `eslint-plugin-unused-imports` plugin + rule, add `$lib`-preference rule
- `packages/shared-config/package.json` — add `eslint-plugin-unused-imports` dependency
- Monorepo-wide: any file violating the new rules — `yarn lint:fix` auto-fix + manual resolution

**Item 3 (deno):**
- `.vscode/settings.json` — replace `deno.enablePaths` value
- `_deno_shims/` directory — audit; remove or document
- Possibly `apps/supabase/functions/deno.json` — investigation: if creating a deno.json there explicitly anchors scope (rather than relying solely on VSCode config), planner decides

### Reference Files (read-only)
- `packages/shared-config/eslint.config.mjs` — current ESLint config (already has `consistent-type-imports`, `simple-import-sort/imports`, `import/no-duplicates`, `import/newline-after-import`, `import/first`, `import/consistent-type-specifier-style`)
- Root `eslint.config.mjs` — 1-line re-export of `@openvaa/shared-config/eslint`
- `apps/frontend/vite.config.ts` — current Vite config; minimal, only `tailwindcss`, `paraglideVitePlugin`, `sveltekit`
- `apps/frontend/package.json` — current dev script: `"dev": "vite dev"`
- `turbo.json` — current Turborepo pipeline definition

### Verification References
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — v2.6 parity gate; Phase 68 re-runs but does NOT regenerate constants
- v2.6 parity baseline at HEAD `2c7ad2dea` — Phase 68 must not regress

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`packages/shared-config/eslint.config.mjs`** — single source of ESLint config; already-configured rules cover most of the source todo's gaps. Phase 68 adds 2 new rules + 1 new plugin to this file
- **Root `eslint.config.mjs`** — 1-line re-export pattern means workspaces auto-inherit; no per-workspace changes needed
- **`apps/frontend/vite.config.ts:13` `preserveSymlinks: true`** — already set; means Vite picks up rebuilt `packages/*/dist/` via its existing module graph. D-01 leverages this
- **Turborepo** — already in use; `turbo watch build --filter=@openvaa/*` is the canonical "rebuild packages on source change" invocation. No new tooling
- **`yarn lint:fix`** — existing command; D-04 cleanup uses this for auto-fix wave
- **`apps/supabase/functions/`** — the legitimate Deno-tooling target; D-03 inverts `.vscode/settings.json` to point here

### Established Patterns

- **Single-config inheritance** — `packages/shared-config/eslint.config.mjs` is the only place ESLint rules live. Don't add per-workspace overrides unless required
- **No backwards-compat shims** — Per CLAUDE.md "Avoid backwards-compatibility hacks". `_deno_shims/` will be evaluated on this principle: keep only if actively used
- **`generateTranslationsForAllLocales: true`** — locale handling pattern (not directly relevant to Phase 68 but noted as the "auto-extension via tooling" idiom)
- **v2.6 parity gate at HEAD `2c7ad2dea`** — non-regression invariant for the milestone; Phase 68 must keep this green

### Integration Points

- **Yarn workspace pipeline** — Turborepo `--watch` composes with Vite via the existing build outputs (`dist/`); no IPC or custom orchestration
- **VSCode + Deno extension** — `.vscode/settings.json` `deno.enablePaths` is the IDE-level scope contract; Phase 68 inverts it
- **CI lint step** — `yarn lint:check` is the gate; Phase 68 keeps this green by adding rules + auto-fixing violations in the same PR
- **Frontend dev loop** — `yarn dev` is the user-facing entry point; D-01 changes its semantics (now launches package watcher + Vite dev together)

</code_context>

<specifics>
## Specific Ideas

- **Most ESLint rules from the source todo ALREADY exist** — D-02 only adds `unused-imports` + `$lib`-preference. The todo's checklist (`@typescript-eslint/consistent-type-imports`, `import/order`, `import/newline-after-import`, `import/no-duplicates`) is mostly redundant; `import/order` would conflict with `simple-import-sort`. This is a smaller phase than the todo suggests
- **No `deno.json` files exist anywhere in the repo today** (verified during scout). The Deno-tooling problem is purely IDE-level: `.vscode/settings.json` `deno.enablePaths` is backwards. Fix is a single-file edit
- **`_deno_shims/` directory** is a v2.2 leftover suspect — investigate during execution; remove if dead
- **Turborepo `--watch` + Vite HMR composition** is the todo's preferred autoreload mechanism — Phase 68 commits to it (D-01)
- **One sweep PR for lint cleanup** (D-04) — matches v2.6 milestone close cadence; not per-package incremental
- **Three plans = three trio items, independent** — no dependencies between autoreload, lint, and Deno fixes; planner may parallelize

</specifics>

<deferred>
## Deferred Ideas

- **`import/order` rule** — explicit reject in D-02. Would conflict with `simple-import-sort/imports`. Revisit only if `simple-import-sort` is replaced
- **Custom svelte-eslint plugin for context-destructure ban** (Phase 65 D-02 follow-up) — separate from Phase 68's import rules. Tracked under Phase 65 deferred ideas
- **SQL linting/formatting tooling** (separate todo `sql-linting-formatting.md`) — explicit OoS per REQUIREMENTS.md. Indefinitely deferred per 2026-04-29 STATE.md triage
- **Pre-commit hooks for lint** — out of scope. Current lint workflow (CI + `yarn lint:fix` on demand) stays
- **TypeScript strict-mode tightening across packages** — out of scope. Phase 68 only touches Deno-related TS config
- **Per-package ESLint overrides** — out of scope. Single-source-of-truth principle preserved
- **Migrating to a different bundler / dev server** — out of scope. Vite stays
- **Adding `eslint-plugin-svelte` rules** — out of scope. The existing config doesn't include it; adding would be a separate scope-expansion phase
- **Removing Turborepo** — out of scope. Phase 68 leverages Turborepo; doesn't reconsider it

### Reviewed Todos (not folded)

- None — Phase 68 scope is precisely the trio todo. No additional pending todos surfaced as in-scope during scout.

</deferred>

---

*Phase: 68-dev-tooling-trio*
*Context gathered: 2026-04-29*
