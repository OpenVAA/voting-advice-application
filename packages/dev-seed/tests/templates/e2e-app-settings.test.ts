/**
 * e2eTemplate.app_settings.fixed[] contract tests (Phase 63 E2E-02).
 *
 * Covers D-01 + Pitfall 2 (writer reads `row.settings`, not `row.value`) +
 * Pitfall 6 (teardown matches by `test-` prefix).
 *
 * Companion to `tests/templates/e2e.test.ts` — that file audits the template
 * against 58-E2E-AUDIT.md; this file locks the Phase 63 addition:
 *
 *   - `app_settings.fixed[0].external_id === 'test-app-settings'`
 *   - `app_settings.fixed[0].settings` uses the DB column name (`settings`,
 *     NOT `value`) so the writer's Pass-5 merge_jsonb_column actually fires.
 *   - `E2E_BASE_APP_SETTINGS` is re-exported from `@openvaa/dev-seed` with
 *     the 5 top-level keys matching the legacy `data.setup.ts:53-72` payload.
 *
 * Downstream dependency: Plan 63-02 variant templates compose against
 * `E2E_BASE_APP_SETTINGS` via `mergeSettings`; Plan 63-02 setup files assert
 * the persisted row matches `template.app_settings.fixed[0].settings`.
 *
 * D-22 contract: pure shape assertions. No Supabase imports.
 */

import { describe, expect, it } from 'vitest';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '../../src';
import { e2eTemplate } from '../../src/templates/e2e';

type FragmentView = { fixed?: Array<Record<string, unknown>>; count?: number };

function fragmentOf(table: string): FragmentView | undefined {
  const val = (e2eTemplate as unknown as Record<string, unknown>)[table];
  if (val && typeof val === 'object' && !Array.isArray(val) && 'fixed' in (val as object)) {
    return val as FragmentView;
  }
  return undefined;
}

describe('e2eTemplate.app_settings — Phase 63 E2E-02 shape contract', () => {
  it('declares an app_settings fragment with one fixed row', () => {
    const frag = fragmentOf('app_settings');
    expect(frag, 'e2eTemplate missing app_settings fragment').toBeDefined();
    expect(frag?.fixed, 'app_settings.fixed missing').toBeDefined();
    expect(frag?.fixed).toHaveLength(1);
  });

  it('fixed[0].external_id === "test-app-settings" (Pitfall 6: teardown prefix)', () => {
    const frag = fragmentOf('app_settings');
    const row = frag?.fixed?.[0];
    expect(row?.external_id).toBe('test-app-settings');
  });

  it('fixed[0].external_id starts with "test-" so runTeardown("test-", ...) matches', () => {
    // Pitfall 6: runTeardown deletes rows whose external_id begins with the
    // passed prefix; the 4 setup files call runTeardown('test-', client).
    const frag = fragmentOf('app_settings');
    const row = frag?.fixed?.[0];
    expect(typeof row?.external_id).toBe('string');
    expect((row?.external_id as string).startsWith('test-')).toBe(true);
  });

  it('fixed[0] uses `settings` field (NOT `value`) so writer Pass-5 fires (Pitfall 2)', () => {
    // writer.ts:176 reads `row.settings`. Pitfall 2: if the template authored
    // `value: {...}` instead, the writer silently leaves the bootstrap row
    // unchanged and tests regress.
    const frag = fragmentOf('app_settings');
    const row = frag?.fixed?.[0];
    expect(row).toHaveProperty('settings');
    expect(row).not.toHaveProperty('value');
  });

  it('fixed[0].settings deep-equals E2E_BASE_APP_SETTINGS', () => {
    const frag = fragmentOf('app_settings');
    const row = frag?.fixed?.[0];
    expect(row?.settings).toEqual(E2E_BASE_APP_SETTINGS);
  });
});

describe('E2E_BASE_APP_SETTINGS — legacy data.setup.ts:53-72 byte-for-byte contract', () => {
  it('is exported from @openvaa/dev-seed package barrel', () => {
    expect(E2E_BASE_APP_SETTINGS).toBeDefined();
    expect(typeof E2E_BASE_APP_SETTINGS).toBe('object');
  });

  it('has the 5 top-level keys from legacy updateAppSettings(...) payload', () => {
    expect(Object.keys(E2E_BASE_APP_SETTINGS).sort()).toEqual(
      ['analytics', 'entities', 'notifications', 'questions', 'results'].sort()
    );
  });

  it('questions block: questionsIntro defaults match dynamicSettings (intro page shown by default)', () => {
    // The legacy data.setup.ts payload had questionsIntro.show=false +
    // allowCategorySelection=false to bypass the intro page in the e2e
    // journey. Reverted to the dynamicSettings defaults (true/true) so
    // voter-questions.spec.ts (QUESTION-03 regression gate) sees the start
    // button + category checkboxes it expects. Variants that need to bypass
    // the intro override these per-variant.
    expect(E2E_BASE_APP_SETTINGS.questions).toEqual({
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: true, show: true },
      showResultsLink: true
    });
  });

  it('results block matches legacy payload (cardContents + sections)', () => {
    expect(E2E_BASE_APP_SETTINGS.results).toEqual({
      cardContents: {
        candidate: ['submatches'],
        organization: ['candidates']
      },
      sections: ['candidate', 'organization']
    });
  });

  it('entities block matches legacy payload', () => {
    expect(E2E_BASE_APP_SETTINGS.entities).toEqual({
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    });
  });

  it('notifications block matches legacy payload', () => {
    expect(E2E_BASE_APP_SETTINGS.notifications).toEqual({ voterApp: { show: false } });
  });

  it('analytics block matches legacy payload', () => {
    expect(E2E_BASE_APP_SETTINGS.analytics).toEqual({ trackEvents: false });
  });
});

describe('BUILT_IN_TEMPLATES.e2e.app_settings — registry visibility', () => {
  it('registry e2e template exposes the same app_settings block as the direct export', () => {
    const registryFrag = (BUILT_IN_TEMPLATES.e2e as unknown as Record<string, unknown>).app_settings as
      | FragmentView
      | undefined;
    expect(registryFrag?.fixed?.[0]?.external_id).toBe('test-app-settings');
    expect(registryFrag?.fixed?.[0]?.settings).toEqual(E2E_BASE_APP_SETTINGS);
  });
});
