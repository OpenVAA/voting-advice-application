# `@openvaa/app-shared`: Common settings and utilities shared by the frontend and backend

A module shared between `@openvaa/frontend` and (potentially) backend consumers, which contains:

- The [application settings](./src/settings/)
- Definitions for data types extending those defined in the `@openvaa/core` and `@openvaa/data` modules, such as [`CustomData`](./src/data/customData.type.ts) and [`Localized`](./src/data/extendedData.type.ts) types
- Utilities for [password validation](./src/utils/passwordValidation.ts) and [deep merge of settings](./src/utils/mergeSettings.ts)

## Development

To build the package in its directory run:

```bash
yarn build
```

...or from the project's root directory:

```bash
yarn workspace @openvaa/app-shared build
```

## Build target

ESM-only via `tsup`. All current in-repo consumers (`@openvaa/frontend`, `@openvaa/docs`, `@openvaa/dev-seed`, `@openvaa/argument-condensation`, `@openvaa/llm`) declare `"type": "module"`. No `require()` consumers exist in the workspace; Supabase Edge Functions do not import from this package. The historic dual ESM+CommonJS build was added to support `apps/strapi/`, which has been retired.

If a future consumer requires CommonJS, restore `format: ['esm', 'cjs']` in `tsup.config.ts` and the corresponding `main` / `exports.require` entries in `package.json`.
