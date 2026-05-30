/**
 * perm-hide-if-missing-answers minimal-data template — Phase 91 Plan 02
 * (TIR6:95-102, A6).
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 2 candidates, 2
 * opinion Likert-5 questions. Cand-1 (`[CA1A]`) answers BOTH questions;
 * cand-2 (`[CA2B]`) answers ONLY Q1 — the `entities.hideIfMissingAnswers
 * .candidate: true` setting filters cand-2 out of voter results (cascade
 * gate in `apps/frontend/src/lib/api/adapters/supabase/
 * supabaseDataProvider.ts:384`).
 *
 * Pitfall 6 — the same gate also filters orgs from voter results when
 * EVERY candidate in that org is filtered. With cand-1 visible in or-1,
 * or-1 still appears. The spec asserts on candidate visibility ONLY (cand-1
 * visible / cand-2 hidden), NOT on org count.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:95-102.
 *
 * Prefix: 'e2e-perm-hide-missing-' per D-91-PD-05.
 */

import { buildMinimal } from '../_helpers/buildMinimal';
import type { Template } from '../../template/types';

const P = 'e2e-perm-hide-missing-';

export const permHideIfMissingAnswersTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 2,
  opinionQuestions: 2,
  infoQuestions: 0,
  answersByCandidate: {
    'cand-1': {
      'qu-opin-l5-1': { value: '3' },
      'qu-opin-l5-2': { value: '4' }
    },
    // cand-2 answers Q1 only — Q2 missing triggers the hideIfMissingAnswers
    // filter and cand-2 disappears from voter results.
    'cand-2': {
      'qu-opin-l5-1': { value: '3' }
    }
  },
  settingsOverlay: {
    entities: { hideIfMissingAnswers: { candidate: true } }
  }
});

export default permHideIfMissingAnswersTemplate;
