# Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format - Research

**Researched:** 2026-05-13
**Domain:** Candidate-profile form validation (email + URL format) — Svelte 5 component-layer extension on existing `Question.subtype` dispatch + `Input.svelte handleChange` regex contract
**Confidence:** HIGH (everything verified in tree against working code; no library-version research needed — change is internal to OpenVAA's own components)

## Summary

Phase 81 is a tightly-scoped, structurally-additive validation surface extension. CONTEXT.md (D-01 through D-19) locks the schema dispatch mechanism (`Question.subtype`, NOT `customData.format`), the email validation strategy (programmatic regex in `Input.svelte handleChange`, NOT HTML5 `type="email"` validity), the email regex shape (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), the fixture layout (retrofit sort-21 social-link + add new sort-23 email row), and the spec shape (2 new cells discriminated by `kind` in the existing `TEXT_CELLS` loop). Research therefore focuses on **verifying the locked assumptions hold against the current tree** and **surfacing risks the planner must mitigate** — not on choosing alternatives.

The locked dispatch mechanism is **already production-correct**: `Question.subtype` is DB-typed `text | null` (`packages/supabase-types/src/database.ts:964/991/1018`), surfaced via `DataObject.subtype` getter (`packages/data/src/core/dataObject.ts:96-98`), consumed at `QuestionInput.svelte:65` (`subtype === 'link' → 'url'`) and `InfoAnswer.svelte:65,79`. The bulk_import RPC is **generic** — it iterates every key in `jsonb_each(p_item)` and writes the value to the matching column, so `subtype: 'link'` / `subtype: 'email'` on a fixture row passes through to the DB with **zero dev-seed code change**. The dataProvider's `mapRow` passes the column through verbatim to the Question instance.

**Primary recommendation:** Implement exactly as CONTEXT.md locks. Three concrete corrections / risks for the planner to absorb:

1. **i18n key must be added to TWO source paths, not one** — CONTEXT.md D-10 says "add to all 4 locales (en/fi/sv/da `messages/*/components.json`)". This is incomplete. Paraglide compiles from `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` (**7 locales**, not 4); the `TranslationKey` type is auto-generated from `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json` (**4 locales**, the legacy source kept alive for type generation). Both must be updated. Missing any one will compile-fail or runtime-fall-back-to-key. See **Pitfall 1**.
2. **DOM `type` attribute IS bound from the dispatched prop** — D-05's REJECTED-rationale paragraph claims "Phase 81 keeps that DOM shape unchanged — the dispatched `'email'` type only drives the validation branch, not the DOM `type` attribute." This is **incorrect**: `Input.svelte:602` renders `<input {type} ...>` for the fall-through branch, so a dispatched `type='email'` emits `<input type="email">` (matches existing URL behavior — `type='url'` emits `<input type="url">`). This is **OK for the spec** (`getByLabel(...).fill()` works on any `<input>` type) and arguably **better UX** (mobile email keyboard surfaces), but contradicts the CONTEXT claim. The planner should accept the actual rendered DOM type or explicitly override with `restProps`.
3. **Sort-21 retrofit changes the input render shape from `text-multilingual` to single-locale `url`** — this is intended (it's how the URL branch becomes reachable), but it has two downstream effects:
   - The Phase 76 P02 reload-persistence test at `candidate-profile.spec.ts:284-309` currently fills a multilingual `<input type="text">`; post-Phase-81 it fills a single-locale `<input type="url">`. The fill-then-reload contract still holds because `NEW_SOCIAL = 'https://github.com/openvaa/sentinel-76-p02'` is a valid URL.
   - Alpha's existing seed `'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } }` is a **`LocalizedString`** but the new `type='url'` input expects a **plain string** at `QuestionInput.svelte:107-109`. `TextQuestion._ensureValue → ensureString` returns `MISSING_VALUE` for non-string input — the input renders empty for the seeded answer until the user re-saves. See **Pitfall 4** for the resolution path (migrate the seed cell to a plain string, OR accept the soft regression for cells 5/6 which fill fresh).

Component-tier and architectural correctness are HIGH-confidence verified. Determinism contract inheritance (D-13/14/15), IMGPROXY_TIED_TITLES safety (D-12), and locator/lint convention (D-19) all hold against the current tree.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Reuse the EXISTING `Question.subtype` field (NOT a new `customData.format` enum).** `Question.subtype` is already wired end-to-end TODAY (DB column `questions.subtype text | null` no CHECK at `packages/supabase-types/src/database.ts:964/991/1018`; `DataObject.subtype` getter at `packages/data/src/core/dataObject.ts:96-98`; consumers at `QuestionInput.svelte:65` and `InfoAnswer.svelte:65,79`).

**D-02 — `subtype` value for email dispatch is `'email'`.** Parallel to the existing `'link'` / `'linkList'` family.

**D-03 — `subtype` value for the URL retrofit is `'link'`.** Reuse the existing dispatch value.

**D-04 — `QuestionInput.svelte` dispatch extension is a single new line.** After the existing `'link' → 'url'` line at QuestionInput.svelte:65:
```svelte
if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';
```

**D-05 — Programmatic regex inside `Input.svelte handleChange` (NOT HTML5 native validity).** Mirror the URL branch at `Input.svelte:286-296`. Add `'email'` to `Input.type.ts InputProps['type']` discriminated union. Add `'email'` to the `ensureValue()` empty-string list at `Input.svelte:166`.

**D-06 — Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (pragmatic shape).** Location is Claude's Discretion (inline in `Input.svelte` default; optionally extracted to `apps/frontend/src/lib/utils/email.ts`).

**D-07 — Retrofit sort-21 `test-question-social-1` IN-PLACE with `subtype: 'link'`.**

**D-08 — NEW sort-23 `test-question-email-1` info question.** Alpha answer `'sentinel-81@example.com'` (disjoint from 'alpha' substring).

**D-09 — Sort-21 retrofit value-shape change (add subtype field) + update the existing PRODUCT-GAP-PARTIAL comment.**

**D-10 — Add NEW `components.input.error.invalidEmail` key to all 4 locales** (CONTEXT specifies en/fi/sv/da `messages/*/components.json`; see Pitfall 1 — **also** must add to `src/lib/i18n/translations/{en,fi,sv,da}/components.json` for TranslationKey type generation, **and** to the additional 3 Paraglide locales `et/fr/lb/components.json`).

**D-11 — 2 new TEXT_CELLS in candidate-profile-validation.spec.ts** (cell 5 email + cell 6 URL); `kind` discriminant for the loop refactor.

**D-12 — IMGPROXY_TIED_TITLES safety** — Phase 81 titles don't collide with the 14 bound patterns.

**D-13 — Inherit Phase 80 D-09 / D-11 determinism contract:** 3-run cold-start `--workers=1` + vite-cache wipe via `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`.

**D-14 — Phase 79 v2.10 anchor at SHA `ff0334f856…` MUST hold** (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE); Phase 81 expects +2 NEW PASS_LOCKED entries.

**D-15 — Parity-script self-identity smoke.**

**D-16 — IMGPROXY_TIED_TITLES list NOT touched.**

**D-17 — Skip `/gsd-ui-phase` auto-spawn** (memory precedent).

**D-18 — Default: 1 bundled plan; planner may split into 2 if scope exceeds per-plan ceiling.**

**D-19 — Inherits locator + lint convention** (role/aria + `playwright/no-raw-locators` at 'error').

### Claude's Discretion

- **Email regex extraction shape** (D-06): inline in `Input.svelte` (default), OR extract to `apps/frontend/src/lib/utils/email.ts`. Planner picks at PLAN.md time.
- **i18n string translations** (D-10): English default `"The email address is not valid."`; Finnish/Swedish/Danish (and 3 additional Paraglide locales) translations follow native conventions.
- **Spec refactor shape** (D-11): 2 parallel loops by `kind` (default) OR single loop with branch-by-kind.
- **Plan count** (D-18): default 1 bundled plan; planner may split into 2 if scope concerns surface.
- **dev-seed writer subtype passthrough**: per RESEARCH §"Architectural Responsibility Map" + "Standard Stack" — VERIFIED no code change needed; bulk_import RPC handles `subtype` generically.
- **Comment update on sort-21 row** (D-09): planner picks exact phrasing.
- **Test title `A11Y-05` / `A11Y-06` infix**: keep `A11Y-01` prefix for grouping (default) OR simplify.

### Deferred Ideas (OUT OF SCOPE)

- **`InfoAnswer.svelte` email rendering** — saved email addresses as `mailto:` links (parallel to existing `subtype === 'link'` → href). Phase 82+ candidate.
- **`Question.subtype` as a typed enum** — convention-by-string-value is current pattern. Future work.
- **`tel` / `postal` / other format dispatches** — out of v2.10.
- **Centralized validator helper / `Input.svelte` shared validation registry** — out of v2.10.
- **HTML5 `<input type="email">` mobile-keyboard UX** — see Open Question O-1 (the CONTEXT D-05 paragraph asserts DOM shape is unchanged; research confirms otherwise).
- **Phase 82 required-empty cell** (A11Y-07) — separate phase.
- **Full i18n key-coverage audit across 7 Paraglide locales** — out of scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **A11Y-05** | Candidate profile rejects malformed email input via inline validation error. Schema: `Question.subtype === 'email'` dispatch (CONTEXT D-01 supersedes REQUIREMENTS.md's `customData.format` enum text). Component: `'email'` branch in `Input.svelte handleChange` mirrors the URL branch at lines 286-296, emits `components.input.error.invalidEmail`. i18n: new `invalidEmail` key in all 4 legacy locales + 7 Paraglide locales. Seed: NEW sort-23 `test-question-email-1` info question + Alpha sentinel answer. Spec: A11Y-01 cell 5 added — bad email → error UI + value preserved. | RESEARCH §"Standard Stack" + §"Architecture Patterns: Dispatch Chain" + §"Code Examples" + Pitfall 1 |
| **A11Y-06** | Candidate profile rejects malformed URL input on social-link fields via inline validation error. Schema: retrofit sort-21 `test-question-social-1` IN-PLACE with `subtype: 'link'` (existing `QuestionInput.svelte:65` URL dispatch becomes REACHABLE on the candidate-profile route). Spec: A11Y-01 cell 6 added — bad URL → `components.input.error.invalidUrl` + value preserved. | RESEARCH §"Architecture Patterns: Dispatch Chain" + Pitfall 4 (LocalizedString-to-string render-shape change) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email/URL format validation rule | API / Backend | — | Server-side authoritative validation is out-of-scope per CONTEXT D-06 ("server-side does final validation"). Phase 81 implements only the CLIENT-side pragmatic check. The API tier still owns the canonical truth but is unchanged by Phase 81. |
| Question schema (`subtype` field) | Database / Storage | — | DB-typed `text | null` column at `questions.subtype`; no migration needed (verified Phase 81 scout). |
| Input dispatch (`subtype → InputProps['type']`) | Frontend Server (SSR) → Browser / Client | — | `QuestionInput.svelte` is a Svelte component that compiles to a hydrate-on-client bundle. The dispatch logic runs on both server (initial render) and client (interactivity). |
| Programmatic regex validation in `handleChange` | Browser / Client | — | `Input.svelte handleChange` is exclusively client-side event handler (DOM event delivery). Runs only after hydration. |
| i18n message resolution | Frontend Server (SSR) + Browser / Client | — | Paraglide compiles per-locale message functions consumed by both server (SSR) and client. `TranslationKey` type-checked at compile time. |
| Test fixture (Alpha answer cell) | Database / Storage | — | dev-seed pipeline writes Alpha's sentinel answer to `candidates.answers` JSONB via bulk_import RPC. |
| Test assertion (spec cell 5/6) | Browser / Client | — | Playwright drives DOM via real browser; assertions read rendered text + input values. |

## Standard Stack

### Core (NO NEW DEPENDENCIES)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@openvaa/data` | workspace | `Question.subtype` getter on `DataObject` base class | Already canonical; production codepath today via `'link'` / `'linkList'` |
| Svelte | 5.x | `$derived.by` dispatch + `$state` for `error` reactive variable | Already used at `QuestionInput.svelte:63-75` + `Input.svelte` |
| Paraglide (`@inlang/plugin-message-format` 4) | per `project.inlang/settings.json` | Locale-specific message compilation from `messages/{locale}/components.json` | Already in use; `t('components.input.error.invalidUrl')` lookup path is identical to what `invalidEmail` will use |
| Playwright | per `tests/package.json` | `page.getByLabel(/regex/i)` + `expect(input).toHaveValue(...)` | Already-canonical locator API per Phase 73 IN-03 |

[VERIFIED: codebase grep — no new dependencies needed for any Phase 81 change.]

### Internal Module Touchpoints

| Module | Path | What Phase 81 Changes |
|--------|------|----------------------|
| `Input.type.ts` | `apps/frontend/src/lib/components/input/Input.type.ts:5-38` | Add `{ type: 'email' } & InputPropsBase<string>` variant (copy `'url'` shape at lines 10-12 verbatim) |
| `Input.svelte` `<script>` | `apps/frontend/src/lib/components/input/Input.svelte:166` | Extend `ensureValue()` empty-string list: `if (type === 'text' || type === 'textarea' || type === 'url' || type === 'email')` |
| `Input.svelte handleChange` | `apps/frontend/src/lib/components/input/Input.svelte:286-296` | Add `else if (type === 'email')` branch mirroring URL branch (lines 286-296) immediately before fallback at line 297-300 |
| `Input.svelte` regex constant | `apps/frontend/src/lib/components/input/Input.svelte` `<script>` top (or extracted util) | Add `const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;` (D-06; inline default OR `$lib/utils/email.ts`) |
| `QuestionInput.svelte` `$derived.by` | `apps/frontend/src/lib/components/input/QuestionInput.svelte:65` | Insert one line after existing 'link' → 'url' line: `if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';` |
| Paraglide messages (7 locales) | `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` | Add `"invalidEmail": "..."` under `input.error` block |
| Legacy translations (4 locales — drives TranslationKey type generator) | `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json` | Add `"invalidEmail": "..."` under `input.error` block |
| TranslationKey generated type | `apps/frontend/src/lib/types/generated/translationKey.ts:373-374` | Run `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` OR manually add `| 'components.input.error.invalidEmail'` line after line 373 |
| e2e fixture | `packages/dev-seed/src/templates/e2e.ts:621-630 + ~666-667 + 767` | Retrofit sort-21 with `subtype: 'link'` + new sort-23 row + Alpha sentinel answer + comment update |
| Spec | `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:112-119 + 213-247` | 2 new `TEXT_CELLS` entries + `kind` discriminant + loop refactor |

### Alternatives Considered (Already Rejected by CONTEXT)

| Instead of | Could Use | Why CONTEXT rejected |
|------------|-----------|----------------------|
| `Question.subtype === 'email'` | `customData.format: 'email'` enum | Duplicates `subtype`; would touch `packages/app-shared/src/data/customData.type.ts` + bridge layer in `QuestionInput`; guaranteed future consolidation work. CONTEXT D-01. |
| Programmatic regex | HTML5 `<input type="email">` + `validity.typeMismatch` | "foo@bar" passes HTML5 spec (too lax for VAA); cross-UA quirks. CONTEXT D-05. |
| Pragmatic regex | RFC 5321/5322 spec regex | Maintenance cost for marginal correctness gain. CONTEXT D-06. |
| Sort-21 in-place retrofit | New sort-23 (URL) + sort-24 (email) leaving sort-21 unchanged | Leaves the social-link field still NOT exercising URL dispatch — perpetuates the Phase 76 PRODUCT-GAP-PARTIAL state the todo explicitly flags. CONTEXT D-07. |

**Installation:** No new packages. The change is entirely internal to OpenVAA's frontend + dev-seed.

**Version verification:** Not applicable — no external libraries touched. Internal-only changes.

## Architecture Patterns

### System Architecture Diagram

```
                                    PHASE 81 DATA FLOW
                                    ══════════════════

[1. SEED]
  packages/dev-seed/src/templates/e2e.ts (fixture authoring)
    │  questions.fixed[]:
    │    sort-21 social-link  +subtype:'link'  (retrofit)
    │    sort-23 email-1      +subtype:'email' (NEW)
    │  candidates[0].answersByExternalId:
    │    +'test-question-email-1': { value: { en: 'sentinel-81@example.com' } }
    ▼
  dev-seed pipeline (writer.ts → supabaseAdminClient.bulkImport)
    │  POST RPC bulk_import(payload)
    ▼
  Supabase `bulk_import` PL/pgSQL function (schema/501-bulk-operations.sql:128-207)
    │  iterates jsonb_each(p_item); skip_columns = {id,created_at,updated_at,project_id,entity_type}
    │  `subtype` flows through generic INSERT branch (line 168-189)
    ▼
  questions.subtype = 'link' / 'email'   (DB column verified: text | null, no CHECK)

[2. READ + RENDER]
  apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:521-546
    │  .from('questions').select('*') → row.subtype passes through toDataObject()
    ▼
  toDataObject → mapRow (utils/mapRow.ts)
    │  Unmapped snake_case columns flow through unchanged (subtype is identical snake↔camel)
    ▼
  @openvaa/data → Question instance with `.subtype` getter (dataObject.ts:96-98)
    │  returns this.data.subtype ?? ''
    ▼
  apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:279
    │  <QuestionInput {question} ... onShadedBg />  (no disableMultilingual)
    ▼
  QuestionInput.svelte:63-75   $derived.by<InputProps['type']>
    │  let t = INPUT_TYPES[question.type];                      // 'text'
    │  if (subtype === 'link') t = 'url';                        // existing dispatch
    │  if (subtype === 'email') t = 'email';                     // NEW dispatch (Phase 81)
    │  longText block: only remaps 'text'/'textarea' → falls through
    │  !disableMultilingual block: only remaps 'text'/'textarea' → falls through
    ▼
  Input.svelte
    │  ensureValue() now lists 'email' in empty-string-default branch (line 166 +1 word)
    ▼
  Render branch at lines 569-624 (the {:else} fallback group)
    │  <input {type} id={id} ...>      → DOM emits <input type="email">  (or "url")
    │
    │  *** NOTE: D-05 paragraph claims DOM type stays "text"; research confirms it's bound from prop. ***

[3. USER TYPES BAD VALUE]
  Native onchange event → handleChange(currentTarget) at Input.svelte:233-303
    │
    │  type === 'email' branch (NEW — Phase 81 mirrors URL at lines 286-296):
    │    currentValue = currentTarget.value.trim()
    │    if (empty) value = ''
    │    else if (!EMAIL_REGEX.test(currentValue)) return handleError('components.input.error.invalidEmail')
    │                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    │                                              VALUE-PRESERVATION CONTRACT: return BEFORE value=assignment
    │    else value = currentValue
    ▼
  handleError(key) at Input.svelte:318-320
    │  error = t(key)
    ▼
  Reactive {#if error} block at Input.svelte:628-630
    │  <ErrorMessage inline message={error} class="my-sm text-center" />
    ▼
  Playwright spec asserts:
    (a) getByText(/email address is not valid/i).toBeVisible()
    (b) input.toHaveValue('not-an-email')   ← preserved because handleChange returned early
```

### Recommended Project Structure

No new directories. Phase 81 modifies 6 existing files + 2 fixtures + 1 spec:

```
apps/frontend/
├── src/
│   ├── lib/
│   │   ├── components/input/
│   │   │   ├── Input.svelte          # +1 branch in handleChange, +1 word in ensureValue, +1 const (or import)
│   │   │   ├── Input.type.ts         # +1 variant in InputProps union
│   │   │   └── QuestionInput.svelte  # +1 dispatch line
│   │   ├── i18n/translations/{en,fi,sv,da}/
│   │   │   └── components.json        # +1 key per locale (4 files; drives TranslationKey type)
│   │   ├── types/generated/
│   │   │   └── translationKey.ts      # +1 union member (auto-generated; re-run generator OR manual)
│   │   └── utils/
│   │       └── email.ts               # OPTIONAL — extracted EMAIL_REGEX + checkEmail() per D-06 Discretion
│   └── ...
└── messages/{en,fi,sv,da,et,fr,lb}/
    └── components.json                # +1 key per locale (7 files; Paraglide source)

packages/dev-seed/src/templates/
└── e2e.ts                              # retrofit sort-21 + new sort-23 + Alpha answer cell + comment

tests/tests/specs/candidate/
└── candidate-profile-validation.spec.ts  # +2 TEXT_CELLS + kind discriminant + loop refactor
```

### Pattern 1: `Question.subtype` dispatch (canonical for Phase 81)

**What:** Convention-by-string-value dispatch on a typed-text DB column.

**When to use:** Single-cardinality dispatch decisions where the question type alone (`QUESTION_TYPE.Text`) is insufficient to select the input behavior, and a new question variant class is overkill.

**Example** (already-existing, Phase 81 extends):
```svelte
// Source: apps/frontend/src/lib/components/input/QuestionInput.svelte:63-75
const type = $derived.by<InputProps['type']>(() => {
  let t = INPUT_TYPES[question.type];
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
  // Phase 81 — NEW dispatch line:
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';
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

**Why order matters:** Both subtype dispatches happen BEFORE the longText + !disableMultilingual remap blocks. Those blocks only remap `'text'` / `'textarea'` / `'text-multilingual'` / `'textarea-multilingual'`. The dispatched `'url'` and `'email'` types fall through unchanged. [VERIFIED: read of QuestionInput.svelte:63-75.]

### Pattern 2: `handleChange` validation branch (canonical for Phase 81)

**What:** Type-discriminated validation branch inside the centralized `handleChange` event handler with a value-preservation contract.

**Example** (existing URL branch — Phase 81 mirrors byte-for-byte):
```svelte
// Source: apps/frontend/src/lib/components/input/Input.svelte:286-296
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
}
```

**Phase 81 email branch** (NEW — D-05 / specifics block):
```svelte
} else if (type === 'email') {
  const currentValue = currentTarget.value.trim();
  if (currentValue === '') {
    value = '';
  } else {
    if (!EMAIL_REGEX.test(currentValue)) return handleError('components.input.error.invalidEmail');
    value = currentValue;
  }
}
```

**Contract:** The `return` before `value =` is the **value-preservation contract** — `handleChange` exits early so the bindable `value` prop is never reassigned to the bad input. Playwright observes the bad value as still-typed in the DOM. Same shape as the URL branch's `return handleError(...)` at line 293.

**Subtle difference from URL branch:** URL uses `.replaceAll(/\s+/g, '')` (strip all whitespace internally — URLs cannot legitimately contain whitespace); email uses `.trim()` (strip leading/trailing only — email locals theoretically can't contain whitespace, but interior whitespace is invalid). Both are defensible UX choices; the email regex `[^\s@]+@[^\s@]+\.[^\s@]+` will reject any interior whitespace so `.trim()` is functionally sufficient.

### Pattern 3: i18n key addition with TranslationKey type-safety

**What:** Adding a new translation key requires touching BOTH the Paraglide message catalogs AND the legacy translations dir (for `TranslationKey` type generation).

**Example:**
```json
// 1. Paraglide messages (drives runtime translation) — 7 locales
// apps/frontend/messages/en/components.json
"components": { "input": { "error": {
  "invalidEmail": "The email address is not valid.",
  ...
}}}

// 2. Legacy translations (drives TranslationKey union type) — 4 locales
// apps/frontend/src/lib/i18n/translations/en/components.json
"input": { "error": {
  "invalidEmail": "The email address is not valid.",
  ...
}}

// 3. Auto-generated type (run generator) — 1 union member added
// apps/frontend/src/lib/types/generated/translationKey.ts:373
| 'components.input.error.invalidEmail'
```

**Sequence-of-edits matters:** If the spec is written FIRST (`expect(...).toBeVisible({...})` doesn't care about TranslationKey), it'll compile. But the `Input.svelte` call to `handleError('components.input.error.invalidEmail')` will fail TS compile because `TranslationKey` doesn't include the new key. Resolution: either (a) add the key to all 4 legacy translation files + re-run the generator BEFORE editing `Input.svelte`, OR (b) edit `Input.svelte` AND immediately regenerate the type. Skipping the generator (just-editing the JSON) leaves the type stale and the build fails.

### Anti-Patterns to Avoid

- **Don't add `'email'` to `INPUT_TYPES` map at QuestionInput.svelte:40-49** — that map is `Record<QuestionType, InputProps['type']>` indexed by `QUESTION_TYPE.Text/Number/Boolean/...`. There's no `QUESTION_TYPE.Email`; the dispatch is on `subtype`, not `type`. CONTEXT D-04 explicitly clarifies this.
- **Don't introduce a `format: 'email' | 'url' | 'tel'` enum on `CustomData.Question`** — REJECTED by CONTEXT D-01 (duplicates `subtype`).
- **Don't use HTML5 `<input type="email"> + validity.typeMismatch`** — REJECTED by CONTEXT D-05 (too lax, cross-UA inconsistent). Programmatic regex is the contract.
- **Don't extract the regex to `links.ts`** — its name is URL-scoped per current convention. CONTEXT D-06 mentions this; sibling util (`email.ts`) is cleaner if extracted at all.
- **Don't add an `<input type="email">` DOM attribute override to `Input.svelte`** — the current fall-through render at line 602 `<input {type} ...>` already emits `type="email"` because the dispatched prop binds to the attribute. If "preserve text DOM shape" is a hard requirement (per D-05 paragraph), the planner must explicitly add an override; otherwise accept the actual rendered DOM. See Open Question O-1.
- **Don't write a migration for `questions.subtype` CHECK constraint** — no migration needed; column is already `text | null` unconstrained.
- **Don't pre-validate the seed Alpha email at template-author time** — CONTEXT D-08 notes the seed pipeline doesn't run `handleChange` against pre-seeded answers. Validation runs only on user input via `Input.svelte handleChange`. The sentinel `'sentinel-81@example.com'` is a valid email and the URL `'https://example.com/sentinel-76'` is a valid URL; both happen to pass the new regex but the seed doesn't actually exercise it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL validation | Custom URL parser | Existing `checkUrl` from `apps/frontend/src/lib/utils/links.ts:18-41` | Already-canonical; uses native `URL` constructor + protocol/domain checks; already covers `subtype === 'link'` at QuestionInput dispatch |
| Email translation message lookup | Custom error registry | Existing `handleError(key)` at `Input.svelte:318-320` | Already drives every `components.input.error.*` key via the `t` callable; new `invalidEmail` plugs in identically |
| Localized input rendering | Custom multilingual input | Existing `text-multilingual` / `textarea-multilingual` branches at `Input.svelte:380-435` | Already production-correct; Phase 81's `'email'` dispatch INTENTIONALLY falls through these branches (single-locale URL/email per CONTEXT D-04) |
| Question schema field | New JSONB customData enum | Existing `Question.subtype` DB column | Production-wired today via `'link'` / `'linkList'` ; reuse-as-is per CONTEXT D-01 |
| Test login flow | Custom auth helper | Existing module-level `loginAsCandidate(page)` at `candidate-profile-validation.spec.ts:67-74` | Already hoisted + reusable; Phase 76 P01 cells 1-3 use it; cells 5-6 reuse |
| Test field locator | `getByTestId` + new testId | Existing `getByLabel(/regex/i)` pattern at `candidate-profile-validation.spec.ts:229` | Phase 76 P01 cell-3 precedent; D-19 reaffirms — NO new testIds expected |
| dev-seed `subtype` writer | New writer-side passthrough code | bulk_import RPC generic-column branch at `schema/501-bulk-operations.sql:168-189` | RPC iterates every key in `jsonb_each(p_item)` and writes to the matching DB column generically; `subtype` is not in `skip_columns`; ZERO dev-seed code change needed [VERIFIED by reading the SQL function] |

**Key insight:** Phase 81 is a textbook "reuse, don't rebuild" change. The only NEW assets are: 1 regex constant (`EMAIL_REGEX`), 1 dispatch line, 1 `handleChange` branch, 1 i18n key (multiplied across locales + type generator), 2 fixture rows, and 2 test cells. Every other surface (subtype field, bulk_import, dataProvider, dispatch order, value-preservation contract, locator pattern, login helper) is already production-correct and Phase 81 just plugs into it.

## Runtime State Inventory

> Phase 81 is structurally additive (new dispatch line + new validation branch + new fixture rows + new i18n key + new spec cells). No rename / migration / refactor surface. The "runtime state" question is whether existing DB rows / persisted answers will continue rendering correctly post-Phase-81. The answer is yes for new cells (they fill fresh) and yes with a soft regression for the retrofit sort-21 (pre-seeded LocalizedString answer renders as empty in the new url-typed input — see Pitfall 4).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (DB) | `questions.subtype` column exists today (`text \| null`, no CHECK). Existing rows have `subtype = NULL`. Phase 81 writes `'link'` to sort-21 (retrofit) + `'email'` to NEW sort-23 (insert). | dev-seed-only — pipeline rewrites both rows via `yarn db:seed --template e2e` on the canonical reset chain. No data migration on a live DB (only e2e fixture is touched). |
| Stored data (candidates.answers JSONB) | Alpha's existing answer `'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } }` is a **LocalizedString**. After Phase 81 retrofit makes sort-21 render as single-locale URL input, `QuestionInput.svelte:107-109` calls `question.ensureValue(LocalizedString)` → `TextQuestion._ensureValue → ensureString` returns `MISSING_VALUE` because LocalizedString isn't a `typeof === 'string'`. **The input renders empty initial value for the seeded LocalizedString answer.** | Planner-decision: (a) migrate Alpha's seed to plain string `'test-question-social-1': { value: 'https://example.com/sentinel-76' }` (cleanest; no schema change; aligns the cell's rendered shape with its new dispatch), OR (b) accept that pre-seeded multilingual answers don't render until user re-saves (acceptable for the Phase 81 cells 5/6 which fill FRESH; would mean Phase 76 P02 reload-persistence spec still works because it fills+saves+reloads, not load-from-seed-then-assert). See Pitfall 4. |
| Live service config | None — Phase 81 doesn't touch n8n / Datadog / Tailscale / Cloudflare / etc. | None. |
| OS-registered state | None — no Windows Task Scheduler / pm2 / launchd / systemd references in this surface. | None. |
| Secrets / env vars | None — no `.env` references touched. | None. |
| Build artifacts / installed packages | The auto-generated `apps/frontend/src/lib/types/generated/translationKey.ts` must be regenerated after adding `invalidEmail` to the 4 legacy translation files. Either re-run `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` OR manually add the line. | Run the generator (preferred): adds `\| 'components.input.error.invalidEmail'` to the union. Verified at scout: file currently has 'components.input.error.invalidUrl' at line 374 — `invalidEmail` adjacency confirmed. |

**Canonical question — "After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?":** Two: (1) the previous-build cached `.svelte-kit/` Vite cache (mitigated by `yarn dev:clean` as part of the canonical reset chain per CONTEXT D-13); (2) any LocalizedString answers seeded for retrofitted-subtype questions (see row 2 above; Phase 81 D-07 explicitly notes Alpha's existing answer "remains valid" but doesn't address the LocalizedString-vs-plain-string render-shape mismatch).

## Common Pitfalls

### Pitfall 1: i18n key MUST land in BOTH source paths (Paraglide + legacy translations)

**What goes wrong:** Planner reads CONTEXT D-10 literally — "add to all 4 locales (en/fi/sv/da `messages/*/components.json`)" — and adds the key ONLY to `apps/frontend/messages/{en,fi,sv,da}/components.json`. Build fails OR runtime silently falls back to the key string `"components.input.error.invalidEmail"` for two reasons:

1. **TypeScript compile fails on `handleError('components.input.error.invalidEmail')`** because `TranslationKey` union doesn't include the new key. The type is auto-generated from `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json` (NOT `messages/`) per `apps/frontend/tools/translationKey/generateTranslationKeyType.ts:10` (`const dirPath = path.join('src', 'lib', 'i18n', 'translations');`).
2. **Paraglide doesn't see the key in locales et/fr/lb** because `project.inlang/settings.json` lists 7 locales (`["en", "fi", "sv", "da", "et", "fr", "lb"]`). Adding to only en/fi/sv/da leaves et/fr/lb without a translation; the Paraglide wrapper falls back to the key string at `wrapper.ts:38-39` (`Key not found -- return key as fallback`).

**Why it happens:** CONTEXT D-10 doesn't distinguish the two locations because the writer assumed the `messages/*/components.json` path is the only i18n source. The legacy `src/lib/i18n/translations/` directory exists for compile-time type generation only (per Phase 78 / CLEAN-04 i18n wrapper tightening). It's easy to miss.

**How to avoid:**
1. Add `invalidEmail` to **all 7** `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` (Paraglide source).
2. Add `invalidEmail` to **all 4** `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/components.json` (TranslationKey type source).
3. Re-run `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` (or `npm run` equivalent) to regenerate `apps/frontend/src/lib/types/generated/translationKey.ts`.
4. Verify the generated type contains `\| 'components.input.error.invalidEmail'` between `'components.input.error.invalidFile'` and `'components.input.error.invalidUrl'`.

**Warning signs:** TypeScript error pointing at `handleError('components.input.error.invalidEmail')` in `Input.svelte` (line will be the new branch). Runtime test failure where the error UI renders literal text `components.input.error.invalidEmail` instead of the localized string. Production E2E in et/fr/lb locales falling back to the key.

### Pitfall 2: TranslationKey generator script must be invoked after JSON edits

**What goes wrong:** Planner edits all 11 JSON files (7 Paraglide + 4 legacy) but forgets the type generator. TypeScript compile fails on `handleError('components.input.error.invalidEmail')`.

**Why it happens:** The TranslationKey type is auto-generated and the file is checked into git. There's no automatic pre-commit hook or build-step trigger documented to run the generator. The script is `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` — invoke explicitly.

**How to avoid:** As part of Plan 01 task ordering, run the generator (or manually add the union member) IMMEDIATELY AFTER editing the 4 legacy JSON files. Best ordering:
1. Edit 4 legacy JSON files (en/fi/sv/da `src/lib/i18n/translations/`)
2. Run generator → regenerated `translationKey.ts` includes new key
3. Edit `Input.svelte` to call `handleError('components.input.error.invalidEmail')` — compiles
4. Edit 7 Paraglide JSON files (en/fi/sv/da/et/fr/lb `messages/`) → runtime lookups now succeed in all locales

**Warning signs:** Compile error in CI; `yarn lint:check` passes but `yarn build` fails; the `translationKey.ts` git diff shows no new union member.

### Pitfall 3: DOM `type` attribute is bound from the dispatched prop, contradicting D-05 paragraph

**What goes wrong:** CONTEXT D-05 (the URL/programmatic regex REJECTED section) asserts: *"the dispatched `'email'` type only drives the validation branch, not the DOM `type` attribute."* Research VERIFIES this is **false** for the existing tree.

**Verification:** `Input.svelte` render branch at lines 569-624 includes the fallback `<input {type} ... onchange={handleChange} />` at line 602-609. The `{type}` syntax binds the Svelte prop `type` directly to the DOM attribute. So:
- A dispatched `type='url'` → DOM emits `<input type="url">` (verifiable today on sort-21 if subtype='link' were set)
- A dispatched `type='email'` → DOM emits `<input type="email">`

**Why it happens:** The CONTEXT D-05 paragraph was written under the assumption that only the validation branch in `handleChange` changes — but the prop ALSO drives the DOM render. The two are coupled by design (since `Input.svelte` is a multi-type component that maps each type to both validation AND render).

**How to avoid:** Three options for the planner:
1. **Accept the actual rendered DOM type** (recommended) — `<input type="email">` is semantically correct and improves mobile UX (email keyboard surfaces). The Playwright spec's `getByLabel(...).fill('not-an-email')` works against any input type.
2. **Explicitly override via `restProps`** — pass `type="text"` through `restProps` so the rendered DOM stays `<input type="text">`. Adds complexity; conflicts with the existing `Input.svelte` type-discrimination contract.
3. **Update CONTEXT D-05 + the docstring on `InputProps.type`** to acknowledge that the DOM type IS bound from the prop (matches today's URL behavior).

The CONTEXT D-05 REJECTED rationale about HTML5 `validity.typeMismatch` cross-UA quirks **still holds** — the programmatic regex remains the authority. The DOM `type="email"` just provides better mobile keyboard UX as a side effect.

**Warning signs:** Manual QA on mobile shows email keyboard appearing — confirms the actual DOM shape. Plan-checker may flag the discrepancy between CONTEXT and rendered output if not addressed up front.

### Pitfall 4: Sort-21 retrofit changes seed Alpha answer render-shape (LocalizedString → empty)

**What goes wrong:** Alpha's existing seed `'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } }` at `e2e.ts:767` is a `LocalizedString` (`{ en: '...' }`). Pre-Phase-81, sort-21 has no subtype → `QuestionInput.svelte` dispatches `t = 'text-multilingual'` → at line 106-107 the multilingual path passes the LocalizedString through unchanged → input renders the en-locale value. **Post-Phase-81**, sort-21 has `subtype: 'link'` → dispatch sets `t = 'url'` → at line 108-109 the non-multilingual path calls `question.ensureValue(value)` → `TextQuestion._ensureValue → ensureString({ en: '...' })` → returns `MISSING_VALUE` (because the LocalizedString isn't `typeof === 'string'`) → input renders empty.

**Verification:**
- `ensureString` impl at `packages/data/src/utils/ensureValue.ts:12-14`: `return typeof value === 'string' ? value : typeof value === 'number' ? \`${value}\` : MISSING_VALUE;`
- Dispatch at `QuestionInput.svelte:106-110`:
  ```
  if (type.endsWith('-multilingual')) {
    value = isLocalizedString(value) || typeof value === 'string' ? value : undefined;
  } else {
    value = question.ensureValue(value);   // ← Phase 81 hits this branch for url + email
  }
  ```

**Impact on existing tests:**
- **Phase 76 P02 reload-persistence spec** at `candidate-profile.spec.ts:284-309` — currently passes (it fills `NEW_SOCIAL = 'https://github.com/openvaa/sentinel-76-p02'` FRESH; this is a plain string; ensureString accepts; reload renders correctly). Post-Phase-81, the user-saved value is also a plain string, so the round-trip still works. **Soft regression**: the page-load-from-seed initial state shows EMPTY input, but the test doesn't assert pre-fill state. **Likely passes**, but flag for planner verification.
- **Phase 81 cell 6 (URL-format rejection)** at the new candidate-profile-validation.spec.ts entry — fills FRESH (`'not a url'`); no dependence on seed initial state.

**Impact on Alpha's user-facing profile:** If a human logs in as Alpha via the candidate app post-Phase-81, the social-link input field appears empty (because the LocalizedString seed renders as MISSING_VALUE) until they re-save. **Minor data-shape regression**; not a blocker but worth surfacing.

**How to avoid (planner picks one):**
- **(a) Migrate Alpha's seed at e2e.ts:767** — change `{ value: { en: 'https://example.com/sentinel-76' } }` to `{ value: 'https://example.com/sentinel-76' }`. Lossless (Alpha only has English locale in the e2e template per `generateTranslationsForAllLocales: false` per CONTEXT scout). Aligned with the new single-locale URL render contract. Recommended.
- **(b) Document the soft regression** — note in CONTEXT D-07 (or a Phase 81 PLAN.md task comment) that Alpha's pre-seeded answer renders empty until re-save, and rely on the Phase 76 P02 spec passing because it fills fresh. Cheaper change set; latent surprise for human QA.
- **(c) Patch dataProvider to detect LocalizedString → unwrap to single locale when target type is url/email** — overengineered for v2.10.

**Recommendation:** Plan 01 includes a 1-line edit at `e2e.ts:767` migrating to plain string (option a). Same edit benefits the new sort-23 email row author (CONTEXT D-08 already specifies the new Alpha answer as `{ en: 'sentinel-81@example.com' }` LocalizedString — same problem; should also be plain string).

**Warning signs:** Manual QA test of Alpha login → profile page → social-link input shows empty value. `yarn test:e2e --project=candidate-app-mutation -g "should persist social link"` passes, but a debug-mode pause shows the pre-fill input empty.

### Pitfall 5: Multilingual translations bypass via `disableMultilingual` is NOT set at the candidate profile route

**What goes wrong:** Some planners might assume the candidate profile editable info questions render as single-locale (because the social-link / email-format cells "feel" single-locale). The actual code at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:279` does NOT pass `disableMultilingual`:

```svelte
<QuestionInput {question} {answer} onChange={handleQuestionInputChange} locked={candCtx.answersLocked} onShadedBg />
```

This means: by default for a text-typed question without a subtype, the input renders multilingual. The CONTEXT D-04 dispatch — `subtype === 'link' → t = 'url'` — overrides BEFORE the `!disableMultilingual` block (line 70-73) which only remaps `'text'` / `'textarea'`. So `'url'` and `'email'` correctly fall through as **single-locale** inputs. This is the intentional behavior.

**Why it can go wrong:** If a planner adds the email dispatch in the WRONG position (e.g., AFTER the multilingual remap block, or inside the `if (!disableMultilingual)` branch), the dispatch may be silently overridden OR the `'email'` may try to fall into the multilingual `text-multilingual` render branch which doesn't exist.

**How to avoid:** Place the new email dispatch line IMMEDIATELY AFTER the existing `'link' → 'url'` line at `QuestionInput.svelte:65`, NOT after the longText / multilingual blocks. CONTEXT D-04 specifies this exact position.

**Verification:** The existing 'link' dispatch is on line 65 BEFORE both subsequent remap blocks. The new line goes immediately after. Both `'url'` and `'email'` survive the `!disableMultilingual` block at lines 70-73 because that block only checks for `'text'` and `'textarea'` (not `'url'` / `'email'`).

### Pitfall 6: `getByLabel(/regex/i).first()` selector may match multiple inputs if question name is ambiguous

**What goes wrong:** The Phase 76 P01 cell-3 spec uses `page.getByLabel(/Display name \(Phase 76 anchor\)/i).first()` (line 229) — note the `.first()` suffix. The reason: for a text-multilingual question, the input MAY render multiple aria-labelled inputs (one per locale, shown when translations are expanded). The new Phase 81 cells 5/6 dispatch to single-locale (`url` / `email`) so only ONE input renders — `.first()` is technically unnecessary but harmless. The spec MUST still use `getByLabel(...)` (not `getByPlaceholder` or `getByTestId`) per D-19.

**Verification:** Sort-21 retrofit makes the social-link a single-locale `<input type="url">`. There's exactly one `aria-labelledby` matching `/Social link \(Phase 76 anchor\)/i`. `.first()` is defensive but not strictly required.

**How to avoid:** Mirror cell-3 byte-for-byte — use `.first()` for safety. CONTEXT D-11 specifies the locator regex shape (e.g., `/Email address \(Phase 81 A11Y-05 anchor\)/i`).

**Warning signs:** Playwright strict-mode error "strict mode violation: locator resolved to N elements" if `.first()` is omitted AND the input dispatched multilingual. Not expected for Phase 81 (single-locale dispatch confirmed).

### Pitfall 7: Spec test-title ordering may bump IMGPROXY_TIED_TITLES collision risk if the planner appends ad-hoc

**What goes wrong:** Planner adds the 2 new test titles but inadvertently writes one whose last 5 words end with a phrase like `should upload a profile image` — colliding with the IMGPROXY_TIED_TITLES list at `regen-constants.mjs:67-82`.

**Verification:** CONTEXT D-12 explicitly states the proposed titles `A11Y-05 email-format rejection surfaces invalidEmail error` and `A11Y-06 url-format rejection surfaces invalidUrl error` are clean. Verified against the 14-entry list — no overlap.

**How to avoid:** Plan-checker / planner re-verifies at PLAN.md authoring time. The check: `IMGPROXY_TIED_TITLES.some(t => testTitle.endsWith('> ' + t))` must be `false` for both new titles. The 14 patterns all end with image/profile/maintenance phrases that don't match Phase 81's titles.

### Pitfall 8: 3-run cold-start gate must use the canonical 3-command chain, NOT the `db:reset-with-data` alias

**What goes wrong:** Planner writes the verification gate as `yarn db:reset-with-data && yarn test:e2e --workers=1` — assuming the deprecated `db:reset-with-data` chains everything including vite-cache wipe. It does (`db:reset && db:seed --template default && dev:clean` per CLAUDE.md), but it uses `--template default`, NOT `--template e2e`. The candidate-app-mutation tests rely on the e2e template fixtures.

**Verification:** CLAUDE.md §"Seeding local data" specifies `yarn db:reset-with-data` as a default-template recipe. Phase 81's verification uses the e2e template. Per CONTEXT D-13, the canonical 3-command chain is:
```bash
yarn db:reset && yarn db:seed --template e2e && yarn dev:clean
```

**How to avoid:** Plan 01 verification gate task documents the canonical 3-command chain. The `yarn arg-forwarding caveat` in CLAUDE.md (about `--likert-only` not flowing through `&&`-chained yarn scripts) does NOT apply here — the chain is 3 separate yarn calls.

## Code Examples

Verified patterns from official OpenVAA codebase sources:

### Existing URL validation branch (Phase 81 template — DO NOT MODIFY; mirror it)

```svelte
<!-- Source: apps/frontend/src/lib/components/input/Input.svelte:286-296 -->
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

### Phase 81 NEW email validation branch (insert before the fallback `else`)

```svelte
<!-- Insert IMMEDIATELY BEFORE the `} else {` at Input.svelte:297-300 -->
} else if (type === 'email') {
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

### Phase 81 dispatch line (insert at QuestionInput.svelte:65 immediately after existing 'link' line)

```svelte
<!-- Source: apps/frontend/src/lib/components/input/QuestionInput.svelte:63-75 (ADD line 66) -->
const type = $derived.by<InputProps['type']>(() => {
  let t = INPUT_TYPES[question.type];
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';  // ← NEW
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

### Phase 81 InputProps['type'] discriminated union extension

```typescript
// Source: apps/frontend/src/lib/components/input/Input.type.ts:5-38 (ADD between url and text-multilingual)
export type InputProps =
  | ({ type: 'text';     } & InputPropsBase<string>)
  | ({ type: 'url';      } & InputPropsBase<string>)
  | ({ type: 'email';    } & InputPropsBase<string>)         // ← NEW (Phase 81)
  | ({ type: 'text-multilingual'; } & InputPropsBase<LocalizedString>)
  | ({ type: 'textarea'; } & InputPropsBase<string, 'textarea'>)
  | ({ type: 'textarea-multilingual'; } & InputPropsBase<LocalizedString, 'textarea'>)
  | ({ type: 'number';   } & InputPropsBase<number>)
  | ({ type: 'date';     } & InputPropsBase<string>)
  | ({ type: 'boolean';  } & InputPropsBase<boolean>)
  | ({ type: 'image';    } & InputPropsBase<Image>)
  | ({ type: 'select';   } & InputPropsBase<Id, 'select'>)
  | ({ type: 'select-multiple'; } & InputPropsBase<Array<Id>, 'select'>);
```

### Phase 81 ensureValue empty-string branch extension

```svelte
<!-- Source: apps/frontend/src/lib/components/input/Input.svelte:166 (ADD `|| type === 'email'`) -->
function ensureValue(): void {
  // Empty string values
  if (type === 'text' || type === 'textarea' || type === 'url' || type === 'email') {  // ← +1 clause
    value ??= '';
  }
  // ...rest unchanged
}
```

### Phase 81 i18n key (English Paraglide locale; mirror in fi/sv/da/et/fr/lb + legacy 4 locales)

```json
// apps/frontend/messages/en/components.json — add inside input.error block at line ~19
{
  "components": {
    "input": {
      "error": {
        "fileLoadingError": "Failed to load the file.",
        "invalidEmail": "The email address is not valid.",     // ← NEW (Phase 81)
        "invalidFile": "The file is invalid.",
        "invalidUrl": "The URL is not valid.",
        "oversizeFile": "The file is too large. The maximum size is {maxFilesize} MB."
      }
    }
  }
}
```

### Phase 81 e2e fixture extension

```typescript
// Source: packages/dev-seed/src/templates/e2e.ts:621-630 (RETROFIT — add subtype:'link' field)
{
  external_id: 'test-question-social-1',
  type: 'text',
  subtype: 'link',                              // ← NEW (Phase 81)
  name: { en: 'Social link (Phase 76 anchor)' },
  category: { external_id: 'test-category-info' },
  allow_open: false,
  required: false,
  sort_order: 21,
  is_generated: false
},

// NEW row after sort-22 (Phase 77's test-question-number-1)
// VALUE-DISJOINTNESS: 'sentinel-81@example.com' has no 'alpha' substring per e2e.ts:753-762 invariant.
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

// Alpha answer addition at e2e.ts:773 (after test-question-number-1 cell)
// Phase 81 recommendation: PLAIN STRING (NOT LocalizedString) — see Pitfall 4
'test-question-email-1': { value: 'sentinel-81@example.com' },

// Phase 81 ALSO RECOMMENDED: migrate sort-21 Alpha cell at e2e.ts:767 to plain string
// (was: { value: { en: 'https://example.com/sentinel-76' } } → now { value: 'https://example.com/sentinel-76' })
```

### Phase 81 spec extension shape

```typescript
// Source: tests/tests/specs/candidate/candidate-profile-validation.spec.ts:112-119 (REPLACE TEXT_CELLS)
const TEXT_CELLS = [
  {
    name: 'name-too-long caps input value at maxlength=50 on display-name',
    kind: 'maxlength' as const,
    fieldLabel: /Display name \(Phase 76 anchor\)/i,
    maxlength: 50,
    overflow: 60
  },
  {
    // NEW — Phase 81 cell 5
    name: 'A11Y-05 email-format rejection surfaces invalidEmail error',
    kind: 'format' as const,
    fieldLabel: /Email address \(Phase 81 A11Y-05 anchor\)/i,
    badValue: 'not-an-email',
    expectedErrorText: /The email address is not valid/i
  },
  {
    // NEW — Phase 81 cell 6
    name: 'A11Y-06 url-format rejection surfaces invalidUrl error',
    kind: 'format' as const,
    fieldLabel: /Social link \(Phase 76 anchor\)/i,
    badValue: 'not a url',
    expectedErrorText: /The URL is not valid/i
  }
] as const;

// Refactor the existing loop at lines 213-247 to branch by `kind`
for (const cell of TEXT_CELLS) {
  test(`A11Y-01 ${cell.name}`, async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));
    await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({ timeout: 10000 });
    const input = page.getByLabel(cell.fieldLabel).first();
    await expect(input).toBeVisible({ timeout: 5000 });
    if (cell.kind === 'maxlength') {
      const overflow = 'x'.repeat(cell.maxlength + cell.overflow);
      await input.fill(overflow);
      await expect(input).toHaveValue('x'.repeat(cell.maxlength));
      const observed = await input.inputValue();
      expect(observed).toHaveLength(cell.maxlength);
      expect(observed.startsWith('x')).toBe(true);
    } else {
      // kind === 'format' (email or url)
      await input.fill(cell.badValue);
      await expect(page.getByText(cell.expectedErrorText)).toBeVisible({ timeout: 5000 });
      await expect(input).toHaveValue(cell.badValue);  // value-preservation contract
    }
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `customData.format: 'email' \| 'url'` enum (per REQUIREMENTS.md text + Phase 76 todo Cell 5 scope #1) | `Question.subtype === 'email' \| 'link'` convention | Phase 81 / CONTEXT.md D-01 | REQUIREMENTS.md text becomes stale for A11Y-05 dispatch mechanism — RESEARCH §"Phase Requirements" footnotes the CONTEXT D-01 supersession |
| HTML5 `<input type="email">` validity API | Programmatic regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | Phase 81 / CONTEXT.md D-05/D-06 | UX: same in-browser; programmatic check is stricter and cross-UA consistent |
| Sort-21 `test-question-social-1` with `text-multilingual` render (no URL validation) | Sort-21 retrofitted with `subtype: 'link'` → single-locale `<input type="url">` + URL validation | Phase 81 / CONTEXT.md D-07 | Closes Phase 76 PRODUCT-GAP-PARTIAL; Pitfall 4 surfaces the LocalizedString-to-string seed cell migration recommendation |
| 3 cells in `candidate-profile-validation.spec.ts` (image-type, image-size, name-too-long) | 5 cells (+ email-format + url-format) under the same `A11Y-01` describe | Phase 81 / CONTEXT.md D-11 | Determinism contract +2 PASS_LOCKED entries expected; parity script may need additive constants regen |

**Deprecated / outdated:**
- `Question.subtype` "field is commented out on every `Question*.type.ts`" claim in the Phase 76 todo (2026-05-12-a11y-01-product-gap-cells.md, lines 28-37). [VERIFIED: this is incorrect — `subtype` lives on the `DataObject` base class via the `subtype?: string | null` field in `dataObject.type.ts:37` and the getter at `dataObject.ts:96-98`. The Question variants don't OVERRIDE `subtype` because the base implementation suffices. The "commented out" lines in `Question*.type.ts` files are just inherited-field documentation reminders.]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `apps/frontend/src/lib/i18n/translations/` directory is the source for TranslationKey type generation; `apps/frontend/messages/` is the Paraglide source | Pitfall 1, Pattern 3 | LOW — verified by reading `apps/frontend/tools/translationKey/generateTranslationKeyType.ts:7-10` (`dirPath = src/lib/i18n/translations`); cross-checked vs Paraglide `project.inlang/settings.json` pathPattern. CITED. |
| A2 | DOM `type` attribute IS bound from the dispatched Svelte prop in the fall-through render branch | Pitfall 3 | LOW — verified by reading `Input.svelte:602` (`<input {type} ...>`); cross-checked vs Svelte 5 attribute-binding semantics. CITED. |
| A3 | `TextQuestion._ensureValue → ensureString` returns `MISSING_VALUE` for a LocalizedString input | Pitfall 4 | LOW — verified by reading `packages/data/src/utils/ensureValue.ts:12-14` (`return typeof value === 'string' ? value : ... : MISSING_VALUE`). CITED. |
| A4 | bulk_import RPC iterates `jsonb_each(p_item)` generically; `subtype` is not in `skip_columns`; flows through with no dev-seed code change | "Don't Hand-Roll" row 7 | LOW — verified by reading `apps/supabase/supabase/schema/501-bulk-operations.sql:108-189`. CITED. |
| A5 | Phase 76 P02 reload-persistence spec at `candidate-profile.spec.ts:284-309` passes post-Phase-81 because it fills a fresh URL (`https://github.com/openvaa/sentinel-76-p02`), not because the seed initial state survives | Pitfall 4 | LOW — verified by reading the spec end-to-end; the test does not assert pre-fill state. Risk MEDIUM if planner doesn't migrate the seed cell to plain string (option a in Pitfall 4): a passing test masks a soft regression for human QA. |
| A6 | The `validate_answer_value()` PL/pgSQL function does NOT reject a plain-string answer to a subtype='link' question (i.e., Pitfall 4 option a is safe) | Pitfall 4 | MEDIUM — `validate_answer_value()` source at `apps/supabase/supabase/migrations/00001_initial_schema.sql:168` was not read in detail this research pass. CITED note: lines 163-166 of the migration's preamble state "Text answers: value can be a plain string or a localized string object" — so plain string IS expected. ASSUMED that this preamble matches the implementation; planner verifies at PLAN.md time if Pitfall 4 option a is taken. |
| A7 | Phase 81's two new test titles do NOT collide with IMGPROXY_TIED_TITLES | Pitfall 7, D-12 | LOW — verified by reading `regen-constants.mjs:67-82` (14 entries; none end with "email-format rejection" or "url-format rejection"). CITED. |
| A8 | The candidate-app-mutation playwright project's `testMatch: /candidate-(registration\|profile\|profile-validation)\.spec\.ts/` already covers the modified spec | "Internal Module Touchpoints" | LOW — verified by reading `tests/playwright.config.ts:124`. CITED. |
| A9 | Test cell 6's bad URL `'not a url'` will fail `checkUrl` and trigger the existing invalidUrl error path | Pattern 2 | LOW — verified that `checkUrl('not a url')` walks both try/catch blocks: `new URL('not a url')` throws (no protocol); `new URL('http://not a url')` throws (whitespace in hostname is invalid). Returns undefined → triggers `handleError('components.input.error.invalidUrl')`. CITED via `links.ts:18-41`. |
| A10 | The cell 5 bad email `'not-an-email'` will fail the new EMAIL_REGEX | Pattern 2 | LOW — manually checked: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('not-an-email')` → false (no `@` separator). CITED. |
| A11 | Email translation defaults are reasonable for fi/sv/da/et/fr/lb (CONTEXT D-10 + Specifics block defaults are translation-correct) | Code Example for i18n | MEDIUM — Finnish "Sähköpostiosoite ei kelpaa." reads naturally per native conventions but is the writer's best guess. ASSUMED; planner may delegate to a translation pass. Phase 80's i18n D-05 added Finnish/Swedish/Danish strings via similar process. |

## Open Questions (RESOLVED)

### O-1 (RESOLVED): Should the planner accept the DOM `type="email"` attribute change, OR override to `type="text"`?
**Resolved:** ACCEPT DOM `type="email"` binding — mobile UX gain, matches URL precedent. Plan Task 4 implements without override.



- **What we know:** CONTEXT D-05 paragraph claims DOM shape is unchanged. Research verifies it IS changed (Pitfall 3): a dispatched `type='email'` emits `<input type="email">` because `Input.svelte:602` binds the prop to the attribute via `<input {type} ...>`. The same is true today for `type='url'` (dispatched on `subtype='link'`).
- **What's unclear:** Whether the CONTEXT.md author intended (a) "the dispatched prop is not the same name as the DOM attribute" (which is wrong) OR (b) "the visible UX shouldn't differ" (which is also wrong because mobile keyboards differ for `type="email"` vs `type="text"`).
- **Recommendation:** Plan 01 accepts the actual rendered DOM type — `<input type="email">` is semantically correct, improves mobile keyboard UX, and matches the existing `<input type="url">` precedent on subtype='link'. The CONTEXT D-05 paragraph's REJECTED rationale about HTML5 `validity.typeMismatch` cross-UA quirks still holds — programmatic regex remains the authority. Add a 1-line note to the PLAN.md task ("DOM type attribute IS bound; this is the existing URL precedent") for traceability.

### O-2 (RESOLVED): Should Alpha's social-link seed answer at e2e.ts:767 be migrated to a plain string?
**Resolved:** YES — migrate sort-21 `'test-question-social-1'` from `{ value: { en: '...' } }` LocalizedString to plain string per Pitfall 4 option a; apply same pattern to new sort-23 email Alpha cell. Plan Task 7 Edit D-1 (sort-21) + Edit D-2 (sort-23) implement.



- **What we know:** Pitfall 4 — Alpha's existing `'test-question-social-1': { value: { en: 'https://example.com/sentinel-76' } }` is a LocalizedString. Post-Phase-81 retrofit, the new url-typed input dispatches through `ensureString` which returns MISSING_VALUE for non-string input.
- **What's unclear:** Whether the dev-seed pipeline OR a downstream postgres trigger (`validate_answer_value`) rejects a plain-string answer on a text-typed question (Assumption A6). The migration preamble at `00001_initial_schema.sql:163-166` says plain string IS acceptable.
- **Recommendation:** Plan 01 migrates both `test-question-social-1` (sort-21) and `test-question-email-1` (sort-23) Alpha cells to plain strings. Verify at PLAN.md authoring time that `validate_answer_value` accepts plain string. If it doesn't, fall back to Pitfall 4 option b (document the soft regression).

### O-3 (RESOLVED): Should the email regex extraction (`apps/frontend/src/lib/utils/email.ts`) happen in Plan 01 OR defer to a future refactor?
**Resolved:** INLINE in Input.svelte `<script>` block per CONTEXT D-06 default. Avoid premature abstraction at 2 branches (URL + email); revisit if a 5th+ format-validation branch accumulates. Plan Task 4 Edit A implements.



- **What we know:** CONTEXT D-06 Claude's Discretion: planner picks inline vs extracted. The current `Input.svelte` already imports `checkUrl` from `$lib/utils/links.ts` — the import pattern is established.
- **What's unclear:** Whether the extra ~30 LOC (new util file + 1 test) for an extracted email util justifies cleaner architecture. Per Deferred Ideas, the v2.10 scope is "don't add abstractions beyond what the task requires."
- **Recommendation:** Inline the regex in `Input.svelte` script block as a `const EMAIL_REGEX = /.../` at the top. No util file. If a future phase adds `tel` / `postal` / etc dispatches, that's the natural time to refactor into a shared validator registry.

### O-4 (RESOLVED): Should Plan 01 split into 2 plans (component-tier + spec-tier)?
**Resolved:** ONE bundled plan (9 tasks) — fits under the ~10-task ceiling. CONTEXT D-18 default + RESEARCH O-4 recommendation. Plan 81-01-PLAN.md implements.



- **What we know:** CONTEXT D-18 default is 1 bundled plan; total LOC ~100 across ~6 files. Per-plan complexity ceiling unspecified.
- **What's unclear:** Whether the planner-checker / executor agent's per-plan task ceiling is exceeded.
- **Recommendation:** Default 1 bundled plan. If PLAN.md task count exceeds 10 distinct task steps, split into 2 along the line: Plan A = component-tier (Input.svelte branch + Input.type.ts variant + QuestionInput.svelte dispatch + i18n keys + TranslationKey regen) + dev-seed fixture retrofit; Plan B = spec extension + verification gate.

### O-5 (RESOLVED): Should the verification gate include a manual check of multilocale fallback (et/fr/lb locales)?
**Resolved:** VISUAL INSPECTION ONLY — no per-locale E2E. Documented in 81-VALIDATION.md §"Manual-Only Verifications" row 2. Paraglide fallback chain handles undefined-locale gracefully; spec runs default `en`.



- **What we know:** Phase 81 adds the new key to all 7 Paraglide locales. The e2e specs run in default `en` locale; Phase 78 / CLEAN-04 deferred a full key-coverage audit.
- **What's unclear:** Whether a missing translation in et/fr/lb would surface in any automated test.
- **Recommendation:** Plan 01 verification gate includes a smoke check via Paraglide-compiled message-function existence (NOT a full E2E in each locale). The Paraglide wrapper `wrapper.ts:28-32` returns the key as fallback if the locale's message function is missing — this is observable in console.warn during dev. Phase 81 verification: visually inspect `apps/frontend/messages/{et,fr,lb}/components.json` to confirm the key landed; no per-locale E2E required.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling | ✓ | per `package.json` engines | — |
| Yarn 4 | Workspace + scripts | ✓ | per project | — |
| Supabase CLI | `yarn db:reset && yarn db:seed --template e2e` | ✓ | per project | — |
| Postgres (local Supabase) | DB writes via bulk_import RPC | ✓ | 15.x via Supabase | — |
| Playwright | E2E specs | ✓ | per `tests/package.json` | — |
| `imgproxy` (local Docker via Supabase) | NOT used by Phase 81 surface (validation paths don't trigger image transforms) | n/a | — | — (Phase 81 unaffected by imgproxy state) |
| `tsx` | Type generator script invocation | ✓ | via `yarn workspace` | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — Phase 81 uses only already-installed tooling.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) per `tests/package.json` |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` (greps for all A11Y-01-prefixed tests = 3 existing + 2 new) |
| Full suite command | `yarn test:e2e --workers=1` (3-run cold-start determinism gate per D-13) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| A11Y-05 | Bad email → `components.input.error.invalidEmail` error UI visible + value preserved as typed | E2E (Playwright) | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-05 email-format rejection"` | ❌ Wave 0 (added in Plan 01) |
| A11Y-06 | Bad URL on retrofitted sort-21 social-link → `components.input.error.invalidUrl` error UI visible + value preserved as typed | E2E (Playwright) | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-06 url-format rejection"` | ❌ Wave 0 (added in Plan 01) |
| A11Y-05 (regex-only unit) | EMAIL_REGEX rejects 8 sample bad inputs, accepts 4 sample good inputs | Unit (Vitest) | `yarn workspace @openvaa/frontend test:unit -- email` | ❌ OPTIONAL — Plan 01 task or skipped (D-06 inline-regex default doesn't necessitate a separate unit test; integration via the E2E cell is sufficient) |
| A11Y-05 / A11Y-06 (i18n key resolves) | `t('components.input.error.invalidEmail')` returns localized string in all 7 Paraglide locales | Smoke (manual) | Visual inspection of `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` after edits | ❌ Wave 0 (added in Plan 01) |
| A11Y-05 / A11Y-06 (TranslationKey compile-checks) | `Input.svelte` `handleError('components.input.error.invalidEmail')` call compiles without TS error | Compile gate | `yarn build` after JSON edits + generator regen | ❌ Wave 0 (added in Plan 01) |
| Phase 79 anchor preservation (D-14) | 3-run cold-start results in 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE + 2 NEW PASS_LOCKED (= 82 PASS_LOCKED) | E2E full suite × 3 cold-start | `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean && yarn test:e2e --workers=1` × 3 | ✅ existing (3-command chain) |
| Phase 79 parity-script self-identity (D-15) | `tsx tests/scripts/diff-playwright-reports.ts \| diff <expected-template> -` returns empty diff on cold-start runs | Smoke | per CONTEXT D-15 | ✅ existing |

### Sampling Rate

- **Per task commit:** `yarn lint:check && yarn workspace @openvaa/frontend build` (TS + lint compile gate)
- **Per wave merge:** `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` (all 5 cells PASS — 3 existing + 2 new)
- **Phase gate:** 3-run cold-start `yarn test:e2e --workers=1` full suite green before `/gsd-verify-work` invocation; parity-script self-identity smoke; Phase 79 anchor check (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE + 2 new PASS_LOCKED expected)

### Wave 0 Gaps

- [ ] **`apps/frontend/src/lib/types/generated/translationKey.ts`** — regenerated after JSON edits (Pitfall 2). Either run `tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts` from `apps/frontend/` cwd, OR manually add the union member line. Generator invocation script may need to be added to `package.json` if not present.
- [ ] **`tests/tests/specs/candidate/candidate-profile-validation.spec.ts`** — refactor TEXT_CELLS loop with `kind` discriminant + 2 new cells (covers A11Y-05 + A11Y-06).
- [ ] **`packages/dev-seed/src/templates/e2e.ts`** — retrofit sort-21 + new sort-23 + 2 Alpha answer cells (`test-question-email-1` + recommended migration of `test-question-social-1` to plain string per Pitfall 4 option a).
- [ ] **Optional unit test for EMAIL_REGEX** — `apps/frontend/src/lib/utils/email.test.ts` if planner extracts the regex to a util (D-06 Discretion). Inline-default doesn't need this.
- [ ] **Verification artifact**: `81-VERIFICATION.md` per Phase 80 precedent — 5 SCs assessed (per ROADMAP) + 3-run determinism record + Phase 79 anchor confirmation.

*Existing test infrastructure (Playwright, candidate-app-mutation project, A11Y-01 describe, loginAsCandidate helper, ProfilePage testIds) is canonical and reused — no framework install needed.*

## Security Domain

Phase 81 modifies user-input validation surfaces on a publicly-authenticated (Supabase candidate auth) route. ASVS audit:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 81 does not change auth surfaces; the candidate is already authenticated via the existing Supabase auth flow before reaching the profile route |
| V3 Session Management | no | Phase 81 does not change session handling |
| V4 Access Control | no | Phase 81 does not change RLS policies or row ownership; the candidate writes their own answers via existing `upsert_answers` RPC |
| V5 Input Validation | **yes** | Phase 81 IS an input-validation feature. **Standard control:** programmatic regex check on user input + value-preservation + i18n error message. **Important caveat:** client-side validation is UX, NOT a security boundary. The Supabase backend's `validate_answer_value()` PL/pgSQL function (at `apps/supabase/supabase/migrations/00001_initial_schema.sql:168`) is the authoritative validator on save. Phase 81's email regex is pragmatic UX only — it does NOT block a determined attacker who crafts a custom `upsert_answers` RPC call with an invalid email string. The DB-side validator MAY OR MAY NOT enforce email-format on text-typed answers — out of Phase 81 scope. If the threat model requires server-side enforcement, file a follow-up todo (the existing `validate_answer_value` per migration preamble lines 163-166 accepts plain string OR LocalizedString for text answers, so PostgreSQL-side email-format enforcement would require a NEW CHECK constraint or trigger). |
| V6 Cryptography | no | No new cryptographic surfaces |
| V7 Error Handling | yes (light) | Phase 81's i18n error message MUST NOT leak server-side validation details. The new `invalidEmail` string `"The email address is not valid."` is generic; matches the existing `invalidUrl` pattern |
| V8 Data Protection | no | No new data-protection surfaces; the email value is candidate-authored profile info, already permitted to be persisted |
| V9 Communications | no | No new network surfaces |
| V12 File Handling | no | Phase 81 does not touch file upload paths |
| V13 API and Web Services | no | Phase 81 does not change API surfaces; `upsert_answers` RPC is reused as-is |

### Known Threat Patterns for {frontend Svelte + Supabase backend}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via email input | Tampering | The email value is rendered by Svelte 5's default HTML-escaped template binding `{value}` at `Input.svelte:608` — Svelte auto-escapes; no `{@html}` interpolation in the email render path. SAFE. |
| ReDoS via crafted email input | Denial of Service | The EMAIL_REGEX `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` has 3 disjoint `[^\s@]+` groups — no nested quantifiers, no backtracking-explosion shapes. Trivially safe against ReDoS. The regex evaluator runs in O(n) on input length. |
| SQL injection via email input | Tampering | The email value flows through Supabase's parameterized `upsert_answers` RPC (per existing candidate save path). PostgREST + RPC parameter binding prevents SQL injection. SAFE. |
| Bypass client-side validation | Tampering | (See V5 caveat above.) Client-side regex is UX-only. The backend `validate_answer_value()` SHOULD be the source of truth. Phase 81 does NOT introduce a NEW security boundary — it adds a UX layer on top of an already-existing save path. Threat is unchanged. |
| Email harvesting / privacy leak | Information Disclosure | Email values are stored in `candidates.answers` JSONB; access governed by existing RLS policies. Phase 81 does not change RLS. SAFE. |

**Summary:** Phase 81 is **security-neutral**. It adds UX-only client-side validation; the underlying save path's authoritative validation is unchanged. The pragmatic EMAIL_REGEX is ReDoS-safe by construction (no nested quantifiers). No new attack surface.

## Sources

### Primary (HIGH confidence)
- **Codebase grep + read** — `apps/frontend/src/lib/components/input/Input.svelte` (validated lines 166, 233-303, 286-296, 318-320, 602-609); `apps/frontend/src/lib/components/input/QuestionInput.svelte` (validated lines 40-49, 63-75, 106-114); `apps/frontend/src/lib/components/input/Input.type.ts` (full read); `apps/frontend/src/lib/utils/links.ts` (full read); `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:510-548`; `apps/frontend/src/lib/api/adapters/supabase/utils/{toDataObject,mapRow}.ts` (full read); `apps/frontend/src/lib/i18n/wrapper.ts` (full read); `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` (full read); `packages/data/src/utils/ensureValue.ts:12-14`; `packages/data/src/core/dataObject.ts:96-98`; `packages/data/src/core/dataObject.type.ts:35-37`; `packages/data/src/objects/questions/variants/textQuestion.ts` (full read); `packages/data/src/objects/questions/base/question.ts:95-111`; `packages/supabase-types/src/database.ts:960-1018`; `apps/supabase/supabase/schema/501-bulk-operations.sql:70-207`; `apps/supabase/supabase/migrations/00001_initial_schema.sql:163-166`; `packages/dev-seed/src/template/schema.ts:35-131`; `packages/dev-seed/src/templates/e2e.ts:600-773`; `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (full read); `tests/tests/specs/candidate/candidate-profile.spec.ts:284-309`; `tests/tests/specs/candidate/candidate-questions.spec.ts:262-300`; `tests/playwright.config.ts:122-140`; `tests/scripts/diff-playwright-reports.ts:110-145`; `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs:67-84`; `apps/frontend/project.inlang/settings.json` (full read); `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/components.json` (relevant lines).
- **CONTEXT.md** — `.planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-CONTEXT.md` (all 19 decisions D-01..D-19 + canonical refs + specifics).
- **REQUIREMENTS.md** §A11Y-05 + §A11Y-06 — `.planning/REQUIREMENTS.md` lines 39-41.
- **ROADMAP.md** §"Phase 81" — `.planning/ROADMAP.md` lines 144-155.
- **Todo origin** — `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` (full read of relevant cells 5 + 6 scope sections).
- **Phase 80 inheritance** — `.planning/phases/80-a11y-axe-cite-and-fix/80-CONTEXT.md` (D-09/D-11/D-12/D-13/D-14 inheritance).
- **CLAUDE.md** §"Development Commands" + §"Important Implementation Notes" + Svelte 5 context destructuring rule (project conventions).

### Secondary (MEDIUM confidence)
- Phase 76 P02 reload-persistence anchor — `.planning/milestones/v2.9-phases/76-profile-a11y/76-CONTEXT.md` (referenced by CONTEXT.md canonical refs).
- Phase 79 v2.10 verification anchor — `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md` (cited via CONTEXT D-14).

### Tertiary (LOW confidence)
- None — no external library research needed. Phase 81 is entirely internal to OpenVAA's existing tree.

## Metadata

**Confidence breakdown:**
- Standard stack (dispatch mechanism, regex, i18n flow): **HIGH** — every claim verified by direct codebase read.
- Architecture patterns (dispatch chain, validation branch, value-preservation contract): **HIGH** — existing URL precedent in production today; Phase 81 mirrors byte-for-byte.
- Pitfalls (i18n dual-source, DOM type binding, LocalizedString regression): **HIGH** — each pitfall verified by direct read of the relevant source code; not extrapolated from training data.
- Open Questions O-1 through O-5: **MEDIUM** — each surfaces a concrete planner-decision point; recommendations are defensible but not the only valid choice.
- Assumptions A1-A10: **LOW-to-LOW-MEDIUM** — explicitly listed; A6 is the only MEDIUM-risk (validate_answer_value behavior on plain-string assignment to retrofitted-subtype question).

**Research date:** 2026-05-13
**Valid until:** 2026-05-27 (stable internal codebase; no external library dependencies; only invalidation risk is a Phase 82+ change to `Question.subtype` semantics or `validate_answer_value()` migration)

---

*Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format*
*Research completed: 2026-05-13*
