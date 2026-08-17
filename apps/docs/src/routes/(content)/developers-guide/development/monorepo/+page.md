# Monorepo

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

The root [`package.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/package.json) contains scipts for many repo-wide tasks.

### Module resolution

#### IDE

In order to resolve cross `import`s between the monorepo modules Code uses TypeScript references, which are defined in the `tsconfig.json` files of the corresponding modules.

In other words, you DO NOT have to build the **dependee** modules in order for the IDE to resolve their `import`s within a **dependent** module or to pick up changes you make in the **dependee’s** `.ts` sources.

#### NPM/Node

When you use Yarn and during runtime NPM/Node module resolution mechanism is used instead. It relies on various pointers defined in `package.json` files of the corresponding modules (e.g. `main`, `module` or `exports`). These pointers usually refer to `build`/`dist` directory containing already transpiled TS sources of a given module (`.js` files). This directory subsequently gets symlinked by `yarn install` in a `node_modules` directory of a **dependent** module.

In other words, you DO have to build the **dependee** modules prior to running a **dependent** module or using Yarn on it, so that NPM/Node can find the transpiled `.js` sources and pick up changes you make in the original `.ts` code.

The `yarn dev` script automatically watches the packages for changes. If there are some, they will be rerebuilt and the frontend restarted to reflect the changes.
