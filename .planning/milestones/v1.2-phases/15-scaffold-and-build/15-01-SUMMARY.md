---
phase: 15-scaffold-and-build
plan: 01
subsystem: infra
tags: [svelte5, sveltekit2, tailwindcss4, vite, postcss-removal, css-migration]

# Dependency graph
requires: []
provides:
  - "Svelte 5 + SvelteKit 2 build configuration with adapter-node"
  - "@tailwindcss/vite pipeline replacing PostCSS"
  - "@config bridge for existing tailwind.config.mjs and DaisyUI 4"
  - "@source inline() safelist migration for dynamic color classes"
  - "@reference patches for 21 component style blocks"
affects: [16-css-architecture, 17-i18n-migration, 18-dependency-cleanup, 19-validation]

# Tech tracking
tech-stack:
  added: ["@tailwindcss/vite@^4.2.1", "svelte@^5.53.12", "@sveltejs/vite-plugin-svelte@^4.0.4", "svelte-check@^4.4.5", "tailwindcss@^4.2.1", "@sveltejs/adapter-node@^5.5.4", "@sveltejs/kit@^2.55.0"]
  patterns: ["@import tailwindcss + @config bridge for TW3->TW4 migration", "@reference tailwindcss in scoped style blocks with @apply", "@source inline() for safelist replacement"]

key-files:
  created: []
  modified:
    - "apps/frontend/svelte.config.js"
    - "apps/frontend/vite.config.ts"
    - "apps/frontend/vitest.config.ts"
    - "apps/frontend/package.json"
    - "apps/frontend/src/app.css"
    - "apps/frontend/postcss.config.cjs (deleted)"

key-decisions:
  - "Removed vite-tsconfig-paths along with svelte-preprocess -- workspace imports expected to work via preserveSymlinks"
  - "Used explicit @source inline() with dark: prefix for safelist dark variant instead of brace expansion shorthand"
  - "Kept tsconfig.json unchanged -- existing monorepo references and shared-config extends are already Svelte 5 compatible"
  - "Left app.html and app.d.ts unchanged as they already match desired patterns"

patterns-established:
  - "@reference tailwindcss: Required first line in any <style lang=postcss> block that uses @apply"
  - "@config bridge: tailwind.config.mjs loaded via @config directive in app.css for backward compat"
  - "@source inline: Brace expansion pattern for generating dynamic utility classes"

requirements-completed: [SCAF-01, SCAF-02, SCAF-03, SCAF-04, SCAF-05]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 15 Plan 01: Scaffold and Build Summary

**SvelteKit 2 + Svelte 5 scaffold with @tailwindcss/vite pipeline, @config bridge for existing JS config, and @reference patches for 21 component style blocks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T15:44:41Z
- **Completed:** 2026-03-15T15:49:00Z
- **Tasks:** 2
- **Files modified:** 28 (6 config + 22 source)

## Accomplishments
- Replaced svelte.config.js with Svelte 5 native TypeScript support (no svelte-preprocess)
- Replaced vite.config.ts with @tailwindcss/vite plugin before sveltekit()
- Migrated app.css from @tailwind directives to @import "tailwindcss" + @config bridge + @source inline() safelist
- Added @reference "tailwindcss" to all 21 component style blocks that use @apply
- Updated package.json: svelte ^5, vite-plugin-svelte ^4, svelte-check ^4, tailwindcss ^4
- Removed svelte-preprocess, autoprefixer, postcss, adapter-auto, vite-tsconfig-paths
- Deleted postcss.config.cjs

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate scaffold and replace config files** - `c610d4049` (feat)
2. **Task 2: Migrate CSS pipeline and patch style blocks** - `428d9aaf3` (feat)

## Files Created/Modified
- `apps/frontend/svelte.config.js` - SvelteKit config with adapter-node, path aliases, no preprocessor
- `apps/frontend/vite.config.ts` - Vite config with @tailwindcss/vite + sveltekit plugins
- `apps/frontend/vitest.config.ts` - Vitest config with base svelte() plugin only
- `apps/frontend/package.json` - Updated to Svelte 5 + Tailwind 4 dependency versions
- `apps/frontend/postcss.config.cjs` - Deleted (PostCSS replaced by @tailwindcss/vite)
- `apps/frontend/src/app.css` - Rewritten with @import, @config, @source inline, preserved layers
- `apps/frontend/src/lib/components/alert/Alert.svelte` - Added @reference
- `apps/frontend/src/lib/components/button/Button.svelte` - Added @reference
- `apps/frontend/src/lib/components/expander/Expander.svelte` - Added @reference
- `apps/frontend/src/lib/components/input/Input.svelte` - Added @reference
- `apps/frontend/src/lib/components/input/InputGroup.svelte` - Added @reference
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` - Added @reference
- `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte` - Added @reference
- `apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte` - Added @reference
- `apps/frontend/src/lib/components/toggle/Toggle.svelte` - Added @reference
- `apps/frontend/src/lib/components/video/Video.svelte` - Added @reference
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` - Added @reference
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` - Added @reference
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` - Added @reference
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte` - Added @reference
- `apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte` - Added @reference
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` - Added @reference
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/privacy/+page.svelte` - Added @reference
- `apps/frontend/src/routes/[[lang=locale]]/Banner.svelte` - Added @reference
- `apps/frontend/src/routes/[[lang=locale]]/Header.svelte` - Added @reference
- `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/profile/+page.svelte` - Added @reference
- `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte` - Added @reference
- `yarn.lock` - Updated lockfile

## Decisions Made
- Removed vite-tsconfig-paths along with other obsolete deps -- workspace imports should work via preserveSymlinks and SvelteKit native resolution. If imports break, Plan 02 will add it back.
- Used separate @source inline() line with explicit `dark:fill-` prefix instead of `{dark|}fill-` brace expansion shorthand, since the latter syntax may not be universally supported.
- Kept tsconfig.json completely unchanged -- the existing extends chain and monorepo references are already compatible with Svelte 5.
- Left app.html and app.d.ts untouched as they already match the desired patterns exactly.
- Generated fresh scaffold via `npx sv create` for reference but wrote configs manually based on research to preserve project-specific settings.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Build configuration ready for Plan 02 verification (vite dev, vite build, vitest)
- @config bridge in place for Phase 16 CSS-first migration
- All 21 style blocks patched and ready for Tailwind 4 processing
- Svelte 5 dependencies installed; Svelte 4 syntax will compile with deprecation warnings

---
*Phase: 15-scaffold-and-build*
*Completed: 2026-03-15*
