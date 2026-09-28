/**
 * `StoredSettingsSchema` — the stored shape of the `app_settings.settings` JSONB column.
 *
 * Covers the `{}` case the column's `'{}'::jsonb` default and the provider's `PGRST116` branch both produce, a representative real payload (the package's own shipped `dynamicSettings`), the locale-object notification fields, and one unknown-key rejection per nesting level: top level, `notifications`, and `notifications.candidateApp`.
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

  it('accepts `notifications.candidateApp.title` as a LOCALE OBJECT, which is the stored form', () => {
    const result = StoredSettingsSchema.safeParse({
      notifications: {
        candidateApp: {
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
    expect(StoredSettingsSchema.safeParse({ notifications: { candidateApp: null, voterApp: null } }).success).toBe(
      true
    );
  });

  // REGRESSION (157-18). A switched-off notification is stored as `{ show: false }` and carries NO copy — the shape `MINIMAL_BASE_APP_SETTINGS` writes for 23 dev-seed perm templates, and the shape an operator produces by disabling a notification without authoring text. While `title`/`content` were REQUIRED here, this ordinary value failed the parse; and because `SupabaseDataProvider._getAppSettings` degrades a failed parse to `{}` rather than throwing, those two absent fields silently discarded EVERY OTHER SETTING in the column. Asserted on the WHOLE-OBJECT outcome, not on `notifications` alone, because the damage was never local to the notification: the sibling `questions.questionsIntro.show` is what actually changed the app's behaviour, and a test that only parsed a bare notification would pass while the real payload still failed.
  it('accepts a switched-off notification carrying only `show`, and keeps its SIBLING settings', () => {
    const result = StoredSettingsSchema.safeParse({
      questions: { questionsIntro: { show: false, allowCategorySelection: false } },
      matching: { minimumAnswers: 1 },
      notifications: { candidateApp: { show: false }, voterApp: { show: false } }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    // The sibling survives the parse rather than being discarded with it — the actual regression.
    expect(result.success && result.data.questions?.questionsIntro?.show).toBe(false);
    expect(result.success && result.data.matching?.minimumAnswers).toBe(1);
  });

  // REGRESSION (157-18). `analytics` is declared on `StaticSettings`, not on `DynamicSettings`, and was therefore missing from this strict schema — so every stored blob carrying it was rejected wholesale and, via the provider's degrade-to-`{}`, stripped of every unrelated setting. Both stored shapes are pinned: the `trackEvents`-only overlay 23 perm templates write through `MINIMAL_BASE_APP_SETTINGS`, and the full `platform` object `perm-analytics-tracking` writes to arm the frontend's analytics integration.
  it('accepts a `trackEvents`-only `analytics` overlay, and keeps its SIBLING settings', () => {
    const result = StoredSettingsSchema.safeParse({
      questions: { questionsIntro: { show: false, allowCategorySelection: false } },
      analytics: { trackEvents: false }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.questions?.questionsIntro?.show).toBe(false);
  });

  it('accepts a full `analytics.platform` object, the shape that arms the analytics integration', () => {
    const result = StoredSettingsSchema.safeParse({
      analytics: {
        platform: { name: 'umami', code: 'e2e-dummy-code', infoUrl: 'https://example.test/privacy' },
        trackEvents: true
      }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
  });

  // REGRESSION (157 review, Lot A CR-02). The schema's own docstring states "Every field is optional here", and `analytics.platform`'s three members contradicted it. An operator arming tracking without authoring a privacy-info URL is an ordinary act — `DataConsent.svelte` and `DataConsentInfoButton.svelte` both read `infoUrl` through `?.` guards, so the frontend tolerates its absence while this schema did not — and the cost was not "no analytics": the provider degrades a failed parse to `{}`, so `access`, `matching.minimumAnswers`, `questions.questionsIntro.show` and every other stored setting went with it. Asserted on a SIBLING, because the sibling is the damage.
  it('accepts an `analytics.platform` with no `infoUrl`, and keeps its SIBLING settings', () => {
    const result = StoredSettingsSchema.safeParse({
      matching: { minimumAnswers: 1 },
      analytics: { platform: { name: 'umami', code: 'X' }, trackEvents: true }
    });
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.matching?.minimumAnswers).toBe(1);
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

  it('LEVEL 3: rejects an unknown key inside `analytics.platform`', () => {
    // The added member is strict at every level too, matching the rest of this schema.
    const result = StoredSettingsSchema.safeParse({
      analytics: { platform: { name: 'umami', code: 'c', infoUrl: 'u', bogusPlatform: 1 } }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['analytics', 'platform']);
  });

  it('LEVEL 1: rejects an unknown key at the top level', () => {
    const result = StoredSettingsSchema.safeParse({ bogusTopLevel: 1 });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && JSON.stringify(result.error.issues)).toMatch(/bogusTopLevel/);
  });

  it('LEVEL 2: rejects an unknown key inside `notifications`', () => {
    // Top-level strictness alone does NOT reach here: measured at zod 4.3.6, a top-level-only strict schema parses this input with SUCCESS and silently strips `bogusNotifications`.
    const result = StoredSettingsSchema.safeParse({ notifications: { bogusNotifications: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['notifications']);
  });

  it('LEVEL 3: rejects an unknown key inside `notifications.candidateApp`', () => {
    // The third level is the deepest this column reaches, and it is the level a two-level-strict schema would silently strip.
    const result = StoredSettingsSchema.safeParse({
      notifications: { candidateApp: { title: { en: 'T' }, content: { en: 'C' }, bogusNotification: 1 } }
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['notifications', 'candidateApp']);
  });

  it('rejects a wrong-typed leaf — `matching.minimumAnswers` as a string', () => {
    const result = StoredSettingsSchema.safeParse({ matching: { minimumAnswers: 'five' } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['matching', 'minimumAnswers']);
  });
});
