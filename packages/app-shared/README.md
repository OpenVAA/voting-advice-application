# `@openvaa/app-shared`: Common settings and utilities shared by the frontend and backend

A module shared between `@openvaa/frontend` and (potentially) backend consumers, which contains:

- The [application settings](./src/settings/)
- Definitions for data types extending those defined in the `@openvaa/core` and `@openvaa/data` modules, such as [`CustomData`](./src/data/customData.type.ts) and [`Localized`](./src/data/extendedData.type.ts) types
- Utilities for [password validation](./src/utils/passwordValidation.ts) and [deep merge of settings](./src/utils/mergeSettings.ts)

## Development

In order to build ESM and CommonJS versions of the module in its directory run:

```bash
yarn build
```

...or from the project's root directory:

```bash
yarn workspace @openvaa/app-shared build
```

## Dual ESM + CommonJS build

The package builds to both ESM and CommonJS via `tsup` (`format: ['esm', 'cjs']`). The ESM output is consumed by all current in-repo consumers (`@openvaa/frontend`, `@openvaa/dev-seed`, etc., all `type: module`). The CommonJS output is preserved as a future-compatibility hedge — if a downstream consumer (e.g., a future Edge Function rewrite or external integration) requires CJS resolution, the artifact is already produced. The `main` field in `package.json` resolves to `./dist/index.cjs` for any Node.js process that falls back to the legacy resolution path.

The ideation behind this hybrid module solution, as well as different approaches which did not work, are described in [this article](https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html).
