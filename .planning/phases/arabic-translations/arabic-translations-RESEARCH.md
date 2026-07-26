# Phase arabic-translations: Arabic Translation Content — Research

**Researched:** 2026-06-14
**Domain:** i18n content / ICU MessageFormat / JSON translation files
**Confidence:** HIGH (all claims anchored to real repo files)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** Claude (this assistant) produces the Arabic translations directly — no external/human translator in this phase. Register is **Modern Standard Arabic (MSA / فُصْحَى)**, formal and region-neutral.
- **D-02** **Glossary-first.** The first plan unit builds a locked glossary mapping recurring VAA domain terms to one fixed Arabic rendering each. All 46 files are then translated against that glossary.
- **D-03** **Full coverage** — all 46 frontend files **plus** backend `dynamic.json`. No tiering, no staging by app.
- **D-04** `adminApp.*` strings (9 files, 121 keys) **are translated** in this phase, even though admin-app RTL layout remains deferred.
- **D-05** Brand/proper-noun rule per string:
  - True proper nouns (`OpenVAA`, real product/org/service names) → keep Latin, bidi-isolated.
  - Descriptive phrases ("Election Compass") → translate to Arabic.
  - `{appName}` and similar interpolated names → no action (runtime values).
- **D-06** Build a **one-time pre-merge check script** (run-once, NOT in vitest CI). Checks per key: placeholder token set, ICU structure, HTML tag set, URLs/href targets, Latin-kept brand names.
- **D-07** Native-speaker linguistic correctness review is **POSTPONED**. Definition of done: Arabic copy present; key-parity test green; D-06 check passes; backend `dynamic.json` loads via `appCustomization.ts`; spot RTL rendering correct.
- **D-08** Native Arabic linguistic sign-off is a deferred follow-up, not a blocker.

### Claude's Discretion

- Exact glossary term selection and MSA phrasing.
- Arabic ICU plural categories — Arabic uses `zero/one/two/few/many/other`; expand plural forms inside values (the key-parity test checks key names only, so this won't break parity).
- Whether the D-06 check script is committed as a dev utility or kept as a throwaway (default: commit under `frontend/tools/` but do NOT wire into CI).

### Deferred Ideas (OUT OF SCOPE)

- Native-speaker Arabic linguistic correctness review (D-07/D-08 — tracked follow-up).
- Locale-aware `Intl` digit/number formatting (Arabic-Indic numerals) — RTL DECISIONS A8 refinement.
- Admin app RTL layout — still deferred; only admin strings are translated here.
- Promoting the D-06 placeholder check into the permanent CI/vitest suite.
- LLM Arabic prompt support (`packages/llm`) and Faker `ar` mock data.
  </user_constraints>

---

## Summary

The RTL/bidi infrastructure shipped in phase `rtl-bidi-support` (complete as of 2026-06-14, branch `feat-rtl-locales`). All 46 `ar/` frontend JSON files exist with correct structure and key parity but are still seeded verbatim from `en` — confirmed by Python `ar == en` checks on all spot-checked files (`common.json`, `results.json`, `about.json`). The backend `backend/vaa-strapi/src/util/translations/ar/dynamic.json` is likewise identical to its `en` sibling (confirmed). This phase replaces all 575 English-seeded leaf values with real MSA Arabic.

The key-parity test (`translations.test.ts`) is a permanent guardrail that compares **flattened key names only**; it will stay green as long as the `ar/` directory has the same files with the same nested object structure as `en/`. Expanding ICU plural forms inside Arabic values (e.g., adding `zero/one/two/few/many/other` arms) does not change the flattened key name set and therefore does not break this test.

The highest-risk file is `candidateApp.preregister.json` (37 keys combining embedded `<a href="{registrationUrl}">` HTML, literal `\n` newlines in the email `text` value, emoji 🖋️ 👍 ✉️, `Bank ID` as a retained Latin brand name, and `{firstName}/{lastName}/{registrationUrl}` ICU tokens). The D-06 check script is the safety net for all token/HTML/brand integrity; it must be built before the translation batch is merged.

**Primary recommendation:** Translate in this order: (1) build and lock glossary, (2) translate in batches grouped by complexity tier (simple → ICU-plural → HTML-heavy → email templates), (3) run D-06 check, (4) run `yarn sync:translations`, (5) verify `yarn test:unit` green, (6) spot RTL rendering check.

---

## Architectural Responsibility Map

| Capability                      | Primary Tier                                    | Secondary Tier | Rationale                                                                                               |
| ------------------------------- | ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| Frontend i18n translation files | Frontend (JSON in `src/lib/i18n/translations/`) | —              | SvelteKit i18n loads these files at runtime via dynamic import                                          |
| Backend dynamic overrides       | Backend (Strapi)                                | —              | `appCustomization.ts` imports `ar/dynamic.json` directly; Strapi distributes to frontend at runtime     |
| `sync:translations` rsync       | Build tooling (root `package.json` script)      | —              | One-way rsync copies `dynamic.json` from frontend to backend; edit frontend first, sync second          |
| Key-parity test                 | Frontend test suite (vitest)                    | —              | `translations.test.ts` is a permanent guardrail; runs with `yarn workspace @openvaa/frontend test:unit` |
| D-06 one-time check             | Frontend dev tooling                            | —              | Lives in `frontend/tools/`; invoked with `tsx`, not wired into vitest or CI                             |
| RTL bidi isolation (A5/A8)      | Render-site (Svelte components)                 | —              | Already shipped in P5; translator does not need to add Unicode isolates to JSON values                  |

---

## 1. File Inventory (Ground Truth)

**Verified location:** `frontend/src/lib/i18n/translations/en/` (46 files) [VERIFIED: filesystem scan]

Both `en/` and `ar/` contain exactly the same 46 `.json` files in the same order (verified by `ls` output comparison). [VERIFIED: filesystem scan]

All `ar/` files are currently byte-for-byte identical to their `en/` counterparts (seeded from English by the RTL phase). [VERIFIED: Python ar==en comparison on spot-checked files; `dynamic.json` also confirmed]

### Complete file inventory with key counts and risk flags

| File                                 | Keys    | ICU Plural | ICU Select | HTML | Brand/LTR-keep | `\n` |
| ------------------------------------ | ------- | ---------- | ---------- | ---- | -------------- | ---- |
| `about.json`                         | 9       | —          | Y          | Y    | —              | —    |
| `adminApp.argumentCondensation.json` | 20      | —          | —          | —    | —              | —    |
| `adminApp.common.json`               | 4       | —          | —          | —    | —              | —    |
| `adminApp.error.json`                | 3       | —          | —          | —    | —              | —    |
| `adminApp.factorAnalysis.json`       | 14      | —          | —          | —    | —              | —    |
| `adminApp.jobs.json`                 | 37      | —          | —          | —    | —              | —    |
| `adminApp.languageFeatures.json`     | 2       | —          | —          | —    | —              | —    |
| `adminApp.login.json`                | 13      | —          | —          | —    | —              | —    |
| `adminApp.notSupported.json`         | 3       | —          | —          | —    | —              | —    |
| `adminApp.questionInfo.json`         | 25      | —          | —          | —    | —              | —    |
| `candidateApp.basicInfo.json`        | 8       | —          | —          | —    | —              | —    |
| `candidateApp.common.json`           | 9       | —          | —          | —    | —              | —    |
| `candidateApp.error.json`            | 5       | —          | —          | —    | —              | —    |
| `candidateApp.help.json`             | 4       | —          | —          | —    | —              | —    |
| `candidateApp.home.json`             | 11      | —          | —          | —    | —              | —    |
| `candidateApp.info.json`             | 1       | —          | —          | —    | —              | —    |
| `candidateApp.login.json`            | 5       | —          | —          | —    | —              | —    |
| `candidateApp.logoutModal.json`      | 5       | Y          | —          | —    | —              | —    |
| `candidateApp.notSupported.json`     | 3       | —          | —          | —    | —              | —    |
| `candidateApp.preregister.json`      | 37      | —          | —          | Y    | Y (`Bank ID`)  | Y    |
| `candidateApp.preview.json`          | 4       | —          | —          | —    | —              | —    |
| `candidateApp.privacy.json`          | 2       | —          | —          | —    | —              | —    |
| `candidateApp.questions.json`        | 18      | Y          | —          | —    | —              | —    |
| `candidateApp.register.json`         | 18      | —          | —          | —    | —              | —    |
| `candidateApp.resetPassword.json`    | 7       | —          | —          | —    | —              | —    |
| `candidateApp.setPassword.json`      | 6       | —          | —          | —    | —              | —    |
| `candidateApp.settings.json`         | 17      | —          | —          | —    | —              | —    |
| `common.json`                        | 71      | —          | —          | —    | Y (`OpenVAA`)  | —    |
| `components.json`                    | 50      | Y          | —          | —    | —              | —    |
| `constituencies.json`                | 3       | —          | —          | —    | —              | —    |
| `dynamic.json`                       | 62      | —          | —          | Y    | —              | —    |
| `elections.json`                     | 1       | —          | —          | —    | —              | —    |
| `entityCard.json`                    | 2       | —          | —          | —    | —              | —    |
| `entityDetails.json`                 | 5       | —          | —          | —    | —              | —    |
| `entityFilters.json`                 | 12      | —          | —          | —    | —              | —    |
| `entityList.json`                    | 5       | Y          | —          | —    | —              | —    |
| `error.json`                         | 11      | —          | —          | Y    | —              | —    |
| `feedback.json`                      | 13      | Y          | —          | —    | —              | —    |
| `help.json`                          | 1       | —          | —          | —    | —              | —    |
| `info.json`                          | 1       | —          | —          | —    | —              | —    |
| `maintenance.json`                   | 1       | —          | —          | —    | —              | —    |
| `privacy.json`                       | 12      | —          | —          | —    | —              | —    |
| `questions.json`                     | 17      | Y          | Y          | —    | —              | —    |
| `results.json`                       | 15      | Y          | —          | —    | —              | —    |
| `statistics.json`                    | 2       | —          | —          | —    | —              | —    |
| `yourList.json`                      | 1       | —          | —          | —    | —              | —    |
| **TOTAL**                            | **575** |            |            |      |                |      |

[VERIFIED: Python leaf-count script across all 46 files]

**Corrected total key count: 575.** The CONTEXT.md and PHASE.md estimate of "~697 keys" is wrong. The true leaf count is 575. [VERIFIED: Python script output]

### The 9 adminApp.\* files (D-04: translate strings, not layout)

Files: `adminApp.argumentCondensation.json` (20), `adminApp.common.json` (4), `adminApp.error.json` (3), `adminApp.factorAnalysis.json` (14), `adminApp.jobs.json` (37), `adminApp.languageFeatures.json` (2), `adminApp.login.json` (13), `adminApp.notSupported.json` (3), `adminApp.questionInfo.json` (25). Total: 121 admin keys. None of these files have ICU plurals, HTML, or embedded brand names — they are the lowest-complexity group. [VERIFIED: filesystem scan + Python flag analysis]

### High-risk files (ordered by complexity)

1. **`candidateApp.preregister.json`** (37 keys) — highest risk: embedded `<a href="{registrationUrl}">` HTML, email `text` value with literal `\n` line breaks, emoji `🖋️` `👍` `✉️`, `Bank ID` as retained Latin brand (4 occurrences), `{firstName}` `{lastName}` `{registrationUrl}` ICU tokens, and `{appName}` runtime interpolation. [VERIFIED: Python scan + file read]
2. **`about.json`** (9 keys) — `organizationMatching.content` is a compound `{partyMatchingMethod, select, ...}` with nested `<p>` HTML inside each branch. [VERIFIED: file read]
3. **`dynamic.json`** (62 keys) — contains `{electionDate, date, ::yyyyMMdd}` date skeleton, extensive HTML in `candidateAppPrivacy.registryStatement.content` (legal text with 10 `<h3>` headings and many `<p>` tags), and `{appName}` interpolation throughout. [VERIFIED: file read]
4. **`questions.json`** (17 keys) — compound plural with nested plural: `{minQuestions, plural, =0 {} =1 {} other {...}}` inside a larger string; also `{partyMatchingMethod, select, ...}` pattern. [VERIFIED: file read]
5. **`results.json`** (15 keys) — 5 ICU plural forms using both `{candidatePlural}` and `{partySingular}` interpolated tokens within plural arms. [VERIFIED: file read]

---

## 2. Parity Test Mechanics

**File:** `frontend/src/lib/i18n/tests/translations.test.ts` [VERIFIED: file read]

### What `flattenKeys()` does (lines 13–23)

```typescript
function flattenKeys(obj: any, prefix: string): Array<string> {
  const res = Array<string>();
  for (const key in obj) {
    if (typeof obj[key] !== 'object') {
      res.push(`${prefix}.${key}`); // leaf: add dotted key name only
    } else {
      res.push(...flattenKeys(obj[key], `${prefix}.${key}`)); // recurse
    }
  }
  return res.sort();
}
```

Recursion stops when `typeof obj[key] !== 'object'` — any non-object value (string, number, boolean) is a leaf. Returns the **sorted array of dotted key names**, not values. [VERIFIED: translations.test.ts lines 13-23]

### What the tests compare

- Test 1: `keys` array in `index.ts` must match filenames in `en/` (line 56-58).
- Test 2: `locales` object in `index.ts` must match directory names in `translations/` (line 60-62).
- Test 3: every non-`en` locale must have the same filenames as `en` (lines 64-67).
- Test 4: `getFlattenedTranslationKeys(locale, filename)` must equal `firstLocaleFileKeys[filename]` — **the sorted array of dotted key names must be identical** (lines 69-73).

### What the test does NOT check

The parity test compares key names only. It does not validate:

- The content of any value (could be English passthrough — this is the current state)
- ICU placeholder names inside values
- HTML tag structure inside values
- URL/brand integrity inside values

This gap is precisely what D-06 covers.

### Does Arabic plural expansion break the parity test?

**No.** The `flattenKeys` function stops at any non-object value, including strings. A string value like `{numShown, plural, zero {لا تحالفات} one {تحالف واحد} two {تحالفان} few {# تحالفات} many {# تحالفاً} other {# تحالف}}` is a single string leaf. Expanding from 3 English plural arms to 6 Arabic arms stays inside the string value — the key name (e.g., `results.alliance.numShown`) does not change. The test remains green. [VERIFIED: logic analysis of `flattenKeys` code]

---

## 3. Arabic ICU Plural Rules

### CLDR plural categories for Arabic [ASSUMED — CLDR Arabic plural rules are well-documented standard]

Arabic uses all 6 CLDR plural categories. The correct mapping:

| Category | Applies when `n` is                     | Example (numShown) |
| -------- | --------------------------------------- | ------------------ |
| `zero`   | = 0                                     | لا نتائج           |
| `one`    | = 1                                     | نتيجة واحدة        |
| `two`    | = 2                                     | نتيجتان            |
| `few`    | 3–10 (also 103–110, 1003–1010, …)       | # نتائج            |
| `many`   | 11–99 (also 111–199, 1011–1099, …)      | # نتيجةً           |
| `other`  | 100, 200, 300, … (exact round hundreds) | # نتيجة            |

For practical VAA context (candidate/question counts typically < 1000), `few` covers 3–10 and `many` covers 11–99.

### How `intl-messageformat` with `parser({ ignoreTag: true })` handles plurals

The parser is initialized at `frontend/src/lib/i18n/init.ts` **line 62** [VERIFIED: file read]:

```typescript
parser: parser({ ignoreTag: true }),
```

`ignoreTag: true` means HTML tags inside ICU message strings are passed through as literal text — they are NOT parsed as HTML by the ICU parser. The HTML reaches the DOM via Svelte's `{@html ...}` directive at the render site. The translator must preserve exact tag structure including attribute quotes; no special ICU escaping of angle brackets is needed.

For plural forms, `intl-messageformat` (v10.7.11, confirmed in `frontend/package.json` [VERIFIED]) resolves the correct branch for the locale's plural rules via the `Intl.PluralRules` API. When the locale is `ar`, the engine will correctly resolve `zero/one/two/few/many/other` branches. The translator should include all 6 arms for Arabic ICU plurals; if the `en` value only uses `=0`, `=1`, `other`, Arabic can add the full set without breaking the key-parity test (see §2).

### ICU date skeletons

Date skeletons like `{electionDate, date, ::yyyyMMdd}` and `{consentDate, date, ::yyyyMMd}` are formatting directives, not translatable text. They must be preserved verbatim. The `intl-messageformat` library formats the date according to the locale at runtime; the skeleton string itself must be identical. [VERIFIED: dynamic.json and privacy.json]

---

## 4. Placeholder-Safety Check Script (D-06)

### Specification (implementation-ready)

**Location:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`
**Runtime:** `tsx` (already in `devDependencies`: `"tsx": "^4.19.2"`) [VERIFIED: frontend/package.json]
**Invocation:**

```bash
cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
```

**Commit status:** Commit to the repo under `frontend/tools/` (consistent with `editTranslations/` and `translationKey/` tools already present [VERIFIED: ls frontend/tools/]). Do NOT add to vitest. Do NOT wire into CI. (D-06 decision.)

### Pattern: reuse `flattenKeys` from `editTranslations.ts`

The existing `frontend/tools/editTranslations/editTranslations.ts` contains a `flattenKeys` function at lines 280–289 that returns `[string, string][]` (key-value pairs including values). [VERIFIED: editTranslations.ts lines 280-289] The D-06 script should use the same approach: flatten both `en` and `ar` to `{ [key: string]: string }` maps, then diff per key.

### Per-key checks the script must perform

For each flattened leaf key where both `en[key]` and `ar[key]` are strings:

**1. ICU placeholder token set** — extract all `{identifier}` names (excluding ICU keywords):

```
/\{([a-zA-Z_][a-zA-Z0-9_]*)[,}]/g
```

Exclude these ICU keywords from the name set: `plural`, `select`, `selectordinal`, `number`, `date`, `time`. For each token name found in the `en` value, assert it also appears in the `ar` value.

**2. ICU construct presence** — for each ICU keyword (`plural`, `select`, `date`, `selectordinal`) that appears in the `en` value, assert it also appears in the `ar` value. Catches cases where a translator drops the entire plural block and writes a flat Arabic string.

**3. HTML tag set** — extract all tag names from both values:

```
/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g
```

Assert that the set of tag names present in `en` is a subset of those in `ar` (order may differ; Arabic content may reorganize sentences but must not drop tags).

**4. `href` attribute values** — extract `href="..."` from HTML in both values. Assert the URL or ICU token inside `href` is preserved verbatim (e.g., `href="{registrationUrl}"` must appear in `ar` too).

**5. Latin-kept brand names** — hardcoded list: `["Bank ID", "OpenVAA"]`. For each brand name appearing in the `en` value, assert it appears literally in the `ar` value.

**6. Literal `\n` preservation** — for any `en` value containing the string `\n` (literal backslash-n, i.e., JSON escape), assert the `ar` value also contains `\n`. This catches the email `text` key in `candidateApp.preregister.json`. [VERIFIED: preregister.json `email.text` has literal `\n`]

### Critical: Arabic plural-arm expansion correctness

When `en` has `=0 {…} =1 {…} other {…}` and `ar` has `zero {…} one {…} two {…} few {…} many {…} other {…}`, extract the UNION of all placeholder tokens across ALL arms in both values. Assert every token in the `en` union exists somewhere in the `ar` value. Do NOT compare arm counts or arm keywords — that would incorrectly flag legitimate plural expansion.

### Output format

```
FAIL [filename.key]: {reason} — en: "{en_snippet}" | ar: "{ar_snippet}"
...
Summary: N checks failed, M passed.
```

Exit code 1 if any check fails, 0 if all pass.

---

## 5. Brand / Proper-Noun Handling (D-05 + RTL A8)

### What the RTL phase already shipped for embedded LTR token isolation (A5/A8)

RTL phase P5 (`cb58950d8`) applied `dir="auto"` at render sites for author/user content (entity names, free-text answers, info answers). [VERIFIED: SUMMARY.md]

The Svelte components already handle runtime bidirectional content via `dir="auto"`. The translator does NOT need to embed Unicode bidi isolate characters (U+2068/U+2069) in JSON string values. The `dir="auto"` on the container element causes the browser's Unicode Bidi Algorithm to correctly handle embedded LTR sequences (URLs, code, brand names) within RTL text.

### Translation rule per string type (D-05)

| Content type                      | Rule                                                          | Example                                   |
| --------------------------------- | ------------------------------------------------------------- | ----------------------------------------- |
| True registered proper nouns      | Keep Latin exactly as in `en`                                 | `OpenVAA` → `OpenVAA`                     |
| `Bank ID` (service name)          | Keep Latin exactly as in `en`                                 | `Bank ID` → `Bank ID`                     |
| Descriptive phrases used as names | Translate to Arabic                                           | "Election Compass" → "البوصلة الانتخابية" |
| `{appName}`, `{firstName}`, etc.  | No action — ICU token, pass through                           | `{appName}` → `{appName}`                 |
| `{adminEmailLink}`                | No action — constructed at runtime by `init.ts` lines 196-201 | `{adminEmailLink}` → `{adminEmailLink}`   |
| URLs in `href` attributes         | Preserve verbatim                                             | `href="{registrationUrl}"` → same         |
| Emoji                             | Keep in place                                                 | `🖋️` → `🖋️`                               |

### Where `OpenVAA` appears

`common.json` key `openVAA` has value `"OpenVAA"` — this key's value must remain `"OpenVAA"` (it is the literal brand name, not a descriptive phrase). [VERIFIED: common.json line 57]

### "Election Compass" treatment

The string "Election Compass" appears extensively in `dynamic.json` (e.g., `appName` value, `candidateAppName`, maintenance content, survey text, voterAppNotAccessible content). Per D-05, this is a **descriptive phrase** and should be translated. Suggested Arabic rendering: **البوصلة الانتخابية** (lit. "the electoral compass"). This must be in the glossary (D-02). Strings that embed "Election Compass" as literal text (not via `{appName}` interpolation) should be translated consistently throughout.

---

## 6. Backend `dynamic.json` + Sync Flow

### Edit target

**Frontend first, then sync.** The correct edit target is:

```
frontend/src/lib/i18n/translations/ar/dynamic.json
```

The backend file at `backend/vaa-strapi/src/util/translations/ar/dynamic.json` is a **downstream rsync artifact** — confirmed by the `sync:translations` script content and the fact that both files are currently identical. [VERIFIED: package.json script + Python comparison]

### Sync command (from root `package.json`) [VERIFIED: package.json]

```bash
rsync -av --include='*/' --include='dynamic.json' --exclude='*' \
  frontend/src/lib/i18n/translations/ \
  backend/vaa-strapi/src/util/translations/
```

Invocation: `yarn sync:translations` (from repo root).

This rsync copies ONLY `dynamic.json` files (not all translation files) from the frontend translations tree to the backend. After editing `frontend/src/lib/i18n/translations/ar/dynamic.json`, run `yarn sync:translations` to propagate, then commit both files.

### Backend load path (success criterion)

`backend/vaa-strapi/src/util/appCustomization.ts` **line 2** imports directly [VERIFIED: file read]:

```typescript
import ar from './translations/ar/dynamic.json';
```

The `getDynamicTranslations()` function (lines 12-43) flattens all locale files and returns `TranslationOverride[]`. Keys from `dynamic.json` are prefixed with `dynamic.` (e.g., `appName` → `dynamic.appName`). The backend's own `flattenKeys` (lines 45-58) stops recursion at string values, identical semantics to the frontend parity test. [VERIFIED: appCustomization.ts]

### Key count

62 leaf keys in both `en` and `ar` `dynamic.json` files (frontend and backend copies). [VERIFIED: Python count]

---

## 7. Glossary Seed (D-02)

The following terms appear across multiple files in the `en/` corpus and require one locked MSA rendering each. All proposed; exact phrasing is Claude's discretion per CONTEXT.md.

### Core VAA domain terms (from `common.json` and `dynamic.json`)

| English term         | Arabic (MSA)        | Notes                                      |
| -------------------- | ------------------- | ------------------------------------------ |
| candidate (singular) | مرشح                | `common.candidate.singular`                |
| candidates (plural)  | المرشحون / المرشحين | context-dependent; use المرشحون as default |
| party (singular)     | حزب                 | `common.organization.singular`             |
| parties (plural)     | أحزاب               | `common.organization.plural`               |
| constituency         | دائرة انتخابية      | `common.constituency`                      |
| election             | انتخابات            | `common.election`                          |
| opinion / opinions   | رأي / آراء          | `dynamic.json` intro, results              |
| alliance (singular)  | تحالف               | `common.alliance.singular`                 |
| alliances (plural)   | تحالفات             | `common.alliance.plural`                   |
| faction (singular)   | كتلة                | `common.faction.singular`                  |
| factions (plural)    | كتل                 | `common.faction.plural`                    |
| question             | سؤال                | `common.question`                          |
| results              | نتائج               | `results.title.results`                    |
| answer (yes)         | نعم                 | `common.answer.yes`                        |
| answer (no)          | لا                  | `common.answer.no`                         |
| Election Compass     | البوصلة الانتخابية  | descriptive phrase → translate (D-05)      |
| Bank ID              | Bank ID             | proper noun → keep Latin (D-05)            |
| OpenVAA              | OpenVAA             | registered brand → keep Latin (D-05)       |
| match score / match  | درجة التطابق        | `components.matchScore.label`              |

### Additional recurring terms

| English term            | Arabic (MSA)      | Notes                                    |
| ----------------------- | ----------------- | ---------------------------------------- |
| filters                 | الفلاتر           | more recognizable in digital UI context  |
| login / sign in         | تسجيل الدخول      | consistent across all `login` keys       |
| register / registration | التسجيل           | candidateApp.register                    |
| password                | كلمة المرور       | consistent                               |
| email                   | البريد الإلكتروني | universal                                |
| feedback                | ملاحظات           | feedback.title                           |
| privacy                 | الخصوصية          | privacy.title                            |
| statistics              | إحصاءات           | statistics                               |
| loading                 | جارٍ التحميل…     | common.loading                           |
| saving                  | جارٍ الحفظ…       | common.saving                            |
| continue                | متابعة            | common.continue / dynamic.intro.continue |
| back                    | رجوع              | common.back                              |
| close                   | إغلاق             | common.close                             |

### ICU token names in the default payload (`index.ts` lines 71-75) [VERIFIED: translations/index.ts]

These token names are hardcoded and appear as `{candidateSingular}`, `{candidatePlural}`, `{partySingular}`, `{partyPlural}` in many strings. They are runtime-injected values — the translated JSON values for `common.candidate.singular`, `common.candidate.plural`, `common.organization.singular`, `common.organization.plural` will populate them. The token names themselves must be preserved verbatim in every string that uses them.

---

## 8. Architecture Patterns

### Recommended translation batching order

Group files by complexity tier to enable step-by-step validation:

**Tier 1 — Simple strings (no ICU, no HTML):** ~33 files
Includes all 9 `adminApp.*` files plus: `constituencies.json`, `elections.json`, `entityCard.json`, `entityDetails.json`, `entityFilters.json`, `help.json`, `info.json`, `maintenance.json`, `statistics.json`, `yourList.json`, `candidateApp.basicInfo.json`, `candidateApp.common.json`, `candidateApp.error.json`, `candidateApp.help.json`, `candidateApp.home.json`, `candidateApp.info.json`, `candidateApp.login.json`, `candidateApp.notSupported.json`, `candidateApp.preview.json`, `candidateApp.privacy.json`, `candidateApp.register.json`, `candidateApp.resetPassword.json`, `candidateApp.setPassword.json`, `candidateApp.settings.json`, `error.json` (mostly simple; 1 HTML key).

**Tier 2 — ICU plurals only (no HTML):** 7 files
`candidateApp.logoutModal.json`, `candidateApp.questions.json`, `components.json`, `entityList.json`, `feedback.json`, `questions.json`, `results.json`

**Tier 3 — HTML-embedded strings:** 2 files
`about.json` (select+HTML), `privacy.json` (date skeletons — no HTML, but included here for care)

**Tier 4 — Complex (HTML + brand/emoji + newlines):** 3 files
`common.json` (widespread usage as default payload + `OpenVAA` brand), `dynamic.json` (HTML + date skeletons + appName throughout + 62 keys), `candidateApp.preregister.json` (HTML + Bank ID + emoji + `\n`)

### Recommended project structure for D-06 tool

```
frontend/tools/
├── editTranslations/          (existing)
│   └── editTranslations.ts
├── translationKey/            (existing)
│   └── generateTranslationKeyType.ts
└── checkArabicPlaceholders/   (new — D-06)
    └── checkArabicPlaceholders.ts
```

---

## 9. Don't Hand-Roll

| Problem                                    | Don't Build              | Use Instead                                                                                                                | Why                                                 |
| ------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Flattening nested JSON translation files   | Custom flatten           | Copy the pattern from `translations.test.ts` `flattenKeys()` or `editTranslations.ts` `flattenKeys()` — both already exist | Avoid writing the same logic a third time           |
| Running the D-06 check                     | Adding to vitest or CI   | `tsx` invocation as a standalone tool                                                                                      | D-06 is explicitly one-time per CONTEXT.md decision |
| Syncing frontend to backend `dynamic.json` | Manual file copy         | `yarn sync:translations` (rsync already configured)                                                                        | Manual copy risks drift; rsync is already wired     |
| Plural rule lookup                         | Custom plural rule logic | `intl-messageformat` + `Intl.PluralRules` at render time                                                                   | The engine already knows Arabic plural rules        |

---

## Common Pitfalls

### Pitfall 1: Dropping ICU tokens during translation

**What goes wrong:** Natural Arabic prose omits `{count}` or `{candidatePlural}` because the token placement feels grammatically awkward.
**Why it happens:** Arabic grammar sometimes requires verb-subject reordering; tokens need repositioning.
**How to avoid:** Use the D-06 check script. Tokens can be repositioned within the Arabic sentence but must not be dropped.
**Warning signs:** D-06 reports `missing token {candidatePlural}` for any key.

### Pitfall 2: Breaking ICU plural syntax

**What goes wrong:** Arabic plural arms use incorrect ICU syntax (e.g., `zero{…}` without a space, missing `}`, or writing `=0 {}` instead of `zero {}`).
**Why it happens:** ICU plural syntax for Arabic uses keyword forms (`zero`, `one`, `two`, `few`, `many`, `other`), not the `=N` exact-match forms used for English.
**How to avoid:** Use exact CLDR keyword forms. The parity test will NOT catch broken ICU syntax (it only checks key names), but the app will throw a runtime parse error caught by the `try/catch` in `init.ts` lines 93-96. The D-06 check for ICU construct presence will catch dropped plural blocks. Manual render verification is the final gate.
**Warning signs:** App logs a debug error and returns the key string instead of the translated value.

### Pitfall 3: Editing the backend `ar/dynamic.json` directly

**What goes wrong:** Translator edits `backend/vaa-strapi/src/util/translations/ar/dynamic.json` directly, then `yarn sync:translations` overwrites it with the frontend version.
**Why it happens:** The backend file looks like the natural edit target (it's what Strapi reads).
**How to avoid:** Always edit `frontend/src/lib/i18n/translations/ar/dynamic.json` first, then run `yarn sync:translations`.
**Warning signs:** After running `yarn sync:translations`, backend `ar/dynamic.json` reverts to English.

### Pitfall 4: Misunderstanding `ignoreTag: true`

**What goes wrong:** Developer assumes `ignoreTag: true` means HTML is safe to drop or rearrange. In fact, `ignoreTag: true` means the ICU _parser_ ignores `<tag>` tokens so they pass through as literal text — it does NOT mean HTML in the values is rendered by the ICU engine.
**How to avoid:** Always preserve HTML tags exactly. The ICU parser won't error on them, but the rendered UI will break if tags are dropped.

### Pitfall 5: Wrong Arabic plural arm for 2 (dual)

**What goes wrong:** Translator uses `other` for 2, missing the Arabic grammatical dual form.
**Why it happens:** Arabic has a grammatical dual that English lacks; CLDR's `two` category maps to this.
**How to avoid:** Always include a `two` arm with the dual form (suffix `-ان` nominative / `-ين` accusative-genitive).

### Pitfall 6: Forgetting `\n` newlines in email templates

**What goes wrong:** Arabic translation of `candidateApp.preregister.email.text` omits the literal `\n` characters, causing plain-text email to render as a run-on paragraph.
**Why it happens:** `\n` may be invisible in some editors when viewing raw JSON.
**How to avoid:** The D-06 check script explicitly verifies `\n` preservation.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Framework          | Vitest 2.1.8                                                     |
| Config file        | via `vite.config.ts` (no standalone `vitest.config.ts` observed) |
| Quick run command  | `yarn workspace @openvaa/frontend test:unit`                     |
| Full suite command | `yarn test:unit`                                                 |

Pre-phase baseline: **360 passed / 1 skipped** including the 47 `ar` translation-parity tests added by P6. [VERIFIED: SUMMARY.md]

### Phase Requirements → Test Map

| Requirement                           | Behavior                                                              | Test Type     | Automated Command                                                             | Exists?                      |
| ------------------------------------- | --------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| Key parity (permanent guardrail)      | `ar` has same key names as `en` in all 46 files                       | unit (vitest) | `yarn workspace @openvaa/frontend test:unit`                                  | YES — `translations.test.ts` |
| D-06 placeholder integrity (one-time) | `ar` preserves all ICU tokens, ICU constructs, HTML tags, brand names | script        | `cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` | NO — Wave 0 gap              |
| Backend load smoke check              | `getDynamicTranslations()` returns `ar` keys without parse error      | manual shell  | check after `yarn sync:translations`                                          | NO — manual                  |
| RTL in-context rendering              | Root `dir` is `rtl` for Arabic locale; Arabic copy visible            | E2E           | `yarn test:e2e` (existing `rtl.spec.ts`)                                      | YES — needs Docker           |

### Sampling Rate

- **Per translation batch commit:** `yarn workspace @openvaa/frontend test:unit` (key-parity + all unit tests, ~360 tests, fast)
- **Pre-merge gate:** D-06 check script + `yarn test:unit` + `yarn sync:translations` + verify backend file
- **Phase gate:** All of the above + spot RTL rendering review in browser

### Wave 0 Gaps

- [ ] `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` — D-06 check script (new file, covers ICU/HTML/token/brand integrity per key)
- [ ] Glossary document (e.g., `.planning/phases/arabic-translations/GLOSSARY.md`) — must be created and locked before any translation task begins

_(The key-parity test and E2E `rtl.spec.ts` already exist from the RTL phase; no framework install needed.)_

---

## Security Domain

This phase produces only translation content (JSON string values). No authentication, session management, cryptography, or network endpoints are modified. No ASVS categories apply.

One note: `candidateApp.preregister.email.html` in `dynamic.json` contains a long GDPR privacy notice with placeholder strings like `DATA_CONTROLLER` and `DATA_CONTACT_PERSON`. These are template placeholders (not ICU tokens) that are filled in by the deployment operator. They must be preserved verbatim in the Arabic translation.

---

## Environment Availability

Step 2.6: SKIPPED — this phase consists entirely of JSON file edits plus a TypeScript dev-tool script. External dependencies are `tsx` (already in `devDependencies`) and `rsync` (standard macOS/Linux utility, already in the `sync:translations` script). No new installations required.

---

## Assumptions Log

| #   | Claim                                                          | Section | Risk if Wrong                                                                                                                                                                                        |
| --- | -------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Arabic CLDR plural categories: zero/one/two/few/many/other     | §3      | If `intl-messageformat` 10.x uses a different mapping for `ar`, plural arms would resolve to wrong forms. Mitigate: manually test a plural string in the running app for values 0, 1, 2, 5, 11, 100. |
| A2  | Suggested Arabic MSA glossary terms are linguistically correct | §7      | Machine-generated terms may have dialectal or register errors. This is accepted per D-07/D-08 (native review deferred).                                                                              |

**All other claims in this research were verified against actual repo files.**

---

## Open Questions (RESOLVED)

Each question below was resolved by adopting its recommendation; the resolution is implemented by the cited plan task. None remain open or blocking.

1. **`adminApp.jobs.json` — job-state terminology in Arabic**

   - What we know: 37 keys cover job status labels (e.g., "Pending", "Confirmed", "Locked") for an AI/LLM job queue in the admin UI.
   - What's unclear: whether these admin terms should use formal MSA technical vocabulary or informal/English borrowed terms.
   - **RESOLVED:** Use formal MSA and include the job-state terms in the locked glossary. Implemented by Plan 01 (glossary) + Plan 02 (`adminApp.*` translation, per D-04).

2. **`common.madeWithSuffix` empty string**

   - What we know: `common.madeWithSuffix` has value `""` (empty string) in `en`. This is intentional — some languages restructure the "Made with [brand]" phrase.
   - What's unclear: Arabic word order for this phrase — it may need to restructure across `madeWithPrefix` + `madeWithSuffix`.
   - **RESOLVED:** Keep `madeWithSuffix` empty and carry the full Arabic phrase in `madeWithPrefix` if word order requires it; confirm in-context rendering. Implemented by Plan 06 (`common.json`).

3. **`candidateApp.register.codePlaceholder` — placeholder text**
   - Value: `"E.g. CP23-174a-f4%&-aHAB"` — an example registration code with Latin characters.
   - **RESOLVED:** Translate "E.g." to Arabic (`مثال:`) and keep the code example Latin (bidi-isolated per D-05): `"مثال: CP23-174a-f4%&-aHAB"`. Implemented by Plan 03 (`candidateApp.register`).

---

## Sources

### Primary (HIGH confidence — verified against repo files)

- `frontend/src/lib/i18n/tests/translations.test.ts` — parity test mechanics, `flattenKeys()` code
- `frontend/src/lib/i18n/init.ts` — `parser({ ignoreTag: true })` confirmed at line 62
- `frontend/src/lib/i18n/translations/index.ts` — `keys`, `locales`, `DEFAULT_PAYLOAD_KEYS`
- `frontend/src/lib/i18n/translations/en/*.json` — all 46 files scanned; 575 leaf keys confirmed
- `frontend/src/lib/i18n/translations/ar/*.json` — all 46 files confirmed identical to `en/`
- `backend/vaa-strapi/src/util/appCustomization.ts` — `ar` import at line 2, `getDynamicTranslations` at line 12
- `backend/vaa-strapi/src/util/translations/ar/dynamic.json` — confirmed identical to frontend `ar/dynamic.json`
- `frontend/package.json` — `sync:translations` rsync script confirmed; `tsx` in devDependencies
- `frontend/tools/editTranslations/editTranslations.ts` — `flattenKeys` pattern for D-06 reuse
- `.planning/phases/rtl-bidi-support/SUMMARY.md` — what the RTL phase shipped
- `.planning/phases/rtl-bidi-support/DECISIONS.md` — A5, A8, A10 principles

### Secondary (MEDIUM confidence — well-established standards)

- CLDR plural rules for Arabic — `two` category is the Arabic dual; `few`/`many`/`other` follow Unicode CLDR spec [ASSUMED]
- `intl-messageformat` v10 Arabic plural resolution via `Intl.PluralRules` — standard ICU behavior [ASSUMED]

---

## Metadata

**Confidence breakdown:**

- File inventory and key counts: HIGH — Python script verified across all 46 files
- Parity test mechanics: HIGH — read and analyzed `translations.test.ts` source
- Parser/ICU behavior (`ignoreTag`): HIGH — verified in `init.ts` line 62
- Arabic plural rules: MEDIUM/ASSUMED — well-documented CLDR standard, not confirmed by running test
- Glossary MSA terms: LOW/ASSUMED — Claude training knowledge, accepted per D-07/D-08 deferral

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable — no dependency on fast-moving ecosystem; only risk is a schema change to `en/` translation files)
