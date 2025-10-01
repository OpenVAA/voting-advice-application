import type qs from 'qs';
import type { ResponseParser } from '../utils/parseResponse';

export type AdapterConfig = {
  /**
   * The `fetch` function the `DataProvider` will use to make API calls.
   */
  fetch: Fetch | undefined;
};

export type FetchOptions = {
  /**
   * Optional authentication token for the request. If provided, it will be included in the `Authorization` header.
   */
  authToken?: string;
  /**
   * Whether to disable built-in disk caching for the request. Note that this setting is not reflected in the actual network request.
   */
  disableCache?: boolean;
};

export type GetOptions<TParser extends ResponseParser | undefined = undefined> = CommonGetAndPostOptions<TParser> & {
  /**
   * URL parameters to append to the base URL.
   */
  params?: SearchParams;
  /**
   * If `true`, the `DELETE` method will be used instead of the `POST` method.
   */
  delete?: boolean;
};

export type PostOptions<TParser extends ResponseParser | undefined = undefined> = CommonGetAndPostOptions<TParser> & {
  /**
   * Any serializable data to send as the request body. Note that if you're passing, e.g., `FormData` object, pass it in `init.body` instead.
   */
  body?: Parameters<typeof JSON.stringify>[0];
  /**
   * If `true`, the `PUT` method will be used instead of the `POST` method.
   */
  put?: boolean;
};

export type CommonGetAndPostOptions<TParser extends ResponseParser | undefined = undefined> = FetchOptions & {
  /**
   * The base URL to fetch.
   */
  url: string | URL;
  /**
   * Additional request options.
   */
  init?: RequestInit;
  /**
   * The method to use for parsing the response body. If `'none'`, the response will be returned as is. Default: `'json'`.
   */
  parser?: TParser;
};

export type SearchParams = Parameters<typeof qs.stringify>[0];
