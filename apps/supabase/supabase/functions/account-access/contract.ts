/**
 * The wire contract of the account-access Edge Function: what a request is, and the closed set of answers.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * Every answer the function can give is built here. Apart from the three words of the code check, none of them carries anything that depends on whether an address, a code or an account exists, which is what keeps the endpoint from telling an anonymous caller who was invited or who has registered.
 *
 * The exceptions are the `in-use` and `invited` answers of `confirm-address`. `in-use` tells a signed-in caller that the address they typed for their own account is another account's; `invited` tells them that an open invitation of the project holds it. Each tells them something they cannot act on otherwise: an account an identity provider made claims no invitation, so the invited person signs in by email with their invitation instead. Both answers have the same bounds: the caller is authenticated by their own access token; only an account an identity provider made, whose address is still the placeholder, is answered at all, and only for a project that account registered in; and the database gives one account ten such requests per quarter hour and one address one per minute, whatever project the requests name, before the address is looked at.
 */

import { constantTimeEqual } from '../_shared/constantTimeEqual.ts';
import { isPlainObject, isUuid } from '../_shared/guards.ts';

/** The three words a code check can answer. */
export type CodeStatus = 'valid' | 'used' | 'unknown';

/** A parsed `check-code` request. */
export interface CheckCodeRequest {
  operation: 'check-code';
  /** The project the code is looked up in, lower-cased. */
  projectId: string;
  code: string;
}

/** A parsed `request-link` request. At least one of `email` and `code` is a string. */
export interface RequestLinkRequest {
  operation: 'request-link';
  /** The project the request is about, lower-cased. */
  projectId: string;
  /** The address as typed, or null when the request names a code only. */
  email: string | null;
  /** The code as typed, or null when the request names an address only. */
  code: string | null;
  /** The locale as sent. It is resolved against the supported set where the mail is rendered. */
  locale: string | undefined;
  /** The id of a completion record the service role opened, lower-cased, or null. Kept only for a request made with the service role's key (see {@link admitWitness}). */
  witness: string | null;
}

/** The apps a recovery request can be made in. A request that names none is the Contestant App's. */
export const LINK_APPS = ['contestant', 'admin'] as const;

/** An app a recovery request can name. */
export type LinkApp = (typeof LINK_APPS)[number];

/** A parsed `request-recovery` request: a project, an address, the app it was made in, and nothing else that decides anything. */
export interface RequestRecoveryRequest {
  operation: 'request-recovery';
  /** The project the request is about, lower-cased. */
  projectId: string;
  /** The address as typed. */
  email: string;
  /** The locale as sent. It is resolved against the supported set where the mail is rendered. */
  locale: string | undefined;
  /** The id of a completion record the service role opened, lower-cased, or null. Kept only for a request made with the service role's key (see {@link admitWitness}). */
  witness: string | null;
  /** The app the request was made in, one of {@link LINK_APPS}; a request that names none is the Contestant App's. It decides which app the mailed link lands in, and nothing else. */
  app: LinkApp;
}

/** A parsed `code-sign-in` request. */
export interface CodeSignInRequest {
  operation: 'code-sign-in';
  /** The project the code is looked up in, lower-cased. */
  projectId: string;
  code: string;
  password: string;
}

/** A parsed `confirm-address` request. The caller is named by the access token of the request's `Authorization` header, never by the body. */
export interface ConfirmAddressRequest {
  operation: 'confirm-address';
  /** The project the request is made in, lower-cased. It must be one the caller's account registered in; the slots the request takes are not per project. */
  projectId: string;
  /** The address as typed. */
  email: string;
  /** The locale as sent. It is resolved against the supported set where the mail is rendered. */
  locale: string | undefined;
}

/** Any well-formed request. */
export type AccountAccessRequest =
  CheckCodeRequest | RequestLinkRequest | RequestRecoveryRequest | CodeSignInRequest | ConfirmAddressRequest;

/** The five outcomes of an address confirmation. */
export type AddressConfirmationOutcome = 'sent' | 'in-use' | 'invited' | 'refused' | 'unauthenticated';

/** The two tokens of a session, as the auth service names them. */
export interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

const CODE_MAX_LENGTH = 64;
const EMAIL_MIN_LENGTH = 3;
const EMAIL_MAX_LENGTH = 320;
const PASSWORD_MAX_LENGTH = 1024;

/** The marker {@link optional} answers for a field that is present and not acceptable. */
const MALFORMED = Symbol('malformed');

/** The one answer of `request-link` and of `request-recovery`, whatever the request asked for and whatever became of it. */
export const ACCEPTED_BODY = Object.freeze({ accepted: true } as const);

/** The answer to a body that is not a well-formed request. */
export const BAD_REQUEST_BODY = Object.freeze({ error: 'bad-request' } as const);

/** The answer to a method other than `POST` and `OPTIONS`. */
export const METHOD_NOT_ALLOWED_BODY = Object.freeze({ error: 'method-not-allowed' } as const);

/** The answer when a dependency of the function failed during a code check. */
export const INTERNAL_ERROR_BODY = Object.freeze({ error: 'internal' } as const);

/** The one answer to every failed code sign-in: an unknown code, a wrong password, a claimant with no password, a spent attempt budget. */
export const INVALID_CREDENTIALS_BODY = Object.freeze({ result: 'invalid-credentials' } as const);

/** The answer when an address-confirmation mail was handed to the transport. */
export const ADDRESS_SENT_BODY = Object.freeze({ result: 'sent' } as const);

/** The answer when another account holds the address the caller typed. */
export const ADDRESS_IN_USE_BODY = Object.freeze({ result: 'in-use' } as const);

/** The answer when an open invitation of the project holds the address the caller typed: the invited person signs in by email with the invitation. */
export const ADDRESS_INVITED_BODY = Object.freeze({ result: 'invited' } as const);

/** The one answer to every other address confirmation that sent nothing: a caller who may not ask, an address that may not be asked for, a request over the limit, any failure. */
export const ADDRESS_REFUSED_BODY = Object.freeze({ result: 'refused' } as const);

/** The answer to an address confirmation without the access token of a signed-in account. */
export const UNAUTHENTICATED_BODY = Object.freeze({ error: 'unauthenticated' } as const);

/**
 * The status and body of an address confirmation's outcome.
 *
 * @param outcome - What the confirmation came to
 * @returns 401 with the unauthenticated body, or 200 with the body of `sent`, `in-use`, `invited` or `refused`; any other runtime value is answered as `refused`, so a sixth answer cannot leave the function
 */
export function addressConfirmationAnswer(outcome: AddressConfirmationOutcome): {
  status: 200 | 401;
  body:
    | typeof ADDRESS_SENT_BODY
    | typeof ADDRESS_IN_USE_BODY
    | typeof ADDRESS_INVITED_BODY
    | typeof ADDRESS_REFUSED_BODY
    | typeof UNAUTHENTICATED_BODY;
} {
  if (outcome === 'unauthenticated') return { status: 401, body: UNAUTHENTICATED_BODY };
  if (outcome === 'sent') return { status: 200, body: ADDRESS_SENT_BODY };
  if (outcome === 'in-use') return { status: 200, body: ADDRESS_IN_USE_BODY };
  if (outcome === 'invited') return { status: 200, body: ADDRESS_INVITED_BODY };
  return { status: 200, body: ADDRESS_REFUSED_BODY };
}

/**
 * The answer of a code check.
 *
 * @param status - The word the database returned
 * @returns `{ status }` for one of the three words, and `{ status: 'unknown' }` for any other runtime value, so a fourth answer cannot leave the function whatever the database returns
 */
export function codeStatusBody(status: CodeStatus): { status: CodeStatus } {
  return { status: status === 'valid' || status === 'used' ? status : 'unknown' };
}

/**
 * The answer of a successful code sign-in.
 *
 * @param tokens - The session's two tokens
 * @returns The signed-in body carrying exactly those two tokens and nothing about the user
 */
export function signedInBody(tokens: SessionTokens): { result: 'signed-in' } & SessionTokens {
  return { result: 'signed-in', access_token: tokens.access_token, refresh_token: tokens.refresh_token };
}

/**
 * Parse a request body into one of the five operations.
 *
 * Unknown keys are ignored, and so is a key another operation reads: a recovery request's `code` and a link request's `app` are not looked at. A `witness` that is not a uuid is dropped and the request still parses, because the field changes no answer. An optional field that is present with the wrong type or length makes the whole body malformed.
 *
 * @param body - The decoded JSON body, of any shape
 * @returns The parsed request, or null when the body is not an object, names no known operation, carries no uuid as `project_id`, lacks a field its operation requires or exceeds a length bound
 */
export function parseAccountAccessRequest(body: unknown): AccountAccessRequest | null {
  if (!isPlainObject(body)) return null;
  const { operation, project_id: project } = body;
  if (!isUuid(project)) return null;
  const projectId = project.toLowerCase();

  if (operation === 'check-code') {
    if (!isCode(body.code)) return null;
    return { operation, projectId, code: body.code };
  }

  if (operation === 'request-link') {
    const email = optional(body.email, isEmail);
    const code = optional(body.code, isCode);
    const locale = optional(body.locale, isString);
    if (email === MALFORMED || code === MALFORMED || locale === MALFORMED) return null;
    if (email === null && code === null) return null;
    return { operation, projectId, email, code, locale: locale ?? undefined, witness: witnessOf(body.witness) };
  }

  if (operation === 'request-recovery') {
    if (!isEmail(body.email)) return null;
    const locale = optional(body.locale, isString);
    const app = optional(body.app, isLinkApp);
    if (locale === MALFORMED || app === MALFORMED) return null;
    return {
      operation,
      projectId,
      email: body.email,
      locale: locale ?? undefined,
      witness: witnessOf(body.witness),
      app: app ?? 'contestant'
    };
  }

  if (operation === 'confirm-address') {
    if (!isEmail(body.email)) return null;
    const locale = optional(body.locale, isString);
    if (locale === MALFORMED) return null;
    return { operation, projectId, email: body.email, locale: locale ?? undefined };
  }

  if (operation === 'code-sign-in') {
    if (!isCode(body.code)) return null;
    if (!isStringOfLength(body.password, 1, PASSWORD_MAX_LENGTH)) return null;
    return { operation, projectId, code: body.code, password: body.password };
  }

  return null;
}

function isCode(value: unknown): value is string {
  return isStringOfLength(value, 1, CODE_MAX_LENGTH);
}

function isStringOfLength(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

/** An optional field: null when absent, the value when it is acceptable, and the malformed marker when it is present and is not. */
function optional<TValue extends string>(
  value: unknown,
  accepts: (candidate: unknown) => candidate is TValue
): TValue | null | typeof MALFORMED {
  if (isAbsent(value)) return null;
  return accepts(value) ? value : MALFORMED;
}

function isAbsent(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

function isEmail(value: unknown): value is string {
  return isStringOfLength(value, EMAIL_MIN_LENGTH, EMAIL_MAX_LENGTH) && value.includes('@');
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** The witness a request names: its id in lower case when it is a uuid, and null for anything else. */
function witnessOf(value: unknown): string | null {
  return isUuid(value) ? value.toLowerCase() : null;
}

/**
 * Whether a value is one of {@link LINK_APPS}, compared exactly.
 * @param value - Any value.
 * @returns `true` for a member of the set.
 */
export function isLinkApp(value: unknown): value is LinkApp {
  return typeof value === 'string' && (LINK_APPS as ReadonlyArray<string>).includes(value);
}

/**
 * Keep a request's completion witness only when the request carries the service role's key as its bearer, and drop it otherwise.
 *
 * A witness is a test instrument: it names a completion record the service role opened, which the background work of a link or a recovery request completes. Only the service role opens such a record, so only a request made with its key may name one, and an anonymous request's witness is ignored. The keys are compared in full, in time that does not depend on where they first differ.
 *
 * @param request - The parsed request.
 * @param authorization - The request's `Authorization` header, or null.
 * @param serviceRoleKey - The service role's key the function runs with; an unset or empty key admits nothing.
 * @returns The request unchanged when it carries no witness or its witness is admitted, and otherwise a copy whose witness is null.
 */
export function admitWitness<TRequest extends AccountAccessRequest>(
  request: TRequest,
  authorization: string | null,
  serviceRoleKey: string | undefined
): TRequest {
  if (!('witness' in request) || request.witness === null) return request;
  if (serviceRoleKey && authorization !== null && constantTimeEqual(authorization, `Bearer ${serviceRoleKey}`))
    return request;
  return { ...request, witness: null };
}
