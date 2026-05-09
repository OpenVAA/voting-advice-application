# Phase 72: Package Hygiene Trio - Research

**Researched:** 2026-05-09
**Domain:** Monorepo package paradigm normalisation, frontend re-export shim retirement, npm-script disambiguation
**Confidence:** HIGH (everything verified by direct codebase inspection at HEAD `94a5934cf`)

## Summary

Phase 72 lands three independent package-level diffs in parallel — same structural model as v2.7 Phase 68 dev-tooling trio. All three plans operate on small, well-bounded scopes:

- **Plan-72-01 (SHARED-01)**: `@openvaa/app-shared` is structurally close to canonical (same `tsup` build, same `eslint v10_config_lookup_from_file` lint script, same `tsconfig.base.json` extension), but diverges in 4 visible ways: (1) inconsistent `.js` extensions on TS-internal imports — 16 hits in app-shared vs 0 hits across `core`/`data`/`matching`/`filters`; (2) `package.json` lacks the publish-readiness fields the four canonical packages share (`description`, `license`, `repository`, `homepage`, `bugs`, `files`, `publishConfig`); (3) stale `tsconfig.tsbuildinfo` tracked at the package root from the strapi era (200-byte JSON pointing at `node_modules/@strapi/admin/...`); (4) stale README rationale referencing `@openvaa/strapi` (retired) as the CJS consumer. Sub-barrel divergence is NOT a violation — `core` is flat (no sub-barrels), `matching`/`filters` use sub-barrels, `data` uses an `internal.ts` re-export pattern. Per D-04 (`@openvaa/core` is tiebreaker), keep app-shared's barrel structure as is — flat `index.ts` matches `core`'s style.

- **Plan-72-02 (SHARED-02)**: Trivial — only **3 import sites** of `$lib/utils/merge` exist (all in `apps/frontend/src/lib/contexts/layout/`), and **only one** re-export shim in `apps/frontend/src/lib/utils/` (the `merge.ts` file itself; no other shape-equivalent shims). Rewrite 3 import paths, delete 1 file.

- **Plan-72-03 (LINT-01)**: The supabase workspace's current `lint` script runs `supabase db lint --schema public --fail-on warning` (SQL only), which Turborepo's `^lint` task chain pulls into `yarn lint:check`. Renaming it to `lint:sql` removes SQL from the JS lint pipeline cleanly. **No CI workflow file references `yarn supabase:lint`** — the only call sites are root `package.json` (1 line), `CLAUDE.md` (1 line), and the supabase workspace's own `lint:all` self-reference (1 line). Turborepo task semantics: `turbo run lint` only invokes the script if the workspace defines it, so renaming naturally drops supabase from the chain — no `turbo.json` task edit needed.

**Primary recommendation:** All three plans are surgical. Land them as three separate-but-parallel diffs. Phase verification gate: `yarn build && yarn test:unit && yarn lint:check`, then `yarn supabase:lint:sql` runs SQL linter against migrations independently, then the v2.7-close Playwright parity gate (`67p/1f/34c` baseline at HEAD `2c7ad2dea`).

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Three parallelizable plans, one per requirement.** Plan-72-01 (SHARED-01), Plan-72-02 (SHARED-02), Plan-72-03 (LINT-01). Independent diffs; same model as v2.7 Phase 68 dev-tooling trio. Phase verification gate consolidates at close.
- **D-02: Hard rename for the supabase lint script — no deprecated alias.** `yarn supabase:lint` stops working; replaced by `yarn supabase:lint:sql` (or planner's equivalent SQL-specific name). All callers updated atomically in Plan-72-03's diff.
- **D-03: Both CLAUDE.md (short anchor) + `packages/README.md` (detailed paradigm doc) — UNLESS CLAUDE.md is bloating.** Bloat-judgment escape hatch: if the planner finds CLAUDE.md is at risk of bloating, may opt to put the anchor ONLY in `packages/README.md`.
- **D-04: 4-package canonical = `@openvaa/core` + `data` + `matching` + `filters`.** Where the four diverge slightly, `@openvaa/core` is the tiebreaker (lowest in dep graph).
- **D-05: Match the monorepo's TS+ESM convention; verify by grep across the four canonical packages.** Whatever the four packages do, app-shared adopts.
- **D-06: Brief doc-comment justifying the dual ESM+CJS build.** Single sentence in either README or `package.json` `description`. Planner picks based on visibility.
- **D-07: Inventory `apps/frontend/src/lib/utils/` for shape-equivalent shims; retire OR todo.** Plan-72-02's first step.

### Claude's Discretion

- Final SQL-script name (`lint:sql` vs `lint:db` vs `db:lint`) — planner picks per monorepo convention.
- Whether the dual-build justification lives in README or `package.json` description.
- Whether the canonical paradigm doc at `packages/README.md` includes a code-snippet template (e.g., minimum-viable `package.json` + `tsconfig.json` for a new package) or stays prose-only.
- Whether to anchor the "no new re-export shims" rule via lint-config (probably not — too costly), via CLAUDE.md note (maybe), or via convention only (default).
- CLAUDE.md vs packages/README.md only decision (per the bloat-judgment escape hatch).

### Deferred Ideas (OUT OF SCOPE)

- The 4 pre-existing SQL `warning extra` entries from Supabase migrations (Phase 68 deferred-tech-debt §3): `is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables` × 2.
- Lint enforcement against future re-export shims — convention via CLAUDE.md note or PR-review attention is the gate.
- Restructuring `@openvaa/app-shared`'s API surface — paradigm normalisation only.
- Dropping the dual ESM+CJS build — explicitly preserved.
- npm publishing / version bumps — paradigm changes are internal-only.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHARED-01 | `@openvaa/app-shared` normalised to match the import / barrel / build paradigm of `@openvaa/core` / `data` / `matching` / `filters`; dual ESM+CJS preserved with explicit justification; canonical paradigm anchor lands at the agreed location | §"App-shared Divergence Audit" (4 concrete deltas with file:line evidence); §"Dual ESM+CJS Mechanics" (verified consumer = `@openvaa/dev-seed` only — Edge Functions do NOT consume); §"Anchor Doc Placement" (CLAUDE.md is 359 lines; `packages/README.md` does not exist) |
| SHARED-02 | `apps/frontend/src/lib/utils/merge.ts` shim deleted; all consumers in `apps/frontend/src/lib/**` and `tests/**` import directly from `@openvaa/app-shared`; `git grep` returns zero matches; no other shape-equivalent shims discovered (or follow-up todo) | §"`mergeSettings` Consumer Inventory" (3 import sites, all in `apps/frontend/src/lib/contexts/layout/`); §"Other Shim Audit" (zero other re-export shims in `apps/frontend/src/lib/utils/`) |
| LINT-01 | `@openvaa/supabase` lint script renamed to a SQL-specific name; root `package.json`, `turbo.json`, `CLAUDE.md`, README, CI workflows updated; `yarn lint:check` no longer invokes SQL linter | §"Supabase Lint Script Wiring" (3 active call sites — no CI references; `turbo.json` needs no edit); §"Supabase TS Files" (only `vitest.config.ts` + scripts/* — no JS lint script needed) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TS/ESM import-path normalisation in `@openvaa/app-shared` | Package (build + source) | — | Internal package paradigm; no runtime tier change |
| Dual ESM+CJS build for `@openvaa/app-shared` | Package (tsup config) | Consumer packages (frontend SSR, dev-seed) | Build artifact shape; consumer resolution via `exports` field |
| Frontend `mergeSettings` import-path rewrite | Frontend (SvelteKit `apps/frontend`) | Test (`tests/`) | Pure import-path edit — no SSR/CSR/API change |
| Supabase workspace lint-script rename | Build tooling (`apps/supabase` workspace + root `package.json` + Turborepo) | Documentation (CLAUDE.md, README) | Yarn-script + Turborepo task wiring; not a runtime tier |

## Standard Stack

### Core (already in use, no changes — these are the canonical reference)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsup | latest (catalog: pinned) | TS bundle to ESM (and CJS for app-shared) | All 5 packages use it; minimal config (`packages/core/tsup.config.ts:1-10`) [VERIFIED: filesystem inspection] |
| typescript (`tsc --emitDeclarationOnly --outDir dist`) | catalog: pinned | Emit `.d.ts` declarations | Used by every canonical package's `build` script [VERIFIED] |
| eslint (`--flag v10_config_lookup_from_file`) | catalog: pinned | Workspace-local lint, single source-of-truth via `@openvaa/shared-config/eslint` | Identical script across 11 of 12 workspaces (only `@openvaa/supabase` overrides) [VERIFIED: grep across all package.json] |
| vitest | catalog: pinned | Unit tests via `vitest.workspace.ts` (`packages/**/vitest.config.ts`) | Per-package empty `vitest.config.ts` exists in all 5 packages including app-shared [VERIFIED] |
| `@openvaa/shared-config/ts` | workspace | Shared `tsconfig.base.json` (module=ESNext, moduleResolution=Bundler, lib=es2022, target=es2020, strict=true) | Extended by every canonical package's `tsconfig.json` [VERIFIED: `packages/shared-config/tsconfig.base.json:1-18`] |
| Turborepo | 2.8.17 | Build orchestration; `lint` task with `^lint` deps | Confirmed at root [VERIFIED: `package.json:64`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@openvaa/data` (workspace dep) | workspace | Used by `app-shared/src/data/*.ts` for type plumbing | Already wired; no change |
| `supabase` CLI (catalog) | catalog: | `supabase db lint` for SQL linter | Plan-72-03 only — script invocation rename, not the tool itself |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Removing app-shared's `test:unit` script (canonical packages have none) | Keep it | App-shared has actual tests (`mergeSettings.test.ts`, `passwordValidation.test.ts`, `isEmoji.test.ts`); removing the script would silently drop them from `turbo run test:unit`. Document as a justified divergence, not a flatten target. [VERIFIED: file listing] |
| Adding a real `lint` (ESLint) script to `apps/supabase/package.json` after renaming the SQL script to `lint:sql` | Leave `lint` empty (turbo no-ops) | The supabase workspace's only Node-side TS files are `vitest.config.ts` and `scripts/lint-schema.mjs` — already covered by root-level `eslint --flag v10_config_lookup_from_file tests` (different scope) and the project-wide ignore rules. Adding a `lint` script gains little. The Edge Functions in `apps/supabase/supabase/functions/` are Deno scope (`.vscode/settings.json:7`), not in scope for the JS lint pipeline. **Default: do not add a new `lint` script** — let turbo skip the workspace. [VERIFIED] |
| Sub-barrel structure for app-shared (matching/filters style) | Keep flat `index.ts` re-exports per current state | D-04 picks `@openvaa/core` as tiebreaker; core uses flat re-exports (`packages/core/src/index.ts:1-19`). App-shared already has flat re-exports. No change needed. [VERIFIED] |

**Installation:** No new packages. All work is renames, edits, and one delete.

**Version verification:** No new dependencies introduced. Existing pins live in `.yarn/catalog` (yarn 4.13 catalog protocol) — Plan-72-01 must NOT touch dependency versions.

## Architecture Patterns

### System Architecture Diagram

```
                                  Phase 72 — Three Independent Diffs
                                  ───────────────────────────────────

  Plan-72-01 (SHARED-01)          Plan-72-02 (SHARED-02)          Plan-72-03 (LINT-01)
  ──────────────────────          ──────────────────────          ──────────────────────

  packages/app-shared/            apps/frontend/src/lib/          apps/supabase/
  ├─ src/index.ts                 │ utils/merge.ts ───── DELETE   │ package.json
  │   strip 14 ".js"              │                                │   "lint" → "lint:sql"
  │ src/data/{isEmoji,            │ contexts/layout/               │
  │   isImage,isLocalized}.ts     │   layoutContext.svelte.ts:6,11  package.json (root)
  │   strip 4 ".js"               │   layoutContext.type.ts:4       │ "supabase:lint" →
  │ package.json                  │   import path rewrite           │   "supabase:lint:sql"
  │   add publish metadata        │                                 │
  │   (private:true preserved)    │ tests/ — zero matches           CLAUDE.md
  │ tsconfig.tsbuildinfo          │                                 │ §"Supabase Commands"
  │   DELETE (stale)              │                                 │   line 63 update
  │ README.md                     │
  │   replace strapi rationale                                      No CI / turbo edits needed
  │   add CJS justification
  │ tsup.config.ts (NO CHANGE)
  │ tsconfig.json (NO CHANGE)
  │
  CLAUDE.md (D-03 short anchor) ────► packages/README.md (NEW, D-03 long form)


  Phase verification gate (single, at close)
  ────────────────────────────────────────────
  yarn build && yarn test:unit && yarn lint:check
  yarn supabase:lint:sql                 (verifies the SQL pipeline still works)
  v2.7-close Playwright parity gate at HEAD 2c7ad2dea  (67p/1f/34c)
```

### Recommended Project Structure (canonical paradigm — no change)

```
packages/<name>/
├── src/
│   ├── index.ts                # flat re-export barrel (core style — D-04 tiebreaker)
│   └── <subdir>/               # logical grouping; sub-barrel optional
│       └── <leaf>.ts           # imports relatives WITHOUT .js extension
├── dist/                       # tsup output; gitignored
│   ├── index.js                # ESM
│   ├── index.cjs               # CJS (only for app-shared — explicitly justified)
│   └── index.d.ts              # tsc --emitDeclarationOnly
├── package.json                # type: module; tsup+tsc build; eslint v10_config; @openvaa/shared-config workspace dep
├── tsconfig.json               # extends @openvaa/shared-config/ts; rootDir src; outDir dist; declaration true
├── tsup.config.ts              # entry src/index.ts; format esm (or [esm,cjs] for app-shared)
├── vitest.config.ts            # empty; just enables workspace participation
└── README.md                   # short package summary
```

### Pattern 1: Canonical `package.json` shape (publishable canonical — `core`/`data`/`matching`/`filters`)

**What:** Every publishable canonical package has identical metadata fields and scripts.
**When to use:** Plan-72-01 reference.
**Example:**
```json
// Source: packages/core/package.json (verbatim)
{
  "name": "@openvaa/core",
  "version": "0.1.0",
  "license": "MIT",
  "description": "Core types, interfaces, and utilities for OpenVAA voting advice applications",
  "repository": {
    "type": "git",
    "url": "https://github.com/OpenVAA/voting-advice-application.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/OpenVAA/voting-advice-application/tree/main/packages/core",
  "bugs": { "url": "https://github.com/OpenVAA/voting-advice-application/issues" },
  "files": ["dist", "LICENSE"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit"
  },
  "type": "module",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  }
}
```

### Pattern 2: app-shared's dual-build divergence (preserved, but to-be-justified)

**What:** `app-shared` is the *only* package with `format: ['esm', 'cjs']` in tsup.
**When to use:** Plan-72-01 must keep this divergence and add an inline justification.
**Example:**
```ts
// Source: packages/app-shared/tsup.config.ts:1-10 (verbatim)
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],   // <-- the divergence
  outDir: 'dist',
  clean: true,
  sourcemap: true
});
```
The corresponding `package.json` exports field already has both branches:
```json
// Source: packages/app-shared/package.json:15-26 (verbatim)
"exports": {
  ".": {
    "import": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "require": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.cjs"
    }
  }
}
```

### Pattern 3: Canonical `tsconfig.json` shape

**What:** Every canonical `tsconfig.json` extends `@openvaa/shared-config/ts` with the same overrides.
**Example:**
```json
// Source: packages/core/tsconfig.json (verbatim — app-shared is byte-equivalent except no "rootDir": "./src" etc.)
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"]
}
```

### Anti-Patterns to Avoid

- **Removing `test:unit` script from app-shared "to match canonical paradigm":** App-shared has actual tests; canonical packages have tests too but rely on root-level `vitest.workspace.ts` discovery. Removing app-shared's `test:unit` would drop it from `turbo run test:unit`. Treat as justified divergence.
- **Adding a stub ESLint script to `apps/supabase/package.json` "for symmetry":** Adds maintenance burden with no real lint-coverage gain (TS files in supabase are Deno scope or trivial scripts). Let `turbo run lint` no-op the workspace cleanly after the rename.
- **Editing `turbo.json` to add a `lint:sql` task:** Unnecessary. The new `lint:sql` script is invoked directly via `yarn workspace @openvaa/supabase lint:sql` or `yarn supabase:lint:sql`. There's no fan-out requirement; SQL lint is a deliberately-callable target, not part of the every-workspace fan-out chain.
- **Keeping the stale `tsconfig.tsbuildinfo` at `packages/app-shared/tsconfig.tsbuildinfo`:** The file is a 200-byte JSON artifact from the strapi era that incremental compilations no longer touch (the active build outputs to `dist/tsconfig.tsbuildinfo` per `tsconfig.json`). Delete during Plan-72-01.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting which packages have a `lint` script | A custom Node script crawling package.json files | `yarn turbo run lint --dry=json` | Turborepo already enumerates the task graph; no need to re-implement [VERIFIED: command works at HEAD] |
| Cross-checking `.js` extension policy | A bespoke regex audit | `grep -rEn "from ['\"]\\\.\\\.?/.*\\.js['\"]" packages/<pkg>/src/` | Standard grep idiom; explicit and reviewable |
| Tracking the parity baseline | A new baseline-snapshot script | `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` | The script is the canonical Phase-65–67 verification path; reuse it. Verifier-feasibility is well-understood (manual yarn dev required). |

**Key insight:** This is a refactor phase. Every problem here has an existing tool. The risk is bypassing them.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — paradigm normalisation, shim retire, and lint-script rename touch no databases | None |
| Live service config | None — no n8n / Datadog / Tailscale / Cloudflare config involved | None |
| OS-registered state | None — no Task Scheduler / launchd / systemd / pm2 entries reference any of the renamed scripts | None |
| Secrets/env vars | None — no env vars depend on `yarn supabase:lint` or `$lib/utils/merge` import paths | None |
| Build artifacts / installed packages | **`packages/app-shared/dist/`** rebuilt fresh by Plan-72-01 (tsup `clean: true`); **`packages/app-shared/tsconfig.tsbuildinfo`** (200-byte stale strapi-era artifact, currently committed) deleted by Plan-72-01; **Turborepo cache** (`.turbo/`) auto-invalidated on any `package.json` / `turbo.json` edit per the `inputs` field; **Yarn lockfile** untouched (no dependency version changes) | (1) verify dist/ rebuilds clean after Plan-72-01; (2) `git rm packages/app-shared/tsconfig.tsbuildinfo`; (3) accept turbo cache invalidation (will re-build on first `yarn build` post-rename) |

**The canonical question for this phase:** *After every file is updated, what runtime systems still have the old name cached?* Answer: only the Turborepo local cache (`.turbo/`), which auto-invalidates on input change. There are no DB-stored references, no live-service registrations, no installed packages with hard-coded "supabase:lint" entrypoints. CI workflow files contain zero references to the renamed script (verified by grep over `.github/workflows/*.{yml,yaml}`).

## Common Pitfalls

### Pitfall 1: Breaking the dual ESM+CJS build by removing `index.cjs` exports prematurely
**What goes wrong:** Plan-72-01 author thinks "the canonical packages don't have `require` exports, let's flatten" and removes the `require` branch from `package.json` `exports`.
**Why it happens:** Pattern-matching on the canonical 4 without re-checking who actually imports `app-shared` via CJS.
**How to avoid:** D-06 explicitly preserves the dual build. **Verified consumer of the CJS path = unclear** (see §"Dual ESM+CJS Mechanics" below — `apps/supabase/functions/` does NOT import `@openvaa/app-shared`; `@openvaa/dev-seed` is `type: module` ESM). The build is preserved per CONTEXT.md; the *justification language* in the doc-comment must reflect the verified consumer (which the planner/discuss-phase should clarify if it differs from "Edge Functions").
**Warning signs:** Test command `yarn workspace @openvaa/dev-seed exec node -e "import('@openvaa/app-shared').then(m => console.log(typeof m.mergeSettings))"` printing anything other than `function` after Plan-72-01 lands.

### Pitfall 2: `git grep` missing `mergeSettings` consumers via dynamic / re-export / type-only-import paths
**What goes wrong:** The grep regex catches `from '$lib/utils/merge'` but misses (a) re-exports through other utility files, (b) `vi.mock('$lib/utils/merge', …)` in tests, (c) a comment block referencing the path.
**Why it happens:** Grep is not AST.
**How to avoid:** Run TWO greps: `git grep -nE "from ['\"]\\\$lib/utils/merge['\"]"` AND `git grep -nE "['\"]\\\$lib/utils/merge['\"]"` (broader, catches `vi.mock` and comments). Verified at HEAD: only 3 hits in `layoutContext.svelte.ts:6,11` + `layoutContext.type.ts:4`; no `vi.mock` references; no comment-only references in any consumer.
**Warning signs:** `yarn build` or `yarn test:unit` failure after the shim file deletion; the failure stack trace will name the missed consumer file.

### Pitfall 3: Forgetting the supabase workspace's own `lint:all` self-reference
**What goes wrong:** Plan-72-03 renames `apps/supabase/package.json:lint` → `lint:sql` but leaves `lint:all` (line 14) reading `"yarn lint && yarn lint:schema"` — which now invokes a non-existent `lint` script.
**Why it happens:** `lint:all` is internal to the workspace; easy to miss when scanning root + CLAUDE.md.
**How to avoid:** Update `lint:all` in the same edit: `"lint:all": "yarn lint:sql && yarn lint:schema"`. This keeps `yarn supabase:lint:sql` (root) → `yarn workspace @openvaa/supabase lint:all` → both `lint:sql` + `lint:schema` — preserving Phase 68's "all SQL checks together" semantic.
**Warning signs:** `yarn supabase:lint:sql` fails with "Couldn't find a script named lint" if root forwards to `lint:all` and `lint:all` still references the old name.

### Pitfall 4: `yarn lint:fix` regenerates the stale tsconfig.tsbuildinfo
**What goes wrong:** Plan-72-01 deletes `packages/app-shared/tsconfig.tsbuildinfo`, but a subsequent `yarn build` recreates it at the package root because tsc's incremental cache writes to wherever `tsBuildInfoFile` points.
**Why it happens:** The `tsconfig.json` already correctly sets `"tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"` — so a fresh tsc run writes to dist (good). But the existing root file is just an orphan; it won't regenerate.
**How to avoid:** After `git rm packages/app-shared/tsconfig.tsbuildinfo`, run `yarn workspace @openvaa/app-shared build` and confirm only `dist/tsconfig.tsbuildinfo` is produced (no new file at the package root). [VERIFIED: tsconfig.json already sets the dist-path tsBuildInfoFile]
**Warning signs:** A new `tsconfig.tsbuildinfo` showing up at the package root in `git status` after a build.

### Pitfall 5: CLAUDE.md bloat
**What goes wrong:** Plan-72-01 adds a multi-paragraph "package paradigm" section to CLAUDE.md, pushing it past 400 lines.
**Why it happens:** "Detailed reference" feels right; CLAUDE.md is the obvious entrypoint.
**How to avoid:** D-03 explicitly authorises CLAUDE.md-only OR `packages/README.md`-only (the bloat-judgment escape hatch). Current CLAUDE.md is **359 lines** [VERIFIED]; adding more than ~10 lines triggers the escape. The user already flagged "new pkg creation is a rare task so it may not be useful in all task contexts." Default: 1-paragraph anchor in CLAUDE.md (5–8 lines max) pointing to a longer `packages/README.md` (new file — verified does not exist).
**Warning signs:** CLAUDE.md diff > 15 lines added.

### Pitfall 6: Edge Function justification language is stale
**What goes wrong:** Plan-72-01 copies CONTEXT.md D-06's phrasing "Edge Functions consume CJS" verbatim into the dual-build justification doc-comment — but no Edge Function in `apps/supabase/supabase/functions/` actually imports `@openvaa/app-shared`.
**Why it happens:** The original justification (in `packages/app-shared/README.md:23`) says "@openvaa/strapi" — strapi is retired. CONTEXT.md updated the phrasing to "Edge Functions" without re-verifying.
**How to avoid:** Plan-72-01 should grep for actual CJS consumers and write the justification truthfully. **Verified consumers** as of HEAD `94a5934cf`: `@openvaa/dev-seed` (ESM), `@openvaa/argument-condensation` (ESM), `@openvaa/llm` (ESM), `@openvaa/question-info` (ESM), `apps/frontend` (ESM via SvelteKit/Vite). **No verified CJS consumer.** The dual build is currently a defensive-future-compatibility artifact; the planner should either (a) ask the user to confirm what depends on the CJS output, (b) write a truthful "no current CJS consumer; preserved as future-compatibility hedge" justification, or (c) propose folding "drop dual build" into a future phase. Per D-06 the dual build IS preserved — but the justification language must be honest.
**Warning signs:** Justification doc-comment claims a consumer that doesn't exist on disk. [ASSUMED: planner / discuss-phase should clarify the actual CJS consumer before locking the justification text]

### Pitfall 7: Turborepo cache stays warm with old `lint` script signature
**What goes wrong:** After renaming `apps/supabase/package.json:lint` → `lint:sql`, the next `yarn lint:check` still picks up the cached old result.
**Why it happens:** Turborepo hashes inputs (`$TURBO_DEFAULT$` + `eslint.config.*`); a `package.json` script-name rename DOES change the hash because `package.json` is in `$TURBO_DEFAULT$`.
**How to avoid:** Verified: turbo invalidates on `package.json` change [VERIFIED: `turbo.json:13-17` declares `"inputs": ["$TURBO_DEFAULT$", "eslint.config.*"]` for the `lint` task]. No manual cache clear required. If paranoid, run `yarn turbo run lint --force` once after the rename.
**Warning signs:** `yarn lint:check` shows `cache hit, replaying logs` for `@openvaa/supabase#lint` AFTER the rename — that would mean turbo missed the change. (Not expected.)

### Pitfall 8: D-04 mis-application — picking matching/filters paradigm over core
**What goes wrong:** Plan-72-01 sees `matching` and `filters` use sub-barrels (`packages/matching/src/index.ts:6-12`, `packages/filters/src/index.ts:1-4`) and concludes "majority wins, app-shared should add sub-barrels."
**Why it happens:** "Majority of 4" = 2/4 use sub-barrels (`matching`, `filters`), 1/4 uses internal.ts (`data`, due to circular-dep workaround), 1/4 uses flat (`core`). D-04 explicitly says "@openvaa/core is the tiebreaker since it's the lowest in the dependency graph."
**How to avoid:** Quote D-04 directly. Apply core's flat barrel structure. App-shared currently has flat barrel — **no sub-barrel work needed**. [VERIFIED: `packages/app-shared/src/index.ts:1-14` already flat]
**Warning signs:** Plan-72-01 proposing new files like `packages/app-shared/src/data/index.ts`.

## Code Examples

### `.js` extension delta — what to remove from app-shared

```ts
// Source: packages/app-shared/src/index.ts:1-14 (current state — VERBATIM)
export * from './data/argumentType.js';
export * from './data/customData.type.js';
export * from './data/extendedData.type.js';
export * from './data/getCustomData.js';
export * from './data/isEmoji.js';
export * from './data/isImage.js';
export * from './data/isLocalized.js';
export * from './data/localized.type.js';
export * from './settings/dynamicSettings.js';
export * from './settings/dynamicSettings.type.js';
export * from './settings/staticSettings.js';
export * from './settings/staticSettings.type.js';
export * from './utils/mergeSettings.js';
export * from './utils/passwordValidation.js';

// Target (matching packages/core/src/index.ts pattern — VERBATIM no .js):
export * from './data/argumentType';
export * from './data/customData.type';
// … etc.
```

### Other `.js` hits inside app-shared sources (4 additional hits)

```ts
// packages/app-shared/src/data/isImage.ts:1
import { isPlainObject } from './utils/isPlainObject.js';

// packages/app-shared/src/data/isLocalized.ts:1-3
import { isImage } from './isImage.js';
import { isPlainObject } from './utils/isPlainObject.js';
import type { LocalizedObject, LocalizedString } from './localized.type.js';

// packages/app-shared/src/data/isEmoji.ts:1-2
import { isPlainObject } from './utils/isPlainObject.js';
import type { Emoji } from './customData.type.js';
```

Note inconsistency: `packages/app-shared/src/settings/dynamicSettings.ts:1` imports `from './dynamicSettings.type'` (no `.js`) — proves app-shared is already inconsistent internally. Plan-72-01 normalises to NO `.js` extension across all internal relative imports.

### `mergeSettings` shim consumer rewrite

```ts
// BEFORE — apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:6,11
import { mergeSettings } from '$lib/utils/merge';
import type { DeepPartial } from '$lib/utils/merge';

// AFTER
import { mergeSettings } from '@openvaa/app-shared';
import type { DeepPartial } from '@openvaa/app-shared';
```

```ts
// BEFORE — apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:4
import type { DeepPartial } from '$lib/utils/merge';

// AFTER
import type { DeepPartial } from '@openvaa/app-shared';
```

### Supabase lint-script rename — atomic edit set

```diff
// apps/supabase/package.json:12-14
   "scripts": {
     ...
-    "lint": "supabase db lint --schema public --fail-on warning",
+    "lint:sql": "supabase db lint --schema public --fail-on warning",
     "lint:schema": "node scripts/lint-schema.mjs",
-    "lint:all": "yarn lint && yarn lint:schema",
+    "lint:all": "yarn lint:sql && yarn lint:schema",
     "test:unit": "vitest run"
   }
```

```diff
// package.json (root):38
-    "supabase:lint": "yarn workspace @openvaa/supabase lint:all"
+    "supabase:lint:sql": "yarn workspace @openvaa/supabase lint:all"
```

```diff
// CLAUDE.md:63
-yarn supabase:lint            # Run SQL linter on all migrations
+yarn supabase:lint:sql        # Run SQL linter on all migrations (sqlfluff + Splinter advisors)
```

No `turbo.json` edit required — `turbo run lint` only invokes scripts that exist; the supabase workspace's `lint` script is gone, so it's silently skipped (becomes a no-op task). [VERIFIED: turbo task naming model]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tsc + tsc-esm-fix` two-step builds | `tsup + tsc --emitDeclarationOnly` | Phase 11-01 (`78788d3e8`, monorepo refresh) | All packages already on this; no Phase 72 work |
| `apps/frontend/src/lib/utils/merge.ts` re-export shim (Phase 63 hoist) | Direct `@openvaa/app-shared` imports | Phase 72 / SHARED-02 | 3 import sites rewritten, 1 file deleted |
| `apps/supabase/package.json: lint = SQL` (script-name conflation) | `lint:sql` (or equivalent SQL-specific) | Phase 72 / LINT-01 | `yarn lint:check` no longer invokes SQL linter |
| `packages/app-shared` `.js`-extension imports, strapi-era README | Match canonical paradigm; updated rationale | Phase 72 / SHARED-01 | Lint-clean, doc-truthful, future-package-creation reference |

**Deprecated/outdated:**
- `@openvaa/strapi` (retired during Supabase migration) — still mentioned in `packages/app-shared/README.md:23` as "the CommonJS consumer." Plan-72-01 fixes this language.
- `apps/frontend/src/lib/utils/merge.ts` — explicitly transitional per its 5-line doc-comment (Phase 63 D-02). Now retired.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The "Edge Function consumption" rationale for the dual ESM+CJS build (CONTEXT.md D-06) is now stale. No Edge Function in `apps/supabase/supabase/functions/` imports `@openvaa/app-shared`. The actual CJS consumer (if any) is unverified at HEAD. | Pitfall 6, Dual ESM+CJS Mechanics | If Plan-72-01 writes a justification that names a non-existent consumer, future readers will be misled. **Mitigation:** Plan-72-01 should grep for actual CJS consumers and write truthfully; or surface this to the user via a brief note in the plan. | [ASSUMED — based on grep `@openvaa/app-shared` over `apps/supabase/`, which returned zero hits] |
| A2 | `yarn lint:fix --fix` after Plan-72-01's index.ts edit will not introduce new lint violations | Validation | If app-shared's source edits trigger an ESLint rule (e.g., `simple-import-sort/exports`), the lint pipeline fails — easy to fix in the same plan. **Mitigation:** Run `yarn workspace @openvaa/app-shared lint --fix` in the plan's verification step. |
| A3 | Removing `packages/app-shared/tsconfig.tsbuildinfo` does not break any tsc incremental cache | Pitfall 4 | If a tsc setup somewhere reads from the package-root tsbuildinfo (not dist), incremental builds slow down once. **Mitigation:** Verified `packages/app-shared/tsconfig.json:5` sets `tsBuildInfoFile: "./dist/tsconfig.tsbuildinfo"` — so the package-root file is genuinely orphaned. |

**If this table contains 3 entries:** A1 is the only assumption with non-trivial planner / discuss-phase implications. A2 and A3 are routine "verify by running the build" assumptions.

## Open Questions (RESOLVED)

1. **What is the actual CJS consumer of `@openvaa/app-shared`?**
   - What we know: Build outputs `dist/index.cjs`; no `apps/supabase/functions/*` files import `@openvaa/app-shared`; all other consumers are ESM (`type: module`).
   - What's unclear: Whether some legacy or external integration depends on the CJS output (e.g., a tooling script not in this repo, a downstream consumer that sets `"main"` resolution, a future Edge Function rewrite that someone has planned).
   - Recommendation: Plan-72-01 should write the dual-build justification truthfully — either "preserved as a future-compatibility hedge; no current CJS consumer in-repo" OR ask the user explicitly via a /gsd-discuss-phase round before locking the language. Per D-06 the build itself is preserved either way.
   - **RESOLVED:** Plan-72-01 Task 2 adopts the "future-compatibility hedge" wording verbatim. No current in-repo CJS consumer exists at the time of writing; the dual build is preserved as a hedge against a future Edge Function rewrite or external integration. README.md and `package.json` `description` reflect this truthfully.

2. **Should the planner add an actual ESLint script to `apps/supabase/package.json` after the rename?**
   - What we know: The supabase workspace has TS files in `vitest.config.ts` + Edge Functions (Deno scope, out of node lint pipeline) + `scripts/lint-schema.mjs`. None of these are currently linted by the workspace's own `lint` script. Phase 68 P68-03 explicitly inverted the Deno scope to keep Edge Functions OUT of the Node toolchain.
   - What's unclear: Whether Plan-72-03 should leave `lint` undefined (turbo no-ops) or add `"lint": "eslint --flag v10_config_lookup_from_file vitest.config.ts scripts/"` (matching every other workspace).
   - Recommendation: **Default = leave undefined** (consistent with Phase 68 deferred-tech-debt §2's recommendation; SQL-only workspace for the lint pipeline). The planner may flip this to "add a real lint script" if the user wants strict symmetry — that's a 1-line addition.
   - **RESOLVED:** Plan-72-03 Task 1 adopts the default — `lint` is left undefined after the hard rename to `lint:sql`. Turborepo's script-existence-driven fan-out cleanly skips `@openvaa/supabase` from the JS lint pipeline (per Phase 68 deferred-tech-debt §2). No real ESLint script was added; the SQL-only workspace identity is preserved.

3. **Should the `packages/README.md` paradigm doc include a "minimum viable package" template?**
   - What we know: D-03 leaves this to planner discretion. The user explicitly noted "new pkg creation is a rare task."
   - What's unclear: Whether a code-snippet template (full `package.json` + `tsconfig.json` skeletons) belongs in v2.8 or in a future phase.
   - Recommendation: Default = prose-only (1–2 paragraphs naming the canonical packages + linking to their `package.json` files). If the planner's diff is small, a minimal template adds value. Avoid duplicating the actual canonical package files — link to them by path.
   - **RESOLVED:** Plan-72-01 Task 3 adopts the prose-only default per D-03. `packages/README.md` names the canonical 4, explains the paradigm in prose, and links to live `packages/core/*` files (`package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`) by path rather than embedding code-snippet templates. A "minimum viable package" template can be added in a future phase if new-package creation frequency justifies it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | ✓ | 22.x (CI uses 22.22.1; engine pin `>=22`) | — |
| yarn 4.13 | All scripts | ✓ | 4.13.0 (`packageManager` field) | — |
| Turborepo | `yarn build`, `yarn lint:check`, `yarn test:unit` | ✓ | 2.8.17 | — |
| `supabase` CLI | Plan-72-03 SQL lint verification | ✓ | catalog: pinned (devDep on root) | — |
| Playwright | Phase verification gate (parity) | ✓ | 1.58.2 (per Phase 68 VALIDATION) | — |
| Local Postgres (54332) | `supabase db lint`, `lint-schema.mjs --strict` | conditional — only if user runs `yarn supabase:start` first | — | Plan-72-03 verification can run `yarn supabase:lint:sql` only after `yarn supabase:start`; CI handles this via `supabase/setup-cli@v1` |

**Missing dependencies with no fallback:** None — all required tools are available locally and in CI.

**Missing dependencies with fallback:** None.

## App-shared Divergence Audit (Plan-72-01 specifics)

Concrete deltas between `@openvaa/app-shared` and the canonical 4 (`core`, `data`, `matching`, `filters`):

### Delta 1: `.js` extension policy (D-05)

- **Canonical:** 0 `.js` extensions on relative imports across all 4 packages [VERIFIED: `grep -rEn "from ['\"]\\\.\\\.?.*\\.js['\"]" packages/{core,data,matching,filters}/src/ | wc -l` = 0]
- **app-shared:** 14 `.js` extensions in `src/index.ts` + 4 in src files = 18 hits total. Internally inconsistent — `dynamicSettings.ts:1`, `staticSettings.ts:1`, `mergeSettings.test.ts:2`, `getCustomData.ts:1`, `extendedData.type.ts:6`, `customData.type.ts:3`, `localized.type.ts:10`, `isEmoji.test.ts:2`, `passwordValidation.test.ts:2` use NO `.js`; the rest DO.

**Action:** Strip all `.js` extensions in app-shared's `src/`. Mechanical sed-style edit.

### Delta 2: `package.json` publish-readiness fields

- **Canonical:** Has `license`, `description`, `repository`, `homepage`, `bugs`, `files`, `publishConfig` (e.g., `packages/core/package.json:6-21`).
- **app-shared:** Has `private: true`, no `license`/`description`/`repository`/etc. [VERIFIED: `packages/app-shared/package.json:1-35`]

**Action:** This divergence is **legitimate** — `app-shared` is `private: true` and not published. The planner should EITHER (a) leave the metadata fields empty (current state — defensible: private package, not published), OR (b) add at least `description` and `license` to match symmetry. **Default:** add `description` to match the source-todo's "this is how all packages look" goal; leave the rest (no `files`/`publishConfig` since not published).

### Delta 3: `package.json` `main` field

- **Canonical:** No `main` field; only `module` + `types` + `exports` (`packages/core/package.json:28-29`)
- **app-shared:** Has `"main": "./dist/index.cjs"` [VERIFIED: `packages/app-shared/package.json:12`] — this IS required because the package has a CJS output and Node's module resolution may fall back to `main` for CJS consumers.

**Action:** Keep `main` (required for CJS resolution). This is a justified divergence per D-06.

### Delta 4: `tsconfig.tsbuildinfo` at package root (stale)

- **Canonical:** No tracked `tsconfig.tsbuildinfo` files; `tsBuildInfoFile` config writes inside `dist/` (gitignored).
- **app-shared:** `packages/app-shared/tsconfig.tsbuildinfo` IS tracked [VERIFIED: `git ls-files packages/app-shared/tsconfig.tsbuildinfo` returns the path; only one of 5 packages]. Content is a stale strapi-era artifact (`{"program":{"fileNames":["../node_modules/@strapi/admin/node_modules/typescript/...`).

**Action:** `git rm packages/app-shared/tsconfig.tsbuildinfo` in Plan-72-01. (`packages/app-shared/.gitignore:2` already lists `dist/` — no further gitignore edit needed.)

### Delta 5: README rationale references retired strapi

- **Current:** `packages/app-shared/README.md:23` reads "Currently ESM version is used by `@openvaa/frontend` and CommonJS by `@openvaa/strapi` modules."
- **Reality:** `@openvaa/strapi` is retired. No current in-repo CJS consumer found.

**Action:** Plan-72-01 rewrites this paragraph honestly per D-06 (one-sentence justification). See Pitfall 6 for the wording question.

### Non-Deltas (verified equivalent)

- **tsup config:** `app-shared/tsup.config.ts` differs only in `format: ['esm', 'cjs']` vs `['esm']` — preserved per D-06.
- **tsconfig.json:** `app-shared/tsconfig.json` is *identical* to `core/tsconfig.json` modulo whitespace. [VERIFIED]
- **vitest.config.ts:** All 5 packages have an empty config. Identical. [VERIFIED]
- **eslint script:** `"lint": "eslint --flag v10_config_lookup_from_file src/"` — identical across all 12 workspaces except `@openvaa/supabase` (LINT-01 target). [VERIFIED]
- **shared-config dep:** All packages depend on `@openvaa/shared-config: workspace:^` as a devDep. [VERIFIED]
- **Barrel structure:** App-shared has flat `index.ts` re-exports — same as `core` (D-04 tiebreaker). [VERIFIED: `packages/app-shared/src/index.ts:1-14` flat; `packages/core/src/index.ts:1-19` flat]
- **`test:unit` script:** Only app-shared has it (canonical 4 don't). **Justified divergence** — app-shared has actual unit tests (`mergeSettings.test.ts`, `passwordValidation.test.ts`, `isEmoji.test.ts`); canonical packages discover tests via root `vitest.workspace.ts`. Keep it.

## `mergeSettings` Consumer Inventory (Plan-72-02 specifics)

### Direct shim consumers (`from '$lib/utils/merge'`)

[VERIFIED via `git grep -nE "from ['\"]\\\$lib/utils/merge['\"]"`]

| File | Line | Import |
|------|------|--------|
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` | 6 | `import { mergeSettings } from '$lib/utils/merge';` |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` | 11 | `import type { DeepPartial } from '$lib/utils/merge';` |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` | 4 | `import type { DeepPartial } from '$lib/utils/merge';` |

**Total: 3 lines across 2 files. Zero matches in `tests/`. Zero matches in `packages/`.**

### Already-direct consumers (`from '@openvaa/app-shared'` — not affected by SHARED-02)

| File | Line | Notes |
|------|------|-------|
| `tests/tests/setup/templates/variant-constituency.ts` | 53 | Already direct — no edit |
| `tests/tests/setup/templates/variant-multi-election.ts` | 33 | Already direct — no edit |
| `tests/tests/setup/templates/variant-startfromcg.ts` | 35 | Already direct — no edit |
| `packages/dev-seed/tests/templates/variant-app-settings.test.ts` | 27 | Already direct — no edit |

### Other shim audit (`apps/frontend/src/lib/utils/`)

[VERIFIED via `grep -lE "^export .* from ['\"]@openvaa/" apps/frontend/src/lib/utils/*.ts`]

**Result:** Only `merge.ts` matches. No other re-export shims of the same shape.

[VERIFIED via `for f in apps/frontend/src/lib/utils/*.ts; do … done` over short files] Other ≤8-line files exist (`removeDuplicates.ts` is 6 lines) but contain real implementations, not re-exports.

**Action:** Plan-72-02 rewrites 3 import lines, deletes 1 file. No follow-up todo needed.

## Supabase Lint Script Wiring (Plan-72-03 specifics)

### Current state (HEAD `94a5934cf`)

```
apps/supabase/package.json:12     "lint": "supabase db lint --schema public --fail-on warning"
apps/supabase/package.json:13     "lint:schema": "node scripts/lint-schema.mjs"
apps/supabase/package.json:14     "lint:all": "yarn lint && yarn lint:schema"
package.json:38                    "supabase:lint": "yarn workspace @openvaa/supabase lint:all"
CLAUDE.md:63                       yarn supabase:lint            # Run SQL linter on all migrations
turbo.json:13-17                   "lint": { dependsOn: ["^lint"], inputs: ["$TURBO_DEFAULT$", "eslint.config.*"] }
```

### Active call sites (script-named — NOT documentation)

| File | Line | Reference |
|------|------|-----------|
| `package.json` (root) | 38 | `"supabase:lint": "yarn workspace @openvaa/supabase lint:all"` |
| `apps/supabase/package.json` | 14 | `"lint:all": "yarn lint && yarn lint:schema"` (internal self-reference) |
| `apps/supabase/package.json` | 12 | The `lint` script itself |

**Documentation-only call sites:**

| File | Line | Reference |
|------|------|-----------|
| `CLAUDE.md` | 63 | `yarn supabase:lint            # Run SQL linter on all migrations` |
| `.planning/REQUIREMENTS.md` | 52 | (LINT-01 description) |
| `.planning/STATE.md` | 104 | (decision history note) |
| `.planning/ROADMAP.md` | 106 | (Phase 72 SC-3) |
| Multiple `.planning/milestones/v2.7-phases/68-dev-tooling-trio/*.md` files | various | Historical Phase 68 context — DO NOT edit (frozen audit trail) |

### Implicit call sites (Turborepo task fan-out)

[VERIFIED via `yarn turbo run lint --dry=json | jq …`]

`turbo run lint` enumerates a `@openvaa/supabase#lint` task that today runs the SQL linter. After the rename:
- `@openvaa/supabase` no longer has a `lint` script → turbo treats the task as a no-op (cached automatically)
- Result: `yarn lint:check` → `turbo run lint && eslint … tests` no longer invokes `supabase db lint`. ✓ matches LINT-01 SC-3.
- **No `turbo.json` edit required.** The fan-out is by script existence.

### CI workflow references

[VERIFIED via grep over `.github/workflows/*.{yml,yaml}`]

**Zero references to `yarn supabase:lint` or `yarn workspace @openvaa/supabase lint`.** The only CI reference to lint is `.github/workflows/main.yaml:67` running `yarn lint:check` (which is unaffected by the rename — see "Implicit call sites" above).

### Naming convention picks

Canonical script-name patterns in this monorepo (per `package.json` grep):

- `lint` (every workspace except supabase) — bare, runs ESLint against `src/`
- `lint:check` (root) — runs `turbo run lint`
- `lint:fix` (root) — runs `turbo run lint -- --fix`
- `lint:schema` (supabase) — already exists, runs Splinter advisors

The pattern is `lint:<noun>` for sibling lint commands. **`lint:sql`** matches this convention exactly.

**Recommendation:** Pick `lint:sql` (already echoed in Phase 68 deferred-tech-debt §2 and ROADMAP SC-3 example). Avoids `db:lint` (verb-first, breaks the family pattern) and `lint:db` (less precise — "db" is broader than "sql"; the script specifically calls `supabase db lint` which IS a SQL/PL-pgSQL linter).

## Anchor Doc Placement (D-03 specifics)

### CLAUDE.md current state

- **Total lines:** 359 [VERIFIED]
- **Section §"Module Resolution & Dependencies"** at line 112; 14 lines (`112-125`).
- **Section §"Build System"** at line 125; 11 lines (`125-135`).
- **Section §"Supabase Commands"** at line 55; 10 lines (`55-64`).

### `packages/README.md` current state

- **Does not exist.** [VERIFIED via `ls packages/README.md`]
- D-03 implies creating it with the long-form paradigm doc.

### Recommended placement

**Option A (default — lowest CLAUDE.md bloat):** Add a 1-paragraph anchor (~5 lines) at the END of CLAUDE.md §"Module Resolution & Dependencies" (currently `112-125`), pointing to `packages/README.md` for full details. Net CLAUDE.md growth: ~5 lines (359 → 364).

**Option B (escape hatch):** Skip CLAUDE.md entirely; create only `packages/README.md`. Reduces session-start context cost slightly; "new pkg creation is rare" per user's own words.

**Default recommendation:** **Option A** — the 5-line addition is small enough to keep CLAUDE.md inside the user's tolerance, and routing through CLAUDE.md preserves discoverability for any agent task that *does* touch package structure (refactors, new packages, dependency-graph changes).

The `packages/README.md` itself should:
1. Name the canonical 4 (`core`, `data`, `matching`, `filters`).
2. Explain the paradigm in 3–5 short sections: import-path policy, barrel structure, build pipeline (`tsup` + `tsc --emitDeclarationOnly`), `package.json` shape (cite `core/package.json` as the reference), `tsconfig.json` shape (extends `@openvaa/shared-config/ts`).
3. Note the **one** justified divergence: `@openvaa/app-shared`'s dual ESM+CJS build (with the verified-truthful one-sentence reason).
4. Link to `packages/core/package.json` and `packages/core/tsconfig.json` as the live reference (not duplicated copies).

Stay prose-only unless the planner finds a code-snippet template adds material clarity (Open Question 3).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (unit) | vitest 3.2.4 (catalog: pinned) |
| Framework (E2E + parity) | Playwright 1.58.2 |
| Config file (unit) | `vitest.workspace.ts` (root, picks up `packages/**/vitest.config.ts`); per-package `vitest.config.ts` (empty stubs) |
| Config file (E2E) | `tests/playwright.config.ts` |
| Quick run command | `yarn lint:check` (~5–15s) |
| Full suite command | `yarn build && yarn test:unit && yarn lint:check` (~3–5 min) |
| Parity gate command | `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline> <post>` |
| Phase-specific verification | `yarn supabase:lint:sql` (after Plan-72-03; verifies the renamed SQL pipeline works) |
| Most-recent parity verdict | `Baseline: 67p / 1f / 34c, Post: 67p / 1f / 34c, PARITY GATE: PASS, EXIT=0` (Phase 67 close, `2026-04-29`, file `67-default-seed-alliances/post-fix/parity-diff.log`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHARED-01 | `.js` extensions stripped from app-shared `src/` | grep audit | `grep -rEn "from ['\"]\\\.\\\.?.*\\.js['\"]" packages/app-shared/src/ \| wc -l` returns 0 | ✅ existing |
| SHARED-01 | app-shared lint-clean | static check | `yarn workspace @openvaa/app-shared lint` exits 0 | ✅ existing |
| SHARED-01 | app-shared builds (dual ESM+CJS) | build verify | `yarn workspace @openvaa/app-shared build && test -f packages/app-shared/dist/index.js && test -f packages/app-shared/dist/index.cjs && test -f packages/app-shared/dist/index.d.ts` exits 0 | ✅ existing |
| SHARED-01 | app-shared tests pass | unit | `yarn workspace @openvaa/app-shared test:unit` exits 0 (existing tests: `mergeSettings.test.ts`, `passwordValidation.test.ts`, `isEmoji.test.ts`) | ✅ existing |
| SHARED-01 | Stale tsconfig.tsbuildinfo removed | filesystem | `test ! -f packages/app-shared/tsconfig.tsbuildinfo` (after delete) | ✅ existing |
| SHARED-01 | Anchor doc placed | docs presence | `test -f packages/README.md && grep -q '@openvaa/core' packages/README.md` (Option A: also `grep -q 'packages/README.md' CLAUDE.md`) | ❌ Wave 0 — `packages/README.md` doesn't exist yet |
| SHARED-02 | Shim file deleted | filesystem | `test ! -f apps/frontend/src/lib/utils/merge.ts` | ✅ existing |
| SHARED-02 | Zero shim consumers | grep audit | `git grep -nE "from ['\"]\\\$lib/utils/merge['\"]" apps/frontend/ tests/ packages/` returns 0 matches | ✅ existing |
| SHARED-02 | Frontend builds clean | build verify | `yarn workspace @openvaa/frontend build` exits 0 | ✅ existing |
| SHARED-02 | Frontend unit tests pass | unit | `yarn workspace @openvaa/frontend test:unit` exits 0 | ✅ existing |
| LINT-01 | Old root script removed | grep audit | `grep -c '"supabase:lint":' package.json` returns 0; `grep -c '"supabase:lint:sql":' package.json` returns 1 | ✅ existing |
| LINT-01 | Old workspace `lint` script removed | grep audit | `grep -c '"lint":' apps/supabase/package.json` returns 0; `grep -c '"lint:sql":' apps/supabase/package.json` returns 1 | ✅ existing |
| LINT-01 | New SQL script works | runtime | `yarn supabase:start && yarn supabase:lint:sql` runs `supabase db lint` against migrations (warnings expected — see deferred §3) | ✅ existing |
| LINT-01 | `yarn lint:check` no longer invokes SQL linter | grep audit on output | `yarn lint:check 2>&1 \| grep -c "supabase db lint"` returns 0 | ✅ existing |
| LINT-01 | `lint:all` self-reference updated | grep audit | `grep -E '"lint:all": "yarn lint:sql && yarn lint:schema"' apps/supabase/package.json` returns 1 hit | ✅ existing |
| LINT-01 | CLAUDE.md updated | grep audit | `grep -c 'yarn supabase:lint:sql' CLAUDE.md` returns ≥1; `grep -c 'yarn supabase:lint ' CLAUDE.md` returns 0 (note trailing space) | ✅ existing |
| Phase gate (SC-4) | Full static gate green | composite | `yarn build && yarn test:unit && yarn lint:check` exits 0 | ✅ existing |
| Phase gate (SC-4) | v2.7-close parity holds | E2E + diff | (manual; verifier defers per Phase 68 model) `yarn dev:reset && yarn dev` (background) → `yarn test:e2e` → `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline> <post>` outputs `PARITY GATE: PASS` | ✅ existing |

### Sampling Rate

- **Per task commit:** `yarn lint:check` (~5–15 s)
- **Per plan wave:** `yarn build && yarn test:unit && yarn lint:check` (~3–5 min)
- **Phase gate:** Full suite + manual parity gate before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/README.md` — NEW file, must contain canonical paradigm reference (per SC-1). Plan-72-01.
- [ ] CLAUDE.md anchor paragraph — NEW addition to §"Module Resolution & Dependencies" (per SC-1; Option A default). Plan-72-01.
- [ ] No new test infrastructure required — every other verification uses existing `yarn build`, `yarn test:unit`, `yarn lint:check`, the Phase 65 parity script, and standard `git grep` audits. All canonical packages already have working tests via `vitest.workspace.ts`.

*(SHARED-01 and SHARED-02 unit-test coverage is achieved by NOT-regressing the existing tests in `packages/app-shared/src/utils/mergeSettings.test.ts`, `packages/app-shared/src/utils/passwordValidation.test.ts`, `packages/app-shared/src/data/isEmoji.test.ts`, and `tests/tests/setup/templates/variant-*.test.ts`. No new test files needed.)*

## Project Constraints (from CLAUDE.md)

CLAUDE.md directives applicable to Phase 72:

- **Yarn 4 workspaces** (`packageManager: yarn@4.13.0`). All scripts run via `yarn workspace ...`. Plan-72-03 must use yarn-script idioms.
- **Turborepo** for build/test/lint orchestration. Plan-72-03 verified that no `turbo.json` edit is required (script-existence-driven fan-out).
- **TypeScript strictly — avoid `any`.** N/A for this phase (no new code).
- **Localization** — N/A (no user-facing strings).
- **Accessibility WCAG 2.1 AA** — N/A (no UI changes).
- **Module Resolution & Dependencies §:** "When adding interdependencies: Add to `package.json`: `"@openvaa/core": "workspace:^"`; Add TypeScript reference: `"references": [{ "path": "../core/tsconfig.json" }]`." — Phase 72 adds no new interdependencies; existing app-shared → data dep is preserved.
- **Build System §:** Turborepo `.turbo/` is gitignored. Phase 72 does not commit cache.
- **Context Destructuring Rule (Svelte 5):** N/A — Phase 72 doesn't touch Svelte components except for two `import` lines in `layoutContext.svelte.ts` and `layoutContext.type.ts` (no `getContext()` calls or `$derived` rewrites).
- **Code Review Checklist:** Apply per `.agents/code-review-checklist.md` at plan close.
- **GSD repo hook workaround (from MEMORY):** Commits in this repo must use `git -c core.hooksPath=/dev/null` until the global config is fixed. Applies to all 3 plans.

## Sources

### Primary (HIGH confidence) — direct codebase inspection at HEAD `94a5934cf`

- `packages/core/package.json` (canonical reference) [VERIFIED]
- `packages/data/package.json` [VERIFIED]
- `packages/matching/package.json` [VERIFIED]
- `packages/filters/package.json` [VERIFIED]
- `packages/app-shared/package.json` (target) [VERIFIED]
- `packages/{core,data,matching,filters,app-shared}/tsconfig.json` [VERIFIED]
- `packages/{core,data,matching,filters,app-shared}/tsup.config.ts` [VERIFIED]
- `packages/{core,data,matching,filters}/src/index.ts` (canonical barrel patterns) [VERIFIED]
- `packages/app-shared/src/**/*.ts` (divergence audit) [VERIFIED]
- `packages/shared-config/{eslint.config.mjs,tsconfig.base.json,package.json}` (shared base) [VERIFIED]
- `apps/frontend/src/lib/utils/merge.ts` (the shim) [VERIFIED]
- `apps/frontend/src/lib/contexts/layout/{layoutContext.svelte.ts,layoutContext.type.ts}` (the 3 consumers) [VERIFIED]
- `apps/supabase/package.json` (the SQL/JS-conflated lint script) [VERIFIED]
- `apps/supabase/scripts/lint-schema.mjs` (the Splinter-advisor companion script) [VERIFIED]
- `package.json` (root scripts + workspaces) [VERIFIED]
- `turbo.json` [VERIFIED]
- `CLAUDE.md` (size + section structure) [VERIFIED]
- `.github/workflows/main.yaml` (CI lint:check call site, no supabase:lint references) [VERIFIED]
- `vitest.workspace.ts` [VERIFIED]
- `.vscode/settings.json` (Deno scope confirmation) [VERIFIED]
- `.planning/phases/72-package-hygiene-trio/72-CONTEXT.md` (D-01 through D-07) [CITED]
- `.planning/REQUIREMENTS.md` (SHARED-01, SHARED-02, LINT-01) [CITED]
- `.planning/ROADMAP.md` (Phase 72 SC-1–SC-4) [CITED]
- `.planning/STATE.md` [CITED]
- `.planning/todos/pending/2026-04-25-normalise-app-shared-paradigm.md` [CITED]
- `.planning/todos/pending/2026-04-25-remove-mergesettings-reexports.md` [CITED]
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md` (LINT-01 source) [CITED]
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-VALIDATION.md` (verification model) [CITED]
- `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-VERIFICATION.md` (parity gate model) [CITED]
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/63-01-PLAN.md` (shim provenance) [CITED]
- `.planning/milestones/v2.7-phases/67-default-seed-alliances/post-fix/parity-diff.log` (most-recent parity verdict) [CITED]

### Secondary (MEDIUM confidence)

- Turborepo `lint` task semantics (script-existence-driven fan-out): inferred from `turbo.json:13-17` + observed dry-run output. Cross-verified by Phase 68's experience documented in `68-02-DEFERRED.md:53-68`.

### Tertiary (LOW confidence)

- None of the claims in this research are LOW confidence — every assertion was verified by direct file or command inspection at HEAD `94a5934cf`. The single ASSUMED claim (A1: stale "Edge Function" rationale) is explicitly flagged in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every tool version verified against `package.json` / catalog pin / file inspection.
- Architecture (paradigm divergences): HIGH — every delta has a file:line citation.
- Pitfalls: HIGH — every pitfall maps to a verified mechanism (Turborepo input hashing, tsc tsBuildInfoFile resolution, grep-vs-AST coverage gaps).
- Open Questions: clearly flagged; A1 (stale Edge Function rationale) needs user/discuss-phase confirmation before Plan-72-01 locks the doc-comment language.

**Research date:** 2026-05-09
**Valid until:** 2026-06-08 (30 days for stable; the 4 canonical packages have not had paradigm changes in many months — this research will hold)
**HEAD verified:** `94a5934cf` (current branch tip per `git status`)
