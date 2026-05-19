/**
 * Constituency variant template — extends the Phase 58 e2e base with two
 * elections that each own a separate, disjoint municipality-only constituency
 * group.
 *
 * Replaces the legacy `tests/tests/data/overlays/constituency-overlay`
 * JSON fixture per Phase 59 E2E-02 (deleted in Plan 59-06). Loaded via
 * `yarn dev:seed --template tests/tests/setup/templates/variant-constituency.ts`.
 *
 * Spec contract: tests/tests/specs/variants/constituency.spec.ts (CONF-03).
 * Base: BUILT_IN_TEMPLATES.e2e (packages/dev-seed/src/templates/e2e.ts).
 *
 * Shape (disjoint groups, no hierarchy):
 *   - test-election-1 (2025) → test-cg-east-municipalities (NE + SE)
 *   - test-election-2 (2026) → test-cg-west-municipalities (NW + SW)
 *   - Groups share no constituencies and have no parent/child relations.
 *     This avoids the "hierarchical implication" footgun where the
 *     constituency-selector's parent walk diverges from the results-layer
 *     nomination lookup (which does exact constituencyId matching only —
 *     dataRoot.findNominations, packages/data/src/root/dataRoot.ts).
 *   - 6 candidates: 2 in NE, 2 in SE, 2 in SW. NW is intentionally empty —
 *     it's the partial-coverage constituency for the missing-nominations
 *     warning test in constituency.spec.ts.
 *   - Base nominations at test-constituency-alpha are inherited but orphaned
 *     (test-cg-1 is not included in the variant), so they never surface for
 *     either election:constituency tuple. The base candidates alpha/beta/
 *     gamma/delta remain in the candidates table for parity with other
 *     variants but contribute no visible nominations here.
 *
 * Shape-drift corrections applied during JSON-to-TS transcription:
 *   - first-name-field -> first_name, last-name-field -> last_name,
 *     tou-accepted-field -> terms_of_use_accepted (snake_case matches
 *     TablesInsert<'candidates'> and the e2e base).
 *   - ID reference objects migrated camelCase -> snake_case on every
 *     reference object (parent, category, candidate, election, constituency,
 *     organization). All accessors below use `external_id` consistently.
 *   - categoryType -> category_type, electionDate -> election_date,
 *     electionStartDate stripped (not a schema column; unused).
 *   - JSON-level project / published fields dropped per Template schema
 *     (project id is ctx-level; bulk_import defaults published).
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-constituency: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 63 E2E-02 (D-02 + D-03): variant-specific `app_settings.settings`
 * overlay. Authoring the overlay explicitly (rather than deriving implicitly)
 * keeps the variant's intent visible for reviewers.
 */
const CONSTITUENCY_APP_SETTINGS_OVERLAY = {
  // Variant tests walk the journey to a question page; bypass the now-default
  // questions intro from E2E_BASE_APP_SETTINGS.
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

/**
 * Build an `answersByExternalId` object covering test-question-1..8 (the
 * base e2e LIKERT_5 ordinals). Each value is a `1`-`5` string keyed to the
 * matching base question external_id.
 */
function makeAnswers(values: [number, number, number, number, number, number, number, number]): Record<
  string,
  { value: string }
> {
  return Object.fromEntries(values.map((v, i) => [`test-question-${i + 1}`, { value: `${v}` }]));
}

export const variantConstituencyTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: overlay doesn't touch organizations.
  organizations: { count: 0, fixed: baseFixed('organizations') },

  // Two elections, each bound to ONE disjoint municipality-only group.
  //   - test-election-1 (from base, 2025) → test-cg-east-municipalities only.
  //   - test-election-2 (NEW, 2026) → test-cg-west-municipalities only.
  elections: {
    count: 0,
    fixed: [
      ...baseFixed('elections').map((row) => ({
        ...row,
        constituency_groups: [{ external_id: 'test-cg-east-municipalities' }]
      })),
      {
        external_id: 'test-election-2',
        name: { en: 'Test Election 2026' },
        short_name: { en: 'Election 2026' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: 'test-cg-west-municipalities' }]
      }
    ]
  },

  // Two disjoint constituency groups. The base `test-cg-1` is dropped —
  // variant uses its own east/west groups instead.
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-east-municipalities',
        name: { en: 'Eastern Municipalities' },
        sort_order: 10,
        is_generated: false,
        constituencies: [{ external_id: 'test-const-muni-ne' }, { external_id: 'test-const-muni-se' }]
      },
      {
        external_id: 'test-cg-west-municipalities',
        name: { en: 'Western Municipalities' },
        sort_order: 11,
        is_generated: false,
        constituencies: [{ external_id: 'test-const-muni-nw' }, { external_id: 'test-const-muni-sw' }]
      }
    ]
  },

  // Four NEW flat municipalities. No `parent` refs — the two groups are
  // disjoint and no hierarchy spans them, by design.
  constituencies: {
    count: 0,
    fixed: [
      ...baseFixed('constituencies'),
      { external_id: 'test-const-muni-ne', name: { en: 'NE Municipality' }, sort_order: 10, is_generated: false },
      { external_id: 'test-const-muni-se', name: { en: 'SE Municipality' }, sort_order: 11, is_generated: false },
      { external_id: 'test-const-muni-nw', name: { en: 'NW Municipality' }, sort_order: 12, is_generated: false },
      { external_id: 'test-const-muni-sw', name: { en: 'SW Municipality' }, sort_order: 13, is_generated: false }
    ]
  },

  // Pass-through: variant doesn't add scoped categories or questions. The
  // 8 base ordinals (test-question-1..8) provide all opinion questions
  // needed by the spec.
  question_categories: { count: 0, fixed: baseFixed('question_categories') },
  questions: { count: 0, fixed: baseFixed('questions') },

  // Six NEW candidates — 2 per populated constituency (NE / SE / SW).
  // NW intentionally gets no candidates (and no nominations) so the
  // missing-nominations warning test in the spec has a partial-coverage
  // constituency to select for Election 2.
  candidates: {
    count: 0,
    fixed: [
      ...baseFixed('candidates'),
      {
        external_id: 'test-const-cand-ne-1',
        first_name: 'NE',
        last_name: 'Candidate One',
        email: 'const.ne1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 30,
        is_generated: false,
        answersByExternalId: makeAnswers([4, 5, 3, 2, 4, 3, 5, 4])
      },
      {
        external_id: 'test-const-cand-ne-2',
        first_name: 'NE',
        last_name: 'Candidate Two',
        email: 'const.ne2@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 31,
        is_generated: false,
        answersByExternalId: makeAnswers([2, 3, 4, 3, 2, 4, 3, 2])
      },
      {
        external_id: 'test-const-cand-se-1',
        first_name: 'SE',
        last_name: 'Candidate One',
        email: 'const.se1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 32,
        is_generated: false,
        answersByExternalId: makeAnswers([3, 4, 5, 1, 5, 2, 4, 3])
      },
      {
        external_id: 'test-const-cand-se-2',
        first_name: 'SE',
        last_name: 'Candidate Two',
        email: 'const.se2@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 33,
        is_generated: false,
        answersByExternalId: makeAnswers([5, 4, 3, 4, 5, 3, 4, 5])
      },
      {
        external_id: 'test-const-cand-sw-1',
        first_name: 'SW',
        last_name: 'Candidate One',
        email: 'const.sw1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 34,
        is_generated: false,
        answersByExternalId: makeAnswers([1, 2, 3, 4, 5, 4, 3, 2])
      },
      {
        external_id: 'test-const-cand-sw-2',
        first_name: 'SW',
        last_name: 'Candidate Two',
        email: 'const.sw2@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 35,
        is_generated: false,
        answersByExternalId: makeAnswers([4, 3, 2, 5, 4, 3, 2, 1])
      }
    ]
  },

  // Six NEW nominations. NE and SE candidates → E1 at their muni; SW
  // candidates → E2 at SW. NW has zero nominations on purpose.
  nominations: {
    count: 0,
    fixed: [
      ...baseFixed('nominations'),
      {
        external_id: 'test-nom-const-ne-1-e1',
        candidate: { external_id: 'test-const-cand-ne-1' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-muni-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-ne-2-e1',
        candidate: { external_id: 'test-const-cand-ne-2' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-muni-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-se-1-e1',
        candidate: { external_id: 'test-const-cand-se-1' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-muni-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-se-2-e1',
        candidate: { external_id: 'test-const-cand-se-2' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-muni-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-sw-1-e2',
        candidate: { external_id: 'test-const-cand-sw-1' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-muni-sw' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-sw-2-e2',
        candidate: { external_id: 'test-const-cand-sw-2' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-muni-sw' },
        election_round: 1
      }
    ]
  },

  // Phase 63 E2E-02 (D-02 + D-03 + RESOLVED Q1): compose variant-scoped
  // app_settings from the base + overlay. Writer Pass-5 reads `row.settings`;
  // variant-scoped external_id survives the `runTeardown('test-', ...)` filter.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-constituency',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, CONSTITUENCY_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantConstituencyTemplate;
