# Phase 153: Build & Tooling Config Correctness — Research

**Researched:** 2026-08-28
**Domain:** Monorepo build/tooling configuration correctness (Yarn 4 workspaces, lint-staged/husky, Vite/Vitest config loading, GitHub Actions, git tracking hygiene)
**Confidence:** HIGH — nearly every claim below is a command run against this worktree at `22c2542e3`, with output pasted
**Tree state at measurement:** clean; `git rev-parse --abbrev-ref HEAD` → `integration/ship-12-squash`; `HEAD` → `22c2542e3`
**Nothing was committed, staged, or modified.** All scratch work ran under the session scratchpad and the tree was verified clean after every build/lint/test run.

---

## Executive Summary

Six of the eight criteria are small, well-understood edits whose exact shape is now measured. **Two are not what the CONTEXT believes them to be, and both need an operator decision before planning:**

1. **Criterion 5 (`audit-skill-drift.sh`) — the "inert script" premise is REFUTED, and the real situation is worse.** The script is *not* inert: 6 of 8 skills declare real `targets:`, and running it on this tree **exits 1** with two genuine DRIFT findings. Separately, the one CI run in which the step actually executed **failed**, printing only its banner — a *different* failure from the local one, and one that does not reproduce under macOS bash 3.2. "Observed running green" is therefore **not** a free observation; it is unfixed work of unknown size, and it is a *moving target* that four sibling phases will re-red. [VERIFIED — script run, CI log fetched]

2. **Criterion 2 (`engines` binds) — the locked mechanism does not exist.** Yarn 4.13.0 has **no** engine-check setting. Measured two ways: its 101 configuration settings contain none engine-related, and a scratch project declaring `engines: { node: ">=99" }` installs cleanly under Node 24 with no warning. Yarn's own bundled string reads *"engine checking isn't a core feature anymore"*. D-B5's artefact (ii) — "a `.yarnrc.yml` setting that makes a mismatch an error" — is unimplementable as written. [VERIFIED — `yarn config --json`, live install probe, grep of the pinned release]

Three further measurements change the plan's shape materially:

3. **The binary-declaration guard's true failing set depends entirely on its script scope.** Scoped to `build` scripts (which is what `REVIEW-CFG-01` literally says) it reports **exactly 8 violations, all `tsup`, in exactly the 8 named workspaces — zero false positives**. Scoped to *all* scripts it reports **16**: the same 8 plus **8 undeclared `eslint` invocations in the same packages' `lint` scripts**. "Add tsup to 8 workspaces" and "make the guard green" are the same job only under the `build` scope. [VERIFIED — prototype run against the real tree]

4. **`bash -c` in `.lintstagedrc.json` is load-bearing, not decorative.** lint-staged appends the staged file list to every *string* command; `bash -c 'script'` absorbs that list into the shell's positional parameters and discards it. Replacing it with the bare string breaks the hook — measured: `turbo run build --filter=… README.md` fails with *"Could not find task `README.md` in project"*. But `.husky/pre-commit` **already runs that same turbo build** on line 1, so both `bash -c` entries are redundant and can simply be **deleted**. [VERIFIED — lint-staged source at `getSpawnedTask.js:102`, turbo run]

5. **The feared `.svelte` formatting churn is ZERO files.** All 170 tracked `apps/frontend` `.svelte` files, all 16 `apps/docs` ones and all 34 `.mjs` files are already prettier-clean and eslint-clean. The "one-off churn commit" will be empty. There *is* a different, real hazard in its place: 45 `.svelte` files under `.claude/skills/**` make `prettier` **hard-error** (exit 2) when passed explicitly, which is exactly what lint-staged does. [VERIFIED]

**Primary recommendation:** plan criteria 1, 3, 4, 6, 7, 8 as mechanical edits against the measurements below; escalate criteria 2 and 5 to the operator *before* writing tasks, because each has a locked decision whose mechanism does not exist on this tree.

**Baseline (all measured this session, all GREEN):**

| Command | Result |
|---|---|
| `yarn build` | ✅ 14/14 tasks successful (13 cached) |
| `yarn lint:check` | ✅ 22/22 tasks, both assert-guards report 0 violations |
| `yarn format:check` | ✅ "All matched files use Prettier code style!" |
| `yarn test:unit` | ✅ 25/25 tasks; frontend 816 tests, dev-seed 569 tests, all passed |
| `bash .claude/scripts/audit-skill-drift.sh` | ❌ **exit 1** — 2 DRIFT (see § G) |

No baseline is red except the skill-drift script, which is criterion 5's own subject.

---

<user_constraints>
## User Constraints (from 153-CONTEXT.md)

### Locked Decisions

**D-B1** — Criterion 5 restated as *"the workflow is observed running green"*. **Do not plan an "add the script" task.** Deliverable is a real workflow run in which `.github/workflows/main.yaml:34` is observed passing — evidence of the run, not a code change.

**D-B2** — Untrack **all three** `tsbuildinfo` files plus `supabase/.branches/_current_branch`, and gitignore `*.tsbuildinfo` globally. **Do not delete the stray top-level `supabase/` directory** (option (c) not chosen).

**D-B3** — Fix the glob to `mjs,svelte` **in the same commit** that removes `bash -c`. The formatting churn lands as **its own** follow-on commit. Proof obligation: stage a deliberately mis-formatted `.svelte` file, observe the hook **pass** on the current glob and **reject** it after.

**D-B4** — A repo script that parses every workspace `package.json`, extracts binaries invoked in `scripts`, and asserts each is declared, **wired into `lint:check`**. Wiring target `package.json:35`. Phase 144's precedent asserts **chain membership**, not position (`b410d3a90`).

**D-B5** — Rename `engine`→`engines`, set `.yarnrc.yml` to error on engine mismatch, add a CI job on an out-of-range Node observed failing. **Three artefacts, not one.** Declared range: `node: ">=22"`, `yarn: "4.13"`, `npm: "please-use-yarn"`.

**D-B6** — Prefix `packages/core/src/controller/controller.ts:73`'s unused params with `_` to match the shared config's `argsIgnorePattern`.

**D-N1** — Phase 152 stays first and lands its scan in `yarn lint:check`. This phase's `lint:check` addition and 152's scan share the same chain and must not collide on ordering assumptions.
**D-N2** — Follow-up items land in `.planning/todos/pending/`, filed during the owning phase.
**D-N3** — One CONTEXT.md per phase. (Discharged.)

### Claude's Discretion

- Language and location of the binary-declaration guard (D-B4) — a Node script under the repo's existing script conventions; its exact path and output shape.
- The exact `.yarnrc.yml` key/value that makes an engine mismatch an error (D-B5) — **verify against the pinned Yarn 4.13.0 release rather than from memory.** ⚠ *Done. See § B: no such key exists.*
- The ESM replacement for `__dirname` in `apps/frontend/vitest.config.ts`, and whether the sites collapse to one derived constant.
- Commit granularity within D-B3, provided the `bash -c` removal and the glob fix land **together** and the formatting churn lands as its own commit.

### Deferred Ideas (OUT OF SCOPE)

- Writing/replacing/"restoring" `audit-skill-drift.sh` — it exists.
- Deleting the stray top-level `supabase/` directory.
- CI gates generally (`db:lint:sql`, secret scanning, dependency audit, SQL prettier parser) — **Phase 163**.
- The 817-line comment/planning-reference sweep — **Phase 152**.
- Any behavioural change to the frontend, packages, or database.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

`REVIEW-CFG-01..08` **are now defined** in `.planning/REQUIREMENTS.md` (§ "Build & Tooling Config Correctness"), resolving CONTEXT `<open>` item 1 — that open item is **stale** and the planner should not re-raise it. [VERIFIED: `.planning/REQUIREMENTS.md`, read this session]

| ID | Requirement (abridged) | Research support |
|----|------------------------|------------------|
| REVIEW-CFG-01 | A workspace that invokes a binary **in its `build` script** declares that binary in its own `devDependencies`, enforced by a guard that fails by name | § A — prototype guard measured; build-scope yields exactly the 8 `tsup` violations, zero false positives; version string and catalog convention determined |
| REVIEW-CFG-02 | `engines` (not `engine`) in root + frontend manifests, and an out-of-range Node **observed** rejected | § B — ⚠ locked mechanism does not exist in Yarn 4.13.0 (measured); alternatives ranked; CI shapes given |
| REVIEW-CFG-03 | `apps/frontend/vitest.config.ts` resolves paths without `__dirname` | § C — authoritative count **11**; why it works today (Vite `define` shim, source-cited); in-repo replacement pattern; proof command run |
| REVIEW-CFG-04 | `.lintstagedrc.json` invokes commands directly rather than through `bash -c` | § D — `bash -c` is load-bearing; the naive fix breaks the hook (measured); the husky hook already runs the same build → delete both entries |
| REVIEW-CFG-05 | Skill-drift CI step observed running green on a real workflow run | § G — ⚠ script exits 1 locally *and* failed in the only CI run that executed it; workflow does not trigger on this branch |
| REVIEW-CFG-06 | No build artefact tracked; all three `tsbuildinfo` + `supabase/.branches/_current_branch` removed; `*.tsbuildinfo` ignored | § E — tracked set confirmed, gitignore text given, untracking `_current_branch` proven safe |
| REVIEW-CFG-07 | `shared-config/README.md` drops the non-existent `^1.0.0`; `supabase-types/src/index.ts` drops `.js` specifiers | § F — README's actual instruction quoted, replacement text drafted; `moduleResolution: Bundler` makes the `.js` drop safe; 4 sites, no external consumers |
| REVIEW-CFG-08 | `.svelte` and `.mjs` linted and formatted on commit | § D — defect and fix **both proven** with lint-staged in a scratch repo; churn measured at **zero files**; a new prettier hard-error hazard found |

</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

Directives that bear on this phase (the planner must not recommend anything contradicting these):

- **E2E hard rule (cardinal failure):** no task may complete while any E2E test fails; "did not run" counts as a failure; no known-flaky exemptions. *Assessment in § I: a pure-config phase does not need a full E2E run as its gate, but the rule constrains what may be claimed.*
- **`yarn` is the package manager** (`npm: "please-use-yarn"` in the engines block). Any guard or script must be invoked through yarn scripts.
- **Never commit sensitive data.**
- **Use TypeScript strictly — avoid `any`.**
- **Check work against `.agents/code-review-checklist.md`.**
- **Svelte warning-accepted format / ESLint `// reason:` blocks** — the repo's suppression conventions, if any suppression is needed.
- **`db:*` vs `dev:*` script naming is harmonised** — a new root script must respect the existing namespaces (`assert:*` is the established namespace for guards).

Additional in-repo convention that constrains this phase (from `packages/README.md`, not CLAUDE.md):

> **Import-path policy.** TS-internal relative imports do **not** carry `.js` extensions — `import { X } from './foo'`, never `import { X } from './foo.js'`. The `module: ESNext` + `moduleResolution: Bundler` settings in `@openvaa/shared-config/ts` make the extension unnecessary, and `tsup` + `vitest` both resolve correctly without it.

[VERIFIED: `packages/README.md:18`, quoted verbatim]

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Binary-declaration guard (CFG-01) | Repo scripts (`scripts/*.mjs`) | Root `package.json` `lint:check` chain | Two identical precedents already live there (`assert-i18n-catalog-namespaces.mjs`, `assert-a11y-scan-wiring.mjs`) and are chained the same way |
| Guard's own membership assertion | Unit test (`packages/dev-seed/tests/`) | — | `ciTypecheckGate.test.ts` establishes that repo-meta specs live in dev-seed because `yarn test:unit` is `turbo run test:unit` and needs a package to run in |
| `engines` field | Manifests (`package.json` ×2) | CI (`main.yaml`) | The field is inert without a consumer; the only consumer available is CI |
| `__dirname` removal (CFG-03) | Workspace config (`apps/frontend/vitest.config.ts`) | — | Purely local to one file; the in-repo pattern already exists one directory over |
| Pre-commit glob + commands (CFG-04/08) | `.lintstagedrc.json` | `.husky/pre-commit`, `.prettierignore` | The build duplication and the prettier-parser hazard both live outside the JSON |
| Build-artefact untracking (CFG-06) | Git index + `.gitignore` | Workspace `tsconfig.json`s | Ignoring is the fix; setting `tsBuildInfoFile` into `dist/` is the *prevention* the canonical paradigm already prescribes |
| Docs/import corrections (CFG-07) | `packages/shared-config/README.md`, `packages/supabase-types/src/index.ts` | `packages/README.md` | The README that is wrong is the same one that *correctly* tells readers to declare `tsup` — CFG-07 and CFG-01 are the same defect seen from two sides |
| Skill-drift observation (CFG-05) | CI (`main.yaml:33-34`) | `.claude/skills/*/SKILL.md`, `.claude/scripts/audit-skill-drift.sh` | The step cannot be green until the script is green, and the script's greenness is a function of skill-file freshness |

---

## A. The binary-declaration guard (REVIEW-CFG-01 / D-B4)

### A.1 Existing repo-script precedents — the style the new guard must match

Both are found from `package.json:26-27`:

```
26:    "assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
27:    "assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
```
[VERIFIED: `package.json:25-27`, quoted verbatim]

`scripts/` contains exactly three files [VERIFIED: `ls -la scripts/`]:

| File | Size |
|---|---|
| `scripts/assert-a11y-scan-wiring.mjs` | 11 514 B |
| `scripts/assert-i18n-catalog-namespaces.mjs` | 7 045 B |
| `scripts/assert-unit-test-coverage.mjs` | 44 731 B |

Their shared shape, measured:

| Property | Value |
|---|---|
| Language / module system | Node, **ESM** (`.mjs`), `import { readFileSync, readdirSync } from 'node:fs'` |
| Shebang | `#!/usr/bin/env node` (line 1) — present but **not** relied on; the script entry invokes `node <path>` |
| File mode | `-rw-r--r--` — **not** executable; invoked via `node`, so no `chmod +x` needed |
| Docblock | A long `/** … */` explaining *the incident the file exists for*, the invariant in both directions, `Usage:`, and `Exit codes:` |
| Self-identifier | `const SELF = 'scripts/assert-i18n-catalog-namespaces.mjs';` (`:56`) — prefixed into every message |
| Repo-root derivation | `const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');` (`:57`) — **ESM, no `__dirname`** |
| Error format | `` console.error(`[ERROR] ${SELF}: …`) `` |
| Success format | one `console.log` summary line ending `… — N violation(s).` |
| Exit convention | `process.exitCode = violations > 0 ? 1 : 0;` at the end of `main()`, then a bare `main();` call |

[VERIFIED: `scripts/assert-i18n-catalog-namespaces.mjs:1-57` and tail; `scripts/assert-a11y-scan-wiring.mjs:64,76,84,91,98,227-231`]

Observed live output of both, from the `yarn lint:check` baseline run:

```
I18n catalog namespace guard (phase 147: CSCAN-04) — total keys: 598; candidateApp.*: 161, adminApp.*: 121, other: 316. 0 violation(s).
A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — 0 violation(s).
```

**Recommendation:** `scripts/assert-declared-binaries.mjs`, root script `"assert:declared-binaries": "node scripts/assert-declared-binaries.mjs"`, sibling in every respect above.

> **Note for the planner on comment conventions (D-N1 interaction):** the existing two guards' docblocks are full of phase numbers, decision ids and `.planning/` paths — exactly what Phase 152's REVIEW-HYG-02 sweep removes. But **`scripts/` is outside 152's scan scope**, which is `packages/**`, `apps/**` and `tests/**` [VERIFIED: `.planning/REQUIREMENTS.md`, REVIEW-HYG-02 text]. The new guard's docblock may therefore follow the existing style. Its **membership unit test**, however, will live in `packages/dev-seed/tests/` (§ H), which **is** in 152's scope — that file's comments must carry no phase numbers or planning paths.

### A.2 Enumerating workspaces — what actually works here

`yarn workspaces list --json` works and is authoritative [VERIFIED — run this session]:

```
{"location":".","name":null}
{"location":"apps/docs","name":"@openvaa/docs"}
{"location":"apps/frontend","name":"@openvaa/frontend"}
{"location":"apps/supabase","name":"@openvaa/supabase"}
{"location":"packages/app-shared","name":"@openvaa/app-shared"}
{"location":"packages/argument-condensation","name":"@openvaa/argument-condensation"}
{"location":"packages/core","name":"@openvaa/core"}
{"location":"packages/data","name":"@openvaa/data"}
{"location":"packages/dev-seed","name":"@openvaa/dev-seed"}
{"location":"packages/dev-tools","name":"@openvaa/dev-tools"}
{"location":"packages/filters","name":"@openvaa/filters"}
{"location":"packages/llm","name":"@openvaa/llm"}
{"location":"packages/matching","name":"@openvaa/matching"}
{"location":"packages/question-info","name":"@openvaa/question-info"}
{"location":"packages/shared-config","name":"@openvaa/shared-config"}
{"location":"packages/supabase-types","name":"@openvaa/supabase-types"}
```

16 workspaces + the root. Two gotchas:

1. **The root workspace has `"name": null`** — the root `package.json` declares no `name` field [VERIFIED: root `package.json` contains `"private": true` then `"scripts"`, no `name`]. A guard keying reports on workspace *name* will print `null`/`undefined` for the root. Key on **location**.
2. Spawning `yarn workspaces list` from inside a guard that `lint:check` already runs under yarn adds a Yarn process per invocation. The cheaper, dependency-free equivalent — used by the prototype below and matching the existing guards' style of reading the filesystem directly — is:

```js
const locations = ['.', ...['apps','packages'].flatMap(d =>
  readdirSync(d).filter(n => existsSync(path.join(d, n, 'package.json'))).map(n => `${d}/${n}`))];
```

This reproduces the `yarn workspaces list` result exactly [VERIFIED — both enumerations compared this session]. It is equivalent to the root manifest's `"workspaces": ["packages/*", "apps/*"]` [VERIFIED: root `package.json`], and reading that field rather than hard-coding `apps`/`packages` is the more honest form.

### A.3 The binary-extraction rule, and its true failing set — **the headline measurement**

A prototype guard was written to `<scratchpad>/probe2.mjs` and run against the real tree. Rule:

1. Split each script value on shell control operators `&&`, `||`, `|`, `;`, `&`, and newlines; strip parentheses.
2. In each segment, skip leading `VAR=value` env prefixes and leading `-flags`; the first remaining token is *the invoked binary*.
3. Discard tokens containing `/` (path invocations such as `node_modules/.bin/tsc` — the workspace is not claiming a PATH binary).
4. Discard an **ambient** allowlist: package managers and interpreters (`yarn npm npx pnpm node sh bash zsh env exec`) and POSIX coreutils/builtins (`echo printf cat cd cp mv rm mkdir rmdir touch ln chmod ls find xargs test [ true false set export pwd sleep sed awk grep egrep tr cut sort uniq wc head tail tee which dirname basename`).
5. Discard tokens equal to one of the workspace's own script names (bare self-reference).
6. For every survivor, assert it is among the **bin names provided by a declared dependency**: for each name in the workspace's `dependencies`/`devDependencies`/`peerDependencies`/`optionalDependencies`, resolve `<ws>/node_modules/<dep>/package.json` then `<root>/node_modules/<dep>/package.json` and read its `bin` field (string form → the package's unscoped name; object form → its keys).

Step 6 is what makes the guard honest rather than a name-match: `tsc` is provided by `typescript`, `svelte-kit` by `@sveltejs/kit`, `playwright` by `@playwright/test`, `changeset` by `@changesets/cli`. A hard-coded alias table would rot; reading `bin` cannot.

**Measured results, three scopes, same tree:**

| Scope | Violations | Composition |
|---|---|---|
| `build` scripts only | **8** | `tsup` × 8, in exactly `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}` |
| `build`, `lint`, `typecheck`, `test:unit` | **16** | the above 8 + `eslint` × 8, in the *same* 8 packages |
| **all** scripts | **16** | identical to the row above |

Build-only output, verbatim:

```
VIOLATIONS: 8
  packages/app-shared          build   tsup | tsup
  packages/argument-condensation build   tsup | tsup
  packages/core                build   tsup | tsup
  packages/data                build   tsup | tsup
  packages/filters             build   tsup | tsup
  packages/llm                 build   tsup | tsup
  packages/matching            build   tsup | tsup
  packages/question-info       build   tsup | tsup
```

**Zero false positives at build scope, zero extras.** The rule survives every awkward construct present in the real tree:

| Construct | Where | Handled by |
|---|---|---|
| `yarn <script>` self-reference | root × ~20 | ambient `yarn` |
| `yarn workspace @openvaa/X <script>` | root × 12 | ambient `yarn` |
| `turbo run build --filter='./packages/*'` | root | `turbo` declared at root |
| `&&` chains | most scripts | segment split |
| Subshell + `[ -d … ] && … || true` | `apps/frontend` `build` | paren strip + ambient `[`, `mkdir`, `cp`, `true` |
| Path invocation `node_modules/.bin/tsc` | root `typecheck:tests` | `/` filter |
| Multi-line `echo '###…'` | root `test:unit:watch` | newline split + ambient `echo` |
| `find … -exec cp -R {} … \;` | `packages/argument-condensation` `build` | ambient `find` |
| `supabase gen types … > src/database.ts` | `packages/supabase-types` `generate` | `supabase` **is** declared there (`supabase: catalog:`) |
| `supabase start/stop/db reset` | `apps/supabase` | `supabase` **is** declared there |
| `serve tools/visualization` | `packages/argument-condensation` `dev:vis` | `serve: ^14.2.3` **is** declared there |

**The 8 extra `eslint` hits are genuine under a strict reading and defensible as excluded under a looser one.** All 8 packages declare `@openvaa/shared-config: workspace:^`, and `packages/shared-config/package.json` lists `eslint: catalog:` in its **`dependencies`** (not devDependencies) [VERIFIED — read this session]. So `eslint` is legitimately reachable through a declared workspace dependency; the 8 packages are not free-riding on hoisting the way they are with `tsup` (which is declared *only* at the repo root). By contrast `packages/dev-seed` and `packages/dev-tools` declare `eslint: catalog:` directly.

**Recommendation for the planner:**

- **Scope the guard to `build` scripts.** This is what `REVIEW-CFG-01` literally requires — *"A workspace that invokes a binary in its **`build` script**"* — and it makes criterion 1's two halves the same job: 8 declarations added, guard green, no scope creep into a 16-edit change this phase did not decide.
- Record the 8 `eslint` hits explicitly as a **known, deliberately out-of-scope wider class**, filed to `.planning/todos/pending/` per D-N2, together with the one-line change (widening the scope set) that would surface it later. Do **not** silently narrow the guard to `tsup`.
- If the operator instead wants the guard to cover all scripts, plan **16** manifest edits, not 8, and expect `eslint: catalog:` in each of the 8.

### A.4 Hoisting, install effects, and the exact version string

- `.yarnrc.yml:1` is `nodeLinker: node-modules` [VERIFIED], so `tsup` hoisted from the root resolves at runtime today. This is why the builds pass despite the missing declarations, and why D-B4's rejected option (c) ("rely on a PnP install failing") was correctly rejected.
- `tsup` is declared **only** at the repo root: `package.json:69` — `"tsup": "^8.5.1"` [VERIFIED].
- Installed version: **8.5.1**; `bin` = `{"tsup":"dist/cli-default.js","tsup-node":"dist/cli-node.js"}`; `yarn.lock` has a single entry `"tsup@npm:^8.5.1"` [VERIFIED].
- **Adding the 8 declarations changes nothing at install time.** All 8 will resolve to the same already-locked `tsup@npm:^8.5.1`; `yarn.lock` gains descriptor entries, not a new resolution. No duplicate install, no hoisting change under `node-modules`. *(Unmeasured: I did not run `yarn install` after adding the declarations, because doing so would dirty `yarn.lock` in a worktree with eleven concurrent agents. The plan must run `yarn install` and commit the `yarn.lock` delta.)*
- **`.yarnrc.yml` has no `tsup` catalog entry** today; its catalog block spans `:5-40` and is explicitly split into "Existing entries" and, from `:19`, `# New entries (deps shared across 2+ workspaces)` [VERIFIED, quoted from `.yarnrc.yml:19`].

**Exact string the 8 manifests should carry — two defensible options:**

| Option | String in each of the 8 | Also required | Rationale |
|---|---|---|---|
| **(a) Catalog — recommended** | `"tsup": "catalog:"` | add `tsup: ^8.5.1` to `.yarnrc.yml`'s catalog block; change root `package.json:69` to `"tsup": "catalog:"` | `tsup` becomes shared across **9** workspaces, which is exactly the repo's own stated criterion for a catalog entry (`.yarnrc.yml:19`). Every other multi-workspace dev dep here (`typescript`, `vitest`, `eslint`, `prettier`, `tsx`) is already `catalog:`. |
| (b) Literal | `"tsup": "^8.5.1"` | nothing | Matches the root today and matches the snippet in `packages/shared-config/README.md:12` (`"tsup": "^8.5.1"`). Nine copies of a version string to keep in sync — the exact failure mode the catalog exists to prevent. |

Option (a) is recommended, with the consequence that `packages/shared-config/README.md`'s snippet (§ F) should then read `"tsup": "catalog:"`.

---

## B. Making `engines` bind (REVIEW-CFG-02 / D-B5)

### B.1 Artefact (i) — the rename. Trivial and exact.

| Site | Current |
|---|---|
| `package.json:74` | `"engine": {` … `"node": ">=22", "yarn": "4.13", "npm": "please-use-yarn"` |
| `apps/frontend/package.json:54` | `"engine": {` |

[VERIFIED: `grep -n '"engine"' package.json apps/frontend/package.json`]

`apps/frontend/package.json:59` is `"type": "module"` [VERIFIED] — relevant to § C, listed here for the same-file context.

### B.2 Artefact (ii) — ⚠ **THE CRUX: no such Yarn setting exists.**

Three independent measurements, all against the pinned `.yarn/releases/yarn-4.13.0.cjs`:

**(1) Grep of the bundled release.** Counted occurrences:

| Token | Hits |
|---|---|
| `engineStrict` | 0 |
| `enableEngineChecks` | 0 |
| `engine-strict` | 0 |
| `checkEngines` | 0 |
| `Incompatible` | 0 |
| `engines` | 6 — **all six are `engines:` fields inside vendored third-party manifests**, not settings |

The one meaningful hit is Yarn's own deprecation message, quoted verbatim from the release bundle:

> `The --ignore-engines option is deprecated; engine checking isn't a core feature anymore`

[VERIFIED: `grep -o` over `.yarn/releases/yarn-4.13.0.cjs`]

**(2) The live settings registry.** `yarn config --json` emits **101** settings on this repo. Filtering every key *and* description for `/engine/i` returns exactly one row:

```
enableMessageNames | If true, the CLI will prefix most messages with codes suitable for search engines | effective: true
```

— a false positive on the word "search engines". **There is no engine-check setting in Yarn 4.13.0.** [VERIFIED — run this session]

**(3) A live behavioural probe.** A scratch project (`<scratchpad>/engtest`, since deleted) with:

```yaml
nodeLinker: node-modules
yarnPath: <this repo>/.yarn/releases/yarn-4.13.0.cjs
```
```json
{ "name": "engtest", "private": true, "engines": { "node": ">=99" }, "packageManager": "yarn@4.13.0" }
```

Run under Node **v24.14.1**:

```
➤ YN0000: · Yarn 4.13.0
➤ YN0000: ┌ Resolution step
➤ YN0000: └ Completed
➤ YN0000: ┌ Fetch step
➤ YN0000: └ Completed
➤ YN0000: ┌ Link step
➤ YN0000: └ Completed
➤ YN0000: · Done in 0s 16ms
```

**Clean install. No error. No warning.** An impossible `engines.node` range is entirely inert. [VERIFIED — run this session]

**Conclusion, stated plainly as the CONTEXT asks:** Yarn 4.13.0 has **no** `.yarnrc.yml` key that makes an engine mismatch an error, and does not enforce root `engines` in any mode. D-B5's artefact (ii) cannot be delivered as specified. **This needs an operator decision** (§ Open Questions, OQ-2).

### B.3 Least-hand-rolled alternatives, ranked

D-B5 rejected option (c), "a preinstall version check script", as *"adds a hand-rolled check where the package manager already has one"* — a rationale whose premise is now measured false. The options that remain:

| # | Mechanism | Non-hand-rolled? | Binds what? | Assessment |
|---|---|---|---|---|
| **1** | **`actions/setup-node` with `node-version-file: package.json`** in place of the three hard-coded `node-version: 22.22.1` inputs | ✅ first-party GitHub action | **The field becomes load-bearing in CI**: setup-node reads the range *from `engines.node`*, so the misspelling `engine` would break every job that uses it | *Recommended.* Documented: setup-node checks `volta.node`, then `devEngines.runtime`, then **`engines.node`** [CITED: github.com/actions/setup-node/blob/main/docs/advanced-usage.md]. Turns the rename from cosmetic into a standing regression guard at zero bespoke code. **Unmeasured:** whether setup-node hard-fails (vs. warns) when the field is absent — verify in the plan's own CI run. |
| **2** | A CI job that pins an out-of-range Node (e.g. `node-version: 20`) and asserts the repo's gate rejects it | ✅ plain CI | Requires a gate to exist — pairs with 1 or 3, does not stand alone | This is artefact (iii). Note that *nothing currently rejects*, so on its own the job would assert a failure that never happens. |
| 3 | `preinstall` (or `prepare`) script doing a `semver.satisfies(process.version, engines.node)` check | ❌ hand-rolled | Local **and** CI, at install time — the only option that literally "rejects an out-of-range Node" | Rejected by D-B5(c) on a premise now known false. If "binds" must mean *install-time rejection*, this is the only option that delivers it. Would sit naturally in `scripts/` beside the other three guards. |
| 4 | Third-party Yarn plugin `devoto13/yarn-plugin-engines` | ⚠ | Install-time rejection, natively | **64 stars, MIT, last pushed 2024-04-07** (>2 years stale), **not published to npm** (`npm view yarn-plugin-engines` → E404), no releases. `.gitignore:29` (`!.yarn/plugins`) means it would be *committed into the repo*. For a repo running a slopsquatting-conscious review programme this is a poor supply-chain trade. [VERIFIED via `gh api` and `npm view`] |
| 5 | `packageManager: "yarn@4.13.0"` + corepack | ✅ | Yarn version only, not Node | Already present at root `package.json`; does not address `engines.node`. |

**Recommendation:** option **1 + 2** as the standing mechanism (the field is consumed and its corruption is caught), with option **3** offered to the operator if "binds" is required to mean install-time rejection. Present this as a decision, not a plan.

### B.4 Can it be demonstrated locally?

- `node --version` → **v24.14.1**; `yarn --version` → **4.13.0** [VERIFIED]. v24 satisfies `>=22`, so the in-range case is the only one available locally.
- Installing under an out-of-range Node cannot be demonstrated on this machine without installing an old Node runtime (nvm/fnm not used by this repo; no `.nvmrc` exists). **Unmeasured, and out of scope for research.**
- With Yarn 4.13.0 enforcing nothing (§ B.2), *there is nothing local to observe anyway* — the observation only becomes possible once a mechanism from § B.3 is chosen. **CI is the only place the observation can happen**, which the CONTEXT already suspected.

### B.5 Artefact (iii) — `.github/workflows/main.yaml`, in full

Read completely. Structure [VERIFIED: `.github/workflows/main.yaml`, 383 lines]:

**Triggers (`:3-22`):**
- `push` to `main` only, with `paths-ignore: ["**.md", "**/*/.env.example", ".env.example"]`
- `pull_request` (`opened`, `synchronize`, `reopened`, `ready_for_review`) with `branches: [main]` and the same `paths-ignore`

**Six jobs, all `runs-on: ubuntu-latest`, all top-level parallel (no `needs:` anywhere):**

| Job | Lines | Node setup | Notes |
|---|---|---|---|
| `skill-drift-check` | 25-34 | *none* | checkout (`fetch-depth: 0`) → `run: .claude/scripts/audit-skill-drift.sh`. The whole job is two steps. |
| `frontend-and-shared-module-validation` | 36-104 | `node-version: 22.22.1` (`:51-55`) | yarn setup → install → build → `format:check` → **typecheck (named, must stay above ESLint — asserted by a test)** → `lint:check` → `test:unit` → svelte-check → frontend build |
| `supabase-tests` | 106-138 | *none* | `dorny/paths-filter@v3` gates every step on `apps/supabase/**` or `packages/supabase-types/**` |
| `dev-seed-integration` | 163-245 | `node-version: 22.22.1` (`:187-191`) | carries `DEV_SEED_INTEGRATION_REQUIRED: "1"`; deliberately no paths-filter |
| `e2e-tests` | 247-302 | `node-version: 22.22.1` (`:266-270`) | full stack + Playwright |
| `e2e-visual` | 328-383 | `node-version: 22.22.1` (`:347-351`) | `PLAYWRIGHT_VISUAL=1`, blocking |

**How a new job slots in:** append a top-level key under `jobs:`. There are no `needs:` edges to disturb and no matrix. The three `node-version: 22.22.1` sites (`:54`, `:190`, `:269`, `:350` — four, counting `e2e-visual`) are the ones option 1 of § B.3 would replace with `node-version-file: package.json`.

**Is a job whose expected outcome is failure expressible cleanly? Yes — and the repo already does it.** The idiomatic shape is *not* `continue-on-error` (which merely un-blocks the job; it never asserts that the command failed). It is an explicit negation inside a `run:` block, with a `::error::` annotation on the unexpected-success path. **In-repo precedent**, `main.yaml:228-230`, quoted verbatim:

```yaml
          test -n "$API_URL" || { echo "::error::API_URL missing from supabase status"; exit 1; }
          test -n "$SERVICE_ROLE_KEY" || { echo "::error::SERVICE_ROLE_KEY missing from supabase status"; exit 1; }
          test -n "$ANON_KEY" || { echo "::error::ANON_KEY missing from supabase status"; exit 1; }
```

The negative-control form, following that style:

```yaml
      - name: "Negative control: an out-of-range Node is rejected"
        run: |
          if yarn install --immutable; then
            echo "::error::install succeeded under Node $(node --version); the engines constraint did not bind"
            exit 1
          fi
          echo "install correctly rejected under Node $(node --version)"
```

Two properties worth flagging to the planner: GitHub's default shell is `bash -e {0}`, so an `if` guard is required rather than a bare `!cmd` (a bare failing command aborts the step); and `set -o pipefail` is *not* on by default, so no pipe should carry the assertion.

**⚠ `.github/workflows/main.yaml` is a shared surface.** Phase 163 adds three jobs to this same file (`db:lint:sql`, secret scanning, dependency-vulnerability) and edits the `format:check` step at `:64` [VERIFIED: ROADMAP Phase 163 entry]. Both phases append top-level `jobs:` keys, which is the *least* conflict-prone way to edit a workflow — two additions at different points in a jobs map merge cleanly far more often than two edits to one step. Additionally, `packages/dev-seed/tests/ciTypecheckGate.test.ts` **asserts against this file's text** (§ H) — specifically that two named steps each appear **exactly once** and in a given order. Any Phase-153 edit that duplicates or renames `- name: "Type-check all packages (turbo run typecheck)"` or `- name: "Run ESlint check on frontend"` reddens that test.

---

## C. `__dirname` in `apps/frontend/vitest.config.ts` (REVIEW-CFG-03)

### C.1 The authoritative count: **11**

```
$ grep -c __dirname apps/frontend/vitest.config.ts
11
$ grep -o __dirname apps/frontend/vitest.config.ts | wc -l
11
```

Line numbers: **18, 22, 25, 26, 27, 28, 32, 36, 40, 44, 48** — one occurrence per line, so the line count and the occurrence count agree.

**The ROADMAP's corrected list is right; the § 0 fact-table entry (fact 3: "9 sites", ten line numbers, missing `:48`) is wrong on both counts.** Plan against 11. [VERIFIED — commands above, run this session]

The whole file is 56 lines. Every usage is the identical construct `path.resolve(__dirname, '<relative>')`, inside `resolve.alias`:

| Line | Verbatim |
|---|---|
| 18 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/paraglide-runtime.ts')` |
| 22 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/paraglide-messages.ts')` |
| 25 | `      { find: '$lib', replacement: path.resolve(__dirname, 'src/lib') },` |
| 26 | `      { find: '$types', replacement: path.resolve(__dirname, 'src/lib/types') },` |
| 27 | `      { find: '$voter', replacement: path.resolve(__dirname, 'src/lib/voter') },` |
| 28 | `      { find: '$candidate', replacement: path.resolve(__dirname, 'src/lib/candidate') },` |
| 32 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/env-dynamic-public.ts')` |
| 36 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/app-environment.ts')` |
| 40 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/app-paths.ts')` |
| 44 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/app-state.ts')` |
| 48 | `        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/app-navigation.ts')` |

Line 1 is `import path from 'path';` (bare `'path'`, not `'node:path'`).

### C.2 Why it works today — **this is a latent issue, not a live break**

Vite bundles a TS config file with esbuild before loading it, and **`define`s `__dirname`**. From the installed Vite 6.4.1, `node_modules/vite/dist/node/chunks/config.js`:

```js
:35802	const dirnameVarName = "__vite_injected_original_dirname";
:35819		__dirname: dirnameVarName,
:35822		"import.meta.dirname": dirnameVarName,
:35862	let injectValues = `const ${dirnameVarName} = ${JSON.stringify(path.dirname(args.path))};…`;
```

and `bundleAndLoadConfigFile` chooses `format: isESM ? "esm" : "cjs"` — the `define` applies **in both modes**. [VERIFIED: `node_modules/vite/dist/node/chunks/config.js:35802,35819,35822,35862`, quoted verbatim; Vite **6.4.1**, Vitest **3.2.4**]

So `__dirname` here is a **Vite-supplied shim, not a Node global**, and it resolves correctly today despite `"type": "module"`. Consequences for the plan:

- **The fix cannot be proven by showing the current config fails — it does not fail.** Any plan task claiming "observe the break, then the fix" is planning a demonstration that will not reproduce.
- The correct framing is *hygiene and portability*: the file states a dependency on a bundler shim that its own package type says should not exist. Anything that loads the config **without** Vite's bundler (a plain `node --import tsx apps/frontend/vitest.config.ts`, a future Vite that drops the `define`, an editor tool) breaks.
- The **proof** must therefore be a *no-regression* proof: the config still loads and its aliases still resolve after the change (§ C.4).

### C.3 The replacement — one derived constant, matching an in-repo pattern

`apps/frontend/vite.config.ts` — one directory over, same workspace, same `"type": "module"` — already does exactly this:

```ts
:1	import { fileURLToPath } from 'node:url';
…
:8	// The root `.env` lives two levels above `apps/frontend`. `apps/frontend/package.json` declares
:9	// `type: module`, so `__dirname` is unavailable here — derive the repo root from `import.meta.url`.
:10	const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
```

[VERIFIED: `apps/frontend/vite.config.ts:1,8-10`, quoted verbatim]

Survey of every config file in the repo [VERIFIED — `grep -c` over each]:

| File | `__dirname` | `import.meta.url` |
|---|---|---|
| `apps/frontend/vitest.config.ts` | **11** | 0 |
| `apps/frontend/vite.config.ts` | 1 *(the word inside the comment at `:9`, not a usage)* | 2 |
| `apps/docs/vite.config.ts`, `apps/docs/svelte.config.js`, `apps/frontend/svelte.config.js` | 0 | 0 |
| `apps/supabase/vitest.config.ts`, `tests/vitest.config.ts`, and all 9 `packages/*/vitest.config.ts` | 0 | 0 |

**`apps/frontend/vitest.config.ts` is the only real `__dirname` site in the repo's configuration surface.** The three repo guard scripts use the same idiom (`scripts/assert-i18n-catalog-namespaces.mjs:57`: `path.resolve(fileURLToPath(import.meta.url), '..', '..')`), as does `packages/dev-seed/tests/ciTypecheckGate.test.ts:38` (`dirname(fileURLToPath(import.meta.url))`).

**Recommended edit — the 11 sites collapse to one constant:**

```ts
import path from 'path';
import { fileURLToPath } from 'node:url';
…
// `apps/frontend/package.json` declares `type: module`, so `__dirname` does not exist here; Vite's
// config bundler happens to shim it, which is a dependency this file should not be carrying.
const here = fileURLToPath(new URL('.', import.meta.url));
```

then `path.resolve(here, …)` at all 11 sites. `new URL('.', import.meta.url)` yields the directory with a trailing slash, and `fileURLToPath` of that is the directory path — the exact `__dirname` equivalent, and the same `new URL(…, import.meta.url)` form the neighbouring `vite.config.ts` uses. `path.resolve` normalises the trailing separator, so no behavioural difference. Prefer `path.dirname(fileURLToPath(import.meta.url))` only if the planner wants byte-identity with `ciTypecheckGate.test.ts:38`; either is in-repo precedent. Consider also normalising `import path from 'path'` → `'node:path'` while touching line 1, matching every other file that uses `node:url`.

### C.4 The proof command — run, with output

Two candidates were exercised in `apps/frontend`:

**Cheap (recommended for the per-task signal):**

```
$ npx vitest list --run
… 
src/lib/api/utils/auth/providers/__fixtures__/fixtures.test.ts > Test fixture factories > createTestJwt > produces a verifiable JWT
```

This loads the config **and collects every spec**, which requires each `$lib`/`$types`/`$voter`/`$candidate`/`$app/*`/`$env/*` alias to resolve — a broken `here` constant would fail collection, not merely load. [VERIFIED — run this session]

**Authoritative (the phase gate):**

```
$ yarn workspace @openvaa/frontend test:unit      # = `vitest run`
Test Files  54 passed (54)
     Tests  816 passed (816)
```

[VERIFIED — observed inside the `yarn test:unit` baseline run]

A *negative* control is available and cheap, and is worth planning: temporarily set `here` to a wrong directory and observe `vitest list` fail to resolve `$lib`. That demonstrates the alias plumbing is genuinely exercised by the proof, rather than assumed.

---

## D. `.lintstagedrc.json` (REVIEW-CFG-04 + REVIEW-CFG-08)

### D.1 The file, verbatim (8 lines)

```json
1  {
2    "*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}": [
3      "bash -c 'turbo run build --filter=@openvaa/app-shared...'",
4      "prettier --write",
5      "eslint --fix --flag v10_config_lookup_from_file"
6    ],
7    "*.{css,json,md}": ["bash -c 'turbo run build --filter=@openvaa/app-shared...'", "prettier --write"]
8  }
```

[VERIFIED: `cat -n .lintstagedrc.json`]

- **`bash -c` sites: `:3` and `:7`** — byte-identical commands.
- **Fused-glob site: `:2`** — `mjssvelte` is one alternative. Neither `.mjs` nor `.svelte` appears anywhere.
- **`:6` is the closing `]` of the first array**, not a glob. The second glob is on **`:7`**: `*.{css,json,md}` — **this one is correct**; its three alternatives are properly comma-separated and it matches `.css`, `.json` and `.md` as intended. Only `:2` carries the defect. (The CONTEXT asks whether "line 6's glob has the same defect"; the answer is that line 6 is not a glob, and the file's other glob, at line 7, is sound.)

lint-staged 16.4.0 ships a `validateBraces.js` that warns about *malformed* brace groups (`*.{js}`, `*.{{a,b}}`), but `{…,mjssvelte,…}` is **well-formed** — it has commas and no double braces — so lint-staged emits no warning. The defect is invisible to the tool. [VERIFIED: `node_modules/lint-staged/lib/validateBraces.js`, read in full]

### D.2 ⚠ `bash -c` is load-bearing — the naive fix breaks the hook

lint-staged does **not** use a shell. It parses each command with `string-argv`'s `parseArgsStringToArgv` and spawns it with `tinyexec` (`nodeOptions.stdio: ['ignore']`, no `shell` option anywhere). The decisive line, verbatim:

```js
node_modules/lint-staged/lib/getSpawnedTask.js:102
    const result = exec(cmd, isFn ? args : args.concat(files), tinyExecOptions)
```

with `getSpawnedTasks.js:39`: `const isFn = typeof cmd === 'function'`.

[VERIFIED — both files read this session; lint-staged **16.4.0**, `engines: {"node":">=20.17"}`]

**So: a string command gets the staged file list appended; a function-task's returned command does not.** `bash -c 'script'` absorbs those appended paths into the shell's positional parameters (`$0`, `$1`, …), which the single-quoted script never references — i.e. **the `bash -c` wrapper exists (deliberately or accidentally) to suppress file-argument appending on a command that takes no files.**

Confirmed empirically, twice:

1. lint-staged does append files to string commands — from the scratch-repo run below, the task output line was
   `MATCHED-B /…/lsdemo/.lintstagedrc.json`, i.e. `echo MATCHED-B` was spawned as `echo MATCHED-B <file>`.
2. turbo rejects the stray arguments:

```
$ npx turbo run build --filter=@openvaa/app-shared... apps/frontend/src/app.html README.md
• turbo 2.8.17
  x Missing tasks in project
  |->   x Could not find task `README.md` in project
  `->   x Could not find task `apps/frontend/src/app.html` in project
```

[VERIFIED — run this session]

**The `...` filter syntax survives fine without a shell** — it is an ordinary character sequence inside the single `--filter=@openvaa/app-shared...` argv token, never subject to shell globbing. `...` is not the problem; the appended file list is.

### D.3 The correct direct-invocation form — three options, one recommended

**Discovered fact that resolves this cleanly:** `.husky/pre-commit` is two lines [VERIFIED, `cat -n .husky/pre-commit`]:

```
1  yarn turbo run build --filter=@openvaa/app-shared...
2
3  yarn lint-staged
```

**The hook already runs that exact turbo build before lint-staged.** The two `bash -c` entries are therefore **redundant re-invocations** of a build that has just run (turbo-cached, so cheap, but pure duplication).

| Option | Shape | Assessment |
|---|---|---|
| **(a) Delete both `bash -c` entries — recommended** | `.lintstagedrc.json` keeps only `prettier --write` / `eslint --fix …` and `prettier --write` | Satisfies REVIEW-CFG-04 literally ("invokes its commands directly rather than through `bash -c`", *"so the pre-commit hook works where bash is absent"*), stays JSON, no format change, **no behaviour loss** — line 1 of the hook still builds. Smallest diff. Residual: someone running `npx lint-staged` outside the hook no longer gets the build; the hook is the only documented entry point. |
| (b) Convert to `lint-staged.config.mjs` with a function task | `[() => 'turbo run build --filter=@openvaa/app-shared...', 'prettier --write', …]` | The lint-staged-native way to say "run this command with no files", verified at `getSpawnedTask.js:102`. Correct, but changes the config file format and keeps a redundant build. |
| (c) Replace `bash -c '…'` with the bare string | `"turbo run build --filter=@openvaa/app-shared..."` | ❌ **Breaks the hook** — measured above. Do not plan this. |

**Recommendation: (a).** Note it for the operator only if the redundancy reading is contested.

### D.4 Whether the hook runs in this worktree — **it does NOT**

```
$ git config --get core.hooksPath
/dev/null
$ git config --worktree --list
core.hookspath=/dev/null
$ git config --get extensions.worktreeConfig
true
$ cat "$(git rev-parse --git-dir)/config.worktree"
[core]
	hooksPath = /dev/null
```

and the shared repo config still says `core.hookspath=/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application/.husky` — the *other* checkout's path, which is why the worktree-local override exists.

[VERIFIED — all four commands run this session; matches the recorded memory `project_gsd_repo_hook_workaround.md`]

**Consequence: `git commit` in this worktree runs no hook at all.** The criterion-8 proof cannot be obtained by committing here, and the plan must not depend on the hook wiring.

### D.5 The executable proof, without the hook — **both directions demonstrated**

lint-staged is invocable directly at `node node_modules/lint-staged/bin/lint-staged.js`. The full negative control was run in a throwaway git repo under the scratchpad (since deleted), using **this repo's** lint-staged binary, with a mis-formatted `Bad.svelte` and `bad.mjs` staged and `echo` stand-ins for the real tasks so the match set is legible:

**BEFORE — current fused glob (`…,cjs,mjssvelte,ts,…`):**

```
[STARTED] .lintstagedrc.json — 3 files
[STARTED] *.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml} — 0 files
[STARTED] *.{css,json,md} — 1 file
[SKIPPED] *.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml} — no files
```

**AFTER — `…,cjs,mjs,svelte,ts,…`:**

```
[STARTED] *.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml} — 2 files
…
→ echo MATCHED-A:
MATCHED-A /…/lsdemo/Bad.svelte /…/lsdemo/bad.mjs
```

**`0 files` → `2 files`.** The defect and its fix are both proven, executably, with zero dependence on the hook and zero interaction with this repo's index. [VERIFIED — both runs this session]

**Recommended proof recipe for the plan** (a phase-dir evidence doc on the `137-NEGATIVE-CONTROL.md` model, § I): scratch repo, `git init`, `core.hooksPath=/dev/null`, copy the real `.lintstagedrc.json`, stage a deliberately mis-formatted `.svelte`, run `node <repo>/node_modules/lint-staged/bin/lint-staged.js --verbose` before and after the glob edit, paste both `— N files` lines.

### D.6 Churn measurement — **ZERO files**, and a different hazard in its place

The CONTEXT flags this as unbounded (`<open>` item 6). Measured [VERIFIED — all runs this session]:

| Set | Files | `prettier --check` | `eslint` |
|---|---|---|---|
| Tracked `.svelte` under `apps/frontend/**` | **170** | ✅ *"All matched files use Prettier code style!"* | ✅ exit 0, no output |
| Tracked `.svelte` under `apps/docs/**` | **16** | ✅ same | — |
| **All** tracked `.mjs` | **34** | ✅ same | — |
| Tracked `.svelte` under `.claude/skills/**` | **45** | ❌ **exit 2 — hard error** | ⚠ warning only, exit 0 |
| Tracked `.svelte` under `.planning/**` | 3 | *(ignored — `.prettierignore` has `.planning/`)* | — |
| **Total tracked `.svelte`** | **234** | | |

**The "one-off formatting churn commit on `.svelte` files" D-B3 anticipates will be EMPTY.** The frontend and docs `.svelte` files and every `.mjs` file are already clean, because `yarn format` / `yarn format:check` (`prettier --write .` / `--check .` at root) already covers them — prettier resolves config **per file**, so `apps/frontend/prettier.config.mjs` (which adds `prettier-plugin-svelte` and a `{ files: '*.svelte', options: { parser: 'svelte' } }` override) applies even when prettier is invoked from the root. `yarn format:check` is green today. The plan should say so and drop the churn commit, or keep a placeholder task whose expected outcome is "no changes".

**But a new, real hazard replaces it.** The root `prettier.config.mjs` is just `export default config` from `@openvaa/shared-config/prettier` and loads **no svelte plugin** [VERIFIED — both files read]. `.claude/` is **not** in `.prettierignore` (which does list `.github` and `.husky`) [VERIFIED]. `prettier --check .` from the root does not descend into dot-directories, which is why `format:check` is green — but **lint-staged passes explicit file paths**, which bypasses that. Measured on a single file:

```
$ npx prettier --check .claude/skills/…/015-view-transitions-api/code/+page.svelte
[error] No parser could be inferred for file "…/+page.svelte".
Error occurred when checking code style in the above file.
prettier EXIT=2
```

**So: after the glob fix, staging any of those 45 `.svelte` files fails the commit at `prettier --write`.** ESLint is harmless there (`File ignored because no matching configuration was supplied`, 1 warning, exit 0).

**Mitigation the plan must include:** add `.claude/` to `.prettierignore`, alongside the existing `.github` and `.husky` entries — one line, same class, and consistent with the fact that those files are skill *fixtures*, not application source. (A narrower `.claude/skills/**/sources/` also works; `.claude/` is simpler and matches the neighbours.) Without it, criterion 8 ships a pre-commit that any skill-fixture edit will trip.

---

## E. Tracked build artefacts (REVIEW-CFG-06)

### E.1 The tracked set — confirmed, exactly four paths

```
$ git ls-files | grep -E 'tsbuildinfo|\.branches'
apps/docs/tsconfig.tsbuildinfo
apps/frontend/tsconfig.tsbuildinfo
packages/supabase-types/tsconfig.tsbuildinfo
supabase/.branches/_current_branch
```

[VERIFIED — run this session; matches D-B2's target set exactly]

| Path | Size | Commits touching it | Last |
|---|---|---|---|
| `apps/docs/tsconfig.tsbuildinfo` | 116 813 B | 1 | 2026-08-17 |
| `apps/frontend/tsconfig.tsbuildinfo` | 407 535 B | 2 | 2026-08-17 |
| `packages/supabase-types/tsconfig.tsbuildinfo` | 70 463 B | 1 | 2026-08-17 |
| `supabase/.branches/_current_branch` | 4 B (content: `main`) | 1 | 2026-08-17 |

Half a megabyte of opaque build state, versioned.

### E.2 Why these three and not the others — and the prevention the repo already documents

`packages/README.md:20` states the canonical rule verbatim:

> The `tsBuildInfoFile` is set to `./dist/tsconfig.tsbuildinfo` in `tsconfig.json` so the incremental-build artifact is also gitignored.

`packages/core/tsconfig.json` does exactly that (`"tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"`), and `packages/core/.gitignore` is `dist/`. The three offenders **do not set `tsBuildInfoFile`** [VERIFIED — all four tsconfigs read], so TypeScript writes it beside the tsconfig, at the workspace root, where no ignore rule catches it:

- `apps/frontend/tsconfig.json` and `apps/docs/tsconfig.json` extend `@openvaa/shared-config/ts` + `./.svelte-kit/tsconfig.json`, no `tsBuildInfoFile`; their `.gitignore`s cover `/build`, `/.svelte-kit` etc. but not `*.tsbuildinfo`.
- `packages/supabase-types/tsconfig.json` sets `"noEmit": true` and inherits `"composite": true` from the shared base — which still produces a `.tsbuildinfo`.

`packages/shared-config/tsconfig.base.json:6` is `"composite": true` [VERIFIED], so the class can reopen in any workspace that omits `tsBuildInfoFile` — precisely what D-B2's global ignore is for.

### E.3 `.gitignore` — current state and the exact rules to add

Root `.gitignore` is 78 lines. Relevant excerpts [VERIFIED, quoted verbatim]:

```
23:.turbo
44:tests/e2e-runs/
47:apps/supabase/supabase/snippets/
49:# Supabase CLI local state (rewritten on every CLI run — machine-local, never shared)
50:supabase/.temp/
55:# ── GSD baseline (auto-generated) ──
67:dist/
68:build/
```

**No `tsbuildinfo` rule and no `.branches` rule exist** — both are additions, exactly as D-B2 states. Note `:50` already ignores the *sibling* residue `supabase/.temp/`, so the `.branches` addition is symmetric with an existing entry.

**Recommended additions** (placed next to line 50, so the two stray-`supabase/` rules sit together, and with `*.tsbuildinfo` in the build-artefact region):

```gitignore
# TypeScript incremental-build state. The canonical package shape points
# `tsBuildInfoFile` into `dist/` (already ignored); this catches every workspace
# that does not, so the class cannot reopen in a fourth one.
*.tsbuildinfo

# Supabase CLI local state (rewritten on every CLI run — machine-local, never shared)
supabase/.temp/
supabase/.branches/
```

An optional belt-and-braces addition, if the planner wants prevention as well as ignoring: set `"tsBuildInfoFile"` into the existing ignored output dir in each of the three tsconfigs. That is beyond the criterion's wording; recommend filing it to `.planning/todos/pending/` per D-N2 rather than expanding scope.

### E.4 Mechanics: `git rm --cached`, not `skip-worktree`

- **Use `git rm --cached <path>`** for all four. It removes the path from the index while leaving the working file on disk; the new ignore rules then keep it out. This is the correct and only mechanism for "remove from version control".
- **Do not use `git update-index --skip-worktree`.** That flag keeps the file *tracked* and merely hides local modifications — the file stays in `git ls-files`, so criterion 6 would remain unmet while appearing fixed. It is also per-clone local state that no other developer or CI checkout inherits.
- After `git rm --cached`, verify with `git ls-files | grep -E 'tsbuildinfo|\.branches'` returning empty, and `git check-ignore -v <path>` naming the new rule for each of the four. Both are cheap, executable pass/fail signals.
- ⚠ **Ordering:** add the ignore rules **in the same commit as, or before,** the `git rm --cached`. Otherwise the four files reappear as untracked-and-unignored in `git status` between the two commits, and any `git add -A` in the interval re-adds them.

### E.5 Is untracking `supabase/.branches/_current_branch` safe for the Supabase CLI? **Yes.**

The stray top-level directory, in full [VERIFIED — `find supabase -maxdepth 3`]:

```
supabase
supabase/snippets          (empty)
supabase/.branches
supabase/.branches/_current_branch   → "main"
supabase/.temp
supabase/.temp/cli-latest
```

It contains **no `config.toml`, no `migrations/`, no `functions/`** — so it is not a Supabase project; the CLI would not operate against it. The real project lives at `apps/supabase/supabase/` (with `config.toml`, `migrations/`, `functions/`, `schema/`), and every `db:*` script runs `yarn workspace @openvaa/supabase …`, i.e. with cwd `apps/supabase` [VERIFIED: root `package.json:14-24`; `apps/supabase/package.json` scripts are bare `supabase start` etc.].

Decisively: **`apps/supabase/supabase/.gitignore` already ignores `.branches` and `.temp`** for the real project [VERIFIED, quoted]:

```
# Supabase
.branches
.temp
```

So `.branches/_current_branch` is, by the repo's own established treatment, machine-local CLI state that is *supposed* to be untracked. Untracking the stray copy is safe, the file's content is a 4-byte `main` the CLI rewrites at will, and the directory itself stays on disk per D-B2.

**Per CONTEXT `<open>` item 7:** the stray directory looks like pure residue from a Supabase CLI invocation at the repo root. That is a `.planning/todos/pending/` item (D-N2), not work for this phase — and the observation above is the evidence that item should carry.

---

## F. Documentation & import corrections (REVIEW-CFG-07)

### F.1 `packages/shared-config/README.md` — the offending line is `:11`, and the fix is larger than deleting a version

The file's first 15 lines, verbatim:

```
 1  # `@openvaa/shared-config`: Shared dev configuration for all modules
 2
 3  Contains exports for configuring `eslint`, `prettier` and `ts`. Import or extend these in the modules.
 4
 5  ## Shared `devDependencies`
 6
 7  `devDependencies` cannot be shared using packages. Make sure to update the common dependencies below in all workspaces at the same time:
 8
 9  ```json
10  "devDependencies": {
11    "@openvaa/shared-config": "^1.0.0",
12    "tsup": "^8.5.1", // If using TypeScript
13    "typescript": "^5.6.3",  // If using TypeScript
14  }
15  ```
```

[VERIFIED — `sed -n '1,40p'` and `grep -n '1\.0\.0'`; the string is at **`:11`**, confirming the CONTEXT's line-drift note against the reviewer's cited `:15` — `:15` is the closing fence]

**What the README is actually instructing:** it is a copy-paste snippet for the `devDependencies` block of any workspace that consumes the shared config. So the defect is not merely a wrong number in prose; **the snippet tells readers to write a dependency specifier that cannot resolve.** `packages/shared-config/package.json` is `"private": true`, `"version": "0.1.0"` [VERIFIED], so `^1.0.0` matches nothing and, being private, it is not on any registry either — `workspace:^` is the only form that works.

**What every real workspace does:** all 14 consumers declare `"@openvaa/shared-config": "workspace:^"` [VERIFIED — dependency dump of all 16 workspaces + root]. `typescript` is `catalog:` everywhere (catalog value `^5.8.3` at `.yarnrc.yml:7`), never `^5.6.3`. This is exactly the reviewer's *"use the workspace protocol (and align the TypeScript versioning with the repo's catalog usage)"*.

**Delicious corroboration for criterion 1:** line 12 already says `"tsup": "^8.5.1", // If using TypeScript`. **The README has been telling readers to declare `tsup` all along**; REVIEW-CFG-01 is 8 workspaces failing to follow this very document. Worth stating in the commit message.

**Recommended replacement text** (assuming § A.4 option (a), the catalog entry for `tsup`):

````markdown
## Shared `devDependencies`

`devDependencies` cannot be shared through a package's own dependency graph. Declare these in each
workspace that consumes the shared config; the version comes from the `catalog:` block in
`.yarnrc.yml`, so there is one place to update:

```json
"devDependencies": {
  "@openvaa/shared-config": "workspace:^",
  "tsup": "catalog:",
  "typescript": "catalog:",
  "vitest": "catalog:"
}
```
````

Changes and their justification: `workspace:^` (the only resolvable form for a private workspace package — matches all 14 real consumers); `catalog:` for `typescript` (matches all 16 workspaces and the reviewer's ask) and for `tsup`; `vitest: catalog:` added because `packages/README.md:21` names it in the required devDeps trio and every package carries it; comments and the trailing comma dropped so the snippet is valid JSON that can actually be pasted.

**A related, in-scope inconsistency worth surfacing:** `packages/README.md:21` states *"Required devDeps: `@openvaa/shared-config: workspace:^`, `typescript: catalog:`, `vitest: catalog:`"* — it **omits `tsup`**, while `:20` states the build script is `"tsup && tsc --emitDeclarationOnly --outDir dist"`. That omission is arguably the *root* of REVIEW-CFG-01: the canonical-paradigm document does not list the binary its own canonical build script invokes. Adding `tsup: catalog:` to that sentence is a one-line change squarely inside criterion 7's remit ("the repo's documentation … is true of the repo"). **Flag to the operator** — it is a third file, not named in the criterion.

### F.2 `packages/supabase-types/src/index.ts` — 4 lines, safe to change, no external consumers

All four lines, verbatim:

```ts
1  export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
2  export { Constants } from './database.js';
3  export { COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP } from './column-map.js';
4  export type { ColumnName, PropertyName, CollectionName, TableName } from './column-map.js';
```

The referenced files are `src/database.ts` and `src/column-map.ts` [VERIFIED: `ls packages/supabase-types/src/`].

**The convention, quoted verbatim from `packages/README.md:18`:**

> **Import-path policy.** TS-internal relative imports do **not** carry `.js` extensions — `import { X } from './foo'`, never `import { X } from './foo.js'`. The `module: ESNext` + `moduleResolution: Bundler` settings in `@openvaa/shared-config/ts` make the extension unnecessary, and `tsup` + `vitest` both resolve correctly without it.

**Resolution safety — the decisive settings**, from `packages/shared-config/tsconfig.base.json` [VERIFIED, quoted]:

```
11:    "module": "ESNext",
12:    "moduleResolution": "Bundler",
```

Under `moduleResolution: Bundler`, extensionless relative specifiers are **required to work** and `.js`→`.ts` remapping is not needed. (Had it been `NodeNext`, the `.js` extension would be mandatory and this change would be a regression — it is not.) `packages/supabase-types/tsconfig.json` extends that base and sets `rootDir: ./src`, `outDir: ./build`, `noEmit: true` [VERIFIED].

**Build/consumer risk: none.**

- The package has **no build step**: `"build": "echo 'Raw .ts source — no build step needed'"`, and its `exports`/`module`/`types` all point at **`./src/index.ts`** directly [VERIFIED: `packages/supabase-types/package.json:6-16`]. So `tsup` never runs here and there is no emit whose specifiers could go stale. It is consumed as raw TypeScript by consumers whose own `moduleResolution` is `Bundler`.
- **No consumer imports the internal paths.** A repo-wide grep for `supabase-types/src`, `from './database`, `from './column-map` across `*.ts`/`*.svelte`/`*.mjs` returns **only these four lines** plus one prose mention inside a dev-seed test fixture comment [VERIFIED]. 20 files import `@openvaa/supabase-types` — all through the barrel.
- **These four are the only TS-internal `.js` specifiers in the whole repo.** `grep -rEn "from ['\"]\.\.?/[^'\"]*\.js['\"]" --include='*.ts' apps packages tests` → **count: 4**, all in this file [VERIFIED]. The one other hit anywhere is `apps/supabase/benchmarks/k6/voter-bulk-read.js:19` — a k6 benchmark **`.js`** file, not TypeScript, correctly extension-bearing, and out of the convention's scope.

So the fix is: drop `.js` from four specifiers. Verification: `yarn typecheck` (green today) and `yarn build`; both re-run cheaply.

### F.3 `packages/core/src/controller/controller.ts:73` (D-B6)

Line 73, verbatim, with its docblock and body:

```ts
  /**
   * Override in subclasses to implement sub-operation progress logging.
   */

  defineSubOperations(operationId: string, subOperations: Array<{ id: string; weight?: number }>): void {
    // No-op by default
  }
```

Current eslint output [VERIFIED — run this session]:

```
packages/core/src/controller/controller.ts
  73:23  warning  'operationId' is defined but never used. Allowed unused args must match /^_/u    unused-imports/no-unused-vars
  73:44  warning  'subOperations' is defined but never used. Allowed unused args must match /^_/u  unused-imports/no-unused-vars

✖ 2 problems (0 errors, 2 warnings)
```

The rule, at `packages/shared-config/eslint.config.mjs:134-142` [VERIFIED]:

```js
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],
```

Severity is **`warn`**, which is why `yarn lint:check` is green today. Rename to `_operationId` / `_subOperations`. Note `args: 'after-used'` — with both params unused, both must be prefixed; prefixing only the trailing one would still flag the leading one. Also worth tidying while there: the stray blank line between the docblock and the signature (the two sibling methods `checkAbort()` at `:65` and `getCurrentOperation()` at `:81` have none).

Proof: `npx eslint --flag v10_config_lookup_from_file packages/core/src/controller/controller.ts` goes from `2 problems (0 errors, 2 warnings)` to clean.

---

## G. ⚠ The `audit-skill-drift.sh` finding (REVIEW-CFG-05) — HIGH PRIORITY

### G.1 The "every skill declares `targets: []`" claim is **REFUTED**

Frontmatter `targets:` for all 8 skills [VERIFIED — extracted per-file this session]:

| Skill | `targets:` |
|---|---|
| `architect` | `[]` |
| `components` | `[]` |
| `data` | `packages/data/src/` |
| `database` | `apps/supabase/`, `packages/supabase-types/` |
| `filters` | `packages/filters/src/` |
| `matching` | `packages/matching/src/` |
| `ship-review-stack` | `.agents`, `.claude/scripts`, `.planning/phases/151-ship-v0-2-akita-review-stack/scripts` |
| `spike-findings-voting-advice-application-gsd` | *(no `targets:` key at all)* |

**Two of eight are `[]`; one omits the key; five declare real, existing directories.** The separate measurement the research brief cites ("every skill declares `targets: []`, so it checks nothing and would pass green against a no-op") is **wrong**. `.claude/skills/` is fully tracked in git — 118 files [VERIFIED: `git ls-files .claude/ | wc -l`] — so CI sees them.

### G.2 What the script does, and its live result — **it exits 1 TODAY**

`.claude/scripts/audit-skill-drift.sh` is 135 lines of bash [VERIFIED — read in full]. Mechanism:

1. For each `.claude/skills/*/`, parse `targets:` out of the `SKILL.md` YAML frontmatter (`:23-50`). An inline `[]` breaks out immediately (`:37-39`).
2. No targets → `SKIP  (no targets defined)`, `((SKIPPED++))` (`:52-56`).
3. `skill_commit = git log -1 --format=%H -- "<skill_dir>/"` — the last commit touching the skill's own directory (`:62`).
4. For each target directory, count `git rev-list <skill_commit>..HEAD -- <target>` and `git diff --name-only …` (`:85-87`).
5. Any commits since → `DRIFT`, `((DRIFTED++))` (`:100-103`).
6. `exit 1` if `DRIFTED > 0` (`:130-135`).

So `targets` means *"source directories whose change since this skill was last edited implies the skill may be stale."* It is a real check.

**Live run on this tree, verbatim:**

```
Skill Drift Audit
=================

  architect       SKIP  (no targets defined)
  components      SKIP  (no targets defined)
  data            DRIFT  1 commits, 1 files since 2026-08-17
    packages/data/src/  (1 commits, 1 files changed)
  database        DRIFT  1 commits, 3 files since 2026-08-17
    apps/supabase/  (1 commits, 3 files changed)
  filters         OK    (synced as of 2026-08-17)
  matching        OK    (synced as of 2026-08-17)
  ship-review-stack  OK    (synced as of 2026-08-28)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

---
Checked: 5  Drifted: 2  Skipped: 3

Drifted skills may contain outdated information.
Review target changes and update skill files as needed.
EXIT=1
```

[VERIFIED — run this session]

**The two drifts, identified:** all skills were last touched by `14afb2d80` (2026-08-17). Since then [VERIFIED — `git log`/`git diff` between that commit and HEAD]:

- `data` ← `34d6535ce test(packages): wire test:unit across workspaces and assert output, not wiring`, touching `packages/data/src/objects/nominations/variants/variants.test.ts`
- `database` ← `4402124ce test(supabase): assert claim-config output in the identity-callback function`, touching `apps/supabase/supabase/functions/identity-callback/{claimConfig.test.ts,claimConfig.ts,index.ts}`

Both are **test-wiring commits** — they do not invalidate the skills' content at all. The check is coarse: *any* commit under a target counts as drift, regardless of whether the skill's claims are affected.

### G.3 Has the step ever run in CI? **Yes — once, and it FAILED.**

`gh` is authenticated (account `kaljarv`, scopes include `workflow`) [VERIFIED]. `gh run list --workflow=main.yaml` returns 10 runs, of which exactly one contains a `skill-drift-check` job:

| Run | Branch / event | Conclusion | Has `skill-drift-check`? |
|---|---|---|---|
| 33043573890 | `main` push, 2026-08-27 | failure | no |
| 32112367906 | `main` push, 2026-08-18 | success | no |
| 32109595207 | PR `fix-collected-fixes-…` | success | no |
| **32058994754** | **PR #860 `feat-gsd-roadmap` → main, 2026-08-17** | **failure** | **YES → `skill-drift-check: failure`** |
| 32017478048 | PR #863 `ship/v0.2-akita-01a-layout-move` | failure | no |

[VERIFIED — `gh run list`, `gh run view --json jobs`]

The job's log, at the point of failure, verbatim:

```
##[group]Run .claude/scripts/audit-skill-drift.sh
.claude/scripts/audit-skill-drift.sh
shell: /usr/bin/bash -e {0}
##[endgroup]

Skill Drift Audit
=================

##[error]Process completed with exit code 1.
```

[VERIFIED — `gh run view 32058994754 --log --job=<skill-drift-check>`]

**Read that carefully: the banner printed, then the script died — with no per-skill line and no `--- / Checked:` trailer.** That is a *different* failure from the local one, which prints all eight skill lines and the trailer before exiting 1.

Confirmed the skills existed on that branch — `gh api repos/OpenVAA/voting-advice-application/contents/.claude/skills?ref=feat-gsd-roadmap` returns all 8 directories plus `BOUNDARIES.md` [VERIFIED]. So the loop ran with real input and aborted inside `audit_skill()` **before its first `printf`**.

**Diagnosis (HIGH-confidence inference, one link unmeasured).** The first skill processed is `architect`, whose `targets: []` takes the branch at `:52-56`:

```bash
  if [[ ${#targets[@]} -eq 0 ]]; then
    ((SKIPPED++))
    printf "  %-14s  SKIP  (no targets defined)\n" "$skill_name"
```

`((SKIPPED++))` is post-increment: with `SKIPPED=0` the expression **evaluates to 0**, so the arithmetic command returns **exit status 1**. The script runs under `set -euo pipefail` (`:6`) and the function is the *right* operand of `[[ -d "$skill_dir" ]] && audit_skill "$skill_dir"` (`:122`) — i.e. the **last** command of the AND-list, which is exactly the position `set -e`'s AND-list exemption does **not** cover. Under bash ≥ 4 that aborts the script at that line, before the `printf` — matching the CI log byte for byte. `((CHECKED++))` at `:58` and `((DRIFTED++))` at `:100` carry the same latent defect.

The reason this does not reproduce here: macOS ships **bash 3.2.57**, and a direct probe shows 3.2 does *not* abort:

```
$ bash --version | head -1
GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
$ bash -c 'set -e; C=0; ((C++)); echo "A reached C=$C"'
A reached C=1
```

[VERIFIED]. The CI runner is **Ubuntu 24.04.4** with bash 5.x. **The bash-5 half of this diagnosis is UNMEASURED** — Docker's daemon is down on this machine (`docker info` times out) and no bash ≥ 4 is installed, so I could not execute the reproduction. Treat the mechanism as a strong, log-consistent hypothesis, and have the plan confirm it on a Linux runner before fixing.

The one-character fix, if confirmed: pre-increment (`((++SKIPPED))`, which returns the *new* value and so never yields 0 for a counter) or `SKIPPED=$((SKIPPED + 1))`. Three sites.

### G.4 Why the workflow does not run on this branch

`main.yaml` triggers only on `push` to `main` and `pull_request` with `branches: [main]` [VERIFIED: `:3-22`]. The current branch is `integration/ship-12-squash`. And the v0.2 ship stack is **chained**: of PRs #863–#874, **only #863 targets `main`**; #864–#874 each target the previous `ship/*` branch [VERIFIED — `gh pr list`]. **None of #864–#874 can ever trigger `main.yaml`.** That is why the step has run exactly once in ten runs.

**To make it run**, one of:
1. open a PR from this work onto `main` (the stack entry point's shape, as PR #860 was);
2. `gh workflow run` — ⚠ not available: `main.yaml` has no `workflow_dispatch` trigger, so this would require adding one;
3. push to `main` — out of the question.

Note also `paths-ignore: ["**.md", …]`: a PR touching only Markdown does not trigger the workflow at all. This phase touches `package.json`, `.gitignore`, `.lintstagedrc.json`, `vitest.config.ts` and `main.yaml`, so it triggers.

### G.5 What "observed green" would actually take — and why it is a moving target

Three distinct pieces of work, none of which D-B1 anticipated:

1. **Fix the bash portability defect** (three `((VAR++))` sites) so the script can run to completion on Ubuntu. Until this is done the step fails on the *first* skill regardless of drift. — *But note D-B1's explicit exclusion: "Any plan task that creates, replaces, or 'restores' it is working from the roadmap's false premise." A three-character bug fix is arguably not "replacing" the script; the operator should confirm.*
2. **Resolve the two live drifts** by touching `.claude/skills/data/` and `.claude/skills/database/` (a genuine review of the two commits, or a trivial touch that resets the baseline). Effort: small — the two drifting commits are test-wiring, so a real review is quick.
3. **Get a run.** Requires a PR onto `main` (§ G.4), which is a release-process action outside this phase's control.

**And then it re-reds.** The script's baseline is *"the last commit touching `.claude/skills/<name>/`"*, so **any** later commit under `packages/data/src/`, `packages/matching/src/`, `packages/filters/src/`, `apps/supabase/`, `packages/supabase-types/`, `.agents/`, `.claude/scripts/` re-triggers DRIFT. Of the concurrently-planned v2.15 phases: **Phase 152** renames a fixture in `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts` and sweeps comments across `apps/**` [VERIFIED — ROADMAP Phase 152 criteria 2-3]; **Phase 163** and **Phase 164** work in `apps/supabase/`; **this phase itself** edits `.claude/scripts/audit-skill-drift.sh` (piece 1 above) and `packages/supabase-types/src/index.ts`, both of which are `ship-review-stack`/`database` targets. **Phase 153 editing the script re-reds `ship-review-stack`, and Phase 153 editing `supabase-types` re-reds `database`.**

**"Observed green" is satisfiable, but only as a snapshot, and it is not vacuous — it is currently red for two independent reasons.** Whether it should be a *standing* gate at all, given that any source change reddens it until a human re-reviews the skill, is a design question this phase cannot settle. **Reported, not decided** — see OQ-1.

---

## H. The `lint:check` chain and concurrent-phase collisions

### H.1 `package.json:35`, verbatim

```
    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
```

[VERIFIED — `sed -n '35p' package.json`]

Six `&&`-joined links; the last two are the existing guards, added by Phase 147.

### H.2 The Phase 144 precedent (`b410d3a90`) — what its test actually asserts

Commit `b410d3a900c9f079e487119895bead5e4dedd491`, *"fix(144): assert typecheck's chain MEMBERSHIP in lint:check, not its position"*, 2026-08-28. Its message states the lesson in one line: *"Terminal position was incidental, and asserting it made appending guards a test failure."*

The diff replaces an `endsWith` assertion with a membership one, in `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-84` [VERIFIED — `git show b410d3a90`, quoted verbatim]:

```ts
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn typecheck');
```

**That is the exact shape the new guard's membership test should copy.** How the file reaches the manifest [VERIFIED: `ciTypecheckGate.test.ts:33-45`]:

```ts
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const WORKFLOW = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8');
const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
```

And why a repo-meta spec lives in that workspace, quoted from its docblock (`:19-26`):

> `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests…

**Recommendation:** add the new guard's membership assertion **either** as a new `it()` in `ciTypecheckGate.test.ts` **or** as a sibling spec in `packages/dev-seed/tests/`. A sibling file is preferable here — it keeps Phase 153's diff out of a file whose other assertions are about `main.yaml` step ordering (which Phase 163 may perturb), reducing the three-way conflict surface.

### H.3 Expressing the `lint:check` addition robustly against Phase 152

Phase 152 lands first (D-N1) and appends its comment-scan assertion to this same string. Rules for the plan:

- **Append, never rewrite.** The plan's task must describe the edit as "add ` && yarn assert:declared-binaries` to the end of the existing `lint:check` value", not as a full replacement string — a replacement written against today's six links silently deletes 152's seventh.
- **Assert membership, not position or exact value.** Follow `b410d3a90`: `split('&&').map(trim)` then `toContain('yarn assert:declared-binaries')`. Never `endsWith`, never `toBe` on the whole string, never an index comparison.
- **Do not assert a link count.** Any count assertion breaks the moment either phase lands.
- The `assert:` namespace already exists (`assert:unit-coverage`, `assert:i18n-catalog-namespaces`, `assert:a11y-scan-wiring`); using it for the new script keeps the two phases' additions visually and lexically separate.

### H.4 Files this phase touches, with concurrency flags

| File | Criterion | Also touched by |
|---|---|---|
| `package.json` (`scripts.lint:check` `:35`) | 1 | ⚠ **Phase 152** — same string, same `&&` chain |
| `package.json` (`engine` → `engines` `:74`) | 2 | — |
| `package.json` (new `assert:*` script; possibly `tsup: catalog:` `:69`) | 1 | ⚠ Phase 152 (different keys, same file) |
| `.yarnrc.yml` (catalog `tsup` entry, if option (a)) | 1 | — |
| `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/package.json` | 1 | — |
| `yarn.lock` | 1 | ⚠ any phase adding a dependency |
| `apps/frontend/package.json` (`engine` → `engines` `:54`) | 2 | — |
| `.github/workflows/main.yaml` | 2, 5 | ⚠⚠ **Phase 163** — adds three jobs + edits `format:check` |
| `apps/frontend/vitest.config.ts` | 3 | — |
| `.lintstagedrc.json` | 4, 8 | — |
| `.prettierignore` (add `.claude/`) | 8 | ⚠ Phase 163 (SQL parser work may touch prettier config, not this file) |
| `.gitignore` | 6 | — |
| index removal ×4 (`git rm --cached`) | 6 | — |
| `packages/shared-config/README.md` | 7 | — |
| `packages/README.md` (optional `tsup` in required-devDeps sentence) | 7 | — |
| `packages/supabase-types/src/index.ts` | 7 | ⚠ re-reds the `database` skill (§ G.5) |
| `packages/core/src/controller/controller.ts` | D-B6 | ⚠ **Phase 152** — comment sweep across `packages/**` |
| `.claude/scripts/audit-skill-drift.sh` (if the bash fix is approved) | 5 | ⚠ re-reds the `ship-review-stack` skill (§ G.5) |
| `.claude/skills/{data,database}/SKILL.md` (if drift resolution is approved) | 5 | — |
| `packages/dev-seed/tests/*.test.ts` (membership spec) | 1 | ⚠ Phase 152 (comment sweep covers `packages/**`); ⚠ Phase 163 if it edits `ciTypecheckGate.test.ts` |

**The two hottest surfaces are `package.json:35` (↔ 152) and `.github/workflows/main.yaml` (↔ 163).** Both are append-shaped edits, which is the least conflict-prone form; both are covered by the membership-not-position discipline above.

---

## I. Verification & Test Strategy

### I.1 Per-criterion proof commands

| # | Criterion | Executable proof | Local? |
|---|---|---|---|
| 1 | 8 workspaces declare `tsup`; guard fails by name | `yarn assert:declared-binaries` → `0 violation(s)`, exit 0. **Negative control:** delete one `"tsup"` line, re-run, observe exit 1 naming that workspace, restore. Plus `yarn lint:check` (membership) and `yarn test:unit` (the membership spec) | ✅ fully |
| 2 | `engines` binds | `node -e "const p=require('./package.json'); if(!p.engines) process.exit(1)"` proves the rename. **"Binds" is not locally provable** — nothing on this tree consumes the field (§ B.2), and Yarn enforces nothing | ⚠ **CI only**, and only after § B.3's mechanism is chosen |
| 3 | no `__dirname` in `apps/frontend/vitest.config.ts` | `grep -c __dirname apps/frontend/vitest.config.ts` → `0`; `cd apps/frontend && npx vitest list --run` (loads config **and** collects, exercising every alias); `yarn workspace @openvaa/frontend test:unit` → 54 files / 816 tests | ✅ fully |
| 4 | no `bash -c` in `.lintstagedrc.json` | `! grep -q "bash -c" .lintstagedrc.json`; plus the § D.5 scratch-repo lint-staged run showing the remaining tasks execute | ✅ fully |
| 5 | skill-drift step observed green | `bash .claude/scripts/audit-skill-drift.sh; echo $?` → must be `0` (**today: 1**). Then the observation itself: a `main.yaml` run in which `skill-drift-check` concludes `success` | ⚠ **local half yes; the CI observation requires a PR onto `main`** (§ G.4) |
| 6 | no tracked build artefacts | `git ls-files \| grep -E 'tsbuildinfo\|\.branches'` → empty; `git check-ignore -v <each of the 4>` → names the new rule | ✅ fully |
| 7 | docs/imports true | `! grep -q '\^1\.0\.0' packages/shared-config/README.md`; `grep -rEn "from ['\"]\.\.?/[^'\"]*\.js['\"]" --include='*.ts' packages apps tests` → `0`; `yarn typecheck`; `yarn build` | ✅ fully |
| 8 | `.svelte`/`.mjs` covered on commit | The § D.5 two-run negative control (`— 0 files` → `— 2 files`), in a scratch repo with the real lint-staged binary | ✅ fully (**does not** need the hook, which is disabled here — § D.4) |
| D-B6 | `controller.ts:73` params prefixed | `npx eslint --flag v10_config_lookup_from_file packages/core/src/controller/controller.ts` → clean (today: 2 warnings) | ✅ fully |

**Not locally executable: criterion 2's "binds" half and criterion 5's CI observation.** Both need an evidence artefact. The in-project precedent is a phase-dir evidence file on the `137-NEGATIVE-CONTROL.md` model — a document with `**Date:**`, `**Plan:**`, `**Decisions discharged:**`, `**Requirements:**`, `**Precedent followed:**` headers, then a numbered "why this run existed" narrative and the pasted observations. Ten such files exist in `.planning/phases/` (137, 138, 140, 141, 142, 142.1, 143, 144, 145, 146) [VERIFIED — `ls`]. **Recommendation: one `153-NEGATIVE-CONTROL.md` covering criteria 1 (guard negative control), 2 (CI run URL + job log excerpt), 5 (CI run URL + `skill-drift-check` conclusion) and 8 (the before/after `— N files` pair).** This resolves CONTEXT `<open>` item 3.

### I.2 Regression signal — is a full E2E run needed?

**CLAUDE.md's E2E hard rule is unambiguous** (a failing E2E test is a cardinal failure; "did not run" counts as failure; no flaky exemptions), and it is a *standing* rule about the state of the suite, not a per-phase gate obligation. Assessed honestly against this phase's diff:

- **Nothing this phase changes is reachable from a browser.** The edits are manifests, a gitignore, a lint-staged config, a vitest config, a README, a barrel's import specifiers, two `_`-prefixed parameter names, and CI YAML. Not one is loaded by the served application.
- **The one runtime-adjacent change is `packages/supabase-types/src/index.ts`**, whose consumers are 20 files that import through the barrel — fully covered by `yarn build` + `yarn typecheck` + `yarn test:unit`. A resolution failure there is a *compile* failure, not a runtime one.
- **The one change that could plausibly affect the app is the `tsup` declaration set** — and § A.4 establishes that it resolves to the already-locked `tsup@npm:^8.5.1` with no resolution change. `yarn build` succeeding is the complete signal.

**Cheapest sufficient regression signal, in order:**

1. `yarn build` — 12s warm, ~2min cold. Catches the `tsup`/`yarn.lock` and supabase-types changes.
2. `yarn typecheck` (subsumed by 3) — catches the barrel and the config edits.
3. `yarn lint:check` — 22 tasks, seconds warm; catches eslint regressions and runs the new guard.
4. `yarn test:unit` — ~18s warm; 25 tasks including the frontend's 816 tests, which load `vitest.config.ts` and thus exercise criterion 3 end to end, and the dev-seed repo-meta specs that assert the `lint:check` chain.
5. `yarn format:check` — confirms the `.prettierignore` addition did not un-cover anything.

**Recommendation:** gate on `yarn build && yarn lint:check && yarn test:unit && yarn format:check` per wave, and run the **full E2E suite once at phase close** to discharge the standing cardinal rule — not as a per-task signal, and not as evidence for any criterion, none of which E2E can speak to. If the operator wants a stricter reading of the E2E rule, that is a decision, not a research finding.

⚠ **Environment note for whoever runs E2E:** the recorded memory `project_gsd_e2e_disk_sinks.md` reports ENOSPC voiding full-suite runs on this machine (~52 GiB reclaimable Docker.raw), and `docker info` timed out during this research — the Docker daemon is currently down. A full E2E run at phase close will need `yarn db:start` (which needs Docker) and a fresh dev server on `:5173`. Budget for that, or plan the E2E gate for a session where the daemon is up.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **Vitest 3.2.4** (catalog `vitest: ^3.2.4`), orchestrated by **Turborepo 2.8.17** |
| Config files | 12 `vitest.config.ts` — one per test-bearing workspace, plus `tests/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/<ws> test:unit` (single workspace) |
| Full suite command | `yarn test:unit` → `yarn assert:unit-coverage && turbo run test:unit` |
| Measured full-suite baseline | ✅ **25/25 tasks**; frontend 54 files / 816 tests, dev-seed 49 files / 569 tests; 17.5 s warm |
| Repo-meta spec home | `packages/dev-seed/tests/` (see `ciTypecheckGate.test.ts:19-26` for the rationale) |
| Shell-level guards | `scripts/assert-*.mjs`, chained into `lint:check` / `test:unit` |

### Phase Requirements → Test Map

| Req | Behaviour | Test type | Automated command | Exists? |
|---|---|---|---|---|
| CFG-01 | Every workspace declares the binaries its `build` script invokes | guard script | `yarn assert:declared-binaries` | ❌ **Wave 0** — `scripts/assert-declared-binaries.mjs` |
| CFG-01 | The guard is a member of the `lint:check` chain | unit | `yarn workspace @openvaa/dev-seed test:unit` | ❌ **Wave 0** — spec in `packages/dev-seed/tests/`, shaped per `b410d3a90` |
| CFG-01 | Guard **fails** when a declaration is removed | negative control | delete one `"tsup"`, run guard, expect exit 1 naming the workspace, restore | ❌ Wave 0 — recorded in `153-NEGATIVE-CONTROL.md` |
| CFG-02 | Field is spelled `engines` in both manifests | unit or guard | `node -e` manifest assertion, or an `it()` beside the chain spec | ❌ Wave 0 |
| CFG-02 | The constraint **binds** | CI observation | a `main.yaml` job; shape depends on § B.3 / OQ-2 | ❌ **CI only** — evidence doc |
| CFG-03 | Config carries no `__dirname` | grep guard | `grep -c __dirname apps/frontend/vitest.config.ts` → 0 | ✅ trivial |
| CFG-03 | Config loads and all 11 aliases resolve | integration | `cd apps/frontend && npx vitest list --run`; then `yarn workspace @openvaa/frontend test:unit` | ✅ 54 files / 816 tests, green today |
| CFG-04 | No `bash -c` in `.lintstagedrc.json` | grep guard | `! grep -q "bash -c" .lintstagedrc.json` | ✅ trivial |
| CFG-04 | Remaining tasks still execute | integration | scratch-repo lint-staged run (§ D.5) | ❌ Wave 0 — recipe given |
| CFG-05 | Script exits 0 locally | shell | `bash .claude/scripts/audit-skill-drift.sh; echo $?` | ⚠ **exists and is RED (exit 1)** |
| CFG-05 | CI step observed green | CI observation | `gh run view <id> --json jobs` → `skill-drift-check: success` | ❌ **CI only**, blocked on § G.4 |
| CFG-06 | No tracked build artefacts | grep guard | `git ls-files \| grep -E 'tsbuildinfo\|\.branches'` → empty | ✅ trivial |
| CFG-06 | Each path is ignored by a named rule | grep guard | `git check-ignore -v <path>` ×4 | ✅ trivial |
| CFG-07 | README advertises no unresolvable version | grep guard | `! grep -q '\^1\.0\.0' packages/shared-config/README.md` | ✅ trivial |
| CFG-07 | No TS-internal `.js` specifiers | grep guard | `grep -rEn "from ['\"]\.\.?/[^'\"]*\.js['\"]" --include='*.ts' packages apps tests` → 0 | ✅ trivial (baseline: 4) |
| CFG-07 | Barrel still resolves for all 20 consumers | integration | `yarn typecheck && yarn build && yarn test:unit` | ✅ green today |
| CFG-08 | The glob matches `.svelte` and `.mjs` | negative control | scratch-repo lint-staged, before/after `— N files` | ❌ Wave 0 — **both directions already demonstrated in research** |
| CFG-08 | The fixed hook does not hard-error on skill fixtures | integration | stage a `.claude/skills/**/*.svelte` in the scratch repo, expect pass after the `.prettierignore` addition | ❌ Wave 0 |
| D-B6 | `controller.ts:73` is warning-free | lint | `npx eslint … packages/core/src/controller/controller.ts` | ✅ (baseline: 2 warnings) |

### Sampling Rate

- **Per task commit:** the criterion's own grep/guard one-liner (sub-second) **plus** `yarn lint:check` when the task touched `package.json`, a manifest, or an eslint-visible source file. Warm `lint:check` is seconds (`FULL TURBO`), so there is no reason to sample coarser.
- **Per wave merge:** `yarn build && yarn lint:check && yarn test:unit && yarn format:check`. Measured warm: ~12 s + seconds + ~18 s + seconds. Cheap enough to run on every wave.
- **Phase gate:** the four above green, **plus** `bash .claude/scripts/audit-skill-drift.sh` exit 0 (criterion 5's local half), **plus** the full E2E suite once to discharge CLAUDE.md's cardinal rule, **plus** `153-NEGATIVE-CONTROL.md` complete with the two CI-only observations.
- **Nyquist rationale:** the fastest-moving signal in this phase is the `lint:check` chain, which two phases edit concurrently; sampling it at every commit that touches `package.json` is the minimum rate that catches a clobbered chain before it compounds. The slowest is the CI observation, sampled once per phase because a workflow run is the only instrument.

### Wave 0 Gaps

- [ ] `scripts/assert-declared-binaries.mjs` — covers CFG-01. Prototype logic and full violation measurement in § A.3; style contract in § A.1.
- [ ] `packages/dev-seed/tests/<name>.test.ts` — `lint:check` chain-membership spec for the new guard (+ optionally the `engines` field assertion for CFG-02). Shape copied from `ciTypecheckGate.test.ts:83-84`.
- [ ] `.planning/phases/153-build-tooling-config-correctness/153-NEGATIVE-CONTROL.md` — evidence artefact for the guard negative control (CFG-01), the two CI observations (CFG-02, CFG-05) and the lint-staged before/after (CFG-08). Model: `137-NEGATIVE-CONTROL.md`.
- [ ] A reusable scratch-repo lint-staged harness (or a documented recipe) for the CFG-04/CFG-08 proofs, since the hook is disabled in this worktree.
- [ ] No framework install needed — Vitest, Turborepo and all guards are present and green.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Map an invoked binary to the package that provides it | A hard-coded `{tsc: 'typescript', 'svelte-kit': '@sveltejs/kit'}` alias table | Read each declared dep's `package.json` `bin` field | The table rots the moment a dep is added; reading `bin` is the ground truth and is what made the § A.3 prototype produce zero false positives |
| Enumerate workspaces | A hand-written array of paths | The root manifest's `workspaces` globs, or `yarn workspaces list --json` | Two workspaces (`dev-tools`, `shared-config`) are easy to forget; a hard-coded list is the same defect the guard exists to catch |
| Suppress lint-staged's file-argument appending | `bash -c '…'` (today) or a custom wrapper script | Either delete the redundant command (§ D.3(a)) or use lint-staged's own function-task form | The function form is the documented mechanism and is verified in the installed source at `getSpawnedTask.js:102`; `bash -c` re-introduces the very bash dependency CFG-04 removes |
| Derive a config file's own directory in ESM | `__dirname` (relying on Vite's `define` shim) | `fileURLToPath(new URL('.', import.meta.url))` | The shim is a Vite implementation detail; the neighbouring `vite.config.ts:10` already shows the portable form |
| Enforce a Node version range | A bespoke `preinstall` semver check *(if avoidable)* | `actions/setup-node` with `node-version-file: package.json` | First-party, reads `engines.node` directly, and makes the field's corruption a CI failure at zero maintenance. ⚠ It does **not** enforce locally — if local enforcement is required, the bespoke check becomes the honest answer (OQ-2) |
| Untrack a file | `git update-index --skip-worktree` | `git rm --cached` + a `.gitignore` rule | `skip-worktree` leaves the path tracked, so the criterion stays unmet while appearing fixed, and it is per-clone local state |
| Assert a script is wired into a chain | `endsWith` / index comparison | `split('&&').map(trim)` + `toContain` | Exactly the defect `b410d3a90` fixed; with Phase 152 appending to the same chain, a position assertion is guaranteed to break |
| Assert a CI job fails as expected | `continue-on-error: true` | `if cmd; then echo "::error::…"; exit 1; fi` | `continue-on-error` un-blocks the job but asserts nothing; the repo's own `main.yaml:228-230` uses the explicit-negation + `::error::` form |
| Increment a counter under `set -e` in bash | `((VAR++))` | `((++VAR))` or `VAR=$((VAR + 1))` | Post-increment returns the old value; when that is 0 the arithmetic command exits 1 and `set -e` kills the script — the § G.3 diagnosis |

---

## Common Pitfalls

### Pitfall 1: Planning "add tsup to 8 workspaces" and expecting the guard to be green
**What goes wrong:** a guard scoped to *all* scripts reports **16** violations, not 8; the plan's last task fails.
**Why:** the same 8 packages also invoke `eslint` in `lint` without declaring it (they reach it through `@openvaa/shared-config`'s own `dependencies`).
**How to avoid:** scope the guard to `build` scripts, which is what REVIEW-CFG-01 literally says, and file the `eslint` class to `.planning/todos/pending/`.
**Warning sign:** the guard's first run reports a number other than 8.

### Pitfall 2: Planning a demonstration that `__dirname` currently breaks
**What goes wrong:** the "observe the break, then the fix" negative control cannot be produced.
**Why:** Vite `define`s `__dirname` when bundling the config, in ESM mode too (`config.js:35819`). Nothing is broken today.
**How to avoid:** frame criterion 3's proof as *no regression* — `vitest list` collects and `test:unit` stays at 816 passing — plus an optional wrong-directory negative control to show the aliases are genuinely exercised.

### Pitfall 3: Replacing `bash -c '…'` with the bare command string
**What goes wrong:** the pre-commit hook breaks with `Could not find task 'README.md' in project`.
**Why:** lint-staged appends staged file paths to every *string* command; `bash -c` was absorbing them.
**How to avoid:** delete the redundant entries (the husky hook already runs the build) or use a function task in a `.mjs` config.
**Warning sign:** any plan task whose diff is `"bash -c 'X'"` → `"X"`.

### Pitfall 4: Shipping the glob fix without touching `.prettierignore`
**What goes wrong:** any future commit that stages one of the 45 `.claude/skills/**/*.svelte` fixtures fails at `prettier --write` with exit 2.
**Why:** the root prettier config loads no svelte plugin, and `.claude/` is not ignored; `prettier --check .` never reaches those files but lint-staged passes explicit paths.
**How to avoid:** add `.claude/` to `.prettierignore` in the same commit.
**Warning sign:** `npx prettier --check <any .claude skills svelte file>` → `No parser could be inferred`.

### Pitfall 5: Budgeting a large `.svelte` formatting churn commit
**What goes wrong:** a planned commit turns out to be empty, and the plan looks wrong at close.
**Why:** all 170 frontend + 16 docs `.svelte` files and all 34 `.mjs` files are already prettier- and eslint-clean, because `yarn format` covers them repo-wide.
**How to avoid:** state the measured zero; keep at most a verification task ("`prettier --check` on the newly-covered set reports clean") rather than a churn commit.

### Pitfall 6: Treating criterion 5 as a free observation
**What goes wrong:** the plan's only criterion-5 task is "look at a CI run", and it cannot pass.
**Why:** the script exits 1 locally (2 drifts) *and* aborted in the one CI run it appeared in; and `main.yaml` cannot even trigger on this branch.
**How to avoid:** escalate to the operator (OQ-1) before writing tasks.

### Pitfall 7: Rewriting `lint:check` wholesale
**What goes wrong:** Phase 152's appended scan is silently deleted.
**Why:** both phases edit the same string and both are `Depends on: Nothing`.
**How to avoid:** express the edit as an append; assert membership per `b410d3a90`; never assert position or link count.

### Pitfall 8: Editing `main.yaml` step names
**What goes wrong:** `packages/dev-seed/tests/ciTypecheckGate.test.ts` reddens.
**Why:** it asserts `- name: "Type-check all packages (turbo run typecheck)"` and `- name: "Run ESlint check on frontend"` each appear **exactly once**, and in that order.
**How to avoid:** add new jobs as new top-level `jobs:` keys; do not touch, duplicate, or rename those two steps.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | ✅ | **v24.14.1** (satisfies `>=22`) | — |
| Yarn | everything | ✅ | **4.13.0** (pinned via `yarnPath`) | — |
| Turborepo | build/lint/test orchestration | ✅ | 2.8.17 | — |
| Vitest | criterion 3 proof, unit gate | ✅ | 3.2.4 | — |
| Vite | config loading | ✅ | 6.4.1 (frontend) | — |
| tsup | the 8 builds | ✅ | 8.5.1 (root-hoisted) | — |
| lint-staged | criteria 4, 8 proofs | ✅ | 16.4.0, invocable at `node node_modules/lint-staged/bin/lint-staged.js` | — |
| prettier / eslint | churn measurement | ✅ | catalog `^3.7.4` / `^9.39.2` | — |
| `gh` CLI | criterion 5's CI evidence | ✅ | authenticated as `kaljarv`, scopes incl. `workflow` | — |
| git worktree hooks | criterion 8 via the real hook | ❌ | `core.hooksPath=/dev/null` (worktree-scoped) | ✅ scratch-repo lint-staged run (§ D.5) |
| bash ≥ 4 | reproducing the § G.3 CI abort | ❌ | only bash **3.2.57** (macOS) | ⚠ none locally — Docker daemon down |
| Docker | Supabase, E2E | ❌ | daemon down (`docker info` timed out at 60 s) | — |
| A Yarn engine-check setting | criterion 2 artefact (ii) | ❌ | **does not exist in Yarn 4.13.0** | see § B.3 |

**Missing with no fallback:** bash ≥ 4 (blocks *reproducing* the criterion-5 CI abort locally — diagnosis stands on the CI log); a Yarn engine-check setting (blocks D-B5(ii) outright).
**Missing with fallback:** the git hook (scratch-repo lint-staged run is a complete substitute and is arguably better evidence, since it isolates lint-staged from husky).
**Missing but only needed at phase close:** Docker, for the E2E gate.

---

## Security Domain

`security_enforcement` is not disabled, so this section is included. This phase changes no authentication, session, access-control, cryptographic or data-handling code, so most ASVS categories do not apply.

| ASVS Category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | no auth surface touched |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |
| V14 Configuration | **yes** | The whole phase. Controls: no new third-party dependency is introduced (the 8 `tsup` declarations resolve to the already-locked `tsup@npm:^8.5.1`); the untracked `tsbuildinfo` files and `supabase/.branches/_current_branch` contain no secrets (verified: `_current_branch` is the 4-byte string `main`; the `.tsbuildinfo` files are TypeScript's own file-hash state); `.gitignore` additions widen, never narrow, what is excluded |

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| **Supply-chain: adding an unvetted Yarn plugin** to satisfy criterion 2 | Tampering / Elevation of Privilege | `.gitignore:29` (`!.yarn/plugins`) means a plugin is *committed and executed on every install by every developer and CI runner*. `devoto13/yarn-plugin-engines` is 2+ years unmaintained and unpublished to npm. **Recommend against**; if adopted, vendor a pinned, reviewed copy and record the review. |
| **Slopsquatting** on a new dependency | Tampering | Not applicable — this phase adds **no new package**. See § Package Legitimacy Audit. |
| **Secret leakage via a CI `run:` block** | Information Disclosure | Any new job must follow the existing discipline at `main.yaml:218-220`: append to `$GITHUB_ENV` only, never echo, never `set -x`. |
| **Weakened pre-commit coverage** | Repudiation | Criterion 4's edit must not remove any *file-consuming* task. Deleting the two `bash -c` build entries removes no lint/format coverage — the build still runs at `.husky/pre-commit:1`. |
| **A guard that passes vacuously** | Repudiation | Every new guard needs a negative control recorded in `153-NEGATIVE-CONTROL.md`. This is the milestone's standing acceptance rule (§ I.1), and § G is the case study in what happens without it. |

---

## Package Legitimacy Audit

**No package is added to any registry-resolved dependency by this phase.** The 8 `tsup` declarations reference a package already present in `yarn.lock` as a single entry, `"tsup@npm:^8.5.1"`, already installed at 8.5.1, already declared at the repo root.

| Package | Registry | Age | Downloads | Source repo | Verdict | Disposition |
|---|---|---|---|---|---|---|
| `tsup` | npm | long-established | high | github.com/egoist/tsup | **OK** | Already a root devDependency at `^8.5.1`; already in `yarn.lock`; already the binary all 8 builds invoke. Declaring it in 8 more manifests introduces no new resolution. |
| `yarn-plugin-engines` (devoto13) | **none — not on npm** | GitHub repo last pushed 2024-04-07 | n/a | github.com/devoto13/yarn-plugin-engines (64★, MIT) | **SUS** | **NOT recommended** — considered and reported for § B.3 option 4 only. If the operator selects it, the planner must add a `checkpoint:human-verify` task before adoption. `npm view yarn-plugin-engines` → **E404**. |

**Packages removed due to [SLOP]:** none.
**Packages flagged [SUS]:** `yarn-plugin-engines` — reported as an option, not recommended; requires an operator checkpoint if adopted.

*The `gsd-tools query package-legitimacy check` seam was not invoked because no package is being newly introduced; both rows above are grounded in direct registry/API measurement (`npm view`, `gh api`) rather than in training recall.*

---

## Open Questions for the Operator

### OQ-1 ⚠ Criterion 5 / D-B1 — "observed running green" is not a free observation

**The finding.** The CONTEXT's D-B1 fixes the deliverable as *"a real workflow run in which the step is observed passing — evidence of the run, not a code change."* Three measurements contradict the premise that no code change is needed:

1. `bash .claude/scripts/audit-skill-drift.sh` **exits 1 on this tree**, reporting DRIFT for `data` and `database`. It is not inert — 5 of 8 skills are actively checked; only `architect` and `components` declare `targets: []` and one omits the key.
2. In the **only CI run where the step executed** (run `32058994754`, PR #860, 2026-08-17), it **failed**, aborting after its banner with no per-skill output — a different failure from the local one, diagnosed as `((VAR++))` under `set -e` on Ubuntu's bash 5 (three sites: `:53`, `:58`, `:100`). The bash-5 half of that diagnosis is **unmeasured** (no bash ≥ 4 available; Docker down).
3. `main.yaml` triggers only on pushes to `main` and PRs targeting `main`. The current branch is `integration/ship-12-squash`, and of the ship stack #863–#874 only **#863** targets `main`. **The step cannot run from this work without a PR onto `main`.**

**The decision needed.** Which of these is in scope?

- **(a)** Fix the three `((VAR++))` sites, resolve the two drifts by touching `.claude/skills/{data,database}/`, then obtain a run. — *Genuinely satisfies criterion 5. But it is a code change to the very script D-B1 says not to touch (D-B1's exclusion names "creates, replaces, or restores"; a portability bug fix is arguably none of those — needs your ruling), and it depends on a PR onto `main` this phase does not control.*
- **(b)** Fix and resolve, and record local `exit 0` as the criterion's evidence, deferring the CI observation to whenever the stack next opens a PR onto `main`. — *Honest, achievable, but leaves criterion 5's own word "on a real workflow run" unmet.*
- **(c)** Scope criterion 5 out of Phase 153 with a written rationale, and file the script's bash defect plus the drift-resolution question to `.planning/todos/pending/`. — *Clean, but drops the only check that the workflow runs at all, which was D-B1's stated reason for keeping it.*

**Additional design question worth answering with it:** the audit's baseline is "the last commit touching the skill's own directory", so **any** commit under a target directory reddens it until a human re-reviews the skill. Phases 152, 163 and 164 all touch such directories, and **Phase 153 itself** would re-red `ship-review-stack` (by editing `.claude/scripts/`) and `database` (by editing `packages/supabase-types/`). Is a permanently-blocking gate with that trigger sensitivity the intent, or should the check be advisory (`exit 0` + annotation) with a separate periodic review?

---

### OQ-2 ⚠ Criterion 2 / D-B5 — the locked `.yarnrc.yml` mechanism does not exist

**The finding.** D-B5 requires *"(ii) a `.yarnrc.yml` setting that makes a mismatch an **error**"*. Measured three ways, that setting does not exist in Yarn 4.13.0:

- Grepping the pinned `.yarn/releases/yarn-4.13.0.cjs` finds zero occurrences of `enableEngineChecks`, `engineStrict`, `engine-strict` or `checkEngines`, and does find Yarn's own message *"The --ignore-engines option is deprecated; engine checking isn't a core feature anymore"*.
- `yarn config --json` lists **101** settings; filtering key *and* description on `/engine/i` returns one false positive (`enableMessageNames`, "search engines").
- A scratch project declaring `engines: { node: ">=99" }` **installs cleanly** under Node v24.14.1 with no warning.

D-B5 rejected option (c) (a preinstall check) on the grounds that *"the package manager already has one."* **It does not.**

**The decision needed.** What does "binds" mean, given that?

- **(a) CI-consumption binding — recommended.** Replace the four hard-coded `node-version: 22.22.1` inputs in `main.yaml` with `node-version-file: package.json`, so `actions/setup-node` resolves the range from `engines.node` itself. The rename becomes load-bearing (a re-misspelling breaks every job), with no bespoke code and no new dependency. *Does not reject an out-of-range Node locally.*
- **(b) Install-time binding via a repo script.** A `preinstall` (or a `scripts/assert-node-engine.mjs` chained into `lint:check`) comparing `process.version` against `engines.node`. This is the only option that literally rejects an out-of-range Node, locally and in CI — and it is precisely what D-B5(c) rejected on a now-falsified premise. **Does this reversal have your approval?**
- **(c) Third-party Yarn plugin** (`devoto13/yarn-plugin-engines`): native install-time rejection, but 64★, last pushed 2024-04-07, **not published to npm**, and it would be **committed into `.yarn/plugins/`** and executed on every install by everyone. Flagged **SUS**; not recommended.
- **(d) Rename only**, and restate criterion 2 as "the field is spelled correctly and is consumed by CI" — i.e. option (a) without the negative-control job.

**Sub-question, carried from CONTEXT `<open>` item 4 and now sharper:** should the out-of-range-Node job be a **permanent** gate or a **one-off** observation? A permanently-red-by-design job is unusual CI shape, and under option (a) it would be *skipped entirely* (setup-node would simply resolve the declared range). A one-off run recorded in `153-NEGATIVE-CONTROL.md` fits this repo's evidence-doc precedent better.

---

### OQ-3 Criterion 1 — guard scope: 8 violations or 16?

Measured: scoped to `build` scripts the guard reports **exactly 8** (all `tsup`, the named workspaces, zero false positives). Scoped to all scripts it reports **16** — the same 8 plus **8 undeclared `eslint` invocations in the same packages' `lint` scripts**.

`REVIEW-CFG-01` says *"invokes a binary in its `build` script"*, which supports the 8. But the 8 `eslint` hits are arguably real (`eslint` is declared only at the root and inside `@openvaa/shared-config`'s own `dependencies`), and `packages/dev-seed` / `packages/dev-tools` declare it directly, so the 8 are the outliers.

**Recommendation: `build` scope, with the `eslint` class filed to `.planning/todos/pending/`.** Confirm, or authorise the 16-edit version.

---

### OQ-4 Criterion 7 — the `shared-config` README fix shape

CONTEXT `<open>` item 2 flags this as unresolved. § F.1 gives a concrete, measurement-grounded replacement: `workspace:^` for the shared config (the form all 14 real consumers use — `^1.0.0` cannot resolve, the package is `private` at `0.1.0`), and `catalog:` for `typescript` (the reviewer's *"align the TypeScript versioning with the repo's catalog usage"*) and `tsup`. That is a mechanical derivation, not a judgement call.

Two genuine decisions ride on it:

1. **Does `tsup` get a `catalog:` entry?** With 9 workspaces declaring it, `.yarnrc.yml:19`'s own stated rule ("deps shared across 2+ workspaces") says yes — which also changes the root `package.json:69` and the README snippet. The alternative is nine copies of `"^8.5.1"`.
2. **`packages/README.md:21` lists the required devDeps as `@openvaa/shared-config`, `typescript`, `vitest` — omitting `tsup`, while `:20` states the canonical build script is `"tsup && …"`.** That omission is plausibly the *origin* of REVIEW-CFG-01, and correcting it is squarely inside criterion 7's remit ("the repo's documentation is true of the repo") — but it is a **third file** the criterion does not name. In scope, or a todo?

---

### OQ-5 The criterion-4 fix shape: delete, or convert to a `.mjs` config?

`.husky/pre-commit:1` already runs `yarn turbo run build --filter=@openvaa/app-shared...` before invoking lint-staged, so both `bash -c` entries are **redundant re-runs**. Deleting them satisfies REVIEW-CFG-04 with the smallest possible diff and keeps the config as JSON. The alternative — converting to `lint-staged.config.mjs` with a function task — preserves the redundant build and changes the file format.

**Recommendation: delete.** Confirm, or state that lint-staged must remain runnable standalone (outside the hook) with the build attached.

---

### OQ-6 Evidence artefact shape (CONTEXT `<open>` item 3)

Recommended: a single `.planning/phases/153-build-tooling-config-correctness/153-NEGATIVE-CONTROL.md` on the `137-NEGATIVE-CONTROL.md` model, carrying (a) the guard's negative control, (b) the criterion-2 CI observation, (c) the criterion-5 run URL + `skill-drift-check` conclusion, (d) the lint-staged before/after `— N files` pair. Ten such files already exist in `.planning/phases/`. Confirm, or specify a different artefact (a run URL in the plan close-out, a pasted job log).

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | The CI abort in run `32058994754` is caused by `((VAR++))` returning 1 under `set -e` on Ubuntu's bash 5.x | § G.3 | **Medium.** The log (banner, then exit 1, no per-skill line, no trailer) matches this mechanism exactly and no other candidate fits, and macOS bash 3.2 is measured *not* to abort. But the bash-5 reproduction is **unmeasured** (no bash ≥ 4 installed; Docker daemon down). If wrong, criterion 5 has a different root cause and the three-line fix will not make CI green. **Confirm on a Linux runner before fixing.** |
| A2 | Adding `"tsup"` to 8 manifests produces no resolution change and only descriptor entries in `yarn.lock` | § A.4 | Low. `yarn.lock` has a single `"tsup@npm:^8.5.1"` entry and all 8 would use the same range. **Unmeasured** — I did not run `yarn install`, to avoid dirtying `yarn.lock` alongside eleven concurrent agents. If wrong, the lockfile delta is larger than expected; harmless, but the plan should review it. |
| A3 | `actions/setup-node` **fails** (rather than warns) when `node-version-file: package.json` is set and `engines.node` is absent or misspelled | § B.3 option 1 | Medium. The support for reading `engines.node` is [CITED: actions/setup-node advanced-usage.md]; the *failure* behaviour is not documented in what I read and cannot be run locally. If it warns instead of failing, option 1 does not guard against re-misspelling and only option (b)/(c) of OQ-2 binds. |
| A4 | The `.claude/skills` `.svelte` fixtures are not intended to be prettier-formatted | § D.6 | Low. They are verbatim spike sources whose value is fidelity to what was run. If wrong, the alternative is adding `prettier-plugin-svelte` to the root config — a larger change with repo-wide effects. |
| A5 | `packages/README.md:21`'s omission of `tsup` from the required devDeps is an oversight rather than deliberate | § F.1 / OQ-4 | Low. Line 20 of the same document states the build script invokes `tsup`. Raised as an operator question rather than assumed. |
| A6 | The `tsbuildinfo` files were committed accidentally (IDE/`tsc -b` side effect) rather than deliberately | § E | Low. Each has 1–2 commits, all dated 2026-08-17 (the ship-stack import), and `packages/README.md:20` states the intent is for them to be gitignored. |
| A7 | A pure-config phase does not require a full E2E run as a per-wave gate | § I.2 | Low-medium. Nothing in the diff is reachable from a browser, and the compile-time gates cover the one runtime-adjacent change. But CLAUDE.md's cardinal rule is strict; the recommendation is one E2E run at phase close, and a stricter reading is the operator's to impose. |

---

## Sources

### Primary (HIGH confidence — measured in this worktree at `22c2542e3`)

- `package.json` (`:25-27`, `:35`, `:69`, `:74`), `apps/frontend/package.json` (`:54`, `:59`)
- `.yarnrc.yml` (`:1`, `:3`, `:5-40`), `.yarn/releases/yarn-4.13.0.cjs` (grep for engine settings), `yarn config --json` (101 settings), live `yarn install` engines probe
- `.lintstagedrc.json` (all 8 lines), `.husky/pre-commit`, `.husky/post-commit`
- `node_modules/lint-staged/lib/getSpawnedTask.js:102`, `getSpawnedTasks.js:39`, `getFunctionTask.js`, `validateBraces.js` (lint-staged 16.4.0)
- `node_modules/vite/dist/node/chunks/config.js:35802,35819,35822,35862` (Vite 6.4.1)
- `apps/frontend/vitest.config.ts` (all 56 lines), `apps/frontend/vite.config.ts:1,8-10`
- `.claude/scripts/audit-skill-drift.sh` (all 135 lines) + live run (exit 1) + per-skill `targets:` extraction
- `.github/workflows/main.yaml` (all 383 lines), `gh run list`, `gh run view --json jobs`, `gh run view --log` for run `32058994754`, `gh pr list`
- `packages/README.md:18,20,21,22,23`; `packages/shared-config/README.md:1-15`, `packages/shared-config/package.json`, `packages/shared-config/tsconfig.base.json:6,11,12`, `packages/shared-config/eslint.config.mjs:130-142`
- `packages/supabase-types/{package.json,tsconfig.json,src/index.ts}`; `packages/core/{tsconfig.json,.gitignore,src/controller/controller.ts:60-84}`
- `.gitignore` (78 lines), `.prettierignore`, `prettier.config.mjs`, `apps/frontend/prettier.config.mjs`, `apps/supabase/supabase/.gitignore`
- `packages/dev-seed/tests/ciTypecheckGate.test.ts` (all 88 lines), `git show b410d3a90`
- `scripts/assert-i18n-catalog-namespaces.mjs`, `scripts/assert-a11y-scan-wiring.mjs`
- Baseline runs: `yarn build`, `yarn lint:check`, `yarn format:check`, `yarn test:unit`, `npx vitest list`, `npx prettier --check` (svelte/mjs sets), `npx eslint` (170 svelte files, controller.ts), `npx turbo run build … <files>`
- Prototype guard `<scratchpad>/probe2.mjs`, run at three script scopes
- Scratch-repo lint-staged negative control (before/after), scratch-repo Yarn engines probe

### Secondary (MEDIUM confidence)

- [CITED: github.com/actions/setup-node/blob/main/docs/advanced-usage.md] — `node-version-file: package.json` reads `volta.node`, then `devEngines.runtime`, then `engines.node`
- [VERIFIED via `gh api` + `npm view`] `devoto13/yarn-plugin-engines`: 64★, MIT, pushed 2024-04-07, no releases, **not on npm** (E404)

### Tertiary (LOW confidence — flagged in the Assumptions Log)

- Bash ≥ 4 `set -e` behaviour on `((VAR++))` returning 1 (A1) — training knowledge, consistent with the CI log and with the measured bash-3.2 contrast, but not executed
- `actions/setup-node` hard-fail behaviour on a missing `engines.node` (A3)

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Guard design + true failing set (§ A) | **HIGH** | Prototype run against the real tree at three scopes; every awkward script construct enumerated and accounted for; zero false positives at build scope |
| Yarn has no engine-check setting (§ B) | **HIGH** | Three independent measurements including a live install probe |
| `engines` alternatives (§ B.3) | MEDIUM | The mechanisms are real and cited; setup-node's *failure* semantics unverified (A3) |
| `__dirname` count, cause and fix (§ C) | **HIGH** | Count run twice two ways; the shim quoted from Vite's own source with line numbers; the replacement pattern exists one file over; proof command executed |
| lint-staged semantics + both proofs (§ D) | **HIGH** | Source-verified at the exact line, plus a two-direction executable negative control |
| Churn = zero (§ D.6) | **HIGH** | prettier and eslint run over all 234 tracked `.svelte` and all 34 `.mjs` |
| Tracked artefacts (§ E) | **HIGH** | `git ls-files`, sizes, histories, and the ignore-rule text all measured |
| Docs/import corrections (§ F) | **HIGH** | Conventions quoted verbatim with line numbers; `moduleResolution: Bundler` confirmed; consumer grep exhaustive (4 sites, no external importers) |
| Skill-drift state (§ G) | **HIGH** for the facts (script run, CI log, trigger analysis); **MEDIUM** for the bash-5 mechanism (A1) | The refutation of "inert" and the red CI run are directly observed; the abort mechanism is inferred |
| Chain/collision analysis (§ H) | **HIGH** | Precedent commit and test read in full; sibling roadmap entries read |
| Verification strategy (§ I) | **HIGH** | Every "local" proof was executed; every "CI only" one is argued from measured trigger configuration |

**Research date:** 2026-08-28
**Valid until:** ~2026-09-27 for the tooling facts (Yarn/Vite/lint-staged behaviour is stable). **Much shorter for two items:** the skill-drift result (§ G) is invalidated by *any* commit under a skill target — expect it to change within days as sibling phases land; and the `lint:check` chain string (§ H.1) changes the moment Phase 152 lands. Re-measure both at planning time.
</content>
</invoke>
