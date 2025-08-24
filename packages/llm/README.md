# `@openvaa/llm`: LLM Integration for OpenVAA

This package provides a robust and extensible interface for integrating Large Language Models (LLMs) into the OpenVAA platform. It offers a unified API for different LLM providers with built-in retry logic, response validation, cost tracking, and parallel processing capabilities.

## Features

- **Abstract Provider Interface**: Consistent API across different LLM providers
- **Built-in OpenAI Provider**: Full OpenAI API integration with all models
- **Response Validation**: Type-safe response parsing with retry logic
- **Parallel Processing**: Efficient batch processing with configurable concurrency
- **Cost Tracking**: Built-in token usage and cost calculation
- **Retry Logic**: Automatic retry with exponential backoff for network errors
- **Rate Limiting**: Intelligent handling of rate limit errors
- **Latency Tracking**: Performance monitoring for LLM calls

## Dependencies

- `openai`: Official OpenAI SDK for API communication
- `@openvaa/core`: Core types and utilities shared across OpenVAA modules
- `jsonrepair`: For safer JSON parsing

## Quick Start

### Basic Usage

```typescript
import { OpenAIProvider, Message, Role } from '@openvaa/llm';

// Create an OpenAI provider instance. The constructor variable 'model' is the fallback model,
// which is used only if function calls do not contain a model parameter (or if the model in
// the function call fails for some reason).
const llm = new OpenAIProvider({
  apiKey: 'your-openai-api-key', // Required. Set in repo's root .env
  model: 'gpt-4o', // Optional, defaults to 'gpt-4o'
  maxContextTokens: 4096 // Optional, defaults to 4096
});

// Generate a simple response
const response = await llm.generate({
  messages: [
    new Message({ role: Role.SYSTEM, content: 'You are a helpful assistant' }),
    new Message({ role: Role.USER, content: 'Hello! How are you today?' })
  ],
  temperature: 0.7,
  maxTokens: 100
});

console.log(response.content);
console.log('Token usage:', response.usage);
```

### With Retry Logic

```typescript
// Use generateWithRetry for automatic error handling. Handles API errors like timeouts gracefully.
const response = await llm.generateWithRetry({
  messages: [new Message({ role: Role.USER, content: 'Explain quantum computing in simple terms' })],
  temperature: 0.3,
  maxTokens: 200,
  maxAttempts: 3 // Optional, defaults to 3
});
```

### Response Validation

```typescript
// Define a response contract for type-safe parsing
interface UserProfile {
  name: string;
  age: number;
  interests: string[];
}

const responseContract = {
  validate: (obj: unknown): obj is UserProfile => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'name' in obj &&
      'age' in obj &&
      'interests' in obj &&
      typeof obj.name === 'string' &&
      typeof obj.age === 'number' &&
      Array.isArray(obj.interests)
    );
  }
};

// Generate and validate response
const result = await llm.generateAndValidateWithRetry({
  messages: [
    new Message({
      role: Role.USER,
      content: 'Create a user profile with name, age, and interests. Respond with valid JSON.'
    })
  ],
  responseContract,
  temperature: 0.1,
  maxTokens: 150,
  validationAttempts: 3
});

// result.parsed is now typed as UserProfile
console.log(result.parsed.name); // Type-safe access
console.log(result.raw.content); // Original response

// For manual parsing with error handling, you can also use LlmParser directly:
import { LlmParser, ValidationError } from '@openvaa/llm';

try {
  const parsed = LlmParser.parse(response.content, responseContract);
  console.log('Validated user profile:', parsed);
} catch (error) {
  if (isValidationError(error)) {
    console.error('Validation failed:', error.message);
    console.error('Raw response:', error.unparsedText);
  }
}
```

### Parallel Processing

```typescript
// Process multiple requests in parallel
const inputs = [
  {
    messages: [new Message({ role: Role.USER, content: 'What is AI?' })],
    temperature: 0.7,
    maxTokens: 100
  },
  {
    messages: [new Message({ role: Role.USER, content: 'What is machine learning?' })],
    temperature: 0.7,
    maxTokens: 100
  },
  {
    messages: [new Message({ role: Role.USER, content: 'What is deep learning?' })],
    temperature: 0.7,
    maxTokens: 100
  }
];

// Overloaded method. Used here without output structure validation & parsing.
// Requires a responseContract parameter to return a validated object
const responses = await llm.generateMultipleParallel({
  inputs,
  parallelBatches: 3 // Optional, defaults to 3
});

responses.forEach((response, index) => {
  console.log(`Response ${index + 1}:`, response.content);
});
```

### Parallel Processing with Validation

```typescript
interface Summary {
  keyPoints: string[];
  conclusion: string;
}

const summaryContract = {
  validate: (obj: unknown): obj is Summary => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'keyPoints' in obj &&
      'conclusion' in obj &&
      Array.isArray(obj.keyPoints) &&
      typeof obj.conclusion === 'string'
    );
  }
};

const validatedResponses = await llm.generateMultipleParallel({
  inputs: [
    {
      messages: [new Message({ role: Role.USER, content: 'Summarize the benefits of renewable energy' })],
      temperature: 0.3,
      maxTokens: 150
    },
    {
      messages: [new Message({ role: Role.USER, content: 'Summarize the challenges of renewable energy' })],
      temperature: 0.3,
      maxTokens: 150
    }
  ],
  responseContract: summaryContract,
  parallelBatches: 2,
  validationAttempts: 2
});

// Each response is now typed as ParsedLLMResponse<Summary>
validatedResponses.forEach((response, index) => {
  console.log(`Summary ${index + 1} key points:`, response.parsed.keyPoints);
  console.log(`Summary ${index + 1} conclusion:`, response.parsed.conclusion);
});
```

## Data Structures and Utilities

### Core Data Structures

The LLM package is built around several key data structures that provide type safety and consistency across different providers.

#### Message and Role System

```typescript
class Message {
  role: Role;
  content: string;

  constructor({ role, content }: { role: Role; content: string });
}

type Role = 'system' | 'user' | 'assistant' | 'developer';
```

Messages represent individual interactions in a conversation. The `Role` type defines who is speaking:

- `system`: Instructions or context for the LLM
- `user`: Input from the user
- `assistant`: Responses from the LLM
- `developer`: Special role for debugging or development purposes

#### Response Types

```typescript
interface LLMResponse {
  content: string; // The generated text response
  usage: TokenUsage; // Token consumption information
  model: string; // Model used for generation
  finishReason?: string; // Why the generation stopped
}

interface ParsedLLMResponse<TType> {
  parsed: TType; // Type-safe parsed response
  raw: LLMResponse; // Original response object
}

interface TokenUsage {
  promptTokens: number; // Tokens in the input
  completionTokens: number; // Tokens in the output
  totalTokens: number; // Total tokens used
}
```

#### Validation Contracts

```typescript
interface LLMResponseContract<TType> {
  validate(obj: unknown): obj is TType;
}
```

Response contracts provide type-safe validation for LLM responses, ensuring the output matches your expected structure.

### Important Utilities

The package includes several utility functions and classes that simplify common LLM operations.

#### Cost Calculation

```typescript
import { calculateLLMCost, getModelPricing, getSupportedModels } from '@openvaa/llm';

// Calculate the cost of an LLM call
const cost = calculateLLMCost({
  provider: llm, // LLMProvider instance or provider name string
  model: 'gpt-4o',
  usage: response.usage,
  useCachedInput: false // Set to true if using API provider's queue (cheaper but not real-time)
});

// Get pricing information for a specific model
const pricing = getModelPricing(llm, 'gpt-4o');
console.log(`Input cost per 1M tokens: $${pricing?.input}`);
console.log(`Output cost per 1M tokens: $${pricing?.output}`);

// List all supported models for cost calculation
const models = getSupportedModels(llm);
console.log('Supported models:', models);
```

#### Prompt Template Variables

```typescript
import { setPromptVars } from '@openvaa/llm';

const promptTemplate = `
You are analyzing political comments about {{topic}}.
Please extract arguments from the following comments:
{{comments}}

Focus on arguments that are {{focus}}.
`;

const variables = {
  topic: 'climate change',
  comments: ['Comment 1', 'Comment 2', 'Comment 3'],
  focus: 'economic impacts'
};

const finalPrompt = setPromptVars({ promptText: promptTemplate, variables });
```

#### Latency Tracking

```typescript
import { LatencyTracker, measureLatency } from '@openvaa/llm';

// Using the LatencyTracker class
const tracker = new LatencyTracker();

tracker.start('llm-call');
const response = await llm.generate({ messages, temperature: 0.7 });
const duration = tracker.stop('llm-call');

console.log(`LLM call took ${duration}ms`);

// Using the measureLatency utility function
const [result, latency] = await measureLatency('batch-processing', async () => {
  return await llm.generateMultipleParallel({ inputs, parallelBatches: 3 });
});

console.log(`Batch processing took ${latency}ms`);
```

#### Error Handling Utilities

```typescript
import { parseWaitTimeFromError } from '@openvaa/llm';

try {
  await llm.generate({ messages, temperature: 0.7 });
} catch (error) {
  const waitTime = parseWaitTimeFromError(error);
  if (waitTime) {
    console.log(`Rate limited. Wait ${waitTime}ms before retrying.`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
```

## API Reference

### LLMProvider (Abstract Class)

The base class that all LLM providers must extend. Provides a unified interface for different LLM services.

#### Methods

- `generate()`: Generate a single response
- `generateWithRetry()`: Generate with automatic retry logic
- `generateAndValidateWithRetry()`: Generate with validation and retry
- `generateMultipleParallel()`: Process multiple requests in parallel with inherent retry. Validation optional
- `generateMultipleSequential()`: Process multiple requests sequentially

### OpenAIProvider

The OpenAI implementation of the LLMProvider interface.

#### Constructor Options

```typescript
interface OpenAIProviderOptions {
  apiKey: string; // Required
  model?: string; // Optional, defaults to 'gpt-4o'
  maxContextTokens?: number; // Optional, defaults to 4096
  fallbackModel?: string; // Optional fallback model
}
```

#### Supported Models

The package includes pricing information for all major OpenAI models:

- **GPT-4.1 family**: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`
- **GPT-4.5**: `gpt-4.5-preview`
- **GPT-4o family**: `gpt-4o`, `gpt-4o-mini`, `gpt-4o-audio-preview`
- **o1 family**: `o1`, `o1-pro`, `o1-mini`
- **o3 family**: `o3`, `o3-pro`, `o3-mini`, `o3-deep-research`
- **o4 family**: `o4-mini`, `o4-mini-deep-research`

See, update and add model pricing information in [`src/consts.ts`](src/consts.ts). Although accurate in 8/2025, be sure to update at least your main model's pricing info to keep yourself updated throughout costly LLM operations. As the costs are calculated with token counts provided by the model provider in their responses, they should be fairly accurate.

## Advanced Usage

### Cost Tracking

```typescript
import { calculateLLMCost } from '@openvaa/llm';

const response = await llm.generate({
  messages: [new Message({ role: Role.USER, content: 'Hello' })],
  temperature: 0.7
});

const cost = calculateLLMCost({
  provider: llm,
  model: response.model,
  usage: response.usage
});
console.log(`Cost: $${cost.toFixed(4)}`);
```

### Error Handling

```typescript
try {
  const response = await llm.generateWithRetry({
    messages: [new Message({ role: Role.USER, content: 'Test message' })],
    temperature: 0.7,
    maxAttempts: 5
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('LLM Error:', error.message);

    // Check for specific error types
    if (error.message.includes('rate limit')) {
      console.log('Rate limit exceeded, consider implementing backoff');
    } else if (error.message.includes('context length')) {
      console.log('Context too long, consider reducing input size');
    }
  }
}
```

## Extending the Package

### Adding a New Provider

To add support for a new LLM provider (e.g., Anthropic Claude), extend the `LLMProvider` class:

```typescript
import { LLMProvider, Message, LLMResponse } from '@openvaa/llm';

export class AnthropicProvider extends LLMProvider {
  public readonly name = 'anthropic';

  constructor(
    private apiKey: string,
    private model = 'claude-3-sonnet-20240229'
  ) {
    super();
  }

  async generate({
    messages,
    temperature,
    maxTokens,
    model
  }: {
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse> {
    // Implement Anthropic API calls here
    // Return LLMResponse object
  }

  // Implement other abstract methods...
}
```

## Environment Setup

Make sure your OpenAI API key is set in the repository root `.env` file:

```bash
LLM_OPENAI_API_KEY=your-openai-api-key-here
```

Or pass it directly to the provider constructor as shown in the examples above.

## Performance Considerations

- **Parallel Processing**: Use `generateMultipleParallel()` for batch operations to improve throughput. If your API key's token-per-minute limit is low (e.g. 30000 tpm), don't expect the parallelization to provide 10x improvements. The limits will be hit fast with a high parallelization coefficient.
- **Model Selection**: Choose appropriate models based on your use case (e.g., `gpt-4o-mini` for simple tasks, `gpt-4o` for complex reasoning)
- **Token Limits**: Set appropriate `maxTokens` to control costs and response length
- **Temperature**: Use lower temperatures (0.1-0.3) for consistent, factual responses; higher temperatures (0.7-0.9) for creative content
