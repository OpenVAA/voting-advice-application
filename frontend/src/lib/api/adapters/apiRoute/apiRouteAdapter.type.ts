import type { DPDataType } from '$lib/api/base/dataTypes';
import type { GetDataOptionsBase } from '$lib/api/base/getDataOptions.type';
import type { ApiGetRoute, ApiPostRoute, ApiRoute } from './apiRoutes';

/**
 * Common base mixin for all API Route Data API services.
 */
export interface ApiRouteAdapter {
  /**
   * Perform a `fetch` request to the ApiRoute API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the ApiRoute API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @param request - Optional `RequestInit` for the request.
   * @returns The succesful `Response` from the ApiRoute API.
   * @throws An error if the request fails or if `Response.ok` is not `true`.
   */
  apiFetch: <TApi extends ApiRoute>(opts: FetchOptions<TApi>) => Promise<Response>;

  /**
   * Perform a `GET` request to the ApiRoute API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the ApiRoute API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @returns The ApiRoute data associated with the API endpoint.
   */
  apiGet: <TApi extends ApiGetRoute>(opts: GetOptions<TApi>) => Promise<DPDataType[TApi]>;

  /**
   * Perform a `POST` request to the ApiRoute API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the ApiRoute API endpoint.
   * @param request - Optional `RequestInit` for the request. `method: 'POST'` and `headers.'Content-Type': 'application/json'` will be automatically set if not set.
   * @returns The `Response` from the ApiRoute API.
   */
  apiPost: <TApi extends ApiPostRoute>(opts: PostOptions<TApi>) => Promise<Response>;
}

export type FetchOptions<TApi extends ApiRoute> = {
  endpoint: TApi;
  params?: GetDataOptionsBase;
  request?: RequestInit;
};
export type GetOptions<TApi extends ApiGetRoute> = Omit<FetchOptions<TApi>, 'request'>;
export type PostOptions<TApi extends ApiPostRoute> = Omit<FetchOptions<TApi>, 'params'>;
