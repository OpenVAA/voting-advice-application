/**
 * The identity's own entity: the reading of the find-or-create's answer.
 *
 * `public.identity_entity_find_or_create` answers its result and the entity id. These cases state how that answer is read: `gone` is the function's `no_entity`, `created` and `found` carry a uuid, and every other shape is a throw that names no id.
 */

import { describe, expect, it } from 'vitest';
import { findOrCreateOutcome } from './ownEntity';

const RECORDED_ID = '22222222-2222-2222-2222-222222222222';

describe('findOrCreateOutcome', () => {
  /** An answer of the find-or-create, as the database function builds it. */
  function answer(result: string, entityId: string | null): Record<string, unknown> {
    return { result, entity_id: entityId };
  }

  it('answers created with the id the database answered', () => {
    expect(findOrCreateOutcome(answer('created', RECORDED_ID))).toEqual({ result: 'created', entityId: RECORDED_ID });
  });

  it('answers found with the recorded id', () => {
    expect(findOrCreateOutcome(answer('found', RECORDED_ID))).toEqual({ result: 'found', entityId: RECORDED_ID });
  });

  it('answers gone as no_entity, with no id', () => {
    expect(findOrCreateOutcome(answer('gone', null))).toEqual({ result: 'no_entity', entityId: null });
  });

  it.each([
    ['an answer that is not an object', null],
    ['an answer that is an array', []],
    ['a result outside the three', answer('deleted', RECORDED_ID)],
    ['a result that is not a string', answer(1 as unknown as string, RECORDED_ID)],
    ['created without an id', answer('created', null)],
    ['found with an id that is no uuid', answer('found', 'cand-1')],
    ['gone with an id', answer('gone', RECORDED_ID)]
  ])('throws ERR_ENTITY_RESOLVE_FAILED for %s, with no id in its message', (_title, given) => {
    let thrown: unknown;
    try {
      findOrCreateOutcome(given);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: 'ERR_ENTITY_RESOLVE_FAILED' });
    expect((thrown as Error).message).not.toContain(RECORDED_ID);
  });
});
