---
created: 2026-10-21T22:45:00.000Z
title: Native-speaker review of the identity-provider registration's strings in da, et, fi, fr, lb and sv, and of the Swedish sign-in label
area: i18n
severity: minor
source: Phase 179 (plan 179-06 Task 1; item U-24 of 179-UI-SPEC.md; key list .planning/phases/179-identity-provider-registration-coverage-close/179-catalogue-additions.json)
files:
  - apps/frontend/messages/*/contestantApp.identityProvider.json
  - apps/frontend/messages/*/contestantApp.register.json
  - apps/frontend/messages/*/contestantApp.home.json
  - apps/frontend/messages/*/contestantApp.settings.json
  - apps/frontend/messages/*/contestantApp.nothingToEdit.json
  - apps/frontend/messages/*/contestantApp.login.json
  - apps/frontend/messages/*/contestantApp.setPassword.json
  - apps/frontend/messages/sv/common.json
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
---

## Problem

Phase 179 adds 36 message keys for the identity-provider registration (the provider's panel on the registration page, the success view, the error screen, the pending-address reminder on the home, the settings page's pending address, `NothingToEdit` without an address and the sign-in page's address-taken notice). The English strings are the UI contract's (`179-UI-SPEC.md` § *Copywriting Contract* → *New messages*). Every string in `da`, `et`, `fi`, `fr`, `lb` and `sv` — 216 strings — was constructed from each catalogue's own terms and read by no native speaker. This is the operator's concern of Phase 178 UAT item 11; it sits beside `2026-10-07-174-native-speaker-review-sign-in-mail.md`, which the same reviewers are owed.

### The terms each string was built from

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

### The Swedish sign-in label, changed

`common.login` in `sv` read "Registrera dig" ("register") on the sign-in page's main button and in the menu. It now reads **"Logga in"** (item U-23 of the UI contract). Beside it, `contestantApp.login.signInWithEmail` ("Logga in med e-post") and the sign-in mail's anchor label already said *logga in*. **`contestantApp.login.title` in `sv` still reads "Registrera dig"**: the sign-in page's own heading says "register". The phase rewords only `common.login`; the reviewer should judge the title in the same sitting (the English is "Sign in").

### The confirmation mail (written by plan 179-10)

The address-confirmation mail of `account-access` has five parts in each locale, built by the same template as the sign-in and recovery mails: the subject, the sentence before the link, the link's text, the sentence after it and the last sentence. The English is in `179-UI-SPEC.md` § *The confirmation mail*. The six non-English versions are in `apps/supabase/supabase/functions/account-access/mailTemplates.ts` and belong to this review; they are listed part by part under *The confirmation mail, by locale* below.

## The strings, by locale

Each table lists every added key with the English contract string and the constructed string. The keys are the same in each locale.

### `fi`

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

### `sv`

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

### `da`

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

### `et`

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

### `fr`

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

### `lb`

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

## The set-password view's first sentence, reworded (written by plan 179-17)

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

## The confirmation mail, by locale

The five parts of the address-confirmation mail (`ADDRESS_CONFIRMATION_MAIL_TEMPLATES` in `apps/supabase/supabase/functions/account-access/mailTemplates.ts`), built from each locale's sign-in mail and the provider's word in the table of terms above. Every version keeps the sign-in mail's own sentence that the link works once and only the newest one works, and addresses nobody as the one who registered: the mail can reach a stranger whose address was mistyped, so its first sentence says "someone who registered" in every locale. A reviewer should keep that impersonal form; the Swedish uses *hen*, the Danish *vedkommende*, the French and Luxembourgish *une personne* / *eng Persoun*.

### `fi`

| Part | English | fi |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Vahvista sähköpostiosoitteesi vaalikoneeseen |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Joku, joka rekisteröityi pankkitunnuksilla, antoi tämän osoitteen osoitteeksi, jolla hän kirjautuu sisään. Avaa tämä linkki vahvistaaksesi osoitteen ja liittääksesi sen kyseiseen tiliin: |
| The link’s text | Confirm my email address | Vahvista sähköpostiosoitteeni |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Kunnes avaat linkin, kirjaudu sovellukseen pankkitunnuksilla. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Jos et rekisteröitynyt, älä avaa linkkiä. Voit jättää tämän viestin huomiotta, eikä osoitetta liitetä mihinkään tiliin. |

### `sv`

| Part | English | sv |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Bekräfta din e-postadress till valkompassen |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Någon som har registrerat sig med bank-id har angett den här adressen som den adress hen loggar in med. Öppna den här länken för att bekräfta adressen och koppla den till det kontot: |
| The link’s text | Confirm my email address | Bekräfta min e-postadress |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Logga in i applikationen med bank-id tills du har öppnat länken. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Om du inte har registrerat dig ska du inte öppna länken. Du kan bortse från det här meddelandet, och adressen kopplas inte till något konto. |

### `da`

| Part | English | da |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Bekræft din e-mailadresse til valgtesten |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | En person, der har registreret sig med BankID, har angivet denne adresse som den, vedkommende vil logge ind med. Åbn dette link for at bekræfte adressen og knytte den til den konto: |
| The link’s text | Confirm my email address | Bekræft min e-mailadresse |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Indtil du åbner linket, skal du logge ind i applikationen med BankID. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Hvis du ikke har registreret dig, skal du ikke åbne linket. Du kan se bort fra denne besked, og adressen bliver ikke knyttet til nogen konto. |

### `et`

| Part | English | et |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Kinnita oma e-posti aadress valimiskompassi jaoks |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Keegi, kes registreerus pangatunnustega, andis selle aadressi aadressiks, millega ta sisse logib. Ava see link, et aadress kinnitada ja see selle kontoga siduda: |
| The link’s text | Confirm my email address | Kinnita minu e-posti aadress |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kuni sa linki ei ava, logi rakendusse sisse pangatunnustega. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Kui sa ei registreerunud, ära ava linki. Võid seda kirja eirata ja aadressi ei seota ühegi kontoga. |

### `fr`

| Part | English | fr |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Confirmez votre adresse e-mail pour la boussole électorale |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Une personne qui s'est inscrite avec un Bank ID a indiqué cette adresse comme celle avec laquelle elle se connectera. Ouvrez ce lien pour la confirmer et la rattacher à ce compte : |
| The link’s text | Confirm my email address | Confirmer mon adresse e-mail |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. Tant que vous n'avez pas ouvert le lien, connectez-vous à l'application avec un Bank ID. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Si vous ne vous êtes pas inscrit·e, n'ouvrez pas le lien. Vous pouvez ignorer ce message, et l'adresse ne sera rattachée à aucun compte. |

### `lb`

| Part | English | lb |
| --- | --- | --- |
| Subject | Confirm your email address for the voting advice application | Confirméiert Är E-Mail-Adress fir de Wal-Kompass |
| Before the link | Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account: | Eng Persoun, déi sech mat engem Bank ID registréiert huet, huet dës Adress als déi uginn, mat där se sech umellt. Maacht dëse Link op, fir d'Adress ze confirméieren an un dee Kont ze bannen: |
| The link’s text | Confirm my email address | Meng E-Mail-Adress confirméieren |
| After it | The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID. | De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Bis Dir de Link opmaacht, meldt Iech mat engem Bank ID an der Applikatioun un. |
| Last | If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account. | Wann Dir Iech net registréiert hutt, maacht de Link net op. Dir kënnt dëse Message ignoréieren, an d'Adress gëtt mat kengem Kont verbonnen. |

## Solution

- Have a native speaker of each of the six languages read the strings in context: the registration page with the provider's option open, the error screen in its three classes (`/contestant/register/identity-provider/error?error=cancelled`, an unknown code, `configuration_error`), the success view, the home with the reminder and the settings page with a pending address.
- Apply corrections through `.planning/phases/179-identity-provider-registration-coverage-close/179-catalogue-additions.json` and its writer while the phase runs, or directly in the catalogue files after it; keep each key's placeholder set identical in the seven locales and run `yarn workspace @openvaa/frontend generate:translation-key-type` after a change.
- Judge the set-password view's reworded first sentence (above) on the set-password view.
- Then judge the confirmation mail's five parts (above) in the same sitting.
