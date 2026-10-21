/**
 * Canonical collection-name resolution — the ONE implementation.
 *
 * ## Why this is its own module
 *
 * `COLLECTION_MAP` / `resolveCollectionName` were moved out of `supabaseAdminClient.ts` into `permittedKeys.ts` so there would be exactly one copy. `linkSentinels.ts` then needed the same primitive (for `pickCollection`) — but `permittedKeys.ts` already imports `LINK_SENTINELS` from `linkSentinels.ts` **and consumes it at module-evaluation time**, so an import in the other direction is a genuine ESM cycle: entering through `linkSentinels.ts` (which every unit spec and the golden-capture script does) would evaluate `permittedKeys.ts` against a still-uninitialised `LINK_SENTINELS` and throw a TDZ `ReferenceError`.
 *
 * Extracting the primitive to a leaf module — this file imports nothing local — breaks the cycle without duplicating anything. `permittedKeys.ts` re-exports both symbols, so every existing import path (`supabaseAdminClient.ts`, `src/index.ts`, `src/template/index.ts`, the specs) is unchanged.
 */

import { TABLE_MAP } from '@openvaa/supabase-types';

/**
 * Maps camelCase collection names to Supabase snake_case table names.
 * Extends `TABLE_MAP` with legacy / alias mappings for backward compatibility.
 *
 * MOVED here from `supabaseAdminClient.ts` (via `permittedKeys.ts`) so that `resolveCollectionName` — the canonical-keying primitive the admin client, the permitted-key declaration and the link resolver all depend on — has exactly one implementation.
 */
export const COLLECTION_MAP: Record<string, string> = {
  ...TABLE_MAP,
  // Legacy aliases
  parties: 'organizations',
  questionTypes: 'question_types'
};

/**
 * Resolve a collection name: if it matches a `COLLECTION_MAP` entry, use that; otherwise return as-is (already snake_case).
 *
 * This is the canonical-keying primitive.
 *
 * ⚠ **`Object.hasOwn`, not `??`.** `COLLECTION_MAP` is a plain object literal, so a bare `COLLECTION_MAP[collection] ?? collection` also saw INHERITED members: `resolveCollectionName('constructor')` returned the `Object` constructor and `resolveCollectionName('toString')` returned `Object.prototype.toString` — functions, not the declared `string`.
 *
 * The `collection` argument is template-controlled data at every one of this primitive's call sites — `assertKnownRowProps`, `permittedKeys`, `deniedKeys` and `bulkImport`'s payload construction — and `bulkImport` uses the result as an OBJECT KEY (`cleaned[tableName]`), so a returned function would key the payload by a stringified function body. The module documented as "the ONE implementation" of the canonical primitive must not have a lookup that can return the wrong type.
 */
export function resolveCollectionName(collection: string): string {
  return Object.hasOwn(COLLECTION_MAP, collection) ? COLLECTION_MAP[collection] : collection;
}
