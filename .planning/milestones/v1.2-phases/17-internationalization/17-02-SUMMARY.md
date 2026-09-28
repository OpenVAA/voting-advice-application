---
phase: 17-internationalization
plan: 02
subsystem: i18n
tags: [paraglide, inlang, sveltekit, vite, routing, locale, overrides, middleware]

# Dependency graph
requires:
  - phase: 17-01
    provides: project.inlang config, messages/ directory with inlang-format translations
provides:
  - Paraglide JS installed with Vite plugin and compiled message runtime
  - Reroute hook (hooks.ts) for transparent locale URL handling
  - Server hooks with paraglideMiddleware replacing custom locale detection
  - Runtime override wrapper (overrides.ts + wrapper.ts) for backend translationOverrides
  - Route structure without [[lang=locale]] directory
  - All layout loaders using getLocale() from Paraglide runtime
  - buildRoute using localizeHref for locale-prefixed URLs
affects: [17-03-PLAN]

# Tech tracking
tech-stack:
  added: ["@inlang/paraglide-js"]
  removed: ["sveltekit-i18n", "@sveltekit-i18n/parser-icu"]
  patterns:
    - "Paraglide reroute hook in hooks.ts for transparent locale URL stripping"
    - "paraglideMiddleware in hooks.server.ts for server-side locale handling"
    - "Override wrapper pattern: t() checks runtime overrides then Paraglide compiled messages"
    - "getLocale() from Paraglide runtime replaces params.lang in all loaders"
    - "localizeHref() in buildRoute for locale-prefixed URL generation"

key-files:
  created:
    - apps/frontend/src/hooks.ts
    - apps/frontend/src/lib/i18n/overrides.ts
    - apps/frontend/src/lib/i18n/wrapper.ts
  modified:
    - apps/frontend/package.json
    - apps/frontend/vite.config.ts
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/lib/i18n/init.ts
    - apps/frontend/src/lib/i18n/translations/index.ts
    - apps/frontend/src/routes/+layout.ts
    - apps/frontend/src/routes/admin/(protected)/+layout.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+layout.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.ts
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
    - apps/frontend/src/routes/candidate/(protected)/+layout.ts
    - apps/frontend/src/routes/(voters)/nominations/+layout.ts
    - apps/frontend/src/routes/(voters)/(located)/+layout.ts
    - apps/frontend/src/lib/utils/route/route.ts
    - apps/frontend/src/lib/utils/route/params.ts
    - apps/frontend/src/lib/utils/route/buildRoute.ts
  deleted:
    - apps/frontend/src/params/locale.ts

key-decisions:
  - "Route infrastructure (route.ts, params.ts, buildRoute.ts) updated alongside route directory move to prevent broken route resolution"
  - "buildRoute uses Paraglide localizeHref() instead of lang route param for locale-prefixed URLs"
  - "lang removed from ROUTE_PARAMS since it is no longer a SvelteKit route parameter"
  - "Layout loaders pass locale to buildRoute via locale option instead of lang param"

patterns-established:
  - "getLocale() from $lib/paraglide/runtime for locale access in loaders and server code"
  - "setOverrides(locale, overrides) for applying backend translationOverrides"
  - "localizeHref(url, { locale }) for generating locale-prefixed URLs"
  - "paraglideMiddleware wrapping resolve with transformPageChunk for %lang% replacement"

requirements-completed: [I18N-02, I18N-03, I18N-05, I18N-06, I18N-07]

# Metrics
duration: 7min
completed: 2026-03-16
---

# Phase 17 Plan 02: Paraglide Infrastructure Summary

**Paraglide JS installed with Vite plugin, reroute hook, paraglideMiddleware, runtime override wrapper, and route restructuring -- all sveltekit-i18n infrastructure replaced**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-16T08:28:05Z
- **Completed:** 2026-03-16T08:35:07Z
- **Tasks:** 2
- **Files modified:** 111

## Accomplishments
- Swapped sveltekit-i18n for @inlang/paraglide-js with Vite plugin configuration (URL/cookie/baseLocale strategy)
- Created reroute hook (hooks.ts) and rewrote server hooks with paraglideMiddleware, removing all custom locale detection logic
- Built runtime override wrapper (overrides.ts + wrapper.ts) that checks backend translationOverrides before falling back to Paraglide compiled messages
- Restructured routes: moved all children from [[lang=locale]]/ to routes/, deleted params/locale.ts, updated all 8 layout loaders to use getLocale()
- Updated route infrastructure (route.ts, params.ts, buildRoute.ts) to use Paraglide localizeHref for locale-prefixed URLs

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Paraglide, configure Vite, create override wrapper and hooks** - `a11eaca09` (feat)
2. **Task 2: Rename route directory, update all layout loaders, delete params/locale.ts** - `3a2ef937e` (feat)

## Files Created/Modified
- `apps/frontend/src/hooks.ts` - Paraglide reroute hook with deLocalizeUrl
- `apps/frontend/src/hooks.server.ts` - Server hooks with paraglideMiddleware + candidate auth
- `apps/frontend/src/lib/i18n/overrides.ts` - Runtime override store for backend translationOverrides
- `apps/frontend/src/lib/i18n/wrapper.ts` - t() function: overrides -> Paraglide fallback
- `apps/frontend/src/lib/i18n/init.ts` - Rewritten with Paraglide runtime exports
- `apps/frontend/src/lib/i18n/translations/index.ts` - Removed DEFAULT_PAYLOAD_KEYS and @sveltekit-i18n types
- `apps/frontend/vite.config.ts` - Added paraglideVitePlugin
- `apps/frontend/package.json` - Swapped sveltekit-i18n for @inlang/paraglide-js
- `apps/frontend/src/routes/+layout.ts` - getLocale() + setOverrides replacing loadTranslations/addTranslations
- `apps/frontend/src/routes/*/+layout.ts` - All 7 nested layouts updated to use getLocale()
- `apps/frontend/src/routes/*/+page.server.ts` - 2 form action files updated
- `apps/frontend/src/lib/utils/route/route.ts` - Removed [[lang=locale]] from route paths
- `apps/frontend/src/lib/utils/route/params.ts` - Removed lang from ROUTE_PARAMS
- `apps/frontend/src/lib/utils/route/buildRoute.ts` - localizeHref for locale-prefixed URLs

## Decisions Made
- Route infrastructure (route.ts, params.ts, buildRoute.ts) updated alongside route directory restructuring to prevent broken route resolution -- this was not explicitly in the plan but was required by deviation Rule 3 (blocking)
- buildRoute uses Paraglide's localizeHref() function for locale prefix instead of passing lang as a route parameter
- lang removed from ROUTE_PARAMS array since Paraglide handles locale transparently via URL rewriting
- Layout loaders that called buildRoute with `lang` property now use `locale` property (which buildRoute passes to localizeHref)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated route infrastructure (route.ts, params.ts, buildRoute.ts)**
- **Found during:** Task 2 (route restructuring)
- **Issue:** Removing [[lang=locale]] from the directory structure broke route.ts route definitions (which used /[[lang=locale]]/candidate etc.), params.ts (which listed lang as a route param), and buildRoute.ts (which passed lang as a route param to resolveRoute)
- **Fix:** Updated route.ts to remove [[lang=locale]] prefix from all route constants, removed lang from ROUTE_PARAMS in params.ts, rewrote buildRoute.ts to use Paraglide's localizeHref() for locale prefix instead of lang route param
- **Files modified:** apps/frontend/src/lib/utils/route/route.ts, params.ts, buildRoute.ts
- **Verification:** All buildRoute callers use locale option; no params.lang references remain
- **Committed in:** 3a2ef937e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for correctness -- route system would break without matching route.ts/params.ts/buildRoute.ts updates. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Paraglide infrastructure fully in place for Plan 03 (call site migration)
- t() wrapper function ready to replace $t() store references across ~740 call sites
- getLocale() established as the locale access pattern for all server/loader code
- localizeHref() established for URL locale prefixing

## Self-Check: PASSED

All created files verified present. All deleted files confirmed removed. Both task commits (a11eaca09, 3a2ef937e) found in git history.

---
*Phase: 17-internationalization*
*Completed: 2026-03-16*
