import type { Id } from '@openvaa/core';
import type { Answers } from '@openvaa/data';
import type { VoterAnswers } from './answerStore.type';

/**
 * Parse a `VoterAnswes` object into an `Answers` object and a `weights` object.
 */
export function parseVoterAnswers(voterAnswers: VoterAnswers): { answers: Answers; weights: Record<Id, number> } {
  const answers: Answers = {};
  const weights: Record<Id, number> = {};

  for (const [id, answer] of Object.entries(voterAnswers)) {
    if (!answer) continue;
    const { value, weight } = answer;
    if (value != null) answers[id] = { value };
    if (weight != null) weights[id] = weight;
  }

  return { answers, weights };
}
