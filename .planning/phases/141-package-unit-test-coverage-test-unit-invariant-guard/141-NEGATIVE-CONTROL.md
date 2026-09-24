# Phase 141 — Negative Control Ledger

**Two runs per requirement.** Every requirement this phase touches gets a **BLINDNESS**
row — the guard, as it stands, failing to notice a live defect — and a **CATCH** row —
the same defect, same shape, caught by name once the work lands. A row with only one
half is not evidence: a green guard and a blind guard are indistinguishable from a
single observation, and this milestone exists precisely to remove assertions that
cannot fail.

This file is opened by **plan 01**, which owns the three BLINDNESS halves. They are
capturable **only now**, while the tree is still unwired — once plan 02 adds the five
`test:unit` scripts, none of them can be observed again. Plans 02 and 03 append the
matching CATCH halves to this same file, so each pair lives in one document.

- **Date:** 2026-08-18
- **Plan:** `141-01-PLAN.md` (wave 1) — CATCH halves appended by `141-02` and `141-03`
- **Requirements:** UNIT-01 (blindness half), UNIT-04 (blindness half), UNIT-02 (discrimination proof)
- **Decisions discharged:** D-17 / research Pitfall 1 (the cross-check must be proven to discriminate)
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-NEGATIVE-CONTROL.md`

## Environment

```
date (UTC):        2026-08-18T15:49:50Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          6c10d63d01b0d5352c6af6c08b80ae4d889622d0  (the 141-MEASUREMENT.md commit)
git branch:        feat-gsd-roadmap
git status:        scoped `-- packages` → empty before and after every row below
OS:                macOS / Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
turbo:             2.8.17
vitest:            3.2.4
turbo test:unit:   { "dependsOn": ["build"], "cache": false }
```

> **Why the bare `git status` is not the gate.** `.planning/STATE.md` is modified by the
> GSD orchestrator throughout execution, so the bare form is never empty during a run.
> The gate that carries the claim here is the **scoped** form
> `git status --porcelain -- packages`, which is also what the injection-isolation
> contract demands: a sibling wave-1 plan (141-04) holds live injections under `tests/`,
> so this plan asserts cleanliness only over its own paths and reverts only by targeted
> `rm` of the exact paths it created. No `git checkout .`, no `git stash`, no
> `git clean` was run at any point.

---

## Row 1 — UNIT-01 / **BLINDNESS**

**Claim under test:** `yarn test:unit` executes the test files in `@openvaa/core` and
`@openvaa/matching`, so a deliberately failing assertion in either turns CI red.

**Injection.** Two files created, each holding one deliberately failing assertion:

`packages/core/src/zz-plant.test.ts` and `packages/matching/tests/zz-plant.test.ts`,
both byte-identical apart from nothing:

```ts
import { expect, test } from 'vitest';

test('zz-plant: deliberately failing assertion (UNIT-01 negative control)', () => {
  expect(1).toBe(2);
});
```

**Command:**

```sh
yarn test:unit
```

**Exit code: `0`.**

**Decisive output.** Turbo's task summary, verbatim from the run's tail:

```
 Tasks:    21 successful, 21 total
Cached:    0 cached, 21 total
  Time:    26.59s
```

**`zz-plant` occurrence count over the FULL output: `0`** (`grep -c 'zz-plant'` over the
captured log). Neither planted filename, neither planted test name, and no failure
appears anywhere. Both packages are absent from the executed set, so their test files
— including the planted ones — are never collected.

**Verdict: BLIND.** Two live, unambiguous test failures sitting in the two most
load-bearing product-logic packages leave the repository's unit-test command at exit 0
and reporting 21/21 successful. This is the "before" half the standing acceptance rule
demands. A non-zero exit here would have meant the packages were already wired and
would have invalidated the row.

**Revert:** `rm packages/core/src/zz-plant.test.ts packages/matching/tests/zz-plant.test.ts`
→ `git status --porcelain -- packages` returns 0 lines; neither file exists.

**CATCH half:** owed by plan 02 — same two plants, same command, after the five
`test:unit` scripts land. *(Not yet appended.)*

---

## Row 2 — UNIT-04 / **BLINDNESS**

**Claim under test:** a `packages/*` workspace that contains test files but declares no
`test:unit` script is a coverage hole that nothing currently detects.

**Injection.** A scratch workspace created at `packages/zz-scratch/`, **with no
`yarn install` run** (deliberately — the lockfile is untouched):

`packages/zz-scratch/package.json`

```json
{
  "name": "@openvaa/zz-scratch",
  "version": "0.0.0",
  "private": true,
  "scripts": {}
}
```

`packages/zz-scratch/src/a.test.ts`

```ts
import { expect, test } from 'vitest';

test('zz-scratch: passing assertion in an unwired workspace (UNIT-04 negative control)', () => {
  expect(1).toBe(1);
});
```

**Command 1 — is the scratch workspace in turbo's task graph?**

```sh
npx turbo run test:unit --dry=json
```

**Exit code: `0`.** `tasks[]` grew from 15 `test:unit` entries to **16**, and the
scratch workspace is present:

```json
{
  "taskId": "@openvaa/zz-scratch#test:unit",
  "package": "@openvaa/zz-scratch",
  "command": "<NONEXISTENT>",
  "directory": "packages/zz-scratch"
}
```

So turbo *sees* the workspace with no lockfile surgery at all — it simply has no script
to run for it, which it reports as the `<NONEXISTENT>` sentinel rather than by omitting
the entry.

**Command 2 — does the repository's unit-test command notice?**

```sh
yarn test:unit
```

**Exit code: `0`.** Turbo's own preamble confirms the workspace is in scope:

```
• Packages in scope: @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core,
  @openvaa/data, @openvaa/dev-seed, @openvaa/dev-tools, @openvaa/docs, @openvaa/filters,
  @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info,
  @openvaa/shared-config, @openvaa/supabase, @openvaa/supabase-types, @openvaa/zz-scratch
• Running test:unit in 16 packages
```

and the summary is nonetheless:

```
 Tasks:    21 successful, 21 total
Cached:    14 cached, 21 total
  Time:    16.499s
```

**16 packages in scope, 21 tasks run, 0 of them the scratch workspace's test.** The only
occurrence of the string `zz-scratch` in the entire output is that "Packages in scope"
line — the workspace is named, and then silently skipped.

**Verdict: BLIND.** A brand-new workspace carrying a test file and no `test:unit` script
is added to `packages/` and the repository reports full success. This is the exact
"before" state UNIT-04's guard must convert into a named failure.

**Revert:** `rm -rf packages/zz-scratch` → `git status --porcelain -- packages` returns
0 lines; `packages/zz-scratch` does not exist.

**CATCH half:** owed by plan 03 — same scratch workspace, run against
`scripts/assert-unit-test-coverage.mjs`, which must fail naming `@openvaa/zz-scratch`.
*(Not yet appended.)*

---

## Row 3 — UNIT-02 / **DISCRIMINATION PROOF** (naive vs. discriminating)

**Claim under test:** the UNIT-02 cross-check — "diff `turbo run test:unit --dry=json`
against the set of workspaces containing test files; nothing may be unaccounted for" —
must be able to tell a wired tree from an unwired one.

**Both verdicts below are computed from ONE payload**, captured at HEAD
`6c10d63d0` with **no scratch package present** and **no wiring landed**:

```sh
npx turbo run test:unit --dry=json > dry-head.json     # EXIT=0, 550,657 bytes
node crosscheck.cjs dry-head.json
```

`crosscheck.cjs` is a **transient scratch runner**, written outside the repository and
not committed: this plan ships no code. Its two predicates are stated verbatim in the
variant table below and its whole input — the payload's `tasks[]` projection — is
embedded here, so both verdicts are auditable against one another without it. The
permanent implementation is plan 03's `scripts/assert-unit-test-coverage.mjs`, whose
Check 2 must reproduce the RED result recorded below.

Because a single payload feeds both variants, the entire delta between them is
attributable to the filter and to nothing else — not to a different run, a different
tree state, or a different enumeration.

### The payload's `tasks[]` projection (taskId, package, command), all 15 entries

```json
{"taskId":"@openvaa/app-shared#test:unit","package":"@openvaa/app-shared","command":"vitest run --passWithNoTests"}
{"taskId":"@openvaa/argument-condensation#test:unit","package":"@openvaa/argument-condensation","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/core#test:unit","package":"@openvaa/core","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/data#test:unit","package":"@openvaa/data","command":"vitest run --passWithNoTests"}
{"taskId":"@openvaa/dev-seed#test:unit","package":"@openvaa/dev-seed","command":"vitest run --passWithNoTests"}
{"taskId":"@openvaa/dev-tools#test:unit","package":"@openvaa/dev-tools","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/docs#test:unit","package":"@openvaa/docs","command":"vitest run --passWithNoTests"}
{"taskId":"@openvaa/filters#test:unit","package":"@openvaa/filters","command":"vitest run --passWithNoTests"}
{"taskId":"@openvaa/frontend#test:unit","package":"@openvaa/frontend","command":"vitest run"}
{"taskId":"@openvaa/llm#test:unit","package":"@openvaa/llm","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/matching#test:unit","package":"@openvaa/matching","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/question-info#test:unit","package":"@openvaa/question-info","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/shared-config#test:unit","package":"@openvaa/shared-config","command":"<NONEXISTENT>"}
{"taskId":"@openvaa/supabase#test:unit","package":"@openvaa/supabase","command":"vitest run"}
{"taskId":"@openvaa/supabase-types#test:unit","package":"@openvaa/supabase-types","command":"<NONEXISTENT>"}
```

### Census re-derived from this payload (not quoted from any prior document)

- `tasks[]` entries with `task === 'test:unit'`: **15**
- **Executed: 7** — `@openvaa/app-shared`, `@openvaa/data`, `@openvaa/dev-seed`,
  `@openvaa/docs`, `@openvaa/filters`, `@openvaa/frontend`, `@openvaa/supabase`
- **Unwired (`command === '<NONEXISTENT>'`): 8** — `@openvaa/argument-condensation`,
  `@openvaa/core`, `@openvaa/dev-tools`, `@openvaa/llm`, `@openvaa/matching`,
  `@openvaa/question-info`, `@openvaa/shared-config`, `@openvaa/supabase-types`
- **Test-bearing workspaces (11)**, enumerated by walking `packages/*` and `apps/*` for
  `*.test.ts(x)` / `*.spec.ts(x)` with `node_modules`, `dist`, `.svelte-kit`, `.turbo`,
  `build`, `coverage` pruned: `@openvaa/app-shared`, `@openvaa/argument-condensation`,
  `@openvaa/core`, `@openvaa/data`, `@openvaa/dev-seed`, `@openvaa/filters`,
  `@openvaa/frontend`, `@openvaa/llm`, `@openvaa/matching`, `@openvaa/question-info`,
  `@openvaa/supabase`

Note that `dev-tools`, `shared-config` and `supabase-types` are unwired **and**
test-free, so they are correctly absent from both unaccounted lists below.

### The two variants

| Variant | Predicate | Unaccounted-for workspaces | Verdict |
|---|---|---|---|
| **naive** | test-bearing workspace appears anywhere in `tasks[].package` | **0** — *(none)* | **GREEN** |
| **discriminating** | test-bearing workspace appears in `tasks[]` **and** that task's `command !== '<NONEXISTENT>'` | **5** — `@openvaa/argument-condensation`, `@openvaa/core`, `@openvaa/llm`, `@openvaa/matching`, `@openvaa/question-info` | **RED** |

Verbatim runner output:

```
test-bearing workspaces (11): @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core, @openvaa/data, @openvaa/dev-seed, @openvaa/filters, @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/supabase
tasks[] entries: 15
executed (7): @openvaa/app-shared, @openvaa/data, @openvaa/dev-seed, @openvaa/docs, @openvaa/filters, @openvaa/frontend, @openvaa/supabase
unwired/<NONEXISTENT> (8): @openvaa/argument-condensation, @openvaa/core, @openvaa/dev-tools, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/shared-config, @openvaa/supabase-types
NAIVE          unaccounted (0): (none)  -> GREEN
DISCRIMINATING unaccounted (5): @openvaa/argument-condensation, @openvaa/core, @openvaa/llm, @openvaa/matching, @openvaa/question-info  -> RED
```

**The one sentence this row exists for:** a cross-check green on this payload cannot
distinguish a wired tree from an unwired one — the naive variant reports "0 unaccounted"
against a tree in which five test-bearing workspaces run no tests at all, which means
its greenness is a property of turbo's task-graph shape rather than of coverage.

**Why turbo makes this trap so easy.** `--dry=json` emits the *potential* graph: every
workspace gets an entry whether or not the script exists, and a missing script surfaces
as `"command": "<NONEXISTENT>"` rather than as an absent entry. Presence is not
execution. The `command` field is the only thing in the payload that carries the
distinction.

**CATCH half:** owed by plan 03 — the shipped Check 2 must reproduce this same
RED-at-HEAD result, and must turn GREEN only once plan 02's five scripts have landed.
*(Not yet appended.)*

---

## Row 4 — UNIT-01 / **CATCH**, part 1 — `@openvaa/core` alone (tracer)

**Pairs with:** `## Row 1 — UNIT-01 / **BLINDNESS**` in this same file (plan 01), which
recorded the identical plant leaving `yarn test:unit` at exit **0** with a `zz-plant`
occurrence count of **0**. This row is the "after" half for the tracer package; the
two-package simultaneous observation ROADMAP criterion 1 asks for literally is Row 5.

**Environment.** `2026-08-18T17:52:56Z`, branch `feat-gsd-roadmap`, git HEAD
`8e6b73e47` with plan 02 task 1's single working-tree modification live —
`packages/core/package.json` gaining `"test:unit": "vitest run"`. That one line is the
whole delta from Row 1's tree state; the plant file is byte-identical to Row 1's.
`git diff --stat -- packages/core` → `packages/core/package.json | 3 ++-` and nothing else.

### The four hops, each with the command that produced it

**Hop 1 — the script is declared with the exact D-12 value.**

```sh
node -e "const j=require('./packages/core/package.json');if(j.scripts['test:unit']!=='vitest run')throw new Error('bad')"
```

Exit **0**. `scripts` now reads `build`, `lint`, `typecheck`, `test:unit` — the added key
holds `vitest run`, no `--passWithNoTests`, no watch binary.

**Hop 2 — turbo's task graph now fans out to it.**

```sh
npx turbo run test:unit --dry=json
```

Exit **0**. `@openvaa/core`'s entry moved off the sentinel:

```
core.command = "vitest run"
total tasks[]: 15
executed=8 ["@openvaa/app-shared","@openvaa/core","@openvaa/data","@openvaa/dev-seed","@openvaa/docs","@openvaa/filters","@openvaa/frontend","@openvaa/supabase"]
unwired=7 ["@openvaa/argument-condensation","@openvaa/dev-tools","@openvaa/llm","@openvaa/matching","@openvaa/question-info","@openvaa/shared-config","@openvaa/supabase-types"]
```

Executed **7 → 8**, unwired **8 → 7**, `tasks[]` still 15 — exactly the one-package move,
and the payload Row 3 was computed from is otherwise unchanged.

**Hop 3 — the tests actually execute under the CI command.**

```sh
yarn test:unit
```

Exit **0**. Verbatim from the run:

```
@openvaa/core:test:unit:  ✓ src/matching/distance.test.ts (1 test) 1ms
@openvaa/core:test:unit:  ✓ src/entity/getEntity.test.ts (6 tests) 2ms
@openvaa/core:test:unit:  ✓ src/matching/missingValue.test.ts (1 test) 1ms
@openvaa/core:test:unit:  Test Files  3 passed (3)
@openvaa/core:test:unit:       Tests  8 passed (8)

 Tasks:    22 successful, 22 total
```

3 files / 8 tests — the same counts `141-MEASUREMENT.md` recorded for this package when
it was run directly, now reached through the root command. Turbo's total moved 21 → 22.

**Hop 4 — the far end: a failure here turns the CI command's exit code non-zero.**

Plant created (byte-identical to Row 1's `packages/core/src/zz-plant.test.ts`):

```ts
import { expect, test } from 'vitest';

test('zz-plant: deliberately failing assertion (UNIT-01 negative control)', () => {
  expect(1).toBe(2);
});
```

```sh
yarn test:unit
```

**Exit code: `1`.** **`zz-plant` occurrence count over the FULL output: `5`** (Row 1's
count over the same grep was `0`). Decisive lines, verbatim:

```
@openvaa/core:test:unit:  ❯ src/zz-plant.test.ts (1 test | 1 failed) 4ms
@openvaa/core:test:unit:    × zz-plant: deliberately failing assertion (UNIT-01 negative control) 3ms
@openvaa/core:test:unit:      → expected 1 to be 2 // Object.is equality
@openvaa/core:test:unit:  FAIL  src/zz-plant.test.ts > zz-plant: deliberately failing assertion (UNIT-01 negative control)

 Tasks:    5 successful, 8 total
Failed:    @openvaa/core#test:unit
 ERROR  run failed: command  exited (1)
```

**Verdict: CAUGHT.** The identical defect that left the repository at 21/21 successful in
Row 1 now names its own file, fails its own turbo task, and propagates a non-zero exit to
the root command. The pair Row 1 / Row 4 is what makes either observation evidence.

**Revert:** `rm packages/core/src/zz-plant.test.ts` → `yarn test:unit` exit **0**,
`Tasks: 22 successful, 22 total`, `zz-plant` occurrence count **0**, and
`git status --porcelain -- packages` returns the single line ` M packages/core/package.json`.
No `git checkout .`, no `git stash`, no `git clean` at any point (T-141-09).

---

## Row 5 — UNIT-01 / **CATCH**, part 2 — both packages planted simultaneously

**Pairs with:** `## Row 1 — UNIT-01 / **BLINDNESS**` in this same file (plan 01), whose
injection was exactly this one — `packages/core/src/zz-plant.test.ts` **and**
`packages/matching/tests/zz-plant.test.ts` live at the same time — and which recorded
`yarn test:unit` at exit **0**, `Tasks: 21 successful, 21 total`, `zz-plant` occurrence
count **0**. This row re-runs that same injection with both `test:unit` scripts landed.

**Environment.** `2026-08-18`, branch `feat-gsd-roadmap`, git HEAD `38593d4f0` (plan 02
task 1's wiring commit) with task 2's single working-tree modification live —
`packages/matching/package.json` gaining `"test:unit": "vitest run"`. Both plant files
byte-identical to each other (`cmp` exit 0, 149 bytes each) and to Row 1's.

**Baseline before planting.** `yarn test:unit` exit **0**, `Tasks: 23 successful, 23 total`,
with `@openvaa/core` at 3 files / 8 tests and `@openvaa/matching` at 5 files / 43 tests —
the same counts `141-MEASUREMENT.md` recorded for both packages run directly:

```
@openvaa/matching:test:unit:  ✓ tests/question.test.ts (3 tests) 2ms
@openvaa/matching:test:unit:  ✓ tests/missingValue.test.ts (2 tests) 2ms
@openvaa/matching:test:unit:  ✓ tests/space.test.ts (4 tests) 2ms
@openvaa/matching:test:unit:  ✓ tests/algorithms.test.ts (11 tests) 4ms
@openvaa/matching:test:unit:  ✓ tests/distance.test.ts (23 tests) 4ms
@openvaa/matching:test:unit:  Test Files  5 passed (5)
@openvaa/matching:test:unit:       Tests  43 passed (43)
```

### Observation A — the plan's predicted output shape is WRONG; the measurement stands

`141-02-PLAN.md` truth 2 predicted that the double plant would produce **both** planted
filenames in one `yarn test:unit` run, on the reasoning that turbo fans the two package
tasks out concurrently. **It does not, and the reason is worth recording**, because the
same wrong prediction would otherwise be inherited by every later plan reasoning about
this pipeline.

Both plants live, run **twice** to rule out a scheduling fluke:

```sh
yarn test:unit        # run 1
yarn test:unit        # run 2
```

| Run | Exit | `zz-plant` total | on `@openvaa/core` path | on `@openvaa/matching` path | Turbo summary |
|---|---:|---:|---:|---:|---|
| 1 | **1** | 5 | 5 | **0** | `Tasks: 5 successful, 8 total` / `Failed: @openvaa/core#test:unit` |
| 2 | **1** | 5 | 5 | **0** | `Tasks: 4 successful, 8 total` / `Failed: @openvaa/core#test:unit` |

`grep -c '@openvaa/matching:test:unit'` over each full log returns **0** — the matching
task produced no output line at all in either run. `@openvaa/matching#test:unit` was
never started.

**Cause: `turbo run` is fail-fast by default.** `--continue` defaults to *never*, so the
first task to exit non-zero aborts the run and every not-yet-started task is dropped.
`@openvaa/core#test:unit` loses the race to fail by a wide margin (3 tiny test files, and
its build dependency is at the root of the graph while `matching`'s is not), so it fails
first in both runs and `matching` never gets scheduled. The differing "5 successful" vs
"4 successful" totals between the two runs are the visible signature of that abort
landing at a slightly different point each time.

This is **not** masking. Nothing about `core`'s failure hides `matching`'s; the run
simply stops before reaching it, and the exit code it stops with is already non-zero.

### Observation B — the property UNIT-01 actually asserts, proven directly

UNIT-01's wording is *"a deliberately failing assertion in **either** turns CI red"*. That
is a claim about each package independently, and it is provable without any assumption
about turbo's scheduler. Each plant was therefore also run **alone**:

| Plant present | Command | Exit | `zz-plant` on core path | on matching path | Turbo summary |
|---|---|---:|---:|---:|---|
| `packages/core/src/zz-plant.test.ts` only | `yarn test:unit` | **1** | 5 | 0 | `Failed: @openvaa/core#test:unit` (Row 4, hop 4) |
| `packages/matching/tests/zz-plant.test.ts` only | `yarn test:unit` | **1** | 0 | 5 | `Tasks: 8 successful, 12 total` / `Failed: @openvaa/matching#test:unit` |

Verbatim from the matching-only run:

```
@openvaa/matching:test:unit:  ❯ tests/zz-plant.test.ts (1 test | 1 failed) 4ms
@openvaa/matching:test:unit:  FAIL  tests/zz-plant.test.ts > zz-plant: deliberately failing assertion (UNIT-01 negative control)
 Tasks:    8 successful, 12 total
Failed:    @openvaa/matching#test:unit
 ERROR  run failed: command  exited (1)
```

Each package, alone, turns the root command red and names its own file. **The non-zero
exit therefore does not depend on which package fails** — the concurrency concern the
edge-coverage item raised — because each is independently sufficient.

### Observation C — neither failure masks or cancels the other

To show that the single-name output in Observation A is turbo's abort policy and not one
task suppressing the other's result, the same simultaneous double plant was run once more
with fail-fast disabled:

```sh
npx turbo run test:unit --continue
```

**Exit code: `1`.** Both plants named, both tasks reported failed:

```
@openvaa/core:test:unit:  FAIL  src/zz-plant.test.ts > zz-plant: deliberately failing assertion (UNIT-01 negative control)
@openvaa/matching:test:unit:  FAIL  tests/zz-plant.test.ts > zz-plant: deliberately failing assertion (UNIT-01 negative control)

 Tasks:    21 successful, 23 total
Failed:    @openvaa/core#test:unit, @openvaa/matching#test:unit
```

`zz-plant` occurrences: **5 on the `@openvaa/core` path and 5 on the `@openvaa/matching`
path**, in one run. When turbo is permitted to run both, both fail by name and the exit
is still 1.

**Verdict: CAUGHT.** The identical double injection that left the repository at exit 0 /
21-of-21 successful / zero `zz-plant` occurrences in Row 1 now exits **1** in every
configuration tested — both-planted (twice), core-alone, matching-alone, and
both-planted-with-`--continue`. Five runs, five non-zero exits, and in every run the
failing package names its own planted file.

**Correction carried forward.** `141-02-PLAN.md` truth 2 ("BOTH planted filenames present
in the output") is **superseded by measurement**: under the default root command only the
first failer is named, because turbo aborts. The requirement's own claim — either package
failing turns CI red — is proven by Observation B, and the no-masking claim by
Observation C. Any later plan that predicts multi-package failure output from
`yarn test:unit` must account for `--continue=never` being the default.

**Revert:** `rm packages/core/src/zz-plant.test.ts packages/matching/tests/zz-plant.test.ts`
→ `yarn test:unit` exit **0**, `Tasks: 23 successful, 23 total`, `zz-plant` occurrence
count **0**; `git status --porcelain -- packages` returns the single line
` M packages/matching/package.json` (task 1's `packages/core/package.json` change is
already committed at `38593d4f0`); neither plant file exists. Reverted by targeted `rm`
of the two exact created paths — no `git checkout .`, no `git stash`, no `git clean`
(T-141-09).

---

## Row 6 — UNIT-02 / **CATCH**, part 1 — the census transition

**Pairs with:** `## Row 3 — UNIT-02 / **DISCRIMINATION PROOF** (naive vs. discriminating)`
in this same file (plan 01), which computed both cross-check variants from one payload
taken at HEAD `6c10d63d0` on the fully unwired tree. This row recomputes **the same two
variants, with the same predicates and the same enumeration**, from a payload taken after
all five `test:unit` scripts landed. Plan 03 still owes the other half of UNIT-02's catch:
the *shipped* `scripts/assert-unit-test-coverage.mjs` Check 2 reproducing this result.

**Environment.** `2026-08-18`, branch `feat-gsd-roadmap`, git HEAD `2c1838a22` (plan 02
task 2's wiring commit) with task 3's three working-tree renames live. Payload:

```sh
npx turbo run test:unit --dry=json > dry-final.json    # EXIT=0
node crosscheck.cjs dry-final.json <repo-root>
```

`crosscheck.cjs` is the same shape of **transient scratch runner** Row 3 used — written
in the scratch directory, outside the repository, not committed. Its two predicates are
byte-for-byte the ones Row 3 states, and its test-bearing enumeration walks `packages/*`
and `apps/*` for `*.test.ts(x)` / `*.spec.ts(x)` with `node_modules`, `dist`,
`.svelte-kit`, `.turbo`, `build`, `coverage` pruned — identical to Row 3's. The permanent
implementation remains plan 03's deliverable.

### The census transition

| Quantity | Row 3 (HEAD `6c10d63d0`, unwired) | This row (five scripts landed) | Δ |
|---|---:|---:|---:|
| `tasks[]` entries with `task === 'test:unit'` | 15 | 15 | 0 |
| **Executed** (`command !== '<NONEXISTENT>'`) | **7** | **12** | **+5** |
| **Unwired** (`command === '<NONEXISTENT>'`) | **8** | **3** | **−5** |
| Test-bearing workspaces | 11 | 11 | 0 |

`tasks[]` is unchanged at 15 and the test-bearing set is unchanged at 11 — the entire
delta is five entries moving from the sentinel to `"vitest run"`. The residual unwired
three are exactly the test-free workspaces:

```
unwired/<NONEXISTENT> (3): @openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types
```

They stay unwired and stay passing by design: a workspace with zero test files and no
`test:unit` script is not a coverage hole, and bare `vitest run` in one would exit 1 under
D-12. Every `test:unit` command value in the post-wiring payload, all fifteen:

```
  @openvaa/app-shared            -> "vitest run --passWithNoTests"
  @openvaa/argument-condensation -> "vitest run"
  @openvaa/core                  -> "vitest run"
  @openvaa/data                  -> "vitest run --passWithNoTests"
  @openvaa/dev-seed              -> "vitest run --passWithNoTests"
  @openvaa/dev-tools             -> "<NONEXISTENT>"
  @openvaa/docs                  -> "vitest run --passWithNoTests"
  @openvaa/filters               -> "vitest run --passWithNoTests"
  @openvaa/frontend              -> "vitest run"
  @openvaa/llm                   -> "vitest run"
  @openvaa/matching              -> "vitest run"
  @openvaa/question-info         -> "vitest run"
  @openvaa/shared-config         -> "<NONEXISTENT>"
  @openvaa/supabase              -> "vitest run"
  @openvaa/supabase-types        -> "<NONEXISTENT>"
```

All five new values are bare `vitest run` (D-12 — no `--passWithNoTests`, no watch
binary). The five pre-existing `--passWithNoTests` carriers are exactly `app-shared`,
`data`, `dev-seed`, `docs`, `filters` — unmodified, per D-13. No workspace gained the flag.

### The two variants, recomputed

Verbatim runner output on the post-wiring payload:

```
test-bearing workspaces (11): @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core, @openvaa/data, @openvaa/dev-seed, @openvaa/filters, @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/supabase
tasks[] entries: 15
executed (12): @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core, @openvaa/data, @openvaa/dev-seed, @openvaa/docs, @openvaa/filters, @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/supabase
unwired/<NONEXISTENT> (3): @openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types
NAIVE          unaccounted (0): (none)  -> GREEN
DISCRIMINATING unaccounted (0): (none)  -> GREEN
```

| Variant | Row 3 — unwired tree | This row — wired tree | Did its output move? |
|---|---|---|---|
| **naive** (workspace appears anywhere in `tasks[].package`) | 0 unaccounted → **GREEN** | 0 unaccounted → **GREEN** | **No — identical** |
| **discriminating** (appears **and** `command !== '<NONEXISTENT>'`) | 5 unaccounted → **RED** | 0 unaccounted → **GREEN** | **Yes — RED → GREEN** |

**The one sentence this row exists for:** the naive variant reports *exactly the same
result* — 0 unaccounted, GREEN — before and after five test-bearing workspaces went from
running no tests at all to running 18 test files and 140 tests, which means its output is
independent of the very property UNIT-02 asks it to measure; the discriminating variant is
the only one of the two whose verdict moved with the change, so **the discriminating
filter, not task presence, is the assertion plan 03 must implement**.

Put the other way: a guard built on the naive predicate would have shipped green through
this entire phase and would still be green if all five scripts were deleted tomorrow. That
is the unfailable-check class this milestone exists to remove.

**Verdict: CAUGHT (census half).** The RED-at-HEAD result Row 3 recorded is now GREEN, and
it turned green *because the wiring landed* — nothing else in the payload changed. Plan 03
must reproduce both endpoints with the shipped script: RED on an unwired tree, GREEN here.

**Revert:** nothing to revert — this row plants nothing. The scratch runner lives outside
the repository; `git status --porcelain -- packages` shows only the three intended
`package.json` renames.

---

## Row 7 — UNIT-04 / **CATCH** — the shipped guard, four injections

**Pairs with:** `## Row 2 — UNIT-04 / **BLINDNESS**` in this same file (plan 01), which
created **the same scratch workspace** — `packages/zz-scratch/` holding one test file and
an empty `scripts` object, with no `yarn install` run — and recorded `yarn test:unit` at
exit **0**, `Tasks: 21 successful, 21 total`, the string `zz-scratch` appearing exactly
once in the entire output and only on turbo's "Packages in scope" line. **The one sentence
this row exists for: the same scratch workspace that left `yarn test:unit` at exit 0 before
the guard existed now fails it by name, and turbo never starts.**

**Environment.** `2026-08-18T18:12:55Z`, branch `feat-gsd-roadmap`, git HEAD `84a9a2745`
(this plan's task-1 commit: `scripts/assert-unit-test-coverage.mjs` plus the two root
script keys). turbo 2.8.17, vitest 3.2.4, Node v24.14.1, Yarn 4.13.0. Root `test:unit` is
now `yarn assert:unit-coverage && turbo run test:unit`.

**Clean-tree baseline, quoted because two later rows are read against it** — the guard's
own summary line, which is also the "counted, not silently dropped" record the plan asks
for (**0 skipped non-workspace directories** under `packages` and `apps`):

```
Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 0 violation(s), 12 workspace(s) executed, 3 unwired. Scanned 15 workspace(s) under packages, apps; 0 non-workspace director(ies) skipped. Total: 0 violation(s).
```

---

### Injection A — the ROADMAP SC-4 shape: test file, no script

`packages/zz-scratch/package.json` (`@openvaa/zz-scratch`, `private: true`, `"scripts": {}`)
and `packages/zz-scratch/src/a.test.ts` (one passing assertion). **No `yarn install` run** —
byte-for-byte the shape Row 2 planted.

```sh
yarn test:unit
```

**Exit code: `1`** (Row 2's was `0`). The **entire** output, verbatim — this is short
because of what is *missing* from it:

```
[ERROR] Check 1 — declared coverage: 1 workspace(s) contain test files but declare NO `test:unit` script, so `turbo run test:unit` runs nothing for them and their tests execute from NO command:
  - @openvaa/zz-scratch  (packages/zz-scratch)
Add `"test:unit": "vitest run"` to each package.json, or delete the test files. Leaving them in place implies coverage that does not exist: five workspaces sat in exactly this state holding 18 test files and 140 tests that no CI command executed (phase 141, requirement UNIT-04).

Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Check 1 (declared coverage): 1 violation(s); Check 2 (turbo execution): 0 violation(s), 12 workspace(s) executed, 4 unwired. Scanned 16 workspace(s) under packages, apps; 0 non-workspace director(ies) skipped. Total: 1 violation(s).
```

**The fail-closed property, measured.** `grep -cE '(^• turbo|^• Packages in scope|^• Running|^ Tasks:|:test:unit:|:build:)'` over the full output returns **`0`**. Not one turbo
preamble line, not one task line, not one summary line. Row 2's output contained all of
them (`• Running test:unit in 16 packages`, `Tasks: 21 successful, 21 total`). **turbo never
started**, which is exactly what the `&&` composition buys: a non-zero guard means the suite
it gates does not run at all, so there is no partially-green output to misread.

Note also `12 workspace(s) executed, 4 unwired`: Check 2 correctly does **not** fire here.
The scratch workspace declares no `test:unit`, so turbo marking it `<NONEXISTENT>` is the
right answer, and Check 1 is the direction that owns this defect. The two checks do not
double-report.

---

### Injection B — remedy direction 1: add the script

`"test:unit": "vitest run"` added to the scratch `package.json`; the test file left in place.

```sh
node scripts/assert-unit-test-coverage.mjs
```

**Exit code: `0`**, and the census moves by exactly one:

```
Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 0 violation(s), 13 workspace(s) executed, 3 unwired. Scanned 16 workspace(s) …
```

Executed **12 → 13**, unwired **4 → 3** — the scratch workspace's turbo entry moved off the
`<NONEXISTENT>` sentinel because the script now exists. The guard goes quiet the moment the
remedy lands.

**A measured obstruction, recorded rather than smoothed over.** The first `yarn test:unit`
after adding the script exited **1**, and *not* because of the guard — the guard printed a
clean summary and turbo then ran:

```
@openvaa/zz-scratch:test:unit: Internal Error: Package for @openvaa/zz-scratch@workspace:packages/zz-scratch not found in the project
Failed:    @openvaa/zz-scratch#test:unit
```

Yarn cannot dispatch `yarn run test:unit` inside a workspace it has never installed.
Research **run H's measured fact — "a scratch workspace needs no `yarn install` to be picked
up" — holds for turbo's task graph and for this guard, and does NOT extend to executing the
script.** That is a genuine extension of run H, and it matters for anyone reproducing this
row: the guard sees an uninstalled workspace (which is the property that makes injection A
possible at all), but yarn will not run its script until the workspace is registered.

Both halves of "the test actually runs" were therefore observed:

1. **Directly**, without touching the lockfile — `npx vitest run` inside
   `packages/zz-scratch`: `✓ src/a.test.ts (1 test)`, `Test Files 1 passed (1)`,
   `Tests 1 passed (1)`. The declared command does execute the test.
2. **End to end through the root command**, after one `yarn install` registered the
   workspace (a 6-line `yarn.lock` addition):

   ```sh
   yarn test:unit
   ```

   **Exit code: `0`.** Verbatim:

   ```
   @openvaa/zz-scratch:test:unit:  ✓ src/a.test.ts (1 test) 1ms
   @openvaa/zz-scratch:test:unit:  Test Files  1 passed (1)
   @openvaa/zz-scratch:test:unit:       Tests  1 passed (1)

    Tasks:    27 successful, 27 total
   ```

   Turbo's total moved 26 → 27: the scratch package's test is now executed by the repository's
   unit-test command. **Both directions of SC-4's first remedy observed.**

   The lockfile was restored afterwards by removing the workspace and re-running
   `yarn install`; `cmp yarn.lock <baseline>` reports **byte-identical**, and
   `git status --porcelain -- yarn.lock` returns **0 lines**.

---

### Injection C — remedy direction 2: delete the test file

The `test:unit` script removed from the scratch `package.json` again **and**
`src/a.test.ts` deleted, leaving a workspace with no tests and no script.

```sh
node scripts/assert-unit-test-coverage.mjs
```

**Exit code: `0`**:

```
Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 0 violation(s), 12 workspace(s) executed, 4 unwired. Scanned 16 workspace(s) …
```

This is the shape `@openvaa/dev-tools`, `@openvaa/shared-config` and `@openvaa/supabase-types`
hold today, and it **must** stay passing: a workspace with zero test files and no `test:unit`
script is not a coverage hole, and per D-12 a bare `vitest run` in one would exit 1 for an
unrelated reason (research Pitfall 3). It is counted in the `unwired` total (3 → 4) and
reported, not silently absorbed.

Then `rm -rf packages/zz-scratch`:

```
Check 1: 0 violation(s); Check 2: 0 violation(s), 12 workspace(s) executed, 3 unwired. Scanned 15 workspace(s) …  Total: 0 violation(s).
```

**Exit code: `0`**, back to the clean-tree baseline quoted at the top of this row.

**All three of ROADMAP SC-4's directions are now observed:** test file + no script → fails
naming the workspace (A); add the script → passes, and the test runs (B); delete the test
file → passes (C).

---

### Injection D — a REAL package, not a fixture

The `test:unit` key removed from `packages/llm/package.json`, every other key untouched.
The single-line diff:

```diff
     "typecheck": "tsc --noEmit",
-    "test:unit": "vitest run",
     "test:watch": "vitest"
```

```sh
node scripts/assert-unit-test-coverage.mjs
```

**Exit code: `1`.** Verbatim:

```
[ERROR] Check 1 — declared coverage: 1 workspace(s) contain test files but declare NO `test:unit` script, so `turbo run test:unit` runs nothing for them and their tests execute from NO command:
  - @openvaa/llm  (packages/llm)
Add `"test:unit": "vitest run"` to each package.json, or delete the test files. Leaving them in place implies coverage that does not exist: five workspaces sat in exactly this state holding 18 test files and 140 tests that no CI command executed (phase 141, requirement UNIT-04).

Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Check 1 (declared coverage): 1 violation(s); Check 2 (turbo execution): 0 violation(s), 11 workspace(s) executed, 4 unwired. Scanned 15 workspace(s) under packages, apps; 0 non-workspace director(ies) skipped. Total: 1 violation(s).
```

The message names the package (`@openvaa/llm`) **and** its directory (`packages/llm`), and
the census moves the expected single step: executed **12 → 11**, unwired **3 → 4**.

**Two things this injection proves that injection A cannot.** First, the guard fires on the
tree it actually protects, not only on a scratch shape planted to satisfy it — this is the
literal pre-plan-02 state of `@openvaa/llm`, one of the five packages this phase wired.
Second, and this is the exact-key-equality property: `packages/llm` **still declares
`"test:watch": "vitest"`** throughout this injection, and the guard fails anyway. A near-name
does not satisfy the check. That matters because three of the five packages this phase wired
carried a bare `test` script holding the identical `vitest run` command and were still
invisible to CI, for precisely this reason.

Restored by writing back the saved file: `git diff --exit-code -- packages/llm/package.json`
exits **0** (byte-identical to its post-plan-02 state), and the guard returns to exit **0**
at the clean-tree baseline.

---

**Verdict: CAUGHT.** The workspace shape that left the repository at exit 0 / 21-of-21
successful in Row 2 now fails the repository's unit-test command by name, before turbo starts,
in both the scratch and the real-package instantiation — and passes, correctly and quietly,
in both remedy directions and on the zero-test workspace shape.

**Revert.** Every revert was a targeted path removal or a targeted key restore: `rm` of the
exact created scratch paths, and a write-back of the saved `packages/llm/package.json`. No
`git checkout .`, no `git stash`, no `git clean` at any point (T-141-09). Final state:
`git status --porcelain` shows no `packages/` or `package.json` entry, `packages/zz-scratch`
does not exist, and `yarn.lock` is byte-identical to its pre-row state.

---

## Row 8 — UNIT-02 / **CATCH**, part 2 — the shipped Check 2, three injections

**Pairs with:** `## Row 3 — UNIT-02 / **DISCRIMINATION PROOF** (naive vs. discriminating)`
and `## Row 6 — UNIT-02 / **CATCH**, part 1 — the census transition`, both in this same
file. Row 3 computed both cross-check variants from one payload on the fully unwired tree
(naive GREEN, discriminating RED naming five packages); Row 6 recomputed them after the
wiring landed (naive **unmoved** at GREEN, discriminating RED → GREEN). This row closes the
pair Row 6 explicitly left open: **the shipped `scripts/assert-unit-test-coverage.mjs`
Check 2, observed RED against inputs the naive variant waves through.**

**Environment.** `2026-08-18`, branch `feat-gsd-roadmap`, git HEAD `beb822d0e` (task 2's
ledger commit; the guard source is unchanged from task 1's `84a9a2745`). turbo 2.8.17,
vitest 3.2.4, Node v24.14.1, Yarn 4.13.0.

---

### Injection E — the drifted root (the declares-but-not-executed direction)

A scratch workspace at `tools/zz-scratch/` — `@openvaa/zz-tools-scratch`, `private: true`,
**declaring `"test:unit": "vitest run"`** — plus one test file, and `tools` temporarily added
as a third element of the guard's `WORKSPACE_ROOTS` constant **without** adding `tools/*` to
the root `package.json` `"workspaces"` globs. This is exactly the drift D-16's single-array
shape exists to make visible: a root the guard scans that turbo's graph does not cover.

```sh
node scripts/assert-unit-test-coverage.mjs
```

**Exit code: `1`.** Verbatim:

```
[ERROR] Check 2 — turbo execution: 1 workspace(s) declare a `test:unit` script that `turbo run test:unit` does NOT execute, so their tests run from NO command even though their package.json says otherwise:
  - @openvaa/zz-tools-scratch  (tools/zz-scratch)  — absent from turbo's task graph entirely
The likely cause is drift between the two lists that must agree: a root named in WORKSPACE_ROOTS (scripts/assert-unit-test-coverage.mjs) that the root package.json "workspaces" globs do not cover, so this guard scans the workspace and turbo never sees it. Either add the root to those globs, or remove it from WORKSPACE_ROOTS. Leaving it implies coverage that does not exist (phase 141, requirement UNIT-02 / D-17).

Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — Check 1 (declared coverage): 0 violation(s); Check 2 (turbo execution): 1 violation(s), 12 workspace(s) executed, 3 unwired. Scanned 16 workspace(s) under packages, apps, tools; 0 non-workspace director(ies) skipped. Total: 1 violation(s).
```

Note which check fires. **Check 1 is silent** — the workspace declares the script, so the
declared-coverage direction is satisfied — and the defect is caught only by the execution
direction. That is the pairing argument made concrete: Check 1 alone would pass this tree.
The summary line also names the third scanned root (`packages, apps, tools`), so the drift is
visible in the output and not only in the error.

The **documented alternative** injection (narrowing the root `workspaces` array to drop
`apps/*` and observing Check 2 name the three `apps/*` workspaces) was **not needed**: this
injection was conclusive on the first run. Recorded per the plan's instruction to say which
was used and why.

**Revert.** `WORKSPACE_ROOTS` restored to its two-element D-16 form and `rm -rf tools/zz-scratch`
(the now-empty `tools/` removed with `rmdir`). `git diff --exit-code -- scripts/assert-unit-test-coverage.mjs`
exits **0**; the guard returns to exit **0**.

---

### Injection F — the discrimination delta, re-measured on the WIRED tree

`packages/zz-scratch/` recreated (test file, **no** `test:unit` script), then **ONE**
`--dry=json` payload captured and both variants computed from it, using predicates and a
test-bearing enumeration byte-identical to rows 3 and 6:

```sh
npx turbo run test:unit --dry=json > dry-F.json     # EXIT=0, 553,746 bytes
node crosscheck.cjs dry-F.json <repo-root>
```

Verbatim runner output:

```
test-bearing workspaces (12): @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core, @openvaa/data, @openvaa/dev-seed, @openvaa/filters, @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/supabase, @openvaa/zz-scratch
tasks[] entries: 16
executed (12): @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core, @openvaa/data, @openvaa/dev-seed, @openvaa/docs, @openvaa/filters, @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/supabase
unwired/<NONEXISTENT> (4): @openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types, @openvaa/zz-scratch
NAIVE          unaccounted (0): (none)  -> GREEN
DISCRIMINATING unaccounted (1): @openvaa/zz-scratch  -> RED
```

And the shipped guard against that same tree — **exit code `1`**, naming the same workspace:

```
[ERROR] Check 1 — declared coverage: 1 workspace(s) contain test files but declare NO `test:unit` script …
  - @openvaa/zz-scratch  (packages/zz-scratch)
… Check 1 (declared coverage): 1 violation(s); Check 2 (turbo execution): 0 violation(s), 12 workspace(s) executed, 4 unwired. Scanned 16 workspace(s) … Total: 1 violation(s).
```

Two things to read carefully here.

1. **The naive variant is STILL green.** A workspace holding a test file that no command runs
   is present in `tasks[]`, so "does it appear in the graph?" answers yes. That is the third
   independent situation in this ledger in which the naive predicate reports "0 unaccounted"
   over a real, live coverage hole (rows 3 and 6 are the other two).
2. **The shipped guard is red — via Check 1, not Check 2.** Check 2's violation count is 0,
   and correctly so: the scratch workspace declares no `test:unit`, so "declares ⟹ executed"
   is vacuously satisfied and the defect belongs to the other direction. The discriminating
   *projection* (`command !== '<NONEXISTENT>'` against the test-bearing set) names it, and so
   does Check 1. The two checks partition the invariant rather than duplicating it — which is
   the whole reason both exist.

**Counts asserted, not merely filtered** (research assumption A4). On the clean wired tree,
from a payload captured after the scratch workspace was removed:

```
tasks[] entries: 15
executed (12): @openvaa/app-shared, @openvaa/argument-condensation, @openvaa/core, @openvaa/data, @openvaa/dev-seed, @openvaa/docs, @openvaa/filters, @openvaa/frontend, @openvaa/llm, @openvaa/matching, @openvaa/question-info, @openvaa/supabase
unwired/<NONEXISTENT> (3): @openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types
NAIVE          unaccounted (0): (none)  -> GREEN
DISCRIMINATING unaccounted (0): (none)  -> GREEN
```

**Exactly 12 executed / 3 unwired**, matching Row 6's census, and the shipped guard's own
summary line reports the same two integers on every clean run. The delta the scratch
workspace introduces is exactly `+1 unwired` (3 → 4) and `+1 tasks[]` entry (15 → 16), with
executed unchanged at 12 — the one-workspace move and nothing else.

**Revert.** `rm -rf packages/zz-scratch`; guard back to exit **0** at 12/3.

---

### Injection G — the broken dry run (the empty / unparseable branch)

The `test:unit` task definition temporarily removed from `turbo.json`:

```diff
-    "test:unit": {
-      "dependsOn": ["build"],
-      "cache": false
-    },
```

```sh
node scripts/assert-unit-test-coverage.mjs
```

**Exit code: `1`.** The **entire** output, verbatim:

```
Unit-test coverage guard: Check 2 — turbo execution: `npx turbo run test:unit --dry=json` FAILED, so the execution half of the invariant could not be checked. A dry run that cannot be obtained is never read as "everything is accounted for" — this fails closed. Check that the `test:unit` task is still defined in turbo.json. Captured output:
• turbo 2.8.17
  x Missing tasks in project
  `->   x Could not find task `test:unit` in project
```

A **named** failure that says which of the two operations failed (the capture, not the parse),
quotes the head of the captured output so the cause is diagnosable, and points at the file to
look in. It is **not** a raw uncaught stack trace, and — the property that matters — the exit
code is **not 0**. An input the guard cannot read is never read as "everything is accounted
for". The same fail-closed treatment covers the other two branches by construction: an
unparseable payload and a payload whose `tasks` field is not an array each exit 1 with their
own named message, and a payload yielding **zero** executed `test:unit` tasks does too.

**Revert.** `turbo.json` restored from a saved copy; `git diff --exit-code -- turbo.json`
exits **0** and the guard returns to exit **0**.

---

### Closing the UNIT-02 pair

| Situation | naive predicate (presence in `tasks[]`) | shipped Check 2 / discriminating projection |
|---|---|---|
| Unwired tree at HEAD `6c10d63d0` (Row 3) | **GREEN** — 0 unaccounted | **RED** — 5 workspaces named |
| Wired tree (Row 6) | **GREEN** — 0 unaccounted, output byte-identical to the row above | **GREEN** — 0 unaccounted |
| Wired tree + unwired scratch workspace (injection F) | **GREEN** — 0 unaccounted | **RED** — `@openvaa/zz-scratch` named |
| Declares the script, root outside the `workspaces` globs (injection E) | n/a — the workspace is in no graph to be present in | **RED** — `@openvaa/zz-tools-scratch` named |
| Dry run unobtainable (injection G) | — | **RED** — named precondition failure, exit 1 |

**The statement this pair exists to support:** the naive cross-check was green on a fully
unwired tree, and is *still* green with an unwired scratch package present, while the shipped
check is red in both situations. Its output never moved across a change that took five
workspaces from 0 to 140 executed tests. **That is the evidence that the filter — the
comparison against turbo's `<NONEXISTENT>` sentinel — is doing the work, and that task
presence is doing none of it.** A guard built on the naive predicate would have shipped green
through this entire phase and would still be green if all five scripts were deleted tomorrow.

**Turbo-version caveat, carried forward not dropped (research assumption A4).** Check 2's
stability rests on `"command": "<NONEXISTENT>"` remaining turbo's way of reporting a missing
script; that is **observed at turbo 2.8.17 only**, and the sentinel is hoisted into the
`TURBO_NONEXISTENT` constant so a change needs one edit. The mitigation A4 asks for is
recorded in two forms:

1. **Count assertion** — the guard prints its executed/unwired integers on every run (12 / 3
   on the clean tree, asserted above from an independent payload), so a turbo that started
   *omitting* unwired entries instead of marking them would show as a census change rather
   than as silence.
2. **The equality read backwards** — the guard additionally fails if turbo reports a runnable
   `test:unit` command for a workspace that declares no such script. If a future turbo stops
   using the sentinel, the three legitimately-unwired workspaces (`dev-tools`,
   `shared-config`, `supabase-types`) would be misread as executed and land in that list, so
   the contract change turns the guard **RED rather than blind**. Its message names
   `TURBO_NONEXISTENT` and cites assumption A4 directly.

**Verdict: CAUGHT.** The shipped Check 2 has been observed red against a drifted root, red
against a broken dry run, and discriminating where the naive implementation is green — with
every injection reverted and `git diff --exit-code -- turbo.json scripts/assert-unit-test-coverage.mjs`
exiting 0 afterwards. All reverts were targeted path removals or saved-copy restores; no
`git checkout .`, no `git stash`, no `git clean` at any point (T-141-09).

---

## Ledger status

| Requirement | BLINDNESS | CATCH | Owner of the missing half |
|---|---|---|---|
| UNIT-01 | ✅ Row 1 (exit 0, `zz-plant` count 0) | ✅ Rows 4 + 5 (5 runs, 5 non-zero exits) | — complete |
| UNIT-02 | ✅ Row 3 (naive GREEN on an unwired tree) | ✅ Row 6 (census 7/8 → 12/3; naive unmoved, discriminating RED → GREEN) + ✅ Row 8 (shipped Check 2 red on injections E, F, G) | — complete |
| UNIT-04 | ✅ Row 2 (exit 0 with a test-bearing unwired workspace) | ✅ Row 7 (4 injections: A red by name with turbo never started, B/C green in both remedy directions, D red on a real package) | — complete |

**All three pairs are complete.** Each requirement in this phase has been observed both blind
(before the work) and catching (after it), against the same defect in the same shape, so no
UNIT-* guard here rests on a single observation.
