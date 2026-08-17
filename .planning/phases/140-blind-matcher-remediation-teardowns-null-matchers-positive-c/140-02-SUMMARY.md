---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
plan: 02
subsystem: testing
tags: [playwright, e2e, config-load-guard, soft-assertions, negative-control, fake-guard-sweep]

# Dependency graph
requires:
  - phase: 140-01
    provides: '140-NEGATIVE-CONTROL.md (the evidence document this plan appends Part II to), the § 7.1 verdict table whose criterion-4 row this plan fills in, and the recorded follow-up naming the three sibling drift files that scope this plan out of them'
  - phase: 136
    provides: 'the ORPHAN-PROBE GUARD in tests/playwright.config.ts — the block class this guard mirrors (hoisted const + ALL-CAPS docstring + module-level throw)'
  - phase: 137
    provides: 'the recorded finding that `playwright test --list` does not run globalSetup, which is why the F10 invariant had to live at config load rather than in a test or in setup'
provides:
  - 'SOFT_ASSERTION_BUDGETS in tests/playwright.config.ts — a declared per-spec soft-assertion budget, currently one entry: specs/voter/voter-journey.spec.ts = 136'
  - 'A counted config-load guard that re-measures the file on every config load and throws on ANY divergence (equality, not a ceiling), naming the path, the declared budget and the actual count'
  - "A rewritten voter-journey.spec.ts header stating the real serial-walk posture and naming SOFT_ASSERTION_BUDGETS as the number's authority instead of restating a number"
  - '140-NEGATIVE-CONTROL.md Part II (§§ 9-12) — the F10 three-run control with exit codes 0 → 1 → 0, the verdict for ROADMAP criterion 4, and its honest gaps'
affects: [140-03, 140-04, 140-05, 140-06, 142-assert-07, any-future-soft-assertion-budget-work]

actuals:
  tokens: 8500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'Counted config-load guard: a hoisted budget const + a module-level loop that re-measures the source and throws, so a documented invariant becomes an executable one'
    - 'Occurrence counting over line counting: `(contents.match(/re/g) ?? []).length`, never `grep -c` semantics, so a line carrying two calls counts as two'
    - 'Equality over ceiling for budgets: removing a budgeted item throws too, so the budget ratchets down rather than drifting up'
    - "Header names the authority, not the number: prose points at the in-code symbol that owns the value, because a number in a comment cannot fail"

key-files:
  created: []
  modified:
    - tests/playwright.config.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-NEGATIVE-CONTROL.md

key-decisions:
  - 'D-01 honoured: the budget is 136, measured at HEAD two ways at implementation time, never quoted from a planning document; 137 appears in the record only as provenance or as the adversary count, with an explicit reader-facing note distinguishing the two'
  - 'The guard compares with `!==` (equality) rather than `>` (ceiling), so a promotion from soft to hard — exactly what Phase 138 `bea9fc97a` did — also throws and must be recorded'
  - 'The guard lives at config load rather than in a test or in globalSetup, because `--list` skips globalSetup entirely; config-load reach is the point, not convenience'
  - 'The budget table is scoped to one file: ASSERT-06 names voter-journey.spec.ts, and the three sibling Rigidity-contract drift files stay a recorded follow-up rather than silent scope creep'
  - 'A missing-file branch was added to the guard (Rule 2) so a deleted/renamed spec produces a named error instead of a cryptic ENOENT — a budget pointing at nothing is a guard that can never fire'

patterns-established:
  - 'Three-run negative control for existence-class defects: blind (no guard, adversary present) → catch (guard present, adversary present) → reverted (guard present, adversary absent). The third run is what distinguishes a discriminating guard from an always-throwing one'
  - 'Record the grep that does NOT discriminate: `grep -i budget` over the blind-half log is non-zero (an unrelated performance-budget test title), and saying so is what separates evidence from advocacy'

requirements-completed: [ASSERT-06]

coverage:
  - id: D1
    description: 'SOFT_ASSERTION_BUDGETS + counted config-load guard in tests/playwright.config.ts, enforcing the measured 136 by equality'
    requirement: ASSERT-06
    verification:
      - kind: e2e
        ref: 'cd tests && npx playwright test --list (clean tree)'
        status: pass
      - kind: e2e
        ref: 'cd tests && npx playwright test --list (with one soft assertion added) → exit 1, "Soft-assertion budget diverged in specs/voter/voter-journey.spec.ts — the declared budget is 136 but the file carries 137"'
        status: pass
      - kind: other
        ref: 'yarn lint:check → exit 0'
        status: pass
    human_judgment: false
  - id: D2
    description: "voter-journey.spec.ts header rewritten: states the real serial-walk soft-assertion posture, names SOFT_ASSERTION_BUDGETS as the number's authority, restates no number, and does not contain the counted token verbatim"
    requirement: ASSERT-06
    verification:
      - kind: other
        ref: "sed -n '1,25p' tests/tests/specs/voter/voter-journey.spec.ts | grep -o 'expect\\.soft(' | wc -l → 0; grep -c '3-slot budget honored' → 0; grep -c 'SOFT_ASSERTION_BUDGETS' → 1"
        status: pass
    human_judgment: false
  - id: D3
    description: '140-NEGATIVE-CONTROL.md Part II — the F10 three-run control, the verdict row for ROADMAP criterion 4, and the honest-gaps section'
    requirement: ASSERT-06
    verification: []
    human_judgment: true
    rationale: 'Whether an evidence document is honest — whether its gaps section names the real gaps rather than convenient ones, and whether its verdict overclaims — is a judgment about argument quality that no assertion can make.'

# Metrics
duration: 22min
completed: 2026-08-15
status: complete
---

# Phase 140 Plan 02: Counted Soft-Assertion Budget Guard Summary

**`voter-journey.spec.ts`'s soft-assertion budget stopped being a prose claim that had drifted from 3 to 136 and became an equality-checked config-load invariant that aborts every Playwright invocation — `--list` included — when the count moves in either direction.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-08-15T12:52:00Z
- **Completed:** 2026-08-15T13:14:00Z
- **Tasks:** 3 of 3
- **Files modified:** 3

## Accomplishments

- **The invariant is now executable.** `SOFT_ASSERTION_BUDGETS` in `tests/playwright.config.ts` declares `specs/voter/voter-journey.spec.ts = 136`, and a module-level loop re-measures the file on every config load, throwing on any divergence. It mirrors the ORPHAN-PROBE GUARD sitting immediately above it — same hoisted-const shape, same ALL-CAPS docstring citing its phase and sweep finding, same four-clause message ending in `(fake-guard sweep 2026-08-11, finding F10)`.
- **The control was taken in the only order that makes it evidence.** RUN 1 (blind) was run and **committed** at `7bb36c6b3`, on a tree where `grep -rn 'SOFT_ASSERTION_BUDGETS' tests/` returned no match — before the guard existed at `7a259e548`. After the guard lands, the blind half is no longer reproducible without deleting the guard.
- **Three runs, exit codes `0 → 1 → 0`, one variable moved.** Blind: full listing, `Total: 143 tests in 94 files`, `grep -c 'Error'` over the log → 0. Catch: exit 1, the guard's message naming the path, `136` and `137`, thrown inside `loadConfigFromFile` before `runTests`, with **no listing produced at all**. Reverted: the same 143 tests, exit 0 — which is what proves the guard is discriminating rather than always-throwing.
- **The header no longer carries a number that can go stale.** It states the posture (a single long serial walk, so visibility assertions are soft on purpose and load-bearing preconditions stay hard) and names `SOFT_ASSERTION_BUDGETS` as the authority. It also does not contain the counted token verbatim — a header quoting `expect.soft(` would have incremented the very count it describes.
- **D-01 was honoured in the strong form.** The number was measured at HEAD, two ways, at implementation time; the guard re-measures rather than trusting the constant; and `.planning/audits/2026-08-11-fake-guard-sweep.md` was left byte-identical (`git diff --stat` empty), because rewriting a dated record to match today's tree destroys the provenance that explains the 137 → 136 transition.

## Task Commits

Each task was committed atomically:

1. **Task 1: Measure, and observe the blindness half BEFORE the guard exists** — `7bb36c6b3` (docs)
2. **Task 2: Land the counted guard and rewrite the false header** — `7a259e548` (test)
3. **Task 3: Observe the catch half and record the F10 verdict** — `c3d60d774` (docs)

## Files Created/Modified

- `tests/playwright.config.ts` — added `SOFT_ASSERTION_BUDGETS` (`:52-61`) and the SOFT-ASSERTION BUDGET GUARD (`:63-108`): a missing-file branch and an occurrence-counting equality check, both throwing named errors. No new imports — `fs`, `path` and `TESTS_DIR` were already in scope.
- `tests/tests/specs/voter/voter-journey.spec.ts` — header rewritten. The false `3-slot budget honored` claim is gone; a soft-assertion posture paragraph and an explicit "the count is deliberately NOT restated here" pointer to `SOFT_ASSERTION_BUDGETS` take its place. **No assertion in the file was changed** — the count is 136 before and after.
- `.planning/phases/140-.../140-NEGATIVE-CONTROL.md` — Part II added (§§ 9-12, ~450 lines): measurement and adversary, the F10 HYGIENE-LOOP, RUN 1, RUN 2, RUN 3, the three-run table, the criterion-4 verdict and the honest gaps. The § 7.1 criterion-4 row was updated in place from "owned by a later plan" to DISCHARGED.

## Decisions Made

- **Equality, not a ceiling.** A `>` comparison would have let Phase 138's soft→hard promotion (`bea9fc97a`, 137 → 136) pass unnoticed and quietly widen the headroom. Under `!==` that improvement must be recorded, so the budget ratchets toward fewer soft assertions instead of drifting toward more. This was a plan must-have; the reasoning is recorded in the guard's own docstring so it survives the planning record.
- **Config load, not `globalSetup`, not a test.** `--list` skips `globalSetup` — the Phase-137 preflight's deliberate exemption — so any check living there or in a test inherits the same blind spot. Module-level code fires on `--list` too, which is both the lightest invocation and the strictest vehicle.
- **One entry in the budget table.** ASSERT-06's scope is `voter-journey.spec.ts`. The three sibling `Rigidity contract` drift files measured by plan 01 are the same defect class, and adding them here would have padded a scoped requirement with adjacent work. They stay a recorded follow-up, and § 12.3 says so explicitly rather than letting silence imply coverage.
- **The non-discriminating grep is recorded, not replaced.** `grep -i budget` over the blind-half log returns 1 — an unrelated `performance-budget.spec.ts` test title. Rather than quietly switching to a grep that looked cleaner, § 10.3 records that the obvious discriminator does not discriminate and names the two that do (exit code, and a thrown error carrying all three values).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] Guard threw a cryptic ENOENT when a budgeted spec is missing**

- **Found during:** Task 2 (Land the counted guard)
- **Issue:** The plan specified `path.join(TESTS_DIR, rel)` → read → count. If a budgeted spec is ever deleted or renamed, `fs.readFileSync` throws a raw `ENOENT: no such file or directory` from inside `playwright.config.ts` — every Playwright invocation dies with a message that names neither the budget table nor the remedy. That reproduces the very failure mode this guard exists to prevent: an invariant whose breakage is unattributable.
- **Fix:** Added an `fs.existsSync` branch ahead of the read, throwing a named error in the same four-clause format — what is wrong, the offending path interpolated, the two remedies (restore the file, or drop its entry from `SOFT_ASSERTION_BUDGETS`), and the provenance citation. It also mirrors the sibling ORPHAN-PROBE GUARD, which likewise gates on `fs.existsSync` before reading.
- **Files modified:** `tests/playwright.config.ts`
- **Verification:** `npx playwright test --list` exits 0 (branch not taken at HEAD); `yarn lint:check` exits 0; the file remains free of `process.exit`.
- **Committed in:** `7a259e548` (part of the task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 × Rule 2)
**Impact on plan:** Additive and small — one guard clause. No scope creep; the plan's structure, message format and firing point are unchanged.

### Carried-forward correction from wave 1

Plan 01's summary flagged that greps written against `toMatch(/^[\w-]+…` would not match on disk (the landed form is `stringMatching(...)`). **This plan cites no such grep** — its acceptance criteria are all against `tests/playwright.config.ts` and `voter-journey.spec.ts`, neither of which plan 01 touched. No adjustment was needed.

## Issues Encountered

- **Sandbox denied an in-place `perl -i` edit** of the spec during task 1's injection. Resolved by using the `Edit` tool for the injection instead; the injected bytes are identical, and the two halves used the same mechanism so the comparison is unaffected. Recorded here rather than in the evidence document because it is a tooling detail, not a property of the control.
- **The injection's diff hunk header moved** between the halves (`@@ -607,6` → `@@ -620,6`) because task 2's header rewrite is longer. The **bytes injected are identical**; only the offset changed, and the guard counts occurrences over the whole file and never reads a line number. Recorded in § 11.1 rather than elided, since it is the one difference between the halves that is not the knob.
- **No dev server, no database, no browser was started.** Port 5173 is held by an unrelated Docker container in this environment. `--list` needs none of them, which is exactly what made it the correct vehicle.

## Known Stubs

None. No placeholder, TODO, FIXME or empty-value stub was introduced. The guard is fully wired and demonstrably fires.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **ROADMAP criterion 4 is discharged** on both of its disjunctive alternatives, with the ordering requirement ("the addition is made and the failure observed before the guard is accepted") satisfied by the commit sequence rather than asserted.
- **`tests/playwright.config.ts` is now free for the remaining plans.** This plan was alone in wave 2 partly because it modifies the file every Playwright invocation loads; plans 03-06 can proceed without that contention.
- **One thing later plans must know:** any plan that adds or removes an `expect.soft` call in `voter-journey.spec.ts` will now break **every** Playwright invocation until `SOFT_ASSERTION_BUDGETS` is updated in the same commit. That is the guard working as designed, not a regression — the remedies are in the thrown message.
- **Open gaps** (all recorded in § 12.3): the guard covers one file; the three sibling `Rigidity contract` drift files remain unguarded and are a filed follow-up; no CI run has loaded this config; and per-worker idempotence is argued from the guard's source rather than measured, since `--list` spawns no workers.

## Self-Check: PASSED

- `tests/playwright.config.ts` — FOUND, contains `SOFT_ASSERTION_BUDGETS` (4 occurrences) and `finding F10` (3 occurrences), `process.exit` count 0
- `tests/tests/specs/voter/voter-journey.spec.ts` — FOUND, `expect.soft(` occurrence count 136, matching the pinned budget; header carries 0 occurrences of the counted token and 0 of `3-slot budget honored`
- `.planning/phases/140-.../140-NEGATIVE-CONTROL.md` — FOUND, Part II §§ 9-12 present
- Commits `7bb36c6b3`, `7a259e548`, `c3d60d774` — all FOUND in `git log`
- `cd tests && npx playwright test --list` — exit 0; `yarn lint:check` — exit 0
- `git status --porcelain -- apps tests packages` — empty; `grep -rn 'INJECTED (140)' apps packages tests` — no match

---

_Phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c_
_Completed: 2026-08-15_
