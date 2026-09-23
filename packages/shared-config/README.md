# `@openvaa/shared-config`: Shared dev configuration for all modules

Contains exports for configuring `eslint`, `prettier` and `ts`. Import or extend these in the modules.

## Shared `devDependencies`

`devDependencies` cannot be shared through a package's own dependency graph, so each workspace that consumes the shared config declares them itself. Declare them with the specifiers below: `workspace:^` resolves this package from the monorepo (it is `private`, so no registry range can resolve it), and `catalog:` takes the version from the catalog block in `.yarnrc.yml`, so there is a single place to update it rather than a set of ranges to keep in sync by hand.

```json
"devDependencies": {
  "@openvaa/shared-config": "workspace:^",
  "tsup": "catalog:",
  "typescript": "catalog:",
  "vitest": "catalog:"
}
```
