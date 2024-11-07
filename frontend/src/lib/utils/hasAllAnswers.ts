import { isCandidate, isParty } from './entities';

/**
 * Check whether the entity has answers to all of the given questions.
 * @param entity A Candidate or a Party
 * @param questions A list of questions
 */
export function hasAllAnswers(entity: EntityProps, questions: Array<QuestionProps>): boolean {
  let type: EntityType;
  if (isCandidate(entity)) type = 'candidate';
  else if (isParty(entity)) type = 'party';
  else throw new Error('Invalid entity type');
  return questions.every((q) => (q.entityType !== 'all' && q.entityType !== type) || entity.answers[q.id] != null);
}
