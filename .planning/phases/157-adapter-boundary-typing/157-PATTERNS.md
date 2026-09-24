# Phase 157: Adapter Boundary & Typing - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 21 create/modify targets (+ 1 bulk codemod class over 53 files)
**Analogs found:** 20 / 21 (1 no-analog: the pgTAP test for a greenfield RPC has a shape analog but no functional one)

Source of the create/modify set: `157-RESEARCH.md` § "Recommended Project Structure" (`:219-253`), plus
§ A.5 (the assert script), § D (writer/`WithAuth`), and the D-N2 todo obligation in `157-CONTEXT.md:262-267`.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/app-shared/src/data/schemas/storedImage.schema.ts` (NEW) | model / schema | transform (validate-on-read) | `packages/dev-seed/src/template/schema.ts` | exact (only zod-4 module in repo) |
| `packages/app-shared/src/data/schemas/storedAnswers.schema.ts` (NEW) | model / schema | transform | same | exact |
| `packages/app-shared/src/data/schemas/storedSettings.schema.ts` (NEW) | model / schema | transform | same | exact |
| `packages/app-shared/src/data/schemas/storedCustomization.schema.ts` (NEW) | model / schema | transform | same | exact |
| `packages/app-shared/src/data/schemas/index.ts` (NEW) | barrel | — | `packages/app-shared/src/index.ts` | exact |
| `packages/app-shared/src/data/schemas/*.test.ts` (NEW) | test | transform | `packages/dev-seed/tests/template.test.ts` + `packages/app-shared/src/data/isEmoji.test.ts` | exact (behaviour + colocation convention) |
| `packages/app-shared/src/logging/logger.ts` (NEW) | utility | event-driven (emit) | `apps/frontend/src/lib/utils/logger.ts` (replaced) + `packages/app-shared/src/utils/mergeSettings.ts` (package shape) | role-match |
| `packages/app-shared/src/logging/logger.type.ts` (NEW) | model / types | — | `packages/app-shared/src/data/localized.type.ts` | exact |
| `packages/app-shared/src/logging/logger.test.ts` (NEW) | test | event-driven | `packages/app-shared/src/data/isEmoji.test.ts` | exact |
| `packages/app-shared/src/data/getLocalized.ts` (MOVED) | utility | transform | itself, at its current path | exact (pure move) |
| `packages/app-shared/src/data/getLocalized.test.ts` (MOVED) | test | transform | itself | exact (import path must change) |
| `packages/app-shared/src/index.ts` (MODIFY) | barrel | — | itself (`:1-14`) | exact |
| `packages/app-shared/package.json` (MODIFY: `"zod": "catalog:"`) | config | — | `packages/dev-seed/package.json:29`, `apps/frontend/package.json:78` | exact |
| `apps/supabase/supabase/schema/505-question-rpcs.sql` (NEW) | database RPC | request-response (read) | `apps/supabase/supabase/schema/503-entity-rpcs.sql:11-15,50-53,92` | exact |
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` (MODIFY: `p_election_round`) | database RPC | request-response | itself | exact |
| `apps/supabase/supabase/migrations/00004_*.sql` (NEW) | migration | batch | `apps/supabase/supabase/migrations/00003_authenticated_insert_feedback.sql` | exact |
| `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` (NEW) | test (pgTAP) | request-response | `apps/supabase/supabase/tests/database/07-rpc-security.test.sql:17-45` | role-match (security-shape only; no existing result-shape RPC test) |
| `apps/frontend/eslint.config.mjs` (MODIFY) | config / guard | — | itself, `:89-133` | exact |
| `apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts` (NEW) | test / guard self-test | — | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` | exact |
| `scripts/assert-adapter-casts.mjs` (NEW) + root `package.json` chain edit | build tooling | batch scan | `scripts/assert-a11y-scan-wiring.mjs`, `scripts/assert-unit-test-coverage.mjs` | exact |
| `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts` (+ test) (NEW) | utility | transform | `apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts` + `localizeRow.test.ts` | exact |
| `.../dataProvider/supabaseDataProvider.ts` (MODIFY) | service / adapter | CRUD + request-response | itself | exact |
| `.../dataWriter/supabaseDataWriter.ts` (MODIFY) | service / adapter | CRUD | itself | exact |
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` (MODIFY: delete `WithAuth`) | model / interface | — | itself `:330-350` | exact |
| `.planning/todos/pending/2026-08-28-reintroduce-local-adapter.md` (NEW) | doc | — | `.planning/todos/pending/2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` | exact |
| `.planning/phases/157-.../157-NEGATIVE-CONTROL-LEDGER.md` (NEW) | doc | — | `143-NEGATIVE-CONTROL-LEDGER.md:1-58` | exact |
| ~53 frontend files (BULK CODEMOD, `logDebugError`) | mixed | — | see § Bulk Codemod Shapes | shape-map, not per-file |

---

## Pattern Assignments

### `packages/app-shared/src/data/schemas/*.schema.ts` (model, transform)

**Analog:** `packages/dev-seed/src/template/schema.ts` — the repo's only zod-4 module.

**Import + header pattern** (`packages/dev-seed/src/template/schema.ts:23-24`):

```ts
import { z } from 'zod';
import type { Template } from './types';
```

**The `.strict()`-does-not-descend pattern, with its rationale comment** — copy the *shape* of this
comment for every nested object (`packages/dev-seed/src/template/schema.ts:33-56`):

```ts
/**
 * ## `.strict()` here is NOT redundant with `TemplateSchema.strict()` (Phase 144, D-04)
 *
 * `.strict()` is a PER-OBJECT setting; it does not descend. Measured at this
 * tree's zod (4.3.6): a top-level-only strict schema parses
 * `{ candidates: { fixed: [...], bogus: 3 } }` with **success** and silently
 * strips `bogus`. Both objects therefore carry `.strict()`, and
 * `tests/template.test.ts` holds each direction with its own case.
 */
const perEntityFragment = z
  .object({
    count: z.number().int().nonnegative().optional(),
    fixed: z.array(z.record(z.string(), z.unknown())).optional()
  })
  .strict();
```

Note: `z.record(z.string(), z.unknown())` is the **two-argument v4 form** (`schema.ts:57`). The
one-argument v3 form is gone. Also note the D-N1 comment convention (`157-RESEARCH.md:485-489`): the
above analog comment is a JSDoc block, which is the safe shape; free-standing wrapped `//` prose that
continues at the same indent without terminal punctuation is what Phase 152's `lint:check` scan rejects.

**`safeParse` + `issues[].path` error idiom** (`packages/dev-seed/src/template/schema.ts`, exported
`validateTemplate` at end of file, quoted in `157-RESEARCH.md:146-156`):

```ts
export function validateTemplate(input: unknown): Template {
  const result = TemplateSchema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues.map((iss) => `  template.${iss.path.join('.')}: ${iss.message}`).join('\n');
    throw new Error(`Template validation failed:\n${msg}`);
  }
  assertFixedRowsCarryExternalId(result.data);
  return result.data;
}
```

**⚠ The one deliberate divergence from this analog** (`157-RESEARCH.md` § A.4, final paragraph):
dev-seed **throws**; the adapter edge must **not**. Use `safeParse`, log at `warn` via the new logger
with the `issues` path list, and fall back to the same empty value the provider's existing error
branches return (`supabaseDataProvider.ts:52` returns `{}`, `:88` returns `{} as AppCustomization`).

**Field list to mirror for `StoredImageSchema`** (`apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16`,
quoted in `157-RESEARCH.md:288-295`) — the interface itself moves to app-shared alongside its schema.

---

### `packages/app-shared/src/data/schemas/*.test.ts` (test, transform)

**Analogs:** `packages/dev-seed/tests/template.test.ts` (the assertions) and
`packages/app-shared/src/data/isEmoji.test.ts` (the app-shared colocation + import convention).

**App-shared test convention** (`packages/app-shared/src/data/isEmoji.test.ts:1-4`) — colocated beside
the source, relative `./` import, `describe`/`test`:

```ts
import { describe, expect, test } from 'vitest';
import { isEmoji } from './isEmoji';

describe('isEmoji', () => {
```

**The three assertions that transfer verbatim from dev-seed:**

1. `{}` passes (`packages/dev-seed/tests/template.test.ts:22-25`):

```ts
  it('TMPL-02: {} template passes validation (every field is optional)', () => {
    expect(() => validateTemplate({})).not.toThrow();
    expect(validateTemplate({})).toEqual({});
  });
```

2. Top-level unknown key rejected + 3. nested unknown key rejected, the second carrying its measured
rationale inline (`packages/dev-seed/tests/template.test.ts:109-123`):

```ts
  it('ASSERT-04: rejects an unknown TOP-LEVEL key (TemplateSchema.strict())', () => {
    expect(() => validateTemplate({ seed: 42, bogusTopLevel: 1 })).toThrow(
      /template\.:.*Unrecognized key.*"bogusTopLevel"/
    );
  });

  it('ASSERT-04: rejects an unknown key INSIDE a per-entity fragment (perEntityFragment.strict())', () => {
    // Top-level strictness alone does NOT reach here: measured at zod 4.3.6, a
    // top-level-only strict schema parses this input with SUCCESS and silently
    // strips `bogusFragmentKey`. This case is why `perEntityFragment` is strict too.
    expect(() =>
      validateTemplate({
        candidates: { fixed: [{ external_id: 'my_cand' }], bogusFragmentKey: 3 }
      })
    ).toThrow(/template\.candidates:.*Unrecognized key.*"bogusFragmentKey"/);
  });
```

`Unrecognized key` is a **zod-4 message string** these regexes depend on. One rejection case **per
nesting level per column** (settings is ≥3 deep).

---

### `packages/app-shared/src/logging/logger.ts` (utility, event-driven)

**Analog A — the module being replaced**, quoted in full (`apps/frontend/src/lib/utils/logger.ts:1-13`,
via `157-RESEARCH.md:596-609`):

```ts
import { constants } from '$lib/utils/constants';

/**
 * Allows debug messages to be logged in development environment, but filtered out for production.
 * @param message - Message or object to log into console
 * @param error - Potential error message to print out completely
 */
export function logDebugError(message: unknown, error: unknown = null) {
  if (import.meta.env.DEV || constants.PUBLIC_DEBUG) {
    if (error) console.error(message, error);
    else console.info(message);
  }
}
```

Neither `import.meta.env.DEV` nor `$lib/utils/constants` is visible from app-shared — hence the
`configureLogger()` injection recommended at `157-RESEARCH.md` § G.3 (default `level: 'silent'`).

**Analog B — the app-shared module shape** (`packages/app-shared/src/utils/mergeSettings.ts:13-35`): a
JSDoc block naming the hoist and its sibling-confusion hazard, then a named `export function`. Note
`func-style: ['error', 'declaration', { allowArrowFunctions: false }]`
(`packages/shared-config/eslint.config.mjs:87`) — exported helpers must be function **declarations**,
not arrow consts.

```ts
/**
 * Deep merge two plain (non-constructed) objects with settings.
 *
 * Hoisted to `@openvaa/app-shared` (see phase 63) so both `@openvaa/dev-seed`
 * and the frontend can import a single source of truth. Note that
 * `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` is a
 * separate, SHALLOW merge with different semantics — do not confuse the two.
 * ...
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
```

**Barrel re-export pattern** — `packages/app-shared/src/index.ts:1-14`, flat, alphabetised
`export * from './<dir>/<module>'`, no `.js` extensions:

```ts
export * from './data/argumentType';
export * from './data/customData.type';
export * from './data/extendedData.type';
export * from './data/getCustomData';
export * from './data/isEmoji';
export * from './data/isImage';
export * from './data/isLocalized';
export * from './data/localized.type';
export * from './settings/dynamicSettings';
export * from './settings/dynamicSettings.type';
export * from './settings/staticSettings';
export * from './settings/staticSettings.type';
export * from './utils/mergeSettings';
export * from './utils/passwordValidation';
```

New lines to insert, in sorted position: `./data/getLocalized`, `./data/schemas`,
`./logging/logger`, `./logging/logger.type`. Note `*.test.ts` files are **not** exported here and are
excluded from the declaration build by `packages/app-shared/tsconfig.json`.

---

### `packages/app-shared/src/data/getLocalized.{ts,test.ts}` (utility + test, transform — MOVE)

**Source, in full** (`apps/frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts:1-28`) — zero
imports, so the move is mechanical:

```ts
/**
 * Extract a locale-appropriate string from a JSONB locale object.
 * Implements 3-tier fallback matching the SQL get_localized() function
 * in apps/supabase/supabase/schema/000-functions.sql:
 *
 *   1. requested locale
 *   2. default locale
 *   3. first available key
 *   4. null (if value is null/undefined or empty object)
 *
 * This utility is opt-in per field -- it does NOT automatically localize.
 * DataWriter methods that need raw JSONB (multilingual writes) skip this.
 */
export function getLocalized(
  value: Record<string, string> | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
  if (value == null) return null;

  if (locale in value) return value[locale];
  if (defaultLocale in value) return value[defaultLocale];

  const keys = Object.keys(value);
  if (keys.length > 0) return value[keys[0]];

  return null;
}
```

**⚠ Two things to change during the move, not after:**
1. **The test's import path is wrong-but-working today** — `getLocalized.test.ts:2` reads
   `import { getLocalized } from '../utils/getLocalized';` (redundant `../utils/`, the test lives *in*
   `utils/`). It must become `./getLocalized`. A path-preserving move resolves to nothing.
2. **Criterion 5 requires it be "typed from" `localized.type.ts`.** The destination neighbourhood
   declares `LocalizedString` (`packages/app-shared/src/data/localized.type.ts:55-57`):

```ts
export type LocalizedString = {
  [locale: string]: string;
};
```

   so `value: Record<string, string> | null | undefined` becomes `value: LocalizedString | null | undefined`.

**Destination sibling import style** (`packages/app-shared/src/data/isLocalized.ts:1-3`) — relative,
no extension, `import type` for types, `simple-import-sort` ordering:

```ts
import { isImage } from './isImage';
import { isPlainObject } from './utils/isPlainObject';
import type { LocalizedObject, LocalizedString } from './localized.type';
```

**Test body** (`getLocalized.test.ts:4-8`) — `describe`/`it`, one assertion per tier, keep all 9 cases:

```ts
describe('getLocalized', () => {
  it('returns exact locale match (tier 1)', () => {
    expect(getLocalized({ en: 'Hello', fi: 'Hei' }, 'en')).toBe('Hello');
  });
```

**Caller left behind:** `apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts:1`
(`import { getLocalized } from './getLocalized';`) must repoint at `@openvaa/app-shared`.
`localizeRow`, `mapRow`, `storageUrl`, `toDataObject` **stay** (`157-RESEARCH.md:241-244`).

---

### `apps/supabase/supabase/schema/505-question-rpcs.sql` (database RPC, request-response)

**Analog:** `apps/supabase/supabase/schema/503-entity-rpcs.sql`.

**File header + section-rule convention** (`503-entity-rpcs.sql:1-10`):

```sql
-- Entity RPC functions
--
-- Functions:
--   get_nominations()         - return nominations with entity data
--   get_candidate_user_data() - return entity row for authenticated user
--   upsert_answers()          - atomic answer write for a single entity

--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--------------------------------------------------------------------------------
```

**Signature + modifier pattern** (`503-entity-rpcs.sql:11-15,50-53`) — `p_`-prefixed params, all
`DEFAULT NULL`, explicit `RETURNS TABLE`, `LANGUAGE sql` / `STABLE` / `SECURITY INVOKER`:

```sql
CREATE OR REPLACE FUNCTION public.get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  name jsonb,
  ...
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
```

**Grant pattern** (`503-entity-rpcs.sql:92`) — argument types spelled out, explicit role list:

```sql
GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean) TO anon, authenticated;
```

**⚠ Adding `p_election_round` to `get_nominations` changes its signature**, so the existing `GRANT`
line's argument list must be updated too (or a new overload granted) — `GRANT` is keyed by signature.

---

### `apps/supabase/supabase/migrations/00004_*.sql` (migration, batch) — MANDATORY PAIR

**Analog, in full** (`apps/supabase/supabase/migrations/00003_authenticated_insert_feedback.sql:1-20`):

```sql
-- Migration 00003: Allow authenticated users to insert feedback
--
-- Background: The feedback popup is reachable from both the voter app (anon
-- role) and the candidate app (authenticated role). The original schema only
-- granted INSERT on public.feedback to the anon role, so authenticated
-- candidate sessions hit a "new row violates row-level security policy"
-- error when submitting feedback. The rate-limit trigger + CHECK constraint
-- already gate the insert regardless of role; the role split was an
-- oversight, not a security boundary.
--
-- Applies to schema files:
--   - apps/supabase/supabase/schema/302-rls.sql (feedback policies)

BEGIN;

CREATE POLICY "authenticated_insert_feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

COMMIT;
```

The load-bearing conventions: `-- Migration 0000N: <title>`, a `Background:` paragraph, the
**`-- Applies to schema files:`** list, and a `BEGIN;` / `COMMIT;` wrapper. Per
`157-RESEARCH.md` Pitfall 1, `schema/` is a read-only mirror the CLI never applies
(`apps/supabase/README.md:16`) — **every SQL task in this phase produces two edits in one commit.**
Migrations dir currently holds exactly `00001`, `00002`, `00003`; next is `00004`. Coordinate with
Phase 156's E2(a) in-place migration rewrite before assuming a new file is right.

---

### `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` (test, request-response)

**Analog:** `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`.

**Header + boilerplate** (`07-rpc-security.test.sql:1-27`) — note the `DROP TABLE IF EXISTS __tcache__;`
pgTAP state reset, the explicit `plan(N)`, the `Depends on:` list, and the fixture call:

```sql
-- 07-rpc-security.test.sql: RPC function security tests
--
-- Verifies security properties of bulk_import, bulk_delete, and resolve_email_variables:
--   - bulk_import/bulk_delete are SECURITY INVOKER (RLS applies to caller)
...
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             016-bulk-operations.sql (bulk_import, bulk_delete)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(9);

-- Create test fixture data
SELECT create_test_data();
```

**Security-shape assertion to copy verbatim for `get_questions`** (`07-rpc-security.test.sql:33-45`):

```sql
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'bulk_import'),
  'bulk_import is SECURITY INVOKER (not DEFINER)'
);
```

**Role-switching for RLS-visibility cases** (`07-rpc-security.test.sql:53-57`):

```sql
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);
```

**Gap:** no existing pgTAP file asserts an RPC's *result shape / filter correctness* — only security
shape and RLS. The election / constituency / election-round filter assertions are new ground; build
them on `create_test_data()` fixtures plus `results_eq`/`is` from pgTAP.

---

### `apps/frontend/eslint.config.mjs` (config, guard) — MODIFY

**Analog: the file itself, `:89-133`.** The whole existing block, quoted (line numbers relative to the
`sed -n '80,140p'` window, i.e. file lines 85-134):

```js
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files,
  // so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152)
  // is re-included VERBATIM here. Omitting it would silently drop that ban for these
  // files, because the replacement is total rather than additive.
  {
    files: ['src/**/*.{ts,js,mjs,cjs,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte/store',
              message:
                'svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead.'
            }
          ],
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
        }
      ],
      // Paired with the `no-restricted-imports` `paths` entry above: together they form
      // ONE ban on `svelte/store`. `no-restricted-imports` sees only static
      // `ImportDeclaration` nodes, so the dynamic `import('svelte/store')` form is closed
      // here. Edit both or neither.
      // Flat config REPLACES this array too — it does not merge it. The inherited
      // TS-enum ban (shared-config/eslint.config.mjs:79-85) is therefore re-included
      // VERBATIM as the first entry below, selector and message byte-identical.
      // Dropping it would silently delete that ban for every file under
      // `apps/frontend/src/**` AND produce zero errors, because the frontend
      // contains no enums today — so no gate in this repository would catch it.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        }
      ]
    }
  }
];
```

**The two inherited entries that must be re-included byte-identically in ANY new scoped block:**

`packages/shared-config/eslint.config.mjs:79-85`:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        }
      ],
```

`packages/shared-config/eslint.config.mjs:144-155`:

```js
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
        }
      ],
```

**Plus**, if a new block's `files` glob overlaps `src/**/*.{ts,js,mjs,cjs,svelte}`, the `svelte/store`
`paths` entry and the `ImportExpression` selector above must be re-included too, or they vanish for the
overlapping files. `157-RESEARCH.md:462` recommends extending the existing arrays for the import ban and
adding a **narrower second block** (excluding the adapter) for the `MemberExpression` rules.

**Measured-working selectors for the new ban** (`157-RESEARCH.md:396-407`):
`MemberExpression[property.name='supabase']` and `ObjectPattern > Property[key.name='supabase']` —
proven to fire under both `@typescript-eslint/parser` and `svelte-eslint-parser`. An import-only ban
catches 3 of 8 leaking files and 0 of 13 actual calls.

---

### `apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts` (test, guard self-test)

**Analog:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`.

**The apparatus** (`eslint-store-guard.test.ts:1-3,59-60,62-68`):

```ts
import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';
```

```ts
// MANDATORY (invariant 2): loads the real apps/frontend/eslint.config.mjs.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// MANDATORY (invariant 1): every probe path resolves under apps/frontend/src, which is
// what puts the fixture inside the guard block's `files` scope. The paths below are
// VIRTUAL — no file is ever written to them; they are only passed as `lintText`'s
// `filePath` option.
const SRC = path.resolve(__dirname, '../..');
```

**The four correctness invariants** are documented at `eslint-store-guard.test.ts:37-56` and transfer
verbatim in substance: (1) probe paths must resolve under `apps/frontend/src`; (2) the
`v10_config_lookup_from_file` flag is mandatory; (3) filter by `ruleId`, never by `errorCount`;
(4) when two bans share a `ruleId`, disambiguate on **message substring**, never line/column.

**The warm-up hook that removes config-load cost from the 5000ms per-test budget**
(`eslint-store-guard.test.ts:105-110`, measured fix from phase 145-08):

```ts
  beforeAll(async () => {
    await eslint.lintText(CLEAN_RUNE['.ts'], {
      filePath: path.join(SRC, GUARDED_DIRS[0], '__store_guard_warmup__.ts')
    });
  }, 120_000);
```

**The three-assertion per-probe triplet** (`eslint-store-guard.test.ts:114-129`) — fires / silent /
non-fatal, the third guarding the negative control against a parse failure reading as "silent":

```ts
    it('fires no-restricted-imports on a static svelte/store import', async () => {
      const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBeGreaterThan(0);
    });

    it('stays silent on clean rune code (negative control)', async () => {
      const [result] = await eslint.lintText(CLEAN_RUNE[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBe(0);
    });

    // Guards the negative control itself: a parse failure yields a fatal message and
    // would otherwise read as "silent".
    it('parses without a fatal message', async () => {
      const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
```

**The per-extension probe matrix** (`eslint-store-guard.test.ts:70,111-112,132-145`) —
`describe.each(cases)` over `GUARDED_DIRS × ['.ts','.svelte']`, plus an `it.each([['.js'],['.mjs'],['.cjs']])`
extension-reach block.

**The inherited-ban regression case, which the new guard MUST also carry**
(`eslint-store-guard.test.ts:174-188`):

```ts
  // D-06a / SC-9. This enum case lives in a `svelte/store` guard spec on purpose.
  // Adding `no-restricted-syntax` to the frontend block REPLACES the inherited option
  // array rather than merging it, so a single-entry array would silently delete the
  // TS-enum ban for every file under apps/frontend/src — and, because the frontend has
  // no enums today, would produce ZERO errors and pass every gate in this repository.
  // The standing case below is the only mechanism that catches a recurrence.
  it('still enforces the inherited TSEnumDeclaration ban (flat-config REPLACE regression)', async () => {
    const [result] = await eslint.lintText("export enum Color {\n  Red = 'red'\n}\n", {
      filePath: path.join(SRC, 'lib/utils', '__store_guard_probe__.ts')
    });
    const enumBan = result.messages.filter(
      (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('const assertion')
    );
    expect(enumBan.length).toBeGreaterThan(0);
  });
```

**Additional cases the new guard needs beyond the analog:** an **allowlisted-locus** case (one of the 8
route files' code, asserted silent) and a **9th-site** case (the same code at a non-allowlisted path,
asserted firing) — the discriminating pair criterion 6 names.

---

### `scripts/assert-adapter-casts.mjs` + root `package.json` (build tooling, batch scan)

**Analog:** `scripts/assert-a11y-scan-wiring.mjs` (the newest of the three; the other two are
`assert-unit-test-coverage.mjs` and `assert-i18n-catalog-namespaces.mjs`).

**Header pattern** (`scripts/assert-a11y-scan-wiring.mjs:1-58`) — shebang, an "incident this file exists
for" paragraph, a numbered per-check list, an explicit statement of why it is a regex read rather than
an AST parse, a `Usage:` block and an `Exit codes:` block:

```js
#!/usr/bin/env node

/**
 * A11Y-SCAN WIRING GUARD (phase 147, requirements CSCAN-02 / CSCAN-03).
 *
 * The incident this file exists for: ...
 *
 * FOUR checks, each a distinct way that green-but-blind could reoccur:
 *
 *   Check 1 (CSCAN-02a) — ...
 *
 * This is a plain text/regex read of the three source files, matching the
 * house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins
 * only, no build step, exit 1 naming the specific problem). ...
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */
```

**Node-builtins-only imports + repo-root resolution + fail-closed read**
(`scripts/assert-a11y-scan-wiring.mjs:60-82`):

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const PLAYWRIGHT_CONFIG = path.resolve(REPO_ROOT, 'tests', 'playwright.config.ts');
...
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

**Violation reporting + exit code** (tail of `scripts/assert-a11y-scan-wiring.mjs`) — a `violate(msg)`
accumulator, a one-line summary naming the phase and requirement ids, and `process.exitCode`:

```js
  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
```

**Chaining, root `package.json` scripts block** — the two lines to edit:

```json
    "assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
```

Add `"assert:adapter-casts": "node scripts/assert-adapter-casts.mjs"` and append
`&& yarn assert:adapter-casts` to `lint:check`.

**Chain-MEMBERSHIP assertion (Phase 144 pattern, commit `b410d3a90` — "assert typecheck's chain
MEMBERSHIP in lint:check, not its position"):** the closest live instance of reading a `package.json`
script string back is `scripts/assert-unit-test-coverage.mjs:511`:

```js
      const command = workspace.scripts['test:unit'];
```

Apply the same read to the root `lint:check` string and assert **membership** of the new `assert:` token
(e.g. a `.includes('assert:adapter-casts')` / token-split check), **never** its index or ordinal position.

**What the scan asserts** (`157-RESEARCH.md` § A.5): in
`apps/frontend/src/lib/api/adapters/supabase/**/*.ts`, zero lines match
`as\s+Json\s+as\s+unknown\s+as`. Measured baseline today: **15** (13 in the provider, 2 in the writer at
`supabaseDataWriter.ts:223,374`). Target 0.

---

### `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts` (utility, transform)

**Analog:** `apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts` — the same directory's
small pure util with a colocated test (`localizeRow.test.ts`).

**Doc + signature + guard-clause style** (`localizeRow.ts:1-27`):

```ts
import { getLocalized } from './getLocalized';

/**
 * Localize multiple fields on a database row in one pass.
 *
 * For each field in `fields`:
 * - Top-level fields (e.g. `"name"`) are resolved via `getLocalized`.
 * - Nested dot-notation fields (e.g. `"custom_data.fillingInfo"`) traverse into
 *   JSONB objects, shallow-cloning each intermediate level to avoid mutating
 *   the input row.
 *
 * Fields that are `null`, `undefined`, or point to non-object intermediates
 * are silently skipped.
 */
export function localizeRow(
  row: Record<string, unknown>,
  fields: Array<string>,
  locale: string,
  defaultLocale: string = 'en'
): Record<string, unknown> {
```

Named export, function declaration, defaulted trailing param, explicit return type, JSDoc that states
the silent-skip contract. Its test sits at `localizeRow.test.ts` in the same directory.

**The duplicated code being extracted** (`supabaseDataProvider.ts:245-255`):

```ts
    const electionIds: Array<string | null> = options?.electionId
      ? Array.isArray(options.electionId)
        ? (options.electionId as Array<string>)
        : [options.electionId]
      : [null];
    const constituencyIds: Array<string | null> = options?.constituencyId
      ? Array.isArray(options.constituencyId)
        ? (options.constituencyId as Array<string>)
        : [options.constituencyId]
      : [null];
```

Input type: `FilterValue<T> = TType | Array<TType>` (`apps/frontend/src/lib/api/base/getDataFilters.type.ts:37-40`).
`undefined → [null]` is the "no filter" sentinel that becomes the SQL `DEFAULT NULL`.

---

### `.../dataProvider/supabaseDataProvider.ts` (service/adapter, CRUD + request-response) — MODIFY

**Analog:** itself. Five blocks the planner rewrites.

**1. Settings read, `:47-77`** — the two-step "cast, then mutate into the type" that Pattern 1 replaces:

```ts
  protected async _getAppSettings(options?: GetDataOptionsBase): Promise<DPDataType['appSettings']> {
    const { data, error } = await this.supabase.from('app_settings').select('settings').limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') return {}; // No rows -- return empty settings
      throw new Error(`getAppSettings: ${error.message}`);
    }

    const settings = (data?.settings ?? {}) as Record<string, unknown>;
    const locale = options?.locale ?? this.locale;

    // Localize notification title and content fields
    if (settings.notifications && typeof settings.notifications === 'object') {
      const notifications = { ...(settings.notifications as Record<string, unknown>) };
      for (const key of ['candidateApp', 'voterApp']) {
        ...
      }
      settings.notifications = notifications;
    }

    return settings as Partial<DynamicSettings>;
  }
```

`:56` is the cast to remove; `:60` is a **runtime guard, not a cast** — do not delete it.
The `PGRST116 → {}` degradation branch is the fallback shape `safeParse` failures should reuse.

**2. Customization read, `:92-127`** — three triple-casts plus the derived localizations:

```ts
    const raw = (data?.customization ?? {}) as Record<string, unknown>;
    ...
    // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
    result.publisherLogo = parseStoredImage(raw.publisherLogo as Json as unknown as StoredImage | null, supabaseUrl);
    // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
    result.poster = parseStoredImage(raw.poster as Json as unknown as StoredImage | null, supabaseUrl);
    // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
    result.candPoster = parseStoredImage(raw.candPoster as Json as unknown as StoredImage | null, supabaseUrl);
```

Note the `// reason:` comment convention accompanying each accepted cast — the same convention must
carry any cast that legitimately survives.

**3. Filter fan-out, `:236-255`** — extraction target, quoted above under `convertFilterValue`.

**4. Entity JSONB block, `:333-378`**:

```ts
        image: parseStoredImage(row.image as Json as unknown as StoredImage | null, supabaseUrl)
...
      nominations.push(nominationOut as AnyNominationVariantPublicData);
...
        const base = {
          id: entityId,
          name: entityObj.name as string | null | undefined,
          shortName: entityObj.shortName as string | null | undefined,
          info: entityObj.info as string | null | undefined,
          color: entityObj.color as Colors | null | undefined,
          order: entityObj.order as number | null | undefined,
          subtype: entityObj.subtype as string | null | undefined,
          customData: entityObj.customData as object | null | undefined,
          // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
          image: parseStoredImage(row.entity_image as Json as unknown as StoredImage | null, supabaseUrl),
          // reason: JSONB → LocalizedAnswers shape; structural guard applied inside parseAnswers.
          answers: parseAnswers(row.entity_answers as Json as unknown as LocalizedAnswers | null, locale)
        };
```

The comment at `:361-366` ("Building a variant-specific object below lets the discriminated
`AnyEntityVariantData` union resolve structurally — no union-suppressing cast") is the intent the zod
rewrite should preserve, not undo.

**5. Question assembly, `:499-527`** — the client-side work `get_questions` deletes:

```ts
  protected async _getQuestionData(options?: GetQuestionsOptions): Promise<DPDataType['questions']> {
    ...
    const { data: catData, error: catError } = await this.supabase
      .from('question_categories')
      .select('*')
      .order('sort_order');
    if (catError) throw new Error(`getQuestionData (categories): ${catError.message}`);

    let categories = (catData ?? []).map((row) => {
      const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
      return {
        ...obj,
        // QuestionCategoryData uses 'type' not 'categoryType'
        type: row.category_type ?? 'opinion',
        // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
        image: parseStoredImage(row.image as Json as unknown as StoredImage | null, supabaseUrl)
      } as QuestionCategoryData;
    });

    // Client-side filter by electionId if specified
    if (options?.electionId) {
      const filterElectionId = Array.isArray(options.electionId) ? options.electionId : [options.electionId];
      categories = categories.filter((cat) => {
        // reason: electionIds is a runtime-only field tacked on by toDataObject; not yet in QuestionCategoryData
        const catElectionIds =
          (cat as QuestionCategoryData & { electionIds?: Array<string> | null }).electionIds ?? null;
```

**Existing RPC call pattern to copy for `get_questions`** (`supabaseDataProvider.ts:257-260`):

```ts
    const calls = electionIds.flatMap((eid) =>
      constituencyIds.map((cid) =>
        this.supabase.rpc('get_nominations', {
```

---

### `.../dataWriter/supabaseDataWriter.ts` + `.../base/dataWriter.type.ts` (interface, CRUD) — MODIFY

**The shim, `supabaseDataWriter.ts:83-84`:**

```ts
  protected async _setPassword({ password }: { password: string; currentPassword: string; authToken: string }) {
    // currentPassword and authToken are WithAuth compatibility shims -- ignored by Supabase.
    // Supabase verifies the active session via cookies automatically.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
```

**The sibling that shows the shape after removal** — `_resetPassword` at `:75-81` already destructures
only what it uses and states the unused param in a comment:

```ts
  protected async _resetPassword({ password }: { password: string; code: string }) {
    // Called after recovery session is established via auth callback.
    // The `code` param is unused; Supabase uses the recovery session.
    const { error } = await this.supabase.auth.updateUser({ password });
```

**The ADMIN METHODS block, `:378-390`** (criterion 4's second sentence — the roadmap's `:381` is the
comment line, the block runs `:378-384`):

```ts
  ////////////////////////////////////////////////////////////////////
  // ADMIN METHODS
  // TODO: Primary access point is SupabaseAdminWriter. These
  // implementations satisfy the abstract contract on UniversalDataWriter.
  ////////////////////////////////////////////////////////////////////

  protected async _updateQuestion({ id, data: { customData } }: SetQuestionOptions): DWReturnType<DataApiActionResult> {
    ...
    const { error } = await this.supabase.rpc('merge_custom_data', {
```

(`merge_custom_data` here is one of the two call sites that must follow Phase 156's recorded rename.)

**The interface shape, `dataWriter.type.ts:151-159` and `:334-350`:**

```ts
  /**
   * Change a user’s password.
   * @param currentPassword - The current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  setPassword: (
    opts: WithAuth & { currentPassword: string; password: string }
  ) => DWReturnType<DataApiActionResult, TType>;
```

```ts
export type SetAnswersOptions = WithAuth & WithTargetEntity & WithAnswerData;

export type SetPropertiesOptions = WithAuth & WithTargetEntity & WithEditableEntityProps;

export type SetQuestionOptions = WithAuth & WithTargetId & { data: TemporarySetQuestionData };

export type GetCandidateUserDataOptions<TNominations extends boolean | undefined> = WithAuth & {
  loadNominations?: TNominations;
  locale?: string;
};

export type WithAuth = {
  /**
   * The JWT token for authentication.
   */
  authToken: string;
};
```

Deleting `WithAuth` therefore edits **four `Options` intersections** in the same block, not just the
type. The neighbouring `WithTargetId` / `WithTargetEntity` shapes show the surviving convention.

---

### `.planning/todos/pending/2026-08-28-*.md` (doc) — the D-N2 filing

**Analog:** `.planning/todos/pending/2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md`
(also the closest topical sibling — it is the *same* boundary problem, filed for Phase 158's territory).

**Frontmatter, verbatim shape** (`:1-21`):

```yaml
---
created: "2026-06-05T00:00:00.000Z"
title: Migrate Supabase-specific (auth) code from frontend routes into the Supabase adapters
priority: high
area: frontend
files:
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/hooks.server.ts  # safeGetSession
source: Surfaced during /gsd-verify-work 97 (admin nav auth-reactivity UAT). Operator-directed follow-up.
---
```

**Section shape:** `## Problem` (`:23`) → `## Solution` (`:54`, a numbered list of concrete moves) →
`## Context` (`:76`, discovery provenance + "Pairs with `<other-todo>.md>`" cross-links + a "Relevant
abstraction:" pointer). Filename convention: `YYYY-MM-DD-kebab-summary.md`.

For 157: file the "reintroduce the local adapter" comment against
`apps/frontend/src/lib/api/dataProvider.ts` (the file, **not** line 12 — the file is now one line).

---

### `157-NEGATIVE-CONTROL-LEDGER.md` (doc) — the D-F4 proof obligation

**Analog:** `.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-NEGATIVE-CONTROL-LEDGER.md:15-58`.
The header field set to reproduce, each as a `- **Field:**` bullet:

```markdown
- **Phase:** 143 (svelte-store-guard-app-wide-reach-fallout-triage)
- **Requirement:** **ASSERT-08 / ASSERT-09**
- **Opened by:** `143-01-PLAN.md` (wave 1). **Every row is created here, before the phase's first
  injection.**
- **Corpus:** exactly **19 rows** — 4 SC-1 injection pairs (**8 measured halves**), ...
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused via `142.1-01-PLAN.md` (D-02) ...
- **Baseline for OLD halves:** none inherited, none inheritable. ...
- **HEAD at ledger creation:** `289f80e8c` — branch `feat-gsd-roadmap`. ...
- **Machine:** developer Mac, host Node, runs issued from the repository root. macOS 26.5.1 arm64 /
  Darwin 25.5.0 / Node v24.14.1. ...
- **Resolved `$TMPDIR`:** ... Recorded for the same reason 139 and
  142.1 recorded theirs: **a log path that cannot be resolved later is not evidence.**
- **Restoration target (the blob hash):** `git hash-object apps/frontend/eslint.config.mjs` →
  **`f6cea0a65cdd8d7cd77d734a17929b35510fe796`**, measured at ledger creation ...
- **Post-change restoration target (the blob hash, ...):** ...
- **Pre-existing-warning baseline:** the frontend lint is **error-free but not warning-free**. ...
  Every clean run therefore reads **`0 errors (1 pre-existing warning)`**, and the `Errors` cell counts
  **errors**, never "problems".
- **Decisions discharged by this ledger:** ...
- **Precedent followed:** `142.1-NEGATIVE-CONTROL-LEDGER.md` is this ledger's template ...
```

Load-bearing conventions: **two** restoration blob hashes (pre-change and post-change) because the
config edit lands between the OLD and NEW halves; the pre-existing-warning baseline so a "clean" run has
a defined string; rows created **before** the first injection; and no borrowed observations — 157's
guard did not exist before this phase, so both halves must be measured here.

---

## Bulk Codemod Shapes (`logDebugError` → new symbol, ~53 files)

Not a per-file analog problem. Three call-site shapes cover the corpus:

**Shape 1 — a `.ts` context file, import + single-arg template-literal invocation**
(`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:8,333,438`):

```ts
import { logDebugError } from '$lib/utils/logger';
...
        logDebugError(`[candidateContext selectedElections] Error fetching election: ${e}`);
...
      logDebugError(`Error exchanging authorization code for ID token: ${e ?? '-'}`);
```

**Shape 2 — a `.svelte` component, import inside the `<script>` block**
(`apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte:31,73`):

```svelte
  import { logDebugError } from '$lib/utils/logger';
...
      logDebugError(`Error logging out: ${e?.message}`);
```

**Shape 3 — a route `+layout.server.ts` / `+page.server.ts`, including the TWO-ARGUMENT form**
(`apps/frontend/src/routes/candidate/(protected)/+layout.server.ts:14,48,96`):

```ts
import { logDebugError } from '$lib/utils/logger';
...
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`, e);
...
      .catch((e: Error) => logDebugError(`[Candidate App protected layout] Error logging out: ${e?.message ?? '-'}`));
```

**Other second-argument sites measured:** `lib/contexts/utils/persistedState.svelte.ts:157`
(`logDebugError(\`Failed to parse ${key} from ${type}\`, e)`) and
`lib/utils/matching/imputeParentAnswers.ts:138`.

**One non-string first argument** — `lib/contexts/app/tracking/trackingService.svelte.ts:197`:
`logDebugError({ name, data: dataToSend });`. The new signature must either accept an object body or
this site needs a hand edit; a purely mechanical rewrite breaks it.

**Codemod invariants:** the 47 import lines are half the diff; the `console.error(message, error)`
second argument must be serialised explicitly (`JSON.stringify(new Error('x'))` is `{}`, so a naive
structured emitter loses every stack trace); and the frontend needs **two** `configureLogger` calls
(client entry + `hooks.server.ts`) because module-scope state is per-module-graph.

---

## Shared Patterns

### Comment convention (binding on every new comment, D-N1)

**Source:** Phase 152's `lint:check` scan, specified at `152-CONTEXT.md:125-127`.
**Apply to:** every file this phase writes or edits.

> *"a comment line that ends without terminal punctuation **and** whose next line continues the same
> comment span at the same indent."*

Practically: one sentence per line ending in `.`, or a JSDoc block, or a single-line comment. No
`\uXXXX` escapes inside comments. No planning references (phase/plan numbers, `.planning/` paths) in new
code comments. `--` as a dash is **not** gated — the CONTEXT's restatement of this is wrong.

### `// reason:` acceptance comment on a surviving cast or lint suppression

**Source:** `supabaseDataProvider.ts:105,107,109,364,366,522` and `packages/app-shared/src/utils/mergeSettings.ts:37-40`.
**Apply to:** any cast or `any` this phase leaves in place.

```ts
/*
 * reason: the four `(target as any)[key]` writes below cannot be typed without `any`, and
 * `@ts-expect-error` is not an alternative here.
 */
```

### Catalog dependency syntax

**Source:** `packages/dev-seed/package.json:29`, `apps/frontend/package.json:78`,
`packages/app-shared/package.json:28-29`.
**Apply to:** the zod edge added to `packages/app-shared/package.json` `"dependencies"`.

Bare `"zod": "catalog:"` — no version. The catalog pin lives at `.yarnrc.yml:24` (`zod: ^4.3.6`).

### `func-style` declaration-only

**Source:** `packages/shared-config/eslint.config.mjs:87` —
`'func-style': ['error', 'declaration', { allowArrowFunctions: false }]`.
**Apply to:** every new exported helper (`getLocalized`, `convertFilterValue`, `configureLogger`,
the schema validators). Arrow-const exports fail lint.

### Two-edit rule for every SQL change

**Source:** `apps/supabase/README.md:16,23-27` (quoted in `157-RESEARCH.md:354-362`).
**Apply to:** `get_questions` and the `get_nominations` election-round extension.

Each SQL task produces a `migrations/0000N_*.sql` **and** the mirrored `schema/*.sql` edit, in the same
commit. `config.toml` sets `[db.migrations] schema_paths = []`, so `schema/` alone never reaches a
database — a `schema/`-only `get_questions` passes review and returns `PGRST202` at runtime.

### Build-order dependency on `packages/app-shared/dist/`

**Source:** `packages/app-shared/package.json:7,13-22` (`"build": "tsup && tsc --emitDeclarationOnly --outDir dist"`;
`exports` point at `./dist/index.js`).
**Apply to:** every wave after the app-shared wave. `yarn build` (turbo, cached) must run between the
app-shared foundation wave and any wave that imports from it, or consumers resolve nothing at runtime.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` (result-shape half) | test (pgTAP) | request-response | The 11 existing pgTAP files assert **security shape** (`prosecdef`), **RLS visibility** and **column grants**. None asserts an RPC's returned rows against expected filter semantics. `07-rpc-security.test.sql` supplies the plan/fixture/role boilerplate; the `results_eq` filter-correctness assertions have no in-repo precedent and should be written from pgTAP's own vocabulary. |

Partial-analog note: the **logger** has no structured-logging precedent in the tree at all
(`grep -c 'pino' yarn.lock` → 0). Its *module shape* copies `mergeSettings.ts`; its *behaviour* is
designed in `157-RESEARCH.md` § G.3-G.4 and is Claude's-discretion per the CONTEXT.

---

## Metadata

**Analog search scope:** `packages/app-shared/`, `packages/dev-seed/`, `packages/shared-config/`,
`apps/frontend/src/lib/api/`, `apps/frontend/src/lib/_guards/`, `apps/frontend/eslint.config.mjs`,
`apps/supabase/supabase/{schema,migrations,tests/database}/`, `scripts/`, root `package.json`,
`.planning/todos/pending/`, `.planning/phases/143-*/`.
**Files read this session:** 27 (all excerpts above are quoted from files read in this session).
**Pattern extraction date:** 2026-08-28
