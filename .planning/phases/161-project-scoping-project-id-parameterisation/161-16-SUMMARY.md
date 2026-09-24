---
phase: 161-project-scoping-project-id-parameterisation
plan: 16
subsystem: testing
tags: [static-analysis, regex, guard, project-scoping, supabase, mutation-testing, optional-chaining]

# Dependency graph
requires:
  - phase: 161-15
    provides: "the seven matcher declarations carrying every optional punctuator, the four committed fixture pairs, the exact-count self-test, and the nineteen by-hand single-position reverts this plan's harness had to reproduce"
  - phase: 161-14
    provides: "the OPERATOR_CASES table and the two committed vacuity probes the mutation harness is modelled on"
provides:
  - "`optionalPunctuatorCellsOf` — one CELL per optional-punctuator admission, derived from each matcher declaration's own text rather than authored beside it"
  - "A per-cell mutation harness with an unmutated control: all nineteen cells reverted singly and required to break the guard's self-test, eighteen red and one inverted exemption"
  - "A closed token vocabulary, asserted per matcher: stripping the three known forms must leave no escaped question mark"
  - "A generated (link x punctuator) matrix over each matcher's committed canonical call shape, with four disposition values each carrying a measurement"
  - "The bridge assertion: admitted positions and enumerated tokens must agree per matcher, so a token with no link and a link with no token both fail"
  - "A module docblock whose every residual is pinned by the assertion that measures it, counted in both directions"
  - "Three probe paths in `.gitignore`, so no executable copy of the guard can survive a run or be committed"
affects: [161-verification, 162, guard-maintenance, project-scoping]

actuals:
  # chars/4 over the realized diff (`git diff ${plan_head_before}..HEAD | wc -c` = 86090), the same
  # instrument the plan's `estimate` used. Estimate was 28000; actual is under it.
  tokens: 21522
  tasks: 3
  # MEASURED: git rev-list --count ${plan_head_before}..HEAD at the plan-metadata commit —
  # three task commits plus this metadata commit.
  commits: 4
  plan_head_before: 6bad7b853a73ba014f40db89ecba316010430be3

tech-stack:
  added: []
  patterns:
    - "The (matcher x operator-position x punctuator) CELL, ENUMERATED from the declaration text rather than listed beside it — so a position added to a matcher becomes a measured cell without anybody remembering to add it to a list"
    - "An exemption is an INVERTED assertion, never a skip: an exempt cell's mutant must stay green, so the exemption fails the day its reason stops being true"
    - "A prose residual is bound to the assertion that measures it in BOTH directions — the phrase must be in the docblock, and the docblock's residual list must hold exactly as many entries as there are pinned phrases"
    - "A not-applicable punctuator kind costs a measurement (`samePosition.provenBy` must match) rather than silencing a cell"

key-files:
  created:
    - .planning/todos/pending/2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md
    - .planning/todos/pending/2026-09-07-exclude-string-literal-spans-from-the-project-scoped-query-guard.md
    - .planning/todos/pending/2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md
    - .planning/todos/pending/2026-09-07-typecheck-lint-and-format-the-project-scoped-query-fixtures.md
  modified:
    - packages/dev-seed/tests/projectScopingGate.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - .gitignore
    - .planning/phases/161-project-scoping-project-id-parameterisation/deferred-items.md

key-decisions:
  - "`regexDeclarationOf` was split into `matcherSpanOf` plus a rebuilder, and both take the source as a PARAMETER — which is what let the slicer's own two failure modes be reproduced against synthetic sources rather than described in a comment (WR-04)"
  - "`COMPUTED_ACCESS_RE`'s chain-link COMPUTED kind is declared not-a-distinct-position rather than dispositioned, with a written reason and an input proving the spelling is caught anyway — the pattern declares exactly one bracket at the end of a chain of free length, so a computed spelling at a chain link is that same bracket with a shorter chain"
  - "`BOUNDARY_ACCESS_RE`'s receiver link is `outside-the-pattern`, proven by the matcher still matching with the link dropped entirely — not merely by both spellings matching, which an admitted position would also satisfy"
  - "The residual phrase count is scoped to a named `STATED RESIDUALS` section of the docblock rather than counted across it, because the module docblock holds other bulleted lists and an unscoped count would measure the wrong paragraphs"
  - "PRESHIP-01 is left at `Gaps Found` in REQUIREMENTS.md; the closure verdict is the re-verifier's to reach and the plan says so explicitly"

patterns-established:
  - "Negative controls on the instrument itself: before the plan closed, a disposition was removed, a link was made to over-claim, and a residual phrase was deleted from the docblock — each produced a named failure, so the harness is known to be able to fail"
  - "A generated cell with no written disposition THROWS naming the cell, rather than being skipped"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "Every optional-punctuator admission in every matcher is enumerated from the declaration text, mutated singly, and required to break the guard's self-test — nineteen cells, eighteen load-bearing, one exemption whose redundancy is itself asserted"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#makes the guard's self-test fail when {MATCHER} cell {N} ({form}) is reverted (18 cases) and #is measurably redundant when INVOKE_RE cell 1 (member) is reverted (1 case)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#runs an unmutated copy of the guard through the same path and requires it to pass"
        status: pass
    human_judgment: false
  - id: D2
    description: "A position of the canonical call shape that no matcher admits is a named failure: cells are generated from links crossed with punctuator kinds, and one with no written disposition throws naming the cell"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#disposes every generated cell of {MATCHER} (7 cases, 34 generated cells)"
        status: pass
      - kind: other
        ref: "negative control: removing COMPUTED_RECEIVER_RE's member disposition produced `COMPUTED_RECEIVER_RE.receiver-to-client.member is a generated cell with no written disposition`"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two enumerations are bridged, so a token with no link and a link with no token both fail, with exactly one declared lookahead cell excluded and carrying a written reason"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#bridges {MATCHER}'s admitted positions to its enumerated tokens (7 cases)"
        status: pass
      - kind: other
        ref: "negative control: flipping BOUNDARY_ACCESS_RE's receiver link from `outside-the-pattern` to `matches` produced `BOUNDARY_ACCESS_RE member links against member tokens: expected 3 to be 2`"
        status: pass
    human_judgment: false
  - id: D4
    description: "The token vocabulary is closed: stripping the three enumerated forms from any matcher declaration leaves no escaped question mark, so a fourth spelling is a named failure rather than an uncounted cell"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#admits no optional punctuator in {MATCHER} outside the three enumerated token forms (7 cases)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#names every matcher the guard declares that admits an optional punctuator"
        status: pass
    human_judgment: false
  - id: D5
    description: "The module docblock's two universal-reach sentences are gone, and every residual now stated is pinned by the assertion that measures it, bound in both directions"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#states exactly the residuals the matrix pins, and no others"
        status: pass
      - kind: other
        ref: "grep -c of both named sentences and of `ONE RESIDUAL` in scripts/assert-project-scoped-queries.mjs — all three print 0"
        status: pass
      - kind: other
        ref: "negative control: deleting the string-literal residual line from the docblock reddened two cases naming the missing phrase"
        status: pass
    human_judgment: false
  - id: D6
    description: "The instrument can fail: the slicer is line-anchored and bounded to its own declaration, throws by name when a constant is absent, and its instrument-first assertions test the guard's declaration rather than a property of the helper"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts#reads the declaration rather than a docblock line quoting one; #throws naming the constant rather than borrowing the next declaration s literal"
        status: pass
    human_judgment: false
  - id: D7
    description: "The guard's own numbers are untouched and no executable copy of it can survive a run or be committed"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "node scripts/assert-project-scoped-queries.mjs — 0 violation(s), live 5 / 2 / 7 / 550 / 1, self-test 27 / 0 / 6 / 0 against sites 27 / 8 / 6 / 2"
        status: pass
      - kind: other
        ref: "`find scripts -maxdepth 1 -name '*probe*' | wc -l` prints 0; with all three probe paths present, `git status --porcelain scripts/` printed nothing"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-09-07
status: complete
---

# Phase 161 Plan 16: The Enumeration That Performs Itself — Summary

**The guard's reach stopped being a sentence: nineteen punctuator cells are now derived from the declaration text, mutated one at a time and required to break the self-test, thirty-four generated (link x punctuator) cells each carry a written disposition, a bridge assertion makes the two enumerations fail together, and every residual the module docblock states is pinned to the assertion that measures it.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-09-06T21:03:46Z
- **Completed:** 2026-09-06T21:31:38Z
- **Tasks:** 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- **A widened position with no fixture behind it is now a named test failure.** The nineteen cells are not listed anywhere — they are enumerated from each declaration's own text, so a position added to a matcher becomes a measured cell the moment it is written. Eighteen mutants must go red; the nineteenth is the one measured exemption and its mutant must stay GREEN, so the exemption fails the day its reason stops being true.
- **The opposite direction is closed too, and it is the direction the `?.(` gap arrived through.** Thirty-four cells are GENERATED from each matcher's committed canonical call shape crossed with the punctuator kinds applicable to it, and a generated cell with no written disposition throws naming the cell. No hand-written list of inputs could have surfaced the optional-call punctuator, because a list only holds what somebody thought to write down.
- **The bridge is the strongest thing here and it was measured failing.** Per matcher, admitted member links must equal member-operator tokens and admitted computed-or-call links must equal computed-or-call tokens. Flipping one link's disposition produced `BOUNDARY_ACCESS_RE member links against member tokens: expected 3 to be 2`.
- **The docblock can no longer drift from what the guard does.** The two sentences the third re-verification names are gone. Four residuals stand in their place, each pinned to its measurement, and the binding runs both ways: a phrase must be in the docblock, and the docblock's `STATED RESIDUALS` list must hold exactly as many items as there are pinned phrases. Deleting one line from the docblock reddens the suite.
- **The instrument was repaired before anything was measured through it (WR-04, WR-05).** The slicer's marker is line-anchored, its opening-delimiter search is bounded to the declaration's own window, and it throws by name in both cases — proven against synthetic sources rather than described. The two instrument-first assertions that could not fail (a non-empty source, which the empty pattern satisfies, and a not-global check the helper guarantees) were replaced with ones that can.
- **No executable copy of the guard can survive a run or be committed.** One reused path per process, removed in a `finally`, and three `.gitignore` entries covering this probe and the two pre-existing vacuity probes that were writing unignored copies into `scripts/`.

## The nineteen cell outcomes, automated against 161-15's by hand

Reproduced by the committed harness, not transcribed. The plan requires any disagreement to be reported as a finding rather than reconciled: **there is none — nineteen for nineteen.**

| Matcher | Cell | Form | 161-15 by hand | 161-16 automated | Agree |
|---|---|---|---|---|---|
| `ACCESS_RE` | 1 | member | exit 1 | exit 1 | yes |
| `ACCESS_RE` | 2 | member | exit 1 | exit 1 | yes |
| `ACCESS_RE` | 3 | member | exit 1 | exit 1 | yes |
| `ACCESS_RE` | 4 | computed-or-call | exit 1 | exit 1 | yes |
| `SCHEMA_HOP_RE` | 1 | member | exit 1 | exit 1 | yes |
| `SCHEMA_HOP_RE` | 2 | member | exit 1 | exit 1 | yes |
| `SCHEMA_HOP_RE` | 3 | member | exit 1 | exit 1 | yes |
| `SCHEMA_HOP_RE` | 4 | computed-or-call | exit 1 | exit 1 | yes |
| `BOUNDARY_ACCESS_RE` | 1 | member | exit 1 | exit 1 | yes |
| `BOUNDARY_ACCESS_RE` | 2 | member | exit 1 | exit 1 | yes |
| `BOUNDARY_ACCESS_RE` | 3 | computed-or-call | exit 1 | exit 1 | yes |
| `COMPUTED_ACCESS_RE` | 1 | member | exit 1 | exit 1 | yes |
| `COMPUTED_ACCESS_RE` | 2 | computed-or-call | exit 1 | exit 1 | yes |
| `COMPUTED_RECEIVER_RE` | 1 | computed-or-call | exit 1 | exit 1 | yes |
| `CLIENT_BINDING_RE` | 1 | member | exit 1 | exit 1 | yes |
| `CLIENT_BINDING_RE` | 2 | lookahead-branch | exit 1 | exit 1 | yes |
| `INVOKE_RE` | 1 | member | **exit 0** | **exit 0** | yes |
| `INVOKE_RE` | 2 | member | exit 1 | exit 1 | yes |
| `INVOKE_RE` | 3 | computed-or-call | exit 1 | exit 1 | yes |

**19 cells, 18 load-bearing, 1 exemption** — the same split, produced twice by two different instruments. The per-matcher counts also agree with 161-15's table exactly: 4 / 4 / 3 / 2 / 1 / 2 / 3.

Note on the ordinals: 161-15's table names cells by position label (`P1 receiver`, `CA2 computed punctuator`); this harness numbers them by the order their token appears in the declaration. The two orderings coincide, which is why the rows line up.

## Test count before and after each task

| Point | Tests | Plan's floor |
|---|---|---|
| Before this plan (161-15's tree) | 21 | — |
| After task 1 | 29 | at least 25 |
| After task 2 | 61 | at least 47 |
| After task 3 | **87** | at least task 2's count |

The dev-seed suite as a whole moved 676 → 742, all of it this file.

## The rewritten reach paragraph, verbatim

```
 * HOW FAR THE ACCESS PUNCTUATORS REACH, and where that claim is kept honest. Optional chaining has
 * three source punctuators, and the enumeration proving this guard reads all of them is deliberately
 * NOT in this paragraph — it is in `packages/dev-seed/tests/projectScopingGate.test.ts`, which
 * derives one CELL per punctuator admission from each declaration's own text, reverts each cell to
 * its plain form on its own, and requires the revert to break the self-test. Every admitted position
 * is therefore held in place by a committed fixture shape whose disposition depends on it. ONE
 * position is exempt and its redundancy is measured rather than assumed: the invocation matcher's
 * leading operator is unanchored, so a literal dot still matches the dot inside the punctuator and no
 * fixture can make it load-bearing — its mutant is asserted to stay green, so a change that ever made
 * it matter would fail there. The same spec generates every punctuator at every operator position of
 * each matcher's canonical call shape and demands a written disposition per cell, so a position the
 * language has that no matcher admits fails there too. A sentence here could go stale in either
 * direction; those assertions cannot.
 *
 * STATED RESIDUALS. Each phrase below is pinned by the assertion that measures it, so a residual
 * cannot be stated here without a measurement, nor measured without being stated:
 *   - an interposed comment is not trivia the matchers admit, so a receiver and a member separated
 *     by a block comment are unmatched in both corpora
 *   - a forbidden shape quoted inside a string literal is read as live code, because comment spans
 *     are excluded from the corpora and string spans are not
 *   - the escape-hatch and schema-hop checks do not run outside the adapter directory, so the
 *     computed spellings at that address are unreported
 *   - the binding rule reads only an initialiser that begins with the receiver, so a client aliased
 *     to the right of a nullish coalescing or a ternary is not reported, while a ternary TEST on the
 *     client is reported as an alias although it binds nothing
 *
 * The two matcher-local residual paragraphs — at the escape-hatch rule and at the boundary rule —
 * cross-reference this list rather than carrying counts of their own, because a numeral stated
 * beside one matcher is wrong the moment this list moves.
```

The two sentences named by `161-VERIFICATION.md`'s third `missing:` item were removed rather than softened. `grep -c` of each prints **0**, as does `grep -c 'ONE RESIDUAL'` — the WR-06 half, which covers BOTH matcher-local paragraphs that carried that numeral (check 6's and check 9's), not only the one the plan's prose names.

## The disposition matrix, as committed

Seven canonical call shapes, 19 links, **34 generated cells** — 33 dispositioned and 1 declared not-a-distinct-position with a proof. Each dispositioned cell is expanded into both spellings, so a disposition is authored once and measured twice.

| Matcher | Canonical shape | Cells | Dispositions |
|---|---|---|---|
| `ACCESS_RE` | `this.supabase.rest.from('elections');` | 7 | 4 matches, 3 reported-by |
| `SCHEMA_HOP_RE` | `this.supabase.rest.schema('public').from('elections');` | 7 | 4 matches, 3 reported-by |
| `BOUNDARY_ACCESS_RE` | `locals.supabase.rest.from('elections');` | 7 | 3 matches, 1 outside-the-pattern, 3 residual |
| `COMPUTED_ACCESS_RE` | `this.supabase.rest['from']('elections');` | 4 | 2 matches, 1 reported-by, 1 same-position |
| `COMPUTED_RECEIVER_RE` | `this['supabase'].from('elections');` | 2 | 1 matches, 1 reported-by |
| `CLIENT_BINDING_RE` | `const db = this.supabase;` | 2 | 1 matches, 1 reported-by |
| `INVOKE_RE` | `this.supabase.functions.invoke('send-email', {});` | 5 | 3 matches, 2 reported-by |

And the bridge holds for all seven:

| Matcher | member links admitted | member tokens | computed/call links admitted | computed-or-call tokens | lookahead cells |
|---|---|---|---|---|---|
| `ACCESS_RE` | 3 | 3 | 1 | 1 | 0 |
| `SCHEMA_HOP_RE` | 3 | 3 | 1 | 1 | 0 |
| `BOUNDARY_ACCESS_RE` | 2 | 2 | 1 | 1 | 0 |
| `COMPUTED_ACCESS_RE` | 1 | 1 | 1 | 1 | 0 |
| `COMPUTED_RECEIVER_RE` | 0 | 0 | 1 | 1 | 0 |
| `CLIENT_BINDING_RE` | 1 | 1 | 0 | 0 | **1 (declared, excluded)** |
| `INVOKE_RE` | 2 | 2 | 1 | 1 | 0 |

`CLIENT_BINDING_RE`'s lookahead cell is the one the plan predicted: a branch admitting the punctuator in order to EXCLUDE it. A lookahead position has no spelling in the shape it rejects, so it is declared with a written reason and excluded from the bridge rather than matched to a link. Exactly one matcher has one.

## Negative controls — the instrument was measured failing

The plan's prohibition is against a harness that cannot fail. Three deliberate perturbations were applied to a copy of the tree, run, and reverted:

| Perturbation | Result |
|---|---|
| Removed `COMPUTED_RECEIVER_RE`'s member disposition | `Error: COMPUTED_RECEIVER_RE.receiver-to-client.member is a generated cell with no written disposition` |
| Changed `BOUNDARY_ACCESS_RE`'s receiver link from `outside-the-pattern` to `matches` | `BOUNDARY_ACCESS_RE member links against member tokens: expected 3 to be 2` |
| Deleted the string-literal residual line from the docblock | two cases red, both naming the missing phrase |

The tree was confirmed byte-identical afterwards (`git diff --stat` showed only the intended changes) and the suite returned to 87 passing.

## The four follow-ups filed (D-N2)

Each entry names what it is, why it is not done here, and what would make it worth doing. All four are cross-recorded in this phase's `deferred-items.md`.

| Entry | Finding | What it is |
|---|---|---|
| `2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md` | WR-06 | `checkOutsideSource` runs the boundary and invocation checks alone, so three computed and schema-hop spellings are unreported at that address |
| `2026-09-07-exclude-string-literal-spans-from-the-project-scoped-query-guard.md` | IN-02 | comment spans are excluded from both corpora and string spans from neither, so a quoted shape is read as live code |
| `2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md` | WR-02, IN-01 | the binding rule is wrong in both directions: it misses `other ?? this.supabase` and `cond ? this.supabase : other`, and reports `this.supabase ? 1 : 0` as an alias |
| `2026-09-07-typecheck-lint-and-format-the-project-scoped-query-fixtures.md` | IN-03 (prior IN-08) | the four fixtures are TypeScript that nothing typechecks, lints or formats, while the self-test asserts exact counts over them |

## Task Commits

1. **Task 1 (tracer): enumerate and mutate the access matcher's operator positions** — `ce6997aa1` (test)
2. **Task 2: mutate every matcher's cells, with one measured exemption** — `45ace1301` (test)
3. **Task 3: bridge the punctuator matrix to the enumeration, and pin the docblock to it** — `a9b92c779` (test)

The tracer feedback gate ran after task 1: all four of its `<verify>` commands were re-run end to end (29/29 tests, self-test exit 0 with counts unmoved, zero probe residue, `git status --porcelain scripts/` silent) before any expansion task began.

## Files Created/Modified

- `packages/dev-seed/tests/projectScopingGate.test.ts` — `matcherSpanOf` (line-anchored, window-bounded, throws by name, takes the source as a parameter), `regexDeclarationOf` rebuilt on it, `PUNCTUATOR_TOKENS`, `optionalPunctuatorCellsOf`, `guardWithCellReverted`, `selfTestOf`, `MATCHER_NAMES`, `REDUNDANT_CELLS`, `RESIDUAL_PHRASES`, `MODULE_DOCBLOCK` / `RESIDUAL_SECTION` / `RESIDUAL_SECTION_PROSE`, `CALL_SHAPES` with the link/disposition model and its renderers, and three new describe blocks. `OPERATOR_CASES` loses its hand-authored optional inputs to the generated variants, keeps its near misses, and gains a per-row anchor. 21 → 87 tests.
- `scripts/assert-project-scoped-queries.mjs` — module docblock only. No declaration and no check changed: the reach paragraph is rewritten, a `STATED RESIDUALS` section added, and the two matcher-local `ONE RESIDUAL` paragraphs turned into cross-references.
- `.gitignore` — three probe paths, one per executable copy the gate spec writes beside the guard.
- `.planning/todos/pending/` — four new follow-up entries.
- `.planning/phases/161-project-scoping-project-id-parameterisation/deferred-items.md` — the four entries cross-recorded.

## Decisions Made

- **The `samePosition` declaration costs a measurement.** `COMPUTED_ACCESS_RE`'s chain-link computed kind is the only cell in the matrix that is not dispositioned. It could not be honestly dispositioned `matches` — the variant matches, but only because the terminal bracket is still in the shape, and counting it as an admitted position would break the bridge for the right reason at the wrong place. It is declared with a written reason (the pattern declares exactly one bracket at the end of a chain of free length) and with `provenBy: "this.supabase['rest'].from('elections');"`, which the matcher must match — so the declaration is a claim the suite checks, not an excuse.
- **`outside-the-pattern` requires a third measurement.** Both spellings matching is also what an admitted position looks like, so the disposition additionally requires the matcher to match the shape with that link dropped entirely (`supabase.rest.from('elections');`). That is what distinguishes "before the anchor" from "admitted".
- **`leftUnanchored` is bound to the exemption list.** A link the pattern anchors nothing to the left of cannot be made load-bearing by any fixture, which is exactly what an exemption claims. The suite asserts the set of matchers carrying such a link (with an admitted member position) equals the set of matchers in `REDUNDANT_CELLS`. Today both are `{INVOKE_RE}`.
- **The residual-list count is scoped, not global.** The module docblock already contains a bulleted list (the two self-proving mechanisms), so counting `- ` items across the whole docblock read 6 where the residuals are 4. The count is taken over a named `STATED RESIDUALS` section that throws by name if the heading is absent.
- **PRESHIP-01 is not marked complete.** `.planning/REQUIREMENTS.md` is untouched and still reads `Gaps Found`. The plan says the closure verdict is the re-verifier's to reach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The residual-list count measured the wrong paragraphs**

- **Found during:** Task 3, on the first run of the new matrix block.
- **Issue:** The docblock-binding assertion counted list items with `MODULE_DOCBLOCK.match(/^ \* {3}- /gm)` across the whole module docblock and read **6** where the residual list holds **4**. The two extra items are the pre-existing `WHY THIS GUARD PROVES ITSELF` bullets. As written the assertion would have been satisfied by any docblock whose total bullet count happened to equal the phrase count, which is a number agreeing by coincidence — the failure mode this plan exists to close, committed in the instrument.
- **Fix:** Added `RESIDUAL_SECTION`, which slices the docblock from its `STATED RESIDUALS` heading to the blank line ending the list and **throws by name** when the heading is absent, and moved both the item count and every residual-phrase assertion onto that section.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** 87/87 after the fix; deleting a residual line from the docblock still reddens (negative control 3).
- **Committed in:** `a9b92c779` (Task 3 commit).

**2. [Rule 2 - Missing Critical] The trivia negatives had to skip a second class of link, not one**

- **Found during:** Task 3, pre-measurement.
- **Issue:** The plan's trivia assertion requires a block comment interposed at a punctuator not to match. Measured, that is false at `INVOKE_RE`'s leading link — `this.supabase/* c */.functions.invoke(…)` still matches, because the pattern is unanchored and begins at `.functions`. The plan anticipates skipping the boundary matcher's `outside-the-pattern` receiver link but not this one, and asserting `false` there would have been an assertion contradicted by the code.
- **Fix:** Introduced the link-level `leftUnanchored` field with a written reason, set on both links (the boundary receiver and the invocation leading link), and skipped both for the split and comment negatives. Turned the omission into a positive by binding `leftUnanchored` to `REDUNDANT_CELLS`, so the two derivations must name the same matchers.
- **Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
- **Verification:** the binding assertion passes with both sets equal to `{INVOKE_RE}`; the trivia negatives pass at all 17 remaining links.
- **Committed in:** `a9b92c779` (Task 3 commit).

---

**Total deviations:** 2 auto-fixed (1 bug in the instrument, 1 missing critical distinction).
**Impact on plan:** Both strengthen the harness rather than relaxing it, and neither moved a committed count. No scope creep; nothing under `apps/` was touched.

## Known Residuals

Four, all stated in the guard's module docblock, all measured by an assertion, and all filed as follow-ups above. They are listed here as well because a residual that lives only in a docblock is one grep away from being missed:

1. **An interposed comment is not trivia the matchers admit.** `this.supabase/* c */.from('x')` is unmatched in both corpora.
2. **A forbidden shape quoted inside a string literal is read as live code.** Comment spans are excluded from both corpora; string spans are not.
3. **The escape-hatch and schema-hop checks do not run outside the adapter directory,** so the computed spellings at that address are unreported.
4. **The binding rule reads only an initialiser that begins with the receiver,** so `other ?? this.supabase` and `cond ? this.supabase : other` are not reported while `this.supabase ? 1 : 0` is reported as an alias.

No **stubs** were introduced: nothing in this plan returns a hardcoded empty value, carries a TODO or FIXME, or is skipped. No test is `skip`ped or `todo`. Every `<verify>` command in every task was run.

## Threat Flags

None. The plan's file set is a unit test, a docblock and `.gitignore`; no network endpoint, auth path, file-access pattern or schema was added or changed. The one capability the plan does add — the harness writing an executable copy of the guard into `scripts/` — is the plan's own `T-161-16-04`, mitigated as specified: one reused path, removal in a `finally` block, and three ignore entries, proven by `git status --porcelain scripts/` printing nothing while all three probe files existed.

## Issues Encountered

None beyond the two deviations. Prettier reflowed the gate spec after each task; it touched formatting only, and the suite and the guard's counts were re-run after every reflow.

## Verification

Every status read DIRECTLY from the command, never through a pipe into `grep`.

| Gate | Exit | Result |
|---|---|---|
| `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` | **0** | 87 passed / 87 |
| `node scripts/assert-project-scoped-queries.mjs --self-test` | **0** | 27 / 0 / 6 / 0 against site counts 27 / 8 / 6 / 2 |
| `node scripts/assert-project-scoped-queries.mjs` | **0** | `0 violation(s)`; live 5 / 2 / 7 / 550 / 1 |
| `yarn test:unit` | **0** | 25/25 turbo tasks; dev-seed 742, frontend 1630 |
| `yarn lint:check` | **0** | 23/23 tasks; every assert gate 0 violations, comment hygiene 1662 files / 0 violations |
| `npx prettier --check` (guard + gate spec) | **0** | all matched files use Prettier code style |
| `grep -c 'route past any of the nine checks'` | — | prints **0** (the number is the reading; `grep -c` exits 1 on zero matches, which is the pass) |
| `grep -c 'count proving it rather than a sentence here saying so'` | — | prints **0** |
| `grep -c 'ONE RESIDUAL'` | — | prints **0** |
| `find scripts -maxdepth 1 -name '*probe*' \| wc -l` | — | prints **0** |
| `git status --porcelain scripts/` | — | prints nothing, including while all three probe files exist |

The guard's numbers are byte-identical to the tree 161-15 left, in both halves — which is the plan's own test that no matcher was edited.

**On the E2E suite.** `git diff 6bad7b853..HEAD -- apps/` is **empty**. Nothing reaching the running application changed: the guard is lint-time source read as text and never imported, built or executed, and the one file under `packages/` is a repo-meta unit test. The phase's closing full-suite run at `tests/e2e-runs/161-13-close` (exit 0, 155 expected / 0 unexpected / 0 flaky / 0 skipped) still stands. The cardinal rule is not waived — there is nothing here that could move it.

**Not an acceptance criterion.** `.planning/REQUIREMENTS.md` still shows `[ ]` for PRESHIP-01 and "Gaps Found", untouched by this plan.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **All three of `161-VERIFICATION.md`'s `missing:` items are now answered on disk.** The first two were closed by 161-15; the third — the module docblock's two universal-reach sentences — is closed here, and closed in the way its own standard demands: the sentences were removed, and what replaced them is bound to assertions rather than to good faith.
- **The re-verifier should re-derive rather than trust this SUMMARY.** The nineteen cell outcomes and the four fixture counts are both reproducible in one command each (`yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` and `node scripts/assert-project-scoped-queries.mjs`), and this plan's own standard is that a number nobody re-measured is a number nobody knows.
- **This is the first closure that also makes the NEXT spelling a test failure rather than a review finding.** A tenth spelling of the access-operator family added to a matcher without a fixture reddens the mutation harness naming the matcher and the ordinal; a position of the call shape no matcher admits reddens the matrix naming the cell; and a docblock sentence that outruns either reddens the residual binding.
- **Four residuals are stated, measured and filed.** None is a live leak today. Each has a `.planning/todos/pending/` entry naming what would make it worth doing.
- **PRESHIP-01 is left at `Gaps Found`;** that is the re-verifier's verdict to reach.

## Self-Check: PASSED

All eight created or modified files exist on disk; all three task commits are present in `git log`. Every `<verify>` command from all three tasks and every command in the plan-level `<verification>` block was re-run at plan close, with the results in the table above.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-07*
