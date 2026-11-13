---
created: 2026-10-09T00:00:00.000Z
title: Native-speaker review of the organization-editing strings (da, et, fi, fr, lb, sv) — 204 constructed strings, and 36 constructed sentences of the registry statement
area: i18n
severity: minor
source: Phase 175 plan 04 (D-17; 175-04-SUMMARY.md § Constructed copy that needs a native speaker); filed by 175-13. The registry statement's group was added on 2026-10-09 by the quick task .planning/quick/261009-b2-b3-b6-operator-replies (operator decision B2 (b)); its section 5 was brought to the operator's edit of 2026-10-10 by the quick task .planning/quick/261010-f1-b2-operator-replies, which added 12 sentences and extended 6
owner: the operator, with one native reader per language
files:
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/common.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/components.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/dynamic.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.basicInfo.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.error.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.home.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.questions.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.preview.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.help.json
---

## Problem

Phase 175 plan 04 (commit `ef95bae6e`) added 31 message keys and reworded 3. The English text is the UI contract's. In each of `da`, `et`, `fi`, `fr`, `lb` and `sv` the value at each of the 34 keys was **constructed from terms the catalogue already used and has not been read by a native speaker**: 204 strings.

A sibling of `2026-10-06-native-speaker-review-profile-selection-strings.md`, `2026-10-05-native-speaker-review-contestant-app-names.md` and `2026-10-07-174-native-speaker-review-sign-in-mail.md`; the four can be read in one sitting per language.

### What is measured and what is not

- Measured: key parity and placeholder parity across the seven locales (plan 04's gates); the form of `components.input.requiredLocaleInfo` in every locale by a pattern.
- Rendered and scanned in a browser: in **English only**. The phase's E2E dataset renders `en`, `fi` and `sv` as data locales, and the page-width measurements of `175-12-OVERFLOW-FIX.md` were made on `en`, `fi` and `sv` pages. **`da`, `et`, `fr` and `lb` were opened by nobody**, and no locale's wording was read by a native speaker.
- Luxembourgish is the least certain of the six throughout.

### The keys

New (31): `common.name` · `common.shortName` · `common.color` · `common.entityImage.organization` · `components.input.requiredLocaleInfo` · `components.input.colorPicker` · `components.input.noColor` · `components.input.error.invalidColor` · `dynamic.contestantAppBasicInfo.identity.title.organization` · `…identity.name.locked.candidate` · `…identity.name.locked.organization` · `…identity.name.editable.candidate` · `…identity.name.editable.organization` · `…identity.lockedInfo` · `…identity.emptyPlaceholder.organization` · `contestantApp.basicInfo.instructions.organization` · `contestantApp.basicInfo.instructionsNoQuestions.candidate` · `….instructionsNoQuestions.organization` · `contestantApp.basicInfo.nominations.description.organization` · `contestantApp.basicInfo.shortNameInfo` · `contestantApp.basicInfo.logoInfo` · `contestantApp.basicInfo.colorInfo` · `contestantApp.error.nameLocked.candidate` · `contestantApp.error.nameLocked.organization` · `contestantApp.home.ingress.notDone.organization` · `contestantApp.home.ingress.notDoneNoQuestions.candidate` · `….notDoneNoQuestions.organization` · `contestantApp.questions.none.title` · `contestantApp.questions.none.content` · `contestantApp.preview.tip.organization` · `contestantApp.preview.tagLabel`.

Reworded (3): `contestantApp.help.title` ("Candidate Support" became "Support") · `contestantApp.error.candidateNoNomination` · `contestantApp.error.nominationNoElection`.

### Choices a reviewer should see in every locale

- The help lines `shortNameInfo` and `colorInfo` say "the party's candidates" where English says "your candidates": the reader is one editor of a party.
- `contestantApp.preview.tagLabel` is a lead-in with no closing punctuation; the tag follows it on the page.
- The two reworded sign-out messages follow each catalogue's word for a nomination. In `fi` and `et` the old text said the candidate "lacks a constituency" where English said "has no nomination"; the new text says nomination ("ehdokkuus", "kandidatuur").
- The vocabulary is "party" for an organization (UI contract U-25).

### Per locale, where the wording is least certain

- **fi** — "Vaadittava kieli" follows the badge's `common.required`; "Pakollinen kieli" is the alternative. "heksakoodi". "puolueen tunnuksessa" for the party symbol. "Ylläpitäjän asettama" as a placeholder. "Ehdokkaidensa yhteydessä puolueesi näytetään näin".
- **sv** — "Obligatoriskt språk", where the badge's word is "Nödvändig". "Anges av administratören". "hexkod". "Logotyp". The Help title "Support" replaces "Kandidatstöd". "Bredvid sina kandidater visas ditt parti som".
- **da** — "hex-kode". "Angives af administratoren". The new sentences say "komme med i valgtesten"; the candidate's existing sentence reads "komme med valgtesten" and was left as it is. "Ved siden af sine kandidater vises dit parti som".
- **et** — The catalogue addresses the user formally (teie) in `basicInfo`, `home`, `error` and `dynamic`, and informally (sina) in `questions` and `preview`; each new string follows its file. The same split gives "valimiskompass" in `questions.none.content` and "valimisnõustaja" in the home sentences. "hex-kood". "Määrab administraator". "Vastatavaid küsimusi ei ole".
- **fr** — Inclusive forms as the catalogue has them ("candidat·es", "électeur·rice·s"); "l'administrateur" in the masculine, as the catalogue's one earlier use has it; nine new strings repeat it. "Aucune question à laquelle répondre" as a heading. "sigle" for an acronym; "rogné" for cropped. "À côté de ses candidat·es, votre parti apparaît ainsi".
- **lb** — final-n endings before a consonant, and the nouns "Ofkierzung", "Faarfauswiel", "Donnéeë vun der Partei"; "quadratescht Bild"; "opdaucht" and "untrëtt"; "Keng vun den Aussoen an dësem Wal-Kompass ass fir Iech geduecht"; "Nieft hire Kandidat*inne gëtt Är Partei esou ugewisen".

## A second group: the registry statement — 36 constructed sentences

Added 2026-10-09. Operator decision B2 (b) asked for one registry and privacy statement that is true of a candidate's user and of a party's user. Commit `3c686fc8e` rewrote three paragraphs of **`dynamic.contestantAppPrivacy.registryStatement.content`** in all seven catalogues. The English is an agent's draft awaiting the operator's approval. In each of `da`, `et`, `fi`, `fr`, `lb` and `sv` the three paragraphs hold **four sentences that were constructed and have been read by no native speaker: 4 × 6 = 24.** They are counted apart from the 204 strings above, which are whole message values; these are sentences inside one long value whose other nine paragraphs are unchanged.

**Added 2026-10-10: 12 more, and 6 of the 24 extended — 36 in all.** The operator approved the English statement with one edit to section 5 ("Stylise my additions if needed"): sentence 3 below gained "or national identification number", and two sentences follow it. In each of the six locales that is **two new constructed sentences (2 × 6 = 12) and one already-listed sentence with a new clause (6, counted among the 24)**. So a reader now has 6 sentences per locale in the statement: 6 × 6 = 36. The English of the three is the operator's text as styled, and is approved; the six translations are an agent's.

The four sentences, in English:

1. Section 3, the registry's name: "{appName} - Information System for Candidates and Parties."
2. Section 5, the list: "The registry stores the following data about the users of the service and about the candidates and parties they represent: name, political background, email address, website URLs, social media profile URLs, other voluntary responses to the election compass's questions, and information obtained from public electoral registers." Only the lead-in is new; the list lost "date of birth" and is otherwise the old one.
3. Section 5, the new sentence, **extended 2026-10-10**: "For a person who has identified themselves through a bank or another identity provider, the registry also stores their date of birth or national identification number."
4. Section 6: "Data stored in the registry is obtained from the users of the service through an online form, from the identity provider when a user identifies themselves through one, and from public electoral registers."
5. Section 5, **new 2026-10-10**: "These identifiers are not disclosed to the public."
6. Section 5, **new 2026-10-10**: "They are used only to calculate the person's age on the election date and to verify their nomination."

### What is measured and what is not

- Measured: in every catalogue one key differs from its predecessor, its tag sequence, ten headings and placeholders are unchanged, and the paragraphs that differ are the third, fifth and eighth (a script over the seven files); key parity by `yarn assert:i18n-catalog-namespaces` and the frontend's catalogue tests.
- Measured for the edit of 2026-10-10, by a script over the seven files against their predecessors: one key differs; the 46 tags, the ten headings and the placeholders are byte-equal; of the twelve paragraphs only the fifth differs; and every word of the old fifth paragraph survives in order, so the edit is an insertion and a tail.
- Not done: no locale's statement was opened in a browser for either change, and no wording was read by a native speaker or by a lawyer.

### Choices a reviewer should see in every locale

- **"Identity provider" had no word in any catalogue.** Each text builds one from the words its catalogue already used for the bank identification: `identifikationstjeneste` (da), `isikutuvastusteenus` (et), `tunnistautumispalvelu` (fi), `service d’identification` (fr), `Identifikatiounsservice` (lb), `identifieringstjänst` (sv). They say "identification service" where English says "identity provider".
- **"The users of the service"** uses the statement's own word for the service in each locale (`tjenesten`, `teenus`, `palvelu`, `service`, `Service`, `tjänsten`).
- **`et` and `fi`:** the list began "the person's name" (`isiku nimi`, `henkilön nimi`); it now begins "name" (`nimi`), as English does, because a party's name is not a person's. Both keep "party background" (`erakondlik taust`, `puoluetausta`) where English says "political background".
- **`fr`:** "les personnes qui utilisent le service" in place of an inclusive form of "utilisateurs", so that the pronoun that follows is "elles" by grammar; "candidat·es" as the catalogue has it; "partis" uninflected.
- **`lb`:** "Benotzer" as the catalogue's other strings have it, beside "Kandidat*innen"; the final n kept before a vowel ("Kandidat*innen a Parteien", "Donnéeën iwwer", "aneren Identifikatiounsservice"). The least certain of the six, as throughout.
- **`sv`:** the registry's name is "register över kandidater och partier", keeping the old name's word "register" where the other locales say "information system".
- **"National identification number" had no word in any catalogue** (2026-10-10). Four texts use the country's own everyday word and two build one: `personnummeret` (da), `isikukood` (et), `henkilötunnus` (fi), `numéro d’identification national` (fr), `déi national Identifikatiounsnummer` (lb), `personbeteckning` (sv, the word of Swedish as written in Finland; Sweden says `personnummer`). The four everyday words are narrower than the English: each names one country's number.
- **"These identifiers"** (2026-10-10) is a noun in two texts and "identifying data" in four: `identifikationsoplysninger` (da), `tunnuseid` (et), `tunnistetietoja` (fi), `identifiants` (fr), `Identifikatiounsdonnéeë` (lb), `identifierande uppgifter` (sv).
- **"Disclosed"** (2026-10-10) is the verb section 7 of the same statement already uses for a disclosure, in every locale: `videregives`, `avalikustata`, `luovuteta`, `communiqués`, `weiderginn`, `lämnas ut`. **"Nomination"** is `common.nomination`'s noun as the contestant app uses it (`opstilling`, `kandidatuur`, `ehdokkuus`, `candidature`, `Nominatioun`, `nominering`), and **"the election date"** is the word of `dynamic.info.dateInfo` (`valgdatoen`, `valimispäev`, `vaalipäivä`, `la date de l’élection`, `Waldatum`, `valets datum`).
- **Where the new sentences are least certain** (2026-10-10): `fi` "henkilön vaalipäivän mukaisen iän laskemiseen", for the age on the election date; `et` "valimispäeva seisuga" for the same, and the word order of "Neid tunnuseid üldsusele ei avalikustata"; `sv` "vid valets datum", where "på valdagen" is the everyday phrase; `lb` throughout, with "déi national Identifikatiounsnummer", "um Waldatum" and the final n dropped in "Identifikatiounsdonnéeë ginn", "nëmme benotzt" and "auszerechnen a fir".
- **`fi`:** the rewritten sentence of section 6 reads `tallennettavia tietoja saadaan`; its predecessor read `tallennettavat tietoja saadaan`. `sähköpostisoite` in section 5 is an older misspelling of `sähköpostiosoite` and was left.

### The sentences as written

Each "Section 5" line below is the paragraph as it stands after the edit of 2026-10-10: its last three sentences are the extended one and the two new ones.

**da**

- Section 3: `{appName} – Informationssystem for kandidater og partier.`
- Section 5: `Registret indeholder følgende oplysninger om tjenestens brugere og om de kandidater og partier, de repræsenterer: navn, politisk baggrund, e-mailadresse, hjemmesideadresser, profiler på sociale medier, frivillige svar på valgtestens spørgsmål og oplysninger fra offentlige valgregistre. For en person, der har identificeret sig via en bank eller en anden identifikationstjeneste, indeholder registret også fødselsdatoen eller personnummeret. Disse identifikationsoplysninger videregives ikke til offentligheden. De bruges kun til at beregne personens alder på valgdatoen og til at verificere personens opstilling.`
- Section 6: `Oplysningerne indsamles fra tjenestens brugere via en onlineformular, fra identifikationstjenesten, når en bruger identificerer sig via en sådan, og fra offentlige valgregistre.`

**et**

- Section 3: `{appName} – kandidaatide ja erakondade infosüsteem.`
- Section 5: `Registrisse salvestatavad andmed teenuse kasutajate ning nende esindatavate kandidaatide ja erakondade kohta on: nimi, erakondlik taust, e-posti aadress, veebilehtede aadressid, sotsiaalmeedia profiilide aadressid, muud vabatahtlikud vastused valimiskompassi küsimustele ning avalikest valijanimekirjadest saadavad andmed. Isiku kohta, kes on end tuvastanud panga või muu isikutuvastusteenuse kaudu, salvestatakse registrisse ka sünniaeg või isikukood. Neid tunnuseid üldsusele ei avalikustata. Neid kasutatakse üksnes isiku vanuse arvutamiseks valimispäeva seisuga ja tema kandidatuuri kontrollimiseks.`
- Section 6: `Registrisse salvestatavaid andmeid saadakse teenuse kasutajatelt veebivormi kaudu, isikutuvastusteenuselt, kui kasutaja end selle kaudu tuvastab, ning avalikest valijanimekirjadest.`

**fi**

- Section 3: `{appName} - ehdokkaiden ja puolueiden tietojärjestelmä.`
- Section 5: `Rekisteriin tallennettavia tietoja palvelun käyttäjistä sekä heidän edustamistaan ehdokkaista ja puolueista ovat: nimi, puoluetausta, sähköpostisoite, www-sivustojen osoitteet, sosiaalisen median profiilien osoitteet, muut vapaaehtoiset vastaukset vaalikoneen kysymyksiin sekä julkisista vaaliluetteloista saatavat tiedot. Henkilöstä, joka on tunnistautunut pankin tai muun tunnistautumispalvelun kautta, rekisteriin tallennetaan myös syntymäaika tai henkilötunnus. Näitä tunnistetietoja ei luovuteta julkisuuteen. Niitä käytetään vain henkilön vaalipäivän mukaisen iän laskemiseen ja hänen ehdokkuutensa varmentamiseen.`
- Section 6: `Rekisteriin tallennettavia tietoja saadaan palvelun käyttäjiltä verkkolomakkeen kautta, tunnistautumispalvelusta, kun käyttäjä tunnistautuu sellaisen kautta, sekä julkisista vaaliluetteloista.`

**fr**

- Section 3: `{appName} – Système d’information des candidat·es et des partis.`
- Section 5: `Le registre conserve les données suivantes sur les personnes qui utilisent le service et sur les candidat·es et les partis qu’elles représentent : nom, appartenance ou parcours politique, adresse e‑mail, URL de sites web, URL de profils de réseaux sociaux, autres réponses volontaires aux questions de la boussole électorale, ainsi que des informations obtenues dans les registres électoraux publics. Pour une personne qui s’est identifiée auprès d’une banque ou d’un autre service d’identification, le registre conserve également sa date de naissance ou son numéro d’identification national. Ces identifiants ne sont pas communiqués au public. Ils sont utilisés uniquement pour calculer l’âge de la personne à la date de l’élection et pour vérifier sa candidature.`
- Section 6: `Les données enregistrées dans le registre sont obtenues auprès des personnes qui utilisent le service via un formulaire en ligne, auprès du service d’identification lorsqu’une personne s’identifie par ce moyen, et à partir des registres électoraux publics.`

**lb**

- Section 3: `{appName} – Informatiounssystem fir Kandidat*innen a Parteien.`
- Section 5: `Am Register ginn dës Donnéeën iwwer d’Benotzer vum Service an iwwer d’Kandidat*innen a Parteien, déi si vertrieden, gespäichert: Numm, politesche Hannergrond, E‑Mail‑Adress, Websäit‑URLen, Social‑Media‑URLen, aner fräiwëlleg Äntwerten op Froen aus dem Wal‑Kompass, souwéi Informatiounen aus ëffentleche Walregisteren. Fir eng Persoun, déi sech iwwer eng Bank oder en aneren Identifikatiounsservice identifizéiert huet, gëtt och de Gebuertsdatum oder déi national Identifikatiounsnummer am Register gespäichert. Dës Identifikatiounsdonnéeë ginn net un d’Ëffentlechkeet weiderginn. Si ginn nëmme benotzt, fir den Alter vun der Persoun um Waldatum auszerechnen a fir hir Nominatioun ze verifizéieren.`
- Section 6: `D’Donnéeë kommen iwwer e Formulaire vun de Benotzer vum Service, vum Identifikatiounsservice, wann e Benotzer sech iwwer een identifizéiert, an aus ëffentleche Walregisteren.`

**sv**

- Section 3: `{appName} - register över kandidater och partier.`
- Section 5: `Registret innehåller följande uppgifter om tjänstens användare och om de kandidater och partier som de företräder: namn, politisk bakgrund, e-postadress, webbadresser, adresser till sociala medieprofiler, andra frivilliga svar på valkompassens frågor samt information från offentliga vallistor. För en person som har identifierat sig via en bank eller en annan identifieringstjänst innehåller registret också födelsedatum eller personbeteckning. Dessa identifierande uppgifter lämnas inte ut till allmänheten. De används endast för att beräkna personens ålder vid valets datum och för att verifiera personens nominering.`
- Section 6: `Uppgifter som lagras i registret erhålls från tjänstens användare via ett webbformulär, från identifieringstjänsten när en användare identifierar sig via en sådan samt från offentliga vallistor.`

## Solution

One native reader per language reads the 34 values in context: an organization's profile (editable, locked by confirmation, locked by answers), the neutral questions page, an organization's home and its preview, and the two sign-out messages. The same reader reads the registry statement's three paragraphs where they are shown: the terms-of-use view a signed-in user meets first, and `/contestant/privacy`. A wording fix is a catalogue edit; key parity is held by `yarn assert:i18n-catalog-namespaces` and the frontend's catalogue tests.

While reading, each sentence can be looked at at 320 px: that is one of the reads `2026-10-09-175-seven-reads-the-ui-contract-leaves-to-a-person.md` lists.
