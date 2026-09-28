---
phase: 142-assertion-design-wiring-only-tests-assert-output
verified: 2026-08-21T10:22:50Z
verified_at_head: a8c288a42
status: passed
score: 5/5 roadmap success criteria verified
behavior_unverified: 0
overrides_applied: 0
requirement: ASSERT-07
re_verification:
  previous_verified: 2026-08-21T09:42:27Z
  previous_head: 1453a4106
  previous_status: human_needed
  previous_score: 5/5 (criterion 2 carried by recorded amendment A-04, one residue routed to human decision)
  gaps_closed:
    - "W-1 — Configuration 2 of `packages/question-info/tests/questionTypes.test.ts` carried no assertion on the composed prompt, leaving three of F15-A's eleven blind sites blind after remediation, with the residue absent from the record. Closed in code by `d1fc0f745` (three prompt assertions at `:239`, `:246`, `:318`) and on the record by `a8c288a42` (ledger row 1s, ROADMAP Outcome criteria 2 and 3, counts reconciled to 13)."
    - "W-2 — `.planning/todos/done/playwright-config-bank-auth-doc-drift.md:52` misattributed `f4e0fc1ec` to `142-05`. Closed by `a8c288a42`; now reads `142-04`, executed as wave 5."
  gaps_remaining: []
  regressions: []
gates_verified:
  - gate: "D-14 — root `yarn test:unit` 3× consecutive under parallel turbo load (original pass, at `1453a4106`)"
    result: "EXITCODE=0 ×3 (25s/22s/22s wall), 11 workspaces cache-bypassed in every run, 1664 tests summed per run, Phase-141 coverage guard 0 violations on both checks ×3"
    evidence: "${TMPDIR}/gsd-142/unit-gate-{1,2,3}.log, unit-gate-env.txt"
  - gate: "D-16 — full `yarn test:e2e` (original pass)"
    result: "EXITCODE=0, `135 passed (11.3m)`, WALL=680s, 0 skipped, 0 did-not-run"
    evidence: "${TMPDIR}/gsd-142/e2e-full-1.log"
  - gate: "A-05 — opt-in bank-auth projects (original pass)"
    result: "EXITCODE=0, `121 passed (11.4m)`, WALL=687s; `[bank-auth]` 6 tests, `[bank-auth-journey]` 1"
    evidence: "${TMPDIR}/gsd-142/e2e-bankauth-1.log"
  - gate: "Phase-137 E2E preflight asserted THIS working tree"
    result: "`E2E PREFLIGHT OK …/voting-advice-application-gsd/apps/frontend` present in BOTH runs"
    evidence: "e2e-full-1.log:2, e2e-bankauth-1.log:4"
  - gate: "W-1 pass — root `yarn test:unit` re-run after the assertion commit"
    result: "EXITCODE=0, `Tasks: 25 successful, 25 total`, 11 cache bypasses, `@openvaa/question-info:test:unit` force-executed at log line 725, coverage guard `Total: 0 violation(s)`"
    evidence: "${TMPDIR}/gsd-142/W1-unit-gate-1.log"
  - gate: "W-1 pass — verifier's own independent run of `packages/question-info` at HEAD `a8c288a42`"
    result: "`Test Files 2 passed (2)`, `Tests 22 passed (22)` — the three new assertions are true of the real product on the clean tree"
    evidence: "run by this verifier, 2026-08-21 13:20 local"
  - gate: "E2E deliberately NOT re-run for the W-1 pass — judged sound"
    result: "`git diff --name-only 1453a4106 HEAD` outside `.planning/` returns exactly one path — `packages/question-info/tests/questionTypes.test.ts`, +27/−0. The product tree at HEAD is byte-identical to the tree the three gates ran against."
    evidence: "verifier-run `git diff --stat 1453a4106 HEAD -- apps packages tests`"
coincidental_reliance_items:
  - truth: "Criterion 2 — an implementation that ignores question type fails at least one Configuration block (supporting assertion `questionTypes.test.ts:239`)"
    reason: undeclared-precondition
    harden: "`:239`'s `toContain(QUESTION_TYPE.SingleChoiceOrdinal)` discriminates only while the literal string `singleChoiceOrdinal` appears nowhere else in the composed prompt. Nothing in the code or the YAML templates enforces that; injection Q proves it today, not tomorrow. Advisory only — `:246`/`:318` carry the load-bearing part on fixture-specific label strings, and the ledger already designates them as such. If hardened, anchor `:239` to the `## The question's type:` section rather than to the whole prompt."
carried_forward_open_items:
  - item: "P-1 — `condenser.ts:205` `as Array<Argument>` cast; `condenseQuestions.test.ts:163/246/311` still carry the documented load-bearing `flat()`"
    status: open
    tracked: ".planning/todos/pending/condenser-run-result-arguments-nested.md"
  - item: "P-2 (both halves) — A-07's fix does not reach `/api/oidc/token`; `idura.ts:114`/`signicat.ts:77` carry their own uncoded copies, and `idura.test.ts:90-91`/`signicat.test.ts:54-55` assert only `typeof … === 'function'`"
    status: open
    tracked: ".planning/todos/pending/provider-getidtokenclaims-duplication.md"
  - item: "D-19 i / ii / iii"
    status: open
    tracked: ".planning/todos/pending/{f19-class-adjacent-auth-sites,getidtokenclaims-negative-tests,question-info-type-awareness-followups}.md"
  - item: "Three D-01 exclusions — D-01-i (question `info` never reaches the prompt), D-01-ii (no localised type label), D-01-iii (5-point vs 7-point ordinal share the `singleChoiceOrdinal` discriminant; scale semantics stay implicit — mitigation now guarded by `:246`/`:318`, gap not closed)"
    status: open by design
    tracked: "same todo + WINDOWS 42/43/44; D-01-iii additionally at ledger `:2040`"
  - item: "B-1 — `.env.example` still lacks `SUPABASE_ANON_KEY`; both executors were permission-blocked and correctly refused to route around the deny"
    status: open, operator-owned
    tracked: "ledger ⚠ BLOCKED table + `142-06` re-confirmation, deferred-items.md:76, 142-04-SUMMARY.md:254, WINDOWS.md:64. This verifier re-attempted `grep -c SUPABASE_ANON_KEY .env.example` at re-verification and was denied again — the deny is real and reproducible."
  - item: "I-1 — injection liveness is transcribed (`git diff` while live + three-condition post-gate), never carried in a log body. Structural limit of the apparatus; applies to the W-1 pass's injections Q and C exactly as it applied to the original twelve."
    status: open (recorded limit, not a defect)
    tracked: "ledger § \"A note on 'the first line of output'\"; this report, finding I-1"
human_verification: []
---

# Phase 142: Assertion Design — Wiring-Only Tests Assert Output — Verification Report

**Phase Goal:** *Every sweep finding that survives Phase 139 asserts the behaviour its own title promises, or is withdrawn on the record with reasoning.*
**Verified:** 2026-08-21T10:22:50Z at HEAD `a8c288a42`, working tree clean, `grep -rn INJECTED apps packages tests` → 0 hits.
**Status:** `passed` — **W-1 and W-2 are closed and verified closed; no findings remain open.**
**Re-verification:** Yes — second pass, after the gap-closure commits `d1fc0f745` (assertions), `a8c288a42` (record). The first pass returned `human_needed` at `1453a4106`.
**Method:** source read first, logs second, SUMMARYs last. Every claim in `142-W1-SUMMARY.md` that this pass credits was checked against the file or the log it names; two were re-measured independently.

---

## Re-verification Summary (this pass)

| Previous finding | Disposition | Closing commit | Evidence this verifier checked |
|---|---|---|---|
| **W-1** (WARNING — human decision) | ✅ **CLOSED — superseded** | `d1fc0f745` + `a8c288a42` | Three assertions read in source at `:239`, `:246`, `:318`; three measured reds at those exact sites in `F15-A-W1-NEW-Q-1.log` and `F15-A-W1-NEW-C-1.log`; both OLD halves green-blind; ledger row 1s cells match the logs verbatim; ROADMAP Outcome now states criteria 2 and 3 |
| **W-2** (INFO — stale attribution) | ✅ **CLOSED — superseded** | `a8c288a42` | Todo `:52` now reads *"Phase 142 (`142-04`, executed as wave 5, commit `f4e0fc1ec`)"*; `git log` gives `docs(142-04)`, `142-04-PLAN.md:5` is `wave: 5` — both halves correct |
| **I-1** (INFO — structural limit) | ⏩ **CARRIED FORWARD** unchanged | — | Still true, and now also true of injections Q and C |
| New this pass | **W-3** (INFO), **I-2** (INFO) | — | See Findings |

**The original W-1 finding was real, and the record should show that.** Its full original text is preserved below under *Findings*, struck through with its closure, not deleted. Before `d1fc0f745`, `capturedPrompts()` was called at `:113` and `:422` and **nowhere** between `:173` and `:296`; three of F15-A's eleven blind sites were still blind. This pass proved that independently rather than taking it from the summary — see § R2.

---

## Goal Achievement — ROADMAP Success Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Every 139-confirmed finding has a recorded negative-control pair; no finding done on one half | ✓ VERIFIED | **13** ledger rows now (rows 1–12 + 5s + **1s**). Row 5 (F17) contributes no pair and says so; rows 5s and 1s supply measured supplementary ones. 13 pairs = 11 + 1 + 1; 8 OLD halves cited from 139 § 5.N.4, **5** re-run here (rows 1, 7, 9, 5s, **1s**). All log paths the ledger references exist on disk — the original 59 plus the 13 new `F15-A-W1-*` logs, checked by set difference (0 missing) |
| 2 | F15 — the three Configuration blocks differ observably; condensation files assert `result.arguments` content; wall-clock `processingTimeMs > 0` **removed** | ✓ **VERIFIED** *(upgraded from ⚠️ this pass)* | **All three Configuration blocks now carry assertions on the prompt the mocked provider received**: `:113` (Config 1), `:239`/`:246`/`:318` (Config 2 — added by `d1fc0f745`), `:450-451` (Config 3). The operative clause — *"an implementation that ignores question type fails at least one"* — is now met **by assertion and by measurement**: injection Q (`questionType: ''`) reds `:239` alone, `1 failed \| 8 passed`. Condensation half verified at `condenserStandalone.test.ts:154-160` and `condenseQuestions.test.ts:163/246/311`. `processingTimeMs > 0` deletion re-confirmed: the only surviving reference in the file is `:607` `toBe(10)`, the documented rename assertion. **A-04's rejection of 139 § 5.1.6's literal pairwise-inequality target still stands and is now stated in the ROADMAP Outcome** — recorded, not rounded away |
| 3 | F16 language-specific; F17 renamed or reactive; F18 locale boundary; six F20 matchers as strong as their titles | ✓ VERIFIED | Re-confirmed at HEAD by direct grep of all eight sites (§ R4). ROADMAP Outcome now states criterion 3 per finding, **with F17's `N/A — by construction` scoped exception intact and marked "must not be rounded away"** |
| 4 | Any withdrawal carries reasoning in phase record **and** audit file | ✓ VERIFIED — **vacuously and visibly** | Withdrawal count **0**, stated (not implied) in ledger `:162`, audit `:90`, `REQUIREMENTS.md:60`, ROADMAP Outcome. Unchanged by this pass |
| 5 | `yarn test:unit` exits 0 after remediation, under parallel load not isolation | ✓ VERIFIED | Original 3× EXITCODE=0 at `1453a4106`, **plus** a fourth green root run after the W-1 assertion commit (`W1-unit-gate-1.log`, 25/25 tasks, 11 cache bypasses, question-info force-executed, coverage guard 0 violations), **plus** this verifier's own `packages/question-info` run at HEAD: 22/22 |

**Score: 5/5 — no criterion now rests on an unrecorded residue.**

---

## R1. Do the three new assertions meet the bar this phase enforces?

Read in source at HEAD, not taken from the summary.

| Site | Assertion | Would a blind implementation fail it? | Self-referential? |
|---|---|---|---|
| `:239` | `expect(prompt).toContain(QUESTION_TYPE.SingleChoiceOrdinal)` | **Yes, measured** — injection Q (`questionType: ''` at `infoGeneration.ts:104`) reds it and *only* it (`F15-A-W1-NEW-Q-1.log`, `1 failed \| 8 passed (9)`, site `:239:22`) | No. Read **from the constant**, not re-typed — a rename of the discriminant cannot leave a stale literal asserting the old value |
| `:246` | `toContain('Very dissatisfied, Dissatisfied, Neutral, Satisfied, Very satisfied')` | **Yes, measured** — injection C (`choices: ''` at `:105`) reds it at `:246:22` | No, and **genuinely derived**: the expected value is reconstructible without running anything, from the fixture's own five labels (`:183-187`) in fixture order joined by the `', '` separator visible at `infoGeneration.ts:105`. Not an opaque blob captured from output. A regression in the separator **or in the label order** reds too |
| `:318` | the 7-point test's seven labels, likewise joined | **Yes, measured** — injection C reds it at `:318:36` | Same derivation. Additionally exercises a **second template** (`generateTerms`), so `{{choices}}` is pinned on both `generateInfoSections` and `generateTerms` |

**Nothing was weakened to make room.** `d1fc0f745` is `1 file changed, 27 insertions(+)` — **zero deletions**. No pre-existing assertion was removed, softened, or reordered.

**Are they true of the real product?** Independently confirmed: this verifier ran `packages/question-info`'s suite at HEAD — `Test Files 2 passed (2)`, `Tests 22 passed (22)`.

**One qualification, recorded rather than waved past.** `:239` discriminates only while `singleChoiceOrdinal` appears nowhere else in the composed prompt — a precondition nothing enforces (see `coincidental_reliance_items`). It is advisory: `:239` is the supporting assertion; `:246`/`:318`, on fixture-specific label strings, carry the load and are the ones the ledger names as load-bearing for the D-01-iii axis.

**A-04 is untouched.** Nothing added compares two differently-named fixtures; 139 § 5.1.6's target 2 is still absent from the file — verified by reading `:174-320` end to end.

---

## R2. Is the new negative control real? (and the independent confirmation asked for)

All **13** `F15-A-W1-*` logs exist on disk under `$TMPDIR/gsd-142/`. Sampled cells checked **verbatim** against them:

| Ledger claim | Log | Verifier's own read |
|---|---|---|
| Q OLD — green blind, exit 0, `Tests 9 passed (9)` | `F15-A-W1-OLD-Q-1.log` | Matches, `EXITCODE=0` |
| Q OLD package-wide — `22 passed (22)` | `F15-A-W1-OLD-Q-collateral-1.log` | Matches, `EXITCODE=0` |
| C OLD — green blind, `Tests 2 passed \| 7 skipped (9)`, filter matched exactly 2 | `F15-A-W1-OLD-C-1.log` | Matches, `EXITCODE=0` |
| Q NEW — red at `:239:22`, `1 failed \| 8 passed (9)`, **zero collateral in the file** | `F15-A-W1-NEW-Q-1.log` | Matches; the red names the new assertion, is an `AssertionError` (not a `TypeError`), and no sibling reds |
| C NEW — red at `:246:22` **and** `:318:36`, `2 failed \| 7 skipped (9)` | `F15-A-W1-NEW-C-1.log` | Matches; both sites named, each with its own joined label string |
| C NEW collateral — `4 failed \| 18 passed (22)`, two of them **pre-existing** choices assertions | `F15-A-W1-NEW-C-collateral-1.log` | Matches; the two extra reds are `:450` (`Morning person`) and `:676` (`Yes, lower it to 16`) — sibling coverage, correctly never credited as either half |
| Post-revert green, both cycles | `F15-A-W1-OLD-postrevert.log`, `F15-A-W1-NEW-postrevert.log` | Both `22 passed (22)`, `EXITCODE=0` |
| Clean-tree post-edit `22 passed (22)` | `F15-A-W1-cleantree-postedit.log` | Matches |

**Each red names the new assertion, not a `TypeError` and not a sibling.** Confirmed by reading the failure blocks, not the summary lines.

### The measurement asked to be confirmed independently — confirmed, verbatim

`F15-A-W1-OLD-C-collateral-1.log` (whole file, pre-assertion tree, choices emptied), lines 7–17:

```
 ❯ tests/questionTypes.test.ts (9 tests | 2 failed) 11ms
   ✓ … Configuration 1 … yes/no answers
   ✓ … Configuration 1 … terms generation
   ✓ … Configuration 2: Ordinal Questions > should handle 5-point Likert scale question
   ✓ … Configuration 2: Ordinal Questions > should handle 7-point Likert scale question
   ✓ … Configuration 3 … multiple choices
   × … Configuration 3 … binary categorical question   → to contain 'Morning person'
   ✓ … Mixed … all three question types
   × … Mixed … share a name and differ only in type    → to contain 'Yes, lower it to 16'
   ✓ … Prompt composition boundary …
      Tests  2 failed | 7 passed (9)   EXITCODE=1
```

**True as claimed, and it is the sharpest evidence W-1 was a real gap:** with the choices stripped from every prompt, the file caught the regression at Configuration 3 and at the Mixed block — and **both Configuration 2 tests stayed green**. The ordinal block was the one place the file was blind. That is the residue, measured rather than argued.

---

## R3. § 8.3 R-2 — checked, not assumed. **Not a prohibited-injection violation.**

This was the claim most likely to be a serious finding, so it was adjudicated from 139's own text, not from the executor's paraphrase.

**R-2 verbatim** (`139-VERDICTS.md:4932-4940`): *"F15-A: the audit's own named regression … proved un-injectable … Rejected because **there is nothing to delete**: `grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/` exits 1 with no output, so the shipped code already ignores question type … Consequence for Phase 142: its negative control must come from § 5.1.6, never from the audit's sentence."*

Four checks:

1. **R-2's stated ground is now demonstrably false in this tree — verified by re-running R-2's own grep.** At HEAD it exits **0** with 15 hits, including `infoGeneration.ts:104` and `:105` — precisely the two injection sites. The "zero delta / nothing to delete" premise is a property of the **pre-D-01** tree and D-01 removed it.
2. **The delta is measured non-zero and discriminating.** OLD halves green under both Q and C; NEW halves red. That is exactly the property R-4 and R-5 were disqualified for **lacking** (they red before *and* after a fix, making remediation unverifiable). Q and C do the opposite: they are silent before the assertions and loud after — the definition of a valid negative control under this phase's own D-08 rule.
3. **The precedent cited is real and was verified in the previous pass.** R-7 rejected F20-1's injection A because a SvelteKit catch arm swallowed the 400 — a **tree-dependent control-flow fact**. Once D-02's re-throw landed, A became on-axis and row 7 used it post-fix; the previous pass verified that as *"clean — and correctly reasoned."* R-2 is the same shape: a rejection whose ground is a fact about a tree, re-checked against the changed tree rather than inherited by name.
4. **R-2's directive was honoured where it binds.** Row 1 — F15-A's **counted** pair — still uses 139 § 5.1.2's substitute, unchanged. Row 1s is a *supplementary* pair regressing code that did not exist when R-2 was written.

**Verdict: clean.** R-2 does not bind on the post-D-01 tree for injections Q and C. Two things weigh further in favour: the executor named R-2 explicitly and re-derived it in the open rather than sliding past it, and it **also** checked R-3 and R-4 and declined them — R-4's `generalInstructions` key sits one line below C's site at `:106` and is byte-unchanged in every diff, which this verifier confirmed in source.

**The one thing a strict reader could object to** is R-2's absolute wording (*"never from the audit's sentence"*). Recorded here so the judgement is visible: the sentence's operative clause is its reason, the reason is falsified in this tree, and the counted pair still obeys the directive. Not a finding.

---

## R4. Did the executor widen the brief safely? Did anything regress?

**Widening: safe.** Three assertions where one was asked for, and **every one is covered by a measured red** — `:239` by Q, `:246` and `:318` by C. No assertion was added without a control. The widening is justified on the criterion's own wording (*"differ observably from one another"*), which for two questions sharing the `singleChoiceOrdinal` discriminant only the choice labels can deliver.

**Post-gate: passed after every injection.** Both OLD and NEW cycles end with a green post-revert package run; the tree at HEAD is clean (`git status --porcelain` empty) and `grep -rn 'INJECTED' apps packages tests` returns nothing. The three-condition post-gate itself remains transcribed rather than logged — the pre-existing **I-1** limit, unchanged.

**Regression spot-check — all twelve remediations still stand at HEAD** (re-grepped, not assumed):

| # | Finding | Site at HEAD | Present |
|---|---|---|---|
| 1 | F15-A | `questionTypes.test.ts:113`, `:676`, `:681`, hard `toHaveBeenCalledTimes(1)` at `:35-42` | ✓ |
| 2 | F15-B | `condensation/condenserStandalone.test.ts:154-160` — `Array.isArray` + `toHaveLength(2)` + `.map(text)).toEqual([…])` + non-empty guard | ✓ |
| 3 | F15-C | `condensation/condenseQuestions.test.ts:163`, `:246`, `:311` deep equality, all three clusters | ✓ |
| 4 | F16 | `unit/handleQuestion.test.ts:98` `rejects.toThrow('Unsupported language: lol')` | ✓ |
| 5 | F17 | `EntityListWithControls.helpers.test.ts` present; old-name references **0**; `toHaveBeenCalledTimes(10)` **0** repo-wide | ✓ |
| 6 | F18 | `templates/default.test.ts:147` `blockSize = rows.length / 3`, derived not imported | ✓ |
| 7 | F20-1 | `authorize-endpoint.test.ts:240` `rejects.toMatchObject({ status: 400 })` | ✓ |
| 8 | F20-2 | `overrides.test.ts:39` `toBe('{broken, plural, }')` | ✓ |
| 9 | F20-3 | `getIdTokenClaims.test.ts:241` `ERR_JWKS_EMPTY`, `:268` `ERR_JWK_KID_MISMATCH` | ✓ |
| 10 | F20-4 | `supabaseAdminClient.test.ts:169` exact column string | ✓ |
| 11 | F20-5 | `nominations/variants/variants.test.ts:20-21` vacuity guard + length; `:33-34` membership first | ✓ |
| 12 | F20-6 | `unit/planValidation.test.ts:112` `'…listOfLists in 100 batch(es)'`, distinct from the sibling's `2` at `:95` | ✓ |

**No § 8.3 prohibition used anywhere else** — the previous pass's rule-by-rule table (R-2/R-4/R-5/R-7/R-8/R-9/R-10) is unaffected by this pass, which added no injection outside `infoGeneration.ts:104-105`.

**No new anti-patterns.** `d1fc0f745`'s 27 added lines contain no `TODO|FIXME|TBD|XXX|HACK|PLACEHOLDER`; the added comments are rationale comments of the form this phase uses throughout.

---

## R5. Counts — recomputed from the ledger's own row register, not from its summary

- Rows with a pair: 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12 = **11**; plus **5s** and **1s** = **13**. Row 5 (F17) contributes none and says so in three cells.
- OLD halves **cited** from 139: rows 2, 3, 4, 6, 8, 10, 11, 12 = **8**. OLD halves **re-run**: rows 1, 7, 9, 5s, **1s** = **5**. 8 + 5 = **13** ✓. NEW halves measured here = **13** ✓.
- Q and C counted as **one** pair (row 9's B/B′ precedent). Counting them separately would report 14 and overstate what ran — the conservative direction.

**Five records state 13 with identical derivations**, each read directly: ledger `:167`/`:169`, audit `2026-08-11-fake-guard-sweep.md:91`, `REQUIREMENTS.md:60`, `ROADMAP.md:488` + `:556`, and the **banner-amended** table in `142-06-SUMMARY.md:200-215`. The `142-06` amendment is a visible banner giving both the as-executed figure (12) and the current one (13) — not a silent rewrite.

**One stale-count residue found, outside the four propagation targets** — see finding **I-2**.

---

## Preserved from the first pass (re-confirmed, abbreviated)

Sections 1–10 of the first pass were re-checked by spot-check rather than re-read in full; none of their findings changed. Retained conclusions:

- **§1** All twelve remediated assertions are genuinely stronger, each with a "would 139's regression fail it?" answer of yes (or `N/A — by construction` for F17, which the record carries openly).
- **§2** The phase shipped **no** new wiring-only assertion. The only wiring-only assertions in scope (`idura.test.ts:90-91`, `signicat.test.ts:54-55`) are **pre-existing**, were never in the corpus, and the phase **found and filed** them (P-2 half 2).
- **§3** Every cell claiming a measurement taken in this phase has a log that exists and matches.
- **§6** F17's scoped exception survives scrutiny in all three propagation targets, and is now also stated in the ROADMAP Outcome's criterion-3 bullet with an explicit *"must not be rounded away"*.
- **§7** The four product changes are minimal; the operator-approved expansion is labelled as an expansion, not as drift.
- **§8** P-2 is recorded accurately and not overstated.
- **§9/§10** Open items are open, not quietly closed; A-10 is closed rather than left stale; B-1 is blocked and correctly recorded.

---

## Findings

### ~~⚠️ W-1 (WARNING — human decision requested)~~ → ✅ **CLOSED 2026-08-21 by `d1fc0f745` (assertions) + `a8c288a42` (record). Superseded.**

> **Original finding, preserved.** *Criterion 2's literal clause is unmet, and the residue it leaves is not on the record.* `packages/question-info/tests/questionTypes.test.ts:174-227` and `:231-291` — Configuration 2's two tests asserted only `toHaveLength(1)`, `data.questionId).toBe('ordinal-1')`, `data.infoSections).toBeDefined()`, `data.terms).toHaveLength(2)`: every one the canned payload the test itself handed the mock. No `capturedPrompts()` call appeared between `:173` and `:297`. Those exact sites (pre-phase `:199`, `:263`, `:264`) were three of the eleven the ledger lists as *"All eleven assertions passed blind"* — and they still passed blind. A-04's substitute fixture used **Boolean + Categorical only**, so after remediation **no assertion anywhere in the file observed an ordinal question's prompt** — landing on the branch D-01-iii flags as weakest. The gap was not the pair, which was genuine; it was the **record**: every other residue in this phase was written down, this one was not, and the ROADMAP Outcome addressed criteria 1/4/5 only.

**Closure verified — both halves, and neither on the summary's word:**

- **In code.** `d1fc0f745`, one file, **+27/−0**. Three prompt assertions at `:239`, `:246`, `:318`, across **both** ordinal tests. Read in source; judged non-hollow and non-self-referential (§ R1); each carries a measured red at its own line (§ R2); the file is green on the clean tree in this verifier's own run.
- **On the record.** `a8c288a42`. ROADMAP Outcome now addresses **all five** criteria — criteria 2 and 3 were previously unaddressed. Criterion 2's bullet states A-04's rejection and *why* the literal target would have shipped a new fake guard, names the substitute fixture, records that all three Configuration blocks now carry prompt assertions, and **names the residue** (D-01-iii's implicit scale semantics; D-01-i and D-01-ii open by design). Criterion 3's bullet keeps F17's `N/A — by construction` exception **intact and explicitly not rounded away**. Ledger row 1s exists with all nine columns, a full per-row narrative, and a residue note on row 1 explaining why Configuration 2 was left uncovered. Counts reconciled to 13 across five records.
- **The disposition offered was either/or; the operator took both.** That is more than the finding required.

### ~~ℹ️ W-2 (INFO) — stale plan attribution in a closed todo~~ → ✅ **CLOSED 2026-08-21 by `a8c288a42`. Superseded.**

> **Original finding, preserved.** `.planning/todos/done/playwright-config-bank-auth-doc-drift.md:52` read *"RESOLVED — 2026-08-21, Phase 142 (`142-05`, commit `f4e0fc1ec`)"*. The commit is `docs(**142-04**)` and `142-04-PLAN.md:5` is `wave: 5` — the todo confused wave 5 with plan 05.

**Closure verified.** The line now reads *"Phase 142 (`142-04`, executed as wave 5, commit `f4e0fc1ec`)"* — both facts, correctly distinguished. Cross-checked against `git log` and `142-04-PLAN.md:5`.

### ℹ️ I-1 (INFO) — injection liveness is transcribed, not logged — **CARRIED FORWARD, unchanged**

No log body contains the `INJECTED (142)` marker, so a log alone cannot prove an injection was live when its run was taken; that rests on the ledger's `git diff`-while-live transcription plus the three-condition post-gate. This now applies to injections **Q** and **C** as well. Corroborating signals exist (Q's red quotes a prompt with an **empty** `## The question's type:` section while the choices line is still populated — a state only the live injection produces). Recorded as a structural limit of the apparatus, not a defect. The W-1 pass did improve it in one respect: its vitest logs carry an appended `EXITCODE=` line, which the phase's earlier vitest logs lacked.

### ℹ️ W-3 (INFO — new this pass) — one stale line reference inside a corrected record

`ROADMAP.md:507` states the **current** file state — *"all three Configuration blocks carry assertions … Configuration 1 at `:113`, Configuration 2 at `:239`/`:246`/`:318`, Configuration 3 at `:423-424`"* — but `:423-424` are the **pre-`d1fc0f745`** line numbers. At HEAD those two assertions are at **`:450-451`**; `:423-424` now land on `},`/`{` inside a mock payload, which is the very shape the sentence is disclaiming. The other three references in the same sentence are HEAD-correct, so the sentence mixes two numberings.

The substantive claim is **true and verified** — Configuration 3 does carry `toContain('Morning person')` and `toContain('Night person')` on the composed prompt. This is a misleading pointer, not a false claim. **Suggested fix:** `:423-424` → `:450-451` at `ROADMAP.md:507`.

*(The ledger's own `:423-424` / `:649` citations at rows `1s` register and `:444` are **correct as written** — they describe the OLD-half run, whose HEAD (`1453a4106`) the row declares. A parenthetical "(OLD-tree numbering)" would remove the ambiguity but nothing there is wrong.)*

### ℹ️ I-2 (INFO — new this pass) — two superseded "12 pairs" references remain in `STATE.md`

`STATE.md:11` (`last_activity_desc`) and `STATE.md:36` both state *"12 pairs"* / *"12 negative-control pairs (11 … + 1 …)"*. A repo-wide grep finds **no other** stale count: ledger, audit, `REQUIREMENTS.md`, `ROADMAP.md` and the amended `142-06-SUMMARY.md` all say **13** with identical derivations.

**Not classified as a gap**, for three reasons: `STATE.md` is not one of the phase's D-18 propagation targets; both entries are explicitly dated narrations of the **`142-06` close event**, at which point 12 was the correct figure; and the file pins `state_head: f5280fd86`, four commits behind HEAD, so the whole entry is a declared snapshot. It is recorded because a reader grepping the repo for the pair count today gets two answers, and this phase's own subject is record accuracy. **Suggested fix:** the next state write refreshes it; or append *"(13 after the W-1 gap-closure pass, 2026-08-21)"*.

---

## E2E — deliberately not re-run for the gap-closure pass. **Judged sound; stated explicitly, not left as an unverified gap.**

The claim was checked rather than accepted:

```
git diff --name-only 1453a4106 HEAD
  → 7 paths under .planning/  +  packages/question-info/tests/questionTypes.test.ts
git diff --stat 1453a4106 HEAD -- apps packages tests
  → packages/question-info/tests/questionTypes.test.ts | 27 ++++++++
```

**Zero product source changed since the gate head.** The tree the three gates (D-14, D-16, A-05) ran against at `1453a4106` is byte-identical to HEAD's outside one unit-test file and the `.planning/` directory. That file is a vitest test in a package the frontend build never bundles, and nothing it touches can reach a browser. Re-running an 11-minute E2E suite plus an 11-minute bank-auth suite would have re-measured an unchanged tree.

**And the relevant gate *was* re-run:** the root `yarn test:unit` gate — the one that actually covers the changed file — ran green after the assertion commit, with `@openvaa/question-info:test:unit` verified force-executed rather than cache-served. This verifier additionally ran the package suite itself.

Under the project's cardinal E2E rule, "not re-run because nothing it covers changed, and the gate that does cover the change was re-run" is not a skipped failing test. **Sound.**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity |
|---|---|---|---|
| — | — | **none found** | — |

Working tree clean; `grep -rn 'INJECTED' apps packages tests` → 0 hits.

---

## Gaps Summary

**None. No blockers, no gaps, no open findings.**

The phase goal is achieved and the one thing that previously held it back is closed. All twelve findings are remediated with assertions read and judged stronger; **thirteen** negative-control pairs are recorded with logs that exist and match verbatim; zero withdrawals, stated rather than implied; F17's exception is scoped, pre-predicted and visible in four records; no § 8.3 prohibition was used as a control — including R-2, whose re-derivation on the post-D-01 tree was adjudicated from 139's own text and holds; the four product changes are minimal with the operator-approved expansion labelled as such; the gates ran with exit codes, counts and a preflight verifying **this** working tree.

**W-1 was a real gap and the record now shows it as found and closed.** The gap-closure pass did the harder of the two dispositions offered and did it through the same apparatus the phase enforces — an assertion with a measured negative control on both halves, rather than an assertion asserted to be sufficient. The single measurement that most deserved independent confirmation (`2 failed | 7 passed` with both Configuration 2 tests green under choices-emptied) was confirmed against the log, line by line.

Two INFO items (**W-3**, **I-2**) are record-hygiene nits with exact one-line fixes; neither bears on a success criterion. Carried forward unchanged and still open: **P-1**, **P-2**, **D-19 i/ii/iii**, the three **D-01 exclusions**, **B-1** (`.env.example` — this verifier reproduced the permission deny, so the executors' refusal to route around it is corroborated a second time), and **I-1**.

---

_Verified: 2026-08-21T10:22:50Z at `a8c288a42` (re-verification; first pass 2026-08-21T09:42:27Z at `1453a4106`)_
_Verifier: Claude (gsd-verifier) — source and logs read directly; `142-W1-SUMMARY.md` claims not accepted as evidence_
