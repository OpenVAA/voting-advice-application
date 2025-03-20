/**
 * The list of header names in lower-case that may contain authentication credentials. The headers are case insensitive.
 */
const AUTH_HEADERS = ['authorization', 'proxy-authorization'];

/**
 * Check if the given `HeadersInit` contain any authentication credentials.
 */
export function hasAuthHeaders(headers: HeadersInit | null | undefined): boolean {
  return new Headers(headers ?? undefined).keys().some((k) => AUTH_HEADERS.includes(k.toLowerCase()));
}
