import { page } from '$app/state';
import { parseParams } from '$lib/utils/route';
import type { ArrayParam, Param } from '$lib/utils/route';

/**
 * A Svelte 5 class holding the reactive value of a route or search parameter
 * (v2.13 context-as-class migration, CLASS-05).
 *
 * The reactive value is a private `$derived` FIELD read through the `value`
 * prototype getter. A `$derived` field initializer runs lazily on first read
 * (§20), so it is constructor-legal and reads `#param` only when `get value()`
 * is first called — after the constructor has assigned `#param` (mirrors the
 * `FilterContextProvider.#filterGroup` precedent). `value` is a prototype getter
 * (§17 — paramStore is NOT spread by any consumer, so a prototype getter is safe).
 */
class ParamStoreImpl<TParam extends Param> {
  #param: TParam;
  #value = $derived(
    parseParams(page)[this.#param] as TParam extends ArrayParam ? Array<string> : string | undefined
  );

  constructor(param: TParam) {
    this.#param = param;
  }

  get value(): TParam extends ArrayParam ? Array<string> : string | undefined {
    return this.#value;
  }
}

/**
 * Create a reactive value that holds the value of a route or search parameter.
 * @param param - The name of the parameter.
 * @returns An object with a reactive `value` getter.
 */
export function paramStore<TParam extends Param>(
  param: TParam
): { readonly value: TParam extends ArrayParam ? Array<string> : string | undefined } {
  return new ParamStoreImpl(param);
}
