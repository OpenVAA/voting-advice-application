/**
 * `callerMayOnProject` is the Edge Functions' only authority gate, so its fail-closed edges are asserted by IMPORT rather than by source text (162-REVIEW CR-05, WR-09).
 *
 * What these pin: the question is put to `public.user_can` at PROJECT scope with the permission the caller names -- the matrix lives in the database, not here -- and every answer other than a literal `true` is a denial, including an RPC error, a thrown client and a missing project id.
 */

import { describe, expect, it } from 'vitest';
import { callerMayOnProject, type RpcClient } from './callerAuthority.ts';

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
