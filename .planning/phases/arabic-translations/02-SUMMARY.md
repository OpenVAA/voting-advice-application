---
phase: arabic-translations
plan: "02"
subsystem: frontend/i18n
tags: [arabic, translation, msa, adminapp, i18n]
dependency_graph:
  requires: ["arabic-translations/01"]
  provides: ["adminApp.*-ar-translations"]
  affects: ["frontend/src/lib/i18n/translations/ar/"]
tech_stack:
  added: []
  patterns: ["MSA translation", "ICU token preservation", "glossary-first"]
key_files:
  modified:
    - frontend/src/lib/i18n/translations/ar/adminApp.jobs.json
    - frontend/src/lib/i18n/translations/ar/adminApp.questionInfo.json
    - frontend/src/lib/i18n/translations/ar/adminApp.argumentCondensation.json
    - frontend/src/lib/i18n/translations/ar/adminApp.factorAnalysis.json
    - frontend/src/lib/i18n/translations/ar/adminApp.login.json
    - frontend/src/lib/i18n/translations/ar/adminApp.common.json
    - frontend/src/lib/i18n/translations/ar/adminApp.error.json
    - frontend/src/lib/i18n/translations/ar/adminApp.notSupported.json
    - frontend/src/lib/i18n/translations/ar/adminApp.languageFeatures.json
decisions:
  - "Job-state terms use formal MSA administrative vocabulary from GLOSSARY.md (قيد الانتظار/مؤكَّد/مُقفَل)"
  - "'Election Compass' translated to البوصلة الانتخابية (descriptive phrase, D-05)"
  - "Auth terms (البريد الإلكتروني/كلمة المرور/تسجيل الدخول) consistent with locked glossary"
metrics:
  duration: "~4 minutes"
  completed: "2026-06-15"
  tasks_total: 2
  tasks_completed: 2
  files_modified: 9
---

# Phase arabic-translations Plan 02: adminApp MSA Translations Summary

**One-liner:** 9 adminApp JSON files (121 keys) translated to formal MSA Arabic using the locked glossary, with job-state terms, auth vocabulary, and D-06 placeholder-integrity check all green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Translate 4 larger adminApp files | f866f4f98 | adminApp.jobs.json, adminApp.questionInfo.json, adminApp.argumentCondensation.json, adminApp.factorAnalysis.json |
| 2 | Translate 5 smaller adminApp files | 970ac9235 | adminApp.login.json, adminApp.common.json, adminApp.error.json, adminApp.notSupported.json, adminApp.languageFeatures.json |

## Verification Results

- `yarn workspace @openvaa/frontend test:unit`: **360 passed / 1 skipped** — key parity green for all 46 ar/ files
- `cd frontend && yarn tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`: **0 checks failed, 127 passed** — exit 0
- All 9 ar/ files differ from their en/ siblings (Python json-not-equal assertion passed per file)
- All 9 files are valid UTF-8 JSON (python3 -m json.tool passed per file)

## Translation Decisions Made

### Job-State Terms (adminApp.jobs.json)
The 37-key jobs file required formal MSA administrative vocabulary per the glossary (Open Question 1 resolution):
- "Pending" → قيد الانتظار (formal: "in the state of waiting")
- "Confirmed" → مؤكَّد
- "Locked" → مُقفَل
- "running" → قيد التشغيل
- "failed" → فشل
- "completed" → مكتمل
- "cancelled" → ملغى
- "queued" → في قائمة الانتظار
- ICU token `{feature}` in `confirmAbortJob` preserved verbatim

### "Election Compass" (adminApp.login.json)
Per D-05, "Election Compass" is a descriptive phrase (not a registered proper noun) and is translated:
- `appTitle`: "Election Compass" → "البوصلة الانتخابية"

### Authentication Vocabulary (adminApp.login.json)
Locked glossary terms used consistently:
- "Email" → البريد الإلكتروني
- "Password" → كلمة المرور
- "Login" → تسجيل الدخول

### ICU Tokens Preserved
- `{feature}` in adminApp.jobs.confirmAbortJob — preserved and repositioned naturally in Arabic sentence
- `{error}` in adminApp.argumentCondensation.generate.errorLoadingQuestions — preserved
- `{count}` in adminApp.factorAnalysis.compute.parties.some — preserved

### Emoji Preserved
- `🔧` in adminApp.notSupported.heroEmoji — preserved

## Deviations from Plan

None — plan executed exactly as written. All 9 files translated in 2 tasks, all verification gates passed on first attempt.

## Known Stubs

None. All 9 files contain real MSA Arabic values, not English passthrough or placeholder text.

## Threat Flags

None. These files contain only admin UI text with no network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. ICU token integrity was verified by the D-06 check (T-arabic-A1 mitigated).

## Self-Check: PASSED

- All 9 ar/adminApp.*.json files exist and contain Arabic content
- Commit f866f4f98 exists (Task 1 — 4 larger files)
- Commit 970ac9235 exists (Task 2 — 5 smaller files)
- D-06 check: 0 checks failed, 127 passed
- Unit tests: 360 passed, key parity green
