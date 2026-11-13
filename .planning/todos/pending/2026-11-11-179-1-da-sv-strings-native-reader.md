---
created: 2026-11-11T00:00:00.000Z
title: Native-reader review of the Danish and Swedish strings Phase 179.1's plan 87 wrote
area: i18n
severity: minor
source: Phase 179.1 (plan 179.1-87, ruling C5 of the WR16J UAT; rule 5 of the rules of plans 86 to 90 in 179.1-86-PLAN.md; listed by plan 179.1-90)
files:
  - apps/frontend/messages/da/common.json
  - apps/frontend/messages/sv/components.json
  - apps/frontend/messages/sv/entityFilters.json
  - apps/frontend/messages/sv/feedback.json
  - apps/frontend/messages/sv/privacy.json
  - apps/frontend/messages/sv/results.json
---

## Problem

Plan 87 of Phase 179.1 extended the untranslated-catalogue guard to every locale but `en` (ruling C5 of the WR16J UAT). Of the values it found equal to `en`'s, the operator approved, at plan 87's checkpoint, one Danish (`da`) and eight Swedish (`sv`) translations, written in nine values of six files. Every one is a machine translation that the operator approved without reading it as a native speaker. **No native reader has read any of them.** They are served as they stand.

It sits beside `2026-11-10-179-1-fr-lb-strings-native-reader.md`, which lists the French and Luxembourgish strings of plans 70 to 81, and `2026-10-26-179.1-native-speaker-review-of-the-phase-strings.md`.

## What to do

- For `da` and for `sv`, read every row below in its screen's context and correct the catalogue file in place. A correction changes text only: no key is renamed or removed. The screens: an entity's links (`common.website`), the video player's controls, the numeric filter of the results, the feedback button and a failed feedback's mail, the privacy page's analytics section, and the results' alliance counts.
- Read `sv` `components.video.unmute` too. It reads `Avslöja`. Plan 87 observed it and left it: it is not `en`'s value, so no comparison of the guard reads it. No ruling is attributed to the operator on it.
- In the same file as `privacy.analytics.title`, the cookies paragraph `privacy.cookies.content` ends `så som beskrivs under Analytics`, naming the heading by its English word; the heading now reads `Analys`. Plan 87 did not change that paragraph. Read it with the heading.
- A corrected string must then be written into `179.1-87-approved-strings.json` in the phase directory, or `179.1-approved-strings.mjs` will report it as differing.

## Added by plan 179.1-87

Plan 179.1-87 wrote nine `da` and `sv` values, in commit `c41d66d84`. Derived by `git diff $(cat tests/e2e-runs/179.1-unit/179.1-87-head-before) c41d66d84 -- apps/frontend/messages/da apps/frontend/messages/sv` (the head before plan 87 is `37649dc4a`). Nothing after `c41d66d84` changes a catalogue. The same commit corrected `en`'s `feedback.error.emailSubject` from `Feedack` to `Feedback`, which is not a translation and is not listed.

### `common.json` (1)

File: `apps/frontend/messages/da/common.json`.

| key | was | da |
|---|---|---|
| `common.website` | Website | Websted |

### `components.json` (2)

File: `apps/frontend/messages/sv/components.json`.

| key | was | sv |
|---|---|---|
| `components.video.mute` | Mute | Ljud av |
| `components.video.replay` | Replay | Spela igen |

Observed and left: `components.video.unmute`, `Avslöja` (see § What to do).

### `entityFilters.json` (1)

File: `apps/frontend/messages/sv/entityFilters.json`.

| key | was | sv |
|---|---|---|
| `entityFilters.numeric.maxLabel` | Maximum | Högst |

### `feedback.json` (2)

File: `apps/frontend/messages/sv/feedback.json`.

| key | was | sv |
|---|---|---|
| `feedback.error.emailSubject` | Feedack | Respons |
| `feedback.send` | SV Send feedback | Skicka feedback |

### `privacy.json` (1)

File: `apps/frontend/messages/sv/privacy.json`.

| key | was | sv |
|---|---|---|
| `privacy.analytics.title` | Analytics | Analys |

### `results.json` (2)

File: `apps/frontend/messages/sv/results.json`.

| key | was | sv |
|---|---|---|
| `results.alliance.numShown` (`numShown=1`) | 1 alliance | 1 allians |
| `results.alliance.numShown` (`numShown=*`) | {numShown} alliances | {numShown} allianser |
