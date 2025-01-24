import { ENTITY_TYPE } from '@openvaa/data';
import qs from 'qs';
import { browser } from '$app/environment';
import { addHeader } from '$lib/api/utils/addHeader';
import { constants } from '$lib/utils/constants';
import { STRAPI_API, STRAPI_AUTH_APIS, type StrapiApi, type StrapiApiReturnType } from './strapiApi';
import type { WithAuth, WithTargetEntity } from '$lib/api/base/dataWriter.type';
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

    async apiFetch<TApi extends StrapiApi>({
      endpoint,
      params,
      request,
      endpointParams,
      authToken
    }: FetchOptions<TApi>): Promise<Response> {
      if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
      const path = insertApiParams(STRAPI_API[endpoint], endpointParams);
      const url = new URL(
        `${browser ? constants.PUBLIC_BROWSER_BACKEND_URL : constants.PUBLIC_SERVER_BACKEND_URL}/${path}`
      );
      if (params) url.search = qs.stringify(params, { encodeValuesOnly: true });
      if (authToken) request = addHeader(request, 'Authorization', `Bearer ${authToken}`);
      const response = await this.fetch(url, request);
      if (!response.ok)
        throw new Error(`Error with apiFetch: ${response.status} (${response.statusText ?? '-'}) • ${url}`);
      return response;
    }

    async apiGet<TApi extends StrapiApi>({ params, ...rest }: GetOptions<TApi>): Promise<StrapiApiReturnType[TApi]> {
      if (!params?.pagination?.pageSize) {
        params ??= {};
        params.pagination ??= {};
        params.pagination.pageSize = ITEM_LIMIT; // Default to the maximum limit if no pagination is set.
      }
      const response = await this.apiFetch({ params, ...rest });
      return parseResponse(response, { ...rest });
    }

    async apiPost<TApi extends StrapiApi>({
      body,
      put,
      ...rest
    }: PostOptions<TApi>): Promise<StrapiApiReturnType[TApi]> {
      const request = addHeader({}, 'Content-Type', 'application/json');
      request.method = put ? 'PUT' : 'POST';
      if (body) request.body = JSON.stringify(body);
      const response = await this.apiFetch({ request, ...rest });
      return parseResponse(response, rest);
    }

    apiPut<TApi extends StrapiApi>(opts: PostOptions<TApi>): Promise<StrapiApiReturnType[TApi]> {
      return this.apiPost({ ...opts, put: true });
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
      const response = await this.apiFetch({
        authToken,
        endpoint: 'upload',
        request: {
          method: 'POST',
          body: formData
        }
      });
      return parseResponse(response, { endpoint: 'upload' });
    }
  }

  return WithMixin;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: Array<any>) => TClass;

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
async function parseResponse(response: Response, { endpoint, ...rest }: { endpoint: StrapiApi }) {
  const parsed = await response.json();
  if ('error' in parsed)
    throw new Error(
      `Error in Strapi response: ${parsed?.error?.message ?? '—'} • ${JSON.stringify({ endpoint, ...rest })} `
    );
  // The auth endpoints contain the data in the root of the body, standard enpoints have it in the `data` property.
  return STRAPI_AUTH_APIS.includes(endpoint) ? parsed : parsed.data;
}
