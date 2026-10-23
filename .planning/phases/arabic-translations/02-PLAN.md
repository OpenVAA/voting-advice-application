---
phase: arabic-translations
plan: 02
type: execute
wave: 1
depends_on: ["01"]
files_modified:
  - frontend/src/lib/i18n/translations/ar/adminApp.argumentCondensation.json
  - frontend/src/lib/i18n/translations/ar/adminApp.common.json
  - frontend/src/lib/i18n/translations/ar/adminApp.error.json
  - frontend/src/lib/i18n/translations/ar/adminApp.factorAnalysis.json
  - frontend/src/lib/i18n/translations/ar/adminApp.jobs.json
  - frontend/src/lib/i18n/translations/ar/adminApp.languageFeatures.json
  - frontend/src/lib/i18n/translations/ar/adminApp.login.json
  - frontend/src/lib/i18n/translations/ar/adminApp.notSupported.json
  - frontend/src/lib/i18n/translations/ar/adminApp.questionInfo.json
autonomous: true
decisions: [D-01, D-04, D-05]
requirements: [D-01, D-04, D-05]

must_haves:
  truths:
    - "All 9 adminApp.* ar/ files contain MSA Arabic copy, not English passthrough (D-01, D-04)"
    - "adminApp strings are translated even though admin-app RTL layout remains deferred (D-04)"
    - "Job-state terms (Pending/Confirmed/Locked) use the glossary's locked MSA renderings (D-02 applied)"
    - "Any Latin brand/proper noun is preserved per D-05; all ICU `{tokens}` are preserved"
    - "Key parity stays green and the D-06 check passes for these 9 files"
  artifacts: []
  key_links:
    - from: "frontend/src/lib/i18n/translations/ar/adminApp.*.json"
      to: "frontend/src/lib/i18n/translations/en/adminApp.*.json"
      via: "same key names, MSA Arabic values, preserved tokens"
      pattern: "adminApp"
---

<objective>
Translate the 9 `adminApp.*` frontend files (121 keys) to Modern Standard Arabic against their `en/` source of truth, using the locked glossary. These are the lowest-complexity group (no ICU plurals, no HTML, no embedded brands per RESEARCH §1) — a clean first parallel batch. Per D-04, admin *strings* are translated here even though admin-app RTL *layout* stays deferred.

Purpose: D-03 demands full coverage including admin; D-04 explicitly locks admin strings into this phase.
Output: 9 translated `ar/adminApp.*.json` files.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/phases/arabic-translations/GLOSSARY.md
@.planning/phases/arabic-translations/arabic-translations-CONTEXT.md
@.planning/phases/arabic-translations/arabic-translations-RESEARCH.md
</context>

<artifacts_this_phase_produces>
None new — this plan modifies existing `ar/adminApp.*.json` files only.
</artifacts_this_phase_produces>

<tasks>

<task type="auto">
  <name>Task 1: Translate the larger adminApp files (jobs, questionInfo, argumentCondensation, factorAnalysis)</name>
  <files>frontend/src/lib/i18n/translations/ar/adminApp.jobs.json, frontend/src/lib/i18n/translations/ar/adminApp.questionInfo.json, frontend/src/lib/i18n/translations/ar/adminApp.argumentCondensation.json, frontend/src/lib/i18n/translations/ar/adminApp.factorAnalysis.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/adminApp.jobs.json (37 keys — job-state labels)
    - frontend/src/lib/i18n/translations/en/adminApp.questionInfo.json (25 keys)
    - frontend/src/lib/i18n/translations/en/adminApp.argumentCondensation.json (20 keys)
    - frontend/src/lib/i18n/translations/en/adminApp.factorAnalysis.json (14 keys)
    - .planning/phases/arabic-translations/GLOSSARY.md (job-state terms, domain terms)
  </read_first>
  <action>
    Replace each English leaf value in the four `ar/` files with formal MSA Arabic, translating against the matching `en/` file key-by-key. Keep every key name identical (do not add, remove, or rename keys). Preserve any ICU `{token}` verbatim and reposition (never drop) within the Arabic sentence if grammar requires. Use the glossary's locked renderings for job-state terms (Pending/Confirmed/Locked etc.) and all domain terms so admin vocabulary matches the rest of the app. Per D-05, keep any Latin proper noun or brand verbatim; translate descriptive phrases. Use formal MSA technical vocabulary for job-queue terminology (RESEARCH Open Question 1). Keep valid JSON (UTF-8, double-quoted, no trailing commas).
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes (key parity green for these files).
    - For each of the four files: `python3 -c "import json; a=json.load(open('frontend/src/lib/i18n/translations/ar/adminApp.jobs.json')); e=json.load(open('frontend/src/lib/i18n/translations/en/adminApp.jobs.json')); assert a!=e"` succeeds (ar no longer byte-identical to en) — repeat per file.
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` (no token/construct/tag/href/brand/newline dropped).
    - Each file is valid JSON (`python3 -m json.tool` succeeds on each).
  </acceptance_criteria>
  <done>The four larger adminApp files contain MSA Arabic, keys unchanged, tokens preserved, parity green, D-06 passing.</done>
</task>

<task type="auto">
  <name>Task 2: Translate the smaller adminApp files (login, common, error, notSupported, languageFeatures)</name>
  <files>frontend/src/lib/i18n/translations/ar/adminApp.login.json, frontend/src/lib/i18n/translations/ar/adminApp.common.json, frontend/src/lib/i18n/translations/ar/adminApp.error.json, frontend/src/lib/i18n/translations/ar/adminApp.notSupported.json, frontend/src/lib/i18n/translations/ar/adminApp.languageFeatures.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/adminApp.login.json (13 keys)
    - frontend/src/lib/i18n/translations/en/adminApp.common.json (4 keys)
    - frontend/src/lib/i18n/translations/en/adminApp.error.json (3 keys)
    - frontend/src/lib/i18n/translations/en/adminApp.notSupported.json (3 keys)
    - frontend/src/lib/i18n/translations/en/adminApp.languageFeatures.json (2 keys)
    - .planning/phases/arabic-translations/GLOSSARY.md (login/password/email terms)
  </read_first>
  <action>
    Translate each of the five smaller `ar/adminApp.*` files to MSA against the matching `en/` source, key-by-key, keys unchanged. Use the glossary's locked renderings for login, password, email, and error terminology so they match the candidate/voter login screens. Preserve all ICU `{tokens}` verbatim; keep any Latin brand per D-05. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - For each of the five files, the `ar` file is no longer byte-identical to its `en` sibling (`python3` json-not-equal assertion per file).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0`.
    - Each file is valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>The five smaller adminApp files contain MSA Arabic, keys unchanged, tokens preserved, parity green, D-06 passing.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Translated JSON value → admin UI render | adminApp strings render in the admin app; no HTML/`{@html}` in these files (RESEARCH §1 — no HTML flag), so the surface is minimal. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-A1 | Tampering | ICU `{token}` integrity in adminApp values | mitigate | D-06 check (built in Plan 01) asserts every en token name survives in ar; run after each task. |
| T-arabic-A2 | Information disclosure | adminApp.error messages leaking internals | accept | Translating existing English error strings 1:1 introduces no new disclosure; no message semantics changed. |
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit -- translations` green.
- `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` exits 0.
- All 9 `ar/adminApp.*.json` differ from their `en/` siblings.
</verification>

<success_criteria>
All 9 adminApp files render MSA Arabic, keys/tokens intact, parity and D-06 green — satisfying D-04 (admin strings translated) without touching admin RTL layout.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/02-SUMMARY.md` when done.
</output>
