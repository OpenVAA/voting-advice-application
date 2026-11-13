---
phase: 173-multi-entity-grants-entity-selection
plan: 09
subsystem: frontend
tags: [svelte5, components, entity-card, i18n, paraglide, contestant-app, test-ids, a11y, docs]

requires:
  - phase: 173-08
    provides: the entity pages under `[entityType]/[entityId]`, the app root's server decision, the menu's entity items gated on `selectedEntity`
  - phase: 173-05
    provides: the context's `user`, `entities` and `selectedEntity` accessors, set on the server and on first paint
  - phase: 173-07
    provides: the context's `homeRoute`; Help and Privacy outside the entity tree
provides:
  - three additive, default-off props on `EntityCard` (`headerOnly`, `showType`, `keepScroll`) and the rendered test id `entity-card-type`
  - the reusable support block `ContactSupport`, its props type `ContactSupportProps` and the constant `SUPPORT_ANCHOR`
  - the reusable full view `NothingToEdit` and its props type `NothingToEditProps`
  - two message namespaces, `contestantApp.entitySelection` and `contestantApp.nothingToEdit`, eight keys in seven locales, registered and typed
  - eleven test-id registry entries for the profile selection screen, the nothing-to-edit view, the support block, the menu's entity group and switch item, and the entity card
  - a catalogue test that names the eight keys with their parameters in every locale
affects: [173-10, 173-11, 173-12, 173-13, 175, 176, 177, 178, 179]

actuals:
  tokens: 16700 # chars/4 over the realized diff outside .planning/ (66623 chars, 34 files)
  tasks: 4
  commits: 6
plan_head_before: 45fd21c53d0c13ff4224c553d4df7016e8bb65a7
plan_head_after: c92e101e9321ffd6784e72360258fda9f92efeaf

tech-stack:
  added: []
  patterns:
    - "a shared component grows by default-off booleans beside its locked variant, each held by a component case that also pins the default"
    - "a full-view component renders its own `MainContent`, so a page shows a whole screen with one tag"
    - "a reactive context accessor faked as rune state behind a getter in a `.svelte.test.ts`, replaced after mount, to show a component reads it inside the tracking scope"
    - "new message keys named in the catalogue test with their parameters, since key parity alone does not read values"

key-files:
  created:
    - apps/frontend/src/lib/dynamic-components/entityCard/tests/EntityCard.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte
    - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts
    - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/contactSupport/index.ts
    - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte
    - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.type.ts
    - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/nothingToEdit/index.ts
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.entitySelection.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.nothingToEdit.json
    - .planning/todos/pending/2026-10-06-native-speaker-review-profile-selection-strings.md
  modified:
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.type.ts
    - apps/frontend/project.inlang/settings.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - tests/tests/utils/testIds.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md
    - .claude/skills/components/SKILL.md

key-decisions:
  - "The Help page was left as it is, as the plan's ruling 3 and its acceptance check say (no route renders `ContactSupport`); the dispatch note said the page adopts the block here. 173-10 Task 2 owns that change and the removal of the old test id."
  - "`SUPPORT_ANCHOR` is declared in `ContactSupport.type.ts` and exported by the barrel, so the component does not import its own barrel."
  - "`headerOnly` leaves the card's `<header>` whole, the match score included, and keeps a caller's `children`; it drops the alliance summary, sub-matches, featured questions and sub-cards, and skips their lookups."
  - "The keep-scroll attribute keeps the value it rendered before (`true`), so the default link is unchanged to the byte."
  - "The catalogue test gained one block naming the eight keys and their parameters, because it compared key sets only; no catalogue-wide parameter rule was added, since one existing translation legitimately uses fewer parameters than English."
  - "The six constructed translations are filed in a sibling of the Phase 171 review todo, not appended to it: that todo is about the app's names."

patterns-established:
  - "`git add` a new component's files before `yarn workspace @openvaa/docs generate:docs`: the link check reads tracked files only."
  - "Run `node scripts/assert-comment-hygiene.mjs` before committing a new comment; ESLint, Prettier and svelte-check do not run it."

requirements-completed: []

coverage:
  - id: D1
    description: "`EntityCard` renders a header-only card that makes no question lookup, shows its type label inside the element it is described by, and can drop the keep-scroll attribute from a link action; with none of the three props a card renders as before"
    requirement: ENT-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/dynamic-components/entityCard/tests/EntityCard.svelte.test.ts (11 cases)"
        status: pass
      - kind: other
        ref: "twelve default cards mounted before and after the change; elements, attributes and text equal (see ## The default card)"
        status: pass
    human_judgment: false
  - id: D2
    description: "`ContactSupport` links to Help#support by default and opens an email to the configured address when asked; one component, one test id"
    requirement: ENT-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts (4 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "`NothingToEdit` says there is nothing to edit, shows the signed-in email verbatim under its label (never hyphenated, never translated, absent as a whole without an email), and offers the support block and Logout and no other link"
    requirement: ENT-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte.test.ts (11 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Eight strings in seven locales with identical key sets and parameters, registered with inlang and typed"
    requirement: ENT-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/i18n/tests/translations.test.ts (380 cases)"
        status: pass
      - kind: other
        ref: "yarn assert:i18n-catalog-namespaces (in the lint row)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The six non-English translations read correctly to a native speaker"
    verification: []
    human_judgment: true
    rationale: "The translations were constructed from each catalogue's existing terms and have not been read by a native speaker; filed in .planning/todos/pending/2026-10-06-native-speaker-review-profile-selection-strings.md"
  - id: D6
    description: "Button labels wrap inside full-width buttons in every locale and neither button drops below 44px; the view does not scroll horizontally at 320px"
    verification: []
    human_judgment: true
    rationale: "A backstop truth of the plan: no page renders the view yet, and jsdom computes no layout. The buttons are the existing `Button` and `LogoutButton`; the axe scans of 173-13 and a look at the screen in 173-10 are the first chance to see it."

duration: 19min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 09: The parts of the profile selection and nothing-to-edit screens Summary

**`EntityCard` can render a question-free header with a type label and a link that opens another page at the top; `ContactSupport` and `NothingToEdit` exist as tested components that no page renders yet; eight strings ship in seven locales and eleven locators are registered, on five green gate rows (`173-09-parts`), with the full E2E run that closes 173-10 as the boundary proof.**

`requirements-completed` is empty on purpose: the plan's requirement is ENT-01, this plan builds its parts only, and the orchestrator owns `REQUIREMENTS.md`.

## Performance

- **Started:** 2026-10-06T15:12:06Z
- **Completed:** 2026-10-06T15:31Z
- **Tasks:** 4 of 4
- **Files changed outside `.planning/`:** 34 (25 added, 9 modified); 1038 insertions, 12 deletions
- **Commits:** 6 on `45fd21c53..c92e101e9`, measured with `git rev-list --count`; the commit of this summary is the seventh

## Accomplishments

- `EntityCard` has `headerOnly`, `showType` and `keepScroll`, all default off, with eleven component cases, two of them controls: a default card over a data root that has not loaded the question throws, and the same card with `headerOnly` renders.
- `ContactSupport` is one block with one test id: a link to the Help page's support section by default, an email to the configured address when asked.
- `NothingToEdit` is a whole view in one tag: title, explanation, the signed-in email as a label and value, next steps, the support block as the main action and Logout below it.
- Eight strings exist in `da`, `en`, `et`, `fi`, `fr`, `lb` and `sv`, registered, typed, and held to their keys and parameters by the catalogue test.
- Eleven test ids are in the registry; nothing was removed.

## Task Commits

1. **Task 1: the card's three props** - `7e8ad0158` (feat) and `e0826df94` (style: the header-only comment moved above the condition it explains; see deviation 3)
2. **Task 2: the strings and the registry** - `826374603` (feat: fourteen message files, the inlang registration, the regenerated key type, the catalogue test) and `08a2af622` (test: the registry)
3. **Task 3: the two components** - `362977538` (feat: both components with their tests, the regenerated component listing and pages, the components skill's counts)
4. **Task 4: the close** - `c92e101e9` (docs: `## After 173-09` in the name map; the review todo)

## The exact names

| What | Name |
|---|---|
| Card props | `headerOnly?: boolean` (`@default false`), `showType?: boolean` (`@default false`), `keepScroll?: boolean` (`@default true`) |
| Card type label | `data-testid="entity-card-type"`, class `small-label`, first child of the subtitle element, text `t('common.<type>.singular')` |
| Support block | `ContactSupport`, `ContactSupportProps` (`children`, `action: 'help' \| 'email'`, `variant`), `SUPPORT_ANCHOR = 'support'`; import from `$contestant/components/contactSupport` |
| View | `NothingToEdit`, `NothingToEditProps` (`title`, `children`); import from `$contestant/components/nothingToEdit` |

### The eight keys

| Key | English |
|---|---|
| `contestantApp.entitySelection.title` | Choose a Profile to Edit |
| `contestantApp.entitySelection.ingress` | You can edit more than one profile. Choose the one you want to work on now. You can switch to another one at any time from the menu. |
| `contestantApp.entitySelection.switch` | Switch profile |
| `contestantApp.entitySelection.current` | {entityType}: {name} |
| `contestantApp.nothingToEdit.title` | Nothing to Edit Here |
| `contestantApp.nothingToEdit.content` | Your user account is not connected to any profile in this application, so there is nothing for you to edit. |
| `contestantApp.nothingToEdit.signedInAs` | Signed in as |
| `contestantApp.nothingToEdit.nextSteps` | If you registered with another email address, log out and sign in with that address. Otherwise, contact support and tell them the address shown above. |

The word each other locale uses for "profile", taken from its own catalogue (`contestantApp.basicInfo.title`, `contestantApp.home.preview`): da *profil*, et *profiil*, fi *profiili*, fr *profil*, lb *Profil*, sv *profil*. No value holds a word for "entity"; `git grep -n -i -w "entity"` over the fourteen files prints nothing. In `current` the fr value has a space before the colon, as elsewhere in its catalogue; the other six read `{entityType}: {name}`. The full constructed text is in the review todo.

### The eleven registry entries (`tests/tests/utils/testIds.ts`)

| Registry path | Value |
|---|---|
| `contestant.common.contactSupport` | `contestant-contact-support` |
| `contestant.entitySelection.list` | `contestant-entity-selection-list` |
| `contestant.entitySelection.group` | `contestant-entity-selection-group` |
| `contestant.entitySelection.groupHeading` | `contestant-entity-selection-group-heading` |
| `contestant.nothingToEdit.container` | `contestant-nothing-to-edit` |
| `contestant.nothingToEdit.email` | `contestant-nothing-to-edit-email` |
| `contestant.nothingToEdit.logout` | `contestant-nothing-to-edit-logout` |
| `contestant.nav.entityGroup` | `contestant-nav-entity-group` |
| `contestant.nav.switchEntity` | `contestant-nav-switch-entity` |
| `voter.results.cardType` | `entity-card-type` |
| `voter.results.cardAction` | `entity-card-action` |

The two entity-card ids are beside the existing `card` and `cardTitle`, in the group that held them. `contestant.help.contactSupport` (`contestant-help-contact-support`) is still registered and still rendered by the Help page; the page and the registry line are its only two readers (`git grep -n "contestant-help-contact-support" -- apps tests`).

### How `LogoutButton` is called in the view

`<LogoutButton variant="normal" icon={undefined} data-testid="contestant-nothing-to-edit-logout" />`, the call the entity home makes with its own test id, placed directly in `MainContent`'s `primaryActions` snippet after `<ContactSupport variant="main" />`. The button signs out through the context's `logout`. There is no header logout button.

## The default card

Every existing use of `EntityCard` passes none of the three props. Twelve such cards were mounted on `45fd21c53` and again on the changed component, over settings whose card contents name `submatches`, two question entries and `children`: a candidate as a list card with the default action, a URL action, a handler action and `false`; with `showElection`; as `details`; as a `subcard` with and without a URL; an organization as a list card and as `details`; an alliance; a list card with a caller's class and attribute.

- With comments and the whitespace between elements removed, all twelve are equal: every element, attribute, attribute value and text.
- The raw markup of the two subcards is equal as well. The other ten gain one empty comment node, the anchor of the new `{#if showType}` block, and one whitespace-only text node inside the subtitle's grid container, where neither is rendered. So the markup is not identical to the byte; what a browser lays out and what a locator or a screen reader sees is.
- The keep-scroll attribute keeps the value it had, `data-sveltekit-noscroll="true"`.
- What the twelve did not cover: an entity wrapped in a nomination or a match. The fake entities are plain objects, so a card with a match score and sub-matches, a party card with its candidates' sub-cards and an alliance card with its summary were not mounted. Their conditions gained `!headerOnly` and nothing else; the voter specs of 173-10's full run are the first to render them.

The comparison was made with a throwaway test file that is not on the tree; the permanent cases pin the default link attribute, the absent type label and the question lookup.

## Accepted compiler warnings

None. svelte-check: 0 errors, 0 warnings; no `svelte-warning: accepted` or `svelte-ignore` was added.

## Gates

`tests/e2e-runs/173-gates/173-09-parts`, driver exit 0, on tree `e0826df94` (the last commit outside `.planning/`). Window 18:27:23 to 18:29:46 local, on battery under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 45 |
| unit | 0 | 67 |
| check-frontend | 0 | 9 |
| docs-links | 0 | 1 |

`node …/173-verdict.mjs gates 173-09-parts --rows typecheck,lint,unit,check-frontend,docs-links` exits 0: five rows expected (the named subset), five recorded, not stale. This is a subset and was judged as one. It is not the gate set: `build`, `format` (the changed files were checked with Prettier one by one, all clean), the four database rows and the name gate's self-test did not run, and no database was reset.

Frontend unit tests: 2497 passed and 7 skipped in 155 files and 1 skipped file (2445 and 7 in 152). svelte-check: 2703 files, 0 errors, 0 warnings.

The task checks, each read from `$?`: `vitest run EntityCard hoverShadedRule` 0 (13 tests); `vitest run translations` 0 (380); `yarn assert:i18n-catalog-namespaces` 0 (605 keys, `contestantApp.*` 167); `yarn workspace @openvaa/frontend typecheck` 0; `yarn typecheck:tests` 0; `vitest run ContactSupport NothingToEdit` 0 (15); `yarn workspace @openvaa/frontend check` 0; `yarn workspace @openvaa/docs validate:links --check` 0; `bash .claude/scripts/audit-skill-links.sh components` 0 (28 checked, 0 dangling). `git grep -n -F "<NothingToEdit" -- apps/frontend/src/routes` and the same for `<ContactSupport` print nothing.

One negative control was run by hand and reverted: with the sv value of `current` reduced to `{name}`, `vitest run translations` exits 1 on the new block.

## The boundary proof

**No E2E run was made for this plan, and no run directory exists for it.** The proof that nothing an existing user sees has changed is the full E2E run that closes 173-10. A failure in that run points back here when it is in a surface 173-10 did not touch:

- a voter spec failing on an entity card: its featured questions, its match score or sub-matches, a party's candidate sub-cards, an alliance's summary, the link target, or the scroll position after opening an entity from the results list (the keep-scroll attribute);
- a type label on a card that did not ask for one (results list, entity details header);
- a raw message key on a page, or a catalogue-parity finding in the scan's raw-key gate;
- the Help page's support button, when the failure is inside `ContactSupport` and not in how the page uses it (the a11y scan and the journey both reach Help);
- an axe finding inside `NothingToEdit` or `ContactSupport` themselves: heading order, the `<dl>`, contrast of the `small-label` or of the two buttons.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The catalogue test did not compare parameters between locales**
- **Found during:** Task 2
- **Issue:** The plan's acceptance check says the parameter set of `current` is "asserted by `translations.test.ts`". The test compared key sets and file sets only, so a translation that dropped or renamed a parameter would pass and render the braces.
- **Fix:** One block that names the eight new keys with their parameters and holds every locale to exactly those. No catalogue-wide rule: `sv` `questions.intro.start` uses no `{numQuestions}` where English does, which reads as a translator's choice.
- **Files modified:** `apps/frontend/src/lib/i18n/tests/translations.test.ts` (not in the plan's file list)
- **Commit:** `826374603`

**2. [Rule 3 - Blocking] The catalogue test stated 47 message files per locale**
- **Found during:** Task 2
- **Issue:** Two new namespace files per locale make 49.
- **Fix:** The stated count and the test's title.
- **Files modified:** `apps/frontend/src/lib/i18n/tests/translations.test.ts`
- **Commit:** `826374603`

**3. [Rule 1 - Bug] Task 1's commit left the comment-hygiene guard red**
- **Found during:** Task 3, when the guard was run on its own
- **Issue:** `7e8ad0158` put the header-only comment under an existing comment line that has no closing punctuation; the guard reads that as one comment broken over two lines. Typecheck, svelte-check, ESLint and Prettier were green at that commit; `yarn lint:check` would not have been. So the rule "lint green at every commit" does not hold for `7e8ad0158`, `826374603`, `08a2af622` and `362977538`; typecheck was green at each.
- **Fix:** The comment moved above the condition it explains.
- **Files modified:** `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte`
- **Commit:** `e0826df94`

**4. [Rule 3 - Blocking] `generate:docs` exited 1 on the new components**
- **Found during:** Task 3
- **Issue:** The generator's link check reads tracked files only and found the two new components and their type files "not a tracked file"; it stopped before its formatter and left fifty tracked files modified (the listing, `navigation.config.ts`, the route map and 47 component pages), unformatted.
- **Fix:** `git add` the eight new files, run the generator again: exit 0, and the diff is the listing (two entries, total 105), the two new pages and the three new property lines of the card's page.
- **Commit:** `362977538`

### Where the plan and the dispatch note differ

**5. The Help page was not changed.** The dispatch note says the Help page adopts `ContactSupport` and the shared test id replaces `contestant-help-contact-support` in this plan. The plan says the opposite in three places (ruling 3, "Remove nothing in this plan" in Task 2, and Task 3's check that no route renders `<ContactSupport`), and 173-10 lists the Help page in its files and gives the change as its Task 2 step 9. The plan was followed. Until 173-10, the `#support` fragment the `'help'` action links to names no element on the Help page, and nothing links to it.

### Read as the plan's intent

**6. `SUPPORT_ANCHOR` is declared in `ContactSupport.type.ts`** and exported by `index.ts` by name, so that the component can use it without importing its own barrel. The plan says the barrel exports it; it does.

**7. The card's generated docs page changed in Task 3's commit, not Task 1's.** The docs generator is a step of Task 3; Task 1's file list holds three files and its check is that the commit lists those three alone.

**8. The six constructed translations were filed in a new todo**, `.planning/todos/pending/2026-10-06-native-speaker-review-profile-selection-strings.md`, a sibling of the Phase 171 todo. The plan says they are filed for review in 173-13; the dispatch note asked for it here.

**9. The components skill's `concatClass` count was re-measured to 61 and 68.** The skill stated 60 and 66; the tree before this plan measured 60 and 67, so one of the two was already off by one.

**10. The pre-commit branch check of the executor protocol does not fit this run.** It allows commits in a worktree only on an `agent-*` branch; this worktree is on `feat/entity-signup-multi-grant` by the orchestrator's arrangement, and the earlier plans of the phase were committed there. Commits were made on that branch.

## Known Stubs

None in the two components. Two things are deliberately unused until 173-10: the four `contestantApp.entitySelection.*` messages are read by no component, and five registry entries (`entitySelection.*`, `nav.entityGroup`, `nav.switchEntity`) name ids nothing renders yet.

## Threat model

| Threat | How it is held |
|---|---|
| T-173-35 (the email rendered as markup, hyphenated or translated) | A text expression in a `<dd>`; `hyphens-none`, `translate="no"`; cases assert the verbatim value, both safeguards and that an address holding `<b>` renders as text |
| T-173-36 (the support link pointing elsewhere) | `'help'` is `getRoute.current('ContestantAppHelp')` plus a constant fragment; `'email'` is the configured `admin.email` and a fixed subject; no user input in either |
| T-173-37 (a default-off prop changing every card) | The default cases, and the twelve-card comparison above; the voter specs in 173-10's full run |
| T-173-38 (the wrong user's email) | Read from the context's `user`, never a prop; a case replaces the user after mount and the page follows; without an email nothing is rendered |

No new network endpoint, auth path, file access or schema change.

## Prohibitions

- **PROH-173-10** holds: `NothingToEdit` destructures `t` alone and reads `contestantCtx.user?.email` in its markup. The case "follows the context when the signed-in user changes" would fail on a destructured or copied value.
- **PROH-173-15** holds: no value says "entity" in any locale, and each of the eight keys is in all seven.

## What 173-10 must know

1. **The Help page is yours** (deviation 5): `<ContactSupport action="email" id={SUPPORT_ANCHOR} class="mt-lg" />`, then remove `contestant.help.contactSupport` from the registry. Its two readers are the page and the registry line.
2. **The logout modal off an entity.** `LogoutButton` opens its "data still missing" modal when the context's `unansweredOpinionQuestions` or `unansweredRequiredInfoQuestions` is not empty, and with no saved entity data those are all of the context's opinion questions and required info questions. `NothingToEdit`'s cases fake both as empty. Your must-have on logout without the modal has to be shown in a browser, for a user with no entity and for a user who came back from one.
3. **A card on the selection screen** takes `variant: 'list'`, `action: <entity home URL>`, `headerOnly: true`, `showType: true`, `keepScroll: false`. The type label reads `common.<type>.singular` through the context's `t`. A header-only card still renders a match score and a caller's `children` if it is given either.
4. **`NothingToEdit` takes no email prop.** It reads `contestantCtx.user?.email`, which the user-level load sets on the server. It builds one route, Help, and no entity route, so it renders on a page whose URL names no entity.
5. **Nothing reads `contestantApp.entitySelection.*` yet.** The catalogue test will fail if a locale's `current` loses `{entityType}` or `{name}`. Retiring `userNoCandidate` removes a key and no file, so the stated 49 files per locale stays.
6. **Before `generate:docs`, `git add` any new component files** (deviation 4), and run `node scripts/assert-comment-hygiene.mjs` before committing a new comment (deviation 3).
7. **Your full run is the first to render** a card with a match, a party card with sub-cards and an alliance card on the changed component, and the first gate set with `build` and `format` since this plan.
8. Item 47 of the name map still holds: this plan did not edit the context.

## Self-Check: PASSED

- Created files exist: the two component directories (four files each), `EntityCard.svelte.test.ts`, fourteen message files, the two generated component pages, the review todo.
- Commits are ancestors of HEAD: `7e8ad0158`, `826374603`, `08a2af622`, `362977538`, `e0826df94`, `c92e101e9`.
- `## After 173-09` is in the name map, before its last section.
- No dev server is listening on 5173 or 5273; the Supabase stack was not touched; `CAND-APP-PLAN.md` is untouched and untracked.
