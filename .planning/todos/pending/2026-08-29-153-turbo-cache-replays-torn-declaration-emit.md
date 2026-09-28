---
title: Turbo's build cache can replay a torn `dist/` — declaration maps present, every `.d.ts` absent — which reddens a *downstream* workspace's typecheck with a failure that says nothing about the tree
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 07
priority: medium
suggested_phase: future-build-tooling
keywords:
  [
    turbo,
    build-cache,
    cache-replay,
    tsbuildinfo,
    emitDeclarationOnly,
    tsup-clean,
    declaration-emit,
    dev-seed,
    matching,
    checkJs,
    allowJs,
    false-red,
    gate-protocol
  ]
---

# Turbo's build cache can replay a torn `dist/`, producing a false RED downstream

## Origin

Phase 153 Plan 07 ran `yarn lint:check` as a task gate and it exited **2**, failing at
`@openvaa/dev-seed#typecheck` with **~120 `TS7031` / `TS7006` implicit-`any` errors, every one of them
inside `../matching/dist/index.js`** — the *built JavaScript* of a package Plan 07 does not touch.

Plan 07's diff was three files: `packages/shared-config/README.md`, `packages/supabase-types/src/index.ts`,
`packages/core/src/controller/controller.ts`. None is under `packages/matching/`, and none is in
`matching#build`'s declared `inputs` (`src/**`, `tsconfig.json`, `tsconfig.*.json`, `tsup.config.ts`,
`package.json`). The failure was not caused by the change under test.

## Measurement

Taken at HEAD `d5327830b` + one uncommitted file, 2026-08-29, immediately after the red run:

```
packages/matching/dist:
  *.d.ts       0        <-- every declaration missing
  *.d.ts.map  27        <-- but every declaration MAP present
  *.js         1
  tsconfig.tsbuildinfo present (43819 bytes)

packages/core/dist (for comparison):
  *.d.ts      19
  *.d.ts.map  19        <-- 1:1, as expected
```

A `dist/` with 27 declaration *maps* and 0 declarations is not a state any single successful
`tsc --emitDeclarationOnly` run produces. It is a **torn artifact**.

The remedy touched nothing under version control:

```
rm -rf packages/matching/dist && yarn build --filter=@openvaa/matching --force
# -> *.d.ts: 29, index.d.ts present
```

`yarn lint:check` was then re-run against the **identical working tree and identical diff** and exited
**0**: `turbo run typecheck` 22/22, all ten `lint:check` chain links, and every guard at 0 violations
(comment-hygiene 1579 files, edge-env 17 files, declared-binaries 16 workspaces).

Same tree in, opposite verdict out, with only a gitignored generated artifact differing. That isolates
the cause to `packages/matching/dist` and exonerates the diff.

## Why the failure looks like a type error in someone else's code

`packages/shared-config/tsconfig.base.json` sets `allowJs: true` **and** `checkJs: true`. When
`@openvaa/matching`'s `dist/index.d.ts` is absent, a consumer's `tsc` falls through to
`dist/index.js` and type-checks the emitted JavaScript — which of course carries no annotations, so
every destructured binding and every callback parameter is an implicit `any`. The error text names
`packages/matching`, so the natural first reading is "someone broke the matching package". Nothing in
the output says "your declaration files are missing".

This is the load-bearing part of the finding: the diagnostic points away from the actual defect.

## Suspected mechanism (NOT proven)

`turbo.json` declares `build` with `outputs: ["build/**", "dist/**"]` and no `"cache": false`, so the
whole of `dist/` — **including `dist/tsconfig.tsbuildinfo`** — is a cached output. The canonical build
is `tsup && tsc --emitDeclarationOnly --outDir dist`, and `tsup.config.ts` sets `clean: true`, so
`tsup` wipes `dist/` and then `tsc` emits into it *incrementally*, keyed on the `tsBuildInfoFile` that
`packages/README.md`'s "Build pipeline." bullet places at `./dist/tsconfig.tsbuildinfo`.

Caching an incremental compiler's own up-to-date-ness ledger alongside the outputs it describes means a
restore can reinstate a ledger that claims "already emitted" over a directory where the emit is absent —
after which `tsc` correctly emits nothing.

**This mechanism is a hypothesis.** What is *measured* is the torn artifact, the false red, and the
forced-rebuild recovery. The precise sequence that wrote the torn cache entry was not reproduced, and
whoever picks this up should reproduce it before designing a fix.

## Why it matters

The companion todo `2026-08-23-build-gate-cache-replay-is-not-a-measurement` records the cache-replay
hazard in its **green** direction: an unforced `yarn build` gate can report a replayed pass that is a
claim about a previous tree. This is the same hazard in its **red** direction, and it is the more
expensive one:

- A green-that-means-nothing is silent, and is caught by forcing.
- A red-that-means-nothing costs an executor a full diagnosis, and — worse — invites the wrong repair.
  An agent or contributor who reads ~120 implicit-`any` errors in `matching/dist/index.js` and
  concludes the base config is too strict could plausibly "fix" it by turning off `checkJs`, or by
  adding suppressions, or by reverting an unrelated change that happened to be in the tree. All three
  would be a real regression bought to silence a phantom.

## Suggested approach

Options, in rough order of directness — none evaluated:

1. **Stop caching the ledger.** Exclude `dist/*.tsbuildinfo` from `build`'s `outputs`, or relocate
   `tsBuildInfoFile` outside `dist/`. Note this conflicts with the intent recorded in
   `packages/README.md`'s "Build pipeline." bullet — the file was deliberately placed in `dist/` so the
   incremental artifact inherits `dist/`'s gitignore — so the two constraints need reconciling. See
   `2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile`.
2. **Assert the artifact instead of trusting it.** A post-build check that every package with
   `emitDeclarationOnly` has `*.d.ts` count ≥ `*.d.ts.map` count would have caught this in one line,
   and would fail *pointing at the right package*.
3. **Force `build` in gate runs**, per the companion todo's recommendation — which addresses the green
   direction, and would incidentally have avoided this red one.

## Cross-links

- `.planning/todos/pending/2026-08-23-build-gate-cache-replay-is-not-a-measurement.md` — the same
  hazard in its green direction; filed by Phase 144 (144-07) as residue RES-16.
- `.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md` — the
  `tsBuildInfoFile`-in-`dist/` decision this interacts with.
- `turbo.json` — `build.outputs`, `build.inputs`, and the absence of `"cache": false` on `build`.
- `packages/shared-config/tsconfig.base.json` — `allowJs: true`, `checkJs: true` (why a missing `.d.ts`
  becomes ~120 implicit-`any` errors rather than a module-not-found).
- `packages/README.md` — "Build pipeline." bullet (canonical build script and `tsBuildInfoFile`).
- `.planning/phases/153-build-tooling-config-correctness/153-07-SUMMARY.md` — the run this was found in.

## Tags

#build-tooling #turbo #cache #false-red #gate-protocol #declaration-emit #found-in-153-07
