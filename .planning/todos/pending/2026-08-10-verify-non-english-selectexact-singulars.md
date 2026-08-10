# Native-speaker review of the six constructed non-English `selectExact` singulars

**Captured:** 2026-08-10
**Source:** Phase 134 D-18 (`134-CONTEXT.md`), strings from `134-03-SUMMARY.md`; UAT item at
`.planning/phases/134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure/134-UAT.md` test 1
**Type:** i18n / content review — **must be discharged before v2.14 milestone close**

## Observation

Phase 134 fixed FIX-02 by adding `questions.multiChoice.selectExact` to the runtime Paraglide
catalog as an MF2 plural declaration, so a "pick exactly 1" constraint reads `Select 1 option.`
instead of the ungrammatical `Select 1 options.`. That required a **singular** branch per locale.

No singular form existed anywhere in the repo to copy — `src/lib/i18n/translations/` carries only
the plain `Select {count} options.` shape. The six non-English singulars were therefore
**constructed** by research from the existing plural strings, at MEDIUM confidence, and shipped
under D-18 on the explicit condition that a native speaker corrects the wording before milestone
close. `en` was authored, not constructed, and needs no review.

## The strings under review

Quoted verbatim from `apps/frontend/messages/{locale}/questions.json` as shipped in `3b098a22e`.
Only the singular is under review; the plural is the pre-existing, natively authored baseline.

| Locale | Singular (`countPlural=one`) — UNDER REVIEW | Plural (`countPlural=other`) — baseline |
| --- | --- | --- |
| `da` | `Vælg 1 mulighed.` | `Vælg {count} muligheder.` |
| `et` | `Vali 1 valik.` | `Vali {count} valikut.` |
| `fi` | `Valitse 1 vaihtoehto.` | `Valitse {count} vaihtoehtoa.` |
| `fr` | `Sélectionnez 1 option.` | `Sélectionnez {count} options.` |
| `lb` | `Wielt 1 Optioun.` | `Wielt {count} Optiounen.` |
| `sv` | `Välj 1 alternativ.` | `Välj {count} alternativ.` |

**`sv` is not a copy-paste bug.** `Välj 1 alternativ.` and `Välj 2 alternativ.` differ only in the
numeral because Swedish *alternativ* is invariant in the plural. Expected — but it is exactly the
pair a reviewer will suspect, so confirm rather than assume.

## Mechanism / why it cannot be checked automatically

The helper renders only when a multi-choice opinion question's effective minimum equals its
effective maximum (`apps/frontend/src/lib/components/questions/QuestionChoices.svelte:420-421`).
The seeded `e2e/base` multi-choice question carries a 2..3 window and therefore renders
`selectRange`, so **no E2E spec ever exercises the singular branch** and walking the seeded journey
will not show the string. Plan 03's build-time render proof confirms the correct branch is selected
and that no locale falls through to its raw key path — it says nothing about whether the words are
right. A grammatically wrong but well-formed string passes prettier, the key-set parity check,
svelte-check and the full E2E suite alike.

## Fix shape if a string is wrong

One-line edit to the `countPlural=one` value in `apps/frontend/messages/{locale}/questions.json`.
No code change, no catalog-shape change. Do **not** touch the `countPlural=other` values — they
mirror `src/lib/i18n/translations/`, which the cross-catalog key-set parity check compares against.

## Why this todo exists alongside the UAT item

D-18 makes the review a required deliverable, not a note. The phase UAT file is the primary
carrier, but `/gsd-verify-work` may regenerate it; this todo is the durable half so the review
item cannot vanish with a regeneration.
