# Phase 145: Default Seed Template Repair - Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 8 (1 new doc, 6 modified source/test, 1 modified CI workflow)
**Analogs found:** 8 / 8

All analogs are **in-repo and mostly in the same file** as the change. This phase is a repair, not a
greenfield build: for six of the eight targets the analog is a sibling function or a sibling literal
in the file being edited. The planner should treat "copy the sibling" as the default and flag any
plan that invents a new shape.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/tests/integration/default-template.integration.test.ts` (+`makeAnonClient`, +2nd `it`) | test (live-DB integration) | request-response over PostgREST | **same file** — `makeReadClient()` at `:122-130` + the existing `it` at `:200` | exact |
| `packages/dev-seed/tests/templates/default.test.ts` (+`Test 28`) | test (pure I/O) | transform / in-memory assertion | **same file** — `Test 6` at `:93-99`, `Test 8` at `:112-119` | exact |
| `packages/dev-seed/src/templates/defaults/candidates-override.ts` (+`terms_of_use_accepted`) | data producer (override fn) | transform (row emission) | `packages/dev-seed/src/templates/e2e/base.ts:1030-1095` candidate row literals | exact (cross-template, same column) |
| `packages/dev-seed/src/templates/default.ts` (13 `external_id` literals) | config / template declaration | static data | `packages/dev-seed/src/generators/ConstituenciesGenerator.ts:65`, `OrganizationsGenerator.ts:47` (canonical typecodes) | exact |
| `packages/dev-seed/src/templates/defaults/alliances-override.ts` (`ALLIANCE_MEMBERSHIP` + docstrings) | data producer (override fn) | transform | **same file** — the existing map + docstring shape at `:30-50` | exact |
| `packages/dev-seed/src/supabaseAdminClient.ts:171-187` (comment only) | utility (write path) | batch write | **same file** — the `LINK_SENTINELS`/`COLLECTION_NON_COLUMN_LIST` caveat comment at `:165-170` (a comment that names an exception to a general rule) | exact |
| `.github/workflows/main.yaml` (export `ANON_KEY`) | config (CI) | env wiring | **same file** — `Export Supabase connection env` step at `:205-215` | exact |
| `.planning/phases/145-.../145-NEGATIVE-CONTROL-LEDGER.md` (new) | doc (evidence ledger) | batch record | `.planning/phases/144-.../144-NEGATIVE-CONTROL-LEDGER.md:1-50` | exact |

---

## Pattern Assignments

### `tests/integration/default-template.integration.test.ts` (test, request-response)

**Analog:** the same file's own service-role client and skip-guard. Three patterns to copy.

**1. Client-factory pattern** (`:122-130`) — the anon client is this function with a different env var
and a different fallback literal. Do **not** route anon work through `SupabaseAdminClient` (Pitfall 3:
the operation budget at `:283-284` would reject it).

```ts
function makeReadClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
```

Anon fallback literal (measured from `supabase status -o env`, RESEARCH § Code Examples 1):
`...eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`.
The env-var-with-literal-fallback idiom also appears at `src/supabaseAdminClient.ts:48-50` — it is
established, not a shortcut. **Do not attempt `.env` / `.env.example`** (write-denied, `STATE.md:902`).

**2. Guard-of-the-guard pattern** (`:107-115`) — a test that could pass vacuously carries an assertion
that turns the wiring loss red:

```ts
if (process.env.DEV_SEED_INTEGRATION_REQUIRED === '1' && !hasSupabase) {
  throw new Error(
    'DEV_SEED_INTEGRATION_REQUIRED=1 but SUPABASE_URL is unset. This file carries the ' +
      'NF-01 operation budget and is required to EXECUTE in the `dev-seed-integration` CI job; ...'
  );
}
```

New instance required: the `accounts` role differential (anon → 0 rows, service_role → 1 row; R-5),
asserted **inside** the new `it` before the nomination counts. Zero dependencies; survives the newer
`sb_publishable_…` key formats where a JWT parse would not.

**3. Block-placement + timeout pattern** — the existing suite shape:

```ts
describe.skipIf(!hasSupabase)('default template integration (DX-03)', () => {
  let adminClient: SupabaseAdminClient;
  let readClient: SupabaseClient;
  beforeAll(async () => { ... await runTeardown('seed_', adminClient, readClient); }, 300_000);
  afterEach(() => { vi.restoreAllMocks(); });
  it('applies default template and meets the NF-01 operation budget + assertions', async () => { ... });
});
```

The anon assertion is a **second `it` inside this same `describe`**, after the seeding one, with the
same `300_000` timeout. A new file is an anti-pattern (vitest parallelises across files → race →
intermittent `candidate: 0` that reads exactly like the defect).

---

### `tests/templates/default.test.ts` (test, pure I/O)

**Analog:** `Test 6` / `Test 8` in the same file. Copy the ctx-construction + row-loop shape verbatim.

```ts
  it('Test 6: external_id starts with prefix + "cand_"', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      expect((row as { external_id: string }).external_id).toMatch(/^seed_cand_\d{4}$/);
    }
  });
```

The new `Test 28` asserts every emitted row carries `terms_of_use_accepted`. Note the file's contract
docstring at `:1-9`: **"pure I/O. No Supabase imports, no `createClient`, no `.rpc`."** — the new test
must honour it. Also note `:29`/`:33` use *local fakes* (`seed_party_${i}`, `seed_cat_${i}`), not
references to `default.ts`, so the D-05 rename does not touch them; `:97`/`:112` couple to `cand_`,
which is **not** renamed.

**Determinism constraint** — `Test 9` (`:117-123`) is why the timestamp must be a literal:

```ts
    expect(JSON.stringify(rowsA)).toEqual(JSON.stringify(rowsB));
```

---

### `src/templates/defaults/candidates-override.ts` (data producer, transform)

**Analog for the row shape:** its own row literal at `:136-145`; **analog for the new key:**
`e2e/base.ts:1030-1095`, which sets the exact literal on every visible candidate and deliberately
omits it on two.

Insert point — the emitted row object (`:136-145`):

```ts
    const row: Record<string, unknown> = {
      external_id: `${ctx.externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
      project_id: ctx.projectId,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      sort_order: i,
      is_generated: true,
      organization: partyByIndex[i]
    };
```

Known-good analog (`e2e/base.ts:1035-1039` and its negative control at `:1076`):

```ts
        external_id: 'test-e2e-base-ca-aa-special',
        first_name: 'Special',
        last_name: 'Candidate AA',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
```
```ts
        external_id: 'test-e2e-base-ca-aa-hidden',
        // terms_of_use_accepted DELIBERATELY absent (refactor-doc:72)
```

**Do not "fix" the two omissions** — they are a live in-repo negative control (D-03 rejected option B).

**Typing note (Pitfall 4):** the override returns `Array<Record<string, unknown>>` (`src/types.ts:46-48`),
so Phase 144's `CandidatesFixedRow` does **not** apply here. Protection is the runtime
`assertKnownRowProps` at `src/writer.ts:181`, keyed off `permittedKeys.ts:296` where
`terms_of_use_accepted` is already permitted. **No `permittedKeys` edit** (D-10).

---

### `src/templates/default.ts` (config, static data)

**Analog:** the generators define the canonical typecode per collection —
`ConstituenciesGenerator.ts:65` → `con_NN`, `OrganizationsGenerator.ts:47` → `org_NN`. Only these two
collections diverge (RESEARCH C-1). Current shape to edit (`:73-81`, and `:92-148` for orgs):

```ts
    fixed: [
      { external_id: 'c_01', name: { en: 'Uudenmaa North' }, sort_order: 0, is_generated: false },
      ...
      { external_id: 'c_05', name: { en: 'Pirkanmaa' }, sort_order: 4, is_generated: false }
    ]
```

Rename to `con_01`…`con_05`; `party_blue`…`party_values` → `org_blue`…`org_values`. Scheme:
`<typecode>_<discriminator>`, **snake_case** (documented deliberate divergence from `e2e/base`'s
kebab + two-letter codes — `default.ts`'s own generated ids are snake). 13 literals here + the
`ALLIANCE_MEMBERSHIP` map; everything else that mentions the old names is a docstring.

---

### `src/templates/defaults/alliances-override.ts` (data producer, transform)

**Analog:** its own map + docstring at `:30-50` — the docstring enumerates the member party ids beside
the map, so a rename that touches one and not the other is immediately wrong on the page:

```ts
/**
 *   Alliance L: SDU, RF, GW (party_social, party_red, party_green) — Left bloc.
 *   Alliance R: BC, VC, RA (party_blue, party_values, party_rural) — Right bloc.
 */
export const ALLIANCE_MEMBERSHIP: Record<'alliance_L' | 'alliance_R', ReadonlyArray<string>> = {
  alliance_L: ['party_social', 'party_red', 'party_green'],
  alliance_R: ['party_blue', 'party_values', 'party_rural']
} as const;
```

Nomination `external_id`s are **derived** (`nominations-override.ts:156`, `alliances-override.ts:113`),
so they follow the rename automatically — no separate edit.

---

### `src/supabaseAdminClient.ts:171-187` (utility, comment-only)

**Analog:** the caveat comment immediately above it at `:165-170`, which is exactly the genre needed —
a comment naming an exception to a general rule and pointing at the authority:

```ts
    // ⚠ `elections.constituencyGroups` / `.constituency_groups` and
    // `constituency_groups.constituencies` are stripped here, but `LINK_SENTINELS`
    // is the authority for whether they are PERMITTED. See the note on
    // `COLLECTION_NON_COLUMN_LIST` in `./template/permittedKeys`.
```

The block to correct (its parenthetical is true for `organizations`, false for `candidates`):

```ts
    // Tables with a `published boolean NOT NULL DEFAULT false` column gated by
    // anon RLS (`USING (published = true)`). Seeded rows must be visible to the
    // frontend's anon client, so default `published` to `true` when the record
    // doesn't already set it. ...
    const PUBLISHABLE_TABLES = new Set([ ... 'candidates', ... ]);
```

**Zero behavioural bytes.** Do **not** extend the auto-default to stamp `terms_of_use_accepted`
(D-03, explicitly rejected). The explicit-value honouring at `:227-229`
(`if (isPublishable && !('published' in stripped))`) is what makes the pair-2 negative control work.

---

### `.github/workflows/main.yaml` (config, env wiring)

**Analog:** the `Export Supabase connection env` step at `:205-215` — copy the grep/cut/`test -n` shape
exactly, adding a third variable:

```yaml
          STATUS="$(supabase status -o env)"
          API_URL="$(printf '%s\n' "$STATUS" | grep '^API_URL=' | cut -d= -f2- | tr -d '"')"
          SERVICE_ROLE_KEY="$(printf '%s\n' "$STATUS" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')"
          test -n "$API_URL" || { echo "::error::API_URL missing from supabase status"; exit 1; }
          ...
          echo "SUPABASE_URL=$API_URL" >> "$GITHUB_ENV"
```

The `test -n` guard is load-bearing (Pitfall 8): without it a CLI change silently yields an empty
`SUPABASE_ANON_KEY`, the test falls back to a literal wrong for the runner, and the build goes red for
the wrong reason. The step's existing comment already states this rationale — extend it, don't replace.

---

### `145-NEGATIVE-CONTROL-LEDGER.md` (doc, batch record)

**Analog:** `144-NEGATIVE-CONTROL-LEDGER.md:1-50`. Copy the front-matter field set verbatim, changing
values only: phase, requirements (TMPL-03/TMPL-04), opening plan, **asserted corpus size in its own
§ Completeness table**, protocol source, run date, HEAD per half, machine, resolved `$TMPDIR`, and the
`git hash-object` **restoration blob-hash table**:

```markdown
### Restoration blob hashes — the pre-change state of every file this phase edits

| Path | `git hash-object` at ledger creation |
|---|---|
| `packages/dev-seed/src/supabaseAdminClient.ts` | `0fe5fe45c3b7493429a0d48b814792f8ff724d27` |
```

Blob table must cover the seven paths listed at RESEARCH § Pattern 3. Copy 144's stance language too:
a row whose run did not execute keeps placeholder cells and carries **no** outcome.

---

## Shared Patterns

### Ledger-first plan ordering (inherited, mandatory)
**Source:** `144-01-PLAN.md` / `143-01-PLAN.md`
**Apply to:** the whole plan sequence.
Plan 01 writes **zero product bytes** and captures pair-1's RED half before the fix commit exists.
Overrides tracer-first per `.planning/REQUIREMENTS.md:7-13`.

### Injection-and-restore for RED halves
**Source:** `.planning/REQUIREMENTS.md:57` (144's protocol)
**Apply to:** pair-2 (and any re-run of pair-1).
Injection is **byte-identical** to the blind half's real state; every iteration post-gated with
`git checkout --`, a `git hash-object` comparison against the ledger's restoration table, and a clean
`git status`. Pair-2's injection: add `published: false` alongside `terms_of_use_accepted` in
`candidatesOverride`'s row literal, re-seed, observe RED, restore.

### Role-differential assertion
**Source:** this phase's new `it` + the R-5 `accounts` control
**Apply to:** the new integration assertion, and cite as the template for any future "the app can see X"
test. Service-role reads bypass RLS and are structurally blind (M-11) — that is why the defect survived
~11 weeks green.

### Record correction as its own task
**Source:** `143-CONTEXT.md` D-01, `144-DISCUSSION-POINTS.md` D-01
**Apply to:** ROADMAP criterion 1, `REQUIREMENTS.md:70` (TMPL-03), the originating todo, and the
`PUBLISHABLE_TABLES` comment. Lands **after** the gates, in its own plan, with the disproof cited
(`49a23512e`, M-2, M-12, C-1).

### Forbidden command shapes
**Source:** `.planning/REQUIREMENTS.md:57`
**Apply to:** every gate command in every plan. No `yarn <script> --force` (yarn appends past the `&&`
chain → silent no-op). Use `TURBO_FORCE=true yarn lint:check`. Do not copy `package.json:19`'s shape.

### Hard-coding bans
**Apply to:** the new guard and any diagnostic.
No UUID literals (`gen_random_uuid()` default, `101-elections.sql:49`) — use the no-arg
`get_nominations()` form. No `external_id` literals in the new guard (the rename lands in the same
phase) — derive from `defaultTemplate.constituencies.fixed[…].external_id` if a scoped lookup is
needed. No computed timestamp — use `'2025-01-01T00:00:00.000Z'`.

---

## No Analog Found

None. Every file in scope has an in-repo analog, and for six of eight the analog is a sibling in the
same file.

The nearest thing to a genuinely new artefact is the **anon client + its role control**, and even
those are `makeReadClient` with a different key plus the R-5 `accounts` differential — both measured
in-repo. RESEARCH § Don't Hand-Roll is explicit: "almost everything this phase could 'build' already
exists one file away."

---

## Metadata

**Analog search scope:** `packages/dev-seed/{src,tests}`, `apps/supabase/supabase/migrations`,
`apps/frontend/src/lib/contexts/voter`, `.github/workflows`, `.planning/phases/144-*`
**Files scanned:** 12 read; ~40 enumerated via the RESEARCH measurement tables
**Pattern extraction date:** 2026-08-24
