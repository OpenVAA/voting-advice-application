# Phase: Arabic Translation Content

**Status:** Not planned yet (scope anchor — created 2026-06-14)
**Branch:** `feat-rtl-locales` (same line as the RTL/bidi phase)
**Convention note:** This `.planning/` is a minimal standalone setup with **no ROADMAP.md**. Like
`phases/rtl-bidi-support/`, this phase is authored directly as a phase directory. This `PHASE.md`
holds the scope that a ROADMAP entry would otherwise carry; `/gsd-discuss-phase` then `/gsd-plan-phase`
(pointed at this directory) take it from here.

## Goal

Replace the English-seeded Arabic (`ar`) translations with **actual Arabic content** across the
frontend and backend, so the already-shipped RTL layout renders real Arabic copy — preserving key
parity with `en`, ICU/interpolation placeholders, and embedded LTR tokens.

**Locked decision:** Translations use **Modern Standard Arabic (MSA / فُصْحَى)** — the formal,
region-neutral register — not any regional dialect. This sets the tone/register for every translated
string and the review bar.

This is the content task **explicitly deferred** by the RTL/bidi phase — see
`.planning/phases/rtl-bidi-support/SUMMARY.md` ("Deferred → Arabic translation content") and
`DECISIONS.md` ("Deferred / out of scope → Full human translation of all keys").

## Depends on

- `phases/rtl-bidi-support/` (P1–P6, complete). That phase already delivered:
  - `ar` registered as a first-class locale with `dir: 'rtl'` (frontend i18n + Strapi).
  - The full RTL layout (logical CSS, mirrored icons, script-aware fonts, bidi content isolation).
  - Key-parity tests for `ar` vs `en` (P6) — these are the guardrail this phase must keep green.

## Scope (anticipated plan units)

1. **Frontend UI strings** — `frontend/src/lib/i18n/translations/ar/` (46 files, ~697 keys, currently
   copied from `en`). Translate to Arabic.
2. **Backend dynamic content** — `backend/vaa-strapi/src/util/translations/ar/dynamic.json`. Translate
   the dynamic/override keys.
3. **QA gate** — key-parity tests still pass; ICU/placeholder and embedded-LTR-token integrity verified
   (no `{count}`, `<a>`, URLs, brand names broken or reordered); spot RTL rendering review of translated
   copy in context.

## Out of scope (stay deferred)

- Locale-aware `Intl` digit/number formatting (Arabic-Indic numerals) — separate A8 refinement.
- LLM Arabic prompt support; Arabic mock data (Faker `ar`).
- Admin app (`lib/admin/**`) RTL **layout** — still deferred; whether admin *strings* get translated
  here is an open question for discuss-phase (the `adminApp.*` key files exist in `ar/`).

## Open questions for discuss/plan

- **Translation method:** human, machine-assisted (LLM), or hybrid with human review? Affects quality
  bar, plan shape, and review gate.
- **Coverage priority:** translate all 46 files, or prioritize voter-facing keys first and stage the
  rest (e.g. defer `adminApp.*` given admin RTL is deferred)?
- **Review process:** who validates Arabic correctness, and how is that captured before merge?
- **Placeholder safety:** automated check to diff placeholder sets (`{…}`, tags, URLs) between `en` and
  `ar` per key, so translation never drops/renames an interpolation token.

## Success criteria

- Arabic copy present (not English passthrough) for the in-scope key set, reading correctly under RTL.
- `ar`↔`en` key parity tests pass; no ICU/placeholder/LTR-token regressions.
- Backend `dynamic.json` Arabic content loads via the existing `appCustomization.ts` import path.
