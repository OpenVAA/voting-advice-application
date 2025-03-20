import qs from 'qs';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
import { addHeader } from '$lib/api/utils/addHeader';
import { API_ROUTES, type ApiGetRoute, type ApiPostRoute, type ApiRoute, type ApiRouteReturnType } from './apiRoutes';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { ApiRouteAdapter, FetchOptions, GetOptions, PostOptions } from './apiRouteAdapter.type';

/**
 * A mixin for all ApiRoute Data API services, implementing `apiFetch`, `apiGet` and `apiPost` methods.
 * @param base - The base class to which to add the mixin.
 * @returns A class that extends both the base class and the mixin class.
 */
export function apiRouteAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<ApiRouteAdapter> & TBase {
  abstract class WithMixin extends base {
    constructor(...args: Array<any>) {
      super(...args);
    }

    async apiFetch<TApi extends ApiRoute>({
      endpoint,
      params,
      request,
      useCacheProxy
    }: FetchOptions<TApi>): Promise<Response> {
      if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
      let url = API_ROUTES[endpoint];
      if (params) url += `?${qs.stringify(params, { encodeValuesOnly: true })}`;
      const response = await this.fetch(
        useCacheProxy ? `${UNIVERSAL_API_ROUTES.cacheProxy}?resource=${encodeURIComponent(url)}` : url,
        request
      ).catch((error) => {
        throw new Error(`Error with apiFetch when fetching: ${error} • ${url}`);
      });
      if (!response.ok) {
        const body = (await response.json().catch()) ?? {};
        const message =
          typeof body === 'object' && body?.message ? body.message : '(Could not parse error message from Response.)';
        throw new Error(`Error with apiFetch when parsing response: ${response.status} • ${message} • ${url}`);
      }
      return response;
    }

    async apiGet<TApi extends ApiGetRoute>({
      endpoint,
      params,
      useCacheProxy
    }: GetOptions<TApi>): Promise<ApiRouteReturnType<TApi>> {
      const response = await this.apiFetch({ endpoint, params, useCacheProxy });
      return response.json();
    }

    async apiPost<TApi extends ApiPostRoute>({ endpoint, body }: PostOptions<TApi>): Promise<ApiRouteReturnType<TApi>> {
      const request = addHeader({}, 'Content-Type', 'application/json');
      request.method = 'POST';
      if (body) request.body = JSON.stringify(body);
      const response = await this.apiFetch({ endpoint, request });
      return response.json();
    }
  }

  return WithMixin;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;
