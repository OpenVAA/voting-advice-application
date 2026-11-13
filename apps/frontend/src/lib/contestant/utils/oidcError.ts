/**
 * The codes an identification failure is reported with, and the class the error screen shows each as.
 *
 * The callback of the identity provider's flow reports every failure as `?error=<code>` on the error screen's address. The codes are a closed set this application chooses: no value the identity provider or `identity-callback` sends passes through, each is mapped to a code first. They are an operator-facing contract, read on the address bar with `tests/IDURA-TEST-RUNBOOK.md`, so their spellings are pinned by a colocated test.
 *
 * The error screen shows a code as one of three classes, and only the class: `cancelled` for the user's own cancel, `retry` for a failure trying again may cure, `noRetry` for one it will not. A value that is not a code is shown as `retry`.
 */

/**
 * The codes, keyed by the name each call site uses.
 *
 * Typed as a `Record` over the key union so that omitting a member is a compile error rather than a silently missing case.
 */
export const OIDC_ERROR: Record<OidcErrorKey, OidcError> = {
  invalidState: 'invalid_state',
  invalidToken: 'invalid_token',
  missingCode: 'missing_code',
  tokenExchangeFailed: 'token_exchange_failed',
  cancelled: 'cancelled',
  providerError: 'provider_error',
  modeNotAllowed: 'mode_not_allowed',
  registrationFailed: 'registration_failed',
  configurationError: 'configuration_error'
} as const;

/**
 * The keys call sites use to reach an `OIDC_ERROR` value. Not exported: call sites reach the values through `OIDC_ERROR`.
 */
type OidcErrorKey =
  | 'invalidState'
  | 'invalidToken'
  | 'missingCode'
  | 'tokenExchangeFailed'
  | 'cancelled'
  | 'providerError'
  | 'modeNotAllowed'
  | 'registrationFailed'
  | 'configurationError';

/**
 * The wire spellings that appear on the error screen's address. Changing one changes a documented operator procedure.
 */
export type OidcError =
  | 'invalid_state'
  | 'invalid_token'
  | 'missing_code'
  | 'token_exchange_failed'
  | 'cancelled'
  | 'provider_error'
  | 'mode_not_allowed'
  | 'registration_failed'
  | 'configuration_error';

/**
 * The three things the error screen can say happened: the user cancelled, a failure trying again may cure, or one it will not.
 */
export type OidcErrorClass = 'cancelled' | 'retry' | 'noRetry';

/** The class of each code. Read through `Object.hasOwn`, so a name every object inherits has no class. */
const OIDC_ERROR_CLASS: Readonly<Record<OidcError, OidcErrorClass>> = Object.freeze({
  cancelled: 'cancelled',
  invalid_state: 'retry',
  missing_code: 'retry',
  token_exchange_failed: 'retry',
  provider_error: 'retry',
  registration_failed: 'retry',
  invalid_token: 'noRetry',
  mode_not_allowed: 'noRetry',
  configuration_error: 'noRetry'
});

/**
 * The class the error screen shows for a value of its `error` parameter.
 *
 * The value arrives on the address bar, so it is any text at all. Only a code the table holds as its own member has its own class; every other value, an inherited property name among them, is shown as `retry`.
 * @param value - The `error` search parameter, if any.
 * @returns The class to show.
 */
export function oidcErrorClass(value: string | null | undefined): OidcErrorClass {
  if (value == null || !Object.hasOwn(OIDC_ERROR_CLASS, value)) return 'retry';
  return OIDC_ERROR_CLASS[value as OidcError];
}

/** The one value both identity providers send when the user cancels at the provider. */
const PROVIDER_CANCEL = 'access_denied';

/**
 * The code for an `error` value the identity provider sent back to the callback.
 *
 * Its cancel is `cancelled`; every other value is `provider_error`, so nothing the provider chose reaches an address or a page.
 * @param value - The provider's `error` parameter.
 * @returns The code to report.
 */
export function oidcErrorFromProvider(value: string): OidcError {
  return value === PROVIDER_CANCEL ? OIDC_ERROR.cancelled : OIDC_ERROR.providerError;
}

/** The code for each failed `result` of `identity-callback`'s answer. Read through `Object.hasOwn`. */
const FUNCTION_RESULT_ERROR: Readonly<Record<string, OidcError>> = Object.freeze({
  mode_not_allowed: OIDC_ERROR.modeNotAllowed,
  invalid_token: OIDC_ERROR.invalidToken,
  configuration: OIDC_ERROR.configurationError,
  refused: OIDC_ERROR.configurationError,
  bad_request: OIDC_ERROR.configurationError,
  unavailable: OIDC_ERROR.registrationFailed
});

/**
 * The code for a failed answer of `identity-callback`, by the `result` its body names.
 *
 * A refused mode and a rejected token keep their meaning; the function's own configuration, a refused credential and a request it could not read are the deployment's fault, which trying again will not cure; an outage, an unknown result and an answer with no body are `registration_failed`, which it may.
 * @param result - The `result` member of the function's answer, or `undefined` when there is none.
 * @returns The code to report.
 */
export function oidcErrorFromFunction(result: unknown): OidcError {
  if (typeof result !== 'string' || !Object.hasOwn(FUNCTION_RESULT_ERROR, result)) return OIDC_ERROR.registrationFailed;
  return FUNCTION_RESULT_ERROR[result];
}
