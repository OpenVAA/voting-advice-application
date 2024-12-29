# Contexts

All of the data, shared stores and other state variables used by the app and components are collected in [Svelte contexts](https://svelte.dev/docs/svelte#setcontext). They are defined in the [$lib/api/contexts](../../frontend/src/lib/contexts) folder.

Contexts must be initialized before they can be used by calling the `initFooContext()` function. Initialisation is performed by the ancestor `+layout.svelte` files of the routes on which the contexts are available. Afterwards the contexts are accessed by `getFooContext()`.

For ease of use, most contexts contain the properties provided by lower-level contexts. The [`VoterContext`](../../frontend/src/lib/contexts/voter), for example, contains the [`AppContext`](../../frontend/src/lib/contexts/app/appContext.type.ts), which in turn contains the [`I18nContext`](../../frontend/src/lib/contexts/i18n/i18nContext.type.ts) and [`DataContext`](../../frontend/src/lib/contexts/data/dataContext.type.ts).

> See also an [example of the data loading cascade](./data-and-state-management.md#example).

## Contexts vs global stores

Contexts are used instead of global stores, because they are explicitly initialised and restricted to components and their children. Tracking the use and dependency-loading of directly imported global stores is hard, because they’re initialized immediately when imported.

## Example

On the `/(voters)/elections/` route where the Voter can select which elections to get results for we have:

```tsx
import { getVoterContext } from '$lib/contexts/voter';
const { dataRoot, getRoute, selectedElections, t } = getVoterContext();
```

The properties accessed are:

- `dataRoot`: A store providing access to all of the VAA data which has been provided to it by `load` functions. Inherited from `DataContext`.
- `getRoute`: A store containing a function with which links to internal routes are build. Inherited from `AppContext`.
- `selectedElections`: A store containing the currently selected `Election` objects, derived from the `electionId` search parameters and `dataRoot`.
- `t`: A store containing the translation function. Inherited from `I18nContext`.

### Available contexts

> For complete descriptions of the contexts’ contents, see their associated type files.

| Context                                                                                  | Description                                                   |  Consumer                                                           | Includes                       | Own contents (non-exhaustive)                                                                                                                                                                                                                                                                                                                                                                                                                                  | Initialized by      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| [`I18nContext`](../../frontend/src/lib/contexts/i18n/i18nContext.type.ts)                | All localization functions                                    | Other contexts                                                      | —                              | — `t`<br> — `locale`<br> — `locales` from `$lib/i18n`                                                                                                                                                                                                                                                                                                                                                                                                          | `/[lang]`           |
| [`ComponentContext`](../../frontend/src/lib/contexts/component/componentContext.type.ts) | Functions available to all components                         | Any component                                                       | `I18n`                         | — `darkMode: Readable<boolean>`                                                                                                                                                                                                                                                                                                                                                                                                                                | `/[lang]`           |
| [`DataContext`](../../frontend/src/lib/contexts/data/dataContext.type.ts)                | All VAA data (using the `@openvaa/data` model)                | Other contexts                                                      | `I18n`\*                       | — `dataRoot: Readable<dataRoot>`                                                                                                                                                                                                                                                                                                                                                                                                                               | `/[lang]`           |
| [`AppContext`](../../frontend/src/lib/contexts/app/appContext.type.ts)                   | All functions shared by the Voter and Candidate Apps          | Any page, layout or dynamic component                               | `I18n`, `VaaData`, `Component` | — `appType: Writable<AppType>`<br> — `appSettings: SettingsStore`<br> — `userPreferences: Writable<UserPreferences>`<br> — `getRoute: Readable<(options: RouteOptions) => string>`<br> — `sendFeedback: (data: FeedbackData) => Promise<Response>`<br> — contents of `TrackinService`<br> — popup and modal dialog handling<br> — handling data consent and user surveys                                                                                       | `/[lang]`           |
| [`LayoutContext`](../../frontend/src/lib/contexts/layout/layoutContext.type.ts)          | Functions for subpages to affect the outer application layout | Any page or layout                                                  | —                              | — `topBarSettings: StackedStore<TopBarSettings, DeepPartial<TopBarSettings>>`<br> — `pageStyles: StackedStore<PageStyles, DeepPartial<PageStyles>>`<br> — `progress: Progress`<br> — `navigation: Navigation`                                                                                                                                                                                                                                                  | `/[lang]`           |
| [`VoterContext`](../../frontend/src/lib/contexts/voter/voterContext.type.ts)             | All functions exclusive to the Voter App                      | Any part of the Voter App or dynamic components (conditionally)     | `App`                          | — `answers: AnswerStore`<br> — `matches: Readable<MatchTree>`<br> — `entityFilters: Readable<FilterTree>`<br> — `infoQuestions: Readable<Array<AnyQuestionVariant>>`<br> — `opinionQuestions: Readable<Array<AnyQuestionVariant>>`<br> — `selectedConstituencies: Readable<Array<Constituency>>`<br> — `selectedElections: Readable<Array<Election>>`<br> — handling question category selection and question ordering<br> — other selection-related functions | `/[lang]/(voter)`   |
| `CandidateContext`                                                                       | All functions exclusive to the Candidate App                  | Any part of the Candidate App or dynamic components (conditionally) | `App`                          | Not yet implemented                                                                                                                                                                                                                                                                                                                                                                                                                                            | `/[lang]/candidate` |

\* The `DataContext` accesses the `I18nContext` because it needs `locale` but it doesn’t export its contents.
