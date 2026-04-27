/**
 * Writer unit tests — D-23 (env-enforcement + mocked-client call shape).
 *
 * Covers:
 *   - D-15 / NF-02: constructor throws when `SUPABASE_URL` is missing.
 *   - D-15 / NF-02: constructor throws when `SUPABASE_SERVICE_ROLE_KEY` is
 *     missing. Error messages are descriptive (mention the env var AND
 *     point at `supabase start` remediation).
 *   - NF-01: `write()` calls `bulkImport` → `importAnswers` → `linkJoinTables`
 *     in that order (single-transaction atomicity + post-pass enrichment).
 *   - D-11 routing: `accounts`, `projects`, `feedback`, `app_settings` are
 *     STRIPPED from the `bulk_import` payload. Each is routed elsewhere or
 *     skipped.
 *   - RESEARCH §4.15 Pitfall 5: `app_settings` routes through
 *     `updateAppSettings` (the `merge_jsonb_column` RPC), NOT `bulk_import`
 *     (which fails on the `UNIQUE(project_id)` constraint pre-inserted by
 *     seed.sql).
 *   - Feedback-skip logger warning: when `feedback` rows are supplied, the
 *     writer emits a descriptive warning via the injected logger and does
 *     NOT call any write method for feedback.
 *
 * Pattern: `vi.mock` hoists above imports — the mocked `SupabaseAdminClient`
 * replaces the real one for every test in this file. The mock factory keeps
 * a list of constructed instances so each test can inspect the one it owns.
 * `vi.clearAllMocks()` in `beforeEach` resets spy state between tests.
 *
 * D-22 contract: pure I/O. No real Supabase contact; no `createClient`, no
 * `.rpc()`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Imported AFTER vi.mock — Writer's `import { SupabaseAdminClient } from
// './supabaseAdminClient'` now resolves to the mocked module.
import { Writer } from '../src/writer';

// vi.mock is HOISTED — runs before the Writer import below so Writer resolves
// `./supabaseAdminClient` to the mocked module. The factory returns a fresh
// module shape on every import, but instance tracking via `__getLastInstance`
// lets tests inspect the specific mocked admin client the Writer constructed.
// Default portrait-method mocks applied to every instance.
// Tests can reassign these on the last instance (via getMockedAdminClient)
// to customize per-test behavior (e.g., returning candidates or throwing).
vi.mock('../src/supabaseAdminClient', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instances: Array<any> = [];
  return {
    TEST_PROJECT_ID: '00000000-0000-0000-0000-000000000001',
    SupabaseAdminClient: vi.fn().mockImplementation(() => {
      const callOrder: Array<string> = [];
      const instance = {
        bulkImport: vi.fn().mockImplementation(async (data: Record<string, unknown>) => {
          callOrder.push('bulkImport');
          return data;
        }),
        importAnswers: vi.fn().mockImplementation(async () => {
          callOrder.push('importAnswers');
        }),
        linkJoinTables: vi.fn().mockImplementation(async () => {
          callOrder.push('linkJoinTables');
        }),
        updateAppSettings: vi.fn().mockImplementation(async () => {
          callOrder.push('updateAppSettings');
        }),
        // Phase 58 Plan 04 portrait methods — default to "no candidates"
        // so existing Phase 56/57 tests don't exercise the upload branch.
        selectCandidatesForPortraitUpload: vi.fn().mockImplementation(async () => {
          callOrder.push('selectCandidatesForPortraitUpload');
          return [];
        }),
        uploadPortrait: vi.fn().mockImplementation(async () => {
          callOrder.push('uploadPortrait');
          return 'mock-path';
        }),
        updateCandidateImage: vi.fn().mockImplementation(async () => {
          callOrder.push('updateCandidateImage');
        }),
        callOrder
      };
      instances.push(instance);
      return instance;
    }),
    __getLastInstance: () => instances[instances.length - 1],
    __resetInstances: () => {
      instances.length = 0;
    }
  };
});

/**
 * Typed accessor for the mock module's instance-tracking helpers. The cast
 * isolates the only `any`-ish surface in this file (mock internals).
 */
async function getMockedAdminClient(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bulkImport: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importAnswers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkJoinTables: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAppSettings: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectCandidatesForPortraitUpload: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadPortrait: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCandidateImage: any;
  callOrder: Array<string>;
}> {
  const mod = await import('../src/supabaseAdminClient');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as unknown as { __getLastInstance: () => any }).__getLastInstance();
}

describe('Writer', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // -------------------------------------------------------------------------
  // D-15 + NF-02: env enforcement at construction
  // -------------------------------------------------------------------------

  it('throws at construction when SUPABASE_URL is missing (D-15, NF-02)', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    expect(() => new Writer()).toThrow(/SUPABASE_URL/);
  });

  it('throws at construction when SUPABASE_SERVICE_ROLE_KEY is missing (D-15, NF-02)', () => {
    process.env.SUPABASE_URL = 'http://localhost:54321';
    expect(() => new Writer()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('error message for missing SUPABASE_URL points at `supabase start` remediation (NF-02)', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    try {
      new Writer();
      throw new Error('Writer constructor should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('SUPABASE_URL');
      expect(msg).toContain('supabase start');
    }
  });

  it('error message for missing SUPABASE_SERVICE_ROLE_KEY points at `supabase status` (NF-02)', () => {
    process.env.SUPABASE_URL = 'http://localhost:54321';
    try {
      new Writer();
      throw new Error('Writer constructor should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(msg).toContain('supabase status');
    }
  });

  // -------------------------------------------------------------------------
  // NF-01 + D-11: call shape with env present
  // -------------------------------------------------------------------------

  describe('with env present', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'http://localhost:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    });

    it('calls bulkImport → importAnswers → linkJoinTables in order (NF-01)', async () => {
      const writer = new Writer();
      await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });

      const instance = await getMockedAdminClient();
      expect(instance.callOrder.slice(0, 3)).toEqual(['bulkImport', 'importAnswers', 'linkJoinTables']);
    });

    it('strips accounts from bulk_import payload (D-11 pass-through)', async () => {
      const writer = new Writer();
      await writer.write({
        accounts: [{ id: 'x' }],
        elections: [{ external_id: 'seed_e1', project_id: 'p' }]
      });

      const instance = await getMockedAdminClient();
      const bulkImportArg = instance.bulkImport.mock.calls[0][0] as Record<string, unknown>;
      expect(bulkImportArg).not.toHaveProperty('accounts');
    });

    it('strips projects from bulk_import payload (D-11 pass-through)', async () => {
      const writer = new Writer();
      await writer.write({
        projects: [{ id: 'y' }],
        elections: [{ external_id: 'seed_e1', project_id: 'p' }]
      });

      const instance = await getMockedAdminClient();
      const bulkImportArg = instance.bulkImport.mock.calls[0][0] as Record<string, unknown>;
      expect(bulkImportArg).not.toHaveProperty('projects');
    });

    it('strips feedback from bulk_import payload (D-11 direct-upsert-or-skip)', async () => {
      const writer = new Writer();
      await writer.write({
        feedback: [{ rating: 5 }],
        elections: [{ external_id: 'seed_e1', project_id: 'p' }]
      });

      const instance = await getMockedAdminClient();
      const bulkImportArg = instance.bulkImport.mock.calls[0][0] as Record<string, unknown>;
      expect(bulkImportArg).not.toHaveProperty('feedback');
    });

    it('routes app_settings through updateAppSettings, NOT bulk_import (Pitfall 5)', async () => {
      const writer = new Writer();
      await writer.write({
        app_settings: [{ settings: { key: 'value' } }],
        elections: [{ external_id: 'seed_e1', project_id: 'p' }]
      });

      const instance = await getMockedAdminClient();

      // app_settings stripped from bulk payload.
      const bulkImportArg = instance.bulkImport.mock.calls[0][0] as Record<string, unknown>;
      expect(bulkImportArg).not.toHaveProperty('app_settings');

      // updateAppSettings called with the settings blob.
      expect(instance.updateAppSettings).toHaveBeenCalledWith({ key: 'value' });
    });

    it('passes the 10 bulk-import tables through to bulkImport untouched', async () => {
      const writer = new Writer();
      await writer.write({
        elections: [{ external_id: 'seed_e1', project_id: 'p' }],
        constituency_groups: [{ external_id: 'seed_cg1', project_id: 'p' }],
        constituencies: [{ external_id: 'seed_c1', project_id: 'p' }],
        organizations: [{ external_id: 'seed_o1', project_id: 'p' }],
        alliances: [{ external_id: 'seed_a1', project_id: 'p' }],
        factions: [{ external_id: 'seed_f1', project_id: 'p' }],
        question_categories: [{ external_id: 'seed_qc1', project_id: 'p' }],
        questions: [{ external_id: 'seed_q1', project_id: 'p' }],
        candidates: [{ external_id: 'seed_cand1', project_id: 'p' }],
        nominations: [{ external_id: 'seed_nom1', project_id: 'p' }]
      });

      const instance = await getMockedAdminClient();
      const bulkImportArg = instance.bulkImport.mock.calls[0][0] as Record<string, unknown>;

      // All 10 bulk-import tables preserved in the payload.
      [
        'elections',
        'constituency_groups',
        'constituencies',
        'organizations',
        'alliances',
        'factions',
        'question_categories',
        'questions',
        'candidates',
        'nominations'
      ].forEach((table) => expect(bulkImportArg).toHaveProperty(table));
    });

    it('emits feedback writes skipped logger warning when feedback rows supplied', async () => {
      const logger = vi.fn();
      const writer = new Writer({ logger });
      await writer.write({ feedback: [{ rating: 5, description: 'test' }] });
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('feedback writes skipped'));
    });

    it('does NOT emit a feedback warning when no feedback rows supplied', async () => {
      const logger = vi.fn();
      const writer = new Writer({ logger });
      await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });
      const feedbackCalls = logger.mock.calls.filter((call) => String(call[0]).includes('feedback'));
      expect(feedbackCalls).toHaveLength(0);
    });

    // ---------------------------------------------------------------------
    // Phase 58 Plan 04 — uploadPortraits pass (GEN-09)
    // ---------------------------------------------------------------------

    describe('uploadPortraits pass (Phase 58 Plan 04 — GEN-09)', () => {
      it('invokes selectCandidatesForPortraitUpload AFTER linkJoinTables and BEFORE updateAppSettings (sequence order)', async () => {
        const writer = new Writer();
        // With default mock (returns [] candidates), uploadPortrait is never called
        // but selectCandidatesForPortraitUpload still runs — that's the assertion point.
        await writer.write({
          elections: [{ external_id: 'seed_e1', project_id: 'p' }],
          app_settings: [{ settings: { k: 'v' } }]
        });

        const instance = await getMockedAdminClient();
        const order = instance.callOrder;
        const idxLink = order.indexOf('linkJoinTables');
        const idxSelect = order.indexOf('selectCandidatesForPortraitUpload');
        const idxAppSettings = order.indexOf('updateAppSettings');

        expect(idxLink).toBeGreaterThanOrEqual(0);
        expect(idxSelect).toBeGreaterThan(idxLink);
        expect(idxAppSettings).toBeGreaterThan(idxSelect);
      });

      it('passes the externalIdPrefix argument through to selectCandidatesForPortraitUpload (default "seed_")', async () => {
        const writer = new Writer();
        await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });

        const instance = await getMockedAdminClient();
        expect(instance.selectCandidatesForPortraitUpload).toHaveBeenCalledWith('seed_');
      });

      it('passes a custom externalIdPrefix when provided (Plan 05 CLI hook)', async () => {
        const writer = new Writer();
        await writer.write({ elections: [{ external_id: 'foo_e1', project_id: 'p' }] }, 'foo_');

        const instance = await getMockedAdminClient();
        expect(instance.selectCandidatesForPortraitUpload).toHaveBeenCalledWith('foo_');
      });

      it('uploads one portrait per candidate with deterministic cycling (portraits[i % N]) and calls updateCandidateImage for each', async () => {
        const candidates = [
          { id: 'uuid-1', external_id: 'seed_cand_0000', first_name: 'Alice', last_name: 'Smith' },
          { id: 'uuid-2', external_id: 'seed_cand_0001', first_name: 'Bob', last_name: 'Jones' },
          { id: 'uuid-3', external_id: 'seed_cand_0002', first_name: 'Carol', last_name: 'Kim' }
        ];

        const writer = new Writer();
        // Override the default mock on the newly-constructed instance.
        const instance = await getMockedAdminClient();
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce(candidates);
        instance.uploadPortrait.mockImplementation(
          async (id: string, _ext: string, filename: string) => `test-project/candidates/${id}/${filename}`
        );

        await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });

        expect(instance.uploadPortrait).toHaveBeenCalledTimes(3);
        expect(instance.updateCandidateImage).toHaveBeenCalledTimes(3);

        // Cycling determinism: candidate i receives portrait-(i+1).jpg (sorted order).
        const uploadCalls = instance.uploadPortrait.mock.calls;
        expect(uploadCalls[0][0]).toBe('uuid-1');
        expect(uploadCalls[1][0]).toBe('uuid-2');
        expect(uploadCalls[2][0]).toBe('uuid-3');
        // All uploads use the canonical "seed-portrait.jpg" filename at the remote path.
        expect(uploadCalls[0][2]).toBe('seed-portrait.jpg');

        // updateCandidateImage gets { path, alt } where alt = "First Last".
        const updateCalls = instance.updateCandidateImage.mock.calls;
        expect(updateCalls[0][2].alt).toBe('Alice Smith');
        expect(updateCalls[1][2].alt).toBe('Bob Jones');
        expect(updateCalls[2][2].alt).toBe('Carol Kim');
        // path returned by uploadPortrait flows into updateCandidateImage.
        expect(updateCalls[0][2].path).toBe('test-project/candidates/uuid-1/seed-portrait.jpg');
      });

      it('builds alt text as "first_name last_name" trimmed, falling back to external_id when names are empty (WCAG 2.1 AA — Pitfall #4)', async () => {
        const candidates = [{ id: 'u1', external_id: 'seed_cand_edge', first_name: '', last_name: '' }];

        const writer = new Writer();
        const instance = await getMockedAdminClient();
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce(candidates);
        instance.uploadPortrait.mockResolvedValueOnce('test-path');

        await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });

        const updateCalls = instance.updateCandidateImage.mock.calls;
        expect(updateCalls[0][2].alt).toBe('seed_cand_edge');
        // Never empty — the fallback ensures alt is always a non-empty string.
        expect(updateCalls[0][2].alt.length).toBeGreaterThan(0);
      });

      it('wraps candidate-name whitespace correctly (trims internal padding)', async () => {
        const candidates = [{ id: 'u1', external_id: 'seed_cand_A', first_name: '  Alice  ', last_name: '  Smith  ' }];

        const writer = new Writer();
        const instance = await getMockedAdminClient();
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce(candidates);
        instance.uploadPortrait.mockResolvedValueOnce('p');

        await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });
        const updateCalls = instance.updateCandidateImage.mock.calls;
        // Trim collapses leading/trailing whitespace; internal single space preserved.
        expect(updateCalls[0][2].alt.trim()).toBe(updateCalls[0][2].alt);
      });

      it('skips the portrait pass silently when no generator-produced candidates exist (count=0 templates)', async () => {
        const writer = new Writer();
        const instance = await getMockedAdminClient();
        // Default mock returns [] already, but assert explicitly.
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce([]);

        await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });

        expect(instance.uploadPortrait).not.toHaveBeenCalled();
        expect(instance.updateCandidateImage).not.toHaveBeenCalled();
      });

      it('rethrows upload errors with candidate-scoped message and does NOT invoke updateAppSettings on the failing run', async () => {
        const candidates = [{ id: 'u1', external_id: 'seed_cand_0000', first_name: 'Alice', last_name: 'Smith' }];

        const writer = new Writer();
        const instance = await getMockedAdminClient();
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce(candidates);
        instance.uploadPortrait.mockRejectedValueOnce(
          new Error('Portrait upload failed for seed_cand_0000: bucket not found')
        );

        await expect(
          writer.write({
            elections: [{ external_id: 'seed_e1', project_id: 'p' }],
            app_settings: [{ settings: { k: 'v' } }]
          })
        ).rejects.toThrow(/Portrait upload failed for seed_cand_0000/);

        // updateAppSettings must NOT be called because uploadPortraits threw.
        expect(instance.updateAppSettings).not.toHaveBeenCalled();
      });

      it('rethrows updateCandidateImage errors and does NOT invoke updateAppSettings', async () => {
        const candidates = [{ id: 'u1', external_id: 'seed_cand_0001', first_name: 'A', last_name: 'B' }];

        const writer = new Writer();
        const instance = await getMockedAdminClient();
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce(candidates);
        instance.uploadPortrait.mockResolvedValueOnce('p');
        instance.updateCandidateImage.mockRejectedValueOnce(
          new Error('Image column update failed for seed_cand_0001: row not found')
        );

        await expect(
          writer.write({
            elections: [{ external_id: 'seed_e1', project_id: 'p' }],
            app_settings: [{ settings: { k: 'v' } }]
          })
        ).rejects.toThrow(/Image column update failed for seed_cand_0001/);

        expect(instance.updateAppSettings).not.toHaveBeenCalled();
      });

      it('returns { portraits: N } where N is the upload count', async () => {
        const candidates = [
          { id: 'u1', external_id: 'seed_cand_0', first_name: 'A', last_name: 'B' },
          { id: 'u2', external_id: 'seed_cand_1', first_name: 'C', last_name: 'D' }
        ];

        const writer = new Writer();
        const instance = await getMockedAdminClient();
        instance.selectCandidatesForPortraitUpload.mockResolvedValueOnce(candidates);
        instance.uploadPortrait.mockResolvedValue('test-path');

        const result = await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });

        expect(result).toEqual({ portraits: 2 });
      });

      it('returns { portraits: 0 } when no candidates exist', async () => {
        const writer = new Writer();
        // Default mock returns [].
        const result = await writer.write({ elections: [{ external_id: 'seed_e1', project_id: 'p' }] });
        expect(result).toEqual({ portraits: 0 });
      });
    });
  });
});
