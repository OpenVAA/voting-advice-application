---
created: 2026-10-07T12:53:29.000Z
title: Native-speaker review of the sign-in mail in da, et, fi, fr, lb and sv, and of the English anchor label
area: i18n / email
severity: minor
source: Phase 174 (ruling J4 / item 6 of 174-01-PLAN.md; 174-05-SUMMARY.md § Constructed non-English strings; filed by 174-10)
files:
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.test.ts
---

## Problem

`account-access` mails a fixed text in seven locales. The six non-English texts were constructed when the function was written, not taken from a catalogue and not read by a native speaker. The application's name follows each message catalogue's own word for it, and the anchor label follows the catalogue's `login` string except in Swedish, where the catalogue's `login` reads "Registrera dig".

The English text, for reference. Subject: `Sign-in link for the voting advice application`. Body: "Open this link to sign in:" / the link / "The link works once and expires soon. If it has expired, ask for a new one on the sign-in page." / "If you did not ask for this link, you can ignore this message." The html part's anchor label is `Sign in`, which is also a string no plan listed and nobody reviewed.

| Locale | Subject | Intro | Label | Works once | Did not ask |
| --- | --- | --- | --- | --- | --- |
| `fi` | Kirjautumislinkki vaalikoneeseen | Avaa tämä linkki kirjautuaksesi sisään: | Kirjaudu | Linkki toimii yhden kerran ja vanhenee pian. Jos se on vanhentunut, pyydä uusi linkki kirjautumissivulla. | Jos et pyytänyt tätä linkkiä, voit jättää tämän viestin huomiotta. |
| `sv` | Inloggningslänk till valkompassen | Öppna den här länken för att logga in: | Logga in | Länken fungerar en gång och upphör snart att gälla. Om den har upphört att gälla kan du be om en ny på inloggningssidan. | Om du inte har bett om den här länken kan du bortse från det här meddelandet. |
| `da` | Loginlink til valgtesten | Åbn dette link for at logge ind: | Log ind | Linket virker én gang og udløber snart. Hvis det er udløbet, kan du bede om et nyt på loginsiden. | Hvis du ikke har bedt om dette link, kan du se bort fra denne besked. |
| `et` | Sisselogimislink valimiskompassi | Sisselogimiseks ava see link: | Logi sisse | Link toimib ühe korra ja aegub peagi. Kui see on aegunud, küsi sisselogimislehel uus link. | Kui sa seda linki ei küsinud, võid seda kirja eirata. |
| `fr` | Lien de connexion à la boussole électorale | Ouvrez ce lien pour vous connecter : | Se connecter | Le lien ne fonctionne qu'une seule fois et expire bientôt. S'il a expiré, demandez-en un nouveau sur la page de connexion. | Si vous n'avez pas demandé ce lien, vous pouvez ignorer ce message. |
| `lb` | Umelllink fir de Wal-Kompass | Maacht dëse Link op, fir Iech unzemellen: | Umellen | De Link funktionéiert eemol a leeft geschwënn of. Wann en ofgelaf ass, frot op der Umeldesäit en neien un. | Wann Dir dëse Link net ugefrot hutt, kënnt Dir dëse Message ignoréieren. |

Two things a reviewer should also judge: the mail says "the sign-in page", and no page of the application offers a link request yet (Phase 178 builds it); and the Swedish catalogue's `login` string itself ("Registrera dig") looks wrong for "log in".

## Solution

- Have a native speaker of each of the six languages read the five strings in context, as a received mail (the E2E project `invitation-contract` leaves one in the local mail catcher per run; the Finnish one is asserted by its locale test).
- Apply corrections in `mailTemplates.ts`. Its test pins that every locale has every part and that the link marker appears once per part; a changed subject also changes `SIGN_IN_LINK_EMAIL_SUBJECT` / `SIGN_IN_LINK_EMAIL_SUBJECT_FI` in `tests/tests/utils/invitationConstants.ts`.
- A change to a function file reaches the running stack only after `yarn db:stop` and `yarn db:start`.
- The same reviewers are owed two earlier passes: `2026-10-05-native-speaker-review-contestant-app-names.md` and `2026-10-06-native-speaker-review-profile-selection-strings.md`.

## Added 2026-10-12 (Phase 178, plan 178-06): the recovery mail, and the sign-in mail's reworded fourth sentence

Two more sets of strings wait for the same review. Both are constructed, as the strings above were: built from each message catalogue's own words, read by no native speaker. This todo stays pending and now covers them.

**1. The sign-in mail's fourth part was reworded in all seven locales.** It now says that only the newest link asked for works, and it names no page: "ask for a new one in the application" replaces "on the sign-in page". The "Works once" column of the table above is the earlier wording; the sentences in `mailTemplates.ts` are these. The reviewer's first point under the table (the mail names a sign-in page no screen offers) no longer applies.

English, for reference: "The link works once and expires soon, and only the newest link you asked for works. If it no longer works, ask for a new one in the application."

| Locale | Works once, as reworded |
| --- | --- |
| `fi` | Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Jos se ei enää toimi, pyydä uusi linkki sovelluksessa. |
| `sv` | Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Om den inte längre fungerar kan du be om en ny i applikationen. |
| `da` | Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Hvis det ikke længere virker, kan du bede om et nyt i applikationen. |
| `et` | Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kui see enam ei toimi, küsi rakenduses uus link. |
| `fr` | Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. S'il ne fonctionne plus, demandez-en un nouveau dans l'application. |
| `lb` | De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Wann en net méi funktionéiert, frot an der Applikatioun en neien un. |

**2. The recovery mail is new: five parts in each of the six locales** (`RECOVERY_MAIL_TEMPLATES` in the same module, under the same completeness test).

English, for reference. Subject: `Reset your password for the voting advice application`. Body: "Open this link to sign in and choose a new password:" / the link, labelled `Choose a new password` / "The link works once and expires soon, and only the newest link you asked for works. If it no longer works, ask for a new one with “Forgot Password?” in the application." / "If you did not ask for this link, you can ignore this message. Your password has not been changed."

| Locale | Subject | Intro | Label | Works once | Did not ask |
| --- | --- | --- | --- | --- | --- |
| `fi` | Vaalikoneen salasanan palautus | Avaa tämä linkki kirjautuaksesi sisään ja asettaaksesi uuden salasanan: | Aseta uusi salasana | Linkki toimii yhden kerran ja vanhenee pian, ja vain uusin pyytämäsi linkki toimii. Jos se ei enää toimi, pyydä uusi linkki sovelluksen kohdasta ”Unohditko salasanan?”. | Jos et pyytänyt tätä linkkiä, voit jättää tämän viestin huomiotta. Salasanaasi ei ole muutettu. |
| `sv` | Återställ ditt lösenord till valkompassen | Öppna den här länken för att logga in och ställa in ett nytt lösenord: | Ställ in ett nytt lösenord | Länken fungerar en gång och upphör snart att gälla, och bara den senaste länken du har bett om fungerar. Om den inte längre fungerar kan du be om en ny med ”Glömt lösenord?” i applikationen. | Om du inte har bett om den här länken kan du bortse från det här meddelandet. Ditt lösenord har inte ändrats. |
| `da` | Nulstil din adgangskode til valgtesten | Åbn dette link for at logge ind og vælge en ny adgangskode: | Vælg en ny adgangskode | Linket virker én gang og udløber snart, og kun det nyeste link, du har bedt om, virker. Hvis det ikke længere virker, kan du bede om et nyt med ”Glemt adgangskode?” i applikationen. | Hvis du ikke har bedt om dette link, kan du se bort fra denne besked. Din adgangskode er ikke blevet ændret. |
| `et` | Valimiskompassi parooli lähtestamine | Sisselogimiseks ja uue parooli määramiseks ava see link: | Määra uus parool | Link toimib ühe korra ja aegub peagi ning toimib ainult kõige uuem link, mille oled küsinud. Kui see enam ei toimi, küsi rakenduses uus link valikuga „Unustasite salasõna?“. | Kui sa seda linki ei küsinud, võid seda kirja eirata. Sinu parooli ei ole muudetud. |
| `fr` | Réinitialisation de votre mot de passe pour la boussole électorale | Ouvrez ce lien pour vous connecter et définir un nouveau mot de passe : | Définir un nouveau mot de passe | Le lien ne fonctionne qu'une seule fois et expire bientôt, et seul le dernier lien que vous avez demandé fonctionne. S'il ne fonctionne plus, demandez-en un nouveau avec « Mot de passe oublié ? » dans l'application. | Si vous n'avez pas demandé ce lien, vous pouvez ignorer ce message. Votre mot de passe n'a pas été modifié. |
| `lb` | Äert Passwuert fir de Wal-Kompass zrécksetzen | Maacht dëse Link op, fir Iech unzemellen an en neit Passwuert festzeleeën: | Neit Passwuert festleeën | De Link funktionéiert eemol a leeft geschwënn of, an nëmmen deen neiste Link, deen Dir ugefrot hutt, funktionéiert. Wann en net méi funktionéiert, frot an der Applikatioun mat „Passwuert vergiess?“ en neien un. | Wann Dir dëse Link net ugefrot hutt, kënnt Dir dëse Message ignoréieren. Äert Passwuert gouf net geännert. |

What a reviewer of these should also judge:

- **The name of the control is the catalogue's.** Each recovery mail quotes the locale's `contestantApp.login.forgotPassword`, and `mailTemplates.test.ts` reads that key from disk and requires the mail to hold it once. A correction to the label is made in the catalogue and in the mail together.
- **Estonian uses two words and two forms of address.** The control's label is "Unustasite salasõna?" (formal, *salasõna*), while `common.password`, the reset page and this mail say *parool*, and the mail addresses the reader informally, as the sign-in mail does. One of the two should give way; that is a catalogue decision.
- **The quotation marks** around the label follow each language's own convention as the constructor understood it (”…” in `fi`, `sv` and `da`; „…“ in `et` and `lb`; « … » in `fr`), not a source.
- **"in the application"** uses the word each catalogue already uses for the application (*sovellus*, *applikationen*, *rakendus*, *l'application*, *Applikatioun*).
- **Subjects:** the recovery mail's English subject is stated as a literal in `tests/tests/utils/invitationConstants.ts` (`RECOVERY_LINK_EMAIL_SUBJECT`); a changed subject changes it there too.

## Added 2026-10-16 (Phase 178 close): every constructed string of the entry flow's screens, by locale

This todo now holds the whole review the phase owes. Nothing below was read by a native speaker, and no doc, README or skill says otherwise. The mails' sentences of plan 178-06 are the two tables above (the reworded sign-in sentence and the recovery mail's five parts, in six locales).

**1. The 44 keys of plan 178-08, in each of `da`, `et`, `fi`, `fr`, `lb` and `sv` (264 strings).** Constructed from each catalogue's existing terms. The strings are in the catalogue files (first written in commit `4bc1b90d6`); the keys, the same in each locale:

- `contestantApp.login.` `signInWithEmail`, `noPasswordYet`, `noPasswordYetInfo`, `emailRequired`, `emailRequiredFirst`, `passwordRequired`, `linkFailed`, `signedOut`, `noProfile`
- `common.emailConfirmation`
- `contestantApp.register.` `modes.legend`, `modes.identityProvider`, `modes.email`, `modes.code`, `modes.required`, `emailInfo`, `codeFormat`, `codeRequired`, `codeUnconfirmed`, `emailEntry.title`, `emailEntry.ingress`, `emailEntry.mismatch`, `signIn.title`, `signIn.ingress`, `signIn.failed`, `signIn.noPasswordYetInfo`
- `contestantApp.emailSent.` `title`, `intro.signIn`, `intro.recovery`, `intro.code`, `sentTo`, `newest`, `notFound.withAddress`, `notFound.withoutAddress`, `support`, `resend`, `resendWait` (two plural forms), `resendRequested`, `resendReady`, `changeAddress`, `askedAgain`
- `contestantApp.setPassword.` `title`, `why`, `error`

`contestantApp.emailSent.heroEmoji` is the envelope in every locale and is not a translation.

What a reviewer of each locale should look at first:

| Locale | Terms taken from the catalogue | Judgement calls |
| --- | --- | --- |
| `fi` | *kirjautua* / *kirjaudu*, *kirjautumislinkki*, *salasana*, *rekisteröintikoodi*, *pankkitunnuksilla* | The question and its three answers are in the adessive (*Miten haluat rekisteröityä?* — *Pankkitunnuksilla*, *Sähköpostiosoitteellani*, *Rekisteröintikoodilla*); "the email" is *viesti* after the first mention |
| `sv` | *logga in*, *inloggningslänk*, *lösenord*, *registreringskod*, *bank-id* | "Sign in" is *logga in*, not the catalogue's `common.login`, which reads "Registrera dig"; a screen that shows `common.login` beside these sentences reads inconsistently until that key is corrected |
| `da` | *log ind*, *loginlink*, *adgangskode*, *registreringskode*, *BankID* | `setPassword.title` (*Vælg en adgangskode*) is close to the button label `setPassword.setPassword` (*Vælg adgangskode*) |
| `et` | *sisse logima*, *sisselogimislink*, *parool*, *registreerimiskood*, *pangatunnustega* | The form of address follows each file: formal (*teie*) in `contestantApp.login`, informal (*sina*) in `register`, `setPassword` and `emailSent`; `login.forgotPassword` says *salasõna* where the new strings say *parool* |
| `fr` | *se connecter*, *lien de connexion*, *mot de passe*, *code d’inscription*, *Bank ID* | Inclusive forms with the median point where the catalogue uses them; typographic apostrophes |
| `lb` | *umellen*, *Umelllink*, *Passwuert*, *Aschreiwungscode*, *Bank ID* | "Sign in" is *umellen* everywhere, never *aloggen*; "signed out" is *ausgeloggt*; "registered" is *registréiert* while the act is *aschreiwen* |

**2. `contestantApp.setPassword.passwordNotValid`, reworded by plan 178-11** (English: "The password does not meet the requirements above."):

| Locale | String |
| --- | --- |
| `da` | Adgangskoden opfylder ikke kravene ovenfor. |
| `et` | Parool ei vasta ülaltoodud nõuetele. |
| `fi` | Salasana ei täytä yllä olevia vaatimuksia. |
| `fr` | Le mot de passe ne répond pas aux exigences ci-dessus. |
| `lb` | D’Passwuert erfëllt d’Reegelen hei uewen net. |
| `sv` | Lösenordet uppfyller inte kraven ovan. |

**3. `contestantApp.register.enterCode` and `contestantApp.register.code`, shown on the registration screen's code option (plan 178-16).** `enterCode` in six locales; `code` because it is capitalised as a field label in `da`, `fr` and `sv` and reads as a sentence fragment elsewhere:

| Locale | `enterCode` | `code` |
| --- | --- | --- |
| `da` | Indtast den registreringskode, du har modtaget. | Registreringskode |
| `et` | Sisesta saadud registreerimiskood. | Registreerimiskood |
| `fi` | Kirjoita saamasi rekisteröintikoodi. | Rekisteröintikoodi |
| `fr` | Saisissez le code d’inscription que vous avez reçu. | Code d’inscription |
| `lb` | Gitt de Code an, deen Dir kritt hutt. | Aschreiwungscode |
| `sv` | Ange registreringskoden som du har fått. | Registreringskod |

**4. Reworded by plan 178-18:** Finnish `contestantApp.login.enterEmailAndPassword` ("Syötä sähköpostisi ja salasanasi kirjautuaksesi.") and `contestantApp.login.answersLockedInfo` ("Rekisteröityminen tai vastausten muokkaaminen ei enää ole mahdollista, mutta voit silti kirjautua nähdäksesi omat tietosi."), and Luxembourgish `contestantApp.login.answersLockedInfo` ("Umeldung oder d’Äntwerten änneren ass net méi méiglech, mee Dir kënnt Iech nach umellen, fir Är Informatiounen ze gesinn."), which still says *Umeldung* for "registration".

**5. Catalogue oddities met and left alone**, for the same reviewers: Swedish `common.login` and `login.title` ("Registrera dig"), shown by the menu item and by the sign-in screen's title and button; Swedish `common.return` ("Returnera") and `common.saving` (no ellipsis); Estonian `login.forgotPassword` (*salasõna*). The French and Luxembourgish `login.haveRegistrationCode`, which were in English, left the catalogues with the legacy code page (plan 178-23).

**How to review.** Read each string on its rendered screen, in its locale: the entry screens are reached signed out from `/<locale>/contestant/login`; the set-password view needs a session with no password (the E2E setup `data-setup-passwordless-session` makes one). A correction to `contestantApp.login.forgotPassword` changes the recovery mail in the same commit (`mailTemplates.test.ts` reads the label from each catalogue).

