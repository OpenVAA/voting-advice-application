/**
 * The identity's own entity: the record's key, and the reading of the find-or-create's answer.
 *
 * The record lives in the account's `app_metadata` under one key, as `{ <project>: { <type>: <entity id> } }`, and `public.identity_entity_find_or_create` answers it whole beside its result and the entity id. These cases state how that answer is read: `gone` is the function's `no_entity`, the id must be the one the record names for the call's project and type, and every other shape is a throw that names no id.
 */

import { describe, expect, it } from 'vitest';
import { findOrCreateOutcome, REGISTERED_ENTITIES_KEY } from './ownEntity';

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';
const OTHER_PROJECT_ID = '00000000-0000-0000-0000-0000000000bb';
const RECORDED_ID = '22222222-2222-2222-2222-222222222222';
const SECOND_ID = '44444444-4444-4444-4444-444444444444';
const THIRD_ID = '66666666-6666-6666-6666-666666666666';

describe('REGISTERED_ENTITIES_KEY', () => {
  it('names the record key registered_entities', () => {
    expect(REGISTERED_ENTITIES_KEY).toBe('registered_entities');
  });
});

describe('findOrCreateOutcome', () => {
  /** An answer of the find-or-create, as the database function builds it. */
  function answer(result: string, entityId: string | null, record: unknown): Record<string, unknown> {
    return { result, entity_id: entityId, [REGISTERED_ENTITIES_KEY]: record };
  }

  it('answers created with the id the record names for the project and the type', () => {
    const record = { [PROJECT_ID]: { candidate: RECORDED_ID } };
    expect(findOrCreateOutcome(answer('created', RECORDED_ID, record), PROJECT_ID, 'candidate')).toEqual({
      result: 'created',
      entityId: RECORDED_ID,
      registeredEntities: record
    });
  });

  it('answers found with the recorded id, every other entry of the record kept', () => {
    const record = {
      [PROJECT_ID]: { candidate: SECOND_ID, organization: RECORDED_ID },
      [OTHER_PROJECT_ID]: { organization: THIRD_ID }
    };
    expect(findOrCreateOutcome(answer('found', RECORDED_ID, record), PROJECT_ID, 'organization')).toEqual({
      result: 'found',
      entityId: RECORDED_ID,
      registeredEntities: record
    });
  });

  it('answers gone as no_entity, with no id', () => {
    const record = { [PROJECT_ID]: { candidate: RECORDED_ID } };
    expect(findOrCreateOutcome(answer('gone', null, record), PROJECT_ID, 'candidate')).toEqual({
      result: 'no_entity',
      entityId: null,
      registeredEntities: record
    });
  });

  it.each(['candidate', 'organization'] as const)(
    'reads the entry of the type the call was made for, %s, and of no other type',
    (entityType) => {
      const otherType = entityType === 'candidate' ? 'organization' : 'candidate';
      const own = { [PROJECT_ID]: { [entityType]: RECORDED_ID } };
      const other = { [PROJECT_ID]: { [otherType]: RECORDED_ID } };
      expect(findOrCreateOutcome(answer('created', RECORDED_ID, own), PROJECT_ID, entityType).entityId).toBe(
        RECORDED_ID
      );
      expect(() => findOrCreateOutcome(answer('created', RECORDED_ID, other), PROJECT_ID, entityType)).toThrow(
        expect.objectContaining({ code: 'ERR_ENTITY_RESOLVE_FAILED' })
      );
    }
  );

  it.each([
    ['an answer that is not an object', null],
    ['an answer that is an array', []],
    ['a result outside the three', answer('deleted', RECORDED_ID, { [PROJECT_ID]: { candidate: RECORDED_ID } })],
    ['a result that is not a string', answer(1 as unknown as string, RECORDED_ID, {})],
    ['created without an id', answer('created', null, { [PROJECT_ID]: { candidate: RECORDED_ID } })],
    ['found with an id that is no uuid', answer('found', 'cand-1', { [PROJECT_ID]: { candidate: 'cand-1' } })],
    [
      'found with an id the record does not name',
      answer('found', SECOND_ID, { [PROJECT_ID]: { candidate: RECORDED_ID } })
    ],
    [
      'found with the id recorded in another project',
      answer('found', RECORDED_ID, { [OTHER_PROJECT_ID]: { candidate: RECORDED_ID } })
    ],
    ['gone with an id', answer('gone', RECORDED_ID, { [PROJECT_ID]: { candidate: RECORDED_ID } })],
    ['a malformed record', answer('created', RECORDED_ID, { [PROJECT_ID]: RECORDED_ID })],
    ['no record', { result: 'created', entity_id: RECORDED_ID }]
  ])('throws ERR_ENTITY_RESOLVE_FAILED for %s, with no id in its message', (_title, given) => {
    let thrown: unknown;
    try {
      findOrCreateOutcome(given, PROJECT_ID, 'candidate');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: 'ERR_ENTITY_RESOLVE_FAILED' });
    const message = (thrown as Error).message;
    for (const id of [PROJECT_ID, OTHER_PROJECT_ID, RECORDED_ID, SECOND_ID]) expect(message).not.toContain(id);
  });
});
