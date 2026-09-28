# Phase 66: Adapter Type Cleanup — Research

**Researched:** 2026-04-29
**Domain:** TypeScript typing of an in-memory adapter mapping pipeline (Supabase row JSON → `@openvaa/data` Nomination variants)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Keep the `nominations` table as is.** No migration. `name` (jsonb) and `entity_type` (STORED GENERATED column) both retained. **Implication:** DB-01 requirement moves to REQUIREMENTS.md "Future Requirements (deferred)"; ROADMAP Phase 66 description narrows to adapter-only; total v2.7 plan count drops from 11 to ~9.
- **D-02: N/A — no migration.** Skipped per D-01.
- **D-03: New sibling file** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.types.ts`. Reasoning: keeps the adapter-internal intermediate type colocated with the consumer (no cross-package leak; not in `@openvaa/supabase-types`), but separates types from runtime so the main `.ts` file stays focused on logic. Type is exported but only consumed by `supabaseDataProvider.ts` for now — naming and shape are the planner's call (suggested: `InternalFlatNomination` or `FlatNominationRow`).
- **D-04: ~1 plan (down from 3 in original ROADMAP).** Suggested single plan structure:
  - **Plan 66-01: Adapter retype + verification** — Define `InternalFlatNomination` in sibling `.types.ts`, replace the 2 `as unknown as` casts at lines 377 + 396, run `yarn workspace @openvaa/frontend check`, run v2.6 parity gate, write phase verification report.
  - The work is small enough (2 cast sites + 1 new file + 2 verification commands) that splitting into multiple plans would be administrative overhead. If the planner discovers unexpected complexity (e.g., the supabase-types row shape doesn't compose cleanly with the intermediate type), a 2-plan split (type design vs cast replacement) is acceptable.

### Claude's Discretion

- Exact name + shape of the intermediate type (`InternalFlatNomination` is a suggestion; planner picks). Anchor: the type must capture the reverse-fill loop's input shape (parent + children flat rows) without leaking supabase row shape into downstream consumers.
- Whether `InternalFlatNomination` is a single type or a small type family (`FlatParent`, `FlatChild`, etc.) — planner's call based on what reads cleanest at the call sites.
- Whether to add JSDoc to the new types pointing at the v2.6 Phase 64 Plan 01 reverse-fill rationale (recommended for future-reader benefit, but optional).
- Whether to add a unit test scaffold for the typed reverse-fill (no existing test file; likely deferred since the integration test is the Playwright parity run). **NOTE: research correction below — `supabaseDataProvider.test.ts` DOES exist (1519 lines) and already covers `getNominationData`. The CONTEXT statement was inaccurate on this point.**

### Deferred Ideas (OUT OF SCOPE)

- **DB-01 schema cleanup** (drop `nominations.name` + `nominations.entity_type`) — user opted to keep the table as is. Moved to REQUIREMENTS.md "Future Requirements (deferred)".
- **Wider `as unknown as` sweep across the frontend** — todo `2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` is targeted at this one file. A monorepo-wide sweep would be a larger DX phase.
- **Restructuring `supabaseDataProvider.ts` mapping pipeline** — explicit OoS per REQUIREMENTS.md. The file is ~545 lines but the v2.6 P64 design is current.
- **Adding a unit test scaffold for the typed reverse-fill** — the existing `supabaseDataProvider.test.ts` already covers the parent-type derivation path; the reverse-fill behavior (writing `{candidate,faction,organization}NominationIds` onto parents) is currently NOT directly tested but is empirically exercised by the Playwright parity gate. Adding such tests is OoS.
- **Sweeping the 12 `as any` casts in this file** (line 100, 101, 102, 153, 186, 209, 319, 350, 351, 458, 459, 489, 497, 538) — not in scope per SC-1 wording (`as unknown as` only). The `entity_image as any` etc. casts to `parseStoredImage` are a separate widening hazard, deferred.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADAPTER-01 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` carries zero `as unknown as { ... }` casts (or each remaining one is justified inline with `// @ts-expect-error — reason: …` or a comment). No `any` types remain. The reverse-fill pass uses a real intermediate type (e.g., `InternalFlatNomination`) defined once in a sibling `supabaseDataProvider.types.ts` file and reused across the parent/child mapping loops. Type errors surface at the call site, not in downstream consumers. | §Standard Stack (composing off `AnyNominationVariantPublicData`), §Architecture Patterns (sibling-types-file convention), §Code Examples (the typed reverse-fill replacement), §Common Pitfalls (variance/parent-vs-child shape clash), §Validation Architecture (`yarn workspace @openvaa/frontend check` + parity gate) |

</phase_requirements>

## Summary

Phase 66 is a tightly-scoped, low-risk type-cleanup over `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`. The v2.6 Phase 64 Plan 01+03 reverse-fill pass introduced exactly two `as unknown as { ... }` casts (lines 377 and 396) — the parent/child mapping loops that walk the flat `nominations` array twice (once child→parent index, once parent fan-out write) without a typed contract. The fix is mechanical: extract a single intermediate type to a new sibling file `supabaseDataProvider.types.ts`, replace both inline anonymous shapes with the named type, and verify `yarn workspace @openvaa/frontend check` passes plus the v2.6 anchor parity gate at HEAD `2c7ad2dea` continues to pass.

The interesting design choice is the **shape of the intermediate type**. The reverse-fill iterates over `AnyNominationVariantPublicData[]` — a union covering 4 variants where mutually-exclusive fields like `candidateNominationIds` (Organization, Faction) vs `organizationNominationIds` (Alliance) appear on different members. A single intermediate type that flattens the union must either (a) be a structural type that lists every reverse-fillable field as optional (loses precision but reads cleanly), or (b) be the `AnyNominationVariantPublicData` union itself with a runtime narrow at write time (preserves precision, requires a type guard). The recommended approach is (a) — a sibling-file `InternalFlatNomination` type with `parentNominationId?: Id | null`, `entityType: EntityType`, and the three reverse-fill targets all marked optional and writable. Rationale: the cast sites are inherently widening (the v2.6 P64 logic intentionally mutates these properties), so an explicitly-widened internal type matches reality better than a tagged union with type guards.

**Primary recommendation:** Create `supabaseDataProvider.types.ts` exporting one type, `InternalFlatNomination`, that picks the relevant fields off `AnyNominationVariantPublicData` and widens the three `*NominationIds` fields to mutable `Array<Id>`. Replace both casts with typed `for (const child of nominations as Array<InternalFlatNomination>)` loops. Use `yarn workspace @openvaa/frontend check` as the per-task gate; full Playwright parity at the phase gate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bridge supabase row → `@openvaa/data` Nomination variant shape | API / Backend (frontend's adapter layer) | — | This IS the supabase-adapter's responsibility — it sits at the boundary between PostgREST/PostgreSQL row JSON and the `@openvaa/data` domain model. No other tier should know about `parent_nomination_id` rows. |
| Define the intermediate type that names the reverse-fill input shape | API / Backend (frontend's adapter layer) | — | Per D-03: the type is adapter-internal and lives in a sibling `.types.ts` file. NOT in `@openvaa/supabase-types` (would leak adapter concerns into a shared package), NOT in `@openvaa/data` (would leak supabase-shape concerns into the domain model). |
| Validate the type contract holds (`yarn check`) | API / Backend (frontend) | — | svelte-check runs over the frontend workspace's full TS graph. |
| Verify the runtime behavior is unchanged (parity gate) | E2E / Playwright | — | The Playwright parity gate at HEAD `2c7ad2dea` is the integration-level proof that the type-only change is a no-op. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (strict mode, per `packages/shared-config/tsconfig.base.json:15`) | Type system | Project-mandated; `strict: true` is in force [VERIFIED: read shared-config/tsconfig.base.json] |
| `@openvaa/data` (workspace:^, v0.1.0) | workspace | Source of `AnyNominationVariantPublicData`, `Id`, `EntityType`, `NominationData<T,P>`, `WithOptional<T,K>` | Already imported by adapter; types resolve via TS project references [VERIFIED: read apps/frontend/package.json + apps/frontend/tsconfig.json] |
| `@openvaa/supabase-types` (workspace:^, v0.1.0) | workspace | Source of `Database['public']['Tables']['nominations']['Row']`, `COLUMN_MAP` | Already imported by mixin + utils; the canonical row shape that the get_nominations RPC's RETURNS TABLE mirrors [VERIFIED: read packages/supabase-types/src/database.ts:616-672, src/index.ts] |
| svelte-check | catalog: (yarn-managed) | Type-check command (`yarn workspace @openvaa/frontend check`) | The phase's primary verification command per CONTEXT [VERIFIED: read apps/frontend/package.json `check` script] |
| Playwright | (project's `tests/playwright.config.ts`) | E2E parity gate at HEAD `2c7ad2dea` | The v2.6 anchor baseline; per Phase 65 VALIDATION the actual JSON-anchor commit is `190a42d7c` — `2c7ad2dea` is the Phase-64 closure commit that establishes the contract [VERIFIED: git log 2c7ad2dea + 190a42d7c] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@openvaa/data` Nomination types (`PublicCandidateNominationData`, `PublicFactionNominationData`, `PublicOrganizationNominationData`, `PublicAllianceNominationData`) | v0.1.0 | Per-variant precise public data shapes | If planner picks the type-family option (B) over the single-flat-type option (A) |
| `WithOptional<T, K>` from `@openvaa/data/internal` | v0.1.0 | Helper for "make these keys optional" | Useful when the intermediate type needs to widen specific keys on a base shape [VERIFIED: read packages/data/src/utils/withOptional.type.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single `InternalFlatNomination` interface (Option A) | `Pick<NominationData<EntityType, EntityType>, …> & { *NominationIds?: Array<Id> }` (Option A-pick) | Pick variant ties the type to the `NominationData` generic; if `@openvaa/data` ever changes its base interface the adapter type tracks it. Option A's explicit interface is simpler to read but drifts on changes. |
| Single `InternalFlatNomination` interface | Type family: `InternalFlatChildNomination` + `InternalFlatParentNomination` (Option B) | More precise but introduces 2 type names where 1 suffices. Each cast site only needs the union of {parent fields, child fields}, not strict separation. Adds maintenance overhead without clear benefit. |
| Cast-replacement | `AnyNominationVariantPublicData` directly + `if ('candidateNominationIds' in p)` runtime narrows (Option C) | Type-correct without an intermediate type, but the `*NominationIds` fields are read-only on the public data types — mutating them via narrow violates the variance contract; TypeScript would flag the assignment. Rejected. |
| Mutating in place | Build a new `Map<id, NominationVariantPublicData>` and emit fresh objects (Option D) | More functional, less performant, structurally a wider rewrite — out of scope per CONTEXT (no algorithm change). |

**Recommended:** Option A — explicit `InternalFlatNomination` interface in sibling `.types.ts` file. Composes off the field shape implied by the existing inline cast targets; matches the v2.6 P64 in-place-mutation algorithm without changing it; reads simply at both cast sites.

**Installation:** None. All types already in workspace dependencies.

**Version verification:** All packages are workspace-internal at v0.1.0 (semver discipline is intentionally relaxed pre-1.0 publish; trusted-publishing migration is a deferred concern). No registry version lookup applies. [VERIFIED: read package.json files]

## Architecture Patterns

### System Architecture Diagram

```
                 ┌──────────────────────────────────────┐
                 │  Postgres (apps/supabase)            │
                 │  - nominations table                 │
                 │  - get_nominations RPC               │
                 │    RETURNS TABLE (entity_type,       │
                 │      parent_nomination_id, …)        │
                 └─────────────────┬────────────────────┘
                                   │ JSON rows (snake_case)
                                   ▼
                 ┌──────────────────────────────────────┐
                 │  @openvaa/supabase-types             │
                 │  - Database['Tables']['nominations'] │
                 │    ['Row']  (table shape)            │
                 │  - COLUMN_MAP (snake → camel)        │
                 │  NB: get_nominations RPC return type │
                 │  is NOT in Database.Functions —      │
                 │  must be hand-typed if needed.       │
                 └─────────────────┬────────────────────┘
                                   │ Row<T> imported as type
                                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/frontend/src/lib/api/adapters/supabase/                      │
│                                                                    │
│  supabaseAdapter.ts ─────────► supabaseAdapterMixin                │
│  (provides typed SupabaseClient<Database>, locale)                 │
│                                                                    │
│  utils/                                                            │
│  - mapRow.ts          (snake_case → camelCase via COLUMN_MAP)      │
│  - localizeRow.ts     (jsonb {en,fi,…} → string per locale)        │
│  - toDataObject.ts    (mapRow ∘ localizeRow)                       │
│                                                                    │
│  dataProvider/                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ supabaseDataProvider.ts (~545 lines, single-file principle)  │ │
│  │                                                              │ │
│  │  _getNominationData()  [lines 222-423]                       │ │
│  │   ├─ rpc('get_nominations') × N (electionId × constituency)  │ │
│  │   ├─ Build nominationTypeById Map                            │ │
│  │   ├─ For each row → toDataObject + parentNominationType lift │ │
│  │   │    └─ pushes onto nominations: AnyNominationVariantPubD[]│ │
│  │   ├─ Reverse-fill pass [lines 365-417]                       │ │
│  │   │   ⚠ TWO `as unknown as { … }` CASTS HERE                  │ │
│  │   │   - Line 377: child loop builds                          │ │
│  │   │     childIdsByParentAndType: Map<parentId,Map<type,ids>> │ │
│  │   │   - Line 396: parent loop reads the map and writes       │ │
│  │   │     candidateNominationIds / factionNominationIds /      │ │
│  │   │     organizationNominationIds depending on parent's      │ │
│  │   │     entityType                                           │ │
│  │   └─ return { nominations, entities }                        │ │
│  │                                                              │ │
│  │  ⬅── PHASE 66 SCOPE: replace the 2 casts with a typed        │ │
│  │       InternalFlatNomination from sibling .types.ts          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ supabaseDataProvider.types.ts  (NEW FILE)                    │ │
│  │   export interface InternalFlatNomination { … }              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────┬──────────────────────────────────────────────────┘
                  │ AnyNominationVariantPublicData[] / AnyEntityVariantData[]
                  ▼
       ┌────────────────────────────────┐
       │  @openvaa/data DataRoot        │
       │  - constructs Nomination       │
       │    variants from public data   │
       │  - either-both-or-neither      │
       │    parent invariant            │
       └────────────────────────────────┘
```

### Recommended Project Structure

```
apps/frontend/src/lib/api/adapters/supabase/dataProvider/
├── index.ts                         # exports `dataProvider` singleton
├── supabaseDataProvider.ts          # main mapping logic (touched: replace 2 casts)
├── supabaseDataProvider.types.ts    # NEW: InternalFlatNomination
└── supabaseDataProvider.test.ts     # existing 1519-line vitest suite
```

The `supabaseDataProvider.types.ts` filename uses **plural `.types.ts`** per the CONTEXT directive (D-03). Note: the rest of the codebase uses singular `.type.ts` (e.g. `EntityList.type.ts`, `nomination.type.ts`, `supabaseAdapter.type.ts`) — see "Pattern 1" below for the discrepancy and recommended resolution.

### Pattern 1: Sibling type-file naming convention (singular `.type.ts` is the norm)

**What:** The codebase universally uses **singular `.type.ts`** for sibling type files, not plural `.types.ts`.

**Evidence:**
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` (sibling to `supabaseAdapter.ts`)
- `apps/frontend/src/lib/dynamic-components/entityList/EntityList.type.ts`
- `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.type.ts`
- `packages/data/src/objects/nominations/base/nomination.type.ts`
- `packages/data/src/objects/nominations/variants/{candidate,faction,organization,alliance}Nomination.type.ts`

`find apps/frontend/src/lib -name "*.types.ts"` returns ZERO matches; `find apps/frontend/src/lib -name "*.type.ts"` returns 30+ matches. The plural form does not exist anywhere in the codebase.

**When to use:** Always for sibling type files in this project.

**Recommendation for Phase 66:** Use **`supabaseDataProvider.type.ts`** (singular) to match the project convention. The CONTEXT D-03 directive says `supabaseDataProvider.types.ts` (plural), but the directive is naming-suggestion — the file IS new, and matching the established convention is more important than matching the literal string in CONTEXT. The planner should flag this minor deviation in the plan, or escalate to discuss-phase if the user wants the literal CONTEXT name.

**Source:** [VERIFIED: `find` over apps/frontend/src/lib + packages/data/src]

### Pattern 2: Composing intermediate types off `@openvaa/data` Nomination variants

**What:** The intermediate type bridges row JSON (snake_case → already mapped to camelCase by `toDataObject` upstream of the cast sites) to the `@openvaa/data` `Nomination` variant constructor inputs (`AnyNominationVariantPublicData`).

**When to use:** When mutating shared properties across the union — exactly the v2.6 P64 reverse-fill scenario.

**Example (recommended Option A):**
```typescript
// File: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts
// Source: composes off @openvaa/data type exports (verified via packages/data/src/index.ts)
import type { EntityType, Id } from '@openvaa/data';

/**
 * Adapter-internal flattened view of a Nomination during the v2.6 Phase 64
 * reverse-fill pass.
 *
 * The reverse-fill walks the post-mapRow `nominations` array twice:
 *   1. Index by parentNominationId × child entityType → array of child ids.
 *   2. For each parent, write the appropriate `*NominationIds` field
 *      based on its own entityType and the children's entityTypes.
 *
 * This type captures the union of fields read AND fields mutated across
 * both loops. Because the algorithm intentionally mutates these properties
 * in place (Org/Faction get `candidateNominationIds`, Org gets
 * `factionNominationIds`, Alliance gets `organizationNominationIds`),
 * the *NominationIds fields are typed as mutable Array<Id> rather than
 * read-only as they appear on the per-variant Public types.
 *
 * Not exported beyond the supabaseDataProvider — adapter-internal.
 *
 * @see supabaseDataProvider.ts:365-417 for the consuming reverse-fill pass.
 * @see packages/data/src/objects/nominations/base/nomination.ts:38-45 for
 *      the "either both or neither" parentNominationId/Type invariant.
 */
export interface InternalFlatNomination {
  id: Id;
  entityType: EntityType;
  parentNominationId?: Id | null;
  /** Set on Organization or Faction parents during reverse-fill. */
  candidateNominationIds?: Array<Id>;
  /** Set on Organization parents during reverse-fill. */
  factionNominationIds?: Array<Id>;
  /** Set on Alliance parents during reverse-fill. */
  organizationNominationIds?: Array<Id>;
}
```

```typescript
// File: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
// Source: same file, lines 365-417 with the 2 casts replaced
import type { InternalFlatNomination } from './supabaseDataProvider.type';

// … (lines 364 and earlier unchanged; nominations: AnyNominationVariantPublicData[]
//    is the existing variable) …

const childIdsByParentAndType = new Map<string, Map<string, Array<string>>>();
for (const child of nominations as Array<InternalFlatNomination>) {
  if (!child.parentNominationId) continue;
  let typeMap = childIdsByParentAndType.get(child.parentNominationId);
  if (!typeMap) {
    typeMap = new Map();
    childIdsByParentAndType.set(child.parentNominationId, typeMap);
  }
  let ids = typeMap.get(child.entityType);
  if (!ids) {
    ids = [];
    typeMap.set(child.entityType, ids);
  }
  ids.push(child.id);
}
for (const parent of nominations as Array<InternalFlatNomination>) {
  const typeMap = childIdsByParentAndType.get(parent.id);
  if (!typeMap) continue;
  const candIds = typeMap.get(ENTITY_TYPE.Candidate);
  const factionIds = typeMap.get(ENTITY_TYPE.Faction);
  const orgIds = typeMap.get(ENTITY_TYPE.Organization);
  if (candIds && (parent.entityType === ENTITY_TYPE.Organization || parent.entityType === ENTITY_TYPE.Faction)) {
    parent.candidateNominationIds = candIds;
  }
  if (factionIds && parent.entityType === ENTITY_TYPE.Organization) {
    parent.factionNominationIds = factionIds;
  }
  if (orgIds && parent.entityType === ENTITY_TYPE.Alliance) {
    parent.organizationNominationIds = orgIds;
  }
}
```

Note: the `nominations as Array<InternalFlatNomination>` is a **single, structural cast** that replaces TWO `as unknown as { … }` casts. The double-cast (`as unknown as`) is gone because `InternalFlatNomination` is structurally compatible with `AnyNominationVariantPublicData` — both share `id`, `entityType`, `parentNominationId`, and the `*NominationIds` fields exist on the appropriate variants of the union.

**Caveat (verify during planning):** The structural compatibility between `AnyNominationVariantPublicData` and `InternalFlatNomination` depends on TypeScript's subtype check passing. Specifically:
- `AnyNominationVariantPublicData` is a union of the 4 variants.
- `OrganizationNominationData` and `FactionNominationData` declare `name?: never | null` (an exclusion clause that tightens the parent type).
- `parentNominationId?: TParent extends never ? never : Id | null` — for `AllianceNomination` (TParent = never), the field is `never`.

If the structural cast fails the check, the planner can:
1. Use `as unknown as Array<InternalFlatNomination>` (still 1 cast, vs. the current 2 inline casts — net improvement, but technically still a `as unknown as`)
2. Use a type guard helper: `function asFlat(n: AnyNominationVariantPublicData): InternalFlatNomination { return n as unknown as InternalFlatNomination; }` — same outcome, marginally more documented
3. Define the array variable as `InternalFlatNomination[]` from the start (change the type of `nominations` to `InternalFlatNomination[]` for the duration of the reverse-fill, then assert back to `AnyNominationVariantPublicData[]` at return) — moves the cast to the boundary

**Recommendation:** Try the direct cast first; svelte-check will signal if the assertion needs widening. If it does, fall back to option (3) above.

### Pattern 3: Re-using `Pick<>` over the Database table type (alternative)

**What:** Instead of a hand-rolled interface, derive the type by `Pick`-ing fields off the canonical table type.

**Example:**
```typescript
import type { Database } from '@openvaa/supabase-types';
import type { Id } from '@openvaa/data';

type NominationRow = Database['public']['Tables']['nominations']['Row'];

// Hypothetical alternative — composes off the row shape, then maps via COLUMN_MAP knowledge
export interface InternalFlatNomination {
  id: NominationRow['id'];                         // Id (string)
  entityType: NominationRow['entity_type'];        // entity_type enum
  parentNominationId?: NominationRow['parent_nomination_id'];
  candidateNominationIds?: Array<Id>;
  factionNominationIds?: Array<Id>;
  organizationNominationIds?: Array<Id>;
}
```

**Tradeoff vs Pattern 2:** Pattern 3 ties the type to `Database['Tables']['nominations']['Row']` which uses snake_case keys — but the reverse-fill pass operates on the **post-`mapRow` camelCase** view. The intermediate type has to use camelCase keys, so deriving from `NominationRow` is awkward (you'd Pick snake_case fields then rename them, which is more typing than just declaring the camelCase shape directly). **Recommendation: prefer Pattern 2 (direct interface) over Pattern 3.**

### Anti-Patterns to Avoid

- **Using `as unknown as` to widen `Array<AnyNominationVariantPublicData>` to a custom type when a single structural cast suffices.** The current code does the double-cast inside the loop; the fix is to do the structural cast at the loop boundary.
- **Putting the intermediate type in `@openvaa/supabase-types`.** That package mirrors DB schema exactly (it's regenerated by `yarn supabase:types`). Adapter-internal intermediates would be lost on every regeneration AND would leak adapter concerns into a shared package. [VERIFIED: read packages/supabase-types/src/index.ts — only re-exports from `database.ts` (generated) and `column-map.ts` (hand-authored mapping)].
- **Putting the intermediate type in `@openvaa/data`.** That package owns the domain model; an adapter-shape type doesn't belong there.
- **Adding the type to the existing `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts`.** That file holds adapter mixin contracts (`SupabaseAdapterConfig`, `SupabaseAdapter`); it shouldn't grow per-method-internal types.
- **Sweeping the 12 `as any` casts in the same plan.** Out of scope per SC-1 wording (`as unknown as` only). They are a separate hazard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| snake_case → camelCase mapping | A second `mapRow`-equivalent inside the intermediate type | The existing `mapRow` + `COLUMN_MAP` from `@openvaa/supabase-types` | Already type-safe and battle-tested. The reverse-fill operates AFTER `toDataObject` has run, so the intermediate type works in camelCase space — no remapping needed. [VERIFIED: read apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts] |
| Either-both-or-neither parent invariant | Replicate the parent-id/parent-type validation inside the adapter | The `Nomination` constructor enforces it (packages/data/src/objects/nominations/base/nomination.ts:38-45) | The adapter already correctly clears `parentNominationId` when the parent is unresolvable (line 326). Don't add a second layer of validation. |
| Per-variant typing precision | A type-family with 4 variants matching `NominationVariantPublicData` exactly | A single `InternalFlatNomination` with optional `*NominationIds` fields | The reverse-fill is a deliberate widening operation. A precision-matching type-family would force runtime narrows that don't exist in the algorithm today; that's an algorithm change (out of scope). |

**Key insight:** The existing v2.6 P64 algorithm is correct; only the type story is broken. The fix is the smallest possible delta — name the existing inline anonymous shape, put it in a sibling file, point both cast sites at it. Resist the urge to "improve" the algorithm.

## Runtime State Inventory

> Phase 66 is a **type-only refactor**. No data is renamed, no records are migrated, no services or processes register the renamed string. The intermediate type name (`InternalFlatNomination`) is internal to TypeScript and has zero runtime footprint.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by inspection. The `nominations` table schema is unchanged (D-01). No DB rows reference the type name. | None |
| Live service config | None — verified by inspection. No n8n/Datadog/external service references the adapter's internal types. | None |
| OS-registered state | None — verified by inspection. No scheduled tasks or systemd units involve the adapter file. | None |
| Secrets/env vars | None — verified by inspection. No env-var name changes. | None |
| Build artifacts | None — verified by inspection. The TypeScript file is part of `@openvaa/frontend` (which is built fresh by Vite/svelte-kit on each run, no separate dist artifact carrying the old type). The `.svelte-kit/` directory is a generated artifact that may cache type info; `svelte-kit sync` (run by the `check` script) regenerates it. | None — `yarn workspace @openvaa/frontend check` invokes `svelte-kit sync` first. |

**Nothing found in any category.** This is the expected outcome for a type-only refactor with no schema/data changes.

## Common Pitfalls

### Pitfall 1: Structural cast fails because `OrganizationNominationData.name?: never` rejects `string`
**What goes wrong:** `OrganizationNominationData` and `CandidateNominationData` declare `name?: never | null` (an explicit "must not have a name" constraint). The intermediate type `InternalFlatNomination` doesn't include `name`, but TypeScript's structural compatibility check still walks the full union. If the cast direction matters (it does — `Array<AnyNominationVariantPublicData>` → `Array<InternalFlatNomination>` is the assignment direction), TS may flag this.
**Why it happens:** The 4 Public Nomination types have asymmetric exclusion clauses: Org and Candidate forbid `name`; Alliance and Faction allow it via `WithImpliedEntity`. A union covers all 4. A "subset" type that picks only `id`/`entityType`/etc. should narrow correctly.
**How to avoid:** Try the direct cast first. If TS rejects, use `unknown` as a stepping stone: `nominations as unknown as Array<InternalFlatNomination>`. Even with the `unknown` step, this is ONE cast (replacing two), and the named type makes the intent clear — better than the current double-cast-with-anonymous-shape. Document the cast inline if `unknown` is needed.
**Warning signs:** `Type 'AnyNominationVariantPublicData' is not assignable to type 'InternalFlatNomination'` from svelte-check.

### Pitfall 2: Mutating fields that are read-only on the public-data types
**What goes wrong:** `OrganizationNominationData.candidateNominationIds?: Array<Id> | null` is technically mutable in the type system (no `readonly`), but the intent is "this gets auto-populated by the constructor from `candidates`". Mutating it on the adapter side after `toDataObject` is what the v2.6 P64 reverse-fill does — and that mutation is currently typed with the inline `as unknown as { … }` cast precisely because it's an unusual ownership transfer.
**Why it happens:** The data layer didn't anticipate the adapter doing post-construction mutation; the adapter is bridging a flat schema to the data layer's nested-construction expectation.
**How to avoid:** The intermediate type explicitly declares the `*NominationIds` fields as `Array<Id>` (not `readonly Array<Id>`), making the mutation type-safe at the adapter boundary. Document this in JSDoc on `InternalFlatNomination`.
**Warning signs:** Type errors of the form `Cannot assign to 'candidateNominationIds' because it is a read-only property.`

### Pitfall 3: New file name collides with existing convention
**What goes wrong:** CONTEXT D-03 says `supabaseDataProvider.types.ts` (plural). Codebase convention is `.type.ts` (singular). The plan picks one; if it picks the CONTEXT literal (plural), it breaks convention; if it picks the convention (singular), it minorly contradicts CONTEXT.
**Why it happens:** CONTEXT was written without the convention check.
**How to avoid:** Use **singular `.type.ts`** to match the 30+ existing sibling files. Note the deviation in the plan with a one-line rationale: "matches established codebase convention". This is a low-stakes call; either is defensible.
**Warning signs:** None — it's a documentation/consistency concern, not a runtime issue.

### Pitfall 4: The Playwright parity gate is at HEAD `2c7ad2dea`, not `190a42d7c`
**What goes wrong:** CONTEXT and ROADMAP both reference HEAD `2c7ad2dea` as the v2.6 parity baseline. Phase 65 VALIDATION uses `190a42d7c` (the actual JSON-anchor commit from Phase 64 attempt-4 capture per `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/diff.md`). The verification report at the closure commit `2c7ad2dea` references the anchor JSON at the same path.
**Why it happens:** Two commits matter — the JSON-capture commit (`190a42d7c`, attempt 4) is when the report was generated; the closure commit (`2c7ad2dea`, "Phase 64 closed") is when the milestone-close declared the gate stable. Both refer to the same JSON file: `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json`. [VERIFIED: git log + Phase 65 VALIDATION line 56-58]
**How to avoid:** The plan should pin the parity gate to the JSON file path, not a commit hash. Phase 65's `scripts/diff-parity.mjs` already does this. Phase 66 should reuse the same script (`.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs`) — or a phase-66 copy — pointing at the same anchor JSON.
**Warning signs:** "Anchor commit not found" — symptom of pinning a hash instead of the file.

### Pitfall 5: Over-scoping by sweeping `as any` casts
**What goes wrong:** The file has 12 `as any` casts (mostly `parseStoredImage(row.image as any, supabaseUrl)`). They look superficially similar to the 2 `as unknown as { … }` casts and a refactor-minded planner might fold them in.
**Why it happens:** "While I'm here, let me clean these up too." But CONTEXT explicitly limits scope to `as unknown as`-style casts and `any` types as ANNOTATIONS, not type-assertion casts. Re-reading SC-1: "zero `as unknown as { ... }` casts ... no `any` types remain". The "no `any` types remain" applies to type annotations like `let x: any`; the file has none of those — only inline `as any` casts as adaptors to legacy function signatures. Sweeping `as any` casts is a separate concern.
**How to avoid:** Plan ONLY the 2 `as unknown as` cast sites + the new sibling file. Mention the `as any` casts in the plan's "Out of Scope" subsection so the reviewer knows they were considered and rejected.
**Warning signs:** Plan grows beyond ~5 tasks.

## Code Examples

### Example 1: Reverse-fill pass with InternalFlatNomination (the canonical replacement)

See Pattern 2 above for the full code. Key transform:

```diff
- for (const child of nominations) {
-   const c = child as unknown as {
-     id: string;
-     parentNominationId?: string | null;
-     entityType: string;
-   };
-   if (!c.parentNominationId) continue;
-   …
- }
+ for (const child of nominations as Array<InternalFlatNomination>) {
+   if (!child.parentNominationId) continue;
+   …
+ }
```

```diff
- for (const parent of nominations) {
-   const p = parent as unknown as {
-     id: string;
-     entityType: string;
-     candidateNominationIds?: Array<string>;
-     factionNominationIds?: Array<string>;
-     organizationNominationIds?: Array<string>;
-   };
-   const typeMap = childIdsByParentAndType.get(p.id);
-   …
- }
+ for (const parent of nominations as Array<InternalFlatNomination>) {
+   const typeMap = childIdsByParentAndType.get(parent.id);
+   …
+ }
```

Source: composed from `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:365-417` [VERIFIED: read file].

### Example 2: Verifying zero `as unknown as` casts post-fix

```bash
# Should return zero matches
grep -nE "as unknown as" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
```

Source: standard codebase grep. Pre-fix returns 2 matches (lines 377, 396); post-fix returns 0.

### Example 3: Verifying zero `any` type annotations

```bash
# Should return zero matches (annotations only — `: any\b` boundary)
grep -nE ":\s*any\b" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | grep -vE "as any\b"
```

Note: the `as any` casts are out of scope per CONTEXT. The annotation check is for `let x: any` / parameter `(x: any)` patterns, of which there are zero today (verified via grep).

### Example 4: Type-check gate

```bash
yarn workspace @openvaa/frontend check
```

Runs `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`. Per Phase 65 VALIDATION, ~30s runtime.
[VERIFIED: read apps/frontend/package.json `check` script]

### Example 5: Parity gate

```bash
# Capture
yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json \
  > .planning/phases/66-nominations-schema-adapter-type-cleanup/post-fix/playwright-report.json

# Diff against v2.6 anchor
node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs \
  .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json \
  .planning/phases/66-nominations-schema-adapter-type-cleanup/post-fix/playwright-report.json
```

The Phase 65 helper script is reusable; Phase 66 invokes it with the same baseline + a new post-fix JSON. Pass criterion (per Phase 64 contract): `Baseline: 67p / 1f / 34c, Post: 67p / 1f / 34c, PARITY GATE: PASS`. Tolerance ±1 fail count for the imgproxy CAND-03 flake. [VERIFIED: read .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs + 65-VALIDATION.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline anonymous `as unknown as { … }` casts inside loops | Named intermediate type in sibling `.type.ts` | This phase (66) | Type errors surface at the call site; reverse-fill input shape is documented; future maintainers see why the mutation pattern is type-safe |
| Adapter-internal types embedded in main `.ts` file | Adapter-internal types in sibling `.type.ts` file | This phase + project convention | Matches existing `supabaseAdapter.type.ts` pattern; keeps logic file focused |

**Deprecated/outdated:**
- Inline anonymous shapes in casts — replaced by the named interface.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The structural cast `nominations as Array<InternalFlatNomination>` (single, not double) will satisfy svelte-check given the union variance of `AnyNominationVariantPublicData`. | Pattern 2 + Pitfall 1 | If wrong, the planner falls back to `as unknown as Array<InternalFlatNomination>` (still ONE cast vs the current TWO; named intermediate type still satisfies SC-1's spirit "or each remaining one is justified inline"). Net: minor doc adjustment in the plan. |
| A2 | The CONTEXT directive `supabaseDataProvider.types.ts` (plural) should be overridden in favor of project convention `supabaseDataProvider.type.ts` (singular). | Pattern 1 | Low risk — either is defensible; only documentation/consistency at stake. The user can override during plan-check. |
| A3 | `2c7ad2dea` and `190a42d7c` both refer to the same anchor JSON; either commit hash satisfies the parity-gate requirement, and the plan should pin the JSON file path rather than a commit. | Pitfall 4 | Low risk — verified via git log and Phase 65 VALIDATION cross-reference. |
| A4 | The existing `supabaseDataProvider.test.ts` (1519 lines) does NOT directly test the reverse-fill behavior (writing `*NominationIds`); it tests the parent-type derivation in a sibling code path. Phase 66 does not need to add new unit tests; the Playwright parity gate is the integration-level proof. | User Constraints | If wrong (i.e., the user wants reverse-fill unit tests), the plan adds 1-2 vitest cases — maybe 1 extra task. Net: small. |
| A5 | The 12 `as any` casts in the file are out of scope per SC-1's literal wording (`as unknown as { ... }` casts). | Pitfall 5 | The user could disagree and want them swept too — but SC-1 + the source todo's "Acceptance" section both single out `as unknown as`. Low risk. |

## Open Questions

1. **Should the new file be `.type.ts` (singular, project convention) or `.types.ts` (plural, CONTEXT D-03 literal)?**
   - What we know: 30+ files in the codebase use singular `.type.ts`. CONTEXT D-03 says plural. No `.types.ts` files exist anywhere.
   - What's unclear: Whether D-03 is literally prescriptive or a casual suggestion.
   - Recommendation: Plan picks singular `.type.ts` with a one-line rationale. Plan-check or discuss-phase can override if user wants the literal plural.

2. **Will the structural cast `as Array<InternalFlatNomination>` succeed without `unknown`?**
   - What we know: The intermediate type covers a strict subset of fields shared across the union. TypeScript's structural assignment of a union to a subset-shape should succeed; the asymmetric `name?: never` clauses on Org/Candidate variants are a possible concern.
   - What's unclear: Whether svelte-check (which uses TypeScript's full type system) will accept the cast directly. Worst case: needs an `unknown` stepping stone.
   - Recommendation: Plan tries the direct cast first; if svelte-check rejects, plan adds the `unknown` stepping stone with an inline comment. Either way, the cast count drops from 2 to 1, which is a meaningful improvement.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | yarn workspace commands, `diff-parity.mjs` | ✓ (project standard) | (not pinned in this read) | — |
| yarn 4 (Berry) | All workspace commands | ✓ (root `package.json` declares yarn 4 workspaces per CLAUDE.md) | — | — |
| svelte-kit | `yarn workspace @openvaa/frontend check` | ✓ | catalog | — |
| svelte-check | `check` script | ✓ | catalog | — |
| Playwright | E2E parity gate | ✓ (per CLAUDE.md `yarn test:e2e`) | catalog | — |
| Supabase CLI (local) | E2E parity gate (requires `yarn dev` running) | ✓ (per CLAUDE.md) | — | If not available locally, parity gate must run on CI; not blocking for type-only changes |
| Phase 65 `diff-parity.mjs` | Parity-gate verification | ✓ | At `.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` | Phase 64's `regen-constants.mjs` `flattenReport` function is the underlying implementation — could be inlined if Phase 65 path is unavailable |
| Phase 64 anchor JSON | Parity-gate baseline | ✓ | `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` | None — this is the canonical baseline |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

The phase requires no new tooling. All gates use existing infrastructure.

## Validation Architecture

> Per `.planning/config.json`, `workflow.nyquist_validation` is absent → treat as enabled. Section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 1.x (unit, via `apps/frontend/vitest.config.ts`); svelte-check 3.x (type, via `apps/frontend/tsconfig.json`); Playwright (E2E, via `tests/playwright.config.ts`) |
| Config file | `apps/frontend/vitest.config.ts` (existing); `apps/frontend/tsconfig.json` (existing); `tests/playwright.config.ts` (existing) |
| Quick run command | `yarn workspace @openvaa/frontend check` (~30s) |
| Full suite command | `yarn workspace @openvaa/frontend test:unit && yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` (~5-10 min) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADAPTER-01 (SC-1: zero `as unknown as`) | Cast count is 0 in target file | static / grep | `! grep -nE 'as unknown as' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | ✅ existing tooling (grep) |
| ADAPTER-01 (SC-1: zero `any` annotations) | No `: any` annotations remain (already 0; invariant check) | static / grep | `! grep -nE ':\s*any\b' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts \| grep -vE 'as any\b'` | ✅ existing tooling |
| ADAPTER-01 (SC-1: intermediate type in sibling file) | New `.type.ts` file exists and exports `InternalFlatNomination` | static / file presence | `test -f apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts && grep -q 'InternalFlatNomination' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` | ❌ NEW file in plan |
| ADAPTER-01 (SC-1: type used at both cast sites) | Both reverse-fill loops reference the named type | static / grep | `[ "$(grep -c 'InternalFlatNomination' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts)" -ge 2 ]` | ✅ existing tooling |
| ADAPTER-01 (SC-2: bridges row → variant without leak) | No new exports from `@openvaa/supabase-types` or `@openvaa/data` | static / grep | `! git diff --stat HEAD~1 HEAD -- packages/supabase-types/ packages/data/ \| grep -q '\.ts'` (assert no changes to those packages by Phase 66) | ✅ existing git |
| ADAPTER-01 (SC-3: `yarn check` passes) | Type-check is green | static / type | `yarn workspace @openvaa/frontend check` | ✅ existing |
| ADAPTER-01 (SC-3: existing test file still green) | Vitest suite still passes (regression check on the 1519-line existing test) | unit | `yarn workspace @openvaa/frontend test:unit -- --run apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` | ✅ existing |
| ADAPTER-01 (SC-4: parity gate passes) | Playwright counts match v2.6 anchor JSON | E2E | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > /tmp/post-fix.json && node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json /tmp/post-fix.json` | ✅ existing (script + baseline JSON) |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend check` (~30s — type gate; the canonical signal that the type-only change compiles)
- **Per wave merge:** `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/frontend test:unit` (~2-3 min — adds the existing 1519-line vitest regression check)
- **Phase gate:** Full suite + parity gate green before `/gsd-verify-work` (~5-10 min)

### Wave 0 Gaps
- ❌ **NEW** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` — required for SC-1 sibling-file criterion. Created in the single plan.
- ✅ All other infrastructure (vitest, svelte-check, Playwright, parity script, anchor JSON) is in place.

*(No framework install needed; no fixture files needed; no shared `conftest`-equivalent needed.)*

## Project Constraints (from CLAUDE.md)

| Constraint | How Phase 66 Honors It |
|------------|-----------------------|
| Use TypeScript strictly — avoid `any`, prefer explicit types | Phase 66 IS this constraint applied to one specific file. Cast removal + named intermediate type. |
| Test accessibility (WCAG 2.1 AA) | N/A — type-only change, no UI surface change. |
| Localization — all user-facing strings support multiple locales | N/A — no user-facing strings touched. |
| Code review checklist (`.agents/code-review-checklist.md`) | Plan should reference this for the final review pass. |
| Module Resolution & Dependencies — IDE uses TS project references | The new `.type.ts` file is a sibling within `apps/frontend/`; no new package, no new project reference needed. |
| `yarn build` is dependency-aware (Turborepo) | The change touches only `apps/frontend/`; Turborepo will build only that workspace + downstream. No upstream package rebuild needed. |
| Yarn 4 workspaces | `yarn workspace @openvaa/frontend check` is the canonical command. |

[VERIFIED: read /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/CLAUDE.md]

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (read in full) — the target file; 545 lines; cast sites at lines 377 + 396 confirmed.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` (skimmed; describe blocks + getNominationData section) — confirmed 1519 lines; existing test for `getNominationData`; reverse-fill behavior NOT directly asserted but parent-type derivation is.
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` (read) — the convention reference for sibling type files.
- `apps/frontend/src/lib/api/adapters/supabase/utils/{toDataObject,mapRow,localizeRow,storageUrl}.ts` (read) — upstream of the cast sites.
- `packages/supabase-types/src/{index,column-map,database}.ts` (read; database.ts spot-read at lines 600-680, 1085-1170) — `Database` shape, COLUMN_MAP. `get_nominations` is NOT in `Database.Functions` (the RPC is dynamically called).
- `packages/data/src/index.ts`, `internal.ts` (skimmed), `objects/nominations/{base,variants}/*.type.ts` (read) — `AnyNominationVariantPublicData`, per-variant Public types, `WithOptional`, `Id`, `EntityType`.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` lines 3100-3182 — `get_nominations` RPC SQL, the RETURNS TABLE shape that defines the row JSON.
- `.planning/phases/65-svelte-5-audit-sweeps/65-VALIDATION.md` (read) — parity-gate methodology + script location.
- `.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` (read) — reusable parity-diff helper.
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/diff.md` (read) — Phase 64 PARITY GATE: PASS contract.
- `packages/shared-config/tsconfig.base.json` (read) — confirmed `strict: true`.
- `CLAUDE.md` (read in full) — project conventions.
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/phases/66-*/66-CONTEXT.md` (all read in full) — phase scope.
- `.planning/todos/pending/2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` (read) — source todo; acceptance criteria.

### Secondary (MEDIUM confidence)
- Convention check: `find apps/frontend/src/lib -name "*.type*.ts"` — 30+ singular, 0 plural. Strong evidence but not a formal rule.
- Git log inspection of `2c7ad2dea` and `190a42d7c` — both are real commits; the relationship between them was inferred from commit messages.

### Tertiary (LOW confidence)
- *(None — all claims in this research are verified against the codebase or marked as A1/A2 assumptions in the Assumptions Log.)*

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages are workspace-internal and read directly.
- Architecture (intermediate type design): HIGH — the type shape is derived from inspection of the existing inline anonymous types and the consuming algorithm; one fallback path documented.
- Pitfalls: HIGH — Pitfall 1 (variance) and Pitfall 4 (commit ref) verified against TypeScript semantics and git log respectively; Pitfall 3 (file naming) verified by codebase scan.
- Validation: HIGH — reuses Phase 65's already-shipped `diff-parity.mjs` and the existing anchor JSON; no new infrastructure needed.

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days; the codebase is stable, no Svelte/TS upgrade in flight, the v2.6 anchor JSON is preserved).

---

*Phase: 66-nominations-schema-adapter-type-cleanup*
*Research completed: 2026-04-29*
