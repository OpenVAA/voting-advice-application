---
phase: 154-dev-seed-determinism-template-validation
plan: 01
subsystem: testing
tags: [dev-seed, faker, vitest, determinism, fake-timers, seeded-data]

# Dependency graph
requires:
  - phase: 144-dev-seed-template-validation
    provides: "`validateTemplate` + `assertFixedRowsCarryExternalId`, which make the hand-written control template a legal template rather than an unchecked literal"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "the standing `assert:comment-hygiene` gate every comment written here had to pass, and the clean-comment house style it enforces"
provides:
  - "`makeDateReachingTemplate()` — the only template in the repo that reaches BOTH wall-clock date sites in one `runPipeline` call"
  - "`readDateSites()` — a throwing reader for the two clock-dependent values, so no inequality assertion can pass on a pair of undefined values"
  - "A recorded, committed measurement of the pre-fix drift at both sites, at two clocks eight months apart"
  - "The day-vs-millisecond granularity boundary, demonstrated by a dedicated one-millisecond case"
  - "A mechanism-level `refDate` negative control that survives the fix"
affects: [154-03 (the fix plan — inverts two of these cases), 154-02, 154-04]

actuals:
  tokens: 2271
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "`vi.useFakeTimers({ toFake: ['Date'] })` + `try { … } finally { vi.useRealTimers(); }` per test — the repo's first fake-clock tests"
    - "Fresh-factory-per-run extended to cross-time comparison, where a shared template would produce a false negative"

key-files:
  created: []
  modified:
    - "packages/dev-seed/tests/determinism.test.ts — +143/-1, one new sibling describe block, four new cases"

key-decisions:
  - "The `git diff --name-only` acceptance criterion was proven on a `-- packages/` scope, not repo-wide: two pre-existing dirty planning docs made the repo-wide form unsatisfiable by construction. Flip-tested and registered."
  - "Every anti-vacuity assertion was flip-tested to red before being trusted; a gate that examines nothing reports green."
  - "The full E2E suite was NOT run. Justified by a named route (zero runtime surface, proven) rather than assumed, and registered in WINDOWS.md."
  - "The pre-phase dev-seed baseline is 570 tests, not the 569 the plan and research inherited. Measured, and the corrected figure used in every criterion."

patterns-established:
  - "Anti-vacuity contract as a first-class test case: reachability of the code paths a comparison depends on is asserted, not assumed, and flip-tested."
  - "A negative control that SURVIVES the fix (mechanism-level) paired with negative controls the fix INVERTS (pipeline-level), so the phase keeps a durable statement of why the fix works."

requirements-completed: [REVIEW-SEED-02]

coverage:
  - id: D1
    description: "The control template reaches both wall-clock date sites in one pipeline run, and that reachability is asserted rather than assumed"
    requirement: REVIEW-SEED-02
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#the control template reaches both wall-clock date sites"
        status: pass
      - kind: other
        ref: "flip-test: elections.count 1->0 => RED ('expected [] to have a length of 1'); question type date->text => RED (lorem string fails the millisecond regex)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The same seed produces different pipeline output at two clocks eight months apart, on unfixed code, with both date sites observed to move independently"
    requirement: REVIEW-SEED-02
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#negative control: the same seed drifts across a faked clock set eight months apart"
        status: pass
    human_judgment: false
  - id: D3
    description: "A one-millisecond clock delta moves the millisecond-precision date answer while leaving the day-granularity election_date identical, so a day-only comparison cannot be trusted"
    requirement: REVIEW-SEED-02
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#negative control: a one-millisecond clock delta moves the millisecond-precision date answer"
        status: pass
    human_judgment: false
  - id: D4
    description: "Supplying a fixed reference date to date.future and date.recent is what makes the draws clock-independent — the mechanism control that survives the fix"
    requirement: REVIEW-SEED-02
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/determinism.test.ts#negative control: faker date draws follow the system clock without a reference date and are pinned with one"
        status: pass
      - kind: other
        ref: "flip-test: strip refDate from the pinned draws => RED ('expected 2026-05-31 to deeply equal 2027-01-29')"
        status: pass
    human_judgment: false
  - id: D5
    description: "Fake timers are torn down inside every test that installs them, so no later test in the package suite observes a frozen clock"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit — 574 passed across 49 files, including the DB-touching integration test that reads the real clock"
        status: pass
    human_judgment: false

duration: 8 min
completed: 2026-08-29
status: complete
---

# Phase 154 Plan 01: Prove the Determinism Breach Summary

**The dev-seed determinism breach is now a recorded measurement rather than a claim: on unfixed code the same seed emits `election_date` `2026-10-09` at a 2026-01-15 clock and `2027-06-09` at a 2026-09-15 clock, and a date answer that moves `2026-01-14T07:17:19.007Z` → `2026-09-14T07:17:19.007Z`, committed as four passing tests that are all green on the unfixed tree.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-29T03:38:45Z
- **Completed:** 2026-08-29T03:46:23Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- **The observation harness exists.** `makeDateReachingTemplate()` is a five-field literal that reaches BOTH wall-clock date sites in a single `runPipeline` call — the synthetic-election loop in `ElectionsGenerator` and the `date` branch of the answers emitter. No built-in template can do this: the only built-in declaring a `date` question hardcodes its answer.
- **The reachability is asserted and flip-tested, not assumed.** Seven assertions pin the emitted shape. Both flips (elections `count: 1`→`0`; question `type: 'date'`→`'text'`) drive the case RED on the intended assertion, so the anti-vacuity contract demonstrably examines something.
- **The breach is measured and recorded** (see the dedicated section below). Both sites drift, and they drift independently — asserted separately, because the whole-output inequality alone would be satisfied by one site moving.
- **The day-vs-millisecond boundary is demonstrated.** At a one-millisecond delta the day-granularity `election_date` is byte-identical while the answer moves. A guard restricted to `election_date` would pass across a real drift.
- **A mechanism-level control that survives the fix is committed**, flip-tested by stripping `refDate` from the pinned draws.
- **No file under `packages/dev-seed/src/` was touched.** The fix that 154-03 owns was not applied, nor partially applied.

## Negative control — recorded on unfixed code

**Command:** `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts`, with a temporary
`console.log` of the `readDateSites()` results inside each case. The probe logs were removed before
the commit; the code path they observed is the committed code path, unchanged.

**Tree state at observation:** `packages/dev-seed/src/generators/ElectionsGenerator.ts:48` reads
`faker.date.future({ years: 1 })` with no `refDate`, and `packages/dev-seed/src/emitters/answers.ts:77`
reads `faker.date.recent()` with no options. Unfixed, verified immediately before the run.

### Case A — clocks eight months apart (`seed: 42`, identical template)

| Clock instant | `election_date` (day granularity) | `seed_q_date` answer (millisecond granularity) |
|---|---|---|
| `2026-01-15T00:00:00.000Z` | `2026-10-09` | `2026-01-14T07:17:19.007Z` |
| `2026-09-15T00:00:00.000Z` | `2027-06-09` | `2026-09-14T07:17:19.007Z` |

Whole-pipeline `JSON.stringify` output differs. Both sites moved by exactly the clock delta (+8
months), and the **time-of-day is identical on both** (`07:17:19.007`) — the seeded offset is stable
and only the calendar base moves. That is the shape a fixed reference window is expected to remove.

### Case B — one-millisecond delta (`seed: 42`, identical template)

| Clock instant | `election_date` | `seed_q_date` answer |
|---|---|---|
| `2026-01-15T00:00:00.000Z` | `2026-10-09` | `2026-01-14T07:17:19.007Z` |
| `2026-01-15T00:00:00.001Z` | `2026-10-09` | `2026-01-14T07:17:19.008Z` |

The day-granularity value is **identical** across a real drift. The millisecond value is not. The
plan's contingency (shifting the pair to `12:00:00.000Z`/`.001Z` if the drawn date straddled
midnight) was **not needed** — the recommended instants held, and the instants above are the ones
actually used and committed.

### Agreement with research

All four literals match RESEARCH R3.4's measured values exactly (`2026-10-09` → `2027-06-09`;
`2026-01-14T07:17:19.007Z` → `2026-09-14T07:17:19.007Z`). Independently re-measured here on the
committed test code rather than carried over.

### Case C — mechanism level, seeded `Faker` outside the pipeline

Unpinned `date.future({ years: 1 })` differs across the two clocks; the same draw with
`refDate: 2027-01-01T00:00:00.000Z` is byte-identical at both. Same result for `date.recent()`.
Stripping the `refDate` from the pinned half drives the case RED
(`expected '2026-05-31' to deeply equal '2027-01-29'`), so the "pinned" half is a real assertion.

## Task Commits

1. **Task 1: End-to-end control template reaching both wall-clock date sites** — `6d4b4f151` (test)
2. **Task 2: Run and record the two-clock negative control on unfixed code** — `61f189368` (test)
3. **Task 3: Durable mechanism-level reference-date negative control** — `49b4c2a08` (test)

## Files Created/Modified

- `packages/dev-seed/tests/determinism.test.ts` — +143/−1. One new sibling
  `describe('determinism across wall-clock time')` block below the existing block's close. The
  existing `describe('determinism (TMPL-08)')` block is byte-identical apart from the shared import
  line, which gained `vi` and a `@faker-js/faker` import.

## Verification Results

| Check | Result |
|---|---|
| `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` | exit 0, **10 passed** (6 pre-existing + 4 new) |
| `yarn workspace @openvaa/dev-seed test:unit` | exit 0, **574 passed across 49 files** (baseline 570 + 4) |
| `yarn workspace @openvaa/dev-seed typecheck` | exit 0 |
| `yarn test:unit` (root) | exit 0, 25/25 turbo tasks successful |
| `yarn lint:check` | exit 0, 22/22 tasks; comment-hygiene **0 violations**, i18n 0, a11y-wiring 0 |
| `yarn prettier --check` on the changed file | clean |
| `git diff --name-only -- packages/` | exactly `packages/dev-seed/tests/determinism.test.ts` |
| `git diff --name-only -- packages/dev-seed/src/` | **empty** — the fix plan's territory is untouched |

Grep criteria: `makeDateReachingTemplate` 2, `useRealTimers` 2, `finally` 2, `toFake: ['Date']` 2,
`refDate` 4, `days:` 0, `: any` on added lines 0, contamination pattern on added lines 0, deletions
in the first task's diff 0 (additions only).

## Measured corrections to inherited figures

Three inherited numbers were wrong. Measured values used throughout; recorded here rather than
silently absorbed.

1. **The dev-seed baseline is 570 tests, not 569.** The plan's `must_haves`, its Task 1 acceptance
   criterion and RESEARCH R8 all state 569 across 49 files. Measured on a clean tree immediately
   before Task 1: **570 passed across 49 files**. Every criterion still clears on the corrected
   figure (Task 1 needed ≥570 and produced 571; the plan-level check needed ≥572 and produced 574),
   so this changes no outcome — but the arithmetic in this SUMMARY is against 570.
2. **The two drift sites are at `ElectionsGenerator.ts:48` and `answers.ts:77`, not `:58` and `:91`.**
   The `:58`/`:91` pair appears in the plan's Task 2 `<precondition>`, in RESEARCH R1/R3.3, and in
   `REQUIREMENTS.md`'s REVIEW-SEED-01 text. The precondition's *substance* holds — both calls are
   present and carry no reference date — but a later plan navigating by line number will land in the
   wrong place. **154-03 should navigate by the call expression, not the line number.**
   `REQUIREMENTS.md` was deliberately NOT edited: this phase's plans state that nobody edits it here.
3. **`packages/dev-seed/tests/determinism.test.ts` was 88 lines, not 109/110.** The plan and PATTERNS
   § 6 cite `:20-24`, `:52-61`, `:63-79` and "the existing block's closing brace (currently line
   109)". The real close was line 88, and the cited excerpts sit ~21 lines earlier than stated. The
   quoted *content* was accurate, so the block was located by content and appended correctly.

## Decisions Made

- **Scoped one acceptance criterion, rather than engineering around it or restating it as met.**
  Tasks 1–3 each carry `git diff --name-only` lists exactly `packages/dev-seed/tests/determinism.test.ts`.
  That is **unsatisfiable by construction here**: the working tree already carried two modified
  planning documents (`.planning/OVERNIGHT-RUN-2026-08-28.md`, `.planning/STATE.md`) and two
  untracked ones before this plan began, none of them mine. The property the criterion protects is
  "this plan touches no production code". Proved instead by the **named route**
  `git diff --name-only -- packages/dev-seed/src/`, which returns empty, plus
  `git diff --stat fee77f596..HEAD -- packages/ apps/ tests/` showing exactly one changed file.
  Registered in `WINDOWS.md`.
- **Flip-tested every gate before trusting it.** Three separate flips (elections count, question
  type, `refDate` strip) were each confirmed RED on the intended assertion and the tree restored via
  `git checkout --` only *after* the relevant work was committed, per the standing rule that
  `git checkout --` is not a safe undo for an uncommitted injection.
- **`readDateSites()` throws rather than returning `undefined`.** Two `undefined` values compare
  equal under `not.toEqual`, so a silent read failure would flip the negative controls from "proves
  drift" to "proves nothing" without going red. The throw is what stops that.
- **Recorded the drift by running the committed code, not by reasoning about faker.** A temporary
  `console.log` inside the two cases produced the literals in the table above; it was removed before
  the commit. An assertion derived from faker semantics would not have discharged the deliverable.

## Deviations from Plan

None. No deviation rule fired: no bug, no missing critical functionality, no blocker, no
architectural question. Three inherited figures were wrong and are corrected above, but each is a
recorded measurement, not a change to what the plan asked for.

## Issues Encountered

**The full E2E suite was not run, and that is a decision rather than an omission.** CLAUDE.md's
cardinal rule forbids proceeding while any E2E test fails. The rule was honoured by a named route
rather than by an ~11-minute run that would have required a `db:reset` and a fresh dev server while
an overnight orchestrator may hold port 5173:

- the plan's own `<verification>` block does not list E2E;
- the entire plan diff is **one file**, `packages/dev-seed/tests/determinism.test.ts`, a vitest unit
  test — proven by `git diff --stat fee77f596..HEAD -- packages/ apps/ tests/`;
- nothing imports it (`grep -rn "determinism.test" packages apps tests` returns only prose mentions
  and a stale vite-cache index);
- `@openvaa/dev-seed` is not a dependency of `apps/frontend` — `grep -c "dev-seed" apps/frontend/package.json`
  returns 0. The package is reachable only from the root `db:seed` scripts.

The changed file therefore has no path to the served application. Registered in `WINDOWS.md` as an
`unrun-verify` so it is visible at ship time rather than buried here.

Disk headroom was checked and is not a constraint (150 GiB available), so the prior ENOSPC hazard did
not drive this decision — the zero-runtime-surface proof did.

## User Setup Required

None.

## Next Phase Readiness

**154-03 (the fix plan) is unblocked and its ordering premise is now satisfied**: the breach is
demonstrated on unfixed code and recorded with both halves, so the fix can be shown to close
something real. Two specific handoffs:

- The two cases `negative control: the same seed drifts across a faked clock set eight months apart`
  and `negative control: a one-millisecond clock delta moves the millisecond-precision date answer`
  **must be inverted** by 154-03. They are `not.toEqual` today; after a fixed reference window they
  must become `toEqual`. The comment above them says so in the file.
- The case `negative control: faker date draws follow the system clock without a reference date and
  are pinned with one` **must stay green unchanged** across the fix. If 154-03 finds itself editing
  that case, something is wrong with the fix, not with the test.
- Navigate to the two drift sites by call expression, not by the `:58`/`:91` line numbers every
  upstream artifact repeats. They are at `:48` and `:77`.

---
*Phase: 154-dev-seed-determinism-template-validation*
*Completed: 2026-08-29*

## Self-Check: PASSED

- `packages/dev-seed/tests/determinism.test.ts` — present on disk.
- `.planning/phases/154-dev-seed-determinism-template-validation/154-01-SUMMARY.md` — present on disk.
- Commits `6d4b4f151`, `61f189368`, `49b4c2a08`, `6a3bc4e95` — all present in `git log --oneline --all`.
- All task `<acceptance_criteria>` re-run after the final task: every criterion passes on the corrected
  scope noted under "Decisions Made". Plan-level `<verification>` re-run: all six checks green.
