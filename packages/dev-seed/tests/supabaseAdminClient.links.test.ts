/**
 * The constituency links of a seed: `SupabaseAdminClient.bulkImport` sends them, `linkJoinTables` does not write them.
 *
 * `bulk_import` writes `election_constituency_groups` and `constituency_group_constituencies` itself, from the link keys `constituency_groups` of an election item and `constituencies` of a constituency-group item, before it writes any nomination. These cases hold the client to that: every key spelling `LINK_SENTINELS` accepts on those two collections reaches the RPC as the link key, holding references by external id; a row that names no link sends no link key; and `linkJoinTables` writes only the links `bulk_import` does not, the question categories' and questions' election and constituency references.
 *
 * Pure I/O contract: `@supabase/supabase-js` is mocked and no database is contacted.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAdminClient } from '../src/supabaseAdminClient';

/** What the mocked supabase-js client was asked to do. */
interface MockState {
  rpcCalls: Array<[string, Record<string, unknown>]>;
  fromTables: Array<string>;
  updates: Array<[string, Record<string, unknown>]>;
}

/** The query-builder surface the client reaches: lookups by external id, a column update and an upsert. */
interface MockBuilder {
  select: () => MockBuilder;
  eq: () => MockBuilder;
  single: () => Promise<{ data: { id: string }; error: null }>;
  update: (values: Record<string, unknown>) => MockBuilder;
  upsert: () => Promise<{ error: null }>;
  then: (resolve: (value: { error: null }) => void) => void;
}

// Hoisted with the mock below, so the state exists before the client module is imported.
const mockState = vi.hoisted(() => {
  const state: MockState = { rpcCalls: [], fromTables: [], updates: [] };
  return state;
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      mockState.rpcCalls.push([name, args]);
      return { data: {}, error: null };
    }),
    from: vi.fn((table: string) => {
      mockState.fromTables.push(table);
      const builder: MockBuilder = {
        select: () => builder,
        eq: () => builder,
        single: async () => ({ data: { id: `${table}-uuid` }, error: null }),
        update: (values) => {
          mockState.updates.push([table, values]);
          return builder;
        },
        upsert: async () => ({ error: null }),
        then: (resolve) => resolve({ error: null })
      };
      return builder;
    })
  }))
}));

const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';

/** The payload a key spelling carries: the `_` forms an object of id arrays, the bare forms an array of references. */
function linkPayload(key: string, externalId: string): unknown {
  return key.startsWith('_') ? { externalId: [externalId] } : [{ external_id: externalId }];
}

/** The items of one collection the client sent to `bulk_import`. */
function sentItems(collection: string): Array<Record<string, unknown>> {
  const call = mockState.rpcCalls.find(([name]) => name === 'bulk_import');
  if (!call) throw new Error('bulk_import was not called');
  const data = call[1].p_data as Record<string, Array<Record<string, unknown>>>;
  return data[collection] ?? [];
}

describe('SupabaseAdminClient.bulkImport sends the constituency links to bulk_import', () => {
  beforeEach(() => {
    mockState.rpcCalls = [];
    mockState.fromTables = [];
    mockState.updates = [];
  });

  it.each(['_constituencyGroups', '_constituency_groups', 'constituencyGroups', 'constituency_groups'])(
    'an election naming its constituency groups under %s sends them as constituency_groups references',
    async (key) => {
      const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

      await client.bulkImport({ elections: [{ external_id: 'el-1', [key]: linkPayload(key, 'cg-1') }] });

      expect(sentItems('elections')).toEqual([{ external_id: 'el-1', constituency_groups: [{ external_id: 'cg-1' }] }]);
    }
  );

  it.each(['_constituencies', 'constituencies'])(
    'a constituency group naming its constituencies under %s sends them as constituencies references',
    async (key) => {
      const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

      await client.bulkImport({ constituencyGroups: [{ external_id: 'cg-1', [key]: linkPayload(key, 'co-1') }] });

      expect(sentItems('constituency_groups')).toEqual([
        { external_id: 'cg-1', constituencies: [{ external_id: 'co-1' }] }
      ]);
    }
  );

  it('a row that names no link sends no link key', async () => {
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.bulkImport({
      elections: [{ external_id: 'el-1' }],
      constituency_groups: [{ external_id: 'cg-1' }]
    });

    expect(sentItems('elections')).toEqual([{ external_id: 'el-1' }]);
    expect(sentItems('constituency_groups')).toEqual([{ external_id: 'cg-1' }]);
  });
});

describe('SupabaseAdminClient.linkJoinTables writes only the links bulk_import does not', () => {
  beforeEach(() => {
    mockState.rpcCalls = [];
    mockState.fromTables = [];
    mockState.updates = [];
  });

  it('writes neither constituency join table, and still writes a question category election reference', async () => {
    const client = new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID);

    await client.linkJoinTables({
      elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }],
      constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }],
      question_categories: [{ external_id: 'qc-1', _elections: { externalId: ['el-1'] } }]
    });

    expect(mockState.fromTables).not.toContain('election_constituency_groups');
    expect(mockState.fromTables).not.toContain('constituency_group_constituencies');
    expect(mockState.updates).toEqual([['question_categories', { election_ids: ['elections-uuid'] }]]);
  });
});
