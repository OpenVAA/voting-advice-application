---
phase: 50-leaf-context-rewrite
plan: 01
subsystem: ui
tags: [svelte5, i18n, context-api, store-removal, runes-migration]

# Dependency graph
requires:
  - phase: 49-context-utilities
    provides: "Rune-based utility infrastructure (StackedState, persistedState)"
provides:
  - "I18nContext with plain string locale and array locales (no Readable wrapping)"
  - "All I18n consumer components using direct property access"
  - "candidateUserDataStore accepting plain string locale parameter"
  - "dataContext using plain string locale for DataRoot construction"
affects: [50-02 (LayoutContext rewrite), 50-03 (AuthContext rewrite), 51-store-context-rewrite]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Context values as plain types instead of Readable stores", "$app/state import pattern for SvelteKit page state"]

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/i18n/i18nContext.ts
    - apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts
    - apps/frontend/src/lib/contexts/data/dataContext.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
    - apps/frontend/src/lib/components/video/Video.svelte
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte
    - apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
    - apps/frontend/src/routes/(voters)/nominations/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte

key-decisions:
  - "I18nContext uses plain values (not $state runes) since locale is constant within page lifecycle"
  - "LanguageSelection.svelte migrated from $app/stores to $app/state as part of this plan"

patterns-established:
  - "Plain value context pattern: contexts expose constant-per-page values as plain types, not Readable stores"
  - "Direct property access: consumers use locale instead of $locale for context values"

requirements-completed: [R2.1, R2.10, R2.12, R3.1, R3.2, R3.3]

# Metrics
duration: 5min
completed: 2026-03-28
---

# Phase 50 Plan 01: I18nContext Rewrite Summary

**I18nContext rewritten from Readable store wrapping to plain string/array values, with all 8 consumer components updated to direct property access**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-28T12:12:25Z
- **Completed:** 2026-03-28T12:17:14Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Removed all svelte/store dependencies from I18nContext (type and implementation)
- Updated dataContext.ts and candidateUserDataStore.ts to work with plain string locale
- Migrated all 8 consumer components from $locale/$locales/$currentLocale to direct property access
- Migrated LanguageSelection.svelte from $app/stores to $app/state
- Build succeeds with zero errors, all 613 unit tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite I18nContext module + fix downstream context files** - `9311d4681` (feat)
2. **Task 2: Update all consumer components to direct property access** - `b1b2db3bb` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts` - Removed Readable import, locale: string, locales: readonly string[]
- `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` - Removed readable() wrapping, return plain values from getLocale()/locales
- `apps/frontend/src/lib/contexts/data/dataContext.ts` - Changed get(locale) to plain locale for DataRoot construction
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` - Changed locale param from Readable<string> to string
- `apps/frontend/src/lib/components/video/Video.svelte` - $locale -> locale in srclang attribute
- `apps/frontend/src/lib/components/input/Input.svelte` - $currentLocale -> currentLocale, $locales -> locales throughout
- `apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte` - $locale -> locale in localeCompare
- `apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte` - $locale -> locale, $locales -> locales
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` - $locale -> locale in TextPropertyFilter constructor
- `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` - $app/stores -> $app/state, $page -> page, $locales -> locales, $currentLocale -> currentLocale
- `apps/frontend/src/routes/(voters)/nominations/+page.svelte` - $locale -> locale shorthand in filter construction
- `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte` - $locale -> locale in effect and translateLocalizedCandidate call

## Decisions Made
- I18nContext uses plain values (not $state runes) since locale is constant within a page lifecycle -- locale changes trigger full page reloads, so reactivity is unnecessary
- ComponentContext and AppContext types automatically inherit the plain value types through their type intersections with I18nContext, requiring no changes to those files
- Kept `get` import in dataContext.ts and candidateUserDataStore.ts since it's still used for other store operations in those files

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all values are properly wired.

## Next Phase Readiness
- I18nContext is fully migrated to plain values
- ComponentContext and AppContext automatically inherit the new types
- Ready for Plan 02 (LayoutContext rewrite) and Plan 03 (AuthContext rewrite)

---
*Phase: 50-leaf-context-rewrite*
*Completed: 2026-03-28*
