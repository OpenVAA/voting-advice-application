import {
  DistanceMetric,
  MatchingAlgorithm,
  MissingValueDistanceMethod,
  MultipleChoiceQuestion,
  type HasMatchableAnswers,
  type MatchableQuestion,
  type MatchableQuestionGroup,
  type MatchingOptions
} from '..';
import type {AnswerDict} from '../src/entity/hasMatchableAnswers';

/**
 * Simple example.
 * Run with `ts-node-esm --experimentalSpecifierResolution node example.ts`
 */
function main(
  numCandidates = 5,
  numQuestions = 5,
  likertScale = 5,
  voterAnswer = 2,
  numMissing = 1,
  randomCandAnswer = false,
  subGroup = 0
): void {
  // Create dummy questions
  const questions = Array.from({length: numQuestions}, (i: number) =>
    MultipleChoiceQuestion.fromLikert(`q${i}`, likertScale)
  );

  // Create answer subgroup
  const matchingOptions: MatchingOptions<MatchableQuestionGroup & {label: string}> = {};
  if (subGroup > 0) {
    if (subGroup > numQuestions) throw new Error("subGroup can't be larger than numQuestions!");
    matchingOptions.questionGroups = [
      {
        label: `Questions 1 to ${subGroup}`,
        matchableQuestions: questions.slice(0, subGroup)
      }
    ];
  }

  // Create dummy candidates with dummy answers
  const candidates = Array.from({length: numCandidates}, (_, i) => {
    const value = randomCandAnswer
      ? () => Math.floor(Math.random() * likertScale) + 1
      : (i % likertScale) + 1;
    const answers = createAnswers(questions, value, numMissing);
    return new Candidate(`Candidate ${i} - Answers ${Object.values(answers).join(', ')}`, answers);
  });

  // Create a Candidate to represent the voter
  const voter = new Candidate('Voter', createAnswers(questions, voterAnswer));

  // Manhattan matching algorithm
  const manhattan = new MatchingAlgorithm({
    distanceMetric: DistanceMetric.Manhattan,
    missingValueOptions: {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    }
  });

  // Directional matching algorithm
  const directional = new MatchingAlgorithm({
    distanceMetric: DistanceMetric.Directional,
    missingValueOptions: {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    }
  });

  // Get matches for both methods
  const manhattanMatches = manhattan.match(questions, voter, candidates, matchingOptions);
  const directionalMatches = directional.match(questions, voter, candidates, matchingOptions);

  // Generate output string
  let output = `Questions: ${numQuestions} • Likert scale ${likertScale}\n`;
  output += `The voter answers ${voterAnswer} to all\n`;
  for (let i = 0; i < candidates.length; i++) {
    output += `${manhattanMatches[i].entity} • Matches: Manhattan ${manhattanMatches[i]} • Directional ${directionalMatches[i]}\n`;
    if (subGroup > 0)
      output += `  Submatches ${manhattanMatches[i].subMatches?.[0]?.questionGroup?.label}: Manhattan ${manhattanMatches[i].subMatches?.[0]} • Directional ${directionalMatches[i].subMatches?.[0]}\n`;
  }

  console.info(output);
}

/**
 * Create dummy answers.
 *
 * @param questions Question list
 * @param answerValue The same value for all or a function to generate on
 * @param missing Number of missing answers
 * @returns Answer dict
 */
function createAnswers(
  questions: MatchableQuestion[],
  answerValue: number | ((index: number) => number),
  missing = 0
): AnswerDict {
  const answers = {} as AnswerDict;
  for (let i = 0; i < questions.length; i++) {
    answers[questions[i].id] = {
      value:
        i < missing ? undefined : typeof answerValue === 'number' ? answerValue : answerValue(i)
    };
  }
  return answers;
}

/**
 * A dummy candidate object for matching.
 */
class Candidate implements HasMatchableAnswers {
  constructor(
    public readonly name: string,
    public answers: AnswerDict
  ) {}

  toString(): string {
    return this.name;
  }
}

main();
// main(4, 4, 4, 2, 1);
main(4, 4, 4, 2, 0, true, 2);
