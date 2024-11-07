import { type AnswerDict, type HasAnswers, type Id, type MatchableQuestion, MISSING_VALUE } from '@openvaa/core';
import { MatchingAlgorithm } from '../src/algorithms';
import { OrdinalQuestion } from '../src/question';
import type { DistanceMetric } from '../src/distance';
import type { Match } from '../src/match';
import type { MissingValueMethod } from '../src/missingValue';

/**********************************************************************
 * Helper functions
 **********************************************************************/

/**
 * Create dummy matches for testing.
 * @param voterAnswers Array of voter answers as indeces of the likert scale
 * @param candidateAnswers Array of Arrays of candidate answers as numbers of the likert scale (1-based)
 * @param likertScale The likert scale, e.g. 5
 * @param distanceMetric The DistanceMetric to use
 * @param method The MISSING_VALUE_METHOD
 * @returns A dict of all generated objects
 */
export function createMatchesAndEntities(
  voterAnswers: Array<number | undefined>,
  candidateAnswers: Array<Array<number | undefined>>,
  likertScale: number,
  distanceMetric: DistanceMetric,
  method: MissingValueMethod
): {
  questions: Array<OrdinalQuestion>;
  voter: Candidate;
  candidates: Array<Candidate>;
  algorithm: MatchingAlgorithm;
  matches: Array<Match<Candidate>>;
} {
  const numQuestions = voterAnswers.length;
  // Create dummy questions
  const questions = createQuestions(numQuestions, likertScale);
  if ([voterAnswers, ...candidateAnswers].some((a) => a.length !== numQuestions))
    throw new Error('All answers must have the same length as the Likert scale.');
  if ([voterAnswers, ...candidateAnswers].flat().some((a) => a != null && (a < 1 || a > likertScale)))
    throw new Error('All answers must have be within [0, Likert scale).');
  // Match answer ids
  function answers(answers: Array<number | undefined>): Array<Id | undefined> {
    return answers.map((a) => (a == null ? undefined : questions[0].values[a - 1]?.id));
  }
  // Create a Candidate to represent the voter
  const voter = createVoter(questions, answers(voterAnswers));
  // Create dummy candidates
  const candidates = createCandidates(
    questions,
    candidateAnswers.map((a) => answers(a))
  );
  // Matching algorithm
  const algorithm = new MatchingAlgorithm({
    distanceMetric,
    missingValueOptions: { method }
  });
  // Get matches
  const matches = algorithm.match({ questions, reference: voter, targets: candidates });
  return {
    questions,
    voter,
    candidates,
    algorithm,
    matches
  };
}

/**
 * A dummy candidate object for matching.
 */
export class Candidate implements HasAnswers {
  constructor(public answers: AnswerDict) {}
}

/**
 * A mock question for creating spaces.
 */
export class MockQuestion implements MatchableQuestion {
  id: Id;
  constructor(public normalizedDimensions: number) {
    this.id = `mockQuestion_${Math.random()}`;
  }
  normalizeValue() {
    return MISSING_VALUE;
  }
}

/**
 * Create dummy answers.
 * @param questions Question list
 * @param answerValues The answer values
 * @returns An answer dict
 */
export function createAnswers(questions: Array<MatchableQuestion>, answerValues: Array<Id | undefined>): AnswerDict {
  const answers = {} as AnswerDict;
  for (let i = 0; i < questions.length; i++) {
    answers[questions[i].id] = { value: answerValues[i] };
  }
  return answers;
}

/**
 * Create dummy questions.
 * @param numQuestions Number of questions to creata
 * @param scale The likert scale, e.g. 5
 * @returns Array of questions
 */
export function createQuestions(numQuestions: number, scale: number): Array<OrdinalQuestion> {
  return Array.from({ length: numQuestions }, (_, i) => OrdinalQuestion.fromLikert({ id: `qst${i}`, scale }));
}

/**
 * Create dummy candidates
 * @param questions The dummy questions
 * @param candidateAnswers Array of Arrays of candidate answers
 * @returns Array of candidates
 */
export function createCandidates(
  questions: Array<MatchableQuestion>,
  candidateAnswers: Array<Array<Id | undefined>>
): Array<Candidate> {
  return candidateAnswers.map((o) => new Candidate(createAnswers(questions, o)));
}

/**
 * Create a dummy Candidate to represent the voter
 * @param questions The dummy questions
 * @param voterAnswers Array of voter answers
 * @returns A candidate
 */
export function createVoter(questions: Array<MatchableQuestion>, voterAnswers: Array<Id | undefined>): Candidate {
  return new Candidate(createAnswers(questions, voterAnswers));
}
