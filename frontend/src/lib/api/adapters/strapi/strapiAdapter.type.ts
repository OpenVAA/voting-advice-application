import type { StrapiApi, StrapiApiReturnType } from './strapiApi';

/**
 * Common base mixin for all Strapi Data API services.
 */
export interface StrapiAdapter {
  /**
   * Perform a `fetch` request to the Strapi API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the Strapi API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @param request - Optional `RequestInit` for the request.
   * @returns The succesful `Response` from the Strapi API.
   * @throws An error if the request fails or if `Response.ok` is not `true`.
   */
  apiFetch: <TApi extends StrapiApi>(opts: FetchOptions<TApi>) => Promise<Response>;

  /**
   * Perform a `GET` request to the Strapi API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the Strapi API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @returns The Strapi data associated with the API endpoint.
   */
  apiGet: <TApi extends StrapiApi>(opts: GetOptions<TApi>) => Promise<StrapiApiReturnType[TApi]>;

  /**
   * Perform a `POST` request to the Strapi API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the Strapi API endpoint.
   * @param request - Optional `RequestInit` for the request. `method: 'POST'` and `headers.'Content-Type': 'application/json'` will be automatically set if not set.
   * @returns The `Response` from the Strapi API.
   */
  apiPost: <TApi extends StrapiApi>(opts: PostOptions<TApi>) => Promise<Response>;
}

export type FetchOptions<TApi extends StrapiApi> = {
  endpoint: TApi;
  params?: Params;
  request?: RequestInit;
};
export type GetOptions<TApi extends StrapiApi> = Omit<FetchOptions<TApi>, 'request'>;
export type PostOptions<TApi extends StrapiApi> = Omit<FetchOptions<TApi>, 'params'>;

/**
 * An incomplete typing for Strapi REST API params.
 */
export interface Params extends ParamsBase {
  pagination?: {
    pageSize?: number;
  };
}

interface ParamsBase {
  filters?: FilterParams;
  populate?: Record<string, ParamsBase | string>;
}

export interface FilterParams {
  [key: string]: FilterParams | string | Array<string> | Array<FilterParams>;
}
