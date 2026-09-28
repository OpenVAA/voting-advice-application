import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseFeedbackWriter } from './supabaseFeedbackWriter';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * `constants` freezes its reads at module load, so the seam is the constants module rather than the env stub behind it.
 */
const { mockConstants } = vi.hoisted(() => ({
  mockConstants: { PUBLIC_PROJECT_ID: '', PUBLIC_CACHE_ENABLED: false } as Record<string, unknown>
}));

vi.mock('$lib/utils/constants', () => ({
  get constants() {
    return mockConstants;
  }
}));

vi.mock('$app/environment', () => ({ browser: false }));

const DEFAULT_PROJECT_UUID = '00000000-0000-0000-0000-000000000001';

/** Records every table the writer reaches for and every payload it hands over, so the test can assert that exactly one call is made and what it carries. */
function createRecordingClient(insertError: { message: string } | null = null): {
  client: SupabaseClient<Database>;
  calls: Array<{ table: string; method: string; payload?: unknown }>;
} {
  const calls: Array<{ table: string; method: string; payload?: unknown }> = [];

  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn((columns?: string) => {
        calls.push({ table, method: 'select', payload: columns });
        const chain = {
          limit: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'no app_settings row' } }))
        };
        return chain;
      }),
      insert: vi.fn((payload: unknown) => {
        calls.push({ table, method: 'insert', payload });
        return Promise.resolve({ data: null, error: insertError });
      })
    }))
  } as unknown as SupabaseClient<Database>;

  return { client, calls };
}

function build(insertError: { message: string } | null = null): {
  writer: SupabaseFeedbackWriter;
  calls: Array<{ table: string; method: string; payload?: unknown }>;
} {
  const { client, calls } = createRecordingClient(insertError);
  const writer = new SupabaseFeedbackWriter({
    fetch: (() => Promise.resolve(new Response())) as Fetch,
    client
  });
  return { writer, calls };
}

describe('SupabaseFeedbackWriter', () => {
  beforeEach(() => {
    mockConstants.PUBLIC_PROJECT_ID = DEFAULT_PROJECT_UUID;
  });

  it('issues exactly one Supabase call, the insert', async () => {
    const { writer, calls } = build();
    await writer.postFeedback({ rating: 4, description: 'fine' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ table: 'feedback', method: 'insert' });
  });

  it('never reads app_settings to discover the project id', async () => {
    const { writer, calls } = build();
    await writer.postFeedback({ rating: 4 });
    expect(calls.some((call) => call.table === 'app_settings')).toBe(false);
  });

  it('inserts the project id the adapter resolved', async () => {
    mockConstants.PUBLIC_PROJECT_ID = '00000000-0000-0000-0000-0000000000e2';
    const { writer, calls } = build();
    await writer.postFeedback({ rating: 2, description: 'meh' });
    expect(calls[0].payload).toMatchObject({
      project_id: '00000000-0000-0000-0000-0000000000e2',
      rating: 2,
      description: 'meh'
    });
  });

  it('keeps the postFeedback error convention', async () => {
    const { writer } = build({ message: 'rate limited' });
    await expect(writer.postFeedback({ rating: 1 })).rejects.toThrow('postFeedback: rate limited');
  });

  it('returns a success result when the insert succeeds', async () => {
    const { writer } = build();
    await expect(writer.postFeedback({ description: 'ok' })).resolves.toEqual({ type: 'success' });
  });
});
