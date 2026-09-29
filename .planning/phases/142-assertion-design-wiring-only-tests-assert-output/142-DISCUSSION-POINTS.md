# Phase 142 — Consolidated Discussion Points

**Phase:** 142 — Assertion Design — Wiring-Only Tests Assert Output
**Requirement:** ASSERT-07 · **Depends on:** 139 (scope), 141 (CI reach)
**Purpose:** Pre-resolve every gray-area decision for Phase 142 in one pass, so `/gsd-plan-phase 142`
and `/gsd-execute-phase 142` run without a per-area back-and-forth.

**How to read / fill:**

- Every item carries a **recommended default** (`→`). That default is what I lock into CONTEXT.md
  unless you change it.
- `[ ]` = pending · `[x]` = you confirm the default · strike or edit the `→` line to override ·
  add `**EDIT:**` / `**NOTE:**` lines freely.
- **⚠ DECIDE** marks items that change the *shape* of the work rather than an implementation detail.
  Skim for these first — there are **5**: B1, B2, C1, D1, F2.
- Bare `[ ]` with no ⚠ are confirm-or-ignore: leaving them unchecked still means I proceed on the `→`.

**Grounding (all read at HEAD `7bd87085b`, 2026-08-20):**
`.planning/ROADMAP.md` Phase 142 detail (lines 469-483) · `.planning/REQUIREMENTS.md:60` (ASSERT-07) ·
`.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md`
(§ 4 verdict table, § 4.3 "What Phase 142 consumes", § 5.N.2 + § 5.N.6 per finding, § 7 limits, § 8 discarded) ·
`.planning/audits/2026-08-11-fake-guard-sweep.md` · `141-CONTEXT.md` (D-01 package measurement).

---

## 0. Scope on the record — the 12 findings

Phase 139 confirmed **15** findings; **3 of them (F19a/b/c) are not Phase 142's.** ASSERT-03 assigned
the F19 class to Phase 140, which is closed. Phase 142's corpus is therefore **12**:

| # | Finding | Site | What its title promises but does not assert |
|---|---|---|---|
| 1 | F15-A | `packages/question-info/tests/questionTypes.test.ts:84,139,199,263,323,387,532,535-537` (+ unlisted `:388`) | that question **type** changes the generated info |
| 2 | F15-B | `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:131-142,184-185` | that condensation produced **arguments** |
| 3 | F15-C | `.../condenseQuestions.test.ts:139-145,215-219,268-274` | same, across three clusters |
| 4 | F16 | `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68` | that the **language** rejection fired |
| 5 | F17 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95` | component **reactivity** (component is not in the import graph at all) |
| 6 | F18 | `packages/dev-seed/tests/templates/default.test.ts:121-135` | the **locale block boundary** (109/109/109 en/fi/sv) |
| 7 | F20-1 | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233` | a **400** status |
| 8 | F20-2 | `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36` | the raw-template **ICU fallback output** |
| 9 | F20-3 | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259` | **which** failure (`result.success === false` only) |
| 10 | F20-4 | `packages/dev-seed/tests/supabaseAdminClient.test.ts:151` | the **exact selected columns** (`toContain('id')` substring-matches `external_id`) |
| 11 | F20-5 | `packages/data/src/objects/nominations/variants/variants.test.ts:5-12` | that the tree **has rows** (`forEach` over an empty array passes) |
| 12 | F20-6 | `packages/argument-condensation/tests/unit/planValidation.test.ts:104` | the **message**, among seven sibling matchers that do assert it |

- [x] **0.1 — The corpus is these 12; F19a/b/c are out (Phase 140 / ASSERT-03, closed).**
  → Confirm. CONTEXT.md states the 12 explicitly so no planner re-derives it from the 15-row table.

---

## A. Scope boundary

- [x] **A1 — Adjacent same-class sites inside the same files: fix or hold to the enumeration?**
  139 surfaced three sites the audit never enumerated: F15-A's unlisted `questionTypes.test.ts:388`,
  F20-6's sibling at `planValidation.test.ts:94` (which *does* carry a message matcher — it is the
  contrast, not a defect), and the six further `!`-on-`null` F19-class sites in the two auth test files
  (§ 7 limit 6, § 8.1 C-2/C-4).
  → **Fix `:388`** (same file, same blindness, same injection already proves it). **Leave the six
  F19-class sites** — they belong to ASSERT-03's class and Phase 140 is closed; record them as a
  standing todo rather than absorbing them here. `planValidation.test.ts:94` needs no change.

- [x] **A2 — Missing tests stay out of scope.**
  `getIdTokenClaims.test.ts` has no negative test for bad signature / wrong `issuer` / wrong `audience`
  (§ 7 limit 6). That is a coverage gap, not a fake guard.
  → Out of scope; captured as a deferred idea for a future coverage phase. ASSERT-07 remediates
  assertions that exist.

- [x] **A3 — May Phase 142 withdraw a finding, and on what bar?**
  Criterion 4 allows withdrawal-with-reasoning, but 139 already confirmed all 12 by injection.
  → Withdrawal is permitted **only** on a ground 139 could not have seen (e.g. the strengthened
  assertion is provably unwritable, not merely awkward). A withdrawal must carry the reasoning in the
  phase record *and* in `.planning/audits/2026-08-11-fake-guard-sweep.md`. Expected count: **0**.

- [x] **A4 — Sibling wall-clock / timing assertions: named site only, or sweep?**
  Criterion 2 names `processingTimeMs > 0` on a fully-mocked run for removal
  (`condenserStandalone.test.ts:137`).
  → Remove the named site **and** grep the two AI packages for the same wall-clock-on-a-mock shape;
  remove any others found, listing them in the record. Do not sweep beyond those packages.

---

## B. ⚠ The two live product defects that block the criteria

Phase 139 § 7 limit 1 is explicit: two of Phase 142's target assertions **go red against the clean
tree** because the product is actually wrong. An implementer who reads that red as a bad remediation
will back the correct change out again. These need your call before planning.

- [x] **B1 ⚠ DECIDE — F15-A: `question-info` ignores question type entirely. Fix the product here?**
  `grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/` exits 1 with **no
  output** (re-verified at HEAD 2026-08-20). So ROADMAP criterion 2's "the three Configuration blocks
  differ observably from one another, so an implementation that ignores question type fails at least
  one" cannot be satisfied by an assertion alone — the shipped code *is* the regression. Two of
  § 5.1.6's three named targets ("the three Configurations differ", "choice labels carried for
  categorical") **fail today, before any injection**.
  Options: **(a)** fix `packages/question-info/src/` so prompts vary by question type, then the
  assertions pass; **(b)** write the assertions, leave them red, and split the product fix into its own
  phase (leaves `test:unit` red — violates criterion 5); **(c)** write the assertions as
  `test.fails()`/skipped-with-reason and file the product fix.
  → **(a) — fix it here, scoped minimally.** Criterion 2 is unsatisfiable otherwise, and (b) breaks
  criterion 5's exit-0. Minimal means: question type + choice labels reach the prompt variables at
  `infoGeneration.ts`; no redesign of the info-generation feature.
  **This is the single largest scope question in the phase — it converts 142 from test-only to
  test+product.**

- [x] **B2 ⚠ DECIDE — F20-1: the authorize endpoint swallows its own 400 into a 500. Fix here?**
  `apps/frontend/src/routes/api/oidc/authorize/+server.ts:22` does `return error(400, …)` **inside** a
  `try`; `error()` throws in SvelteKit 2, so the `catch (e)` at `:50` replaces it with the 500 at `:52`
  (re-verified at HEAD). The endpoint does not return 400 for a missing `redirectUri` today. Tightening
  `authorize-endpoint.test.ts:233` to assert `{ status: 400 }` reds the clean tree until this is fixed.
  → **Fix it here** — one-line class (`throw error(400, …)`, or hoist the guard out of the `try`), plus
  a check for the same `return error(...)`-inside-`try` shape in the sibling `token/` and `callback/`
  endpoints. It is the smallest possible product change and the assertion is worthless without it.

- [x] **B3 — F15-A's mock-in/mock-out tautology at `:535-537`: repoint or delete?**
  § 5.1.6 states strengthening is impossible — `toBe` on an exact string is already maximal; the test
  asserts values it handed the mock itself. The only product logic on that path is
  `packages/question-info/src/utils/responseTransformer.ts`.
  → **Repoint**: assert the *transform* between provider response and returned result. Delete only if
  the transform turns out to be identity, and say so in the record.

---

## C. ⚠ F17 disposition

ROADMAP criterion 3: *"F17 either exercises real reactivity or is renamed to the contract it verifies."*
139 § 7 limits 3-4: the component is not in the test's module graph (imports are exactly `vitest` and
`./EntityListWithControls.helpers`; the helper has zero imports), so the file tests pure helpers and
the `10 === 10` assertion is self-referential. The file's own doc comment at `:9` explains the
component is deliberately not mounted (it would need the full appContext + locale + i18n surface).

- [x] **C1 ⚠ DECIDE — Which fork?**
  **(a)** Mount the component and test real reactivity (needs the appContext/locale/i18n harness; new
  test infrastructure; touches the Spike-024 `#version`-bridge territory).
  **(b)** Rename to the contract it actually verifies — the file is a **helpers** test, and its titles
  should say so; fix the self-referential `10 === 10` at `:84-95` to assert a real helper property.
  → **(b).** (a) is a component-test-harness project, not an assertion redesign, and the doc comment
  already records the deliberate choice. Renaming plus repairing the tautological assertion satisfies
  the criterion's second branch honestly.

- [x] **C2 — If (b): how far does "renamed" go?**
  → File renamed `EntityListWithControls.helpers.test.ts`; `describe` titles renamed to name the helper
  functions (`computeFiltered`, `countActiveFilters`); the `:9` doc comment updated to state the
  contract rather than the omission; `:84-95` rewritten to assert a computed property against an
  independently-derived expectation instead of comparing a value to itself.
  **NOTE:** if you prefer (a) in C1, say so and I will scope the harness as its own plan.

---

## D. ⚠ Negative-control protocol — the half Phase 142 owes

139 § 7 limit 7: each § 5.N.2 diff + § 5.N.6 regression is **half** of the pair. 139 applied the
injection against the OLD assertion and observed green. 142 re-applies the **same** diff against the
**NEW** assertion and must observe red. ROADMAP criterion 1: *"No finding is marked done with only one
half."*

- [x] **D1 ⚠ DECIDE — Does 142 re-run the OLD-assertion half, or cite 139's recorded green?**
  This is a 12-run vs 24-run difference and it decides whether the phase is one week or two.
  **(a)** Cite 139 § 5.N.4 for the OLD half (it is committed, environment-stamped, and each run is
  recorded with its log); run only the NEW half.
  **(b)** Re-run both halves inside 142 so the pair is measured in one session on one tree.
  → **(a) with one exception:** cite 139 for the OLD half, but **re-run the OLD half for any finding
  whose target file changed for a reason other than the assertion under test** (B1's product fix makes
  F15-A such a case, as does B2 for F20-1). Rationale: 139's greens were measured at `12825b479`; a
  product change underneath invalidates the citation for that finding specifically, not for the corpus.

- [x] **D2 — Reuse 139's HYGIENE-LOOP verbatim?**
  (§ 3.1: pre-gate → inject with Edit at the named `file:line` → run with combined output to a log
  **outside** the repo → revert → post-gate, all three conditions, per path, per finding, before the
  next injection starts.)
  → Yes, verbatim, including the log-outside-the-repo rule and the per-finding post-gate. It is the
  reason 139's record is auditable.

- [x] **D3 — Keep the two-column rule (§ 3.2) and the collateral rule (§ 3.3)?**
  The assertion outcome and the file outcome stay separate cells; collateral reds are recorded, not
  hidden.
  → Yes. In 142 the columns invert (assertion must be **red**, file may be red for collateral reasons),
  so keeping them separate is what stops a collateral red being credited as the negative control.

- [x] **D4 — Ledger file name and shape.**
  → `142-NEGATIVE-CONTROL-LEDGER.md`, in the phase dir, with the **12-row table created in full before
  the first injection runs** (139's ordering guarantee: a finding can be visibly unfilled, never
  silently absent). Columns: `# · Finding · Site · Injection source (§ 5.N.2) · OLD half (cited/re-run)
  · NEW-assertion outcome · File outcome · Collateral · Verdict`.

- [x] **D5 — The four qualified records get their qualification carried into the plan text.**
  § 4.3 names them: **F15-A** (use the substitute injection at `infoGeneration.ts:76`, never the
  audit's sentence), **F16** (use injection **B** — the audit's "delete the language check" reds both
  before and after), **F19c** (not ours), **F20-1** (use injection B; expect red on the un-injected
  tree until B2 is fixed). § 8.3 also records **ten injection designs that must NOT be used** (R-4,
  R-5, R-8, R-9 red both before and after; R-10 reds neither).
  → Carry all of it into the plan verbatim, with § references. Do not let an executor re-derive an
  injection.

---

## E. Per-finding assertion targets

Most targets are already pinned by 139 § 5.N.6. These are the ones with a real choice left.

- [x] **E1 — F16 matcher strength.** `/language/i` regex, or the exact prefix
  `'Unsupported language: lol'`?
  → **Exact prefix.** It fails under injection B (which keeps the guard and swaps only the message) and
  is strictly stronger. **Plus** the audit's second half, which § 5.4.6 gives an independent reason for:
  pass a **non-empty `entities` array**, because with `entities: []` the call never reaches past the
  language check and the test exercises five lines of `handleQuestion` and nothing else.

- [x] **E2 — F18 locale-boundary assertion shape.** The test's own comment says the locale packet
  "cannot easily be asserted", so it settles for `toBeTruthy()` on three block-start names.
  → Assert the **boundary**, not the packet: names at indices 108/109 (and 217/218) come from
  *different* locale generators, and a single-locale generation therefore fails. Concretely: seed a
  per-locale Faker per block and assert byte-identity within a block plus non-identity across the
  boundary. `LOCALE_BLOCK_SIZE = 109` is asserted from the constant, not hard-coded twice.

- [x] **E3 — F20-2 (`typeof result === 'string'`) — what is the exact expected output?**
  The test is "getOverride returns raw template on ICU parse error" with `'{broken, plural, }'`.
  → Assert `toBe('{broken, plural, }')` — the raw template, exactly, which is what the title promises.
  If the implementation returns something else, that is a finding to record, not a value to copy from
  the run output. **NOTE:** if you'd rather not pin an exact string here, say so and I'll use
  `toBe(theTemplateConstantTheTestSet)` referencing the same variable.

- [x] **E4 — F20-4 exact-column assertion: array equality or exact-element containment?**
  `expect(mockState.selectCalls[0]).toContain('id')` currently substring-matches `external_id`.
  → **Exact equality on the selected-column string** (`toBe('id, external_id, first_name, last_name')`
  or `toEqual([...])` depending on the recorded call shape). A dropped or added column should fail; that
  is the point. Brittleness to a *legitimate* column addition is acceptable and cheap to update.

- [x] **E5 — F20-5 length guard: exact count or `> 0`?**
  `variants.test.ts` is 12 lines and its whole body is a `forEach` that vacuously passes on `[]`.
  → **Exact count**, derived from `getTestData().nominations` rather than hard-coded, plus the existing
  per-row assertions. `> 0` closes the vacuous hole but not the "half the tree silently dropped" one.

- [x] **E6 — F20-3 (`result.success === false` twice, no reason) — what identifies the failure?**
  The two sites are "empty JWKS so the kid won't be found" and "kid does not match available keys" —
  two *different* causes asserted identically today.
  → Assert the discriminating field on the result (error code / reason), so the two tests differ
  observably. If `getIdTokenClaims` returns no such field, adding one is in scope as the minimum that
  makes the two titles distinguishable — flag it in the plan rather than weakening the assertion.

- [x] **E7 — F20-6 (`planValidation.test.ts:104` bare `toThrow()`).**
  Its seven siblings all carry message matchers; `:94` is the model.
  → Assert the exact message for "a final map step would produce multiple batches", matching the
  sibling style. Watch the whole-file collateral red 139 recorded at `:89-97` (§ 8.1 C-1).

- [x] **E8 — F15-B / F15-C `result.arguments` depth.** Criterion 2: a `Condenser.run()` returning
  `{ arguments: [], llmMetrics }` must fail.
  → Assert **content**, not just non-emptiness: expected argument count for the fixture, plus each
  argument carrying non-empty text traceable to the mocked provider's canned response. Non-emptiness
  alone would pass a condenser that returns one blank argument.

- [x] **E9 — `processingTimeMs > 0` removal.** (`condenserStandalone.test.ts:137`, fully-mocked run.)
  → Delete the line. Do **not** replace it with a `toBeGreaterThanOrEqual(0)` — that is the same
  decoration with a smaller claim. See A4 for the sibling sweep.

---

## F. Gates and determinism

- [x] **F1 — Criterion 5's gate: what exactly counts?**
  *"`yarn test:unit` (including the packages Phase 141 wired in) exits 0 after remediation, under
  parallel load rather than only in isolation."*
  → Root `yarn test:unit` (turbo, parallel, all workspaces) **3× consecutive green**, recorded with
  timings — the project's standing determinism standard. Per-package `npx vitest run` runs are
  diagnostic only and never the gate.

- [x] **F2 ⚠ DECIDE — Does the full E2E suite gate this phase?**
  Test-only work would not need it. But B1 changes `packages/question-info/src/` and B2 changes
  `apps/frontend/src/routes/api/oidc/authorize/+server.ts` — and that endpoint **is** exercised by the
  bank-auth E2E specs (Phase 122).
  → **Yes, if B1 or B2 is accepted:** one full `yarn test:e2e` run on a fresh dev server + clean DB as
  the phase gate, under the cardinal rule (any failure blocks, "did not run" counts as a failure).
  If both B1 and B2 are rejected, the phase is test-only and F1 alone gates it.

- [x] **F3 — Preflight and environment prerequisites.**
  → Phase 137's served-app preflight applies unchanged; one fresh dev server on `:5173` (no Playwright
  `webServer`), `yarn db:reset` before the suite, per the recorded E2E execution prerequisites.

---

## G. Plan shape and execution

- [x] **G1 — Partitioning: per finding, per package, or per file?**
  → **Per package/area**, roughly: (1) `question-info` — F15-A + B1 + B3; (2) `argument-condensation` —
  F15-B, F15-C, F16, F20-6, E9; (3) `dev-seed` — F18, F20-4; (4) `apps/frontend` auth — F20-1 + B2,
  F20-3; (5) `apps/frontend` other — F17, F20-2, F20-5 (`packages/data`); (6) ledger completion + gate.
  Roughly 6 plans. **NOTE:** override with "one plan per finding" if you want finer commit granularity.

- [x] **G2 — Parallel waves, or strictly sequential like 139?**
  139 was sequential *by necessity* — concurrent injections into a shared tree see each other's edits
  and one agent's `git checkout --` reverts another's live injection.
  → **Same hazard, same rule: sequential.** The injection targets span different packages, but the
  HYGIENE-LOOP's post-gate asserts a *clean scoped porcelain over `apps`, `packages` and `tests`*, which
  a concurrent injection anywhere violates. Durable test-file edits could parallelise; the injection
  runs cannot, and they are the bulk of the work. Not worth the split.

- [x] **G3 — Which plans are non-autonomous (operator checkpoint)?**
  → The plan carrying **B1** (product change to `question-info`) and the plan carrying **B2** (endpoint
  fix) get `autonomous: false` decision checkpoints, matching the Phase 138 D-06 fix-tier precedent.
  Everything else runs autonomously.

- [x] **G4 — Does 142 touch any file Phase 141 just wired?**
  141 added `test:unit` scripts to five packages; 142 edits tests inside four of them.
  → No conflict expected — 141 is closed and merged. The plan re-reads the scripts rather than assuming
  them, and the F1 gate proves the wiring still reaches the edited files.

---

## H. Record propagation

- [x] **H1 — Audit file (`.planning/audits/2026-08-11-fake-guard-sweep.md`) update.**
  → Each of the 12 findings gets a remediation line naming the commit and the ledger row. Withdrawals
  (expected: none, per A3) get their reasoning in place, struck rather than deleted, per 139 § 6's
  precedent.

- [x] **H2 — `REQUIREMENTS.md:60` ASSERT-07 evidence line.**
  → Mark `[x]` with an evidence clause in the ASSERT-01 style: ledger path, count remediated, count
  withdrawn, and the negative-control pair count. Same for the ROADMAP phase line.

- [x] **H3 — New standing todos this phase creates.**
  → (i) the six unenumerated F19-class sites (A1); (ii) the `getIdTokenClaims` missing negative tests
  (A2); (iii) anything B1 defers out of the minimal product fix. Captured via `/gsd-capture`, not left
  in prose.

---

## I. Anything else

- [ ] **I1 — Free-form.** Anything above that reads wrong, any constraint I have not seen, or any part
  of the phase you want shaped differently.

  **YOUR NOTES:**

---

## Fill status

| Section | Items | ⚠ DECIDE |
|---|---|---|
| 0. Scope on the record | 1 | — |
| A. Scope boundary | 4 | — |
| B. Product defects | 3 | **2** (B1, B2) |
| C. F17 disposition | 2 | **1** (C1) |
| D. Negative-control protocol | 5 | **1** (D1) |
| E. Per-finding targets | 9 | — |
| F. Gates | 3 | **1** (F2) |
| G. Plan shape | 4 | — |
| H. Record propagation | 3 | — |
| I. Free-form | 1 | — |
| **Total** | **35** | **5** |

> Everything else proceeds on its `→` default if left unchecked.

**When you're done:** hand this back (edited in place is fine) and I'll write
`142-CONTEXT.md` + `142-DISCUSSION-LOG.md` from it, then you can run `/gsd-plan-phase 142`.

---

## Resolution stamp — 2026-08-20

Returned by the operator with **31 of 35** items confirmed in writing. The four unchecked were
resolved the same day and are now marked `[x]` above:

- **A1**, **A2** — non-⚠; proceeded on their stated `→` defaults per this doc's own
  confirm-or-ignore rule, operator-confirmed.
- **F2** ⚠ — its default was conditional on B1-or-B2 being accepted; both were, and the operator
  confirmed the affirmative branch **explicitly** rather than leaving it inferred. Full
  `yarn test:e2e` gates the phase.
- **I1** — free-form, returned with no notes. Nothing to fold.

Neither written override was taken: **E3**'s "don't pin an exact string" and **G1**'s "one plan per
finding" were both confirmed at their defaults.

Locked into `142-CONTEXT.md` as **D-00 … D-19**; the reasoning trail is in
`142-DISCUSSION-LOG.md`.
