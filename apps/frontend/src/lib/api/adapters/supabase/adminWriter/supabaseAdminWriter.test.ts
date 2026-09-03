import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAdminWriter } from './supabaseAdminWriter';
import type { LogRecord } from '@openvaa/app-shared';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminFeature } from '$lib/admin/features';
import type { TemporarySetQuestionData } from '$lib/api/base/dataWriter.type';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';

// Mock $env/dynamic/public before any imports that depend on it
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

/**
 * Creates a mock Supabase client with chainable PostgREST query patterns and Edge Function invocation support.
 */
function createMockSupabaseClient() {
  const mockResponses: Record<string, { data: unknown; error: unknown }> = {};

  function createChain(table: string) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(mockResponses[table] ?? { data: null, error: null })),
      insert: vi
        .fn()
        .mockImplementation(() => Promise.resolve(mockResponses[`${table}_insert`] ?? { data: null, error: null }))
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

type MockClient = ReturnType<typeof createMockSupabaseClient>;
// reason: createMockSupabaseClient is structural-only; SupabaseClient<Database> has 50+ methods we don't mock
function asSupabaseMock(m: MockClient): SupabaseClient<Database> {
  return m as unknown as SupabaseClient<Database>;
}

/**
 * Run `call` with the structured logger capturing into an array, then restore the silent default.
 * The logger's configuration is module-scoped and starts at `'silent'`, so a parse-failure record is invisible until the level is raised. The restore runs in a `finally` so one failing expectation cannot leave the level raised for the rest of the file.
 * @param call - The writer call under test.
 * @returns The call's result and every record emitted while it ran.
 */
async function withCapturedLogs<TResult>(
  call: () => Promise<TResult>
): Promise<{ result: TResult; records: Array<LogRecord> }> {
  const records: Array<LogRecord> = [];
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
  try {
    const result = await call();
    return { result, records };
  } finally {
    configureLogger({ level: 'silent', sink: undefined });
  }
}

/**
 * Narrow a `sendEmail` result to its success arm, failing the test when it is not one.
 * `sendEmail` returns a discriminated union since the malformed branch stopped reporting an unverified success, and `expect(...).toBe('success')` does not narrow a type. This does, so the reads below stay direct property accesses rather than casts.
 * @param result - The value `sendEmail` resolved to.
 * @returns The same value, narrowed to the success arm.
 */
function asSuccess(
  result: Awaited<ReturnType<SupabaseAdminWriter['sendEmail']>>
): Extract<typeof result, { type: 'success' }> {
  if (result.type !== 'success') throw new Error(`Expected a success result but sendEmail returned: ${result.type}`);
  return result;
}

describe('SupabaseAdminWriter', () => {
  let writer: SupabaseAdminWriter;
  let mockSupabase: MockClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    const config: SupabaseAdapterConfig = {
      fetch: vi.fn(),
      client: asSupabaseMock(mockSupabase)
    };
    writer = new SupabaseAdminWriter(config);
  });

  describe('updateQuestion', () => {
    it('calls merge_question_custom_data RPC and returns success', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await writer.updateQuestion({
        id: 'q1',
        data: { customData: { arguments: [] } }
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('merge_question_custom_data', {
        p_question_id: 'q1',
        p_patch: { arguments: [] }
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws on invalid customData', async () => {
      await expect(
        writer.updateQuestion({
          id: 'q1',
          // reason: deliberately pass null to exercise the runtime customData-shape guard
          data: { customData: null as unknown as TemporarySetQuestionData['customData'] }
        })
      ).rejects.toThrow('Expected a customData object');
    });

    it('throws on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(
        writer.updateQuestion({
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
        data: {
          jobId: 'j1',
          // reason: legacy fixture string predates AdminFeature union; cast keeps test green without widening prod types
          jobType: 'generateArguments' as unknown as AdminFeature,
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
          data: {
            jobId: 'j1',
            // reason: legacy fixture string predates AdminFeature union; cast keeps test green without widening prod types
            jobType: 'generateArguments' as unknown as AdminFeature,
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
          data: {
            jobId: 'j2',
            // reason: legacy fixture string predates AdminFeature union; cast keeps test green without widening prod types
            jobType: 'generateArguments' as unknown as AdminFeature,
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

    it('parses a well-formed payload and returns its per-recipient results', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          sent: 1,
          failed: 1,
          dry_run: false,
          results: [
            { user_id: 'u1', email: 'a@example.com', status: 'sent' },
            { user_id: 'u2', email: 'b@example.com', status: 'failed', error: 'bounced' }
          ]
        },
        error: null
      });

      const { result, records } = await withCapturedLogs(() =>
        writer.sendEmail({ templates: {}, recipientUserIds: ['u1', 'u2'] })
      );

      const success = asSuccess(result);
      expect(success.sent).toBe(1);
      expect(success.failed).toBe(1);
      expect(success.results).toHaveLength(2);
      expect(success.results[0].email).toBe('a@example.com');
      expect(success.results[1].status).toBe('failed');
      expect(records).toHaveLength(0);
    });

    it('parses the dry-run payload, which carries no counts at all', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          dry_run: true,
          results: [{ user_id: 'u1', email: 'a@example.com', subject: 'Subject', body: 'Body' }]
        },
        error: null
      });

      const { result, records } = await withCapturedLogs(() =>
        writer.sendEmail({ templates: {}, recipientUserIds: ['u1'], dryRun: true })
      );

      const success = asSuccess(result);
      expect(success.sent).toBe(0);
      expect(success.failed).toBe(0);
      expect(success.results[0].subject).toBe('Subject');
      expect(records).toHaveLength(0);
    });

    it('surfaces a malformed payload as a typed failure and reports it once, rather than claiming an unverified success', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sent: 2, failed: 0, results: [{ status: 'sent' }] },
        error: null
      });

      const { result, records } = await withCapturedLogs(() =>
        writer.sendEmail({ templates: {}, recipientUserIds: ['u1'] })
      );

      // The branch this replaced returned a fully-populated success object reporting no outcomes, which is a write path reporting a result it never verified (T-157.1-13). The caller now gets the failure discriminant it already speaks.
      expect(result).toEqual({ type: 'failure' });
      expect(records).toHaveLength(1);
      expect(records[0].severityText).toBe('ERROR');
      expect(records[0].attributes?.issues).toEqual(['results.0.user_id', 'results.0.email']);
    });

    it('reports an invocation that answers with no body at all as a failure', async () => {
      // An absent READ column is not a failure — an operator simply stored nothing. An absent INVOCATION response is: the function was called, and it reported nothing about what it did.
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

      const { result, records } = await withCapturedLogs(() =>
        writer.sendEmail({ templates: {}, recipientUserIds: ['u1'] })
      );

      expect(result).toEqual({ type: 'failure' });
      expect(records).toHaveLength(1);
      expect(records[0].severityText).toBe('ERROR');
    });

    it('keeps every part of the payload out of the failure record', async () => {
      // The payload carries recipient addresses and rendered message bodies, so a sentinel is planted in each and the whole serialised record is asserted clean (T-157.1-15 / T-157-17). The refused KEY names are disclosed by design and are not values.
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          sent: 1,
          failed: 0,
          results: [{ user_id: 'u1', email: 'sentinel-recipient@example.com', body: 'sentinel-message-body' }],
          sentinelTopLevelKey: 'sentinel-top-level-value'
        },
        error: null
      });

      const { result, records } = await withCapturedLogs(() =>
        writer.sendEmail({ templates: {}, recipientUserIds: ['u1'] })
      );

      expect(result).toEqual({ type: 'failure' });
      expect(records).toHaveLength(1);
      const serialised = JSON.stringify(records[0]);
      expect(serialised).not.toContain('sentinel-recipient@example.com');
      expect(serialised).not.toContain('sentinel-message-body');
      expect(serialised).not.toContain('sentinel-top-level-value');
      expect(records[0].attributes?.rejectedKeys).toContain('sentinelTopLevelKey');
    });
  });
});
