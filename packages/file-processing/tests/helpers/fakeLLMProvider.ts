import { LLMProvider } from '@openvaa/llm-refactor';
import type { Controller } from '@openvaa/core';
import type {
  LLMObjectGenerationOptions,
  LLMObjectGenerationResult,
  LLMStreamOptions,
  LLMStreamResult
} from '@openvaa/llm-refactor';
import type { ToolSet } from 'ai';

type RecursivePartial<TData> = {
  [P in keyof TData]?: TData[P] extends Array<infer TItem>
    ? Array<RecursivePartial<TItem>>
    : TData[P] extends object
      ? RecursivePartial<TData[P]>
      : TData[P];
};

type MockStreamResult<TOOLS extends ToolSet | undefined = undefined> = RecursivePartial<LLMStreamResult<TOOLS>>;
type MockObjectResult<TType> = RecursivePartial<LLMObjectGenerationResult<TType>>;

export class FakeLLMProvider extends LLMProvider {
  private streamTextResponse: MockStreamResult<undefined> = {};
  private generateObjectResponseQueue: Array<MockObjectResult<unknown>> = [];
  private generateObjectParallelResponsesQueue: Array<Array<MockObjectResult<unknown>>> = [];
  public cumulativeCosts: number = 0;

  constructor() {
    // Call parent constructor with fake config
    super({
      provider: 'openai',
      apiKey: 'fake-api-key',
      modelConfig: {
        primary: 'fake-model',
        useCachedInput: false
      }
    });
  }

  setStreamTextResponse(response: MockStreamResult<undefined>): void {
    this.streamTextResponse = response;
  }

  setGenerateObjectResponse(response: MockObjectResult<unknown>): void {
    this.generateObjectResponseQueue.push(response);
  }

  setGenerateObjectParallelResponses(responses: Array<MockObjectResult<unknown>>): void {
    this.generateObjectParallelResponsesQueue.push(responses);
  }

  override streamText<TOOLS extends ToolSet | undefined = undefined>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: LLMStreamOptions<TOOLS>
  ): LLMStreamResult<TOOLS> {
    const defaultResponse = {
      costs: Promise.resolve({ total: 0, input: 0, output: 0 }),
      latencyMs: 0,
      attempts: 1,
      model: 'fake-model',
      text: Promise.resolve(''),
      usage: Promise.resolve({ promptTokens: 0, completionTokens: 0, totalTokens: 0 })
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...defaultResponse, ...this.streamTextResponse } as any;
  }

  override async generateObject<TType>(
    options: LLMObjectGenerationOptions<TType>
  ): Promise<LLMObjectGenerationResult<TType>> {
    const defaultResponse = {
      object: {} as TType,
      finishReason: 'stop' as const,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costs: { total: 0, input: 0, output: 0 },
      rawResponse: undefined,
      warnings: [],
      metadata: {},
      log: '',
      latencyMs: 0,
      attempts: 1,
      model: 'fake-model',
      fallbackUsed: false
    };

    // Get next response from queue (or use empty object if queue is empty)
    const mockResponse = this.generateObjectResponseQueue.shift() || {};
    const response = { ...defaultResponse, ...mockResponse };

    // Validate against schema if provided (will throw on validation error)
    if (options.schema) {
      const validated = options.schema.parse(response.object);
      response.object = validated as TType;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Promise.resolve(response as any);
  }

  override async generateObjectParallel<TType>({
    requests
  }: {
    requests: Array<LLMObjectGenerationOptions<TType>>;
    maxConcurrent?: number;
    controller?: Controller;
  }): Promise<Array<LLMObjectGenerationResult<TType>>> {
    // Get next set of responses from queue (or use empty array if queue is empty)
    const mockResponses = this.generateObjectParallelResponsesQueue.shift() || [];

    // Fill missing fields in mock responses
    const completeResponses = mockResponses.map((response, index) => {
      const baseResponse = {
        object: {} as TType,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        costs: { total: 0, input: 0, output: 0 },
        rawResponse: undefined,
        warnings: [],
        metadata: {},
        log: '',
        latencyMs: 0,
        attempts: 1,
        model: 'fake-model',
        fallbackUsed: false,
        ...response
      };

      // Validate against schema if provided (will throw on validation error)
      const request = requests[index];
      if (request?.schema) {
        baseResponse.object = request.schema.parse(baseResponse.object) as TType;
      }

      return baseResponse;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Promise.resolve(completeResponses as any);
  }
}
