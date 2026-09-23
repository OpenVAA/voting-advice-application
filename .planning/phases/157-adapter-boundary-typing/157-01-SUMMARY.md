---
phase: 157-adapter-boundary-typing
plan: 01
subsystem: infra
tags: [app-shared, logging, i18n, monorepo, tsup, turborepo, vitest]

requires:
  - phase: 156
    provides: the green baseline this plan built on (frontend unit suite at 816)
provides:
  - "`log` + `configureLogger` — a pino/OTel-conformant structured logger in `@openvaa/app-shared`, silent by default"
  - "`LogLevel`, `LogRecord`, `LoggerConfig` types"
  - "`getLocalized` re-homed to `@openvaa/app-shared`, typed from `LocalizedString`"
  - "three new barrel entries, with `dist/` rebuilt so all six consumer workspaces resolve them"
affects: [157-02, 157-07, 157-13, 157-17, 157-18]

actuals:
  tokens: 3953
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Injected-enablement logging: no environment read inside a shared package; the consumer calls `configureLogger`"
    - "Explicit error flattening at the log boundary, because `JSON.stringify(new Error())` is `{}`"

key-files:
  created:
    - packages/app-shared/src/logging/logger.ts
    - packages/app-shared/src/logging/logger.type.ts
    - packages/app-shared/src/logging/logger.test.ts
  modified:
    - packages/app-shared/src/index.ts
    - packages/app-shared/src/data/getLocalized.ts
    - packages/app-shared/src/data/getLocalized.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts

key-decisions:
  - "`LogRecord` field set fixed at `level` / `time` / `msg` / `severityText` / optional `err` / optional `attributes`"
  - "`err` is lifted out of the caller's fields object; the remainder becomes `attributes` verbatim"
  - "`configureLogger` merges into the current config rather than replacing it, so raising the level later does not discard an injected sink"
  - "Default console routing: `console.error` at level >= 40, `console.info` below — mirrors the arity-chosen behaviour of the logger being replaced"

patterns-established:
  - "Colocated `*.test.ts` beside source in app-shared, already excluded from the declaration build by `tsconfig.json`"
  - "Prohibition greps must stay literal-clean: prose in a JSDoc block can trip a grep-based guard, so the comment is worded around the token"

requirements-completed: [REVIEW-ADP-05, REVIEW-ADP-06]

coverage:
  - id: D1
    description: "Structured logger in app-shared, silent until configured, with error stacks preserved"
    requirement: REVIEW-ADP-06
    verification:
      - kind: unit
        ref: "packages/app-shared/src/logging/logger.test.ts (11 cases)"
        status: pass
  - id: D2
    description: "`getLocalized` colocated with `localized.type.ts` and typed from `LocalizedString`"
    requirement: REVIEW-ADP-05
    verification:
      - kind: unit
        ref: "packages/app-shared/src/data/getLocalized.test.ts (9 cases)"
        status: pass
  - id: D3
    description: "Barrel exports resolve through the built `dist/` for downstream workspaces"
    verification:
      - kind: integration
        ref: "node -e \"import('@openvaa/app-shared')...\" run from apps/frontend"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend typecheck — 2094 files, 0 errors"
        status: pass

status: complete
---

# Phase 157 Plan 01: App-Shared Foundation Summary

A pino/OTel-conformant structured logger and the re-homed `getLocalized` now ship from
`@openvaa/app-shared`, built and green, so the rest of Phase 157 has something to import from.

## Accomplishments

- **Task 1 — structured logger (TDD).** `log.debug/info/warn/error` plus `configureLogger`, backed
  by 11 unit cases. Written RED first (11 failures, module-not-found), then GREEN.
- **Task 2 — `getLocalized` move.** Moved to `packages/app-shared/src/data/`, beside the
  `LocalizedString` type it is now typed from. Both frontend copies deleted, both callers repointed.
- **Task 3 — barrel and build gate.** Three alphabetised barrel entries; the whole monorepo builds,
  unit-tests, typechecks and format-checks clean.

## Measured facts recorded for 157-17

The plan asked for three measurements to be carried forward into the codemod plan.

**1. `log` symbol-collision count.** `grep -rnw 'log' apps/frontend/src --include='*.ts' --include='*.svelte'`
returns **11 matches, of which 0 are code bindings.** All 11 are prose inside comments or a string:
"log out" (x3), "log in" (x3), "log into console", "log in the console" (x2), "no log line",
"the log label", plus one `console.log('Cancelled')` call in `ConfirmationModal.svelte`. The name
`log` is therefore free to import at all 53 codemod sites without shadowing anything.

**2. The chosen `LogRecord` field set.**

| Field | Type | Presence |
|---|---|---|
| `level` | `20 \| 30 \| 40 \| 50` | always |
| `time` | `number` (epoch ms) | always |
| `msg` | `string` | always |
| `severityText` | `'DEBUG' \| 'INFO' \| 'WARN' \| 'ERROR'` | always |
| `err` | `{ type: string; message: string; stack?: string }` | only when the caller passes `err` |
| `attributes` | `Record<string, unknown>` | only when non-`err` fields remain |

Call shape for the codemod: `log.error(msg, { err, ...attributes })`. `err` is extracted; whatever
remains becomes `attributes` verbatim. Both optional fields are **omitted entirely** rather than set
to `undefined` when empty, which is asserted by two tests.

**3. `yarn build` duration.** **18.4 s** for a forced, fully uncached build of all 14 tasks
(`yarn build --force`, `Cached: 0 cached, 14 total`). A warm cache hit is **0.18 s** (`FULL TURBO`).
So 157-17's codemod should budget roughly 20 s per app-shared-invalidating build.

## Verification — commands run and real output

| Command | Result |
|---|---|
| `yarn workspace @openvaa/app-shared test:unit` | **41 passed (41)**, 5 files — 21 pre-existing + 11 logger + 9 `getLocalized` |
| `yarn workspace @openvaa/frontend test:unit` | **807 passed (807)**, 53 files |
| `yarn test:unit` (whole monorepo) | **25 successful, 25 total** tasks |
| `yarn build --force` | **14 successful, 14 total**, 0 cached, 18.4 s |
| `yarn build` from a wiped `packages/app-shared/dist` | **14 successful, 14 total** |
| `yarn workspace @openvaa/frontend typecheck` | **2094 FILES 0 ERRORS 0 WARNINGS** |
| `yarn format:check` | "All matched files use Prettier code style!" |
| `yarn lint:check` | **ESLint 0 errors** in every workspace; the aggregate command still exits 1 on an unrelated SQL comment — see Out of Scope below |
| `node -e "import('@openvaa/app-shared')..."` from `apps/frontend` | exit 0; `getLocalized`, `log`, `configureLogger` all present |

**Frontend count reconciliation.** The baseline given to me was 816/816; I observe 807/807. The
difference is exactly the 9 `getLocalized` cases that Task 2 moved out of the frontend and into
app-shared, whose own count rose by the same 9 (32 -> 41). No test was lost or skipped.

Prohibition greps, all clean:

- `grep -rn 'import.meta.env\|process\.env\|\$env/' packages/app-shared/src` -> **0**
- `grep -rn '"pino"' --include=package.json .` (excluding `node_modules`) -> **0**
- `grep -rn "from './getLocalized'" apps/frontend/src` -> **0**
- `grep -c "  it(" packages/app-shared/src/data/getLocalized.test.ts` -> **9**
- `grep -c "getLocalized\|logging/logger" packages/app-shared/src/index.ts` -> **3**

## Deviations from Plan

**1. [Rule 3 - Blocking] Reworded a JSDoc line that tripped the plan's own prohibition grep**

- **Found during:** Task 1 verification.
- **Issue:** The acceptance criterion is that
  `grep -rn 'import.meta.env\|process\.env\|\$env/' packages/app-shared/src` returns 0 lines. My
  `LoggerConfig` JSDoc *explained* the no-environment-read rule by naming `import.meta.env` and
  `process.env` in prose, so the grep returned 1. The code read nothing from the environment; the
  comment merely contained the tokens.
- **Fix:** Reworded to "the Vite compile-time constants and the SvelteKit virtual env modules are
  both unavailable here". The explanation survives, the grep-based guard stays meaningful.
- **Files modified:** `packages/app-shared/src/logging/logger.type.ts`
- **Commit:** `dba2215d8`

**2. [Rule 3 - Blocking] Dropped an `import()` type annotation the lint gate forbids**

- **Found during:** Task 3, `yarn lint:check`.
- **Issue:** My test helper was annotated `Promise<typeof import('./logger')>`;
  `@typescript-eslint/consistent-type-imports` rejects `import()` type annotations. 1 error.
- **Fix:** Removed the annotation and let inference supply the module type. Behaviour identical.
- **Files modified:** `packages/app-shared/src/logging/logger.test.ts`
- **Commit:** `808aa294b`

**3. [Not a deviation — recorded because it looked like one] A transient first-build failure**

The *first* `yarn build` after the barrel edit failed in `@openvaa/llm`, with ~10 `TS7006 implicitly
has an 'any' type` errors pointing at `../app-shared/dist/index.js` — the emitted **JavaScript**, not
the `.d.ts` — all inside `passwordValidation`, code this plan never touched. It did **not** reproduce:
three subsequent builds were green, including one forced build with `Cached: 0 cached, 14 total` and
one run after `rm -rf packages/app-shared/dist`, and `packages/app-shared/dist/index.d.ts` is present
and correct. The signature is a transient declaration-emit window (app-shared's `tsup` has
`clean: true`, so `dist/index.d.ts` is briefly absent between `tsup` and `tsc --emitDeclarationOnly`,
and a consumer resolving in that window falls back to the untyped `.js`). Flagged rather than fixed:
it is not reproducible, so any "fix" would be unverifiable. **157-17 and later app-shared-touching
plans should expect a possible spurious first-build failure and simply re-run the build.**

## Out of Scope — not fixed, not mine

`yarn lint:check` exits 1 on:

```
apps/supabase/supabase/tests/database/05-organization-admin.test.sql:55:
  rule 2 (D-A4) — this comment line ends without terminal punctuation
```

**Provenance established, not assumed.** The line is byte-different from my base commit
`44c467624`, and `git log` attributes it to `d3a67cb06 fix(156): WR-07 a pgTAP header still listed
the columns criterion 7 revoked` — a commit made by the **concurrent phase-156 code-review agent**
during this session. It is committed, not a dirty working-tree file. This plan touched zero SQL.

Left untouched deliberately: it is inside the concurrent agent's active phase-156 review scope, and
editing it would risk clobbering in-flight work. **It must be resolved before the phase-157 gate, or
`yarn lint:check` stays red.** The ESLint half of `lint:check` is clean — 0 errors in every
workspace.

## Concurrency hygiene

The concurrent agent's two declared files
(`apps/supabase/supabase/tests/database/09-column-restrictions.test.sql`,
`scripts/assert-schema-migration-parity.mjs`) were **never** staged, edited or reverted by me;
`git log --name-only` over my range attributes both solely to that agent's own `fix(156)` commits.
Every commit used explicit per-file `git add`; no `git add -A`, no `git add .`, no `git commit -a`,
no `git stash`. The untracked `.planning/state.json` was left alone.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 (RED) | `abfc9feec` | `test(157-01): add failing tests for the app-shared structured logger` |
| 1 (GREEN) | `dba2215d8` | `feat(157-01): implement the structured logger in app-shared` |
| 2 | `ffc835436` | `refactor(157-01): move getLocalized into app-shared beside localized.type` |
| 3 | `808aa294b` | `feat(157-01): export getLocalized and the logger from the app-shared barrel` |

No REFACTOR commit: the GREEN implementation needed no cleanup.

## TDD Gate Compliance

Task 1 ran the full cycle. RED (`abfc9feec`) was observed failing with 11 failures before
`logger.ts` existed; GREEN (`dba2215d8`) took the package to 32/32. Both gate commits present and
correctly ordered.

## Known Stubs

None. Every artifact is production code; no placeholder, TODO, skipped test or unrun `<verify>` was
left behind.

## Threat Flags

None. This plan installed zero packages and added no network, auth or file-access surface. The three
registered logger threats are mitigated and unit-asserted: `attributes` passthrough is never deep-
serialised (T-157-01), the default level is `'silent'` (T-157-02), and `err` keeps its stack
(T-157-03).

## Self-Check: PASSED

All 6 source artifacts and the SUMMARY exist on disk; all 4 commit hashes resolve in git log.
