---
phase: 17-internationalization
plan: 04
subsystem: i18n
tags: [i18n, paraglide, inlang, translations, locales, fr, lb]

# Dependency graph
requires:
  - phase: 17-03
    provides: "Paraglide call site migration with en as base locale"
provides:
  - "fr and lb locale key structures synced to match en across all 46 message files"
  - "Relocated translation values preserved (email, wrongEmailOrPassword, etc.)"
affects: [17-internationalization]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Locale sync: en is canonical key structure, other locales must mirror it exactly"]

key-files:
  created: []
  modified:
    - "apps/frontend/messages/fr/*.json (9 files)"
    - "apps/frontend/messages/lb/*.json (9 files)"
    - "apps/frontend/src/lib/i18n/translations/fr/*.json (9 files)"
    - "apps/frontend/src/lib/i18n/translations/lb/*.json (9 files)"

key-decisions:
  - "Used en key structure as canonical source, automatically removing extra keys and adding missing keys"
  - "Preserved translated values when relocating keys between files (e.g., email from candidateApp.common to common)"

patterns-established:
  - "Locale key sync: all non-en locales must have identical key structure to en in both messages/ and translations/ directories"

requirements-completed: [I18N-02, I18N-04]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 17 Plan 04: Gap Closure Summary

**Synced fr and lb locale key structures to match en across 36 translation files, relocating values and removing luxemburg-branch extras**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T11:25:18Z
- **Completed:** 2026-03-16T11:29:05Z
- **Tasks:** 1
- **Files modified:** 36

## Accomplishments
- All 7 locales now have identical key structures across all 46 message files
- Relocated translated values preserved (email/emailPlaceholder from candidateApp.common to common, wrongEmailOrPassword from candidateApp.login to error)
- Removed luxemburg-branch extras: resultsPreview, questionWeights, weights, finished objects, loginFailed in candidateApp.error
- All 288 translation tests pass for all 7 locales

## Task Commits

Each task was committed atomically:

1. **Task 1: Sync fr and lb translation keys to match en in both directories** - `4ed81a596` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `apps/frontend/messages/fr/*.json` (9 files) - French inlang messages synced to en key structure
- `apps/frontend/messages/lb/*.json` (9 files) - Luxembourgish inlang messages synced to en key structure
- `apps/frontend/src/lib/i18n/translations/fr/*.json` (9 files) - French source translations synced to en key structure
- `apps/frontend/src/lib/i18n/translations/lb/*.json` (9 files) - Luxembourgish source translations synced to en key structure

## Decisions Made
- Used en file as canonical key structure source, building output in en key order
- Preserved translated values when keys were relocated between files (email from candidateApp.common to common, wrongEmailOrPassword from candidateApp.login to error)
- For truly missing keys with no relocated translation, used en fallback values

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed extra loginFailed key from candidateApp.error.json**
- **Found during:** Task 1 (verification step)
- **Issue:** fr and lb candidateApp.error.json had an extra `loginFailed` key not present in en, causing test failure on that file
- **Fix:** Removed the extra key from both locales in both directories (messages/ and translations/)
- **Files modified:** apps/frontend/messages/fr/candidateApp.error.json, apps/frontend/messages/lb/candidateApp.error.json, apps/frontend/src/lib/i18n/translations/fr/candidateApp.error.json, apps/frontend/src/lib/i18n/translations/lb/candidateApp.error.json
- **Verification:** Key comparison check passes with no mismatches
- **Committed in:** 4ed81a596 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was necessary for correctness -- the plan listed 8 specific files but candidateApp.error.json also had a key mismatch. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All i18n gap closure complete
- Phase 17 internationalization fully done
- Ready for next phase (18-testing)

## Self-Check: PASSED

All created/modified files verified. Commit 4ed81a596 verified.

---
*Phase: 17-internationalization*
*Completed: 2026-03-16*
