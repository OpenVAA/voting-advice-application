# Phase 142: Assertion Design — Wiring-Only Tests Assert Output - Context

**Gathered:** 2026-08-20
**Status:** Ready for planning
**Source:** `142-DISCUSSION-POINTS.md` (35 items, 31 confirmed in writing; A1/A2/F2/I1 resolved
2026-08-20 — A1/A2 on their stated defaults per the doc's confirm-or-ignore rule, F2 locked
affirmatively by the operator, I1 returned with no notes). See `142-DISCUSSION-LOG.md`.

<domain>
## Phase Boundary

Every sweep finding that survives Phase 139 asserts the behaviour its own title
promises, or is withdrawn on the record with reasoning — and each remediation is
proven by the **second half** of a negative-control pair that Phase 139 only ever
ran the first half of.

The corpus is **12 findings**, not 15 (**D-00**, below). Two of the twelve cannot
be satisfied by an assertion alone because the shipped product is wrong; this
phase fixes both, minimally (**D-01**, **D-02**). One is neither strengthenable
nor a real component test and is renamed to the contract it verifies (**D-04**).

**Not in scope:**

- The three **F19a/b/c** findings — ASSERT-03's class, delivered by Phase 140,
  which is closed.
- The **six further F19-class `!`-on-`null` sites** in the two auth test files
  (139 § 7 limit 6, § 8.1 C-2/C-4). Same class as the above; recorded as a
  standing todo, not absorbed here.
- **Missing** tests. `getIdTokenClaims.test.ts` has no negative test for bad
  signature / wrong `issuer` / wrong `audience`. That is a coverage gap, not a
  fake guard; ASSERT-07 remediates assertions that exist.
- Any redesign of the info-generation feature beyond what D-01 names, or of the
  OIDC endpoints beyond what D-02 names.
- Mounting `EntityListWithControls` — a component-test-harness project, not an
  assertion redesign (**D-04**).
- Any Phase 143 `svelte/store` guard work, even in the same files.

</domain>

<decisions>
## Implementation Decisions

All 35 discussion items are resolved. The 5 shape-changing ones are D-01, D-02,
D-04, D-06 and D-16. Every decision below is **locked** — the planner and
executors implement it, they do not re-derive it.

### D-00 — The corpus is these 12 (discussion 0.1)

Phase 139 confirmed 15 findings; three (F19a/b/c) belong to ASSERT-03 / Phase
140, which is closed. Phase 142's corpus is exactly:

| # | Finding | Site | What its title promises but does not assert |
|---|---|---|---|
| 1 | F15-A | `packages/question-info/tests/questionTypes.test.ts:84,139,199,263,323,387,532,535-537` (+ unlisted `:388`) | that question **type** changes the generated info |
| 2 | F15-B | `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:131-142,184-185` | that condensation produced **arguments** |
| 3 | F15-C | `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:139-145,215-219,268-274` | same, across three clusters |
| 4 | F16 | `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68` | that the **language** rejection fired |
| 5 | F17 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95` | component **reactivity** (component is not in the import graph at all) |
| 6 | F18 | `packages/dev-seed/tests/templates/default.test.ts:121-135` | the **locale block boundary** (109/109/109 en/fi/sv) |
| 7 | F20-1 | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233` | a **400** status |
| 8 | F20-2 | `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36` | the raw-template **ICU fallback output** |
| 9 | F20-3 | `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259` | **which** failure (`result.success === false` only) |
| 10 | F20-4 | `packages/dev-seed/tests/supabaseAdminClient.test.ts:151` | the **exact selected columns** (`toContain('id')` substring-matches `external_id`) |
| 11 | F20-5 | `packages/data/src/objects/nominations/variants/variants.test.ts:5-12` | that the tree **has rows** (`forEach` over an empty array passes) |
| 12 | F20-6 | `packages/argument-condensation/tests/unit/planValidation.test.ts:104` | the **message**, among seven sibling matchers that do assert it |

The planner states these 12 explicitly. No plan re-derives them from 139's
15-row table.

### D-01 ⚠ — F15-A: fix `question-info` here, scoped minimally (discussion B1)

`grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/`
exits 1 with **no output** (re-verified at HEAD 2026-08-20). The shipped code
ignores question type entirely, so ROADMAP criterion 2's *"the three
Configuration blocks differ observably from one another"* is **unsatisfiable by
an assertion alone** — two of § 5.1.6's three named targets fail today, before
any injection.

**Decision: fix the product here.** Rejected alternatives: leaving the
assertions red violates criterion 5's exit-0; `test.fails()`/skip-with-reason is
the same violation wearing a hat.

**Minimal means:** question type + choice labels reach the prompt variables at
`packages/question-info/src/.../infoGeneration.ts`. No redesign of the
info-generation feature. Anything larger that surfaces is deferred (see D-19 iii).

**This converts Phase 142 from test-only to test+product.** Consequences:
carries a non-autonomous checkpoint (D-17), forces an OLD-half re-run for F15-A
(D-06), and contributes to the E2E gate (D-16).

### D-02 ⚠ — F20-1: fix the authorize endpoint here (discussion B2)

`apps/frontend/src/routes/api/oidc/authorize/+server.ts:22` does
`return error(400, …)` **inside** a `try`. `error()` throws in SvelteKit 2, so
the `catch (e)` at `:50` replaces it with the 500 at `:52` (re-verified at HEAD).
The endpoint does not return 400 for a missing `redirectUri` today, so
tightening `authorize-endpoint.test.ts:233` to assert `{ status: 400 }` reds the
clean tree until this is fixed.

**Decision: fix it here.** **AMENDED by A-02 — read it before implementing.** The
originally-named `throw error(400, …)` variant is a **runtime no-op**; the fix must
be a catch-arm re-throw or a guard hoist. The sibling check across `token/` and
`callback/` stands and has already found one more site (A-02). Smallest possible
product change; the assertion is worthless without it. Carries a non-autonomous
checkpoint (D-17).

### D-03 — F15-A's `:535-537` tautology: repoint, don't delete (discussion B3)

§ 5.1.6 states strengthening is impossible — `toBe` on an exact string is
already maximal and the test asserts values it handed the mock itself. The only
product logic on that path is
`packages/question-info/src/utils/responseTransformer.ts`.

**Repoint** the assertion at the *transform* between provider response and
returned result. Delete **only** if the transform turns out to be identity, and
say so in the record.

### D-04 ⚠ — F17: rename to the contract it verifies (discussion C1, C2)

139 § 7 limits 3-4: the component is not in the test's module graph (imports are
exactly `vitest` and `./EntityListWithControls.helpers`; the helper has zero
imports). The file tests pure helpers; the `10 === 10` assertion is
self-referential; the file's own doc comment at `:9` records that the component
is deliberately not mounted.

**Decision: ROADMAP criterion 3's second branch — rename.** Mounting the
component needs the full appContext + locale + i18n harness and touches
Spike-024 `#version`-bridge territory; that is a separate project.

Scope of "renamed" (**C2**, exhaustive):

1. File renamed `EntityListWithControls.helpers.test.ts`.
2. `describe` titles renamed to name the helper functions — `computeFiltered`,
   `countActiveFilters`.
3. The `:9` doc comment updated to state the **contract**, not the omission.
4. `:84-95` rewritten to assert a computed property against an
   **independently-derived** expectation, not a value compared to itself.

### D-05 — Adjacent same-class sites (discussion A1, A2)

- **Fix** F15-A's unlisted `questionTypes.test.ts:388` — same file, same
  blindness, the same injection already proves it.
- **Leave** the six F19-class `!`-on-`null` sites in the two auth test files —
  ASSERT-03's class, Phase 140 closed. Standing todo (D-19 i).
- `planValidation.test.ts:94` needs **no change** — it carries a message matcher
  and is the *contrast*, not a defect.
- `getIdTokenClaims.test.ts`'s missing negative tests are **out of scope** —
  deferred idea (D-19 ii).

### D-06 ⚠ — Negative-control protocol: cite 139's OLD half, with one exception (discussion D1)

139 § 7 limit 7: each § 5.N.2 diff + § 5.N.6 regression is **half** of the pair.
139 applied the injection against the OLD assertion and observed green. 142
re-applies the **same** diff against the **NEW** assertion and must observe red.

**Decision: cite 139 § 5.N.4 for the OLD half** (committed, environment-stamped,
each run recorded with its log) and run only the NEW half — **except** for any
finding whose target file changed for a reason other than the assertion under
test. 139's greens were measured at `12825b479`; a product change underneath
invalidates the citation **for that finding specifically**, not for the corpus.

**Known exceptions at planning time: F15-A** (D-01's product fix) and **F20-1**
(D-02's endpoint fix) — both re-run **both halves**. Any further file the phase
changes for a non-assertion reason joins this list.

### D-07 — Reuse 139's HYGIENE-LOOP verbatim (discussion D2)

139 § 3.1, unchanged: pre-gate → inject with Edit at the named `file:line` → run
with combined output to a log **outside the repo** → revert → post-gate, all
three conditions, per path, per finding, **before the next injection starts**.
The log-outside-the-repo rule and the per-finding post-gate are why 139's record
is auditable; both are mandatory here.

### D-08 — Two-column rule and collateral rule survive, inverted (discussion D3)

139 § 3.2 (assertion outcome and file outcome are separate cells) and § 3.3
(collateral reds recorded, not hidden) both carry over. In 142 the columns
**invert** — the assertion must be **red**, the file may be red for collateral
reasons — which is exactly why keeping them separate is what stops a collateral
red being credited as the negative control.

### D-09 — Ledger: `142-NEGATIVE-CONTROL-LEDGER.md` (discussion D4)

In the phase dir. The **12-row table is created in full before the first
injection runs** (139's ordering guarantee: a finding can be visibly unfilled,
never silently absent). Columns:

`# · Finding · Site · Injection source (§ 5.N.2) · OLD half (cited/re-run) · NEW-assertion outcome · File outcome · Collateral · Verdict`

### D-10 — Carry the four qualified injection records into plan text verbatim (discussion D5)

139 § 4.3 names them; the plan reproduces each with its § reference and **no
executor re-derives an injection**:

- **F15-A** — use the substitute injection at `infoGeneration.ts:76`, **never**
  the audit's sentence.
- **F16** — use injection **B**; the audit's "delete the language check" reds
  both before and after.
- **F19c** — not ours (out of corpus, per D-00).
- **F20-1** — use injection **B** for the **OLD** half only. **AMENDED by A-03:**
  the **NEW** half uses injection **A**, because post-fix injection B goes off-path
  and cannot red. Expect red on the un-injected tree until D-02 lands.

§ 8.3 also records **ten injection designs that must NOT be used**: R-4, R-5,
R-8, R-9 (red both before and after) and R-10 (reds neither). The plan carries
that prohibition list too.

### D-11 — Per-finding assertion targets (discussion E1–E9)

> **AMENDED by A-04 for F15-A** — 139 § 5.1.6's headline "the three Configurations'
> prompts differ" target **passes today for the wrong reason** and must NOT be
> written as stated. F15-A needs a **new fixture**, not an edit. Read A-04 first.

- **E1 · F16** — assert the **exact prefix** `'Unsupported language: lol'`, not
  `/language/i`. It fails under injection B (which keeps the guard and swaps only
  the message) and is strictly stronger. **Plus** the audit's second half, which
  § 5.4.6 independently motivates: pass a **non-empty `entities` array**, because
  with `entities: []` the call never reaches past the language check and the test
  exercises five lines of `handleQuestion` and nothing else.
- **E2 · F18** — assert the **boundary**, not the packet. Names at indices
  108/109 (and 217/218) come from *different* locale generators, so a
  single-locale generation fails. Concretely: seed a per-locale Faker per block;
  assert byte-identity **within** a block plus non-identity **across** the
  boundary. `LOCALE_BLOCK_SIZE = 109` is asserted **from the constant**, never
  hard-coded twice.
- **E3 · F20-2** — assert `toBe('{broken, plural, }')`, the raw template exactly,
  which is what the title promises. If the implementation returns something else
  that is a **finding to record**, not a value to copy from the run output.
- **E4 · F20-4** — **exact equality** on the selected-column string
  (`toBe('id, external_id, first_name, last_name')` or `toEqual([...])` per the
  recorded call shape). A dropped or added column must fail; that is the point.
  Brittleness to a legitimate column addition is accepted and cheap to update.
- **E5 · F20-5** — **exact count**, derived from `getTestData().nominations`
  rather than hard-coded, plus the existing per-row assertions. `> 0` closes the
  vacuous hole but not the "half the tree silently dropped" one.
- **E6 · F20-3** — assert the **discriminating field** (error code / reason) so
  the two tests ("empty JWKS so the kid won't be found" vs "kid does not match
  available keys") differ observably. If `getIdTokenClaims` returns no such
  field, **adding one is in scope** as the minimum that makes the two titles
  distinguishable — flag it in the plan rather than weakening the assertion.
- **E7 · F20-6** — assert the exact message for *"a final map step would produce
  multiple batches"*, matching the seven siblings' style (`:94` is the model).
  Watch the whole-file collateral red 139 recorded at `:89-97` (§ 8.1 C-1).
- **E8 · F15-B / F15-C** — assert **content**, not just non-emptiness: expected
  argument count for the fixture, plus each argument carrying non-empty text
  traceable to the mocked provider's canned response. Non-emptiness alone would
  pass a condenser returning one blank argument.
- **E9 · `processingTimeMs > 0`** — **delete** the line at
  `condenserStandalone.test.ts:137`. Do **not** replace it with
  `toBeGreaterThanOrEqual(0)`; that is the same decoration with a smaller claim.

### D-12 — Wall-clock sweep, bounded to the two AI packages (discussion A4)

Remove the E9 site **and** grep `packages/question-info` and
`packages/argument-condensation` for the same wall-clock-on-a-mock shape;
remove any others found and list them in the record. **Do not sweep beyond
those two packages.**

### D-13 — Withdrawal bar (discussion A3)

Criterion 4 permits withdrawal-with-reasoning, but 139 confirmed all 12 by
injection. Withdrawal is permitted **only** on a ground 139 could not have seen
— e.g. the strengthened assertion is *provably unwritable*, not merely awkward.
A withdrawal carries its reasoning in the phase record **and** in
`.planning/audits/2026-08-11-fake-guard-sweep.md`. **Expected count: 0.**

### D-14 — Unit gate (discussion F1)

Root `yarn test:unit` (turbo, parallel, all workspaces) **3× consecutive green**,
recorded with logs. Parallel, not per-package isolation — that is what criterion
5's *"under parallel load rather than only in isolation"* means. The Phase-141
wiring must demonstrably reach the edited files.

### D-15 — Environment prerequisites (discussion F3)

Phase 137's served-app preflight applies unchanged. One fresh dev server on
`:5173` (**no** Playwright `webServer`), `yarn db:reset` before the suite, per
the recorded E2E execution prerequisites.

### D-16 ⚠ — Full E2E gates this phase (discussion F2, operator-confirmed 2026-08-20)

F2's default was conditional on B1-or-B2 being accepted. **Both were accepted**
(D-01, D-02), and the operator confirmed the affirmative branch explicitly.

**One full `yarn test:e2e` run** on a fresh dev server + clean DB is a phase
gate, under the **cardinal rule**: any failure blocks; a "did not run" counts as
a failure.

**AMENDED by A-05 — the stated rationale was factually wrong.** The claim that
"the Phase-122 bank-auth E2E specs exercise [the authorize endpoint] directly"
under `yarn test:e2e` is **false**: those specs are opt-in behind
`PLAYWRIGHT_BANK_AUTH`, which nothing sets. The full-suite gate stands, but it
proves only that D-01/D-02 broke nothing *else*. A-05 adds the opt-in run that
actually covers the changed endpoint.

### D-17 — Plan shape (discussion G1, G2, G3, G4)

**Partitioning — per package/area**, roughly six plans:

1. `question-info` — F15-A + D-01 (product fix) + D-03
2. `argument-condensation` — F15-B, F15-C, F16, F20-6, E9 + D-12 sweep
3. `dev-seed` — F18, F20-4
4. `apps/frontend` auth — F20-1 + D-02 (endpoint fix), F20-3
5. `apps/frontend` other — F17 (D-04), F20-2, and F20-5 (`packages/data`)
6. Ledger completion + gates (D-14, D-16)

**Sequential, not parallel waves.** Same hazard 139 hit by necessity: the
HYGIENE-LOOP's pre-gate asserts a clean tree, which a concurrent injection
anywhere violates — and one agent's `git checkout --` reverts another's live
injection. Durable test-file edits could parallelise; the injection runs cannot,
and they are the bulk of the work. Not worth the split.

**Non-autonomous plans:** the plan carrying **D-01** and the plan carrying
**D-02** get `autonomous: false` decision checkpoints, matching the Phase 138
D-06 fix-tier precedent. Everything else runs autonomously.

**Phase 141 overlap:** 141 added `test:unit` scripts to five packages and 142
edits tests inside four of them. No conflict expected — 141 is closed and
merged. Plans **re-read** the scripts rather than assuming them; the D-14 gate
proves the wiring still reaches the edited files.

### D-18 — Record propagation (discussion H1, H2)

- `.planning/audits/2026-08-11-fake-guard-sweep.md`: each of the 12 findings
  gets a remediation line naming **the commit and the ledger row**. Withdrawals
  (expected: none) get their reasoning in place, **struck rather than deleted**,
  per 139 § 6's precedent.
- `REQUIREMENTS.md:60` ASSERT-07: mark `[x]` with an evidence clause in the
  ASSERT-01 style — ledger path, count remediated, count withdrawn, and the
  negative-control **pair** count. Same for the ROADMAP phase line.

### D-19 — Standing todos this phase creates (discussion H3)

Captured via `/gsd-capture`, **not** left in prose:

1. The six unenumerated F19-class `!`-on-`null` sites in the two auth test files
   (D-05).
2. `getIdTokenClaims` missing negative tests — bad signature, wrong `issuer`,
   wrong `audience` (D-05).
3. Anything D-01 defers out of the minimal `question-info` product fix.

---

## Post-research amendments (operator-confirmed 2026-08-20)

`142-RESEARCH.md` measured the tree at HEAD `03eb3b183` and raised **five tensions**
between the locked decisions and what the code actually does. An independent
verification pass confirmed the load-bearing ones. Two were mechanical corrections
(A-02/A-03, A-04); three were put to the operator and decided (A-05, A-06, A-07).

These amendments **supersede** the decision text they name. Where a decision above
carries an `AMENDED by A-NN` marker, the amendment wins.

### A-01 — Measurement that closes three discretion items

`[VERIFIED at HEAD 03eb3b183]`

- **No rebuild is needed anywhere in this phase.** All 12 target tests import
  *source* specifiers, not built output. The HYGIENE-LOOP does **not** need a
  `yarn build` step between injection and run.
- **A turbo-cached green cannot mask an injection** — `test:unit` is declared
  `"cache": false`. No cache-busting step is required.
- Root `yarn test:unit` is **green at HEAD in ~20 s** across 11 workspaces /
  1 662 tests. D-14's 3× gate therefore costs about a minute from a green baseline.
- **D-03 resolves to *repoint*, not delete** — the `question-info` transform is
  **not** identity.
- **D-11 E4 resolves to `toBe` on a string** — `mockState.selectCalls[0]`'s recorded
  call is a string, not an array.
- **D-11 E5's exact count is 35** — `parseNominationTree(getTestData().nominations)`.
- **D-12's sweep finds exactly one** wall-clock site (the named one). The sweep still
  runs and is recorded; the expected yield is zero additional sites.
- **Line numbers have drifted** from 139's baseline `12825b479` (F20-1 +1, F20-4 +9,
  ten unchanged). Every injection is located **by content, not by line number**.

### A-02 — D-02's named fix is a runtime no-op; use a catch-arm re-throw

`[VERIFIED: node_modules/@sveltejs/kit/src/exports/index.js:75-81; independently re-confirmed]`

`error()` in `@sveltejs/kit@2.55.0` **throws unconditionally**. So
`throw error(400, …)` and `return error(400, …)` behave **identically**, and both are
swallowed by the same `catch`. D-02's first named option would change nothing.

**The fix must be one of:**

1. **Catch-arm re-throw** (preferred) — re-throw the `HttpError` at the top of the
   `catch` arm. An in-tree model exists at
   `apps/frontend/src/routes/api/oidc/callback/+server.ts:96-99`, though it
   duck-types on `'status' in e && 'location' in e` rather than using kit's
   `isHttpError`. **Prefer `isHttpError`** — it is exported by `@sveltejs/kit` and
   is the correct predicate for an `HttpError` (which has `status` but no
   `location`, and would slip through the duck-type check). It needs adding to the
   import at `authorize/+server.ts:13`.
2. **Guard hoist** — move the `!redirectUri` check above the `try` at `:18`.

**Measured structure of the authorize endpoint** `[VERIFIED]`: `try {` at `:18`,
guard `return error(400, …)` at `:22`, `catch (e)` at `:50`, `console.error` at
`:51`, `return error(500, …)` at `:52`, and **no** `isHttpError` check or re-throw.

**Sibling check — one more site found** `[VERIFIED]`:

- `apps/frontend/src/routes/api/oidc/token/+server.ts` — `try {` at `:19`, in-`try`
  `return error(401, …)` at `:29`, `catch (e)` at `:40`, `return error(401, …)` at
  `:42`. **Same swallow shape, no re-throw.** Outcome is benign (the catch re-emits
  an identical 401), but it mislabels a claims-validation failure as
  `'Token exchange failed:'` in the `console.error` at `:41`. Fix it in the same
  pass; it is the same one-line class. `DELETE` at `:46` has no try/catch and is
  unaffected.
- `apps/frontend/src/routes/api/oidc/callback/+server.ts` — throws `redirect(...)`,
  not `error(...)`, and **already re-throws** at `:96-99`. No change needed.

### A-03 — F20-1's negative control inverts post-fix: NEW half uses injection A

Supersedes D-10's literal "F20-1 — use injection B" for the **NEW** half only.

- **Pre-fix** (what 139 measured): the 400 is swallowed, so the caller sees the
  catch arm's value. Injection A (`:22`, 400→500) is zero-delta on the
  caller-observable axis — 139 § 8.3 **R-7 correctly rejects it**. Injection B
  (`:52` → `throw new TypeError`) is the discriminating one. **139 is right, for
  the pre-fix tree.**
- **Post-fix**: the 400 no longer travels through the catch arm, so `:52` is **off
  the path this test exercises**. Re-applying injection B post-fix leaves the
  strengthened `toMatchObject({ status: 400 })` **green** — precisely the
  proves-nothing control § 8.3 exists to prevent.
- **Post-fix, injection A is exactly on-axis** — the caller receives the `HttpError`
  built at `:22`, so changing its status to 500 reds the assertion. It is also,
  literally, the regression the audit names.

**Ledger shape for F20-1:**

| Half | Tree | Assertion | Injection | Expected |
|---|---|---|---|---|
| OLD | pre-fix, un-edited | `.rejects.toThrow()` | **B** @ `:52` | **PASS** (re-run per D-06) |
| NEW | post-fix, strengthened | `.rejects.toMatchObject({status:400})` | **A** @ `:22` | **FAIL (red)** ← success signal |
| supplementary | post-fix, strengthened | same | **B** @ `:52` | PASS — recorded as *evidence the swallow is gone*, **explicitly labelled "not the negative control"** |

Research marks the post-fix rows `[DERIVED]` — reasoned from measured control flow,
not executed, because executing them requires making the product change. **The
executor must confirm both halves by measurement.**

### A-04 — F15-A needs a NEW fixture; 139's stated target-2 must NOT be written

`[VERIFIED: measured against the real pipeline 2026-08-20]`

```
prompt[boolean] === prompt[categorical]   (SAME name, DIFFERENT type):  true   ← the real defect
prompt[boolean] === prompt[other boolean] (DIFFERENT name):             false  ← 139's target-2 comparison
```

The file's three "Configuration" blocks use three **differently-named** questions
(`:41`, `:92`, `:274`, `:331`), and `question.name` is interpolated into the prompt.
So 139 § 5.1.6's target 2 — pairwise inequality over the existing fixtures —
**passes today**, would **not** be closed by D-01, and would be **a new fake guard
shipped by the phase whose whole purpose is removing them.** Do not write it.

**Write instead:** a new fixture holding the question text **constant** and varying
only `type` (with `choices` on the categorical), most naturally beside the "Mixed
Question Type Scenarios" block at `:439`. This is **additional work the plan must
budget for** — a new test, not a rewrite of an existing assertion.

### A-05 ⚠ — E2E gate widened to include the opt-in bank-auth run (operator decision)

D-16's rationale was **false** `[VERIFIED twice — research + independent pass]`:

- `package.json:28` — `"test:e2e": "playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe"`. No wrapper, no turbo, nothing that sets the var.
- The `bank-auth` project exists only inside
  `...(process.env.PLAYWRIGHT_BANK_AUTH ? [...] : [])` at `tests/playwright.config.ts:420`;
  the `bank-auth-journey` family likewise at `:459`. The config's own docblock at
  `:260-267` lists them under **"OPT-IN projects (excluded from the default run)"**.
- `.github/workflows/main.yaml:246` runs plain `yarn test:e2e`; the only Playwright
  env var CI ever sets is `PLAYWRIGHT_VISUAL` (`:319`). **CI never runs bank-auth.**
- The only default-executed coverage of the authorize route is the **Vitest** unit
  suite — which is exactly the fake guard F20-1 names.

**Operator decision: run both.** The locked full `yarn test:e2e` gate stands
**and** the phase additionally runs:

```
PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c ./tests/playwright.config.ts   --project=bank-auth --project=bank-auth-journey
```

per the environment prerequisites in `tests/IDURA-TEST-RUNBOOK.md` (service-role +
anon keys present, identity-callback Edge Function served via
`supabase functions serve --no-verify-jwt`). Both runs are under the cardinal rule.
Without this, the one product change with an E2E surface ships unexercised.

### A-06 ⚠ — F17: honest `N/A — by construction` **plus** a supplementary pair (operator decision)

139 § 5.5.6 said it in advance: *"only remedy 1 makes the pre-specified regression
above red."* D-04 locks **remedy 2** (rename). So 139's `$effect` re-run-storm
injection is **green before and after** — the component is not in the test's module
graph — and § 8.3 **R-10 already forbids** using control D as the control. F17
therefore has **no available NEW half from 139's record**.

**Operator decision: do both.**

1. **Record the row honestly.** F17's `NEW-assertion outcome` cell reads
   **`N/A — by construction`**, with the reasoning inline: D-04 selected ROADMAP
   criterion 3's second branch; 139 § 5.5.6 and § 8.3 R-10 predicted in advance
   that the regression cannot red under that branch. The finding is **remediated,
   not withdrawn** — D-13's bar is not engaged and the withdrawal count stays **0**.
   This is a **scoped, pre-predicted exception to ROADMAP criterion 1** and must be
   visible in the ledger, in the phase record, **and** in the D-18 audit line —
   never silently absent.
2. **Supply a real pair for the contract the test now claims.** A **new**
   supplementary injection at
   `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts:19`
   discards the filter group's result while still invoking it:

   ```diff
   -  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
   +  const afterGroup = filterGroup ? (filterGroup.apply([...entities]), [...entities]) : [...entities]; // INJECTED (142)
   ```

   OLD half: `toHaveBeenCalledTimes(10)` **passes** (apply is still called once per
   cycle) → blindness demonstrated. NEW half: the rewritten value assertion
   **fails** at the first active cycle → the catch demonstrated.

   This is a **new** injection, **not** covered by D-06's citation rule: **both
   halves must be run**, and the ledger row must be labelled
   **"supplementary — not 139 § 5.5.2"**.

### A-07 ⚠ — F20-3's discriminating error code is accepted as a third product change (operator decision)

`getIdTokenClaims` returns `error: {}` for **both** F20-3 sites today, and both
sites reach the **same** branch — so D-11 E6's "differ observably" requires
splitting that branch into two error codes. E6 authorises it (*"adding one is in
scope as the minimum that makes the two titles distinguishable — flag it in the
plan rather than weakening the assertion"*); D-17's plan shape did not budget for it.

**Operator decision: accept.** It is a **third product change**, named as such, and
it goes through **plan 4's existing `autonomous: false` checkpoint** alongside D-02
— not smuggled in as an assertion edit. The consuming branch already exists at
`getIdTokenClaims.ts:48`. Note there is **no in-tree analog** for
`Object.assign(new Error(...), { code })`; write it fresh.

### A-08 — Recommended plan order (supersedes D-17's incidental listing)

Research recommends **3 → 2 → 5 → 1 → 4 → 6** (dev-seed → argument-condensation →
frontend-other → question-info → frontend-auth → ledger/gates), which front-loads
the test-only areas and defers both checkpointed product plans. D-17's *partitioning*
stands; only the running order is amended. The strict-sequential rule (D-06/D-07)
is unchanged.

**Ordering constraint inside a product-fix plan (plans 1 and 4):** D-06's OLD-half
re-run for F15-A and F20-1 must be measured **against the pre-fix tree** — i.e.
before the product change lands — because that is the tree 139's citation is being
replaced for. Sequence within those plans is: re-run OLD half → land product fix →
strengthen assertion → run NEW half.

### A-09 — Guard convention adopted from the pattern map

`expect(spy).toHaveBeenCalledTimes(1)` **before** dereferencing `mock.calls[0]`
(model: `pipeline.test.ts:76-77`). Without it a zero-call regression reds as a
`TypeError` on the wrong axis — a red the ledger **cannot credit**. This matters
more than usual in a phase where red is the success signal.

Also: **`packages/data`'s F20-5 injection is the one site under a `src/` that other
packages consume via `dist/`.** It must never be live during a root
`turbo run test:unit`.

### A-10 — Doc defect found in passing: file, do not fix

`tests/playwright.config.ts:334` and `:338` state that bank-auth *"run[s] by default
(opt-OUT via PLAYWRIGHT_NO_*)"*, contradicting `:260-267` and the code at `:420`.
Same class as the already-recorded `tests/README.md:124/:135` concurrency drift.
**Capture as a todo; do not fix in this phase.**

---

### Claude's Discretion

- Exact plan-file boundaries within D-17's six areas, provided the sequencing
  and the two non-autonomous checkpoints hold.
- Whether F20-4's exact-column assertion lands as `toBe` on a string or
  `toEqual` on an array — decided by the recorded call shape (D-11 E4).
- The concrete Faker-seeding mechanics for D-11 E2, provided the boundary
  property and the `LOCALE_BLOCK_SIZE`-from-constant rule hold.
- Whether D-03 ends in repoint or delete — determined by whether the transform
  is identity, with the finding recorded either way.

</decisions>

<canonical_refs>
## Canonical References

### Requirements and phase definition

- `.planning/REQUIREMENTS.md:60` — ASSERT-07 (the requirement this phase closes)
- `.planning/ROADMAP.md` Phase 142 detail (lines 469-483) — goal + 5 success criteria

### Phase 139 — the source of the corpus and the protocol

- `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md`
  - § 3.1 HYGIENE-LOOP (D-07) · § 3.2 two-column rule · § 3.3 collateral rule (D-08)
  - § 4 verdict table · § 4.3 "What Phase 142 consumes" + the four qualified records (D-10)
  - § 5.N.2 injection diffs · § 5.N.4 recorded OLD-half greens (D-06) · § 5.N.6 per-finding targets (D-11)
  - § 6 withdrawal/strike precedent (D-18) · § 7 limits 1, 3, 4, 6, 7 · § 8.1 collateral C-1/C-2/C-4 · § 8.3 the ten prohibited injections (D-10)
- Baseline commit for 139's measurements: `12825b479`

### Audit and prior phases

- `.planning/audits/2026-08-11-fake-guard-sweep.md` — the sweep this remediates (D-18)
- `141-CONTEXT.md` D-01 — per-package measurement; the five newly-wired packages
- Phase 138 D-06 — the fix-tier `autonomous: false` precedent (D-17)
- Phase 137 — served-app preflight, unchanged prerequisite (D-15)
- Phase 122 — bank-auth E2E specs that exercise the D-02 endpoint (D-16)

### Product files this phase changes

- `packages/question-info/src/.../infoGeneration.ts` — D-01 (and the `:76` substitute injection site, D-10)
- `packages/question-info/src/utils/responseTransformer.ts` — D-03
- `apps/frontend/src/routes/api/oidc/authorize/+server.ts:22,50,52` — D-02
- `apps/frontend/src/routes/api/oidc/token/`, `.../callback/` — D-02's sibling shape check

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **139's HYGIENE-LOOP** is a written, proven procedure — reused verbatim (D-07),
  not reinvented.
- **139's injection diffs** (§ 5.N.2) are pre-designed and validated, including
  the four qualifications and ten prohibitions (D-10).
- **`planValidation.test.ts:94`** is an in-tree model of the message-matcher
  shape F20-6 must adopt (D-11 E7).
- **`LOCALE_BLOCK_SIZE`** already exists as a constant in `dev-seed` — E2 asserts
  from it rather than restating 109 (D-11 E2).

### Established Patterns

- Ledger-before-work ordering (139, and `141-ASSERT10-LEDGER.md`): the full row
  set is written before the first measurement, so an unfilled row is visible and
  an absent one is impossible (D-09).
- Logs written **outside** the repo so the pre-gate's clean-tree assertion stays
  meaningful (D-07).
- Evidence clauses on requirement checkboxes in the ASSERT-01 style (D-18).

### Integration Points

- Phase 141's `test:unit` scripts on `core`, `matching`, `llm`, `question-info`,
  `argument-condensation` — four of the five hold files this phase edits. Plans
  re-read them; the D-14 gate proves reach.
- The OIDC authorize endpoint is on the Phase-122 bank-auth E2E path — the reason
  D-16 exists.

</code_context>

<specifics>
## Specific Ideas

- The negative-control columns **invert** relative to 139: there, the assertion
  had to go green under injection; here it must go **red**. Plan text should say
  this out loud at the top of every injection task, because an executor pattern-
  matching on 139's record will otherwise read a red as a failure.
- Two findings (F15-A, F20-1) are expected to be **red on the clean tree** until
  their product fix lands. That is the diagnosis, not a regression — D-01 and
  D-02 exist precisely because of it.
- The B1/B2 product fixes must land **before** their assertions are tightened
  within the same plan, or the plan's own intermediate state is red.

</specifics>

<deferred>
## Deferred Ideas

1. **Six F19-class `!`-on-`null` sites** in `authorize-endpoint.test.ts` /
   `getIdTokenClaims.test.ts` (139 § 7 limit 6, § 8.1 C-2/C-4) — ASSERT-03's
   class; Phase 140 closed. → standing todo (D-19 i).
2. **`getIdTokenClaims` negative tests** for bad signature / wrong `issuer` /
   wrong `audience` — a coverage gap, not a fake guard. → future coverage phase
   (D-19 ii).
3. **Anything D-01 defers** out of the minimal `question-info` product fix —
   captured at the time it is identified (D-19 iii).
4. **Mounting `EntityListWithControls`** for a real reactivity test — needs the
   appContext + locale + i18n harness and touches Spike-024 territory. Explicitly
   rejected here (D-04); worth its own phase if component-level testing is ever
   wanted.

</deferred>
