# Data loading

## Loading cascade

Below is description of the data cascade on the `/_test/` route. See the individual files for more details.

The basic paradigm is:

- `+page.svelte` files access election data (questions, candidates etc.) via the `vaa-data: DataRoot` store contained in `GlobalContext` (retrieved with `$lib/_contexts/global: getGlobalContext()`).
- `+layout.svelte` files await for the data loaded by universal `+layout.ts` loaders and provide it to the `GlobalContext.vaaData` `DataRoot`. The `DataRoot` converts the data into fully-fletched data objects with methods etc.
- `+layout.ts` universal loaders import a `DataProvider` from `$lib/_api/dataProvider` and use it to get data as promises.
- `$lib/_api/dataProvider` exports the correct `DataProvider` implementation based on the configuration.
- The specific `DataProvider` implementations may either
  - directly access the database, or
  - if they can only run on the server circulate the calls via the generic `ApiRouteDataProvider`—`/routes/api/data/[collection]/+server.ts`—`$lib/server/_api/serverDataProvider` chain, the last part of which exports the correct `ServerDataProvider` implementation.

The whole process is described in the flowchart.

```mermaid
---
title: Data cascade for the /_test/ route
---
flowchart TD

  A["/routes/[lang]/(voters)/_test/+page.svelte
  Displays the data accessible via the vaaData store of the global context.
  NB. Candidate.name is a getter method only available in proper Candidate objects."]
  ---|"const {vaaData} = getGlobalContext();
  {#each $vaaData.candidates as candidate}
    {candidate.name}
  {/each}"|A2["$lib/_api/contexts/global.ts
  Contains all stores common to all applications, specifically:
  { vaaData: Writable&lt;DataRoot&gt; }"]
  ---|"Provided data from +layout.svelte,
  which is converted by vaaData.provideCandidateData(data: CandidateData[])
  from CandidateData POJOs to Candidate objects"|B["/routes/[lang]/(voters)/_test/+layout.svelte
  Receives the promised data loaded by +layout.ts and provides it
  to vaaData in the global context."];

  B
  ---|"export let data;
  const {candidatesData} = data;
  const {vaaData} = getGlobalContext()
  candidatesData.then(d => $vaaData.provideCandidateData(d))"|C["/routes/[lang]/(voters)/_test/+layout.ts
  Universal loader loads the data using DataProvider
  (agnostic to the implementation defined in config)."]
  ---|"const provider = await dataProvider;
  return { candidatesData: provider.getCandidatesData() }"|D["$lib/_api/dataProvider.ts
  Imports lazily the correct DataProvider implementation based on config
  and exports is as a promise resolving to `{ dataProvider: DataProvider }`."];

  D
  ---|"import depending on /$lib/_config/config.ts"|E["$lib/_api/providers/strapi/strapiDataProvider.ts
  A specific implementation to connect to a Strapi backend"]
  ---|"getCandidatesData() → fetch()"|F["Strapi backend"];

  D
  ---|"import depending on /$lib/_config/config.ts"|G["$lib/_api/providers/apiRoute/apiRouteDataProvider.ts
  A generic wrapper for all DataProvider implementations
  that rely on the server and are, thus, accessible via the API routes"]
  ---|"getCandidatesData() → fetch()"|H["/routes/api/data/[collection]/+server.ts
  A generic API route (GET) request handler,
  which loads the data using ServerDataProvider
  (agnostic to the implementation defined in config,
  but returns an error if the config doesn't support server loading*)"]:::ssr
  ---|"serverDataProvider.getCandidatesData()"|I["$lib/server/_api/providers/serverDataProvider.ts
  Imports lazily the correct ServerDataProvider implementation based on config
  and exports is as a promise resolving to `{ serverDataProvider: ServerDataProvider }`."]:::ssr
  ---|"import depending on /$lib/_config/config.ts"|J["$lib/server/_api/providers/local/localServerDataProvider.ts
  A specific implementation to read locally saved json files."]:::ssr
  ---|"getCandidatesData() → read()"|K["/data/candidates.json"]:::ssr;

  classDef ssr fill:#f96
```

Files on orange background are only accessible on the server.

\* This could actually be changed so that the universal DataProvider would be used instead, because it might be useful to always expose the API routes.
