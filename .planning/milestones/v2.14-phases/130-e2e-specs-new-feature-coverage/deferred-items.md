# Phase 130 — Deferred / Discovered Items

Out-of-scope discoveries logged during execution (per the executor scope
boundary — not fixed here, surfaced for a follow-up product phase).

## From plan 130-05 (candidate multi-choice / categorical / boolean type-specific)

### D1. Multi-choice helper text renders the raw i18n key at runtime (BLOCKER-130-05)

- **Discovered during:** Task 1 (step 18.5), candidate multi-choice question editor.
- **Symptom:** `question-choice-helper` (`QuestionChoices.svelte`) renders the
  literal string `questions.multiChoice.selectRange` instead of
  "Select 2 to 3 options." in the running app.
- **Root cause:** Commit `c0eeb864c` (feat 129-06) added
  `questions.multiChoice.{selectRange,selectExact}` to the type-generation source
  `apps/frontend/src/lib/i18n/translations/{locale}/questions.json` (which is why
  the key type-checks via the generated `translationKey.ts` union), but NOT to the
  runtime Paraglide message catalog `apps/frontend/messages/{locale}/questions.json`.
  `t()` (`apps/frontend/src/lib/i18n/wrapper.ts`) resolves against Paraglide
  (`$lib/paraglide/messages`) and falls through to returning the raw key when the
  message is absent.
- **Impact:** Every multi-choice categorical opinion/info question with authored
  min/max shows an untranslated key as its helper text to real users (all 7 locales).
- **Fix (follow-up product phase, NOT this specs-only phase):** add the
  `questions.multiChoice.selectRange` (params min/max) and
  `questions.multiChoice.selectExact` (param count) entries to
  `apps/frontend/messages/{locale}/questions.json` for every locale, mirroring the
  values already in `src/lib/i18n/translations/{locale}/questions.json`.
- **Test handling:** step 18.5 asserts the helper's VISIBILITY (a real
  type-specific contract element — the helper only renders for a multi-choice
  question with min/max constraints) but deliberately WITHHOLDS the `/2.*3/`
  content assertion, because this specs-only phase must not patch product to make
  an assertion pass and asserting the raw-key text would lock in the bug. Re-add
  the `/2.*3/` content assertion once the messages/ catalog is fixed.

### D2. Overview card treats a saved boolean `false` as unanswered

- **Discovered during:** Task 2 (step 18.6), candidate boolean opinion question.
- **Symptom:** After saving a boolean opinion answer of `false`, the candidate
  `/candidate/questions` overview card renders NO answer-display markup (looks
  unanswered).
- **Root cause:** `getSavedAnswer` in
  `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58`
  guards with `if (!localizedAnswer?.value) return undefined;` — a truthiness
  check that discards a legitimately-saved `false` boolean value.
- **Impact:** Candidates who answer a boolean opinion question "No" see the
  question presented as still-unanswered on the overview (and in the completion
  gating that reads the same helper).
- **Fix (follow-up product phase):** replace the falsy guard with an explicit
  null/undefined check (e.g. `if (localizedAnswer?.value == null) return undefined;`)
  so a stored `false` is preserved.
- **Test handling:** step 18.6 selects the truthy "yes" choice for the boolean so
  the answered-display round-trip is observable without depending on (or patching)
  the buggy falsy guard. The radio type + choice-count (2) assertions — the D-02
  essence — are unaffected and select-independent.
