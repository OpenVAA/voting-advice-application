# Phase 139: Single-Source Sweep Findings — Confirm or Withdraw - Research

**Researched:** 2026-08-14
**Domain:** Test-assertion forensics — mutation-style injection evidence over an existing vitest corpus
**Confidence:** HIGH (every site re-read from the live tree this session; every run command executed and observed green)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** **Break-and-run every finding — all 13 sites**, not the ROADMAP's criterion-2
  minimum of one. For each finding: inject the regression the finding claims its assertion
  cannot detect, run the test, and record the observed PASS/FAIL against the verdict reached on
  paper. A finding that reads blind but **fails** correctly under injection is withdrawn
  (criterion 2), subject to D-02. Rationale: the run corpus IS Phase 142's negative-control
  corpus — producing it here satisfies criterion 3 by construction rather than by prose.
- **D-02:** **Vacuous-but-red assertions are CONFIRMED as written, with the mitigation recorded
  on the verdict.** F19 is the type case: `expect(null).toBeDefined()` passes, so the assertion
  is structurally incapable of detecting absence — that is the finding — but the following line
  (`requestParam!.split('.')`, `jose.decodeJwt(...)`) throws a `TypeError`, so the test still
  red-lights. Cost is diagnosis time, not coverage. Do **not** read criterion 2's "fails
  correctly → withdraw" as reaching this class. — **Reversibility:** costly — withdrawing F19
  instead would shrink ASSERT-03/Phase 140 as well as ASSERT-07/Phase 142, and re-expanding
  scope after a recorded withdrawal means reopening a struck audit finding.
- **D-03:** **Injection hygiene: inject → run → `git checkout -- <path>` → assert
  `git status --porcelain` is clean, per finding.** No injected break may survive into the next
  finding's run or into any commit. Not a scratch branch (a mid-run interruption would leave 13
  live regressions in the tree) and not scratchpad copies (breaking a copy changes the module
  graph, so the evidence would be about the copy rather than the shipped file).
- **D-04:** **The injected diff is recorded verbatim** — the exact `-`/`+` lines — beside each
  verdict, together with the observed PASS/FAIL. Phase 142 re-applies it mechanically. Prose
  descriptions of the regression are not sufficient; re-deriving the diff at remediation time is
  exactly the invention criterion 3 exists to prevent.
- **D-05:** F15 (`packages/question-info`, `packages/argument-condensation`), F16 and the F20
  `planValidation.test.ts` row live in packages with **no `test:unit` script** — verified:
  `question-info` and `argument-condensation` expose only `test` / `test:watch`, so
  `turbo run test:unit` never reaches them. Phase 139 runs them **ad hoc, in-package**
  (`cd packages/argument-condensation && npx vitest run <file>`) and records the exact command
  in the evidence. **No wiring changes.** Adding the scripts here would pre-empt Phase 141 and
  risk surfacing unrelated package failures in the middle of a verdict pass.
- **D-06:** **F17 gets a verdict too, explicitly flagged as out-of-criterion-1.** F17 is named in
  ASSERT-07 but absent from Phase 139's criterion 1 (the auditor read it directly — "Confidence:
  high (read directly)" — so it is not single-source). It is one file and self-evident
  (`10 === 10` arithmetic over the test's own `for` loop), and Phase 142 needs a pre-specified
  regression for it regardless. Recording it here costs little and stops Phase 142 reading the
  omission as a withdrawal.

### Claude's Discretion

- **Verdict record location** (not selected for discussion). Planner's call, with this default:
  a phase-local `139-VERDICTS.md` carrying the per-finding verdict + re-quoted `file:line` +
  verbatim injected diff + observed PASS/FAIL, **plus** in-place edits to
  `.planning/audits/2026-08-11-fake-guard-sweep.md` for any withdrawal (criterion 4 forces the
  audit edit regardless — the shrink must be visible in the record, not silent).
- Ordering of the 13 injections, and whether to batch by package to amortise vitest startup.

### Deferred Ideas (OUT OF SCOPE)

- **Wiring `question-info` + `argument-condensation` into `test:unit`** — Phase 141
  (UNIT-01..04). Explicitly rejected for 139 (D-05).
- **Every repair** — Phase 140 (F3/F9/F10/F19 matchers) and Phase 142 (F15/F16/F17/F18/F20
  assertion redesign). 139 issues verdicts and pre-specifies regressions; it fixes nothing.
- **`getIdTokenClaims` missing negative tests** (bad signature / wrong issuer / wrong audience) —
  a coverage gap, not a fake guard. Belongs in a future coverage phase, not in ASSERT-07.
- **Test-runbook concurrency doc drift** (Phase 138 F-2, `tests/README.md:124`/`:135` vs
  `tests/playwright.config.ts:514-517`) — already filed in STATE.md deferred items; unrelated to
  this phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description (verbatim, `.planning/REQUIREMENTS.md`) | Research Support |
|----|-----------------------------------------------------|------------------|
| **ASSERT-01** (`REQUIREMENTS.md:54`) | `- [ ] **ASSERT-01**: The single-source findings — F15, F16, F18, F19 and the F20 table — are re-read against the live code and each is independently **confirmed or withdrawn** before any remediation is planned around it.` | §Site Inventory re-reads all 14 sites from the current tree with quoted assertion text and current line numbers; §Injection Catalogue pre-specifies a one-line regression per site; §Run Vehicles gives the executed, observed-green command per site. |
| **ASSERT-07** (`REQUIREMENTS.md:60`) — *edit target for criterion 4, not this phase's requirement* | `- [ ] **ASSERT-07**: **F15, F16, F17, F18, F20** — each finding that survives ASSERT-01 either asserts observable output rather than wiring, or is explicitly withdrawn with the reasoning recorded.` | §Criterion-4 Edit Targets gives the exact file/line coordinates of every place ASSERT-07's scope is stated, so a withdrawal can be propagated without a hunt. |

**Both requirement texts above are `[VERIFIED: .planning/REQUIREMENTS.md:54,60]` — read this session, quoted verbatim.**

ROADMAP Phase 139 heading is at `[VERIFIED: .planning/ROADMAP.md:339]`; the phase block runs to
`:352` (Phase 140's heading is at `:353`) — matching CONTEXT's `:339-352`.
</phase_requirements>

---

## Summary

Phase 139 is not a research-heavy domain problem. Every question it needs answered is answerable by
reading this repository, and this session read all of it. The headline is that **the phase is
cheaper and safer than the CONTEXT anticipated, and has exactly three traps.**

**Cheap:** all 14 sites are already reachable, all 14 baseline-run green, and the *entire* corpus
runs in **under 4 seconds of wall clock across five vitest invocations** — measured this session,
not estimated. `npx vitest run <file>` works verbatim from `packages/question-info` and
`packages/argument-condensation` (D-05's proposed command shape is correct; the hoisted root
`node_modules/.bin/vitest` resolves through npx's ancestor walk). No test in the corpus needs a
running Supabase, a dev server, a network call, an API key, or an env var — every external surface
is `vi.mock`ed. And **no injection requires a `yarn build`**, because every one of the 14 test files
imports its code-under-test through a *source* specifier (a relative `../src/...` path or a `$lib`
alias), never through a package `dist/`. That removes the single largest false-negative hazard the
brief asked about.

**Safe:** the linked-worktree / pre-dirty-tree problem the brief flagged is already solved in this
repo's own precedent. `git status --porcelain` is non-empty out of the gate (` M .vscode/settings.json`,
` M supabase/.temp/cli-latest`), so D-03's bare form would be false on every iteration. Phase 138's
`138-NEGATIVE-CONTROL.md` § 4.1 already established and used the correct scoped form —
`git status --porcelain tests/ apps/ packages/` — and this session verified it returns empty on the
current tree. Use that, not the bare form.

**The three traps** are all in injection *design*, and each would produce a wrong verdict if
executed naively. (1) **F15-A is un-injectable as the audit words it** — `packages/question-info/src/`
contains zero references to question type or choices, so "a `generateQuestionInfo` that ignored
question type" is *already the shipped behaviour*; a substitute regression must be chosen. (2) **F20-6
(`planValidation.test.ts:104`) inverts under the obvious injection** — deleting the invariant makes the
test fail, which reads as a withdrawal, but the finding is about *message discrimination*, so the
correct injection swaps the error message rather than removing the throw. (3) **F19's three sites
produce a passing assertion inside a failing file** — the record needs two separate observed columns
(assertion outcome vs. file outcome) or D-02's whole distinction collapses into the raw exit code.

**Primary recommendation:** plan five wave-parallel injection batches keyed to the five run vehicles
(`question-info`, `argument-condensation`, `dev-seed`, `data`, `frontend`), with the per-site injected
diffs taken verbatim from §Injection Catalogue below; gate each iteration on
`git status --porcelain tests/ apps/ packages/` returning empty; and record each verdict against the
`138-NEGATIVE-CONTROL.md` section shape given in §Record Shape.

---

## Architectural Responsibility Map

The "tiers" here are the five test-execution vehicles. Every one of the 14 sites is owned by exactly
one, and the mapping determines both the run command and the batching.

| Capability (site cluster) | Primary Tier (run vehicle) | Secondary Tier | Rationale |
|---|---|---|---|
| F15-A — `questionTypes.test.ts` (10 assertion sites, 7 tests) | `packages/question-info` (ad-hoc `npx vitest run`) | — | No `test:unit` script (D-05). Injection target is `packages/question-info/src/core/infoGeneration.ts`. |
| F15-B/C, F16, F20-6 — `condenserStandalone` / `condenseQuestions` / `handleQuestion` / `planValidation` | `packages/argument-condensation` (ad-hoc `npx vitest run`) | — | No `test:unit` script (D-05). Four of the 14 sites share one vehicle — the best batching win. |
| F18, F20-4 — `templates/default.test.ts`, `supabaseAdminClient.test.ts` | `packages/dev-seed` (`test:unit` exists) | ad-hoc `npx vitest run` | `"test:unit": "vitest run --passWithNoTests"` exists, but per-file ad hoc is faster and isolates collateral. |
| F20-5 — `variants.test.ts` | `packages/data` (`test:unit` exists) | ad-hoc `npx vitest run` | Test lives *inside* `src/`, not `tests/`; only workspace dep is `@openvaa/core`. |
| F17, F19 ×3, F20-1/2/3 — 8 sites across 6 files | `apps/frontend` (`test:unit` exists, jsdom) | — | One `npx vitest run <6 files>` covers every frontend site; measured 629 ms, 52 tests green. |

**Consequence for planning:** four vehicles, not thirteen. The 13 (+F17 = 14) injections collapse
into **5 run vehicles / 11 distinct injection target files**, because two pairs of sites share a
single injection line (see §Shared-Injection Pairs).

---

## Site Inventory — all 14 sites re-read from the live tree

Every row below was opened with `Read`/`sed` this session and the assertion text is quoted
**verbatim**. "Drift" compares the audit's cited line range to what is actually there today.

### F15-A — `packages/question-info/tests/questionTypes.test.ts` (540 lines)

`[VERIFIED: packages/question-info/tests/questionTypes.test.ts:84,139,199,263,323,387,532,535-537]`
— **no drift; every audit-cited line is exact.**

| Line | Verbatim assertion |
|---|---|
| 84 | `      expect(results[0].data.infoSections).toBeDefined();` |
| 139 | `      expect(results[0].data.terms).toBeDefined();` |
| 199 | `      expect(results[0].data.infoSections).toBeDefined();` |
| 263 | `      expect(results[0].data.terms).toBeDefined();` |
| 323 | `      expect(results[0].data.infoSections).toBeDefined();` |
| 387 | `      expect(results[0].data.terms).toBeDefined();` |
| 532 | `      expect(results.every((r) => r.data.infoSections && r.data.terms)).toBe(true);` |
| 535 | `      expect(results[0].data.infoSections![0].title).toBe('Tax Policy');` |
| 536 | `      expect(results[1].data.infoSections![0].title).toBe('Income Inequality Priority');` |
| 537 | `      expect(results[2].data.infoSections![0].title).toBe('Policy Preference Analysis');` |

**Correction to the audit's characterisation.** The audit says all these sites are "variations of
`expect(results[0].data.infoSections).toBeDefined()`". Lines **535-537 are not** — they assert exact
title strings. They are still mock-in/mock-out (the titles are the very strings the test fed to
`mockLLMProvider.generateObjectParallel.mockResolvedValue` twenty lines earlier), so the finding's
*substance* survives, but the verdict body must correct the *description*. There is also an
unlisted `expect(results[0].data.terms).toHaveLength(3);` at `:388` in the same cluster.

**Mock handle for injection** `[VERIFIED: packages/question-info/tests/questionTypes.test.ts:14-17]`:
```ts
const mockLLMProvider = {
  generateObjectParallel: vi.fn()
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
```

### F15-B — `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts` (222 lines)

| Audit cite | Actual | Drift |
|---|---|---|
| `:130-141` | assertion block is **`:131-142`** (`:130` and `:141` are comment lines) | +1 |
| `:181-183` | assertions are at **`:184-185`** | **+3 — report this** |

`[VERIFIED: packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:131-142]`:
```ts
    expect(result).toBeDefined();
    expect(result.condensationType).toBe(CONDENSATION_TYPE.LikertPros);

    // Check metrics
    expect(result.llmMetrics).toBeDefined();
    expect(result.llmMetrics.nLlmCalls).toBeGreaterThan(0);
    expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0);
    expect(result.llmMetrics.tokens).toBeDefined();
    expect(result.llmMetrics.tokens.totalTokens).toBeGreaterThan(0);

    // Verify LLM provider was called
    expect(input.options.llmProvider.generateObjectParallel).toHaveBeenCalled();
```
`[VERIFIED: …:184-185]`:
```ts
    expect(result.condensationType).toBe(CONDENSATION_TYPE.LikertCons);
    expect(result.llmMetrics.nLlmCalls).toBeGreaterThan(0);
```
The audit's core claim holds exactly: **`result.arguments` is never touched in either block.**
The flake-capable incidental CONTEXT §Specifics asks to carry forward is `:137`
(`expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0);`).

### F15-C — `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts` (407 lines)

`[VERIFIED: …/condenseQuestions.test.ts:139-145,215-219,268-274]` — **no drift.**
```
139  expect(results).toBeDefined();
140  expect(results).toHaveLength(2); // Should have one result for pros, one for cons
144  expect(types).toContain(CONDENSATION_TYPE.LikertPros);
145  expect(types).toContain(CONDENSATION_TYPE.LikertCons);
215  expect(results).toBeDefined();
216  expect(results).toHaveLength(3); // Should have one result for 'cat1', 'cat2', and 'cat3'
219  expect(results.every((r) => r.condensationType === CONDENSATION_TYPE.CategoricalPros)).toBe(true);
268  expect(results).toBeDefined();
269  expect(results).toHaveLength(2); // Should have one result for pros, one for cons
273  expect(types).toContain(CONDENSATION_TYPE.BooleanPros);
274  expect(types).toContain(CONDENSATION_TYPE.BooleanCons);
```

### F16 — `packages/argument-condensation/tests/unit/handleQuestion.test.ts` (70 lines)

`[VERIFIED: packages/argument-condensation/tests/unit/handleQuestion.test.ts:56,68]` — the
`await expect(` opens at `:56` and `).rejects.toThrow();` closes at `:68`. **No drift on the site.**
Two supporting cites drift by one: the audit's "mock … (lines 19-26)" is actually `:19-27`
(`generateObject:` at `:19`, `streamText:` at `:25`), and "`entities` is `[]` (line 53)" is
`[VERIFIED: …:54]` — `    const entities: Array<HasAnswers> = [];`

Competing-throw proof `[VERIFIED: packages/argument-condensation/tests/unit/defineCondensationPlan.test.ts:71]`:
```ts
    ).rejects.toThrow('There must be at least one comment to process.');
```
— exact, no drift.

### F17 — `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` (138 lines)

`[VERIFIED: …/EntityListWithControls.test.ts:84-95]` — exact, no drift. The `it(` opens at `:84`,
`expect(group.applySpy).toHaveBeenCalledTimes(10);` is at `:94`, `});` closes at `:95`.

### F18 — `packages/dev-seed/tests/templates/default.test.ts`

`[VERIFIED: packages/dev-seed/tests/templates/default.test.ts:121-135]` — exact, no drift.
```
121  it('Test 10: faker locale cycling — 109 candidates per locale block (en/fi/sv)', () => {
130    for (const idx of [0, 109, 218]) {
132      expect(r.first_name).toBeTruthy();
133      expect(r.last_name).toBeTruthy();
```

### F19 — three sites, all exact, no drift

| Site | Verbatim |
|---|---|
| `[VERIFIED: apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144]` | `    expect(requestParam).toBeDefined();` (preceded by `:143` `const requestParam = url.searchParams.get('request');`; followed by `:147` `const parts = requestParam!.split('.');`) |
| `[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:148]` | `      expect(requestParam).toBeDefined();` (same three-line shape) |
| `[VERIFIED: apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:167]` | `    expect(assertion).toBeDefined();` (preceded by `:166` `const assertion = capturedFetchBody!.get('client_assertion')!;`) |

### F20 — six rows, all exact, no drift

| # | Site | Verbatim assertion |
|---|---|---|
| F20-1 | `[VERIFIED: apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233]` | `    await expect(POST(event)).rejects.toThrow();` (title at `:228`: `it('returns 400 when redirectUri is missing', async () => {`) |
| F20-2 | `[VERIFIED: apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36]` | `:32` `test('getOverride returns raw template on ICU parse error', () => {` … `:36` `expect(typeof result).toBe('string');` |
| F20-3 | `[VERIFIED: apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259]` | both `      expect(result.success).toBe(false);` (titles at `:224`-ish `…kid not in JWKS` and `:239` `it('returns success=false when kid does not match available keys', …`) |
| F20-4 | `[VERIFIED: packages/dev-seed/tests/supabaseAdminClient.test.ts:151]` | `      expect(mockState.selectCalls[0]).toContain('id');` |
| F20-5 | `[VERIFIED: packages/data/src/objects/nominations/variants/variants.test.ts:5-12]` | whole 12-line file; `:9` `    expect(d.electionId).toBeDefined();`, `:10` `    expect(d.constituencyId).toBeDefined();` inside a `forEach` with **no length guard** |
| F20-6 | `[VERIFIED: packages/argument-condensation/tests/unit/planValidation.test.ts:104]` | `    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow();` |

**Drift summary for the planner:** 12 of 14 sites are line-exact. Two carry small drift
(condenserStandalone `:181-183` → `:184-185`, three lines; handleQuestion's supporting `entities`
cite `:53` → `:54`, one line). **No site has moved file, and no site has been repaired.** The
audit's substantive claims survived every re-read except the F15-A description correction noted above.

---

## Run Vehicles — verified, not inferred

Everything in this section was **executed this session** and the output observed. Nothing here is
training knowledge.

### Package script inventory `[VERIFIED: */package.json, read this session]`

| Workspace | `test:unit`? | Scripts present | vitest devDep | vitest config |
|---|---|---|---|---|
| `packages/question-info` | **NO** | `test`, `test:watch` | `catalog:` → `^3.2.4` | `vitest.config.ts` with `setupFiles: ['./tests/setup.ts']` |
| `packages/argument-condensation` | **NO** | `test`, `test:watch` | `catalog:` → `^3.2.4` | `vitest.config.ts` with `setupFiles: ['./tests/setup.ts']` |
| `packages/dev-seed` | **YES** — `vitest run --passWithNoTests` | — | `catalog:` | `vitest.config.ts` = `export default {};` |
| `packages/data` | **YES** — `vitest run --passWithNoTests` | — | `catalog:` | `vitest.config.ts` = `export default {};` |
| `apps/frontend` | **YES** — `vitest run` | `test:unit:watch` | — | `vitest.config.ts` (svelte plugin, jsdom, `$lib`/`$app`/`$env` aliases) |

D-05's premise is **confirmed exactly**: `question-info` and `argument-condensation` expose only
`test`/`test:watch`, and `turbo.json`'s `test:unit` task
`[VERIFIED: turbo.json:11-14]` (`"dependsOn": ["build"], "cache": false`) silently skips workspaces
lacking the script. `vitest.workspace.ts` `[VERIFIED: vitest.workspace.ts:1]` is
`export default ['packages/**/vitest.config.ts'];` — note this glob **excludes `apps/frontend`**.

### Binary resolution — verified three ways from `packages/question-info`

```
$ npx --no-install vitest --version   →  vitest/3.2.4 darwin-arm64 node-v24.14.1
$ yarn exec vitest --version          →  vitest/3.2.4 darwin-arm64 node-v24.14.1
$ node -e "console.log(require.resolve('vitest'))"
  → /Users/…/voting-advice-application-gsd/node_modules/vitest/index.cjs
```
`.yarnrc.yml` sets `nodeLinker: node-modules` `[VERIFIED: .yarnrc.yml:1]`, so vitest is hoisted to
the **root** `node_modules/.bin/vitest` (a symlink to `../vitest/vitest.mjs`); no workspace has a
local `.bin/vitest`. npx's ancestor walk finds the root binary. **`npx vitest run <file>` from the
package directory works — D-05's proposed command is correct verbatim.** `yarn exec vitest` is an
equally valid fallback; no `yarn workspace … exec` form is needed.

### Baseline runs — all executed, all green

| Vehicle | Command (run from the workspace dir) | Observed |
|---|---|---|
| question-info | `npx vitest run tests/questionTypes.test.ts` | **7 passed / 7**, 463 ms |
| argument-condensation (unit) | `npx vitest run tests/unit/planValidation.test.ts tests/unit/handleQuestion.test.ts` | **11 passed / 11**, 438 ms |
| argument-condensation (standalone) | `npx vitest run tests/condensation/condenserStandalone.test.ts` | **3 passed / 3**, 400 ms |
| argument-condensation (questions) | `npx vitest run tests/condensation/condenseQuestions.test.ts` | **5 passed / 5**, 476 ms |
| dev-seed | `npx vitest run tests/templates/default.test.ts tests/supabaseAdminClient.test.ts` | **34 passed / 34**, 450 ms |
| data | `npx vitest run src/objects/nominations/variants/variants.test.ts` | **1 passed / 1**, 378 ms |
| frontend (all 8 sites, one invocation) | `npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts src/lib/api/utils/auth/__tests__/token-endpoint.test.ts src/lib/api/utils/auth/providers/idura.test.ts src/lib/api/utils/auth/getIdTokenClaims.test.ts src/lib/i18n/tests/overrides.test.ts src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` | **52 passed / 52** across 6 files, 629 ms |

**Total corpus wall clock: ~3.2 s across 7 invocations.** Batching by vehicle (5 invocations) makes
the amortisation question CONTEXT left to discretion essentially moot — the per-invocation startup is
~400 ms, so 13 sequential single-file runs cost ~5 s. Batch for *isolation clarity*, not for speed.

**Benign stderr to expect, not to diagnose:**
- question-info: `[PromptRegistry] Package 'question-info' already registered, skipping.`
- token-endpoint: `Token exchange failed: HttpError { status: 401, … }` ×3 (deliberate negative paths)
- authorize-endpoint: `Failed to construct authorization request: HttpError { status: 400, … }`
- condenseQuestions: `Only 1 comments for question "…"`, `Found 1 pros!`, `Found 1 cons!`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node | every run | ✓ | v24.14.1 | — |
| vitest (root hoist) | every run | ✓ | 3.2.4 | `yarn exec vitest` |
| Yarn 4 | script resolution | ✓ | 4.13.0 (`.yarn/releases/yarn-4.13.0.cjs`) | — |
| Built `dist/` of `core`,`data`,`llm`,`app-shared`,`matching` | package imports of `@openvaa/*` | ✓ all present | — | `yarn build` |
| Running Supabase | **none of the 14 sites** | n/a | — | — |
| Dev server / Playwright | **none of the 14 sites** | n/a | — | — |
| Network / LLM API key | **none of the 14 sites** | n/a | — | — |
| Env vars (`.env`) | **none of the 14 sites** | n/a | — | — |

**Missing dependencies with no fallback:** none.

### False-negative hazard analysis (the brief's question 3)

This is the load-bearing environmental finding, so it is stated as a claim with its evidence.

**Claim: no injection in this phase requires a `yarn build`, because every one of the 14 test files
imports its code-under-test through a source specifier, never through a package `dist/`.**
`[VERIFIED: import lines read this session in all 14 files]`

```
packages/question-info/tests/questionTypes.test.ts:11        import { generateQuestionInfo } from '../src/api';
…/condenserStandalone.test.ts:3                              import { Condenser } from '../../src/core/condensation/condenser';
…/condenseQuestions.test.ts:10                               import { handleQuestion } from '../../src/api.ts';
…/unit/handleQuestion.test.ts:4                              import { handleQuestion } from '../../src/api';
…/unit/planValidation.test.ts:3                              import { validatePlan } from '../../src/core/utils/condensation/planValidation';
packages/dev-seed/tests/templates/default.test.ts:15         import { candidatesOverride } from '../../src/templates/defaults/candidates-override';
packages/dev-seed/tests/supabaseAdminClient.test.ts:111      import { SupabaseAdminClient } from '../src/supabaseAdminClient';
packages/data/src/objects/nominations/variants/variants.test.ts:2   import { parseNominationTree } from './variants';
apps/frontend/src/lib/i18n/tests/overrides.test.ts:2         import { clearOverrides, getOverride, setOverrides } from '../overrides';
apps/frontend/…/EntityListWithControls.test.ts:2             import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';
apps/frontend/…/getIdTokenClaims.test.ts:13                  import { getIdTokenClaims } from './getIdTokenClaims';
apps/frontend/…/providers/idura.test.ts:13                   import { iduraProvider } from './idura';
apps/frontend/…/__tests__/token-endpoint.test.ts:131         const { POST } = await import('../../../../../routes/api/oidc/token/+server');
apps/frontend/…/__tests__/authorize-endpoint.test.ts         (same dynamic-import shape for .../authorize/+server)
```
Every §Injection Catalogue target file below is inside one of those source graphs. `@openvaa/*`
workspace deps *do* resolve through `dist/` — but **no injection targets one**, so a stale `dist`
cannot silently swallow an injected regression. If a future planner adds an injection into
`packages/core|data|llm|app-shared|matching`, that immunity is void and a rebuild becomes mandatory.

**Claim: every external surface in the corpus is mocked, so no run can go red for an environmental
reason.** `[VERIFIED: vi.mock lines read this session]`
- `authorize-endpoint.test.ts:54-68` and `token-endpoint.test.ts:58-70` mock
  `$env/dynamic/public`, `$env/dynamic/private`, `$lib/server/constants`, `$lib/utils/constants`.
- `idura.test.ts:39-60` and `getIdTokenClaims.test.ts:28-60` mock the same env modules; the latter
  additionally mocks `jose` (`vi.mock('jose', async (importOriginal) => …`) so `createRemoteJWKSet`
  never touches the network.
- `packages/dev-seed/tests/supabaseAdminClient.test.ts:1-14` header states the contract:
  *"D-22: pure I/O contract — no real Supabase contact"*, and mocks `@supabase/supabase-js`'s
  `createClient`.
- `packages/dev-seed/tests/templates/default.test.ts:1-9` header: *"D-22 contract: pure I/O. No
  Supabase imports, no `createClient`, no `.rpc()`."*
- question-info / argument-condensation setup files (`tests/setup.ts` in each) call
  `registerPrompts({ …, promptsDir: path.join(__dirname, '../src/prompts') })` — a **local
  filesystem** read of in-repo prompt YAML, despite the config comment's word "download". No network.

**The one real environmental side effect** `[VERIFIED: packages/argument-condensation/src/core/condensation/condenser.ts:197-199]`:
```ts
    const treeFilePath = path.join(process.cwd(), 'data/operationTrees', `${this.runId}.json`);
    await this.treeBuilder.saveTree(treeFilePath);
```
`Condenser.run()` writes JSON to `<cwd>/data/operationTrees/`. Run from
`packages/argument-condensation`, that is `packages/argument-condensation/data/operationTrees/`,
which is gitignored `[VERIFIED: packages/argument-condensation/.gitignore:3 — "data/operationTrees"]`.
**Verified empirically:** after running both condensation suites this session,
`git status --porcelain tests/ apps/ packages/` still returned empty. So the writes do **not**
break D-03's cleanliness gate. Two caveats: (a) they accumulate on disk across runs, and
(b) running these suites from the **repo root** instead of the package dir would write to
`<repo-root>/data/operationTrees/`, which is **not** gitignored and *would* dirty the tree. Always
`cd` into the workspace.

---

## Injection Catalogue — a candidate regression per site

Each entry gives the target file, the one-line diff in the `-`/`+` shape D-04 requires, and the
**predicted** outcome. Predictions are reasoning from the read code, tagged accordingly — the phase's
job is to replace each prediction with an observation.

### Shared-Injection Pairs

Two injections each cover two sites. The planner must still write two verdict rows, noting the shared line.

- **`idura.ts:74`** covers **F19a** (`authorize-endpoint.test.ts:144`) and **F19b** (`idura.test.ts:148`).
  Verified that the authorize route selects the Idura provider: `authorize-endpoint.test.ts:73-79`
  generates an RS256 pair with the comment *"Generate RS256 signing key pair for Idura JAR construction"*.
- **`condenser.ts` return block** covers **F15-B** and **F15-C** (both exercise `Condenser.run()`).

---

### F15-A — `questionTypes.test.ts` ⚠ **TRAP 1 — un-injectable as worded**

**Audit's named regression:** *"A `generateQuestionInfo` that ignored question type entirely, or that
passed the LLM response through untouched, keeps all 540 lines green."*

**Finding that changes the plan** `[VERIFIED: grep over packages/question-info/src/, this session]`:
`packages/question-info/src/` contains **zero** references to `question.type`, `QUESTION_TYPE`, or
`choices`. The prompt variables are built at
`[VERIFIED: packages/question-info/src/core/infoGeneration.ts:74-81]`:
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
**Question type is already ignored by the shipped code.** The audit's first clause therefore has no
injectable delta — you cannot break what is already broken, and an injection producing green proves
nothing new. This *strengthens* F15 substantively (the "Configuration 1/2/3" organisation is pure
theatre) while making the audit's literal injection impossible.

**Recommended substitute injection** — a real, catastrophic regression the 10 assertions cannot see:
```diff
  packages/question-info/src/core/infoGeneration.ts:75
-          question: question.name,
+          question: '',
```
Predicted: **all 7 tests stay green** — the provider is a bare `vi.fn()` whose resolved value is
fixed by the test, so the prompt is never read. `[ASSUMED — reasoning from the read code]`

**Second candidate matching the audit's second clause:** make `generateInfo` return the raw LLM
response untransformed (bypass `packages/question-info/src/utils/responseTransformer.ts`). Higher
blast radius; use only if the first is judged insufficiently faithful to the finding.

**Planner action required:** the verdict body must (a) record the substituted injection and *why*,
and (b) correct the audit's description of lines 535-537. Both are in-scope for a `confirmed` verdict —
neither is grounds for withdrawal.

### F15-B / F15-C — `Condenser.run()`

**Audit's named regression:** *"A `Condenser.run()` that discards every argument and returns
`{ arguments: [], llmMetrics }` passes."*

`[VERIFIED: packages/argument-condensation/src/core/condensation/condenser.ts:202-206]` — the return
block ends:
```ts
    return {
      runId: this.runId,
      condensationType: this.input.options.outputType,
      data: { arguments: currentData as Array<Argument> },
```
```diff
  packages/argument-condensation/src/core/condensation/condenser.ts:205
-      data: { arguments: currentData as Array<Argument> },
+      data: { arguments: [] },
```
Predicted: **condenserStandalone 3/3 green** (it asserts only echoed type + metrics + spy);
**condenseQuestions likely 4/5** — the three F15-C sites assert `results.toHaveLength(n)` on the
*per-group result array*, not on arguments, so they stay green, but the out-of-scope
`'It should create visualization data…'` test at `:331` reads `prosData.nodes` from the written tree
and **may** go red. `[ASSUMED — reasoning from the read code]`

**Collateral-failure rule the planner must encode:** a red result in a test that is *not* one of the
14 sites is **collateral**, not a verdict signal. Record it verbatim in the evidence and state
explicitly that it does not bear on the verdict. Without this rule, one collateral red will be
misread as "the assertion caught it" and produce a spurious withdrawal.

### F16 — `handleQuestion.test.ts:56-68`

**Audit's named regression:** *"Delete the language check entirely and this test still passes."*

`[VERIFIED: packages/argument-condensation/src/api.ts:116-122]`:
```ts
  // Check that the language is in supportedLocales in staticSettings
  const supportedLanguages = staticSettings.supportedLocales.map((locale) => locale.code);
  if (!supportedLanguages.includes(language)) {
    throw new Error(
      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
    );
  }
```
```diff
  packages/argument-condensation/src/api.ts:118-122
-  if (!supportedLanguages.includes(language)) {
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
-  }
+  // INJECTED (139): language validation removed
```
Predicted: **PASS (green)** — control falls through to `getAndSliceComments` / `createCondensationSteps`
with `entities: []`, whose throw is independently proven at `defineCondensationPlan.test.ts:71`
(`'There must be at least one comment to process.'`). The bare `.rejects.toThrow()` cannot tell the
two throws apart. `[ASSUMED — reasoning from the read code]` This is the cleanest injection in the
corpus after F20-4.

### F17 — `EntityListWithControls.test.ts:84-95` ⚠ **degenerate by construction (D-06, out-of-criterion-1)**

**Audit's named regression:** *"a `$derived` that re-runs on every keystroke, or an effect loop in
`EntityListWithControls.svelte`."*

`[VERIFIED: apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:2]` —
the file's **only** non-vitest import is
`import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';`.
`EntityListWithControls.svelte` **is not in this test's module graph at all.** The helper itself is
two statements `[VERIFIED: …/EntityListWithControls.helpers.ts:19-20]`:
```ts
  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
  return searchFilter ? searchFilter.apply(afterGroup) : afterGroup;
```
and `FakeGroup.apply` calls `applySpy` exactly once `[VERIFIED: …test.ts:39-42]`. The assertion is
`10 === 10` over the test's own loop, as the audit says.

**Injection (honest, and its degeneracy IS the evidence):**
```diff
  apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
   (after the existing `filtered` $derived)
+  // INJECTED (139): simulated re-run storm
+  $effect(() => { void computeFiltered(entities, activeFilterGroup, searchFilter); });
```
Predicted: **PASS (green)**, and trivially so — the injected module never loads. Record the
import-graph fact as the primary evidence and the green run as corroboration; do not present the
green run as if it were a discriminating experiment. `[ASSUMED — reasoning from the read code]`

### F18 — `default.test.ts:121-135`

**Audit's named regression:** *"Generating all 327 candidates with `en`, or changing
`LOCALE_BLOCK_SIZE` from 109, leaves every name truthy."*

`[VERIFIED: packages/dev-seed/src/templates/defaults/candidates-override.ts:53]`
`export const LOCALE_BLOCK_SIZE = 109;` and `[:133]` `const localeIdx = Math.floor(i / LOCALE_BLOCK_SIZE);`
with `LOCALE_ORDER = ['en', 'fi', 'sv'] as const` at `[:60]`.
**Consumer scope verified:** repo-wide grep over `packages/`, `apps/`, `tests/` finds
`LOCALE_BLOCK_SIZE` at exactly three places — `candidates-override.ts:53`, `:133`, and a *comment*
in `default.test.ts:125`. No other module imports it, so the blast radius is one file.
```diff
  packages/dev-seed/src/templates/defaults/candidates-override.ts:53
-export const LOCALE_BLOCK_SIZE = 109;
+export const LOCALE_BLOCK_SIZE = 327;
```
→ `Math.floor(i / 327) === 0` for all `i` in `[0, 327)` → every candidate uses `'en'`.
Predicted: **Test 10 PASSES** (names remain truthy). `[ASSUMED — reasoning from the read code]`
Test 9 (determinism, `:113-119`) compares two runs of the *same* mutated generator, so it should also
stay green. **Recommend running twice:** isolated (`npx vitest run tests/templates/default.test.ts -t 'Test 10'`)
and whole-file, and recording both — the isolated run is the verdict, the whole-file run documents collateral.

### F19a + F19b — `idura.ts:74` (one injection, two sites) ⚠ **TRAP 3 — two observed columns needed**

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/idura.ts:71-74]`:
```ts
    const authorizeUrl =
      `https://${constants.IDURA_DOMAIN}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&request=${requestObject}`;
```
```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:74
-      `&request=${requestObject}`;
+      ``;
```
Predicted, **per D-02**: the assertion at `authorize-endpoint.test.ts:144` / `idura.test.ts:148`
**PASSES** (`expect(null).toBeDefined()` passes), and the *file* then goes **RED** three lines later
at `requestParam!.split('.')` with `TypeError: Cannot read properties of null (reading 'split')`.
`[ASSUMED — reasoning from the read code + documented matcher semantics]`

**Record-design consequence (the most important in the phase).** If the verdict table has one
"observed" column it will read FAIL, and criterion 2's "reads blind but fails correctly → withdraw"
will fire — contradicting D-02 and shrinking Phase 140/ASSERT-03 by accident. The table **must**
carry two columns:

| Site | Assertion outcome | File outcome | Failing line |
|---|---|---|---|
| F19a `authorize-endpoint.test.ts:144` | **PASS** (blind) | **FAIL** | `:147` `requestParam!.split('.')` |

and the verdict must cite the *assertion* column. Capture the verbatim vitest failure block (as
`138-NEGATIVE-CONTROL.md` § 4.3.1 does) so the failing line number is visible in the record, not asserted.

### F19c — `token-endpoint.test.ts:167`

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/providers/idura.ts:97-103]`:
```ts
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion
      }).toString()
```
```diff
  apps/frontend/src/lib/api/utils/auth/providers/idura.ts:102
-        client_assertion: clientAssertion
+        client_assertion: undefined as unknown as string
```
(or delete the line). Same two-column shape as F19a/b: the assertion at `:167` passes on `null`;
the file reds at `:170` `assertion.split('.')`. Note the test's own `:166` uses a `!` non-null
assertion on `capturedFetchBody!.get(...)` — a TS-level lie that the runtime does not enforce.
`[ASSUMED — reasoning from the read code]`

### F20-1 — `authorize-endpoint.test.ts:233`

**Audit's named missed regression:** *"a 500, or a `TypeError` on a malformed event stub."*

`[VERIFIED: apps/frontend/src/routes/api/oidc/authorize/+server.ts:21-23]`:
```ts
    if (!redirectUri) {
      return error(400, { message: 'redirectUri is required' });
    }
```
```diff
  apps/frontend/src/routes/api/oidc/authorize/+server.ts:22
-      return error(400, { message: 'redirectUri is required' });
+      return error(500, { message: 'redirectUri is required' });
```
Predicted: **PASS (green)** — a bare `.rejects.toThrow()` cannot see the status code, so the test
titled `'returns 400 when redirectUri is missing'` is satisfied by a 500.
`[ASSUMED — reasoning from the read code]` A 500 handler already exists at `:52` of the same file, so
the injected shape is realistic rather than contrived.

### F20-2 — `overrides.test.ts:32-36`

**Audit's named missed regression:** *"returning `''`, the key name, or a half-formatted string."*

`[VERIFIED: apps/frontend/src/lib/i18n/overrides.ts:33-37]`:
```ts
  try {
    return new IntlMessageFormat(template, locale).format(params) as string;
  } catch {
    return template;
  }
```
```diff
  apps/frontend/src/lib/i18n/overrides.ts:36
-    return template;
+    return '';
```
Predicted: **PASS (green)** — `typeof '' === 'string'`. `[ASSUMED — reasoning from the read code]`
Zero collateral: the other six tests in the file exercise non-throwing paths.

### F20-3 — `getIdTokenClaims.test.ts:236,259`

**Audit's named missed regression:** *"failing for a *different* reason, or `getIdTokenClaims`
returning `{success:false}` unconditionally."*

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts:39-46]`:
```ts
    return {
      success: true,
      data: {
        firstName: `${payload.given_name}`,
        lastName: `${payload.family_name}`,
        identifier: `${payload.birthdate}`
      }
    };
```
```diff
  apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts:39-46
-    return {
-      success: true,
-      data: { … }
-    };
+    return { success: false, error: {} };
```
Predicted: **both sites PASS (green)**; the file's three success-path tests go **RED as collateral**
(file is 5 tests total). `[ASSUMED — reasoning from the read code]`

**Lower-collateral alternative** matching the audit's *first* clause: change the kid-lookup throw at
`:29` to a different message. The tests assert only `result.success`, never `result.error.code`
`[VERIFIED: getIdTokenClaims.ts:22 — the failure type is `{ success: false; error: { code?: string } }`]`,
so the substituted reason stays green with **zero** collateral. Recommend running **both** — they
prove the two distinct blind spots the audit names, and each is one edit.

### F20-4 — `supabaseAdminClient.test.ts:151` ✅ **the cleanest site in the corpus**

**Audit's named missed regression:** *"substring-matches `external_id`/`project_id`; the `id` column
being dropped (breaks portrait UUID mapping)."*

`[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:706-711]`:
```ts
    const { data, error } = await this.client
      .from('candidates')
      .select('id, external_id, first_name, last_name')
      .eq('project_id', this.projectId)
      .like('external_id', `${externalIdPrefix}%`)
      .order('external_id', { ascending: true });
```
```diff
  packages/dev-seed/src/supabaseAdminClient.ts:708
-      .select('id, external_id, first_name, last_name')
+      .select('external_id, first_name, last_name')
```
Predicted: **PASS (green)** — `'external_id, first_name, last_name'.includes('id')` is `true` via the
substring inside `external_id`. **Zero collateral:** the sibling assertions at `:152-155` cover
`external_id`/`first_name`/`last_name` (all still present), `:156-158` cover `eq`/`like`/`order`
(untouched), and `:159-160` assert on the *mocked* return data (independent of the select string).
`[ASSUMED — reasoning from the read code]`

**Planner note:** if D-01's 13-site scope ever has to be trimmed, this is the site to keep — it is
the ROADMAP criterion-2 minimum with the highest signal and the lowest blast radius.

### F20-5 — `variants.test.ts:5-12` — **two injections, both one-liners**

**Audit's named missed regressions:** *"vacuous if the parse returns `[]` (no length guard in the
file); also blind to the *wrong* ID being propagated."* — two distinct claims, so record two.

`[VERIFIED: packages/data/src/objects/nominations/variants/variants.ts:93-101]`:
```ts
export function parseNominationTree(tree: NominationVariantTree): Array<AnyNominationVariantPublicData> {
  …
  for (const electionId in tree) {
    for (const constituencyId in tree[electionId]) {
        …tree[electionId][constituencyId].map((n) => ({
          …
          electionId,
          constituencyId
```

**Injection 5a — vacuity:**
```diff
  packages/data/src/objects/nominations/variants/variants.ts:94
+  return []; // INJECTED (139)
```
Predicted: **PASS (green)** — `[].forEach(…)` executes zero assertions; vitest counts zero-assertion
tests as passing. `[ASSUMED — reasoning from the read code]`

**Injection 5b — wrong ID:**
```diff
  packages/data/src/objects/nominations/variants/variants.ts:100
-          electionId,
+          electionId: 'WRONG-ELECTION-ID',
```
Predicted: **PASS (green)** — `toBeDefined()` is satisfied by any non-`undefined` value.
`[ASSUMED — reasoning from the read code]`

### F20-6 — `planValidation.test.ts:104` ⚠ **TRAP 2 — the obvious injection inverts the verdict**

**Audit's named missed regression:** *"the other 7 tests in this file all use message matchers; this
one cannot distinguish its invariant from theirs."* — i.e. the finding is about **message
discrimination**, not about whether *a* throw occurs.

Trace of the test `[VERIFIED: planValidation.test.ts:99-105 + planValidation.ts:134-169]`: steps are
`[REDUCE(denominator:10), MAP(batchSize:1)]` at `commentCount: 100`; `createStep` (`:8-21`) injects
every required prompt id, so per-step validation passes; the REDUCE leaves `batchCount` at 1
(`Math.ceil(1/10)`), then MAP sets `batchCount = Math.ceil(100/1) = 100` and `structure = 'listOfLists'`,
tripping the final check at `[VERIFIED: planValidation.ts:169]`:
```ts
    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
```

**Wrong injection (do not use):** deleting the `:169` throw. The test then goes **RED**, which under a
naive reading of criterion 2 ("reads blind but fails correctly → withdraw") would **withdraw a valid
finding**. It fails only because *no* throw occurred — which is not the regression the finding names.

**Correct injection — swap the message, keep the throw:**
```diff
  packages/argument-condensation/src/core/utils/condensation/planValidation.ts:169
-    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
+    throw new Error('refine can only be followed by ground'); // INJECTED (139): a DIFFERENT invariant's message
```
Predicted: **PASS (green)** — the bare `.toThrow()` is satisfied by any throw, so the test cannot
tell its own invariant from the `refine`-flow invariant. `[ASSUMED — reasoning from the read code]`
Collateral: `:89-97`'s sibling test *does* use a message matcher on the same line and will go RED —
which is itself corroborating evidence and should be recorded as such.

---

## Git Hygiene — the correct scoped cleanliness check (the brief's question 5)

**The bare form in D-03 is false out of the gate.** `[VERIFIED: git status --porcelain, this session]`:
```
 M .vscode/settings.json
 M supabase/.temp/cli-latest
```

**This is a linked worktree** `[VERIFIED: git rev-parse --git-dir, this session]`:
```
--git-dir:        /Users/…/voting-advice-application/.git/worktrees/voting-advice-application-gsd
--git-common-dir: /Users/…/voting-advice-application/.git
branch:           feat-gsd-roadmap
core.hooksPath:   /dev/null   (worktree-local override — plain commits work here)
```
Practical consequences: `git checkout -- <path>` restores from **this worktree's** index/HEAD and is
unaffected by the shared object store — the operation is safe as written. `git stash` is **not**
recommended (a mid-run interruption strands the injection in a stash the next iteration will not see,
and CONTEXT already rejected branch-based isolation for the same reason).

**Use the precedent form, already established and used by Phase 138**
`[VERIFIED: .planning/phases/138-…/138-NEGATIVE-CONTROL.md:171-179]`:
```
$ git status --porcelain
 M .vscode/settings.json
 M supabase/.temp/cli-latest

$ git status --porcelain tests/ apps/ packages/
(no output)
```
Phase 138 called this "the load-bearing claim … the *scoped* porcelain in § 4.1, which is empty over
`apps/`, `tests/` and `packages/`". **Verified empirically this session:**
`git status --porcelain -- apps tests packages` → empty, exit 0, both before and after the seven
baseline runs (including the two condensation suites that write gitignored artefacts).

**Recommended hygiene loop for the plan** (three complementary gates, cheapest first):

```bash
# 0. once, at plan start — pin the acceptable dirt
git status --porcelain > "$SCRATCH/139-porcelain-baseline.txt"

# per finding:
# 1. inject (Edit), 2. run (npx vitest run …), 3. restore:
git checkout -- <injected-path>

# 4a. per-path gate — the precise one
git status --porcelain -- <injected-path>            # MUST be empty
# 4b. scoped gate — Phase 138's precedent, catches a stray edit elsewhere in the source tree
git status --porcelain -- apps tests packages        # MUST be empty
# 4c. drift gate — catches a new untracked file anywhere (editor backup, stray scratch file)
diff <(git status --porcelain) "$SCRATCH/139-porcelain-baseline.txt"   # MUST be identical
```
All three forms were exercised this session and behave as described. Note `git status --porcelain`
does **not** list gitignored files, so `data/operationTrees/*.json` cannot trip any of them.

**One more gate worth adding for this phase specifically** — see §Security Domain: after the final
iteration, grep the auth tree for injection markers before any commit.

---

## Record Shape — mirroring `138-NEGATIVE-CONTROL.md` (the brief's question 6)

`.planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-NEGATIVE-CONTROL.md`
is **489 lines**. Its section skeleton `[VERIFIED: heading grep, this session]`:

```
#    Phase 138 — Negative Control: the DEF-135-04 navigation-settle fix
     (frontmatter block: Date / Plan / Decisions discharged / Requirements / Precedent followed)
##   1. Why this run existed                       — quotes the ROADMAP criterion being satisfied
##   2. Environment                                — fenced block: date, repo root, git HEAD+branch,
                                                     git status, OS, kernel, Node, tool versions
###    Port allocation                             — table (N/A for 139)
###    `lsof` for every port involved              — (N/A for 139)
##   3. The adversary — rebuildable on any machine
###    Prerequisites                               — fenced bash
###    The invocation                              — fenced bash
###    What the three knobs do, and the one that weakens the oracle
##   4. RUN 1 — the defect: pre-fix under the adversary
###    4.1 Provenance                              — `git rev-parse --short HEAD`, bare porcelain,
                                                     SCOPED porcelain, block start/end timestamps
###    4.2 The invocation, verbatim                — fenced bash
###    4.3 Observed — five consecutive runs        — table: # | Started | exit | Outcome | duration | state | Classification
###    4.3.1 Verbatim failure output — run 1       — fenced, unedited vitest/playwright error block
###    4.4 The finding                             — prose: what the observation means
##   5. RUN 2 — the catch                          — mirrors § 4 exactly (5.1 Provenance … 5.5 The finding)
###    5.4 The two halves side by side             — comparison table
###    5.6 Discarded block — recorded rather than hidden
##   6. What this pair does and does not prove     — explicit scope limits
##   7. The operator's decision (D-06)
###    The separate open item
```

**Recommended adaptation for `139-VERDICTS.md`.** Phase 138 recorded **one** experiment in depth;
Phase 139 records **fourteen** shallowly. Do not replicate §§ 4–5 fourteen times. Instead:

```
#    Phase 139 — Verdicts: the single-source sweep findings
     (frontmatter: Date / Plan / Decisions discharged D-01..D-06 / Requirements ASSERT-01 /
      Precedent followed: 138-NEGATIVE-CONTROL.md)
##   1. Why this pass existed              — quote audit § "Not assessed" (:950-956) + ROADMAP :339-352
##   2. Environment                        — ONE stamp for all 14 (138 § 2 shape, ports/lsof dropped):
                                             date, repo root, git HEAD+branch, bare porcelain,
                                             scoped porcelain, OS, Node v24.14.1, vitest 3.2.4,
                                             yarn 4.13.0, "no Supabase / no dev server / no network"
##   3. Method — the injection loop        — the D-03 hygiene loop verbatim, once, as fenced bash;
                                             plus the collateral-failure rule and the two-column rule
##   4. Verdict summary                    — ONE table, 14 rows:
                                             Finding | Site (current file:line) | Verdict |
                                             Assertion outcome | File outcome | Collateral
##   5. Per-finding records                — one `### F15-A …` subsection each, and each carries:
                                             5.x.1 Re-read evidence   (verbatim assertion + current line)
                                             5.x.2 Injected diff      (verbatim -/+ — D-04)
                                             5.x.3 Invocation         (verbatim command)
                                             5.x.4 Observed           (assertion / file / verbatim output block)
                                             5.x.5 Verdict + reasoning (+ D-02 mitigation where it applies)
                                             5.x.6 Pre-specified regression for Phase 142 (criterion 3)
##   6. Withdrawals and their propagation  — criterion 4: what was struck, where, and why
##   7. What this pass does and does not prove   — mirrors 138 § 6; state the F15-A substitution
                                                   and the F17 degeneracy as explicit scope limits
```
§ 5.x.2 + § 5.x.6 together are what Phase 142 consumes; keeping them adjacent per finding is worth
more than document brevity.

---

## Criterion-4 Edit Targets — exact coordinates for a withdrawal

Criterion 4 requires a withdrawal to be struck in **three** documents. All coordinates verified this
session.

### 1. `.planning/audits/2026-08-11-fake-guard-sweep.md` (977 lines)

**Finding-entry structural shape** — every `F1`–`F20` entry follows the same template
`[VERIFIED: audit heading map + full read of §§ F15-F20, this session]`:

```markdown
### F<n> — <one-line claim in the imperative/descriptive present>

**File:** `<path>:<lines>`                 ← F16, F17, F18 use this; F15/F19/F20 inline the paths instead

<optional fenced code block quoting the offending assertion>

<prose: what the test intends>

**Why it's blind.** / **What it would catch:** / **What it would miss:** ← F14/F16 use the labelled form
<prose diagnosis>

**Suggested fix.** <one or two sentences>

**Confidence: <high|medium>** <optional parenthetical, e.g. "(read directly)">

---
```
Deviations to be aware of: **F15** has no `**File:**` line (it is two clustered sub-findings, each
introduced by a bolded path), carries an extra `Incidental:` paragraph, and its confidence line is a
bare `**Confidence: high.**`. **F19** is a bullet list of three sites followed by a `**Mitigated:**`
paragraph. **F20** is a six-row markdown table (`| File:line | Assertion | Title promises | Missed
regression |`) followed by an `Adjacent coverage gap surfaced while checking …` paragraph and a
two-clause confidence line.

Section anchors `[VERIFIED: grep -n '^### F' , this session]`:

| Finding | Heading line | Entry spans to |
|---|---|---|
| F15 | `:622` | `:657` (`---` at `:658`) |
| F16 | `:660` | `:680` (`---` at `:681`) |
| F17 | `:683` | `:716` (`---` at `:717`) |
| F18 | `:719` | `:746` (`---` at `:747`) |
| F19 | `:749` | `:768` (`---` at `:769`) |
| F20 | `:771` | `:791` (`---` at `:792`) |
| `## Cleared` | `:794` | — contains the **Method note** at `:938-948` naming the single-source set |
| `## Not assessed` | `:950` | first bullet at `:952-956` is the single-source statement |

Verbatim `## Not assessed` first bullet `[VERIFIED: .planning/audits/2026-08-11-fake-guard-sweep.md:952-956]`:
```
- **F15, F16, F18, F19 and the F20 table are single-source** (the delegated sweep). I verified the
  four highest-value unit findings myself but not these; see the *Method note* in Cleared. My
  prediction — stated so it can be checked — is that they hold, because the four I did verify were
  accurate to the line and because F15's shape (mock-in, mock-out) was visible in the
  `condenserIntegration.test.ts` header I read independently.
```
**Recommended strike form** (preserves the audit as a historical record while making the shrink
visible, per criterion 4's "visible in the record, not silent"): do **not** delete the entry. Prepend
a blockquote immediately under the `### F<n>` heading:
```markdown
> **WITHDRAWN — Phase 139, 2026-08-14.** <one-sentence reason>. Evidence:
> `139-VERDICTS.md` § 5.<x>. The finding below is retained for the record and is **not** actionable.
```
And append to the `## Not assessed` first bullet a closing sentence recording that the prediction was
tested and its outcome. That bullet ends with an explicit invitation to check the prediction — the
phase should answer it in place.

### 2. `.planning/REQUIREMENTS.md`

- `[VERIFIED: .planning/REQUIREMENTS.md:60]` — the ASSERT-07 line itself (text quoted in
  `<phase_requirements>` above). Edit the `**F15, F16, F17, F18, F20**` list down.
- `[VERIFIED: .planning/REQUIREMENTS.md:149]` — traceability row: `| ASSERT-07 | Phase 142 — Assertion Design — Wiring-Only Tests Assert Output | Pending |`
- `[VERIFIED: .planning/REQUIREMENTS.md:171]` — phase/requirement count row for Phase 142
  (`| 142 — Assertion Design | ASSERT-07 | 1 |`). Count stays 1 unless ASSERT-07 is withdrawn entirely.
- `[VERIFIED: .planning/REQUIREMENTS.md:143]` — `| ASSERT-01 | Phase 139 — … | Pending |` — flip to
  the completed marker on phase close, per this file's own convention (`[x]` + `— Evidence: …`, as
  INTEG-01..06 at `:45-50` demonstrate). **Note the evidence-citation convention**: completed rows in
  this file carry an inline `— Evidence: <artifact> § <section> (<specific observation>)` clause.
  ASSERT-01's evidence clause should cite `139-VERDICTS.md` § 4 and the verdict counts.

### 3. `.planning/ROADMAP.md`

- `[VERIFIED: .planning/ROADMAP.md:339]` — `### Phase 139: Single-Source Sweep Findings — Confirm or Withdraw`;
  the block runs to `:352` (Phase 140 heading at `:353`), with criterion 4 as its last criterion.
- The Phase 142 block states ASSERT-07's scope; **the planner must locate it and edit the finding
  list there too.** This research did not read the Phase 142 block — `[ASSUMED]` that it enumerates
  F15/F16/F17/F18/F20 the same way REQUIREMENTS.md:60 does. Grep `ASSERT-07` in ROADMAP.md at plan time.

---

## Common Pitfalls

### Pitfall 1: reading the process exit code as the verdict (F19 ×3, F19c)
**What goes wrong:** the file goes red, criterion 2's "reads blind but fails correctly → withdraw"
fires, and three valid findings are withdrawn — shrinking ASSERT-03/Phase 140 as well as ASSERT-07.
**Why it happens:** vitest reports per-file/per-test outcomes, not per-assertion outcomes. The passing
`toBeDefined()` is invisible in the summary line.
**How to avoid:** two observed columns (assertion / file) plus the verbatim failure block showing the
failing line number. D-02 exists precisely for this class; CONTEXT §Specifics restates it
("scoped to findings whose *own assertion* catches the regression — not to findings rescued by an
incidental downstream throw").
**Warning signs:** a verdict row where the "observed" column is a single value.

### Pitfall 2: injecting the removal instead of the substitution (F20-6)
**What goes wrong:** deleting `planValidation.ts:169`'s throw makes the test red → spurious withdrawal.
**Why it happens:** the natural reading of "break the behaviour it claims to assert" is "remove it",
but F20-6's claim is about *message discrimination*, not about the existence of a throw.
**How to avoid:** for every finding whose complaint is "the matcher is weaker than the title", the
injection must preserve the *category* of the failure and vary only the *detail* the matcher cannot
see (status code, message, value, column).
**Warning signs:** an injection whose predicted outcome is FAIL. Across all 14 sites, **every**
correctly-designed injection predicts PASS. A predicted FAIL is a design smell, not a withdrawal.

### Pitfall 3: assuming the audit's named regression is injectable (F15-A)
**What goes wrong:** hours spent looking for the question-type branch to delete in
`packages/question-info/src/`; there isn't one.
**How to avoid:** confirm the behaviour the finding says "could be removed" actually exists before
designing the injection. Grep for it. Where it does not exist, that absence is *stronger* evidence for
the finding than any injection — record it as such and substitute a live regression.
**Warning signs:** a grep for the named behaviour returns zero hits in the package's `src/`.

### Pitfall 4: reading collateral red as verdict red
**What goes wrong:** F20-3's unconditional-false injection reds three success-path tests in the same
file; F20-6's message swap reds a sibling test; F15-B's injection may red the visualization test.
Any of these could be misfiled as "the assertion caught it".
**How to avoid:** encode the rule in the plan — *only the outcome of the 14 named sites is verdict
evidence; every other test's outcome is collateral, recorded verbatim and explicitly excluded.*
Prefer per-test isolation (`vitest run <file> -t '<title>'`) for the verdict run and a whole-file run
for the collateral record.

### Pitfall 5: running condensation suites from the repo root
**What goes wrong:** `Condenser.run()` writes to `<cwd>/data/operationTrees/`. From the repo root
that path is **not** gitignored, so D-03's cleanliness gate fails for a reason unrelated to the
injection — and the operator "fixes" it by deleting files.
**How to avoid:** always `cd` into the workspace directory before `npx vitest run`.

### Pitfall 6: bare `git status --porcelain` in the hygiene gate
**What goes wrong:** the gate never passes; the operator disables it. Two tracked files are dirty at
session start.
**How to avoid:** the three-gate form in §Git Hygiene. Never the bare form.

### Pitfall 7: presenting F17's green run as a discriminating experiment
**What goes wrong:** the record claims "we injected an effect loop and the test stayed green",
implying the test was tested. It wasn't — the injected module is not in its import graph.
**How to avoid:** lead F17's evidence with the import-graph fact (`test.ts:2` imports only the
helpers module) and mark the run as corroboration. D-06 already flags F17 as out-of-criterion-1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Applying / reverting the injection | a patch-file apply/revert harness, a `sed` script, a scratch branch | `Edit` tool + `git checkout -- <path>` | CONTEXT D-03 already settled this; git's checkout is atomic and exact, and a bespoke harness adds a failure mode whose output would then need its own verification. |
| Isolating a single test | commenting out neighbours, temporary `.only` | `npx vitest run <file> -t '<title>'` | `.only` is itself an edit that must be reverted (another hygiene surface); `-t` leaves the file untouched. |
| Capturing observed output | hand-transcribing the summary line | redirect vitest output to a file under the scratchpad and paste the block verbatim | 138 § 4.3.1 established the verbatim-block precedent; transcription is where the assertion/file distinction gets lost. |
| Cleanliness assertion | a custom "is the tree clean" script | the three `git status --porcelain` forms in §Git Hygiene | Already exercised in this repo (138 § 4.1) and verified this session. |
| Making the AI packages runnable | adding `test:unit` scripts, editing `turbo.json`, editing `vitest.workspace.ts` | `cd <pkg> && npx vitest run <file>` | D-05 forbids it (pre-empts Phase 141) — **and it is unnecessary**: the ad-hoc command is verified working. |

**Key insight:** every mechanism this phase needs already exists and has been exercised in this
repository within the last two days. The phase's difficulty is entirely in *evidence design* — which
injection, and how the outcome is recorded — not in tooling.

---

## Project Constraints (from CLAUDE.md)

Extracted from `./CLAUDE.md`, read this session. Only directives that bear on Phase 139:

1. **E2E hard rule (cardinal failure).** *"Failing E2E tests are a CARDINAL FAILURE. No task may
   proceed, complete, or be marked done while any E2E test is failing."* — **Phase 139 touches no
   E2E spec**, but it *does* transiently break production source under `apps/frontend/src/` (idura.ts,
   getIdTokenClaims.ts, overrides.ts, the authorize route, EntityListWithControls.svelte). If any E2E
   run overlaps an injection window, it will red for a manufactured reason. **Plan constraint: no E2E
   run may be scheduled inside this phase, and the phase-close E2E gate (if the plan carries one) must
   run only after the final hygiene gate passes.** Note `.planning/v2.14-CARDINAL-RULE-WAIVER.md` was
   discharged at Phase 138 close — the rule is back in force unwaived (`REQUIREMENTS.md:47`, INTEG-03).
2. **"did not run" counts as a failure**, not a pass. Applies to the verdict corpus: a site whose
   injection run did not execute has **no verdict** — it may not be recorded as `confirmed` on the
   strength of the paper read alone. D-01 requires an observation per site.
3. **Never commit sensitive data / use TypeScript strictly / avoid `any`.** The injections
   deliberately violate the second (`undefined as unknown as string` in F19c) — acceptable **only**
   because they are reverted within the same iteration and never committed. The hygiene gate is what
   makes this compliant; without it, the phase violates CLAUDE.md.
4. **Code Review Checklist** (`.agents/code-review-checklist.md`) — *"Always check your code against
   the Code review checklist"*. Phase 139 commits **documentation only** (`139-VERDICTS.md` +
   edits to three `.planning/` files). If the final diff contains any change under `apps/`, `packages/`
   or `tests/`, an injection leaked and the phase has failed its own hygiene requirement.
5. **Context Destructuring Rule (Svelte 5)** — relevant only to F17's `EntityListWithControls.svelte`
   injection. The component reads `const locale = $derived(ctx.locale);` at `:73` and derives
   `activeFilterGroup`/`searchFilter` at `:81`/`:87`. The injected `$effect` must not destructure
   reactive context accessors. Since the injection is reverted immediately, this is a hygiene note
   rather than a design constraint — but a linter run mid-injection would flag it.

**Project skills present:** `.claude/skills/{architect,components,data,database,filters,matching,
spike-findings-voting-advice-application-gsd}` + `.claude/skills/BOUNDARIES.md`, and
`.agents/code-review-checklist.md`. The `data` skill is the relevant domain expert for F20-5
(`parseNominationTree`); `components` for F17. Neither is required for a read-and-inject pass.

---

## Validation Architecture

`.planning/config.json` has no `workflow.nyquist_validation` key `[VERIFIED: .planning/config.json,
read this session]` → treat as **enabled**. This phase writes no product code, so the section is
scoped to *the phase's own output being verifiable*.

### Test Framework
| Property | Value |
|---|---|
| Framework | vitest **3.2.4** (`catalog: vitest: ^3.2.4` in `.yarnrc.yml`) |
| Config files | per-workspace `vitest.config.ts` (5 relevant); root `vitest.workspace.ts` = `['packages/**/vitest.config.ts']` |
| Quick run command | the per-vehicle `npx vitest run <files>` in §Run Vehicles (~400-650 ms each) |
| Full suite command | `yarn test:unit` (turbo; **does not reach** `question-info` / `argument-condensation` — D-05) |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | Exists? |
|---|---|---|---|---|
| ASSERT-01 | each of the 14 sites has an observed injection outcome | evidence artifact | `grep -c '^### F' 139-VERDICTS.md` ≥ 14 | ❌ Wave 0 (the artifact is the deliverable) |
| ASSERT-01 | no injection survived | hygiene gate | `git status --porcelain -- apps tests packages` → empty | ✅ verified working |
| ASSERT-01 | the corpus is still green post-phase | regression | the 7 baseline commands in §Run Vehicles, re-run at phase close → 113 tests green | ✅ verified working (baseline captured this session) |
| criterion 4 | withdrawals propagated | consistency check | `grep -n 'ASSERT-07' .planning/REQUIREMENTS.md .planning/ROADMAP.md` and diff the finding lists against `139-VERDICTS.md` § 6 | ✅ grep-able |

### Sampling Rate
- **Per injection iteration:** the single vehicle command + the three hygiene gates.
- **Per vehicle batch:** the vehicle's full baseline command, confirming the pre-injection counts
  (7 / 11 / 3 / 5 / 34 / 1 / 52) are restored.
- **Phase gate:** all seven baseline commands green (**113 tests total**) + `git status --porcelain`
  identical to the pinned baseline + the auth-marker grep in §Security Domain.

### Wave 0 Gaps
- None in test infrastructure — every command is verified working today.
- The only "gap" is the deliverable itself (`139-VERDICTS.md`), which is the phase's product.

**Baseline counts to restore at phase close** (captured this session, use as the regression oracle):

| Vehicle | Tests |
|---|---|
| question-info / questionTypes | 7 |
| argument-condensation / planValidation + handleQuestion | 11 |
| argument-condensation / condenserStandalone | 3 |
| argument-condensation / condenseQuestions | 5 |
| dev-seed / default + supabaseAdminClient | 34 |
| data / variants | 1 |
| frontend / 6 files | 52 |
| **Total** | **113** |

---

## Security Domain

`security_enforcement` is absent from `.planning/config.json` → enabled. Phase 139 ships no product
code, so the ASVS surface is narrow — but it is **not empty**, and the one live risk is significant.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | **yes — transiently** | The injections at `idura.ts:74` (JAR request object) and `:102` (client assertion) **remove authentication material from an OIDC flow**. Control: D-03's revert-and-verify loop. |
| V3 Session Management | no | No session code is injected. |
| V4 Access Control | no | No authz code is injected. |
| V5 Input Validation | **yes — transiently** | F16 removes a language allow-list check (`api.ts:118-122`); F20-1 changes an HTTP 400 input-validation response to 500. |
| V6 Cryptography | **yes — transiently** | F20-3 makes `getIdTokenClaims` return `success: false` unconditionally, i.e. bypasses ID-token signature/audience/issuer verification (`getIdTokenClaims.ts:33-37` calls `jose.jwtVerify`). |
| V7 Error Handling & Logging | marginal | F20-1 changes a status code; F20-2 changes an i18n fallback return value. |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| An injected auth weakening survives into a commit (JAR request param dropped; client assertion dropped; token verification short-circuited) | Spoofing / Elevation of Privilege | The three-gate hygiene loop in §Git Hygiene, run **per finding**, plus the marker grep below **before any commit**. |
| An injection survives into a *running dev server* and a developer authenticates against the weakened flow | Spoofing | No dev server is required by this phase (§Environment Availability). **Plan constraint: do not run `yarn dev` during an injection window.** |
| An interrupted session strands an injection in the working tree | Tampering | CONTEXT D-03 already rejected branch/scratch isolation for exactly this reason. Add a phase-close reconciliation step: `git diff --stat` over `apps/ packages/ tests/` must be empty. |

**Recommended pre-commit gate (add to the plan's final task):**
```bash
# no injection marker survived anywhere in the source tree
grep -rn "INJECTED (139)" apps packages tests 2>/dev/null && echo "LEAK" || echo "clean"
# and nothing under the source tree differs from HEAD at all
git diff --stat -- apps packages tests   # MUST be empty
```
Using a uniform `INJECTED (139)` comment marker in every injected diff makes this gate possible and
costs nothing — **recommend the planner mandate it in every `+` line where a comment is syntactically
legal.** (It is not legal in every case — e.g. F18's constant reassignment and F20-4's string literal —
so the marker gate is a *supplement* to, never a replacement for, the git gates.)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Every predicted PASS/FAIL in §Injection Catalogue | Injection Catalogue | Low by design — the phase's entire purpose is to replace these with observations. A prediction that is wrong is *data*, not a defect, and should be recorded as such (138 § 5.6's "discarded block" precedent). |
| A2 | The F15-B injection may red the out-of-scope `createVisualization` test at `condenseQuestions.test.ts:331` | F15-B/C | Low — the collateral rule covers either outcome. |
| A3 | Test 9 (`default.test.ts:113-119`) survives the `LOCALE_BLOCK_SIZE` injection | F18 | Low — both halves of its comparison use the same mutated generator. Verify by observation. |
| A4 | `.planning/ROADMAP.md`'s Phase 142 block enumerates ASSERT-07's findings the way `REQUIREMENTS.md:60` does | Criterion-4 Edit Targets | Medium — if the enumeration differs, a withdrawal could be propagated incompletely. **Mitigation: grep `ASSERT-07` across ROADMAP.md at plan time** (cheap, ~10 s). |
| A5 | No test outside the 14 sites depends on the injected symbols in a way that would confuse the record | Common Pitfalls | Low for the verified-scope cases (`LOCALE_BLOCK_SIZE` grep returned 3 hits, all accounted for); unverified for `getIdTokenClaims` / `idura.ts` consumers outside their own test files. |
| A6 | Injecting into `EntityListWithControls.svelte` compiles cleanly under the frontend vitest svelte plugin | F17 | Low — the injection is reverted regardless; a compile error would surface immediately as a loud failure, not a silent one. |

**Everything else in this document is `[VERIFIED]` — read from the live tree or executed this
session — or `[CITED]` to a specific in-repo path and line range with the text quoted verbatim beside
the claim.**

---

## Open Questions

1. **Does the ROADMAP's Phase 142 block enumerate the ASSERT-07 findings?** (see A4)
   - *Known:* `REQUIREMENTS.md:60` lists `F15, F16, F17, F18, F20`; `ROADMAP.md` Phase 139 criterion 4
     says the shrink must land "in this ROADMAP and in `REQUIREMENTS.md`".
   - *Unclear:* the exact wording and line of the Phase 142 statement.
   - *Recommendation:* one `grep -n 'ASSERT-07\|F15\|F20' .planning/ROADMAP.md` at plan time; add the
     hits to the criterion-4 edit list.

2. **Should the F15-A substitution be treated as a scope change requiring user sign-off?**
   - *Known:* D-01 says "inject the regression the finding claims its assertion cannot detect". F15-A's
     first named regression is not injectable (already shipped behaviour).
   - *Unclear:* whether substituting a different regression satisfies D-01's letter.
   - *Recommendation:* proceed with the substitution and record it prominently in `139-VERDICTS.md` § 7
     ("what this pass does and does not prove"). The substitution *strengthens* the finding, and D-01's
     intent — an observation per site — is preserved. Flag it in the phase summary rather than
     blocking on it. If the planner prefers, a `checkpoint:human-verify` on this one site is cheap.

3. **Two injections for F20-5, or one?**
   - *Known:* the audit names two distinct blind spots (vacuity; wrong-ID propagation), both one-line
     injections on a 12-line test.
   - *Recommendation:* do both. The marginal cost is ~400 ms and one diff block; the marginal value is
     a second pre-specified regression for Phase 142 at essentially zero cost.

4. **How many verdicts does the phase actually owe — 13, 14, or 20?**
   - *Known:* CONTEXT says "13 sites" and lists F17 as a 14th under D-06. But the *assertion sites*
     number more: F15-A alone has 10 assertion lines across 7 tests, and F15's audit entry covers 5
     separate test files.
   - *Recommendation:* verdicts are owed per **finding-cluster**, matching the audit's own granularity:
     F15-A, F15-B, F15-C, F16, F17, F18, F19a, F19b, F19c, F20-1…F20-6 = **15 verdict rows**
     (CONTEXT's "13 sites" + F17 + the F15 cluster split). State the chosen enumeration explicitly in
     `139-VERDICTS.md` § 4 so Phase 142 cannot misread a merged row as a missing one.

---

## Sources

### Primary (HIGH confidence) — in-repo, read this session
- `.planning/audits/2026-08-11-fake-guard-sweep.md` — §§ F15 (`:622`), F16 (`:660`), F17 (`:683`),
  F18 (`:719`), F19 (`:749`), F20 (`:771`), `## Cleared` Method note (`:938-948`),
  `## Not assessed` (`:950-956`); full heading map
- `.planning/REQUIREMENTS.md:54,60,143,149,171` and the INTEG-01..06 evidence-clause convention at `:45-50`
- `.planning/ROADMAP.md:339-352` (Phase 139 block)
- `.planning/STATE.md:37-47` (standing acceptance rule + phase-order rationale)
- `.planning/phases/138-.../138-NEGATIVE-CONTROL.md` — full section skeleton; § 2 environment stamp;
  § 4.1 scoped-porcelain precedent (`:171-179`); § 4.3 observation table; § 4.3.1 verbatim failure block
- `.planning/phases/139-.../139-CONTEXT.md` — D-01..D-06, canonical refs, specifics, deferred
- `.planning/config.json`, `turbo.json:11-14`, `.yarnrc.yml:1`, `vitest.workspace.ts:1`, `.gitignore`,
  `packages/argument-condensation/.gitignore:3`
- All 14 test files and all 11 injection-target source files, cited inline with line ranges throughout
- `CLAUDE.md` (E2E cardinal rule, testing commands, Svelte 5 context rule); `.agents/code-review-checklist.md` (presence)

### Primary (HIGH confidence) — commands executed this session
- `npx --no-install vitest --version`, `yarn exec vitest --version`, `node -e "require.resolve('vitest')"` (from `packages/question-info`)
- 7 baseline vitest invocations (113 tests, all green) — full table in §Run Vehicles
- `git status --porcelain` (bare and scoped ×3 forms), `git rev-parse --git-dir` / `--git-common-dir`,
  `git worktree list`, `git config --get core.hooksPath`, `git check-ignore -v`
- `grep` scope checks for `LOCALE_BLOCK_SIZE`, `client_assertion`, `question.type|QUESTION_TYPE|choices`

### Secondary / Tertiary
- **None.** No web search, no external documentation, and no third-party package was consulted or is
  required. Every claim in this document resolves to a path and line range in this repository or to a
  command executed in this session.

---

## Metadata

**Confidence breakdown:**
- **Site inventory (all 14):** HIGH — every line opened and quoted verbatim from the current tree;
  drift measured, not assumed.
- **Run vehicles / commands:** HIGH — every command executed and its output observed, not inferred.
- **Environment / false-negative hazards:** HIGH — the no-rebuild-needed claim rests on 14 read import
  lines; the no-external-dependency claim rests on read `vi.mock` blocks and two explicit in-file
  D-22 contracts.
- **Git hygiene form:** HIGH — the scoped form is this repo's own two-day-old precedent and was
  re-verified empirically, before and after the runs that write artefacts.
- **Record shape:** HIGH — 138's skeleton read directly; the adaptation is a recommendation (MEDIUM
  as a *choice*, HIGH as a *description of the precedent*).
- **Injection catalogue targets:** HIGH — every target file/line read and quoted.
- **Injection catalogue predicted outcomes:** LOW-to-MEDIUM by design — tagged `[ASSUMED]`; producing
  the observations is the phase's deliverable, and a wrong prediction is data.
- **Criterion-4 edit coordinates:** HIGH for the audit and REQUIREMENTS.md; MEDIUM for ROADMAP.md's
  Phase 142 block (open question 1 / A4).

**Research date:** 2026-08-14
**Valid until:** ~2026-09-13 for the tooling facts (vitest 3.2.4, yarn 4.13.0, script inventory).
**The site line numbers are valid only until the next edit to any of the 14 files** — Phase 140 and
Phase 142 both edit files in this set, so this document's line coordinates must be re-verified if
Phase 139 does not execute before them. Phase 139's `Depends on: Nothing` and its deliberately-early
position in the order exist to keep that window short.
