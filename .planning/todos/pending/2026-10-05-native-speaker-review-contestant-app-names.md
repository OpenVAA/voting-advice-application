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
