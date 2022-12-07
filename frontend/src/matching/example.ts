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


function main(): void {
    const numCandidates = 10;
    const numQuestions = 10;
    const likertScale = 5;

    const questions = Array(numQuestions).map(() => MultipleChoiceQuestion.fromLikertScale(likertScale));

    const candidates = Array(numCandidates).map(i => new Candidate(`Candidate ${i}`, createAnswers(questions, (i % likertScale) + 1)));

    const voter = new Candidate("Voter", createAnswers(questions, 3));

    const algorithm = new MatchingAlgorithmBase({
        distanceMetric: DistanceMetric.Manhattan,
        missingValueMethod: MissingValueDistanceMethod.RelativeMaximum
    });

    const matches = algorithm.match(voter, candidates);

    let output = "";
    for (const match of matches) {
        output += `${match.entity}: ${match}\n`;
    }

    console.log(output);
}


function createAnswers(questions: MatchableQuestion[], answerValue: number):  MatchableAnswer[] {
    return questions.map(o => ({question: o, value: answerValue}));
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