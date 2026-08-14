# Phase 139 — Verdicts: the single-source sweep findings

**Fifteen findings, one apparatus, one machine.** Every verdict below is reached by breaking the
behaviour a test claims to assert, running that test against the break, and recording what the runner
actually printed. No verdict here rests on a paper read alone. A finding whose injection run did not
execute keeps its placeholder and carries **no** verdict — never a confirmed one — because a test that
did not run counts as a failure, not a pass (`CLAUDE.md` § E2E Hard Rule, generalised).

- **Date:** 2026-08-14
- **Plan:** `139-01-PLAN.md` (wave 1), continued by plans 02-07
- **Decisions discharged:** D-01 (break-and-run every finding, not the criterion-2 minimum of one), D-02 (a vacuous-but-red assertion is confirmed, with the mitigation recorded on the verdict), D-03 (injection hygiene — inject, run, revert, verify clean, per finding), D-04 (the injected diff is recorded verbatim so Phase 142 re-applies it mechanically), D-05 (ad-hoc in-package vitest runs; no wiring changes), D-06 (F17 gets a verdict, explicitly flagged as out-of-criterion-1)
- **Requirements:** ASSERT-01
- **Precedent followed:** `.planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-NEGATIVE-CONTROL.md`, which named `137-NEGATIVE-CONTROL.md` as its precedent, which named `136-VISUAL-DISCRIMINATION-EVIDENCE.md` as its own. This document continues that chain.

---

## 1. Why this pass existed

The audit that produced these findings ended by marking most of them unverified, and staked a
prediction so that somebody could check it. `.planning/audits/2026-08-11-fake-guard-sweep.md:952-956`,
verbatim:

> - **F15, F16, F18, F19 and the F20 table are single-source** (the delegated sweep). I verified the
>   four highest-value unit findings myself but not these; see the *Method note* in Cleared. My
>   prediction — stated so it can be checked — is that they hold, because the four I did verify were
>   accurate to the line and because F15's shape (mock-in, mock-out) was visible in the
>   `condenserIntegration.test.ts` header I read independently.

ROADMAP Phase 139 turns that into four success criteria (`.planning/ROADMAP.md:346-349`), verbatim:

> 1. Each of F15 (the `questionTypes.test.ts` sites plus `condenserStandalone.test.ts` / `condenseQuestions.test.ts`), F16, F18, F19 (3 sites) and all **six F20 rows** carries an independent verdict — **confirmed** or **withdrawn** — with the re-read `file:line` quoted from the current tree as evidence, not the audit's own quotation re-copied.
> 2. At least one verdict is reached by **running** it, not by reading: the site is executed with the behaviour it claims to assert deliberately broken, and the observed pass/fail matches the verdict on paper. A finding that reads blind but fails correctly is withdrawn.
> 3. For every confirmed finding, the realistic regression its current assertion cannot detect is named concretely — so Phase 142's negative control is pre-specified rather than invented at remediation time.
> 4. Any withdrawn finding is struck from `.planning/audits/2026-08-11-fake-guard-sweep.md` with its reasoning, and ASSERT-07's scope in this ROADMAP and in `REQUIREMENTS.md` is edited down to match. The shrink is visible in the record, not silent.

The audit's bullet ends with an explicit invitation to check its prediction ("stated so it can be
checked"); § 6 answers that invitation in place, recording the count of findings that held and the
count that did not, even when the second count is zero.

---

## 2. Environment

One stamp for all fifteen findings. Every value below was captured in the session that produced the
runs. A future re-run that behaves differently should be diagnosed against this stamp before it is
called a regression.

```
date:               2026-08-14T11:33:43Z (UTC)  /  2026-08-14 14:33 EEST
repo root:          /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:           12825b479   branch feat-gsd-roadmap
git status --porcelain:
                     M .planning/STATE.md
                     M .vscode/settings.json
                     M supabase/.temp/cli-latest
git status --porcelain -- apps tests packages:
                    (no output)
OS:                 macOS 26.5.1 arm64
kernel:             Darwin 25.5.0
Node:               v24.14.1
vitest:             vitest/3.2.4 darwin-arm64 node-v24.14.1
Yarn:               4.13.0
runner log dir:     /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-139   (${TMPDIR}/gsd-139)
```

> **The three modified files are inert to this corpus.** `.planning/STATE.md` is a planning document,
> `.vscode/settings.json` is editor configuration and `supabase/.temp/cli-latest` is a CLI
> version-check cache written by the Supabase tooling. None is imported by any test in this corpus.
> The load-bearing claim is the **scoped** porcelain, empty over `apps`, `tests` and `packages` — the
> same claim `138-NEGATIVE-CONTROL.md` § 4.1 rests on, and for the same reason.

**No site in this corpus needs Supabase, a dev server, a network call, an API key, an environment
variable or a `yarn build`.** Every test file in the corpus imports its code-under-test through a
source specifier, never through a package `dist/`, so an unbuilt workspace cannot produce a stale
observation and a missing service cannot produce a false red.

---

## 3. Method — the injection loop

The four named procedures below are this phase's apparatus. Plans 02-07 invoke them **by name** rather
than re-deriving them, so fifteen findings are judged by one procedure instead of fifteen.

### 3.1 HYGIENE-LOOP (D-03)

Five steps, run per finding, entirely inside the task that injects.

```bash
# 1. PRE-GATE
git status --porcelain -- apps tests packages          # MUST print nothing

# 2. INJECT — apply the recorded diff with the Edit tool at the named file:line

# 3. RUN — from inside the workspace directory, combined output to a log OUTSIDE the repo
mkdir -p "${TMPDIR:-/tmp}/gsd-139"
cd "$(git rev-parse --show-toplevel)/packages/<workspace>" \
  && npx vitest run <files> 2>&1 | tee "${TMPDIR:-/tmp}/gsd-139/<site>.log"

# 4. REVERT
git checkout -- <injected-path>

# 5. POST-GATE — all three must hold before the next finding starts
git status --porcelain -- <injected-path>              # (a) MUST print nothing
git status --porcelain -- apps tests packages          # (b) MUST print nothing
test -d apps -a -d packages -a -d tests && ! grep -rn 'INJECTED (139)' apps packages tests   # (c)
```

1. **PRE-GATE.** `git status --porcelain -- apps tests packages` must print nothing. A non-empty
   result means an injection is stranded in the working tree from an earlier task or session; stop and
   surface it rather than reverting blind — a blind revert would discard whatever else is there.
2. **INJECT.** Apply the exact recorded diff with the `Edit` tool at the named file and line. On every
   `+` line where a comment is syntactically legal, the comment text is the phase marker
   `INJECTED (139)`. Where a comment is not legal or would distort the injected value — a constant
   reassignment, a bare object value, a string literal — omit it and record the exemption in that
   finding's § 5.N.2. The marker grep is a **supplement** to the git gates, never a replacement.
3. **RUN.** The vehicle command exactly as recorded, from inside the workspace directory, with
   combined output redirected to `${TMPDIR:-/tmp}/gsd-139/<site>.log`. The log path is outside the
   repository on purpose: a log written inside the working tree would show as an untracked file and
   trip step 5.
4. **REVERT.** `git checkout -- <path>` for every injected path. This restores from **this worktree's**
   index and HEAD and is unaffected by the shared object store of the linked worktree.
5. **POST-GATE.** All three checks must hold before the next finding starts: (a) the per-path gate,
   (b) the scoped gate, (c) the marker gate.

**Three standing constraints, recorded here once.**

- **The bare `git status --porcelain` is never a gate in this phase.** Three tracked files are dirty
  at session start in this linked worktree (§ 2), so the bare form never passes — and a gate that
  never passes is a gate that gets disabled. The scoped form is Phase 138's precedent
  (`138-NEGATIVE-CONTROL.md` § 4.1) and is the one that carries the claim.
- **Always `cd` into the workspace directory before `npx vitest run`.** `Condenser.run()` writes
  `<cwd>/data/operationTrees/`, which is gitignored only inside `packages/argument-condensation`. Run
  from the repo root and the hygiene gate fails for a reason unrelated to the injection.
- **No `yarn dev`, `yarn test:e2e` or Playwright command may run anywhere in this phase.** The
  cardinal E2E rule is back in force unwaived since Phase 138 closed
  `.planning/v2.14-CARDINAL-RULE-WAIVER.md`, and this phase transiently breaks production source under
  `apps/frontend/src/`. A run overlapping an injection window would go red for a manufactured reason.

### 3.2 TWO-COLUMN RULE

Every row of § 4 and every **Observed** block in § 5 carries **two** outcomes: the **assertion
outcome** (did the specific asserted expression pass?) and the **file outcome** (did the test file exit
green?), plus the failing `file:line` wherever the two differ. **The verdict cites the assertion
column.**

Why: vitest reports per-file and per-test outcomes, not per-assertion outcomes, so a single merged
column would collapse into the process exit code — and criterion 2's "reads blind but fails correctly
→ withdraw" would then fire on the three F19 findings, whose blind `toBeDefined()` passes while the
next line throws. That withdrawal would shrink ASSERT-03 and Phase 140 as well as ASSERT-07 and
Phase 142, on the strength of a column that was never measuring the assertion. A verdict row whose
observed outcome is a single value is the failure mode this rule exists to prevent.

### 3.3 COLLATERAL RULE

**Only the outcome of the fifteen enumerated sites is verdict evidence.** Any other test that goes red
under an injection is **collateral**: it is recorded verbatim in § 8 and explicitly stated not to bear
on the verdict.

Why: several injections in this corpus red sibling tests in the same file by construction — an
unconditional-false return reds the success-path tests around it, a message swap reds a sibling
matcher. Without this rule one of those collateral reds gets misread as "the assertion caught it" and
produces a spurious withdrawal of a finding that is in fact blind. Where isolation is available, the
verdict run is isolated to the site (`npx vitest run <file> -t '<title>'`) and the whole-file run is
kept as the collateral record.

### 3.4 Verdict vocabulary and the 15-row enumeration

**The vocabulary is exactly two values: `confirmed` and `withdrawn`.** A third, severity-qualified
tier was offered during discussion and rejected, so the vacuous-but-red class — an assertion that
passes blind while the following line throws — is plain `confirmed`, with the mitigation stated in the
verdict body (D-02). No verdict cell anywhere in this document takes a third value.

The fifteen verdict rows are, in this fixed order: F15-A, F15-B, F15-C, F16, F17, F18, F19a, F19b, F19c, F20-1, F20-2, F20-3, F20-4, F20-5, F20-6.

§ 4 row N and § 5.N are the same finding, by construction. The order is fixed so that Phase 142 cannot
misread a merged or reordered row as a missing finding.

**Prediction calibration.** Every correctly-designed injection in this corpus **predicts PASS**,
because the assertion under test is blind and therefore stays green under a break it cannot see. A
predicted FAIL is a sign the injection was mis-designed — it removed the *category* of the behaviour
instead of varying the *detail* the matcher cannot see — not a sign the finding should be withdrawn.
And a prediction the run overturns is data: it is recorded as overturned in § 8, never quietly
rewritten to match the observation.

---

## 4. Verdict summary

Fifteen rows, created in full before the first injection ran, so a finding can be left visibly
unfilled but never silently absent. `pending` marks a row this plan did not fill.

| # | Finding | Site (current file:line) | Assertion outcome | File outcome | Verdict | Predicted | Matched? | Collateral |
|---|---|---|---|---|---|---|---|---|
| 1 | F15-A | `packages/question-info/tests/questionTypes.test.ts:84,139,199,263,323,387,532,535-537` | pending | pending | pending | PASS | pending | pending |
| 2 | F15-B | `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:131-142,184-185` | pending | pending | pending | PASS | pending | pending |
| 3 | F15-C | `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:139-145,215-219,268-274` | pending | pending | pending | PASS | pending | pending |
| 4 | F16 | `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68` | pending | pending | pending | PASS | pending | pending |
| 5 | F17 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95` | pending | pending | pending | PASS | pending | pending |
| 6 | F18 | `packages/dev-seed/tests/templates/default.test.ts:121-135` | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes | none |
| 7 | F19a | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144` | pending | pending | pending | PASS | pending | pending |
| 8 | F19b | `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:148` | pending | pending | pending | PASS | pending | pending |
| 9 | F19c | `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:167` | pending | pending | pending | PASS | pending | pending |
| 10 | F20-1 | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233` | pending | pending | pending | PASS | pending | pending |
| 11 | F20-2 | `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36` | pending | pending | pending | PASS | pending | pending |
| 12 | F20-3 | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259` | pending | pending | pending | PASS | pending | pending |
| 13 | F20-4 | `packages/dev-seed/tests/supabaseAdminClient.test.ts:151` | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes | none |
| 14 | F20-5 | `packages/data/src/objects/nominations/variants/variants.test.ts:5-12` | pending | pending | pending | PASS | pending | pending |
| 15 | F20-6 | `packages/argument-condensation/tests/unit/planValidation.test.ts:104` | pending | pending | pending | PASS | pending | pending |

Two rows carry a scope caveat that § 7 states in full: **F15-A**'s injection is a substitution (the
regression the audit names does not exist in the package's `src/`, and that absence is itself stronger
evidence for the finding than any injection), and **F17**'s run is corroboration rather than a
discriminating experiment (the injected module is not in the test's import graph — D-06 already flags
F17 as out-of-criterion-1).

---

## 5. Per-finding records

Fifteen records, numbered by enumeration position. Each carries six sub-parts: **N.1 Re-read evidence**
(verbatim assertion text plus its current line, quoted from the live tree, not re-copied from the
audit) · **N.2 Injected diff** (the verbatim `-`/`+` lines — D-04) · **N.3 Invocation** (the verbatim
command) · **N.4 Observed** (assertion outcome, file outcome, failing line, and the verbatim runner
output block) · **N.5 Verdict and reasoning** (ending in the literal word `confirmed` or `withdrawn`) ·
**N.6 Pre-specified regression for Phase 142** (the concrete regression this assertion cannot detect,
stated so Phase 142 re-applies it mechanically — ROADMAP criterion 3).

### 5.1 F15-A — `questionTypes.test.ts` (10 mock-in/mock-out sites)

**Status:** not yet run — filled by a later plan in this phase.

- **5.1.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.1.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.1.3 Invocation** — the verbatim command
- **5.1.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.1.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.1.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.2 F15-B — `condenserStandalone.test.ts` (`result.arguments` never touched)

**Status:** not yet run — filled by a later plan in this phase.

- **5.2.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.2.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.2.3 Invocation** — the verbatim command
- **5.2.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.2.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.2.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.3 F15-C — `condenseQuestions.test.ts` (shape and type only)

**Status:** not yet run — filled by a later plan in this phase.

- **5.3.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.3.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.3.3 Invocation** — the verbatim command
- **5.3.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.3.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.3.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.4 F16 — `handleQuestion.test.ts` (bare `rejects.toThrow()`, competing throw)

**Status:** not yet run — filled by a later plan in this phase.

- **5.4.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.4.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.4.3 Invocation** — the verbatim command
- **5.4.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.4.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.4.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.5 F17 — `EntityListWithControls.test.ts` (self-referential `10 === 10`)

**Status:** not yet run — filled by a later plan in this phase.

- **5.5.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.5.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.5.3 Invocation** — the verbatim command
- **5.5.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.5.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.5.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.6 F18 — `default.test.ts:121-135` (locale cycling asserts only non-empty names)

**5.6.1 Re-read evidence**

Quoted from the live tree at `12825b479`, not re-copied from the audit.
`packages/dev-seed/tests/templates/default.test.ts`, verbatim at the current line numbers:

```ts
121  it('Test 10: faker locale cycling — 109 candidates per locale block (en/fi/sv)', () => {
130    for (const idx of [0, 109, 218]) {
131      const r = rows[idx] as { first_name?: string; last_name?: string };
132      expect(r.first_name).toBeTruthy();
133      expect(r.last_name).toBeTruthy();
134    }
135  });
```

The audit's cite of `:121-135` is **line-exact** — no drift on the range or on either assertion. The
test's own comment at `:122-126` is candid about the gap ("We cannot easily assert the locale packet …
Shape-only assertion: non-empty strings"), which is why the audit filed this as a documented weakness
rather than a misleading one. The candour does not change what the assertion can detect, and detection
is what this pass measures.

The indices are the load-bearing part of the title: `[0, 109, 218]` are precisely the first row of each
locale block, chosen so the test would notice a block-boundary regression — and then nothing
locale-specific is asserted about any of them.

**5.6.2 Injected diff**

Target `packages/dev-seed/src/templates/defaults/candidates-override.ts:53`, verbatim (D-04 — Phase 142
re-applies this mechanically):

```diff
  packages/dev-seed/src/templates/defaults/candidates-override.ts:53
-export const LOCALE_BLOCK_SIZE = 109;
+export const LOCALE_BLOCK_SIZE = 327;
```

**Marker exemption, decided rather than forgotten.** No `INJECTED (139)` comment is appended. A
trailing comment would be syntactically legal here, but it would sit on the one line whose *value* is
the entire experiment, and a reader diffing the record against the tree would have to disentangle the
marker from the injected constant. § 3.1 step 2 exempts constant reassignments for this reason; the
git gates (a) and (b) carry the hygiene claim for this site.

**The consequence, stated before the run.** The consumer at
`packages/dev-seed/src/templates/defaults/candidates-override.ts:133` is
`const localeIdx = Math.floor(i / LOCALE_BLOCK_SIZE);`, and `LOCALE_ORDER` at `:60` is
`['en', 'fi', 'sv'] as const`. With the block size at 327, `Math.floor(i / 327) === 0` for every `i` in
`[0, 327)`, so all 327 candidates take `LOCALE_ORDER[0]` — `'en'`. That is exactly the regression the
audit names: *"Generating all 327 candidates with `en`, or changing `LOCALE_BLOCK_SIZE` from 109,
leaves every name truthy."* The injection produces both halves of that sentence at once.

**Blast radius, run rather than restated.** Repo-wide grep, output pasted verbatim:

```
$ grep -rn 'LOCALE_BLOCK_SIZE' apps packages tests
packages/dev-seed/tests/templates/default.test.ts:125:    // LOCALE_BLOCK_SIZE constant is 109. Shape-only assertion: non-empty
packages/dev-seed/src/templates/defaults/candidates-override.ts:53:export const LOCALE_BLOCK_SIZE = 109;
packages/dev-seed/src/templates/defaults/candidates-override.ts:133:    const localeIdx = Math.floor(i / LOCALE_BLOCK_SIZE);
```

Exactly three hits: the declaration, its single consumer, and a **comment** in the test file. No other
module imports the constant, so the blast radius is one file and the collateral question is confined to
`default.test.ts` itself.

Confirmation that the injection landed as recorded, from `git diff` taken while it was live:

```
@@ -50,7 +50,7 @@ const TOTAL_CANDIDATES = PARTY_WEIGHTS.reduce((a, b) => a + b, 0);
  * en, 109-217 fi, 218-326 sv. Math.floor(i / 109) gives the locale index for
  * candidate i in [0, 327).
  */
-export const LOCALE_BLOCK_SIZE = 109;
+export const LOCALE_BLOCK_SIZE = 327;
```

**5.6.3 Invocation**

Two runs, both under the same live injection. Per the COLLATERAL RULE (§ 3.3) the isolated run is the
**verdict run** and the whole-file run is the **collateral record**; only the first bears on the
verdict.

**The verdict run** — isolated to the site:

```bash
cd "$(git rev-parse --show-toplevel)/packages/dev-seed" && npx vitest run tests/templates/default.test.ts -t 'Test 10'
```

**The collateral record** — whole-file:

```bash
cd "$(git rev-parse --show-toplevel)/packages/dev-seed" && npx vitest run tests/templates/default.test.ts
```

**5.6.4 Observed**

Two outcomes for the verdict run, recorded separately per the TWO-COLUMN RULE (§ 3.2).

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F18 `default.test.ts:132-133` | `candidates-override.ts:53` | **PASS** (blind) | **PASS** (green) | none — the two columns agree | 0 |

Verbatim runner output, **verdict run** (isolated):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed

 ✓ tests/templates/default.test.ts (27 tests | 26 skipped) 4ms

 Test Files  1 passed (1)
      Tests  1 passed | 26 skipped (27)
   Start at  14:39:15
   Duration  415ms (transform 86ms, setup 0ms, collect 224ms, tests 4ms, environment 0ms, prepare 60ms)
```

Verbatim runner output, **collateral record** (whole-file):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed

 ✓ tests/templates/default.test.ts (27 tests) 57ms

 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  14:39:21
   Duration  443ms (transform 79ms, setup 0ms, collect 198ms, tests 57ms, environment 0ms, prepare 43ms)
```

**Collateral: none.** All 27 tests in the file passed under the injection, so nothing is carried to
§ 8 for this site. In particular **Test 9**, the determinism comparison at `:113-119`, stayed green
exactly as predicted — both of its halves call the *same* mutated generator, so a uniform locale
collapse leaves `JSON.stringify(rowsA)` and `JSON.stringify(rowsB)` byte-identical to each other. Had
Test 9 gone red it would have been collateral, recorded in § 8, and explicitly excluded from this
verdict.

**Positive control — the injection was live, not a no-op.** A green run only proves blindness if the
break actually reached the module under test. Probed with `npx tsx` against the live tree, importing
the same source specifier the test imports:

```
LOCALE_BLOCK_SIZE = 327
Math.floor(0 / 327) = 0  -> LOCALE_ORDER index
Math.floor(109 / 327) = 0  -> LOCALE_ORDER index
Math.floor(218 / 327) = 0  -> LOCALE_ORDER index
```

All three probed indices — the exact three the test iterates at `:130` — resolve to `LOCALE_ORDER[0]`,
i.e. `'en'`. The three-locale block structure the test's title advertises was fully collapsed while the
test ran, and the test still passed.

Prediction was PASS; observed PASS; **matched**.

**5.6.5 Verdict and reasoning**

The block structure the test is named for was destroyed and the test did not notice. Under the
injection every one of the 327 generated candidates drew its name from the `en` Faker instance — the
positive control above shows indices 0, 109 and 218 all mapping to `LOCALE_ORDER[0]` — so the "109
candidates per locale block (en/fi/sv)" the title promises was, at run time, 327 candidates in one
block and one locale. Both the isolated verdict run and the whole-file collateral run reported pass.

The mechanism is that the assertions never read the property the test exists to check.
`packages/dev-seed/tests/templates/default.test.ts:132-133` assert `toBeTruthy()` on `first_name` and
`last_name`, and a Faker-generated personal name is a non-empty string in every locale pack — `en`,
`fi` and `sv` alike. The locale is therefore invisible to the oracle by construction: the indices at
`:130` are chosen to straddle the block boundaries, but the only thing examined at those indices is
whether a name exists at all. The audit's characterisation is accurate to the line, and its own
`:122-126` comment names the gap without closing it. Nothing in the run overturned a prediction.

**Verdict:** confirmed

**5.6.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** change the block size at
`packages/dev-seed/src/templates/defaults/candidates-override.ts:53` from
`export const LOCALE_BLOCK_SIZE = 109;` to `export const LOCALE_BLOCK_SIZE = 327;`. Every candidate in
the default seed template is then generated in one locale while all three of the test's probed indices
still read truthy — a seeded dataset that silently loses its multi-locale character, which is the whole
point of the `en`/`fi`/`sv` cycling for demo and matching-visibility purposes. Today the suite stays
green through it.

**The target Phase 142 must reach:** the assertion must observe the block boundary the title already
promises — that `rows[108]` and `rows[109]` come from **different** locales. Concretely, assert that
the name at the last index of one block and the name at the first index of the next are drawn from
distinct locale packs: compare `rows[108]` against a freshly-seeded `__buildLocaleFakerForTests('en')`
draw and `rows[109]` against `__buildLocaleFakerForTests('fi')` (the helper is exported at
`candidates-override.ts:172` for exactly this purpose), or — weaker but sufficient to fail the diff
above — assert that the multiset of names across the three block starts is not all drawn from one
pack, e.g. via the Finnish/Swedish `ä`/`ö`/`å` character classes the `fi`/`sv` packs produce and the
`en` pack does not. Either form fails under the diff above; `toBeTruthy()` does not.

### 5.7 F19a — `authorize-endpoint.test.ts:144` (`expect(requestParam).toBeDefined()`)

**Status:** not yet run — filled by a later plan in this phase.

- **5.7.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.7.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.7.3 Invocation** — the verbatim command
- **5.7.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.7.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.7.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.8 F19b — `idura.test.ts:148` (`expect(requestParam).toBeDefined()`)

**Status:** not yet run — filled by a later plan in this phase.

- **5.8.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.8.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.8.3 Invocation** — the verbatim command
- **5.8.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.8.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.8.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.9 F19c — `token-endpoint.test.ts:167` (`expect(assertion).toBeDefined()`)

**Status:** not yet run — filled by a later plan in this phase.

- **5.9.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.9.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.9.3 Invocation** — the verbatim command
- **5.9.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.9.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.9.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.10 F20-1 — `authorize-endpoint.test.ts:233` (bare `rejects.toThrow()` under a 400 title)

**Status:** not yet run — filled by a later plan in this phase.

- **5.10.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.10.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.10.3 Invocation** — the verbatim command
- **5.10.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.10.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.10.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.11 F20-2 — `overrides.test.ts:32-36` (`typeof result` is `'string'`)

**Status:** not yet run — filled by a later plan in this phase.

- **5.11.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.11.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.11.3 Invocation** — the verbatim command
- **5.11.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.11.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.11.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.12 F20-3 — `getIdTokenClaims.test.ts:236,259` (`result.success` is `false`, no error code)

**Status:** not yet run — filled by a later plan in this phase.

- **5.12.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.12.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.12.3 Invocation** — the verbatim command
- **5.12.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.12.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.12.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.13 F20-4 — `supabaseAdminClient.test.ts:151` (`toContain('id')` substring-matches `external_id`)

**5.13.1 Re-read evidence**

Quoted from the live tree at `12825b479`, not re-copied from the audit.
`packages/dev-seed/tests/supabaseAdminClient.test.ts:151`, verbatim:

```ts
      expect(mockState.selectCalls[0]).toContain('id');
```

Its enclosing test title, `packages/dev-seed/tests/supabaseAdminClient.test.ts:138`:

```ts
    it('queries candidates table with project_id eq + external_id like prefix + order by external_id asc', async () => {
```

The audit's cite (`:151`) is line-exact; no drift. The title promises that the select includes the
`id` column, and `:151` is the only assertion in the file that speaks to it.

**Zero-collateral analysis, checked rather than assumed.** The sibling assertions in the same test,
re-read at `:152-159`:

```ts
152      expect(mockState.selectCalls[0]).toContain('external_id');
153      expect(mockState.selectCalls[0]).toContain('first_name');
154      expect(mockState.selectCalls[0]).toContain('last_name');
155      expect(mockState.eqCalls).toContainEqual(['project_id', 'proj-123']);
156      expect(mockState.likeCalls).toContainEqual(['external_id', 'seed_%']);
157      expect(mockState.orderCalls[0]).toEqual(['external_id', { ascending: true }]);
158      expect(rows).toHaveLength(2);
159      expect(rows[0].first_name).toBe('Alice');
```

`:152-154` name three columns that the injected select string still contains; `:155-157` cover
`eq`/`like`/`order`, which the injection does not touch; `:158-159` assert on the **mocked** return
data configured at `:139-145`, which is independent of the select string entirely. So no sibling can
red under this injection. **Correction to RESEARCH § F20-4:** it groups these as `:152-155`,
`:156-158` and `:159-160`, one line high throughout — `:160` is the closing `});`, not an assertion.
The grouping is off by one; the substance (three groups, none reachable by the injection) is
unaffected, and the observed run below confirms it.

**5.13.2 Injected diff**

Target `packages/dev-seed/src/supabaseAdminClient.ts:708`, verbatim (D-04 — Phase 142 re-applies this
mechanically):

```diff
  packages/dev-seed/src/supabaseAdminClient.ts:708
-      .select('id, external_id, first_name, last_name')
+      .select('external_id, first_name, last_name')
```

**Marker exemption, decided rather than forgotten.** No `INJECTED (139)` comment is placed on the `+`
line. The changed token is a string-literal argument inside a fluent call chain; a trailing comment
there would alter the call's formatting without altering its meaning, and § 3.1 step 2 exempts string
literals from the marker convention for exactly this reason. The git gates in § 3.1 step 5 (a) and (b)
carry the hygiene claim for this site; the marker gate (c) is a supplement that this site does not
exercise.

Confirmation that the injection landed as recorded, from `git diff` taken while it was live:

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

**5.13.3 Invocation**

Verbatim, run from the workspace directory (D-05 — `packages/dev-seed` exposes no `test:unit` script
that `turbo run` would reach, so the run is ad-hoc and in-package; no wiring was changed):

```bash
cd "$(git rev-parse --show-toplevel)/packages/dev-seed" && npx vitest run tests/templates/default.test.ts tests/supabaseAdminClient.test.ts
```

**5.13.4 Observed**

Two outcomes, recorded separately per the TWO-COLUMN RULE (§ 3.2), even though this site is the one
case in the corpus predicted to have neither collateral nor divergence — a row that quietly drops a
column is the failure mode that rule exists to prevent.

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F20-4 `supabaseAdminClient.test.ts:151` | `supabaseAdminClient.ts:708` | **PASS** (blind) | **PASS** (green) | none — the two columns agree | 0 |

Verbatim runner output, under the live injection:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed

 ✓ tests/supabaseAdminClient.test.ts (7 tests) 4ms
 ✓ tests/templates/default.test.ts (27 tests) 63ms

 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  14:37:05
   Duration  640ms (transform 159ms, setup 0ms, collect 346ms, tests 67ms, environment 0ms, prepare 182ms)
```

Byte-for-byte the same test counts as the pre-injection baseline (34 passed) and the post-revert
baseline (34 passed) taken in the same session. **Collateral: none** — no test anywhere in either file
changed state, so § 8 has nothing to record for this site. Prediction was PASS (green); observed PASS;
**matched**.

**5.13.5 Verdict and reasoning**

The regression was applied to production source, the test that claims to guard it was executed against
that source, and it stayed green. The `id` column was removed from the select list that
`selectCandidatesForPortraitUpload` issues, and every one of the seven tests in
`supabaseAdminClient.test.ts` — including the one at `:151` whose entire purpose is to check that the
column is there — reported pass. The guard did not merely fail to be strict; it registered nothing at
all.

The mechanism is the matcher, not the fixture. `mockState.selectCalls[0]` is the raw select string, so
`toContain('id')` is a JavaScript substring test, and `'external_id, first_name, last_name'.includes('id')`
is `true` via the two characters inside `external_id` — a token the injection deliberately leaves in
place. The assertion at `packages/dev-seed/tests/supabaseAdminClient.test.ts:151` is therefore
structurally incapable of distinguishing "the `id` column is selected" from "some column whose name
happens to contain the letters `id` is selected", which the same file's own `:152` proves is always the
case. The audit's characterisation ("substring-matches `external_id`/`project_id`; the `id` column
being dropped (breaks portrait UUID mapping)") is accurate to the line, and the run overturned nothing
it predicted.

**Verdict:** confirmed

**5.13.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** drop `id` from the select column list at
`packages/dev-seed/src/supabaseAdminClient.ts:708` — `.select('id, external_id, first_name, last_name')`
becomes `.select('external_id, first_name, last_name')`. In production this breaks portrait upload:
`selectCandidatesForPortraitUpload` is typed to return `{ id, external_id, first_name, last_name }` and
its callers key the portrait storage path off `id`, so every returned row would carry `id: undefined`
and the UUID mapping would silently fail. Today the suite stays green through it.

**The target Phase 142 must reach:** the assertion must discriminate the `id` column from a column
merely containing the letters. The test title already promises this. The stronger matcher is an
exact-membership check over the parsed column list rather than a substring check over the raw string —
e.g. assert that `mockState.selectCalls[0].split(',').map((c) => c.trim())` contains the exact element
`'id'`, or assert the select string in full with `toBe('id, external_id, first_name, last_name')`. Either
form fails under the diff above; `toContain('id')` does not.

### 5.14 F20-5 — `variants.test.ts:5-12` (`forEach` with no length guard)

**Status:** not yet run — filled by a later plan in this phase.

- **5.14.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.14.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.14.3 Invocation** — the verbatim command
- **5.14.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.14.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.14.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

### 5.15 F20-6 — `planValidation.test.ts:104` (bare `toThrow()` among seven message matchers)

**Status:** not yet run — filled by a later plan in this phase.

- **5.15.1 Re-read evidence** — verbatim assertion text plus its current line, quoted from the live tree
- **5.15.2 Injected diff** — the verbatim `-`/`+` lines (D-04)
- **5.15.3 Invocation** — the verbatim command
- **5.15.4 Observed** — assertion outcome, file outcome, failing line, verbatim runner output
- **5.15.5 Verdict and reasoning** — ends in `confirmed` or `withdrawn`
- **5.15.6 Pre-specified regression for Phase 142** — the concrete regression this assertion cannot detect

---

## 6. Withdrawals and their propagation

not yet written — filled by plan 07.

---

## 7. What this pass does and does not prove

not yet written — filled by plan 06.

---

## 8. Discarded and collateral — recorded rather than hidden

not yet written — filled by plan 06.
