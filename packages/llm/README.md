# @openvaa/llm

## Why?

This package is a utility wrapper around [Vercel AI SDK](https://sdk.vercel.ai) that centralizes LLM calls and enrichens Vercel's SDK capabilities with useful stuff: it handles cost calculations automatically (IF you set the used model's current pricing to src/modelPricing.ts - otherwise it may calculate using an old price or omit and fallback to $0), implements validation error retrial boilerplate and exposes an in-memory queue for LLM calls with no specified limit. The queue can also be configured to send out the LLM calls in parallel batches. These capabilities are not provided by the Vercel AI SDK v5.

Additionally, we provide localization support. We use English fallback prompts that generate output in any of the supported languages of your elections.

To reiterate, the package provides:

- **Cost tracking** - Automatic calculation of API costs per request
- **Validation retries** - Automatic retry when LLM output fails schema validation
- **Parallel processing** - Batch multiple requests with configurable concurrency
- **Latency monitoring** - Track performance metrics for each call
- **Centralized prompt registry** - Prompts from the whole repo are saved from to one location
- **Prompt logic reusability across locales** - Dynamic, out-of-the-box localization instruction injection
- **Automatic variable injection** - Load & inject: loadPrompt({ id, variables: { a: 'name', b: 'address' } }),

Internally it uses Vercel AI SDK types and functions (`messages`, `generateObject`, `streamText`, etc.). These utilities are just layered on top for convenience.

## Quick Start

```typescript
import { LLMProvider } from '@openvaa/llm';
import { z } from 'zod';

const llm = new LLMProvider({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  modelConfig: {
    primary: 'gpt-4o-mini'
  }
});

// Uses Vercel AI SDK's generateObject under the hood,
// but adds cost tracking, latency calcs, and validation retries
const result = await llm.generateObject({
  modelConfig: { primary: 'gpt-4o-mini' },
  schema: z.object({
    name: z.string(),
    age: z.number()
  }),
  messages: [
    {
      role: 'user',
      content: 'Create a user profile for John, age 30'
    }
  ],
  temperature: 0.7,
  validationRetries: 3 // Automatically retry if validation fails
});

// Enhanced response includes costs and metadata
console.log(result.object); // { name: 'John', age: 30 }
console.log(result.costs); // { input: 0.0001, output: 0.0002, total: 0.0003 }
console.log(result.latencyMs); // 1234
console.log(result.attempts); // 1
```

## Core Functionality

### Object Generation with Validation Retries

The main value-add here is automatic retry when the LLM produces invalid output. Uses Vercel's `generateObject` but retries on validation failures:

```typescript
const result = await llm.generateObject({
  modelConfig: { primary: 'gpt-4o-mini' },
  schema: z.object({
    items: z.array(z.string()),
    count: z.number()
  }),
  messages: [{ role: 'user', content: 'List 3 fruits' }],
  validationRetries: 3, // Will retry up to 3 times if schema validation fails
  maxRetries: 3 // Vercel AI SDK's network retry parameter
});
```

### Parallel Batch Processing

Process multiple requests concurrently with automatic cost tracking for each:

```typescript
const results = await llm.generateObjectParallel({
  requests: [
    {
      modelConfig: { primary: 'gpt-4o-mini' },
      schema: summarySchema,
      messages: [{ role: 'user', content: 'Summarize article 1' }]
    },
    {
      modelConfig: { primary: 'gpt-4o-mini' },
      schema: summarySchema,
      messages: [{ role: 'user', content: 'Summarize article 2' }]
    }
    // ... more requests
  ],
  maxConcurrent: 5 // Process 5 at a time
});
```

### Text Streaming

Wraps Vercel's `streamText` with cost calculation:

```typescript
const stream = llm.streamText({
  modelConfig: { primary: 'gpt-4o-mini' },
  messages: [{ role: 'user', content: 'Tell me a story' }],
  temperature: 0.7
});

// Standard Vercel AI SDK streaming
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Costs calculated after stream completes
const costs = await stream.costs;
console.log(`Total cost: $${costs.total}`);
```

### Prompt Registry

The package provides a **Prompt Registry** for centralized prompt management with automatic localization support. Features register their prompts once, then load them with automatic language fallback and variable injection.

#### Registering Prompts

Register your prompts directory once at initialization:

```typescript
// In packages/my-feature/src/prompts.ts
import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';

registerPrompts({
  packageName: 'my-feature',
  promptsDir: path.join(__dirname, 'prompts')
});
```

#### Prompt YAML Structure

Organize prompts by language:

```yaml
# prompts/en/summarize.yaml
promptId: my_feature_summarize_v1
promptText: |
  Summarize the following {{contentType}} about {{topic}}.

  Content: {{content}}

  {{localizationInstructions}}
params:
  required:
    - contentType
    - topic
    - content
  optional:
    - localizationInstructions
```

#### Loading Prompts

```typescript
import { loadPrompt } from '@openvaa/llm';

const { promptText, metadata } = await loadPrompt({
  promptId: 'my_feature_summarize_v1',
  language: 'fi', // Output language
  variables: {
    contentType: 'article',
    topic: 'renewable energy',
    content: '...'
  },
  fallbackLocalization: false, // Optional: Use localization instructions if true (default: false)
  throwIfVarsMissing: true // Optional: Strict mode - throw on prompt variable mismatches (default: true)
});
```

**Options:**

- `promptId`: Unique identifier for the prompt
- `language`: Requested output language
- `variables`: Object with values for `{{placeholder}}` variables
- `fallbackLocalization`: If `true`, uses localization instructions when prompt unavailable in requested language. If `false`, throws error. Default: `false` (recommended - create native prompts for important tasks)
- `throwIfVarsMissing`: If `true`, throws error on missing required variables. If `false`, leaves `{{placeholders}}` and logs warning. Default: `true`

#### Automatic Language Fallback

When `fallbackLocalization: true` and a prompt isn't available in the requested language:

1. Falls back to English version
2. Auto-injects localization instructions (if prompt has `{{localizationInstructions}}` optional param)
3. LLM responds in target language despite English prompt

## Utilities

### Cost Calculation

```typescript
import { calculateLLMCost, getModelPricing } from '@openvaa/llm';

// Get pricing for a model
const pricing = getModelPricing('openai', 'gpt-4o-mini');
// { input: 0.15, output: 0.6, cachedInput: 0.075, reasoning: 0 }

// Calculate costs from token usage
const costs = calculateLLMCost({
  pricing,
  usage: { inputTokens: 1000, outputTokens: 500 },
  useCachedInput: false
});
```

### Prompt Template Variables

```typescript
import { setPromptVars } from '@openvaa/llm';

const prompt = setPromptVars({
  promptText: 'Analyze {{topic}} in the context of {{context}}. Focus on {{focus}}.',
  variables: {
    topic: 'renewable energy',
    context: 'urban planning',
    focus: 'cost-benefit analysis'
  },
  strict: true // Throw error if variables are missing
});
```

## Types

This package re-exports relevant types from Vercel AI SDK and adds its own:

```typescript
import type {
  TokenUsage, // From Vercel AI SDK
  LLMProvider, // This package
  LLMModelConfig, // This package
  LLMObjectGenerationResult, // This package (enhances Vercel's result)
  CommonLLMParams // This package
} from '@openvaa/llm';
```

Message format, schemas, and core types come directly from Vercel AI SDK - see their [documentation](https://sdk.vercel.ai/docs) for details.
