# Phase 142 — ASSERT-07 Negative-Control Ledger: every remediated assertion, run RED under the regression Phase 139 recorded

**Twelve findings, one apparatus, one machine.** Phase 139 ran the *first* half of a negative-control
pair for each of these findings: it injected a regression into the shipped code and observed the
existing assertion stay **green**. That green is the proof of blindness. This ledger owes the *second*
half: the assertion is strengthened, **the same recorded diff** is re-applied, and the run must go
**red**. A finding whose NEW-half run did not execute keeps its `pending` cells and carries **no**
verdict — never a confirmed one — because a test that did not run counts as a failure, not a pass
(`CLAUDE.md` § E2E Hard Rule, generalised; `139-VERDICTS.md:5-9`).

- **Phase:** 142 (assertion-design-wiring-only-tests-assert-output)
- **Requirement:** ASSERT-07
- **Opened by:** `142-03-PLAN.md` (wave 1). Every row is created here, before the phase's first
  injection; each row is *filled* by the plan that owns its finding (D-17 partitioning, A-08 order).
- **Corpus:** exactly **12** findings (**D-00**). F19a/b/c are ASSERT-03's class, delivered by the
  closed Phase 140, and are **not** in this corpus.
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused verbatim (**D-07**); the two-column
  and collateral rules from § 3.2 / § 3.3, carried **inverted** (**D-08**).
- **Baseline for cited OLD halves:** Phase 139's measurements, taken at commit `12825b479`
  (`139-VERDICTS.md` § 2 environment stamp, 2026-08-14).
- **HEAD at ledger creation:** `4a8568d8c` — branch `feat-gsd-roadmap`. Each row records the HEAD its
  own NEW-half run was taken at, which may be later than this one as the phase lands durable edits.
- **Machine:** developer Mac, host Node + host vitest via `npx`, runs issued from inside each workspace
  directory. macOS 26.5.1 arm64 / Darwin 25.5.0 / Node v24.14.1. No container: this ledger records
  vitest exit codes and assertion messages only, never a visual baseline, so the milestone's container
  rule for baselines does not apply.
- **Resolved `$TMPDIR`:** `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/` — so every
  `${TMPDIR:-/tmp}/gsd-142/…` log reference below resolves to
  `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-142/…`. Recorded here for the same reason 139
  recorded its own (`139-VERDICTS.md` § 2): a log path that cannot be resolved later is not evidence.
- **Decisions discharged:** D-00 (the corpus is these 12), D-06 (cite 139's OLD half, with exceptions),
  D-07 (HYGIENE-LOOP verbatim), D-08 (two-column + collateral rules, inverted), D-09 (this ledger, its
  nine columns, and the write-all-rows-first ordering guarantee), D-10 (carry the qualified injections
  and the ten prohibited designs into plan text), D-13 (the withdrawal bar), A-06 (F17's honest
  `N/A — by construction` cell plus a supplementary pair), A-09 (guard the `mock.calls` dereference).
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-ASSERT10-LEDGER.md`
  (document shape) and
  `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md`
  (per-finding record depth, and the source of every injection re-applied here). 141's ledger named
  `141-RESEARCH.md` as its template and `138-NEGATIVE-CONTROL.md` as its precedent; 139 named
  `138-NEGATIVE-CONTROL.md`, which named `137-NEGATIVE-CONTROL.md`, which named
  `136-VISUAL-DISCRIMINATION-EVIDENCE.md`. This document continues that chain.

---

## ⚠ THE INVERSION — read this before reading any row

**In Phase 139 a green under injection was the finding. In Phase 142 a RED is the success signal.**

- The **`NEW-assertion outcome`** column is *expected: **FAIL (red)***. That red **is** the evidence.
- A **green** NEW half is a **failure of the remediation**, not a success. It means the strengthened
  assertion is still blind to the regression its own title promises to catch.
- The **`File outcome`** column may read red for *collateral* reasons, and it is a **separate cell**
  (D-08). Separating them is precisely what stops a collateral red being credited as the negative
  control.
- A red **on the wrong axis** — a `TypeError` from dereferencing an unpopulated `mock.calls[0]`, an
  unrelated sibling matcher, a whole-file collection error — is **not** creditable. Only a red that
  names the strengthened assertion may fill the `NEW-assertion outcome` cell. A-09's
  `toHaveBeenCalledTimes` / length guard before any `mock.calls` dereference exists to keep this axis
  clean.

An executor pattern-matching on 139's record will otherwise read a correct remediation as a regression
and "fix" it by weakening the assertion. That is `142-RESEARCH.md` § Pitfall 1, and it is the single
most likely way this phase produces worthless evidence.

---

## Citation vs measurement — the clause that keeps this ledger honest

`141-ASSERT10-LEDGER.md:47-52` states that its template document *"is never the source of truth for any
outcome here — its rows were re-run, not copied."* **142's analogue is subtler, and it must be written,
because D-06 expressly *permits* citing 139's OLD half.**

The rule, therefore:

1. Every row's **`OLD half`** cell states, explicitly, one of two things:
   - **`cited — 139 § 5.N.4 (…)`** — the OLD-half green was **measured by Phase 139 at `12825b479`**,
     not by this phase. It is a citation. It is legitimate evidence under D-06 *only* because the
     target file is unchanged by this phase for any non-assertion reason.
   - **`re-run — <log path>`** — the OLD half was **measured here**, and the log path is given.
2. **A citation is never written in the voice of a measurement.** No row may say "observed PASS"
   without saying, in the same cell, *who* observed it and *when*. Where the phrase "assertion PASS,
   file green" appears next to `cited`, it is a report of 139's recorded observation, not of a run
   performed in Phase 142.
3. Three rows are **re-run** exceptions under D-06's own clause (*"any further file the phase changes
   for a non-assertion reason joins this list"*): **row 1 (F15-A)** because D-01 changes
   `question-info`'s product source, **row 7 (F20-1)** because D-02 changes the authorize endpoint, and
   **row 9 (F20-3)** because A-07 changes `getIdTokenClaims.ts` to add a discriminating error code.
   Row 9 is a **third** exception beyond the two named at CONTEXT time; the derivation is recorded in
   its row section below rather than left implicit.
4. The **`NEW-assertion outcome`** cell is **always** a measurement taken in this phase, never a
   citation. There is no NEW-half citation anywhere in 139's record to borrow — that is the entire
   reason this phase exists.

---

## A note on "the first line of output" — this transcript is not doctored

`141-ASSERT10-LEDGER.md:60-71` discloses that the literal first line of each of its runs is dotenv's
banner, and that the recorded "first line" is the first *verdict-bearing* one. 142's equivalent
disclosure, for vitest:

- Every `npx vitest run` emits a **`RUN  v3.2.4 <workspace path>`** banner first, followed by a blank
  line. It carries no verdict.
- Frontend-workspace runs (`apps/frontend`, rows 5, 7, 8, 9) additionally emit a **vite / vite-plugin-svelte
  warning block** before any test output.
- Where a row quotes runner output, the quotation therefore begins at the first **verdict-bearing**
  line — the `✓`/`×` file line, the `FAIL` line, the `AssertionError` block, or the
  `Test Files … / Tests …` summary — with the banner and any plugin preamble filtered. This is stated
  rather than silently elided, because a reader reproducing a row will see the banner first and should
  not conclude the transcript was trimmed to flatter it.
- **Isolated verdict runs must have their counts checked.** A `-t '<title>'` filter that matches
  nothing reports `1 passed | N skipped`, which is exactly what a *typo in the title* looks like
  (`142-RESEARCH.md` § Pitfall 6; 139 recorded `27 tests | 26 skipped`, `Tests 1 passed`). Every row
  using an isolated run states the observed counts.

---

## Row register

Nine columns, per **D-09**, in this order:
`# · Finding · Site · Injection source (§ 5.N.2) · OLD half (cited/re-run) · NEW-assertion outcome · File outcome · Collateral · Verdict`.

That is **nine columns against the analog's five** (`141-ASSERT10-LEDGER.md:75-88` uses
`Row · Branch · Injection site · Exit · Outcome`). The width is deliberate and locked: the separate
**`NEW-assertion outcome`** and **`File outcome`** cells are **D-08's two-column rule**, and keeping
them apart is what stops a collateral red — a sibling matcher, an unrelated test in the same file —
being credited as the negative control. Merging them would collapse both into the process exit code,
which is the failure mode 139 § 3.2 was written to prevent.

**Ordering guarantee (D-09, inherited from 139):** all twelve rows were written, with every measurement
cell reading `pending`, **before the phase's first injection ran**. A finding may be visibly *unfilled*;
it may never be silently *absent*. The two **supplementary** rows — `5s` (A-06, pre-registered at
planning) and `1s` (added 2026-08-21 to close verification finding **W-1**) — were necessarily written
later than that, since neither is a *finding* of the corpus; each says on its own face when and why it
was opened, so a later reader does not mistake either for a row that was silently back-filled.

| # | Finding | Site | Injection source (§ 5.N.2) | OLD half (cited/re-run) | NEW-assertion outcome | File outcome | Collateral | Verdict |
|---|---------|------|----------------------------|-------------------------|-----------------------|--------------|------------|---------|
| 1 | **F15-A** | `packages/question-info/tests/questionTypes.test.ts:84,139,199,263,323,386-388,532,535-537` | 139 § 5.1.2 — the **substitute** injection at `infoGeneration.ts:76`; **never** the audit's own sentence (§ 8.3 **R-2**, un-injectable, zero delta) | **re-run** (D-06 exception — D-01 changes the file) — **GREEN (blind) ✅** exit **0**, `Tests 7 passed (7)`, every one of the eleven assertions PASS with the question text emptied; reproduces 139 § 5.1.4 exactly — `${TMPDIR}/gsd-142/F15-A-OLD-1.log` | **FAIL (red)** ✅ — **T1 specifically**, at `questionTypes.test.ts:113:36`, `AssertionError: expected '…' to contain 'Do you support universal healthcare?'`, exit 1. T2/T3 **green** under this injection as predicted (types and choices still differ when the name is emptied) | **FAIL** — `Tests 1 failed \| 8 passed (9)` | **none** — package-wide `1 failed \| 21 passed (22)`; `api.test.ts` fully green, the only red is the strengthened assertion | **remediated** |
| 1s | **F15-A — supplementary — Configuration 2 (W-1 closure)** | `packages/question-info/tests/questionTypes.test.ts:174-247` (5-point) and `:251-320` (7-point); pre-phase `:199`, `:263`, `:264` — **three of row 1's own eleven blind sites** | **new** injection, only available post-D-01: **Q** = `questionType: ''` at `infoGeneration.ts:104`; **C** = `choices: ''` at `:105`. **Not** 139 § 5.1.2's substitute, which empties the question *name* and therefore cannot red a type/choices assertion (row 1 records T2/T3 green under it) | **re-run** — a new injection, outside D-06's citation rule; **both halves measured here**. **GREEN (blind) ✅** under **both**: Q → whole file exit **0**, `Tests 9 passed (9)` (`F15-A-W1-OLD-Q-1.log`); C → verdict run exit **0**, `Tests 2 passed \| 7 skipped (9)` (`F15-A-W1-OLD-C-1.log`) | **FAIL (red)** ✅ — **both axes, each naming its own assertion**: **Q** → `questionTypes.test.ts:239:22`, `expected '…' to contain 'singleChoiceOrdinal'`, exit 1; **C** → `:246:22` (5-point) **and** `:318:36` (7-point), `… to contain 'Very dissatisfied, Dissatisfied, Neut…'` / `'Strongly disagree, Disagree, Somewhat…'`, exit 1 | **FAIL** — **Q:** `Tests 1 failed \| 8 passed (9)`. **C:** verdict `2 failed \| 7 skipped (9)`, whole file `4 failed \| 18 passed (22)` package-wide | **Q: none** — the sole red is the new assertion. **C:** the two **pre-existing** choices assertions at `:423-424` and `:649` also red — sibling coverage, **never** credited as either half | **remediated** |
| 2 | **F15-B** | `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:131-142,184-185` → strengthened at `:154-160`; E9's site at `:137` **deleted** | 139 § 5.2.2 at `condenser.ts:205` | **cited** — 139 § 5.2.4 (assertion PASS, file green) | **FAIL (red)** ✅ — `condenserStandalone.test.ts:155:35`, `AssertionError: expected [] to have a length of 2 but got +0`, exit 1 | **FAIL** — `Tests 1 failed \| 2 passed (3)` | **none** | **remediated** |
| 3 | **F15-C** | `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:139-145,215-219,268-274` → content assertions added at `:162-167`, `:245-251`, `:310-315` | 139 § 5.3.2 at `condenser.ts:205` (**shared with row 2** — one injection instance, two vehicle runs, one revert) | **cited** — 139 § 5.3.4 (assertion PASS in all three clusters, file green) | **FAIL (red)** ✅ — **all three clusters**: `:163:82`, `:246:82`, `:311:82`, each `expected [ [], … ] to deeply equal [ [ 'Test argument 1', …` , exit 1 | **FAIL** — `Tests 3 failed \| 2 passed (5)` | **none** — the visualization test at `:372` (139 cited `:331`) stayed **green**; `setFinalArguments` runs at `condenser.ts:195`, *before* the injected return | **remediated** |
| 4 | **F16** | `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68` → strengthened at `:98`, non-empty `entities` fixture added at `:61-78` | 139 § 5.4.2 **injection B** at `api.ts:119-121` (D-10; injection A is the audit's sentence and reds before *and* after) | **cited** — 139 § 5.4.4 row B (assertion PASS, file green) | **FAIL (red)** ✅ — `expected [Function] to throw error including 'Unsupported language: lol' but got 'Cannot read properties of undefined (…'`, exit 1 | **FAIL** — `Tests 1 failed (1)` (the file holds one test) | **none** — measured package-wide: `1 failed \| 29 passed (30)` | **remediated** |
| 5 | **F17** | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95` → renamed `EntityListWithControls.helpers.test.ts` (D-04) | 139 § 5.5.2 — the `$effect` re-run storm at `EntityListWithControls.svelte:129` | **cited** — 139 § 5.5.4 (assertion PASS, file green 8/8) | **`N/A — by construction`** (A-06; see § Scoped exceptions) | **`N/A — by construction`** — 139 § 5.5.2's injection was **not applied**; the renamed file is **green 8/8** on the clean, reverted tree (`F17-postrevert.log`, exit 0) | **`N/A`** — no injection applied for this row | **remediated** — D-04's four items all landed (`a25355369`); a **pre-predicted, scoped exception** to criterion 1, **not** a withdrawal |
| 5s | **F17 — supplementary — not 139 § 5.5.2** | `EntityListWithControls.helpers.test.ts` (post-rename), against `EntityListWithControls.helpers.ts:19` | **new** injection (A-06): discard the filter group's result while still invoking it | **re-run** — a new injection, outside D-06's citation rule; **both halves run here**. **GREEN (blind) ✅** — isolated `-t 'Contract 4'` verdict run, exit **0**, `Tests 1 passed \| 7 skipped (8)` — `F17-supp-OLD-1.log` | **FAIL (red)** ✅ — `EntityListWithControls.helpers.test.ts:129:24`, `AssertionError: expected [ [ { name: 'A' }, …(2) ], …(9) ] to deeply equal [ [], [ { name: 'A' }, …(2) ], …(8) ]`, exit 1, `Tests 1 failed \| 7 skipped (8)` — `F17-supp-NEW-1.log` | **FAIL** — whole file `Tests 2 failed \| 6 passed (8)` — `F17-supp-NEW-collateral-1.log` | **C-142-1 at `EntityListWithControls.helpers.test.ts:98:63`** — the pre-existing `Contract 3` sibling, red in **both** halves. **Never** credited as either half | **remediated** |
| 6 | **F18** | `packages/dev-seed/tests/templates/default.test.ts:121-135` → rewritten `:121-169` | 139 § 5.6.2 at `candidates-override.ts:53` (`LOCALE_BLOCK_SIZE` 109 → 327) | **cited** — 139 § 5.6.4 (assertion PASS, file green) | **FAIL (red)** ✅ — **two independent axes**: `:151:36` (`327` vs `109`) and `:167:43`/`:168:42` (en name where a `fi` name is owed), exit 1 | **FAIL** — verdict run `1 failed \| 26 skipped (27)`; collateral run `1 failed \| 26 passed (27)` | **none** | **remediated** |
| 7 | **F20-1** | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:234` (139 cited `:233`; **+1 drift**) | OLD half: 139 § 5.10.2 **injection B** at `+server.ts:52`. NEW half: **injection A** at `+server.ts:22`, per **A-03** | **re-run** (D-06 exception — D-02 changes the file; and post-fix injection B is off-path, so the OLD half is measurable *only* on the pre-fix tree) — **GREEN (blind) ✅** exit **0**, `Tests 9 passed (9)` under injection **B** on the pre-fix tree; reproduces 139 § 5.10.4 row B exactly — `${TMPDIR}/gsd-142/F20-1-OLD-B-1.log` | **FAIL (red)** ✅ — injection **A** @ `:22` post-fix, `authorize-endpoint.test.ts:240:5`, `- "status": 400` / `+ HttpError { "status": 500 }`, exit 1. A-03's `[DERIVED]` prediction **confirmed by measurement**. Supplementary **B** @ `:52` post-fix **PASS** 9/9 — labelled **`not the negative control`**, evidence the swallow is gone | **FAIL** — `Tests 1 failed \| 8 passed (9)` | **none** — the sole red **is** the target assertion | **remediated** |
| 8 | **F20-2** | `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36` → strengthened at `:39` | 139 § 5.11.2 at `overrides.ts:36` | **cited** — 139 § 5.11.4 (assertion PASS, file green 7/7) | **FAIL (red)** ✅ — `overrides.test.ts:39:20`, `AssertionError: expected '' to be '{broken, plural, }' // Object.is equality`, exit 1 | **FAIL** — `Tests 1 failed \| 6 passed (7)` | **none** — exactly the one test that reaches the catch arm red | **remediated** |
| 9 | **F20-3** | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259` | 139 § 5.12.2 — injection **A** at `getIdTokenClaims.ts:39-46` and injection **B** at `:29`. Control **C** is forbidden (§ 8.3 **R-9**) | **re-run** (D-06 exception — A-07 changes the file; see row section for the derivation) — **both sites GREEN (blind) ✅** under **A** (file **FAIL** `3 failed \| 2 passed (5)`, C-5 collateral) and under **B** (file **green** 5/5, zero collateral); reproduces 139 § 5.12.4 rows A and B exactly — `${TMPDIR}/gsd-142/F20-3-OLD-A-1.log`, `F20-3-OLD-B-1.log` | **FAIL (red)** ✅ — **both sites, each under its own branch's regression**: relocated **B** reds `:268:22` alone, symmetric **B′** reds `:241:22` alone, each green under the other's. ⚠ **Injection A DIVERGED — zero-delta on both sites post-fix** (both fixtures throw before the injected success return is reachable), so it is **not** this row's negative control; see the row section | **FAIL** — `Tests 1 failed \| 4 passed (5)` under **B** and under **B′** | **none** under B/B′. **Under A: C-5** at `:147:30`, `:174:30`, `:203:30` — three success-path tests, none a site | **remediated** |
| 10 | **F20-4** | `packages/dev-seed/tests/supabaseAdminClient.test.ts:160` (139 cited `:151`; **+9 drift**) → strengthened at `:169` | 139 § 5.13.2 at `supabaseAdminClient.ts:708` (drop the `id` column from `.select(...)`) | **cited** — 139 § 5.13.4 (assertion PASS, file green) | **FAIL (red)** ✅ — `supabaseAdminClient.test.ts:169:40`, exit 1 | **FAIL** — `1 failed \| 6 passed (7)` | **none** | **remediated** |
| 11 | **F20-5** | `packages/data/src/objects/nominations/variants/variants.test.ts:5-12` → rewritten `:5-35`, strengthened at `:21` (length) and `:33` (membership) | 139 § 5.14.2 — injection **A** at `variants.ts:94` and injection **B** at `:100` | **cited** — 139 § 5.14.4 (both PASS, file green 1/1) | **FAIL (red)** ✅ — **both, on different axes**: **A** → `variants.test.ts:21:26`, `expected [] to have a length of 35 but got +0`; **B** → `variants.test.ts:33:25`, `expected [ 'election-1', 'election-2' ] to include 'WRONG-ELECTION-ID'`. Exit 1 each | **FAIL** — `Tests 1 failed (1)` under each injection (the file holds one test) | **A:** 7 further tests in 4 sibling files. **B:** 11 further tests in 8 sibling files. Measured package-wide, **never** credited as the assertion cell | **remediated** |
| 12 | **F20-6** | `packages/argument-condensation/tests/unit/planValidation.test.ts:104` → strengthened at `:111-113`; `:94-96` byte-unchanged (D-05) | 139 § 5.15.2 at `planValidation.ts:169` | **cited** — 139 § 5.15.4 (assertion PASS in isolation; the whole-file FAIL is C-1 collateral at `:94`, **not** the verdict) | **FAIL (red)** ✅ — **ISOLATED run only**: `planValidation.test.ts:111:62`, `expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'`, exit 1, `Tests 1 failed \| 9 skipped (10)` (exactly 1 matched the filter) | **FAIL** — whole file `Tests 2 failed \| 8 passed (10)`; **two** reds, only one of which is the assertion cell's | **C-1 at `planValidation.test.ts:94:62`** — the sibling pinning the *old* message, a second test through the same throw. **Never** credited as the negative control | **remediated** |

### Final counts — the numbers all four records must agree on

These are the figures propagated to `.planning/audits/2026-08-11-fake-guard-sweep.md`,
`.planning/REQUIREMENTS.md:60` and `.planning/ROADMAP.md` (D-18). **Three targets that disagree are
worse than one that is silent, because each looks authoritative** — so they are derived here, once,
from the register above.

| Count | Value | Derivation — what the number actually means |
|---|---|---|
| **Findings in the corpus** | **12** | D-00. F19a/b/c are ASSERT-03's class, closed by Phase 140, and are **not** here |
| **Remediated** | **12** | every row's `Verdict` reads `remediated` — rows 1-12 plus the supplementary 5s |
| **Withdrawn** | **0** | D-13's bar was never met. **F17 is NOT a withdrawal**: it is remediated, and its exception concerns the *negative control's availability*, not the remediation |
| **Negative-control pairs executed** | **13** | **11** under 139's own pre-specified regression — rows 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12 — **plus 2 supplementary pairs**, at rows **5s** and **1s**. It is **not** simply "13 = one per finding": **row 5 (F17) contributes NO pair**; row 5s contributes one under a *new* injection; row **1s** contributes a second pair for **F15-A**, added after this phase's verification raised **W-1** (Configuration 2 carried no prompt assertion, so three of row 1's eleven blind sites were still blind). 11 + 1 + 1 = 13 |
| ↳ of which OLD half **cited** from 139 § 5.N.4 | **8** | rows 2, 3, 4, 6, 8, 10, 11, 12 |
| ↳ of which OLD half **re-run** in this phase | **5** | rows **1**, **7**, **9** (D-06 exceptions — the phase changes those files for non-assertion reasons) and **5s**, **1s** (new injections, outside D-06's citation rule, so both halves are measured here) |
| **NEW halves measured in this phase** | **13** | *every* one. There is no NEW-half citation anywhere in 139's record to borrow — that is the entire reason this phase exists |
| **Scoped exceptions to ROADMAP criterion 1** | **1** | **F17 / row 5 only.** Pre-predicted by 139 § 5.5.6, independently forbidden by § 8.3 R-10. **Do not round it away** — its visibility is the point |

**Four measurements sit beside the thirteen pairs and are deliberately NOT counted as pairs**, because
each would inflate the total if it were:

1. **Row 5's own cells** read `N/A — by construction`, not a pair. Counting F17's *finding* as a pair
   would make the total 13 for the wrong reason and hide the exception.
2. **Row 7's supplementary injection B post-fix** passes 9/9 and is labelled **`not the negative
   control`**. It is evidence the 4xx swallow is gone — a *third* measurement on that row, not a
   second pair.
3. **Row 9's B′** is the *symmetric relocation* of B, not an extra pair: B and B′ together are the one
   pair that proves F20-3's **two** sites are genuinely discriminated, each red **alone** under its own
   branch and green under the other's. One red would have left one site's assertion asserted rather
   than measured.
4. **Row 1s's two injections, Q and C, are ONE pair, not two** — the same shape as row 9's B/B′. Both
   halves of that pair were measured under **both** injections, and the two injections exist because the
   row adds assertions on **two** axes (the type string, and the choice labels that alone separate a
   5-point from a 7-point ordinal — D-01-iii). Counting them separately would report 14 and overstate
   what was executed.

**Line-number drift (A-01, `142-RESEARCH.md` § A.4):** ten of the twelve sites are unmoved since
`12825b479`; **F20-1 moved +1** and **F20-4 moved +9**, both from Phase 151's comment-hygiene codemod,
which changed no assertion. **Every injection in this phase is located by CONTENT, never by line
number.**

---

## Per-row records

Each row below is filled by the plan that owns its finding. Until then it carries its known columns and
its `pending` cells, per D-09.

### Row 1 — F15-A · `questionTypes.test.ts` (10 + 1 mock-in/mock-out sites)

**Owned by:** plan `142-01` (wave 4, `autonomous: false` — carries D-01's product fix).
**Injection (139 § 5.1.2):** the **substitute** at `infoGeneration.ts:76`. 139 § 5.1.6 records that the
regression the audit *names* does not exist in the package's `src/` at all, which is itself stronger
evidence for the finding than any injection; § 8.3 **R-2** forbids using the audit's sentence, because
the grep for it exits 1 with no output — a zero-delta "injection".
**OLD half — `re-run`.** D-01 changes `packages/question-info/src/` product source, so 139's citation
is invalidated **for this finding specifically**. Per A-08 the OLD half must be measured **against the
pre-fix tree**, before the product change and before the assertion edit — after the edit there is no
OLD assertion left to run.
**⚠ A-04 constraint carried:** 139 § 5.1.6's headline target 2 ("the three Configurations' prompts
differ") **passes today for the wrong reason** and must **not** be written — it would be a new fake
guard shipped by the phase whose purpose is removing them. A **new fixture** holding question text
constant and varying only `type` is required.

**OLD half — MEASURED HERE, 2026-08-20, at HEAD `68d5669c3`** (not cited). The tree was verified clean
(`git status --porcelain -- apps tests packages` empty) and `questionTypes.test.ts` verified
byte-identical to HEAD (`git diff --exit-code HEAD -- …` exit 0) **before** the injection, so no
assertion had been strengthened when this was taken. Clean-tree baseline first:
`Tests 7 passed (7)`, exit 0 (`${TMPDIR}/gsd-142/F15-A-OLD-0-cleantree.log`).

Injection applied by content, `git diff` taken while live — byte-identical to 139 § 5.1.2's substitute:

```
         const variables: Record<string, unknown> = {
-          question: question.name,
+          question: '', // INJECTED (142): the prompt no longer carries the question at all
           generalInstructions: GENERAL_INSTRUCTIONS,
```

**Result: GREEN.** `${TMPDIR}/gsd-142/F15-A-OLD-1.log` — exit **0**, `Test Files 1 passed (1)`,
`Tests 7 passed (7)`. **All eleven assertions passed blind** — `:84`, `:139`, `:140`, `:199`, `:263`,
`:264`, `:323`, `:386`, `:387`, `:388`, `:532`, `:535-537` — while the composed prompt carried **no
question at all**. In production that injection asks the LLM about nothing; the file could not tell.
This **reproduces** 139 § 5.1.4's recorded value (assertion PASS on all eleven, file green 7/7) rather
than borrowing it: the count matches (7/7) and no assertion diverged.

**Collateral, measured package-wide rather than assumed:** `${TMPDIR}/gsd-142/F15-A-OLD-collateral-1.log`
— `Test Files 2 passed (2)`, `Tests 20 passed (20)`, exit 0. The sibling `api.test.ts` is blind to the
same regression too. So the whole package, not merely the eleven named sites, passes with the question
removed from the prompt. Recorded because it is a stronger statement of the finding than the row's own
scope, and because "none" would have understated it.

**Post-gate after revert:** all three conditions held — per-path `git status --porcelain` empty, scoped
`-- apps tests packages` empty, and `grep -rn 'INJECTED (142)' apps packages tests` no hits. Post-revert
run green `Tests 20 passed (20)`, exit 0 (`${TMPDIR}/gsd-142/F15-A-OLD-postrevert.log`).

**The product fix (D-01), landed between the halves.** Commits `0bc21e3b3` (the two prompt variables
plus the three `en/` YAML declarations and placeholders) and `0b15c5e86` (hoisting the type guard above
`generateInfo`'s `try`, found in operator review — the catch was re-wrapping the guard's message into
`Error generating question info: Error: [question-info] …`). Test commits `0d3700e58` and `80acc432c`
are separate, so product and assertions revert independently.

**T2 and T3 were RED before the fix and GREEN after — measured with THIS plan's own fixture, not cited
from research.** The product source alone was rolled back to `68d5669c3` while the strengthened test
file stayed at HEAD:

- **T2** — `${TMPDIR}/gsd-142/F15-A-T2T3-prefix.log`, exit 1, `questionTypes.test.ts:646:33`,
  `AssertionError: expected '…' not to be '…' // Object.is equality`. The two prompts for a
  same-name/different-type pair were **byte-identical**, which is the defect D-01 exists to close.
- **T3** — `${TMPDIR}/gsd-142/F15-A-T3-prefix.log`, exit 1,
  `AssertionError: expected '…' to contain 'Yes, lower it to 16'`. Measured with T2 transiently muted,
  because T2 fails first and T3 would otherwise never execute. The mute was reverted immediately and
  the file re-verified byte-identical to HEAD.

**⚠ A-04 discharged, and verifiable by grep.** 139 § 5.1.6's headline target 2 — pairwise inequality
across the three existing Configuration blocks — is **not** in the file. The only `not.toBe` is at
`:646`, inside the NEW same-name/varying-type fixture. Those three blocks use *differently-named*
questions, so comparing their prompts passes today for the wrong reason; writing it would have shipped a
new fake guard out of the phase whose purpose is removing them.

**D-03 discharged — the transform is NOT identity, and is now asserted.** `responseTransformer.ts:24-51`
was inspected: it keys `data.questionId` off `question.id` (`:30`), discriminates `infoSections` vs
`terms` by `in` (`:26-27`), and **renames three provider fields** — `llmResponse.latencyMs →
llmMetrics.processingTimeMs`, `attempts → nLlmCalls`, `response.modelId → metadata.modelsUsed[0]`
(`:38-46`). None was asserted anywhere in the file. The `:535-537` tautology is repointed onto exactly
those three (now `:580-582`). The `questionId` mapping was deliberately **not** re-asserted — it is
already covered at `:83`, `:322` and `:527-529`, so re-asserting it would duplicate rather than repoint.
**This does not contradict D-11 E9:** `processingTimeMs` in this package is *not* wall clock — the
transformer copies the mock's `latencyMs` verbatim — so pinning it asserts a rename, which is product
logic. Stated inline in the test so a later reader does not delete it as E9-class decoration.

**D-05 discharged.** The unlisted sibling at `:388` gained a prompt-content assertion on the question's
own choice labels, **paired with** its existing count rather than replacing it.

**Injection confirmation, `git diff` taken while live** — byte-identical to the OLD half's and to
139 § 5.1.2's substitute:

```
         const variables: Record<string, unknown> = {
-          question: question.name,
+          question: '', // INJECTED (142): the prompt no longer carries the question at all
```

**The red, on-axis and NAMED.** `${TMPDIR}/gsd-142/F15-A-NEW-1.log` — exit **1**,
`Tests 1 failed | 8 passed (9)`. The single red is **T1**, at `questionTypes.test.ts:113:36`:
`AssertionError: expected '\n\nYou are a political expert tasked…' to contain 'Do you support universal
healthcare?'`. **T2 and T3 stayed green under this injection, which is expected and explained, not a
gap:** emptying the question *name* leaves the type and the choice labels differing, so the
type-discrimination fixture still discriminates. A ledger row recording an unnamed "red" could not
distinguish this from a collateral failure, which is why the axis is named.

**The pair, stated as a pair.** Same injection, same file, same command — before the remediation the
whole *package* passed (20/20); after it, exactly one assertion fails and nothing else does. That is the
negative control.

**Collateral: none.** `${TMPDIR}/gsd-142/F15-A-NEW-collateral-1.log` — package-wide
`Tests 1 failed | 21 passed (22)`, with `api.test.ts` fully green. The only red is the strengthened
assertion itself.

**Post-revert:** three-condition post-gate passed (per-path, scoped, and the phase-marker grep over
`apps packages tests`); `git diff --exit-code HEAD -- packages/question-info` exit 0.
`${TMPDIR}/gsd-142/F15-A-NEW-postrevert.log` — `Tests 22 passed (22)`, exit 0, and the Phase-141
workspace script `yarn workspace @openvaa/question-info test:unit` also green 22/22, exit 0.

| Cell | Value |
|---|---|
| NEW-assertion outcome | **FAIL (red)** ✅ — **T1 specifically**, `questionTypes.test.ts:113:36`, `AssertionError: expected '…' to contain 'Do you support universal healthcare?'`, exit 1 — `${TMPDIR}/gsd-142/F15-A-NEW-1.log`. T2/T3 green under this injection: expected and explained above |
| File outcome | **FAIL** — `Tests 1 failed \| 8 passed (9)`, exit 1 |
| Collateral | **none** — package-wide `1 failed \| 21 passed (22)`; `api.test.ts` untouched and green |
| Verdict | **remediated** — product `0bc21e3b3` + `0b15c5e86`; tests `0d3700e58` + `80acc432c` |

**⚠ Row 1 left a residue, and row 1s below closes it.** T1 covers **Configuration 1**; D-05's `:388`
covers **Configuration 3**. **Configuration 2 got nothing** — the A-04 fixture that replaced 139's
target 2 uses **Boolean + Categorical only**, so after this row's remediation *no assertion anywhere in
the file observed an ordinal question's prompt*, and three of the eleven sites this row lists as
*"passed blind"* (`:199`, `:263`, `:264`) were **still passing blind**. Raised as **W-1** by
`142-VERIFICATION.md` and routed to the operator, who directed the assertion be added rather than the
residue merely recorded. Row 1s is that work, run through the same HYGIENE-LOOP as everything else here.

### Row 1s — F15-A supplementary — Configuration 2 (**W-1 closure**)

**Owned by:** the W-1 gap-closure pass (2026-08-21), appended to the phase after verification.
**HEAD at measurement:** `1453a4106` for both OLD halves; `d1fc0f745` (the assertion commit) for both
NEW halves.
**Site:** `questionTypes.test.ts` Configuration 2 — the 5-point test (`ordinal-1`) and the 7-point test
(`ordinal-2`). Before this row, their complete assertion set was `toHaveLength(1)`,
`data.questionId).toBe('ordinal-1')`, `data.infoSections).toBeDefined()`, `data.terms).toBeDefined()`,
`data.terms).toHaveLength(2)` — **every one the canned payload the test itself handed the mock**.

**Injection choice, stated and reasoned — this row does NOT use 139 § 5.1.2's substitute.** That
substitute empties the question **name** (`question: ''`), and row 1 records by measurement that it
leaves type- and choice-derived assertions green (T2/T3 stayed green under it). It is therefore
**off-axis** for what row 1s asserts and could not red it. Two new injections are used instead, located
by content:

| ID | Diff | Axis it tests |
|---|---|---|
| **Q** | `questionType: question.type,` → `questionType: '', // INJECTED (142): …` at `infoGeneration.ts:104` | the question's **type** reaching the prompt |
| **C** | `choices: 'choices' in question ? … : '',` → `choices: '', // INJECTED (142): …` at `:105` | the question's **choice labels** reaching the prompt — the D-01-iii axis |

**On § 8.3 R-2, checked by name rather than assumed.** R-2 forbids *"F15-A: the audit's own sentence
(make `generateQuestionInfo` ignore question type)"*, and its stated ground is explicit: **"Un-injectable
— zero delta. The shipped code already ignores question type; the grep exits 1."** That ground is a
property of the **pre-D-01 tree**. D-01 landed the type and the choices into the prompt, so the same
edit now has a **non-zero, transcribed delta** and a measured red. This is the identical reasoning
A-03 applied at row 7, where an injection that was off-path on one tree becomes the correct control on
the other — recorded there as *"post-fix injection A … the catch-arm re-throw makes it on-axis"*. Q and
C are R-2's now-live counterparts, not R-2's prohibited design. R-3 (bypassing `responseTransformer.ts`)
and R-4 (`:77`'s `generalInstructions` rename, **one line below C's site**) were checked and **not**
used; the `generalInstructions` key is byte-unchanged in every diff above.

#### OLD half — MEASURED HERE, both injections, on the pre-assertion tree

Clean-tree baseline first: `Tests 9 passed (9)`, exit 0 (`${TMPDIR}/gsd-142/F15-A-W1-OLD-0-cleantree.log`).
Pre-gate `git status --porcelain -- apps tests packages` printed nothing.

- **Q — GREEN (blind) ✅.** `${TMPDIR}/gsd-142/F15-A-W1-OLD-Q-1.log`, exit **0**,
  `Tests 9 passed (9)`. The **whole file** passes with the prompt carrying **no question type at all**.
  Package-wide too: `F15-A-W1-OLD-Q-collateral-1.log`, exit **0**, `Tests 22 passed (22)`.
- **C — GREEN (blind) ✅.** `${TMPDIR}/gsd-142/F15-A-W1-OLD-C-1.log`, exit **0**,
  `Tests 2 passed | 7 skipped (9)` — the `-t 'Likert scale question'` filter matched **exactly** the two
  intended tests (RESEARCH § Pitfall 6's count check), and both passed with the prompt carrying **no
  choices at all**.
- **C's whole-file run is the sharpest statement of W-1 there is.**
  `F15-A-W1-OLD-C-collateral-1.log`, exit 1, `Tests 2 failed | 7 passed (9)`: the reds are
  Configuration 3's binary test (`to contain 'Morning person'`) and the Mixed-block T3
  (`to contain 'Yes, lower it to 16'`) — while **both Configuration 2 tests stayed green**. The file
  caught the regression everywhere *except* the ordinal block. That is the residue, measured rather
  than argued.

Reverted with `git checkout HEAD -- <path>`; three-condition post-gate passed (per-path empty, scoped
`-- apps tests packages` empty, `grep -rn 'INJECTED (142)' apps packages tests` no hits). Post-revert
package run green `Tests 22 passed (22)`, exit 0 (`F15-A-W1-OLD-postrevert.log`).

#### The assertions added, and why each is not a new wiring-only assertion

Committed as `d1fc0f745`, **before** either NEW-half injection ran (standing constraint 5). Clean-tree
run after the edit: `Tests 22 passed (22)`, exit 0 (`F15-A-W1-cleantree-postedit.log`) — so the
assertions are true of the real product, not of a mock.

- `:239` — `expect(prompt).toContain(QUESTION_TYPE.SingleChoiceOrdinal)`. Read **from the constant**
  (row 6's E2 discipline: never re-type a value the product owns), and it observes the composed prompt,
  which is output the product built — not the payload the test supplied.
- `:246` — `expect(prompt).toContain('Very dissatisfied, Dissatisfied, Neutral, Satisfied, Very
  satisfied')`, the five labels **as the product's own `', '` join**, derived from
  `infoGeneration.ts:105`'s documented semantics rather than copied from a run's output (E3's rule).
  Asserting the joined string rather than label-by-label means a regression in the separator or in the
  label **order** reds too.
- `:318` — the 7-point test's own seven labels, likewise joined. This is what makes Configuration 2's
  two tests differ **observably from one another**: both are `singleChoiceOrdinal`, so per **D-01-iii**
  the type string alone cannot separate them and only the choices can. It also runs the
  **`generateTerms`** template, so it pins `{{choices}}` on a second template, not only
  `generateInfoSections`.

Neither assertion is a `toBeDefined()`/`typeof`/count-of-what-I-supplied shape, and neither compares
two differently-named fixtures — **A-04's rejection stands untouched**; nothing here reintroduces
139 § 5.1.6's target 2.

#### NEW half — MEASURED HERE, both injections, RED and NAMED

- **Q → FAIL (red) ✅.** `${TMPDIR}/gsd-142/F15-A-W1-NEW-Q-1.log`, exit **1**,
  `Tests 1 failed | 8 passed (9)`. The single red is `questionTypes.test.ts:239:22`,
  `AssertionError: expected '\n\nYou are a political expert tasked…' to contain 'singleChoiceOrdinal'`.
  **Zero collateral inside the file** — every other test, including T2, stayed green (expected: with the
  choices still present, the same-name boolean/categorical prompts still differ). Package-wide:
  `F15-A-W1-NEW-Q-collateral-1.log`, `Tests 1 failed | 21 passed (22)`, `api.test.ts` fully green.
- **C → FAIL (red) ✅, on both ordinal sites.** `${TMPDIR}/gsd-142/F15-A-W1-NEW-C-1.log`, exit **1**,
  `Tests 2 failed | 7 skipped (9)` (filter matched exactly 2): `:246:22` reds with
  `to contain 'Very dissatisfied, Dissatisfied, Neut…'` and `:318:36` with
  `to contain 'Strongly disagree, Disagree, Somewhat…'`.
- **C's collateral, named rather than absorbed.** `F15-A-W1-NEW-C-collateral-1.log`, exit 1,
  `Tests 4 failed | 18 passed (22)`. Two of those four are the **pre-existing** Configuration 3 and T3
  choices assertions, which red under C on any tree — they are **sibling coverage**, recorded in the
  `Collateral` cell and **never** credited as this row's control. The two that fill the assertion cell
  are the two added here.

**The pair, stated as a pair.** Same two injections, same file, same commands: **before** the addition
the two ordinal tests passed under both (9/9 and 2/2); **after** it, `:239` reds under Q and `:246`/`:318`
red under C, each naming its own assertion. That is the negative control.

**Post-revert:** `git checkout HEAD -- packages/question-info/src/core/infoGeneration.ts`;
three-condition post-gate passed; `git diff --exit-code HEAD -- packages/question-info` exit 0;
`F15-A-W1-NEW-postrevert.log` green `Tests 22 passed (22)`, exit 0.

| Cell | Value |
|---|---|
| OLD half | **re-run — GREEN (blind) ✅** under **both** injections: Q exit 0 `9 passed (9)`; C exit 0 `2 passed \| 7 skipped (9)`. Under C the *rest* of the file reds (`2 failed \| 7 passed`) while Configuration 2 stays green — W-1, measured |
| NEW-assertion outcome | **FAIL (red)** ✅ — **Q:** `:239:22` `to contain 'singleChoiceOrdinal'`, exit 1. **C:** `:246:22` and `:318:36`, each naming its own joined choice-label string, exit 1 |
| File outcome | **FAIL** — Q: `1 failed \| 8 passed (9)`. C: verdict `2 failed \| 7 skipped (9)`; package-wide `4 failed \| 18 passed (22)` |
| Collateral | **Q: none.** **C:** the two pre-existing choices assertions (`:423-424`, `:649`) — sibling coverage, never credited as either half |
| Verdict | **remediated** — tests `d1fc0f745`. **No product change**: D-01's fix already carried the type and the choices; only the observation was missing |

### Row 2 — F15-B · `condenserStandalone.test.ts` (`result.arguments` never touched)

**Owned by:** plan `142-02` (wave 2).
**Injection (139 § 5.2.2):** at `condenser.ts:205`.
**OLD half — `cited`:** 139 § 5.2.4 records assertion **PASS**, file **green**, measured at
`12825b479`. `condenser.ts` is not changed by this phase for any non-assertion reason, so D-06's
citation rule applies unqualified.
**Note:** E9 additionally **deletes** the `processingTimeMs > 0` line at `:137` — a wall-clock
assertion on a mocked provider — rather than weakening it to `toBeGreaterThanOrEqual(0)`.

**Injection (139 § 5.2.2), verbatim as applied here:**

```diff
  packages/argument-condensation/src/core/condensation/condenser.ts:205
-      data: { arguments: currentData as Array<Argument> },
+      data: { arguments: [] }, // INJECTED (142): discard every condensed argument
```

Applied **once**; rows 2 and 3 are two vehicle runs taken under that single live instance, followed by
one revert (139 § 5.2.2's own practice, permitted for 142 by `142-02-PLAN.md`). Both rows cite this
same injection instance and each carries its **own** log.

**The remediation, as committed** (`fbb103c10`). The strengthened assertions are placed **after** the
existing siblings — the phase's evidence-ordering convention from row 10 — so the injected run
*measures*, rather than asserts, that the siblings pass and only the new assertion reds:

```ts
    expect(input.options.llmProvider.generateObjectParallel).toHaveBeenCalled();

    // … (rationale comment, incl. the `data` wrapper and the guard's purpose)
    expect(Array.isArray(result.data.arguments)).toBe(true);   // :154 — A-09-class shape guard
    expect(result.data.arguments).toHaveLength(2);             // :155
    expect(result.data.arguments.map((argument) => argument.text)).toEqual([
      'Generated argument from batch',
      'Another generated argument'
    ]);                                                        // :156-159
    expect(result.data.arguments.every((argument) => argument.text.trim().length > 0)).toBe(true);
```

**A-09 in its non-`mock.calls` form.** `Array.isArray(...)` at `:154` precedes every dereference of
`result.data.arguments`, so an absent or non-array payload reds as an assertion failure rather than a
`TypeError` inside `.map()`. In a phase where red is the success signal, an unguarded dereference
manufactures a red the ledger **cannot** credit.

**The count and the two texts are measured, not assumed.** `toHaveLength(2)` and the two canned strings
were confirmed on a **green clean-tree** run before the injection —
`${TMPDIR:-/tmp}/gsd-142/F15-BC-NEW-0-cleantree.log`, `Tests 8 passed (8)`, exit **0** — never read out
of the injected run (RESEARCH § Pitfall 8).

**E9's deletion, recorded.** `expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0)` at `:137`
is **removed**, not rewritten as `toBeGreaterThanOrEqual(0)`. The measured value on this machine was
**1.228 ms** on a fully mocked provider: the assertion stated that time passes, not that the code
works. An inline comment at `:135-139` records the deletion and its reason so a later reader does not
"restore" it. The sibling call-counter (`:141`, `:203`) and token-counter (`:143`) assertions were
**kept** — a call counter and a token counter are not wall clock (RESEARCH § B.13 disposition).

**Honest scope of the text-equality assertion (RESEARCH § B.2's note, not paraphrased away).** Because
the final REDUCE returns the mock's canned arguments, the text equality is itself mock-in/mock-out in
the F15-A sense. D-11 E8 locks it and it is still worth having, but its real discriminating power is
against an **empty** arguments array and against **blank-but-shaped** arguments — not against a wrong
transform. This row claims exactly that and no more.

**139 § 5.2.6 target 3 is not implementable and was not attempted.** "Source-comment IDs map back to
the input" cannot be written at this shape: `Argument` is `{ id: string; text: string }` and the ids are
**regenerated UUIDs**, not the mock's `'arg1'`/`'arg2'` (RESEARCH § B.2 fact 3). Targets 1 and 2 plus
text equality are what landed.

**NEW half — invocation** (whole file; run from inside the workspace directory per D-07, because
`condenser.ts:198` writes `path.join(process.cwd(), 'data/operationTrees', …)`):

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" \
  && npx vitest run tests/condensation/condenserStandalone.test.ts
```

**NEW half — observed. Exit code `1`.** Log: `${TMPDIR:-/tmp}/gsd-142/F15-B-NEW-1.log`. Verbatim, from
the first verdict-bearing line:

```
 ❯ tests/condensation/condenserStandalone.test.ts (3 tests | 1 failed) 7ms
   × Condenser Standalone Test > It should run the complete condensation pipeline with mock data 6ms
     → expected [] to have a length of 2 but got +0
   ✓ Condenser Standalone Test > It should handle different condensation types 0ms
   ✓ Condenser Standalone Test > It should handle empty comments gracefully 0ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/condensation/condenserStandalone.test.ts > Condenser Standalone Test > It should run the complete condensation pipeline with mock data
AssertionError: expected [] to have a length of 2 but got +0

Expected: 2
Received: 0

 ❯ tests/condensation/condenserStandalone.test.ts:155:35

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

**Axis check.** The failure is an `AssertionError` at `condenserStandalone.test.ts:155:35` — the
arguments-**length** assertion, and nothing else. It is **not** a `TypeError` (the single `TypeError`
token in the log is the word appearing inside the quoted source frame of the guard's own comment at
`:153`, not an error), **not** a sibling matcher, **not** a collection error. Every assertion above it
in the same test executed and passed first, which is what the evidence ordering was for. Compare 139's
cited OLD half at the identical injection: `3 passed`, green throughout.

**Collateral: none** — the other two tests in the file passed under the live injection.

**Post-gate — all three conditions held:** (a) `git status --porcelain -- packages/argument-condensation/src/core/condensation/condenser.ts` empty · (b) `git status --porcelain -- apps tests packages` empty ·
(c) `grep -rn 'INJECTED (142)' apps packages tests` no hits. `condenser.ts:205` re-read as
`data: { arguments: currentData as Array<Argument> },`, and the post-revert run went green again
(`Tests 8 passed (8)` across both F15 files, exit **0**,
`${TMPDIR:-/tmp}/gsd-142/F15-BC-postrevert.log`).

**Run environment for this row:** HEAD `fbb103c10` (the strengthened-assertion commit) with the
injection live in the working tree; Node v24.14.1; vitest 3.2.4; in-package run.

| Cell | Value |
|---|---|
| OLD half | **cited** — 139 § 5.2.4 (assertion **PASS** blind, file **green** 3/3), measured by Phase 139 at `12825b479` — **not** re-run here |
| NEW-assertion outcome | **FAIL (red)** — `AssertionError: expected [] to have a length of 2 but got +0` at `condenserStandalone.test.ts:155:35`, exit `1`; log `${TMPDIR:-/tmp}/gsd-142/F15-B-NEW-1.log` |
| File outcome | **FAIL** — `Test Files 1 failed (1)`, `Tests 1 failed \| 2 passed (3)`. Differs from the assertion cell only in aggregation: the sole failure **is** the target assertion |
| Collateral | **none** — no other test in the file changed state |
| Verdict | **remediated** — complete negative-control pair: OLD half cited green, NEW half measured red on the finding's own axis |

### Row 3 — F15-C · `condenseQuestions.test.ts` (shape and type only, three clusters)

**Owned by:** plan `142-02` (wave 2).
**Injection (139 § 5.3.2):** at `condenser.ts:205` — **the same site as row 2**. The two rows share an
injection target but are separate findings with separate assertions; each is run in its own complete
HYGIENE-LOOP iteration, never both live at once.
**OLD half — `cited`:** 139 § 5.3.4 records assertion **PASS** in all three clusters, file **green**.
**⚠ Pitfall 8 applies here specifically:** the per-run argument count must be confirmed on a **green
clean-tree** run and derived from the fixture, never copied out of the injected run's output.

**Injection:** the **same live instance** recorded in row 2 above (`condenser.ts:205`, one injection,
two vehicle runs, one revert). Not re-applied for this row.

**⚠ MEASUREMENT THAT CONTRADICTS `142-RESEARCH.md` § B.3 — read before touching this file.**
§ B.3 marked the per-run argument count `[ASSUMED] 2, by analogy with the measured standalone case`.
A green clean-tree probe (2026-08-20, printing `results.map((run) => run.data.arguments)` with no
injection anywhere in the tree) measured something different in **shape**:

```
PROBE [[[{"id":"d00ed0c2-…","text":"Test argument 1"},{"id":"4a378ea0-…","text":"Test argument 2"}]],
       [[{"id":"7ac34995-…","text":"Test argument 1"},{"id":"01900092-…","text":"Test argument 2"}]]]
```

On the `handleQuestion` path `run.data.arguments` is **nested one level deeper than its declared
`Array<Argument>` type** — `[[arg, arg]]`, not `[arg, arg]`. `Array.isArray` is `true` and `.length`
is **1**, but that one element is an *array*, so a naive `.map((a) => a.text)` yields `[undefined]`.
`condenserStandalone.test.ts` does **not** exhibit this, because its plan terminates in a REDUCE that
collapses the list-of-lists; the fixtures here build single-batch MAP-terminated plans, whose bookkeeping
records `structure = 'list'` (`planValidation.ts:149`, `batchCount > 1 ? 'listOfLists' : 'list'`) while
the payload is still physically nested, and `condenser.ts:205` casts it to `Array<Argument>` regardless.

Two consequences, both recorded rather than absorbed:

1. **The assertion uses `flat()`, and that is load-bearing, not a convenience.** After flattening, the
   per-run argument count is **2** and each text is the mock's canned response — which is what D-11 E8
   requires ("each argument carrying non-empty text traceable to the mocked provider's canned
   response"). The un-flattened form cannot satisfy E8, because its single element has no `text` at all.
   The reason is written inline in the test with an explicit "do not simplify this back".
2. **The nesting itself is a product-side finding, and this plan did NOT fix it.** `142-02` is
   test-only by its own success criteria ("no product source durably modified"), and collapsing the
   list-of-lists would change `Condenser.run()`'s observable output for every consumer — a Rule-4-class
   change, out of scope here. It is filed as a deferred item (see § Deferred product findings below)
   rather than silently encoded as "expected".

So the count `[ASSUMED] 2` in § B.3 is confirmed **in substance** (2 arguments per run) but **not in
shape** (they arrive nested). The confirmation was taken on a green clean-tree run, per Pitfall 8.

**The remediation, as committed** (`fbb103c10`), per cluster, paired with — not replacing — the existing
`toHaveLength` / `condensationType` siblings and placed after them (139 § 5.3.6's "pair, don't replace"
rule plus the phase's evidence-ordering convention):

```ts
    const argumentsPerRun = results.map((run) => run.data.arguments.flat());
    expect(argumentsPerRun.map((args) => args.map((argument) => argument.text))).toEqual([
      ['Test argument 1', 'Test argument 2'],
      ['Test argument 1', 'Test argument 2']
    ]);
    expect(argumentsPerRun.flat().every((argument) => argument.text.trim().length > 0)).toBe(true);
```

at `:162-167` (likert, 2 runs), `:245-251` (categorical, **3** runs) and `:310-315` (boolean, 2 runs).
The matrix form pins the per-run count **and** the per-run content in one matcher, so a run silently
dropped and a run silently blanked are both visible.

**Honest scope (same clause as row 2):** the text equality is mock-in/mock-out — its discriminating
power is against an empty arguments array and against blank-but-shaped arguments, not against a wrong
transform.

**NEW half — invocation** (whole file, second vehicle run under row 2's live injection):

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" \
  && npx vitest run tests/condensation/condenseQuestions.test.ts
```

**NEW half — observed. Exit code `1`.** Log: `${TMPDIR:-/tmp}/gsd-142/F15-C-NEW-1.log`. Verbatim, from
the first verdict-bearing line (the package's own `Found 0 pros!` / `Found 0 cons!` progress logging is
kept — under the clean tree it reads `Found 1 pros!` / `Found 1 cons!`):

```
 ❯ tests/condensation/condenseQuestions.test.ts (5 tests | 3 failed) 12ms
   × handleQuestion > It should condense arguments for both pros and cons of a likert question 7ms
     → expected [ [], [] ] to deeply equal [ [ 'Test argument 1', …(1) ], …(1) ]
   × handleQuestion > It should condense arguments for a categorical question 1ms
     → expected [ [], [], …(1) ] to deeply equal [ [ 'Test argument 1', …(1) ], …(2) ]
   × handleQuestion > It should condense arguments for a boolean question 1ms
     → expected [ [], [] ] to deeply equal [ [ 'Test argument 1', …(1) ], …(1) ]
   ✓ handleQuestion > It should throw an error if invalid prompt IDs are provided 1ms
   ✓ handleQuestion > It should create visualization data when createVisualization flag is set 2ms

 ❯ tests/condensation/condenseQuestions.test.ts:163:82
 ❯ tests/condensation/condenseQuestions.test.ts:246:82
 ❯ tests/condensation/condenseQuestions.test.ts:311:82

 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)
```

**Axis check.** Three `AssertionError`s, one per cluster, each at the strengthened content matcher
(`:163:82`, `:246:82`, `:311:82`) and each reporting the emptied arguments array against the expected
canned texts. Zero `TypeError` tokens in the log. The `toHaveLength` / `condensationType` siblings
above each of them executed and passed — the ordering converts 139's analysis into a measurement taken
here. Compare 139's cited OLD half at the identical injection: `5 passed`, green in all three clusters.

**Collateral: none — and the visualization test is explicitly NOT collateral.**
`It should create visualization data when createVisualization flag is set` (`:372`; 139 cited it at
`:331` before this phase's own edits shifted it) stayed **green** under the live injection, exactly as
139 § 5.3.4 recorded and RESEARCH § B.3 predicted. The reason is mechanical:
`this.treeBuilder.setFinalArguments(currentData as Array<Argument>)` runs at `condenser.ts:195`,
**before** the injected return at `:205`, so the written operation tree still carries the arguments the
test reads back. Its own progress output did change (`Found 0` vs `Found 1`) without changing its
verdict — which is a restatement of the file's blindness, not a collateral red, and it is **not**
recorded as one.

**Post-gate:** shared with row 2 — all three conditions held after the single revert.

**Run environment for this row:** HEAD `fbb103c10`; Node v24.14.1; vitest 3.2.4; in-package run.

| Cell | Value |
|---|---|
| OLD half | **cited** — 139 § 5.3.4 (assertion **PASS** blind in all three clusters, file **green** 5/5), measured by Phase 139 at `12825b479` — **not** re-run here |
| NEW-assertion outcome | **FAIL (red)** — three `AssertionError`s at `condenseQuestions.test.ts:163:82`, `:246:82`, `:311:82`, exit `1`; log `${TMPDIR:-/tmp}/gsd-142/F15-C-NEW-1.log` |
| File outcome | **FAIL** — `Test Files 1 failed (1)`, `Tests 3 failed \| 2 passed (5)`. All three failures **are** target assertions, one per cluster |
| Collateral | **none** — the visualization test at `:372` stayed green (`setFinalArguments` at `condenser.ts:195` runs before the injected return), and is recorded here as **not** collateral rather than omitted |
| Verdict | **remediated** — complete negative-control pair in all three clusters |

### Row 4 — F16 · `handleQuestion.test.ts` (bare `rejects.toThrow()`, competing throw)

**Owned by:** plan `142-02` (wave 2).
**Injection (139 § 5.4.2) — injection B**, at `api.ts:119-121`, which keeps the language guard and
swaps only its message. **D-10 requires B**; the audit's "delete the language check" sentence is
injection A and reds **before and after**, making the remediation unverifiable.
**OLD half — `cited`:** 139 § 5.4.4 row B records assertion **PASS**, file **green**.
**E1 carries two halves:** the exact prefix `'Unsupported language: lol'` (not `/language/i`), **and**
a non-empty `entities` array — with `entities: []` the call never reaches past the language check and
the test exercises five lines of `handleQuestion` and nothing else.

**Injection (139 § 5.4.2, injection B), verbatim as applied here:**

```diff
  packages/argument-condensation/src/api.ts:119-121
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
+    throw new Error('Cannot read properties of undefined (reading tpmLimit)'); // INJECTED (142): a DIFFERENT failure's message
```

The `+` line is still a `throw new Error(` call, so the **category** is preserved and only the
**reason** varies. The guard at `api.ts:118` still fires. That is exactly what makes this a
discrimination test rather than a removal test.

**Injection A was excluded BY NAME, and why.** The audit's own sentence — "delete the language check"
(`api.ts:118-122`) — is injection A. 139 § 5.4.4 measured it going **FAIL (caught)** on the *pre-fix*
tree, with `promise resolved "[]" instead of rejecting` at `handleQuestion.test.ts:68`. An injection
that reds *before* the remediation cannot measure the remediation: it belongs to § 8.3's
red-before-and-after family (the R-4 / R-5 / R-8 / R-9 class), and D-10 accordingly requires B. It was
not run here.

**The remediation, as committed** (`73eda4ff7`), both halves of D-11 E1:

```ts
    const entities: Array<HasAnswers> = [
      { answers: { q1: { value: true, info: 'Because it protects municipal services.' } as Answer } },
      { answers: { q1: { value: false, info: 'Because the cost outweighs the benefit.' } as Answer } }
    ];
    …
    ).rejects.toThrow('Unsupported language: lol');
```

1. **The exact prefix.** `'Unsupported language: lol'` is a true prefix of the live template at
   `api.ts:119-121`, and vitest's string form of `toThrow` is a **substring** match — so the matcher is
   satisfied by the real message and broken by injection B's swapped one. **Equivalence to ROADMAP
   criterion 3, recorded because the two differ in form:** the criterion's literal wording is
   `/language/i`. The implemented matcher is strictly stronger — `/language/i` would still match
   `'Unsupported language: fi'` or any other message containing the word, whereas the prefix pins both
   the failure category *and* the offending value `lol`. This row claims the stronger property.
2. **The non-empty `entities` array.** Two entities, each with an `answers` record keyed by the
   fixture question's id (`q1`, a `BooleanQuestion`), a boolean `value` and an `info` string — one
   supporting, one opposing. Shape copied from the in-tree fixture at `condenseQuestions.test.ts`.
   Typed against `HasAnswers` / `Answer`; **no `any` introduced** (count before: 0, after: 0). The
   guard at `api.ts:118` fires before `getAndSliceComments` at `:125`, so the outcome is unchanged —
   the entities make the guard the *first of several live paths* rather than the only five lines the
   test exercises, which is E1's stated reason and § 5.4.6's independent motivation.

Both halves carry a "do not simplify this back" note inline in the test.

**Clean-tree confirmation, before the injection** (durable edit committed first, per § E.2):
`Tests 1 passed (1)`, exit **0**, `${TMPDIR:-/tmp}/gsd-142/F16-NEW-0-cleantree.log`. `npx tsc --noEmit`
over the package also exits **0** with the new fixture in place.

**NEW half — invocation:**

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" \
  && npx vitest run tests/unit/handleQuestion.test.ts
```

**NEW half — observed. Exit code `1`.** Log: `${TMPDIR:-/tmp}/gsd-142/F16-NEW-1.log`. Verbatim, from
the first verdict-bearing line:

```
 ❯ tests/unit/handleQuestion.test.ts (1 test | 1 failed) 4ms
   × handleQuestion > It should throw an error for an unsupported language 3ms
     → expected [Function] to throw error including 'Unsupported language: lol' but got 'Cannot read properties of undefined (…'

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/handleQuestion.test.ts > handleQuestion > It should throw an error for an unsupported language
AssertionError: expected [Function] to throw error including 'Unsupported language: lol' but got 'Cannot read properties of undefined (…'

Expected: "Unsupported language: lol"
Received: "Cannot read properties of undefined (reading tpmLimit)"

 Test Files  1 failed (1)
      Tests  1 failed (1)
```

**Axis check.** The rejection **did** happen — the failure is a *message mismatch*, not
`promise resolved … instead of rejecting`, which is what injection A produces and what a wrong-axis red
would look like here. The expected/received pair names precisely the discrimination F16 asserts: the
old bare `toThrow()` was satisfied by *any* throw, including the competing
`Cannot read properties of undefined (reading tpmLimit)` message this injection substitutes. Compare
139's cited OLD half at the identical injection B: `1 passed`, green.

**Collateral: none — measured here, not just cited.** 139 § 5.4.4 predicted zero collateral at this
site. Because `api.ts` is imported by three other test files in the package, the whole package suite
was run under the live injection as an explicit collateral record
(`${TMPDIR:-/tmp}/gsd-142/F16-NEW-collateral-1.log`): `Test Files 1 failed | 5 passed (6)`,
`Tests 1 failed | 29 passed (30)` — the only failure is the target test. The sibling suites pass a
**supported** language (`'en'`), so the guard never fires for them and the swapped message is never
reached.

**Post-gate — all three conditions held:** (a) `git status --porcelain -- packages/argument-condensation/src/api.ts` empty · (b) `git status --porcelain -- apps tests packages` empty ·
(c) `grep -rn 'INJECTED (142)' apps packages tests` no hits. `api.ts:118-122` re-read as the original
three-line template throw, and the post-revert run went green again (`Tests 1 passed (1)`, exit **0**,
`${TMPDIR:-/tmp}/gsd-142/F16-postrevert.log`).

**Run environment for this row:** HEAD `73eda4ff7` (the strengthened-assertion commit) with the
injection live in the working tree; Node v24.14.1; vitest 3.2.4; in-package run.

| Cell | Value |
|---|---|
| OLD half | **cited** — 139 § 5.4.4 **row B** (assertion **PASS** blind, file **green**), measured by Phase 139 at `12825b479` — **not** re-run here. Injection **A** was excluded by name; 139 measured it red *before* the fix |
| NEW-assertion outcome | **FAIL (red)** — `AssertionError: expected [Function] to throw error including 'Unsupported language: lol' but got 'Cannot read properties of undefined (…'`, exit `1`; log `${TMPDIR:-/tmp}/gsd-142/F16-NEW-1.log` |
| File outcome | **FAIL** — `Test Files 1 failed (1)`, `Tests 1 failed (1)`. The file holds a single test, so the two cells cannot diverge here |
| Collateral | **none**, measured package-wide under the live injection: `Tests 1 failed \| 29 passed (30)`; log `${TMPDIR:-/tmp}/gsd-142/F16-NEW-collateral-1.log` |
| Verdict | **remediated** — complete negative-control pair: OLD half cited green under injection B, NEW half measured red on the message-discrimination axis |

### Row 5 — F17 · `EntityListWithControls.test.ts` (self-referential `10 === 10`)

**Owned by:** plan `142-05` (wave 3).
**Injection (139 § 5.5.2):** the `$effect` re-run storm at `EntityListWithControls.svelte:129`.
**OLD half — `cited`:** 139 § 5.5.4 records assertion **PASS**, file **green 8/8**. 139 already flagged
this run as corroboration rather than a discriminating experiment (§ 4.3), because the injected module
is not in the test's import graph.

**`NEW-assertion outcome` = `N/A — by construction`.** This cell is **pre-filled**, and it is filled
honestly rather than left to look like an unrun row. The reasoning, in full:

- **D-04** selects ROADMAP criterion 3's **second branch** — rename the file to the contract it
  actually verifies — rather than mounting the component. The test's imports are exactly `vitest` and
  `./EntityListWithControls.helpers`; the helper has zero imports. The component **is not in the
  module graph**.
- **139 § 5.5.6 predicted this in advance**: *"only remedy 1 makes the pre-specified regression above
  red."* Remedy 1 is mounting. D-04 did not choose it.
- **139 § 8.3 R-10** already forbids the `EntityListWithControls.svelte:120` syntax-error control for
  the same reason: it reds **neither** before nor after, because the module never loads.
- Therefore F17 has **no available NEW half from 139's record**. Recording a red here would require
  inventing an injection 139 never designed, or crediting a red on an unrelated axis.

**The finding is remediated, not withdrawn.** D-13's withdrawal bar is **not engaged** and the
withdrawal count stays **0**. This is a **scoped, pre-predicted exception to ROADMAP criterion 1**, and
per A-06 it must be visible **here**, in the phase record, **and** in the D-18 audit line — never
silently absent. It is restated under § Scoped exceptions to ROADMAP criterion 1 below.

**The remediation, as committed** (`a25355369`). All four of D-04's items landed, and each is verifiable
independently of the others:

| D-04 item | What landed | Verification |
|---|---|---|
| 1. rename | `git mv EntityListWithControls.test.ts → EntityListWithControls.helpers.test.ts`, history preserved (`git log --follow` reaches `60593d2b3`) | `grep -rn 'EntityListWithControls\.test\.ts' apps packages tests` → **0 hits**; the back-reference at `EntityListWithControls.helpers.ts:12` moved with it |
| 2. describe titles | outer `describe('EntityListWithControls helpers')` → `describe('computeFiltered / countActiveFilters (EntityListWithControls pure helpers)')`. The inner describes already named the two helpers and were left alone | the run transcript's test paths now begin with the helper names |
| 3. header docblock | rewritten from *"why the component is not mounted"* into a **contract statement** in the register `computeFiltered`'s own docblock already uses, with `[VERIFIED: …]` citations; the sentence describing the bounded-re-run smoke as a call-count assertion is **deleted**, since item 4 replaced exactly that | the docblock now enumerates three contract clauses and cites the helper source for each |
| 4. `:84-95` assertion | the returned array is **collected** per cycle into `observed` and compared with `toEqual` against an expectation built from the fakes' documented semantics (`FakeGroup.apply` returns `[]` while active, a copy otherwise — `:40-43`), derived from the active/inactive alternation rather than from the loop bound | `grep -vE '^\s*(\*|//)' … \| grep -c 'toHaveBeenCalledTimes(10)'` → **0**; the file is **green 8/8** post-rewrite, the same count as pre-rewrite |

**A stale cross-reference found and corrected in passing (item 3).** The old docblock pointed at
*"`filterContext.svelte.test.ts` Contract 5"*. That file's tests are titled by behaviour and **contain no
"Contract 5"** — the version-counter test is `filterContext.svelte.test.ts:204`
(*"mutating a filter rule bumps the version counter so `$derived` consumers re-run"*). Confusingly, the
label `Contract 5` **does** exist in *this* file, on a `countActiveFilters` test, under a different
numbering scheme. The rewritten docblock cites the line and the title instead, and says why.

**A deliberate ordering choice, recorded so nobody "tidies" it back** (the wave-1 *written down twice*
convention; the reasoning is also inline in the test at `:113-117`). The retained call-count assertion is
placed **before** the value assertion. That is what makes a single injected run show the
blindness/catch split directly: the call count is satisfied, execution proceeds past it, and the value
assertion is the thing that fails. Its expected value is tied to `observed.length` rather than a
literal, so it remains a boundedness statement without being a literal-versus-literal comparison.

| Cell | Value |
|---|---|
| NEW-assertion outcome | **`N/A — by construction`** (A-06; D-04, 139 § 5.5.6, 139 § 8.3 R-10) |
| File outcome | **`N/A — by construction`** — 139 § 5.5.2's injection was **not applied** at all, so there is no injected file outcome to record. On the clean, reverted tree the renamed file is **green 8/8**, exit 0 (`${TMPDIR}/gsd-142/F17-postrevert.log`) |
| Collateral | **`N/A`** — no injection was applied for this row, so no collateral is measurable. (Row **5s**'s injection *does* produce collateral; it is recorded there and belongs to that row) |
| Verdict | **remediated** — all four D-04 items landed in `a25355369`; a **scoped, pre-predicted exception** to ROADMAP criterion 1, **not** a withdrawal. Withdrawal count stays **0** and D-13's bar is not engaged |

### Row 5s — F17 supplementary — **not 139 § 5.5.2**

**Owned by:** plan `142-05` (wave 3).
This row exists because row 5 has no NEW half available and A-06 requires that the contract the
renamed file now claims gets a **real** pair anyway. It is a **new** injection, designed in Phase 142,
at `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts:19` — the
filter group is still **invoked**, but its result is **discarded**:

```diff
-  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
+  const afterGroup = filterGroup ? (filterGroup.apply([...entities]), [...entities]) : [...entities]; // INJECTED (142)
```

**Because it is new, D-06's citation rule does not cover it: BOTH halves are run here.** The OLD half
(`toHaveBeenCalledTimes(10)` — apply is still called once per cycle) is expected **PASS**, demonstrating
blindness; the NEW half (the rewritten value assertion) is expected **FAIL** at the first active cycle,
demonstrating the catch. This row must stay **clearly labelled "supplementary — not 139 § 5.5.2"**
wherever it is summarised, so it is never mistaken for a citation of 139's record.

**Injection confirmation, from `git diff` taken while it was live** — byte-identical to A-06's recorded
diff, applied by content:

```
-  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
+  const afterGroup = filterGroup ? (filterGroup.apply([...entities]), [...entities]) : [...entities]; // INJECTED (142): the group's result is discarded
```

**Both halves were run in isolation with a `-t` filter, and the whole file separately.** The isolated run
is the **verdict**; the whole-file run is the **collateral record** (D-08). Both isolated runs reported
`… | 7 skipped (8)`, confirming the filter matched **exactly one** test each time — the Pitfall-6 check.

- **OLD half — GREEN, and that green is the evidence.** Isolated `-t 'Contract 4'` against the file as it
  stood *before* the rewrite, with the injection live: exit **0**, `Tests 1 passed | 7 skipped (8)`
  (`${TMPDIR}/gsd-142/F17-supp-OLD-1.log`). `apply` is still invoked once per `computeFiltered` call, so
  `toHaveBeenCalledTimes(10)` cannot see that its result was thrown away. **Blindness demonstrated.**
- **NEW half — RED on the value axis.** Isolated
  `-t 'returns the group-narrowed list'` against the rewritten file with the same injection live: exit
  **1**, `Tests 1 failed | 7 skipped (8)`, failing at
  `EntityListWithControls.helpers.test.ts:129:24` with
  `AssertionError: expected [ [ { name: 'A' }, …(2) ], …(9) ] to deeply equal [ [], [ { name: 'A' }, …(2) ], …(8) ]`
  (`${TMPDIR}/gsd-142/F17-supp-NEW-1.log`). **The catch demonstrated.**

**The single run carries the whole split, and this is why the assertion order matters.** `:129` is the
value assertion; the call-count assertion sits at `:121`. Execution *reached* `:129`, which means the
call-count assertion **passed under the live injection** in the same run that the value assertion failed.
Blindness and catch are therefore not two separate claims stitched together — they are one transcript.

**⚠ Collateral — `C-142-1`, and it is red in BOTH halves.** `Contract 3` at
`EntityListWithControls.helpers.test.ts:98:63` (*"list shrinks when a filter becomes active"*) asserts
`toEqual([])` after activating the filter, so the discarded-result injection reds it too:

- OLD half, whole file: `Tests 1 failed | 7 passed (8)`, exit 1, the one red being `Contract 3`
  (`${TMPDIR}/gsd-142/F17-supp-OLD-collateral-1.log`).
- NEW half, whole file: `Tests 2 failed | 6 passed (8)`, exit 1 — `Contract 3` **plus** the strengthened
  assertion (`${TMPDIR}/gsd-142/F17-supp-NEW-collateral-1.log`).

**This is precisely why the plan's "expect the OLD half GREEN" had to be measured at the assertion, not
at the file.** A whole-file OLD-half run is **red**, and reading that red as "the OLD assertion caught
it" would have been the exact D-08 error this ledger's two-column rule exists to prevent — the red
belongs to a *different* test that was never blind. `Contract 3` is recorded here as collateral in both
halves and is credited as **neither**.

It is also worth stating plainly, because it qualifies the finding rather than inflating it: F17's
**file** was never wholly blind to this particular regression — `Contract 3` sees it. What was blind is
the assertion F17 names, `:84-95`, which claimed a bounded-invocation contract and tested only its own
loop bound. That is the defect, and it is now closed.

**`expect.soft` was considered and deliberately NOT used** (wave 2 flagged this row as the likeliest
candidate). The two assertions here are **sequentially dependent by design**: the call-count assertion is
ordered first *precisely so that* reaching the value assertion proves the call count held. A soft
assertion would report both axes but destroy that ordering signal, and this row needs only one axis to
red. The guarded soft-assertion budget is untouched.

| Cell | Value |
|---|---|
| OLD half | **`re-run` — GREEN (blind) ✅**, exit 0, `Tests 1 passed \| 7 skipped (8)` — `${TMPDIR}/gsd-142/F17-supp-OLD-1.log` (isolated `-t 'Contract 4'`, pre-rewrite file, injection live) |
| NEW-assertion outcome | **FAIL (red)** ✅ — `EntityListWithControls.helpers.test.ts:129:24`, `AssertionError … to deeply equal [ [], …`, exit 1, `Tests 1 failed \| 7 skipped (8)` — `${TMPDIR}/gsd-142/F17-supp-NEW-1.log` |
| File outcome | **FAIL** — whole file `Tests 2 failed \| 6 passed (8)`, exit 1 — `${TMPDIR}/gsd-142/F17-supp-NEW-collateral-1.log` |
| Collateral | **`C-142-1` at `EntityListWithControls.helpers.test.ts:98:63`** (`Contract 3`) — red in **both** halves; whole-file OLD half was `1 failed \| 7 passed (8)`. Credited as neither half |
| Verdict | **remediated** |

### Row 6 — F18 · `default.test.ts:121-135` (locale cycling asserts only non-empty names)

**Owned by:** plan `142-03` (wave 1) — **this plan**, Task 3.
**Injection (139 § 5.6.2), verbatim:**

```diff
  packages/dev-seed/src/templates/defaults/candidates-override.ts:53
-export const LOCALE_BLOCK_SIZE = 109;
+export const LOCALE_BLOCK_SIZE = 327;
```

**Marker exemption, carried from 139 § 5.6.2 and re-recorded here:** no `INJECTED (142)` comment is
placed on the `+` line. A trailing comment would be syntactically legal, but it would sit on the one
line whose *value* is the entire experiment. Post-gate conditions **(a)** (per-path) and **(b)**
(scoped) carry the hygiene claim for this site; condition **(c)** (the marker grep) is a supplement
this site does not exercise.

**OLD half — `cited`:** 139 § 5.6.4 records assertion **PASS** (blind) and file **green** (27/27),
measured by Phase 139 at `12825b479`, with a positive control confirming the injection was live
(`Math.floor(0|109|218 / 327) === 0` — all three probed indices collapsed to `en`).
`candidates-override.ts` is not changed by this phase for any non-assertion reason, so D-06's citation
rule applies unqualified. **This is a citation of 139's measurement, not a run performed here.**

**⚠ The trap this row's design avoids (`142-RESEARCH.md` § B.6):** the injection **mutates the
constant**. Boundary indices derived from `LOCALE_BLOCK_SIZE` move with it, and the assertion then
either compares the 327th `en` draw against the 327th `en` draw and **passes** — the test mirroring the
bug — or dereferences a row past the end and reds as a `TypeError` on the wrong axis. Both are rows the
ledger cannot credit. The indices are therefore derived from **`rows.length / 3`** — from the generated
corpus, whose length comes from `PARTY_WEIGHTS`, which the injection does not touch.

**The remediation, as committed** (`c456a381f`, `packages/dev-seed/tests/templates/default.test.ts`).
Test 10's `for (const idx of [0, 109, 218]) { expect(r.first_name).toBeTruthy(); … }` — which every
locale pack satisfies, and which therefore could not see the partition it was named for — is replaced
by a boundary assertion against freshly-seeded per-locale Fakers:

```ts
    const blockSize = rows.length / 3;
    expect.soft(LOCALE_BLOCK_SIZE).toBe(blockSize);

    const en = __buildLocaleFakerForTests('en');
    let enLast = { first: '', last: '' };
    for (let i = 0; i < blockSize; i++) {
      enLast = { first: en.person.firstName(), last: en.person.lastName() };
    }
    const lastOfBlock0 = rows[blockSize - 1] as { first_name: string; last_name: string };
    expect.soft(lastOfBlock0.first_name).toBe(enLast.first);
    expect.soft(lastOfBlock0.last_name).toBe(enLast.last);

    const fi = __buildLocaleFakerForTests('fi');
    const firstOfBlock1 = rows[blockSize] as { first_name: string; last_name: string };
    expect.soft(firstOfBlock1.first_name).toBe(fi.person.firstName());
    expect.soft(firstOfBlock1.last_name).toBe(fi.person.lastName());
```

The stale *"Shape-only assertion: non-empty strings"* disclaimer at `:122-127` was deleted with the
rewrite — it described the assertion E2 wanted and then declined to write it, so leaving it would have
left a false statement beside a real assertion.

**⚠ A deliberate, reasoned exception to D-11 E2's letter, recorded so nobody "fixes" it back.**
E2 says *"`LOCALE_BLOCK_SIZE = 109` is asserted **from the constant**, never hard-coded twice."* That
clause exists to stop a second hard-coded `109` drifting away from the first. It is satisfied here —
the block size is read from the constant, asserted, and **never restated as a literal** (verified:
`grep -vE '^\s*(//|\*|/\*)' default.test.ts | grep -c '109'` returns **0**).

But the **boundary indices** are derived from `rows.length / 3`, **not** from the constant, and that
direction is load-bearing. The injection *mutates the constant*. Constant-derived indices would move
with it, and the assertion would then either compare the 327th `en` draw against the 327th `en` draw
and **pass** — the test mirroring the bug — or dereference `rows[327]`, which is `undefined`, and red
as a `TypeError` on the wrong axis (the R-6 failure mode). Either outcome is a row this ledger could
not credit. `rows.length` comes from `PARTY_WEIGHTS`, which the injection does not touch, so the
derivation is injection-independent by construction. **The reasoning is also written inline in the
test** (`:133-142`), with an explicit instruction not to simplify `blockSize` back into
`LOCALE_BLOCK_SIZE`, so a later reader cannot silently re-blind the test while believing they are
tidying it.

**`expect.soft` — a primitive new to this repository, introduced deliberately.** `grep -rn 'expect\.soft' apps packages`
returned **zero** hits before this commit. A hard `expect` throws on first failure, so only the *first*
of the two axes would ever appear in a log and the second would be unmeasured. Soft assertions let one
run report every axis that broke, which is what turns "two independent axes" from a claim into an
observation. The run below is the proof it behaves as intended: three failures reported from a single
test, exit **1**.

**Clean-tree confirmation, before the injection.** RESEARCH § B.6 flagged this specifically: the replay
is deterministic by construction, but a mismatch would indicate a hidden draw and would itself be a
finding. **The replay matched on the first attempt.** § 5.6.6's weaker `ä`/`ö`/`å` character-class
fallback was **not** needed and was **not** taken.

- Isolated: `Tests 1 passed | 26 skipped (27)`, exit **0** —
  `${TMPDIR:-/tmp}/gsd-142/F18-clean-isolated.log`. The `1 passed` count confirms the `-t 'Test 10'`
  filter matched **exactly one** test; a filter matching nothing would have reported `1 passed | N skipped`
  with a *different* skip count and is what a title typo looks like (Pitfall 6). `Test 10` is unique in
  the file (`Test 1`…`Test 27`, no `Test 100`).
- Whole file: `Tests 27 passed (27)`, exit **0** — `${TMPDIR:-/tmp}/gsd-142/F18-clean-wholefile.log`.

Committed before injecting, per § E.2.

**Injection confirmation, from `git diff` taken while it was live** — byte-identical to 139 § 5.6.2:

```
@@ -50,7 +50,7 @@ const TOTAL_CANDIDATES = PARTY_WEIGHTS.reduce((a, b) => a + b, 0);
  * en, 109-217 fi, 218-326 sv. Math.floor(i / 109) gives the locale index for
  * candidate i in [0, 327).
  */
-export const LOCALE_BLOCK_SIZE = 109;
+export const LOCALE_BLOCK_SIZE = 327;
```

**NEW half — two runs under the same live injection, per 139 § 5.6.3 and the COLLATERAL RULE.**

*The verdict run* (isolated — **only this one bears on the verdict**):

```bash
cd "$(git rev-parse --show-toplevel)/packages/dev-seed" && npx vitest run tests/templates/default.test.ts -t 'Test 10'
```

Exit **1**. Log: `${TMPDIR:-/tmp}/gsd-142/F18-NEW-1.log`. Counts: `Tests 1 failed | 26 skipped (27)` —
again exactly one test matched the filter. Verbatim, from the first verdict-bearing lines:

```
 ❯ tests/templates/default.test.ts (27 tests | 1 failed | 26 skipped) 9ms
   × … > Test 10: faker locale cycling — three equal locale blocks (en/fi/sv), asserted at the boundary 8ms
     → expected 327 to be 109 // Object.is equality
     → expected 'Maurice' to be 'Mikael' // Object.is equality
     → expected 'Stokes' to be 'Hiltunen' // Object.is equality
```

with the three failure blocks located at:

```
AssertionError: expected 327 to be 109 // Object.is equality
 ❯ tests/templates/default.test.ts:151:36     expect.soft(LOCALE_BLOCK_SIZE).toBe(blockSize);

AssertionError: expected 'Maurice' to be 'Mikael' // Object.is equality
 ❯ tests/templates/default.test.ts:167:43     expect.soft(firstOfBlock1.first_name).toBe(fi.person.firstName());

AssertionError: expected 'Stokes' to be 'Hiltunen' // Object.is equality
 ❯ tests/templates/default.test.ts:168:42     expect.soft(firstOfBlock1.last_name).toBe(fi.person.lastName());
```

**Axis check — two independent on-axis reds, and one informative pass.**

1. **Axis 1 — constant versus derived block size**, `:151:36`: `expected 327 to be 109`. The *injected*
   constant is reported against the block size derived from the generated rows. This simultaneously
   proves the injection was **live** in the module the test imports (a positive control obtained for
   free — cf. 139 § 5.6.4, which needed a separate `npx tsx` probe to establish it) **and** that the
   derived index did **not** move with the injection, which is the whole point of the design.
2. **Axis 2 — the block-1 boundary**, `:167:43` and `:168:42`: `rows[109]` yielded **`Maurice Stokes`**
   — an English name — where the freshly-seeded `fi` Faker's first draw pair, **`Mikael Hiltunen`**, is
   owed. That is the locale collapse named directly, in the test's own terms.
3. **The block-0 `en` replay assertions at `:157-158` did NOT fail.** Under a soft-assertion run they
   executed and passed. That is not an absence of evidence, it is evidence: the corpus collapsed *to
   `en`*, so block 0's replay still matches while block 1's no longer does — precisely the regression
   139 § 5.6.2 predicted (`Math.floor(i / 327) === 0` for every `i`, so all 327 rows take
   `LOCALE_ORDER[0]`).

**Not a `TypeError`, not an out-of-range dereference, not a sibling, not a collection error.** Compare
139's cited OLD half at the identical injection: `1 passed | 26 skipped`, green.

*The collateral record* (whole file, same live injection):

```bash
cd "$(git rev-parse --show-toplevel)/packages/dev-seed" && npx vitest run tests/templates/default.test.ts
```

Exit **1**. Log: `${TMPDIR:-/tmp}/gsd-142/F18-NEW-collateral-1.log`. Result:
`Tests 1 failed | 26 passed (27)`, with the same three failure locations and no others.

**Collateral: none.** All 26 other tests in the file passed under the live injection. In particular
**Test 9**, the determinism comparison at `:113-119`, stayed green exactly as 139 § 5.6.4 recorded and
for the reason it gave — both halves call the *same* mutated generator, so a uniform locale collapse
leaves them byte-identical to each other. **Test 5** (`first_name + last_name are non-empty strings`)
also stayed green, which is the old Test 10's failure mode still visible in a sibling: non-emptiness
cannot see a locale collapse.

**Post-gate — all three conditions held:**
`git status --porcelain -- packages/dev-seed/src/templates/defaults/candidates-override.ts` (a) empty ·
`git status --porcelain -- apps tests packages` (b) empty ·
`grep -rn 'INJECTED (142)' apps packages tests` (c) no hits. `candidates-override.ts:53` was
re-confirmed to read `export const LOCALE_BLOCK_SIZE = 109;`; the post-revert whole-file run went green
(`27 passed`, exit **0**, `${TMPDIR:-/tmp}/gsd-142/F18-postrevert.log`) and
`yarn workspace @openvaa/dev-seed test:unit` exited **0** (`43 passed (43)` files,
`446 passed (446)` tests, `${TMPDIR:-/tmp}/gsd-142/dev-seed-test-unit.log`).

| Cell | Value |
|---|---|
| OLD half | **cited** — 139 § 5.6.4 (assertion **PASS** blind, file **green** 27/27, with 139's own `npx tsx` positive control), measured by Phase 139 at `12825b479` — **not** re-run here |
| NEW-assertion outcome | **FAIL (red)** on **two independent axes** — `default.test.ts:151:36` (`expected 327 to be 109`) and `:167:43` + `:168:42` (`'Maurice'`/`'Stokes'` vs `'Mikael'`/`'Hiltunen'`), exit `1`; log `${TMPDIR:-/tmp}/gsd-142/F18-NEW-1.log` |
| File outcome | **FAIL** — verdict run `1 failed \| 26 skipped (27)`; collateral run `1 failed \| 26 passed (27)`. Differs from the assertion cell only in aggregation: the sole failing test **is** the target |
| Collateral | **none** — all 26 other tests passed under the live injection (log `${TMPDIR:-/tmp}/gsd-142/F18-NEW-collateral-1.log`) |
| Verdict | **remediated** — complete negative-control pair: OLD half cited green, NEW half measured red on the finding's own axes |

**Marker exemption (re-recorded, per 139 § 5.6.2):** no `INJECTED (142)` comment was placed on the
`+` line. A trailing comment would be syntactically legal, but it would sit on the one line whose
*value* is the entire experiment, and a reader diffing this record against the tree would have to
disentangle the marker from the injected constant. Post-gate conditions (a) and (b) carried the hygiene
claim; condition (c) was run anyway and also passed.

**Faker replay: matched on the first attempt.** § 5.6.6's weaker character-class fallback was not
taken, and no hidden draw was discovered — the answer-emitter branch at `candidates-override.ts:149`
is skipped in this test because `makeCtx()` supplies `refs.questions` as `[]`
(`packages/dev-seed/tests/utils.ts:36`), so the two draws per row are the only draws and the replay is
exact.

**Run environment for this row:** HEAD `c456a381f` (the strengthened-assertion commit) with the
injection live in the working tree; Node v24.14.1; vitest 3.2.4; in-package run from
`packages/dev-seed`, per D-07's constraint against running from the repo root.

### Row 7 — F20-1 · `authorize-endpoint.test.ts:234` (bare `rejects.toThrow()` under a 400 title)

**Owned by:** plan `142-04` (wave 5, `autonomous: false` — carries D-02's endpoint fix, and A-07's).
**OLD half — `re-run`, on the PRE-FIX tree, with injection B** at `+server.ts:52` (139 § 5.10.2).
**NEW half — injection A** at `+server.ts:22` (400 → 500), per **A-03**.

**Why the halves use different injections — A-03, restated so no executor re-derives it.** Pre-fix, the
400 built at `:22` is thrown by SvelteKit's `error()` and swallowed by the `catch` at `:50`, which
returns the 500 at `:52`. So injection A is **zero-delta on the caller-observable axis** and 139 § 8.3
**R-7** correctly rejects it *for the pre-fix tree*. Post-fix the 400 no longer travels through the
catch arm, so `:52` is **off the path this test exercises** and injection B would leave the
strengthened `toMatchObject({ status: 400 })` **green** — precisely the proves-nothing control § 8.3
exists to prevent. Post-fix, injection A is exactly on-axis.

A **supplementary** observation is also recorded by that plan: injection B against the post-fix
strengthened assertion, expected **PASS**, kept as *evidence the swallow is gone* and **explicitly
labelled "not the negative control"**.

**Expect red on the un-injected tree until D-02 lands.** That is the diagnosis, not a regression.

**Pre-injection baseline, clean pre-fix tree** — `Tests 9 passed (9)`, exit 0, with the handler's own
catch-arm stderr line present (`Failed to construct authorization request: HttpError { status: 400, … }`).
That line is **the live proof of the D-02 defect**: it means the 400 was *caught* rather than returned.

| Cell | Value |
|---|---|
| OLD half | **`re-run`** — measured **this session** on the **pre-fix** tree at HEAD `d0d856d2c`, injection **B** live at `+server.ts:52` (`throw new TypeError('INJECTED (142): …')`). **GREEN (blind) ✅** exit **0**, `Tests 9 passed (9)` — the bare `rejects.toThrow()` at `:234` cannot tell a raw `TypeError` from an `HttpError` carrying a status. **Reproduces** 139 § 5.10.4 row B exactly (PASS blind, file green 9/9) — **zero divergence**; 139's value is *reproduced*, not *used*. Log `${TMPDIR}/gsd-142/F20-1-OLD-B-1.log`. Injection **A** was **not** run for this half — § 8.3 **R-7** forbids it on the pre-fix tree (zero delta on the caller-observable axis), and 139 already recorded its outcome |
**The strengthened assertion's PRE-FIX colour was MEASURED, not stated** (operator-approved addition —
the plan asserts this red but never scheduled the measurement). Product source rolled back to
`a552e78b1` with the strengthened test file left at HEAD: **RED**, `authorize-endpoint.test.ts:240:5`,
`- "status": 400` / `+ HttpError { "status": 500 }` — the caller was receiving the catch arm's 500.
Log `${TMPDIR}/gsd-142/F20-strengthened-PREFIX.log`. Restored with `git checkout HEAD -- <path>` (**not**
`git checkout -- <path>`, which restores the *staged* rollback — the wave-4 trap) and verified byte-identical.

| Cell | Value |
|---|---|
| NEW-assertion outcome | **FAIL (red)** ✅ — injection **A** @ `+server.ts:22` on the **post-fix** tree, `authorize-endpoint.test.ts:240:5`, `AssertionError: expected { Object (status, body) } to match object { status: 400 }`, diff `- "status": 400` / `+ HttpError { "status": 500 }`, exit 1. **A-03's `[DERIVED]` prediction CONFIRMED by measurement** — post-fix the caller receives the `HttpError` built at `:22`, so its status is exactly the axis the assertion reads. Log `${TMPDIR}/gsd-142/F20-1-NEW-A-1.log` |
| File outcome | **FAIL** — `Tests 1 failed \| 8 passed (9)`, exit 1 |
| Collateral | **none** — the sole red **is** the target assertion; the other 8 tests in the file passed |
| **supplementary (NOT the negative control)** | injection **B** @ `:52` on the **post-fix** tree — **PASS**, `Tests 9 passed (9)`, exit 0. Recorded as **evidence the swallow is gone**: post-fix the 400 is re-thrown at the head of the catch, so `:52` is off the path this test exercises and B can no longer affect it. **This green is `not the negative control`** — a reader finding it unlabelled would misread it as a failed control. A-03's second `[DERIVED]` prediction, likewise CONFIRMED. Log `${TMPDIR}/gsd-142/F20-1-supp-B-1.log` |
| Verdict | **remediated** — complete negative-control pair with the axis **inverted** across the fix exactly as A-03 predicted: OLD half **B** green-blind on the pre-fix tree, NEW half **A** red on the post-fix tree. Product `0f8e99a68`; tests `ea5d34109` |

### Row 8 — F20-2 · `overrides.test.ts:32-36` (`typeof result` is `'string'`)

**Owned by:** plan `142-05` (wave 3).
**Injection (139 § 5.11.2):** at `overrides.ts:36`. **§ 8.3 R-8 is forbidden** — a `throw` in the catch
arm reds before *and* after, because a crash is visible to every matcher.
**OLD half — `cited`:** 139 § 5.11.4 records assertion **PASS**, file **green 7/7**.
**E3 is procedural as well as structural:** the target is `toBe('{broken, plural, }')`, the raw template
exactly. If the implementation returns something else, **that is a finding to record**, never a value
copied out of the run output (Pitfall 8).

**E3's procedural clause was NOT engaged — and that is a measurement, not an assumption.** The assertion
was written from the *contract* (the template the fixture sets at `:33`, which `overrides.ts:36` promises
to return unchanged) and only then run. The clean tree came back **green 7/7**, exit 0
(`${TMPDIR}/gsd-142/F20-2-NEW-0-cleantree.log`), confirming the implementation really does return
`'{broken, plural, }'` verbatim. No value was copied out of a run into an assertion at this site.

**The remediation, as committed** (`cba97b2a1`, `apps/frontend/src/lib/i18n/tests/overrides.test.ts`):

```ts
    const result = getOverride('bad.key', { broken: 1 });
    expect(result).toBe('{broken, plural, }');
```

replacing `expect(typeof result).toBe('string')`. The point of the upgrade is stated inline in the test
with a *do not weaken this back* note: **every** wrong value the fallback could return — an empty string,
the key name, a half-formatted string — is also a `string`, so `typeof` could not fail for any of them.

**Injection confirmation, from `git diff` taken while it was live** — byte-identical to 139 § 5.11.2:

```
   } catch {
-    return template;
+    return ''; // INJECTED (142): the fallback returns nothing instead of the raw template
   }
```

The catch arm is preserved and still returns a `string`; only the *value* varies. That is deliberate and
is what distinguishes this control from **§ 8.3 R-8**, the forbidden `throw`-in-the-catch design: a crash
is visible to every matcher including `typeof`, so R-8 reds before **and** after and proves nothing.
**R-8 was excluded by name and never run.**

**The red, on-axis** (`${TMPDIR}/gsd-142/F20-2-NEW-1.log`): exit **1**,
`AssertionError: expected '' to be '{broken, plural, }' // Object.is equality` at
`overrides.test.ts:39:20`, with vitest's expected/received diff showing the empty received value against
the expected template.

**Collateral: none.** `Tests 1 failed | 6 passed (7)` — exactly the one test that reaches the catch arm
went red, matching 139 § 5.11.4's record that 1 of the file's 7 tests exercises `overrides.ts:36`. The
sibling ICU test at `:23-30` uses a well-formed plural, so it never enters the catch.

**Post-revert:** `Tests 7 passed (7)`, exit 0 (`${TMPDIR}/gsd-142/F20-2-postrevert.log`).

| Cell | Value |
|---|---|
| NEW-assertion outcome | **FAIL (red)** ✅ — `overrides.test.ts:39:20`, `AssertionError: expected '' to be '{broken, plural, }' // Object.is equality`, exit 1 — `${TMPDIR}/gsd-142/F20-2-NEW-1.log` |
| File outcome | **FAIL** — `Tests 1 failed \| 6 passed (7)`, exit 1 |
| Collateral | **none** — the only red is the strengthened assertion itself |
| Verdict | **remediated** |

### Row 9 — F20-3 · `getIdTokenClaims.test.ts:236,259` (`result.success` is `false`, no error code)

**Owned by:** plan `142-04` (wave 5, `autonomous: false`).
**Injection (139 § 5.12.2):** **A** at `getIdTokenClaims.ts:39-46`, **B** at `:29`. **Control C is
forbidden** — § 8.3 **R-9**: inverting the asserted boolean on the success return reds before *and*
after, because it is visible to the blind matcher too.

**Why this row is `re-run` — the derivation, recorded rather than assumed.** D-06's exception list named
two findings at CONTEXT time (F15-A, F20-1), but the decision text also says: *"Any further file the
phase changes for a non-assertion reason joins this list."* **A-07** accepts a **third product change**
— splitting `getIdTokenClaims`'s single error branch into two discriminating error codes, because the
two sites reach the *same* branch today and both return `error: {}`, so E6's "differ observably" is
unsatisfiable by an assertion alone. That change is to `getIdTokenClaims.ts` and is **not** an
assertion edit, so it invalidates 139's citation for this finding specifically. **Row 9 is therefore a
third re-run exception beyond the two named at CONTEXT time.** Per A-08 its OLD half is measured on the
pre-fix tree.

**Known collateral, pre-identified:** injection A reds the three success-path tests at
`getIdTokenClaims.test.ts:147,174,203` (139 § 8.1 C-5). Those go in the `Collateral` cell, never the
assertion cell.

| Cell | Value |
|---|---|
| OLD half | **`re-run`** — **both** injections measured **this session** on the **pre-fix** tree at HEAD `d0d856d2c`, in two separate HYGIENE-LOOP iterations with a clean three-condition post-gate between them. **A** (`:39-46` → `return { success: false, error: {} }`): **both sites GREEN (blind) ✅** while the FILE **reds** — `Tests 3 failed \| 2 passed (5)`, exit 1, the three failures at `:147:30`, `:174:30`, `:203:30`, none of them a site. Log `${TMPDIR}/gsd-142/F20-3-OLD-A-1.log`. **B** (`:29` → an unrelated message): **both sites GREEN (blind) ✅**, file **green** `Tests 5 passed (5)`, exit 0, **zero** collateral. Log `${TMPDIR}/gsd-142/F20-3-OLD-B-1.log`. **Reproduces** 139 § 5.12.4 rows A and B exactly — **zero divergence**. Control **C** was **not** run (§ 8.3 **R-9**). **Why re-run rather than cited:** the D-06 derivation above — A-07 changes `getIdTokenClaims.ts` for a **non-assertion** reason, so D-06's own clause (*"any further file the phase changes for a non-assertion reason joins this list"*) puts this finding on the re-run list as a **third** exception beyond the two named at CONTEXT time |
**⚠ DIVERGENCE FROM THE PLAN — injection A is ZERO-DELTA on both sites, post-fix.** The plan predicted
*"RED on both code assertions"* under injection A. **Measured: both sites PASS.** The reason is
structural and was mis-analysed at plan time: both F20-3 fixtures **throw before the injected success
return is reachable** (the empty set throws at the empty-set check; the kid miss throws at the lookup),
so replacing the success return changes **nothing either site observes**. Under the injection the two
sites still received their *correct* codes — which the strengthened assertions prove, by passing.

This is **139 § 8.3 R-7's class, applied to F20-3**: an injection that changes something real (the
success path) but nothing on the axis the sites under test read. Pre-fix it *looked* like blindness
because the sites could not see cause; post-fix, with cause asserted, the zero-delta nature is exposed —
even a strengthened assertion cannot red under it. **Injection A is therefore NOT F20-3's negative
control, and its green proves nothing about these two assertions.** Its only live effect is on the three
success-path tests (C-5), which are **not** sites. Had this been recorded as the negative control, it
would have been exactly the proves-nothing control § 8.3 exists to prevent.

**The assertion was NOT weakened to make a control pass.** Instead the on-axis controls are the two
**relocated** injections below, which vary the *reason* and drop the *code* at each branch in turn.

**Both strengthened assertions' PRE-FIX colour was MEASURED** (operator-approved addition): product
source rolled back to `a552e78b1`, tests at HEAD — **both RED**, `getIdTokenClaims.test.ts:241:22` and
`:268:22`, each `expected { success: false, error: {} } to match object { … code: … }`, i.e. the empty
error object both sites received before the split existed. Log
`${TMPDIR}/gsd-142/F20-strengthened-PREFIX.log`.

| Cell | Value |
|---|---|
| NEW-assertion outcome | **FAIL (red)** ✅ — on **both** sites, each under its **own** branch's regression, in two separate iterations. **B (relocated to the kid-mismatch throw)**: `getIdTokenClaims.test.ts:268:22` red *alone*, `expected { success: false, error: {} } to match object { success: false, error: { code: 'ERR_JWK_KID_MISMATCH' } }`, exit 1 — `${TMPDIR}/gsd-142/F20-3-NEW-B-1.log`. **B′ (the symmetric relocation to the empty-set throw)**: `:241:22` red *alone*, same shape against `ERR_JWKS_EMPTY`, exit 1 — `${TMPDIR}/gsd-142/F20-3-NEW-Bprime-1.log`. Each site reds under its own branch and stays **green** under the other's, which is a *stronger* result than one red: it proves the two branches are genuinely discriminated rather than collapsing to a shared code |
| File outcome | **FAIL** under each — `Tests 1 failed \| 4 passed (5)`, exit 1, in both runs |
| Collateral | **none** under **B** and **B′** — the sole red in each run **is** the target assertion; the three success-path tests stayed green. **Under injection A: C-5 at `getIdTokenClaims.test.ts:147:30`, `:174:30`, `:203:30`** — three success-path tests, **none of them a site**. Recorded here and **never** in the assertion cell (D-08's two-column rule; RESEARCH § Pitfall 2). Log `${TMPDIR}/gsd-142/F20-3-NEW-A-1.log`, `Tests 3 failed \| 2 passed (5)` |
| **injection A, post-fix (NOT the negative control)** | **PASS on both sites** — zero-delta, per the divergence analysis above. Recorded as a **finding about the injection design**, not as evidence about the assertions. 139's § 5.12.2 injection A should arguably have carried an R-prohibition for these two sites, on the same reasoning R-7 applies to F20-1's injection A |
| Verdict | **remediated** — both sites carry a measured pre-fix RED and a measured post-fix on-axis RED, via **B** and **B′**. The two codes make the two titles differ observably (D-11 E6 satisfied). Product `0f8e99a68`; tests `ea5d34109` |

### Row 10 — F20-4 · `supabaseAdminClient.test.ts:160` (`toContain('id')` substring-matches `external_id`)

**Owned by:** plan `142-03` (wave 1) — **this plan**, Task 2. The phase **tracer**: the thinnest
complete path through the inverted loop.
**Injection (139 § 5.13.2), verbatim:**

```diff
  packages/dev-seed/src/supabaseAdminClient.ts:708
-      .select('id, external_id, first_name, last_name')
+      .select('external_id, first_name, last_name')
```

**Marker exemption, carried from 139 § 5.13.2 and re-recorded here:** no `INJECTED (142)` comment is
placed on the `+` line. The changed token is a string-literal argument inside a fluent call chain; a
trailing comment there would alter the call's formatting without altering its meaning. Post-gate
conditions **(a)** and **(b)** carry the hygiene claim; condition **(c)** is a supplement this site does
not exercise.

**OLD half — `cited`:** 139 § 5.13.4 records assertion **PASS** (blind) and file **green**, measured by
Phase 139 at `12825b479` (`34 passed`, byte-identical to its own pre-injection and post-revert
baselines). `supabaseAdminClient.ts` is not changed by this phase for any non-assertion reason, so
D-06's citation rule applies unqualified. **This is a citation of 139's measurement, not a run performed
here.**

**Zero collateral, pre-analysed by 139 and re-confirmed at HEAD** (`142-RESEARCH.md` § B.10): the
siblings at `:161-163` name three columns the injected string still contains; `:164-166` cover
`eq`/`like`/`order`, untouched by the injection; `:167-168` read the **mocked** return data, which is
independent of the select string entirely.

**The remediation, as committed** (`2372935bf`, `packages/dev-seed/tests/supabaseAdminClient.test.ts`).
`toContain('id')` at `:160` is replaced by exact equality on the recorded call argument. The D-11 **E4**
discretion was resolved by **measurement**, not preference: `mockState.selectCalls` is declared
`Array<string>` at `:28` and the builder stub at `:69-73` pushes the raw `cols` string, so
`selectCalls[0]` is a **`string`** — `toBe` on the string is the form, and `toEqual` on an array is
not applicable because there is no array (A-01, `142-RESEARCH.md` § B.10).

```ts
      expect(mockState.fromCalls).toContain('candidates');
      // Guard the dereference before asserting on the recorded call: a zero-call
      // regression must red as an assertion failure, not a TypeError on index 0.
      expect(mockState.selectCalls.length).toBeGreaterThanOrEqual(1);
      expect(mockState.selectCalls[0]).toContain('external_id');
      expect(mockState.selectCalls[0]).toContain('first_name');
      expect(mockState.selectCalls[0]).toContain('last_name');
      // Exact selected-column list. …
      expect(mockState.selectCalls[0]).toBe('id, external_id, first_name, last_name');
```

Two design points, both load-bearing for the axis this row credits:

1. **A-09's guard is present** — `expect(mockState.selectCalls.length).toBeGreaterThanOrEqual(1)`
   precedes every `selectCalls[0]` dereference, so a zero-call regression would red as an assertion
   failure rather than a `TypeError` on `[0]`. In a phase where red is the success signal, an
   unguarded dereference manufactures a red the ledger **cannot** credit.
2. **The three sibling `toContain` matchers were kept, and moved ahead of the exact match.** They are
   redundant once the full string is pinned, so this is not extra coverage — it is *evidence
   ordering*. Under the injection they execute first and pass, and only then does the strengthened
   assertion red. The failing line reported below is `:169`, after all three, which is the direct
   measurement of `behavior` bullet 3 ("the siblings remain satisfied — the red must come from the
   exact-string assertion"). **No sibling was removed**, so no removal is recorded here.

**Clean-tree confirmation, before the injection** (required by A-08/§ E.2: the durable edit is
committed *before* the injection, or the next pre-gate fails on this plan's own work):

```
 ✓ tests/supabaseAdminClient.test.ts (7 tests) 4ms
 Test Files  1 passed (1)
      Tests  7 passed (7)
```
exit **0** — log `${TMPDIR:-/tmp}/gsd-142/F20-4-NEW-0-cleantree.log`.

**Injection confirmation, from `git diff` taken while it was live:**

```
@@ -705,7 +705,7 @@ export class SupabaseAdminClient {
   ): Promise<Array<{ id: string; external_id: string; first_name: string; last_name: string }>> {
     const { data, error } = await this.client
       .from('candidates')
-      .select('id, external_id, first_name, last_name')
+      .select('external_id, first_name, last_name')
       .eq('project_id', this.projectId)
       .like('external_id', `${externalIdPrefix}%`)
       .order('external_id', { ascending: true });
```

**NEW half — invocation** (whole file; 139 § 5.13.4 predicted zero collateral at this site and
`142-RESEARCH.md` § B.10 re-confirmed it at HEAD, so no isolated `-t` verdict run was needed):

```bash
cd "$(git rev-parse --show-toplevel)/packages/dev-seed" && npx vitest run tests/supabaseAdminClient.test.ts
```

**NEW half — observed. Exit code `1`.** Log: `${TMPDIR:-/tmp}/gsd-142/F20-4-NEW-1.log`. Verbatim, from
the first verdict-bearing line:

```
 ❯ tests/supabaseAdminClient.test.ts (7 tests | 1 failed) 6ms
   × SupabaseAdminClient portrait surface > selectCandidatesForPortraitUpload > queries candidates table with project_id eq + external_id like prefix + order by external_id asc 4ms
     → expected 'external_id, first_name, last_name' to be 'id, external_id, first_name, last_name' // Object.is equality
   ✓ … throws descriptively when the select returns an error 1ms
   ✓ … returns empty array when no rows match (count=0 template case) 0ms
   ✓ … uploads to public-assets bucket with 3-segment RLS-compliant path + jpeg contentType + upsert=true 0ms
   ✓ … throws candidate-scoped error when storage upload fails 0ms
   ✓ … updates the `image` JSONB column (NOT `image_id`) with the given {path, alt} 0ms
   ✓ … throws candidate-scoped error when the update fails 0ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/supabaseAdminClient.test.ts > SupabaseAdminClient portrait surface > selectCandidatesForPortraitUpload > queries candidates table with project_id eq + external_id like prefix + order by external_id asc
AssertionError: expected 'external_id, first_name, last_name' to be 'id, external_id, first_name, last_name' // Object.is equality

Expected: "id, external_id, first_name, last_name"
Received: "external_id, first_name, last_name"

 ❯ tests/supabaseAdminClient.test.ts:169:40

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
```

**Axis check — the part that decides whether this row may be credited.** The failure is an
`AssertionError` at `tests/supabaseAdminClient.test.ts:169:40`, which is the strengthened `toBe`
line and nothing else. It is **not** a `TypeError`, **not** a sibling matcher, **not** a collection
error, and **not** another test in the file. The message carries the expected-versus-received
column-string diff, naming `id` as the missing token — i.e. it reports the regression in the terms the
finding's own title promises. Compare 139's cited OLD half at the identical injection: `34 passed`,
green throughout.

**Collateral: none.** The other six tests in the file passed under the live injection, exactly as
139 § 5.13.4 recorded and § B.10 re-confirmed. Nothing is carried to a collateral section for this site.

**Post-gate — all three conditions held** before Task 3 began:
`git status --porcelain -- packages/dev-seed/src/supabaseAdminClient.ts` (a) empty ·
`git status --porcelain -- apps tests packages` (b) empty ·
`grep -rn 'INJECTED (142)' apps packages tests` (c) no hits. `supabaseAdminClient.ts:708` was
re-confirmed to read `.select('id, external_id, first_name, last_name')`, and the post-revert run went
green again (`7 passed`, exit **0**, `${TMPDIR:-/tmp}/gsd-142/F20-4-postrevert.log`).

| Cell | Value |
|---|---|
| OLD half | **cited** — 139 § 5.13.4 (assertion **PASS**, file **green** 34/34), measured by Phase 139 at `12825b479` — **not** re-run here |
| NEW-assertion outcome | **FAIL (red)** — `AssertionError` at `supabaseAdminClient.test.ts:169:40`, exit `1`; log `${TMPDIR:-/tmp}/gsd-142/F20-4-NEW-1.log` |
| File outcome | **FAIL** — `Test Files 1 failed (1)`, `Tests 1 failed \| 6 passed (7)`. Differs from the assertion cell only in aggregation: the sole failure **is** the target assertion |
| Collateral | **none** — no other test in the file changed state |
| Verdict | **remediated** — complete negative-control pair: OLD half cited green, NEW half measured red on the finding's own axis |

**Marker exemption (re-recorded, per 139 § 5.13.2):** no `INJECTED (142)` comment was placed on the
`+` line; the changed token is a string literal inside a fluent call chain. Post-gate conditions (a)
and (b) carried the hygiene claim for this site, and condition (c) — which this site does not exercise
— was run anyway and also passed.

**Run environment for this row:** HEAD `2372935bf` (the strengthened-assertion commit) with the
injection live in the working tree; Node v24.14.1; vitest 3.2.4; in-package run from
`packages/dev-seed`, per D-07's constraint against running from the repo root.

### Row 11 — F20-5 · `variants.test.ts:5-12` (`forEach` with no length guard)

**Owned by:** plan `142-05` (wave 3).
**Injection (139 § 5.14.2):** **A** at `variants.ts:94` and **B** at `:100`. 139 § 5.14.4 records
**both** as PASS with the file green (1/1) — but they are **not the same fact**: **A is vacuous** (the
parse returns an empty array, so the `forEach` body never runs) and **B is blind** (the body runs and
the wrong ID propagates unnoticed). The ledger records the distinction because E5's remediation — an
exact count derived from `getTestData().nominations`, measured at **35** (A-01) — closes the vacuity
hole, while the existing per-row assertions close the other.
**⚠ § 8.3 R-5 forbids** `electionId: undefined` at `variants.ts:100` as a *negative control*: it reds
before and after, and it is 139's **positive control**, not a regression.
**OLD half — `cited`:** 139 § 5.14.4 (both PASS, file green 1/1).
**⚠ A-09 hazard specific to this row:** `packages/data` is the one injection site under a `src/` that
other packages consume via `dist/`. It must **never** be live during a root `turbo run test:unit` — a
root run would rebuild `@openvaa/data`'s `dist/` and hand the injected build to
`argument-condensation`, `frontend` and `dev-seed`. Per-finding runs stay **in-package**.

**Build-hazard compliance, stated as a fact rather than an intention:** every run recorded below was
`cd packages/data && npx vitest run …`. **No root `turbo run test:unit` / `yarn test:unit` was executed
at any point while either injection was live**, and none was running concurrently (checked before the
first injection). The root unit gate belongs to `142-06`, on the reverted tree.

**The remediation, as committed** (`a02b92e51`, `packages/data/src/objects/nominations/variants/variants.test.ts`).
The file grew from 12 lines to 35 and now closes **two different holes**:

```ts
  const expectedCount = Object.values(tree)
    .flatMap((byConstituency) => Object.values(byConstituency))
    .reduce((count, nominations) => count + nominations.length, 0);

  expect(expectedCount).toBeGreaterThan(0);
  expect(nominationData).toHaveLength(expectedCount);

  const electionIds = Object.keys(tree);
  nominationData.forEach((d) => {
    expect(electionIds).toContain(d.electionId);
    expect(Object.keys(tree[d.electionId])).toContain(d.constituencyId);
  });
```

- **Vacuity** — the old file's only assertions lived *inside* a `forEach` over the parse result, so a
  parse returning `[]` satisfied it without executing anything at all. The length assertion closes that.
- **Vacuity of the derivation itself** — `expect(expectedCount).toBeGreaterThan(0)` is not decoration.
  An empty fixture would make `expectedCount` 0 and `toHaveLength(0)` would then be satisfied by exactly
  the parse the length assertion exists to reject.
- **Blindness** — definedness became **membership** against the fixture tree's own keys, so a
  defined-but-wrong id fails.

**Derived, never pinned.** `grep -vE '^\s*(\*|//)' … | grep -c '35'` returns **0**. The count was
nevertheless *confirmed* by probe rather than trusted from A-01: a throwaway `toBe(-1)` edit made the
runner print `expected 35 to be -1`, matching A-01's measured 35; the probe was reverted immediately and
the literal was never written into the file. Injection A's own failure message independently re-states
it (`to have a length of 35`), which is the derivation reporting itself.

**Injection confirmations, from `git diff` taken while each was live** — byte-identical to 139 § 5.14.2:

```
  export function parseNominationTree(tree: NominationVariantTree): Array<AnyNominationVariantPublicData> {
+   return []; // INJECTED (142): the parse yields nothing            <- A
```

```
            ...n,
-           electionId,
+           electionId: 'WRONG-ELECTION-ID', // INJECTED (142): a defined but incorrect id   <- B
```

**Why BOTH are re-applied, restated because it is the whole point of this row.** 139 § 5.14.4 recorded
both as assertion PASS with the file green 1/1, but the two passes are **not the same fact**: under A the
assertions never ran (vacuity); under B they ran and were satisfied (blindness). The strengthened
assertion had to close both, so both were measured — and they red on **different lines**, which is the
evidence that they are different holes:

- **A (vacuity) → the LENGTH assertion.** `variants.test.ts:21:26`,
  `AssertionError: expected [] to have a length of 35 but got +0`, exit **1**, `Tests 1 failed (1)`
  (`${TMPDIR}/gsd-142/F20-5-NEW-A-1.log`). Not a `TypeError` from dereferencing an empty array — the
  length assertion fires before any per-row work.
- **B (blindness) → the MEMBERSHIP assertion.** `variants.test.ts:33:25`,
  `AssertionError: expected [ 'election-1', 'election-2' ] to include 'WRONG-ELECTION-ID'`, exit **1**,
  `Tests 1 failed (1)` (`${TMPDIR}/gsd-142/F20-5-NEW-B-1.log`). Execution reached `:33`, so the length
  assertion **passed** under B — confirming B leaves the count intact and attacks only the values.

**A-09's guard demonstrably did its job, and this row is where it mattered most.** Under B,
`tree['WRONG-ELECTION-ID']` is `undefined`, so `Object.keys(…)` at `:34` would throw a `TypeError` — a
red the ledger **could not credit**. The election-membership assertion at `:33` is ordered first and kept
**hard** precisely so it fails first and stops the test. The reasoning is written inline at `:26-32`
with an explicit instruction not to reorder the two lines or make them soft.

**`expect.soft` was considered and deliberately NOT used** — and here the reason is mechanical rather
than stylistic. A soft election-membership assertion would record its failure and then **continue** to
the `:34` dereference, producing exactly the wrong-axis `TypeError` the guard exists to prevent. Wave 2
flagged F20-5 as a soft-assertion candidate on the grounds that it has two injections; but A and B are
run in **separate loop iterations**, never together, so no single run ever needs more than one axis. The
guarded soft-assertion budget is untouched.

**Collateral — measured package-wide, not cited.** 139 recorded "file green 1/1", which for a one-test
file says nothing about the blast radius; `parseNominationTree` is reachable from `testUtils`' fixture
construction, so siblings are genuinely exposed. Both injections were therefore run against the whole
package while live:

- **A:** `Test Files 5 failed | 42 passed (47)`, `Tests 8 failed | 236 passed (244)`
  (`${TMPDIR}/gsd-142/F20-5-NEW-A-collateral-1.log`). Beyond this row's own test: `dataRoot.test.ts`
  (×2), `typeGuards.test.ts`, `election.test.ts` (×2), `nomination.test.ts` (×2) — **7** tests.
- **B:** `Test Files 9 failed | 38 passed (47)`, `Tests 12 failed | 232 passed (244)`
  (`${TMPDIR}/gsd-142/F20-5-NEW-B-collateral-1.log`). Beyond this row's own test: `dataRoot.test.ts`,
  `election.test.ts` (×2), `faction.test.ts`, `nomination.test.ts` (×2), `allianceNomination.test.ts`
  (×2), `candidateNomination.test.ts`, `factionNomination.test.ts`,
  `organizationNomination.test.ts` — **11** tests.

None of these is credited as the negative control (D-08). They are recorded because a reader re-running
these injections will see a large red field and must be able to tell which single red is the evidence.

**⚠ § 8.3 R-5 was excluded by name and never run.** `electionId: undefined` at `variants.ts:100` reds the
*pre-fix* test too — it is 139's **positive control** (proving the array is non-empty in un-injected
code), not a regression candidate. Injection B's `'WRONG-ELECTION-ID'` is the *defined but incorrect*
form R-5 is not.

**Post-revert:** the whole package is green — `Test Files 47 passed (47)`, `Tests 244 passed (244)`,
exit 0 (`${TMPDIR}/gsd-142/F20-5-postrevert-package.log`).

| Cell | Value |
|---|---|
| NEW-assertion outcome | **FAIL (red)** ✅ ×2 on **different axes**. **A:** `variants.test.ts:21:26`, `expected [] to have a length of 35 but got +0`, exit 1 — `${TMPDIR}/gsd-142/F20-5-NEW-A-1.log`. **B:** `variants.test.ts:33:25`, `expected [ 'election-1', 'election-2' ] to include 'WRONG-ELECTION-ID'`, exit 1 — `${TMPDIR}/gsd-142/F20-5-NEW-B-1.log` |
| File outcome | **FAIL** under each — `Tests 1 failed (1)`; the file holds exactly one test, so no in-file collateral is possible |
| Collateral | **A:** 7 further tests / 4 files (`dataRoot` ×2, `typeGuards`, `election` ×2, `nomination` ×2) — package run `8 failed \| 236 passed (244)`. **B:** 11 further tests / 8 files — package run `12 failed \| 232 passed (244)`. Both measured package-wide under the live injection; neither credited |
| Verdict | **remediated** — A closes vacuity, B closes blindness, and the two reds land on different assertions |

### Row 12 — F20-6 · `planValidation.test.ts:104` (bare `toThrow()` among seven message matchers)

**Owned by:** plan `142-02` (wave 2).
**Injection (139 § 5.15.2):** at `planValidation.ts:169`. **§ 8.3 R-1 is forbidden** — *deleting* the
throw removes the whole category, so the red would come from "no throw at all" rather than from message
confusion.
**OLD half — `cited`:** 139 § 5.15.4 records the assertion **PASS in isolation**; the whole-file
**FAIL** is **C-1 collateral** at `:94` (139 § 8.1) and is **not** the verdict. This row is the clearest
case in the corpus for D-08's two-column rule, and its `File outcome` cell is expected to differ from
its `NEW-assertion outcome` cell for reasons that have nothing to do with the remediation.
**E7's model is in the same file:** `:94` already carries a message matcher and is the **contrast**,
not a defect — it needs no change (D-05).

**Injection (139 § 5.15.2), verbatim as applied here:**

```diff
  packages/argument-condensation/src/core/utils/condensation/planValidation.ts:169
-    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
+    throw new Error('refine can only be followed by ground'); // INJECTED (142): a DIFFERENT invariant's message
```

**The substituted message is not arbitrary.** It is the live, verbatim message of a genuinely
different invariant in the **same module** — `planValidation.ts:110`, inside `validateStepFlow` — and
it is the message the sibling test at `:86` pins. The injection therefore simulates the precise
confusion F20-6 predicts: a bare `toThrow()` cannot tell "the pipeline ends in a list-of-lists" from
"refine was followed by the wrong thing".

**§ 8.3 R-1 was excluded by name.** *Deleting* the `:169` throw is forbidden: the resulting red would
come from the absence of **any** throw rather than from message confusion. A removal injection cannot
measure discrimination, because it destroys the thing to be discriminated. It was not run here.

**The remediation, as committed** (`8e71038c1`), copying the multi-line style of the `:94-96` sibling
because the target message exceeds the line budget:

```ts
    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow(
      'Pipeline must end with a single list, but ends with listOfLists in 100 batch(es)'
    );
```

**The batch count is 100, and it was traced, not copied.** Against the live source: the steps are
`REDUCE(denominator: 10)` then `MAP(batchSize: 1)` at `commentCount: 100`. REDUCE gives
`batchCount = ceil(1/10) = 1` and `structure = 'list'` (`:156-160`); MAP then gives
`batchCount = ceil(100/1) = 100` and `structure = 'listOfLists'` (`:146-150`); the guard at `:168-169`
throws naming both. **The sibling at `:94-96` pins the same invariant's message with `2`** — copying
that literal instead of tracing this input is the obvious way to get this row wrong, and the
derivation is written inline in the test so a later reader does not "correct" 100 to 2.

**`:94-96` was NOT edited (D-05).** `git diff -U0` over the file shows a single hunk, `@@ -104 +104,10 @@`;
`grep -c 'in 2 batch(es)'` still returns exactly **1**. The sibling is the *contrast* that makes F20-6
visible — seven message matchers and one bare `toThrow()` — not a defect.

**Clean-tree confirmation, before the injection:** `Tests 10 passed (10)`, exit **0**
(`${TMPDIR:-/tmp}/gsd-142/F20-6-NEW-0-cleantree.log`); and the isolated filter matched exactly one
test on the clean tree too — `Tests 1 passed | 9 skipped (10)`
(`${TMPDIR:-/tmp}/gsd-142/F20-6-clean-isolated.log`), which rules out the title typo that RESEARCH
§ Pitfall 6 describes. `npx tsc --noEmit` over the package exits **0**.

**TWO runs under the SAME live injection** (139 § 5.15.3 and the COLLATERAL RULE):

```bash
# verdict run — isolated
npx vitest run tests/unit/planValidation.test.ts \
  -t 'It should throw if a final map step would produce multiple batches'
# collateral record — whole file
npx vitest run tests/unit/planValidation.test.ts
```

**NEW half — the VERDICT run. Exit code `1`.** Log: `${TMPDIR:-/tmp}/gsd-142/F20-6-NEW-1.log`:

```
 ❯ tests/unit/planValidation.test.ts (10 tests | 1 failed | 9 skipped) 5ms
   ↓ … (nine skipped, including `It should throw if the pipeline does not result in a single list`)
   × validatePlan > It should throw if a final map step would produce multiple batches 5ms
     → expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'

 FAIL  tests/unit/planValidation.test.ts > validatePlan > It should throw if a final map step would produce multiple batches
AssertionError: expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'

Expected: "Pipeline must end with a single list, but ends with listOfLists in 100 batch(es)"
Received: "refine can only be followed by ground"

 ❯ tests/unit/planValidation.test.ts:111:62

 Test Files  1 failed (1)
      Tests  1 failed | 9 skipped (10)
```

**Counts checked (Pitfall 6):** `1 failed | 9 skipped (10)` — exactly **one** test matched the `-t`
filter, and it is the F20-6 test. A filter matching nothing would have reported `1 passed | 9 skipped`,
which is what a title typo looks like. The C-1 sibling is among the nine **skipped**, so it cannot
contribute to this cell at all.

**Axis check.** `AssertionError` at `planValidation.test.ts:111:62` — the strengthened exact-message
matcher. The expected/received pair is the discrimination F20-6 names: the throw still happens, of the
same category, and only the *reason* differs. Compare 139's cited OLD half at the identical injection:
the isolated run was **green** (`Tests 1 passed | 9 skipped`), i.e. the bare `toThrow()` accepted a
different invariant's message without complaint.

**NEW half — the COLLATERAL record (whole file). Exit code `1`.** Log:
`${TMPDIR:-/tmp}/gsd-142/F20-6-NEW-collateral-1.log`:

```
 ❯ tests/unit/planValidation.test.ts (10 tests | 2 failed) 7ms
   ✓ … (eight passing)
   × validatePlan > It should throw if the pipeline does not result in a single list 5ms
     → expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'
   × validatePlan > It should throw if a final map step would produce multiple batches 1ms
     → expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'

 ❯ tests/unit/planValidation.test.ts:94:62
 ❯ tests/unit/planValidation.test.ts:111:62

 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

**Why the second red is collateral and not evidence — C-1, stated in full.** `planValidation.test.ts:94`
pins the **old** message for the *same* `throw` statement at `planValidation.ts:169`, reached through a
different input (`MAP(10)` then `REDUCE(5)` → `in 2 batch(es)`). It reds under this injection because
it is a **second test through the same throw**, not because it caught F20-6's regression — it was
already a message matcher before this phase touched anything, and D-05 left it untouched. 139 § 8.1
recorded exactly this at `:94:62`, and § 5.15.4 predicted that **post-remediation both `:94` and `:104`
red**; that prediction is now measured. Crediting the `:94` red as the negative control is precisely
the error D-08's two-column rule exists to prevent: it would report the site as "caught" on the
strength of a sibling that was never blind in the first place. The `NEW-assertion outcome` cell
therefore cites the **isolated** run and nothing else.

**Post-gate — all three conditions held:** (a) `git status --porcelain -- packages/argument-condensation/src/core/utils/condensation/planValidation.ts` empty · (b) `git status --porcelain -- apps tests packages` empty · (c) `grep -rn 'INJECTED (142)' apps packages tests` no hits.
`planValidation.ts:169` re-read as the original template throw; the post-revert run went green again
(`Tests 10 passed (10)`, exit **0**, `${TMPDIR:-/tmp}/gsd-142/F20-6-postrevert.log`), and the package
gate `yarn workspace @openvaa/argument-condensation test:unit` exits **0** —
`Test Files 6 passed (6)`, `Tests 30 passed (30)`
(`${TMPDIR:-/tmp}/gsd-142/argument-condensation-test-unit.log`).

**Run environment for this row:** HEAD `8e71038c1` (the strengthened-assertion commit) with the
injection live in the working tree; Node v24.14.1; vitest 3.2.4; in-package run.

| Cell | Value |
|---|---|
| OLD half | **cited** — 139 § 5.15.4 (assertion **PASS** blind in the isolated run; the whole-file FAIL was C-1 collateral at `:94`), measured by Phase 139 at `12825b479` — **not** re-run here |
| NEW-assertion outcome | **FAIL (red)** — **isolated verdict run only**: `AssertionError` at `planValidation.test.ts:111:62`, exit `1`, `Tests 1 failed \| 9 skipped (10)` with exactly one test matched; log `${TMPDIR:-/tmp}/gsd-142/F20-6-NEW-1.log`. The whole-file run is **not** cited in this cell |
| File outcome | **FAIL** — whole file `Test Files 1 failed (1)`, `Tests 2 failed \| 8 passed (10)`; log `${TMPDIR:-/tmp}/gsd-142/F20-6-NEW-collateral-1.log`. Diverges from the assertion cell by exactly one red, which is the row below |
| Collateral | **C-1 — `planValidation.test.ts:94:62`.** A second test through the same `planValidation.ts:169` throw, pinning the *old* message; it reds because the message changed, not because it caught F20-6's regression. Predicted by 139 § 5.15.4 / § 8.1 and measured here. `:94-96` is untouched by this phase (D-05) |
| Verdict | **remediated** — complete negative-control pair: OLD half cited green in isolation, NEW half measured red in isolation on the finding's own axis, with the collateral held in its own column |

---

## Phase gates — D-14 (unit, 3×) and D-16 / A-05 (E2E, dual)

**Owned by:** plan `142-06` (wave 6), Tasks 1 and 2. **Run only after the phase's last revert and last
post-gate**, for two independently measured reasons: `turbo.json` declares `test:unit` with
`dependsOn: ["build"]`, so a root run taken while a `packages/*/src` injection is live would hand the
injected `dist/` to every dependent (F20-5's shape exactly); and the phase transiently broke
**authentication material**, so a suite run overlapping that window would be a security event as well
as a measurement error.

**Entry checks, all three passed before the first gate command:**

| Check | Result |
|---|---|
| `git status --porcelain -- apps tests packages` | prints nothing |
| `grep -rn 'INJECTED (142)' apps packages tests` | exit 1 — no phase marker anywhere |
| `git diff --exit-code HEAD -- apps/frontend/src/routes/api/oidc/ apps/frontend/src/lib/api/utils/auth/` | exit 0 |

<!-- planner-discipline-allow: INJECTED (142) -->

### Environment stamp (all four gate runs)

- **HEAD:** `743e848d11a7b54607a884d6e0571abb89e7b137` (`743e848d1`), branch `feat-gsd-roadmap`
- **Date:** 2026-08-21
- **Machine:** developer Mac, macOS 26.5.1 arm64 / Darwin 25.5.0. **Node v24.14.1**, **Yarn 4.9.4**,
  **vitest 3.2.4**, **Vite 6.4.1**, **Supabase CLI 2.83.0**, supabase-edge-runtime 1.71.0
- **Resolved `$TMPDIR`:** `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/` — every log path below
  resolves under `…/T/gsd-142/`
- **Frontend port: `5174`, not the default `5173` — a recorded deviation, with its cause.** At gate
  time port 5173 was held by an **unrelated project's** Vite dev server
  (`…/Treader/apps/web/…/vite.js dev`, bound `[::1]:5173`). `yarn dev` failed **loudly** —
  `Error: Port 5173 is already in use` — which is `strictPort` doing precisely the job Phase 137
  gave it, rather than drifting silently to the next port. `FRONTEND_PORT` is CLAUDE.md's sanctioned
  escape hatch and was applied to **both** the dev server and the Playwright runs, so the two cannot
  disagree. **The preflight still ran and still passed** — `FRONTEND_PORT` moves the target, it does
  not skip the check. Killing the other project's server was not attempted.

### D-14 — root `yarn test:unit`, 3× consecutive green under parallel turbo load

**Command, verbatim, from the repository root, three consecutive times:**

```bash
yarn test:unit
```

This is deliberately the **root, turbo, parallel** invocation and **not** per-package isolation —
that is what ROADMAP criterion 5's *"under parallel load rather than only in isolation"* asks for.
The root script is `yarn assert:unit-coverage && turbo run test:unit`, re-read at gate time rather
than assumed (D-17). **No `--force` was passed and none is needed** (A-01): `test:unit` is declared
`"cache": false`, so a turbo-cached green is structurally impossible.

| Run | Exit | Shell wall | Turbo `Time:` | Log |
|---|---|---|---|---|
| 1 | **0** | 25 s | 21.610 s | `${TMPDIR}/gsd-142/unit-gate-1.log` |
| 2 | **0** | 22 s | 19.618 s | `${TMPDIR}/gsd-142/unit-gate-2.log` |
| 3 | **0** | 22 s | 20.273 s | `${TMPDIR}/gsd-142/unit-gate-3.log` |

**Three consecutive greens, first attempt, no retries.** A retried run would not be three consecutive
greens and would have been recorded as a failure instead.

**Identical in all three runs:**

- Coverage guard (Phase 141): `Enumeration: 0 unclassifiable manifest(s); Check 1 (declared coverage):
  **0 violation(s)**; Check 2 (turbo execution): **0 violation(s)**, **11 workspace(s) executed**,
  4 unwired: `@openvaa/dev-tools`, `@openvaa/docs`, `@openvaa/shared-config`, `@openvaa/supabase-types`.
  Scanned 15 workspace(s). **Total: 0 violation(s).**`
- Turbo summary: `Tasks: 25 successful, 25 total` / `Cached: 14 cached, 25 total`. The 14 cache hits
  are **`build`** tasks; **`cache bypass, force executing` appears 11 times per run — once per
  `test:unit` task** — which is the direct evidence that no *test result* was served from cache.

**Step 3 — the Phase-141 wiring demonstrably reaches the five workspaces this phase edited.** Measured
per-workspace, against `142-RESEARCH.md` § D.1's pre-phase baseline (which itself was measured, at
2026-08-20):

| Workspace | Baseline tests | Gate tests (all 3 runs) | Δ | Edited by this phase |
|---|---|---|---|---|
| **`@openvaa/question-info`** | 20 | **22** | **+2** | **yes** — F15-A + D-01 |
| **`@openvaa/argument-condensation`** | 30 | 30 | 0 | **yes** — F15-B, F15-C, F16, F20-6, E9 |
| **`@openvaa/data`** | 244 | 244 | 0 | **yes** — F20-5 |
| **`@openvaa/dev-seed`** | 446 | 446 | 0 | **yes** — F18, F20-4 |
| **`@openvaa/frontend`** | 773 | 773 | 0 | **yes** — F17, F20-1, F20-2, F20-3 |
| `@openvaa/supabase` | 16 | 16 | 0 | no |
| `@openvaa/core` | 8 | 8 | 0 | no |
| `@openvaa/matching` | 43 | 43 | 0 | no |
| `@openvaa/app-shared` | 21 | 21 | 0 | no |
| `@openvaa/llm` | 39 | 39 | 0 | no |
| `@openvaa/filters` | 22 | 22 | 0 | no |
| **Total** | **1 662** | **1 664** | **+2** | 5 edited |

All five edited workspaces **executed** `test:unit` under turbo in every run — a workspace silently
*not* executing is the failure mode this check exists for, and the guard's Check 2 is the belt to that
braces. The **+2** is exactly the expected shape: `question-info` gains **T2/T3**, A-04's
same-name/varying-type fixture. Every other edited workspace is unchanged, because its remediation
**strengthened existing assertions** rather than adding tests — F20-5 and F18 rewrote a test in place,
F15-B/F15-C/F20-2/F20-4/F20-6 added matchers inside existing tests, F17 renamed a file, and E9
**deleted** a wall-clock line without deleting its test. `argument-condensation`'s count holding at 30
across an E9 deletion is therefore correct, not a missing test.

### D-16 / A-05 — the dual E2E gate, under the cardinal rule

**The cardinal rule governs both runs** (`CLAUDE.md` § E2E Hard Rule): any failure blocks; **a "did not
run" counts as a failure**, including a cascade failure from an upstream dependency; there are **no
known-flaky exemptions**. Neither run below was retried after a failure — **both are first-attempt
results.**

**Prerequisites, in order, both runs (D-15):** `yarn db:reset` (database only — it does not touch the
vite cache; `dev:reset` was deliberately **not** used mid-gate); exactly **one fresh dev server**
started by hand, with **no** Playwright `webServer` for the app; Phase 137's preflight automatic and
unbypassable.

#### Gate 1 — the full suite (D-16)

```bash
FRONTEND_PORT=5174 yarn test:e2e
```

| | |
|---|---|
| **Exit** | **0** |
| **Result** | **`135 passed (11.3m)`** — zero failed, zero skipped, **zero did-not-run** |
| **Wall** | 680 s |
| **Log** | `${TMPDIR}/gsd-142/e2e-full-1.log` |
| **Preflight verdict** | `E2E PREFLIGHT OK /…/voting-advice-application-gsd/apps/frontend (verified against /…/voting-advice-application-gsd)` |
| **Tree** | `git status --porcelain -- apps tests packages` printed **nothing** immediately before **and** immediately after |

The preflight line is quoted because it is the proof the suite tested **this checkout** rather than
whatever else was answering on a port — which, given that an unrelated project's Vite server was
holding 5173 at that moment, is not a hypothetical concern in this run.

**⚠ What this run proves, and what it does NOT — correcting D-16's stated rationale.** D-16 locked the
full-suite gate on the rationale that the Phase-122 bank-auth specs *"exercise the authorize endpoint
directly"*. **A-05 measured that claim and it is factually wrong.** The bank-auth specs live only
inside an opt-in guard (`tests/playwright.config.ts:420` and `:459`); **nothing** sets
`PLAYWRIGHT_BANK_AUTH` — not `package.json`'s `test:e2e`, not `turbo.json`, not CI, whose only
Playwright variable is the visual one. So **the default suite gives ZERO E2E coverage of the authorize
endpoint D-02 changed.** What Gate 1 proves is that the phase's three product changes **broke nothing
else**. That is worth having and it is not what D-16 claimed. Gate 2 is what actually exercises the
changed endpoint.

#### Gate 2 — the opt-in bank-auth projects (A-05)

```bash
PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 \
  npx playwright test -c ./tests/playwright.config.ts --project=bank-auth --project=bank-auth-journey
```

**Prerequisites carried from `142-04`'s probe and the runbook, all satisfied:**

- **`SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` exported inline for this one run**, never
  persisted to `.env`, to `.env.example`, to any script or to any committed file. `SUPABASE_ANON_KEY`
  is **absent** from `.env`, and `candidate-bank-auth.spec.ts:44-49` **throws at module load** without
  it — so omitting it hard-fails the run rather than skipping it, which under the cardinal rule is a
  failure either way. **⚠ B-1 remains BLOCKED and is NOT closed by this run:** `.env` and
  `.env.example` are refused by this environment's permission settings, and **no read-around was
  attempted** — not `git show`, not `cat`, not a dotenv-loading script. The values were taken instead
  from the **runbook's own sanctioned source**, `supabase status -o env` (`ANON_KEY` /
  `SERVICE_ROLE_KEY`), which is not `.env`. **The operator still needs to apply B-1 by hand**, or the
  next person to run this gate hits the same wall.
- **Identity-callback Edge Function served** in its own process:
  `npx supabase functions serve identity-callback --no-verify-jwt --env-file /tmp/eflow10.env`.
- **A static test-JWKS server on `:8777`** serving `sigPubJwk` (kid `test-sig-1`), per runbook
  step E-2 — the Edge Function's `verifyJwt` fetches it.
- **The SvelteKit server started with the EFLOW-10b IdP env in its OWN process environment**
  (`IDURA_DOMAIN=127.0.0.1:9443`, the test signing/decryption JWKs, aligned `iss`/`aud`, and the
  scoped `NODE_TLS_REJECT_UNAUTHORIZED=0`), because it reads that env at its own startup, in a
  separate process from the Playwright worker. Verified by inspecting the running process's env.
- **The mock OIDC issuer was NOT started by hand** — its `webServer` entry activates under the same
  opt-in flag, so Playwright spawns and tears it down. `bank-auth-journey` needs **no external
  credentials**: it mints tokens from the **committed test key pair** in `tests/tests/utils/testKeys.ts`.
- **All test-only material was written to gitignored scratch paths** (`/tmp/eflow10.env`,
  `/tmp/eflow10b.env`, `/tmp/eflow10-jwks/`), derived from `testKeys.ts` rather than hand-copied, so
  there is no key drift and nothing leaked into the repository or into a default `yarn dev`.

| | |
|---|---|
| **Exit** | **0** |
| **Result** | **`121 passed (11.4m)`** — zero failed, zero skipped, **zero did-not-run** |
| **Wall** | 687 s |
| **Log** | `${TMPDIR}/gsd-142/e2e-bankauth-1.log` |
| **Preflight verdict** | `E2E PREFLIGHT OK /…/voting-advice-application-gsd/apps/frontend (verified against /…/voting-advice-application-gsd)` |
| **Tree** | `git status --porcelain -- apps tests packages` printed **nothing** immediately before **and** immediately after |

**Both opt-in projects ACTUALLY EXECUTED — a project reporting 0 tests would be a did-not-run and
therefore a failure, so this is checked rather than assumed:**

- **`bank-auth` — 6 tests, all passed.** By title: *create candidate via identity-callback Edge
  Function (Idura sub-based identity)*; *return session with magic link when candidate is created*;
  *reject an id_token encrypted with a mismatched (wrong) decryption key*; *reject invalid tokens*;
  *reject requests without id_token*; *handle CORS preflight correctly*. Per the runbook's
  deterministic-green gate, the keys-configured create path is asserted to have **run on every run**
  (the spec does **not** `test.skip`) — and it did.
- **`bank-auth-journey` — 1 test, passed**: *full bank-auth self-registration journey through to
  authenticated candidate*, walking the **real**
  `/candidate/preregister → /api/oidc/authorize → (mock IdP) 302 → /api/oidc/callback` chain with the
  server-side exchange and decrypt unmodified. Only the IdP at the network seam is faked.
- The other 114 of the 121 are the transitive **serial perm chain**
  (`data-setup-bank-auth-journey` depends on `voter-prefs-tracking`, its tail), which is why this gate
  costs full-suite wall-clock rather than seconds. That is deliberate — the setup does an
  authoritative `app_settings` REPLACE and the singleton needs mutual exclusion, not mere ordering
  (Phase 140 WR-03). `grep -c 'skipped|did not run|interrupted'` over the log returns **0**.

**This is the run that actually exercises what D-02 changed.** `/api/oidc/authorize` is on the
journey's live path, so the catch-arm re-throw that keeps the endpoint's own 400 contract from being
swallowed into a 500 was exercised end-to-end here — and **nowhere in Gate 1**. Had A-05 not widened
the gate, the one product change with an E2E surface would have shipped unexercised at that level.

**Honest scope limit on Gate 2, stated rather than left flattering:** the journey proves the
authorize→callback→exchange→decrypt→claims chain works end-to-end; it does **not** discriminate
A-07's two new error codes, because it walks the success path. The code split's discrimination is
proven at the unit level by ledger row 9's **B / B′** pair, not here. And per **P-2**, the production
`/api/oidc/token` route calls `provider.getIdTokenClaims` — the providers' duplicated copies — not the
helper A-07 split, so neither gate exercises the split on the path production actually uses.

### Gate verdict

**All four gate runs green, first attempt, none retried:** 3 × root `yarn test:unit` (exit 0 each),
1 × full `yarn test:e2e` (exit 0, 135 passed), 1 × opt-in bank-auth (exit 0, 121 passed). **No gate
failed to run.** Every result above carries its exit code and its log path, because a stated result is
not a measured one — and this is the phase that exists to make that distinction.

---

## D-12 — the wall-clock sweep, EXECUTED (not copied forward)

**Owned by:** plan `142-02` (wave 2), Task 1 Step 8. **Scope, stated exactly: `packages/question-info`
and `packages/argument-condensation`, and no further** — D-12's own boundary ("Do not sweep beyond
those two packages"). `142-RESEARCH.md` § B.13 had already run this grep and A-01 recorded the expected
additional yield as **zero**; it was run again here anyway, because a sweep whose result is copied
forward is not a sweep.

**Command 1 — the numeric-bound matchers D-12 names, over both packages' test trees:**

```bash
grep -rn "toBeGreaterThan\|toBeLessThan" packages/question-info packages/argument-condensation \
  --include='*.test.ts' --include='*.spec.ts'
```

**Command 2 — a widened net, so the sweep is not limited to the shape already known:**

```bash
grep -rn "processingTimeMs\|elapsed\|durationMs\|latencyMs\|Date.now()\|performance.now()" \
  packages/question-info packages/argument-condensation --include='*.test.ts' --include='*.spec.ts'
```

**Full hit list, with a disposition per hit** (run at HEAD `fbb103c10`, i.e. after E9's deletion had
already landed):

| # | Site | Shape | Wall clock on a mock? | Disposition |
|---|---|---|---|---|
| 1 | `argument-condensation/tests/condensation/condenserStandalone.test.ts:137` (pre-edit) | `expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0)` | **YES** — measured 1.228 ms on a fully mocked provider | **DELETED** (E9), in commit `fbb103c10`. Not weakened to `toBeGreaterThanOrEqual(0)` |
| 2 | `condenserStandalone.test.ts:141` | `expect(result.llmMetrics.nLlmCalls).toBeGreaterThan(0)` | no — a **call counter** | **KEEP** |
| 3 | `condenserStandalone.test.ts:143` | `expect(result.llmMetrics.tokens.totalTokens).toBeGreaterThan(0)` | no — a **token counter** | **KEEP** |
| 4 | `condenserStandalone.test.ts:203` | `expect(result.llmMetrics.nLlmCalls).toBeGreaterThan(0)` | no — a **call counter** | **KEEP** |
| 5 | `condenserStandalone.test.ts:138` | the word `toBeGreaterThanOrEqual` inside the deletion-rationale **comment** added by this plan | n/a — not executable | **KEEP** (it is the note telling a later reader not to restore the deleted line) |
| 6 | `question-info/tests/questionTypes.test.ts` × 9, `question-info/tests/api.test.ts` × 14, `argument-condensation/tests/condensation/{condenserIntegration,condenserStandalone,condenseQuestions}.test.ts` × 5 | `latencyMs: 10` / `latencyMs: 100` | no — these are **mock fixture inputs**, not assertions. No matcher is applied to them | **KEEP** |

**No `Date.now()`, no `performance.now()`, and no elapsed/duration matcher of any kind exists in either
package's test tree.** In `question-info`, `llmMetrics.processingTimeMs` is not wall clock at all — it
is copied from the mock's `llmResponse.latencyMs` by `responseTransformer.ts:39` — and nothing asserts
a bound on it.

**Result: swept; one wall-clock site found; one removed; ZERO additional sites.** The observed yield
matches A-01's measured expectation exactly. The sweep was executed, not inherited.

---

## Deferred product findings — recorded here, deliberately NOT fixed in this phase

Phase 142 is an assertion-design phase. Where a strengthened assertion exposed a **product** defect,
the defect is recorded here and left in place, because fixing it would change observable behaviour
under a phase whose own success criteria forbid durable product changes. Each entry names who should
own it.

| # | Found by | Site | Finding | Why not fixed here |
|---|---|---|---|---|
| P-1 | `142-02` Task 1 (F15-C), green clean-tree probe 2026-08-20 | `packages/argument-condensation/src/core/condensation/condenser.ts:205` + `src/core/types/condensation/condensationResult.ts:32` | `CondensationRunResult.data.arguments` is declared `Array<Argument>` but is `Array<Array<Argument>>` at runtime for any plan whose final step is a **single-batch MAP** (the shape `handleQuestion` builds for these fixtures). `structure` bookkeeping reports `'list'` (`planValidation.ts:149`) while the payload is still physically nested, and `:205`'s `as Array<Argument>` cast hides it from the type checker. A consumer writing `result.data.arguments.map((a) => a.text)` gets `[undefined]`. `condenserStandalone.test.ts` is unaffected — its plan ends in REDUCE, which collapses the nesting | Collapsing the list-of-lists changes `Condenser.run()`'s observable output for **every** consumer — a Rule-4-class product change. `142-02` is test-only ("no product source durably modified"). The test documents the nesting inline and uses `flat()` so it asserts real content either way, and will keep passing once the product is fixed |

### D-01's three named scope exclusions (D-19 iii) — approved at `142-01`'s checkpoint, NOT absorbed

These are **not** defects found in passing; they are deliberate boundaries of D-01's *minimal* scope
("question type + choice labels", explicitly "no redesign of the info-generation feature"). The operator
approved the minimal change **with these three named and deferred**. `142-06` captures them as standing
todos. Recorded here so a later reader does not read the gap as an oversight and quietly widen the fix.

| # | Site | Finding | Why not fixed here |
|---|---|---|---|
| D-01-i | `packages/question-info/src/core/infoGeneration.ts:75-82` + the three `en/` YAMLs | The question's **`info` text never reaches the prompt** either. Measured against the real pipeline: `prompt contains the question info text: false`. The LLM is asked about a question whose own explanatory blurb is withheld | Outside D-01's named scope. A defensible improvement, but a second widening of what crosses the prompt boundary, taken while the phase's evidence protocol is mid-flight |
| D-01-ii | `packages/question-info/src/prompts/` | **No locale variants of the type label.** `questionType` now reaches the prompt as its **raw** discriminant string (`singleChoiceCategorical`), not human-readable text, and not localised | **Not possible today**: the prompt tree has only an `en/` directory. Rendering a localised type label needs a locale-aware prompt tree, which is a separate project |
| D-01-iii | `packages/question-info/src/core/infoGeneration.ts` | **The ordinal scale distinction is not closed by the type string alone** — a 5-point and a 7-point ordinal are both `'singleChoiceOrdinal'`, so type alone cannot separate Configurations 2a/2b | Substantially mitigated rather than open: the new `choices` variable **does** supply the discriminating information for ordinal questions (five labels vs seven). Recorded so the residual — that the *scale semantics* are still implicit — is not lost. **Updated 2026-08-21 (row 1s):** that mitigation now has a **guard**. `questionTypes.test.ts:246` and `:318` assert each ordinal's own joined label list, so the two blocks differ observably; both were measured **red** under injection C. The residual is unchanged (scale semantics stay implicit); what changed is that a regression removing the choices can no longer pass the ordinal block silently |

### ⚠ Operator-approved SCOPE EXPANSION at `142-04`'s checkpoint — three "file, don't fix" items were FIXED

`142-04` surfaced three items as *file-don't-fix* candidates. **The operator overrode the deferral and
directed that all three be fixed**, expanding the phase past D-02's named scope and past **A-10**, whose
"capture as a todo; do not fix in this phase" instruction is **explicitly superseded**. Recorded here as
scope expansion rather than drift, and the corresponding todos are **closed, not left open**.

| # | Site | What was wrong | Disposition |
|---|---|---|---|
| ~~SE-1~~ | `apps/frontend/src/routes/api/cache/+server.ts:56` | A third live instance of the D-02 swallow — an in-`try` `error(response.status, …)` caught by the catch at `:66` and re-reported as a 500, so an upstream **404 reached the client as a 500** | **FIXED** in `0f8e99a68` — same 2-line `isHttpError` re-throw. Todo **closed** |
| ~~SE-2~~ | `tests/playwright.config.ts:334-335`, `:338` (**A-10**) | Prose claimed bank-auth *"run[s] by default (opt-OUT via PLAYWRIGHT_NO_*)"*, contradicting the docblock at `:260-267` and the gate expressions at `:420`/`:459` | **FIXED** in `f4e0fc1ec` — comment-only, no gate changed. Whole file swept for other default-on/opt-in claims: **no further drift**. A line naming the gate expressions as the source of truth was added. A-10 **superseded**; todo **closed** |
| ~~SE-3~~ | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts:6` | **A fourth product change.** `defaultOptions` ran `JSON.parse(...)` at **module-evaluation** time, outside any `try`, so a malformed `IDENTITY_PROVIDER_DECRYPTION_JWKS` threw an uncatchable `SyntaxError` at **import** time — it could never reach the function's catch and could never carry a `code`, silently exempting itself from the very contract A-07 establishes | **FIXED** in `0f8e99a68` — the parse is deferred to a **getter**, so every read happens inside the function's `try` and the misconfiguration surfaces as `ERR_JWKS_MALFORMED`. The operator's stop-condition (*"if the minimal fix requires changing `defaultOptions`' shape or its call contract, stop and report"*) was **not** triggered: the getter preserves the property's shape and type (in fact improving it from `any` to `Array<jose.JWK>`), and `defaultOptions` has **zero** consumers outside this file's own default parameter. `:7`'s `!` non-null assertion is D-05's F19 class and was **not** touched |

### New findings from `142-04` and `142-06`, recorded and NOT fixed

| # | Found by | Site | Finding | Why not fixed here |
|---|---|---|---|---|
| P-2 | `142-04` Task 3, while checking `getIdTokenClaims`'s consumers | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:114-122` and `providers/signicat.ts:77-85` | **Both providers carry their own duplicated copy of `getIdTokenClaims`'s logic**, including an identical uncoded `throw new Error(\`Cannot decode ID token: JWK not found: kid=${kid}.\`)` and their own `JSON.parse` of the same env var. A-07's two-code split therefore applies **only** to the shared helper: the two provider implementations still collapse the misconfiguration and key-rotation cases into one indistinguishable failure, and the production `/api/oidc/token` route calls the **provider** method (`provider.getIdTokenClaims`), not the helper | Outside the surface approved at the checkpoint, which named `getIdTokenClaims.ts` specifically. No test asserts codes on the provider path, so strengthening there is a fresh negative-control pair, not a carry-over. **This is the one that most deserves a follow-up**: the fixed helper is not what the token endpoint actually calls |
| P-3 | `142-04` Task 3, post-`tsc` post-gate | `apps/frontend/tsconfig.tsbuildinfo` | A **generated** artifact is **tracked** in git, so merely running `npx tsc --noEmit` dirties the working tree and trips the phase's own porcelain post-gate. Restored with `git checkout HEAD --` twice during this plan | Repo-hygiene change unrelated to any assertion in this phase; deleting it from the index touches every contributor's tree |

#### ⚠ P-2 half 2 — a NEW finding of THIS SWEEP'S OWN CLASS, found at `142-06`

**Not a coverage gap. A fake guard — of exactly the class ASSERT-07 exists to remove — that was never
in the twelve-finding corpus.** Recorded as a finding rather than folded into P-2's prose, because
mis-filing it as "missing coverage" is what would let it survive a second sweep.

| # | Found by | Site | Finding | Why not fixed here |
|---|---|---|---|---|
| **P-2 half 2** | `142-06`, verifying P-2's scope before propagating it — **independently measured**, not inherited from `142-04`'s report | `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:90-91` and `providers/signicat.test.ts:54-55` | Both read `expect(typeof provider.getIdTokenClaims).toBe('function')` under a title claiming the method is **implemented**. The assertion checks a property of the object graph and **never an output** — the F15/F17 shape precisely. The 2026-08-11 sweep did not enumerate these two files, so it is outside the corpus. It is almost certainly **why** the duplicated provider copies drifted from the shared helper undetected: it is the only thing pinning `getIdTokenClaims` on either provider, and it stays green no matter what the method does. `getAuthorizeUrl` and `exchangeCodeForToken` carry the same shape on both providers | `142-06` runs the gates and propagates the record; it modifies **no** product or test source. Strengthening these is a **fresh negative-control pair** — nothing in 139's record to cite, so both halves must be measured — not a carry-over |

**What this means for A-07, stated plainly, neither overstated nor understated:**

- **The phase criterion IS met.** D-11 E6 asks that F20-3's two *tests* differ observably under their
  own branch's regression, against the helper they exercise. They do — ledger row 9's **B / B′** pair
  measures exactly that, each site red alone under its own branch.
- **The production path is UNTOUCHED.** `/api/oidc/token/+server.ts:26` calls
  **`provider.getIdTokenClaims(idToken)`** — `providers/idura.ts:114` / `providers/signicat.ts:77`,
  each a duplicated copy carrying an identical **uncoded** kid-lookup `throw` and its own `JSON.parse`
  of the same env var — **not** the `getIdTokenClaims.ts` helper A-07 split. The provider copies also
  lack the lazy-parse property `0f8e99a68` gave the helper.
- **Therefore: the operational benefit of the two-code split does not yet reach `/api/oidc/token`.**
  The fixed helper is not what the token endpoint calls. **This is the highest-value follow-up of the
  phase** — captured at `.planning/todos/pending/provider-getidtokenclaims-duplication.md`, recorded
  in `deferred-items.md`, and in `.planning/WINDOWS.md` (ids 45 and 48).

### ⚠ BLOCKED — an operator instruction that could not be carried out

| # | Instruction | Blocker |
|---|---|---|
| B-1 | Add `SUPABASE_ANON_KEY` to the local `.env` (value = `PUBLIC_SUPABASE_ANON_KEY`'s) **and** add the key to `.env.example` with a placeholder plus a one-line comment, so the bank-auth specs stop being un-runnable-by-default | **Not done — environment permission deny.** Every access path to `.env` and `.env.example` is refused by this environment's permission settings: the `Read` tool returns *"File is in a directory that is denied by your permission settings"*, and Bash `grep`/`awk`/`ls` on either path are denied. **No circumvention was attempted** (e.g. reading the tracked copy via `git show`), because the deny plainly exists to protect env files. The `.env` half was independently confirmed safe to attempt — `git check-ignore -v .env` → `.gitignore:3:.env` — so **no key value was ever at risk of being committed**; the block is on access, not on judgement. **This item needs the operator to apply it by hand, or to grant access.** Until then, the `142-06` bank-auth run must export `SUPABASE_ANON_KEY` inline |

**`142-06` outcome: B-1 is STILL BLOCKED and STILL OPEN.** The deny applies identically to this plan;
**no read-around was attempted here either** — not `git show`, not `cat`, not a dotenv-loading script
to extract the value programmatically, which would have been the same circumvention wearing a
different hat. Gate 2 ran because the key was taken from the **runbook's own sanctioned alternative
source** — `supabase status -o env` (`ANON_KEY` / `SERVICE_ROLE_KEY`), which is not `.env` — and
exported **inline for that one run**, never persisted. So the gate is not evidence that B-1 is
discharged: **`.env.example` still lacks the key, and the next person to run this gate hits the same
wall.** The operator must apply it by hand or grant access.

---

## D-19 + the operator scope expansion — standing-todo reconciliation

Reconciled against **what actually happened**, not against what the plan predicted. A todo describing
already-done work is the stale-record failure this milestone keeps hitting, so the closures below
matter as much as the additions.

| Item | Source | Disposition | Where |
|---|---|---|---|
| **D-19 i** — six unenumerated F19-class `!`-on-`null` sites in `authorize-endpoint.test.ts` / `getIdTokenClaims.test.ts` | D-05, 139 § 7 limit 6, § 8.1 C-2/C-4 | **OPEN** | `.planning/todos/pending/f19-class-adjacent-auth-sites.md` |
| **D-19 ii** — `getIdTokenClaims` has no negative test for a bad signature, a wrong issuer or a wrong audience: the three rejections a token validator most needs. A **coverage gap, not a fake guard** | D-05 | **OPEN** | `.planning/todos/pending/getidtokenclaims-negative-tests.md` |
| **D-19 iii** — D-01's three named scope exclusions (info text never reaching the prompt; the type label unlocalisable while the prompt tree is `en/`-only; the residual ordinal-scale distinction) | D-01 checkpoint | **OPEN** — all three | `.planning/todos/pending/question-info-type-awareness-followups.md`; WINDOWS 42 / 43 / 44 |
| **P-1** — `Condenser.run()` returns `Array<Array<Argument>>` behind an `as Array<Argument>` cast at `condenser.ts:205` | `142-02` | **OPEN** — todo **created at `142-06`**; it had been recorded in prose only | `.planning/todos/pending/condenser-run-result-arguments-nested.md`; WINDOWS 41 |
| **P-2** (both halves) — the token route calls the providers' duplicated copies, not the helper A-07 fixed; and the only tests pinning either are wiring-only | `142-04` + `142-06` | **OPEN — marked the HIGHEST-VALUE follow-up of the phase.** Todo **created at `142-06`** | `.planning/todos/pending/provider-getidtokenclaims-duplication.md`; WINDOWS 45 + 48 |
| **P-3** — `apps/frontend/tsconfig.tsbuildinfo` is a tracked generated artifact | `142-04` | **OPEN** | WINDOWS 46 |
| **B-1** — `SUPABASE_ANON_KEY` absent from `.env` / `.env.example`; both paths permission-denied | `142-04`, re-confirmed `142-06` | **OPEN — needs the operator** | WINDOWS 47 |
| ~~**A-10** — `playwright.config.ts` doc drift claiming bank-auth is default-on~~ | A-10 | **CLOSED.** A-10's *"capture as a todo, do not fix"* was **explicitly superseded by the operator** at `142-04`'s checkpoint; wave 5 fixed it in **`f4e0fc1ec`** (comment-only, no gate changed, whole file swept — no further drift). Independently re-confirmed at `142-06`: the two projects were still absent from the default suite and ran only under an explicit `PLAYWRIGHT_BANK_AUTH=1` | `.planning/todos/done/playwright-config-bank-auth-doc-drift.md` |
| ~~**The `api/cache/+server.ts:56` swallow**~~ | `142-04` | **CLOSED — no todo is owed, because the defect was FIXED.** Same operator scope expansion; `0f8e99a68` applied the same 2-line `isHttpError` re-throw. The plan expected this to be captured as a standing item; capturing it would have filed a todo for completed work | ledger § *Operator-approved SCOPE EXPANSION*, SE-1 |
| ~~**The `getIdTokenClaims.ts:6` import-time parse**~~ | `142-04` | **CLOSED — fixed**, `0f8e99a68`. The parse is deferred to a getter, so a malformed `IDENTITY_PROVIDER_DECRYPTION_JWKS` surfaces as `ERR_JWKS_MALFORMED` instead of an uncatchable import-time `SyntaxError` | ledger § *Operator-approved SCOPE EXPANSION*, SE-3 |

**The scope expansion itself is part of the phase record, not a footnote.** Three items surfaced as
*file-don't-fix* candidates at `142-04`'s checkpoint were, on the operator's explicit direction,
**fixed** — taking the phase past D-02's named scope and past A-10. Two of the five todos this plan was
instructed to capture therefore describe **work already done**, and are recorded as closed rather than
filed. Two follow-ups the plan did **not** anticipate (P-1's cast, P-2's production-path gap) were filed
in their place.

---

## The ten prohibited injection designs (139 § 8.3, carried per D-10)

Every proposed injection in this phase is checked against this list **by name** before it is run. The
rule these encode: **if the injection makes the test red *before* the remediation, the design is wrong,
not the finding. If it reds neither, it proves nothing.**

| ID | Design | Why forbidden |
|----|--------|---------------|
| **R-1** | F20-6: deleting the `planValidation.ts:169` throw | Removes the *category*; the red comes from "no throw at all", not from message confusion |
| **R-2** | F15-A: the audit's own sentence (make `generateQuestionInfo` ignore question type) | **Un-injectable — zero delta.** The shipped code already ignores question type; the grep exits 1 |
| **R-3** | F15-A: bypassing `responseTransformer.ts` | Blast radius without discrimination — reds `api.test.ts` and every consumer |
| **R-4** | F15-A: renaming the `generalInstructions` key at `infoGeneration.ts:77` | Reds **before and after** — makes the remediation unverifiable |
| **R-5** | F20-5: `electionId: undefined` at `variants.ts:100` | Reds **before and after** (it is 139's positive control, not a regression) |
| **R-6** | F19c: `client_assertion: undefined as unknown as string` | Wrong axis — models malformation, not absence. *(F19c is out of corpus per D-00)* |
| **R-7** | F20-1: injection A (400 → 500 at `+server.ts:22`) **on the PRE-FIX tree** | Zero-delta on the caller-observable axis — the 400 is swallowed. ⚠ **A-03 inverts this post-fix:** after D-02 lands, injection A becomes the correct NEW-half injection |
| **R-8** | F20-2: `throw` in the catch arm at `overrides.ts:36` | Reds **before and after** — a crash is visible to every matcher |
| **R-9** | F20-3: control C (success return at `getIdTokenClaims.ts:29`) | Reds **before and after** — inverting the asserted boolean is visible to the blind matcher too |
| **R-10** | F17: the deliberate syntax error at `EntityListWithControls.svelte:120` | Reds **neither** before nor after — the module is not in the test's import graph |

---

## Withdrawals

**Running count: 0.**

**D-13's bar, reproduced:** ROADMAP criterion 4 permits withdrawal-with-reasoning, but Phase 139
**confirmed all 12 by injection** — each one was measured blind against a live regression, not judged on
paper. Withdrawal in Phase 142 is therefore permitted **only on a ground Phase 139 could not have
seen** — e.g. the strengthened assertion is **provably unwritable**, not merely awkward, brittle, or
inconvenient. "Hard to write" is not a ground. "The remediation is larger than the plan budgeted" is not
a ground.

A withdrawal carries its reasoning in **two** places: the phase record, **and**
`.planning/audits/2026-08-11-fake-guard-sweep.md`, where it is **struck rather than deleted**, per
139 § 6's precedent. **Expected count: 0.**

| # | Finding | Ground (must be one 139 could not have seen) | Propagated to audit? |
|---|---------|----------------------------------------------|----------------------|
| — | *(none)* | — | — |

---

## Scoped exceptions to ROADMAP criterion 1

Exactly **one** entry. An exception here is **not** a withdrawal: the finding is **remediated**, D-13's
bar is **not** engaged, and the withdrawal count above stays **0**.

### F17 (row 5) — `NEW-assertion outcome` = `N/A — by construction`

**Reasoning (A-06, operator decision):**

- **D-04** locks ROADMAP criterion 3's **second branch** — rename `EntityListWithControls.test.ts` to
  `EntityListWithControls.helpers.test.ts` and make it assert the helper contract it actually
  exercises — rather than mounting the component (which needs the full appContext + locale + i18n
  harness and touches Spike-024 `#version`-bridge territory; that is a separate project, explicitly
  deferred).
- **139 § 5.5.6 predicted this outcome in advance**, before D-04 was taken: *"only remedy 1 makes the
  pre-specified regression above red."* Remedy 1 is mounting.
- **139 § 8.3 R-10** independently forbids the `EntityListWithControls.svelte:120` control on the same
  mechanism: the component module is not in the test's import graph, so the injection reds **neither**
  before nor after.
- Consequently F17 has **no available NEW half from 139's record**, and inventing one would mean either
  designing an injection 139 never validated or crediting a red on an unrelated axis — both of which
  this ledger's whole apparatus exists to prevent.

**Status:** **remediated, not withdrawn.** Withdrawal count unchanged at **0**.

**Compensating evidence:** row **5s** supplies a **real, complete** negative-control pair for the
contract the renamed file now claims — a **new** injection at `EntityListWithControls.helpers.ts:19`
with **both** halves run in this phase. It is labelled **"supplementary — not 139 § 5.5.2"** so it can
never be read as a citation of 139's record.

**Compensating evidence — MEASURED, 2026-08-20** (plan `142-05`, wave 3): the supplementary pair was run
and it split cleanly. OLD half **green** (exit 0, `1 passed | 7 skipped (8)`); NEW half **red** on the
value axis (exit 1, `helpers.test.ts:129:24`, `1 failed | 7 skipped (8)`) — both under the same live
injection, both isolated at the assertion. Details, log paths and the `C-142-1` collateral are in row
**5s**. So criterion 1's *intent* — an executed pair proving the strengthened assertion catches what the
old one missed — **is** satisfied for F17; what is not satisfiable is criterion 1's *letter*, which
demands the pair be driven by **139's** pre-specified regression.

**Visibility requirement (A-06):** this exception must appear **here**, in the phase record, **and** in
the D-18 remediation line in `.planning/audits/2026-08-11-fake-guard-sweep.md`. It is never silently
absent.

---

## External-API coverage

`COVERAGE.md` in this phase directory carries the declaration: *"No external API integration: the phase
edits test assertions plus three small product fixes; all provider calls in scope are mocked."*
Confirmed present at ledger creation.
