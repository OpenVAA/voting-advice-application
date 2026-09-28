---
phase: 159-component-context-consolidation
plan: 03
subsystem: testing
tags: [svelte5, runes, effect, derived, census, static-analysis, node, guard-script]

requires:
  - phase: 159-component-context-consolidation
    provides: "159-01's corrected 91-site baseline and Guard A; 159-02's re-measured demotion evidence, its PasswordSetter census-shape handoff, and the conversion that moved the population from 91 to 90"
  - phase: 152-comment-naming-hygiene-sweep
    provides: the comment-hygiene convention every comment in the script and the census is authored against (D-N1)
  - phase: 153-vitest-config-and-alias-hygiene
    provides: the frontend unit-suite test-file count the classifier's placement outside apps/frontend/src protects
provides:
  - A committed dependency-free Node classifier whose row count is asserted equal to the criterion's own grep re-run at generation time, with an embedded seven-behaviour self-test
  - A committed 90-row per-site effect census with a uniformly applied predicate, a 15-entry bucket precedence order, a disposition and a contract-change verdict per row
  - The measured answer to CONTEXT O5 bullet 3 - the contract-change column makes "unambiguous" and "would need a two-way-bindable target" visibly different facts
  - A named home and a specific routing for the 211 census figure, measured rather than assumed, in five still-wrong locations across three documents
  - Two corrections to inherited facts: the bindable bucket is 9 not the 7 predicted, and the CONVERTIBLE bucket is empty
affects: [159-07, 159-11]

actuals:
  tokens: 18813
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A census whose contract is an EQUALITY between two commands, not a frozen literal, because the population it counts moves within the same phase's execution"
    - "A classification script carries its own behaviour suite in-file, so a phase-directory analysis artifact is testable without entering any workspace's unit suite"
    - "Bucket exclusivity by a precedence order declared at the top of the script, with the bucket-sum-equals-row-count invariant asserted by the script itself rather than by the reader"

key-files:
  created:
    - .planning/phases/159-component-context-consolidation/classify-effects.mjs
    - .planning/phases/159-component-context-consolidation/159-EFFECT-CENSUS.md
  modified:
    - .planning/WINDOWS.md

key-decisions:
  - "The classifier script is COMMITTED rather than thrown away (Claude's Discretion under D-H1, following RESEARCH's recommendation). Rationale: the census is a claim about 90 sites, the population moves whenever a later phase adds or removes an effect, and a predicate applied by hand is 90 readings of a sentence rather than one predicate."
  - "NO ASSIGNMENT sits at precedence 2, above TEARDOWN/ASYNC/UNTRACK/NAV/DOM, because the plan's must_haves truth binds a zero-assignment body to the call-only bucket. Consequence, stated in the census: TEARDOWN, NAV and DOM read near-empty here where RESEARCH reported 7, 3 and 1, since a body that returns a cleanup or navigates usually assigns nothing."
  - "'No assignment' means no assignment ANYWHERE in the body, nested callbacks included; depth decides totality, not existence. Without this an effect whose only write sits inside `untrack(() => { ... })` files as call-only, which is the least informative label available for it."
  - "A 16th bucket, DOC COMMENT, was added because the criterion's grep counts a JSDoc mention at `contexts/utils/settingsOverlay.svelte.ts:31`. The classifier must count exactly what the grep counts to assert equality, and labelling a comment as a runtime call-only effect would be a lie inside the census."
  - "The two operational buckets the plan asked for are implemented as the two it named (second writer in module; child two-way binding); the plan's own count of 'four' in the same sentence is not reproducible from its enumeration."
  - "No row's disposition reads CONVERTED, and that is correct rather than an omission: converting an effect deletes it, so the two sites this phase converted are not `$effect(` occurrences and cannot be rows. They are recorded in census section 8 instead."

patterns-established:
  - "Pattern 1: a generated artifact states the command that produced each of its numbers AND re-runs that command at generation time, so the artifact cannot silently inherit a stale figure"
  - "Pattern 2: when a planning document's premise about other documents is checkable, check it - the plan said three documents still say 211; measured, all three had been corrected and four of the replacements had themselves gone stale"

requirements-completed: [REVIEW-CMP-01]

coverage:
  - id: D1
    description: "A committed, dependency-free classifier that walks apps/frontend/src, keys every $effect( occurrence by path/line/column, classifies it against the RESEARCH predicate through a declared precedence order, and asserts its own bucket-sum invariant"
    requirement: REVIEW-CMP-01
    verification:
      - kind: unit
        ref: "node .planning/phases/159-component-context-consolidation/classify-effects.mjs --self-test (7 behaviours)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The classifier's total assertion: equal to the true total exits 0, one below exits non-zero naming the mismatch, one above exits non-zero naming the mismatch"
    requirement: REVIEW-CMP-01
    verification:
      - kind: integration
        ref: "classify-effects.mjs --assert-total 90 -> exit 0; --assert-total 89 -> exit 1; --assert-total 91 -> exit 1, all three run against the live tree"
        status: pass
    human_judgment: false
  - id: D3
    description: "Deterministic output: two runs over an unchanged tree are byte-identical"
    verification:
      - kind: integration
        ref: "diff of two consecutive classify-effects.mjs runs -> no differences"
        status: pass
    human_judgment: false
  - id: D4
    description: "The committed 90-row census with a per-row disposition and contract-change verdict, its bucket counts summing to the row count with the arithmetic shown"
    requirement: REVIEW-CMP-01
    verification:
      - kind: automated_ui
        ref: "grep -cE '^\\| [0-9]+ \\|' 159-EFFECT-CENSUS.md -> 90; every disposition cell begins CONVERTED or RECORDED (0 exceptions); every contract cell is one of none/$bindable/public API (90 of 90)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The classifier cannot be collected by the frontend unit suite and does not move its test-file count"
    verification:
      - kind: integration
        ref: "find apps/frontend/src -name classify-effects.mjs -> 0; yarn workspace @openvaa/frontend test:unit -> exit 0, 85 files / 1564 tests, identical to the count 159-05-SUMMARY.md recorded at the preceding commit"
        status: pass
    human_judgment: false
  - id: D6
    description: "The 211 census figure has a documented home naming every location that still carries a wrong value, and a routing to an owner, without this phase editing any of those documents"
    requirement: REVIEW-CMP-01
    verification: []
    human_judgment: true
    rationale: "Whether the routing reaches the right owner, and whether the operator accepts five wrong locations being surfaced rather than fixed inside this phase, is a judgement no command asserts. The measurement behind it is verified (each cited line was read); the disposition is not."
  - id: D7
    description: "The hand-review dispositions for the four sites that pass the mechanical predicate but fail reactive safety, each with its disqualifying line quoted from the current tree"
    verification:
      - kind: manual_procedural
        ref: "per-site grep and sed quotation of the convertible-bucket line and the disqualifying line, recorded in census section 7; three of four reproduce 159-02's independently re-measured evidence"
        status: pass
    human_judgment: true
    rationale: "Reactive safety is what the classifier explicitly cannot compute - it proves shape, not safety. The evidence is measured and quoted, but the demote-or-promote call is the judgement the operator required 159-02 to re-measure rather than inherit, and the same standard applies to the fourth site recorded here for the first time."

duration: 68 min
completed: 2026-09-03
status: complete
---

# Phase 159 Plan 03: The frontend `$effect` census Summary

**A committed dependency-free classifier and a generated 90-row census whose contract is an equality between the classifier's row count and the criterion's own grep re-run at generation time, not a frozen literal - plus a measured, specific home for the 211 figure that corrects the plan's own premise about it.**

## Performance

- **Duration:** 68 min
- **Started:** 2026-09-02T20:34:00Z
- **Completed:** 2026-09-02T21:42:00Z
- **Tasks:** 2 (task 1 executed as a TDD cycle)
- **Files created:** 2 (plus one ledger append)

## Accomplishments

- **The predicate is executable.** RESEARCH's one-sentence CONVERTIBLE predicate is quoted verbatim in the script header and implemented beneath it, so the census's uniformity is inspectable rather than asserted. A reviewer who doubts a row re-runs one command.
- **The total is self-asserting, and asserts the right thing.** The script takes `--assert-total N` and the acceptance command feeds it the criterion's own grep. That equality is the invariant; the literal was only ever its proxy, which matters because the population moved from 91 to 90 inside this phase's own execution.
- **The census is 90 rows, sorted path-then-line-then-column, byte-identically reproducible.** Bucket counts sum to 90 with the arithmetic shown, and the script asserts that sum itself and throws if a bucket stops being exclusive.
- **CONTEXT O5 bullet 3 is discharged permanently by a column.** Exactly one row's `Contract change?` cell reads `public API` and nine read `$bindable`, which makes "passes the predicate" and "would need a two-way-bindable target" two visibly different facts.
- **Three inherited facts were corrected by measurement rather than repeated.** The bindable bucket is 9, not the 7 the handoff predicted; the CONVERTIBLE bucket is empty, confirming criterion 1's conversion set is closed at two; and all three documents carrying the 211 had already been corrected, four of them to a replacement set that has itself gone stale.

## Task Commits

1. **Task 1 (RED): the failing behaviour suite** - `a205cada7` (test)
2. **Task 1 (GREEN): the classifier implementation** - `068783446` (feat)
3. **Task 1 (fixes found by reading the live output): guard and nesting** - `a53bcc652` (fix)
4. **Task 2: generate the census and route the 211** - `1db757605` (docs)

## TDD Gate Compliance

Task 1 carried `tdd="true"` and ran the full cycle. RED (`a205cada7`) committed a seven-behaviour suite against stubs and was verified to exit 1 with `classifier not implemented` before any implementation existed. GREEN (`068783446`) took all seven to pass. The REFACTOR slot was used for two genuine defect fixes rather than cosmetic cleanup (`a53bcc652`), with the suite re-run green after each.

The suite lives INSIDE the committed script behind `--self-test`, not in a separate test file. That is deliberate: the plan's `files_modified` declares exactly two files, and any test file placed under a workspace would either enter that workspace's unit suite (moving the count Phase 153's gate pins) or sit uncollected and unrun. An in-file suite is runnable by anyone, ships with the thing it tests, and enters no suite.

## The three assertion behaviours, recorded verbatim as the acceptance criteria require

**The live total given to `--assert-total` was 90**, produced by `grep -rn '\$effect(' apps/frontend/src | wc -l | tr -d ' '` re-run at generation time.

```
$ node .planning/phases/159-component-context-consolidation/classify-effects.mjs --assert-total 90
EXIT=0

$ node .planning/phases/159-component-context-consolidation/classify-effects.mjs --assert-total 89
classify-effects: total assertion failed: the classifier found 90 sites but was asserted against 89. The census population moves as effects are converted or deleted, so re-run the criterion grep and pass its value.
EXIT=1

$ node .planning/phases/159-component-context-consolidation/classify-effects.mjs --assert-total 91
classify-effects: total assertion failed: the classifier found 90 sites but was asserted against 91. The census population moves as effects are converted or deleted, so re-run the criterion grep and pass its value.
EXIT=1
```

Determinism: two consecutive runs diffed with no differences.

## The measurement

Every figure re-measured at generation time. The base-commit column is the same command at `7503a4a70`, and **all five base figures reproduce exactly**, which is what makes the amended plan's set trustworthy where the second-pass set was not.

| Command | Live (`de17c32fc` frontend tree) | Base `7503a4a70` |
|---|---:|---:|
| `grep -rn '\$effect(' apps/frontend/src \| wc -l` | **90** | 91 |
| `grep -rl '\$effect(' apps/frontend/src \| wc -l` | **54** | 54 |
| `grep -rl '\$effect' apps/frontend/src \| wc -l` | **88** | 85 |
| `grep -rn '\$effect\.root(' apps/frontend/src \| wc -l` | **40** | 40 |
| `grep -rn '\$derived(' apps/frontend/src \| wc -l` | **223** | 220 |

The live set matches the orchestrator's independent cross-check at the dispatch commit exactly. The frontend tree is unchanged between `de17c32fc` and this plan's HEAD (`git diff --quiet` clean), so the measurements hold at both.

Bucket summary, summing to 90: DOC COMMENT 1, NO ASSIGNMENT 41, TEARDOWN 1, ASYNC 4, UNTRACK 5, WRITES `$bindable` PROP 9, WRITES MEMBER 17, MULTI-TARGET (2) 5, MULTI-TARGET (4) 1, CONDITIONAL 2, SECOND WRITER 2, CHILD TWO-WAY BINDING 2. That is `1 + 41 + 1 + 4 + 5 + 9 + 17 + 5 + 1 + 2 + 2 + 2 = 90`.

## Findings that correct inherited facts

**1. The `WRITES $bindable PROP` bucket holds 9, not 7.** 159-02's handoff correctly predicted that its own two `PasswordSetter` entries retire from RESEARCH's Pitfall 1 list of nine, leaving seven. The classifier finds nine, because that list omitted two real sites, both verified by reading the declaration:

- `lib/components/modal/timed/TimedModal.svelte:92` writes `timeLeft`, declared `timeLeft = $bindable(...)` at `:63`.
- `lib/candidate/components/passwordValidator/PasswordValidator.svelte:62` writes `validPassword`, declared `validPassword = $bindable(false)` at `:52`, from inside its debounce timer.

**2. The CONVERTIBLE bucket is empty.** No site in the frontend passes the mechanical predicate and survives reactive-safety review. This independently confirms 159-02's conclusion that criterion 1's conversion set is closed at two.

**3. All three of 159-02's re-measured demotions land in the two operational buckets exactly as its evidence says**, on line numbers the classifier measured for itself: `candidate/register/+page.svelte:49` (second writer at `:66`), `(voters)/(located)/questions/+layout.svelte:143` (`bind:valid` at `:269`), `(voters)/elections/+page.svelte:56` (`bind:selected` at `:96`). No promotions.

**4. A fourth hand-review site surfaced that 159-02's four-row table does not carry.** `candidate/(protected)/questions/[questionId]/+page.svelte:90` writes `status`, declared `let status = $state<ActionStatus>('loading')` at `:63` and written at eight further sites (`:159`, `:180`, `:186`, `:196`, `:204`, `:209`, `:216`, `:220`) - the save, cancel and error paths. DEMOTED on evidence measured here for the first time.

**5. The plan's premise about the 211 figure was itself stale.** The plan asked the census to state "that the 211 figure appears in three project documents". Measured at HEAD, all three have been corrected away from a bare 211, and the situation is more specific than that:

| Location | State | Needs an owner |
|---|---|---|
| `ROADMAP.md:1398` (criterion 1) | Current - the 2026-09-02 amendment, all six figures reproduce | No |
| `ROADMAP.md:1388` (the second-pass preamble directly above it) | Stale second-pass set, contradicts the criterion below it | Yes |
| `v2.15-DISCUSSION-POINTS.md:60` (fact 24) and `:95` | Stale second-pass set | Yes |
| `v2.15-DISCUSSION-POINTS.md:606`, `:618`, `:621`, `:631` | **Bare 211 survives** in the H1 heading and options (a) and (d) | Yes |
| `REQUIREMENTS.md:151` (REVIEW-CMP-01) | Stale second-pass set | Yes |

The census records this as measured, filed to `.planning/WINDOWS.md` as entry 229 so it cannot scroll out of context before ship.

## Files Created/Modified

- `.planning/phases/159-component-context-consolidation/classify-effects.mjs` - the committed classifier: filesystem walk, per-family comment and string masking, balanced-delimiter body extraction, assignment scanning with depth and guard analysis, 15-entry precedence classification, markdown and JSON renderers, total assertion, and a seven-behaviour self-test.
- `.planning/phases/159-component-context-consolidation/159-EFFECT-CENSUS.md` - the census: nine sections carrying criterion 1 verbatim, the predicate and precedence order, the five measurements live and at base, the 211 routing, the 90-row table, the bucket summary with arithmetic, the hand-review evidence, the two conversions and why they are absent, and the discretion note.
- `.planning/WINDOWS.md` - one `deviation` entry (229) recording the five still-wrong figure locations.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing ones for later plans are the equality-not-literal contract, the committed script, and the empty CONVERTIBLE bucket.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The local-`$state` and `$bindable` detectors missed TypeScript type annotations**

- **Found during:** Task 1, reading the first live-tree output against the source
- **Issue:** The detectors matched `name = $state(` with nothing between the name and the initialiser. `routes/(voters)/elections/+page.svelte:38` declares `let selected: Array<Id> = $state([]);`, so its effect at `:56` classified as `NON-LOCAL / NON-$STATE TARGET` when 159-02's independently re-measured evidence says it is a child two-way binding. A census whose rows contradict the phase's own verified evidence is worse than no census.
- **Fix:** Both detectors now match an optional annotation lazily (`(?::[^;\n]*?)?`), which also survives an arrow type such as `: (x: T) => void`.
- **Files modified:** `classify-effects.mjs`
- **Verification:** the site reclassified to `CHILD TWO-WAY BINDING (operational)`, matching 159-02's quoted `bind:selected` at `:96`; self-test green
- **Committed in:** `a53bcc652`

**2. [Rule 1 - Bug] A brace-less guard was counted as an unconditional assignment**

- **Found during:** Task 1, checking why `Term.svelte:55` reached hand review
- **Issue:** Totality was decided by brace depth alone. `if (!hovered && !focused) dismissed = false;` puts the assignment at depth 0 with no braces, so the classifier called it total. It plainly is not: on the false path `dismissed` keeps whatever `:63` or `:94` last set it to. The predicate's "on every execution path" clause was being asserted without being enforced.
- **Fix:** Totality now additionally requires that the assignment is not the single statement of a brace-less `if`/`else`/`for`/`while`/`switch`/`catch`, detected by back-scanning past a balanced condition to its keyword.
- **Files modified:** `classify-effects.mjs`
- **Verification:** `Term.svelte:55` reclassified to `CONDITIONAL SINGLE-TARGET (not total)`; hand-review set reduced from five sites to four; self-test green
- **Committed in:** `a53bcc652`

**3. [Rule 2 - Missing critical] A 16th bucket for a comment occurrence**

- **Found during:** Task 1, reconciling the classifier's population with the criterion's grep
- **Issue:** The criterion's grep counts a JSDoc mention at `lib/contexts/utils/settingsOverlay.svelte.ts:31` (`` `$effect(() => settings.push(overlay));` `` inside a doc comment). The classifier must count exactly what the grep counts in order to assert equality, but filing a comment under `NO ASSIGNMENT (call-only side effect)` would put a false claim in the census.
- **Fix:** `DOC COMMENT (not a runtime site)` added at precedence 1, with per-file-family comment masking to detect it. The `.svelte` masker deliberately does not tokenize markup as JavaScript, because an apostrophe in prose would otherwise open a string literal and swallow the rest of the file.
- **Files modified:** `classify-effects.mjs`
- **Verification:** row 40 of the census carries the bucket; bucket sum still 90
- **Committed in:** `068783446`

**4. [Rule 3 - Blocking] The plan's "four operational buckets" is not reproducible from its own enumeration**

- **Found during:** Task 1
- **Issue:** The plan's action text says "Add the four operational buckets the mechanical predicate cannot compute" and then names two after the colon: a second writer elsewhere in the module, and a target written by a child through a two-way binding. There is no third or fourth in the sentence, in RESEARCH, or in 159-02's evidence.
- **Fix:** Implemented the two the plan enumerates, since a specific enumeration beats a count in the same sentence. Recorded here rather than silently resolved.
- **Files modified:** `classify-effects.mjs`
- **Verification:** both buckets populated (2 and 2), and all three of 159-02's demotions land in them
- **Committed in:** `068783446`

**5. [Rule 1 - Stale premise] The plan's statement about where the 211 figure lives was wrong**

- **Found during:** Task 2
- **Issue:** The plan instructs the census to "state that the 211 figure appears in three project documents - the roadmap's Phase 159 criterion 1, the milestone discussion document's fact 24, and the requirements file's REVIEW-CMP-01 line". Measured, none of those three still asserts a bare 211: all carry a correction note, and the roadmap's criterion 1 is fully current as of the 2026-09-02 amendment. Repeating the plan's sentence would have written a false claim into the phase's primary durable artifact, and would have routed an owner to a document that no longer needs the fix while missing the four that do.
- **Fix:** Section 4 of the census states the situation as measured, location by location, with the correct routing. The bare 211 survives only in the discussion document's H1 heading and option wording; four other locations carry a replacement set that has itself gone stale by one execution wave.
- **Files modified:** `159-EFFECT-CENSUS.md`, `.planning/WINDOWS.md`
- **Verification:** every cited line number read at HEAD before it was written down
- **Committed in:** `1db757605`

---

**Total deviations:** 5 auto-fixed (2 classifier bugs, 1 missing critical bucket, 1 blocking plan-text ambiguity, 1 stale plan premise)
**Impact on plan:** All five were necessary. Two of them are the plan's own instrument working as intended - "re-measure every line number before you cite it" caught defects 1, 2 and 5. No scope creep: the plan's two declared artifacts are the only files this plan wrote, verified by `git diff --name-only de17c32fc..HEAD`.

## Prohibitions

Both plan prohibitions were carried with `verification: flagged-unverified`. Both are now verified.

- **"The classifier script is not placed anywhere under `apps/frontend/src`."** `find apps/frontend/src -name 'classify-effects.mjs'` returns 0 matches. `yarn workspace @openvaa/frontend test:unit` exits 0 at 85 files / 1564 tests, identical to the count `159-05-SUMMARY.md` recorded at the preceding commit.
- **"No plan in this phase edits ROADMAP.md, REQUIREMENTS.md or the milestone discussion document to correct the 211 figure."** Holds. This plan wrote only its two artifacts. Every sibling `docs(159-0X)` commit that touched `ROADMAP.md` changed only the progress-table row - `git show <c> -- .planning/ROADMAP.md | grep -c 'census\|211\|effect('` returns 0 for all five. **One honest qualification:** commit `87ada4278` DID edit ROADMAP criterion 1's figures, but it is the operator's own 2026-09-02 amendment, not a plan of this phase, and it is the reason criterion 1 is the one location in the table above that needs no owner.

## Issues Encountered

None that blocked. The classifier's first live-tree pass produced three rows that contradicted 159-02's verified evidence; reading each against the source rather than trusting the bucket found two real defects and confirmed the third row was correct. That is the intended use of a census whose evidence has already been independently measured.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 159-07 (the criterion-5 context extraction) and 159-11 (the phase gate), with four things they can rely on.

1. **The census is re-runnable and will move.** 159-07 extracts the duplicated rollup from `candidateContext.svelte.ts:274` and `voterContext.svelte.ts:355` - the classifier's own measured anchors, both moved from the `:355`/`:467` that CONTEXT.md cites. Any effect it removes changes the census total, and the artifact is regenerated by one command rather than re-derived.
2. **The census carries live line numbers, not inherited ones.** Every anchor in the 90-row table was measured at generation time. Both criterion-5 rollup sites are filed as `WRITES MEMBER / EXTERNAL OBJECT` (writes to `this.#infoQuestionCategories`), which is the correct record-not-convert disposition for them.
3. **No E2E run was consumed.** This plan wrote a script and a document under `.planning/` and touched no runtime surface, so the single full-suite run CONTEXT O5 budgets remains available to 159-11. The frontend unit suite was run twice and is green at 85 files / 1564 tests.
4. **One open item is routed, not closed.** `.planning/WINDOWS.md` entry 229 records the five locations still carrying a wrong effect-census figure. The verify step owns routing it; the census's section 4 is its evidence.

## Self-Check: PASSED

- `.planning/phases/159-component-context-consolidation/classify-effects.mjs` - FOUND
- `.planning/phases/159-component-context-consolidation/159-EFFECT-CENSUS.md` - FOUND
- Commit `a205cada7` - FOUND
- Commit `068783446` - FOUND
- Commit `a53bcc652` - FOUND
- Commit `1db757605` - FOUND
- Plan `<verification>` re-run at HEAD: classifier `--assert-total 90` exits 0; `grep -cE '^\| [0-9]+ \|' 159-EFFECT-CENSUS.md` returns 90; the criterion grep re-run at generation time returned 90 and the census states so; `yarn workspace @openvaa/frontend test:unit` exits 0 with an unchanged 85-file count.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-03*
