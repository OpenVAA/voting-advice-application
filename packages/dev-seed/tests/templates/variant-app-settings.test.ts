/**
 * Variant template `app_settings.fixed[]` contract tests (Phase 63 E2E-02,
 * Plan 63-02 Task 2).
 *
 * Covers D-02 (deep merge) + D-03 (each variant owns its overlay) + RESOLVED
 * Q1 (variant-scoped external_ids):
 *
 *   - variant-constituency: empty overlay; settings === E2E_BASE_APP_SETTINGS.
 *   - variant-multi-election: overlay adds `results.showFeedbackPopup: 0` +
 *     `results.showSurveyPopup: 0` and deep-merge preserves base
 *     `results.cardContents` + `results.sections` (proves deep merge).
 *   - variant-startfromcg: empty overlay (startFromConstituencyGroup stays
 *     spec-owned because it requires a DB UUID only known at spec-time).
 *
 * All three variants use `test-app-settings-<variant>` as external_id
 * (RESOLVED Q1).
 *
 * Import strategy: variant templates live at
 * `tests/tests/setup/templates/variant-*.ts` — outside the dev-seed `src/`
 * tree and not a yarn workspace. They import `@openvaa/dev-seed` +
 * `@openvaa/app-shared` which ARE resolvable from the repo root. Vitest runs
 * from the dev-seed workspace but resolves relative imports via ESM paths.
 */

import { describe, expect, test } from 'vitest';
import { E2E_BASE_APP_SETTINGS } from '../../src';
import { mergeSettings } from '@openvaa/app-shared';
import variantConstituencyTemplate from '../../../../tests/tests/setup/templates/variant-constituency';
import variantMultiElectionTemplate from '../../../../tests/tests/setup/templates/variant-multi-election';
import variantStartFromCgTemplate from '../../../../tests/tests/setup/templates/variant-startfromcg';

type FragmentView = { fixed?: Array<Record<string, unknown>>; count?: number };

function appSettingsFragment(tpl: unknown): FragmentView | undefined {
  const val = (tpl as Record<string, unknown>).app_settings;
  if (val && typeof val === 'object' && !Array.isArray(val) && 'fixed' in (val as object)) {
    return val as FragmentView;
  }
  return undefined;
}

describe('variant-constituency — app_settings overlay (empty; inherits base)', () => {
  test('declares app_settings.fixed[] with one row', () => {
    const frag = appSettingsFragment(variantConstituencyTemplate);
    expect(frag).toBeDefined();
    expect(frag?.fixed).toHaveLength(1);
  });

  test('external_id is variant-scoped: test-app-settings-constituency (RESOLVED Q1)', () => {
    const row = appSettingsFragment(variantConstituencyTemplate)?.fixed?.[0];
    expect(row?.external_id).toBe('test-app-settings-constituency');
  });

  test('external_id starts with test- so runTeardown matches (Pitfall 6)', () => {
    const row = appSettingsFragment(variantConstituencyTemplate)?.fixed?.[0];
    expect((row?.external_id as string).startsWith('test-')).toBe(true);
  });

  // The variant-constituency template overrides `questions.questionsIntro`
  // (allowCategorySelection + show → false) so its specs walk straight to a
  // question page without intercepting the intro. Other keys must still
  // deep-equal the base.
  const CONSTITUENCY_OVERLAY = {
    questions: {
      questionsIntro: { allowCategorySelection: false, show: false }
    }
  };

  test('settings deep-equals mergeSettings(base, CONSTITUENCY_OVERLAY)', () => {
    const row = appSettingsFragment(variantConstituencyTemplate)?.fixed?.[0];
    expect(row?.settings).toEqual(mergeSettings(E2E_BASE_APP_SETTINGS, CONSTITUENCY_OVERLAY));
  });

  test('non-questions keys preserved from base (proves deep merge, not shallow)', () => {
    const row = appSettingsFragment(variantConstituencyTemplate)?.fixed?.[0];
    const s = row?.settings as Record<string, unknown>;
    expect(s.results).toEqual(E2E_BASE_APP_SETTINGS.results);
    expect(s.entities).toEqual(E2E_BASE_APP_SETTINGS.entities);
    expect(s.notifications).toEqual(E2E_BASE_APP_SETTINGS.notifications);
    expect(s.analytics).toEqual(E2E_BASE_APP_SETTINGS.analytics);
  });

  test('uses `settings` field (NOT `value`) — Pitfall 2', () => {
    const row = appSettingsFragment(variantConstituencyTemplate)?.fixed?.[0];
    expect(row).toHaveProperty('settings');
    expect(row).not.toHaveProperty('value');
  });
});

describe('variant-multi-election — app_settings overlay (adds popup suppression)', () => {
  test('declares app_settings.fixed[] with one row', () => {
    const frag = appSettingsFragment(variantMultiElectionTemplate);
    expect(frag).toBeDefined();
    expect(frag?.fixed).toHaveLength(1);
  });

  test('external_id is test-app-settings-multi-election (RESOLVED Q1)', () => {
    const row = appSettingsFragment(variantMultiElectionTemplate)?.fixed?.[0];
    expect(row?.external_id).toBe('test-app-settings-multi-election');
  });

  test('results.showFeedbackPopup === 0 (overlay)', () => {
    const row = appSettingsFragment(variantMultiElectionTemplate)?.fixed?.[0];
    const results = (row?.settings as { results?: { showFeedbackPopup?: number } })?.results;
    expect(results?.showFeedbackPopup).toBe(0);
  });

  test('results.showSurveyPopup === 0 (overlay)', () => {
    const row = appSettingsFragment(variantMultiElectionTemplate)?.fixed?.[0];
    const results = (row?.settings as { results?: { showSurveyPopup?: number } })?.results;
    expect(results?.showSurveyPopup).toBe(0);
  });

  test('results.cardContents preserved from base (proves deep merge, not shallow)', () => {
    const row = appSettingsFragment(variantMultiElectionTemplate)?.fixed?.[0];
    const results = (row?.settings as { results?: { cardContents?: Record<string, Array<string>> } })?.results;
    expect(results?.cardContents).toEqual({
      candidate: ['submatches'],
      organization: ['candidates']
    });
  });

  test('results.sections preserved from base (proves deep merge)', () => {
    const row = appSettingsFragment(variantMultiElectionTemplate)?.fixed?.[0];
    const results = (row?.settings as { results?: { sections?: Array<string> } })?.results;
    expect(results?.sections).toEqual(['candidate', 'organization']);
  });

  // The variant-multi-election overlay also overrides
  // `questions.questionsIntro` to skip the intro (same rationale as
  // variant-constituency). All other keys are preserved from base.
  test('entities / notifications / analytics preserved from base; questions overlay skips the intro', () => {
    const row = appSettingsFragment(variantMultiElectionTemplate)?.fixed?.[0];
    const s = row?.settings as Record<string, unknown>;
    expect(s.entities).toEqual(E2E_BASE_APP_SETTINGS.entities);
    expect(s.notifications).toEqual(E2E_BASE_APP_SETTINGS.notifications);
    expect(s.analytics).toEqual(E2E_BASE_APP_SETTINGS.analytics);
    const q = s.questions as { questionsIntro?: { show?: boolean } };
    expect(q.questionsIntro?.show).toBe(false);
  });
});

describe('variant-startfromcg — app_settings overlay (empty; sfcg stays spec-owned)', () => {
  test('declares app_settings.fixed[] with one row', () => {
    const frag = appSettingsFragment(variantStartFromCgTemplate);
    expect(frag).toBeDefined();
    expect(frag?.fixed).toHaveLength(1);
  });

  test('external_id is test-app-settings-startfromcg (RESOLVED Q1)', () => {
    const row = appSettingsFragment(variantStartFromCgTemplate)?.fixed?.[0];
    expect(row?.external_id).toBe('test-app-settings-startfromcg');
  });

  // The variant-startfromcg overlay also overrides `questions.questionsIntro`
  // (the spec walks the journey directly to a question page).
  test('non-questions keys preserved from base; questions overlay skips the intro', () => {
    const row = appSettingsFragment(variantStartFromCgTemplate)?.fixed?.[0];
    const s = row?.settings as Record<string, unknown>;
    expect(s.results).toEqual(E2E_BASE_APP_SETTINGS.results);
    expect(s.entities).toEqual(E2E_BASE_APP_SETTINGS.entities);
    expect(s.notifications).toEqual(E2E_BASE_APP_SETTINGS.notifications);
    expect(s.analytics).toEqual(E2E_BASE_APP_SETTINGS.analytics);
    const q = s.questions as { questionsIntro?: { show?: boolean } };
    expect(q.questionsIntro?.show).toBe(false);
  });

  test('startFromConstituencyGroup NOT set in template (spec owns it — requires DB UUID)', () => {
    const row = appSettingsFragment(variantStartFromCgTemplate)?.fixed?.[0];
    const elections = (row?.settings as { elections?: Record<string, unknown> })?.elections;
    // Either undefined (no elections block in base) or without the sfcg key
    expect(elections?.startFromConstituencyGroup).toBeUndefined();
  });
});
