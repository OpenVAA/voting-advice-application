---
phase: arabic-translations
plan: 03
type: execute
wave: 1
depends_on: ["01"]
files_modified:
  - frontend/src/lib/i18n/translations/ar/candidateApp.basicInfo.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.common.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.error.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.help.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.home.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.info.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.login.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.notSupported.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.preview.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.privacy.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.register.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.resetPassword.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.setPassword.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.settings.json
autonomous: true
decisions: [D-01, D-03, D-05]
requirements: [D-01, D-03, D-05]

must_haves:
  truths:
    - "All 14 simple candidateApp.* ar/ files contain MSA Arabic copy, not English passthrough (D-01)"
    - "These files contribute to full coverage of the candidate app (D-03)"
    - "candidateApp.register.codePlaceholder keeps its Latin example code while 'E.g.' is translated (D-05 + RESEARCH Open Question 3)"
    - "All ICU `{tokens}` (e.g. {appName}) are preserved; glossary renderings used for login/password/register terms"
    - "Key parity stays green and the D-06 check passes for these 14 files"
  artifacts: []
  key_links:
    - from: "frontend/src/lib/i18n/translations/ar/candidateApp.*.json"
      to: "frontend/src/lib/i18n/translations/en/candidateApp.*.json"
      via: "same key names, MSA Arabic values, preserved tokens"
      pattern: "candidateApp"
---

<objective>
Translate the 14 lower-complexity `candidateApp.*` frontend files to MSA against their `en/` source, using the locked glossary. These are Tier-1 simple strings (no ICU plurals, no HTML — RESEARCH §8). The ICU-plural candidate files (logoutModal, questions) are handled in Plan 05; the HTML/brand/emoji-heavy `preregister.json` is handled in Plan 06.

Purpose: D-03 full coverage of the candidate app.
Output: 14 translated `ar/candidateApp.*.json` files.
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
None new — modifies existing `ar/candidateApp.*.json` files only.
</artifacts_this_phase_produces>

<tasks>

<task type="auto">
  <name>Task 1: Translate candidate auth/account files (login, register, resetPassword, setPassword, settings, basicInfo, common)</name>
  <files>frontend/src/lib/i18n/translations/ar/candidateApp.login.json, frontend/src/lib/i18n/translations/ar/candidateApp.register.json, frontend/src/lib/i18n/translations/ar/candidateApp.resetPassword.json, frontend/src/lib/i18n/translations/ar/candidateApp.setPassword.json, frontend/src/lib/i18n/translations/ar/candidateApp.settings.json, frontend/src/lib/i18n/translations/ar/candidateApp.basicInfo.json, frontend/src/lib/i18n/translations/ar/candidateApp.common.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/candidateApp.login.json (5 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.register.json (18 keys — note codePlaceholder)
    - frontend/src/lib/i18n/translations/en/candidateApp.resetPassword.json (7 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.setPassword.json (6 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.settings.json (17 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.basicInfo.json (8 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.common.json (9 keys)
    - .planning/phases/arabic-translations/GLOSSARY.md (login/register/password/email terms)
  </read_first>
  <action>
    Translate each `ar/` file to MSA against its `en/` source key-by-key, keys unchanged. Use the glossary's locked login/register/password/email renderings. Preserve every ICU `{token}` verbatim ({appName}, {firstName}, {email}, etc.). For `candidateApp.register.codePlaceholder` (value `"E.g. CP23-174a-f4%&-aHAB"`): translate the `E.g.` prefix to `مثال:` and keep the example code Latin verbatim → `"مثال: CP23-174a-f4%&-aHAB"` (RESEARCH Open Question 3). Per D-05 keep any other Latin brand verbatim. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - For each of the seven files, `ar` differs from its `en` sibling (`python3` json-not-equal assertion per file).
    - `grep -F 'CP23-174a-f4%&-aHAB' frontend/src/lib/i18n/translations/ar/candidateApp.register.json` matches (example code preserved Latin).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0`.
    - Each file valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>Seven candidate auth/account files contain MSA Arabic, keys/tokens intact, codePlaceholder handled, parity + D-06 green.</done>
</task>

<task type="auto">
  <name>Task 2: Translate candidate home/info/misc files (home, basicInfo extras, error, help, info, notSupported, preview, privacy)</name>
  <files>frontend/src/lib/i18n/translations/ar/candidateApp.home.json, frontend/src/lib/i18n/translations/ar/candidateApp.error.json, frontend/src/lib/i18n/translations/ar/candidateApp.help.json, frontend/src/lib/i18n/translations/ar/candidateApp.info.json, frontend/src/lib/i18n/translations/ar/candidateApp.notSupported.json, frontend/src/lib/i18n/translations/ar/candidateApp.preview.json, frontend/src/lib/i18n/translations/ar/candidateApp.privacy.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/candidateApp.home.json (11 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.error.json (5 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.help.json (4 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.info.json (1 key)
    - frontend/src/lib/i18n/translations/en/candidateApp.notSupported.json (3 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.preview.json (4 keys)
    - frontend/src/lib/i18n/translations/en/candidateApp.privacy.json (2 keys)
    - .planning/phases/arabic-translations/GLOSSARY.md
  </read_first>
  <action>
    Translate each `ar/` file to MSA against its `en/` source key-by-key, keys unchanged. Use glossary domain terms (candidate, question, privacy, etc.). Preserve every ICU `{token}` verbatim; keep any Latin brand per D-05; translate descriptive phrases. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - For each of the seven files, `ar` differs from its `en` sibling (`python3` json-not-equal assertion per file).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0`.
    - Each file valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>Seven candidate home/info/misc files contain MSA Arabic, keys/tokens intact, parity + D-06 green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Translated JSON value → candidate UI render | These 14 files have no HTML (RESEARCH §1); the render surface is plain text + ICU interpolation. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-C1 | Tampering | ICU `{token}` integrity (e.g. {appName}, {firstName}) | mitigate | D-06 check asserts every en token name survives in ar; run after each task. |
| T-arabic-C2 | Tampering | Example registration code in codePlaceholder | mitigate | Acceptance criteria grep-asserts the Latin code is preserved verbatim. |
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit -- translations` green.
- `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` exits 0.
- All 14 `ar/candidateApp.*.json` (this plan's set) differ from their `en/` siblings.
</verification>

<success_criteria>
14 simple candidateApp files render MSA Arabic, keys/tokens intact, parity + D-06 green — advancing D-03 full coverage.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/03-SUMMARY.md` when done.
</output>
