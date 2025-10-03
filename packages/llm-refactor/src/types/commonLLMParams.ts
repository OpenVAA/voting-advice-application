import type { Controller } from '@openvaa/core';
import type { LLMProvider } from '../llm-providers/llmProvider';

/**
 * Common parameters used across all LLM-based operations like argument condensation and question info generation
 */
export interface CommonLLMParams {
  runId: string;

  /** The LLM provider to use, e.g. OpenAIProvider */
  llmProvider: LLMProvider;

  /** The LLM model to use */
  llmModel: string;

  /** The fallback LLM model in case of errors and for general flexibility */
  fallbackModel?: string;

  /** The number of tokens per minute the LLM model can handle */
  modelTPMLimit?: number;

  /** Optional controller for tracking progress */
  controller?: Controller;
}
