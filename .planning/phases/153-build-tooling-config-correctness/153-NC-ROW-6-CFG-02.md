# Phase 153 — Negative Control, Row 6 (REVIEW-CFG-02)

Fragment owned by plan `153-03`. Assembled into `153-NEGATIVE-CONTROL.md` by plan `153-09`.

- **Date:** 2026-08-29
- **Plan:** `153-03-PLAN.md` (wave 3, re-planned at `d7338722f` after operator ruling O5)
- **Requirements:** REVIEW-CFG-02 (already `Complete` — see Part 1; this row adds a standing guard against rot, it does not re-discharge the requirement)
- **Decisions discharged:** O5 (OQ-2 → option (b)), D-B5 (REVERSED by O5), D3 (the trigger change is `163-01`'s), D-N2 (the unobserved half is filed rather than claimed)
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`

## Environment

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

## Row 6 — REVIEW-CFG-02

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
