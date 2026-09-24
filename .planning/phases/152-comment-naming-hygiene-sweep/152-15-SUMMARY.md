---
phase: 152-comment-naming-hygiene-sweep
plan: 15
subsystem: comment-hygiene
status: complete
tags: [guard, lint-check, D-A4, D-A5, negative-control, cardinal-gate, review-hyg-01, phase-close]

requires:
  - "152-01's `scripts/assert-comment-hygiene.mjs` (the wired guard, rule 1, the lifted classifier, the fixture harness)"
  - "152-14's `unwrap-comment-paragraphs.mjs` (the HARDENED line-break predicate and its nine constants)"
  - "152-14's sweep taking the tree to zero for rule 2 — the precondition D-N1(c) named"
provides:
  - "the standing guard carrying BOTH rules live, no flag / warn-only / ignore-file / exception roster"
  - "two paired negative controls, HYG1 and HYG2, at the state that ships"
  - "152-GUARD-CONTROLS.md — the flips, the four-requirement proof table, the corrections list, the open-item disposition"
  - "the phase's closing cardinal gate: 150 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run"
  - "the .css/.html extension-set gap disposed of by measurement"
affects:
  - "phases 153-164 — every comment they write is now gated by two rules on every lint:check"
  - "the operator — two fenced questions (D6 coverage ids, D7 Markdown) returned OUTSTANDING"

tech-stack:
  added: []
  patterns:
    - "A standing gate LIFTS its predicate from the one-shot instrument that cleaned the tree, and says so — a re-derived predicate disagrees with the tree it guards in one of two directions."
    - "An extension-set gap is disposed of by MEASURING both halves: close the half that costs nothing, decline the half that would ship the guard red, and record the number for both."
    - "A comment-JOINING sweep must re-run the reference gate afterwards: joining can create violations no pre-sweep scan could see."

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/152-GUARD-CONTROLS.md
    - .planning/todos/pending/2026-08-28-main-yaml-lint-check-last-link-doc-drift.md
  modified:
    - scripts/assert-comment-hygiene.mjs
    - "scripts/fixtures/ (6 inputs + 6 expected-violations files)"
    - packages/dev-seed/src/templates/defaults/candidates-override.ts

key-decisions:
  - "Rule 2 was LIFTED from the phase instrument rather than re-derived, in its HARDENED form (all nine constants), and the docblock records that the two predicates must not diverge. Independent evidence they agree: 0 violations over the same 1,564-file surface the instrument reported 0 for."
  - "The .css/.html gap was measured, not inherited: .html ADDED at 0 violations (1,560 -> 1,564 files); .css/.scss DECLINED at 19 measured live violations, because enabling a rule against N pre-existing violations is the D-N1(c) shape this phase rejected and two of the four files are third-party attribution headers."
  - "REVIEW-HYG-01 and -02 were NOT marked Complete despite being 'ready'. Both are unmet AS LITERALLY WORDED — 19 forced line breaks survive in apps/**/*.css, and the reference gate has attributed survivors — and marking them would convert a fenced operator question into a silent claim."
  - "The one reference 152-14's join UNMASKED was fixed here (it is a violation this phase created); the pre-existing 'numeral names something real' survivors in other plans' partitions were registered, not reworded."

coverage:
  - deliverable: "The standing guard carries both rules as one gate, both live"
    human_judgment: false
    verification:
      - kind: command
        ref: "node scripts/assert-comment-hygiene.mjs -> 1,564 files, 0 violations, exit 0, 'rules live: 2 of 2'"
        status: pass
  - deliverable: "No opt-out of any kind, and no dash rule"
    human_judgment: false
    verification:
      - kind: command
        ref: "git grep -cE 'IGNORE_FILE|--ignore|EXCEPTIONS|allowlist|warnOnly|WARN_ONLY' -- scripts/assert-comment-hygiene.mjs -> no match; git grep -nP '\\bdash\\b' -> 3 lines, all in the standing prohibition"
        status: pass
  - deliverable: "Both rules correct on known inputs, fixtures proven load-bearing"
    human_judgment: false
    verification:
      - kind: command
        ref: "--self-test: 6 fixtures + 27 edge cases, 0 failures. RED first: with expected files hand-written and the predicate absent, all six failed, each on exactly the missing rule-2 entry"
        status: pass
  - deliverable: "The guard CATCHES a reintroduced forced line break (HYG1)"
    human_judgment: false
    verification:
      - kind: other
        ref: "yarn lint:check exit 1 naming apiRouteAdapter.ts:13 under 'rule 2 (D-A4)'; revert -> exit 0. numstat 2/1; blob 4e60a4556 before and after"
        status: pass
  - deliverable: "The chain-membership assertion BITES at the phase's final state (HYG2)"
    human_judgment: false
    verification:
      - kind: unit
        ref: "link removed: 1 failed / 569 passed, naming the missing link; restored: 570 passed. package.json blob ecaef1265 before and after"
        status: pass
  - deliverable: "The phase's closing cardinal E2E gate"
    human_judgment: false
    verification:
      - kind: other
        ref: "yarn test:e2e -> 150 passed (10.2m), exit 0. Report payload decoded: {total:150, expected:150, unexpected:0, flaky:0, skipped:0, ok:true}"
        status: pass
  - deliverable: "build / lint:check / format:check / test:unit green at the final HEAD"
    human_judgment: false
    verification:
      - kind: command
        ref: "all exit 0; unit 816 (frontend, 54 files) + 570 (dev-seed, 49 files)"
        status: pass
  - deliverable: "The out-of-scope drift item filed, not fixed"
    human_judgment: false
    verification:
      - kind: command
        ref: "todo file exists quoting the false statement and naming the commits; git diff --stat -- .github/ empty"
        status: pass
  - deliverable: "The .css/.html extension-set gap disposed of"
    human_judgment: false
    verification:
      - kind: command
        ref: "measured by widening FAMILY_BY_EXT: .html 4 files / 0 violations (ADDED); .css/.scss 4 files / 19 violations (DECLINED, registered as WINDOWS 129)"
        status: pass
  - deliverable: "The planning-reference gate's residual redness is fully attributed"
    human_judgment: true
    rationale: "The gate exits 1. Every occurrence is attributed to a fenced question, a program byte, or a numeral naming something real — but 'this occurrence is genuinely not unswept work' is a reading judgement, made per occurrence and recorded, not a test result."
  - deliverable: "The two fenced questions returned OUTSTANDING"
    human_judgment: true
    rationale: "Deliberately unresolved. Whether the phase's convention extends to E2E coverage ids and to Markdown is the operator's ruling, and both are recorded rather than settled."

metrics:
  duration: "~55 min"
  completed: 2026-08-29
  tasks: 3
  files: 16

actuals:
  tokens: 20205
  tasks: 3
  commits: 4

# Declared by this plan: [REVIEW-HYG-01, REVIEW-HYG-02, REVIEW-HYG-03, REVIEW-HYG-04].
# Only -03 and -04 were marked Complete in REQUIREMENTS.md. See "Requirements" below:
# -01 and -02 are unmet AS LITERALLY WORDED and were deliberately NOT force-marked.
requirements-completed: [REVIEW-HYG-03, REVIEW-HYG-04]
---

# Phase 152 Plan 15: The Guard's Second Rule, Its Two Flips, and the Phase's Cardinal Gate Summary

**The forced-line-break predicate is now enforced by the same committed gate that already enforced the escape rule — lifted from the instrument that cleaned the tree rather than re-derived, proven to catch by deliberate reintroduction, and closed over a full E2E suite of 150 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run.**

**Duration:** ~55 min · **Tasks:** 3/3 · **Commits:** 4 · **Files:** 16

---

## Task commits

| # | Commit | What |
|---|---|---|
| 1 | `325d76248` `feat` | Rule 2 goes live in the standing guard — one gate, two rules |
| 2 | `f28939490` `docs` | Both flips recorded as paired controls; the drift item filed |
| — | `beaeb4c10` `fix` | The ONE planning reference 152-14's join unmasked (Rule-1 deviation) |
| 3 | `da2ace3a8` `docs` | The cardinal gate, the four requirement proofs, the corrections |

---

## Task 1 — rule 2, live

**Fixtures first, and they were proven load-bearing before the predicate existed.** All six inputs were rewritten so each carries one TRUE forced break plus one instance of each of the five structural exclusions; the `.sh` and `.mjs` ones keep their line-1 shebang. The expected `file:line` lists were **hand-computed**, then `--self-test` was run with no rule 2 in the guard:

```
✗ fixtures/assert-comment-hygiene.input.ts      … expected ":8",  actual ":33"
✗ …svelte  ✗ …sql  ✗ …sh  ✗ …yaml  ✗ …mjs      Failures: 6
```

**All six failed, and each failure was exactly the missing rule-2 entry** — every rule-1 line number in the "actual" column matched the hand computation, which independently confirmed the rule-1 half was undisturbed. That red is the evidence the fixtures examine something.

After implementation: **6 fixtures + 27 edge cases, 0 failures**, and **0 violations over 1,564 tracked files**.

### The lift, and why it is a lift

Rule 2's predicate and all nine of its constants come from
`.planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs` — the predicate the operator-sanctioned sweep actually ran over 727 files. The docblock names that path and states that **the two predicates must not diverge**, that the instrument is a one-shot phase artefact while this is the standing gate, and that a predicate bug found here must be fixed here and the divergence recorded.

The lift is of the **HARDENED** form, not the naive one:

| Kind | Constants |
|---|---|
| The five ruled exclusions | `BANNER_RULE`, `NEXT_IS_LIST_ITEM`, `NEXT_IS_JSDOC_TAG`, `COMMENT_TABLE`, `HANGING_INDENT` + `INDENTED_CODE_SAMPLE` |
| Amendment 1 | `PARAGRAPH_BREAK` — a blank comment line ends the paragraph |
| Eligibility preconditions | `BLOCK_DELIMITER`, `CODE_FENCE`, `TOOL_DIRECTIVE` |

A guard carrying the naive predicate would redden on the 903 fenced `@example` junctions, 43 section headers, 42 column-aligned table rows and 135 unfenced shell recipes that `152-14` deliberately preserved — and would invite exactly the pressure to weaken the guard that T-152-33 names.

**Independent evidence the two predicates agree:** the lifted rule reports **0 violations across 1,564 files**, over the surface the instrument reports 0 for; and the 22 edge cases ported from the instrument's own self-test pass here unchanged, including the three that prove a boundary rather than a firing (one space after a colon is prose not a table; indented wrapped prose is not a code sample; an unterminated fence does not leak into the next span).

### No opt-out, no dash rule

There is no flag, no warn-only tier, no ignore file and no per-path exception roster for either rule. The five exclusions are **named constants**; excusing a case means editing the file, which is then reviewed as the decision it is.

`git grep -cE 'IGNORE_FILE|--ignore|EXCEPTIONS|allowlist|warnOnly|WARN_ONLY'` over the guard returns **no match**. `git grep -nP '\bdash\b'` returns **3 lines, all inside the standing prohibition**, none inside a predicate — and the prohibition now covers rule 2 explicitly, recording that rule 2 operates on line breaks and terminal punctuation only, that in a `.sql` file the double hyphen IS the comment opener, and that `152-14` reached T-152-03 (a directive's parse changed) by a route the prohibition does not cover — a join absorbing an `eslint-disable-next-line` — which is why `TOOL_DIRECTIVE` is a precondition and not a nicety.

> **A criterion worth stating exactly.** `git grep -nE '\bdash\b'` returns **nothing** — git's own ERE engine does not support `\b` without `-P`. The plain `grep` and `git grep -P` forms both return the same three prohibition lines. The criterion is satisfied on the property it names; the command as written is silently vacuous, which is recorded here so nobody reads its empty output as proof.

### The extension-set gap 152-01 registered — disposed of by measurement

| Family | Comment-bearing files | Violations | Disposition |
|---|---:|---:|---|
| `.html` | 4 | **0** | **ADDED** — free to close, and closing it gates those files rather than merely observing them clean. 1,560 → 1,564 files scanned. |
| `.css` / `.scss` | 4 | **19** (rule 2: `app.css` 14, `inter.css` 3, `prism-vs.css` 2) | **DECLINED**, operator question, WINDOWS 129 |
| `.md` | 4 sites | inert | **DECLINED** — the classifier maps `md` to an empty comment family, so both rules are silently inert. That is question D7. |

`.css` was not swept because enabling a rule against N pre-existing violations is exactly the D-N1(c) shape this phase rejected; the only two ways out are shipping the guard red or a sweep no ruling sized — and two of the four files are third-party attribution headers (`inter.css` is a verbatim OFL-licensed `@fontsource/inter@5.3.0` distribution header, `prism-vs.css` credits its upstream author), the same class of text the phase already ruled must survive any disposition. The reason and the route to closing it later live in the guard's own docblock, at the site of the decision.

---

## Task 2 — the two flips, and the drift item filed

Full tables with commands, exit codes and decisive output lines are in `152-GUARD-CONTROLS.md` § 1.

| Half | Exit | Decisive output |
|---|---:|---|
| **HYG1-OLD** — `lint:check`, `apiRouteAdapter.ts:13` re-wrapped | **1** | `[ERROR] scripts/assert-comment-hygiene.mjs: apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts:13: rule 2 (D-A4) — this comment line ends without terminal punctuation … Comment: "reason: forwards the base constructor's parameters unchanged; typed as the mixin \`any[]\` rest for"` |
| **HYG1-NEW** — reverted | **0** | `files scanned: 1564; rules live: 2 of 2 …; 0 violation(s).` |
| **HYG2-OLD** — chain link removed | **1** | `AssertionError: expected [ 'turbo run lint', …(5) ] to include 'yarn assert:comment-hygiene'` · 1 failed / 569 passed |
| **HYG2-NEW** — restored | **0** | `✓ tests/ciTypecheckGate.test.ts (5 tests)` · 570 passed |

**The one-difference invariants.** HYG1: one line break inside one comment span (`numstat 2 1`), restore verified by blob hash `4e60a4556` rather than by eye — every other input to the seven-link chain identical. HYG2: one `&&` link (`package.json` blob `ecaef1265` before and after). HYG2 repeats `152-01`'s flip **at the phase's final state**, because a membership assertion proven against an earlier tree proves nothing about this one.

**Neither injection was reverted with `git checkout --`** (WINDOWS 113). Both were restored from a pristine copy taken before the injection and verified by hash. `git status --porcelain -- apps packages tests package.json` is empty.

**The drift item is FILED, NOT FIXED.** `.github/` is outside this phase's trees, and `git diff --stat -- .github/` is empty. The filed item quotes `main.yaml:70` verbatim, shows the seven-link chain with `yarn typecheck` at position 4, names the commits, and gives a one-line correction.

> **A correction to the premise the item was filed under**, made rather than propagated. The brief said the sentence "stopped being true when the chain-membership fix landed". Measured: `a16b983fc` **wrote the comment and falsified it in the same commit** (its `package.json` diff appends three links after `typecheck`), and it is an **ancestor** of `b410d3a90`. The sentence was false on arrival. `b410d3a90` is what made appending links *legitimate*; `07b7baf12` appended the seventh. The claim is load-bearing — it justifies the step ordering `ciTypecheckGate.test.ts` asserts — and the ordering **survives** the correction, because the argument needs membership of an aborting chain, not terminal position.

---

## Task 3 — the cardinal gate

### It is discharged

**`yarn test:e2e` — 150 passed, 10.2m, exit 0.** Counts decoded from the HTML report's own `playwrightReportBase64` payload rather than read off the console tail, and the report preserved to `tests/e2e-runs/152-15-cardinal-gate/index.html` before the next run overwrites it:

```json
{ "total": 150, "expected": 150, "unexpected": 0, "flaky": 0, "skipped": 0, "ok": true }
```

`total == expected` with `skipped: 0` is what establishes **zero did-not-run**. `unexpected: 0` and `flaky: 0` mean nothing was retried to green and nothing was annotated flaky. Nothing was skipped, quarantined or grep-excluded. **`152-13`'s 46 renamed test titles all resolved** — no spec failed to match, no project dependency broke.

**The environment was checked, not assumed**, because a run that cannot start is a failure and not a skip: 150 GiB headroom; 5173 free on **both** `lsof` and `docker ps`; no surviving `vite.js dev`; `yarn db:reset` exit 0; then exactly ONE fresh dev server (one listener, `HTTP 200`, no bind error in the log). The served-application preflight passed.

### Every other gate, at the final HEAD

| Gate | Result |
|---|---|
| `yarn build` | exit 0 |
| `yarn lint:check` | exit 0 — `1564 files; rules live: 2 of 2; 0 violation(s)` |
| `yarn format:check` | exit 0 |
| `yarn test:unit` | exit 0 — frontend **816** / 54 files, dev-seed **570** / 49 files |
| guard + `--self-test` | exit 0 — 0 violations; 6 fixtures + 27 edge cases |
| `unwrap-comment-paragraphs.mjs --report` | apps 0 · packages 0 · tests 0 — **total 0** |
| `uk-identifier-audit.mjs` | 1,521 files, **0 in-scope hits** |
| `152-SPELLING-AUDIT.md` | present |
| `assert-comment-only-diff.mjs --range HEAD~1..HEAD` | 1 compared, **0 violations, 0 allow entries** |
| `yarn db:lint:sql` | **pre-existing red, structurally unaffected** (WINDOWS 125) |
| `hygiene-grep-report.sh --assert-clean` | **exit 1 — see below** |

### The planning-reference gate is RED, reported rather than engineered around

Per the house rule (memo item 4) the criterion is neither restated as met nor made green by editing the gate. Every occurrence is attributed:

| Row | occ / files | Attribution |
|---|---|---|
| `phase-ref` | 21 / 6 | 12 lines in the four fenced Markdown files + 5 `PHASE 1/2/3` naming a benchmark script's own stages (2 inside `echo`) + 2 `Phase 1/2` naming a pgTAP file's own stages |
| `decision-id-bare` | 2 / 2 | 1 fenced Markdown + 1 inside an `echo` |
| `section-anchor` | 5 / 1 | all in `fonts/README.md`; **three are OFL 1.1 licence sections** |
| `planning-path` | 1 / 1 | one assertion-message string |
| `task-id` | 88 / 46 | 70 fenced coverage ids + 8 Markdown + 4 shell strings + 6 assertion/skip diagnostics — `152-13`'s attribution, **re-measured here and identical** |

Every remaining occurrence is one of three kinds: a byte inside a fenced operator question, a **program byte** the zero-allow-entry prover forbids editing, or a **numeral that names something real**. **The row cannot go green without settling D6 or D7.** Registered as WINDOWS 128 and 131.

### The finding that only a phase-close comparison could produce

Comparing all six gate rows **and** thirteen widened reference classes between the pre-sweep HEAD `3e6158382` and this one, exactly **one** moved upward: `phase-ref`, +1 line. See the deviation below. **Every other delta was negative**, which is arithmetic rather than removal — a per-LINE count necessarily falls when two matching lines become one, the same unsatisfiability WINDOWS 124 records for the dash criterion.

---

## The two fenced questions — BOTH OUTSTANDING, neither resolved

**D6 — the 23 E2E coverage ids** (memo 12, WINDOWS 120). Left byte-identical. `152-13` proved the classification by evidence, not shape: 19 Playwright coverage-id titles cited in 12-61 register files each, 62 vitest ones in zero, and `D-07` vs `EPERM-07` identical in shape but opposite in class. **`VGATE-04/05` are cited by the blocking `e2e-visual` CI job**, so stripping them fails a required check.

**D7 — Markdown** (memo 13, WINDOWS 122). Every `.md` file byte-identical. The classifier maps `md` to an empty comment family, so the prover reads every byte as code and both guard rules are inert. **Three of the five `§` markers in `fonts/README.md` are OFL 1.1 licence sections and must survive any ruling.**

Neither was settled. A phase that closes by quietly resolving a fenced question has not closed honestly.

---

## Requirements — what was marked, and what was deliberately not

`requirements.ready-ids` reports all four ready now that this, the last plan, has a SUMMARY. **Ready is not the same as met**, and the instruction was not to force-mark. Marked:

| Id | Marked | Why |
|---|---|---|
| **REVIEW-HYG-03** | ✅ Complete | All three renames landed (`152-03`, `152-04`); `yarn build`, `yarn test:unit` and `yarn lint:check` green after each and again at this HEAD; no dangling reference. |
| **REVIEW-HYG-04** | ✅ Complete | `152-SPELLING-AUDIT.md` committed; `uk-identifier-audit.mjs` reports **0 in-scope hits** over 1,521 files. "None found" is a committed result. |
| **REVIEW-HYG-01** | ⬜ **Pending, deliberately** | Its text is *"No comment in `packages/**`, `apps/**` or `tests/**` carries a forced line break"*. **19 forced line breaks survive in four `apps/**/*.css` files** — the gap declined above. The scan, the wiring and the flip are all delivered and the eleven-plus-one-family surface is at zero, but the requirement as literally worded is not met, and marking it would convert an operator question into a silent claim. |
| **REVIEW-HYG-02** | ⬜ **Pending, deliberately** | Its text is *"no historical narrative, planning-artifact path, phase or plan number, or decision id survives"*. The gate exits 1 with 117 attributed survivors. Every one is fenced, a program byte, or a meaningful numeral — but "attributed" is not "absent". |

Both Pending ids become markable the moment D6 and D7 are ruled and the `.css` question is settled. Nothing was force-marked; `152-01`'s error (force-marking, then reverting) was not repeated.

---

## Deviations from Plan

**1. [Rule 1 — bug] The ONE planning reference `152-14`'s join unmasked**
- **Found during:** Task 3, comparing the gate against the pre-sweep tree rather than trusting the phase's own record.
- **Issue:** `packages/dev-seed/src/templates/defaults/candidates-override.ts` read, pre-sweep, `… the defect Phase` / `145 repaired.` — with `Phase` and `145` on **opposite sides of a line break**. That is the class memos 19 and 23 registered after two prior sightings, and which no grep can reach by construction. `152-14`'s join re-assembled it into `Phase 145`; the gate now reads it. **A violation this phase created, in its own surface, of its own requirement, invisible to every plan that could have owned it.**
- **Fix:** per the gate's own instruction for a `phase-ref` row — the citation goes and the sentence is rewritten: `— the defect Phase 145 repaired.` → `— the defect this key repairs.`, keeping the live invariant (this key supplies the missing `terms_of_use_accepted` clause).
- **Verification:** `phase-ref` 22/7 → 21/6; `packages/dev-seed/src` clean on that row; comment-only prover 1 compared, **0 violations, 0 allow entries**; guard exit 0.
- **Commit:** `beaeb4c10`. **Registered as WINDOWS 130** with the standing lesson: *any future comment-joining sweep must re-run the reference gate afterwards.*

**2. [Rule 2 — missing critical] The `.html` half of the registered extension gap closed, the `.css` half declined with a number**
- **Found during:** Task 1, disposing of the gap `152-01` registered rather than restating it.
- **Issue:** the plan required the gap "disposed of", which admits either widening or a stated refusal; neither is defensible without a measurement.
- **Fix:** both halves measured by widening `FAMILY_BY_EXT` and reading the result. `.html` added (0 violations); `.css`/`.scss` declined (19 violations) with the reason and the route to closing it recorded in the docblock.
- **Commit:** `325d76248`. **Registered as WINDOWS 129.**

**3. [Rule 3 — blocker] The plan's `hygiene-grep-report.sh --assert-clean` criterion is unsatisfiable without settling a fenced question**
- **Issue:** Task 3's acceptance criterion requires exit 0 and the clean marker. The gate exits 1, and cannot do otherwise while the 70 fenced coverage ids and the four fenced Markdown files stand.
- **Fix:** not engineered around and not restated as met. The gate was re-measured independently, every occurrence attributed, and the criterion registered. **WINDOWS 128.**

**4. [Procedural] Two `phase-ref` survivors in other plans' partitions registered rather than reworded**
- **Issue:** `00-helpers.test.sql`'s `Phase 1/2` and `run-concurrency-scaling.sh`'s `PHASE 1/2/3` name those files' own internal stages — memo 7/18's class, whose sanctioned handling is reword-after-understanding, not strip.
- **Fix:** left byte-identical and registered. Rewording another plan's partition at phase close, with the operator away, is not an executor's call; two of the five are inside `echo` statements and are program bytes in any case. **WINDOWS 131.**

**Total deviations:** 4 (1 × Rule 1, 1 × Rule 2, 1 × Rule 3, 1 procedural). **Impact:** one live violation of the phase's own requirement closed that nobody could have found without a phase-close comparison; the registered gap reduced by one family and quantified for the other; two criteria reported honestly rather than engineered green. **No prohibition in the plan was crossed:** rule 2 is live and not flag-gated, no opt-out mechanism of any kind exists, no dash rule was added, `hooks.server.ts` (`b79d5834`), `hooks.ts` (`c7311730`) and `.editorconfig` (`ec6742a7`) are byte-identical, `.github/` is unmodified, no test was skipped or retried to green, and `ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md` were untouched by the three task commits.

## Known Stubs

None. Rule 2 shipped as working code, not as a disabled, warn-only or flag-gated path.

## Threat Flags

None. The plan's `<threat_model>` assigns `mitigate` to T-152-05 (a guard green while blind — two paired flips plus fixtures proven to fail before the predicate existed), T-152-33 (an unkeepable guard — nine named exclusion constants, an acceptance grep for any opt-out mechanism, and a fixture instance of each exclusion in all six files), T-152-03 (rule 2 growing a dash rule — the prohibition extended to rule 2 explicitly and no predicate mentions dashes), T-152-34 (a did-not-run or retried E2E gate — environment preconditions checked, counts decoded from the report, `skipped: 0`), and T-152-35 (silently dropping the drift item — filed with the quoted statement and the causing commits, `.github/` unmodified). T-152-SC is not applicable: no package was installed.

## Issues Encountered

- **The planning-reference gate exits 1 at phase close** and cannot go green without an operator ruling. Fully attributed; WINDOWS 128.
- **`yarn db:lint:sql` is pre-existing red** and structurally unaffected — its failing half lints the live database and reads no working-tree file (WINDOWS 125).
- **19 forced line breaks survive in `apps/**/*.css`**, outside the guard's family set by decision. WINDOWS 129.
- **`git grep -nE '\bdash\b'` is silently vacuous** — git's ERE engine needs `-P` for `\b`. Recorded above so its empty output is not read as proof.

## Next Phase Readiness

**Phase 152 is complete.** The comment-hygiene class is held shut by one committed gate carrying both of its rules, wired into `yarn lint:check`, asserted by a membership spec, and proven by deliberate reintroduction to catch and name a violation. Phases 153-164 are now written against an enforced convention rather than operator memory: every comment they add is checked on the one command every local run and CI pass through.

**Owed to the operator, and only to the operator:**

1. **D6** — do the 23 E2E coverage ids stay in test titles? `VGATE-04/05` gate a required CI check.
2. **D7** — does the phase's convention extend to Markdown, under which plan and against which prover? Three `§` markers are OFL licence sections and must survive.
3. **The `.css` family** — sweep the four files under a ruling, then add `css`/`scss` to the guard's map in one commit.

`REVIEW-HYG-01` and `REVIEW-HYG-02` become markable once those are settled.

## Self-Check: PASSED

- `.planning/phases/152-comment-naming-hygiene-sweep/152-GUARD-CONTROLS.md` — FOUND (357 lines)
- `.planning/todos/pending/2026-08-28-main-yaml-lint-check-last-link-doc-drift.md` — FOUND (84 lines)
- `scripts/assert-comment-hygiene.mjs` carrying both rules — FOUND, `rules live: 2 of 2`
- `scripts/fixtures/` — 6 inputs + 6 expected files, all modified and all green under `--self-test`
- Commits `325d76248`, `f28939490`, `beaeb4c10`, `da2ace3a8` — all FOUND in `git log`
- Every Task-1 acceptance criterion re-run post-commit: self-test exit 0 / tree scan exit 0 / opt-out grep no match / dash grep prohibition-only / lift source and non-divergence recorded / five exclusions present in all six fixtures / shebangs in `.sh` and `.mjs` / `yarn lint:check` exit 0.
- Every Task-2 criterion re-run: four rows present with commands, exit codes and decisive output; both invariants stated; `git status --porcelain -- apps packages tests package.json` empty; the todo quotes the statement and names the commits; `git diff --stat -- .github/` empty.
- Every Task-3 criterion re-run: E2E 0 failed / 0 did-not-run with counts decoded; build, lint, unit exit 0; guard exit 0 with both rules; UK audit 0; spelling audit present; the requirement proof table and the corrections list present. The `--assert-clean` criterion is reported UNSATISFIABLE with full attribution rather than claimed.
