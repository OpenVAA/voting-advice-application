---
created: '2026-09-03T07:20:00.000Z'
title: Are $lib/i18n's translate / translateObject still needed now that getLocalized lives in app-shared?
area: i18n
files:
  - apps/frontend/src/lib/i18n/init.ts
  - packages/app-shared/src/data/getLocalized.ts
  - apps/frontend/src/lib/api/utils/translateQuestionTerms.ts
  - apps/frontend/src/lib/api/utils/translateHeroContent.ts
  - apps/frontend/src/lib/api/utils/translateVideoContent.ts
blocked_on: 'nothing - the precondition landed in Phase 157. Needs an owning phase and a behaviour decision.'
---

## Status: filed, not implemented - and the blocker the research named is DISCHARGED

Phase 159 plan 11 was told to file this "blocked on Phase 157's app-shared extraction". Re-measured at
`05dfe74f2`, **that extraction has landed**, so filing it as blocked would have propagated a false premise.
This entry records what is actually true and what the question now costs to answer.

## The review comment

`apps/frontend/src/lib/i18n/init.ts:48` - PR #869 (kaljarv), verbatim:

> Check whether these utils are any longer needed after the extraction of translation utils to app-shared

(`159-RESEARCH.md` cites `:52`; the two helpers begin at **`:48`** (`translate`) and **`:56`**
(`translateObject`) at this HEAD.)

## What the research said, and what is measured now

`159-RESEARCH.md` § "The six uncovered triage comments", row 2, makes three supporting claims. **Two of
the three are false at this HEAD, and the conclusion they supported is false with them.**

| Research claim | Measured at `05dfe74f2` | Verdict |
|---|---|---|
| "the app-shared extraction the comment presupposes has not landed here yet" | `packages/app-shared/src/data/getLocalized.ts` exists, is exported from the barrel (`packages/app-shared/src/index.ts:5`), and has a 20-case colocated test | **FALSE - it landed** |
| "nothing imports them from `'$lib/i18n'` directly (**0** such imports)" | **three** modules import them directly: `api/utils/translateQuestionTerms.ts:1` (`translate` + `translateObject`), `api/utils/translateHeroContent.ts:2`, `api/utils/translateVideoContent.ts:1` | **FALSE - 3, not 0** |
| "`localized.type.ts` is the only app-shared file mentioning translation, and it is a type" | three app-shared files mention it now (`localized.type.ts`, `data/schemas/storedAnswers.schema.ts` and its test); still none of those three is a utility, but `getLocalized.ts` above is | conclusion superseded |

**Who landed it:** Phase 157 (Adapter Boundary & Typing), success criterion 5 - "`getLocalized` and its
test are colocated with `packages/app-shared/src/data/localized.type.ts` and use those types". Phase 157
**closed 2026-08-31**, 18/18 plans. So the precondition is on the tree and the comment's question is now
answerable.

## Why it is still filed rather than answered here

Not because it is blocked. Because **answering it is a behaviour decision plus a migration with its own
tests**, and Phase 159's boundary is components and contexts - `159-11-PLAN.md` declares exactly two paths
in `files_modified`, and neither is the i18n layer.

## The measured starting point for whoever answers it

There are now **three** translation implementations reachable from the frontend. They are not
interchangeable, which is the whole substance of the question.

**1. `$lib/i18n` - `translate` / `translateObject`** (`init.ts:48`, `:56`). Consumers: the three
`api/utils/translate*` modules above, plus every component reached through
`i18nContext.type.ts` -> `componentContext` -> `appContext.translate`.

**2. `@openvaa/app-shared` - `getLocalized`** (`getLocalized.ts:15`). Consumer:
`api/adapters/supabase/utils/localizeRow.ts:1` (two call sites). Mirrors the SQL `get_localized()` in
`apps/supabase/supabase/schema/000-functions.sql`.

**3. `@openvaa/data` - `translate`** (`packages/data/src/i18n/translate.ts:13`). Consumer:
`lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts:2`. Operates on a different shape
entirely - `TRANSLATIONS_KEY`-wrapped `LocalizedValue`s, recursively - so it is not a candidate to replace
either of the other two and is listed only so the next reader does not rediscover it.

**Where 1 and 2 actually differ** - each row is a behaviour change if `translate` is replaced by
`getLocalized`:

| | `$lib/i18n` `translate` / `translateObject` | app-shared `getLocalized` |
|---|---|---|
| Locale matching | soft match via `i18n/utils/matchLocale.ts` - case-insensitive, `en-GB` falls back to `en`, `*` wildcard | exact `locale in value` only |
| Empty / null entries | filtered out **before** matching, so an empty translation falls through to the next candidate | `''` is returned as-is when the key exists |
| Fallback chain | exact -> soft match -> module `defaultLocale` -> first **non-empty** key | requested -> `defaultLocale` parameter -> first key |
| Default locale | derived at module init from `staticSettings.supportedLocales` | a parameter, defaulting to the literal `'en'` |
| Miss result | `translate` -> `''`; `translateObject` -> `undefined` | `null` |
| Value type | `translateObject` is generic - resolves non-string localized values too | `string \| null` only |

**The decision the answer turns on:** whether the render side can accept exact-match-only lookup and
stop skipping empty translations. Both are user-visible - a partially translated field, and any
`xx-YY` locale code, behave differently under the two. If the answer is no, the two utilities are not
redundant and the comment resolves as "still needed"; that answer is worth writing down explicitly so
the comment is not re-raised a fourth time.

**If they are consolidated**, the three `api/utils/translate*` modules and the `i18nContext` `translate`
member are the call sites to migrate, and `matchLocale` would need a home - it has no equivalent in
app-shared.
