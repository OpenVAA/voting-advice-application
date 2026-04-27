/** Create a unique identifier for use as an element ID. */
export function getUUID(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : (Math.random() * 10e15).toString(16);
}

/**
 * Concat string values with properties passed by the user. Mainly used to
 * prepend default `class` values into `$$restProps` before passing them
 * to an element or a Svelte component.
 * @param props - The passed properties, usually `$$restProps`
 * @param defaults - A record of string properties that will be prepended to the
 *   same values in `props`
 * @returns The merged props, based on a shallow copy of `props`
 */
export function concatProps<TObject extends object>(props: TObject, defaults: Partial<StringProps<TObject>>) {
  // Make a shallow copy of props so as not to alter its values
  const merged = { ...props };
  for (const k in defaults) {
    merged[k] = (
      k in merged && typeof merged[k] === 'string' ? `${defaults[k] ?? ''} ${merged[k]}` : defaults[k]
    ) as TObject[typeof k];
  }
  return merged;
}

/**
 * Prepend default class value into `restProps` before passing them
 * to an element or a Svelte component. A shorthand for `concatProps`.
 * @param props - The passed properties, usually `restProps`
 * @param classes - The base classes to use
 * @returns The merged props, based on a shallow copy of `props` with
 *   `classes` joined with possible `props.class`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function concatClass<TProps extends Record<string, any>>(props: TProps, classes: string) {
  // Normalize class to string if it's a non-string ClassValue (Svelte 5 compatibility)
  const normalized = { ...props };
  if (normalized['class'] != null && typeof normalized['class'] !== 'string') {
    (normalized as Record<string, unknown>)['class'] = String(normalized['class']);
  }
  return concatProps(normalized as TProps & { class?: string | null }, {
    class: classes
  } as Partial<StringProps<TProps & { class?: string | null }>>);
}

/**
 * Extract the string properties of an object.
 */
type StringProps<TObject extends object> = {
  [K in keyof TObject]: string extends TObject[K] ? string : never;
};
