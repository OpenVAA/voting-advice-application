# Accessing data and state management

The overall model for loading and writing data and managing the application state is as follows.

1. External data is loaded (and written) using the [Data API](#data-api). The API is accessed by universal `load` functions in `+layout.ts` files, the `Context`s or some API routes.
   - Depending on [settings](../../packages/app-shared/src/settings/staticSettings.type.ts), either a Strapi backend is accessed or data is read from local `json` files.
2. The loaded data is passed to the `dataRoot` store accessible via the `DataContext` and converted into functional objects using the [`@openvaa/data` model](../../packages/data/).
   - All pages, some other [contexts](contexts.md) and [dynamic components](./components.md) can access the `DataContext`.
   - Some data in the Candidate App is contained in a `UserDataStore` instead of the `dataRoot` store.
3. All other shared stores are contained in [contexts](./contexts.md).
   - Some contexts are globally available and some to only certain parts of the application.

## Example: loading cascade for the `/(voter)/(located)/questions` route {#example}

Below is description of the data loading, provision and context initialisation cascade for the `/(voter)/(located)/questions/+page.svelte` page, which displays an introduction to the questions and possible `QuestionCategory` selection. See the individual files for more details.

- The `(located)` virtual route folder contains a layout that loads the `Entity`, `Nomination` and `QuestionData` that are relevant to the selected `electionId`s and `constituencyId`s, which are either stores in search parameters or implied, e.g. when there’s only on `Election`.

The basic paradigm is (from top to bottom):

- `+page.svelte` files access VAA data via the `dataRoot: Readable<DataRoot>` store contained in `DataContext` or derived stores using it.
- `+layout.svelte` files await for the data loaded by universal `load` functions and provide it to the `dataRoot` store. `DataRoot` converts the data into fully-fletched data objects with methods etc.
- `+layout.ts` universal loaders import a `DataProvider` from `$lib/api/dataProvider` and use it to get data as promises.
- `$lib/api/dataProvider` exports the correct `DataProvider` implementation based on the configuration.
- The specific `DataProvider` implementations may either
  - directly access the database, or
  - if they can only run on the server circulate the calls via the generic `ApiRouteDataProvider`—`/routes/api/data/[collection]/+server.ts`—`$lib/server/_api/serverDataProvider` chain, the last part of which exports the correct `ServerDataProvider` implementation.
- If the `PUBLIC_CACHE_ENABLED` env variable is set, the either adapters `fetch` requests are rerouted via the cache route (`/routes/api/cache/server.ts`). This is handled by the [`UniversalAdapter.fetch`](/frontend/src/lib/api/base/universalAdapter.ts), which the providers use internally.

The process is described in the flowchart below.

```mermaid
---
title: Data loading cascade for the /(voter)/(located)/questions route
---
flowchart TD

%% Block Definitions

PAGE["Questions Intro Page
/routes/[lang]/(voters)/(located)/+page.svelte
Displays an introduction to the questions and possible QuestionCategory selection"]:::svelte

LAYOUT_SV_LOC["Located Layout
/routes/[lang]/(voters)/(located)/+layout.svelte
Receives the promised data and provides it to dataRoot.
Shows an error if data is not available."]:::svelte

LAYOUT_TS_LOC["Located Layout Loader
/routes/[lang]/(voters)/(located)/+layout.ts
Universally loads questionData and nominationData for the constituencyIds and electionIds in the search params.
If the params are not set or cannot be implied, redirects to the relevant selection pages."]

LAYOUT_SV_VOT["Voter Layout
/routes/[lang]/(voters)/+layout.svelte
Receives the promised data and provides it to dataRoot.
Shows an error if data is not available.
Initiates the App and VoterContexts."]:::svelte

LAYOUT_TS_VOT["Voter Layout Loader
/routes/[lang]/(voters)/+layout.ts
Universally loads electionData, constituencyData, appSettingsData and appCustomizationData."]

LAYOUT_SV_ROOT["Outermost Layout
/routes/[lang]/+layout.svelte
Initializes the I18n, Data and ComponentContexts."]:::svelte

CTX_VOTER["VoterContext
$lib/api/contexts/voter"]:::ctx

CTX_APP["AppContext
$lib/api/contexts/app"]:::ctx

CTX_COMP["ComponentContext
$lib/api/contexts/component"]:::ctx

CTX_VAA["DataContext
$lib/api/contexts/vaaData"]:::ctx

CTX_I18N["I18nContext
$lib/api/contexts/i18n"]:::ctx

DP["DataProvider
$lib/api/dataProvider.ts
Imports the correct DataProvider implementation"]

DP_STRAPI["$lib/api/adapters/strapi/provider/strapiDataProvider.ts
A specific implementation to connect to a Strapi backend"]

DP_API["$lib/api/adapters/apiRoute/provider/apiRouteDataProvider.ts
A generic wrapper for all DataProvider implementations
that rely on the server and are, thus, accessible via the API routes"]

UDA_STRAPI["UniversalDataProvider.fetch()
$lib/api/base/universalDataAdapter.ts
Wraps the fetch method used for requests,
possibly redirecting requests to the cache."]

CACHE_STRAPI["/routes/api/cache/+server.ts"]:::ssr

UDA_API["UniversalDataProvider.fetch()
$lib/api/base/universalDataAdapter.ts
Wraps the fetch method used for requests,
possibly redirecting requests to the cache."]

CACHE_API["/routes/api/cache/+server.ts"]:::ssr

DATA_API_ROUTE["/routes/api/data/[collection]/+server.ts
A generic API route (GET) request handler,
which loads the data using DataProvider<'server'>"]:::ssr

%% Connections

PAGE---|"getVoterContext"|CTX_VOTER
PAGE-.-|"In &lt;slot&gt; of"| LAYOUT_SV_LOC

subgraph Layouts
LAYOUT_SV_LOC---|"export let data"| LAYOUT_TS_LOC
LAYOUT_SV_LOC-.-|"In &lt;slot&gt; of"| LAYOUT_SV_VOT
LAYOUT_SV_VOT---|"export let data"| LAYOUT_TS_VOT
LAYOUT_SV_VOT-.-|"In &lt;slot&gt; of"| LAYOUT_SV_ROOT
end

subgraph Contexts
CTX_VOTER---|"includes"| CTX_APP
CTX_APP---|"includes"| CTX_VAA
CTX_APP---|"includes"| CTX_COMP
CTX_COMP---|"includes"| CTX_I18N
end

%% CTX_VOTER-.-|"Initiated by"| LAYOUT_SV_VOT
LAYOUT_SV_VOT---|"$dataRoot.provideElectionData
$dataRoot.provideConstituencyData"| CTX_VAA
LAYOUT_SV_LOC---|"$dataRoot.provideQuestionData
$dataRoot.provideNominationData"| CTX_VAA
CTX_APP---|"Gets appSettingsData and appCustomizationData via $page.data from"| LAYOUT_TS_VOT
%% CTX_APP-.-|"Initiated by"| LAYOUT_SV_VOT
%% CTX_COMP-.-|"Initiated by"| LAYOUT_SV_ROOT
%% CTX_I18N-.-|"Initiated by"| LAYOUT_SV_ROOT

LAYOUT_TS_LOC---|"getQuestionData
getNominationData"| DP
LAYOUT_TS_VOT---|"getAppSettingsData
getAppCustomizationData
getElectionData
getConstituencyData"| DP

%% Data Provider roots

subgraph DataProviders
DP
---|"import depending on appSettings"|DP_STRAPI
---|"_getElectionData"|UDA_STRAPI
---|"fetch()"|STRAPI["Strapi backend"]:::ssr;

UDA_STRAPI
---|"if cache is enabled"|CACHE_STRAPI
---|"fetch() and cache"|STRAPI["Strapi backend"]:::ssr;

DP
---|"import depending on appSettings"|DP_API
---|"_getElectionData"|UDA_API
---|"fetch()"|DATA_API_ROUTE
---|"getElectionData etc."|DP_SERVER["$lib/server/api/dataProvider.ts
Imports the correct DataProvider<'server'> implementation"]:::ssr
---|"import depending on appSettings"|DP_SERVER_LOCAL["$lib/server/api/adapters/local/provider/localServerDataProvider.ts
A specific implementation to read locally saved json files."]:::ssr
---|"_getCandidatesData etc. → read()"|JSON["${LOCAL_DATA_DIR}/candidates.json"]:::ssr;

UDA_API
---|"if cache is enabled"|CACHE_API
---|"fetch() and cache"|DATA_API_ROUTE


end


subgraph Legend
L1["Svelte component"]:::svelte
L2["Context"]:::ctx
L3["SSR-only"]:::ssr
L4["Other module"]
end

classDef ctx fill:#afa
classDef svelte fill:#aaf
classDef ssr fill:#faa
```

\* The AppContext and its associated data will be loaded by the outermost layout and in the future when the Candidate App is refactored.
