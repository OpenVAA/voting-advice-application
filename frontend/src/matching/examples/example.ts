import type {
    HasMatchableAnswers,
    MatchableAnswer,
} from "..";

import {
    MatchingAlgorithmBase,
    MatchableQuestion,
    MISSING_VALUE,
    MultipleChoiceQuestion,
    DistanceMetric,
    MissingValueDistanceMethod,
} from "..";

/**
 * Simple example.
 * Run with `ts-node-esm --experimentalSpecifierResolution node example.ts`
 */
function main(
    numCandidates = 5,
    numQuestions = 5,
    likertScale = 5,
    voterAnswer = 2,
    numMissing = 1
): void {

    // Create dummy questions
    const questions = Array.from({length: numQuestions}, (_, i) => MultipleChoiceQuestion.fromLikertScale(likertScale));

    // Create dummy candidates with dummy answers
    const candidates = Array.from({length: numCandidates}, (_, i) => new Candidate(`Candidate ${i} - answers ${(i % likertScale) + 1} to all`, createAnswers(questions, (i % likertScale) + 1, numMissing)));

    // Create a Candidate to represent the voter
    const voter = new Candidate("Voter", createAnswers(questions, voterAnswer));

    // Manhattan matching algorithm
    const manhattan = new MatchingAlgorithmBase({
        distanceMetric: DistanceMetric.Manhattan,
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    });

    // Directional matching algorithm
    const directional = new MatchingAlgorithmBase({
        distanceMetric: DistanceMetric.Directional,
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    });

    // Get matches for both methods
    const manhattanMatches = manhattan.match(voter, candidates);
    const directionalMatches = directional.match(voter, candidates);

    // Generate output string
    let output = `Questions: ${numQuestions} • Likert scale ${likertScale} • Cand's have ${numMissing} missing answers\n`;
    output += `The voter answers ${voterAnswer} to all\n`;
    for (let i = 0; i < candidates.length; i++) {
        output += `${manhattanMatches[i].entity} • Matches: Manhattan ${manhattanMatches[i]} • Directional ${directionalMatches[i]}\n`;
    }

    console.log(output);
}

/**
 * Create dummy answers.
 * 
 * @param questions Question list
 * @param answerValue The same value for all
 * @param missing Number of missing answers
 * @returns Array of answers
 */
function createAnswers(questions: MatchableQuestion[], answerValue: number, missing = 0):  MatchableAnswer[] {
    const answers: MatchableAnswer[] = [];
    for (let i = 0; i < questions.length; i++) {
        answers.push({
            question: questions[i],
            value: i < missing ? MISSING_VALUE : answerValue
        })
    }
    return answers;
}

/**
 * A dummy candidate object for matching.
 */
class Candidate implements HasMatchableAnswers {
    constructor(
        public readonly name: string,
        public answers: MatchableAnswer[]
    ) {}

    getMatchableAnswer(question: MatchableQuestion): MatchableAnswer {
        for (const answer of this.answers) {
            if (answer.question === question)
                return answer;
        }
        return {question, value: MISSING_VALUE};
    }

    getMatchableAnswers(): MatchableAnswer[] {
        return this.answers;
    }

    toString(): string {
        return this.name;
    }
}

main();
main(4, 4, 4, 2, 1);
