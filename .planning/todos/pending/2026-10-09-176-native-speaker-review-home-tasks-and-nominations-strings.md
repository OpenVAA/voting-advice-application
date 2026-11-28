---
created: 2026-10-09T00:00:00.000Z
title: Native-speaker review of the home, task and nominations strings (da, et, fi, fr, lb, sv) — 120 constructed values
area: i18n
severity: minor
source: Phase 176 plan 04 (176-CONTEXT.md O-9; 176-04-SUMMARY.md § Constructed copy that needs a native speaker, which holds every text); filed by 176-19
owner: the operator, with one native reader per language
files:
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.nominations.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.common.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.home.json
  - apps/frontend/messages/{da,et,fi,fr,lb,sv}/contestantApp.basicInfo.json
---

## Problem

Phase 176 plan 04 (commit `05e70fdd9`) added 19 new sentences and reworded one. The English text is the UI contract's. In each of `da`, `et`, `fi`, `fr`, `lb` and `sv` the value at each of the 20 keys was **constructed from terms the catalogue already used and has not been read by a native speaker**: 120 values (126 sentences, the plural message holding two).

A sibling of `2026-10-09-175-native-speaker-review-organization-editing-strings.md`, `2026-10-06-native-speaker-review-profile-selection-strings.md`, `2026-10-05-native-speaker-review-contestant-app-names.md` and `2026-10-07-174-native-speaker-review-sign-in-mail.md`; the five can be read in one sitting per language. The review does not hold the phase (176-CONTEXT.md O-9).

### What is measured and what is not

- Measured: key parity and placeholder parity across the seven locales, and that no new sentence takes a parameter but `{count}`.
- Rendered and scanned in a browser: in **English only**. One test of `perm-no-nomination` opens the nominations view in Finnish and reads two names; it runs no scan and measures no width. **`da`, `et`, `fr`, `lb` and `sv` were opened by nobody**, and no locale's wording was read by a native speaker.
- Luxembourgish is the least certain of the six throughout.

### The keys

New (19): `contestantApp.nominations.empty.candidate` · `.empty.organization` · `.state.label` · `.state.pending` · `.state.pendingInfo` · `contestantApp.common.nominationsNotEditable` · `.closedReason.noNomination.candidate` · `.closedReason.noNomination.organization` · `.closedReason.preview` · `.closedReason.previewNoQuestions` · `contestantApp.home.nomination.enter` · `.nomination.view` · `.ingress.noNomination.candidate` · `.ingress.noNomination.organization` · `.tasksLabel` · `.taskStatus.complete` · `.taskStatus.incomplete` · `.taskStatus.incompleteCount` · `.taskStatus.blocked`.

Reworded (1): `contestantApp.basicInfo.requiredInfo`, its first sentence.

Not constructed, and worth a look all the same: `contestantApp.nominations.title`, `.description.candidate` and `.description.organization` are the catalogue's existing texts, moved byte for byte.

### Three places where a locale disagrees with itself or with English

1. **da**, `contestantApp.nominations.description.candidate`: says "parti eller valgkreds" (party or constituency) where the English says election list or election symbol. Existing text, moved unchanged.
2. **fr**: the view's title is "Candidatures", while `common.nomination` and other sentences say "nomination". A reviewer who prefers one word should change the other places too.
3. **sv**: the three new sentences that send the user to support say "Kontakta supporten", where `contestantApp.common.editingNotAllowed`, shown in the same note, says "Kontakta support".

### Per locale, where the wording is least certain

`176-04-SUMMARY.md` § *Constructed copy that needs a native speaker* lists them: the word for a nomination in each catalogue (`opstilling`, `nominering` beside `Nomineringslistor` and `Utnämning`, `ehdokkuus`, `kandidatuur` beside `Kandideerimine`, `candidature` beside `nomination`), the word for status (`Status`, `Olek`, `Tila`, `Statut`), the neutral counting word in the status sentence with a count, formal address in `et`, the future tense in `fr`, and the final-n endings in `lb`.

## Solution

One native reader per language reads the 20 keys in the three screens they appear on (the home of an entity with no nomination, the menu with closed items, the nominations view with and without a nomination and with the lock on), corrects the catalogue, and the catalogue's own parity tests are run. No key changes, so no code changes with it.
