---
title: Eight packages invoke `eslint` in their `lint` script without declaring it — the wider class the declared-binaries guard deliberately does not cover
created: 2026-08-28
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 01
priority: low
suggested_phase: future-build-tooling
keywords: [eslint, tsup, declared-binaries, assert-declared-binaries, SCRIPT_SCOPE, hoisting, nodeLinker, node-modules, shared-config, devDependencies, catalog, REVIEW-CFG-01, OQ-3]
---

# Undeclared `eslint` in eight packages' `lint` scripts

## Origin

Phase 153 Plan 01 built `scripts/assert-declared-binaries.mjs` and scoped it, via the module
constant `SCRIPT_SCOPE = ['build']`, to `build` scripts only. That scope is the literal wording of
REVIEW-CFG-01 — *"A workspace that invokes a binary in its `build` script"* — and it is what makes
the requirement's two halves the same job: eight violations, eight declarations, guard green.

Widening the scope to every script surfaces a second, distinct class that this phase deliberately
did **not** fix. It is recorded here rather than hidden, because narrowing the guard to the literal
string `tsup` in order to make the wider class invisible would be exactly the "green that means
nothing" this milestone exists to remove.

## The wider class, measured

The same eight packages —

```
packages/app-shared
packages/argument-condensation
packages/core
packages/data
packages/filters
packages/llm
packages/matching
packages/question-info
```

— each carry a `lint` script of the form `eslint --flag v10_config_lookup_from_file src/`, and not
one of them declares `eslint` in any of its own dependency blocks.

They are **not** free-riding on hoisting the way they were with `tsup`, which is the reason this is
a weaker finding than REVIEW-CFG-01 rather than the same finding twice. All eight declare
`"@openvaa/shared-config": "workspace:^"`, and `packages/shared-config/package.json` lists
`"eslint": "catalog:"` in its **`dependencies`** — not its `devDependencies`. So `eslint` is
reachable through a declared workspace dependency's own runtime dependency graph. `tsup` had no
such path: its only declaration anywhere in the repo was the root manifest's, and the eight builds
resolved it purely off the hoisted root `node_modules/.bin`.

By contrast `packages/dev-seed` and `packages/dev-tools` both declare `"eslint": "catalog:"`
directly, so the repo is already inconsistent about which of the two shapes it wants.

The measured counts, taken against the tree at the close of Plan 01:

| Scope | Violations | Composition |
|---|---|---|
| `build` only (shipped) | 0 | the eight `tsup` violations were fixed by Plan 01 |
| every script | 11 | `eslint` × 8, plus 3 spurious rows (see below) |

Before Plan 01's fix the same two scopes read **8** and **19**.

## The change that would surface it — and why it is NOT a one-line change

The planning documents describe widening the guard as a one-line change: replace
`SCRIPT_SCOPE = ['build']` with the full `Object.keys(scripts)` set. **That is measured to be
false**, and the correction is the main reason this todo is worth reading before anyone acts on it.

Widening the scope also requires making the segment splitter quote-aware. The extraction rule
splits script values on shell control operators and on newlines, and takes the first surviving
token of each segment as the invoked binary. That is exact at `build` scope — zero false positives
across all sixteen workspaces, verified twice — but it has no notion of quoting, so a multi-line
single-quoted argument leaks its continuation lines into the segment list as if each were a fresh
command. The root manifest's `test:unit:watch` is precisely that shape:

```
echo '###################################\nNB! Running only tests in /packages\n###################################\n' && vitest
```

which the current rule decomposes into the first tokens `echo`, `NB!`, `###################################`,
`'`, `vitest` — three of which are reported as undeclared binaries. The research note claiming this
construct is "handled by newline split + ambient `echo`" holds only for the *first* of its segments.

So the real shape of the work is:

1. Teach the splitter to respect single and double quotes (a small tokeniser, not a regex split).
2. Re-measure — the `eslint` count should stay at 8 and the three spurious rows should disappear.
3. Widen `SCRIPT_SCOPE`.
4. Add `"eslint": "catalog:"` to the same eight manifests (8 further edits), run `yarn install`, and
   confirm the lockfile delta is descriptor-only.

## Recommendation

Low priority. The class is real under a strict reading of "declare what you run", and defensible as
excluded under a looser one, because the dependency path exists. Decide the policy question first —
*does reaching a binary through a declared workspace dependency's `dependencies` count as declaring
it?* — because the answer also governs every future package added to `packages/`. If the answer is
no, do the four steps above. If the answer is yes, the guard's current `build` scope is not a
compromise but the correct scope, and this todo closes as WONT-IMPLEMENT with that reasoning
recorded.

Either way, do **not** resolve it by narrowing the guard to a hard-coded binary name.
