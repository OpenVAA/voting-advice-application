/**
 * Deep merge two objects.
 * @param target The target.
 * @param source The source.
 * @returns An instance that contains a result of a deep merge of target and source.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // If the key doesn't exist on the target, initialize it as an object
      if (!(key in target)) {
        (target as any)[key] = {};
      }
      // Recursively merge objects
      (target as any)[key] = deepMerge((target as any)[key], source[key]);
    } else {
      // For non-objects or arrays, overwrite the value with a deep copy
      (target as any)[key] = structuredClone(source[key]);
    }
  }
  return target as T & U;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
