import type { GetOptions, PostOptions } from '$lib/api/base/universalAdapter.type';
import type { ApiGetRoute, ApiPostRoute, ApiRoute, ApiRouteReturnType } from './apiRoutes';

/**
 * Common base mixin for all API Route Data API services.
 */
export interface ApiRouteAdapter {
  /**
   * Perform a `GET` request to the ApiRoute API.
   * @returns The ApiRoute data associated with the API endpoint.
   */
  apiGet: <TApi extends ApiGetRoute>(opts: ApiRouteGetOptions<TApi>) => Promise<ApiRouteReturnType<TApi>>;

  /**
   * Perform a `POST` request to the ApiRoute API.
   * @returns The ApiRoute data associated with the API endpoint.
   */
  apiPost: <TApi extends ApiPostRoute>(opts: ApiRoutePostOptions<TApi>) => Promise<ApiRouteReturnType<TApi>>;
}

export type ApiRouteOptionsBase<TApi extends ApiRoute> = {
  /**
   * The name of the API route endpoint.
   */
  endpoint: TApi;
};

export type ApiRouteGetOptions<TApi extends ApiGetRoute> = ApiRouteOptionsBase<TApi> & Omit<GetOptions, 'url'>;

export type ApiRoutePostOptions<TApi extends ApiPostRoute> = ApiRouteOptionsBase<TApi> & Omit<PostOptions, 'url'>;
