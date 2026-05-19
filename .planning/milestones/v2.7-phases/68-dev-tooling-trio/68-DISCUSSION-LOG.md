# Phase 68: Dev-Tooling Trio - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 68-dev-tooling-trio
**Areas discussed:** Autoreload mechanism, ESLint gap fill, Deno scope inversion, Cleanup blast radius

---

## Autoreload Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Turborepo --watch + Vite HMR | `yarn turbo watch build` rebuilds packages/*/dist on src changes; Vite HMR auto-picks up dist via existing preserveSymlinks. Add `vite-plugin-restart` for .env. Todo's preferred path. | ✓ |
| vite-plugin-restart only | Watch packages/*/dist + root .env to trigger Vite server restart (full reload, not HMR). Simpler; loses incremental HMR. | |
| Custom Vite plugin | Hand-roll a small Vite plugin. Most control, most maintenance burden. | |

**User's choice:** Turborepo --watch + Vite HMR (Recommended)
**Notes:** Composes with existing Turborepo + Vite tooling; no custom plugin maintenance.

---

## ESLint Gap Fill

| Option | Description | Selected |
|--------|-------------|----------|
| Add unused-imports + $lib preference | Add `eslint-plugin-unused-imports` (auto-removes unused imports). Add custom `no-restricted-imports` rule preferring $lib over deep relatives. Skip `import/order` (overlap with simple-import-sort). Targeted fill of actual gaps. | ✓ |
| Just unused-imports | Add unused-imports plugin only. Skip $lib preference rule — lower friction, but doesn't address the deep-relative-import smell. | |
| Full toolkit | Add unused-imports + $lib preference + import/order. Highest noise; potential rule conflicts. | |

**User's choice:** Add unused-imports + $lib preference (Recommended)
**Notes:** Rules added to `packages/shared-config/eslint.config.mjs` — single source of truth. Most rules from todo already present (`consistent-type-imports`, `simple-import-sort`, `no-duplicates`, `newline-after-import`, `import/first`, `consistent-type-specifier-style`).

---

## Deno Scope Inversion

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with apps/supabase/functions only | `deno.enablePaths` becomes `['apps/supabase/functions']`. Drops the 5 incorrect non-edge entries + `_deno_shims`. | ✓ |
| Add to enablePaths, keep existing | Wrong — the existing list is the problem. | |
| Leave .vscode untouched, add deno.json scoped | Doesn't fix the IDE-level mis-scoping. | |

**User's choice:** Replace with apps/supabase/functions only (Recommended)
**Notes:** Current `deno.enablePaths` lists `packages/core, matching, data, filters, app-shared, _deno_shims` — all NON-edge. `apps/supabase/functions/` not listed at all. Inversion fixes IDE scope; no `deno.json` files exist anywhere (verified during scout).

---

## Cleanup Blast Radius

| Option | Description | Selected |
|--------|-------------|----------|
| One sweep PR with auto-fix + manual fixes | Add rules → run `yarn lint:fix` → manually resolve unused-imports + $lib violations → commit as one cleanup wave. Plan 68-02 atomic. | ✓ |
| Surface violations + triage first | Add rules with `// eslint-disable` per file violation, ship green, file follow-up todo for actual cleanup. | |
| Per-package incremental sweeps | Apply rules + fix one workspace at a time. Smaller diffs; longer phase. | |

**User's choice:** One sweep PR with auto-fix + manual fixes (Recommended)
**Notes:** Matches v2.6 milestone close cadence; atomic cleanup, not incremental.

---

## Claude's Discretion

- Specific `concurrently` invocation vs Turborepo pipeline orchestration for D-01
- Specific `no-restricted-imports` regex pattern for $lib preference (suggest `^(\.\./){2,}lib`)
- `_deno_shims/` directory disposition — investigate during execution
- Whether to bundle Plan 68-01/02/03 verification into one verification plan or fold into last item
- README location for D-01 documentation (`apps/frontend/README.md` suggested)

## Deferred Ideas

- `import/order` rule (would conflict with simple-import-sort)
- Custom svelte-eslint plugin for context-destructure ban (Phase 65 follow-up)
- SQL linting/formatting tooling (separate todo; OoS per REQUIREMENTS.md)
- Pre-commit hooks for lint
- TypeScript strict-mode tightening across packages
- Per-package ESLint overrides
- Migrating to a different bundler/dev server
- Adding eslint-plugin-svelte
- Removing Turborepo
