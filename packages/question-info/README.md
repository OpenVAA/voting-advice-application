# Question Info

Generate contextual information for VAA questions using LLMs.

## Problem Description

VAA questions often contain complex political concepts and terminology that may not be familiar to all voters. This package automatically generates helpful contextual information including term definitions and informational sections to help voters better understand the questions.

## Solution

This package uses large language models to generate two types of contextual information:

- **Term definitions**: Clear explanations of key concepts and terminology in the question itself
- **Info sections**: Background information and context about the topic

## Dependencies

- `@openvaa/data`: VAA data types and question definitions
- `@openvaa/core`: Controller and base types
- `@openvaa/llm`: LLM provider interface and implementations
- `@openvaa/app-shared`: Shared types for term definitions and info sections
- `js-yaml`: YAML parsing for prompt configuration

## Usage

### Basic Example

```typescript
import { generateQuestionInfo, QUESTION_INFO_OPERATION } from '@openvaa/question-info';
import { OpenAIProvider } from '@openvaa/llm';

const questions = [{ id: 'q1', name: 'Should the capital gains tax be increased?' }];

const results = await generateQuestionInfo({
  questions,
  options: {
    operations: [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections],
    language: 'en',
    llmProvider: new OpenAIProvider({ apiKey: 'sk-...' }),
    llmModel: 'gpt-4o',
    questionContext: 'Finnish municipal elections 2025'
  }
});

console.log(results[0].data.terms); // Generated term definitions
console.log(results[0].data.infoSections); // Generated info sections
```

### Generate Only Terms

```typescript
const results = await generateQuestionInfo({
  questions,
  options: {
    operations: [QUESTION_INFO_OPERATION.Terms],
    language: 'en',
    llmProvider: new OpenAIProvider({ apiKey: 'sk-...' }),
    llmModel: 'gpt-4o'
  }
});
```

### Generate Only Info Sections

```typescript
const results = await generateQuestionInfo({
  questions,
  options: {
    operations: [QUESTION_INFO_OPERATION.InfoSections],
    language: 'en',
    llmProvider: new OpenAIProvider({ apiKey: 'sk-...' }),
    llmModel: 'gpt-4o',
    sectionTopics: ['Background', 'Current situation', 'Key stakeholders']
  }
});
```

## API Reference

### Main Function

- [`generateQuestionInfo`](src/api.ts): Generate question info for multiple questions in parallel

### Types

- [`QuestionInfoOptions`](src/types/generationOptions.ts): Configuration options for generation
- [`QuestionInfoResult`](src/types/generationResult.ts): Result format with generated info and metadata
- [`QUESTION_INFO_OPERATION`](src/types/generationOptions.ts): Available operations (Terms, InfoSections)

### Utilities

- [`determinePromptKey`](src/utils/determinePrompt.ts): Select appropriate prompt based on operations
- [`createDynamicResponseContract`](src/utils/schemaGenerator.ts): Create validation schema for LLM responses
- [`transformResponse`](src/utils/responseTransformer.ts): Transform LLM responses to result format

## Configuration

### Language Support

See [`SUPPORTED_QINFO_LANG`](src/consts.ts) for available languages.

### Custom Section Topics

Override default section topics:

```typescript
const options = {
  operations: [QUESTION_INFO_OPERATION.InfoSections],
  sectionTopics: ['Historical context', 'Economic implications', 'International comparison']
};
```

### Custom Instructions

Add domain-specific guidance:

```typescript
const options = {
  operations: [QUESTION_INFO_OPERATION.Terms],
  customInstructions: 'Focus on local governance and municipal policy aspects',
  questionContext: 'Finnish municipal elections 2025'
};
```

## Package Structure

- [`src/api.ts`](src/api.ts): Main public API
- [`src/core/`](src/core/): Core generation logic
- [`src/types/`](src/types/): TypeScript type definitions
- [`src/utils/`](src/utils/): Utility functions for prompt handling and response processing
- [`src/prompts/`](src/prompts/): Language-specific prompt templates
- [`src/consts.ts`](src/consts.ts): Package constants and configuration

## Adding Language Support

1. Create directory in [`src/prompts/`](src/prompts/) with your language code
2. Add prompt templates: `generateTerms.yaml`, `generateInfoSections.yaml`, `generateBoth.yaml`
3. Add `instructions.yaml` with generation guidelines
4. Add example files in the same directory
5. Update [`SUPPORTED_QINFO_LANG`](src/consts.ts) to include your language

See existing English prompts in [`src/prompts/en/`](src/prompts/en/) for reference.
