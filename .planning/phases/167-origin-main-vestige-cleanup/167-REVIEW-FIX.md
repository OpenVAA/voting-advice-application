---
phase: 167-origin-main-vestige-cleanup
step: review-fix
batch: review-fix-D
findings_fixed: [IN-01, IN-02, IN-04]
findings_no_change: [WR-01, WR-02, IN-03]
base: 2fb65aab2
gates: tests/e2e-runs/179-gates/review-fix-D
e2e_close: tests/e2e-runs/179-e2e/review-fix-D-r2
status: complete
---

# Phase 167 review fix

Fixed in review-fix batch D, with phases 166, 168 and 169. Each finding was first checked against the tree at `2fb65aab2`; three had been resolved by later work and are recorded with the evidence. Each finding a test can show got a failing test first, committed with the exit of its red run, then the fix and the green run.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 | no change needed: resolved in phase 169 | none |
| WR-02 | no change needed: resolved in phase 169, todo already closed | none |
| IN-01 | fixed | 93a2b0706 (red), 34c70b12b (fix) |
| IN-02 | fixed | 674af2247 (red), 68d6b09e8 (fix) |
| IN-03 | no change needed: resolved in phase 168 | none |
| IN-04 | fixed | fd81e083a (red), b8ba1a1c7 (fix) |

## WR-01: the baseline rows no longer exist

Deferred to 169, and 169 resolved it. `security/audit-baseline.json` now has `"accepted": []`: the audit reports no finding at high or critical severity, so it accepts none, and neither the js-yaml rows (1123911, 1138115) nor the flatted rows (1114526, 1115357) remain to carry a stale `via` or rationale. The rows left the file with the commit that keyed the gate's liveness on the audit's exit status (`dd1311d2a`, found with `git log -S 1123911`). The note in the file now states that the gate reads the Yarn lockfile only and cannot see the Edge Functions' `npm:` imports.

## WR-02: `globals` is declared in shared-config

Resolved by phase 169 (plan 169-10), and its todo is already in `.planning/todos/done/2026-10-02-declare-globals-in-shared-config.md` with a Resolution section. `packages/shared-config/package.json` declares `"globals": "catalog:"`, and the catalog in `.yarnrc.yml` holds `globals: ^17.12.0`, so the version the shared lint config spreads no longer depends on which workspace hoists last. In the restructured history the declaration is part of `acb99c416`.

## IN-01: the logo names its fill class once

**Red** (93a2b0706): `OpenVAALogo.test.ts` renders the logo on the server for each predefined colour and counts `fill-<colour>` and `inline` on the `<svg>`: **exit 1**, 3 of 3 failed, each class twice. The commit also gives `apps/docs` a unit harness: a `test:unit` script, `vitest run --project server`, and the server project of `vite.config.ts` also runs `scripts/**/*.test.ts`. The docs app had no test until now; `turbo run test:unit` reaches it, and `assert:unit-coverage` counts it among the executed workspaces. Log `tests/e2e-runs/179-unit/review-fix-D-167-in01-red.log`.

**Fix** (34c70b12b): the switch keeps the spelled-out classes, which are what Tailwind's scanner finds, and the generic `fill-${color}` is its `default` branch. **Green:** 3 passed.

## IN-02: the strict client stub refuses every reach of the client

**Red** (674af2247): a case on the stub itself, outside the helper's describe block: an `in` probe, a write, a delete and a key enumeration of the client each pass silently. `safeGetSession.test.ts`: **exit 1**, 1 of 11 failed. Log `review-fix-D-167-in02-red.log`.

**Fix** (68d6b09e8): the Proxy traps `has`, `set`, `deleteProperty` and `ownKeys` as well as `get`; each records the reach and throws `UnexpectedClientAccess`, through one `refuse` helper. The comments on the error class, the record and the wrapper say what is now covered. **Green:** 11 passed.

## IN-03: the docs app's lint runs

Routed to 168-01.1, which resolved it. `apps/docs/package.json` has `"lint": "eslint ."`, so `turbo run lint`, and with it `yarn lint:check`, lints the docs app; `yarn lint` there exits 0. The docs scripts' `glob` import, the third item of IN-04, is declared there too (`"glob": "^13.0.6"`).

## IN-04: the two LLM packages declare what they import

**Verified.** Two of the three undeclared imports remained: `zod` in `@openvaa/argument-condensation` (`responseWithArguments.ts`) and `@openvaa/app-shared` in `@openvaa/question-info` (`infoGeneration.type.ts`). `glob` in the docs scripts was already declared.

**Red** (fd81e083a): a `declaredImports.test.ts` in each package reads every static `import` and `export … from` of `src/` and asserts that each package it names is in `dependencies` or `peerDependencies`: **exit 1** in each, naming `zod` and `@openvaa/app-shared`. Logs `review-fix-D-167-in04-ac-red.log`, `review-fix-D-167-in04-qi-red.log`.

**Fix** (b8ba1a1c7): `"zod": "catalog:"` in argument-condensation and `"@openvaa/app-shared": "workspace:^"` in question-info, whose `tsconfig.json` already references app-shared, then `yarn install`; `yarn.lock` gains the two dependency lines and nothing else. **Green:** both tests pass.

**Out of scope, recorded.** A whole-tree scan for the same class finds one more: `@openvaa/app-shared` imports a type from `@openvaa/core` (`src/data/customData.type.ts`) without declaring it. It was not among the review's three and is left for a dependency pass.

## Gates and E2E close of batch D

One gate set and one E2E close cover the four phases of the batch (166, 167, 168, 169). Both ran on `8598b3540`, the batch's last code commit; everything after it is under `.planning/`.

- **Gate set `review-fix-D`**, on 8598b3540: all 22 rows exit **0** on the first run. Unit: frontend 6547 passed and 33 skipped, supabase 1143, dev-seed 1210, data 318, app-shared 149, llm 49, matching 43, argument-condensation 32, docs 29 (the docs app's first unit run in this gate), question-info 23, filters 22, core 8, and the harness suite 208. pgTAP 52 files and 2708 tests, PASS (the new file is `52-grant-conflict-index-order`). Integration 33 passed. Schema equivalence EQUAL, with migration `00010`. The `build`, `docs-links` and `format` rows cover the docs app. `179-verdict gates review-fix-D`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted before the E2E run (`yarn db:stop && yarn db:start` through the key filter, exit 0; `supabase_edge_runtime_openvaa-local` Up).
- **E2E `review-fix-D`**, on 8598b3540: **VOID**. The wrapper exited 8 with `VOID-host-suspend.txt` (a 71-minute gap; 4 Sleep entries in the window, the host on battery). Its counts are not a verdict and were not diagnosed. The directory is kept.
- **E2E close `review-fix-D-r2`**, on 8598b3540, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects. Wrapper exit 0, `restore: ok`. Not void, `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-D --same-projects-as review-fix-C` (read as `-r2`): **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
