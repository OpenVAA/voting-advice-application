/**
 * Recursively freeze all properties of an object and its nested objects.
 * NB. The object is not copied but frozen in place.
 * Based on https://www.npmjs.com/package/deep-freeze
 */
export function deepFreeze<TObject extends object>(obj: TObject): Frozen<TObject> {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(function (_prop) {
    const prop = _prop as keyof TObject;
    if (
      obj[prop] !== null &&
      (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return obj as Frozen<TObject>;
}

/**
 * An object whose all nested properties are frozen.
 */
export type Frozen<TObject> = TObject extends object
  ? Readonly<{ [KKey in keyof TObject]: Frozen<TObject[KKey]> }>
  : Readonly<TObject>;
