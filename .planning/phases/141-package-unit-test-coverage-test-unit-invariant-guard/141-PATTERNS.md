# Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard - Pattern Map

**Mapped:** 2026-08-18
**Files analyzed:** 7 (1 new script, 6 modified `package.json`s) + 3 doc corrections
**Analogs found:** 7 / 7 (all exact or strong role-matches — no file is without an in-tree precedent)

> **Read-only note (D-15):** `tests/playwright.config.ts` is a **pattern source only** in this
> phase. Every excerpt below quoted from it is to be **copied in register**, never edited.
> Do not propose any change to that file.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/assert-unit-test-coverage.mjs` (NEW) | CI gate script (plain-ESM, no-build) | file-I/O scan + subprocess (`--dry=json`) → exit code | `apps/supabase/scripts/lint-schema.mjs` | **exact** (plain `.mjs`, `#!/usr/bin/env node`, `execSync`, `process.exit(hasErrors ? 1 : 0)`, invoked as `node scripts/*.mjs` from a `package.json` script, `&&`-chained) |
| ↳ its *guard-message register* | config/pipeline invariant guard | throw/exit naming offender + remedy + provenance | `tests/playwright.config.ts` ORPHAN-PROBE `:18-49` and TEARDOWN-PREFIX `:137-240` | **exact** (role-match; different host — process exit vs. `throw`) |
| ↳ its *workspace enumeration* | directory walk | file-I/O | `tests/playwright.config.ts:191-205` (`readdirSync(dir,{recursive:true})` + regex + completeness bucket) | **exact** |
| ↳ its *dry-run cross-check* (D-17) | subprocess capture | request-response | `apps/supabase/scripts/lint-schema.mjs:101-113` (`execSync` + parse + rows→findings) | role-match |
| `package.json` (root) — wrap `test:unit` | config | — | root `lint:check` / `apps/supabase` `lint:all` | **exact** |
| `packages/core/package.json` (ADD `test:unit`) | config | — | `apps/frontend/package.json:16` | **exact** |
| `packages/matching/package.json` (ADD) | config | — | `apps/supabase/package.json:15` | **exact** |
| `packages/llm/package.json` (RENAME `test`→`test:unit`) | config | — | same two | **exact** |
| `packages/question-info/package.json` (RENAME) | config | — | same two | **exact** |
| `packages/argument-condensation/package.json` (RENAME) | config | — | same two | **exact** |
| `.planning/ROADMAP.md:387`, `.planning/REQUIREMENTS.md:63`, `140-VERIFICATION.md` addendum (D-15b) | docs | — | n/a (prose corrections) | n/a |

---

## Pattern Assignments

### 1. `scripts/assert-unit-test-coverage.mjs` — primary artifact

**Analog: `apps/supabase/scripts/lint-schema.mjs` (185 lines).**

This is a **direct precedent for every property D-08 demands** and the planner should treat it
as the skeleton: a plain-ESM `.mjs` gate script, node-builtins only, zero workspace imports,
zero build step, invoked as `node scripts/<name>.mjs` from a `package.json` script and composed
into a longer chain with `&&`. It even sits under a workspace-local `scripts/` directory — the
new root `scripts/` directory is the same idea one level up.

**Header + usage/exit-code contract** (`apps/supabase/scripts/lint-schema.mjs:1-19`) — copy this
docblock shape verbatim in structure:

```js
#!/usr/bin/env node

/**
 * Custom schema lint script derived from Supabase Splinter advisors.
 *
 * Runs SQL queries against the local Supabase Postgres instance to check for
 * schema-level issues that `supabase db lint` (PL/pgSQL-only) does not cover.
 *
 * Checks implemented:
 *   - 0013 RLS disabled on public tables  (ERROR)
 *   - 0001 Unindexed foreign keys         (WARNING)
 *
 * Usage:
 *   node scripts/lint-schema.mjs [--strict]
 *
 * Exit codes:
 *   0 - No errors (warnings may be present)
 *   1 - At least one ERROR-level issue found (or WARNING in --strict mode)
 */

import { execSync } from 'node:child_process';
```

Note: **`node:`-prefixed builtin imports** and **`process.argv.includes('--flag')`** for options
(`:28`) — no arg-parsing library. The new guard needs no flags, but if it grows one, this is the
form.

**Imports pattern for the new guard** (composed from this analog + the codemod analog below):

```js
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
```

`execFileSync` (argv array) rather than `execSync` (shell string) for the turbo call — that is
the safer sibling and the tests tree already argues for it explicitly at
`tests/tests/support/preflight.ts:229`: *"`execFileSync` with an argv array, never its
shell-interpolating sibling."* Research's own code example (`141-RESEARCH.md:488`) also uses
`execFileSync`.

**Fail-and-exit pattern** (`lint-schema.mjs:117-133`) — the named-precondition + actionable
remedy shape. This is the analog for the guard's own preconditions (e.g. "`packages/` does not
exist"):

```js
function ensurePostgresAvailable() {
  try {
    execSync(`psql ${DB_URL} -c "SELECT 1" --tuples-only --no-align`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch {
    console.error(
      'ERROR: Cannot connect to local Supabase Postgres at ' +
        DB_URL +
        '.\n' +
        'Make sure the Supabase local dev stack is running:\n' +
        '  yarn db:start\n'
    );
    process.exit(1);
  }
}
```

**Accumulate-then-exit-once pattern** (`lint-schema.mjs:139-184`, abridged) — the guard has TWO
assertions (UNIT-04 coverage + D-17 turbo cross-check); this analog shows the house shape for
running both, reporting both, and exiting once at the end rather than bailing on the first:

```js
function main() {
  ensurePostgresAvailable();

  let errorCount = 0;
  let warningCount = 0;

  console.log('=== Schema Lint (Splinter-derived) ===\n');

  // -- Check 1: RLS disabled on public tables (ERROR) -----------------------
  const rlsRows = runQuery(SQL_RLS_DISABLED);
  if (rlsRows.length > 0) {
    errorCount += rlsRows.length;
    console.log('[ERROR] RLS disabled on public tables:');
    for (const [schema, table] of rlsRows) {
      console.log(`  - ${schema}.${table}`);
    }
    console.log();
  }

  // -- Check 2: Unindexed foreign keys (WARNING) ----------------------------
  // ... same shape ...

  console.log(`Summary: ${errorCount} error(s), ${warningCount} warning(s)`);

  const hasErrors = errorCount > 0 || (STRICT && warningCount > 0);
  process.exit(hasErrors ? 1 : 0);
}

main();
```

**Recommended mapping for the new guard:** Check 1 = "workspace has test files but no
`test:unit`" (UNIT-04, ERROR, names the workspace); Check 2 = "workspace declares `test:unit` but
turbo reports `command === '<NONEXISTENT>'`" (D-17/UNIT-02 mirror, ERROR, names the workspace).
Both ERROR-level — this phase has no WARNING tier; do not import `--strict`, which would create
an opt-in-severity escape hatch of exactly the class Phase 140 removed.

**Section-comment banner style** (`lint-schema.mjs:23-25`, `:135-137`) — the file is divided by
`// ---…---` rules with a title line (`Config`, `SQL queries`, `Main`). Reuse: `Config`,
`Enumeration`, `Check 1 — coverage`, `Check 2 — turbo cross-check`, `Main`.

**Secondary analog — `apps/frontend/scripts/flatten-current-codemod.mjs`** (a plain-ESM
`.mjs` under a workspace `scripts/` dir, run by hand). Two transferable properties:

- Repo-root resolution (`:84`): `const REPO_ROOT = resolve(process.cwd());` — the guard runs from
  the repo root via the root `package.json` script, so `process.cwd()` is correct; no
  `fileURLToPath(import.meta.url)` gymnastics needed. (Compare `tests/tests/utils/testsDir.ts`,
  which *does* need `fileURLToPath` because it is imported from arbitrary depths — the guard is
  not.)
- Long explanatory docblock carrying the *why* and the hard allowlist, with anti-pattern callouts
  ("A broad `\w+\.current` regex is FORBIDDEN (research Pitfall 1)"). The new guard's equivalent
  hard fact to state in the docblock is Pitfall 1: **`--dry=json` lists unwired workspaces too;
  the discriminator is `command !== '<NONEXISTENT>'`**.

**Properties that do NOT transfer from `lint-schema.mjs`:** it is invoked *after* a running DB and
shells out to `psql`; the new guard must run on a cold tree with no `dist/` (Pitfall 7). Its only
subprocess is `npx turbo run test:unit --dry=json`, which turbo itself resolves without any
workspace build.

**Properties that do NOT transfer from `packages/dev-tools`:** `dev-tools` entry points are `tsx
src/*.ts` (`packages/dev-tools/package.json` — `"keygen": "tsx src/keygen.ts"`, `"pem-to-jwk":
"tsx src/pem-to-jwk.ts"`) and depend on `tsx` + `@openvaa/shared-config`. That is exactly the
build/`tsx` dependency D-08 forbids. Cite `dev-tools` in the plan only as the *rejected* home.

---

### 2. The guard-message register — the single most important pattern

**Analog: `tests/playwright.config.ts`, three proven sibling guards.** The new guard must read as a
**fourth sibling** despite living in a different host and exiting rather than throwing.

The register has **four obligatory moves per guard**: (a) name what drifted, (b) cite the concrete
historical incident by phase + finding ID, (c) say why a comment would not suffice, (d) tell the
author what to do about it.

**Sibling 1 — ORPHAN-PROBE, docblock + throw (`tests/playwright.config.ts:18-49`, verbatim):**

```ts
/**
 * ORPHAN-PROBE GUARD (see phase 136 plan 03, fake-guard sweep finding F4).
 *
 * `_probes` is the one project whose `testMatch` enumerates its files by name
 * rather than globbing the directory — deliberately, because each probe must be
 * invocable one-at-a-time. The cost of enumeration is that ADDING a probe file
 * without adding it to the pattern silently produces a test that matches no
 * project and runs from no command, while still sitting in `specs/` looking like
 * coverage. That is precisely what happened to four probe files between two
 * phases (see phase 119, see phase 136): 6 tests, unreachable for ~16 phases,
 * noticed only by an audit.
 *
 * A comment asking future authors to keep the list in sync would be the same
 * kind of non-guard this phase exists to remove, so the invariant is CHECKED.
 * Throwing here fails every `playwright test` / `--list` invocation immediately
 * and by name, which is the earliest point at which the mistake is visible.
 */
const probesDir = path.join(TESTS_DIR, 'specs/_probes');
if (fs.existsSync(probesDir)) {
  const orphans = fs
    .readdirSync(probesDir)
    .filter((f) => f.endsWith('.probe.spec.ts'))
    .filter((f) => !PROBE_TEST_MATCH.test(f));
  if (orphans.length > 0) {
    throw new Error(
      `Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project and run ` +
        `from NO command: ${orphans.join(', ')}. Add each to the \`_probes\` project's testMatch ` +
        `(PROBE_TEST_MATCH in this file), or delete the file. Leaving it in place implies coverage ` +
        `that does not exist (fake-guard sweep 2026-08-11, finding F4).`
    );
  }
}
```

Anatomy of that message — **the template the new guard's Check 1 should instantiate**:
1. *What is wrong, in the invariant's own words*: "they match NO Playwright project and run from NO command"
2. *The offenders, enumerated by name*: `${orphans.join(', ')}`
3. *Two concrete remedies, both directions*: "Add each to … **or** delete the file."
4. *Why leaving it is not neutral*: "Leaving it in place implies coverage that does not exist"
5. *Provenance citation*: "(fake-guard sweep 2026-08-11, finding F4)"

**Sibling 2 — TEARDOWN-PREFIX-UNIQUENESS, the completeness-check throw
(`tests/playwright.config.ts:206-215`, verbatim):**

```ts
if (unparsedTeardownPrefixFiles.length > 0) {
  throw new Error(
    "Teardown prefix guard could not parse a `const PREFIX = '...'` declaration in " +
      `${unparsedTeardownPrefixFiles.join(', ')}, but the file calls runTeardownAsserted — so its ` +
      'prefix is NOT covered by the uniqueness/overlap check below and a collision could reappear ' +
      'silently (review WR-03; same enumeration-drift shape as fake-guard finding F4). Make ' +
      "the declaration match `const PREFIX = '...'` (a plain top-level string literal), or widen the " +
      'regex above to cover the new shape.'
  );
}
```

…and its **named precondition** (`:184-190`, verbatim, incl. the reason comment):

```ts
// see phase 140 review IN-01: named precondition, mirroring the ORPHAN-PROBE
// guard's `fs.existsSync` check above. Without it, a missing/renamed
// tests directory would die on a raw `readdirSync` ENOENT — the opposite of
// the "fails immediately and by name" property this guard claims for itself.
if (!fs.existsSync(teardownDir)) {
  throw new Error(
    `Teardown prefix guard: expected directory '${teardownDir}' does not exist. The ` +
      'teardown-prefix-uniqueness guard (review CR-01) cannot enumerate *.teardown.ts ' +
      'files without it.'
  );
}
```

**Direct instruction to the planner:** the new guard MUST carry the analogous precondition —
`if (!existsSync(root))` for each entry in the D-16 roots array — with the same "fails immediately
and by name" justification comment. A raw `readdirSync` ENOENT on a renamed `packages/` would be
the exact failure this family names as its opposite.

**The "a comment would not suffice" sentence** — every one of the three siblings carries a variant.
Verbatim from `:30-33`:

```
 * A comment asking future authors to keep the list in sync would be the same
 * kind of non-guard this phase exists to remove, so the invariant is CHECKED.
```

Research (`141-RESEARCH.md:462`) already writes the new guard's instantiation: **"a comment asking
future authors to add a `test:unit` script would be the same kind of non-guard."** Use it.

**Sibling 3 — SOFT-ASSERTION-BUDGET, the "both directions" argument (`:79-82`, verbatim):**

```
 * The comparison is EQUALITY, not a ceiling: REMOVING a soft assertion without updating
 * the budget throws too, so the declared posture stays honest in both directions and a
 * promotion to a hard `expect()` is recorded rather than absorbed.
```

Relevant because D-17 makes the new guard **bidirectional in exactly this sense**: Check 1 is "has
tests ⟹ declares script"; Check 2 is "declares script ⟹ turbo executes it". The docblock should
make that pairing explicit in this register.

**Divergence the plan must state out loud:** the Playwright siblings `throw`; the new guard is a
standalone process and must `process.exit(1)` (per `lint-schema.mjs:182`) after `console.error`.
Same register, different mechanism. Also state D-17's **knowing cost**: the guard now shells a
subprocess, forfeiting D-08's pure-no-subprocess bootstrapping purity while keeping the
no-build/no-`tsx`/no-workspace-import constraint intact.

---

### 3. Workspace / directory enumeration

**Analog: `tests/playwright.config.ts:191-205` (verbatim).** This is the exact idiom research names
in Don't Hand-Roll ("the shipped prefix guard uses exactly this idiom, so the two guards read as one
family"):

```ts
const teardownPrefixDeclarations: Array<{ file: string; prefix: string }> = [];
const unparsedTeardownPrefixFiles: Array<string> = [];
for (const rel of fs
  .readdirSync(teardownDir, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.teardown.ts'))) {
  const abs = path.join(teardownDir, rel);
  const source = fs.readFileSync(abs, 'utf8');
  // …classify into one of the two buckets above…
}
```

Transferable properties: `readdirSync(dir, { recursive: true })` (Node 22, pinned by
`main.yaml`), `.map(String)` to normalise the `Dirent|string` union, suffix `.filter(...)`, and
**two accumulator arrays — the matched set AND the anomaly set** — so the guard reports both
"violations" and "could not classify". Adopt that two-bucket shape.

**`node_modules` exclusion is NOT handled by the analog** — it scans `tests/`, which has none.
The new guard scans `packages/*` and `apps/*`, which do. This is a **gap the planner must close
explicitly**, and D-09 already requires it. Two viable shapes:
- Depth-1 `readdirSync(root, { withFileTypes: true })` for the workspace list, then a per-workspace
  recursive scan with `.filter((f) => !f.split(path.sep).includes('node_modules'))`;
- or the codemod's `globSync` (`apps/frontend/scripts/flatten-current-codemod.mjs:62,155`, imported
  from `node:fs`) with an explicit skip regex — the codemod's own precedent is
  `.filter((f) => !SKIP_PATH_RE.test(f))` at `:155`.

Prefer the first: it keeps the "one family" reading with the config-load sibling and makes the
workspace list a first-class value the error messages can name.

**Roots constant (D-16).** The scanned roots must be a single array constant. In-tree precedent for
"the enumeration lives in one hoisted named constant so there is ONE place to look" is
`SOFT_ASSERTION_BUDGETS` (`tests/playwright.config.ts:51-62`), whose docblock says so:

```
 * Hoisted so the budget guard below — and every reader — has ONE place to look for the
 * number, which is why the spec's own header names this symbol instead of restating it.
```

Mirror it: `const WORKSPACE_ROOTS = ['packages', 'apps'];` with a comment tying it to root
`package.json`'s `"workspaces": ["packages/*", "apps/*"]` (root `package.json:76-79`) — the two must
not drift.

**Do NOT shell `yarn workspaces list --json`** (research Don't Hand-Roll row 2): re-introduces the
bootstrapping coupling, and run H proves a workspace need not be installed for the scenario to be
exercised.

---

### 4. `package.json` script shapes for the five wired packages

**Bare `vitest run` form — D-12's target. Two exact analogs, both quoted verbatim:**

```jsonc
// apps/frontend/package.json:16
"test:unit": "vitest run",
```
```jsonc
// apps/supabase/package.json:15
"test:unit": "vitest run"
```

**`--passWithNoTests` form — D-13 leaves these alone. Do not copy, do not touch:**

```jsonc
// packages/app-shared/package.json:9
"test:unit": "vitest run --passWithNoTests",
// packages/data/package.json:25
"test:unit": "vitest run --passWithNoTests",
// packages/dev-seed/package.json:16
"test:unit": "vitest run --passWithNoTests",
// packages/filters/package.json:25
"test:unit": "vitest run --passWithNoTests",
// apps/docs/package.json:19
"test:unit": "vitest run --passWithNoTests",
```

**Current state of the five targets (measured, verbatim from each file):**

| File | Line | Current | Action |
|---|---:|---|---|
| `packages/core/package.json` | — | *(no test script at all)* | ADD `"test:unit": "vitest run"` (D-11) |
| `packages/matching/package.json` | — | *(no test script at all)* | ADD `"test:unit": "vitest run"` (D-11) |
| `packages/llm/package.json` | 9-10 | `"test": "vitest run",` / `"test:watch": "vitest"` | RENAME `test`→`test:unit`; keep `test:watch` (D-10) |
| `packages/question-info/package.json` | 9-10 | `"test": "vitest run",` / `"test:watch": "vitest"` | RENAME; keep `test:watch` (D-10) |
| `packages/argument-condensation/package.json` | 9-10 | `"test": "vitest run",` / `"test:watch": "vitest watch"` | RENAME; keep `test:watch` (D-10) |

All three rename targets already hold **exactly `vitest run`**, so the rename alone satisfies D-12
— no value edit.

**One trap worth flagging:** `apps/docs/package.json:20` declares `"test": "npm run test:unit --
--run && npm run test:e2e"`. That is the one place a bare `test` script is *composed from*
`test:unit`. None of the five targets has such a consumer (research verified no bare
`yarn workspace X test` in CI or root scripts), so the rename stays safe — but if the planner
adds a coverage check that reasons about `test` vs `test:unit`, `apps/docs` is the exception it
must not misread.

---

### 5. Root `package.json` — the `&&`-chained wrapper

**Current line to be modified** (root `package.json`, verbatim):

```jsonc
"test:unit": "turbo run test:unit",
```

**Target shape** (D-07), following the in-tree `&&`-composition idiom:

```jsonc
"test:unit": "node scripts/assert-unit-test-coverage.mjs && turbo run test:unit",
```

**Precedent 1 — root `lint:check`, verbatim** (the one CONTEXT.md D-07 cites; note it chains
*three* stages including a bare `node_modules/.bin` binary and a `yarn` sub-script):

```jsonc
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests",
"typecheck:tests": "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit",
```

**Precedent 2 — `apps/supabase/package.json:12-14`, the closest structural match** (a `.mjs`
gate script invoked with `node scripts/*.mjs` and `&&`-chained into an umbrella script):

```jsonc
"lint:sql": "supabase db lint --schema public --fail-on warning",
"lint:schema": "node scripts/lint-schema.mjs",
"lint:all": "yarn lint:sql && yarn lint:schema",
```

Note the factoring choice available here: `apps/supabase` gives the gate its **own named script**
and composes. The planner may mirror that (`"assert:unit-coverage": "node scripts/…mjs"`, then
`"test:unit": "yarn assert:unit-coverage && turbo run test:unit"`) — it makes the guard invocable
standalone for the negative control, which SC-4 needs. D-07 only requires that the guard sit on
the `test:unit` path; it does not forbid the extra named entry point.

**Other `&&` root precedents** (for the register of "this is normal here"): `dev`, `dev:reset`,
`db:reset`, `format`, `format:check` all chain with `&&`.

---

## Shared Patterns

### Provenance-citation convention
**Source:** `tests/playwright.config.ts` throughout — `(see phase 136 plan 03, fake-guard sweep
finding F4)`, `(see phase 140 plan 02, … finding F10)`, `(see phase 140 review, finding CR-01)`,
inline `// see phase 140 review IN-01:` / `// see phase 140 WR-04:` / `// see phase 140 WR-05:`.
Also `apps/frontend/scripts/flatten-current-codemod.mjs:2` (`see phase 113 —`).
**Apply to:** the new guard's docblock and every non-obvious line inside it. Cite **phase 141 +
the requirement ID** (UNIT-04, UNIT-02/D-17) and the incident: "five `packages/*` workspaces held
18 test files / 140 tests that no CI command executed."

### Inline `// see phase … <ID>:` reason-comments on defensive lines
**Source:** `tests/playwright.config.ts:106-110` (comment-stripping rationale), `:126-131`
(under-count hole), `:184-187` (precondition).
**Apply to:** the `command !== '<NONEXISTENT>'` filter in Check 2 — this is the phase's single
highest-value reason-comment, because the naive version is green at HEAD (Pitfall 1). Write it in
the WR-05 register: state the hole, state why the obvious implementation has it, state the fix.

### Named precondition before any `readdirSync`
**Source:** `tests/playwright.config.ts:35` and `:184-190` (both siblings).
**Apply to:** each entry of `WORKSPACE_ROOTS`, and to the parse of turbo's JSON output (a
`--dry=json` that fails to parse must exit 1 with a named message, not throw a raw `SyntaxError`).

### Enumerate-then-report-all, never bail on first
**Source:** `lint-schema.mjs:139-184` (counts accumulate across both checks, one exit at the end);
`playwright.config.ts:191-205` (two accumulator arrays).
**Apply to:** both checks — a developer who has three unwired packages should learn all three from
one run.

---

## Hygiene Notes for the Planner (analog-derived, not new findings)

- **The new `.mjs` will be linted by nothing** (research Pitfall 4: no root `lint` script;
  `.lintstagedrc.json`'s glob contains the `mjssvelte` typo so `.mjs` matches no lint-staged
  pattern). Confirmed by analog: `apps/supabase/scripts/lint-schema.mjs` lives with exactly this
  property today — so accepting it is **precedented**, not novel. `.prettierignore` does not
  exclude `scripts/`, so `yarn format` (`prettier --write .`) does cover it.
- **`.prettierignore` DOES list `package.json`** — the six `package.json` edits are not
  prettier-formatted; match the surrounding file's existing indentation by hand.
- **`.husky/pre-commit` is `yarn lint-staged`**; `.husky/post-commit` is
  `yarn turbo run build --filter=@openvaa/app-shared...`. Neither runs the new guard — correct, and
  worth stating in the plan so nobody assumes commit-time coverage.

---

## No Analog Found

None. Every file in this phase has a strong in-tree precedent.

The one *capability* without a direct precedent is **capturing and parsing `turbo … --dry=json`**
— nothing in-tree does it. Nearest structural analogs are `lint-schema.mjs:101-113`
(`execSync` → parse stdout → rows) and `tests/tests/support/preflight.ts:238` (`execFileSync` with
an argv array). Use `141-RESEARCH.md`'s measured code example (`:486-494`) as the reference
implementation for the field contract; it is a measured contract of turbo 2.8.17, not a guess.

---

## Metadata

**Analog search scope:** repo root (`package.json`, `.husky/`, `.lintstagedrc.json`,
`.prettierignore`), `apps/supabase/scripts/`, `apps/frontend/scripts/`, `apps/docs/scripts/`,
`packages/dev-tools/src/`, `packages/dev-seed/src/cli/`, `tests/playwright.config.ts`,
`tests/tests/utils/`, `tests/tests/support/`, all 12 `packages/*/package.json` + 3
`apps/*/package.json`.
**Files scanned:** ~30 (targeted reads; `tests/playwright.config.ts` read only over `:1-245`, its
three guard blocks, per the large-file rule — the file is 1584 lines).
**Pattern extraction date:** 2026-08-18
