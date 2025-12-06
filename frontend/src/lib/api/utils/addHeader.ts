/**
 * Add a header to the request.
 * @returns The updated request.
 */
export function addHeader(headers: HeadersInit | undefined, key: string, value: string): Headers {
  const out = new Headers(headers);
  out.set(key, value);
  return out;
}
