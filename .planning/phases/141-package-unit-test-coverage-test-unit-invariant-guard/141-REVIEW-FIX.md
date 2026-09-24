---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
fixed_at: 2026-08-18T21:35:00Z
review_path: .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-REVIEW.md
iteration: 1
findings_in_scope: 14
fixed: 13
skipped: 1
status: partial
---

# Phase 141: Code Review Fix Report

**Fixed at:** 2026-08-18T21:35:00Z
**Source review:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-REVIEW.md`
**Iteration:** 1
**Fix scope:** all (Critical + Warning + Info)

**Summary:**

- Findings in scope: 14
- Fixed: 13 (2 Critical, 6 Warning, 5 Info)
- Skipped: 1 (IN-06 — "**Fix:** none required")

All 13 fixes landed in one file, `scripts/assert-unit-test-coverage.mjs`. No `package.json` was
modified: the review found the wiring correct (IN-06), and every defect was in the guard.

## Verification method

Because this phase's product IS a guard, "the fix is present" is not a sufficient check — a guard
can be present and still not fire. **Every fix was verified by reproducing the exact failure
scenario the review named and confirming the guard now goes RED on it**, then confirming it returns
to green when the scenario is reverted. Where the scenario needed a payload the real turbo does not
emit (WR-02, WR-06.2), a stub binary was substituted for the duration of the test and removed
afterwards. Scenario probes were all temporary and the tree was confirmed clean after each.

Verification ran in the **main checkout** (`workflow.use_worktrees` is `false` in
`.planning/config.json`, so this agent edited and committed in the main working tree and created no
worktree). The numbers below are therefore reproducible from the tree as it stands.

**Gates, after the final commit, all from the main checkout:**

| Gate | Result |
|---|---|
| `node scripts/assert-unit-test-coverage.mjs` | exit 0, `Total: 0 violation(s)` |
| `yarn assert:unit-coverage` | exit 0 |
| `yarn test:unit` | **exit 0**, turbo `26 successful, 26 total` |
| The 5 packages this phase wired | still execute: matching 43 + core 8 + llm 39 + question-info 20 + argument-condensation 30 = **140 tests** |
| `npx prettier --check scripts/assert-unit-test-coverage.mjs` | clean (the file's only automated formatter) |
| `node --check scripts/assert-unit-test-coverage.mjs` | clean after every individual edit |
| **Not-weakened regression** — delete `test:unit` from `packages/matching` | guard exits **1**, names `@openvaa/matching` under Check 1 |

`yarn test:unit` composition is unaffected: same 26 turbo tasks, same 140 tests from the five wired
packages, guard still gating ahead of `turbo run test:unit`.

The summary line gained two fields (an `Enumeration:` count from IN-02, and the unwired NAMES from
IN-01):

```
Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Enumeration: 0 unclassifiable manifest(s);
Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 0 violation(s),
12 workspace(s) executed, 3 unwired: @openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types.
Scanned 15 workspace(s) under packages, apps; 0 non-workspace entr(ies) skipped. Total: 0 violation(s).
```

## Fixed Issues

### CR-01: A workspace root in `"workspaces"` but not in `WORKSPACE_ROOTS` is invisible to BOTH checks

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `2c715dd74`

Took the review's second option — keep the literal *and* assert set-equality — rather than
replacing `WORKSPACE_ROOTS` with a silent derivation, because the file's D-16 rationale leans on
the scanned set being readable in one place at the top. Added `assertWorkspaceRootsMatchManifest()`,
called first in `main()` before anything is scanned. It refuses unsupported glob shapes
(`SUPPORTED_WORKSPACE_GLOB = /^[^*/]+\/\*$/`), refuses a missing/empty `"workspaces"`, and reports
drift **in both directions by name**. Handles both yarn shapes (bare array and `{ packages: [...] }`).

Verified against three tree states, each exiting 1 with a named message:

- `"workspaces": [..., "tools/*"]` with `WORKSPACE_ROOTS` untouched → *"covered by the globs but NOT
  scanned by this guard: tools"* — the review's exact failure scenario, which previously exited 0.
- `"workspaces": ["packages/*/*", "apps/*"]` → unsupported-glob refusal.
- `"workspaces"` deleted → derivation-impossible refusal.

### CR-02: Neither check inspects the *value* of `test:unit`

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `3b1d576fc`

Added `TEST_RUNNER = /(^|[\s&|;])vitest(\s|$)/` and a second violation class in Check 1,
`noOpDeclarations`, reported separately from the missing-declaration class. Applied to **every**
workspace declaring the key, not only test-bearing ones — a no-op declaration is a defect on its own
and is what makes the "N workspace(s) executed" census misleading. Confirmed all 12 current
declarations (`vitest run`, `vitest run --passWithNoTests`) pass unchanged.

Verified: `packages/core` → `"test:unit": "echo skipping for now"` now exits **1** naming the
workspace and quoting the offending string. That edit was green on both checks before this fix.

Scenario 2 (the D-13 `--passWithNoTests` carriers going to zero coverage when their last test file
is deleted) is **not closed** — the review says so itself, and closing it needs D-13 revisited. Per
the review's instruction it is now recorded explicitly as a KNOWN RESIDUAL in the `TEST_RUNNER`
docblock rather than left implied by "both directions are checked".

### WR-01: `TEST_FILE_SUFFIXES` narrower than Vitest's discovery glob

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `c4353640b`

Replaced the three-suffix list with `TEST_FILE_PATTERN = /\.(test|spec)\.(c|m)?[jt]sx?$/`, the
pattern the runner itself uses, so the two cannot drift. Confirmed **zero** files in the tree change
classification (this closes shapes, not a present-day violation), and unit-checked the regex over 9
should-match and 6 should-not-match names.

Verified: `packages/dev-tools/src/*.spec.tsx` (a package with no `test:unit`) now exits **1** under
Check 1; before, `hasTestFile` returned false and it passed.

The smaller opposite-direction residual the review notes (`PRUNED_DIRS` pruning `build`/`coverage`/
`.turbo`/`.svelte-kit`, which are not in Vitest's default `exclude`) is left as-is — pruning is what
keeps the walk cheap in front of every `yarn test:unit` — but is now recorded in the docblock.

### WR-02: `task.command` never type-checked

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `7c4cd2081`

Added a `typeof task.command !== 'string'` filter that fails closed **before** the partition, naming
the count and an example `taskId`.

Verified with a stub turbo emitting the review's exact scenario — a payload using `commandLine`
instead of `command`, with every task otherwise well-formed. Before the fix that payload put all
tasks in `executed` and exited 0; it now exits **1** with the A4 sentinel-drift message.

### WR-03: `process.exit()` can truncate the violation message

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `c2a152970`

Took the review's "sentinel throw caught at the top of `main()`" option, which was flagged as the
fiddly half. Added a `GuardFailure` class; `fail()` now throws it (preserving the must-not-return
property `readTurboTasks` depends on), a top-level `try/catch` prints it once and sets
`process.exitCode = 1`, and `main()` ends with `process.exitCode = errorCount > 0 ? 1 : 0`. Non-
`GuardFailure` errors are deliberately re-thrown rather than dressed up as invariant violations.

Zero `process.exit()` **calls** remain (the three remaining textual matches are prose in comments).

Verified through a pipe — the real invocation shape under `yarn test:unit` and GitHub Actions — for
all three paths: clean run exits 0; a named precondition failure prints in full and exits 1; a Check
1 violation prints in full and exits 1.

### WR-04 (+ IN-05): `npx turbo` instead of the repo-pinned binary

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `16d7ff4c1`

Switched to `node_modules/.bin/turbo` (`turbo.cmd` on win32) with an `existsSync` precondition
naming `yarn install`. Also updated the JSON-parse failure message, which still quoted `npx`.

Verified two ways: temporarily renaming `node_modules/.bin/turbo` away produces the named
missing-install failure (exit 1) instead of a registry fetch; and a hostile `npx` earlier on `$PATH`
— which hijacked the call before this fix — no longer affects the run at all, confirming the pinned
binary is genuinely the one invoked.

**IN-05 is closed by this same commit**, as the review predicted ("WR-04's fix resolves it
incidentally"): the `execFileSync('npx', …)` call that cannot spawn `npx.cmd` on Windows since the
Node 18.20/20.12 hardening is gone. Not separately committed because it is not a separable change.

### WR-05: Symlinked workspace directories dropped without being counted

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `aef51f4ac`

`enumerateWorkspaces` now classifies `dirent.isSymbolicLink()` explicitly into `skipped` as
`<path> (symlink — not followed)` before the `isDirectory()` test, restoring the two-accumulator
contract. Plain files under a workspace root still `continue` silently — genuinely out of scope, not
an anomaly. Summary wording widened from "non-workspace director(ies)" to "non-workspace entr(ies)".

For `hasTestFile`, took the review's **second** option (record rather than follow): links are not
followed, now stated in the docblock, because following them needs a visited-set to bound cycles and
no such link exists under any workspace today.

Verified: `ln -s ../scripts packages/__probe` now appears in the summary as
`packages/__probe (symlink — not followed)`; before, it vanished with no trace. (An initial probe
symlinked to an existing workspace instead exercised turbo's own duplicate-workspace error — a
useful incidental confirmation that that shape fails closed.)

### WR-06: Filesystem and payload-shape errors escaping as raw stack traces

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `9bff1771a`

All three reachable paths closed:

1. Added `readDirEntries(dir, why)` wrapping `readdirSync` in `try/catch → fail(...)`, used at both
   walk sites. Only one `readdirSync` call site remains in the file, inside the wrapper.
2. Hardened the payload check to
   `parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)`, and added the
   captured output to the message.
3. Split manifest read from parse so the message names which one failed — an EACCES manifest was
   previously reported as "could not parse", sending the reader to the JSON.

Verified all three by name, each exit 1, none with a stack trace: `chmod 000` on a directory inside a
package with no test files (the short-circuit in `hasTestFile` means the probe must go in a package
with no tests — worth knowing for anyone re-testing this); `chmod 000` on `packages/core/package.json`;
and a stub turbo emitting the literal payload `null`.

### IN-01: `unwired` names computed then thrown away

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `45ab0f24d`

`checkTurboExecution` now returns `unwired` (the array) instead of `unwiredCount`, and the summary
prints the names in the same shape the `skipped` list already used. Output now reads
`3 unwired: @openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types`, which is what makes
the CR-01 class visible in the output at all.

### IN-02: A malformed `package.json` aborts before either check reports

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `7e99b4344`

`enumerateWorkspaces` gained a third accumulator, `anomalies`. The unreadable / unparseable /
nameless manifest cases now push and `continue` instead of calling `fail()`. New
`reportManifestAnomalies()` reports them as violations in the same report as the two checks, and
`main()` adds them to `errorCount`. They still exit 1 — they just no longer hide the rest.

Root-level failures (a missing workspace root, an unreadable root directory) deliberately remain
`fail()`: they abort enumeration entirely, so there is nothing left to report alongside.

Verified with a tree carrying **both** a bad manifest and a Check 1 violation: both `[ERROR]` blocks
plus the full summary now appear in one invocation (`Total: 2 violation(s)`, exit 1). Tested with
both an unparseable manifest (where turbo then also fails closed on its own, correctly) and a
nameless one (where turbo tolerates it, so all three report sections appear together).

### IN-03: Duplicate package names silently collapse in `declaredBy`

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `24afec0cc`

Duplicate-name detection added at the end of enumeration. Accumulated as an anomaly rather than
`fail()`-ing (the review said `fail()`; accumulating is consistent with IN-02, still exits 1, and
still names the defect — strictly more informative, not weaker).

Verified: copying `packages/core/package.json` into a second directory now exits **1** with a message
naming **both** directories and the shared name.

### IN-04: Roots resolved against the process CWD

**Files modified:** `scripts/assert-unit-test-coverage.mjs`
**Commit:** `7961e6bd2`

Added `REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')` and a `fromRepoRoot()`
helper applied at **every** filesystem call site. Paths are still written and printed repo-relative,
so output is unchanged and diffable. Per the review's note that "the `npx turbo` call has the same
CWD dependency, so both would need to move together", the subprocess also got `cwd: REPO_ROOT` —
turbo discovers the workspace graph from its working directory, so pinning the binary without
pinning the CWD would have left the half of Check 2 that matters still CWD-dependent.

Verified byte-identical output and exit 0 from three working directories: the repo root,
`packages/core`, and `/`.

## Skipped Issues

### IN-06: `package.json` wiring — coherent; two consistency notes

**Files:** `packages/core/package.json:25`, `packages/matching/package.json:25`,
`packages/llm/package.json:9`, `packages/question-info/package.json:9`,
`packages/argument-condensation/package.json:9`, `package.json:25-26`

**Reason:** Not a defect. The finding's own **Fix** section reads *"none required"* — it records that
the wiring is correct and matches D-10/D-11/D-12 exactly, and notes two pre-existing inconsistencies
it explicitly classifies as *"neither a bug"*: the three different `test:watch` shapes across the
five packages (D-10 says leave as-is), and `core`/`matching` having `test:unit` with no `test:watch`
counterpart (already recorded as a follow-up in `141-03-SUMMARY.md`). Acting on either would
contradict a standing decision. No `package.json` was modified by this fix pass.

## Notes for the verifier

- **All 13 fixes are in one file.** If any needs reverting, the commits are independent and each
  touches only `scripts/assert-unit-test-coverage.mjs`.
- **Two residuals are now documented in-file rather than fixed**, both on the review's own
  instruction: the D-13 `--passWithNoTests`-goes-to-zero-coverage hole (CR-02 scenario 2), and
  `PRUNED_DIRS` hiding test files under `build`/`coverage`/`.turbo`/`.svelte-kit` (WR-01, opposite
  direction). Neither is closable without revisiting a decision.
- **One behaviour change worth knowing:** an unreadable directory anywhere under a workspace now
  fails the guard closed (WR-06) rather than throwing a stack trace. This is intended, but it means a
  stray `chmod 000` directory turns `yarn test:unit` red with a guard message rather than a raw
  `EACCES`.
- **No logic-error-class findings** were in this review, so no fix is flagged
  `requires human verification`: every fix was validated by reproducing the named failure scenario
  end to end and observing the guard change colour, not by inspection alone.

---

_Fixed: 2026-08-18T21:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
