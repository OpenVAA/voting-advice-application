import type { Controller } from '@openvaa/core';
import type { CallSettings, GenerateObjectResult, Prompt, StopCondition, StreamTextResult, ToolSet } from 'ai';
import type { z } from 'zod';
import type { LLMCosts, ModelPricing } from '../utils/costCalculation.type';

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

export interface LLMMetadata {
  latencyMs: number;
  attempts: number;
  fallbackUsed?: boolean;
  costs: LLMCosts;
}

// ------------------------------------------------------------
// OBJECT GENERATION
// ------------------------------------------------------------

export type LLMObjectGenerationOptions<TType> = Prompt &
  Omit<CallSettings, 'stopSequences'> & {
    modelConfig: LLMModelConfig;
    schema: z.ZodSchema<TType>; // Support only Zod schemas for now
    /** Validation retries are not internally handled by the AI SDK, so we need to handle it here. Defaults to 1. */
    validationRetries?: number;
    controller?: Controller;
  };

export type LLMObjectGenerationResult<TType> = GenerateObjectResult<TType> & LLMMetadata;
// ------------------------------------------------------------
// STREAM
// ------------------------------------------------------------

export type LLMStreamOptions<TOOLS extends ToolSet | undefined = undefined> = Prompt &
  Partial<CallSettings> & {
    tools?: TOOLS;
    modelConfig?: LLMModelConfig;
    controller?: Controller;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stopWhen?: StopCondition<any>;
  };

export interface LLMStreamResult<TOOLS extends ToolSet | undefined = undefined>
  extends StreamTextResult<NonNullable<TOOLS>, never>,
    Omit<LLMMetadata, 'costs'> {
  // Override costs to be a Promise since stream results are immediately available
  costs: Promise<LLMCosts>;
}