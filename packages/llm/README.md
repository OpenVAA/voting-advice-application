# `@openvaa/llm`: LLM Integration for OpenVAA

This package provides a simple and extensible interface for integrating Large Language Models (LLMs) into the OpenVAA platform.

## Features

- Abstract `LLMProvider` interface for consistent LLM integration
- Built-in OpenAI provider implementation
- Support for:
  - Message-based chat completions
  - Token counting
  - Usage statistics and cost estimation
  - Context window management

## Quick Start

1. Install the package:

```bash
npm install @openvaa/llm
```

2. Create an instance of the OpenAI provider:

```typescript
import { OpenAIProvider } from '@openvaa/llm';

const llm = new OpenAIProvider({
  apiKey: 'your-api-key', // Optional if OPENAI_API_KEY env var is set
  model: 'gpt-4' // Optional, defaults to 'gpt-4-mini'
});
```

3. Generate completions:

```typescript
import { Message, Role } from '@openvaa/llm';

const response = await llm.generate([
  new Message(Role.SYSTEM, 'You are a helpful assistant'),
  new Message(Role.USER, 'Hello!')
]);

console.log(response.content);
```

## Extending

To add support for other LLM providers, extend the `LLMProvider` abstract class and implement its required methods:

- `generate()`: Generate completions from messages
- `countTokens()`: Count tokens in a text string
- `maxContextTokens`: Get the maximum context window size
- `fitCommentArgsCount()`: Calculate how many arguments fit in the context
