/**
 * `callerMayOnProject` and `callerMayOnEntity` are the Edge Functions' authority gates, so their fail-closed edges are asserted by IMPORT rather than by source text.
 *
 * What these pin: the question is put to `public.user_can` at the named scope with the permission the caller names -- the matrix lives in the database, not here -- and every answer other than a literal `true` is a denial, including an RPC error, a thrown client and a missing target id. At entity scope the entity type is always passed.
 */

import { describe, expect, it } from 'vitest';
import { callerMayOnEntity, callerMayOnProject } from './callerAuthority.ts';
import type { EntityType, RpcClient } from './callerAuthority.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';

function fakeClient(answer: { data: unknown; error: unknown }) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client: RpcClient = {
    rpc: (fn, args) => {
      calls.push({ fn, args });
      return Promise.resolve(answer);
    }
  };
  return { client, calls };
}

describe('callerMayOnProject', () => {
  it('asks user_can at project scope, for the named project and permission', async () => {
    const { client, calls } = fakeClient({ data: true, error: null });
    expect(await callerMayOnProject(client, PROJECT, 'project.edit_entities')).toBe(true);
    expect(calls).toEqual([
      {
        fn: 'user_can',
        args: { p_scope: 'project', p_target_id: PROJECT, p_permission: 'project.edit_entities' }
      }
    ]);
  });

  it('denies when user_can answers false', async () => {
    const { client } = fakeClient({ data: false, error: null });
    expect(await callerMayOnProject(client, PROJECT, 'project.edit_entities')).toBe(false);
  });

  it('denies on an RPC error even if data looks truthy', async () => {
    const { client } = fakeClient({ data: true, error: { message: 'boom' } });
    expect(await callerMayOnProject(client, PROJECT, 'project.edit_entities')).toBe(false);
  });

  it('denies on a non-boolean answer', async () => {
    const { client } = fakeClient({ data: 'true', error: null });
    expect(await callerMayOnProject(client, PROJECT, 'project.edit_entities')).toBe(false);
  });

  it('denies when the client throws', async () => {
    const client: RpcClient = {
      rpc: () => Promise.reject(new Error('network'))
    };
    expect(await callerMayOnProject(client, PROJECT, 'project.edit_entities')).toBe(false);
  });

  it.each([undefined, null, '', '   ', 42])('denies without a round trip for project id %j', async (projectId) => {
    const { client, calls } = fakeClient({ data: true, error: null });
    expect(await callerMayOnProject(client, projectId, 'project.edit_entities')).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

describe('callerMayOnEntity', () => {
  const ENTITY = '00000000-0000-0000-0000-0000000000aa';

  it('asks user_can at entity scope, with the entity type, id and permission', async () => {
    const { client, calls } = fakeClient({ data: true, error: null });
    expect(await callerMayOnEntity(client, 'organization', ENTITY, 'entity.edit_answers')).toBe(true);
    expect(calls).toEqual([
      {
        fn: 'user_can',
        args: {
          p_scope: 'entity',
          p_target_id: ENTITY,
          p_permission: 'entity.edit_answers',
          p_target_type: 'organization'
        }
      }
    ]);
  });

  it('denies when user_can answers false', async () => {
    const { client } = fakeClient({ data: false, error: null });
    expect(await callerMayOnEntity(client, 'candidate', ENTITY, 'entity.edit_answers')).toBe(false);
  });

  it('denies on an RPC error even if data looks truthy', async () => {
    const { client } = fakeClient({ data: true, error: { message: 'boom' } });
    expect(await callerMayOnEntity(client, 'candidate', ENTITY, 'entity.edit_answers')).toBe(false);
  });

  it('denies when the client throws', async () => {
    const client: RpcClient = {
      rpc: () => Promise.reject(new Error('network'))
    };
    expect(await callerMayOnEntity(client, 'candidate', ENTITY, 'entity.edit_answers')).toBe(false);
  });

  it.each([undefined, null, '', '   ', 42])('denies without a round trip for entity id %j', async (entityId) => {
    const { client, calls } = fakeClient({ data: true, error: null });
    expect(await callerMayOnEntity(client, 'candidate', entityId, 'entity.edit_answers')).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it.each(['', 'candidates', 'CANDIDATE', 'project'])(
    'denies without a round trip for entity type %j, which is not a public.entity_type',
    async (entityType) => {
      const { client, calls } = fakeClient({ data: true, error: null });
      expect(await callerMayOnEntity(client, entityType as EntityType, ENTITY, 'entity.edit_answers')).toBe(false);
      expect(calls).toHaveLength(0);
    }
  );
});
