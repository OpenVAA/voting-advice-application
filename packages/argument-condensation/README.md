# Argument Condensation

## Problem Description

There are valuable insights embedded in VAA comments given by candidates (or other entities like parties) but it's costly to go through the comments to extract these insights manually. It would be helpful for the user if they could get summary of what kind of opinions candidates have about a given topic.

## Solution

This package is designed to automate opinion extraction from comments in the VAA context. Namely, it extracts arguments used to argue for or against a given political topic. This is done with large language models (LLMs), which are instructed to detect and condense candidate views into pros and cons. Pros and cons are extracted using separate prompts as LLMs perform best when given as narrow a task as possible.

The main pipeline uses map-reduce, although you can configure your own pipelines with e.g. refine. For the basic idea of how the condensation runs by default, see [`docs/operations/map-reduce.png`](docs/operations/map-reduce.png). Googling map-reduce also works wonders as it is an industry standard for summarization tasks.

## Dependencies

- `@openvaa/data`: Definitions for VAA data types. Especially entities with answers used in getting data for the condensation process. Shared between this and other vaa modules.
- `@openvaa/core`: Definitions for Controller type and questions. Also includes default implementation for Controller.
- `@openvaa/llm-refactor`: LLM provider class built on Vercel AI SDK. Handles LLM interactions with cost tracking and validation retries.
- `js-yaml`: YAML parsing for reading prompt configuration files.

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

### Configuration

In addition to the configuration options passed in as params, there are package-wide consts stored in [`src/defaultValues.ts`](src/defaultValues.ts). Please modify as needed.

### Run Condensation

The inputs to the condensation function are based on types defined in `@openvaa/core`, `@openvaa/data` and of course in the argument condensation package.

For information about the main condenser class and its configuration options, most importantly the different operations (map, refine, etc.) it supports, see [`docs/condenser.md`](docs/condenser.md)

#### Package API Usage

This is the recommended way to use the package, as it abstracts away the details of comment grouping and prompt selection.

```typescript
import { handleQuestion } from '@openvaa/argument-condensation';
import { BooleanQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { LLMProvider } from '@openvaa/llm-refactor';
import type { HasAnswers } from '@openvaa/core';

// 1. Set up your question, entities, and LLM provider
// You'll most likely get the question from the DataRoot
const question = new BooleanQuestion({
  data: {
    id: 'q1',
    type: QUESTION_TYPE.Boolean,
    name: 'Renewable Energy Funding',
    customData: {},
    categoryId: 'cat1'
  },
  root: dataRoot // Your DataRoot instance
});

const entities: Array<HasAnswers> = [
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

// Configure LLM provider with model and TPM limit
const llmProvider = new LLMProvider({
  provider: 'openai',
  apiKey: '...',
  modelConfig: { primary: 'gpt-4o', tpmLimit: 30000 }
});

// 2. Call handleQuestion with the setup
const results = await handleQuestion({
  question,
  entities,
  options: {
    llmProvider,
    language: 'en',
    runId: 'some-run-id',
    maxCommentsPerGroup: 1000,
    invertProsAndCons: false,
    prompts: {}
    // Optional controller
  }
});
```

#### Direct Condenser Usage

Not recommended - see Package API Usage above for the preferred approach.

If you want to configure comment grouping and prompt selection, please consult [`main.ts`](src/main.ts).

```typescript
import { Condenser } from '@openvaa/argument-condensation';
import { SingleChoiceCategoricalQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { OpenAIProvider } from '@openvaa/llm';
import type { CondensationRunInput } from '@openvaa/argument-condensation';

// 1. Define the question. See src/core/types/base/supportedQuestion.ts for supported types.
const question = new SingleChoiceCategoricalQuestion({
  data: {
    id: 'q2',
    type: QUESTION_TYPE.SingleChoiceCategorical,
    name: 'Public Transport Improvement',
    customData: {},
    categoryId: 'cat1',
    choices: [
      { id: 'choice1', customData: {} },
      { id: 'choice2', customData: {} },
      { id: 'choice3', customData: {} }
    ]
  },
  root: dataRoot // Your DataRoot instance with choice texts
});

// 2. Provide comments from VAA. Usually these would be for a specific group,
// e.g. pros for a category, which you would get from the `getComments` utility.
const comments = [
  { id: 'c1', entityId: 'cand1', entityAnswer: 'choice1', text: 'New subways are essential for a growing city.' },
  { id: 'c2', entityId: 'cand2', entityAnswer: 'choice2', text: 'Buses are more flexible and cheaper to expand.' }
];

// 3. Configure condensation options
// Note: by default, we use only map-reduce prompts, which are configured in main.ts's function 'runSingleCondensation'.
// For flexibility which prompts and operation to use, see 'runSingleCondensation' (e.g. if you want to use refine instead).

const llmProvider = new LLMProvider({
  provider: 'openai',
  apiKey: 'sk-proj-42',
  modelConfig: { primary: 'gpt-4o', tpmLimit: 30000 }
});

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
        condensationPromptId: 'promptId'
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
  runId: 'run-456',
  createVisualizationData: true
  // Optional controller from OpenVAA/core/src/controller
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

Currently, we automatically run MAP --> ITERATE_MAP --> REDUCE (k times as needed to reduce to 1 list). The reasoning for the extra iteration step is to make sure that information gathered from the source data is maximized before moving onto processing generated arguments. To change to a custom plan, please see [`core/utils/condensation/defineCondensationPlan.ts`](src/core/utils/condensation/defineCondensationPlan.ts)

### Visualization

Running the condensation automatically saves a so-called operation tree that contains the necessary
data to visualize the process and its the inputs and outputs in each sub-step. To see the visualization run this:

```bash
npm run dev:vis # uses the package 'serve'
```

UI will prompt you to download an operation tree. You can find one in [`data/operationTrees/`](data/operationTrees/).

If you have run your own condensation process before, it will also be available in this directory for visualization.

The visualization includes inputs and outputs of each prompt. These are shown when you press on a node of the tree structure. The prompts themselves are not shown in the UI. Please consult condensation/prompts/your-language-code/the-operation-you-want-to-check/ to see the prompts used.

If you wish to use your own prompt but do not want to delete the old prompts, please create a new .yaml file in the same directory as the other prompts and change the prompt ids to use in main.ts's runSingleCondensation method. The prompt registry will find your prompts automatically if they are in the correct directory and the 'promptId' is set correctly.

The visualization doesn't include exact latency per LLM call, rather per operation (e.g. MAP took 32 seconds, ITERATE_MAP 15 seconds, etc.).

Also, if you want to see the exact prompts and outputs in each prompt call, you will need to extend the UI. Find the relevant code in [`tools/visualization/`](tools/visualization/) and [`src/core/utils/operationTrees/operationTreeBuilder.ts`](src/core/utils/operationTrees/operationTreeBuilder.ts).

## Package Structure

- [`src/main.ts`](src/main.ts): Contains outward-facing API function `handleQuestion`. This is where you should start your investigation of the system.
- `src/core`: Contains the condensation logic. Many subtasks are delegated to utils/
  - `/condensation`: The `Condenser` class and other core logic for running the condensation process. Good place to dive deeper into the implementation details. Sub-dir prompts has the prompts used in condensation operations. Add your own prompts as needed, either to provide language support or to simply get more control of the LLM instructions.
  - `/types`: All TypeScript type definitions used in the package.
  - `/utils`: Utility functions, e.g., for comment processing. Some utility functions perform crucial operations whose logic is neatly abstracted from the callers, e.g. finding the comments to use for pro and con extraction based on whether the associated likert answer is high-end (e.g. 5 = pro comment) or low-end (e.g. 2 = con comment).
- `data`: For clarity, operationTrees are under src/data/.
  - `/operationTrees`: JSON files for visualizing the condensation process are saved here.

## Data Structures

The most important data structures you need to know about are:

- `SupportedQuestion`: Type of the questions you can condense arguments for in the OpenVAA repo. It's a subset of the question types from `@openvaa/data`. For more info, see [`@openvaa/data/objects/questions/base/question.ts`](@openvaa/data/objects/questions/base/question.ts).
- `HasAnswers`: A generic entity (like a candidate or party) that has answers and some freely drafted texts regarding a particular quesetion. A condensation run doesn't need anything else than VAA answers with non-empty accompanied texts. Every HasAnswers entity has answers but may not have non-empty comments on why they answered as they did. Defined in [`@openvaa/core/src/matching/hasAnswers.type.ts`](@openvaa/core/src/matching/hasAnswers.type.ts).
- `CondensationRunInput`: Configuration for the condensation process. See [`src/core/types/condensation/condensationInput.ts`](src/core/types/condensation/condensationInput.ts).
- `CondensationRunResult`: The final output. It contains the list of condensed arguments, metadata about the run, and the original comments that were processed. See [`src/core/types/condensation/condensationResult.ts`](src/core/types/condensation/condensationResult.ts).
- `Argument`: A single condensed argument, including its text and an ID. Note that the ID is currently without much purpose other than being a placeholder. They are a mandatory field in the Argument type, because it keeps the Argument abstraction clean and ready to handle ids without needing to change it. Currently, LLM generates mock ids for the 'id' field, so we can simply parse the arguments with a single parsing contract instead of having different contracts for id-free and id-able arguments. See [`src/core/types/base/argument.ts`](src/core/types/base/argument.ts).

## Adding Language Support

1. Go to [`src/core/condensation/prompts/`](src/core/condensation/prompts/)
2. Add a new directory for your own language
3. Create directories for the operations you will be using for condensation
   (a) If you are happy with map-reduce (the industry standard for summarization), you only need to set prompts in the directories MAP, ITERATE_MAP and REDUCE - like has been done for language codes 'en' and 'fi'
   (b) If you do wish to use some other operations than map-reduce (not recommended), please modify the utility function createCondensationSteps to plans that are more customized. The most sustainable and logical solution is of course more nuanced: To validate create and validate the condensation steps outside the package. For now, however, this package is designed to simply do everything internally, so that is left TODO. For now we wish to simply provide a out-the-box package where the user doesn't have to configure anything.
4. Create directories for the the question types you will be handling. If you are handling categorical questions, you need to create only one directory "categoricalPros". If you are handling boolean or likert questions, please create separate directories for likertPros, likertCons, booleanCons and booleanPros.
5. Add your prompts to .yaml files in their respective directories. Mandatory fields for the yamls are: 'promptId' and 'promptText'. Please respect these exact field names.
6. Please use the syntax {{variable}} for variables as the tests and the prompt embedding functions look for this exact pattern.
7. Use the exact same embedding variable names: 'topic', 'arguments' and 'comments'. These are standardized across the argument condensation package.
8. Configure the promptIds you want to use. PromptIds are passed in to the condensation process the 'prompts' variable of the API.
9. Condense!

## Improvements

One major improvement that can be made in the future is creating a condenser that is usable in not only argument condensation but across all (or a wider subset) of summarization tasks. This way you could e.g. summarize political manifestos, search for an answer to a question from a large corpus of texts (could be used e.g. for fact-checking the condensed arguments or looking up more info on them), etc. The possibilities are obviously very broad.

Do consider whether the added abstraction brings about a needless layer of complexity. Creating an abstract class and creating implementations of it could make more sense as e.g. a TextCondenser could do a plethora of tasks even though it duplicates some code. Thus, it is likely overly caucious to worry about an exponential explosion of condenser implementation or code duplication. Either way, see suggestions here for an abstract and can-do-almost-everything condenser rewrite: [`docs/extending-the-condenser.md`](docs/extending-the-condenser.md).
