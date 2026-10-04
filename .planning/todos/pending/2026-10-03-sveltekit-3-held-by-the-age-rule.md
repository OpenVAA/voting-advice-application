---
title: "SvelteKit 3, adapter-node 6 and adapter-static 4 are held by the 30-day new-major rule; re-check on or after 2026-10-31T17:25Z"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 12
priority: medium
suggested_phase: the first dependency phase on or after 2026-10-31 (a Kit-3-only plan; it needs an operator checkpoint, D-32)
keywords: [sveltekit, kit-3, adapter-node, adapter-static, age-rule, d-03, d-15, hold, vite-configloader]
re_check_trigger: "on or after 2026-10-31T17:25Z (the latest of the three x.0.0 clear times)"
files:
  - .yarnrc.yml (catalog `'@sveltejs/kit': ^2.70.3`, resolves 2.70.3)
  - apps/frontend/package.json (`@sveltejs/adapter-node`, resolves 5.5.7)
  - apps/docs/package.json (`@sveltejs/adapter-static`, resolves 3.0.10)
  - apps/frontend/svelte.config.js, apps/frontend/vite.config.ts
  - apps/docs/svelte.config.js, apps/docs/vite.config.ts
---

# SvelteKit 3 is held by the age rule

## Problem

On 2026-10-03T18:49Z (169-12 Task 1) the three new major lines were 2.06 days old. D-03 admits a new major only once
its `x.0.0` is at least 30 days old, and then takes the newest release in that major that is at least 7 days old.
The registry measurement (`npm view <pkg> time --json`; verdict file `tests/e2e-runs/169-gates/12-kit3-verdict.json`,
gitignored) gave:

| Package | Held at | x.0.0 published | Clears | Newest in the major on 2026-10-03 |
|---|---|---|---|---|
| `@sveltejs/kit` | 2.70.3 | 3.0.0, 2026-10-01T17:22:34Z | 2026-10-31T17:22:34Z | 3.0.0 (only release) |
| `@sveltejs/adapter-node` | 5.5.7 | 6.0.0, 2026-10-01T17:24:31Z | 2026-10-31T17:24:31Z | 6.0.0 (only release) |
| `@sveltejs/adapter-static` | 3.0.10 | 4.0.0, 2026-10-01T17:21:55Z | 2026-10-31T17:21:55Z | 4.0.0 (only release) |

Verdict: `HOLD-AGE`. The hold is recorded in `169-EVIDENCE.md` § 3. PROH-169-22 and PROH-169-19 apply: do not move
early through a range widening or an `npmPreapprovedPackages` entry.

## Peer status: ready

Every peer Kit 3.0.0 declares is already satisfied by the tree under Kit 2.70.3. Kit 3's own migration would be the
only change in its commit (D-15):

| Kit 3.0.0 peer | Range | Resolved | OK |
|---|---|---|---|
| `vite` | `^8.0.12` | 8.3.1 | yes |
| `@sveltejs/vite-plugin-svelte` | `^7.0.0` | 7.3.1 | yes |
| `svelte` | `^5.57.1` | 5.57.1 | yes |
| `typescript` (optional) | `^6.0.0` | 6.0.3 | yes |
| `@opentelemetry/api` (optional) | `^1.0.0` | not installed | yes (optional) |
| `engines.node` | `>=22.17` | declared `>=24.15.0`; CI pin 24.21.0 | yes |

These peers landed under Kit 2.70 in 169-02 (TypeScript 6, Node 24) and 169-05 (Vite 8, vite-plugin-svelte 7).
Re-measure them on the day. A newer 3.x may raise a peer floor.

## Steps (once the trigger date has passed)

1. Re-measure the age clock and the peers live. Re-run the 169-12 Task 1 measurement: `npm view <pkg> time --json`
   for each of the three packages, then `npm view @sveltejs/kit@<target> peerDependencies engines --json` against
   `yarn.lock`. Take the newest release in each major that is at least 7 days old.
2. Present the operator checkpoint from 169-12 Task 2 (D-32). The options are `land-with-sv`, `land-by-hand` and
   `hold`. `land-with-sv` runs `npx sv@<version> migrate sveltekit-3`. That version must be at least 7 days old and
   approved (legitimacy box C, `169-LEGITIMACY-APPROVALS.md`).
3. If the operator chooses to land: set the catalog `'@sveltejs/kit'` → `^3.x`, frontend `@sveltejs/adapter-node` →
   `^6.x`, docs `@sveltejs/adapter-static` → `^4.x`; run `yarn install`; legitimacy-check any new names.
4. Migrate both apps. Kit 3 moves configuration into the Vite plugin and changes `$lib` imports to `#lib` subpath
   imports. Keep these intact:
   - the `restartOnRootEnv` plugin;
   - the env `dir`;
   - the `strictPort` behaviour;
   - the Paraglide wiring.
   Read the migration guide's security-relevant changes (CSRF origin checks, body-size limits, cookies).
5. Commit the manifests, the lockfile and the migration together as one commit. Then run:
   - `169-restart-probe.sh`;
   - the visual container run (trace any diff before re-baselining);
   - the twelve D-26 gates (`169-gates.sh`);
   - a full E2E run (`169-e2e.sh`). Cardinal rule: 0 failed, 0 flaky, 0 did-not-run.

## Related item: Vite 8's `configLoader: 'native'` notice (169-05, EVIDENCE § 7)

Take this with the Kit 3 migration, because that migration rewrites the same config files.

Vite 8 warns that `apps/frontend/vite.config.ts` imports three local modules without file extensions:

- `./paraglide.options`
- `./vite.projectIdEnv`
- `./vite.restartOnRootEnv`

This is harmless under the default bundle loader. It would break under the native loader, which Vite plans to make
the default in a later major.

The fix is to:

- add `.ts` extensions to those three imports;
- enable `allowImportingTsExtensions` in the tsconfig that type-checks the config (that option needs `noEmit` or
  `emitDeclarationOnly`).

Neither fix it nor suppress the notice in a dependency commit on its own. Commit it as its own change next to the
Kit 3 migration, then check that the notice is gone from `yarn workspace @openvaa/frontend dev` output.
