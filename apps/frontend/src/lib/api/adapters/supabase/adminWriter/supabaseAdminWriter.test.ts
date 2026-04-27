import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $env/dynamic/public before any imports that depend on it
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

import { SupabaseAdminWriter } from './supabaseAdminWriter';

/**
 * Creates a mock Supabase client with chainable PostgREST query patterns
 * and Edge Function invocation support.
 */
function createMockSupabaseClient() {
  const mockResponses: Record<string, { data: unknown; error: unknown }> = {};

  function createChain(table: string) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() =>
        Promise.resolve(mockResponses[table] ?? { data: null, error: null })
      ),
      insert: vi.fn().mockImplementation(() =>
        Promise.resolve(mockResponses[`${table}_insert`] ?? { data: null, error: null })
      )
    };
    return chain;
  }

  return {
    rpc: vi.fn(),
    from: vi.fn((table: string) => createChain(table)),
    functions: { invoke: vi.fn() },
    _mockResponses: mockResponses
  };
}

describe('SupabaseAdminWriter', () => {
  let writer: SupabaseAdminWriter;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    writer = new SupabaseAdminWriter();
    writer.init({
      fetch: vi.fn(),
      serverClient: mockSupabase as any
    });
  });

  describe('updateQuestion', () => {
    it('calls merge_custom_data RPC and returns success', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await writer.updateQuestion({
        authToken: '',
        id: 'q1',
        data: { customData: { arguments: [] } }
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('merge_custom_data', {
        p_question_id: 'q1',
        p_patch: { arguments: [] }
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws on invalid customData', async () => {
      await expect(
        writer.updateQuestion({
          authToken: '',
          id: 'q1',
          data: { customData: null as any }
        })
      ).rejects.toThrow('Expected a customData object');
    });

    it('throws on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(
        writer.updateQuestion({
          authToken: '',
          id: 'q1',
          data: { customData: { terms: [] } }
        })
      ).rejects.toThrow('updateQuestion: RPC failed');
    });
  });

  describe('insertJobResult', () => {
    it('resolves project_id from election and inserts job record', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: { project_id: 'proj-1' },
        error: null
      };
      mockSupabase._mockResponses['admin_jobs_insert'] = {
        data: null,
        error: null
      };

      const result = await writer.insertJobResult({
        authToken: '',
        data: {
          jobId: 'j1',
          jobType: 'generateArguments' as any,
          electionId: 'e1',
          author: 'admin@test.com',
          endStatus: 'completed'
        }
      });

      expect(result).toEqual({ type: 'success' });
    });

    it('throws when election not found', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: null,
        error: { message: 'Not found' }
      };

      await expect(
        writer.insertJobResult({
          authToken: '',
          data: {
            jobId: 'j1',
            jobType: 'generateArguments' as any,
            electionId: 'bad',
            author: 'a',
            endStatus: 'completed'
          }
        })
      ).rejects.toThrow('Failed to resolve project');
    });

    it('throws on insert error', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: { project_id: 'proj-1' },
        error: null
      };
      mockSupabase._mockResponses['admin_jobs_insert'] = {
        data: null,
        error: { message: 'RLS violation' }
      };

      await expect(
        writer.insertJobResult({
          authToken: '',
          data: {
            jobId: 'j2',
            jobType: 'generateArguments' as any,
            electionId: 'e1',
            author: 'a',
            endStatus: 'completed'
          }
        })
      ).rejects.toThrow('insertJobResult: RLS violation');
    });
  });

  describe('sendEmail', () => {
    it('invokes send-email Edge Function and returns result', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sent: 5, failed: 0, results: [] },
        error: null
      });

      const result = await writer.sendEmail({
        templates: { default: { subject: 's', text: 't', html: 'h' } },
        recipientUserIds: ['u1', 'u2']
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          templates: { default: { subject: 's', text: 't', html: 'h' } },
          recipient_user_ids: ['u1', 'u2'],
          from: undefined,
          dry_run: undefined
        }
      });
      expect(result).toEqual({ type: 'success', sent: 5, failed: 0, results: [] });
    });

    it('passes from and dryRun options', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sent: 0, failed: 0, results: [] },
        error: null
      });

      await writer.sendEmail({
        templates: {},
        recipientUserIds: [],
        from: 'noreply@test.com',
        dryRun: true
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          templates: {},
          recipient_user_ids: [],
          from: 'noreply@test.com',
          dry_run: true
        }
      });
    });

    it('throws on Edge Function error', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' }
      });

      await expect(
        writer.sendEmail({
          templates: {},
          recipientUserIds: []
        })
      ).rejects.toThrow('send-email: Function error');
    });
  });
});
