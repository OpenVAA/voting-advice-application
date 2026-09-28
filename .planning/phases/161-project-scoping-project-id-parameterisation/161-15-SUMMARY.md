---
phase: 161-project-scoping-project-id-parameterisation
plan: 15
subsystem: testing
tags: [static-analysis, regex, guard, project-scoping, supabase, optional-chaining, mutation-testing]

# Dependency graph
requires:
  - phase: 161-14
    provides: "the six matcher declarations widened for the plain `?.` member-access operator, the four committed fixture pairs, the exact-count self-test, and the gate spec's OPERATOR_CASES table"
  - phase: 161-13
    provides: "check 9 (the boundary) and the 550-file outside corpus the boundary fixtures model"
  - phase: 161-12
    provides: "check 7 (Edge Function disposition), check 8 (the schema hop), and the per-family non-vacuity floor"
provides:
  - "The optional-CALL punctuator `?.(` admitted at the call position of ACCESS_RE, SCHEMA_HOP_RE, BOUNDARY_ACCESS_RE and INVOKE_RE, each proven by a committed fixture the guard catches"
  - "COMPUTED_ACCESS_RE widened to a bare-identifier chain, so a computed member at a chained link is reported rather than invisible"
  - "COMPUTED_RECEIVER_RE — a new matcher for a computed access to the client FIELD (`this['supabase']`), read by check 6"
  - "Thirteen new committed fixture shapes across the four fixture files"
  - "Four per-FAMILY tally assertions in the self-test, replacing a pooled total that could not tell a raised count from a shuffled one"
  - "All 19 optional-punctuator cells measured under single-position mutation: 18 load-bearing, 1 stated measured exemption"
affects: [161-16, 162, guard-maintenance, project-scoping]

actuals:
  tokens: 13959
  tasks: 3
  # MEASURED: git rev-list --count ${plan_head_before}..HEAD at the plan-metadata commit —
  # six task commits, the SUMMARY commit, and this metadata commit.
  commits: 8
  plan_head_before: 9eb3ce14d4e1b49a95e0f6dd8d7c05bce1fdb3e9

tech-stack:
  added: []
  patterns:
    - "The (matcher x operator-position x punctuator) CELL as the unit of proof, measured by single-position mutation rather than asserted in a docblock"
    - "Per-FAMILY count assertions beside the pooled total, so a raised number names WHICH rule moved"
    - "A prose claim in the guard is written only after the measurement that backs it (the three-way lookahead discriminator numbers were measured, then written)"

key-files:
  created: []
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts

key-decisions:
  - "The chained computed-access fixture was RESPELLED mid-task after the revert sweep showed COMPUTED_ACCESS_RE's chain position was not load-bearing — a widened position no fixture exercised, the exact defect this plan closes"
  - "All 19 cells were swept, not the 9 or 10 the plan's task-level criteria named, because the plan's own arithmetic was internally inconsistent and the wider sweep resolves it"
  - "The module docblock's two universal-reach sentences were deliberately NOT rewritten — the plan assigns them to 161-16 so they are written after the committed enumeration rather than ahead of it"

patterns-established:
  - "Single-position mutation as the acceptance test for a widened matcher: revert one operator token, expect the self-test to go red"
  - "A fixture shape must place the optional operator at the position it claims to prove — a sibling position's spelling does not transfer"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "A project-scoped table or rpc reached through the optional-CALL punctuator (`this.supabase.from?.('constituencies')`, `locals.supabase.from?.('elections')`) is a named, counted violation reported by the same checks as its plain-dot spelling"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (violation fixture 27 sites, family tally 8/10/4/5)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reads the optional operator in ACCESS_RE at every position it declares"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every access-operator position each matcher declares is proven by a committed fixture rather than a docblock: reverting any single optional-punctuator token makes the self-test fail"
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "19-cell single-position revert sweep against the committed guard: 18 red, 1 measured exemption (INVOKE_RE leading)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The self-test asserts the per-family decomposition (8 accesses / 10 escape hatches / 4 invocations / 5 schema hops), not only the pooled 27, so a regression that shuffles one site between families is visible"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (four violationTally assertions)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The two computed-punctuator cells the enumeration surfaced are closed: a computed access to the client FIELD and a computed member at a CHAINED link are both reported by check 6, each measured to cost no live call site first"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "self-test pins `computed member access` exactly 4 and `computed access to the client field` exactly 2"
        status: pass
      - kind: other
        ref: "repo-wide grep for a bracket-quoted client key = 0 matches over 235 supabase-mentioning files; guarded-source grep for a bracketed access after any client member = 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The guard is no LESS narrow than before: all four clean fixtures still produce zero violation lines, both storage-bucket exclusions hold under the new punctuator, and the live corpus prints identical numbers"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs — 5 / 2 / 7 / 550 / 1 / 0, byte-identical to the pre-change baseline"
        status: pass
    human_judgment: false
  - id: D6
    description: "Both committed vacuity probes still fail closed after the declaration they pin was moved"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#exits non-zero when the access matcher has stopped matching; #exits non-zero when the walk outside the adapter directory finds nothing"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-09-06
status: complete
---

# Phase 161 Plan 15: The Access-Punctuator Family, Closed by Construction — Summary

**Every punctuator optional chaining has is now read at every operator position all six matchers declare, and each of the guard's nineteen punctuator cells is either held down by a committed fixture whose disposition depends on it or recorded as the one measured exemption — closing the class by enumeration rather than by an eighth hand-spotted spelling.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-06T20:36:13Z
- **Completed:** 2026-09-06T20:56:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- **The `?.(` punctuator is closed in both corpora.** `this.supabase.from?.('constituencies')`, `this.supabase.rpc?.(…)`, `this.supabase.schema?.('public').from(…)`, `this.supabase.functions.invoke?.(…)` and `locals.supabase.from?.('elections')` were false against every one of the six matchers at the start of this plan (reproduced directly in a bare Node process); all are now named, counted violations reported by the same checks as their plain-dot spellings.
- **The unproven-measurement defect is closed, and closing it found a nineteenth cell nobody had counted.** Every optional-punctuator token was reverted one at a time against the committed guard. 18 of 19 make the self-test fail. The single green one is `INVOKE_RE`'s leading position, which is unanchored and cannot be made load-bearing by any fixture — recorded in its own docstring as the one measured exemption rather than left for a reader to find.
- **Two computed cells the enumeration surfaced are closed.** A computed access to the client FIELD (`this['supabase'].from(…)`) and a computed member at a CHAINED link (`this.supabase.rest['from'](…)`) both reach the client past every anchor check 6 depends on. Each was measured to cost zero live call sites before it was added.
- **The self-test now says WHICH rule moved.** It passes the per-family tally `checkSource` already computed and asserts all four numbers, so a regression that takes one site out of the access family and puts another into the escape-hatch family is visible — a pooled total is satisfied by exactly that shuffle.
- **The guard is no less narrow.** All four clean fixtures still yield zero violation lines, all three storage-bucket exclusions hold under the new punctuator, and the live corpus prints numbers identical to the pre-change baseline.

## The numbers, as the guard printed them

### RED, measured before each widening

Each task's fixtures and raised counts were committed and run BEFORE the matcher that satisfies them was touched.

| Task | RED reading | Failed |
|---|---|---|
| 1 | violation 17 (want 18), accesses 7 (want 8), clean 6 (want 7), optional-CALL check-1 pin absent | 4 |
| 2 | violation 20 (want 22), invocations 3 (want 4), schema hops 4 (want 5), clean 7 (want 8), outside violation 5 (want 6), boundary table-read message 2 (want 3), schema-hop message 4 (want 5), `one_more_undispositioned` pin absent | 8 |
| 3 | violation 23 (want 27), escape hatches 6 (want 10), `computed member access` 2 (want 4), `computed access to the client field` 0 (want 2) | 4 |

**A finding worth recording, because it is the phase's own defect seen from the inside.** In all three tasks, the fixtures for the RECEIVER and INTERVENING-CHAIN positions passed on first run — those positions were already widened in source by 161-14, with nothing exercising them. The plan's action text expects "every new expectation" to fail first; in fact only the genuinely-unreadable `?.(` and computed cells did. That is not a contradiction of the plan, it is the precise shape of the second `missing:` item: a position widened in source and proven by nothing. For those cells the fixture's job is not to drive a widening but to make an existing one load-bearing, and the single-position revert — not the RED run — is what demonstrates it.

### Final self-test

| Fixture | Lines | Sites |
|---|---|---|
| `violation.fixture.ts` | 27 | 27 |
| `clean.fixture.ts` | 0 | 8 |
| `outside-boundary.violation.fixture.ts` | 6 | 6 |
| `outside-boundary.clean.fixture.ts` | 0 | 2 |

Family tally over the violation fixture: **8 accesses / 10 escape hatches / 4 invocations / 5 schema hops**.

### The seven exact per-shape message counts

Measured by instrumenting the self-test to print them rather than assert them:

| Message substring | Count |
|---|---|
| `aliases the raw client` | 3 |
| `destructures the raw client` | 1 |
| `computed member access` | 4 |
| `computed access to the client field` | 2 |
| `reaches a table through a schema call` | 5 |
| `` `from(` on a Supabase client outside `` | 3 |
| `` `rpc(` on a Supabase client outside `` | 3 |

Every one matches the plan's prediction exactly.

### The live corpus, before and after

Identical in both directions — no widening in this plan moved the real tree:

```
5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all,
550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s)
```

This matters most for task 3: a change here would have meant one of the two new computed rules found a real site, which the plan required be investigated rather than accommodated. Neither did, consistent with the zero-live-site measurements taken before they were written.

## The nineteen single-position reverts

Each optional-punctuator token reverted to its plain form ONE AT A TIME, inside that matcher's declaration slice only, against the final committed tree. The probe asserts the original declaration is present verbatim and that the mutation is not a no-op before it runs, so a green is a measurement rather than an unmutated re-run.

| Matcher | Cell | `--self-test` | Verdict |
|---|---|---|---|
| `ACCESS_RE` | P1 receiver `this`→`supabase` | exit 1 | load-bearing |
| `ACCESS_RE` | P2 intervening chain link | exit 1 | load-bearing |
| `ACCESS_RE` | P3 chain→method | exit 1 | load-bearing |
| `ACCESS_RE` | P4 optional-CALL punctuator | exit 1 | load-bearing |
| `SCHEMA_HOP_RE` | S1 receiver | exit 1 | load-bearing |
| `SCHEMA_HOP_RE` | S2 intervening chain link | exit 1 | load-bearing |
| `SCHEMA_HOP_RE` | S3 chain→`schema` | exit 1 | load-bearing |
| `SCHEMA_HOP_RE` | S4 optional-CALL punctuator | exit 1 | load-bearing |
| `BOUNDARY_ACCESS_RE` | B1 intervening chain link | exit 1 | load-bearing |
| `BOUNDARY_ACCESS_RE` | B2 chain→method | exit 1 | load-bearing |
| `BOUNDARY_ACCESS_RE` | B3 optional-CALL punctuator | exit 1 | load-bearing |
| `COMPUTED_ACCESS_RE` | CA1 intervening chain link | exit 1 | load-bearing |
| `COMPUTED_ACCESS_RE` | CA2 computed punctuator | exit 1 | load-bearing |
| `COMPUTED_RECEIVER_RE` | CR1 computed punctuator on `this` | exit 1 | load-bearing |
| `CLIENT_BINDING_RE` | CB1 receiver | exit 1 | load-bearing |
| `CLIENT_BINDING_RE` | CB2 lookahead punctuator arm | exit 1 | load-bearing |
| `INVOKE_RE` | I1 LEADING position | **exit 0** | **NOT load-bearing — the measured exemption** |
| `INVOKE_RE` | I2 `functions`→`invoke` | exit 1 | load-bearing |
| `INVOKE_RE` | I3 optional-CALL punctuator | exit 1 | load-bearing |

**19 cells, 18 load-bearing, 1 exemption** — exactly the plan's predicted split. `INVOKE_RE`'s leading position cannot be closed by any fixture: the matcher is unanchored, so a literal dot still matches the dot inside a `?.` punctuator. Its docstring now says so.

## The three-way lookahead discriminator, re-measured

The comment above the alias and destructure counts states three readings. They were MEASURED before being written, by building each candidate lookahead and printing the counts:

| Candidate trailing lookahead | alias / destructure | self-test |
|---|---|---|
| un-narrowed `(?!\s*[.[(])` | **4 and 1** | exit 1 |
| naive bare `?` — `(?!\s*[.[(?])` | **2 and 1** | exit 1 |
| shipped alternation `(?!\s*(?:\?\.\|[.[(]))` | **3 and 1** | exit 0 |

The numbers moved when the third alias shape landed (they read 3 / 1 / 2 before it). A comment left stating the old trio would have let a regression to either wrong candidate look expected.

## Every changed and added matcher declaration, verbatim

```js
// WIDENED — the optional-CALL punctuator at the call position
const ACCESS_RE = /this\s*\??\.\s*#?supabase((?:\s*\??\.\s*[A-Za-z_$][\w$]*)*?)\s*\??\.\s*(from|rpc)\s*(?:\?\.\s*)?\(/g;
const SCHEMA_HOP_RE = /this\s*\??\.\s*#?supabase(?:\s*\??\.\s*[A-Za-z_$][\w$]*)*\s*\??\.\s*schema\s*(?:\?\.\s*)?\(/g;
const INVOKE_RE = /\??\.\s*functions\s*\??\.\s*invoke\s*(?:\?\.\s*)?\(/g;
const BOUNDARY_ACCESS_RE =
  /(?<![\w$])[\w$]*[Ss]upabase[\w$]*((?:\s*\??\.\s*[A-Za-z_$][\w$]*)*?)\s*\??\.\s*(from|rpc)\s*(?:\?\.\s*)?\(/g;

// WIDENED — a bare-identifier chain between the receiver and the bracket
const COMPUTED_ACCESS_RE = /\bsupabase(?:\s*\??\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*)?\[/g;

// NEW — the computed access to the client FIELD, read by checkEscapeHatches
const COMPUTED_RECEIVER_RE = /\bthis\s*(?:\?\.\s*)?\[\s*(['"])#?supabase\1\s*\]/g;

// UNCHANGED — its two cells are proven by the new alias shape and the restated discriminator
const CLIENT_BINDING_RE = /(?<![=!<>])=\s*(?:await\s+)?this\s*\??\.\s*#?supabase\b(?!\s*(?:\?\.|[.[(]))/g;
```

`ACCESS_RE`'s and `BOUNDARY_ACCESS_RE`'s chain groups remain CAPTURING — `collectAccesses` and `checkBoundary` read them to drop buckets structurally, and making either non-capturing would make every bucket read as a table. `BOUNDARY_ACCESS_RE`'s lookbehind and receiver alternation are byte-unchanged apart from the inserted group.

## Task Commits

1. **Task 1 RED — pin every ACCESS_RE operator position, split the tally by family** — `3bbc39dcb` (test)
2. **Task 1 GREEN — ACCESS_RE reads the optional-CALL punctuator** — `23c7df9c1` (feat)
3. **Task 2 RED — pin the schema-hop, boundary and invocation positions** — `0605b880b` (test)
4. **Task 2 GREEN — three matchers read the optional-CALL punctuator** — `ce273e009` (feat)
5. **Task 3 RED — pin the two computed-punctuator cells** — `c24959dcb` (test)
6. **Task 3 GREEN — check 6 reports both computed cells** — `c67a16d9d` (feat)

Each task ran test-first: fixtures and raised counts committed and observed RED, then the matcher.

## Files Created/Modified

- `scripts/assert-project-scoped-queries.mjs` — four matchers widened for `?.(`, `COMPUTED_ACCESS_RE` widened to a chain, `COMPUTED_RECEIVER_RE` added and read by check 6; the self-test gains a per-family tally, four family assertions, four raised site counts, one new exact message pin and four new literal pins; the check-6 docblock goes from three shapes to five with its residual stated, and the check-8 closed-set argument is restated honestly.
- `scripts/fixtures/project-scoped-queries/violation.fixture.ts` — a `rest` member carrying `from` and `schema`; thirteen new methods across tables, schema hops, an invocation, an alias and four computed shapes.
- `scripts/fixtures/project-scoped-queries/clean.fixture.ts` — an optional-CALL `get_nominations` and an optional-CALL dispositioned invocation, both positive controls.
- `scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts` — a `rest` member and two shapes (optional-CALL table read, optional-chain-link rpc).
- `scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts` — an optional-CALL bucket upload; the fixture's count is deliberately unchanged at 2, which is what makes it a control.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — `ACCESS_RE_DECL` moved with the declaration; `OPERATOR_CASES.optional` becomes a LIST with one input per position each matcher declares; a `COMPUTED_RECEIVER_RE` row with two near misses; a fourth input on the binding discrimination test. 20 → 21 tests.

## Decisions Made

- **The module docblock's two universal-reach sentences were deliberately left for 161-16.** The plan assigns them there explicitly, "so the docblock is written after the enumeration rather than ahead of it". After this plan those sentences are no longer *contradicted* — every matcher does read every punctuator at every position, and each position does have a fixture and an exact count. What remains imprecise is the phrase "both of the member-access operators", which now UNDERSTATES a set of three punctuators. An understatement is the safe direction for a reach claim, but it is still inaccurate, and it is flagged here rather than left for a fifth review to name. **See "Known Residuals" below.**
- **All 19 cells were swept rather than the 9 or 10 named in the task-level criteria.** Task 2's acceptance criterion asks for "SCHEMA_HOP_RE's four, BOUNDARY_ACCESS_RE's three and INVOKE_RE's three" (= 10) and then says "the eight non-exempt reverts ... all nine outcomes", which cannot all be true. The full sweep is strictly more than any reading and resolves the ambiguity by measurement.
- **`rest` carries `from` in task 1 and gains `schema` in task 2**, so each member is introduced by the task whose shapes need it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The chained computed-access fixture did not exercise the position it claimed to prove**

- **Found during:** Task 3, by the single-position revert sweep — not by review, and not by any count.
- **Issue:** The plan's task-3 action says to add "a computed member reached at a chained `rest` link, plain spelling" and "the same at that chain link with the optional operator". I first read the second as the optional COMPUTED punctuator at that link (`this.supabase.rest?.['from'](…)`). Both shapes then spelled the CHAIN link with a plain dot, so `COMPUTED_ACCESS_RE`'s chain-link operator could be reverted with no count moving: the sweep read **CA1 exit 0 — NOT load-bearing**. That is a widened position no fixture exercises, which is precisely the defect this plan exists to close and which its own prohibitions forbid introducing ("adding a fifth one while closing the fourth would make the plan its own counter-example").
- **Fix:** Respelled the shape to `this.supabase?.rest['from']('nominations')` — the optional operator AT the chain link. The terminal computed punctuator stays proven by the existing unchained `this.supabase?.['from']('questions')`, which is why CA2 was already red.
- **Files modified:** `scripts/fixtures/project-scoped-queries/violation.fixture.ts`, and the mirrored input in `packages/dev-seed/tests/projectScopingGate.test.ts`.
- **Verification:** CA1 and CA2 both exit 1 after the fix; the violation count stays at exactly **27** and `computed member access` at exactly **4**, so the correction cost no expected number.
- **Committed in:** `c67a16d9d` (Task 3 GREEN commit).

**2. [Rule 1 - Bug] A revert-measurement harness produced mislabelled output**

- **Found during:** Task 1.
- **Issue:** The first revert sweep used zsh arrays, which are 1-based, so `${NAMES[0]}` was empty and every label was shifted by one against the mutation it described. Every line said LOAD-BEARING, so the *conclusion* happened to be right, but the mapping from cell to outcome was wrong — and on this plan a measurement whose labels cannot be trusted is worth nothing.
- **Fix:** Replaced it with a Node harness that asserts the original declaration is present verbatim and that each mutation is not a no-op before running, then re-ran every sweep through it.
- **Files modified:** none in the repository — the harness is a throwaway under `/tmp`.
- **Verification:** The harness prints `instrument OK` per matcher and refuses to report on a mutation that did not apply. All sweeps in this SUMMARY come from it.

---

**Total deviations:** 2 auto-fixed (2 bugs).
**Impact on plan:** Deviation 1 is the plan's central invariant catching a violation of itself, and closing it changed no committed count. Deviation 2 corrected an instrument, not the tree. No scope creep; nothing under `apps/` was touched.

## Known Residuals

Stated rather than left, because a disposition overstating this guard's reach is worse than none — the standard this phase's own third `missing:` item is about.

1. **The module docblock (`:31-35`) still says "both of the member-access operators".** There are three punctuators. The sentence now understates rather than overstates, and its companion claim (each matcher has a committed fixture and an exact count proving it) is true after this plan. Rewriting it is **plan 161-16's** assigned work, deliberately sequenced after the committed enumeration exists. This is `161-VERIFICATION.md`'s third `missing:` item and it remains OPEN.
2. **Checks 6's two new rules run over the adapter corpus only.** `locals.supabase['from']('x')` outside the adapter directory is unreported, because `checkOutsideSource` runs the boundary and invocation checks alone. Stated in the check-6 docblock; a corpus-axis change with a 500-file blast radius, pinned by 161-16.
3. **An interposed COMMENT between receiver and member is not whitespace.** `this.supabase/* c */.from('x')` is unmatched. Stated residual, pinned by 161-16.
4. **`INVOKE_RE`'s leading operator position is redundant, not load-bearing.** Measured, not assumed; recorded in its docstring.

## Issues Encountered

None beyond the two deviations above. One formatting round-trip was needed after task 2 (`npx prettier --write` on the guard); prettier reflowed docblock prose only and left every matcher declaration byte-identical, confirmed by re-running the self-test, the gate spec and the revert sweeps afterwards.

## Verification

Every status read DIRECTLY from the command, never through a pipe into `grep`.

| Gate | Exit | Result |
|---|---|---|
| `node scripts/assert-project-scoped-queries.mjs` | **0** | `0 violation(s)`; live 5 / 2 / 7 / 550 / 1; self-test half 27 / 0 / 6 / 0 against sites 27 / 8 / 6 / 2 |
| `node scripts/assert-project-scoped-queries.mjs --self-test` | **0** | no `self-test expectation failed` line |
| `yarn test:unit` | **0** | 25/25 turbo tasks; dev-seed 676, frontend 1630; gate spec 21 |
| `yarn lint:check` | **0** | 0 `[ERROR]` lines across every assert gate |
| `npx prettier --check` (guard + gate spec) | **0** | all matched files use Prettier code style |
| `yarn assert:comment-hygiene` | **0** | 1662 files, 0 violations; no touched file named |

No `.vacuity-probe-`, `.boundary-vacuity-probe-` or ad-hoc probe file remains under `scripts/`; `git status` is clean of them.

**On the E2E suite.** `git diff 9eb3ce14d..HEAD -- apps/` is **empty** — no file reaching the running application changed. The guard and its fixtures are lint-time source, read as text and never imported, built or executed, and the one file under `packages/` is a repo-meta unit test. The phase's closing full-suite run at `tests/e2e-runs/161-13-close` (exit 0, 155 expected / 0 unexpected / 0 flaky / 0 skipped) still stands. The cardinal rule is not waived — there is nothing here that could move it.

**Not an acceptance criterion.** `.planning/REQUIREMENTS.md` still shows `[ ]` for PRESHIP-01 and "Gaps Found". The third re-verification says explicitly that this state is correct and must not be flipped; nothing in this plan touches it.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The first two of `161-VERIFICATION.md`'s three `missing:` items are answered **on disk**: the `?.(` punctuator is admitted at every call position with a committed fixture per cell, and the previously-unproven operator positions in `ACCESS_RE`, `SCHEMA_HOP_RE` and `BOUNDARY_ACCESS_RE` are now load-bearing under single-position mutation — together with every other cell the six matchers contain.
- **The third item is deliberately still open** and is plan 161-16's work: the module docblock's reach sentences, to be written after 161-16's committed enumeration rather than ahead of it. A re-verifier should expect to find it open and should NOT read this plan as having closed criterion 2 in full.
- 161-16 additionally owns: the derived cell enumeration that goes red when a future phase widens a position no fixture exercises (the defect deviation 1 above reproduced live), and pinning residuals 2 and 3 to assertions so their sentences cannot go stale in either direction.
- PRESHIP-01 is left at `Gaps Found`; that is the re-verifier's verdict to reach.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-06*
