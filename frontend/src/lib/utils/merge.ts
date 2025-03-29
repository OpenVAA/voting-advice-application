/**
 * DeepPartial is a utility type that makes all properties of an object optional,
 * and applies this recursively to nested objects.
 *
 * For example, given an object type:
 * {
 *   name: string;
 *   details: {
 *     age: number;
 *     address: string;
 *   }
 * }
 *
 * DeepPartial makes it:
 * {
 *   name?: string;
 *   details?: {
 *     age?: number;
 *     address?: string;
 *   }
 * }
 */
export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * Deep merge two plain (non-constructed) objects with settings.
 *
 * This function recursively merges two plain objects into a new object. Properties from the
 * source object override those in the target object, and nested objects are merged recursively.
 *
 * Important notes:
 * - Only plain objects are supported. Instances of classes (e.g., Date) or constructed objects are not merged properly.
 * - Arrays are not merged but replaced entirely by the source array.
 * - Function properties are simply overwritten.
 * - For specific types like AppSettings, use the specialized mergeAppSettings function.
 *
 * @param target The target object to merge into.
 * @param source The source object whose properties will override or extend the target.
 * @returns A new plain object that represents a deep merge of the target and source objects.
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  // Create a clone of the target by merging it into an empty object.
  const result = deepMergeRecursively({}, target);
  // Merge the source into the cloned target.
  return deepMergeRecursively(result, source);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Helper function to check if a value is a plain object.
 * It returns true for non-null objects that are not arrays and not Date instances.
 *
 * @param value The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
function isPlainObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Recursively deep merge the source object into the target object.
 *
 * This helper function iterates over each property in the source object and:
 * - If the source property is a Date, it creates a new Date instance with the same time.
 * - If the source property is a plain object, it ensures that the target has a plain object for that key
 *   (or creates an empty object if necessary) and then recursively merges the source object's properties.
 * - If the property is a function, it simply overwrites the target's property with the source function.
 * - For primitives and arrays, it overwrites the target's property with a deep copy of the source property
 *   using structuredClone.
 *
 * @param target The target object that is being updated.
 * @param source The source object whose properties are used to update the target.
 * @returns The target object after merging with the source.
 */
function deepMergeRecursively<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  // Iterate through each key in the source object.
  for (const key in source) {
    // If the source property is a Date, create a new Date instance.
    if (source[key] instanceof Date) {
      (target as any)[key] = new Date(source[key].getTime());
    } else if (isPlainObject(source[key])) {
      // If the source property is a plain object, ensure the target property is also a plain object.
      if (!isPlainObject((target as any)[key])) {
        (target as any)[key] = {};
      }
      // Recursively merge the nested objects.
      (target as any)[key] = deepMergeRecursively((target as any)[key], source[key]);
    } else if (typeof source[key] === 'function') {
      // If the source property is a function, overwrite the target's property with the source function.
      (target as any)[key] = source[key];
    } else {
      // For primitives and arrays, use structuredClone to create a deep copy and overwrite the target property.
      (target as any)[key] = structuredClone(source[key]);
    }
  }
  // Return the merged target object containing properties from both target and source.
  return target as TTarget & TSource;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
