/**
 * `StoredSettingsSchema` — the stored shape of the `app_settings.settings` JSONB column.
 *
 * Covers the `{}` case the column's `'{}'::jsonb` default and the provider's `PGRST116` branch both produce, a representative real payload (the package's own shipped `dynamicSettings`), the locale-object notification fields, one unknown-key rejection per nesting level (top level, `notifications`, `notifications.contestantApp`, `analytics`, `contestantApp`, `contestantApp.servedEntityTypes` and `contestantApp.servedEntityTypes.candidate`), the one member of `analytics` and the stored provider member it rejects, `contestantApp.servedEntityTypes` — what parses, what it parses to, and the path each rejection names — and the two keys `access.nominationsLocked` and `entities.hideIfMissingAnswers.organization`.
 */

import { describe, expect, it } from 'vitest';
import { StoredSettingsSchema } from './storedSettings.schema';
import { dynamicSettings } from '../../settings/dynamicSettings';

describe('StoredSettingsSchema', () => {
  it("accepts `{}` — the column defaults to `'{}'::jsonb` and the provider returns `{}` on PGRST116", () => {
    const result = StoredSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts the package's own shipped `dynamicSettings` as a representative full payload", () => {
    const result = StoredSettingsSchema.safeParse(dynamicSettings);
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  it('accepts `notifications.contestantApp.title` as a LOCALE OBJECT, which is the stored form', () => {
    const result = StoredSettingsSchema.safeParse({
      notifications: {
        contestantApp: {
          show: true,
          title: { en: 'Heads up', fi: 'Huomio' },
          content: { en: 'Something happened.', fi: 'Jotain tapahtui.' },
          icon: 'important'
        }
      }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  it('accepts a `null` notification, which is what the shipped defaults carry', () => {
    expect(StoredSettingsSchema.safeParse({ notifications: { contestantApp: null, voterApp: null } }).success).toBe(
      true
    );
  });

  // REGRESSION (157-18). A switched-off notification is stored as `{ show: false }` and carries NO copy — the shape `MINIMAL_BASE_APP_SETTINGS` writes for 23 dev-seed perm templates, and the shape an operator produces by disabling a notification without authoring text. While `title`/`content` were REQUIRED here, this ordinary value failed the parse; and because `SupabaseDataProvider._getAppSettings` degrades a failed parse to `{}` rather than throwing, those two absent fields silently discarded EVERY OTHER SETTING in the column. Asserted on the WHOLE-OBJECT outcome, not on `notifications` alone, because the damage was never local to the notification: the sibling `questions.questionsIntro.show` is what actually changed the app's behaviour, and a test that only parsed a bare notification would pass while the real payload still failed.
  it('accepts a switched-off notification carrying only `show`, and keeps its SIBLING settings', () => {
    const result = StoredSettingsSchema.safeParse({
      questions: { questionsIntro: { show: false, allowCategorySelection: false } },
      matching: { minimumAnswers: 1 },
      notifications: { contestantApp: { show: false }, voterApp: { show: false } }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    // The sibling survives the parse rather than being discarded with it — the actual regression.
    expect(result.success && result.data.questions?.questionsIntro?.show).toBe(false);
    expect(result.success && result.data.matching?.minimumAnswers).toBe(1);
  });

  // `analytics` must be part of this strict schema: without it every stored blob carrying it is rejected wholesale and, via the provider's degrade-to-`{}`, stripped of every unrelated setting. The stored shape is pinned: the `trackEvents`-only overlay 23 perm templates write through `MINIMAL_BASE_APP_SETTINGS` and `perm-analytics-tracking` writes with `true`.
  it('accepts a `trackEvents`-only `analytics` overlay, and keeps its SIBLING settings', () => {
    const result = StoredSettingsSchema.safeParse({
      questions: { questionsIntro: { show: false, allowCategorySelection: false } },
      analytics: { trackEvents: false }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.questions?.questionsIntro?.show).toBe(false);
  });

  it('accepts `analytics.trackEvents` true, the overlay that turns usage events on', () => {
    const result = StoredSettingsSchema.safeParse({ analytics: { trackEvents: true } });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.analytics).toEqual({ trackEvents: true });
  });

  it('rejects an `analytics.trackEvents` that is not a boolean, at its path', () => {
    const result = StoredSettingsSchema.safeParse({ analytics: { trackEvents: 'yes' } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['analytics', 'trackEvents']);
  });

  // The analytics provider is server configuration, so a row that still stores a provider object under `analytics` fails at `analytics` alone. The provider's partial-preserve parse removes the top-level members the issues name and parses the rest again; this case does the same, so the SIBLING is asserted to survive and `trackEvents` falls to its shipped default.
  it('fails a stored provider object under `analytics` at `analytics` alone, so partial preserve keeps its SIBLING settings', () => {
    const stored: Record<string, unknown> = {
      matching: { minimumAnswers: 1 },
      analytics: { platform: { name: 'x', code: 'y' }, trackEvents: true }
    };
    const result = StoredSettingsSchema.safeParse(stored);
    expect(result.success).toBe(false);
    const flagged = new Set(result.success === false ? result.error.issues.map((issue) => issue.path[0]) : []);
    expect([...flagged]).toEqual(['analytics']);
    expect(result.success === false && result.error.issues[0]).toMatchObject({ keys: ['platform'] });
    const remainder = Object.fromEntries(Object.entries(stored).filter(([key]) => !flagged.has(key)));
    const retry = StoredSettingsSchema.safeParse(remainder);
    expect(retry.success === false ? retry.error.issues : retry.success).toBe(true);
    expect(retry.success && retry.data.matching?.minimumAnswers).toBe(1);
    expect(retry.success && retry.data.analytics).toBeUndefined();
  });

  // REGRESSION (157 review, Lot A CR-02). Same shape as the case above, on the other member the docstring's claim was false for: `survey.linkTemplate` and `survey.showIn` were both required.
  it('accepts a partial `survey` member, and keeps its SIBLING settings', () => {
    const result = StoredSettingsSchema.safeParse({
      matching: { minimumAnswers: 1 },
      survey: { showIn: ['frontpage'] }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.matching?.minimumAnswers).toBe(1);
  });

  it('LEVEL 1: rejects an unknown key at the top level', () => {
    const result = StoredSettingsSchema.safeParse({ bogusTopLevel: 1 });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && JSON.stringify(result.error.issues)).toMatch(/bogusTopLevel/);
  });

  it('rejects a row that carries a top-level `preRegistration` key, naming that key at the root', () => {
    // The issue has an empty path and names the key, which is what lets a reader drop that one key and keep the row's other settings.
    const result = StoredSettingsSchema.safeParse({
      preRegistration: { enabled: true },
      matching: { minimumAnswers: 1 }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues).toHaveLength(1);
    expect(result.success === false && result.error.issues[0]?.code).toBe('unrecognized_keys');
    expect(result.success === false && result.error.issues[0]?.path).toEqual([]);
    expect(result.success === false && result.error.issues[0]).toMatchObject({ keys: ['preRegistration'] });
  });

  it('LEVEL 2: rejects an unknown key inside `notifications`', () => {
    // Top-level strictness alone does NOT reach here: measured at zod 4.3.6, a top-level-only strict schema parses this input with SUCCESS and silently strips `bogusNotifications`.
    const result = StoredSettingsSchema.safeParse({ notifications: { bogusNotifications: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['notifications']);
  });

  it('LEVEL 3: rejects an unknown key inside `notifications.contestantApp`', () => {
    // The third level is the deepest this column reaches, and it is the level a two-level-strict schema would silently strip.
    const result = StoredSettingsSchema.safeParse({
      notifications: { contestantApp: { title: { en: 'T' }, content: { en: 'C' }, bogusNotification: 1 } }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['notifications', 'contestantApp']);
  });

  it('LEVEL 2: rejects an unknown key inside `contestantApp`', () => {
    const result = StoredSettingsSchema.safeParse({ contestantApp: { bogusMember: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['contestantApp']);
  });

  it('LEVEL 3: rejects an unknown key inside `contestantApp.servedEntityTypes`', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: {
        servedEntityTypes: { candidate: { registrationModes: ['email'] }, faction: { registrationModes: [] } }
      }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.code).toBe('unrecognized_keys');
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['contestantApp', 'servedEntityTypes']);
    expect(result.success === false && result.error.issues[0]).toMatchObject({ keys: ['faction'] });
  });

  it('LEVEL 4: rejects an unknown key inside `contestantApp.servedEntityTypes.candidate`', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['email'], bogusMember: 1 } } }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual([
      'contestantApp',
      'servedEntityTypes',
      'candidate'
    ]);
  });

  it('rejects a wrong-typed leaf — `matching.minimumAnswers` as a string', () => {
    const result = StoredSettingsSchema.safeParse({ matching: { minimumAnswers: 'five' } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['matching', 'minimumAnswers']);
  });
});

describe('StoredSettingsSchema — the nominations lock and the organization key of hideIfMissingAnswers', () => {
  it('reads `access.nominationsLocked` and both keys of `entities.hideIfMissingAnswers` back unchanged', () => {
    const stored = {
      access: { nominationsLocked: true },
      entities: { hideIfMissingAnswers: { candidate: false, organization: true } }
    };
    const result = StoredSettingsSchema.safeParse(stored);
    expect(result.success === false ? result.error.issues : result.data).toEqual(stored);
  });

  it('still rejects an unknown key inside `entities.hideIfMissingAnswers`', () => {
    const result = StoredSettingsSchema.safeParse({
      entities: { hideIfMissingAnswers: { organization: true, alliance: true } }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['entities', 'hideIfMissingAnswers']);
    expect(result.success === false && result.error.issues[0]).toMatchObject({ keys: ['alliance'] });
  });
});

describe('StoredSettingsSchema — the served entity types', () => {
  it('puts each registration list in canonical order with no repeats', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: {
        servedEntityTypes: {
          candidate: { registrationModes: ['code', 'identity_provider', 'email', 'code'] },
          organization: { registrationModes: [] }
        }
      }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.contestantApp).toEqual({
      servedEntityTypes: {
        candidate: { registrationModes: ['identity_provider', 'email', 'code'] },
        organization: { registrationModes: [] }
      }
    });
  });

  it('accepts a single served type with no modes and reads it back as declared', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: { servedEntityTypes: { organization: { registrationModes: [] } } }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.contestantApp).toEqual({
      servedEntityTypes: { organization: { registrationModes: [] } }
    });
  });

  it('keeps a stored `questions` member beside the served entity types', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: { questions: { hideHero: true }, servedEntityTypes: { organization: { registrationModes: [] } } }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.contestantApp).toEqual({
      questions: { hideHero: true },
      servedEntityTypes: { organization: { registrationModes: [] } }
    });
  });

  it('reads an invalid `questions` member as absent and keeps the served entity types beside it', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: {
        questions: { hideHero: 'yes' },
        servedEntityTypes: { organization: { registrationModes: ['email'] } }
      }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.contestantApp?.questions).toBeUndefined();
    expect(result.success && result.data.contestantApp?.servedEntityTypes).toEqual({
      organization: { registrationModes: ['email'] }
    });
  });

  it('rejects a member that serves no type, at the member', () => {
    const result = StoredSettingsSchema.safeParse({ contestantApp: { servedEntityTypes: {} } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['contestantApp', 'servedEntityTypes']);
  });

  it('rejects a registration mode outside the vocabulary, at the mode, and never filters it out', () => {
    const result = StoredSettingsSchema.safeParse({
      contestantApp: { servedEntityTypes: { candidate: { registrationModes: ['email', 'sms'] } } }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.code).toBe('invalid_value');
    expect(result.success === false && result.error.issues[0]?.path).toEqual([
      'contestantApp',
      'servedEntityTypes',
      'candidate',
      'registrationModes',
      1
    ]);
  });

  it('rejects an entry without `registrationModes`, at the entry', () => {
    const result = StoredSettingsSchema.safeParse({ contestantApp: { servedEntityTypes: { candidate: {} } } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual([
      'contestantApp',
      'servedEntityTypes',
      'candidate',
      'registrationModes'
    ]);
  });

  it.each([
    ['servedEntityTypes', { servedEntityTypes: null }, ['contestantApp', 'servedEntityTypes']],
    ['an entry', { servedEntityTypes: { candidate: null } }, ['contestantApp', 'servedEntityTypes', 'candidate']],
    [
      'a registration list',
      { servedEntityTypes: { candidate: { registrationModes: null } } },
      ['contestantApp', 'servedEntityTypes', 'candidate', 'registrationModes']
    ]
  ])('rejects `null` for %s as an invalid type, at the member', (_, contestantApp, path) => {
    const result = StoredSettingsSchema.safeParse({ contestantApp });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.code).toBe('invalid_type');
    expect(result.success === false && result.error.issues[0]?.path).toEqual(path);
  });
});
