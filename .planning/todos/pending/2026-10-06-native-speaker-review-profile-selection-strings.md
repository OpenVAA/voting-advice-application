---
created: 2026-10-06T15:30:00.000Z
title: Native-speaker review of the profile selection and nothing-to-edit strings (da, et, fi, fr, lb, sv)
area: i18n
severity: minor
source: Phase 173 plan 09 (UI-SPEC U-01, U-15; ruling 4 of that plan)
files:
  - apps/frontend/messages/da/contestantApp.entitySelection.json
  - apps/frontend/messages/et/contestantApp.entitySelection.json
  - apps/frontend/messages/fi/contestantApp.entitySelection.json
  - apps/frontend/messages/fr/contestantApp.entitySelection.json
  - apps/frontend/messages/lb/contestantApp.entitySelection.json
  - apps/frontend/messages/sv/contestantApp.entitySelection.json
  - apps/frontend/messages/da/contestantApp.nothingToEdit.json
  - apps/frontend/messages/et/contestantApp.nothingToEdit.json
  - apps/frontend/messages/fi/contestantApp.nothingToEdit.json
  - apps/frontend/messages/fr/contestantApp.nothingToEdit.json
  - apps/frontend/messages/lb/contestantApp.nothingToEdit.json
  - apps/frontend/messages/sv/contestantApp.nothingToEdit.json
---

## Problem

Phase 173 plan 09 added two message namespaces, `contestantApp.entitySelection` and `contestantApp.nothingToEdit`, with four keys each. The English text is the UI contract's. The other six locales were **constructed from terms each catalogue already used and have not been read by a native speaker**: forty-eight strings (six locales, eight each).

This is a sibling of `2026-10-05-native-speaker-review-contestant-app-names.md` (Phase 171's names); the two can be reviewed in one sitting per language.

The strings are rendered since plan 173-10 wired the root page: the title and ingress of the profile selection screen, the menu's switch item and group title, and the whole "nothing to edit" view. Plan 173-13 confirmed this todo as the phase's record of the review (its Task 3) and filed no second one. All three surfaces are in the axe scan in both themes in English only, so nothing automated reads the six constructed locales.

### English (the source)

| Key | Text |
|---|---|
| `contestantApp.entitySelection.title` | Choose a Profile to Edit |
| `contestantApp.entitySelection.ingress` | You can edit more than one profile. Choose the one you want to work on now. You can switch to another one at any time from the menu. |
| `contestantApp.entitySelection.switch` | Switch profile |
| `contestantApp.entitySelection.current` | {entityType}: {name} |
| `contestantApp.nothingToEdit.title` | Nothing to Edit Here |
| `contestantApp.nothingToEdit.content` | Your user account is not connected to any profile in this application, so there is nothing for you to edit. |
| `contestantApp.nothingToEdit.signedInAs` | Signed in as |
| `contestantApp.nothingToEdit.nextSteps` | If you registered with another email address, log out and sign in with that address. Otherwise, contact support and tell them the address shown above. |

### The forty-eight constructed strings

**da** (the word for "profile": *profil*)

- `entitySelection.title`: Vælg en profil at redigere
- `entitySelection.ingress`: Du kan redigere mere end én profil. Vælg den, du vil arbejde med nu. Du kan til enhver tid skifte til en anden fra menuen.
- `entitySelection.switch`: Skift profil
- `entitySelection.current`: {entityType}: {name}
- `nothingToEdit.title`: Intet at redigere her
- `nothingToEdit.content`: Din brugerkonto er ikke knyttet til nogen profil i denne applikation, så der er ikke noget, du kan redigere.
- `nothingToEdit.signedInAs`: Logget ind som
- `nothingToEdit.nextSteps`: Hvis du har registreret dig med en anden e-mailadresse, skal du logge ud og logge ind med den adresse. Ellers kan du kontakte support og oplyse adressen, der vises ovenfor.

**et** (*profiil*)

- `entitySelection.title`: Valige muudetav profiil
- `entitySelection.ingress`: Saate muuta rohkem kui ühte profiili. Valige see, millega soovite praegu töötada. Menüüst saate igal ajal teise profiili valida.
- `entitySelection.switch`: Vaheta profiili
- `entitySelection.current`: {entityType}: {name}
- `nothingToEdit.title`: Siin pole midagi muuta
- `nothingToEdit.content`: Teie kasutajakonto ei ole selles rakenduses ühegi profiiliga seotud, seega pole teil siin midagi muuta.
- `nothingToEdit.signedInAs`: Sisse logitud kasutajana
- `nothingToEdit.nextSteps`: Kui registreerusite mõne teise e-posti aadressiga, logige välja ja logige sisse selle aadressiga. Vastasel juhul võtke ühendust toega ja öelge neile ülal näidatud aadress.

**fi** (*profiili*)

- `entitySelection.title`: Valitse muokattava profiili
- `entitySelection.ingress`: Voit muokata useampaa kuin yhtä profiilia. Valitse se, jota haluat muokata nyt. Voit vaihtaa toiseen profiiliin milloin tahansa valikosta.
- `entitySelection.switch`: Vaihda profiilia
- `entitySelection.current`: {entityType}: {name}
- `nothingToEdit.title`: Ei muokattavaa
- `nothingToEdit.content`: Käyttäjätiliäsi ei ole yhdistetty yhteenkään profiiliin tässä sovelluksessa, joten sinulla ei ole täällä mitään muokattavaa.
- `nothingToEdit.signedInAs`: Kirjautuneena osoitteella
- `nothingToEdit.nextSteps`: Jos rekisteröidyit toisella sähköpostiosoitteella, kirjaudu ulos ja kirjaudu sisään sillä osoitteella. Muussa tapauksessa ota yhteyttä tukeen ja kerro heille yllä näkyvä osoite.

**fr** (*profil*)

- `entitySelection.title`: Choisissez un profil à modifier
- `entitySelection.ingress`: Vous pouvez modifier plusieurs profils. Choisissez celui sur lequel vous souhaitez travailler maintenant. Vous pouvez passer à un autre à tout moment depuis le menu.
- `entitySelection.switch`: Changer de profil
- `entitySelection.current`: {entityType} : {name}
- `nothingToEdit.title`: Rien à modifier ici
- `nothingToEdit.content`: Votre compte utilisateur n’est associé à aucun profil dans cette application, vous n’avez donc rien à modifier.
- `nothingToEdit.signedInAs`: Connecté·e en tant que
- `nothingToEdit.nextSteps`: Si vous vous êtes inscrit·e avec une autre adresse e-mail, déconnectez-vous et connectez-vous avec cette adresse. Sinon, contactez l’assistance et indiquez-lui l’adresse affichée ci-dessus.

**lb** (*Profil*)

- `entitySelection.title`: Wielt e Profil fir ze änneren
- `entitySelection.ingress`: Dir kënnt méi wéi ee Profil änneren. Wielt deen, un deem Dir elo schaffe wëllt. Dir kënnt zu all Moment iwwer de Menü op en anere wiesselen.
- `entitySelection.switch`: Profil wiesselen
- `entitySelection.current`: {entityType}: {name}
- `nothingToEdit.title`: Hei gëtt et näischt ze änneren
- `nothingToEdit.content`: Äre Benotzerkont ass an dëser Applikatioun mat kengem Profil verbonnen, dofir gëtt et näischt, wat Dir ännere kënnt.
- `nothingToEdit.signedInAs`: Ageloggt als
- `nothingToEdit.nextSteps`: Wann Dir Iech mat enger anerer E-Mail-Adress registréiert hutt, loggt Iech aus a mellt Iech mat där Adress un. Soss kontaktéiert de Support a sot hinnen d’Adress, déi hei uewen ugewise gëtt.

**sv** (*profil*)

- `entitySelection.title`: Välj en profil att redigera
- `entitySelection.ingress`: Du kan redigera mer än en profil. Välj den du vill arbeta med nu. Du kan när som helst byta till en annan från menyn.
- `entitySelection.switch`: Byt profil
- `entitySelection.current`: {entityType}: {name}
- `nothingToEdit.title`: Inget att redigera här
- `nothingToEdit.content`: Ditt användarkonto är inte kopplat till någon profil i den här applikationen, så det finns inget för dig att redigera.
- `nothingToEdit.signedInAs`: Inloggad som
- `nothingToEdit.nextSteps`: Om du registrerade dig med en annan e-postadress, logga ut och logga in med den adressen. Kontakta annars supporten och uppge adressen som visas ovan.

### Points a reviewer should look at first

- **Form of address.** Each locale follows the form its contestant catalogue mostly uses: informal in da, fi and sv; `vous` in fr; `Dir` in lb. The et catalogue mixes `teie` and `sinu`; these strings use the formal `teie` form, as `contestantApp.common` and `contestantApp.login` do.
- **`signedInAs` is a label standing above an email address**, not a sentence. fi `Kirjautuneena osoitteella` and et `Sisse logitud kasutajana` were chosen to read naturally with an address under them; fr `Connecté·e en tant que` uses the catalogue's inclusive form.
- **`current` is rendered as an upper-case menu heading** with the locale's own singular type name (`common.candidate.singular`, `common.organization.singular`) as `{entityType}`. fr has a plain space before the colon, as elsewhere in its catalogue. A locale may reorder the two parameters.
- **`nextSteps` refers to "the address shown above".** When the user has no email the address is not shown; the sentence still appears.
- **lb** `Ageloggt als` and `loggt Iech aus a mellt Iech … un` mix the catalogue's two verbs for signing in (`Umellen` on the button, `aloggen` in running text), as the catalogue itself does.
- No string may use a word for "entity"; the user-facing noun is the locale's word for a profile.

## Solution

Have a native speaker of each of the six languages read the eight strings in place: the profile selection screen (a user with several profiles), the menu on a profile's pages (the group title and the switch item) and the "nothing to edit" view (a user with no profile). Constraints a correction has to keep:

- the same eight keys in every locale; `current` uses exactly `{entityType}` and `{name}`, the other seven take no parameter (`apps/frontend/src/lib/i18n/tests/translations.test.ts` asserts both in every locale);
- the English text stays as the UI contract gives it.

Close this todo when all six locales have been reviewed, or fold it into the Phase 171 todo if both are reviewed together.
