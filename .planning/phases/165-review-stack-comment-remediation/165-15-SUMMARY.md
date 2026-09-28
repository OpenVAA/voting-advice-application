---
phase: 165-review-stack-comment-remediation
plan: 15
subsystem: frontend-contexts-utils
tags: [refactor, a11y, focus-management, tailwind-merge, drift-test, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene gate, read log, code-identity, assert-absent, ledger), 165-11 wave ordering
provides:
  - contexts/utils/sameRefs.ts, with a colocated unit test, imported by voterContext
  - focusNavigationTarget cancels its pending wait on the user's first pointerdown (capture, passive, once)
  - An exported SPACING_WORD_NAMES / BORDER_WIDTH_WORD_NAMES and a components.test.ts drift test against app.css
  - Present-tense, planning-free comments in voterContext, components, logLevel and both writer factories
affects: [165-24, 165-36]

actuals:
  tokens: 22090
  tasks: 3
  commits: 8
plan_head_before: 1823e40daf03fed39574f17e9557be24dafd73b5
plan_head_after: a2f9c4153f535474c55b7ccce16f3e6499375449

tech-stack:
  added: []
  patterns:
    - "A theme-mirroring constant gets a drift test that parses app.css at test time and asserts set equality both ways, with a negative case over a string copy"
    - "A focus routine that waits yields to the user through a passive capture listener that only cancels"

key-files:
  created:
    - apps/frontend/src/lib/contexts/utils/sameRefs.ts
    - apps/frontend/src/lib/contexts/utils/sameRefs.test.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-15.tsv
  modified:
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/utils/focusNavigationTarget.ts
    - apps/frontend/src/lib/utils/focusNavigationTarget.test.ts
    - apps/frontend/src/lib/utils/components.ts
    - apps/frontend/src/lib/utils/components.test.ts
    - apps/frontend/src/lib/utils/logLevel.ts
    - apps/frontend/src/lib/utils/logLevel.test.ts
    - apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts
    - apps/frontend/src/lib/api/dataWriter.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "Focus wait: cancelling on pointer interaction is feasible, so it is cancelled on the first pointerdown (capture, passive, once), pointermove is not used, and FOCUS_TARGET_WAIT_MS stays at 10 000 ms"
  - "components.ts word lists cannot be removed through app.css theme variables (tailwind-merge's spacing scale is ['px', isNumber]); they stay, exported, and a drift test replaces the manual obligation (D-09)"
  - "Data writer caching has no use: no writer cache exists, every call is fresh over the memoised tab client, and a cache would reintroduce a cross-request singleton server-side; docstrings only"

patterns-established:
  - "Comment-only hygiene rewrites of a file touched for a review comment go in their own `Hygiene: D-04` commit, proven with code-identity against the previous commit"

requirements-completed: [165-SC2, 165-SC3, C-4106783651, C-4106942130, C-4106923157, C-4106960010, C-4106737701]

coverage:
  - id: D1
    description: "sameRefs lives in contexts/utils with a one-line docblock and a colocated test; voterContext imports it and carries no narrative about it"
    requirement: "C-4106783651"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit sameRefs voterContext (5/5)"
        status: pass
      - kind: other
        ref: "bash scripts/assert-absent.sh 'function sameRefs' -- apps/frontend/src/lib/contexts/voter (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A pointerdown while the focus target is pending cancels the wait; sibling listeners still receive the event and defaultPrevented stays false; cancel() removes the listener"
    requirement: "C-4106942130"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit focusNavigationTarget (9/9)"
        status: pass
      - kind: e2e
        ref: "plan 165-24 full E2E run including the a11y projects"
        status: unknown
    human_judgment: false
  - id: D3
    description: "components.test.ts fails when SPACING_WORD_NAMES / BORDER_WIDTH_WORD_NAMES drift from app.css's word-named tokens"
    requirement: "C-4106923157"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit components (67/67); scratch red run with --spacing-xxs added fails naming xxs"
        status: pass
    human_judgment: false
  - id: D4
    description: "logLevel.ts comments state the contract in one or two sentences each, with no planning references"
    requirement: "C-4106960010"
    verification:
      - kind: other
        ref: "node scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE apps/frontend/src/lib/utils/logLevel.ts (exit 0); comment lines 32 -> 20"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both writer factories document a fresh writer per call; no cache added"
    requirement: "C-4106737701"
    verification:
      - kind: other
        ref: "node scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE prepareDataWriter.ts dataWriter.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "All eleven shipped files pass the hygiene gate with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash scripts/hygiene-changed-files.sh --check-reads --files <11 files> (exit 0, unread=0)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 15: Contexts and utils review fixes Summary

**`sameRefs` moved to `contexts/utils` with its own test. The post-navigation focus wait now yields to the user's first pointer press through a passive capture listener that only cancels. A drift test in `components.test.ts` replaces the "standing maintenance obligation" for the tailwind-merge word lists. `logLevel.ts`, `voterContext` and both writer factories now state their contracts in the present tense.**

## Performance

- **Duration:** about 15 min
- **Started:** 2026-09-27T20:37:01Z
- **Completed:** 2026-09-27T20:52:00Z
- **Tasks:** 3 of 3
- **Files modified:** 13 (2 created and 9 modified shipped files, 1 read log, the ledger)

## Accomplishments

- `sameRefs<TItem>(a, b)` now lives in `apps/frontend/src/lib/contexts/utils/sameRefs.ts` with a one-line docblock. `voterContext.svelte.ts` imports it. A single present-tense sentence at the first call site says why it is needed: fresh param arrays on every URL change would otherwise wake every reader and rebuild the filter groups.
- All comments in `voterContext.svelte.ts` were rewritten. Gone: the grep counts, `Decision Q3`, the spec line reference, the Svelte 4 and "original behaviour" history, and the stale claim that `Object.assign` installs the inherited members. The `getGlobalContext` name in `initVoterContext`'s docblock was also corrected to `getVoterContext`.
- `focusNavigationTarget` registers `doc.addEventListener('pointerdown', cancel, { capture: true, passive: true, once: true })` once the first lookup finds no target, and `cancel()` removes it with `capture: true`. `FOCUS_TARGET_WAIT_MS = 10_000` is unchanged. The module docblock says what the function does, why it waits, and how it yields (a focus move or a pointer press). The requirement id and the reproduction story are gone.
- `components.ts` exports `SPACING_WORD_NAMES` and `BORDER_WIDTH_WORD_NAMES`. `components.test.ts` parses `app.css`'s `--spacing-*` (excluding numeric names and `px`) and `--border-width-*` (excluding numeric names and `DEFAULT`) word names and asserts set equality in both directions. A negative case shows that adding `--spacing-xxs` gets named in `missingFromList`.
- `logLevel.ts` and its test now state only the contract. `logLevel.ts` is comment-only, with 32 comment lines at the phase base and 20 now.
- `prepareDataWriter.ts` and `dataWriter.ts` state the fresh-writer contract, without the "nineteen call sites" count or the "older justification ... Do not restore it" narrative.

## Task Commits

1. **Task 1: move `sameRefs` (tracer, TDD)**: `b95fc76d3` (refactor, `Review-Comment: C-4106783651`), `bd0ad6942` (docs, `Hygiene: D-04`, comment-only)
2. **Task 2: pointer cancel (TDD)**: `9286bbeff` (feat, `Review-Comment: C-4106942130`)
3. **Task 3: drift test, logLevel, writer verdict**: `a3519ed52` (test, `Review-Comment: C-4106923157`), `66198488a` (docs, `Hygiene: D-04`, comment-only), `e2bce133c` (docs, `Review-Comment: C-4106960010`), `df80c76ff` (docs, `Review-Comment: C-4106737701`), `a2f9c4153` (chore, `Hygiene: D-04`, read log and ledger rows)

**Plan metadata:** the `docs(165-15)` commit that carries this SUMMARY.

## RED / GREEN evidence

- **Task 1 RED:** `yarn workspace @openvaa/frontend test:unit sameRefs` exited 1 with `Failed to resolve import "./sameRefs" from "src/lib/contexts/utils/sameRefs.test.ts"` and `Test Files 1 failed (1)`. **GREEN:** exit 0, `Tests 5 passed (5)`.
- **Tracer gate:** `human_verify_mode` is `end-of-phase` and the verify is automated-only. After `b95fc76d3`, all three verify commands were re-run and exited 0 before expansion.
- **Task 2 RED:** `yarn workspace @openvaa/frontend test:unit focusNavigationTarget` exited 1 with `Tests 3 failed | 6 passed (9)`. The pointer case focused the late target. The listener case found no `pointerdown` registration (`expected undefined to match object { capture: true, passive: true }`). The timeout case failed as a cascade of the first case's uncancelled wait. The sibling/`defaultPrevented` case passed on RED as expected, since no listener existed yet. **GREEN:** exit 0, `Tests 9 passed (9)`.
- **Task 3 RED (drift test):** before the lists were exported, `test:unit components` exited 1 with `Tests 3 failed | 64 passed (67)` (`TypeError: Cannot read properties of undefined (reading 'includes')`). **GREEN:** exit 0, 67/67.
- **Drift test scratch red run:** the positive spacing case was temporarily fed `` `${appCss}\n  --spacing-xxs: 0.125rem;\n` ``. `test:unit components.test` exited 1: `expected { missingFromList: [ 'xxs' ], …(1) } to deeply equal { Object (missingFromList, notInAppCss) }`, with the diff showing `+ "xxs"`. The file was then restored byte-identical (`cmp` exit 0).

## Verification (every status read directly)

| Command | Exit |
|---|---|
| `yarn workspace @openvaa/frontend test:unit sameRefs voterContext` | 0 (5/5) |
| `bash scripts/assert-absent.sh 'function sameRefs' -- apps/frontend/src/lib/contexts/voter` | 0 (absent) |
| `yarn workspace @openvaa/frontend test:unit focusNavigationTarget` | 0 (9/9) |
| `grep -c 'FOCUS_TARGET_WAIT_MS = 10_000' focusNavigationTarget.ts` | prints 1 |
| `grep -c 'preventDefault\|stopPropagation' focusNavigationTarget.ts` | prints 0 |
| `grep -c 'Svelte 4' sameRefs.ts` | prints 0 |
| `yarn workspace @openvaa/frontend test:unit components logLevel` | 0 (components 67/67, logLevel 10/10) |
| `grep -c 'STANDING MAINTENANCE OBLIGATION' components.ts` | prints 0 |
| `grep -cE '^\s*(\*\|//)' logLevel.ts` | 32 at `ship/v2.15-12-planning`, 20 now |
| `node scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE logLevel.ts prepareDataWriter.ts dataWriter.ts` | 0 (3 compared, 0 changed code) |
| `node scripts/code-identity.mjs HEAD WORKTREE voterContext.svelte.ts` (before `bd0ad6942`) | 0 |
| `node scripts/code-identity.mjs HEAD WORKTREE components.ts` / `components.test.ts` (before `66198488a`) | 0 / 0 |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <all 11 shipped files>` | 0 (CLEAN, unread=0) |
| `bash scripts/tip-proofs.sh` | 0 |
| `bash scripts/ledger-check.sh` | 0 (78 rows; no 165-15 row pending) |
| `yarn workspace @openvaa/frontend check` | 0 (2778 files, 0 errors, 0 warnings) |
| `eslint --flag v10_config_lookup_from_file src/` from `apps/frontend` (the package `lint` script's command, via the root binary) | 0 (one pre-existing warning in `candidateContext.svelte.test.ts`) |
| `yarn workspace @openvaa/frontend test:unit` (whole frontend) | 0 (106 files, 1853 tests) |

The behavioural proof for real navigation, including the a11y projects, is the full E2E run in plan 165-24. This plan ran no E2E, as the wave-safety rules require.

## Review-comment dispositions

| Comment | Verdict | Commit | Evidence | Draft reply |
|---|---|---|---|---|
| C-4106783651 (`voterContext.svelte.ts:545` sameRefs) | fix | `b95fc76d3` (+ `bd0ad6942`) | sameRefs 5/5 after RED; assert-absent exit 0 | Moved to `contexts/utils/sameRefs.ts` with a one-line docblock and its own test. The narrative is gone and the call site states the reason in one sentence. |
| C-4106942130 (`focusNavigationTarget.ts:61` pointer cancel) | fix. Verdict: feasible. Cancelled on `pointerdown`; timeout kept | `9286bbeff` | A passive capture listener that only calls `cancel()` cannot change any other handler or default action. The tests show a sibling listener still gets the event with `defaultPrevented === false`. `pointermove` is left out because hover jitter would cancel the wait. | Yes: a passive capture `pointerdown` listener cancels the wait without affecting anything else. The 10 s timeout stays, since the 5 s fallback was for the case where cancelling was not possible. |
| C-4106923157 (`components.ts:22` duplication) | fix. Verdict: not removable. Drift test added (D-09) | `a3519ed52` (+ `66198488a`) | tailwind-merge 3.7.0's default theme has `spacing: ['px', isNumber]`, so `p-xs` is unrecognised unless declared. Any name it would recognise without declaration is numeric, which would rename `p-xs`. The drift test fails naming `xxs` on a copy that adds it. | It can't be removed without renaming `p-xs`-style classes, so the lists stay. A test now fails whenever they drift from `app.css`. |
| C-4106960010 (`logLevel.ts:1` prose) | fix | `e2bce133c` | code-identity exit 0; comment lines 32 -> 20; hygiene gate clean | Cut to the contract: the four levels, missing vs invalid, never throws, configure then emit. |
| C-4106737701 (`prepareDataWriter.ts:18` caching) | fix. Verdict: no use; no cache exists | `df80c76ff` | `prepareDataWriter()` returns `createDataWriter({ fetch, browser: true })`, and that returns `new SupabaseDataWriter(resolveAdapterConfig(source))`, so every call is fresh. The only memo is `let browserClient` in `lib/supabase/browser.ts`. A cache would save only a trivial construction in the browser and would reintroduce a cross-request singleton on the server, where `createDataWriter` serves loads. | Caching buys nothing. The writer is a fresh, cheap object over the memoised client, and on the server a cache would share state across requests. Both docstrings now say so. |

The same Evidence, Commit and Draft reply cells are filled in `165-LEDGER.md`.

## Decisions Made

- The pointer listener is registered only once the wait begins, after the first lookup has found no target. A press before the first frame therefore does not cancel an immediate focus, which is the behaviour the plan specified.
- The drift test lets a word appear in both directions of the comparison (`missingFromList` and `notInAppCss`), so a list entry whose token was removed from `app.css` fails too.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The drift test resolves `app.css` from the vitest root, not from the test file's URL**
- **Found during:** Task 3
- **Issue:** The plan said to read `app.css` "via `node:fs` resolved from the test file's URL". `components.test.ts` already documents that under this project's `conditions: ['browser']` vitest config, `import.meta.url` is not a `file:` URL and cannot be converted to a path.
- **Fix:** The test reuses the file's existing `SRC_ROOT = join(process.cwd(), 'src')`, which is guarded by the sweep's `existsSync` assertion. A non-vacuity case also asserts that the parser finds `xs` and `md`.
- **Files modified:** `apps/frontend/src/lib/utils/components.test.ts`
- **Commit:** `a3519ed52`

**2. [Rule 1 - Bug] Stale or wrong statements in comments on the files this plan changed**
- **Found during:** Tasks 1 and 3, in the hygiene reads
- **Issue:** `voterContext` said the inherited members are installed "via `Object.assign`" (they are installed by `inheritContextMembers`) and named `getGlobalContext()` for `getVoterContext()`. It also called prototype getters "spread-safe". `components.ts` referred to the Svelte 4 `$$restProps`. `logLevel.ts`'s `LogLevelProblem` docblock said both reasons produce an `error` record, but a missing value is reported at `info`.
- **Fix:** Rewrote these as correct present-tense statements, comment-only (code-identity exit 0).
- **Commits:** `bd0ad6942`, `66198488a`, `e2bce133c`

### Other deviations

- The hygiene rewrites of `voterContext` and `components.ts`/`components.test.ts` went in their own `Hygiene: D-04` commits, separate from the `Review-Comment:` commits. That keeps each comment's commit minimal and each rewrite provably comment-only.
- `logLevel.test.ts` also dropped "(ordering — pitfall P3)" from one `describe` title. This is a planning reference inside a string literal. It is the only non-comment change in that file (code-identity reports exactly that line), and the plan's verify proves only `logLevel.ts`.
- No `hygiene-allow/165-15.tsv` was written, because no line needed an exception.
- `yarn workspace @openvaa/frontend lint` cannot run here because eslint is a root devDependency (orchestrator note). The package script's own command ran through the root binary instead.

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug), plus the four notes above. **Impact:** none on scope. Every acceptance criterion holds.

## Issues Encountered

- The first ledger-fill script crashed before writing (a Python loop bug). `git diff` confirmed the ledger was untouched, and the corrected script wrote the five rows.

## Known Stubs

None.

## Threat Flags

None. The only new surface is the pointer listener, T-165-25 in the plan's register, mitigated as specified: passive, capture, never prevents the default or stops propagation, and removed on every cancel path.

## Next Phase Readiness

The E2E behavioural proof of the pointer cancel on real navigation belongs to plan 165-24's full run, including the a11y projects.

## Self-Check: PASSED

- FOUND: `apps/frontend/src/lib/contexts/utils/sameRefs.ts`, `apps/frontend/src/lib/contexts/utils/sameRefs.test.ts`, `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-15.tsv`
- FOUND commits: `b95fc76d3`, `bd0ad6942`, `9286bbeff`, `a3519ed52`, `66198488a`, `e2bce133c`, `df80c76ff`, `a2f9c4153`
- No commit in `1823e40da..a2f9c4153` deletes a tracked file.
