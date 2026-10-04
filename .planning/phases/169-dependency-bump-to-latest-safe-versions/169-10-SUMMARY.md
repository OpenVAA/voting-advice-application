---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 10
subsystem: infra
tags: [dependencies, concurrently, lint-staged, changesets, glob, js-yaml, globals, dotenv, intl-messageformat, catalog, supply-chain, braces]

requires:
  - phase: 169-09
    provides: "ai 7 / @ai-sdk 4, 12/12 gates, E2E 171/171 on PG17; HEAD 5aaafa665"
  - phase: 169-01
    provides: "the version probe, the gate runner, the age gate, the braces baseline row"
provides:
  - "concurrently 10.0.5 and lint-staged 17.6.0, each exercised through the root config that uses it"
  - "@changesets/cli 3.0.3 + @changesets/changelog-github 1.0.1 in one commit, config schema on @changesets/config 4.0.1"
  - "micromatch / braces out of the tree (changesets 3 uses picomatch): audit 0 new, 0 accepted"
  - "glob 13.0.6 at both declarations; the docs generators regenerate the committed pages byte-identically"
  - "@types/cheerio removed (cheerio ships its own types)"
  - "js-yaml 5.4.2 through the catalog, @types/js-yaml gone; all 31 prompt YAML files parse identically on 4 and 5"
  - "globals 17.12.0 through the catalog, now also declared by @openvaa/shared-config, which imports it"
  - "dotenv 18 and intl-messageformat 12 held with clear dates and a todo"
  - "completeness sweep: 0 UNASSIGNED-MAJOR rows, 35 catalog keys all consumed"
  - "group 8 gates 12/12"
affects: [169-11, 169-12, 169-13]

actuals:
  tokens: 34300    # chars/4 over the realized diff 5aaafa665..e3add695f (117381 chars incl. yarn.lock; 37299 without) plus this summary
  tasks: 3
  commits: 8       # git rev-list --count 5aaafa665..HEAD at SUMMARY time (the SUMMARY/state commits follow)
plan_head_before: 5aaafa66513a9d4207a67ebbea9eed184e2582fa
plan_head_after: e3add695f48e88e21e5553877f65bc26c015b442

tech-stack:
  added: ["concurrently 10.0.5", "lint-staged 17.6.0", "@changesets/cli 3.0.3", "@changesets/changelog-github 1.0.1", "@changesets/config 4.0.1", "glob 13.0.6", "js-yaml 5.4.2", "globals 17.12.0", "@clack/prompts 1.8.1", "@clack/core 1.5.1"]
  removed: ["@types/cheerio 0.22.35", "@types/js-yaml 4.0.9", "micromatch 4.0.8", "braces 3.0.3", "listr2 9.0.5", "@types/node 26.6.3 (stub-only)", "globals 15.15.0"]
  patterns:
    - "Before a parser major, snapshot what every real input parses to under the old version and diff it byte-for-byte against the new one; mocked tests do not see schema-default changes"
    - "Exercise lint-staged only with an empty index (`git diff --cached --quiet` first), so its internal backup stash is never reached"

key-files:
  created:
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-10-SUMMARY.md
    - .planning/todos/pending/2026-10-03-dotenv-18-and-intl-messageformat-12-held.md
  modified:
    - package.json
    - yarn.lock
    - .yarnrc.yml
    - .changeset/config.json
    - apps/docs/package.json
    - packages/llm/package.json
    - packages/shared-config/package.json
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md
    - .planning/todos/done/2026-10-02-declare-globals-in-shared-config.md

key-decisions:
  - "Age rule measured live at 16:45:55Z: concurrently 10.0.5, lint-staged 17.6.0, @changesets/cli 3.0.3, changelog-github 1.0.1, glob 13.0.6, js-yaml 5.4.2, globals 17.12.0 taken; globals 17.13.0 held (7-day); dotenv 18 (clears 2026-10-17T21:18Z) and intl-messageformat 12 (clears 2026-10-15T12:27Z) held (30-day), on their newest current-major releases 17.4.2 / 11.2.15."
  - "@openvaa/shared-config now declares globals: catalog: (Rule 2). Its ESLint config imported globals undeclared and linted with whatever was hoisted (todo 2026-10-02-declare-globals-in-shared-config, handed to 169-10)."
  - "`yarn changeset status` exit 1 on this branch is accepted as the CLI's documented 'packages changed, no changesets' outcome (the same in 2.x); config loading is proven by `--since=HEAD` exit 0 and config 4 readConfig with no warnings or errors."
  - "The braces path left with changesets 3. security/audit-baseline.json is not edited; 169-13 drops the now-stale 1240992 row."
  - "The root glob declaration (no root importer) and the docs app's unused eslint-config-prettier are recorded as residue for 169-13, not removed: the plan's sweep covers unassigned majors and consumer-less catalog keys only."
  - "No E2E run: D-26 lists no E2E after group 8, and no upgrade here touches a runtime path E2E drives (dotenv, the one test-runtime package, was held)."

patterns-established:
  - "Parse-equivalence check for a YAML loader major: load every tracked YAML input with both versions, compare the JSON byte-for-byte"

requirements-completed: []  # DEPS-12 stays Pending: dotenv 18 and intl-messageformat 12 are held to 2026-10-17 / 2026-10-15, and 169-13 reconciles the baseline

coverage:
  - id: D1
    description: "concurrently and lint-staged on their newest safe majors, one commit each, exercised through _dev:concurrent's flags and .lintstagedrc.json"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "yarn concurrently -n a,b -c blue,green --kill-others-on-fail 'node -e 0' 'node -e 0' -> exit 0; negative control exit 1 with SIGTERM to the sibling (tests/e2e-runs/169-gates/10/t1-conc-*.log)"
        status: pass
      - kind: other
        ref: "yarn lint-staged --debug with an empty index -> exit 0, config loaded with both globs (t1-ls-exercise.log); yarn why -> 10.0.5 / 17.6.0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The changesets pair moved together; the config parses on config 4"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "yarn changeset status --since=HEAD -> exit 0; readConfig -> warnings [], errors undefined (t2-cs-readconfig.log). Plain `yarn changeset status` -> exit 1, the documented no-changesets outcome (t2-cs-status.log)"
        status: pass
    human_judgment: false
  - id: D3
    description: "glob 13 at every declaration; the docs generators reproduce the committed pages"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs generate:docs -> exit 0; git status --porcelain -- apps/docs -> empty after e268a7d19"
        status: pass
    human_judgment: false
  - id: D4
    description: "@types/cheerio removed and the tests typecheck"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "node -p devDependencies['@types/cheerio'] -> absent; yarn typecheck:tests -> exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "js-yaml 5 through the catalog, the safe default load kept, prompt files parse the same"
    requirement: DEPS-12
    verification:
      - kind: unit
        ref: "@openvaa/llm 43/43, argument-condensation 30/30, question-info 22/22 (real prompt dirs registered in test setup)"
        status: pass
      - kind: other
        ref: "31-file parse snapshot under js-yaml 4.3.2 vs 5.4.2 -> byte-identical JSON (sha256 c631134c38ae...)"
        status: pass
    human_judgment: false
  - id: D6
    description: "globals one version through the catalog for every declarer; lint findings unchanged"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "yarn why globals -> frontend and shared-config 17.12.0; TURBO_FORCE=true yarn lint:check exit 0, normalised list == 09/lint-norm-after.txt"
        status: pass
    human_judgment: false
  - id: D7
    description: "dotenv 18 and intl-messageformat 12 held with clear dates"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "169-EVIDENCE.md § 3 rows (clear 2026-10-17T21:18Z / 2026-10-15T12:27Z); todo 2026-10-03-dotenv-18-and-intl-messageformat-12-held.md; playwright --list config load exit 0 on 17.4.2"
        status: pass
    human_judgment: false
  - id: D8
    description: "No unassigned major left; every catalog key consumed"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "tests/e2e-runs/169-gates/10-t3-probe.md -> 0 UNASSIGNED-MAJOR; plan catalog check -> '35 catalog keys, all consumed'"
        status: pass
    human_judgment: false
  - id: D9
    description: "Group 8 ends with all twelve D-26 gates green"
    requirement: DEPS-12
    verification:
      - kind: other
        ref: "169-gates.sh 169-10-group8 -> 12 rows of 0 at 5017d4a17"
        status: pass
    human_judgment: false

duration: 19min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 10: the small tooling majors, one commit each; changesets 3 removes the braces path; dotenv 18 and intl-messageformat 12 held to mid-October Summary

**Seven upgrades landed, one commit each: `concurrently` 10.0.5, `lint-staged` 17.6.0, the changesets pair
(`@changesets/cli` 3.0.3 with `@changesets/changelog-github` 1.0.1), `glob` 13.0.6, the `@types/cheerio` removal,
`js-yaml` 5.4.2 and `globals` 17.12.0. The changesets move had a side benefit: `micromatch` and `braces` left the
tree, so the audit's one accepted finding is gone (0 new, 0 accepted). `js-yaml` 5 parses all 31 prompt files to the
same values as 4. `@openvaa/shared-config` now declares the `globals` it imports. `dotenv` 18 and
`intl-messageformat` 12 are still inside the 30-day window and are held on their newest current-major releases. The
sweep found no unassigned major and no orphan catalog key. The gates are 12/12.**

## Performance

- **Duration:** 19 min (2026-10-03T16:47:23Z → 17:06Z)
- **Tasks:** 3 of 3
- **Files modified:** 7 repository files (plus `yarn.lock`), the evidence ledger, two todos

## Accomplishments

- **Age rule, measured live** with a whole-tree probe at 16:45:55Z. It shows 10 `major` verdicts and no
  `UNASSIGNED-MAJOR` row. Holds:
  - `globals` 17.13.0 is inside the 7-day window.
  - `dotenv` 18.0.0 is 16.8 d old and clears 2026-10-17T21:18Z.
  - `intl-messageformat` 12.0.0 is 18.2 d old and clears 2026-10-15T12:27Z.
- **`concurrently` 10.0.5** (`797196ee4`). `_dev:concurrent`'s `-n` / `-c` / `--kill-others-on-fail` flags still
  work. The exercise exits 0, and a negative control (one command exits 3) sends SIGTERM to the other command and
  exits 1.
- **`lint-staged` 17.6.0** (`893da1fdd`).
  - `yarn lint-staged --debug` was run with an empty index and exits 0. Its output shows `.lintstagedrc.json` loaded
    with both globs.
  - `listr2` and its renderer subtree left the tree.
  - No `git stash` path was reached: lint-staged returns before its backup when nothing is staged.
- **Changesets 3** (`40a426cb1`).
  - The `$schema` URL now points at `@changesets/config@4.0.1`, and every key is valid under config 4.
  - `readConfig` reports no warnings and no errors, and `changelog-github` 1.0.1 imports cleanly.
  - 13 names are new to the lockfile (legitimacy OK, or `too-new` only on the two `@clack` packages). 48 names are
    gone, among them **`micromatch` and `braces`**. `yarn audit:deps` now reports `0 new, 0 accepted` and lists 1240992
    as no longer appearing.
- **`glob` 13.0.6** (`e268a7d19`), at the root and in `apps/docs`.
  - `generate:docs` regenerates all 104 + 1 tracked generated pages byte-identically.
  - The docs scripts use the promise API, which did not change.
- **`@types/cheerio` removed** (`876970adb`). `typecheck:tests` exits 0, and the stub-only `@types/node` 26 went with
  it.
- **`js-yaml` 5.4.2** (`d1b3332d5`). It ships its own types, so `@types/js-yaml` left both the catalog and
  `packages/llm`.
  - `promptRegistry.ts` is unchanged and keeps the default safe `load`.
  - A 31-file parse snapshot under 4.3.2 and under 5.4.2 is byte-identical.
  - Tests: `llm` 43/43, `argument-condensation` 30/30, `question-info` 22/22.
- **`globals` 17.12.0 through the catalog** (`5017d4a17`), plus `globals: catalog:` in `@openvaa/shared-config`.
  - The lint findings are identical: 0 errors, the same 17 warnings.
  - `--print-config` shows 1227 globals, up from 1151, and `no-undef` is off.
  - This closes the 167 handoff todo.
- **Sweep.** A fresh probe at 16:56:32Z finds 0 `UNASSIGNED-MAJOR` rows. Its two `major` rows are `@types/node` 26
  and `typescript` 7, both G1 holds. The catalog has 35 keys, and all are consumed.
- **Gates.** `169-10-group8` is 12/12 at `5017d4a17`, with `porcelain_lines: 0` and every turbo task uncached. The
  normalised lint list is identical to 169-09's.

## Task Commits

1. **Task 1: concurrently and lint-staged.** `797196ee4` (chore), `893da1fdd` (chore). After the second commit, the
   tracer gate re-ran both exercises: exit 0.
2. **Task 2: changesets, glob, `@types/cheerio`, dotenv.** `40a426cb1`, `e268a7d19`, `876970adb` (all chore). dotenv
   was held, so it has no commit.
3. **Task 3: js-yaml, intl-messageformat, globals, sweep, gates.**
   - `d1b3332d5` and `5017d4a17` (chore).
   - intl-messageformat was held.
   - The catalog sweep needed no commit, because no key was orphaned.
   - Evidence and todos: `e3add695f` (docs).

**Plan metadata:** the SUMMARY commit and the STATE / ROADMAP / handoff commit follow.

## Files Created/Modified

- `package.json`: `concurrently ^10.0.5`, `lint-staged ^17.6.0`, `@changesets/cli ^3.0.3`,
  `@changesets/changelog-github ^1.0.1`, `glob ^13.0.6`; `@types/cheerio` removed.
- `apps/docs/package.json`: `glob ^13.0.6`.
- `.changeset/config.json`: the schema URL now points at `@changesets/config@4.0.1`.
- `.yarnrc.yml`: catalog `js-yaml ^5.4.2` and `globals ^17.12.0`; `@types/js-yaml` dropped.
- `packages/llm/package.json`: `@types/js-yaml` removed.
- `packages/shared-config/package.json`: `globals: catalog:` added.
- `yarn.lock`: each upgrade's subtree, one commit each.
- `169-EVIDENCE.md`:
  - § 1: the re-measurement.
  - § 2: legitimacy, advisories, and the end of the `braces` path.
  - § 3: the braces row is marked gone; new rows for dotenv, intl-messageformat and globals 17.13.0.
  - § 4: the gate row and the per-upgrade exercises.
  - § 6: the per-commit table, changesets status, the js-yaml parse check, globals print-config, the sweep.
  - § 7: follow-ups.
- Todos:
  - `pending/2026-10-03-dotenv-18-and-intl-messageformat-12-held.md` (new).
  - `done/2026-10-02-declare-globals-in-shared-config.md` (moved, with its resolution).

## Decisions Made

See `key-decisions` in the frontmatter. None changes security posture:
- No install-script allow-list change.
- No baseline edit.
- No new `eslint-disable`.
- No range widening or `npmPreapprovedPackages` entry for a held major (PROH-169-19).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing declaration] `@openvaa/shared-config` imported `globals` without declaring it**
- **Found during:** Task 3 step 3, the globals catalog convergence. The 167 review handed this to 169-10 (todo
  `2026-10-02-declare-globals-in-shared-config.md`).
- **Issue:** `packages/shared-config/eslint.config.mjs` imports `globals`, which resolved through hoisting. It got
  15.15.0, while the frontend's own declaration moved to 17.
- **Fix:** added `"globals": "catalog:"`. Both workspaces now resolve 17.12.0.
- **Verification:** forced `lint:check` exit 0 with an identical findings list, plus a `--print-config` comparison.
- **Committed in:** `5017d4a17`, together with the globals major.

### Acceptance-criterion exception (documented, not worked around)

**2. `yarn changeset status` exits 1, not 0**
- The plan's action text allows "its documented 'no changesets' outcome"; its acceptance line and `<verify>` say
  exit 0.
- The exit 1 comes from "Some packages have been changed but no changesets were found". 2.x has the same code path
  and exit code (source quoted in EVIDENCE § 6). The branch is far ahead of `main` and has no `.changeset/*.md`.
- Config loading is proven separately: `changeset status --since=HEAD` exits 0, and `readConfig` returns no warnings
  or errors.
- No changeset was added to force exit 0, because that would invent release notes.

### Plan steps that did not trigger

- **dotenv bump (Task 2 step 5) and intl-messageformat bump (Task 3 step 2):** held by the 30-day rule. They are
  recorded in § 3 with their clear dates and a todo.
- **Drop consumer-less catalog entries (Task 3 step 5):** no key was orphaned. `@types/js-yaml` was removed with the
  js-yaml commit, where it belonged.
- **Unassigned majors (Task 3 step 4):** none were left.
- **`.lintstagedrc.json` / `_dev:concurrent` / `promptRegistry.ts` / `overrides.ts` / `tests/*.ts` edits:** none
  needed.

**Total deviations:** 1 auto-fixed (missing declaration), 1 documented acceptance exception. **Impact:** no scope
creep. The shared-config declaration was the open handoff for exactly this plan.

## Issues Encountered

None. The `YN0002` peer notice (`playwright-core` for `@axe-core/playwright`) is long-standing. No E2E ran, because
D-26 lists none for group 8, so the voter-journey flake was not exercised.

## User Setup Required

None.

## Known Stubs

None.

## Threat Flags

None new.
- **T-169-32:** dotenv was not bumped. On 17.4.2, the `--list` config load prints no `.env` value and no banner.
- **T-169-33:** the loader keeps `yaml.load` with its default schema. The parse-equivalence check covers every
  tracked prompt file.
- **T-169-SC:** the age gate was re-measured live. Every new lockfile name passed the legitimacy check (no `SLOP`;
  `SUS` only as `too-new`), and none runs an install script. 0 advisories on every chosen version.

## Next Phase Readiness

- **169-11 (Actions majors)** can start from this close-out.
  - The local stack `openvaa-local` is untouched by this plan (PG17.6).
  - No dev server, Playwright or turbo process is left running.
  - `release.yml`'s `changesets/action@v1` works with CLI 3 (it calls `changeset version` only when changesets
    exist). Moving the action's own major is 169-11's job.
- **169-13:**
  - The `braces` row (1240992) is stale. The audit is `0 accepted`, and the operator's pending review becomes "drop
    it".
  - Residue to decide: the root `glob` declaration has no root importer, and `apps/docs` still has an unused
    `eslint-config-prettier`.
  - The dotenv / intl-messageformat todo is time-boxed to 2026-10-17 / 2026-10-15.
- **DEPS-12 stays Pending.** Two of its named majors are held to mid-October, and 169-13 reconciles the baseline.
- **nodemailer 10:** still held until 2026-10-04T07:51Z (not this plan's).
- **Kit 3 / adapters:** still 169-12's, held to 2026-10-31.

## Self-Check: PASSED

- Files exist: `169-10-SUMMARY.md`, `tests/e2e-runs/169-gates/169-10-group8/summary.tsv` (12 rows, all 0),
  `tests/e2e-runs/169-gates/10-t3-probe.md` (0 `UNASSIGNED`), `tests/e2e-runs/169-gates/10/lint-norm-after.txt`
  (33 lines), `.planning/todos/pending/2026-10-03-dotenv-18-and-intl-messageformat-12-held.md`.
- Commits in `git log`: `797196ee4`, `893da1fdd`, `40a426cb1`, `e268a7d19`, `876970adb`, `d1b3332d5`, `5017d4a17`,
  `e3add695f`.
- Artifacts: `.yarnrc.yml` contains `globals:`; `package.json` contains `"lint-staged"`; `promptRegistry.ts` contains
  `js-yaml`; `_dev:concurrent` contains `kill-others-on-fail`.
