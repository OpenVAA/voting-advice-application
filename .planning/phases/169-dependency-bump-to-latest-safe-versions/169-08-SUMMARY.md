---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 08
subsystem: dev-seed
tags: [faker, seed-determinism, dev-seed, visual-regression, supply-chain, audit-baseline]

requires:
  - phase: 169-RULINGS
    provides: "local stack on Postgres 17.6, ESLint 10.11.0 (no config-lookup flag), 12/12 gates, E2E 171/171; HEAD ede16d45b"
provides:
  - "@faker-js/faker 10.6.0 for the root and @openvaa/dev-seed through the catalog (one resolution)"
  - "an old-vs-new seed diff at seed 42 for default and e2e/base: equal row counts per table; e2e/base byte-identical"
  - "a seed-sensitivity survey of all 31 built-in templates: only default depends on the faker seed"
  - "ctx.ts comment that is true for the installed 10.x Faker constructor"
  - "group 6 gates 12/12, full E2E 171/171, visual 7/0/0 twice with no re-baseline"
affects: [169-13]

actuals:
  tokens: 6500    # chars/4 over the realized diff ede16d45b..b5b2742ca (13 751 chars, evidence included) plus this summary
  tasks: 2
  commits: 2      # git rev-list --count ede16d45b..b5b2742ca (the SUMMARY/state commit follows)
plan_head_before: ede16d45b3e0e7d4cb63fe67f8f0b856fda8fa11
plan_head_after: b5b2742caa7e38353432c25100a6c7706d0fff4d

tech-stack:
  added: ["@faker-js/faker 10.6.0"]
  removed: ["@faker-js/faker 8.4.1"]
  patterns:
    - "Before a randomiser-changing bump, prove which datasets can change at all: run each template at seed s and s+1 on the new version; identical output means no faker value reaches it"
    - "Diff seed output offline by replaying the CLI's pre-write steps (template + overrides, runPipeline, fanOutLocales), one template per process, key-sorted JSON"

key-files:
  created:
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-08-SUMMARY.md
  modified:
    - .yarnrc.yml
    - yarn.lock
    - packages/dev-seed/src/ctx.ts
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md

key-decisions:
  - "faker 10.6.0, measured live at 15:55Z: 50.0 d old, 10.0.0 published 2025-08-24; no faker release is inside the 7-day window"
  - "Keep faker.seed() in buildCtx although 10.5+ accepts new Faker({ seed }): measured to give the same sequence, and makeLocaleFaker plus the tests seed the same way"
  - "No visual re-baseline: both visual runs were 7/0/0, and the e2e/base dataset the visual specs read is byte-identical on 10.6.0"
  - "The audit baseline is not edited here; the stale faker row 1158500 is 169-13's reconciliation"

patterns-established:
  - "Seed-sensitivity survey (seed s vs s+1 per template) as the cheap proof of which fixtures a randomiser change can reach"

requirements-completed: [DEPS-10]

coverage:
  - id: D1
    description: "faker resolves only to 10.6.0 for every consumer, through the catalog"
    requirement: DEPS-10
    verification:
      - kind: other
        ref: "yarn why @faker-js/faker -> @openvaa/dev-seed and root both @faker-js/faker@npm:10.6.0; lockfile diff = the one faker entry"
        status: pass
    human_judgment: false
  - id: D2
    description: "Old-vs-new seed diff for default and e2e/base at the same seed, equal row counts"
    requirement: DEPS-10
    verification:
      - kind: other
        ref: "tests/e2e-runs/169-08-faker/{default,e2e-base}-{before,after}.json + *-diff.json; EVIDENCE § 6 table (all counts equal; e2e/base sha256 identical)"
        status: pass
    human_judgment: false
  - id: D3
    description: "dev-seed determinism and template tests pass on 10.x with no expectation changed"
    requirement: DEPS-10
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit -> 66 files / 901 tests; typecheck exit 0; default-template.integration.test.ts 3/3 on PG17"
        status: pass
    human_judgment: false
  - id: D4
    description: "Group 6 gates, full E2E, visual gate with traced re-baselines only"
    requirement: DEPS-10
    verification:
      - kind: other
        ref: "169-gates.sh 169-08-group6 -> 12 rows of 0"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-08-group6 -> 171/171/0/0/0; visual-container.sh 169-08-visual and 169-08-visual-final -> exit 0, 7/0/0 each, no re-baseline"
        status: pass
    human_judgment: false

duration: 19min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 08: @faker-js/faker 10.6.0 with the seed diff recorded first, and no visual re-baseline needed Summary

**`@faker-js/faker` moved from 8.4.1 to 10.6.0 through the catalog, for the root and `@openvaa/dev-seed`. At seed 42,
both the `default` and the `e2e/base` templates produce the same row count in every table before and after.
`e2e/base` is byte-identical, and a survey of all 31 built-in templates shows that only `default` depends on the
faker seed. So the E2E suite (171/171) and the visual gate (7/0/0, twice) ran on unchanged data, and no snapshot was
re-baselined. The gates are 12/12. The faker advisory left the audit.**

## Performance

- **Duration:** about 19 min (2026-10-03T15:55Z → 16:14Z)
- **Tasks:** 2 of 2
- **Files modified:** 3 source files (`.yarnrc.yml`, `yarn.lock`, `packages/dev-seed/src/ctx.ts`) plus the evidence ledger

## Accomplishments

- **Age rule, measured live.** The probe ran at 15:55:51Z. The target is 10.6.0: published 2026-08-14 (50.0 d old),
  and its line started with 10.0.0 on 2025-08-24. Its `engines.node` admits 24.21.0, and no faker release is under
  7 days old. Nothing was held.
- **Seed captured before the bump.** `dump-seed.ts` replays what the CLI does before writing: template + overrides,
  `runPipeline`, then `fanOutLocales`. It runs one template per process and writes key-sorted JSON. A repeat run on
  8.4.1 was byte-identical.
- **The bump (`5c338398f`).**
  - The lockfile diff is the single faker entry, and no new name entered the lockfile.
  - No call site needed migrating: every faker API dev-seed calls exists in 10.6.0 with the same arguments.
  - The word module's `'fail'` strategy does not apply, because no `faker.word.*` call passes a length.
- **`ctx.ts` comment corrected.**
  - 10.6.0's constructor does accept `seed` (`FakerOptions.seed`, since 10.5.0). The old comment said it did not.
  - Measured: the constructor option and `.seed()` give identical sequences.
  - The comment now states this, and says `.seed()` stays because `makeLocaleFaker` and the tests seed the same way.
- **Diff after the bump** (EVIDENCE § 6):
  - Row counts are equal in every table, for both templates.
  - In `default`, these changed values: all candidate names, 6 242 answer values, question texts, choice labels and
    term texts.
  - Four categorical questions also changed their faker-drawn choice count (`seed_q_018` 5 → 4, `seed_q_019` 3 → 5,
    `seed_q_020` 3 → 5, `seed_q_021` 3 → 4). These counts live inside a JSONB column, not in the row count.
  - In `e2e/base`, nothing changed.
- **Tests:** dev-seed passes 901/901 with no expectation changed, and the live `default` integration test on PG17
  passes 3/3.
- **Gates and E2E.**
  - `169-08-group6` is 12/12. Lint has 0 errors and 17 warnings, and its normalised list is identical to the
    rulings run.
  - `audit:deps`: `0 new, 1 accepted (braces)`. The faker row 1158500 is listed as stale.
  - Full E2E: 171/171/0/0/0 in 4.5 min.
  - Visual: `169-08-visual` and `169-08-visual-final` both exit 0 with 7/0/0.

## Task Commits

1. **Task 1: seed capture, faker 10.6.0, the `ctx.ts` comment, the diff**: `5c338398f` (chore)
2. **Task 2: group-6 gates, E2E and visual**: no code change. The evidence went in as `b5b2742ca` (docs).

**Plan metadata:** the SUMMARY / STATE / ROADMAP / REQUIREMENTS / handoff commit follows `b5b2742ca`.

## Files Created/Modified

- `.yarnrc.yml`: catalog `'@faker-js/faker': ^10.6.0`.
- `yarn.lock`: `@faker-js/faker@npm:^10.6.0` → 10.6.0 replaces the 8.4.1 entry.
- `packages/dev-seed/src/ctx.ts`: the `buildCtx` seeding comment now matches the 10.x constructor.
- `169-EVIDENCE.md`: § 1 re-measurement, § 2 legitimacy and advisories, § 4 gate/E2E/visual record, § 6 seed diff
  and traces, § 7 follow-ups.
- Scratch, gitignored: `tests/e2e-runs/169-08-faker/` holds `dump-seed.ts`, `diff-seed.mjs`,
  `seed-sensitivity.ts`/`.txt`, `{default,e2e-base}-{before,after}.json`, the `*.counts.json` files and the
  `*-diff.json` files.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Added verification (no scope change)

**1. [Rule 2 - Correctness] A seed-sensitivity survey of every built-in template**
- **Why:** the plan diffs only `default` and `e2e/base`. The E2E suite also seeds 29 `perm-*` / `show-feedback-survey`
  templates. A visual or E2E red could only be traced if we knew which datasets a faker change can reach at all.
- **What:** each template was run on 10.6.0 at its seed and at seed + 1. Only `default` changes; the other 30 are
  seed-independent.
- **Effect:** it predicted the green E2E and visual runs, and E2E and visual then confirmed it.

**2. [Verification] Ran the live `default` integration test.** `default-template.integration.test.ts` exercises the
template whose values did change against the PG17 stack: 327 candidates written, the operation budget met, and anon
reads OK.

### Plan steps that did not trigger

- **Step 5 (update an expectation tied to a generated value):** no test failed, so no expectation changed.
- **Task 2 step 3 (re-baseline):** there was no visual diff, so nothing was re-baselined. PROH-169-17 held.
- **Task 2 step 1's "empty audit" branch:** a high+ finding (`braces`) remains. So the gate passed on "0 new", not on
  an empty audit.

**Total deviations:** 2 added verifications, no auto-fixes, no holds.

## Issues Encountered

None. The voter-journey slider flake did not recur.

## User Setup Required

None. `yarn db:seed` (the `default` template) now writes different names, answers and question texts at seed 42; row
counts are unchanged.

## Known Stubs

None.

## Threat Flags

None. T-169-28 was mitigated as planned: the diff was recorded first, and no re-baseline was needed. T-169-29: the
dump script is offline, and the writer is unchanged. T-169-SC: the age gate was re-measured, faker is not a new
lockfile name, and 10.6.0 has 0 advisories.

## Next Phase Readiness

- **169-09 (AI SDK majors)** can start from `b5b2742ca` plus this close-out.
  - The local stack `openvaa-local` is on PG17.6. The last thing it ran was `db:reset` + `db:seed --template
    e2e/base`, followed by the two visual runs. Run `db:reset` before relying on a pristine DB.
  - No dev server, Playwright or turbo process is running, and ports 5173 and 5273 are free.
- **169-13** must:
  - drop the stale faker baseline row 1158500, by hand, together with the other stale rows;
  - note that after group 6 the audit's only accepted finding is `braces`.
- **nodemailer 10 pin:** still held until 2026-10-04T07:51Z (todo unchanged). This plan ended at 16:14Z on
  2026-10-03, so it was not applied.

## Self-Check: PASSED

- Files exist: `169-08-SUMMARY.md`, `tests/e2e-runs/169-08-faker/{default,e2e-base}-{before,after}.json`,
  `tests/e2e-runs/169-gates/169-08-group6/summary.tsv` (12 rows, all 0),
  `tests/e2e-runs/169-e2e/169-08-group6/summary.json` (171/171/0/0/0),
  `tests/e2e-runs/169-08-visual-final/observed.txt` (7/0/0).
- Commits in `git log`: `5c338398f`, `b5b2742ca`.
- Artifacts: `.yarnrc.yml` contains `'@faker-js/faker': ^10.`; `ctx.ts` contains `new Faker(` and `faker.seed(`.
