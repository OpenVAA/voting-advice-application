---
phase: 177-define-nominations
plan: 12
subsystem: i18n
tags: [i18n, catalogues, seven-locales, entity-descriptor, not-editable-note, nomination-editor, nominations-view]
status: complete
requires:
  - "177-11: the fixture's English constants for the four submit labels and the two status words; the gate run 177-11-close"
  - "177-01: 177-gates.sh, 177-verdict.mjs, 177-BASE"
provides:
  - "55 new message keys in each of da, en, et, fi, fr, lb, sv: 54 under contestantApp.nominations (edit, descriptionEditable.*, emptyEditable.*, emptyNoElection.*, requestedParent, elections.*, constituencies.*, details.*, parent.*, error.*) and contestantApp.common.nominationsNotEditableAnswersLocked"
  - "apps/frontend/src/lib/types/generated/translationKey.ts regenerated: 55 more members of TranslationKey"
  - "EntityDescriptor: nominationsDescriptionEditable, nominationsEmptyEditable, nominationsEmptyNoElection, nominationElectionsTitle, nominationElectionsIngress, nominationConstituenciesTitle, nominationConstituenciesIngress, nominationConstituenciesNoElection, electionSymbolInfo, parentNone, parentOther, parentOtherLabel, parentOtherInfo, parentOtherRequired, parentNotNominatedHint, parentNoOptions"
  - "NotEditableNoteProps['reason'] gains 'nominationsAnswersLocked'; the note shows contestantApp.common.nominationsNotEditableAnswersLocked for it"
  - "the gate run tests/e2e-runs/177-gates/177-12-close-r2 at 90e054d92: typecheck, lint, unit, check-frontend, build, format, docs-links all 0"
affects: [177-15, 177-16, 177-17, 177-18, 177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a sentence that refers to a thing whose noun differs by entity type, under a key that is not per type, is written so that no word agrees with that noun (requestedParent, parent.unlisted)"
    - "a test of a key that is the beginning of another key matches the key only where no letter follows it"
key-files:
  created: []
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.nominations.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.common.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
    - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte
    - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts
    - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/notEditableNote/NotEditableNote/+page.md"
decisions:
  - "the English values are taken from the UI contract's table by a script, not retyped; the six other locales are constructed whole from each catalogue's own terms"
  - "the new keys are sorted into each file alphabetically, as the two files already were"
  - "parent.other is 'Annat' for a candidate and 'Annan' for a party in sv, 'Andet' and 'Anden' in da: the word agrees with parti (neuter) and with valallians / alliance (common); the four other locales have one word for both"
  - "parent.none for a party is the bare word agreeing with the locale's alliance in sv, da, fr and lb, 'Puudub' in et and the noun written out in fi ('Ei vaaliliittoa')"
  - "sv writes 'valkrets', the word of common.constituency and of the nominations catalogue, not the 'valdistrikt' of the legacy pre-registration strings"
  - "the descriptor's test derives the per-type pairs from the English catalogue, so a per-type key added to contestantApp.nominations without a member fails it"
requirements-completed: []
metrics:
  started: "2026-10-11T04:46:24Z"
  completed: "2026-10-11T05:00:00Z"
  duration: "14 minutes"
  tasks: 2
  files: 21
actuals:
  tokens: 19914 # chars/4 over git diff 2a38ee9ac..90e054d92 outside .planning (79,656 characters)
  tasks: 2
  commits: 4 # git rev-list --count 2a38ee9ac..90e054d92
plan_head_before: 2a38ee9acf68c0d93161a3e987858df9c960052f
plan_head_after: 90e054d92530ed4c2cda660c165d3f0de496fd1a
---

# Phase 177 Plan 12: The Copy in Seven Locales, the Descriptor's Members and the Note's Third Reason — Summary

Every string the nomination editor and the changed nominations view will show exists in all seven catalogues under the UI contract's keys, the entity descriptor picks each of the sixteen sentences that differ by entity type, and `NotEditableNote` can say why nominations cannot be changed while answers are locked. Nothing renders a new key yet, so no E2E run was made, as the plan rules.

`requirements-completed` is empty on purpose: the plan's frontmatter names NOM-03 to NOM-06, and this plan writes the words and the two pickers their screens will read; nothing a user meets is delivered by it. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched.

## Read this first

- **Both verify blocks pass as written**, exit 0 each. Neither has a defect of the four kinds the dispatch lists.
- **The first gate run was red on three rows, by my own defect.** I committed the test file without running the linter and the type check on it. `177-12-close` (head `b1c1e5c78`) has typecheck, lint and check-frontend at 1, all three for `entityDescriptor.test.ts` alone: two arrow-function helpers against `func-style`, and two lookups that indexed the `as const` descriptors with a key one of them does not hold. Fixed in `90e054d92`; the run made again as `177-12-close-r2` is green on all seven rows. The red directory is kept. *Deviations*, 1.
- **The fixture's English constants and the catalogue agree, and this plan changes neither.** The four submit labels and the two status words the editor's fixture reads (`Continue`, `Return`, `Save and Continue`, `Save and Return`, `Confirmed`, `Pending confirmation`) are the values of `common.continue`, `common.return`, `common.saveAndContinue`, `common.saveAndReturn`, `common.confirmed` and `contestantApp.nominations.state.pending`: existing keys, all unchanged. No new English value is one the fixture reads. Nothing differs.
- **No message was reworded or removed**, so no search of `tests/` for an English text was owed; the diff of the fourteen catalogue files has 679 added lines and none deleted.
- **All 330 non-English values are constructed, not native.** Luxembourgish is the least certain. The list and the doubts are under *For plan 177-21*.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `027614b2d` | `feat(177-12): the strings of the nomination editor and the changed nominations view, in seven locales` |
| 2, red | `4fe3d66a5` | `test(177-12): the descriptor's nomination-editor members and the note's third reason` |
| 2, green | `b1c1e5c78` | `feat(177-12): the entity descriptor's nomination-editor members and the note's third reason` |
| 2, fix | `90e054d92` | `fix(177-12): the descriptor test's helpers as function declarations, its lookups through the descriptor's type` |

## Each task's verify command, with its real exit status

Each `<automated>` block was extracted from the plan by a script, byte for byte, to `tests/e2e-runs/177-unit/177-12-t<N>-verify.sh` and run with `bash`; its log, status and head are kept beside it.

| Block | As written | Restated | Head |
|---|---|---|---|
| Task 1 | **0** | — | `027614b2d` |
| Task 2 | **0** — its last stage: `177-verdict gates 177-12-close-r2: PASS` (the label resolves to its newest attempt) | — | `90e054d92` |

## Gate rows

Launched in the background and polled. Before each: AC power, battery 100 %; Docker VM free 17.0 GiB before the first and 16.9 GiB before the second (17,714,772 KiB after it; the floor is 13.8). The verdict found no Sleep entry inside the window of the second run, and `pmset -g log` holds no Sleep or DarkWake entry between 06:00 and 08:00 local.

| Row | `177-12-close`, head `b1c1e5c78` | `177-12-close-r2`, head `90e054d92` | Seconds (r2) |
|---|---|---|---|
| typecheck | **1** | 0 | 20 |
| lint | **1** | 0 | 49 |
| unit | 0 | 0 | 37 |
| check-frontend | **1** | 0 | 9 |
| build | 0 | 0 | 17 |
| format | 0 | 0 | 20 |
| docs-links | 0 | 0 | 1 |

Unit totals of the second run: frontend **3723 passed and 30 skipped** — 36 more than `177-11-close`'s 3687, which is the 34 tests added to the descriptor's file and the 2 added to the note's — dev-seed 1050, data 318 (supabase 462, app-shared 148, llm 49, matching 43, argument-condensation 31, filters 22, question-info 22, core 8). The frontend count of the first run was the same 3723.

No E2E run. The latest full run stays `tests/e2e-runs/177-e2e/177-10-close` (346 of 346, 116 projects).

## Task 1 — the catalogues

### Arithmetic, each from a command

- Keys the contract's table gave: **55** (``awk '/^### New messages/,/^### Messages reworded/' 177-UI-SPEC.md | grep -c '^| `contestantApp\.'``), 54 beginning `contestantApp.nominations.` and one `contestantApp.common.`.
- Catalogue totals, by the contract's own command run for each locale: **649 before, 704 after, in each of the seven** — the contract's forecast.
- `yarn assert:i18n-catalog-namespaces`: 704 keys; `contestantApp.*` 254, `adminApp.*` 121, other 329; 0 violations.
- `yarn workspace @openvaa/frontend vitest run src/lib/i18n`: 426 of 426.
- The generated key type: 55 lines added, none removed.

### How the values were written

The English values were read from the contract's table by a script (the third cell of each row, character for character, typographic apostrophes included) and merged with the six other locales' values from one data file; the script refuses a row with other than three cells, a key that already exists and a locale that lacks or adds a key. Both files of every locale were already in alphabetical key order; the new keys are sorted into that order. Prettier leaves all fifteen files unchanged.

### The proof across locales

A script of my own (kept outside the repository), run against `177-BASE`, exit 0: in both namespaces the seven locales hold one key set; every value is a non-empty string; the placeholder set and the HTML tag set of every value equal the English value's; every value that existed at the base commit is unchanged in every locale (the plan's verify checks that for English alone); no new value has a straight apostrophe, a doubled or an outer space; **no new value of a non-English locale is identical to the English one**. One new key carries a placeholder, `details.previousConstituency`, named `{constituency}` in all seven; no new value carries a tag. No new English value holds "entity" or "organization".

### The terms each locale uses

Each is the catalogue's own existing word, read from `common.json` and from the two files before they were changed.

| | nomination | election | constituency | party | alliance | list (the legend) | confirm | independent / no party | none (for a party) | other: candidate / party |
|---|---|---|---|---|---|---|---|---|---|---|
| fi | ehdokkuus | vaali, vaalit | vaalipiiri | puolue | vaaliliitto | vaalilista | vahvistaa | Sitoutumaton / ei puoluetta | Ei vaaliliittoa | Muu / Muu |
| sv | nominering | val | valkrets | parti | valallians | lista | bekräfta | Oberoende / inget parti | Ingen | Annat / Annan |
| da | opstilling | valg | valgkreds | parti | alliance | liste | bekræfte | Uden tilhørsforhold / intet parti | Ingen | Andet / Anden |
| et | kandidatuur | valimised | valimisringkond | erakond | valimisliit | nimekiri | kinnitama | Sõltumatu / erakonnata | Puudub | Muu / Muu |
| fr | candidature | élection | circonscription | parti | alliance | liste | confirmer | Sans étiquette / sans parti | Aucune | Autre / Autre |
| lb | Nominatioun | Wahl | Walbezierk | Partei | Allianz | Lëscht | confirméieren | Onofhängeg / keng Partei | Keng | Aner / Aner |

"Independent" is each catalogue's `common.unaffiliated`. Administrator, support and the form of address (informal in fi, sv and da; formal in et, fr and lb) follow the two files' existing sentences.

### The translator's notes, one by one

| Note | What was done |
|---|---|
| `details.previousConstituency` keeps the colon form | Kept in all seven: `Aiemmin:`, `Tidigare:`, `Tidligere:`, `Varem:`, `Auparavant :`, `Virdrun:`, each followed by `{constituency}`. French has a space before the colon, as its catalogue writes `?`, `;` and `:`. |
| `parent.none.candidate` in the inclusive or noun form | The catalogue's own `common.unaffiliated` in each locale. In fr it is "Sans étiquette", which does not agree with the candidate's gender at all. |
| `parent.none.organization` agrees with alliance | sv "Ingen" (en valallians), da "Ingen" (en alliance), fr "Aucune", lb "Keng". |
| `parent.other.<type>` agrees with its noun | sv and da differ by type, as the table above shows. |
| `error.duplicateParent` follows the legend | fi "vaalilista", sv "lista", da "liste", fr "liste", lb "Lëscht". **et is the one place the note is followed only in part**: the legend, `common.electionList`, reads "Valimiste nimekiri", and the sentence says "sama nimekiri" — the legend's noun without its genitive, because "sama valimiste nimekiri" beside "samade valimiste" in the same sentence reads as a repetition. |
| The two titles stay questions | Questions in all seven. |

Two sentences beyond the notes were written to the same end. `requestedParent` ("Requested by you. It is not in the application yet…") and `parent.unlisted` ("…You can keep it or choose another") are not per type, and what they refer to is a party under a candidate and an alliance under a party — different genders in sv and da. They are written so that nothing agrees with that noun: sv "Du har begärt detta…", da "Du har anmodet om dette…", fr "Vous en avez fait la demande. Ce nom ne figure pas encore…", lb "Vun Iech ugefrot. Dësen Numm ass nach net…"; and sv "Du kan behålla ditt val eller göra ett annat", da "…beholde dit valg eller træffe et andet", fr "Ce choix n’est plus proposé…", lb "…dëse Choix behalen oder en aneren treffen". In the same way `parent.notNominatedHint.*` in fr and et opens with a noun phrase ("Pas encore de candidature ici", "Siin veel kandidatuuri ei ole") in place of a participle that would agree.

## Task 2 — the descriptor and the note

### Red, then green

The red run is kept as `tests/e2e-runs/177-unit/177-12-copy-red.{log,exit,head,json}`: exit 1, **36 failed and 40 passed, every failure an `AssertionError`**, no file failed to load (read from the JSON report). The 36: "holds every member" for each type (2), "holds the key of each type" for sixteen members, "names a message of the English catalogue" for the same sixteen, the catalogue-derived test, and the note's sentence for the third reason. The head file names `027614b2d`: the tests were in the working tree over that commit. Green: 76 of 76 at `b1c1e5c78` and again at `90e054d92`.

### The descriptor

Sixteen members, each typed `TranslationKey` with a TSDoc sentence, each holding its type's key in both entries; the existing members are untouched. Fifteen take the name the contract's table gives; `parentOther` is the plan's ruling 2. Every key of the contract that ends in `.candidate` or `.organization` — 32 — is a value of the descriptor.

The test holds the members twice: by name, each with the key both types' keys begin with; and derived from the English catalogue — every key under `contestantApp.nominations` that ends in `.candidate` must be the value of exactly one member of the candidate's entry, with the `.organization` twin in the same member of the organization's. A later per-type key added to that namespace without a member fails the second, which is what "one module owns the choice by type" needs. A fourth test asserts that no per-type key of the namespace is written for one type alone.

### The note

`REASON_MESSAGE` holds three entries, the union three members, the prop's TSDoc and the `@component` docstring a line for the third, which says when a page gives it. Nothing else of the component changed. With either existing reason the note renders the sentence it rendered. The test's sentence check was rewritten for three reasons: `contestantApp.common.nominationsNotEditable` is the beginning of the new key, and the test's `t` returns the key, so "does not contain the other sentence" would have failed for the right behaviour; a key now counts only where no letter follows it.

### The components skill's re-check list

| Item | Outcome |
|---|---|
| 1. Docstring, co-located type file, barrel export | All three exist for `NotEditableNote` and are unchanged in kind; the docstring names the third reason. |
| 2. `yarn workspace @openvaa/docs generate:docs`, diff read | Run, exit 0. One file changed, one line: the third reason in the note's generated page. Committed in `b1c1e5c78`. |
| 3. `yarn workspace @openvaa/docs validate:links` | Exit 0, 0 findings; the gate row `docs-links` is 0 as well. |
| 4. The skill itself re-read | Nothing invalidated. No component was added, removed, renamed or moved, so the measured counts of convention 1 stand; neither `SKILL.md` nor `context-reactivity.md` names the note's reasons or the descriptor's members. |
| 5. `bash .claude/scripts/audit-skill-links.sh components` | Exit 0: 30 checked, 0 dangling. `audit-skill-drift.sh` was not run; item 4 was done by reading. |

### The code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: the keys, the members and the reason exist; nothing reads them yet, by design. |
| OWASP top 10 | Nothing new takes input. The one placeholder is filled by a page with a constituency's name, rendered as text by `t()`; no new value is HTML. |
| Code style guide; no `any` | Followed; none. The red gate run was a breach of the style rule `func-style` in a test, fixed. |
| No repeated code | The test's two readers of the English catalogue share the directory constant; `keysUnder` flattens, `englishMessage` looks one key up. |
| New entities documented | Sixteen TSDoc lines; the prop's TSDoc; the docstring. |
| Repo documentation updated | The generated page is. Two hand-written sentences are now incomplete and are reported below, not edited. |
| Tracking events | None: no function is offered to a user. |
| Svelte component guidelines | No component created; the changed one keeps its shape. |
| Errors handled | Not applicable. |
| Failing checks | The three red rows of the first gate run, fixed and re-run green. |
| Parts sharing dependencies not unduly affected | `NotEditableNoteProps['reason']` is read by the component alone; `EntityDescriptor` gained required members and both entries hold them; build and check-frontend are green. |
| WCAG A and AA; keyboard and screen reader | No surface changed. The 320 px truths of the plan are backstops, proven where the screens are built. |
| Developers' and Publishers' Guides | See *Sentences the work made false*. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before each of the three commits that touch a comment; no history and no ids in a comment or a title. |
| Clean history; no fixes of itself | **Not met**: `90e054d92` fixes `4fe3d66a5`. Left for the ship stack to squash. |
| Formatting changes apart | No formatting-only change. |
| `[db]` | No database change. |

## For plans 177-15 to 177-20

- Read a per-type sentence through `entityDescriptorOf(type).<member>`, never through an `{#if}` on the type. The members and their keys are in `entityDescriptor.ts`; the keys that are the same for both types are read directly.
- The keys that are **not** per type and so have no member: `edit`, `requestedParent`, `elections.noneSelected`, `constituencies.severalKept`, `details.title`, `.ingress`, `.changeSelection`, `.confirmedNote`, `.newNote`, `.previousConstituency`, `.remove`, `.keep`, `.removedNote`, `.removedConfirmedNote`, `parent.unlisted`, `error.parentRequired`, `.duplicateParent`, `.checkCards`, `.saveFailed`, `.changed`, `.hasCandidates`, `.tooManyPending`, and `contestantApp.common.nominationsNotEditableAnswersLocked` (through the note's reason).
- `details.previousConstituency` takes one input, `constituency`.
- **No later plan adds a key.** A string a screen needs that is not here is a finding to report, not a key to add in that plan.
- A per-type key added to `contestantApp.nominations` without a descriptor member fails `entityDescriptor.test.ts`.

## For plan 177-21 — the native-speaker review todo

**330 constructed values: the 55 new keys in each of da, et, fi, fr, lb and sv.** The list is the added lines of `git diff 2a38ee9ac..027614b2d -- apps/frontend/messages/{da,et,fi,fr,lb,sv}`; the keys are the 55 of the contract's table. None was written or checked by a native reader.

Where a reader should look first:

- **lb, all 55.** The least certain locale. In particular: "ee*eng Kandidat*in" in `emptyNoElection.candidate` (the catalogue has the starred noun but no indefinite article before it; the form is mine); "Wahlziedel" for the ballot, "Fakultativ" for optional, "weiderzegoen", "verréckelt" for moved, "derbäigesat" — none has a precedent in the catalogue; "trëtt … un" is reused from the legacy pre-registration title; the n-rule endings throughout. The catalogue writes both "Wahl" and "Wal-" (Walbezierk, Walnummer); each existing word was kept as it stands.
- **et `error.duplicateParent`**: "sama nimekiri" against the legend "Valimiste nimekiri", as said above. **et `parent.none.organization`**: "Puudub".
- **fi**: "Ei vaaliliittoa" for a party's "None"; "äänestyslipussa" for "on the ballot"; `emptyNoElection.*` says "to which a nomination can be defined for a candidate / a party" in place of "in which … can be nominated".
- **sv, da `parent.other.*`**: the agreement by type. **da `details.changeSelection`**: "Ændr det valgte", chosen because "valg" is both a choice and an election.
- **fr**: "Sans étiquette / sans parti"; `hasCandidates` uses "des candidat·es y sont rattaché·es".
- **Every locale**: `requestedParent` and `parent.unlisted`, which were bent away from the English to avoid agreement.

Existing values a native reader may want to see beside the new ones — **not changed by this plan**, reported only: sv `contestantApp.nominations.title` is "Nomineringslistor" where every other sentence says "nominering(ar)"; sv writes "valdistrikt" in `contestantApp.preregister.*` and "valkrets" everywhere else; da `contestantApp.nominations.description.candidate` names "parti eller valgkreds" where the English names the list and the symbol; et `common.electionList` is "Valimiste nimekiri".

## Sentences the work made false, reported and not edited

Neither is in `177-21-INPUTS.md` yet.

1. `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md`, § *The note*: "Its `reason` property selects the sentence: `'answersLocked'` or `'nominationsLocked'`." There are three reasons now. The section's last sentence — which pages show the note — stays true until a page gives the third reason.
2. `apps/frontend/src/lib/contestant/components/README.md`, the row of `NotEditableNote`: "Its `reason` is `'answersLocked'` or `'nominationsLocked'`".

Stale before this plan and further from the tree after it: the docblock of `scripts/assert-i18n-catalog-namespaces.mjs` gives the catalogue as 598 keys, 161 + 121 + 316; it is 704, 254 + 121 + 329. The floors it sets are far below both and still hold.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The descriptor's test failed the lint and both type checks**

- **Found during:** Task 2, the closing gate run.
- **Issue:** `entityDescriptor.test.ts` as committed in `4fe3d66a5` held two helpers written as arrow functions (`func-style`, two errors) and read `ENTITY_DESCRIPTORS[type][member]` with `member` typed `keyof EntityDescriptor`, which the `as const` union does not accept (`imageInfo` is not on the candidate's entry; two errors in `svelte-check`). Vitest strips types, so the tests ran green and I did not run the linter or the type check on the file before committing. The gate run `177-12-close` was red on typecheck, lint and check-frontend.
- **Fix:** the helpers are function declarations (`keysUnder`, `stemsOf`); the two lookups go through a value typed `EntityDescriptor`, as the file's older tests do. `eslint` on the changed files and `yarn workspace @openvaa/frontend check` were run before the commit, both 0; the tests 76 of 76.
- **Files modified:** `apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts`
- **Commit:** `90e054d92`
- **Observed, not inferred:** both causes are the errors the two logs name, and the same rows are 0 on the next head.

### Other deviations

- **A fourth commit**, the fix above; the plan lays out three.
- **The generated component page is committed with the component** though it is not in the plan's `files_modified`; step 4 of Task 2 says to commit what the generator regenerates.
- **The prop's TSDoc lists all three reasons**, not the third alone: a list with one of three values would mislead.
- **The gate label of the green run is `177-12-close-r2`**; the plan's commands name `177-12-close`, which the verdict script resolves to its newest attempt.

## Prohibitions

- **PROH-177-30** (no existing message reworded or removed; no legacy pre-registration key reused or deleted): held. The catalogue diff adds lines only; every base value is unchanged in all seven locales by the proof script; `contestantApp.preregister.json` is not in the diff.
- **PROH-177-31** (no sentence assembled from a fragment and an interpolated noun; one placeholder): held. One new value in each locale carries a placeholder, the constituency's name after a colon.

## Threat Flags

None. No endpoint, auth path, file access or schema change.

## Not done, or not verified

- The three 320 px truths of the plan (no clipping of the copy, the two question titles wrapping, a legend and a hint inside a card) are backstops: no screen renders the copy yet. The longest new values are for the plans that build the screens to meet: `constituencies.ingress.organization` (fr 218 characters, lb 178, et 172) and `contestantApp.common.nominationsNotEditableAnswersLocked` (fr 182).
- No native reader has seen any non-English value.
- `audit-skill-drift.sh` was not run.
- `.planning/WINDOWS.md` was not appended to: there is no stub, skipped test or unrun verify, and the file is shared.

## The state the local stack is left in

Untouched by this plan: no database row, no reset, no E2E run, no dev server. `git status --short` holds `?? CAND-APP-PLAN.md` alone before this file.

## Known Stubs

None. The keys and members nothing reads yet are the plan's own output, read from plan 177-15 on.

## Evidence (gitignored)

- `tests/e2e-runs/177-unit/177-12-t1-verify.{sh,log,exit,head}`, `177-12-t2-verify.{sh,log,exit,head}`
- `tests/e2e-runs/177-unit/177-12-copy-red.{log,exit,head,json}`, `177-12-copy-green.{log,exit,json}`, `177-12-copy-green-2.log`
- `tests/e2e-runs/177-unit/177-12-gates.{log,exit}`, `177-12-gates-r2.{log,exit}`
- `tests/e2e-runs/177-gates/177-12-close/` (red on three rows, kept), `tests/e2e-runs/177-gates/177-12-close-r2/` (green)

## Self-Check: PASSED

- Commits `027614b2d`, `4fe3d66a5`, `b1c1e5c78` and `90e054d92` are ancestors of HEAD.
- `entityDescriptor.ts`, the generated key type, the gate run's `summary.tsv` and the red run's exit file exist.
- `git diff --stat 2a38ee9ac..90e054d92` outside `.planning/`: 21 files, 924 insertions, 8 deletions.
