/**
 * Remove any properties that have a nullish value from an object.
 */
export function removeNullishProps<TObject extends object>(obj: TObject): Partial<TObject> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value != null)) as Partial<TObject>;
}
