import {
    HasMatchableAnswers,
    MatchingAlgorithmBase,
    MatchableAnswer,
    MatchableQuestion,
    MISSING_VALUE,
    MultipleChoiceQuestion,
    DistanceMetric,
    MissingValueDistanceMethod,
} from ".";

/**
 * Simple example.
 * Run with `ts-node-esm --experimentalSpecifierResolution node example.ts`
 */
function main(): void {
    const numCandidates = 5;
    const numQuestions = 5;
    const likertScale = 5;
    const voterAnswer = 2;
    const numMissing = 1;

    const questions = Array.from({length: numQuestions}, (_, i) => MultipleChoiceQuestion.fromLikertScale(likertScale));

    const candidates = Array.from({length: numCandidates}, (_, i) => new Candidate(`Candidate ${i} - answers ${(i % likertScale) + 1}`, createAnswers(questions, (i % likertScale) + 1, numMissing)));

    const voter = new Candidate("Voter", createAnswers(questions, voterAnswer));

    const manhattan = new MatchingAlgorithmBase({
        distanceMetric: DistanceMetric.Manhattan,
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    });

    const directional = new MatchingAlgorithmBase({
        distanceMetric: DistanceMetric.Directional,
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    });

    const manhattanMatches = manhattan.match(voter, candidates);
    const directionalMatches = directional.match(voter, candidates);

    let output = `Voter answer: ${voterAnswer}\n\n`;
    for (let i = 0; i < candidates.length; i++) {
        output += `${manhattanMatches[i].entity}: Manh: ${manhattanMatches[i]} • Dir: ${directionalMatches[i]}\n`;
    }

    console.log(output);
}


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