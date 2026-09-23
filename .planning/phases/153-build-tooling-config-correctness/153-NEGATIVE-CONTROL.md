# Phase 153 — Negative Control Ledger

**Two runs per requirement.** Every requirement this phase touches gets a **BLINDNESS** row — the
standing gate, as it stood, failing to notice a live defect — and a **CATCH** row — the same defect,
same shape, caught by name once the work lands. A row with only one half is not evidence: a green
guard and a blind guard are indistinguishable from a single observation, and this milestone exists
precisely to remove assertions that cannot fail. Where a row could not have that shape, it says so
and says why, rather than manufacturing symmetry.

This file is **assembled** by plan `153-09` from six per-plan fragments. The fragments are retained
on disk beside it as raw provenance and are the record each plan actually produced; this ledger is
the reading surface. Every row below is lifted **verbatim** from its fragment by line-range slice —
not paraphrased, not re-run, not tidied. **The single transformation applied** is that each
fragment's own `## Environment` heading was demoted to an `### Environment as recorded by …` heading
so the six per-row environment blocks nest under their rows; the fenced block contents and every
other byte are untouched. That transformation is disclosed here so a reader diffing this file
against a fragment knows what to expect.

- **Date:** 2026-08-29
- **Plans:** `153-01` (w1) · `153-02` (w2) · `153-03` (w3) · `153-04` (w1) · `153-05` (w1) · `153-06` (w1) · `153-07` (w1) · `153-08` (w2) · `153-10` (w3) · `153-11` (w3) · `153-09` (w4, this assembly) — **ten execution plans plus the close**
- **Requirements:** REVIEW-CFG-01, -02, -03, -04, -05, -06, -07, -08 (and REVIEW-HYG-01, -02, re-measured by `153-11` and left Pending — see `## Ledger status`)
- **Decisions discharged:** D-B1, D-B2, D-B3, D-B4, D-B5 (reversed by operator ruling O5), D-B6, D-N1, D-N2, D-N3; operator rulings O5, D1, D3, D8, D9
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`

## Ledger row count, declared before any row is read

**This ledger carries SIX numbered rows, plus one sub-row.** If you count fewer than six `## Row N`
groups below, the ledger is incomplete and should not be read as a phase record.

| Row | Requirement | Owning plan | Fragment | Shape |
|---|---|---|---|---|
| Row 1 | REVIEW-CFG-01 | `153-01` | `153-NC-ROW-1-CFG-01.md` | BLINDNESS + CATCH, plus supporting observations A, B, C |
| Row 2 | REVIEW-CFG-08 | `153-05` | `153-NC-ROW-2-CFG-08.md` | BLINDNESS + CATCH, plus an executed hazard pair |
| Row 2b | REVIEW-CFG-04 | `153-05` | `153-NC-ROW-2-CFG-08.md` | coverage-preservation argument + measured rejection of the naive fix |
| Row 3 | REVIEW-CFG-03 | `153-04` | `153-NC-ROW-3-CFG-03.md` | **no BLINDNESS half is available** — no-regression pair with a live wrong-directory control; the reason is preserved in the row |
| Row 4 | REVIEW-CFG-06 | `153-06` | `153-NC-ROW-4-CFG-06.md` | BEFORE + AFTER |
| Row 5 | REVIEW-CFG-05 | `153-08` | `153-NC-ROW-5-CFG-05.md` | refutation, root cause, resolution, and an explicit *what is NOT observed* |
| Row 6 | REVIEW-CFG-02 | `153-03` | `153-NC-ROW-6-CFG-02.md` | four parts, including a flip matrix and an explicit boundary |

**REVIEW-CFG-07 has no row.** `153-07` produced no negative-control fragment; its proof is two
commands, re-run at phase close and recorded in `## Requirement trace`. That absence is stated here
rather than left for a reader to notice.

## Environment

Phase-close environment — the state at which the gate in `## Ledger status` was taken. Each row
additionally carries **its own** environment block, as recorded by the plan that produced it, at the
HEAD that row was measured at. Those HEADs differ from each other and from this one, by design: the
rows were taken as the work landed, and re-taking them at one HEAD is impossible for the BLINDNESS
halves, which stopped being observable the moment their fix was committed.

```
date (UTC):          2026-08-29T19:34:13Z  (compile-time gate)
                     2026-08-29T19:37:42Z  (E2E gate)
repo root:           /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:            a332f46264da7dcf69a1e1fdc5693943b2469530
git branch:          integration/ship-12-squash
git status (bare):   clean at the moment the gate was taken (see the caveat below — this is luck, not a gate)
git status (scoped): `-- packages apps scripts tests .github package.json .lintstagedrc.json
                     .gitignore .yarnrc.yml .env.example` → 0 entries, before and after every
                     command recorded in `## Ledger status`
OS:                  macOS 26.5.1 / Darwin 25.5.0 arm64
Node:                v24.14.1
Yarn:                4.13.0
host bash:           GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
container bash:      GNU bash, version 5.2.37(1)-release (aarch64-alpine-linux-musl)
                     GNU bash, version 5.2.15(1)-release (aarch64-unknown-linux-gnu)
                     (recorded by 153-08 in Row 5; no bash 5 exists on this host, which is the
                      whole reason that reproduction had to be containerised)
CI runner bash:      bash 5.2 (ubuntu-latest / Ubuntu 24.04) — inferred from the runner image, NOT observed
free disk:           155 GiB
lint:check links:    11
```

> **Why the bare `git status` is not the gate — and why that caveat is more load-bearing here than
> in the `141` original it is inherited from.** In `141` the reason was one file: the orchestrator
> rewrote `.planning/STATE.md` during a run. Here the reason is structural. **This worktree has
> carried twelve concurrent GSD planning and execution runs on one shared branch throughout Phase
> 153**, each writing under `.planning/` continuously, and `.planning/milestone.lock` carries a live
> pid heartbeat that is rewritten while any run is active. A bare `git status` in this worktree is
> therefore expected to be dirty at an arbitrary moment and expected to be dirty with *another
> agent's* work — so a bare-status assertion here would be satisfied or failed by facts that have
> nothing to do with the claim it is attached to. It would be flaky **and** meaningless, in that
> order of discovery.
>
> Every status claim in this ledger is consequently **path-scoped**, and each names its paths. The
> bare form happened to be clean when the phase-close gate was taken, and that is recorded above as
> an observation rather than promoted to a gate — precisely because it cannot be relied on to be
> clean at any other instant.
>
> The same reasoning governs how injections were reverted. Across all six rows the undo was a
> targeted `git checkout -- <named paths>` against already-committed state, or a targeted `rm` of
> exactly the paths created. **No `git stash`, no `git clean`, and no blanket `git checkout .` was
> run at any point by any plan in this phase** — `git stash` because the stash stack is shared
> across every worktree and session on this machine, `git clean` because it deletes feature-branch
> files a worktree has not yet seen in its own history, and the blanket checkout because eleven
> sibling agents' uncommitted work sits in the same tree.

---
## Row 1 — REVIEW-CFG-01 / **BLINDNESS**

### Environment as recorded by `153-01` (fragment: `153-NC-ROW-1-CFG-01.md`)

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


---

## Row 2 — REVIEW-CFG-08 / **BLINDNESS**

### Environment as recorded by `153-05` (fragment: `153-NC-ROW-2-CFG-08.md`)

```
date (UTC):        2026-08-29T13:04:07Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          9973a2f695b0043b3a9923bf0277cd071ca45e8a  (the 153-05 config commit)
git branch:        integration/ship-12-squash
git status:        scoped `-- .lintstagedrc.json .prettierignore` → 0 entries before and after every row below
OS:                macOS / Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
turbo:             2.8.17
lint-staged:       16.4.0   (engines: node >=20.17)
prettier:          3.7.4
core.hooksPath:    /dev/null   (worktree-scoped override)
```

> **Why the bare `git status` is not the gate.** `.planning/STATE.md` and
> `.planning/milestone.lock` are written by the GSD orchestrator throughout execution, so
> the bare form is never empty during a run — twelve concurrent planning runs make that
> more true here, not less. The gate that carries the claim in this file is the **scoped**
> form `git status --porcelain -- .lintstagedrc.json .prettierignore`, which is also what
> the isolation contract for this plan demands: lint-staged stashes and restores the index
> it is pointed at, so running it against *this* worktree could destroy eleven sibling
> agents' staged state. It was never pointed here. No `git stash`, no `git clean`, no
> `git checkout .` was run at any point.

> **Why no capture in this file was taken by committing.** This worktree's
> `core.hooksPath` is `/dev/null` (worktree-scoped; the shared repo config still points at
> the *other* checkout's `.husky`), so `git commit` here fires no hook at all and the
> criterion-8 proof **cannot** be obtained by committing. Every capture below was taken by
> invoking this repo's real lint-staged binary
> (`node node_modules/lint-staged/bin/lint-staged.js --verbose`) directly, inside a
> throwaway `git init` repository under the session scratchpad with its own
> `core.hooksPath=/dev/null`. That makes the evidence **stronger**, not weaker: it isolates
> lint-staged's glob matching from husky entirely, so nothing in the result depends on hook
> wiring.

---


**Claim under test:** `.lintstagedrc.json`'s first glob matches staged `.svelte` and `.mjs`
files, so a deliberately mis-formatted one of each is handed to `prettier --write` and
`eslint --fix` on commit.

**The defect.** The glob as committed before this plan (`.lintstagedrc.json:2`, verbatim):

```json
  "*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}": [
```

`mjssvelte` is **one** brace alternative, matching a literal `.mjssvelte` extension that no
file in the repo has. Neither `mjs` nor `svelte` appears anywhere in the pattern. lint-staged
16.4.0 ships a `validateBraces.js` that warns on *malformed* brace groups (`*.{js}`,
`*.{{a,b}}`), but `{…,mjssvelte,…}` is well-formed — it has commas and no double braces — so
the tool emits no warning. The defect is invisible to lint-staged itself.

**Injection.** A throwaway repository, `git init`, `core.hooksPath=/dev/null`, with the glob
keys copied verbatim out of this repo's `.lintstagedrc.json` and `echo` stand-ins substituted
for the task commands so the match set is legible in the output:

```json
{
  "*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}": [
    "echo MATCHED-A"
  ],
  "*.{css,json,md}": [
    "echo MATCHED-B"
  ]
}
```

Three deliberately mis-formatted files staged alongside it — `Bad.svelte` and `bad.mjs` are
the subjects; `note.md` exists only so the second glob has something to match and the run is
not vacuous:

```
<script>
  let    x   =   1
</script>

<p>{x}</p>
```

```
export   const   bad =    {a:1,   b:2}
```

**Command.**

```
node <repo>/node_modules/lint-staged/bin/lint-staged.js --verbose
```

**Exit code.** `0` — the run *succeeds*.

**Decisive output** (verbatim):

```
[STARTED] Backing up original state...
[COMPLETED] Backed up original state in git stash (cbf5236)
[STARTED] Running tasks for staged files...
[STARTED] .lintstagedrc.json — 4 files
[STARTED] *.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml} — 0 files
[STARTED] *.{css,json,md} — 2 files
[SKIPPED] *.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml} — no files
[STARTED] echo MATCHED-B
[COMPLETED] echo MATCHED-B
[COMPLETED] *.{css,json,md} — 2 files
[COMPLETED] .lintstagedrc.json — 4 files
[COMPLETED] Running tasks for staged files...
[STARTED] Applying modifications from tasks...
[COMPLETED] Applying modifications from tasks...
[STARTED] Cleaning up temporary files...
[COMPLETED] Cleaning up temporary files...

→ echo MATCHED-B:
MATCHED-B /…/lsdemo/.lintstagedrc.json /…/lsdemo/note.md
```

**Verdict — BLINDNESS.** `— 0 files`, then `[SKIPPED] … — no files`. There is no
`→ echo MATCHED-A:` block at all, because the task never ran. Both mis-formatted files pass
straight through and the exit code is `0`.

**The pass IS the finding, not a success.** A green lint-staged run over a staged file that
is visibly mis-formatted is the whole defect: on `.svelte` (237 tracked files) and `.mjs`
(44 tracked files) the pre-commit gate has never examined anything. A gate that examines
nothing also reports green. Read this row as a failure of the gate, not as a passing run.

> **Falsified inherited premise, recorded rather than repeated.** `.planning/REQUIREMENTS.md:102`
> justifies REVIEW-CFG-08 with *"the repo's largest file type has never been covered by
> pre-commit"*. Measured this session over `git ls-files`, `.svelte` is the **fourth** most
> common tracked extension repo-wide — `md` 2674, `ts` 1310, `json` 816, `svelte` 237 — and
> third within `apps/frontend/src` (`ts` 569, `json` 322, `svelte` 170). It is not the
> largest under any scoping tried. What *is* true, and is the whole of the defect, is that
> `.svelte` was the largest **previously-uncovered** extension (237 vs `.mjs`'s 44). The
> requirement stands on that; the superlative in its prose does not.

---

## Row 2 — REVIEW-CFG-08 / **CATCH**

**Claim under test:** identical to the BLINDNESS row.

**The fix** (`.lintstagedrc.json:2` after commit `9973a2f69`, verbatim):

```json
  "*.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml}": [
```

One comma, inserted in the position the fused token occupied. Every other alternative and its
order is unchanged; the alternative count goes from 13 to 14.

**Injection.** The *same* throwaway repository, the *same* staged `Bad.svelte` / `bad.mjs` /
`note.md`, the *same* `echo` stand-ins, the *same* lint-staged binary. The only variable
changed is the glob key, re-copied verbatim out of the now-edited `.lintstagedrc.json`.

**Command.** Identical to the BLINDNESS row.

**Exit code.** `0`.

**Decisive output** (verbatim):

```
[STARTED] Backing up original state...
[COMPLETED] Backed up original state in git stash (032bd58)
[STARTED] Running tasks for staged files...
[STARTED] .lintstagedrc.json — 4 files
[STARTED] *.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml} — 2 files
[STARTED] *.{css,json,md} — 2 files
[STARTED] echo MATCHED-A
[STARTED] echo MATCHED-B
[COMPLETED] echo MATCHED-A
[COMPLETED] *.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml} — 2 files
[COMPLETED] echo MATCHED-B
[COMPLETED] *.{css,json,md} — 2 files
[COMPLETED] .lintstagedrc.json — 4 files
[COMPLETED] Running tasks for staged files...
[STARTED] Applying modifications from tasks...
[COMPLETED] Applying modifications from tasks...
[STARTED] Cleaning up temporary files...
[COMPLETED] Cleaning up temporary files...

→ echo MATCHED-A:
MATCHED-A /…/lsdemo/Bad.svelte /…/lsdemo/bad.mjs

→ echo MATCHED-B:
MATCHED-B /…/lsdemo/.lintstagedrc.json /…/lsdemo/note.md
```

**Verdict — CATCH.** Back-reference to the BLINDNESS row's numbers: that run reported the
first glob at **`— 0 files`** and then **`[SKIPPED] … — no files`**, with no `MATCHED-A` block
in the output. This run, over the identical staged pair, reports the same glob at
**`— 2 files`**, runs the task, and names **both** paths — `Bad.svelte` **and** `bad.mjs` — in
the `→ echo MATCHED-A:` block. `0 files` → `2 files`. The stand-ins occupy the exact argv
position the real `prettier --write` and `eslint --fix --flag v10_config_lookup_from_file`
tasks occupy, so what the stand-in received is what the real tasks now receive.

---

## Row 2 — the hazard the CATCH uncovers, executed rather than argued

Fixing the glob makes lint-staged pass **explicit file paths** for every staged `.svelte`
file. 45 tracked `.svelte` files under `.claude/skills/**` are spike *fixtures*; the root
`prettier.config.mjs` re-exports `@openvaa/shared-config/prettier` and loads **no** svelte
plugin (only `apps/frontend/prettier.config.mjs` adds `prettier-plugin-svelte`). Root
`prettier --check .` never reaches them because it does not descend into dot-directories —
which is why `yarn format:check` has always been green — but an explicit path bypasses that
entirely. So the glob fix, shipped alone, would block every commit that stages a skill
fixture. Both halves were run, in a second throwaway repository, with the **real**
`prettier --write` task rather than a stand-in, over a real fixture at its real
`.claude/`-prefixed path.

**Half A — the fixed glob, no `.claude/` entry in `.prettierignore`.** Exit code **`1`**:

```
[STARTED] *.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml} — 1 file
[STARTED] prettier --write
[FAILED] prettier --write [FAILED]
[STARTED] Reverting to original state because of errors...
[FAILED] prettier --write [SIGKILL]
[COMPLETED] Reverting to original state because of errors...

✖ prettier --write:
[error] No parser could be inferred for file "/…/lshazard/.claude/skills/spike-findings-voting-advice-application-gsd/sources/004-matchstore-integration/runes-test-page.svelte".

✖ Task killed: prettier --write
```

**Half B — the same fixture, the same fixed glob, with this repo's `.prettierignore` (whose
line 1 is now `.claude/`) copied in.** Exit code **`0`**:

```
[STARTED] *.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml} — 1 file
[STARTED] prettier --write
[COMPLETED] prettier --write
[COMPLETED] *.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml} — 1 file
…
→ prettier --write:
.lintstagedrc.json 8ms
```

The fixture is still **matched** by the glob (`— 1 file`) and still **handed to** the real
task; prettier then declines it as ignored, which is why only `.lintstagedrc.json` appears in
the timing line. The ignore entry is doing the work, not a narrowed glob.

Corroborated directly against prettier, both directions, in this worktree:

```
$ npx prettier --file-info .claude/…/runes-test-page.svelte
{ "ignored": true, "inferredParser": null }

$ npx prettier --ignore-path <pre-edit .prettierignore> --file-info .claude/…/runes-test-page.svelte
{ "ignored": false, "inferredParser": null }

$ npx prettier --ignore-path <pre-edit .prettierignore> --check .claude/…/runes-test-page.svelte
[error] No parser could be inferred for file "…".
Error occurred when checking code style in the above file.
EXIT=2
```

The first glob's other task is harmless on this set — measured, not assumed:

```
$ npx eslint --fix --flag v10_config_lookup_from_file .claude/…/runes-test-page.svelte
  0:0  warning  File ignored because no matching configuration was supplied
✖ 1 problem (0 errors, 1 warning)
ESLINT_EXIT=0
```

`.claude/` and the glob split land in the **same commit** (`9973a2f69`), so the hazard never
exists in tree history as a shippable state.

---

## Row 2b — REVIEW-CFG-04

**Requirement, verbatim** (`.planning/REQUIREMENTS.md:98`):

> `.lintstagedrc.json` invokes its commands directly rather than through `bash -c`, so the
> pre-commit hook works where bash is absent.

**What was done.** Both `bash -c '…'` entries — one on each glob, byte-identical commands —
were **deleted**, not replaced (OQ-5 option (a)). `grep -c 'bash' .lintstagedrc.json` now
returns `0`.

**Why deletion loses no coverage.** `.husky/pre-commit` is three lines; line 1, verbatim:

```
yarn turbo run build --filter=@openvaa/app-shared...
```

and line 3 is `yarn lint-staged`. The hook **already runs that exact build** immediately
before invoking lint-staged, so the two config entries were redundant re-invocations of a
build that had just run. Nothing that consumes files was removed: the first glob still
carries `prettier --write` and `eslint --fix --flag v10_config_lookup_from_file`; the second
still carries `prettier --write`. Stated residual: someone running `npx lint-staged` outside
the hook no longer gets the build first; the hook is the only documented entry point.

**Why the naive replacement was rejected — measured, not reasoned.** lint-staged spawns
string commands with `tinyexec` and **no shell** anywhere in the code path. The decisive
line, verbatim:

```js
node_modules/lint-staged/lib/getSpawnedTask.js:102
    const result = exec(cmd, isFn ? args : args.concat(files), tinyExecOptions)
```

with `getSpawnedTasks.js:39`: `const isFn = typeof cmd === 'function'`. So a **string**
command gets the staged file list appended; a function task's returned command does not. The
`bash -c '…'` wrapper was absorbing that appended list into the shell's positional parameters
(`$0`, `$1`, …), which the single-quoted script never referenced. Replacing the wrapper with
the bare command string therefore hands turbo the staged paths as task names. Re-measured
this session:

```
$ yarn turbo run build --filter=@openvaa/app-shared... apps/frontend/src/app.html README.md
• turbo 2.8.17
  x Missing tasks in project
  |->   x Could not find task `README.md` in project
  `->   x Could not find task `apps/frontend/src/app.html` in project
EXIT=1
```

That the BLINDNESS and CATCH runs above both show `MATCHED-B` echoing the two matched paths
(`… /lsdemo/.lintstagedrc.json /…/lsdemo/note.md`) is the same fact observed from the other
side: lint-staged really does append files to string commands.

**Verdict — REVIEW-CFG-04 satisfied.** Zero shell-wrapper invocations remain, so nothing in
the config needs a shell to exist; the two commands that remain (`prettier`, `eslint`) are
spawned by `tinyexec` without one. `yarn format:check` is green after the edit.

**Flagged planner assumption, carried forward unresolved.** REVIEW-CFG-04 states no
acceptance edge of its own and its deterministic edge probe returned `unclassified`. The
assumption this row rests on is that *"so the pre-commit hook works where bash is absent"* is
fully discharged by removing every shell-wrapper invocation from the config, on the grounds
that lint-staged uses no shell for what remains. That is grounded in the installed source
(`getSpawnedTask.js:102`, no `shell` option anywhere in the file — verified by `grep`), but it
is an interpretation, not a measurement of a bash-free machine. A reader who disagrees should
say so before the phase closes.

---


---

## Row 3 — REVIEW-CFG-03

### Environment as recorded by `153-04` (fragment: `153-NC-ROW-3-CFG-03.md`)

```
date (UTC):          2026-08-29T12:50:41Z
repo root:           /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:            dd5db88903068be24ab54894186a84e55dfff646  (the 153-04 Task 1 commit)
git branch:          integration/ship-12-squash
git status:          scoped `-- apps/frontend/vitest.config.ts` → empty before and after every run below
OS:                  macOS 26.5.1 / Darwin 25.5.0 arm64
Node:                v24.14.1
Yarn:                4.13.0
vitest:              3.2.4
vite (root):         7.3.0   → node_modules/vite
vite (vitest-nested): 7.3.1  → node_modules/vitest/node_modules/vite   ← the loader that actually bundles the config
```

> **Why the bare `git status` is not the gate.** `.planning/milestone.lock` carries a pid
> heartbeat and is modified continuously by the GSD orchestrator, so the bare form is never
> empty during a run. The gate that carries the claim here is the **scoped** form
> `git status --porcelain -- apps/frontend/vitest.config.ts`, which is the only path this row
> injects into. The injection below was reverted by targeted
> `git checkout -- apps/frontend/vitest.config.ts` against the already-committed Task 1 state.
> No `git stash`, no `git clean`, no `git checkout .` was run at any point.

---


### Why this row has no ordinary BLINDNESS half

**`apps/frontend/vitest.config.ts` does not fail today, and no injection can make it fail
today.** There is therefore nothing to observe in a "before" state, and this row does not
pretend otherwise.

The reason is mechanical. Vite does not hand a TypeScript config file to Node; it bundles it
with esbuild first, and that bundle step **defines `__dirname` unconditionally — in ESM output
as well as CJS**. Quoting the installed loader,
`node_modules/vitest/node_modules/vite/dist/node/chunks/config.js` (Vite **7.3.1**, the copy
vitest resolves):

- `:35804` — `const dirnameVarName = "__vite_injected_original_dirname";`
- `:35821` — `__dirname: dirnameVarName,` — inside the esbuild `define` map
- `:35824` — `"import.meta.dirname": dirnameVarName,`
- `:35864` — `let injectValues = \`const ${dirnameVarName} = ${JSON.stringify(path.dirname(args.path))};…\`;`

The `define` map at `:35818-35826` sits **outside** the `format: isESM ? "esm" : "cjs"` branch
at `:35813`, which is the precise reason the shim is not CJS-only. So a demonstration of the
form "watch the config break, now watch it fixed" would be a demonstration that does not
reproduce, and staging one would put a fabricated BLINDNESS row in the ledger.

> **Citation correction.** `153-04-PLAN.md` cites Vite **6.4.1** at
> `node_modules/vite/dist/node/chunks/config.js:35802,35819,35822,35862`. No Vite 6.4.1 is
> installed. Those four line numbers are exact against the **root** copy, Vite **7.3.0**; the
> vitest-nested copy is 7.3.1 and the same four sites sit at `:35804,35821,35824,35864` (a
> uniform +2 offset). The plan's line numbers were real measurements mislabelled with a wrong
> version string. Both copies are cited above rather than one, because the nested copy is the
> one that actually loads this config.

### Claim under test

This is a **portability** claim, not a defect claim: that `apps/frontend/vitest.config.ts`
can derive its own directory without depending on a shim its own package type says should
not be there (`apps/frontend/package.json:59` — `"type": "module"`), **and that doing so
changes no resolved path**. It is proven by a no-regression pair plus a wrong-directory
control. The control is what makes the pair non-vacuous: without it, an alias table that
resolved to nothing at all would produce the same green.

### Evidence 1 — the no-regression pair (alias values byte-identical)

All 11 `resolve.alias` `replacement` values were dumped by loading the config through Vite's
own `loadConfigFromFile` — the same esbuild-bundle path vitest uses — before and after the
edit.

```
$ diff aliases-BEFORE.txt aliases-AFTER.txt
$ echo $?
0

$ md5 -q aliases-BEFORE.txt aliases-AFTER.txt
47e87c7ad24a88d59ea6b487f9496180
47e87c7ad24a88d59ea6b487f9496180
```

Empty diff, identical digest, 11 lines each side.

### Evidence 2 — collection and suite unchanged

```
$ cd apps/frontend && npx vitest list --run
EXIT=0
822 output lines, 806 beginning `src/`, 0 occurrences of "Failed to resolve"
```

```
$ yarn workspace @openvaa/frontend test:unit

 Test Files  54 passed (54)
      Tests  816 passed (816)
```

Identical before the edit and after it — both runs recorded, not one run assumed to stand for
two.

### Evidence 3 — the wrong-directory control (the decisive half)

**Injection.** The single derived constant at `apps/frontend/vitest.config.ts:7` was pointed
at a sibling directory that does not exist:

```ts
-const here = fileURLToPath(new URL('.', import.meta.url));
+const here = fileURLToPath(new URL('../frontend-nonexistent-negative-control/', import.meta.url));
```

**Control half A — the alias-dump harness flips.** The same `diff` that returned empty above
returns non-empty against the injected constant, so the comparison in Evidence 1 is a live
comparison and not one examining nothing:

```
$ diff aliases-BEFORE.txt aliases-BOGUS.txt
1,11c1,11
< $lib/paraglide/runtime	…/apps/frontend/src/lib/i18n/tests/__mocks__/paraglide-runtime.ts
…
$ echo $?
1
```

**Control half B — collection fails by name.** Command, exit code and verbatim output:

```
$ cd apps/frontend && npx vitest list --run
Error: Failed to resolve import "$lib/i18n/wrapper" from "src/lib/i18n/tests/translations.test.ts". Does the file exist?
  Plugin: vite:import-analysis
  File: /Users/kallejarvenpaa/…/apps/frontend/src/lib/i18n/tests/translations.test.ts:5:18
  3  |  import { fileURLToPath } from "url";
  4  |  import { describe, expect, test } from "vitest";
  5  |  import { t } from "$lib/i18n/wrapper";
     |                     ^
 ❯ TransformPluginContext._formatLog …/vitest/node_modules/vite/dist/node/chunks/config.js:28999:43

Error: Failed to resolve import "$lib/paraglide/runtime" from "src/lib/i18n/overrides.ts". Does the file exist?
  Plugin: vite:import-analysis

EXIT=1
```

347 output lines, all resolution failures; `$lib` is named in the first one.

**Restoration.** `git checkout -- apps/frontend/vitest.config.ts` against the committed Task 1
state, then re-run:

```
$ grep -c 'nonexistent-negative-control' apps/frontend/vitest.config.ts
0
$ git status --porcelain -- apps/frontend/vitest.config.ts
$ cd apps/frontend && npx vitest list --run
EXIT=0
```

The tree is left in the restored state and the committed file contains no bogus path.

### Verdict

**Demonstrated.** That the 11 alias replacement values are byte-identical across the change,
by printing both sets and diffing rather than by inspection. That the config loads and every
alias resolves under the new constant (`vitest list --run`, exit 0, full collection). That the
54-file / 816-test suite is unmoved. And — decisively — that all three of those signals are
capable of going red: pointing the derived constant one directory sideways turns the diff
non-empty and collection into exit 1 naming `$lib`. The proof examines something.

**Not demonstrated, and not claimed.** No live failure of the pre-change config, because none
exists to observe: Vite's bundler defines `__dirname` for it in ESM mode. This row is a
no-regression pair with a live control, and is recorded as exactly that. It is **not** a
guard that noticed a defect, and nothing here should be read into the ledger as one. The
change's value is portability — the file no longer depends on an implementation detail of the
tool that happens to load it — and portability is a property that a passing test suite can
corroborate but cannot, on its own, prove.

---

## Row 4 — REVIEW-CFG-06 / **BEFORE**

### Environment as recorded by `153-06` (fragment: `153-NC-ROW-4-CFG-06.md`)

```
date (UTC):        2026-08-29T16:44:11Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          133e35f793f7dc225ea99876e9d44e8eef09f6c9  (the Row-4 index-removal commit)
git branch:        integration/ship-12-squash
OS:                macOS / Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
tsc:               5.9.3
turbo:             2.8.17
git:               2.50.1 (Apple Git-155)
```

> **Why the bare `git status` is not the gate, and why that matters more here than anywhere else in
> this phase.** This is the only plan in Phase 153 that mutates the **git index**, and it does so
> while eleven sibling agents share that index and the GSD orchestrator writes `.planning/`
> continuously. An unscoped `git status` in this worktree is expected to be dirty at any moment, so
> an unscoped assertion would be both flaky and meaningless: sibling dirt could satisfy it or fail
> it independently of anything this row claims. **Every status claim below is scoped to exactly
> five paths** — `.gitignore`, `apps/docs/tsconfig.tsbuildinfo`,
> `apps/frontend/tsconfig.tsbuildinfo`, `packages/supabase-types/tsconfig.tsbuildinfo`, and
> `supabase/.branches/_current_branch`. The index mutation itself was four separate literal
> `git rm --cached` invocations: no `-r`, no `.`, no `-A`, no glob, no
> `git update-index --skip-worktree` at any point. No `git clean`, no `git stash`, and no blanket
> working-tree reset was run.
>
> The scoped form is **not** vacuous, and that is demonstrated rather than asserted — see
> *Non-vacuity of the scoped status gate* in the AFTER half.

---


**Claim under test:** build artefacts are tracked in version control, and nothing in the repository
prevents the class from reopening in another workspace.

### The tracked set — four paths, not the one the reviewer's comment named

The reviewer's comment named a single file and the roadmap inherited that scope. The index says
otherwise. Measured at `0955daec4`, immediately before the change:

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
apps/docs/tsconfig.tsbuildinfo
apps/frontend/tsconfig.tsbuildinfo
packages/supabase-types/tsconfig.tsbuildinfo
supabase/.branches/_current_branch
```

Blob sizes taken from the index itself (`git cat-file -s $(git rev-parse HEAD:<path>)`), and
history from `git log -- <path>`:

| Path | Blob size | Commits touching it | First / last |
|---|---|---|---|
| `apps/docs/tsconfig.tsbuildinfo` | 116 813 B | 1 | 2026-08-17 / 2026-08-17 |
| `apps/frontend/tsconfig.tsbuildinfo` | 407 535 B | 2 | 2026-08-17 / 2026-08-17 |
| `packages/supabase-types/tsconfig.tsbuildinfo` | 70 463 B | 1 | 2026-08-17 / 2026-08-17 |
| `supabase/.branches/_current_branch` | 4 B (content: `main`) | 1 | 2026-08-17 / 2026-08-17 |
| **Total** | **594 815 B (581 KiB)** | | |

Introducing commits: `602b79351` *"refactor: move frontend/ and docs/ under apps/"*, `3d75e3e27`
*"chore: update the monorepo and frontend-app build, lint, CI and deployment plumbing"*, and
`11f877913` *"feat[db]: replace the Strapi backend with the Supabase schema, RLS, functions and
generated types"*. All three are bulk-restructuring commits — the artefacts were swept in, never
chosen.

This confirms the phase's framing: **fixing one of three leaves the noisy-diff problem in the two
busiest workspaces**, and `apps/frontend/tsconfig.tsbuildinfo` — the largest of the four at
407 535 B — is precisely the one the single-file scope would have left behind.

### No rule existed, and nothing was closing the class

`.gitignore` at `0955daec4` was 78 lines and contained **no `tsbuildinfo` rule and no `.branches`
rule**:

```
$ grep -nE 'tsbuildinfo|\.branches' .gitignore
$ echo $?
1
```

The nearest neighbours are `.turbo` at `:23` (the other build-tool artefact) and, at `:49-50`, the
*sibling* residue of the very same stray directory:

```
49:# Supabase CLI local state (rewritten on every CLI run — machine-local, never shared)
50:supabase/.temp/
```

So the repository already treated `supabase/.temp/` as machine-local CLI state while versioning
`supabase/.branches/_current_branch` — the asymmetry was the defect, not a judgement call.

### Why the class could reopen

`packages/shared-config/tsconfig.base.json:6` is `"composite": true` [verified, read this session],
so **every** workspace extending the shared config emits a `.tsbuildinfo`. Where it lands is decided
by `tsBuildInfoFile`. `packages/README.md:20` states the canonical rule verbatim:

> The `tsBuildInfoFile` is set to `./dist/tsconfig.tsbuildinfo` in `tsconfig.json` so the
> incremental-build artifact is also gitignored.

Eight `packages/*` workspaces follow it (`git grep -n tsBuildInfoFile -- '*tsconfig*.json'` →
`app-shared`, `argument-condensation`, `core`, `data`, `filters`, `llm`, `matching`,
`question-info`). The three offenders do **not** set it at all [verified, all three tsconfigs read
in full], so TypeScript writes the artefact beside the tsconfig at the workspace root, where no
rule caught it. Nothing stopped a fourth workspace from joining them.

**Verdict — BEFORE: DEFECT CONFIRMED, and wider than reported.** Four tracked paths, 581 KiB of
opaque compiler state, zero ignore rules, and a `composite: true` base guaranteeing the class stays
open.

---

## Row 4 — REVIEW-CFG-06 / **AFTER**

Landed as `133e35f79` *"chore(153-06): untrack four build artefacts and close the class globally"*.

### The index no longer holds any of them

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
$ test -z "$(git ls-files | grep -P 'tsbuildinfo|\.branches')" && echo "EMPTY (PASS)"
EMPTY (PASS)
```

The check treats grep's empty-set exit status as the PASS condition (`test -z "$(…)"`), not as a
command failure. **Discrimination proof:** the *identical* predicate run against `0955daec4`
reported `FAIL (correct: 4 paths still tracked)` and printed the four paths. Same expression, both
outcomes observed. Note also that `grep -E` has no `\b` support on this git/grep pairing — `-P` is
used throughout.

### The plan's predicate is too loose, and this row's own filing trips it

Re-run once the two deferred-item todos were committed, the plan's expression stops being empty:

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md
```

The match is a **filename**, not a build artefact. `tsbuildinfo|\.branches` is an unanchored
substring test over whole paths, so the very document filed to record the deferred prevention work
makes the check that the work is done report red. Anchoring to what the criterion actually forbids —
a file whose name *ends* in `.tsbuildinfo`, or any path inside a `.branches/` directory — separates
the two:

```
$ git ls-tree -r --name-only HEAD | grep -P '\.tsbuildinfo$|(^|/)\.branches/'
$ echo $?
1                       # empty set — PASS

$ git ls-tree -r --name-only 0955daec4 | grep -P '\.tsbuildinfo$|(^|/)\.branches/'
apps/docs/tsconfig.tsbuildinfo
apps/frontend/tsconfig.tsbuildinfo
packages/supabase-types/tsconfig.tsbuildinfo
supabase/.branches/_current_branch
$ echo $?
0                       # matched all four — correctly FAILS pre-change
```

Both halves observed with the *tightened* expression, so it discriminates exactly as well as the
loose one on the real defect while no longer being fooled by prose about the defect. **Anyone
re-verifying REVIEW-CFG-06 should use the anchored form**; the loose form is preserved above only
because it is what the plan specified and what the discrimination proof was originally run with.

### One commit, five entries, additions only

```
$ git show --stat --format='' HEAD
 .gitignore                                   | 7 +++++++
 apps/docs/tsconfig.tsbuildinfo               | 1 -
 apps/frontend/tsconfig.tsbuildinfo           | 1 -
 packages/supabase-types/tsconfig.tsbuildinfo | 1 -
 supabase/.branches/_current_branch           | 1 -
 5 files changed, 7 insertions(+), 4 deletions(-)

$ git diff HEAD~1 HEAD --numstat -- .gitignore
7	0	.gitignore
```

Seven added lines, **zero** removed — the two rules only *widen* exclusion, and nothing below the
`# ── GSD baseline (auto-generated) ──` header (now `:62`) was touched. `*.tsbuildinfo` sits at
`:29`, beside the `.turbo` block; `supabase/.branches/` at `:56`, under the existing
`supabase/.temp/` section header. Both are above `:62`.

### `git check-ignore -v` — exactly one rule per path

```
$ for p in apps/docs/tsconfig.tsbuildinfo apps/frontend/tsconfig.tsbuildinfo \
           packages/supabase-types/tsconfig.tsbuildinfo supabase/.branches/_current_branch; do
    git check-ignore -v "$p"
  done
.gitignore:29:*.tsbuildinfo         apps/docs/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo         apps/frontend/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo         packages/supabase-types/tsconfig.tsbuildinfo
.gitignore:56:supabase/.branches/   supabase/.branches/_current_branch
```

One line each (`git check-ignore -v <path> | wc -l` = 1 for all four). **No double-reporting and no
un-ignoring** of an artefact already covered elsewhere:

```
$ git check-ignore -v packages/core/dist/tsconfig.tsbuildinfo
packages/core/.gitignore:2:dist/    packages/core/dist/tsconfig.tsbuildinfo
```

The eight `packages/*/dist/tsconfig.tsbuildinfo` files still resolve to their pre-existing `dist/`
rule, exactly as before the change. **Negative control on the rule set:**
`git check-ignore -v --no-index packages/core/src/index.ts` exits non-zero — the new rules do not
sweep in source.

### The rules were also checked index-blind, which caught a mechanism worth recording

Run *before* the removal, with the rules already in `.gitignore`, `git check-ignore -v` reported
**not-ignored** for all four paths. That is not a rule failure: `git check-ignore` consults the
index and declines to report a *tracked* path as ignored. `--no-index` proves the rules themselves
match:

```
$ git check-ignore -v --no-index apps/frontend/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo	apps/frontend/tsconfig.tsbuildinfo
```

Consequence worth stating plainly: **a green `git check-ignore` on these paths is only reachable
after the untracking.** The check cannot be satisfied by the `.gitignore` edit alone, which makes
it a real gate on this criterion rather than a restatement of the edit.

### The rules bind against artefacts written *after* the change

An ignore rule never tested against a freshly written file is a rule nobody has checked. The three
`.tsbuildinfo` files were deleted from disk and regenerated from scratch. Fresh md5s, all different
from the tracked blobs, confirming these are new files and not restored copies:

| Path | tracked blob (md5) | regenerated (md5) | new size |
|---|---|---|---|
| `apps/docs/tsconfig.tsbuildinfo` | `0e02e0eb…` | `43deefec…` | 112 340 B |
| `apps/frontend/tsconfig.tsbuildinfo` | `5c00372c…` | `969ebe4f…` | 450 367 B |
| `packages/supabase-types/tsconfig.tsbuildinfo` | `035c1c0b…` | `7e1e92e0…` | 35 032 B |

```
$ test -z "$(git ls-files | grep -P 'tsbuildinfo|\.branches')" && echo EMPTY
EMPTY
$ git status --porcelain -- apps/docs/tsconfig.tsbuildinfo apps/frontend/tsconfig.tsbuildinfo \
      packages/supabase-types/tsconfig.tsbuildinfo supabase/.branches/_current_branch
$                       # empty — regenerated and invisible to git
```

All four files remain **on disk**; only their tracking was removed.

For the fourth path, the Supabase CLI was not run (Docker start is disproportionate, and the file
is 4 bytes of CLI state). Its contents were rewritten by hand and restored:

```
$ printf 'scratch-153-06' > supabase/.branches/_current_branch   # 14 bytes
$ git status --porcelain -- supabase/.branches/_current_branch
$                       # empty
$ printf 'main' > supabase/.branches/_current_branch             # restored, 4 bytes
```

### Non-vacuity of the scoped status gate

The scoped `git status --porcelain` above is empty for the four paths. That is only evidence if the
same expression can be made non-empty:

```
$ printf 'x' > supabase/.branches/zz-flip-probe.txt
$ git status --porcelain -- supabase/.branches/zz-flip-probe.txt
$                       # empty — inside the newly ignored directory, as designed

$ printf 'x' > supabase/zz-flip-probe.txt
$ git status --porcelain -- supabase/zz-flip-probe.txt
?? supabase/zz-flip-probe.txt          # NON-EMPTY — the gate does report unignored files
```

Both probes removed afterwards; `git status --porcelain -- supabase/` is empty again. The gate
discriminates.

### Falsified premise: `yarn build && yarn typecheck` does **not** regenerate these artefacts

The plan's Task 2 and `153-RESEARCH.md` § E.4 both assume the repo's own pipeline rewrites the three
files. It does not. With all three deleted:

```
### yarn build
 Tasks:    14 successful, 14 total
Cached:    0 cached, 14 total
BUILD_EXIT=0
### yarn typecheck
 Tasks:    22 successful, 22 total
Cached:   10 cached, 22 total
TYPECHECK_EXIT=0

$ for p in apps/docs/… apps/frontend/… packages/supabase-types/…; do test -f "$p"; done
NOT REGENERATED apps/docs/tsconfig.tsbuildinfo
NOT REGENERATED apps/frontend/tsconfig.tsbuildinfo
NOT REGENERATED packages/supabase-types/tsconfig.tsbuildinfo
```

Both commands fully green (14/14 and 22/22, matching the phase baseline) with all three artefacts
**absent**. The reason is in the scripts, not in turbo caching:

| Workspace | `build` | `typecheck` |
|---|---|---|
| `apps/docs` | `vite build` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| `apps/frontend` | `svelte-kit sync && vite build && …` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| `packages/supabase-types` | `echo 'Raw .ts source — no build step needed'` | *(no `typecheck` script at all)* |

No repo script invokes `tsc -b` or `tsc -p` for any of the three. `svelte-check` runs the compiler
API, not `tsc`, and writes no `.tsbuildinfo`. **These artefacts were never produced by the repo's
pipeline** — they came from an ad-hoc `tsc` invocation or an IDE and were swept into the three bulk
commits of 2026-08-17. That strengthens the criterion rather than weakening it: the files are not
merely redundant in the index, they are not reproducible from the project's own commands.

Regeneration was therefore performed with the tool that actually writes them:

```
$ node_modules/.bin/tsc -p packages/supabase-types/tsconfig.json          # noEmit:true in its config
$ node_modules/.bin/tsc -p apps/docs/tsconfig.json --noEmit               # EXIT=0
$ node_modules/.bin/tsc -p apps/frontend/tsconfig.json --noEmit           # EXIT=2, 61 TS errors
```

`git status --porcelain -- apps packages scripts tests supabase .gitignore` was empty before and
after all three runs: **no stray emission**. The `apps/frontend` non-zero exit is an artefact of
driving raw `tsc` at a SvelteKit project whose real typecheck is `svelte-check` (raw `tsc` cannot
resolve `.svelte` imports, hence 61 `TS7031`-family errors). It is not a regression and not
introduced here — `yarn typecheck` is 22/22 green. `tsc` writes the `.tsbuildinfo` regardless of
exit status, which is what the proof needed.

### Baseline

`yarn build` 14/14 and `yarn typecheck` 22/22, both matching the phase baseline, run with the
artefacts deleted. Deleting and regenerating the incremental state broke nothing. No E2E run was
performed: the only working-tree file this plan changed is `.gitignore`, which no build step, no
test, and no runtime path reads — the diff cannot reach the served application.

**Verdict — AFTER: CRITERION MET.** All four measured paths are out of version control, all four
remain on disk, the class is closed globally by a single rule that provably binds against freshly
written artefacts, the pre-existing `dist/` coverage is undisturbed, and every claim about the
shared index is scoped to five named paths and shown to discriminate.

---

## Deliberately not done, and filed

Per D-B2 and D-N2, two adjacent questions were left open rather than answered inside this criterion:

- The stray top-level `supabase/` directory **survives** — B2 option (c) was considered and not
  chosen. Only the tracked file under it was untracked.
  → `.planning/todos/pending/2026-08-28-153-stray-top-level-supabase-directory.md`
- Setting `tsBuildInfoFile` into the three offenders' ignored output directories — *prevention*
  rather than ignoring — is beyond REVIEW-CFG-06's wording.
  → `.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md`

---

## Row 5 — REVIEW-CFG-05

### Environment as recorded by `153-08` (fragment: `153-NC-ROW-5-CFG-05.md`)

```
date (UTC):        2026-08-29T18:24:49Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          c1f43b30dcb2836beadaa14c63e5ccb5f6907d37  (the ship-review-stack freshness commit)
git branch:        integration/ship-12-squash
OS:                macOS 26.5.1 arm64 (Darwin)
Node:              v24.14.1
Yarn:              4.13.0
Docker:            29.7.2 (daemon up -- see the correction in Part 3)
host bash:         GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
container bash:    GNU bash, version 5.2.37(1)-release (aarch64-alpine-linux-musl)
                   GNU bash, version 5.2.15(1)-release (aarch64-unknown-linux-gnu)
CI runner bash:    bash 5.2 (ubuntu-latest / Ubuntu 24.04)
```

> **Why the bare `git status` is not the gate here.** The tree carries other in-flight Phase 153
> work and `.planning/STATE.md` is written by the orchestrator throughout a run, so the bare form is
> never empty mid-phase. Every tree claim below is **scoped** (`git status --porcelain -- .claude`,
> `git diff --numstat <path>`), and each names its path.

---


### 1. The refutation: the script is not inert

The briefing this phase was planned from treats criterion 5 as *"evidence of the run, not a code
change"* — i.e. as though the script were a formality. It is not. Measured at HEAD `d7edc3da2`, the
per-skill `targets:` frontmatter is:

| Skill | `targets:` | Audited? |
|---|---|---|
| `architect` | `[]` (inline empty) | no — SKIP |
| `components` | `[]` (inline empty) | no — SKIP |
| `data` | `packages/data/src/` | **yes** |
| `database` | `apps/supabase/`, `packages/supabase-types/` | **yes** |
| `filters` | `packages/filters/src/` | **yes** |
| `matching` | `packages/matching/src/` | **yes** |
| `ship-review-stack` | `.agents`, `.claude/scripts`, `.planning/phases/151-ship-v0-2-akita-review-stack/scripts` | **yes** |
| `spike-findings-voting-advice-application-gsd` | key absent | no — SKIP |

**Two empty, one absent, five real, all five pointing at directories that exist.** The script exits
**1** on this tree. Criterion 5 was unfixed work, not a free observation. This is a correction to the
briefing, recorded so a later reader does not re-derive the false premise.

### 1b. A second correction: **four** live drifts, not two

This plan's own `must_haves.truths` says the script *"exits 1 on this tree today with DRIFT for
`data` and `database`"*. **That undercounts.** Measured independently by the orchestrator and
re-measured here, `filters` and `matching` are also drifting:

| Skill | Drift at `d7edc3da2` |
|---|---|
| `data` | 5 commits, 13 files since 2026-08-17 |
| `database` | 21 commits, 69 files since 2026-08-17 |
| `filters` | 2 commits, 1 file since 2026-08-17 |
| `matching` | 1 commit, 3 files since 2026-08-17 |

`Checked: 5 · Drifted: 4 · Skipped: 3`, true exit **1**. `filters` and `matching` are outside this
plan's `files_modified` and cannot be resolved inside it. Operator ruling **D9** therefore
**replaces** this plan's `exit 0` must-have with: *the audit exits 1 with exactly `filters` and
`matching` remaining, both attributed and filed for Phase 160.* Part 4 records that outcome and Part
4b the attribution.

**Also corrected by D9:** this plan's framing that *"153-07's edit to `packages/supabase-types/`
re-reddens `database`"*. `database` was **already** drifting on 21 commits / 69 files, of which
`apps/supabase/` alone is 18 / 66. The ordering constraint stands; the causal claim does not.

### 2. Two failures, and they are not the same failure

**(a) The local failure — the script runs and reports.** At `d7edc3da2`, under the host's bash
3.2.57, verbatim:

```

Skill Drift Audit
=================

  architect       SKIP  (no targets defined)
  components      SKIP  (no targets defined)
  data            DRIFT  5 commits, 13 files since 2026-08-17
    packages/data/src/  (5 commits, 13 files changed)
  database        DRIFT  21 commits, 69 files since 2026-08-17
    apps/supabase/  (18 commits, 66 files changed)
    packages/supabase-types/  (3 commits, 3 files changed)
  filters         DRIFT  2 commits, 1 files since 2026-08-17
    packages/filters/src/  (2 commits, 1 files changed)
  matching        DRIFT  1 commits, 3 files since 2026-08-17
    packages/matching/src/  (1 commits, 3 files changed)
  ship-review-stack  OK    (synced as of 2026-08-28)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

---
Checked: 5  Drifted: 4  Skipped: 3

Drifted skills may contain outdated information.
Review target changes and update skill files as needed.
```

Exit **1** — eight per-skill lines and a trailer. The script did its job and found real drift.

**(b) The CI failure — the script never ran.** Run **`32058994754`** (PR #860 `feat-gsd-roadmap` →
`main`, 2026-08-17) is the **only** workflow run in which the `skill-drift-check` job has ever
existed. It concluded `failure`. Its log at the point of failure, verbatim:

```
##[group]Run .claude/scripts/audit-skill-drift.sh
.claude/scripts/audit-skill-drift.sh
shell: /usr/bin/bash -e {0}
##[endgroup]

Skill Drift Audit
=================

##[error]Process completed with exit code 1.
```

Banner, blank line, nothing. **No per-skill line, no trailer.** The skills existed on that branch
(all eight directories plus `BOUNDARIES.md`), so the loop ran with real input and died inside
`audit_skill()` before its first `printf`.

**These are different failures and must not be conflated.** (a) is the gate working. (b) is the gate
being unable to start. Reading (b) as "the audit found drift in CI" is the misreading this section
exists to prevent.

### 3. The measured root cause

Quoted from `153-BASH5-REPRODUCTION.md` rather than re-derived. Verdict: **CONFIRMED**.

`((VAR++))` is a post-increment: it evaluates to the counter's *old* value, and bash's arithmetic
command returns exit status **1** when the expression evaluates to 0. With `SKIPPED=0` — the state on
the very first skill audited, `architect`, whose `targets: []` takes the `:52-56` branch —
`((SKIPPED++))` returns 1. Under `set -euo pipefail` (`:6`), with the function as the **last** operand
of the AND-list at `:122` (`[[ -d "$skill_dir" ]] && audit_skill "$skill_dir"`) — the one position
`set -e`'s AND-OR exemption does not cover — that kills the script before its `printf`.

Measured, not inferred:

| Shell | Minimal reproduction | Whole real script, real git |
|---|---|---|
| `GNU bash, version 3.2.57(1)-release` (host) | prints, exits **0** | eight per-skill lines + trailer, exit 1 on real drift |
| `GNU bash, version 5.2.15(1)-release` (glibc) | **aborts**, exits **1** | — |
| `GNU bash, version 5.2.37(1)-release` (musl) | **aborts**, exits **1** | **banner, then nothing, exit 1** |

The bash-5 whole-script output matches the CI log line for line. RESEARCH assumption **A1** — *"the
bash-5 reproduction is unmeasured … Treat the mechanism as a strong, log-consistent hypothesis"* — is
now closed by execution, in line with this project's standing rule that an agent root-cause diagnosis
is flagged UNCONFIRMED and re-tested in isolation before acceptance.

**Site-count correction: four, not three.** RESEARCH § G.3 and OQ-1 both name three sites (`:53`,
`:58`, `:100`). Measured: `grep -n '((.*++))'` returns `:53`, `:58`, `:66`, `:100` — **four**. The
omitted one is the second `((SKIPPED++))` at `:66`, in the *skill-exists-but-has-no-commit-yet*
branch. This plan asserted the correction at planning time and it is **verified exactly as written**:
four sites, those four line numbers, no fifth. (`:89` and `:90` are `$((…))` arithmetic *expansions*,
not arithmetic commands; they are not defects and were not touched.)

**A measurement hazard recorded twice this session.** `audit-skill-drift.sh | tail; echo $?` prints
`0` — that is **`tail`'s** status, not the script's; the true exit is 1. The same class produced a
false `DOCKER DOWN` reading during Task 1, from a `timeout 20 docker info && … || …` whose left
operand failed because this shell has no `timeout` binary. Both are gates that examined nothing and
reported an answer anyway.

### 4. The resolution

**The fix** (commit `7d6aaac47`): all four post-increment sites converted to pre-increment, which
returns the *new* value and so can never be 0 for a counter being incremented.
`git diff --numstat` reports exactly **4 added / 4 removed**; the file stays 135 lines; `set -euo
pipefail` at `:6` and the tail's `exit 1` are untouched; no `targets:` parsing, drift-detection or
exit logic changed; no suppression flag or environment variable added.

**The drift resolution** (commits `20e61fa40`, then `c1f43b30d`): each drifting commit was read
against the skill's claims before the skill file was touched.

- **`database` had a genuinely stale claim and it is corrected, not annotated.** Service Patterns § 6
  asserted that `identity-callback` binds audience and issuer *"each only when configured"* and that a
  deployment configuring neither *"keeps its behaviour instead of failing closed on upgrade"*. Commit
  `869a01d60` (155-01, REVIEW-EDGE-05, operator decision O1) made both bindings **unconditional** and
  deleted the in-source comment making exactly that argument. Rewritten, plus new §§ 7–9 covering the
  Phase 155 surface the skill had no account of. Its pgTAP counts were also corrected (11 files / 264
  planned assertions / ~3,425 lines, versus the claimed "10 test files … 204 tests … ~2,870 lines"),
  and attributed honestly: re-measured **at the skill's own baseline `14afb2d80`** it was already
  11/264 there, so that was a pre-existing inaccuracy rather than something the drift introduced.
- **`data` was reviewed and needed no correction.** Measured: `git diff -w <baseline>..HEAD --
  packages/data/src/`, comments and blanks filtered out, yields **28** changed lines, **every one
  inside a `*.test.ts` file**. No production source line changed semantically. Recorded as a reviewed
  no-change, with the evidence, rather than as a content-free touch.
- **`ship-review-stack`** was reddened by this plan's own `7d6aaac47`, and its record is committed
  **strictly later** (`git merge-base --is-ancestor 7d6aaac47 c1f43b30d` → true). The record is
  additive: two earned shell-portability conventions (never `((VAR++))` under `set -e`; never read a
  script's exit status through a pipe).

**The post-fix run, at HEAD `c1f43b30d`, verbatim, exit captured directly rather than through a
pipe:**

```

Skill Drift Audit
=================

  architect       SKIP  (no targets defined)
  components      SKIP  (no targets defined)
  data            OK    (synced as of 2026-08-29)
  database        OK    (synced as of 2026-08-29)
  filters         DRIFT  2 commits, 1 files since 2026-08-17
    packages/filters/src/  (2 commits, 1 files changed)
  matching        DRIFT  1 commits, 3 files since 2026-08-17
    packages/matching/src/  (1 commits, 3 files changed)
  ship-review-stack  OK    (synced as of 2026-08-29)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

---
Checked: 5  Drifted: 2  Skipped: 3

Drifted skills may contain outdated information.
Review target changes and update skill files as needed.
```

`TRUE_EXIT=1`. **This is the D9 acceptance, not a shortfall:** the script now *runs to completion*
under bash 5 — the thing the CI run could not do — and exits 1 with **exactly** `filters` and
`matching` remaining, both outside this plan's scope.

**Nothing was weakened, asserted rather than promised.** All eight `targets:` blocks are byte-identical
to their pre-task values (asserted per skill against `git show HEAD:<path>`, and the assertion
flip-tested: a copy with `packages/data/src/` narrowed to `packages/data/src/objects/` turns the gate
red). The empty-`targets:` count is still **2**. `ls .claude/skills/` still lists the same eight
directories plus `BOUNDARIES.md`. The tail's `exit 1` is still present. No suppression flag or
environment variable exists.

### 4b. `filters` and `matching` — attributed, and handed to Phase 160

Per D9, **Phase 160 (`agent-docs-skills-refresh`, wave H) owns these two.** Measured attribution:

| Skill | Drifting commits | Files | Non-comment changed lines |
|---|---|---|---|
| `filters` | `dce80642f` (152-14, unwrap forced line breaks), `87e02f40b` (152-09, comment sweep) | `packages/filters/src/filter/enumerated/enumeratedFilter.ts` | **0** |
| `matching` | `dce80642f` (152-14) | `packages/matching/src/{distance/metric.ts,index.ts,question/categoricalQuestion.ts}` | **0** |

Both drifts originate entirely in **Phase 152's sweeps**, not in anything Phase 153 did, and both are
**zero non-comment changed lines** — comments and line-wrapping only
(`git diff -w <baseline>..HEAD -- <target>` with comment and blank lines filtered). That is an
attribution and a first-pass reading, **not** a freshness review: whether the skills' *content* is
still true is Phase 160's call, and this document does not pre-empt it.

Filed: `.planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md`.

### 5. What is NOT observed

**No workflow run has been observed. The step has not been observed running green on a real
workflow run, and this document does not claim that it has.** Criterion 5's own words are *"observed running green against
its script on a real workflow run"*, and that clause is **unmet**. REVIEW-CFG-05 stays **Pending**.
Two distinct reasons, both stated plainly:

1. **No run.** The only run that ever contained the job is `32058994754`, and it failed, in the mode
   Part 2(b) quotes. Nothing has run it since.
2. **Not green.** Even locally, the script exits 1 at this HEAD, by design and by D9 — `filters` and
   `matching` are Phase 160's. So "green" is not claimable on either half today.

**Why no run can be produced from here — the trigger analysis, measured not assumed:**

- `.github/workflows/main.yaml` declares exactly two triggers: `push` to `main`, and `pull_request`
  (`opened`/`synchronize`/`reopened`/`ready_for_review`) with `branches: [main]`. `grep -c
  workflow_dispatch` returns **0**, and adding one is out of scope here (assigned to `163-01` per
  ruling D3).
- The working branch is `integration/ship-12-squash`, **235 commits ahead of `origin/main`**
  (`git rev-list --count origin/main..HEAD` at `c1f43b30d`; the figure is quoted as 222 in the
  sibling CFG-02 filing and 224 in this plan's briefing — both were true when taken, and this is the
  current one).
- The job is called at **`.github/workflows/main.yaml:34`** (`run: .claude/scripts/audit-skill-drift.sh`).
- Of PRs #863–#874, only **#863** targets `main` — as the plan states, and verified. **But the plan's
  implication that a PR onto `main` is unavailable is weaker than stated:** measured via `gh pr list`,
  **#860, #861, #862 and #863 are all open against `main`**, and #875 is merged to `main`.

**Two further facts that make the discharge condition sharper than "the next PR onto `main`":**

- **`origin/main` does not carry the job at all.** `git show origin/main:.github/workflows/main.yaml`
  contains no `skill-drift-check`. A push to `main` therefore would not run it either — which is why
  runs `33043573890` and `32112367906` (both `main` pushes) contain no such job.
- **PR #860 carries the job but also the *unfixed* script.** `git show
  origin/feat-gsd-roadmap:.claude/scripts/audit-skill-drift.sh | grep -c '((.*++))'` returns **4**.
  Re-triggering #860 today would reproduce the same abort. The observation requires a branch carrying
  **both** the job **and** commit `7d6aaac47`.

Filed with its discharge condition:
`.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md`.

### 6. The green is a snapshot at a named HEAD, not a standing property

The audit's baseline for a skill is *the last commit touching that skill's own directory*, so **any**
later commit under a declared target directory reddens it again until a human re-reviews.

- The state in Part 4 is a snapshot at **`c1f43b30d`** on `integration/ship-12-squash`. It is not a
  property of the repository.
- **This phase's own two edits would have reddened it had the commit ordering been different.**
  `7d6aaac47` (`.claude/scripts/`) reddened `ship-review-stack`, and the audit was observed reporting
  `ship-review-stack DRIFT 1 commits, 1 files` between `20e61fa40` and `c1f43b30d`. The ordering is
  mechanical.
- **Phases 152, 163 and 164 all touch declared target directories** — per this plan's own concurrency
  note, 152 renames a fixture under `packages/data/src/` and sweeps comments across `apps/**`, and 163
  and 164 work in `apps/supabase/`. Any of those reddens `data` or `database` again. (Inherited from
  the plan and not re-verified here — those phases are outside this plan's reach; what *is* verified
  is the rest of Phase 153, next bullet.)
- **Verified for the rest of Phase 153:** none of the remaining plans touches a declared target.
  `153-09` writes only `153-NEGATIVE-CONTROL.md`; `153-10` touches `scripts/`, `package.json`,
  `.env.example`, `packages/dev-seed/tests/` and a phase doc; `153-11` touches
  `.planning/phases/152-…/scripts/` (phase **152**, not the phase-**151** path in
  `ship-review-stack`'s targets), `scripts/assert-comment-hygiene.mjs`,
  `apps/frontend/src/app.css`, `.planning/WINDOWS.md` and `.planning/REQUIREMENTS.md`. None is a
  declared target, so the snapshot holds to the phase's close.

Whether a permanently-blocking gate with that trigger sensitivity is the intent at all is a design
question this plan surfaces rather than answers:
`.planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md`.

---

## Row 6 — REVIEW-CFG-02

### Environment as recorded by `153-03` (fragment: `153-NC-ROW-6-CFG-02.md`)

```
date (UTC):          2026-08-29T17:18:35Z
repo root:           /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:            2a31145057b7529056db6b302f6e0c8b9cfd4652  (the 153-03 Task 2 commit)
git branch:          integration/ship-12-squash
commits ahead of origin/main: 222   (measured `git rev-list --count origin/main..HEAD`; the plan's
                                     "140+" is a lower bound and still holds)
git status:          scoped `-- .github/workflows/main.yaml` and
                     `-- scripts/assert-node-engine.mjs` → empty before and after every run below
OS:                  macOS 26.5.1 / Darwin 25.5.0 arm64
Node (session):      v24.14.1
Yarn:                4.13.0
local bash:          GNU bash 3.2.57(1)-release (arm64-apple-darwin25)
js-yaml:             node_modules/js-yaml  (the parser that extracted the step bodies)

runtimes the flip matrix used, via `nvm exec --silent`:
  v20.18.1   OUT of range for the declared ">=22"   (rows 1, 2, 4, 5)
  v22.4.0    in range                               (row 6)
  v24.14.1   in range                               (rows 2, 3)
nvm also carries v18.20.4 (out of range) and v24.12.0 / v25.2.1 (in range); unused here.
```

> **Why the bare `git status` is not the gate.** `.planning/milestone.lock` carries a live pid
> heartbeat and is rewritten continuously by the orchestrator, and `.planning/STATE.md` is
> operator-owned and edited concurrently, so the bare form is never empty during a run. The gates
> that carry the claims here are the **scoped** forms
> `git status --porcelain -- .github/workflows/main.yaml` and
> `git status --porcelain -- scripts/assert-node-engine.mjs` — the only two paths this row injects
> into. Every injection below was reverted by a targeted
> `git checkout -- .github/workflows/main.yaml` against the already-committed Task 1 state, or (row
> 5) by renaming the guard file back from the temp directory it was moved to. No `git stash`, no
> `git clean`, no `git checkout .`, no unscoped reset was run at any point.

---


### Part 1 — already discharged by `153-02`, and NOT re-claimed here

**This row makes no new claim about whether the constraint binds.** REVIEW-CFG-02's word *binds*
was satisfied, and OBSERVED to be satisfied, by plan `153-02`; REVIEW-CFG-02 is already marked
`Complete` in `.planning/REQUIREMENTS.md`. Everything in Parts 2–4 adds a standing guard against
that observation ROTTING later. Reading this row as a first proof of binding would turn a
re-verification into a false first proof — the precise class of record this phase exists to
eliminate.

The observation, quoted from `153-02-SUMMARY.md` § "Criterion 2 'binds' — observed, both halves,
against real runtimes", not re-derived here. `153-02` expected this to be unprovable locally
(*"the observation becomes possible only in CI"*) and falsified its own premise: `nvm` on this
machine carries genuinely out-of-range runtimes, so the observation was made directly.

**Rejecting half** — `yarn install` under Node **v20.18.1**:

```
➤ YN0007: │ root-workspace-0b6124@workspace:. must be built because it never has been before or the last one failed
➤ YN0009: │ root-workspace-0b6124@workspace:. couldn't be built successfully (exit code 1, …)
➤ YN0000: · Failed with errors in 3s 059ms
EXIT=1
```

and the build log it points at:

```
# This file contains the result of Yarn building a package (root-workspace-0b6124@workspace:.)
# Script name: preinstall

assert-node-engine: this Node is v20.18.1, and the root manifest declares "engines.node": ">=22". Switch to a Node satisfying that range, or change the declared range deliberately.
```

**Accepting half** — `yarn install` under Node **v24.14.1**: `Done with warnings in 1s 989ms`,
`EXIT=0`, with no working-tree or lockfile change.

**The guard alone, across five real runtimes straddling the boundary** (`153-02`'s table, quoted):

| Node | exit | output |
|---|---|---|
| v18.20.4 | **1** | `this Node is v18.20.4, and the root manifest declares "engines.node": ">=22". …` |
| v20.18.1 | **1** | `this Node is v20.18.1, and the root manifest declares "engines.node": ">=22". …` |
| v22.4.0 | 0 | `v22.4.0 satisfies "engines.node": ">=22" — OK` |
| v24.14.1 | 0 | `v24.14.1 satisfies "engines.node": ">=22" — OK` |
| v25.2.1 | 0 | `v25.2.1 satisfies "engines.node": ">=22" — OK` |

`153-02` additionally recorded the guard red on the REAL defect before the rename (`the root
manifest declares no "engines" key … An "engine" key IS present`), which is the strongest available
evidence that it examines something rather than reporting a constant.

**So what, exactly, is left for this row to add?** The guard's accepting half is exercised
constantly — every install and every `lint:check` on a supported Node runs through it. Its
rejecting half is exercised by NOBODY, because nobody develops on an unsupported Node. A half that
nothing exercises can rot in silence: break the comparator, or make the guard return early, and
every green run stays green, forever, with no signal. Part 3 is a standing exercise of that half.

### Part 2 — the scope that was dropped, and why

The version of `153-03-PLAN.md` that stood until `d7338722f` was written to replace the four
`node-version: 22.22.1` inputs in `.github/workflows/main.yaml` with
`node-version-file: package.json`, and to build the negative control around `actions/setup-node`'s
response to a corrupted manifest. **That scope is gone, for two independent reasons, and neither is
a matter of taste.**

**(a) The operator ruled against it.** O5 selected option (b) of OQ-2 — install-time binding via a
repository-owned script — and REVERSED D-B5. O5's own contingency text for (b): *"drop 153-03's
`node-version-file` edit to `main.yaml`"*. `153-02` shipped that script as
`scripts/assert-node-engine.mjs`, wired to `preinstall` and as the tenth link of the `lint:check`
chain.

**(b) It was measured not to work anyway.** `153-A3-SETUP-NODE-MEASUREMENT.md` § 5 read the action
at the exact commit the workflow pins (`refs/tags/v4` → `49933ea5`), in both `src/` and the compiled
`dist/setup/index.js`. Its verdict table, quoted verbatim:

| # | Input case (root `package.json`, with `node-version-file: package.json` and **no** `node-version`) | Resolved value | Verdict |
|---|---|---|---|
| i | valid `engines.node` (`">=22"`) | `">=22"` returned by `util.ts:30` | **WARNS** — no warning is emitted in this case at all; the step succeeds and installs a Node satisfying the range. Recorded as WARNS in the sense that *nothing fails*; see the range caveat below. |
| ii | no `engines` key at all | `null` (`util.ts:53`) → `core.warning('Could not determine node version from …. Falling back')` (`main.ts:110-112`) | **WARNS** |
| iii | `engines` misspelled `engine` (today's state) | `null` — `manifest.engines?.node` is `undefined`, exactly as in case ii | **WARNS** |

and its decisive consequence, also verbatim:

> **A3 is falsified.** `actions/setup-node@v4` does **not** hard-fail when `engines.node` is absent or
> misspelled. It emits a warning annotation and installs nothing, leaving the runner's default Node in
> place. Therefore **option (a) of OQ-2 — `node-version-file: package.json` — does not catch a
> re-misspelling.**

**And the trap that makes the substitution actively harmful**, quoted from the same document's
"Two further measured corrections to the plan's premises":

> 2. **`engines.node` is a *range*, and setup-node resolves ranges to "latest matching".** The declared
>    value is `">=22"`, not a pin. Replacing `node-version: 22.22.1` with `node-version-file:
>    package.json` would therefore **unpin CI from 22.22.1 to whatever the newest `>=22` release is on
>    the day the job runs**. `resolveVersionInput` returns the raw range string and hands it to the
>    distribution resolver as `versionSpec`. This is a behavioural change to every CI job, not a
>    like-for-like substitution, and it is not mentioned anywhere in RESEARCH § B.3 option 1.

**The four pins were therefore deliberately left alone.** `git diff` over Task 1 reads
`86 0 .github/workflows/main.yaml` — 86 added lines, ZERO deleted — and a parser-level check
confirms that `frontend-and-shared-module-validation`, `dev-seed-integration`, `e2e-tests` and
`e2e-visual` each still declare `node-version: 22.22.1` with `cache: "yarn"` and no version-file
input:

```
$ node -e "…js-yaml… assert last job key, 7 jobs, four pins unchanged, no node-version-file…"
main.yaml job ok
exit=0
```

And a **standing** spec now asserts the input's continued absence, so the trap cannot be walked into
silently by a later reader who sees a duplicated literal and tidies it up. Test 6 of
`packages/dev-seed/tests/nodeEngineGate.test.ts`, flip-tested red in Part 3.

### Part 3 — what this plan adds, and the flip matrix that proves it

**The job.** `.github/workflows/main.yaml` gains one job, `node-engine-range-negative-control`,
appended as the LAST top-level key under `jobs:` after `e2e-visual` (the most merge-tolerant edit
available, given Phase 163 appends three more jobs to the same file). It checks out the repository,
sets up a deliberately out-of-range `20.x`, asserts the guard REJECTS; sets up the in-range
`22.22.1`, asserts the guard ACCEPTS; and finally runs the guard's own `--self-test`, whose 23
comparator cases (nine of them negative) run NOWHERE automatically today.

**Two design points carry the row's weight.**

1. **It asserts the failure MESSAGE, not the exit status.** `assert-node-engine` exits 1 for four
   reasons that have nothing to do with the running Node's version — an unreadable manifest, a
   missing `engines` key, an empty `engines.node`, and a range outside its accepted grammar. An
   exit-code-only assertion is satisfied by all four, so it would report green while the guard had
   stopped comparing versions at all. The discriminator asserted is the guard's own
   `assert-node-engine: this Node is ` prefix, which no other failure path emits.
2. **It invokes the guard BY PATH.** Deleting or renaming `scripts/assert-node-engine.mjs` reddens
   the job rather than quietly removing a check. Row 5 below is the observation of that, not the
   assertion of it.

**How the local proof was obtained, and why that matters.** No CI run is reachable from this branch
(Part 4), so the job's correctness had to be established here or not at all. The step bodies were
**extracted from the committed YAML by `js-yaml`**, written to files under a `mktemp -d`, and
executed with `bash -e` under `nvm exec` — never retyped. That is what makes this a proof about the
shipped file rather than about a hand-copied equivalent of it; the extractor asserts it found
exactly three `run:` steps and fails by name otherwise. `bash -e` is the abort-at-first-failure
semantics GitHub's default shell applies, which is why the `OUTPUT="$(cmd)" || STATUS=$?` idiom in
the steps is load-bearing rather than stylistic.

```
$ T=$(mktemp -d) && node -e "const fs=require('fs'),y=require('js-yaml');
    const j=y.load(fs.readFileSync('.github/workflows/main.yaml','utf8'))
             .jobs['node-engine-range-negative-control'];
    const r=j.steps.filter((s)=>typeof s.run==='string').map((s)=>s.run);
    if(r.length!==3){console.error('expected 3 run steps, got '+r.length);process.exit(1);}
    r.forEach((x,i)=>fs.writeFileSync(process.argv[1]+'/step-'+(i+1)+'.sh',x));" "$T"
extracted 3 run steps
```

#### The flip matrix — six rows, each a claim that can be made red

**Row 1 — step 1 (the rejecting assertion) under OUT-of-range v20.18.1. Required: exit 0.**

```
$ nvm exec --silent 20.18.1 bash -e "$T/step-1.sh"
rejected as required under v20.18.1: assert-node-engine: this Node is v20.18.1, and the root manifest declares "engines.node": ">=22". Switch to a Node satisfying that range, or change the declared range deliberately.
EXIT=0
```

**Row 2 — step 1 under IN-range v24.14.1. Required: exit 1.** This is the row that proves the
negative control is not vacuous: it detects a guard that has stopped rejecting.

```
$ nvm exec --silent 24.14.1 bash -e "$T/step-1.sh"
::error::assert-node-engine exited 0 under v24.14.1, which the declared engines.node range does not admit. The rejecting half of the Node constraint has stopped binding.
EXIT=1
```

**Row 3 — step 2 (the accepting assertion) under IN-range v24.14.1. Required: exit 0.**

```
$ nvm exec --silent 24.14.1 bash -e "$T/step-2.sh"
accepted as required under v24.14.1: assert-node-engine: v24.14.1 satisfies "engines.node": ">=22" — OK
EXIT=0
```

**Row 4 — step 2 under OUT-of-range v20.18.1. Required: exit 1.** Proves the positive half is not
vacuous either.

```
$ nvm exec --silent 20.18.1 bash -e "$T/step-2.sh"
::error::assert-node-engine exited 1 under v20.18.1, which the declared engines.node range does admit. It reported: assert-node-engine: this Node is v20.18.1, and the root manifest declares "engines.node": ">=22". Switch to a Node satisfying that range, or change the declared range deliberately.
EXIT=1
```

**Row 5 — step 1 under v20.18.1 with the guard file MOVED ASIDE. Required: exit 1, down the "not
for the version reason" branch.** This is the row that proves the job exercises the repository's
guard rather than a stand-in: a missing module exits non-zero without emitting the guard's own
message, and the job says so instead of scoring it as a successful rejection.

```
$ mv scripts/assert-node-engine.mjs "$T/assert-node-engine.mjs.aside"
$ ls scripts/assert-node-engine.mjs
ls: scripts/assert-node-engine.mjs: No such file or directory
$ nvm exec --silent 20.18.1 bash -e "$T/step-1.sh"
::error::assert-node-engine exited 1 under v20.18.1, but not for the version reason. It reported: node:internal/modules/cjs/loader:1228
  throw err;
  ^

Error: Cannot find module '/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/scripts/assert-node-engine.mjs'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1225:15)
    …
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v20.18.1
EXIT=1
$ mv "$T/assert-node-engine.mjs.aside" scripts/assert-node-engine.mjs
$ git status --porcelain -- scripts/assert-node-engine.mjs
$                                        # empty — the file is byte-identical, md5 2caad5c1769f6fe2da9c6969224d4587
```

**Row 6 — step 3 (the guard's own comparator self-test) under v22.4.0. Required: exit 0.**

```
$ nvm exec --silent 22.4.0 bash -e "$T/step-3.sh"
assert-node-engine --self-test: 23 cases OK
EXIT=0
```

The whole matrix, re-run as one chain against the committed tree, with the negations expressed as
`!` so a silently-passing row cannot hide:

```
$ nvm exec --silent 20.18.1 bash -e "$T/step-1.sh" \
  && nvm exec --silent 24.14.1 bash -e "$T/step-2.sh" \
  && nvm exec --silent 22.4.0  bash -e "$T/step-3.sh" \
  && ! nvm exec --silent 24.14.1 bash -e "$T/step-1.sh" \
  && ! nvm exec --silent 20.18.1 bash -e "$T/step-2.sh" \
  && echo "flip matrix ok"
flip matrix ok
```

#### The standing spec, and its own six reds

Six assertions were appended to `packages/dev-seed/tests/nodeEngineGate.test.ts` — the file that
already asserts this guard's `preinstall` and `lint:check` wirings, because the CI job is a third
wiring of the same guard. Each was observed RED once against a deliberately broken tree, and each
break was reverted with a scoped `git checkout -- .github/workflows/main.yaml` against the
already-committed Task 1 state. **No red commit was made:** `integration/ship-12-squash` is shared
and carries concurrent agents, so a deliberately red commit on it is a cost paid by everyone. This
is the same disposition `153-02` recorded for its own TDD gate.

| # | Assertion | Break introduced | Observed red |
|---|---|---|---|
| 1 | the job key appears exactly once | job key renamed | `expected [] to have a length of 1 but got +0` (and 3 downstream assertions red, which is the slice guard doing its job) |
| 2 | invokes the guard BY PATH | guard path replaced by `scripts/inlined-version-comparison.mjs` | `expected '    runs-on: ubuntu-latest\n\n    ste…' to contain 'node scripts/assert-node-engine.mjs'` |
| 3 | asserts the reject REASON | discriminator weakened to the non-discriminating `'assert-node-engine'` | `expected '    runs-on: ubuntu-latest\n\n    ste…' to contain 'assert-node-engine: this Node is '` |
| 4 | no `continue-on-error` | `continue-on-error: true` added to the job | `expected '    runs-on: ubuntu-latest\n    conti…' not to contain 'continue-on-error'` |
| 5 | selected major strictly below the declared bound | `node-version: "20.x"` → `"24.x"` | `expected 24 to be less than 22` |
| 6 | no `node-version-file` anywhere in the file | `node-version-file: package.json` introduced in the job | `expected 'name: "Main tests & validation"\n\non…' not to contain 'node-version-file'` |

Assertion 5 also **fails closed**: under the row-1 break, where the toolchain line is unreachable
because the slice is empty, it fails by name — `the negative-control job no longer selects an
'<major>.x' toolchain: expected null not to be null` — rather than quietly skipping the comparison.

**The self-invalidating-grep failure mode, closed and demonstrated.** Assertions 4 and 6 forbid a
literal that the job's own explanatory comment is entitled to name. A spec reading the raw file
would therefore be red against a tree nobody had touched — which is the second instance of this
class in this phase, and a gate that fails on the baseline teaches the next reader to route around
it. The spec reads the workflow with whole-line `#` comments stripped, and that was demonstrated
rather than asserted: injecting a comment naming each forbidden literal takes the RAW-file substring
count from 0 to 1 and leaves the suite green.

```
$ # comment naming `continue-on-error` injected above the job key
$ grep -c 'continue-on-error' .github/workflows/main.yaml
1
$ npx vitest run tests/nodeEngineGate.test.ts
      Tests  10 passed (10)

$ # comment naming `node-version-file` injected above the job key
$ grep -c 'node-version-file' .github/workflows/main.yaml
1
$ npx vitest run tests/nodeEngineGate.test.ts
      Tests  10 passed (10)
```

Baseline raw counts on the shipped tree are 0 for both literals, so those two 1s are the injections
and nothing else.

**Suite deltas.** `yarn workspace @openvaa/dev-seed test:unit`: **599 passed / 52 files**, up from
the 593/52 baseline; `nodeEngineGate.test.ts` **10 tests**, up from 4. `node
scripts/assert-comment-hygiene.mjs`: 1579 files scanned, **0 violations**. `npx prettier --check` on
both touched files: clean. `tsc --noEmit` in `packages/dev-seed` (whose `include` covers
`tests/**/*`): exit 0.

**The region slice does not assume this job stays last.** It runs from the job key to the next
top-level job key, falling back to end-of-file — because Phase 163 appends three more jobs after it,
and a spec that assumed "everything after the key" would silently start asserting over a stranger's
YAML.

**One discretionary addition, named as such.** The guard's `--self-test` third step is beyond the
operator's minimum shape. It runs 23 comparator cases, nine of them negative, and today it runs
nowhere automatically — `lint:check` invokes the real check, not the self-test. One `run:` line
makes the comparator's own negative cases standing CI.

### Part 4 — what is NOT observed, stated as a boundary rather than a gap

**No workflow run has been observed, because none is reachable from this branch.**
`.github/workflows/main.yaml` triggers only on `push` to `main` and on `pull_request` targeting
`main`; the branch is `integration/ship-12-squash`, measured **222 commits ahead of
`origin/main`**. Nothing in this row, in `153-03-SUMMARY.md`, or in the commits this plan produced
claims otherwise.

Per operator ruling **D3** the trigger change — adding `integration/**` to the push trigger and
adding `workflow_dispatch`, with a recorded removal condition at v2.15 close — is owned by
**`163-01`** and was deliberately NOT folded in here. D3's own reasoning: *"turning the trigger on
starts CI jobs against 133 unobserved commits, which is an outward-facing action best taken
deliberately inside 163-01 rather than as a side effect of recording a decision."* The same applies
with more force to a build-tooling plan. The `on:` block is untouched by this plan, so no run can be
accidentally produced here and then narrated.

**Three residual risks that local execution cannot cover**, each a property of the runner rather
than of the file:

1. **Whether the runner resolves `20.x` from the setup-node version manifest.** The local proof
   selected v20.18.1 through `nvm`, not through `actions/node-versions`. If Node 20 is ever dropped
   from that manifest the setup step fails loudly — which is the accepted outcome (threat T-153-13),
   named in the job's own comment so the reader of a red run is sent to the right fix — but it is
   not a thing this machine can observe.
2. **Whether the runner's default shell reproduces the `bash -e` semantics the local proof used.**
   The proof ran GNU bash 3.2.57 with `-e`; GitHub's default is a newer bash with
   `--noprofile --norc -eo pipefail`. `pipefail` is why the steps contain no pipes, and `-e` is why
   the `OUTPUT="$(cmd)" || STATUS=$?` suffix exists — but the runner's exact shell invocation is
   unobserved from here.
3. **Whether the YAML-to-step wiring behaves as parsed.** `js-yaml` extracted the three `run:`
   bodies and the local proof executed those bodies; that the runner assembles the same three steps,
   in the same order, from the same YAML, is inferred from the parse and not observed.

**Discharge condition.** The first CI run of `node-engine-range-negative-control` — expected on the
nearer of two paths: `163-01` landing the `integration/**` push trigger and `workflow_dispatch` per
D3, or the v2.15 merge to `main`. Filed with its full observation recipe at
`.planning/todos/pending/2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md`, per D-N2.

---

## Requirement trace

Every one of REVIEW-CFG-01..08, mapped to the plan that discharged it, to a **named executable
command** or — where no command can exist — to a **named recorded boundary stated in words**, and to
the row carrying its evidence. **No cell is empty.** Where a requirement's proof is a boundary rather
than an observation, the cell says so explicitly; that is the distinction this table exists to keep
visible.

| Requirement | Status at close | Discharged by | Executable proof, or named boundary | Row |
|---|---|---|---|---|
| **REVIEW-CFG-01** | **Complete** | `153-01` | **Command.** `node scripts/assert-declared-binaries.mjs` → exit `0`, census `16 workspace(s) scanned, 20 build-script binary invocation(s). 0 violation(s).` Re-run at phase close. The BLINDNESS/CATCH pair was taken at the level of the standing command `yarn lint:check`: exit `0` and silence with the 9th chain link removed, exit `1` naming `packages/matching` with it restored. | Row 1 |
| **REVIEW-CFG-02** | **Complete** | `153-02` (the binding, observed) · `153-03` (a standing CI negative control against rot) | **Command.** `yarn install` under Node **v20.18.1** exits `1` with a build log naming the guard; **v22.4.0 / v24.14.1 / v25.2.1** all pass — real runtimes via `nvm`, not simulated. Both manifests spell `engines`; re-verified at close (`root.engines={"node":">=22",…}`, `apps/frontend` identical, `engine` undefined in both). **Separate named boundary:** the negative-control CI job `node-engine-range-negative-control` that `153-03` added has **never run**, because no CI run is reachable from this branch. That boundary is about the *job*, not about the binding. | Row 6 |
| **REVIEW-CFG-03** | **Complete** | `153-04` | **Command.** `cd apps/frontend && npx vitest list --run` → exit `0`, full collection, 11 alias replacement values byte-identical across the change (printed and diffed, not inspected). Wrong-directory control turns the same signals red: diff non-empty, collection exit `1` naming `$lib`. Re-verified at close: comment-filtered `__dirname` count in `apps/frontend/vitest.config.ts` = `0`. | Row 3 |
| **REVIEW-CFG-04** | **Complete** | `153-05` | **Command.** `grep -c 'bash' .lintstagedrc.json` → `0`, re-run at close. Coverage preservation is measured, not argued: `.husky/pre-commit` line 1 already runs the identical build, and lint-staged spawns string commands through `tinyexec` with **no shell** (`node_modules/lint-staged/lib/getSpawnedTask.js:102`), so the two remaining commands need no shell to exist. The naive replacement was *rejected by measurement* — it hands turbo the staged paths as task names, exit `1`. | Row 2b |
| **REVIEW-CFG-05** | **Pending** | `153-08` | **Named boundary — no command can discharge this from here.** The requirement's own clause is *"observed running green against its script on a real workflow run"*, and it is unmet **twice over**: (i) **no run exists** — the only run that ever contained the job is `32058994754`, which failed; `origin/main` does not carry the job at all, so a `main` push would not run it either; and (ii) **not green** — the script legitimately exits `1` at this HEAD under operator ruling **D9**, with exactly `filters` and `matching` remaining, both owned by Phase 160. Local re-run at close: `bash .claude/scripts/audit-skill-drift.sh` → true exit `1`, `Checked: 5  Drifted: 2  Skipped: 3`. Discharge condition filed at `.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md`. | Row 5 |
| **REVIEW-CFG-06** | **Complete** | `153-06` | **Command.** `git ls-files \| grep -E '\.tsbuildinfo$\|(^\|/)\.branches/'` → **0**, and all four paths confirmed still present on disk. `git check-ignore -v` returns exactly one rule per path; the rules were shown to bind against artefacts written **after** the change, and index-blind. (See `## Flagged planner assumptions` for the loose-predicate caveat — the plan's own looser pattern matches this phase's filings and returns 1.) | Row 4 |
| **REVIEW-CFG-07** | **Complete** | `153-07` | **Command.** `grep -c '1\.0\.0' packages/shared-config/README.md` → `0`; `grep -rEn "from ['\"]\.\.?/[^'\"]*\.js['\"]" --include='*.ts' packages apps tests \| wc -l` → `0`. Both re-run at phase close. **This requirement has no ledger row** — `153-07` produced no negative-control fragment; these two commands are its whole proof, which is why they are stated here in full rather than referenced. | *No row — stated in this cell by design; see the row-count table* |
| **REVIEW-CFG-08** | **Pending** | `153-05` | **Clause one — command, discharged.** The glob fix was proven by a BLINDNESS/CATCH pair against a deliberately mis-formatted `.svelte`/`.mjs` pair: lint-staged reports `— 0 files` on the fused glob and `— 2 files` after the fix. Re-verified at close: `grep -c 'mjssvelte' .lintstagedrc.json` → `0`; the config now carries `*.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml}`. **Clause two — named boundary, not discharged.** *"so the gate starts from clean"* cannot be met from inside `153-05`: the pre-commit hook was **already red before this phase** — `apps/docs` aborts eslint with a Node `ERR_INTERNAL_ASSERTION`, and `eslint --fix` would rewrite 27 of 44 `.mjs` files leaving 366 problems. Attribution was **measured per directory**, not assumed: `153-05` enlarged the population the hook sees; it did not create the defect. Filed at `.planning/todos/pending/2026-08-29-153-pre-commit-eslint-red-on-mjs-and-apps-docs.md`. | Row 2 |

**Two requirements are Pending and are not ticked anywhere in this ledger.** `REVIEW-CFG-05` and
`REVIEW-CFG-08` carry their unmet clause quoted verbatim in the table above. Neither was force-marked,
and `.planning/REQUIREMENTS.md` records both as Pending with the finding preserved in the Status cell.

---

## Flagged planner assumptions

Three requirements were probed by the deterministic edge probe and returned **`unclassified`**, and
therefore **unresolved**. They are carried into the close exactly as the owning plans stated them —
none auto-resolved with a backstop marker, none dropped.

**The count discrepancy, recorded and not reconciled in either direction.** The planning brief
describes **four** `unclassified` rows. The probe report at `coverage-153-cfg.json` contains exactly
**three** — one each for REVIEW-CFG-04, REVIEW-CFG-05 and REVIEW-CFG-07. `153-01` recorded this and
declined to reconcile it; this ledger does the same. A reader should not assume the brief's fourth
row was resolved, nor that it never existed.

### REVIEW-CFG-04 — surfaced in `153-05-PLAN.md`

> *Assumption:* the criterion's phrase *"so the pre-commit hook works where bash is absent"* is fully
> satisfied by removing every shell-wrapper invocation from the config, because lint-staged spawns
> commands with `tinyexec` and **no shell** (`getSpawnedTask.js:102`, no `shell` option anywhere), so
> the remaining `prettier` and `eslint` invocations require no shell at all. This is grounded in the
> installed source, but the criterion states no acceptance edge of its own and none was probed.
> A reader who disagrees should say so before the phase closes.

### REVIEW-CFG-05 — surfaced in `153-08-PLAN.md`

> *Assumption:* criterion 5's phrase *"observed running green against its script on a real workflow
> run"* admits a split discharge — the local `exit 0` now, the workflow observation later, filed with
> a discharge condition — rather than requiring both halves in this phase. The criterion states no
> edge of its own and the probe could not classify one. The split is OQ-1 option (b), which RESEARCH
> itself describes as leaving the criterion's own word *"on a real workflow run"* unmet. This
> planning run was unattended and could not ask; a reader who thinks the criterion must be all-or-
> nothing should say so before the phase closes.

**Superseded in part, and the supersession is recorded rather than silent:** the assumption's "local
`exit 0` now" half no longer holds. Under operator ruling **D9** the script's correct state at this
HEAD is exit **1**, with `filters` and `matching` outstanding for Phase 160. REVIEW-CFG-05 is
therefore Pending on *both* halves, not one — which makes the assumption's own worry ("a reader who
thinks the criterion must be all-or-nothing") more live at close than it was at planning.

### REVIEW-CFG-07 — surfaced in `153-07-PLAN.md`

> *Assumption:* "the repo's documentation and import conventions are true of the repo" is fully
> satisfied, for this criterion, by the two files it names. The criterion states no edge of its own —
> no boundary, no ordering, no emptiness condition — and the probe could not classify one. Research
> found a **third** document (`packages/README.md:21`) whose required-devDeps sentence is *also* untrue
> of the repo, which is evidence that the criterion's two-file scope is a boundary someone drew rather
> than a natural one. That third file is filed as a todo, and RESEARCH assumption **A5** — that its
> omission is an oversight rather than deliberate — is unverified. A reader who thinks the criterion
> should have covered it should say so before the phase closes.

### A fourth flagged assumption, added at close — the loose artefact predicate

Not an edge-probe row, but the same class of finding, and recorded here because a later reader
running the plan's own acceptance command will otherwise think REVIEW-CFG-06 has regressed.

`153-09-PLAN.md`'s acceptance one-liner for REVIEW-CFG-06 is
`test -z "$(git ls-files | grep -E 'tsbuildinfo|\.branches')"`. At phase close that predicate matches
**one** tracked path — and the path it matches is
`.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md`, **this
phase's own filing about tsbuildinfo**. It is a filename containing the word, not a build artefact.
`153-06` recorded the same defect in its own row ("the plan's predicate is too loose, and this row's
own filing trips it").

**A prediction made here at close, and falsified by its own measurement — recorded rather than
quietly deleted, because the correction is the more useful finding.** The first draft of this
section asserted that this ledger would itself add a *second* match to the loose predicate, "and so
would any document that discusses the requirement". That is **wrong**, and re-running the predicate
after committing this file proved it wrong: the count stayed at **1**. The reason is that
`git ls-files | grep …` filters the **list of tracked paths**, not the **contents** of those files —
so a document is caught only if the offending token is in its *filename*. This ledger discusses
`tsbuildinfo` at length and is not matched; the todo is matched solely because the word is in its
slug. The self-invalidating-scan hazard is therefore **narrower** than stated: it bites on
filename-shaped scans (`git ls-files`, `find -name`) only when a filing is *named* after the token,
and on content-shaped scans (`git grep`, `grep -r`) whenever a filing *mentions* it. Conflating the
two overstates the hazard in one direction and would understate it in the other.

The **anchored** predicate `git ls-files | grep -E '\.tsbuildinfo$|(^|/)\.branches/'` returns **0**,
and all four artefacts remain present on disk and untracked. REVIEW-CFG-06 is met. **Use the anchored
form.** This is the fifth appearance of the self-invalidating-scan class in Phase 153 (after `153-06`,
`153-03`, `153-08` and `153-11`), which is itself the finding: an unanchored grep over a repository
that documents its own greps will eventually match its own documentation.

---
## Ledger status

**Row count as filled: six numbered rows plus one sub-row (Row 2b) — complete against the count
declared at the top of this file.** REVIEW-CFG-07 has no row, by design, and its cell in
`## Requirement trace` carries its whole proof instead.

### The HEAD every gate was green at

**`a332f46264da7dcf69a1e1fdc5693943b2469530`** on `integration/ship-12-squash` — one HEAD for all of
it. The only commits after it are this plan's own, which add `153-NEGATIVE-CONTROL.md`,
`153-09-SUMMARY.md` and this phase-close record; no source file, manifest, workflow or config is
touched by plan `153-09`.

| Gate | Result | Census — what it actually examined | Wall |
|---|---|---|---|
| `yarn build` | **green** | 14/14 tasks. Re-run with `--force` (0 cached) to prove the green was an examination, not a cache replay. | 1 s cached / **18.3 s forced** |
| `yarn lint:check` | **green** | **all 11 chain links** observed producing output (see below) | 8 s |
| `yarn typecheck` | **green** | 22/22 tasks; re-run `--force` (0 cached) | 0 s cached / **14.7 s forced** |
| `yarn test:unit` | **green** | 25/25 tasks; frontend **54 files / 816 tests**, dev-seed **53 files / 603 tests**, data 47/244, supabase 6/55, matching 5/43, llm 2/39, argument-condensation 6/30, question-info 2/22, filters 1/22, app-shared 3/21, core 3/8. Re-run `--force` (0 cached) | 17 s / **24.5 s forced** |
| `yarn format:check` | **green** | "All matched files use Prettier code style!" | 10 s |

**`build` and `typecheck` were FULL TURBO cache hits on the first pass.** A cached green examines
nothing on the run that reports it, which is the same objection this ledger raises against every
other gate, so all three cacheable gates were re-run with `--force` at the same HEAD and were green
with `0 cached`. The forced figures are the ones that carry the claim.

**The 11 `lint:check` links, asserted by name rather than by count** — the chain grew from 8 to 11
during this phase, so a count assertion alone would not distinguish "all links ran" from "three new
links replaced three old ones":

| # | Link | Observed output at close |
|---|---|---|
| 1 | `turbo run lint` | 11/11 tasks successful |
| 2 | `eslint --flag v10_config_lookup_from_file tests` | no diagnostics |
| 3 | `yarn typecheck:tests` | no diagnostics |
| 4 | `yarn typecheck` | 22/22 tasks successful |
| 5 | `yarn assert:i18n-catalog-namespaces` | `total keys: 598; candidateApp.*: 161, adminApp.*: 121, other: 316. 0 violation(s).` |
| 6 | `yarn assert:a11y-scan-wiring` | `0 violation(s).` |
| 7 | `yarn assert:comment-hygiene` | `files scanned: 1584; vendored files excluded by name: 2 …; rules live: 2 of 2. 0 violation(s).` |
| 8 | `yarn assert:edge-env-defaults` | `files scanned: 17; checks live: 3 of 3. 0 violation(s).` |
| 9 | `yarn assert:declared-binaries` *(added by `153-01`)* | `16 workspace(s) scanned, 20 build-script binary invocation(s). 0 violation(s).` |
| 10 | `yarn assert:node-engine` *(added by `153-02`)* | `v24.14.1 satisfies "engines.node": ">=22" — OK` |
| 11 | `yarn assert:env-pair-registry` *(added by `153-10`)* | `17 Deno file(s) …, 1342 frontend file(s) …; env reads found: 24 Deno, 118 PUBLIC_; pairs derived: 4 …; .env.example assignments: 33. 0 violation(s).` |

Every guard prints a **census** of what it examined, not merely a verdict. That is deliberate and it
is this phase's own lesson: `153-10` shipped a guard that reported `0 pairs … 0 violations` and
exit 0 over four live pairs — a gate that examines nothing also reports green.

### The E2E cardinal-rule gate — **E2E: RAN**

Run under operator ruling **D1**, which pre-authorised the *branch* (RAN rather than DEFERRED) but
not the *result*. The suite was actually run; the numbers below are decoded from the **HTML report's
embedded base64 zip payload** (`tests/playwright-report/index.html` → `report.stats`), not from the
console tail.

```
E2E: RAN
command:        yarn test:e2e        (playwright -c ./tests/playwright.config.ts ./tests --grep-invert @probe)
exit code:      0
wall:           621 s (10.3m)
preflight:      E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend
                (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)

report.stats (authoritative payload, verbatim):
  total:      150
  expected:   150
  unexpected:   0
  flaky:        0
  skipped:      0
  ok:        true

decoded to the cardinal rule's terms:
  passed:       150
  failed:         0
  skipped:        0
  flaky:          0
  did-not-run:    0
```

**Independent corroboration that these numbers mean what they say**, because "150 passed" on a
console line is exactly the claim a false record would also make:

- **Per-test tally from the payload's file reports**, computed separately from `report.stats`: 150
  tests seen, outcomes `{"expected": 150}`, and **0 tests with more than one result**.
- **No retry could have masked a failure.** `tests/playwright.config.ts:216` sets
  `retries: process.env.CI ? 3 : 0`; `CI` is unset here, so local retries are **0**. A flake would
  have surfaced as a failure, not as a silent second attempt. `flaky: 0` is therefore a measurement,
  not a configuration artefact.
- **`total` equals the 150-test baseline**, so no test went missing from collection. A did-not-run
  would appear either as `skipped` (0) or as a shortfall in `total` (none).
- **Environment was clean and singular**: `yarn db:reset` (exit 0) before the run, `:5173` verified
  free by both `lsof -nP -iTCP:5173 -sTCP:LISTEN` and `docker ps | grep 5173` with no stray
  `vite.js dev`, then exactly **one** fresh dev server (pid 87189, listening `[::1]:5173`), torn
  down after.
- **One video artefact was produced on a green run and is fully accounted for**: it belongs to the
  `eperm07-term-trigger` hunt project, which sets `video: 'on'` deliberately
  (`tests/playwright.config.ts:425`), and that test's outcome is `expected`. It is not a failure
  residue.

**150/150, zero failed, zero did-not-run, preflight confirmed.** The cardinal rule is satisfied on
this run, at this HEAD.

### Every unfilled cell, enumerated — four boundaries, none of them a green tick

A ledger that closes with a blank where a boundary belongs is the failure this section exists to
prevent. There are **four**, not the two this plan's body anticipated.

**1. The CI-run boundary — the first run of `node-engine-range-negative-control` (WINDOWS row 179, `open`).**
Not "REVIEW-CFG-02's binding observation", and the distinction is the whole point. **The binding WAS
observed**, locally, against real runtimes via `nvm`: `yarn install` under Node v20.18.1 exits 1 with
a build log naming the guard, while v22.4.0 / v24.14.1 / v25.2.1 pass. REVIEW-CFG-02 is **Complete**
on that evidence. What is unobserved is the **first CI run of the negative-control job `153-03`
added** — narrower, and a different claim. `153-03` deliberately did **not** re-mark REVIEW-CFG-02 so
that this ledger could not imply the job discharged the binding; that decision is preserved here.
*Discharge:* `163-01` landing the `integration/**` push trigger and `workflow_dispatch` per ruling
D3, or the v2.15 merge to `main`. *Filed:* `.planning/todos/pending/2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md`.

**2. REVIEW-CFG-05 — Pending.** Unmet clause, verbatim: *"observed running green against its script
on a real workflow run"*. Unmet **twice over**: no run exists (the only run ever containing the job,
`32058994754`, failed; `origin/main` does not carry the job at all), **and** `audit-skill-drift.sh`
legitimately exits **1** at this HEAD until Phase 160 lands. *Discharge:* a branch carrying **both**
the job **and** commit `7d6aaac47`, reaching a real workflow run. *Filed:*
`.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md` and
`.planning/todos/pending/2026-08-28-153-skill-drift-gate-trigger-sensitivity.md`.

**3. REVIEW-CFG-08 — Pending.** Clause one discharged verbatim by `153-05` (BLINDNESS `— 0 files` /
CATCH `— 2 files`). Clause two — *"so the gate starts from clean"* — is **unmeetable from inside
`153-05`**: the pre-commit hook was **already red before this phase** (`apps/docs` aborts eslint with
a Node `ERR_INTERNAL_ASSERTION`; `eslint --fix` would rewrite 27 of 44 `.mjs` files leaving 366
problems). Attribution was **measured per directory**, not assumed — `153-05` enlarged the population
the hook sees; it did not create the defect. *Filed:*
`.planning/todos/pending/2026-08-29-153-pre-commit-eslint-red-on-mjs-and-apps-docs.md`.

**4. REVIEW-HYG-01 and REVIEW-HYG-02 — both Pending**, re-measured from scratch by `153-11` and
re-confirmed independently at this close.
- **REVIEW-HYG-01**: escape half MET (0), wiring half MET (link 7 of 11), **line-break half NOT MET
  by 64 junctions** — 5 vendored-by-ruling plus **59 in `apps/supabase/supabase/config.toml`**, a
  `toml` family **no operator ruling covers**. Independently re-confirmed here: `toml` is absent from
  the shared classifier's `FAMILY_BY_EXT` (which carries `ts, tsx, js, mjs, cjs, css, scss, html,
  svelte, sql, sh, bash, yaml, yml`), and `config.toml` is tracked and sits under `apps/` — so the
  standing guard's `0 violation(s)` is **scope-limited, not evidence of absence**. New finding,
  WINDOWS row **181**, `open`.
- **REVIEW-HYG-02**: **34 gated occurrences** — independently re-derived at this close by running
  `hygiene-grep-report.sh`: `phase-ref` 15 + `decision-id-bare` 1 + `planning-path` 2 + `task-id` 16
  = **34**, over a census of 2,658 tracked paths under the scan roots (2,431 greppable non-`.md`, 227
  declined as Markdown per ruling D7). **24 of the 34 were written after Phase 152 closed** (10 at
  `fee77f596` vs 34 at HEAD) — because `hygiene-grep-report.sh` **is wired into nothing**, which was
  also re-confirmed here: its three copies live under `.planning/phases/151-…/scripts/`,
  `.planning/phases/152-…/scripts/` and `.claude/skills/ship-review-stack/sources/`, and no
  `package.json` script, workflow or lint chain references it. **The class regrows because nothing
  watches it.**

**`requirements ready-ids` reported both HYG ids as `ready`. That is a frontmatter statement, not a
measurement.** `153-11` measured them and left both Pending; this close re-measured and agrees.
Neither is marked.

### No CI workflow run has been observed

Stated unambiguously, because it is the claim most likely to be read into a green ledger that is not
there. **No GitHub Actions workflow run has been observed by this phase — not for the
`node-engine-range-negative-control` job, and not for the `skill-drift-check` step.** Both remain not
observed at phase close. `.github/workflows/main.yaml` triggers only on `push` to `main` and on
`pull_request` targeting `main`; this branch is `integration/ship-12-squash`, some 241 commits ahead
of `origin/main`, and it declares no `workflow_dispatch`. Adding one is ruled out of scope here and
assigned to `163-01` per ruling **D3**, precisely so that no run is produced as a side effect and
then narrated. Nothing in this ledger, in any `153-NN-SUMMARY.md`, or in any commit this phase
produced claims otherwise.

### The skill-drift audit exits 1, and that is the accepted state

`bash .claude/scripts/audit-skill-drift.sh` → **true exit `1`**, with census
`Checked: 5  Drifted: 2  Skipped: 3` and exactly `filters` and `matching` drifted. Per operator
ruling **D9** this is the **accepted** post-`153-08` state, owned by **Phase 160**
(`agent-docs-skills-refresh`) — not a Phase 153 failure. Both drifts are attributed to Phase 152's
sweeps (`dce80642f`, `87e02f40b`) with **0 non-comment changed lines** each.

**Measurement hazard, recorded because it produces a false green:** `audit-skill-drift.sh | tail;
echo $?` reports `0` — that is `tail`'s exit status, not the script's. The exit was captured
directly here.

**Nothing was silenced, and that is asserted rather than promised.** All eight `targets:` blocks are
byte-identical to their pre-task values; `.claude/skills/` still lists the same eight skill
directories plus `BOUNDARIES.md`; the script's `exit 1` is still present; and
`git diff HEAD -- .claude/scripts/audit-skill-drift.sh` is empty. No `targets:` list was emptied or
narrowed, no skill was deleted, no forced-zero exit and no suppression flag was introduced. This
phase did not edit any skill it had not reviewed.

### Requirement dispositions written at close

**None.** No `requirements mark-complete` call was made by this plan. REVIEW-CFG-01, -02, -03, -04,
-06 and -07 were already `Complete` in `.planning/REQUIREMENTS.md`, marked by their owning plans on
their own evidence. REVIEW-CFG-05 and REVIEW-CFG-08 are `Pending` with their unmet clause preserved
in the Status cell, and REVIEW-HYG-01 and REVIEW-HYG-02 are `Pending` on `153-11`'s measurement,
re-confirmed above. **Marking any of the four would be a false record**, and normalising an annotated
Status cell to a bare `Pending` to get a write through would delete the annotation carrying the
finding. Neither was done.
