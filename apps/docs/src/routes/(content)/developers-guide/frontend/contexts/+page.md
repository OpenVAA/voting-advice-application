# Contexts

The data and the shared state that pages, layouts and components use are provided through [Svelte contexts](https://svelte.dev/docs/svelte/context). They are defined in [`src/lib/contexts`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/contexts), one directory per context.

Each context module exports two functions:

- `initFooContext()` creates the context. It is called once, during the initialisation of the layout that provides it. Calling it a second time throws an error.
- `getFooContext()` returns the context to any descendant component. Calling it before the context is initialised throws an error.

The contexts are written in runes: their members are `$state` and `$derived` values exposed through getters, plain functions, and `{ current }` handles. Contexts are used instead of module-level state because they are explicitly initialised and only reach the component tree below the layout that provides them.

## Available contexts

Most contexts include the members of the contexts they build on, so a Voter App page only needs `getVoterContext()`. For the full list of members, see each context's type file.

| Context                                                                                                                                                   | Initialised by                     | Includes                          | Own members (examples)                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`I18nContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts)                   | `routes/+layout.svelte`            | —                                 | `locale`, `locales`, `t`, `translate`                                                                                                                                              |
| [`ComponentContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/component/componentContext.type.ts)    | `routes/+layout.svelte`            | `I18nContext`                     | `darkMode`                                                                                                                                                                         |
| [`DataContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/data/dataContext.type.ts)                   | `routes/+layout.svelte`            | —                                 | `dataRoot`, `setDataRoot`                                                                                                                                                          |
| [`AppContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/app/appContext.type.ts)                      | `routes/+layout.svelte`            | `ComponentContext`, `DataContext` | `appSettings`, `appCustomization`, `appType`, `getRoute`, `userPreferences`, `popupQueue`, `sendFeedback`, the tracking functions such as `startEvent`, consent and survey setters |
| [`LayoutContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/layout/layoutContext.type.ts)             | `routes/+layout.svelte`            | —                                 | `topBarSettings`, `pageStyles`, `progress`, `navigation`, `video`, `useTopBar`, `usePageStyles`, `useNavigation`, `setRouteTitle`                                                  |
| [`AuthContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/auth/authContext.type.ts)                   | `routes/+layout.svelte`            | —                                 | `isAuthenticated`, `logout`, `setPassword`                                                                                                                                         |
| [`VoterContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/voter/voterContext.type.ts)                | `routes/(voters)/+layout.svelte`   | `AppContext`                      | `answers`, `matches`, `entityFilters`, `filterContext`, `selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `resultsAvailable`, `resetVoterData`   |
| [`FilterContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/filter/filterContext.type.ts)             | `initVoterContext()`               | —                                 | `filterGroup`, `version`                                                                                                                                                           |
| [`ContestantContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts) | `routes/contestant/+layout.svelte` | `AppContext`, `AuthContext`       | `userData`, `selectedElections`, `opinionQuestions`, `answersLocked`, `profileComplete`, `entryFlow`, `sendEntryLink`, `checkInvitationCode`, `user`, `entities`, `selectedEntity` |
| [`AdminContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/admin/adminContext.type.ts)                | `routes/admin/+layout.svelte`      | `AppContext`, `AuthContext`       | `userData`, `jobs`, `updateQuestion`, `startJob`, `getJobProgress`, `abortJob`, `insertJobResult`                                                                                  |

The loaded data reaches the contexts through the `DataContext`. See [How loaded data reaches components](/developers-guide/frontend/data-api-and-adapters#how-loaded-data-reaches-components).

## Reading a context

On a results page of the Voter App:

```ts
import { getVoterContext } from '$lib/contexts/voter';

const voterCtx = getVoterContext();
// Stable references: safe to destructure
const { answers, getRoute, startEvent, t } = voterCtx;
// Reactive accessors: read them off the context
const appSettings = $derived(voterCtx.appSettings);
const elections = $derived(voterCtx.selectedElections);
```

In the template, `voterCtx.resultsAvailable` or `voterCtx.dataRoot.elections` can also be read directly.

## Stable references and reactive accessors

Context members fall into two classes, and they behave differently when you destructure them.

**Stable references** never change after the context is created, so destructuring them is safe. They include `t`, `translate`, `getRoute`, `darkMode`, `answers`, the contestant's `userData`, and the functions such as `logout`, the contestant context's entry-flow functions (`checkInvitationCode`, `requestSignInLink`, `requestPasswordRecovery`, `holdEntryCode`, `sendEntryLink`, `resendEntryLink` and `clearEntryFlow`), `startEvent`, the countdown starters and the contestant context's two nomination functions, `setEntityNominations` and `getNominationParentOptions`. Each of those two reads the selected entity when it is called, so a destructured copy acts on the entity the route names at that moment. `getRoute`, `darkMode` and the other `{ current }` handles are stable objects whose `current` value changes; read `current` where you need the value.

**Reactive accessors** are getters over `$state` or `$derived` values that change over time: `appSettings`, `dataRoot`, `locale`, `selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `matches`, `resultsAvailable`, `isAuthenticated`, `answersLocked`, `nominationsLocked`, `questionsReady`, the contestant context's `taskState`, `tasks`, `nextStep`, `previewOpen`, `profileComplete`, `nominations` and `entryFlow`, and the other derived values. Several type files mark them in their comments, for example `AppContext.appSettings` and `VoterContext.currentResultsElection`.

Two rules follow:

1. **Never destructure a reactive accessor.** Destructuring calls the getter once, when the component is initialised, and keeps that value, usually an empty array, for the life of the component. Read `ctx.selectedElections` instead, or bind it with `$derived(ctx.selectedElections)`.
2. **Never alias `dataRoot`.** The `DataRoot` object keeps the same identity; the context only bumps a private version counter when its data changes. `const dataRoot = $derived(ctx.dataRoot)` therefore yields the same object on every change, Svelte skips the update, and a page entered by a direct URL keeps showing no data. Read `ctx.dataRoot.<property>` directly where you use it. The unit test `src/lib/contexts/tests/noDataRootDerivedAlias.test.ts` fails if such an alias appears.

Spreading a context (`{ ...ctx }`) copies the current values of its accessors, so it has the same effect as destructuring.

### An empty list that is not yet loaded

The contestant context's question lists are empty before the edited entity's question data is loaded, on the server and on first paint included. `questionsReady` says whether they are loaded: while it is `false` an empty `opinionQuestions` means "not loaded yet", and once it is `true` it means the entity is asked no opinion question. A page reads the two together through `opinionQuestionsStateOf` in [`opinionQuestionsState.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts), which answers `loading`, `none` or `some`, and leaves out what it offers for answering questions only for `none`. `questionsReady` stays `false` for an entity with no selected election.

The contestant context's task state applies the same care to everything it derives. `taskState.known` is `false` until whether the entity has a nomination has been read and, for an entity that has one, until its question lists are loaded; while it is `false` a task may have no status, `nextStep` is `undefined` and `previewOpen` and `profileComplete` are `false`. A page asks `known` or a task's `status` and never the length of a list. `taskState` is replaced by a fresh object on every change, so, unlike `dataRoot`, it may be bound with `$derived(contestantCtx.taskState)`; it is still never destructured. `nominations` is `undefined` on a page whose data holds no entity, which is not an empty list. See [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks#the-task-state).

Write data into the `DataRoot` only through `setDataRoot(updater)`, which runs the update untracked so that the writing effect does not depend on the version counter and loop.
