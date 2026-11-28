/**
 * `callerMayOnProject` is the Edge Functions' authority gate, so its fail-closed edges are asserted by IMPORT rather than by source text.
 *
 * What these pin: the question is put to `public.user_can` at project scope with the permission the caller names -- the matrix lives in the database, not here -- and every answer other than a literal `true` is a denial, including an RPC error, a thrown client and a missing project id. The permission type's members are the enum's, read from `schema/000-enums.sql`.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { callerMayOnProject, GRANT_PERMISSIONS } from './callerAuthority.ts';
import type { RpcClient, UserCanArgs } from './callerAuthority.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';

function fakeClient(answer: { data: unknown; error: unknown }) {
  const calls: Array<{ fn: string; args: UserCanArgs }> = [];
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

  it.each([undefined, null, '', '   ', 42 as unknown as string])(
    'denies without a round trip for project id %j',
    async (projectId) => {
      const { client, calls } = fakeClient({ data: true, error: null });
      expect(await callerMayOnProject(client, projectId, 'project.edit_entities')).toBe(false);
      expect(calls).toHaveLength(0);
    }
  );
});

describe('GRANT_PERMISSIONS', () => {
  it('lists the members of public.grant_permission, in the order schema/000-enums.sql declares them', () => {
    const enumSource = readFileSync(new URL('../../schema/000-enums.sql', import.meta.url), 'utf8');
    const block = enumSource.match(/CREATE TYPE public\.grant_permission AS ENUM\s*\(([\s\S]*?)\);/);
    expect(block).not.toBeNull();
    const declared = Array.from(block![1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
    expect(declared.length).toBeGreaterThan(0);
    expect([...GRANT_PERMISSIONS]).toEqual(declared);
  });
});
