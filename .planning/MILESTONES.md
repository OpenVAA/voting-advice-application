# Milestones

## v2.0 Branch Integration (Shipped: 2026-03-22)

**Phases completed:** 11 phases, 42 plans
**Timeline:** 1 day (2026-03-22)

**Key accomplishments:**

- Integrated Supabase backend (17 tables, 269 pgTAP tests, 3 Edge Functions) from parallel branch
- Built frontend Supabase adapter (DataProvider, DataWriter, AdminWriter, FeedbackWriter) with 85 unit tests
- Migrated auth from Strapi JWT to Supabase cookie-based PKCE sessions with Paraglide i18n preserved
- Migrated E2E test infrastructure (SupabaseAdminClient, Mailpit email, Supabase-format datasets)
- Removed Strapi entirely (262 files, 47,524 lines deleted) with thorough codebase cleanup
- Updated CI pipeline (pgTAP job, skill-drift-check, Supabase CLI E2E) and documentation
- Integrated 15 Claude Skills files and merged planning artifacts from parallel branch

### Known Gaps

- 10 E2E tests skipped due to Svelte 5 `pushState` reactivity bug (framework-level issue)
- Phase 37 Plan 03 (FIXME/TODO audit) not formally executed
- `candidate-questions` test dataset lacks `customData.allowOpen = true`

---

## v1.4 Svelte 5 Migration (Candidate App) (Shipped: 2026-03-22)

**Phases completed:** 2 phases, 7 plans, 14 tasks

**Key accomplishments:**

- 10 candidate route files migrated to Svelte 5 runes mode: 3 layouts with snippet children, forgot-password with native onsubmit, questions page with $derived, and 5 simple page runes opt-ins
- 7 candidate auth/preregister pages migrated to Svelte 5 runes with $derived, $effect, $state, and page from $app/state
- Migrated 4 candidate route files (root layout, home, preview, settings) to Svelte 5 runes with $effect, $derived.by(), $state, and snippet children
- 4 most complex candidate route files migrated: profile ($derived.by submit routing), questions layout ($effect redirect/progress), [questionId] (D-07 derivation/effect split), protected layout (D-10 async $effect data-loading)
- Zero legacy Svelte 4 patterns across all 25 candidate route files confirmed; svelte-check reports zero TypeScript errors (120 warnings non-blocking)
- Diagnosed SES email tests as environment issue (conflicting Vite server), fixed hooks.server.ts locale bug, achieved 18/20 candidate E2E tests passing with 2 remaining Vite dev mode streaming issues
- Fixed 2 failing candidate E2E registration tests via API-based ToU workaround, cookie domain transfer, and auth rate limit mitigation -- all 20 candidate tests now pass

---

## v1.3 Svelte 5 Migration (Content) (Shipped: 2026-03-20)

**Phases completed:** 5 phases, 19 plans
**Timeline:** 3 days (2026-03-18 → 2026-03-20)
**Branch:** feat-gsd-roadmap (99 commits, 334 files, +18.2k/-4.3k lines)
**Requirements:** 20/20 satisfied

**Key accomplishments:**

- 98 shared and voter-app leaf components migrated to Svelte 5 runes mode ($props, $derived, $effect, $bindable)
- All container components converted from named slots to snippet props with 39+ route consumer updates
- All voter route pages and layouts migrated from $: reactive statements to $derived/$effect runes
- All TODO[Svelte 5] markers resolved in v1.3 scope; candidate app call sites updated for API changes
- Zero legacy Svelte 4 patterns remaining in voter app routes and shared components
- All 26 voter-app E2E tests passing after full migration with zero TypeScript errors

### Known Gaps

- **Nyquist validation:** Partial across phases 23-26 (phase 24 missing VALIDATION.md)
- **Snippet reactivity bug:** $state mutations in event handlers don't trigger re-render in {#snippet} blocks (likely Svelte 5 core issue)
- **E2E test count:** Requirement stated "92 tests" but voter-app scope is 26 tests (all passing)
- **2 pre-existing test failures:** auth-setup (Strapi timeout), voter-settings category intros (data configuration)

---

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
