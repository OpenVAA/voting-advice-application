# Frontend app separation

The frontend apps for voters and candidates (and VAA admins in the future) use the same `frontend` module with lots of shared components, utilities and styling. However, the routes and certain functions of the Candidate App are best kept separate from the voter app.

## Routes

Use the `/candidate` route for the Candidate App. Note that the root folder may change in the future to, e.g. `candidate-app`, so make any references to that either based on a shared constant or use `$page.url` to build routes.

## Stores and other utilities

Use the `$candidate` and `$voter` custom import paths for imports that are exclusively for use in either app. These map to `/src/lib/candidate` and `/src/lib/voter` respectively. Note that these folders may be later moved out of `/src/lib`, so make sure to always use the shorthand paths, e.g. `$candidate` instead of `$lib/candidate`.

## Translations

Use Strapi's `App Labels` content type for localizable texts, i.e. anything shown to the user (with the exception of question labels and the like, which are defined in `Question` and `Question Type` objects). Create a new block `candidateApp` and place any strings related to the Candidate App in it. Also, update the `AppLabels` [type definitions](../../frontend/src/lib/types/global.d.ts) in the frontend, which currently are not automatically kept up-to-date with Strapi.

NB. In many parts of the Voter App and some components, the `$_()` function from `svelte-i18n` is still used for localisation. Most of these will be converted to use the `$page.data.appLabels` format in the very near future.
