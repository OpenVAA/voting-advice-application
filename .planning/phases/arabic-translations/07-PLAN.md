---
phase: arabic-translations
plan: 07
type: execute
wave: 3
depends_on: ["02", "03", "04", "05", "06"]
files_modified:
  - backend/vaa-strapi/src/util/translations/ar/dynamic.json
autonomous: false
decisions: [D-03, D-06, D-07, D-08]
requirements: [D-03, D-06, D-07, D-08]

must_haves:
  truths:
    - "Backend ar/dynamic.json is the synced Arabic content from the frontend, not English passthrough (D-03)"
    - "`yarn sync:translations` propagated the frontend ar/dynamic.json to the backend (D-03 full coverage incl. backend)"
    - "Backend ar/dynamic.json loads via appCustomization.ts getDynamicTranslations() without parse error (D-07 DoD)"
    - "Full unit suite is green (key parity) and the D-06 check passes across all 46 files (D-06 DoD)"
    - "Phase ships Claude machine translation now; native Arabic linguistic sign-off is recorded as a deferred follow-up (D-07, D-08)"
  artifacts: []
  key_links:
    - from: "frontend/src/lib/i18n/translations/ar/dynamic.json"
      to: "backend/vaa-strapi/src/util/translations/ar/dynamic.json"
      via: "yarn sync:translations rsync"
      pattern: "dynamic.json"
    - from: "backend/vaa-strapi/src/util/appCustomization.ts"
      to: "backend/vaa-strapi/src/util/translations/ar/dynamic.json"
      via: "import ar from './translations/ar/dynamic.json'"
      pattern: "translations/ar/dynamic.json"
---

<objective>
Close the phase: propagate the translated frontend `dynamic.json` to the backend with `yarn sync:translations`, verify the backend file loads through the existing `appCustomization.ts` import path, run the full phase QA gate (key-parity unit suite green + D-06 check passing across all 46 files), spot-check RTL in-context rendering, and record the deferred native-review follow-up. This satisfies the D-07 definition of done and the D-08 deferral.

Purpose: D-03 requires backend coverage; D-07 fixes the definition of done (Arabic present, parity green, D-06 passes, backend loads, spot RTL correct); D-08 tracks native sign-off as a non-blocking follow-up.
Output: synced `backend/vaa-strapi/src/util/translations/ar/dynamic.json`; phase QA sign-off.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/phases/arabic-translations/arabic-translations-CONTEXT.md
@.planning/phases/arabic-translations/arabic-translations-RESEARCH.md
@.planning/phases/arabic-translations/arabic-translations-VALIDATION.md
</context>

<artifacts_this_phase_produces>
None new — `backend/vaa-strapi/src/util/translations/ar/dynamic.json` is regenerated (modified) by the rsync, not authored new.
</artifacts_this_phase_produces>

<tasks>

<task type="auto">
  <name>Task 1: Sync frontend dynamic.json to backend and verify it loads</name>
  <files>backend/vaa-strapi/src/util/translations/ar/dynamic.json</files>
  <read_first>
    - package.json (root — `sync:translations` rsync script)
    - backend/vaa-strapi/src/util/appCustomization.ts (line 2 import; getDynamicTranslations + flattenKeys, lines 12-58)
    - frontend/src/lib/i18n/translations/ar/dynamic.json (the translated source, produced by Plan 06)
    - .planning/phases/arabic-translations/arabic-translations-RESEARCH.md (§6 sync flow + Pitfall 3 — edit frontend first, never the backend file directly)
  </read_first>
  <action>
    Run `yarn sync:translations` from the repo root to rsync the translated `frontend/src/lib/i18n/translations/ar/dynamic.json` into `backend/vaa-strapi/src/util/translations/ar/dynamic.json` (the rsync copies only `dynamic.json` files). Do NOT hand-edit the backend file (RESEARCH Pitfall 3 — it is a downstream artifact). Then verify the backend file is valid JSON, is no longer English passthrough, and loads through the `appCustomization.ts` import path without a parse error by exercising `getDynamicTranslations()` (e.g. a `tsx`/`node` one-liner that imports the module/JSON and confirms it returns Arabic-keyed overrides). Confirm the backend file is byte-identical to the synced frontend file.
  </action>
  <acceptance_criteria>
    - After `yarn sync:translations`: `python3 -c "import json; a=json.load(open('backend/vaa-strapi/src/util/translations/ar/dynamic.json')); f=json.load(open('frontend/src/lib/i18n/translations/ar/dynamic.json')); assert a==f, 'backend not in sync with frontend'"` succeeds.
    - `python3 -c "import json; a=json.load(open('backend/vaa-strapi/src/util/translations/ar/dynamic.json')); e=json.load(open('backend/vaa-strapi/src/util/translations/en/dynamic.json')); assert a!=e, 'backend ar still == en'"` succeeds (no longer English passthrough).
    - Backend file is valid JSON (`python3 -m json.tool backend/vaa-strapi/src/util/translations/ar/dynamic.json`).
    - The backend `ar/dynamic.json` import path resolves and `getDynamicTranslations()` returns `dynamic.`-prefixed Arabic overrides without throwing (a `tsx`/`node` import smoke check from the backend workspace exits 0).
  </acceptance_criteria>
  <done>Backend ar/dynamic.json is the synced Arabic content, valid JSON, byte-identical to the frontend source, and loads via appCustomization.ts without error.</done>
</task>

<task type="auto">
  <name>Task 2: Run the full phase QA gate (parity + D-06 across all 46 files)</name>
  <files>none — verification-only task; runs the parity suite + checkArabicPlaceholders.ts and modifies no files (Task 1 already produced the backend file via sync)</files>
  <read_first>
    - .planning/phases/arabic-translations/arabic-translations-VALIDATION.md (Validation Sign-Off checklist)
    - frontend/src/lib/i18n/tests/translations.test.ts (the permanent key-parity guardrail)
    - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts (the D-06 check from Plan 01)
  </read_first>
  <action>
    Run the full frontend unit suite (`yarn workspace @openvaa/frontend test:unit`) to confirm key parity across all 46 files stays green. Run the D-06 check (`cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`) and confirm it exits 0 across the entire translated corpus — proving no placeholder, ICU construct, HTML tag, href, brand, or `\n` was dropped in any file. Confirm no `ar/` file remains byte-identical to its `en/` sibling across all 46 frontend files (full-coverage / D-03 / no-passthrough assertion). Record the result against the VALIDATION.md sign-off checklist. This task only runs verification commands — it writes no source files.
  </action>
  <acceptance_criteria>
    - `yarn workspace @openvaa/frontend test:unit` exits 0 (full unit suite + key parity green; no watch flag).
    - `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?` → `exit=0` with `Summary: 0 checks failed`.
    - A scripted pass over all 46 file pairs confirms every `ar/*.json` differs from its `en/*.json` sibling (no English passthrough remains) — a `python3` loop asserting `ar != en` for each filename exits 0.
  </acceptance_criteria>
  <done>Full unit suite green, D-06 check passes across all 46 files, no English passthrough remains — D-06 DoD and D-03 coverage proven.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Spot RTL in-context rendering review + record deferred native-review follow-up (D-07, D-08)</name>
  <what-built>
    All 46 frontend `ar/` files plus the backend `ar/dynamic.json` now contain Claude-produced MSA Arabic. Key parity is green, the D-06 placeholder/ICU/HTML/href/brand/newline check passes across the corpus, and the backend dynamic content loads via appCustomization.ts. Per D-07, this ships machine translation now; native-speaker MSA linguistic sign-off is deferred (D-08).
  </what-built>
  <how-to-verify>
    1. With the dev stack running, load the app at the `/ar` locale (e.g. `http://localhost:5173/ar`).
    2. Eyeball key voter screens (results, question list, entity card/details) and a candidate screen (login/register/home): Arabic copy is visible (not English), reads under RTL, and Latin tokens (URLs, OpenVAA, Bank ID, example codes) are not reordered/corrupted around the surrounding Arabic.
    3. Confirm an ICU-plural string renders correctly for a few counts (0, 1, 2, 5, 11) — the Arabic dual (`two`) and `few`/`many` arms resolve (RESEARCH Assumption A1).
    4. Confirm the deferred native-speaker MSA linguistic correctness review is captured as a tracked follow-up (D-08), explicitly NOT a blocker for this phase's merge (D-07).
  </how-to-verify>
  <resume-signal>Type "approved" if Arabic renders correctly under RTL and the deferred-review follow-up is recorded, or describe issues.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Frontend dynamic.json → backend (rsync) → Strapi → frontend at runtime | The sync propagates translated content to Strapi; corruption or a parse failure here breaks dynamic overrides app-wide. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-arabic-Q1 | Tampering | Backend ar/dynamic.json drift from frontend source | mitigate | Sync via `yarn sync:translations` only (never hand-edit backend); acceptance asserts byte-identity with the frontend source. |
| T-arabic-Q2 | Denial of service | Malformed JSON / broken ICU in backend dynamic.json crashing getDynamicTranslations | mitigate | Import smoke check + full unit suite + D-06 run as the blocking phase gate before merge. |
| T-arabic-SC | Tampering | npm/pip/cargo installs | accept | No installs — `rsync` and `tsx` already present (RESEARCH Environment Availability). No legitimacy gate required. |
</threat_model>

<verification>
- `yarn sync:translations` run; backend `ar/dynamic.json` byte-identical to frontend, no longer `== en`, loads via appCustomization.ts.
- `yarn workspace @openvaa/frontend test:unit` green; D-06 check exits 0 across all 46 files.
- No `ar/` file remains English passthrough.
- Human spot-check of `/ar` RTL rendering approved; native-review follow-up (D-08) recorded as non-blocking.
</verification>

<success_criteria>
Backend Arabic dynamic content synced and loading; full QA gate (parity + D-06 + no-passthrough) green; RTL spot-check approved; phase ships Claude MSA machine translation with native sign-off deferred — satisfying D-03, D-06, D-07, D-08.
</success_criteria>

<output>
Create `.planning/phases/arabic-translations/07-SUMMARY.md` when done.
</output>
