---
quick_id: 260726-ibp
description: Create Somali (so) translations for all i18n translation files
date: 2026-07-26
status: complete
---

# Quick Task 260726-ibp — Somali (`so`) locale

## What was delivered

`frontend/src/lib/i18n/translations/so/` — **46 JSON files, 575 translated keys**,
mirroring `en/` exactly. English was the authoritative source, Finnish the
disambiguating reference where the English was ambiguous or contained errors.

## Method

The user's directive was to **lock common terms first** so the translations stay
consistent. That shaped the whole execution:

1. **Glossary locked during planning** — the planner authored a **352-term
   glossary** (10 sections: core VAA domain, actors/surfaces, UI verbs, states,
   account/auth, agreement scale, accessibility, media, connectives, admin/AI)
   plus 5 conventions (orthography, register, capitalisation, untranslated-by-design,
   loanword policy) directly into `260726-ibp-PLAN.md`. Every entry gives
   `en | fi | so (locked) | usage note`.
2. **`so/` scaffolded by copying `en/`** — so every batch replaced values *in
   place* inside an already-correct key skeleton. Keys structurally could not be
   added, dropped, renamed, or reordered.
3. **Six agents in parallel** — one tracer (`common.json`) + five batches
   partitioned by byte size, zero file overlap. The frozen glossary was the only
   coordination surface between them.
4. **Central validation and reconciliation** — cross-batch inconsistencies were
   fixed by the orchestrator, not by the batch agents.

## Deviation from plan

The plan sequenced Task 1 (glossary + scaffold + `common.json` tracer) as a
serial wave gating the five batches. Since the glossary was already frozen *in
the plan*, the only hard dependency was the scaffold — done directly — so all six
agents ran concurrently instead. No file was owned by two agents.

## Defects found and fixed centrally

| # | Issue | Resolution |
|---|---|---|
| 1 | **`"You can …"` locked as `Waad karaysaa …`** — progressive form; Somali forms the modal periphrastically. Batch 3 corrected it in its own files, so Batches 2's 5 strings had diverged. | Rewrote 5 strings in `questions.json`, `components.json` (×2), `entityList.json` (×2) to `Waad … kartaa`. Glossary entry should be amended. |
| 2 | **Counted-noun disagreement** — `# su'aalood` (3×, Batches 2/3) vs `# su'aalo` (1×, Batch 5) for the same noun. | Aligned the outlier in `candidateApp.questions.json` to the majority `su'aalood`. |
| 3 | **`Guddiga maamulka`** for "Admin Control Panel" — *guddi* is a committee (a body of people), not a UI surface. | → `Bogga maamulka`. |
| 4 | **Bare English `comma`** inside Somali prose, contradicting the loanword rule. | → `hakadku`. |
| 5 | **`Digniino & khaladaad`** — ampersand retained where the glossary locks *and* → *iyo*. | → `Digniino iyo khaladaad`. |

## Validation

Gate script: `validateSomali.cjs` (scratchpad; see follow-up 3).

```
Gate 1 — filenames      ✓ 46 files, names match en/ and index.ts keys
Gates 2–4               ✓ 46/46 parse, key sets+order identical,
                          ICU structure preserved — 575 keys
Gate 5 — identical-to-en  27 identical values: 27 intentional, 0 accidental
✓ ALL GATES PASSED — 575 keys across 46 files
```

Plus `prettier --check` clean on all 46 files; `git status` shows nothing
modified outside `so/` and `.planning/`.

**Two checker bugs were found and fixed during validation** — both would have
produced false confidence:

- **Regex token-matching is unsound for ICU.** `en questions.…withCategorySelection`
  contains `other {However, select enough…}`; every regex form extracts `However`
  as a placeholder and demands it survive into Somali — unsatisfiable by any
  correct translation. Replaced with **AST comparison** via the repo's own
  `@formatjs/icu-messageformat-parser`, which correctly classifies it as literal
  text. Independently reproduced before accepting the diagnosis.
- **`en candidateApp.preregister.email.html` is not valid ICU** (raw HTML email
  body, `INVALID_TAG`). That is a property of the English source, not a Somali
  defect; the gate now falls back to token comparison for such values instead of
  failing.

## Open items for a native speaker

The glossary is internally consistent and defensible, but it is machine-authored.
Recommended review targets, in priority order:

1. **Numeral–noun agreement globally.** Batch 5 notes that standard Somali takes
   the *singular* after a numeral ("5 aragti"), whereas the plan's precedent used
   plural/genitive-plural forms. If the singular is correct this must change
   across all 46 files, not piecemeal.
2. **`musharraxnimo`** (nomination), **`Hagaha Doorashada`** (product name),
   **`boroofayl`** / **`fakto`** (transliterated loans).
3. **`degmo` does double duty** — locked as *degmo doorasho* (constituency) but
   also the ordinary word for *municipality*; the two will collide if a future
   string needs both.
4. **`adeegaha`** (server) vs locked **`adeegga`** (service) — distinct lexemes
   that look near-identical in the definite form.
5. Coinages for concepts the glossary did not cover: *shay* (item),
   *sanduuqaaga soo dhaca* (inbox), *serfar* (server), *Turjumaado*
   (translations), *galka farriimaha aan la rabin* (spam folder).

Several English source strings contain typos or a dropped negation
(`"collected"`, `"Feedack"`, `"anwers"`, `"nominatinon"`, `privacy` cookies
sentence). These were translated for **intent**, following the Finnish reading —
not reproduced.

## Out of scope — follow-ups

1. **`so` is not registered, so these files are inert.** Add `so: 'Soomaali'` to
   the `locales` map in `frontend/src/lib/i18n/translations/index.ts` and add `so`
   to `supportedLocales` in `packages/app-shared/src/settings/staticSettings.ts`.
2. Run `yarn sync:translations` so Strapi exposes Somali.
3. Generalise `frontend/tools/checkArabicPlaceholders/` to take `--locale`
   instead of hardcoding `ar`, and fold in the ICU-AST fix from this task's
   scratchpad gate — the regex it currently uses has the same unsoundness.
4. Native-speaker review (above).
5. Confirm ICU `date` skeleton output and plural-category behaviour under a
   running `so` locale.
