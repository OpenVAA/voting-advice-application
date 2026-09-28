# Phase 142: Assertion Design — Wiring-Only Tests Assert Output - Research

**Researched:** 2026-08-20
**Domain:** Test-assertion remediation + two minimal product fixes, under a per-finding injection protocol (139's HYGIENE-LOOP), inverted
**Confidence:** HIGH for everything measured this session (marked `[VERIFIED]`); MEDIUM for two forward predictions that cannot be measured without making the product change (marked `[DERIVED]`)

**Measurement basis for this document:** every `file:line` below was opened at HEAD `03eb3b183` (branch `feat-gsd-roadmap`) this session. Every "measured" claim was produced by a command run this session, listed in § Sources. **No repository file was modified**: `git status --porcelain -- apps tests packages` printed nothing at the start and at the end of the research session.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied from `142-CONTEXT.md`. All 20 are **locked**; this research implements them, it does not re-derive them.

- **D-00** — The corpus is exactly 12 findings: F15-A, F15-B, F15-C, F16, F17, F18, F20-1, F20-2, F20-3, F20-4, F20-5, F20-6. The planner states these 12 explicitly; no plan re-derives them from 139's 15-row table.
- **D-01 ⚠** — F15-A: **fix `question-info` here**, scoped minimally — question type + choice labels reach the prompt variables at `packages/question-info/src/.../infoGeneration.ts`. No redesign. Anything larger is deferred (D-19 iii). Converts the phase from test-only to test+product; carries a non-autonomous checkpoint (D-17), forces an OLD-half re-run (D-06), contributes to the E2E gate (D-16).
- **D-02 ⚠** — F20-1: **fix the authorize endpoint here**. One-line class — `throw error(400, …)`, or hoist the guard out of the `try` — **plus** a check for the same `return error(...)`-inside-`try` shape in the sibling `token/` and `callback/` endpoints. Non-autonomous checkpoint.
- **D-03** — F15-A's `:535-537` tautology: **repoint** at the transform between provider response and returned result (`packages/question-info/src/utils/responseTransformer.ts`). Delete **only** if the transform turns out to be identity, and say so in the record.
- **D-04 ⚠** — F17: **rename to the contract it verifies** (ROADMAP criterion 3's second branch). Scope, exhaustive: (1) file renamed `EntityListWithControls.helpers.test.ts`; (2) `describe` titles renamed to name the helper functions — `computeFiltered`, `countActiveFilters`; (3) the `:9` doc comment updated to state the **contract**, not the omission; (4) `:84-95` rewritten to assert a computed property against an **independently-derived** expectation, not a value compared to itself.
- **D-05** — Adjacent same-class sites: **fix** the unlisted `questionTypes.test.ts:388`; **leave** the six F19-class `!`-on-`null` sites (standing todo D-19 i); `planValidation.test.ts:94` needs **no change** (it is the contrast, not a defect); `getIdTokenClaims.test.ts`'s missing negative tests are **out of scope** (D-19 ii).
- **D-06 ⚠** — Negative-control protocol: **cite 139 § 5.N.4 for the OLD half** and run only the NEW half — **except** for any finding whose target file changed for a reason other than the assertion under test. Known exceptions: **F15-A** (D-01) and **F20-1** (D-02) — both re-run **both halves**. Any further file changed for a non-assertion reason joins the list.
- **D-07** — Reuse 139 § 3.1's HYGIENE-LOOP verbatim: pre-gate → inject with `Edit` at the named `file:line` → run with combined output to a log **outside the repo** → revert → post-gate, all three conditions, per path, per finding, **before the next injection starts**.
- **D-08** — 139 § 3.2 (two-column rule) and § 3.3 (collateral rule) carry over, **inverted**: the assertion must be **red**, the file may be red for collateral reasons.
- **D-09** — Ledger `142-NEGATIVE-CONTROL-LEDGER.md` in the phase dir; the **12-row table is created in full before the first injection runs**. Columns: `# · Finding · Site · Injection source (§ 5.N.2) · OLD half (cited/re-run) · NEW-assertion outcome · File outcome · Collateral · Verdict`.
- **D-10** — Carry the four qualified injection records into plan text verbatim; **no executor re-derives an injection**. F15-A → the substitute at `infoGeneration.ts:76`, never the audit's sentence. F16 → injection **B**. F19c → not ours. F20-1 → injection **B**, expect red on the un-injected tree until D-02 lands. Plus § 8.3's prohibition list (R-4, R-5, R-8, R-9 red both before and after; R-10 reds neither).
- **D-11** — Per-finding assertion targets E1–E9 (reproduced verbatim in § B below, per finding).
- **D-12** — Wall-clock sweep, bounded to `packages/question-info` and `packages/argument-condensation`. Remove the E9 site and any others of the same shape; list them in the record. **Do not sweep beyond those two packages.**
- **D-13** — Withdrawal bar: permitted **only** on a ground 139 could not have seen (the strengthened assertion is *provably unwritable*, not merely awkward). Reasoning goes in the phase record **and** in the audit. **Expected count: 0.**
- **D-14** — Root `yarn test:unit` (turbo, parallel, all workspaces) **3× consecutive green**, recorded with logs. Parallel, not per-package isolation. The Phase-141 wiring must demonstrably reach the edited files.
- **D-15** — Phase 137's served-app preflight applies unchanged. One fresh dev server on `:5173` (**no** Playwright `webServer`), `yarn db:reset` before the suite.
- **D-16 ⚠** — **One full `yarn test:e2e`** on a fresh dev server + clean DB is a phase gate, under the **cardinal rule**: any failure blocks; a "did not run" counts as a failure.
- **D-17** — Plan shape: **per package/area, roughly six plans** (1 `question-info`; 2 `argument-condensation`; 3 `dev-seed`; 4 `apps/frontend` auth; 5 `apps/frontend` other + `packages/data`; 6 ledger completion + gates). **Sequential, not parallel waves.** The plan carrying **D-01** and the plan carrying **D-02** get `autonomous: false` decision checkpoints. Plans **re-read** the Phase-141 `test:unit` scripts rather than assuming them.
- **D-18** — Record propagation: a remediation line per finding in `.planning/audits/2026-08-11-fake-guard-sweep.md` naming **the commit and the ledger row**; withdrawals struck rather than deleted (139 § 6 precedent); `REQUIREMENTS.md:60` ASSERT-07 marked `[x]` with an ASSERT-01-style evidence clause (ledger path, count remediated, count withdrawn, negative-control **pair** count); same for the ROADMAP phase line.
- **D-19** — Standing todos captured via `/gsd-capture`, not left in prose: (i) the six F19-class `!`-on-`null` sites; (ii) `getIdTokenClaims` missing negative tests; (iii) anything D-01 defers.

### Claude's Discretion

- Exact plan-file boundaries within D-17's six areas, provided the sequencing and the two non-autonomous checkpoints hold.
- Whether F20-4's exact-column assertion lands as `toBe` on a string or `toEqual` on an array — decided by the recorded call shape (D-11 E4). **→ Resolved by measurement in § B.10: it is a `string`; `toBe` is the form.**
- The concrete Faker-seeding mechanics for D-11 E2, provided the boundary property and the `LOCALE_BLOCK_SIZE`-from-constant rule hold. **→ A concrete, injection-safe design is given in § B.6; the naive form is a trap.**
- Whether D-03 ends in repoint or delete — determined by whether the transform is identity. **→ Resolved by reading: the transform is NOT identity (§ B.1(c)); D-03 ends in a repoint.**

### Deferred Ideas (OUT OF SCOPE)

1. **Six F19-class `!`-on-`null` sites** in `authorize-endpoint.test.ts` / `getIdTokenClaims.test.ts` (139 § 7 limit 6, § 8.1 C-2/C-4) — ASSERT-03's class; Phase 140 closed. → standing todo (D-19 i).
2. **`getIdTokenClaims` negative tests** for bad signature / wrong `issuer` / wrong `audience` — a coverage gap, not a fake guard. → future coverage phase (D-19 ii).
3. **Anything D-01 defers** out of the minimal `question-info` product fix — captured at the time it is identified (D-19 iii).
4. **Mounting `EntityListWithControls`** for a real reactivity test — needs the appContext + locale + i18n harness and touches Spike-024 territory. Explicitly rejected here (D-04).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **ASSERT-07** | `.planning/REQUIREMENTS.md:60` — "**F15, F16, F17, F18, F20** — each finding that survives ASSERT-01 either asserts observable output rather than wiring, or is explicitly withdrawn with the reasoning recorded." `[VERIFIED: .planning/REQUIREMENTS.md:60]` | § B gives the per-finding strengthened-assertion shape, its writability, and its clean-tree colour for all 12; § A gives the executable loop; § C the two product fixes; § D the gates; § E the ordering. § Common Pitfalls lists the eight places the phase's own evidence could look right while being wrong. |

</phase_requirements>

---

## Summary

Phase 142 is not a library-selection phase and installs **nothing**. Its entire technical surface is: eleven test files, five product files, one already-written procedure (139 § 3.1), and one gate suite that already exists and is already green. The research question is therefore not "what should we use" but "what exactly is at each site, what does the strengthened assertion have to be, and where does the recorded protocol break when it is inverted."

Three things this research changes about the plan's shape, each measured rather than reasoned:

1. **`error()` throws unconditionally in SvelteKit 2.55.0 `[VERIFIED: node_modules/@sveltejs/kit/src/exports/index.js:75-81]`, so D-02's first named option — "`throw error(400, …)`" — is a runtime no-op and does not fix the swallow.** `return error(...)` and `throw error(...)` both throw the same `HttpError` into the same `catch`. Only two things actually fix it: hoisting the guard out of the `try`, or re-throwing HttpErrors from the catch arm. The second is two lines and has an **in-tree model at `apps/frontend/src/routes/api/oidc/callback/+server.ts:97-99` `[VERIFIED]`**, which already re-throws redirect-shaped exceptions from its own catch.
2. **The F20-1 negative-control injection inverts with the fix.** Pre-fix, 139 § 8.3 R-7 correctly rejects injection A (400→500 at `+server.ts:22`) as zero-delta and prescribes injection B (`throw new TypeError` at `:52`). *Post-fix, that reverses*: the test's rejection no longer travels through the catch arm, so injection B becomes off-path and green, while injection A becomes exactly on-axis. The NEW half of F20-1's pair must use **injection A**, contradicting D-10's literal wording (§ ⚠-1).
3. **139 § 5.1.6's headline F15-A target — "assert the three Configurations' prompts are not equal to one another … this fails today" — is wrong as written.** Measured this session: three *differently-named* questions already produce three *different* prompts today, because `question.name` is in the prompt. The prompts are byte-identical only when the **name is held constant and the type varies** — which is the real defect, and which needs a **new fixture**, not a tweak of the existing ones (§ B.1(b), § ⚠-2).

Beyond those three, the tree is in better shape than the record implies: root `yarn test:unit` is **green at HEAD in ~20 s across 11 workspaces / 1 662 tests** `[VERIFIED: measured 2026-08-20]`, `turbo.json` declares `test:unit` `"cache": false` so a cached green is structurally impossible, and **every** corpus test imports its code-under-test through a *source* specifier, so **no injection in this phase requires a rebuild**.

**Primary recommendation:** run the six plans strictly sequentially in the order 3 → 2 → 5 → 1 → 4 → 6 (cheap and independent first, the two product fixes last before the gates), and inside each plan that carries a product fix, run the **OLD half first, against the untouched tree**, before the product fix and before the assertion edit — because the OLD assertion ceases to exist the moment the remediation lands.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Prompt construction from a question (D-01) | Package (`@openvaa/question-info` src + its YAML prompt templates) | — | The prompt variables are assembled at `infoGeneration.ts:75-82` and consumed by `@openvaa/llm`'s registry; the frontend consumer passes `AnyQuestionVariant` objects and needs no change `[VERIFIED: apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts:1-12]` |
| HTTP error contract for OIDC authorize (D-02) | Frontend server route (`apps/frontend/src/routes/api/oidc/authorize/+server.ts`) | — | SvelteKit endpoint; the swallow is a control-flow property of that one function |
| Error discrimination for ID-token failures (F20-3) | Frontend server lib (`apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts`) | — | The `{ success: false; error: { code?: string } }` discriminant already exists in the return type at `:20-23`; only the throw sites fail to populate it |
| Seed locale-block partitioning (F18) | Package (`@openvaa/dev-seed`) | — | Pure I/O override; `LOCALE_BLOCK_SIZE` + `__buildLocaleFakerForTests` are already exported for exactly this |
| Nomination tree parsing (F20-5) | Package (`@openvaa/data`) | Frontend (consumes `dist/`) | The test imports the source sibling; the frontend consumes the built artifact, which is why an injection here must never be live during a root `turbo run test:unit` |
| Condensation output contract (F15-B/C, F16, F20-6) | Package (`@openvaa/argument-condensation`) | — | All four sites are in-package, source-imported |
| Assertion protocol and evidence (all 12) | Phase record (`142-NEGATIVE-CONTROL-LEDGER.md`) | `.planning/audits/…` + `REQUIREMENTS.md` + `ROADMAP.md` | 139 § 6.2 established that the enumeration lives in **three** propagation targets, not two |

---

## A. The HYGIENE-LOOP, made executable (D-07, D-08)

### A.1 The loop, as commands, with 142's inversion stated

139 § 3.1 verbatim, with only the phase marker and log dir changed (`gsd-139` → `gsd-142`, `INJECTED (139)` → `INJECTED (142)`), and with the **inverted expectation** stated at the top of every injection task:

> **In Phase 139 a green was the finding. In Phase 142 a RED is the success signal.** The assertion column must be **red**; the file column may be red for collateral reasons. An executor pattern-matching on 139's record will otherwise read a red as a failure.

```bash
# 0. ONE-TIME per session
mkdir -p "${TMPDIR:-/tmp}/gsd-142"

# 1. PRE-GATE
git status --porcelain -- apps tests packages          # MUST print nothing

# 2. INJECT — apply the recorded diff with the Edit tool at the named file:line
#    (locate by CONTENT, not by line number — see A.4 drift table)

# 3. RUN — from inside the workspace directory, combined output to a log OUTSIDE the repo
cd "$(git rev-parse --show-toplevel)/<workspace>" \
  && npx vitest run <files> [-t '<title>'] 2>&1 | tee "${TMPDIR:-/tmp}/gsd-142/<site>.log"

# 4. REVERT
git checkout -- <injected-path>

# 5. POST-GATE — all three must hold before the next finding starts
git status --porcelain -- <injected-path>              # (a) MUST print nothing
git status --porcelain -- apps tests packages          # (b) MUST print nothing
test -d apps -a -d packages -a -d tests && ! grep -rn 'INJECTED (142)' apps packages tests   # (c)
```

**Three standing constraints, carried from 139 § 3.1 unchanged and all three still true at HEAD:**

- **The bare `git status --porcelain` is never a gate.** Scoped form only. `[VERIFIED: measured — the scoped form printed nothing at HEAD this session]`
- **Always `cd` into the workspace directory before `npx vitest run`.** `Condenser.run()` writes `path.join(process.cwd(), 'data/operationTrees', …)` at `condenser.ts:198` `[VERIFIED: packages/argument-condensation/src/core/condensation/condenser.ts:198]`, and `data/operationTrees` is gitignored **only inside that package** `[VERIFIED: packages/argument-condensation/.gitignore:3]`. Running from the repo root leaves an untracked directory and fails the post-gate for a reason unrelated to the injection.
- **No `yarn dev`, `yarn test:e2e` or Playwright command may run while any injection is live.** 142 transiently breaks `apps/frontend/src/routes/api/oidc/authorize/+server.ts` and `…/getIdTokenClaims.ts` — authentication material. The E2E gate (D-16) runs only after the last revert and the last post-gate.

**Log path convention (D-07's "outside the repo", made concrete):**
`${TMPDIR:-/tmp}/gsd-142/<finding>-<half>-<n>.log`, e.g. `${TMPDIR:-/tmp}/gsd-142/F20-6-NEW-1.log`. 139 used `${TMPDIR:-/tmp}/gsd-139` and recorded the resolved value in its environment stamp (`/var/folders/3p/…/T/gsd-139`); do the same so the ledger's log references are resolvable later. On this machine `$TMPDIR` resolves under `/var/folders/…/T/` `[CITED: 139-VERDICTS.md § 2]`.

### A.2 Rebuild: NOT required, anywhere in this phase

**Measured, per package.** Every corpus test file imports its code-under-test through a **relative source specifier**; not one goes through a package `dist/`:

| Test file | Import of the code under test | `[VERIFIED]` |
|---|---|---|
| `packages/question-info/tests/questionTypes.test.ts` | `'../src'`, `'../src/api'` | `:10-11` |
| `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts` | `'../../src/core/condensation/condenser'` | `:3` |
| `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts` | `'../../src/api.ts'` | `:10` |
| `packages/argument-condensation/tests/unit/handleQuestion.test.ts` | `'../../src/api'` | `:4` |
| `packages/argument-condensation/tests/unit/planValidation.test.ts` | `'../../src/core/utils/condensation/planValidation'` | `:3` |
| `packages/dev-seed/tests/templates/default.test.ts` | `'../../src/templates/defaults/candidates-override'` | `:15` |
| `packages/dev-seed/tests/supabaseAdminClient.test.ts` | `'../src/supabaseAdminClient'` | `:120` |
| `packages/data/src/objects/nominations/variants/variants.test.ts` | `'./variants'` | `:2` |
| `apps/frontend/…/__tests__/authorize-endpoint.test.ts` | `'../../../../../routes/api/oidc/authorize/+server'` | `:17` |
| `apps/frontend/src/lib/i18n/tests/overrides.test.ts` | `'../overrides'` | `:2` |
| `apps/frontend/…/auth/getIdTokenClaims.test.ts` | `'./getIdTokenClaims'` | `:13` |
| `apps/frontend/…/entityList/EntityListWithControls.test.ts` | `'./EntityListWithControls.helpers'` | `:2` |

**Two consequences the planner must carry into task text:**

- **No `yarn build` belongs inside the loop.** A build step would only slow the loop and would *not* change any observation. 139 § 2 stated this for its corpus; it is re-verified here for 142's twelve.
- **The one exception that is not an exception.** `packages/question-info` and `packages/argument-condensation` import `@openvaa/llm`, `@openvaa/core` and `@openvaa/data` as **bare specifiers**, which resolve through the workspace symlink to each package's `dist/` `[VERIFIED: node_modules/@openvaa/* are symlinks to packages/*; packages/llm/package.json exports → ./dist/index.js]`. Nothing in D-01/D-02/D-11 touches those three packages' sources, so no rebuild is implied. **If a plan ever proposes an edit under `packages/llm/src/`, `packages/core/src/` or `packages/data/src/` that a *different* package's test must observe, that edit needs `yarn build --filter=<pkg>` first** — and F20-5's `packages/data` injection is exactly that shape, which is why it must never be live during a *root* run (§ Common Pitfalls, 5 and 7).
- **Prompt YAML is read from `src/`, not `dist/`, under test.** `packages/question-info/tests/setup.ts:10-13` registers prompts from `path.join(__dirname, '../src/prompts')` `[VERIFIED]`, so D-01's YAML edits are visible to vitest with no build. The package's `build` script copies `src/prompts/*` into `dist/prompts` for production `[VERIFIED: packages/question-info/package.json build script]`.

### A.3 Turbo caching: cannot mask an injection — and why, exactly

```json
"test:unit": { "dependsOn": ["build"], "cache": false }
```
`[VERIFIED: turbo.json]`

- **`test:unit` is `cache: false`.** The measured run printed `@openvaa/supabase:test:unit: cache bypass, force executing …` `[VERIFIED: measured 2026-08-20]`. A cached test green is structurally impossible; **no cache-busting flag is needed**, and `--force` would only invalidate the *build* cache pointlessly.
- **`build` IS cached, and that is correct rather than dangerous.** `build` declares `inputs: ["src/**", …]`, so an injection under any `src/**` changes that package's cache key and forces a rebuild; reverting restores the pre-injection key and replays the pre-injection artifact. The measured run showed `14 cached, 25 total`, all of them `build` tasks `[VERIFIED]`.
- **The residual hazard is not the cache, it is `dependsOn: ["build"]`.** A root `turbo run test:unit` with an injection live under `packages/data/src/` will *rebuild `@openvaa/data`'s `dist/`* and hand the injected build to `argument-condensation`, `frontend` and `dev-seed`. That is a whole-suite contamination, not a per-file collateral. **Per-finding runs must stay in-package (`npx vitest run` from the workspace dir), exactly as 139 did.** The root `yarn test:unit` runs only at the D-14 gate, on a clean tree.

### A.4 Line-number drift since 139's baseline `12825b479` — locate by content

Phase 151's comment-hygiene codemod (the Akita ship-stack work) rewrote docblocks across the tree between `12825b479` and HEAD. It changed **no assertion**, but it moved two of the twelve sites. Measured file-by-file:

| # | Finding | 139's cite | **HEAD** | Drift | Injection target @HEAD | Drift |
|---|---|---|---|---|---|---|
| 1 | F15-A | test `:84,139,199,263,323,387,532,535-537` (+`:388`) | identical | **0** | `infoGeneration.ts:76` | **0** |
| 2 | F15-B | test `:131-142,184-185` | identical | **0** | `condenser.ts:205` | **0** |
| 3 | F15-C | test `:139-145,215-219,268-274` | identical | **0** | `condenser.ts:205` (shared) | **0** |
| 4 | F16 | test `:56-68` | identical | **0** | `api.ts:119-121` (guard opens `:118`) | **0** |
| 5 | F17 | test `:84-95` (assertion `:94`) | identical | **0** | *(not used — D-04)* `EntityListWithControls.svelte` **has changed since baseline** (12 lines) — any use of § 5.5.2's `:120`/`:129` targets must re-locate by content | — |
| 6 | F18 | test `:121-135` (assertions `:132-133`) | identical | **0** | `candidates-override.ts:53` | **0** |
| 7 | F20-1 | test **`:233`** | **`:234`** (title `:228`→**`:229`**) | **+1** | `+server.ts:22` (inj. A) / `:52` (inj. B) | **0** |
| 8 | F20-2 | test `:32-36` | identical | **0** | `overrides.ts:36` | **0** |
| 9 | F20-3 | test `:236,259` | identical | **0** | `getIdTokenClaims.ts:29` (B) / `:39-46` (A) | **0** |
| 10 | F20-4 | test **`:151`** (title `:138`) | **`:160`** (title **`:147`**) | **+9** | `supabaseAdminClient.ts:708` | **0** |
| 11 | F20-5 | test `:5-12` | identical | **0** | `variants.ts:94` (A) / `:100` (B) | **0** |
| 12 | F20-6 | test `:104` (title `:99`) | identical | **0** | `planValidation.ts:169` | **0** |

`[VERIFIED: all twelve re-read at HEAD this session; drift confirmed against git diff 12825b479..HEAD, which shows the two moved files changed only in comments/docblocks]`

**Record correction to carry:** 139 § 5.5.1 describes `EntityListWithControls.test.ts` as having "262 lines". At HEAD it is **138 lines** and the file is **unchanged since `12825b479`** `[VERIFIED: wc -l; git diff --stat shows no entry for it]` — so 139's line count was simply wrong. Its 8-test count and its `:84-95` cites are correct.

---

## B. Per-finding implementation surface (D-11)

Each entry gives: **current assertion (verbatim @HEAD)** · **strengthened shape (D-11 / 139 § 5.N.6)** · **what the test needs in scope** · **colour on the clean tree before any product fix** · **the injection to re-apply and what must go red**.

### B.1 — F15-A · `packages/question-info/tests/questionTypes.test.ts` (11 sites)

**(a) Current assertions, verbatim @HEAD** `[VERIFIED]`

```
 :84   expect(results[0].data.infoSections).toBeDefined();
 :139  expect(results[0].data.terms).toBeDefined();
 :140  expect(results[0].data.terms).toHaveLength(2);          ← D-05 sibling
 :199  expect(results[0].data.infoSections).toBeDefined();
 :263  expect(results[0].data.terms).toBeDefined();
 :264  expect(results[0].data.terms).toHaveLength(2);          ← D-05 sibling
 :323  expect(results[0].data.infoSections).toBeDefined();
 :386  expect(results).toHaveLength(1);
 :387  expect(results[0].data.terms).toBeDefined();
 :388  expect(results[0].data.terms).toHaveLength(3);          ← D-05: unlisted, in scope
 :532  expect(results.every((r) => r.data.infoSections && r.data.terms)).toBe(true);
 :535  expect(results[0].data.infoSections![0].title).toBe('Tax Policy');
 :536  expect(results[1].data.infoSections![0].title).toBe('Income Inequality Priority');
 :537  expect(results[2].data.infoSections![0].title).toBe('Policy Preference Analysis');
```

**Mock handle** `[VERIFIED: :14-17]`: `const mockLLMProvider = { generateObjectParallel: vi.fn() } as any;` — a bare `vi.fn()`. `grep -n 'mock.calls\|toHaveBeenCalledWith' packages/question-info/tests/` returns **nothing** `[VERIFIED: measured]`.

**(b) Can the test observe the prompt the mocked provider received? YES — measured, with the exact access path.**

`infoGeneration.ts:117-121` calls the provider **once** with a single object argument, and `:102-113` builds each request `[VERIFIED]`. Measured shapes, from an out-of-band harness that drove the real `generateQuestionInfo` against a capturing provider `[VERIFIED: measured 2026-08-20]`:

```
CALL ARG KEYS:  requests,maxConcurrent,controller
REQUEST KEYS:   schema,messages,temperature,validationRetries
MESSAGE KEYS:   role,content
```

So the capture expression the strengthened tests need is:

```ts
const [arg] = mockLLMProvider.generateObjectParallel.mock.calls[0];
const promptFor = (i: number): string => arg.requests[i].messages[0].content;
```

Nothing else is needed in scope — no new fixture, no export, no helper. The mock is already `vi.fn()`, so `.mock.calls` is already populated.

**(c) The three criterion-2 targets, with their measured clean-tree colour**

Measured against the real prompt pipeline `[VERIFIED: measured 2026-08-20 — three `generateQuestionInfo` calls, prompts captured and compared]`:

| Target | Assertion shape | Clean tree **today** | After D-01 |
|---|---|---|---|
| **T1 — question text reaches the prompt** | `expect(promptFor(0)).toContain('Do you support universal healthcare?')` | **GREEN** (`prompt contains question name: true`) | GREEN |
| **T2 — the three Configurations differ *by type*** | prompts for two questions with the **same `name`** and different `type` are not equal | **RED** (`prompt[boolean] === prompt[categorical] (SAME name, DIFFERENT type): true` — byte-identical) | GREEN |
| **T3 — choice labels reach the prompt** | `expect(promptFor(catIdx)).toContain('Public transportation')` | **RED** (`categorical prompt contains choice label Car: false`) | GREEN |

**⚠ T2 must use a NEW fixture. See § ⚠-2 — 139 § 5.1.6's literal wording for T2 would pass today and prove nothing.** Also measured: `prompt contains the question info text ('SAME INFO'): false` — `question.info` is ignored by the prompt too. That is **outside D-01's named scope** (type + choice labels) → capture under **D-19 iii**.

**(d) D-03 — the `:535-537` repoint. The transform is NOT identity.** `[VERIFIED: packages/question-info/src/utils/responseTransformer.ts:24-51]`

`transformResponse` does real work no assertion in the file covers: it keys `data.questionId` off `question.id` (`:30`), discriminates `infoSections` vs `terms` by `'infoSections' in responseData` / `'terms' in responseData` (`:26-27`), and **renames three metric fields** — `llmResponse.latencyMs → llmMetrics.processingTimeMs`, `attempts → nLlmCalls`, `usage → tokens` (`:38-43`) — plus `metadata.modelsUsed: [llmResponse.response.modelId]` (`:46`).

**Recommended repoint (Claude's discretion resolved → repoint, not delete):** replace `:535-537` with assertions on the **field renaming**, which is the only product logic on that path that no other assertion touches:

```ts
// The transform renames provider fields; a transform reading the wrong field fails here.
expect(results[0].llmMetrics.processingTimeMs).toBe(10);   // ← llmResponse.latencyMs, set at :4xx in the fixture
expect(results[0].llmMetrics.nLlmCalls).toBe(1);           // ← llmResponse.attempts
expect(results[0].metadata.modelsUsed).toEqual(['gpt-4o']); // ← llmResponse.response.modelId
```
The `questionId` mapping is already asserted at `:83`, `:322` and `:527-529` `[VERIFIED]`, so re-asserting it would duplicate rather than repoint. **Record in the phase record that the transform was inspected and found non-identity, per D-03's "say so" clause.**

**(e) Injection to re-apply (D-10 — the substitute, never the audit's sentence)**

```diff
  packages/question-info/src/core/infoGeneration.ts:76
-          question: question.name,
+          question: '', // INJECTED (142): the prompt no longer carries the question at all
```
**NEW half must go red at T1.** T2/T3 stay green under it (types and choices still differ) — the ledger's NEW-assertion cell must name *which* assertion reddened, not just "red".
**Prohibited here:** the audit's own sentence (§ 8.3 R-2 — un-injectable), the `responseTransformer` bypass (R-3 — blast radius without discrimination), and the `generalInstructions` key rename at `:77` (R-4 — reds before *and* after).

### B.2 — F15-B · `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts`

**Current, verbatim @HEAD `:131-142`, `:184-185`** `[VERIFIED]` — nine assertions on `condensationType`, `llmMetrics.*` and a call spy; `result.data.arguments` is never read (`grep -n 'arguments'` over the file returns only mock fixtures).

**Measured result shape** (real `Condenser.run()`, this file's exact input and mock, driven out of band) `[VERIFIED: measured 2026-08-20]`:

```
RESULT TOP KEYS: runId,condensationType,data,llmMetrics,success,metadata
ARGS LENGTH: 2
ARGS: [{"id":"a13ebeb3-…","text":"Generated argument from batch"},
       {"id":"6afec034-…","text":"Another generated argument"}]
llmMetrics: {"processingTimeMs":1.2284590000000009,"nLlmCalls":5, …}
```

Four facts the planner needs from that measurement:

1. **The path is `result.data.arguments`, not `result.arguments`.** ROADMAP criterion 2 says "`result.arguments` content"; the real path has a `data` wrapper `[VERIFIED: measured + packages/argument-condensation/src/core/types/condensation/condensationResult.ts:32]`. An executor copying the criterion's prose verbatim will write a failing accessor.
2. **The expected count for this fixture is exactly 2.**
3. **`Argument` is `{ id: string; text: string }` and nothing else** `[VERIFIED: packages/argument-condensation/src/core/types/condensation/argument.ts:4-9]`, and the **ids are regenerated UUIDs**, not the mock's `'arg1'`/`'arg2'`. → **139 § 5.2.6 target 3 ("source-comment IDs map back to the input") is NOT implementable at this shape.** Do not attempt it; use targets 1 and 2 plus text equality.
4. **`processingTimeMs` measured 1.23 ms on this machine** — a sub-millisecond-capable float on a fully mocked run, which is precisely E9's case for deletion rather than weakening.

**Strengthened shape (D-11 E8 + E9):**

```ts
expect(result.data.arguments).toHaveLength(2);
expect(result.data.arguments.map((a) => a.text)).toEqual([
  'Generated argument from batch',
  'Another generated argument'
]);
expect(result.data.arguments.every((a) => a.text.trim().length > 0)).toBe(true);
// :137 DELETED — not replaced with toBeGreaterThanOrEqual(0) (D-11 E9)
```

**Clean tree: GREEN** (measured). **Injection:** `condenser.ts:205` → `data: { arguments: [] }` — reds the length assertion. Shared with F15-C; 139 applied it once and took both records' runs before reverting, which 142 may repeat (one injection, two vehicle runs, one revert) provided the ledger records both rows against the same injection.

**Honest note for the plan text:** because the final REDUCE returns the mock's canned arguments, the text-equality assertion is itself mock-in/mock-out in the F15-A sense. E8 locks it, and it is still worth having — its real discriminating power is against `arguments: []` and against blank-but-shaped arguments, not against a wrong transform. Say so in the plan rather than overclaiming.

### B.3 — F15-C · `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts`

**Current, verbatim @HEAD** `[VERIFIED]`: `:139-145` (likert, `toHaveLength(2)` + two `toContain` on `condensationType`), `:215-219` (categorical, `toHaveLength(3)` + `every(... === CategoricalPros)`), `:268-274` (boolean, `toHaveLength(2)` + two `toContain`).

**Mock canned texts @HEAD** `[VERIFIED: :44-47]`: `'Test argument 1'`, `'Test argument 2'` (2 arguments per response).

**Strengthened shape (E8), keeping the existing counts (139 § 5.3.6's "pair, don't replace"):**

```ts
expect(results.every((r) => r.data.arguments.length > 0)).toBe(true);
expect(results.flatMap((r) => r.data.arguments).every((a) => a.text.trim().length > 0)).toBe(true);
// plus the exact per-run count, confirmed by a clean-tree run before it is pinned
```

**Per-run argument count is NOT measured here** (the handleQuestion path builds its own processing plan). `[ASSUMED]` it is 2 per run, by analogy with the measured standalone case and because the same mock returns 2 arguments per call. **The executor must confirm the per-run count on the clean tree before pinning it**, and record the observed value in the ledger — that is a measurement, not a value copied from a *failing* run (contrast E3's rule for F20-2).

**Clean tree: GREEN.** **Injection:** the same `condenser.ts:205` diff. 139 recorded that the visualization test at `:331` stays green under it, because `setFinalArguments` runs at `condenser.ts:195` *before* the return — so it is **not** collateral and must not be recorded as such.

### B.4 — F16 · `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68`

**Current, verbatim @HEAD `:68`** `[VERIFIED]`: `).rejects.toThrow();` under the title at `:31` `'It should throw an error for an unsupported language'`.

**Strengthened shape (D-11 E1 — exact prefix, plus non-empty entities):**

```ts
await expect(handleQuestion({ question, entities, options: { language: 'lol', … } }))
  .rejects.toThrow('Unsupported language: lol');
```
The thrown message @HEAD is `` `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}` `` `[VERIFIED: packages/argument-condensation/src/api.ts:119-121]`, so `'Unsupported language: lol'` is a true prefix and vitest's string form is a substring match — it also satisfies ROADMAP criterion 3's `/language/i` wording while being strictly stronger.

**What the test needs in scope: a non-empty `entities` array.** There is an in-tree fixture pattern to copy `[VERIFIED: packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:82-123]`:

```ts
const entities: Array<HasAnswers> = [
  { answers: { q1: { value: true, info: 'Because …' } as Answer } },
  { answers: { q1: { value: false, info: 'Because not …' } as Answer } }
];
```
(The question in this file has `id: 'q1'` and is a `BooleanQuestion` `[VERIFIED: :33-53]`.) The language guard at `api.ts:118` fires **before** `getAndSliceComments` at `:125` `[VERIFIED]`, so non-empty entities do not change the outcome — they only make the guard the first of several live paths, which is E1's stated reason.

**Clean tree: GREEN.** **Injection: B only (D-10).**

```diff
  packages/argument-condensation/src/api.ts:119-121
-    throw new Error(
-      `Unsupported language: ${language}. Please use a supported language: ${supportedLanguages.join(', ')}`
-    );
+    throw new Error('Cannot read properties of undefined (reading tpmLimit)');
```
**Prohibited: the audit's own sentence** ("delete the language check") — 139 § 5.4.4 measured it going red *before* the fix (`promise resolved "[]" instead of rejecting`), so it reds both before and after.

### B.5 — F17 · `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts`

**Current, verbatim @HEAD `:84-95`** `[VERIFIED]` — a 10-iteration loop calling `computeFiltered`, then `expect(group.applySpy).toHaveBeenCalledTimes(10);` at `:94`, under the title `'Contract 4: bounded apply() invocations under a flurry of filter mutations'`.

**D-04's four-item scope, mapped to HEAD:**

| D-04 item | Current state @HEAD | Work |
|---|---|---|
| 1. rename file → `EntityListWithControls.helpers.test.ts` | file is `EntityListWithControls.test.ts` | `git mv`; **also update `EntityListWithControls.helpers.ts:12`**, which names the old filename in its docblock `[VERIFIED]` — it is the only other reference in the tree `[VERIFIED: repo-wide grep]` |
| 2. `describe` titles name the helpers | outer `describe('EntityListWithControls helpers')` at `:56`; inner `describe('computeFiltered')` `:57` and `describe('countActiveFilters')` `:117` already exist `[VERIFIED]` | rename the **outer** describe only |
| 3. `:9` doc comment states the contract | `:4-15` explains why the component is *not* mounted | rewrite as a contract statement |
| 4. `:84-95` asserts an independently-derived expectation | `10 === 10` | see below |

**Recommended rewrite for item 4** — assert the *returned value* per cycle against an expectation derived from the fakes' documented semantics (`FakeGroup.apply` returns `[]` when active, a copy otherwise `[VERIFIED: :40-43]`), not from the loop bound:

```ts
const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
const group = new FakeGroup([new FakeFilter('f1')]);
const observed: Array<Array<{ name: string }>> = [];
for (let i = 0; i < 10; i++) {
  group.filters[0].setActive(i % 2 === 0);
  observed.push(computeFiltered(entities, group, undefined));
}
// Independently derived: an active group narrows to [], an inactive one passes the list through.
const expected = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? [] : entities));
expect(observed).toEqual(expected);
expect(group.applySpy).toHaveBeenCalledTimes(observed.length); // one apply per computeFiltered call
```

**⚠ F17 has NO available NEW half for 139's pre-specified regression — by construction. See § ⚠-3.** This is the phase's single largest evidence risk and needs an explicit ledger disposition plus (recommended) a supplementary pair.

### B.6 — F18 · `packages/dev-seed/tests/templates/default.test.ts:121-135`

**Current, verbatim @HEAD `:130-134`** `[VERIFIED]`: `for (const idx of [0, 109, 218]) { … expect(r.first_name).toBeTruthy(); expect(r.last_name).toBeTruthy(); }`

**What is reachable from the test** `[VERIFIED: packages/dev-seed/src/templates/defaults/candidates-override.ts]`:

| Symbol | Line | Exported? |
|---|---|---|
| `PARTY_WEIGHTS` | `:43` | **yes** |
| `TOTAL_CANDIDATES` | `:46` | no |
| `LOCALE_BLOCK_SIZE = 109` | `:53` | **yes** |
| `LOCALE_ORDER = ['en','fi','sv']` | `:60` | no |
| `buildLocaleFaker` | `:81` | no |
| `candidatesOverride` | `:94` | **yes** (already imported by the test at `:15`) |
| `__buildLocaleFakerForTests(locale, baseSeed = 42)` | `:172` | **yes** — `new Faker({locale:[LOCALE_PACKS[locale], en]}); f.seed(baseSeed + LOCALE_SEED_OFFSETS[locale])`, byte-identical to the private `buildLocaleFaker` |

**The generation loop draws exactly two values per row** — `faker.person.firstName()` then `faker.person.lastName()` at `:140-141` — and the answer-emitter branch at `:149` is **skipped in this test** because `ctx.refs.questions` is `[]` in `makeCtx()` `[VERIFIED: packages/dev-seed/tests/utils.ts:36]`. So a fresh per-locale Faker replays a block exactly.

**⚠ The naive "assert from the constant" form is a trap.** The injection *changes the constant* (`LOCALE_BLOCK_SIZE = 109 → 327`). If the boundary indices are derived from `LOCALE_BLOCK_SIZE`, they move with the injection to 326/327 and the assertion either (a) compares the 327th en draw against the 327th en draw and **passes** — the test mirrors the bug — or (b) dereferences `rows[327]`, which is `undefined`, and reds with a `TypeError` on the wrong axis (the R-6 failure mode).

**Injection-safe design that satisfies both halves of E2** (assert *from* the constant, never hard-code 109 twice; boundary indices independent of the injected value):

```ts
import { LOCALE_BLOCK_SIZE, __buildLocaleFakerForTests, candidatesOverride } from '…/candidates-override';

const rows = candidatesOverride({}, ctx) as Array<{ first_name: string; last_name: string }>;
// 3 locale blocks partition the corpus; derived from the generated rows, NOT from LOCALE_BLOCK_SIZE.
const blockSize = rows.length / 3;
expect(LOCALE_BLOCK_SIZE).toBe(blockSize);                      // reds under the injection: 327 !== 109

// Boundary: the last row of block 0 replays the en faker; the first row of block 1 replays the fi faker.
const en = __buildLocaleFakerForTests('en');
let last = { first: '', lastName: '' };
for (let i = 0; i < blockSize; i++) last = { first: en.person.firstName(), lastName: en.person.lastName() };
expect(rows[blockSize - 1].first_name).toBe(last.first);
expect(rows[blockSize - 1].last_name).toBe(last.lastName);

const fi = __buildLocaleFakerForTests('fi');
expect(rows[blockSize].first_name).toBe(fi.person.firstName());
expect(rows[blockSize].last_name).toBe(fi.person.lastName());
```

Under the injection `LOCALE_BLOCK_SIZE = 327`, `rows.length` is still 327 (it comes from `PARTY_WEIGHTS`, untouched), so `blockSize` stays 109 and **both** the constant assertion and the `rows[109]`-vs-fresh-`fi` assertion go red — two independent, on-axis reds. Weaker acceptable fallback if Faker replay proves brittle: the `ä`/`ö`/`å` character-class check 139 § 5.6.6 names; it also reds under the injection but is a weaker guard.

**Clean tree: GREEN expected** — the replay is deterministic by construction, but the executor should confirm on the clean tree first, because a mismatch would indicate a hidden draw and is itself a finding.
**Injection:** `candidates-override.ts:53` → `export const LOCALE_BLOCK_SIZE = 327;` (marker exempt — 139 § 5.6.2 records the exemption for a constant reassignment; keep the exemption and re-record it).
**Verdict run isolated:** `npx vitest run tests/templates/default.test.ts -t 'Test 10'`; whole-file run kept as the collateral record.

### B.7 — F20-1 · `apps/frontend/…/__tests__/authorize-endpoint.test.ts:234`

**Current, verbatim @HEAD** `[VERIFIED]`: title `:229` `it('returns 400 when redirectUri is missing', …)`; body `:234` `await expect(POST(event)).rejects.toThrow();`

**Strengthened shape:** `await expect(POST(event)).rejects.toMatchObject({ status: 400 });`
Prefer `toMatchObject` over `toThrow(expect.objectContaining(...))`: SvelteKit's `HttpError` is **not** an `Error` subclass — it is a plain class with own properties `status` and `body` `[VERIFIED: node_modules/@sveltejs/kit/src/exports/internal/index.js — class HttpError { constructor(status, body) { this.status = status; … } }]`.

**Clean tree: RED, today, before any fix** — and the mechanism is live and observable in this session's own gate run:
```
stderr | …authorize-endpoint.test.ts > POST /api/oidc/authorize > returns 400 when redirectUri is missing
Failed to construct authorization request: HttpError { status: 400, body: { message: 'redirectUri is required' } }
```
`[VERIFIED: measured 2026-08-20 in the root `yarn test:unit` run]` — that line is printed by the `console.error` **inside the catch arm** at `+server.ts:51`, which proves the 400 was caught rather than returned, so the caller receives the catch's 500.

**Injection for the NEW half: A, not B. See § ⚠-1 and § C.2.**

### B.8 — F20-2 · `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36`

**Current, verbatim @HEAD `:36`** `[VERIFIED]`: `expect(typeof result).toBe('string');`
**Strengthened (E3):** `expect(result).toBe('{broken, plural, }');` — the fixture template set at `:33` `[VERIFIED]`, returned verbatim by the catch arm at `overrides.ts:36` (`return template;`) `[VERIFIED: apps/frontend/src/lib/i18n/overrides.ts:33-37]`.
**Nothing new needed in scope.** **Clean tree: GREEN** (the catch returns the template unchanged; the value is structurally the fixture literal).
**Injection:** `overrides.ts:36` → `return '';`. **Prohibited: the `throw`-in-the-catch control (§ 8.3 R-8).**
E3's clause applies: if the implementation returns something else, that is a **finding to record**, not a value to copy from the run output.

### B.9 — F20-3 · `apps/frontend/…/auth/getIdTokenClaims.test.ts:236,259`

**Current, verbatim @HEAD** `[VERIFIED]`: both sites are `expect(result.success).toBe(false);` — `:236` under `'returns success=false when kid not in JWKS'` (`:216`) and `:259` under `'returns success=false when kid does not match available keys'` (`:239`).

**Does `getIdTokenClaims` return a discriminating error field today? The *type* does; the *value* does not, for these two tests.** `[VERIFIED: apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts]`

- The return type at `:20-23` is `{ success: true; data: … } | { success: false; error: { code?: string } }`.
- The catch at `:47-59` populates `error.code` **only** when the thrown value satisfies `e instanceof Error && 'code' in e` (`:48`) — true for `jose` errors, false for the kid-lookup throw.
- The kid-lookup throw at `:29` is a plain `` new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`) `` — **no `code`** → both sites currently receive `error: {}`.

**Both tests reach the SAME branch.** Site 1 passes `privateEncryptionJWKSet: []` (`:230`); site 2 passes `[rsaOaep256EncPrivJwk]` with a non-matching kid (`:253`) `[VERIFIED]`. Both fail the `!privateEncryptionJWK` test at `:28` and throw the identical message (same `kid`, `'signicat-enc-key'`, in both fixtures). **A single shared code therefore does NOT make the two titles "differ observably"** as D-11 E6 requires.

**Minimal shape that satisfies E6 — a two-code branch split (≈6 lines):**

```ts
if (options.privateEncryptionJWKSet.length === 0) {
  throw Object.assign(new Error('Cannot decode ID token: no decryption JWKs are configured.'),
                      { code: 'ERR_JWKS_EMPTY' });
}
if (!privateEncryptionJWK) {
  throw Object.assign(new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`),
                      { code: 'ERR_JWK_KID_MISMATCH' });
}
```
Both flow through the existing `'code' in e` branch at `:48` with no change to the catch, no change to the public type, and no new dependency. The split is **operationally meaningful, not test-driven contortion**: `defaultOptions` derives the JWK set from `JSON.parse(constants.IDENTITY_PROVIDER_DECRYPTION_JWKS || '[]')` at `:6`, so "empty set" is the misconfiguration case and "kid mismatch" is the key-rotation case — genuinely different incidents.

**Strengthened assertions:** `expect(result).toMatchObject({ success: false, error: { code: 'ERR_JWKS_EMPTY' } })` at `:236` and `… 'ERR_JWK_KID_MISMATCH'` at `:259`.

**⚠ This is a THIRD product change, beyond D-01 and D-02.** E6 explicitly authorizes it ("adding one is in scope … flag it in the plan rather than weakening the assertion"), and it lands in D-17's plan 4, which is already `autonomous: false` — so the checkpoint exists. The planner must name it at that checkpoint rather than letting it ride as an assertion edit. A one-code variant is available if the operator declines the split, at the cost of E6's "differ observably" clause; that trade must be an explicit decision, not a silent one.

**Clean tree after the split: GREEN.** **Injections: BOTH A and B (139 § 5.12.6 — the sites are blind on two axes).** Under A (`:39-46` → `return { success: false, error: {} }`) the code assertion reds *and* three success-path tests red as **collateral (C-5 at `:147`, `:174`, `:203`)** — record them in the collateral column, never in the assertion column. Under B (an unrelated message at `:29`, which loses the code) the code assertion reds with **zero** collateral. **Prohibited: control C (§ 8.3 R-9).**

### B.10 — F20-4 · `packages/dev-seed/tests/supabaseAdminClient.test.ts:160`

**Current, verbatim @HEAD `:160`** `[VERIFIED]`: `expect(mockState.selectCalls[0]).toContain('id');` under the title at `:147`.

**Recorded call shape — measured, resolving the D-11 E4 discretion:** `selectCalls: Array<string>` `[VERIFIED: :28]`, pushed raw from the builder stub: `b.select = vi.fn((cols: string) => { mockState.selectCalls.push(cols); … })` `[VERIFIED: :69-73]`. The production call passes a single string `.select('id, external_id, first_name, last_name')` `[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:708]`.

**→ `mockState.selectCalls[0]` is a `string`. The form is `toBe` on the string:**
```ts
expect(mockState.selectCalls[0]).toBe('id, external_id, first_name, last_name');
```
(The `.split(',').map(s => s.trim())` + `toContain('id')` variant is equally valid and marginally less brittle to whitespace; either satisfies E4. `toEqual` on an array is **not** applicable — there is no array.) The siblings at `:161-163` (`toContain('external_id')` etc.) become redundant once the exact string is pinned; leaving or removing them is cosmetic and not in scope.

**Clean tree: GREEN.** **Injection:** `supabaseAdminClient.ts:708` → `.select('external_id, first_name, last_name')` (marker exemption for a string literal, per 139 § 5.13.2 — re-record it). **Collateral: none** — 139's analysis holds at HEAD (`:161-163` name columns the injected string still contains; `:164-166` cover `eq`/`like`/`order`; `:167-168` read the mocked return data).

### B.11 — F20-5 · `packages/data/src/objects/nominations/variants/variants.test.ts:5-12`

**Current: the whole file is 12 lines** `[VERIFIED]` — two `toBeDefined()` calls inside a `forEach`, with no length guard.

**Deriving the exact count (E5) — measured, so the planner knows what "exact" is:** `parseNominationTree(getTestData().nominations)` returns **35** entries `[VERIFIED: measured 2026-08-20]`. The tree shape is:
`election-1: {constituency-1-1: 1, 1-2: 2, 1-3: 2, 2-1: 1, 2-2: 1}`, `election-2: {constituency-3-1..3-9: 3,4,3,3,3,3,3,3,3}` — summing to 35, and `parseNominationTree` expands no nesting (it is a flat two-level walk at `variants.ts:95-105`).

**Derive rather than hard-code (E5's rule):**
```ts
const tree = getTestData().nominations;
const nominationData = parseNominationTree(tree);
const expectedCount = Object.values(tree)
  .flatMap((byConstituency) => Object.values(byConstituency))
  .reduce((n, arr) => n + (arr as Array<unknown>).length, 0);
expect(expectedCount).toBeGreaterThan(0);        // the derivation itself must not be vacuous
expect(nominationData).toHaveLength(expectedCount);
nominationData.forEach((d) => {
  expect(Object.keys(tree)).toContain(d.electionId);
  expect(Object.keys(tree[d.electionId])).toContain(d.constituencyId);
});
```
The `expectedCount > 0` line is not decoration: without it, a `getTestData()` that returned an empty tree would make the derived count 0 and re-open the vacuity hole E5 exists to close.

**Clean tree: GREEN.** **Injections: BOTH A and B.** A (`variants.ts:94` → `return [];`) reds the length assertion; B (`:100` → `electionId: 'WRONG-ELECTION-ID'`) reds the membership assertion. **Prohibited: `electionId: undefined` (§ 8.3 R-5).**

### B.12 — F20-6 · `packages/argument-condensation/tests/unit/planValidation.test.ts:104`

**Current, verbatim @HEAD `:104`** `[VERIFIED]`: `expect(() => validatePlan({ steps, commentCount: 100 })).toThrow();`

**The exact message this input produces, traced against the live source** `[VERIFIED: packages/argument-condensation/src/core/utils/condensation/planValidation.ts:146-169]`: steps are `[REDUCE(denominator:10), MAP(batchSize:1)]` at `commentCount: 100` → REDUCE gives `batchCount = ceil(1/10) = 1`, `structure = 'list'`; MAP gives `batchCount = ceil(100/1) = 100`, `structure = 'listOfLists'`; the guard at `:168` throws:

```
Pipeline must end with a single list, but ends with listOfLists in 100 batch(es)
```

**Strengthened (E7), matching the seven siblings' style — `:94` is the model** `[VERIFIED: :94-96]`:
```ts
expect(() => validatePlan({ steps, commentCount: 100 })).toThrow(
  'Pipeline must end with a single list, but ends with listOfLists in 100 batch(es)'
);
```

**The C-1 collateral, explained (E7's "watch"):** the injection swaps the message at `planValidation.ts:169` to `'refine can only be followed by ground'`. The sibling at `:94-96` pins the **old** message and therefore reds — *not* because it caught F20-6's regression, but because it is a second test through the same `throw`. `[VERIFIED: 139 § 8.1 C-1 records the verbatim failure at `:94:62`]` **Post-remediation both `:94` and `:104` red under the injection.** The verdict run must therefore be the isolated one:
```bash
npx vitest run tests/unit/planValidation.test.ts -t 'It should throw if a final map step would produce multiple batches'
```
with the whole-file run kept as the collateral record — the two-column rule doing exactly the job D-08 says it does, in the direction 142 inverts.

**Clean tree: GREEN.** **Prohibited: deleting the `:169` throw (§ 8.3 R-1).**

### B.13 — D-12: the wall-clock sweep, executed

`grep -rn "toBeGreaterThan\|toBeLessThan" packages/question-info/tests packages/argument-condensation/tests` `[VERIFIED: measured 2026-08-20]` returns exactly four hits, of which **one** is a wall-clock-on-a-mock assertion:

| Site | Shape | Disposition |
|---|---|---|
| `condenserStandalone.test.ts:137` | `expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0)` | **DELETE** (E9) — measured value on this machine: **1.228 ms**, a sub-ms-capable float on a fully mocked run |
| `condenserStandalone.test.ts:136`, `:185` | `nLlmCalls` | keep — a call counter, not wall clock |
| `condenserStandalone.test.ts:139` | `tokens.totalTokens` | keep — a token counter |

**No other site in either package matches the shape.** In `question-info`, `llmMetrics.processingTimeMs` is not wall clock at all — it is copied from the mock's `llmResponse.latencyMs` by `responseTransformer.ts:39` `[VERIFIED]`. **The D-12 record can state: swept, one site found, one removed, zero others.**

---

## C. The two product fixes (D-01, D-02)

### C.1 — D-01 · `question-info`: call chain, insertion point, exact minimal edit

**Package source map** `[VERIFIED: find packages/question-info/src -type f]` — 14 files:
`api.ts` · `consts.ts` · `index.ts` · `prompts.ts` · `core/infoGeneration.ts` · `core/infoGeneration.type.ts` · `utils/{determinePrompt,index,responseTransformer,schemaGenerator}.ts` · `prompts/en/{consts.ts,generateBoth.yaml,generateInfoSections.yaml,generateTerms.yaml}`

**Call chain** `[VERIFIED]`:
```
questionTypes.test.ts:80  generateQuestionInfo({questions, options})        api.ts:23
  → api.ts:39               generateInfo({questions, options})              core/infoGeneration.ts:32
    → infoGeneration.ts:75-82  build `variables` ← THE INSERTION POINT
    → infoGeneration.ts:85-91  operation-specific vars (branches on promptKey ONLY)
    → infoGeneration.ts:94-100 loadPrompt({promptId, language, variables, throwIfVarsMissing:true, …})
      → @openvaa/llm promptRegistry.ts:316  loadPrompt
        → :352  required-param check   → :373  setPromptVars(promptText, variables, strict, optional)
    → infoGeneration.ts:117   options.llmProvider.generateObjectParallel({requests, maxConcurrent, controller})
```

**The grep finding, re-verified at HEAD:**
```console
$ grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/ ; echo "exit=$?"
exit=1
```
`[VERIFIED: measured 2026-08-20 — zero output, exit 1]` The shipped code reads `question.name` and five fixed constants; the only branch anywhere is on `promptKey` at `:85-91`.

**What the prompt templates require** `[VERIFIED: promptRegistry.ts:167-168, 352, 379 + setPromptVars.ts:44-63]`:
- `params.required` → `requiredParams`; a required name missing from `variables` throws at `:352` under `throwIfVarsMissing: true`.
- `params.optional` → `optionalParams`, forwarded to `setPromptVars` as `optional`, where a `{{placeholder}}` in the template with no matching variable is **auto-filled with `''`** (`setPromptVars.ts:45-49`).
- **An extra variable that no placeholder references is harmless** — `setPromptVars` iterates the variables and `String.replace`s; a no-match is a no-op. So adding variables cannot break anything; adding *placeholders* is what makes them reach the prompt.

**Minimal edit — two files' worth, three YAMLs + one object literal:**

1. `packages/question-info/src/core/infoGeneration.ts:75-82` — two entries added to the existing literal:
   ```ts
   const variables: Record<string, unknown> = {
     question: question.name,
     questionType: question.type,
     choices: 'choices' in question
       ? (question.choices as Array<{ label: string }>).map((c) => c.label).join(', ')
       : '',
     generalInstructions: GENERAL_INSTRUCTIONS,
     …
   };
   ```
   `question.type` is on the `Question` base class getter `[VERIFIED: packages/data/src/objects/questions/base/question.ts:48-50]`; `choices` exists only on `ChoiceQuestion` subclasses `[VERIFIED: packages/data/src/objects/questions/base/choiceQuestion.ts:35-37]` and each `Choice` carries `label: string` `[VERIFIED: packages/data/src/objects/questions/base/choice.type.ts:14]`. The `'choices' in question` guard is therefore load-bearing for Boolean/Ordinal-without-choices inputs.
2. `packages/question-info/src/prompts/en/generateInfoSections.yaml`, `generateTerms.yaml`, `generateBoth.yaml` — add `questionType` to `params.required` and `choices` to `params.optional`, and reference both from `promptText` near the existing `## Question to use for the task:` block (`generateInfoSections.yaml:55-56`, `generateTerms.yaml:52-53`, and the equivalent tail of `generateBoth.yaml`) `[VERIFIED: all three read this session]`.

**Blast radius: contained.** The only in-repo consumers of `@openvaa/question-info` are `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts` and `apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts` `[VERIFIED: repo-wide grep]`, and both pass `AnyQuestionVariant` objects straight through — no signature change, no API surface change. The sibling `packages/question-info/tests/api.test.ts` asserts result shapes, never prompts `[VERIFIED: read]`, so it is not collateral.

**What would balloon beyond minimal — flag and defer (D-19 iii):**
- `question.info` **also never reaches the prompt** (measured: `prompt contains the question info text: false`). Adding it is a separate, defensible improvement that D-01 does not name.
- Localising the type label (rendering `singleChoiceOrdinal` as human text, per-locale) — the YAML tree has only `en/` today `[VERIFIED: find]`.
- Ordinal `normalizableValue` scale description (a 5-point vs 7-point distinction is *not* closed by the type string alone — both are `'singleChoiceOrdinal'` `[VERIFIED: questionTypes.test.ts:145-323 uses `SingleChoiceOrdinalQuestion` for both]`). If a plan wants Configurations 2a/2b to differ, it needs the choice list, which the `choices` variable supplies for ordinal questions too.

### C.2 — D-02 · the OIDC authorize endpoint

**The mechanism, re-verified at HEAD** `[VERIFIED: apps/frontend/src/routes/api/oidc/authorize/+server.ts]`:
```
:18  try {
:19    const { redirectUri, codeChallenge } = await request.json();
:21    if (!redirectUri) {
:22      return error(400, { message: 'redirectUri is required' });   ← throws HERE
:50  } catch (e) {
:51    console.error('Failed to construct authorization request:', e);
:52    return error(500, { message: 'Failed to construct authorization request' });
```
and `error()` in `@sveltejs/kit@2.55.0` **throws unconditionally**:
```js
export function error(status, body) { … throw new HttpError(status, body); }
```
`[VERIFIED: node_modules/@sveltejs/kit/src/exports/index.js:75-81; version from package.json]`

**⚠ Consequence: `throw error(400, …)` is a no-op fix.** D-02 names two candidates; the first — "`throw error(400, …)`" — changes nothing at runtime, because `return error(...)` already throws before the `return` is reached, and the same `catch` still swallows it. Only these two work:

| Option | Edit | Invasiveness | In-tree model |
|---|---|---|---|
| **(A) hoist the guard out of the `try`** | `redirectUri` is destructured from `await request.json()` **inside** the try (`:19`), so hoisting the guard means hoisting the parse too — which changes the error contract for malformed JSON (currently a 500), or requires a `let` declared above the try. **3–6 lines, and it moves error semantics.** | higher | none |
| **(B) re-throw HttpErrors from the catch** ✅ | `import { error, isHttpError, json } from '@sveltejs/kit';` and, as the first statement of the catch: `if (isHttpError(e)) throw e;` — **2 lines, no semantics moved.** | lowest | **`apps/frontend/src/routes/api/oidc/callback/+server.ts:97-99` already does exactly this shape** for redirect-shaped exceptions: `if (e && typeof e === 'object' && 'status' in e && 'location' in e) { throw e; }` `[VERIFIED]` |

`isHttpError(e, status?)` is exported by kit and is `e instanceof HttpError` `[VERIFIED: node_modules/@sveltejs/kit/src/exports/index.js:90-93]`. **Recommendation: option (B).**

**Sibling check (D-02's second clause), executed** — `grep -rn "return error(" apps/frontend/src/routes/api/` `[VERIFIED: measured]`:

| File:line | Shape | Verdict |
|---|---|---|
| `…/oidc/authorize/+server.ts:22` | `return error(400, …)` inside `try` (catch `:50`, 500 at `:52`) | **the D-02 defect** |
| `…/oidc/authorize/+server.ts:52` | the catch arm itself | not a swallow |
| `…/oidc/token/+server.ts:29` | `return error(401, { message: 'Unauthorized' })` inside `try` (catch `:40`, `error(401, { message: 'Unauthorized' })` at `:42`) | **same shape, observationally inert** — the swallowed status *and body* are byte-identical to the replacement, so no caller can tell. Worth the same 2-line re-throw for correctness, but it fixes no observable defect and no test asserts it. **Report; do not expand scope without the D-17 checkpoint agreeing.** |
| `…/oidc/callback/+server.ts` | uses `throw redirect(...)` and **already re-throws** framework exceptions at `:97-99` | **clean — and the model for fix (B)** |
| `…/api/cache/+server.ts:56` | `return error(response.status, …)` inside `try` (catch `:66`, 500 at `:70`) — a **third** live instance of the swallow: an upstream 404 is reported to the client as a 500 | **outside D-02's named scope** (`token/` and `callback/` only). Capture as a standing todo rather than fixing here. (`:24` and `:30` are *outside* any `try` and are fine.) |

**⚠ The injection inverts with the fix — see § ⚠-1.**

---

## ⚠ Tensions with locked decisions and with 139's record

These are reported, not planned around. None is a reason to re-open a decision; each is a place where the decision's *stated mechanism* does not survive contact with HEAD.

### ⚠-1 · D-10 says "F20-1 — use injection B". Post-fix, injection B cannot red; injection A must be used for the NEW half.

- **Pre-fix (what 139 measured):** the test's promise rejects with the **catch arm's** value, because the 400 is swallowed. Injection A (`:22`, 400→500) is therefore zero-delta on the caller-observable axis — correctly rejected as R-7. Injection B (`:52` → `throw new TypeError`) *does* change what the caller receives, so it is the discriminating one for the OLD assertion. **139 is right, for the pre-fix tree.**
- **Post-fix (either option A or option B of § C.2):** the 400 no longer reaches the catch arm at all — under fix (B) it is re-thrown at the top of the catch, under fix (A) it never enters the catch. **`+server.ts:52` is off the path this test exercises.** Re-applying injection B post-fix leaves the strengthened `toMatchObject({ status: 400 })` **green** — a negative control that proves nothing, which is exactly the class of error § 8.3 exists to prevent.
- **Post-fix, injection A becomes exactly on-axis:** the caller now receives the `HttpError` constructed at `:22`, so changing its status to 500 reds `toMatchObject({ status: 400 })`. It is also, literally, the regression the audit names ("a 500").

**Recommended ledger shape for F20-1 (two rows' worth of evidence in one row):**

| Half | Tree | Assertion | Injection | Expected |
|---|---|---|---|---|
| OLD | pre-fix, un-edited | `.rejects.toThrow()` | **B** @ `:52` | **PASS** (re-run per D-06; matches 139 § 5.10.4) |
| NEW | post-fix, strengthened | `.rejects.toMatchObject({status:400})` | **A** @ `:22` | **FAIL (red)** ← the success signal |
| (optional third) | post-fix, strengthened | same | **B** @ `:52` | PASS — record it *as evidence that the swallow is gone*, explicitly labelled "not the negative control" |

`[DERIVED — reasoned from the measured control flow, not executed: executing it requires making the product change, which research must not do. The executor must confirm both halves.]`

### ⚠-2 · 139 § 5.1.6 target 2 says "assert the three Configurations' prompts are not equal … this fails today". Measured: it would **pass** today.

Measured with the real pipeline `[VERIFIED: measured 2026-08-20]`:
```
prompt[boolean] === prompt[categorical]  (SAME name, DIFFERENT type):   true    ← the real defect
prompt[boolean] === prompt[differently-named boolean]:                  false   ← 139's target-2 comparison
```
The file's three "Configuration" blocks use three *differently-named* questions `[VERIFIED: :41, :92, :274, :331 …]`, and `question.name` is interpolated into the prompt `[VERIFIED: measured — prompt tail is `## Question to use for the task: \nSAME NAME`]`. A pairwise-inequality assertion over the existing fixtures therefore passes today and would **not** be closed by D-01 — it would be a new fake guard shipped by the phase whose purpose is to remove them.

**The assertion that actually fails today and is closed by D-01** holds the question text constant and varies only the type. It needs a **new fixture** — two or three questions sharing a `name`, differing in `type` (and, for the categorical, carrying `choices`) — most naturally a new test alongside the "Mixed Question Type Scenarios" block at `:439`. That is *additional* work the plan must budget for; it is not a rewrite of an existing assertion.

### ⚠-3 · F17 has no available NEW half. D-04's chosen remedy makes 139's pre-specified regression permanently undetectable — by 139's own reasoning.

139 § 5.5.6 says it in as many words: *"Remedy 1 closes the guard; remedy 2 closes the misdescription and leaves the guard absent. Phase 142 must pick deliberately and record which, **because only remedy 1 makes the pre-specified regression above red**."* D-04 locks **remedy 2**. Therefore the `$effect` re-run-storm injection at `EntityListWithControls.svelte` will be **green before and after** the remediation — the component is not in the test's module graph, a fact 139 established twice (import reading + control D's unparseable-file measurement). And § 8.3 R-10 already forbids using control D as the control.

ROADMAP criterion 1 demands a pair for **every** finding confirmed by 139. Recommended disposition — **both**, not either:

1. **Record the row honestly.** F17's ledger row's `NEW-assertion outcome` cell reads `N/A — by construction`, with the reasoning: D-04 selected ROADMAP criterion 3's second branch (rename); 139 § 5.5.6 and § 8.3 R-10 predict in advance that the pre-specified regression cannot red under that branch; the finding is **remediated, not withdrawn** (so D-13's bar is not engaged and the withdrawal count stays 0). This is a *scoped, pre-predicted exception to criterion 1*, and it must be visible in the ledger, in the phase record, and in the D-18 audit line — not silently absent.
2. **Supply a real pair for the contract the test now claims.** A supplementary injection against `EntityListWithControls.helpers.ts:19` keeps the spy count intact (so the OLD `10 === 10` assertion stays green) while breaking the *value* the rewritten assertion reads:
   ```diff
     apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts:19
   -  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
   +  const afterGroup = filterGroup ? (filterGroup.apply([...entities]), [...entities]) : [...entities]; // INJECTED (142): the group's result is discarded
   ```
   OLD half: `toHaveBeenCalledTimes(10)` **passes** (apply is still invoked once per call) → blindness demonstrated. NEW half: `expect(observed).toEqual(expected)` **fails** at the first active cycle → the catch demonstrated. This is a *new* injection, so it is not covered by D-06's citation rule — both halves must be run, and the ledger must label it "supplementary — not 139 § 5.5.2".

### ⚠-4 · D-16's stated rationale does not hold: `yarn test:e2e` does **not** run the bank-auth specs.

D-16 justifies the E2E gate by "D-02 changes `…/authorize/+server.ts`, which the Phase-122 bank-auth E2E specs exercise directly". Measured at HEAD `[VERIFIED: tests/playwright.config.ts]`:

- The `bank-auth` project is declared only inside `...(process.env.PLAYWRIGHT_BANK_AUTH ? [ … ] : [])` at `:420-430`, and the whole `bank-auth-journey` project family likewise at `:453-519`.
- The config's own docblock at `:260-267` lists bank-auth under **"OPT-IN projects (excluded from the default run)"**, because "the spec throws at module load without SUPABASE_SERVICE_ROLE_KEY/ANON_KEY and needs the identity-callback Edge Function served".
- `.github/workflows/main.yaml:246` runs plain `yarn test:e2e`; only `PLAYWRIGHT_VISUAL` is ever set (`:319`). **CI never runs bank-auth either.**
- The only test files that reference `api/oidc` are `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` and `tests/tests/support/mockOidcIssuer.ts` `[VERIFIED: repo-wide grep over `tests/`]`.

**So a plain `yarn test:e2e` gate proves that D-01/D-02 broke nothing *else*, but provides zero coverage of the endpoint D-02 changes.** Options for the planner (a decision, not a discovery): (a) run the locked gate **and additionally** `PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c ./tests/playwright.config.ts --project=bank-auth --project=bank-auth-journey`, per the environment prerequisites in `tests/IDURA-TEST-RUNBOOK.md`; or (b) run the locked gate alone and record the coverage gap explicitly in the phase record. **Recommend (a)**, since the endpoint is on the bank-auth path and the phase is changing it.

**Adjacent doc defect, reported not fixed:** `tests/playwright.config.ts:334` and `:338` state that bank-auth "run[s] by default (opt-OUT via PLAYWRIGHT_NO_*)", contradicting `:260-267` and the code at `:420`. Same class as the already-recorded `tests/README.md:124/:135` concurrency drift (STATE.md deferred items). File it; do not fix it here.

### ⚠-5 · D-11 E6 needs a product change that D-17's plan shape does not name.

See § B.9. `getIdTokenClaims` returns `error: {}` for both F20-3 sites today, and both sites reach the **same** branch — so "differ observably" requires a two-code branch split, which is a third product change. E6 authorizes it; D-17 does not budget for it. It belongs at plan 4's existing `autonomous: false` checkpoint, named as a product change.

---

## D. Gates and prerequisites (D-14, D-15, D-16)

### D.1 — What root `yarn test:unit` actually runs, measured

`"test:unit": "yarn assert:unit-coverage && turbo run test:unit"` `[VERIFIED: package.json]`, where `assert:unit-coverage` is `node scripts/assert-unit-test-coverage.mjs` — Phase 141's two-direction guard (declared coverage + turbo execution) `[VERIFIED: scripts/assert-unit-test-coverage.mjs:1-60]`.

**Measured run at HEAD, 2026-08-20** `[VERIFIED — full log retained outside the repo]`:

```
Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — … Check 1: 0 violation(s);
Check 2: 0 violation(s), 11 workspace(s) executed, 4 unwired:
  @openvaa/dev-tools, @openvaa/docs, @openvaa/shared-config, @openvaa/supabase-types
• Running test:unit in 15 packages
 Tasks:    25 successful, 25 total     Cached:    14 cached, 25 total
  Time:    17.489s
yarn test:unit  68,70s user 18,78s system 443% cpu 19,729 total      EXIT=0
```

| Workspace | Test files | Tests | Edited by this phase? |
|---|---|---|---|
| `@openvaa/supabase` | 1 | 16 | no |
| `@openvaa/core` | 3 | 8 | no (Phase 141 wiring) |
| `@openvaa/matching` | 5 | 43 | no (Phase 141 wiring) |
| `@openvaa/app-shared` | 3 | 21 | no |
| `@openvaa/llm` | 2 | 39 | no (Phase 141 wiring) |
| `@openvaa/filters` | 1 | 22 | no |
| **`@openvaa/question-info`** | 2 | 20 | **yes** (Phase 141 wiring) |
| **`@openvaa/argument-condensation`** | 6 | 30 | **yes** (Phase 141 wiring) |
| **`@openvaa/data`** | 47 | 244 | **yes** |
| **`@openvaa/frontend`** | 54 | 773 | **yes** |
| **`@openvaa/dev-seed`** | 43 | 446 | **yes** |
| **Total** | **167** | **1 662** | 5 workspaces edited |

**Answers to the D-14 questions:**
- **Is it green today? YES, exit 0.** So the 3× gate starts from a green baseline; any red is attributable.
- **Is it expensive? NO — ~20 s wall.** 3× consecutive is a one-minute gate. Measure it rather than estimating.
- **Does the Phase-141 wiring reach the four packages this phase edits?** Yes: `question-info`, `argument-condensation`, `data` and `dev-seed` all executed `test:unit` under turbo in the measured run, as did `frontend` (the fifth edited workspace, wired long before 141). All five have a `"test:unit": "vitest run"` script `[VERIFIED: each package.json]`. **Plans must still re-read the scripts (D-17), but the wiring is confirmed present at HEAD.**
- The guard also reports the four deliberately-unwired workspaces by name, so a plan that accidentally adds a test file to `dev-tools`/`docs`/`shared-config`/`supabase-types` will fail the gate loudly rather than silently — worth knowing before someone parks a helper there.

### D.2 — Full `yarn test:e2e` (D-15, D-16): the exact prerequisite sequence

From `CLAUDE.md` and the recorded execution prerequisites, in order:

1. **Clean DB:** `yarn db:reset` (DB only — does not touch the vite cache). Add `yarn db:seed --template e2e/base` only if running an isolated project that needs it; the suite's own `data-setup-*` projects seed themselves.
2. **Exactly one fresh dev server on `:5173`**, started by hand (`yarn dev`), **no Playwright `webServer`** for the app. `yarn dev` now uses `strictPort`, so a port clash fails loudly rather than drifting.
   *The only `webServer` entry in the config is the mock OIDC issuer, and it is gated behind `PLAYWRIGHT_BANK_AUTH` `[VERIFIED: tests/playwright.config.ts:1567-1583]` — so it does not exist in a default run.*
3. **Preflight is automatic and unbypassable:** `globalSetup: './global-setup.ts'` `[VERIFIED: :291]` asserts the served application proves it came from this checkout, via Vite's `/@fs` echo, and aborts with exit 1 before any spec body. `FRONTEND_PORT` moves the target, it does not skip the check (`use.baseURL` at `:327` honours it).
4. **Run:** `yarn test:e2e` = `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe` `[VERIFIED: package.json]`.
5. **Cardinal rule:** any failure blocks; a "did not run" counts as a failure.

**Things in the repo that would trip this, checked:**
- Nothing in the corpus needs Supabase, a network call or an env var for the *unit* work — but the E2E gate needs the full local stack, and `bank-auth` additionally needs `SUPABASE_SERVICE_ROLE_KEY`/`ANON_KEY` and `supabase functions serve --no-verify-jwt` (see ⚠-4 and `tests/IDURA-TEST-RUNBOOK.md`).
- The E2E gate must run **only after the last revert and the last post-gate**. 139 § 3.1's standing prohibition applies verbatim: this phase transiently breaks `apps/frontend/src/routes/api/oidc/authorize/+server.ts` and `…/getIdTokenClaims.ts`; a suite run overlapping an injection window would go red for a manufactured reason and, for the auth files, would be a security event as well as a measurement error.

---

## E. Sequencing (D-06, D-07, D-17)

### E.1 — Recommended plan order

D-17 fixes the six areas and forbids parallel waves. Within that, the recommended order is **3 → 2 → 5 → 1 → 4 → 6**:

| Order | Plan | Area | Why here | Autonomous |
|---|---|---|---|---|
| 1 | **P-3** | `dev-seed` — F18, F20-4 | Two clean OLD-half citations, no product change, and F18's assertion design is the subtlest test-only piece (§ B.6). Doing it first buys a calibration run of the inverted loop with nothing else in flight. | yes |
| 2 | **P-2** | `argument-condensation` — F15-B, F15-C, F16, F20-6, E9 + D-12 | Largest test-only batch; one shared injection covers two findings; the D-12 sweep is already measured (§ B.13) so it is bookkeeping. | yes |
| 3 | **P-5** | `apps/frontend` other — F17 (D-04), F20-2 + `packages/data` F20-5 | Contains the ⚠-3 F17 exception, which the operator should see **before** the two product checkpoints consume attention. | yes |
| 4 | **P-1** | `question-info` — F15-A + D-01 + D-03 | First product fix. New fixture required (⚠-2). | **no** |
| 5 | **P-4** | `apps/frontend` auth — F20-1 + D-02, F20-3 (+ ⚠-5's split) | Second and third product changes; touches authentication material, so it should be as close as possible to the gates that validate it. | **no** |
| 6 | **P-6** | Ledger completion + D-14 (3×) + D-16 + D-18 propagation | Gates last, on a clean tree. | yes |

**Ledger-before-work (D-09) precedes plan 1**: the 12-row table is written in full — with every cell `pending` — before the first injection of P-3. `141-ASSERT10-LEDGER.md` is the local shape precedent; 139 § 4's ordering statement is the rationale.

### E.2 — The ordering constraints inside a product-fix plan (the E10 questions, answered)

**Q: must the product fix land before the assertion is tightened, within the same plan?**
**Yes** — CONTEXT § Specifics already says so, and the reason is measurable: F15-A's T2/T3 and F20-1's `{status:400}` are **red on the clean tree** (§ B.1(c), § B.7). Tightening first leaves the plan's own intermediate commit red, which is indistinguishable from a failed remediation.

**Q: must the OLD half be re-run before the product fix, or after?**
**Before — and before the assertion edit too.** The OLD half is defined as *the OLD assertion under the recorded injection*. The remediation deletes or replaces that assertion, so after the edit there is nothing left to run. For **F20-1** it is doubly forced: post-fix, injection B is off-path (⚠-1), so the OLD half is *only* measurable on the pre-fix tree. For **F15-A** the OLD assertions are blind to the injection either way, but running pre-fix matches 139's measurement conditions exactly and costs nothing.

**Therefore the canonical task order inside P-1 and P-4 is:**

```
1. PRE-GATE (clean tree)
2. OLD half: apply 139's recorded injection → run → observe the OLD assertion GREEN → revert → POST-GATE
3. [checkpoint: human-verify]  ← the D-17 non-autonomous decision point, with the product diff proposed
4. Product fix (D-01 / D-02 / ⚠-5) — commit
5. Assertion strengthening — commit
6. NEW half: apply the injection (F15-A → the same :76 diff; F20-1 → injection A per ⚠-1)
   → run → observe the NEW assertion RED → revert → POST-GATE
7. Ledger rows filled with both halves and their log paths
```

**One more constraint the pre-gate imposes:** because the pre-gate asserts a clean tree over `apps tests packages`, **every durable edit must be committed before the next injection runs**. A plan that edits a test file and then injects without committing will fail its own pre-gate. 139 avoided this by making zero durable source edits; 142 cannot, so the plans must interleave commits with the loop rather than batching them at the end.

---

## Architecture Patterns

### Pattern 1: the inverted negative-control pair (the phase's whole shape)

**What:** for finding N, evidence = (OLD assertion + recorded injection → **green**) ∧ (NEW assertion + the same injection → **red**).
**When:** every one of the 12, except F17 (⚠-3).
**Two-column discipline (D-08):** record the *assertion* outcome and the *file* outcome as separate cells. In 142 the assertion cell must be red and the file cell may be red for collateral reasons — which is exactly why merging them would let a collateral red be credited as the control (F20-6 is the live case: `:94` reds alongside `:104`).
**Isolation:** where a file has siblings that red under the same injection, the **isolated** `-t '<title>'` run is the verdict run and the whole-file run is the collateral record (F18, F20-6).

### Pattern 2: assert the transform, not the fixture

The recurring defect class in this corpus is *asserting a value the test itself handed the mock*. The repair pattern that generalises: assert something the **product** computed — a mapping (`questionId` from `question.id`), a rename (`latencyMs → processingTimeMs`), a partition (locale blocks), a discriminant (`error.code`), an exact message. D-03's repoint and D-11 E4/E6 are the same move at four sites.

### Anti-patterns to avoid

- **Asserting a value copied out of a *failing* run's output.** E3 states the rule for F20-2; it generalises. Pinning what the code currently emits is how a fake guard is manufactured. Pinning what the code *should* emit, confirmed on a green clean-tree run, is measurement.
- **Deriving the assertion's own indices from the constant the injection mutates** (§ B.6). The assertion then moves with the bug.
- **Using a positive control as a negative control.** § 8.3 R-4/R-5/R-8/R-9 red before *and* after; R-10 reds neither. Five named designs, all forbidden.
- **Removing the category instead of varying the detail** (§ 8.3 R-1, and F16's injection A). If the injection makes the test red *before* the remediation, the design is wrong, not the finding.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| The injection procedure | A new per-plan checklist | 139 § 3.1 HYGIENE-LOOP verbatim (D-07) | It is written, proven over 15 findings, and its three post-gate conditions are what make the record auditable |
| The injection diffs | Re-derived breaks | 139 § 5.N.2 verbatim (D-10) | Ten designs were considered and rejected with reasons (§ 8.3); re-deriving re-invents R-1/R-2/R-6/R-7 |
| A per-locale Faker for F18 | A hand-seeded `new Faker(...)` in the test | `__buildLocaleFakerForTests` `[VERIFIED: candidates-override.ts:172-176]` | It is exported for exactly this and is byte-identical to the private `buildLocaleFaker` at `:81-85`; a hand-rolled copy would drift from the seed offsets at `:63-67` |
| Prompt capture for F15-A | A custom spy wrapper | `mockLLMProvider.generateObjectParallel.mock.calls[0][0]` | The mock is already `vi.fn()`; the arg shape is measured (§ B.1(b)) |
| A re-throw guard for D-02 | Hand-written `e instanceof HttpError` | `isHttpError(e)` from `@sveltejs/kit` `[VERIFIED: exports/index.js:90-93]` | `HttpError` is not exported as a value from the public entry; `isHttpError` is the supported predicate |
| An expected-count constant for F20-5 | A hard-coded `35` | the derivation in § B.11 | E5 requires derivation; the measured 35 is for the planner's confidence, not for the test source |
| A test-file lint for the 3 propagation targets | Ad-hoc greps | 139 § 6.2's table | It already enumerates the three targets and the edit shape each takes |

---

## Runtime State Inventory

Not a rename/refactor phase, but the loop mutates runtime state that a naive revert misses. Included for that reason only.

| Category | Items found | Action required |
|---|---|---|
| Stored data | **None.** No corpus test touches Supabase, Postgres, or any datastore; every one is pure in-process `[VERIFIED: all 12 test files read]` | none |
| Live service config | **None** for the unit work. The **E2E** gate needs local Supabase + one dev server; the opt-in bank-auth path additionally needs the mock OIDC issuer (Playwright-managed) and `supabase functions serve` | operator prerequisites, § D.2 |
| OS-registered state | **None.** No task scheduler, pm2 or launchd entry is involved | none |
| Secrets / env vars | `FRONTEND_PORT` (E2E only, optional); `SUPABASE_SERVICE_ROLE_KEY` / `PUBLIC_SUPABASE_ANON_KEY` for the opt-in bank-auth projects; `IDENTITY_PROVIDER_*` read by `getIdTokenClaims.defaultOptions:5-10` but **not** by its tests (they pass options explicitly) `[VERIFIED]` | no key changes; do not run a server while auth injections are live |
| Build artifacts | **Turbo `build` cache** (`.turbo/`) and each package's `dist/`. `test:unit` is `cache: false`, so no stale test result is possible; but `dependsOn: ["build"]` means a live injection under `packages/*/src` during a **root** run rebuilds and propagates that injection into dependents' `dist/` (§ A.3). `packages/argument-condensation/data/operationTrees/` is written by `Condenser.run()` and is gitignored **only inside that package** `[VERIFIED: .gitignore:3]` | keep per-finding runs in-package; never run the root gate with an injection live |

---

## Common Pitfalls

### Pitfall 1 — Reading a red as a failure
**What goes wrong:** an executor pattern-matching on 139's record sees the NEW-half red and "fixes" it by weakening the assertion.
**Why:** 139's success signal was green; 142's is red.
**Avoid:** the inversion sentence at the top of every injection task (§ A.1), and a ledger whose `NEW-assertion outcome` column is labelled *expected: FAIL (red)*.

### Pitfall 2 — Crediting a collateral red as the negative control
**What goes wrong:** F20-6's sibling at `:94` reds under the injection; F20-3's injection A reds three success-path tests at `:147/:174/:203`. Either could be logged as "the assertion caught it".
**Avoid:** isolated `-t` verdict runs, two separate columns, and an explicit `Collateral` column naming the failing `file:line`.

### Pitfall 3 — A control masquerading as a control experiment
**What goes wrong:** using R-4/R-5/R-8/R-9 (red before *and* after) or R-10 (reds neither) as the negative control makes the remediation unverifiable while looking rigorous.
**Avoid:** carry § 8.3's prohibition list into plan text (D-10) and check each proposed injection against it by name.

### Pitfall 4 — An injection that never reached the code
**What goes wrong:** a green NEW half read as "the injection is harmless" when the module never loaded (F17's whole record is this failure mode, deliberately).
**Avoid:** for every NEW half, the *pre-remediation* OLD half is itself the liveness proof — the same file went green→(edit)→red on nothing but its own contents. Where the OLD half is cited rather than re-run (D-06), the liveness claim rides on 139's positive controls, which are recorded per finding; state which one in the ledger row.

### Pitfall 5 — An incomplete revert
**What goes wrong:** two injections live at once; one agent's `git checkout --` reverts the other's.
**Avoid:** strict sequencing (D-17), the three-condition post-gate, and — new for 142 — **commit every durable edit before the next injection**, since the pre-gate now runs against a tree that legitimately changes (§ E.2).

### Pitfall 6 — `--passWithNoTests` / a test that never ran
**Measured: not a live risk.** No `test:unit` script in the tree passes `--passWithNoTests`; all five relevant scripts are exactly `vitest run` `[VERIFIED: package.json × 5]`, and the Phase-141 guard additionally asserts that a test-bearing workspace both declares the script and is executed by turbo `[VERIFIED: scripts/assert-unit-test-coverage.mjs — Check 1 + Check 2]`. The residual form of this pitfall is a `-t 'title'` filter that matches **nothing** and reports `1 passed | N skipped` — which is what a *typo in the title* looks like. **Every isolated verdict run must have its "N passed" count checked against 1**, exactly as 139 recorded (`27 tests | 26 skipped`, `Tests 1 passed`).

### Pitfall 7 — A turbo-cached green
**Measured: structurally impossible for `test:unit`** (`"cache": false`; the run printed `cache bypass, force executing`). The residual risk is the *build* cache propagating an injected `dist/` — addressed in § A.3 by keeping per-finding runs in-package.

### Pitfall 8 — Pinning a value read out of the run instead of out of the contract
See Anti-patterns. F15-C's per-run argument count is the live instance: it must be confirmed on a **green clean-tree** run, and the ledger must say so.

---

## Code Examples

### Capturing the prompt a mocked provider received (F15-A)
```ts
// Source: measured against packages/question-info/src/core/infoGeneration.ts:102-121, 2026-08-20
const [arg] = mockLLMProvider.generateObjectParallel.mock.calls[0];
//   arg:              { requests, maxConcurrent, controller }
//   arg.requests[i]:  { schema, messages, temperature, validationRetries }
//   …messages[0]:     { role: 'system', content: <the composed prompt> }
const prompt = arg.requests[0].messages[0].content as string;
expect(prompt).toContain('Do you support universal healthcare?');
```

### The type-discrimination assertion that actually fails today (F15-A, T2 — needs a NEW fixture)
```ts
// Source: mechanism measured 2026-08-20 — same name + different type ⇒ byte-identical prompts today
const root = new DataRoot();
const shared = { name: 'Should the voting age be lowered?', categoryId: 'c', info: 'i' };
const boolQ = new BooleanQuestion({ data: { id: 'q-b', type: QUESTION_TYPE.Boolean, ...shared }, root });
const catQ  = new SingleChoiceCategoricalQuestion({
  data: { id: 'q-c', type: QUESTION_TYPE.SingleChoiceCategorical, ...shared,
          choices: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] }, root });

mockLLMProvider.generateObjectParallel.mockResolvedValue([/* one response per question */]);
await generateQuestionInfo({ questions: [boolQ, catQ], options });

const [arg] = mockLLMProvider.generateObjectParallel.mock.calls[0];
const [pBool, pCat] = arg.requests.map((r) => r.messages[0].content as string);
expect(pBool).not.toBe(pCat);        // RED today, GREEN after D-01
expect(pCat).toContain('Yes');       // RED today, GREEN after D-01 (choice labels)
```

### The D-02 fix, in the shape the sibling endpoint already uses
```ts
// Source: apps/frontend/src/routes/api/oidc/callback/+server.ts:97-99 (in-tree model)
//         @sveltejs/kit 2.55.0 exports/index.js:90-93 (isHttpError)
import { error, isHttpError, json } from '@sveltejs/kit';
// …
  } catch (e) {
    if (isHttpError(e)) throw e;   // the endpoint's own 4xx contract survives its catch
    console.error('Failed to construct authorization request:', e);
    return error(500, { message: 'Failed to construct authorization request' });
  }
```

### The F20-3 discriminant, added without touching the catch
```ts
// Source: apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts:28-30 (throw site) and :48-54 (catch branch)
if (options.privateEncryptionJWKSet.length === 0) {
  throw Object.assign(new Error('Cannot decode ID token: no decryption JWKs are configured.'),
                      { code: 'ERR_JWKS_EMPTY' });
}
if (!privateEncryptionJWK) {
  throw Object.assign(new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`),
                      { code: 'ERR_JWK_KID_MISMATCH' });
}
```

---

## Standard Stack

No new dependency is introduced or needed. Everything this phase uses is already installed and already exercised by the measured green gate.

| Tool | Version @HEAD | Purpose | `[VERIFIED]` |
|---|---|---|---|
| vitest | 3.2.4 | every unit run, isolated (`-t`) and whole-file | 139 § 2 stamp + this session's runs |
| turbo | 2.8.17 | `turbo run test:unit` across 15 workspaces | measured run banner |
| `@sveltejs/kit` | 2.55.0 | `error()` / `isHttpError()` semantics behind D-02 | `node_modules/@sveltejs/kit/package.json` |
| `@faker-js/faker` | (workspace-pinned) | F18's per-locale replay via `__buildLocaleFakerForTests` | `candidates-override.ts:172` |
| Playwright | (workspace-pinned) | the D-16 gate only | `tests/playwright.config.ts` |
| Node | v24.14.1 | runner | `node --version` this session |

## Package Legitimacy Audit

**Not applicable — this phase installs no external package.** No `npm install` / `yarn add` appears anywhere in the twelve remediations, the two product fixes, or the gates; every symbol used is already in the workspace or already a direct dependency. Recorded explicitly rather than omitted, so the planner does not have to re-derive the absence. **Packages removed due to [SLOP]: none. Packages flagged [SUS]: none.**

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | ✓ | v24.14.1 | — |
| Yarn | root scripts | ✓ | 4.13.0 (`packageManager`) | — |
| turbo | `yarn test:unit` | ✓ | 2.8.17 | — |
| vitest | every injection run | ✓ | 3.2.4 | — |
| Built `dist/` for `core`/`data`/`llm` | bare-specifier imports inside the two AI packages' tests | ✓ present at HEAD | — | `yarn build` (also run automatically by `test:unit`'s `dependsOn`) |
| Local Supabase | **E2E gate only** | not probed this session (the phase's unit work needs none) | — | none — D-16 requires it |
| Dev server on `:5173` | **E2E gate only** | operator-started, per D-15 | — | `FRONTEND_PORT` moves the port for both `yarn dev` and the suite |
| `SUPABASE_SERVICE_ROLE_KEY` / `PUBLIC_SUPABASE_ANON_KEY` + `supabase functions serve` | **opt-in bank-auth projects only** (⚠-4) | not probed | — | run the locked gate alone and record the coverage gap |

**Missing dependencies with no fallback:** none for the unit work. **Missing with fallback:** the bank-auth environment (see ⚠-4 for the two options).

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` `[VERIFIED]` → treated as enabled.

### Test framework
| Property | Value |
|---|---|
| Framework | vitest 3.2.4 (per-workspace configs; root `vitest.workspace.ts` = `['packages/**/vitest.config.ts']`) |
| Config files | `packages/{question-info,argument-condensation}/vitest.config.ts` (both add `setupFiles: ['./tests/setup.ts']`); `packages/{dev-seed,data}/vitest.config.ts` (empty markers); `apps/frontend/vitest.config.ts` (jsdom + svelte plugin + `$lib`/`$app` aliases) |
| Quick run (per finding) | `cd <workspace> && npx vitest run <file> [-t '<title>']` |
| Full suite | `yarn test:unit` (guard + `turbo run test:unit`, 11 workspaces, 1 662 tests, ~20 s) |

### Phase requirements → test map
| Req | Behaviour | Test type | Automated command | File exists? |
|---|---|---|---|---|
| ASSERT-07 / F15-A | prompt carries question text, type, choice labels | unit | `cd packages/question-info && npx vitest run tests/questionTypes.test.ts` | ✅ (new test case to add) |
| ASSERT-07 / F15-B | `result.data.arguments` content | unit | `cd packages/argument-condensation && npx vitest run tests/condensation/condenserStandalone.test.ts` | ✅ |
| ASSERT-07 / F15-C | per-run arguments across 3 clusters | unit | `… npx vitest run tests/condensation/condenseQuestions.test.ts` | ✅ |
| ASSERT-07 / F16 | exact language-rejection message | unit | `… npx vitest run tests/unit/handleQuestion.test.ts` | ✅ |
| ASSERT-07 / F17 | `computeFiltered` value contract | unit | `cd apps/frontend && npx vitest run src/lib/dynamic-components/entityList/EntityListWithControls.helpers.test.ts` | ✅ (renamed) |
| ASSERT-07 / F18 | locale block boundary | unit | `cd packages/dev-seed && npx vitest run tests/templates/default.test.ts -t 'Test 10'` | ✅ |
| ASSERT-07 / F20-1 | 400 status | unit | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | ✅ |
| ASSERT-07 / F20-2 | exact ICU fallback | unit | `cd apps/frontend && npx vitest run src/lib/i18n/tests/overrides.test.ts` | ✅ |
| ASSERT-07 / F20-3 | error code discriminant | unit | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/getIdTokenClaims.test.ts` | ✅ |
| ASSERT-07 / F20-4 | exact selected columns | unit | `cd packages/dev-seed && npx vitest run tests/supabaseAdminClient.test.ts` | ✅ |
| ASSERT-07 / F20-5 | length guard + id membership | unit | `cd packages/data && npx vitest run src/objects/nominations/variants/variants.test.ts` | ✅ |
| ASSERT-07 / F20-6 | exact message | unit | `cd packages/argument-condensation && npx vitest run tests/unit/planValidation.test.ts -t 'It should throw if a final map step would produce multiple batches'` | ✅ |
| D-01 / D-02 regression safety | nothing else broke | integration | `yarn test:unit` ×3, then `yarn test:e2e` | ✅ |

### Sampling rate
- **Per task commit:** the workspace-scoped `npx vitest run <file>` above.
- **Per plan close:** that workspace's `yarn workspace @openvaa/<pkg> test:unit`.
- **Phase gate:** `yarn test:unit` **3× consecutive green** (D-14) then one full `yarn test:e2e` (D-16).

### Wave 0 gaps
- [ ] `142-NEGATIVE-CONTROL-LEDGER.md` — 12 rows, all cells `pending`, written **before** the first injection (D-09).
- [ ] The F15-A type-discrimination fixture (⚠-2) — new test case, not an edit.
- [ ] No framework install, no config change, no new test file elsewhere.

---

## Security Domain

`security_enforcement` is absent from `.planning/config.json` → enabled.

### Applicable ASVS categories

| Category | Applies | Standard control at the sites this phase touches |
|---|---|---|
| V2 Authentication | **yes** | `getIdTokenClaims` verifies a JWE/JWS via `jose.compactDecrypt` + `jose.jwtVerify` with `audience`/`issuer` `[VERIFIED: getIdTokenClaims.ts:32-37]`. ⚠-5's change adds an error **code**; it must not add an error **message** that leaks key material — `ERR_JWKS_EMPTY` / `ERR_JWK_KID_MISMATCH` are opaque by design, and the existing message already contains only the `kid` (an identifier, not a secret) |
| V3 Session management | partial | the authorize endpoint sets `oidc_state` / `oidc_nonce` as httpOnly, secure, sameSite=lax cookies `[VERIFIED: +server.ts:30-47]` — **D-02's fix must not move or skip those `cookies.set` calls**; option (B) does not touch them, option (A) risks it |
| V4 Access control | no | no authorization decision is changed |
| V5 Input validation | **yes** | the `redirectUri` guard is *the* input validation at this endpoint; D-02 restores its ability to report a 400 |
| V6 Cryptography | **yes, hands off** | `jose` does all crypto; nothing in this phase writes a crypto primitive |

### Known threat patterns for this stack

| Pattern | STRIDE | Mitigation, and this phase's obligation |
|---|---|---|
| Weakened auth left live in the tree | Elevation of privilege | The `getIdTokenClaims.ts` injections remove the entire successful-verification path. **Each must be live only inside its own HYGIENE-LOOP iteration, reverted with `git checkout --` before the next begins, and no server may run while any is live** (139 § 3.1 standing constraint + § 5.12.5's security note). The post-gate's `git diff --exit-code` over the file is the proof. |
| Error-message information disclosure | Information disclosure | ⚠-5 adds codes, not messages. Do not append the JWKS contents or the configured kids to any thrown message. |
| Status-code confusion masking an attack signal | Repudiation | The D-02 defect currently reports every client-side 400 as a server-side 500, which pollutes incident triage. Fixing it is a security improvement as well as a test enabler — worth stating at the checkpoint. |
| Injected auth code reaching a commit | Tampering | The three-condition post-gate plus the `INJECTED (142)` marker grep. 139 recorded `git diff --exit-code` over `getIdTokenClaims.ts` exiting 0 at the close of its record; 142 should do the same for both auth files. |

---

## State of the Art

| Old approach | Current approach | When changed | Impact here |
|---|---|---|---|
| `packages/{core,matching,llm,question-info,argument-condensation}` outside `test:unit` | all 11 test-bearing workspaces wired + a two-direction guard | Phase 141 (closed 2026-08-18) | The four AI/data packages this phase edits are demonstrably in the gate (§ D.1) — the dependency ROADMAP asserts is real |
| `return error(4xx, …)` treated as returning | `error()` throws in SvelteKit 2 | kit 2.x | D-02's whole mechanism; and the reason one of its two named options is a no-op |
| Per-package ad-hoc vitest runs (139's D-05) | `yarn workspace @openvaa/<pkg> test:unit` also available | Phase 141 | Either works; the loop should keep 139's `npx vitest run` form so the invocation strings match the cited record |

**Deprecated/outdated in the inputs:**
- 139 § 5.5.1's "262 lines" for `EntityListWithControls.test.ts` — the file is 138 lines and unchanged (§ A.4).
- 139 § 5.1.6 target 2's "fails today" (⚠-2).
- 139 § 5.2.6 target 3's "source-comment IDs" (§ B.2 — the `Argument` type has no such field).
- D-10's "F20-1 → injection B" for the **NEW** half (⚠-1).
- `tests/playwright.config.ts:334/:338`'s "bank-auth runs by default" (⚠-4).

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Post-fix, injection A reds the strengthened F20-1 assertion and injection B does not | ⚠-1, § B.7 | `[DERIVED]` from the measured control flow; not executed because executing it requires the product change. If wrong, F20-1's NEW half needs a third injection design — the executor discovers this immediately, at the point of running it |
| A2 | F15-C's per-run argument count is 2 for all three clusters | § B.3 | `[ASSUMED]` by analogy with the measured standalone case. Executor confirms on the clean tree before pinning; wrong ⇒ a red clean-tree run, caught immediately |
| A3 | F18's fresh-Faker replay matches the generated block byte-for-byte | § B.6 | `[DERIVED]` from reading the loop (two draws per row, emitter branch skipped when `refs.questions` is empty). Wrong ⇒ a red clean-tree run; would itself be a finding worth recording |
| A4 | Adding `questionType` to `params.required` in the three YAMLs breaks nothing | § C.1 | `[DERIVED]` from `promptRegistry.ts:352` + `setPromptVars.ts:44-63`. Wrong ⇒ `question-info`'s 20 tests red loudly at the first run after the edit |
| A5 | The two-code split for F20-3 is accepted at the plan-4 checkpoint | ⚠-5, § B.9 | `[ASSUMED]` — it is an operator decision. If declined, E6's "differ observably" clause cannot be satisfied and the fallback (one shared code) must be recorded as a deliberate narrowing |
| A6 | `tests/IDURA-TEST-RUNBOOK.md` still describes the current bank-auth prerequisites | ⚠-4, § D.2 | `[ASSUMED]` — the file exists and is referenced by the config, but its contents were not read this session |

---

## Open Questions

1. **Does the operator want the opt-in bank-auth projects run as part of the D-16 gate?**
   - Known: the default `yarn test:e2e` does not touch the endpoint D-02 changes (⚠-4, measured).
   - Unclear: whether the local environment currently has the service-role key and the identity-callback function servable.
   - Recommendation: raise it at the plan-4 checkpoint alongside the D-02 diff; default to running them, and record the gap explicitly if the environment cannot support it.

2. **Does F17's ledger row read `N/A — by construction` or does the phase run the supplementary helpers-level pair?**
   - Known: 139 § 5.5.6 predicts the impossibility in advance; D-04 locks the branch that causes it.
   - Recommendation: **both** — the honest `N/A` cell *and* the supplementary pair (⚠-3), so the row carries evidence as well as an admission.

3. **Does D-03's repoint land on the metric renaming or on the response discrimination?**
   - Known: the transform is not identity; both are real product logic; `questionId` is already covered elsewhere.
   - Recommendation: the metric renaming (§ B.1(d)) — it is the only mapping in the file that nothing else asserts.

4. **Is `api/cache/+server.ts:56` worth a standing todo, or is it noise?**
   - Known: it is a live third instance of the same swallow, reporting upstream 4xx as 500 (§ C.2).
   - Recommendation: `/gsd-capture` it alongside the D-19 items; do not fix it here.

---

## Sources

### Primary (HIGH confidence) — read or executed this session
- `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md` §§ 1–4.3, 5.1–5.6, 5.10–5.15, 6.2, 7, 8.1 (C-1), 8.3 (R-1…R-10), 8.4 — read in full for the twelve in-scope findings
- `.planning/phases/142-.../142-CONTEXT.md` — all 20 decisions
- `.planning/ROADMAP.md:469-482`, `.planning/REQUIREMENTS.md:60`, `.planning/audits/2026-08-11-fake-guard-sweep.md:771-790`
- All 12 corpus test files and all 11 code-under-test files, at HEAD (cited inline by `file:line`)
- `turbo.json`, root and 8 workspace `package.json`s, `vitest.workspace.ts`, 5 `vitest.config.ts`, `scripts/assert-unit-test-coverage.mjs`, `tests/playwright.config.ts` (§§ 255-300, 330-430, 1555-1584), `.github/workflows/main.yaml`
- `node_modules/@sveltejs/kit@2.55.0` — `src/exports/index.js:75-93`, `src/exports/internal/index.js` (`class HttpError`)
- **Measurements executed 2026-08-20:** root `yarn test:unit` (exit 0, 20 s, 11 workspaces, 1 662 tests); `parseNominationTree(getTestData().nominations)` → 35, with the tree shape; `Condenser.run()` on `condenserStandalone`'s exact input → `data.arguments.length === 2`, regenerated UUID ids, `processingTimeMs = 1.228`; three `generateQuestionInfo` calls with prompt capture → same-name/different-type prompts byte-identical, different-name prompts different, choice labels absent, `question.info` absent; the D-12 grep sweep; the `question.type|QUESTION_TYPE|choices` scope grep (exit 1)

### Secondary (MEDIUM confidence)
- `141-ASSERT10-LEDGER.md` (ledger shape precedent), `141-CONTEXT.md` D-01 (the five wired packages), `.planning/STATE.md` (standing acceptance rule, deferred items)
- `CLAUDE.md` — E2E hard rule, preflight, `db:*` vs `dev:*` split

### Tertiary (LOW confidence)
- `tests/IDURA-TEST-RUNBOOK.md` — referenced by the config for bank-auth prerequisites; **not read this session** (A6)

---

## Project Constraints (from CLAUDE.md)

| Directive | How this phase must comply |
|---|---|
| **E2E hard rule — failing E2E is a cardinal failure; "did not run" counts as a failure; no known-flaky exemptions** | D-16's single full run is a blocking gate; no retry-until-green, no annotation |
| **E2E preflight — served-application gate, no bypass** | Automatic via `globalSetup`; one fresh dev server on `:5173`, `FRONTEND_PORT` to move it |
| **`db:*` touches only the database; `dev:*` drives the full stack** | Use `yarn db:reset` before the suite, `yarn dev` for the server; never `dev:reset` mid-gate (it wipes the vite cache and relaunches) |
| **Use TypeScript strictly; avoid `any`** | The new assertions must not add `any`. `mock.calls[0][0]` is untyped — type the capture with a narrow local interface rather than `as any`. Existing `as any` at `questionTypes.test.ts:17` is pre-existing and out of scope |
| **Never commit sensitive data** | The auth injections are transient by construction; the post-gate proves it |
| **Localization — user-facing strings support multiple locales** | D-01 adds prompt **variables**, not user-facing strings; the prompt tree is `en/`-only today and stays that way (localising the type label is a D-19 iii deferral) |
| **Check the code-review checklist (`.agents/code-review-checklist.md`)** | Applies to the three product diffs (D-01, D-02, ⚠-5) |
| **Context destructuring rule (Svelte 5)** | Touched only if F17's remedy 1 were chosen; **D-04 chose remedy 2**, so no Svelte context is read and the rule is not engaged |

---

## Metadata

**Confidence breakdown:**
- **Per-finding surface (§ B):** HIGH — every site re-read at HEAD, drift measured, two of the three "discretion" questions closed by measurement rather than judgement.
- **The loop and its failure modes (§ A, § Common Pitfalls):** HIGH — rebuild-not-needed and cache-cannot-mask are both measured, not reasoned.
- **The two product fixes (§ C):** HIGH on mechanism (SvelteKit source read; the `question-info` prompt pipeline driven end-to-end), MEDIUM on the D-01 diff's exact final shape (YAML wording is a judgement call).
- **Gates (§ D):** HIGH for unit (measured green, timed), MEDIUM for E2E (not executed here; prerequisites read from config and CLAUDE.md).
- **Forward predictions (⚠-1, A1):** MEDIUM — sound mechanism, not executed, and deliberately left for the executor to confirm.

**Research date:** 2026-08-20
**HEAD measured:** `03eb3b183` (branch `feat-gsd-roadmap`); 139's baseline was `12825b479`
**Valid until:** ~14 days, or until any of the eleven test files / five product files changes — the § A.4 drift table is the thing that decays first.
