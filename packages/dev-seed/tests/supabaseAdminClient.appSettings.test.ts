/**
 * SupabaseAdminClient.updateAppSettings unit tests.
 *
 * The method deep-merges a partial settings object into the project's row with the `merge_jsonb_column` RPC, and replaces a `SETTINGS_REPLACED_WHOLE` member whole by first merging `null` at its path. These tests hold the RPC calls it makes.
 *
 * Pure I/O contract: `@supabase/supabase-js` is mocked and no database is contacted.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAdminClient } from '../src/supabaseAdminClient';

const ROW_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ID = '00000000-0000-0000-0000-0000000000aa';

// Hoisted with the mock below, so the state exists before the client module is imported.
const mockState = vi.hoisted(() => {
  const state: {
    rpcResults: Array<{ data: unknown; error: unknown }>;
    rpcCalls: Array<[string, Record<string, unknown>]>;
  } = {
    rpcResults: [],
    rpcCalls: []
  };
  return state;
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => {
    const rowLookup = {
      select: () => rowLookup,
      eq: () => rowLookup,
      single: async () => ({ data: { id: '11111111-1111-4111-8111-111111111111' }, error: null })
    };
    return {
      from: vi.fn(() => rowLookup),
      rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
        mockState.rpcCalls.push([name, args]);
        return mockState.rpcResults.shift() ?? { data: null, error: null };
      })
    };
  })
}));

function mergeCall(partialData: Record<string, unknown>): [string, Record<string, unknown>] {
  return [
    'merge_jsonb_column',
    { p_table_name: 'app_settings', p_column_name: 'settings', p_row_id: ROW_ID, p_partial_data: partialData }
  ];
}

describe('SupabaseAdminClient.updateAppSettings', () => {
  beforeEach(() => {
    mockState.rpcResults = [];
    mockState.rpcCalls = [];
  });

  it('merges a payload that names no member replaced whole in one call', async () => {
    const settings = { contestantApp: { questions: { hideVideo: true } }, results: { showFeedbackPopup: 3 } };

    await new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID).updateAppSettings(settings);

    expect(mockState.rpcCalls).toEqual([mergeCall(settings)]);
  });

  it('clears contestantApp.servedEntityTypes before merging a payload that names it', async () => {
    const settings = {
      contestantApp: { servedEntityTypes: { organization: { registrationModes: ['email'] } } },
      access: { answersLocked: false }
    };

    await new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID).updateAppSettings(settings);

    expect(mockState.rpcCalls).toEqual([
      mergeCall({ contestantApp: { servedEntityTypes: null } }),
      mergeCall(settings)
    ]);
  });

  it('treats an undefined member as not named', async () => {
    const settings = { contestantApp: { servedEntityTypes: undefined } };

    await new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID).updateAppSettings(settings);

    expect(mockState.rpcCalls).toEqual([mergeCall(settings)]);
  });

  it('stops before the merge when clearing the member fails', async () => {
    mockState.rpcResults = [{ data: null, error: { message: 'denied' } }];

    await expect(
      new SupabaseAdminClient('http://localhost', 'key', PROJECT_ID).updateAppSettings({
        contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } }
      })
    ).rejects.toThrow('updateAppSettings: merge failed: denied');
    expect(mockState.rpcCalls).toHaveLength(1);
  });
});
