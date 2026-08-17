/**
 * A recursively optional version of `TObject`: every property at every depth becomes optional, so a
 * partial settings override can be typed against the full settings shape without restating it.
 *
 * NB. Only plain object properties are recursed into. Arrays and constructed objects (e.g. `Date`)
 * match the `extends object` branch too, so their own properties are also made optional — which is
 * consistent with how {@link mergeSettings} treats them (replaced wholesale, never element-merged).
 */
export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * Deep merge two plain (non-constructed) objects with settings.
 *
 * Hoisted to `@openvaa/app-shared` (see phase 63) so both `@openvaa/dev-seed`
 * and the frontend can import a single source of truth. Note that
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

/*
 * reason: the four `(target as any)[key]` writes below cannot be typed without `any`, and
 * `@ts-expect-error` is not an alternative here.
 *
 * `TTarget` is an unconstrained `object`, so `key` — which `for…in` types as `keyof TSource` — is not
 * a known key of `TTarget`, and TypeScript rejects the write with "expression of type 'string' can't
 * be used to index type 'TTarget'". That is correct as far as the type system can see: this function
 * is deliberately widening `target` by writing keys it does not yet declare, which is the whole
 * operation `mergeSettings` performs. There is no assertion that expresses "index by an arbitrary key
 * of the other type parameter" — `Record<string, unknown>` would compile but discards `TTarget`, and
 * the caller-visible return type `TTarget & TSource` is what actually carries the safety, asserted
 * once at the end of the function and covered by `mergeSettings.test.ts`.
 *
 * `@ts-expect-error` was considered and rejected: it suppresses the whole line rather than the single
 * index expression, and it would fail the build the day the underlying error changes shape, turning a
 * documented cast into an unrelated build break.
 *
 * The disable is scoped to this one function and re-enabled immediately after it.
 */
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
