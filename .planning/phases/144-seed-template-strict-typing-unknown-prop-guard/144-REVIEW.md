---
phase: 144-seed-template-strict-typing-unknown-prop-guard
reviewed: 2026-08-23T20:55:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - .github/workflows/main.yaml
  - package.json
  - packages/dev-seed/src/assertKnownRowProps.ts
  - packages/dev-seed/src/cli/resolve-template.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/pipeline.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/template/collectionNames.ts
  - packages/dev-seed/src/template/index.ts
  - packages/dev-seed/src/template/linkSentinels.ts
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/template/schema.ts
  - packages/dev-seed/src/template/types.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/shared.ts
  - packages/dev-seed/src/writer.ts
  - packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts
  - packages/dev-seed/tests/assertKnownRowProps.test.ts
  - packages/dev-seed/tests/cli/resolve-template.test.ts
  - packages/dev-seed/tests/determinism.test.ts
  - packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-answers.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts
  - packages/dev-seed/tests/integration/default-template.integration.test.ts
  - packages/dev-seed/tests/latent/latentEmitter.test.ts
  - packages/dev-seed/tests/template.test.ts
  - packages/dev-seed/tests/template/latent.schema.test.ts
  - packages/dev-seed/tests/template/linkSentinels.test.ts
  - packages/dev-seed/tests/template/permittedKeys.test.ts
  - packages/dev-seed/tests/template/strictRowTypes.type-test.ts
  - packages/dev-seed/tests/templates/nominations-override.test.ts
  - packages/dev-seed/tests/writer.test.ts
  - packages/dev-seed/tsconfig.json
findings:
  critical: 1
  warning: 8
  info: 0
  total: 9
status: issues_found
---

# Phase 144: Code Review Report

**Reviewed:** 2026-08-23T20:55:00Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Three enforcement layers were added against unknown props in dev-seed templates, plus a
const-driven rewrite of `linkJoinTables`. The false-positive question posed in the phase
brief checks out: I ran `yarn workspace @openvaa/dev-seed test:unit` (525/525 green,
including the 30-template must-NOT-fire control) and `yarn workspace @openvaa/dev-seed
typecheck` (clean). The `planLinks` rewrite preserves the pre-`144-03` dispatch order,
the two documented skips, the `??`-precedence chain and the three verbatim lookup
messages — I diffed it against `829ccf979` line by line and found no behavioural
divergence for well-formed input.

What the layers do **not** do is agree with each other. Four of the nine findings below
are the same defect class: a key that one layer treats as legal and another treats as
fatal, or vice versa. The headline is CR-01 — the D-09 deny-list, the layer that exists
specifically because an allow-list cannot catch a real-column-that-the-RPC-discards, is
bypassed by that column's own camelCase spelling, which the codebase's own
`resolveFieldName` converts straight back to the denied form. I measured this against the
shipped guard, not from reading.

The second cluster is the mid-phase permission split (`NON_COLUMN_FIELD_READERS`): it was
applied to the runtime arm of the derivation and not to the type arm, so
`QuestionsFixedRow` still admits `answersByExternalId` (WR-01, measured with `tsc`), and
the snake-case spelling `answers_by_external_id` that `importAnswers` explicitly reads is
on neither side of the split (WR-02, measured against the guard). The "stripped
everywhere vs legal only where read" idea is coherent; its implementation reaches one of
the two consumers.

Everything else is smaller: an unsafe cast that re-opens the exhaustiveness hole the
rewrite claims to have closed (WR-04), a CI step whose stated purpose is falsified by its
own position in the job (WR-03), and three robustness gaps in the new canonical
primitives.

I did not re-report the `runTeardown`-only-in-`beforeAll` hazard, per the brief.

## Critical Issues

### CR-01: The `entity_type` deny-list is bypassed by its own camelCase form, `entityType`

**File:** `packages/dev-seed/src/template/permittedKeys.ts:604-610` (declaration),
`packages/dev-seed/src/template/permittedKeys.ts:666-676` (derivation),
`packages/dev-seed/src/assertKnownRowProps.ts:120-125` (check order)

**Issue:** `derivePermittedKeys` adds, for every DB column, *every camel form
`FIELD_MAP` resolves to it* (lines 673-676 via `camelFormsFor`). `COLUMN_MAP` contains
`entity_type: 'entityType'`, so `entityType` lands in the PERMITTED set for `questions`,
`question_categories` and `nominations`. `DENIED_BY_TABLE` lists only the snake form, and
`deniedKeys()` is a plain lookup of that literal, so `denied.has('entityType')` is
`false` and the allow-list waves the row through at `assertKnownRowProps.ts:124`.

Measured against the shipped guard on this HEAD:

```
THROW: questions.entity_type (snake) :: assertKnownRowProps: property 'entity_type' … is a real column, but the bulk_import RPC discards it
PASS (no throw): questions.entityType (camel)
PASS (no throw): nominations.entityType (camel)
permittedKeys('questions').has('entityType') === true
[...deniedKeys('questions')] === ['entity_type']
```

The consequence is not a cosmetic gap. `bulkImport` (`supabaseAdminClient.ts:170`) runs
`resolveFieldName('entityType')` → `'entity_type'` and ships it to the RPC, whose
`skip_columns` array discards it. The author gets exit 0 and a row that lacks what they
asked for — verbatim the failure mode `DENIED_BY_TABLE`'s own docblock
(`permittedKeys.ts:586-591`) says the deny-list exists to eliminate. The negative-control
fixture `tests/fixtures/negctl-questions-entity-type.ts:78` uses only the snake spelling,
so the control is structurally unable to detect this, and no spec in
`tests/assertKnownRowProps.test.ts` or `tests/template/permittedKeys.test.ts` exercises
the camel form.

There is no in-tree row exploiting it today (`grep -rn entityType packages/dev-seed/src`
returns only doc comments), so this is a hole rather than an active regression — but it
is a hole in the one layer the phase added specifically to close it.

**Fix:** derive the denied set the same mechanical way the permitted set is derived,
rather than as a literal list — one declaration, both spellings:

```ts
// permittedKeys.ts, beside derivePermittedKeys
function deriveDeniedKeys(table: keyof typeof DENIED_BY_TABLE): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const column of DENIED_BY_TABLE[table]) {
    keys.add(column);
    for (const camel of camelFormsFor(column)) keys.add(camel);
  }
  return new PermittedKeySet([...keys].sort());
}

const DENIED_KEYS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  (Object.keys(DENIED_BY_TABLE) as Array<keyof typeof DENIED_BY_TABLE>).map((table) => [
    table,
    deriveDeniedKeys(table)
  ])
);
```

and add the camel arm to the spec at `tests/assertKnownRowProps.test.ts:249`:

```ts
expect(() => assertKnownRowProps({ questions: [{ external_id: 'q1', entityType: 'candidate' }] }))
  .toThrow(/skip_columns/);
```

Then update `tests/fixtures/negctl-questions-entity-type.ts` (or add a fourth fixture) so
the ledger's DENY control covers both spellings.

## Warnings

### WR-01: The type layer and the runtime layer disagree on `answersByExternalId`'s scope

**File:** `packages/dev-seed/src/template/permittedKeys.ts:801-805` (`NonColumnKeysFor`)
vs `packages/dev-seed/src/template/permittedKeys.ts:688-691` (`derivePermittedKeys`)

**Issue:** The mid-phase permission split (`NON_COLUMN_FIELD_READERS`,
`permittedKeys.ts:466-468`) gates `answersByExternalId` to `candidates` and
`organizations` in the RUNTIME arm — `readers.includes(collection)` at line 690. The TYPE
arm was not updated: `NonColumnKeysFor<TCollection>` unions
`(typeof NON_COLUMN_FIELD_LIST)[number]` **unconditionally**, for every collection.

Measured with `tsc --noEmit --strict`:

```ts
export const q: QuestionsFixedRow = { external_id: 'q1', answersByExternalId: { c1: 1 } }; // compiles
export const e: ElectionsFixedRow = { external_id: 'e1', answersByExternalId: { x: 1 } };  // compiles
```

Both are rejected at seed time by `assertKnownRowProps`. So the author gets a clean
compile followed by a hard seed failure — and the file header's central claim, "one
source of truth for TWO enforcement layers" (`permittedKeys.ts:1-9`), is not true for
this source. This also weakens the D-08 class-(2) negative control's story: the control
fires at runtime but the type layer, which the phase says is the authoring-time half of
the same declaration, is silent.

**Fix:** derive the type arm from the readers map, exactly as the runtime arm does:

```ts
/** Non-column keys admitted on `TCollection` — global-but-reader-scoped, plus per-collection. */
type NonColumnKeysFor<TCollection extends CollectionKey> =
  | {
      [F in (typeof NON_COLUMN_FIELD_LIST)[number]]: TCollection extends
        (typeof NON_COLUMN_FIELD_READERS)[F][number]
        ? F
        : never;
    }[(typeof NON_COLUMN_FIELD_LIST)[number]]
  | (TCollection extends keyof typeof COLLECTION_NON_COLUMN_LIST
      ? (typeof COLLECTION_NON_COLUMN_LIST)[TCollection][number]
      : never);
```

Add a compile-time counterpart to `tests/template/strictRowTypes.type-test.ts` with a
`@ts-expect-error` on `answersByExternalId` in a `QuestionsFixedRow` literal, so the two
layers cannot drift apart again.

### WR-02: `importAnswers` reads `answers_by_external_id`, a spelling Pass 0 now rejects

**File:** `packages/dev-seed/src/supabaseAdminClient.ts:252` and `:286`

**Issue:** Both read sites are `row.answersByExternalId ?? row.answers_by_external_id`.
The snake spelling is not a column, is absent from `COLUMN_MAP`/`PROPERTY_MAP` (verified
in `packages/supabase-types/src/column-map.ts`), and is absent from
`NON_COLUMN_FIELD_LIST` (`permittedKeys.ts:440`). Measured:

```
THROW: candidates.answers_by_external_id (snake) :: assertKnownRowProps: unknown property
       'answers_by_external_id' on collection 'candidates' …
```

Since Pass 0 runs before Pass 1 (`writer.ts:181`), the `?? row.answers_by_external_id`
branch is now unreachable through `Writer.write`. It is either dead code or a
false-positive in the guard, and the phase's own "stripped everywhere vs legal only where
read" framing has no answer for it: the key IS read, but it is on neither the strip list
nor the readers map. (Note that `bulkImport`'s strip set carries only the camel form
too, so pre-144 this spelling was forwarded to the RPC as a nonexistent column — the
inconsistency predates the phase, but the phase is what made it load-bearing.)

**Fix:** pick one. Either delete the fallback at both sites:

```ts
const answersByExtId = row.answersByExternalId as Record<string, unknown> | undefined;
```

or admit the spelling on both sides of the declaration:

```ts
const NON_COLUMN_FIELD_LIST = ['answersByExternalId', 'answers_by_external_id'] as const;
const NON_COLUMN_FIELD_READERS = {
  answersByExternalId: ['candidates', 'organizations'],
  answers_by_external_id: ['candidates', 'organizations']
} as const satisfies Record<(typeof NON_COLUMN_FIELD_LIST)[number], ReadonlyArray<CollectionKey>>;
```

### WR-03: The new named CI type-check step can never be the step that surfaces a type failure

**File:** `.github/workflows/main.yaml:66-81`, `package.json:33-34`

**Issue:** The block comment states the step exists so "a type failure [does not] surface
as 'ESlint check' instead". But this phase also appended `&& yarn typecheck` to
`lint:check` (`package.json:33`), and the `Run ESlint check on frontend` step
(`main.yaml:66-67`) runs *before* the new step (`main.yaml:79-80`). GitHub Actions aborts
a job at the first non-zero step, so a type error always fails inside `yarn lint:check`
and the named step never executes. The step can only ever run when typecheck has already
passed — it is unreachable as a diagnostic signal, which is the exact outcome the comment
says it prevents.

**Fix:** move the named step above `yarn lint:check`, and drop the redundant chain link so
the ordering is unambiguous:

```yaml
      - name: "Type-check all packages (turbo run typecheck)"
        run: yarn typecheck

      - name: "Run ESlint check on frontend"
        run: yarn lint:check
```

```jsonc
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests",
```

If the chained call is kept deliberately for local DX, the comment must be corrected: the
step is redundant, not legibility-providing.

### WR-04: `entry.collection` is cast in both link arms, re-opening the exhaustiveness hole the rewrite claims to close

**File:** `packages/dev-seed/src/supabaseAdminClient.ts:427-434` and `:455-461`

**Issue:** `linkJoinTables`' docblock (`:362-376`) says "adding a pair to the const cannot
leave it unresolved" and "a new `LinkTarget.kind` is a COMPILE error here". The `never`
arm at `:392` does cover `target.kind` — but the *collection* is laundered through two
`as` casts:

```ts
const parentId = await this.resolveExternalId(
  entry.collection as 'elections' | 'constituency_groups',   // :432
  entry.parentExternalId
);
...
.from(entry.collection as 'question_categories' | 'questions')  // :461
```

`LinkSentinelRule.collections` is `ReadonlyArray<CollectionKey>` (`linkSentinels.ts:96`),
so a new rule such as `{ collections: ['organizations'], keys: ['_foo'], refTable:
'elections', target: { kind: 'join', … } }` satisfies the `as const satisfies` assertion
and compiles clean. At runtime `resolveExternalId('organizations', …)` reaches
`LINK_LOOKUP_ERRORS[table](externalId, error.message)` at `:417` with `table` unmapped,
producing `TypeError: LINK_LOOKUP_ERRORS[table] is not a function` — which *masks* the
real lookup failure instead of reporting it with the greppable message the const at
`:80-87` exists to preserve. `tests/template/linkSentinels.test.ts` exercises only
`planLinks`, so nothing catches this.

**Fix:** carry the parent table on the target so the cast disappears and the compiler
checks the pairing:

```ts
// linkSentinels.ts
| {
    readonly kind: 'join';
    readonly table: 'election_constituency_groups' | 'constituency_group_constituencies';
    readonly parentTable: 'elections' | 'constituency_groups';
    ...
  }
| { readonly kind: 'jsonb'; readonly parentTable: 'question_categories' | 'questions'; readonly column: … };
```

then use `target.parentTable` at `:432` and `:461`. Adding a rule with a mismatched
collection then fails `as const satisfies ReadonlyArray<LinkSentinelRule>` at the
declaration, which is where the phase says such errors belong.

### WR-05: `resolveCollectionName` inherits `Object.prototype` keys and can return a non-string

**File:** `packages/dev-seed/src/template/collectionNames.ts:33-48`

**Issue:** `COLLECTION_MAP` is a plain object literal, so the `??` lookup at line 47 also
sees inherited members. `resolveCollectionName('constructor')` returns the `Object`
constructor and `resolveCollectionName('toString')` returns `Object.prototype.toString` —
functions, not the declared `string`. This primitive is now the canonical keying step for
the guard (`assertKnownRowProps.ts:109`, `permittedKeys.ts:729`, `deniedKeys` at `:761`)
and for `bulkImport`'s payload construction (`supabaseAdminClient.ts:155`), and the
`collection` argument at every one of those sites is template-controlled data.

Today the failure is loud (`permittedKeys` throws), but the message interpolates a
function's source into `resolved to table "..."`, and on the `bulkImport` path
`cleaned[tableName]` would be keyed by a stringified function. A module documented as
"the ONE implementation" of the canonical primitive should not have a lookup that can
return the wrong type.

**Fix:**

```ts
export function resolveCollectionName(collection: string): string {
  return Object.hasOwn(COLLECTION_MAP, collection) ? COLLECTION_MAP[collection] : collection;
}
```

The same pattern applies to `resolveFieldName` (`supabaseAdminClient.ts:67-69`), which
reads `FIELD_MAP[field] ?? field` over an equally prototype-bearing literal.

### WR-06: `resolveTemplate`'s built-in lookup accepts inherited keys, producing a misleading error

**File:** `packages/dev-seed/src/cli/resolve-template.ts:62-75`

**Issue:** `const builtIn = builtIns[arg];` followed by `if (!builtIn)`. For
`--template toString`, `builtIns['toString']` is `Object.prototype.toString` — truthy — so
the "Unknown template: 'toString'. Built-in templates: …" branch is skipped and the value
is handed to `validateTemplate`, which this phase newly wired in at line 75. The operator
gets `Template validation failed: template.: Invalid input` instead of the actionable
"Unknown template" message with the built-in list. The check itself predates the phase,
but the consequence changed here: previously the function returned the function object
silently; now it produces a confusing validation error.

**Fix:**

```ts
const builtIn = Object.hasOwn(builtIns, arg) ? builtIns[arg] : undefined;
```

### WR-07: `PermittedKeySet`'s advertised immutability is bypassable, and the file demonstrates how

**File:** `packages/dev-seed/src/template/permittedKeys.ts:638-663`

**Issue:** The docblock says the set "refuses to be widened after construction" because a
caller mutating it "would silently widen the guard for the whole process". `Object.freeze`
at line 649 does not protect a `Set`'s internal `[[SetData]]` slot — only its own
properties. `Set.prototype.add.call(permittedKeys('elections'), 'smuggled')` widens the
memoized, process-wide set. The constructor at line 648 uses precisely that escape hatch
to populate itself, so the technique is spelled out three lines above the guarantee. The
spec at `tests/template/permittedKeys.test.ts:294` only exercises the overridden `.add()`.

Low exploitability (a local dev tool, same trust model as `tsx`), but the code delivers
less than the comment promises, and the comment is what a future reader will trust.

**Fix:** either weaken the claim to what is true ("mutating members throw; the class does
not defend against `Set.prototype.*.call`"), or stop returning a `Set` at all and expose a
frozen facade whose `has` closes over a private set:

```ts
function freezeKeySet(values: Iterable<string>): ReadonlySet<string> {
  const inner = new Set(values);
  return Object.freeze({
    has: (k: string) => inner.has(k),
    get size() { return inner.size; },
    [Symbol.iterator]: () => inner[Symbol.iterator](),
    keys: () => inner.keys(), values: () => inner.values(), entries: () => inner.entries(),
    forEach: (f: Parameters<Set<string>['forEach']>[0]) => inner.forEach(f)
  }) as ReadonlySet<string>;
}
```

### WR-08: `externalId` is a permitted authoring key, but every generator reads only `external_id` — the guard waves through a spelling that produces `seed_undefined`

**File:** `packages/dev-seed/src/template/permittedKeys.ts:520` (`AUTHORING_KEYS`) vs
`packages/dev-seed/src/template/schema.ts:200-206` and the eleven generator sites

**Issue:** Three layers disagree about the camelCase id spelling:

- `FixedRow<C>` requires `external_id: string` (`permittedKeys.ts:824-825`) → an inline
  literal with only `externalId` is a type error. Correct.
- `assertFixedRowsCarryExternalId` reads only `row.external_id`
  (`schema.ts:201`) → `validateTemplate` throws `Expected a non-empty string`. Correct.
- `assertKnownRowProps` PERMITS `externalId` on every collection
  (`AUTHORING_KEYS = ['external_id', 'externalId']`) and even uses it as the row label
  (`assertKnownRowProps.ts:60`). Incorrect for a `fixed[]` row.

Every generator emits ``external_id: `${externalIdPrefix}${fx.external_id}` ``
(`ElectionsGenerator.ts:45`, `CandidatesGenerator.ts:85`, and nine more — all read
`fx.external_id` only). A `fixed[]` row spelled `externalId` therefore emits
`external_id: 'seed_undefined'`, and the row also carries the surviving `externalId` key
from the `{...fx}` spread. Pass 0 permits both keys, so the corrupted id reaches the
database.

This matters most on the path that has no zod layer: `tests/tests/setup/shared/
setupFromTemplate.ts:204-207` calls `runPipeline` → `writer.write` **without**
`validateTemplate`, so for the E2E templates the runtime guard is the only check, and it
is the one layer that lets this through.

**Fix:** narrow the authoring key to what the pipeline actually reads —

```ts
/** `externalId` is NOT admitted on a fixed[] row: every generator reads `fx.external_id`
 *  only, so the camel form silently produces `${prefix}undefined`. It remains accepted as
 *  a ROW LABEL in messages (see assertKnownRowProps.describeRow) because generator-emitted
 *  rows downstream of bulkImport may carry it. */
const AUTHORING_KEYS = ['external_id'] as const;
```

and, if `externalId` must stay legal for compatibility, teach the generators
`fx.external_id ?? fx.externalId` so all three layers describe the same contract.

---

_Reviewed: 2026-08-23T20:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
