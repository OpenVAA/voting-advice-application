/**
 * Canonical collection-name resolution: this module holds the one `resolveCollectionName`.
 *
 * It is a leaf with no local imports because `permittedKeys.ts` reads `LINK_SENTINELS` at module evaluation, so `linkSentinels.ts` cannot import from it.
 */

import { TABLE_MAP } from '@openvaa/supabase-types';

/**
 * Maps camelCase collection names to Supabase snake_case table names.
 */
export const COLLECTION_MAP: Record<string, string> = { ...TABLE_MAP };

/**
 * Resolve a collection name: if it matches a `COLLECTION_MAP` entry, use that; otherwise return as-is (already snake_case).
 *
 * Uses `Object.hasOwn` so an inherited key such as `constructor` resolves to itself, not to an `Object.prototype` member.
 */
export function resolveCollectionName(collection: string): string {
  return Object.hasOwn(COLLECTION_MAP, collection) ? COLLECTION_MAP[collection] : collection;
}
