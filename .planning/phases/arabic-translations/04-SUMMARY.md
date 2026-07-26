---
phase: arabic-translations
plan: "04"
subsystem: frontend-i18n
tags: [translations, arabic, msa, voter-app, rtl]
dependency_graph:
  requires: ["01"]
  provides: ["voter-ui-translations-simple"]
  affects: ["frontend/src/lib/i18n/translations/ar"]
tech_stack:
  added: []
  patterns: ["ICU MessageFormat", "MSA Arabic translations", "glossary-driven consistency"]
key_files:
  created: []
  modified:
    - frontend/src/lib/i18n/translations/ar/entityCard.json
    - frontend/src/lib/i18n/translations/ar/entityDetails.json
    - frontend/src/lib/i18n/translations/ar/entityFilters.json
    - frontend/src/lib/i18n/translations/ar/constituencies.json
    - frontend/src/lib/i18n/translations/ar/elections.json
    - frontend/src/lib/i18n/translations/ar/help.json
    - frontend/src/lib/i18n/translations/ar/info.json
    - frontend/src/lib/i18n/translations/ar/maintenance.json
    - frontend/src/lib/i18n/translations/ar/statistics.json
    - frontend/src/lib/i18n/translations/ar/yourList.json
    - frontend/src/lib/i18n/translations/ar/error.json
decisions:
  - "D-05: 'Election Compass' translated to 'البوصلة الانتخابية' (descriptive phrase, not proper noun)"
  - "D-06: D-06 check script confirmed 0 failures across all 127 checks after both tasks"
metrics:
  duration: "149s (~2m)"
  completed: "2026-06-15"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 11
---

# Phase arabic-translations Plan 04: Voter-Facing Simple Files Summary

MSA Arabic translations for 11 voter-facing low-complexity frontend JSON files — 5 entity/filter/constituency/election files plus 6 voter utility files (help, info, maintenance, statistics, yourList, error) with HTML tag preservation in error.json.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Translate entity + filter + constituency/election files | 83571c0b9 | entityCard.json, entityDetails.json, entityFilters.json, constituencies.json, elections.json |
| 2 | Translate top-level voter utility files (help, info, maintenance, statistics, yourList, error) | 928d7f672 | help.json, info.json, maintenance.json, statistics.json, yourList.json, error.json |

## Translation Decisions

### Task 1 — Entity/Filter/Constituency/Election (5 files)

- **entityCard.json** (2 keys): "Collapse list" → "طي القائمة"; "Show all {numCandidates} candidates" → "عرض جميع {numCandidates} مرشح" — ICU `{numCandidates}` preserved.
- **entityDetails.json** (5 keys): "Links" → "روابط"; "member of {organization}" → "عضو في {organization}"; tabs: "Basic Info" → "المعلومات الأساسية", "Opinions" → "الآراء"; `{candidatePlural}` token passed through verbatim.
- **entityFilters.json** (12 keys): Glossary term "الفلاتر" used for "Filters" and "Filter" / "Close filters" / "Reset filters". Numeric min/max labels translated. Text search aria label and placeholder translated.
- **constituencies.json** (3 keys): Glossary term "دائرة انتخابية" used throughout — "Select your constituency" → "اختر دائرتك الانتخابية"; multiple-groups info text translated in full.
- **elections.json** (1 key): "Select an election" → "اختر انتخابات" using glossary term "انتخابات".

### Task 2 — Voter Utility + Error (6 files)

- **help.json** (1 key): "Help" → "المساعدة"
- **info.json** (1 key): "Information About the Elections" → "معلومات عن الانتخابات"
- **maintenance.json** (1 key): "Under Maintenance" → "تحت الصيانة"
- **statistics.json** (2 keys): "Statistics" → "إحصاءات" (glossary term); "All {candidatePlural}" → "جميع {candidatePlural}" with ICU token preserved.
- **yourList.json** (1 key): "Your List" → "قائمتك"
- **error.json** (11 keys): All error messages translated to MSA. HTML-bearing `content` key: both `<p>` tags preserved verbatim, `{adminEmailLink}` ICU token preserved, surrounding text translated. "Election Compass" in `noNominations` and `noQuestions` → "البوصلة الانتخابية" per D-05 (descriptive phrase, not proper noun).

## Verification Results

- `yarn workspace @openvaa/frontend test:unit -- translations`: 360 tests passed (237 translation parity tests green)
- `cd frontend && yarn tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`: exit=0, "0 checks failed, 127 passed" — run after both tasks
- JSON validity: all 11 files pass `python3 -m json.tool`
- ar != en: all 11 files verified to differ from their en/ siblings

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 11 files contain real MSA Arabic copy (not English passthrough).

## Threat Flags

No new security-relevant surface introduced. The HTML in error.json `content` key is pre-existing; tag set preserved exactly (T-arabic-V1 mitigated). ICU tokens preserved (T-arabic-V2 mitigated).

## Self-Check: PASSED

- All 11 ar/ files exist and contain MSA Arabic content.
- Commit 83571c0b9: Task 1 (5 files) — verified in git log.
- Commit 928d7f672: Task 2 (6 files) — verified in git log.
- D-06 check: 0 failures / 127 passed.
- Translation unit tests: 360 passed.
