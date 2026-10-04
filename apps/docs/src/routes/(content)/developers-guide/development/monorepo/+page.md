# Monorepo and Turborepo

The repository is a set of Yarn workspaces: the root `package.json` declares `packages/*` and `apps/*` as workspaces. All of them share one `yarn.lock` at the root, and each has its own `package.json` and `tsconfig.json`. [Architecture](/developers-guide/architecture) lists the workspaces and how they depend on each other.

## Running a workspace's scripts

Yarn can run a script of any workspace from any directory:

```bash
yarn workspace <workspace-name> <script-name>
```

For example, to build `@openvaa/app-shared`:

```bash
yarn workspace @openvaa/app-shared build
```

The root [`package.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/package.json) holds the scripts for repository-wide tasks, such as the `dev:*` and `db:*` scripts described in [Running the development environment](/developers-guide/development/running-the-development-environment).

## Turborepo

The repository-wide build, lint, type-check and unit-test commands run through [Turborepo](https://turborepo.com), configured in [`turbo.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/turbo.json):

| Root command      | Turborepo task           | Ordering in `turbo.json`                                  |
| ----------------- | ------------------------ | --------------------------------------------------------- |
| `yarn build`      | `build`                  | builds a workspace's dependencies first (`^build`)        |
| `yarn typecheck`  | `typecheck`              | builds the workspace's dependencies first (`^build`)      |
| `yarn test:unit`  | `test:unit`              | builds the workspace itself first (`build`); never cached |
| `yarn lint:check` | `lint`, then more checks | lints a workspace's dependencies first (`^lint`)          |

`build` outputs (`build/` and `dist/`) are cached, so a second `yarn build` over unchanged sources is fast. `yarn lint:check` runs `turbo run lint` and then a chain of repository checks, including the type checks.

`yarn watch:shared` runs `turbo watch build` over the packages in `packages/` and rebuilds them when their sources change. `yarn dev` starts it for you.

## Adding a dependency between workspaces

Use Yarn's `workspace:` protocol in the dependent package's `package.json`:

```json
  "dependencies": {
    "@openvaa/core": "workspace:^"
  }
```

Also add a reference to the dependency's `tsconfig.json` in the dependent package's `tsconfig.json` (see [Module resolution](#module-resolution)):

```json
  "references": [{ "path": "../core/tsconfig.json" }]
```

## Module resolution

### In the IDE

The IDE resolves imports between workspaces through the TypeScript project references in each `tsconfig.json`. You do not need to build a package for the IDE to resolve its imports in another package, or to see changes you make to its `.ts` sources.

### At runtime

Node, Vite and the test runners resolve a workspace through the `exports` field of its `package.json`. For most packages under `packages/` (for example `@openvaa/core`, `@openvaa/data` and `@openvaa/app-shared`) that field points at the built files in `dist/`, so the package must be built before a package that depends on it can run. `yarn build` builds them all; `yarn watch:shared`, which `yarn dev` starts, keeps them built while you work.

`@openvaa/dev-seed` and `@openvaa/supabase-types` are exceptions: they export their TypeScript sources and have no build step.
