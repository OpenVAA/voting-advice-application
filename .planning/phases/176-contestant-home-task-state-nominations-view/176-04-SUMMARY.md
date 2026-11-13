---
phase: 176-contestant-home-task-state-nominations-view
plan: 04
subsystem: ui
tags: [i18n, paraglide, catalogue, contestant-app, entity-descriptor, nominations, task-list, plural-message, tdd]

requires:
  - phase: 176-contestant-home-task-state-nominations-view
    provides: "plan 176-02: the keys a nomination row returns (election, constituency, parent, symbol, state), which the copy labels; plan 176-03: `TaskLabelKey`, whose eight keys have to exist in the catalogue"
  - phase: 175-organization-editing-profile-questions-preview
    provides: "the per-type descriptor and its test; the candidate/organization node form of a per-type sentence; the three texts the new namespace takes over"
provides:
  - "22 message keys in each of seven catalogues: the namespace `contestantApp.nominations` (8), `contestantApp.common` (5), `contestantApp.home` (9)"
  - "`contestantApp.basicInfo.requiredInfo` reworded in seven locales"
  - "the namespace file listed in `project.inlang/settings.json`; the regenerated `TranslationKey` union (656 keys)"
  - "`EntityDescriptor.homeNoNomination`, `.closedReasonNoNomination`, `.nominationsEmpty`, `.nominationParentLabel`; `.nominationsDescription` re-pointed"
affects: [176-05, 176-06, 176-08, 176-11, 176-12, 176-13, 176-14, 176-15, 176-16, 176-18, 176-19, 177]

actuals:
  tokens: 15826 # chars/4 over `git diff 0ef46d899 3bfe9aeb4 -- . ':(exclude).planning'` (63306 chars)
  tasks: 2
  commits: 4 # MEASURED: git rev-list --count 0ef46d899..HEAD, before this file's own commit
plan_head_before: 0ef46d89943fd87cd3baaa426fa3496a4c1f47dc
plan_head_after: 3bfe9aeb4fef268ed4c0ecbf140411699b55ad16

tech-stack:
  added: []
  patterns:
    - "A status sentence with a number is a plural message on `count`; every other sentence is written whole and takes no parameter, and a test names each with its parameters"
    - "A message file is compiled only when the inlang settings list it: a test holds the list equal to the base locale's files"
    - "A descriptor test reads the English catalogue from the files, taking the namespace as the longest one the key starts with"

key-files:
  created:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.nominations.json
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.common.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.home.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.basicInfo.json
    - apps/frontend/project.inlang/settings.json
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts

key-decisions:
  - "No key is removed here: every key the UI contract lists for removal still has a reader, or is removed with the block it belongs to, in plans 176-06 and 176-13"
  - "French says `candidature` for a nomination, the word of the view's own title, where the shared label and the two sign-out messages say `nomination`"
  - "The plural message's input is named `count` and its categories are `one` and `other` in every locale, as the questions warning has them"
  - "The descriptor test resolves each new member's key in the English catalogue files, so a member that names a key no catalogue holds fails a unit case and not only the type check"

requirements-completed: []

duration: about 17 min
completed: 2026-10-09
status: complete
---

# Phase 176 Plan 04: The Copy of the Nominations View, the Task List and the Closed Entries — Summary

**22 message keys in each of seven catalogues (634 to 656, none removed), one sentence reworded, the new namespace `contestantApp.nominations` listed for compilation, the key type regenerated, and four new members plus one re-pointed member on the per-type descriptor, tests first (12 of 31 cases red, then 0). Both verify blocks exit 0 as written. The search of the suite for the two changed texts found nothing in any of seven languages. None of the copy in six languages has been read by a native speaker.**

Everything below was measured in this session unless it says "read" or "not established".

## Read this first

1. **Both tasks are done; both `<automated>` blocks exit 0 as written**, run with `bash` from script files that are byte for byte the plan's.
2. **No key was removed** (PROH-176-12). Each catalogue goes 634 → 656. The UI contract's 649 is reached when plan 176-06 removes two keys and plan 176-13 five.
3. **The plan says three keys are left unread after this plan; the tree shows two.** `contestantApp.basicInfo.nominations.description.candidate` and `.organization` have no reader now. `contestantApp.basicInfo.nominations.title` is still read by the profile page.
4. **The two changed texts are asserted by no committed spec**, in any of the seven languages. Both commits that change what a browser shows are additive against the committed specs, and no E2E run was made, as the plan rules.
5. **`common.alliance.singular` is lower-case in six of seven locales** ("alliance", "vaaliliitto", "valallians"). The descriptor names it as the label of a party's parent row, as the UI contract says; the nominations view has to capitalise it where it renders it (plan 176-12).
6. **Six locales are constructed copy.** The list for the native-speaker review is under *Constructed copy that needs a native speaker*.

## Performance

- **Duration:** about 17 min (00:55Z → 01:12Z)
- **Tasks:** 2 of 2
- **Files:** 7 created, 26 modified, all in the plan's `files_modified`

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `05e70fdd9` | `feat(176-04): the copy of the nominations view, the task list and the closed entries in seven locales` | 1 |
| 2 | `7090fd26d` | `chore(176-04): the generated key type with the new keys` | 1 |
| 3 | `c634b90a8` | `test(176-04): the descriptor's members for a missing nomination, a closed entry and the nominations view` | 2, red |
| 4 | `3bfe9aeb4` | `feat(176-04): the per-type sentences of a missing nomination, a closed entry and the nominations view` | 2, green |

Each was made by pathspec from a `bash` script, after its gates in one `&&` chain: `yarn assert:comment-hygiene`, and for commits 1 and 2 the namespace gate and the i18n tests, for commits 3 and 4 ESLint and Prettier on the two files (and for commit 4 the unit cases under `src/lib/contestant/utils` and `src/routes/contestant`, and svelte-check read from its exit marker).

## Each verify, with its real exit status

Evidence: `tests/e2e-runs/176-unit/176-04-t<N>-verify.{sh,log,exit,head}`. Each block was launched in the background and its `.exit` marker read.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written | `7090fd26d` | **0** |
| Task 2, as written | `3bfe9aeb4` | **0** |
| Task 1, as written, again at the plan's last commit | `3bfe9aeb4` | **0** |

What the stages showed: the key script prints nothing for seven locales; the reworded sentence differs from `176-BASE` in each; regenerating the key type leaves no diff; `yarn assert:i18n-catalog-namespaces` reports 656 keys (`contestantApp.*` 204, `adminApp.*` 121, other 331), 0 violations; `vitest run src/lib/i18n` 3 files, 426 cases; `vitest run src/lib/contestant/utils` 7 files, 97 cases; svelte-check 2796 files, 0 errors, 0 warnings; comment hygiene 0 violations; no uncommitted change under the frontend.

Beyond the plan's blocks, each with its status read from the command:

| Check | Head | Exit | Result |
|---|---|---|---|
| svelte-check on the red working tree | `7090fd26d` + red changes | 0 | the red commit type-checks |
| red report, `entityDescriptor.test.ts` | `c634b90a8` | 1 | 31 cases, **12 failed**, every one an `AssertionError` |
| green report, same file | `3bfe9aeb4` | 0 | 31 cases, **0 failed** |
| `yarn workspace @openvaa/frontend paraglide:compile` | working tree before commit 1 | 0 | the messages compile; output is the gitignored `src/lib/paraglide/` |
| every new and changed key rendered from the compiled output, 23 keys × 7 locales, the plural with 1, 2 and 5 | same | 0 | 0 not compiled, 0 empty, 0 raw key, 0 unreplaced brace |
| whole frontend unit suite | `3bfe9aeb4` | 0 | 184 files passed, 1 skipped; 3338 cases passed, 16 skipped |

## Key arithmetic

Counted by flattening every message file of each locale, a plural message being one key, before the first edit and after the last.

| Locale | Files before | Files after | Keys before | Keys after | Added | Removed | Reworded |
|---|---|---|---|---|---|---|---|
| da | 49 | 50 | 634 | 656 | 22 | 0 | 1 |
| en | 49 | 50 | 634 | 656 | 22 | 0 | 1 |
| et | 49 | 50 | 634 | 656 | 22 | 0 | 1 |
| fi | 49 | 50 | 634 | 656 | 22 | 0 | 1 |
| fr | 49 | 50 | 634 | 656 | 22 | 0 | 1 |
| lb | 49 | 50 | 634 | 656 | 22 | 0 | 1 |
| sv | 49 | 50 | 634 | 656 | 22 | 0 | 1 |

The seven key sets are identical before and after. By file, per locale: `contestantApp.nominations` +8 (new file), `contestantApp.common` +5, `contestantApp.home` +9, `contestantApp.basicInfo` one sentence reworded. Of the 22, 19 are new sentences and 3 hold existing text under a new key: the title and the two descriptions, copied by script from `contestantApp.basicInfo.nominations.*` and compared afterwards in all seven locales (0 differ). **Moved: none** — the three old keys stay beside their copies.

The generated union gained exactly the 22 keys and lost none (`git diff` of `translationKey.ts`: 22 insertions).

**Towards the UI contract's 649:** 656 − 2 (`contestantApp.error.candidateNoNomination`, `.nominationNoElection`, plan 176-06) − 5 (`contestantApp.basicInfo.nominations.title`, `.description.candidate`, `.description.organization`, `common.state`, `common.pending`, plan 176-13) = 649.

Placement: each new key sits in its object's own case-insensitive key order, which every touched object already had; no object was reordered.

## The keys the task-state modules name

Every `'contestantApp.…'` literal in `lib/contestant/tasks/taskState.ts`, `unanswered.ts` and `index.ts` was looked up in the English key set and in the generated union:

| Key | In the catalogue | In `TranslationKey` |
|---|---|---|
| `contestantApp.home.nomination.enter` | yes, **added here** | yes |
| `contestantApp.home.nomination.view` | yes, **added here** | yes |
| `contestantApp.home.basicInfo.enter` / `.edit` / `.view` | yes | yes |
| `contestantApp.home.questions.enter` / `.edit` / `.view` | yes | yes |

Eight of eight. That `TaskLabelKey` is assignable to `TranslationKey` is not asserted by a type test: nothing passes one to `t()` yet. The route `ContestantAppNominations` that module also names is not this plan's and is still absent from `lib/routes`.

## Every added key, in seven locales

English is the UI contract's proposed string, verbatim. A plural message is shown as its `one` variant, a slash, and its `other` variant.

### `contestantApp.nominations`

| Key | Locale | Text |
|---|---|---|
| `title` | en | Nominations |
|  | da | Opstillinger |
|  | et | Kandidatuurid |
|  | fi | Ehdokkuudet |
|  | fr | Candidatures |
|  | lb | Nominatioune |
|  | sv | Nomineringslistor |
| `description.candidate` | en | These are the constituencies where you're nominated. If the election list or election symbol are missing, they will be automatically added later when candidate lists are confirmed. |
|  | da | Dette er de valgkredse, hvor du er opstillet. Hvis parti eller valgkreds mangler, vil de blive tilføjet automatisk, når kandidatlisten er bekræftet. |
|  | et | Need on valimisringkonnad, kus olete kandidaat. Kui kandidaatide nimekiri või -number puuduvad, lisatakse need automaatselt, kui valijanimekirjad on kinnitatud. |
|  | fi | Nämä ovat vaalipiirit, joissa olet ehdolla. Jos ehdokaslista tai -numero puuttuvat, ne täytetään automaattisesti, kun vaaliluettelot on vahvistettu. |
|  | fr | Voici les circonscriptions où vous êtes candidat·e. Si la liste électorale ou le symbole électoral manquent, ils seront automatiquement ajoutés plus tard lorsque les listes de candidat·es seront confirmées. |
|  | lb | Dëst sinn d’Walbezierker, an deenen Dir nominéiert sidd. Wa d’Wahllëscht oder d’Wahlsymbol feelen, ginn se automatesch nogereecht, wann d’Kandidatelëschte confirméiert sinn. |
|  | sv | Detta är de valkretsar där du är nominerad. Om vallistan eller valsymbolen saknas kommer de att läggas till automatiskt när kandidatlistorna bekräftas. |
| `description.organization` | en | These are the constituencies where your party is nominated. If the election symbol is missing, it will be added later by the administrator. |
|  | da | Dette er de valgkredse, hvor dit parti er opstillet. Hvis valgsymbolet mangler, tilføjes det senere af administratoren. |
|  | et | Need on valimisringkonnad, kus teie erakond kandideerib. Kui valimissümbol puudub, lisab administraator selle hiljem. |
|  | fi | Nämä ovat vaalipiirit, joissa puolueesi on ehdolla. Jos vaalisymboli puuttuu, ylläpitäjä lisää sen myöhemmin. |
|  | fr | Voici les circonscriptions où votre parti se présente. Si le symbole électoral manque, il sera ajouté plus tard par l’administrateur. |
|  | lb | Dëst sinn d’Walbezierker, an deenen Är Partei nominéiert ass. Wann d’Wahlsymbol feelt, gëtt et méi spéit vum Administrateur nogereecht. |
|  | sv | Detta är de valkretsar där ditt parti är nominerat. Om valsymbolen saknas läggs den till senare av administratören. |
| `empty.candidate` | en | No nomination has been defined for you yet. Please contact support to have one added. |
|  | da | Der er endnu ikke angivet nogen opstilling for dig. Kontakt support for at få en tilføjet. |
|  | et | Teile ei ole veel kandidatuuri määratud. Palun võtke ühendust toega, et see lisataks. |
|  | fi | Sinulle ei ole vielä määritetty ehdokkuutta. Ota yhteyttä tukeen, jotta ehdokkuus voidaan lisätä. |
|  | fr | Aucune candidature n’a encore été définie pour vous. Veuillez contacter l’assistance pour en faire ajouter une. |
|  | lb | Fir Iech gouf nach keng Nominatioun definéiert. Kontaktéiert wgl. de Support, fir eng derbäisetzen ze loossen. |
|  | sv | Ingen nominering har ännu angetts för dig. Kontakta supporten för att få en tillagd. |
| `empty.organization` | en | No nomination has been defined for your party yet. Please contact support to have one added. |
|  | da | Der er endnu ikke angivet nogen opstilling for dit parti. Kontakt support for at få en tilføjet. |
|  | et | Teie erakonnale ei ole veel kandidatuuri määratud. Palun võtke ühendust toega, et see lisataks. |
|  | fi | Puolueellesi ei ole vielä määritetty ehdokkuutta. Ota yhteyttä tukeen, jotta ehdokkuus voidaan lisätä. |
|  | fr | Aucune candidature n’a encore été définie pour votre parti. Veuillez contacter l’assistance pour en faire ajouter une. |
|  | lb | Fir Är Partei gouf nach keng Nominatioun definéiert. Kontaktéiert wgl. de Support, fir eng derbäisetzen ze loossen. |
|  | sv | Ingen nominering har ännu angetts för ditt parti. Kontakta supporten för att få en tillagd. |
| `state.label` | en | Status |
|  | da | Status |
|  | et | Olek |
|  | fi | Tila |
|  | fr | Statut |
|  | lb | Status |
|  | sv | Status |
| `state.pending` | en | Pending confirmation |
|  | da | Afventer bekræftelse |
|  | et | Ootab kinnitamist |
|  | fi | Odottaa vahvistusta |
|  | fr | En attente de confirmation |
|  | lb | Waart op Confirmatioun |
|  | sv | Väntar på bekräftelse |
| `state.pendingInfo` | en | This nomination has not been confirmed yet, so voters do not see it. |
|  | da | Denne opstilling er endnu ikke bekræftet, så vælgerne kan ikke se den. |
|  | et | Seda kandidatuuri ei ole veel kinnitatud, seega valijad seda ei näe. |
|  | fi | Tätä ehdokkuutta ei ole vielä vahvistettu, joten äänestäjät eivät näe sitä. |
|  | fr | Cette candidature n’a pas encore été confirmée ; les électeur·rice·s ne la voient donc pas. |
|  | lb | Dës Nominatioun gouf nach net confirméiert, dofir gesinn d’Wieler*inne se net. |
|  | sv | Den här nomineringen har inte bekräftats ännu, så väljarna ser den inte. |

### `contestantApp.common`

| Key | Locale | Text |
|---|---|---|
| `nominationsNotEditable` | en | Nominations can no longer be changed in this application. If something is wrong or missing, please contact support. |
|  | da | Opstillinger kan ikke længere ændres i denne applikation. Kontakt support, hvis noget er forkert eller mangler. |
|  | et | Kandidatuure ei saa selles rakenduses enam muuta. Kui midagi on valesti või puudu, võtke palun ühendust toega. |
|  | fi | Ehdokkuuksia ei voi enää muuttaa tässä sovelluksessa. Jos jokin on väärin tai puuttuu, ota yhteyttä tukeen. |
|  | fr | Les candidatures ne peuvent plus être modifiées dans cette application. Si quelque chose est incorrect ou manquant, veuillez contacter l’assistance. |
|  | lb | Nominatioune kënnen an dëser Applikatioun net méi geännert ginn. Wann eppes falsch ass oder feelt, kontaktéiert wgl. de Support. |
|  | sv | Nomineringar kan inte längre ändras i den här applikationen. Kontakta supporten om något är fel eller saknas. |
| `closedReason.noNomination.candidate` | en | Your basic information, your opinions and the preview open once you have a nomination. |
|  | da | Dine grundlæggende oplysninger, dine holdninger og forhåndsvisningen åbnes, når du har en opstilling. |
|  | et | Teie põhiandmed, arvamused ja eelvaade avanevad, kui teil on kandidatuur. |
|  | fi | Perustietosi, mielipiteesi ja esikatselu avautuvat, kun sinulla on ehdokkuus. |
|  | fr | Vos informations de base, vos opinions et l’aperçu s’ouvriront dès que vous aurez une candidature. |
|  | lb | Är Basisinformatiounen, Är Meenungen an d’Virukuck ginn op, soubal Dir eng Nominatioun hutt. |
|  | sv | Din grundläggande information, dina åsikter och förhandsgranskningen öppnas när du har en nominering. |
| `closedReason.noNomination.organization` | en | The basic information, the opinions and the preview open once your party has a nomination. |
|  | da | De grundlæggende oplysninger, holdningerne og forhåndsvisningen åbnes, når dit parti har en opstilling. |
|  | et | Põhiandmed, arvamused ja eelvaade avanevad, kui teie erakonnal on kandidatuur. |
|  | fi | Perustiedot, mielipiteet ja esikatselu avautuvat, kun puolueellasi on ehdokkuus. |
|  | fr | Les informations de base, les opinions et l’aperçu s’ouvriront dès que votre parti aura une candidature. |
|  | lb | D’Basisinformatiounen, d’Meenungen an d’Virukuck ginn op, soubal Är Partei eng Nominatioun huet. |
|  | sv | Den grundläggande informationen, åsikterna och förhandsgranskningen öppnas när ditt parti har en nominering. |
| `closedReason.preview` | en | The preview opens once the required basic information is filled in and every opinion question is answered. |
|  | da | Forhåndsvisningen åbnes, når de påkrævede grundlæggende oplysninger er udfyldt, og alle holdningsudsagn er besvaret. |
|  | et | Eelvaade avaneb, kui nõutavad põhiandmed on täidetud ja kõigile arvamusküsimustele on vastatud. |
|  | fi | Esikatselu avautuu, kun vaadittavat perustiedot on täytetty ja kaikkiin mielipidekysymyksiin on vastattu. |
|  | fr | L’aperçu s’ouvrira dès que les informations de base obligatoires seront renseignées et que toutes les affirmations auront une réponse. |
|  | lb | D’Virukuck geet op, soubal déi obligatoresch Basisinformatiounen ausgefëllt an all d’Aussoe beäntwert sinn. |
|  | sv | Förhandsgranskningen öppnas när den obligatoriska grundläggande informationen är ifylld och alla påståenden är besvarade. |
| `closedReason.previewNoQuestions` | en | The preview opens once the required basic information is filled in. |
|  | da | Forhåndsvisningen åbnes, når de påkrævede grundlæggende oplysninger er udfyldt. |
|  | et | Eelvaade avaneb, kui nõutavad põhiandmed on täidetud. |
|  | fi | Esikatselu avautuu, kun vaadittavat perustiedot on täytetty. |
|  | fr | L’aperçu s’ouvrira dès que les informations de base obligatoires seront renseignées. |
|  | lb | D’Virukuck geet op, soubal déi obligatoresch Basisinformatiounen ausgefëllt sinn. |
|  | sv | Förhandsgranskningen öppnas när den obligatoriska grundläggande informationen är ifylld. |

### `contestantApp.home`

| Key | Locale | Text |
|---|---|---|
| `nomination.enter` | en | Define your nomination |
|  | da | Angiv din opstilling |
|  | et | Määrake oma kandidatuur |
|  | fi | Määritä ehdokkuutesi |
|  | fr | Définir votre candidature |
|  | lb | Är Nominatioun definéieren |
|  | sv | Ange din nominering |
| `nomination.view` | en | View your nominations |
|  | da | Vis dine opstillinger |
|  | et | Vaadake oma kandidatuure |
|  | fi | Tarkastele ehdokkuuksiasi |
|  | fr | Afficher vos candidatures |
|  | lb | Är Nominatiounen uweisen |
|  | sv | Visa dina nomineringar |
| `ingress.noNomination.candidate` | en | To appear in the Election Compass, you first need a nomination: the election and constituency you are standing in. After that you can enter your basic information and answer the opinion statements. |
|  | da | For at komme med i valgtesten skal du først have en opstilling: det valg og den valgkreds, du stiller op i. Derefter kan du indtaste dine grundlæggende oplysninger og svare på holdningsudsagnene. |
|  | et | Valimisnõustajas kuvamiseks on teil esmalt vaja kandidatuuri: valimisi ja valimisringkonda, kus te kandideerite. Seejärel saate sisestada oma põhiandmed ja vastata arvamusküsimustele. |
|  | fi | Näkyäksesi vaalikoneessa tarvitset ensin ehdokkuuden: vaalin ja vaalipiirin, jossa olet ehdolla. Sen jälkeen voit täyttää perustietosi ja vastata mielipidekysymyksiin. |
|  | fr | Pour apparaître dans la Boussole électorale, il vous faut d’abord une candidature : l’élection et la circonscription dans lesquelles vous vous présentez. Vous pourrez ensuite saisir vos informations de base et répondre aux affirmations concernant des enjeux politiques. |
|  | lb | Fir am Wal-Kompass opzedauchen, braucht Dir als éischt eng Nominatioun: d’Wahl an de Walbezierk, an deenen Dir kandidéiert. Duerno kënnt Dir Är Basisinformatiounen aginn an d’Aussoe zu politesche Themen beäntwerten. |
|  | sv | För att synas i valkompassen behöver du först en nominering: det val och den valkrets du ställer upp i. Därefter kan du ange din grundläggande information och besvara påståendena om politiska frågor. |
| `ingress.noNomination.organization` | en | For your party to appear in the Election Compass, it first needs a nomination: the election and constituency it is standing in. After that you can enter its basic information and answer the opinion statements. |
|  | da | For at dit parti kan komme med i valgtesten, skal det først have en opstilling: det valg og den valgkreds, partiet stiller op i. Derefter kan du indtaste partiets grundlæggende oplysninger og svare på holdningsudsagnene. |
|  | et | Selleks et teie erakond oleks valimisnõustajas nähtav, on sellel esmalt vaja kandidatuuri: valimisi ja valimisringkonda, kus erakond kandideerib. Seejärel saate sisestada erakonna põhiandmed ja vastata arvamusküsimustele. |
|  | fi | Jotta puolueesi näkyisi vaalikoneessa, se tarvitsee ensin ehdokkuuden: vaalin ja vaalipiirin, jossa puolue on ehdolla. Sen jälkeen voit täyttää puolueen perustiedot ja vastata mielipidekysymyksiin. |
|  | fr | Pour que votre parti apparaisse dans la Boussole électorale, il lui faut d’abord une candidature : l’élection et la circonscription dans lesquelles il se présente. Vous pourrez ensuite saisir ses informations de base et répondre aux affirmations concernant des enjeux politiques. |
|  | lb | Fir datt Är Partei am Wal-Kompass opdaucht, brauch si als éischt eng Nominatioun: d’Wahl an de Walbezierk, an deenen d’Partei untrëtt. Duerno kënnt Dir d’Basisinformatioune vun der Partei aginn an d’Aussoe zu politesche Themen beäntwerten. |
|  | sv | För att ditt parti ska synas i valkompassen behöver det först en nominering: det val och den valkrets partiet ställer upp i. Därefter kan du ange partiets grundläggande information och besvara påståendena om politiska frågor. |
| `tasksLabel` | en | Your tasks |
|  | da | Dine opgaver |
|  | et | Teie ülesanded |
|  | fi | Tehtäväsi |
|  | fr | Vos tâches |
|  | lb | Är Aufgaben |
|  | sv | Dina uppgifter |
| `taskStatus.complete` | en | Completed. |
|  | da | Fuldført. |
|  | et | Tehtud. |
|  | fi | Valmis. |
|  | fr | Terminé. |
|  | lb | Fäerdeg. |
|  | sv | Klar. |
| `taskStatus.incomplete` | en | Not completed yet. |
|  | da | Ikke fuldført endnu. |
|  | et | Veel tegemata. |
|  | fi | Ei vielä valmis. |
|  | fr | Pas encore terminé. |
|  | lb | Nach net fäerdeg. |
|  | sv | Inte klar ännu. |
| `taskStatus.incompleteCount` | en | Not completed yet: one item left. / Not completed yet: {count} items left. |
|  | da | Ikke fuldført endnu: ét punkt mangler. / Ikke fuldført endnu: {count} punkter mangler. |
|  | et | Veel tegemata: jäänud on üks punkt. / Veel tegemata: jäänud on {count} punkti. |
|  | fi | Ei vielä valmis: yksi kohta jäljellä. / Ei vielä valmis: {count} kohtaa jäljellä. |
|  | fr | Pas encore terminé : il reste un élément. / Pas encore terminé : il reste {count} éléments. |
|  | lb | Nach net fäerdeg: eng Positioun bleift iwwreg. / Nach net fäerdeg: {count} Positioune bleiwen iwwreg. |
|  | sv | Inte klar ännu: en punkt återstår. / Inte klar ännu: {count} punkter återstår. |
| `taskStatus.blocked` | en | Not available yet. |
|  | da | Ikke tilgængelig endnu. |
|  | et | Pole veel saadaval. |
|  | fi | Ei vielä käytettävissä. |
|  | fr | Pas encore disponible. |
|  | lb | Nach net disponibel. |
|  | sv | Inte tillgänglig ännu. |

`taskStatus.incompleteCount` in every locale is one variant list with `declarations: ["input count", "local countPlural = count: plural"]`, `selectors: ["countPlural"]` and the two matches `countPlural=one` and `countPlural=other` — the structure and the categories of `contestantApp.questions.unansweredWarning`. A page calls `t('contestantApp.home.taskStatus.incompleteCount', { count })`.

### Reworded: `contestantApp.basicInfo.requiredInfo`

The second sentence of each is unchanged.

| Locale | Before | After |
|---|---|---|
| en | You must fill in the fields marked with this icon before you can answer other questions. However, you can save your answers so far and continue filling them in later. | You must fill in the fields marked with this icon for your profile to be shown in the Election Compass. However, you can save your answers so far and continue filling them in later. |
| da | Du skal udfylde felterne markeret med dette ikon, før du kan besvare andre spørgsmål. Du kan dog gemme dine svar og fortsætte senere. | Du skal udfylde felterne markeret med dette ikon, for at din profil kan blive vist i valgtesten. Du kan dog gemme dine svar og fortsætte senere. |
| et | Enne teistele küsimustele vastamist peate täitma selle ikooniga märgitud väljad. Siiski saate oma senised vastused salvestada ja jätkata hiljem. | Selleks et teie profiili valimisnõustajas kuvataks, peate täitma selle ikooniga märgitud väljad. Siiski saate oma senised vastused salvestada ja jätkata hiljem. |
| fi | Sinun pitää täyttää tällä ikonilla merkityt kentät ennen kuin voit vastata muihin kysymyksiin. Voit kuitenkin tallentaa tähänastiset vastauksesi ja jatkaa täyttämistä myöhemmin. | Sinun pitää täyttää tällä ikonilla merkityt kentät, jotta profiilisi näytetään vaalikoneessa. Voit kuitenkin tallentaa tähänastiset vastauksesi ja jatkaa täyttämistä myöhemmin. |
| fr | Vous devez remplir les champs marqués de cette icône avant de pouvoir répondre aux autres questions. Cependant, vous pouvez enregistrer vos réponses jusqu’ici et continuer plus tard. | Vous devez remplir les champs marqués de cette icône pour que votre profil soit affiché dans la Boussole électorale. Cependant, vous pouvez enregistrer vos réponses jusqu’ici et continuer plus tard. |
| lb | Dir musst d’Felder mat dësem Symbol ausfëllen, éier Dir déi aner Froen beäntwere kënnt. Dir kënnt Är Äntwerten awer späicheren an spéider weiderféieren. | Dir musst d’Felder mat dësem Symbol ausfëllen, fir datt Äre Profil am Wal-Kompass ugewise gëtt. Dir kënnt Är Äntwerten awer späicheren an spéider weiderféieren. |
| sv | Du måste fylla i fälten markerade med denna ikon innan du kan svara på andra frågor. Du kan dock spara dina svar hittills och fortsätta fylla i dem senare. | Du måste fylla i fälten markerade med denna ikon för att din profil ska visas i valkompassen. Du kan dock spara dina svar hittills och fortsätta fylla i dem senare. |

## The search of the suite for the two changed texts

Made at `0ef46d899`, before any commit of this plan. Evidence: `tests/e2e-runs/176-unit/176-04-suite-search.{log,exit,head}`.

- **The plan's two searches, in English, over `tests/tests`:** `git grep -n -F` for the sentence `contestantApp.basicInfo.requiredInfo` renders, and for each of the two sentences `nominationsDescription` renders — **exit 1 each: no hit.**
- **Widened:** for each of the seven locales, the whole text and its first sentence of all three messages, over `tests/tests` and over `tests`, `apps/frontend/src`, `apps/docs` and `packages` — **84 searches, 0 hits, 0 search errors** (exit 0 of the script, which exits 2 on a search that fails).
- **By key:** no file under `tests/` names `requiredInfo` or `basicInfo.nominations`. In the frontend source the reworded key has one reader, the profile page, and the description keys had one, the descriptor.

**What was done:** nothing in a spec. With no hit, commit `05e70fdd9` (the reworded sentence) and commit `3bfe9aeb4` (the re-pointed member) are additive against the committed specs, and no spec, fixture or E2E run is part of this plan. The re-pointed member shows the profile page the same sentence under another key: the copies equal their sources in all seven locales, and the new key is in the compiled messages (rendered from the compiled output, above).

## Task 2 — the descriptor

`apps/frontend/src/lib/contestant/utils/entityDescriptor.ts`. Each new member is typed `TranslationKey`, required, with a one-line doc; each is a message key and none is a rule.

| Member | Candidate | Organization | What a page shows with it |
|---|---|---|---|
| `homeNoNomination` (new) | `contestantApp.home.ingress.noNomination.candidate` | `contestantApp.home.ingress.noNomination.organization` | home's explanation while the entity has no nomination |
| `closedReasonNoNomination` (new) | `contestantApp.common.closedReason.noNomination.candidate` | `contestantApp.common.closedReason.noNomination.organization` | the sentence under the closed entries of home and of the menu |
| `nominationsEmpty` (new) | `contestantApp.nominations.empty.candidate` | `contestantApp.nominations.empty.organization` | the nominations view's sentence in place of the nominations |
| `nominationParentLabel` (new) | `common.electionList` | `common.alliance.singular` | the label of the row that names what a nomination stands under |
| `nominationsDescription` (re-pointed) | `contestantApp.nominations.description.candidate` | `contestantApp.nominations.description.organization` | the sentence above the entity's nominations |

No other member changed. The profile page was not edited: it reads the description through the member.

**The cases added** (`entityDescriptor.test.ts`, 22 → 31 cases): the four members in the list every entry must hold; the three per-type sentence members and the re-pointed one in each type's "sentence of every pair" case; the parent label of each type; each of the five keys resolving to a non-empty string in the English catalogue files, for each type; each of the four sentence members naming a different key and a different English sentence for the two types; and no descriptor naming a key under `contestantApp.basicInfo.nominations`. `entityDescriptorOf(undefined)` answering with the candidate's entry was a case already and passes.

**Red:** 12 of 31 failed at `c634b90a8`, all on an expectation. The one new case that passes red is `nominationsDescription is a different sentence for each type`, which the old keys satisfy too; the re-point is held by three other cases. **Green:** 0 of 31 at `3bfe9aeb4`.

**The red commit holds the type as well as the test**, by the plan's own provision: the four members are declared optional there, with their docs, and svelte-check on that tree exits 0. The green commit makes them required and gives both descriptors their values.

## Keys left unread, and the plan that removes each

A reader is a quoted occurrence of the key in `apps`, `tests` or `packages` outside the catalogues and the generated union.

| Key | Reader now | Removed by |
|---|---|---|
| `contestantApp.basicInfo.nominations.description.candidate` | **none** (unread since `3bfe9aeb4`) | 176-13 |
| `contestantApp.basicInfo.nominations.description.organization` | **none** (unread since `3bfe9aeb4`) | 176-13 |
| `contestantApp.basicInfo.nominations.title` | the profile page's nominations block | 176-13 |
| `common.state`, `common.pending` | the same block (`label={t('common.state')}` and the value beside it) | 176-13 |
| `contestantApp.error.candidateNoNomination`, `.nominationNoElection` | `lib/contestant/utils/loginError.ts` | 176-06 |

So the removal of `common.state` and `common.pending` waits for plan 176-13, as the plan rules: both still have their reader. No docs page under `apps/docs` names either.

None of the 22 new keys has a page reading it yet. Two are named by `taskState.ts` (the nomination labels) and five by the descriptor.

## Constructed copy that needs a native speaker

**None of it has been reviewed by a native speaker.** In each of `da`, `et`, `fi`, `fr`, `lb` and `sv`, the value at each of the 20 keys below was constructed from that catalogue's existing terms: **120 values** (126 sentences, the plural message holding two), at commit `05e70fdd9`. The full texts are in the tables above. Plan 176-19 files the review.

New (19): `contestantApp.nominations.empty.candidate` · `.empty.organization` · `.state.label` · `.state.pending` · `.state.pendingInfo` · `contestantApp.common.nominationsNotEditable` · `.closedReason.noNomination.candidate` · `.closedReason.noNomination.organization` · `.closedReason.preview` · `.closedReason.previewNoQuestions` · `contestantApp.home.nomination.enter` · `.nomination.view` · `.ingress.noNomination.candidate` · `.ingress.noNomination.organization` · `.tasksLabel` · `.taskStatus.complete` · `.taskStatus.incomplete` · `.taskStatus.incompleteCount` · `.taskStatus.blocked`.

Reworded (1): `contestantApp.basicInfo.requiredInfo`, first sentence.

Not constructed: `contestantApp.nominations.title`, `.description.candidate` and `.description.organization` are the catalogue's existing texts, byte for byte.

**Choices a reviewer should see in every locale.**

- No new sentence interpolates a noun: the only parameter is `{count}`, a number, and each locale writes both of its variants whole.
- The reason sentences name the three closed entries with each catalogue's own words for basic information, opinions and the preview, as the row labels and menu items say them.
- "Items" in the status sentence with a count is a neutral counting word (`punkt`, `kohta`, `élément`, `Positioun`): the count is of required fields on one row and of opinion questions on another.
- `state.label` means status. In `et` ("Olek") and `fi` ("Tila") it is the word `common.state` already holds, which means status there; in `da`, `lb` and `sv`, where `common.state` is a federal state, it is "Status"; in `fr` "Statut".
- The catalogues are not uniform in their word for a nomination, and each new sentence follows the Contestant App's own files: the title of the view, then the two sign-out messages.

**Per locale, where the wording is least certain.**

- **da** — "Angiv din opstilling" for "Define your nomination", after "Angiv dine holdninger". "Fuldført." / "Ikke fuldført endnu." "Ikke tilgængelig endnu." "holdningsudsagn" for an opinion question, as the questions file has it. "valgtesten" in lower case in the reworded sentence and in home's explanation, where two older sentences write "Valgtesten". Existing text, moved unchanged and worth a look: `description.candidate` says "parti eller valgkreds" (party or constituency) where English says election list or election symbol.
- **sv** — "nominering" for a nomination, as the two sign-out messages say, where the view's title is "Nomineringslistor" and `common.nomination` is "Utnämning". "Kontakta supporten" in the three new sentences that send the user to support, where `contestantApp.common.editingNotAllowed`, shown in the same note, says "Kontakta support". "obligatoriska" where the badge's word is "Nödvändig". "Klar." / "Inte klar ännu." "påståenden" for the opinion questions.
- **fi** — "Määritä ehdokkuutesi". "Odottaa vahvistusta". "jotta profiilisi näytetään vaalikoneessa" in the indicative; "näytettäisiin" is the alternative. "vaadittavat perustiedot" follows the badge's "Vaadittava". "Ei vielä käytettävissä." "kohta" / "kohtaa".
- **et** — Formal address (teie) in all three files, as each already is. "kandidatuur" for a nomination, as the title and the sign-out messages say, where `common.nomination` is "Kandideerimine". "valimisnõustaja" for the Election Compass, as the home and common files say (the questions file says "valimiskompass"). "Määrake oma kandidatuur". "Ootab kinnitamist". "Tehtud." / "Veel tegemata." "Pole veel saadaval." "et see lisataks".
- **fr** — "candidature" for a nomination: the view's title is "Candidatures", while `common.nomination` and the two sign-out messages say "nomination". A reviewer who prefers one word should change the other places too. The future tense for "open once" ("s’ouvriront dès que vous aurez"). "affirmations" for the opinion questions; "que toutes les affirmations auront une réponse". "Statut". "il reste un élément" is also the text of the `one` category, which in French covers zero; the sentence is never shown with zero. A plain space before ":" and ";", as the catalogue writes them. Inclusive "électeur·rice·s".
- **lb** — The least certain of the six, throughout. Final-n endings before a consonant ("Nominatioune kënnen", "Positioune bleiwen", "ugewise gëtt", "d’Wieler*inne se"). "ginn op" / "geet op" for "open(s)". "opzedauchen" in the candidate's new sentence, where the candidate's existing one says "opzezäichen" and the party's existing one "opdaucht". "brauch si", "untrëtt", "kandidéiert". "Waart op Confirmatioun". "Nach net disponibel." "fir eng derbäisetzen ze loossen". "Är Aufgaben". "déi obligatoresch Basisinformatiounen".

The backstop of the plan's last truth — every sentence and label without clipping at 320 px in seven locales — was not checked here: nothing renders these keys yet.

## Deviations from Plan

**1. Two unread keys, where the plan counts three.** Ruling 3 and Task 2's step 4 say three keys of the profile block's description are unread after this plan. The description has two keys, and those two are unread; the block's third key, its title, is read by the profile page until plan 176-13. Nothing was changed for it.

**2. `translations.test.ts` gained two things beyond the file count.** The count had to change (49 → 50). Added with it: a case that the settings' `pathPattern` lists exactly the base locale's message files, which is what makes a namespace file part of the compiled messages and the plan's second key link; and a per-locale block naming the 21 plain new keys with "no parameter" and the plural message with its structure and its one parameter. The key-parity test does not read values, so before these the truths "the same placeholder set in each" and "no other new message holds a placeholder" rested on the plan's one-off script alone. 426 cases in the three i18n files, all passing.

**3. The descriptor test reads the English catalogue from the files.** The plan's behaviour asks that each of the five keys resolves to a string in the English catalogue and that the four sentences differ by type. The test holds a 15-line resolver over `messages/en/*.json` for it, in the way `translations.test.ts` reads catalogues. Phase 175's plan 04 had left catalogue lookups out of this file.

**4. `yarn workspace @openvaa/frontend paraglide:compile` was run once, and the compiled messages rendered by a script in the session's scratch directory.** The plan orders neither. The unit configuration replaces the compiled messages with mocks and svelte-check does not compile them, so no ordered gate would have met a plural message the compiler refuses. The run wrote the gitignored `apps/frontend/src/lib/paraglide/`, which a dev server or a build regenerates.

**5. The whole frontend unit suite was run once at the last commit** (exit 0). It is plan 176-05's gate row; here it is evidence that no test elsewhere counted files, keys or descriptor members.

**6. At `05e70fdd9` alone the i18n file's case "the generated TranslationKey union matches the base-locale message keys" would fail**: the catalogue is 22 keys ahead of the union until `7090fd26d`, the next commit. That is the plan's own split into two commits; it was not run at that commit, and it follows from what the case compares. The case passed on the working tree before both commits and passes at every later head.

**7. The first attempt at commit 1 failed and committed nothing.** It passed its pathspecs in one unquoted variable in the login shell, which is zsh and does not split it — the trap § *Searches and checks* of the execution rules names. Its gates had passed and `git add` had staged the seven new files. The commit was then made from a `bash` script with an array, and every later commit the same way.

**8. HEAD is on `feat/entity-signup-multi-grant`,** the branch the orchestrator named for this checkout, not on a per-agent branch.

## Not done, or not verified

- **No E2E run, no database command, no dev server, no workspace-wide typecheck, lint or build** — by the plan. The reworded sentence and the re-pointed description are unproven in a browser until plan 176-05's full run; the search above says no committed spec asserts either.
- **No native-speaker review**, and no 320 px read of any new sentence.
- **Nothing renders the 22 keys.** That each is used where the UI contract says is the work of plans 176-11 to 176-16.
- **`requirements-completed` is empty on purpose:** NOM-01 and NOM-02 are met when the home's nomination row and the nominations view exist; this plan supplies their words.
- **That `TaskLabelKey` is assignable to `TranslationKey` is shown by the key lookup alone**, not by the compiler.
- **Nothing was appended to `.planning/WINDOWS.md`:** there is no stub, no skipped case and no verify that did not run.
- **The two test-side additions of deviation 2 were not asked for by the plan**; a reviewer who wants the file to change by the count alone can drop them without touching the catalogues.

## For the next plans

- **176-05 (first full run).** The profile page shows the reworded sentence above its Save button and reads its nominations description under the new key. `translations.test.ts` expects 50 files per locale and the settings' list equal to the base locale's files. The frontend unit suite at `3bfe9aeb4`: 184 files passed, 1 skipped; 3338 cases passed, 16 skipped.
- **176-06.** Removing the two error keys takes each catalogue to 654; regenerate the key type in the same commit, or the union case fails.
- **176-11 (the note).** `contestantApp.common.nominationsNotEditable` is neutral for both types and has no parameter.
- **176-12 (the nominations view).** Title `contestantApp.nominations.title`; the sentence above the cards `descriptor.nominationsDescription`; the empty sentence `descriptor.nominationsEmpty`; the state row `contestantApp.nominations.state.label` with `common.confirmed` or `.state.pending`, and `.state.pendingInfo` under an unconfirmed card. **`descriptor.nominationParentLabel` for a party is `common.alliance.singular`, which is lower-case in `en`, `da`, `et`, `fi`, `fr` and `sv`** ("alliance", "valimisliit", "vaaliliitto", "valallians") and capitalised only in `lb`; `common.electionList` is capitalised everywhere. The label has to be capitalised where it is rendered, or the two types' cards differ in case. The voter app's nominations page does it with `ucFirst(t('common.alliance.singular'))`; `EntityInfo.svelte` passes `t('common.alliance.singular')` to a `label` prop without it, and whether that component capitalises its label was not read.
- **176-13.** Removing `contestantApp.basicInfo.nominations.title`, `.description.candidate`, `.description.organization`, `common.state` and `common.pending` with the profile's block takes each catalogue to 649. The descriptor test already holds that no descriptor names a key under `contestantApp.basicInfo.nominations`.
- **176-14 and 176-15 (home).** `descriptor.homeNoNomination` for the explanation; `descriptor.closedReasonNoNomination`, `contestantApp.common.closedReason.preview` and `.previewNoQuestions` for the reason sentence; `contestantApp.home.tasksLabel` for the list's name; the four `taskStatus` sentences, of which `incompleteCount` takes `{ count }` and is shown only where a row has a count. All eight `TaskLabelKey` members exist.
- **176-16 (the menu).** The same `closedReasonNoNomination` and the two preview reasons; the nominations item's label is `contestantApp.nominations.title`.
- **176-19.** The native-review todo is the section above: 120 values in six locales, and the existing `da` description beside them.
- **Phase 177.** `contestantApp.home.nomination.enter` already reads "Define your nomination"; no string changes when the editor arrives.
- **Orchestrator.** Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited, and no sentence of them was made false: `CLAUDE.md` names no count of message files or keys. `apps/frontend/src/lib/i18n/README.md` and the docs were not searched for a count of namespaces beyond a search for "message files", which found none.

## Code review checklist

Over the catalogue changes, the settings, the two test files and the descriptor.

| Item | Outcome |
|---|---|
| Solves what it sets out to | In part, by design: the words and the descriptor members exist and are typed; no page reads them until plans 176-11 to 176-16 |
| OWASP top 10 | No new sentence takes a parameter but a number, so no stored text reaches markup through one (T-176-15, held by a test in every locale). The reworded sentence states a rule that holds before and after the rule it used to state is withdrawn (T-176-14). No input path, no query, no secret |
| Code style guide | `Array<T>`; explicit return types on the two test helpers; no `.js` extensions; TSDoc on each new member of the exported type |
| No `any` | None. The two catalogue readers in tests narrow from `unknown` |
| No repeated code | The catalogue reader in `entityDescriptor.test.ts` repeats in small what `translations.test.ts` does for whole files; the two differ in what they resolve (one key, a whole file) and no shared test utility exists for either. Three texts exist under two keys until plan 176-13 |
| New entities documented | Yes: four member docs, two block docs in the tests |
| Repo documentation | `apps/frontend/messages/README.md` states rules these changes keep. No docs page names a changed key |
| Tracking events | Nothing a user can perform is added |
| Svelte component guidelines | No component |
| Errors handled and logged | No failure path added |
| Failing checks | None at the plan's last commit. At `05e70fdd9` alone one unit case would fail (deviation 6) |
| Shared dependencies not unduly affected | `contestantApp.basicInfo.requiredInfo` has one reader, the profile page. `nominationsDescription` has one reader, the same page, and shows the same sentence. The whole frontend unit suite passes |
| WCAG, keyboard, screen reader | No markup. The four status sentences are the words a screen reader will hear on a task row; they are first rendered and scanned by plans 176-14 and 176-18 |
| Developers' and Publishers' Guides | Not touched |
| Comment hygiene | `yarn assert:comment-hygiene` exit 0 in each commit's chain; every added comment and case title read: present tense, no history, no decision, plan or proposal id |
| Clean, linear history | Linear; four commits, as the plan orders |
| No fixes of itself | Met: no commit corrects an earlier one of this plan |
| Formatting in its own commit | No formatting-only change; Prettier ran on each file before its commit |
| `[db]` tag | No database change |

## Files touched that the plan did not list

None. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `0ef46d899` and HEAD; `CAND-APP-PLAN.md` is untracked as before; nothing under `tests/e2e-runs/` was deleted.

Gitignored evidence, all in `tests/e2e-runs/176-unit/`: `176-04-t1-verify.{sh,log,exit,head}`, `176-04-t1-verify-final.{log,exit,head}`, `176-04-t2-verify.{sh,log,exit,head}`, `176-04-descriptor-red.{json,head,log}`, `176-04-descriptor-green.{json,head,log}`, `176-04-descriptor-green-precommit.log`, `176-04-check-red.{log,exit}`, `176-04-check-green.{log,exit}`, `176-04-suite-search.{log,exit,head}`, `176-04-frontend-unit.{log,exit}`, `176-04-i18n-precommit.log`, `176-04-namespaces-t1.log`, `176-04-prettier-t1.log` and three `176-04-hygiene-*.log`. Generated and gitignored: `apps/frontend/src/lib/paraglide/`.

## Known Stubs

None. No placeholder text, no empty value that reaches a page, no member without a value.

## Threat Flags

None. No endpoint, auth path, file access or schema. T-176-14 is met by the reworded sentence and the verify's comparison with the base commit in each locale; T-176-15 by the absence of any parameter but `count`, held by the verify and by a test in every locale; T-176-SC needs nothing, no package was installed.

## Self-Check: PASSED

Checked after writing:

- The seven namespace files, the settings file, the two test files, the generated key type and the descriptor exist and are tracked; `git status --short` shows this file and the operator's untracked `CAND-APP-PLAN.md` alone.
- `05e70fdd9`, `7090fd26d`, `c634b90a8` and `3bfe9aeb4` are ancestors of HEAD; `git rev-list --count 0ef46d899..HEAD` is 4, measured before this file's own commit.
- `176-04-t1-verify.exit`, `176-04-t2-verify.exit` and `176-04-t1-verify-final.exit` each hold 0; their heads are `7090fd26d`, `3bfe9aeb4` and `3bfe9aeb4`. Both script files equal the plan's `<automated>` blocks byte for byte.
- The red report holds 12 of 31 failed cases at `c634b90a8`; the green report 0 of 31 at `3bfe9aeb4`.
- `176-04-suite-search.exit`, `176-04-frontend-unit.exit`, `176-04-check-red.exit` and `176-04-check-green.exit` each hold 0.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `0ef46d899` and HEAD.
