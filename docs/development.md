# Development

You can run the whole application in Docker containers (frontend, backend, postgres database,and AWS local stack for developing), or run the frontend or backend separately depending on your preferences. Using the Docker image is recommended and the quickest way to set up the application. This guide assumes you’re using Docker.

## Requirements

- Yarn 4
- Docker (unless you plan to run the app outside of Docker)
- Node.js. Use the version specified under `engines` in the root [package.json](/package.json). Use of nvm is encouraged for Node version management
- Ports 1337, 5173 and 5432 should be free for the application if using default settings
  - These ports can be changed in the `.env` file if desired.

## Running the Development Environment

Make sure that you’re using the recommended Node version (see [Requirements](#requirements)) by running `node -v`. If needed set the correct version with `nvm use <VERSION>`.

First, install dependencies for all workspaces:

```bash
yarn install
```

To build and run development Docker images for the entire stack (frontend, backend and DB), in the project's root directory:

- Make a copy of the `.env.example` file and rename the copy as `.env`
- Run `yarn dev`
- If you run into errors, try checking the tips related to Docker in [Troubleshooting](troubleshooting.md#troubleshooting).

The `yarn dev` script will automatically build all the shared packages and start watching them for changes. If these change, they will be rerebuilt and the frontend restarted to reflect the changes.

To bring down the Docker stack properly (delete all containers, images and named volumes which include backend DB volume with potentially seeded mock data) run:

```bash
yarn dev:down
```

**When running the project in Docker, only use the `.env` file in project root. You usually
don't have to touch the separate .env files for frontend and backend.**

If you want to seed backend DB with mock data (e.g. for demostration, development or testing purposes purposes), please follow the instructions [here](backend.md#mock-data-generation).

### Hot Reloading the Backend

Development Docker images will listen to changes in the files and allow hot reloading, meaning the Docker images don't need to be re-generated after making changes to the codebase. Hot reloading is enabled by default in the frontend, but for backend this can be enabled by adding the volume `- ./:/opt` as a mounted point in [docker-compose.dev.yml](/backend/vaa-strapi/docker-compose.dev.yml) and re-building the Docker container. However, this can make the development process slow at times, so it is not recommended to keep that on unless doing direct development on the backend source code.

## Monorepo

All workspaces share a single `yarn.lock` file located at the project root but contain their own `tsconfig.json` and `package.json` files.

The workspaces can be addressed by yarn from any directory as follows:

```bash
yarn workspace [module-name] [script-name].
```

E.g., the `app-shared` module can be built by running:

```bash
yarn workspace @openvaa/app-shared build
```

In order to install dependencies for all modules and build all modules (although, you’d rarely want to this) run:

```bash
yarn install
yarn workspaces foreach -A build
```

When adding interdependencies between the modules, use yarn’s `workspace:` syntax:

```json
  "dependencies": {
    "@openvaa/core": "workspace:^"
  }
```

Also add a reference to the package’s `tsconfig.json` file (see more in [Module resolution](#module-resolution)):

```json
  "references": [{ "path": "../core/tsconfig.json" }]
```

The root [`package.json`](/package.json) contains scipts for many repo-wide tasks.

### Module resolution

#### IDE

In order to resolve cross `import`s between the monorepo modules Code uses TypeScript references, which are defined in the `tsconfig.json` files of the corresponding modules.

In other words, you DO NOT have to build the **dependee** modules in order for the IDE to resolve their `import`s within a **dependent** module or to pick up changes you make in the **dependee’s** `.ts` sources.

#### NPM/Node

When you use Yarn and during runtime NPM/Node module resolution mechanism is used instead. It relies on various pointers defined in `package.json` files of the corresponding modules (e.g. `main`, `module` or `exports`). These pointers usually refer to `build`/`dist` directory containing already transpiled TS sources of a given module (`.js` files). This directory subsequently gets symlinked by `yarn install` in a `node_modules` directory of a **dependent** module.

In other words, you DO have to build the **dependee** modules prior to running a **dependent** module or using Yarn on it, so that NPM/Node can find the transpiled `.js` sources and pick up changes you make in the original `.ts` code.

The `yarn dev` script automatically watches the packages for changes. If there are some, they will be rerebuilt and the frontend restarted to reflect the changes.

## Roadmap

- 2026/H1
  - Update to Svelte 5
  - Migrate backend from Strapi to Supabase
  - Update monorepo structure
- 2026/H2
  - Enable plugins or easier customisation of pages and main components
  - Multi-tenant model
