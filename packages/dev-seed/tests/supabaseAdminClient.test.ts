/**
 * SupabaseAdminClient portrait-surface unit tests (Phase 58 Plan 04 — GEN-09).
 *
 * Covers the three narrow methods added for portrait upload:
 *   - selectCandidatesForPortraitUpload — reads candidate rows by external_id prefix (Pitfall #8).
 *   - uploadPortrait — uploads a JPEG to the `public-assets` Storage bucket.
 *   - updateCandidateImage — writes `{ path, alt }` into `candidates.image` JSONB (Pitfall #2, #4).
 *
 * Pattern: mock `@supabase/supabase-js` `createClient` to return a stub with the
 * `.from(...)` / `.storage.from(...)` surfaces we exercise. Each test configures
 * the stub's return values to assert success + error branches.
 *
 * D-22: pure I/O contract — no real Supabase contact.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock state — mutable per-test stubs the createClient mock returns.
// ---------------------------------------------------------------------------

interface MockState {
  selectResult: { data: unknown; error: unknown };
  updateResult: { error: unknown };
  uploadResult: { error: unknown };
  // Recorded calls
  fromCalls: Array<string>;
  selectCalls: Array<string>;
  eqCalls: Array<[string, unknown]>;
  likeCalls: Array<[string, unknown]>;
  orderCalls: Array<[string, Record<string, unknown>]>;
  updateCalls: Array<Record<string, unknown>>;
  storageFromCalls: Array<string>;
  uploadCalls: Array<[string, unknown, Record<string, unknown>]>;
}

const mockState: MockState = {
  selectResult: { data: [], error: null },
  updateResult: { error: null },
  uploadResult: { error: null },
  fromCalls: [],
  selectCalls: [],
  eqCalls: [],
  likeCalls: [],
  orderCalls: [],
  updateCalls: [],
  storageFromCalls: [],
  uploadCalls: []
};

// Mock `@supabase/supabase-js` — each .from() returns a thenable builder whose
// terminal resolves to selectResult (if .select was called last) or updateResult
// (if .update was called last). Chain methods push to mockState for assertions.
vi.mock('@supabase/supabase-js', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeBuilder = (): any => {
    let terminalKind: 'select' | 'update' = 'select';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: any = {};
    b.select = vi.fn((cols: string) => {
      mockState.selectCalls.push(cols);
      terminalKind = 'select';
      return b;
    });
    b.update = vi.fn((payload: Record<string, unknown>) => {
      mockState.updateCalls.push(payload);
      terminalKind = 'update';
      return b;
    });
    b.eq = vi.fn((col: string, val: unknown) => {
      mockState.eqCalls.push([col, val]);
      return b;
    });
    b.like = vi.fn((col: string, val: unknown) => {
      mockState.likeCalls.push([col, val]);
      return b;
    });
    b.order = vi.fn((col: string, opts: Record<string, unknown>) => {
      mockState.orderCalls.push([col, opts]);
      return b;
    });
    b.then = (resolve: (v: unknown) => void) => {
      const result = terminalKind === 'update' ? mockState.updateResult : mockState.selectResult;
      resolve(result);
    };
    return b;
  };

  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        mockState.fromCalls.push(table);
        return makeBuilder();
      }),
      storage: {
        from: vi.fn((bucket: string) => {
          mockState.storageFromCalls.push(bucket);
          return {
            upload: vi.fn(async (path: string, bytes: unknown, opts: Record<string, unknown>) => {
              mockState.uploadCalls.push([path, bytes, opts]);
              return mockState.uploadResult;
            })
          };
        })
      }
    }))
  };
});

// Imported AFTER the vi.mock so createClient resolves to the mocked module.
import { SupabaseAdminClient } from '../src/supabaseAdminClient';

function resetMockState(): void {
  mockState.selectResult = { data: [], error: null };
  mockState.updateResult = { error: null };
  mockState.uploadResult = { error: null };
  mockState.fromCalls = [];
  mockState.selectCalls = [];
  mockState.eqCalls = [];
  mockState.likeCalls = [];
  mockState.orderCalls = [];
  mockState.updateCalls = [];
  mockState.storageFromCalls = [];
  mockState.uploadCalls = [];
}

describe('SupabaseAdminClient portrait surface (Phase 58 Plan 04)', () => {
  beforeEach(() => {
    resetMockState();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // selectCandidatesForPortraitUpload
  // -------------------------------------------------------------------------

  describe('selectCandidatesForPortraitUpload', () => {
    it('queries candidates table with project_id eq + external_id like prefix + order by external_id asc', async () => {
      mockState.selectResult = {
        data: [
          { id: 'uuid-1', external_id: 'seed_cand_0', first_name: 'Alice', last_name: 'Smith' },
          { id: 'uuid-2', external_id: 'seed_cand_1', first_name: 'Bob', last_name: 'Jones' }
        ],
        error: null
      };

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-123');
      const rows = await client.selectCandidatesForPortraitUpload('seed_');

      expect(mockState.fromCalls).toContain('candidates');
      expect(mockState.selectCalls[0]).toContain('id');
      expect(mockState.selectCalls[0]).toContain('external_id');
      expect(mockState.selectCalls[0]).toContain('first_name');
      expect(mockState.selectCalls[0]).toContain('last_name');
      expect(mockState.eqCalls).toContainEqual(['project_id', 'proj-123']);
      expect(mockState.likeCalls).toContainEqual(['external_id', 'seed_%']);
      expect(mockState.orderCalls[0]).toEqual(['external_id', { ascending: true }]);
      expect(rows).toHaveLength(2);
      expect(rows[0].first_name).toBe('Alice');
    });

    it('throws descriptively when the select returns an error', async () => {
      mockState.selectResult = { data: null, error: { message: 'connection refused' } };

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-123');
      await expect(client.selectCandidatesForPortraitUpload('seed_')).rejects.toThrow(
        /selectCandidatesForPortraitUpload failed: connection refused/
      );
    });

    it('returns empty array when no rows match (count=0 template case)', async () => {
      mockState.selectResult = { data: [], error: null };

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-123');
      const rows = await client.selectCandidatesForPortraitUpload('seed_');
      expect(rows).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // uploadPortrait
  // -------------------------------------------------------------------------

  describe('uploadPortrait', () => {
    it('uploads to public-assets bucket with 3-segment RLS-compliant path + jpeg contentType + upsert=true', async () => {
      mockState.uploadResult = { error: null };
      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-abc');
      const bytes = new Uint8Array([0xff, 0xd8, 0xff]);

      const path = await client.uploadPortrait('cand-uuid-7', 'seed_cand_0007', 'seed-portrait.jpg', bytes);

      expect(path).toBe('proj-abc/candidates/cand-uuid-7/seed-portrait.jpg');
      expect(mockState.storageFromCalls).toContain('public-assets');
      expect(mockState.uploadCalls).toHaveLength(1);
      const [uploadedPath, uploadedBytes, uploadedOpts] = mockState.uploadCalls[0];
      expect(uploadedPath).toBe('proj-abc/candidates/cand-uuid-7/seed-portrait.jpg');
      expect(uploadedBytes).toBe(bytes);
      expect(uploadedOpts.contentType).toBe('image/jpeg');
      expect(uploadedOpts.upsert).toBe(true);
    });

    it('throws candidate-scoped error when storage upload fails', async () => {
      mockState.uploadResult = { error: { message: 'bucket not found' } };
      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-abc');
      const bytes = new Uint8Array([0xff, 0xd8, 0xff]);

      await expect(
        client.uploadPortrait('cand-uuid-7', 'seed_cand_0007', 'seed-portrait.jpg', bytes)
      ).rejects.toThrow(/Portrait upload failed for seed_cand_0007: bucket not found/);
    });
  });

  // -------------------------------------------------------------------------
  // updateCandidateImage
  // -------------------------------------------------------------------------

  describe('updateCandidateImage', () => {
    it('updates the `image` JSONB column (NOT `image_id`) with the given {path, alt}', async () => {
      mockState.updateResult = { error: null };
      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');

      await client.updateCandidateImage('cand-uuid-2', 'seed_cand_0002', {
        path: 'proj-xyz/candidates/cand-uuid-2/seed-portrait.jpg',
        alt: 'Alice Smith'
      });

      expect(mockState.fromCalls).toContain('candidates');
      expect(mockState.updateCalls).toHaveLength(1);
      const updatePayload = mockState.updateCalls[0];
      expect(updatePayload).toHaveProperty('image');
      expect((updatePayload.image as { path: string; alt: string }).path).toBe(
        'proj-xyz/candidates/cand-uuid-2/seed-portrait.jpg'
      );
      expect((updatePayload.image as { path: string; alt: string }).alt).toBe('Alice Smith');
      // Must NOT be `image_id` (Pitfall #2)
      expect(updatePayload).not.toHaveProperty('image_id');
      // Update filtered by id
      expect(mockState.eqCalls).toContainEqual(['id', 'cand-uuid-2']);
    });

    it('throws candidate-scoped error when the update fails', async () => {
      mockState.updateResult = { error: { message: 'row not found' } };
      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');

      await expect(
        client.updateCandidateImage('cand-uuid-2', 'seed_cand_0002', { path: 'x', alt: 'A' })
      ).rejects.toThrow(/Image column update failed for seed_cand_0002: row not found/);
    });
  });
});
