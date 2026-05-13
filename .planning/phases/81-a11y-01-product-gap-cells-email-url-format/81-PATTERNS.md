# Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 16 (6 component-tier + 7 Paraglide locales + 7 legacy locales + 1 fixture + 1 spec — some overlap; 12 distinct modify-paths + 1 generated artifact)
**Analogs found:** 16 / 16 (100% — every Phase 81 surface mirrors an existing in-tree production pattern; this is a "reuse, don't rebuild" extension)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/components/input/Input.svelte` | component (validation handler) | request-response (DOM event → reactive value + error) | Same file's URL branch (lines 286-296) | exact (self-mirror) |
| `apps/frontend/src/lib/components/input/Input.type.ts` | type (discriminated union) | n/a (compile-time) | `{ type: 'url' } & InputPropsBase<string>` variant (lines 9-11) | exact (self-mirror) |
| `apps/frontend/src/lib/components/input/QuestionInput.svelte` | component (dispatch) | request-response (`subtype` → InputProps['type']) | Same file's `'link' → 'url'` line (line 65) | exact (self-mirror) |
| `apps/frontend/src/lib/utils/email.ts` *(OPTIONAL — Claude's Discretion per D-06)* | utility (validator) | transform (string → string \| undefined) | `apps/frontend/src/lib/utils/links.ts` `checkUrl` (lines 18-41) | role-match (different validator, same shape) |
| `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` (7 files) | config (i18n catalog) | static lookup | Same files' existing `input.error.invalidUrl` key (line 20 in en) | exact (sibling key) |
| `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/components.json` (7 files) | config (TranslationKey type source) | static lookup | Same files' existing `input.error.invalidUrl` key (line 19 in en) | exact (sibling key) |
| `apps/frontend/src/lib/types/generated/translationKey.ts` | generated type | compile-time | Existing `'components.input.error.invalidUrl'` union member | exact (auto-gen via `apps/frontend/tools/translationKey/generateTranslationKeyType.ts`) |
| `packages/dev-seed/src/templates/e2e.ts` (sort-21 retrofit) | fixture (data) | static fixture | Same file's sort-22 `test-question-number-1` row (lines 657-667) | role-match (different question type; same fixed-row shape) |
| `packages/dev-seed/src/templates/e2e.ts` (NEW sort-23 row) | fixture (data) | static fixture | Same file's sort-21 `test-question-social-1` row (lines 621-630) | exact (sibling text question) |
| `packages/dev-seed/src/templates/e2e.ts` (Alpha `answersByExternalId` block) | fixture (data) | static fixture | Same file's existing `'test-question-social-1': { value: { en: ... } }` at line 767 | exact (sibling answer cell — note: Pitfall 4 recommends plain-string migration) |
| `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (TEXT_CELLS additions + loop refactor) | test (E2E) | event-driven (Playwright browser drive) | Same file's existing `TEXT_CELLS` cell at lines 112-119 + loop at lines 213-247 | exact (same describe + login flow + locator pattern) |

---

## Pattern Assignments

### 1. `apps/frontend/src/lib/components/input/Input.svelte` (component, validation handler)

**Analog:** Same file, lines 286-296 (URL validation branch — Phase 81 mirrors byte-for-byte).

**Imports pattern** — no new imports needed. The branch uses already-imported `handleError` (defined at line 318-320 same file) + a new file-local `const EMAIL_REGEX = /.../` (planner inlines per D-06 default; OR imports `checkEmail` from `$lib/utils/email` if extracted).

**Core validation pattern** (lines 286-296 — DO NOT MODIFY; mirror):
```svelte
} else if (type === 'url') {
  // Only update the value if it's an empty string or a valid URL
  const currentValue = currentTarget.value.replaceAll(/\s+/g, '');
  if (currentValue == '') {
    value = '';
  } else {
    const url = checkUrl(currentValue);
    if (url == null) return handleError('components.input.error.invalidUrl');
    value = url;
  }

  // All other types
} else {
  value = currentTarget.value;
}
```

**Phase 81 NEW email branch** — insert IMMEDIATELY BEFORE the fallback `} else {` at line 297:
```svelte
} else if (type === 'email') {
  // reason: pragmatic regex catches obvious typos; server-side does final validation.
  // Mirrors URL branch's preserve-on-fail contract — the `return` BEFORE `value =`
  // is the value-preservation contract (handleChange exits early so `value` is never
  // reassigned; Playwright observes the bad string as still-typed in the DOM).
  const currentValue = currentTarget.value.trim();
  if (currentValue === '') {
    value = '';
  } else {
    if (!EMAIL_REGEX.test(currentValue)) return handleError('components.input.error.invalidEmail');
    value = currentValue;
  }

  // All other types
} else {
  value = currentTarget.value;
}
```

**Subtle difference from URL branch** (RESEARCH §Pattern 2 + §Pitfall): URL uses `.replaceAll(/\s+/g, '')` (URLs cannot contain whitespace at all); email uses `.trim()` (strip leading/trailing; the regex `[^\s@]+@[^\s@]+\.[^\s@]+` rejects interior whitespace).

**`ensureValue()` empty-string list extension** (lines 166-168):
```svelte
// BEFORE
if (type === 'text' || type === 'textarea' || type === 'url') {
  value ??= '';
}

// AFTER (Phase 81 — add '|| type === 'email'')
if (type === 'text' || type === 'textarea' || type === 'url' || type === 'email') {
  value ??= '';
}
```

**`EMAIL_REGEX` constant** (top of `<script>` block, OR extracted to `$lib/utils/email.ts` per D-06 Claude's Discretion):
```typescript
// Pragmatic check: rejects 'foo' / 'foo@bar' / 'foo @bar.co'; accepts 'a@b.co' /
// 'name+tag@example.org'. The 3 disjoint [^\s@]+ groups have no nested quantifiers,
// so this regex is ReDoS-safe by construction (RESEARCH §Security Domain).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Error-clear pattern** (line 301 — UNCHANGED): the existing `error = undefined;` reset at the bottom of `handleChange` already handles error-clearing on next valid input. No new code.

**`handleError` helper pattern** (lines 318-320 — UNCHANGED; reuse as-is):
```typescript
function handleError(key: TranslationKey, payload?: TranslationsPayload): void {
  error = t(key, payload);
}
```
Phase 81 plugs in identically: `handleError('components.input.error.invalidEmail')` — same callsite shape as the URL branch's `handleError('components.input.error.invalidUrl')` at line 293.

---

### 2. `apps/frontend/src/lib/components/input/Input.type.ts` (type, discriminated union)

**Analog:** Same file, lines 9-11 (`{ type: 'url' } & InputPropsBase<string>` variant).

**Existing pattern** (lines 5-38 — `InputProps` discriminated union):
```typescript
export type InputProps =
  | ({ type: 'text';  } & InputPropsBase<string>)
  | ({ type: 'url';   } & InputPropsBase<string>)
  | ({ type: 'text-multilingual'; } & InputPropsBase<LocalizedString>)
  // ...
```

**Phase 81 addition** — insert between `'url'` and `'text-multilingual'` (preserves visual grouping of string-valued single-locale types):
```typescript
  | ({
      type: 'email';
    } & InputPropsBase<string>)
```

**Why this works:** `InputPropsBase<string>` is identical to the `'url'` variant — email values are plain strings (not `LocalizedString`), single-locale (not multilingual), and rendered as `<input>` (not `<textarea>` / `<select>` / `<image>`). The `InputType` alias at line 43 (`type InputType = InputProps['type']`) auto-extends to include `'email'`.

---

### 3. `apps/frontend/src/lib/components/input/QuestionInput.svelte` (component, dispatch)

**Analog:** Same file, line 65 (`'link' → 'url'` dispatch line — Phase 81 mirrors as a single new line).

**Existing dispatch pattern** (lines 63-75):
```svelte
const type = $derived.by<InputProps['type']>(() => {
  let t = INPUT_TYPES[question.type];
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
  if (customData.longText) {
    if (t === 'text') t = 'textarea';
    else if (t === 'text-multilingual') t = 'textarea-multilingual';
  }
  if (!disableMultilingual && !customData.disableMultilingual) {
    if (t === 'text') t = 'text-multilingual';
    else if (t === 'textarea') t = 'textarea-multilingual';
  }
  return t;
});
```

**Phase 81 addition** — insert ONE NEW LINE immediately AFTER the existing `'link' → 'url'` line at line 65:
```svelte
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
  // Phase 81 — parallel dispatch for email format. Lines below leave 'url' / 'email'
  // alone: customData.longText only re-maps 'text' / 'text-multilingual';
  // !disableMultilingual only re-maps 'text' / 'textarea'. 'email' falls through.
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';
```

**Why ordering matters (RESEARCH §Pitfall 5):** The new line MUST go BEFORE the `customData.longText` block at line 66 and BEFORE the `!disableMultilingual` block at line 70 — both of those blocks only remap `'text'` / `'textarea'` / `'text-multilingual'` / `'textarea-multilingual'`, so `'email'` and `'url'` correctly fall through. Placing the dispatch AFTER the multilingual block would still work today (those blocks don't touch `'email'`), but the convention is to keep all subtype-based remaps grouped at the top.

**`INPUT_TYPES` constant** (lines 40-49 — DO NOT MODIFY): this `Record<QuestionType, InputProps['type']>` is indexed by `QUESTION_TYPE.Text/Number/Boolean/...`. There is no `QUESTION_TYPE.Email`; the dispatch is on `subtype`, not `type`. Per RESEARCH §Anti-Patterns, do NOT add `'email'` to this map.

---

### 4. `apps/frontend/src/lib/utils/email.ts` (utility — OPTIONAL, Claude's Discretion per D-06)

**Analog:** `apps/frontend/src/lib/utils/links.ts` lines 18-41 (`checkUrl` function).

**Existing pattern** (`links.ts:18-41`):
```typescript
/**
 * Ensures an url is valid.
 * @param url - The URL string to check.
 * @param options.checkDomain - If `true`, the domain is checked.
 * @param options.allowedProtocols - An array of the allowed protocols.
 * @returns the url or `undefined` if it is invalid.
 */
export function checkUrl(
  url: string,
  {
    checkDomain = true,
    allowedProtocols = ['http:', 'https:']
  }: {
    checkDomain?: boolean;
    allowedProtocols?: Array<string>;
  } = {}
): string | undefined {
  let validUrl: URL;
  try {
    validUrl = new URL(url);
  } catch {
    try {
      validUrl = new URL(`http://${url}`);
    } catch {
      return undefined;
    }
  }
  if (checkDomain && !isValidDomain(validUrl.hostname)) return undefined;
  if (!allowedProtocols.includes(validUrl.protocol)) return undefined;
  return `${validUrl}`;
}
```

**Phase 81 default (RESEARCH §O-3 + Specifics block):** Inline the regex in `Input.svelte` script block; do NOT extract. The current 2-branch shape (URL + email) doesn't justify the abstraction yet — see CLAUDE.md "Don't add features, refactor, or introduce abstractions beyond what the task requires."

**If planner picks extraction shape** (alternative):
```typescript
// apps/frontend/src/lib/utils/email.ts
/**
 * Ensures an email address has a valid pragmatic shape (local@domain.tld).
 *
 * Pragmatic regex check: rejects 'foo' / 'foo@bar' / 'foo @bar.co'; accepts
 * 'a@b.co' / 'name+tag@example.org' / Unicode locals. Server-side authoritative
 * validation lives in Supabase's validate_answer_value() PL/pgSQL function.
 *
 * @param email - The email address to check.
 * @returns the email or `undefined` if it is invalid.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) return undefined;
  return trimmed;
}
```

**Why NOT add to `links.ts`** (RESEARCH §Anti-Patterns): `links.ts` is URL-scoped per current naming convention. A sibling util (`email.ts`) is cleaner if extracted at all.

---

### 5. Paraglide i18n catalogs — `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` (7 files)

**Analog:** Same files' existing `input.error.invalidUrl` key (line 20 in en).

**Existing pattern** (`apps/frontend/messages/en/components.json:12-22`):
```json
"input": {
  "addImage": "Add an image",
  "allSelected": "All selected",
  "changeImage": "Change the image",
  "deleteOption": "Deselect {option}",
  "error": {
    "fileLoadingError": "Failed to load the file.",
    "invalidFile": "The file is invalid.",
    "invalidUrl": "The URL is not valid.",
    "oversizeFile": "The file is too large. The maximum size is {maxFilesize} MB."
  },
  ...
}
```

**Phase 81 addition** — insert `invalidEmail` key BEFORE `invalidFile` (alphabetical order):
```json
"error": {
  "fileLoadingError": "Failed to load the file.",
  "invalidEmail": "The email address is not valid.",
  "invalidFile": "The file is invalid.",
  "invalidUrl": "The URL is not valid.",
  "oversizeFile": "The file is too large. The maximum size is {maxFilesize} MB."
}
```

**Per-locale default strings** (planner refines; D-10 + Specifics block):
- en: `"The email address is not valid."`
- fi: `"Sähköpostiosoite ei kelpaa."`
- sv: `"E-postadressen är ogiltig."`
- da: `"E-mailadressen er ugyldig."`
- et: `"E-posti aadress ei kehti."` (planner verifies native conventions)
- fr: `"L'adresse e-mail n'est pas valide."` (planner verifies)
- lb: `"D'E-Mail-Adress ass net valabel."` (planner verifies)

**Why 7 locales (not 4 as CONTEXT D-10 says):** Per RESEARCH §Pitfall 1 — Paraglide `project.inlang/settings.json` lists 7 locales `["en", "fi", "sv", "da", "et", "fr", "lb"]`. Adding to only en/fi/sv/da would leave et/fr/lb without a translation; Paraglide wrapper at `wrapper.ts:38-39` falls back to the key string `"components.input.error.invalidEmail"` for missing locales.

---

### 6. Legacy translations — `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/components.json` (7 files)

**Analog:** Same files' existing `input.error.invalidUrl` key (line 19 in en).

**Existing pattern** (`apps/frontend/src/lib/i18n/translations/en/components.json:11-21`):
```json
"input": {
  "addImage": "Add an image",
  "allSelected": "All selected",
  "changeImage": "Change the image",
  "deleteOption": "Deselect {option}",
  "error": {
    "fileLoadingError": "Failed to load the file.",
    "invalidFile": "The file is invalid.",
    "invalidUrl": "The URL is not valid.",
    "oversizeFile": "The file is too large. The maximum size is {maxFilesize} MB."
  },
  ...
}
```

**Phase 81 addition** — identical shape to the Paraglide catalog (insert `invalidEmail` BEFORE `invalidFile` alphabetically):
```json
"error": {
  "fileLoadingError": "Failed to load the file.",
  "invalidEmail": "The email address is not valid.",
  "invalidFile": "The file is invalid.",
  "invalidUrl": "The URL is not valid.",
  "oversizeFile": "The file is too large. The maximum size is {maxFilesize} MB."
}
```

**Why this directory exists** (RESEARCH §Pitfall 1 + §Pattern 3): The `TranslationKey` type at `apps/frontend/src/lib/types/generated/translationKey.ts` is auto-generated FROM this directory (NOT from `messages/`). The generator script at `apps/frontend/tools/translationKey/generateTranslationKeyType.ts:10` reads `path.join('src', 'lib', 'i18n', 'translations')`. Skipping these files leaves the `TranslationKey` union without `'components.input.error.invalidEmail'` → `handleError('components.input.error.invalidEmail')` in `Input.svelte` fails TS compile.

**Verified at pattern-mapping time:** Legacy translations directory has all 7 locales (en/fi/sv/da/et/fr/lb) — same as Paraglide. The RESEARCH §Internal Module Touchpoints "4 legacy locales" claim is OUT OF DATE; both dirs have 7 locales now. Update both consistently for type-generation completeness AND runtime parity.

---

### 7. `apps/frontend/src/lib/types/generated/translationKey.ts` (generated, compile-time)

**Analog:** Existing `'components.input.error.invalidUrl'` union member in the same file.

**Pattern:** Auto-regenerate via:
```bash
cd apps/frontend
tsx tools/translationKey/generateTranslationKeyType.ts
```

The generator reads `src/lib/i18n/translations/{first-locale}/components.json`, flattens keys, sorts them, and writes the union. After the JSON edits in step 6 land, re-running the generator adds `'components.input.error.invalidEmail'` automatically.

**Manual fallback** (if generator can't run): insert the union member between `'components.input.error.fileLoadingError'` and `'components.input.error.invalidFile'` (sorted alphabetical).

**Why this is a Pitfall 2 risk:** Per RESEARCH §Pitfall 2, the generator must be invoked AFTER JSON edits and BEFORE editing `Input.svelte`. Best ordering:
1. Edit 7 legacy JSON files (`src/lib/i18n/translations/*/components.json`)
2. Run generator → `translationKey.ts` includes new union member
3. Edit `Input.svelte` to call `handleError('components.input.error.invalidEmail')` — compiles
4. Edit 7 Paraglide JSON files (`messages/*/components.json`) → runtime lookups succeed in all locales

---

### 8. `packages/dev-seed/src/templates/e2e.ts` — sort-21 retrofit (fixture, data)

**Analog:** Same file's existing sort-21 row at lines 621-630 (PRE-Phase-81 shape).

**Existing pattern (BEFORE — lines 617-630):**
```typescript
// Phase 76 A11Y-02 social-link reload-persistence anchor (PRODUCT-GAP-PARTIAL:
// url-format validation deferred per .planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md;
// this slot exercises persistence ONLY, asserting the saved URL string
// round-trips identically across page.reload()).
{
  external_id: 'test-question-social-1',
  type: 'text',
  name: { en: 'Social link (Phase 76 anchor)' },
  category: { external_id: 'test-category-info' },
  allow_open: false,
  required: false,
  sort_order: 21,
  is_generated: false
},
```

**Phase 81 retrofit (AFTER):**
```typescript
// Phase 76 A11Y-02 social-link reload-persistence anchor — Phase 81 lifts the
// PRODUCT-GAP-PARTIAL to FULL via `subtype: 'link'` dispatch (QuestionInput.svelte:65
// remaps Text+subtype='link' to InputProps['type']='url' → Input.svelte's URL
// validation branch at lines 286-296 is now REACHABLE on this row's candidate
// profile input).
{
  external_id: 'test-question-social-1',
  type: 'text',
  subtype: 'link', // Phase 81 — enables URL dispatch via QuestionInput.svelte:65
  name: { en: 'Social link (Phase 76 anchor)' },
  category: { external_id: 'test-category-info' },
  allow_open: false,
  required: false,
  sort_order: 21,
  is_generated: false
},
```

**Why ZERO dev-seed code change** (RESEARCH §Don't Hand-Roll): The Supabase `bulk_import` RPC at `apps/supabase/supabase/schema/501-bulk-operations.sql:128-207` iterates `jsonb_each(p_item)` generically and writes each value to the matching column. `subtype` is part of the `questions` Insert shape (`packages/supabase-types/src/database.ts:991`, `text | null`) and NOT in the RPC's `skip_columns` list. No writer-side code change needed.

---

### 9. `packages/dev-seed/src/templates/e2e.ts` — NEW sort-23 row (fixture, data)

**Analog:** Same file's sort-21 `test-question-social-1` row (post-retrofit shape from #8).

**Phase 81 NEW row** — insert AFTER the sort-22 `test-question-number-1` row (lines 657-667), BEFORE the closing `]` of the `fixed[]` array at line 668:
```typescript
// Phase 81 A11Y-05 anchor — email-format dispatch via Question.subtype='email'.
// QuestionInput.svelte:65 (new dispatch line) remaps Text+subtype='email' to
// InputProps['type']='email' → Input.svelte's new email validation branch
// (mirrors the URL branch at Input.svelte:286-296 — pragmatic regex check +
// handleError on fail + value-preservation by returning before value=assignment).
//
// VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix):
// Alpha's answer value MUST NOT contain the substring 'alpha' (case-insensitive).
// candidate-questions.spec.ts CAND-06 line 271 reads strict-mode
// getByText('Alpha', { exact: false }) — sentinel-style value below stays disjoint.
//
// sort_order: 23 — placed AFTER Phase 77's test-question-number-1 (sort 22).
// Voter fixture's default voterAnswerCount=16 Likert loop is unaffected:
// sort 23 > 16, voter never encounters this info question.
{
  external_id: 'test-question-email-1',
  type: 'text',
  subtype: 'email',
  name: { en: 'Email address (Phase 81 A11Y-05 anchor)' },
  category: { external_id: 'test-category-info' },
  allow_open: false,
  required: false,
  sort_order: 23,
  is_generated: false
}
```

---

### 10. `packages/dev-seed/src/templates/e2e.ts` — Alpha `answersByExternalId` block (fixture, data)

**Analog:** Same file's existing answer cells at lines 763-772 (Phase 76 sentinel cells + Phase 77 number cell).

**Existing pattern** (lines 763-772):
```typescript
'test-question-displayname': { value: { en: 'Display Name Sentinel 76' } },
'test-question-bio': {
  value: { en: 'Phase 76 biography sentinel used by A11Y-02 reload-persistence.' }
},
'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } },
// Phase 77 / SETTINGS-01 wave B Plan 02 — Alpha's NumberFilter anchor answer.
'test-question-number-1': { value: 25 }
```

**Phase 81 additions** — TWO edits:

**(a) NEW Alpha answer cell** — insert AFTER the `test-question-number-1` cell at line 772:
```typescript
// Phase 81 A11Y-05 anchor — Alpha's email-format answer. Plain-string shape
// (NOT LocalizedString) so the new `subtype: 'email'` single-locale dispatch's
// ensureString path renders the seeded value correctly. See Pitfall 4.
'test-question-email-1': { value: 'sentinel-81@example.com' }
```

**(b) RECOMMENDED migration of sort-21 cell** (RESEARCH §Pitfall 4 + §O-2) — change line 767 from:
```typescript
'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } },
```
to:
```typescript
'test-question-social-1': { value: 'https://example.com/sentinel-76' },
```

**Why plain string** (RESEARCH §Pitfall 4 + §Assumption A6): Post-retrofit, the sort-21 input dispatches to single-locale `'url'`. `QuestionInput.svelte:108-109` calls `question.ensureValue(LocalizedString)` → `TextQuestion._ensureValue → ensureString({ en: '...' })` returns `MISSING_VALUE` (not a `typeof === 'string'`). Result: the input renders EMPTY for the seeded LocalizedString answer until the user re-saves. Migrating to plain string aligns the cell's render shape with its new dispatch. The migration preamble at `apps/supabase/supabase/migrations/00001_initial_schema.sql:163-166` confirms plain string IS acceptable for text answers; planner verifies `validate_answer_value()` at PLAN.md authoring time.

**Value-disjointness check** (Phase 76 P01 invariant — RESEARCH §Code Examples):
- `'sentinel-81@example.com'` — case-insensitive `alpha` substring absent. SAFE.
- `'https://example.com/sentinel-76'` — case-insensitive `alpha` substring absent. SAFE (unchanged).

---

### 11. `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (test, E2E)

**Analog:** Same file's existing `TEXT_CELLS` cell at lines 112-119 + loop at lines 213-247 (Phase 76 P01 cell-3 name-too-long pattern).

**Existing imports** (lines 45-53 — REUSE; no new imports needed):
```typescript
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
```

**Existing `loginAsCandidate` helper** (lines 67-74 — REUSE; module-level hoisted):
```typescript
async function loginAsCandidate(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
}
```

**Existing `TEXT_CELLS` constant** (lines 112-119) — REPLACE with discriminated-union shape:
```typescript
// BEFORE
const TEXT_CELLS = [
  {
    name: 'name-too-long caps input value at maxlength=50 on display-name',
    fieldLabel: /Display name \(Phase 76 anchor\)/i,
    maxlength: 50,
    overflow: 60
  }
] as const;

// AFTER (Phase 81 — add 2 new cells with `kind` discriminant)
const TEXT_CELLS = [
  {
    name: 'name-too-long caps input value at maxlength=50 on display-name',
    kind: 'maxlength' as const,
    fieldLabel: /Display name \(Phase 76 anchor\)/i,
    maxlength: 50,
    overflow: 60
  },
  {
    // Phase 81 cell 5 — A11Y-05 anchor
    name: 'A11Y-05 email-format rejection surfaces invalidEmail error',
    kind: 'format' as const,
    fieldLabel: /Email address \(Phase 81 A11Y-05 anchor\)/i,
    badValue: 'not-an-email',
    expectedErrorText: /The email address is not valid/i
  },
  {
    // Phase 81 cell 6 — A11Y-06 anchor (retrofitted sort-21 social-link)
    name: 'A11Y-06 url-format rejection surfaces invalidUrl error',
    kind: 'format' as const,
    fieldLabel: /Social link \(Phase 76 anchor\)/i,
    badValue: 'not a url',
    expectedErrorText: /The URL is not valid/i
  }
] as const;
```

**Existing loop pattern** (lines 213-247) — REFACTOR to branch by `kind`:
```typescript
// AFTER (Phase 81 — discriminated by cell.kind)
for (const cell of TEXT_CELLS) {
  test(`A11Y-01 ${cell.name}`, async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    // Settle gate — anchor on profile heading before interacting (avoids
    // racing the candidate context's $derived chain initialization).
    await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
      timeout: 10000
    });

    const input = page.getByLabel(cell.fieldLabel).first();
    await expect(input).toBeVisible({ timeout: 5000 });

    if (cell.kind === 'maxlength') {
      // HTML5 native cap — fill above ceiling, value silently truncates.
      const overflowValue = 'x'.repeat(cell.maxlength + cell.overflow);
      await input.fill(overflowValue);
      await expect(input).toHaveValue('x'.repeat(cell.maxlength));
      const observedValue = await input.inputValue();
      expect(observedValue).toHaveLength(cell.maxlength);
      expect(observedValue.startsWith('x')).toBe(true);
    } else {
      // kind === 'format' (email or URL) — Input.svelte's handleChange branch
      // emits an i18n error message and preserves the bad value (the `return`
      // before `value =` is the value-preservation contract per Input.svelte
      // lines 293/307 for URL/email respectively).
      await input.fill(cell.badValue);
      await expect(page.getByText(cell.expectedErrorText)).toBeVisible({ timeout: 5000 });
      await expect(input).toHaveValue(cell.badValue); // value-preservation
    }
  });
}
```

**Docstring update** (lines 23-29) — Phase 81 should update the PRODUCT-GAP-cells docstring to note A11Y-05 + A11Y-06 are NOW resolved (A11Y-07 remains deferred to Phase 82):
```typescript
// BEFORE (lines 23-29)
// PRODUCT-GAP cells (email-format / url-format / name-too-short /
// required-empty) are deferred via single follow-up todo at
// `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` per
// Phase 76 CONTEXT D-03 PRODUCT-GAP path + RESEARCH LANDMINE-2. The
// deferred cells require schema (`customData.format` field) +
// component (`Input.svelte` email branch) + i18n (`input.error.invalidEmail`
// key) additions that exceed v2.9 coverage-phase scope.

// AFTER (Phase 81 — close email + URL; A11Y-07 remains deferred)
// PRODUCT-GAP cells resolved by Phase 81 (A11Y-05 email-format + A11Y-06
// url-format — see TEXT_CELLS entries 2 + 3 below). A11Y-07 (required-empty)
// remains deferred to Phase 82 per ROADMAP. The Phase 81 path uses
// `Question.subtype` dispatch (NOT `customData.format`) — see
// .planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-CONTEXT.md
// D-01 for the dispatch-mechanism decision rationale.
```

**Locator pattern** (RESEARCH §Pitfall 6 + D-19): `getByLabel(/regex/i).first()` — the `.first()` suffix is defensive but technically unnecessary for single-locale dispatch (Phase 81's `'url'` / `'email'` types are single-locale, so only ONE matching `aria-labelledby` input renders). Mirror cell-3 byte-for-byte for consistency.

**Test-title pattern** (D-12 + RESEARCH §Pitfall 7 — IMGPROXY_TIED_TITLES safety): Both new titles `A11Y-05 email-format rejection surfaces invalidEmail error` + `A11Y-06 url-format rejection surfaces invalidUrl error` are CLEAN against the 14-entry IMGPROXY_TIED_TITLES list at `regen-constants.mjs:67-82`. Re-verify at PLAN.md authoring time.

---

## Shared Patterns

### S-1. Question subtype dispatch (cross-cutting — `subtype` is the canonical mechanism)

**Source:** `apps/frontend/src/lib/components/input/QuestionInput.svelte:65` (existing `'link' → 'url'`).

**Apply to:** The new email dispatch in QuestionInput.svelte (pattern #3 above) + the sort-21 retrofit in e2e.ts (pattern #8 above) + the new sort-23 row in e2e.ts (pattern #9 above).

**Code pattern:**
```svelte
if (question.type === QUESTION_TYPE.Text && question.subtype === '<value>') t = '<input-type>';
```

**Why this is the canonical mechanism** (CONTEXT D-01 + RESEARCH §Pattern 1):
- DB column `questions.subtype` is `text | null` with no CHECK constraint (`packages/supabase-types/src/database.ts:964/991/1018`).
- `DataObject.subtype` getter at `packages/data/src/core/dataObject.ts:96-98` surfaces it on every Question instance via inheritance.
- Already consumed by 2 components today: `QuestionInput.svelte:65` (`'link'` → URL dispatch) + `InfoAnswer.svelte:65,79` (`'link'` / `'linkList'` rendering).
- `bulk_import` RPC at `apps/supabase/supabase/schema/501-bulk-operations.sql` writes the field generically (zero dev-seed code change).
- `supabaseDataProvider.ts:521-546` reads the column verbatim via `toDataObject(row, ...)` (zero adapter change).

**Anti-pattern (REJECTED by CONTEXT D-01):** `customData.format: 'email' | 'url'` enum on `CustomData.Question` — duplicates `subtype`, requires bridge layer, guaranteed consolidation work.

---

### S-2. Validation branch + value-preservation contract (cross-cutting — `Input.svelte handleChange`)

**Source:** `apps/frontend/src/lib/components/input/Input.svelte:286-296` (existing URL branch).

**Apply to:** The new email branch (pattern #1 above) + any future format-validation branches.

**Code pattern:**
```svelte
} else if (type === '<input-type>') {
  const currentValue = currentTarget.value.<sanitize>();
  if (currentValue === '') {
    value = '';
  } else {
    if (!<validate>(currentValue)) return handleError('components.input.error.<errorKey>');
    value = currentValue;
  }
}
```

**Contract elements:**
1. **Sanitize**: URL uses `.replaceAll(/\s+/g, '')` (no internal whitespace allowed in URLs); email uses `.trim()` (locals can't contain whitespace; regex rejects interior whitespace).
2. **Empty handling**: empty trimmed string → assign `''` (allows clearing the field).
3. **Validation**: invoke validator; if invalid, RETURN early via `handleError(...)` (value-preservation contract — `value` is never reassigned).
4. **Success**: assign the canonicalized value (URL canonicalization via `new URL(...)` for URLs; trim-only for email).
5. **Error reset**: line 301 (`error = undefined`) is OUTSIDE the per-branch logic; runs on the success path automatically (the early `return` on failure skips it, leaving the previously-displayed error in place).

**Apply to** any future `'tel'` / `'postal'` / etc dispatches (out of v2.10 scope per RESEARCH §Deferred).

---

### S-3. i18n key add — dual-source + type-generation pattern

**Source:** Existing `components.input.error.invalidUrl` key (in both Paraglide + legacy translations + generated union).

**Apply to:** All 14 i18n catalog edits (7 Paraglide + 7 legacy) + 1 generated type (#5, #6, #7 above).

**Sequence-of-edits matters** (RESEARCH §Pitfall 2):
1. Edit all 7 legacy `src/lib/i18n/translations/{locale}/components.json` files — adds `invalidEmail` key to type-generation source.
2. Run `tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts` from `apps/frontend/` cwd — regenerates `translationKey.ts` to include `'components.input.error.invalidEmail'`.
3. Edit `Input.svelte` to call `handleError('components.input.error.invalidEmail')` — TypeScript compile now succeeds.
4. Edit all 7 Paraglide `messages/{locale}/components.json` files — runtime translation lookup succeeds in all locales.

**Anti-pattern (REJECTED by RESEARCH §Pitfall 1):** Editing only Paraglide OR only legacy translations. Either is incomplete; both must land.

---

### S-4. Test locator + login pattern (cross-cutting — Playwright)

**Source:** `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:67-74` (`loginAsCandidate`) + line 229 (`getByLabel(...).first()`).

**Apply to:** Both new spec cells (pattern #11 above).

**Code pattern** (per-cell shape):
```typescript
test(`A11Y-01 ${cell.name}`, async ({ page }) => {
  await loginAsCandidate(page);
  await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));
  await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({ timeout: 10000 });
  const input = page.getByLabel(cell.fieldLabel).first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(cell.badValue);
  await expect(page.getByText(cell.expectedErrorText)).toBeVisible({ timeout: 5000 });
  await expect(input).toHaveValue(cell.badValue);
});
```

**Locator rules** (CONTEXT D-19 + RESEARCH §Code Review checklist):
- ALWAYS `getByRole` / `getByLabel` / `getByText` — never raw CSS selectors.
- `playwright/no-raw-locators` lint rule at `'error'` enforces this (`tests/eslint.config.mjs`).
- NO new testIds needed — Phase 81 reuses the existing label-based locator pattern.
- `.first()` suffix is defensive against multilingual-input fallout but technically unnecessary for single-locale dispatch.

---

### S-5. Inline `// reason:` justification (cross-cutting — code review hygiene)

**Source:** v2.8 P70 / v2.8 P71 / Phase 73 IN-03 / Phase 80 D-14 conventions (per CLAUDE.md §"Svelte Warning-Accepted Format" + RESEARCH §Established Patterns).

**Apply to:** Non-obvious decision points in the modified surfaces:
- `Input.svelte` new email branch — `// reason: pragmatic regex catches obvious typos; server-side does final validation.`
- `e2e.ts` sort-21 plain-string migration — `// reason: post-retrofit single-locale 'url' dispatch needs plain string per Pitfall 4 (LocalizedString → MISSING_VALUE).`
- `candidate-profile-validation.spec.ts` `.first()` locator suffix — `// reason: defensive against multilingual-input fallout; technically unnecessary for single-locale 'url'/'email' dispatch.`
- `QuestionInput.svelte` new dispatch line position — `// reason: placed BEFORE longText + !disableMultilingual blocks so 'email' falls through unchanged (those blocks only remap 'text'/'textarea').`

Use sparingly — the preferred outcome is self-evident code. Apply only where the WHY isn't obvious from the WHAT.

---

## No Analog Found

**None.** Every Phase 81 surface has an exact or role-match analog in the existing tree. This is a textbook "reuse, don't rebuild" extension — see RESEARCH §"Don't Hand-Roll" table for the 7-row inventory of reused assets (subtype field, bulk_import RPC, dataProvider mapRow, dispatch order, value-preservation contract, locator pattern, login helper).

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/components/input/` (Input.svelte, Input.type.ts, QuestionInput.svelte, InfoAnswer.svelte)
- `apps/frontend/src/lib/utils/` (links.ts as `checkUrl` precedent for optional `email.ts` extraction)
- `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` (7 locales, Paraglide source)
- `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/components.json` (7 locales, TranslationKey source)
- `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` (generator script)
- `packages/dev-seed/src/templates/e2e.ts` (e2e fixture)
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (existing 3 cells)
- `packages/data/src/` (DataObject + TextQuestion + ensureValue for Pitfall 4 verification)
- `apps/supabase/supabase/schema/501-bulk-operations.sql` (bulk_import RPC verification)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql:163-166` (validate_answer_value preamble)

**Files scanned (directly read for excerpts):** 11.

**Pattern extraction date:** 2026-05-13.

**Cross-references:**
- RESEARCH.md §Pattern 1 / 2 / 3 (canonical patterns)
- RESEARCH.md §Pitfall 1-8 (risks the planner must absorb — especially Pitfalls 1 + 4)
- RESEARCH.md §Code Examples (verified patterns from official OpenVAA codebase sources)
- CONTEXT.md D-01 through D-19 (locked decisions)
- CLAUDE.md §"Localization" / §"Use TypeScript strictly" / §"Svelte Warning-Accepted Format" (project conventions)

---

*Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format*
*Pattern mapping completed: 2026-05-13*
