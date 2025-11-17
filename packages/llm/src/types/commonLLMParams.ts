import type { Controller } from '@openvaa/core';
import type { LLMProvider } from '../llm-providers/llmProvider';

/**
 * Common parameters used across all LLM-based operations like argument condensation and question info generation
 */
export interface CommonLLMParams {
  runId: string;
  llmProvider: LLMProvider;
  /** Output language. Try to use a prompt in this language if possible. */
  language: string;
  /** Optional controller for tracking progress */
  controller?: Controller;
}
