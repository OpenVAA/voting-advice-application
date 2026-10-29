# The home, the tasks and the nominations view

An entity's home in the Contestant App is its task list. What is left to do, which pages are open and where every button that continues leads are all read from one derived state on the contestant context. This page describes that state, the pages that read it, the pages an entity with no nomination cannot open, and the view that shows an entity's nominations.

An entity with no nomination is not signed out. It reaches its home, is shown "Define your nomination" as its first task where it can define one, or "View your nominations" where it cannot, and cannot open its profile, its questions or its preview until it has a nomination.

## The tasks

An entity has up to three tasks, in this order:

| Task         | Complete when                                                                                                              | Its page                                                                                                                 | Route key                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `nomination` | The entity has at least one nomination, confirmed or not.                                                                  | The nomination editor for an entity with no nomination that the editor lets in; the nominations view in every other case | `ContestantAppNominationElections` or `ContestantAppNominations` |
| `profile`    | No required info question is unanswered and, while the entity's name can still be edited, no required name field is empty. | The profile                                                                                                              | `ContestantAppProfile`                                           |
| `questions`  | No opinion question the entity is asked is unanswered.                                                                     | The questions list                                                                                                       | `ContestantAppQuestions`                                         |

A task's status is `complete`, `incomplete` or `blocked`, or it has no status (`undefined`) while the facts it rests on are not loaded.

- The questions do not wait for the profile: both open as soon as the entity has a nomination.
- An entity that is asked no opinion question has no `questions` task.
- The nomination task's route is decided by one input of `taskStateOf`, `nominationEntryOffered`: whether the editor lets the entity in, which is that neither the nominations lock nor the answers lock is on and an election of the root load admits the entity's type, as `nominationEntryOfferedOf` of `$lib/contestant/nominations` answers. The context reads the elections from the page data, so the answer is the same on the server and on the first frame, and the same as the editor's guard decides on. It is read for an entity with no nomination alone. The input is optional, and a caller that leaves it out is answered as for an editor that would turn the entity away, so the task leads to the view. See [Defining nominations](/developers-guide/contestant-app/defining-nominations).
- The nomination task's label, from `taskLabelKey(task, answersLocked)`, follows where the task leads: "Define your nomination" while it is incomplete and leads into the editor, and "View your nominations" once it is complete or while it leads to the view.
- The preview is not a task. It opens once the entity has a nomination and neither a required info question nor an opinion question is unanswered. A missing name does not close it.

## The task state

The rules are one pure function, `taskStateOf(input)`, in [`taskState.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/tasks/taskState.ts), imported as `$lib/contestant/tasks`. It takes values the caller has already read and returns a fresh `TaskState`:

| Member        | Value                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `tasks`       | The entity's tasks in order, each with its `id`, `status`, `route` and, where it has one, the number of unanswered questions (`count`). |
| `nextStep`    | The first incomplete task and its route, or `undefined`.                                                                                |
| `previewOpen` | Whether the preview can be opened.                                                                                                      |
| `known`       | Whether every task's status is decided.                                                                                                 |
| `allComplete` | Whether every task the entity has is complete.                                                                                          |

The function applies four rules in order, and the first that applies decides:

1. **Nothing is known of the entity.** No task, and the state is not known.
2. **The entity has no nomination.** The nomination task is incomplete and is the next step. The profile and the questions are listed as `blocked`. No question count is read.
3. **The entity has a nomination and its question lists are not loaded.** The nomination task is complete, the profile and the questions are listed with no status, and the state is not known.
4. **The lists are loaded.** Each task is complete or incomplete, the next step is the first incomplete one, and the preview follows `previewOpenOf`.

The same module holds the functions the rules are built from: `hasNomination(nominations)`, `previewOpenOf(facts)`, and in [`unanswered.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/tasks/unanswered.ts) `requiredInfoQuestionsOf(infoQuestions)` and `unansweredQuestionsOf(questions, answers)`. The module imports nothing of Svelte or SvelteKit, so the context, a page and a server load all call it.

### On the context

`getContestantContext()` computes the state once, in a single derived value, and exposes it with its parts:

| Accessor          | Value                                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `taskState`       | The whole state of the entity the route names.                                                                                                            |
| `tasks`           | `taskState.tasks`.                                                                                                                                        |
| `nextStep`        | `taskState.nextStep`.                                                                                                                                     |
| `previewOpen`     | `taskState.previewOpen`.                                                                                                                                  |
| `profileComplete` | `taskState.allComplete`.                                                                                                                                  |
| `nominations`     | The entity's nominations as the entity-level load read them: an empty list for an entity with none, and `undefined` on a page whose data holds no entity. |

All six are reactive accessors: read them as `contestantCtx.taskState`, never destructured. The state is replaced by a fresh object on every change, so `$derived(contestantCtx.taskState)` follows it. See [Contexts](/developers-guide/frontend/contexts).

Whether the entity has a nomination is read from the page data, so it is known on the server and on the first frame. The counts are read from the user data store and the question lists, which are loaded in the browser. The state follows a saved answer without a load, and it follows a changed nomination only when the entity-level load runs again. The nomination editor's save runs it again with `invalidateAll()`.

## The buttons that continue

Every button that leads the user onward asks the task state through one function of `$lib/contestant/tasks`. No page holds a rule of its own.

| Button                                 | Function                                            | Leads to                                                                                                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The home's main action                 | `homeAction(state)`                                 | The first incomplete task's page, or the preview once every task is complete. While the state is not known the button is disabled in its loading form.                                                                                                 |
| The profile's save                     | `profileSaveTarget(state)`                          | The questions list when the questions are the next step, and the entity's home otherwise.                                                                                                                                                              |
| The questions list's start or continue | `questionsResumeRoute(state)`                       | The first unanswered opinion question.                                                                                                                                                                                                                 |
| A question page's save                 | `questionSaveTarget(state, { wasUnanswered })`      | The first unanswered question while there is one. After the last one is answered: the first incomplete task, or the entity's home. After an edit of an answered question with none left: the questions list.                                           |
| The nominations view's button          | `nominationsViewTarget(state, { entryOffered })`    | The first incomplete task's page when that task is not the nomination. For an entity with no nomination: the nomination editor where the view offers an entry to it, and the entity's home where it does not. The entity's home when nothing is left.  |
| The nomination editor's main button    | `nominationsSaveAction(state, draft)` for the label | The nominations view. The label says where the view's own button will lead: on to the first incomplete task, or back to the entity's home when nothing is left or the entity is left with no nomination, as `nominationsSaveTarget(state)` reckons it. |

`profileSaveTarget`, `questionSaveTarget`, `nominationsSaveTarget` and `nominationsViewTarget` return the target together with whether it `continues`, which chooses between a "continue" and a "return" label; no page navigates to the target of `nominationsSaveTarget`, which only labels the editor's button. `nominationsViewTarget` also returns an `action`, `continue`, `return` or `define`, by which the view picks its button's label without comparing a route. The label of a task row, and of the home's main action when it leads to a task, is `taskLabelKey(task, answersLocked)`.

A button that saves asks at two moments:

- **For its label**, before the save. The profile and a question page ask with a state built by `taskStateOf` from the saved data together with the draft on the page. The nomination editor builds no state: it asks `nominationsSaveAction` with `contestantCtx.taskState` as it stands and with what its draft would write.
- **For its target**, after the save has succeeded, with `contestantCtx.taskState` as it stands then. A fact the save itself changes, such as whether the page's question was unanswered, is copied into a local before the save.

The logout button and the menu read the same state. The logout button asks the user to stay only while the profile or the questions task is incomplete with unanswered questions to count. The menu disables an item whose page the entity cannot open, and a click on that item shows under it why, in one sentence, the same sentence the home shows; a second click hides it. The item is `NavItem` with a `disabledReason`: a button announced as unavailable that stays a tab stop, and the sentence is put into a polite live region the button names in `aria-controls`.

## The home

The home is the entity routes' [`+page.svelte`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte>). It shows, from top to bottom:

- for a user who edits more than one entity, Switch profile, a link with the sync icon to the app root, where another entity is chosen;
- while answers are locked, a note above the title;
- the title, which greets the user by the entity's name, or says the entity is ready once every task is complete;
- an explanation of what is left;
- an ordered list, at least as wide as the small container where the page allows it, of:
  - while the account's address awaits the link mailed to it, the task of confirming it: a link with a mail icon to the settings page, which closes nothing;
  - the tasks, each row a button that leads to the task's page and says its status. A blocked row is disabled and leads with a lock in place of the task's icon;
  - the preview entry, disabled and led by the same lock while the preview is closed;
- one sentence that says why the closed entries are closed;
- the main action and the logout button.

An entity with no nomination is known on the server, so its home waits for nothing. For an entity that has a nomination, the rows other than the nomination's have no status until the question lists are loaded in the browser, and the main action is in its loading form.

## Which pages need a nomination

The profile, the questions pages and the preview are in the route group `(nominated)` below the entity routes. The home, the nominations view and the nomination editor are outside it, so an entity with no nomination can open them. The settings page is no entity page at all: it sits at the app root (see [Entity selection](/developers-guide/contestant-app/entity-selection#the-entity-url)).

| Load                                                                                                                                                                                                                                  | Decides                                                                               | Runs                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| The group's [`+layout.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/+layout.server.ts>)       | An entity with no nomination is redirected to its own home. One nomination is enough. | Once per entry to the group, and not on a navigation between two of its pages. |
| The preview's [`+page.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts>) | An entity whose preview is closed is redirected to its own home.                      | On every arrival at the preview.                                               |

Both loads answer from rows the server read in the request, and neither signs anyone out. The redirect is a 307 to the entity's home, which says what is missing. Both hide nothing behind a redirect when the entity's data could not be read: they return and the entity layout shows its own error view.

The preview's rule reads the elections and the constituencies itself. When it cannot read them, or a nomination names one that was not read, it gives no answer: nothing is redirected and the preview is served, with no error view. The page shows the user's own entity only.

The preview's rule is in the page's own load, and not in the group's, because a layout's load does not run again on a navigation between two pages below it. The page's load runs on every arrival, and its `await parent()` runs the parent loads again on the server, so it sees an answer the user saved a moment before. The rule itself is `isPreviewOpen` in [`previewGate.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/contestant/previewGate.ts), which calls the same `hasNomination`, `previewOpenOf`, `requiredInfoQuestionsOf` and `unansweredQuestionsOf` the browser's task state does.

The gate is a rule about pages. The database's own rules decide what an entity's editor may write.

## The nominations view

The view is `/contestant/<entityType>/<entityId>/nominations`, the entity routes' [`nominations/+page.svelte`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte>). The profile shows nothing of the entity's nominations. The view leads into the [nomination editor](/developers-guide/contestant-app/defining-nominations), where the nominations can be edited, and deletes a nomination the user confirms on its card.

What the view shows is decided on three things: whether the entity has a nomination, whether its nominations can be edited, and whether an election admits the entity's type. An entry to the editor is offered where the nominations can be edited and an election admits the entity. That gives six states:

| The entity has    | An entry is offered                                                                 | A lock is on                                                            | No election admits the entity                          |
| ----------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| **Nominations**   | The cards and a sentence that the nominations can be changed.                       | The note, the cards and a sentence that says what the list is.          | The cards and that same sentence.                      |
| **No nomination** | A sentence that a nomination can be defined. The main button leads into the editor. | The note, and a sentence that no nomination is defined and whom to ask. | A sentence that says so, and a way to contact support. |

- **A card** shows the election, the constituency, what the nomination stands under when it stands under something, the election symbol when it has one, and whether an administrator has confirmed it. A nomination stored with a typed name of a party or an alliance shows that name as text, with a line saying that it was requested and is not in the application yet. An unconfirmed card says that voters do not see it yet.
- **The note** is shown under either lock: with the reason `nominationsLocked` while `access.nominationsLocked` is on, and with `nominationsAnswersLocked` while `access.answersLocked` alone is on. See [The nominations lock](/developers-guide/configuration/app-settings#the-nominations-lock).
- **Edit and Delete** are on each card of a nomination the editor manages, while an entry is offered and neither lock is on. Edit leads to the editor's details step with the election and the constituency of every such nomination chosen, so that none of them is about to be removed. Delete asks in the card, with no dialog; its Confirm writes, through `setEntityNominations`, the nominations the editor manages without that one, each with its symbol and its parent kept, against the set shown, so a set changed meanwhile is refused as `changed`. The page's data is then read again; a refusal is reported with the editor's message for the same reason, and a done delete with a status line.
- **Add a nomination** follows the cards while `canAddAnother` of `nominationFacts` holds and neither lock is on: the nominations may be edited, and an election that admits the entity's type holds no nomination of it that the editor manages. The editor chooses one constituency in each election, so an election the entity already stands in leaves nothing to add. It leads to the editor's entry, where the elections of the entity's nominations are chosen already. It is never shown in place of the nominations, where the main button leads into the editor.
- **Return** follows the main button and leads to the entity's home wherever the main button leads elsewhere; it is not rendered while the main button returns there itself, nor while the entity's tasks are not known. The page holds no link to the editor beside its main button.

Whether an entry is offered is read from `nominationFacts` of the page's data, the facts the load of the nominations tree states and the editor's guard decides on, so the view and the guard agree. The view hands it to `nominationsViewTarget(state, { entryOffered })`, because the task state is told nothing of elections. The page says its state through `data-nominations-state`, `data-nominations-locked` and `data-nominations-editable` on its container and `data-empty` on the sentence that stands in place of the nominations.

The view reads `contestantCtx.nominations`, the list the entity-level load read, so the cards are in the server-rendered markup and the page looks nothing up in the data root. The load reads the list through the data writer's `getEntityUserData({ loadNominations: true })`, which calls the database function `get_entity_nominations`; see [Which entity a user is](/developers-guide/backend/authentication#which-entity-a-user-is). Each element is an `EntityNomination` of [`dataWriter.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/base/dataWriter.type.ts), which carries the names it is shown with in the locale of the request.

The list follows the load and not the store. A change to an entity's nominations reaches the view, the task state and the gate when the entity-level load runs again. That load depends on the two entity params alone and has no dependency key.

## The note

`NotEditableNote` in [`$contestant/components/notEditableNote`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte) says that something cannot be edited and holds one Contact support button. Its `reason` property selects the sentence: `'answersLocked'`, `'nominationsLocked'` or `'nominationsAnswersLocked'`. A page passes a second sentence as the note's children, and places the note in the `note` snippet of `MainContent`, which precedes the page title in reading order. The home, the profile, the questions list and a question page show it while answers are locked. The nominations view shows it while nominations are locked and, with the third reason, while answers are locked and nominations are not.

## Two rules to keep

1. **Nothing is decided from an empty list.** A list that is empty because nothing is loaded looks the same as one that is empty because nothing is left to do. No status, next step, open preview or completeness is read off a count before the facts behind it are loaded: `taskStateOf` states this once, in its first three rules, and every reader asks `known` or a task's status and never a list's length. The nominations view likewise tells `undefined`, a list that is not known, from an empty list.
2. **A save's target is read after the save.** The label is computed before the save and the target after it, from the state as it stands then. Computing both from one value read before the save sends the user to the task the save has just completed.

## In tests

`taskState.test.ts` and `unanswered.test.ts` beside the module hold the cases of each rule. The E2E project `perm-no-nomination` ([`perm-no-nomination.spec.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/tests/specs/perm/perm-no-nomination.spec.ts)) seeds a candidate and an organization with no nomination beside a nominated candidate, and drives the home, the closed pages, the menu, the nominations view and the buttons that continue; `perm-contestant-nominations` drives the nominations view's six states and the editor (see [Defining nominations](/developers-guide/contestant-app/defining-nominations#in-tests)); `contestant-journey` takes one candidate from registration through its profile and its questions.
