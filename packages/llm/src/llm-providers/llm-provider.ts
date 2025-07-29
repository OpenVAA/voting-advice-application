export type Role = 'system' | 'user' | 'assistant' | 'developer';

export class Message {
  role: Role;
  content: string;

  constructor({ role, content }: { role: Role; content: string }) {
    this.role = role;
    this.content = content;
  }
}

export class UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  constructor({
    promptTokens,
    completionTokens,
    totalTokens
  }: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }) {
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.totalTokens = totalTokens;
  }

  /**
   * Calculates the estimated cost of the API call based on token usage.
   * Currently returns 0 as cost calculation depends on the specific model and pricing.
   * Override this in provider-specific implementations if needed.
   */
  get estimatedCost(): number {
    return 0;
  }
}

export class LLMResponse {
  content: string;
  usage: UsageStats;
  model: string;
  finishReason?: string;

  constructor({
    content,
    usage,
    model,
    finishReason
  }: {
    content: string;
    usage: UsageStats;
    model: string;
    finishReason?: string;
  }) {
    this.content = content;
    this.usage = usage;
    this.model = model;
    this.finishReason = finishReason;
  }

  /**
   * Indicates whether the response was truncated due to length constraints
   */
  get wasTruncated(): boolean {
    return this.finishReason === 'length';
  }
}

/**
 * Abstract base class for LLM providers.
 * Implement this class to add support for new LLM providers.
 */
export abstract class LLMProvider {
  /**
   * Generates a response from the LLM based on the provided messages
   * @param messages Array of messages to send to the LLM
   * @param temperature Controls randomness in the response (0-1)
   * @param maxTokens Optional maximum number of tokens to generate
   * @param model Optional model to use for this request, overriding the provider's default model
   */
  abstract generate({
    messages,
    temperature,
    maxTokens,
    model
  }: {
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse>;

  /**
   * Generates multiple responses from the LLM based on an array of input requests
   * @param inputs Array of input requests, each containing messages, temperature, and optional parameters
   * @param parallelBatches Optional maximum number of parallel batches to use. Default is 3.
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  abstract generateMultipleParallel({
    inputs
  }: {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
    parallelBatches?: number;
  }): Promise<Array<LLMResponse>>;

  abstract generateMultipleSequential({
    inputs
  }: {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
  }): Promise<Array<LLMResponse>>;
}
