---
phase: arabic-translations
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/phases/arabic-translations/GLOSSARY.md
  - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
autonomous: true
decisions: [D-02, D-05, D-06]
requirements: [D-02, D-05, D-06]

must_haves:
  truths:
    - "A locked MSA glossary file exists fixing one Arabic rendering for each recurring VAA domain term (D-02)"
    - "The glossary records the D-05 brand rule: OpenVAA and Bank ID stay Latin; descriptive phrases like Election Compass are translated"
    - "A D-06 placeholder-safety check script exists at frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts and runs via tsx (D-06)"
    - "The D-06 script exits 0 when ar == en (baseline) and exits 1 when a placeholder/ICU/HTML/href/brand/\\n token is dropped"
    - "The D-06 script is NOT wired into vitest or CI (one-time tool per D-06)"
  artifacts:
    - path: ".planning/phases/arabic-translations/GLOSSARY.md"
      provides: "Locked MSA glossary of recurring VAA domain terms + brand-handling rule"
      contains: "OpenVAA"
    - path: "frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts"
      provides: "Per-key placeholder/ICU/HTML/href/brand/newline integrity diff between en and ar"
      min_lines: 60
  key_links:
    - from: "frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts"
      to: "frontend/src/lib/i18n/translations/en + ar"
      via: "reads both locale trees, flattens, diffs per key"
      pattern: "translations/(en|ar)"
---

<objective>
Build the two Wave 0 foundations that gate every translation task: (1) a locked Modern Standard Arabic glossary so the same Arabic word is used for a given VAA term everywhere (D-02), and (2) the D-06 placeholder-safety check script that proves no translated value drops or renames an ICU token, ICU construct, HTML tag, href target, Latin-kept brand name, or literal `\n` (D-06). The glossary also encodes the D-05 brand/proper-noun rule.

Purpose: Without a locked glossary, the 46 files drift to inconsistent Arabic renderings. Without the D-06 script, the key-parity test (which compares key names only) cannot catch value-level token corruption — the single highest content risk of this phase.
Output: `.planning/phases/arabic-translations/GLOSSARY.md` and `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/phases/arabic-translations/arabic-translations-CONTEXT.md
@.planning/phases/arabic-translations/arabic-translations-RESEARCH.md
@.planning/phases/rtl-bidi-support/DECISIONS.md
</context>

<artifacts_this_phase_produces>
NEW files created by this plan:
- `.planning/phases/arabic-translations/GLOSSARY.md` — locked MSA glossary + brand rule (D-02, D-05).
- `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` — D-06 one-time check script.

(The 46 `ar/` JSON files are *modified* by later plans, not produced here.)
</artifacts_this_phase_produces>

<tasks>

<task type="auto">
  <name>Task 1: Build and lock the MSA glossary (D-02, D-05)</name>
  <files>.planning/phases/arabic-translations/GLOSSARY.md</files>
  <read_first>
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§7 Glossary Seed table, §5 brand rule, Open Questions 1-3)
    - .planning/phases/arabic-translations/arabic-translations-CONTEXT.md (D-02, D-05)
    - frontend/src/lib/i18n/translations/en/common.json (source terms: candidate, organization, constituency, election, alliance, faction, question, answer, openVAA)
    - frontend/src/lib/i18n/translations/index.ts (DEFAULT_PAYLOAD_KEYS token names: candidateSingular, candidatePlural, partySingular, partyPlural)
  </read_first>
  <action>
    Create GLOSSARY.md as a Markdown table mapping each recurring VAA domain term to ONE fixed MSA Arabic rendering, seeded from RESEARCH §7. Cover at minimum: candidate singular/plural, party/organization singular/plural, constituency, election, opinion/opinions, alliance singular/plural, faction singular/plural, question, results, answer yes/no, match score, filters, login, register, password, email, feedback, privacy, statistics, loading, saving, continue, back, close, plus the adminApp job-state terms (Pending/Confirmed/Locked per RESEARCH Open Question 1). Use المرشحون as the default candidate-plural, البوصلة الانتخابية for "Election Compass". Add a "Brand / proper-noun rule (D-05)" section stating: OpenVAA and Bank ID stay Latin verbatim (bidi-isolated at render by the already-shipped RTL infra, no JSON action needed); ICU tokens (`{appName}`, `{firstName}`, `{adminEmailLink}`, etc.) pass through verbatim; descriptive phrases translate. Add an "Arabic ICU plural categories" note recording the CLDR zero/one/two/few/many/other mapping (RESEARCH §3) so every translator uses the dual `two` form. Mark the file header "LOCKED — do not revise mid-phase".
  </action>
  <acceptance_criteria>
    - `wc -c .planning/phases/arabic-translations/GLOSSARY.md` > 0 and the file contains a term table.
    - `grep -c 'OpenVAA' .planning/phases/arabic-translations/GLOSSARY.md` >= 1 and `grep -c 'Bank ID' .planning/phases/arabic-translations/GLOSSARY.md` >= 1 (brand rule present).
    - `grep -F 'البوصلة الانتخابية' .planning/phases/arabic-translations/GLOSSARY.md` matches (Election Compass rendering fixed).
    - Glossary contains a section naming the six Arabic plural categories zero/one/two/few/many/other.
  </acceptance_criteria>
  <done>GLOSSARY.md exists, is non-empty, fixes one Arabic rendering per recurring term, encodes the D-05 brand rule and the Arabic plural categories, and is marked LOCKED.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build the D-06 placeholder-safety check script</name>
  <files>frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts</files>
  <behavior>
    - On the current repo state (all ar == en) the script exits 0 and prints "Summary: 0 checks failed".
    - If an ar value drops an ICU `{token}` present in en, the script reports `FAIL` for that key and exits 1.
    - If en contains a `plural`/`select`/`date` construct absent from ar, the script reports a missing-construct FAIL.
    - If en contains an HTML tag (e.g. `<a>`) absent from ar, the script reports a missing-tag FAIL.
    - If en contains `href="{registrationUrl}"` absent from ar, the script reports a missing-href FAIL.
    - If en contains `Bank ID` or `OpenVAA` absent from ar, the script reports a missing-brand FAIL.
    - If en contains literal `\n` absent from ar, the script reports a missing-newline FAIL.
    - Plural-arm expansion (en `=0/=1/other` → ar `zero/one/two/few/many/other`) does NOT FAIL as long as the token UNION is preserved.
  </behavior>
  <read_first>
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§4 — full implementation spec, regexes, brand list, output format, exit codes)
    - frontend/tools/editTranslations/editTranslations.ts (lines 280-289 — `flattenKeys` returning `[key, value]` pairs; reuse this pattern, do not re-derive)
    - frontend/src/lib/i18n/tests/translations.test.ts (flatten semantics: recursion stops at non-object leaf)
    - frontend/package.json (confirm `tsx` is in devDependencies)
  </read_first>
  <action>
    Create the script at the exact path `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`, runnable as `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`. Reuse the `flattenKeys` `[key, value]` approach from editTranslations.ts to build `{key: value}` maps for en and ar across all 46 files (read every `.json` in `src/lib/i18n/translations/en` and the `ar` sibling). For each leaf key where both values are strings, run the six checks from RESEARCH §4: (1) ICU placeholder token set — extract `{identifier}` names with `/\{([a-zA-Z_][a-zA-Z0-9_]*)[,}]/g`, excluding ICU keywords plural/select/selectordinal/number/date/time, assert every en token name appears in ar; (2) ICU construct presence — for each of plural/select/date/selectordinal present in en, assert present in ar; (3) HTML tag set — extract tag names with `/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g`, assert en tag-name set is a subset of ar's; (4) href targets — extract `href="..."`, assert each en href appears verbatim in ar; (5) Latin brands — for the hardcoded list `["Bank ID", "OpenVAA"]`, assert each brand present in en is present literally in ar; (6) literal `\n` — if en value contains `\n`, assert ar does too. For plural values, take the UNION of tokens across all arms before comparing (per RESEARCH §4 "Critical" note) so legitimate expansion is not flagged. Print `FAIL [filename.key]: {reason} — en: "..." | ar: "..."` per failure and a final `Summary: N checks failed, M passed.`; exit 1 if any check failed, else 0. Do NOT add the script to vitest config or any CI workflow — it is invoked manually only (D-06).
  </action>
  <acceptance_criteria>
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo "exit=$?"` prints `exit=0` against the current all-passthrough state (en == ar baseline) and a `Summary:` line.
    - `grep -rn 'checkArabicPlaceholders' frontend/vitest.config.ts frontend/vite.config.ts 2>/dev/null | wc -l` returns 0 (not wired into the test runner).
    - The script references both `translations/en` and `translations/ar` (`grep -E "translations/(en|ar)" frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` matches).
    - `wc -l frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` >= 60.
  </acceptance_criteria>
  <done>The D-06 script exists at the specified path, exits 0 on the en==ar baseline, performs all six per-key integrity checks with plural-union handling, prints the specified output format, and is not wired into CI/vitest.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Translated JSON value → rendered DOM (`{@html}`) | Email/info values embed raw HTML rendered via Svelte `{@html}`; a malformed or injected tag in a translated string could become a rendering/XSS issue. |
| Frontend `dynamic.json` → backend via `yarn sync:translations` | Token/href corruption propagates to Strapi if undetected. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-01 | Tampering | Translated HTML in email/info values (`{@html}` render) | mitigate | D-06 check asserts the en HTML tag-name set is a subset of ar (no dropped/added tags); translators mirror the en tag set exactly. This plan BUILDS that check. |
| T-arabic-02 | Tampering | `href="{registrationUrl}"` / URL tokens | mitigate | D-06 check asserts each en href value appears verbatim in ar. |
| T-arabic-SC | Tampering | npm/pip/cargo installs | accept | No package installs in this phase — `tsx` and `rsync` already present (RESEARCH Environment Availability). No legitimacy gate required. |
</threat_model>

<verification>
- `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` on baseline.
- `yarn workspace @openvaa/frontend test:unit` → key-parity test still green (this plan touches no JSON values).
- GLOSSARY.md present, non-empty, LOCKED.
</verification>

<success_criteria>
- GLOSSARY.md locks one MSA rendering per recurring term and the D-05 brand rule.
- D-06 script runs via tsx, exits 0 on baseline, fails on any dropped token/construct/tag/href/brand/newline, handles plural-arm expansion, and is not in CI.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/01-SUMMARY.md` when done.
</output>
