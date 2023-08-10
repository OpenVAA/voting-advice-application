# Getting Started with Svelte

This document describes the process for running the frontend separately on your local machine without Docker. You can
find [instructions on running the project with Docker here](../docs/docker-setup-guide.md).

## Run The Frontend

Once you've cloned the project, install dependencies with `yarn install`. Then copy `.env.example`, rename it as `.env`
and fill required environment variables there.

## Development

After installation & setting up environment variables, start a development server:

```bash
yarn dev

# or start the server and open the app in a new browser tab
yarn dev -- --open

# to make the dev project accessible through the ip, add host flag to the commamd
# it is required for iOS development via Xcode
yarn dev -- --host
```

### Android

#### Dev w/ Hot Reload

1. Install Android Studio for the best dev experience.
2. Open `capacitor.config.js` file and change `server.url` value to your public IP address.
3. Not mandatory, but run the command `npx cap sync android` for a better flow experience.
4. Run the command `npx cap open android` with Android Studio installed to open the app.
5. Click `Run app` button or `^R` in order to run the emulator and see the project.

#### Build

Same as Dev, but run `npx cap sync android` after each build to get the most recent project build version.

### iOS

#### Dev w/ Hot Reload

1. Install Xcode for the best dev experience.
2. Open `capacitor.config.js` file and change `server.url` value to your public IP address.
3. Not mandatory, but run the command `npx cap sync ios` for a better flow experience.
4. Run the command `npx cap open ios` with Xcode installed to open the app.
5. Click `Build` button in order to run the emulator and see the project.

#### Build

Same as Dev, but run `npx cap sync ios` after each build to get the most recent project build version.

## Tooling

### Tailwind and DaisyUI

To facilitate the development of front-end components we have included the Tailwind library in our project.
Additionally, we have included the DaisyUI plugin to speed up the development of the front-end components. You can find
more information about the Tailwind library in the [Tailwind official documentation](https://tailwindcss.com/docs/installation)
and the [DaisyUI official documentation](https://daisyui.com/components/).

## Accessibility

This application needs to be WCAG 2.1 AA compliant. Therefore, you must familiarize yourself with web accessibility.
You can start by exploring the [Accessibility Fundamentals Overview page](https://www.w3.org/WAI/fundamentals/) and the
[Mozilla Developer Network accessibility section](https://developer.mozilla.org/en-US/docs/Web/Accessibility). Every time
you develop a new component, be sure to comply with the [Accessibility Guidelines](https://www.w3.org/TR/WCAG21/)

## 📚 Learn more

- [Svelte](https://svelte.dev/) - Svelte is a radical new approach to building user interfaces.
- [SvelteKit](https://kit.svelte.dev/) - SvelteKit is a framework for building web applications of all sizes, with a
  beautiful development experience and flexible, low-level APIs.

# WIP: Frontend app structure / state management

## Getting started

To see the thing in action, just fire up `/frontend/yarn dev` and open the root in the browser.

What's demonstrated currently is the route: start ➡️ election selection ➡️ constituency selection ➡️ question category selection ➡️ questions.

## Guiding principles

Some principles behind this draft are:

1. Single soure of truth.
2. Abstract matching logic and data model so that they are specific neither to the database nor the frontend framework.
3. Basic data object filtering can be implemented either already in the database calls or in the frontend. To this effect, the data object model contains implementations for all basic filtering methods.
4. Avoid loading unnecessary data (to a reasonable extent).
5. All database operations can be done on the server-side.
6. Make the model so generic it supports different electoral systems and, importantly, multiple simultaneous elections.
7. All data (both raw and filtered) is accessible app-wide and reactively (using Svelte stores).
8. Refreshing the browser perfectly maintains app state.
9. Prefer verbosity over possibility for confusions.

## Relevat files

- `$lib/api`
  - Datbase API and data objects, such as `Election` and `Question`
  - no Svelte-speficic dependies (now contains a Strapi Adapter, which might be moved somewhere)
- `./matching`
  - Matching algorithms
  - no Svelte-spefic dependies (should be in `$lib`)
- `$lib/config`
  - Instance-specific settings, including database connection config
- `$lib/stores`
  - App-wide stores (see below)
- `routes`
  - See further below

## Stores (`$lib/stores`)

### Data object stores (for `Elections`, `Questions` etc.)

For each data object type, there is a cascade of refined and filterd versions, which become available as the user proceeds. The general idea is that these differ on where they are processed and stored and what kinds of implications on other such stores.

**Update!** We can get rid of `OrganizedContents`s with a bit of refactoring. See To do at the end of the page.

| Store               | Type                                      | Process                                                                                                                                                                                                                                                                                                                     | Dependencies                                        | Notes                                                                                                                                                                                                                                                                                                                                                                        | Example                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exampleData`       | `Writable<ExampleData[]>`                 | 1. Raw data loaded by the relevant route-level's `+layout.server.ts` (`return { exampleData: getDataProvider().getExampleData(exampleQueryOptions) }`). <br>2. Passed in `LayoutData` to `+layout.svelte`. <br>3. This then sets the store `$exampleData = $page.data.exampleData`, thus triggering the cascade down below. | Route parameters and possibly `config.appSettings`. | The data must be JSON-serializable literals because it's serialized before being passed to the layout.                                                                                                                                                                                                                                                                       | `questionCategoriesData`: The literal question categories data loaded from the database API.                                                                                                                                                                                                    |
| `allExamples`       | `Readable<Example[]>`                     | This derived store merely converts the `ExampleData` literals into `Example` objects, which have methods and defaults that are useful in the UI.                                                                                                                                                                            | `exampleData`                                       | Contains all loaded data as proper objects.                                                                                                                                                                                                                                                                                                                                  | `allQuestionCategories`: An array of `QuestionCategory` objects with their contained `Question` objects included.                                                                                                                                                                               |
| `availableExamples` |  `Readable<OrganizedContents<Example[]>>` | 1. This derived store filters the objects based on the effective app state. <br>2. From now on, the objects are also a bit clunkily contained in an `OrganizedContents` object, which allows to easy access (with `{#each}`) to all of them or grouped by election\*.                                                       | `allExamples`, `effectiveSettings`                  | Contains the subset of all objects that can be shown to the user for selection in a format that pairs the objets with the relevant election.\*                                                                                                                                                                                                                               | `availableQuestionCategories`: An `OrganizedContents` object listing all question categories (per election) that can be shown to the user for selection. At this point any filtering by the user's selected constituency is done and categories with no questions after filtering are excluded. |
| `visibleExamples`   | `Readable<OrganizedContents<Example[]>>`  | This derived store filters the available objects based on transient app state.                                                                                                                                                                                                                                              | `availableExamples`, `effectiveTemporaryChoices`    | Contains the objects that are actually shown in the UI to the user, based on their selections. The main difference between this and `availableExamples` is that anything that depend on `visibleExamples` should not incur further (SSR) data loading. Also, this store is immediately dependent only on `effectiveTemporaryChoices`, which do not persist between sessions. | `visibileQuestionCategories`: The question catetgories the user has selected to answer from the available ones.                                                                                                                                                                                 |

\* This is necessary due to the fact that VAAs often need to contain data for multiple simultaneous elections, which complicates things quite a lot.

In addition to these, we may also provide a `currentExample: Readable<Example>` store, which contains the currently visible one, such as the candidate or question currently shown.

### Settings and temporary UI choices

These are based on static objects loaded when the app is initialized and two stores:

1. `userData`
   - Contains the user's settings and other information that should persist across sessions.
   - These can be saved to `localStorage` or in a cookie if allowed.
2. `sessionData`
   - Contains all the session specific data that need not to persist across sessions. They are still stored in `localStorage`, and need thus to be serializable.

From these two effective stores are derived, which are used to compute the app state.

1. `effectiveSettings`
   - Derived from:
     1. `DEFAULT_SETTINGS` (a constant)
     2. `appSettings` (set in the instance-specific config file)
     3. `userData.settings`
     4. `sessionData.settings`
2. `effectiveTemporaryChoices`
   - Derived from:
     1. `sessionData.effectiveTemporaryChoices`
     2. Route params (although we might want to remove this bit and always just have the route params reflected in the `sessionData` and just use that)

## Routes

**NB!** Currently, all selections are passed through route parameters, which admittedly leads to quite clunky urls and some lack of elegance :D. This paradigm can be easily be changed to another one as long as we're able to provide the same parameters to the SSR functions. Alternatives include:

1. Use query params instead of route params
2. Put the `+layout.server.ts` file to the very bottom of an optional-parameter route hierarchy, such as `[[electionIds]]/[[constituencyIds]]/[[questionCategoryIds]]/+layout.server.ts` and then load all of data for which relevant parameters are specified.
3. The params might be passed in a cookie
4. The params might be stored in an SSR session

The current route hierarchy is a bit of a Russian doll, so that we can progressively load the data we need but still get all necessary data when the page is refreshed. For this reason we need to have such a long list of parent layout loaders.

### Anatomy of a route: `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/q4`

**NB!** The fixed parts 'elections', 'constituencies' etc. are basically unnecessary, but for the time being make the url easier to read. The format could be abbreviated to `/e1/cg1-c2,cg2-c1/qc2/q4` without loss of information.

**NB!** We are passing raw ids as route parameters, but they should be encoded before adding to the url.

Now, let's start decoding the route.

1. `/+layout.server.ts` loads all the globally necessary data literals from the database and static app settings.

```
  import {getDataProvider, appSettings} from '$lib/config';
  const dataProvider = getDataProvider();
  return {
    appSettings,
    appLabels: await dataProvider.getAppLabels(),
    electionsData: await dataProvider.getElectionsData()
  }
```

2. `/+layout.svelte` takes the data literals from the server load and updates the data stores with them.

```
  $appLabels = data.appLabels;
  $appSettings = data.appSettings;
  $electionsData = data.electionsData;
```

3. `/+page.svelte` just shows a button to proceed to election selection.

4. `/elections/+page.svelte` shows all available elections (`$lib/stores/availableElections`) for selection. Depending on `$lib/stores/effectiveSettings.electionsAllowSelectMultiple`, one or multiple elections can be selected.

5. `/elections/e1/constituencies/+layout.server.ts` loads the constituency categories data and also adds the route param to the page data. **NB.** We might already pass the electionIds to the data provider call to not load unnecessary constituency categories. Also, the route params could be accessed in the svelte files as well.

```
  return {
    constituencyCategoriesData = await dataProvider.getConstituencyCategoriesData(),
    selectedElectionIds: params.electionIds.split(','),
  };
```

6. `/elections/e1/constituencies/+layout.svelte` updates the relevant stores.

```
  $constituencyCategoriesData = data.constituencyCategoriesData;
  $sessionData.temporaryChoices.selectedElectionIds = data.selectedElectionIds;
```

7. `/elections/e1/constituencies/+page.svelte` shows the constituency selection for the selected election (`e1`). If there were multiple elections, selections for all of them would be shown. Uses `$lib/stores/availableConstituencyCategories`.

8. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/+layout.server.ts` loads the necessary question categories and questions data as well as passes the selected constituency ids (`cg1-c2,cg2-c1`) in the data. **NB.** We might include the questions in the question categories load, there isn't much point in getting them seprarately. Also, the route params could be accessed in the svelte files as well.

```
  const constituencyIds = params.constituencyIds.split(',');
  const questionCategoriesData = await dataProvider.getQuestionCategoriesData({constituencyId: constituencyIds});
  const questionIds = questionCategoriesData.map(c => c.questionIds ?? []).flat();
  const questionsData = await dataProvider.getQuestionsData({id: questionIds});
  return {
    questionCategoriesData,
    questionsData,
    selectedConstituencyIds: constituencyIds,
  };
```

9. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/+layout.svelte` updates the relevant stores.

```
  $questionCategoriesData = data.questionCategoriesData;
  $questionsData = data.questionsData;
  $userData.constituencyIds = data.selectedConstituencyIds;
```

10. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/+page.svelte` shows the available question categories for selection. Uses `$lib/stores/availableQuestionCategories`.

11. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/+layout.ts` just adds the selected question category ids to page data.

```
  return {
    selectedQuestionCategoryIds: params.questionCategoryIds.split(',');
  }
```

12. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/+layout.svelte` just updates the relevant store.

```
  $sessionData.temporaryChoices.selectedQuestionCategoryIds = data.selectedQuestionCategoryIds;
```

13. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/q4/+page.svelte` finally shows the current question `q4` using `$lib/stores/visibleQuestions`. Hurrah!

## To do

- Combine `Questions` and `QuestionCategories` so that `Questions` cannot exist without a category
- Create a base class for `DataObjects` implementing basic methods
- Collect all DataObjects under DataRoot and provide utility getters/methods for the root and subobjects, such as `DataRoot -> Election -> constituencyCategories -> constituency -> questionCategories` which will only return those question categories that are relevant for the ancestor `Election` and that `Constituency`. In fact, this will just call `DataRoot -> getQuestionCategories(queryOptions: {election?: Election, constituency?: Constituency})`.
- Get rid of `OrganizedContent`:
  1. Add the relevant `Election`s as a property (or getter) to each object needing that information.
  2. Convert all data object arrays into `ObjectList` objects, which provide utility getters or methods in addition to an `items` getter. These may include such as `class ObjectList<T>: ... get groupedByElection<T>(): {election: Election, items: T[]}[]` or `find(queryOption: {election?: Election | Election[], ...}): T[]`, which will filter `items` using a generic query filter.
- Figure out a way to organise candidates and other entities:
  - Possibly as `Nomination` objects in the `DataRoot` implementing `{election: Election, constituency: Constituency, entity: Entity, children?: Nomination[]}` (with enforcement of proper entity relationships so that the allowed lineage is `ElectoralAlliance` > `PoliticalOrganisation` (i.e. party) > `Faction` > `Candidate`)
- Extend the current single `electionId`- and `constituencyId`-based filtering paradigm to multiple such ids and include or exclude, e.g. for `Question` add `electionId?: {in?: string[], notIn?: string[]}`. Perhaps there is an pre-existing utility for this?
- Create a store and nice data model for results (extending or containing the algorithm's `Match` objects) and `visibleResults`
  - Also define basics for `Filter` and `Sorter` objects, which may or may not be available already on the `DataObject` level
- Create api endpoints that expose the `DataProvider` calls if we need to load something from the client side
- Instead of `gotoXXX` functions, just update the relevant stores and add a derived store or subscriber that calls goto when the state changes OR at least define a generic `goto` function as an utility
- Constituency hierarchies: Allow user to select any constituency level and assume the effective one is the top-level specified by the category
- See all file-specific TO DO's
