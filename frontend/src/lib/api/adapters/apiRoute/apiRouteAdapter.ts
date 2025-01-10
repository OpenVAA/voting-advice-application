import qs from 'qs';
import { API_ROUTES, type ApiGetRoute, type ApiPostRoute, type ApiRoute } from './apiRoutes';
import type { DPDataType } from '$lib/api/base/dataTypes';
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

    async apiFetch<TApi extends ApiRoute>({ endpoint, params, request }: FetchOptions<TApi>): Promise<Response> {
      if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
      let url = API_ROUTES[endpoint];
      if (params) url += `?${qs.stringify(params, { encodeValuesOnly: true })}`;
      const response = await this.fetch(url, request).catch((error) => {
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

    async apiGet<TApi extends ApiGetRoute>({ endpoint, params }: GetOptions<TApi>): Promise<DPDataType[TApi]> {
      const response = await this.apiFetch({ endpoint, params });
      return response.json();
    }

    async apiPost<TApi extends ApiPostRoute>({ endpoint, request }: PostOptions<TApi>): Promise<Response> {
      request ??= {};
      request.method = 'POST';
      request.headers ??= { 'Content-Type': 'application/json' };
      return this.apiFetch({ endpoint, request });
    }
  }

  return WithMixin;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;
