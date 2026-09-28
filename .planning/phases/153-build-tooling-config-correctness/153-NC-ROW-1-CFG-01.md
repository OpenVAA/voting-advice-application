# Phase 153 — Negative Control, Row 1 (REVIEW-CFG-01)

**Two runs per requirement.** Every requirement this phase touches gets a **BLINDNESS** row — the
standing gate, as it stood, failing to notice a live defect — and a **CATCH** row — the same defect,
same shape, caught by name once the work lands. A row with only one half is not evidence: a green
guard and a blind guard are indistinguishable from a single observation, and this milestone exists
precisely to remove assertions that cannot fail.

This is a **fragment**. Plan 153-09 assembles it, together with the fragments from plans 03, 04, 05,
06 and 08, into `153-NEGATIVE-CONTROL.md`. It is written as a standalone document so that the
assembly is a concatenation rather than a rewrite.

- **Date:** 2026-08-29
- **Plan:** `153-01-PLAN.md` (wave 1, the phase tracer)
- **Requirements:** REVIEW-CFG-01
- **Decisions discharged:** D-B4 — how the tsup guard is proven
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`

## Environment

```
date (UTC):        2026-08-29T12:12:23Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          c5cd37692a129522b478833a3d289f502f3888f8  (the plan's Task-2 commit)
git branch:        integration/ship-12-squash
git status:        scoped `-- packages scripts package.json .yarnrc.yml yarn.lock` → empty before and
                   after every row below, apart from the staged new spec file
OS:                macOS / Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
tsup (installed):  8.5.1
tsup bin:          {"tsup":"dist/cli-default.js","tsup-node":"dist/cli-node.js"}
lint:check links:  9 (8 pre-existing, this plan appended the 9th)
```

> **Why the bare `git status` is not the gate.** `.planning/milestone.lock` is held modified by the
> orchestrator for the duration of this run, so the bare form is never empty. The gate that carries
> the claim here is the **scoped** form `git status --porcelain -- packages scripts package.json
> .yarnrc.yml yarn.lock`, which is also what the injection-isolation contract demands: twelve
> concurrent planning and execution runs share this branch, so this plan asserts cleanliness only
> over its own paths and reverts only by targeted `git checkout --` of the exact files it injected
> into — and only ever after the corresponding work was already committed, so the undo can restore
> nothing but the injection. No `git stash`, no `git clean`, and no blanket `git checkout .` was run
> at any point.

---

## Row 1 — REVIEW-CFG-01 / **BLINDNESS**

**Claim under test:** the repo's standing gate, `yarn lint:check`, notices when a workspace's
`build` script invokes a binary that workspace does not declare.

**Injection.** Two edits, restoring the tree to the exact shape the defect lived in before this
plan. First, `packages/matching`'s declaration is deleted, making the defect live again:

```diff
   "devDependencies": {
     "@openvaa/shared-config": "workspace:^",
-    "tsup": "catalog:",
     "typescript": "catalog:",
     "vitest": "catalog:"
   },
```

Second, `lint:check` is reverted to its pre-plan **8-link** form by removing the trailing
` && yarn assert:declared-binaries`. Note what is *not* reverted: `scripts/assert-declared-binaries.mjs`
is left on disk and `scripts["assert:declared-binaries"]` is left registered. This isolates the
property under test to **wiring alone** — the guard exists and passes when run by hand, and the
question is whether the standing command reports anything.

**Command:**

```sh
yarn lint:check
```

**Exit code: `0`.**

**Decisive output.**

```
 Tasks:    22 successful, 22 total
Cached:    0 cached, 22 total
  Time:    15.956s

I18n catalog namespace guard (phase 147: CSCAN-04) — total keys: 598; candidateApp.*: 161, adminApp.*: 121, other: 316. 0 violation(s).
A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — 0 violation(s).
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1578; rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).
Edge-function environment-default guard (phase 155: REVIEW-EDGE-02) — files scanned: 17; checks live: 3 of 3 (env-default; copy-drift; vitest-reachability). 0 violation(s).
```

`grep -c '^\[ERROR\]'` over the full run log returns **0**.

**Verdict: BLIND.** The defect was live throughout — `packages/matching`'s `build` script opened
with `tsup` while the workspace declared it nowhere, confirmed mid-run by reading the manifest back
(`matching devDeps.tsup = undefined`). All four pre-existing guards ran, all four reported `0
violation(s)`, all 22 turbo tasks succeeded, and the command exited `0`. Nothing in the gate said a
word about the defect. Note also that `@openvaa/matching:build` **succeeded** during this very run:
the build is green in exactly the state the defect is live in, which is why inspection had to find
this class and why a comment beside the manifest could never have held it.

---

## Row 1 — REVIEW-CFG-01 / **CATCH**

**Claim under test:** the same, against the shipped work.

**Injection.** *Identical* — `packages/matching`'s `tsup` declaration stays deleted. The single
difference from the BLINDNESS row is that the 9th `lint:check` link is restored. No source file, no
guard, and no other manifest differs between the two runs.

**Command:**

```sh
yarn lint:check
```

**Exit code: `1`.**

**Decisive output.**

```
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/matching' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
Declared-binaries guard (phase 153: REVIEW-CFG-01) — 16 workspace(s) scanned, 20 build-script binary invocation(s). 1 violation(s).
```

**Verdict: CAUGHT.** Same defect, same tree, one chain link's difference: exit `0` and silence
becomes exit `1` and a named workspace. REVIEW-CFG-01 asks for a guard that fails **by name rather
than by inspection**, and the message names the location, the script, the binary, the mechanism that
hides it (`nodeLinker: node-modules` hoisting) and the consequence.

**Restore.** `git checkout -- packages/matching/package.json package.json` — safe because both files
were already committed at `c5cd37692`, so the undo can restore nothing but the injection. The guard
then returns to `0 violation(s).`, exit `0`, and the scoped `git status` is empty apart from the
staged new spec file.

---

## Supporting observation A — the guard observed red on all 8, before any fix

Taken at Task 1, **before any manifest was edited**, on the unmodified tree. This is the
non-reproducible half: once Task 2 landed the declarations, this observation could never be taken
again in this shape.

**Command:**

```sh
node scripts/assert-declared-binaries.mjs
```

**Exit code: `1`.** Eight `[ERROR]` lines, eight mentions of `tsup`, each location named exactly
once and no other location named. Stdout:

```
Declared-binaries guard (phase 153: REVIEW-CFG-01) — 16 workspace(s) scanned, 20 build-script binary invocation(s). 8 violation(s).
```

Stderr, verbatim:

```
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/app-shared' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/argument-condensation' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/core' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/data' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/filters' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/llm' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/matching' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
[ERROR] scripts/assert-declared-binaries.mjs: 'packages/question-info' invokes `tsup` in its `build` script, but no dependency that workspace declares provides a `bin` named `tsup`. It resolves today only because the root hoists it under `nodeLinker: node-modules`; a workspace that does not declare what it runs is one install-topology change from a broken build.
```

Two consecutive runs over the unchanged tree produced **byte-identical** stderr — both captures
hashed `eb57a6397b25eeda609ceb44f3cd6415aa675ad0` and `diff` of the pair was empty. The report order
is workspace location ascending in byte order, then binary name, then script name, so a diff of two
captures is evidence rather than noise.

## Supporting observation B — green after the eight declarations

**Command:**

```sh
node scripts/assert-declared-binaries.mjs
```

**Exit code: `0`.** Stderr **empty** (0 bytes). Stdout:

```
Declared-binaries guard (phase 153: REVIEW-CFG-01) — 16 workspace(s) scanned, 20 build-script binary invocation(s). 0 violation(s).
```

The census is the load-bearing part of that line. `16 workspace(s) scanned, 20 build-script binary
invocation(s)` says the guard still looked at everything it looked at when it was reporting eight
violations; a guard whose scope silently collapsed to nothing would print the same `0 violation(s).`
with a census of zero.

## Supporting observation C — the guard's own blindness modes, probed

A guard that reports zero because it examines nothing is the failure this ledger exists to exclude,
so the guard's edge behaviour was probed directly, with a throwaway workspace created under
`packages/` and removed afterwards. Each row is a separate run; the census figure is the tell.

| Probe | Result |
|---|---|
| Workspace with no `scripts` key | census `17 workspace(s)`, violations unchanged at 8 — counted, not skipped |
| `build` value is the empty string | census `17`, violations 8, no exception |
| `build` value is whitespace only | census `17`, violations 8, no exception |
| `build: "compile && tsup"` where `compile` is the workspace's own script key | `compile` **not** reported, `tsup` reported — 21 invocations, 9 violations |
| Declares `tsup`, invokes `TSUP` | **reported** — comparison is exact byte equality; no case folding, no Unicode normalisation |
| `build: "nope && nope"` | reported **once**, not twice |
| One `bin` name provided by **two** declared dependencies | **0** violations for it, reported once, not twice |
| Manifest present but unparseable | fails **closed** — `[ERROR] … could not read or parse … this fails closed.` |

## Ledger status

Row 1 (REVIEW-CFG-01) is **complete**: both halves observed at the level of the standing command
`yarn lint:check`, with three supporting observations. Rows 2–6 are owned by plans 153-05, 153-04,
153-06, 153-08 and 153-03 respectively and are assembled by 153-09.
