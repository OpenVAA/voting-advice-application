import qs from 'qs';
import { constants } from '$lib/utils/constants';
import { addHeader } from '../utils/addHeader';
import { hasAuthHeaders } from '../utils/authHeaders';
import { cachifyUrl } from '../utils/cachifyUrl';
import { type ParsedResponse, parseResponse, type ResponseParser } from '../utils/parseResponse';
import type { AdapterConfig, FetchOptions, GetOptions, PostOptions, SearchParams } from './universalAdapter.type';

const DEFAULT_PARSER = 'json' as const;

/**
 * The abstract base class for all the universal Data API services. It implements initialisation, i.e. `fetch` handling for all of these.
 */
export abstract class UniversalAdapter {
  #fetch: Fetch | undefined;

  /**
   * The `init` method must be called before using any of the `DataProvider` methods.
   * @returns Self for method chaining.
   */
  init({ fetch }: AdapterConfig): this {
    this.#fetch = fetch;
    return this;
  }

  /**
   * The `fetch` wrapped in possible caching.
   * @param url - The URL to fetch
   * @param init - The request options.
   * @param options - Additional options for the fetch request.
   *
   * `GET` requests are cached if:
   * - The `CACHE_ENABLED` env variable is `'true'`.
   * - The `disableCache` option is not set in the `fetch` options.
   * - The `Authorization` header is not present.
   */
  async fetch(
    url: string | URL,
    init: RequestInit = {},
    { authToken, disableCache }: FetchOptions = {}
  ): Promise<Response> {
    if (!this.#fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');

    const { headers, ...initRest } = init;
    const fullHeaders = authToken ? addHeader(headers, 'Authorization', `Bearer ${authToken}`) : headers;

    const isCacheEnabled =
      constants.PUBLIC_CACHE_ENABLED &&
      !disableCache &&
      (!init?.method || init.method === 'GET') &&
      !hasAuthHeaders(fullHeaders);
    const maybeCachedUrl = isCacheEnabled ? cachifyUrl(url) : url;

    const fullInit: RequestInit = { ...initRest };
    if (fullHeaders) fullInit.headers = fullHeaders;

    const response = await this.#fetch(maybeCachedUrl, fullInit).catch((error) => {
      throw new Error(
        `Error with UniversalAdapter.fetch when fetching '${maybeCachedUrl}': ${error instanceof Error ? error.message : error}`
      );
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body?.message ?? '(Could not parse error message from Response.)';
      throw new Error(
        `Error with UniversalAdapter.fetch when parsing response from '${maybeCachedUrl}': ${response.status} • ${message}`
      );
    }

    return response;
  }

  /**
   * Perform a `GET` or `DELETE` request using `this.fetch`, parsing by default the response json.
   */
  async get<TParser extends ResponseParser | undefined>({
    url,
    params,
    isDelete,
    init = {},
    parser = DEFAULT_PARSER,
    ...options
  }: GetOptions<TParser>): Promise<ParsedResponse<undefined extends TParser ? typeof DEFAULT_PARSER : TParser>> {
    const response = await this.fetch(
      mergeParams(url, params),
      {
        ...init,
        method: isDelete ? 'DELETE' : 'GET'
      },
      options
    );
    return parseResponse(response, parser) as ParsedResponse<
      undefined extends TParser ? typeof DEFAULT_PARSER : TParser
    >;
  }

  /**
   * Perform a `DELETE` request using `this.fetch`, parsing by default the response json.
   */
  async delete<TParser extends ResponseParser | undefined>(
    args: Omit<GetOptions<TParser>, 'isDelete'>
  ): Promise<ParsedResponse<undefined extends TParser ? typeof DEFAULT_PARSER : TParser>> {
    return this.get({ ...args, isDelete: true });
  }

  /**
   * Perform a `POST` or `PUT` request using `this.fetch`, parsing by default the response json.
   */
  async post<TParser extends ResponseParser | undefined>({
    url,
    body,
    isPut,
    init = {},
    parser = DEFAULT_PARSER,
    ...options
  }: PostOptions<TParser>): Promise<ParsedResponse<undefined extends TParser ? typeof DEFAULT_PARSER : TParser>> {
    const { headers, body: initBody, ...initRest } = init;
    let fullHeaders = headers;
    let bodyString: string | undefined;

    if (body) {
      if (initBody) throw new Error('Cannot pass both body and init.body.');
      if (shouldNotStringify(body))
        throw new Error('Do not pass non-serializable data to the body. Use init.body instead.');
      fullHeaders = addHeader(fullHeaders, 'Content-Type', 'application/json');
      bodyString = JSON.stringify(body);
    }

    const fullInit: RequestInit = { ...initRest, method: isPut ? 'PUT' : 'POST' };
    if (fullHeaders) fullInit.headers = fullHeaders;
    if (initBody || bodyString) fullInit.body = initBody ?? bodyString;

    const response = await this.fetch(url, fullInit, options);
    return parseResponse(response, parser) as ParsedResponse<
      undefined extends TParser ? typeof DEFAULT_PARSER : TParser
    >;
  }

  /**
   * Perform a `PUT` request using `this.fetch`, parsing by default the response json.
   */
  async put<TParser extends ResponseParser | undefined>(
    args: Omit<PostOptions<TParser>, 'isPut'>
  ): Promise<ParsedResponse<undefined extends TParser ? typeof DEFAULT_PARSER : TParser>> {
    return this.post({ ...args, isPut: true });
  }
}

function mergeParams(url: URL | string, params: SearchParams): URL | string {
  if (!params) return url;
  url = url.toString();
  if (url.includes('?')) throw new Error('Params cannot be added to the URL if it already contains query parameters.');
  return `${url}?${qs.stringify(params, { encodeValuesOnly: true })}`;
}

function shouldNotStringify(body: JSONData): boolean {
  return (
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream ||
    ArrayBuffer.isView(body)
  );
}
