---
phase: 141
requirement: UNIT-03
measured: 2026-08-18
head: 8b565af22
turbo: 2.8.17
vitest: 3.2.4
verdict: 5/5 PASS — all five candidate workspaces authorised for wiring
---

# Phase 141 — UNIT-03 Measurement Record

This is the record UNIT-03 actually asserts: **every package wired in was confirmed
green before its `test:unit` script was added.** The property being established is
**git order**, not the numbers in the table below. This file's commit touches no
`package.json` and is therefore a strict ancestor of every wiring commit plan 02
makes.

Per D-14, the D-01 table in this phase's CONTEXT document and Table 2 in its RESEARCH
document are **feasibility evidence, not this record**. Every verdict below traces to a command
executed inside this phase, at HEAD `8b565af22`, with its exit code captured at the
time it ran.

**Ancestry check (the deliverable).** The ordering oracle is ancestry plus hash
inequality — never a timestamp comparison, because two commits made in the same
second carry equal timestamps. For each of the five `package.json` paths, iterated
in the fixed lexicographic order of the verdict table:

```sh
REC=$(git log --format='%H' -1 -- .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-MEASUREMENT.md)
for p in argument-condensation core llm matching question-info; do
  WIRE=$(git log --format='%H' -1 -- "packages/$p/package.json")
  git merge-base --is-ancestor "$REC" "$WIRE" && [ "$REC" != "$WIRE" ] \
    && echo "$p OK" || echo "$p VIOLATION"
done
```

Both conditions are required: `--is-ancestor` alone is satisfied by the same commit
(a commit is its own ancestor), so the hash inequality is what rules out the
same-commit case. Row order above and iteration order here are the same fixed
lexicographic sequence, so re-running produces byte-identical output.

## Per-package verdicts

Preceded by `yarn build` → `Tasks: 14 successful, 14 total`, `14 cached, 14 total`,
`FULL TURBO` (195 ms). Every row below is one `npx vitest run` executed from that
package's own directory, in lexicographic workspace order.

| Workspace | Directory | Test files | Tests | Exit code | Verdict | Notes |
|---|---|---:|---:|---:|---|---|
| `@openvaa/argument-condensation` | `packages/argument-condensation` | 6 passed (6) | 30 passed (30) | 0 | **PASS** | 437 ms. Benign stdout `Found 1 pros!` / `Found 1 cons!` and stderr `Only 1 comments for question "Visualization test question" …` from `tests/condensation/condenseQuestions.test.ts` — informational, not failures. |
| `@openvaa/core` | `packages/core` | 3 passed (3) | 8 passed (8) | 0 | **PASS** | 189 ms. Empty stderr. |
| `@openvaa/llm` | `packages/llm` | 2 passed (2) | 39 passed (39) | 0 | **PASS** | 339 ms. Empty stderr. |
| `@openvaa/matching` | `packages/matching` | 5 passed (5) | 43 passed (43) | 0 | **PASS** | 253 ms. Empty stderr. |
| `@openvaa/question-info` | `packages/question-info` | 2 passed (2) | 20 passed (20) | 0 | **PASS** | 344 ms. Benign stderr `[PromptRegistry] Package 'question-info' already registered, skipping.` emitted once per test file — idempotent-registration notice, not a failure. |
| **total** | — | **18** | **140** | **all 0** | **5/5 PASS** | 0 failures across all five workspaces. |

## Commands run

Verbatim, in execution order, from the repository root:

```sh
yarn build
cd packages/argument-condensation && npx vitest run
cd packages/core                  && npx vitest run
cd packages/llm                   && npx vitest run
cd packages/matching              && npx vitest run
cd packages/question-info         && npx vitest run
```

Each `npx vitest run` was executed in its own subshell so the working directory did
not leak between rows; the exit code was captured immediately via `$?`. The "Test
Files" and "Tests" columns above are the verbatim summary lines from each run's
stdout; the Notes column reproduces every non-empty stdout/stderr line that was not
part of vitest's own summary.

Supporting checks executed in the same task:

```sh
git rev-parse --short HEAD                        # -> 8b565af22
grep -rn "apiKey" packages/llm/tests packages/question-info/tests \
                  packages/argument-condensation/tests
grep -rn "process\.env" packages/<p>/src packages/<p>/tests   # for each of the five
```

## Why no skip contract is written

UNIT-02 has two branches: wire the package, **or** give it a documented skip contract
naming the blocker. The second branch is **unused this phase**, because all three
Experimental packages (`llm`, `question-info`, `argument-condensation`) measured green
above with **no network access and no API key**. Three facts establish that, all
re-checked in this task rather than carried over:

1. **Prompt loading is local-filesystem, not network.** `packages/question-info/tests/setup.ts:10-14`
   calls `registerPrompts({ promptsDir: path.join(__dirname, '../src/prompts'), controller: noOpController })`,
   and `packages/argument-condensation/tests/setup.ts:10-14` does the same against
   `'../src/core/condensation/prompts'`. Both resolve `__dirname` from `import.meta.url`
   and read from disk.
2. **Every `apiKey` in these tests is a literal.** The complete set of hits:
   `packages/llm/tests/llmProvider.test.ts:81` and `:117`, and
   `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:20`
   and `tests/unit/handleQuestion.test.ts:13` — all four are the string
   `'test-api-key'`. No test reads a key from the environment.
3. **No test-path `process.env` read exists in any of the five packages.** A grep over
   `src/` and `tests/` for each returned 0 hits for `argument-condensation`, `core`,
   `llm` and `matching`, and exactly 1 for `question-info` —
   `packages/question-info/src/core/infoGeneration.type.ts:40`, which is a line inside
   a JSDoc usage example (`*   apiKey: process.env.OPENAI_API_KEY!,`), not executable
   code. This independently retires research assumption A5.

**Had any package measured red**, it would receive a documented skip contract naming
the blocker — the specific missing key, the specific network dependency — rather than
a `test:unit` script, and plan 02 would be forbidden from wiring it. That branch is a
backstop this phase does not exercise, since the Verdict column above is 5/5 PASS.

## Wiring authorisation

Derived from the Verdict column of `## Per-package verdicts` and from nothing else.

**Plan 02 is authorised to wire all five candidate workspaces:**

- `@openvaa/argument-condensation` — rename `test` → `test:unit`
- `@openvaa/core` — add `test:unit`
- `@openvaa/llm` — rename `test` → `test:unit`
- `@openvaa/matching` — add `test:unit`
- `@openvaa/question-info` — rename `test` → `test:unit`

No workspace is skip-contracted. No workspace outside this list is authorised by this
record.

## CI invocation inventory

Resolves research assumption **A2** ("`main.yaml:70` and `:197` are the only CI paths
that run unit tests"), which was derived from a grep over **one** workflow file. The
inventory below covers **all six**.

Commands run (from the repository root):

```sh
ls -1 .github/workflows/
grep -rn "test:unit"      .github/workflows/
grep -rn "vitest"         .github/workflows/
grep -rn "turbo run test" .github/workflows/
```

### Hit table — all six workflow files, including the zeroes

Files with no hits are listed with an explicit **0** so the table is a complete census
rather than a filtered result.

| Workflow file | `test:unit` | `vitest` | `turbo run test` | Hits | Verbatim lines |
|---|---:|---:|---:|---:|---|
| `.github/workflows/claude-code-review.yml` | 0 | 0 | 0 | **0** | — |
| `.github/workflows/claude-solve-issue.yml` | 0 | 0 | 0 | **0** | — |
| `.github/workflows/claude.yml` | 0 | 0 | 0 | **0** | — |
| `.github/workflows/docs.yml` | 0 | 0 | 0 | **0** | — |
| `.github/workflows/main.yaml` | 3 | 0 | 0 | **3** | `:70` `        run: yarn test:unit`<br>`:119` `  # \`frontend-and-shared-module-validation\` job above runs \`yarn test:unit\` with` *(comment, not an invocation)*<br>`:197` `        run: yarn workspace @openvaa/dev-seed test:unit` |
| `.github/workflows/release.yml` | 0 | 0 | 0 | **0** | — |
| **total** | **3** | **0** | **0** | **3** | 2 invocations + 1 comment |

Zero hits for `vitest` and zero for `turbo run test` across the entire directory: no CI
job invokes vitest directly, and none invokes a turbo `test` task under any other name.

### (a) Invocations that pass through the root `test:unit` script

**One:** `main.yaml:70`, step *"Run Frontend and shared module tests"* in the
`frontend-and-shared-module-validation` job. It runs `yarn test:unit`, whose root value
is `turbo run test:unit`.

This is the invocation that plan 03's wrapper covers. Because the root script is
composed rather than replaced (the `lint:check` `&&`-composition precedent), every
change to it lands on this step automatically — no workflow edit is required, and no
workflow file needs to learn the guard's name.

### (b) Invocations that deliberately bypass the root script

**One:** `main.yaml:197`, step *"Run dev-seed tests (incl. the NF-01 operation budget)"*
in the separate dev-seed job — `yarn workspace @openvaa/dev-seed test:unit`.

It bypasses the root script on purpose: it exists to re-run **one already-covered
workspace** under a richer environment (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
exported from a live local Supabase), so that
`describe.skipIf(!process.env.SUPABASE_URL)` is false and the NF-01 operation budget
actually executes — the fake-guard-sweep F5 finding, per the comment block at
`main.yaml:112-125`.

**Why a single named workspace is not a coverage-hole vector.** The hole this phase
closes is *a workspace whose tests run under no CI command*. `main.yaml:197` names
`@openvaa/dev-seed` explicitly and is **additive**: `@openvaa/dev-seed` is already in
the executed set via the root script at `:70`, so this step can never be the only path
by which a workspace's tests run. It also cannot drift as workspaces are added or
removed, because it enumerates nothing — a new package cannot be silently omitted from
a step that mentions exactly one package by name. The failure mode the guard exists to
prevent (a workspace added to `packages/` with tests and no script) is unreachable
through this invocation.

### (c) Verdict on assumption A2

**A2 is CONFIRMED.** `main.yaml:70` and `main.yaml:197` are the only CI paths that run
unit tests. The third `test:unit` hit at `main.yaml:119` is inside a YAML comment
describing the `:70` step and executes nothing. The other five workflow files
(`claude-code-review.yml`, `claude-solve-issue.yml`, `claude.yml`, `docs.yml`,
`release.yml`) contain zero hits for `test:unit`, `vitest` and `turbo run test`.

The A2 statement therefore stands as written and needs no replacement. Its medium risk
rating is retired: the "two invocations" claim is now a measurement over all six files
rather than an extrapolation from one.

### Root-level local entry points

| Script | Value | In CI? |
|---|---|---|
| `test:unit` | `turbo run test:unit` | Yes — `main.yaml:70` |
| `test:unit:watch` | `echo '…NB! Running only tests in /packages…' && vitest` | **No job invokes it.** Watch-mode only. |

`test:unit:watch` runs bare `vitest` at the repository root, which picks up
`vitest.workspace.ts` — a one-line file, `export default ['packages/**/vitest.config.ts'];`
— and therefore *does* discover the tests in all five currently-unwired packages. This
is exactly why the hole is easy to miss: the tests look covered from the root, and are,
by a command CI never calls.

### `vitest.workspace.ts` is deliberately NOT a wiring surface for this phase

Three reasons, all independently sufficient:

1. **Deprecated.** Vitest 3.2.4 (the version in this repository) prints on every root
   invocation: *"The workspace file is deprecated and will be removed in the next major.
   Please, use the `test.projects` field in the root config file instead."* Building this
   phase's coverage contract on a surface scheduled for removal would put the guard on a
   deletion timer.
2. **Bypasses `dependsOn: ["build"]`.** The `test:unit` turbo task is defined as
   `{ "dependsOn": ["build"], "cache": false }`. A root `vitest` run answers to no turbo
   task and therefore runs against whatever happens to be in `dist/` — the build ordering
   that makes cross-package tests meaningful is simply absent.
3. **Replaces a per-workspace contract with a single glob.** `packages/**/vitest.config.ts`
   is a wildcard: nothing about it can fail *by name* when a workspace is missing a
   script, because it does not know what a script is. UNIT-04's whole purpose is a
   per-workspace declaration that a guard can check. Substituting a glob is the exact
   opposite of the property being built.

Neither `vitest.workspace.ts` nor `test:unit:watch` is touched by any plan in this
phase. Migrating `vitest.workspace.ts` to `test.projects` is a legitimate follow-up, not
this phase's work.
