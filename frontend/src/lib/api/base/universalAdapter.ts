import { constants } from '$lib/utils/constants';
import { cachifyUrl } from '../utils/cachifyUrl';

const AUTH_HEADERS = ['Authorization', 'Proxy-Authorization'];

/**
 * The abstract base class for all the universal Data API services. It implements initialisation, i.e. `fetch` handling for all of these.
 */
export abstract class UniversalAdapter {
  #fetch: typeof fetch | undefined;

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
  async fetch(url: string | URL, init?: RequestInit, options?: FetchOptions): Promise<Response> {
    if (!this.#fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
    const hasAuthHeaders = init?.headers
      ? Array.from(new Headers(init.headers).entries()).some(([key]) => AUTH_HEADERS.includes(key))
      : false;
    const isCacheEnabled =
      constants.PUBLIC_CACHE_ENABLED &&
      !options?.disableCache &&
      (!init?.method || init.method === 'GET') &&
      !hasAuthHeaders;
    const maybeCachedUrl = isCacheEnabled ? cachifyUrl(url) : url;
    const response = await this.#fetch(maybeCachedUrl, init).catch((error) => {
      throw new Error(
        `Error with UniversalAdapter.fetch when fetching '${maybeCachedUrl}': ${error instanceof Error ? error.message : error}`
      );
    });
    if (!response.ok) {
      const body = (await response.json().catch()) ?? {};
      const message =
        typeof body === 'object' && body?.message ? body.message : '(Could not parse error message from Response.)';
      throw new Error(
        `Error with UniversalAdapter.fetch when parsing response from '${maybeCachedUrl}': ${response.status} • ${message}`
      );
    }
    return response;
  }
}

type AdapterConfig = {
  /**
   * The `fetch` function the `DataProvider` will use to make API calls.
   */
  fetch: typeof fetch | undefined;
};

type FetchOptions = {
  /**
   * Whether to disable built-in disk caching for the request. Note that this setting is not reflected in the actual network request.
   */
  disableCache?: boolean;
};
