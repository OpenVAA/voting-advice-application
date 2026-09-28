---
phase: 161-project-scoping-project-id-parameterisation
plan: 17
subsystem: testing
tags: [static-analysis, lint-gate, regex, mutation-testing, edge-functions, supabase, vitest]

# Dependency graph
requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "161-15's thirteen punctuator fixture shapes and 161-16's derived cell/matrix enumeration — this plan extends both derivations rather than adding a third"
provides:
  - "COMPUTED_INVOKE_RE and COMPUTED_FUNCTIONS_RE: the computed spellings of the Edge Function invocation surface, read over BOTH corpora"
  - "CORPUS_OF: each matcher's corpus, DERIVED from the guard's own call graph and never authored"
  - "A `reported-by` disposition that names a matcher running over a narrower corpus is now a named test failure"
  - "Five committed violating shapes at the boundary address and four near-miss controls"
  - "One stated residual — a runtime-computed key is unread — pinned in both directions"
affects: [161-18, phase-162, project-scoped-query-guard, gsd-verify-work-161]

actuals:
  tokens: 15184
  tasks: 3
  commits: 5 # MEASURED: git rev-list --count db1530ca1..HEAD (3 task commits + 2 docs commits)
  plan_head_before: db1530ca1f51eb84306251607309c67733c3e270

tech-stack:
  added: []
  patterns:
    - "Corpus-as-derived-attribute: a matcher's corpus is read out of the guard's call graph (which reader takes a property off it, which composer calls that reader) rather than declared beside the disposition that depends on it"
    - "Superset-not-equality for cross-matcher dispositions: a wider matcher may report for a narrower one; the reverse is the defect"
    - "Property-access rather than bare-mention when deriving a call graph from source text — measured against the guard's own diagnostic strings"

key-files:
  created: []
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts
    - .planning/todos/pending/2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md

key-decisions:
  - "CR-01 is CLOSED directly rather than stated as a residual: the computed invocation surface is now read at the boundary address, not merely admitted to be unread there"
  - "CORPUS_OF is DERIVED from the guard's source, not a hand-authored `corpus` field on each disposition — a constant that must be edited in lockstep with the call graph is the defect class, not the fix"
  - "The reader predicate is a PROPERTY ACCESS (`NAME.`), not a bare mention: the guard's non-vacuity floor names ACCESS_RE inside a diagnostic string in `main`, which a bare-mention test would read as a rule wired to no corpus"
  - "The `reported-by` corpus check is a SUPERSET, not an equality: a both-corpora matcher legitimately reports for an adapter-only one; the reverse is exactly CR-01"
  - "The two computed cells are re-disposed on TRUE grounds (COMPUTED_FUNCTIONS_RE, COMPUTED_INVOKE_RE) rather than by weakening the new assertion"
  - "COMPUTED_FUNCTIONS_RE's leading punctuator cell is a MEASURED exemption whose mutant must stay green; COMPUTED_INVOKE_RE gets no exemption — both its cells are load-bearing and both mutants go red"
  - "Two docblock paragraphs claiming ONE measured exemption were corrected to cross-reference REDUNDANT_CELLS rather than carry a numeral the set can move without"

patterns-established:
  - "Derive-then-cross-check: every derived map is asserted against a second, hand-written derivation AND against a synthetic source in which the answer differs, so a hard-coded replacement fails loudly"
  - "A widening lands with the fixture shape that makes it load-bearing in the same commit, and the committed count moves in that same commit"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "An Edge Function invocation reached through a computed member key is REPORTED and COUNTED at an address OUTSIDE the adapter directory"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (outsideViolationCount === 11; exact per-message counts 3 and 2)"
        status: pass
      - kind: integration
        ref: "CR-01 end-to-end reproduction: the reviewer's exact shape appended to outside-boundary.clean.fixture.ts now exits 1 naming the message"
        status: pass
    human_judgment: false
  - id: D2
    description: "No `reported-by` disposition may name a matcher running over a narrower corpus than the matcher under test, with both corpora derived from the guard's own source text"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#derives each matcher s corpus from the guard s own call graph"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reads the call graph rather than a table, measured against a synthetic source"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#disposes every generated cell of INVOKE_RE"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both computed spellings are read in every punctuator spelling and all three string-key spellings, with four near-miss controls holding the widening back"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#admits every JavaScript spelling of a computed string key"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#leaves COMPUTED_INVOKE_RE's near misses alone"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#makes the guard's self-test fail when COMPUTED_INVOKE_RE cell 1 (computed-or-call) is reverted"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#is measurably redundant when COMPUTED_FUNCTIONS_RE cell 1 (computed-or-call) is reverted"
        status: pass
    human_judgment: false
  - id: D4
    description: "The one limitation the closure does not reach — a runtime-computed key — is stated in the module docblock and pinned by an assertion in both directions"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#leaves a computed member whose key is not a string literal unread"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#states exactly the residuals the matrix pins, and no others"
        status: pass
    human_judgment: false
  - id: D5
    description: "The widening reached no live site: the live corpus summary is unmoved and nothing under apps/ changed"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs (5 / 2 / 7 / 550 / 1 / 0, byte-identical to the pre-plan baseline)"
        status: pass
      - kind: other
        ref: "git diff db1530ca1..HEAD --stat -- apps/ (empty, 0 bytes)"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-09-07
status: complete
---

# Phase 161 Plan 17: Closing the Corpus Axis (CR-01) Summary

**The Edge Function invocation surface is now read in its computed spellings at every address the guard walks, and a `reported-by` disposition can no longer name a matcher that runs over a narrower corpus — because both corpora are derived from the guard's own call graph rather than written down beside the claim.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-07T05:57:13Z (`$PRE_PLAN_HEAD` captured as the first action)
- **Completed:** 2026-09-07T06:22:00Z
- **Tasks:** 3
- **Files modified:** 7

## `$PRE_PLAN_HEAD`

```
db1530ca1f51eb84306251607309c67733c3e270
```

Every tree-hygiene check below is RANGED against it. A bare `git diff` or `git status` passes
vacuously once a change is committed, which is why the ranged form is what was run.

## Accomplishments

- **CR-01 is closed directly, not restated as a residual.** `COMPUTED_INVOKE_RE` and
  `COMPUTED_FUNCTIONS_RE` read the computed spellings of `functions` and `invoke`, and both live in
  `checkEdgeFunctionInvocations` — the ONE per-source check that `checkSource` and
  `checkOutsideSource` each call. That placement is what makes them corpus-agnostic by construction
  rather than by a sentence.
- **The exact shape the fourth re-verification injected now moves the self-test.** Appending
  `locals.supabase.functions['invoke']('probe_undispositioned_function', { body: {} })` to
  `outside-boundary.clean.fixture.ts` previously printed `matching the committed expectation` and
  exited 0. It now exits **1**, naming the message and the moved count. Both halves of CR-01's pair
  were re-reproduced end to end (see "Verification" below); the tree was restored after each.
- **The DEFECT CLASS is closed, not just the cell.** `CORPUS_OF` is derived from the guard's own
  source text in two steps — a function is a READER when it takes a property off a matcher, and its
  corpora are exactly the composers whose bodies call it — and the `reported-by` arm now asserts the
  named matcher's corpus is a SUPERSET of the corpus of the matcher under test. A hand-authored
  `corpus` field, which the code review's own suggested fix sketched, was rejected: a constant that
  must be edited in lockstep with the call graph is the defect class rather than the fix.
- **The derivation is a measurement, not a description.** It is run against a SYNTHETIC guard source
  in which `checkOutsideSource` also calls `checkEscapeHatches`; `COMPUTED_ACCESS_RE` comes back
  `adapter+outside` there and `adapter` alone in the real one. A hard-coded table fails that case
  loudly. The same case asserts `functionBodyOf` throws naming a function that is absent.
- **Every punctuator cell of the new matchers is disposed of by measurement.** `COMPUTED_INVOKE_RE`'s
  two cells are each held down by a committed fixture shape of their own and both mutants go RED;
  `COMPUTED_FUNCTIONS_RE`'s single cell is a written MEASURED EXEMPTION whose mutant is required to
  stay GREEN, because the pattern anchors nothing to its left.
- **Four near-miss controls hold the widening back.** A `subfunctions['invoke']` call (only the word
  boundary excludes it) and a `config['functionsEnabled']` key (only the closing-quote backreference
  excludes it), committed in BOTH clean fixtures, contributing zero counted sites.
- **The adapter-corpus overlap is measured rather than assumed.** `computedInvokeMemberInsideAdapter`
  is ONE line matched by two rules that SEPARATE: check 6 counts it into the escape-hatch family and
  check 7 into the invocation family, each pinned by its own exact message count.
- **The live corpus is unmoved.** `5 / 2 / 7 / 550 / 1 / 0`, byte-identical to the pre-plan baseline.
  Nothing under `apps/` changed, ranged.

## Task Commits

1. **Task 1 (tracer): one computed invocation, reported at the boundary address, self-test moved** —
   `15e05f213` (feat)
2. **Task 2: the second matcher, every punctuator cell exercised, the near misses, the stated
   residual** — `4711afa35` (feat)
3. **Task 3: derive `CORPUS_OF` from the guard's own source** — `fe923091f` (test)

**Plan metadata:** see the `docs(161-17)` commit that carries this file.

## Verification

All four gates run **unpiped**, reading each gate's own exit status. `cmd | grep` reports grep's
status, not the gate's, and this repository has lost two commits to exactly that.

### 1. `node scripts/assert-project-scoped-queries.mjs --self-test` → **EXIT 0**

```
Project-scoped query guard — self-test flagged 29 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (29 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
```

`29 / 0 / 11 / 0` against site counts `29 / 8 / 11 / 2` — exactly the plan's target.

### 2. `node scripts/assert-project-scoped-queries.mjs` → **EXIT 0**

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all, 550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s); self-test flagged 29 line(s) … matching the committed expectation.
```

Live summary **UNCHANGED** at `5 / 2 / 7 / 550 / 1 / 0`. That is the acceptance criterion proving the
widening reached no live site, and it agrees with the planning-session grep (`['functions']` /
`["functions"]` and `functions\s*[` both return **0** matches under `apps/frontend/src`, re-measured
this session unpiped, both `rc=1`).

### 3. `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` → **EXIT 0**

```
 ✓ tests/projectScopingGate.test.ts (106 tests) 1276ms
 Test Files  1 passed (1)
      Tests  106 passed (106)
```

**87 → 106**, 0 failed. Strictly greater than 87, as the plan requires.

### 4. `yarn lint:check` → **EXIT 0**

`0 errors` across every link of the chain (18 links). The 18 pre-existing warnings
(`unused-imports/no-unused-vars` in `packages/dev-seed/src/generators/**`,
`playwright/prefer-to-have-length` in `tests/**`) are untouched by this plan.

Plus `yarn test:unit` → **EXIT 0** (25 tasks, 1630 frontend tests passing) — the project's own gate,
run because the gate spec is a unit test and a green single-file run says nothing about the suite.

### Ranged tree hygiene

```
git diff db1530ca1f51eb84306251607309c67733c3e270..HEAD --stat -- apps/                 → 0 bytes (EMPTY)
git diff db1530ca1f51eb84306251607309c67733c3e270..HEAD --stat -- package.json yarn.lock → 0 bytes (EMPTY)
```

Criteria c1/c3/c4 of `161-VERIFICATION.md` rest on the `apps/` tree being untouched across every
gap-closure cycle. It is.

### CR-01 re-reproduced end to end, both halves

The verification report's third `missing:` item asks for the reproduction to be re-run against
whatever lands rather than trusting a SUMMARY's count. Both halves were appended to
`outside-boundary.clean.fixture.ts` in turn and the fixture restored after each:

| Injected shape | Before this plan | After this plan |
|---|---|---|
| `locals.supabase.functions['invoke']('probe_undispositioned_function', { body: {} })` | `matching the committed expectation`, **exit 0** | **exit 1** — ``computed member on the client's `functions` object`` at `:88`, count `2 → 3` |
| `locals.supabase['functions'].invoke('probe_undispositioned_function', { body: {} })` | not reported | **exit 1** — ``computed access to the client's `functions` member`` at `:88`, count `2 → 3` |

`git status` is clean of fixture changes after both; the post-restore self-test exits 0 at the
committed counts.

### Reds demonstrated, not merely greens observed

Preferring the red over the green, three mutations were run against scratch copies and removed:

| Mutation | Result |
|---|---|
| Strip `COMPUTED_INVOKE_RE`'s loop from `checkEdgeFunctionInvocations` | **exit 1** — outside count `7`, expected `7`→ reported as `6`, expected `7` |
| Strip `COMPUTED_FUNCTIONS_RE`'s loop | **exit 1** — outside count `9`, expected `11`; computed-`functions` messages `0`, expected `2` |
| Every punctuator cell reverted singly (the committed harness, 22 cells) | 21 RED, 1 GREEN — the one being `COMPUTED_FUNCTIONS_RE` cell 1, whose exemption is INVERTED and asserted |

## The derived `CORPUS_OF` map

Read out of the guard's own source, never authored. `READER_FUNCTIONS` first — a function is a
reader when its body takes a PROPERTY off a matcher, and its corpora are exactly the composers whose
bodies call it:

```
READER_FUNCTIONS:
  collectAccesses               -> adapter
  checkEscapeHatches            -> adapter
  checkSchemaHop                -> adapter
  checkEdgeFunctionInvocations  -> adapter+outside
  checkBoundary                 -> outside

CORPUS_OF:
  ACCESS_RE              -> ["adapter"]
  SCHEMA_HOP_RE          -> ["adapter"]
  BOUNDARY_ACCESS_RE     -> ["outside"]
  COMPUTED_ACCESS_RE     -> ["adapter"]
  COMPUTED_RECEIVER_RE   -> ["adapter"]
  CLIENT_BINDING_RE      -> ["adapter"]
  INVOKE_RE              -> ["adapter","outside"]
  COMPUTED_INVOKE_RE     -> ["adapter","outside"]
  COMPUTED_FUNCTIONS_RE  -> ["adapter","outside"]
```

The three that run over both corpora are exactly the three the invocation check holds, which is
exactly the check both composers call. That is the fact CR-01's disposition asserted without
measuring, and it is now asserted twice — once by the derivation and once by a hand-written second
derivation in the same case — so deleting either leaves it asserted by the other.

## Before / after of every committed count

| Expectation | Before | After | Moved in |
|---|---|---|---|
| `violationCount` | 27 | **29** | `4711afa35` |
| `violationTally.accesses` | 8 | 8 (unchanged) | — |
| `violationTally.escapeHatches` | 10 | **11** | `4711afa35` |
| `violationTally.invocations` | 4 | **5** | `4711afa35` |
| `violationTally.schemaHops` | 5 | 5 (unchanged) | — |
| `cleanCount` | 8 | 8 (unchanged) | — |
| `outsideViolationCount` | 6 → **7** | **11** | `15e05f213` → `4711afa35` |
| `outsideCleanCount` | 2 | 2 (unchanged) | — |
| `computedCount` (check-6 computed access) | 4 | **5** | `4711afa35` |
| `adapterComputedInvokeCount` (new) | — | **1** | `4711afa35` |
| `outsideComputedInvokeCount` (new) | — | **3** | `4711afa35` |
| `outsideComputedFunctionsCount` (new) | — | **2** | `4711afa35` |
| Self-test line | `27 / 0 / 6 / 0` vs `27 / 8 / 6 / 2` | **`29 / 0 / 11 / 0` vs `29 / 8 / 11 / 2`** | — |
| Live summary | `5 / 2 / 7 / 550 / 1 / 0` | **unchanged** | — |
| `MATCHER_NAMES` | 7 | **9** | `fe923091f` |
| `CALL_SHAPES` | 7 | **9** | `fe923091f` |
| `REDUNDANT_CELLS` | 1 | **2** | `fe923091f` |
| `RESIDUAL_PHRASES` / docblock bullets | 4 / 4 | **5 / 5** | `4711afa35` + `fe923091f` |
| `OPERATOR_CASES` | 6 | **8** | `fe923091f` |
| Gate spec tests | 87 | **106** | `fe923091f` |

Every count moved in the SAME commit as the behaviour that moved it, and
`node scripts/assert-project-scoped-queries.mjs` exits 0 at every intervening commit. (See "Issues
Encountered" for the one gate that does not hold across the intervening commits, and why.)

## Files Created/Modified

- `scripts/assert-project-scoped-queries.mjs` — `COMPUTED_INVOKE_RE` and `COMPUTED_FUNCTIONS_RE`
  declared and wired into `checkEdgeFunctionInvocations` as loops two and three sharing the same
  `found` counter; two new violate messages; the check-7 module-docblock bullet rewritten; one new
  `STATED RESIDUALS` bullet; two docblock paragraphs corrected off a stale exemption count; every
  moved self-test expectation and its explanatory comment.
- `scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts` — five computed
  invocation shapes: `computedInvokeMember`, `optionalComputedInvokeMember`,
  `optionalCallComputedInvokeMember`, `computedFunctionsMember`, `templateKeyComputedFunctionsMember`.
- `scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts` — two near-miss
  controls (`nearMissSuffixedFunctions`, `nearMissFunctionsPrefixedKey`) plus the two local types
  that keep them self-describing.
- `scripts/fixtures/project-scoped-queries/violation.fixture.ts` —
  `computedInvokeMemberInsideAdapter`, the adapter-corpus overlap shape.
- `scripts/fixtures/project-scoped-queries/clean.fixture.ts` — the same two near-miss controls at the
  adapter address.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — `functionBodyOf`, `readsConstant`,
  `callsFunction`, `readerFunctionsOf`, `deriveCorpusMap`, `READER_FUNCTIONS`, `CORPUS_OF`,
  `corpusListOf`; the corpus superset assertion in the `reported-by` arm; the `Disposition` union
  docstring; two new `CALL_SHAPES` entries and the `INVOKE_RE` re-disposition; two `OPERATOR_CASES`
  rows; one `REDUNDANT_CELLS` entry; the widened left-unanchored predicate; four new test cases.
- `.planning/todos/pending/2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md`
  — a dated note recording that the INVOCATION surface has left its scope and that its three
  enumerated shapes stand untouched. Not deleted, not widened.

## Decisions Made

See `key-decisions` in the frontmatter. The one worth restating in prose: the plan's
`<assumption_delta_decision>` promoted "the corpus a matcher is exercised over" from an implicit
property mentioned in three docblocks to a first-class derived value, and rejected the hand-authored
alternative the code review itself suggested. That rejection is what makes this a closure of the
defect class rather than a repair of the cell the review named — and it is measured, by running the
derivation against a synthetic source where the answer differs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's per-message expectation of `4` for the computed-invocation needle is arithmetically impossible; the measured value is `3`**

- **Found during:** Task 2
- **Issue:** The plan's action text asks for ``computed member on the client's `functions` object``
  to appear "exactly 4 times across the outside-violation messages" and
  ``computed access to the client's `functions` member`` "exactly 2 times". That is six messages, but
  the plan commits exactly FIVE shapes (its own acceptance criterion names all five by name) and its
  own `outsideViolationCount === 11` is `6 + 5`. Of the five, three carry the `invoke` key
  (`computedInvokeMember`, `optionalComputedInvokeMember`, `optionalCallComputedInvokeMember`) and
  two carry the `functions` key (`computedFunctionsMember`, `templateKeyComputedFunctionsMember`).
  The `4` is internally inconsistent with the rest of the plan, which is consistent at `3 + 2 = 5`.
- **Fix:** The committed expectation is `outsideComputedInvokeCount === 3`, with a failure message
  naming which three spellings it counts. The `2` is committed as written. The total, the shape list
  and the acceptance criterion `outsideViolationCount === 11` all agree.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** Measured, not assumed. Removing the `COMPUTED_FUNCTIONS_RE` loop from a scratch
  copy drops the outside count to 9 (`11 - 2`) and the computed-`functions` message count to 0;
  removing either `COMPUTED_INVOKE_RE` cell drops the count by one shape each.
- **Committed in:** `4711afa35`

**2. [Rule 1 - Bug] `computedCount` (check-6 computed access) had to move 4 → 5, which the plan does not mention**

- **Found during:** Task 2
- **Issue:** The plan's `computedInvokeMemberInsideAdapter` shape is matched by `COMPUTED_ACCESS_RE`
  as well as by the new rule — that IS the adjacency the shape exists to pin. The existing exact
  expectation `computedCount === 4` therefore fails, and it must move to 5 or the raised
  `escapeHatches` tally of 11 (3 aliases + 1 destructure + computed access + 2 client-field) does not
  decompose. The plan raises `escapeHatches` to 11 but does not name the sub-count.
- **Fix:** `computedCount === 5`, with its explanatory comment extended to name the fifth shape and
  the adjacency it belongs to.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** Self-test at `29 / 0 / 11 / 0`; the family decomposition stated in the comment
  block adds up.
- **Committed in:** `4711afa35`

**3. [Rule 2 - Missing Critical] Two docblock paragraphs claimed ONE measured exemption, which `REDUNDANT_CELLS` growing to two makes false**

- **Found during:** Task 2
- **Issue:** The module docblock said "ONE position is exempt", and `INVOKE_RE`'s own docblock said
  "It is the ONE measured exemption in this file". `COMPUTED_FUNCTIONS_RE`'s cell makes both false.
  A reach claim wider than the code is a false premise that propagates into later phases — the exact
  defect class this phase's third `missing:` item existed to end, and the plan's own prohibitions
  forbid a docblock claim without the assertion that measures it.
- **Fix:** Both paragraphs now describe the PROPERTY that makes a position exempt (the pattern
  anchors nothing to its left) and cross-reference `REDUNDANT_CELLS` for the set, carrying no
  numeral of their own — the convention the guard's other matcher-local paragraphs already follow.
- **Files modified:** `scripts/assert-project-scoped-queries.mjs`
- **Verification:** `grep -c 'ONE RESIDUAL'` stays 0 (asserted by the gate spec); the gate spec's
  `binds every left-unanchored admitted position to a measured exemption` case now requires the two
  derivations to name `{INVOKE_RE, COMPUTED_FUNCTIONS_RE}` on both sides, and passes.
- **Committed in:** `4711afa35`

**4. [Rule 1 - Bug] The reader predicate had to be a PROPERTY ACCESS, not a bare mention**

- **Found during:** Task 3
- **Issue:** The plan specifies `READER_FUNCTIONS` as "the top-level function names whose body
  mentions at least one entry of `MATCHER_NAMES`", and that a reader mentioned by neither composer
  throws by name. Implemented literally it throws on CORRECT code: the guard's non-vacuity floor
  ends its diagnostic with `'Check ACCESS_RE against the receiver spelling the adapter actually
  uses.'`, inside `main` — a function neither composer calls. A word boundary alone does not help,
  because the mention is a genuine whole-identifier occurrence inside a string.
- **Fix:** `readsConstant` requires a PROPERTY ACCESS (`\bNAME\s*\.`), which is the only way this
  guard ever uses a matcher (`NAME.lastIndex`, `NAME.exec`), and `callsFunction` requires a CALL
  (`\bNAME\s*\(`). Both are documented with the measured reason. The word boundary is retained and
  is separately load-bearing: `ACCESS_RE` is a substring of both `COMPUTED_ACCESS_RE` and
  `BOUNDARY_ACCESS_RE`, so a substring test would credit the access matcher with two other rules'
  corpora and report it as running over both corpora.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** The derived map matches the plan's expected map exactly, asserted against a
  hand-written second derivation; `main` is correctly not a reader; the synthetic-source control
  still moves `COMPUTED_ACCESS_RE` to `adapter+outside`.
- **Committed in:** `fe923091f`

**5. [Rule 3 - Blocking] `corpusListOf` was refactored to take the map as a parameter**

- **Found during:** Task 3
- **Issue:** The first draft closed over `CORPUS_OF`, which hid every read behind one indirection —
  the plan's acceptance criterion measures `CORPUS_OF` reads outside docblocks at ≥ 3 and the draft
  scored 2, and the synthetic-source case could not use the helper at all.
- **Fix:** `corpusListOf(map, name)` takes its map as a parameter, matching the file's existing
  "parameterise so it can be measured against a synthetic source" convention (`matcherSpanOf`,
  `regexDeclarationOf`, `functionBodyOf` all do). Reads now stand at 6, and the synthetic map goes
  through the same reader as the real one.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** `grep -v '^ \*' … | grep -c "CORPUS_OF"` prints 6; gate spec 106/106.
- **Committed in:** `fe923091f`

---

**Total deviations:** 5 auto-fixed (3 bugs, 1 missing critical, 1 blocking)
**Impact on plan:** No scope creep. Two are corrections to arithmetic the plan states inconsistently
with its own shape list and acceptance criteria; one is a correctness requirement the plan's own
prohibitions imply; two are implementation corrections needed to make the plan's stated derivation
work on the guard's actual source. Every acceptance criterion of every task is met, at exactly the
numbers the plan targets (`29 / 0 / 11 / 0` against `29 / 8 / 11 / 2`; live `5 / 2 / 7 / 550 / 1 / 0`).

## Issues Encountered

**The gate spec is transiently RED across commits 1 and 2, by the plan's own task decomposition.**
`MATCHER_NAMES` lives in the gate spec and is only extended in Task 3, while the two matchers are
declared in the guard in Tasks 1 and 2. The gate spec's `names every matcher the guard declares that
admits an optional punctuator` case requires a declared `*_RE` constant that is NOT on
`MATCHER_NAMES` to admit no optional punctuator at all — so `15e05f213` and `4711afa35` leave
`yarn test:unit` failing on that one case, and `fe923091f` closes it. The same applies to the
residual pair: the docblock bullet lands with the behaviour in Task 2, the `RESIDUAL_PHRASES` entry
in Task 3.

This is recorded rather than hidden. The plan's prohibition is scoped to
`node scripts/assert-project-scoped-queries.mjs` staying at exit 0 across intervening commits, which
holds — it was measured at each commit. Its `<verify>` blocks likewise run the gate spec only in
Task 3, and its Task 2 action says explicitly "do both edits before running the gate spec", which is
what was done. Moving the gate-spec halves earlier would have required putting Task 3's `files` into
Tasks 1 and 2, contradicting the plan's own task contract. **A future plan of this shape should put
`MATCHER_NAMES` and the residual-phrase list in the same task as the matcher declaration** so that
`yarn test:unit` is green at every commit, not only at the last one. No stubs, no skipped tests, no
unrun `<verify>` remain.

## Known Stubs

None. Every file created or modified was scanned for hardcoded empty values flowing to a consumer,
placeholder text, and TODO/FIXME markers. The guard and its fixtures are lint-time source, never
imported, built or executed by the application.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **CR-01 is closed.** Both halves of its pair are reported and counted at the boundary address, the
  disposition class that permitted it is now a named test failure, and the reproduction the
  verification report asks to be re-run reddens.
- **CR-02 remains open** and is the subject of `161-18-PLAN.md`: `CLIENT_BINDING_RE`'s call shape has
  exactly one link, so a sub-object alias (`const fns = this.supabase.functions;` followed by
  `fns.invoke(…)`) is a receiver-depth blind spot that no rule matches, inside the guard's strictest
  corpus. Nothing in this plan touches it, and nothing in this plan makes it harder to reach — the
  `CORPUS_OF` derivation and the superset assertion are both available to it.
- **One residual is newly stated and pinned:** a computed member whose key is not a string literal is
  unread, so an invocation reached through a runtime-computed member name is unread. It is a decided
  limitation with an assertion behind it, not an unstated hole.
- **`PRESHIP-01` should stay at `Gaps Found` until CR-02 lands**, matching 161-16's deliberate
  handling — criterion 2's wording is unconditional and one enumerable spelling still evades every
  matcher.

## Self-Check: PASSED

- All seven modified/created files exist on disk (`[ -f ]`).
- All four commits exist in `git log --oneline --all`: `15e05f213`, `4711afa35`, `fe923091f`,
  `f4cd26fa3`.
- All four plan-level `<verification>` gates re-run at final HEAD, unpiped: exit 0 / exit 0 /
  106 passed 0 failed / exit 0.
- Both ranged tree-hygiene checks empty against `db1530ca1f51eb84306251607309c67733c3e270`.
- Every task's `<acceptance_criteria>` re-run and passing, including the three grep-shaped ones
  (`grep -c 'COMPUTED_INVOKE_RE'` → 3; the docblock-stripped fixture-shape grep → 4;
  `grep -c` of the residual phrase → 1; the docblock-stripped `CORPUS_OF` grep → 6).

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-07*
