# `@openvaa/app-shared`: Common settings and utilities shared by the frontend and backend

A module shared between `@openvaa/frontend` and `@openvaa/strapi`, which contains:

- The [application settings](./src/settings/)
- Definitions for data types extending those defined in the `@openvaa/core` and `@openvaa/data` modules, such as [`CustomData`](./src/data/customData.type.ts) and [`Localized`](./src/data/extendedData.type.ts) types
- Utilities for [password validation](./src/utils/passwordValidation.ts)

## Development

In order to build ESM and CommonJS versions of the module in its directory run:

```bash
yarn build
```

...or from the project's root directory:

```bash
yarn workspace @openvaa/app-shared build
```

Currently ESM version is used by `@openvaa/frontend` and CommonJS by `@openvaa/strapi` modules.

The ideation behind this hybrid module solution, as well as different approaches which did not work, are described in [this article](https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html).
