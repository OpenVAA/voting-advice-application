/**
 * The writer validates every `app_settings` row it writes with the shared `StoredSettingsSchema`.
 *
 * A settings value the schema refuses is a defect of the template that wrote it: the frontend parses the stored column with the same schema and drops the top-level member a failed parse lies under, so a mistyped seed setting would silently fall back to the shipped default. The writer therefore throws before its first write of any kind, naming the template and the path of each refused value: no entity row, answer, link, portrait or settings row is written, so a refused template leaves the project as it was. Every built-in template must pass.
 *
 * Pattern: the admin client is mocked, as in `writer.test.ts`; no Supabase contact.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fanOutLocales } from '../src/locales';
import { runPipeline } from '../src/pipeline';
import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES } from '../src/templates';
import { Writer } from '../src/writer';

/** The admin-client methods the writer calls, as mocks. */
interface MockedAdminClient {
  bulkImport: ReturnType<typeof vi.fn>;
  importAnswers: ReturnType<typeof vi.fn>;
  linkQuestionScopes: ReturnType<typeof vi.fn>;
  updateAppSettings: ReturnType<typeof vi.fn>;
  selectQuestionExternalIds: ReturnType<typeof vi.fn>;
  selectCandidatesForPortraitUpload: ReturnType<typeof vi.fn>;
  uploadPortrait: ReturnType<typeof vi.fn>;
  updateCandidateImage: ReturnType<typeof vi.fn>;
  setProjectOpenForVoters: ReturnType<typeof vi.fn>;
}

const mockState = vi.hoisted(() => {
  const state: { instance: unknown; questionIds: Map<string, string> } = {
    instance: undefined,
    questionIds: new Map()
  };
  return state;
});

vi.mock('../src/supabaseAdminClient', () => ({
  TEST_PROJECT_ID: '00000000-0000-0000-0000-000000000001',
  // A `function` implementation, not an arrow: Writer calls this with `new`, and an arrow function cannot be constructed.
  SupabaseAdminClient: vi.fn().mockImplementation(function () {
    const instance = {
      bulkImport: vi.fn(async () => ({})),
      importAnswers: vi.fn(async () => undefined),
      linkQuestionScopes: vi.fn(async () => undefined),
      updateAppSettings: vi.fn(async () => undefined),
      selectQuestionExternalIds: vi.fn(async () => mockState.questionIds),
      selectCandidatesForPortraitUpload: vi.fn(async () => []),
      uploadPortrait: vi.fn(async () => 'mock-path'),
      updateCandidateImage: vi.fn(async () => undefined),
      setProjectOpenForVoters: vi.fn(async () => undefined)
    };
    mockState.instance = instance;
    return instance;
  })
}));

/** The admin client the last constructed Writer holds. */
function adminClient(): MockedAdminClient {
  return mockState.instance as MockedAdminClient;
}

/** Asserts that the writer called no method of the admin client that writes. */
function expectNothingWritten(): void {
  const client = adminClient();
  for (const method of [
    'bulkImport',
    'importAnswers',
    'linkQuestionScopes',
    'uploadPortrait',
    'updateCandidateImage',
    'updateAppSettings',
    'setProjectOpenForVoters'
  ] as const) {
    expect(client[method], `${method} was not called`).not.toHaveBeenCalled();
  }
}

/** A dataset with a row in every collection the writer writes before the settings: an election, a question and a candidate. */
const ENTITY_ROWS = {
  elections: [{ external_id: 'seed_el-1', name: { en: 'Election' } }],
  questions: [{ external_id: 'seed_qu-1', name: { en: 'Question' } }],
  candidates: [{ external_id: 'seed_ca-1', first_name: 'First', last_name: 'Last' }]
};

describe('Writer validates app_settings with StoredSettingsSchema before it writes them', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    mockState.questionIds = new Map();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('refuses a mistyped registration mode, naming the template and the path, and writes nothing at all', async () => {
    const writer = new Writer();
    const write = writer.write(
      {
        ...ENTITY_ROWS,
        app_settings: [
          {
            external_id: 'settings-1',
            settings: { contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['emial'] } } } }
          }
        ]
      },
      'seed_',
      { templateName: 'typo-template' }
    );

    await expect(write).rejects.toThrow('typo-template');
    await expect(write).rejects.toThrow('contestantApp.servedEntityTypes.candidate.registrationModes.0');
    await expect(write).rejects.toThrow('nothing was written');
    expectNothingWritten();
  });

  it('refuses a key the schema does not know, naming the template and the key, and writes nothing at all', async () => {
    const writer = new Writer();
    const write = writer.write(
      {
        ...ENTITY_ROWS,
        app_settings: [
          { external_id: 'settings-1', settings: { matching: { minimumAnswers: 1 } } },
          { external_id: 'settings-2', settings: { matchnig: { minimumAnswers: 1 } } }
        ]
      },
      'seed_',
      { templateName: 'unknown-key-template' }
    );

    await expect(write).rejects.toThrow('unknown-key-template');
    await expect(write).rejects.toThrow('matchnig');
    expectNothingWritten();
  });

  it('refuses a row whose question references are well-formed and whose other setting is not, before the questions exist, and writes nothing at all', async () => {
    const writer = new Writer();
    const write = writer.write(
      {
        ...ENTITY_ROWS,
        app_settings: [
          {
            external_id: 'settings-1',
            settings: {
              results: { cardContents: { candidate: [{ question: { externalId: 'seed_qu-1' } }] } },
              matching: { minimumAnswers: 'one' }
            }
          }
        ]
      },
      'seed_',
      { templateName: 'reference-template' }
    );

    await expect(write).rejects.toThrow('matching.minimumAnswers');
    expect(adminClient().selectQuestionExternalIds).not.toHaveBeenCalled();
    expectNothingWritten();
  });

  it('writes a row whose question reference the schema accepts, with the reference resolved to the question written before it', async () => {
    mockState.questionIds = new Map([['seed_qu-1', 'question-uuid-1']]);
    const writer = new Writer();

    await writer.write(
      {
        ...ENTITY_ROWS,
        app_settings: [
          {
            external_id: 'settings-1',
            settings: { results: { cardContents: { candidate: [{ question: { externalId: 'seed_qu-1' } }] } } }
          }
        ]
      },
      'seed_',
      { templateName: 'reference-template' }
    );

    expect(adminClient().bulkImport).toHaveBeenCalledTimes(1);
    expect(adminClient().updateAppSettings).toHaveBeenCalledWith({
      results: { cardContents: { candidate: [{ question: 'question-uuid-1' }] } }
    });
  });

  it.each(Object.keys(BUILT_IN_TEMPLATES))('writes the settings of the built-in template %s', async (name) => {
    const template = BUILT_IN_TEMPLATES[name];
    const rows = runPipeline(template, BUILT_IN_OVERRIDES[name] ?? {});
    fanOutLocales(rows, template, template.seed ?? 42);
    mockState.questionIds = new Map(
      (rows.questions ?? []).map((row, index) => [String(row.external_id), `question-uuid-${index}`])
    );
    const writer = new Writer();

    await writer.write(rows, template.externalIdPrefix ?? 'seed_', { templateName: name });

    expect(adminClient().updateAppSettings).toHaveBeenCalledTimes((rows.app_settings ?? []).length);
  });

  it('covers a non-empty registry', () => {
    expect(Object.keys(BUILT_IN_TEMPLATES).length).toBeGreaterThan(10);
  });
});
