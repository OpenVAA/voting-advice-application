# Research Summary: Svelte 5 Frontend Migration Infrastructure

**Domain:** Frontend framework migration infrastructure
**Researched:** 2026-03-15
**Overall confidence:** HIGH

## Executive Summary

The Svelte 5 infrastructure migration for OpenVAA is a well-scoped change that affects primarily the frontend build tooling and CSS architecture, with zero impact on the backend, shared packages, Docker, CI, or E2E testing infrastructure. The "fresh scaffold replacement-in-place" strategy is validated: replace config files (`svelte.config.js`, `vite.config.ts`, `postcss.config.cjs`, `tailwind.config.mjs`, `app.css`, `vitest.config.ts`) with Svelte 5-compatible versions while preserving the monorepo integration points (path aliases, TypeScript references, workspace dependencies, Turborepo tasks).

The most complex change is the Tailwind 3-to-4 + DaisyUI 4-to-5 migration, which moves the entire CSS toolchain from JavaScript configuration to CSS-first configuration. The current `tailwind.config.mjs` (283 lines) with custom themes, spacing scales, font definitions, and DaisyUI plugin setup must be translated to `@theme {}` blocks, `@plugin "daisyui/theme"` blocks, and `@utility` directives in `app.css`. A critical challenge is the dynamic color system that reads from `@openvaa/app-shared` at build time -- this needs a new approach using CSS custom property overrides at runtime.

The Svelte 5 compiler changes (runes, snippets, component functions) do NOT affect the infrastructure milestone. Svelte 5 runs existing Svelte 4 component syntax unchanged -- the migration tool handles component-level syntax changes, which are deferred to the content migration milestone. Similarly, the i18n system (`sveltekit-i18n`) uses stores that remain fully compatible with Svelte 5.

The monorepo architecture (Turborepo, Docker, CI, Playwright E2E, workspace packages) is entirely framework-agnostic and requires zero changes for the Svelte 5 migration.

## Key Findings

**Stack:** Svelte 5 + SvelteKit 2 (latest) + Tailwind CSS 4 + DaisyUI 5, replacing svelte-preprocess with native TS support, PostCSS with @tailwindcss/vite, JS config with CSS-first @theme/@plugin
**Architecture:** 5 config files replaced, 2 deleted, Docker/CI/Turborepo/E2E unchanged; dynamic theme colors need CSS custom property approach
**Critical pitfall:** The dynamic `staticSettings` color system in `tailwind.config.mjs` is incompatible with Tailwind 4 CSS-first config and needs a new integration strategy

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Dependency Updates + Scaffold** - Update package.json dependencies, replace svelte.config.js and vite.config.ts
   - Addresses: Core Svelte 5 + Vite upgrade, preprocessor removal
   - Avoids: Breaking builds by changing CSS and deps simultaneously

2. **CSS Architecture Migration** - Rewrite app.css for Tailwind 4 + DaisyUI 5 with theme migration
   - Addresses: Complete Tailwind/DaisyUI modernization, custom theme preservation
   - Avoids: The most complex change (CSS architecture) being mixed with dependency resolution

3. **i18n Evaluation** - Assess sveltekit-i18n Svelte 5 compatibility and Paraglide as alternative
   - Addresses: Understanding long-term i18n path before content migration
   - Avoids: Premature i18n migration during infrastructure work

4. **Full Dependency Bump** - Update all remaining monorepo dependencies to latest
   - Addresses: Keeping the full monorepo current
   - Avoids: Mixing framework-specific changes with general dependency maintenance

5. **Validation** - Build verification, Docker test, CI pipeline validation
   - Addresses: End-to-end confidence that infrastructure works
   - Avoids: Discovering integration issues late

**Phase ordering rationale:**
- Dependencies first because CSS migration needs Tailwind 4 + DaisyUI 5 installed
- CSS architecture second because it is the most complex and isolated change
- i18n evaluation third because it informs the content migration milestone
- Full dep bump fourth because it is independent of framework changes
- Validation last because it tests the integrated result

**Research flags for phases:**
- Phase 2 (CSS Architecture): Likely needs deeper research on DaisyUI 5 custom theme variables and dynamic color override patterns
- Phase 3 (i18n): Needs investigation of Paraglide vs sveltekit-i18n for the specific dynamic translation loading pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official docs and release notes |
| Features | HIGH | Clear scope -- infrastructure only, content deferred |
| Architecture | HIGH | Docker, CI, Turborepo verified unchanged; config changes documented |
| CSS Migration | MEDIUM | DaisyUI 5 custom theme format verified, but dynamic color integration needs implementation testing |
| i18n | MEDIUM | sveltekit-i18n works with Svelte 5 via store compatibility, but long-term maintenance unclear |
| Pitfalls | HIGH | Well-documented migration paths from official sources |

## Gaps to Address

- Dynamic `staticSettings` color integration with CSS-first Tailwind 4 -- needs implementation spike
- `svelte-visibility-change` package Svelte 5 compatibility -- unknown, check when upgrading
- `ai` package build failure -- pre-existing, evaluate removal or fix during dep bump
- Capacitor dependencies (`@capacitor/*`) -- evaluate if still needed or can be removed
- `sveltekit-i18n` long-term maintenance -- evaluate during i18n phase
- Vite 6 compatibility with latest SvelteKit 2 -- verify during dependency updates
