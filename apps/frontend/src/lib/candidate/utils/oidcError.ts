/**
 * The error values the OIDC callback endpoint puts on the preregistration page's query string.
 *
 * This is the single declaration site. The endpoint imports `OIDC_ERROR` rather than spelling the values inline, so a rename is one edit and a typo is a compile error.
 *
 * The four values below are chosen by this application and describe which stage of the bank authentication flow failed. They are an operator-facing contract: the bank authentication runbook tells an operator to read the query parameter and names three of these spellings verbatim, so they are pinned by a colocated test rather than left free to drift.
 *
 * A fifth case exists and is deliberately NOT a member of this union: when the identity provider itself reports an error, the endpoint reflects the provider's own value. That value is chosen upstream, so no closed union here could enumerate it. Widening this union to `string` to accommodate it would throw away the checking the other four get, so the widening is confined to one named function, `upstreamOidcError`, and is visible at the call site that needs it.
 */

/**
 * Mark a value as one the identity provider chose rather than one this application defines.
 *
 * This is the ONLY place the closed set of application-chosen values is widened, and calling it is what makes the widening visible where it happens. Pass the RAW value: the route builder emits query values through `qs.stringify`, which percent-encodes them, so a value encoded by the caller first would reach the page encoded twice.
 *
 * @param value - The `error` value as the identity provider supplied it, undecorated and unencoded.
 * @returns The same value, typed as provider-supplied.
 */
export function upstreamOidcError(value: string): UpstreamOidcError {
  return value;
}

/**
 * The error values the callback endpoint itself emits, keyed by the name each call site uses.
 *
 * Typed as a `Record` over the key union so that omitting a member is a compile error rather than a silently missing case.
 */
export const OIDC_ERROR: Record<OidcErrorKey, OidcError> = {
  invalidState: 'invalid_state',
  invalidToken: 'invalid_token',
  missingCode: 'missing_code',
  tokenExchangeFailed: 'token_exchange_failed'
} as const;

/**
 * The keys call sites use to reach an `OIDC_ERROR` value. Deliberately not exported: call sites reach the values through `OIDC_ERROR`, so exporting this would add a second name for the same set with no consumer.
 */
type OidcErrorKey = 'invalidState' | 'invalidToken' | 'missingCode' | 'tokenExchangeFailed';

/**
 * The wire spellings that appear on the query string. Changing one changes a documented operator procedure.
 */
export type OidcError = 'invalid_state' | 'invalid_token' | 'missing_code' | 'token_exchange_failed';

/**
 * An `error` value the identity provider supplied. Distinguished from `OidcError` by name only, because its contents are outside this application's control; the distinction exists so that a reader can see which of the two a given call site is passing.
 */
export type UpstreamOidcError = string;
