import type { WithAuth, WithTargetEntity } from '$lib/api/base/dataWriter.type';
import type { GetOptions, PostOptions } from '$lib/api/base/universalAdapter.type';
import type { StrapiApi, StrapiApiReturnType } from './strapiApi';

/**
 * Common base mixin for all Strapi Data API services.
 */
export interface StrapiAdapter {
  /**
   * Perform a `GET` request to the Strapi API.
   * @returns The Strapi data associated with the API endpoint.
   */
  apiGet: <TApi extends StrapiApi>(opts: StrapiApiGetOptions<TApi>) => Promise<StrapiApiReturnType[TApi]>;

  /**
   * Perform a `POST` or `PUT` request to the Strapi API.
   * @returns The `Response` from the Strapi API.
   */
  apiPost: <TApi extends StrapiApi>(opts: StrapiApiPostOptions<TApi>) => Promise<StrapiApiReturnType[TApi]>;

  /**
   * Upload files to Strapi.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity owning the files.
   * @param target.id - The id of the entity owning the files.
   * @param files - An `Array` of or a single `File` object to upload.
   * @returns The `Response` from the Strapi API.
   */
  apiUpload: (opts: StrapiApiUploadOptions) => Promise<StrapiApiReturnType['upload']>;
}

export type StrapiApiOptionsBase<TApi extends StrapiApi> = {
  /**
   * The name of the Strapi API endpoint.
   */
  endpoint: TApi;
  /**
   * The endpoint (path) parameters. Note that query parameters are passed in the `params` property.
   */
  endpointParams?: Record<string, string>;
};

export type StrapiApiGetOptions<TApi extends StrapiApi> = StrapiApiOptionsBase<TApi> & Omit<GetOptions, 'url'>;

export type StrapiApiPostOptions<TApi extends StrapiApi> = StrapiApiOptionsBase<TApi> & Omit<PostOptions, 'url'>;

export type StrapiApiUploadOptions = WithTargetEntity &
  WithAuth & {
    /**
     * The file or files to upload.
     */
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
