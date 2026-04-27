/**
 * teardown.ts + supabaseAdminClient storage-cleanup tests
 * (Phase 58 Plan 07 — CLI-03 + D-58-07 + D-58-17 + Pitfall #5 + Pitfall #6).
 *
 * Covers:
 *   - `SupabaseAdminClient.listCandidatePortraitPaths()` — 2-level enumeration
 *     of `${projectId}/candidates/` directory in `public-assets` bucket.
 *   - `SupabaseAdminClient.removePortraitStorageObjects(paths)` — bulk remove
 *     via the Storage API.
 *   - `runTeardown(prefix, client)` pure orchestrator:
 *       1. bulkDelete of exactly the 10 allowed tables (Pitfall #6 guardrail).
 *       2. Explicit Storage Path 2 cleanup AFTER bulkDelete (RESEARCH §3).
 *       3. `--prefix` override.
 *       4. Prefix length guard (T-58-07-02 — mass-delete prevention).
 *       5. Error rephrasing for `fetch failed` (D-58-12 parity).
 *   - `TEARDOWN_USAGE` constant (CLI-04 / D-58-13).
 *
 * D-22 pattern: all Supabase side-effects go through a mocked client — tests
 * are fully offline. Integration test (Plan 09) exercises the live path.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock surface for SupabaseAdminClient tests (list/remove)
// ---------------------------------------------------------------------------

interface StorageMockState {
  // Per-path list results: paths requested → { data, error }
  listResults: Map<string, { data: unknown; error: unknown }>;
  removeResult: { data: unknown; error: unknown };
  // Recorded calls
  storageFromCalls: Array<string>;
  listCalls: Array<[string, Record<string, unknown>]>;
  removeCalls: Array<Array<string>>;
}

const storageState: StorageMockState = {
  listResults: new Map(),
  removeResult: { data: [], error: null },
  storageFromCalls: [],
  listCalls: [],
  removeCalls: []
};

vi.mock('@supabase/supabase-js', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function makeBuilder(): any {
    return {
      // The portrait-surface tests rely on the builder terminals, but the
      // list/remove tests only touch the storage facade below. Provide a
      // harmless always-resolving builder for completeness.
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null })
    };
  }

  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => makeBuilder()),
      storage: {
        from: vi.fn((bucket: string) => {
          storageState.storageFromCalls.push(bucket);
          return {
            list: vi.fn(async (path: string, opts: Record<string, unknown>) => {
              storageState.listCalls.push([path, opts]);
              return storageState.listResults.get(path) ?? { data: [], error: null };
            }),
            remove: vi.fn(async (paths: Array<string>) => {
              storageState.removeCalls.push(paths);
              return storageState.removeResult;
            })
          };
        })
      }
    }))
  };
});

// Import AFTER vi.mock so `createClient` is the mocked version.
// eslint-disable-next-line import/first
import { SupabaseAdminClient } from '../../src/supabaseAdminClient';

function resetStorageMockState(): void {
  storageState.listResults = new Map();
  storageState.removeResult = { data: [], error: null };
  storageState.storageFromCalls = [];
  storageState.listCalls = [];
  storageState.removeCalls = [];
}

// ---------------------------------------------------------------------------
// SupabaseAdminClient.listCandidatePortraitPaths + removePortraitStorageObjects
// ---------------------------------------------------------------------------

describe('SupabaseAdminClient storage cleanup surface (Phase 58 Plan 07)', () => {
  beforeEach(() => {
    resetStorageMockState();
    vi.clearAllMocks();
  });

  describe('listCandidatePortraitPaths', () => {
    it('returns flat array of `${projectId}/candidates/${uuid}/${filename}` for every file under the candidates dir', async () => {
      storageState.listResults.set('proj-xyz/candidates', {
        data: [{ name: 'cand-1' }, { name: 'cand-2' }],
        error: null
      });
      storageState.listResults.set('proj-xyz/candidates/cand-1', {
        data: [{ name: 'seed-portrait.jpg' }],
        error: null
      });
      storageState.listResults.set('proj-xyz/candidates/cand-2', {
        data: [{ name: 'seed-portrait.jpg' }],
        error: null
      });

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      const paths = await client.listCandidatePortraitPaths();

      expect(paths).toEqual([
        'proj-xyz/candidates/cand-1/seed-portrait.jpg',
        'proj-xyz/candidates/cand-2/seed-portrait.jpg'
      ]);
      expect(storageState.storageFromCalls).toContain('public-assets');
    });

    it('returns empty array when candidates dir is empty or missing (initial state)', async () => {
      storageState.listResults.set('proj-xyz/candidates', { data: [], error: null });

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      const paths = await client.listCandidatePortraitPaths();
      expect(paths).toEqual([]);
    });

    it('returns empty array when the bucket/path is not found (treats as empty)', async () => {
      storageState.listResults.set('proj-xyz/candidates', {
        data: null,
        error: { message: 'The resource was not found' }
      });

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      const paths = await client.listCandidatePortraitPaths();
      expect(paths).toEqual([]);
    });

    it('throws with prefixed message on non-not-found list error', async () => {
      storageState.listResults.set('proj-xyz/candidates', {
        data: null,
        error: { message: 'connection refused' }
      });

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      await expect(client.listCandidatePortraitPaths()).rejects.toThrow(
        /listCandidatePortraitPaths: list dirs failed: connection refused/
      );
    });

    it('skips the `.emptyFolderPlaceholder` entry Supabase Storage creates', async () => {
      storageState.listResults.set('proj-xyz/candidates', {
        data: [{ name: '.emptyFolderPlaceholder' }, { name: 'cand-1' }],
        error: null
      });
      storageState.listResults.set('proj-xyz/candidates/cand-1', {
        data: [{ name: '.emptyFolderPlaceholder' }, { name: 'seed-portrait.jpg' }],
        error: null
      });

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      const paths = await client.listCandidatePortraitPaths();
      expect(paths).toEqual(['proj-xyz/candidates/cand-1/seed-portrait.jpg']);
    });
  });

  describe('removePortraitStorageObjects', () => {
    it('calls `.storage.from("public-assets").remove(paths)` and returns the count removed', async () => {
      storageState.removeResult = {
        data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
        error: null
      };

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      const count = await client.removePortraitStorageObjects(['a', 'b', 'c']);

      expect(count).toBe(3);
      expect(storageState.removeCalls).toEqual([['a', 'b', 'c']]);
      expect(storageState.storageFromCalls).toContain('public-assets');
    });

    it('returns 0 without hitting the API when paths is empty', async () => {
      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      const count = await client.removePortraitStorageObjects([]);
      expect(count).toBe(0);
      expect(storageState.removeCalls).toHaveLength(0);
    });

    it('throws with prefixed message on remove error', async () => {
      storageState.removeResult = { data: null, error: { message: 'forbidden' } };

      const client = new SupabaseAdminClient('http://localhost', 'key', 'proj-xyz');
      await expect(client.removePortraitStorageObjects(['x'])).rejects.toThrow(
        /removePortraitStorageObjects failed: forbidden/
      );
    });
  });
});

// ---------------------------------------------------------------------------
// runTeardown orchestrator
// ---------------------------------------------------------------------------

// eslint-disable-next-line import/first
import { runTeardown } from '../../src/cli/teardown';
// eslint-disable-next-line import/first
import { TEARDOWN_USAGE } from '../../src/cli/teardown-help';

interface FakeClient {
  bulkDelete: ReturnType<typeof vi.fn>;
  listCandidateIdsByPrefix: ReturnType<typeof vi.fn>;
  listCandidatePortraitPaths: ReturnType<typeof vi.fn>;
  removePortraitStorageObjects: ReturnType<typeof vi.fn>;
}

function makeFakeClient(overrides: Partial<FakeClient> = {}): FakeClient {
  return {
    bulkDelete: vi.fn().mockResolvedValue({
      nominations: { deleted: 0 },
      questions: { deleted: 0 },
      question_categories: { deleted: 0 },
      candidates: { deleted: 0 },
      factions: { deleted: 0 },
      alliances: { deleted: 0 },
      organizations: { deleted: 0 },
      constituencies: { deleted: 0 },
      constituency_groups: { deleted: 0 },
      elections: { deleted: 0 }
    }),
    listCandidateIdsByPrefix: vi.fn().mockResolvedValue([]),
    listCandidatePortraitPaths: vi.fn().mockResolvedValue([]),
    removePortraitStorageObjects: vi.fn().mockResolvedValue(0),
    ...overrides
  };
}

describe('runTeardown (CLI-03 / D-58-07 / D-58-17 / Pitfall #5 + #6)', () => {
  it('calls bulkDelete exactly once with the 10 allowed tables (Pitfall #6 — no accounts/projects/feedback/app_settings)', async () => {
    const client = makeFakeClient();
    await runTeardown('seed_', client as unknown as SupabaseAdminClient);

    expect(client.bulkDelete).toHaveBeenCalledTimes(1);
    const collections = client.bulkDelete.mock.calls[0][0];
    expect(Object.keys(collections).sort()).toEqual([
      'alliances',
      'candidates',
      'constituencies',
      'constituency_groups',
      'elections',
      'factions',
      'nominations',
      'organizations',
      'question_categories',
      'questions'
    ]);
    // Guardrail: none of the forbidden names are present.
    expect(Object.keys(collections)).not.toContain('accounts');
    expect(Object.keys(collections)).not.toContain('projects');
    expect(Object.keys(collections)).not.toContain('feedback');
    // app_settings is also NOT in the teardown call (writer merges, doesn't insert).
    expect(Object.keys(collections)).not.toContain('app_settings');
  });

  it('passes the given prefix into every table entry (default seed_)', async () => {
    const client = makeFakeClient();
    await runTeardown('seed_', client as unknown as SupabaseAdminClient);

    const collections = client.bulkDelete.mock.calls[0][0];
    for (const spec of Object.values(collections) as Array<{ prefix: string }>) {
      expect(spec.prefix).toBe('seed_');
    }
  });

  it('honors a custom prefix override (e.g. test_)', async () => {
    const client = makeFakeClient();
    await runTeardown('test_', client as unknown as SupabaseAdminClient);

    const collections = client.bulkDelete.mock.calls[0][0];
    for (const spec of Object.values(collections) as Array<{ prefix: string }>) {
      expect(spec.prefix).toBe('test_');
    }
  });

  it('collects candidate UUIDs BEFORE bulkDelete, lists+removes portraits AFTER (UAT gap #1)', async () => {
    const order: Array<string> = [];
    const client = makeFakeClient({
      listCandidateIdsByPrefix: vi.fn().mockImplementation(async () => {
        order.push('listCandidateIdsByPrefix');
        return [];
      }),
      bulkDelete: vi.fn().mockImplementation(async () => {
        order.push('bulkDelete');
        return {};
      }),
      listCandidatePortraitPaths: vi.fn().mockImplementation(async () => {
        order.push('listCandidatePortraitPaths');
        return [];
      }),
      removePortraitStorageObjects: vi.fn().mockImplementation(async () => {
        order.push('removePortraitStorageObjects');
        return 0;
      })
    });

    await runTeardown('seed_', client as unknown as SupabaseAdminClient);
    expect(order).toEqual([
      'listCandidateIdsByPrefix',
      'bulkDelete',
      'listCandidatePortraitPaths',
      'removePortraitStorageObjects'
    ]);
  });

  it('scopes listCandidatePortraitPaths to the UUIDs returned by listCandidateIdsByPrefix (UAT gap #1 — prefix isolation)', async () => {
    const client = makeFakeClient({
      listCandidateIdsByPrefix: vi.fn().mockResolvedValue(['uuid-1', 'uuid-2'])
    });

    await runTeardown('uat_', client as unknown as SupabaseAdminClient);

    expect(client.listCandidateIdsByPrefix).toHaveBeenCalledWith('uat_');
    expect(client.listCandidatePortraitPaths).toHaveBeenCalledWith(['uuid-1', 'uuid-2']);
  });

  it('passes the listed paths through to removePortraitStorageObjects', async () => {
    const client = makeFakeClient({
      listCandidatePortraitPaths: vi
        .fn()
        .mockResolvedValue(['proj/candidates/c1/seed-portrait.jpg', 'proj/candidates/c2/seed-portrait.jpg']),
      removePortraitStorageObjects: vi.fn().mockResolvedValue(2)
    });

    await runTeardown('seed_', client as unknown as SupabaseAdminClient);
    expect(client.removePortraitStorageObjects).toHaveBeenCalledWith([
      'proj/candidates/c1/seed-portrait.jpg',
      'proj/candidates/c2/seed-portrait.jpg'
    ]);
  });

  it('returns { rowsDeleted, storageRemoved } summing bulkDelete deleted counts + removed count', async () => {
    const client = makeFakeClient({
      bulkDelete: vi.fn().mockResolvedValue({
        candidates: { deleted: 100 },
        nominations: { deleted: 150 },
        questions: { deleted: 24 }
      }),
      listCandidatePortraitPaths: vi.fn().mockResolvedValue(['a', 'b']),
      removePortraitStorageObjects: vi.fn().mockResolvedValue(2)
    });

    const result = await runTeardown('seed_', client as unknown as SupabaseAdminClient);
    expect(result).toEqual({ rowsDeleted: 274, storageRemoved: 2 });
  });

  it('handles a bulkDelete result shape that omits `deleted` fields (returns 0 for missing entries)', async () => {
    const client = makeFakeClient({
      bulkDelete: vi.fn().mockResolvedValue({ candidates: { something: 'else' } })
    });

    const result = await runTeardown('seed_', client as unknown as SupabaseAdminClient);
    expect(result.rowsDeleted).toBe(0);
  });

  it('throws T-58-07-02 mass-delete guard when prefix is empty string', async () => {
    const client = makeFakeClient();
    await expect(runTeardown('', client as unknown as SupabaseAdminClient)).rejects.toThrow(
      /prefix must be at least 2 characters/
    );
    expect(client.bulkDelete).not.toHaveBeenCalled();
  });

  it('throws T-58-07-02 mass-delete guard when prefix is a single char', async () => {
    const client = makeFakeClient();
    await expect(runTeardown('s', client as unknown as SupabaseAdminClient)).rejects.toThrow(
      /prefix must be at least 2 characters/
    );
    expect(client.bulkDelete).not.toHaveBeenCalled();
  });

  it('re-throws bulkDelete errors verbatim (CLI wrapper rephrases at process boundary)', async () => {
    const client = makeFakeClient({
      bulkDelete: vi.fn().mockRejectedValue(new Error('bulkDelete failed: Unknown collection for deletion: feedback'))
    });

    await expect(runTeardown('seed_', client as unknown as SupabaseAdminClient)).rejects.toThrow(
      /Unknown collection for deletion: feedback/
    );
  });
});

// ---------------------------------------------------------------------------
// TEARDOWN_USAGE
// ---------------------------------------------------------------------------

describe('TEARDOWN_USAGE (CLI-04 / D-58-13)', () => {
  it('starts with Usage: line', () => {
    expect(TEARDOWN_USAGE).toMatch(/^Usage: yarn workspace @openvaa\/dev-seed seed:teardown/);
  });

  it('documents --prefix flag', () => {
    expect(TEARDOWN_USAGE).toContain('--prefix');
  });

  it('documents --help / -h flag', () => {
    expect(TEARDOWN_USAGE).toMatch(/-h, --help/);
  });

  it('documents SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars', () => {
    expect(TEARDOWN_USAGE).toContain('SUPABASE_URL');
    expect(TEARDOWN_USAGE).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('mentions the default seed_ prefix', () => {
    expect(TEARDOWN_USAGE).toMatch(/seed_/);
  });

  it('mentions that teardown is permissive on the prefix (D-58-17)', () => {
    expect(TEARDOWN_USAGE).toMatch(/[Pp]ermissive/);
  });
});
