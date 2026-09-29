---
phase: 144-seed-template-strict-typing-unknown-prop-guard
plan: "03"
subsystem: testing
tags: [dev-seed, supabase, link-sentinels, negative-control, derivation, refactor, golden-output]

requires:
  - phase: 144-seed-template-strict-typing-unknown-prop-guard
    provides: "144-02 — LINK_SENTINELS (4 rules / 10 pairs), the four-source permitted-key declaration, resolveCollectionName as the one canonical-keying primitive, and row L's type half"
provides:
  - "packages/dev-seed/src/template/linkSentinels.ts — LinkPlanEntry, planLinks, pickCollection, firstDeclaredKey and sentinelKeysFor; all pure, no Supabase import"
  - "A linkJoinTables that ITERATES planLinks(data) and dispatches through join / jsonb arms plus a never-typed exhaustiveness arm; the four hand-written resolution blocks are deleted"
  - "packages/dev-seed/src/template/collectionNames.ts — COLLECTION_MAP + resolveCollectionName extracted to a leaf module to break an ESM cycle; permittedKeys re-exports both"
  - "A hasDeclaredScope driven by LINK_SENTINELS' own key lists, closing the _constituency_groups override hole and the bare-elections phantom"
  - "packages/dev-seed/tests/template/linkSentinels.test.ts — 17 cases: the six behaviour-preservation properties, the hand-enumerated derivation case, the must-NOT-fire control and the D-01 legality case"
  - "Ledger rows DRV-NEW (RED (catch), revert proven three ways) and L's plan half; residue entries RES-10 and RES-11 with the does-not-guarantee clause"
affects: [144-04, 144-05, 144-06, 144-07]

actuals:
  tokens: 19278
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Declaration-as-control-flow: the array that PERMITS a pair is the array the resolver ITERATES, so 'permitted but unhandled' is structurally impossible rather than test-enforced"
    - "Golden-output equality taken BEFORE the first edit, from a local transcription of the pre-rewrite logic, as the regression guard for a rewrite that must change no byte"
    - "Hand-enumerated expectation against a const the fixture is BUILT from — catches growth and shrinkage in one assertion, and is non-tautological by construction"
    - "Leaf-module extraction to break an ESM cycle without duplicating the primitive, with the original module re-exporting so no import path changes"
    - "Budget a newly-visible prototype helper by explicit count rather than allow-listing it"

key-files:
  created:
    - packages/dev-seed/src/template/collectionNames.ts
    - packages/dev-seed/tests/template/linkSentinels.test.ts
  modified:
    - packages/dev-seed/src/template/linkSentinels.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/pipeline.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/tests/integration/default-template.integration.test.ts
    - .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "COLLECTION_MAP + resolveCollectionName extracted to a leaf module collectionNames.ts — permittedKeys already consumes LINK_SENTINELS at module-evaluation time, so importing it back from linkSentinels would TDZ-throw on entry through linkSentinels (which every spec does)"
  - "firstDeclaredKey walks keys per-key rather than reproducing the original's grouped `??` read of the two underscore forms — one unreachable edge case differs, stated below rather than glossed"
  - "An empty id list is a no-op on a jsonb target but STILL emits an entry on a join target, because the original resolved the parent UUID before iterating zero references"
  - "The three external-id lookup failure messages are held as three separate literals, not one interpolated noun, so triage greps still find each verbatim"
  - "The integration test's three newly-visible link helpers are BUDGETED by explicit count, not allow-listed — an N+1 in the link pass now fails at the pass that owns it"
  - "Sentinel pair count re-derived here at 10, agreeing with 144-02 and with CONTEXT B-4 as corrected"

patterns-established:
  - "A derivation helper that THROWS on a lookup miss, because an empty result would make the guard suppress nothing and silently fan out"
  - "Provenance written to stderr so two captures are byte-comparable on stdout and `diff` is the whole assertion"

requirements-completed: [TMPL-01, TMPL-02]

coverage:
  - id: D1
    description: "linkJoinTables iterates LINK_SENTINELS through a pure planLinks; the four hand-written resolution blocks are gone and a new LinkTarget kind is a compile error"
    requirement: "TMPL-02"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/linkSentinels.test.ts (17 cases; log vt-03-t3-spec.log)"
        status: pass
      - kind: integration
        ref: "grep gate — planLinks exported once, zero supabase-js / supabaseAdminClient references in linkSentinels.ts, ': never' present in supabaseAdminClient.ts"
        status: pass
      - kind: integration
        ref: "TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed (log tc-03-t1.log) => exit 0, 7 successful / 0 cached"
        status: pass
    human_judgment: false
  - id: D2
    description: "The rewrite changed no seeded link — golden capture taken before the first edit, diffed empty after Task 1 and again after Task 2"
    requirement: "TMPL-02"
    verification:
      - kind: integration
        ref: "diff ${TMPDIR}/gsd-144/golden-before-1.log ${TMPDIR}/gsd-144/golden-after-1.log => exit 0"
        status: pass
      - kind: integration
        ref: "diff ${TMPDIR}/gsd-144/golden-before-1.log ${TMPDIR}/gsd-144/golden-after-attach-1.log => exit 0"
        status: pass
      - kind: integration
        ref: "diff <(tail -n +2 golden-before-0-preedit.log) golden-before-1.log => exit 0 — the re-run equals the authentic pre-edit capture"
        status: pass
    human_judgment: false
  - id: D3
    description: "All six behaviour-preservation properties honoured, each with its own case"
    requirement: "TMPL-02"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/linkSentinels.test.ts#1./1b./2./2b./3./4./5./5b./6./6b. (10 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "camelCase collection keys still accepted, resolving to one canonical entry read once"
    requirement: "TMPL-02"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/linkSentinels.test.ts#collection-key aliasing survives + #a collection supplied under BOTH forms is read once"
        status: pass
    human_judgment: false
  - id: D5
    description: "hasDeclaredScope consumes the const's key lists; both R7.4 defects closed with exploitation re-measured at zero across all 30 built-ins"
    requirement: "TMPL-02"
    verification:
      - kind: integration
        ref: "${TMPDIR}/gsd-144/defects.mts over BUILT_IN_TEMPLATES => defect1=0 defect2=0, templates=30"
        status: pass
      - kind: unit
        ref: "packages/dev-seed tests/pipeline.test.ts (within the 45-file / 479-test dev-seed run, log vt-03-t2.log)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Row DRV-NEW is RED (catch) under the same pair DRV-OLD was GREEN (blind) under, with the revert proven three ways"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit tests/template/linkSentinels.test.ts with elections/_constituencies injected (log vt-DRV-NEW-1.log) => exit 1, 3 failed / 14 passed (17)"
        status: pass
      - kind: integration
        ref: "git diff --exit-code + git hash-object 012ebdaa758779a512ce678a28a2258840d3dd04 + clean git status; re-run 17/17 (log vt-DRV-NEW-restored-1.log)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Row L completed on both halves — the probe compiles clean under the strict row types AND planLinks emits exactly one election_ids entry"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/linkSentinels.test.ts#D-01 legality: questions._elections IS still read, and targets the election_ids jsonb column (log vt-L-plan-1.log)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Repository-wide gates green at plan close"
    verification:
      - kind: unit
        ref: "yarn test:unit (log vt-03-close.log) => 25 successful, dev-seed 483 passed"
        status: pass
      - kind: integration
        ref: "TURBO_FORCE=true npx turbo run typecheck (log tc-03-close.log) => 22 successful / 0 cached"
        status: pass
      - kind: integration
        ref: "yarn lint:check and yarn format:check => exit 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "The one deliberate behavioural divergence from the pre-rewrite `??` chain, and whether the golden capture's two-template corpus is an adequate guard for it"
    verification: []
    human_judgment: true
    rationale: "firstDeclaredKey walks the rule's keys one at a time; the original grouped `_constituencyGroups ?? _constituency_groups` into a SINGLE object read before normalising. They differ for exactly one input — an elections row carrying BOTH underscore forms where the first has no id array — which the rewrite now resolves from the second form and the original dropped. That input is unreachable in-tree (zero `_constituency_groups` occurrences across all 30 built-ins, re-measured in Task 2) and the golden corpus is e2e/base + default only, so no measurement covers it. A human should decide whether the more-correct generalisation is acceptable or whether byte-faithfulness to the grouped read was the contract."
  - id: D10
    description: "The full Playwright E2E suite was NOT run in this plan"
    verification: []
    human_judgment: true
    rationale: "This plan restructures a live write path. Its primary control is the golden equality check plus the dev-seed integration test, which seeds the DEFAULT template against the live local Supabase and passes — including three new explicit round-trip-count assertions on the link pass. But the golden corpus covers two of thirty built-in templates, and the 28 perm-* templates (which are the ones the E2E suite actually seeds, and which carry all 76 bare-form rows) are covered only by the argument that they exercise the same four rules. 144-06 owns the E2E gate; a human should decide whether it must run before 144-04 rather than at 144-06."

duration: 25 min
completed: 2026-08-23
status: complete
---

# Phase 144 Plan 03: The const-driven link resolver Summary

**`linkJoinTables` no longer hard-codes four resolution blocks beside `LINK_SENTINELS` — it iterates the const through a pure, database-free `planLinks`, so a `(collection, key)` pair cannot be permitted without being resolved; and the same pair that a reconstructed parallel list swallowed silently now turns a hand-enumerated derivation spec red, with a golden capture taken before the first edit proving not one seeded link changed.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-23T15:05:00Z
- **Completed:** 2026-08-23T15:30:00Z
- **Tasks:** 3
- **Files created:** 2 · **modified:** 6

## Accomplishments

- **Criterion 4 is now a property of the control flow.** `planLinks` iterates `LINK_SENTINELS`; the four hand-written blocks are deleted. The two-run control demonstrates both directions in one run: adding `elections/_constituencies` to the const made the resolver dispatch it immediately (the must-NOT-fire case fired), and the hand-enumerated expectation refused it (two more reds). `DRV-OLD` was GREEN under the identical pair against a parallel list.
- **The rewrite changed nothing.** Three golden captures, all byte-identical.
- **Two latent defects closed at zero cost**, both re-measured at zero exploitation here rather than cited, with the does-not-guarantee clause stated on the ledger's face.
- **A new `LinkTarget.kind` is a compile error**, not a silent runtime miss.

## Task Commits

1. **Task 1 (RED): failing planLinks behaviour-preservation spec** — `c52e730be` (test)
2. **Task 1 (GREEN): linkJoinTables iterates LINK_SENTINELS via planLinks** — `3ab2ecc93` (feat)
3. **Task 2: hasDeclaredScope driven by the const; two defects closed; residue** — `4bd038701` (fix)
4. **Task 3: hand-enumerated derivation spec** — `69b1ff1e6` (test)
5. **Task 3: ledger rows DRV-NEW and L's plan half** — `0ebb4dab0` (docs)

**Plan metadata:** see the final `docs(144-03)` commit.

## The golden captures — all three, with the exact commands

The baseline was taken at HEAD `803001471`, **before the first byte of `linkJoinTables` changed**, by a scratch ESM script (`${TMPDIR}/gsd-144/golden.ts`) that runs `runPipeline` + `fanOutLocales` for `e2e/base` and `default`, mirrors `Writer.write`'s payload shaping, and plans the links using a **local transcription** of the pre-rewrite `linkJoinTables` logic. Because that transcription lives in the script, it cannot be a snapshot of the rewrite. **27 tuple lines: 19 for `e2e/base`, 6 for `default`** — covering both bare non-underscore forms, both underscore forms, both join targets and both jsonb targets.

| # | When | Command | Result |
|---|---|---|---|
| 1 | After Task 1 (the `planLinks` rewrite) | `diff "${TMPDIR:-/tmp}/gsd-144/golden-before-1.log" "${TMPDIR:-/tmp}/gsd-144/golden-after-1.log"` | **exit 0** — no output |
| 2 | After Task 2 (the `hasDeclaredScope` change) | `diff "${TMPDIR:-/tmp}/gsd-144/golden-before-1.log" "${TMPDIR:-/tmp}/gsd-144/golden-after-attach-1.log"` | **exit 0** — no output |
| 3 | Faithfulness of the re-run baseline | `diff <(tail -n +2 "${TMPDIR:-/tmp}/gsd-144/golden-before-0-preedit.log") "${TMPDIR:-/tmp}/gsd-144/golden-before-1.log"` | **exit 0** — no output |

**Why capture 3 exists — stated rather than buried.** The first baseline carried a one-line provenance header naming the planner, which by construction differs between the two modes and made the criterion's `diff` exit 1 on that line alone. The header was moved to **stderr** and both captures re-taken. The authentic pre-edit artifact was **preserved untouched** as `golden-before-0-preedit.log`, and capture 3 proves the re-run baseline equals it line for line. So the compared baseline is not merely asserted to be the pre-edit behaviour — it is diffed against the artifact that was measured before the first edit.

## The six behaviour-preservation properties and the case covering each

All in `packages/dev-seed/tests/template/linkSentinels.test.ts`.

| # | Property | Case |
|---|---|---|
| 1 | First-non-nullish key precedence; sentinel forms beat bare forms | `1. first-non-nullish key precedence: the sentinel form wins over the bare form` |
| 1b | Key order inside a rule is `??`-precedence order, not cosmetic | `1b. key order inside a rule is ??-precedence order, not cosmetic` |
| 2 | Two payload normalisers, one output | `2. two payload normalisers, one output — object form and bare-array form agree` |
| 2b | A bare ref carrying neither id key is skipped, not defaulted | `2b. a bare-array ref carrying neither external_id nor externalId is skipped, not defaulted` |
| 3 | Skip on malformed, do not throw — jsonb sites included | `3. a malformed payload is SKIPPED, not thrown on — join sites and jsonb sites alike` |
| 4 | Skip on missing parent external id | `4. a row with neither externalId nor external_id is skipped, not defaulted and not thrown on` |
| 5 | An empty array is a no-op, never a column clear | `5. an empty array is a no-op on a jsonb site — never a column clear` |
| 5b | …and on a JOIN site the entry still emits, preserving the parent lookup | `5b. an empty array on a JOIN site still emits an entry — the parent lookup is preserved` |
| 6 | Rule dispatch order | `6. rule dispatch order is preserved: elections → cgs → _elections(cat, qu) → _constituencies(cat, qu)` |
| 6b | Plan order follows the const's array order | `6b. plan order follows LINK_SENTINELS array order — reordering the const is observable` |
| — | Collection-key aliasing (camelCase accepted, read once, canonical) | `collection-key aliasing survives…` + `a collection supplied under BOTH forms is read once, camelCase winning` |

## The re-derived pair count, beside every figure it could disagree with

Re-derived **here**, from `LINK_SENTINELS` at execution HEAD, by flattening rule × collection × key (`${TMPDIR}/gsd-144/paircount-03.log`): 4 + 2 + 2 + 2 = **10**, all distinct.

| Source | Figure | Verdict |
|---|---|---|
| **This plan, re-derived at HEAD** | **10** | — |
| `144-02-SUMMARY.md` (recorded) | 10 | ✅ agrees |
| `144-CONTEXT.md` B-4 (as corrected by row C-2) | 10 | ✅ agrees |
| `144-RESEARCH.md` R2.2 table | 10 | ✅ agrees |
| `144-RESEARCH.md` R2.2 **headline sentence** | "twelve" | ⚠ **stale — contradicts its own table below it** |
| `144-03-PLAN.md`'s own warning ("`144-CONTEXT.md` B-4 says 12") | 12 | ⚠ **stale — B-4 was corrected to 10 twice before this plan ran** |

**Both disagreements are reported, not reconciled.** Neither is a finding about the code: both are documents whose headline text was left behind when their own body was corrected. The number to use is **10** (7 `_`-prefixed + 3 bare). Nothing was adjusted to match.

## The two R7.4 defects — exploitation re-measured here

Measured by `${TMPDIR}/gsd-144/defects.mts`, which walks `BUILT_IN_TEMPLATES` **directly** rather than the pipeline output, because `attachSentinels` runs after generation and would mask an author's own declaration.

| Defect | What was measured | Count | Templates scanned |
|---|---|---|---|
| **1 — `_constituency_groups` override hole** | `elections` `fixed[]` rows carrying `_constituency_groups` | **0** | 30 |
| **2 — bare-`elections` phantom** | `question_categories` `fixed[]` rows carrying a bare `elections` key | **0** | 30 |

Both zeros agree with RESEARCH R2.4 / R7.4. Closing them therefore changes no built-in's output — and that is not an argument but the second golden diff, which is empty.

## Row `DRV-NEW`, verbatim

- **Injection:** `elections` / `_constituencies` — the **same pair** row `DRV-OLD` used — appended to `LINK_SENTINELS` as a fifth rule, transient and uncommitted.
- **HEAD:** `69b1ff1e6`. **Command:** `yarn workspace @openvaa/dev-seed test:unit tests/template/linkSentinels.test.ts`.
- **Exit:** **1**. **Vitest counts:** `Tests  3 failed | 14 passed (17)` · `Test Files  1 failed (1)`.
- **The three reds:**
  1. `flattens to exactly the hand-enumerated ten (collection, key) pairs — asserted against the CONST (RES-1)` → `AssertionError: expected [ …(11) ] to deeply equal [ …(10) ]`
  2. `planLinks dispatches exactly the hand-enumerated pairs — no more, no fewer` → the same 11-vs-10 assertion
  3. `a pair the resolver does NOT read produces no plan entry — the must-NOT-fire control` → `AssertionError: expected [ { collection: 'elections', …(5) } ] to deeply equal []`
- **Red (3) is the load-bearing one:** it shows the resolver *handling* the newly-declared pair with no other edit, which is criterion 4's structural guarantee — measured in the same run that catches the silent growth.
- **The three restore assertions, verbatim:**
  - `git diff --exit-code -- packages/dev-seed/src/template/linkSentinels.ts` → exit **0**
  - `git hash-object packages/dev-seed/src/template/linkSentinels.ts` → `012ebdaa758779a512ce678a28a2258840d3dd04`, **identical** to `git rev-parse HEAD:packages/dev-seed/src/template/linkSentinels.ts`
  - `git status --porcelain -- packages apps tests` → (empty)
- **Re-run after the revert:** `Tests  17 passed (17)`, exit **0** (`vt-DRV-NEW-restored-1.log`).

## Row `L` — the completed two-half statement

- **Type half (`144-02`, `7ca1a260d`):** the probe carrying `questions.fixed[]._elections` — both as an annotated inline literal and through `Template`'s slot — compiled **clean**, 0 diagnostics (`tc-L-type-1.log`).
- **Plan half (this plan, `69b1ff1e6`):** `planLinks({ questions: [{ external_id: 'qu-1', _elections: { externalId: ['el-1'] } }] })` returns **exactly one** entry, matching `{ collection: 'questions', key: '_elections', parentExternalId: 'qu-1', refExternalIds: ['el-1'], refTable: 'elections', target: { kind: 'jsonb', column: 'election_ids' } }` — the `election_ids` column **named** in the assertion, not implied (`vt-L-plan-1.log`, exit 0, 17/17).
- **Together:** the type layer permits the pair *and* the runtime reads it. Legal on both sides, not merely un-rejected on one.
- **Provenance per D-01a:** shipped in `4aeae0ace` — ``feat(data): promote `required` to first-class Question field + wire consumers`` (2026-06-01) — the commit where `linkJoinTables` gained its second `electionResolve` dispatch, extending `_elections` JSONB scoping from `question_categories` alone to `questions` as well.
- **Not vacuous:** row `DRV-NEW`, measured in the same window with this exact command and this exact spec file, produced 3 failures including the sibling must-NOT-fire case.

## Shared-ledger discipline (parallel wave with `144-05`)

`git diff 803001471..HEAD -- 144-NEGATIVE-CONTROL-LEDGER.md --numstat` → **43 insertions, 2 deletions**. The 2 deletions are exactly the two replaced row lines (`DRV-NEW`, `L`); the 41 net additions are exactly the `### From 144-03 — the two R7.4 defects, closed` heading and its body inside `## Residue`. **No other row, no other cell, no other section was touched.** The ledger was re-read immediately before each of the two edits. **Row-scoped placeholder count across this plan's two rows: 0.** No global count was asserted — that is `144-07`'s to derive once.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Extracted `COLLECTION_MAP` / `resolveCollectionName` to a leaf module to break an ESM cycle**
- **Found during:** Task 1
- **Issue:** `pickCollection` needs `resolveCollectionName`, which `144-02` placed in `permittedKeys.ts`. But `permittedKeys.ts` imports `LINK_SENTINELS` **and consumes it at module-evaluation time**. Importing back the other way closes a real cycle: entering through `linkSentinels.ts` — which every unit spec and the golden script does — evaluates `permittedKeys.ts` against an uninitialised `LINK_SENTINELS` and throws a TDZ `ReferenceError`.
- **Fix:** created `packages/dev-seed/src/template/collectionNames.ts` (imports nothing local) holding both symbols; `permittedKeys.ts` re-exports them. `FIELD_MAP` stayed put. Still exactly one implementation — only its address changed; every existing import path (`supabaseAdminClient.ts`, `src/index.ts`, `src/template/index.ts`, the specs) is untouched.
- **Verification:** `TURBO_FORCE=true npx turbo run typecheck` exit 0; 483 dev-seed tests pass, including `permittedKeys.test.ts`'s `resolveCollectionName` cases.
- **Committed in:** `3ab2ecc93`

**2. [Rule 3 — Blocking] Budgeted the link pass's three newly-visible helpers in the integration test**
- **Found during:** Task 1
- **Issue:** `tests/integration/default-template.integration.test.ts` spies on **every** `SupabaseAdminClient.prototype` method and fails any non-zero count not in `BUDGETED_WRITE_OPS` — by design, so "a newly introduced call cannot go uncounted". Decomposing `linkJoinTables` surfaced `resolveExternalId` (12), `upsertJoinRows` (2) and `updateJsonbRefs` (4). The budget was working correctly; Task 1's `test:unit` acceptance criterion could not pass without addressing it.
- **Fix:** added the three to `BUDGETED_WRITE_OPS` **and** gave each an explicit count assertion derived from the template's own row counts, so they are budgeted rather than exempted. An N+1 in the link pass now fails at the pass that owns it instead of hiding inside a single `linkJoinTables` tick.
- **Verification:** the integration test seeds the `default` template against the live local Supabase and passes; counts are exactly the round-trips the pre-rewrite code made.
- **Committed in:** `3ab2ecc93`

**3. [Rule 2 — Missing Critical] Created the spec file in Task 1 rather than Task 3**
- **Found during:** Task 1
- **Issue:** Task 1 is `tdd="true"` with a `<behavior>` block, but its `<files>` listed only two source files; the plan assigned `tests/template/linkSentinels.test.ts` to Task 3. A TDD task with no test file has no RED gate.
- **Fix:** created the file in Task 1 with the 13 behaviour-preservation cases (genuine RED: `planLinks is not a function`, 13/13 fail, `c52e730be`), and Task 3 appended its 4 criterion-4 cases to the same file. Both tasks' acceptance criteria are satisfied.
- **Committed in:** `c52e730be` / `69b1ff1e6`

**4. [Rule 3 — Blocking] Rewrote a stale line-number citation in `linkSentinels.ts`'s header**
- **Found during:** Task 1
- **Issue:** the acceptance criterion `grep -c 'supabaseAdminClient' linkSentinels.ts` must return **0** (proving the pure module names nothing of the I/O module). One inherited doc line cited `supabaseAdminClient.ts:430` / `:485` etc. — line numbers this very rewrite invalidated.
- **Fix:** replaced with an identifier-and-commit citation naming `829ccf979`, per the plan's own `<hygiene_loop>` rule 1 ("locate code by identifier, never by line number").
- **Committed in:** `3ab2ecc93`

**5. [Rule 3 — Blocking] Moved the golden script's provenance header to stderr**
- **Found during:** Task 1
- **Issue:** the criterion requires `diff golden-before-1.log golden-after-1.log` to exit **0**, but the header names the planner and therefore differs by construction.
- **Fix:** provenance to stderr (`*.provenance.log`); the authentic pre-edit artifact preserved as `golden-before-0-preedit.log`; a third diff proves the re-run baseline equals it.
- **Committed in:** n/a (scratch artifacts, outside the repo)

**6. [Rule 1 — Deliberate, documented] `firstDeclaredKey` generalises the `??` chain per key**
- **Found during:** Task 1
- **Issue:** the original read `_constituencyGroups ?? _constituency_groups` into **one** object and *then* normalised, so a first underscore form present but payload-empty caused the **second** underscore form to be skipped entirely (the chain had already committed to the first object). A per-key walk — which the plan's `firstDeclaredKey` specification mandates — falls through to the second form instead.
- **Fix:** implemented the per-key walk as specified, and recorded the divergence here rather than glossing it. The input required to observe it (an `elections` row carrying **both** underscore forms, the first payload-empty) is unreachable in-tree: `_constituency_groups` appears on **0** rows across all 30 built-ins, re-measured in Task 2. Surfaced for human judgment as coverage item **D9**.
- **Committed in:** `3ab2ecc93`

**7. [Rule 1 — Bug-shaped, documented] Error-message literals: 3 lookup families kept verbatim, 2 message families now interpolate from the const**
- **Found during:** Task 1
- **Issue:** the plan requires the four `linkJoinTables:` message families verbatim. Unifying four lookup blocks into one helper would have collapsed three "failed to find" literals into one interpolated `${noun}`, defeating grep-based triage (and the `>= 4` criterion).
- **Fix:** the three lookup messages are held as three separate literals in `LINK_LOOKUP_ERRORS`, each greppable verbatim. `grep -c 'linkJoinTables: failed to'` → **6**. **Stated honestly:** the *insert* message's table name and the *update* message's column name are now interpolated from `LINK_SENTINELS` rather than written inline — unavoidable once those names come from the const, and the same shape the original already used for `${table}` in the update messages. Every message the operator sees at runtime is byte-identical.
- **Committed in:** `3ab2ecc93`

---

**Total deviations:** 7 (4 blocking, 1 missing-critical, 2 documented behavioural/verbatim divergences)
**Impact on plan:** every one was forced by the plan's own acceptance criteria or by a real ESM/test-budget constraint. No scope creep: the only files touched beyond the plan's `files_modified` list are the new leaf module the cycle required and the integration test whose budget the refactor moved.

## Issues Encountered

- **RES-1 was already closed before this plan ran, and this plan closes it again in its own file.** The upstream brief flagged RES-1 as this plan's to close. Measured: `144-02` had already landed `includes the three bare non-underscore forms — 76 in-tree rows depend on them` in `tests/template/permittedKeys.test.ts`, asserting the bare pairs against `LINK_SENTINELS` **specifically**. This plan's `flattens to exactly the hand-enumerated ten (collection, key) pairs — asserted against the CONST (RES-1)` re-closes it inside the derivation spec, where a reader looking for criterion 4's guarantee will actually find it, and the file states the mechanism (`COLLECTION_NON_COLUMNS` supplies the same pairs independently, so the union cannot see the regression). Row `DRV-NEW` proves the assertion is live: the const-specific case is one of the three reds.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **`144-04` is unblocked and its premise is now measured.** The final sentinel key set is fixed at **10** pairs and committed; row `NC` can assert its guard against a set that will not move underneath it. `144-03` landed before `144-04`, as `key_links` required.
- **`144-05` ran in parallel with no ledger contention.** Only rows `DRV-NEW`, `L` and one new `## Residue` heading were touched.
- **Open for `144-06` / `144-07`:** the full Playwright E2E suite has still not run in this phase (coverage item D10). This plan restructured a live write path; the golden corpus covers 2 of 30 built-ins and the dev-seed integration test seeds 1 of them against the live database. The 28 `perm-*` templates — which carry all 76 bare-form rows and are what the E2E suite actually seeds — are covered by argument, not measurement. `144-06` owns the gate.
- The **2026-05-23 fan-out todo stays open** and is explicitly named as such in the code comment and in the ledger's residue section.

---
*Phase: 144-seed-template-strict-typing-unknown-prop-guard*
*Completed: 2026-08-23*

## Self-Check: PASSED

All key files exist on disk (`collectionNames.ts`, `linkSentinels.test.ts`, this SUMMARY). All six
commits (`c52e730be`, `3ab2ecc93`, `4bd038701`, `69b1ff1e6`, `0ebb4dab0`, `dfe4e60b5`) resolve in
`git log --oneline --all`. All nine cited measurement logs exist and are non-empty under
`${TMPDIR:-/tmp}/gsd-144/`.
