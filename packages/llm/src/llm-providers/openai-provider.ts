import OpenAI from 'openai';
import { LLMProvider, LLMResponse, Message, UsageStats } from './llm-provider'; // Assuming the previous code is saved in another file

export class OpenAIProvider extends LLMProvider {
  private model: string;
  private openai: OpenAI;
  public readonly maxContextTokens: number;

  constructor(options: { model?: string; apiKey?: string; maxContextTokens?: number } = {}) {
    super();
    this.model = options.model || 'gpt-4o-mini';
    this.maxContextTokens = options.maxContextTokens || 4096;
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required. Provide it through constructor options or OPENAI_API_KEY environment variable.'
      );
    }

    this.openai = new OpenAI({ apiKey });
  }

  async generate(
    messages: Array<Message>,
    temperature: number = 0.7,
    maxTokens?: number
    //stopSequences?: Array<string>
  ): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required for generation');
    }

    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    // Convert our internal message format to OpenAI API format
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

      // Extract the relevant data from the OpenAI response
      const choice = response.choices[0];
      const usage = response.usage;

      if (!choice.message.content) {
        throw new Error('OpenAI API returned empty content');
      }

      const llmResponse = new LLMResponse(
        choice.message.content,
        new UsageStats(usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0, usage?.total_tokens ?? 0),
        response.model,
        choice.finish_reason
      );

      return llmResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
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

function mapToMessageParam(message: { role: string; content: string }): OpenAI.ChatCompletionMessageParam {
  // Convert role to lowercase for case-insensitive comparison
  const role = message.role.toLowerCase();

  switch (role) {
    case 'system':
      return {
        role: 'system',
        content: message.content
      } as OpenAI.ChatCompletionSystemMessageParam;

    case 'user':
      return {
        role: 'user',
        content: message.content
      } as OpenAI.ChatCompletionUserMessageParam;

    case 'assistant':
      return {
        role: 'assistant',
        content: message.content
      } as OpenAI.ChatCompletionAssistantMessageParam;

    case 'tool':
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: '' // You'll need to provide this
      } as OpenAI.ChatCompletionToolMessageParam;

    case 'developer':
      return {
        role: 'developer',
        content: message.content
      } as OpenAI.ChatCompletionDeveloperMessageParam;

    default:
      throw new Error(`Unsupported role: ${role}`);
  }
}
