# `@openvaa/shared-config`: Shared dev configuration for all modules

Contains exports for configuring `eslint`, `prettier` and `ts`. Import or extend these in the modules.

## Shared `devDependencies`

`devDependencies` cannot be shared using packages. Make sure to update the common dependencies below in all workspaces at the same time:

```json
"devDependencies": {
  "@openvaa/shared-config": "^1.0.0",
  "tsc-esm-fix": "^3.1.2", // If using TypeScript
  "typescript": "^5.6.3",  // If using TypeScript
}
```
