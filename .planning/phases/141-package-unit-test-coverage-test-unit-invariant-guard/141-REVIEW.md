---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
reviewed: 2026-08-18T18:54:16Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - scripts/assert-unit-test-coverage.mjs
  - package.json
  - packages/core/package.json
  - packages/matching/package.json
  - packages/llm/package.json
  - packages/question-info/package.json
  - packages/argument-condensation/package.json
findings:
  critical: 2
  warning: 6
  info: 6
  total: 14
status: issues_found
---

# Phase 141: Code Review Report

**Reviewed:** 2026-08-18T18:54:16Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

`scripts/assert-unit-test-coverage.mjs` was read line by line, executed at HEAD (exit 0,
0/0 violations, 15 scanned / 12 executed / 3 unwired, 0.68 s), and traced against the
research/negative-control record. The six `package.json` edits were diffed and are coherent:
all five packages now declare exactly `"test:unit": "vitest run"`, no `--passWithNoTests`
was added, `test:watch` was preserved where it existed, and no CI job or in-repo doc invokes
the bare `test` script that was renamed (`grep` over `.github/workflows/` and all
`packages/**.md` / `apps/**.md`). The root composition
`"test:unit": "yarn assert:unit-coverage && turbo run test:unit"` is correct, gates the one
command CI passes through (`main.yaml:70`), and passes trailing yarn args through unharmed.

**The headline question — has the implementation drifted back to the naive
`tasks[].package` shape? — is answered NO.** `scripts/assert-unit-test-coverage.mjs:315-322`
partitions on `task.command !== TURBO_NONEXISTENT`, exactly as
`141-NEGATIVE-CONTROL.md` rows 3/6/8 require, and the A4 backwards-read at `:346-349` is a
genuine addition beyond the plan. That part of the guard is sound.

The defects are elsewhere, and both Critical findings are **false negatives**: tree states
in which the coverage hole this phase exists to close is live and the guard exits 0. Neither
is hypothetical hand-waving — each names the exact files to create. CR-01 is an enumeration
gap that the file's own comment (`:71-79`) claims is covered and is only half-covered;
CR-02 is that neither check ever looks at what the `test:unit` value actually *does*, so a
one-token edit reproduces the original incident with a green guard.

## Critical Issues

### CR-01: A workspace root added to `package.json` "workspaces" but not to `WORKSPACE_ROOTS` is invisible to BOTH checks

**File:** `scripts/assert-unit-test-coverage.mjs:80` (constant), `:71-79` (the claim), `:339`, `:347-349` (the two directions that miss it)

**Issue:** `WORKSPACE_ROOTS` is a hard-coded literal that is never cross-checked against the
root `package.json` `"workspaces"` globs. The docblock at `:71-79` asserts the drift is
handled — *"A root listed HERE but not covered THERE is scanned by this guard and invisible
to turbo — Check 2 reports exactly that drift, by name"* — but that is only the drift in
**one** direction. The opposite drift (covered THERE, absent HERE) is caught only when the
stray workspace happens to declare `test:unit`:

- `notExecuted` (`:339`) iterates `declaring`, which is derived from the guard's own
  enumeration — a workspace the guard never enumerated cannot appear in it.
- `unexpectedlyExecuted` (`:347-349`) iterates `executed`, i.e. only tasks whose `command`
  is not the sentinel. A workspace with **no** `test:unit` script lands in `unwired`, which
  is counted and then discarded (`:319-322`, `:391`).
- `checkDeclaredCoverage` (`:221`) iterates the same missing enumeration.

**Failure scenario (exact tree state):**

1. Someone adds `"tools/*"` to the root `package.json` `"workspaces"` array (or `packages/*/*`
   for a nested package) and does **not** touch `WORKSPACE_ROOTS`.
2. `tools/reporting/package.json` declares `{"name": "@openvaa/reporting", "scripts": {"build": "tsup"}}`.
3. `tools/reporting/src/report.test.ts` holds real, currently-failing tests.

Result: turbo emits `@openvaa/reporting#test:unit` with `"command": "<NONEXISTENT>"` →
`unwired` (count 3 → 4, **no name printed**, see IN-01). Check 1 never sees the directory.
Check 2 has nothing to compare. **Guard exits 0**, the summary reads `Total: 0 violation(s)`,
and turbo runs no tests for it — byte-for-byte the state of the five packages this phase was
created to fix. This is the same defect class as ledger injection E, in the direction the
ledger did not inject.

**Fix:** derive the scanned roots from the manifest rather than restating them, and fail on
any glob shape the guard cannot handle:

```js
// Replace the WORKSPACE_ROOTS literal with a derivation + assertion.
const rootManifest = JSON.parse(readFileSync('package.json', 'utf8'));
const globs = Array.isArray(rootManifest.workspaces) ? rootManifest.workspaces : rootManifest.workspaces?.packages;
if (!Array.isArray(globs) || globs.length === 0) {
  fail('root package.json declares no "workspaces" array, so the scanned set cannot be derived …');
}
const unsupported = globs.filter((g) => !/^[^*/]+\/\*$/.test(g));
if (unsupported.length > 0) {
  fail(
    `root package.json "workspaces" contains glob(s) this guard cannot enumerate: ${unsupported.join(', ')}. ` +
      `Extend the enumeration in ${SELF} before trusting a green run — an un-enumerated workspace is ` +
      `invisible to BOTH checks.`
  );
}
const WORKSPACE_ROOTS = [...new Set(globs.map((g) => g.slice(0, -2)))];
```

If keeping the literal is preferred for auditability, keep it *and* assert set-equality
against the derived list, failing by name on any difference in either direction.

---

### CR-02: Neither check inspects the *value* of `test:unit` — `"test:unit": "echo skip"` passes both

**File:** `scripts/assert-unit-test-coverage.mjs:229` (Check 1), `:316` (Check 2)

**Issue:** Check 1 asserts only key presence (`Object.hasOwn(workspace.scripts, 'test:unit')`).
Check 2 asserts only that turbo's `command` string is not the `<NONEXISTENT>` sentinel — any
other string, including `""`, `"true"`, `"echo skip"` or `"vitest run --passWithNoTests"` over
an empty `include`, satisfies it. The guard therefore verifies that a *key exists* and that
*turbo is willing to run something*, never that the something is a test runner. Its own
docblock (`:24-26`) states the invariant it means to close as *"Without it, the declaration
is the same empty claim"* — that claim is exactly what remains unchecked, one shape over.

**Failure scenarios (each a single-line edit, both currently green):**

1. `packages/core/package.json` → `"test:unit": "echo skipping for now"`. Check 1: key present,
   pass. Check 2: turbo reports `command: "echo skipping for now"` ≠ sentinel → counted in
   `executed` (and inflates the reassuring `12 workspace(s) executed` census). Guard exit 0,
   `turbo run test:unit` exit 0, `@openvaa/core`'s 8 tests never run. Nothing in the tree
   distinguishes this from the wired state — the audit that found the original incident would
   have to be re-run by hand.
2. The five `--passWithNoTests` carriers (`app-shared`, `data`, `dev-seed`, `docs`, `filters`,
   deliberately untouched per D-13): delete `packages/filters/src/…test.ts` (its only test
   file) and Check 1 stops applying (no test files), Check 2 stays green (declares + executed),
   and `vitest run --passWithNoTests` exits 0 over zero tests. Coverage silently goes to zero
   with a green guard and a green CI.

**Fix:** add a third, cheap assertion in Check 1 over the declared value, and let the escape
hatch be an edit to this file (consistent with the no-runtime-opt-out stance at `:45-50`):

```js
/** A `test:unit` value must actually invoke the repo's test runner (D-12: bare `vitest run`). */
const TEST_RUNNER = /(^|[\s&|;])vitest(\s|$)/;
// … inside checkDeclaredCoverage, for every workspace declaring the key:
const command = workspace.scripts['test:unit'];
if (typeof command !== 'string' || !TEST_RUNNER.test(command)) {
  noOpDeclarations.push({ ...workspace, command });
}
```

and report `noOpDeclarations` as a violation naming the workspace and the offending string
("declares `test:unit` = `echo skip`, which runs no tests — a declaration that executes
nothing is the empty claim this guard exists to reject"). Scenario 2 is not fully closable
without revisiting D-13, but is worth recording explicitly in the docblock as a known residual
rather than left implied by "both directions are checked".

## Warnings

### WR-01: `TEST_FILE_SUFFIXES` is strictly narrower than Vitest's discovery glob

**File:** `scripts/assert-unit-test-coverage.mjs:87`

**Issue:** The guard recognises `.test.ts`, `.spec.ts`, `.test.tsx`. Every workspace here uses
Vitest's default `include`, `**/*.{test,spec}.?(c|m)[jt]s?(x)` (verified: `packages/core`,
`matching`, `llm`, `filters`, `app-shared`, `data` all export `{}` or a config that does not
set `include`). So `a.spec.tsx`, `a.test.js`, `a.test.jsx`, `a.test.mts`, `a.spec.cjs` are all
files Vitest **would** run and the guard **cannot** see.

**Failure scenario:** create `packages/dev-tools/src/report.spec.tsx` (or `.test.js`) with no
`test:unit` script in that package. `hasTestFile` returns false, Check 1 passes, the tests
never run. The docblock excuses `.spec.tsx` "by decision, not by oversight" but does not
address the six `.js`/`.mjs`/`.cjs`/`.jsx` shapes at all. Secondary, smaller direction:
`PRUNED_DIRS` prunes `build`, `coverage`, `.turbo`, `.svelte-kit`, none of which are in
Vitest's default `exclude` — a test file under `packages/x/coverage/` is run by Vitest and
invisible here.

**Fix:** replace the suffix list with the pattern the runner actually uses, so the two cannot
drift:

```js
const TEST_FILE_PATTERN = /\.(test|spec)\.(c|m)?[jt]sx?$/;
// …
if (TEST_FILE_PATTERN.test(dirent.name)) return true;
```

### WR-02: `task.command` is never type-checked, so a dropped/renamed field reads as "executed"

**File:** `scripts/assert-unit-test-coverage.mjs:315-322`

**Issue:** `task.command !== TURBO_NONEXISTENT` is true for `undefined`. If a future turbo
renames or removes the `command` field, **every** task falls into `executed` and Check 2's
primary direction goes silently green. The A4 mitigation at `:346-349` catches this today only
because three enumerated workspaces (`dev-tools`, `shared-config`, `supabase-types`) declare no
`test:unit` and would surface in `unexpectedlyExecuted` — a property of the current tree, not
of the code. The moment those three gain a `test:unit` script (or are removed), the mitigation
degrades to a no-op and the guard is blind to sentinel-contract drift, which is precisely the
risk assumption A4 flags.

**Failure scenario:** turbo 3.x emits `commandLine` instead of `command`, and by then all
enumerated workspaces declare `test:unit`. `executed` = all 15, `notExecuted` = [],
`unexpectedlyExecuted` = [], `executed.length !== 0` → guard exits 0 while nothing about
execution has actually been verified.

**Fix:** assert the field's presence and type before partitioning, and fail by name when it is
missing:

```js
const missingCommand = tasks.filter((task) => typeof task.command !== 'string');
if (missingCommand.length > 0) {
  fail(
    `Check 2 — turbo execution: ${missingCommand.length} task entr(ies) carry no string \`command\` field ` +
      `(e.g. ${missingCommand[0].taskId ?? '(no taskId)'}). The \`command\` field is the ONLY discriminator ` +
      `between an executed task and an unwired one, so a payload without it cannot be checked — this fails ` +
      `closed. Update TURBO_NONEXISTENT / this parser in ${SELF} (research assumption A4).`
  );
}
```

### WR-03: `process.exit()` after `console.error` can truncate the violation message

**File:** `scripts/assert-unit-test-coverage.mjs:114`, `:421`

**Issue:** In Node, `process.stdout`/`process.stderr` writes are **asynchronous when the
target is a pipe** — which is the case under `yarn test:unit` and under GitHub Actions, i.e.
every real invocation. `process.exit()` terminates without flushing queued writes, so the
guard's error text — its entire product — can be silently truncated or lost exactly when it
matters. The risk scales with message length, and Check 1 + Check 2 both printing a full
violation list on a badly drifted tree is the longest-output case.

**Fix:** never call `process.exit()` after writing; set the code and let the event loop drain:

```js
function fail(message) {
  console.error(`\nUnit-test coverage guard: ${message}\n`);
  process.exitCode = 1;
  // and either `throw new ExitSignal()` caught in main(), or restructure so callers return.
}
// main():
process.exitCode = errorCount > 0 ? 1 : 0;   // instead of process.exit(...)
```

Note the `fail()` restructure is the fiddly half — today `fail()` relies on `process.exit()`
for control flow (`readTurboTasks` continues to `JSON.parse(raw)` with `raw` undefined
otherwise). A sentinel throw caught at the top of `main()` preserves both properties.

### WR-04: `npx turbo` instead of the repo-pinned turbo — version drift and a registry fetch on a broken install

**File:** `scripts/assert-unit-test-coverage.mjs:257`

**Issue:** `turbo` is a root devDependency pinned at `^2.8.17` and present at
`node_modules/.bin/turbo`, and the `<NONEXISTENT>` sentinel this whole check turns on is
"observed at turbo 2.8.17" (`:100`, research A4). `npx` prefers the local binary, but when
`node_modules` is absent or partially installed — a fresh clone, a failed `yarn install`, a
cache-restore miss in CI — `npx` falls back to **fetching a package from the npm registry**,
which is both an unpinned-version execution (the sentinel contract may differ in a newer
major) and an unnecessary network/supply-chain surface in a script whose stated input surface
is *"the repository tree … plus the output of one read-only turbo dry run. Nothing else."*
(`:45-46`). Depending on the npm version the fallback either installs silently (non-TTY) or
errors — the silent branch is the dangerous one.

**Fix:** invoke the pinned binary and let the failure be a named precondition failure rather
than an implicit install:

```js
const turboBin = path.join('node_modules', '.bin', process.platform === 'win32' ? 'turbo.cmd' : 'turbo');
if (!existsSync(turboBin)) {
  fail(`'${turboBin}' is missing, so the execution half of the invariant cannot be checked. Run \`yarn install\`.`);
}
raw = execFileSync(turboBin, ['run', 'test:unit', '--dry=json'], { … });
```

(This also removes the Windows problem noted in IN-05.)

### WR-05: Symlinked workspace directories and non-directory entries are dropped without being counted

**File:** `scripts/assert-unit-test-coverage.mjs:151`, `:202-205`

**Issue:** `dirent.isDirectory()` is false for a symlink (`readdirSync` uses `lstat`
semantics). At `:151`, a workspace directory that is a symlink — the shape produced by some
vendoring and monorepo-linking setups — is skipped by `continue` and is **not** pushed to the
`skipped` accumulator, so it does not appear in the summary either. That directly contradicts
the two-accumulator rationale at `:124-131` (*"a thing this guard cannot classify is REPORTED,
never quietly discarded"*). The same applies inside `hasTestFile` at `:202-205`: a symlinked
subdirectory is never descended, so tests behind it are invisible to Check 1.

**Fix:** classify explicitly instead of dropping:

```js
for (const dirent of readdirSync(root, { withFileTypes: true })) {
  if (dirent.isSymbolicLink()) {
    skipped.push(`${path.join(root, dirent.name)} (symlink — not followed)`);
    continue;
  }
  if (!dirent.isDirectory()) continue;   // plain files under a workspace root are genuinely out of scope
  …
```

and in `hasTestFile`, either follow links with an explicit visited-set (to bound cycles) or
record that links are not followed in the docblock.

### WR-06: Filesystem and payload-shape errors escape as raw stack traces, contradicting the file's own contract

**File:** `scripts/assert-unit-test-coverage.mjs:111-115`, `:150`, `:202`, `:285`

**Issue:** `fail()` is documented as *"Never a raw stack trace: this family fails BY NAME"*
(`:111`), but three reachable paths bypass it:

1. `readdirSync` at `:150` / `:202` throws raw on `EACCES`, `EPERM`, `ELOOP`, or `ENOENT`
   (a directory removed mid-walk — plausible while a watcher or a parallel `yarn build` is
   running). The developer gets `Error: EACCES: permission denied, scandir '…'` with a stack,
   not a guard message.
2. `JSON.parse('null')` (or any non-object payload) makes `parsed.tasks` at `:285` throw
   `TypeError: Cannot read properties of null` **before** the `Array.isArray` check that was
   written to catch exactly this class.
3. `readFileSync` at `:165` throws raw on an unreadable (as opposed to unparseable)
   `package.json`; only `JSON.parse` is wrapped.

All three exit non-zero, so the guard fails closed — the defect is diagnosability and the
broken promise, not a false negative.

**Fix:** wrap the two `readdirSync` call sites (and the `readFileSync`) in `try/catch → fail(...)`
naming the path, and harden the payload check to
`if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.tasks))`.

## Info

### IN-01: The `unwired` package names are computed and then thrown away

**File:** `scripts/assert-unit-test-coverage.mjs:319-322`, `:391`, `:412`

**Issue:** `unwired` is built as a sorted array of names and only its `.length` survives into
the summary (`3 unwired`). The A4 mitigation recorded in `141-NEGATIVE-CONTROL.md` row 8 leans
on this integer as the drift signal — but an integer with no names cannot be acted on, and the
same file argues at `:154-158` that the reader should "see WHAT was excluded rather than
trusting that nothing was". It is also what makes CR-01 invisible in the output (3 → 4 with no
indication of which).

**Fix:** print the names, as the `skipped` list already does:
``${check2.unwiredCount} unwired${unwired.length ? `: ${unwired.join(', ')}` : ''}``.

### IN-02: A malformed `package.json` aborts before either check reports

**File:** `scripts/assert-unit-test-coverage.mjs:167`, `:176`, `:399-406`

**Issue:** `main()` documents (`:400-403`) that *"Both checks run and BOTH report in full
before the single exit"*, but `fail()` inside `enumerateWorkspaces` exits on the first
unparseable/nameless manifest, so a developer with one bad manifest **and** three unwired
workspaces still learns it one run at a time — the exact ergonomic the comment disclaims.

**Fix:** accumulate manifest anomalies alongside `skipped` and report them with the other
violations, exiting once at the end.

### IN-03: Duplicate package names silently collapse in `declaredBy`

**File:** `scripts/assert-unit-test-coverage.mjs:346`

**Issue:** `new Map(workspaces.map((w) => [w.name, w]))` keeps the last entry when two
directories declare the same `name` (e.g. `packages/foo` copied to `packages/foo-old` without
renaming). The `unexpectedlyExecuted` check then reads the wrong workspace's `scripts`.
Low likelihood — yarn and turbo would usually error first, which fails the guard closed via
the `readTurboTasks` catch — but the collapse itself is silent.

**Fix:** detect and `fail()` on a repeated name during enumeration; it is a manifest defect
worth naming regardless.

### IN-04: Roots are resolved against the process CWD, not the script location

**File:** `scripts/assert-unit-test-coverage.mjs:80`, `:141`

**Issue:** `WORKSPACE_ROOTS` entries are relative, so the guard's correctness depends on being
launched from the repo root. It fails by name if it is not (`:141-148`), which is acceptable,
but the failure is avoidable: `path.resolve(fileURLToPath(import.meta.url), '..', '..')` gives
the repo root unconditionally. Note the `npx turbo` call has the same CWD dependency, so both
would need to move together.

### IN-05: `execFileSync('npx', …)` cannot run on Windows

**File:** `scripts/assert-unit-test-coverage.mjs:257`

**Issue:** `npx` on Windows is `npx.cmd`; since the Node 18.20/20.12 `.cmd`-spawn hardening,
`execFileSync` without `shell: true` cannot execute it and throws. The failure is caught and
reported as "dry run FAILED" — fail-closed, but it makes `yarn test:unit` permanently red on a
Windows checkout. No evidence was found that Windows is a supported dev platform for this repo
(`.planning/WINDOWS.md` is the broken-windows defect ledger, not a Windows-support document),
so this is recorded rather than escalated. WR-04's fix resolves it incidentally.

### IN-06: `package.json` wiring — coherent; two consistency notes

**Files:** `packages/core/package.json:25`, `packages/matching/package.json:25`,
`packages/llm/package.json:9`, `packages/question-info/package.json:9`,
`packages/argument-condensation/package.json:9`, `package.json:25-26`

**Issue:** The wiring is correct and matches D-10/D-11/D-12 exactly — five bare
`"vitest run"` values, no `--passWithNoTests`, no other key touched, and nothing in
`.github/workflows/` or in any `packages/**.md` / `apps/**.md` invokes the renamed bare `test`
script (verified by grep), so the rename is safe. Two residual inconsistencies, both
pre-existing and neither a bug:

- `test:watch` remains three different things across the five (`llm`/`question-info`:
  `vitest`; `argument-condensation`: `vitest watch`; `core`/`matching`: absent). D-10 says
  leave as-is; noting it so the next reader does not "fix" it blind.
- `core` and `matching` now declare `test:unit` with no `test:watch` counterpart, while the
  root `test:unit:watch` reaches them only through the deprecated `vitest.workspace.ts` path
  (already recorded as a follow-up in `141-03-SUMMARY.md`).

**Fix:** none required.

---

_Reviewed: 2026-08-18T18:54:16Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
