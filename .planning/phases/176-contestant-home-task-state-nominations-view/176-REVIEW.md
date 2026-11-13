---
phase: 176-contestant-home-task-state-nominations-view
reviewed: 2026-10-22T19:59:33Z
depth: standard
files_reviewed: 105
files_reviewed_list:
  - apps/docs/src/lib/navigation.config.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte
  - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts
  - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
  - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/notEditableNote/index.ts
  - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte
  - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts
  - apps/frontend/src/lib/contestant/tasks/index.ts
  - apps/frontend/src/lib/contestant/tasks/taskState.test.ts
  - apps/frontend/src/lib/contestant/tasks/taskState.ts
  - apps/frontend/src/lib/contestant/tasks/unanswered.test.ts
  - apps/frontend/src/lib/contestant/tasks/unanswered.ts
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
  - apps/frontend/src/lib/contestant/utils/loginError.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
  - apps/frontend/src/lib/i18n/tests/translations.test.ts
  - apps/frontend/src/lib/routes/route.test.ts
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/routes/routeConsistency.test.ts
  - apps/frontend/src/lib/server/contestant/previewGate.test.ts
  - apps/frontend/src/lib/server/contestant/previewGate.ts
  - apps/frontend/src/lib/server/contestant/signOutToLogin.test.ts
  - apps/frontend/src/params/contestantEntityPage.test.ts
  - apps/frontend/src/params/contestantEntityPage.ts
  - 'apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.server.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/+layout.server.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/layout.server.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/layout.tracking.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.server.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.svelte.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.tracking.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/page.svelte.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+layout.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+page.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/layout.svelte.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.server.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/page.svelte.test.ts'
  - 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts'
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/42-entity-nominations.test.sql
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-allow-open.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-hero.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
  - scripts/assert-a11y-scan-wiring.mjs
  - scripts/assert-project-scoped-queries.mjs
  - tests/playwright.config.ts
  - tests/tests/fixtures/contestant/contestant-journey.ts
  - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
  - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts
  - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantNoQuestionsPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
  - tests/tests/fixtures/contestant/notEditableNote.fixture.ts
  - tests/tests/fixtures/contestant/perm-no-nomination.ts
  - tests/tests/fixtures/contestant/perm-organization-editing.ts
  - tests/tests/fixtures/shared/navMenu.fixture.ts
  - tests/tests/setup/perm/perm-no-nomination.setup.ts
  - tests/tests/setup/perm/perm-no-nomination.teardown.ts
  - tests/tests/setup/shared/registerAndStoreSession.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/perm/perm-answers-locked.spec.ts
  - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/specs/perm/perm-no-nomination.spec.ts
  - tests/tests/specs/perm/perm-organization-editing.spec.ts
  - tests/tests/utils/contestantEntityUrl.test.ts
  - tests/tests/utils/permNoNominationData.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 176: Code Review Report

**Reviewed:** 2026-10-22T19:59:33Z
**Depth:** standard
**Files Reviewed:** 105
**Status:** issues_found

## Summary

This is a retroactive review of the code at HEAD. It concentrates on what the phase's own commits (`(176-NN)`) introduced since `abb5e1ddc`:

- the pure task state (`taskState.ts`, `unanswered.ts`)
- the context's `#taskState` derivation
- the `get_entity_nominations` RPC, its narrowing and the writer's read
- the `(nominated)` route-group gate and the server-side preview gate
- the nominations view, the home task list and the menu's closed items
- the logout rule and the save targets of the profile and question pages

Findings already recorded in `177.1-REVIEW.md` and `179-REVIEW.md` are not repeated here. Test files were read only for reliability.

**What holds up:**

- **Data scoping is sound.** `get_entity_nominations` gates on the caller's own editor grant through `private.caller_entity_ids`. That check already ties the grant's target to `p_project_id`. The RPC also filters `n.project_id`, keys the entity by type and id together, returns an allow-list projection, answers NULL for every refusal, and is executable by `authenticated` alone. The adapter keeps a NULL answer and an empty array apart, and the entity load turns a refusal into the same redirect as a missing entity.
- **The view is scoped to the route's entity.** The nominations view reads `page.data.contestantUserData.nominations`, which the entity layout loads for the route's own `entityType` and `entityId`. The task state also compares the page data's entity with the selected entity before it trusts the list.
- **The Svelte 5 context rules hold.** No phase-touched component destructures a reactive accessor. `dataRoot` is read directly at its point of use. `taskState` is a value replaced on every change, so the `$derived(contestantCtx.taskState)` alias on the home page is safe.
- **The server gates are consistent with the browser.** `(nominated)/+layout.server.ts` and `preview/+page.server.ts` use the same predicates as the browser (`hasNomination`, `previewOpenOf`, `requiredInfoQuestionsOf`, `unansweredQuestionsOf`, `rollUpQuestionCategories`). Neither builds a redirect target from the request path.

**What does not:** the findings are user-facing inconsistencies in where the nomination task leads and what it says, plus two robustness gaps. There is no security defect.

## Warnings

### WR-01: The nomination task reads "Define your nomination" under a lock, and leads to a view that says it cannot be defined

**File:** `apps/frontend/src/lib/contestant/tasks/taskState.ts:279-283` (used by `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte:156-159` and `:280`)

**Issue:** `taskLabelKey` picks the nomination row's label from the task's completion alone, and ignores both locks. Take an entity with no nomination while `access.nominationsLocked` or `access.answersLocked` is on:

1. `taskStateOf` routes the nomination task to the read-only `ContestantAppNominations` view (rule 2, `nominationsEditable` false).
2. The home row and the home's main action are still labelled `contestantApp.home.nomination.enter`, which in English is "Define your nomination".
3. The user follows it and lands on a page whose note says nominations can no longer be changed.

The profile and questions rows switch to their "view" labels under `answersLocked`, so only the nomination row promises an action the app refuses. The nominations view itself avoids this: it uses the `define` label only when `entryOffered` (`nominations/+page.svelte:89-93`). The unit test pins the inconsistent behaviour (`taskState.test.ts:461-462`), so the suite would not catch it.

**Fix:** Give `taskLabelKey` the editability fact, or read the route the task state already chose:

```ts
case 'nomination':
  if (complete) return 'contestantApp.home.nomination.view';
  // The task leads to the read-only view when nominations cannot be edited.
  return task.route?.route === 'ContestantAppNominationElections'
    ? 'contestantApp.home.nomination.enter'
    : 'contestantApp.home.nomination.view';
```

This means widening the `Pick<Task, 'id' | 'status'>` parameter to include `route`, and updating the two test rows. Alternatively, add a dedicated "see why" key for the locked case.

### WR-02: The home leads into the nomination editor where no election admits the entity, which the module's own rule forbids

**File:** `apps/frontend/src/lib/contestant/tasks/taskState.ts:199-215` (the home's row and main action at `[entityId=uuid]/+page.svelte:283` and `:335`)

**Issue:** For an entity with no nomination, `taskStateOf` sends the nomination task and `nextStep` to `ContestantAppNominationElections` whenever `nominationsEditable` is true. Only the two locks decide that. Whether any election admits the entity's type is never asked. When none does, the editor's guard (`nominations/(edit)/+layout.ts`) answers with a 307 to the nominations view. The result is a redirect hop under a "Define your nomination" label that promises something that cannot be done.

The same module rules this out for the view's button. `nominationsViewTarget` is documented as "never into an editor that would turn the user away" and checks `facts.entryOffered` for exactly this case (`taskState.ts:349, 361`). The home has no equivalent check, so two entry points into the same editor follow two different rules.

**Fix:** Give `taskStateOf` the same fact the view uses, and route on it:

```ts
// TaskStateInput
/** Whether the nomination editor would let the entity in: nominations editable and an election admits its type. */
nominationEntryOffered?: boolean;

// rule 2
const route: TaskRoute = input.nominationEntryOffered
  ? { route: 'ContestantAppNominationElections' }
  : { route: 'ContestantAppNominations' };
```

The context can compute this from the locks with `admissibleElectionsOf(dataRoot.elections, selectedEntity.type)`. `admissibleElectionsOf` is already exported beside `nominationsEditableOf`. With this change `nominationsViewTarget` and the home cannot disagree.

## Info

### IN-01: An entity whose question lists never become ready stays in its loading form with no way out

**File:** `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:325-345, 357-361, 403`; `[entityId=uuid]/+page.svelte:328-329`; `nominations/+page.svelte:240-241`; `(nominated)/questions/+layout.svelte:66-67`

**Issue:** For an entity with a nomination, `taskState.known` becomes true only once `#questionsReady` is set. That needs a non-empty `#selectedElections`. If `dr.getElection(n.electionId)` throws, the catch writes `[]`, `#writeNoQuestions()` keeps `#questionsReady` false, and the state stays "not known" for good. Three things then never leave their loading form:

- the home's main action
- the nominations view's button
- the questions layout

The only trace is a `log.error`. The server's preview gate treats the same case as "no answer" and serves the page. The root layout's election-data validation makes this unlikely today, but the browser has no terminal state for it.

**Fix:** Record the failure next to `#questionsReady`, for example `#questionsFailed = $state(false)`, set in the two catch blocks. Show an `ErrorMessage` instead of the spinner when it is set.

### IN-02: One malformed nominations answer signs the editor out on every sign-in

**File:** `apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts:46-53`; `supabaseDataWriter.ts:716`; `[entityId=uuid]/+layout.server.ts:49-56`

**Issue:** `parseEntityNominations` throws when any element fails the schema. That rejects `getEntityUserData`, and the entity load answers with `signOutToLogin(..., 'loginFailed')`. A single-entity user is redirected from the app root straight back to that entity, so each sign-in signs them out again. One bad element blocks the user until the data is fixed.

The schema mirrors today's column constraints, so this is defensive rather than reachable. The phase did widen the set of reads that end in a sign-out, though. Before the phase, the nominations came from a plain table select.

**Fix:** No change is needed if this is the intended policy. Otherwise, render the entity layout's error view, which `validity` already supports, instead of signing the user out, so the user stays signed in and is told the data could not be read.

---

_Reviewed: 2026-10-22T19:59:33Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
