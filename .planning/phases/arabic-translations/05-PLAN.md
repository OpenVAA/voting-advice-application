---
phase: arabic-translations
plan: 05
type: execute
wave: 1
depends_on: ["01"]
files_modified:
  - frontend/src/lib/i18n/translations/ar/candidateApp.logoutModal.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.questions.json
  - frontend/src/lib/i18n/translations/ar/components.json
  - frontend/src/lib/i18n/translations/ar/entityList.json
  - frontend/src/lib/i18n/translations/ar/feedback.json
  - frontend/src/lib/i18n/translations/ar/questions.json
  - frontend/src/lib/i18n/translations/ar/results.json
  - frontend/src/lib/i18n/translations/ar/about.json
  - frontend/src/lib/i18n/translations/ar/privacy.json
autonomous: true
decisions: [D-01, D-03, D-05]
requirements: [D-01, D-03, D-05]

must_haves:
  truths:
    - "All 9 ICU/HTML-bearing ar/ files contain MSA Arabic copy with correct Arabic plural arms (D-01)"
    - "Arabic ICU plurals use CLDR zero/one/two/few/many/other arms including the dual `two` form (Claude's Discretion: plural expansion)"
    - "ICU `select`, date-skeleton, and embedded HTML constructs in about.json/privacy.json are preserved (D-06 guards them)"
    - "Plural expansion does not break key parity (flattenKeys stops at string leaves)"
    - "Key parity stays green and the D-06 check passes for these 9 files"
  artifacts: []
  key_links:
    - from: "frontend/src/lib/i18n/translations/ar/{results,questions,components,...}.json"
      to: "frontend/src/lib/i18n/translations/en/{...}.json"
      via: "same key names; Arabic plural arms; preserved ICU constructs, tokens, HTML"
      pattern: "plural|select|<p>"
---

<objective>
Translate the 9 ICU-bearing and HTML-bearing frontend files to MSA against their `en/` source: the 7 ICU-plural files (candidateApp.logoutModal, candidateApp.questions, components, entityList, feedback, questions, results) and the 2 HTML/select/date files (about.json — `{partyMatchingMethod, select, ...}` with nested `<p>`; privacy.json — date skeletons). Expand English plural arms to the correct Arabic CLDR set (zero/one/two/few/many/other) inside values per Claude's Discretion; this stays inside the string leaf so key parity is unaffected (RESEARCH §2).

Purpose: D-03 full coverage of the ICU/HTML-heavy mid-tier files; correct Arabic plural grammar (the dual `two` form is the most common omission per RESEARCH Pitfall 5).
Output: 9 translated `ar/*.json` files.
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
None new — modifies existing `ar/*.json` files only.
</artifacts_this_phase_produces>

<tasks>

<task type="auto">
  <name>Task 1: Translate ICU-plural files (results, questions, components, entityList, feedback, candidateApp.questions, candidateApp.logoutModal)</name>
  <files>frontend/src/lib/i18n/translations/ar/results.json, frontend/src/lib/i18n/translations/ar/questions.json, frontend/src/lib/i18n/translations/ar/components.json, frontend/src/lib/i18n/translations/ar/entityList.json, frontend/src/lib/i18n/translations/ar/feedback.json, frontend/src/lib/i18n/translations/ar/candidateApp.questions.json, frontend/src/lib/i18n/translations/ar/candidateApp.logoutModal.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/results.json (15 keys — 5 plural forms using {candidatePlural}/{partySingular})
    - frontend/src/lib/i18n/translations/en/questions.json (17 keys — nested plural {minQuestions, plural, ...} + {partyMatchingMethod, select, ...})
    - frontend/src/lib/i18n/translations/en/components.json (50 keys — plurals incl. matchScore)
    - frontend/src/lib/i18n/translations/en/entityList.json (5 keys — plural)
    - frontend/src/lib/i18n/translations/en/feedback.json (13 keys — plural)
    - frontend/src/lib/i18n/translations/en/candidateApp.questions.json (18 keys — plural)
    - frontend/src/lib/i18n/translations/en/candidateApp.logoutModal.json (5 keys — plural)
    - .planning/phases/arabic-translations/GLOSSARY.md (Arabic plural categories section; results/question/match-score terms)
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§3 Arabic plural rules table; Pitfalls 1,2,5)
  </read_first>
  <action>
    Translate each `ar/` file to MSA against its `en/` source key-by-key, keys unchanged. For every ICU `plural` block, replace the English arms (`=0`/`=1`/`other` etc.) with the full Arabic CLDR set: `zero`/`one`/`two`/`few`/`many`/`other`, where `two` is the Arabic dual (suffix -ان nominative). Use the glossary's plural-categories note and §3 rules. Keep the ICU syntax exactly valid (keyword forms with a space before `{`, balanced braces). Preserve every interpolation token across ALL arms — `{candidatePlural}`, `{partySingular}`, `{count}`, `{minQuestions}`, `#` — repositioned within Arabic grammar but never dropped. Preserve any `select` construct and its branch keywords (e.g. `{partyMatchingMethod, select, ...}` in questions.json) exactly. Use glossary renderings for results/question/match-score/alliance/faction terms. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes (plural expansion does NOT break parity).
    - For each of the seven files, `ar` differs from its `en` sibling (`python3` json-not-equal assertion per file).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` (no dropped token/construct; plural-union check passes).
    - `grep -c 'two {' frontend/src/lib/i18n/translations/ar/results.json` >= 1 (Arabic dual arm present in at least the results plurals).
    - Each file valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>Seven ICU-plural files contain MSA Arabic with correct zero/one/two/few/many/other arms, tokens preserved across arms, parity + D-06 green.</done>
</task>

<task type="auto">
  <name>Task 2: Translate HTML/select/date files (about.json, privacy.json)</name>
  <files>frontend/src/lib/i18n/translations/ar/about.json, frontend/src/lib/i18n/translations/ar/privacy.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/about.json (9 keys — organizationMatching.content is `{partyMatchingMethod, select, ...}` with nested `<p>` HTML in each branch)
    - frontend/src/lib/i18n/translations/en/privacy.json (12 keys — `{consentDate, date, ::yyyyMMd}` date skeletons)
    - .planning/phases/arabic-translations/GLOSSARY.md (privacy, party-matching-method terms)
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§3 date skeletons; Pitfall 4 ignoreTag)
  </read_first>
  <action>
    Translate `ar/about.json` and `ar/privacy.json` to MSA against their `en/` sources, keys unchanged. In about.json's `organizationMatching.content`, preserve the `{partyMatchingMethod, select, ...}` construct and every branch keyword, and preserve the nested `<p>` (and any other) HTML tag set in each branch exactly — translate only the prose between tags. In privacy.json, preserve every date skeleton verbatim (e.g. `{consentDate, date, ::yyyyMMd}`) — these are formatting directives, not translatable text. Preserve all other ICU `{tokens}`. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - `ar/about.json` and `ar/privacy.json` each differ from their `en` siblings (`python3` json-not-equal assertion).
    - `grep -F '::yyyyMM' frontend/src/lib/i18n/translations/ar/privacy.json` matches (date skeleton preserved verbatim).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` (HTML tag set + select construct + date skeleton preserved).
    - Both files valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>about.json and privacy.json contain MSA Arabic with select/HTML/date constructs preserved, parity + D-06 green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Translated ICU/HTML value → render (`{@html}`, ICU plural resolution) | about.json embeds `<p>` HTML inside select branches rendered via `{@html}`; broken ICU syntax throws a parse error caught by init.ts try/catch (degrades to raw key). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-P1 | Tampering | Embedded `<p>` HTML in about.json select branches | mitigate | D-06 tag-set check asserts en tags survive in ar; Task 2 preserves tags exactly. |
| T-arabic-P2 | Denial of service | Malformed Arabic ICU plural/select syntax | mitigate | D-06 construct-presence check + `test:unit` run after each task; init.ts try/catch prevents a render crash, but the check catches the defect pre-merge. |
| T-arabic-P3 | Tampering | Date skeleton corruption in privacy.json | mitigate | Acceptance grep-asserts `::yyyyMM` survives verbatim. |
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit -- translations` green.
- `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` exits 0.
- All 9 `ar/` files in this plan differ from their `en/` siblings; Arabic dual `two` arm present in results plurals.
</verification>

<success_criteria>
9 ICU/HTML files render MSA Arabic with correct CLDR plural arms, preserved select/date/HTML constructs, parity + D-06 green — advancing D-03.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/05-SUMMARY.md` when done.
</output>
