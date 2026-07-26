---
phase: arabic-translations
plan: "05"
subsystem: frontend/i18n
tags: [translation, arabic, msa, icu-plurals, html, select, date-skeleton]
dependency_graph:
  requires: ["01"]
  provides: ["ar-icu-plural-files", "ar-html-select-date-files"]
  affects: ["frontend/src/lib/i18n/translations/ar/"]
tech_stack:
  added: []
  patterns: ["ICU MessageFormat CLDR plural expansion", "Arabic dual form (two arm)", "ICU select construct with nested HTML", "date skeleton preservation"]
key_files:
  created: []
  modified:
    - frontend/src/lib/i18n/translations/ar/results.json
    - frontend/src/lib/i18n/translations/ar/questions.json
    - frontend/src/lib/i18n/translations/ar/components.json
    - frontend/src/lib/i18n/translations/ar/entityList.json
    - frontend/src/lib/i18n/translations/ar/feedback.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.questions.json
    - frontend/src/lib/i18n/translations/ar/candidateApp.logoutModal.json
    - frontend/src/lib/i18n/translations/ar/about.json
    - frontend/src/lib/i18n/translations/ar/privacy.json
    - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
decisions:
  - "Arabic ICU plurals expanded to full CLDR zero/one/two/few/many/other arms; dual two form (تحالفان, كتلتان, دقيقتان, ثانيتان) present in all applicable strings"
  - "D-06 check script extractTokens/extractConstructs regex tightened to require lowerCamelCase identifier start, preventing false positive on English prose word 'However' inside plural arm"
  - "candidateSingular token preserved in results.candidate.numShown one-arm to satisfy D-06 union-token check"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 10
---

# Phase arabic-translations Plan 05: ICU/HTML File Translation Summary

**One-liner:** All 9 ICU-plural and HTML/select/date-skeleton ar/ files translated to MSA with correct Arabic CLDR plural arms, preserved ICU constructs, and intact HTML structure.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Translate 7 ICU-plural files | 9fdeb22b5 | results, questions, components, entityList, feedback, candidateApp.questions, candidateApp.logoutModal + D-06 script fix |
| 2 | Translate HTML/select/date files | 42f95b51d | about.json, privacy.json |

## What Was Built

### Task 1: Seven ICU-plural files

All seven files replaced English-seeded values with MSA Arabic. For every ICU `plural` block, English arms (`=0`/`=1`/`other`) were expanded to the full Arabic CLDR set: `zero`/`one`/`two`/`few`/`many`/`other`. The Arabic grammatical dual form (`two`) is present throughout:

- **results.json**: `تحالفان` (two alliances), `كتلتان` (two factions); `{candidateSingular}` token preserved in the `one` arm of `candidate.numShown`
- **questions.json**: `سؤالان` (two questions) in `category.numQuestions`; `minQuestions` nested plural and `numCategories` plural kept structurally exact; empty arms `=0 {}` and `=1 {}` preserved verbatim
- **components.json**: `دقيقتان`/`ثانيتان` dual forms in `video.timeLeft`; `matchScore.label` → `درجة التطابق` per glossary; `{score}%` token preserved
- **entityList.json**: `showingNumResults` expanded from 2 English arms to 5 Arabic arms; `{numShown}` token present across all arms
- **feedback.json**: `popupTitle` references البوصلة الانتخابية; `rating.valueLabel` expanded to full CLDR set preserving `{ratingMax}` token
- **candidateApp.questions.json**: `unansweredWarning` expanded to full Arabic CLDR set with dual `سؤالان`; `{numUnansweredQuestions}` preserved; `{questionId}` tokens in error keys
- **candidateApp.logoutModal.json**: `itemsLeft` and `questionsLeft` dual forms; both `{infoQuestionsLeft}` and `{opinionQuestionsLeft}` tokens preserved in the correct arm

### Task 2: HTML/select/date files

- **about.json**: `content` key preserves `<p>`, `<ul>`, `<li>` HTML structure verbatim; `{candidatePlural}` and `{partyPlural}` tokens kept. `organizationMatching.content` preserves the compound `{partyMatchingMethod, select, answersOnly {...} imputed {...} other {...}}` construct with nested `<p>` tags in each branch exactly.
- **privacy.json**: Both `{consentDate, date, ::yyyyMMd}` date skeletons preserved verbatim in `denied`/`granted` keys. `{analyticsLink}` token preserved in both `umami` keys. Double-space before "You can change" in `granted` value retained as-is from English source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] D-06 checkArabicPlaceholders.ts false positive on English prose inside plural arm**

- **Found during:** Task 1 acceptance check (`yarn tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`)
- **Issue:** `questions.intro.ingress.withCategorySelection` English value contains `other {However, select enough categories...}`. The `extractTokens` regex `/\{([a-zA-Z_][a-zA-Z0-9_]*)[,}]/g` matched `However` as an ICU token name (starts with uppercase `H` but regex allowed `[a-zA-Z_]`). The `extractConstructs` regex matched `, select ` inside that arm as an ICU select construct. Both patterns found `However` and `select` in English but not in Arabic — reporting 2 false failures.
- **Fix:** Changed both `extractTokens` and `extractConstructs` regex to require identifier to start with `[a-z_]` (lowercase letter or underscore) instead of `[a-zA-Z_]`. ICU placeholder names in this codebase consistently use lowerCamelCase (`numShown`, `candidatePlural`, etc.); uppercase-starting words inside arm prose (like `However`) are not ICU identifiers.
- **Files modified:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`
- **Commit:** 9fdeb22b5

**2. [Rule 1 - Bug] Missing {candidateSingular} token in results.candidate.numShown**

- **Found during:** Task 1 D-06 check
- **Issue:** Initial Arabic `one` arm of `results.candidate.numShown` used hardcoded text "مرشح واحد" without the `{candidateSingular}` token. D-06 checks union of tokens across all arms; `candidateSingular` present in English `=1` arm must appear somewhere in the Arabic value.
- **Fix:** Changed `one` arm to `{candidateSingular} واحد` so the token is preserved while the Arabic grammar remains natural.
- **Files modified:** `frontend/src/lib/i18n/translations/ar/results.json`
- **Commit:** 9fdeb22b5 (within same task)

## Verification Results

- `yarn workspace @openvaa/frontend test:unit -- translations`: **360 passed** (key-parity green)
- `cd frontend && yarn tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?`: **0 checks failed, 125 passed. exit=0**
- `grep -F '::yyyyMM' ar/privacy.json`: matches — date skeleton preserved verbatim
- `grep -c 'two {' ar/results.json`: 5 — Arabic dual arm present
- All 9 ar/ files differ from en/ siblings (Python JSON equality check)
- All 9 files valid JSON (python3 -m json.tool)

## Known Stubs

None. All 9 files contain MSA Arabic content.

## Threat Flags

None. This plan only modifies translation string values; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `frontend/src/lib/i18n/translations/ar/results.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/questions.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/components.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/entityList.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/feedback.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/candidateApp.questions.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/candidateApp.logoutModal.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/about.json` — FOUND
- `frontend/src/lib/i18n/translations/ar/privacy.json` — FOUND
- Commit 9fdeb22b5 — FOUND (Task 1)
- Commit 42f95b51d — FOUND (Task 2)
