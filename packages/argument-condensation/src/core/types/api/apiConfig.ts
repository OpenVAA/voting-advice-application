import { LLMProvider } from '@openvaa/llm';

export type CondensationAPIOptions = {
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  parallelBatches: number;
  modelTPMLimit: number;
};