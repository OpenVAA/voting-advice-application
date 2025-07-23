import OpenAI from 'openai';
import { LLMProvider, LLMResponse, Message, UsageStats } from './llm-provider'; // Assuming the previous code is saved in another file
import { ModelState } from '../rateLimiters/modelState';
import { OpenAIRateLimiter } from '../rateLimiters/openaiRateLimiter';
import { isDailyLimitError } from '../utils/dailyLimitError';
import { parseWaitTimeFromError } from '../utils/parseRateLimitError';
import { getRateLimiter, selectModelForGeneration } from '../utils/selectModel';
import { estimateTokens } from '../utils/tokenCounter';

export class OpenAIProvider extends LLMProvider {
  public model: string;
  private openai: OpenAI;
  public readonly maxContextTokens: number;
  private rateLimiters = new Map<string, OpenAIRateLimiter>();
  private modelState: ModelState;

  constructor({
    model = 'gpt-4o',
    apiKey,
    maxContextTokens = 4096,
    fallbackModel
  }: {
    apiKey: string;
    model?: string;
    maxContextTokens?: number;
    fallbackModel?: string;
  }) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required in constructor options.');
    }
    super();
    this.model = model;
    this.maxContextTokens = maxContextTokens;
    this.openai = new OpenAI({ apiKey });
    this.modelState = new ModelState(model, fallbackModel);
  }

  async generate({
    messages,
    temperature = 0.7,
    maxTokens,
    model
  }: {
    messages: Array<Message>;
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required for generation');
    }

    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    const estimatedTokens = estimateTokens({ messages });

    // Use model given as a parameter or fall back to the default provider model (can also be set in the constructor)
    const modelToUse = model || this.model;

    try {
      const openAIMessages: Array<OpenAI.ChatCompletionMessageParam> = messages.map(mapToMessageParam);

      const response = await this.openai.chat.completions.create({
        model: modelToUse,
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
      if (isDailyLimitError({ error: error as Error })) {
        console.info(
          `📅 DAILY LIMIT REACHED: Model ${modelToUse} has hit daily limit, rotating to next available model`
        );
        this.modelState.markDailyLimitReached(modelToUse);
        this.modelState.rotateModels();

        const newModel = await selectModelForGeneration({
          estimatedTokens,
          modelState: this.modelState,
          rateLimiters: this.rateLimiters
        });
        return this.generate({ messages, temperature, maxTokens, model: newModel });
      }

      // Non-daily-limit error - rethrow & handle retry logic in caller code
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
    }
  }

  /**
   * Generates multiple responses from the LLM by processing requests in parallel batches. Tries to prevent rate limit errors by pre-checking limits. 
   * @param inputs Array of generation input parameters
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  async generateMultipleParallel({
    inputs
  }: {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
  }): Promise<Array<LLMResponse>> {
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

    const results: Array<LLMResponse> = [];
    const batchSize = 3; // TODO: Make this configurable (& it should depend on the model's TPM limit)
    const mainModelRateLimiter = getRateLimiter({ model: this.model, rateLimiters: this.rateLimiters });

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);

      let modelForBatch = inputs[0].model || this.model;

      const preBatchStatus = mainModelRateLimiter.getStatus();
      console.info(
        `📊 PRE-BATCH STATUS (${mainModelRateLimiter.model}): TPM ${preBatchStatus.tpm.used}/${preBatchStatus.tpm.limit} (${preBatchStatus.tpm.percentage.toFixed(2)}%)`
      );

      // Check whether the model can handle the batch after waiting or if it's simply too big
      const batchTokens = batch.reduce((sum, input) => sum + estimateTokens({ messages: input.messages }), 0);
      const modelRateLimiter = getRateLimiter({ model: modelForBatch, rateLimiters: this.rateLimiters });

      // Use main model if available, otherwise use fallback model or wait
      if (modelRateLimiter.hasEnoughTPM({ estimatedTokens: batchTokens })) {
        console.info(`🔄 OPENAI PROVIDER: Using main model ${modelForBatch}`);
      } else {
        if (this.modelState.fallbackModel) {
          const fallbackRateLimiter = getRateLimiter({
            model: this.modelState.fallbackModel,
            rateLimiters: this.rateLimiters
          });

          // Check if fallback model can handle the batch
          if (fallbackRateLimiter.hasEnoughTPM({ estimatedTokens: batchTokens })) {
            modelForBatch = this.modelState.fallbackModel;
            console.info(`🔄 OPENAI PROVIDER: Switching to fallback model ${modelForBatch} for batch processing`);
          } else {
            // Both main and fallback are rate limited, wait for the one with the least wait time
            const waitTime = Math.min(
              modelRateLimiter.getWaitTime({ estimatedTokens: batchTokens }),
              fallbackRateLimiter.getWaitTime({ estimatedTokens: batchTokens })
            );
            console.info(
              `🔄 OPENAI PROVIDER: Throttling. Both main and fallback models are expected to hit rate limits. Waiting for ${waitTime}ms for ${modelForBatch}`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        } else {
          const waitTime = modelRateLimiter.getWaitTime({ estimatedTokens: batchTokens });
          console.info(
            `🔄 OPENAI PROVIDER: Throttling. Main model is expected to hit rate limit. Waiting for ${waitTime}ms for ${modelForBatch}`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      // Process each item in the batch individually with its own fallback logic
      const batchPromises = batch.map(async (input, batchIndex) => {
        const globalIndex = i + batchIndex;

        const makeRequest = async (): Promise<LLMResponse> => {
          let attempt = 0;
          const maxAttempts = 3; // Original + 2 retries

          while (attempt < maxAttempts) {
            try {
              return await this.generate({
                messages: input.messages,
                temperature: input.temperature,
                maxTokens: input.maxTokens,
                model: modelForBatch
              });
            } catch (error) {
              attempt++;

              if (error instanceof Error && error.message.includes('429') && attempt < maxAttempts) {
                const waitTime = parseWaitTimeFromError(error.message) || 5000;
                console.info(
                  `🔄 Request ${globalIndex} rate limited (attempt ${attempt}/${maxAttempts}). Waiting ${waitTime}ms and retrying...`
                );
                await new Promise((resolve) => setTimeout(resolve, waitTime));
              } else {
                throw error; // Either not a rate limit error, or we've exhausted retries
              }
            }
          }
          throw new Error(`Request ${globalIndex} failed after ${maxAttempts} attempts`);
        };

        try {
          const result = await makeRequest();
          const rateLimiter = getRateLimiter({ model: modelForBatch, rateLimiters: this.rateLimiters });
          rateLimiter.recordUsage({ tokensUsed: result.usage.promptTokens });

          return result;
        } catch (error) {
          // Handle daily limit errors
          if (isDailyLimitError({ error: error as Error })) {
            this.modelState.markDailyLimitReached(modelForBatch);
            this.modelState.rotateModels();

            const newModel = await selectModelForGeneration({
              estimatedTokens: estimateTokens({ messages: input.messages }),
              modelState: this.modelState,
              rateLimiters: this.rateLimiters
            });

            console.info(`📅 DAILY LIMIT REACHED for ${modelForBatch}: Retrying with new model ${newModel}`);

            const result = await this.generate({
              messages: input.messages,
              temperature: input.temperature,
              maxTokens: input.maxTokens,
              model: newModel
            });

            // Record tokens for this retry call
            const rateLimiter = getRateLimiter({ model: result.model, rateLimiters: this.rateLimiters });
            rateLimiter.recordUsage({ tokensUsed: result.usage.promptTokens });

            return result;
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Request ${globalIndex} failed: ${errorMessage}`);
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * Generates multiple responses from the LLM by processing requests in sequence.
   * @param inputs Array of generation input parameters
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  async generateMultipleSequential({
    inputs
  }: // TODO: Error handling.
  {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
  }): Promise<Array<LLMResponse>> {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    const results: Array<LLMResponse> = [];

    for (const input of inputs) {
      const result = await this.generate({
        messages: input.messages,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        model: input.model
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Estimates the number of tokens in a text string. Note: This is a simple approximation.
   * TODO: For production use, consider using a proper tokenizer.
   */
  async countTokens(text: string) {
    return {
      tokens: Math.ceil(text.length / 4)
    };
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
