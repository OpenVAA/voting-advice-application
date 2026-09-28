---
phase: 157-adapter-boundary-typing
status: issues-found
reviewed: 2026-08-31
depth: standard
head_reviewed: 1f5f3247c
diff_base: abfc9feecbd86a060c87b3add132bc96814cd08f^
files_reviewed: 74
lots: 3
findings:
  blocker: 15
  warning: 30
  info: 18
---

# Phase 157 — Code Review

Scope came from the 18 SUMMARY frontmatters: 87 tracked paths, 80 source, **74 reviewed**
after dropping generated and lock files (`packages/supabase-types/src/database.ts`,
`src/lib/types/generated/translationKey.ts`, `yarn.lock`, `package.json`,
`schema-migration-parity.expected.txt`).

The scope was split across three reviewers on disjoint file sets rather than sent to one
reviewer at all 74, and merged here. Lot boundaries are recorded on each finding, because
several findings straddle them: the unsafe *call-site* posture is in lot B or C while the
fix belongs in lot A's schemas.

| Lot | Surface | Files | Blocker | Warning | Info |
|-----|---------|-------|---------|---------|------|
| A | `packages/app-shared` — logger, `getLocalized`, stored-shape schemas, cast guard | 18 | 4 | 7 | 5 |
| B | Supabase adapter, API base, auth providers, SQL | 28 | 6 | 9 | 5 |
| C | Frontend contexts, routes, hooks, ESLint config, tests | 28 | 5 | 14 | 8 |
| **Total** | | **74** | **15** | **30** | **18** |

## The headline: one defect class, sixteen instances

The phase gate (157-18) caught two defects in `StoredSettingsSchema` and fixed them as
individual bugs. **The class was not generalised, and it should have been.** All three lots
independently found more instances of the same shape:

> A `z.strictObject` schema describes a JSONB column more narrowly than the database
> actually permits. The consuming `safeParse` degrades a failed parse to an empty value.
> So **one unacceptable field silently discards every other value in the column**, and the
> caller cannot distinguish "absent" from "malformed".

CR-A-03 is what makes this severe rather than merely untidy: the logger is configured to
`'silent'` in production, so the "degrades with one warning" comment attached to nearly
every one of these boundaries **is false in production** — zero signal, zero sinks.

Lot A verified its findings by execution rather than by reading — zod probes via `tsx`, SQL
probes against the running local Postgres. Its baseline is recorded: 83 app-shared tests
pass, `assert-adapter-casts.mjs` exits 0, and all 39 dev-seed templates plus the live
`app_settings.settings` row parse clean. **The gate's two fixes hold; the class does not.**

## What holds up

Recorded so the fix pass does not re-litigate settled ground:

- No triple casts remain in the four adapter modules; the phase's own goal is met.
- The `get_questions` consolidation is well-shaped SQL with exactly one overload, correctly
  `DROP`ped before recreate.
- The OIDC `aud`/`iss` fail-open defect carried in project memory from Phase 142.1 is
  **genuinely fixed**, structurally, on the call path as well as in the getters.
- `eslint.config.mjs`'s flat-config REPLACE handling is correct — both re-included blocks
  diff byte-identically against `packages/shared-config/eslint.config.mjs:78-84` and
  `:144-155`, all four inherited entries present.
- No `logDebugError` residue anywhere; every `log.*` call is well-formed against the
  `(msg, fields?)` signature. No secrets, tokens or personal data logged.
- The `withAuth`/`authToken` sweep is complete at the consumer surface.

## Orchestrator correction — the admin-app breakage is NOT a Phase 157 regression

Lot C reports the admin app returning 403 to genuine admins and redirect-looping on SSR
(CR-C-01, CR-C-02). **The defect is real and I confirmed the mechanism independently. Its
attribution to 157-11's `unknown` C4 coverage item is wrong, and is corrected here.**

`_getBasicUserData` authorizes off `supabase.auth.getSession()`, and `supabaseAdapter.ts:41-44`
builds a *plain* `createClient` on the server branch, whose `getSession()` reads its own
storage and never the forwarded cookies. That pairing dates to `c3e948a84`
("rewrite the frontend library layer on Svelte 5 runes and the Supabase adapter"), well
before this phase.

At the phase base, `getUserData` already read:

```ts
// authToken is ignored by Supabase adapter -- session is cookie-based
const userData = await dataWriter.getBasicUserData({ authToken: '' }).catch(...)
```

157-11 removed an argument that was **already documented as ignored**, and 157-17 swapped the
logger. Neither changed the authorization semantics. **Phase 157 did not break the admin app;
it inherited the break.** The finding stays — it is a live functional outage and deserves its
own phase — but it must not be counted against this phase's close, and the fix does not
belong in a 157 fix pass.

It fails **closed**, so it is an outage, not an authorization hole. Zero E2E specs touch the
admin app, which is why the green suite said nothing about it.

---

# Lot A


# Phase 157 (Lot A): Code Review Report

**Reviewed:** 2026-08-31T00:10:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Lot A is the phase's new `@openvaa/app-shared` surface: a structured logger, `getLocalized`, and five zod schemas describing unvalidated Supabase JSONB columns. The 83 unit tests in this package pass, `node scripts/assert-adapter-casts.mjs` exits 0, and every seed template in `packages/dev-seed/src/templates/**` plus the live `app_settings.settings` row in the running local database parse cleanly against `StoredSettingsSchema`. So the phase gate's two fixes hold.

The defect class the gate found is nonetheless **not closed**. Every finding below was verified by execution — zod probes run through `tsx`, and SQL probes run against the running local Postgres (`supabase_db_openvaa-local`, port 54322) — not by reading.

Three themes:

1. **`StoredAnswersSchema` has four sibling defects of the gate's class.** The database's own answer validator (`apps/supabase/supabase/schema/011-validation-functions.sql`) explicitly admits four shapes the schema rejects. Because `parseAnswersColumn` degrades a failed parse to `undefined`, one such answer silently discards **every** answer that entity has — which removes the candidate from matching, and can hide them from results entirely via `entities.hideIfMissingAnswers`. None of the four is present in today's seed data (measured: the live `candidates.answers` blobs carry only `value` keys), so this is latent, not currently firing.

2. **`logger.ts` can throw from inside a log call — three ways, all measured.** The phase context asked specifically whether a log call can throw in an error path. It can, and every one of the ~40 `log.*` call sites is in a catch block or an error branch, so each of these converts a handled error into an unhandled one.

3. **`getLocalized` throws on data the database is free to hold**, at a seam (`localizeRow`) that feeds it a raw, uncast-checked column value — violating this phase's own stated posture that one malformed row must not fail the read containing it (T-157-06).

Two cross-lot facts are recorded where they bear on a Lot A file; the offending lines live in the adapter lot and are named as such so the merge does not double-count them.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: `StoredAnswersSchema` rejects four answer shapes the database explicitly permits — each silently discards ALL of that entity's answers

**Severity:** BLOCKER
**File:** `packages/app-shared/src/data/schemas/storedAnswers.schema.ts:17-36`

**Issue:** This is the gate's own defect class, in the sibling schema. `public.validate_answer_value` (`apps/supabase/supabase/schema/011-validation-functions.sql`) is the database's authority on what an answer may be, and it admits four shapes the schema rejects. Each rejection is total: `parseAnswersColumn` (`apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts:74-83`) returns `undefined` on any failure, and every caller reads `undefined` as "no answers".

Measured with `safeParse` at this tree's zod (all four `FAIL`):

| Input | Why the DB permits it | Schema member that rejects it |
|---|---|---|
| `{q1:{value:'x', info:'plain'}}` | `011-validation-functions.sql:171-177` accepts `info` as a **plain string or** a localized object; the file header at `:145` documents exactly that | `info: LocalizedStringSchema…` (line 35) |
| `{q1:{info:{en:'x'}}}` (no `value` key) | `:167-169` returns early when `value` is absent or null, so this passes the trigger. Also arises mechanically: `JSON.stringify({value: undefined, info})` **drops** the `value` key, and `supabaseDataWriter.ts:287` forwards the answer object verbatim to `upsert_answers` | `value` is required (line 33) |
| `{q1:{value:[{en:'a'},{en:'b'}]}}` | `:217-227`, the `multipleText` branch — each item may be "a string **or localized string object**" | union has `z.array(z.string())` only (line 21) |
| `{q1:{value:[1,2]}}` | `multipleChoiceCategorical` (`:204-216`) validates items only via `is_valid_choice_id`, which compares raw JSONB; the sibling single-choice branch at `:197-200` states outright that a choice id may be "string or number" | same — and note the union already accepts a bare `z.number()` for a single choice, so the schema is internally asymmetric |

A fifth, weaker case: nothing in the database rejects an **unknown key** inside an answer object, so a legacy or forward-compatible key also wipes the blob (`{q1:{value:'x', legacyField:1}}` → `FAIL`).

Blast radius, all downstream of a single bad answer: the entity is matched on nothing; `entities.hideIfMissingAnswers.candidate` removes it from the results list; and on the write path `supabaseDataWriter.ts:299` re-parses the RPC's read-back through the same function, so a candidate who saves one answer gets `{}` handed back to the editing UI while the database still holds their answers.

**Fix:**

```ts
const StoredAnswerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  // multipleText stores localized items; multipleChoiceCategorical stores choice ids that
  // validate_answer_value permits as string OR number. One array member covers both.
  z.array(z.union([z.string(), z.number(), z.record(z.string(), z.unknown())])),
  z.record(z.string(), z.unknown()),
  z.null()
]);

const StoredAnswerSchema = z.strictObject({
  // Absent when the writer stored only an open answer; validate_answer_value returns early on it.
  value: StoredAnswerValueSchema.optional(),
  // validate_answer_value:171-177 accepts a plain string here as well as a locale object.
  info: z.union([LocalizedStringSchema, z.string()]).nullable().optional()
});
```

Then add the four inputs above as accept-cases in `storedAnswers.schema.test.ts`, each citing the `011-validation-functions.sql` line that permits it. Separately, consider whether `parseAnswersColumn` should salvage per-question rather than dropping the whole blob — the per-member retry `parseStoredCustomization` already performs is the in-tree precedent.

---

#### CR-02: `StoredSettingsSchema` marks inner members required, contradicting its own "every field is optional" claim — a partial `analytics.platform` discards the whole settings column

**Severity:** BLOCKER
**File:** `packages/app-shared/src/data/schemas/storedSettings.schema.ts:49-53, 154-165`

**Issue:** The docstring at line 41 states the schema's first deliberate divergence as "**Every field is optional here.**" That is false at two points, and both reopen the gate's exact failure mode, because `_getAppSettings` still degrades any parse failure to `{}` (`supabaseDataProvider.ts:112-119`).

Measured:

- `StoredSettingsSchema.safeParse({ analytics: { platform: { name: 'umami', code: 'X' } } })` → **fails** on the missing `infoUrl` (lines 156-162 make all three required). An operator arming tracking without authoring a privacy-info URL is an ordinary act — `DataConsent.svelte:46` and `DataConsentInfoButton.svelte:37` both read `infoUrl` through `?.` guards, so the frontend tolerates its absence while this schema does not. The result is not "no analytics"; it is `access`, `matching.minimumAnswers`, `questions.questionsIntro.show` and every other stored setting silently discarded, and the app running on shipped defaults. That is precisely the `perm-1e1cg1co` symptom the file's own line 13 describes.
- `StoredSettingsSchema.safeParse({ survey: { showIn: ['frontpage'] } })` → **fails** on the missing `linkTemplate` (lines 51-52). Lower likelihood than the analytics case, same consequence.

The commentary treating the analytics addition as complete (lines 148-153) is therefore only half-true: the member is present, but its interior is stricter than any writer is obliged to be.

**Fix:** make the inner members optional and fix the docstring so it stops asserting something the schema does not do.

```ts
  analytics: z
    .strictObject({
      platform: z
        .strictObject({
          name: z.string().optional(),
          code: z.string().optional(),
          // Absent whenever an operator arms tracking without authoring a privacy URL;
          // DataConsent.svelte:46 already reads it through `?.`.
          infoUrl: z.string().optional()
        })
        .optional(),
      trackEvents: z.boolean().optional()
    })
    .optional()
```

and the same for `survey.linkTemplate` / `survey.showIn`. Add both partial payloads to `storedSettings.schema.test.ts` as accept-cases asserting a SIBLING setting survives, matching the shape of the two existing regression tests at lines 43 and 56.

---

#### CR-03: `log.*` can throw — three measured triggers, and every call site is an error path

**Severity:** BLOCKER
**File:** `packages/app-shared/src/logging/logger.ts:56-76` (`emit`), `:40-47` (`serialiseError`)

**Issue:** A logger that throws is worse than a logger that is silent, because it converts a handled failure into an unhandled one. All three triggers were executed against the module:

1. **Unknown configured level → TypeError on every subsequent call.** `emit` does `LEVELS[config.level].level` at line 59 with no guard. `configureLogger` takes `Partial<LoggerConfig>`, so `configureLogger({ level: undefined })` is **type-legal** and spread-merges an `undefined` level into `config`; `'silent'` is not matched at line 57, and line 59 then dereferences `undefined`. Measured: `TypeError: Cannot read properties of undefined (reading 'level')`. Same for any unrecognised string (`'trace'`, `'INFO'`). This is the shape a consumer reaches for the moment a level comes from configuration rather than a literal — `configureLogger({ level: env.LOG_LEVEL as LogLevel })` with the variable unset is an unhandled crash on the next `log.error` inside a catch block. Today's two call sites (`hooks.server.ts:15`, `hooks.client.ts:7`) pass literals, so this is latent.
2. **A throwing sink propagates.** `config.sink(record)` at line 70 is uncalled-guarded. Measured: a sink that throws `Error('sink down')` escapes `log.warn` to the caller. A sink is by design consumer-supplied (a remote transport, a `JSON.stringify` over a circular record) — the one component of this design guaranteed to be outside the package's control is also the one it trusts unconditionally.
3. **`serialiseError` throws on a null-prototype value.** `String(value)` at line 46. Measured: `log.error('x', { err: Object.create(null) })` → `TypeError: Cannot convert object to primitive value`. Any thrown value with a throwing or non-primitive `toString` does the same.

**Fix:**

```ts
function emit(name: LogLevel, msg: string, fields?: Record<string, unknown> & { err?: unknown }): void {
  // Resolve the threshold defensively: `Partial<LoggerConfig>` lets a caller merge in an
  // `undefined` or unrecognised level, and a logger must never throw from inside a catch block.
  const threshold = LEVELS[config.level as LogLevel];
  if (config.level === 'silent' || !threshold) return;
  const { level, severityText } = LEVELS[name];
  if (level < threshold.level) return;
  // …build record…
  try {
    if (config.sink) {
      config.sink(record);
      return;
    }
    if (record.level >= 40) console.error(record);
    else console.info(record);
  } catch {
    // A failing sink must not become the caller's problem; it is already the quietest failure available.
  }
}
```

and in `serialiseError`, guard the stringification:

```ts
  let message: string;
  try {
    message = String(value);
  } catch {
    message = '[unserialisable thrown value]';
  }
  return { type: 'unknown', message };
```

Add a test per trigger; `logger.test.ts` currently has none for an invalid level or a throwing sink.

---

#### CR-04: `getLocalized` throws a TypeError on a non-object JSONB value, at a seam that is fed raw, unvalidated column data

**Severity:** BLOCKER
**File:** `packages/app-shared/src/data/getLocalized.ts:22`

**Issue:** `locale in value` throws whenever `value` is a primitive. Measured: `getLocalized(JSON.parse('"plain name"'), 'en')` → `TypeError: Cannot use 'in' operator to search for 'en' in plain name`; same for a number.

That is reachable from real data. `localizeRow` (`apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts:25,58`) passes a raw database column straight in behind a `as Record<string, string> | null | undefined` cast — an assertion, not a check — and the columns it localizes are declared as bare `jsonb` with no constraint: `apps/supabase/supabase/schema/102-entities.sql:7,53,73` and `103-questions.sql:8,33` declare `name jsonb` / `short_name jsonb` with no `CHECK`. Grepping the whole schema directory shows `is_localized_string` is **defined but used in zero constraints** — its only caller is `validate_answer_value`. So `UPDATE candidates SET name = '"Ada"'::jsonb` is accepted by the database today, and `bulk_import` builds its column list from the JSON keys it is handed.

The consequence is not a dropped field. `localizeRow` is called from `toDataObject`, which the provider's entity/question/constituency reads run over every row, so one malformed row throws out of the read that contains it and fails the page load. The phase's own posture, stated in `parseJsonbColumn.ts:42` and `:69`, is that "one malformed row must not fail the read that contains it (T-157-06)". This function is the exception, and it is the one function in the lot with no schema in front of it.

**Fix:**

```ts
export function getLocalized(
  value: LocalizedString | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
  // The declared parameter type is an assertion at every call site: `localizeRow` hands over a raw
  // `jsonb` column, and no `name`/`short_name` column carries an is_localized_string CHECK. A scalar
  // or array there must degrade to null, never throw out of the read (T-157-06).
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  …
}
```

---

### Warnings

#### WR-01: `getLocalized` resolves prototype-chain keys, returning a Function where the signature promises `string | null`

**Severity:** WARNING
**File:** `packages/app-shared/src/data/getLocalized.ts:22-23`

**Issue:** `in` walks the prototype chain. Measured on a `JSON.parse`d object: `getLocalized(v, 'toString')` returns `function toString() { [native code] }`, and `getLocalized(v, 'de', 'valueOf')` likewise returns a function — for a value whose declared return type is `string | null`. The SQL function this file claims parity with uses `?`, which tests **top-level keys only** (`010-utility-functions.sql:41,45`), so the two disagree here as well. Whether a caller can steer `locale` is a question for the routing lot; the type lie and the SQL divergence stand regardless.

**Fix:** use own-key tests, which also restores parity with the SQL `?` operator.

```ts
  if (Object.hasOwn(value, locale)) return value[locale];
  if (Object.hasOwn(value, defaultLocale)) return value[defaultLocale];
```

---

#### WR-02: `getLocalized` tier 3 does not match the SQL function it documents itself as implementing — measured, not inferred

**Severity:** WARNING
**File:** `packages/app-shared/src/data/getLocalized.ts:25-26` (claim at `:5`)

**Issue:** The header states this "Implements 3-tier fallback matching the SQL `get_localized()` function". Tier 3 does not. `Object.keys` yields insertion order; `jsonb` stores object keys sorted by length then bytewise, so `jsonb_object_keys(...) LIMIT 1` yields a different key.

Measured against the running local database:

```
psql> SELECT public.get_localized('{"sv":"Hej","fi":"Hei"}'::jsonb, 'de', 'en');  -- 'Hei'
tsx>  getLocalized({ sv: 'Hej', fi: 'Hei' }, 'de', 'en')                          // 'Hej'
```

A user on an unsupported locale therefore sees a different language depending on whether the string came through the RPC's SQL localization or the adapter's TypeScript one. Deterministic, not a race.

**Fix:** either sort to match — `const keys = Object.keys(value).sort((a, b) => a.length - b.length || (a < b ? -1 : 1));` — or delete the parity claim from the header and state that tier 3 is "any available key, order unspecified". Silently keeping a claim that measurement contradicts is the worse of the two.

---

#### WR-03: `StoredImageSchema` is stricter than every writer and validator of the columns it guards

**Severity:** WARNING
**File:** `packages/app-shared/src/data/schemas/storedImage.schema.ts:16-29`

**Issue:** Three mismatches, in increasing order of consequence:

1. `public.validate_image` (`011-validation-functions.sql:98-140`) checks named members and **does not reject unknown keys**; and per the comment at `:77` it has *no caller today* — no image column runs it. So the column is entirely unconstrained while the reader is strict: `{path:'a.png', extra:1}` → `FAIL` (measured), and `parseImageColumn` drops the image.
2. `path` is an unconstrained `z.string()` and is interpolated into a URL without encoding at `storageUrl.ts:16`. A stored `../../` segment escapes the `public-assets` prefix. Impact is low (the writer controls the value; the bucket is public-read anyway; the interpolation is not at the scheme position, so no `javascript:` injection) — but this schema is the only validation seam the value ever passes, so the constraint belongs here.
3. **Cross-lot, adapter lot owns the line:** `supabaseDataWriter.ts:337` writes `updateFields.image = image` — an application `Image` carrying `url`, not `path` — into `candidates.image` on the "already has a URL" branch. That value can never be read back: `StoredImageSchema.safeParse({url:'…'})` → `FAIL` (measured), which `storedCustomization.schema.test.ts:60` even pins as intended behaviour. Pre-existing (the old `!stored?.path` guard dropped it just as silently), so not a phase regression, but this schema is where the round-trip contract now lives.

**Fix:** constrain `path` (`z.string().min(1).refine((p) => !p.includes('..'), 'no parent-directory segments')`), and treat item 3 as a defect for the adapter lot: the branch should either upload/derive a `path` or leave the column untouched.

---

#### WR-04: `StoredSettingsSchema`'s top-level strictness has no salvage behind it, so one unknown key discards every known one

**Severity:** WARNING
**File:** `packages/app-shared/src/data/schemas/storedSettings.schema.ts:48` (consumer: `supabaseDataProvider.ts:112-119`)

**Issue:** `parseStoredCustomization` (`supabaseDataProvider.ts:72-89`) already implements the right posture for a presentation column — drop the members zod flagged, re-parse the rest. `_getAppSettings` has no equivalent: any failure anywhere returns `{}`. That asymmetry is what made CR-02 and the two gate defects catastrophic rather than local, and it will make the next one catastrophic too.

Concretely, the top level rejects every `StaticSettings` root key except `analytics` — `colors`, `font`, `supportedLocales`, `admin`, `appVersion` (measured: `{colors:{light:{}}}` → `FAIL`) — even though `mergeAppSettings` (`apps/frontend/src/lib/utils/settings.ts:20`) merges the stored blob over `StaticSettings` **by root key**, which is exactly the mechanism the file's own lines 148-150 cite as the reason `analytics` had to be admitted. The same argument applies to its five siblings; no in-tree writer produces them today, which is the only reason this is a WARNING and not a repeat of CR-02.

Two smaller mismatches in the same file: `entityDetails.contents` (lines 57-63) has no `faction` member though `ENTITY_TYPE.Faction` exists (`packages/data/src/objects/entities/base/entityTypes.ts:11`), and `results.showSurveyPopup`'s doc in `dynamicSettings.type.ts:251` refers to `analytics.survey` settings that neither type nor schema declares.

**Fix:** give `_getAppSettings` the per-member salvage `parseStoredCustomization` already has, so a rejected member costs that member rather than the column. Keep the schema strict — strictness is what surfaced the two gate defects; it is the whole-column degrade that made them silent.

---

#### WR-05: `serialiseError` discards the fields that make a caught error diagnosable

**Severity:** WARNING
**File:** `packages/app-shared/src/logging/logger.ts:40-47`

**Issue:** The function copies only `name`, `message` and `stack`. Two losses:

- **Error subclasses lose their own enumerable properties.** `PostgrestError extends Error` in the installed `@supabase/postgrest-js` and carries `code`, `details`, `hint` — and `code` is the field that distinguishes `PGRST116` (no rows, benign) from a real failure. It is dropped. `cause` chains are dropped too.
- **A non-Error object collapses to `'[object Object]'`.** Measured: `log.error('x', { err: { code: 'PGRST116', message: 'no rows' } })` → `err: { type: 'unknown', message: '[object Object]' }`. Total information loss, and the record still *looks* well-formed in the sink.

The docstring justifies this function by saying a bare `Error` "would lose every stack trace and be strictly worse than the `console.error` it replaces". The same argument applies one level down: for a plain-object error this is strictly worse than `console.error`, which prints the fields.

**Fix:**

```ts
function serialiseError(value: unknown): NonNullable<LogRecord['err']> {
  if (value instanceof Error) {
    const serialised: NonNullable<LogRecord['err']> = { type: value.name, message: value.message };
    if (value.stack != null) serialised.stack = value.stack;
    // Error subclasses carry the diagnosis on own enumerable props: PostgrestError's `code` is what
    // separates a benign PGRST116 from a real failure, and copying name/message/stack alone drops it.
    Object.assign(serialised, { ...value });
    return serialised;
  }
  if (value != null && typeof value === 'object') {
    return { type: 'unknown', message: JSON.stringify(value) ?? String(value) };
  }
  return { type: 'unknown', message: String(value) };
}
```

(guarding the `String`/`JSON.stringify` calls per CR-03).

---

#### WR-06: `SendEmailResultSchema` is stricter than the function it mirrors, and its failure branch reports success

**Severity:** WARNING
**File:** `packages/app-shared/src/data/schemas/sendEmailResult.schema.ts:14`

**Issue:** `status: z.enum(['sent', 'failed'])`, while the producing declaration is `status?: string` (`apps/supabase/supabase/functions/send-email/index.ts:22`). Today only the two literals are pushed, so the schema is accurate *by coincidence of the current branch set*, not by contract. The moment a third status appears the whole payload is rejected — and the consumer (`supabaseAdminWriter.ts:97-104`, adapter lot) returns `{ type: 'success', sent: 0, failed: 0, results: [] }` on a schema failure. An operator sending a real campaign sees "success, 0 sent" and cannot tell that from a genuine no-op.

Two secondary notes on the file's own documentation: (a) lines 28 and 37 describe accommodating the **500** all-failed branch, but `supabase.functions.invoke` surfaces a non-2xx response as `error` with `data` null, so `sendEmail` throws at `supabaseAdminWriter.ts:94` before this schema is reached — that branch is likely unreachable through the parse; and (b) `sendEmail` has **no callers** anywhere in `apps/frontend/src`, so the whole surface is currently unexercised, and the caller's `templates` shape (`{subject, text, html}`) does not match what the Edge Function reads (`template.body`, `index.ts:13`) — an adapter-lot defect, recorded here only because it undermines the "measured return shape" claim in this schema's header.

**Fix:** relax to `status: z.string().optional()` and keep the `sent`/`failed` discrimination in the consumer, or keep the enum and make the consumer's failure branch report failure rather than success. Do not keep both the enum and the success-on-failure degrade.

---

#### WR-07: `assert-adapter-casts.mjs` guards one spelling, not the class — and a same-class cast survives in an anchor file

**Severity:** WARNING
**File:** `scripts/assert-adapter-casts.mjs:107, 216-238`

**Issue:** The guard runs clean (verified: 26 files, 5047 lines, 0 violations), and its check-0 vacuity precondition is genuinely good work. But three gaps mean its green is narrower than the criterion it closes ("a grep for casts on adapter reads returns empty"):

1. **`TRIPLE_CAST` requires the literal `as Json as unknown as`.** A cast through `unknown` without the `Json` hop is equally invisible to the compiler and is not matched. Two live instances remain in an anchor file: `supabaseDataWriter.ts:343` and `:356` — and `:356` asserts an object built from a `.select(...).single()` read-back into `LocalizedCandidateData`, which is the guarded class by any reading of the header comment. So the count is zero by spelling, not by class.
2. **Matching is per line.** `lines.forEach` at `:216` cannot see a cast Prettier has wrapped (printWidth 120 via `.editorconfig`), or one a developer wraps by hand.
3. **Matching is blind to comments and strings.** `line.includes(literal)` at `:229` fires inside a doc comment. These files are unusually heavily commented and their comments discuss exactly the casts that were removed — `supabaseDataProvider.ts:131` already comes within one word of `as Partial<DynamicSettings>`. A guard that fails the build over prose gets weakened rather than obeyed. (`as StoredImage` also prefix-matches `as StoredImageAnything`.)

**Fix:** widen check 1 to `/\bas\s+unknown\s+as\b/` and add the two current `supabaseDataWriter.ts` lines to an explicit, commented allowlist with their reason — an allowlist of two named lines is honest, whereas a pattern narrow enough to miss them is not. Strip line comments before matching (`line.replace(/\/\/.*$/, '')`) so prose cannot fail the build.

---

### Info

#### IN-01: `getLocalized` silently accepts an array and returns its first element

**File:** `packages/app-shared/src/data/getLocalized.ts:25-26`
**Issue:** Arrays pass the `in` checks (they are objects), so `getLocalized(['a','b'], 'en')` returns `'a'` (measured) rather than `null`. The SQL counterpart raises on a non-object.
**Fix:** covered by the `Array.isArray` guard proposed in CR-04.

#### IN-02: `LocalizedStringSchema` is declared three times, verbatim

**File:** `packages/app-shared/src/data/schemas/storedAnswers.schema.ts:6`, `storedCustomization.schema.ts:7`, `storedSettings.schema.ts:6`
**Issue:** Three identical `z.record(z.string(), z.string())` constants with three identical doc comments. They will drift — e.g. only one of the three will gain the `.min(1)` that would mirror `is_localized_string`'s rejection of `{}` (`011-validation-functions.sql:24-27`).
**Fix:** one exported `localizedString.schema.ts` in `data/schemas/`, imported by the three.

#### IN-03: Test gaps on exactly the paths that fail

**File:** `packages/app-shared/src/data/getLocalized.test.ts`, `packages/app-shared/src/logging/logger.test.ts`
**Issue:** `getLocalized.test.ts` covers nine happy paths and no adversarial input — no prototype key, no scalar, no array, no SQL-parity case for tier 3. `logger.test.ts` covers the configured happy paths and neither of `emit`'s throw modes. Both suites are green and neither would have caught CR-03, CR-04, WR-01 or WR-02.
**Fix:** add one case per finding above; each is a two-line test.

#### IN-04: A field explicitly set to `undefined` becomes an attribute key

**File:** `packages/app-shared/src/logging/logger.ts:66`
**Issue:** `Object.keys(attributes).length > 0` counts explicitly-undefined keys, so `log.warn('x', { id: undefined })` emits `attributes: { id: undefined }` — which a JSON sink renders as `{}` and a console sink as `{ id: undefined }`. `parseJsonbColumn.ts:32` passes `id: source.id ?? undefined` and hits this on every id-less read.
**Fix:** filter undefined values when building `attributes`.

#### IN-05: The barrel makes zod a hard runtime dependency of every consumer

**File:** `packages/app-shared/src/index.ts:10`
**Issue:** `export * from './data/schemas'` pulls zod into any workspace importing `@openvaa/app-shared` for `staticSettings` alone. No Deno Edge Function imports the package today (verified), so nothing is broken — but the package description advertises Edge Functions as a consumer, and zod-in-Deno is a constraint worth stating before someone tries.
**Fix:** note the constraint in the package README, or expose the schemas under a `./schemas` subpath export.

---

_Reviewed: 2026-08-31T00:10:00Z_
_Reviewer: Claude (gsd-code-reviewer) — Lot A_
_Depth: standard_

---

# Lot B


# Phase 157 (Lot B): Code Review Report

**Reviewed:** 2026-08-30
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Lot B is the phase's core: the triple casts really are gone from these files (`grep` for `as Json as unknown as` returns nothing in the four adapter modules), the `get_questions` consolidation is well-shaped SQL, the migration correctly drops the 3-argument `get_nominations` before recreating it as 4-argument (so exactly one overload survives — asserted in pgTAP), and the OIDC `aud`/`iss` fail-open defect carried in from the earlier phase is genuinely **fixed** here, structurally, on the call path as well as in the getters. That work is sound.

The problem is systemic and it is the exact shape the phase gate already caught once: **every one of the new `safeParse` boundaries degrades a malformed value to an empty one, and every schema behind them is `z.strictObject` at every level.** So a single unrecognised key — the ordinary consequence of a settings blob written by a newer app version, an operator-authored key, or an older client's answer — destroys the entire adjacent configuration. The phase's own test suite *asserts this behaviour as correct* (`supabaseDataProvider.test.ts:248-270` locks in a valid `access: { candidateApp: true }` being silently discarded).

Compounding it: **the mitigation these branches rely on does not exist in production.** `hooks.client.ts:7` and `hooks.server.ts:15` set the logger to `'silent'` unless `DEV` or `PUBLIC_DEBUG`. Every "degrades with one warning" comment in this lot is false in a production build — the degradation is completely silent.

Six BLOCKERs follow, of which five are the silent-degradation family and one is a cross-request session-bleed hazard the new `$lib/api/adminWriter` barrel widens.

## Critical Issues

### CR-01: A failed settings parse silently relaxes the `access.*` gates

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:111-119`

**Issue:** `StoredSettingsSchema` is `z.strictObject` at *every* nesting level (its own JSDoc states this deliberately). A whole-object `safeParse` failure returns `{}` — byte-identical to the `PGRST116` no-rows branch at `:107` — and the caller merges `{}` over the shipped defaults. The blast radius includes the feature gates: `access.underMaintenance`, `access.answersLocked`, `access.candidateApp`, `access.voterApp`.

Concretely: a stored blob carrying `underMaintenance: true` *plus* one key the reader's schema does not enumerate takes the site **out of maintenance mode**; one carrying `answersLocked: true` **unlocks candidate answers**. The caller cannot distinguish "no settings row" from "settings rejected", so it cannot fail closed.

This is not hypothetical. The schema's own JSDoc records the same shape firing twice inside this phase — once on an absent notification title (`ONE absent notification title silently discarded EVERY OTHER SETTING`), once on the `analytics` key at 157-18 (`every stored blob carrying it was rejected WHOLESALE`). Both were fixed by widening the schema for that one key; the shape was left intact for the next key.

The test at `supabaseDataProvider.test.ts:248-270` is the proof: the fixture contains a valid `access: { candidateApp: true }` and one unknown key three levels away, and the assertion is `expect(result).toEqual({})`.

**Fix:** apply the per-member degradation that `parseStoredCustomization` (`:72-90`) already implements, and fail *closed* on the access block specifically:

```ts
const parsed = StoredSettingsSchema.safeParse(data?.settings ?? {});
if (!parsed.success) {
  log.error('getAppSettings: stored settings rejected', { issues: … });
  // Retain the members zod did not flag; never silently relax a gate.
  const retained = dropFlaggedTopLevelMembers(data?.settings, parsed.error);
  const retry = StoredSettingsSchema.safeParse(retained);
  if (!retry.success) throw new Error('getAppSettings: stored settings are unreadable');
  return retry.data as DPDataType['appSettings'];
}
```

Alternatively give every level `.catchall(z.unknown())` so forward-compatible keys pass — strictness here buys nothing the reader's own switch does not already provide, and the JSDoc on `CardContentSchema` makes exactly that argument for a different field.

---

### CR-02: One malformed answer erases an entity's ENTIRE answer set, on read and on write-readback

**File:** `apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts:74-84`
**Call sites:** `supabaseDataProvider.ts:406-409`, `:505-508`; `supabaseDataWriter.ts:204`, `:300`

**Issue:** `StoredAnswersSchema` is `z.record(id, StoredAnswerSchema.nullable())` where `StoredAnswerSchema` is `z.strictObject({ value, info? })`. A single answer object carrying any third key rejects the *whole record*, and `parseAnswersColumn` returns `undefined`, which every call site collapses to `{}` / `null`. `parseJsonbColumn.test.ts:74-86` pins this: one `bogusAnswerKey` on `q1` returns `undefined` for the whole blob.

Three distinct consequences, all silent:

1. **Voter side.** `_getEntityData` / `_getNominationData` hand `null` to `parseAnswers`, so the entity has zero answers. Under the default `entities.hideIfMissingAnswers.candidate`, `nominationAndQuestionState.svelte.ts:79-88` filters that candidate out of the results entirely — and then `:99-101` drops their organization if no children survive. A candidate silently vanishes from the voter app because of one extra JSON key.
2. **Candidate app read.** `_getCandidateUserData` (`supabaseDataWriter.ts:204`) shows an empty profile; `profileComplete` reads false.
3. **Candidate app write — the worst one.** `_setAnswers` (`:300`) validates the RPC's read-back of the blob it *just successfully wrote*. On a parse failure it returns `{}` with no error. `candidateUserDataState.save()` then passes `{}` the `if (!updatedAnswers) throw` guard (`{}` is truthy), merges nothing, and calls `resetAnswers()` at `:262`, clearing the local edit buffer. The candidate's just-entered answers disappear from the UI and the call reports `{ type: 'success' }`.

**Fix:** degrade per question id, not per blob:

```ts
export function parseAnswersColumn(stored: Json | undefined, source: JsonbColumnSource): StoredAnswers | undefined {
  if (stored == null) return undefined;
  const whole = StoredAnswersSchema.safeParse(stored);
  if (whole.success) return whole.data;
  if (typeof stored !== 'object' || Array.isArray(stored)) { warnParseFailure(…); return undefined; }
  const kept: StoredAnswers = {};
  const dropped: Array<string> = [];
  for (const [id, value] of Object.entries(stored)) {
    const one = StoredAnswerSchema.nullable().safeParse(value);
    if (one.success) kept[id] = one.data; else dropped.push(id);
  }
  log.warn('Stored answers: dropped malformed entries.', { ...source, dropped });
  return kept;
}
```

Separately, `_setAnswers` must not report success when it cannot read back what it wrote.

---

### CR-03: Every degradation branch in this phase is silent in production

**Files:** `apps/frontend/src/hooks.client.ts:7`, `apps/frontend/src/hooks.server.ts:15` (out of lot, but they are what makes the lot's branches unsafe) — consumed by `supabaseDataProvider.ts:78`, `:114`; `parseJsonbColumn.ts:31-37`; `supabaseAdminWriter.ts:99`

**Issue:**

```ts
configureLogger({ level: import.meta.env.DEV || constants.PUBLIC_DEBUG ? 'debug' : 'silent' });
```

and `logger.ts:57`: `if (config.level === 'silent') return;`.

In a production build with `PUBLIC_DEBUG` unset, **`log.warn` emits nothing at all**. Every comment in this lot of the form "degrades … and emits one warning" (`parseJsonbColumn.ts:44`, `:71`; `supabaseAdminWriter.ts:71`; `supabaseDataProvider.ts:66`, `:113`) is therefore false in production: the value is discarded with zero signal, in zero sinks, forever. There is no metric, no error surface, and no way for an operator to discover that their settings column, a candidate's answers, or an email batch's outcome was thrown away.

This is what turns CR-01, CR-02 and CR-04 from "recoverable degradation" into "undetectable data loss".

**Fix:** route these specific records at `error` level and configure a non-silent floor in production, e.g. `configureLogger({ level: import.meta.env.DEV || constants.PUBLIC_DEBUG ? 'debug' : 'error' })`. A boundary-validation failure against your own database is an operator-actionable error, not debug noise.

---

### CR-04: `sendEmail` reports `type: 'success', sent: 0, failed: 0` for a batch whose outcome is unknown

**File:** `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:96-103`

**Issue:** `SendEmailResultSchema` is `z.strictObject` at both levels (stated in its own JSDoc: "Strict at both levels, because strictness is per-object and does not descend into an array element"). Any field the `send-email` Edge Function later adds — a `message_id`, a `retry_after`, a `provider` — or a 2xx response with a null body, fails the parse. The method then returns:

```ts
return { type: 'success' as const, sent: 0, failed: 0, results: [] };
```

That value is **indistinguishable from a dry run that sent nothing**. An operator running a bulk mailing is told "0 sent, 0 failed" for a batch that may have delivered to every recipient, and the obvious response — retry — double-sends to everyone.

This is a *write*. The comment at `:71` justifies the shape by "matching the adapter's read-side posture", but the read-side rationale ("one malformed row must not fail the read that contains it") does not transfer: there is no partial result to salvage, only an unknown one to misreport.

**Fix:**

```ts
if (!parsed.success) {
  log.error('sendEmail: the send-email result did not match its schema; outcome UNKNOWN.', { … });
  throw new Error('send-email: the function returned an unrecognised result; the send outcome is unknown. Do not retry without checking delivery.');
}
```

If throwing is unacceptable, widen the return type with an explicit `outcome: 'known' | 'unknown'` discriminant. Never emit `sent: 0` for an operation you did not observe.

---

### CR-05: `convertFilterValue([])` turns a degenerate URL into a silently empty voter app

**File:** `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts:17-18`
**Call sites:** `supabaseDataProvider.ts:300-320`, `:524-540`

**Issue:** the empty-array sentinel is reachable from a user-supplied URL and produces an empty app with no error, no redirect, and (per CR-03) no log line.

Trace:
1. `apps/frontend/src/lib/utils/route/parseParams.ts:20` filters empty values out of array params: `?electionId=&constituencyId=c1` yields `electionId: []`.
2. `(voters)/(located)/+layout.ts:39` guards with `if (!electionId || !constituencyId)`. **`[]` is truthy**, so no implication runs and no redirect to the election selector fires.
3. `convertFilterValue([])` returns `[]` (deliberately, per its docstring).
4. `electionIds.flatMap(…)` produces **zero RPC calls**. `results` is `[]`, `results.find(r => r.error)` is `undefined`, `data` is `[]`.
5. Both `getNominationData` and `getQuestionData` resolve to empty result sets. The voter sees a blank app.

This is a **regression introduced by this phase**: the previous code took `electionId[0]` → `undefined` → an unfiltered RPC that returned everything.

**Fix:** the adapter should not treat "the caller asked for zero elections" as a successful empty read. Either:

```ts
if (electionIds.length === 0 || constituencyIds.length === 0) {
  throw new Error('getNominationData: an empty filter array requests nothing; pass undefined to omit the filter.');
}
```

or fix the caller guard to `if (!electionId?.length || !constituencyId?.length)` so an empty array redirects to the selector. Both, ideally — the sentinel distinction is only unit-tested on the helper (`convertFilterValue.test.ts:22-27`), never on the provider, so nothing pins the end-to-end behaviour.

---

### CR-06: Server-side adapter singletons are re-`init()`ed per request — concurrent admin requests cross-bind sessions (PRE-EXISTING; a third instance added here)

**File:** `apps/frontend/src/lib/api/adminWriter.ts:1` (new in this phase) → `apps/frontend/src/lib/api/adapters/supabase/adminWriter/index.ts:3`
**Related:** `adapters/supabase/dataWriter/index.ts:3`, `adapters/supabase/dataProvider/index.ts:3`, `adapters/supabase/supabaseAdapter.ts:27-49`

**Issue:** each adapter is a **module-level singleton** (`export const adminWriter = new SupabaseAdminWriter();`), and `supabaseAdapterMixin.init()` mutates that instance:

```ts
init(config: SupabaseAdapterConfig): this {
  …
  this.#supabase = createClient<Database>(url, anonKey, { global: { fetch: config.fetch! } });
```

The SSR module graph is shared across all concurrent requests. `condenseArguments.ts:44` and `generateQuestionInfo.ts:55` call `adminWriter.init({ fetch })` at the start of a **long-running admin job**, binding the shared client to that request's `fetch` — and therefore that admin's cookies/JWT. A second admin request arriving while the first job awaits an LLM call overwrites `#supabase`; the first job's subsequent `updateQuestion` and `insertJobResult` calls then execute under the **second admin's identity**. RLS cannot catch this, because the JWT presented is genuinely a valid admin's.

This phase did not invent the pattern (it existed for `dataWriter`/`dataProvider`), but it added a **third** singleton and created `$lib/api/adminWriter` as a new public entry point imported by both server-only modules (`$lib/server/admin/features/*`) and a client module (`$lib/contexts/admin/adminContext.svelte.ts`).

**Fix:** make the adapters request-scoped. On the server, construct per request (`const adminWriter = new SupabaseAdminWriter().init({ fetch })`) or hold the client in `AsyncLocalStorage`. Keep the module singleton only for the browser bundle, where a single session per process is the correct model.

## Warnings

### WR-01: `parseStoredCustomization`'s retry cannot drop a root-level issue, so one unknown top-level key still discards the entire column

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:76-89`

**Issue:** the per-member salvage keys on `String(issue.path[0])`. A `z.strictObject` `unrecognized_keys` issue at the root has `path: []`, so `issue.path[0]` is `undefined` and `String(undefined)` is the literal `'undefined'` — which names no real member. `rejected` therefore removes nothing, the retry re-parses the identical value, fails identically, and returns `{}`. The JSDoc at `:66` acknowledges this ("An unrecognised top-level key … names no member to drop, which makes the retry fail too and degrades the whole column").

So the salvage machinery does not cover the single most likely forward-compat failure. `publisherName`, `publisherLogo`, `poster`, `candPoster`, `candidateAppFAQ` and every `translationOverride` disappear together over one key a newer app version added. There is no test for this case — `supabaseDataProvider.test.ts:404-425` covers only a *nested* issue with a resolvable `path[0]`.

**Fix:** zod carries the offending keys on the issue; use them.

```ts
const rejected = new Set<string>();
for (const issue of parsed.error.issues) {
  if (issue.code === 'unrecognized_keys' && issue.path.length === 0) {
    for (const key of issue.keys) rejected.add(key);
  } else if (issue.path.length > 0) {
    rejected.add(String(issue.path[0]));
  }
}
```

---

### WR-02: The fan-out is a cross product of two independently-supplied arrays, so it fetches (election, constituency) pairs the caller never selected

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:306-316`, `:529-540`

**Issue:** `(voters)/(located)/+layout.ts:96-100` passes `electionId` and `constituencyId` as independent arrays that are in practice *positionally paired* (the selector produces one constituency per election). `electionIds.flatMap(eid => constituencyIds.map(cid => …))` issues N×M calls and unions everything, so nominations and questions scoped to (E1, C2) enter `DataRoot` even though the voter selected C1 for E1.

`nominationAndQuestionState.svelte.ts:66` (`election.getNominations(entityType, constituency)`) and `QuestionAndCategoryBase.appliesTo` re-filter per pair downstream, so this is **not user-visible today**. It is a warning rather than a blocker for that reason — but the adapter's contract is now "OR over the cross product" while every caller means "OR over the pairs", and the correctness of the voter view rests entirely on a downstream re-filter that nothing in this lot's tests asserts. Change the downstream filter and the wrong candidates appear.

**Fix:** take paired input on the options type — `pairs?: Array<{ electionId: Id; constituencyId: Id }>` — or, at minimum, state the cross-product contract explicitly on `GetNominationsOptions` / `GetQuestionsOptions` in `getDataOptions.type.ts` and add a provider test that pins which pairs are requested.

---

### WR-03: One malformed `election_rounds` value takes the entire question read down with SQLSTATE 22023

**File:** `apps/supabase/supabase/schema/505-question-rpcs.sql:34-64`; identical body at `migrations/00004_…sql:32-62`

**Issue:** `jsonb_array_length` raises `22023 cannot get array length of a non-array`. The three filter columns are bare `jsonb` with **no CHECK constraint** (`schema/103-questions.sql:20-22`, `:48-50`), and `bulk_import` builds its column list from arbitrary JSON keys. So a hand-authored template or an admin import storing `{"round": 1}` in `election_rounds` makes `get_questions` **error for every caller**, and `(voters)/(located)/+layout.ts:87` swallows it with `.catch(e => e)` into a blank question flow.

The pgTAP file pins this at `11-question-rpcs.test.sql:396-407` as current behaviour with an explicit "PIN CURRENT BEHAVIOUR, not desired behaviour" note. Pinning a data-triggered availability failure is not the same as fixing it, and the new RPC made the blast radius global where the old client-side predicate degraded per row.

**Fix:** guard the type in the predicate, and add the missing constraint:

```sql
AND (p_election_round IS NULL
     OR qc.election_rounds IS NULL
     OR jsonb_typeof(qc.election_rounds) <> 'array'
     OR jsonb_array_length(qc.election_rounds) = 0
     OR qc.election_rounds @> to_jsonb(p_election_round))
```

plus `CHECK (election_rounds IS NULL OR jsonb_typeof(election_rounds) = 'array')` in a follow-up migration.

---

### WR-04: `electionRound` is plumbed end-to-end with zero production callers

**Files:** `apps/frontend/src/lib/api/base/getDataFilters.type.ts:38`; `supabaseDataProvider.ts:305`, `:527`; `migrations/00004_…sql:76-157`; `schema/503-entity-rpcs.sql:12`, `:81-82`; nine pgTAP assertions

**Issue:** `grep -rn electionRound apps/frontend/src` returns only the type declaration, the two adapter reads of `options?.electionRound`, and `supabaseDataWriter.ts:228` (an unrelated `n.election_round ?? 1` mapping). No route, layout or context ever sets `electionRound` on a `getData` call. The new RPC parameter, the `DROP FUNCTION` in the migration, and the widened options type all land with no consumer.

That is not a bug, but it means the phase took the one genuinely destructive action available (`DROP FUNCTION IF EXISTS public.get_nominations(uuid, uuid, boolean)`) for a capability that has no end-to-end verification path. If PostgREST's schema cache is stale at deploy time between the DROP and the CREATE, callers get PGRST202 for an unused parameter's sake.

**Fix:** either wire a caller (the multi-round voter flow this presumably exists for) or note explicitly in the phase record that the axis is provisioned but inert.

---

### WR-05: The highest-risk new code in the phase has no test

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:433-464` and `:51-61`

**Issue:** two gaps in `supabaseDataProvider.test.ts`, both on code the phase's own comments flag as previously broken:

1. **The reverse-fill** (`:433-464`, populating `candidateNominationIds` / `factionNominationIds` / `organizationNominationIds`) has **no assertion at all**. The `getNominationData` describe block (`:1748-2030`) covers dedup, parent-id clearing, images, entity variants and shape — never the child-id arrays. The code's own comment says omitting this surfaced as "parties tab is empty" during manual smoke. That regression is currently guarded by nothing but E2E.
2. **`bySortOrderThenId`** (`:51-61`) is untested. The one fan-out test (`:1583-1603`) returns *identical* rows from all four calls, so it exercises deduplication only — never the ordering the function exists for, never the nulls-last branch (`:56-57`), never the id tiebreak (`:60`).

**Fix:** add (a) a fan-out test whose calls return rows with differing `sort_order` including `null`, asserting the merged order matches the SQL `sort_order NULLS LAST, id`; (b) a nomination test with an organization parent and two candidate children asserting `candidateNominationIds`.

---

### WR-06: `_updateEntityProperties`' empty-update early return clobbers the caller's `termsOfUseAccepted`

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:342-344`

**Issue:**

```ts
if (Object.keys(updateFields).length === 0) {
  return { termsOfUseAccepted: undefined } as unknown as LocalizedCandidateData;
}
```

`candidateUserDataState.save()` at `:260` does `this.#updateCandidateData({ ...this.#savedData.candidate, ...updatedCandidate })`. Spreading an object with an **explicit `termsOfUseAccepted: undefined` key** overwrites a previously-accepted timestamp in memory with `undefined` — the candidate reads as never having accepted the terms.

The branch is reachable: `:318-340` leaves `updateFields` empty when `image` is a truthy object with neither a `File` in `.file` nor a `.url` (e.g. `{ path: … }` or a cleared-but-not-null image). The `as unknown as LocalizedCandidateData` double cast is what lets a return value missing `id` and `type` typecheck at all — the two remaining casts-through-`unknown` in this file, at `:343` and `:356`.

**Fix:** return `{}` rather than an object carrying an explicit `undefined`, and reject an image with neither `file` nor `url` rather than silently no-op'ing it:

```ts
if (Object.keys(updateFields).length === 0) return {} as LocalizedCandidateData;
```

---

### WR-07: `_getBasicUserData` hand-decodes the JWT with `atob`, unverified and unguarded

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:155`

**Issue:**

```ts
const payload = JSON.parse(atob(session.access_token.split('.')[1]));
```

Three problems. (a) JWT segments are **base64URL**; `atob` rejects `-` and `_` and mangles multi-byte UTF-8, so a token containing either throws a bare `InvalidCharacterError`/`SyntaxError` out of a method whose every other failure is a descriptive `new Error(…)`. (b) `.split('.')[1]` is unchecked — a malformed token yields `atob(undefined)`. (c) the `role` at `:166-171`, which gates admin UI, is derived from an **unverified client-side decode** of `user_roles`; the server must not trust this path.

Also flagged against the project checklist: this method uses `getSession()`, not `safeGetSession()` (§ Supabase Adapter, "Auth operations use `safeGetSession()` … for route guards"). Pre-existing, but the method was rewritten in this phase (the `WithAuth` removal) without addressing it.

**Fix:** use `jose.decodeJwt(session.access_token)` (jose is already a dependency), wrap in try/catch, and confirm no server-side authorization decision reads this value.

---

### WR-08: `getActiveProvider` no longer coalesces an empty `PUBLIC_IDENTITY_PROVIDER_TYPE`, and throws the raw value

**File:** `apps/frontend/src/lib/api/utils/auth/providers/index.ts:27-37`

**Issue:** the `|| 'signicat'` fallback was removed on the stated grounds that `$lib/utils/constants` already defaults it. It does — but with `??` (`constants.ts:10`: `env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat'`), which covers `undefined`/`null` and **not** `''`. A `.env` line reading `PUBLIC_IDENTITY_PROVIDER_TYPE=` now yields `''`, falls through to `default:`, and throws `Unknown identity provider type: . Expected 'signicat' or 'idura'.` The pre-change code coalesced that to signicat and worked.

The JSDoc's claim — "an explicitly empty env var is a misconfiguration and throws rather than silently selecting a provider" — describes an intentional decision, but it converts a working deployment into a hard auth failure on a whitespace-level config edit, and it interpolates the raw env value into an error message that reaches the caller.

**Fix:** `const providerType = (constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat') as ProviderType;` — restoring parity with the documented default — or validate at startup with an operator-facing message that does not echo the value.

---

### WR-09: `IDENTITY_PROVIDER_JWKS_URI` is read with a non-null assertion and no fail-closed guard

**File:** `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:47-49`

**Issue:** the `audience` and `issuer` getters were correctly hardened in this phase to throw named, coded failures when unset. The third env-backed getter was not:

```ts
get publicSignatureJWKSetUri(): string {
  return constants.IDENTITY_PROVIDER_JWKS_URI!;
}
```

`server/constants.ts:7` defaults it to `''`, so the `!` asserts a value that is provably reachable as empty. `jose.createRemoteJWKSet(new URL(''))` at `:141` then throws an uncoded `TypeError`, and both providers' catch arms (`idura.ts:174-186`, `signicat.ts:128-140`) map it to `{ success: false, error: {} }` — the "unknown failure" shape, indistinguishable from a genuine verification failure.

It fails closed, so this is not a bypass. But it defeats the module's own stated design (a header comment promising "five discriminating coded failures") in exactly the case an on-call engineer needs the discriminant, and the `!` is the assertion the project checklist asks to avoid.

**Fix:** mirror the `audience`/`issuer` shape with an `ERR_JWKS_URI_UNCONFIGURED` code, and re-check on the call path alongside the other two at `:113-129`.

---

**Positive note, recorded deliberately:** the `aud`/`iss` fail-open defect carried in from the earlier phase is **fixed** here, and fixed in the right shape — the getters throw (`:56-84`) *and* the call path re-validates at `:113-129`, so the guard is structural rather than positional and holds for callers who pass their own options object. The reasoning is written down at the site. No further action needed on that item.

## Info

### IN-01: Dead exports on a changed module

**File:** `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:22-33`, `:41-43`

`mapRowToDb` and `mapRows` are exported with no production call site; both JSDoc blocks say so explicitly ("This function has NO production call site", "Also has no production call site"). Documenting a dead export is better than leaving it undocumented, but the export is still reachable and `mapRowToDb`'s own docstring describes a silent-wrong-column-name failure mode for anyone who uses it. Consider deleting both, or marking them `@internal` and covering them with the existing tests only.

### IN-02: The parity guard's docstring is now stale in the place a reader consults it

**File:** `scripts/assert-schema-migration-parity.mjs:48-56`

The script names three copies of `get_nominations` (`schema/503-entity-rpcs.sql`, `00001`, `00002`) as its "LARGER of the two blind spots" and instructs the reader to "grep all three copies by symbol". After `00004` there are **four**. The instruction is now incomplete at exactly the point it is meant to be relied on.

### IN-03: `_getConstituencyData` remains the file's last unfiltered table read

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:266-271`

Every other read in the file now filters in SQL, but `constituencies` is still `select('*')` on every voter page load. The comment at `:265` explains why (parent chains), which is a real constraint — but a `.in('id', …)` over the union of the returned groups' `constituencyIds` plus their parents would preserve it.

### IN-04: Election/constituency id matching is case-sensitive against a text-typed JSONB array

**File:** `apps/supabase/supabase/schema/505-question-rpcs.sql:36`, `:40` (and the migration twin)

`qc.election_ids @> to_jsonb(p_election_id::text)` renders the parameter through `uuid::text`, which is always lowercase. The stored arrays are untyped JSONB text with no normalisation and no CHECK, so an `election_ids` array authored with uppercase UUID strings will never match and the row will be silently excluded. Consider normalising on write, or comparing via `lower()`.

### IN-05: The pgTAP file asserts `SECURITY INVOKER` but never exercises RLS

**File:** `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql:64-68`

The security section checks `NOT prosecdef` and the two `has_function_privilege` grants, but every subsequent call runs as the test superuser. The schema header's claim — "the reads run with the caller's permissions, so the question_categories and questions RLS policies gate the caller" — is therefore asserted, not exercised. A `SET LOCAL ROLE anon` block with a membership assertion against an unpublished row would close it, and would be the only test in the file that could catch a future `SECURITY DEFINER` slip *in behaviour* rather than in metadata.

The plan count (`plan(55)`) does match the 55 assertions present — verified by hand, section by section.

---

_Reviewed: 2026-08-30_
_Reviewer: Claude (gsd-code-reviewer), Lot B_
_Depth: standard_

---

# Lot C


# Phase 157 Lot C: Code Review Report

**Reviewed:** 2026-08-30
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Lot C is the consumer surface — where 157's sweeping changes land in routes, contexts, hooks and the ESLint guard. Three of the phase's own claims check out cleanly under adversarial reading, and one does not.

**Verified sound:**

- **The flat-config REPLACE handling in `eslint.config.mjs` is correct.** I diffed both re-included blocks against `packages/shared-config/eslint.config.mjs:78-84` and `:144-155`. All four inherited entries (`svelte/store` `paths`, deep-relative-`lib` `patterns`, `TSEnumDeclaration`, `ImportExpression`) are present in the second block character-for-character. No silent ban deletion. `eslint-adapter-boundary-guard.test.ts` carries a standing regression per inherited entry, which is the right shape.
- **No `logDebugError` residue.** `grep -rn logDebugError apps/frontend/src tests` returns zero. Every `log.*` call in this lot is well-formed against `packages/app-shared/src/logging/logger.ts`'s `(msg: string, fields?)` signature — no `Cannot find name 'log'`-class defect survives. No secrets, tokens or passwords are logged.
- **`withAuth`/`authToken` sweep is complete at the consumer surface.** The only surviving `authToken` references are the `UniversalAdapter.fetch` plumbing and its own unit test — none in routes or contexts.

**Not verified — and the phase was right to leave C4 `unknown`:** the admin login/job flow does not work. I traced it statically and then **confirmed the mechanism empirically** (see CR-01). `_getBasicUserData` authorizes by calling `supabase.auth.getSession()`, and the adapter's server branch (`supabaseAdapter.ts:39-44`) builds a plain `createClient` with no cookie storage. I ran that exact construction in this workspace: `getSession()` returns `{ session: null, error: null }`. Every server-side `getUserData({ fetch })` therefore throws `No active session` and resolves `undefined`. That fails **closed**, so it is not an authorization hole — it is a total functional outage of the admin app's SSR entry and all six `/api/admin/jobs/*` routes. Nothing in the E2E suite covers the admin app (`grep -rln admin tests/tests/specs` returns four candidate/perm specs, zero admin specs), which is why 157's green suite says nothing about C4.

**Protection posture, as asked.** The phase's security observation is confirmed: `UniversalAdapter.fetch` adds the `Authorization` header only when `authToken` is truthy (`universalAdapter.ts:46`), and every caller passed `''`, so the admin job routes were never bearer-protected. The sweep removed a field that made the posture look stronger than it was; it weakened nothing. Current posture:

| surface | guard | verdict |
|---|---|---|
| `/api/admin/jobs/*` (6 routes) | own `getUserData({fetch})?.role !== 'admin'` check | present, **but can never pass** (CR-01) |
| `admin/(protected)/*` page render | `admin/(protected)/+layout.ts:19-33` universal load (role check) | present, **but redirects valid admins on SSR** (CR-02) |
| `admin/(protected)/*` **form actions** | `locals.safeGetSession()` only — **no role check** | WR-01 |
| `admin/*` in `hooks.server.ts` | **none** — `candidateAuthHandle` gates only paths containing `/candidate` | by design; layout is the guard |
| DB writes | Supabase RLS via `adminWriter` | out of lot, assumed |

## Critical Issues

### CR-01: Every server-side `getUserData` call fails — all six admin job API routes return 403 to real admins

**File:** `apps/frontend/src/lib/auth/getUserData.ts:26-32`; consumed by `apps/frontend/src/routes/api/admin/jobs/{start,active,past,abort-all}/+server.ts` and `.../single/[jobId]/{abort,progress}/+server.ts`

**Issue:** `getUserData` calls `dataWriter.init({ fetch })` with no `serverClient`. In a `+server.ts` handler `browser` is `false`, so `supabaseAdapter.ts:39-44` takes the plain-`createClient` branch, which has no cookie storage. `SupabaseDataWriter._getBasicUserData` (`supabaseDataWriter.ts:145-150`) then authorizes via `auth.getSession()`:

```ts
const { data: { session }, error } = await this.supabase.auth.getSession();
if (error || !session) throw new Error('No active session');
```

**Measured, not reasoned.** I executed the identical construction inside `apps/frontend`:

```js
const c = createClient('http://127.0.0.1:54321', 'anon-key-placeholder', { global: { fetch } });
await c.auth.getSession();   // → session: null  error: null
```

`session` is `null`, so `_getBasicUserData` throws, `getUserData`'s `.catch` swallows it, and every route's `(await getUserData({ fetch }))?.role !== 'admin'` is `undefined !== 'admin'` → **403 for everyone, including a genuine admin**. The job calls originate in the browser (`prepareDataWriter` throws off-browser), so the browser holds a valid session — but the guard runs server-side against a session-less client. Net effect: the jobs dashboard polling (`jobStates.#fetchAndUpdateJobs`), the emergency-cleanup button, per-job abort/progress, and `dataWriter.startJob` (which both admin form actions await before doing any work) all fail. This is exactly coverage item C4.

**Fix:** hand the cookie-capable request client to the adapter at these server seams, the same way `candidate/(protected)/+layout.server.ts:29` already does, and authorize with `safeGetSession()` (per `.agents/code-review-checklist.md` § Supabase Adapter: *"Auth operations use `safeGetSession()` (not `getSession()`) for route guards"*):

```ts
// getUserData.ts — accept the request client
export async function getUserData({ fetch, serverClient, parent }: {
  fetch: Fetch; serverClient?: SupabaseClient<Database>; parent?: () => Promise<{ session?: unknown }>;
}): Promise<BasicUserData | undefined> { … dataWriter.init({ fetch, serverClient }); … }

// each api/admin/jobs/*/+server.ts
export async function GET({ fetch, locals }) {
  const { session } = await locals.safeGetSession();
  if (!session) return json({ error: 'Forbidden' }, { status: 403 });
  if ((await getUserData({ fetch, serverClient: locals.supabase }))?.role !== 'admin')
    return json({ error: 'Forbidden' }, { status: 403 });
  …
}
```

Note this requires an allowlist entry (or, better, a `locals`-typed helper inside the boundary) — see WR-08. Add at minimum one admin E2E spec exercising start → poll → abort; the suite currently has none.

---

### CR-02: An authenticated admin is bounced to the login page on every direct/refreshed load of the admin app

**File:** `apps/frontend/src/routes/admin/(protected)/+layout.ts:15-31`

**Issue:** Same root cause as CR-01, on the page-render path. `+layout.ts` is a **universal** load, so it runs on the server during SSR. `parent()` supplies `{ session }` from `admin/+layout.server.ts` (cookie-capable, so it passes), but line 19's `getUserData({ fetch, parent })` then hits the session-less server client and returns `undefined`, so line 23 fires `redirect(307, AdminAppLogin, errorMessage: 'loginFailed')`.

No `export const ssr = false` exists anywhere under `src/routes/admin/` (checked), so this runs on every direct URL entry and every hard refresh. SvelteKit does **not** re-run a universal load in the browser after SSR, so the client cannot recover. The admin lands on the login page holding a valid session, and `hooks.server.ts:76` gates only paths containing `/candidate`, so nothing bounces them back. The app is reachable only via the client-side navigation that immediately follows an enhanced login submit — the classic "works in my session, dead on refresh" shape.

**Fix:** convert the guard to a server load with the request client, or pass it through:

```ts
// admin/(protected)/+layout.server.ts (new) — replaces the universal guard
export async function load({ fetch, locals }) {
  const { session } = await locals.safeGetSession();
  if (!session) redirect(307, buildRoute({ route: 'AdminAppLogin', locale: getLocale(), errorMessage: 'loginFailed' }));
  const userData = await getUserData({ fetch, serverClient: locals.supabase });
  if (userData?.role !== 'admin') { /* logout + redirect as today */ }
  return { userData };
}
```

---

### CR-03: `jobs/+page.svelte` destructures reactive context accessors — every stat tile is frozen at its init value

**File:** `apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte:14-24, 69-84`

**Issue:** Direct violation of CLAUDE.md § *Context Destructuring Rule*.

```ts
const { t, jobs: { activeJobsByFeature, pastJobs }, abortAllJobs } = getAdminContext();
```

`activeJobsByFeature` and `pastJobs` are **prototype getters over `$derived`/`$derived.by`** (`jobStates.svelte.ts:42-53`, exposed per its own JSDoc: *"exposed as READ-ONLY PROTOTYPE GETTERS so reads via `instance.X` re-invoke the getter in the tracking scope"*). The nested destructure invokes each getter **once** at component init and binds the initial empty `Map` / empty array to a local. `$derived.by` returns a **new** `Map` on each recompute, so the local is a permanently stale reference. Polling then updates `#jobs` and nothing downstream ever sees it:

- `activeJobsCount` (line 24) is `$derived` over the frozen `Map` → always `0`.
- All three past-job tiles (lines 69, 76, 83) filter the frozen array → always `0`.

**Corroborating evidence this is live, not theoretical:** `FeatureJobs.svelte:34-38` commits the identical nested destructure of `activeJobsByFeature` / `pastJobsByFeature`, and that same file carries an unexplained in-repo TODO at line 102: *"Past Jobs Section. Currently has a bug. TODO: fix bug of not showing past jobs."* That is this bug. It is also invisible to E2E (no admin specs) and would be invisible even if there were some, because the failure mode is a stale value on a surface that renders fine.

**Fix (both files):**

```ts
const ctx = getAdminContext();
const { t, abortAllJobs } = ctx;                       // stable — destructure ok
const activeJobsCount = $derived([...ctx.jobs.activeJobsByFeature.values()].filter(Boolean).length);
// template: read ctx.jobs.pastJobs.filter(...) directly, never a destructured local
```

---

### CR-04: Server-side adapter singletons are re-`init()`ed per request — concurrent requests can cross-wire sessions

**File:** `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts:26-44`; `apps/frontend/src/routes/api/auth/login/+server.ts:19-28`; `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts:28-34`; `apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts:53-59`; `apps/frontend/src/lib/server/admin/features/condenseArguments.ts:44`; `.../generateQuestionInfo.ts:55`

**Issue:** `dataWriter`, `dataProvider` and `adminWriter` are **module-level singletons** (`adapters/supabase/{dataWriter,dataProvider,adminWriter}/index.ts:3` — `export const dataWriter = new SupabaseDataWriter()`), and under `adapter-node` the module graph is shared across all concurrent requests in the process. Every server seam listed above mutates that shared instance's private `#supabase`/`#fetch` and then `await`s before using it:

```ts
const writerConfig: SupabaseAdapterConfig = { fetch, serverClient: locals.supabase };
dataWriter.init(writerConfig);                        // :30  mutates the SHARED instance
const { session } = await locals.safeGetSession();    // :33  ← yield point
const userData = await dataWriter.getCandidateUserData({ … });  // :44  may use ANOTHER request's client
```

Two candidates loading `/candidate` concurrently interleave as A.init → A.await → B.init → A.getCandidateUserData, and A reads with B's cookie-capable client — one candidate's profile served to another. `api/auth/login/+server.ts` has the same window across `await request.json()` (line 22). This is worse than a theoretical race: it is *observably* re-entrant even single-threaded, because `dataWriter.startJob` → `POST /api/admin/jobs/start` → `getUserData({fetch})` → `dataWriter.init(...)` re-inits the very singleton the outer form action is mid-flight on.

**Fix:** stop sharing a mutable adapter across requests on the server. Either export a factory (`createDataWriter(config)`) used per request, or make the client an explicit argument threaded through the call rather than instance state. This also removes the CR-01/CR-02 seam entirely.

*(Pre-existing pattern, not introduced by 157 — but 157-11 rewrote every one of these call sites and its own C4 item flags this flow as unverified.)*

---

### CR-05: `/api/auth/login` is a dead, unauthenticated credential-verification endpoint that acts as a valid-credentials oracle

**File:** `apps/frontend/src/routes/api/auth/login/+server.ts:18-51`

**Issue:** This route has **zero callers**. Both real login paths bypass it and say so in their own doc comments — `candidate/login/+page.server.ts:4` and `admin/login/+page.server.ts:4` both explain they use `event.locals.supabase` directly *"instead of going through the `/api/auth/login` route"* because a nested API response's `Set-Cookie` headers do not propagate. The route's own JSDoc (line 11) still asserts the opposite: *"the Supabase server client automatically manages session cookies via createServerClient's cookie handler in hooks.server.ts"* — false, since line 20 inits with `{ fetch }` only, never `locals.supabase`.

It nonetheless remains a live, unauthenticated `POST` that accepts `{username, password, role}` and returns **three distinguishable outcomes**: 400 (bad credentials), 403 (credentials **valid**, role mismatch — line 43), 200. The 403 is a positive confirmation that a submitted password is correct, with no rate limiting, no CSRF token, and — because nothing calls it — no monitoring or E2E coverage that would ever notice abuse. 157-11 changed this file's signature and left the surface live.

**Fix:** delete the route and its `LoginParams`/`LoginResult` types (nothing imports them outside the file). If it must stay, collapse 403 into the 400 response so it stops discriminating, and route it through `locals.supabase`.

## Warnings

### WR-01: Admin form actions authorize on session presence only — no admin role check

**File:** `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts:23-25`; `apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts:48-50`

**Issue:** `(protected)` is a SvelteKit route *group*, so these actions are reachable at `POST /admin/argument-condensation` and `POST /admin/question-info`. `+layout.ts`'s role check does **not** gate form actions — actions run independently of layout loads. The actions' own guard is:

```ts
const { session } = await locals.safeGetSession();
if (!session) return fail(401, { type: 'error', error: 'Authentication required' });
```

Any authenticated non-admin (e.g. any candidate) passes it, and `dataWriter.getBasicUserData()` on line 31/56 also succeeds for them. Today the request is stopped one call later because `startJob`'s nested `/api/admin/jobs/start` 403s — but that is transitive defence resting on CR-01's *broken* guard. Fix CR-01 and the transitive stop stays; but authorization must not be an emergent property of a downstream route.

**Fix:**

```ts
const { session } = await locals.safeGetSession();
if (!session) return fail(401, { type: 'error', error: 'Authentication required' });
const dataWriter = await dataWriterPromise;
dataWriter.init({ fetch, serverClient: locals.supabase });
const { email, role } = await dataWriter.getBasicUserData();
if (role !== 'admin') return fail(403, { type: 'error', error: 'Forbidden' });
```

---

### WR-02: `AbortError.name` comparison is broken by production name mangling — aborted jobs get recorded as failed

**File:** `apps/frontend/src/lib/server/admin/features/condenseArguments.ts:204-205`; `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts:202-203`

**Issue:**

```ts
// Job was aborted if the error is an AbortError. Avoid instanceof, check name instead
if (error && typeof error === 'object' && 'name' in error && error.name === AbortError.name) {
```

`AbortError.name` is the **constructor's** name, not the sentinel. `packages/core/src/controller/abortError.ts:7` sets `this.name = 'AbortError'` on the *instance*, so the instance side is stable — but the left-hand side is the class binding, which esbuild renames under production minification (`keepNames` is not set). Post-minify `AbortError.name` can be `'m'` while the thrown instance still carries `'AbortError'` → the comparison is false → every user-initiated abort takes the `else` branch, calls `controller.fail('… failed: …')` and persists `endStatus: 'failed'` with a spurious error payload. The comment names the cross-realm `instanceof` hazard the code is dodging but reintroduces a build-time one.

**Fix:** compare to the literal, which is what the instance actually carries.

```ts
if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
```

---

### WR-03: `generateQuestionInfo` assumes index alignment between the API result array and the question list

**File:** `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts:122-133`

**Issue:** `results = await generateQuestionInfoAPI({ questions: selectedQuestions, options })` is then read positionally:

```ts
for (let i = 0; i < selectedQuestions.length; i++) {
  const question = selectedQuestions[i];
  const result = results[i];
  if (!result.success || !result.data) { … }   // TypeError if results.length < selectedQuestions.length
```

Nothing in the call or the type enforces `results.length === selectedQuestions.length` or that ordering is preserved (the log message on line 119 says the questions are processed *in parallel*). A short or reordered array yields either a `TypeError: Cannot read properties of undefined (reading 'success')` — swallowed by the outer catch and mis-reported as a job failure — or, worse, question A's generated info silently written onto question B via `adminWriter.updateQuestion({ id: question.id, … })`. That second case is a silent data-corruption path. Neither file has unit coverage (157-12 repointed both flows onto `prepareDataWriter`/`adminWriter` with none added).

**Fix:** key on the result's own question id rather than position, or assert alignment up front:

```ts
if (results.length !== selectedQuestions.length)
  throw new Error(`Result/question length mismatch: ${results.length} vs ${selectedQuestions.length}`);
```

---

### WR-04: `authContext`'s own-enumerable `isAuthenticated` accessor is snapshotted by `candidateContext`'s rest-spread — auth state de-reactivates

**File:** `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:19, 29-42` (with `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:236-237`)

**Issue:** The JSDoc frames the own-enumerable accessor as the fix for spread-safety, while stating the defect in the same sentence: *"An own-enumerable accessor IS copied by the spread — **as a snapshot, which is the documented spread-of-context trap**."* Object spread invokes the getter and copies the resulting **boolean**. The consumer does exactly that:

```ts
// candidateContext.svelte.ts:236-237
const { logout: _inheritedLogout, ...authContextRest } = this.#authContext;  // ← invokes the getter ONCE
Object.assign(this, authContextRest);
```

So `candidateContext.isAuthenticated` is frozen at whatever `!!page.data.session` was at candidate-context init. `adminContext.svelte.ts:85-88` documents precisely this failure and guards against it with a prototype getter (*"de-reactivating admin auth gating (the nav would show authenticated links to a logged-out user until a hard refresh)"*), and line 235 of the same candidateContext constructor uses `inheritContextMembers` for appContext for the same reason. The auth half was left on the snapshotting path.

Note this is currently *latent* — `grep -rn isAuthenticated apps/frontend/src` shows no component consumer, only the type declarations and unit tests. It becomes live the moment anything renders on it.

**Fix:** use the accessor-preserving helper for both sources, and keep the `logout` exclusion:

```ts
inheritContextMembers(this, this.#appContext);
const { logout: _inheritedLogout, ...authRest } = Object.fromEntries(
  Object.keys(this.#authContext).filter((k) => k !== 'logout').map((k) => [k, undefined])
); // or simply: inheritContextMembers(this, this.#authContext) with a `logout` skip parameter
```
`inheritContextMembers` (`contexts/utils/inheritContextMembers.ts:20-31`) already installs a live forwarding accessor when the source descriptor has a `get`, which is exactly what is needed; it just needs a skip-key option for `logout`.

---

### WR-05: `authContext.logout` swallows failures — the UI reports a successful logout that did not happen

**File:** `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:61-66`

**Issue:**

```ts
logout = async (): Promise<void> => {
  const dw = await prepareDataWriter(dataWriter);
  await dw.logout().catch((e) => { log.error(`Error logging out: ${e?.message ?? '-'}`); });
};
```

The return type is `Promise<void>` (`authContext.type.ts:19`), so no caller can distinguish success from failure. `candidate/(protected)/+layout.svelte:57-61` (`handleCancel`) awaits it and sets `status = 'idle'`; `LogoutButton.svelte:34` awaits it and `goto`s away. If the Supabase sign-out call fails — network blip, expired-token 401 — the user is navigated to a logged-out-looking page while their session cookie is still valid. On a shared device that is a real session-persistence hazard, and the only trace is a debug-gated log line.

**Fix:** return the result and let callers surface it.

```ts
logout = async (): Promise<DataApiActionResult> => {
  const dw = await prepareDataWriter(dataWriter);
  return dw.logout().catch((e): DataApiActionResult => {
    log.error('Error logging out', { err: e });
    return { type: 'failure' };
  });
};
```

---

### WR-06: Password change requires no re-authentication after 157-10 removed the current-password field

**File:** `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:50` (`setPassword({ password })`); contract at `apps/frontend/src/lib/contexts/auth/authContext.type.ts:35-40`

**Issue:** The field's removal is a recorded operator decision, and the spike's finding is real (GoTrue returns HTTP 200 for a wrong current password when the reauthentication gate is off, so the field was providing *zero* verification — deleting security theatre is correct). But the residual risk should be stated rather than closed: a privileged, irreversible account-takeover operation is now reachable from a live session with no proof-of-knowledge and no proof-of-presence. Anyone with a stolen session cookie or an XSS foothold can silently change the password and lock the legitimate candidate out. The call is not even a SvelteKit form action, so it does not get the framework's CSRF origin check — it is a client-side `setPassword` through the DataWriter.

The type doc (`authContext.type.ts:37`) states the posture explicitly (*"authorisation comes from the active Supabase session (verified via cookies), so no current password is collected or forwarded"*) which is good, but the compensating control was never landed.

**Fix (compensating control, not a revert):** enable GoTrue's own reauthentication gate — `secure_password_change` / `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION` — in `apps/supabase/config.toml` and in the hosted project, then reinstate a nonce/current-password step against the *server-verified* flow. The `testIds.ts:55` note says no `config.toml` key turns the gate on *at the pinned CLI*; that pin is itself the blocker to record and schedule, and it should be a tracked follow-up rather than an inline NB.

---

### WR-07: Validation errors are surfaced only as the label of a disabled submit button — WCAG 2.1 AA failure

**File:** `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:41, 110-115`

**Issue:**

```ts
let submitLabel = $derived(validationError || t('candidateApp.settings.password.update'));
…
<Button onclick={handleSubmit} disabled={!canSubmit} variant="main" text={submitLabel} … />
```

The password validation error becomes the **accessible name of a disabled button**. This fails three ways against the checklist's WCAG 2.1 AA gate (`.agents/code-review-checklist.md:17-18`):

- **3.3.1 Error Identification** — the error is not associated with the field that produced it (no `aria-describedby`, no `aria-invalid` on the password input).
- **4.1.3 Status Messages** — nothing announces the change; there is no `aria-live` region, and a disabled `<button>` is removed from the accessibility tree's interactive flow in several AT/browser pairs, so a screen-reader user may never encounter the text at all.
- The message is also unreachable by keyboard for the same reason.

This surface is scanned by `candidate-a11y.spec.ts` (`cand-settings`), but axe cannot detect it: axe checks that a button *has* an accessible name, not that the name is semantically an error.

**Fix:** render the error in a live region tied to the input, and keep the button label static.

```svelte
<PasswordSetter … aria-invalid={!!validationError} aria-describedby="password-error" />
<div id="password-error" role="alert" aria-live="polite" class="text-error">{validationError ?? ''}</div>
<Button text={t('candidateApp.settings.password.update')} disabled={!canSubmit} … />
```

---

### WR-08: The adapter-boundary ESLint guard misses relative imports, and `adminWriter.ts` is absent from the allowlist

**File:** `apps/frontend/eslint.config.mjs:27-36, 193-197`

**Issue:** Two coupled gaps.

1. The import ban is `{ regex: '^\\$lib/(supabase|api/adapters)(/|$)' }` — anchored to the `$lib` alias. A **relative** path into the adapter is not matched, and the inherited deep-relative-`lib` pattern (`^(\.\./){2,}lib(/|$)`) does not catch it either from inside `src/lib/`. So `import { x } from './adapters/supabase/…'` or `'../adapters/supabase/…'` crosses the boundary with a green lint.
2. That gap is already load-bearing: `src/lib/api/adminWriter.ts:1` is `export { adminWriter } from './adapters/supabase/adminWriter';` — a **fourth** re-export selector that is **not** on `ADAPTER_BOUNDARY_ALLOWLIST`. It passes lint only because of gap (1). The allowlist comment at line 33 says *"Three one-line re-export selectors"* and enumerates `dataProvider.ts` / `dataWriter.ts` / `feedbackWriter.ts` — the fourth was overlooked, and the guard is structurally unable to report it.

The guard block's flat-config REPLACE handling is otherwise correct (verified byte-for-byte against `shared-config`); this is a coverage hole, not a deletion.

**Fix:** add the missing entry and close the relative-path hole.

```js
  'src/lib/api/feedbackWriter.ts',
+ 'src/lib/api/adminWriter.ts',
…
  {
    regex: '(^\\$lib/|(\\.{1,2}/)+)(api/)?adapters/supabase(/|$)',
    message: 'The Supabase adapter must not be imported directly. Use the $lib/api/{dataProvider,dataWriter,adminWriter,feedbackWriter} selectors instead.'
  }
```
and add a firing case for the relative form to `eslint-adapter-boundary-guard.test.ts`'s `VIOLATIONS` — the current four fixtures all use `$lib` or `@supabase/`, so the hole is invisible to the guard's own self-test.

---

### WR-09: `console.error` survivors bypass the structured logger the phase just installed

**File:** `apps/frontend/src/hooks.server.ts:93`; `apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte:35`; `apps/frontend/src/routes/api/auth/login/+server.ts:41`; plus all six `api/admin/jobs/*` catch blocks

**Issue:** 157-17 migrated every `logDebugError` to the shared `log`, but the pre-existing `console.error` calls were not swept — including the two highest-value ones. `hooks.server.ts:93` is SvelteKit's **global** server error handler:

```ts
export const handleError: HandleServerError = async ({ error }) => {
  console.error('Server error:', error);
  return { message: '500' };
};
```

That is the single most important record in the app, and it is the one emitted outside the structured format, with no `severityText`, no `time`, and no routing through a future `sink`. `configureLogger` is called ten lines above it. The result is a split log stream where half the server errors are structured JSON records and half are raw console dumps.

**Fix:**

```ts
export const handleError: HandleServerError = async ({ error, event }) => {
  log.error('Unhandled server error', { err: error, route: event.route?.id });
  return { message: '500' };
};
```
and the same treatment for the API-route catches.

---

### WR-10: Seven migrated `log.error` calls drop the error object, discarding the stack

**File:** `apps/frontend/src/lib/auth/getUserData.ts:30`; `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:64`; `apps/frontend/src/routes/api/auth/login/+server.ts:29, 39`; `apps/frontend/src/routes/admin/(protected)/+layout.ts:46`; `.../argument-condensation/+page.server.ts:48`; `.../question-info/+page.server.ts:78`; `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts:93`; `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:51`

**Issue:** These interpolate `e?.message` into the message string and pass no `fields`:

```ts
log.error(`Error fetching user data: ${e?.message ?? 'No error message'}`);
```

`logger.ts:40-47`'s `serialiseError` exists specifically because *"`JSON.stringify(new Error('x'))` is `{}` … a structured emitter that simply attached the `Error` would lose every stack trace and be strictly worse than the `console.error` it replaces."* Omitting `{ err: e }` throws away the same stack the module was written to preserve, and defeats the `err.type` / `err.stack` fields on `LogRecord`. Four sites in this lot do it correctly (`+layout.server.ts:45`, `preregister/+layout.server.ts:18`, `wrapper.ts:30`, `imputeParentAnswers.ts:119`, `persistedState.svelte.ts:118`), so the migration is internally inconsistent. Secondary: `e` in these `.catch((e) => …)` callbacks is implicitly `any`, which CLAUDE.md's *"Use TypeScript strictly — avoid `any`"* rule discourages.

**Fix:**

```ts
log.error('Error fetching user data', { err: e });
```
Let `serialiseError` extract `message`/`stack`; keep the message a stable, greppable constant string.

---

### WR-11: `hooks.server.ts` candidate auth handler — four defects in ~15 lines

**File:** `apps/frontend/src/hooks.server.ts:65-88`

**Issue:**

1. **Line 83 — unencoded query interpolation.** `?redirectTo=${cleanPath.substring(1)}` is not escaped. A pathname containing `&` or `#` truncates the value at the parse boundary, silently sending the user to the wrong post-login destination. (`routes/loginRedirectTarget.ts`'s `safeRedirectTarget` correctly closes the *open-redirect* half, so this is a correctness bug rather than a security one — but the encoding is still missing.)
2. **Line 82 — unescaped interpolation into a `RegExp`.** `new RegExp(\`^/${locale}\`)` builds a pattern from `getLocale()`. The value comes from a fixed supported-locale set today, so it is not exploitable, but building regexes from non-literal strings without `escapeRegExp` is the shape that becomes injection the day locales become configurable.
3. **Line 76 — over-broad path test.** `pathname.includes('/candidate')` fires on any voter URL containing that substring (e.g. `/results/candidate/123`), forcing an unnecessary `safeGetSession()` round trip on voter routes.
4. **Line 78 — missing leading slash.** `pathname.endsWith('candidate/login')` also matches `/xcandidate/login`.

**Fix:**

```ts
const LOCALE_PREFIX = new RegExp(`^/${escapeRegExp(locale)}(?=/|$)`);
if (pathname === '/candidate' || pathname.startsWith('/candidate/')) {
  const { session } = await event.locals.safeGetSession();
  if (session && pathname.endsWith('/candidate/login')) redirect(303, `/${locale}/candidate`);
  if (!session && route.id.includes('(protected)')) {
    const cleanPath = pathname.replace(LOCALE_PREFIX, '');
    redirect(303, `/${locale}/candidate/login?redirectTo=${encodeURIComponent(cleanPath.replace(/^\//, ''))}`);
  }
}
```

---

### WR-12: `??` in `candidateUserDataState.#current` discards a legitimate `null` terms-of-use value

**File:** `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts:62`

**Issue:**

```ts
termsOfUseAccepted: this.#editedTermsOfUseAccepted ?? termsOfUseAccepted,
```

`setTermsOfUseAccepted` accepts `string | null` (line 203) and `#editedTermsOfUseAccepted` is `string | null | undefined` (line 44) — three distinct states, where `null` means *"explicitly revoked"* and `undefined` means *"not edited"*. `??` collapses `null` into the not-edited branch, so a revocation is invisible in `current` while `#unsavedProperties` (line 132, `!== undefined`) *does* count it as unsaved and `save()` (line 253, `!== undefined`) *does* persist it. Three sentinel checks, two semantics.

Currently latent — the only caller passes a date string (`(protected)/+layout.svelte:47`) — but the discrepancy will surface the first time revocation is wired up, as a UI that shows acceptance while the DB says otherwise.

**Fix:** use the same sentinel test as its two siblings.

```ts
termsOfUseAccepted: this.#editedTermsOfUseAccepted !== undefined ? this.#editedTermsOfUseAccepted : termsOfUseAccepted,
```

---

### WR-13: Tracking payloads (including the session id) are logged verbatim under `PUBLIC_DEBUG`

**File:** `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts:137, 162`; enabled by `apps/frontend/src/hooks.client.ts:7`

**Issue:**

```ts
log.debug('Tracking event dispatched', { name, data: dataToSend });        // :162
log.debug(`No pageviewEvent is available for events: ${JSON.stringify(this.#unsubmittedEvents)}`);  // :137
```

`dataToSend` is `purgeNullish({ vaaSessionId: this.sessionId.current, ...data })` — the persistent session identifier plus arbitrary per-event payload. `hooks.client.ts:7` enables `debug` when `import.meta.env.DEV || constants.PUBLIC_DEBUG`. `PUBLIC_DEBUG` is a *public* (`PUBLIC_`-prefixed, browser-visible) runtime variable, so switching it on in a deployed environment writes user session identifiers and behavioural payloads to every visitor's browser console. Line 137 additionally `JSON.stringify`s the whole unsubmitted-event queue into a message string, which bypasses the `attributes` structuring entirely.

**Fix:** log the shape, not the contents, and never the session id.

```ts
log.debug('Tracking event dispatched', { name, dataKeys: Object.keys(dataToSend) });
log.debug('No pageviewEvent available', { pendingEventCount: this.#unsubmittedEvents.length });
```

---

### WR-14: Unreachable `'loading'` branch in the candidate protected layout

**File:** `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:89-91, 124-125`

**Issue:** `layoutState` is typed `'loading' | 'error' | 'terms' | 'ready'`, but the expression that produces it is a two-level ternary that can only ever yield `'error'`, `'terms'` or `'ready'`. The template's `{:else if layoutState === 'loading'} <Loading />` is therefore dead, and TypeScript cannot flag it because the union was widened by the explicit `$derived<…>` annotation. The comment *"4-way enum retained — clean readable branch shape"* documents the intent but leaves a `<Loading />` component that can never render — a maintainer reading the template will reasonably conclude a loading state is handled when none is.

**Fix:** narrow the union to the three reachable members and delete the branch, or add the missing producer if a loading state is actually wanted (the JSDoc at line 67 says it deliberately is not).

## Info

### IN-01: Error message names the wrong flow

**File:** `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte:51`
**Issue:** `log.error(\`Error with register: ${e?.message}\`)` inside the settings **password-change** handler. Copy-paste from the register page; will misdirect anyone grepping logs.
**Fix:** `log.error('Error changing password', { err: e });`

### IN-02: Orphaned i18n key after the current-password removal

**File:** `apps/frontend/messages/en/candidateApp.settings.json` (and the six sibling locales)
**Issue:** `candidateApp.settings.password.areSame` — *"The new password is the same as the current password"* — is now unreachable: with no current-password input there is nothing to compare against. It survives in all seven locale files and in the generated `translationKey.ts:283`. (`password.current` / `.currentDescription` were correctly removed.)
**Fix:** delete the key from all seven locale files and regenerate `translationKey.ts`.

### IN-03: Two parallel translation trees

**File:** `apps/frontend/messages/**` vs `apps/frontend/src/lib/i18n/translations/**`
**Issue:** Both trees carry `candidateApp.settings.json` with overlapping keys. `wrapper.ts` reads only the Paraglide-compiled `$lib/paraglide/messages`, so the `src/lib/i18n/translations/` copies appear to be dead weight that will drift.
**Fix:** confirm the legacy tree is unused and remove it, or document which is authoritative.

### IN-04: Unreachable defensive check in `prepareDataWriter`

**File:** `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts:13-16`
**Issue:** `if (!writer)` guards a parameter typed `TWriter extends UniversalAdapter` — non-nullable, and every caller passes a module-level `const`. The error message references `staticSettings.dataAdapter.type` as if adapters were still selectable, which CLAUDE.md says they are not (*"No adapter switch — Supabase is the only production adapter"*).
**Fix:** drop the check, or keep it with a comment noting it guards a hypothetical `undefined` export.

### IN-05: Redundant `getJob` lookups in both job features

**File:** `apps/frontend/src/lib/server/admin/features/condenseArguments.ts:189-198, 202, 238-240`; `.../generateQuestionInfo.ts:187-196, 200, 236-238`
**Issue:** `const job = getJob(jobId); if (job) { await adminWriter.insertJobResult({ data: { ..._getResultData(), … } }) }` — `job` is used only as a truthiness gate, and `_getResultData()` immediately calls `getJob(jobId)` again and throws if absent. Three lookups per save path, two code paths for the same missing-job condition.
**Fix:** let `_getResultData()` own the lookup and return `undefined` when the job is gone; drop the outer `job` variable.

### IN-06: Dead write to `locals.currentLocale`

**File:** `apps/frontend/src/routes/api/auth/login/+server.ts:45-48`
**Issue:** `locals.currentLocale = language` mutates request locals in a `+server.ts` handler that returns `json(...)` immediately. `paraglideHandle` has already run and consumed the locale, and nothing reads `locals.currentLocale` after the handler returns. No effect. (Moot if CR-05's deletion lands.)

### IN-07: Allowlist annotation drift in the ESLint config

**File:** `apps/frontend/eslint.config.mjs:33, 43-44`
**Issue:** Line 33 says *"Three one-line re-export selectors"* — there are four (see WR-08). Line 43's annotation for `candidate/(protected)/+layout.server.ts` says *"two of its three sites hand the cookie-capable client to the adapter … only the third is true leakage"*, but the file now has a **fourth** boundary reference: the `import type { SupabaseAdapterConfig } from '$lib/api/adapters/supabase/supabaseAdapter.type'` added at line 18 by 157. The counts in the annotations are now stale, which matters because the file's stated purpose is to be a precise, shrinking Phase-158 worklist.

### IN-08: `lintFiles` result destructure can be `undefined`

**File:** `apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts:215-216`
**Issue:** `const [result] = await eslint.lintFiles([probePath]); expect(boundaryMessages(result.messages))…` — `lintFiles` returns an empty array if the path is ignored or missing, so `result` would be `undefined` and the assertion would fail with an opaque `TypeError` rather than a diagnosis. Every other probe in the file uses `lintText`, which always returns one result.
**Fix:** `expect(result, \`lintFiles returned no result for ${probePath}\`).toBeDefined();` before the message assertion.

---

_Reviewed: 2026-08-30_
_Reviewer: Claude (gsd-code-reviewer) — Lot C_
_Depth: standard_

---

