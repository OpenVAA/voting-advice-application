import { MISSING_VALUE } from '@openvaa/core';
import { HasAnswers } from '@openvaa/core';
import { SupportedQuestion } from '../base/supportedQuestion';
import { VAAComment } from '../condensation/condensationInput';

/**
 * Transform repository entities to VAAComment format for condensation engine.
 * Gracefully filters out entities that don't have answer info text.
 */
export function createVAAComments(question: SupportedQuestion, entities: Array<HasAnswers>): Array<VAAComment> {
  const comments: Array<VAAComment> = [];

  // Get comments from entities
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const answer = entity.answers[question.id];

    // Skip if no answer at all
    if (!answer) continue;

    // Check if answer has info text (gracefully handle missing info field)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const infoText = (answer as any).info;
    if (!infoText || typeof infoText !== 'string' || !infoText.trim()) {
      continue; // Silently skip - this is expected and normal
    }

    // Validate answer value using question's normalization
    // This will throw if the answer is invalid for this question type
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      question.normalizeValue((answer.value as any) ?? MISSING_VALUE);
    } catch (error) {
      console.warn(`Skipping invalid answer for entity ${i}, question ${question.id}:`, error);
      continue;
    }
    // Generate entity ID
    // TODO: hash? add unique reproducibility?
    const entityId = `entity_${i}`;

    comments.push({
      id: `${entityId}_${question.id}`,
      candidateID: entityId,
      candidateAnswer: answer.value?.toString() ?? '',
      text: infoText
    });
  }

  return comments;
}
