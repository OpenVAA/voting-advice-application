/**
 * Ne-Nc variant template — 2 elections × 3 constituencies each (E2E-04 cell 4).
 *
 * Spec contract:
 *   - tests/tests/specs/variants/Ne-Nc.spec.ts (E2E-04 cell 4 — the STRONGEST
 *     matrix assertion: constituency dropdown cross-bleed-free filtering).
 *
 * Base: BUILT_IN_TEMPLATES.e2e (single-election baseline). This variant
 * extends base with Election-2 + 2 NEW constituency groups (test-cg-Ne-Nc-e1
 * + test-cg-Ne-Nc-e2), each containing 3 constituencies. Base candidates
 * alpha/beta/gamma are each re-nominated to all 6 constituency slots
 * (2 elections × 3 constituencies per election).
 *
 * E2E-04 cell 4 contract: with N=2 elections and N=3 constituencies per
 * election, the voter app must
 *   (a) SHOW the election selection page (N>1 — must pick one), AND
 *   (b) SHOW the constituency selection page (N>1 per election), AND
 *   (c) CROSS-BLEED-FREE: when Election-1 is selected, the constituency
 *       dropdown MUST list ONLY E1's 3 constituencies; when Election-2 is
 *       selected, it MUST list ONLY E2's 3 constituencies. NO option from
 *       E1 may appear in the E2 dropdown (and vice versa).
 *
 * Per-row `constituency_groups` declarations override the pipeline's
 * full-fanout default — without them every election would wire to every
 * CG and CONFLATE the two elections' constituency pools (which would
 * FAIL the cross-bleed assertion).
 *
 * Overlay-row inventory:
 *   - elections: 1 NEW (test-election-2 — "Test Election 2 (Ne×Nc)") +
 *     re-scoped base test-election-1 → test-cg-Ne-Nc-e1
 *   - constituency_groups: 2 NEW (test-cg-Ne-Nc-e1, test-cg-Ne-Nc-e2), each
 *     declaring its own 3 constituencies; base test-cg-1 dropped
 *   - constituencies: 6 NEW (test-const-Ne-Nc-e1-{a,b,c} +
 *     test-const-Ne-Nc-e2-{a,b,c}); flat siblings, no hierarchy
 *   - nominations: 18 NEW — 3 base candidates × 6 constituency slots; each
 *     of alpha/beta/gamma nominated to all 3 E1 constituencies AND all 3 E2
 *     constituencies
 *   - everything else: pass-through (count: 0, fixed: baseFixed(table))
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-Ne-Nc: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 74 E2E-04 cell 4 (Ne × Nc): settings overlay with popup suppression
 * REQUIRED — the matrix-flow tests will navigate to /results path during
 * the cross-bleed assertion, and feedback/survey popups would intercept
 * clicks. Deep merge via `mergeSettings` preserves base `results.cardContents`
 * + `results.sections` (PATTERNS Pitfall 3 additive).
 */
const NE_NC_APP_SETTINGS_OVERLAY = {
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  results: {
    showFeedbackPopup: 0,
    showSurveyPopup: 0
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

export const variantNeNcTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: overlay doesn't touch organizations.
  organizations: { count: 0, fixed: baseFixed('organizations') },

  // Extended: 2 elections.
  //   - test-election-1 (from base) — explicitly scoped to test-cg-Ne-Nc-e1.
  //     Without per-row scoping, full-fanout would wire it to test-cg-Ne-Nc-e2
  //     too, breaking the cross-bleed contract.
  //   - test-election-2 (NEW) — scoped to test-cg-Ne-Nc-e2 only.
  elections: {
    count: 0,
    fixed: [
      ...baseFixed('elections').map((row) => ({
        ...row,
        constituency_groups: [{ external_id: 'test-cg-Ne-Nc-e1' }]
      })),
      {
        external_id: 'test-election-2',
        name: { en: 'Test Election 2 (Ne×Nc)' },
        short_name: { en: 'Election 2' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: 'test-cg-Ne-Nc-e2' }]
      }
    ]
  },

  // Extended: 2 NEW constituency groups, each with 3 constituencies. The
  // base test-cg-1 is dropped — the variant uses test-cg-Ne-Nc-e1 instead
  // (test-cg-Ne-Nc-e1 is also scoped via test-election-1 above). Explicit
  // `constituencies` refs override the pipeline's full-fanout default;
  // without them each CG would wire to ALL 6 constituencies and the
  // dropdown would surface mixed options — exactly the cross-bleed
  // failure the spec is asserting against.
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-Ne-Nc-e1',
        name: { en: 'Election 1 Constituencies (Ne×Nc)' },
        sort_order: 10,
        is_generated: false,
        constituencies: [
          { external_id: 'test-const-Ne-Nc-e1-a' },
          { external_id: 'test-const-Ne-Nc-e1-b' },
          { external_id: 'test-const-Ne-Nc-e1-c' }
        ]
      },
      {
        external_id: 'test-cg-Ne-Nc-e2',
        name: { en: 'Election 2 Constituencies (Ne×Nc)' },
        sort_order: 20,
        is_generated: false,
        constituencies: [
          { external_id: 'test-const-Ne-Nc-e2-a' },
          { external_id: 'test-const-Ne-Nc-e2-b' },
          { external_id: 'test-const-Ne-Nc-e2-c' }
        ]
      }
    ]
  },

  // Extended: 6 NEW constituencies (3 per election; flat siblings). The
  // base test-constituency-alpha is retained so base nominations (pointing
  // at test-constituency-alpha) remain referentially valid. The voter UI
  // will never offer test-constituency-alpha because test-election-1 is
  // re-scoped to test-cg-Ne-Nc-e1 above. Sort orders 10..15.
  constituencies: {
    count: 0,
    fixed: [
      ...baseFixed('constituencies'),
      {
        external_id: 'test-const-Ne-Nc-e1-a',
        name: { en: 'E1 Constituency A (Ne×Nc)' },
        sort_order: 10,
        is_generated: false
      },
      {
        external_id: 'test-const-Ne-Nc-e1-b',
        name: { en: 'E1 Constituency B (Ne×Nc)' },
        sort_order: 11,
        is_generated: false
      },
      {
        external_id: 'test-const-Ne-Nc-e1-c',
        name: { en: 'E1 Constituency C (Ne×Nc)' },
        sort_order: 12,
        is_generated: false
      },
      {
        external_id: 'test-const-Ne-Nc-e2-a',
        name: { en: 'E2 Constituency A (Ne×Nc)' },
        sort_order: 13,
        is_generated: false
      },
      {
        external_id: 'test-const-Ne-Nc-e2-b',
        name: { en: 'E2 Constituency B (Ne×Nc)' },
        sort_order: 14,
        is_generated: false
      },
      {
        external_id: 'test-const-Ne-Nc-e2-c',
        name: { en: 'E2 Constituency C (Ne×Nc)' },
        sort_order: 15,
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

  // Extended: 18 NEW nominations — each of alpha/beta/gamma nominated to all
  // 6 constituency slots (3 per election × 2 elections). Base nominations are
  // preserved. Per Phase 56 NominationsGenerator.ts: candidate-type
  // nominations carry only the candidate ref (no `organization` field).
  nominations: {
    count: 0,
    fixed: [
      ...baseFixed('nominations'),
      // alpha × Election 1 × {a, b, c}
      {
        external_id: 'test-nom-Ne-Nc-alpha-e1-a',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-alpha-e1-b',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-alpha-e1-c',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-c' },
        election_round: 1
      },
      // alpha × Election 2 × {a, b, c}
      {
        external_id: 'test-nom-Ne-Nc-alpha-e2-a',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-alpha-e2-b',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-alpha-e2-c',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-c' },
        election_round: 1
      },
      // beta × Election 1 × {a, b, c}
      {
        external_id: 'test-nom-Ne-Nc-beta-e1-a',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-beta-e1-b',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-beta-e1-c',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-c' },
        election_round: 1
      },
      // beta × Election 2 × {a, b, c}
      {
        external_id: 'test-nom-Ne-Nc-beta-e2-a',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-beta-e2-b',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-beta-e2-c',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-c' },
        election_round: 1
      },
      // gamma × Election 1 × {a, b, c}
      {
        external_id: 'test-nom-Ne-Nc-gamma-e1-a',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-gamma-e1-b',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-gamma-e1-c',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-Ne-Nc-e1-c' },
        election_round: 1
      },
      // gamma × Election 2 × {a, b, c}
      {
        external_id: 'test-nom-Ne-Nc-gamma-e2-a',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-gamma-e2-b',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-b' },
        election_round: 1
      },
      {
        external_id: 'test-nom-Ne-Nc-gamma-e2-c',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-Ne-Nc-e2-c' },
        election_round: 1
      }
    ]
  },

  // Phase 74 E2E-04 cell 4: compose variant-scoped app_settings from the
  // base + Ne-Nc overlay (intro suppression + popup suppression). Deep
  // merge preserves base `results.cardContents` + `results.sections`.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-Ne-Nc',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, NE_NC_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantNeNcTemplate;
