# Milestones

## v1.2 Svelte 5 Migration (Infrastructure) (Shipped: 2026-03-18)

**Phases completed:** 7 phases, 14 plans
**Timeline:** 3 days (2026-03-15 → 2026-03-18)
**Branch:** feat-gsd-roadmap (96 commits, 861 files, +29.5k/-6.3k lines)
**Requirements:** 31/31 satisfied

**Key accomplishments:**

- Fresh SvelteKit 2 + Svelte 5 scaffold with native TypeScript, @tailwindcss/vite replacing PostCSS
- Tailwind 4 CSS-first configuration with DaisyUI 5 and full theme token migration from JS to CSS
- Migrated i18n from sveltekit-i18n to Paraglide JS — 740 call sites, compile-time type safety, runtime override wrapper
- Full monorepo dependency bump with Yarn catalog expansion (13 → 30 entries)
- Node 22 migration with Docker, CI, and 92 E2E tests validated end-to-end
- OXC toolchain evaluated and deferred (Svelte template linting not supported)
- Migration cleanup: dead code removal and TypeScript error fixes

### Known Gaps

- **Nyquist validation:** Incomplete across phases (draft/missing VALIDATION.md files)
- **Human testing debt:** Language switching and runtime overrides need live Docker stack testing
- **Svelte 5 runes:** 13 TODO[Svelte 5] markers deferred to content migration milestone

---

## v1.1 Monorepo Refresh (Shipped: 2026-03-15)

**Phases completed:** 6 phases, 15 plans
**Timeline:** 4 days (2026-03-12 → 2026-03-15)
**Branch:** feat-gsd-roadmap (87 commits, 1,717 files, +14.7k/-3.2k lines)
**Requirements:** 23/24 satisfied (VER-04 deferred by user)

**Key accomplishments:**

- Turborepo integration with cached parallel builds and dependency-aware task orchestration
- Monorepo restructured to apps/ + packages/ convention with full Docker/CI/E2E updates
- Changesets for automated versioning, changelogs, and release PRs
- npm publishing readiness — tsup builds, metadata, fresh install verified for 4 packages (@openvaa/core, data, matching, filters)
- Yarn 4.13 with dependency catalogs and Vercel remote caching in CI
- Tech debt cleanup — 9 audit items resolved across pre-commit hooks, version strings, docs

### Known Gaps

- **VER-04**: Changeset bot for PRs — deferred by user (can be installed later via GitHub App)
- **PUB-01**: @openvaa npm org — partial (registry check passed, human must confirm access credentials)
- **Phase 14**: Trusted publishing postponed until after initial manual npm publish

---

## v1.0 E2E Testing Framework (Shipped: 2026-03-12)

**Phases completed:** 7 phases, 31 plans
**Timeline:** 11 days (2026-03-01 → 2026-03-11)
**Branch:** feat-gsd-roadmap (147 commits, 268 files, +31k/-889 lines)
**Requirements:** 56/56 satisfied

**Key accomplishments:**

- Rebuilt Playwright infrastructure: upgrade to 1.58.2, project dependencies, API data management, 53+ testId attributes
- Complete candidate app coverage: auth, registration, profile, questions, settings, app modes (15 requirements)
- Complete voter app journey: landing through results, matching verification, entity details (19 requirements)
- Configuration variant testing: multi-election, constituency, results sections via overlay datasets
- CI pipeline with GitHub Actions, HTML reports, @smoke/@voter/@candidate tagging
- Visual regression and performance benchmarks as opt-in test capabilities

---
