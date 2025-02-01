import qs from 'qs';
import { browser } from '$app/environment';
import { constants } from '$lib/utils/constants';
import { STRAPI_API, type StrapiApi, type StrapiApiReturnType } from './strapiApi';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { FetchOptions, GetOptions, PostOptions, StrapiAdapter } from './strapiAdapter.type';

/**
 * The default limit for query results. This is set to be very high, because we don't use pagination.
 * NB! Make sure that Strapi's own config is also high enough, see `/backend/vaa-strapi/config/server.ts`
 */
const ITEM_LIMIT = 50000;

/**
 * A mixin for all Strapi Data API services, implementing `apiFetch`, `apiGet` and `apiPost` methods.
 * @param base - The base class to which to add the mixin.
 * @returns A class that extends both the base class and the mixin class.
 */
export function strapiAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<StrapiAdapter> & TBase {
  abstract class WithMixin extends base {
    constructor(...args: Array<any>) {
      super(...args);
    }

    async apiFetch<TApi extends StrapiApi>({ endpoint, params, request }: FetchOptions<TApi>): Promise<Response> {
      if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
      const url = new URL(
        `${browser ? constants.PUBLIC_BROWSER_BACKEND_URL : constants.PUBLIC_SERVER_BACKEND_URL}/${STRAPI_API[endpoint]}`
      );
      if (params) url.search = qs.stringify(params, { encodeValuesOnly: true });
      const response = await this.fetch(url, request);
      if (!response.ok)
        throw new Error(`Error with apiFetch: ${response.status} (${response.statusText ?? '-'}) • ${url}`);
      return response;
    }

    async apiGet<TApi extends StrapiApi>({ endpoint, params }: GetOptions<TApi>): Promise<StrapiApiReturnType[TApi]> {
      if (!params?.pagination?.pageSize) {
        params ??= {};
        params.pagination ??= {};
        params.pagination.pageSize = ITEM_LIMIT; // Default to the maximum limit if no pagination is set.
      }
      const response = await this.apiFetch({ endpoint, params });
      const parsed = await response.json();
      if ('error' in parsed)
        throw new Error(`Error with apiGet: ${parsed?.error?.message ?? '—'} • ${endpoint} / ${params}`);
      return parsed.data;
    }

    async apiPost<TApi extends StrapiApi>({ endpoint, request }: PostOptions<TApi>): Promise<Response> {
      request ??= {};
      request.method = 'POST';
      request.headers ??= { 'Content-Type': 'application/json' };
      return this.apiFetch({ endpoint, request });
    }
  }

  return WithMixin;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;
