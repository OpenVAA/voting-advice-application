# Question Info

VAA questions often contain terminology that is not be familiar to all voters.

To mitigate this issue, LLMs can generate:

- **Term definitions**: Clear explanations of key concepts and terminology in the question itself
- **Info sections**: Background information and context about the topic

This information is then shown to the user next to the question to help clarify the context.

## Package Structure

- [`src/api.ts`](src/api.ts): Main public API
- [`src/core/`](src/core/): Core generation logic
- [`src/utils/`](src/utils/): Utility functions for prompt handling and response processing
- [`src/prompts/`](src/prompts/): Language-specific prompt templates
- [`src/consts.ts`](src/consts.ts): Package constants and configuration

## Usage

### Basic Example

### Generate Both

```typescript
import { LLMProvider } from '@openvaa/llm';
import { generateQuestionInfo, QUESTION_INFO_OPERATION } from '@openvaa/question-info';

// Initialize the LLM provider
const llmProvider = new LLMProvider({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  modelConfig: {
    primary: 'gpt-4o',
    fallback: 'gpt-4o-mini'
  }
});

// Generate both terms and info sections
const results = await generateQuestionInfo({
  questions,
  options: {
    operations: [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections],
    language: 'en',
    llmProvider,
    runId: 'generation-run-1'
  }
});
```

### Generate Only Terms

```typescript
const results = await generateQuestionInfo({
  questions,
  options: {
    operations: [QUESTION_INFO_OPERATION.Terms],
    language: 'en',
    llmProvider,
    runId: 'generation-run-1'
  }
});
```

## API Reference

### Main Function

- [`generateQuestionInfo`](src/api.ts): Generate question info for multiple questions in parallel

### Utilities

- [`determinePromptKey`](src/utils/determinePrompt.ts): Choose prompt based on the output being asked for
- [`createDynamicResponseContract`](src/utils/schemaGenerator.ts): Create validation schema for LLM response format
- [`transformResponse`](src/utils/responseTransformer.ts): Transform LLM responses to package result type

## Configuration

### Output Customization

```typescript
const options = {
  runId,
  operations: [QUESTION_INFO_OPERATION.InfoSections],
  language: 'en',
  llmProvider, // A class instance for making LLM calls
  sectionTopics: ['Historical context', 'Economic implications', 'International comparison']
  customInstructions: 'Focus on local governance and municipal policy aspects',
  questionContext: 'Finnish municipal elections 2025'
};
```

## Prompting

See existing English prompts in [`src/prompts/en/`](src/prompts/en/) for reference. Adhere to .yaml structure when making changes.

### Adding Language Support

#### Option 1: Doing nothing (almost)

Question info is an automatically localized feature. If you want output in Swahili, simply make sure it is one of the app's supported languages. For how this works, see the [`../llm/src/prompts/promptRegistry.ts`](../llm/src/prompts/promptRegistry.ts) loadPrompt() function.

#### Option 2: Advanced

Only relevant if you want to make sure you are always using a native prompt instead of automatic localization:

1. Create directory in [`src/prompts/`](src/prompts/) with your language code
2. Add prompt templates: `generateTerms.yaml`, `generateInfoSections.yaml`, `generateBoth.yaml`
3. Add `instructions.yaml` with generation guidelines
4. Add example files in the same directory
5. Update [`SUPPORTED_QINFO_LANG`](src/consts.ts) to include your language
