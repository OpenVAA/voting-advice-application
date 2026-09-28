# Phase 153 — Negative Control, Row 2 (REVIEW-CFG-08) + Row 2b (REVIEW-CFG-04)

**Two runs per requirement.** REVIEW-CFG-08 gets a **BLINDNESS** row — the pre-commit
config, as it stood, failing to notice a deliberately mis-formatted `.svelte` and `.mjs`
pair — and a **CATCH** row — the same two files, same shape, matched by name once the
glob fix lands. A row with only one half is not evidence: a gate that matches nothing
and a gate that matches everything-and-finds-nothing-wrong are indistinguishable from a
single green observation, and this milestone exists precisely to remove assertions that
cannot fail.

This fragment is one of six that `153-09` assembles into `153-NEGATIVE-CONTROL.md`.

- **Date:** 2026-08-29
- **Plan:** `153-05-PLAN.md` (wave 1) — owns Row 2 and Row 2b in full; nothing is appended by a sibling
- **Requirements:** REVIEW-CFG-08 (blindness + catch), REVIEW-CFG-04 (coverage-preservation argument, Row 2b)
- **Decisions discharged:** D-B3 (glob fix and `bash -c` removal land in the same commit; churn as its own commit), OQ-5 option (a)
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`

## Environment

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

## Row 2 — REVIEW-CFG-08 / **BLINDNESS**

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

## Ledger status

| Row | Requirement | Halves | Status |
|---|---|---|---|
| 2 | REVIEW-CFG-08 | BLINDNESS (`— 0 files`) + CATCH (`— 2 files`) | complete |
| 2 (hazard) | REVIEW-CFG-08 | Half A (exit 1, parser error) + Half B (exit 0, ignored) | complete |
| 2b | REVIEW-CFG-04 | coverage-preservation argument + measured rejection of the naive fix | complete; one flagged planner assumption |

Scoped `git status --porcelain -- .lintstagedrc.json .prettierignore` returned **0 entries**
after every run recorded above; the only changes to those two paths in this worktree are the
edits committed as `9973a2f69`.
