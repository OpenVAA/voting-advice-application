---
phase: arabic-translations
plan: "03"
subsystem: frontend-i18n
tags: [translation, arabic, msa, candidate-app, rtl]
dependency_graph:
  requires: ["01"]
  provides: ["candidateApp-tier1-msa"]
  affects: ["frontend/src/lib/i18n/translations/ar/"]
tech_stack:
  added: []
  patterns: ["MSA ICU translation", "locked glossary enforcement"]
key_files:
  created: []
  modified:
    - frontend/src/lib/i18n/translations/ar/candidateApp.login.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.register.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.resetPassword.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.setPassword.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.settings.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.basicInfo.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.common.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.home.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.error.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.help.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.info.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.notSupported.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.preview.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.privacy.json
decisions:
  - "D-05: OpenVAA kept Latin verbatim; البوصلة الانتخابية used for Election Compass"
  - "codePlaceholder: مثال: CP23-174a-f4%&-aHAB — Arabic prefix, Latin code preserved"
  - "Emoji 🐣 preserved in candidateApp.notSupported.heroEmoji verbatim"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-15"
  tasks_completed: 2
  files_modified: 14
---

# Phase arabic-translations Plan 03: Candidate App Tier-1 MSA Translation Summary

## One-liner

14 simple candidateApp.* ar/ files translated to MSA with locked glossary terms, ICU tokens preserved, codePlaceholder Latin code intact, and D-06 check passing at 0 failures.

## What Was Built

All 14 Tier-1 candidateApp translation files (no ICU plurals, no embedded HTML) were translated from English passthrough to Modern Standard Arabic. The translations cover:

- **Auth/account group (7 files):** login, register, resetPassword, setPassword, settings, basicInfo, common
- **Home/info/misc group (7 files):** home, error, help, info, notSupported, preview, privacy

Key glossary terms applied consistently:
- تسجيل الدخول (login/sign in)
- كلمة المرور (password)
- التسجيل (register/registration)
- البريد الإلكتروني (email)
- البوصلة الانتخابية (Election Compass — descriptive phrase, translated per D-05)
- الخصوصية (privacy)
- مرشح / ترشيح (candidate / nomination)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Translate candidate auth/account files | ae9598fff | 7 candidateApp.{login,register,resetPassword,setPassword,settings,basicInfo,common}.json |
| 2 | Translate candidate home/info/misc files | c7ea83e76 | 7 candidateApp.{home,error,help,info,notSupported,preview,privacy}.json |

## Verification Results

- `yarn workspace @openvaa/frontend test:unit -- translations`: 360 tests passed (16 test files, 1 skipped)
- `cd frontend && yarn tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`: Summary: 0 checks failed, 127 passed (exit=0)
- All 14 ar/ files confirmed to differ from their en/ siblings (python3 json-not-equal assertion)
- `grep -F 'CP23-174a-f4%&-aHAB' candidateApp.register.json`: confirmed Latin code preserved
- All 14 files pass `python3 -m json.tool` (valid JSON)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All 14 files contain complete MSA Arabic copy, no English passthrough remains.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. These are static JSON translation files only.

## Self-Check: PASSED

Files confirmed present:
- frontend/src/lib/i18n/translations/ar/candidateApp.login.json: FOUND
- frontend/src/lib/i18n/translations/ar/candidateApp.register.json: FOUND
- frontend/src/lib/i18n/translations/ar/candidateApp.home.json: FOUND
- (all 14 files written and committed)

Commits confirmed:
- ae9598fff (Task 1 — 7 auth/account files)
- c7ea83e76 (Task 2 — 7 home/info/misc files)
