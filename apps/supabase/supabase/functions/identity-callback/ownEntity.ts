/**
 * The identity's own entity: the record of which entity of a project, and of a type, an identity registered, and the reading of the find-or-create's answer.
 *
 * This module reaches the Deno runtime global nowhere and imports from a remote origin nowhere -- no environment read, no server registration, no URL import -- so it can be imported by both the Edge Function and vitest.
 *
 * THE RECORD. The account's `app_metadata` holds, under {@link REGISTERED_ENTITIES_KEY}, one entity id per project and per entity type: `{ "<project id>": { "<entity type>": "<entity id>" } }`. `public.identity_entity_find_or_create` reads and writes it, under a lock on the account, in the transaction that finds or creates the entity, and answers it whole; the Edge Function writes no record of its own.
 *
 * WHY THE RECORD RATHER THAN THE USER'S GRANTS. One user may hold editor grants on several entities of one project, given by an administrator or claimed from invitations. "An entity of that type this user edits" is therefore not "the entity this identity registered". The record names the one this identity registered, and nothing else is matched: no name, no birth date and no other claim of the provider's assertion.
 *
 * WHY EVERY UNEXPECTED ANSWER IS A THROW. A caller that misread an answer would hand a session to an identity whose entity was not resolved, so {@link findOrCreateOutcome} accepts the three answers the database function gives and throws for anything else.
 */

import { IDENTITY_CALLBACK_RESULT } from './requestContract.ts';
import type { ServedEntityType } from './registrationMatrix.ts';

/** The key of `app_metadata` that holds the record. */
export const REGISTERED_ENTITIES_KEY = 'registered_entities';

/** The record: one entity id per project and per entity type. */
export type RegisteredEntities = Record<string, Partial<Record<ServedEntityType, string>>>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is a record: an object of objects of uuid strings.
 *
 * @param value - The value, of any type.
 */
function isRegisteredEntities(value: unknown): value is RegisteredEntities {
  return (
    isObject(value) &&
    Object.values(value).every(
      (entries) =>
        isObject(entries) && Object.values(entries).every((id) => typeof id === 'string' && UUID_PATTERN.test(id))
    )
  );
}

/** The answers of `public.identity_entity_find_or_create`, each mapped to the function's own result. */
const FIND_OR_CREATE_RESULTS = Object.freeze({
  created: IDENTITY_CALLBACK_RESULT.created,
  found: IDENTITY_CALLBACK_RESULT.found,
  gone: IDENTITY_CALLBACK_RESULT.no_entity
});

/** What the find-or-create's answer comes to for the function. */
export interface FindOrCreateOutcome {
  /** `created` or `found`, or `no_entity` when the recorded entity's grant or row is gone. */
  result: (typeof FIND_OR_CREATE_RESULTS)[keyof typeof FIND_OR_CREATE_RESULTS];
  /** The entity's id, or null for `no_entity`. */
  entityId: string | null;
  /** The user's whole record as stored when the call returned. */
  registeredEntities: RegisteredEntities;
}

function unexpectedAnswer(): Error & { code: string } {
  return Object.assign(new Error('The entity find-or-create answered an unexpected shape.'), {
    code: 'ERR_ENTITY_RESOLVE_FAILED'
  });
}

/**
 * Read the answer of `public.identity_entity_find_or_create`, which answers `{ result, entity_id, registered_entities }`.
 *
 * `created` and `found` must carry a uuid that the returned record names for the project and the type; `gone` must carry a null id. Any other shape is a throw, never a guess, because a misread answer would hand a session to an identity whose entity was not resolved.
 *
 * @param answer - The function's answer, of any type.
 * @param projectId - The project the request names.
 * @param entityType - The entity type the call was made for.
 * @returns The function's own result, the entity id and the record.
 * @throws {Error & { code: string }} `ERR_ENTITY_RESOLVE_FAILED` for any other shape. The message names no id.
 */
export function findOrCreateOutcome(
  answer: unknown,
  projectId: string,
  entityType: ServedEntityType
): FindOrCreateOutcome {
  if (!isObject(answer)) throw unexpectedAnswer();
  const { result: answered, entity_id: entityId } = answer;
  if (typeof answered !== 'string' || !Object.hasOwn(FIND_OR_CREATE_RESULTS, answered)) throw unexpectedAnswer();
  const result = FIND_OR_CREATE_RESULTS[answered as keyof typeof FIND_OR_CREATE_RESULTS];

  const registeredEntities = answer[REGISTERED_ENTITIES_KEY];
  if (!isRegisteredEntities(registeredEntities)) throw unexpectedAnswer();

  if (result === IDENTITY_CALLBACK_RESULT.no_entity) {
    if (entityId !== null) throw unexpectedAnswer();
    return { result, entityId: null, registeredEntities };
  }

  if (typeof entityId !== 'string' || !UUID_PATTERN.test(entityId)) throw unexpectedAnswer();
  const entries = Object.hasOwn(registeredEntities, projectId) ? registeredEntities[projectId] : {};
  if (!Object.hasOwn(entries, entityType) || entries[entityType] !== entityId) throw unexpectedAnswer();
  return { result, entityId, registeredEntities };
}
