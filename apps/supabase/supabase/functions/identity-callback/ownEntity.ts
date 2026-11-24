/**
 * The identity's own entity: the reading of the find-or-create's answer.
 *
 * This module reaches the Deno runtime global nowhere and imports from a remote origin nowhere -- no environment read, no server registration, no URL import -- so it can be imported by both the Edge Function and vitest.
 *
 * THE RECORD. `private.identity_registrations` holds one row per account, project and entity type, naming the entity the identity registered there. `public.identity_entity_find_or_create` reads and writes it, under a lock on the account, in the transaction that finds or creates the entity, and answers only the result and the entity id; the Edge Function neither reads nor writes the record, and the record is never part of the account's `app_metadata`.
 *
 * WHY THE RECORD RATHER THAN THE USER'S GRANTS. One user may hold editor grants on several entities of one project, given by an administrator or claimed from invitations. "An entity of that type this user edits" is therefore not "the entity this identity registered". The record names the one this identity registered, and nothing else is matched: no name, no birth date and no other claim of the provider's assertion.
 *
 * WHY EVERY UNEXPECTED ANSWER IS A THROW. A caller that misread an answer would hand a session to an identity whose entity was not resolved, so {@link findOrCreateOutcome} accepts the three answers the database function gives and throws for anything else.
 */

import { IDENTITY_CALLBACK_RESULT } from './requestContract.ts';
import { isPlainObject, isUuid } from '../_shared/guards.ts';

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
}

/**
 * Read the answer of `public.identity_entity_find_or_create`, which answers `{ result, entity_id }`.
 *
 * `created` and `found` must carry a uuid; `gone` must carry a null id. Any other shape is a throw, never a guess, because a misread answer would hand a session to an identity whose entity was not resolved.
 *
 * @param answer - The function's answer, of any type.
 * @returns The function's own result and the entity id.
 * @throws {Error & { code: string }} `ERR_ENTITY_RESOLVE_FAILED` for any other shape. The message names no id.
 */
export function findOrCreateOutcome(answer: unknown): FindOrCreateOutcome {
  if (!isPlainObject(answer)) throw unexpectedAnswer();
  const { result: answered, entity_id: entityId } = answer;
  if (typeof answered !== 'string' || !Object.hasOwn(FIND_OR_CREATE_RESULTS, answered)) throw unexpectedAnswer();
  const result = FIND_OR_CREATE_RESULTS[answered as keyof typeof FIND_OR_CREATE_RESULTS];

  if (result === IDENTITY_CALLBACK_RESULT.no_entity) {
    if (entityId !== null) throw unexpectedAnswer();
    return { result, entityId: null };
  }

  if (!isUuid(entityId)) throw unexpectedAnswer();
  return { result, entityId };
}

function unexpectedAnswer(): Error & { code: string } {
  return Object.assign(new Error('The entity find-or-create answered an unexpected shape.'), {
    code: 'ERR_ENTITY_RESOLVE_FAILED'
  });
}
