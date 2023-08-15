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

What's demonstrated currently is the route: start ➡️ election selection ➡️ constituency selection ➡️ question category selection ➡️ questions (no answering, though) ➡️ candidate results ➡️ candidate details.

To figure out how to proffer data, go to `$lib/vaa-data/MockDataProvider.ts`.

## Guiding principles

Some principles behind this draft are:

1. Single soure of truth.
2. Matching logic and data model are abstracted to `vaa-matching` and `vaa-data` modules, which depend on neither the backend nor the frontend.
3. Basic data object filtering can be implemented either already in the database calls or in the frontend. To this effect, the data object model contains implementations for basic filtering methods.
4. Avoid loading unnecessary data (to a reasonable extent).
5. All database operations can be done on the server-side.
6. Make the model so generic it supports different electoral systems and, importantly, multiple simultaneous elections.
7. All data (both raw and filtered) is accessible app-wide and reactively (using Svelte stores).
8. Refreshing the browser perfectly maintains app state.
9. Prefer verbosity over possibility for confusions.
10. Offer default values for all objects' properties so that we need not check for `object.prop == null`. Currently empty (string) properties always return the empty string ''.

## Relevat files

- `$lib/vaa-data`
  - Datbase API and data objects, such as `Election` and `Question`
  - no Svelte-speficic dependies (now contains a Strapi Adapter, which might be moved somewhere)
- `$lib/vaa-matching`
  - Matching algorithms
  - no Svelte-spefic dependies
- `$lib/server/config`
  - Instance-specific settings, including database connection config
- `$lib/stores`
  - App-wide stores (see below)
- `routes`
  - See further below

## Stores (`$lib/stores`)

### Data object stores (for `Elections`, `Questions` etc.)

For each data object type, there is a cascade of refined and filtered versions, which become available as the user proceeds. The general idea is that these differ on where they are processed and stored and what kinds of implications on other such stores.

**Update!** We can get rid of `OrganizedContents`s with a bit of refactoring. See To do at the end of the page.

| Store               | Type                                       | Process                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Dependencies                                        | Notes                                                                                                                                                                                                                                                                                                                                                                        | Example                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exampleData`       | `Writable<ExampleData[]>`                  | 1. Raw data loaded by the relevant route-level's `+layout.server.ts` (`return { exampleData: getDataProvider().getExampleData(exampleQueryOptions) }`). <br>2. Passed in `LayoutData` to `+layout.svelte`. <br>3. This then sets the store `$exampleData = $page.data.exampleData`.<br>4. This store has a manually added subscriber that passes the data to a `DataRoot` object using `dataRoot.provideExampleData(data)`. The `dataRoot` is a variable in `stores` but not exported because it's not a store. It does, however, contain the realtime data hierarchy, and derived stores below make use of it.<br>5. Changes in `$exampleData` also trigger the cascade below. | Route parameters and possibly `config.appSettings`. | The data must be JSON-serializable literals because it's serialized before being passed to the layout.                                                                                                                                                                                                                                                                       | `questionCategoriesData`: The literal question categories data loaded from the database API.                                                                                                                                                                                 |
| `allExamples`       | `Readable<Example[]>`                      | This derived store merely returns `dataRoot.examples` containing `Example` objects, which were just created as a result of `dataRoot.provideExampleData`. The `Example` objects have methods and defaults that are useful in the UI. Here we listen to changes in `exampleData` even though we don't actually do anything with it...                                                                                                                                                                                                                                                                                                                                            | `exampleData`                                       | Contains all loaded data as proper objects.                                                                                                                                                                                                                                                                                                                                  | `allQuestionCategories`: An array of `QuestionCategory` objects with their contained `Question` objects included.                                                                                                                                                            |
| `availableExamples` |  `Readable<DataObjectCollection<Example>>` | 1. This derived store filters the objects based on the effective app state. <br>2. From now on, the objects are also a bit clunkily contained in a `DataObjectCollection`, which allows to easy access (with `{#each $availableExamples.items}`) and other helpful methods.                                                                                                                                                                                                                                                                                                                                                                                                     | `allExamples`, `effectiveSettings`                  | Contains the subset of all objects that can be shown to the user for selection. These are usually filtered based on selected `constituencyIds` and `electionIds`.                                                                                                                                                                                                            | `availableQuestionCategories`: A `DataObjectCollection` with all the question categories that can be shown to the user for selection. At this point any filtering by the user's selected constituency is done and categories with no questions after filtering are excluded. |
| `visibleExamples`   | `Readable<DataObjectCollection<Example>>`  | This derived store filters the available objects based on transient app state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `availableExamples`, `effectiveTemporaryChoices`    | Contains the objects that are actually shown in the UI to the user, based on their selections. The main difference between this and `availableExamples` is that anything that depend on `visibleExamples` should not incur further (SSR) data loading. Also, this store is immediately dependent only on `effectiveTemporaryChoices`, which do not persist between sessions. | `visibileQuestionCategories`: The question categories the user has selected to answer from the available ones.                                                                                                                                                               |

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

3. `/elections/e1/constituencies/+layout.server.ts` loads the constituency categories data and also adds the route param to the page data. **NB.** We might already pass the electionIds to the data provider call to not load unnecessary constituency categories. Also, the route params could be accessed in the svelte files as well.

```
  return {
    constituencyCategoriesData = await dataProvider.getConstituencyCategoriesData(),
    selectedElectionIds: params.electionIds.split(','),
  };
```

4. `/elections/e1/constituencies/+layout.svelte` updates the relevant stores.

```
  $constituencyCategoriesData = data.constituencyCategoriesData;
  $sessionData.temporaryChoices.selectedElectionIds = data.selectedElectionIds;
```

5. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/+layout.server.ts` loads the necessary question templates, question categories and questions data as well as passes the selected constituency ids (`cg1-c2,cg2-c1`) in the data. **NB.** We might include the questions in the question categories load, there isn't much point in getting them seprarately. Also, the route params could be accessed in the svelte files as well.

```
  const constituencyIds = params.constituencyIds.split(',');
  const questionTemplatesData = await dataProvider.getQuestionTemplatesData();
  const questionCategoriesData = await dataProvider.getQuestionCategoriesData({constituencyId: constituencyIds});
  const questionIds = questionCategoriesData.map(c => c.questionIds ?? []).flat();
  const questionsData = await dataProvider.getQuestionsData({id: questionIds});
  return {
    questionTemplatesData,
    questionCategoriesData,
    questionsData,
    selectedConstituencyIds: constituencyIds,
  };
```

6. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/+layout.svelte` updates the relevant stores.

```
  $questionTemplatesData = data.questionTemplatesData;
  $questionCategoriesData = data.questionCategoriesData;
  $questionsData = data.questionsData;
  $userData.constituencyIds = data.selectedConstituencyIds;
```

7.  `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/+layout.ts` just adds the selected question category ids to page data.

```
  return {
    selectedQuestionCategoryIds: params.questionCategoryIds.split(',');
  }
```

8. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/+layout.svelte` just updates the relevant store.

```
  $sessionData.temporaryChoices.selectedQuestionCategoryIds = data.selectedQuestionCategoryIds;
```

9. `/elections/e1/constituencies/cg1-c2,cg2-c1/questions/qc2/question/q4/+page.svelte` finally shows the current question `q4` using `$lib/stores/visibleQuestions`. Hurrah!

## To do

1. Make a global goto function and combine that with SSR param checks with redirects (e.g. at .../questions/+layout.server.ts)
2. Add a Voter object to DataRoot
3. Handle overlapping Constituency categories and test fragments!
4. Extend filterItems to use ancestor props, such as, Election.id
5. Maybe change QuestionCategoryData to contain Questions within just as with ConstituencyCategoryData
6. Enable tree-type provision of Answer and Nomination data
7. Handle recursive Constituencies
8. Tests!!!
9. Move 'available' filtering to DataRoot, possibly providing an auto-filter that uses electionIds and constituencyIds stored in the root
10. Add clear to localStorage and automatically clear sessionData after a timeout
11. Docs: Answer data may be skipped if it was already provided with the candidates
12. Add a way to remove items from DataObjectList
13. Figure out a way to remove the Nomination.id confusion
14. Enable simple lists of names for OrganizationNominations if they use closed lists
15. Enable setting of Nomination Data before Entities, maybe add a cacheble entity-getter in Nomination and remove Entity from constructor params? Maybe store all objects as dicts in the DataRoot and always use id-based getters for linked objects
16. Add a warning if selected constituency and election do not overlap
17. Filter is problematic now, bc the logic is iffy with empty values. This should be made more explicit.
    - The default rule translates now to `inOrEmpty`. We could add a fully-specified format thusly and just use union over the different rules to compute the result.

```
type FilterValue<T> = T | T[] |
{
  inOrEmpty?: T[],
  in?: T[],
  notIn?: T[],
  notEmpty?: boolean
}
```

13. Add simplified schema for DataProvider, where Nomination may omit electionId and constituencyId. Maybe automatically figure this out in the DataRoot based on the number of elections etc.
14. Check for name order in Person.name getter
15. In the future, DataObjectList could also return a Promise if data is lazily loaded
16. Defined module structure: vaa-matching, vaa-data, vaa-svelte, vaa-backend, vaa-candapp
17. How to make vaa-data such that it does not depend on vaa-matching?
18. Create api endpoints that expose the `DataProvider` calls if we need to load something from the client side
