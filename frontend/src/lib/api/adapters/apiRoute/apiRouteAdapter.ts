import { API_ROUTES, type ApiGetRoute, type ApiPostRoute, type ApiRouteReturnType } from './apiRoutes';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { ApiRouteAdapter, ApiRouteGetOptions, ApiRoutePostOptions } from './apiRouteAdapter.type';

/**
 * A mixin for all ApiRoute Data API services, implementing `apiGet` and `apiPost` methods.
 * @param base - The base class to which to add the mixin.
 * @returns A class that extends both the base class and the mixin class.
 */
export function apiRouteAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<ApiRouteAdapter> & TBase {
  abstract class WithMixin extends base {
    constructor(...args: Array<any>) {
      super(...args);
    }

    async apiGet<TApi extends ApiGetRoute>({
      endpoint,
      ...rest
    }: ApiRouteGetOptions<TApi>): Promise<ApiRouteReturnType<TApi>> {
      return (await this.get({ url: API_ROUTES[endpoint], ...rest })) as Promise<ApiRouteReturnType<TApi>>;
    }

    async apiPost<TApi extends ApiPostRoute>({
      endpoint,
      ...rest
    }: ApiRoutePostOptions<TApi>): Promise<ApiRouteReturnType<TApi>> {
      return (await this.post({ url: API_ROUTES[endpoint], ...rest })) as Promise<ApiRouteReturnType<TApi>>;
    }
  }

  return WithMixin;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;
