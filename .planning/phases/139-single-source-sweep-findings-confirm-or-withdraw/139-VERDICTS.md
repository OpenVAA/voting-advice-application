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
| 1 | F15-A | `packages/question-info/tests/questionTypes.test.ts:84,139,199,263,323,387,532,535-537` (+ unlisted `:388`) | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes | none |
| 2 | F15-B | `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:131-142,184-185` | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes | none |
| 3 | F15-C | `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:139-145,215-219,268-274` | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes at the sites; viz-test sub-prediction **overturned** (§ 8) | none |
| 4 | F16 | `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68` | **PASS** (blind) — inj. B · **FAIL** — inj. A | **PASS** (green) — inj. B · **FAIL** (red) — inj. A | **confirmed** | PASS | inj. B **yes** · inj. A **no — overturned** (§ 8) | none |
| 5 | F17 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95` | pending | pending | pending | PASS | pending | pending |
| 6 | F18 | `packages/dev-seed/tests/templates/default.test.ts:121-135` | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes | none |
| 7 | F19a | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144` | **PASS** (blind) | **FAIL** (red) at `:147` `requestParam!.split('.')` | **confirmed** | PASS (assertion) / FAIL (file) | yes | `:159`, `:171`, `:192` (§ 8.1 C-2) |
| 8 | F19b | `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:148` | **PASS** (blind) | **FAIL** (red) at `:151` `requestParam!.split('.')` | **confirmed** | PASS (assertion) / FAIL (file) | yes | `:184` (§ 8.1 C-3) |
| 9 | F19c | `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:167` | **PASS** (blind) — inj. B · **PASS** (on `"undefined"`) — inj. A | **FAIL** (red) at `:170` `assertion.split('.')` — inj. B · **FAIL** (red) at `:171` `toHaveLength(3)` — inj. A | **confirmed** | PASS (assertion) / FAIL (file) | yes (inj. B; inj. A is a second axis, § 8.3 R-6) | `:189`, `:208`, `:230` (§ 8.1 C-4) |
| 10 | F20-1 | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233` | pending | pending | pending | PASS | pending | pending |
| 11 | F20-2 | `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36` | pending | pending | pending | PASS | pending | pending |
| 12 | F20-3 | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259` | pending | pending | pending | PASS | pending | pending |
| 13 | F20-4 | `packages/dev-seed/tests/supabaseAdminClient.test.ts:151` | **PASS** (blind) | **PASS** (green) | **confirmed** | PASS | yes | none |
| 14 | F20-5 | `packages/data/src/objects/nominations/variants/variants.test.ts:5-12` | **PASS** — inj. A (vacuous) · **PASS** (blind) — inj. B | **PASS** (green) — both | **confirmed** | PASS | yes, both | none |
| 15 | F20-6 | `packages/argument-condensation/tests/unit/planValidation.test.ts:104` | **PASS** (blind) | **PASS** isolated · **FAIL** whole-file (collateral) | **confirmed** | PASS | yes | `:89-97` sibling matcher (§ 8) |

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

This record does three things the other fourteen do not: it **proves a negative**, it **substitutes
the injection** the audit names, and it **corrects the audit's own description of the sites**. None of
the three is grounds for withdrawal; all three are on the record here and carried into § 7.

**5.1.1 Re-read evidence**

**(a) The audit's named regression does not exist to be deleted.**

The audit's claim, `.planning/audits/2026-08-11-fake-guard-sweep.md:632-634`, verbatim:

> A `generateQuestionInfo` that ignored question type entirely, or that passed the LLM response
> through untouched, keeps all 540 lines green.

Scope grep over the package's **source** (not its tests), run this session, pasted as observed rather
than restated:

```console
$ cd "$(git rev-parse --show-toplevel)" && grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/ ; echo "exit=$?"
exit=1
```

Zero lines of output. `grep` exits **1** when the pattern matched nothing and **2** on error, so
`exit=1` is the load-bearing value: the search ran, found the directory, and matched nothing. There is
no `question.type` read, no `QUESTION_TYPE` constant and no `choices` access anywhere under
`packages/question-info/src/`.

What the prompt is actually built from, quoted verbatim from the live tree at
`packages/question-info/src/core/infoGeneration.ts:75-82`:

```ts
        const variables: Record<string, unknown> = {
          question: question.name,
          generalInstructions: GENERAL_INSTRUCTIONS,
          neutralityRequirements: NEUTRALITY_REQUIREMENTS,
          questionContext: options.questionContext || '',
          customInstructions: options.customInstructions || '',
          examples: formattedExamples
        };
```

`question.name` plus five fixed instruction constants and caller-supplied option strings. The only
branch anywhere downstream is on `promptKey` — the *operation* requested (`generateTerms`,
`generateInfoSections`, `generateBoth`) at `:85-91` — never on the question's type. A `BooleanQuestion`,
a 7-point `OrdinalQuestion` and a `CategoricalQuestion` with choice labels all produce byte-identical
prompt variables for the same operation.

**Conclusion, stated plainly: the behaviour the audit proposes deleting does not exist, so the audit's
literal injection is impossible.** You cannot break what is already broken, and an injection producing
green would prove nothing new. *This absence is stronger evidence for F15-A than any injection could
be.* The test file's organisation into `Configuration 1: Boolean Questions` /
`Configuration 2: Ordinal Questions` / `Configuration 3: Categorical Questions` is answering a
distinction the implementation never draws — it is pure theatre. The three "Configurations" cannot
differ in outcome, because nothing in the code path they exercise reads the property that
distinguishes them.

**(b) Correction to the audit's description of the ten sites.**

The audit says the sites are "all variations of `expect(results[0].data.infoSections).toBeDefined()`".
Seven of the ten are. **Three are not.** All ten quoted from the live tree at `12825b479`, with their
current line numbers — the audit's cites are line-exact, no drift:

| Line | Verbatim assertion | Audit's description |
|---|---|---|
| 84 | `      expect(results[0].data.infoSections).toBeDefined();` | accurate |
| 139 | `      expect(results[0].data.terms).toBeDefined();` | accurate |
| 199 | `      expect(results[0].data.infoSections).toBeDefined();` | accurate |
| 263 | `      expect(results[0].data.terms).toBeDefined();` | accurate |
| 323 | `      expect(results[0].data.infoSections).toBeDefined();` | accurate |
| 387 | `      expect(results[0].data.terms).toBeDefined();` | accurate |
| 532 | `      expect(results.every((r) => r.data.infoSections && r.data.terms)).toBe(true);` | accurate in spirit — a `toBe(true)` over a truthiness reduction, not a `toBeDefined()` |
| 535 | `      expect(results[0].data.infoSections![0].title).toBe('Tax Policy');` | **wrong — an exact string equality** |
| 536 | `      expect(results[1].data.infoSections![0].title).toBe('Income Inequality Priority');` | **wrong — an exact string equality** |
| 537 | `      expect(results[2].data.infoSections![0].title).toBe('Policy Preference Analysis');` | **wrong — an exact string equality** |

**The finding's substance survives the correction; its description does not.** `:535-537` are not
weak matchers — `toBe` on an exact string is the strongest matcher in the file. They are nonetheless
mock-in / mock-out, because those three exact strings are what the test itself fed to the mock. From
the same file, `:452` opens the feed and the titles are supplied at `:457`, `:480` and `:503`:

```ts
452      mockLLMProvider.generateObjectParallel.mockResolvedValue([
457                title: 'Tax Policy',
480                title: 'Income Inequality Priority',
503                title: 'Policy Preference Analysis',
```

So `:535-537` assert that a `vi.fn()` returned the value the test configured it to return, 78, 56 and
34 lines earlier respectively. (Research characterised the gap as "about twenty lines"; measured, it is
32-78 lines. Recorded rather than repeated.) The matcher is strong and the fixture is a tautology, which
is a *different* defect from the one the audit describes and the *same* defect it names in its heading.

**Unlisted eleventh assertion the audit missed**, in the same cluster the audit does list, verbatim
from `packages/question-info/tests/questionTypes.test.ts:386-388`:

```ts
386      expect(results).toHaveLength(1);
387      expect(results[0].data.terms).toBeDefined();
388      expect(results[0].data.terms).toHaveLength(3);
```

`:388` is not in the audit's enumeration. It is the same shape as the rest — the mocked response
configured at `:354` carries exactly three terms — so it strengthens the finding by one site rather
than weakening it. Recorded so Phase 142's remediation covers eleven assertions, not ten. (The
identical unlisted pattern also appears at `:140` and `:264`, both `toHaveLength(2)` against
two-element mock fixtures.)

**Mock handle**, verbatim from `packages/question-info/tests/questionTypes.test.ts:14-17` — the reason
the substituted injection below cannot be seen:

```ts
// Mock LLM provider (new API)
const mockLLMProvider = {
  generateObjectParallel: vi.fn()
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
```

A bare `vi.fn()`. It records the request it was handed and never reads it; the resolved value is fixed
by the test. **The prompt is never inspected by any assertion in the file.** Confirmed by enumeration:
`grep -n 'mock.calls' packages/question-info/tests/questionTypes.test.ts` returns nothing.

**Scope note carried from the audit:** the sibling `packages/question-info/tests/api.test.ts` is
explicitly **excluded** from F15-A by the audit itself (`:635-637`) — it carries negative assertions
(`toBeUndefined()` for non-requested operations) and `success: false` paths, and is called "genuinely
stronger". It is not part of this verdict and was not run against the injection as evidence.

**5.1.2 Injected diff**

> ### ⚠ THIS IS A SUBSTITUTE, NOT THE AUDIT'S NAMED REGRESSION
>
> The audit's regression — *"a `generateQuestionInfo` that ignored question type entirely"* — is
> **un-injectable**, for the reason proved in § 5.1.1(a): the shipped code already ignores question
> type, and the scope grep exits 1. There is no delta to apply. Phase 142 must re-apply **this** diff,
> not the audit's sentence. Plan 06 lifts this substitution into § 7's scope limits so it is a
> declared limit of the whole pass, not a footnote on one record.

Target `packages/question-info/src/core/infoGeneration.ts:76`, verbatim (D-04 — Phase 142 re-applies
this mechanically):

```diff
  packages/question-info/src/core/infoGeneration.ts:76
-          question: question.name,
+          question: '', // INJECTED (139): the prompt no longer carries the question at all
```

**Line-number drift, verified before editing.** `139-RESEARCH.md:471` cites this line as `:75`. In the
current tree `:75` is the `const variables: Record<string, unknown> = {` opener and the
`question: question.name,` entry is at **`:76`** — a **+1 drift**. The line was read and asserted equal
to `question: question.name,` before the write, and the edit refused to apply anywhere else.

Confirmation that the injection landed as recorded, from `git diff` taken while it was live:

```
@@ -73,7 +73,7 @@ export async function generateInfo({
       questions.map(async (question) => {
         // Build variables object based on the operation type. Start with tasks' shared variables
         const variables: Record<string, unknown> = {
-          question: question.name,
+          question: '', // INJECTED (139): the prompt no longer carries the question at all
           generalInstructions: GENERAL_INSTRUCTIONS,
           neutralityRequirements: NEUTRALITY_REQUIREMENTS,
           questionContext: options.questionContext || '',
```

**Why this substitute is faithful to D-01's intent.** It is a real and catastrophic regression: the
question text is the only question-specific content in the entire prompt (§ 5.1.1(a)), so with it
emptied the LLM is asked to generate info sections and term definitions **about nothing at all** —
every question in the corpus would receive the same generic response. In production this is total
product failure. It is exactly the class of break the ten assertions claim to guard and provably
cannot see, because the provider is a bare `vi.fn()` whose resolved value is fixed by the test and
whose received request no assertion reads.

**Considered and not used** (recorded per § 8.3, entry R-3): the second candidate matching the audit's
*second* clause — *"passed the LLM response through untouched"* — is to bypass
`packages/question-info/src/utils/responseTransformer.ts` and return the raw provider response from
`transformResponse` at `infoGeneration.ts:129-137`. **Not run.** Reason: markedly higher blast radius
(it changes the shape of every returned object, so it would red `api.test.ts` and any consumer of the
result type) for **no additional discrimination** — it would demonstrate the same single fact, that the
assertions read only the mocked payload. The chosen substitute touches one line and one field.

**Marker convention:** the `+` line carries the `INJECTED (139)` marker in a legal trailing comment; no
exemption was needed at this site.

**5.1.3 Invocation**

Verbatim, run from inside the workspace directory (D-05 — `packages/question-info` exposes no
`test:unit` script that `turbo run` would reach, so the run is ad hoc and in-package; no `test:unit`
script was added, and neither `turbo.json` nor `vitest.workspace.ts` was touched):

```bash
cd "$(git rev-parse --show-toplevel)/packages/question-info" && npx vitest run tests/questionTypes.test.ts
```

**Benign stderr, recorded rather than diagnosed.** Every run of this file — baseline, injected, control
and post-revert alike — prints:

```
stderr | tests/questionTypes.test.ts
[PromptRegistry] Package 'question-info' already registered, skipping.
```

It is present identically in all four runs and therefore cannot distinguish any of them. Not a symptom
of the injection; not investigated further.

**5.1.4 Observed**

Two outcomes recorded separately per the TWO-COLUMN RULE (§ 3.2).

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F15-A `questionTypes.test.ts:84,139,199,263,323,387,532,535-537` (+ unlisted `:388`) | `infoGeneration.ts:76` | **PASS** (blind — all eleven) | **PASS** (green, 7/7) | none — the two columns agree | 0 |

Verbatim runner output, under the live injection:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/question-info

stderr | tests/questionTypes.test.ts
[PromptRegistry] Package 'question-info' already registered, skipping.

 ✓ tests/questionTypes.test.ts (7 tests) 5ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  15:04:52
   Duration  699ms (transform 218ms, setup 222ms, collect 148ms, tests 5ms, environment 0ms, prepare 96ms)
```

Byte-for-byte the same test counts as the pre-injection baseline (7 passed, 15:04:30) and the
post-revert baseline (7 passed, 15:05:50) taken in the same session. Prediction was PASS (green);
observed PASS; **matched**. **Collateral: none** — no test anywhere in the file changed state, so § 8.1
has nothing to record for this site.

**IN-BAND POSITIVE CONTROL — required, because the injection run was green.**

Two green runs alone cannot distinguish *"the assertion is blind"* (the finding) from *"the injection
never took effect"* (a null experiment). Per the pattern plan 02 established at `condenser.ts:204`, the
control breaks a **sibling property of the same object literal**, one line from the regression:

```diff
  packages/question-info/src/core/infoGeneration.ts:77
-          generalInstructions: GENERAL_INSTRUCTIONS,
+          generalInstructionsCONTROL: GENERAL_INSTRUCTIONS, // INJECTED (139): positive control — key renamed so loadPrompt's throwIfVarsMissing fires
```

The mechanism is the `throwIfVarsMissing: true` flag the same call site passes at
`infoGeneration.ts:98`: renaming the **key** (rather than emptying the **value**, as the regression
does) makes the prompt registry report the variable missing. Observed — **7 of 7 red**, the exact
inverse of the regression run on the same object literal:

```
 ❯ tests/questionTypes.test.ts (7 tests | 7 failed) 6ms
   × Question Type Configurations > Configuration 1: Boolean Questions > should handle boolean question with yes/no answers 4ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateInfoSections': generalInstructions
   × Question Type Configurations > Configuration 1: Boolean Questions > should handle boolean question with terms generation 0ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateTerms': generalInstructions
   × Question Type Configurations > Configuration 2: Ordinal Questions > should handle 5-point Likert scale question 0ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateInfoSections': generalInstructions
   × Question Type Configurations > Configuration 2: Ordinal Questions > should handle 7-point Likert scale question 0ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateTerms': generalInstructions
   × Question Type Configurations > Configuration 3: Categorical Questions > should handle categorical question with multiple choices 0ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateInfoSections': generalInstructions
   × Question Type Configurations > Configuration 3: Categorical Questions > should handle binary categorical question 0ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateTerms': generalInstructions
   × Question Type Configurations > Mixed Question Type Scenarios > should handle combination of all three question types 0ms
     → Error generating question info: Error: [PromptRegistry] Missing required parameters for prompt 'generateBoth': generalInstructions

 Test Files  1 failed (1)
      Tests  7 failed (7)
   Start at  15:05:31
   Duration  783ms (transform 157ms, setup 209ms, collect 86ms, tests 6ms, environment 0ms, prepare 118ms)
```

This control establishes **four** things in one run, and it is the reason the green above can be read
as blindness:

1. **Liveness.** `infoGeneration.ts` is in this test file's import graph and the `const variables`
   block at `:75-82` *executes* — every one of the 7 tests reached it. There is no stale build, no
   `dist/` shadow, no skipped path.
2. **The object literal is consumed.** The variables object is genuinely read by `loadPrompt` at
   `:94-100`; it is not dead scaffolding.
3. **These tests do red.** The file is capable of failing, and it fails loudly when the code path
   changes in a way the runtime can see.
4. **The blindness is field-specific and, more precisely, *value*-specific.** The control and the
   regression are one line apart in the same literal. The difference is that the control removes the
   **key** (which the runtime checks) while the regression empties the **value** (which nothing checks).
   The suite guards the *presence* of prompt variables and is blind to their *content* — which is the
   whole of F15-A in one sentence.

The control was reverted and its own POST-GATE run before the post-revert baseline. It is a control,
not a regression candidate: Phase 142 must not use it as a negative control, because it reds before and
after any fix to the assertions.

**5.1.5 Verdict and reasoning**

F15-A is confirmed on **two independent grounds**, either of which would carry it alone.

**Ground one — the un-injectability proof (§ 5.1.1(a)).** The audit alleged that a `generateQuestionInfo`
ignoring question type would keep all 540 lines green. The stronger fact is that the shipped
`generateQuestionInfo` *already ignores question type entirely* and all 540 lines are green **today**:
`packages/question-info/src/` contains zero references to `question.type`, `QUESTION_TYPE` or `choices`,
and the prompt is built from `question.name` and fixed constants. The audit's hypothetical is the
production reality. A test file whose three top-level `describe` blocks are named for question types,
and which contains not one assertion capable of distinguishing them, is not merely weak — it is
documenting a distinction its subject does not make. That this had to be established by grep rather than
by injection is a fact about the *method*, not a weakening of the *finding*.

**Ground two — the substituted injection's observed outcome (§ 5.1.4).** With the question text emptied
at `infoGeneration.ts:76` — the LLM asked about nothing at all, total product failure in production —
all seven tests and all eleven assertions reported pass, byte-identically to both baselines. The in-band
positive control at `:77` proves that block executes and that these tests do red when the runtime can
see a change, so the green is blindness rather than a no-op. The mechanism is the bare `vi.fn()` at
`questionTypes.test.ts:15-17`: it resolves to a value the test itself fixed, and no assertion in the
file ever reads `mock.calls`, so the prompt — the only artefact the injection alters — is never
observed.

Two corrections ride along and are recorded rather than buried: the audit's description of `:535-537`
is **wrong** (they are exact string equalities, not `toBeDefined()` variations, though still
mock-in/mock-out), and its enumeration **misses** `:388`. Neither weakens the finding; the first
sharpens its diagnosis and the second widens its scope by one site. Nothing in this record supports
withdrawal, and ROADMAP criterion 2's withdrawal trigger — "reads blind but fails correctly" — never
fired: the sites read blind and passed correctly-blind.

**Verdict:** confirmed

**5.1.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim — and note it is the substitute, not the audit's
sentence):** empty the question text in the prompt variables at
`packages/question-info/src/core/infoGeneration.ts:76` — `question: question.name,` becomes
`question: '',`. In production this is catastrophic: the question is the sole question-specific input to
the prompt, so every question in a VAA would receive identical, contentless info sections and term
definitions. Today every assertion in `questionTypes.test.ts` stays green through it, as does the
unlisted `:388`.

**Do not use the audit's own named regression as the negative control.** "Make `generateQuestionInfo`
ignore question type" cannot be applied — the code already does, and there is nothing to delete. A
Phase 142 that tries will spend its time hunting a branch that does not exist (RESEARCH Pitfall 3).

**The target Phase 142 must reach** — and the audit already names it correctly at `.planning/audits/2026-08-11-fake-guard-sweep.md:651-654`: assert on
the **prompt the mocked provider received**, via
`mockLLMProvider.generateObjectParallel.mock.calls[0]`, so the three "Configurations" differ observably
from one another. Concretely, three things the current file cannot do and the fixed file must:

1. **The question text reaches the prompt.** Assert the request the provider received contains the
   question's own name (e.g. assert the system message the provider was handed
   contains the string `'Do you support universal healthcare?'`, the `name` the test set at
   `questionTypes.test.ts:41`). This fails under the diff above; every current assertion passes.
2. **The three Configurations differ.** Assert that the prompt built for a `BooleanQuestion`, a
   7-point `OrdinalQuestion` and a `CategoricalQuestion` are **not equal to one another** — the minimal
   assertion that gives the file's own `describe` structure meaning. This fails **today, before any
   injection**, and is therefore a genuine defect the remediation must close rather than a
   regression guard. It is the single highest-value assertion named in this document.
3. **Choice labels are carried for categorical questions.** Assert the categorical question's choice
   labels appear in its prompt. Also fails today.

**The mock-in/mock-out tautology at `:535-537` is a separate remediation item.** Strengthening the
matcher there is impossible — `toBe` on an exact string is already maximal. The fix is to stop asserting
on values the test itself supplied to the mock, and assert instead on the *transform* the code applies
between provider response and returned result (`packages/question-info/src/utils/responseTransformer.ts`),
which is the only product logic on that path.

### 5.2 F15-B — `condenserStandalone.test.ts` (`result.arguments` never touched)

> **Shared injection.** One edit to `Condenser.run()`'s return block is the regression for both F15-B
> and **F15-C (§ 5.3)**, because both exercise the same method. The injection is recorded identically
> in § 5.2.2 and § 5.3.2; each record carries its **own** invocation and its **own** observed outcome.

**5.2.1 Re-read evidence**

Quoted from the live tree at `12825b479`, not re-copied from the audit.
`packages/argument-condensation/tests/condensation/condenserStandalone.test.ts`, first assertion
block, verbatim at the current lines:

```ts
130    // Verify results
131    expect(result).toBeDefined();
132    expect(result.condensationType).toBe(CONDENSATION_TYPE.LikertPros);
133
134    // Check metrics
135    expect(result.llmMetrics).toBeDefined();
136    expect(result.llmMetrics.nLlmCalls).toBeGreaterThan(0);
137    expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0);
138    expect(result.llmMetrics.tokens).toBeDefined();
139    expect(result.llmMetrics.tokens.totalTokens).toBeGreaterThan(0);
140
141    // Verify LLM provider was called
142    expect(input.options.llmProvider.generateObjectParallel).toHaveBeenCalled();
```

Second assertion block, verbatim:

```ts
184    expect(result.condensationType).toBe(CONDENSATION_TYPE.LikertCons);
185    expect(result.llmMetrics.nLlmCalls).toBeGreaterThan(0);
```

**Two audit drifts, both reported.**

| Audit cite | Actual | Drift |
|---|---|---|
| `:130-141` | the assertions are `:131-142` — `:130` (`// Verify results`) and `:141` (`// Verify LLM provider was called`) are comment lines | **+1** |
| `:181-183` | the assertions are `:184-185` | **+3 — the largest drift in this corpus** |

Neither drift touches the substance. Both are recorded because Phase 142 edits these lines
mechanically and a three-line miss lands inside the `const condenser = new Condenser(...)` /
`await condenser.run()` pair at `:181-182`.

**The audit's core claim, re-verified rather than re-copied: `result.arguments` is never touched in
either block.** Checked by enumeration, not by eye — `grep -n 'arguments' ` over the whole 222-line
file returns exactly three hits, and **none of them is an assertion**:

```
13:        arguments: [
17:        reasoning: 'These arguments support lowering the voting age'
29:          arguments: [
```

`:13` and `:29` are the mock LLM provider's canned response fixtures, and `:17` is the word
"arguments" inside a `reasoning` string. The product of condensation is set up as input and never
read back as output. The audit's characterisation is exact.

**The incidental CONTEXT § Specifics asks to carry forward, recorded on this verdict rather than
filed as a finding of its own.** `:137` is
`expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0);` — a wall-clock assertion on a run
whose every LLM call is a synchronous mock. It is the only flake-capable line in the cluster: it
passes today because `LatencyTracker` measures a nonzero interval, but it guards nothing (no
production behaviour depends on the pipeline taking measurable time) and it is the kind of assertion
that reds on a fast machine or a coarse timer. Phase 142 should delete it rather than keep it as
decoration — see § 5.2.6.

**5.2.2 Injected diff**

Target `packages/argument-condensation/src/core/condensation/condenser.ts:205`, verbatim (D-04 —
Phase 142 re-applies this mechanically). **This is the shared injection; § 5.3.2 (F15-C) carries the
identical diff.**

```diff
  packages/argument-condensation/src/core/condensation/condenser.ts:205
-      data: { arguments: currentData as Array<Argument> },
+      data: { arguments: [] }, // INJECTED (139): discard every condensed argument
```

This is precisely the regression the audit names: *"A `Condenser.run()` that discards every argument
and returns `{ arguments: [], llmMetrics }` passes."* The `INJECTED (139)` marker is present — the
`+` line has room for a trailing comment that alters neither the emitted value nor the control flow,
so § 3.1 step 2 applies rather than exempts.

Confirmation that the injection landed as recorded, from `git diff` taken while it was live:

```
@@ -202,7 +202,7 @@ export class Condenser {
     return {
       runId: this.runId,
       condensationType: this.input.options.outputType,
-      data: { arguments: currentData as Array<Argument> },
+      data: { arguments: [] }, // INJECTED (139): discard every condensed argument
       llmMetrics: {
         processingTimeMs: totalDuration,
         nLlmCalls: this.allPromptCalls.length,
```

**5.2.3 Invocation**

Verbatim, from inside the workspace:

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" && npx vitest run tests/condensation/condenserStandalone.test.ts
```

**The `cd` is load-bearing, not stylistic.** `Condenser.run()` writes its operation tree to
`path.join(process.cwd(), 'data/operationTrees', ...)` at `condenser.ts:198-199`. That path is
gitignored **inside** `packages/argument-condensation` and is **not** gitignored at the repo root, so
running this command from the root would leave an untracked `data/operationTrees/` directory and trip
the § 3.1 post-gate for a reason having nothing to do with the injection — a false hygiene failure on
top of a true verdict.

**5.2.4 Observed**

Two outcomes, recorded separately per the TWO-COLUMN RULE (§ 3.2).

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F15-B `condenserStandalone.test.ts:131-142,184-185` | `condenser.ts:205` | **PASS** (blind) | **PASS** (green) | none — the two columns agree | 0 |

Verbatim runner output, under the live injection:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/argument-condensation

 ✓ tests/condensation/condenserStandalone.test.ts (3 tests) 4ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  14:56:02
   Duration  405ms (transform 114ms, setup 142ms, collect 73ms, tests 4ms, environment 0ms, prepare 55ms)
```

Byte-for-byte the same count as the pre-injection baseline (3 passed) and the post-revert baseline
(3 passed) taken in the same session. **Collateral: none** — no test in the file changed state.
Prediction was PASS; observed PASS; **matched**.

**Positive control — the injection was live, and the blindness is specific to the `arguments`
field.** A green run only proves blindness if the break reached the module. Rather than probe the
module out of band, the control was run **in band, one line away**: `condenser.ts:204` —
`condensationType`, a sibling property of the *same return object literal* — was set to a sentinel in
its own separate HYGIENE-LOOP iteration, with the `arguments` line left untouched:

```diff
  packages/argument-condensation/src/core/condensation/condenser.ts:204
-      condensationType: this.input.options.outputType,
+      condensationType: 'positive-control-139' as unknown as CondensationRunResult['condensationType'],
```

Result — **5 of 8 tests across both F15 vehicle files went red immediately**:

```
 ❯ tests/condensation/condenserStandalone.test.ts (3 tests | 2 failed) 8ms
   × Condenser Standalone Test > It should run the complete condensation pipeline with mock data 7ms
     → expected 'positive-control-139' to be 'likertPros' // Object.is equality
   × Condenser Standalone Test > It should handle different condensation types 1ms
     → expected 'positive-control-139' to be 'likertCons' // Object.is equality
   ✓ Condenser Standalone Test > It should handle empty comments gracefully 1ms
 ❯ tests/condensation/condenseQuestions.test.ts (5 tests | 3 failed) 14ms
   × handleQuestion > It should condense arguments for both pros and cons of a likert question 8ms
     → expected [ 'positive-control-139', …(1) ] to include 'likertPros'
   × handleQuestion > It should condense arguments for a categorical question 2ms
     → expected false to be true // Object.is equality
   × handleQuestion > It should condense arguments for a boolean question 1ms
     → expected [ 'positive-control-139', …(1) ] to include 'booleanPros'
   ✓ handleQuestion > It should throw an error if invalid prompt IDs are provided 1ms
   ✓ handleQuestion > It should create visualization data when createVisualization flag is set 2ms

 Test Files  2 failed (2)
      Tests  5 failed | 3 passed (8)
```

This is a stronger control than an out-of-band probe. It establishes three things at once: the return
literal at `condenser.ts:202-206` **executes** in both files' module graph; these tests **do** red
when a field they read changes; and the blindness is therefore **specific to the `arguments`
property**, not a symptom of an unreached code path or a stale build. The control injection is not a
regression candidate and is labelled as such — Phase 142 must use § 5.2.6, not this diff.

**5.2.5 Verdict and reasoning**

`Condenser.run()` was made to throw away the entire product of condensation, and the test titled
*"It should run the complete condensation pipeline with mock data"* reported pass. Under the
injection every caller received `data: { arguments: [] }` — zero arguments, from a pipeline that had
just executed a MAP, an ITERATE_MAP and a REDUCE and billed tokens for all of them — and all three
tests in the file stayed green.

The mechanism is that the assertions read everything **around** the result except the result. Of the
nine assertions across the two blocks, `:132` and `:184` read `condensationType`, which merely echoes
back the `outputType` the test itself passed in at `:151`; `:135-139` and `:185` read `llmMetrics`,
which is accounting about the run rather than its output; and `:142` reads a spy on the mock
provider, which confirms a call happened. Not one of them touches `result.data.arguments` — verified
by the whole-file grep in § 5.2.1, which finds the token only in the mock's own input fixtures. The
test therefore certifies that the pipeline *ran*, never that it *produced* anything. The audit's
characterisation is accurate to the line, and the positive control rules out the one alternative
explanation for a green run.

The wall-clock assertion at `:137` is noted as an incidental on this verdict per CONTEXT § Specifics
and is not folded into the finding: it is a different defect (a flake-capable assertion guarding
nothing) in the same cluster, and § 5.2.6 names its disposition. Nothing in the run overturned a
prediction for this site.

**Verdict:** confirmed

**5.2.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** at
`packages/argument-condensation/src/core/condensation/condenser.ts:205`, replace
`data: { arguments: currentData as Array<Argument> },` with `data: { arguments: [] },`. In production
this is total silent failure of the package's entire purpose: `handleQuestion` returns results whose
`condensationType`, `runId`, token counts and costs are all correct and whose argument lists are
empty, so a caller rendering condensed pros and cons for a question shows nothing, having paid for
every LLM call. Today the whole `argument-condensation` suite stays green through it.

**The target Phase 142 must reach:** the assertions must read `result.data.arguments`. The audit
already names the three properties worth asserting, and the mock fixtures at
`condenserStandalone.test.ts:13-17` and `:29` make all three checkable without a live LLM:

1. **Count** — `expect(result.data.arguments.length).toBeGreaterThan(0)`, and better, the exact count
   the mock's canned response implies, so a partial-loss regression is caught as well as a total one.
2. **Non-empty `text` per argument** — `expect(result.data.arguments.every((a) => a.text.trim().length > 0)).toBe(true)`,
   which additionally catches a pipeline that returns correctly-shaped but blank arguments.
3. **Source-comment IDs map back to the input** — every argument's source ids ⊆ the ids of
   `mockComments`, which is the assertion that makes the test about *this* run's data rather than
   about any arguments at all.

Any one of the three fails under the diff above; all nine current assertions pass.

**Additionally, delete `:137` rather than keeping it.**
`expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0);` guards no behaviour — no requirement
says a mocked pipeline must take measurable wall-clock time — and it is the only assertion in the
cluster that can red for reasons unrelated to the code under test. Replacing blindness with a real
`arguments` assertion and leaving a timing assertion behind would trade a silent gap for an
intermittent one.

### 5.3 F15-C — `condenseQuestions.test.ts` (shape and type only)

> **Shared injection.** The same single edit to `Condenser.run()`'s return block is the regression for
> this record and for **F15-B (§ 5.2)**; both exercise that method. The diff in § 5.3.2 is identical
> to § 5.2.2. This record carries its own invocation and its own observed outcome.

**5.3.1 Re-read evidence**

Quoted from the live tree at `12825b479`, not re-copied from the audit. Three assertion clusters,
one per condensed question type. **No drift — all three audit cites are line-exact.**

Cluster 1, the likert question (`:139-145`), verbatim:

```ts
138    // Verify results
139    expect(results).toBeDefined();
140    expect(results).toHaveLength(2); // Should have one result for pros, one for cons
141
142    // Check that we have one of each type
143    const types = results.map((r) => r.condensationType);
144    expect(types).toContain(CONDENSATION_TYPE.LikertPros);
145    expect(types).toContain(CONDENSATION_TYPE.LikertCons);
```

Cluster 2, the categorical question (`:215-219`), verbatim:

```ts
215    expect(results).toBeDefined();
216    expect(results).toHaveLength(3); // Should have one result for 'cat1', 'cat2', and 'cat3'
217
218    // Check that all condensation results are of type PROS
219    expect(results.every((r) => r.condensationType === CONDENSATION_TYPE.CategoricalPros)).toBe(true);
```

Cluster 3, the boolean question (`:268-274`), verbatim:

```ts
268    expect(results).toBeDefined();
269    expect(results).toHaveLength(2); // Should have one result for pros, one for cons
270
271    // Check that we have one of each type
272    const types = results.map((r) => r.condensationType);
273    expect(types).toContain(CONDENSATION_TYPE.BooleanPros);
274    expect(types).toContain(CONDENSATION_TYPE.BooleanCons);
```

**What the three clusters have in common is what makes them one finding.** Every assertion is either
`toHaveLength(n)` on the **per-group result array** — how many condensation *runs* came back, which
is determined by `getAndSliceComments`'s grouping of the test's own fixture entities, not by any
run's output — or a read of `condensationType`, which echoes the type the caller requested. Not one
assertion descends into `results[n].data.arguments`. Confirmed by enumeration over the whole 407-line
file: `grep -n 'arguments'` returns hits only at `:28` and `:44` (mock provider response fixtures),
`:32` and `:48` (the word inside a `reasoning` string), and `:62`/`:148`/`:222` (the word "arguments"
in three test *titles*). **Zero assertions on argument content, in a file whose every test is titled
"It should condense arguments for …".**

**5.3.2 Injected diff**

Target `packages/argument-condensation/src/core/condensation/condenser.ts:205`, verbatim (D-04).
**This is the shared injection; § 5.2.2 (F15-B) carries the identical diff, and it was applied once
with both records' runs taken before the revert.**

```diff
  packages/argument-condensation/src/core/condensation/condenser.ts:205
-      data: { arguments: currentData as Array<Argument> },
+      data: { arguments: [] }, // INJECTED (139): discard every condensed argument
```

`handleQuestion` reaches this line through `handleBooleanQuestion` / `handleOrdinalQuestion` /
`handleCategoricalQuestion` → `runSingleCondensation` → `Condenser.run()`, so all three of this
file's condensing tests are downstream of it. The `git diff` confirmation while it was live is
recorded in § 5.2.2 and is not duplicated here.

**5.3.3 Invocation**

Verbatim, from inside the workspace — the same `cd` requirement and the same reason as § 5.2.3
(`Condenser.run()` writes `<cwd>/data/operationTrees/`, gitignored only inside the package):

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" && npx vitest run tests/condensation/condenseQuestions.test.ts
```

Here the `cd` is doubly load-bearing: the visualization test at `:331` **writes two tree files and
reads them back** (`:388-396`), so this file exercises the `process.cwd()`-relative path directly
rather than incidentally.

**5.3.4 Observed**

Two outcomes, recorded separately per the TWO-COLUMN RULE (§ 3.2).

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F15-C `condenseQuestions.test.ts:139-145,215-219,268-274` | `condenser.ts:205` | **PASS** (blind, all three clusters) | **PASS** (green) | none — the two columns agree | 0 |

Verbatim runner output, under the live injection (the `stdout`/`stderr` lines are the package's own
progress logging, kept because they are part of the record):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/argument-condensation

stderr | tests/condensation/condenseQuestions.test.ts > handleQuestion > It should create visualization data when createVisualization flag is set
Only 1 comments for question "Visualization test question" (for pro arguments). The results may not be meaningful.
Only 1 comments for question "Visualization test question" (for con arguments). The results may not be meaningful.

 ✓ tests/condensation/condenseQuestions.test.ts (5 tests) 7ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  14:56:08
   Duration  380ms (transform 114ms, setup 125ms, collect 78ms, tests 7ms, environment 0ms, prepare 44ms)
```

Byte-for-byte the same count as the pre-injection baseline (5 passed) and the post-revert baseline
(5 passed).

**Collateral: none — and this half of the prediction was overturned.** Research predicted
*"condenseQuestions likely 4/5"*, expecting the out-of-scope visualization test at `:331` to red
because it reads `prosData.nodes` back from the written tree. It did not: the file went **5/5**. The
divergence is recorded in § 8 rather than the prediction being adjusted to fit.

The reason is a two-line ordering detail in `Condenser.run()` that the prediction did not account
for. The operation tree is populated at `condenser.ts:195` by
`this.treeBuilder.setFinalArguments(currentData as Array<Argument>)` and written to disk at
`:198-199` — both **before** the `return` statement at `:202`. The injection changes only the object
literal in that `return`. So the tree on disk still contains the real arguments while the value
handed to the caller is empty, and the viz test's `expect(prosData.nodes).toBeDefined()` at `:400` is
untouched. **This makes the finding worse, not better:** not even the out-of-scope test that reads
the pipeline's own serialized output can see a `Condenser.run()` that returns nothing.

Prediction for the three F15-C sites was PASS; observed PASS; **matched**. The sub-prediction about
the viz test was FAIL-expected; observed PASS; **overturned** (§ 8.2, O-2).

**Positive control — shared with § 5.2.4 and decisive for this file too.** The control injection at
`condenser.ts:204` (`condensationType` → a sentinel) reds **three of this file's five tests** —
`:144` (`expected [ 'positive-control-139', …(1) ] to include 'likertPros'`), `:219`
(`expected false to be true`) and `:273` (`… to include 'booleanPros'`). All three of the F15-C
clusters therefore demonstrably execute the injected return literal and demonstrably red when a
property they read changes. Their green under the `arguments: []` injection is measured blindness,
not an unreached path. Full control output is in § 5.2.4.

**5.3.5 Verdict and reasoning**

Three tests, each titled *"It should condense arguments for …"*, ran a pipeline that returned zero
arguments and all three reported pass. The likert, categorical and boolean paths were each exercised
end to end through `handleQuestion` with `data: { arguments: [] }` coming back from every
`Condenser.run()`, and the file went 5/5 green — including, per § 5.3.4, the visualization test that
reads the pipeline's serialized output.

The mechanism is that the clusters assert on the **cardinality of the result array** rather than on
the **content of the results**. `toHaveLength(2)` at `:140` and `:269` and `toHaveLength(3)` at
`:216` count how many condensation runs `handleQuestion` returned — a number fixed by how the
fixture entities' answers group into pros/cons/choices in `getAndSliceComments`, entirely upstream of
condensation. The remaining assertions (`:144-145`, `:219`, `:273-274`) read `condensationType`,
which each run echoes back from the `outputType` it was given. So the suite verifies that the right
*number* of runs of the right *kind* happened, and never that any of them produced an argument. The
audit's characterisation — *"which assert only `toHaveLength(n)` plus the echoed type"* — is accurate
to the line, and its three cites are exact.

One prediction was overturned in the direction of strengthening the finding rather than weakening it
(the viz test stayed green), and it is recorded as overturned in § 8 rather than rewritten. Nothing
observed bears against the verdict.

**Verdict:** confirmed

**5.3.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** at
`packages/argument-condensation/src/core/condensation/condenser.ts:205`, replace
`data: { arguments: currentData as Array<Argument> },` with `data: { arguments: [] },` — the same
single line as § 5.2.6, since one fix must be validated against both files. In production a voter
opening a question's condensed pros and cons sees two empty lists, while every log line, token count
and cost figure reports a successful run.

**The target Phase 142 must reach:** each cluster must assert on the arguments inside the results it
already counts. Concretely, alongside the existing `toHaveLength(n)`:

1. **Every returned run carries arguments** —
   `expect(results.every((r) => r.data.arguments.length > 0)).toBe(true)`, which fails under the diff
   above at all three clusters.
2. **Argument text is non-empty** —
   `expect(results.flatMap((r) => r.data.arguments).every((a) => a.text.trim().length > 0)).toBe(true)`,
   catching a pipeline that returns shaped-but-blank arguments.
3. **Source-comment IDs map back to the input entities' comments** — the assertion that ties the
   output to *this* run's fixture data rather than to any arguments at all.

**And pair the count with a content check rather than replacing it.** `toHaveLength(2)` / `(3)` are
worth keeping — they are the only assertions that guard the pros/cons/per-choice *grouping* in
`getAndSliceComments`, which is genuine behaviour and is not what F15-C is about. The defect is that
they are the *only* thing asserted, not that they are asserted.

**Note for the visualization test at `:331`.** It is out of scope for this finding (§ 3.3), but the
§ 5.3.4 mechanism is worth carrying into any future work on it: because `setFinalArguments` runs at
`condenser.ts:195`, before the return, that test's tree-file assertions cannot detect a corrupted
return value either. If it is ever meant to guard end-to-end output, it needs an assertion on
`results[n].data.arguments`, not only on `prosData.nodes`.

### 5.4 F16 — `handleQuestion.test.ts` (bare `rejects.toThrow()`, competing throw)

> **This record carries two injections, and the audit's own one is the one that failed.** Injection A
> is the regression the audit names verbatim; it **overturned** the prediction and reds the test.
> Injection B is the § 3.4-mandated redesign that follows from that overturn; it passes blind and is
> the verdict run. Both are recorded in full. § 5.4.5 states which claims of the audit survive and
> which are refuted.

**5.4.1 Re-read evidence**

Quoted from the live tree at `12825b479`, not re-copied from the audit.
`packages/argument-condensation/tests/unit/handleQuestion.test.ts`, verbatim at the current lines —
the assertion opens at `:56` and closes at `:68`:

```ts
 56    await expect(
 57      handleQuestion({
 58        question,
 59        entities,
 60        options: {
 61          language: unsupportedLanguage,
 62          llmProvider: mockLLMProvider,
 63          runId: 'test-run',
 64          maxCommentsPerGroup: 1000,
 65          controller: noOpController
 66        }
 67      })
 68    ).rejects.toThrow();
```

Its enclosing test title at `:31`:

```ts
 31  test('It should throw an error for an unsupported language', async () => {
```

**The two supporting facts the audit rests on, re-read — and both audit cites drift.**

The mock provider. The audit cites it as "lines 19-26"; it is actually **`:19-27`** (`streamText`
closes at `:27`, and `:28` is the `as unknown as LLMProvider` cast). **Drift: +1 on the closing
line — report this.** Verbatim:

```ts
 19  generateObject: () => {
 20    throw new Error('Method not implemented.');
 21  },
 22  generateObjectParallel: () => {
 23    throw new Error('Method not implemented.');
 24  },
 25  streamText: () => {
 26    throw new Error('Method not implemented.');
 27  }
```

The empty entities array. The audit cites it as "line 53"; it is actually **`:54`**. **Drift: +1 —
report this.** Verbatim:

```ts
 54    const entities: Array<HasAnswers> = [];
```

**The competing-throw proof, quoted verbatim.**
`packages/argument-condensation/tests/unit/defineCondensationPlan.test.ts:71`:

```ts
 71    ).rejects.toThrow('There must be at least one comment to process.');
```

That throw is real and independently proven by its own passing test. The audit's inference from it —
that `handleQuestion` with `entities: []` reaches it — is what injection A tested, and it is **false**.
See § 5.4.4.

**The reachability trace, run rather than assumed.** With `entities: []`:

- `packages/argument-condensation/src/core/utils/condensation/getAndSliceComments.ts:52` iterates
  `entities.entries()` — zero iterations — so `prosComments` and `consComments` stay empty, and the
  group pushes at `:144` and `:147` are each guarded by `.length > 0`. It returns `[]` groups.
- `packages/argument-condensation/src/question-handlers.ts:30` is
  `for (const group of commentGroups) {` — zero iterations — so `runSingleCondensation` is never
  called, `createCondensationSteps` is never reached, and **the mock provider's methods are never
  invoked.** `handleBooleanQuestion` returns its empty `results` accumulator.

So after the language check there are **zero** reachable throw paths for this test's inputs, not the
"at least three" the audit asserts. The mock that throws from every method — the fact the finding is
titled for — is unreachable dead weight on this path.

**5.4.2 Injected diff**

Two injections, run in this order, each a complete HYGIENE-LOOP iteration with the tree returned to
HEAD in between. Injection A is the audit's own; injection B is the redesign § 3.4 mandates once A's
predicted PASS is overturned.

**Injection A — the audit's named regression, verbatim** (target
`packages/argument-condensation/src/api.ts:118-122`):

```diff
  packages/argument-condensation/src/api.ts:118-122
-  if (!supportedLanguages.includes(language)) {
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
-  }
+  // INJECTED (139): language validation removed
```

The `INJECTED (139)` marker **is** present here: the `+` line is a whole-line comment, so the marker
is syntactically legal and carries no risk of distorting an injected value. This is the § 3.1 step-2
convention applied rather than exempted — the contrast case to §§ 5.6.2 and 5.13.2, both of which
record an exemption.

Confirmation that injection A landed as recorded, from `git diff` taken while it was live:

```
@@ -115,11 +115,7 @@ export async function handleQuestion({
 
   // Check that the language is in supportedLocales in staticSettings
   const supportedLanguages = staticSettings.supportedLocales.map((locale) => locale.code);
-  if (!supportedLanguages.includes(language)) {
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
-  }
+  // INJECTED (139): language validation removed
 
   // Separate the comments into argumentation groups (e.g. for tax cuts vs. against tax cuts)
   const commentGroups = getAndSliceComments({
```

**Injection B — category preserved, detail varied** (target
`packages/argument-condensation/src/api.ts:119-121`):

```diff
  packages/argument-condensation/src/api.ts:119-121
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
+    throw new Error('Cannot read properties of undefined (reading tpmLimit)'); // INJECTED (139): a DIFFERENT failure's message
```

**Why B is the § 3.4-correct design, and why it was written after A rather than instead of A.** § 3.4
says a predicted-PASS injection that comes back FAIL "removed the *category* of the behaviour instead
of varying the *detail* the matcher cannot see" — a design smell, not a withdrawal. Injection A
removes the category: with the check gone, no rejection occurs at all, and `.rejects` is a perfectly
adequate oracle for *that*. Injection B keeps the rejection and the condition that triggers it, and
varies only the message — the detail a bare `.rejects.toThrow()` cannot see. Its message is modelled
on a realistic degradation: a `TypeError`-shaped crash on the `tpmLimit` read two lines above at
`:114`, i.e. the test's promise rejecting for a reason that has nothing to do with language.

**B's predicted outcome was recorded as PASS before it ran**, per the § 3.4 calibration rule. This is
the guard against the failure mode of retrying injections until one is green: A's overturn is recorded
as an overturn (§ 8), not rewritten, and B's prediction was fixed in advance and matched.

**5.4.3 Invocation**

Verbatim, from inside the workspace (D-05 — `argument-condensation` exposes no `test:unit` script, so
the run is ad hoc and in-package; no wiring was changed). The same command was used for A and for B:

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" && npx vitest run tests/unit/handleQuestion.test.ts
```

The file holds exactly one test, so the whole-file run *is* the isolated verdict run; § 3.3's
isolation step is a no-op here and no separate `-t` invocation was needed.

**5.4.4 Observed**

Two outcomes per injection, recorded separately per the TWO-COLUMN RULE (§ 3.2).

| Injection | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| **A** — check removed (audit's own) | `api.ts:118-122` | **FAIL** (caught) | **FAIL** (red) | `handleQuestion.test.ts:68` | 1 |
| **B** — message swapped (verdict run) | `api.ts:119-121` | **PASS** (blind) | **PASS** (green) | none — the two columns agree | 0 |

Verbatim runner output, **injection A**:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/argument-condensation

 ❯ tests/unit/handleQuestion.test.ts (1 test | 1 failed) 5ms
   × handleQuestion > It should throw an error for an unsupported language 5ms
     → promise resolved "[]" instead of rejecting

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/handleQuestion.test.ts > handleQuestion > It should throw an error for an unsupported language
AssertionError: promise resolved "[]" instead of rejecting

- Expected: 
Error {
  "message": "rejected promise",
}

+ Received: 
[]

 ❯ tests/unit/handleQuestion.test.ts:68:5
     66|         }
     67|       })
     68|     ).rejects.toThrow();
       |     ^
     69|   });
     70| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  14:48:07
   Duration  600ms (transform 160ms, setup 179ms, collect 119ms, tests 5ms, environment 0ms, prepare 104ms)
```

`promise resolved "[]" instead of rejecting` is the single most informative line in this record. It is
the direct experimental refutation of the audit's mechanism: with the language check removed, the call
does not merely throw something else — **it does not throw at all**, and returns the empty result
accumulator traced in § 5.4.1.

Prediction for A was PASS; observed FAIL; **overturned** — carried to § 8 unrewritten.

Verbatim runner output, **injection B** (the verdict run):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/argument-condensation

 ✓ tests/unit/handleQuestion.test.ts (1 test) 2ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  14:50:06
   Duration  532ms (transform 137ms, setup 170ms, collect 103ms, tests 2ms, environment 0ms, prepare 75ms)
```

Prediction for B was PASS; observed PASS; **matched**.

**Positive control — not needed here, and why that is a stronger position, not a weaker one.** §§ 5.6
and 5.13 each need a positive control because a green run alone cannot distinguish "the assertion is
blind" from "the injection never took effect". This record does not: injection A's **red** is itself
proof that edits to `api.ts:118-122` reach the module under test through the test's own import
specifier, since the file went from green (baseline) to red (A) to green (B) to green (post-revert
baseline) on nothing but that one file's contents. B's green is therefore a measured blindness, not an
unexecuted no-op. **Collateral: none** — the file holds one test under both injections.

**5.4.5 Verdict and reasoning**

Two of the audit's three substantive claims about F16 are refuted by execution, and the third is
confirmed. The verdict follows the third, and the record corrects the first two rather than inheriting
them.

**Refuted — the mechanism.** The audit writes: *"`entities` is `[]` (line 53) **and** the mock
`LLMProvider` (lines 19-26) throws `'Method not implemented.'` from every method. There are at least
three independent paths to a throw before language validation is reached."* There are **zero**. The
trace in § 5.4.1 shows `getAndSliceComments` returning no groups for empty entities and
`handleBooleanQuestion`'s loop never entering, so neither `createCondensationSteps` nor any mock
method is reachable on this path. The mock throwing from every method — the fact the finding is
*titled* for — is inert here.

**Refuted — the named regression.** The audit writes: *"Delete the language check entirely and this
test still passes."* It does not. Injection A is that deletion, applied verbatim, and the test went
red at `handleQuestion.test.ts:68` with `promise resolved "[]" instead of rejecting`. The test's green
does depend on the language check existing. This matters beyond bookkeeping: had Phase 142 taken the
audit's sentence as its negative control, it would have written a control that reds *before* the fix
and reds *after* it, and the remediation would have been unverifiable. § 5.4.6 replaces it.

**Confirmed — the defect the title names.** The assertion is `.rejects.toThrow()` with no matcher,
under a title that promises the rejection is *"for an unsupported language"*. Injection B keeps the
rejection and its triggering condition and changes only the message, and the test stayed green: the
assertion cannot distinguish its own invariant's rejection from a `TypeError`-shaped crash reading
`tpmLimit`. It verifies *that* the promise rejected, never *why*. The audit's suggested fix
(`.rejects.toThrow(/language/i)` plus a non-empty `entities` array) is exactly right and remains
warranted.

**Why this is not a withdrawal, stated explicitly because criterion 2 points the other way on a
careless read.** ROADMAP criterion 2 withdraws "a finding that reads blind but fails correctly", and
injection A is a case of failing correctly. But § 3.4 and RESEARCH Pitfall 2 both settle this in
advance and in general: *"for every finding whose complaint is 'the matcher is weaker than the title',
the injection must preserve the category of the failure and vary only the detail the matcher cannot
see"*, and *"a predicted FAIL is a design smell, not a withdrawal."* F16's complaint is that a bare
matcher sits under a title naming a specific cause; injection A removed the category (any rejection
at all) rather than varying the detail (which rejection). Withdrawing on A would strike from the audit
a weakness that injection B demonstrates by execution — a net loss of true information, and precisely
the spurious withdrawal § 3.3 and Pitfall 2 exist to prevent. This is the same trap as F20-6 (§ 5.15),
reached from the opposite direction: there the removal injection was foreseen and avoided, here it was
prescribed, run, and had to be corrected after the fact.

**Verdict:** confirmed

**5.4.6 Pre-specified regression for Phase 142**

**Do not use the audit's sentence as the negative control.** "Delete the language check entirely" reds
the test today (§ 5.4.4, injection A) and would therefore red both before and after any fix, proving
nothing. Phase 142 must use injection B.

**The regression (re-apply this diff verbatim):** at
`packages/argument-condensation/src/api.ts:119-121`, keep the `if (!supportedLanguages.includes(language))`
guard and replace only its thrown message:

```diff
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
+    throw new Error('Cannot read properties of undefined (reading tpmLimit)');
```

In production this is the shape of a real degradation: `handleQuestion` rejects, but for a reason that
has nothing to do with the caller's language argument — a crash on the `tpmLimit` read at `:114`, a
provider-config failure, a refactor that reroutes the guard into a generic error. Every caller-facing
diagnostic for "you passed an unsupported locale" is lost, and the one test whose title promises to
guard that message stays green through it.

**The target Phase 142 must reach:** the assertion must name the cause its title already promises.
`.rejects.toThrow(/language/i)` — or, tighter, the exact prefix `'Unsupported language: lol'` — fails
under the diff above where the bare matcher does not. Pair it with the audit's second half, a
**non-empty `entities` array**, for an independent reason this record surfaces and the audit does not:
with `entities: []` the call reaches no code past the language check at all, so the test currently
exercises five lines of `handleQuestion` and nothing else. A non-empty `entities` array makes the
language guard the *first* of several live paths rather than the only one, which is the condition
under which a message matcher is actually load-bearing.

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

> **Shared injection.** One edit to the `authorizeUrl` construction at
> `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` is the regression for both F19a and
> **F19b (§ 5.8)**, because both exercise that construction — F19a through the route handler, F19b
> through the provider directly. The diff is recorded identically in § 5.7.2 and § 5.8.2; each record
> carries its **own** invocation and its **own** observed outcome. Both runs were taken before the
> single revert.
>
> **This is the record the TWO-COLUMN RULE (§ 3.2) exists for.** The assertion outcome and the file
> outcome **diverge** here, and the verdict cites the assertion column. Read § 3.2 before reading the
> verdict.

**5.7.1 Re-read evidence**

Quoted from the live tree at `91a7e7db9`, not re-copied from the audit. `git diff --stat 12825b479 HEAD -- apps packages tests`
is empty, so the source is byte-identical to the § 2 environment stamp; this phase commits documents only.

The three-line shape at `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:141-148`,
verbatim with current line numbers:

```ts
141    // Extract the request param from the URL
142    const url = new URL(authorizeUrl);
143    const requestParam = url.searchParams.get('request');
144    expect(requestParam).toBeDefined();
145
146    // JWT has 3 dot-separated segments
147    const parts = requestParam!.split('.');
148    expect(parts).toHaveLength(3);
```

Enclosing test title, `:136`:

```ts
  it('authorizeUrl contains a signed JWT request parameter', async () => {
```

The audit's cite (`:144`) is line-exact; no drift.

**The mechanism, stated as matcher semantics.** `URLSearchParams.get()` returns `string | null` — it
returns `null`, never `undefined`, for an absent parameter. `expect(null).toBeDefined()` **passes**,
because `toBeDefined()` fails only on `undefined`. So `:144`, the assertion whose enclosing title
promises that the authorize URL *contains* a signed JWT request parameter, is **structurally incapable
of detecting its absence**. There is no input to `url.searchParams.get('request')` for which this
assertion can fail: it passes on a valid JWT, on an empty string and on a missing parameter alike.

**The route-to-provider link, observed rather than assumed.** The shared injection edits the *Idura
provider*, while this site exercises the *route handler*, so the link is evidence rather than
background. Four facts, each read from the live tree this session:

1. `authorize-endpoint.test.ts:17` imports the handler under test:
   `import { POST } from '../../../../../routes/api/oidc/authorize/+server';`
2. `authorize-endpoint.test.ts:38-40` mocks the public constants with
   `PUBLIC_IDENTITY_PROVIDER_TYPE: 'idura'`, injected through the `$lib/utils/constants` getter mock at
   `:64-68`.
3. `apps/frontend/src/routes/api/oidc/authorize/+server.ts:25-26` calls
   `const provider = getActiveProvider();` then `await provider.getAuthorizeUrl({ redirectUri, codeChallenge })`.
4. `apps/frontend/src/lib/api/utils/auth/providers/index.ts:31-34` reads
   `constants.PUBLIC_IDENTITY_PROVIDER_TYPE` and returns `iduraProvider` for `'idura'`.

The RS256 signing key pair the test generates in `beforeAll` for JAR construction confirms the same
link from the fixture side — `authorize-endpoint.test.ts:73-83`, verbatim:

```ts
73  beforeAll(async () => {
74    // Generate RS256 signing key pair for Idura JAR construction
75    const { privateKey, publicKey } = await jose.generateKeyPair('RS256', { extractable: true });
76    signingPublicKey = publicKey;
77
78    const jwk = {
79      ...(await jose.exportJWK(privateKey)),
80      kid: 'test-signing-kid',
81      alg: 'RS256'
82    };
83    mockServerConstants.IDURA_SIGNING_JWKS = JSON.stringify([jwk]);
84  });
```

The observed run in § 5.7.4 closes the link empirically as well: the injection to `idura.ts` changed
this file's outcome, which it could not have done had the route selected a different provider.

**5.7.2 Injected diff**

Target `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74`, verbatim (D-04 — Phase 142
re-applies this mechanically). **This is the shared injection; § 5.8.2 (F19b) carries the identical
diff, and it was applied once with both records' runs taken before the revert.**

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74
-      `&request=${requestObject}`;
+      ``; // INJECTED (139): the JAR request object is dropped from the authorize URL
```

The signed request object is still constructed at `:57-69`; only its delivery to the authorize URL is
removed, so the injection removes the *authentication material in transit* rather than the code that
builds it — the narrowest form of the regression the finding names. The `INJECTED (139)` marker is
present in a legal trailing comment; no exemption was needed at this site, and this is the first
injection in the phase to exercise the marker gate (§ 3.1 step 5(c)) against a real marker.

**Authentication-material handling.** This injection strips the JAR request object from a live OIDC
authorize URL. It was applied, run twice and reverted inside the task that created it; it reached no
commit, no branch and no running process, and no `yarn dev`, `yarn test:e2e` or Playwright command was
run while it was live.

Confirmation that the injection landed as recorded, from `git diff` taken while it was live:

```
@@ -71,7 +71,7 @@ export const iduraProvider: IdentityProvider = {
     const authorizeUrl =
       `https://${constants.IDURA_DOMAIN}/oauth2/authorize` +
       `?client_id=${encodeURIComponent(clientId)}` +
-      `&request=${requestObject}`;
+      ``; // INJECTED (139): the JAR request object is dropped from the authorize URL
 
     return { authorizeUrl, clientSideRedirect: false, state, nonce };
   },
```

**5.7.3 Invocation**

Verbatim, run from inside the workspace directory (D-05):

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
```

**Benign stderr, recorded rather than diagnosed.** Every run of this file — baseline and injected
alike — prints the deliberate negative-path log from the `returns 400 when redirectUri is missing`
test:

```
stderr | src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > returns 400 when redirectUri is missing
Failed to construct authorization request: HttpError { status: 400, body: { message: 'redirectUri is required' } }
```

It is present identically in both runs and therefore distinguishes neither.

**5.7.4 Observed**

Four distinct facts, per the TWO-COLUMN RULE (§ 3.2) and the plan's recording requirement. **The two
outcome columns diverge at this site** — this is the case the rule was written for, and the divergence
is what the verbatim block below makes visible rather than asserted.

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F19a `authorize-endpoint.test.ts:144` | `idura.ts:74` | **PASS** (blind — `expect(null).toBeDefined()`) | **FAIL** (red, 4 failed / 5 passed of 9) | `authorize-endpoint.test.ts:147:33` — `requestParam!.split('.')` | 1 |

1. **Assertion outcome — PASS.** The runner names `:147:33` as the failure site, not `:144`. The test
   body executes top-to-bottom, so `:144` was evaluated and did not throw: `expect(null).toBeDefined()`
   passed, exactly as the matcher semantics in § 5.7.1 require. This is read from the reported failure
   location, **not** from the exit code.
2. **File outcome — FAIL.** The file exited red.
3. **Failing line — `authorize-endpoint.test.ts:147:33`**, three lines below the assertion.
4. **Verbatim runner failure block**, pasted unedited from `${TMPDIR}/gsd-139/f19a.log`:

```
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts (9 tests | 4 failed) 73ms
   ✓ POST /api/oidc/authorize > returns 200 with an authorizeUrl in the response 6ms
   ✓ POST /api/oidc/authorize > authorizeUrl contains client_id query parameter 1ms
   × POST /api/oidc/authorize > authorizeUrl contains a signed JWT request parameter 3ms
     → Cannot read properties of null (reading 'split')
   × POST /api/oidc/authorize > JAR is signed with RS256 algorithm 1ms
     → Invalid Token or Protected Header formatting
   × POST /api/oidc/authorize > JAR payload contains required OIDC fields 1ms
     → JWTs must use Compact JWS serialization, JWT must be a string
   × POST /api/oidc/authorize > JAR signature is verifiable with the signing public key 1ms
     → Compact JWS must be a string or Uint8Array
   ✓ POST /api/oidc/authorize > sets oidc_state cookie when provider returns state 5ms
   ✓ POST /api/oidc/authorize > sets oidc_nonce cookie when provider returns nonce 2ms
   ✓ POST /api/oidc/authorize > returns 400 when redirectUri is missing 1ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > authorizeUrl contains a signed JWT request parameter
TypeError: Cannot read properties of null (reading 'split')
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:147:33
    145| 
    146|     // JWT has 3 dot-separated segments
    147|     const parts = requestParam!.split('.');
       |                                 ^
    148|     expect(parts).toHaveLength(3);
    149|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯
```

Summary line of the same run, verbatim:

```
 Test Files  1 failed (1)
      Tests  4 failed | 5 passed (9)
   Start at  15:19:15
   Duration  375ms (transform 51ms, setup 0ms, collect 77ms, tests 73ms, environment 0ms, prepare 60ms)
```

The pre-injection baseline of the same file was **9 passed**, taken this session as part of the
two-file run recorded in § 5.8.3's baseline note (22 passed across both files).

Prediction (§ 4 row 7, and `139-RESEARCH.md:604-607`) was assertion **PASS** / file **FAIL** at the
`split('.')` line with `TypeError: Cannot read properties of null (reading 'split')`; observed exactly
that, to the error string; **matched**.

**Collateral: three tests** — `:159` (`JAR is signed with RS256 algorithm`), `:171` (`JAR payload
contains required OIDC fields`) and `:192` (`JAR signature is verifiable with the signing public key`),
none of which is one of the fifteen enumerated sites. Recorded verbatim in § 8.1 as **C-2**; per § 3.3
they bear on no verdict.

**No separate positive control was needed, and none was run.** The requirement in § 3.4 and the
carried-forward wave-1..3 finding — that a green injection run needs a control to distinguish
blindness from a null experiment — applies to runs that come back **green**. This run came back
**red**, at the exact line and with the exact error the injection predicts, which is itself proof that
the edit reached the module in the process that reported `:144` green. The three collateral failures
are a second, independent liveness proof from the same run: `jose.decodeProtectedHeader`,
`jose.decodeJwt` and `jose.jwtVerify` each rejected the now-missing request parameter. Adding a
disqualified control here would add nothing this run does not already establish.

**5.7.5 Verdict and reasoning**

The JAR request object was removed from the authorize URL — in production, the entire signed
authorization request, gone — and `expect(requestParam).toBeDefined()` at `:144`, the one assertion in
the file whose title promises that parameter is present, **passed**. The file went red three lines
later, at `requestParam!.split('.')`, with a `TypeError` about `null`.

The D-02 reasoning, stated in full because this is the verdict that reading the exit code would get
wrong:

1. **The assertion is structurally incapable of detecting absence.** `URLSearchParams.get()` returns
   `string | null`; `expect(null).toBeDefined()` passes. There is no absent-parameter case that `:144`
   can fail on. That is the finding, and the run demonstrated it directly: the assertion evaluated
   against `null` and passed.
2. **The file still red-lights, but on an incidental downstream throw.** `:147` calls `.split('.')` on
   `null`. Nothing about that line was written as a guard; it is a step in extracting JWT segments that
   happens to dereference the value. The red is a side effect of the test's next operation, not the
   verdict of its assertion.
3. **The cost is diagnosis time rather than coverage.** A future maintainer who drops the request
   parameter sees `TypeError: Cannot read properties of null (reading 'split')` instead of "expected
   the request parameter to be present" — a message that points at the test's own line rather than at
   the missing authentication material. The audit anticipated exactly this and marked it
   **Mitigated** (`.planning/audits/2026-08-11-fake-guard-sweep.md:761-763`), which is why F19 is
   ranked as it is rather than higher — not why it would be withdrawn.
4. **ROADMAP criterion 2's withdrawal clause does not reach this class.** "A finding that reads blind
   but fails correctly is withdrawn" is scoped to findings whose **own assertion** catches the
   regression (CONTEXT `<specifics>` bullet 2, D-02). This assertion caught nothing; the file was
   rescued by an incidental `TypeError` on a line that is not a guard. Withdrawing here would strike a
   real matcher defect from the audit on the strength of a column — the process exit code — that was
   never measuring the assertion, and would shrink ASSERT-03 and Phase 140 (which owns the
   `.not.toBeNull()` repair) as well as ASSERT-07 and Phase 142.

The audit's characterisation is accurate to the line, its `Mitigated` paragraph is accurate to the
mechanism, and the run overturned nothing it predicted.

**Verdict:** confirmed

**5.7.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** drop the JAR request object from the authorize URL at
`apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` — `` `&request=${requestObject}`; ``
becomes `` ``; ``. In production this is an authentication failure of the first order: the authorize
URL carries only `client_id`, so every parameter that the signed request object was carrying —
`response_type`, `redirect_uri`, `scope`, `state`, `nonce`, and the RS256 signature binding them —
never reaches the IdP. Today the assertion at `:144` that claims to guard the parameter's presence
stays green through it.

**The named regression in one sentence, for Phase 142's negative control:** *the JAR request parameter
is absent from the authorize URL, and the assertion that claims to guard its presence passes.*

**The target Phase 142 must reach** — and the audit already names it correctly at
`.planning/audits/2026-08-11-fake-guard-sweep.md:765`: **`.not.toBeNull()`**. One word:

```ts
expect(requestParam).not.toBeNull();
```

This fails under the diff above at `:144` itself, with a message naming the missing parameter, instead
of at `:147` with a `TypeError` about `split`. Stronger still, and worth taking while the line is open:
`expect(requestParam).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)`, which additionally rejects an empty string
and a non-JWT value — neither of which `.not.toBeNull()` catches.

**Ownership seam, recorded so the two phases do not each wait for the other.** Phase 140 owns this
repair under **ASSERT-03** (the F3/F9/F10/F19 matcher fixes); Phase 142 owns the F19 line of
**ASSERT-07**. The same one-word diff serves both, and this record's injection is the negative control
that verifies it: it reds after the fix at `:144` and passes before it, which is the discrimination a
disqualified control cannot provide.

### 5.8 F19b — `idura.test.ts:148` (`expect(requestParam).toBeDefined()`)

> **Shared injection.** The same single edit to
> `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` is the regression for this record and
> for **F19a (§ 5.7)**; both exercise that `authorizeUrl` construction. The diff in § 5.8.2 is
> identical to § 5.7.2. This record carries its own invocation and its own observed outcome. Where
> F19a reaches the provider through the route handler, this record calls
> `iduraProvider.getAuthorizeUrl()` directly — one injection, two independent entry points, two
> verdicts.
>
> The TWO-COLUMN RULE (§ 3.2) governs this record as it governs § 5.7: the assertion and file outcomes
> diverge, and the verdict cites the assertion column.

**5.8.1 Re-read evidence**

Quoted from the live tree at `91a7e7db9`, not re-copied from the audit.
`apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:145-152`, verbatim with current line
numbers — the identical three-line shape to § 5.7.1:

```ts
145      // Extract the request parameter from the URL
146      const url = new URL(result.authorizeUrl);
147      const requestParam = url.searchParams.get('request');
148      expect(requestParam).toBeDefined();
149
150      // The request parameter should be a valid JWT (3 base64url segments)
151      const parts = requestParam!.split('.');
152      expect(parts).toHaveLength(3);
```

Enclosing test title, `:140`:

```ts
    it('includes a signed JWT request parameter in the URL', async () => {
```

The audit's cite (`:148`) is line-exact; no drift, and the audit's "identical" is accurate — the two
sites differ only in indentation (this one sits one `describe` deeper) and in how they obtain the URL:
`:141-146` calls `iduraProvider.getAuthorizeUrl({ redirectUri: … })` directly, where F19a goes through
`POST /api/oidc/authorize`.

**Mechanism, identical to § 5.7.1.** `url.searchParams.get('request')` returns `string | null`;
`expect(null).toBeDefined()` passes; `:148` cannot fail on an absent request parameter. The title
promises the URL *includes* a signed JWT request parameter and the assertion under it discriminates
nothing.

**5.8.2 Injected diff**

Target `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74`, verbatim (D-04). **This is the
shared injection; § 5.7.2 (F19a) carries the identical diff, and it was applied once with both
records' runs taken before the single revert.**

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74
-      `&request=${requestObject}`;
+      ``; // INJECTED (139): the JAR request object is dropped from the authorize URL
```

This record's entry point makes the injection *more* direct than F19a's: the test calls the injected
module's own exported method, with no route handler and no provider selection in between. The
`git diff` confirmation taken while the injection was live is recorded in § 5.7.2 and is not duplicated
here. The same authentication-material handling applies: applied, run, reverted inside the task, never
committed, no dev server or E2E run while live.

**5.8.3 Invocation**

Verbatim, run from inside the workspace directory (D-05):

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" && npx vitest run src/lib/api/utils/auth/providers/idura.test.ts
```

**Baseline for both F19a and F19b**, taken in the same session immediately before the injection:

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts src/lib/api/utils/auth/providers/idura.test.ts
```

```
 ✓ src/lib/api/utils/auth/providers/idura.test.ts (13 tests) 25ms
 ✓ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts (9 tests) 49ms

 Test Files  2 passed (2)
      Tests  22 passed (22)
   Start at  15:18:54
```

**5.8.4 Observed**

Four distinct facts, per the TWO-COLUMN RULE (§ 3.2). **The two outcome columns diverge**, as at
§ 5.7.4.

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F19b `idura.test.ts:148` | `idura.ts:74` | **PASS** (blind — `expect(null).toBeDefined()`) | **FAIL** (red, 2 failed / 11 passed of 13) | `idura.test.ts:151:35` — `requestParam!.split('.')` | 1 |

1. **Assertion outcome — PASS.** The runner names `:151:35`, not `:148`. `:148` was evaluated against
   `null` and passed. Read from the reported failure location, **not** from the exit code.
2. **File outcome — FAIL.** The file exited red.
3. **Failing line — `idura.test.ts:151:35`**, three lines below the assertion.
4. **Verbatim runner failure block**, pasted unedited from `${TMPDIR}/gsd-139/f19b.log`:

```
 ❯ src/lib/api/utils/auth/providers/idura.test.ts (13 tests | 2 failed) 36ms
   ✓ Idura provider > interface compliance (D-04) > has type property set to idura 1ms
   ✓ Idura provider > interface compliance (D-04) > implements getAuthorizeUrl as a function 0ms
   ✓ Idura provider > interface compliance (D-04) > implements exchangeCodeForToken as a function 0ms
   ✓ Idura provider > interface compliance (D-04) > implements getIdTokenClaims as a function 0ms
   ✓ Idura provider > interface compliance (D-04) > has authConfig with Idura claim mappings 0ms
   ✓ Idura provider > getAuthorizeUrl (JAR-based) > returns a URL pointing to the Idura authorize endpoint 2ms
   ✓ Idura provider > getAuthorizeUrl (JAR-based) > returns clientSideRedirect=false (Idura uses server-side JAR) 1ms
   ✓ Idura provider > getAuthorizeUrl (JAR-based) > includes a state parameter for CSRF protection 1ms
   ✓ Idura provider > getAuthorizeUrl (JAR-based) > includes a nonce parameter for replay protection 1ms
   × Idura provider > getAuthorizeUrl (JAR-based) > includes a signed JWT request parameter in the URL 3ms
     → Cannot read properties of null (reading 'split')
   ✓ Idura provider > getAuthorizeUrl (JAR-based) > includes client_id in the URL query parameters 1ms
   ✓ Idura provider > getAuthorizeUrl (JAR-based) > does NOT call global fetch (JAR is built locally, not via server endpoint) 1ms
   × Idura provider > getAuthorizeUrl (JAR-based) > signed request object contains correct claims 1ms
     → JWTs must use Compact JWS serialization, JWT must be a string

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/api/utils/auth/providers/idura.test.ts > Idura provider > getAuthorizeUrl (JAR-based) > includes a signed JWT request parameter in the URL
TypeError: Cannot read properties of null (reading 'split')
 ❯ src/lib/api/utils/auth/providers/idura.test.ts:151:35
    149| 
    150|       // The request parameter should be a valid JWT (3 base64url segm…
    151|       const parts = requestParam!.split('.');
       |                                   ^
    152|       expect(parts).toHaveLength(3);
    153|     });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯
```

Summary line of the same run, verbatim:

```
 Test Files  1 failed (1)
      Tests  2 failed | 11 passed (13)
   Start at  15:19:25
   Duration  336ms (transform 49ms, setup 0ms, collect 62ms, tests 36ms, environment 0ms, prepare 66ms)
```

Against the 13-passed baseline in § 5.8.3.

**Two green tests in this file are worth naming, because they sharpen the finding rather than
weakening it.** `returns a URL pointing to the Idura authorize endpoint` and `includes client_id in the
URL query parameters` both passed under the injection — correctly, since the injection leaves the
origin and the `client_id` query parameter intact and removes only the request object. They are the
in-file demonstration that this file's *other* URL assertions are specific to what they name; only the
`request` parameter's guard is blind.

Prediction (§ 4 row 8) was assertion **PASS** / file **FAIL** at the `split('.')` line; observed
exactly that; **matched**.

**Collateral: one test** — `:184` (`signed request object contains correct claims`, failing in
`jose.decodeJwt`), not one of the fifteen enumerated sites. Recorded verbatim in § 8.1 as **C-3**; per
§ 3.3 it bears on no verdict, and like C-2 it independently confirms the injection reached the module.

**No separate positive control was run**, for the reason given in § 5.7.4: the run came back **red at
the predicted line with the predicted error**, which establishes liveness directly. A control is
required to interpret a **green** injection run, not a red one.

**5.8.5 Verdict and reasoning**

`iduraProvider.getAuthorizeUrl()` was made to return an authorize URL with no request object at all,
and `expect(requestParam).toBeDefined()` at `:148` — inside a test titled *"includes a signed JWT
request parameter in the URL"* — **passed**. The file went red at `:151`, on `.split('.')`.

The D-02 reasoning, in full:

1. **Structurally incapable of detecting absence.** `URLSearchParams.get()` returns `string | null`,
   and `toBeDefined()` fails only on `undefined`. The run evaluated `:148` against `null` and it
   passed. No absent-parameter input exists that this assertion can fail on.
2. **Rescued by an incidental downstream throw.** `:151` dereferences the value to split JWT segments.
   It is a step in the test's extraction logic, not a guard; the red it produces is a side effect.
3. **Cost is diagnosis time rather than coverage.** The failure reads `Cannot read properties of null
   (reading 'split')` at the test's own line, not "the request parameter is missing" at the provider's.
4. **Criterion 2's withdrawal clause does not reach this class.** It is scoped to findings whose own
   assertion catches the regression (D-02, CONTEXT `<specifics>` bullet 2). This one caught nothing. A
   withdrawal here would be produced by the process exit code — a column that was never measuring the
   assertion — and would shrink ASSERT-03 and Phase 140 as well as ASSERT-07 and Phase 142.

The audit's "identical" is accurate: same matcher, same `null`-returning API, same three-line shape,
same mitigation. Nothing in the run overturned a prediction for this site.

**Verdict:** confirmed

**5.8.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** the shared one at
`apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74` — `` `&request=${requestObject}`; ``
becomes `` ``; ``. Production consequence as in § 5.7.6: the signed authorization request never reaches
the IdP, and `response_type`, `redirect_uri`, `scope`, `state`, `nonce` and the RS256 signature binding
them go with it. Today `:148` stays green through it.

**The named regression in one sentence:** *the JAR request parameter is absent from the authorize URL,
and the assertion that claims to guard its presence passes.*

**The target Phase 142 must reach:** `.not.toBeNull()` at `:148`, per the audit's own suggested fix
(`.planning/audits/2026-08-11-fake-guard-sweep.md:765`):

```ts
expect(requestParam).not.toBeNull();
```

It fails under the diff above at `:148` itself rather than at `:151`. The stronger form named in
§ 5.7.6 — `toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)` — applies here identically and additionally rejects an
empty string.

**Ownership seam:** Phase 140 owns the repair under **ASSERT-03**; Phase 142 owns the F19 line of
**ASSERT-07**. One diff, both phases. Because F19a and F19b share the injection, a Phase 140 fix
applied to only one of the two sites will still be caught: re-applying this diff reds whichever site
was left unfixed at its `split('.')` line and reds the fixed site at its own assertion, and the two are
distinguishable in the runner output by line number.

### 5.9 F19c — `token-endpoint.test.ts:167` (`expect(assertion).toBeDefined()`)

> The third F19 site, and the only one with its **own** injection (`idura.ts:102`, the token-exchange
> body) rather than the shared `:74` one. It mirrors §§ 5.7 and 5.8 in shape, and the TWO-COLUMN RULE
> (§ 3.2) governs it identically: the assertion and file outcomes diverge, and the verdict cites the
> assertion column.
>
> **Two injections were run at this site, A then B**, in separate HYGIENE-LOOP iterations. The reason
> is recorded in § 5.9.2 and is itself a finding about the injection design: the plan's mandated
> injection A does **not** produce absence at run time, so it cannot exercise the `null`-vs-`undefined`
> matcher gap that F19c names. B does. Both are recorded; the verdict rests on B, with A as
> corroboration on a second, independent axis. Precedent: § 5.4 (F16 A/B) and § 5.14 (F20-5 A/B).

**5.9.1 Re-read evidence**

Quoted from the live tree at `91a7e7db9`, not re-copied from the audit.
`apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:165-171`, verbatim with current
line numbers:

```ts
165    expect(capturedFetchBody).not.toBeNull();
166    const assertion = capturedFetchBody!.get('client_assertion')!;
167    expect(assertion).toBeDefined();
168
169    // JWT has 3 dot-separated segments
170    const parts = assertion.split('.');
171    expect(parts).toHaveLength(3);
```

Enclosing test title, `:151`:

```ts
  it('sends a valid JWT as client_assertion', async () => {
```

The audit's cite (`:167`) is line-exact; no drift.

**Mechanism one — the matcher.** `capturedFetchBody` is a `URLSearchParams`, built from the
intercepted request body by the `fetch` spy at `:115-117`
(`capturedFetchBody = new URLSearchParams(body);`). `URLSearchParams.get()` returns `string | null`,
and `expect(null).toBeDefined()` passes, so `:167` cannot detect the client assertion's absence — the
same structural blindness as §§ 5.7 and 5.8.

**Mechanism two — the test's own non-null assertion at `:166`, which the other two sites do not
carry.** `capturedFetchBody!.get('client_assertion')!` applies a TypeScript `!` to the result of
`.get()`. That is a **compile-time claim the runtime does not enforce**: TypeScript narrows the type to
`string`, so a reader (and any type-driven lint) sees a value that cannot be `null`, while at run time
the very same expression yields `null` whenever the parameter is missing. This is a **second,
independent reason the site cannot see absence**, and it compounds the first rather than duplicating
it — the matcher cannot fail on `null`, and the type system has been told `null` is impossible, so
neither layer will report what the run below demonstrates actually happens. Injection B confirmed it
empirically: under B the value at `:166` **is** `null` despite the `!`, which is why `:170` throws.

Note that `:165` — `expect(capturedFetchBody).not.toBeNull();` — is the correct matcher, applied one
line earlier to the *container* rather than to the *value*. The file already knows the idiom; `:167`
simply does not use it. That makes the repair in § 5.9.6 a one-word change to match the file's own
neighbouring line, not a new convention.

**5.9.2 Injected diff**

Two injections, run in separate HYGIENE-LOOP iterations, each reverted before the next.

**Injection A — the diff the plan mandates.** Target
`apps/frontend/src/lib/api/utils/auth/providers/idura.ts:102`, verbatim (D-04):

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:102
-        client_assertion: clientAssertion
+        client_assertion: undefined as unknown as string // INJECTED (139): the client assertion is dropped
```

**The deliberate type-safety violation, and why it is acceptable here and nowhere else.** The `+` line
casts through `unknown` to defeat the `Record<string, string>` constraint on the `URLSearchParams`
initialiser, which CLAUDE.md's "use TypeScript strictly, avoid `any`-shaped casts" rule forbids. It is
acceptable **only** because it is reverted inside the task that wrote it and never committed — the
hygiene gate is what makes the injection compliant, not an exemption from the rule. A later reader must
not take this line as a pattern: it exists to model a regression for one runner invocation, and the
POST-GATE in § 3.1 step 5 is what keeps it from becoming precedent. The same applies to the
authentication-material dimension: this injection strips the `private_key_jwt` client assertion from a
live token-exchange body, and it reached no commit, no branch and no running process. No `yarn dev`,
`yarn test:e2e` or Playwright command ran while either injection was live.

Confirmation that injection A landed as recorded, from `git diff` taken while it was live:

```
@@ -99,7 +99,7 @@ export const iduraProvider: IdentityProvider = {
         code: authorizationCode,
         redirect_uri: redirectUri,
         client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
-        client_assertion: clientAssertion
+        client_assertion: undefined as unknown as string // INJECTED (139): the client assertion is dropped
       }).toString()
     });
```

**Why injection A is insufficient on its own, established by measurement rather than by argument.**
`new URLSearchParams({ … })` built from a record **stringifies every value**, so `undefined` becomes
the four-character *string* `"undefined"` rather than an omitted key. Measured out of band, in
`${TMPDIR}/gsd-139` so nothing was written inside the repository:

```console
$ node -e "const u=new URLSearchParams({a:'x',b:undefined}); console.log('toString:',u.toString()); console.log('get(b):',JSON.stringify(u.get('b'))); console.log('get(missing):',JSON.stringify(u.get('zzz')));"
toString: a=x&b=undefined
get(b): "undefined"
get(missing): null
```

So under injection A the token request body carries `client_assertion=undefined`, `.get()` returns the
non-empty string `"undefined"`, and `:167` passes because the value is a *present but garbage* string —
**not** because of the `null`-vs-`undefined` gap the finding names. Injection A therefore varies the
detail on a different axis (malformed rather than absent) and leaves F19c's named mechanism untested.
Recorded in § 8.3 as **R-6**, not silently replaced.

**Injection B — absence, the regression F19c actually names.** Same target file, the
`client_assertion` entry deleted entirely (the alternative `139-RESEARCH.md:641` names as "or delete
the line"):

```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:101-102
-        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
-        client_assertion: clientAssertion
+        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' // INJECTED (139): the client_assertion entry is deleted entirely
```

The preceding line's trailing comma is removed because the deleted entry was last in the object
literal; the `client_assertion_type` value itself is unchanged. The `INJECTED (139)` marker rides on
that line — a deleted line cannot carry a marker, so it is placed on the line the deletion
structurally modifies, and the marker gate (§ 3.1 step 5(c)) is exercised rather than exempted.

Confirmation that injection B landed as recorded, from `git diff` taken while it was live:

```
@@ -98,8 +98,7 @@ export const iduraProvider: IdentityProvider = {
         grant_type: 'authorization_code',
         code: authorizationCode,
         redirect_uri: redirectUri,
-        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
-        client_assertion: clientAssertion
+        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' // INJECTED (139): the client_assertion entry is deleted entirely
       }).toString()
     });
```

**Phase 142 re-applies injection B**, not A. A is recorded for completeness and as the second axis of
corroboration; § 5.9.6 names B.

**5.9.3 Invocation**

Verbatim, run from inside the workspace directory (D-05), identically for the baseline and for both
injections:

```bash
cd "$(git rev-parse --show-toplevel)/apps/frontend" && npx vitest run src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
```

**Baseline**, taken this session immediately before injection A:

```
 ✓ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts (10 tests) 63ms

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  15:23:50
```

**Benign stderr, recorded rather than diagnosed.** This file exercises deliberate negative paths — the
mocked `id_token` cannot be decrypted, so `getIdTokenClaims` fails and the handler returns 401 — and
every run prints, once per such test:

```
stderr | src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Signicat - client_secret) > sends client_secret in the token request body
Token exchange failed: HttpError { status: 401, body: { message: 'Unauthorized' } }
```

**Count correction, recorded rather than restated.** The plan anticipated these ×3; the observed count
is **×10 in the baseline** (one per test, since every test drives the handler through the same failing
claims extraction) and ×10 under each injection. They are present identically in all three runs and
therefore distinguish none of them. Not a symptom of either injection; not investigated further.

**5.9.4 Observed**

Four distinct facts per injection, per the TWO-COLUMN RULE (§ 3.2). **The two outcome columns diverge
under both injections**, and they diverge *differently*, which is why both rows are kept.

| Injection | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| **B — absence** (the verdict-bearing run) | `idura.ts:101-102` (entry deleted) | **PASS** (blind — `expect(null).toBeDefined()`) | **FAIL** (red, 4 failed / 6 passed of 10) | `token-endpoint.test.ts:170:29` — `assertion.split('.')` | 1 |
| **A — malformed value** (corroboration) | `idura.ts:102` (`undefined as unknown as string`) | **PASS** (blind — on the string `"undefined"`) | **FAIL** (red, 4 failed / 6 passed of 10) | `token-endpoint.test.ts:171:19` — `expect(parts).toHaveLength(3)` | 1 |

**Injection B — the four facts.**

1. **Assertion outcome — PASS.** The runner names `:170:29`, not `:167`. The test body executes
   top-to-bottom, so `:167` was evaluated and did not throw: `expect(null).toBeDefined()` passed.
   Read from the reported failure location, **not** from the exit code. This also confirms mechanism
   two from § 5.9.1 empirically — the `!` at `:166` did not prevent `null` from reaching `:170`.
2. **File outcome — FAIL.** The file exited red.
3. **Failing line — `token-endpoint.test.ts:170:29`**, three lines below the assertion.
4. **Verbatim runner failure block**, pasted unedited from `${TMPDIR}/gsd-139/f19c.log`:

```
 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts (10 tests | 4 failed) 56ms
   ✓ POST /api/oidc/token (Idura - private_key_jwt) > sends client_assertion_type=jwt-bearer to the token endpoint 29ms
   × POST /api/oidc/token (Idura - private_key_jwt) > sends a valid JWT as client_assertion 4ms
     → Cannot read properties of null (reading 'split')
   × POST /api/oidc/token (Idura - private_key_jwt) > client assertion has RS256 algorithm in header 2ms
     → Invalid Token or Protected Header formatting
   × POST /api/oidc/token (Idura - private_key_jwt) > client assertion has correct iss, sub, aud claims 2ms
     → JWTs must use Compact JWS serialization, JWT must be a string
   × POST /api/oidc/token (Idura - private_key_jwt) > client assertion has exp within 5 minutes and a jti 1ms
     → JWTs must use Compact JWS serialization, JWT must be a string
   ✓ POST /api/oidc/token (Idura - private_key_jwt) > does NOT include client_secret in the token request 1ms
   ✓ POST /api/oidc/token (Signicat - client_secret) > sends client_secret in the token request body 1ms
   ✓ POST /api/oidc/token (Signicat - client_secret) > sends client_id in the token request body 0ms
   ✓ POST /api/oidc/token (Signicat - client_secret) > sends code_verifier in the token request body (PKCE) 0ms
   ✓ POST /api/oidc/token (Signicat - client_secret) > does NOT include client_assertion in the token request 0ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > sends a valid JWT as client_assertion
TypeError: Cannot read properties of null (reading 'split')
 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:170:29
    168| 
    169|     // JWT has 3 dot-separated segments
    170|     const parts = assertion.split('.');
       |                             ^
    171|     expect(parts).toHaveLength(3);
    172|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯
```

Summary line of the same run, verbatim:

```
 Test Files  1 failed (1)
      Tests  4 failed | 6 passed (10)
   Start at  15:24:38
   Duration  333ms (transform 44ms, setup 0ms, collect 45ms, tests 56ms, environment 0ms, prepare 74ms)
```

**Injection A — the four facts.**

1. **Assertion outcome — PASS**, but for a different reason: the value was the non-empty string
   `"undefined"`, so `toBeDefined()` passed trivially. This tests the assertion's blindness to a
   *malformed* value, not to an *absent* one.
2. **File outcome — FAIL.**
3. **Failing line — `token-endpoint.test.ts:171:19`** — the `toHaveLength(3)` assertion, **one line
   further along than under B**, because `"undefined".split('.')` returns a one-element array instead
   of throwing.
4. **Verbatim runner failure block**, pasted unedited from `${TMPDIR}/gsd-139/f19c-injA.log`:

```
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > sends a valid JWT as client_assertion
AssertionError: expected [ 'undefined' ] to have a length of 3 but got 1

- Expected
+ Received

- 3
+ 1

 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:171:19
    169|     // JWT has 3 dot-separated segments
    170|     const parts = assertion.split('.');
    171|     expect(parts).toHaveLength(3);
       |                   ^
    172|   });
    173| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/4]⎯
```

**What the two injections establish together, and neither establishes alone.** Under B the assertion
is blind to **absence** (the finding as named). Under A it is blind to a **present-but-garbage value**
(a defect the finding does not name, and which `.not.toBeNull()` would also miss — see § 5.9.6). The
pair also shows the injections are genuinely discriminating rather than producing one generic red: the
same site fails at `:170` under one and at `:171` under the other, with different error classes, both
downstream of an assertion that passed in both runs.

Prediction (§ 4 row 9, and `139-RESEARCH.md:640-643`) was assertion **PASS** / file **FAIL** at the
`split('.')` line; observed exactly that under injection B, to the error string; **matched**. The
prediction was made against an injection that produces absence, which is B; A's divergence from it is a
property of A's design, recorded as R-6 in § 8.3, and is not an overturned prediction.

**Collateral: three tests** under each injection — `:189` (`client assertion has RS256 algorithm in
header`), `:208` (`client assertion has correct iss, sub, aud claims`) and `:230` (`client assertion
has exp within 5 minutes and a jti`), none of which is one of the fifteen enumerated sites. Recorded
verbatim in § 8.1 as **C-4**; per § 3.3 they bear on no verdict.

**No separate positive control was run**, for the reason given in § 5.7.4: both runs came back **red**,
at the predicted line and with the predicted error under B, which establishes directly that the edit
executed in the process that reported `:167` green. The three collateral failures are a second liveness
proof from the same run, and the six passing tests — including the two Signicat tests, which do not
touch the Idura token body — show the reds are specific to the injected path rather than a whole-file
breakage.

**5.9.5 Verdict and reasoning**

The `private_key_jwt` client assertion was deleted from the token-exchange request body — in
production, the *entire* means by which this client authenticates to the Idura token endpoint — and
`expect(assertion).toBeDefined()` at `:167`, inside a test titled *"sends a valid JWT as
client_assertion"*, **passed**. The file went red three lines later at `assertion.split('.')` with a
`TypeError` about `null`.

The D-02 reasoning, in full:

1. **Structurally incapable of detecting absence, on two independent layers.** `URLSearchParams.get()`
   returns `string | null` and `toBeDefined()` fails only on `undefined`, so the matcher cannot fail on
   a missing parameter; and `:166`'s `!` tells the type system the value cannot be `null`, so nothing
   in the type layer flags the gap either. Injection B evaluated `:167` against an actual `null` and it
   passed. Injection A additionally showed the assertion is blind to a present-but-garbage value, so
   the site discriminates neither absence nor malformation.
2. **Rescued by an incidental downstream throw.** `:170` dereferences the value to split JWT segments.
   It is a step in the test's extraction logic, not a guard; the red is a side effect of the next
   operation. Under injection A even that rescue shifts — the file survives to `:171` and fails on a
   length mismatch instead.
3. **The cost is diagnosis time rather than coverage.** A maintainer who drops the client assertion
   sees `TypeError: Cannot read properties of null (reading 'split')` pointing at the test's own line,
   rather than a message naming the missing authentication material at the provider. The audit
   anticipated this and marked it **Mitigated**
   (`.planning/audits/2026-08-11-fake-guard-sweep.md:761-763`).
4. **ROADMAP criterion 2's withdrawal clause does not reach this class.** It is scoped to findings
   whose **own assertion** catches the regression (D-02, CONTEXT `<specifics>` bullet 2). This
   assertion caught nothing. Reading the process exit code here — the column that says FAIL — would
   withdraw a real matcher defect and shrink ASSERT-03 and Phase 140 (which owns the `.not.toBeNull()`
   repair) as well as ASSERT-07 and Phase 142.

The audit's characterisation is accurate to the line. Nothing in either run overturned a prediction for
this site; the one design divergence is injection A's, and it is recorded as R-6 rather than folded
into the verdict.

**Verdict:** confirmed

**5.9.6 Pre-specified regression for Phase 142**

**The regression (re-apply injection B verbatim — not injection A):** delete the `client_assertion`
entry from the token-exchange body at
`apps/frontend/src/lib/api/utils/auth/providers/idura.ts:101-102`, removing the preceding line's
trailing comma. In production this is a total authentication failure at the token endpoint: the
request carries `client_assertion_type=…jwt-bearer` while carrying no assertion, so Idura rejects the
exchange and no user can complete bank authentication. Today the assertion at `:167` that claims to
guard the assertion's presence stays green through it.

**The named regression in one sentence, for Phase 142's negative control:** *the client assertion is
absent from the token request body, and the assertion that claims to guard its presence passes.*

**Do not use injection A as the negative control.** `client_assertion: undefined as unknown as string`
serialises to the literal string `"undefined"` rather than omitting the key (§ 5.9.2), so it models a
malformed assertion rather than a missing one and does not exercise the `null` path this finding is
about. It is recorded in § 8.3 as R-6 for exactly this reason.

**The target Phase 142 must reach** — the audit already names it at
`.planning/audits/2026-08-11-fake-guard-sweep.md:765`: **`.not.toBeNull()`**, matching the idiom the
same file already uses one line earlier at `:165`:

```ts
const assertion = capturedFetchBody!.get('client_assertion');
expect(assertion).not.toBeNull();
```

Drop the trailing `!` at `:166` as part of the same edit — keeping it re-asserts at the type level the
very thing the new matcher is there to check at run time, and would leave the file claiming a guarantee
its own assertion exists to verify. This fails under injection B at `:167` itself, naming the missing
parameter, instead of at `:170` with a `TypeError` about `split`.

**Take the stronger form here, because `.not.toBeNull()` alone does not close what injection A found.**
`expect(assertion).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)` fails under **both** injections — under B
because `null` is not a string, and under A because `"undefined"` is not a three-segment JWT. It is the
only form of this repair that covers both axes this record measured, and it subsumes `:171`'s
`toHaveLength(3)`.

**Ownership seam:** Phase 140 owns the repair under **ASSERT-03** (the F3/F9/F10/F19 matcher fixes);
Phase 142 owns the F19 line of **ASSERT-07**. One diff serves both, and injection B is the negative
control that verifies it — it reds after the fix at `:167` and passes before it.

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

The audit names **two distinct blind spots** on this one file — vacuity when the parse returns an empty
array, and blindness to a *wrong* ID being propagated — so this record carries **two** injected diffs,
two invocations and two observed outcomes under one verdict. They were run as two complete, separate
HYGIENE-LOOP iterations; neither was ever live while the other was.

**5.14.1 Re-read evidence**

The file is twelve lines. Quoting it entirely is cheaper than excerpting it, and the **absence** of a
length guard is the finding — an excerpt could not show an absence. Verbatim from the live tree at
`12825b479`, `packages/data/src/objects/nominations/variants/variants.test.ts:1-12`:

```ts
 1  import { expect, test } from 'vitest';
 2  import { parseNominationTree } from './variants';
 3  import { getTestData } from '../../../testUtils';
 4
 5  test('ParseNominationTree should insert election and constituencyId to all items', () => {
 6    const tree = getTestData().nominations;
 7    const nominationData = parseNominationTree(tree);
 8    nominationData.forEach((d) => {
 9      expect(d.electionId).toBeDefined();
10      expect(d.constituencyId).toBeDefined();
11    });
12  });
```

The audit's cite (`:5-12`) is line-exact; no drift. **That is the whole file** — one import block, one
`test`, two assertions.

**The two assertions at `:9` and `:10` sit inside a `forEach` callback, and nothing anywhere in the
file asserts that `nominationData` is non-empty.** There is no `expect(nominationData.length).toBeGreaterThan(0)`,
no `toHaveLength(n)`, no `expect(nominationData).not.toHaveLength(0)` — the twelve lines above are
exhaustive. `[].forEach(cb)` invokes `cb` zero times, so on an empty array the test body executes
**zero assertions** and vitest counts a zero-assertion test as passing. The title —
*"ParseNominationTree should insert election and constituencyId to all items"* — is vacuously true of
no items.

The second blind spot is in the matcher rather than the loop. `toBeDefined()` asserts only
`!== undefined`. It cannot distinguish the correct election id from any other non-`undefined` value:
not a wrong id, not an empty string, not `null`, not a number.

The code under test, verbatim from `packages/data/src/objects/nominations/variants/variants.ts:93-107`:

```ts
 93  export function parseNominationTree(tree: NominationVariantTree): Array<AnyNominationVariantPublicData> {
 94    const nominations = new Array<AnyNominationVariantPublicData>();
 95    for (const electionId in tree) {
 96      for (const constituencyId in tree[electionId]) {
 97        nominations.push(
 98          ...tree[electionId][constituencyId].map((n) => ({
 99            ...n,
100            electionId,
101            constituencyId
102          }))
103        );
104      }
105    }
106    return nominations;
107  }
```

Fifteen lines, two `for…in` loops and one shorthand spread. The `electionId` and `constituencyId`
shorthand properties at `:100-101` are the *only* product behaviour the test claims to guard — that the
loop variables are attached to every parsed nomination. Research cited this block as `:93-101`; the
function in fact runs to `:107`, and the shorthand entries are at `:100` and `:101` exactly as
researched. **No drift at the injection targets.**

**5.14.2 Injected diff**

Two diffs, both one-liners, applied and reverted independently (D-04 — Phase 142 re-applies each
mechanically).

**INJECTION A — vacuity.** Target `packages/data/src/objects/nominations/variants/variants.ts:94`,
inserting a line immediately after the function opens at `:93`:

```diff
  packages/data/src/objects/nominations/variants/variants.ts:94
+  return []; // INJECTED (139): the parse yields nothing
```

Confirmation that it landed as recorded, from `git diff` taken while it was live:

```
@@ -91,6 +91,7 @@ type WithoutElAndCoId<TType extends EntityType> = Omit<
  * Parse a `NominationVariantTree` into an array of `NominationVariantPublicData`.
  */
 export function parseNominationTree(tree: NominationVariantTree): Array<AnyNominationVariantPublicData> {
+  return []; // INJECTED (139): the parse yields nothing
   const nominations = new Array<AnyNominationVariantPublicData>();
   for (const electionId in tree) {
     for (const constituencyId in tree[electionId]) {
```

This is a **category-varying** injection, not a category-removing one (§ 3.4): the function still
exists, still has its signature, still returns an `Array<AnyNominationVariantPublicData>` and still
type-checks. Only its *contents* change — from every parsed nomination to none. The remaining lines
`:95-107` become unreachable; vitest does not type-check, and `tsc`'s unreachable-code diagnostic is a
warning rather than an error, so nothing outside the assertions could have reported this.

**INJECTION B — wrong ID.** Target `packages/data/src/objects/nominations/variants/variants.ts:100`,
applied **only after** injection A's post-gate was clean:

```diff
  packages/data/src/objects/nominations/variants/variants.ts:100
-          electionId,
+          electionId: 'WRONG-ELECTION-ID', // INJECTED (139): a defined but incorrect id
```

Confirmation, from `git diff` taken while it was live:

```
@@ -97,7 +97,7 @@ export function parseNominationTree(tree: NominationVariantTree): Array<AnyNomin
       nominations.push(
         ...tree[electionId][constituencyId].map((n) => ({
           ...n,
-          electionId,
+          electionId: 'WRONG-ELECTION-ID', // INJECTED (139): a defined but incorrect id
           constituencyId
         }))
       );
```

Also category-varying, and deliberately so: the property is still **present** and still a `string`, so
the shape the test's matcher inspects is untouched. Only the *value* is wrong. This is the narrowest
possible break of the exact behaviour the title promises — "insert election … to all items" — while
leaving `toBeDefined()`'s only predicate satisfied.

**Marker convention:** both `+` lines carry the `INJECTED (139)` marker in legal trailing comments; no
exemption was needed at either site.

**5.14.3 Invocation**

The same command for both injections, for the control, and for both baselines — verbatim, run from
inside the workspace directory (D-05 — the run is ad hoc and in-package; no `test:unit` script was
added and neither `turbo.json` nor `vitest.workspace.ts` was touched):

```bash
cd "$(git rev-parse --show-toplevel)/packages/data" && npx vitest run src/objects/nominations/variants/variants.test.ts
```

The site is isolated by construction — it is the only test in the file — so § 3.3's isolation
provision needs no `-t` filter here, and the file run *is* the site run.

**5.14.4 Observed**

Two outcomes recorded separately for **each** injection, per the TWO-COLUMN RULE (§ 3.2).

| Injection | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| **A — vacuity** | `variants.ts:94` (`return []`) | **PASS** (vacuous — zero assertions executed) | **PASS** (green, 1/1) | none | 0 |
| **B — wrong ID** | `variants.ts:100` (`'WRONG-ELECTION-ID'`) | **PASS** (blind — assertions executed and satisfied) | **PASS** (green, 1/1) | none | 0 |

The two `PASS`es in the assertion column are **not the same fact**, and collapsing them would lose the
finding. Under **A** the assertions at `:9-10` never ran at all; under **B** they ran, evaluated
`'WRONG-ELECTION-ID'` and were satisfied by it. Vacuity and blindness are different defects that this
one matcher exhibits at once.

**A — vacuity. Verbatim runner output under the live injection:**

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/data

 ✓ src/objects/nominations/variants/variants.test.ts (1 test) 1ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  15:09:56
   Duration  555ms (transform 166ms, setup 0ms, collect 244ms, tests 1ms, environment 0ms, prepare 80ms)
```

Prediction was PASS (green); observed PASS; **matched**. **Collateral: none.**

**B — wrong ID. Verbatim runner output under the live injection:**

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/data

 ✓ src/objects/nominations/variants/variants.test.ts (1 test) 2ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  15:10:11
   Duration  669ms (transform 197ms, setup 0ms, collect 335ms, tests 2ms, environment 0ms, prepare 88ms)
```

Prediction was PASS (green); observed PASS; **matched**. **Collateral: none.** Both runs report
byte-identical counts to the pre-injection baseline (1 passed, 15:09:46) and the post-revert baseline
(1 passed, 15:11:03) taken in the same session.

**IN-BAND POSITIVE CONTROL — required, because both injection runs were green.**

Two green runs cannot by themselves distinguish *"the assertions are blind"* (the finding) from *"the
injections never took effect"* (a null experiment) — and here the risk is sharper than usual, because
injection A's green is *supposed* to mean "zero assertions ran", which is observationally identical to
"the test never ran". Per the pattern plan 02 established at `condenser.ts:204`, the control breaks the
**same property in the same object literal** as injection B, differing only in the one respect the
matcher can see:

```diff
  packages/data/src/objects/nominations/variants/variants.ts:100
-          electionId,
+          electionId: undefined, // INJECTED (139): positive control — the id is absent rather than merely wrong
```

Observed — **red**, at exactly the assertion under test:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/data

 ❯ src/objects/nominations/variants/variants.test.ts (1 test | 1 failed) 3ms
   × ParseNominationTree should insert election and constituencyId to all items 3ms
     → expected undefined to be defined

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/objects/nominations/variants/variants.test.ts > ParseNominationTree should insert election and constituencyId to all items
AssertionError: expected undefined to be defined
 ❯ src/objects/nominations/variants/variants.test.ts:9:26
      7|   const nominationData = parseNominationTree(tree);
      8|   nominationData.forEach((d) => {
      9|     expect(d.electionId).toBeDefined();
       |                          ^
     10|     expect(d.constituencyId).toBeDefined();
     11|   });
 ❯ src/objects/nominations/variants/variants.test.ts:8:18

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  15:10:22
   Duration  763ms (transform 234ms, setup 0ms, collect 354ms, tests 3ms, environment 0ms, prepare 124ms)
```

This one run discharges the null-experiment risk for **both** injections, and it does so more sharply
than an out-of-band probe could:

1. **Liveness.** `variants.ts` is in this test's import graph and `parseNominationTree` executes; the
   `.map()` callback at `:98-102` runs; there is no stale build and no `dist/` shadow.
2. **The array is non-empty in the un-injected code.** The failure is reported *from inside* the
   `forEach` callback (the stack shows `:9:26` called from `:8:18`), which is only reachable if
   `nominationData` had at least one element. **This is what makes injection A's green
   interpretable**: without it, "1 passed" under `return []` is equally consistent with the test
   passing vacuously and with the test never having asserted anything in the first place. It did assert,
   on real data, and stopped only because the data became empty.
3. **`toBeDefined()` at `:9` does fire.** The matcher is not inert; it fails, loudly and at the right
   line, on the one input it can see.
4. **The blindness is exactly `undefined`-shaped.** Control and injection B are the same line, the same
   property, one keystroke apart in intent — `undefined` versus `'WRONG-ELECTION-ID'`. The suite guards
   the **presence** of an election id and is blind to its **correctness**, which is the whole of the
   audit's second claim in one line.

The control was reverted and its own POST-GATE run before the post-revert baseline. It is a control,
not a regression candidate: `electionId: undefined` reds before *and* after any fix to the assertions,
so Phase 142 must not use it as a negative control (§ 8.3, R-5) — the same disqualification that
removed the audit's F16 sentence from § 5.4.6.

**5.14.5 Verdict and reasoning**

One verdict, two observations, and each observation supports a different one of the audit's two named
blind spots.

**Observation A supports the vacuity claim** — *"vacuous if the parse returns `[]` (no length guard in
the file)"*. With `parseNominationTree` returning an empty array — total failure of the function the
test is named for, and in production a voter app with no nominations at all in any election or
constituency — the file reported `1 passed`. The mechanism is `Array.prototype.forEach`, which invokes
its callback once per element and therefore zero times on an empty array: the two assertions at `:9-10`
were never evaluated, and vitest treats a test that completes without a thrown assertion as passing
whether or not it asserted anything. The audit's parenthetical is precise and was checked rather than
taken on trust — the twelve lines quoted in § 5.14.1 are the entire file, and none of them constrains
the array's length.

**Observation B supports the wrong-ID claim** — *"also blind to the *wrong* ID being propagated"*. With
every parsed nomination carrying `electionId: 'WRONG-ELECTION-ID'` instead of the key it was found
under — in production, every nomination misattributed to a nonexistent election, which is precisely the
"insert election … to all items" behaviour the title promises — the file again reported `1 passed`.
Here the assertions **did** run: the in-band control proves the array is non-empty and proves `:9` is
capable of failing. `toBeDefined()`'s predicate is `!== undefined`, and `'WRONG-ELECTION-ID'` satisfies
it exactly as `'election-1'` would. The matcher is structurally incapable of distinguishing the
correct id from any other string.

Neither observation triggers ROADMAP criterion 2's withdrawal condition. The site does not "read blind
but fail correctly" — it reads blind and passes blind, twice, on two independent breaks, with a control
demonstrating that it can fail when the one thing it checks is removed. And neither injection is a
category-removal of the § 3.4 kind: both leave the function, its signature, its return type and (in B)
the property itself in place, varying only the detail the matcher cannot see. The audit's row is
accurate to the line, its two claims are separately established, and there is nothing here to withdraw.

**Verdict:** confirmed

**5.14.6 Pre-specified regression for Phase 142**

**Two regressions, not one** — the file has two independent defects and closing one does not close the
other. A remediation that adds a length guard still passes injection B; a remediation that tightens the
matcher still passes injection A.

**Regression A — vacuity (re-apply this diff verbatim):** insert `return [];` as the first statement of
`parseNominationTree` at `packages/data/src/objects/nominations/variants/variants.ts:94`. In production
this empties every nomination list in the application: `@openvaa/data` is consumed by the frontend, so
no candidate or party would appear under any election or constituency in the voter app. Today
`variants.test.ts` stays green through it, executing zero assertions.

**The target Phase 142 must reach:** a **length guard**, asserted *before* the loop, so the loop's
assertions cannot be skipped silently. The minimal sufficient form is
`expect(nominationData.length).toBeGreaterThan(0);` between the current `:7` and `:8`. The stronger form
— preferable because it also pins the fixture, and the one this document recommends — is
`expect(nominationData).toHaveLength(<n>);` with the exact count `getTestData().nominations` yields, so
a parse that silently drops *some* nominations fails too, not only one that drops all of them. Either
form fails under regression A; the current file does not.

**Regression B — wrong ID propagated (re-apply this diff verbatim):** replace the shorthand
`electionId,` at `packages/data/src/objects/nominations/variants/variants.ts:100` with
`electionId: 'WRONG-ELECTION-ID',`. In production every nomination is attributed to an election that
does not exist, so nominations resolve against no election and vanish from the app just as completely as
under regression A — but through a path that leaves the data *shaped* correctly, which is the harder
failure to notice. Today the assertion at `:9` evaluates the wrong value and passes.

**The target Phase 142 must reach:** **equality assertions on the specific expected ids**, replacing
`toBeDefined()`. Concretely, assert that each parsed nomination's `electionId` and `constituencyId` are
the keys it was found under — e.g. build the expected `(electionId, constituencyId)` pairs from
`getTestData().nominations` and assert `expect(nominationData).toEqual(expect.arrayContaining([…]))`,
or at minimum assert each id is a member of `Object.keys(tree)` / `Object.keys(tree[electionId])`
rather than merely defined. Either form fails under regression B; `toBeDefined()` does not.

**Do not use `electionId: undefined` as the negative control** (§ 8.3, R-5). It reds today, before any
fix, so it cannot verify the remediation — it verifies only that the file was already running.

### 5.15 F20-6 — `planValidation.test.ts:104` (bare `toThrow()` among seven message matchers)

**5.15.1 Re-read evidence**

Quoted from the live tree at `12825b479`, not re-copied from the audit.
`packages/argument-condensation/tests/unit/planValidation.test.ts:99-105`, verbatim — the site is
`:104` and its title is `:99`:

```ts
 99  test('It should throw if a final map step would produce multiple batches', () => {
100    const steps: Array<ProcessingStep> = [
101      createStep(CondensationOperations.REDUCE, { denominator: 10 }),
102      createStep(CondensationOperations.MAP, { batchSize: 1 }) // Invalid use of map
103    ];
104    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow();
105  });
```

The audit's cite (`:104`) is line-exact; no drift.

**The contrast that *is* the finding**, quoted verbatim — the immediately preceding sibling at
`:89-97`, which asserts the same call in the same file and *does* pin the message:

```ts
 89  test('It should throw if the pipeline does not result in a single list', () => {
 90    const steps: Array<ProcessingStep> = [
 91      createStep(CondensationOperations.MAP, { batchSize: 10 }), // produces 10 lists for 100 comments
 92      createStep(CondensationOperations.REDUCE, { denominator: 5 }) // reduces 10 lists to 2 lists
 93    ];
 94    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow(
 95      'Pipeline must end with a single list, but ends with listOfLists in 2 batch(es)'
 96    );
 97  });
```

**The audit's "other 7 tests all use message matchers" is exact, and was counted rather than
trusted.** The file holds 10 tests. Enumerated by `grep -n 'toThrow' tests/unit/planValidation.test.ts`:
two `.not.toThrow()` success paths (`:34`, `:42`); seven with message matchers (`:49`, `:55`, `:65`,
`:72`, `:78`, `:86`, `:94`); and one bare — `:104`, the site. Seven against one, in a file whose own
convention is unambiguous.

**Which invariant `:104` actually trips, traced against the live source.** Steps are
`[REDUCE(denominator: 10), MAP(batchSize: 1)]` at `commentCount: 100`. `createStep` injects every
required prompt id, so per-step parameter validation passes. Then in `validatePipelineOutputs`:

- `planValidation.ts:156-160` (REDUCE): `batchCount = Math.ceil(1 / 10) = 1`, `structure = 'list'`.
- `planValidation.ts:146-150` (MAP): `batchCount = Math.ceil(100 / 1) = 100`, and since
  `batchCount > 1`, `structure = 'listOfLists'`.
- `planValidation.ts:168-169`: `structure !== 'list'`, so the final structure check throws.

So `:104`'s green comes from the **pipeline-output-shape** invariant at `:169` — the *same* invariant
the sibling at `:94-96` pins by message. Two tests, one invariant, one of them able to say so.

**5.15.2 Injected diff**

**REJECTED design, recorded rather than silently omitted — deleting the `:169` throw.** The obvious
reading of "break the behaviour the test claims to assert" is "remove it": drop the `throw` at
`planValidation.ts:169` and let `validatePipelineOutputs` return normally. The test then goes **RED**,
and under a naive application of ROADMAP criterion 2 ("a finding that reads blind but fails correctly
is withdrawn") that red would **withdraw a valid finding**. It is rejected because the red is produced
by the wrong thing: the test fails only because *no* throw occurred at all, and "no throw at all" is
not the regression F20-6 names. F20-6's complaint is **message discrimination** — that this site
cannot tell its own invariant from the seven its siblings pin. A removal injection cannot measure
discrimination, because it destroys the thing to be discriminated. This design was considered,
written down, and not run.

**ACCEPTED design — the throw is preserved and only its message changes** (target
`packages/argument-condensation/src/core/utils/condensation/planValidation.ts:169`, verbatim — D-04):

```diff
  packages/argument-condensation/src/core/utils/condensation/planValidation.ts:169
-    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
+    throw new Error('refine can only be followed by ground'); // INJECTED (139): a DIFFERENT invariant's message
```

The `INJECTED (139)` marker is present: the `+` line is a statement with room for a trailing comment
that alters neither the thrown value nor the control flow, so § 3.1 step 2 applies rather than
exempts.

**The substituted message is not arbitrary.** `'refine can only be followed by ground'` is the live,
verbatim message of a genuinely different invariant in the *same module* —
`planValidation.ts:110`, inside `validateStepFlow` — and it is the message the sibling test at `:86`
pins. The injection therefore simulates the precise confusion the finding predicts: one invariant's
failure wearing another invariant's label, both of them real and both of them in this file's own test
suite.

This is the general rule for every finding whose complaint is "the matcher is weaker than its title":
**preserve the category of the failure, vary only the invisible detail.** § 5.4 is this rule applied
after the fact, when the audit's own prescribed injection turned out to remove the category instead.

Confirmation that the injection landed as recorded, from `git diff` taken while it was live:

```
@@ -166,6 +166,6 @@ function validatePipelineOutputs(steps: Array<ProcessingStep>, commentCount: num
   }
 
   if (structure !== 'list') {
-    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
+    throw new Error('refine can only be followed by ground'); // INJECTED (139): a DIFFERENT invariant's message
   }
 }
```

**5.15.3 Invocation**

Two runs under the same live injection. Per the COLLATERAL RULE (§ 3.3) the isolated run is the
**verdict run** and the whole-file run is the **collateral record**; only the first bears on the
verdict.

**The verdict run** — isolated to the site:

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" && npx vitest run tests/unit/planValidation.test.ts -t 'It should throw if a final map step would produce multiple batches'
```

**The collateral record** — whole-file, the invocation the plan names verbatim:

```bash
cd "$(git rev-parse --show-toplevel)/packages/argument-condensation" && npx vitest run tests/unit/planValidation.test.ts
```

**5.15.4 Observed**

Two outcomes, recorded separately per the TWO-COLUMN RULE (§ 3.2). Here the columns **diverge across
runs**, which is exactly the situation the rule exists for: the file exits red while the site's own
assertion passes, and a single merged column would have reported this site as "caught".

| Site | Injected line | Assertion outcome | File outcome | Failing line | exit |
|---|---|---|---|---|---|
| F20-6 `planValidation.test.ts:104` | `planValidation.ts:169` | **PASS** (blind) | **PASS** isolated · **FAIL** whole-file (collateral only) | none at `:104`; the whole-file red is at `:94` | 0 isolated · 1 whole-file |

Verbatim runner output, **verdict run** (isolated):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/argument-condensation

 ✓ tests/unit/planValidation.test.ts (10 tests | 9 skipped) 2ms

 Test Files  1 passed (1)
      Tests  1 passed | 9 skipped (10)
   Start at  14:51:11
   Duration  512ms (transform 95ms, setup 171ms, collect 21ms, tests 2ms, environment 0ms, prepare 94ms)
```

Verbatim runner output, **collateral record** (whole-file):

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/argument-condensation

 ❯ tests/unit/planValidation.test.ts (10 tests | 1 failed) 7ms
   ✓ validatePlan > It should not throw for a valid map -> reduce plan 1ms
   ✓ validatePlan > It should not throw for a valid refine -> ground plan 0ms
   ✓ validatePlan > It should throw if commentCount is zero 0ms
   ✓ validatePlan > It should throw if the plan has no steps 0ms
   ✓ validatePlan > It should throw if refine is not the first step 0ms
   ✓ validatePlan > It should throw if a step has invalid parameters (e.g., batchSize <= 0) 0ms
   ✓ validatePlan > It should throw if a step is missing required prompt parameters 0ms
   ✓ validatePlan > It should throw for invalid step flow (refine followed by something other than ground) 0ms
   × validatePlan > It should throw if the pipeline does not result in a single list 4ms
     → expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'
   ✓ validatePlan > It should throw if a final map step would produce multiple batches 0ms
```

**Collateral: one test — `:89-97`, and it is excluded from this verdict.** The sibling
*"It should throw if the pipeline does not result in a single list"* went red because its message
matcher at `:94-96` saw the swapped string. It is not one of the fifteen enumerated sites, so under
§ 3.3 it is **collateral and does not bear on this verdict**; its verbatim failure block is recorded
in § 8.

It is also, separately, the strongest corroboration in this record. The same injection, reaching the
same `throw` at `planValidation.ts:169`, was **detected** by the sibling and **not detected** by the
site — a within-file controlled comparison. Whatever else is true, the difference between red and
green here is nothing but the presence of a message matcher.

**Positive control — the injection was live, not a no-op.** The sibling's red *is* the positive
control: `expected … 'Pipeline must end with a single list,…' but got 'refine can only be followed by
ground'` is the runner printing the injected string back, proving the edited line executed inside the
same process that reported `:104` green. No separate probe was needed.

Prediction was PASS at the site with a collateral red at `:89-97`; observed exactly that;
**matched**, in both halves.

**5.15.5 Verdict and reasoning**

An entirely different invariant's failure message was thrown from the pipeline-shape check, and the
test whose title names the pipeline-shape condition did not notice. Under the injection, a plan that
ends in 100 batches reported *"refine can only be followed by ground"* — a message about step
ordering, describing a plan that contains no `refine` step at all — and
`planValidation.test.ts:104` stayed green.

The mechanism is the matcher, and the file proves it against itself. `.toThrow()` with no argument
is satisfied by any thrown value, so the assertion at `:104` tests only that `validatePlan` rejected
the plan, never that it rejected it *for the reason the title states*. Seven of the ten tests in the
same file pin their message; the sibling at `:94-96`, asserting the same `validatePlan` call through
the same code path to the same `throw` statement, caught the swap on the first run. The audit's
characterisation — *"the other 7 tests in this file all use message matchers; this one cannot
distinguish its invariant from theirs"* — is accurate to the line, accurate to the count, and now
accurate by measurement.

The whole-file run exited red, and that red is **not** the assertion catching the regression: it came
from `:94`, a different test that is not among the fifteen sites. Reading it as a catch is the exact
misreading § 3.3 was written to prevent, and would have withdrawn a finding that the isolated verdict
run shows to be blind. The removal injection rejected in § 5.15.2 would have produced the same
spurious withdrawal by a different route. Nothing in either run overturned a prediction.

**Verdict:** confirmed

**5.15.6 Pre-specified regression for Phase 142**

**The regression (re-apply this diff verbatim):** at
`packages/argument-condensation/src/core/utils/condensation/planValidation.ts:169`, keep the
`if (structure !== 'list')` guard and its `throw`, and replace only the message —
`` throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`); ``
becomes `throw new Error('refine can only be followed by ground');`. In production this is what a
mis-merge or a copy-paste refactor inside `planValidation.ts` looks like: the plan is still correctly
rejected, but the operator debugging a broken condensation pipeline is told to check a `refine`
step that does not exist, and the two computed values that actually localise the fault —
`structure` and `batchCount` — are gone from the diagnostic. Today `:104` stays green through it while
`:94` reds, so the suite's only signal points at the wrong test.

**The target Phase 142 must reach:** `:104` must pin the message its own invariant produces, the way
its seven siblings already do. Concretely, replace the bare matcher with the exact string that trace
in § 5.15.1 shows this input generates —

```ts
expect(() => validatePlan({ steps, commentCount: 100 })).toThrow(
  'Pipeline must end with a single list, but ends with listOfLists in 100 batch(es)'
);
```

— which fails under the diff above where `.toThrow()` does not, and additionally pins the `100` that
makes this test's `MAP(batchSize: 1)` scenario distinguishable from the sibling's `2`. A looser
`/must end with a single list/` also fails under the diff and is acceptable if the batch arithmetic is
judged too brittle to assert; the bare matcher is not.

**One caveat Phase 142 should carry into the fix.** After this change, `:94-96` and `:104` would pin
messages from the *same* `throw` statement, differing only in the interpolated `batchCount`. That is
correct and intended — they exercise different arithmetic paths to it — but it means a future edit to
that one message reds two tests. That is a feature of pinning, not a reason to leave one of them
bare.

---

## 6. Withdrawals and their propagation

not yet written — filled by plan 07.

---

## 7. What this pass does and does not prove

not yet written — filled by plan 06.

---

## 8. Discarded and collateral — recorded rather than hidden

Plan 06 writes this section's synthesis. Until then, plans that produce collateral reds, overturned
predictions or rejected injection designs **append their entries here as they happen**, so nothing
waits on a later plan to be recorded. Entries below are in the order they were observed.

### 8.1 Collateral reds

Tests outside the fifteen enumerated sites that went red under an injection. Per § 3.3 **none of these
bears on any verdict.**

**C-1 — `planValidation.test.ts:89-97`, red under the F20-6 injection (§ 5.15).**
Recorded by plan 02. **Does not bear on the F20-6 verdict**, nor on any other verdict in this
document: it is not one of the fifteen sites. Verbatim:

```
   × validatePlan > It should throw if the pipeline does not result in a single list 4ms
     → expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/planValidation.test.ts > validatePlan > It should throw if the pipeline does not result in a single list
AssertionError: expected [Function] to throw error including 'Pipeline must end with a single list,…' but got 'refine can only be followed by ground'

Expected: "Pipeline must end with a single list, but ends with listOfLists in 2 batch(es)"
Received: "refine can only be followed by ground"

 ❯ tests/unit/planValidation.test.ts:94:62
     92|       createStep(CondensationOperations.REDUCE, { denominator: 5 }) //…
     93|     ];
     94|     expect(() => validatePlan({ steps, commentCount: 100 })).toThrow(
       |                                                              ^
     95|       'Pipeline must end with a single list, but ends with listOfLists…
     96|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  14:51:19
   Duration  498ms (transform 90ms, setup 209ms, collect 20ms, tests 7ms, environment 0ms, prepare 80ms)
```

Excluded from the verdict, and separately **corroborating**: the same injection reaching the same
`throw` was caught here and missed at `:104`, with the presence of a message matcher as the only
difference between the two. It is also this site's positive control — the runner prints the injected
string back, proving the edit executed in the process that reported `:104` green.

**C-2 — `authorize-endpoint.test.ts:159`, `:171` and `:192`, red under the shared F19a/F19b injection
at `idura.ts:74` (§ 5.7).** Recorded by plan 04. **Does not bear on the F19a verdict**, nor on any
other verdict in this document: none of the three is one of the fifteen sites. All three fail for the
same reason the site does — the `request` parameter is `null`, so each `jose` call receives a non-string
— and each fails in a different `jose` entry point. Verbatim:

```
 FAIL  src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > JAR is signed with RS256 algorithm
TypeError: Invalid Token or Protected Header formatting
 ❯ Module.decodeProtectedHeader ../../node_modules/jose/dist/webapi/util/decode_protected_header.js:32:15
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:159:25
    157|     const requestParam = url.searchParams.get('request')!;
    158| 
    159|     const header = jose.decodeProtectedHeader(requestParam);
       |                         ^
    160|     expect(header.alg).toBe('RS256');
    161|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯

 FAIL  src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > JAR payload contains required OIDC fields
JWTInvalid: JWTs must use Compact JWS serialization, JWT must be a string
 ❯ Module.decodeJwt ../../node_modules/jose/dist/webapi/util/decode_jwt.js:7:15
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:171:26
    169|     const requestParam = url.searchParams.get('request')!;
    170| 
    171|     const payload = jose.decodeJwt(requestParam);
       |                          ^
    172|     expect(payload.response_type).toBe('code');
    173|     expect(payload.response_mode).toBe('query');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯

 FAIL  src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts > POST /api/oidc/authorize > JAR signature is verifiable with the signing public key
JWSInvalid: Compact JWS must be a string or Uint8Array
 ❯ compactVerify ../../node_modules/jose/dist/webapi/jws/compact/verify.js:9:15
 ❯ Module.jwtVerify ../../node_modules/jose/dist/webapi/jwt/verify.js:5:28
 ❯ src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:192:36
    190| 
    191|     // Should not throw -- signature is valid
    192|     const { payload } = await jose.jwtVerify(requestParam, signingPubl…
       |                                    ^
    193|     expect(payload.client_id).toBe('test-client-id');
    194|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯
```

Excluded from the verdict, and separately **corroborating** in two ways. First, they are this
injection's liveness proof: three independent `jose` entry points each received the missing parameter,
so the edit demonstrably executed in the process that reported `:144` green — which is why § 5.7.4
records that no separate positive control was needed. Second, they show the **same non-null-assertion
pattern one step further along**: `:157`, `:169` and `:189` each write
`url.searchParams.get('request')!`, applying a TypeScript `!` to a value the runtime hands back as
`null`. That is the F19c defect (§ 5.9.1) appearing three more times in this file, outside the audit's
enumeration. It is recorded here rather than folded into any verdict, and is a candidate scope item for
Phase 140's ASSERT-03 sweep.

**C-3 — `idura.test.ts:184`, red under the same shared injection (§ 5.8).** Recorded by plan 04.
**Does not bear on the F19b verdict**; it is not one of the fifteen sites. Verbatim:

```
 FAIL  src/lib/api/utils/auth/providers/idura.test.ts > Idura provider > getAuthorizeUrl (JAR-based) > signed request object contains correct claims
JWTInvalid: JWTs must use Compact JWS serialization, JWT must be a string
 ❯ Module.decodeJwt ../../node_modules/jose/dist/webapi/util/decode_jwt.js:7:15
 ❯ src/lib/api/utils/auth/providers/idura.test.ts:184:28
    182| 
    183|       // Decode the payload without verification (we control the key)
    184|       const payload = jose.decodeJwt(requestParam);
       |                            ^
    185| 
    186|       expect(payload.client_id).toBe('test-idura-client');
```

Same disposition and same corroboration as C-2: excluded from the verdict, and independent evidence
that the injection reached the module in the process that reported `:148` green.

**C-4 — `token-endpoint.test.ts:189`, `:208` and `:230`, red under both F19c injections at
`idura.ts:101-102` (§ 5.9).** Recorded by plan 04. **Does not bear on the F19c verdict**; none of the
three is one of the fifteen sites. Verbatim, from the injection-B run:

```
 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > client assertion has RS256 algorithm in header
TypeError: Invalid Token or Protected Header formatting
 ❯ Module.decodeProtectedHeader ../../node_modules/jose/dist/webapi/util/decode_protected_header.js:32:15
 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:189:25
    187| 
    188|     const assertion = capturedFetchBody!.get('client_assertion')!;
    189|     const header = jose.decodeProtectedHeader(assertion);
       |                         ^
    190|     expect(header.alg).toBe('RS256');
    191|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯

 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > client assertion has correct iss, sub, aud claims
JWTInvalid: JWTs must use Compact JWS serialization, JWT must be a string
 ❯ Module.decodeJwt ../../node_modules/jose/dist/webapi/util/decode_jwt.js:7:15
 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:208:26
    206| 
    207|     const assertion = capturedFetchBody!.get('client_assertion')!;
    208|     const payload = jose.decodeJwt(assertion);
       |                          ^
    209| 
    210|     expect(payload.iss).toBe('test-idura-client');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯

 FAIL  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts > POST /api/oidc/token (Idura - private_key_jwt) > client assertion has exp within 5 minutes and a jti
JWTInvalid: JWTs must use Compact JWS serialization, JWT must be a string
 ❯ Module.decodeJwt ../../node_modules/jose/dist/webapi/util/decode_jwt.js:7:15
 ❯ src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:230:26
    228| 
    229|     const assertion = capturedFetchBody!.get('client_assertion')!;
    230|     const payload = jose.decodeJwt(assertion);
       |                          ^
    231| 
    232|     // exp should be set and within 5 minutes from now

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯
```

Excluded from the verdict, and corroborating in the same two ways as C-2. First, liveness: three
independent `jose` entry points each received the missing assertion, so the edit demonstrably executed
in the process that reported `:167` green. Second — and this is the pattern worth carrying forward —
`:188`, `:207` and `:229` each write `capturedFetchBody!.get('client_assertion')!`, repeating the
`:166` non-null assertion that § 5.9.1 identifies as F19c's second mechanism. Counting C-2's three, the
`!`-on-a-`null`-returning-`.get()` pattern appears **six** further times across the two auth test files
outside the audit's enumeration. Recorded here rather than folded into any verdict; a candidate scope
item for Phase 140's ASSERT-03 sweep, and evidence that the F19 class is wider than three sites.

### 8.2 Overturned predictions

§ 3.4 requires a prediction the run contradicts to be recorded as overturned, never rewritten to match
the observation.

**O-1 — F16 injection A predicted PASS, observed FAIL.** Recorded by plan 02.
`139-RESEARCH.md:534-541` and `139-02-PLAN.md` both predicted the audit's named regression — deleting
the language allow-list check at `api.ts:118-122` — would leave `handleQuestion.test.ts:56-68` green,
on the stated ground that "control falls through to `getAndSliceComments` / `createCondensationSteps`
with `entities: []`, whose throw is independently proven at `defineCondensationPlan.test.ts:71`". The
run contradicted it: the promise **resolved with `[]`** and the test went red.

The prediction's premise was wrong, not its logic. With `entities: []`, `getAndSliceComments`
(`getAndSliceComments.ts:143-149`) returns **zero** comment groups because each group push is guarded
by `.length > 0`, so `handleBooleanQuestion`'s `for (const group of commentGroups)` loop
(`question-handlers.ts:30`) never executes, `runSingleCondensation` is never called and
`createCondensationSteps` is never reached. The proven throw at `defineCondensationPlan.test.ts:71` is
real but unreachable from this test's inputs — as is the mock provider that F16 is titled for.

Consequence, carried into § 5.4.5 and § 5.4.6: the audit's mechanism claim ("at least three
independent paths to a throw") and its named regression ("delete the language check entirely and this
test still passes") are both **refuted by execution**, while the defect its title names — a bare
matcher under a title promising a specific cause — is **confirmed** by the redesigned injection B.
Phase 142 must take its negative control from § 5.4.6, not from the audit's sentence.

**O-2 — F15-C: the visualization test at `:331` was predicted to red, and did not.** Recorded by
plan 02. `139-RESEARCH.md:505-510` predicted *"condenseQuestions likely 4/5"* under the shared
`condenser.ts:205` injection, on the ground that the out-of-scope test
*"It should create visualization data when createVisualization flag is set"* reads `prosData.nodes`
back from the written operation tree and would therefore see the emptied arguments. Observed: the
file went **5/5 green**; that test passed.

The premise missed a two-line ordering detail. `Condenser.run()` populates the tree at
`condenser.ts:195` (`this.treeBuilder.setFinalArguments(currentData as Array<Argument>)`) and writes
it to disk at `:198-199`, both **before** the `return` at `:202` whose object literal the injection
edits. The serialized tree therefore still holds the real arguments while the caller receives none,
and `expect(prosData.nodes).toBeDefined()` at `:400` never observes the break.

Consequence, carried into § 5.3.4 and § 5.3.6: this **strengthens** F15-C rather than weakening it —
not even the test that reads the pipeline's own serialized output can detect a `Condenser.run()` that
returns nothing. It also means that test cannot serve as an accidental end-to-end guard, and § 5.3.6
records what it would need to become one. No verdict changed; the prediction stands recorded as made.

### 8.3 Rejected injection designs

Designs considered and deliberately not run, recorded so the reasoning is auditable rather than
invisible.

**R-1 — F20-6: deleting the `planValidation.ts:169` throw.** Recorded by plan 02; stated in full in
§ 5.15.2. Rejected because the resulting red is produced by the absence of *any* throw rather than by
the message confusion the finding names, and would have withdrawn a valid finding under a naive
reading of ROADMAP criterion 2. The accepted design preserves the throw and varies only the message.

**R-2 — F15-A: the audit's own named regression, "make `generateQuestionInfo` ignore question type".**
Recorded by plan 03; proved un-injectable in § 5.1.1(a). Rejected because **there is nothing to
delete**: `grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/` exits 1 with
no output, so the shipped code already ignores question type and the audit's hypothetical is the
production reality. This is a different failure mode from R-1 — R-1's injection would have *over*-shot
(removing the category); R-2's cannot be applied at all (zero delta). Its absence is nonetheless
**stronger** evidence for F15-A than any injection, and § 5.1.5 rests one of its two grounds on it.
Consequence for Phase 142: its negative control must come from § 5.1.6, never from the audit's
sentence — the same consequence F16 carries for the opposite reason. Plan 06 lifts this into § 7 as a
scope limit of the whole pass.

**R-3 — F15-A: bypassing `responseTransformer.ts` to return the raw LLM response untransformed.**
Recorded by plan 03; the second candidate `139-RESEARCH.md:478-480` names, matching the audit's second
clause ("passed the LLM response through untouched"). Considered and **not run**. Rejected for blast
radius without discrimination: it changes the shape of every returned object, so it would red
`api.test.ts` and any consumer of the result type, while demonstrating the same single fact the chosen
one-line substitute demonstrates — that the assertions read only the mocked payload. Recorded so a
later reader sees it was weighed rather than overlooked.

**R-4 — F15-A: the in-band positive control at `infoGeneration.ts:77` is a control, not a regression
candidate.** Recorded by plan 03; stated in full in § 5.1.4. Renaming the `generalInstructions` **key**
reds 7 of 7 tests via `loadPrompt`'s `throwIfVarsMissing`. It is deliberately excluded from § 5.1.6
because it reds **before and after** any fix to the assertions, which would make Phase 142's
remediation unverifiable — the same disqualification that removed the audit's F16 sentence from
§ 5.4.6.

**R-5 — F20-5: the in-band positive control at `variants.ts:100` (`electionId: undefined`) is a
control, not a regression candidate.** Recorded by plan 03; stated in full in § 5.14.4. Setting the
property to `undefined` reds `variants.test.ts:9` today, which is exactly why it is excluded from
§ 5.14.6: a negative control that reds before *and* after the fix verifies nothing about the fix. Its
job was to prove the array is non-empty in the un-injected code — without which injection A's green
("1 passed" under `return []`) is indistinguishable from a test that never asserted at all. Same
disqualification as R-4, reached from the vacuity side rather than the value side.

**R-6 — F19c: `client_assertion: undefined as unknown as string` models a malformed value, not an
absent one.** Recorded by plan 04; stated in full in § 5.9.2, and **run** rather than merely
considered — it is injection A of the two at that site, kept in the record as a second axis of
corroboration but excluded from § 5.9.6's negative control.

The reason is a `URLSearchParams` serialisation detail, measured out of band rather than assumed:
`new URLSearchParams({ b: undefined })` stringifies the value, producing `b=undefined`, so `.get('b')`
returns the four-character string `"undefined"` — not `null`, and not an omitted key. Under injection A
the token body therefore carries a *present but garbage* client assertion, `:167` passes because a
non-empty string is defined, and the file fails at `:171` on `expected [ 'undefined' ] to have a length
of 3` rather than at `:170` with the `TypeError` the finding predicts. F19c's named mechanism —
`expect(null).toBeDefined()` passes — goes untested.

**This is a third distinct failure mode of injection design, alongside R-1 and R-2.** R-1 *over*-shot
(it removed the category rather than varying the detail); R-2 could not be applied at all (zero delta);
R-6 applies cleanly and produces a red, but on the **wrong axis** — it varies a different detail than
the finding names, so a verdict resting on it alone would be evidence about malformation dressed as
evidence about absence. It is the subtlest of the three, because nothing in the run's output announces
the substitution: the file goes red either way, and only the failing line number distinguishes them.
Injection B (deleting the entry, the alternative `139-RESEARCH.md:641` already named) produces genuine
absence and carries the verdict.

Kept in the record rather than discarded because it measures something injection B cannot: the
assertion is blind to malformation as well as to absence, which is why § 5.9.6 recommends
`toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)` over the audit's `.not.toBeNull()` — the latter closes only the
axis B measured. Consequence for Phase 142: re-apply **B**; A is not the negative control.
