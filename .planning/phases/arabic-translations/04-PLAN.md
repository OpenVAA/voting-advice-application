---
phase: arabic-translations
plan: 04
type: execute
wave: 1
depends_on: ["01"]
files_modified:
  - frontend/src/lib/i18n/translations/ar/constituencies.json
  - frontend/src/lib/i18n/translations/ar/elections.json
  - frontend/src/lib/i18n/translations/ar/entityCard.json
  - frontend/src/lib/i18n/translations/ar/entityDetails.json
  - frontend/src/lib/i18n/translations/ar/entityFilters.json
  - frontend/src/lib/i18n/translations/ar/help.json
  - frontend/src/lib/i18n/translations/ar/info.json
  - frontend/src/lib/i18n/translations/ar/maintenance.json
  - frontend/src/lib/i18n/translations/ar/statistics.json
  - frontend/src/lib/i18n/translations/ar/yourList.json
  - frontend/src/lib/i18n/translations/ar/error.json
autonomous: true
decisions: [D-01, D-03, D-05]
requirements: [D-01, D-03, D-05]

must_haves:
  truths:
    - "All 11 voter-facing simple ar/ files contain MSA Arabic copy, not English passthrough (D-01)"
    - "These files contribute to full voter-app coverage (D-03)"
    - "error.json's one HTML-bearing value preserves its tag set exactly (D-06 guards it)"
    - "Glossary domain terms (constituency, election, filters, statistics) used consistently"
    - "Key parity stays green and the D-06 check passes for these 11 files"
  artifacts: []
  key_links:
    - from: "frontend/src/lib/i18n/translations/ar/{constituencies,elections,entityFilters,error,...}.json"
      to: "frontend/src/lib/i18n/translations/en/{...}.json"
      via: "same key names, MSA Arabic values, preserved tokens and HTML tags"
      pattern: "translations/ar"
---

<objective>
Translate the 11 voter-facing low-complexity frontend files to MSA against their `en/` source, using the locked glossary. Ten are pure plain-text (Tier 1); `error.json` carries one HTML-bearing value (RESEARCH §1 flags HTML for error.json) whose tag set the D-06 check will guard.

Purpose: D-03 full coverage of the voter app's simple strings.
Output: 11 translated `ar/*.json` files.
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
  <name>Task 1: Translate entity + filter + constituency/election files</name>
  <files>frontend/src/lib/i18n/translations/ar/entityCard.json, frontend/src/lib/i18n/translations/ar/entityDetails.json, frontend/src/lib/i18n/translations/ar/entityFilters.json, frontend/src/lib/i18n/translations/ar/constituencies.json, frontend/src/lib/i18n/translations/ar/elections.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/entityCard.json (2 keys)
    - frontend/src/lib/i18n/translations/en/entityDetails.json (5 keys)
    - frontend/src/lib/i18n/translations/en/entityFilters.json (12 keys)
    - frontend/src/lib/i18n/translations/en/constituencies.json (3 keys)
    - frontend/src/lib/i18n/translations/en/elections.json (1 key)
    - .planning/phases/arabic-translations/GLOSSARY.md (constituency, election, filters terms)
  </read_first>
  <action>
    Translate each `ar/` file to MSA against its `en/` source key-by-key, keys unchanged. Use glossary renderings for constituency (دائرة انتخابية), election (انتخابات), filters (الفلاتر), and candidate/party domain terms. Preserve every ICU `{token}` verbatim (including {candidateSingular}/{candidatePlural}/{partySingular}/{partyPlural} runtime tokens). Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - For each of the five files, `ar` differs from its `en` sibling (`python3` json-not-equal assertion per file).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0`.
    - Each file valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>Five entity/filter/constituency/election files contain MSA Arabic, keys/tokens intact, parity + D-06 green.</done>
</task>

<task type="auto">
  <name>Task 2: Translate top-level voter utility files (help, info, maintenance, statistics, yourList, error)</name>
  <files>frontend/src/lib/i18n/translations/ar/help.json, frontend/src/lib/i18n/translations/ar/info.json, frontend/src/lib/i18n/translations/ar/maintenance.json, frontend/src/lib/i18n/translations/ar/statistics.json, frontend/src/lib/i18n/translations/ar/yourList.json, frontend/src/lib/i18n/translations/ar/error.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/help.json (1 key)
    - frontend/src/lib/i18n/translations/en/info.json (1 key)
    - frontend/src/lib/i18n/translations/en/maintenance.json (1 key)
    - frontend/src/lib/i18n/translations/en/statistics.json (2 keys)
    - frontend/src/lib/i18n/translations/en/yourList.json (1 key)
    - frontend/src/lib/i18n/translations/en/error.json (11 keys — one value embeds HTML per RESEARCH §1)
    - .planning/phases/arabic-translations/GLOSSARY.md (statistics, results terms)
  </read_first>
  <action>
    Translate each `ar/` file to MSA against its `en/` source key-by-key, keys unchanged. For `error.json`: identify the HTML-bearing value and preserve its exact tag set (same tag names, same `href`/attribute targets) while translating the surrounding text — the parser uses `ignoreTag: true` so tags pass through as literal text rendered via `{@html}`; dropping or altering a tag breaks rendering. Preserve every ICU `{token}` verbatim. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - For each of the six files, `ar` differs from its `en` sibling (`python3` json-not-equal assertion per file).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` (proves error.json HTML tag set preserved).
    - Each file valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>Six voter utility files contain MSA Arabic, error.json HTML tags preserved, keys/tokens intact, parity + D-06 green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Translated JSON value → voter UI render | Mostly plain text; `error.json` has one HTML value rendered via `{@html}` — a dropped/injected tag could become a rendering/XSS issue. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-V1 | Tampering | HTML in error.json value (`{@html}` render) | mitigate | D-06 check asserts the en tag-name set is a subset of ar (no dropped/added tags); Task 2 preserves the tag set exactly. |
| T-arabic-V2 | Tampering | ICU runtime tokens ({candidatePlural} etc.) | mitigate | D-06 token-set check; tokens repositioned not dropped. |
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit -- translations` green.
- `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` exits 0.
- All 11 `ar/` files in this plan differ from their `en/` siblings.
</verification>

<success_criteria>
11 voter-facing simple files render MSA Arabic, error.json HTML preserved, keys/tokens intact, parity + D-06 green — advancing D-03.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/04-SUMMARY.md` when done.
</output>
