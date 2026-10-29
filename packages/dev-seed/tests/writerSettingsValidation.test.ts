/**
 * The writer validates every `app_settings` row it writes with the shared `StoredSettingsSchema`.
 *
 * A settings value the schema refuses is a defect of the template that wrote it: the frontend parses the stored column with the same schema and drops the top-level member a failed parse lies under, so a mistyped seed setting would silently fall back to the shipped default. The writer therefore throws before its first settings write, naming the template and the path of each refused value, and writes no settings row. Every built-in template must pass.
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
  linkJoinTables: ReturnType<typeof vi.fn>;
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
      linkJoinTables: vi.fn(async () => undefined),
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

  it('refuses a mistyped registration mode, naming the template and the path, and writes no settings row', async () => {
    const writer = new Writer();
    const write = writer.write(
      {
        app_settings: [
          { external_id: 'settings-1', settings: { contestantApp: { registrationModes: { candidate: ['emial'] } } } }
        ]
      },
      'seed_',
      { templateName: 'typo-template' }
    );

    await expect(write).rejects.toThrow('typo-template');
    await expect(write).rejects.toThrow('contestantApp.registrationModes.candidate.0');
    expect(adminClient().updateAppSettings).not.toHaveBeenCalled();
  });

  it('refuses a key the schema does not know, naming the template and the key, and writes no settings row', async () => {
    const writer = new Writer();
    const write = writer.write(
      {
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
    expect(adminClient().updateAppSettings).not.toHaveBeenCalled();
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
