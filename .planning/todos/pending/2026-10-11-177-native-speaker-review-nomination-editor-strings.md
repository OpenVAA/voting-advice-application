---
created: 2026-10-11T00:00:00.000Z
title: 330 constructed translation values of the nomination editor — 55 keys in each of da, et, fi, fr, lb and sv — that no native reader has seen
area: Localization / Contestant app
severity: minor
source: "Phase 177 plan 177-12 (177-12-SUMMARY.md § For plan 177-21); obligation O-7 item 5; operator decision C4 (a): the review does not hold the phase; filed by 177-21"
owner: the operator, to find native readers; one reader for each of the six locales
files:
  - apps/frontend/messages/da/contestantApp.nominations.json
  - apps/frontend/messages/et/contestantApp.nominations.json
  - apps/frontend/messages/fi/contestantApp.nominations.json
  - apps/frontend/messages/fr/contestantApp.nominations.json
  - apps/frontend/messages/lb/contestantApp.nominations.json
  - apps/frontend/messages/sv/contestantApp.nominations.json
  - apps/frontend/messages/en/contestantApp.nominations.json
---

## What to review

**330 values: the 55 keys plan 177-12 added, in each of the six locales other than English.** 54 of the keys begin `contestantApp.nominations.` and one `contestantApp.common.`. The list is the added lines of `git diff 2a38ee9ac..027614b2d -- apps/frontend/messages/{da,et,fi,fr,lb,sv}`. None was written or checked by a native reader. The English values are the UI contract's.

What a script checked across the seven locales (plan 177-12, not re-run by this plan): one key set, every value a non-empty string, the placeholders and tags of every value equal to the English value's, no new value identical to the English one, and no straight apostrophe or doubled space.

## The terms each locale uses

Each is the catalogue's own existing word.

| | nomination | election | constituency | party | alliance | list (the legend) | confirm | independent / no party | none (for a party) | other: candidate / party |
|---|---|---|---|---|---|---|---|---|---|---|
| fi | ehdokkuus | vaali, vaalit | vaalipiiri | puolue | vaaliliitto | vaalilista | vahvistaa | Sitoutumaton / ei puoluetta | Ei vaaliliittoa | Muu / Muu |
| sv | nominering | val | valkrets | parti | valallians | lista | bekräfta | Oberoende / inget parti | Ingen | Annat / Annan |
| da | opstilling | valg | valgkreds | parti | alliance | liste | bekræfte | Uden tilhørsforhold / intet parti | Ingen | Andet / Anden |
| et | kandidatuur | valimised | valimisringkond | erakond | valimisliit | nimekiri | kinnitama | Sõltumatu / erakonnata | Puudub | Muu / Muu |
| fr | candidature | élection | circonscription | parti | alliance | liste | confirmer | Sans étiquette / sans parti | Aucune | Autre / Autre |
| lb | Nominatioun | Wahl | Walbezierk | Partei | Allianz | Lëscht | confirméieren | Onofhängeg / keng Partei | Keng | Aner / Aner |

## Where a reader should look first

- **lb, all 55.** The least certain locale. In particular "ee\*eng Kandidat\*in" in `emptyNoElection.candidate` (the catalogue has the starred noun but no indefinite article before it; the form is the executor's); "Wahlziedel" for the ballot, "Fakultativ" for optional, "weiderzegoen", "verréckelt" for moved and "derbäigesat", none of which has a precedent in the catalogue; the n-rule endings throughout. The catalogue writes both "Wahl" and "Wal-"; each existing word was kept as it stands.
- **et `error.duplicateParent`**: "sama nimekiri" against the legend "Valimiste nimekiri". This is the one place a translator's note was followed only in part: the legend's noun without its genitive, because "sama valimiste nimekiri" beside "samade valimiste" reads as a repetition. **et `parent.none.organization`**: "Puudub".
- **fi**: "Ei vaaliliittoa" for a party's "None"; "äänestyslipussa" for "on the ballot"; `emptyNoElection.*` says "to which a nomination can be defined for a candidate / a party" in place of "in which … can be nominated".
- **sv and da `parent.other.*`**: the agreement by type. **da `details.changeSelection`**: "Ændr det valgte", chosen because "valg" is both a choice and an election.
- **fr**: "Sans étiquette / sans parti"; `hasCandidates` uses "des candidat·es y sont rattaché·es"; the space before a colon in `details.previousConstituency`.
- **Every locale: two sentences bent away from the English** so that nothing agrees with the gender of the parent's noun, which is a party under a candidate and an alliance under a party: `requestedParent` and `parent.unlisted`. In fr and et `parent.notNominatedHint.*` opens with a noun phrase in place of a participle for the same reason.

## Existing values a reader may want to see beside the new ones

Not changed by Phase 177: sv `contestantApp.nominations.title` is "Nomineringslistor" where every other sentence says "nominering(ar)"; sv writes "valdistrikt" in `contestantApp.preregister.*` and "valkrets" everywhere else; da `contestantApp.nominations.description.candidate` names "parti eller valgkreds" where the English names the list and the symbol; et `common.electionList` is "Valimiste nimekiri".

## Related

The same review for earlier phases' strings: `2026-10-09-175-native-speaker-review-organization-editing-strings.md` and `2026-10-09-176-native-speaker-review-home-tasks-and-nominations-strings.md`. Whether the new pages fit a phone in these locales is a separate read: `2026-10-11-177-reads-the-ui-contract-leaves-to-a-person.md`.
