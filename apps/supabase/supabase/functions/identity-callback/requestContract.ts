/**
 * The wire contract of the identity-callback Edge Function: what a request is, and the closed set of answers.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * An answer is built here from one result of a closed set and carries no caught message, because a message from the token's decryption or verification would tell an unauthenticated caller which check its token failed. A token is returned only with a success.
 */

import { ENTITY_TYPES } from './registrationMatrix.ts';
import type { ServedEntityType } from './registrationMatrix.ts';

/** An entity type a request may name: one the registration-mode rule decides about. */
export type RequestedEntityType = ServedEntityType;

/** A parsed request. */
export interface IdentityCallbackRequest {
  /** The ID token as sent, compact-serialised, signed or encrypted. */
  idToken: string;
  /** The project the registration is for, lower-cased. */
  projectId: string;
  /** The entity type the caller asks for, or null when the body names none. */
  entityType: RequestedEntityType | null;
}

/**
 * The results the function answers with, each keyed by its own spelling.
 *
 * `created`, `found` and `no_entity` are the successes: an entity was created, an existing one was found, or the identity holds no entity to sign in to. The others are failures: the registration mode is not allowed for the type, the token did not verify, the request could not be read, the caller was refused, the deployment is not configured, or a dependency did not answer.
 */
export const IDENTITY_CALLBACK_RESULT = Object.freeze({
  created: 'created',
  found: 'found',
  no_entity: 'no_entity',
  mode_not_allowed: 'mode_not_allowed',
  invalid_token: 'invalid_token',
  bad_request: 'bad_request',
  refused: 'refused',
  configuration: 'configuration',
  unavailable: 'unavailable'
} as const);

/** One result of the function. */
export type IdentityCallbackResult = (typeof IDENTITY_CALLBACK_RESULT)[keyof typeof IDENTITY_CALLBACK_RESULT];

/** A result that comes with a token. */
type SuccessResult = 'created' | 'found' | 'no_entity';

/** The HTTP status of each result. */
const RESULT_STATUS: Readonly<Record<IdentityCallbackResult, number>> = Object.freeze({
  created: 200,
  found: 200,
  no_entity: 200,
  mode_not_allowed: 403,
  invalid_token: 401,
  bad_request: 400,
  refused: 401,
  configuration: 500,
  unavailable: 503
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The longest ID token read. An encrypted token of the supported providers is a few kilobytes. */
const ID_TOKEN_MAX_LENGTH = 16384;

function isAbsent(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

function isRequestedEntityType(value: unknown): value is RequestedEntityType {
  return ENTITY_TYPES.some((entityType) => entityType === value);
}

/** A value that is one of the results, against a runtime value of any kind. */
function asResult(result: unknown): IdentityCallbackResult {
  return typeof result === 'string' && Object.hasOwn(RESULT_STATUS, result)
    ? (result as IdentityCallbackResult)
    : IDENTITY_CALLBACK_RESULT.unavailable;
}

function isSuccess(result: IdentityCallbackResult): result is SuccessResult {
  return RESULT_STATUS[result] === 200;
}

/**
 * Parse a request body.
 *
 * Unknown keys are ignored. The project is required: the function serves every project of a deployment, and only the request says which one a registration is for. An absent or null `entity_type` reads as none; one that is present with any other value than an entity type of the closed set makes the whole body malformed.
 *
 * @param body - The decoded JSON body, of any shape
 * @returns The parsed request, or null when the body is not an object, carries no ID token of one to 16384 characters, carries no project that is a uuid, or carries an entity type that is not acceptable
 */
export function parseIdentityCallbackRequest(body: unknown): IdentityCallbackRequest | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { id_token: idToken, project_id: project, entity_type: entityType } = body as Record<string, unknown>;

  if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > ID_TOKEN_MAX_LENGTH) return null;

  if (typeof project !== 'string' || !UUID_PATTERN.test(project)) return null;

  if (!isAbsent(entityType) && !isRequestedEntityType(entityType)) return null;

  return { idToken, projectId: project.toLowerCase(), entityType: isAbsent(entityType) ? null : entityType };
}

/**
 * The HTTP status a result is answered with.
 *
 * @param result - The result
 * @returns 200 for a success, 400, 401, 403, 500 or 503 for a failure, and 503 for a runtime value that is no result
 */
export function resultStatus(result: IdentityCallbackResult): number {
  return RESULT_STATUS[asResult(result)];
}

/**
 * The body a result is answered with.
 *
 * @param result - The result
 * @param token - The sign-in token, for a success
 * @returns `{ result, token }` for a success given a token, and `{ result }` otherwise; a runtime value that is no result is answered as `unavailable`, so no other answer can leave the function
 */
export function resultBody(
  result: IdentityCallbackResult,
  token?: string
): { result: IdentityCallbackResult } | { result: SuccessResult; token: string } {
  const answered = asResult(result);
  if (isSuccess(answered) && typeof token === 'string') return { result: answered, token };
  return { result: answered };
}
