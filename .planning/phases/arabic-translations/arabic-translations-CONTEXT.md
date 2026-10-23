# Phase arabic-translations: Arabic Translation Content - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the English-seeded Arabic (`ar`) translations with **actual Modern Standard Arabic (MSA / فُصْحَى)** content across the frontend (46 JSON files, ~697 keys) and the backend (`dynamic.json`), so the already-shipped RTL layout renders real Arabic copy.

Hard invariants the translation must preserve:
- **Key parity** with `en` — `frontend/src/lib/i18n/tests/translations.test.ts` must stay green.
- **ICU/interpolation placeholders** — `{token}`, `{count, plural, …}`, date skeletons (`{date, date, ::yyyyMMdd}`).
- **Embedded HTML** — `<p>`, `<ul>`, `<li>`, `<h3>`, `<a href="{url}">…</a>`.
- **Embedded LTR tokens** — URLs, emails, brand/proper names, emoji (🖋️, 👍).

This is the content task explicitly deferred by the RTL/bidi phase. RTL *infrastructure* (locale `dir`, logical CSS, mirrored icons, fonts, bidi isolation, key-parity test) already shipped — this phase only produces translation content.

</domain>

<decisions>
## Implementation Decisions

### Translation method
- **D-01:** Claude (this assistant) produces the Arabic translations directly — no external/human translator in this phase. Register is **Modern Standard Arabic (MSA)**, formal and region-neutral (locked by PHASE.md).
- **D-02:** **Glossary-first.** The first plan unit builds a locked glossary mapping recurring VAA domain terms (candidate, party, constituency, election, opinion, alliance, faction, etc.) to one fixed Arabic rendering each. All 46 files are then translated against that glossary so the same Arabic word is used for a given term everywhere. The glossary also gives the (postponed) linguistic reviewer a stable vocabulary to check.

### Coverage scope
- **D-03:** **Full coverage** — all 46 frontend files **plus** backend `dynamic.json`. No tiering, no staging by app.
- **D-04:** `adminApp.*` strings (9 files) **are translated** in this phase, even though admin-app RTL *layout* remains deferred. (Strings ≠ layout — translating the strings does not require admin RTL to ship.)

### Brand / proper-noun handling
- **D-05:** Distinguish per string:
  - **True proper nouns** (e.g. `OpenVAA`, real product/org/service names) → keep in **Latin script, bidi-isolated** so they don't reorder surrounding RTL text (consistent with RTL DECISIONS A8). `{appName}` and similar interpolated names need no action — they're runtime values.
  - **Descriptive names** (e.g. "Election Compass") → **translate to Arabic** — these are descriptive phrases, not registered proper nouns.

### Token / placeholder safety
- **D-06:** Build a **one-time pre-merge check script** (run-once verification, **not** added to the permanent vitest suite). For every key it must confirm the `ar` value preserves the `en` value's:
  - placeholder token set (`{…}` names),
  - ICU structure (plural/select/date-skeleton constructs present),
  - embedded HTML tag set (`<a>`/`<p>`/`<ul>`/`<li>`/`<h3>` …),
  - URLs / `href` targets and Latin-kept brand names.
  The existing **key-parity test stays green as a separate, permanent guardrail** — the new script covers what that test does *not* (it only compares key names).

### Review & merge gate
- **D-07:** Native-speaker **linguistic correctness review is POSTPONED.** Ship the machine translation now. **Definition of done for this phase:** Arabic copy present (not English passthrough) for the in-scope key set; key-parity test green; the D-06 placeholder check passes; backend `dynamic.json` loads via `appCustomization.ts`; spot RTL in-context rendering looks correct.
- **D-08:** Native Arabic linguistic sign-off is tracked as a **deferred follow-up**, not a blocker for this phase's merge.

### Claude's Discretion
- Exact glossary term selection and MSA phrasing.
- **Arabic ICU plural categories** — Arabic uses `zero/one/two/few/many/other`; the translator may expand plural forms *inside* a value (the key-parity test checks key names only, so this won't break parity). Use correct Arabic plural rules where the `en` value uses ICU `plural`.
- Whether the D-06 check script is committed as a dev utility or kept as a throwaway (default: commit under a `scripts`/tooling path but do **not** wire it into CI — keeps it one-time per D-06).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & deferral origin
- `.planning/phases/arabic-translations/PHASE.md` — scope anchor: goal, in/out of scope, success criteria, MSA register lock.
- `.planning/phases/rtl-bidi-support/SUMMARY.md` — what the RTL phase shipped; "Deferred → Arabic translation content" is the origin of this phase.
- `.planning/phases/rtl-bidi-support/DECISIONS.md` — portable RTL principles; especially **A5** (`dir="auto"` on author/user content), **A8** (embedded LTR tokens isolated; `Intl` digit formatting deferred), **A10** (RTL QA gate).

### Translation targets & guardrails
- `frontend/src/lib/i18n/translations/en/` — **source of truth** for keys, ICU placeholders, embedded HTML, and tokens. Translate against this.
- `frontend/src/lib/i18n/translations/ar/` — the 46 target files (currently English-seeded) to be replaced with Arabic.
- `frontend/src/lib/i18n/translations/index.ts` — locales map (`ar: 'العربية'`) and the `keys` list the parity test validates against.
- `frontend/src/lib/i18n/tests/translations.test.ts` — **key-parity guardrail; MUST stay green.** Note it compares *key names only* (flattened), not placeholder/ICU/HTML integrity — that gap is what D-06 covers.
- `backend/vaa-strapi/src/util/translations/ar/dynamic.json` — backend dynamic/override content target (also has `en/da/et/fi/sv` siblings to mirror key-wise).
- `backend/vaa-strapi/src/util/appCustomization.ts` — imports `./translations/ar/dynamic.json` (line 2); this is the load path the success criterion depends on.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `translations.test.ts`'s `flattenKeys()` recursion → the D-06 pre-merge check script can reuse the same flatten-then-diff approach, but compare **placeholder/ICU/HTML token sets per key** instead of just key names.
- The backend `dynamic.json` set already has `en/da/et/fi/sv` peers — `ar` mirrors their key shape; use a sibling (e.g. `en/dynamic.json`) as the structural reference.

### Established Patterns
- Interpolation is **ICU MessageFormat** throughout: `{token}`, `{count, plural, =0 {…} other {…}}`, date skeletons (`{consentDate, date, ::yyyyMMd}`). Files with plurals include `common`, `results`, `questions`, `entityList`, `candidateApp.questions`, `feedback`, `about`, `components`.
- Some values embed **raw HTML** (`<p>`, `<ul>`, `<li>`, `<h3>`, `<a href="{registrationUrl}">`), notably email templates (`candidateApp.preregister.json` → `email.{subject,text,html}`) and info/help content. `\n` line breaks in email `text` variants must be preserved.
- Emoji appear inside values (`heroEmoji`, e.g. 🖋️, 👍) — keep them.

### Integration Points
- Frontend: `ar` is loaded from `translations/` via `index.ts`; the locale is already registered with `dir:'rtl'` from the RTL phase.
- Backend: `dynamic.json` flows into Strapi via `appCustomization.ts` `getDynamicTranslations`.

</code_context>

<specifics>
## Specific Ideas

- "Election Compass" → **translate descriptively** to Arabic (it's a descriptive phrase, not a proper noun). "OpenVAA" → **keep Latin**, bidi-isolated.
- Glossary terms to seed from observed keys: candidate(singular/plural), party/organization, constituency, election, opinion, alliance, faction, question, results, answer.
- Email templates (`candidateApp.preregister.json`, possibly others): preserve `{firstName}`, `{lastName}`, `{registrationUrl}`, the `<a href>`, and `\n` newlines in the `text` form.

</specifics>

<deferred>
## Deferred Ideas

- **Native-speaker Arabic linguistic correctness review** — this phase ships machine (Claude) translation; formal MSA sign-off is postponed to a tracked follow-up (D-07/D-08).
- **Locale-aware `Intl` digit/number formatting** (Arabic-Indic numerals) — stays deferred per RTL DECISIONS A8; `dir="auto"` already isolates numbers correctly.
- **Admin app RTL *layout*** — still deferred; only admin *strings* are translated here.
- **Promoting the D-06 placeholder check into the permanent CI/vitest suite** — explicitly chose one-time for now; can be promoted later if drift recurs.
- **LLM Arabic prompt support** (`packages/llm`) and **Faker `ar` mock data** — deferred per RTL DECISIONS.

None of the above are scope creep — they are the RTL phase's existing deferrals, restated so they aren't accidentally pulled in.

</deferred>

---

*Phase: arabic-translations-Arabic Translation Content*
*Context gathered: 2026-06-14*
