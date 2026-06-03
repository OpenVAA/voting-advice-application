/**
 * perm-hide-hero minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1
 * opinion Likert-5 question carrying `customData.hero` (an emoji). The
 * under-test setting is `candidateApp.questions.hideHero: true` which
 * suppresses rendering of the hero inside the candidate-questions-hero
 * <figure> on /en/candidate/questions/[questionId] (the gate at
 * apps/frontend/src/routes/candidate/(protected)/questions/[questionId]
 * /+page.svelte:266 is `!hideHero && customData?.hero`).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-hide-hero-'`.
 *
 * The spec consumes `mintCandidateSession` to mint an authenticated candidate
 * session — the protected questions route requires an authenticated candidate
 * identity.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-hide-hero-';

export const permHideHeroTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  customDataByQuestion: {
    'qu-opin-l5-1': { hero: '🗳️' }
  },
  settingsOverlay: {
    candidateApp: { questions: { hideHero: true } }
  }
});

export default permHideHeroTemplate;
