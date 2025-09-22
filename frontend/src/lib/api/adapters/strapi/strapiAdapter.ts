import { ENTITY_TYPE } from '@openvaa/data';
import { browser } from '$app/environment';
import { constants } from '$lib/utils/constants';
import { STRAPI_API, STRAPI_AUTH_APIS, type StrapiApi, type StrapiApiReturnType } from './strapiApi';
import type { WithAuth, WithTargetEntity } from '$lib/api/base/dataWriter.type';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { StrapiAdapter, StrapiApiGetOptions, StrapiApiPostOptions } from './strapiAdapter.type';
import type { StrapiResult } from './strapiData.type';

/**
 * The default limit for query results. This is set to be very high, because we don't use pagination.
 * NB! Make sure that Strapi's own config is also high enough, see `/backend/vaa-strapi/config/server.ts`
 */
const ITEM_LIMIT = 50000;

/**
 * A mixin for all Strapi Data API services.
 * @param base - The base class to which to add the mixin.
 * @returns A class that extends both the base class and the mixin class.
 */
export function strapiAdapterMixin<TBase extends Constructor>(base: TBase): Constructor<StrapiAdapter> & TBase {
  abstract class WithMixin extends base {
    constructor(...args: Array<any>) {
      super(...args);
    }

    async apiGet<TApi extends StrapiApi>({
      endpoint,
      endpointParams,
      params,
      ...rest
    }: StrapiApiGetOptions<TApi>): Promise<StrapiApiReturnType[TApi]> {
      if (!params?.pagination?.pageSize) {
        params ??= {};
        params.pagination ??= {};
        params.pagination.pageSize = ITEM_LIMIT; // Default to the maximum limit if no pagination is set.
      }
      const url = buildUrl(endpoint, endpointParams);
      const response = (await this.get({ url, params, ...rest })) as StrapiResult;
      return parseStrapiResponseData(response, endpoint) as StrapiApiReturnType[TApi];
    }

    async apiPost<TApi extends StrapiApi>({
      endpoint,
      endpointParams,
      ...rest
    }: StrapiApiPostOptions<TApi>): Promise<StrapiApiReturnType[TApi]> {
      const url = buildUrl(endpoint, endpointParams);
      const response = (await this.post({ url, ...rest })) as StrapiResult;
      return parseStrapiResponseData(response, endpoint) as StrapiApiReturnType[TApi];
    }

    async apiUpload({
      authToken,
      target: { type, id },
      files
    }: {
      files: Array<File> | File;
    } & WithTargetEntity &
      WithAuth): Promise<StrapiApiReturnType['upload']> {
      if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for uploading file: ${type}`);
      const formData = new FormData();
      formData.append('refId', id);
      // Stashed option for handling data URLs
      // if (typeof file === 'string' && file.startsWith('data:')) {
      //   const res = await fetch(file);
      //   const blob = await res.blob();
      //   const filename = `file_${getUUID()}.${blob.type.split('/')[1]}`;
      //   formData.append('files', blob, filename);
      // }
      [files].flat().forEach((f) => formData.append('files', f));

      const url = buildUrl('upload');
      const response = (await this.post({ url, authToken, init: { body: formData } })) as StrapiResult;
      return parseStrapiResponseData(response, 'upload') as StrapiApiReturnType['upload'];
    }
  }

  return WithMixin;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;

/**
 * Constructs a URL for the given endpoint and optional parameters.
 */
function buildUrl(endpoint: StrapiApi, endpointParams?: Record<string, string>): URL {
  const path = insertApiParams(STRAPI_API[endpoint], endpointParams);
  const baseUrl = browser ? constants.PUBLIC_BROWSER_BACKEND_URL : constants.PUBLIC_SERVER_BACKEND_URL;
  return new URL(`${baseUrl}/${path}`);
}

/**
 * Replace params in `base` of `:foo` with values in `params`.
 * @throws If a parameters are missing.
 */
function insertApiParams(base: string, params: Record<string, string> = {}): string {
  const parts = base.split('/');
  return parts
    .map((p) => {
      if (!p.startsWith(':')) return p;
      const key = p.slice(1);
      if (key in params) return params[key];
      throw new Error(`Missing required api parameter: ${key}`);
    })
    .join('/');
}

/**
 * Parse the data from a Strapi response.
 * @returns The parsed data.
 */
function parseStrapiResponseData(parsed: StrapiResult, endpoint: StrapiApi) {
  if ('error' in parsed) throw new Error(`Error in Strapi response: ${parsed?.error?.message ?? '—'} • ${endpoint}`);
  // The auth endpoints contain the data in the root of the body, standard enpoints have it in the `data` property.
  return STRAPI_AUTH_APIS.includes(endpoint) ? parsed : parsed.data;
}
