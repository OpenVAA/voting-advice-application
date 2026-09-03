import { page } from '$app/state';
import { parseParams } from '$lib/routes';
import type { ArrayParam, Param } from '$lib/routes';

/**
 * A Svelte 5 class holding the reactive value of a route or search parameter.
 *
 * The reactive value is a private `$derived` FIELD read through the `value` prototype getter. A `$derived` field initializer runs lazily on first read so it is constructor-legal and reads `#param` only when `get value()` is first called — after the constructor has assigned `#param` (mirrors the `FilterContextProvider.#filterGroup` precedent). `value` is a prototype getter (paramState is NOT spread by any consumer, so a prototype getter is safe).
 */
class ParamStateImpl<TParam extends Param> {
  // Definite-assignment assertion: `#param` is assigned in the constructor before any read. The `#value` `$derived` field initializer below references `#param`, but its lazy body only runs on the first `get value ` call — long after construction — so the read is safe at runtime. The `!` suppresses TS's static "used before initialization" diagnostic that the field-initializer ordering (`#value` declared before the constructor assigns `#param`) would otherwise raise.
  #param!: TParam;
  #value = $derived(parseParams(page)[this.#param] as TParam extends ArrayParam ? Array<string> : string | undefined);

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
export function paramState<TParam extends Param>(
  param: TParam
): { readonly value: TParam extends ArrayParam ? Array<string> : string | undefined } {
  return new ParamStateImpl(param);
}
