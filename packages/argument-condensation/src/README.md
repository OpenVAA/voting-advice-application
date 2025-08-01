# Argument Condensation

## Problem Description

There are valuable insights embedded in VAA comments given by candidates (or other entities like parties) but it's costly to go through the comments to extract these insights manually. It would be helpful for the user if they could get summary of what kind of opinions candidates have about a given topic.

## Solution

This package is designed to automate opinion extraction from comments in the VAA context. Namely, it extracts arguments used to argue for or against a given political topic. This is done with large language models (LLMs), which are instructed to detect and condense candidate views into pros and cons. Pros and cons are extracted using separate prompts as LLMs perform best when given as narrow a task as possible.

## Example

Topic: "The capital tax should be increased."

Input Comments:

- "Raising taxes lowers incentives to work hard and contribute to the overall economy"
- "Raising taxes secures affordable healthcare services to support everyone's wellbeing"
  etc.

Run 1: Find Cons

- Con 1 = "Raising taxes can be detrimental for motivation to work, decreasing the overall economy"
- Con 2 = ...

Run 2: Find Pros

- Pro 1 = "Tax revenue supports healthcare service providers that are crucial for people's wellbeing"

NOTE: The output arguments are never a word-for-word match to any of the source comments. Output arguments are usually more abstract and a tad clunky in their formulation, as the LLM's writing style is not as engaging and fluent as what humans can produce. They are, however, very informative and easy to understand.

## Usage

### Run Condensation

You need to use the OpenVAA-native data types as input:

OPTION 1: Direct Condenser usage (not recommended - see OPTION 2: Package API Usage):

```typescript
// 1. Define the question. See `src/core/types/base/supportedQuestion.ts` for supported types.
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
        iterationPrompt: 'Improve these arguments',
        condensationPromptId: 'map_categoricalPros_condensation_v1',
        iterationPromptId: 'map_categoricalPros_iterate_v1'
      }
    },
    {
      operation: 'reduce',
      params: {
        denominator: 5,
        coalescingPrompt: 'Remove overlap between these argument lists and output one coalesced list',
        coalescingPromptId: 'reduce_categoricalPros_coalescing_v1'
      }
    }
  ],
  llmModel: 'gpt-4o',
  modelTPMLimit: 30000,
  runId: 'run-456',
  createVisualizationData: true
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
  modelTPMLimit: 30000,
  runId: 'some-run-id',
  maxCommentsPerGroup: 1000,
  invertProsAndCons: false
});
```

Note: It may seem a bit confusing that the map operation isn't a traditional map but instead it is currently coupled with an extra iteration step, iterateMap. This shouldn't pose issues if the usage of the system isn't greatly altered from the original use case.

The reasoning for the extra step was to make sure that information gathered from the source data is maximized before moving onto processing generated arguments.

### Visualization

Running the condensation automatically saves a so-called operation tree that contains the necessary
data to visualize the process and its the inputs and outputs in each sub-step. To see the visualization run this:

```bash
npm run dev:vis # uses the package 'serve'
```

UI will prompt you to download an operation tree. You can find one in src/data/operationTrees.

If you have run your own condensation process before, it will also be available in this directory for visualization.

The visualization includes inputs and outputs of each prompt. These are shown when you press on a node of the tree structure. The prompts themselves are not shown in the UI. Please consult condensation/prompts/your-language-code/the-operation-you-want-to-check/ to see the prompts used.

If you wish to use your own prompt but do not want to delete the old prompts, please create a new .yaml file in the same directory as the other prompts and change the prompt ids to use in main.ts's runSingleCondensation method. The prompt registry will find your prompts automatically if they are in the correct directory and the 'promptId' is set correctly.

## Package Structure

- `main.ts`: Contains outward-facing API function `handleQuestion`. This is where you should start your investigation of the system.
- `/core`: Contains the condensation logic. Many subtasks are delegated to utils/
  - `/condensation`: The `Condenser` class and other core logic for running the condensation process. Good place to dive deeper into the implementation details. Sub-dir prompts has the prompts used in condensation operations. Add your own prompts as needed, either to provide language support or to simply get more control of the LLM instructions.
  - `/types`: All TypeScript type definitions used in the package.
  - `/utils`: Utility functions, e.g., for comment processing. Some utility functions perform crucial operations whose logic is neatly abstracted from the callers, e.g. finding the comments to use for pro and con extraction based on whether the associated likert answer is high-end (e.g. 5 = pro comment) or low-end (e.g. 2 = con comment).
- `/data`: For clarity, operationTrees are under src/data/.
  - `/operationTrees`: JSON files for visualizing the condensation process are saved here. An operation tree is created automatically and there exists no flag to turn off automatic creation.

## Data Structures

The most important data structures you need to know about are:

- `SupportedQuestion`: Type of the questions you can condense arguments for in the OpenVAA repo. It's a subset of the question types from `@openvaa/data`.
- `HasAnswers`: A generic entity (like a candidate or party) that has answers and some freely drafted texts regarding a particular quesetion. A condensation run doesn't need anything else than VAA answers with non-empty accompanied texts. Every HasAnswers entity has answers but may not have non-empty comments on why they answered as they did.
- `CondensationRunInput`: Configuration for the condensation process. See types/condensation/condensationInput.ts.
- `CondensationRunResult`: The final output. It contains the list of condensed arguments, metadata about the run, and the original comments that were processed. See types/condensation/condensationResult.ts.
- `Argument`: A single condensed argument, including its text and an ID. Note that the ID is currently without much purpose other than being a placeholder. They are a mandatory field in the Argument type, because it keeps the Argument abstraction clean and ready to handle ids without needing to change it. Currently, LLM generates mock ids for the 'id' field, so we can simply parse the arguments with a single parsing contract instead of having different contracts for id-free and id-able arguments.

## Adding Language Support

1. Go to src/core/condensation/prompts/
2. Add a new directory for your own language
3. Create directories for the operations you will be using for condensation
   (a) If you are happy with MAP-REDUCE (the industry standard for summarization), you only need to set prompts in the directories MAP, ITERATE_MAP and REDUCE - like has been done for language codes 'en' and 'fi'
   (b) If you do wish to use some other operations than MAP-REDUCE (not recommended), please modify the utility function createCondensationSteps to plans that are more customized. The most sustainable and logical solution is of course more nuanced: To validate create and validate the condensation steps outside the package. For now, however, this package is designed to simply do everything internally, so that is left TODO. For now we wish to simply provide a out-the-box package where the user doesn't have to configure anything. 
4. Create directories for the the question types you will be handling. If you are handling categorical questions, you need to create only one directory "categoricalPros". If you are handling boolean or likert questions, please create separate directories for likertPros, likertCons, booleanCons and booleanPros. 
5. Add your prompts to .yaml files in their respective directories. Mandatory fields for the yamls are: 'promptId' and 'promptText'. Please respect these exact field names. 
6. Please use the syntax {{variable}} for variables as the tests and the prompt embedding functions look for this exact pattern. 
7. Use the exact same embedding variable names: 'topic', 'arguments' and 'comments'. These are standardized across the argument condensation package. 
8. Configure the promptIds you want to use. PromptIds are passed in to the condensation process the 'prompts' variable of the API. 
9. Condense! 

## Environment

Set `LLM_OPENAI_API_KEY` in root `.env` file.
