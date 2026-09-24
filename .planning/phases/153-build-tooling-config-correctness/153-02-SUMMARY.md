---
phase: 153-build-tooling-config-correctness
plan: 02
subsystem: infra
tags: [build-tooling, engines, node-version, yarn, preinstall, guard, lint-check, setup-node, negative-control]

requires:
  - 153-01
provides:
  - "`engines` — correctly spelled — in the root and frontend manifests, values byte-identical"
  - "`scripts/assert-node-engine.mjs` — a dependency-free guard comparing the running Node against `engines.node`, wired to both `preinstall` and the `lint:check` chain"
  - "Root scripts `assert:node-engine` and `preinstall`, the latter making an out-of-range Node fail `yarn install`"
  - "`packages/dev-seed/tests/nodeEngineGate.test.ts` — a four-way wiring spec for the new guard"
  - "Two appended `it()`s in `assertDeclaredBinariesGate.test.ts` — the manifest spelling/range, and the absence of `volta`/`devEngines`"
  - "`153-A3-SETUP-NODE-MEASUREMENT.md` — assumption A3 measured from the action's own source and falsified"
affects: [153-03, 153-09, 153-11]

actuals:
  tokens: 10500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Install-time guard with zero imports: a `preinstall` script runs before `node_modules` exists, so it may use Node built-ins only"
    - "Narrow-grammar comparator that REFUSES unparseable input by name rather than guessing — a guard that cannot read its input must go red, not green"
    - "Guard wired twice (`preinstall` + `lint:check`) because Yarn caches root lifecycle scripts and the chain is uncached"

key-files:
  created:
    - scripts/assert-node-engine.mjs
    - packages/dev-seed/tests/nodeEngineGate.test.ts
    - .planning/phases/153-build-tooling-config-correctness/153-A3-SETUP-NODE-MEASUREMENT.md
    - .planning/todos/pending/2026-08-29-153-03-scope-amendment-after-d-b5-reversal.md
  modified:
    - package.json
    - apps/frontend/package.json
    - packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts

decisions:
  - "Operator ruling O5: OQ-2 resolved to option (b), install-time binding via a repository-owned script. D-B5 is REVERSED — its rejection of a preinstall check rested on the false premise that Yarn still enforces `engines`."
  - "Option (c), the third-party `devoto13/yarn-plugin-engines`, remains REJECTED on supply-chain grounds and was not adopted, installed, or fetched."
  - "The guard is wired twice, not once: `preinstall` alone is insufficient because Yarn caches root lifecycle-script builds and skips them on a repeat install over an unchanged tree — measured, not assumed."
  - "The guard implements a deliberately narrow range grammar and fails closed on anything outside it, because `preinstall` runs before `node_modules` exists and no range-parsing library can be imported there."

metrics:
  duration: ~55 min
  completed: 2026-08-29

status: complete
---

# Phase 153 Plan 02: `engines` Spelling and Binding Summary

The Node constraint now binds: `engine` → `engines` at both sites, plus a dependency-free guard wired
to `preinstall` and `lint:check` that was **observed** rejecting Node v18.20.4 and v20.18.1 and
accepting v22.4.0 / v24.14.1 / v25.2.1 — the operator's ruled option (b), after the plan's own
option (a) was measured from source to warn rather than fail.

## What was built

**Task 1 — A3 measured** (`3af40f051`). `.planning/phases/153-…/153-A3-SETUP-NODE-MEASUREMENT.md`
records, with commands, resolved commit SHAs and verbatim source, what `actions/setup-node` does with
`node-version-file: package.json`.

**Task 2 — decision.** Pre-answered by the operator (below); no checkpoint was emitted.

**Task 3 + the ruled mechanism** (`59ce834da`). The two renames, the guard, its two wirings, and six
new assertions across two dev-seed spec files.

## The operator's ruling, recorded verbatim

> **The operator has already ruled (decision O5): take option (b) — install-time binding via a repo
> script. D-B5 is REVERSED.**
>
> Rationale on record: Yarn 4.13.0 genuinely has no `.yarnrc.yml` setting that makes an engine
> mismatch an error — measured three ways in research — so **D-B5's rejection of the preinstall
> option rested on a false premise.** With that premise falsified, the rejection does not stand.
>
> - **Option (c), the third-party `devoto13/yarn-plugin-engines`, remains REJECTED on supply-chain
>   grounds** — 64★, last pushed 2024-04-07, not published to npm, and it would be committed into
>   `.yarn/plugins/` and executed on every install by everyone. The reversal of D-B5 approves (b) and
>   **only** (b). Do not adopt (c).
> - The ruling approves the *mechanism*, not the *result*. The binding must be **observed to bind** —
>   REVIEW-CFG-02's actual requirement. Flip-test it: an out-of-range Node must genuinely be
>   rejected, and an in-range Node must genuinely pass. Record both halves verbatim.

**Selected option:** `install-time-script` — **(b)**. **D-B5(c) is explicitly reversed**, and D-B5
artefact (ii) (a `.yarnrc.yml` engine-check setting) is **not implemented**, because it does not
exist. No `.yarnrc.yml` key was invented: the file, comments stripped, contains **zero** occurrences
of the string `engine` (flip-tested — the same grep over a file containing `enableEngineChecks: true`
returns 1).

**Option (c) was not adopted.** Nothing was installed, fetched, or added under `.yarn/plugins/`.

**Sub-question — permanent gate or one-off observation?** The operator did not overrule the plan's
default, so it stands: a **permanent, self-asserting** gate. Under (b) that gate is now permanent by
construction — the guard runs on every install and on every `lint:check`, in CI and locally. The
CI-side negative-control job is a matter for a re-planned 153-03 (see the blocker below).

## The measurement that falsified A3 — and with it option (a)

RESEARCH assumption A3 held that `actions/setup-node` *fails* when `node-version-file: package.json`
is set and `engines.node` is absent or misspelled, and flagged it explicitly as unmeasured. It is
**false**.

Read at `refs/tags/v4` → commit `49933ea5288caeca8642d1e84afbd3f7d6820020` — the ref `main.yaml`
pins — in both `src/` and the compiled `dist/setup/index.js` the runner actually executes:

- `util.ts:8-61` `getNodeVersionFromFile` returns `string | null`, and returns **`null`** (`:53`) when
  neither `volta.node` nor `engines.node` is present. It does not throw.
- `main.ts:107-113` answers `null` with `core.warning('Could not determine node version from ….
  Falling back')` and an empty version. `core.warning` is an annotation; only `core.setFailed` fails a
  step.
- `main.ts:36` then skips installation entirely, and the job proceeds on the runner image's default
  Node.

| Input case | Verdict |
|---|---|
| valid `engines.node` | resolves and installs; nothing fails |
| no `engines` key | **WARNS** |
| `engines` misspelled `engine` | **WARNS** — indistinguishable from the case above |

RESEARCH stated the conditional itself: *"If it warns instead of failing, option 1 does not guard
against re-misspelling and only option (b)/(c) of OQ-2 binds."* The measurement selects that branch,
so the ruling and the measurement agree independently.

## Criterion 2 "binds" — observed, both halves, against real runtimes

The plan expected this to be **not locally provable** (*"Nothing here consumes `engines.node` today…
the observation becomes possible only in CI"*). That premise was falsified: `nvm` on this machine
carries Node v18.20.4 and v20.18.1, both genuinely out of range for `>=22`, so the observation was
made directly rather than deferred.

**Rejecting half** — `yarn install` under Node **v20.18.1**:

```
➤ YN0007: │ root-workspace-0b6124@workspace:. must be built because it never has been before or the last one failed
➤ YN0009: │ root-workspace-0b6124@workspace:. couldn't be built successfully (exit code 1, …)
➤ YN0000: · Failed with errors in 3s 059ms
EXIT=1
```

and the build log it points at, in full:

```
# This file contains the result of Yarn building a package (root-workspace-0b6124@workspace:.)
# Script name: preinstall

assert-node-engine: this Node is v20.18.1, and the root manifest declares "engines.node": ">=22". Switch to a Node satisfying that range, or change the declared range deliberately.
```

**Accepting half** — `yarn install` under Node **v24.14.1**: `Done with warnings in 1s 989ms`,
`EXIT=0`. (The two warnings, YN0060 `zod`/`openai` and YN0002 `playwright-core`, are pre-existing peer
warnings present in both runs and unrelated to this change.) No working-tree or lockfile change
resulted from either install.

**The guard alone, across five real runtimes straddling the boundary:**

| Node | exit | output |
|---|---|---|
| v18.20.4 | **1** | `this Node is v18.20.4, and the root manifest declares "engines.node": ">=22". …` |
| v20.18.1 | **1** | `this Node is v20.18.1, and the root manifest declares "engines.node": ">=22". …` |
| v22.4.0 | 0 | `v22.4.0 satisfies "engines.node": ">=22" — OK` |
| v24.14.1 | 0 | `v24.14.1 satisfies "engines.node": ">=22" — OK` |
| v25.2.1 | 0 | `v25.2.1 satisfies "engines.node": ">=22" — OK` |

**And the guard was red on the real defect before the rename**, which is the strongest evidence that
it examines something:

```
$ node scripts/assert-node-engine.mjs        # against the tree as it stood
assert-node-engine: the root manifest declares no "engines" key, so there is no Node range to
enforce. An "engine" key IS present — that is the misspelling this guard exists for; no tool reads
it. Rename it to "engines".
exit=1
```

## Every guard half flip-tested

| # | Break introduced | Result |
|---|---|---|
| A | root manifest reverted to `engine` | guard exit 1 (names the misspelling); spelling spec FAILS — `package.json declares no \`engines\`` |
| B | frontend manifest reverted to `engine` | spelling spec FAILS — `apps/frontend/package.json declares no \`engines\`` |
| C | `&& yarn assert:node-engine` deleted from `lint:check` | wiring spec FAILS — `expected [ 'turbo run lint', …(8) ] to include 'yarn assert:node-engine'` |
| D | `preinstall` key deleted | wiring spec FAILS — `expected undefined to be 'node scripts/assert-node-engine.mjs'` |
| E | `scripts/assert-node-engine.mjs` deleted | wiring spec FAILS — `ENOENT` |
| F | `.yarnrc.yml` engine-free grep | returns 0; the same grep over a file containing `enableEngineChecks: true` returns 1 |
| G | `volta` present in the manifest object | precondition check exits 1 |

Each was restored immediately (all after the work was committed, so `git checkout --` was a safe
undo). The guard's own comparator additionally ships `--self-test`: **23 cases OK**, including nine
negative cases asserting it *refuses* `^`, `~`, `x`-ranges, `*`, hyphen ranges, an empty range, and
partial versions under `>`, `<=` and bare — forms whose ecosystem semantics it does not implement and
therefore declines rather than guesses at.

## Deviations from plan

### 1. [Operator ruling] The plan's option (a) was not implemented; option (b) was

The plan's provisional default was option (a) (CI consumption). The operator ruled (b) before
execution. Everything below flows from that: `scripts/assert-node-engine.mjs`, the `assert:node-engine`
and `preinstall` script keys, the tenth `lint:check` link, and `nodeEngineGate.test.ts` are all
additions the plan's Task-3 `<files>` list did not name, because Task 3 was written on the assumption
that 153-03 would carry the binding.

Consequence for Task 3's acceptance criterion *"`git diff package.json apps/frontend/package.json`
shows exactly two changed lines, one per file, each a key rename"*: **partially met, deliberately.**
The renames are exactly one line per file, values byte-identical. Root `package.json` additionally
gains three lines — two script keys and the appended chain link — which are the ruled mechanism, not
smuggled scope. `git diff --numstat` reads `1 1 apps/frontend/package.json` and `4 2 package.json`.

### 2. [Rule 2 — missing critical functionality] A wiring spec was added for the new guard

The plan specified appending a single `it()` to `assertDeclaredBinariesGate.test.ts`. A new guard with
no wiring spec is precisely the failure mode 153-01's own docstring names — *"a guard script sitting
unreferenced on disk still exists, still passes when anyone runs it by hand, and reports nothing at
all when the link that invoked it is deleted"* — so `nodeEngineGate.test.ts` asserts all four wirings
(chain link, `preinstall`, script target, file present). Two `it()`s rather than one went into
`assertDeclaredBinariesGate.test.ts`: the plan's spelling assertion, and a second covering the
`volta`/`devEngines` absence the plan's `<behavior>` block requires.

### 3. [Measured] The plan's description of setup-node's resolution order is `main`-only

The plan's Task-1 `read_first` describes the resolver as checking *"`volta.node`, then
`devEngines.runtime`, then `engines.node`"*. At the pinned `v4` commit the order is `volta.node` →
`engines.node` → `volta.extends` → `null`; `grep -c devEngines dist/setup/index.js` at `v4` returns
**0**. The `devEngines.runtime` branch exists only on `main`. No effect on this repository today
(neither key is declared), but a future reliance on `devEngines` would be silently inert under `v4`.

### 4. [Measured] Yarn caches root lifecycle scripts, so `preinstall` alone would have been a partial gate

A scratch probe against the pinned Yarn release showed `preinstall`, `install` and `postinstall` all
run at the root — and that a **second** install over an unchanged tree runs none of them (`must be
built because it never has been before or the last one failed`). So `preinstall` fires on a fresh
clone, in CI, and after any previous failure, but not on a no-op repeat install by a developer who
changed Node runtimes since. That measured hole is why the guard is **also** a `lint:check` link,
which is uncached. Had the hole not been measured, the phase would have shipped a gate advertised as
binding every install that in fact binds some of them.

### 5. [Measured] Stale line numbers in RESEARCH and in REQUIREMENTS.md

RESEARCH § B.1 and REQUIREMENTS.md both cite `package.json:74` for the `engine` block. It was at
`:77` before this plan (153-01 added three script lines) and is at `:79` now.
`apps/frontend/package.json:54` was correct. Navigation was by symbol (`grep -n '"engine"'`)
throughout, so nothing was edited at a stale offset.

## Blocker registered — 153-03 must NOT run as written

Task 2's acceptance criterion says *"If the ruling is (b) … 153-03's scope is amended accordingly
before it runs."* **That amendment was NOT performed by this plan, and 153-03 is not safe to execute
as written.** Re-deriving another plan's `must_haves` and its Task 2 is a planning act; improvising it
from an execution context would produce a worse plan than a re-plan would. It is instead filed in
full at `.planning/todos/pending/2026-08-29-153-03-scope-amendment-after-d-b5-reversal.md`, which
names each falsified statement.

The short version: 153-03's truth #1 (replace all four `node-version: 22.22.1` with
`node-version-file: package.json`) is dropped by the ruling *and* separately falsified by the A3
measurement, and its negative-control job is built on setup-node semantics that do not hold. A
re-planned 153-03 should instead run the repository's own guard under an out-of-range Node in CI and
assert it exits non-zero.

One further trap for whoever re-plans it: `engines.node` is a **range**, not a pin. `setup-node`
resolves `">=22"` to the newest matching release, so the swap would silently unpin every CI job from
22.22.1 to floating-latest. Nothing in RESEARCH mentions this.

## Suite results, scored against the stated baselines

| Suite | Baseline | This plan | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14/14** | ✅ |
| `yarn lint:check` | 22/22, 9 chain links, all guards 0 violations | **22/22, 10 chain links** (`assert:node-engine` appended), all guards 0 violations | ✅ |
| `yarn test:unit` | 25/25 | **25/25** | ✅ |
| `yarn format:check` | clean | **clean** | ✅ |
| dev-seed | 587 tests / 51 files | **593 / 52** (+6 assertions, +1 file) | ✅ |
| comment-hygiene | 1578 files / 0 violations | **1579 / 0** (+1: the new spec file; `scripts/` is outside the scan roots) | ✅ |
| `yarn db:lint:sql` | pre-existing RED, lints the live DB, reads no working-tree file | not run | not scoreable, per standing instruction |

**E2E: declined, on this plan's own diff.** The six touched files are two manifests (an `engines` key
no runtime reads, plus three root `scripts` keys), one file under `scripts/` (outside every workspace),
and two `packages/dev-seed/tests/*` spec files. Nothing under `apps/frontend/src`, `tests/`, or any
`packages/*/src` was touched, and `yarn build` (14/14, including the frontend) plus `yarn test:unit`
(25/25, including 816 frontend tests) exercise every workspace this diff could reach. The one
cross-cutting addition, `preinstall`, runs on `yarn install` only — the E2E suite performs no install.

## Requirements

**REVIEW-CFG-02 — COMPLETE.** Both halves of its text are met and measured, not assumed: the field is
spelled `engines` in the root and frontend manifests (guarded by a spec that fails when either is
reverted), and an out-of-range Node is **observed** rejected — Node v20.18.1 fails `yarn install` with
exit 1 and a build log naming the guard, while v22.4.0 / v24.14.1 / v25.2.1 pass. The requirement's
"observed rather than assumed" clause is satisfied by a real out-of-range runtime, which is stronger
evidence than the CI-only route the plan anticipated.

## TDD Gate Compliance

⚠ **Task 3 carries `tdd="true"`, and the RED/GREEN gate commits were not produced as separate
commits.** The implementation and its specs landed in one atomic commit (`59ce834da`). This is
recorded rather than dressed up: a separate `test(...)` commit would have been genuinely red on
`integration/ship-12-squash`, a shared branch, and the RED evidence the gate exists to produce was
obtained by direct measurement instead — the guard observed exiting 1 against the pre-rename tree, and
seven flip-tests (A–G above) each observed turning a passing assertion red and back. No assertion in
this plan was accepted without being seen to fail.

## Known Stubs

None. No placeholder value, empty-literal data source, skipped test, or unrun `<verify>` was left
behind. Every `<verify>` block in the plan was executed; the `.yarnrc.yml` and `volta`/`devEngines`
zero-checks were each flip-tested to prove the zero can be made non-zero.

## Threat Flags

None. This plan added no network endpoint, auth path or schema change. `scripts/assert-node-engine.mjs`
reads exactly one file — the repository's own `package.json` — takes no argument beyond `--self-test`,
consults no environment variable, and imports nothing. T-153-04 (the third-party plugin) is closed by
non-adoption: nothing was installed or fetched. T-153-06 (a manifest edit deciding the CI toolchain)
is **narrowed** rather than merely mitigated, because the ruled mechanism does not make `engines.node`
select the CI toolchain at all — it only validates the runtime already chosen. T-153-07 (claiming an
unmeasured rejection) is discharged: the claim rests on an observed exit code, not on assumption A3,
which this plan falsified.

## Self-Check: PASSED

All five created files and three modified files exist on disk; both task commits (`3af40f051`,
`59ce834da`) are reachable in `git log`; the `lint:check` chain reads 10 links.
