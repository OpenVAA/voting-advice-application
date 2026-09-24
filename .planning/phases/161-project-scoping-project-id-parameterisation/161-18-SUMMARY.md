---
phase: 161-project-scoping-project-id-parameterisation
plan: 18
subsystem: testing
tags: [static-analysis, lint-gate, regex, mutation-testing, lookahead, escape-hatches, supabase, vitest]

# Dependency graph
requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "161-16's derived cell/matrix enumeration and 161-17's CORPUS_OF derivation — this plan extends the same enumeration rather than adding a third"
provides:
  - "CLIENT_BINDING_RE PROMOTED in place: a binding of ANY node on the client's member chain is reported, the old client-only rule surviving as the chain-of-length-zero reading of it"
  - "lookaheadSpansOf + PunctuatorCell.inLookahead: which cells belong to a negative lookahead is DERIVED from the declaration's own spans, never authored"
  - "An `admitted-by-exclusion` disposition whose excludedBy input goes red the moment a lookahead stops excluding what it was written to exclude"
  - "CLIENT_BINDING_RE's chain link — the matrix can now SEE a sub-object alias as a generated, dispositioned cell"
  - "One stated residual: a bound scalar member is reported as an alias, pinned in both directions"
affects: [phase-162, project-scoped-query-guard, gsd-verify-work-161]

actuals:
  tokens: 14873
  tasks: 3
  commits: 4 # MEASURED: git rev-list --count 31a1629f7..HEAD (3 task commits + the docs commit carrying this file)
  plan_head_before: 31a1629f70212626514be7930866d5adb7f77013

tech-stack:
  added: []
  patterns:
    - "Lookahead-membership as a DERIVED cell attribute: a bridge that partitions consumed positions from excluded ones cannot be trivially satisfied by widening the lookahead"
    - "admitted-by-exclusion: a verdict for a position the pattern does not consume, carrying the ONE input the exclusion exists to reject so the disposition is a measurement rather than a shrug"
    - "Cost-stating over cost-hiding: a false positive a promotion cannot avoid is committed as a violating fixture shape, stated in the docblock and pinned, rather than deleted from every fixture"
    - "Mechanism-attributed mutation: each mutant must redden on the NAMED count, so a red from a syntax error is not counted as proof"

key-files:
  created: []
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts
    - .planning/todos/pending/2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md

key-decisions:
  - "CR-02 is CLOSED directly rather than stated as a residual: a binding one link along the client chain is reported and counted, not merely admitted to be unread"
  - "PROMOTE rather than parallel: the code review's suggested CLIENT_MEMBER_BINDING_RE was REJECTED as accepted debt — two matchers reading overlapping shapes need two message texts, two count families and a written tie-break, and would split the alias count that is the strongest single assertion in the guard"
  - "The false positive the promotion costs is COMMITTED as a violating shape and stated as a sixth residual — the impossibility claim behind the move was re-verified against the rule actually written, not taken from the plan"
  - "Lookahead-cell membership is DERIVED from the declaration's own spans; a hand-authored count is right on the day it is written and wrong at the next widening of the lookahead, which is the one edit where it matters"
  - "No REDUNDANT_CELLS entry was added for CLIENT_BINDING_RE: an exemption is a claim that a position CANNOT matter, and all three of the widened rule's positions demonstrably can"
  - "Task boundaries were re-partitioned so that yarn test:unit is green at EVERY commit, per the lesson 161-17 recorded against itself"

patterns-established:
  - "Land gate-spec infrastructure that is INERT against the current declaration first, so the behaviour commit that needs it does not have to leave the suite transiently red"
  - "Re-measure a plan's predicted mechanism against the code before asserting it: all four candidate lookahead readings and all three cell-revert readings were measured, not carried over"

requirements-completed: []

coverage:
  - id: D1
    description: "An alias of a client SUB-OBJECT is REPORTED and COUNTED inside the adapter directory — the guard's strictest corpus — where the shape previously moved nothing"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (violationCount 29 -> 32, escapeHatches 11 -> 14, aliasCount 3 -> 5)"
        status: pass
      - kind: integration
        ref: "CR-02 end-to-end reproduction re-run against what landed: the reviewer's exact two shapes appended to violation.fixture.ts now exit 1 naming both moved counts, where before they printed the committed expectation and exited 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "A destructure one link along is reported as a DESTRUCTURE with its own exact count, so the two halves of CR-02's reproduction are measured separately rather than pooled"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs --self-test (destructureCount 1 -> 2, pinned by its own expectation with its own failure message)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#tells an aliased client apart from an optional-chained access in CLIENT_BINDING_RE"
        status: pass
    human_judgment: false
  - id: D3
    description: "The matrix can structurally SEE the position: CLIENT_BINDING_RE's call shape carries a chain link, and lookahead-cell membership is derived rather than authored"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#derives which cells belong to a negative lookahead from the declaration s own spans"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#bridges CLIENT_BINDING_RE's admitted positions to its enumerated tokens"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#disposes every generated cell of CLIENT_BINDING_RE"
        status: pass
    human_judgment: false
  - id: D4
    description: "All three positions the widened lookahead admits are load-bearing, each mutant reddening for the named reason, with no exemption added"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reverts each CLIENT_BINDING_RE cell to a different measured reading of the alias count"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#makes the guard's self-test fail when CLIENT_BINDING_RE cell 1/2/3 is reverted (all three titled 'makes the guard's self-test fail', none 'is measurably redundant')"
        status: pass
    human_judgment: false
  - id: D5
    description: "The false positive the promotion costs is committed, stated and pinned; the live near-miss stays unreported"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reports a bound scalar member of the client as an alias"
        status: pass
      - kind: integration
        ref: "destructuredCallResult committed to clean.fixture.ts (live at supabaseDataWriter.ts:166); the clean fixture's site count is unmoved at 8 and it produces zero violations"
        status: pass
    human_judgment: false
  - id: D6
    description: "The widening reached no live site: the live corpus summary is unmoved and nothing under apps/ changed"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs (5 / 2 / 7 / 550 / 1 / 0, byte-identical to the pre-plan baseline)"
        status: pass
      - kind: other
        ref: "git diff 31a1629f7..HEAD --stat -- apps/ (empty, 0 bytes); the same ranged over package.json and yarn.lock (empty)"
        status: pass
    human_judgment: false

duration: 22 min
completed: 2026-09-07
status: complete
---

# Phase 161 Plan 18: Closing the Receiver-Depth Axis (CR-02) Summary

**`CLIENT_BINDING_RE` now reports a binding of ANY node on the client's member chain, declining only when the chain terminates in a call — so `const fns = this.supabase.functions;` is reported and counted inside the guard's strictest corpus, and the matrix can see that position as a generated, dispositioned cell rather than one its own hand-written link list structurally hid.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-07T06:28:00Z (`$PRE_PLAN_HEAD` captured as the first action)
- **Completed:** 2026-09-07T06:49:50Z
- **Tasks:** 3
- **Files modified:** 5

## `$PRE_PLAN_HEAD`

```
31a1629f70212626514be7930866d5adb7f77013
```

Every tree-hygiene check below is RANGED against it. A bare `git diff` or `git status` passes
vacuously once a change is committed, which is why the ranged form is what was run.

## Accomplishments

- **CR-02 is closed directly, not restated as a residual.** `CLIENT_BINDING_RE` was PROMOTED in
  place to
  `/(?<![=!<>])=\s*(?:await\s+)?this\s*\??\.\s*#?supabase\b(?!(?:\s*\??\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*)?[([])/g`.
  The change is entirely in the trailing lookahead: it no longer excludes any directly-following
  member token, it excludes an initialiser whose member chain TERMINATES IN A CALL or in a computed
  access. The old noun — a binding of the client itself — survives as the chain-of-length-zero
  reading of the same rule, so there is one message text, one count family, and no written tie-break
  between two overlapping matchers.
- **The reviewer's exact reproduction now reddens.** Appending the CR-02 pair verbatim to
  `violation.fixture.ts` previously printed `matching the committed expectation` and exited 0. It now
  exits **1**, naming both moved counts (alias `5 → 6`, destructure `2 → 3`) — see "CR-02
  re-reproduced end to end" below. The tree was restored after the run.
- **Both halves are counted SEPARATELY rather than pooled.** `subObjectAliasedClient` lands in the
  alias count and `destructuredSubObjectMethod` in the destructure count, each pinned by its own
  exact expectation with its own failure message, so a change that moved one into the other's family
  fails by name rather than leaving a pooled total intact.
- **The matrix can now SEE the position.** `CLIENT_BINDING_RE`'s call shape gains the
  `client-to-chain-member` link, disposed `admitted-by-exclusion` with `excludedBy` set to a method
  call on the client — the input that goes red the instant a future edit re-excludes any following
  member access. Before this, the shape had exactly one link, so no chain-link cell was generated and
  the bridge was satisfied by 1 link against 1 token: the links themselves were the hand-written list
  the matrix exists everywhere else to eliminate.
- **Lookahead membership is DERIVED, so the bridge cannot go trivially satisfied again.**
  `lookaheadSpansOf` slices a declaration and returns the character ranges of every negative
  lookahead, class- and escape-aware so `[([]` cannot open a group the source never opened.
  `PunctuatorCell.inLookahead` is set from those ranges, and the bridge compares link counts only
  against cells the pattern CONSUMES while comparing the total of cells of EVERY form inside a
  lookahead against `lookaheadCells.count`. Neither half can absorb the other's positions.
- **All three of the widened rule's positions are load-bearing, each for its named reason.** No
  `REDUNDANT_CELLS` entry was added, and the spec now asserts that none names this matcher. The three
  reverts were measured against a scratch copy before being asserted, and two of the three live
  INSIDE the lookahead and move the alias count in OPPOSITE directions — which is what says they are
  distinct positions rather than one counted twice.
- **The cost of the promotion is stated and pinned rather than hidden.** No source-level rule can tell
  a bound client SUB-OBJECT from a bound SCALAR member — both are spelled `= this.supabase.<ident>;`
  — so `const restUrl = this.supabase?.restUrl;` is now reported and for that site the message is a
  false statement about what was bound. The shape MOVED from `clean.fixture.ts` to
  `violation.fixture.ts` rather than being deleted, and the sixth residual naming the limitation is
  pinned in both directions. The impossibility claim was re-verified against the rule actually
  written, not accepted from the plan (see "The fixture move, checked before it was made").
- **The live near-miss is committed rather than assumed.** `destructuredCallResult` —
  `const { data } = await this.supabase.auth.getUser();`, LIVE at
  `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:166` — sits in
  `clean.fixture.ts` and stays unreported. It differs from the reported `destructuredFrom` in exactly
  one respect: its chain terminates in a call.
- **The live corpus is unmoved.** `5 / 2 / 7 / 550 / 1 / 0`, byte-identical to the pre-plan baseline.
  Nothing under `apps/` changed, ranged.

## Task Commits

1. **The gate-spec derivation, inert against the declaration as it stood** — `c4d4b2979` (test)
2. **Task 1 (tracer): the promoted binding rule, its message, its fixtures, its counts** —
   `249715571` (feat)
3. **Task 3: every widened position load-bearing for its named reason; the todo reconciled** —
   `44c4e8f11` (test)

Commit 1 carries the half of the plan's Task 2 that had to precede the widening; commit 2 carries the
plan's Task 1 plus the half of Task 2 that had to accompany it. See deviation 1.

**Plan metadata:** see the `docs(161-18)` commit that carries this file.

## Verification

All five gates run **unpiped**, reading each gate's own exit status. `cmd | grep` reports grep's
status, not the gate's, and this repository has lost two commits to exactly that.

### 1. `node scripts/assert-project-scoped-queries.mjs --self-test` → **EXIT 0**

```
Project-scoped query guard — self-test flagged 32 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (32 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 11 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (11 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
```

`32 / 0 / 11 / 0` against site counts `32 / 8 / 11 / 2` — exactly the plan's target, with no
expectation adjusted to meet a measurement.

### 2. `node scripts/assert-project-scoped-queries.mjs` → **EXIT 0**

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all, 550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s); self-test flagged 32 line(s) … matching the committed expectation.
```

Live summary **UNCHANGED** at `5 / 2 / 7 / 550 / 1 / 0`. That is the acceptance criterion proving the
widening reached no live adapter site, and it agrees with the plan's measured premise: every live
`= this.supabase…` chain in a guarded source terminates in a CALL, including the two multi-line ones
at `supabaseDataWriter.ts:211` and `:293`, which the lookahead's whitespace-spanning chain reads
across the newline.

### 3. `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` → **EXIT 0**

```
 ✓ tests/projectScopingGate.test.ts (110 tests) 1460ms
 Test Files  1 passed (1)
      Tests  110 passed (110)
```

**106 → 110**, 0 failed. The plan requires a passed count at least 2 above 161-17's 106; it grew by
4 (the third `CLIENT_BINDING_RE` cell the widened declaration generates, the lookahead-span
derivation, the residual pin, and the mechanism-attribution case).

No `CLIENT_BINDING_RE cell` case is titled `is measurably redundant`. All three read
`makes the guard's self-test fail`, verified by name in a `--reporter=verbose` run:

```
✓ makes the guard's self-test fail when CLIENT_BINDING_RE cell 1 (member) is reverted
✓ makes the guard's self-test fail when CLIENT_BINDING_RE cell 2 (member) is reverted
✓ makes the guard's self-test fail when CLIENT_BINDING_RE cell 3 (computed-or-call) is reverted
```

### 4. `yarn lint:check` → **EXIT 0**

Read directly from the chain's own status, never through a pipe. All 18 links pass, including
`assert-comment-hygiene.mjs` (`0 violation(s)` across 1662 files) and the project-scoped query guard
itself. The 18 pre-existing warnings (`unused-imports/no-unused-vars` in
`packages/dev-seed/src/generators/**`, `playwright/prefer-to-have-length` in `tests/**`) are
untouched by this plan.

### 5. `yarn test:unit` → **EXIT 0**

25 tasks successful, 25 total; 1630 frontend tests passing. Run because the gate spec is a unit test
and a green single-file run says nothing about the suite.

### Ranged tree hygiene

```
git diff 31a1629f70212626514be7930866d5adb7f77013..HEAD --stat -- apps/                 → 0 bytes (EMPTY)
git diff 31a1629f70212626514be7930866d5adb7f77013..HEAD --stat -- package.json yarn.lock → 0 bytes (EMPTY)
grep -v '^ \*' scripts/assert-project-scoped-queries.mjs | grep -c 'FIVE shapes'         → 0
grep -c 'SIX shapes' scripts/assert-project-scoped-queries.mjs                            → 1
```

Criteria c1/c3/c4 of `161-VERIFICATION.md` rest on the `apps/` tree being untouched across every
gap-closure cycle. It is. No package-manager install occurred and no dependency was added
(T-161-18-SC).

## CR-02 re-reproduced end to end

The verification report's third `missing:` item asks for the reproduction to be re-run against
whatever lands rather than trusting a SUMMARY's count. The reviewer's two shapes were appended
verbatim to `violation.fixture.ts` and the fixture restored afterwards:

| Injected shape | Before this plan | After this plan |
|---|---|---|
| `const fns = this.supabase.functions;` + `fns.invoke('probe_undispositioned_function', { body: {} })` | `matching the committed expectation`, **exit 0** | **exit 1** — alias count `5 → 6` |
| `const { invoke } = this.supabase.functions;` + `invoke('probe_undispositioned_function_2', { body: {} })` | not reported | **exit 1** — destructure count `2 → 3` |

Both appended together, the run reports `34 site(s), expected exactly 32` and
`16 escape-hatch site(s), expected exactly 14` as well. `git status` is clean of fixture changes
after the restore, and the post-restore self-test exits 0 at the committed counts.

## The fixture move, checked before it was made

Moving a shape out of the clean corpus is also how a false positive gets laundered into an expected
result, so the plan's impossibility claim was verified against the rule actually written rather than
accepted:

- **Is the claim true?** `const restUrl = this.supabase?.restUrl;` and
  `const fns = this.supabase.functions;` are the same source shape — `= this.supabase` followed by a
  member chain that does not terminate in a call. Nothing in the text distinguishes a scalar from a
  sub-object. Confirmed by running both through the committed declaration: both match, and no
  narrowing of the trailing lookahead separates them without also dropping the sub-object alias that
  is the whole of CR-02. The claim holds, so the move was made.
- **Is the residual honest, in the user's terms?** It says the guard will flag a harmless scalar read
  — "a plain member read bound to a local is reported as an alias, and for that one site the message
  is a false statement about what was bound" — rather than describing the regex.
- **Does the `getUser()` near-miss genuinely remain unreported?** Yes. It is committed to
  `clean.fixture.ts` as `destructuredCallResult`, the clean fixture's site count is unmoved at 8, it
  produces zero violations, and `binding.test("const { data } = await this.supabase.auth.getUser();")`
  is asserted `false` beside the false positive it must not become.

## Before / after of every committed count

| Expectation | Before | After | Moved in |
|---|---|---|---|
| `violationCount` | 29 | **32** | `249715571` |
| `violationTally.accesses` | 8 | 8 (unchanged) | — |
| `violationTally.escapeHatches` | 11 | **14** | `249715571` |
| `violationTally.invocations` | 5 | 5 (unchanged) | — |
| `violationTally.schemaHops` | 5 | 5 (unchanged) | — |
| `cleanCount` | 8 | 8 (unchanged) | — |
| `aliasCount` | 3 | **5** | `249715571` |
| `destructureCount` | 1 | **2** | `249715571` |
| `computedCount` | 5 | 5 (unchanged) | — |
| `outsideViolationCount` / `outsideCleanCount` | 11 / 2 | 11 / 2 (unchanged) | — |
| Self-test line | `29 / 0 / 11 / 0` vs `29 / 8 / 11 / 2` | **`32 / 0 / 11 / 0` vs `32 / 8 / 11 / 2`** | — |
| Live summary | `5 / 2 / 7 / 550 / 1 / 0` | **unchanged** | — |
| `CLIENT_BINDING_RE` cells | 2 | **3** | `249715571` |
| `CALL_SHAPES` links for `CLIENT_BINDING_RE` | 1 | **2** | `249715571` |
| `lookaheadCells.count` for `CLIENT_BINDING_RE` | 1 | **2** | `249715571` |
| `Disposition` verdicts | 4 | **5** | `c4d4b2979` |
| `REDUNDANT_CELLS` | 2 | 2 (unchanged — no entry added) | — |
| `RESIDUAL_PHRASES` / docblock bullets | 5 / 5 | **6 / 6** | `249715571` |
| `MATCHER_NAMES` | 9 | 9 (unchanged — no new matcher) | — |
| Gate spec tests | 106 | **110** | across all three |

Every count moved in the SAME commit as the behaviour that moved it, and
`node scripts/assert-project-scoped-queries.mjs` exits 0 at every intervening commit — measured, by
checking out each commit's guard and fixtures in turn and running it (`c4d4b2979`: exit 0;
`249715571`: exit 0).

## The four candidate lookahead readings, re-measured

The plan's premise is that the alias and destructure counts are the discriminator on this lookahead.
That premise was re-measured rather than carried over, against the committed shape set:

| Candidate trailing lookahead | alias / destructure | What it gets wrong |
|---|---|---|
| none at all | **7 / 2** | both optional-chained table accesses are mistaken for aliases |
| `(?!\s*[?.[(])` — a bare `?` in a character class | **2 / 1** | `??` begins with the same character and the `.` also excludes every binding one link along |
| `(?!\s*(?:\?\.\|[.[(]))` — the narrow pre-161-18 form | **3 / 1** | a sub-object binding is excluded alongside the access it was written to exclude |
| **the committed form** | **5 / 2** | — |

These readings are now recorded in the comment above the alias count in the guard, replacing the
three-way readings that were true of the narrow lookahead.

## The three cell reverts, measured before being asserted

| Reverted cell | Mechanism | Reading | Exit |
|---|---|---|---|
| 1 — the receiver member operator | `optionalReceiverAliasedClient` stops being reported | alias `5 → 4` | 1 |
| 2 — the member operator inside the lookahead's chain | the lookahead cannot read `?.from`, so `optionalChainedTableRead`'s bound access is reported a second time as an alias | alias `5 → 6` | 1 |
| 3 — the computed-or-call token inside the lookahead | the lookahead cannot reject the optional-CALL spelling, so `optionalCallTableRead`'s bound access is reported as an alias | alias `5 → 6` | 1 |

Two of the three live INSIDE the lookahead and move the count in OPPOSITE directions. Each is now
asserted to redden AND to name `check-6 aliased-client violation(s)` in stderr, so a mutant that goes
red for an unrelated reason fails the case instead of being counted as proof.

## Files Created/Modified

- `scripts/assert-project-scoped-queries.mjs` — the promoted `CLIENT_BINDING_RE`; the two comment
  paragraphs above it rewritten (the backtracking finding restated for the widened shape, the
  superseded alternation finding replaced by the terminating-call finding with all four readings);
  the check-6 violate message widened to `aliases the raw client or one of its members` with the
  `countIn` needle preserved verbatim; the check-6 docblock `FIVE shapes` → `SIX shapes` with the
  sixth enumerated and what it cost stated; the module docblock's check-6 bullet and the prohibition
  paragraph moved off "five"; one new `STATED RESIDUALS` bullet; every moved self-test expectation and
  its explanatory comment block.
- `scripts/fixtures/project-scoped-queries/violation.fixture.ts` — `subObjectAliasedClient`,
  `destructuredSubObjectMethod`, `boundClientMemberRead`; `optionalCallTableRead` re-shaped to bind
  its builder; `AnyClient` gains `restUrl: string`.
- `scripts/fixtures/project-scoped-queries/clean.fixture.ts` — `destructuredCallResult` added,
  `optionalMemberRead` removed, `AnyClient.auth` gains `getUser`, `AnyClient.restUrl` removed with
  the shape that read it.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — `lookaheadSpansOf`,
  `PunctuatorCell.inLookahead`, the bridge partition, the `admitted-by-exclusion` verdict and its
  arm, `CLIENT_BINDING_RE`'s chain link and `lookaheadCells.count`, the trivia inversion, the
  `RESIDUAL_PHRASES` entry, and three new cases.
- `.planning/todos/pending/2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md` — a
  dated note recording the chain-depth closure, the re-measured discriminator readings and the
  residual-list length change. Not deleted, not closed: its left-edge scope is untouched.

## Decisions Made

See `key-decisions` in the frontmatter. The one worth restating in prose: the plan's
`<assumption_delta_decision>` promoted "a binding of any node on the client's member chain" to the
primary noun and REJECTED the code review's own suggested second matcher. That rejection is what
makes this a closure of the class rather than a repair of the cell the review named — and it is what
kept the alias count, the strongest single assertion in the guard, whole rather than split across two
rules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's task boundaries would have left `yarn test:unit` red across a commit; the work was re-partitioned into three green commits**

- **Found during:** Task 1, before any edit
- **Issue:** The plan puts the widened declaration in Task 1 and the gate-spec changes it requires in
  Task 2. The widened declaration enumerates three cells rather than two, so the bridge would demand
  two member-admitting links against one, and the sixth residual bullet would stand against a
  five-entry `RESIDUAL_PHRASES` — the gate spec is RED at the Task 1 commit, by construction. This is
  the exact defect 161-17 recorded against itself ("a future plan of this shape should put
  `MATCHER_NAMES` and the residual-phrase list in the same task as the matcher declaration"), and the
  orchestrator's dispatch instruction directed that a declaration must not be split from the
  gate-spec list that names it.
- **Fix:** The gate-spec changes were split by whether they are INERT against the pre-widening
  declaration. Everything inert — `lookaheadSpansOf`, `inLookahead`, the bridge partition, the
  `admitted-by-exclusion` verdict and its arm, the derivation case — landed FIRST, in `c4d4b2979`,
  where it is a no-op (`lookaheadCells.count` 1 against 1 in-lookahead cell, 106 → 107 tests, 0
  failed). Everything coupled to the widening — the chain link, `lookaheadCells.count` 2, the trivia
  inversion, the `RESIDUAL_PHRASES` entry, the exact cell assertions — landed WITH it in
  `249715571`. The plan's Task 1 remains one atomic, end-to-end-verified tracer commit; only the
  commit boundary of Task 2 moved.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** The gate spec exits 0 at `c4d4b2979` (107/107) and at `249715571` (109/109),
  measured, not assumed.
- **Committed in:** `c4d4b2979` + `249715571`

**2. [Rule 1 - Bug] `assert-comment-hygiene.mjs` — a `lint:check` link neither the plan nor its baseline names — was red across the first two commits**

- **Found during:** Task 3, at the plan's `yarn lint:check` gate
- **Issue:** The repository runs a comment-hygiene guard (phase 152, REVIEW-HYG-01) as a link of
  `lint:check`. Its rule 2 (D-A4) forbids a `//` comment line that ends without terminal punctuation
  where the line below continues the same comment at the same indent — the gate spec's house style is
  one long line per paragraph, which is why every pre-existing `//` comment in that file is a single
  line. The multi-line `//` blocks this plan added violated it: **16** violations at `c4d4b2979` and
  **20** at `249715571`, measured by checking out each commit's version of the file and re-running
  the guard. `node scripts/assert-project-scoped-queries.mjs` and `yarn test:unit` were green at both,
  but `yarn lint:check` was not.
- **Fix:** Every `//` block this plan added was joined into the single-line-per-paragraph form the
  file already uses. No prose was cut.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** `node scripts/assert-comment-hygiene.mjs` → `0 violation(s)` across 1662 files;
  `yarn lint:check` → exit 0. The historical status was measured per commit rather than inferred.
- **Committed in:** `44c4e8f11`

**3. [Rule 1 - Bug] The `REDUNDANT_CELLS` acceptance criterion was met as a durable invariant rather than as a hard count**

- **Found during:** Task 3
- **Issue:** The plan's criterion is "`REDUNDANT_CELLS` still holds exactly 2 entries". Committing
  `expect(REDUNDANT_CELLS.length).toBe(2)` would put a numeral in the spec that reddens on any
  unrelated future exemption — the same defect class this phase has removed from the guard's
  docblocks four times, one scope down.
- **Fix:** The committed assertion is
  `expect(REDUNDANT_CELLS.some((entry) => entry.matcher === 'CLIENT_BINDING_RE')).toBe(false)`, which
  is the claim the plan actually cares about ("do NOT add it to `REDUNDANT_CELLS`") and does not go
  stale. The literal count was verified as a measurement instead: `REDUNDANT_CELLS` holds exactly two
  entries, `INVOKE_RE` ordinal 1 and `COMPUTED_FUNCTIONS_RE` ordinal 1, unchanged. The existing
  `binds every left-unanchored admitted position to a measured exemption` case continues to tie the
  set to a second, independent derivation.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** Measured directly at HEAD — 2 entries, neither naming `CLIENT_BINDING_RE`.
- **Committed in:** `44c4e8f11`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** No scope creep and no acceptance criterion weakened. One is a commit-boundary
re-partition that makes every intervening commit green, which the plan's own prohibitions want and
161-17's SUMMARY explicitly recommends; one is a repair of a `lint:check` link the plan's baseline
does not name; one replaces a stale-prone numeral with the invariant behind it and reports the
numeral as a measurement. Every acceptance criterion of every task is met at exactly the numbers the
plan targets (`32 / 0 / 11 / 0` against `32 / 8 / 11 / 2`; live `5 / 2 / 7 / 550 / 1 / 0`).

## Issues Encountered

**`yarn lint:check` was red across the first two commits** — see deviation 2. It is recorded rather
than hidden, and it was measured per commit rather than inferred. The plan's own prohibition is
scoped to `node scripts/assert-project-scoped-queries.mjs` staying at exit 0 across intervening
commits, which holds (measured at both), and `yarn test:unit` was green at both as well. The lesson
for a plan of this shape: **run `node scripts/assert-comment-hygiene.mjs` before each commit** — it
costs about a second over 1662 files — rather than discovering it at the plan's closing
`yarn lint:check`.

**The broken-windows ledger could not be appended to, for a pre-existing reason.**
`gsd-tools windows append` refuses with "Ledger table in `.planning/WINDOWS.md` disagrees with the
fenced JSON entries … in its header or separator row". The file (458 KB) was in that state before
this plan started and nothing here touched it, so repairing it is out of this plan's scope boundary.
The deviation above is therefore recorded in this SUMMARY only. **A ledger repair should be filed as
its own item** — the ship gate reads that file, and an append that silently cannot happen is exactly
the failure the ledger exists to prevent.

No stubs, no skipped tests, no unrun `<verify>` remain.

## Known Stubs

None. Every file created or modified was scanned for hardcoded empty values flowing to a consumer,
placeholder text, and TODO/FIXME markers. The guard and its fixtures are lint-time source, never
imported, built or executed by the application.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **CR-02 is closed.** Both halves of its reproduction are reported and counted with their own exact
  counts inside the adapter directory, the position the matrix structurally could not see is now a
  generated and dispositioned cell, and the reproduction the verification report asks to be re-run
  reddens.
- **`PRESHIP-01` is deliberately left at `Gaps Found`**, matching 161-16's and 161-17's handling.
  Criterion 2's wording is unconditional and a fifth verification pass — not this SUMMARY — is what
  decides whether an enumerable spelling still evades every matcher. `requirements-completed` is
  therefore empty rather than claiming the requirement.
- **One residual is newly stated and pinned:** the binding rule cannot tell a bound client sub-object
  from a bound scalar member, so a plain member read bound to a local is reported as an alias. It is a
  decided cost with a committed fixture shape and an assertion behind it, not an unstated hole. Six
  residuals now stand, counted in both directions.
- **The standing follow-up is reconciled, not closed.** Its CHAIN-DEPTH axis is closed by this plan,
  so its remaining scope is the LEFT edge alone (`other ?? this.supabase`, a ternary, and the
  ternary-test false positive). Its stale discriminator readings and its stale residual-list length
  are corrected in a dated note, so a later phase plans against what is true rather than against what
  was true when it was filed.

## Self-Check: PASSED

- All five modified files exist on disk (`[ -f ]`).
- All three task commits exist in `git log --oneline --all`: `c4d4b2979`, `249715571`, `44c4e8f11`.
  `git rev-list --count 31a1629f7..HEAD` prints **4** at final HEAD — those three plus the
  `docs(161-18)` commit carrying this file — which is the number recorded in `actuals.commits`.
- All five plan-level `<verification>` gates re-run at final HEAD, unpiped: exit 0 / exit 0 /
  110 passed 0 failed / exit 0 / exit 0.
- Both ranged tree-hygiene checks empty against `31a1629f70212626514be7930866d5adb7f77013`.
- Every task's `<acceptance_criteria>` re-run and passing, including the grep-shaped ones
  (`SIX shapes` → 1; `FIVE shapes` outside docblock continuations → 0; the residual phrase → 1; the
  new lookahead literal → 1; the old lookahead literal → 0; `inLookahead` outside docblocks → 8;
  the three violating fixture methods → 3; `destructuredCallResult` → present;
  `optionalMemberRead` → 0) and the two list-length ones (`RESIDUAL_PHRASES` → 6, docblock
  bullets → 6).

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-07*
