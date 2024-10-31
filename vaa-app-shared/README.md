# `vaa-app-shared`: Common settings and utilities shared by the frontend and backend

A module shared between `vaa-frontend` and `vaa-strapi`, which contains:

- The [application settings](./src/settings/)
- Utilities for [password valiation](./src/utils/passwordValidation.ts)

## Development

In order to build ESM and CommonJS versions of the module in its directory run:

```bash
yarn build
```

...or from the project's root directory:

```bash
yarn workspace vaa-app-shared build
```

Currently ESM version is used by `vaa-frontend` and CommonJS by `backend/vaa-strapi` modules.

The ideation behind this hybrid module solution, as well as different approaches which did not work, are described in [this article](https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html).
