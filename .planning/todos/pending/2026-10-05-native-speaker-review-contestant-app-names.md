---
created: 2026-10-05T22:45:00.000Z
title: Native-speaker review of the contestant app's names and the sentences that embed them (da, et, fi, fr, lb, sv)
area: i18n
severity: minor
source: Phase 171 plan 03 (D-15, D-16, D-17); deviation 3 of that plan
files:
  - apps/frontend/messages/da/dynamic.json
  - apps/frontend/messages/et/dynamic.json
  - apps/frontend/messages/fi/dynamic.json
  - apps/frontend/messages/fr/dynamic.json
  - apps/frontend/messages/lb/dynamic.json
  - apps/frontend/messages/sv/dynamic.json
  - apps/frontend/messages/da/contestantApp.notSupported.json
  - apps/frontend/messages/et/contestantApp.notSupported.json
  - apps/frontend/messages/fi/contestantApp.notSupported.json
  - apps/frontend/messages/fr/contestantApp.notSupported.json
  - apps/frontend/messages/lb/contestantApp.notSupported.json
  - apps/frontend/messages/sv/contestantApp.notSupported.json
  - apps/frontend/messages/da/contestantApp.help.json
  - apps/frontend/messages/et/contestantApp.help.json
  - apps/frontend/messages/fi/contestantApp.help.json
  - apps/frontend/messages/fr/contestantApp.help.json
  - apps/frontend/messages/lb/contestantApp.help.json
  - apps/frontend/messages/sv/contestantApp.help.json
tags: [contestant, admin, frontend, supabase, translations, improvement]
keywords: [native-speaker-review, i18n, contestant-app-name, locales, translations, entity-selection, nothing-to-edit, sign-in-mail, recovery-mail, entry-flow, organization-editing, home, tasks, nominations, nomination-editor, identity-provider, copy, auth-confirm, admin-login]
---

## Problem

Phase 171 made the contestant app name itself from the entity types a project serves. Each locale now holds three whole names under `dynamic.contestantAppName` (`candidate`, `organization`, `candidateAndOrganization`), and five sentences take the name as the parameter `{contestantAppName}`.

The English names are the operator's literal terms. Everything in the other six locales was **constructed from terms each catalogue already used and has not been read by a native speaker**: eighteen names (six locales, three each) and thirty sentences (six locales, five each). The sentences were rewritten so that the name stands first, followed by a colon, and the rest does not depend on the name grammatically; before the change four locales inflected the name or attached an article to it.

This does not block Phase 171. The wording is live on the login screen, on three more pages' pre-heading, in the help page's mail subject, on the two maintenance pages of the contestant app and in the help page's ingress.

### The eighteen constructed names

| Locale | `candidate` | `organization` | `candidateAndOrganization` |
|---|---|---|---|
| da | Kandidatmodul | Partimodul | Kandidat- og partimodul |
| et | Kandidaatide rakendus | Erakondade rakendus | Kandidaatide ja erakondade rakendus |
| fi | Ehdokkaiden sovellus | Puolueiden sovellus | Ehdokkaiden ja puolueiden sovellus |
| fr | Application candidat·es | Application partis | Application candidat·es et partis |
| lb | Kandidat*inne-Applikatioun | Parteien-Applikatioun | Kandidat*innen- a Parteien-Applikatioun |
| sv | Kandidatappen | Partiappen | Kandidat- och partiappen |

### The thirty constructed sentences

**da**

- `dynamic.contestantAppNotAccessible.title`: {contestantAppName}: endnu ikke tilgængeligt
- `dynamic.contestantAppNotAccessible.content`: {contestantAppName}: tjenesten er endnu ikke blevet offentliggjort. Gå tilbage til denne adresse, når den bliver tilgængelig.
- `contestantApp.notSupported.title`: {contestantAppName}: ikke tilgængeligt
- `contestantApp.notSupported.content`: {contestantAppName}: denne version af Valgtesten understøtter ikke tjenesten.
- `contestantApp.help.ingress`: {contestantAppName}: nedenfor finder du svar på de mest almindelige spørgsmål om brugen af tjenesten. Hvis du ikke finder svar på dit spørgsmål, kan du kontakte support.

**et**

- `dynamic.contestantAppNotAccessible.title`: {contestantAppName}: ei ole veel kasutusel
- `dynamic.contestantAppNotAccessible.content`: {contestantAppName}: teenust ei ole veel avaldatud. Palun tulge sellele aadressile tagasi, kui see muutub kättesaadavaks.
- `contestantApp.notSupported.title`: {contestantAppName}: ei ole saadaval
- `contestantApp.notSupported.content`: {contestantAppName}: see valimisnõustaja versioon ei toeta kahjuks selle teenuse kasutamist.
- `contestantApp.help.ingress`: {contestantAppName}: allpool on vastused levinumatele küsimustele teenuse kasutamise kohta. Kui te ei leia oma küsimusele vastust, saate võtta ühendust toega.

**fi**

- `dynamic.contestantAppNotAccessible.title`: {contestantAppName}: ei vielä käytössä
- `dynamic.contestantAppNotAccessible.content`: {contestantAppName}: palvelua ei ole vielä julkaistu. Palaa tähän osoitteeseen, kun se on käytettävissä.
- `contestantApp.notSupported.title`: {contestantAppName}: ei käytössä
- `contestantApp.notSupported.content`: {contestantAppName}: tämä vaalikoneen versio ei valitettavasti mahdollista palvelun käyttöä.
- `contestantApp.help.ingress`: {contestantAppName}: alla on vastauksia yleisimpiin kysymyksiin palvelun käytöstä. Jos et löydä vastausta pulmaasi alta, voit ottaa yhteyttä tukeen.

**fr**

- `dynamic.contestantAppNotAccessible.title`: {contestantAppName} : pas encore disponible
- `dynamic.contestantAppNotAccessible.content`: {contestantAppName} : ce service n’a pas encore été publié. Revenez à cette adresse lorsqu’il sera disponible.
- `contestantApp.notSupported.title`: {contestantAppName} : non disponible
- `contestantApp.notSupported.content`: {contestantAppName} : cette version de la Boussole électorale ne prend pas en charge ce service.
- `contestantApp.help.ingress`: {contestantAppName} : vous trouverez ci-dessous des réponses aux questions les plus fréquentes concernant l’utilisation de ce service. Si vous ne trouvez pas de réponse à votre problème, vous pouvez contacter l’assistance.

**lb**

- `dynamic.contestantAppNotAccessible.title`: {contestantAppName}: nach net disponibel
- `dynamic.contestantAppNotAccessible.content`: {contestantAppName}: dëse Service ass nach net verëffentlecht. Kommt wgl. op dës Adress zréck, wann en disponibel ass.
- `contestantApp.notSupported.title`: {contestantAppName}: net verfügbar
- `contestantApp.notSupported.content`: {contestantAppName}: dës Versioun vum Wal-Kompass ënnerstëtzt dëse Service net.
- `contestantApp.help.ingress`: {contestantAppName}: hei drënner fannt Dir Äntwerte op déi heefegst Froen iwwer d’Benotzung vun dësem Service. Wann Dir keng Äntwert op Äre Problem fannt, kënnt Dir de Support kontaktéieren.

**sv**

- `dynamic.contestantAppNotAccessible.title`: {contestantAppName}: ännu inte tillgänglig
- `dynamic.contestantAppNotAccessible.content`: {contestantAppName}: tjänsten har ännu inte publicerats. Återkom till denna adress när den blir tillgänglig.
- `contestantApp.notSupported.title`: {contestantAppName}: inte tillgänglig
- `contestantApp.notSupported.content`: {contestantAppName}: denna valkompassversion stöder inte tjänsten.
- `contestantApp.help.ingress`: {contestantAppName}: nedan finns svar på de vanligaste frågorna om hur tjänsten används. Om du inte hittar svar på din fråga nedan kan du kontakta supporten.

### Points a reviewer should look at first

- **The name stands alone before a colon in every sentence.** The predicate after the colon agrees with the name's head noun in da (`tilgængeligt`, neuter, for `-modul`) and sv (`tillgänglig`, common gender, for `-appen`). All three names of a locale share one head noun, so one form serves all three.
- **sv** uses the definite form (`Kandidatappen`) as the name, as the catalogue did before; the heading on the login screen therefore reads as a definite noun.
- **lb** writes `Kandidat*inne-` in the single name and `Kandidat*innen-` before `a` in the combined one (the n-rule before a vowel). The mix of `disponibel` and `verfügbar` in the two titles is inherited from the catalogue.
- **fr** names are noun appositions without a preposition (`Application partis`), following the catalogue's existing `Application candidat·es`. The space before the colon is a plain space, as elsewhere in `fr/dynamic.json`.
- **fi, et** put the name in the nominative before the colon; the sentence after it uses `palvelu` / `teenus` ("the service") in whatever case it needs, so the name is never inflected.
- The same lower-case start after the colon is used in every locale, English included.

## Solution

Have a native speaker of each of the six languages read that language's three names and five sentences in place (the login heading, the pre-heading of the register, forgot-password and password-reset pages, the two maintenance pages and the help page), with each of the three names substituted into each sentence, and correct the catalogue values. Constraints a correction has to keep:

- three whole names per locale under `dynamic.contestantAppName`; no reader builds a name from entity words;
- each of the five sentences keeps the `{contestantAppName}` parameter and reads correctly with all three names without inflecting the name (`apps/frontend/src/lib/i18n/tests/translations.test.ts` asserts the three keys and the five placeholders in every locale);
- the English names stay "Candidate app", "Party app" and "Candidate and party app".

Close this todo when all six locales have been reviewed, or split it per locale if they are reviewed at different times.

## Merged from `2026-10-06-native-speaker-review-profile-selection-strings.md` (2026-11-28)

Adds the 48 strings of contestantApp.entitySelection and contestantApp.nothingToEdit (8 keys x 6 locales) with per-locale notes (form of address, signedInAs as a label, current as menu heading).

The merged todo is kept at `.planning/todos/completed/2026-10-06-native-speaker-review-profile-selection-strings.md`.

## Merged from `2026-10-07-174-native-speaker-review-sign-in-mail.md` (2026-11-28)

Adds account-access mailTemplates.ts (sign-in and recovery mails, 6 locales, anchor labels), the 264 entry-flow strings of plan 178-08 (login/register/emailSent/setPassword), setPassword.passwordNotValid, register.enterCode/code, and catalogue oddities (sv common.login 'Registrera dig', et salasona vs parool). Mail subject changes must update tests/tests/utils/invitationConstants.ts.

The merged todo is kept at `.planning/todos/completed/2026-10-07-174-native-speaker-review-sign-in-mail.md`.

## Merged from `2026-10-09-175-native-speaker-review-organization-editing-strings.md` (2026-11-28)

Adds 204 strings of the 34 organization-editing keys (name/shortName/color, identity sentences, basicInfo instructions) and 36 sentences of the registry statement; da/et/fr/lb never opened in a browser; lb least certain.

The merged todo is kept at `.planning/todos/completed/2026-10-09-175-native-speaker-review-organization-editing-strings.md`.

## Merged from `2026-10-09-176-native-speaker-review-home-tasks-and-nominations-strings.md` (2026-11-28)

Adds 120 values of 20 keys (nominations empty/state, common.closedReason, home tasks/taskStatus, basicInfo.requiredInfo) and three in-locale inconsistencies (da description, fr Candidatures vs nomination, sv support wording).

The merged todo is kept at `.planning/todos/completed/2026-10-09-176-native-speaker-review-home-tasks-and-nominations-strings.md`.

## Merged from `2026-10-11-177-native-speaker-review-nomination-editor-strings.md` (2026-11-28)

Adds 330 values (55 nomination-editor keys x 6 locales), the per-locale term table, and the lb words with no catalogue precedent to check first.

The merged todo is kept at `.planning/todos/completed/2026-10-11-177-native-speaker-review-nomination-editor-strings.md`.

## Merged from `2026-10-21-179-native-speaker-review-identity-provider-strings.md` (2026-11-28)

The strings this todo listed, copied in full:

#### Problem

Phase 179 adds 36 message keys for the identity-provider registration (the provider's panel on the registration page, the success view, the error screen, the pending-address reminder on the home, the settings page's pending address, `NothingToEdit` without an address and the sign-in page's address-taken notice). The English strings are the UI contract's (`179-UI-SPEC.md` § *Copywriting Contract* → *New messages*). Every string in `da`, `et`, `fi`, `fr`, `lb` and `sv` — 216 strings — was constructed from each catalogue's own terms and read by no native speaker. This is the operator's concern of Phase 178 UAT item 11; it sits beside `2026-10-07-174-native-speaker-review-sign-in-mail.md`, which the same reviewers are owed.

##### The terms each string was built from

| Locale | The provider (`contestantApp.register.modes.identityProvider`) | Party (`common.organization`) | Address form | Other terms reused |
| --- | --- | --- | --- | --- |
| `fi` | "Pankkitunnuksilla" → *pankkitunnuksilla*, *tunnistautua*, *pankkitunnistautumispalvelu* (the legacy start page's help line) | *puolue* | *sinä* | *ota yhteyttä tukeen* (`contestantApp.emailSent.support`), *ylläpitäjä vahvistaa* (`dynamic.contestantAppBasicInfo.identity.name.editable`), *kirjautua* |
| `sv` | "Med bank-id" → *med bank-id*, *bank-id-tjänsten*, *identifiera dig* | *parti* | *du* | *kontakta supporten*, *en administratör bekräftar*, *logga in* |
| `da` | "Med BankID" → *med BankID*, *BankID-tjenesten*, *identificere dig* | *parti* | *du* | *kontakt support*, *en administrator bekræfter*, *logge ind* |
| `et` | "Pangatunnustega" → *pangatunnustega*, *pangatuvastuse teenus*, *tuvastada end* | *erakond* | *sina* in `contestantApp.identityProvider`, `contestantApp.register` and `contestantApp.settings`; *teie* in `contestantApp.home`, `contestantApp.nothingToEdit` and `contestantApp.login`, following each namespace's existing strings | *võta ühendust toega*, *administraator kinnitab*, *logi sisse* |
| `fr` | "Avec un Bank ID" → *avec un Bank ID*, *le service Bank ID*, *s’identifier* | *parti* | *vous*, with the catalogue's inclusive *·e* forms | *contactez l’assistance*, *un administrateur confirme*, *se connecter*, *s’inscrire* |
| `lb` | "Mat engem Bank ID" → *mat engem Bank ID*, *de Bank-ID-Service*, *Iech identifizéieren* | *Partei* | *Dir*, with the catalogue's *Kandidat*in* form | *kontaktéiert de Support*, *en Administrateur confirméiert*, *Iech umellen*, *aschreiwen* |

What a reviewer should also judge:

- **`contestantApp.identityProvider.nameRequired`** carries `{language}`, a language's own name (*Suomi*, *Svenska*). English says "in {language}"; the six other locales use the frame "(language: {language})" so that the name fits unchanged whatever case the sentence would need.
- **`contestantApp.register.identityProvider.types.legend` and its two answers** are one question and two answers. In `fi` and `et` the answers are written as objects of the question (*Puolueen*, *Erakonna*); the reviewer should judge whether a nominative reads better as a radio label.
- **"Until you open it"** (`alreadyRegistered.pending`, `emailIntro`) repeats the noun "link" in every locale, as the contract asks.
- **`emailInUse`**: "or sign in with that address instead" must keep its conditional; it is not an instruction to sign in now.
- **Estonian**: the namespaces this phase writes into already differ in their form of address (see the table); the new strings follow each namespace, so the success view (informal) and the home (formal) address the same user differently.

##### The Swedish sign-in label, changed

`common.login` in `sv` read "Registrera dig" ("register") on the sign-in page's main button and in the menu. It now reads **"Logga in"** (item U-23 of the UI contract). Beside it, `contestantApp.login.signInWithEmail` ("Logga in med e-post") and the sign-in mail's anchor label already said *logga in*. **`contestantApp.login.title` in `sv` still reads "Registrera dig"**: the sign-in page's own heading says "register". The phase rewords only `common.login`; the reviewer should judge the title in the same sitting (the English is "Sign in").

##### The confirmation mail (written by plan 179-10)

The address-confirmation mail of `account-access` has five parts in each locale, built by the same template as the sign-in and recovery mails: the subject, the sentence before the link, the link's text, the sentence after it and the last sentence. The English is in `179-UI-SPEC.md` § *The confirmation mail*. The six non-English versions are in `apps/supabase/supabase/functions/account-access/mailTemplates.ts` and belong to this review; they are listed part by part under *The confirmation mail, by locale* below.

#### The strings, by locale

Each table lists every added key with the English contract string and the constructed string. The keys are the same in each locale.

##### `fi`

| Key | English | fi |
| --- | --- | --- |
| `contestantApp.register.identityProvider.intro.candidate` | To register as a candidate, identify yourself with Bank ID. Your candidate profile is created with the name in your identification. | Rekisteröityäksesi ehdokkaaksi tunnistaudu pankkitunnuksilla. Ehdokasprofiilisi luodaan tunnistautumisessa saadulla nimellä. |
| `contestantApp.register.identityProvider.intro.organization` | To register a party, identify yourself with Bank ID and then enter the party’s name. An administrator confirms the party before it is shown to voters. | Rekisteröidäksesi puolueen tunnistaudu pankkitunnuksilla ja kirjoita sitten puolueen nimi. Ylläpitäjä vahvistaa puolueen ennen kuin se näytetään äänestäjille. |
| `contestantApp.register.identityProvider.intro.both` | Identify yourself with Bank ID to register yourself as a candidate or to register a party. | Tunnistaudu pankkitunnuksilla rekisteröityäksesi ehdokkaaksi tai rekisteröidäksesi puolueen. |
| `contestantApp.register.identityProvider.redirectInfo` | You will be taken to the Bank ID service. When you have identified yourself, you will come back to this application. | Sinut ohjataan pankkitunnistautumispalveluun. Kun olet tunnistautunut, palaat takaisin tähän sovellukseen. |
| `contestantApp.register.identityProvider.types.legend` | What would you like to register? | Mitä haluat rekisteröidä? |
| `contestantApp.register.identityProvider.types.candidate` | Myself, as a candidate | Itseni ehdokkaaksi |
| `contestantApp.register.identityProvider.types.organization` | A party | Puolueen |
| `contestantApp.register.identityProvider.types.required` | Choose what you would like to register. | Valitse, mitä haluat rekisteröidä. |
| `contestantApp.identityProvider.title.complete` | Complete your registration | Viimeistele rekisteröitymisesi |
| `contestantApp.identityProvider.title.alreadyRegistered` | You have already registered | Olet jo rekisteröitynyt |
| `contestantApp.identityProvider.heroEmoji` | 👍 | 👍 |
| `contestantApp.identityProvider.identified` | You have identified yourself. | Olet tunnistautunut. |
| `contestantApp.identityProvider.emailIntro` | Enter the email address you want to sign in with next time. We’ll send a confirmation link to it. You can continue right away. Until you open the link, sign in with Bank ID. | Kirjoita sähköpostiosoite, jolla haluat kirjautua seuraavalla kerralla. Lähetämme siihen vahvistuslinkin. Voit jatkaa heti. Kunnes avaat linkin, kirjaudu pankkitunnuksilla. |
| `contestantApp.identityProvider.nameIntro` | Enter your party’s name to continue. | Kirjoita puolueesi nimi jatkaaksesi. |
| `contestantApp.identityProvider.alreadyRegistered.none` | You have already registered, but we don’t have an email address for you yet. | Olet jo rekisteröitynyt, mutta meillä ei vielä ole sähköpostiosoitettasi. |
| `contestantApp.identityProvider.alreadyRegistered.pending` | You have already registered. We have sent a confirmation link to the address below. Until you open it, sign in with Bank ID. | Olet jo rekisteröitynyt. Olemme lähettäneet vahvistuslinkin alla näkyvään osoitteeseen. Kunnes avaat linkin, kirjaudu pankkitunnuksilla. |
| `contestantApp.identityProvider.alreadyRegistered.proved` | You have already registered. Please use your email address to sign in next time. | Olet jo rekisteröitynyt. Käytä seuraavalla kerralla kirjautumiseen sähköpostiosoitettasi. |
| `contestantApp.identityProvider.signInEmail` | Your sign-in email address | Sähköpostiosoite, jolla kirjaudut |
| `contestantApp.identityProvider.awaitingConfirmation` | Awaiting confirmation | Odottaa vahvistusta |
| `contestantApp.identityProvider.emailInUse` | This email address is already used by another account. Enter a different address, or sign in with that address instead. | Tämä sähköpostiosoite on jo toisen tilin käytössä. Kirjoita toinen osoite tai kirjaudu sen sijaan sillä osoitteella. |
| `contestantApp.identityProvider.emailTakenNotice` | The address you entered earlier is now used by another account, so it could not be added to yours. Enter a different address. | Aiemmin antamasi osoite on nyt toisen tilin käytössä, joten sitä ei voitu lisätä tiliisi. Kirjoita toinen osoite. |
| `contestantApp.identityProvider.nameRequired` | Enter your party’s name in {language}. | Kirjoita puolueesi nimi (kieli: {language}). |
| `contestantApp.identityProvider.saveFailed` | We couldn’t save your details. Please try again. If the problem persists, please contact support. | Tietojasi ei voitu tallentaa. Yritä uudelleen. Jos ongelma jatkuu, ota yhteyttä tukeen. |
| `contestantApp.identityProvider.error.cancelled.title` | Identification cancelled | Tunnistautuminen peruttiin |
| `contestantApp.identityProvider.error.cancelled.content` | You cancelled the identification, and nothing was saved. You can identify yourself again whenever you are ready. | Peruit tunnistautumisen, eikä mitään tallennettu. Voit tunnistautua uudelleen, kun olet valmis. |
| `contestantApp.identityProvider.error.cancelled.support` | If you need help, contact support. | Jos tarvitset apua, ota yhteyttä tukeen. |
| `contestantApp.identityProvider.error.retry.title` | Identification did not succeed | Tunnistautuminen ei onnistunut |
| `contestantApp.identityProvider.error.retry.content` | We’re sorry, the identification could not be completed. Please try again. | Pahoittelemme, tunnistautumista ei voitu viedä loppuun. Yritä uudelleen. |
| `contestantApp.identityProvider.error.noRetry.title` | Registration is not possible right now | Rekisteröityminen ei ole juuri nyt mahdollista |
| `contestantApp.identityProvider.error.noRetry.content` | We’re sorry, this is a problem on our side, and trying again will not help. Please contact support. | Pahoittelemme, kyseessä on ongelma meidän päässämme, eikä uudelleen yrittäminen auta. Ota yhteyttä tukeen. |
| `contestantApp.identityProvider.error.tryAgain` | Try again | Yritä uudelleen |
| `contestantApp.home.emailPending` | Your email address has not been confirmed yet. Open the link we sent to it. Until you do, sign in with Bank ID. | Sähköpostiosoitettasi ei ole vielä vahvistettu. Avaa linkki, jonka lähetimme siihen. Kunnes avaat linkin, kirjaudu pankkitunnuksilla. |
| `contestantApp.settings.emailPendingInfo` | This address has not been confirmed yet. Until you open the link we sent to it, sign in with Bank ID. | Tätä osoitetta ei ole vielä vahvistettu. Kunnes avaat linkin, jonka lähetimme siihen, kirjaudu pankkitunnuksilla. |
| `contestantApp.settings.saveEmail` | Save email address | Tallenna sähköpostiosoite |
| `contestantApp.nothingToEdit.nextStepsNoAddress` | Contact support and tell them that you registered with Bank ID. | Ota yhteyttä tukeen ja kerro, että rekisteröidyit pankkitunnuksilla. |
| `contestantApp.login.emailTaken` | That email address is now used by another account, so it could not be added to yours. Sign in with Bank ID and enter a different address. | Sitä sähköpostiosoitetta käyttää nyt toinen tili, joten sitä ei voitu lisätä tiliisi. Kirjaudu pankkitunnuksilla ja kirjoita toinen osoite. |

##### `sv`

| Key | English | sv |
| --- | --- | --- |
| `contestantApp.register.identityProvider.intro.candidate` | To register as a candidate, identify yourself with Bank ID. Your candidate profile is created with the name in your identification. | För att registrera dig som kandidat identifierar du dig med bank-id. Din kandidatprofil skapas med namnet i din identifiering. |
| `contestantApp.register.identityProvider.intro.organization` | To register a party, identify yourself with Bank ID and then enter the party’s name. An administrator confirms the party before it is shown to voters. | För att registrera ett parti identifierar du dig med bank-id och anger sedan partiets namn. En administratör bekräftar partiet innan det visas för väljarna. |
| `contestantApp.register.identityProvider.intro.both` | Identify yourself with Bank ID to register yourself as a candidate or to register a party. | Identifiera dig med bank-id för att registrera dig som kandidat eller för att registrera ett parti. |
| `contestantApp.register.identityProvider.redirectInfo` | You will be taken to the Bank ID service. When you have identified yourself, you will come back to this application. | Du skickas vidare till bank-id-tjänsten. När du har identifierat dig kommer du tillbaka till den här applikationen. |
| `contestantApp.register.identityProvider.types.legend` | What would you like to register? | Vad vill du registrera? |
| `contestantApp.register.identityProvider.types.candidate` | Myself, as a candidate | Mig själv som kandidat |
| `contestantApp.register.identityProvider.types.organization` | A party | Ett parti |
| `contestantApp.register.identityProvider.types.required` | Choose what you would like to register. | Välj vad du vill registrera. |
| `contestantApp.identityProvider.title.complete` | Complete your registration | Slutför din registrering |
| `contestantApp.identityProvider.title.alreadyRegistered` | You have already registered | Du har redan registrerat dig |
| `contestantApp.identityProvider.heroEmoji` | 👍 | 👍 |
| `contestantApp.identityProvider.identified` | You have identified yourself. | Du har identifierat dig. |
| `contestantApp.identityProvider.emailIntro` | Enter the email address you want to sign in with next time. We’ll send a confirmation link to it. You can continue right away. Until you open the link, sign in with Bank ID. | Ange den e-postadress du vill logga in med nästa gång. Vi skickar en bekräftelselänk till den. Du kan fortsätta direkt. Tills du öppnar länken loggar du in med bank-id. |
| `contestantApp.identityProvider.nameIntro` | Enter your party’s name to continue. | Ange ditt partis namn för att fortsätta. |
| `contestantApp.identityProvider.alreadyRegistered.none` | You have already registered, but we don’t have an email address for you yet. | Du har redan registrerat dig, men vi har ännu ingen e-postadress till dig. |
| `contestantApp.identityProvider.alreadyRegistered.pending` | You have already registered. We have sent a confirmation link to the address below. Until you open it, sign in with Bank ID. | Du har redan registrerat dig. Vi har skickat en bekräftelselänk till adressen nedan. Tills du öppnar länken loggar du in med bank-id. |
| `contestantApp.identityProvider.alreadyRegistered.proved` | You have already registered. Please use your email address to sign in next time. | Du har redan registrerat dig. Använd din e-postadress för att logga in nästa gång. |
| `contestantApp.identityProvider.signInEmail` | Your sign-in email address | Din e-postadress för inloggning |
| `contestantApp.identityProvider.awaitingConfirmation` | Awaiting confirmation | Väntar på bekräftelse |
| `contestantApp.identityProvider.emailInUse` | This email address is already used by another account. Enter a different address, or sign in with that address instead. | Den här e-postadressen används redan av ett annat konto. Ange en annan adress, eller logga in med den adressen i stället. |
| `contestantApp.identityProvider.emailTakenNotice` | The address you entered earlier is now used by another account, so it could not be added to yours. Enter a different address. | Adressen du angav tidigare används nu av ett annat konto, så den kunde inte läggas till ditt. Ange en annan adress. |
| `contestantApp.identityProvider.nameRequired` | Enter your party’s name in {language}. | Ange ditt partis namn (språk: {language}). |
| `contestantApp.identityProvider.saveFailed` | We couldn’t save your details. Please try again. If the problem persists, please contact support. | Vi kunde inte spara dina uppgifter. Försök igen. Kontakta supporten om problemet kvarstår. |
| `contestantApp.identityProvider.error.cancelled.title` | Identification cancelled | Identifieringen avbröts |
| `contestantApp.identityProvider.error.cancelled.content` | You cancelled the identification, and nothing was saved. You can identify yourself again whenever you are ready. | Du avbröt identifieringen, och ingenting sparades. Du kan identifiera dig igen när du är redo. |
| `contestantApp.identityProvider.error.cancelled.support` | If you need help, contact support. | Kontakta supporten om du behöver hjälp. |
| `contestantApp.identityProvider.error.retry.title` | Identification did not succeed | Identifieringen lyckades inte |
| `contestantApp.identityProvider.error.retry.content` | We’re sorry, the identification could not be completed. Please try again. | Vi beklagar, identifieringen kunde inte slutföras. Försök igen. |
| `contestantApp.identityProvider.error.noRetry.title` | Registration is not possible right now | Registrering är inte möjlig just nu |
| `contestantApp.identityProvider.error.noRetry.content` | We’re sorry, this is a problem on our side, and trying again will not help. Please contact support. | Vi beklagar, det här är ett problem hos oss, och det hjälper inte att försöka igen. Kontakta supporten. |
| `contestantApp.identityProvider.error.tryAgain` | Try again | Försök igen |
| `contestantApp.home.emailPending` | Your email address has not been confirmed yet. Open the link we sent to it. Until you do, sign in with Bank ID. | Din e-postadress har inte bekräftats ännu. Öppna länken vi skickade till den. Tills du gör det loggar du in med bank-id. |
| `contestantApp.settings.emailPendingInfo` | This address has not been confirmed yet. Until you open the link we sent to it, sign in with Bank ID. | Den här adressen har inte bekräftats ännu. Tills du öppnar länken vi skickade till den loggar du in med bank-id. |
| `contestantApp.settings.saveEmail` | Save email address | Spara e-postadress |
| `contestantApp.nothingToEdit.nextStepsNoAddress` | Contact support and tell them that you registered with Bank ID. | Kontakta supporten och berätta att du registrerade dig med bank-id. |
| `contestantApp.login.emailTaken` | That email address is now used by another account, so it could not be added to yours. Sign in with Bank ID and enter a different address. | Den e-postadressen används nu av ett annat konto, så den kunde inte läggas till ditt. Logga in med bank-id och ange en annan adress. |

##### `da`

| Key | English | da |
| --- | --- | --- |
| `contestantApp.register.identityProvider.intro.candidate` | To register as a candidate, identify yourself with Bank ID. Your candidate profile is created with the name in your identification. | For at registrere dig som kandidat skal du identificere dig med BankID. Din kandidatprofil oprettes med navnet fra din identifikation. |
| `contestantApp.register.identityProvider.intro.organization` | To register a party, identify yourself with Bank ID and then enter the party’s name. An administrator confirms the party before it is shown to voters. | For at registrere et parti skal du identificere dig med BankID og derefter indtaste partiets navn. En administrator bekræfter partiet, før det vises for vælgerne. |
| `contestantApp.register.identityProvider.intro.both` | Identify yourself with Bank ID to register yourself as a candidate or to register a party. | Identificer dig med BankID for at registrere dig som kandidat eller for at registrere et parti. |
| `contestantApp.register.identityProvider.redirectInfo` | You will be taken to the Bank ID service. When you have identified yourself, you will come back to this application. | Du bliver sendt videre til BankID-tjenesten. Når du har identificeret dig, kommer du tilbage til denne applikation. |
| `contestantApp.register.identityProvider.types.legend` | What would you like to register? | Hvad vil du registrere? |
| `contestantApp.register.identityProvider.types.candidate` | Myself, as a candidate | Mig selv som kandidat |
| `contestantApp.register.identityProvider.types.organization` | A party | Et parti |
| `contestantApp.register.identityProvider.types.required` | Choose what you would like to register. | Vælg, hvad du vil registrere. |
| `contestantApp.identityProvider.title.complete` | Complete your registration | Fuldfør din registrering |
| `contestantApp.identityProvider.title.alreadyRegistered` | You have already registered | Du har allerede registreret dig |
| `contestantApp.identityProvider.heroEmoji` | 👍 | 👍 |
| `contestantApp.identityProvider.identified` | You have identified yourself. | Du har identificeret dig. |
| `contestantApp.identityProvider.emailIntro` | Enter the email address you want to sign in with next time. We’ll send a confirmation link to it. You can continue right away. Until you open the link, sign in with Bank ID. | Indtast den e-mailadresse, du vil logge ind med næste gang. Vi sender et bekræftelseslink til den. Du kan fortsætte med det samme. Indtil du åbner linket, skal du logge ind med BankID. |
| `contestantApp.identityProvider.nameIntro` | Enter your party’s name to continue. | Indtast dit partis navn for at fortsætte. |
| `contestantApp.identityProvider.alreadyRegistered.none` | You have already registered, but we don’t have an email address for you yet. | Du har allerede registreret dig, men vi har endnu ikke en e-mailadresse til dig. |
| `contestantApp.identityProvider.alreadyRegistered.pending` | You have already registered. We have sent a confirmation link to the address below. Until you open it, sign in with Bank ID. | Du har allerede registreret dig. Vi har sendt et bekræftelseslink til adressen nedenfor. Indtil du åbner linket, skal du logge ind med BankID. |
| `contestantApp.identityProvider.alreadyRegistered.proved` | You have already registered. Please use your email address to sign in next time. | Du har allerede registreret dig. Brug din e-mailadresse til at logge ind næste gang. |
| `contestantApp.identityProvider.signInEmail` | Your sign-in email address | Din e-mailadresse til login |
| `contestantApp.identityProvider.awaitingConfirmation` | Awaiting confirmation | Afventer bekræftelse |
| `contestantApp.identityProvider.emailInUse` | This email address is already used by another account. Enter a different address, or sign in with that address instead. | Denne e-mailadresse bruges allerede af en anden konto. Indtast en anden adresse, eller log i stedet ind med den adresse. |
| `contestantApp.identityProvider.emailTakenNotice` | The address you entered earlier is now used by another account, so it could not be added to yours. Enter a different address. | Adressen, du indtastede tidligere, bruges nu af en anden konto, så den kunne ikke føjes til din. Indtast en anden adresse. |
| `contestantApp.identityProvider.nameRequired` | Enter your party’s name in {language}. | Indtast dit partis navn (sprog: {language}). |
| `contestantApp.identityProvider.saveFailed` | We couldn’t save your details. Please try again. If the problem persists, please contact support. | Vi kunne ikke gemme dine oplysninger. Prøv igen. Kontakt support, hvis problemet fortsætter. |
| `contestantApp.identityProvider.error.cancelled.title` | Identification cancelled | Identifikationen blev afbrudt |
| `contestantApp.identityProvider.error.cancelled.content` | You cancelled the identification, and nothing was saved. You can identify yourself again whenever you are ready. | Du afbrød identifikationen, og intet blev gemt. Du kan identificere dig igen, når du er klar. |
| `contestantApp.identityProvider.error.cancelled.support` | If you need help, contact support. | Kontakt support, hvis du har brug for hjælp. |
| `contestantApp.identityProvider.error.retry.title` | Identification did not succeed | Identifikationen lykkedes ikke |
| `contestantApp.identityProvider.error.retry.content` | We’re sorry, the identification could not be completed. Please try again. | Vi beklager, identifikationen kunne ikke gennemføres. Prøv igen. |
| `contestantApp.identityProvider.error.noRetry.title` | Registration is not possible right now | Registrering er ikke mulig lige nu |
| `contestantApp.identityProvider.error.noRetry.content` | We’re sorry, this is a problem on our side, and trying again will not help. Please contact support. | Vi beklager, det er et problem hos os, og det hjælper ikke at prøve igen. Kontakt support. |
| `contestantApp.identityProvider.error.tryAgain` | Try again | Prøv igen |
| `contestantApp.home.emailPending` | Your email address has not been confirmed yet. Open the link we sent to it. Until you do, sign in with Bank ID. | Din e-mailadresse er ikke bekræftet endnu. Åbn linket, vi sendte til den. Indtil du gør det, skal du logge ind med BankID. |
| `contestantApp.settings.emailPendingInfo` | This address has not been confirmed yet. Until you open the link we sent to it, sign in with Bank ID. | Denne adresse er ikke bekræftet endnu. Indtil du åbner linket, vi sendte til den, skal du logge ind med BankID. |
| `contestantApp.settings.saveEmail` | Save email address | Gem e-mailadresse |
| `contestantApp.nothingToEdit.nextStepsNoAddress` | Contact support and tell them that you registered with Bank ID. | Kontakt support, og fortæl, at du har registreret dig med BankID. |
| `contestantApp.login.emailTaken` | That email address is now used by another account, so it could not be added to yours. Sign in with Bank ID and enter a different address. | Den e-mailadresse bruges nu af en anden konto, så den kunne ikke føjes til din. Log ind med BankID, og indtast en anden adresse. |

##### `et`

| Key | English | et |
| --- | --- | --- |
| `contestantApp.register.identityProvider.intro.candidate` | To register as a candidate, identify yourself with Bank ID. Your candidate profile is created with the name in your identification. | Kandidaadiks registreerumiseks tuvasta end pangatunnustega. Sinu kandidaadiprofiil luuakse tuvastamisel saadud nimega. |
| `contestantApp.register.identityProvider.intro.organization` | To register a party, identify yourself with Bank ID and then enter the party’s name. An administrator confirms the party before it is shown to voters. | Erakonna registreerimiseks tuvasta end pangatunnustega ja sisesta seejärel erakonna nimi. Administraator kinnitab erakonna enne, kui seda valijatele näidatakse. |
| `contestantApp.register.identityProvider.intro.both` | Identify yourself with Bank ID to register yourself as a candidate or to register a party. | Tuvasta end pangatunnustega, et registreeruda kandidaadiks või registreerida erakond. |
| `contestantApp.register.identityProvider.redirectInfo` | You will be taken to the Bank ID service. When you have identified yourself, you will come back to this application. | Sind suunatakse pangatuvastuse teenusesse. Kui oled end tuvastanud, tuled tagasi sellesse rakendusse. |
| `contestantApp.register.identityProvider.types.legend` | What would you like to register? | Mida soovid registreerida? |
| `contestantApp.register.identityProvider.types.candidate` | Myself, as a candidate | Ennast kandidaadiks |
| `contestantApp.register.identityProvider.types.organization` | A party | Erakonna |
| `contestantApp.register.identityProvider.types.required` | Choose what you would like to register. | Vali, mida soovid registreerida. |
| `contestantApp.identityProvider.title.complete` | Complete your registration | Lõpeta oma registreerumine |
| `contestantApp.identityProvider.title.alreadyRegistered` | You have already registered | Oled juba registreerunud |
| `contestantApp.identityProvider.heroEmoji` | 👍 | 👍 |
| `contestantApp.identityProvider.identified` | You have identified yourself. | Oled end tuvastanud. |
| `contestantApp.identityProvider.emailIntro` | Enter the email address you want to sign in with next time. We’ll send a confirmation link to it. You can continue right away. Until you open the link, sign in with Bank ID. | Sisesta e-posti aadress, millega soovid järgmisel korral sisse logida. Saadame sellele kinnituslingi. Saad kohe jätkata. Kuni sa pole linki avanud, logi sisse pangatunnustega. |
| `contestantApp.identityProvider.nameIntro` | Enter your party’s name to continue. | Jätkamiseks sisesta oma erakonna nimi. |
| `contestantApp.identityProvider.alreadyRegistered.none` | You have already registered, but we don’t have an email address for you yet. | Oled juba registreerunud, kuid meil pole veel sinu e-posti aadressi. |
| `contestantApp.identityProvider.alreadyRegistered.pending` | You have already registered. We have sent a confirmation link to the address below. Until you open it, sign in with Bank ID. | Oled juba registreerunud. Saatsime kinnituslingi allolevale aadressile. Kuni sa pole linki avanud, logi sisse pangatunnustega. |
| `contestantApp.identityProvider.alreadyRegistered.proved` | You have already registered. Please use your email address to sign in next time. | Oled juba registreerunud. Kasuta järgmisel korral sisselogimiseks oma e-posti aadressi. |
| `contestantApp.identityProvider.signInEmail` | Your sign-in email address | Sinu sisselogimise e-posti aadress |
| `contestantApp.identityProvider.awaitingConfirmation` | Awaiting confirmation | Ootab kinnitamist |
| `contestantApp.identityProvider.emailInUse` | This email address is already used by another account. Enter a different address, or sign in with that address instead. | Seda e-posti aadressi kasutab juba teine konto. Sisesta mõni teine aadress või logi selle asemel sisse selle aadressiga. |
| `contestantApp.identityProvider.emailTakenNotice` | The address you entered earlier is now used by another account, so it could not be added to yours. Enter a different address. | Varem sisestatud aadressi kasutab nüüd teine konto, seega ei saanud seda sinu kontole lisada. Sisesta mõni teine aadress. |
| `contestantApp.identityProvider.nameRequired` | Enter your party’s name in {language}. | Sisesta oma erakonna nimi (keel: {language}). |
| `contestantApp.identityProvider.saveFailed` | We couldn’t save your details. Please try again. If the problem persists, please contact support. | Sinu andmeid ei õnnestunud salvestada. Proovi uuesti. Kui probleem püsib, võta palun ühendust toega. |
| `contestantApp.identityProvider.error.cancelled.title` | Identification cancelled | Tuvastamine katkestati |
| `contestantApp.identityProvider.error.cancelled.content` | You cancelled the identification, and nothing was saved. You can identify yourself again whenever you are ready. | Katkestasid tuvastamise ja midagi ei salvestatud. Saad end uuesti tuvastada, kui oled valmis. |
| `contestantApp.identityProvider.error.cancelled.support` | If you need help, contact support. | Kui vajad abi, võta ühendust toega. |
| `contestantApp.identityProvider.error.retry.title` | Identification did not succeed | Tuvastamine ei õnnestunud |
| `contestantApp.identityProvider.error.retry.content` | We’re sorry, the identification could not be completed. Please try again. | Vabandame, tuvastamist ei õnnestunud lõpule viia. Proovi uuesti. |
| `contestantApp.identityProvider.error.noRetry.title` | Registration is not possible right now | Registreerumine ei ole praegu võimalik |
| `contestantApp.identityProvider.error.noRetry.content` | We’re sorry, this is a problem on our side, and trying again will not help. Please contact support. | Vabandame, tegemist on probleemiga meie poolel ja uuesti proovimine ei aita. Palun võta ühendust toega. |
| `contestantApp.identityProvider.error.tryAgain` | Try again | Proovi uuesti |
| `contestantApp.home.emailPending` | Your email address has not been confirmed yet. Open the link we sent to it. Until you do, sign in with Bank ID. | Teie e-posti aadressi ei ole veel kinnitatud. Avage link, mille sellele saatsime. Kuni te seda pole teinud, logige sisse pangatunnustega. |
| `contestantApp.settings.emailPendingInfo` | This address has not been confirmed yet. Until you open the link we sent to it, sign in with Bank ID. | Seda aadressi ei ole veel kinnitatud. Kuni sa pole avanud linki, mille sellele saatsime, logi sisse pangatunnustega. |
| `contestantApp.settings.saveEmail` | Save email address | Salvesta e-posti aadress |
| `contestantApp.nothingToEdit.nextStepsNoAddress` | Contact support and tell them that you registered with Bank ID. | Võtke ühendust toega ja öelge neile, et registreerusite pangatunnustega. |
| `contestantApp.login.emailTaken` | That email address is now used by another account, so it could not be added to yours. Sign in with Bank ID and enter a different address. | Seda e-posti aadressi kasutab nüüd teine konto, seega ei saanud seda teie kontole lisada. Logige sisse pangatunnustega ja sisestage mõni teine aadress. |

##### `fr`

| Key | English | fr |
| --- | --- | --- |
| `contestantApp.register.identityProvider.intro.candidate` | To register as a candidate, identify yourself with Bank ID. Your candidate profile is created with the name in your identification. | Pour vous inscrire en tant que candidat·e, identifiez-vous avec un Bank ID. Votre profil de candidat·e est créé avec le nom figurant dans votre identification. |
| `contestantApp.register.identityProvider.intro.organization` | To register a party, identify yourself with Bank ID and then enter the party’s name. An administrator confirms the party before it is shown to voters. | Pour inscrire un parti, identifiez-vous avec un Bank ID, puis saisissez le nom du parti. Un administrateur confirme le parti avant qu’il ne soit présenté aux électeurs. |
| `contestantApp.register.identityProvider.intro.both` | Identify yourself with Bank ID to register yourself as a candidate or to register a party. | Identifiez-vous avec un Bank ID pour vous inscrire en tant que candidat·e ou pour inscrire un parti. |
| `contestantApp.register.identityProvider.redirectInfo` | You will be taken to the Bank ID service. When you have identified yourself, you will come back to this application. | Vous serez redirigé·e vers le service Bank ID. Une fois identifié·e, vous reviendrez dans cette application. |
| `contestantApp.register.identityProvider.types.legend` | What would you like to register? | Que souhaitez-vous inscrire ? |
| `contestantApp.register.identityProvider.types.candidate` | Myself, as a candidate | Moi-même, en tant que candidat·e |
| `contestantApp.register.identityProvider.types.organization` | A party | Un parti |
| `contestantApp.register.identityProvider.types.required` | Choose what you would like to register. | Choisissez ce que vous souhaitez inscrire. |
| `contestantApp.identityProvider.title.complete` | Complete your registration | Finalisez votre inscription |
| `contestantApp.identityProvider.title.alreadyRegistered` | You have already registered | Vous êtes déjà inscrit·e |
| `contestantApp.identityProvider.heroEmoji` | 👍 | 👍 |
| `contestantApp.identityProvider.identified` | You have identified yourself. | Vous vous êtes identifié·e. |
| `contestantApp.identityProvider.emailIntro` | Enter the email address you want to sign in with next time. We’ll send a confirmation link to it. You can continue right away. Until you open the link, sign in with Bank ID. | Saisissez l’adresse e-mail avec laquelle vous souhaitez vous connecter la prochaine fois. Nous y enverrons un lien de confirmation. Vous pouvez continuer tout de suite. Tant que vous n’avez pas ouvert le lien, connectez-vous avec un Bank ID. |
| `contestantApp.identityProvider.nameIntro` | Enter your party’s name to continue. | Saisissez le nom de votre parti pour continuer. |
| `contestantApp.identityProvider.alreadyRegistered.none` | You have already registered, but we don’t have an email address for you yet. | Vous êtes déjà inscrit·e, mais nous n’avons pas encore d’adresse e-mail pour vous. |
| `contestantApp.identityProvider.alreadyRegistered.pending` | You have already registered. We have sent a confirmation link to the address below. Until you open it, sign in with Bank ID. | Vous êtes déjà inscrit·e. Nous avons envoyé un lien de confirmation à l’adresse ci-dessous. Tant que vous n’avez pas ouvert le lien, connectez-vous avec un Bank ID. |
| `contestantApp.identityProvider.alreadyRegistered.proved` | You have already registered. Please use your email address to sign in next time. | Vous êtes déjà inscrit·e. Veuillez utiliser votre adresse e-mail pour vous connecter la prochaine fois. |
| `contestantApp.identityProvider.signInEmail` | Your sign-in email address | Votre adresse e-mail de connexion |
| `contestantApp.identityProvider.awaitingConfirmation` | Awaiting confirmation | En attente de confirmation |
| `contestantApp.identityProvider.emailInUse` | This email address is already used by another account. Enter a different address, or sign in with that address instead. | Cette adresse e-mail est déjà utilisée par un autre compte. Saisissez une autre adresse, ou connectez-vous plutôt avec cette adresse. |
| `contestantApp.identityProvider.emailTakenNotice` | The address you entered earlier is now used by another account, so it could not be added to yours. Enter a different address. | L’adresse que vous avez saisie précédemment est désormais utilisée par un autre compte ; elle n’a donc pas pu être ajoutée au vôtre. Saisissez une autre adresse. |
| `contestantApp.identityProvider.nameRequired` | Enter your party’s name in {language}. | Saisissez le nom de votre parti (langue : {language}). |
| `contestantApp.identityProvider.saveFailed` | We couldn’t save your details. Please try again. If the problem persists, please contact support. | Nous n’avons pas pu enregistrer vos informations. Veuillez réessayer. Si le problème persiste, veuillez contacter l’assistance. |
| `contestantApp.identityProvider.error.cancelled.title` | Identification cancelled | Identification annulée |
| `contestantApp.identityProvider.error.cancelled.content` | You cancelled the identification, and nothing was saved. You can identify yourself again whenever you are ready. | Vous avez annulé l’identification, et rien n’a été enregistré. Vous pouvez vous identifier à nouveau dès que vous êtes prêt·e. |
| `contestantApp.identityProvider.error.cancelled.support` | If you need help, contact support. | Si vous avez besoin d’aide, contactez l’assistance. |
| `contestantApp.identityProvider.error.retry.title` | Identification did not succeed | L’identification n’a pas abouti |
| `contestantApp.identityProvider.error.retry.content` | We’re sorry, the identification could not be completed. Please try again. | Nous sommes désolés, l’identification n’a pas pu être menée à bien. Veuillez réessayer. |
| `contestantApp.identityProvider.error.noRetry.title` | Registration is not possible right now | L’inscription n’est pas possible pour le moment |
| `contestantApp.identityProvider.error.noRetry.content` | We’re sorry, this is a problem on our side, and trying again will not help. Please contact support. | Nous sommes désolés, il s’agit d’un problème de notre côté, et réessayer n’y changera rien. Veuillez contacter l’assistance. |
| `contestantApp.identityProvider.error.tryAgain` | Try again | Réessayer |
| `contestantApp.home.emailPending` | Your email address has not been confirmed yet. Open the link we sent to it. Until you do, sign in with Bank ID. | Votre adresse e-mail n’a pas encore été confirmée. Ouvrez le lien que nous y avons envoyé. En attendant, connectez-vous avec un Bank ID. |
| `contestantApp.settings.emailPendingInfo` | This address has not been confirmed yet. Until you open the link we sent to it, sign in with Bank ID. | Cette adresse n’a pas encore été confirmée. Tant que vous n’avez pas ouvert le lien que nous y avons envoyé, connectez-vous avec un Bank ID. |
| `contestantApp.settings.saveEmail` | Save email address | Enregistrer l’adresse e-mail |
| `contestantApp.nothingToEdit.nextStepsNoAddress` | Contact support and tell them that you registered with Bank ID. | Contactez l’assistance et indiquez-lui que vous vous êtes inscrit·e avec un Bank ID. |
| `contestantApp.login.emailTaken` | That email address is now used by another account, so it could not be added to yours. Sign in with Bank ID and enter a different address. | Cette adresse e-mail est désormais utilisée par un autre compte ; elle n’a donc pas pu être ajoutée au vôtre. Connectez-vous avec un Bank ID et saisissez une autre adresse. |

##### `lb`

| Key | English | lb |
| --- | --- | --- |
| `contestantApp.register.identityProvider.intro.candidate` | To register as a candidate, identify yourself with Bank ID. Your candidate profile is created with the name in your identification. | Fir Iech als Kandidat*in anzeschreiwen, identifizéiert Iech mat engem Bank ID. Äre Kandidateprofil gëtt mam Numm aus Ärer Identifikatioun erstallt. |
| `contestantApp.register.identityProvider.intro.organization` | To register a party, identify yourself with Bank ID and then enter the party’s name. An administrator confirms the party before it is shown to voters. | Fir eng Partei anzeschreiwen, identifizéiert Iech mat engem Bank ID a gitt duerno den Numm vun der Partei an. En Administrateur confirméiert d’Partei, ier se de Wieler gewise gëtt. |
| `contestantApp.register.identityProvider.intro.both` | Identify yourself with Bank ID to register yourself as a candidate or to register a party. | Identifizéiert Iech mat engem Bank ID, fir Iech als Kandidat*in anzeschreiwen oder fir eng Partei anzeschreiwen. |
| `contestantApp.register.identityProvider.redirectInfo` | You will be taken to the Bank ID service. When you have identified yourself, you will come back to this application. | Dir gitt op de Bank-ID-Service weidergeleet. Wann Dir Iech identifizéiert hutt, kommt Dir zréck an dës Applikatioun. |
| `contestantApp.register.identityProvider.types.legend` | What would you like to register? | Wat wëllt Dir aschreiwen? |
| `contestantApp.register.identityProvider.types.candidate` | Myself, as a candidate | Mech selwer als Kandidat*in |
| `contestantApp.register.identityProvider.types.organization` | A party | Eng Partei |
| `contestantApp.register.identityProvider.types.required` | Choose what you would like to register. | Wielt, wat Dir aschreiwe wëllt. |
| `contestantApp.identityProvider.title.complete` | Complete your registration | Schléisst Är Aschreiwung of |
| `contestantApp.identityProvider.title.alreadyRegistered` | You have already registered | Dir sidd schonn ageschriwwen |
| `contestantApp.identityProvider.heroEmoji` | 👍 | 👍 |
| `contestantApp.identityProvider.identified` | You have identified yourself. | Dir hutt Iech identifizéiert. |
| `contestantApp.identityProvider.emailIntro` | Enter the email address you want to sign in with next time. We’ll send a confirmation link to it. You can continue right away. Until you open the link, sign in with Bank ID. | Gitt d’E-Mail-Adress an, mat där Dir Iech déi nächste Kéier umelle wëllt. Mir schécken e Bestätegungslink dohin. Dir kënnt direkt weidermaachen. Bis Dir de Link opgemaach hutt, mellt Iech mat engem Bank ID un. |
| `contestantApp.identityProvider.nameIntro` | Enter your party’s name to continue. | Gitt den Numm vun Ärer Partei an, fir weiderzemaachen. |
| `contestantApp.identityProvider.alreadyRegistered.none` | You have already registered, but we don’t have an email address for you yet. | Dir sidd schonn ageschriwwen, mee mir hunn nach keng E-Mail-Adress vun Iech. |
| `contestantApp.identityProvider.alreadyRegistered.pending` | You have already registered. We have sent a confirmation link to the address below. Until you open it, sign in with Bank ID. | Dir sidd schonn ageschriwwen. Mir hunn e Bestätegungslink un d’Adress hei drënner geschéckt. Bis Dir de Link opgemaach hutt, mellt Iech mat engem Bank ID un. |
| `contestantApp.identityProvider.alreadyRegistered.proved` | You have already registered. Please use your email address to sign in next time. | Dir sidd schonn ageschriwwen. Benotzt wgl. déi nächste Kéier Är E-Mail-Adress, fir Iech unzemellen. |
| `contestantApp.identityProvider.signInEmail` | Your sign-in email address | Är E-Mail-Adress fir d’Umeldung |
| `contestantApp.identityProvider.awaitingConfirmation` | Awaiting confirmation | Waart op Bestätegung |
| `contestantApp.identityProvider.emailInUse` | This email address is already used by another account. Enter a different address, or sign in with that address instead. | Dës E-Mail-Adress gëtt schonn vun engem anere Kont benotzt. Gitt eng aner Adress an, oder mellt Iech amplaz mat där Adress un. |
| `contestantApp.identityProvider.emailTakenNotice` | The address you entered earlier is now used by another account, so it could not be added to yours. Enter a different address. | D’Adress, déi Dir virdrun aginn hutt, gëtt elo vun engem anere Kont benotzt, dofir konnt se net zu Ärem Kont bäigefüügt ginn. Gitt eng aner Adress an. |
| `contestantApp.identityProvider.nameRequired` | Enter your party’s name in {language}. | Gitt den Numm vun Ärer Partei an (Sprooch: {language}). |
| `contestantApp.identityProvider.saveFailed` | We couldn’t save your details. Please try again. If the problem persists, please contact support. | Mir konnten Är Donnéeën net späicheren. Probéiert wgl. nach eng Kéier. Wann de Problem bestoe bleift, kontaktéiert wgl. de Support. |
| `contestantApp.identityProvider.error.cancelled.title` | Identification cancelled | Identifikatioun ofgebrach |
| `contestantApp.identityProvider.error.cancelled.content` | You cancelled the identification, and nothing was saved. You can identify yourself again whenever you are ready. | Dir hutt d’Identifikatioun ofgebrach, an näischt gouf gespäichert. Dir kënnt Iech nees identifizéieren, wann Dir prett sidd. |
| `contestantApp.identityProvider.error.cancelled.support` | If you need help, contact support. | Wann Dir Hëllef braucht, kontaktéiert de Support. |
| `contestantApp.identityProvider.error.retry.title` | Identification did not succeed | D’Identifikatioun huet net geklappt |
| `contestantApp.identityProvider.error.retry.content` | We’re sorry, the identification could not be completed. Please try again. | Et deet eis leed, d’Identifikatioun konnt net ofgeschloss ginn. Probéiert wgl. nach eng Kéier. |
| `contestantApp.identityProvider.error.noRetry.title` | Registration is not possible right now | D’Aschreiwung ass grad net méiglech |
| `contestantApp.identityProvider.error.noRetry.content` | We’re sorry, this is a problem on our side, and trying again will not help. Please contact support. | Et deet eis leed, dat ass e Problem bei eis, an et nach eng Kéier ze probéieren hëlleft net. Kontaktéiert wgl. de Support. |
| `contestantApp.identityProvider.error.tryAgain` | Try again | Nach eng Kéier probéieren |
| `contestantApp.home.emailPending` | Your email address has not been confirmed yet. Open the link we sent to it. Until you do, sign in with Bank ID. | Är E-Mail-Adress ass nach net bestätegt. Maacht de Link op, deen mir dohi geschéckt hunn. Bis dohin, mellt Iech mat engem Bank ID un. |
| `contestantApp.settings.emailPendingInfo` | This address has not been confirmed yet. Until you open the link we sent to it, sign in with Bank ID. | Dës Adress ass nach net bestätegt. Bis Dir de Link opgemaach hutt, deen mir dohi geschéckt hunn, mellt Iech mat engem Bank ID un. |
| `contestantApp.settings.saveEmail` | Save email address | E-Mail-Adress späicheren |
| `contestantApp.nothingToEdit.nextStepsNoAddress` | Contact support and tell them that you registered with Bank ID. | Kontaktéiert de Support a sot hinnen, datt Dir Iech mat engem Bank ID registréiert hutt. |
| `contestantApp.login.emailTaken` | That email address is now used by another account, so it could not be added to yours. Sign in with Bank ID and enter a different address. | Dës E-Mail-Adress gëtt elo vun engem anere Kont benotzt, dofir konnt se net zu Ärem Kont bäigefüügt ginn. Mellt Iech mat engem Bank ID un a gitt eng aner Adress an. |

#### The set-password view's first sentence, reworded (written by plan 179-17)

`contestantApp.setPassword.why` is the first sentence of the set-password view, which **every** user whose account has no password meets, not only identity-provider users (item U-14 of the UI contract). It said that the user signed in with a link from their email, which is false for a user who proved an address and then arrives through the identity provider. The English is the contract's; the six others were constructed from each catalogue's own words for "password", "email address" and "sign in", and keep each namespace's form of address (`et` informal, as the namespace's other strings).

| Locale | Before | Now |
| --- | --- | --- |
| `en` | You signed in with a link from your email. Choose a password so that you can also sign in with your email address and password. | Your account has no password yet. Choose one so that you can sign in with your email address and password. |
| `fi` | Kirjauduit sähköpostiisi lähetetyllä linkillä. Valitse salasana, niin voit kirjautua myös sähköpostiosoitteellasi ja salasanallasi. | Tililläsi ei ole vielä salasanaa. Valitse salasana, niin voit kirjautua sähköpostiosoitteellasi ja salasanallasi. |
| `sv` | Du loggade in med en länk från din e-post. Välj ett lösenord så att du också kan logga in med din e-postadress och ditt lösenord. | Ditt konto har inget lösenord ännu. Välj ett så att du kan logga in med din e-postadress och ditt lösenord. |
| `da` | Du loggede ind med et link fra din e-mail. Vælg en adgangskode, så du også kan logge ind med din e-mailadresse og adgangskode. | Din konto har endnu ingen adgangskode. Vælg en, så du kan logge ind med din e-mailadresse og adgangskode. |
| `et` | Logisid sisse oma e-postile saadetud lingiga. Vali parool, et saaksid sisse logida ka oma e-posti aadressi ja parooliga. | Sinu kontol pole veel parooli. Vali parool, et saaksid sisse logida oma e-posti aadressi ja parooliga. |
| `fr` | Vous vous êtes connecté·e avec un lien reçu par e-mail. Choisissez un mot de passe afin de pouvoir aussi vous connecter avec votre adresse e-mail et votre mot de passe. | Votre compte n’a pas encore de mot de passe. Choisissez-en un afin de pouvoir vous connecter avec votre adresse e-mail et votre mot de passe. |
| `lb` | Dir hutt Iech mat engem Link aus Ärer E-Mail ugemellt. Wielt e Passwuert, fir datt Dir Iech och mat Ärer E-Mail-Adress an Ärem Passwuert umelle kënnt. | Äre Kont huet nach kee Passwuert. Wielt eent, fir datt Dir Iech mat Ärer E-Mail-Adress an Ärem Passwuert umelle kënnt. |

What a reviewer should also judge: "Choose one" refers back to the password; `fi` and `et` repeat the noun (*salasana*, *parool*) where a pronoun would read poorly, and `da`, `fr`, `lb` and `sv` use the pronoun of the noun's gender (*en*, *en un*, *eent*, *ett*).

#### The confirmation mail, by locale

The five parts of the address-confirmation mail (`ADDRESS_CONFIRMATION_MAIL_TEMPLATES` in `apps/supabase/supabase/functions/account-access/mailTemplates.ts`), built from each locale's sign-in mail and the provider's word in the table of terms above. Every version keeps the sign-in mail's own sentence that the link works once and only the newest one works, and addresses nobody as the one who registered: the mail can reach a stranger whose address was mistyped, so its first sentence says "someone who registered" in every locale. A reviewer should keep that impersonal form; the Swedish uses *hen*, the Danish *vedkommende*, the French and Luxembourgish *une personne* / *eng Persoun*.

##### `fi`

| Part | English | fi |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Vahvista sähköpostiosoitteesi vaalikoneeseen |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Joku, joka rekisteröityi pankkitunnuksilla, antoi tämän osoitteen osoitteeksi, jolla hän kirjautuu sisään. Avaa tämä linkki vahvistaaksesi osoitteen ja liittääksesi sen kyseiseen tiliin: |
| The link’s text | Confirm my email address | Vahvista sähköpostiosoitteeni |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Kunnes avaat linkin, kirjaudu sovellukseen pankkitunnuksilla. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Jos et rekisteröitynyt, älä avaa linkkiä. Voit jättää tämän viestin huomiotta, eikä osoitetta liitetä mihinkään tiliin. |

##### `sv`

| Part | English | sv |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Bekräfta din e-postadress till valkompassen |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Någon som har registrerat sig med bank-id har angett den här adressen som den adress hen loggar in med. Öppna den här länken för att bekräfta adressen och koppla den till det kontot: |
| The link’s text | Confirm my email address | Bekräfta min e-postadress |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Logga in i applikationen med bank-id tills du har öppnat länken. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Om du inte har registrerat dig ska du inte öppna länken. Du kan bortse från det här meddelandet, och adressen kopplas inte till något konto. |

##### `da`

| Part | English | da |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Bekræft din e-mailadresse til valgtesten |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | En person, der har registreret sig med BankID, har angivet denne adresse som den, vedkommende vil logge ind med. Åbn dette link for at bekræfte adressen og knytte den til den konto: |
| The link’s text | Confirm my email address | Bekræft min e-mailadresse |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Indtil du åbner linket, skal du logge ind i applikationen med BankID. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Hvis du ikke har registreret dig, skal du ikke åbne linket. Du kan se bort fra denne besked, og adressen bliver ikke knyttet til nogen konto. |

##### `et`

| Part | English | et |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Kinnita oma e-posti aadress valimiskompassi jaoks |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Keegi, kes registreerus pangatunnustega, andis selle aadressi aadressiks, millega ta sisse logib. Ava see link, et aadress kinnitada ja see selle kontoga siduda: |
| The link’s text | Confirm my email address | Kinnita minu e-posti aadress |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kuni sa linki ei ava, logi rakendusse sisse pangatunnustega. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Kui sa ei registreerunud, ära ava linki. Võid seda kirja eirata ja aadressi ei seota ühegi kontoga. |

##### `fr`

| Part | English | fr |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Confirmez votre adresse e-mail pour la boussole électorale |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Une personne qui s'est inscrite avec un Bank ID a indiqué cette adresse comme celle avec laquelle elle se connectera. Ouvrez ce lien pour la confirmer et la rattacher à ce compte : |
| The link’s text | Confirm my email address | Confirmer mon adresse e-mail |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. Tant que vous n'avez pas ouvert le lien, connectez-vous à l'application avec un Bank ID. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Si vous ne vous êtes pas inscrit·e, n'ouvrez pas le lien. Vous pouvez ignorer ce message, et l'adresse ne sera rattachée à aucun compte. |

##### `lb`

| Part | English | lb |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Confirméiert Är E-Mail-Adress fir de Wal-Kompass |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Eng Persoun, déi sech mat engem Bank ID registréiert huet, huet dës Adress als déi uginn, mat där se sech umellt. Maacht dëse Link op, fir d'Adress ze confirméieren an un dee Kont ze bannen: |
| The link’s text | Confirm my email address | Meng E-Mail-Adress confirméieren |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Bis Dir de Link opmaacht, meldt Iech mat engem Bank ID an der Applikatioun un. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Wann Dir Iech net registréiert hutt, maacht de Link net op. Dir kënnt dëse Message ignoréieren, an d'Adress gëtt mat kengem Kont verbonnen. |

#### Solution

- Have a native speaker of each of the six languages read the strings in context: the registration page with the provider's option open, the error screen in its three classes (`/contestant/register/identity-provider/error?error=cancelled`, an unknown code, `configuration_error`), the success view, the home with the reminder and the settings page with a pending address.
- Apply corrections through `.planning/phases/179-identity-provider-registration-coverage-close/179-catalogue-additions.json` and its writer while the phase runs, or directly in the catalogue files after it; keep each key's placeholder set identical in the seven locales and run `yarn workspace @openvaa/frontend generate:translation-key-type` after a change.
- Judge the set-password view's reworded first sentence (above) on the set-password view.
- Then judge the confirmation mail's five parts (above) in the same sitting.

The merged todo is kept at `.planning/todos/completed/2026-10-21-179-native-speaker-review-identity-provider-strings.md`.

## Merged from `2026-10-26-179.1-native-speaker-review-of-the-phase-strings.md` (2026-11-28)

The strings this todo listed, copied in full:

#### Problem

Phase 179.1 added or reworded the message keys listed below: the confirm page a mailed link opens (`authConfirm`), the registration page's banner for a browser that has registered, the "email sent" view's address and count, the read-failure view, the home's email task, the nominations view's actions, the profile's Remove buttons and a few reworded support lines. Every text in every locale, English included, was written by an agent from each catalogue's own terms, and **no native speaker has read any of them**. They are served as they stand.

It sits beside `2026-10-21-179-native-speaker-review-identity-provider-strings.md` and `2026-10-07-174-native-speaker-review-sign-in-mail.md`, which the same reviewers are owed.

#### What to do

- For each locale, read every row below in its screen's context (the confirm page at `/<locale>/auth/confirm`, the Contestant App's registration, "email sent", home, nominations and profile screens) and correct the catalogue file in place. A correction changes text only: no key is renamed or removed.
- English is the source language: a correction of an English text is a rewording and goes through the same review in the other six locales.

#### The list, and how to derive it again

Derived at `179.1-32` from the catalogues at the phase's base commit (`.planning/phases/179.1-review-fixes-access-database-rules-contestant-app/179.1-BASE`, `910042c82`) and at HEAD: every key whose English text exists at HEAD and is absent at the base (added) or differs from it (reworded), with its text at HEAD in each of the seven locales. Keys are grouped by catalogue file. To derive it again, save the script below as `strings.mjs` and run, from the repository root, `node strings.mjs "$(cat .planning/phases/179.1-review-fixes-access-database-rules-contestant-app/179.1-BASE)" HEAD`.

34 keys: 29 added, 5 reworded in English. The list was derived with 32 keys at `179.1-32`; plan `179.1-43` added the two rows under `common`.

##### `authConfirm` (7)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `authConfirm.cancel` | added | Cancel | Annuller | Tühista | Peruuta | Annuler | Ofbriechen | Avbryt |
| `authConfirm.continue` | added | Continue | Fortsæt | Jätka | Jatka | Continuer | Weider | Fortsätt |
| `authConfirm.intro.email_change` | added | Press Continue to confirm your email address and sign in. | Tryk på Fortsæt for at bekræfte din e-mailadresse og logge ind. | Vajuta Jätka, et kinnitada oma e-posti aadress ja sisse logida. | Paina Jatka vahvistaaksesi sähköpostiosoitteesi ja kirjautuaksesi sisään. | Appuyez sur Continuer pour confirmer votre adresse e-mail et vous connecter. | Dréckt op Weider, fir Är E-Mail-Adress ze confirméieren an Iech unzemellen. | Tryck på Fortsätt för att bekräfta din e-postadress och logga in. |
| `authConfirm.intro.magiclink` | added | Press Continue to sign in. | Tryk på Fortsæt for at logge ind. | Sisselogimiseks vajuta Jätka. | Kirjaudu sisään painamalla Jatka. | Appuyez sur Continuer pour vous connecter. | Dréckt op Weider, fir Iech unzemellen. | Tryck på Fortsätt för att logga in. |
| `authConfirm.intro.recovery` | added | Press Continue to sign in and set a new password. | Tryk på Fortsæt for at logge ind og vælge en ny adgangskode. | Vajuta Jätka, et sisse logida ja määrata uus parool. | Paina Jatka kirjautuaksesi sisään ja asettaaksesi uuden salasanan. | Appuyez sur Continuer pour vous connecter et choisir un nouveau mot de passe. | Dréckt op Weider, fir Iech unzemellen an en neit Passwuert ze wielen. | Tryck på Fortsätt för att logga in och välja ett nytt lösenord. |
| `authConfirm.signedIn` | added | This browser is already signed in to an account. Continuing signs that account out first. | Denne browser er allerede logget ind på en konto. Hvis du fortsætter, bliver den konto først logget ud. | Selles brauseris on juba ühele kontole sisse logitud. Kui jätkad, logitakse see konto kõigepealt välja. | Tällä selaimella on jo kirjauduttu sisään tilille. Jos jatkat, se tili kirjataan ensin ulos. | Ce navigateur est déjà connecté à un compte. Si vous continuez, ce compte sera d’abord déconnecté. | Dëse Browser ass schonn an engem Kont ugemellt. Wann Dir weidermaacht, gëtt dee Kont fir d’éischt ausgeloggt. | Den här webbläsaren är redan inloggad på ett konto. Om du fortsätter loggas det kontot först ut. |
| `authConfirm.title` | added | Continue from your email | Fortsæt fra din e-mail | Jätka oma e-kirjast | Jatka sähköpostistasi | Continuer depuis votre e-mail | Vun Ärer E-Mail weidermaachen | Fortsätt från din e-post |

##### `common` (2)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `common.logoutFailed` | added | We could not confirm that you were logged out. You may still be logged in, so please try again. | Vi kunne ikke bekræfte, at du er logget ud. Du er muligvis stadig logget ind, så prøv igen. | Me ei saanud kinnitada, et oled välja logitud. Võid olla endiselt sisse logitud, seega proovi palun uuesti. | Uloskirjautumista ei voitu vahvistaa. Saatat olla yhä kirjautuneena, joten yritä uudelleen. | Nous n’avons pas pu confirmer votre déconnexion. Vous êtes peut-être encore connecté·e, veuillez donc réessayer. | Mir konnten net confirméieren, datt Dir ausgeloggt sidd. Dir sidd eventuell nach ëmmer ageloggt, probéiert dofir nach eng Kéier. | Vi kunde inte bekräfta att du loggades ut. Du kan fortfarande vara inloggad, så försök igen. |
| `common.logoutUnsavedChanges` | added | You have unsaved changes. They will be lost if you log out. | Du har ændringer, der ikke er gemt. De går tabt, hvis du logger ud. | Sul on salvestamata muudatusi. Need lähevad kaotsi, kui logid välja. | Sinulla on tallentamattomia muutoksia. Ne menetetään, jos kirjaudut ulos. | Vous avez des modifications non enregistrées. Elles seront perdues si vous vous déconnectez. | Dir hutt ongespäichert Ännerungen. Si gi verluer, wann Dir Iech auslogged. | Du har osparade ändringar. De går förlorade om du loggar ut. |

##### `contestantApp.basicInfo` (2)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.basicInfo.removeImage` | added | Remove portrait | Fjern portræt | Eemalda portree | Poista omakuva | Supprimer le portrait | Portrait ewechhuelen | Ta bort porträtt |
| `contestantApp.basicInfo.removeLogo` | added | Remove logo | Fjern logo | Eemalda logo | Poista logo | Supprimer le logo | Logo ewechhuelen | Ta bort logotyp |

##### `contestantApp.common` (1)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.common.contactSupportLink` | added | contact support | kontakt support | võta ühendust toega | ota yhteyttä tukeen | contactez l’assistance | kontaktéiert de Support | kontakta supporten |

##### `contestantApp.emailSent` (4)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.emailSent.intro.recoveryTo` | added | We’ve sent an email to <strong>{email}</strong>. Click on the link in it to sign in and set a new password. | Vi har sendt en e-mail til <strong>{email}</strong>. Klik på linket i e-mailen for at logge ind og vælge en ny adgangskode. | Saatsime e-kirja aadressile <strong>{email}</strong>. Sisselogimiseks ja uue parooli määramiseks klõpsa kirjas oleval lingil. | Olemme lähettäneet sähköpostiviestin osoitteeseen <strong>{email}</strong>. Klikkaa viestissä olevaa linkkiä kirjautuaksesi ja asettaaksesi uuden salasanan. | Nous avons envoyé un e-mail à <strong>{email}</strong>. Cliquez sur le lien que contient cet e-mail pour vous connecter et définir un nouveau mot de passe. | Mir hunn eng E-Mail un <strong>{email}</strong> geschéckt. Klickt op de Link an der E-Mail, fir Iech unzemellen an en neit Passwuert festzeleeën. | Vi har skickat ett e-postmeddelande till <strong>{email}</strong>. Klicka på länken i meddelandet för att logga in och ställa in ett nytt lösenord. |
| `contestantApp.emailSent.intro.signInTo` | added | We’ve sent an email to <strong>{email}</strong>. Click on the link in it to sign in. | Vi har sendt en e-mail til <strong>{email}</strong>. Klik på linket i e-mailen for at logge ind. | Saatsime e-kirja aadressile <strong>{email}</strong>. Sisselogimiseks klõpsa kirjas oleval lingil. | Olemme lähettäneet sähköpostiviestin osoitteeseen <strong>{email}</strong>. Klikkaa viestissä olevaa linkkiä kirjautuaksesi. | Nous avons envoyé un e-mail à <strong>{email}</strong>. Cliquez sur le lien que contient cet e-mail pour vous connecter. | Mir hunn eng E-Mail un <strong>{email}</strong> geschéckt. Klickt op de Link an der E-Mail, fir Iech unzemellen. | Vi har skickat ett e-postmeddelande till <strong>{email}</strong>. Klicka på länken i meddelandet för att logga in. |
| `contestantApp.emailSent.resendIn` | added | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"(in {seconds}s)","secondsPlural=other":"(in {seconds}s)"}}] | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"(om {seconds} s)","secondsPlural=other":"(om {seconds} s)"}}] | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"({seconds} s pärast)","secondsPlural=other":"({seconds} s pärast)"}}] | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"({seconds} s kuluttua)","secondsPlural=other":"({seconds} s kuluttua)"}}] | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"(dans {seconds} s)","secondsPlural=other":"(dans {seconds} s)"}}] | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"(an {seconds} s)","secondsPlural=other":"(an {seconds} s)"}}] | [{"declarations":["input seconds","local secondsPlural = seconds: plural"],"selectors":["secondsPlural"],"match":{"secondsPlural=one":"(om {seconds} s)","secondsPlural=other":"(om {seconds} s)"}}] |
| `contestantApp.emailSent.support` | reworded | If you have problems receiving the email, {contactSupportLink}. | Hvis du har problemer med at modtage e-mailen, {contactSupportLink}. | Kui sul on probleeme e-kirja kättesaamisega, {contactSupportLink}. | Jos sinulla on ongelmia viestin vastaanottamisessa, {contactSupportLink}. | Si vous avez des difficultés à recevoir l’e-mail, {contactSupportLink}. | Wann Dir Problemer hutt, d’E-Mail ze kréien, {contactSupportLink}. | Om du har problem med att ta emot e-postmeddelandet, {contactSupportLink}. |

##### `contestantApp.error` (2)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.error.readFailed.content` | added | Your data could not be loaded. You are still signed in, so you can try again. If the problem persists, please contact support. | Dine data kunne ikke indlæses. Du er stadig logget ind, så du kan prøve igen. Kontakt support, hvis problemet fortsætter. | Teie andmeid ei õnnestunud laadida. Olete endiselt sisse logitud, nii et võite uuesti proovida. Kui probleem jätkub, võtke ühendust toega. | Tietojasi ei voitu ladata. Olet yhä kirjautuneena, joten voit yrittää uudelleen. Jos ongelma jatkuu, ota yhteyttä tukeen. | Vos données n’ont pas pu être chargées. Vous êtes toujours connecté·e, vous pouvez donc réessayer. Si le problème persiste, contactez l’assistance. | Är Donnéeën konnten net geluede ginn. Dir sidd nach ëmmer ageloggt, also kënnt Dir et nach eng Kéier probéieren. Wann de Problem bestoe bleift, kontaktéiert de Support. | Dina uppgifter kunde inte läsas in. Du är fortfarande inloggad, så du kan försöka igen. Om problemet kvarstår, kontakta supporten. |
| `contestantApp.error.readFailed.tryAgain` | added | Try again | Prøv igen | Proovi uuesti | Yritä uudelleen | Réessayer | Nach eng Kéier probéieren | Försök igen |

##### `contestantApp.home` (1)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.home.emailTask` | added | Confirm your email address {email} | Bekræft din e-mailadresse {email} | Kinnitage oma e-posti aadress {email} | Vahvista sähköpostiosoitteesi {email} | Confirmez votre adresse e-mail {email} | Bestätegt Är E-Mail-Adress {email} | Bekräfta din e-postadress {email} |

##### `contestantApp.identityProvider` (2)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.identityProvider.error.cancelled.support` | reworded | If you need help, {contactSupportLink}. | Hvis du har brug for hjælp, {contactSupportLink}. | Kui vajad abi, {contactSupportLink}. | Jos tarvitset apua, {contactSupportLink}. | Si vous avez besoin d’aide, {contactSupportLink}. | Wann Dir Hëllef braucht, {contactSupportLink}. | Om du behöver hjälp, {contactSupportLink}. |
| `contestantApp.identityProvider.error.retry.support` | added | If the problem persists, {contactSupportLink}. | Hvis problemet fortsætter, {contactSupportLink}. | Kui probleem püsib, {contactSupportLink}. | Jos ongelma jatkuu, {contactSupportLink}. | Si le problème persiste, {contactSupportLink}. | Wann de Problem bestoe bleift, {contactSupportLink}. | Om problemet kvarstår, {contactSupportLink}. |

##### `contestantApp.nominations` (7)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.nominations.add` | added | Add a nomination | Tilføj en opstilling | Lisa kandidatuur | Lisää ehdokkuus | Ajouter une candidature | Eng Nominatioun derbäisetzen | Lägg till en nominering |
| `contestantApp.nominations.delete` | added | Delete | Slet | Kustuta | Poista | Supprimer | Läschen | Ta bort |
| `contestantApp.nominations.deleteCancel` | added | Cancel | Annuller | Tühista | Peruuta | Annuler | Ofbriechen | Avbryt |
| `contestantApp.nominations.deleteConfirm` | added | Yes, delete | Ja, slet | Jah, kustuta | Kyllä, poista | Oui, supprimer | Jo, läschen | Ja, ta bort |
| `contestantApp.nominations.deletePrompt` | added | Delete this nomination? It is deleted at once. If you add it again, an administrator must confirm it before voters see it. | Slet denne opstilling? Den slettes med det samme. Hvis du tilføjer den igen, skal en administrator bekræfte den, før vælgerne kan se den. | Kas kustutada see kandidatuur? See kustutatakse kohe. Kui lisate selle uuesti, peab administraator selle kinnitama, enne kui valijad seda näevad. | Poistetaanko tämä ehdokkuus? Se poistetaan heti. Jos lisäät sen uudelleen, ylläpitäjän on vahvistettava se ennen kuin äänestäjät näkevät sen. | Supprimer cette candidature ? Elle est supprimée immédiatement. Si vous l’ajoutez de nouveau, un administrateur doit la confirmer avant que les électeurs ne la voient. | Dës Nominatioun läschen? Si gëtt direkt geläscht. Wann Dir se nach eng Kéier derbäisetzt, muss en Administrateur se confirméieren, ier d’Wieler se gesinn. | Ta bort den här nomineringen? Den tas bort direkt. Om du lägger till den igen måste en administratör bekräfta den innan väljarna ser den. |
| `contestantApp.nominations.deleted` | added | The nomination was deleted. | Opstillingen blev slettet. | Kandidatuur kustutati. | Ehdokkuus poistettiin. | La candidature a été supprimée. | D’Nominatioun gouf geläscht. | Nomineringen togs bort. |
| `contestantApp.nominations.edit` | reworded | Edit | Rediger | Muuda | Muokkaa | Modifier | Änneren | Redigera |

##### `contestantApp.nothingToEdit` (1)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.nothingToEdit.settings` | added | Account settings | Kontoindstillinger | Konto seaded | Tilin asetukset | Paramètres du compte | Kontastellungen | Kontoinställningar |

##### `contestantApp.register` (5)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `contestantApp.register.heroEmoji` | added | 🖋️ | 🖋️ | 🖋️ | 🖋️ | 🖋️ | 🖋️ | 🖋️ |
| `contestantApp.register.identityProvider.types.organization` | reworded | A party or constituency association | Et parti eller en vælgerforening | Erakonna või valimisliidu | Puolue tai valitsijayhdistys | Un parti ou une association de circonscription | Eng Partei oder eng Wielervereenegung | Ett parti eller en valmansförening |
| `contestantApp.register.registeredNotice.content` | added | Please login with your email and password instead or check your email for the confirmation link. | Log ind med din e-mail og adgangskode, eller tjek din e-mail for bekræftelseslinket. | Palun logi sisse oma e-posti ja parooliga või kontrolli oma e-posti kinnituslingi osas. | Kirjaudu sisään sähköpostilla ja salasanalla tai tarkista sähköpostisi vahvistuslinkin varalta. | Veuillez plutôt vous connecter avec votre e-mail et votre mot de passe ou vérifier votre e-mail pour le lien de confirmation. | Loggt Iech éischter mat Ärer E-Mail an Ärem Passwuert an oder kuckt an Ärer E-Mail no dem Confirmatiounslink. | Logga in med din e-postadress och ditt lösenord istället eller kontrollera din e-post för bekräftelselänken. |
| `contestantApp.register.registeredNotice.title` | added | It looks like you are already registered | Det ser ud til, at du allerede er registreret | Paistab, et oled juba registreerunud | Näyttää siltä, että olet jo rekisteröitynyt | Il semble que vous soyez déjà inscrit·e | Et gesäit esou aus, wéi wann Dir scho registréiert sidd | Det verkar som att du redan är registrerad |
| `contestantApp.register.signIn.failed` | reworded | We couldn’t sign you in with that password. Try again, or use a link below to set a password. | Vi kunne ikke logge dig ind med den adgangskode. Prøv igen, eller brug et link nedenfor til at vælge en adgangskode. | Selle parooliga ei õnnestunud sind sisse logida. Proovi uuesti või kasuta parooli määramiseks allolevat linki. | Kirjautuminen tällä salasanalla ei onnistunut. Yritä uudelleen tai aseta salasana alla olevan linkin kautta. | Nous n’avons pas pu vous connecter avec ce mot de passe. Réessayez ou utilisez un lien ci-dessous pour définir un mot de passe. | Mir konnten Iech mat dësem Passwuert net umellen. Probéiert nach eng Kéier oder benotzt e Link hei drënner, fir e Passwuert festzeleeën. | Vi kunde inte logga in dig med det lösenordet. Försök igen eller använd en länk nedan för att ställa in ett lösenord. |


```js
// node strings.mjs <base> <head>: every message key added, or whose English text changed, between two commits,
// over apps/frontend/messages/<locale>/*.json, with its text in every locale at <head>. Prints Markdown.
import { execFileSync } from 'node:child_process';

const [base, head] = process.argv.slice(2);
const M = 'apps/frontend/messages';
const LOCALES = ['en', 'da', 'et', 'fi', 'fr', 'lb', 'sv'];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const files = (rev, locale) =>
  git('ls-tree', '--name-only', `${rev}:${M}/${locale}`)
    .split('\n')
    .filter((f) => f.endsWith('.json'));

function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else out[prefix] = typeof value === 'string' ? value : JSON.stringify(value);
  return out;
}

function catalogue(rev, locale) {
  const out = {};
  let names = [];
  try {
    names = files(rev, locale);
  } catch {
    return out;
  }
  for (const name of names) {
    const flat = flatten(JSON.parse(git('show', `${rev}:${M}/${locale}/${name}`)), '', {});
    for (const [k, v] of Object.entries(flat)) out[k] = { file: name.replace(/\.json$/, ''), text: v };
  }
  return out;
}

const before = catalogue(base, 'en');
const after = catalogue(head, 'en');
const others = Object.fromEntries(LOCALES.map((l) => [l, catalogue(head, l)]));

const changed = Object.keys(after)
  .filter((key) => before[key]?.text !== after[key].text)
  .sort();
const byNamespace = new Map();
for (const key of changed) {
  const ns = after[key].file;
  if (!byNamespace.has(ns)) byNamespace.set(ns, []);
  byNamespace.get(ns).push(key);
}

const cell = (s) => (s ?? '(missing)').replace(/\|/g, '\\|').replace(/\n/g, ' ');
console.log(`${changed.length} keys: ${changed.filter((k) => !(k in before)).length} added, ${changed.filter((k) => k in before).length} reworded in English.\n`);
for (const [ns, keys] of byNamespace) {
  console.log(`### \`${ns}\` (${keys.length})\n`);
  console.log(`| key | change | ${LOCALES.join(' | ')} |`);
  console.log(`|---|---|${LOCALES.map(() => '---').join('|')}|`);
  for (const key of keys)
    console.log(
      `| \`${key}\` | ${key in before ? 'reworded' : 'added'} | ${LOCALES.map((l) => cell(others[l][key]?.text)).join(' | ')} |`
    );
  console.log('');
}
```

#### Operator corrections made at UAT, 2026-10-31

The operator deferred this review and ruled on two points. The table above predates them.

- Estonian uses the informal "you". Applied to the three new keys that used the formal form: `contestantApp.error.readFailed.content`, `contestantApp.home.emailTask`, `contestantApp.nominations.deletePrompt`. The operator then had the whole Estonian catalogue converted to the informal form for now, by a rule-based word substitution, not by a speaker. The reviewer should confirm the choice of informal and read the result. `about.content` keeps "olete" and "te nõustute": there they mean the voter and a candidate together, a true plural.
- English `contestantApp.register.registeredNotice.content` now reads "Please log in". The other six locales of this key still need the review that a rewording of the source requires.

Flagged for the reviewer, not changed: Estonian `contestantApp.register.identityProvider.types.organization` ("Erakonna või valimisliidu") looks like the genitive where the other locales use a plain noun phrase.

#### The two logout keys

`common.logoutFailed` and `common.logoutUnsavedChanges` were added by plan `179.1-43` and are read by plans `179.1-44` and `179.1-45`, and `common.logoutFailed` must stay true whether or not the user is still logged in, so a correction must not state either.

The merged todo is kept at `.planning/todos/completed/2026-10-26-179.1-native-speaker-review-of-the-phase-strings.md`.

## Merged from `2026-11-12-179.2-native-speaker-review-of-the-phase-strings.md` (2026-11-28)

The strings this todo listed, copied in full:

#### Problem

Phase 179.2 added one message key: `adminApp.login.errors.linkFailed`, the notice the Admin App's login page shows when a mailed link the Admin App asked for could not be used (a refused, spent or failed link that `/auth/confirm` or `/api/auth/callback` lands on `/admin/login` with `errorMessage=authError`). Every text in every locale, English included, was written by an agent from each catalogue's own terms, and **no native speaker has read any of them**. They are served as they stand.

Every other string the phase's Admin App screens show (the forgot-password, "email sent", password-reset and set-password screens, and the login's two new links) reuses an existing app-neutral key, already listed in the earlier native-review todos: `2026-10-26-179.1-native-speaker-review-of-the-phase-strings.md`, `2026-10-21-179-native-speaker-review-identity-provider-strings.md` and `2026-10-07-174-native-speaker-review-sign-in-mail.md`.

#### What to do

- For each locale, read the row below on its screen: the Admin App's login at `/<locale>/admin/login?errorMessage=authError`, as a link that cannot be used reaches it (for example `/<locale>/auth/confirm?type=magiclink&next=%2Fadmin`, which carries no token). Correct the catalogue file in place. A correction changes text only: no key is renamed or removed.
- English is the source language: a correction of the English text is a rewording and goes through the same review in the other six locales.

#### The list, and how to derive it again

Derived at plan `179.2-04` from the catalogues at the phase's base commit `73100378b` and at HEAD: every key whose English text exists at HEAD and is absent at the base (added) or differs from it (reworded), with its text at HEAD in each of the seven locales. To derive it again, save the script below as `strings.mjs` and run, from the repository root, `node strings.mjs 73100378b HEAD`. The script is the one of the 179.1 todo, unchanged.

1 keys: 1 added, 0 reworded in English.

##### `adminApp.login` (1)

| key | change | en | da | et | fi | fr | lb | sv |
|---|---|---|---|---|---|---|---|---|
| `adminApp.login.errors.linkFailed` | added | This link can no longer be used. A link works once, and only the newest one you asked for works. Please ask for a new one in the same way as before. | Dette link kan ikke længere bruges. Et link virker én gang, og kun det nyeste link, du har bedt om, virker. Bed om et nyt på samme måde som før. | Seda linki ei saa enam kasutada. Link toimib ühe korra ja toimib ainult kõige uuem link, mille oled küsinud. Palun küsi uus link samal viisil nagu enne. | Tätä linkkiä ei voi enää käyttää. Linkki toimii yhden kerran, ja vain uusin pyytämäsi linkki toimii. Pyydä uusi linkki samalla tavalla kuin aiemmin. | Ce lien ne peut plus être utilisé. Un lien ne fonctionne qu’une seule fois, et seul le dernier lien que vous avez demandé fonctionne. Veuillez en demander un nouveau de la même manière qu’auparavant. | Dëse Link kann net méi benotzt ginn. E Link funktionéiert eemol, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Frot wgl. en neien un, op déiselwecht Manéier wéi virdrun. | Den här länken kan inte längre användas. En länk fungerar en gång, och bara den senaste länken du har bett om fungerar. Be om en ny på samma sätt som förut. |

```js
// node strings.mjs <base> <head>: every message key added, or whose English text changed, between two commits,
// over apps/frontend/messages/<locale>/*.json, with its text in every locale at <head>. Prints Markdown.
import { execFileSync } from 'node:child_process';

const [base, head] = process.argv.slice(2);
const M = 'apps/frontend/messages';
const LOCALES = ['en', 'da', 'et', 'fi', 'fr', 'lb', 'sv'];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const files = (rev, locale) =>
  git('ls-tree', '--name-only', `${rev}:${M}/${locale}`)
    .split('\n')
    .filter((f) => f.endsWith('.json'));

function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else out[prefix] = typeof value === 'string' ? value : JSON.stringify(value);
  return out;
}

function catalogue(rev, locale) {
  const out = {};
  let names = [];
  try {
    names = files(rev, locale);
  } catch {
    return out;
  }
  for (const name of names) {
    const flat = flatten(JSON.parse(git('show', `${rev}:${M}/${locale}/${name}`)), '', {});
    for (const [k, v] of Object.entries(flat)) out[k] = { file: name.replace(/\.json$/, ''), text: v };
  }
  return out;
}

const before = catalogue(base, 'en');
const after = catalogue(head, 'en');
const others = Object.fromEntries(LOCALES.map((l) => [l, catalogue(head, l)]));

const changed = Object.keys(after)
  .filter((key) => before[key]?.text !== after[key].text)
  .sort();
const byNamespace = new Map();
for (const key of changed) {
  const ns = after[key].file;
  if (!byNamespace.has(ns)) byNamespace.set(ns, []);
  byNamespace.get(ns).push(key);
}

const cell = (s) => (s ?? '(missing)').replace(/\|/g, '\\|').replace(/\n/g, ' ');
console.log(`${changed.length} keys: ${changed.filter((k) => !(k in before)).length} added, ${changed.filter((k) => k in before).length} reworded in English.\n`);
for (const [ns, keys] of byNamespace) {
  console.log(`### \`${ns}\` (${keys.length})\n`);
  console.log(`| key | change | ${LOCALES.join(' | ')} |`);
  console.log(`|---|---|${LOCALES.map(() => '---').join('|')}|`);
  for (const key of keys)
    console.log(
      `| \`${key}\` | ${key in before ? 'reworded' : 'added'} | ${LOCALES.map((l) => cell(others[l][key]?.text)).join(' | ')} |`
    );
  console.log('');
}
```

The merged todo is kept at `.planning/todos/completed/2026-11-12-179.2-native-speaker-review-of-the-phase-strings.md`.
