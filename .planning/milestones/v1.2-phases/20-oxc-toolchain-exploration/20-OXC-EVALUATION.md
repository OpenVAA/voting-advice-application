# OXC Toolchain Evaluation: oxlint vs ESLint for OpenVAA

## Executive Summary

Oxlint (v1.56.0, stable since v1.0 June 2025) is a high-performance JavaScript/TypeScript linter built on the OXC toolchain, delivering approximately 12x faster linting than ESLint on the OpenVAA monorepo (0.29s vs 3.4s wall clock). It ships 699+ built-in rules covering ESLint core, typescript-eslint, import, and more, and is used in production by Shopify, Airbnb, Mercedes-Benz, and the Preact team. However, oxlint **cannot lint Svelte template syntax** as of March 2026 -- its JS plugin system does not yet support custom file formats like `.svelte`, making it unable to run `eslint-plugin-svelte` rules. Since Svelte template linting is a dealbreaker for this SvelteKit monorepo (167 `.svelte` files), the recommendation is to **DEFER** migration until oxlint gains Svelte template support.

## Current Lint Stack

### Package Versions

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.39.2 | Core linter (flat config) |
| @typescript-eslint/eslint-plugin | ^8.57.0 | TypeScript-specific rules |
| @typescript-eslint/parser | ^8.57.0 | TypeScript parser |
| eslint-plugin-simple-import-sort | ^12.1.1 | Import/export sorting with custom groups |
| eslint-plugin-import | ^2.32.0 | Import hygiene (first, duplicates, type specifiers) |
| eslint-config-prettier | ^10.1.8 | Disables formatting rules (Prettier handles formatting) |
| eslint-plugin-svelte | ^2.46.1 | Svelte template + script linting |
| eslint-plugin-playwright | ^2.9.0 | Playwright test rules (tests/ workspace only) |

### Config Architecture

```
turbo.json (lint task -- parallel workspace execution)
    |
    +-- packages/shared-config/eslint.config.mjs (centralized rules)
    |       |
    |       +-- apps/frontend/eslint.config.mjs (extends shared + svelte-eslint-parser)
    |       +-- apps/strapi/eslint.config.mjs (extends shared + CJS/Node globals)
    |       +-- apps/docs/eslint.config.js (extends shared + Svelte + Prettier)
    |
    +-- root eslint.config.mjs (re-exports shared config)
    +-- tests/eslint.config.mjs (extends shared + Playwright rules)
```

The shared config in `packages/shared-config/eslint.config.mjs` defines all custom rules. Each workspace config extends it with workspace-specific parser settings and overrides.

## Rule Coverage Comparison

### Shared Config Rules (packages/shared-config/eslint.config.mjs)

| # | ESLint Rule | Config | Oxlint Equivalent | Status | Notes |
|---|-------------|--------|-------------------|--------|-------|
| 1 | `no-console` | `allow: [warn, error, info]` | `eslint/no-console` | AVAILABLE | Full option parity -- supports `allow` array |
| 2 | `no-undef` | `off` | N/A | N/A | Already disabled in project config |
| 3 | `quotes` | `single, avoidEscape` | N/A (Prettier) | N/A | Formatting rule handled by Prettier via `eslint-config-prettier` |
| 4 | `no-restricted-syntax` | `TSEnumDeclaration` ban | NOT BUILT-IN | GAP | Project-specific opinionated rule; acceptable gap per user decision |
| 5 | `func-style` | `declaration, allowArrowFunctions: false` | `eslint/func-style` | AVAILABLE | Full option parity -- supports `declaration` style and `allowArrowFunctions` |
| 6 | `@typescript-eslint/no-duplicate-enum-values` | `off` | N/A | N/A | Already disabled in project config |
| 7 | `@typescript-eslint/array-type` | `default: generic` | `typescript/array-type` | AVAILABLE | Full option parity -- supports `default` with `generic` option |
| 8 | `@typescript-eslint/no-explicit-any` | `ignoreRestArgs: true` | `typescript/no-explicit-any` | AVAILABLE | Full option parity -- supports `ignoreRestArgs` |
| 9 | `@typescript-eslint/naming-convention` | `typeParam T prefix, typeAlias PascalCase` | NOT IMPLEMENTED | GAP | Not in oxlint's rule set; project-specific convention; acceptable gap per user decision |
| 10 | `@typescript-eslint/consistent-type-imports` | `separate-type-imports, prefer type-imports` | `typescript/consistent-type-imports` | AVAILABLE | Full option parity -- supports `prefer`, `fixStyle`, `disallowTypeAnnotations` |
| 11 | `simple-import-sort/exports` | `error` | NO EQUIVALENT | GAP | oxlint has `eslint/sort-imports` but lacks `simple-import-sort` grouping logic; acceptable gap per user decision |
| 12 | `simple-import-sort/imports` | `error, custom groups` | NO EQUIVALENT | GAP | Same as above -- the custom group configuration has no oxlint equivalent |
| 13 | `import/first` | `error` | `import/first` | AVAILABLE | Full parity |
| 14 | `import/newline-after-import` | `error` | `import/newline-after-import` | AVAILABLE | Full parity |
| 15 | `import/no-duplicates` | `error` | `import/no-duplicates` | AVAILABLE | Full parity |
| 16 | `import/consistent-type-specifier-style` | `prefer-top-level` | `import/consistent-type-specifier-style` | AVAILABLE | Full parity |

### Coverage Summary

- **9 of 16 active rules** have direct oxlint equivalents with full option parity
- **3 rules** are N/A (2 disabled, 1 handled by Prettier)
- **4 rules** are gaps (all classified as acceptable per user decision):
  - `no-restricted-syntax` (enum ban) -- project-specific
  - `naming-convention` -- project-specific
  - `simple-import-sort/imports` and `simple-import-sort/exports` -- import sorting

### Svelte-Specific Rules (apps/frontend/eslint.config.mjs)

| Rule Source | Oxlint Status | Gap Impact | Notes |
|-------------|---------------|------------|-------|
| `eslint-plugin-svelte` rules | NOT SUPPORTED | **DEALBREAKER** | JS plugin system does not support `.svelte` custom file formats |
| `svelte-eslint-parser` template parsing | NOT SUPPORTED | **DEALBREAKER** | oxlint parses `<script>` blocks only; template syntax (`bind:`, `on:`, `{#if}`, `{#each}`) not understood |
| `plugin:svelte/prettier` integration | NOT SUPPORTED | **DEALBREAKER** | Svelte formatting rules require template parsing |
| `prefer-const` false positive with `bind:this` | KNOWN BUG | High risk | oxlint flags `bind:this` variables as const-eligible; auto-fix produces TS errors (GitHub oxc#19470) |

### Playwright Rules (tests/eslint.config.mjs)

| Rule Source | Oxlint Status | Notes |
|-------------|---------------|-------|
| `eslint-plugin-playwright` (12 rules configured) | NOT BUILT-IN | Separate concern from main codebase; could potentially use JS plugin API in future |
| `missing-playwright-await` (error) | NOT AVAILABLE | Critical test rule -- would need alternative |
| `no-focused-test` (error) | NOT AVAILABLE | CI safety rule -- would need alternative |

## Performance Benchmark

Informal benchmark run on the OpenVAA monorepo (2026-03-18):

| Metric | ESLint | oxlint | Notes |
|--------|--------|--------|-------|
| **Wall clock time** | 3.4s | 0.29s | ESLint via `yarn lint:check` (Turborepo, partially cached) |
| **Internal lint time** | N/A | 186ms | Reported by oxlint |
| **Speedup factor** | -- | ~12x | Wall clock comparison |
| **Files linted** | ~1,246 (13 workspaces) | 1,298 | oxlint scans all files in one pass |
| **Rules applied** | Varies per workspace | 93 (default set) | ESLint uses workspace-specific configs |
| **Findings** | 77 warnings, 0 errors | 119 warnings, 0 errors | Different rule sets -- not directly comparable |
| **Threads** | Single-threaded per workspace | 14 threads | oxlint uses all available cores |
| **Caching** | Turborepo cache (hit on unchanged) | None (always re-scans) | ESLint benefits from incremental caching |

### Benchmark Context

- **Monorepo size:** ~1,079 TypeScript files + 167 Svelte files across 13 workspaces
- **oxlint version:** 1.56.0
- **Node version:** 22.4.0 (darwin-arm64)
- **ESLint ran via Turborepo** which parallelizes across workspaces and caches unchanged results. A cold ESLint run would be slower.
- **ESLint performance is not a pain point** at this monorepo size. The 3.4s lint time (often partially cached) does not meaningfully impact developer workflow or CI pipeline duration.
- **oxlint findings differ** from ESLint because it ran with default rules (93 rules), not the project's custom configuration. The 119 warnings include false positives specific to Svelte files (e.g., `no-unassigned-vars` for `bind:this` variables).

## Svelte Support Status

### What Works Today

- oxlint extracts and lints `<script>` and `<script lang="ts">` content from `.svelte` files
- Standard JS/TS rules (`no-console`, `no-explicit-any`, `consistent-type-imports`, etc.) apply correctly to script blocks
- No additional configuration needed -- works out of the box for script content

### What Does NOT Work

1. **Template syntax linting** -- oxlint does not parse Svelte template syntax (`{#if}`, `{#each}`, `bind:`, `on:`, slot props, etc.)
2. **eslint-plugin-svelte rules** -- cannot run through oxlint because its JS plugin system does not support custom file formats (`.svelte`, `.vue`, `.astro`)
3. **Cross-template/script analysis** -- e.g., detecting unused props referenced only in templates, or variables assigned via `bind:this`
4. **Known false positives** -- `prefer-const` incorrectly flags `bind:this` variables as const-eligible (GitHub issue oxc#19470). Auto-fixing these produces TypeScript errors.

### Svelte Team's Own Status

The Svelte team has an open issue to migrate their own repository to oxlint (sveltejs/svelte#17665), but it is blocked on:

- JS plugin milestones (some completed, some ongoing)
- `extends` config from `node_modules` support
- `languageOptions.parser` support
- Full framework file format support

### Roadmap

Oxlint's official roadmap states: "Limited support for front-end frameworks' custom file formats (e.g. Svelte, Vue, Angular) -- coming later this year [2026]." The JS Plugins Alpha blog post (2026-03-11) explicitly calls this out as a current limitation.

### Assessment

**Svelte template linting is not feasible with oxlint as of March 2026.** The 167 `.svelte` files in the frontend app represent a significant portion of the codebase and rely on `eslint-plugin-svelte` for template-specific linting and Prettier integration. Per user decision, this is a dealbreaker for full migration.

A hybrid approach (oxlint for `.ts`/`.js` files, ESLint for `.svelte` files) is technically possible but adds configuration complexity for marginal gain given that ESLint performance is not a pain point at this monorepo size.

## Recommendation: DEFER

### Rationale

1. **Svelte template linting is a dealbreaker** -- oxlint cannot lint `.svelte` template syntax, and `eslint-plugin-svelte` cannot run through oxlint's JS plugin system for custom file formats
2. **Known false positives in Svelte files** -- `prefer-const` bug with `bind:this` (oxc#19470) would cause noise and incorrect auto-fixes
3. **Hybrid approach adds complexity** -- running both linters for marginal gain in a ~1,200 file monorepo is not worth the configuration overhead
4. **The Svelte team itself is blocked** on the same limitations (sveltejs/svelte#17665)
5. **ESLint performance is adequate** -- 3.4 seconds (often cached) is not a developer workflow or CI bottleneck

### Trigger Conditions for Re-evaluation

Re-evaluate oxlint migration when ANY of these conditions are met:

1. **oxlint ships Svelte template support** -- either native parsing or via JS plugin system supporting `eslint-plugin-svelte`
2. **oxlint JS plugin API supports custom file formats** (`.svelte`, `.vue`) -- enabling the Svelte ESLint parser to run inside oxlint
3. **Svelte team completes their own oxlint migration** (sveltejs/svelte#17665) -- this would signal ecosystem readiness and likely mean the tooling gaps are resolved
4. **Monorepo grows past 5,000+ files** -- making ESLint performance an actual pain point warranting the complexity of a hybrid or full migration

## Future Migration Path

When trigger conditions are met, the migration path is straightforward:

1. **Generate config:** Run `npx @oxlint/migrate --type-aware` on `packages/shared-config/eslint.config.mjs` to produce `.oxlintrc.json`
2. **Gradual transition:** Install `eslint-plugin-oxlint` in each workspace config to disable ESLint rules that overlap with oxlint, enabling side-by-side execution
3. **Accept documented gaps:** Three rule categories will not carry over:
   - `no-restricted-syntax` (TSEnumDeclaration ban) -- project-specific
   - `@typescript-eslint/naming-convention` -- project-specific
   - `simple-import-sort/imports` + `simple-import-sort/exports` -- import sorting
4. **Update integration points:** Replace `eslint` commands in:
   - `turbo.json` (lint task definition)
   - `.lintstagedrc.json` (pre-commit staged file linting)
   - `.husky/pre-commit` (hook invocation)
   - CI `.github/workflows/main.yaml` (lint validation step)
5. **Validate Svelte files:** Verify all 167 `.svelte` files lint without false positives, specifically testing `bind:this` patterns
6. **Remove ESLint:** After validation, remove ESLint packages and `eslint-plugin-oxlint` bridge

---

**Evaluation date:** 2026-03-18
**Oxlint version tested:** 1.56.0
**Validity period:** ~3 months (re-evaluate by 2026-06-18; oxlint ships rapidly with weekly releases)
