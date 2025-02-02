import type { AnyQuestionVariant, Election } from '@openvaa/data';

/**
 * Return the `Election`s that should be shown for a given question. Returns the applicable elections based on the question's filter values, but only if the `dataRoot` contains multiple elections.
 */
export function getElectionsToShow(question: AnyQuestionVariant): Array<Election> {
  const allElections = question.root.elections;
  if (allElections.length < 2) return [];
  const questionElections = question.elections;
  if (questionElections.length) return questionElections;
  return allElections;
}
