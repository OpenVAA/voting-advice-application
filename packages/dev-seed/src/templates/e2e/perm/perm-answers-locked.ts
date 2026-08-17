/**
 * perm-answers-locked minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1
 * opinion Likert-5 question. The under-test setting is
 * `access.answersLocked: true`, which:
 *
 *   1. surfaces the read-only login info text on /en/candidate (login page)
 *      via the `login-answers-locked-info` testid;
 *   2. renders the editingNotAllowed Warning + disables every <Input> on
 *      /en/candidate/profile + /en/candidate (protected home);
 *   3. renders the same Warning on /en/candidate/questions/[questionId] and
 *      disables every <input type="radio"> inside the question-choices
 *      fieldset (mode === 'display' in OpinionQuestionInput / QuestionChoices).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-answers-locked-'` (distinct
 * from every other perm chain).
 *
 * The spec consumes `mintCandidateSession({ externalId: 'cand-1', prefix: P })`
 * to mint a Playwright storage-state JSON file consumed by the AUTHENTICATED
 * sub-tests covering surfaces 2 + 3. The UNAUTHENTICATED sub-test (surface 1,
 * /en/candidate login page) does not use storage state.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-answers-locked-';

export const permAnswersLockedTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    access: { answersLocked: true }
  }
});

export default permAnswersLockedTemplate;
