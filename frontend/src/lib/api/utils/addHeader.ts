/**
 * Add a header to the request.
 * @returns The updated request.
 */
export function addHeader(request: RequestInit | undefined, key: string, value: string): RequestInit {
  request ??= {};
  request.headers = new Headers(request.headers);
  request.headers.set(key, value);
  return request;
}
