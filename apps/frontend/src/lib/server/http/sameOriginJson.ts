/**
 * The one cross-site guard of the server's JSON endpoints that browsers call with `fetch`.
 *
 * SvelteKit's own `checkOrigin` covers form posts only, not JSON bodies, so these two checks are the only defence against a cross-site post for such an endpoint. Each caller answers a failed check with its own status.
 *
 * Tested in `sameOriginJson.test.ts`.
 */

/** The media type a JSON endpoint accepts. */
const JSON_MEDIA_TYPE = 'application/json';

/**
 * Whether the request comes from a page of this origin: by `Sec-Fetch-Site` when the browser sent it, otherwise by `Origin`.
 * @param headers - The request's headers.
 * @param ownOrigin - The server's own origin.
 * @returns `true` when `Sec-Fetch-Site` is `same-origin`, or, without that header, when `Origin` equals `ownOrigin`.
 */
export function isSameOriginRequest(headers: Headers, ownOrigin: string): boolean {
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite !== null) return fetchSite === 'same-origin';
  const requestOrigin = headers.get('origin');
  return requestOrigin !== null && requestOrigin === ownOrigin;
}

/**
 * Whether the request's body is declared as JSON: the media type of `Content-Type`, the part before any parameter, trimmed and in lower case, is `application/json`.
 * @param headers - The request's headers.
 * @returns `true` when it is.
 */
export function isJsonRequest(headers: Headers): boolean {
  const mediaType = headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  return mediaType === JSON_MEDIA_TYPE;
}
