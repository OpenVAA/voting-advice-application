import { TokenUsage } from './tokenUsage';

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
}

