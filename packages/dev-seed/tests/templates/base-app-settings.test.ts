/**
 * `e2e/base` template app_settings contract tests (Phase 93 Plan 02 / D-03).
 *
 * Retargeted from the retired `e2e` app-settings suite to the canonical base
 * dataset (formerly `baseV1`). Locks:
 *
 *   - `app_settings.fixed[0]` exists with a single fixed row whose
 *     external_id starts with `test-e2e-base-` (so `runTeardown('test-e2e-base-', ...)` matches).
 *   - `app_settings.fixed[0].settings` deep-equals `BASE_APP_SETTINGS`
 *     (formerly `BASE_V1_APP_SETTINGS` / `E2E_BASE_APP_SETTINGS`).
 *   - the writer reads `row.settings` (NOT `row.value`) so Pass-5
 *     merge_jsonb_column fires (Pitfall 2).
 *   - `BASE_APP_SETTINGS` is re-exported from the `@openvaa/dev-seed` barrel
 *     and carries the base dataset's top-level settings blocks.
 *
 * Every asserted value is derived from `e2e/base.ts` (the surviving dataset),
 * not carried over from the old e2e single-election app-settings.
 *
 * D-22 contract: pure shape assertions. No Supabase imports.
 */

import { describe, expect, it } from 'vitest';
import { BASE_APP_SETTINGS, BUILT_IN_TEMPLATES } from '../../src';
import { baseTemplate } from '../../src/templates/e2e/base';

type FragmentView = { fixed?: Array<Record<string, unknown>>; count?: number };

function fragmentOf(table: string): FragmentView | undefined {
  const val = (baseTemplate as unknown as Record<string, unknown>)[table];
  if (val && typeof val === 'object' && !Array.isArray(val) && 'fixed' in (val as object)) {
    return val as FragmentView;
  }
  return undefined;
}

describe('baseTemplate.app_settings — fixed-row shape contract', () => {
  it('declares an app_settings fragment with one fixed row', () => {
    const frag = fragmentOf('app_settings');
    expect(frag, 'baseTemplate missing app_settings fragment').toBeDefined();
    expect(frag?.fixed, 'app_settings.fixed missing').toBeDefined();
    expect(frag?.fixed).toHaveLength(1);
  });

  it('fixed[0].external_id starts with "test-e2e-base-" so runTeardown("test-e2e-base-", ...) matches (Pitfall 6)', () => {
    const row = fragmentOf('app_settings')?.fixed?.[0];
    expect(typeof row?.external_id).toBe('string');
    expect((row?.external_id as string).startsWith('test-e2e-base-')).toBe(true);
  });

  it('fixed[0] uses `settings` field (NOT `value`) so writer Pass-5 fires (Pitfall 2)', () => {
    const row = fragmentOf('app_settings')?.fixed?.[0];
    expect(row).toHaveProperty('settings');
    expect(row).not.toHaveProperty('value');
  });

  it('fixed[0].settings deep-equals BASE_APP_SETTINGS', () => {
    const row = fragmentOf('app_settings')?.fixed?.[0];
    expect(row?.settings).toEqual(BASE_APP_SETTINGS);
  });
});

describe('BASE_APP_SETTINGS — base dataset settings contract', () => {
  it('is exported from @openvaa/dev-seed package barrel', () => {
    expect(BASE_APP_SETTINGS).toBeDefined();
    expect(typeof BASE_APP_SETTINGS).toBe('object');
  });

  it('declares the base dataset top-level settings blocks', () => {
    expect(Object.keys(BASE_APP_SETTINGS).sort()).toEqual(
      [
        'access',
        'candidateApp',
        'elections',
        'entities',
        'entityDetails',
        'header',
        'headerStyle',
        'matching',
        'notifications',
        'questions',
        'results'
      ].sort()
    );
  });

  it('header block enables feedback + help', () => {
    expect(BASE_APP_SETTINGS.header).toEqual({ showFeedback: true, showHelp: true });
  });

  it('entities block matches base dataset (hideIfMissingAnswers.candidate=false, showAllNominations=true)', () => {
    expect(BASE_APP_SETTINGS.entities).toEqual({
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    });
  });

  it('matching block uses minimumAnswers=5 + impute organization matching', () => {
    expect(BASE_APP_SETTINGS.matching).toEqual({
      minimumAnswers: 5,
      organizationMatching: 'impute'
    });
  });

  it('access block enables candidate/voter/admin apps, not under maintenance, answers unlocked', () => {
    expect(BASE_APP_SETTINGS.access).toEqual({
      candidateApp: true,
      voterApp: true,
      adminApp: true,
      underMaintenance: false,
      answersLocked: false
    });
  });

  it('questions block shows the intro + category tags + results link', () => {
    expect(BASE_APP_SETTINGS.questions).toEqual({
      categoryIntros: { allowSkip: true, show: true },
      interactiveInfo: { enabled: false },
      questionsIntro: { allowCategorySelection: true, show: true },
      showCategoryTags: true,
      showResultsLink: true
    });
  });

  it('results block carries candidate cardContents with the info-text submatch question ref', () => {
    // 'alliance' LAST — Phase 129 UNBLK-06 (Org-first cascade invariant).
    expect(BASE_APP_SETTINGS.results.sections).toEqual(['candidate', 'organization', 'alliance']);
    expect(BASE_APP_SETTINGS.results.cardContents.candidate).toEqual([
      'submatches',
      { question: { externalId: 'test-e2e-base-qu-info-text' } }
    ]);
  });
});

describe("BUILT_IN_TEMPLATES['e2e/base'].app_settings — registry visibility", () => {
  it('registry base template exposes the same app_settings block as the direct export', () => {
    const registryFrag = (
      BUILT_IN_TEMPLATES['e2e/base'] as unknown as Record<string, unknown>
    ).app_settings as FragmentView | undefined;
    const row = registryFrag?.fixed?.[0];
    expect((row?.external_id as string).startsWith('test-e2e-base-')).toBe(true);
    expect(row?.settings).toEqual(BASE_APP_SETTINGS);
  });
});
