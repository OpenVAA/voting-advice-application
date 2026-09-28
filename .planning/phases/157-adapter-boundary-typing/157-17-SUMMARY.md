---
phase: 157-adapter-boundary-typing
plan: 17
subsystem: frontend
tags: [logging, codemod, app-shared, sveltekit, hooks, observability]

requires:
  - phase: 157
    plan: 01
    provides: "`log` + `configureLogger` in `@openvaa/app-shared`, silent by default"
  - phase: 157
    plan: 07
    provides: "the three adapter test files that already call `configureLogger` with a capture sink"
provides:
  - "`apps/frontend/src/hooks.client.ts` — a new browser entry point"
  - "two `configureLogger` calls, one per SvelteKit module graph"
  - "every frontend log site on `log.debug` / `log.error`, level chosen by the caller"
  - "`apps/frontend/src/lib/utils/logger.ts` deleted, with no re-export shim"
affects: [157-18]

actuals:
  tokens: 20800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Per-module-graph logger configuration: one `configureLogger` at module scope in each SvelteKit entry point, because module-scope state in an ESM package is per module instance"
    - "Level chosen by method rather than by argument arity, replacing the `logDebugError` misnomer"

key-files:
  created:
    - apps/frontend/src/hooks.client.ts
  modified:
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
    - apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts
    - apps/frontend/src/lib/i18n/wrapper.ts
    - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts
    - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
    - apps/frontend/src/routes/candidate/preregister/+layout.server.ts
  deleted:
    - apps/frontend/src/lib/utils/logger.ts

key-decisions:
  - "Level rule: `log.error` when the site reports a failure being handled (inside `catch` / `.catch()`, or logging a value obtained from a failed operation); `log.debug` otherwise. 43 error sites, 36 debug sites in the mechanical pass"
  - "The tracking site keeps its payload under an explicitly named `data` key rather than spreading it, so it logs exactly what it logged before and no more"
  - "The five dangling `vi.mock('$lib/utils/logger')` blocks were deleted rather than repointed: the shared logger is silent until configured, so tests need no logger mock at all"

requirements-completed: [REVIEW-ADP-06]

coverage:
  - id: D1
    description: "Both SvelteKit module graphs configure the logger, restoring the previous enablement gate verbatim"
    requirement: REVIEW-ADP-06
    verification:
      - kind: static
        ref: "`grep -rn 'configureLogger(' apps/frontend/src --exclude='*.test.ts'` -> 2 invocations, one per entry point"
        status: pass
  - id: D2
    description: "Zero `logDebugError` remains anywhere in `apps` or `packages`, and the module it came from is gone"
    requirement: REVIEW-ADP-06
    verification:
      - kind: static
        ref: "`grep -rn 'logDebugError' apps packages` -> 0; `grep -rn 'utils/logger' apps/frontend/src` -> 0"
        status: pass
      - kind: unit
        ref: "yarn test:unit — 25/25 tasks, frontend 932/932"
        status: pass
  - id: D3
    description: "Stack traces survive the migration, because the four two-argument sites pass their caught exception under `err`"
    verification:
      - kind: static
        ref: "the four reshaped two-argument sites, named below with their after form"
        status: pass

status: complete
---

# Phase 157 Plan 17: The Logging Convergence Summary

`logDebugError` is gone from the repository's `apps` and `packages` trees, replaced at 86 call sites
by the structured `log` from `@openvaa/app-shared`, with the level chosen by the caller and the old
module deleted outright so a missed site could not have survived silently.

## Accomplishments

- **Task 1 — two `configureLogger` calls.** New `apps/frontend/src/hooks.client.ts` (it did not exist)
  for the browser graph, and a module-scope call in `hooks.server.ts` for SSR. Both compute the level
  from the same expression the deleted module used, so the migration is behaviour-neutral.
- **Task 2 — the mechanical pass.** 48 import lines repointed, 79 invocations renamed, imports
  re-sorted by `simple-import-sort` rather than by hand, 5 dangling test mocks removed, 1 stale
  comment reference updated.
- **Task 3 — 7 hand reshapes and the deletion.** `apps/frontend/src/lib/utils/logger.ts` deleted with
  no shim.

## The level-selection rule, stated so it is reviewable

> **`log.error`** when the site reports a **failure being handled**: it sits inside a `catch` or a
> `.catch()` handler, or it logs a value obtained from a failed operation (an `Error`, an
> `error.message`, a nullish/invalid result).
> **`log.debug`** otherwise: developer-facing traces, unsupported-or-ignored-input notices, and
> internal-misuse assertions that carry no error value.

Applied across the 79 mechanical sites this gives **43 `error` and 36 `debug`**. Under the rule,
`'Unauthorized user tried to access candidate app'` is `debug` (access was correctly denied — nothing
malfunctioned), while `'Candidate login: session not established after signIn'` is `error` (the
sign-in produced no session, which is a failed operation).

**What actually changes at runtime.** Enablement is unchanged: level `'debug'` when
`import.meta.env.DEV || constants.PUBLIC_DEBUG`, `'silent'` otherwise, so exactly the same set of
sites emits as before. What changes is the console routing. The old module chose `console.error` when
a second argument was present and `console.info` otherwise — arity chose the level. The new logger
routes on the level itself, so the 43 `error` sites now reach `console.error` where most previously
reached `console.info`. That is the defect the criterion asked to fix, not a regression.

## The seven hand-reshaped sites, before and after

The plan named **five**. Measurement found **seven** — the same two kinds the plan already describes,
just undercounted (see Deviations). All seven are listed with both forms.

**Four two-argument sites** (the plan said three; it missed the multi-line one in
`preregister/+layout.server.ts`). Each passes its caught exception under `err`, so the logger's
explicit flattening preserves `name`, `message` and `stack` — `JSON.stringify(new Error())` is `{}`.

| # | File:line | Before | After |
|---|---|---|---|
| 1 | `lib/contexts/utils/persistedState.svelte.ts:118` | ``logDebugError(`Failed to parse ${key} from ${type}`, e)`` | ``log.error(`Failed to parse ${key} from ${type}`, { err: e })`` |
| 2 | `lib/utils/matching/imputeParentAnswers.ts:119` | ``logDebugError(`Matching.imputeParentAnswers: Error imputing answer for question ${question.id}:`, e)`` | ``log.error(`Matching.imputeParentAnswers: Error imputing answer for question ${question.id}`, { err: e })`` |
| 3 | `routes/candidate/preregister/+layout.server.ts:18` | ``logDebugError(`[Candidate App preregister layout] Error reading app settings: ${e?.message ?? 'No error message'}`, e)`` | ``log.error(`[…same message…]`, { err: e })`` |
| 4 | `routes/candidate/(protected)/+layout.server.ts:45` | ``logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`, e)`` | ``log.error(`Error fetching user data: ${e?.message ?? 'No error message'}`, { err: e })`` |

Site 2 drops the message's now-dangling trailing colon, which only existed because the error used to
be concatenated after it. No test or spec matches that string.

**One object-first-argument site.**

| # | File:line | Before | After |
|---|---|---|---|
| 5 | `lib/contexts/app/tracking/trackingService.svelte.ts:162` | `logDebugError({ name, data: dataToSend })` | `log.debug('Tracking event dispatched', { name, data: dataToSend })` |

The attributes object is **constructed explicitly at the call site with two named keys**; the outgoing
analytics payload is **not spread** (T-157-01). Keeping it under a named `data` key means the record
carries exactly what the old call carried — no more, no less — rather than flattening arbitrary event
keys into the record's top level.

**Two bare-error sites** (the plan said one). Each becomes a string message plus the error under `err`.

| # | File:line | Before | After |
|---|---|---|---|
| 6 | `lib/i18n/wrapper.ts:30` | `logDebugError(e)` | `log.error('Paraglide message function threw; falling back to the message key', { err: e })` |
| 7 | `routes/candidate/(protected)/+layout.svelte:52` | `logDebugError(error)` | `log.error('Failed to save terms-of-use acceptance', { err: error })` |

**The password-form site stayed interpolated.**
`routes/candidate/(protected)/settings/+page.svelte:51` is now
``log.error(`Error with register: ${e?.message}`)`` — a message-only rename. It logs `e?.message`, an
interpolated string, and was **not** reshaped into one that logs the exception object. Same for the
sibling sites in `register/password/+page.svelte` and `password-reset/+page.svelte`.

**No reactive accessor was destructured.** Two of the seven are under `lib/contexts`. Their diffs
touch only an import line and a log line; no `ctx.` read was added, removed or rebound, and no
`appSettings` / `dataRoot` / `locale` appears in either diff.

## Verification — commands run and real output

| Command | Result |
|---|---|
| `grep -rn 'logDebugError' apps packages` | **0** |
| `grep -rnF "from '$lib/utils/logger'" apps/frontend/src` | **0** |
| `grep -rn 'utils/logger' apps/frontend/src` | **0** (stronger form — no reference of any kind remains) |
| `ls apps/frontend/src/lib/utils/logger.ts` | exit **1** |
| `grep -rn 'configureLogger(' apps/frontend/src --exclude='*.test.ts'` | **2** invocations |
| files importing `log` from `@openvaa/app-shared` | **51**; files using `log.<level>(` — **51**; set difference **empty** |
| `yarn workspace @openvaa/frontend typecheck` | **2694 FILES 0 ERRORS 0 WARNINGS** |
| `yarn build` | **14 successful, 14 total** |
| `yarn test:unit` | **25 successful, 25 total**; frontend **932/932**, app-shared **79/79** |
| `yarn lint:check` | **exit 0**; frontend workspace `✖ 1 problem (0 errors, 1 warning)` |
| `yarn format:check` | **exit 0** — "All matched files use Prettier code style!" |

**Every zero above is sized, so none of them is vacuous.** The comment-hygiene guard reports
`files scanned: 1583 … 0 violation(s)` and the adapter-cast guard reports
`26 file(s), 5047 line(s) scanned … 0 violation(s)`, matching the figure carried in from 157-08.
`apps/frontend/eslint.config.mjs` is untouched at blob `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f`; no
ESLint config in the repo was modified by this plan.

**Baseline reconciliation.** Frontend 932 → 932, app-shared 79 → 79, monorepo 25/25. No test was
added, removed or skipped: the five deleted `vi.mock` blocks were mock *setup*, not cases.

**Not run, deliberately:** pgTAP, `db:reset*`, `db:types` and `db:lint:sql`. The database was left
untouched for 157-18's E2E gate.

**The `packages/core` build failure 157-02 predicted did not occur.** Four `yarn build` runs, all
green on the first attempt (13 of 14 tasks cached each time). `yarn build --force` was never needed.

## Deviations from Plan

### 1. [Rule 1 - Bug] `eslint --fix` silently stripped the `log` import from all four files whose reshape was still pending

- **Found during:** Task 3, by the "at least 53 files import the new symbol" criterion — the count
  came back **47** against **51** files using `log.<level>(`.
- **Issue:** The plan sequences the mechanical rename (task 2) before the hand reshapes (task 3) and
  puts `yarn lint:fix` in task 2's verify. At that moment the seven reshape sites still called
  `logDebugError`, so `unused-imports/no-unused-imports` correctly judged the freshly-added `log`
  import unused and deleted it. The reshapes then introduced `log.error(...)` into four files with no
  import: `persistedState.svelte.ts`, `i18n/wrapper.ts`, `imputeParentAnswers.ts`,
  `preregister/+layout.server.ts`.
- **Why it matters:** this is the exact silent-survival shape of **T-157-45**, and **the plan's stated
  backstop did not catch it.** `yarn build` passed and `yarn test:unit` passed 932/932 — the affected
  paths are error handlers (a `JSON.parse` failure, an imputation throw, a Paraglide throw, an
  app-settings read failure) that no unit test exercises. `svelte-check` is what caught it, reporting
  four `Cannot find name 'log'` errors. Recorded plainly: for this failure mode, **typecheck is the
  backstop and `build` + `test:unit` is not.**
- **Fix:** restored the four imports; `typecheck` then reported 0 errors and the importer count rose
  to 51 with an empty using-but-not-importing set.
- **Commit:** `6aaeaed46`

### 2. [Rule 3 - Blocking] Tasks 2 and 3 cannot both end on a green tree, so the codemod landed as one commit

Task 2's verify is `yarn lint:fix && yarn build && yarn test:unit`, but at task 2's own boundary the
seven reshape sites call an unimported `logDebugError`. Run there, `test:unit` fails with
`ReferenceError: logDebugError is not defined` — observed, not assumed. The plan's objective says the
migration is "one codemod", so the rename and the reshapes were committed together (`7bc94a473`) and
the deletion separately (`6aaeaed46`). Task 1 kept its own commit.

Consequence to record: because deviation 1 was not found until after `7bc94a473`, that intermediate
commit does not typecheck. `git revert` of the pair restores a consistent tree, which is what the
plan's own reversibility note assumes.

### 3. [Rule 3 - Blocking] The `persistedState` test mocks `@openvaa/app-shared` wholesale

`persistedState.svelte.test.ts` replaces the entire package with a factory supplying only
`staticSettings`. Once the module under test logged through that package, the factory had to supply
`log` too or the parse-failure path would throw on an undefined member. Added
`log: { debug, info, warn, error }` with a comment saying why.

### 4. [Rule 1 - Bug] An orphaned comment in `trackingService.svelte.test.ts`

Removing the logger mock left a comment ("Force the `browser` branch of the shouldTrack derivation…")
sitting above an unrelated JSDoc. It had never described the mock it preceded. Deleted.

## Criteria I could not meet as worded

Four of the plan's checks are unmeetable or vacuous as literally written. None of the resolutions
changes what ships; each is restated in the strongest form that is actually measurable, and measured.

1. **`grep -rn "from '\$lib/utils/logger'" apps/frontend/src` returns 0 lines** — **vacuous on this
   machine.** `grep` here is `ugrep 7.8.4`, which treats `$` as an anchor mid-pattern, so this
   command returned **0 before any work was done**, against 46 real matching lines. Restated as
   `grep -rnF` (46 → 0) and, more strongly, `grep -rn 'utils/logger'` (51 → 0).
2. **`grep -rn 'configureLogger' apps/frontend/src | wc -l` returns exactly 2** — **unmeetable.** Any
   named import contributes its own matching line, so the floor for two call sites is four. And
   157-07 already landed **9** `configureLogger` lines across three adapter test files
   (`parseJsonbColumn.test.ts`, `supabaseDataProvider.test.ts`, `supabaseAdminWriter.test.ts`), which
   configure a capture sink and reset to `'silent'`. Restated as **exactly 2 invocations in non-test
   frontend source** — measured 2, one per module graph.
3. **"At least 53 files import the new symbol"** — **unmeetable.** The 53-file corpus includes 5 test
   files that only carried a `vi.mock` and never imported the symbol, so its ceiling is 48. Restated
   as **every file that uses `log.<level>(` also imports it**: 51 = 51, set difference empty. This is
   the criterion that found deviation 1.
4. **"The reshape surface is 5 call sites"** — **7.** A balanced-paren scan of all 86 invocations
   found **four** two-argument sites (not three; `preregister/+layout.server.ts:18` is multi-line and
   a line-based scan misses it) and **two** bare-error sites (not one; `i18n/wrapper.ts:30` and
   `candidate/(protected)/+layout.svelte:52`). Both extra sites are the kinds the plan already
   describes, and both resolve identically, so this corrects a count without changing the approach.

Two further corrections to plan text, neither affecting what ships:

- The plan's task-1 note says `apps/frontend/vitest.config.ts` mocks `$env/dynamic/public` "for the
  old logger's sake" and that the mock can now be dropped. **False.** That alias is a general
  SvelteKit env stub relied on by `constants.ts` and much else; removing it would break unrelated
  tests. It was left in place. The genuine simplification is smaller: five `vi.mock` blocks for the
  logger became unnecessary, because the shared logger is silent until configured.
- The measured corpus is **141 lines across 54 files** (48 imports, 86 invocations, 2 inline mock
  bodies, 4 comment/mock mentions, plus the module itself), against the plan's "140 lines across 53
  files". The difference is the logger module's own definition line.

## Out of Scope — not fixed, not mine

`grep -rn 'logDebugError' .` still returns 9 hits under
`.claude/skills/spike-findings-voting-advice-application-gsd/`. These are **frozen source snapshots
of completed spikes 003 and 005**, preserved deliberately as historical artifacts. They are outside
`apps` and `packages`, outside the plan's criterion scope, and rewriting them would falsify a record
of what the code looked like when those spikes ran.

## Concurrency hygiene

Every commit staged its files with explicit per-file `git add`. No `git add -A`, no `git add .`, no
`git commit -a`, no `git stash`, no `git clean`. The untracked `.planning/state.json` and
`.planning/.continue-here.md` were left alone. `git diff --diff-filter=D` over the final commit
confirms exactly one deletion — the intended one.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | `26178cf7f` | `feat(157-17): configure the shared logger in both frontend module graphs` |
| 2 + reshapes | `7bc94a473` | `refactor(157-17): migrate every logDebugError call site to the shared structured logger` |
| 3 | `6aaeaed46` | `refactor(157-17): delete the frontend logger module, with no re-export shim` |

## Known Stubs

None. No placeholder, TODO, skipped test or unrun `<verify>` was left behind. Every gate named in the
plan's `<verification>` block was run and its real output is recorded above.

## Threat Flags

None. No package was installed, and no network, auth or file-access surface was added. The registered
threats are addressed: `attributes` is constructed explicitly at every reshaped site and never spread
from a payload (T-157-01); the package default stays `'silent'` so unconfigured consumers emit nothing
(T-157-02); two calls configure the two module graphs (T-157-43); the four two-argument sites pass
their exception under `err` so stacks survive (T-157-44); the module was deleted with no shim
(T-157-45) — though deviation 1 records that the intended detector for that threat was insufficient
and typecheck caught it instead.

## Self-Check: PASSED

`apps/frontend/src/hooks.client.ts` and this SUMMARY exist on disk;
`apps/frontend/src/lib/utils/logger.ts` does not. All three commit hashes resolve in `git log`.
