import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';

/**
 * Adapter-internal flattened view of a Nomination during the v2.6 Phase 64
 * reverse-fill pass. See `supabaseDataProvider.ts:365-417` for the consuming logic.
 *
 * The reverse-fill walks the post-`toDataObject` `nominations` array twice:
 *   1. Index by `parentNominationId` × child `entityType` → array of child ids.
 *   2. For each parent, write the appropriate `*NominationIds` field based on
 *      its own `entityType`.
 *
 * The `*NominationIds` fields are typed as mutable `Array<Id>` (not `readonly`)
 * because the reverse-fill intentionally mutates them in place. This widening
 * is what justifies the named intermediate type — the public per-variant
 * Nomination types in `@openvaa/data` do not anticipate post-construction
 * mutation; they auto-populate these fields only when nominations arrive in
 * the nested form (e.g. `org.data.candidates = [...]`). Our flat schema only
 * sets the child→parent edge, so the adapter has to fan-out the relationships
 * after construction.
 *
 * Adapter-internal: not exported beyond `supabaseDataProvider.ts`. Filename
 * uses singular `.type.ts` to match the codebase convention (30+ sibling
 * `.type.ts` files exist under `apps/frontend/src/lib`; zero plural
 * `.types.ts` files exist) — this deviates from the literal CONTEXT D-03
 * string `supabaseDataProvider.types.ts`. Convention beats the literal.
 *
 * Note: `Id` is exported from `@openvaa/core` (not `@openvaa/data` as the
 * plan's literal interface block suggested); this matches the established
 * codebase convention used in `apps/frontend/src/lib/api/utils/formatId.ts`,
 * `apps/frontend/src/lib/api/base/dataWriter.type.ts`, and several others.
 *
 * @see packages/data/src/objects/nominations/base/nomination.ts:38-45 for the
 *      "either both or neither" parentNominationId/Type invariant the
 *      adapter respects upstream of the reverse-fill (line ~326 of
 *      `supabaseDataProvider.ts` clears parentNominationId when the parent
 *      is unresolvable).
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
