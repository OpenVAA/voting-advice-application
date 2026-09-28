# Phase 126: svelte-check → 0 — supabaseDataProvider - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 4 modified (+ 1 regenerated)
**Analogs found:** 4 / 4 (all analogs are in-file or same-directory — this is a type-hardening phase, not new-file creation)

> **Phase shape note:** This is a TypeScript type-correctness phase, not a feature-build phase. No net-new files are created. Every "new" file is an in-place modification, and the strongest analogs are the *already-zero-error* sibling code in the same files (typed `.from()` methods, the writer's `Tables<>` consumption). The planner's job is to make the untyped RPC surface look like the already-typed `.from()` surface. Concrete excerpts below are "copy this shape" targets.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `packages/supabase-types/src/database.ts` | generated types | (regen artifact) | prior regen output (git history) | exact (regen, no hand-edit) |
| `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | service (adapter) | request-response / CRUD-read | the five zero-error `.from()` read methods **in the same file** | exact (self-analog) |
| `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts` | utility (transform) | transform | `mapRow.ts` (already generic `<TRow extends Record<string, unknown>>`) | exact (sibling, same generic shape) |
| `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts` | test | transform | (its own existing cases) | exact |
| `apps/frontend/src/lib/types/global.d.ts` | config (ambient decl) | n/a | n/a (one-line deletion) | n/a |

## Pattern Assignments

### `packages/supabase-types/src/database.ts` (generated, regen)

**Analog:** the file's own prior regen output — DO NOT hand-write.

**Regeneration command (from `packages/supabase-types/package.json` `generate` script):**
```bash
yarn db:types
# → supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts
```
- Requires local Supabase Postgres up (`yarn db:status`; `yarn db:reset` guarantees migrations 00001+00002 → `get_nominations` present).
- Output is prettier-formatted by the script; not in `.prettierignore`; no separate format step.
- `@openvaa/supabase-types` is raw `.ts` source (`build` = echo no-op) — no rebuild needed for svelte-check to pick up the new types.
- **D-02:** commit the full regen diff atomically (measured 170 insertions / 18 deletions), no hand-trimming. Capture `yarn check` count before (133) and after (measured 50).

---

### `supabaseDataProvider.ts` — RPC path `_getNominationData` (258–424) (service, CRUD-read)

**Analog (self, zero errors):** `_getElectionData` (137–167), `_getConstituencyData` (173–235). These are the pattern to replicate — the client is `SupabaseClient<Database>` so `.from()` rows are fully typed and produce zero errors. After the regen, `this.supabase.rpc('get_nominations', …)` returns a typed `Returns` row array in exactly the same way.

**Typed-read + `toDataObject` + runtime-guard pattern to copy** (from `_getElectionData` lines 153–166):
```typescript
return (data ?? []).map((row) => {
  const obj = toDataObject(row as Record<string, unknown>, locale, this.defaultLocale);
  return {
    ...obj,
    date: row.election_date ? String(row.election_date) : undefined,
    round: row.current_round ?? undefined,
    // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
    image: parseStoredImage(row.image as Json as unknown as StoredImage | null, supabaseUrl),
    ...
  } as ElectionData;
});
```
Key points the RPC path must mirror once the row is typed:
- After regen, `results.flatMap((r) => r.data ?? [])` yields `Array<Row>`; `row` is non-null `Row`. The `row.id as string`, `row.entity_type as string` etc. casts (287–356) become unnecessary — **D-03 permits removing these dead casts/null-guards**. Keep them behavior-neutral.
- **JSONB columns stay `Json`** even after regen (`name`, `image`, `color`, `custom_data`, `entity_answers`). The `parseStoredImage(row.image as Json as unknown as StoredImage | null, …)` and `parseAnswers(row.entity_answers as Json as unknown as LocalizedAnswers | null, locale)` runtime guards (330, 362, 364) MUST stay (Pitfall 4). Their pre-existing `as Json as unknown as X // reason:` idiom is OUTSIDE the 79-error set — do not churn it.

**RPC-arg null→undefined fix (net-new 259/260 after regen):**
```typescript
// regen types p_election_id/p_constituency_id as `string | undefined`;
// eid/cid come from Array<string | null>. Coerce at the call site:
this.supabase.rpc('get_nominations', {
  p_election_id: eid ?? undefined,
  p_constituency_id: cid ?? undefined,
  p_include_unconfirmed: includeUnconfirmed
})
```
Behavior-neutral: SQL signature is `p_election_id uuid DEFAULT NULL` with filter `(p_election_id IS NULL OR …)`; omitting the key (undefined) applies `DEFAULT NULL` — identical to passing `null` (Pitfall 5).

---

### `supabaseDataProvider.ts` — the two TS2352 casts (374, 549) (service, discriminated-union construction)

**Analog:** the entity-type branching already present at 368–372 (`if (entityType === ENTITY_TYPE.Candidate) { entity.firstName = … }`) — extend this so the built object structurally satisfies the variant union instead of being cast.

**Cast 374** (`entityMap.set(entityId, entity as AnyEntityVariantData)`): the object is assembled as `Record<string, unknown>` (line 358) so TS can't see `id`/`type` through it. **D-04: no `as`** — construct an explicitly-typed intermediate naming the discriminant (`type`) + identity (`id`) + variant-specific fields, branching on `entityType` (Candidate adds `firstName`/`lastName`/`organizationId`). Does NOT auto-dissolve from regen (Pitfall 1, verified) — MEDIUM effort, pairs with the D-03 refactor.

**Cast 549** (`return { ...obj, type: row.type, … } as AnyQuestionVariantData` in `_getQuestionData`): same treatment — `...obj` is `Record<string, unknown>` output of `toDataObject`, so `name`/`categoryId`/`id` are opaque. Pull the discriminant (`type`) + `id` + `name` + `categoryId` explicitly from the typed row so the union resolves without the cast.

**Union type definitions to narrow against:**
- `AnyEntityVariantData` = `EntityVariantData[keyof …]` (`packages/data/src/objects/entities/variants/variants.ts:41`) — union of Candidate/Faction/Organization/Alliance data arg types, keyed on `type`.
- `AnyQuestionVariantData` = `QuestionVariantData[keyof …]` (`packages/data/src/objects/questions/variants/variants.ts:106`) — union of 9 question-data shapes, keyed on `type`.

---

### `utils/toDataObject.ts` (utility, transform) — D-05 generification

**Analog:** `mapRow.ts:9` — already generic in exactly the target shape:
```typescript
export function mapRow<TRow extends Record<string, unknown>>(row: TRow): Record<string, unknown> {
```
`toDataObject`'s internal pipeline (`localizeRow` → `mapRow`) is already generic-safe. Apply the same defaulted-generic to the public seam:

**Current** (`toDataObject.ts:24`):
```typescript
export function toDataObject(
  row: Record<string, unknown>,
  locale: string,
  defaultLocale: string = 'en',
  additionalLocalizedFields: Array<string> = []
): Record<string, unknown>
```
**Backward-compatible target (D-05, satisfies constraint):**
```typescript
export function toDataObject<TRow extends Record<string, unknown> = Record<string, unknown>>(
  row: TRow,
  locale: string,
  defaultLocale: string = 'en',
  additionalLocalizedFields: Array<string> = []
): Record<string, unknown>
```
- Defaulted param (`= Record<string, unknown>`) keeps ALL existing call sites compiling unchanged — critically the Phase-127 `supabaseDataWriter.ts` sites (constraint). Provider call sites: `_getElectionData:154`, `_getConstituencyData:191,211`, `_getNominationData:316,355`, `_getEntityData:455`, `_getQuestionData:487,522`.
- Return type stays `Record<string, unknown>` — the output-side narrowing (374/549) is D-04's concern, NOT D-05. Do not type the return (would break backward-compat).
- Lets provider call sites drop the `as Record<string, unknown>` input cast (a D-03 cleanup).

### `utils/toDataObject.test.ts` (test)

**Analog:** its own existing cases (plain object literals). With a defaulted generic they compile and pass unchanged. Optionally add one typed-row assertion locking the generic (Wave 0 gap, optional).

---

### `apps/frontend/src/lib/types/global.d.ts` (config) — D-07

Delete line 13 (`declare module 'qs';`) and its 7-line preceding comment block (lines 7–13). Acceptance = svelte-check error set byte-identical with/without (Phase-125 verifier proved `@types/qs`... actually the real qs types provably govern — inert). Standalone one-line hygiene commit.

## Shared Patterns

### Generated-type consumption (`Tables<>` / `Database`)
**Source:** `supabaseDataWriter.ts:8` import + `:242` usage; `supabaseAdapter.ts:36,44,55` (`SupabaseClient<Database>`).
**Apply to:** the RPC path (rely on the regenerated `Returns` row array — do NOT hand-write an RPC row interface, D-01).
```typescript
import type { Json, Tables } from '@openvaa/supabase-types';
// NOTE: writer :242 uses `Tables<'nominations'>['Row']` — the ['Row'] index is
// REDUNDANT (Tables<'x'> already resolves to Row). Do NOT copy that indexing.
```
Provider already imports only `type { Json }` (line 19) — sufficient; the RPC `Returns` type flows from the typed client automatically.

### JSONB runtime guards (keep, do not remove)
**Source:** `storageUrl.ts` (`parseStoredImage`, `StoredImage`), `$lib/api/utils/parseAnswers` (`parseAnswers`), `getLocalized.ts`, `localizeRow.ts`.
**Apply to:** every JSONB column read in `_getNominationData` (image, entity_image, entity_answers, name/color/custom_data via `toDataObject`→`localizeRow`). Regenerated JSONB columns type as opaque `Json`; these guards are the ONLY safe narrowing (Pitfall 4).

### Behavior-neutrality gate (D-06)
**Source:** Phase 125 D-04 convention (`.planning/phases/125-.../125-CONTEXT.md`).
**Apply to:** phase completion. `yarn build` + `yarn test:unit` + `cd apps/frontend && yarn check` (assert `supabaseDataProvider.ts` absent from ERROR lines; total ≈46 — pin at gate, NOT ~54; regen also clears ~9 writer errors, Pitfall 2) + one full `yarn test:e2e` green (cardinal; "did not run" = failure). E2E prereqs: `yarn db:reset` + fresh dev server on :5173.

### Atomic per-cluster commits
**Source:** workstream convention (Phases 123–125).
**Apply to:** 4 commits — (1) regen (measure 133→50 around it), (2) provider typing (clear 259/260/374/549 → target 0, count ≈46), (3) toDataObject generification, (4) qs-shim deletion (count unchanged).

## No Analog Found

None. Every modified surface has a same-file or same-directory zero-error analog. This is a type-hardening phase — RESEARCH.md's measured error inventory (133→50→~46) is the authoritative guide over any abstract pattern.

## Metadata

**Analog search scope:** `apps/frontend/src/lib/api/adapters/supabase/{dataProvider,dataWriter,utils}/`, `packages/data/src/objects/{entities,questions}/variants/`, `packages/supabase-types/`.
**Files scanned:** 7 read (supabaseDataProvider.ts [3 ranges], toDataObject.ts, mapRow.ts, supabaseDataWriter.ts [2 ranges], variants.ts, global.d.ts).
**Pattern extraction date:** 2026-07-16
