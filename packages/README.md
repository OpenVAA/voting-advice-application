# OpenVAA packages — canonical paradigm

> **Reference for new package creation and existing-package paradigm checks.**

The OpenVAA monorepo contains four canonical packages that share a single, byte-equivalent paradigm. New `packages/<name>/` workspaces should match this shape; existing packages should converge to it where divergence is not justified.

## Canonical packages

1. [`@openvaa/core`](./core/) — lowest in the dependency graph; **tiebreaker** when the four canonical packages diverge in any detail.
2. [`@openvaa/data`](./data/)
3. [`@openvaa/matching`](./matching/)
4. [`@openvaa/filters`](./filters/)

All four are `type: module`, build with [`tsup`](https://tsup.egoist.dev/) + `tsc --emitDeclarationOnly`, lint with `eslint --flag v10_config_lookup_from_file src/`, and extend [`@openvaa/shared-config/ts`](./shared-config/) for TypeScript configuration.

## Paradigm summary

- **Import-path policy.** TS-internal relative imports do **not** carry `.js` extensions — `import { X } from './foo'`, never `import { X } from './foo.js'`. The `module: ESNext` + `moduleResolution: Bundler` settings in `@openvaa/shared-config/ts` make the extension unnecessary, and `tsup` + `vitest` both resolve correctly without it. (To verify: `grep -rEn "from ['\"]\.+/.*\.js['\"]" packages/{core,data,matching,filters}/src/` returns zero matches.)
- **Barrel structure.** `src/index.ts` is a flat re-export barrel — one `export * from './leaf';` per leaf module (or per sub-barrel where the package is large enough to warrant nested grouping, as in `matching` and `filters`). The flat-vs-sub-barrel decision is the package author's; `core` is the tiebreaker if a question arises during a refactor.
- **Build pipeline.** `scripts.build = "tsup && tsc --emitDeclarationOnly --outDir dist"` runs the bundler then emits types. Output goes to `dist/` (gitignored). The `tsBuildInfoFile` is set to `./dist/tsconfig.tsbuildinfo` in `tsconfig.json` so the incremental-build artifact is also gitignored.
- **`package.json` shape.** See [`@openvaa/core`'s `package.json`](./core/package.json) as the live reference. Required fields: `name`, `version`, `license`, `description`, `repository`, `homepage`, `bugs`, `files`, `publishConfig`, `scripts.build`, `scripts.lint`, `scripts.typecheck`, `type: "module"`, `module`, `types`, `exports`. Required devDeps: `@openvaa/shared-config: workspace:^`, `tsup: catalog:`, `typescript: catalog:`, `vitest: catalog:`.
- **`tsconfig.json` shape.** See [`@openvaa/core`'s `tsconfig.json`](./core/tsconfig.json). Always `extends: "@openvaa/shared-config/ts"`; sets `tsBuildInfoFile`, `rootDir`, `outDir`, `declaration: true`, `emitDeclarationOnly: true`; includes `src/**/*`; excludes `**/*.test.ts`. Add `references` blocks only when depending on another workspace package.
- **`tsup.config.ts` shape.** See [`@openvaa/core`'s `tsup.config.ts`](./core/tsup.config.ts). Default: `format: ['esm']`, `entry: ['src/index.ts']`, `clean: true`, `sourcemap: true`.

## Justified divergences

A package may diverge from the canonical paradigm only when the divergence is documented inline (in `package.json`'s `description`, in the package's `README.md`, or in a comment beside the divergent field). Exactly four packages — `core`, `data`, `matching`, `filters` — carry the paradigm in full; every other `packages/*` workspace diverges, and each divergence is recorded here:

- **`@openvaa/app-shared`** is `private: true` (not published — internal cross-cut between `apps/frontend/` and `apps/supabase/` plus dev tooling) and has a `scripts.test:unit: "vitest run"` (unit tests live in `src/`). Otherwise fully canonical: `tsup` build, flat barrel, `@openvaa/shared-config/ts`.
- **`@openvaa/llm`** is `private: true` with no `license`/`LICENSE` — an experimental LLM package, not published while its API is unsettled. Everything else is canonical: `tsup` build, flat barrel, `@openvaa/shared-config/ts`.
- **`@openvaa/argument-condensation`** and **`@openvaa/question-info`** are `private: true` with no `license`/`LICENSE`, as above, and additionally extend `scripts.build` past the canonical `tsup && tsc --emitDeclarationOnly --outDir dist` to copy their prompt directories into `dist/`. The prompts are loaded at runtime as data rather than imported, so the bundler does not carry them.
- **`@openvaa/dev-tools`** is `private: true`, has no `license`/`LICENSE`, and does not build: it is a maintainer-only CLI (key generation, PEM→JWK conversion) run through `tsx`, so `scripts.build` is a deliberate no-op, `tsconfig.json` sets `noEmit: true`, and there is no `module`/`types`/`exports` surface because nothing imports it.
- **`@openvaa/shared-config`** is `private: true` with no `license`/`LICENSE` and a no-op `scripts.build` — it _is_ the configuration the other packages extend (ESLint, TypeScript), consumed as source rather than as a bundle.
- **`@openvaa/dev-seed`** is `private: true` with no `license`/`LICENSE` and a no-op `scripts.build` — a local-development seeder run through `tsx`.
- **`@openvaa/supabase-types`** is `private: true` with no `license`/`LICENSE` and a no-op `scripts.build`, and its `exports`/`module` point at `./src/index.ts` rather than `./dist/` — it is generated output (`yarn db:types`) consumed directly as TypeScript source.

Any workspace not listed above is expected to match the canonical shape. When you add or retire a package, update this list in the same commit — a stale list here is worse than no list, because it reads as an assurance.

## Adding a new package

Copy the shape of `@openvaa/core` (`packages/core/`). Substitute `name`, `description`, `repository.directory`, `homepage`. Keep all other fields identical. Add a `dependencies` block only if the new package imports another workspace package, and pair it with a `references` entry in `tsconfig.json`.
