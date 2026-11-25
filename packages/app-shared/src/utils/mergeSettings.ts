/**
 * A recursively optional version of `TObject`: every property at every depth becomes optional, so a partial settings override can be typed against the full settings shape without restating it.
 *
 * NB. Only plain object properties are recursed into. Arrays and constructed objects (e.g. `Date`) match the `extends object` branch too, so their own properties are also made optional — and {@link mergeSettings} replaces an array wholesale, never element-merged.
 */
export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * The dotted paths of the settings members whose value is one whole, so a source value replaces the target's instead of being merged into it. In `contestantApp.servedEntityTypes` a present key means a served type, so merging a stored map over the shipped one would keep serving the shipped types.
 */
export const SETTINGS_REPLACED_WHOLE: ReadonlyArray<string> = ['contestantApp.servedEntityTypes'];

/**
 * Keys that are never merged, so that a stored value cannot reach an object's prototype through the merge.
 */
const UNMERGED_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Options of {@link mergeSettings}.
 */
export type MergeSettingsOptions = {
  /**
   * Skip a member of `source` whose value is `null` at the root, so that it keeps the value `target` has. Below the root a `null` always replaces the value beneath it.
   */
  skipNullAtRoot?: boolean;
};

/**
 * Deep merge settings over other settings, member by member at every depth.
 *
 * Lives in `@openvaa/app-shared` so that `@openvaa/dev-seed` and the frontend import a single source of truth; the frontend's `mergeAppSettings` is this merge with `skipNullAtRoot`.
 *
 * - Where both sides hold a plain object, the two are merged member by member, so a member that `source` does not name keeps the value `target` has.
 * - In every other case the value from `source` replaces the value from `target` whole: lists, scalars, functions, an object over a `null`, and the objects at the paths of {@link SETTINGS_REPLACED_WHOLE}.
 * - A member of `source` whose value is `undefined` is skipped at every depth; a `null` at the root is skipped only with `skipNullAtRoot`.
 * - A key named `__proto__`, `constructor` or `prototype` is never merged.
 *
 * Neither input is mutated and nothing is cloned: every merged level is a new object, and the subtrees `source` does not touch, as well as the values it supplies, are shared by reference. `target` may therefore be a reactive proxy.
 *
 * NB. A constructed object (e.g. `Date`) is merged as if it were a plain one, so settings must hold none.
 *
 * @param target - The target, which is left as it is.
 * @param source - The source merged over it.
 * @param options - See {@link MergeSettingsOptions}.
 * @returns A new object that contains a deep merge of target and source.
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource,
  { skipNullAtRoot = false }: MergeSettingsOptions = {}
): TTarget & TSource {
  return mergeLevel({ target, source, path: '', skipNullAtRoot }) as TTarget & TSource;
}

/**
 * Merge one level of `source` over `target` and answer a new object. Members of `target` that `source` does not name are carried over by reference.
 * @param options.target - The object merged into, which is left as it is.
 * @param options.source - The object merged over it.
 * @param options.path - The dotted path of this level, empty at the root.
 * @param options.skipNullAtRoot - Whether a `null` member is skipped at the root.
 */
function mergeLevel({
  target,
  source,
  path,
  skipNullAtRoot
}: {
  target: object;
  source: object;
  path: string;
  skipNullAtRoot: boolean;
}): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || UNMERGED_KEYS.has(key)) continue;
    if (!path && skipNullAtRoot && value === null) continue;
    const keyPath = path ? `${path}.${key}` : key;
    const existing = result[key];
    result[key] =
      isMergeable(existing) && isMergeable(value) && !SETTINGS_REPLACED_WHOLE.includes(keyPath)
        ? mergeLevel({ target: existing, source: value, path: keyPath, skipNullAtRoot })
        : value;
  }
  return result;
}

/**
 * Whether a value is an object that the merge descends into: neither `null` nor a list.
 */
function isMergeable(value: unknown): value is object {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
