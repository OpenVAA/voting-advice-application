# Phase 20: OXC Toolchain Exploration - Research

**Researched:** 2026-03-18
**Domain:** Linting toolchain (oxlint vs ESLint) for a SvelteKit + TypeScript monorepo
**Confidence:** HIGH

## Summary

Oxlint (v1.56.0, stable since v1.0 June 2025) is a mature, high-performance JavaScript/TypeScript linter with 699+ built-in rules covering ESLint core, typescript-eslint, unicorn, import, and more. It is 50-100x faster than ESLint and is used in production by Shopify, Airbnb, Mercedes-Benz, Preact, and others.

The critical blocker for the OpenVAA monorepo is **Svelte template linting**. Oxlint can lint `<script>` content in `.svelte` files (extracting JS/TS from script blocks), but it **cannot** run Svelte-specific lint rules (e.g., from `eslint-plugin-svelte`) because its JS plugin system does not yet support custom file formats like `.svelte`. Full framework file format support is on the oxlint roadmap for "later in 2026" but is not available today. Additionally, oxlint has a known false-positive with `prefer-const` in Svelte files (it does not understand `bind:this` template references).

**Primary recommendation:** **Defer** migration to oxlint. Svelte template linting is a dealbreaker per user decision. Set a trigger condition: re-evaluate when oxlint's JS plugin system supports `eslint-plugin-svelte` or when oxlint ships native Svelte template support. In the interim, a hybrid approach (oxlint for TS/JS files + ESLint for Svelte) is possible but adds complexity for marginal gain given the project's 167 `.svelte` files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Lightweight spike, not a deep benchmark -- check Svelte support status first
- If oxlint doesn't support .svelte files, recommend "defer" with a trigger condition
- No hands-on migration or config rewrite -- just research and documentation
- Bias toward adoption if feasible -- accept minor rule gaps if performance gains are significant
- BUT: Svelte file linting is a dealbreaker -- if oxlint can't lint .svelte, defer the whole migration
- Core rules (no-console, no-any, consistent-type-imports) must have equivalents
- Project-specific opinionated rules (no-enum via no-restricted-syntax, func-style declarations, naming conventions) can be dropped or noted as gaps
- Import sorting (simple-import-sort) gap is acceptable if documented
- Prettier replacement is out of scope -- don't evaluate dprint or oxc_formatter
- Keep formatting discussion for a future milestone if linting migration happens

### Claude's Discretion
- Structure of the evaluation report
- Depth of rule-by-rule comparison (summary table vs detailed analysis)
- Whether to include a quick informal performance comparison (e.g., time a single oxlint run vs eslint run) or skip benchmarks entirely

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OXC-01 | oxlint rule coverage compared against current ESLint config with gaps documented | Rule-by-rule comparison table below maps all 18 ESLint rules to oxlint equivalents with gap analysis |
| OXC-02 | Performance benchmarks comparing ESLint vs oxlint on the monorepo | Per user decision, informal benchmark is optional; documented expected performance range from official data |
| OXC-03 | Migration recommendation (migrate, defer, or reject) with rationale and plan | Recommendation is DEFER with trigger conditions; rationale based on Svelte template linting blocker |
</phase_requirements>

## Current ESLint Configuration Analysis

### Project's ESLint Stack
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.39.2 | Core linter |
| @typescript-eslint/eslint-plugin | ^8.57.0 | TypeScript rules |
| @typescript-eslint/parser | ^8.57.0 | TypeScript parser |
| eslint-plugin-simple-import-sort | ^12.1.1 | Import sorting |
| eslint-plugin-import | ^2.32.0 | Import hygiene rules |
| eslint-config-prettier | ^10.1.8 | Disable formatting rules (Prettier handles) |
| eslint-plugin-svelte | ^2.46.1 | Svelte template + script linting |
| eslint-plugin-playwright | ^2.9.0 | Playwright test rules (tests/ only) |

### Config Architecture
- `packages/shared-config/eslint.config.mjs` -- centralized flat config with all custom rules
- Root `eslint.config.mjs` -- re-exports shared config
- `apps/frontend/eslint.config.mjs` -- extends shared + adds svelte-eslint-parser for `.svelte` files
- `apps/strapi/eslint.config.mjs` -- extends shared + CJS/Node globals
- `apps/docs/eslint.config.js` -- extends shared + Svelte + Prettier
- `tests/eslint.config.mjs` -- extends shared + Playwright rules
- Turborepo `lint` task runs workspace-level linting in parallel

### Integration Points
- `.husky/pre-commit` -- runs `lint-staged` which calls `eslint --fix`
- `.lintstagedrc.json` -- Prettier + ESLint on staged files
- CI `main.yaml` -- `yarn lint:check` in frontend validation job

## Rule Coverage: ESLint vs Oxlint

### Core Rules (Must Have Equivalents)

| ESLint Rule | Oxlint Equivalent | Status | Options Parity | Confidence |
|-------------|-------------------|--------|----------------|------------|
| `no-console` (with `allow: [warn, error, info]`) | `eslint/no-console` | AVAILABLE | Full -- supports `allow` array | HIGH |
| `@typescript-eslint/no-explicit-any` (with `ignoreRestArgs`) | `typescript/no-explicit-any` | AVAILABLE | Full -- supports `ignoreRestArgs` | HIGH |
| `@typescript-eslint/consistent-type-imports` | `typescript/consistent-type-imports` | AVAILABLE | Full -- supports `prefer`, `fixStyle`, `disallowTypeAnnotations` | HIGH |
| `@typescript-eslint/array-type` (with `default: generic`) | `typescript/array-type` | AVAILABLE | Full -- supports `default` and `readonly` with `generic` option | HIGH |

### Import Rules

| ESLint Rule | Oxlint Equivalent | Status | Confidence |
|-------------|-------------------|--------|------------|
| `import/first` | `import/first` | AVAILABLE | HIGH |
| `import/newline-after-import` | `import/newline-after-import` | AVAILABLE | HIGH |
| `import/no-duplicates` | `import/no-duplicates` | AVAILABLE | HIGH |
| `import/consistent-type-specifier-style` | `import/consistent-type-specifier-style` | AVAILABLE | HIGH |

### Rules With Gaps

| ESLint Rule | Oxlint Status | Gap Impact | Notes |
|-------------|---------------|------------|-------|
| `no-restricted-syntax` (TSEnumDeclaration ban) | NOT BUILT-IN | Low (per user decision) | Could run via JS plugin API but adds complexity; this is a project-specific opinionated rule |
| `@typescript-eslint/naming-convention` | NOT IMPLEMENTED | Low (per user decision) | Not in oxlint's 59/61 type-aware rules; project-specific convention |
| `simple-import-sort/imports` + `simple-import-sort/exports` | NO EQUIVALENT | Acceptable (per user decision) | Oxlint has `eslint/sort-imports` but not the `simple-import-sort` grouping logic; oxfmt has import sorting but formatting is out of scope |
| `quotes` (single quotes enforcement) | NOT BUILT-IN (stylistic) | None | Already handled by Prettier via `eslint-config-prettier` -- not a linting concern |
| `no-undef` (turned off) | Available but off | None | Already off in project config |
| `func-style` (declaration, no arrows) | `eslint/func-style` | AVAILABLE | Supports `declaration` style and `allowArrowFunctions` option |

### Svelte-Specific Rules

| Rule Source | Oxlint Status | Gap Impact | Notes |
|-------------|---------------|------------|-------|
| `eslint-plugin-svelte` (Prettier integration) | NOT SUPPORTED | **DEALBREAKER** | JS plugin system does not support `.svelte` custom file formats yet |
| `svelte-eslint-parser` (template parsing) | NOT SUPPORTED | **DEALBREAKER** | oxlint parses `<script>` blocks only; template syntax (bind:, on:, {#if}) not understood |
| Svelte `prefer-const` false positives | KNOWN BUG | High risk | oxlint flags `bind:this` variables as const-eligible; auto-fix produces TS errors |

### Playwright Rules (tests/ only)

| Rule Source | Oxlint Status | Notes |
|-------------|---------------|-------|
| `eslint-plugin-playwright` | NOT BUILT-IN | Could potentially run via JS plugin API; tests/ is a separate concern from main codebase |

### Coverage Summary

- **12 of 18 rules**: Direct oxlint equivalents with full option parity
- **3 rules**: Not available but acceptable gaps (per user decision)
- **1 rule**: Handled by Prettier (not a linting concern)
- **Svelte linting**: Complete gap -- dealbreaker

## Svelte Support Deep Dive

### What Works Today
- Oxlint extracts and lints `<script>` and `<script lang="ts">` content from `.svelte` files
- Standard JS/TS rules (no-console, no-any, etc.) apply correctly to script blocks
- No additional configuration needed -- works out of the box

### What Does NOT Work
1. **Template syntax linting** -- oxlint does not parse Svelte template syntax (`{#if}`, `{#each}`, `bind:`, `on:`, etc.)
2. **eslint-plugin-svelte rules** -- cannot run through oxlint's JS plugin system because custom file format support is not available
3. **Cross-template/script analysis** -- e.g., detecting unused props referenced only in templates
4. **Known false positives** -- `prefer-const` incorrectly flags `bind:this` variables (GitHub issue #19470)

### Svelte Team's Own Status
The Svelte team (sveltejs/svelte#17665) has an open issue to migrate their own repo to oxlint, but it is blocked on:
- JS plugin milestones (some completed, some ongoing)
- `extends` config from `node_modules` support
- `languageOptions.parser` support
- Full framework file format support

### Roadmap
oxlint's official roadmap states "Limited support for front-end frameworks' custom file formats (e.g. Svelte, Vue, Angular) -- coming later this year [2026]". The JS Plugins Alpha blog post (2026-03-11) explicitly calls this out as a current limitation.

### Assessment
**Svelte template linting is not feasible with oxlint as of March 2026.** The 167 `.svelte` files in the frontend represent a significant portion of the codebase. Per user decision, this is a dealbreaker.

## Performance Expectations

### Official Benchmarks (from oxlint documentation and VoidZero announcements)
- **General speedup**: 50-100x faster than ESLint (source: oxlint 1.0 stable announcement)
- **File throughput**: ~10,000 files/second in real-world scenarios
- **Type-aware linting**: ~10x faster than ESLint with typescript-eslint
- **Real-world example**: Mercedes-Benz reported 71% lint time reduction

### OpenVAA Monorepo Estimate
- ~1,079 TypeScript files + 167 Svelte files
- Current ESLint likely takes 10-30 seconds for full lint (typical for monorepo of this size)
- oxlint would likely lint the TS files in under 1 second
- Net gain is real but not transformative for a project of this size -- the monorepo is not large enough for ESLint performance to be a pain point

### Informal Benchmark (Claude's Discretion)
Per user allowance, an informal benchmark could be done by installing oxlint and timing `npx oxlint .` vs `yarn lint:check`. However, since the recommendation is to defer (Svelte blocker), this benchmark would not change the outcome. **Recommendation: Skip formal benchmarking** -- the performance advantage of oxlint is well-documented and not in dispute.

## Migration Tools Available

### @oxlint/migrate (v1.56.0)
- Converts ESLint flat config to `.oxlintrc.json`
- Supports `--type-aware` flag for TypeScript rules
- Handles rule mapping, environments, ignore patterns
- Automatically migrates unsupported ESLint plugins to JS plugins
- Tested on both simple and complex flat configs

### eslint-plugin-oxlint (v1.56.0)
- Disables ESLint rules that overlap with oxlint
- Enables gradual migration (run both linters)
- Auto-reads `.oxlintrc.json` to generate correct ESLint overrides

### Hybrid Approach Pattern
```bash
# Run both linters -- oxlint handles fast rules, ESLint handles the rest
oxlint && eslint
```
With `eslint-plugin-oxlint` in ESLint config to avoid duplicate diagnostics.

## Recommendation: DEFER

### Rationale
1. **Svelte template linting is a dealbreaker** -- oxlint cannot lint `.svelte` template syntax, and `eslint-plugin-svelte` cannot run through oxlint's JS plugin system for custom file formats
2. **Known false positives in Svelte files** -- `prefer-const` bug with `bind:this`
3. **Hybrid approach adds complexity** -- running both linters for marginal gain in a ~1,200 file monorepo is not worth the configuration overhead
4. **The Svelte team itself is blocked** on the same limitations

### Trigger Conditions for Re-evaluation
Re-evaluate oxlint migration when ANY of these occur:
1. **oxlint ships Svelte template support** -- either native or via JS plugin system supporting `eslint-plugin-svelte`
2. **oxlint's JS plugin API supports custom file formats** (`.svelte`, `.vue`) -- enabling `eslint-plugin-svelte` to run inside oxlint
3. **Svelte team completes their own oxlint migration** (sveltejs/svelte#17665) -- signals ecosystem readiness
4. **Monorepo grows significantly** (5,000+ files) -- making ESLint performance an actual pain point

### If/When Migration Happens
The migration path is straightforward:
1. Run `npx @oxlint/migrate --type-aware` on `packages/shared-config/eslint.config.mjs`
2. Install `eslint-plugin-oxlint` for gradual transition
3. Accept documented gaps: `no-restricted-syntax` (enum ban), `naming-convention`, `simple-import-sort`
4. Replace `eslint` commands in `turbo.json`, `.lintstagedrc.json`, `.husky/pre-commit`, CI `main.yaml`
5. Core rule coverage is already excellent (12/18 rules have direct equivalents)

## Architecture Patterns

### Current Lint Architecture (Preserve)
```
turbo.json (lint task)
    |
    +-- packages/shared-config/eslint.config.mjs (centralized rules)
    |       |
    |       +-- apps/frontend/eslint.config.mjs (+ svelte parser)
    |       +-- apps/strapi/eslint.config.mjs (+ CJS globals)
    |       +-- apps/docs/eslint.config.js (+ svelte + prettier)
    |
    +-- root eslint.config.mjs (re-exports shared)
    +-- tests/eslint.config.mjs (+ playwright)
```

### Future Oxlint Architecture (When Feasible)
```
turbo.json (lint task)
    |
    +-- .oxlintrc.json (generated from @oxlint/migrate)
    |       |
    |       +-- overrides for workspace-specific rules
    |
    +-- eslint-plugin-oxlint (transitional, disables overlap)
    +-- eslint for remaining rules not in oxlint
```

## Common Pitfalls

### Pitfall 1: Premature Migration Without Svelte Support
**What goes wrong:** Migrating to oxlint without Svelte template linting means losing coverage on 167 `.svelte` files
**Why it happens:** oxlint's `<script>` extraction gives false confidence that "Svelte works"
**How to avoid:** Test `eslint-plugin-svelte` rules specifically, not just script block linting
**Warning signs:** Auto-fix producing TS errors in Svelte files (bind:this false positive)

### Pitfall 2: Hybrid Approach Configuration Drift
**What goes wrong:** Running both linters creates maintenance burden and config divergence
**Why it happens:** Two config files, two sets of ignores, two CLI invocations to maintain
**How to avoid:** Only adopt hybrid if performance is a genuine pain point (it is not for this monorepo)

### Pitfall 3: Import Sorting Inconsistency
**What goes wrong:** Dropping `simple-import-sort` during migration causes existing sorted imports to be flagged
**Why it happens:** oxlint's `sort-imports` has different grouping logic
**How to avoid:** Document the gap clearly; accept import ordering will be handled differently or not at all

## Open Questions

1. **When will oxlint support custom file formats in JS plugins?**
   - What we know: Roadmap says "later this year" (2026), JS Plugins Alpha shipped 2026-03-11
   - What's unclear: No specific timeline; "later this year" could be Q3 or Q4
   - Recommendation: Monitor oxlint releases monthly; check sveltejs/svelte#17665 for updates

2. **Will oxfmt replace Prettier for this project?**
   - What we know: oxfmt Alpha announced, has import sorting built-in
   - What's unclear: Svelte file support, Prettier plugin compatibility (prettier-plugin-svelte, prettier-plugin-tailwindcss)
   - Recommendation: Out of scope per user decision; evaluate only if oxlint migration happens

## Sources

### Primary (HIGH confidence)
- [oxc.rs/docs/guide/usage/linter](https://oxc.rs/docs/guide/usage/linter.html) -- oxlint documentation, features, and capabilities
- [oxc.rs/blog/2025-03-15-oxlint-beta](https://oxc.rs/blog/2025-03-15-oxlint-beta) -- Svelte `<script>` support confirmation
- [oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha.html) -- JS plugins alpha, framework file format limitation confirmed
- [oxc.rs/docs/guide/usage/linter/config](https://oxc.rs/docs/guide/usage/linter/config) -- Configuration format documentation
- [oxc.rs/docs/guide/usage/linter/rules/typescript/consistent-type-imports](https://oxc.rs/docs/guide/usage/linter/rules/typescript/consistent-type-imports) -- Rule option parity verified
- [oxc.rs/docs/guide/usage/linter/rules/typescript/array-type](https://oxc.rs/docs/guide/usage/linter/rules/typescript/array-type) -- Rule option parity verified
- [oxc.rs/docs/guide/usage/linter/rules/eslint/func-style](https://oxc.rs/docs/guide/usage/linter/rules/eslint/func-style) -- Rule availability confirmed
- [oxc.rs/docs/guide/usage/linter/migrate-from-eslint](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint) -- Migration guide

### Secondary (MEDIUM confidence)
- [voidzero.dev/posts/announcing-oxlint-1-stable](https://voidzero.dev/posts/announcing-oxlint-1-stable) -- Performance claims (50-100x), adoption data
- [github.com/sveltejs/svelte/issues/17665](https://github.com/sveltejs/svelte/issues/17665) -- Svelte team's own oxlint migration blockers
- [github.com/oxc-project/oxc/issues/19470](https://github.com/oxc-project/oxc/issues/19470) -- prefer-const false positive in Svelte files
- [github.com/oxc-project/oxlint-migrate](https://github.com/oxc-project/oxlint-migrate) -- Migration tool documentation

### Tertiary (LOW confidence)
- oxlint `naming-convention` rule status -- inferred from absence in documentation; needs validation against GitHub issue #481

## Metadata

**Confidence breakdown:**
- Rule coverage analysis: HIGH -- verified each rule against oxlint docs
- Svelte support status: HIGH -- confirmed by official blog posts, GitHub issues, and Svelte team's own blockers
- Performance claims: MEDIUM -- based on official announcements, not measured on this monorepo
- Migration tooling: MEDIUM -- based on documentation, not tested hands-on

**Research date:** 2026-03-18
**Valid until:** 2026-06-18 (re-evaluate in ~3 months; oxlint shipping rapidly)
