---
phase: 15-scaffold-and-build
plan: 02
subsystem: infra
tags: [svelte5, tailwindcss4, daisyui4-compat, vite-build, vitest]

# Dependency graph
requires:
  - phase: 15-01
    provides: "Svelte 5 + SvelteKit 2 scaffold config files and @tailwindcss/vite pipeline"
provides:
  - "Working production build (vite build with adapter-node) on Svelte 5 + Tailwind 4"
  - "Working dev server (vite dev) with Svelte 5 compilation"
  - "DaisyUI 4 compatibility layer for Tailwind 4 (pre-built CSS + custom theme variables)"
  - "tailwind-theme.css reference file for scoped style blocks with custom config"
  - "Vitest config operational (pre-existing $lib alias failures documented)"
affects: [16-css-architecture, 17-i18n-migration, 18-dependency-cleanup, 19-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DaisyUI 4 loaded as pre-built CSS imports instead of TW4 plugin (incompatible API)"
    - "@theme block registers DaisyUI semantic colors for TW4 utility generation"
    - "tailwind-theme.css as @reference target for scoped <style> blocks"
    - "Custom component class @apply inlined (TW4 cannot @apply custom classes)"
    - "text-color/opacity slash syntax replaces text-opacity-* utilities"

key-files:
  created:
    - "apps/frontend/tailwind.config.tw4-compat.mjs"
    - "apps/frontend/src/tailwind-theme.css"
  modified:
    - "apps/frontend/src/app.css"
    - "apps/frontend/src/lib/components/button/Button.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionChoices.svelte"
    - "apps/frontend/src/lib/components/video/Video.svelte"
    - "21 .svelte files (@reference path updates)"

key-decisions:
  - "DaisyUI 4 plugin API incompatible with TW4 -- bypassed plugin, imported pre-built CSS directly"
  - "Created tw4-compat.mjs wrapper that strips plugins from original config (original untouched)"
  - "Inlined custom theme colors as CSS custom properties converted from hex via culori/oklch"
  - "Registered DaisyUI semantic colors via @theme block for TW4 utility class resolution"
  - "Replaced @apply of custom component classes with inlined TW utilities (TW4 restriction)"
  - "vite-tsconfig-paths NOT needed -- workspace imports work via preserveSymlinks"
  - "match-w-xl raw media query generates non-fatal CSS warnings (deferred to Phase 16)"

patterns-established:
  - "DaisyUI 4 compat: import styled.css + unstyled.css directly, define theme via CSS custom props"
  - "@reference path: scoped styles use relative path to src/tailwind-theme.css for full theme access"
  - "TW4 @apply restriction: cannot @apply custom component classes, must inline TW utilities"
  - "TW4 opacity: use slash syntax (text-neutral/20) instead of text-opacity-* utilities"

requirements-completed: [SCAF-06]

# Metrics
duration: 12min
completed: 2026-03-15
---

# Phase 15 Plan 02: Build Verification Summary

**Production build and dev server verified on Svelte 5 + Tailwind 4 with DaisyUI 4 compatibility layer bypassing incompatible plugin API**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-15T15:52:41Z
- **Completed:** 2026-03-15T16:05:28Z
- **Tasks:** 2
- **Files modified:** 24 (2 config + 1 CSS + 21 component @reference updates)

## Accomplishments
- Production build completes successfully (adapter-node, 292+ modules, 6.2s build time)
- Dev server starts in 754ms without module resolution errors
- DaisyUI 4 components available via pre-built CSS imports (bypassing incompatible TW4 plugin API)
- Custom theme colors preserved via oklch CSS custom properties
- Vitest config operational: 12 test files pass (262 tests), 4 pre-existing $lib alias failures
- All 21 scoped style blocks updated to reference custom theme for @apply resolution
- vite-tsconfig-paths confirmed unnecessary (workspace imports work via preserveSymlinks)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build verification and compilation fix** - `3039cf0bb` (fix)
2. **Task 2: Verify vitest and document results** - No file changes (verification only)

## Files Created/Modified
- `apps/frontend/tailwind.config.tw4-compat.mjs` - Wrapper config stripping DaisyUI plugin
- `apps/frontend/src/tailwind-theme.css` - Theme reference for scoped style blocks
- `apps/frontend/src/app.css` - DaisyUI pre-built CSS imports, custom theme vars, @theme colors, inlined @apply
- `apps/frontend/src/lib/components/button/Button.svelte` - text-opacity-20 -> text-neutral/20
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` - Inlined @apply small-label
- `apps/frontend/src/lib/components/video/Video.svelte` - Inlined @apply small-info
- 21 .svelte files - Updated @reference from "tailwindcss" to relative path to tailwind-theme.css

## Decisions Made
- **DaisyUI 4 bypassed as plugin:** DaisyUI 4's `addUtilities` API passes media query selectors which TW4 rejects ("invalid utility selector"). Instead of waiting for DaisyUI 5 (Phase 16), imported pre-built CSS directly and registered colors via @theme. Original tailwind.config.mjs left untouched.
- **tw4-compat wrapper config:** Created a thin wrapper that imports the original config but strips `plugins` and `daisyui` keys. This lets TW4's @config bridge load theme, spacing, fonts, etc. without hitting the DaisyUI plugin error.
- **Custom theme as CSS custom properties:** Generated oklch color values from the project's hex colors using the same culori algorithm DaisyUI uses internally. This preserves exact color matching.
- **@reference to CSS file (not bare "tailwindcss"):** Scoped style blocks need access to both TW defaults AND custom config (spacing, fonts, colors). A central tailwind-theme.css file combines @import "tailwindcss" + @config + @theme to provide everything.
- **Inlined custom class @apply:** TW4 cannot `@apply` custom component classes (small-label, circled, small-info). Replaced with the equivalent TW utilities directly. Added TODO comments for Phase 16 cleanup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] DaisyUI 4 plugin incompatible with Tailwind 4**
- **Found during:** Task 1 (Build verification, Step 3)
- **Issue:** DaisyUI 4 uses `addUtilities` with `@media` selectors, which TW4 rejects. Build fails immediately.
- **Fix:** Created tw4-compat wrapper (no plugins), imported DaisyUI pre-built CSS, inlined custom theme, registered colors via @theme
- **Files modified:** app.css, tailwind.config.tw4-compat.mjs, tailwind-theme.css
- **Verification:** Production build completes with exit code 0
- **Committed in:** 3039cf0bb (Task 1 commit)

**2. [Rule 3 - Blocking] @reference "tailwindcss" insufficient for custom theme**
- **Found during:** Task 1 (Build verification, Step 5 re-verify)
- **Issue:** Scoped style blocks with `@reference "tailwindcss"` could not resolve custom utilities (mb-md, border-md, bg-base-100, text-secondary) because the base TW reference doesn't include the project's custom config
- **Fix:** Created tailwind-theme.css combining @import + @config + @theme, updated all 21 @reference directives
- **Files modified:** tailwind-theme.css + 21 .svelte files
- **Verification:** Build resolves all @apply utilities in scoped styles
- **Committed in:** 3039cf0bb (Task 1 commit)

**3. [Rule 1 - Bug] @apply custom component classes fails in TW4**
- **Found during:** Task 1 (Build verification, Step 5 re-verify)
- **Issue:** TW4 cannot @apply custom component classes (circled, small-label, small-info, circled-on-shaded). These are defined in app.css @layer components but TW4 only allows @apply of TW utilities.
- **Fix:** Inlined the equivalent TW utilities at each usage site, added TODO[Tailwind 4] comments
- **Files modified:** app.css, QuestionChoices.svelte, Video.svelte
- **Verification:** Build resolves all @apply directives
- **Committed in:** 3039cf0bb (Task 1 commit)

**4. [Rule 1 - Bug] text-opacity-* utilities removed in TW4**
- **Found during:** Task 1 (Build verification, Step 5 re-verify)
- **Issue:** `text-opacity-20` no longer exists in TW4. Replaced by slash opacity syntax.
- **Fix:** Changed `text-neutral text-opacity-20` to `text-neutral/20`
- **Files modified:** Button.svelte
- **Verification:** Build completes without utility resolution errors
- **Committed in:** 3039cf0bb (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bugs)
**Impact on plan:** All fixes necessary for build to succeed. DaisyUI compat layer is the most significant addition -- it was not planned because the @config bridge was expected to handle DaisyUI 4. The approach preserves the original config and will be replaced in Phase 16 (DaisyUI 5).

## Build Output Summary

**Deprecation warnings observed:**
- ~52 self-closing HTML tag warnings (Svelte 5 strictness)
- 2 CSS optimization warnings (match-w-xl raw media query generates invalid CSS)
- svelte-visibility-change missing exports condition warning
- No export let / $: / on:event deprecation warnings visible in build output (they appear at runtime)

**Hard errors fixed:** 4 categories (DaisyUI plugin, @reference scope, @apply custom classes, opacity utilities)
**vite-tsconfig-paths:** NOT needed (confirmed)
**DaisyUI 4:** Loaded via pre-built CSS imports (NOT via @config plugin bridge -- incompatible)
**Vitest:** Config works. 12/17 test files pass (262 tests). 4 fail with pre-existing $lib alias resolution.

## Issues Encountered
- DaisyUI 4 is fundamentally incompatible with TW4's plugin API. The @config bridge loads the JS config but TW4's stricter `addUtilities` validation rejects DaisyUI's media query selectors. This was listed as an open question in the research (Open Question 1) and resolved via the pre-built CSS approach.
- The `match-w-xl` screen definition uses `{ raw: 'screen and (min-width: 36rem)' }` which TW4 misinterprets. This generates CSS warnings but doesn't break the build. To be addressed in Phase 16.
- `!bg-opacity-30` utility classes in Video.svelte template strings may not work at runtime (TW4 removed opacity utilities). These are not in @apply so they don't break the build, but may need fixing in Phase 16.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Build pipeline fully operational for Svelte 5 + Tailwind 4 development
- Phase 16 (CSS Architecture) can proceed with:
  - DaisyUI 5 upgrade (replace pre-built CSS imports with @plugin "daisyui")
  - Remove tw4-compat wrapper and tailwind-theme.css (DaisyUI 5 native TW4 support)
  - Migrate tailwind.config.mjs to CSS-first config
  - Fix match-w-xl screen definition for TW4
  - Replace !bg-opacity-30 with slash syntax
  - Clean up TODO[Tailwind 4] comments (inlined @apply)
- Phase 17-19 can build on this verified scaffold

## Self-Check: PASSED

- All created files exist (tailwind.config.tw4-compat.mjs, tailwind-theme.css, app.css, 15-02-SUMMARY.md)
- Commit 3039cf0bb found in git log
- Production build passes (exit code 0)

---
*Phase: 15-scaffold-and-build*
*Completed: 2026-03-15*
