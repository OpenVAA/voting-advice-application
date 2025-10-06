import type { Controller } from '@openvaa/core';
import type { CallSettings, GenerateObjectResult, Prompt, StopCondition, StreamTextResult, ToolSet } from 'ai';
import type { z } from 'zod';
import type { LLMCosts, ModelPricing } from '../utils/costCalculation.type';

// Vercel AI SDK defines their types similarly with Prompt and CallSettings as base types.
// For streamText, for example, they define its params as Prompt & CallSetting & 20-ish other 
// params that are defined explicitly, not inside any type. We do the same here by cherry-picking
// the explicit params from Vercel's StreamText. In addition to copying their existing params to
// our own LLMStreamOptions type, we also add our own params that are not in Vercel's type.
// These types are here to facilitate LLM-related functionality that is not supported by Vercel's
// AI SDK. Namely, cost calculation, latency tracking and validation failure retries.

// ------------------------------------------------------------
// COMMON
// ------------------------------------------------------------

export interface LLMModelConfig {
  primary: string;
  fallback?: string;
  tpmLimit?: number;
  pricing?: ModelPricing;
  useCachedInput?: boolean;
}

/** An LLM provider orchestrates LLM calls. This configures how the LLM provider will be used. */
export interface ProviderConfig {
  provider: 'openai'; // add others as needed
  apiKey: string; // Make optional if .env var is modified to OPENAI_API_KEY & Vercel AI SDK can automatically find it. Otherwise, keep it as required.
  modelConfig: LLMModelConfig;
}

export interface LLMCallMetadata {
  latencyMs: number;
  attempts: number;
  costs: LLMCosts;
  model: string;
  fallbackUsed?: boolean;
  // nånting annat som behövs?
}

// ------------------------------------------------------------
// OBJECT GENERATION
// ------------------------------------------------------------

export type LLMObjectGenerationOptions<TType> = Prompt &
  Omit<CallSettings, 'stopSequences'> & {
    modelConfig: LLMModelConfig;
    schema: z.ZodSchema<TType>; // Support only Zod schemas for now
    /** Validation retries are not internally handled by the Vercel AI SDK, so we need to handle it here. Defaults to 1. */
    validationRetries?: number;
    controller?: Controller;
  };

export type LLMObjectGenerationResult<TType> = GenerateObjectResult<TType> & LLMCallMetadata;
// ------------------------------------------------------------
// STREAM
// ------------------------------------------------------------

export type LLMStreamOptions<TOOLS extends ToolSet | undefined = undefined> = Prompt &
  Partial<CallSettings> & {
    tools?: TOOLS;
    modelConfig?: LLMModelConfig;
    controller?: Controller;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stopWhen?: StopCondition<any>; // Vercel doesn't support typing this, so we won't either
  };

export interface LLMStreamResult<TOOLS extends ToolSet | undefined = undefined>
  extends StreamTextResult<NonNullable<TOOLS>, never>,
    Omit<LLMCallMetadata, 'costs'> {
  // Override costs to be a Promise since stream results are immediately available
  costs: Promise<LLMCosts>;
}