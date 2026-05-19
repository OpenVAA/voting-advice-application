export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * Deep merge two plain (non-constructed) objects with settings.
 *
 * Hoisted to `@openvaa/app-shared` in Phase 63 so both `@openvaa/dev-seed`
 * and the frontend can import a single source of truth (D-02). Note that
 * `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` is a
 * separate, SHALLOW merge with different semantics — do not confuse the two.
 *
 * NB. Does NOT support constructed objects (e.g. `Date`) or arrays containing
 * functions. Arrays are replaced wholesale via `structuredClone` (NOT
 * element-merged).
 *
 * @param target - The target.
 * @param source - The source.
 * @returns A new plain object that contains a deep merge of target and source.
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  const result = deepMergeRecursively({}, target);
  return deepMergeRecursively(result, source);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function deepMergeRecursively<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // If the key doesn't exist on the target, initialize it as an object
      if (!(key in target)) {
        (target as any)[key] = {};
      }
      // Recursively merge objects
      (target as any)[key] = deepMergeRecursively((target as any)[key], source[key]);
    } else if (typeof source[key] === 'function') {
      (target as any)[key] = source[key];
    } else {
      // For non-objects or arrays, overwrite the value with a deep copy
      (target as any)[key] = structuredClone(source[key]);
    }
  }
  return target as TTarget & TSource;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
