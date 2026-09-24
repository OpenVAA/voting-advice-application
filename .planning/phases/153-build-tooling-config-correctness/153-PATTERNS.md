# Phase 153: Build & Tooling Config Correctness - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 20 (1 new script, 1 new test, 1 new evidence doc, 17 modified configs/manifests/docs)
**Analogs found:** 19 / 20

This is a build/tooling phase: the analogs are **repo-script and config** analogs. RESEARCH.md
already settles *what to do*; this document settles *what the existing code looks like*.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/assert-declared-binaries.mjs` (NEW) | repo guard script | file-I/O → stderr + exit code | `scripts/assert-i18n-catalog-namespaces.mjs` (structure) + `scripts/assert-a11y-scan-wiring.mjs` (multi-check/violate helper) | exact |
| `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` (NEW) | unit test (repo-meta) | file-I/O → assertion | `packages/dev-seed/tests/ciTypecheckGate.test.ts` | exact |
| `.planning/phases/153-*/153-NEGATIVE-CONTROL.md` (NEW) | evidence doc | batch/observational | `141-NEGATIVE-CONTROL.md` (best-formed) | exact |
| root `package.json` (`assert:*` script + `lint:check` chain + `engine`→`engines`) | manifest | config | its own `:25-27,:35` neighbours | exact |
| `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/package.json` ×8 | manifest | config | `packages/core/package.json` `devDependencies` | exact |
| `apps/frontend/package.json` (`engine`→`engines`) | manifest | config | root `package.json` | exact |
| `apps/frontend/vitest.config.ts` (11 `__dirname` sites) | workspace config | config | `apps/frontend/vite.config.ts:1,8-10` | exact (sibling file, same dir) |
| `.gitignore` (`*.tsbuildinfo`) | config | config | its own section-header convention (see below) | exact |
| `.lintstagedrc.json` | config | config | `.husky/pre-commit` (the duplicate-build discovery) | partial |
| `.github/workflows/main.yaml` (new job) | CI config | config | `skill-drift-check` job (`:25-34`, minimal) / `frontend-and-shared-module-validation` (`:36-`, node-setup) | exact |
| `packages/shared-config/README.md` | docs | — | — | n/a (text edit) |
| `packages/supabase-types/src/index.ts` | barrel | — | `packages/README.md:18` import-path policy | exact |
| `packages/core/src/controller/controller.ts:73` | source | — | shared-config `argsIgnorePattern: '^_'` | exact |
| `.planning/todos/pending/YYYY-MM-DD-*.md` (NEW, D-N2) | planning doc | — | `.planning/todos/pending/2026-05-11-e2e-01-single-locale-runtime-override.md` | exact |

---

## Pattern Assignments

### `scripts/assert-declared-binaries.mjs` (NEW — repo guard script)

**Analogs:** `scripts/assert-i18n-catalog-namespaces.mjs` (canonical skeleton),
`scripts/assert-a11y-scan-wiring.mjs` (canonical multi-violation body).
The new guard must be a stylistic sibling of BOTH. Neither is executable (`-rw-r--r--`);
the shebang is present but decorative — the script entry is `node <path>`.

**1. Header + docblock + imports + constants** (`assert-i18n-catalog-namespaces.mjs:1-57`,
condensed; `assert-a11y-scan-wiring.mjs:1-71` is the same shape):

```js
#!/usr/bin/env node

/**
 * A11Y-SCAN WIRING GUARD (phase 147, requirements CSCAN-02 / CSCAN-03).
 *
 * The incident this file exists for: <long prose naming the concrete defect,
 * the "green that means nothing" it produced, and why a comment was not enough>
 *
 * FOUR checks, each a distinct way that green-but-blind could reoccur:
 *   Check 1 (CSCAN-02a) — ...
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
```

Note the four mandatory docblock sections in order: **incident narrative → the invariant /
enumerated checks → `Usage:` → `Exit codes:`**. `SELF` is the script's own repo-relative path
and is prefixed into every message. Repo root is derived with `fileURLToPath(import.meta.url)`
— no `__dirname` (same idiom the phase is removing from `vitest.config.ts`).

> **Comment-convention carve-out (D-N1):** the existing docblocks are full of phase numbers,
> requirement ids and `.planning/` paths. `scripts/` is **outside** Phase 152's sweep scope
> (`packages/**`, `apps/**`, `tests/**`), so the new guard's docblock may follow this style
> verbatim. Its dev-seed unit test **is** in 152's scope and must carry none of it.

**2. Fail-closed read helper** (`assert-a11y-scan-wiring.mjs:74-86`):

```js
function readSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${path.relative(REPO_ROOT, filePath)}' (${error.message}). ` +
        'A file this guard cannot read is wiring it cannot verify — this fails closed.'
    );
    return null;
  }
}
```

Copy this shape for reading each workspace `package.json` and each dependency's `package.json`
`bin` field.

**3. The `violate` accumulator** (`assert-a11y-scan-wiring.mjs:89-103`):

```js
function main() {
  const configSrc = readSource(PLAYWRIGHT_CONFIG);
  ...
  if (configSrc === null || axeScanSrc === null || ...) {
    process.exitCode = 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };
```

Every violation message is a **full sentence naming the specific problem and its consequence**,
not a bare label. Copy that register, e.g.
`` violate(`${location}'s \`build\` script invokes \`${bin}\`, which no dependency of that workspace provides. It resolves today only because the root hoists it under nodeLinker: node-modules; a workspace that does not declare what it runs is one install-topology change from a broken build.`) ``

**4. Summary line + exit convention** (tail of both files, verbatim):

```js
  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
```

The i18n guard's richer variant interpolates a census into the same trailing
`` `… ${violations} violation(s).` `` form:

```js
  console.log(
    `I18n catalog namespace guard (phase 147: CSCAN-04) — total keys: ${keys.size}; ` +
      NAMESPACE_FLOORS.map(({ label, prefix }) => `${label}: ${[...keys].filter((k) => k.startsWith(prefix)).length}`).join(', ') +
      `, other: ${otherCount}. ${violations} violation(s).`
  );
```

**Recommended summary line for the new guard** (census + verdict, matching the i18n form):
`Declared-binaries guard (REVIEW-CFG-01) — N workspace(s) scanned, M build-script binary invocation(s). ${violations} violation(s).`

Note `process.exitCode = …` (assignment), never `process.exit()`; then a bare `main();` at
module top level. No `if (import.meta.url === …)` entry guard in either analog.

**5. Registration in root `package.json`** (`package.json:25-27`, verbatim):

```json
    "assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs",
    "assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
    "assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
```

Add `"assert:declared-binaries": "node scripts/assert-declared-binaries.mjs",` to this
contiguous `assert:*` block. Ordering within the block is chronological, not alphabetical —
**append**.

**6. Chain wiring** (`package.json:35`, verbatim):

```json
    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
```

**Append** ` && yarn assert:declared-binaries` at the end. Phase 152 appends its own link to the
same string — appending at the tail is the minimum-collision edit, and no test may assert on
position (see next section).

---

### `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` (NEW — membership test)

**Analog:** `packages/dev-seed/tests/ciTypecheckGate.test.ts` (Phase 144 precedent, commit
`b410d3a90`). Lives in `dev-seed` because `yarn test:unit` is `turbo run test:unit` and a
repo-meta spec needs a workspace to run in (that file's own docblock `:19-26` explains it).

**Repo-root derivation + file loads** (`ciTypecheckGate.test.ts:33-48`):

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

**THE membership assertion to copy exactly** (`ciTypecheckGate.test.ts:72-87`, verbatim —
this is the shape D-B4 names):

```ts
  it('keeps `yarn typecheck` a blocking link of lint:check — the local-DX half', () => {
    // Deliberately redundant with the CI step above and load-bearing locally:
    // it is what makes `turbo run typecheck` blocking for a developer running
    // `yarn lint:check`. Asserted so a future reader deleting the "redundant"
    // link has to come here and read why it is not.
    //
    // The invariant is MEMBERSHIP of the `&&` chain, not terminal position:
    // every link after it is equally aborted by a type failure, so guards may
    // be appended freely. Asserting `endsWith` instead made this test fail the
    // moment Phase 147 appended its two scan guards — a correct change the
    // over-specified assertion had no business rejecting.
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn typecheck');
    expect(ROOT_PACKAGE_JSON.scripts['lint:check']).toContain('yarn typecheck:tests');
    expect(ROOT_PACKAGE_JSON.scripts.typecheck).toBe('turbo run typecheck');
  });
```

**The new test's core assertion, by direct analogy:**

```ts
const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
expect(links).toContain('yarn assert:declared-binaries');
expect(ROOT_PACKAGE_JSON.scripts['assert:declared-binaries']).toBe('node scripts/assert-declared-binaries.mjs');
```

**Hard constraints inherited from the analog's own lesson:**
- **Never** `toEndWith` / `endsWith` / index-comparison on the `lint:check` string. Phase 152
  is concurrently appending its own link; an ordering assertion would redden a correct change.
- **Never** assert the full `lint:check` string equals a literal, for the same reason.
- Do **not** duplicate or rename `- name: "Type-check all packages (turbo run typecheck)"` or
  `- name: "Run ESlint check on frontend"` in `main.yaml` — `ciTypecheckGate.test.ts:51-56`
  asserts each appears **exactly once** (`expect(WORKFLOW.split(STEP)).toHaveLength(2)`) and
  `:62` asserts their order. A new CI job must not reuse those names.

**Docblock convention** (`ciTypecheckGate.test.ts:1-31`): `## What went wrong, and why a comment
was not enough` → `## Why it lives in packages/dev-seed` → a `⚠` note on the text-level-spec
tradeoff. Reproduce the shape but, per D-N1/152, **without** phase numbers or `.planning/`
paths in this file.

---

### `.planning/phases/153-.../153-NEGATIVE-CONTROL.md` (NEW — evidence artefact)

**Analog:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`
(1059 lines — the best-formed of the six; siblings: 137, 138, 140, 146, 147).

**Front matter + framing** (`141-NEGATIVE-CONTROL.md:1-20`):

```markdown
# Phase 141 — Negative Control Ledger

**Two runs per requirement.** Every requirement this phase touches gets a **BLINDNESS**
row — the guard, as it stands, failing to notice a live defect — and a **CATCH** row —
the same defect, same shape, caught by name once the work lands. A row with only one
half is not evidence: a green guard and a blind guard are indistinguishable from a
single observation...

- **Date:** 2026-08-18
- **Plan:** `141-01-PLAN.md` (wave 1) — CATCH halves appended by `141-02` and `141-03`
- **Requirements:** UNIT-01 (blindness half), UNIT-04 (blindness half), UNIT-02 (discrimination proof)
- **Decisions discharged:** D-17 / research Pitfall 1
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/140-.../140-NEGATIVE-CONTROL.md`
```

**Fenced environment block** (`:22-40`) — copy the label-aligned form verbatim in structure:

```
## Environment

```
date (UTC):        2026-08-18T15:49:50Z
repo root:         /Users/.../voting-advice-application-gsd
git HEAD:          6c10d63d…  (the 141-MEASUREMENT.md commit)
git branch:        feat-gsd-roadmap
git status:        scoped `-- packages` → empty before and after every row below
OS:                macOS / Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
```
```

…followed by a `>` block-quote explaining **why the bare `git status` is not the gate** (the
GSD orchestrator dirties `.planning/STATE.md`; the scoped form carries the claim). Reproduce
that caveat — twelve concurrent planning runs make it more true here, not less.

**Row structure** — the repeating unit, and the before/after pair the focus asks for
(`## Row 1`, `## Row 4`; headings verbatim from the file's outline):

```markdown
## Row N — <REQ-ID> / **BLINDNESS**        ← and later: / **CATCH**

**Claim under test:** <one sentence, falsifiable>

**Injection.** <what was changed, with the exact file paths and a fenced excerpt>

**Command:**

```sh
yarn test:unit
```

**Exit code: `0`.**

**Decisive output.** <fenced verbatim tail of the run — never paraphrased>

**Verdict: BLIND.** <one paragraph: the defect was live and the gate said nothing>
```

The CATCH half repeats the *identical* injection against the shipped work, records
**Exit code: `1`**, quotes the naming output, and closes `**Verdict: CAUGHT.**` with an
explicit back-reference to the BLINDNESS row's numbers. The file ends with a
`## Ledger status` section (`:1049`).

**153's rows, by direct mapping:**
| Row | Requirement | BLINDNESS | CATCH |
|---|---|---|---|
| 1 | REVIEW-CFG-01 | `yarn lint:check` green while 8 workspaces run undeclared `tsup` | guard names all 8, exit 1; then green after declarations |
| 2 | REVIEW-CFG-08 | mis-formatted `.svelte` staged → hook **passes** (D-B3 proof obligation) | same file → hook **rejects** after the glob fix |
| 3 | REVIEW-CFG-03 | (no BLINDNESS available — § C.2: the config does not fail today) — record the `here`-set-wrong negative control instead: `vitest list` fails to resolve `$lib` | `vitest list --run` collects all specs |
| 4 | REVIEW-CFG-06 | `git ls-files` shows 3 tracked `tsbuildinfo` | rebuild → `git status` clean |
| 5 | REVIEW-CFG-05 | the workflow step observed (run URL + pasted job log) | — |

---

### `apps/frontend/vitest.config.ts` (ESM `__dirname` replacement, 11 sites)

**Analog:** `apps/frontend/vite.config.ts:1,8-10` — same directory, same workspace, same
`"type": "module"`. Verbatim:

```ts
import { fileURLToPath } from 'node:url';
...
// The root `.env` lives two levels above `apps/frontend`. `apps/frontend/package.json` declares
// `type: module`, so `__dirname` is unavailable here — derive the repo root from `import.meta.url`.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
```

Copy three things: `import { fileURLToPath } from 'node:url';` as the **first** import; a
two-line `//` comment stating *why* (`type: module` ⇒ no `__dirname`) immediately above; the
`fileURLToPath(new URL(<relative>, import.meta.url))` form. For the current directory the
relative segment is `'.'`:

```ts
const here = fileURLToPath(new URL('.', import.meta.url));
```

**Second in-repo instances** (surveyed; these are the only ones):
- `scripts/assert-i18n-catalog-namespaces.mjs:57` / `assert-a11y-scan-wiring.mjs:70` —
  `path.resolve(fileURLToPath(import.meta.url), '..', '..')`
- `packages/dev-seed/tests/ciTypecheckGate.test.ts:38` —
  `dirname(fileURLToPath(import.meta.url))`

No `packages/*/vitest.config.ts` and no `apps/docs/` config uses `__dirname` or
`import.meta.url` at all — there is nothing to match there. The `vite.config.ts` sibling is
the right analog; `ciTypecheckGate.test.ts:38`'s `dirname(fileURLToPath(...))` is the
acceptable alternative if byte-identity with the test file is preferred.

Also: `vitest.config.ts:1` is `import path from 'path';` while every `node:url` user in the
repo prefixes `node:`. Normalising to `'node:path'` while touching line 1 matches the analogs.

---

### The 8 workspace `package.json` files (`tsup` declaration)

**Analog:** `packages/core/package.json:37-41`, verbatim:

```json
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
```

**Conventions measured across all 8** (`app-shared`, `argument-condensation`, `core`, `data`,
`filters`, `llm`, `matching`, `question-info`):

| Property | Observed |
|---|---|
| Ordering | **Strictly alphabetical**, scoped `@…` names first (JSON-lexicographic: `@openvaa/…`, `@types/…`, then bare names) |
| Version specifier | `catalog:` for anything shared across workspaces (`typescript`, `vitest`, `dotenv`, `@types/js-yaml`, `zod`); `workspace:^` for in-repo; a literal range **only** for the single-workspace case (`"serve": "^14.2.3"` in `argument-condensation`) |
| Current contents | 5 of 8 are the exact 3-line block above; `argument-condensation` adds `@types/js-yaml`, `dotenv`, `serve`; `data` adds `tsx`; `question-info` adds `@types/js-yaml` |

**Insertion point is identical in all 8:** `tsup` sorts **after** `serve`/`dotenv` and
**before** `tsx`/`typescript`. So in `data` it goes between `@openvaa/shared-config` and `tsx`;
everywhere else between the last `@…`/lowercase-earlier entry and `typescript`.

Per RESEARCH § A.4 option (a), the string is `"tsup": "catalog:"`, which also requires a
`tsup: ^8.5.1` entry in `.yarnrc.yml`'s catalog block. That block is explicitly sectioned —
`.yarnrc.yml:19` reads `# New entries (deps shared across 2+ workspaces)` — so the addition
belongs under that header, and root `package.json:69` flips to `"tsup": "catalog:"` too
(9 workspaces total, which is exactly the repo's stated catalog criterion).

---

### `.gitignore` (`*.tsbuildinfo`)

**Convention, from the file itself:** the first 54 lines are the hand-maintained region;
`:55` begins `# ── GSD baseline (auto-generated) ──` and everything below it is generated —
**do not edit below line 55.** Within the hand-maintained region each rule group carries a
`#` section header, sometimes a multi-line rationale comment, and groups are separated by a
blank line. Representative excerpts:

```gitignore
# Turborepo
.turbo

# Playwright test artifacts (HTML report + outputDir + ad-hoc config dumps)
playwright-report/
playwright-results/
raw.json
tests/.planning/

# Phase 138 per-run E2E evidence dirs (tests/scripts/e2e-run.sh). Raw dev-server logs,
# per-run HTML reports and traces live here and are NEVER committed; only the derived,
# reviewed per-run table under .planning/ is.
tests/e2e-runs/

# Supabase CLI local state (rewritten on every CLI run — machine-local, never shared)
supabase/.temp/
```

**Where `*.tsbuildinfo` lands:** a new group in the hand-maintained region, adjacent to the
`# Turborepo` block (both are build-tool artefacts), with a one-line rationale in the same
register, e.g.:

```gitignore
# TypeScript incremental build state — regenerated by every `tsc`, machine-local, never shared
*.tsbuildinfo
```

Note the existing `supabase/.temp/` entry at `:49-50` is the direct neighbour for the
`supabase/.branches/` rule if one is added — same top-level stray directory, same rationale
shape. Also note `.gitignore:29` is `!.yarn/plugins`, which matters to RESEARCH § B.3 option 4.

**Nested-gitignore precedent:** `apps/supabase/supabase/.gitignore` already ignores `.branches`
locally:

```gitignore
# Supabase
.branches
.temp
```

The stray top-level `supabase/` directory has **no** `.gitignore`, which is why
`supabase/.branches/_current_branch` is tracked. Either a root rule or a nested
`supabase/.gitignore` mirroring the above is in-repo precedent; the nested form is the closer
analog.

---

### `.github/workflows/main.yaml` (new job)

**Two analogs, pick by whether the new job needs Node.**

**(a) Minimal job — `skill-drift-check`, `:25-34`, verbatim and complete:**

```yaml
jobs:
  skill-drift-check:
    runs-on: ubuntu-latest
    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: "Check skill drift"
        run: .claude/scripts/audit-skill-drift.sh
```

**(b) Node-bearing job — `frontend-and-shared-module-validation`, `:36-62`, verbatim head:**

```yaml
  frontend-and-shared-module-validation:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ vars.TURBO_TEAM }}

    steps:
      - name: "Checkout Frontend source code"
        uses: actions/checkout@v4

      - name: Setup Yarn 4.13
        uses: threeal/setup-yarn-action@v2
        with:
          version: 4.13

      - name: Setup Node.js 22.22.1
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.1
          cache: "yarn"

      - name: "Install all dependencies"
        run: yarn install --frozen-lockfile

      - name: "Build all shared modules"
        run: yarn build
```

**Conventions to match:**
- Job keys are kebab-case; every job is top-level parallel — there are **no** `needs:` edges.
- Step names are **double-quoted strings** in most steps, but the two `Setup …` steps are
  unquoted (`- name: Setup Yarn 4.13`). Quoted is the majority form; use it.
- Yarn is installed via `threeal/setup-yarn-action@v2` with `version: 4.13`, **before**
  `actions/setup-node@v4` (which carries `cache: "yarn"`).
- Install is `yarn install --frozen-lockfile`.
- No `working-directory:` appears in the two representative jobs; `apps/supabase`-scoped jobs
  use `dorny/paths-filter@v3` gating instead.
- Expected-failure assertions use an explicit `if`/`::error::` negation inside `run:`, never
  `continue-on-error`. In-repo precedent at `:228-230`:
  ```yaml
            test -n "$API_URL" || { echo "::error::API_URL missing from supabase status"; exit 1; }
  ```

**⚠ Collision surface with Phase 163.** Phase 163 adds three jobs to this same file
(`db:lint:sql`, secret scanning, dependency-vulnerability) and edits the `format:check` step at
`:64`. **Insertion point that minimises collision: append the new job as the LAST top-level key
under `jobs:`, after `e2e-visual` (which ends at `:383` / EOF).** Two appends at the end of a
jobs map are the most merge-tolerant edit available; do **not** insert between existing jobs and
do **not** touch `frontend-and-shared-module-validation`'s step list (163 edits `:64` there, and
`ciTypecheckGate.test.ts` asserts on two of its step names).

---

### `.lintstagedrc.json`

No config analog exists — it is a singleton. Its **behavioural** analog is `.husky/pre-commit`
(RESEARCH § D.3), which already runs the same turbo build on line 1, making both `bash -c`
entries redundant re-invocations. The pattern to preserve is therefore the *file's own* shape:
flat JSON, one glob key → array of string commands, no format change.

### `packages/supabase-types/src/index.ts`

**Analog:** the policy statement at `packages/README.md:18`, quoted verbatim in RESEARCH:
> TS-internal relative imports do **not** carry `.js` extensions — `import { X } from './foo'`,
> never `import { X } from './foo.js'`.

Every other `packages/*/src/index.ts` barrel already conforms; `supabase-types` is the lone
deviation (4 export lines).

### `.planning/todos/pending/` (D-N2 filings)

Naming convention, measured: `YYYY-MM-DD-kebab-slug.md`
(e.g. `2026-05-11-e2e-01-single-locale-runtime-override.md`). Two filings are implied by
RESEARCH: the 8 undeclared `eslint` invocations (wider CFG-01 class, deliberately out of scope)
and the unexamined stray top-level `supabase/` directory (CONTEXT `<open>` 7).

---

## Shared Patterns

### Guard-script house style
**Source:** `scripts/assert-i18n-catalog-namespaces.mjs`, `scripts/assert-a11y-scan-wiring.mjs`
**Apply to:** the new guard.
Node built-ins only, no build step, `.mjs` ESM, non-executable, `SELF` + `REPO_ROOT` consts,
`[ERROR] ${SELF}: <sentence>` on stderr, one `console.log` summary ending
`… ${violations} violation(s).`, `process.exitCode = violations > 0 ? 1 : 0;`, bare `main();`.

### Chain-membership, never chain-position
**Source:** `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-84`
**Apply to:** every assertion this phase writes about `lint:check`.
```ts
const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
expect(links).toContain('yarn <script>');
```
Phase 152 appends to the same chain concurrently; position assertions are a self-inflicted
merge failure.

### Repo-root derivation without `__dirname`
**Source:** `scripts/assert-i18n-catalog-namespaces.mjs:57`, `ciTypecheckGate.test.ts:38-40`,
`apps/frontend/vite.config.ts:10`
**Apply to:** the new guard, the new test, and `apps/frontend/vitest.config.ts`.
All three use `fileURLToPath(import.meta.url)` / `fileURLToPath(new URL(…, import.meta.url))`.
The phase both *consumes* and *extends* this pattern — CFG-03 is the last non-conforming site.

### Evidence-ledger format
**Source:** `141-NEGATIVE-CONTROL.md` (see full breakdown above)
**Apply to:** `153-NEGATIVE-CONTROL.md`.
Front-matter bullet list → fenced `## Environment` block → scoped-`git status` caveat →
`## Row N — REQ / **BLINDNESS**` + `**CATCH**` pairs, each with Claim / Injection / Command /
Exit code / Decisive output (verbatim, never paraphrased) / **Verdict** → `## Ledger status`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `.yarnrc.yml` engine key (D-B5 artefact ii) | config | config | RESEARCH § B.2 measured that **no such Yarn 4.13.0 setting exists**. There is nothing to pattern-match because there is nothing to write. Escalated as an open question; the planner must not invent a key. |

Partial-only: `.lintstagedrc.json` (singleton config, no sibling), `packages/shared-config/README.md`
(prose edit).

---

## Metadata

**Analog search scope:** `scripts/`, root + all 16 workspace `package.json`, `.github/workflows/`,
`.gitignore` (+ nested), `.husky/`, `packages/dev-seed/tests/`, every `vite.config.ts` /
`vitest.config.ts` / `svelte.config.js` in the repo, `.planning/phases/*/*NEGATIVE-CONTROL.md`,
`.planning/todos/pending/`
**Files scanned:** ~45
**Pattern extraction date:** 2026-08-28
