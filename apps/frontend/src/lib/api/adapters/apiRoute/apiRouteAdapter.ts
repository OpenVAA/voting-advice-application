import { API_ROUTES } from './apiRoutes';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { ApiRouteAdapter, ApiRouteGetOptions, ApiRoutePostOptions } from './apiRouteAdapter.type';
import type { ApiGetRoute, ApiPostRoute, ApiRouteReturnType } from './apiRoutes';

/**
 * A mixin for all ApiRoute Data API services, implementing `apiGet` and `apiPost` methods.
 * @param base - The base class to which to add the mixin.
 * @returns A class that extends both the base class and the mixin class.
 */
export function apiRouteAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<ApiRouteAdapter> & TBase {
  abstract class WithMixin extends base {
    // reason: forwards the base constructor's parameters unchanged; typed as the mixin `any[]` rest for the reason given on `Constructor` below.
    constructor(...args: Array<any>) {
      super(...args);
    }

    async apiGet<TApi extends ApiGetRoute>({
      endpoint,
      ...rest
    }: ApiRouteGetOptions<TApi>): Promise<ApiRouteReturnType<TApi>> {
      return (await Promise.resolve(this.get({ url: API_ROUTES[endpoint], ...rest }))) as Promise<
        ApiRouteReturnType<TApi>
      >;
    }

    async apiPost<TApi extends ApiPostRoute>({
      endpoint,
      ...rest
    }: ApiRoutePostOptions<TApi>): Promise<ApiRouteReturnType<TApi>> {
      return (await Promise.resolve(this.post({ url: API_ROUTES[endpoint], ...rest }))) as Promise<
        ApiRouteReturnType<TApi>
      >;
    }
  }

  return WithMixin;
}

// reason: see the identical note in `../supabase/supabaseAdapter.ts` — the mixin pattern requires an `any[]` rest parameter, and the rule exempts rest args via `ignoreRestArgs: true` rather than being silent about a violation.
type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;
