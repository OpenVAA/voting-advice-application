/** Create a unique identifier for use as an element ID. */
export function getUUID(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : (Math.random() * 10e15).toString(16);
}

/**
 * Concat string values with properties passed by the user. Mainly used to
 * prepend default `class` values into `$$restProps` before passing them
 * to an element or a Svelte component.
 * @param props The passed properties, usually `$$restProps`
 * @param defaults A record of string properties that will be prepended to the
 *   same values in `props`
 * @returns The merged props, based on a shallow copy of `props`
 */
export function concatProps<
  T extends Record<string, unknown>,
  D extends Record<string, string | undefined>
>(props: T, defaults: D): Omit<T, keyof D> & D {
  // Make a shallow copy of props so as not to alter its values
  const merged: Record<string, unknown> = {...props};
  for (const k in defaults) {
    merged[k] =
      k in merged && typeof merged[k] === 'string'
        ? `${defaults[k] ?? ''} ${merged[k]}`
        : defaults[k];
  }
  return merged as Omit<T, keyof D> & D;
}

/**
 * Prepend default class value into `$$restProps` before passing them
 * to an element or a Svelte component. A shorthand for `concatProps`.
 * @param props The passed properties, usually `$$restProps`
 * @param classes The base classes to use
 * @returns The merged props, based on a shallow copy of `props` with
 *   `classes` joined with possible `props.class`
 */
export function concatClass<T extends Record<string, unknown>>(props: T, classes: string) {
  return concatProps(props, {class: classes});
}
