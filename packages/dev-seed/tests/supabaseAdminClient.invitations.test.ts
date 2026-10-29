/**
 * SupabaseAdminClient.createInvitations unit tests.
 *
 * The method is one call of the `create_invitations` RPC. These tests hold the three argument keys PostgREST matches against the SQL parameter names, the confirmation the call states, the project the batch is seeded in, the nominations an item carries, the returned array, and what a thrown error may say.
 *
 * Pure I/O contract: `@supabase/supabase-js` is mocked and no database is contacted.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAdminClient } from '../src/supabaseAdminClient';
import type { InvitationNominationSeed, InvitationSeedItem, SeededInvitation } from '../src/supabaseAdminClient';

// Hoisted with the mock below, so the state exists before the client module is imported.
const mockState = vi.hoisted(() => {
  const state: {
    rpcResult: { data: unknown; error: unknown };
    rpcCalls: Array<[string, Record<string, unknown>]>;
  } = {
    rpcResult: { data: [], error: null },
    rpcCalls: []
  };
  return state;
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      mockState.rpcCalls.push([name, args]);
      return mockState.rpcResult;
    })
  }))
}));

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';
const INVITEE = 'invitee@test.openvaa.local';

const ITEMS: Array<InvitationSeedItem> = [
  { target_type: 'candidate', external_id: 'ca-1', email: INVITEE },
  { target_type: 'organization', external_id: 'or-1' }
];

const SEEDED: Array<SeededInvitation> = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    scope: 'entity',
    target_type: 'candidate',
    target_id: '22222222-2222-4222-8222-222222222222',
    role: 'editor',
    email: INVITEE,
    expires_at: null,
    code: null,
    entity_confirmed: true
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    scope: 'entity',
    target_type: 'organization',
    target_id: '44444444-4444-4444-8444-444444444444',
    role: 'editor',
    email: null,
    expires_at: null,
    code: 'ABCD-EFGH-JKMN',
    entity_confirmed: true
  }
];

const NOMINATIONS: Array<InvitationNominationSeed> = [
  {
    election_id: '55555555-5555-4555-8555-555555555555',
    constituency_id: '66666666-6666-4666-8666-666666666666',
    election_symbol: '999',
    parent: { kind: 'entity', entity_type: 'organization', entity_id: '77777777-7777-4777-8777-777777777777' },
    confirmed: false,
    external_id: 'nom-1'
  }
];

const ITEMS_WITH_NOMINATIONS: Array<InvitationSeedItem> = [
  { target_type: 'candidate', target_id: '22222222-2222-4222-8222-222222222222', nominations: NOMINATIONS }
];

const SEEDED_WITH_NOMINATIONS: Array<SeededInvitation> = [
  {
    id: '88888888-8888-4888-8888-888888888888',
    scope: 'entity',
    target_type: 'candidate',
    target_id: '22222222-2222-4222-8222-222222222222',
    role: 'editor',
    email: null,
    expires_at: null,
    code: 'PQRS-TUVW-XYZ2',
    entity_confirmed: false,
    nominations: { inserted: 1, updated: 0, unchanged: 0, parents_created: 1 }
  }
];

describe('SupabaseAdminClient.createInvitations', () => {
  beforeEach(() => {
    mockState.rpcResult = { data: [], error: null };
    mockState.rpcCalls = [];
  });

  it('calls create_invitations once, with the SQL parameter names and the client project', async () => {
    mockState.rpcResult = { data: SEEDED, error: null };
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.createInvitations(ITEMS);

    expect(mockState.rpcCalls).toHaveLength(1);
    const [name, args] = mockState.rpcCalls[0];
    expect(name).toBe('create_invitations');
    expect(Object.keys(args).sort()).toEqual(['p_confirm_entity', 'p_invitations', 'p_project_id']);
    expect(args.p_project_id).toBe(PROJECT_ID);
    expect(args.p_invitations).toEqual(ITEMS);
  });

  it('states the confirmation as true when the caller says nothing', async () => {
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.createInvitations(ITEMS);

    expect(mockState.rpcCalls[0][1].p_confirm_entity).toBe(true);
  });

  it('states the confirmation as false when the caller says confirmEntity: false', async () => {
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.createInvitations(ITEMS, { confirmEntity: false });

    expect(mockState.rpcCalls[0][1].p_confirm_entity).toBe(false);
  });

  it('states the confirmation as true when the caller says confirmEntity: true', async () => {
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.createInvitations(ITEMS, { confirmEntity: true });

    expect(mockState.rpcCalls[0][1].p_confirm_entity).toBe(true);
  });

  it('passes the nominations of an item through unchanged', async () => {
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.createInvitations(ITEMS_WITH_NOMINATIONS, { confirmEntity: false });

    const [, args] = mockState.rpcCalls[0];
    expect(args.p_invitations).toEqual(ITEMS_WITH_NOMINATIONS);
    expect((args.p_invitations as Array<{ nominations?: unknown }>)[0].nominations).toEqual(NOMINATIONS);
  });

  it('keeps entity_confirmed and the nomination counts as the function answered them', async () => {
    mockState.rpcResult = { data: SEEDED_WITH_NOMINATIONS, error: null };
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    const seeded = await client.createInvitations(ITEMS_WITH_NOMINATIONS, { confirmEntity: false });

    expect(seeded).toEqual(SEEDED_WITH_NOMINATIONS);
    expect(seeded[0].entity_confirmed).toBe(false);
    expect(seeded[0].nominations).toEqual({ inserted: 1, updated: 0, unchanged: 0, parents_created: 1 });
  });

  it('returns the array the function answers, generated code included', async () => {
    mockState.rpcResult = { data: SEEDED, error: null };
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    const seeded = await client.createInvitations(ITEMS);

    expect(seeded).toEqual(SEEDED);
    expect(seeded[1].code).toBe('ABCD-EFGH-JKMN');
  });

  it('returns an empty array when the function answers no data', async () => {
    mockState.rpcResult = { data: null, error: null };
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await expect(client.createInvitations([])).resolves.toEqual([]);
  });

  it('throws on a database error, naming its code and no address', async () => {
    mockState.rpcResult = {
      data: null,
      error: {
        code: '23505',
        message: `duplicate key value violates a unique constraint for ${INVITEE}`,
        details: `Key (email)=(${INVITEE}) already exists.`,
        hint: null
      }
    };
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    const failure = await client.createInvitations(ITEMS).then(
      () => undefined,
      (e: unknown) => e
    );

    expect(failure).toBeInstanceOf(Error);
    const message = (failure as Error).message;
    expect(message).toContain('createInvitations');
    expect(message).toContain('23505');
    expect(message).not.toContain(INVITEE);
    expect(message).not.toContain('@');
    expect(JSON.stringify(failure, Object.getOwnPropertyNames(failure)).includes(INVITEE)).toBe(false);
  });
});
