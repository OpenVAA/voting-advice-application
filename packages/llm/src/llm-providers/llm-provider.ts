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
   */
  abstract generate({
    messages,
    temperature,
    maxTokens
  }: {
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
  }): Promise<LLMResponse>;

  /**
   * Estimates the number of tokens in a text string
   */
  abstract countTokens(text: string): Promise<{
    tokens: number;
  }>;

  /**
   * Maximum number of tokens that can be processed in a single request
   */
  abstract get maxContextTokens(): number;

  /**
   * Calculates how many messages can fit within the context window while maintaining good model performance
   *
   * To do: implement such that the fitting doesn't happen according to context length but performance
   * This needs to be done because model performance drops if the input is too large
   */
  abstract fitCommentArgsCount(): Promise<number>;
}
