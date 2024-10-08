# shared

Shared component between the frontend and backend, e.g. shared password validation as well as types and utilities related to the matching algorithm that need to be synced between different submodules.

## Development

In order to build ESM and CommonJS versions of the module in its directory run:

```bash
yarn build
```

...or from the project's root directory:

```bash
yarn workspace vaa-shared build
```

Currently ESM version is used by `vaa-frontend` and CommonJS by `backend/vaa-strapi` modules.

The ideation behind this hybrid module solution, as well as different approaches which did not work, are described in [this article](https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html).
