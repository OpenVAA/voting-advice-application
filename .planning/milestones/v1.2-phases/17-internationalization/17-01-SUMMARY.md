---
phase: 17-internationalization
plan: 01
subsystem: i18n
tags: [paraglide, inlang, icu, translations, locales, french, luxembourgish]

# Dependency graph
requires: []
provides:
  - 7-locale translation files with hardcoded terms (no DEFAULT_PAYLOAD_KEYS placeholders)
  - project.inlang/settings.json Paraglide configuration with 46 pathPattern entries
  - messages/ directory with inlang-format translations (variant syntax for plurals/dates/selects)
  - French and Luxembourgish locale translations merged from deploy-luxemburg-vaa-2025 branch
affects: [17-02-PLAN, 17-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "inlang variant syntax: declarations/selectors/match for plurals, dates, selects"
    - "Multi-selector matching for messages with multiple plural variables"
    - "datetime registry syntax for date formatting in inlang"

key-files:
  created:
    - apps/frontend/src/lib/i18n/translations/fr/ (46 JSON files)
    - apps/frontend/src/lib/i18n/translations/lb/ (46 JSON files)
    - apps/frontend/project.inlang/settings.json
    - apps/frontend/messages/ (7 locale dirs x 46 files = 322 files)
  modified:
    - apps/frontend/src/lib/i18n/translations/index.ts
    - apps/frontend/src/lib/i18n/translations/translations.type.ts
    - apps/frontend/src/lib/i18n/translations/en/*.json (6 files with hardcoded terms)
    - apps/frontend/src/lib/i18n/translations/fi/*.json (6 files)
    - apps/frontend/src/lib/i18n/translations/sv/*.json (6 files)
    - apps/frontend/src/lib/i18n/translations/da/*.json (6 files)
    - apps/frontend/src/lib/i18n/translations/et/*.json (6 files)
    - apps/frontend/src/lib/i18n/translations/fr/*.json (5 files)
    - apps/frontend/src/lib/i18n/translations/lb/*.json (5 files)

key-decisions:
  - "Locale display names from luxemburg branch: Francais -> Fran\u00e7ais, Letzebuergesch -> L\u00ebtzebuergesch"
  - "adminEmailLink replaced with hardcoded mailto from staticSettings.admin.email (first.last@openvaa.org)"
  - "analyticsLink kept as ICU variable -- deployment-specific, not hardcoded"
  - "ICU =0 maps to zero, =1 maps to one in inlang CLDR plural categories"
  - "ICU # count reference becomes explicit {varName} in inlang variant text"
  - "Date skeleton ::yyyyMMdd maps to datetime year=numeric month=2-digit day=2-digit"
  - "Duplicate select patterns on same variable deduplicated in declarations/selectors"

patterns-established:
  - "Inlang plural variant: declarations with input+local plural, selectors, match with CLDR categories"
  - "Inlang datetime variant: declarations with input+local datetime, match with wildcard"
  - "Inlang select variant: declarations with input, selectors, match with option values"

requirements-completed: [I18N-01, I18N-04]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 17 Plan 01: Translation Data Preparation Summary

**Merged fr/lb locales from luxemburg branch, hardcoded DEFAULT_PAYLOAD_KEYS terms across 7 locales, and converted all 322 translation files to inlang variant format for Paraglide**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T07:53:23Z
- **Completed:** 2026-03-16T08:01:00Z
- **Tasks:** 2
- **Files modified:** 447

## Accomplishments
- Merged French (fr) and Luxembourgish (lb) translations from deploy-luxemburg-vaa-2025 branch, adding 9 missing adminApp.* stub files from en/
- Replaced all DEFAULT_PAYLOAD_KEYS placeholders ({candidateSingular}, {candidatePlural}, {partySingular}, {partyPlural}, {adminEmailLink}) with hardcoded locale-specific terms across 42 JSON files (7 locales x 6 files each)
- Created project.inlang/settings.json with all 7 locales and 46 explicit pathPattern entries
- Converted all 322 translation files to inlang message format, handling ~15 plural patterns, 3 date patterns, 1 select pattern (with multi-selector support for messages with 2+ plural variables)
- Preserved {analyticsLink} as simple variable interpolation (not converted to variant)

## Task Commits

Each task was committed atomically:

1. **Task 1: Merge fr/lb locales and replace DEFAULT_PAYLOAD_KEYS** - `9b210af08` (feat)
2. **Task 2: Create project.inlang config and convert to inlang format** - `6b3be8ea5` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/i18n/translations/fr/` - 46 French translation JSON files
- `apps/frontend/src/lib/i18n/translations/lb/` - 46 Luxembourgish translation JSON files
- `apps/frontend/src/lib/i18n/translations/index.ts` - Updated locale registry (5 -> 7 locales)
- `apps/frontend/src/lib/i18n/translations/translations.type.ts` - Removed obsolete payload type fields
- `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/*.json` - Hardcoded DEFAULT_PAYLOAD terms
- `apps/frontend/project.inlang/settings.json` - Paraglide project configuration
- `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/` - 322 inlang-format translation files

## Decisions Made
- Used locale display names from the luxemburg branch (Francais, Letzebuergesch with diacritics)
- adminEmailLink hardcoded using the admin email from staticSettings (first.last@openvaa.org) -- the admin.email value is the canonical source
- analyticsLink preserved as ICU variable since it is deployment-specific (injected at runtime)
- ICU exact match keys (=0, =1) mapped to CLDR plural categories (zero, one) per inlang convention
- Date skeletons converted using explicit option mapping (e.g., yyyyMMdd -> year=numeric month=2-digit day=2-digit)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSON-safe adminEmailLink replacement**
- **Found during:** Task 1 (DEFAULT_PAYLOAD_KEYS replacement)
- **Issue:** Simple string replacement of {adminEmailLink} with HTML anchor tag broke JSON due to unescaped double quotes in the replacement text
- **Fix:** Switched from raw text replacement to JSON-aware approach: parse JSON, replace in values, serialize back
- **Files modified:** All translation JSON files with adminEmailLink
- **Verification:** All JSON files parse without errors
- **Committed in:** 9b210af08 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for correctness. No scope creep.

## Issues Encountered
- The luxemburg branch stores translations at the old path `frontend/src/lib/i18n/translations/` (missing `apps/` prefix) -- handled by extracting files using `git show` to the correct new path
- The luxemburg branch had 37 files per locale (missing 9 adminApp.* files) -- filled with English stubs as planned

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Translation data fully prepared for Plan 02 (Paraglide compiler integration)
- project.inlang/settings.json ready for Paraglide Vite plugin
- messages/ directory with inlang-format files ready for compilation
- DEFAULT_PAYLOAD_KEYS still exists in index.ts and init.ts (removal deferred to Plan 02 as specified)

---
*Phase: 17-internationalization*
*Completed: 2026-03-16*
