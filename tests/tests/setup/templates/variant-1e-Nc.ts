/**
 * 1e-Nc variant template — 1 election × 3 constituencies (E2E-04 cell 2).
 *
 * Spec contract:
 *   - tests/tests/specs/variants/1e-Nc.spec.ts (E2E-04 cell 2).
 *
 * Base: BUILT_IN_TEMPLATES.e2e (single-election baseline). This variant keeps
 * the base's single election (test-election-1) and replaces its constituency
 * group with a NEW 3-constituency CG (test-cg-1e-Nc). Base candidates
 * alpha/beta/gamma are re-nominated onto the 3 new constituencies on
 * test-election-1 (alpha → -a, beta → -b, gamma → -c).
 *
 * E2E-04 cell 2 contract: with 1 election (auto-implied) and N=3
 * constituencies, the voter app must
 *   (a) BYPASS the election selection page (auto-imply, single election), AND
 *   (b) SHOW the constituency selection page (N>1 — must pick one), AND
 *   (c) populate the dropdown with exactly N=3 options.
 *
 * Per-row `constituency_groups` declarations on the base election overlay
 * override the pipeline's full-fanout default — without them the election
 * would wire to ALL constituency groups (including the legacy `test-cg-1`
 * from base).
 *
 * Overlay-row inventory:
 *   - elections: 0 NEW (test-election-1 from base, re-scoped to test-cg-1e-Nc)
 *   - constituency_groups: 1 NEW (test-cg-1e-Nc), with 3 constituencies
 *   - constituencies: 3 NEW (test-const-1e-Nc-a/b/c — flat siblings, no hierarchy)
 *   - nominations: 3 NEW (re-nominate base candidates alpha/beta/gamma onto the
 *     3 new constituencies)
 *   - everything else: pass-through (count: 0, fixed: baseFixed(table))
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-1e-Nc: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 74 E2E-04 cell 2 (1e × Nc): settings-only overlay (questions intro
 * suppression so the voter lands on /constituencies, picks one, and proceeds
 * to /questions without an intro page). Deep merge via `mergeSettings`
 * preserves the base `results.*` + `header.*` + every other base key — a
 * shallow merge would clobber them (PATTERNS Pitfall 4).
 */
const ONE_E_NC_APP_SETTINGS_OVERLAY = {
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  }
} as const;

type FixedRow = Record<string, unknown>;

function baseFixed(
  table:
    | 'elections'
    | 'constituency_groups'
    | 'constituencies'
    | 'organizations'
    | 'question_categories'
    | 'questions'
    | 'candidates'
    | 'nominations'
): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}

export const variantOneENcTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: overlay doesn't touch organizations.
  organizations: { count: 0, fixed: baseFixed('organizations') },

  // Extended: 1 election (test-election-1 from base) — explicitly scoped to
  // the NEW test-cg-1e-Nc constituency group. Without per-row scoping, the
  // pipeline's full-fanout sentinel would wire test-election-1 to ALL CGs
  // (including the base test-cg-1), and the constituency selector would
  // surface mixed options.
  elections: {
    count: 0,
    fixed: [
      ...baseFixed('elections').map((row) => ({
        ...row,
        constituency_groups: [{ external_id: 'test-cg-1e-Nc' }]
      }))
      // NO test-election-2 — 1e-Nc is single-election.
    ]
  },

  // Extended: 1 NEW constituency group containing 3 constituencies. The base
  // test-cg-1 is dropped — the variant uses test-cg-1e-Nc instead. The
  // explicit `constituencies` ref overrides the pipeline's full-fanout
  // default; without it the CG would also wire to test-constituency-alpha
  // (from base) and the dropdown would show 4 options instead of 3.
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-1e-Nc',
        name: { en: '1e-Nc Constituencies' },
        sort_order: 10,
        is_generated: false,
        constituencies: [
          { external_id: 'test-const-1e-Nc-a' },
          { external_id: 'test-const-1e-Nc-b' },
          { external_id: 'test-const-1e-Nc-c' }
        ]
      }
    ]
  },

  // Extended: 3 NEW constituencies (flat siblings, no parent-tree hierarchy).
  // The base test-constituency-alpha is RETAINED in the fixed[] list so that
  // base nominations (which point at test-constituency-alpha) remain valid;
  // however, since test-election-1's `constituency_groups` is scoped above
  // to test-cg-1e-Nc only, the voter UI will never offer test-constituency-alpha
  // as a selection target.
  constituencies: {
    count: 0,
    fixed: [
      ...baseFixed('constituencies'),
      {
        external_id: 'test-const-1e-Nc-a',
        name: { en: '1e-Nc Constituency A' },
        sort_order: 10,
        is_generated: false
      },
      {
        external_id: 'test-const-1e-Nc-b',
        name: { en: '1e-Nc Constituency B' },
        sort_order: 11,
        is_generated: false
      },
      {
        external_id: 'test-const-1e-Nc-c',
        name: { en: '1e-Nc Constituency C' },
        sort_order: 12,
        is_generated: false
      }
    ]
  },

  // Pass-through: overlay doesn't touch question_categories.
  question_categories: { count: 0, fixed: baseFixed('question_categories') },

  // Pass-through: overlay doesn't touch questions.
  questions: { count: 0, fixed: baseFixed('questions') },

  // Pass-through: candidates inherit from base (alpha/beta/gamma).
  candidates: { count: 0, fixed: baseFixed('candidates') },

  // Extended: re-nominate alpha/beta/gamma onto the 3 new constituencies on
  // test-election-1. Base nominations are preserved (they point at
  // test-constituency-alpha which is still in the constituencies fixed[]),
  // and 3 additional triangles add nominations for the new constituencies.
  // Per Phase 56 NominationsGenerator.ts: candidate-type nominations carry
  // only the candidate ref; no `organization` field on candidate-type rows.
  nominations: {
    count: 0,
    fixed: [
      ...baseFixed('nominations'),
      {
        external_id: 'test-nom-1e-Nc-alpha',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-1e-Nc-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-1e-Nc-beta',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-1e-Nc-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-1e-Nc-gamma',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-1e-Nc-c' },
        election_round: 1
      }
    ]
  },

  // Phase 74 E2E-04 cell 2: compose variant-scoped app_settings from the
  // base + intro-suppression overlay. Writer Pass-5 reads `row.settings`;
  // variant-scoped external_id survives the `runTeardown('test-', ...)`
  // filter. Deep merge preserves base `results.cardContents` +
  // `results.sections` (`merge_jsonb_column` is additive per Pitfall 3).
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-1e-Nc',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, ONE_E_NC_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantOneENcTemplate;
