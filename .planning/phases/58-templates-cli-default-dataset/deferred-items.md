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

## From 58-09 (integration test + determinism extension)

### Pre-existing lint errors in Plan 06 files

**Discovered:** While running `yarn workspace @openvaa/dev-seed lint` during Plan 09 execution.

**Symptom:** 5 lint errors in files created by Plan 06:
- `packages/dev-seed/src/templates/default.ts:29:1` — `simple-import-sort/imports`
- `packages/dev-seed/src/templates/defaults/candidates-override.ts:91:14` — `func-style`
- `packages/dev-seed/src/templates/defaults/questions-override.ts:78:10` — `@typescript-eslint/consistent-type-imports`
- `packages/dev-seed/src/templates/defaults/questions-override.ts:98:14` — `func-style`
- `packages/dev-seed/src/templates/index.ts:17:1` — `simple-import-sort/imports`

**Why out of scope for 58-09:** Plan 09's `files_modified` is limited to `packages/dev-seed/tests/determinism.test.ts` and `packages/dev-seed/tests/integration/default-template.integration.test.ts`. Neither test file has any lint errors. The 5 errors above all live in Plan 06's output (`src/templates/` + `src/templates/defaults/`).

**Recommended action:** Fix in a follow-up lint-sweep plan or as an inline deviation in a future plan that modifies these files.

### Pre-existing template-object state aliasing in `runPipeline`

**Discovered:** While drafting Plan 09's locale fan-out determinism tests. The test case literal from the plan text (`const template = {...}; runPipeline(template); runPipeline(template);`) fails byte-identical determinism for synthetic rows when the template object is SHARED by reference between invocations. Using a factory (`makeTemplate()`) that returns a fresh object each call yields byte-identical output as expected.

**Symptom:** Synthetic `elections[]` / `organizations[]` rows emitted by Phase 56 generators produce different locale-fan-out names on the 2nd `runPipeline(template)` call when `template` is shared. First-iteration rows are identical; subsequent ones drift.

**Root cause (probable):** A generator somewhere in `pipeline.ts`'s topo loop mutates `fragment.fixed[*]` in-place. Since `fragment = {...fragmentBase, ...templateFragment}` shares the `fixed` array reference with the template object, the second invocation sees mutated state.

**Why out of scope for 58-09:** This is pre-existing Phase 56 behavior exposed by Plan 09's test drafting, not a regression introduced by my changes. The plan tests work around it with `makeTemplate()` factories (matches realistic CLI usage — every CLI invocation imports `BUILT_IN_TEMPLATES.default` freshly). The `count: 0` pattern on fixed[]-only fragments (per Plan 06 SUMMARY deviation #1) further narrows the divergent path.

**Recommended action:** Add a determinism test that explicitly shares a template by reference, audit the generator hot paths for `fragment.fixed` mutation, and either deep-clone the fragment before passing to generators or document the "construct template once per pipeline invocation" contract. Candidate plan: a hardening follow-up in Phase 59 or a dedicated determinism fix.
