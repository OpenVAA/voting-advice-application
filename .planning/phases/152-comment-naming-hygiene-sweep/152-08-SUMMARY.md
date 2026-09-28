---
phase: 152-comment-naming-hygiene-sweep
plan: 08
subsystem: dev-seed
tags: [sweep, judgement-pass, dev-seed, hazard-notes, behaviour-neutrality, unsatisfiable-criterion, codemod-residue-repair]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's `assert-comment-only-diff.mjs` prover, the shared `hygiene-codemod.mjs` classifier, and `152-RESIDUE-REGISTER.md`'s seven-way prefix partition"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-06's finding that the shipped gate invocation exits 2 under a caller-supplied pathspec, and that an unsatisfiable row is proven by a flip-tested comment-scoped route"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-07's memo items 10 and 11 — the gate is not a completeness test, and the register's per-plan queue is a floor"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's discharged E2E cardinal gate (150 passed / 0 failed / 0 did-not-run), which is why a comment-only plan does not re-run the suite"
provides:
  - "the dev-seed workspace swept — 208 register spans, the largest single partition in the phase, plus 24 files the queue never listed"
  - "CONTEXT.md's own worked rewrite-not-delete example reduced from a nine-line history to a five-line hazard statement, with the prototype-chain defect class intact"
  - "the guard-membership invariant from plan 152-01 surviving without its commit hash or phase attribution, assertion still passing"
  - "15 broken sentences the phase's own mechanical pass left behind, repaired"
  - "the memo-item-10 gap MEASURED at this partition: the gate sees 246 comment lines, the wider sweep finds 678 — the gate misses 64% of the work here, not a quarter"
  - "a second confirmation that .md is unowned by any plan in the phase, registered rather than decided"
affects: [152-09, 152-10, 152-11, 152-12, 152-13, 152-14, 152-15]

# Actuals (#2632)
actuals:
  tokens: 81000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "assert-once-per-replacement applier, inherited from 152-06 / 152-07: a table of [file, old, new, expectedCount] verified against the ORIGINAL text in full BEFORE any byte is written — a drifted anchor aborts the whole batch rather than applying a subset (it aborted five times here and caught five real indentation/context errors)"
    - "comment-scoped gate over the SHARED classifier as the alternate route for raw-text rows whose residue is program bytes, flip-tested 9-red / 0-green"
    - "a deliberately OVER-BROAD wide scanner (13 extra patterns beyond the nine gate rows) run to exhaustion, with every residual hit read and individually classified rather than suppressed"
    - "prefix-partition sweep: the register's span-derived per-plan file list treated as a floor, the prefix rule (`packages/dev-seed/ -> 152-08`) as the authority"

key-files:
  created: []
  modified:
    - packages/dev-seed/src/cli/resolve-template.ts
    - packages/dev-seed/src/writer.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/pipeline.ts
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/src/template/linkSentinels.ts
    - packages/dev-seed/src/generators/CandidatesGenerator.ts
    - packages/dev-seed/src/emitters/latent/project.ts
    - packages/dev-seed/tests/integration/default-template.integration.test.ts
    - packages/dev-seed/tests/ciTypecheckGate.test.ts
    - packages/dev-seed/tests/template/permittedKeys.test.ts
    - packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts
    - "… 92 more under packages/dev-seed/{src,tests}; 105 files in total"

key-decisions:
  - "The resolver's nine-line block is reduced to five lines that keep the prototype-chain hazard, the mechanism and the `Object.hasOwn` guard, and delete the six lines of past-edit narrative — D-A1's rewrite-not-delete default applied to its own named worked example."
  - "The raw occurrence gate scoped to `packages/dev-seed` CANNOT reach zero and is registered as unsatisfiable-by-construction, not restated as met: its residue is 47 describe/it titles (152-13's), 2 skip-message string literals, 4 README headings and 5 README prose lines. Proven instead by a flip-tested comment-scoped route."
  - "`packages/dev-seed/README.md` was NOT edited. The shared classifier maps `md` to an EMPTY comment family, so the prover treats every byte of a Markdown file as code. Whether the phase sweeps Markdown at all is an operator question, registered rather than settled overnight."
  - "Four source identifiers and fixture values carrying planning references (`PHASE_56_TYPE_ROTATION`, `DENIED_AT_TASK_1`, the `negctl144-` external_id namespace, one test label) were left in place: renaming any is a non-comment byte change the prover forbids with zero allow entries."
  - "15 sentences the phase's own 152-05 codemod broke were repaired as part of the sweep rather than left as visible damage — they are inside this partition and no other plan owns them."

coverage:
  - deliverable: "packages/dev-seed/src/** swept — 334 rules at 334 sites across 57 files"
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs --range df9e7b20b~1..df9e7b20b"
        status: pass
      - kind: command
        ref: "transcribed nine-row gate over packages/dev-seed/src — 0 on every row"
        status: pass
      - kind: test
        ref: "yarn workspace @openvaa/dev-seed test:unit — 49 files / 570 tests"
        status: pass
    human_judgment: false
  - deliverable: "packages/dev-seed/tests/** swept — 179 rules at 179 sites across 48 files"
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs --range d94e356ba~1..d94e356ba"
        status: pass
      - kind: test
        ref: "packages/dev-seed/tests/ciTypecheckGate.test.ts — 5/5, membership assertion passing"
        status: pass
      - kind: command
        ref: "git diff -- packages/dev-seed/tests | grep -cE '^[+-]\\s*(test|it|describe)\\(' → 0"
        status: pass
    human_judgment: false
  - deliverable: "the resolver rewrite keeps the hazard and drops the history"
    human_judgment: true
    rationale: "D-A1's own worked example. Whether the five surviving lines carry the defect class as well as the nine did is a judgement no test can make; the before/after is recorded verbatim below for a reviewer."
  - deliverable: "the guard-membership invariant survives without its citation"
    verification:
      - kind: command
        ref: "git grep -ci 'membership' -- packages/dev-seed/tests/ciTypecheckGate.test.ts → 2"
        status: pass
    human_judgment: false
  - deliverable: "the raw gate's three non-zero rows proven by an alternate route"
    verification:
      - kind: command
        ref: "comment-scoped nine-row scan over packages/dev-seed/{src,tests} → 0; flip-test 9 red / 0 green"
        status: pass
    human_judgment: true
    rationale: "The criterion as written is unsatisfiable. A reviewer must accept the substitution, not just the green."

requirements-completed: [REVIEW-HYG-02]

duration: 1h 37m
completed: 2026-08-29
status: complete
---

# Phase 152 Plan 08: Dev-Seed Workspace Sweep Summary

Swept the largest single partition in the phase — 208 register spans across 81 files, plus 24
in-partition files the span-derived queue never listed — leaving the seed pipeline explained by
its comments rather than narrated by them, with 513 rewrites and **zero deletions of a hazard
note**.

**Duration:** 1h 37m · **Tasks:** 3 · **Commits:** 3 · **Files:** 105 · **Rules/sites:** 513/513

---

## The two completeness numbers (memo item 10), measured

The phase memo instructed this plan to report both what the gate says and what the wider sweep
finds, and warned they would differ. On this partition they differ by more than anywhere yet.

| Measure, at the pre-plan baseline `df9e7b20b~1` | Comment lines |
|---|---:|
| Matched by one of the **nine gate rows** (comment-scoped) | **246** |
| Matched by the wider **memo-item-10 sweep** | **678** |
| **Lines the gate cannot see** | **432 — 64% of the work** |

152-07 measured the gap at roughly a quarter of its sites. Here it is nearly two-thirds. A plan
that had trusted the gate as its completeness test would have declared this partition clean with
432 live violations of its own stated must-have truth still in the tree.

The raw (not comment-scoped) gate at the same baseline read `phase-ref 265 / decision-id-bare 9 /
task-id 53 / milestone-ver 2` across `packages/dev-seed`.

**What the extra 432 lines were.** 152-07's registered grep found some of them; the rest needed a
scanner widened four more times as new classes surfaced. Every class below was found by reading
hits, not by predicting them:

| Form | Why the gate misses it | Example |
|---|---|---|
| `Plan 06`, `Plan 07`, `Plan 04` | `plan-number` needs a second number group (`\d+[-.]\d+`) | `help.ts:8` — *"coupling help output to Plan 06's template map"* |
| `RESEARCH`, `SUMMARY`, `CONTEXT.md`, `REQUIREMENTS.md` | document names, not ids | `ctx.ts:5` — *"Pattern A per RESEARCH"* (×62 lines) |
| `Pitfall #5`, `Pitfall 4`, `RESEARCH Pitfall 3` | a numbered item inside a planning doc | `teardown.ts:5` — *"Sequence (RESEARCH Pitfall #5)"* (×43) |
| `144-REVIEW`, `WR-02` … `WR-08` | no `phase`/`plan` keyword to anchor on | `supabaseAdminClient.ts:77` (×25) |
| `144-01`, `144-03`, `145-04`, `58-07`, `57-07` | bare `NNN-NN` plan ids | `linkSentinels.ts:40` (×110 lines, incl. genuine `file.ts:34-42` line refs) |
| `NF-01` … `NF-05`, `GEN-06a` … `GEN-06g`, `T-57-15`, `T-144-26`, `T-58-07-02` | requirement / threat ids; `[A-Z]{3,}-\d{2}` needs 3+ letters and exactly 2 digits | `writer.ts:24`, `centroids.ts:52` (×40) |
| `Task 1`, `Task 3`, `Option B`, `UAT`, `verdict` | plan-internal structure | `builtins.test.ts:28` (×26) |
| `this phase`, `the phase's fence`, `the phase re-scoped away from` | pure narrative deixis | `permittedKeys.ts:53` (×20) |
| `D-03a`, `D-01a` | `decision-id-bare` is `\bD-\d{2}\b`; a letter suffix defeats the trailing `\b` | `collectionNames.ts:2` (×4) |
| `criterion 1`, `criterion 4`, `Criterion 4` | references into a phase's criteria list | `schema.ts:54` (×9) |
| `Phase-120`, `phase-146` | `phase-ref` requires whitespace, not a hyphen | `templates/index.ts:117` (×3) |
| `refactor-doc:66-107`, `TIR4:86-90`, `TEST-INVENTORY-REFACTOR-1.md` | planning-artifact filenames unique to this tree | `base.ts:4` (×38) |
| `milestone v2.5`, `Wave 3`, `89-01 Wave 0 R8 verdict` | roadmap vocabulary | `AccountsGenerator.ts:25`, `writer.ts:87` (×4) |
| `b410d3a90`, `4aeae0ace` | bare commit hashes | `ciTypecheckGate.test.ts:103` (×2) |
| `(10)`, `(122)`-shaped parenthesised numbers | no pattern covers a naked integer | `seed.ts:8` — *"validated Template (10)"* (×8) |

**Post-sweep the wide scan reports 18 lines.** All 18 were read and classified individually: 11
are source line-number references (`ConstituenciesGenerator.ts:34-39`), 5 are item counts in
parentheses (`info (12)`, `organization (40)`), 1 is a shell command containing `--filter`, and 1
is a legitimate in-file test enumeration (`Tests 30-32`). None is a planning reference. They are
false positives of a heuristic deliberately tuned to over-report.

---

## The named worked example, verbatim

`packages/dev-seed/src/cli/resolve-template.ts:62-70`. CONTEXT.md D-A1 names this as its first
worked case and the register's § (b) gives the extent as exact.

**Before — nine lines:**

```
  // ⚠ Own-property lookup, not a bare index (`144-REVIEW` WR-06). `builtIns` is
  // a plain object literal, so `builtIns['toString']` was
  // `Object.prototype.toString` — truthy — and `--template toString` skipped the
  // "Unknown template" branch entirely. The consequence changed in THIS PHASE:
  // the value used to be returned silently, and now it reaches `validateTemplate`
  // (see the call below), which reports
  // `Template validation failed: template.: Invalid input: expected object,
  // received function` — measured — instead of the actionable message with the
  // list of built-ins.
```

**After — five lines:**

```
  // ⚠ Own-property lookup, not a bare index. `builtIns` is a plain object
  // literal, so `builtIns['toString']` resolves through the prototype chain to
  // `Object.prototype.toString` — truthy — and `--template toString` would skip
  // the "Unknown template" branch entirely, losing the actionable message that
  // lists the built-ins. `Object.hasOwn` is what prevents it.
```

Kept: the object-literal fact, the prototype-chain mechanism, the exact exploiting argument
(`toString`), the consequence (the unknown-template branch is skipped and the actionable message
is lost), and — added, because the old text left it implicit — the name of the guard that
prevents it. Deleted: `144-REVIEW`, `WR-06`, "THIS PHASE", and the six lines describing what an
earlier phase changed the failure mode *from*.

Verified: `git grep -cE '(WR-0[0-9]|[0-9]{3}-REVIEW|THIS PHASE)' -- packages/dev-seed/src/cli/resolve-template.ts` → **0**.

---

## Per-span dispositions — every surviving span of seven lines and up

Fourteen spans in this partition ran to seven comment lines or more. Every one is a **rewrite**;
none was deleted.

| File:line | Lines | Disposition | Reason |
|---|---:|---|---|
| `src/cli/resolve-template.ts:62-70` | 9 | rewrite → 5 | The named worked example. Hazard + mechanism + guard kept; past-edit narrative deleted. |
| `src/cli/resolve-template.ts:18-30` | 13 | rewrite → 5 | *"This sentence became true in Phase 144"* + ledger rows `V-OLD`/`V-NEW`/`R-6`. The live fact — built-ins are not exempt from `validateTemplate` — survives; the changelog entry does not. |
| `src/supabaseAdminClient.ts:445-452` | 8 | rewrite | The `LINK_SENTINELS` collection/target pairing hazard. Re-tensed from "that claim used to cover" to "that guarantee covers, and only because" so the `TypeError: LINK_LOOKUP_ERRORS[table] is not a function` failure mode is stated as a live consequence of widening the type. |
| `src/supabaseAdminClient.ts:86-105` | 20 | rewrite | The `answers_by_external_id` non-spelling. Both mechanisms (not a column; on neither side of the permission split) and the "worse than dead code" argument kept whole; `144-REVIEW WR-02` and `144-04` struck. |
| `src/supabaseAdminClient.ts:186-205` | 20 | rewrite | The anon-RLS `terms_of_use_accepted` hazard **and** its standing NOT-AUDITED caution — the most load-bearing note in the file. Only "the defect Phase 145 repaired" and "Phase 145 established" were rewritten, into a statement of why a defect of that shape survives a green suite at all. |
| `src/pipeline.ts:294-325` | 32 | rewrite | The derived-`fanoutKeys` argument with its two named latent defects (`_constituency_groups` override hole, bare-`elections` phantom) and the "what this does NOT derive" caution. All three kept; `⚠ 144-03`, `CONTEXT.md permits`, `RESEARCH R2.4 / R7.4` and the dated todo struck. |
| `src/generators/CandidatesGenerator.ts:127-140` | 14 | rewrite | The `row.organization` forwarding argument and the `rows[0]`-carries-no-`organization` invariant. Kept verbatim in substance; "Interpretation Note (2026-04-22 revision)" and three `see phase 56/57` struck. |
| `src/generators/CandidatesGenerator.ts:10-36` | 27 | rewrite | The seam contract and the full-question-rows pipeline contract. Both are live; `Plan 07` ×4, `the.3 "prior-entity ref map"` and `see phase 56/57` struck. |
| `src/template/permittedKeys.ts:713-721` | 9 | rewrite | The `Set.prototype.add.call` escape-hatch hazard and why `#values` closes it. Re-tensed from "the constructor used precisely that escape hatch" to a conditional, so the note explains the current design instead of narrating a fix. |
| `src/template/linkSentinels.ts:136-149` | 14 | rewrite | The union-not-interface pairing hazard. Same re-tensing. |
| `src/emitters/latent/project.ts:9-22` | 14 | rewrite | Per-type dispatch table. `S-2` / `S-4` sub-step labels and `see phase 56 parity` struck; the dispatch semantics untouched. |
| `tests/ciTypecheckGate.test.ts:1-31` | 31 | rewrite | The step-ordering hazard, and why a text-level spec lives in this package. See below. |
| `tests/ciTypecheckGate.test.ts:89-104` | 16 | rewrite | The comment-hygiene link's membership invariant. See below. |
| `tests/integration/default-template.integration.test.ts:1-83` | 83 | rewrite | The whole header: the CI-job wiring, the wall-clock-versus-operation-budget argument with its 23630 ms measurement, the teardown strategy, and the 300 s hang-guard derivation. Every measurement kept; `see phase 136 plan 03 / F5`, `see phase 135`, `Plan 07`, `Plan 09`, `NF-01` ×6 and three dates struck. |
| `tests/integration/default-template.integration.test.ts:87-160` | 74 | rewrite | Both halves of the guard-of-the-guard, including the "a did-not-run is a failure" cardinal-rule statement. Kept whole. |
| `tests/fixtures/negctl-*.ts` headers | 4 × ~45 | rewrite | The BYTE-FROZEN warning restated as a property of the control ("the two halves must differ ONLY by the tree, so this file is byte-frozen at this exact path") rather than as a citation of the plan pair that consumed it. The freeze survives the loss of the ledger row names. |

---

## The guard-membership invariant (plan 152-01's assertion)

The plan singled this out as a comment that must be **rewritten, not deleted**, and required the
membership wording to survive.

**Before:** *"Asserting instead that this link comes LAST is what made the sibling `yarn
typecheck` assertion above fail the moment Phase 147 appended its two scan guards — a correct
change the over-specified assertion had no business rejecting (b410d3a90). Do not reintroduce
that shape here."*

**After:** *"Asserting instead that this link comes LAST is what makes the sibling `yarn
typecheck` assertion above fail the moment anything new is appended to the chain — a correct
change an over-specified assertion has no business rejecting. Do not reintroduce that shape
here."*

The tense change is the point: the invariant now warns about any future append, not only the one
that happened. `Phase 147` and the commit hash are gone; the prohibition is stronger, not weaker.

- `git grep -ci 'membership' -- packages/dev-seed/tests/ciTypecheckGate.test.ts` → **2** (criterion asks for ≥1).
- `npx vitest run tests/ciTypecheckGate.test.ts` → **5 passed**, including
  *"keeps `yarn assert:comment-hygiene` a blocking link of lint:check"*.

Its sibling paragraph — *"Eleven phases (153-164) write new comments after the sweep"* — is now
*"Every comment written after the sweep can reopen the class"*: a claim that does not expire when
the phase numbering does.

---

## Verification

Run the prover over the **sweep range** `df9e7b20b~1..HEAD`; it spans only the two refactor
commits at the time it was run.

| Check | Result |
|---|---|
| `assert-comment-only-diff.mjs --range df9e7b20b~1..HEAD` | **105 files compared, 0 allowed by name, 0 violations, exit 0** |
| — per task: `df9e7b20b~1..df9e7b20b` | 57 compared, 0 allowed, 0 violations |
| — per task: `d94e356ba~1..d94e356ba` | 48 compared, 0 allowed, 0 violations |
| transcribed nine-row gate over `packages/dev-seed/src` | **0 on every row**, `milestone-ver` 0 |
| transcribed nine-row gate over `packages/dev-seed/tests` | `decision-id-bare` 9, `task-id` 49 — **unsatisfiable, see below** |
| transcribed nine-row gate over `packages/dev-seed` (whole) | + `phase-ref` 5 — all five in `README.md` |
| **comment-scoped** nine-row gate over `src` + `tests` | **0 on every gated row** |
| — flip-test | injecting one token of each class into one comment turns **all 9 rows red**; reverting returns **0** |
| wide memo-item-10 sweep, post | 18 lines, all read and classified as false positives |
| out-of-partition paths in the plan diff | **0** |
| register-queue files missing from the diff | **0** (all 81) |
| in-partition files the queue never listed, swept anyway | **24** |
| `describe`/`it`/`test` title lines changed | **0** |
| `export`/`const`/`function`/`import`/`type`/`interface` lines changed | **0** |
| `yarn workspace @openvaa/dev-seed test:unit` | **49 files / 570 tests passed** — identical before and after |
| `node scripts/assert-unit-test-coverage.mjs` | **exit 0** — 0 violations, 11 workspaces executed |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files scanned, 0 violations |
| `yarn lint:check` | **exit 0** — 22 tasks successful, svelte-check 0 errors / 0 warnings, all three repo guards 0 violations |
| `npx prettier --check packages/dev-seed/{src,tests}` | clean |

**The E2E suite was not re-run**, per the plan's own `<verification>` and the phase memo: the
change is comment-only and `assert-comment-only-diff.mjs` with zero allow entries is the stronger
guarantee for a comment-only diff. 152-05 discharged the phase's cardinal gate at 150 passed /
0 failed / 0 flaky / 0 did-not-run, and the prover confirms this plan changed nothing the suite
can observe. The dev-seed integration tier — which DOES touch the live database — ran green as
part of the workspace suite, twice.

---

## Deviations from Plan

### 1. [Rule 2 — missing critical scope] The gate invocation the plan specifies does not exist

`bash …/hygiene-grep-report.sh -- packages/dev-seed` exits **2**. The shipped script rejects any
`-*` token and hardcodes `-- apps/ packages/ tests/` at every call site, with its own header
saying `SCOPE IS LOAD-BEARING`. Per memo item 2 the script was **not modified**; the nine patterns
were transcribed under a caller-supplied pathspec instead, same verdict rule (`occ = 0` on all but
`milestone-ver`). Already registered as **WINDOWS 81**.

### 2. [Rule 2 — missing critical scope] 24 in-partition files the register queue never listed

Memo item 11, third confirmation. The register's 81-file queue is span-derived from the nine gate
patterns; the ownership rule is a prefix partition. 24 files under `packages/dev-seed/` carry
planning references no gate pattern matches and so never entered the queue — the entire
`tests/latent/` suite, seven `tests/generators/` specs, `tests/utils.ts`,
`src/emitters/latent/{dimensions,positions,spread}.ts`, `src/cli/help.ts`,
`src/templates/_helpers/buildMinimal.ts`, two `src/templates/defaults/*-override.ts`, and
`src/templates/e2e/perm/perm-analytics-tracking.ts`. All swept. **WINDOWS 89.**

### 3. [Rule 1 — bug] 15 sentences broken by the phase's own mechanical pass

152-05's codemod left dangling prepositions and orphaned punctuation where it stripped a citation
mid-sentence. All 15 are inside this partition and no other plan owns them, so they were repaired
as part of the sweep:

| File:line | Before | After |
|---|---|---|
| `src/writer.ts:22` | `→ \`linkJoinTables\` (the three-pass sequence per).` | `→ \`linkJoinTables\`, the three-pass sequence.` |
| `src/writer.ts:24` | `* / NF-02: the constructor reads` | `* Env enforcement: the constructor reads` |
| `src/writer.ts:32` | `* / NF-05 rollback semantics:` | `* Rollback semantics:` |
| `src/writer.ts:39` | `This is acceptable\n * per: generators pre-validate` | `That is acceptable\n * because generators pre-validate` |
| `src/writer.ts:85` | `* / NF-02: THROWS if` | `* THROWS if` |
| `src/writer.ts:183` | `single PL/pgSQL transaction per).` | `one PL/pgSQL transaction).` |
| `src/ctx.ts:56` | `NOT on ctx, per. \`buildCtx\` leaves` | `NOT on ctx. \`buildCtx\` leaves` |
| `src/emitters/latent/dimensions.ts:11` | `Precedence (all fields optional per):` | `Precedence (every field is optional):` |
| `src/emitters/latent/gaussian.ts:28` | `across runs per).` | `across runs).` |
| `src/emitters/latent/latentEmitter.ts:38` | `* / GEN-06g public entry: build` | `* Public entry: build` |
| `src/emitters/latent/positions.ts:6` | `closure-cached by the \`latentAnswerEmitter\` shell (` | `closure-cached by the \`latentAnswerEmitter\` shell.` |
| `src/emitters/latent/spread.ts:7` | `locks: default \`0.15\`, scalar override only` | `Default \`0.15\`, scalar override only` |
| `src/generators/FeedbackGenerator.ts:18` | `Writer routing (Plan 07 per): not in` | `Writer routing: \`feedback\` is not in` |
| `src/generators/NominationsGenerator.ts:158` | `in-memory ref validation per.3.` | `In-memory ref validation.` |
| `src/template/types.ts:116` | `* - — latent\n *   block semantics` | `* - \`./schema.ts\` — the latent block's semantics` |
| `src/assertKnownRowProps.ts:2` | `guard (Phase 144,\n *` | `guard.\n *` |
| `src/templates/e2e/base.ts:39` | `(single-locale e2e per).` | *(swept with the surrounding rewrite)* |
| `src/template/schema.ts:12` | `Every field is \`.optional \` per — a \`{}\`` | `Every field is \`.optional()\` — a \`{}\`` |
| `src/cli/seed.ts` / `src/templates/index.ts` | `apply — see ElectionsGenerator.ts` fragments | left where they read as legitimate cross-references |

### 4. [Rule 2 — missing critical scope] The wide sweep required four rounds of widening

The scanner started with 152-07's registered eight forms. Four classes surfaced only by reading
the residue and were added mid-plan: planning-artifact filenames (`refactor-doc`, `TIR4`,
`TEST-INVENTORY-REFACTOR-1.md`), requirement/threat ids with two-letter prefixes (`NF-04`,
`T-57-15`) or letter suffixes (`GEN-06a`), plan-internal structure (`Task 1`, `Option B`), and
bare `NNN-NN` plan ids. The `D-\d{2}[a-z]` form (`D-03a`, `D-01a`) defeats the gate's own
`decision-id-bare` pattern because the letter suffix removes the trailing word boundary — worth
knowing for 152-09 … 152-12.

### 5. [Recorded, not fixed] Four non-comment planning references left in place

`PHASE_56_TYPE_ROTATION` (a module-local const), `DENIED_AT_TASK_1` (a test-local const), the
`negctl144-` external_id namespace across four fixture files, and the test label
`'snake (144-01, byte-frozen)'`. Renaming any of them is a non-comment byte change the prover
forbids with zero allow entries, and the plan prohibits changing fixture values and exported names
outright. **WINDOWS 91.**

**Total deviations:** 2 scope expansions, 1 bug class repaired (15 sites), 2 recorded-not-fixed.
**Impact:** the two scope expansions are the consequential ones — without them this plan would
have reached a green gate with 432 live violations of its own stated must-have truth.

**Commit-message counts:** measured from the applier's own tables **before** the messages were
written, following 152-07's precedent. `df9e7b20b` says 334 rules / 334 sites / 57 files
(measured: 334 / 334 / 57). `d94e356ba` says 179 / 179 / 48 (measured: 179 / 179 / 48). **No
correction needed** — the second plan in this phase for which that is true.

---

## Unsatisfiable acceptance criteria, reported not engineered around

Two of the plan's criteria require the retargeted gate, scoped to `packages/dev-seed`, to report
zero on every gate row. It cannot, and the reason is that its residue is **program bytes and
Markdown prose** — exactly the class memo item 4 forbids touching.

**Row `task-id` — 53 occurrences across 24 files, floor 53:**
47 are `describe` / `it` titles (`GEN-04` ×18, `GEN-08` ×4, `TMPL-07` ×5, `TMPL-09` ×4, `TMPL-02`
×4, `TMPL-03` ×3, `ASSERT-04` ×2, `CLI-04` ×2, `CLI-03`, `GEN-09`, `GEN-10`, `TMPL-08`). This
plan's own prohibition assigns title renames to **152-13**. 2 are inside a vitest skip-message
string literal (`default-template.integration.test.ts:180,190`). 4 are Markdown headings and prose
in `README.md`.

**Row `decision-id-bare` — 9 occurrences, floor 9:** all nine are `describe` / `it` titles
(`D-01`, `D-04` ×3, `D-07` ×4, `D-09`).

**Row `phase-ref` — 5 occurrences, floor 5:** all five are `README.md` prose.

Each is doubly out of bounds: `assert-comment-only-diff.mjs` with zero allow entries forbids
changing any non-comment byte, and the shared classifier maps `md` to an **empty comment family**,
so every byte of a Markdown file is code to the prover.

**The alternate route, named and flip-tested.** The same nine patterns, run through the shared
classifier's `commentSpans()` so only comment text is examined, over
`packages/dev-seed/{src,tests}`: **0 on every gated row**. A gate that examines nothing also
reports green, so it was flip-tested rather than trusted — injecting one token of each of the nine
classes into a single comment in `tests/utils.ts` turns **all nine rows red**; reverting returns
**0**, with a clean working tree afterwards.

Registered as **WINDOWS 88**.

---

## An operator question, deliberately not decided

`packages/dev-seed/README.md` sits inside this plan's prefix partition and carries 5 `phase-ref`
occurrences and 4 `task-id` occurrences. It was **not edited**, and the decision to leave it is
deliberately provisional:

- The register records the disposition verbatim: *"A Markdown file is prose end to end, so the
  classifier's everything-outside-a-span-is-untouched safety argument does not hold. Routed whole
  to the judgement pass."*
- The seven-way partition enumerates 282 files, every one of which carries comment spans. No plan
  in phase 152 declares ownership of Markdown prose.
- The four `task-id` occurrences (`TMPL-03` ×2, `GEN-04`, `TMPL-09`) are **cross-references to the
  very unit-test titles 152-13 is still deciding about**. Stripping them here would pre-empt that
  decision from the wrong end.

This has the shape memo item 12 describes, so it is registered rather than settled overnight:
**does the phase sweep `.md` prose at all, and if so under which plan and against which prover?**
Registered as **WINDOWS 90**.

---

## Known Stubs

None. No stub, placeholder or TODO was introduced; no test was skipped; every `<verify>` in the
plan was run and its result is in the table above.

## Issues Encountered

None blocking. Four items registered in `.planning/WINDOWS.md` as entries **88–91**.

## Next Phase Readiness

Ready for `152-09` (the remaining `packages/**` workspaces, 13 spans across 6 files — the smallest
partition in the phase). Three carry-forwards it should read first:

1. **Run the wide sweep, and widen it further.** The gate missed 64% of this partition. The
   `D-\d{2}[a-z]` form, two-letter requirement prefixes (`NF-04`), letter-suffixed ids (`GEN-06a`)
   and planning-artifact filenames all defeat all nine rows.
2. **Own your whole prefix.** 24 of this plan's 105 files were never in the register's queue.
3. **`.md` is unowned.** If `packages/**` in 152-09's scope contains a README with planning
   references, do not edit it — register it against WINDOWS 90 instead.

## Self-Check: PASSED

- `152-08-SUMMARY.md`, `resolve-template.ts`, `ciTypecheckGate.test.ts` — all present on disk.
- Commits `df9e7b20b`, `d94e356ba`, `b40839efa`, `0db2c5ff4` — all present in `git log --all`.
- `assert-comment-only-diff.mjs --range df9e7b20b~1..d94e356ba` re-run after the docs commits:
  **105 compared, 0 allowed by name, 0 violations.**
