# Phase 164: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism — Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 11 (5 new, 6 modified)
**Analogs found:** 9 exact/role-match / 11 (2 = NO ANALOG)
**Read-only pass.** No source file was modified; no build, `yarn db:types`, or `supabase start` was run.

---

## File Classification

| New/Modified File | New/Mod | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `scripts/assert-rpc-return-nullability.mjs` | NEW | static-assert script (repo-root gate) | file-I/O + transform (read SQL → derive → assert) | `scripts/assert-a11y-scan-wiring.mjs` (primary) + `scripts/assert-i18n-catalog-namespaces.mjs` (directory-walk half) | **exact** (role + flow) |
| `packages/supabase-types/RPC-NULLABILITY.md` | NEW | committed generated artifact | batch (regenerate + diff) | **NO ANALOG** — nearest neighbour `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md` | partial |
| `packages/supabase-types/src/database.overrides.ts` | NEW | type module (hand-maintained sibling of a generated file) | n/a (pure types) | `packages/supabase-types/src/column-map.ts` | **role-match, same package** |
| `packages/supabase-types/src/database.merged.ts` | NEW | type module (mechanical merge) | n/a | `packages/supabase-types/src/column-map.ts` (export/doc style) | role-match |
| `packages/supabase-types/package.json` | MOD | package manifest (`typecheck` script) | n/a | `packages/core/package.json:25`, `packages/data/package.json:26`, `packages/app-shared/package.json:10` | **exact** |
| `packages/supabase-types/src/index.ts` | MOD (`:1`) | barrel | n/a | itself (`:1-4`, house `.js`-extension style) | **exact** |
| root `package.json` | MOD (`assert:*` + `lint:check`) | config | n/a | `:25-27`, `:35` (the three existing `assert:*` entries) | **exact** |
| `apps/frontend/.../supabaseDataProvider.test.ts` | MOD (new `it`) | unit test | request-response (mocked RPC) | `:1630-1645` `it('clears parentNominationId when the parent nomination is not in the result set (P01)')` | **exact** |
| `apps/frontend/.../supabaseDataProvider.ts` | MOD (`:300` cast removal) | API adapter | request-response (RPC read → domain map) | itself `:282-320` | n/a (in-place edit) |
| repo-meta vitest over `main.yaml` (new spec in `packages/dev-seed/tests/`) | NEW | test (repo-meta) | file-I/O | `packages/dev-seed/tests/ciTypecheckGate.test.ts` (88 lines, whole shape) | **exact** |
| `.github/workflows/main.yaml` (`supabase-types-drift` job) | MOD | CI config | batch | `dev-seed-integration` job (`:163-246`) | **exact** |
| `.planning/phases/164-*/164-NEGATIVE-CONTROL.md` | NEW | evidence document | n/a | `.planning/phases/137-.../137-NEGATIVE-CONTROL.md` (673 lines) | **exact** |

⚠ **Path correction carried into this map:** the prompt cites the repo-meta precedent at
`apps/frontend/src/lib/utils/ciTypecheckGate.test.ts`. Measured, the file's only location is
**`packages/dev-seed/tests/ciTypecheckGate.test.ts`** (`find . -name ciTypecheckGate.test.ts` → one
hit). RESEARCH § R1 has the correct path; the prompt does not. The new sibling spec belongs in
`packages/dev-seed/tests/`, and that file's own docblock (`:19-26`) states why.

---

## Pattern Assignments

### 1. `scripts/assert-rpc-return-nullability.mjs` (static-assert script, file-I/O + transform)

**Analog:** `scripts/assert-a11y-scan-wiring.mjs` (11,514 B) — the closest by role *and* flow
(reads named source files, regex-matches, counts violations, exits 1). Second analog for the
**directory walk** (this phase must walk `schema/**/*.sql`, not a fixed file list):
`scripts/assert-i18n-catalog-namespaces.mjs` (7,045 B), which walks `apps/frontend/messages/en/`.
Third sibling (largest, 44,731 B) `scripts/assert-unit-test-coverage.mjs` is the house-style source
both others cite.

**Shebang + docblock shape** (`scripts/assert-a11y-scan-wiring.mjs:1-59`) — the house docblock is
long and incident-driven, not descriptive. It has four fixed parts, in this order:

```js
#!/usr/bin/env node

/**
 * A11Y-SCAN WIRING GUARD (phase 147, requirements CSCAN-02 / CSCAN-03).
 *
 * The incident this file exists for: ...            // 1. WHY, naming the defect
 *
 * FOUR checks, each a distinct way that green-but-blind could reoccur:
 *
 *   Check 1 (CSCAN-02a) — ...                        // 2. enumerated checks, each req-tagged
 *   ...
 *
 * This is a plain text/regex read of the three source files, matching the
 * house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins
 * only, no build step, exit 1 naming the specific problem). It is
 * deliberately NOT an AST parse: ...                 // 3. why regex, not a parser
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:                                        // 4. usage + exit codes
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */
```

**⚠ Comment-hygiene constraint (D-N1):** the analog's docblock cites `147-ORDERING.md` and
`147-NEGATIVE-CONTROL.md` (`assert-a11y-scan-wiring.mjs:41`; `assert-i18n-catalog-namespaces.mjs`
tail). Phase 152 lands the comment-hygiene scan **before** this phase, and D-N1 forbids
`.planning/**` references in source comments. **Copy the docblock's structure, not its
`.planning` citations** — point at `packages/supabase-types/RPC-NULLABILITY.md` instead.

**Imports + REPO_ROOT resolution** (`assert-a11y-scan-wiring.mjs:61-72`; identical idiom at
`assert-i18n-catalog-namespaces.mjs:48-56`):

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const PLAYWRIGHT_CONFIG = path.resolve(REPO_ROOT, 'tests', 'playwright.config.ts');
```

Node built-ins only. `SELF` is a literal string reused in every error message. Directory-walk
variant adds `readdirSync` (`assert-i18n-catalog-namespaces.mjs:48`).

For this phase: `const SCHEMA_DIR = path.resolve(REPO_ROOT, 'apps', 'supabase', 'supabase', 'schema');`
— and **assert the scanned root in the script** (RESEARCH Pitfall 6), so widening to `migrations/**`
is a deliberate edit.

**Fail-closed read helper** (`assert-a11y-scan-wiring.mjs:74-82`) — an unreadable file is a
violation, not a skip:

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

**Violation-counter + error-message pattern** (`assert-a11y-scan-wiring.mjs:84-98`):

```js
function main() {
  const configSrc = readSource(PLAYWRIGHT_CONFIG);
  // ... other reads
  if (configSrc === null /* || ... */) {
    process.exitCode = 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };
```

Every message is `[ERROR] <self>: <what changed> (<REQ-ID>).` and states the *consequence*, e.g.
(`:105-109`):

```js
    violate(
      "tests/playwright.config.ts no longer declares a 'candidate-a11y-scan' project (or its shape " +
        'changed enough that this guard cannot find it). Losing this project drops 14 candidate a11y ' +
        'scans from the suite silently (CSCAN-02).'
    );
```

**Summary line + exit-code tail** — identical in both siblings
(`assert-a11y-scan-wiring.mjs`, last 4 lines; `assert-i18n-catalog-namespaces.mjs`, last 12 lines):

```js
  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
```

The i18n sibling's summary also prints the **measured counts** it gated on:

```js
  console.log(
    `I18n catalog namespace guard (phase 147: CSCAN-04) — total keys: ${keys.size}; ` +
      NAMESPACE_FLOORS.map(
        ({ label, prefix }) => `${label}: ${[...keys].filter((k) => k.startsWith(prefix)).length}`
      ).join(', ') +
      `, other: ${otherCount}. ${violations} violation(s).`
  );
```

**Copy this** — RESEARCH § R8 expects the 164 script to print `3 RPCs and their column counts
(32 / 15 / 4)`; that is exactly this line's shape.

**`--write` flag: NO ANALOG.** `grep -rn "argv\|--write" scripts/*.mjs` returns **one** hit and it is
prose inside a comment (`assert-unit-test-coverage.mjs:43`). **No existing `scripts/assert-*.mjs`
parses `process.argv` or has a `--write` mode.** The `--write` regeneration mode RESEARCH § R1 calls
for is a **new capability with no in-repo precedent in this family** — the planner must design it
(recommend: `const WRITE = process.argv.includes('--write');` immediately after the `SELF`/`REPO_ROOT`
consts, default mode = compare-and-violate).

**Root `package.json` wiring — verbatim, with line numbers:**

```
23:    "db:types": "yarn workspace @openvaa/supabase-types generate",
25:    "assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs",
26:    "assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
27:    "assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
28:    "test:unit": "yarn assert:unit-coverage && turbo run test:unit",
30:    "test:e2e": "yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe",
33:    "format:check": "turbo run build --filter=@openvaa/app-shared... && prettier --check . && yarn workspace @openvaa/docs format:check",
35:    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
36:    "typecheck": "turbo run typecheck",
```

Composition map, measured:

| Script | Composed into |
|---|---|
| `assert:unit-coverage` | `test:unit` (`:28`) only |
| `assert:i18n-catalog-namespaces` | `test:e2e` (`:30`) **and** `lint:check` (`:35`) |
| `assert:a11y-scan-wiring` | `test:e2e` (`:30`) **and** `lint:check` (`:35`) |

New entry follows `:27`'s form exactly:
`"assert:rpc-nullability": "node scripts/assert-rpc-return-nullability.mjs",`
appended to `lint:check` (`:35`) as a further `&&` link. Safe per
`ciTypecheckGate.test.ts:78-86` — that test asserts chain **membership**, not terminal position.

---

### 2. `packages/supabase-types/RPC-NULLABILITY.md` (committed generated artifact)

**NO ANALOG.** Searched for a generated-and-committed markdown artifact whose **freshness is
asserted by a script**: no `scripts/assert-*.mjs` writes any file, and no `.md` in the tree is
regenerate-and-diff gated.

**Nearest neighbour:** `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md`
— generated (from `@component` docstrings), committed (`git check-ignore` → not ignored), and lives
under a `generated/` path segment. Its header states its provenance in the first three lines:

```markdown
# Component Documentation

This documentation is automatically generated from the `@component` docstrings in Svelte files.
```

**What is *not* borrowable:** nothing asserts that file is current. The regenerate → `git diff
--exit-code` freshness gate RESEARCH § R8 specifies is **new to this repo for a markdown artifact**;
the only in-repo instance of the *idiom* is the `git diff --exit-code` in the CI job pattern below.

**Directives the planner should carry** (mine from the neighbour + house convention):
1. A first-paragraph provenance line naming the generating script and the `--write` invocation.
2. No `.planning/**` reference (D-N1) — the file is in-tree source-adjacent.
3. Colocated with the override (RESEARCH § R1's rationale), i.e. `packages/supabase-types/`.

---

### 3–4. `database.overrides.ts` + `database.merged.ts` (type modules)

**Analog:** `packages/supabase-types/src/column-map.ts` — the only hand-maintained sibling module
in the same package (the package's `src/` is exactly `column-map.ts`, `database.ts`, `index.ts`).

**Doc-comment + export style** (`column-map.ts:1-12`):

```ts
/**
 * Mapping between snake_case database column names and camelCase @openvaa/data property names.
 * Used by data adapters to convert between DB and TypeScript conventions.
 *
 * Only includes columns where the names differ (id, name, type, etc. are identical).
 */
export const COLUMN_MAP = {
  // DataObjectData common columns
  sort_order: 'order',
  short_name: 'shortName',
  custom_data: 'customData',
  is_generated: 'isGenerated',

  // CandidateData
  first_name: 'firstName',
```

Note the house form: a file-level `/** … */` stating **what it is + who consumes it + what it
deliberately omits**, then grouped entries with `// <Group>` section comments. The override's
per-RPC column unions should carry the same `// <RPC name>` grouping.

**Barrel export style — current `packages/supabase-types/src/index.ts`, verbatim, all 4 lines:**

```
1: export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
2: export { Constants } from './database.js';
3: export { COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP } from './column-map.js';
4: export type { ColumnName, PropertyName, CollectionName, TableName } from './column-map.js';
```

House conventions extracted, all four lines conforming:
- `export type { … }` for types, `export { … }` for values — **separate statements**, never mixed.
- **`.js` extension on every relative specifier** (`./database.js`, `./column-map.js`) — mandatory.
- Named-member lists, alphabetised within the type exports on `:1` and `:4`.

`:1` is the exact line RESEARCH § R3 replaces with two lines; `:2`, `:3`, `:4` are untouched.

**Package tsconfig context** (`packages/supabase-types/tsconfig.json`, whole file):

```json
{
  "$schema": "https://json-schema.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": { "rootDir": "./src", "outDir": "./build", "noEmit": true },
  "include": ["src/**/*"]
}
```

`include: ["src/**/*"]` already picks up both new files — no tsconfig edit needed.

---

### 5. `packages/supabase-types/package.json` (MODIFY — add `typecheck`)

**Analogs, verbatim:**

```
packages/core/package.json:25:        "typecheck": "tsc --noEmit",
packages/data/package.json:26:        "typecheck": "tsc --noEmit",
packages/app-shared/package.json:10:   "typecheck": "tsc --noEmit"
packages/dev-seed/package.json:15:     "typecheck": "tsc --noEmit",
```

**Exact script text to add:** `"typecheck": "tsc --noEmit",` — no flags, no `-p`, no `--build`.

**Current `packages/supabase-types/package.json` `scripts` block, verbatim:**

```json
  "scripts": {
    "generate": "supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts",
    "build": "echo 'Raw .ts source — no build step needed'"
  },
```

Insert `typecheck` between `generate` and `build` (RESEARCH § R3).

**`turbo.json` `typecheck` task config — already present, needs no edit:**

```json
{ "dependsOn": ["^build"], "outputs": [], "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"] }
```

Turbo skips workspaces that do not *declare* the script; adding it to the manifest is the whole fix.

⚠ Carried from RESEARCH § R8: running `tsc` in this workspace rewrites the **tracked**
`packages/supabase-types/tsconfig.tsbuildinfo`. Every `git diff --exit-code` gate must be
path-scoped.

---

### 6. `supabaseDataProvider.test.ts` (MODIFY — add a root-nomination `it`)

**Analog:** the adjacent `it` at `:1630-1645`, inside `describe('getNominationData', …)` opened at
`:1444` (nested in `describe('SupabaseDataProvider', …)` at `:128`).

**Nearest existing `it` consuming `orgNomRow`** (`:1604-1628`) — shows mocking + assertion style:

```ts
    it('nomination objects include entityType, entityId, electionId, constituencyId fields', async () => {
      // see phase 64 P01: include orgNomRow so the candidate nomination's parent
      // (n3 → organization) resolves in the in-memory parent-type lookup.
      mockSupabase._mockRpcResponses['get_nominations'] = {
        data: [baseCandidateNomRow, orgNomRow],
        error: null
      };

      const result = await provider.getNominationData();
      const nom = (result.nominations as Array<NominationTestNarrow>).find((n) => n.id === 'n1');

      expect(nom?.entityType).toBe('candidate');
      // ...
      expect(nom?.parentNominationId).toBe('n3');
      // see phase 64 P01: parentNominationType is derived from the parent's entity_type.
      expect(nom?.parentNominationType).toBe('organization');
    });
```

**Closest structural sibling — the null-path `it` the new test mirrors** (`:1630-1645`):

```ts
    it('clears parentNominationId when the parent nomination is not in the result set (P01)', async () => {
      // If the RPC fan-out doesn't include the parent (e.g., a cross-constituency
      // parent that the filter excluded), the adapter MUST clear parentNominationId
      // so the Nomination constructor's "either both or neither" invariant holds.
      mockSupabase._mockRpcResponses['get_nominations'] = {
        data: [baseCandidateNomRow], // no orgNomRow — parent unresolvable
        error: null
      };

      const result = await provider.getNominationData();
      const nom = (result.nominations as Array<NominationTestNarrow>).find((n) => n.id === 'n1');

      expect(nom?.entityType).toBe('candidate');
      expect(nom?.parentNominationId).toBeNull();
      expect(nom?.parentNominationType).toBeUndefined();
    });
```

**House form, extracted — copy all five:**
1. Title = a behavioural sentence, lowercase, sometimes suffixed with the originating ref (`(P01)`).
2. First statement mutates `mockSupabase._mockRpcResponses['get_nominations'] = { data: [...], error: null };`
   — the fixture row consts are `describe`-scoped (`baseCandidateNomRow`, `duplicateCandidateNomRow`
   `:1480-1486`, `orgNomRow` `:1488-1521`).
3. `const result = await provider.getNominationData();`
4. Narrowing read: `(result.nominations as Array<NominationTestNarrow>).find((n) => n.id === '<id>')`.
5. `expect(nom?.<prop>)` with `toBeNull()` / `toBeUndefined()` / `toBe(...)`; optional-chaining on
   `nom?` throughout.

**Type already sufficient** — `NominationTestNarrow` (`:108-119`) declares
`parentNominationId?: string | null` (`:116`) and `parentNominationType?: string` (`:117`).
No type edit needed.

**The fixture, verbatim at the columns that matter** (`:1488-1520`) — `orgNomRow` is the root
nomination and its id is `'n3'`:

```ts
    const orgNomRow = {
      id: 'n3',
      ...
      parent_nomination_id: null,
      ...
      entity_first_name: null,
      entity_last_name: null,
      entity_organization_id: null
    };
```

⚠ The new `it` must `.find((n) => n.id === 'n3')` — **not** `'n1'`, which every neighbouring test
uses. That is the one place the copy-paste breaks.

---

### 7. `supabaseDataProvider.ts` (MODIFY — `:300` cast removal)

**In-place edit; no analog needed.** `:282-320` verbatim:

```ts
282:     // Build nomination_id → entity_type map for parent-type derivation.
283:     // see phase 64 P01: the schema's `nominations` table stores `parent_nomination_id`
284:     // but the parent's entity_type is not denormalized into the child row — it
285:     // must be looked up from the parent. The Nomination base class
286:     // (packages/data/src/objects/nominations/base/nomination.ts:38-45) throws if
287:     // `parentNominationId` is set without a matching `parentNominationType`,
288:     // so we must populate both. The `get_nominations` RPC returns ALL relevant
289:     // nominations (parents and children) in the same fan-out, so this lookup
290:     // is purely in-memory and adds no DB round-trips.
291:     const nominationTypeById = new Map<string, string>();
292:     for (const row of data) {
293:       nominationTypeById.set(row.id, row.entity_type);
294:     }
295:
296:     for (const row of data) {
297:       if (seenNominationIds.has(row.id)) continue;
298:       seenNominationIds.add(row.id);
299:       // Build nomination object from nomination-level columns
300:       const parentNominationId = row.parent_nomination_id as string | null | undefined;
301:       const parentNominationType =
302:         parentNominationId != null ? (nominationTypeById.get(parentNominationId) ?? null) : null;
303:       const nomRow = {
304:         id: row.id,
305:         name: row.name,
306:         short_name: row.short_name,
307:         info: row.info,
308:         color: row.color,
309:         image: row.image,
310:         sort_order: row.sort_order,
311:         subtype: row.subtype,
312:         custom_data: row.custom_data,
313:         election_id: row.election_id,
314:         constituency_id: row.constituency_id,
315:         election_round: row.election_round,
316:         election_symbol: row.election_symbol,
317:         parent_nomination_id: parentNominationId ?? null
318:       };
319:       const nomObj = toDataObject(nomRow, locale, this.defaultLocale);
320:
```

**Only `:300`'s ` as string | null | undefined` is removed.** `:301-302` (the guard), `:317` (the
`?? null`) and the `:335-341` branch downstream are the live behaviour criterion 2 pins — do not
touch them (CONTEXT § F8).

⚠ **Comment-hygiene note (D-N1):** `:283`/`:286` reference `phase 64 P01` and a
`packages/data/...:38-45` line cite. These are **in-tree** references, not `.planning/**`, so they
survive Phase 152's purge — but any comment this phase *adds* here is authored under the purged
convention.

⚠ **Same-file collision:** Phase 157 edits `:56`, `:92`, `:368-378`, `:511` of this file. Not the
same wave (CONTEXT O-4, RESEARCH R7).

---

### 8. Repo-meta vitest over `.github/workflows/main.yaml`

**Analog:** `packages/dev-seed/tests/ciTypecheckGate.test.ts` — 88 lines, the whole shape.

**Where it lives, and why** (`:19-31`, its own docblock):

```ts
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in,
 * and this package already reads repo-root files from its tests —
 * `assertKnownRowProps.test.ts` and `permittedKeys.test.ts` both parse
 * `apps/supabase/supabase/schema/501-bulk-operations.sql` from `REPO_ROOT`. ...
 *
 * ⚠ It is a text-level spec, deliberately: no YAML parser is a dependency of this workspace,
 * and adding one to assert six lines would be a worse trade. The step names are matched
 * verbatim, so renaming a step reddens this file and the reader is sent here.
```

**How it reads the YAML/JSON** (`:33-48`) — copy exactly:

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

const TYPECHECK_STEP = '- name: "Type-check all packages (turbo run typecheck)"';
const ESLINT_STEP = '- name: "Run ESlint check on frontend"';
```

Note: `readFileSync` at **module scope**, hoisted into named `const`s; anchor strings extracted to
SCREAMING_SNAKE consts so a rename produces one readable failure.

**What it asserts** — four `it`s, three idioms worth copying:

Exactly-once (`:51-56`) — the guard that makes `indexOf` reads meaningful:

```ts
  it('declares both steps exactly once', () => {
    // Guards the two `indexOf` reads below: a duplicated or renamed step would
    // make the ordering assertion measure the wrong pair, or -1.
    expect(WORKFLOW.split(TYPECHECK_STEP)).toHaveLength(2);
    expect(WORKFLOW.split(ESLINT_STEP)).toHaveLength(2);
  });
```

Slice-a-step-and-inspect-its-body (`:65-70`):

```ts
  it('runs `yarn typecheck` in that step, unforced', () => {
    const step = WORKFLOW.slice(WORKFLOW.indexOf(TYPECHECK_STEP), WORKFLOW.indexOf(ESLINT_STEP));
    expect(step).toContain('run: yarn typecheck');
    expect(step).not.toContain('TURBO_FORCE');
  });
```

`package.json` `&&`-chain **membership** (`:72-87`) — the pattern that makes appending
`assert:rpc-nullability` to `lint:check` safe, and the one to extend:

```ts
    // The invariant is MEMBERSHIP of the `&&` chain, not terminal position:
    // every link after it is equally aborted by a type failure, so guards may
    // be appended freely. Asserting `endsWith` instead made this test fail the
    // moment Phase 147 appended its two scan guards — a correct change the
    // over-specified assertion had no business rejecting.
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn typecheck');
```

**Directly applicable to 164:** `expect(links).toContain('yarn assert:rpc-nullability')`, plus
`expect(WORKFLOW.split('supabase-types-drift:')).toHaveLength(2)` and a step-slice asserting the
diff step contains `packages/supabase-types/src/database.ts` (RESEARCH § R6).

---

### 9. `.github/workflows/main.yaml` (MODIFY — add `supabase-types-drift`)

**Job census — measured this session (`grep -n "^  [a-z0-9-]*:$"`), confirming RESEARCH's SIX, not
CONTEXT § F6's four:**

| Line | Job | `supabase start`? | node/yarn setup + install? | `paths-filter`? |
|---|---|---|---|---|
| `:25` | `skill-drift-check` | no | no | no |
| `:36` | `frontend-and-shared-module-validation` | no | yes | no |
| `:106` | `supabase-tests` | **yes** (`:124-125`) | **NO — none at all** | **yes** (`:112-118`) |
| `:163` | `dev-seed-integration` | **yes** (`:199-201`) | **yes** (`:171-184`) | **no, deliberately** (`:155-162`) |
| `:247` | `e2e-tests` | yes | yes | no |
| `:328` | `e2e-visual` | yes | yes | no |

(`:4` and `:22`-region matches in the same grep are the `on: push:` trigger keys, not jobs.)

**Analog to copy: `dev-seed-integration` (`:163-246`).** Its step vocabulary, verbatim (`:174-196`):

```yaml
    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

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
```

and its Supabase bracket (`:198-201`, `:243-246`):

```yaml
      - name: "Start Supabase"
        working-directory: apps/supabase
        run: supabase start
      ...
      - name: "Stop Supabase"
        if: always()
        working-directory: apps/supabase
        run: supabase stop
```

**The no-paths-filter rationale to quote in the new job's comment** (`:155-162`, verbatim):

```yaml
  # There is deliberately NO `paths-filter` here (unlike `supabase-tests`). The
  # code this guards spans dev-seed, supabase-types, apps/supabase's schema, and
  # the core/matching/app-shared chain the latent answer model uses, so an
  # honest filter would cover most of the repo — and a conditional guard is how
  # F5 happened in the first place. The job runs in parallel with `e2e-tests`,
  # which does strictly more work (same install + build + `supabase start`, plus
  # a Playwright install and the full E2E suite), so it does not extend the
  # critical-path wall clock; the cost is runner minutes.
```

**Contrast job — `supabase-tests` (`:106-138`), verbatim head, showing why it CANNOT host the
drift check:**

```yaml
  supabase-tests:
    runs-on: ubuntu-latest
    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            supabase:
              - 'apps/supabase/**'
              - 'packages/supabase-types/**'

      - uses: supabase/setup-cli@v1
        if: steps.changes.outputs.supabase == 'true'
        with:
          version: latest

      - name: "Start Supabase"
        if: steps.changes.outputs.supabase == 'true'
        working-directory: apps/supabase
        run: supabase start
```

Five steps total, **every one `if:`-gated**, and **no `actions/setup-node`, no
`threeal/setup-yarn-action`, no `yarn install`** — it cannot run `yarn db:types`
(`package.json:23` → a Yarn-4 workspace script). This settles O-3 in favour of a new job.

**Secrets convention that also applies to the new job** (`:222-224`): "The values are appended to
`$GITHUB_ENV` only — never echoed to stdout, and `set -x` must not be added here". The drift job
runs no `supabase status`, so it should simply not echo anything from Supabase.

**Placement:** after `dev-seed-integration`, i.e. immediately before `e2e-tests:` at `:247`
(RESEARCH § R6). Full YAML for the job is already written out at RESEARCH `:743-801` — copy it.

⚠ **Phase 163 shares this `jobs:` block.** Never the same wave (CONTEXT D-M3 ⚠⚠, O-5).

---

### 10. `164-NEGATIVE-CONTROL.md`

**Analog:** `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md`
(673 lines). Its section skeleton, measured:

```
:1    # Phase 137 — Negative Control: <what was controlled>
:3-5  bold one-paragraph thesis stating the run count and the halves
:7-11 the header block (five fixed fields — see below)
:15   ## 1. Why this run existed          — quotes the ROADMAP criterion VERBATIM in a blockquote
:44   ## 2. Environment                   — a captured stamp + per-resource tables
:68   ### Port allocation                 (phase-specific resource table)
:89   ### <raw tool output>               — verbatim, fenced
:111  ## 3. The adversary — rebuildable on any machine
:227  ## 4. RUN 1 — blindness: <old instrument>, against BOTH …
:328  ## 5. RUN 2 — the catch: <new instrument>, against BOTH …
:419  ### 5.4 The four run records, side by side   ← THE LEDGER TABLE
:430  ## 6. Invocation matrix — the gate cannot be routed around
:509  ## 7. The FOUND adversary (not staged)
:629  ## 8. Verdict — evidence mapped to ROADMAP criteria   ← THE VERDICT TABLE
:638  ### What is explicitly NOT discharged by this document
:652  ### Reproducibility and non-contamination
```

**Header block, verbatim** (`:7-11`) — five fields, this order:

```markdown
- **Date:** 2026-08-13
- **Plan:** `137-03-PLAN.md` (wave 2)
- **Decisions discharged:** D-11 (staged adversary), D-12 (retired check as a throwaway script), D-13 (this document)
- **Requirements:** INTEG-04, INTEG-05
- **Precedent followed:** `.planning/milestones/v2.14-phases/136-.../136-VISUAL-DISCRIMINATION-EVIDENCE.md`
```

For 164: Requirements = CIGATE-04, CIGATE-05; Decisions = D-M3 (+O-1); Precedent followed =
this 137 file.

**Environment stamp, verbatim shape** (`:50-63`) — a fenced block of `label:` / value pairs:

```
date:               2026-08-13T08:02:46Z (UTC)  /  2026-08-13 11:02 EEST
repo root:          /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:           5b0813e94  branch feat-gsd-roadmap
OS:                 macOS 26.5.1 arm64
Node:               v24.14.1
...
```

**The ledger table** (`:419-426`) — the format the 164 `NC-1`/`NC-2`/`NC-3` rows must match
(`#` · instrument · target · **exit code** · verdict-with-one-clause-why):

```markdown
| # | Check | Target | Exit | Verdict |
|---|---|---|---|---|
| 1a | retired (`node` process + title grep) | **:5373 foreign** | **0** | PASS — blind |
| 1b | retired (`node` process + title grep) | **:5273 ours** | **0** | PASS — indistinguishable from 1a |
| 2a | committed preflight | **:5373 foreign** | **1** | FAIL, clause (b), named |
| 2b | committed preflight | **:5273 ours** | **0** | PASS, and the suite proceeds (§5.3) |
```

**The verdict table** (`:631-636`) — criterion → discharged-by → status, with an explicit
out-of-scope row:

```markdown
| ROADMAP criterion | Discharged by | Status |
|---|---|---|
| **1** — retired check PASSES against a foreign server; new preflight FAILS … | §4.3 … **and** §5.1 … | **DISCHARGED** |
| **4** — live docs state the response-content assertion … | Not this plan. Plan 137-04. | **out of scope here** |
```

**Non-contamination clause** (`:652-655`) — the house standard the phase must reproduce; 137 states
`git status --porcelain` showed nothing from the control reached the harness. RESEARCH § R4 raises
this to three proofs per mutation (`git diff --exit-code` → 0; `git hash-object` equal to a hash
captured **before** the touch; `git status --porcelain` empty).

**Format rules extracted:** exit codes and **verbatim tool output** in fenced blocks, never
descriptions; every measured number carried with its measurement context; a dedicated "what this
does NOT prove" subsection — which is where 164's `NC-2` GREEN disclosure belongs.

---

## Shared Patterns

### S1 — Static-assert script family (applies to file 1)
**Source:** `scripts/assert-a11y-scan-wiring.mjs` · `scripts/assert-i18n-catalog-namespaces.mjs`
**Apply to:** `scripts/assert-rpc-return-nullability.mjs`

```js
#!/usr/bin/env node
/** <SCREAMING TITLE> (phase NNN, requirement XXX-NN). … Usage: … Exit codes: 0 / 1 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SELF = 'scripts/<name>.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
// … read fail-closed, `let violations = 0`, `violate(msg)` → `[ERROR] ${SELF}: …`
console.log(`<Guard name> (phase NNN: REQ) — <measured counts>. ${violations} violation(s).`);
process.exitCode = violations > 0 ? 1 : 0;
main();
```

Node built-ins only. No dependency. No AST/YAML/SQL parser — the house rejects them explicitly
(`assert-a11y-scan-wiring.mjs:44-49`; `ciTypecheckGate.test.ts:28-30`).

### S2 — Wiring a guard so deleting it is not silent
**Source:** root `package.json:25-27`, `:35` + `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-86`
**Apply to:** files 1, 7 (the repo-meta spec), 8 (the CI job)

Every guard has **two** wirings: (a) an `assert:*` entry composed into an `&&` chain that CI already
runs, and (b) a vitest assertion that the chain still **contains** it. Without (b), removing the
link is a green-passing regression.

### S3 — Fail-closed + consequence-naming error messages
**Source:** `assert-a11y-scan-wiring.mjs:74-82`, `:105-109`
**Apply to:** files 1 and the CI job's diff step

An unreadable input is a violation, not a skip. Every message names *what changed*, *what silently
breaks as a result*, and the requirement id.

### S4 — `git diff --exit-code`, always path-scoped
**Source:** RESEARCH § R6/R8 (`packages/supabase-types/tsconfig.tsbuildinfo` is tracked and not
gitignored; measured this session — the file exists at `packages/supabase-types/tsconfig.tsbuildinfo`)
**Apply to:** the CI job, the `--write` freshness check, the negative-control revert proofs

```
git diff --exit-code -- packages/supabase-types/src/database.ts
git diff --exit-code -- packages/supabase-types/RPC-NULLABILITY.md
```

Never unscoped.

### S5 — Comment hygiene under D-N1 (Phase 152 lands first)
**Apply to:** every file this phase authors — the script, the two type modules, the CI YAML
comments, the new `it`, the repo-meta spec

The analogs cited above (`assert-a11y-scan-wiring.mjs:41`, `assert-i18n-catalog-namespaces.mjs` tail,
`ciTypecheckGate.test.ts:1-31`) all contain `.planning/**` references — they predate the purge.
**Copy their structure, replace their citations with in-tree targets**
(`packages/supabase-types/RPC-NULLABILITY.md`).

---

## No Analog Found

| File | Role | Data Flow | Reason | Nearest neighbour |
|---|---|---|---|---|
| `packages/supabase-types/RPC-NULLABILITY.md` | committed generated artifact | batch | No generated-and-committed markdown in this repo has its freshness asserted by a script. No `scripts/assert-*.mjs` writes any file. | `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md` — generated, committed, `generated/` path segment, provenance stated in its first paragraph; but **nothing asserts it is current** |
| `--write` mode on an `assert-*.mjs` | CLI flag | — | `grep -rn "argv\|--write" scripts/*.mjs` → 1 hit, and it is prose in a comment (`assert-unit-test-coverage.mjs:43`). No sibling parses `process.argv`. | the three siblings' `main()` entry point — the flag read must be designed, not copied |

---

## Metadata

**Analog search scope:** `scripts/`, root `package.json`, `turbo.json`, `packages/supabase-types/**`,
`packages/{core,data,app-shared,dev-seed}/package.json`, `packages/dev-seed/tests/`,
`apps/frontend/src/lib/api/adapters/supabase/dataProvider/`, `.github/workflows/main.yaml`,
`.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/`, `apps/docs/**` (md sweep)
**Files scanned:** 24 read or grepped
**Pattern extraction date:** 2026-08-28 (branch `integration/ship-12-squash`, HEAD `e1ab15f71`)
