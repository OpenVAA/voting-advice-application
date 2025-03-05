import OpenAI from 'openai';
import { Message, LLMResponse, UsageStats, LLMProvider, Role } from './llm-provider'; // Assuming the previous code is saved in another file

export class OpenAIProvider extends LLMProvider {
  private model: string;

  private openai: OpenAI;

  constructor(options: { model?: string; apiKey?: string } = {}) {
    super();
    this.model = options.model || 'gpt-4o-mini';
    this.openai = new OpenAI({
      apiKey: options.apiKey ?? process.env.OPENAI_API_KEY
    });
  }

  // OpenAI models typically have a max context window of around 4096 tokens
  get maxContextTokens(): number {
    return 4096;
  }

  async generate(
    messages: Message[],
    temperature: number = 0.7,
    maxTokens?: number,
    stopSequences?: string[]
  ): Promise<LLMResponse> {
    // Convert our internal message format to OpenAI API format
    const openAIMessages = messages.map((message) => ({
      role: message.role.toLowerCase(),
      content: message.content
    }));

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: openAIMessages as any,
        temperature,
        max_tokens: maxTokens
      });

      // Extract the relevant data from the OpenAI response
      const choice = response.choices[0]; // Get the first response
      const usage = response.usage;

      const llmResponse = new LLMResponse(
        choice.message.content ?? '',
        new UsageStats(usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0, usage?.total_tokens ?? 0),
        response.model,
        choice.finish_reason
      );

      return llmResponse;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  async countTokens(text: string) {
    // Call OpenAI to count tokens using a tokenizer API if available, or estimate based on simple heuristics
    // For the sake of example, we will use a rough estimate where 1 token ~ 4 characters
    return {
      tokens: Math.ceil(text.length / 4)
    };
  }

  async fitCommentArgsCount(): Promise<number> {
    // Implement logic to fit comment args to the context window.
    // Example logic: you can return how many arguments/messages fit into the max context
    const averageTokensPerMessage = 50; // Rough average tokens per message
    return Math.floor(this.maxContextTokens / averageTokensPerMessage);
  }
}
