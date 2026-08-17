# Phase 68: Dev-Tooling Trio - Pattern Map

**Mapped:** 2026-05-08
**Files analyzed:** 9 (8 modify, 1 create)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/vite.config.ts` (MODIFY) | build-tool config | plugin chain | self (existing plugin chain in same file) | exact (same file, sibling plugins) |
| `apps/frontend/package.json` (MODIFY) | package manifest | dependency add | self (existing `devDependencies` block) | exact (same file) |
| `package.json` (root, MODIFY) | monorepo orchestration | npm-scripts dev pipeline | self (existing `dev` + `watch:shared` scripts) | exact (same file) |
| `apps/frontend/README.md` (CREATE) | docs | informational | `apps/docs/README.md` | role-match (sibling app README) |
| `turbo.json` (POSSIBLY MODIFY — likely no-op) | monorepo orchestration | task pipeline definition | self (existing `tasks.build` / `tasks.lint`) | exact (same file) |
| `packages/shared-config/eslint.config.mjs` (MODIFY) | lint config | flat-config plugin+rule add | self (existing `simple-import-sort` plugin block at lines 39-43, rule additions at 127-156) | exact (same file, sibling plugins) |
| `packages/shared-config/package.json` (MODIFY) | package manifest | dependency add | self (existing `dependencies` block) | exact (same file) |
| `.vscode/settings.json` (MODIFY) | IDE config | path-list replacement | self (existing `deno.enablePaths` array) | exact (same file) |
| (monorepo source — auto-fix wave) | source files | bulk auto-fix | N/A — `yarn lint:fix` mechanical | tooling-driven |

---

## Pattern Assignments

### `apps/frontend/vite.config.ts` (build-tool config, plugin chain)

**Analog:** SAME FILE — extend existing plugin array.

**Current full file** (lines 1-23):
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['url', 'cookie', 'baseLocale']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
    sveltekit()
  ],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    port: Number(process.env.FRONTEND_PORT)
  }
});
```

**Imports pattern to mirror** (lines 1-4): default-export-style imports, alphabetized by `simple-import-sort`. Add the new import in the alphabetic position:
```typescript
import ViteRestart from 'vite-plugin-restart';
```
(goes after `tailwindcss` import, before or after `defineConfig` per `simple-import-sort` ordering — sort runs on `lint:fix` so position is auto-correct).

**Plugin-registration pattern** (lines 7-16):
- Plugins are appended to the `plugins` array as direct invocations (`tailwindcss()`, `sveltekit()`).
- Plugin with options: invoke with single object literal (see `paraglideVitePlugin({...})`).
- The `as any` cast is a one-off for `paraglideVitePlugin` (typing issue); **do NOT add `as any` to `ViteRestart(...)`** — it has correct types per its DTS shipped in v2.0.0.

**Insertion target for D-01** (after `sveltekit()`, line 15):
```typescript
sveltekit(),
ViteRestart({
  restart: ['../../.env']
})
```

**Risk callouts:**
- **Plugin order matters for some plugins** but `vite-plugin-restart` is order-insensitive (it only watches files, doesn't transform). Append at end of array.
- **`preserveSymlinks: true` (line 18) is load-bearing** for D-01's HMR-from-`dist/` semantics. Do NOT remove or modify.
- **`as any` cast is per-plugin** — keep the existing inline `eslint-disable-next-line` comment exactly as-is on `paraglideVitePlugin`. New ESLint rules from Plan 68-02 might re-format the surrounding lines; verify the disable-comment still applies after auto-fix.

---

### `apps/frontend/package.json` (package manifest, dependency add)

**Analog:** SAME FILE — extend `devDependencies` block (lines 19-50).

**Existing devDependencies pattern** (lines 19-50):
```json
"devDependencies": {
  "@eslint/eslintrc": "catalog:",
  ...
  "vite": "^6.4.1",
  "vitest": "catalog:"
}
```

**Conventions observed:**
- Workspace-internal deps use `"workspace:^"` (e.g., `"@openvaa/shared-config": "workspace:^"`).
- Cross-package shared deps use `"catalog:"` (e.g., `"eslint": "catalog:"`, `"vite": "catalog:"` — wait, `vite` uses `^6.4.1` directly here, NOT catalog; this is an exception for an app-only dep).
- New external deps use direct semver (e.g., `"vite": "^6.4.1"`, `"@sveltejs/adapter-node": "^5.5.4"`).

**Insertion target for D-01:**
```json
"vite": "^6.4.1",
"vite-plugin-restart": "^2.0.0",
"vitest": "catalog:"
```
(alphabetic order — `vite-plugin-restart` sorts after `vite`, before `vitest`).

**Risk callouts:**
- **Use `yarn workspace @openvaa/frontend add -D vite-plugin-restart@^2.0.0`** to update both `package.json` AND `yarn.lock` correctly. Don't hand-edit `package.json` alone.
- This is a `devDependency`, not a runtime `dependency` (lines 57-76 are runtime; new entry goes in `devDependencies` at lines 19-50).

---

### `package.json` (root, monorepo orchestration)

**Analog:** SAME FILE — modify `scripts` block (lines 3-38).

**Existing dev-script pattern** (lines 7-9):
```json
"watch:shared": "turbo watch build --filter='./packages/*'",
"dev": "yarn supabase:start && yarn workspace @openvaa/frontend dev",
"dev:start": "yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev",
```

**Conventions observed:**
- Sequential composition: `&&` between steps.
- Workspace-targeted commands: `yarn workspace @openvaa/<name> <script>`.
- The `watch:shared` script ALREADY EXISTS (line 7) — D-01 leverages, doesn't recreate.

**Modification target for D-01 (Option B with concurrently — RESEARCH recommended):**
```json
"watch:shared": "turbo watch build --filter='./packages/*'",
"_dev:concurrent": "concurrently -n watch,frontend -c blue,green --kill-others-on-fail \"yarn watch:shared\" \"yarn workspace @openvaa/frontend dev\"",
"dev": "yarn supabase:start && yarn _dev:concurrent",
```

**Modification target for D-01 (Option A with shell `&` — zero new deps):**
```json
"dev": "yarn supabase:start && (yarn watch:shared & yarn workspace @openvaa/frontend dev)",
```

**Add concurrently to root `devDependencies`** (lines 39-64) IF Option B chosen:
```json
"concurrently": "^9.0.0",
```
(alphabetic order — sorts after `cheerio`, before `dotenv`).

**Risk callouts:**
- **`dev:start` (line 9) preserves the build-first cold-start path** — do NOT modify it; it's the documented escape hatch from Pitfall 1 (cold `dist/`).
- **Husky pre-commit hook will fire on commits to `package.json`.** Per MEMORY note (`project_gsd_repo_hook_workaround.md`), commits in this repo MUST use `git -c core.hooksPath=/dev/null commit ...` until the global config is fixed.
- **`yarn supabase:start` (line 32) is the existing supabase start script** — it MUST run before the parallel processes; lock-step preserves the existing user contract.

---

### `apps/frontend/README.md` (NEW FILE, docs)

**Analog:** `apps/docs/README.md` (sibling app-level README).

**Closest analog header pattern** (`apps/docs/README.md` lines 1-5):
```markdown
# OpenVAA Documentation Site

This directory contains the OpenVAA documentation website, which combines auto-generated API documentation with hand-written guides.

## Overview
```

**Closest analog dev-workflow section pattern** (`apps/docs/README.md` lines 60-72):
```markdown
## Development

### Local Development

\`\`\`bash
# Generate documentation from source
yarn generate:docs

# Start the docs site
yarn dev
\`\`\`

The site will be available at http://localhost:5173
```

**Alternative analog with richer dev-workflow** (`packages/dev-seed/README.md` lines 1-22):
```markdown
# @openvaa/dev-seed

Template-driven dev data generator for OpenVAA local development.

[paragraph describing the package]

## Quick Start

\`\`\`bash
# From repo root
yarn dev:reset-with-data        # supabase db reset + default template
\`\`\`

[paragraph explaining what the command composes]
```

**Conventions observed:**
- H1 = package name (`# @openvaa/<name>`) OR plain-language title (`# OpenVAA Documentation Site`).
- Brief 1-2 sentence overview paragraph.
- `## Quick Start` or `## Development` as first major section.
- Code fences use ` ```bash ` for shell snippets.
- Cross-references to root `package.json` scripts (`yarn dev`, `yarn dev:reset`).

**Skeleton for the new file** (per RESEARCH Example E + the analog patterns above):
```markdown
# @openvaa/frontend

SvelteKit 2 frontend for OpenVAA Voting Advice Applications.

## Dev workflow

`yarn dev` (from repo root) starts:
1. Local Supabase (`yarn supabase:start`)
2. `turbo watch build --filter='./packages/*'` — rebuilds shared `@openvaa/*` packages on source change
3. `vite dev` — frontend dev server with HMR

[autoreload mechanics paragraph — see RESEARCH §Code Examples Example E]
```

**Risk callouts:**
- **Per CLAUDE.md guidance**: "NEVER create documentation files (\*.md) or README files unless explicitly requested by the User." — D-01 IS explicitly requested (CONTEXT SC-1 documentation requirement); this file is sanctioned.
- **Match the package-name H1 convention** (`# @openvaa/frontend`) used by `packages/dev-seed/README.md`, `packages/data/README.md`, `packages/core/README.md` — most consistent for an `apps/<name>` analog.

---

### `turbo.json` (monorepo orchestration, task pipeline)

**Analog:** SAME FILE — extend `tasks` block (lines 3-23).

**Existing task definition pattern** (lines 4-7):
```json
"build": {
  "dependsOn": ["^build"],
  "outputs": ["build/**", "dist/**"],
  "inputs": ["src/**", "tsconfig.json", "tsconfig.*.json", "tsup.config.ts", "package.json"]
}
```

**Conventions observed:**
- Each task is a top-level key in `tasks`.
- `dependsOn` array uses `"^<task>"` (caret) for upstream-package dependency, plain `<task>` for same-package dep.
- `outputs` lists glob patterns.
- `inputs` lists glob patterns + specific filenames.

**Recommendation for Plan 68-01 (per RESEARCH §Open Question 3):** **DO NOT modify `turbo.json`.** The existing `watch:shared` script in root `package.json` line 7 already invokes `turbo watch build --filter='./packages/*'` — no Turborepo task definition change is required. Skip this file.

**If a planner DOES decide to add a `dev` task** (NOT recommended; Turborepo persistent-task constraint forbids the depends-on path per RESEARCH §Pattern 1), the precedent for persistent tasks in Turborepo 2.x is `"persistent": true` — but no existing task in this repo uses it, so there is no analog. Skip.

**Risk callouts:**
- **No-op recommendation** — modifying `turbo.json` adds risk for zero benefit. The script-layer composition in root `package.json` is sufficient.

---

### `packages/shared-config/eslint.config.mjs` (lint config)

**Analog:** SAME FILE — extend the plugin/rule blocks at lines 38-158.

**Existing plugin-registration pattern** (lines 39-43):
```javascript
plugins: {
  '@typescript-eslint': typescriptEslint,
  'simple-import-sort': simpleImportSort, // https://github.com/lydell/eslint-plugin-simple-import-sort?tab=readme-ov-file
  import: importPlugin
},
```

**Existing import-statement pattern** (lines 1-9):
```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
```

**Existing ignores pattern** (lines 21-35):
```javascript
ignores: [
  '**/.DS_Store',
  '**/node_modules',
  '**/build',
  '**/dist',
  ...
  '**/*.yaml'
]
```

**Existing rule pattern (multi-option rules)** (lines 118-125, `consistent-type-imports`):
```javascript
'@typescript-eslint/consistent-type-imports': [
  'error',
  {
    disallowTypeAnnotations: true,
    fixStyle: 'separate-type-imports',
    prefer: 'type-imports'
  }
],
```

**Modification targets for D-02:**

1. **Add import** (alphabetic position after line 8 `simpleImportSort`):
```javascript
import unusedImports from 'eslint-plugin-unused-imports';
```

2. **Add plugin entry** (after line 42 `import: importPlugin`):
```javascript
'unused-imports': unusedImports
```

3. **Add `paraglide` ignore** (after line 33 `'**/$types.d.ts'`):
```javascript
'**/src/lib/paraglide/**',
```

4. **Replace `@typescript-eslint/no-unused-vars` (currently absent — covered by `recommended` extend) with the plugin's autofix variant** (add to rules block, e.g. after line 100 `no-explicit-any`):
```javascript
'@typescript-eslint/no-unused-vars': 'off',
'unused-imports/no-unused-imports': 'error',
'unused-imports/no-unused-vars': ['warn', {
  vars: 'all',
  varsIgnorePattern: '^_',
  args: 'after-used',
  argsIgnorePattern: '^_'
}],
```

5. **Add `no-restricted-imports`** (anywhere in rules block; pattern uses `regex` per RESEARCH §Pattern 3):
```javascript
'no-restricted-imports': ['error', {
  patterns: [{
    regex: '^(\\.\\./){2,}lib(/|$)',
    message: 'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
  }]
}]
```

**Risk callouts:**
- **Paraglide ignore is mandatory** (Pitfall 6): without `'**/src/lib/paraglide/**'` in `ignores`, the `lint:fix` wave modifies generated files that get re-overwritten on next paraglide regeneration → CI lint check fails on next dev cycle.
- **Plugin order in the `plugins` block** does not affect fixer order; ESLint runs fixers in multi-pass loop until fixed-point (RESEARCH §Pattern 4). `simple-import-sort` and `unused-imports` compose correctly regardless of declaration order.
- **Regex must be DOUBLE-ESCAPED** in JSON-style flat-config (Pitfall 3): `'^(\\.\\./){2,}lib(/|$)'` — `\\.` becomes `\.` in the actual regex, matching literal `.`. A single `\.` in source would be invalid escape.
- **`@typescript-eslint/no-unused-vars` 'off'** is REQUIRED before `unused-imports/no-unused-vars` to avoid duplicate reports (the plugin's docs explicitly require this step).
- **Frontend-only scoping for `no-restricted-imports`** — RESEARCH §Pattern 3 notes the rule could be scoped via `files: ['**/apps/frontend/src/**/*.{ts,svelte}']` to avoid false positives in `packages/`. Planner picks: scoped block vs global. Globally scoped is simpler; verified blast radius is 0 violations in current tree (RESEARCH Assumption A3).

---

### `packages/shared-config/package.json` (package manifest, dependency add)

**Analog:** SAME FILE — extend `dependencies` block (lines 8-19).

**Existing dependencies pattern** (lines 8-19):
```json
"dependencies": {
  "@eslint/eslintrc": "catalog:",
  "@eslint/js": "catalog:",
  "@typescript-eslint/eslint-plugin": "catalog:",
  ...
  "eslint-plugin-import": "catalog:",
  "eslint-plugin-simple-import-sort": "catalog:",
  ...
  "typescript": "catalog:"
}
```

**Conventions observed:**
- All ESLint-related deps use `"catalog:"` versioning (centralized via `.yarnrc.yml` catalog).
- Note: `shared-config` puts ESLint plugins in `dependencies`, NOT `devDependencies` (so consumers like `@openvaa/frontend` resolve them when they extend the shared config).

**Insertion target for D-02:**
```json
"eslint-plugin-import": "catalog:",
"eslint-plugin-simple-import-sort": "catalog:",
"eslint-plugin-unused-imports": "^4.4.1",
```

**Risk callouts:**
- **Use `dependencies`, not `devDependencies`** — see precedent: `eslint-plugin-import` and `eslint-plugin-simple-import-sort` are both in `dependencies`, mirroring this shape is required for downstream workspace consumers.
- **Catalog vs direct semver** — RESEARCH suggests `^4.4.1` direct (since this is a new addition not yet in catalog). If the planner wants to add it to the catalog (`.yarnrc.yml`) first, that's an alternative; consult catalog conventions in `.yarnrc.yml`. Direct semver is the simpler path.
- **Install via**: `yarn workspace @openvaa/shared-config add eslint-plugin-unused-imports@^4.4.1` (per RESEARCH §Standard Stack).

---

### `.vscode/settings.json` (IDE config, path-list replacement)

**Analog:** SAME FILE — modify `deno.enablePaths` array (lines 7-14).

**Current full file** (lines 1-16):
```jsonc
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#2546a8",
    "titleBar.activeForeground": "#ffffff"
  },
  "workbench.colorTheme": "Dark Modern",
  "deno.enablePaths": [
    "packages/core",
    "packages/matching",
    "packages/data",
    "packages/filters",
    "packages/app-shared",
    "_deno_shims"
  ]
}
```

**Target state for D-03** (per RESEARCH §Pattern 5 — CRITICAL path correction):
```jsonc
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#2546a8",
    "titleBar.activeForeground": "#ffffff"
  },
  "workbench.colorTheme": "Dark Modern",
  "deno.enablePaths": ["apps/supabase/supabase/functions"]
}
```

**Diff:** lines 7-14 (8 lines, 6 array entries) → 1 line, 1 array entry. Net `-7` lines.

**Risk callouts:**
- **CRITICAL CORRECTION:** CONTEXT.md D-03 says `apps/supabase/functions`. RESEARCH verified the correct path is **`apps/supabase/supabase/functions`** (nested doubled `supabase/` due to Supabase CLI working-dir convention). The plan body MUST note this correction so it surfaces during PR review (per RESEARCH §Open Question 1).
- **Verified on disk** (this pattern-mapping pass): `ls apps/supabase/supabase/functions/` returns 3 dirs (`identity-callback`, `invite-candidate`, `send-email`). `ls _deno_shims` returns "No such file or directory" — phantom path confirmed.
- **No `_deno_shims/` directory exists**, so the audit branch in CONTEXT.md "keep + document or remove" resolves trivially: the entry simply gets removed from the array. No directory deletion needed.
- **No `deno.json` files exist anywhere in repo** (RESEARCH verified) — Plan 68-03 is purely an IDE-config-level change. No CI Deno step exists; no follow-up.

---

### Monorepo source files (auto-fix wave, D-04)

**Analog:** N/A — `yarn lint:fix` mechanically edits files based on the new rules. No per-file pattern to mirror.

**Expected blast radius (per RESEARCH):**
- `unused-imports/no-unused-imports`: **0–48 files** auto-fixed (based on grep estimate). No manual intervention typically needed.
- `no-restricted-imports` (`$lib`-preference): **likely 0 violations** based on RESEARCH grep against current tree (no paths match `^(\.\./){2,}lib`). If violations surface during execution, planner adds them to the cleanup wave manually (replace with `$lib/...` aliased imports).

**Risk callouts:**
- **Run `yarn lint:fix` AFTER Plan 68-01 lands** (per RESEARCH §Cross-Cutting): Plan 68-01 modifies `apps/frontend/vite.config.ts`, which `unused-imports` could potentially affect. Sequencing protects against cross-plan write conflicts.
- **Husky/lint-staged hook** (`.husky/pre-commit` per RESEARCH) will trigger on commits — use `git -c core.hooksPath=/dev/null` per project workaround in MEMORY.

---

## Shared Patterns

### Catalog versioning convention
**Source:** Multiple (`packages/shared-config/package.json`, `apps/frontend/package.json`, root `package.json`)
**Apply to:** Both Plan 68-01 (`vite-plugin-restart`) and Plan 68-02 (`eslint-plugin-unused-imports`) dep additions

```json
"eslint": "catalog:",
"prettier": "catalog:",
"vite": "^6.4.1",       // direct semver for app-only / not-yet-cataloged deps
"vitest": "catalog:"
```

**Convention:** Cross-repo ESLint/test/build deps go in `.yarnrc.yml` catalog; new app-or-package-specific external deps use direct `^semver`. New deps in Phase 68 use direct semver to avoid catalog churn (no precedent for cataloging Phase 68's two new plugins).

---

### Workspace-targeted yarn commands
**Source:** Root `package.json` lines 8, 32, 36 (`dev`, `supabase:start`, `supabase:types`)
**Apply to:** All install commands across plans

```bash
yarn workspace @openvaa/frontend add -D vite-plugin-restart@^2.0.0
yarn workspace @openvaa/shared-config add eslint-plugin-unused-imports@^4.4.1
yarn add -D concurrently@^9.0.0   # ROOT add (no workspace prefix)
```

**Convention:** Workspace-scoped deps use `yarn workspace <name> add`; root-orchestration deps use `yarn add` without `workspace`.

---

### Husky hook bypass for project commits
**Source:** MEMORY `project_gsd_repo_hook_workaround.md` (user-level note); `.husky/pre-commit` (per RESEARCH)
**Apply to:** All commits during Phase 68 execution

```bash
git -c core.hooksPath=/dev/null commit -m "..."
```

**Convention:** This repo has a project-level pre-commit hook config issue. ALL commits in `voting-advice-application-gsd` MUST bypass hooks via `core.hooksPath=/dev/null` until the global config is fixed. This applies regardless of Phase 68 changes.

---

### Single-source-of-truth ESLint inheritance
**Source:** Root `eslint.config.mjs` (1-line re-export per RESEARCH §Code Insights)
**Apply to:** Plan 68-02 (DO NOT add per-workspace overrides)

The root and per-workspace `eslint.config.mjs` files are 1-line re-exports of `@openvaa/shared-config/eslint`. New rules from D-02 land in `packages/shared-config/eslint.config.mjs` only — no per-workspace override files.

**Convention** (per RESEARCH §Anti-Patterns): violating this principle (per-workspace overrides) is explicitly forbidden.

---

## No Analog Found

None — every Phase 68 file modification or creation has an existing in-tree analog (either the same file's sibling sections, an adjacent file, or a structurally identical README in the repo).

## Metadata

**Analog search scope:**
- `apps/frontend/` (Vite config, package.json, README candidates)
- `apps/docs/`, `packages/dev-seed/`, `packages/data/`, `packages/core/` (README structure analogs)
- `packages/shared-config/` (ESLint config + package.json)
- `apps/supabase/supabase/functions/` (Deno target verification)
- Root: `package.json`, `turbo.json`, `.vscode/settings.json`, `eslint.config.mjs`

**Files scanned:** 9 source files + 6 README analogs + 1 filesystem audit (`_deno_shims/` confirmed absent; `apps/supabase/supabase/functions/` confirmed present with 3 edge functions)

**Pattern extraction date:** 2026-05-08

**Critical surfaced correction:** RESEARCH §Pattern 5 (and Open Question 1) flags that CONTEXT.md D-03 references the wrong Deno path (`apps/supabase/functions`); correct path is `apps/supabase/supabase/functions`. Planner MUST use the corrected path; this is repeated in the `.vscode/settings.json` row of "Pattern Assignments" above.
