---
phase: arabic-translations
plan: 06
type: execute
wave: 2
depends_on: ["01", "02", "03", "04", "05"]
files_modified:
  - frontend/src/lib/i18n/translations/ar/common.json
  - frontend/src/lib/i18n/translations/ar/dynamic.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json
autonomous: true
decisions: [D-01, D-03, D-05]
requirements: [D-01, D-03, D-05]

must_haves:
  truths:
    - "The 3 highest-risk ar/ files contain MSA Arabic copy, not English passthrough (D-01)"
    - "common.json key `openVAA` value stays the literal Latin brand `OpenVAA` (D-05)"
    - "Election Compass is rendered as the descriptive Arabic phrase البوصلة الانتخابية throughout dynamic.json (D-05 + glossary)"
    - "candidateApp.preregister.json preserves embedded `<a href=\"{registrationUrl}\">`, literal `\\n` newlines, emoji, and the `Bank ID` Latin brand (D-05)"
    - "dynamic.json preserves date skeletons, `{appName}` interpolation, and the registryStatement HTML/`<h3>` headings; this file is the sync source for Plan 07"
    - "Key parity stays green and the D-06 check passes for all 3 files"
  artifacts: []
  key_links:
    - from: "frontend/src/lib/i18n/translations/ar/dynamic.json"
      to: "frontend/src/lib/i18n/translations/en/dynamic.json"
      via: "same key names; preserved HTML, date skeletons, appName tokens; translated Election Compass"
      pattern: "Election Compass|appName|<h3>|::yyyyMM"
---

<objective>
Translate the three highest-risk frontend files to MSA against their `en/` source: `common.json` (71 keys — the default-payload file, contains the `OpenVAA` brand), `dynamic.json` (62 keys — HTML registry statement with `<h3>` headings, `{electionDate, date, ::yyyyMMdd}` skeletons, `{appName}` throughout, "Election Compass" descriptive phrase), and `candidateApp.preregister.json` (37 keys — embedded `<a href="{registrationUrl}">`, literal `\n` newlines in `email.text`, emoji 🖋️👍✉️, `Bank ID` Latin brand, `{firstName}/{lastName}/{registrationUrl}` tokens). Isolated into its own Wave 2 unit because these carry every integrity risk at once. `dynamic.json` here is the source that Plan 07 syncs to the backend.

Purpose: D-03 full coverage of the most delicate files, applying every D-05 brand rule, with the D-06 check as the safety net.
Output: 3 translated `ar/*.json` files.
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
  <name>Task 1: Translate common.json (default payload + OpenVAA brand)</name>
  <files>frontend/src/lib/i18n/translations/ar/common.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/common.json (71 keys; key `openVAA` value `"OpenVAA"`; candidate/organization/alliance/faction/answer/loading/saving/continue/back/close terms; `madeWithPrefix`/`madeWithSuffix`)
    - frontend/src/lib/i18n/translations/index.ts (DEFAULT_PAYLOAD_KEYS — common.candidate.*, common.organization.* feed runtime {candidateSingular}/{partyPlural} tokens app-wide)
    - .planning/phases/arabic-translations/GLOSSARY.md (all core domain terms + brand rule)
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§5 OpenVAA stays Latin; Open Question 2 madeWithSuffix)
  </read_first>
  <action>
    Translate `ar/common.json` to MSA against `en/common.json` key-by-key, keys unchanged. Use the glossary's locked renderings for every domain term so the default payload values (candidate/party singular+plural, alliance, faction, answer yes/no) match the renderings used everywhere else. Keep the `openVAA` key value exactly `"OpenVAA"` (literal brand, D-05 — do NOT translate). For the `madeWithPrefix`/`madeWithSuffix` pair: if Arabic word order requires, place the full "made with" phrase in `madeWithPrefix` and keep `madeWithSuffix` empty (RESEARCH Open Question 2). Preserve every ICU `{token}` verbatim. Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - `python3 -c "import json; print(json.load(open('frontend/src/lib/i18n/translations/ar/common.json'))['openVAA'])"` prints exactly `OpenVAA`.
    - `ar/common.json` differs from `en/common.json` (`python3` json-not-equal assertion).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` (OpenVAA brand preserved, tokens intact).
    - Valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>common.json contains MSA Arabic, `openVAA` stays Latin, default-payload terms match the glossary, parity + D-06 green.</done>
</task>

<task type="auto">
  <name>Task 2: Translate dynamic.json (HTML registry statement + date skeletons + appName + Election Compass)</name>
  <files>frontend/src/lib/i18n/translations/ar/dynamic.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/dynamic.json (62 keys; `candidateAppPrivacy.registryStatement.content` legal HTML with ~10 `<h3>` + many `<p>`; `{electionDate, date, ::yyyyMMdd}`; `{appName}` throughout; "Election Compass" literal text; `DATA_CONTROLLER`/`DATA_CONTACT_PERSON` operator placeholders)
    - .planning/phases/arabic-translations/GLOSSARY.md (Election Compass → البوصلة الانتخابية; privacy/results/opinion terms)
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§3 date skeletons; §5 Election Compass; Security Domain note on DATA_CONTROLLER placeholders; Pitfall 4 ignoreTag)
  </read_first>
  <action>
    Translate `ar/dynamic.json` to MSA against `en/dynamic.json` key-by-key, keys unchanged. In `candidateAppPrivacy.registryStatement.content`, preserve the full HTML tag set exactly — every `<h3>`, `<p>`, `<ul>`, `<li>`, `<a href>` and any attribute/href target — translating only the prose between tags. Preserve every date skeleton verbatim (`{electionDate, date, ::yyyyMMdd}` and any others). Preserve `{appName}` and all ICU tokens verbatim. Where "Election Compass" appears as literal text (not via `{appName}` interpolation), translate it to البوصلة الانتخابية per the glossary (D-05 descriptive phrase). Preserve the operator template placeholders `DATA_CONTROLLER` and `DATA_CONTACT_PERSON` verbatim (RESEARCH Security Domain — filled in at deployment). Keep valid JSON.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - `grep -F '::yyyyMMdd' frontend/src/lib/i18n/translations/ar/dynamic.json` matches (date skeleton preserved).
    - `grep -F 'DATA_CONTROLLER' frontend/src/lib/i18n/translations/ar/dynamic.json` matches AND `grep -F 'DATA_CONTACT_PERSON' frontend/src/lib/i18n/translations/ar/dynamic.json` matches (operator placeholders preserved).
    - `grep -c '<h3>' frontend/src/lib/i18n/translations/ar/dynamic.json` equals the en count (`grep -c '<h3>' frontend/src/lib/i18n/translations/en/dynamic.json`).
    - `ar/dynamic.json` differs from `en/dynamic.json`.
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0`.
    - Valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>dynamic.json contains MSA Arabic, HTML/date-skeleton/appName/operator-placeholder preserved, Election Compass translated, parity + D-06 green. Ready as the Plan 07 sync source.</done>
</task>

<task type="auto">
  <name>Task 3: Translate candidateApp.preregister.json (HTML email + \n + emoji + Bank ID)</name>
  <files>frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json</files>
  <read_first>
    - frontend/src/lib/i18n/translations/en/candidateApp.preregister.json (37 keys; `email.{subject,text,html}`; `<a href="{registrationUrl}">`; literal `\n` in `email.text`; emoji 🖋️👍✉️; `Bank ID` brand x4; `{firstName}/{lastName}/{registrationUrl}/{appName}` tokens)
    - .planning/phases/arabic-translations/GLOSSARY.md (Bank ID stays Latin; login/register/email terms)
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§1 highest-risk file; §4 \n check; §5 Bank ID; Pitfalls 1,4,6)
  </read_first>
  <action>
    Translate `ar/candidateApp.preregister.json` to MSA against the `en/` source key-by-key, keys unchanged. In the `email.html` value, preserve the exact HTML tag set including `<a href="{registrationUrl}">...</a>` with the `href` target verbatim — translate only the human-readable text. In the `email.text` value, preserve every literal `\n` newline (do not collapse the paragraph into a run-on — RESEARCH Pitfall 6). Keep all emoji (🖋️ 👍 ✉️) in place. Keep `Bank ID` verbatim in Latin everywhere it appears (D-05 — service brand). Preserve `{firstName}`, `{lastName}`, `{registrationUrl}`, `{appName}` tokens verbatim, repositioned within Arabic grammar but never dropped. Keep valid JSON (escaped `\n` preserved in the JSON string).
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit -- translations` passes.
    - `python3 -c "import json; d=json.load(open('frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json')); t=d['email']['text']; assert '\n' in t, 'newlines lost'"` succeeds (literal `\n` preserved).
    - `grep -c 'Bank ID' frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json` equals the en count (`grep -c 'Bank ID' frontend/src/lib/i18n/translations/en/candidateApp.preregister.json`).
    - `grep -F 'href="{registrationUrl}"' frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json` matches.
    - `ar/candidateApp.preregister.json` differs from its `en` sibling.
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0`.
    - Valid JSON (`python3 -m json.tool`).
  </acceptance_criteria>
  <done>preregister.json contains MSA Arabic, HTML/`href`/`\n`/emoji/Bank ID/tokens all preserved, parity + D-06 green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Translated email/legal HTML value → `{@html}` render + outbound email | preregister `email.html` and dynamic.json registryStatement render raw HTML and are emailed; a dropped/injected tag or broken `href` is a rendering/phishing/XSS risk. |
| Frontend dynamic.json → backend via `yarn sync:translations` (Plan 07) | corruption here propagates to Strapi. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-H1 | Tampering | `<a href="{registrationUrl}">` in preregister email HTML | mitigate | D-06 href check asserts the en href value appears verbatim in ar; acceptance greps it. A wrong href would redirect candidates — the check blocks it. |
| T-arabic-H2 | Tampering | Operator placeholders DATA_CONTROLLER/DATA_CONTACT_PERSON in dynamic.json | mitigate | Acceptance greps both survive verbatim; they are filled at deployment, must not be translated. |
| T-arabic-H3 | Spoofing | `Bank ID` brand altered in auth-related copy | mitigate | D-06 brand check + acceptance count-match; brand must stay literal Latin. |
| T-arabic-H4 | Tampering | `<h3>`/`<p>` legal HTML in dynamic.json registryStatement | mitigate | D-06 tag-set check + acceptance `<h3>` count-match against en. |
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit -- translations` green.
- `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` exits 0.
- All 3 `ar/` files differ from `en/`; OpenVAA + Bank ID + DATA_* placeholders + href + `\n` + date skeletons all preserved.
</verification>

<success_criteria>
The 3 highest-risk files render MSA Arabic with every brand/HTML/href/newline/emoji/skeleton integrity constraint satisfied, parity + D-06 green — completing D-03 frontend coverage and readying dynamic.json for backend sync.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/06-SUMMARY.md` when done.
</output>
