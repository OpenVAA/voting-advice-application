import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $env/dynamic/public before any imports that depend on it
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

import { SupabaseDataProvider } from './supabaseDataProvider';

/**
 * A flexible mock Supabase client that supports chainable PostgREST query patterns:
 *   .from(table).select(columns).limit(n).single()  -> {data, error}
 *   .from(table).select(columns).order(col)          -> {data, error}
 *   .from(table).select(columns).eq(col, val)        -> {data, error}
 *   .from(table).select(columns).in(col, vals)       -> {data, error}
 *
 * Configure per-table responses via `mockResponses`.
 */
function createMockSupabaseClient() {
  const mockResponses: Record<string, { data: unknown; error: unknown }> = {};

  function createChain(table: string) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        return Promise.resolve(mockResponses[table] ?? { data: null, error: null });
      }),
      then: undefined as unknown as PromiseLike<unknown>['then']
    };
    // Make the chain itself thenable so `await query` works on non-single queries
    chain.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
      const result = mockResponses[table] ?? { data: null, error: null };
      return Promise.resolve(result).then(resolve, reject);
    };
    return chain;
  }

  const client = {
    from: vi.fn((table: string) => createChain(table)),
    _mockResponses: mockResponses
  };
  return client;
}

describe('SupabaseDataProvider', () => {
  let provider: SupabaseDataProvider;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    provider = new SupabaseDataProvider();
    provider.init({
      fetch: vi.fn(),
      serverClient: mockSupabase as any,
      locale: 'en',
      defaultLocale: 'en'
    });
  });

  describe('getAppSettings', () => {
    it('fetches from app_settings table and returns settings JSONB as Partial<DynamicSettings>', async () => {
      const mockSettings = {
        access: { candidateApp: true, voterApp: true, adminApp: false },
        header: { showFeedback: true, showHelp: true }
      };
      mockSupabase._mockResponses['app_settings'] = {
        data: { settings: mockSettings },
        error: null
      };

      const result = await provider.getAppSettings();

      expect(mockSupabase.from).toHaveBeenCalledWith('app_settings');
      expect(result).toEqual(mockSettings);
    });

    it('localizes notification title and content fields when locale provided', async () => {
      const mockSettings = {
        notifications: {
          candidateApp: {
            show: true,
            title: { en: 'English title', fi: 'Finnish title' },
            content: { en: 'English content', fi: 'Finnish content' }
          },
          voterApp: {
            show: true,
            title: { en: 'Voter EN', fi: 'Voter FI' },
            content: { en: 'Content EN', fi: 'Content FI' }
          }
        }
      };
      mockSupabase._mockResponses['app_settings'] = {
        data: { settings: mockSettings },
        error: null
      };

      // Create a provider with fi locale
      const fiProvider = new SupabaseDataProvider();
      fiProvider.init({
        fetch: vi.fn(),
        serverClient: mockSupabase as any,
        locale: 'fi',
        defaultLocale: 'en'
      });

      const result = await fiProvider.getAppSettings();

      expect((result as any).notifications.candidateApp.title).toBe('Finnish title');
      expect((result as any).notifications.candidateApp.content).toBe('Finnish content');
      expect((result as any).notifications.voterApp.title).toBe('Voter FI');
      expect((result as any).notifications.voterApp.content).toBe('Content FI');
    });

    it('returns empty object if no app_settings row exists', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      };

      const result = await provider.getAppSettings();

      expect(result).toEqual({});
    });

    it('throws on Supabase query error', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: null,
        error: { code: '42P01', message: 'relation does not exist' }
      };

      await expect(provider.getAppSettings()).rejects.toThrow('getAppSettings');
    });
  });

  describe('getAppCustomization', () => {
    it('returns AppCustomization with localized publisherName string', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: {
          customization: {
            publisherName: { en: 'Publisher EN', fi: 'Publisher FI' }
          }
        },
        error: null
      };

      const fiProvider = new SupabaseDataProvider();
      fiProvider.init({
        fetch: vi.fn(),
        serverClient: mockSupabase as any,
        locale: 'fi',
        defaultLocale: 'en'
      });

      const result = await fiProvider.getAppCustomization();

      expect(result.publisherName).toBe('Publisher FI');
    });

    it('converts publisherLogo, poster, candPoster storage paths to Image objects with absolute URLs', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: {
          customization: {
            publisherLogo: { path: 'proj/logo.png' },
            poster: { path: 'proj/poster.jpg', pathDark: 'proj/poster-dark.jpg' },
            candPoster: { path: 'proj/cand.png' }
          }
        },
        error: null
      };

      const result = await provider.getAppCustomization();

      expect(result.publisherLogo?.url).toBe('http://localhost:54321/storage/v1/object/public/public-assets/proj/logo.png');
      expect(result.poster?.url).toBe('http://localhost:54321/storage/v1/object/public/public-assets/proj/poster.jpg');
      expect(result.poster?.urlDark).toBe('http://localhost:54321/storage/v1/object/public/public-assets/proj/poster-dark.jpg');
      expect(result.candPoster?.url).toBe('http://localhost:54321/storage/v1/object/public/public-assets/proj/cand.png');
    });

    it('localizes translationOverrides (each override value is a LocalizedString)', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: {
          customization: {
            translationOverrides: {
              'common.appTitle': { en: 'My VAA', fi: 'Minun VAA' },
              'common.startButton': { en: 'Start', fi: 'Aloita' }
            }
          }
        },
        error: null
      };

      const fiProvider = new SupabaseDataProvider();
      fiProvider.init({
        fetch: vi.fn(),
        serverClient: mockSupabase as any,
        locale: 'fi',
        defaultLocale: 'en'
      });

      const result = await fiProvider.getAppCustomization();

      expect(result.translationOverrides?.['common.appTitle' as any]).toBe('Minun VAA');
      expect(result.translationOverrides?.['common.startButton' as any]).toBe('Aloita');
    });

    it('localizes candidateAppFAQ question and answer fields', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: {
          customization: {
            candidateAppFAQ: [
              {
                question: { en: 'How?', fi: 'Miten?' },
                answer: { en: 'Like this', fi: 'Nain' }
              }
            ]
          }
        },
        error: null
      };

      const fiProvider = new SupabaseDataProvider();
      fiProvider.init({
        fetch: vi.fn(),
        serverClient: mockSupabase as any,
        locale: 'fi',
        defaultLocale: 'en'
      });

      const result = await fiProvider.getAppCustomization();

      expect(result.candidateAppFAQ?.[0].question).toBe('Miten?');
      expect(result.candidateAppFAQ?.[0].answer).toBe('Nain');
    });

    it('returns empty object if customization column is empty/null', async () => {
      mockSupabase._mockResponses['app_settings'] = {
        data: { customization: null },
        error: null
      };

      const result = await provider.getAppCustomization();

      expect(result).toEqual({});
    });
  });

  describe('getElectionData', () => {
    it('fetches elections with embedded election_constituency_groups and returns ElectionData array', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: [
          {
            id: 'e1',
            name: { en: 'Election 2024' },
            short_name: { en: 'E24' },
            info: null,
            sort_order: 1,
            election_date: '2024-06-01',
            election_type: 'presidential',
            current_round: 1,
            multiple_rounds: false,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            election_constituency_groups: [{ constituency_group_id: 'cg1' }]
          }
        ],
        error: null
      };

      const result = await provider.getElectionData();

      expect(mockSupabase.from).toHaveBeenCalledWith('elections');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e1');
      expect(result[0].name).toBe('Election 2024');
    });

    it('maps election_date to date, current_round to round, election_type to subtype', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: [
          {
            id: 'e1',
            name: { en: 'Election' },
            short_name: null,
            info: null,
            sort_order: 1,
            election_date: '2024-06-01',
            election_type: 'presidential',
            current_round: 2,
            multiple_rounds: true,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            election_constituency_groups: []
          }
        ],
        error: null
      };

      const result = await provider.getElectionData();

      expect(result[0].date).toBe('2024-06-01');
      expect(result[0].round).toBe(2);
      expect(result[0].subtype).toBe('presidential');
    });

    it('extracts constituencyGroupIds from join table rows as array of UUID strings', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: [
          {
            id: 'e1',
            name: { en: 'Election' },
            short_name: null,
            info: null,
            sort_order: 1,
            election_date: null,
            election_type: null,
            current_round: 1,
            multiple_rounds: false,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            election_constituency_groups: [
              { constituency_group_id: 'cg1' },
              { constituency_group_id: 'cg2' }
            ]
          }
        ],
        error: null
      };

      const result = await provider.getElectionData();

      expect(result[0].constituencyGroupIds).toEqual(['cg1', 'cg2']);
    });

    it('converts image field via parseStoredImage', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: [
          {
            id: 'e1',
            name: { en: 'Election' },
            short_name: null,
            info: null,
            sort_order: 1,
            election_date: null,
            election_type: null,
            current_round: 1,
            multiple_rounds: false,
            color: null,
            image: { path: 'proj/election/e1/banner.png' },
            custom_data: null,
            subtype: null,
            election_constituency_groups: []
          }
        ],
        error: null
      };

      const result = await provider.getElectionData();

      expect(result[0].image?.url).toBe(
        'http://localhost:54321/storage/v1/object/public/public-assets/proj/election/e1/banner.png'
      );
    });

    it('localizes name, short_name, info fields', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: [
          {
            id: 'e1',
            name: { en: 'Election EN', fi: 'Election FI' },
            short_name: { en: 'E-EN', fi: 'E-FI' },
            info: { en: 'Info EN', fi: 'Info FI' },
            sort_order: 1,
            election_date: null,
            election_type: null,
            current_round: 1,
            multiple_rounds: false,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            election_constituency_groups: []
          }
        ],
        error: null
      };

      const fiProvider = new SupabaseDataProvider();
      fiProvider.init({
        fetch: vi.fn(),
        serverClient: mockSupabase as any,
        locale: 'fi',
        defaultLocale: 'en'
      });

      const result = await fiProvider.getElectionData();

      expect(result[0].name).toBe('Election FI');
      expect(result[0].shortName).toBe('E-FI');
      expect(result[0].info).toBe('Info FI');
    });

    it('applies id filter when options.id is provided', async () => {
      mockSupabase._mockResponses['elections'] = {
        data: [],
        error: null
      };

      await provider.getElectionData({ id: 'e1' });

      const chain = mockSupabase.from.mock.results[0].value;
      expect(chain.eq).toHaveBeenCalledWith('id', 'e1');
    });
  });

  describe('getConstituencyData', () => {
    it('returns { groups: ConstituencyGroupData[], constituencies: ConstituencyData[] }', async () => {
      mockSupabase._mockResponses['constituency_groups'] = {
        data: [
          {
            id: 'cg1',
            name: { en: 'Group 1' },
            short_name: null,
            info: null,
            sort_order: 1,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            constituency_group_constituencies: [{ constituency_id: 'c1' }]
          }
        ],
        error: null
      };
      mockSupabase._mockResponses['constituencies'] = {
        data: [
          {
            id: 'c1',
            name: { en: 'Constituency 1' },
            short_name: null,
            info: null,
            sort_order: 1,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            keywords: null,
            parent_id: null
          }
        ],
        error: null
      };

      const result = await provider.getConstituencyData();

      expect(result.groups).toHaveLength(1);
      expect(result.constituencies).toHaveLength(1);
      expect(result.groups[0].id).toBe('cg1');
      expect(result.constituencies[0].id).toBe('c1');
    });

    it('extracts constituencyIds from join table rows', async () => {
      mockSupabase._mockResponses['constituency_groups'] = {
        data: [
          {
            id: 'cg1',
            name: { en: 'Group' },
            short_name: null,
            info: null,
            sort_order: 1,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            constituency_group_constituencies: [
              { constituency_id: 'c1' },
              { constituency_id: 'c2' }
            ]
          }
        ],
        error: null
      };
      mockSupabase._mockResponses['constituencies'] = {
        data: [],
        error: null
      };

      const result = await provider.getConstituencyData();

      expect(result.groups[0].constituencyIds).toEqual(['c1', 'c2']);
    });

    it('localizes keywords field then splits by comma+whitespace into string array', async () => {
      mockSupabase._mockResponses['constituency_groups'] = {
        data: [],
        error: null
      };
      mockSupabase._mockResponses['constituencies'] = {
        data: [
          {
            id: 'c1',
            name: { en: 'Constituency' },
            short_name: null,
            info: null,
            sort_order: 1,
            color: null,
            image: null,
            custom_data: null,
            subtype: null,
            keywords: { en: 'Helsinki, Espoo, Vantaa', fi: 'Helsinki, Espoo, Vantaa' },
            parent_id: null
          }
        ],
        error: null
      };

      const result = await provider.getConstituencyData();

      expect(result.constituencies[0].keywords).toEqual(['Helsinki', 'Espoo', 'Vantaa']);
    });

    it('applies id filter to constituency_groups (not constituencies)', async () => {
      mockSupabase._mockResponses['constituency_groups'] = {
        data: [],
        error: null
      };
      mockSupabase._mockResponses['constituencies'] = {
        data: [],
        error: null
      };

      await provider.getConstituencyData({ id: 'cg1' });

      // constituency_groups should have eq called
      const groupChain = mockSupabase.from.mock.results[0].value;
      expect(groupChain.eq).toHaveBeenCalledWith('id', 'cg1');

      // constituencies should NOT have eq called
      const constChain = mockSupabase.from.mock.results[1].value;
      expect(constChain.eq).not.toHaveBeenCalled();
    });

    it('converts image fields via parseStoredImage', async () => {
      mockSupabase._mockResponses['constituency_groups'] = {
        data: [
          {
            id: 'cg1',
            name: { en: 'Group' },
            short_name: null,
            info: null,
            sort_order: 1,
            color: null,
            image: { path: 'proj/group/cg1/img.png' },
            custom_data: null,
            subtype: null,
            constituency_group_constituencies: []
          }
        ],
        error: null
      };
      mockSupabase._mockResponses['constituencies'] = {
        data: [
          {
            id: 'c1',
            name: { en: 'Const' },
            short_name: null,
            info: null,
            sort_order: 1,
            color: null,
            image: { path: 'proj/const/c1/img.png' },
            custom_data: null,
            subtype: null,
            keywords: null,
            parent_id: null
          }
        ],
        error: null
      };

      const result = await provider.getConstituencyData();

      expect(result.groups[0].image?.url).toBe(
        'http://localhost:54321/storage/v1/object/public/public-assets/proj/group/cg1/img.png'
      );
      expect(result.constituencies[0].image?.url).toBe(
        'http://localhost:54321/storage/v1/object/public/public-assets/proj/const/c1/img.png'
      );
    });
  });
});
