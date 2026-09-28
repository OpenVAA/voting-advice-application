# Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard - Research

**Researched:** 2026-08-18
**Domain:** Monorepo CI wiring (Yarn 4 workspaces + Turborepo + Vitest 3) and config-load invariant guards (Playwright)
**Confidence:** HIGH — every claim below is a file+line citation or a quoted command output from this session. No external-domain research was needed; this phase is entirely codebase-internal.

---

## Summary

This phase has **two workstreams that are in very different states**, and the single most important finding is that they are not equally unbuilt.

**The UNIT-* workstream is exactly as CONTEXT.md describes it.** Five `packages/*` workspaces (`core`, `matching`, `llm`, `question-info`, `argument-condensation`) hold 18 test files / 140 tests that no CI command executes. I re-ran all five at HEAD after `yarn build`: **140/140 pass, zero failures, no network, no API key** — D-01 reproduced exactly. I also captured the phase's "before" negative control directly: planting a deliberately failing assertion in `packages/core` **and** `packages/matching` simultaneously leaves `yarn test:unit` at **EXIT=0** with the planted filenames appearing zero times in the output. That is SC-1's blindness half, already measured and quotable.

**The ASSERT-10 workstream is already built, shipped, and functionally complete at HEAD.** `tests/playwright.config.ts:137-240` contains a `TEARDOWN-PREFIX-UNIQUENESS GUARD` that does everything D-03/D-04/D-05 specify and more. It was landed by Phase 140 itself (`abe1fabb0`, 2026-08-15 20:04) and hardened twice after (`bdb759575` IN-01, `c15e444e8` IN-02). I proved all four of its branches by injection this session — equality collision, prefix-containment overlap, unparsed-declaration completeness, and the legitimate no-prefix exclusion — plus a clean-baseline pass and a clean revert. The ROADMAP's claim at `:387` that "no config-load prefix-uniqueness guard exists" and REQUIREMENTS.md `:63`'s parenthetical "the guard against a *future* duplicate was never built" are **both false at HEAD**. CONTEXT.md inherited that error and wrote four decisions (D-03..D-06) specifying a guard that already exists — and D-04 in particular specifies a regex **narrower** than the shipped one.

**Primary recommendation:** Plan this as **one build workstream (UNIT-01..04) plus one evidence-and-reconciliation workstream (ASSERT-10)**. Do not write a second prefix guard. For ASSERT-10, plan a task that (a) records the four-branch injection proof the standing acceptance rule demands and Phase 140 never produced, and (b) corrects the two false provenance statements in ROADMAP.md and REQUIREMENTS.md. Treat D-03/D-04/D-05 as *satisfied-by-inspection* against the shipped code rather than as build instructions, and explicitly do **not** let D-04's narrower regex replace the shipped one.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `.planning/phases/141-.../141-CONTEXT.md` § Implementation Decisions. **Annotations in bold are this research's findings against the decision — the planner must resolve the flagged ones before writing tasks.**

- **D-01:** All five unwired packages are **green today**, with no live API key and no network. Measured per package with `npx vitest run` after `yarn build`: `core` 3/8 pass, `matching` 5/43 pass, `llm` 2/39 pass, `question-info` 2/20 pass, `argument-condensation` 6/30 pass; total 18 files / 140 tests / 0 failures. Every `apiKey` in these tests is a `'test-api-key'` literal; there are no `process.env` reads; `condenserIntegration.test.ts` is fully mocked. All five already ship a `vitest.config.ts` and the vitest catalog dependency. Consequence for UNIT-02: the anticipated "requires a live API key" blocker does not exist. All three Experimental packages are **wired**, not skip-contracted; **no skip contract is written.** The `turbo run test:unit --dry=json` cross-check is still owed.
  — **REPRODUCED THIS SESSION, exact match.** See § Measured Ground Truth Table 2.

- **D-02:** The 27 teardown prefixes are currently **distinct and mutually non-prefixing** — verified by extracting every `const PREFIX = '...'` and testing all ordered pairs for `startswith`. So ASSERT-10's guard passes on the current tree and needs no remediation commit ahead of it.
  — **REPRODUCED THIS SESSION: 27 declarations, 0 containment violations.** Note the tree holds **28** `*.teardown.ts` files; the 28th (`candidate-journey.teardown.ts`) legitimately declares no prefix.

- **D-03:** Strictness is **prefix-containment**, not string equality. Throw when any declared prefix is a prefix of another.
  — **ALREADY IMPLEMENTED** at `tests/playwright.config.ts:230`. Proven by injection this session (§ Injection Ledger, run B). No work owed beyond recording the proof.

- **D-04:** Extraction is a **declaration-site regex**, `/^const PREFIX = '([^']+)';/m` per file — NOT a whole-file scan, and NOT the comment-stripping approach its sibling guard uses. Rationale (measured): 22 of the 27 prefixes appear textually in more than one teardown file… All 27 sites already use this exact uniform one-line shape, so the guard is **read-only — zero edits to the 27 teardown files.**
  — **⚠️ TWO CORRECTIONS OWED (see § Open Questions Q1).** (a) The guard already ships a *strictly wider* regex at `:199` that also accepts `export const`, a `: string` annotation, flexible whitespace and double quotes. D-04's narrower pattern would be a **downgrade**; do not apply it. (b) The "22 of 27 appear textually in more than one teardown file" figure does not reproduce — I measure **1 of 27** across files. The *intra*-file version of the claim is real (`perm-hide-election-tags.teardown.ts:4` restates its own prefix in a docblock beside the declaration at `:11`), and that still justifies declaration-site extraction, but the stated cross-file number is wrong. Moot for the build, since the guard exists.

- **D-05:** The guard lives at **config load in `tests/playwright.config.ts`**, alongside ORPHAN-PROBE and SOFT-ASSERTION-BUDGET. Config-load placement is load-bearing: `--list` does not run `globalSetup`.
  — **ALREADY IMPLEMENTED**, top-level in the module body at `:179-240`. Confirmed load-bearing this session: `--list` throws.

- **D-06:** Rejected — moving all 27 prefixes into a shared exported registry. Recorded in Deferred rather than dropped. — **Unaffected; still correctly deferred.**

- **D-07:** The guard **wraps the root `test:unit` script**: `"test:unit": "node <guard> && turbo run test:unit"`. It fires on the exact command whose invariant it protects — every local run and CI `main.yaml:70` (`run: yarn test:unit`). Composing root scripts with `&&` is already the in-tree idiom.
  — **VERIFIED FEASIBLE.** `main.yaml:70` is `run: yarn test:unit`; root `lint:check` is the `&&`-composition precedent. See § Wiring Surfaces.

- **D-08:** Guard implementation is a **plain root-level Node script with no build step** (e.g. `scripts/assert-unit-test-coverage.mjs`), not a `packages/dev-tools` entry point. Rationale — bootstrapping. Planner may relocate the file if it finds a better home that preserves the no-build property — the constraint is the property, not the path.
  — **VERIFIED SOUND.** No root `scripts/` directory exists yet (this creates one). See § Pitfall 4 for two hygiene consequences the planner should handle.

- **D-09:** Detection rule: a `packages/*` workspace containing at least one test file (`*.test.ts` / `*.spec.ts` / `*.test.tsx`, excluding `node_modules`) and declaring no `test:unit` script FAILS, with the message naming the workspace. Note: `packages/dev-tools`, `packages/shared-config` and `packages/supabase-types` currently have **zero** test files and no `test:unit` script — they must stay passing.
  — **REPRODUCED EXACTLY.** See § Measured Ground Truth Table 1 — those three are the only zero-test packages, and the guard's five current violators are precisely the five D-10/D-11 wire.

- **D-10:** For `llm`, `question-info` and `argument-condensation`: **rename the existing `test` script to `test:unit`** rather than adding a second entry point or aliasing. Verified safe: nothing in CI or the root scripts invokes a bare `yarn workspace X test`.
  — **VERIFIED.** All three declare `"test": "vitest run"` today. Only two CI invocations exist (`main.yaml:70`, `:197`) and neither is a bare `test`. `test:watch` differs per package (`llm`/`question-info` use `vitest`; `argument-condensation` uses `vitest watch`) — leave as-is per the decision.

- **D-11:** For `core` and `matching`: add `test:unit` (neither has any test script today). — **VERIFIED:** both declare no `test`, no `test:unit`, no `test:watch`.

- **D-12:** All five newly-wired packages use **bare `vitest run`**, NOT `--passWithNoTests`. — **VERIFIED CONSEQUENTIAL:** bare `vitest run` with zero test files exits **1** ("No test files found, exiting with code 1"); with `--passWithNoTests` it exits **0**. Measured this session. See § Pitfall 3 for the interaction with SC-4's "removing the test file makes it pass" direction.

- **D-13:** The five already-wired packages carrying `--passWithNoTests` (`app-shared`, `data`, `dev-seed`, `filters`, `docs`) are **left alone**. — **Confirmed as the current state**; `@openvaa/docs` is in `apps/`, not `packages/`, but the flag reading is correct.

- **D-14:** UNIT-03 is a constraint on plan **shape**, not a task: plan 01 measures every candidate package and commits the per-package pass/fail record; later plans wire only what plan 01 recorded green. The D-01 table above is discussion-time evidence and does **not** substitute for that commit — the record must predate the wiring commits in git order.
  — **Unaffected.** This research's Table 2 is likewise *not* a substitute; it is a feasibility check. Plan 01 still owes its own committed run.

### Claude's Discretion

- Exact guard filenames, error-message wording, and how the two guards are factored (shared helper vs. independent blocks) — subject to the constraints above.
- Plan count and wave structure. Note the two workstreams (UNIT-* wiring vs. ASSERT-10 prefix guard) touch disjoint files and have no ordering dependency between them; only UNIT-03's measure-before-wire ordering is load-bearing.

### Deferred Ideas (OUT OF SCOPE)

- **Shared teardown-prefix registry** (D-06) — move all 27 `const PREFIX` declarations into one exported module. Revisit if the guard ever fires in anger.
- **Harmonise `--passWithNoTests`** (D-13) — strip the flag from `app-shared`, `data`, `dev-seed`, `filters`, `docs`.
- **Three sibling `Rigidity contract` drift files** — recorded as a follow-up in `tests/playwright.config.ts:52-55`; do not widen `SOFT_ASSERTION_BUDGETS` while nearby.
- All six todos reviewed and not folded (see CONTEXT.md § Reviewed Todos), notably *Rewrite parent answer imputation* — touches `packages/matching`, which this phase only *wires*.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UNIT-01 | `yarn test:unit` executes the test files in `@openvaa/matching` and `@openvaa/core`; a deliberately failing assertion in either turns CI red. | Blindness half **already measured** (§ Injection Ledger run G: both plants present → `yarn test:unit` EXIT=0, 21/21 tasks green, `zz-plant` appears 0 times). Wiring surface is one `scripts` line per `package.json` (D-11). Catch half is trivially reachable once wired: bare `vitest run` propagates a non-zero exit through turbo. |
| UNIT-02 | Each of `llm`, `question-info`, `argument-condensation` is wired or carries a documented skip contract. | All three green with no key/network (Table 2) → wire, no skip contract (D-01). **Cross-check mechanics discovered:** `turbo run test:unit --dry=json` lists *all 15* workspaces, including unwired ones, with `"command": "<NONEXISTENT>"`. The discriminator is `task.command !== '<NONEXISTENT>'`, not task presence. See § Pitfall 1 — this is the single most likely way to build a fake cross-check. |
| UNIT-03 | Every package wired in is confirmed green **before** its script is added. | Plan-shape constraint (D-14). Table 2 proves the measurement is cheap (~2 s total across all five) and reproducible, so plan 01 can own it without difficulty. Git-order property is the deliverable, not the numbers. |
| UNIT-04 | A CI guard fails **by name** when a `packages/*` workspace contains test files but declares no `test:unit` script. | Guard host decided (D-07/D-08). SC-4's negative-control feasibility **measured**: a scratch `packages/zz-scratch/` with a `package.json` and a test file, added with **no `yarn install`**, is picked up cleanly by turbo (`--dry=json` EXIT=0, workspace present in the task graph) and leaves `yarn test:unit` at EXIT=0 — the exact "before" state SC-4 needs, with no lockfile friction. See § Injection Ledger run H. |
| ASSERT-10 | A config-load guard fails by name when two `*.teardown.ts` sites declare the same external-ID prefix, proven by injection then reverted. | **Guard already exists and is proven.** `tests/playwright.config.ts:137-240`. Four branches injected and observed this session (§ Injection Ledger runs A–F). What remains is the *record* (the standing acceptance rule's two-run control was never written for it) and the *documentation correction* (ROADMAP `:387`, REQUIREMENTS `:63`). |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Executing package unit tests | Turborepo task graph (`turbo.json` `test:unit`) | Per-workspace Vitest | Turbo owns fan-out and `dependsOn: ["build"]`; Vitest owns discovery inside a workspace. |
| Fanning out to workspaces | Root `package.json` `test:unit` script | GitHub Actions `main.yaml:70` | Root script is the single chokepoint both CI and local runs pass through — the correct place to gate. |
| Package-coverage invariant (UNIT-04) | Root Node script, pre-turbo | — | Must run before any build output exists (turbo's `test:unit` `dependsOn: ["build"]`), so it can have no build dependency of its own. |
| Teardown-prefix invariant (ASSERT-10) | Playwright config module body | — | `--list` does not run `globalSetup`; only config-load code fires on every invocation. **Already resident.** |
| Test discovery inside a package | `packages/<name>/vitest.config.ts` | root `vitest.workspace.ts` (deprecated) | Two parallel discovery paths exist today — see § Pitfall 2. |

---

## Measured Ground Truth

### Table 1 — `packages/*` coverage matrix (measured 2026-08-18 at HEAD `69d0a2d3c`)

Command: per-workspace `find … -name '*.test.ts' -o -name '*.spec.ts' …` excluding `node_modules`, plus `package.json` script read.

| Workspace | Test files | `test:unit` | `test` | `test:watch` | UNIT-04 guard verdict |
|---|---:|---|---|---|---|
| `@openvaa/app-shared` | 3 | `vitest run --passWithNoTests` | — | — | pass |
| `@openvaa/argument-condensation` | 6 | **NONE** | `vitest run` | `vitest watch` | **FAIL** (D-10 renames) |
| `@openvaa/core` | 3 | **NONE** | — | — | **FAIL** (D-11 adds) |
| `@openvaa/data` | 47 | `vitest run --passWithNoTests` | — | — | pass |
| `@openvaa/dev-seed` | 43 | `vitest run --passWithNoTests` | — | — | pass |
| `@openvaa/dev-tools` | 0 | NONE | — | — | pass (no tests) |
| `@openvaa/filters` | 1 | `vitest run --passWithNoTests` | — | — | pass |
| `@openvaa/llm` | 2 | **NONE** | `vitest run` | `vitest` | **FAIL** (D-10 renames) |
| `@openvaa/matching` | 5 | **NONE** | — | — | **FAIL** (D-11 adds) |
| `@openvaa/question-info` | 2 | **NONE** | `vitest run` | `vitest` | **FAIL** (D-10 renames) |
| `@openvaa/shared-config` | 0 | NONE | — | — | pass (no tests) |
| `@openvaa/supabase-types` | 0 | NONE | — | — | pass (no tests) |

`apps/*` for completeness (all already wired; **not** in D-09's guard scope — see § Open Questions Q2):

| Workspace | Test files | `test:unit` |
|---|---:|---|
| `@openvaa/docs` | 0 | `vitest run --passWithNoTests` |
| `@openvaa/frontend` | 54 | `vitest run` |
| `@openvaa/supabase` | 1 | `vitest run` |

[VERIFIED: measured via `find` + `node -e` over each `package.json`, this session]

### Table 2 — Per-package measurement of the five unwired packages

Command: `yarn build` (14/14 cached, FULL TURBO) then, per package, `cd packages/<p> && npx vitest run`.

| Package | Test Files | Tests | Result | Notes from run output |
|---|---:|---:|---|---|
| `core` | 3 passed (3) | 8 passed (8) | **PASS** | 334 ms |
| `matching` | 5 passed (5) | 43 passed (43) | **PASS** | 358 ms |
| `llm` | 2 passed (2) | 39 passed (39) | **PASS** | 409 ms |
| `question-info` | 2 passed (2) | 20 passed (20) | **PASS** | 402 ms; benign stderr `[PromptRegistry] Package 'question-info' already registered, skipping.` |
| `argument-condensation` | 6 passed (6) | 30 passed (30) | **PASS** | 480 ms; benign stdout `Found 1 pros!` / warn `Only 1 comments for question …` |
| **total** | **18** | **140** | **0 failures** | |

Setup files for `question-info` and `argument-condensation` read prompts from the **local filesystem** (`packages/question-info/tests/setup.ts:10-14` → `path.join(__dirname, '../src/prompts')`; `packages/argument-condensation/tests/setup.ts:10-14` → `'../src/core/condensation/prompts'`), with `noOpController`. **No network, no API key.** [VERIFIED: `packages/question-info/tests/setup.ts:1-14`, `packages/argument-condensation/tests/setup.ts:1-14`, read this session]

### Table 3 — Teardown prefix inventory

28 `*.teardown.ts` files under `tests/`. 27 declare `const PREFIX = '<literal>';` on one line. **1 does not** — `tests/tests/setup/candidate/candidate-journey.teardown.ts`, which performs no prefix-scoped delete (it only calls `client.unregisterCandidate(...)` at `:19`) and therefore legitimately has no prefix.

Verbatim declarations (`grep -nE "^const PREFIX = '"`):

```
tests/tests/setup/candidate/bank-auth-journey.teardown.ts:31:const PREFIX = 'e2e-bankauth-notloc-';
tests/tests/setup/perm/perm-1e1cg1co.teardown.ts:13:const PREFIX = 'e2e-perm-1e1cg1co-';
tests/tests/setup/perm/perm-2e-asymmetric.teardown.ts:11:const PREFIX = 'e2e-perm-2e-asymmetric-';
tests/tests/setup/perm/perm-2e-shared.teardown.ts:11:const PREFIX = 'e2e-perm-2e-shared-';
tests/tests/setup/perm/perm-access-disable.teardown.ts:11:const PREFIX = 'e2e-perm-access-disable-';
tests/tests/setup/perm/perm-analytics-tracking.teardown.ts:13:const PREFIX = 'e2e-perm-analytics-';
tests/tests/setup/perm/perm-answers-locked.teardown.ts:14:const PREFIX = 'e2e-perm-answers-locked-';
tests/tests/setup/perm/perm-disable-allow-open.teardown.ts:14:const PREFIX = 'e2e-perm-no-allowopen-';
tests/tests/setup/perm/perm-disable-election-1co.teardown.ts:11:const PREFIX = 'e2e-perm-disable-elec-1co-';
tests/tests/setup/perm/perm-disable-election-2co.teardown.ts:11:const PREFIX = 'e2e-perm-disable-elec-2co-';
tests/tests/setup/perm/perm-disjoint-1co.teardown.ts:11:const PREFIX = 'e2e-perm-disjoint-1co-';
tests/tests/setup/perm/perm-header-show-help.teardown.ts:11:const PREFIX = 'e2e-perm-header-help-';
tests/tests/setup/perm/perm-hide-all-nominations.teardown.ts:11:const PREFIX = 'e2e-perm-hide-all-noms-';
tests/tests/setup/perm/perm-hide-category-tags.teardown.ts:11:const PREFIX = 'e2e-perm-hide-cattags-';
tests/tests/setup/perm/perm-hide-election-tags.teardown.ts:11:const PREFIX = 'e2e-perm-hide-eltags-';
tests/tests/setup/perm/perm-hide-hero.teardown.ts:14:const PREFIX = 'e2e-perm-hide-hero-';
tests/tests/setup/perm/perm-hide-if-missing-answers.teardown.ts:11:const PREFIX = 'e2e-perm-hide-missing-';
tests/tests/setup/perm/perm-interactive-info.teardown.ts:13:const PREFIX = 'e2e-perm-iinfo-';
tests/tests/setup/perm/perm-localisation-positive.teardown.ts:13:const PREFIX = 'e2e-perm-l10n-pos-';
tests/tests/setup/perm/perm-missing-nominations.teardown.ts:11:const PREFIX = 'e2e-perm-missnoms-';
tests/tests/setup/perm/perm-not-located-2e2cg.teardown.ts:11:const PREFIX = 'e2e-perm-notloc-';
tests/tests/setup/perm/perm-org-matching.teardown.ts:13:const PREFIX = 'e2e-perm-orgmatch-';
tests/tests/setup/perm/perm-per-app-notifications.teardown.ts:11:const PREFIX = 'e2e-perm-notif-';
tests/tests/setup/perm/perm-question-video.teardown.ts:14:const PREFIX = 'e2e-perm-qvid-';
tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts:15:const PREFIX = 'e2e-perm-feedback-survey-';
tests/tests/setup/perm/perm-startfromcg.teardown.ts:11:const PREFIX = 'e2e-perm-startfromcg-';
tests/tests/setup/shared/base.teardown.ts:36:const PREFIX = 'test-e2e-base-';
```

Ordered-pair containment scan over all 27: **0 violations** — D-02 reproduced. Cross-file textual occurrence scan: **1 of 27** prefixes appears in more than one teardown file (not 22 — see D-04 annotation). [VERIFIED: `node -e` scan over the 28 files, this session]

---

## The Central Finding: ASSERT-10 Already Ships

### What exists

`tests/playwright.config.ts` is **1584 lines**. Its module body carries **three** config-load guards, not two:

| Guard | Docblock | Implementation | Provenance |
|---|---|---|---|
| ORPHAN-PROBE | `:18-34` | `:35-49` | Phase 136 plan 03, finding F4 |
| SOFT-ASSERTION-BUDGET | `:51-62` (table), `:64-89` (docblock) | `:90-135` | Phase 140 plan 02, finding F10 |
| **TEARDOWN-PREFIX-UNIQUENESS** | `:137-178` | `:179-240` | **Phase 140 review, finding CR-01** |

Verbatim from the third guard's opening docblock (`tests/playwright.config.ts:137-140`):

```
/**
 * TEARDOWN-PREFIX-UNIQUENESS GUARD (see phase 140 review, finding CR-01).
 *
 * `runTeardownAsserted` (`tests/tests/setup/shared/assertTeardown.ts`) turned the
```

Its four operative parts, quoted verbatim:

- **Precondition** (`:184-190`) — mirrors ORPHAN-PROBE's `fs.existsSync`:
  ```ts
  if (!fs.existsSync(teardownDir)) {
  ```
- **Enumeration scope** (`:179`, `:193-196`) — the whole `TESTS_DIR`, recursive, not `setup/`:
  ```ts
  const teardownDir = TESTS_DIR;
  ```
  ```ts
  for (const rel of fs
    .readdirSync(teardownDir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.teardown.ts'))) {
  ```
- **Extraction regex** (`:199`):
  ```ts
  const match = /^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m.exec(source);
  ```
- **Completeness check** (`:202`, `:206`) — the WR-03 fix D-04 does not contemplate:
  ```ts
  } else if (source.includes('runTeardownAsserted(')) {
      unparsedTeardownPrefixFiles.push(rel);
  ```
  ```ts
  if (unparsedTeardownPrefixFiles.length > 0) {
  ```
- **Equality branch** (`:220`) and **containment branch** (`:230`):
  ```ts
      if (a.prefix === b.prefix) {
  ```
  ```ts
      if (a.prefix.startsWith(b.prefix) || b.prefix.startsWith(a.prefix)) {
  ```

[VERIFIED: `tests/playwright.config.ts:137-240`, read this session]

### Git provenance

```
abe1fabb0 2026-08-15 20:04:35 +0300 fix(140): CR-01 give bank-auth-journey its own teardown-prefix namespace
bdb759575 2026-08-15 20:44:55 +0300 fix(140): IN-01 add fs.existsSync precondition to the teardown-prefix-uniqueness guard
c15e444e8 2026-08-16 14:13:06 +0300 fix(140): IN-02 scan the whole testDir for teardown prefixes, not just setup/
```

`git log -S'TEARDOWN-PREFIX-UNIQUENESS'` returns exactly `abe1fabb0`. Phase 140's own `140-REVIEW-FIX.iter2.md:43` describes it in its own words: *"Also added a **prefix-uniqueness config guard** (mirrors the existing ORPHAN-PROBE / SOFT-ASSERTION-BUDGET guards) that scans every `*.teardown.ts` file's `const PREFIX = '...'` and throws at config-load time on any future duplicate or substring overlap."* [VERIFIED: `git log`, `.planning/phases/140-.../140-REVIEW-FIX.iter2.md:43`]

### The documentation defect

Two committed statements are false at HEAD and both feed this phase:

1. `.planning/ROADMAP.md:387` — *"Follow-up **F-140-01** (non-blocking): no config-load prefix-uniqueness guard exists, so prefix disjointness rests on convention rather than enforcement."*
2. `.planning/REQUIREMENTS.md:63` — *"…but the guard against a *future* duplicate was never built."*

Both trace to `140-VERIFICATION.md`'s `missing:` list (frontmatter, second item), which was written at the **initial** verification on 2026-08-15 and enumerated two remedies. `abe1fabb0` (20:04 that evening) delivered **both**, but the `missing:` list was never amended when the file was re-verified 6/6 on 2026-08-18 — the addendum resolved must-have 6 by citing the dedicated-namespace half and left the guard half recorded as outstanding at `140-VERIFICATION.md:238`. CONTEXT.md then inherited it. [VERIFIED: `.planning/ROADMAP.md:387`, `.planning/REQUIREMENTS.md:63`, `.planning/phases/140-.../140-VERIFICATION.md` frontmatter `missing:` + `:238`, read this session]

**This is not a bookkeeping nicety.** The standing acceptance rule (`REQUIREMENTS.md:9`) says *"prove the guard fails before claiming it guards."* Phase 140 built the guard but never ran the two-run negative control on it — that is the genuine, and only, unmet part of ASSERT-10. The Injection Ledger below is the missing evidence; the planner should have plan 01 (or a dedicated plan) reproduce and commit it rather than re-deriving what to build.

---

## Injection Ledger — proofs run this session

All runs at HEAD `69d0a2d3c`, working tree clean before and after (`git status --porcelain` empty at both ends of every sequence). Command for A–F: `npx playwright test -c ./tests/playwright.config.ts --list`.

| # | Injection | Exit | First line of output |
|---|---|---:|---|
| **A** | none (clean baseline) | **0** | `Total: 143 tests in 94 files` |
| **B** | scratch teardown `const PREFIX = 'e2e-bankauth-notloc-';` (the ROADMAP SC-5 injection, verbatim) | **1** | `Error: Teardown prefix collision: 'setup/candidate/bank-auth-journey.teardown.ts' and 'setup/perm/zz-scratch-injection.teardown.ts' both declare PREFIX = 'e2e-bankauth-notloc-'. …` — thrown at `tests/playwright.config.ts:221:13` |
| **C** | scratch teardown `const PREFIX = 'e2e-perm-';` (containment, not equality) | **1** | `Error: Teardown prefix overlap: 'setup/perm/zz-scratch.teardown.ts' declares PREFIX = 'e2e-perm-', which is a string-prefix of 'setup/perm/perm-1e1cg1co.teardown.ts's PREFIX = 'e2e-perm-1e1cg1co-'. …` |
| **D** | scratch teardown calling `runTeardownAsserted(myPrefix)` with `let myPrefix = …` (non-conforming declaration) | **1** | `Error: Teardown prefix guard could not parse a \`const PREFIX = '...'\` declaration in setup/perm/zz-scratch.teardown.ts, but the file calls runTeardownAsserted — …` |
| **E** | scratch teardown with **no** prefix and **no** `runTeardownAsserted` (the legitimate `candidate-journey` shape) | **0** | `Total: 143 tests in 94 files` — correctly **not** tripped |
| **F** | duplicate prefix in a teardown placed **outside** `setup/` (`tests/tests/zz-outside.teardown.ts`) | **1** | `Error: Teardown prefix collision: 'zz-outside.teardown.ts' and 'setup/perm/perm-not-located-2e2cg.teardown.ts' … PREFIX = 'e2e-perm-notloc-'` — confirms the IN-02 whole-`TESTS_DIR` scope claim |
| — | revert, re-run clean | **0** | `Total: 143 tests in 94 files` |

Two further runs, on the UNIT-* side (`yarn test:unit`):

| # | Injection | Exit | Observation |
|---|---|---:|---|
| **G** | failing `expect(1).toBe(2)` planted in **both** `packages/core/src/zz-plant.test.ts` and `packages/matching/tests/zz-plant.test.ts` | **0** | `Tasks: 21 successful, 21 total`. `grep -c zz-plant` over the full output → **0**. This is SC-1's blindness half, verbatim. |
| **H** | scratch `packages/zz-scratch/` — `package.json` with `"scripts": {}` plus `src/a.test.ts`, **no `yarn install`** | **0** | `npx turbo run test:unit --dry=json` EXIT=0, scratch workspace present in the task graph; `yarn test:unit` `Tasks: 21 successful, 21 total`. This is SC-4's "before" state, and confirms the negative control needs no lockfile surgery. |

[VERIFIED: all runs executed this session; outputs quoted verbatim from terminal]

**Implication for the planner:** ROADMAP criterion 5 is discharged by runs A/B/E (plus C/D/F as bonus depth). Criterion 1's "before" is discharged by run G. Criterion 4's "before" is discharged by run H. What is *not* yet in evidence is the "after" half of criteria 1 and 4, which requires the build.

---

## Wiring Surfaces

### Root `package.json` (verbatim, relevant entries)

```json
"test:unit": "turbo run test:unit",
"test:unit:watch": "echo '###################################\nNB! Running only tests in /packages\n###################################\n' && vitest",
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests",
```

`lint:check` is D-07's `&&`-composition precedent. [VERIFIED: root `package.json` `scripts`, read via `node -e` this session]

### `turbo.json` (verbatim, `test:unit` task)

```json
"test:unit": {
  "dependsOn": ["build"],
  "cache": false
}
```

[VERIFIED: `turbo.json`, read this session]

### CI (`.github/workflows/main.yaml`)

```
:69  - name: "Run Frontend and shared module tests"
:70    run: yarn test:unit
:197   run: yarn workspace @openvaa/dev-seed test:unit
```

These are the **only two** unit-test invocations in CI. No `yarn workspace X test` (bare) anywhere — D-10's rename is safe. [VERIFIED: `grep -n` over `.github/workflows/main.yaml`, this session]

### Current executed set

`npx turbo run test:unit --dry=json` at HEAD → **15** `test:unit` tasks, of which:

- **executed (7):** `@openvaa/app-shared`, `@openvaa/data`, `@openvaa/dev-seed`, `@openvaa/docs`, `@openvaa/filters`, `@openvaa/frontend`, `@openvaa/supabase`
- **`"command": "<NONEXISTENT>"` (8):** `@openvaa/argument-condensation`, `@openvaa/core`, `@openvaa/dev-tools`, `@openvaa/llm`, `@openvaa/matching`, `@openvaa/question-info`, `@openvaa/shared-config`, `@openvaa/supabase-types`

After wiring, the executed set should be **12** and the `<NONEXISTENT>` set **3** (`dev-tools`, `shared-config`, `supabase-types` — the three legitimately test-free packages). That delta is a clean, checkable acceptance signal for SC-2.

Useful `--dry=json` task fields: `taskId, task, package, hash, inputs, cache, command, cliArguments, outputs, directory, dependencies, dependents, resolvedTaskDefinition, framework, envMode, environmentVariables`. [VERIFIED: `npx turbo run test:unit --dry=json`, turbo 2.8.17, this session]

---

## Common Pitfalls

### Pitfall 1: `--dry=json` lists unwired workspaces too — presence is not execution

**What goes wrong:** SC-2 says *"Cross-checking `npx turbo run test:unit --dry=json` against the set of workspaces containing test files leaves no package unaccounted for."* The obvious implementation — "collect `tasks[].package` and diff against the test-file set" — **passes today, before any work is done**, because turbo emits a task entry for every workspace regardless of whether the script exists.

**Why it happens:** Turbo's dry-run task graph is the *potential* graph. A missing script surfaces as `"command": "<NONEXISTENT>"`, not as an absent entry.

**How to avoid:** Filter on `t.task === 'test:unit' && t.command !== '<NONEXISTENT>'`. Verify the cross-check by construction: run it at HEAD and confirm it reports the five unwired packages as unaccounted-for *before* the wiring lands. A cross-check that is green at HEAD is a fake guard of exactly the class this milestone exists to remove.

**Warning signs:** A cross-check script that passes on its first run against the unwired tree.

[VERIFIED: `--dry=json` output enumerated above, this session]

### Pitfall 2: A second, deprecated test-discovery path already covers all five packages

**What goes wrong:** `vitest.workspace.ts` at the repo root contains exactly:

```ts
export default ['packages/**/vitest.config.ts'];
```

Every one of the five unwired packages ships a `vitest.config.ts` **specifically so this file finds it** — their docblocks say so verbatim: *"This empty config file is necessary ror `/vitest.workspace.ts` to recognize this module as a test workspace."* (`packages/core/vitest.config.ts`, `packages/matching/vitest.config.ts`, `packages/llm/vitest.config.ts`). So `npx vitest list --filesOnly` at root discovers **112 test files across all 9 packages that have tests**, including all five unwired ones — 876 tests. This path is reachable today via `yarn test:unit:watch`, which is watch-mode and runs in no CI job.

This is *why* the hole is easy to miss: the tests look covered from the root, and are, by a command CI never calls.

**Second-order risk:** Vitest 3.2.4 prints on every root invocation:

> ` DEPRECATED  The workspace file is deprecated and will be removed in the next major. Please, use the `test.projects` field in the root config file instead.`

**How to avoid:** Do **not** be tempted to satisfy UNIT-01/02 by leaning on `vitest.workspace.ts` (e.g. changing the root `test:unit` to `vitest run`). It is deprecated, it bypasses turbo's `dependsOn: ["build"]`, and it would replace a per-workspace contract with a single glob — the opposite of what UNIT-04 guards. Wire per-package scripts as D-10/D-11 specify. If the planner wants a follow-up, "migrate `vitest.workspace.ts` to `test.projects`" is a legitimate Deferred item, not this phase's work.

**Warning signs:** Any plan that touches `vitest.workspace.ts` or the root `test:unit:watch` script.

[VERIFIED: `vitest.workspace.ts` (1 line, quoted above); `npx vitest list --filesOnly` output tallied per package: data 47, dev-seed 43, argument-condensation 6, matching 5, core 3, app-shared 3, question-info 2, llm 2, filters 1 = 112; `npx vitest --version` → `vitest/3.2.4`; deprecation line quoted verbatim from `npx vitest list`]

### Pitfall 3: `--passWithNoTests`, D-12, and SC-4's second direction

**What goes wrong:** SC-4 requires observing that *"removing the test file makes it pass."* If that direction is exercised on a package that already has a `test:unit` script of bare `vitest run` (per D-12), the package will fail for a **different** reason: measured this session, `vitest run` with zero test files exits **1** with `No test files found, exiting with code 1`; `vitest run --passWithNoTests` exits **0**.

**How to avoid:** Exercise SC-4's negative control with a **scratch package that has no `test:unit` script at all** (run H's shape). The two directions then are: (a) scratch package with test file, no script → guard fails naming it; (b) **either** add the script → guard passes and the test runs, **or** delete the test file → guard passes and turbo emits `<NONEXISTENT>` for it harmlessly. Do not delete a test file from a package that has bare `vitest run`.

**Warning signs:** A negative-control plan that mutates one of the five real packages instead of a scratch one.

[VERIFIED: `vitest@3 run` in an empty dir → EXIT=1, `No test files found, exiting with code 1`; with `--passWithNoTests` → EXIT=0. Measured this session.]

### Pitfall 4: A new root `scripts/*.mjs` lands outside both lint and lint-staged

**What goes wrong:** D-08 puts the UNIT-04 guard at a root path like `scripts/assert-unit-test-coverage.mjs`. Two in-tree facts make that file unusually unpoliced:

1. There is **no root `scripts/` directory today** and **no root `lint` script** (`node -e "require('./package.json').scripts.lint"` → `NONE`). Root `lint:check` is `turbo run lint && eslint … tests && yarn typecheck:tests` — `turbo run lint` fans out to *workspace* `lint` scripts, and the explicit `eslint` invocation targets `tests` only. A root-level `.mjs` is therefore linted by nothing.
2. `.lintstagedrc.json`'s first glob is `"*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}"` — note **`mjssvelte`**, an unseparated concatenation of what were presumably meant to be `mjs` and `svelte`. **`.mjs` files match no lint-staged glob**, so the guard script would skip prettier and eslint on commit too.

**How to avoid:** Either name the guard `.cjs`/`.js` (both *are* covered by the lint-staged glob and by `prettier --write .`), or accept `.mjs` and have the plan explicitly state that the file is formatted by `yarn format` (`prettier --write .` covers it; `.prettierignore` does not exclude root `scripts/`) and hand-reviewed rather than linted. The `mjssvelte` typo itself is a **pre-existing, out-of-scope defect** — flag it as a follow-up; do not fix it inside this phase.

**Warning signs:** A plan that assumes `yarn lint:check` will validate the new guard script. It will not.

[VERIFIED: `.lintstagedrc.json` quoted verbatim this session; root `package.json` has no `lint` key; `.prettierignore` read this session — no `scripts/` entry]

### Pitfall 5: The prefix guard's regex is wider than D-04 — do not narrow it

**What goes wrong:** D-04 specifies `/^const PREFIX = '([^']+)';/m`. The shipped regex (`:199`) is `/^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m`. Applying D-04 literally would drop support for `export const`, `: string`, leading whitespace and double quotes — each a shape a future author could plausibly write, and each of which would then fall through to the `unparsedTeardownPrefixFiles` completeness throw (noisy) or, if the file also lost its `runTeardownAsserted(` call, be **silently skipped** (the F4 failure mode).

**How to avoid:** Treat D-04 as satisfied-by-inspection against the shipped code. Record in the phase artifacts that the shipped regex supersedes it and why.

### Pitfall 6: The 28th teardown file is a feature, not a gap

**What goes wrong:** A naive prefix guard that requires every `*.teardown.ts` to declare a PREFIX throws immediately on `tests/tests/setup/candidate/candidate-journey.teardown.ts`, which has no delete to scope. The shipped guard handles this exactly right — it excludes files with no declaration **and** no `runTeardownAsserted(` call, and throws for files that have the call but no parseable declaration. Run E confirms the exclusion; run D confirms the completeness catch.

**How to avoid:** If any plan re-touches this guard, preserve both halves. `assertTeardown.ts:10-12` states the same 27-of-28 accounting: *"Every `*.teardown.ts` project that performs a prefix delete routes through this function (27 of 28; `candidate-journey.teardown.ts` performs no delete — it only unregisters an auth user, so it has nothing to route through here)."*

[VERIFIED: `tests/tests/setup/shared/assertTeardown.ts:10-12`, `tests/tests/setup/candidate/candidate-journey.teardown.ts:1-20`, read this session]

### Pitfall 7: `turbo run test:unit` runs `build` first — the guard's bootstrapping constraint is real

**What goes wrong:** `turbo.json` declares `"test:unit": { "dependsOn": ["build"], "cache": false }`. Because D-07 places the guard **before** `turbo run test:unit` in the `&&` chain, the guard executes on a tree where no `dist/` need exist. A guard written in TypeScript requiring `tsx` or a workspace build would deadlock against the pipeline it gates.

**How to avoid:** Exactly D-08 — plain `.mjs`/`.cjs`, `fs` + `JSON.parse` only, zero imports from workspaces. Confirm by running the guard on a tree with `rm -rf packages/*/dist` (or at least assert it imports nothing from `@openvaa/*`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Teardown-prefix collision detection | A new config-load guard per D-03/D-04/D-05 | The guard already at `tests/playwright.config.ts:179-240` | It exists, ships equality **and** containment, has a completeness check D-04 does not contemplate, an `fs.existsSync` precondition, whole-`TESTS_DIR` scope, and error messages in the established register. Four branches proven by injection this session. Building a second one would be a duplicated invariant — the exact drift class this milestone removes. |
| Workspace enumeration in the UNIT-04 guard | `yarn workspaces list --json` shelling out | `fs.readdirSync('packages')` + `JSON.parse` of each `package.json` | Shelling out to yarn from inside a script that gates `yarn test:unit` re-introduces the bootstrapping coupling D-08 exists to avoid, and is ~100× slower. Run H proves a workspace need not even be installed for the scenario to be exercised. |
| Test-file discovery in the UNIT-04 guard | A custom recursive walker with its own ignore rules | `fs.readdirSync(dir, { recursive: true })` filtered on suffix, with an explicit `node_modules` exclusion | Node 22 (`main.yaml` pins 22.22.1) supports `recursive: true` natively; the shipped prefix guard uses exactly this idiom at `:193-196`, so the two guards read as one family. |
| "Which packages does CI actually run?" | Parsing turbo's human-readable stdout | `--dry=json` filtered on `command !== '<NONEXISTENT>'` | Stdout format is unstable across turbo versions; the JSON contract is explicit. See Pitfall 1 for the filter that makes it discriminate. |

**Key insight:** Roughly half of this phase's nominal scope is already in the tree. The expensive mistake available here is *building* rather than *checking* — and the second-most-expensive is building a cross-check that is green before the work lands.

---

## Architecture Patterns

### Pattern 1: The config-load guard family (three members, one register)

**What:** A top-level `throw new Error(...)` in a config module body, executed on every invocation including `--list`.
**When to use:** ASSERT-10 — already applied. Do **not** apply to UNIT-04: package unit tests are Vitest, and `tests/playwright.config.ts` is never loaded on the `yarn test:unit` path. A playwright-config guard would not fire for UNIT-04 at all.

**The register, from the shipped code** — each member states (a) what drifted, (b) the concrete historical incident, (c) why a comment would not suffice, (d) what to do about it. Verbatim from `tests/playwright.config.ts:30-33`:

```
 * A comment asking future authors to keep the list in sync would be the same
 * kind of non-guard this phase exists to remove, so the invariant is CHECKED.
 * Throwing here fails every `playwright test` / `--list` invocation immediately
 * and by name, which is the earliest point at which the mistake is visible.
```

And the `--list` rationale, verbatim from `:86-88`:

```
 * Throwing here fails every `playwright test` / `--list` invocation immediately and by
 * name. `--list` matters specifically: it does not run `globalSetup`, so a check living
 * in a test or in setup would never see it. Config-load code does.
```

The UNIT-04 guard should adopt this **prose register** while living in a different host — its analogous sentence is "a comment asking future authors to add a `test:unit` script would be the same kind of non-guard."

### Pattern 2: Root-script `&&` composition as the gate host

**What:** `"test:unit": "node scripts/<guard>.mjs && turbo run test:unit"`.
**When to use:** UNIT-04 (D-07).
**Precedent, verbatim:** `"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests"`.
**Why it holds:** `main.yaml:70` is `run: yarn test:unit`, so CI passes through the wrapper by construction; there is no second CI entry point that bypasses it except `main.yaml:197`'s workspace-scoped `dev-seed` run, which is a single named package and not a coverage-hole vector.

### Anti-Patterns to Avoid

- **Duplicating the prefix guard.** See Don't Hand-Roll row 1.
- **Narrowing the shipped extraction regex to match D-04's literal text.** See Pitfall 5.
- **Satisfying UNIT-01/02 via `vitest.workspace.ts`.** See Pitfall 2.
- **A cross-check that is green at HEAD.** See Pitfall 1.
- **Adding `--passWithNoTests` to the five new scripts.** D-12 forbids it, and the measurement (0 → 1 exit-code delta) is exactly the failure mode Phase 140 spent six plans removing.
- **Widening `SOFT_ASSERTION_BUDGETS` while editing nearby.** Explicit CONTEXT.md Deferred item; `tests/playwright.config.ts:52-55` records the sibling-drift follow-up.

---

## Code Examples

### Discriminating executed vs. unwired `test:unit` tasks (SC-2 cross-check core)

```js
// Source: measured contract of `npx turbo run test:unit --dry=json`, turbo 2.8.17, this session
const dry = JSON.parse(execFileSync('npx', ['turbo', 'run', 'test:unit', '--dry=json'], { encoding: 'utf8' }));
const tasks = dry.tasks.filter((t) => t.task === 'test:unit');
const executed = tasks.filter((t) => t.command !== '<NONEXISTENT>').map((t) => t.package);
const unwired = tasks.filter((t) => t.command === '<NONEXISTENT>').map((t) => t.package);
// At HEAD: executed.length === 7, unwired.length === 8
// After wiring:            12                        3  (dev-tools, shared-config, supabase-types)
```

### The shipped prefix-guard enumeration (the idiom UNIT-04's guard should echo)

```ts
// Source: tests/playwright.config.ts:191-205 (verbatim)
const teardownPrefixDeclarations: Array<{ file: string; prefix: string }> = [];
const unparsedTeardownPrefixFiles: Array<string> = [];
for (const rel of fs
  .readdirSync(teardownDir, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.teardown.ts'))) {
  const abs = path.join(teardownDir, rel);
  const source = fs.readFileSync(abs, 'utf8');
  const match = /^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m.exec(source);
  if (match) {
    teardownPrefixDeclarations.push({ file: rel, prefix: match[1] });
  } else if (source.includes('runTeardownAsserted(')) {
    unparsedTeardownPrefixFiles.push(rel);
  }
}
```

### The wiring diffs (five one-line `package.json` edits)

```jsonc
// packages/core/package.json      — ADD (D-11)
"test:unit": "vitest run"
// packages/matching/package.json  — ADD (D-11)
"test:unit": "vitest run"

// packages/llm/package.json                    — RENAME "test" → "test:unit" (D-10); keep "test:watch": "vitest"
// packages/question-info/package.json          — RENAME "test" → "test:unit" (D-10); keep "test:watch": "vitest"
// packages/argument-condensation/package.json  — RENAME "test" → "test:unit" (D-10); keep "test:watch": "vitest watch"
```

All five current values are exactly `vitest run`, so the renamed scripts already satisfy D-12's "bare `vitest run`, no `--passWithNoTests`". [VERIFIED: `node -e` read of each `package.json`, this session]

---

## Runtime State Inventory

This phase edits `package.json` scripts and adds a root script; it is not a rename/refactor. Checked anyway, per protocol:

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | **None** — no database, cache, or datastore key encodes a `test:unit` script name or a teardown prefix beyond the `external_id` values the E2E suite creates and deletes within a run. Verified: the 27 prefixes are consumed only by `runTeardownAsserted` → `bulk_delete`. | none |
| Live service config | **None** — no external service holds a copy of the script names. GitHub Actions reads `main.yaml` from the repo. | none |
| OS-registered state | **None** — no scheduled tasks, pm2 processes, or launchd units reference `test:unit`. | none |
| Secrets/env vars | **None** — the five packages' tests read no `process.env` (D-01, reproduced: all 140 pass with no `.env` beyond what `dotenv` loads for Playwright, which is not in this path). | none |
| Build artifacts | **Turbo cache** — `test:unit` is `"cache": false`, so no stale test result can be replayed. `build` is cached but keys on `package.json` (its `inputs` include `"package.json"`), so the five script additions invalidate those packages' build cache once — a one-off rebuild, not a correctness issue. | none (self-correcting) |

[VERIFIED: `turbo.json` `inputs` for `build` includes `"package.json"`; `test:unit` `"cache": false`]

---

## Project Constraints (from CLAUDE.md)

Directives this phase's plans must honour:

- **E2E hard rule (cardinal failure).** No task may proceed or complete while any E2E test is failing. Prefer running the **whole suite** (`yarn test:e2e`) for interim verification. A "did not run" test counts as a failure. **Applies here:** every ASSERT-10 injection touches `tests/playwright.config.ts`'s load path, so each injection/revert cycle must end with a clean `--list` (143 tests / 94 files, as observed) and the phase gate needs a full-suite run.
- **E2E preflight.** Global setup asserts the served app came from *this* checkout via `/@fs`; no flag skips it. One fresh dev server on `:5173`, `strictPort`. (Also carried in memory: `project_e2e_execution_devserver_prereq`.)
- **Never commit sensitive data.**
- **Use TypeScript strictly — avoid `any`.** Note the UNIT-04 guard is a plain `.mjs`/`.cjs` by D-08 and so is outside TS entirely; state that tradeoff explicitly in the plan rather than leaving it implicit.
- **Always check work against `.agents/code-review-checklist.md`.** (Its sections are Supabase Backend / Supabase Adapter / Edge Functions — none apply to this phase's file set; note that in the plan so the checklist item is discharged rather than skipped.)
- **Turborepo owns build orchestration**; `.turbo/` is not committed.
- **Harmonised script naming:** `db:*` = database only, `dev:*` = full stack. The `test:unit` naming convention this phase extends is the same family discipline — one canonical name per workspace (D-10's rationale).

Standing acceptance rule from `.planning/REQUIREMENTS.md:9-12` (project-level, same authority): **prove the guard fails before claiming it guards** — every new or repaired check run as a negative control **twice**, once demonstrating blindness, once demonstrating the catch.

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` → treated as enabled.

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 3.2.4 (`catalog: vitest: ^3.2.4`, `.yarnrc.yml:8`); Playwright `^1.58.2` for E2E |
| Config file | Per-workspace `packages/*/vitest.config.ts` (all 5 targets present); root `vitest.workspace.ts` (deprecated); `tests/playwright.config.ts` |
| Quick run command | `cd packages/<p> && npx vitest run` (~0.4 s each) |
| Full suite command | `yarn test:unit` (~29 s cold, ~15 s warm, 21 turbo tasks) + `yarn test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| UNIT-01 | `core` + `matching` execute under `yarn test:unit`; planted failure ⇒ non-zero exit | integration (pipeline) | `yarn test:unit` with planted `zz-plant.test.ts` in each; expect EXIT≠0 and both names in output | ✅ mechanism exists; "before" already captured (run G) |
| UNIT-02 | All 3 Experimental packages appear as executed tasks; no workspace unaccounted for | integration (pipeline) | `npx turbo run test:unit --dry=json` filtered on `command !== '<NONEXISTENT>'`, diffed against the test-file set | ❌ Wave 0 — cross-check script does not exist |
| UNIT-03 | Measurement record predates wiring commits | git-order property | `git log --format='%H %ad' -- <record> <package.json>` ordering check | ❌ Wave 0 — record file does not exist |
| UNIT-04 | Scratch package with tests and no script fails by name; both directions | integration (guard) | `yarn test:unit` with/without `packages/zz-scratch/`; expect fail-by-name then pass | ❌ Wave 0 — guard script does not exist. "Before" captured (run H) |
| ASSERT-10 | Duplicate/containing prefix caught by name at config load; clean set passes | integration (guard) | `npx playwright test -c ./tests/playwright.config.ts --list` under each injection | ✅ **guard exists**; ✅ **all four branches proven this session** (runs A–F). Only the committed record is owed |

### Sampling Rate

- **Per task commit:** `yarn test:unit` (the command under change) + `npx playwright test -c ./tests/playwright.config.ts --list` when `tests/` is touched.
- **Per wave merge:** `yarn test:unit` full + `yarn lint:check`.
- **Phase gate:** `yarn build` → `yarn test:unit` → full `yarn test:e2e` green (cardinal rule), preflight-confirmed, on one fresh dev server.

### Wave 0 Gaps

- [ ] `scripts/assert-unit-test-coverage.mjs` (or `.cjs`, per Pitfall 4) — the UNIT-04 guard
- [ ] A cross-check for UNIT-02 — either folded into the same guard script or a phase-artifact command whose output is committed. **Must be demonstrated failing at HEAD** (Pitfall 1)
- [ ] A committed per-package measurement record for UNIT-03 (plan 01 output), predating the wiring commits
- [ ] A committed injection ledger for ASSERT-10 — this document's § Injection Ledger is the template; it must be *re-run and recorded by the phase*, not cited from research
- [ ] No framework install needed: vitest, turbo, playwright all present

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json` (the key is absent) → included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | This phase touches no auth path. The one teardown file that unregisters an auth user (`candidate-journey.teardown.ts`) is read-only to this phase. |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | **yes (narrow)** | Both guards read files off disk and interpolate filenames/prefixes into error strings. Inputs are repo-local developer-authored files, not untrusted input; no sanitisation library warranted. Constrain the UNIT-04 guard to `packages/*/package.json` and reject path traversal implicitly by never accepting a path argument. |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Guard script reads and `JSON.parse`s arbitrary `package.json` under `packages/` | Tampering | Already the trust boundary of the repo itself; wrap `JSON.parse` in a try/catch that **throws naming the file** rather than silently skipping it — a silent skip is the F4 enumeration-drift failure mode. |
| Supply-chain: adding a new dependency for the guard | Tampering | **Add none.** D-08's no-build constraint plus Node 22 built-ins (`fs`, `path`) cover the whole requirement. This phase should install zero packages (see § Package Legitimacy Audit). |
| Guard bypass via a second entry point | Elevation / Repudiation | `main.yaml` has exactly two unit-test invocations (`:70`, `:197`); the wrapper covers `:70`. Note in the plan that `:197` (`yarn workspace @openvaa/dev-seed test:unit`) intentionally bypasses the wrapper and is not a coverage vector. |

---

## Package Legitimacy Audit

**No external packages are installed by this phase.** The UNIT-04 guard is constrained by D-08 to Node built-ins with no build step; the ASSERT-10 guard already exists and imports only `fs`/`path`, already present in `tests/playwright.config.ts:3-4`. All tooling (vitest 3.2.4, turbo 2.8.17, playwright 1.58.2) is already installed and pinned via the `.yarnrc.yml` catalog.

| Package | Registry | Verdict | Disposition |
|---|---|---|---|
| *(none)* | — | — | Phase installs nothing |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

If the planner deviates from D-08 and proposes any dependency, the legitimacy gate must be run before that plan is written.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Guard script, vitest, turbo | ✓ | v24.14.1 local (CI pins 22.22.1 — `main.yaml`) | — |
| Yarn 4 | Workspace scripts | ✓ | 4.13 per `main.yaml` | — |
| Turborepo | `test:unit` fan-out | ✓ | 2.8.17 | — |
| Vitest | Package unit tests | ✓ | 3.2.4 | — |
| Playwright | ASSERT-10 config-load proof (`--list` only) | ✓ | 1.58.2 (`@playwright/test` catalog) | — |
| Supabase (local) | Full E2E phase gate only | not started this session | — | Not needed for `--list`; needed for `yarn test:e2e` |
| Network / LLM API key | **NOT required** — the three Experimental packages' tests are fully mocked | n/a | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. Note the full-suite E2E phase gate needs local Supabase + one fresh dev server on `:5173` (memory: `project_e2e_execution_devserver_prereq`), which was not exercised in this research session — only `--list`, which loads the config without a server.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `vitest.workspace.ts` at repo root | `test.projects` in the root vitest config | Vitest 3.x deprecation; removal announced for the next major | The root file still works and still discovers all 9 test-bearing packages, but prints a `DEPRECATED` banner on every invocation. **Out of scope** — record as a follow-up. |
| Prefix disjointness by convention + docblock prose | Config-load `TEARDOWN-PREFIX-UNIQUENESS GUARD` | Phase 140, `abe1fabb0` (2026-08-15) | ASSERT-10's build is already done; only the proof and the docs are owed. |
| Inline `expect(...)` at 27 teardown call sites | `runTeardownAsserted` shared helper | Phase 140 | The equality accounting ASSERT-10 protects. Do not modify it. |

**Deprecated/outdated in the phase's own inputs:**
- `.planning/ROADMAP.md:387` — "no config-load prefix-uniqueness guard exists": **false at HEAD.**
- `.planning/REQUIREMENTS.md:63` — "the guard against a *future* duplicate was never built": **false at HEAD.**
- `.planning/phases/140-.../140-VERIFICATION.md` frontmatter `missing:` item 2 and `:238` — stale since `abe1fabb0`, never amended at the 2026-08-18 re-verification.
- CONTEXT.md D-04's "22 of 27 prefixes appear textually in more than one teardown file": measures **1 of 27** cross-file.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | `vitest.workspace.ts` removal is scheduled for Vitest 4 (the "next major"), i.e. not imminent within this milestone. Based on the deprecation banner's own wording, not on release notes I fetched. | Pitfall 2 / State of the Art | Low — the phase does not depend on it either way; only affects the priority of the deferred migration. |
| A2 | `main.yaml:70` and `:197` are the only CI paths that run unit tests. Derived from a `grep` over `.github/workflows/main.yaml`; the other five workflow files (`claude*.yml`, `docs.yml`, `release.yml`) were **not** read line by line. | Wiring Surfaces / Security | Medium — if `release.yml` runs `yarn test:unit`, the wrapper still covers it (same script), so the risk is only to the completeness of the "two invocations" statement, not to D-07's correctness. **Planner should have plan 01 grep all six workflow files.** |
| A3 | The `mjssvelte` glob in `.lintstagedrc.json` is a typo for `mjs,svelte` rather than deliberate. Inferred from the surrounding pattern; no commit archaeology done. | Pitfall 4 | Low — the operative fact (`.mjs` matches no glob) is verified regardless of intent. |
| A4 | Turbo emits `"command": "<NONEXISTENT>"` (rather than omitting the task) as a stable contract across turbo 2.x. Observed at 2.8.17 only. | Pitfall 1 | Medium — if a future turbo omits the entry instead, a cross-check filtering on the sentinel would silently pass. **Mitigate by asserting the expected counts (12 executed / 3 unwired) rather than only filtering.** |
| A5 | No `.env` value influences the five packages' unit tests. Based on "no `process.env` reads" (D-01, which I did not independently re-grep) plus all 140 passing in this session's environment. | Table 2 | Low — plan 01's own measurement re-establishes it. |

---

## Open Questions

1. **Q1 — How should the planner treat D-03/D-04/D-05 now that the guard exists?**
   - What we know: the guard is present, superset-capable, and proven by injection (runs A–F). D-04's regex would be a downgrade; D-04's "22 of 27" figure does not reproduce.
   - What's unclear: whether the operator wants ASSERT-10 re-opened for a *design* change (e.g. D-06's registry, currently deferred) or simply evidenced and closed.
   - **Recommendation:** Plan ASSERT-10 as evidence-and-reconciliation, not construction. One plan with three tasks: (a) re-run and commit the four-branch injection ledger; (b) correct `ROADMAP.md:387` and `REQUIREMENTS.md:63`, and append a note to `140-VERIFICATION.md` retiring its stale `missing:` item; (c) record in the phase artifacts that D-04's proposed regex is superseded by the shipped `:199` regex and why. Do **not** touch `tests/playwright.config.ts` source. Flag Q1 to the operator before planning if the discuss-phase decisions are considered binding-as-written — this is a decision reversal driven by measurement, and CONTEXT.md's own D-01/D-02 precedent shows the operator accepts scope-shrinking measurements.

2. **Q2 — Should the UNIT-04 guard cover `apps/*` as well as `packages/*`?**
   - What we know: D-09 scopes it to `packages/*`. All three `apps/*` workspaces already declare `test:unit`, so there is no hole there today. Covering both is a one-line change to the guard's root list.
   - What's unclear: whether the operator considers `apps/*` in scope for the invariant. The requirement text (UNIT-04) says `packages/*` explicitly.
   - **Recommendation:** Implement `packages/*` per D-09 (it is the literal requirement), but structure the guard so the scanned roots are a single array constant, and record `apps/*` extension as a one-line follow-up. Do not silently widen — a guard that fires on a workspace the requirement didn't name is a scope surprise at execution time.

3. **Q3 — Where does the UNIT-02 cross-check live, and how is it kept honest?**
   - What we know: `--dry=json` filtering is the mechanism; Pitfall 1 is the trap.
   - What's unclear: whether the cross-check is a one-off phase artifact (a committed command + output) or a standing check. The requirement text says "no package is silently absent from CI", which the UNIT-04 guard largely already enforces from the other direction.
   - **Recommendation:** Fold it into the UNIT-04 guard as a *second* assertion — "every `packages/*` workspace declaring `test:unit` must appear as an executed task in the turbo graph" is the mirror of "every workspace with tests must declare `test:unit`". If the planner prefers to keep the guard dependency-free (it would need to shell out to turbo, breaking D-08's bootstrapping property), keep the cross-check as a committed one-off artifact instead and say so explicitly. **Do not** let it become a standing check that shells `npx turbo` from inside the pre-turbo gate.

4. **Q4 — Does any other workflow file invoke `yarn test:unit`?** See assumption A2. Cheap to resolve: `grep -rn "test:unit" .github/workflows/`. Plan 01 should do it.

---

## Sources

### Primary (HIGH confidence) — all measured this session at HEAD `69d0a2d3c`

- `tests/playwright.config.ts` (1584 lines) — three config-load guards at `:18-49`, `:51-135`, `:137-240`
- `tests/tests/setup/shared/assertTeardown.ts:1-90` — the 27-of-28 accounting
- `tests/tests/setup/candidate/candidate-journey.teardown.ts:1-20` — the 28th, prefix-free file
- 28 `*.teardown.ts` files — full prefix inventory + containment scan
- `turbo.json`, root `package.json`, `.yarnrc.yml:5-30`, `.lintstagedrc.json`, `.prettierignore`, `.husky/pre-commit`
- `.github/workflows/main.yaml:69-70`, `:196-197`
- `packages/{core,matching,llm,question-info,argument-condensation}/{package.json,vitest.config.ts,tests/setup.ts}`
- `vitest.workspace.ts`
- `git log` on `tests/playwright.config.ts`; `git log -S'TEARDOWN-PREFIX-UNIQUENESS'`
- Command outputs quoted verbatim: `npx turbo run test:unit --dry=json` (turbo 2.8.17), `yarn build`, `yarn test:unit`, per-package `npx vitest run`, `npx playwright test --list` × 7 injections, `npx vitest list --filesOnly`, `npx vitest --version`
- `.planning/ROADMAP.md:261`, `:387`, `:434-446`; `.planning/REQUIREMENTS.md:7-12`, `:31-34`, `:63`, `:153`; `.planning/STATE.md:71`
- `.planning/phases/140-.../{140-VERIFICATION.md, 140-REVIEW-FIX.iter2.md:43, 140-REVIEW.iter3.md:309}`
- `./CLAUDE.md`, `.agents/code-review-checklist.md`

### Secondary (MEDIUM confidence)

- Vitest 3.2.4's own deprecation banner for `vitest.workspace.ts` (emitted by the installed binary; release-notes confirmation not fetched — see A1)

### Tertiary (LOW confidence)

- None. No web search was performed; no external-domain claim is made in this document.

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — nothing is installed; all tooling versions read from the installed binaries and the catalog
- Architecture: **HIGH** — every guard, script and workflow line quoted from the file at a cited line number
- Pitfalls: **HIGH** — 6 of 7 pitfalls are backed by an executed command whose output is quoted; Pitfall 4's second half rests on a quoted config file
- ASSERT-10 status: **HIGH** — guard code read in full, git-blamed, and all four branches injected and observed, with a clean revert verified by `git status --porcelain`

**Research date:** 2026-08-18
**Valid until:** 2026-09-17 for the tooling facts (30 days, stable). The *state* facts (which packages are wired, whether the docs are corrected) go stale on this phase's first commit — re-derive rather than cite after execution begins.
