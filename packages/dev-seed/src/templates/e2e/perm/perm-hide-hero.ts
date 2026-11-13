/**
 * perm-hide-hero minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1 opinion Likert-5 question carrying `customData.hero` (an emoji). The under-test setting is `contestantApp.questions.hideHero: true` which suppresses rendering of the hero inside the contestant-questions-hero <figure> on /en/contestant/questions/[questionId] (the gate in apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte is `!hideHero && customData?.hero`).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-hide-hero-'`.
 *
 * The spec consumes `mintContestantSession` to mint an authenticated candidate session — the protected questions route requires an authenticated candidate identity.
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
    contestantApp: { questions: { hideHero: true } }
  }
});

export default permHideHeroTemplate;
