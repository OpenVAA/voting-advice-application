import { condenseArguments } from './core/condenseArguments';
import { CondensationRunInput } from './core/types/condensationInput';
import { CONDENSATION_METHOD } from './core/types/condensationMethod';
import { CONDENSATION_TYPE } from './core/types/condensationType';

const input: CondensationRunInput = {
  runId: 'run-001',
  electionId: 'election1',
  question: {
    id: 'q1',
    topic: 'Should taxes be raised?',
    answerType: CONDENSATION_TYPE.LIKERT.PROS,
  },
  comments: [
    { id: 'c1', candidateID: 'cand1', candidateAnswer: 5, text: 'I support this.' },
    { id: 'c2', candidateID: 'cand2', candidateAnswer: 1, text: 'I oppose this.' },
  ],
  config: {
    batchSize: 10,
    nOutputArgs: 3,
    language: 'en',
    condensationType: CONDENSATION_TYPE.LIKERT.PROS,
    initialCondensationPrompt: { promptId: 'init-v1', promptText: '...', condensationOutputType: CONDENSATION_TYPE.LIKERT.PROS, condensationMethod: CONDENSATION_METHOD.SEQUENTIAL },
    mainCondensationPrompt: { promptId: 'main-v1', promptText: '...', condensationOutputType: CONDENSATION_TYPE.LIKERT.PROS, condensationMethod: CONDENSATION_METHOD.SEQUENTIAL },
    argumentImprovementPrompt: { promptId: 'improve-v1', promptText: '...', condensationOutputType: CONDENSATION_TYPE.LIKERT.PROS, condensationMethod: CONDENSATION_METHOD.SEQUENTIAL },
  }
};

(async () => {
  await condenseArguments(input);
})();