---
created: 2026-10-09T00:00:00.000Z
title: The registry and privacy statement an organization's user reads is written for candidates
area: Contestant app / legal copy
severity: minor
source: Phase 175 plan 04 (175-04-SUMMARY.md § Open for a ruling); filed by 175-13. Operator decision B2 was answered (b) on 2026-10-09 with the words "MAKE changes and i approve" (v2.16-OPERATOR-DECISIONS-2026-10-09.md); closed by the quick task .planning/quick/261009-b2-b3-b6-operator-replies, commit 3c686fc8e
owner: the operator, whose approval of the written text is outstanding; a lawyer has not read it
files:
  - apps/frontend/messages/en/dynamic.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/dynamic.json
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
---

## Finding

The message key **`dynamic.contestantAppPrivacy.registryStatement.content`** holds the registry and privacy statement of the Contestant app, in all seven locales. `TermsOfUse.svelte` renders it in two places: on the terms-of-use gate inside the protected routes, and on the public `/contestant/privacy` page. Since Phase 173 the app serves organizations, so **an organization's user reads it**, and since Phase 175 they edit a party's profile behind it.

Two of its sentences name candidates:

- the registry's name: "{appName} - Candidate Information System.";
- its sources: "Data stored in the registry is obtained from candidates through an online form, during their bank authentication, and from public electoral registers."

Phase 175 split every other sentence that named a candidate into a key per entity type. This one was left as it was, and nothing was changed, for three reasons:

1. **It is legal text.** A party's statement differs in substance, not in a noun: section 5 lists "date of birth" and section 6 "bank authentication", neither of which is true of a party. Writing a registry statement for parties in seven languages is not a translation task.
2. **The public privacy page has no selected entity**, so a text keyed on the selected entity's type has nothing to read there. Which variant that page shows is a design question no document of the phase answers.
3. **It is a deployment template** (`DATA_CONTROLLER`, `DATA_STORAGE_TERM_EG_5_YRS`) that describes the registry as a whole, not a sentence addressed to the reader as a candidate.

### What is measured and what is inferred

- Measured: the key, its two render sites and the two sentences, by plan 04's sweep of all seven locales.
- Not checked: whether any other sentence of the statement is untrue of a party beyond the two sections named above. Nobody with legal training read it.
- Phase 175 ships with the statement as it is. That is operator decision B2's recommended option; the decision document's boxes were unticked when this todo was filed.

## Options

These are B2's, restated; choosing is the operator's.

- **(a) This todo; the statement stays as it is** until someone who may write legal text does.
- **(b) One neutral statement that names neither type.** The operator supplies or approves the English text; it is then translated into the other six locales. One key, both render sites unchanged.
- **(c) A statement per entity type.** Two texts from the operator. The gate shows the selected entity's, through one more member of the per-type descriptor in `entityDescriptor.ts`; the public page needs a rule for which it shows, or shows both.

Under (b) and (c) the new text in six locales joins the native-speaker review (`2026-10-09-175-native-speaker-review-organization-editing-strings.md`).

## Resolution

**Closed 2026-10-09** under operator decision B2 (b), by the quick task `.planning/quick/261009-b2-b3-b6-operator-replies`, commit `3c686fc8e` (`fix(i18n): the registry statement names neither entity type`).

**The text was written by an agent. It awaits the operator's approval, and it has not been read by a lawyer.** The English paragraphs, before and after, are in the quick task's `SUMMARY.md`, so that they can be approved by reading one place.

- **What changed.** One key, `dynamic.contestantAppPrivacy.registryStatement.content`, in all seven catalogues; three paragraphs of its twelve. Section 3 names the registry for candidates and parties. Section 5 says whom the data is about (the users of the service and the candidates and parties they represent), no longer lists the date of birth among what is stored for everyone, and says in a sentence of its own that it is stored for a person who identified through a bank or another identity provider. Section 6 names the users of the service, the identity provider and the public electoral registers as the sources.
- **What did not.** Both render sites, the key's name, the markup, the section numbering, the nine other paragraphs and the deployment placeholders (`DATA_CONTROLLER`, `DATA_CONTACT_PERSON`, `DATA_STORAGE_TERM_EG_5_YRS`, the mail address) are byte for byte as they were. Checked by a script: one key differs per catalogue, the tag sequence and the ten headings are equal, each placeholder occurs as often as before, and the paragraphs that differ are the third, fifth and eighth.
- **Two words beyond the three changes.** In `et` and `fi` the list in section 5 began "the person's name" (`isiku nimi`, `henkilön nimi`) where English says "name"; a party's name is not a person's, so both now say "name" (`nimi`). In `fi` the rewritten sentence of section 6 also reads `tallennettavia tietoja` where it read `tallennettavat tietoja`.
- **The vocabulary** is "party" for an organization, as `common.organization` has it in every catalogue. No catalogue had a word for "identity provider"; each new text builds one from words its own catalogue already used for the bank identification (`identifikationstjeneste`, `isikutuvastusteenus`, `tunnistautumispalvelu`, `service d’identification`, `Identifikatiounsservice`, `identifieringstjänst`).
- **The six non-English texts are constructed**: four sentences in each of six locales, twenty-four in all, read by no native speaker. They are their own group in `2026-10-09-175-native-speaker-review-organization-editing-strings.md`.

### What a reader with legal training should still look at

Found while reading the whole statement once more; none of it was changed, because none of it is untrue of a party's user in particular.

1. **Section 5 does not list everything an identity provider's token leaves in the registry.** With the `idura-ftn` configuration the `identity-callback` function keeps the Finnish personal identity code (`hetu`) beside the date of birth, and with either configuration the provider's subject identifier, in the user's `app_metadata` (`apps/supabase/supabase/functions/identity-callback/claimConfig.ts`, read; not observed on a running stack). The statement names the date of birth only, before this change and after it.
2. **Section 6 does not name the administrator as a source.** A name can be set by an administrator and rows can be imported; the profile page itself says "set by the administrator". The statement's "public electoral registers" may or may not be meant to cover that.
3. **Section 5's list does not mention an image.** A candidate's portrait and a party's logo are stored.
4. **Section 4 gives consent as the one legal basis.** Whether consent is the basis for a party's data, or for data an administrator enters before the user has signed in, is a legal question.
5. **Section 7, English only:** "not regularly disclosed to other parties" means third parties, in a text that now also says "parties" for political parties.
6. **`fi`, section 5:** `sähköpostisoite` is a misspelling of `sähköpostiosoite`. It is older than this change and was left, as every sentence outside the three changes was.

