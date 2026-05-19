import { page } from '$app/state';
import { parseParams } from '$lib/utils/route';
import type { ArrayParam, Param } from '$lib/utils/route';

/**
 * Create a reactive value that holds the value of a route or search parameter.
 * @param param - The name of the parameter.
 * @returns An object with a reactive `value` getter.
 */
export function paramStore<TParam extends Param>(
  param: TParam
): { readonly value: TParam extends ArrayParam ? Array<string> : string | undefined } {
  const _value = $derived(parseParams(page)[param] as TParam extends ArrayParam ? Array<string> : string | undefined);
  return {
    get value() {
      return _value;
    }
  };
}
