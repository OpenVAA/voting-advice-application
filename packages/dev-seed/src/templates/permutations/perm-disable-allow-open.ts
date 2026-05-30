/**
 * perm-disable-allow-open minimal-data template — Phase 91 Plan 02
 * (TIR6:121-142, A9).
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 2
 * opinion Likert-5 questions. Per D-91-PD-04 (TIR6:122 `!has info` typo
 * resolution), cand-1 authors info text on BOTH Q1 + Q2 answers. The
 * customData.allowOpen flag controls visibility:
 *
 *   Q1: customData.allowOpen = true  → candidate-side info input visible
 *                                       + voter-side info renders.
 *   Q2: customData.allowOpen = false → candidate-side info input absent
 *       (gated `{#if customData.allowOpen}` at apps/frontend/src/routes/
 *        candidate/(protected)/questions/[questionId]/+page.svelte:294)
 *       + voter-side info hidden (gated `{#if answer?.info &&
 *        customData?.allowOpen !== false}` at apps/frontend/src/lib/
 *        dynamic-components/entityDetails/EntityOpinions.svelte:78).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:121-142.
 *
 * Prefix: 'e2e-perm-no-allowopen-' per D-91-PD-05.
 *
 * A9 spec uses TWO describe blocks — one authenticated (storageState via
 * candidateSessionMinter / D-91-PD-06) for the candidate-side assertions
 * + one unauthenticated for the voter walk to /results → cand-1 detail.
 */

import { buildMinimal } from '../_helpers/buildMinimal';
import type { Template } from '../../template/types';

const P = 'e2e-perm-no-allowopen-';

export const permDisableAllowOpenTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 2,
  infoQuestions: 0,
  customDataByQuestion: {
    // Q1: candidate-side info-input gate requires customData.allowOpen === true
    // (truthy literal — not `!== false`). Voter-side gate is `!== false` so
    // either undefined or `true` would render; we set true to keep the gate
    // explicit + symmetric with Q2's `false`.
    'qu-opin-l5-1': { allowOpen: true },
    'qu-opin-l5-2': { allowOpen: false }
  },
  answersByCandidate: {
    // Per D-91-PD-04: candidate authors info on BOTH Q1+Q2 — allowOpen=false
    // on Q2 SUPPRESSES rendering, not the underlying answer payload.
    'cand-1': {
      'qu-opin-l5-1': { value: '3', info: { en: '[Q1 info from cand-1] desc' } },
      'qu-opin-l5-2': { value: '4', info: { en: '[Q2 info from cand-1] desc' } }
    }
  }
});

export default permDisableAllowOpenTemplate;
