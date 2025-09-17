# `@openvaa/chatbot`: Conversational AI for OpenVAA

This package provides a modular chatbot system for the OpenVAA platform, built on top of the Vercel AI SDK. It offers profile-based configurations, tool orchestration, and streaming support for different user contexts.

## Features

- **Profile-Based Configuration**: Different chatbot personalities for voters, candidates, and admins
- **Modular Tool System**: Vector search, data lookup, web search, and custom tools
- **Streaming Control**: Configurable visibility for tool calls and responses
- **Multi-Language Support**: Localized prompts and responses
- **Framework Agnostic**: Core logic separate from SvelteKit integration

## Architecture

- **Core**: `ChatEngine` class with static methods for building profiles and tools
- **Profiles**: Pre-configured chatbot personalities with prompts, tools, and stream settings
- **Tools**: Modular tool system with visibility control
- **Types**: TypeScript definitions for all interfaces
- **Prompts**: Localized YAML prompt templates

## Integration

This package is designed to work with:

- **Frontend**: SvelteKit API routes with Vercel AI SDK
- **Data**: Existing OpenVAA data providers and vector stores
- **UI**: Vercel AI SDK's `useChat` hook for frontend integration


// SOMETHING:

As covered under Foundations, tools are objects that can be called by the model to perform a specific task. AI SDK Core tools contain three elements:

description: An optional description of the tool that can influence when the tool is picked.
inputSchema: A Zod schema or a JSON schema that defines the input parameters. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
execute: An optional async function that is called with the inputs from the tool call. It produces a value of type RESULT (generic type). It is optional because you might want to forward tool calls to the client or to a queue instead of executing them in the same process.
