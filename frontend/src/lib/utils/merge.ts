export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Deep merge two plain (non-constructed) objects with settings.
 *
 * @param target The target.
 * @param source The source.
 * @returns A new plain object that contains a deep merge of target and source.
 *
 * @note The function does not support constructed objects (f.e. dates) and arrays containing functions.
 */
export function mergeSettings<T extends object, U extends object>(target: T, source: U): T & U {
  const result = deepMergeRecursively({}, target);
  return deepMergeRecursively(result, source);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function deepMergeRecursively<T extends object, U extends object>(target: T, source: U): T & U {
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
  return target as T & U;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
