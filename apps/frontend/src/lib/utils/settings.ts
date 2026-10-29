import type { DynamicSettings, StaticSettings } from '@openvaa/app-shared';

/**
 * Keys that are never merged, so that a stored value cannot reach an object's prototype through the merge.
 */
const UNMERGED_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Whether a value is an object that the merge descends into: neither `null` nor a list.
 */
function isMergeable(value: unknown): value is object {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Merge one level of `source` over `target` and answer a new object. Members of `target` that `source` does not name are carried over by reference.
 * @param target - The object merged into, which is left as it is
 * @param source - The object merged over it
 * @param isRoot - Whether this is the settings root, where a `null` member is skipped and not merged
 */
function mergeLevel(target: object, source: object, isRoot: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || UNMERGED_KEYS.has(key)) continue;
    if (isRoot && value === null) continue;
    const existing = result[key];
    result[key] = isMergeable(existing) && isMergeable(value) ? mergeLevel(existing, value, false) : value;
  }
  return result;
}

/**
 * Merge settings over other settings, member by member at every depth.
 *
 * - Where both sides hold an object, the two are merged member by member, so a member that `additional` does not name keeps the value `target` has.
 * - In every other case the value from `additional` replaces the value from `target` whole. Lists and scalars are therefore never combined: a list in `additional` is the list in the result.
 * - A member of `additional` whose value is `undefined` is skipped at every depth. A member whose value is `null` is skipped at the root; below the root it replaces the value `target` has.
 * - A key named `__proto__`, `constructor` or `prototype` is never merged.
 *
 * `target` is never mutated and nothing is cloned: every merged level is a new object, and the subtrees `additional` does not touch are shared with `target` by reference. `target` may be a reactive proxy.
 * @param target - The static settings or complete `AppSettings`
 * @param additional - The dynamic or complete settings to add, which may be a deep partial of them
 * @returns Complete `AppSettings`
 */
export function mergeAppSettings(
  target: StaticSettings | AppSettings,
  additional: AppSettings | DynamicSettings
): AppSettings {
  return mergeLevel(target, additional, true) as AppSettings;
}

/**
 * Build the INITIAL effective `AppSettings` value for `appContext`'s `$state`, folding in the DB override synchronously.
 *
 * This is the pure, server-and-client-safe init merge used at `$state` init so the server-rendered HTML already carries the DB override (no post-hydration default→override flash). The DB override is applied only when it exists and is not an `Error` (a failed loader result); otherwise the base static∪dynamic merge is returned unchanged.
 *
 * Internal helper (K1-compliant — not a renamed public symbol); it exists so the SSR-init merge can be unit-asserted without a running dev server.
 *
 * @param staticSettings - The static (hardcoded) settings
 * @param dynamicSettings - The dynamic (build-time) settings
 * @param dbData - The DB-sourced `page.data.appSettingsData` (or `Error`/`undefined`)
 * @returns The merged `AppSettings` including the DB override when present
 */
export function mergeInitialAppSettings(
  staticSettings: StaticSettings,
  dynamicSettings: DynamicSettings,
  dbData: DynamicSettings | Error | undefined
): AppSettings {
  const base = mergeAppSettings(staticSettings, dynamicSettings);
  if (dbData && !(dbData instanceof Error)) return mergeAppSettings(base, dbData);
  return base;
}
