# Phase 58 — Deferred Items

Out-of-scope discoveries during execution. Tracked here so they are not lost, but NOT fixed in their originating plan.

## From 58-02 (portrait assets + inventory test)

### Pre-existing workspace test failures when `@openvaa/core` / `@openvaa/matching` are unbuilt

**Discovered:** While running `yarn workspace @openvaa/dev-seed test:unit` (full package suite) after adding `tests/assets.test.ts`.

**Symptom:** 5 test files fail with:
```
Error: Failed to resolve entry for package "@openvaa/core". The package may have incorrect main/module/exports specified in its package.json.
Error: Failed to resolve entry for package "@openvaa/matching". The package may have incorrect main/module/exports specified in its package.json.
```

Affected: `tests/determinism.test.ts`, `tests/pipeline.test.ts`, `tests/latent/latentEmitter.test.ts`, `tests/latent/project.test.ts`, `tests/latent/clustering.integration.test.ts`.

**Root cause:** `packages/core/dist/` and `packages/matching/dist/` are absent in a fresh worktree; the tsc-emitted build outputs that those `package.json` exports point at have never been produced. Running `yarn build` ahead of `test:unit` resolves it.

**Why out of scope for 58-02:** These tests already existed on the base commit (`2286f83608`); the failures reproduce without any of this plan's changes. Plan 58-02 only adds 30 static assets + `tests/assets.test.ts` (which passes, 5/5 green). My additions do not import `@openvaa/core` or `@openvaa/matching`.

**Recommended action:** Document in a Phase 58 later plan (or in CI setup) that the dev-seed unit run requires a prior `yarn build` so the workspace-dep source maps resolve. Alternatively, adjust `@openvaa/core` / `@openvaa/matching` package.json to point at source directly (like `packages/dev-seed` does) — but that is an architecture-level call, not a fix for this plan.
