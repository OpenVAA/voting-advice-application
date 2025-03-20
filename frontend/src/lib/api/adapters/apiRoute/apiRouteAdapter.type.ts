import type { Serializable } from '@openvaa/core';
import type { GetDataOptionsBase } from '$lib/api/base/getDataOptions.type';
import type { ApiGetRoute, ApiPostRoute, ApiRoute, ApiRouteReturnType } from './apiRoutes';

/**
 * Common base mixin for all API Route Data API services.
 */
export interface ApiRouteAdapter {
  /**
   * Perform a `fetch` request to the ApiRoute API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the ApiRoute API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @param request - Optional `RequestInit` for the request.
   * @param disableCache - Optional `boolean` indicating whether to disable cache for the request.
   * @returns The succesful `Response` from the ApiRoute API.
   * @throws An error if the request fails or if `Response.ok` is not `true`.
   */
  apiFetch: <TApi extends ApiRoute>(opts: FetchOptions<TApi>) => Promise<Response>;

  /**
   * Perform a `GET` request to the ApiRoute API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the ApiRoute API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @param disableCache - Optional `boolean` indicating whether to disable cache for the request.
   * @returns The ApiRoute data associated with the API endpoint.
   */
  apiGet: <TApi extends ApiGetRoute>(opts: GetOptions<TApi>) => Promise<ApiRouteReturnType<TApi>>;

  /**
   * Perform a `POST` `'Content-Type': 'application/json'` request to the ApiRoute API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the ApiRoute API endpoint.
   * @param body - Optional body for the `Request`.
   * @returns The ApiRoute data associated with the API endpoint.
   */
  apiPost: <TApi extends ApiPostRoute>(opts: PostOptions<TApi>) => Promise<ApiRouteReturnType<TApi>>;
}

export type FetchOptions<TApi extends ApiRoute> = {
  endpoint: TApi;
  params?: GetDataOptionsBase;
  request?: RequestInit;
  disableCache?: boolean;
};
export type GetOptions<TApi extends ApiGetRoute> = Omit<FetchOptions<TApi>, 'request'>;
export type PostOptions<TApi extends ApiPostRoute> = Omit<FetchOptions<TApi>, 'request' | 'params' | 'disableCache'> & {
  body?: Serializable;
};
