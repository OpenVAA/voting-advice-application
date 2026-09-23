---
phase: 152-comment-naming-hygiene-sweep
plan: 03
subsystem: frontend
tags: [rename, case-only-rename, module-graph, fixture-spelling, cache-busting, turbo]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-01's live `scripts/assert-comment-hygiene.mjs` (wired into `lint:check`, so every gate run in this plan also ran the guard)"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-02's instruments and `152-BASELINE.md` — the fixed pre-sweep state this plan's greps were measured against"
provides:
  - "`apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.ts` + `.test.ts` — camelCase, matching the `persistedState.svelte.ts` pair that is the directory's convention"
  - "`apps/frontend/src/lib/dynamic-components/entityList/helpers.ts` + `helpers.test.ts` — the bare directory-local names"
  - "`quaternaryChoices` in BOTH categorical-question specs, not only the one the planning record names"
  - "the cache-MISS evidence that the case-only rename's green is a real verdict rather than a replay"
affects: [152-04, 152-10, 152-11, 152-15]

# Actuals (#2632)
actuals:
  tokens: 11857
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "two-step `git mv` via a name differing in more than case: the unconditionally-safe case-only rename on a `core.ignorecase=true` volume, leaving an unambiguous `R` in git's history rather than a delete-plus-untracked-add"
    - "cache-BYPASS as the evidence standard for a case-only rename: `TURBO_FORCE=true` and reading the per-task line (`cache bypass, force executing`) rather than the summary exit code, because a case-insensitive filesystem plus an incremental compiler cache can green a filename that no longer exists in the index"
    - "identifier-only diff proof: normalise the renamed token to a placeholder across `git diff -U0`, then assert every `+` line has an exactly matching `-` line — proves no test was added or removed without needing a before/after test-count run"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.ts
    - apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.test.ts
    - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
    - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
    - apps/frontend/src/lib/dynamic-components/entityList/helpers.ts
    - apps/frontend/src/lib/dynamic-components/entityList/helpers.test.ts
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
    - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts
    - packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.test.ts

key-decisions:
  - "The fixture rename was WIDENED to `singleChoiceCategoricalQuestion.test.ts`, which no requirement text, no roadmap line and no CONTEXT decision names. RESEARCH 8.3's grep found 3 further occurrences there; its `binaryChoices` anchor sits at `:15`, exactly the consistency argument D-A3 makes for the named file. Leaving it would have shipped the misspelling in the adjacent file of the same directory, in the phase whose purpose is naming correctness."
  - "The stale prose reference at `apps/frontend/src/routes/(voters)/+layout.svelte:75` was LEFT IN PLACE, which means this plan's own must_have truth ('a repo-wide grep for each old file stem returns zero lines outside `.planning/` and `.claude/`') is NOT met at this commit. Both 152-03's Task 1 action and 152-11's Task 1 action independently state that 152-11 deletes the whole enclosing block, so editing a line that is about to be deleted would have introduced a one-word mismatch against the verbatim extents 152-11's read_first cites. Registered in WINDOWS as an `unmet-truth` that 152-11 closes."
  - "The class `SettingsOverlay` and the type `SettingsOverlayApi` were NOT renamed — the reviewer asked for the file, PascalCase is correct TS convention for both, and criterion 3 names only the filename. Asserted positively, not just left alone: the acceptance criteria count both symbols after the rename."
  - "Per-rename gating used the FULL `yarn build` and FULL `yarn lint:check` each time, but the SCOPED workspace suite (`yarn workspace @openvaa/frontend|data test:unit`) rather than the full `yarn test:unit`, because each rename touches exactly one workspace. The full `yarn test:unit` ran once after the third rename, green over all three cumulatively. Stated precisely rather than claimed as three full-suite runs."

patterns-established:
  - "A cache-busted verdict is read at the TASK line, not the summary line. `Cached: 0 cached, 11 total` plus `@openvaa/frontend:typecheck: cache bypass, force executing` is the evidence; a green exit code alone would have been consistent with a full replay."
  - "When a rename's acceptance criterion asks for 'the same number of passing tests as before', a mechanical diff-normalisation proof is stronger and cheaper than a before/after run — it rules out an added or deleted test rather than merely observing equal totals."

# Copied verbatim from 152-03-PLAN.md. NOT marked Complete in REQUIREMENTS.md:
# `requirements.ready-ids` returns 0/1 — REVIEW-HYG-03 is ALSO declared by 152-04-PLAN.md
# and 152-15-PLAN.md, neither of which has a SUMMARY yet, so the shared-ID gate (#2388)
# holds it Pending until the last declaring plan finishes.
requirements-completed: [REVIEW-HYG-03]

coverage:
  - id: D1
    description: "The settings-overlay module and its spec renamed to camelCase, with all four import specifiers and the one prose reference repaired, the class and type deliberately untouched, and the green proved to come from a cache-bypassed run."
    requirement: REVIEW-HYG-03
    verification:
      - kind: command
        ref: "git log --diff-filter=R --name-status -1 -- apps/frontend/src/lib/contexts/utils/ — R097 and R100 for the spec and the module; git recorded renames, not add/delete"
        status: pass
      - kind: command
        ref: "TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/frontend — exit 0; 'Cached: 0 cached, 11 total'; '@openvaa/frontend:typecheck: cache bypass, force executing c6fd302696700a9a'; svelte-check found 0 errors and 0 warnings"
        status: pass
      - kind: command
        ref: "git grep -nE \"Settings[O]verlay\\.svelte'\" and \"from '.*Settings[O]verlay\" over apps packages tests — both return zero lines"
        status: pass
      - kind: command
        ref: "git grep -c 'SettingsOverlayApi' -- apps/frontend/src/lib/contexts → 4+3+1 sites; git grep -c 'class SettingsOverlay' -- …/settingsOverlay.svelte.ts → 1 (symbols preserved)"
        status: pass
      - kind: test
        ref: "apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.test.ts — reported executed (5 tests); frontend suite 54 files / 816 tests passed"
        status: pass
      - kind: command
        ref: "yarn build exit 0, yarn lint:check exit 0, git diff --stat .claude/ empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "The entity-list helpers module and spec shortened to the bare directory-local names, with all nine references — two specifiers and seven prose citations — repaired and the barrel untouched."
    requirement: REVIEW-HYG-03
    verification:
      - kind: command
        ref: "git grep -cE 'EntityListWithControls[.]helpers' -- apps packages tests → 0 matches; git grep -n \"from './helpers'\" over the directory → exactly 2 lines"
        status: pass
      - kind: command
        ref: "git diff --stat -- .../entityList/index.ts — empty; the barrel's own planning-reference comment at :5-7 is left for 152-10"
        status: pass
      - kind: command
        ref: "node scripts/assert-unit-test-coverage.mjs — exit 0; 0 violations, 11 workspaces executed, 15 scanned; grep confirms it holds no hard-coded roster entry for either renamed file"
        status: pass
      - kind: test
        ref: "apps/frontend/src/lib/dynamic-components/entityList/helpers.test.ts — reported executed (8 tests); frontend suite 54 files / 816 tests passed, unchanged from D1"
        status: pass
      - kind: command
        ref: "yarn build exit 0, yarn lint:check exit 0 (import-sort ordering accepted whatever eslint decided; no hand-placement)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The four-choice fixture identifier corrected to `quaternaryChoices` in both categorical-question specs — the named one and the unmentioned sibling — with the `binaryChoices` anchor untouched."
    requirement: REVIEW-HYG-03
    verification:
      - kind: command
        ref: "git grep -ciE 'quat[e]nary|quart[e]nary' -- packages apps tests → 0 matches repo-wide"
        status: pass
      - kind: command
        ref: "git grep -c 'quaternaryChoices' → 5 in multipleChoiceCategoricalQuestion.test.ts and 3 in singleChoiceCategoricalQuestion.test.ts (the 5+3=8 RESEARCH 8.3 predicted)"
        status: pass
      - kind: command
        ref: "git grep -c 'binaryChoices' -- .../variants/ → 2 and 4, byte-identical to the pre-task baseline captured before any edit"
        status: pass
      - kind: command
        ref: "identifier-only diff proof — git diff -U0 with the token normalised to a placeholder: every + line has an exactly matching - line (5/5, 1/1, 1/1, 1/1), so no test was added or removed"
        status: pass
      - kind: test
        ref: "yarn workspace @openvaa/data test:unit — 47 files / 244 tests passed; both categorical specs reported executed (5 tests and 1 test)"
        status: pass
      - kind: command
        ref: "yarn test:unit (full, all 11 workspaces) exit 0; yarn build exit 0; yarn lint:check exit 0; node scripts/assert-comment-hygiene.mjs exit 0 (1560 files, 0 violations)"
        status: pass
    human_judgment: false

# Metrics
duration: 18 min
completed: 2026-08-28
status: complete
---

# Phase 152 Plan 03: REVIEW-HYG-03's Three Renames Summary

**Four files renamed and thirteen reference sites repaired — a two-step case-only `git mv` proved green on a cache-BYPASSED typecheck rather than a replayed one, the entity-list helpers shortened with all nine references followed, and the misspelled fixture corrected in both spec files including the one no planning document mentions.**

## Performance

- **Duration:** ~18 min
- **Started:** ~2026-08-28T21:00Z
- **Completed:** 2026-08-28T21:18Z
- **Tasks:** 3 of 3
- **Files modified:** 9 (4 renamed, 5 edited in place)

## Task Commits

1. **Task 1: Case-only rename of the settings-overlay module and its spec** — `ffeb8c327` (refactor)
2. **Task 2: Shorten the entity-list helpers module name and repair its nine references** — `6e53418bc` (refactor)
3. **Task 3: Correct the fixture spelling in both categorical-question specs** — `a81378639` (refactor)

## Accomplishments

### The case-only rename, and why its green is evidence

`core.ignorecase` is `true` on this APFS volume — re-measured this session, not taken from RESEARCH. The
two-step procedure was used for each of the two files:

```
git mv SettingsOverlay.svelte.ts       __settingsOverlay.tmp.ts
git mv __settingsOverlay.tmp.ts        settingsOverlay.svelte.ts
git mv SettingsOverlay.svelte.test.ts  __settingsOverlay.tmp.test.ts
git mv __settingsOverlay.tmp.test.ts   settingsOverlay.svelte.test.ts
```

`git status` reported two `R` entries immediately, and after the commit `git log --diff-filter=R
--name-status` shows `R097` for the spec and `R100` for the module. `git ls-files` on the directory lists
only the new casing — no ghost entry under the old.

**The cache hazard was closed rather than assumed away.** T-152-09 is the reason: an incremental `tsc` can
resolve the pre-rename casing out of a tracked `tsbuildinfo` or out of `.turbo/`, and the resulting green
proves nothing. So `yarn dev:clean` wiped `apps/frontend/.svelte-kit` and `apps/frontend/node_modules/.vite`,
then:

```
TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/frontend
  @openvaa/frontend:typecheck: cache bypass, force executing c6fd302696700a9a
  @openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings
  Tasks:    11 successful, 11 total
  Cached:    0 cached, 11 total
```

`Cached: 0 cached, 11 total` is the line that matters — every one of the eleven tasks executed. The later
`yarn lint:check` typecheck leg *did* report `FULL TURBO` on 22/22 cached tasks, which is exactly the replay
the force-run exists to pre-empt; it is recorded here so nobody mistakes it for the evidence.

The three tracked `tsbuildinfo` files were left alone — they are Phase 153's REVIEW-CFG-06.

**Four specifiers, one prose line, zero symbol renames.** The specifier form keeps the `.svelte` segment and
omits `.ts`. The four sites RESEARCH 8.1 enumerated were the entire linkage — `layoutContext.svelte.ts:9`
(value), `layoutContext.type.ts:4` (type-only), and the two same-directory `./` specifiers in the renamed
spec's own import block — and the cache-bypassed typecheck is the oracle that no fifth existed. The prose
line at `layoutContext.svelte.ts:131` now reads *"the write-after-read hazard settingsOverlay.svelte.ts
documents"*. The class `SettingsOverlay` and the interface `SettingsOverlayApi` are untouched, and the
acceptance criteria assert their survival positively rather than trusting that nothing happened to them.

`layoutContext.svelte.ts:9` sits in a sorted relative-import block and the specifier's leading character
changed case; the ordering was left entirely to eslint's import-sort rule (T-152-11's accepted residual),
and `yarn lint:check` passed without demanding a move.

### The helpers rename, and the nine sites

Plain `git mv` — not a case-only rename, and RESEARCH 8.2's directory listing confirmed no collision. All
nine occurrences went in one pass and every one was verified afterwards:

| Site | Kind | After |
|---|---|---|
| `EntityListWithControls.svelte:43` | specifier | `from './helpers'` |
| `helpers.test.ts:2` | specifier | `from './helpers'` |
| `EntityListWithControls.svelte:27` | `<!--@component-->` prose | ``See `helpers.ts` for the pure …`` |
| `helpers.ts:12` | docblock prose | ``Tested in `helpers.test.ts`.`` |
| `helpers.test.ts:6` | docblock prose | ``` `helpers.ts` — `computeFiltered` and ``` |
| `helpers.test.ts:9` | docblock prose | ``module graph is exactly `vitest` plus `./helpers` `` |
| `helpers.test.ts:11` | VERIFIED citation | `[VERIFIED: the import block above; helpers.ts:1-32]` |
| `helpers.test.ts:19` | VERIFIED citation | `[VERIFIED: helpers.ts:14-21]` |
| `helpers.test.ts:25` | VERIFIED citation | `[VERIFIED: helpers.ts:29-32]` |

The three cited line ranges stayed valid: the only edit inside `helpers.ts` was a substitution within its
line 12, so the file's line count and the positions of `computeFiltered` (`:14-21`) and
`countActiveFilters` (`:29-32`) are unchanged.

The barrel `index.ts` was confirmed not to export the helpers and is byte-unchanged
(`git diff --stat` on it is empty), so its own planning-reference comment at `:5-7` remains intact for
152-10's judgement pass and the two diffs stay separable.

**T-152-10 was checked, not assumed.** `grep` over `scripts/assert-unit-test-coverage.mjs` returns no
reference to either renamed file, the guard exits 0, and — the point of the threat — vitest reported
`helpers.test.ts (8 tests)` as *executed*. A renamed spec that silently stopped being discovered would have
passed by not running, which this project counts as a failure.

### The fixture spelling, widened by one file

`quatenaryChoices` → `quaternaryChoices`, 8 occurrences: five in
`multipleChoiceCategoricalQuestion.test.ts` (a module-level `const` at `:11`, used at `:33`, `:46`, `:61`,
`:70`) and three in `singleChoiceCategoricalQuestion.test.ts` (a function-local `const` at `:19`, used at
`:34` and `:36`). Both file-local: zero exports, zero cross-file references, so the rename closed inside the
two files.

The reviewer's literal `quartenaryChoices` was **not** used — D-A3 rejects it on the ground that it is also
not a word, and `REQUIREMENTS.md:90` already carries the correction. `binaryChoices` was not touched: its
counts are 2 and 4, identical to the baseline captured before any edit.

**The widening, stated as the decision it is.** `152-CONTEXT.md`, `ROADMAP.md:1015` and `REQUIREMENTS.md:90`
all name exactly one site — `multipleChoiceCategoricalQuestion.test.ts:11`. The sibling
`singleChoiceCategoricalQuestion.test.ts` appears in no requirement text, no roadmap line and no CONTEXT
decision; RESEARCH 8.3 found it by grep and flagged the contradiction. A later verifier should read the
second file as a deliberate widening on measured evidence, not as drift.

Instead of a before/after test-count comparison, the "same number of passing tests" criterion was closed
mechanically: normalising the renamed token to a placeholder across `git diff -U0` leaves every `+` line
with an exactly matching `-` line, which rules out an added or removed test rather than merely observing
equal totals. The run then confirmed it anyway — `@openvaa/data` 47 files / 244 tests, both categorical
specs executed.

## Gate results

| Gate | Task 1 | Task 2 | Task 3 |
|---|---|---|---|
| `yarn build` (full) | exit 0 | exit 0 | exit 0 |
| `yarn lint:check` (full 6-link chain) | exit 0 | exit 0 | exit 0 |
| workspace `test:unit` | frontend 54/816 | frontend 54/816 | data 47/244 |
| `yarn test:unit` (full, 11 workspaces) | — | — | exit 0 |
| `TURBO_FORCE` typecheck, cache MISS | exit 0, 0 cached/11 | — | — |
| `node scripts/assert-unit-test-coverage.mjs` | — | exit 0 | exit 0 |
| `node scripts/assert-comment-hygiene.mjs` | via lint:check | via lint:check | exit 0 standalone |

`yarn lint:check` runs `assert:comment-hygiene` as its last link, so 152-01's guard was exercised on every
one of the three gate runs and stayed green through the wave.

## Deviations from Plan

### Scope widening (recorded in the plan itself, executed as written)

**1. [Planned widening] The fixture rename covers a second, unmentioned spec file**
- **Found during:** Task 3 (predicted by RESEARCH 8.3; the plan's objective pre-authorised it)
- **Issue:** `singleChoiceCategoricalQuestion.test.ts` carries the same misspelling and is named nowhere in the planning record.
- **Fix:** Renamed in the same commit as the named file.
- **Files modified:** `packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.test.ts`
- **Commit:** `a81378639`

### Unmet must_have truth, left deliberately

**2. [Coordination] One stale prose reference to the old overlay filename survives in the tree**
- **Found during:** Task 1
- **Issue:** This plan's must_have truth requires *"a repo-wide grep for each old file stem … returns zero lines outside `.planning/` and `.claude/`"*. `git grep -nI "SettingsOverlay\.svelte" -- ':!.planning' ':!.claude'` returns exactly one line: `apps/frontend/src/routes/(voters)/+layout.svelte:75`, inside the seventeen-line narrative block.
- **Why not fixed:** 152-03's Task 1 action says *"no action here"*; 152-11's Task 1 action says the block *"goes entirely, [so] no stale filename survives in this file"*. Both plans coordinate on 152-11 owning it. 152-11's `read_first` cites RESEARCH § 7's verbatim extents at HEAD `22c2542e3`; editing a word inside a block that is about to be deleted wholesale would have introduced an unexplained one-word mismatch for that executor to trip over, for zero durable gain.
- **Verification:** the grep above; the reference is prose only — no import specifier, no type reference, and the cache-bypassed typecheck proves no code linkage to the old name remains.
- **Registered:** `.planning/WINDOWS.md`, kind `unmet-truth`, closes when 152-11 lands.

### Out-of-scope discovery, not fixed

**3. [Scope boundary] A typo in a neighbouring assertion message**
- **Found during:** Task 3, reading `singleChoiceCategoricalQuestion.test.ts:36`
- **Issue:** the message reads *"To spread normalized values to multiple dimesions"* — should be *dimensions*.
- **Why not fixed:** it is a string literal, not an identifier or a filename, so it is outside REVIEW-HYG-03 and outside REVIEW-HYG-04's UK/US identifier scope. Fixing it would have widened the diff past the requirement without a decision behind it.
- **Registered:** `.planning/WINDOWS.md`, kind `deviation` — a candidate for 152-04's spelling pass.

**Total deviations:** 1 pre-authorised widening executed, 1 unmet truth left deliberately and registered, 1 out-of-scope discovery registered and not fixed. **Impact:** none on behaviour; the unmet truth is closed by an already-planned sibling plan.

## Requirements

`REVIEW-HYG-03` is **NOT** marked Complete. `requirements.ready-ids` returns `0/1`: the ID is also declared
by `152-04-PLAN.md` and `152-15-PLAN.md`, neither of which has a SUMMARY yet, so the shared-ID gate (#2388)
holds it Pending until the last declaring plan finishes. The three renames the requirement's own text names
are nonetheless all landed and green as of `a81378639`.

## Authentication Gates

None.

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced; the plan changed filenames, import
specifiers, prose citations and one identifier, and added no code paths.

## Threat Flags

None. The plan added no network endpoint, no auth path, no file-access pattern and no schema change.
T-152-06's runtime-key concern was re-confirmed inapplicable here: none of the four filenames nor the
fixture identifier is a database key, `external_id`, seed value, Edge Function name, storage bucket, env
var, Playwright project name or CI secret.

## Notes for the next plan

- **`yarn test:e2e` was not run.** RESEARCH § 8.4 states none of the three renames affects E2E directly, this
  plan's `<verification>` block does not name it, and `yarn build` + the cache-bypassed `svelte-check` prove
  the module graph resolves. The phase's later comment-sweep plans touch E2E specs and fixtures heavily, so
  CLAUDE.md's cardinal rule still binds the phase as a whole — the full suite belongs to whichever plan first
  edits a `tests/**` file.
- **152-11 inherits one line of this plan's work**: deleting the `(voters)/+layout.svelte` narrative block is
  what closes the `unmet-truth` window registered above.
- **152-10 must still leave `entityList/index.ts` alone until its own turn** — this plan verified that file is
  byte-unchanged precisely so the two diffs stay separable.

## Self-Check: PASSED

- All 9 modified files exist on disk under their post-rename names; the 4 renamed paths verified with
  `git ls-files` (old casings/stems absent, new present).
- All 3 commit hashes found by `git log --oneline --all`: `ffeb8c327`, `6e53418bc`, `a81378639`.
- All acceptance criteria across the three tasks re-run and passing; the plan-level `<verification>` block
  re-run: three negative greps at 0, `assert-unit-test-coverage.mjs` exit 0, `assert-comment-hygiene.mjs`
  exit 0, `TURBO_FORCE` typecheck green on a bypass.
- No file deletions in any of the three commits (`git diff --diff-filter=D` empty for each).
