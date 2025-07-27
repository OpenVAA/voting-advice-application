# Argument Condensation

## Environment

Set `LLM_OPENAI_API_KEY` in root `.env` file.

## Usage

### Run Condensation

You need to use the OpenVAA-native data types as input:

OPTION 1: Direct Condenser usage (not recommended - see OPTION 2: Package API Usage):

```typescript
// 1. Define the question. See `new_src/core/types/base/supportedQuestion.ts` for supported types.
const question = {
  id: 'q2',
  type: 'single-choice-categorical',
  text: { en: 'What is the best way to improve public transport?' },
  choices: [
    { id: 'choice1', text: { en: 'Invest in new subway lines' } },
    { id: 'choice2', text: { en: 'Increase bus frequency' } },
    { id: 'choice3', text: { en: 'Introduce more bike lanes' } }
  ]
};

// 2. Provide comments from VAA. Usually these would be for a specific group,
// e.g. pros for a category, which you would get from the `getComments` utility.
const comments = [
  { id: 'c1', candidateID: 'cand1', candidateAnswer: 'choice1', text: 'New subways are essential for a growing city.' },
  { id: 'c2', candidateID: 'cand2', candidateAnswer: 'choice2', text: 'Buses are more flexible and cheaper to expand.' }
];

// 3. Configure condensation options
// Note: by default, we use only map-reduce prompts, which are configured in main.ts's function 'runSingleCondensation'.
// For flexibility which prompts and operation to use, see the abovementioned function (e.g. if you want to use refine instead).

const llmProvider = new OpenAIProvider({ apiKey: 'sk-proj-42' });
const options = {
  llmProvider, // An instance of an LLMProvider
  language: 'en',
  outputType: 'categoricalPros',
  processingSteps: [
    {
      operation: 'map',
      params: {
        batchSize: 20,
        condensationPrompt: 'Find arguments from these comments',
        iterationPrompt: 'Improve these arguments'
      }
    },
    {
      operation: 'reduce',
      params: {
        denominator: 5,
        coalescingPrompt: 'Remove overlap between these argument lists and output one coalesced list'
      }
    }
  ],
  llmModel: 'gpt-4o',
  runId: 'run-456'
};

// 4. Combine into condensation input
const input: CondensationRunInput = {
  question, // type SupportedQuestion
  comments,
  options
};

const condenser = new Condenser(input);
const output = await condenser.run(); // the arguments with metadata and other jazz
```

OPTION 2: Package API Usage:

This is the recommended way to use the package, as it abstracts away the details of comment grouping and prompt selection.
If you want to configure comment grouping and prompt selection, please consult core/main.ts.

```typescript
// 1. Set up your question, entities, and LLM provider
const question = {
  id: 'q1',
  type: 'boolean',
  text: {
    en: 'Should the government increase funding for renewable energy?'
  }
};

const entities = [
  {
    id: 'c1',
    answers: { q1: { value: true, comment: 'Absolutely, it is crucial for the future of our planet.' } }
  },
  {
    id: 'c2',
    answers: {
      q1: { value: false, comment: 'No, we should prioritize economic growth and traditional energy sectors.' }
    }
  },
  {
    id: 'c3',
    answers: { q1: { value: true, comment: 'Yes, and we should also invest in job training for green energy fields.' } }
  }
];

const llmProvider = new OpenAIProvider({ apiKey: '...' });

// 2. Call handleQuestion with the setup
const results = await handleQuestion({
  question, // as SupportedQuestion
  entities, // as Array<HasAnswers>
  llmProvider,
  language: 'en',
  llmModel: 'gpt-4o',
  runId: 'some-run-id',
  maxCommentsPerGroup: 1000,
  invertProsAndCons: false
});
```

Note: It may seem a bit confusing that the map operation isn't a traditional map but instead it is currently coupled with an extra 
iteration step, iterateMap. Naturally this shouldn't pose issues if the usage of the system isn't greatly altered from the original use 
case. The reasoning for the extra step was to make sure that information gathered from the source data is maximized before moving onto 
processing generated arguments.

### Visualization

Running the condensation automatically saves a so-called operation tree that contains the necessary
data to visualize the process and its the inputs and outputs in each sub-step. To see the visualization run this:

```bash
npm run dev:vis # accept the 'serve' download so the UI server can be hosted
```

UI will prompt you to download an operation tree. You can find one in src/data/operationTrees.

If you have run your own condensation process, it will also be available in this directory for visualization.

The visualization includes inputs and outputs of each prompt. These are shown when you press on a node of the tree structure.
