## WHY:

- Advances #249
- Advances #513
- Advances #529
- Advances #536
- Advances #537

## What has been changed (if possible, add screenshots, gifs, etc. )

Prepares for refactoring data API connections, state management and the internal data model.

The proposed new modules are all prefixed with an underscore.

# Trying out

1. Navigate to `/_test/`
2. Select an election
3. Select a constituency
4. Edit the mock answer to see (random) updates in the matches
5. Edit the options in `$lib/_config/config.ts`. Valid options for `adapter` are 'local' and 'strapi'

# Data loading

## Loading cascade

Below is description of the data cascade on the `/_test/[electionId]/[constituencyId]` route. See the individual files for more details.

The basic paradigm is:

- `+page.svelte` files access election data (questions, candidates etc.) via the `vaa-data: DataRoot` store contained in `VaaDataContext` or contexts subsuming it.
- `+layout.svelte` files await for the data loaded by universal `+layout.ts` loaders and provide it to the `VaaDataContext.vaaData` `DataRoot` store. The `DataRoot` converts the data into fully-fletched data objects with methods etc.
- `+layout.ts` universal loaders import a `DataProvider` from `$lib/_api/dataProvider` and use it to get data as promises.
- `$lib/_api/dataProvider` exports the correct `DataProvider` implementation based on the configuration.
- The specific `DataProvider` implementations may either
  - directly access the database, or
  - if they can only run on the server circulate the calls via the generic `ApiRouteDataProvider`—`/routes/api/data/[collection]/+server.ts`—`$lib/server/_api/serverDataProvider` chain, the last part of which exports the correct `ServerDataProvider` implementation.

The whole process is described in the flowchart below.

```mermaid
---
title: Data cascade for the `/_test/[electionId]/[constituencyId]` route
---
flowchart TD

  %% Block Definitions

  PAGE["Nominations Page
  /routes/[lang]/(voters)/_test/[electionId]/[constituencyId]/+page.svelte
  Displays the candidates nominated for the selected election in the selected constituency."]:::svelte

  LAYOUT_SV_C["Constituency Layout
  /routes/[lang]/(voters)/_test/[electionId]/[constituencyId]/+layout.svelte
  Receives the promised data and provides it"]:::svelte

  LAYOUT_TS_C["Constituency Layout Loader
  /routes/[lang]/(voters)/_test/[electionId]/[constituencyId]/+layout.ts
  Universally loads NominationData[] for the constituency
  and election in the route params"]

  LAYOUT_SV_E["Election Layout
  /routes/[lang]/(voters)/_test/[electionId]/+layout.svelte
  Receives the promised data and provides it"]:::svelte

  LAYOUT_TS_E["Election Layout Loader
  /routes/[lang]/(voters)/_test/[electionId]/+layout.ts
  Universally loads ConstituencyData[] for the election in the route param"]

  LAYOUT_SV["Outermost Layout
  /routes/[lang]/(voters)/_test/+layout.svelte
  Receives the promised data and provides it"]:::svelte

  LAYOUT_TS["Outermost Layout Loader
  /routes/[lang]/(voters)/_test/+layout.ts
  Universally loads ElectionData[]"]

  CTX_VOTER["VoterContext
  $lib/_api/contexts/voter"]:::ctx

  CTX_APP["AppContext
  $lib/_api/contexts/app"]:::ctx

  CTX_COMP["ComponentsContext
  $lib/_api/contexts/components"]:::ctx

  CTX_VAA["VaaDataContext
  $lib/_api/contexts/vaaData"]:::ctx

  CTX_I18N["I18nContext
  $lib/_api/contexts/i18n"]:::ctx

  DP["DataProvider
  $lib/_api/dataProvider.ts
  Imports lazily the correct DataProvider implementation based on config
  and exports is as a promise resolving to `{ dataProvider: DataProvider }`."]

  %% Connections

  PAGE---|"getVoterContext()"|CTX_VOTER
  PAGE-.-|"In &lt;slot&gt; of"| LAYOUT_SV_C

  subgraph Layouts
  LAYOUT_SV_C---|"Gets data.nominationsData"| LAYOUT_TS_C
  LAYOUT_SV_C-.-|"In &lt;slot&gt; of"| LAYOUT_SV_E
  LAYOUT_TS_C-.-|"Can access data"| LAYOUT_TS_E

  LAYOUT_SV_E---|"Gets data.constituenciesData"| LAYOUT_TS_E
  LAYOUT_SV_E-.-|"In &lt;slot&gt; of"| LAYOUT_SV
  LAYOUT_TS_E-.-|"Can access data"| LAYOUT_TS

  LAYOUT_SV---|"Gets data.electionsData"| LAYOUT_TS
  end

  subgraph Contexts
  CTX_VOTER---|"getAppContext()"| CTX_APP
  CTX_APP---|"getVaaDataContext()"| CTX_VAA
  CTX_APP---|"getI18nContext()"| CTX_I18N
  CTX_COMP---|"getI18nContext()"| CTX_I18N
  end

  CTX_VOTER---|"Provided nominationsData and candidatesData by*
  constituencyId store set by"| LAYOUT_SV_C
  CTX_VOTER---|"Initiated by
  Provided constituencyData by*
  electionId store set by"| LAYOUT_SV_E
  CTX_VAA---|"Initiated by
  Provided electionData by"| LAYOUT_SV
  CTX_I18N---|"Initiated by"| LAYOUT_SV

  LAYOUT_TS_C---|"(await dataProvider).getNominationsData()"| DP
  LAYOUT_TS_E---|"(await dataProvider).getConstituenciesData()"| DP
  LAYOUT_TS---|"(await dataProvider).getElectionsData()"| DP



  %% Data Provider roots

  subgraph DataProviders
  DP
  ---|"import depending on /$lib/_config/config.ts"|DP_STRAPI["$lib/_api/adapters/strapi/provider/strapiDataProvider.ts
  A specific implementation to connect to a Strapi backend"]
  ---|"getCandidatesData() → fetch()"|STRAPI["Strapi backend"]:::ssr;

  DP
  ---|"import depending on /$lib/_config/config.ts"|DP_API["$lib/_api/adapters/apiRoute/provider/apiRouteDataProvider.ts
  A generic wrapper for all DataProvider implementations
  that rely on the server and are, thus, accessible via the API routes"]
  ---|"getCandidatesData() → fetch()"|API["/routes/api/data/[collection]/+server.ts
  A generic API route (GET) request handler,
  which loads the data using ServerDataProvider
  (agnostic to the implementation defined in config,
  but returns an error if the config doesn't support server loading**)"]:::ssr
  ---|"serverDataProvider.getCandidatesData()"|DP_SERVER["$lib/server/_api/serverDataProvider.ts
  Imports lazily the correct ServerDataProvider implementation based on config
  and exports is as a promise resolving to `{ serverDataProvider: ServerDataProvider }`."]:::ssr
  ---|"import depending on /$lib/_config/config.ts"|DP_SERVER_LOCAL["$lib/_api/adapters/localServer/provider/localServerDataProvider.server.ts
  A specific implementation to read locally saved json files."]:::ssr
  ---|"getCandidatesData() → read()"|JSON["/data/candidates.json"]:::ssr;
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

\* The data are provided to the `dataRoot` or its descendants which `VoterContext` gets from `VaaDataContext`.
\*\* This could actually be changed so that the universal DataProvider would be used instead, because it might be useful to always expose the API routes.

## Contexts

| Context      |  Consumer                                             | Depends on         | Contents                                                                                            | Initiated by        |
| ------------ | ----------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- | ------------------- |
| `i18n`       | Other contexts                                        | —                  | `t`, `locale`, `locales` from `$lib/i18n`                                                           | `/[lang]`           |
| `vaa-data`   | Other contexts                                        | `i18n`             | `Readable<dataRoot>`                                                                                | `/[lang]`           |
| `components` | Any component\*                                       | `i18n`             | Contents of `i18n` for now                                                                          | `/[lang]`           |
| `app`        | Any part of the app or dynamic components             | `i18n`, `vaa-data` | Contents of `i18n` and `vaa-data`                                                                   | `/[lang]`           |
| `voter`      | Any part of the Voter App or voter components         | `app`              | Contents of `app` and voter-specific stores, such as `answers`, `constituencyId` and `constituency` | `/[lang]/(voter)`   |
| `candidate`  | Any part of the Candidate App or candidate components | `app`              | Contents of `app` and candidate-specific functions, such as `DataWriter` API methods                | `/[lang]/candidate` |

\* `ComponentContext` should be imported in such a way that another context that implements the same functions can easily be provided if the components are used elsewhere.

## Route parameters

The user selections in the Voter app are store in route params. When the user has selected election 1 and constituency 2 and is using the app in English, the route is:

`/en/_test/1/2`

NB. In the future, multiple election selection needs to be implemented, in which case the route might be `/en/_test/1,2/3`. The possible issue in this case is that the ids cannot contain commas. A more robust option might be to add folders so that the route becomes:

`/en/_test/election/1/2/constituency/3`

This will make the server folder structure a bit cumbersome, and we still would need to disallow `constituency` as an id, but maybe that's okay.

# Further Considerations

## API Services

All external connections from the frontend can be configured in the (static) settings in `/_config`.

The configuration defines which adapters to use for the various functions of the app, of which some are optional.

| Service           | Optional                   | Notes                                                                                    |
| ----------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| `DataProvider`    | Required                   |  All (readonly) connections to the backend that both the Voter and Candidate apps need   |
| `FeedbackWriter`  | Optional                   |  Write (and limited read) connection to the backend for writing and reading feedback     |
| `DataWriter`      | Required for Candidate App | All write and authenticated read connections to the backend that the Candidate app needs |
| `AnalyticsWriter` | Optional                   | All write connections to an analytics service                                            |

The API service are collected in the `$lib/_api` folder by adapter.

> Only the ones marked with \* are in this PR.

```
_api
  adapters
    local
      (common files)
      provider *
      writer
      feedback
    strapi
      (common files)
      provider *
      writer
      feedback
    umami
      analytics
  dataProvider.ts (API entry point)
  serverDataProvider.server.ts (API route entry point)
```

## `Match`, `Nomination`, wrapped and naked `Entity`

Entity cards, details and lists should accept `Entities` either in their naked form or possibly under multiple wraps.

> The current PR does not yet implement the code below, but it will be necessary if this paradigm is accepted.

```ts
type MaybeWrappedEntity<TEntity extends Entity = Entity> =
  | TEntity
  | Match<TEntity>
  | Nomination<TEntity>
  | Match<Nomination<TEntity>>;

interface EntityCardProps<TEntity extends Entity = Entity> {
  content: MaybeWrappedEntity<TEntity>;
}

function parseEntity<TEntity extends Entity = Entity>(
  maybeWrapped: MaybeWrappedEntity<TEntity>
): ParsedEntity<TEntity> {
  let entity: TEntity | undefined = undefined;
  let nomination: Nomination<TEntity> | undefined = undefined;
  let match: Match<TEntity> | Match<Nomination<TEntity>> | undefined = undefined;
  let current: MaybeWrappedEntity<TEntity> = maybeWrapped;
  while (current) {
    if (current instanceof Match) {
      match = current;
      current = match.entity;
    } else if (current instanceof Nomination) {
      nomination = current;
      current = match.entity;
    } else if (current instanceof Entity) {
      entity = current;
      break;
    } else {
      throw new Error(`Unknown entity or wrapper type: ${current.prototype.name}`);
    }
  }
  if (!entity) throw new Error('No entity found in wrapped entity');
  return {
    entity,
    nomination,
    match
  };
}

type ParsedEntity<TEntity extends Entity = Entity> = {
  entity: TEntity;
  nomination: Nomination<TEntity> | undefined;
  match: Match<TEntity> | Match<Nomination<TEntity>> | undefined;
};
```

## Localized data for Candidate App

We might not need to deal with locales in `vaa-data` at all, because what we're mostly concerned is the possibility of using `DataProvider` to get data without translating it.

> Not yet implemented in this PR.

```ts
export interface DataWriter {
  /**
   * An extended version of the DataProvider method. We could also just
   * expand the DataProvider implementation to cover this.
   */
  getCandidatesData<TLocale extends string | undefined | null>({
    locale
  }: {
    locale: TLocale;
  }): TLocale extends string ? CandidateData[] : Localized<CandidateData[]>;
  // If `locale` is not defined, do not translate the object
}

/**
 * Convert the `string` types in `TData` (usually a `vaa-data` `DataObjectData`
 * type) to `LocalizedString` with the exception of id references.
 */
export type Localized<TData> = {
  [Key in keyof TData]: Key extends IdProp
    ? TData[Key]
    : TData[Key] extends string
      ? LocalizedString | string
      : TData[Key];
};

/**
 * Rererence to another object by id or this object's own id.
 * @example 'id', 'candidateId', 'constituencyIds'
 */
type IdProp = 'id' | `${string}Id` | `${string}Ids`;
```

## TODO

- Consider electionId and constituencyId for NominationData
- Convert `vaa-matching` `entity` to `target`
- Locale change for dataRoot: check duplicate updates on server, check invalidate bc cached Promises seem to be returned when changing locale back to an earlier one => consider whole locale change logic

## Check off each of the following tasks as they are completed

- [ ] I have reviewed the changes myself in this PR. Please check the [self-review document](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/contributing/self-review.md)
- [ ] I have added or edited unit tests.
- [ ] I have run the unit tests successfully.
- [ ] I have run the e2e tests successfully.
- [ ] I have tested this change on my own device.
- [ ] I have tested this change on other devices (Using Browserstack is recommended).
- [ ] I have tested my changes using the [WAVE extension](https://wave.webaim.org/extension/)
- [ ] I have added documentation where necessary.
- [ ] Is there an existing issue linked to this PR?

**Clean up your git commit history before submitting the pull request!**
