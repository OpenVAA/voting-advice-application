---
phase: 175-organization-editing-profile-questions-preview
plan: 04
subsystem: ui
tags: [i18n, paraglide, catalogue, contestant-app, entity-descriptor, name-rule, localized-string, tdd]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 01)
    provides: the phase drivers and the checked E2E baseline; nothing of this plan calls a driver
  - phase: 173
    provides: UserEntity with `confirmed`, ServedEntityType, the per-entity routes whose three files are re-pointed here
provides:
  - 38 new message keys in each of seven catalogues, 3 sentences reworded in place, 4 strings turned into candidate/organization nodes
  - the regenerated TranslationKey union (638 keys)
  - lib/utils/localizedText.ts — missingRequiredLocale, normalizeLocalizedName, sameLocalizedName
  - lib/contestant/utils/nameRule.ts — isNameEditable, nameState, NameState, requiredNameLocale
  - lib/contestant/utils/entityDescriptor.ts — EntityDescriptor, IdentityFieldDescriptor, IdentityFieldRequirement, ENTITY_DESCRIPTORS, entityDescriptorOf
  - ContestantHomeMessageKey naming the four home.ingress keys
affects: [175-05, 175-06, 175-07, 175-08, 175-09, 175-10, 175-11, 175-12, 175-13, 179]

actuals:
  tokens: 35049 # chars/4 over this plan's three commits (140195 chars)
  tasks: 2
  commits: 10 # MEASURED over a shared checkout at the time of writing: 3 are this plan's, 7 are plan 175-03's
plan_head_before: 924e34bef7444a0da1b742985137590c90036156
plan_head_after: 72d71e0daf38f34b45e43fbb3584547b1311e575

tech-stack:
  added: []
  patterns:
    - "A sentence that differs by entity type is a node with a `candidate` and an `organization` child; each locale writes each sentence whole"
    - "A page reads `entityDescriptorOf(type).<member>` and never the type; the name rule is one function for every type and is not a member"
    - "A locale-keyed name is normalised where it is staged: trimmed, blank entries dropped, null when none is left"

key-files:
  created:
    - apps/frontend/src/lib/utils/localizedText.ts
    - apps/frontend/src/lib/utils/localizedText.test.ts
    - apps/frontend/src/lib/contestant/utils/nameRule.ts
    - apps/frontend/src/lib/contestant/utils/nameRule.test.ts
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/{common,components,dynamic,contestantApp.basicInfo,contestantApp.error,contestantApp.home,contestantApp.help,contestantApp.questions,contestantApp.preview}.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.test.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts

key-decisions:
  - "The privacy statement names candidates and is shown to a party's user; it was NOT split by type here and is left for a ruling (see Open for a ruling)"
  - "The journey spec's two menu lists assert the reworded Help title in the commit that rewords it"
  - "colorField and previewTagLine are discriminated on `offered` / `shown`, so a page cannot read a label key the type does not have"
  - "greetingName takes a structural `{ firstName?, name? }`, so no descriptor entry branches on the entity type"
  - "Non-English help lines say \"the party's candidates\" where English says \"your candidates\""

patterns-established:
  - "Per-type copy: one node per sentence, `candidate` and `organization` children, read through the descriptor"
  - "U-05 and U-19 are one literal each in ENTITY_DESCRIPTORS, with a TSDoc line that says what the value decides"

requirements-completed: []

coverage:
  - id: D1
    description: "Every new key of the UI contract exists in all seven catalogues with the same placeholder set; four strings are nodes whose candidate child is the old text; the generated key type holds them"
    requirement: GEN-01
    verification:
      - kind: other
        ref: "key-parity script over seven locales against HEAD before the commit (exit 0): 604 -> 638 keys each, 38 added, 4 removed, 3 changed, key sets identical, candidate texts unchanged, placeholder sets equal"
        status: pass
      - kind: other
        ref: "plan's Task 1 verify chain as written (exit 1 at stage 1: its path resolver cannot reach a key of a `contestantApp.*` file); every later stage run alone exits 0"
        status: fail
    human_judgment: false
  - id: D2
    description: "The name rule, the required locale, the name normaliser and the per-type descriptor, tests first"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "localizedText.test.ts 19, nameRule.test.ts 20, entityDescriptor.test.ts 22 — red at 1fb264596 (3 suites fail to resolve their module), green at efe94769d (61 passed)"
        status: pass
      - kind: other
        ref: "plan's Task 2 verify chain as written (exit 1 at its last stage: comment-hygiene finding in plan 175-03's pgTAP file 40); every earlier stage exits 0 inside the chain"
        status: fail
    human_judgment: false
  - id: D3
    description: "The constructed copy in six languages reads correctly to a native speaker and fits at 320px"
    verification: []
    human_judgment: true

duration: 46min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 04: Copy by entity type in seven locales, the name rule and the per-type descriptor Summary

**38 new message keys in each of seven catalogues (604 to 638), four strings split into candidate/organization nodes with their readers re-pointed, three sentences made neutral, and three pure modules — the name rule, the name normaliser and the closed per-type descriptor — written after their 61 unit cases. Both of the plan's verify chains exit 1 as written, neither for this plan's code, and one sweep hit is left for a ruling.**

## Open for a ruling

**The registry and privacy statement names candidates, is shown to a party's user, and was not split.** The sweep of step 4 found `dynamic.contestantAppPrivacy.registryStatement.content` in all seven locales. It is rendered by `TermsOfUse.svelte` on the terms-of-use gate inside the protected routes and on the public `/contestant/privacy` page, so an organization's user reads it. Two of its sentences name candidates: the registry's name ("{appName} - Candidate Information System.") and its sources ("Data stored in the registry is obtained from candidates through an online form, during their bank authentication, and from public electoral registers."). By the letter of step 4 that is a key per type in seven locales, a descriptor member and a second commit. It was not done, for three reasons the plan could not weigh because the planner's English sweep did not list the key:

1. It is legal text. A party's statement differs in substance, not in a noun: section 5 lists "date of birth" and section 6 "bank authentication", neither of which is true of a party. Writing a registry statement for parties in seven languages is not a translation task.
2. The public privacy page has no selected entity, so a member keyed on the selected entity's type has nothing to read there. Which variant that page shows is a design question no document of the phase answers.
3. The statement describes the registry as a whole and is a deployment template (`DATA_CONTROLLER`, `DATA_STORAGE_TERM_EG_5_YRS`), not a sentence addressed to the reader as a candidate.

What a ruling to split would cost: one more commit under this plan's name (the truth "no later plan of the phase adds a key" holds only if that commit is this plan's), a re-point of `TermsOfUse.svelte` and one descriptor member. Until then the tree is as it was before the phase on this point.

## Performance

- **Duration:** about 46 min
- **Started:** 2026-10-08T12:21:07Z
- **Completed:** 2026-10-08T13:07Z
- **Tasks:** 2 of 2
- **Files:** 6 created, 69 modified

## Task Commits

1. **Task 1: every new string in seven locales, and the four strings that become nodes** — `ef95bae6e` `feat(175-04): the profile, questions and preview copy by entity type, in seven locales` (69 files)
2. **Task 2, red** — `1fb264596` `test(175-04): the name rule, the required locale, the name normaliser and the per-type descriptor` (3 files)
3. **Task 2, green** — `efe94769d` `feat(175-04): the name rule, the required-locale helper and the per-type descriptor` (3 files)

Seven commits of plan 175-03 sit between and after them in the same checkout; this plan's last commit of code is `efe94769d`. Every commit of this plan was made by explicit pathspec; the first with `git --literal-pathspecs`, because the route directories' bracketed names are glob expressions to git otherwise.

## Gates, each with the status read from the command

| Gate | Exit | What it showed |
|---|---|---|
| **Task 1 automated verify, whole chain as written**, on `ef95bae6e` | **1** | Stopped at its first stage. Printed `node` for each of the four keys and `help`. The parity half printed nothing: no key missing, no placeholder set differing. See deviation 1. |
| The stages that chain did not reach, each alone, on `ef95bae6e` | 0 / 0 / 0 / 0 | `generate:translation-key-type` 0; `git diff --exit-code HEAD` on the generated type 0; `yarn assert:i18n-catalog-namespaces` 0 (total 638; `contestantApp.*` 182, `adminApp.*` 121, other 335; 0 violations); `yarn workspace @openvaa/frontend check` 0 (2120 files, 0 errors, 0 warnings) |
| Supplementary check of the five assertions the chain cannot reach (this plan's own script, not the plan's command), on `ef95bae6e` | 0 | In all seven locales each of the four keys is a node holding exactly `candidate` and `organization`, and `candidate` equals the string the key held at `175-BASE`; `contestantApp.help.title` is "Support" in `en` and was "Candidate Support" at the base, read by the same resolver |
| Key parity over seven locales, before the Task 1 commit | 0 | Table below |
| `vitest run src/routes/contestant`, before the Task 1 commit | 0 | 227 passed |
| Prettier and ESLint on the Task 1 files, the spec included | 0 / 0 | |
| Red report, on `1fb264596` | **1** | 3 suites, each "Failed to resolve import" of its module; 0 cases collected |
| Green report, on `efe94769d` | **0** | 61 cases: `localizedText` 19, `nameRule` 20, `entityDescriptor` 22; 61 passed |
| **Task 2 automated verify, whole chain as written**, on `efe94769d` | **1** | Reached its last stage, so every earlier one is 0: the six `export function` searches, the two negative searches, the closed-map and lookup searches, red head before the module's commit, the green report's counts, `vitest run src/lib/contestant/utils src/lib/utils/localizedText` (6 files, 90 passed), `check` (2126 files, 0 errors, 0 warnings), ESLint. The last stage, `yarn assert:comment-hygiene`, exits 1 on one finding in plan 175-03's file. See deviation 2. |
| `yarn assert:comment-hygiene`, run three times more alone | 1 / 1 / 1 | Twice on `efe94769d` (last 13:06Z): the same single finding, `apps/supabase/supabase/tests/database/40-entity-type-list.test.sql:7`. Once on `72d71e0da` (13:09Z), after three more commits of plan 175-03: two findings, that one and `41-entity-color.test.sql:7`. No file of this plan is flagged in any run |
| Whole frontend unit suite, on `efe94769d` | 0 | 168 files passed, 1 skipped; 2708 tests passed, 11 skipped |
| `yarn assert:no-candidate-app-names` | 0 | 2821 files, 0 findings |

No `yarn db:reset`, no E2E run, no workspace-wide typecheck, lint or build was made, as the plan rules.

## Key arithmetic

| Locale | Before | After | Added | Removed | Reworded |
|---|---|---|---|---|---|
| da | 604 | 638 | 38 | 4 | 3 |
| en | 604 | 638 | 38 | 4 | 3 |
| et | 604 | 638 | 38 | 4 | 3 |
| fi | 604 | 638 | 38 | 4 | 3 |
| fr | 604 | 638 | 38 | 4 | 3 |
| lb | 604 | 638 | 38 | 4 | 3 |
| sv | 604 | 638 | 38 | 4 | 3 |

The seven key sets are identical. Of the 38 added, 31 are new sentences and 7 carry today's text under a new key, copied by script and compared afterwards: the four `.candidate` children, `common.entityImage.candidate`, `…identity.title.candidate` and `…identity.emptyPlaceholder.candidate`. The 4 removed are the strings that became nodes. The UI contract's 634 is reached when plan 175-09 removes the four keys ruling 6 leaves in place: `common.candidatePortrait` and `dynamic.contestantAppBasicInfo.immutableData.title`, `.ingress`, `.emptyPlaceholder`, which all still exist in all seven locales.

By file, per locale: `common` +5, `components` +4, `dynamic` +9, `contestantApp.basicInfo` +9 −2, `contestantApp.error` +2, `contestantApp.home` +4 −1, `contestantApp.questions` +2, `contestantApp.preview` +3 −1, `contestantApp.help` reworded only.

Placement: a new key sits in key order where its parent was in key order (every parent but one), and at the end of `contestantApp.error`, which was not. `dynamic.contestantAppBasicInfo.identity` is in reading order — title, name (locked, editable), lockedInfo, emptyPlaceholder — as `immutableData` beside it is.

## Readers of the four moved keys

The command of step 0 over `apps/frontend/src`, `tests/tests` and `apps/docs/src` found readers in the frontend source only: two in `profile/+page.svelte`, one in `preview/+page.svelte`, the union member and the read in `contestantHome.helpers.ts`, six expectations in `contestantHome.helpers.test.ts`, and the generated type. **None lives outside `apps/frontend/src`**; a wider search of the whole repository outside `.planning/` and the catalogues agrees. Each reads the `.candidate` child now, and no branch on the entity type was added.

## The sweep of all seven locales (step 4)

Stems: `candidate`, `ehdok`, `kandidat` (sv, da, lb), `kandidaa`, `candidat`. Searched: every `contestantApp.*.json` except `register`, `preregister`, `login`, `setPassword`, `resetPassword`, `entitySelection` and `nothingToEdit`, and the `contestantApp*` groups of `dynamic.json`. English was swept too.

| Key | Locales | Disposition |
|---|---|---|
| `contestantApp.basicInfo.nominations.description.candidate` | all | split by this task |
| `dynamic…identity.emptyPlaceholder.candidate` | all but fi | split by this task |
| `dynamic…immutableData.emptyPlaceholder`, `.ingress` | all | kept until plan 175-09 stops reading them (ruling 6) |
| `contestantApp.basicInfo.shortNameInfo`, `.colorInfo`, `contestantApp.preview.tagLabel` | all | new, shown to a party only; they name the party's candidates on purpose |
| `contestantApp.basicInfo.nominations.title` | fi, fr | stands: "Ehdokkuudet" / "Candidatures" is the word for a candidacy, which a party has too; it names no person |
| `contestantApp.error.candidateNoNomination`, `.nominationNoElection` | fi | stands: the reworded sentences say "ehdokkuus" (nomination), not candidate |
| `dynamic.contestantAppName.candidate`, `.candidateAndOrganization` | all | stands: already one whole name per served-type set |
| `dynamic.contestantAppPrivacy.registryStatement.content` | all | **not split; open for a ruling**, above |

`setPassword`, `resetPassword`, `login`, `register`, `entitySelection` and `nothingToEdit` hold no hit in English; `preregister` holds six, which belong to Phase 179.

## Task 2 — the contract later plans and Phase 179 import

`apps/frontend/src/lib/utils/localizedText.ts` (imports nothing from the contestant library):

```ts
export function missingRequiredLocale(value: LocalizedString | null | undefined, locale: string): boolean;
export function normalizeLocalizedName(value: LocalizedString | null | undefined): LocalizedString | null;
export function sameLocalizedName(a: LocalizedString | null | undefined, b: LocalizedString | null | undefined): boolean;
```

`apps/frontend/src/lib/contestant/utils/nameRule.ts`:

```ts
export type NameState = 'editable' | 'locked-confirmed' | 'locked-answers';
export function isNameEditable(entity: Pick<UserEntity, 'confirmed'> | undefined, answersLocked: boolean): boolean;
export function nameState(entity: Pick<UserEntity, 'confirmed'> | undefined, answersLocked: boolean): NameState;
export function requiredNameLocale(): string;
```

`apps/frontend/src/lib/contestant/utils/entityDescriptor.ts`:

```ts
export type IdentityFieldRequirement = 'always' | 'requiredLocale' | 'never';
export type IdentityFieldDescriptor = {
  property: 'firstName' | 'lastName' | 'name' | 'shortName';
  inputType: 'text' | 'text-multilingual';
  label: TranslationKey;
  required: IdentityFieldRequirement;
  testId: string;
  autocomplete?: 'given-name' | 'family-name';
  info?: TranslationKey;
};
export type EntityDescriptor = {
  identityFields: ReadonlyArray<IdentityFieldDescriptor>;
  identityTitle: TranslationKey;
  nameSentence: { locked: TranslationKey; editable: TranslationKey };
  lockedInfoPlaceholder: TranslationKey;
  imageLabel: TranslationKey;
  imageInfo?: TranslationKey;
  colorField: { offered: false } | { offered: true; label: TranslationKey; info: TranslationKey };
  nameRefusedMessage: TranslationKey;
  instructions: TranslationKey;
  instructionsNoQuestions: TranslationKey;
  homeNotDone: TranslationKey;
  homeNotDoneNoQuestions: TranslationKey;
  greetingName: (entity: { firstName?: string; name?: string }) => string | undefined;
  nominationsDescription: TranslationKey;
  electionSymbolLabel: TranslationKey;
  hideIfMissingAnswersKey?: ServedEntityType;
  previewTip: TranslationKey;
  previewExcludeTabs: ReadonlyArray<ParentEntityDetailsContent>;
  previewTagLine: { shown: false } | { shown: true; label: TranslationKey };
};
export const ENTITY_DESCRIPTORS = { candidate: {…}, organization: {…} } as const satisfies Record<ServedEntityType, EntityDescriptor>;
export function entityDescriptorOf(type: ServedEntityType | undefined): EntityDescriptor;
```

Behaviour pinned by the cases: an unknown entity is never editable and is `locked-answers`; a confirmed entity is `locked-confirmed` whatever the answers lock says; `nameState(...) === 'editable'` exactly when `isNameEditable` is true, over all eight combinations; `requiredNameLocale()` equals `defaultLocale` of `$lib/i18n` and the locale the static settings mark as default; a blank entry is absent, empty or whitespace alone for all three text helpers; `normalizeLocalizedName` returns a new object; two names are the same whatever their key order, padding or blank entries; each descriptor entry holds every listed member and no other, which is how "no lock rule" is asserted.

## Where the three ruled values sit, and what each fallback changes

- **U-05** (ruling 2). Two literals: `required: 'always'` on `firstName` and on `lastName` in `ENTITY_DESCRIPTORS.candidate.identityFields`, each under a TSDoc line. Fallback: both become `'never'`; in `entityDescriptor.test.ts` the constant `CANDIDATE_FIELDS` carries the two expected values, read by the case "has the first and last name as single-line text, each with its autocomplete token and always required", whose title changes with them. Items (c) to (e) of ruling 2 are in plans 175-08 and 175-09.
- **U-12** (ruling 3). Fourteen strings: `contestantApp.error.nameLocked.candidate` and `.organization` in `contestantApp.error.json` of each locale. The sentence the fallback replaces with "Your answers were saved": en "Your other changes were saved." · fi "Muut muutoksesi tallennettiin." · sv "Dina övriga ändringar sparades." · da "Dine øvrige ændringer blev gemt." · et "Teie muud muudatused salvestati." · fr "Vos autres modifications ont été enregistrées." · lb "Är aner Ännerunge goufe gespäichert."
- **U-19** (ruling 4). One literal: `hideIfMissingAnswersKey: 'organization'` in `ENTITY_DESCRIPTORS.organization`, under a TSDoc line. Fallback: the member is removed, and the case "reads the organization's key of the setting that hides entities with missing answers" expects `undefined`. The member is optional in `EntityDescriptor` so that the fallback is a deletion. `AppSettings['entities']['hideIfMissingAnswers']` has only the `candidate` key today, which is why the member is typed `ServedEntityType` and not a key of that setting; plan 175-08 widens the setting.

## Constructed copy that needs a native speaker

**None of it has been reviewed by a native speaker.** English is the UI contract's proposed string, verbatim. In each of `da`, `et`, `fi`, `fr`, `lb`, `sv` the value at each of the 34 keys below was constructed from that catalogue's existing terms: 204 strings, at commit `ef95bae6e`.

New (31): `common.name` · `common.shortName` · `common.color` · `common.entityImage.organization` · `components.input.requiredLocaleInfo` · `components.input.colorPicker` · `components.input.noColor` · `components.input.error.invalidColor` · `dynamic.contestantAppBasicInfo.identity.title.organization` · `…identity.name.locked.candidate` · `…identity.name.locked.organization` · `…identity.name.editable.candidate` · `…identity.name.editable.organization` · `…identity.lockedInfo` · `…identity.emptyPlaceholder.organization` · `contestantApp.basicInfo.instructions.organization` · `contestantApp.basicInfo.instructionsNoQuestions.candidate` · `….instructionsNoQuestions.organization` · `contestantApp.basicInfo.nominations.description.organization` · `contestantApp.basicInfo.shortNameInfo` · `contestantApp.basicInfo.logoInfo` · `contestantApp.basicInfo.colorInfo` · `contestantApp.error.nameLocked.candidate` · `contestantApp.error.nameLocked.organization` · `contestantApp.home.ingress.notDone.organization` · `contestantApp.home.ingress.notDoneNoQuestions.candidate` · `….notDoneNoQuestions.organization` · `contestantApp.questions.none.title` · `contestantApp.questions.none.content` · `contestantApp.preview.tip.organization` · `contestantApp.preview.tagLabel`.

Reworded (3): `contestantApp.help.title` · `contestantApp.error.candidateNoNomination` · `contestantApp.error.nominationNoElection`.

**`{language}`.** In every locale `components.input.requiredLocaleInfo` has the form "<label>: {language}. <sentence>", checked by a pattern over all seven: da "Påkrævet sprog: {language}. De øvrige sprog er valgfrie." · et "Nõutav keel: {language}. Teised keeled on valikulised." · fi "Vaadittava kieli: {language}. Muut kielet ovat vapaaehtoisia." · fr "Langue obligatoire : {language}. Les autres langues sont facultatives." · lb "Obligatoresch Sprooch: {language}. Déi aner Sprooche sinn optional." · sv "Obligatoriskt språk: {language}. Övriga språk är valfria."

**Choices a reviewer should see in every locale.**

- The two help lines `shortNameInfo` and `colorInfo` say "the party's candidates" where English says "your candidates": the reader is one editor of a party.
- `contestantApp.preview.tagLabel` is a lead-in with no closing punctuation, and the tag follows it on the page.
- The two reworded sign-out messages follow each catalogue's word for a nomination. In `fi` and `et` the old text said the candidate "lacks a constituency" where English said "has no nomination"; the new text says nomination ("ehdokkuus", "kandidatuur") and is a restructured sentence ("Yritit avata profiilin, jolta puuttuu ehdokkuus." / "Proovisite avada profiili, millel puudub kandidatuur.").

**Per locale, where the wording is least certain.**

- **fi** — "Vaadittava kieli" follows the badge's `common.required`; "Pakollinen kieli" is the alternative. "heksakoodi". "puolueen tunnuksessa" for the party symbol. "Ylläpitäjän asettama" as a placeholder. "Ehdokkaidensa yhteydessä puolueesi näytetään näin".
- **sv** — "Obligatoriskt språk", where the badge's word is "Nödvändig". "Anges av administratören". "hexkod". "Logotyp". The Help title "Support" replaces "Kandidatstöd". "Bredvid sina kandidater visas ditt parti som".
- **da** — "hex-kode". "Angives af administratoren". The new sentences say "komme med i valgtesten"; the candidate's existing sentence reads "komme med valgtesten" and was left as it is. "Ved siden af sine kandidater vises dit parti som".
- **et** — The catalogue addresses the user formally (teie) in `basicInfo`, `home`, `error` and `dynamic`, and informally (sina) in `questions` and `preview`; each new string follows its file, so `questions.none.content`, `preview.tip.organization` and `preview.tagLabel` are informal and the rest formal. The same split gives "valimiskompass" in `questions.none.content` and "valimisnõustaja" in the home sentences. "hex-kood". "Määrab administraator". "Vastatavaid küsimusi ei ole".
- **fr** — Inclusive forms as the catalogue has them ("candidat·es", "électeur·rice·s"); "l'administrateur" in the masculine, as the catalogue's one use before this plan has it (`contestantApp.resetPassword.json`); nine new strings repeat it. "Aucune question à laquelle répondre" as a heading. "sigle" for an acronym; "rogné" for cropped. "À côté de ses candidat·es, votre parti apparaît ainsi".
- **lb** — The least certain of the six, throughout: final-n endings before a consonant, and the nouns "Ofkierzung", "Faarfauswiel", "Donnéeë vun der Partei"; "quadratescht Bild"; "opdaucht" and "untrëtt"; "Keng vun den Aussoen an dësem Wal-Kompass ass fir Iech geduecht"; "Nieft hire Kandidat*inne gëtt Är Partei esou ugewisen".

The backstop of the plan's last truth — every sentence at 320px in seven locales — was not checked here: nothing renders these keys yet.

## The code review checklist

Over the catalogue changes, the re-pointed readers, the spec and the three modules.

| Item | Outcome |
|---|---|
| Solves the issue | partly, as planned: the copy and the helpers exist; no page reads them yet |
| OWASP top 10 | the refused-save messages interpolate nothing, so no database text reaches the user; the name rule answers "not editable" for an entity it does not know; `normalizeLocalizedName` writes entries into a plain object, where a key named `__proto__` with a string value is dropped by the engine and pollutes nothing; no new input path, no markup in any string |
| Code style guide | `Array<T>` / `ReadonlyArray<T>`; explicit return types; named exports; `nameRule.ts` reordered before the commit so the calling function comes first. Two points kept as the plan writes them: positional parameters (`isNameEditable(entity, answersLocked)`, `missingRequiredLocale(value, locale)`) where the guide prefers named ones — the two parameters of each differ in type, and `sameLocalizedName` is symmetric; and types beside values in `entityDescriptor.ts`, as `ENTITY_TABLES` has them |
| No `any` | none |
| No repetition | "blank" is defined once, in `localizedText.ts`; `sameLocalizedName` is built on `normalizeLocalizedName`; `isNameEditable` on `nameState`. `getLocalized` and `translate` answer a different question (which entry to show) and are not duplicated |
| New entities documented | TSDoc on every export, on each member of the two descriptor types, and on the three ruled literals |
| Repo markdown | `apps/frontend/messages/README.md` states rules these changes keep; nothing to update. No docs page names a moved key (searched) |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none |
| Errors handled | no failure path added; the helpers accept null and undefined |
| Failing checks | two, both recorded as deviations: neither is in this plan's files |
| Parts sharing the dependency | `contestantApp.help.title` is read by the menu, the help page and the login, registration and pre-registration status pages — every Contestant-app user reads "Support" now, which is the ruling; the journey spec asserted the old text and follows. The whole frontend unit suite is green |
| WCAG A/AA, keyboard and screen reader | no markup, role or attribute changed. The new copy is first rendered, scanned and measured by plans 175-09 to 175-12 |
| Docs guides | none names these keys or modules; plan 175-13 regenerates the component pages |
| Comment hygiene | every comment added was read: present tense, no ids, no phase reference. The guard's one finding is in another plan's file |
| Commit history | copy; tests; modules. No fix of a fix, no formatting-only change |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

## Deviations from Plan

**1. Task 1's verify command cannot pass as written; it was not edited and the catalogue was not bent to it.** Its helper `get(o, path)` splits the key on every dot, and each `contestantApp.*` file wraps its messages in one top-level key that contains a dot (`"contestantApp.basicInfo"`). So `get(rd("en","contestantApp.help"),"contestantApp.help.title")` is `undefined` for any tree — the tree at `175-BASE` included — and five of the command's assertions fail whatever the catalogue holds: the four `node` checks and the `help` check. Its other assertions passed inside the same run (parity and placeholders over six locales printed nothing; `common.shortName`; the kept keys; a non-zero count of added keys). Evidence: `tests/e2e-runs/175-unit/175-04-t1-verify.log` and `.exit` (1). The chain's four later stages were then run one by one, each 0, and the five assertions were checked by a resolver that takes the namespace as one key, 0 (`175-04-t1-stages.txt`). **The plan's criterion "the verify command exits 0" is not met; the acceptance criteria it stands for are.** Plan 175-05 or the verifier should correct the resolver before relying on the command.

**2. Task 2's verify command exits 1 at its last stage, on a file of plan 175-03.** `yarn assert:comment-hygiene` reports one finding in the tree: `apps/supabase/supabase/tests/database/40-entity-type-list.test.sql:7`, rule 2, a comment line without terminal punctuation continued on the next line, committed in `65620e64e`. Every earlier stage of the chain passed in the same run. The file was not touched. Re-run alone three times: still 1. At 13:09Z, on `72d71e0da`, the guard reports two findings, both in plan 175-03's pgTAP files (40 and 41, line 7 of each, the same rule). Plan 175-03 was still running then, and the chain was not run again on a later head.

**3. [Rule 1] `tests/tests/specs/contestant/contestant-journey.spec.ts` changed, a file the plan does not list.** Its two exact menu lists, `CONTESTANT_NAV_LOGGED_OUT` and `CONTESTANT_NAV_LOGGED_IN`, each held `/^Candidate Support$/`. Rewording `contestantApp.help.title` without them would have committed a tree whose `contestant-journey` project fails, found only by plan 175-05's run. Both literals are `/^Support$/` now, in Task 1's commit. No plan of the phase names this change, and step 0 could not have found it: it searches for the four moved keys, and the spec asserts a rendered text. **Not verified by a run**: this plan may not run the suite. ESLint and Prettier pass on the file. No other test or doc quotes an old text of a reworded key in any of the seven languages (searched).

**4. The privacy statement was not split** — the step 4 rule applied literally would split it. Stated in full under *Open for a ruling*.

**5. `contestantHome.helpers.test.ts` changed.** The plan's action names it ("a test beside the helper that names the old key follows"); its file list does not. Six expectations name the `.candidate` key.

**6. The green report was taken on the commit that holds the modules**, after it, so that its `.head` names a tree with them; the suite had passed on the working tree before the commit. The plan's order is report, then commit.

**7. Two cases were dropped from the descriptor's test before the red commit**, and one replaced. A first draft looked every message key up in the English catalogue through `import.meta.glob`, which no frontend test does; the plan's guard for that is the `TranslationKey` type, and `check` is the proof. A regex over member names for "no lock rule" became an exact member-set assertion.

**Not recorded in `.planning/WINDOWS.md`:** it is a shared planning file beside a running wave-mate, as plan 175-01 left it. What would go there: the two verify chains that exit 1 (deviations 1 and 2), and the unsplit privacy statement.

## What was not done or not verified

- **The plan's two verify commands do not exit 0** (deviations 1 and 2).
- **No E2E run.** The reworded Help title, the three re-pointed pages and the spec edit are unproven in a browser until plan 175-05's full run.
- **No native-speaker review**, and no 320px read of the new sentences.
- **The privacy statement** is as it was.
- **Nothing reads the descriptor, the name rule or the text helpers yet.** `hideIfMissingAnswersKey: 'organization'` names a key the settings type does not have until plan 175-08.
- **`GEN-01` and `GEN-03` are not completed by this plan**: it supplies their copy and rules; the pages are plans 175-09 to 175-11. `requirements-completed` is empty on purpose.

## Files touched that the plan did not list

- `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.test.ts`
- `tests/tests/specs/contestant/contestant-journey.spec.ts`

Gitignored evidence under `tests/e2e-runs/175-unit/`: `175-04-helpers-red.json`, `-red.head`, `-green.json`, `-green.head`, and the logs and exit markers `175-04-t1-*`, `175-04-t2-*`, `175-04-frontend-unit.*`, `175-04-hygiene*.log`, `175-04-names.log`.

## What the next plans should know

- **175-05:** the first full run meets three things from here. The `contestant-journey` menu lists expect "Support". Task 1's verify resolver needs the namespace taken as one key before the command means anything. And `yarn assert:comment-hygiene`, part of `lint:check`, is red on pgTAP file 40 until plan 175-03 joins its two comment lines. Register the test ids `profile-name` and `profile-short-name`.
- **175-06:** `Input` appends `t('components.input.requiredLocaleInfo', { language: t('lang.<code>') })`; the blank-entry rule to import is `missingRequiredLocale` from `$lib/utils/localizedText`. `components.input.colorPicker`, `.noColor` and `.error.invalidColor` exist.
- **175-07:** stage a name with `normalizeLocalizedName` and only when `!sameLocalizedName(staged, saved)`. The two `nameLocked` strings say "your other changes were saved".
- **175-08:** the name clause reads `identityFields[].required` — `'always'`, `'requiredLocale'`, `'never'` — with `isNameEditable` and `missingRequiredLocale(value, requiredNameLocale())`.
- **175-09:** narrow `colorField` on `.offered` before reading `.label` and `.info`; `imageInfo` and a field's `info` and `autocomplete` are optional. Removing `common.candidatePortrait` and the three `immutableData.*` keys in seven locales brings each catalogue to 634.
- **175-10:** `ContestantHomeMessageKey` already names the four `home.ingress` keys, but `homeNotDone` is typed `TranslationKey`, which is wider: pass the resolved string, or narrow the member's type. `computeNextAction` still reads the `.candidate` key itself. `greetingName` takes `userData.current.entity` as it is.
- **175-11:** narrow `previewTagLine` on `.shown`; `previewExcludeTabs` is `ReadonlyArray<ParentEntityDetailsContent>`, empty for a candidate.
- **175-13:** the native-review todo is the section above; the three unconnected default-locale sources are behind `requiredNameLocale()`.
- **Phase 179:** import `missingRequiredLocale`, `normalizeLocalizedName`, `sameLocalizedName`, `isNameEditable` and `requiredNameLocale` by these names; `common.name` and `common.shortName` are the neutral labels.
- **Orchestrator:** nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited. `CAND-APP-PLAN.md` is untracked and untouched.

## Self-Check: PASSED

Checked after writing: the six created files, the five modified source files, the spec and the generated type exist; `ef95bae6e`, `1fb264596` and `efe94769d` are ancestors of HEAD; the red and green reports, their `.head` files and the two verify logs exist under `tests/e2e-runs/175-unit/`, which is gitignored. The commit count and `plan_head_after` were measured at `72d71e0da`, before this file's own commit.
