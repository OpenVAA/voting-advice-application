import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniversalAdapter } from '$lib/api/base/universalAdapter';
import { supabaseAdapterMixin } from './supabaseAdapter';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseAdapterConfig } from './supabaseAdapter.type';

/**
 * The constants module is mocked rather than `$env/dynamic/public`, because `constants` reads the env object ONCE at module load and freezes the result into an object literal. Mutating the env stub after that load would change nothing the adapter can see, so the seam has to sit one level closer to the reader.
 */
const { mockConstants } = vi.hoisted(() => ({
  mockConstants: { PUBLIC_PROJECT_ID: '', PUBLIC_CACHE_ENABLED: false } as Record<string, unknown>
}));

vi.mock('$lib/utils/constants', () => ({
  get constants() {
    return mockConstants;
  }
}));

const DEFAULT_PROJECT_UUID = '00000000-0000-0000-0000-000000000001';

/** A concrete adapter over the mixin. The mixin is abstract, and every real adapter is reached through a subclass, so the subject under test is the same shape production uses. */
class TestAdapter extends supabaseAdapterMixin(UniversalAdapter) {
  constructor(config: SupabaseAdapterConfig) {
    super(config);
  }
}

/** Records every filter and payload the adapter hands to the query builder, so a test can assert on the scope the adapter applied rather than on a network round trip. */
function createRecordingClient(): {
  client: SupabaseClient<Database>;
  calls: Array<{ table: string; method: string; filters: Array<[string, unknown]>; payload?: unknown }>;
} {
  const calls: Array<{ table: string; method: string; filters: Array<[string, unknown]>; payload?: unknown }> = [];

  function chainFor(entry: { table: string; method: string; filters: Array<[string, unknown]>; payload?: unknown }) {
    const chain = {
      eq: vi.fn((column: string, value: unknown) => {
        entry.filters.push([column, value]);
        return chain;
      }),
      select: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then: (onFulfilled: (value: { data: null; error: null }) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
    };
    return chain;
  }

  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn((columns?: string) => {
        const entry = { table, method: 'select', filters: [] as Array<[string, unknown]>, payload: columns };
        calls.push(entry);
        return chainFor(entry);
      }),
      insert: vi.fn((payload: unknown) => {
        const entry = { table, method: 'insert', filters: [] as Array<[string, unknown]>, payload };
        calls.push(entry);
        return chainFor(entry);
      }),
      update: vi.fn((payload: unknown) => {
        const entry = { table, method: 'update', filters: [] as Array<[string, unknown]>, payload };
        calls.push(entry);
        return chainFor(entry);
      }),
      delete: vi.fn(() => {
        const entry = { table, method: 'delete', filters: [] as Array<[string, unknown]>, payload: undefined };
        calls.push(entry);
        return chainFor(entry);
      })
    }))
  } as unknown as SupabaseClient<Database>;

  return { client, calls };
}

function build(overrides: Partial<SupabaseAdapterConfig> = {}): {
  adapter: TestAdapter;
  calls: ReturnType<typeof createRecordingClient>['calls'];
} {
  const { client, calls } = createRecordingClient();
  const adapter = new TestAdapter({ fetch: (() => Promise.resolve(new Response())) as Fetch, client, ...overrides });
  return { adapter, calls };
}

describe('supabaseAdapterMixin project scoping', () => {
  beforeEach(() => {
    mockConstants.PUBLIC_PROJECT_ID = DEFAULT_PROJECT_UUID;
  });

  it('resolves the project id from PUBLIC_PROJECT_ID', () => {
    const { adapter } = build();
    expect(adapter.projectId).toBe(DEFAULT_PROJECT_UUID);
  });

  it('throws when the project id is absent, naming the variable, the file to set it in and the default uuid', () => {
    mockConstants.PUBLIC_PROJECT_ID = '';
    let message = '';
    try {
      build();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('PUBLIC_PROJECT_ID');
    expect(message).toContain('.env');
    expect(message).toContain(DEFAULT_PROJECT_UUID);
  });

  it('substitutes no value of its own when the project id is absent', () => {
    mockConstants.PUBLIC_PROJECT_ID = '   ';
    expect(() => build()).toThrow(/PUBLIC_PROJECT_ID/);
  });

  it('trims and lower-cases a whitespace-padded, upper-case value', () => {
    mockConstants.PUBLIC_PROJECT_ID = '  00000000-0000-0000-0000-0000000000E2  ';
    const { adapter } = build();
    expect(adapter.projectId).toBe('00000000-0000-0000-0000-0000000000e2');
  });

  it('throws on a value that is not a canonical 8-4-4-4-12 hexadecimal uuid', () => {
    mockConstants.PUBLIC_PROJECT_ID = 'not-a-uuid';
    let message = '';
    try {
      build();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('PUBLIC_PROJECT_ID');
    expect(message).toContain('8-4-4-4-12');
  });

  it('lets a non-empty config.projectId override PUBLIC_PROJECT_ID', () => {
    const { adapter } = build({ projectId: '00000000-0000-0000-0000-0000000000e2' });
    expect(adapter.projectId).toBe('00000000-0000-0000-0000-0000000000e2');
  });

  it('falls back to PUBLIC_PROJECT_ID when config.projectId is an empty string', () => {
    const { adapter } = build({ projectId: '' });
    expect(adapter.projectId).toBe(DEFAULT_PROJECT_UUID);
  });

  it('rejects a malformed config.projectId with the same shape check', () => {
    expect(() => build({ projectId: 'zzzzzzzz-0000-0000-0000-000000000001' })).toThrow(/8-4-4-4-12/);
  });

  it('filters a scopedFrom read by the resolved project id', () => {
    const { adapter, calls } = build();
    adapter.scopedFrom('feedback').select('*');
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe('feedback');
    expect(calls[0].method).toBe('select');
    expect(calls[0].filters).toContainEqual(['project_id', DEFAULT_PROJECT_UUID]);
  });

  it('filters a scopedFrom delete by the resolved project id', () => {
    const { adapter, calls } = build();
    adapter.scopedFrom('feedback').delete();
    expect(calls[0].filters).toContainEqual(['project_id', DEFAULT_PROJECT_UUID]);
  });

  it('stamps the resolved project id onto a scopedFrom insert', () => {
    const { adapter, calls } = build();
    adapter.scopedFrom('feedback').insert({ date: '2026-09-04', rating: 5 });
    expect(calls[0].method).toBe('insert');
    expect(calls[0].payload).toMatchObject({ project_id: DEFAULT_PROJECT_UUID, rating: 5 });
  });
});
