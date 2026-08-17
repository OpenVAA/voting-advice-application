---
phase: 68
slug: dev-tooling-trio
researched: 2026-05-08
domain: dev-tooling (build watcher composition + ESLint flat-config rules + IDE Deno scoping)
confidence: HIGH
---

# Phase 68: Dev-Tooling Trio — Research

## Executive Summary

All three trio items resolve to **small, low-risk file edits** with mature library support. The bulk of the work is composition + cleanup, not novel implementation.

- **D-01 (autoreload):** Compose existing `yarn watch:shared` (`turbo watch build --filter='./packages/*'`) with `vite dev` via shell `&` (or a `concurrently` dep) in the root `dev` script; add `vite-plugin-restart@^2.0.0` to `apps/frontend/vite.config.ts` watching `../../.env`. `preserveSymlinks: true` is already set — Vite picks up rebuilt `dist/` automatically. [VERIFIED: registry + repo grep]
- **D-02 (ESLint):** Add `eslint-plugin-unused-imports@^4.4.1` to `packages/shared-config` and one `no-restricted-imports` rule with a `patterns.regex`. Expected violation count is **0–48** for unused-imports (auto-fixed) and **likely 0** for the `$lib` rule as currently scoped (deep-`../../../lib/` pattern is not violated anywhere in `apps/frontend/src/`; route-internal `../../MainContent.svelte` imports are intra-routes, not lib). [VERIFIED: registry + frontend grep]
- **D-03 (Deno):** All 6 entries currently in `.vscode/settings.json` `deno.enablePaths` are wrong AND the path the CONTEXT.md proposes (`apps/supabase/functions`) is **also wrong** — edge functions actually live at `apps/supabase/supabase/functions/` (nested supabase dir). `_deno_shims/` directory **does not exist on disk** — it's a phantom path. Zero Deno references in CI. [VERIFIED: filesystem audit + CI grep]

**Primary recommendation:** Land each plan as a single small commit. Plan 68-03 is ~3 lines of edit. Plan 68-02 may be a no-op-cleanup wave (if the 48 deep-relative imports are all intra-routes/intra-feature). Plan 68-01 is the most substantial (vite config + root script + new README).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Package source watch + rebuild | Build tooling (Turborepo) | — | Turborepo already orchestrates package builds via `turbo watch build`; this composes with Vite |
| Frontend HMR on dist/ change | Dev server (Vite) | — | Vite + `preserveSymlinks: true` already wired; picks up rebuilt `packages/*/dist/` via the existing module graph |
| `.env` change → server restart | Dev server plugin (`vite-plugin-restart`) | — | Vite cannot reload its own env snapshot; plugin is the canonical pattern |
| Cross-cutting import rules | Build/lint config (`packages/shared-config/eslint.config.mjs`) | — | Single-source-of-truth ESLint config; root + workspaces already re-export |
| Deno IDE scope | IDE config (`.vscode/settings.json`) | — | Pure IDE-level concern; no runtime/CI implication |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEVTOOLS-01 | Frontend autoreloads on `@openvaa/*` source + root `.env` edits without manual restart; mechanism documented | D-01 section: turbo watch + vite-plugin-restart + new `apps/frontend/README.md` Dev workflow |
| DEVTOOLS-02 | `yarn lint:check` green at HEAD with rules covering type-imports, import order/dedup, unused imports, `$lib` preference | D-02 section: existing rules cover most; `eslint-plugin-unused-imports@4.4.1` + `no-restricted-imports` regex pattern fills the two gaps |
| DEVTOOLS-03 | Deno tooling scoped to `apps/supabase/supabase/functions/`; VSCode config matches; no Deno on non-edge code in CI | D-03 section: 1-line edit to `.vscode/settings.json`; CI scan confirms zero Deno references |

## Standard Stack

### Core (new dependencies to add)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite-plugin-restart` | `^2.0.0` | Restart Vite server on `.env` change | antfu-maintained; the canonical plugin for this. 4 months ago latest publish. [VERIFIED: npm view 2026-05-08] |
| `eslint-plugin-unused-imports` | `^4.4.1` | Auto-remove unused imports during `lint:fix` | sweepline-maintained; explicitly designed for ESLint 9 flat config + `@typescript-eslint` 8. [VERIFIED: npm view 2026-05-08] |

### Existing (already in repo, leveraged as-is)
| Library | Version | Purpose | Existing Use |
|---------|---------|---------|--------------|
| `turbo` | `^2.8.17` (root) | Watch + rebuild packages | Already wired via `yarn watch:shared` |
| `vite` | `^6.4.1` (frontend) | Dev server with HMR + symlink-preserved module graph | `preserveSymlinks: true` already set; picks up `dist/` automatically |
| `eslint-plugin-simple-import-sort` | `^12.1.1` | Import ordering | Already configured; **DO NOT add `import/order`** (would conflict per D-02) |
| `eslint-plugin-import` | `^2.32.0` | `import/no-duplicates`, `import/first`, `import/newline-after-import` | All 3 already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shell `&` for concurrent dev script | `concurrently` package | Shell `&` adds zero deps but doesn't merge stdio cleanly; `concurrently` adds 1 dep but produces prefixed/colored output. Planner picks |
| `concurrently` | `npm-run-all` (`run-p`) | Functionally equivalent for this use case; `concurrently` is more maintained (last npm publish more recent) |
| `vite-plugin-restart` | Custom Vite plugin watching `.env` via `chokidar` | Custom plugin = more maintenance; `vite-plugin-restart` is 30 LOC, antfu-blessed, sufficient |
| `no-restricted-imports` regex | Custom ESLint plugin | Custom plugin = much more code for a single pattern check; `no-restricted-imports` with `patterns.regex` is the standard approach |

**Installation (per plan):**

```bash
# Plan 68-01
yarn workspace @openvaa/frontend add -D vite-plugin-restart

# Plan 68-02
yarn workspace @openvaa/shared-config add eslint-plugin-unused-imports
```

**Version verification (2026-05-08):**
- `vite-plugin-restart`: 2.0.0 — published ~4 months ago [VERIFIED: `npm view vite-plugin-restart version`]
- `eslint-plugin-unused-imports`: 4.4.1 — actively maintained as of Feb 2026 [VERIFIED: `npm view eslint-plugin-unused-imports version`]
- `turbo`: latest 2.9.10 (repo at 2.8.17 — close enough, no upgrade required for Phase 68) [VERIFIED: `npm view turbo version`]

## Project Constraints (from CLAUDE.md)

These directives constrain Phase 68 plans:

- **`yarn` not `npm`** — `engine.npm: "please-use-yarn"` in root `package.json`. All install/run commands must use `yarn`.
- **`yarn 4.13` workspaces** — package additions go via `yarn workspace @openvaa/<pkg> add` (or `yarn add` at root for shared dev deps).
- **TypeScript strict** — "avoid `any`, prefer explicit types". `vite.config.ts` currently has one `as any` cast on `paraglideVitePlugin` with an inline lint-disable; D-01 must not add new `any`.
- **Single-source-of-truth ESLint** — `packages/shared-config/eslint.config.mjs` is the only place rules live; root + workspaces re-export. D-02 adds rules ONLY there.
- **Never commit `.env`** — already in `.gitignore`; Phase 68 only watches it, never reads its contents into source.
- **Test accessibility (WCAG 2.1 AA)** — not directly applicable to Phase 68 (no UI changes).
- **No backwards-compat shims** — directly relevant: `_deno_shims/` is the suspect (and confirmed absent on disk).

## Architecture Patterns

### System Architecture Diagram

```
                          yarn dev (root script)
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
                ▼                                       ▼
       supabase:start                       (concurrent execution)
       (existing)                                       │
                                ┌───────────────────────┴───────────────────┐
                                │                                           │
                                ▼                                           ▼
                  turbo watch build --filter=          yarn workspace @openvaa/frontend dev
                     './packages/*'                              │
                                │                                ▼
                                │                       vite dev (port FRONTEND_PORT)
                                │                                │
                                ▼                                │
                     packages/*/dist/ rebuilt                    │
                                │                                │
                                └───── Vite module graph ────────┤
                                       (preserveSymlinks: true)  │
                                                                 │
                                                       vite-plugin-restart
                                                                 │
                                                                 ▼
                                                       watch ../../.env
                                                                 │
                                                                 ▼
                                                       full Vite restart on change
                                                       (env snapshot reseeded)
```

**Reading guide:** Package source edit → `turbo watch` rebuilds dist → Vite HMR fires (no full reload). `.env` edit → `vite-plugin-restart` triggers full Vite server restart (env can't be HMR'd).

### Project Structure (relevant files)

```
voting-advice-application-gsd/
├── package.json                                # Root: dev / watch:shared scripts
├── turbo.json                                  # Build/lint/test:unit/typecheck tasks
├── eslint.config.mjs                           # 1-line re-export
├── .vscode/settings.json                       # deno.enablePaths (Phase 68 D-03 target)
├── apps/
│   ├── frontend/
│   │   ├── package.json                        # Phase 68 D-01: add vite-plugin-restart
│   │   ├── vite.config.ts                      # Phase 68 D-01: add ViteRestart plugin
│   │   ├── README.md                           # Phase 68 D-01: NEW (per SC-1)
│   │   └── src/
│   └── supabase/
│       └── supabase/                           # ⚠ NESTED — actual edge function root
│           └── functions/                      # Deno code lives HERE
│               ├── invite-candidate/
│               ├── identity-callback/
│               └── send-email/
└── packages/
    ├── shared-config/
    │   ├── eslint.config.mjs                   # Phase 68 D-02: add 2 rules
    │   └── package.json                        # Phase 68 D-02: add unused-imports
    └── core, data, matching, filters, app-shared, dev-seed, ...
                                                 # all build to packages/*/dist/
```

### Pattern 1: Compose `turbo watch` with Vite dev (D-01)

**What:** Run `turbo watch build` (rebuilds packages on src change) in parallel with `vite dev` (HMR on dist change).

**When to use:** Monorepo with shared compiled packages where the consumer (Vite app) needs live updates.

**Why this pattern:** Per [maier.tech SvelteKit + Turborepo guide](https://maier.tech/posts/configuring-turborepo-for-a-sveltekit-monorepo): "Turborepo does not allow any task to depend on a persistent task." So `turbo watch build` and `vite dev` can't be composed via a single Turborepo `dev` task that depends on both — they must run in parallel at the npm-script layer.

**Two implementation options (planner picks):**

**Option A — Shell ampersand (zero new deps):**

```jsonc
// package.json (root)
{
  "scripts": {
    "dev": "yarn supabase:start && (yarn watch:shared & yarn workspace @openvaa/frontend dev)",
    "watch:shared": "turbo watch build --filter='./packages/*'"  // EXISTS
  }
}
```

**Option B — `concurrently` (cleaner output, 1 new dev dep):**

```jsonc
// package.json (root)
{
  "scripts": {
    "dev": "yarn supabase:start && concurrently -n watch,frontend -c blue,green \"yarn watch:shared\" \"yarn workspace @openvaa/frontend dev\""
  },
  "devDependencies": {
    "concurrently": "^9.x"
  }
}
```

**Recommendation:** Option B — output prefixing matters for debuggability when both processes scream at the same time. The 1-dep cost is trivial; `concurrently` is mature.

⚠ **Cross-platform note:** Bare `&` works on macOS/Linux but not Windows `cmd`. The repo's existing scripts (`yarn supabase:start && yarn workspace ...`) already assume POSIX shell — this is consistent with the existing patterns. Option B sidesteps the issue entirely. [CITED: Turborepo issue #8673 + maier.tech]

### Pattern 2: `vite-plugin-restart` for `.env` watching (D-01)

**What:** A 30-LOC Vite plugin that calls `restart()` on the dev server when matched files change.

**Source:** [github.com/antfu/vite-plugin-restart](https://github.com/antfu/vite-plugin-restart)

**Minimal config:**

```typescript
// apps/frontend/vite.config.ts
import ViteRestart from 'vite-plugin-restart';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({ /* ... */ }) as any,
    sveltekit(),
    ViteRestart({
      restart: ['../../.env']  // root .env, relative to apps/frontend/
    })
  ],
  resolve: { preserveSymlinks: true },
  server: { port: Number(process.env.FRONTEND_PORT) }
});
```

**Defaults (per plugin README):**
- `glob: true` — patterns are globbed
- `delay: 500` — 500ms debounce before restart
- `contentCheck: true` — only restart if file CONTENT changed (not just mtime)

**Caveat — `server.fs.allow`:** Vite's filesystem allow-list defaults to the project root + workspace root in monorepos. The repo's `vite.config.ts` does not set `server.fs.allow` explicitly, meaning Vite uses `searchForWorkspaceRoot()` and finds the monorepo root via `package.json` workspaces — `../../.env` (which is at the workspace root) is INSIDE the allow-list. **No `server.fs.allow` change needed.** [VERIFIED: vite.config.ts inspection]

### Pattern 3: `no-restricted-imports` for `$lib` preference (D-02)

**What:** ESLint built-in rule with `patterns.regex` — restrict imports matching a regex.

**Spec ([eslint.org docs](https://eslint.org/docs/latest/rules/no-restricted-imports)):**

```javascript
// packages/shared-config/eslint.config.mjs (additional rule)
'no-restricted-imports': ['error', {
  patterns: [{
    regex: '^(\\.\\./){2,}lib(/|$)',
    message: 'Use the $lib alias instead of deep relative imports into lib/. Example: import X from $lib/components/Foo'
  }]
}]
```

**Rule mechanics:**
- `regex` and `group` are mutually exclusive — pick one
- Regex uses JavaScript regex syntax; double-escape `\\` because it's a JSON string
- Pattern `^(\.\./){2,}lib(/|$)` matches 2+ parent traversals followed by `lib/...` (e.g., `../../lib/foo`, `../../../lib/bar`)
- One-level `../lib/...` is allowed — sibling-of-lib imports are legitimate (e.g., a file in `apps/frontend/src/routes/` reaching `../lib/...`)

**Scoping the rule to apps/frontend only (avoid false-positives in packages/):**

```javascript
// packages/shared-config/eslint.config.mjs
{
  files: ['apps/frontend/src/**/*.{ts,svelte}'],
  rules: {
    'no-restricted-imports': ['error', { patterns: [/* ... */] }]
  }
}
```

⚠ **Flat-config quirk:** `files` paths in flat config are relative to the eslint.config.mjs LOCATION. Since `eslint.config.mjs` lives in `packages/shared-config/`, the `files` glob has to match absolute or use a workspace-relative pattern. Easier to scope via `**/apps/frontend/src/**/*` matching anywhere in the resolved tree. [CITED: eslint.org flat-config docs]

### Pattern 4: `eslint-plugin-unused-imports` flat-config registration (D-02)

**What:** Auto-removes unused imports during `eslint --fix`. Splits responsibility from `@typescript-eslint/no-unused-vars` (which catches but doesn't auto-fix imports specifically).

**Source:** [github.com/sweepline/eslint-plugin-unused-imports](https://github.com/sweepline/eslint-plugin-unused-imports)

**Flat-config snippet:**

```javascript
// packages/shared-config/eslint.config.mjs
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  // ... existing config ...
  {
    plugins: {
      // ... existing ...
      'unused-imports': unusedImports
    },
    rules: {
      // ... existing ...
      '@typescript-eslint/no-unused-vars': 'off',  // disable the base rule
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }]
    }
  }
];
```

⚠ **Composition order with `simple-import-sort`:** ESLint runs auto-fixers in **multiple passes**. The fixers don't conflict because:
1. `unused-imports/no-unused-imports` REMOVES dead imports (changes the import set)
2. `simple-import-sort/imports` REORDERS the remaining imports

ESLint repeats until fixed-point. Result is correct regardless of order. [CITED: ESLint multi-pass fix semantics]

### Pattern 5: Deno scope inversion (D-03)

**What:** `.vscode/settings.json` `deno.enablePaths` lists which folders the VSCode Deno extension treats as Deno code. Phase 68 corrects 5 wrong entries + 1 phantom entry.

**Current state ([VERIFIED: filesystem audit 2026-05-08]):**

```jsonc
// .vscode/settings.json — CURRENT
{
  "deno.enablePaths": [
    "packages/core",         // ❌ Node 22 code, not Deno
    "packages/matching",     // ❌ Node 22 code, not Deno
    "packages/data",         // ❌ Node 22 code, not Deno
    "packages/filters",      // ❌ Node 22 code, not Deno
    "packages/app-shared",   // ❌ Node 22 code, not Deno
    "_deno_shims"            // ❌ DOES NOT EXIST ON DISK
  ]
}
```

**Target state:**

```jsonc
// .vscode/settings.json — POST-PHASE-68
{
  "deno.enablePaths": ["apps/supabase/supabase/functions"]
}
```

⚠ **CRITICAL PATH CORRECTION:** CONTEXT.md states `apps/supabase/functions` — this is **wrong**. Edge functions live at `apps/supabase/supabase/functions/` (a doubled `supabase/` directory because the `supabase` CLI's working directory is `apps/supabase/`, and the CLI creates a `supabase/` subdir for migrations + functions). [VERIFIED: `find` returned the correct nested path]

The actual file paths for the 3 edge functions are:
- `apps/supabase/supabase/functions/invite-candidate/index.ts`
- `apps/supabase/supabase/functions/identity-callback/{index,claimConfig,claimConfig.test}.ts`
- `apps/supabase/supabase/functions/send-email/index.ts`

These are confirmed Deno code via `import {createClient} from 'https://esm.sh/...'` (Deno-style URL imports) and `Deno.serve(...)` calls.

**`_deno_shims/` audit findings:**

- Directory does NOT exist on disk (verified `ls _deno_shims` returned exit code 1)
- Zero references to `_deno_shims` outside the Phase 68 planning files (`68-CONTEXT.md`, `68-DISCUSSION-LOG.md`)
- **Conclusion:** Plan 68-03 should simply remove the `_deno_shims` entry from `deno.enablePaths`. There is no directory to delete. The CONTEXT.md "audit `_deno_shims/` directory: keep+document or remove" branch resolves to **the directory does not exist; remove the phantom entry**.

**`deno.json` audit findings:**

- Zero `deno.json` / `deno.jsonc` / `deno.lock` files anywhere in the repo (verified `find ... -name "deno.*"`)
- Edge functions rely on URL imports + Deno globals; no project-level deno config exists
- **Conclusion:** No deno config file work is needed. The IDE relies entirely on `deno.enablePaths` as the scope contract.

### Anti-Patterns to Avoid

- **Adding `import/order`** — would auto-fix-conflict with `simple-import-sort/imports`. CONTEXT.md D-02 explicitly forbids; CLAUDE.md "single source of truth" implies no second ordering rule.
- **Per-workspace ESLint overrides for the new rules** — violates the `packages/shared-config` single-source-of-truth pattern.
- **Custom Vite watcher plugin** — `vite-plugin-restart` exists; reinventing it is gratuitous code.
- **Custom ESLint plugin for `$lib` preference** — `no-restricted-imports` with `patterns.regex` is sufficient.
- **Removing `preserveSymlinks: true`** — D-01 LEVERAGES this; it's load-bearing for Vite picking up `packages/*/dist/` rebuilds.
- **Adding a Turborepo `dev` task with `dependsOn: build`** — the persistent-task constraint forbids this composition (per maier.tech Turborepo + SvelteKit guide).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Watch `.env` and restart Vite | Custom Vite plugin with `chokidar` | `vite-plugin-restart` | Edge cases (debounce, content-vs-mtime, glob expansion) all handled |
| Deep-relative-import detection | Custom AST walker / ESLint rule | `no-restricted-imports` with `patterns.regex` | Built-in; supports per-file-glob scoping |
| Auto-remove unused imports | Custom rule | `eslint-plugin-unused-imports` | Already integrates with `@typescript-eslint`; well-tested |
| Concurrent script orchestration | Bash `wait`/`trap` plumbing | `concurrently` (or shell `&`) | `concurrently` handles SIGINT propagation, output prefixing, exit-code merging |
| Composing turbo watch + dev server | Turborepo `dev` task with deps | Parallel npm scripts | Turborepo persistent-task constraint forbids the depends-on path |

**Key insight:** Every Phase 68 problem has a 1–10 LOC solution using mature off-the-shelf libraries. The temptation to write a custom Vite plugin, ESLint rule, or watcher must be resisted — it would balloon the scope.

## Common Pitfalls

### Pitfall 1: `turbo watch build` doesn't rebuild on first run

**What goes wrong:** First invocation of `turbo watch build --filter='./packages/*'` may NOT immediately build packages — it sometimes waits for the FIRST file change before kicking off the build cycle. Result: Vite starts up against stale `dist/` artifacts.

**Why it happens:** `turbo watch` watches for changes by design. On a clean checkout, `dist/` may not exist yet → Vite import errors.

**How to avoid:** Always `yarn build` once before `yarn dev`. The repo's `dev:start` script (`yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev`) already does this — Phase 68 should preserve this pattern (or document that `yarn dev` needs to be preceded by `yarn build` on a fresh clone).

**Warning signs:** Frontend errors with "Cannot find module '@openvaa/data'" or similar; checking `packages/data/dist/` shows it's empty.

### Pitfall 2: `vite-plugin-restart` debounce vs `.env` editor save behavior

**What goes wrong:** Some editors save `.env` in two writes (truncate + write) — the plugin may fire RESTART twice in quick succession, causing two server reloads.

**Why it happens:** The 500ms default debounce (`delay: 500`) is sometimes too short for editors that do atomic-via-rename saves.

**How to avoid:** Default 500ms is usually sufficient. If observed in practice during Plan 68-01 execution, bump to `delay: 1000`. Don't preemptively raise it.

**Warning signs:** Vite logs "server restarting" twice for a single editor save.

### Pitfall 3: `no-restricted-imports` regex doesn't escape backslashes correctly

**What goes wrong:** `"regex": "^(../){2,}lib"` (without escapes) treats `.` as "any character" — would match `^a/b/{2,}lib` etc.

**Why it happens:** Regex strings in JSON need double-escapes. `\\.\\.` in source = `\.\.` regex literal = literal `..`.

**How to avoid:** Use `'^(\\.\\./){2,}lib(/|$)'` exactly. Test the regex with a known-violating path and a known-OK path before committing.

**Warning signs:** Either zero matches (regex too strict) or matching unrelated imports (regex too loose).

### Pitfall 4: Husky pre-commit hook bypass needed for project-level commits

**What goes wrong:** This repo has `husky` + `lint-staged` pre-commit hook running `prettier --write` + `eslint --fix`. After D-02 lands the new rules, the hook will auto-fix files — but the user's MEMORY.md notes commits need `git -c core.hooksPath=/dev/null` (per project-level workaround in `project_gsd_repo_hook_workaround.md`).

**Why it happens:** Project-specific hook config issue, unrelated to Phase 68 itself.

**How to avoid:** Follow the existing project commit pattern from MEMORY (`git -c core.hooksPath=/dev/null commit ...`) — don't change Phase 68's behavior in response.

### Pitfall 5: Edge functions path is **doubled** (`apps/supabase/supabase/functions/`)

**What goes wrong:** Following CONTEXT.md naively would set `deno.enablePaths: ["apps/supabase/functions"]` — but that path doesn't exist. VSCode Deno extension would silently treat NOTHING as Deno code → red squigglies under the actual edge functions.

**Why it happens:** The Supabase CLI conventionally creates a `supabase/` subdirectory inside its working directory; the workspace `apps/supabase` IS that working directory, so the actual files end up at `apps/supabase/supabase/functions/`.

**How to avoid:** Use `apps/supabase/supabase/functions` exactly. Verify with `ls apps/supabase/supabase/functions/` (returns 3 function dirs).

**Warning signs:** After the change, opening `invite-candidate/index.ts` in VSCode shows TypeScript errors for `Deno.serve` (Deno extension didn't pick up the file).

### Pitfall 6: Paraglide-generated files inflate lint violations

**What goes wrong:** `apps/frontend/src/lib/paraglide/` contains generated locale code. After D-02 enables `unused-imports`, the auto-fix wave might modify generated files → lost on next paraglide regeneration → lint check fails again.

**Why it happens:** `paraglide` regenerates `src/lib/paraglide/` on `prepare` / dev start. Edits to those files are transient.

**How to avoid:** Add `apps/frontend/src/lib/paraglide/**` to the `ignores` array in `eslint.config.mjs`. Verify the paraglide output dir from `vite.config.ts` (`outdir: './src/lib/paraglide'`).

**Warning signs:** First `yarn lint:fix` modifies many files in `src/lib/paraglide/`; next `vite dev` re-overwrites them.

## Code Examples

### Example A: Composed `dev` script (D-01, Option B with concurrently)

```jsonc
// package.json (root) — modified scripts
{
  "scripts": {
    "dev": "yarn supabase:start && yarn _dev:concurrent",
    "_dev:concurrent": "concurrently -n watch,frontend -c blue,green --kill-others-on-fail \"yarn watch:shared\" \"yarn workspace @openvaa/frontend dev\"",
    "watch:shared": "turbo watch build --filter='./packages/*'"
  }
}
```

`--kill-others-on-fail` ensures that if `turbo watch` dies, Vite is also stopped (prevents zombie process states in dev).

### Example B: Full `vite.config.ts` after D-01

```typescript
// apps/frontend/vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import ViteRestart from 'vite-plugin-restart';

export default defineConfig({
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['url', 'cookie', 'baseLocale']
    }) as any,  // existing cast preserved
    sveltekit(),
    ViteRestart({
      restart: ['../../.env']
    })
  ],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    port: Number(process.env.FRONTEND_PORT)
  }
});
```

### Example C: Full ESLint config after D-02

Diff against current `packages/shared-config/eslint.config.mjs`:

```javascript
// packages/shared-config/eslint.config.mjs (additions only)
import unusedImports from 'eslint-plugin-unused-imports';
// ... existing imports ...

export default [
  {
    ignores: [
      // ... existing ignores ...
      '**/src/lib/paraglide/**'  // NEW: prevent fix-then-regenerate churn
    ]
  },
  // ... existing config blocks ...
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
      'unused-imports': unusedImports  // NEW
    },
    // ... existing languageOptions ...
    rules: {
      // ... existing rules ...

      // NEW: replace built-in unused-vars with the autofix-capable variant
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }],

      // NEW: prefer $lib over deep relatives (frontend-scoped via files glob)
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '^(\\.\\./){2,}lib(/|$)',
          message: 'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
        }]
      }]
    }
  }
];
```

### Example D: `.vscode/settings.json` after D-03

```jsonc
// .vscode/settings.json — POST-PHASE-68 (full file)
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#2546a8",
    "titleBar.activeForeground": "#ffffff"
  },
  "workbench.colorTheme": "Dark Modern",
  "deno.enablePaths": ["apps/supabase/supabase/functions"]
}
```

**Diff:** 6 entries → 1 entry. Net: -5 lines.

### Example E: New `apps/frontend/README.md` (D-01, per SC-1)

Suggested skeleton (planner finalizes content):

```markdown
# @openvaa/frontend

SvelteKit 2 frontend for OpenVAA Voting Advice Applications.

## Dev workflow

`yarn dev` (from repo root) starts:
1. Local Supabase (`supabase start`)
2. `turbo watch build --filter='./packages/*'` — rebuilds shared `@openvaa/*` packages on source change
3. `vite dev` — frontend dev server with HMR

When you edit a `@openvaa/*` package source file:
- Turborepo rebuilds that package's `dist/`
- Vite (with `preserveSymlinks: true` in `vite.config.ts`) picks up the new `dist/` via its module graph
- Hot Module Replacement fires — no manual reload

When you edit the root `.env`:
- `vite-plugin-restart` (configured in `vite.config.ts`) detects the change
- Vite server fully restarts (env snapshot must be re-seeded — HMR is insufficient)

If autoreload misbehaves, `yarn dev:reset` does a clean restart of Supabase + dev server.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `yarn dev:reset` after package edits | `turbo watch build` + Vite HMR | Turborepo 2.0 (2024) | No more manual restart on shared package edits |
| Symlinked source via `paths` in tsconfig | `preserveSymlinks: true` + dist/ outputs | Vite 4+ established pattern | Type-safe + runtime-safe; consumed via `dist/` like a published package |
| Per-workspace ESLint configs | Flat config + single re-export | ESLint 9 (2024) | One source of truth; `packages/shared-config/eslint.config.mjs` |
| `eslint-plugin-import` `no-unused-modules` | `eslint-plugin-unused-imports` | 2022+ | The latter has autofix; the former doesn't |
| `import/order` with sort sub-options | `eslint-plugin-simple-import-sort` | 2020+ | Simpler, more deterministic; no per-rule conflicts |

**Deprecated/outdated:**
- The `.eslintrc.*` legacy config style — repo is fully on flat config (`eslint.config.mjs` + `--flag v10_config_lookup_from_file`)
- Custom shell scripts orchestrating watch + dev — Turborepo 2.0+ obsoletes these for monorepo cases

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (unit) | vitest 3.2.4 |
| Framework (E2E + parity) | Playwright 1.58.2 |
| Config file (unit) | `apps/frontend/vitest.config.ts` (workspace), `vitest.config.ts` (per package) |
| Config file (E2E) | `tests/playwright.config.ts` |
| Quick run command | `yarn lint:check` (Phase 68 fast signal — 5–15s) |
| Full suite command | `yarn build && yarn test:unit && yarn lint:check` (per ROADMAP SC-4) |
| Parity gate | `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline.json> <post.json>` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEVTOOLS-01a | Package source edit triggers frontend reload | manual smoke | (no automated test feasible — wall-clock observation) | N/A — manual, see Sampling Rate |
| DEVTOOLS-01b | `.env` edit triggers Vite restart | manual smoke | (manual: edit `.env`, observe Vite log "server restarted") | N/A — manual |
| DEVTOOLS-01c | Mechanism documented | docs presence check | `test -f apps/frontend/README.md && grep -q 'Dev workflow' apps/frontend/README.md` | ❌ — NEW file |
| DEVTOOLS-02a | New rules registered | static check | `yarn lint:check` exits 0 with the new config | ✅ runs against existing tree |
| DEVTOOLS-02b | No unused imports remain | lint pass | `yarn lint:check 2>&1 \| grep -c 'no-unused-imports'` returns 0 | ✅ |
| DEVTOOLS-02c | No deep-relative `$lib` violations | lint pass | `yarn lint:check 2>&1 \| grep -c 'no-restricted-imports'` returns 0 | ✅ |
| DEVTOOLS-03a | `deno.enablePaths` correct | static check | `grep -q '"apps/supabase/supabase/functions"' .vscode/settings.json` | ✅ |
| DEVTOOLS-03b | No deno on non-edge in CI | grep + workflow inspection | `grep -ri "deno" .github/workflows/` returns empty | ✅ — already true |
| DEVTOOLS-03c | No top-level `deno.*` files outside edge | filesystem audit | `find . -name "deno.json" -o -name "deno.jsonc" -o -name "deno.lock" \| grep -v node_modules \| wc -l` returns 0 | ✅ — already true |
| All (cross-cutting) | v2.6 parity gate green | E2E parity | `yarn dev:reset && yarn dev (background) && yarn test:e2e && node diff-parity.mjs <baseline> <post>` | ✅ |

### Sampling Rate

The "Nyquist" framing for Phase 68 is unusual because most signals are **discrete pass/fail** (lint pass, file exists, grep match) rather than time-series. The exception is autoreload latency.

**Per task commit:**
- D-01 / D-02 / D-03 individually: `yarn lint:check` (15s)
- D-01: manual edit-and-observe loop documented in plan execution

**Per wave merge:**
- All three plans land: `yarn build && yarn test:unit && yarn lint:check` (3–5 min)
- D-01 manual smoke: 4 observations (edit a package source; edit `.env`; verify HMR fires < 5s after rebuild; verify full restart < 3s after `.env` save)

**Phase gate:**
- `yarn build && yarn test:unit && yarn lint:check && yarn test:e2e` against the v2.6 parity baseline at HEAD `2c7ad2dea`
- Parity diff: `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline.json> <post.json>`
- Expected verdict: `PARITY GATE: PASS` with `67p/1f/34c` (from Phase 65/66/67 lineage)

**Autoreload-specific sampling rate (D-01 only):**
- **Package source change:** A change to `packages/data/src/something.ts` should trigger Vite HMR within **< 5s** (turbo rebuild + Vite re-import). Below 2s = ideal; above 10s = investigate.
- **`.env` change:** Save → Vite log "server restarted" within **< 2s** (500ms plugin debounce + restart time).
- These thresholds are observation-based, not enforced via automated test. If the planner wants to automate, a Playwright spec could `page.on('framerendered')` after a programmatic file write — but that's gold-plating. **Recommend: manual smoke is sufficient.**

### Wave 0 Gaps

- [ ] `apps/frontend/README.md` — does NOT exist; Plan 68-01 must create it (per SC-1 documentation requirement)
- [ ] `apps/frontend/src/lib/paraglide/**` ignore entry in `eslint.config.mjs` — preventive; not strictly required but avoids fix-vs-regenerate churn (recommended in Pitfall 6)
- [ ] No new test infrastructure required for D-02 / D-03 — existing `yarn lint:check` is the gate

## Risks & Landmines

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `apps/supabase/functions/` mistake propagates from CONTEXT.md to plan/code | HIGH | HIGH (Deno extension scope = nothing → IDE broken for edge devs) | This research explicitly corrects to `apps/supabase/supabase/functions` — planner MUST use this path |
| `_deno_shims` directory expected to exist (per CONTEXT.md "audit") | HIGH | LOW | This research confirms it doesn't exist; Plan 68-03 simply removes the entry |
| `concurrently` introduces deps with breaking changes | LOW | LOW | Pin major; mature library; or use shell `&` (Option A) |
| Paraglide regenerates and re-violates rules | MEDIUM | MEDIUM | Add `**/src/lib/paraglide/**` to ESLint `ignores` |
| `no-restricted-imports` regex too strict / too loose | MEDIUM | LOW | Test against known violating + non-violating paths during plan execution |
| Husky pre-commit hook auto-modifies files at commit time | LOW | LOW | Use existing project workaround (`git -c core.hooksPath=/dev/null`) |
| `turbo watch` doesn't fire on first run (cold dist/) | LOW | MEDIUM | Document that `yarn build` should precede `yarn dev` on first clone (already implicit in `dev:start`) |
| `.env` not actually at `../../.env` from `apps/frontend` | LOW | HIGH | Verified path is correct (root `.env` exists at `voting-advice-application-gsd/.env`) |
| Vite version 6.4.1 incompatible with `vite-plugin-restart@2.0.0` | LOW | MEDIUM | Plugin is Vite-version-agnostic by design; verify during execution; downgrade to `1.x` if issues |
| New ESLint rules surface 100s of violations across packages | LOW | LOW | Auto-fix handles most; expected count is 0–48 violations based on grep |

## Cross-Cutting (D-04 + D-05) — Plan Boundaries & Parallelization

**D-05 plan boundaries (per CONTEXT.md):**

- **Plan 68-01 (autoreload):** Touches `apps/frontend/vite.config.ts`, `apps/frontend/package.json`, root `package.json` (dev script), `apps/frontend/README.md` (NEW). Possibly `turbo.json` (only if a new task is needed — likely not, since `watch:shared` already exists at the script level).
- **Plan 68-02 (ESLint):** Touches `packages/shared-config/eslint.config.mjs`, `packages/shared-config/package.json`, monorepo-wide source files via `yarn lint:fix` (auto-fix wave). Includes D-04 cleanup.
- **Plan 68-03 (Deno):** Touches `.vscode/settings.json` only. ~3 lines of edit.

**Parallelization safety:**
- The three plans touch **disjoint files** (no overlap):
  - 68-01: `apps/frontend/*`, root `package.json`
  - 68-02: `packages/shared-config/*`, monorepo source (auto-fix)
  - 68-03: `.vscode/settings.json`
- **Caveat:** 68-02's auto-fix wave could in principle touch `apps/frontend/vite.config.ts` (the file 68-01 modifies) IF unused-imports flags imports in that file. To be safe: **run 68-01 before 68-02, OR have 68-02 lint:fix run AFTER 68-01's vite.config.ts edits land.**
- 68-03 is fully independent — can run any time, including in parallel with the other two.

**Recommended sequencing:** 68-01 → 68-02 → 68-03 (sequential, simplest for verification cadence). Or 68-03 ‖ 68-01 → 68-02 (parallelize 68-03 with 68-01, then 68-02 alone) for marginal speedup.

**Verification responsibility:** Per CONTEXT.md "planner picks". Recommendation: **fold final verification (`yarn build && yarn test:unit && yarn lint:check` + v2.6 parity gate) into Plan 68-02** — it's the most likely to surface issues (lint cleanup wave is the largest), and it lands last in the recommended sequence.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | ≥22 (per `engine.node`) | — |
| Yarn 4.13 | Build/install | ✓ | 4.13.0 (per `packageManager`) | — |
| Turborepo | D-01 | ✓ | 2.8.17 | — (already wired) |
| Vite | D-01 | ✓ | 6.4.1 | — (already wired) |
| ESLint | D-02 | ✓ | 9.39.2 | — (catalog) |
| Supabase CLI | E2E | ✓ | 2.78.1 (catalog) | — |
| Playwright | Parity gate | ✓ | 1.58.2 | — |
| `vite-plugin-restart` | D-01 | ✗ | — | NEW dep — `yarn workspace @openvaa/frontend add -D vite-plugin-restart@^2.0.0` |
| `eslint-plugin-unused-imports` | D-02 | ✗ | — | NEW dep — `yarn workspace @openvaa/shared-config add eslint-plugin-unused-imports@^4.4.1` |
| `concurrently` (Option B) | D-01 | ✗ | — | OPTIONAL — `yarn add -D concurrently` at root, or use shell `&` instead |
| Deno runtime | D-03 verify (none) | N/A | — | NOT REQUIRED — Phase 68 only edits IDE config; no Deno execution needed |

**Missing dependencies, no fallback:** None.
**Missing dependencies, with fallback:** All 3 new deps install via standard Yarn workspace add commands.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vite-plugin-restart@2.0.0` works with Vite 6.4.1 (plugin is Vite-version-agnostic) | D-01 Pattern 2 | Low — if breaking, downgrade to 1.x; npm view shows 4-month-old publish covers Vite 6 |
| A2 | `eslint-plugin-unused-imports@4.4.1` composes cleanly with `simple-import-sort` via ESLint multi-pass fix loop | D-02 Pattern 4 | Low — both plugins are widely used together; ESLint's fixer guarantees fixed-point |
| A3 | The 23 deep `(\.\./){3,}` imports in `apps/frontend/src/` are intra-routes/intra-feature (NOT lib-targeting) so the `$lib`-preference rule will produce 0 violations | D-02 expected blast radius | Low — verified via grep that 0 paths match `(\.\./){2,}lib`; if execution surfaces violations, planner adds them to the cleanup wave |
| A4 | The `apps/frontend/src/lib/paraglide/` directory is the only generated-output sub-tree under `src/` that needs ESLint-ignoring | Pitfall 6 | Medium — if other generated dirs exist (e.g. SvelteKit's `.svelte-kit/`), they're already in the existing `**/dist`, `**/build` ignores |

**Verified (NOT assumed):** All filesystem audits, grep counts, version checks, CI workflow scans, and path corrections. The above 4 are the only `[ASSUMED]` items in this research.

## Open Questions

> CONTEXT.md decisions D-01..D-05 are LOCKED — none of these questions challenge those decisions. They are NEW questions surfaced during research.

1. **Path correction for `deno.enablePaths`** — CONTEXT.md says `apps/supabase/functions`; actual path is `apps/supabase/supabase/functions`. The planner MUST use the correct path; the user should be informed during plan-checker review since CONTEXT.md is incorrect on this detail. Not a blocker — just noting that the locked decision references a wrong path. **Recommendation:** Plan 68-03 uses the correct path `apps/supabase/supabase/functions` and notes the correction in the plan body so it surfaces in PR review.

2. **Plan 68-01 orchestration: shell `&` (Option A) vs `concurrently` (Option B)** — both are valid per D-01's "Claude's discretion". Recommendation in this research is Option B for output prefixing/SIGINT propagation. **Defer to planner.**

3. **Should Plan 68-01 also touch `turbo.json`?** — `watch:shared` already exists as a root script invoking `turbo watch build`. Adding a Turborepo `dev` task with `persistent: true` would standardize but isn't required. **Recommendation: skip; current pattern already works.** Defer to planner.

4. **README location for D-01 docs** — CONTEXT.md offers `apps/frontend/README.md` (suggested) or root `README.md` as acceptable. Root README is currently a marketing/docs link page, not dev-workflow oriented. **Recommendation: create `apps/frontend/README.md`.** Aligns with the D-01 "documented in the relevant README" success criterion.

5. **Verification plan placement** — D-05 says "planner picks: fold into Plan 68-02 or separate Plan 68-04". **Recommendation: fold into Plan 68-02** (it's the largest-blast-radius plan; verification fits naturally at its end). 3 plans total, no Plan 68-04.

6. **Should `concurrently` be added at root or as a `@openvaa/frontend` dep?** — semantically a root-level orchestration tool. **Recommendation: root `package.json` devDependencies.**

## Sources

### Primary (HIGH confidence)
- `apps/frontend/vite.config.ts`, `apps/frontend/package.json`, `package.json`, `turbo.json`, `packages/shared-config/eslint.config.mjs`, `.vscode/settings.json`, `.yarnrc.yml`, `.husky/pre-commit`, `.lintstagedrc.json`, `.github/workflows/main.yaml` — repo state at HEAD `2c7ad2dea`+
- `npm view vite-plugin-restart version` → 2.0.0 (verified 2026-05-08)
- `npm view eslint-plugin-unused-imports version` → 4.4.1 (verified 2026-05-08)
- `npm view turbo version` → 2.9.10 (verified 2026-05-08)
- [vite-plugin-restart README (antfu/vite-plugin-restart)](https://github.com/antfu/vite-plugin-restart/blob/main/README.md) — fetched 2026-05-08
- [eslint-plugin-unused-imports docs (sweepline/eslint-plugin-unused-imports)](https://github.com/sweepline/eslint-plugin-unused-imports) — fetched 2026-05-08
- [Turborepo `watch` reference](https://turborepo.dev/docs/reference/watch) — fetched 2026-05-08
- [ESLint `no-restricted-imports` rule](https://eslint.org/docs/latest/rules/no-restricted-imports) — fetched 2026-05-08

### Secondary (MEDIUM confidence)
- [Configuring Turborepo for a SvelteKit monorepo (maier.tech)](https://maier.tech/posts/configuring-turborepo-for-a-sveltekit-monorepo) — explains the persistent-task constraint in detail; informed the Pattern 1 design
- [npmjs.com/package/vite-plugin-restart](https://www.npmjs.com/package/vite-plugin-restart) — version + maintenance signal
- [Vite docs (vite.dev)](https://vite.dev/) — `preserveSymlinks`, `server.fs.allow` semantics

### Tertiary (LOW confidence)
- WebSearch results general claims about ESLint flat-config monorepo patterns — cross-verified against eslint.org docs above

## Metadata

**Confidence breakdown:**
- D-01 autoreload: HIGH — patterns verified against multiple authoritative sources; existing `watch:shared` script already proves the turbo half works
- D-02 ESLint: HIGH — flat-config pattern verified against plugin README + eslint.org; expected blast radius verified by grep
- D-03 Deno: HIGH — filesystem-verified no `_deno_shims/`, no `deno.*` files, no CI Deno; CRITICAL correction surfaced (path is doubled `supabase/supabase/`)
- Validation: HIGH — uses existing v2.6 parity gate script; sampling rate is observation-based by design

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 days; tooling versions stable)

## RESEARCH COMPLETE
