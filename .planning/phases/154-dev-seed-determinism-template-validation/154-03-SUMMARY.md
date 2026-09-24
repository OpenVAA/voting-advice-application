---
phase: 154-dev-seed-determinism-template-validation
plan: 03
subsystem: dev-seed
tags: [dev-seed, faker, determinism, zod, reference-date, seeded-data]

# Dependency graph
requires:
  - phase: 154-01
    provides: "the recorded pre-fix drift measurement this plan's inversion is measured against, the `makeDateReachingTemplate()` / `readDateSites()` harness, and the two invertible controls"
  - phase: 154-02
    provides: "the shared `tests/template.test.ts` left in a known state, and the measured-correction discipline this plan extends"
  - phase: 144-dev-seed-template-validation
    provides: "`validateTemplate` and the strict `TemplateSchema` seam the new `refDate` field is validated at"
provides:
  - "`SEED_REF_DATE` — one exported fixed anchor, re-exported from the package barrel"
  - "`Ctx.refDate: Date` — REQUIRED, resolved exactly once per pipeline run, so a wall-clock fallback is a compile error rather than a latent branch"
  - "`Template['refDate']?: string` validated as an ISO datetime in BOTH authorities, with an accept case and a reject case pinning the mirror"
  - "The committed cross-time stability guard: byte-identical output at an eight-month clock delta AND at a one-millisecond delta"
  - "A dataset-invariance proof covering all 30 built-in templates, which replaces the E2E-decline route the two prior plans used"
affects: [154-04, ship-time criteria 1 and 2 review]

actuals:
  tokens: 4842
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Reference-date threading: one value resolved at context-build time and passed down, rather than each call site re-reading the template or the clock"
    - "Dataset-invariance as an E2E-decline route: prove the generated data is byte-identical rather than claiming the changed code is unreachable"

key-files:
  created: []
  modified:
    - "packages/dev-seed/src/ctx.ts — +11/-0, `SEED_REF_DATE`, required `Ctx.refDate`, its resolution in `buildCtx`"
    - "packages/dev-seed/src/template/types.ts — +4/-0, `refDate?: string` plus its authoring-docstring bullet"
    - "packages/dev-seed/src/template/schema.ts — +6/-0, the `refDate` key inside the strict schema"
    - "packages/dev-seed/src/generators/ElectionsGenerator.ts — +2/-2, the anchor threaded into the synthetic election row"
    - "packages/dev-seed/src/emitters/answers.ts — +4/-4, widened private signature, reference-dated date branch, corrected docstring"
    - "packages/dev-seed/src/index.ts — +1/-1, `SEED_REF_DATE` added to the existing ctx export"
    - "packages/dev-seed/tests/determinism.test.ts — +22/-22, the two negative controls inverted into the committed guard"
    - "packages/dev-seed/tests/template.test.ts — +13/-0, accept and reject cases for the new field"
    - "packages/dev-seed/tests/utils.ts — +2/-0, `makeCtx` supplying the new required field"
    - "packages/dev-seed/tests/latent/clustering.integration.test.ts — +2/-0, unplanned complete-Ctx fixture (deviation 2)"
    - "packages/dev-seed/tests/templates/nominations-override.test.ts — +2/-0, unplanned complete-Ctx fixture (deviation 2)"
    - "packages/dev-seed/README.md — +4/-0, one additive `refDate` bullet; every pre-existing byte untouched"

key-decisions:
  - "The plan's backstop truth 13 is measurably FALSE — task 1 necessarily turns the suite red, because 154-01 wrote a PER-SITE `electionDate` inequality on exactly the site task 1 pins. Resolved by flipping that one operator inside the tracer's own commit, honouring the hard no-red-commit invariant while keeping both commit boundaries."
  - "The E2E-decline route inherited from 154-01/154-02 does NOT hold on this diff and was replaced rather than repeated: `tests/seed-test-data.ts` imports `runPipeline`, so dev-seed reaches E2E through the DATA. Replaced with a measured dataset-invariance proof across all 30 built-ins."
  - "`requirements mark-complete` SUCCEEDED here, refining WINDOWS 139: the block is row-specific to the annotated -03/-04 Status cells, not phase-wide."
  - "The 'no built-in output changed' claim was PROVEN empirically rather than accepted from the plan's structural argument."

patterns-established:
  - "When a plan's own no-red-commit invariant collides with its task decomposition, honour the invariant and move the minimal necessitated assertion into the commit that necessitates it — the same rule the plan already applies to docstrings."
  - "An inherited verification-decline route must be re-proved against the current diff's blast radius; a route that was sound for a test-only diff can be unsound for a production diff even when its literal grep still returns the same number."

requirements-completed: [REVIEW-SEED-01, REVIEW-SEED-02]

coverage:
  - id: D1
    description: "Both wall-clock date sites generate from one resolved reference window, and no date draw in the package source omits it"
    requirement: REVIEW-SEED-01
    verification:
      - kind: command
        ref: "grep -rnE 'faker\\.date\\.(future|recent)\\(' packages/dev-seed/src | grep -vc 'refDate' => 0"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#the same seed produces byte-identical output across a faked clock set eight months apart"
        status: pass
    human_judgment: false
  - id: D2
    description: "The demonstrated breach is closed at the granularity that actually moved — the millisecond-precision date answer, not only the day-granularity election_date"
    requirement: REVIEW-SEED-02
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#the same seed produces byte-identical output across a one-millisecond clock delta"
        status: pass
      - kind: other
        ref: "measured post-fix: seed_q_date = 2026-12-31T07:17:19.007Z identical at 2026-01-15T00:00:00.000Z, 2026-09-15T00:00:00.000Z and 2026-01-15T00:00:00.001Z (pre-fix it moved at all three)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The reference window is overridable per template through a field declared in BOTH the type and the strict schema, with the schema half pinned by a reject case"
    requirement: REVIEW-SEED-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#accepts a template-level refDate override"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#rejects a refDate that is not an ISO datetime"
        status: pass
      - kind: other
        ref: "flip-test: weaken refDate to z.string() => reject case RED, accept case stays GREEN; restored via git checkout of the already-committed file"
        status: pass
    human_judgment: false
  - id: D4
    description: "The required context field is supplied everywhere a complete Ctx literal is constructed — provable only under typecheck, never under vitest"
    requirement: REVIEW-SEED-01
    verification:
      - kind: command
        ref: "yarn workspace @openvaa/dev-seed typecheck => exit 0 (three fixtures supplied; two were not in the plan's blast radius)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No built-in template's output changed, and the E2E dataset is therefore unchanged"
    verification:
      - kind: other
        ref: "all 30 built-ins byte-identical under the fixed anchor, a wall-clock anchor and a 2044 anchor, through the runPipeline+fanOutLocales composition tests/seed-test-data.ts uses; 0 synthetic elections in every built-in"
        status: pass
    human_judgment: false
  - id: D6
    description: "The mechanism-level negative control from wave 1 survives the fix untouched"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#negative control: faker date draws follow the system clock without a reference date and are pinned with one"
        status: pass
      - kind: command
        ref: "git diff on that case's lines => 0 changed lines"
        status: pass
    human_judgment: false

duration: 14 min
completed: 2026-08-29
status: complete
---

# Phase 154 Plan 03: Close the Determinism Breach Summary

**Both wall-clock date reads now draw from one `SEED_REF_DATE`-anchored window resolved once per run on a REQUIRED `Ctx.refDate`, overridable per template through a field validated in both the authoring type and the strict schema — and the two cases that measured the drift now assert byte-identical output at an eight-month clock delta and at a one-millisecond delta, the granularity at which the breach was actually visible.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-29T04:02:00Z
- **Completed:** 2026-08-29T04:16:00Z
- **Tasks:** 3
- **Files modified:** 12 (+62/−18)

## Before and after

The pre-fix column is 154-01's recorded measurement; the post-fix column was measured here on the
committed code by a temporary probe, removed before the commit.

### Eight months apart (`seed: 42`, identical template)

| Clock instant | `election_date` before | `election_date` after | `seed_q_date` before | `seed_q_date` after |
|---|---|---|---|---|
| `2026-01-15T00:00:00.000Z` | `2026-10-09` | `2027-09-25` | `2026-01-14T07:17:19.007Z` | `2026-12-31T07:17:19.007Z` |
| `2026-09-15T00:00:00.000Z` | `2027-06-09` | `2027-09-25` | `2026-09-14T07:17:19.007Z` | `2026-12-31T07:17:19.007Z` |

### One millisecond apart — the granularity that actually moved

| Clock instant | `election_date` before | `election_date` after | `seed_q_date` before | `seed_q_date` after |
|---|---|---|---|---|
| `2026-01-15T00:00:00.000Z` | `2026-10-09` | `2027-09-25` | `2026-01-14T07:17:19.007Z` | `2026-12-31T07:17:19.007Z` |
| `2026-01-15T00:00:00.001Z` | `2026-10-09` (identical) | `2027-09-25` | `2026-01-14T07:17:19.008Z` (**moved**) | `2026-12-31T07:17:19.007Z` |

**The one-millisecond row is the one that matters.** Before the fix a comparison restricted to
`election_date` passed across a real drift — identical at both instants while the answer moved. The
committed guard therefore asserts whole-pipeline `JSON.stringify` equality *and* both sites
separately, at both deltas. Restricting it to `election_date` would have made it go green whether or
not anything was fixed.

Two details worth reading off the table. The time-of-day `07:17:19.007` is **preserved from before
to after** — the seeded offset was always stable and only the calendar base moved, which is exactly
the shape a fixed anchor was expected to remove. And the post-fix answer `2026-12-31` sits one day
before the `2027-01-01` anchor, consistent with `date.recent`'s default one-day span, which was left
untouched.

## No built-in template's output changed

**Proven, not asserted.** Every one of the **30** built-in templates — `default`, `e2e/base`,
`show-feedback-survey` and all 27 `perm-*` fixtures — emits a **byte-identical dataset** under three
different anchors: the fixed `SEED_REF_DATE`, a wall-clock anchor (which *is* the pre-fix behaviour),
and a far-future `2044-08-17T13:45:06.123Z`. Compared through the exact composition the seeding entry
point uses, `runPipeline(template, overrides)` followed by `fanOutLocales(rows, template, seed)`.

The reason is the one the plan named, and the probe confirms both halves of it: **every built-in
emits 0 synthetic elections**, so the modified `ElectionsGenerator` line never executes for any of
them; and the only built-in declaring a `date` question (`e2e/base`, exactly 1) pre-answers it, so
the modified emitter branch never produces one of its values either.

## Accomplishments

- **One resolved anchor travels the whole path** — declared on the template type, validated by the
  strict schema, resolved once in `buildCtx`, destructured by the generator, passed as an explicit
  parameter into the answers emitter, and reflected in both emitted values.
- **The fallback is structurally impossible, not merely absent.** `Ctx.refDate` is REQUIRED, so a
  `?? new Date()` shape is a compile error. This is what turned the change from "true by inspection"
  into "true by construction", and it is what the typecheck tripwire caught three fixtures on.
- **The latent emitter inherited the anchor with no edit**, as predicted: its `date` case routes back
  into `defaultRandomValidEmit(…, ctx)`.
- **The mirror is pinned in both directions.** The reject case is the load-bearing one — a type-only
  addition would look correct in the editor and fail only when someone seeds, because the schema
  closes `.strict()` and every loader branch runs through it.
- **The surviving mechanism-level control is untouched** — `git diff` reports 0 changed lines within
  it, as 154-01 required.

## Flip-tests

| Flip | Injection | Observed |
|---|---|---|
| `refDate` schema validator | Weaken `z.iso.datetime()` to `z.string()` | RED on `rejects a refDate that is not an ISO datetime`; the accept case stayed GREEN — so the reject case is examining the ISO validator specifically, not merely that the key exists |

Undone with `git checkout --` only because the file was already committed, per the standing rule that
`git checkout --` is not a safe undo for uncommitted work.

## Task Commits

1. **Task 1 (tracer): end-to-end reference window through to `election_date`** — `9342d9545` (feat)
2. **Task 2: the date-answer site plus the inverted guard** — `597972df5` (feat)
3. **Task 3: barrel export, docs, and the schema-half pin** — `ae87dbd0b` (feat)

## Verification Results

| Check | Result |
|---|---|
| `yarn workspace @openvaa/dev-seed test:unit` | exit 0, **580 passed across 49 files** (578 + 2) |
| `yarn workspace @openvaa/dev-seed typecheck` | exit 0 (run after every task) |
| `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` | exit 0, 10 passed, both inverted cases green under their new names |
| `yarn workspace @openvaa/dev-seed vitest run tests/template.test.ts` | exit 0, **20 passed** (18 + 2) |
| `yarn test:unit` (root) | exit 0, 25/25 turbo tasks |
| `yarn lint:check` | exit 0, 22/22; comment hygiene **0 violations**, i18n 0, a11y-wiring 0 |
| `yarn prettier --check` on every changed file | clean |
| `grep -rnE 'faker\.date\.(future\|recent)\(' packages/dev-seed/src \| grep -vc refDate` | **0** |

Every task-level acceptance criterion was re-run after the final task. All 12 of Task 1's, all 11 of
Task 2's and all 8 of Task 3's pass. Contamination greps on added lines: **0** in every task.
`: any` on added lines: 0. `days:` in the emitter: 0. No CLI flag added.

**Measured line numbers**, since every inherited citation in this phase has been wrong: the two drift
sites are `ElectionsGenerator.ts:48` and `answers.ts:77`, unchanged by this plan's edits and matching
154-01's correction rather than the `:58`/`:91` pair `REQUIREMENTS.md` still carries.

## Deviations from Plan

**1. [Rule 1 — Bug in the plan's own premise] The plan's backstop truth 13 is false, and task 1 necessarily reddens the suite**

- **Found during:** Task 1, at the verification gate.
- **Issue:** truth 13 states the wave-1 negative controls "remain green until the task that inverts
  them also fixes the second site". That reasoning covers only the whole-output comparison. 154-01
  also wrote a **per-site** assertion, `expect(first.electionDate).not.toEqual(second.electionDate)`,
  on exactly the site task 1 pins. After task 1 the suite failed with
  `expected '2027-09-25' to not deeply equal '2027-09-25'` — one assertion, precisely the one the fix
  invalidates. The plan's instruction "Do NOT invert the negative-control assertions in this task"
  rests on the same false premise.
- **Fix:** flipped that one operator to `toEqual` **inside the tracer's own commit**, and rewrote the
  block comment above the pair so the intermediate state reads truthfully (election site pinned,
  answer site still following the clock — which is what keeps the whole-output inequality true).
  The plan's hard no-red-commit invariant is honoured and both commit boundaries survive. Merging
  tasks 1 and 2 into one commit was the alternative and was rejected: it would have discarded the
  tracer's separate record.
- **Note:** the failing assertion's *content* is itself positive proof the tracer worked — identical
  `election_date` at two clocks eight months apart.
- **Commit:** `9342d9545`. **Registered:** `.planning/WINDOWS.md`.

**2. [Rule 3 — Blocker] Two complete-`Ctx` fixtures outside the plan's enumerated blast radius**

- **Found during:** Task 1, at `yarn workspace @openvaa/dev-seed typecheck`.
- **Issue:** the plan names only `tests/utils.ts` as needing the new required field. Two further test
  files build a complete `Ctx` literal inline and broke: `tests/latent/clustering.integration.test.ts`
  (`buildClusteringCtx`, TS2741) and `tests/templates/nominations-override.test.ts` (`makeCtx`,
  TS2352 — the fixture is cast `as Ctx`, and its own comment says structural completeness is what
  lets the cast go). Both are invisible to vitest, exactly the class of breakage the typecheck
  tripwire exists to catch. **The tripwire worked; its enumerated radius was one file short.**
- **Fix:** the same one-line supply used in `makeCtx`. No behaviour change — neither fixture had a
  reference date at all before.
- **Files modified:** the two named above. **Commit:** `9342d9545`. **Registered:** `WINDOWS.md`.

**3. [Reported] The inherited E2E-decline route does not hold on this diff**

- **Found during:** the E2E route re-proof, which this plan was required to perform on its own diff
  rather than inherit.
- **Issue:** 154-01 and 154-02 both declined the suite on the route "the changed files have no path
  to the served application", resting on `grep -c dev-seed apps/frontend/package.json` → 0. That grep
  is **still 0**, but the conclusion is incomplete: `tests/seed-test-data.ts:12` imports
  `{ BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES, fanOutLocales, runPipeline, Writer }` from
  `@openvaa/dev-seed`, and the Playwright harness seeds its dataset through that path. dev-seed
  reaches E2E through the **data**, not through the app's code. Harmless for the two prior test-only
  diffs; not harmless for this one, which changes production `src/`.
- **Fix:** the route was **replaced, not repeated** — see the dataset-invariance proof above.
- **Registered:** `WINDOWS.md`, as a correction to the prior route plus the `unrun-verify` for this
  plan.

**Total deviations:** 2 auto-fixed (Rules 1 and 3), 1 reported. **Impact:** no change to what the
plan asked for; deviations 1 and 3 are corrections to inherited premises, registered rather than
absorbed.

## Issues Encountered

**The full E2E suite was not run.** Unlike the two prior plans this diff changes production `src/`,
so the inherited route was re-examined, found incomplete (deviation 3) and replaced with a stronger
one: the E2E dataset is **provably byte-identical** before and after, across all 30 built-in
templates, through the exact composition the harness seeds with. Since the data is unchanged and
`@openvaa/dev-seed` remains absent from `apps/frontend`'s dependencies, the suite has nothing to
observe. Root `yarn test:unit` and `yarn lint:check` were both run green in full. Registered in
`WINDOWS.md` as an `unrun-verify`.

**`yarn db:lint:sql` was not run** — pre-existing red by construction, and this plan touches no SQL.

## Open question for the operator — narrowed, not resolved

`requirements mark-complete REVIEW-SEED-01 REVIEW-SEED-02` **succeeded** here (`updated: true`, both
the checkbox and the traceability row written for each id). This **refines** the block 154-02 raised:
it is **row-specific, not phase-wide**. Those two rows held the bare word `Pending`, which
`milestone.cjs`'s `/^(pending|gaps found)$/i` gate matches; only REVIEW-SEED-03/04 remain blocked,
because their cells carry the `Pending — measured 2026-08-28 as already satisfied by Phase 144 (…)`
annotation.

**So the ruling 154-02 requested is still needed, but its scope is two ids, not four.** Nothing was
hand-edited here.

Separately: REVIEW-SEED-01's requirement *text* still cites the stale `:58` / `:91` drift-site line
numbers (correct: `:48` and `:77`). The tool flips the checkbox only and does not touch that prose,
and this phase forbids hand-editing it. Already registered as WINDOWS 134.

## User Setup Required

None.

## Next Phase Readiness

- **The phase's ⚠ DECIDE is discharged and its four written determinism claims are now true.**
  `packages/dev-seed/README.md`'s three determinism claims needed no rewording — the fix makes them
  true as written, which is why they were left byte-identical.
- **154-04 (todo filing) has one handoff added from here:** the discretionary constant value
  `2027-01-01T00:00:00.000Z` is invisible under every built-in today (all 30 emit 0 synthetic
  elections), so it carries no user-visible impact — but it is a date that will eventually be in the
  past, which is the same class as the already-queued
  `dev-seed-hardcoded-election-date-is-in-the-past` todo. Worth folding into that todo rather than
  filing a second one.
- **Anyone extending `Ctx` should expect three complete-`Ctx` fixtures, not one** — `tests/utils.ts`,
  `tests/latent/clustering.integration.test.ts` and `tests/templates/nominations-override.test.ts`.
  The breakage is typecheck-only and vitest cannot see it.

---
*Phase: 154-dev-seed-determinism-template-validation*
*Completed: 2026-08-29*

## Self-Check: PASSED

- All 12 modified files present on disk and non-empty.
- Commits `9342d9545`, `597972df5`, `ae87dbd0b` all present in `git log --oneline`.
- All task `<acceptance_criteria>` re-run after the final task: 31 of 31 pass.
- Plan-level `<verification>`: all six checks green.
- Both temporary probe files removed; `git status --short -- packages/` clean of untracked files.
