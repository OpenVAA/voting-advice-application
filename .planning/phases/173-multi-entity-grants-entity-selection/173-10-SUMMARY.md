---
phase: 173-multi-entity-grants-entity-selection
plan: 10
subsystem: frontend
tags: [svelte5, sveltekit, contestant-app, entity-selection, navigation, i18n, a11y, e2e, login-errors]

requires:
  - phase: 173-09
    provides: "`EntityCard`'s `headerOnly`, `showType` and `keepScroll`; `ContactSupport` and `SUPPORT_ANCHOR`; `NothingToEdit`; the eight message keys and the eleven test-id registry entries"
  - phase: 173-08
    provides: the entity pages under `[entityType]/[entityId]`, the root's interim server decision, the resolver, the menu's entity items gated on `selectedEntity`
  - phase: 173-05
    provides: the context's `user`, `entities` and `selectedEntity` accessors, set on the server and on first paint
provides:
  - the app root's three outcomes, decided on the server from the served-filtered list and pinned by unit tests and the read-recording guard
  - screen H, the profile-selection view of the root page, and the "nothing to edit" view rendered there
  - "`userEntityDisplayName` and `userEntityData` (the one string an entity is shown by; a list entry as entity data)"
  - "`groupEntitiesForSelection`, the pure grouping and ordering of the cards"
  - the menu's entity title and the switch item
  - a logout that opens its "data still missing" modal only for a loaded entity
  - the Help page on the shared support block
  - the retirement of the login-error codes `userNoCandidate` and, on the contestant side, `userNotAuthorized`
  - the stage-4 close on one tree, which is also the E2E boundary proof of 173-09
affects: [173-11, 173-12, 173-13, 172, 175, 176, 177, 178, 179]

actuals:
  tokens: 22180 # chars/4 over the realized diff outside .planning/ (88722 chars, 28 files)
  tasks: 4
  commits: 7
plan_head_before: 9ceae76c79ccba86ecaef98319a011076fd1c297
plan_head_after: d309b491dac8690d239de8d282557657e9c31693

tech-stack:
  added: []
  patterns:
    - "a page that needs data objects provides them itself and builds from them only after its own provision of the list it is showing, so an object another page left in the root is never rendered"
    - "a page-style overlay scoped to one view of a page: `pageStyles.push` from an effect that returns the push's own revert"
    - "a server load that returns a view name; the page switches on it and renders nothing when the load names none"
    - "a confirmation that reports on loaded data asks first whether any is loaded"

key-files:
  created:
    - apps/frontend/src/routes/contestant/(protected)/entitySelection.helpers.ts
    - apps/frontend/src/routes/contestant/(protected)/entitySelection.helpers.test.ts
    - apps/frontend/src/routes/contestant/(protected)/page.svelte.test.ts
    - apps/frontend/src/lib/contestant/utils/userEntityDisplayName.ts
    - apps/frontend/src/lib/contestant/utils/userEntityDisplayName.test.ts
    - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte.test.ts
    - .planning/phases/173-multi-entity-grants-entity-selection/deferred-items.md
  modified:
    - apps/frontend/src/routes/contestant/(protected)/+page.server.ts
    - apps/frontend/src/routes/contestant/(protected)/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/page.server.test.ts
    - apps/frontend/src/routes/contestant/(protected)/page.tracking.test.ts
    - apps/frontend/src/routes/contestant/help/+page.svelte
    - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/lib/contestant/utils/loginError.ts
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.error.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md
    - apps/docs/…/components/generated/contestant/components/logoutButton/LogoutButton/+page.md
    - apps/docs/…/components/generated/dynamic-components/navigation/contestant/ContestantNav/+page.md
    - scripts/fixtures/assert-no-candidate-app-names.input.ts
    - tests/tests/utils/testIds.ts
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md

key-decisions:
  - "The logout modal is made to depend on a loaded entity (`userData.savedEntityData`) in `LogoutButton`, not by emptying the context's unanswered lists: the menu and the entity home read those lists on first paint, before the store is loaded."
  - "`userNotAuthorized` leaves the contestant login-error union and map; the shared `error.403` message and the admin side's own code stay."
  - "`userEntityDisplayName` builds a `Candidate` on the data root and reads its `name`, so a project's own name formatter is honoured and the function needs no entity to be provided."
  - "H marks its list as provided by identity of the list it provided; cards are built only for that list."
  - "The group's `contestant-nav-entity-group` id is set only while an entity is selected, on the one group that also holds the home item."
  - "Two findings of the browser probe on Phase 172's terms-of-use view (a 390px overflow that puts the checkbox off-screen; focus on `<body>` after the gate) are filed, not fixed: the view is outside this plan."

requirements-completed: [ENT-01, ENT-02]

duration: 131min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 10: The Root's Screens Summary

**The app root now answers every signed-in user — nothing to edit, your one entity, or choose among several on screen H — the menu names the selected entity and offers the switch, the sign-out code the new view replaces is gone, and stage 4 closed green on one tree (twelve gate rows, 180 of 180 E2E).**

## Performance

- **Duration:** 131 min wall clock, of which about 97 min the host was asleep (18:56:50 to 20:33:53 local)
- **Started:** 2026-10-06T15:35:40Z
- **Completed:** 2026-10-06T17:50:00Z
- **Tasks:** 4
- **Files modified:** 28 outside `.planning/`

## Accomplishments

- The root's load returns `{ view: 'nothingToEdit' }` for no entity, redirects for exactly one, and returns `{ view: 'select' }` for several. It takes `parent` alone from the event and signs nobody out. The view's render landed in the same commit as the removal of the sign-out (PROH-173-06).
- Screen H lists one header-only `EntityCard` per entity through the existing `EntityList`, candidates before organizations, each group by display name, headed only when both types are listed, on a shaded background that belongs to that view alone.
- The menu's entity group is titled with the type and the display name of the entity the URL names; a user with several entities gets the switch item, last in that group, on entity pages only.
- `userNoCandidate` is gone from the union, the map, seven catalogues and the generated key type; `173-verdict.mjs greps` passes on all four literals.
- Log Out on a page with no loaded entity logs out at once, shown by a component case with a negative control and by a browser probe.

## Task Commits

1. **Before Task 1: the logout rule** - `70577bb29` (fix)
2. **Task 1: the root's three outcomes** - `6e750f9f6` (feat)
3. **The regenerated logout-button page** - `5338a683e` (docs)
4. **Task 2: screen H and the Help page on the shared support block** - `b65cb158e` (feat)
5. **Task 3: the retired login-error codes** - `62ed2953c` (refactor)
6. **Task 4: the menu's title and switch item** - `4bf684612` (feat)
7. **Task 4: the close** - `d309b491d` (docs: `## After 173-10` in the name map; three deferred items)

**Plan metadata:** this summary's own commit.

## The root's three outcomes as built

`apps/frontend/src/routes/contestant/(protected)/+page.server.ts`, `load({ parent })`:

| Parent state | Outcome |
|---|---|
| a gate is pending | `{}`; the protected layout shows the gate's view |
| no entity | `{ view: 'nothingToEdit' }` |
| exactly one entity | 307 to `ContestantAppEntityHome` for it |
| several entities | `{ view: 'select' }` |

`page.server.test.ts` holds a gated parent, the empty list, one candidate, one organization, two candidates, a candidate with an organization and three entities, and asserts in every case that the sign-out spy was never called. `page.tracking.test.ts` runs the real load over four parent states and two URLs and asserts no tracked `url` read, no param read and that `parent` is the only event member taken. Negative control, made and reverted: with `void url.pathname; void params.entityId;` added to the real load, all eight cases failed.

The page renders `<NothingToEdit />` and nothing else for the first view, H for the second, and nothing when the load names no view. A user with nothing to edit passes the terms-of-use gate first, as ruling 5 says.

## How H provides and reads its entities

- An effect of the page, for the `select` view only, reads `contestantCtx.entities` and calls `setDataRoot((dr) => dr.update(() => dr.provideEntityData(entities.map(userEntityData))))`, then records which list it provided. A throw is caught and recorded as a failed provision.
- The cards are a `$derived.by` that reads `contestantCtx.entities`, `contestantCtx.locale` and `contestantCtx.dataRoot.getEntity(type, id)` directly, no alias and no destructured accessor (PROH-173-10). Until the recorded list is the current one it yields `loading`; a failed provision or an entity the root cannot resolve yields `error`.
- So title and ingress render on the server and on first paint, the list region shows `Loading` until the effect has run, and no card is built from an object another page left in the root. `page.svelte.test.ts` seeds the root with stale objects of the same ids and finds the loading state and no card before the effect, then the fresh names.
- `provideEntityData` was measured not to reset the entity collections (`provideData` sets by id); the plan and the method's docblock say it does. H is correct either way.
- Card props: `entity`, `variant: 'list'`, `action: getRoute.current({ route: 'ContestantAppEntityHome', entityType, entityId })`, `headerOnly: true`, `showType: true`, `keepScroll: false`. No `aria-label`, no `view-transition-name`, nothing written to storage, no notice of any kind (PROH-173-09, PROH-173-16).
- The background is `pageStyles.push({ drawer: { background: 'bg-base-300' } })` from an effect that returns the revert. `pageStyles.push` exists, as the UI contract writes it; the name map's item 10 said otherwise and item 61 corrects it.

## What was done with `userNotAuthorized`

Removed from the contestant union and map: the population showed no producer in the Contestant App. Its message key is the shared `error.403`, read by the admin side's own map, so no message was removed. The admin population is unchanged (`lib/admin/utils/loginError.ts`, `routes/admin/(protected)/+layout.ts`).

## The recorded limitation of U-09

No entity name is shown on the questions, question-editor and settings pages. It is in the menu's group title, one tap away. A user editing for two candidates can work a whole session on the wrong one without an on-page cue; a wrong-entity save is impossible, a wrong-entity session is not.

## Ready for Phases 176 to 179 (obligation O-10)

- **The card list.** `EntityList` with header-only cards is reused as it is; nothing in it navigates on its own. A selector of Phase 177 passes each card `action: (e: MouseEvent) => void` (the card's `CardAction` already admits a handler, or `false`) instead of a URL, with `headerOnly` and `showType` as here; `keepScroll` matters only for a link. `groupEntitiesForSelection` is structural and takes any `{ type, id }`, but its group order names candidates and organizations only.
- **The support block.** `ContactSupport` (`action: 'help'` by default, `'email'` on the Help page) and `NothingToEdit` (`title`, `children`) are rendered by a page each now, so Phase 178 and Phase 179 reuse parts that a browser has shown.
- **The display name.** `userEntityDisplayName(entity, dataRoot)` is the one string for a card title, the sort order and the menu.

## Gates

| Instrument | Run directory | Exit | Result |
|---|---|---|---|
| gate set | `tests/e2e-runs/173-gates/173-10-screens` | 0 | twelve rows, every status 0; window 20:36:03 to 20:39:29; no Sleep entry |
| E2E, full default suite | `tests/e2e-runs/173-e2e/173-10-screens` | 0 | total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0; 100 projects; window 20:39:45 to 20:45:23; no Sleep entry |

- `173-verdict.mjs gates 173-10-screens`: exit 0. `… e2e 173-10-screens --min-total-of 173-01-baseline`: exit 0. `… e2e 173-10-screens --same-projects-as 173-01-baseline`: exit 0 (100 projects, every total equal). `… greps`: exit 0.
- Both instruments record head `4bf684612` and were first attempts; no `-r2` exists. Both ran on battery under `caffeinate -dimsu` with the lid open.
- Frontend unit tests 2546 passed and 7 skipped in 159 files and 1 skipped file (2497 and 7 in 155). svelte-check 2708 files, 0 errors, 0 warnings. pgTAP 38 files, 1447 tests.
- The plan added no E2E test, so the expected total is the baseline's 180.
- Lint and typecheck were green at every commit boundary (run before each commit; exit 0 each time, after one lint failure caught before Task 2's commit and fixed in the working tree).
- After the close: `yarn db:seed:default` exit 0 (328 candidates, 8 organizations, 2 auth users, 2 grants); `yarn db:status` exit 0; the three Edge Functions answer (401 without a token); `170-allowlist-probe.sh after` exit 0; nothing listens on 5173 or 5273.

## The boundary proof of 173-09

This run is it. Every voter project is green at its baseline count, so cards with match scores, sub-matches, party sub-cards and the alliance summary, which 173-09's unit comparison did not mount, behave as before the three props. Both a11y scan families are green, the Help page with `ContactSupport` among them. No failure pointed back to 173-09 and none to this plan: there was no failure.

## The browser probe

No test identity has zero or several entities before 173-12, so a one-off probe was made: a scratch Playwright script (in the session's scratch directory, never in the tree), a dev server on the default project started and stopped for it, and the seeded user `candidate@openvaa.test` given two temporary editor grants (a second candidate and an organization of the default dataset). It ran 20:34:42 to 20:34:57 local with no Sleep entry in its window. Two earlier attempts spanned a host sleep and are void.

Shown: the gate before the selection view; H with its title, two headed groups in order, type labels, links without the keep-scroll attribute, the shaded drawer and no horizontal scroll at 390px; a card leading to the entity home with focus on its `<h1>` at scroll 0; the menu's title ("party: Blue Coalition") and the switch item last; the switch closing the drawer and landing on H with focus on its `<h1>` and the cards provided again; a second entity's home and profile showing that entity after the first, with no error view; the Help page's block inside `#support`; and, with every grant deleted mid-session, an entity URL ending on the "nothing to edit" view with focus on its `<h1>`, the signed-in email, two 44px actions, and a Log Out that opened no dialog and ended on the login page.

Cleaned up and verified by query: the two temporary grants are gone, the seeded grant was restored, the user count is unchanged; the gate set then reset the database and the default dataset was seeded again. The probe ticked the terms of use for the seeded user, which the reset undid.

Not shown by it: whether the unanswered lists were non-empty on the view (the component case and its negative control carry that); 320px; the dark theme; other locales; the native confirm on a switch out of an editor; drafts per entity across a switch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Log Out would open the "data still missing" modal with no entity loaded**
- **Found during:** Task 1 (before the view went live)
- **Issue:** with no saved entity data the context's two unanswered lists hold every question, and `LogoutButton` opened its modal whenever either was non-empty.
- **Fix:** the modal opens only when `userData.savedEntityData` is set. The lists are unchanged, since the menu and the entity home read them on first paint.
- **Files modified:** `LogoutButton.svelte`, new `LogoutButton.svelte.test.ts` (four cases; with the check removed the first case fails), the generated component page
- **Commits:** `70577bb29`, `5338a683e`
- **Not in the plan's file list:** three files.

**2. [Rule 3 - Blocking] Lint rejected three arrow-function variables in the new tests**
- **Found during:** Task 2, before its commit
- **Fix:** function declarations; the fake provision became a mode flag.
- **Commit:** `b65cb158e`

### Where the plan and the tree differ

**3. `userEntityDisplayName.ts` exports two functions.** `userEntityData` is beside it: the display name builds a `Candidate` from it, and H provides with it.

**4. `pageStyles.push` is the call, as the UI contract says.** The dispatch note and name-map item 10 say it does not exist; it does.

**5. `provideEntityData` does not reset the entity collections.** Recorded as name-map item 62.

**6. The docs page already had no mention of the retired code.** It gained the sentence on the root's three outcomes; the sentence that said a user without exactly one entity is signed out at the root was corrected.

**7. The group's test id is conditional.** One `NavGroup` holds the home item and the entity items, as before; it carries `contestant-nav-entity-group` and its title only while an entity is selected.

**8. Commits were made on `feat/entity-signup-multi-grant`,** as the orchestrator's standing notes direct and as plans 01 to 09 did; the executor protocol's per-agent branch check does not describe this tree.

**9. `.planning/STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched,** by the dispatch's instruction.

## Deferred Issues

Filed in `deferred-items.md`, none fixed:

1. **The terms-of-use gate view overflows a 390px viewport and its checkbox sits left of the viewport** (measured: `scrollWidth` 483 against 390, the checkbox at x = -93; none at 1280px). Phase 172's view; no file of it is in this plan's diff. Cause not diagnosed.
2. **Passing the gate leaves focus on `<body>`**, because the gate continues with `invalidateAll()`. It predates this plan for a gated user on an entity URL; this plan adds the users who stay on the root.
3. **`Error formatting nomination: … Child in collection elections … not found`** is logged three times in the dev-server log of this run and of `173-07-split` and `173-08-move-r2`. Not new, not diagnosed.

## Known Stubs

None.

## Threat model

| Threat | Disposition | As built |
|---|---|---|
| T-173-39 | mitigate | the cards come from `contestantCtx.entities`, the caller's own served-filtered list; the probe's revoked-grant URL ended on the root |
| T-173-40 | mitigate | both views render from the list and the view name alone; nothing reads the request that led there; the page test asserts no storage write |
| T-173-41 | mitigate | the view's only link is the support block (asserted in 173-09's case); the menu showed the home item alone on Help in the probe |
| T-173-42 | mitigate | typecheck green after both union members left; catalogue parity and the fourth closing search pass |
| T-173-43 | accept | `headerOnly` cards; `confirmed` is not passed to the data root at all |

No new security surface beyond the plan's model.

## What 173-11, 173-12 and 173-13 must know

- **173-11:** the root no longer signs out a user with zero or several entities, so an organization editor in a candidates-only project lands on the "nothing to edit" view. The pre-existing `Error formatting nomination` line is in every run's dev-server log.
- **173-12:** the views' ids are rendered now (`contestant-nothing-to-edit`, `…-email`, `…-logout`, `contestant-entity-selection-list`, `…-group`, `…-group-heading`, `contestant-nav-entity-group`, `contestant-nav-switch-entity`, `contestant-contact-support`). H shows `Loading` on the first client frame of every visit, so wait for a card before counting. Do not assert focus right after accepting the terms, and do not run the gate at a phone width, until the two deferred items are fixed. A locator by the prefix `contestant-nav-` now also matches the group's `<section>`. The expected display order is candidates then organizations, by `localeCompare` at base sensitivity in the page's locale, id as tie-break.
- **173-13:** the docs page on login already describes the three outcomes; the README pass can cite `userEntityDisplayName` and the root's views. Items 61 to 67 of the name map are this plan's.
- **Phase 172's owner:** the two deferred items on the terms-of-use view.

## Self-Check: PASSED
