---
phase: arabic-translations
plan: "06"
subsystem: frontend-i18n
tags: [translation, arabic, msa, i18n, rtl, common, dynamic, preregister]
dependency_graph:
  requires: ["01", "02", "03", "04", "05"]
  provides: ["07"]
  affects: [frontend/src/lib/i18n/translations/ar/, backend-sync-source]
tech_stack:
  added: []
  patterns: [MSA-Arabic, ICU-MessageFormat, JSON-translation-files]
key_files:
  created: []
  modified:
    - frontend/src/lib/i18n/translations/ar/common.json
    - frontend/src/lib/i18n/translations/ar/dynamic.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json
decisions:
  - "D-05: OpenVAA kept as literal Latin brand in common.json openVAA key"
  - "D-05: Bank ID kept as literal Latin brand in preregister.json (4 occurrences)"
  - "D-05: Election Compass translated to البوصلة الانتخابية throughout dynamic.json"
  - "madeWithPrefix set to صُنع بـ; madeWithSuffix stays empty (RESEARCH Open Question 2)"
  - "dynamic.json appName set to البوصلة الانتخابية as Plan 07 sync source"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-15"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase arabic-translations Plan 06: Highest-Risk Files — MSA Translation Summary

Translated the three highest-risk frontend i18n files to Modern Standard Arabic (MSA / فُصْحَى): `common.json` (71 keys — default payload with OpenVAA brand), `dynamic.json` (62 keys — HTML legal text, date skeletons, Election Compass descriptive phrase, Plan 07 sync source), and `candidateApp.preregister.json` (37 keys — email HTML, literal `\n` newlines, emoji, Bank ID brand, registration tokens).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Translate common.json (default payload + OpenVAA brand) | d575a32a8 | frontend/src/lib/i18n/translations/ar/common.json |
| 2 | Translate dynamic.json (HTML + date skeletons + appName + Election Compass) | 43636362f | frontend/src/lib/i18n/translations/ar/dynamic.json |
| 3 | Translate candidateApp.preregister.json (HTML email + \n + emoji + Bank ID) | 9f11e4b88 | frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json |

## Verification Results

- `yarn test:unit`: 360 passed / 1 skipped (key-parity + all tests green)
- `tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`: 0 checks failed, 125 passed (exit=0) — run after each task
- All 3 `ar/` files differ from their `en/` counterparts (confirmed by Python json comparison)

## Integrity Constraints Satisfied

### common.json
- `openVAA` key value: exactly `OpenVAA` (Latin brand, D-05)
- `madeWithPrefix`: `صُنع بـ` (full Arabic phrase); `madeWithSuffix`: `""` (empty, RESEARCH Open Question 2)
- All glossary domain terms applied: مرشح/مرشحون, حزب/أحزاب, تحالف/تحالفات, كتلة/كتل, etc.
- `{publisher}` ICU token preserved in `publishedBy`

### dynamic.json
- `appName` and `candidateAppName` translated: البوصلة الانتخابية / البوصلة الانتخابية للمرشحين (D-05 descriptive phrase)
- "Election Compass" literal text translated to البوصلة الانتخابية throughout
- `{electionDate, date, ::yyyyMMdd}` date skeleton preserved verbatim
- HTML `<h3>` count: 10 (matches English source exactly) — confirmed by Python re count
- `DATA_CONTROLLER` and `DATA_CONTACT_PERSON` operator placeholders preserved verbatim (T-arabic-H2)
- `{appName}`, `{adminEmailLink}`, `{candidatePlural}`, `{partyPlural}` tokens preserved verbatim
- `DATA_STORAGE_TERM_EG_5_YRS` deployment placeholder preserved verbatim
- All `<p>`, `<ul>`, `<li>` HTML structures preserved in registryStatement
- File ready as Plan 07 backend sync source

### candidateApp.preregister.json
- `href=\"{registrationUrl}\"` preserved verbatim in `email.html` (T-arabic-H1)
- Literal `\n` newlines preserved in `email.text`: `Hi {firstName},\n...\n{registrationUrl}\n...` (Pitfall 6)
- Emoji 🖋️ 👍 ✉️ preserved in place
- `Bank ID` count: 4 occurrences match English source exactly (T-arabic-H3, D-05)
- `{firstName}`, `{lastName}`, `{registrationUrl}`, `{appName}` tokens preserved (repositioned in Arabic grammar where needed)
- All HTML `<p>` and `<a>` tags preserved (T-arabic-H4)

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met on first attempt for each task.

## Threat Model Compliance

| Threat ID | Status |
|-----------|--------|
| T-arabic-H1 | Mitigated — `href="{registrationUrl}"` verified in ar file (grep match + D-06 check) |
| T-arabic-H2 | Mitigated — DATA_CONTROLLER and DATA_CONTACT_PERSON preserved verbatim (grep + D-06) |
| T-arabic-H3 | Mitigated — Bank ID count 4 matches en count (grep count match + D-06 brand check) |
| T-arabic-H4 | Mitigated — `<h3>` count 10 matches en (Python re count); all tag structure preserved |

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan modifies only JSON translation string values.

## Known Stubs

None — all three files contain real MSA Arabic translations (not English passthrough). Default payload values in common.json (`candidate.singular`, `candidate.plural`, `organization.singular`, `organization.plural`, etc.) feed runtime ICU tokens app-wide with correct Arabic forms.

## Self-Check: PASSED

- `frontend/src/lib/i18n/translations/ar/common.json` — exists, differs from en, openVAA=OpenVAA
- `frontend/src/lib/i18n/translations/ar/dynamic.json` — exists, differs from en, 10 h3 tags, date skeleton present, DATA_CONTROLLER/DATA_CONTACT_PERSON present
- `frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json` — exists, differs from en, Bank ID x4, literal \\n present, href present
- Commits verified: d575a32a8, 43636362f, 9f11e4b88
- D-06 check: 0 failed / 125 passed (exit=0)
- Unit tests: 360 passed / 1 skipped
