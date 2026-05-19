import type { AnyQuestionVariant, Election } from '@openvaa/data';

/**
 * Return the `Election`s from the list that should be shown for a given question. Returns the applicable elections based on the question's filter values, but only if  `elections` contains multiple elections.
 */
export function getElectionsToShow({
  question,
  elections
}: {
  question: AnyQuestionVariant;
  elections: Array<Election>;
}): Array<Election> {
  if (elections.length < 2) return [];
  return elections.filter((e) => question.appliesTo({ elections: [e] }));
}
