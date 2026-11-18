/**
 * The two reads of the per-caller limit: the caller's address from the request, and the wait from the database's answer.
 *
 * Pure functions and a constant with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * The address is passed on as the header carries it. Whether it is trusted, how it is parsed and which bucket it falls in are the database's to decide: it trusts the header only on a deployment behind Cloudflare, where Cloudflare sets it to the connecting client and refuses a value the client sent.
 */

/** The one request header the caller's address is read from. No other header is read for the caller, and the forwarded-for headers are never a fallback. */
export const CALLER_ADDRESS_HEADER = 'cf-connecting-ip';

/**
 * The caller's address, as the request carries it.
 *
 * @param headers - The request's headers
 * @returns The trimmed value of {@link CALLER_ADDRESS_HEADER}, or null when the header is absent, empty or blank
 */
export function callerAddress(headers: Headers): string | null {
  const value = headers.get(CALLER_ADDRESS_HEADER)?.trim();
  return value ? value : null;
}

/**
 * The wait the database's answer to a caller take names.
 *
 * @param value - The value the take answered, of any type
 * @returns The value when it is a positive safe integer, the seconds until the caller's window ends; null for 0, which admits the take, and for anything else
 */
export function retryAfterSeconds(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}
