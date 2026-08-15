/**
 * perm-bankauth-notloc minimal-data template (Phase 140, CR-01 remediation).
 *
 * A DEDICATED copy of `perm-not-located-2e2cg`'s dataset shape (verbatim
 * topology: 2 elections with 2 disjoint CGs × 2 COs each), reserved for the
 * `bank-auth-journey` data-setup/data-teardown pair so it owns a namespace
 * that is provably disjoint from the shared `e2e-perm-notloc-` prefix.
 *
 * WHY A SEPARATE TEMPLATE, NOT A RUNTIME PREFIX OVERRIDE: the pipeline
 * resolves `externalIdPrefix` once at `ctx` build time (`ctx.ts:89`) and
 * every generator applies it uniformly to a row's OWN `external_id`
 * (`${externalIdPrefix}${fx.external_id}`) — but nested foreign-key
 * references inside a `fixed[]` row (e.g. `constituency_groups: [{
 * external_id: ... }]`) are pre-baked literal strings the template author
 * writes by hand, NOT re-derived from `ctx.externalIdPrefix`. Passing a
 * different prefix into `setupFromTemplate` while reusing
 * `perm-not-located-2e2cg`'s template object verbatim would prefix the
 * top-level rows with the new prefix while every nested FK reference still
 * pointed at the OLD `e2e-perm-notloc-*` strings — an orphaned-reference
 * seed corruption, not a namespace fix. Duplicating the template with its
 * own frozen prefix constant (the same pattern already used by every other
 * "distinct externalIdPrefix … for parallel safety" entry in
 * `templates/index.ts`, e.g. perm-access-disable / perm-per-app-notifications
 * / perm-question-video) keeps every reference internally consistent by
 * construction.
 *
 * Topology: 2 elections with 2 disjoint CGs × 2 COs each.
 *   - EL-1 → CG-1 → co-1a, co-1b
 *   - EL-2 → CG-2 → co-2a, co-2b
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-bankauth-notloc-'` — disjoint by
 * construction from `e2e-perm-notloc-` (the perm-family prefix) AND from
 * `test-` (the base-journey prefix), so `bank-auth-journey.setup.ts` no
 * longer needs to pre-clear either namespace via `extraTeardownPrefix`.
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS verbatim.
 */

import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  buildQuestionCategories,
  buildQuestions,
  buildStandardCandidateAnswers,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-bankauth-notloc-';

export const permBankauthNotLocatedTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Region election' },
        short_name: { en: 'EL1' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 0,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-1` }]
      },
      {
        external_id: 'el-2',
        name: { en: '[EL2] Municipal election' },
        short_name: { en: 'EL2' },
        election_type: 'local',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-2` }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-1',
        name: { en: '[CG1] Region' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-1a` }, { external_id: `${P}co-1b` }]
      },
      {
        external_id: 'cg-2',
        name: { en: '[CG2] Municipal' },
        sort_order: 1,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-2a` }, { external_id: `${P}co-2b` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      { external_id: 'co-1a', name: { en: '[CO1A] Region North' }, sort_order: 0, is_generated: false },
      { external_id: 'co-1b', name: { en: '[CO1B] Region South' }, sort_order: 1, is_generated: false },
      { external_id: 'co-2a', name: { en: '[CO2A] Municipal East' }, sort_order: 2, is_generated: false },
      { external_id: 'co-2b', name: { en: '[CO2B] Municipal West' }, sort_order: 3, is_generated: false }
    ]
  },

  organizations: { count: 0, fixed: buildOrganizations() },
  question_categories: { count: 0, fixed: buildQuestionCategories() },
  questions: { count: 0, fixed: buildQuestions({ prefix: P }) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'A',
        idSuffix: 'ca-1-1a',
        sortOrder: 0,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'A',
        idSuffix: 'ca-2-1a',
        sortOrder: 1,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'B',
        idSuffix: 'ca-1-1b',
        sortOrder: 2,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'B',
        idSuffix: 'ca-2-1b',
        sortOrder: 3,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'C',
        idSuffix: 'ca-1-2a',
        sortOrder: 4,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'C',
        idSuffix: 'ca-2-2a',
        sortOrder: 5,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'D',
        idSuffix: 'ca-1-2b',
        sortOrder: 6,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'D',
        idSuffix: 'ca-2-2b',
        sortOrder: 7,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-1',
        constituencyIdSuffix: 'co-1a',
        candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'],
        electionSymbolStart: 1
      }),
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-1',
        constituencyIdSuffix: 'co-1b',
        candidateIdSuffixes: ['ca-1-1b', 'ca-2-1b'],
        electionSymbolStart: 10
      }),
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-2',
        constituencyIdSuffix: 'co-2a',
        candidateIdSuffixes: ['ca-1-2a', 'ca-2-2a'],
        electionSymbolStart: 20
      }),
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-2',
        constituencyIdSuffix: 'co-2b',
        candidateIdSuffixes: ['ca-1-2b', 'ca-2-2b'],
        electionSymbolStart: 30
      })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default permBankauthNotLocatedTemplate;
