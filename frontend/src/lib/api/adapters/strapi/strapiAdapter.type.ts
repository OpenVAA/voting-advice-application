import type { Serializable } from 'child_process';
import type { WithAuth, WithTargetEntity } from '$lib/api/base/dataWriter.type';
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
   * @param authToken - Optional `jwt` token for the request.
   * @param endpointParams - Optional params to match params of type `:foo` in the endpoint path.
   * @returns The succesful `Response` from the Strapi API.
   * @throws An error if the request fails or if `Response.ok` is not `true`.
   * @throws If any `endpointParams` are missing that are required by the `endpoint`.
   */
  apiFetch: <TApi extends StrapiApi>(opts: FetchOptions<TApi>) => Promise<Response>;

  /**
   * Perform a `GET` request to the Strapi API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the Strapi API endpoint.
   * @param params - Optional `object` containing the query parameters for the request. It will be converted to a `URLSearchParams` object with `qs.stringify`.
   * @param authToken - Optional `jwt` token for the request.
   * @param endpointParams - Optional params to match params of type `:foo` in the endpoint path.
   * @returns The Strapi data associated with the API endpoint.
   */
  apiGet: <TApi extends StrapiApi>(opts: GetOptions<TApi>) => Promise<StrapiApiReturnType[TApi]>;

  /**
   * Perform a `POST` or `PUT` `'Content-Type': 'application/json'` request to the Strapi API, using the `fetch` passed to the adapter.
   * @param endpoint - The name of the Strapi API endpoint.
   * @param body - Optional body for the `Request`.
   * @param authToken - Optional `jwt` token for the request.
   * @param endpointParams - Optional params to match params of type `:foo` in the endpoint path.
   * @param put - If `true`, perform a `PUT` request.
   * @returns The `Response` from the Strapi API.
   */
  apiPost: <TApi extends StrapiApi>(opts: PostOptions<TApi>) => Promise<StrapiApiReturnType[TApi]>;

  /**
   * A shorthand for `apiPost({ put: true, ... })`.
   */
  apiPut: <TApi extends StrapiApi>(opts: PostOptions<TApi>) => Promise<StrapiApiReturnType[TApi]>;

  /**
   * Upload files to Strapi.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity owning the files.
   * @param target.id - The id of the entity owning the files.
   * @param files - An `Array` of or a single `File` object to upload.
   * @returns The `Response` from the Strapi API.
   */
  apiUpload: (opts: UploadOptions) => Promise<StrapiApiReturnType['upload']>;
}

export type FetchOptions<TApi extends StrapiApi> = {
  endpoint: TApi;
  params?: Params;
  request?: RequestInit;
  authToken?: string;
  endpointParams?: Record<string, string>;
  useCacheProxy?: boolean;
};
export type GetOptions<TApi extends StrapiApi> = Omit<FetchOptions<TApi>, 'request'>;
export type PostOptions<TApi extends StrapiApi> = Omit<FetchOptions<TApi>, 'request' | 'params'> & {
  body?: Serializable;
  put?: boolean;
};
export type UploadOptions = WithTargetEntity &
  WithAuth & {
    files: Array<File> | File;
  };

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
  populate?: Record<string, ParamsBase | string> | string;
}

export interface FilterParams {
  [key: string]: FilterParams | string | Array<string> | Array<FilterParams>;
}
