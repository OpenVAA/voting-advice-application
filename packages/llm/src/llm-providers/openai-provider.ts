import OpenAI from 'openai';
import { LLMProvider, LLMResponse, Message, UsageStats } from './llm-provider'; // Assuming the previous code is saved in another file

export class OpenAIProvider extends LLMProvider {
  public model: string;
  private openai: OpenAI;
  public readonly maxContextTokens: number;

  constructor({
    model = 'gpt-4o-mini',
    apiKey,
    maxContextTokens = 4096
  }: {
    model?: string;
    apiKey: string;
    maxContextTokens?: number;
  }) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required in constructor options.');
    }
    super();
    this.model = model;
    this.maxContextTokens = maxContextTokens;
    this.openai = new OpenAI({ apiKey });
  }

  async generate({
    messages,
    temperature = 0.7,
    maxTokens
  }: {
    messages: Array<Message>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required for generation');
    }

    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    const openAIMessages: Array<OpenAI.ChatCompletionMessageParam> = messages.map(mapToMessageParam);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: openAIMessages,
        temperature,
        max_tokens: maxTokens
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI API returned no choices');
      }

      const choice = response.choices[0];
      const usage = response.usage;

      if (!choice.message.content) {
        throw new Error('OpenAI API returned empty content');
      }

      const llmResponse = new LLMResponse({
        content: choice.message.content,
        usage: new UsageStats({
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0
        }),
        model: response.model,
        finishReason: choice.finish_reason
      });

      return llmResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
    }
  }

  /**
   * Generates multiple responses from the LLM by processing requests sequentially
   * @param inputs Array of generation input parameters
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  async generateMultiple(inputs: Array<{
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
  }>): Promise<LLMResponse[]> {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    // Validate inputs before processing
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input.messages || input.messages.length === 0) {
        throw new Error(`Input at index ${i}: At least one message is required for generation`);
      }
      if (input.temperature < 0 || input.temperature > 1) {
        throw new Error(`Input at index ${i}: Temperature must be between 0 and 1`);
      }
    }

    // Process all requests sequentially to avoid rate limits
    // TODO: Implement faster processing by getting rate limit updates from OpenAI
    const results: LLMResponse[] = [];
    for (let i = 0; i < inputs.length; i++) {
      try {
        const response = await this.generate(inputs[i]);
        results.push(response);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Request ${i} failed: ${error.message}`);
        }
        throw new Error(`Request ${i} failed with unknown error`);
      }
    }

    return results;
  }

  /**
   * Estimates the number of tokens in a text string. Note: This is a simple approximation. For production use, consider using a proper tokenizer.
   */
  async countTokens(text: string) {
    return {
      tokens: Math.ceil(text.length / 4)
    };
  }

  /**
   * Calculates how many messages can fit within the context window. Uses a conservative estimate of average tokens per message to ensure we don't exceed the model's context limit.
   */
  async fitCommentArgsCount(): Promise<number> {
    const averageTokensPerMessage = 50;
    return Math.floor(this.maxContextTokens / averageTokensPerMessage);
  }
}

function mapToMessageParam({ role, content }: { role: string; content: string }): OpenAI.ChatCompletionMessageParam {
  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case 'system':
      return { role: 'system', content } as OpenAI.ChatCompletionSystemMessageParam;

    case 'user':
      return { role: 'user', content } as OpenAI.ChatCompletionUserMessageParam;

    case 'assistant':
      return { role: 'assistant', content } as OpenAI.ChatCompletionAssistantMessageParam;

    case 'developer':
      return { role: 'developer', content } as OpenAI.ChatCompletionDeveloperMessageParam;

    default:
      throw new Error(`Unsupported role: ${normalizedRole}`);
  }
}
