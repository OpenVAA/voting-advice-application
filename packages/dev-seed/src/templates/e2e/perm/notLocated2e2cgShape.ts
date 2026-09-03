/**
 * Shared "not-located 2-election / 2-CG" dataset shape.
 *
 * Topology: 2 elections with 2 disjoint CGs × 2 COs each.
 *   - EL-1 → CG-1 → co-1a, co-1b
 *   - EL-2 → CG-2 → co-2a, co-2b
 *
 * The shape forces both the election selector AND the constituency selector to render — `getImpliedElectionIds` cannot auto-imply with 2 elections having disjoint constituency groups. Two consumers need this EXACT shape under DIFFERENT, mutually-disjoint `externalIdPrefix`es (so their teardown projects never race on the same before/after row counts):
 *
 *  - `perm-not-located-2e2cg` — the voter-not-located-redirect spec's dataset, prefix `e2e-perm-notloc-`.
 *  - `perm-bankauth-notloc` — the bank-auth-journey's dataset, prefix `e2e-bankauth-notloc-`.
 *
 * WHY A FACTORY, NOT TWO HAND-MAINTAINED COPIES: the pipeline resolves `externalIdPrefix` once at `ctx` build time (`ctx.ts:89`) and every generator applies it uniformly to a row's OWN `external_id` (`${externalIdPrefix}${fx.external_id}`) — but nested foreign-key references inside a `fixed[]` row (e.g. `constituency_groups: [{ external_id: ... }]`) are pre-baked literal strings the template author writes by hand, NOT re-derived from `ctx.externalIdPrefix`. A RUNTIME prefix override on a shared template OBJECT would therefore prefix the top-level rows with the new prefix while every nested FK reference still pointed at the OLD prefix's strings — an orphaned-reference seed corruption, not a namespace fix (this is why the two consumers are separate `Template` VALUES, not one template reused with a different `externalIdPrefix`). A factory function closes the topology over ITS PARAMETER instead: every nested FK string below is built from `prefix`, so calling it twice with two different prefixes produces two internally consistent templates from ONE copy of the shape — a fix to the topology (e.g. adding a constituency) only needs to be made once, and nothing can silently omit it from one consumer.
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

export function buildNotLocated2e2cgTemplate(prefix: string, labelToken = ''): Template {
  const P = prefix;
  // Display-label namespace. `[EL1]`/`[CO1A]`/… are a PERM-FAMILY SHAPE CONVENTION, not a dataset identity — twelve templates emit `[EL1]`. A consumer whose dataset can be live in the DB alongside another perm dataset MUST pass a token so its labels are unique, or a label-based locator silently resolves to the wrong row. Measured: appending bank-auth to the chain tail made a bare `[EL1]` resolve to 2 elements and correctly failed the journey's identity assertion.
  const T = labelToken;

  return {
    seed: 42,
    externalIdPrefix: P,
    generateTranslationsForAllLocales: false,

    elections: {
      count: 0,
      fixed: [
        {
          external_id: 'el-1',
          name: { en: `[${T}EL1] Region election` },
          short_name: { en: `${T}EL1` },
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
          name: { en: `[${T}EL2] Municipal election` },
          short_name: { en: `${T}EL2` },
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
          name: { en: `[${T}CG1] Region` },
          sort_order: 0,
          is_generated: false,
          constituencies: [{ external_id: `${P}co-1a` }, { external_id: `${P}co-1b` }]
        },
        {
          external_id: 'cg-2',
          name: { en: `[${T}CG2] Municipal` },
          sort_order: 1,
          is_generated: false,
          constituencies: [{ external_id: `${P}co-2a` }, { external_id: `${P}co-2b` }]
        }
      ]
    },

    constituencies: {
      count: 0,
      fixed: [
        { external_id: 'co-1a', name: { en: `[${T}CO1A] Region North` }, sort_order: 0, is_generated: false },
        { external_id: 'co-1b', name: { en: `[${T}CO1B] Region South` }, sort_order: 1, is_generated: false },
        { external_id: 'co-2a', name: { en: `[${T}CO2A] Municipal East` }, sort_order: 2, is_generated: false },
        { external_id: 'co-2b', name: { en: `[${T}CO2B] Municipal West` }, sort_order: 3, is_generated: false }
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
}
