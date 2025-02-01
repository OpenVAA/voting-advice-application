export type Role = 'system' | 'user';

export class Message {
  public role: Role;
  public content: string;

  constructor({ role, content }: { role: Role; content: string }) {
    this.role = role;
    this.content = content;
  }
}

export class UsageStats {
  constructor(
    public promptTokens: number,
    public completionTokens: number,
    public totalTokens: number
  ) {}

  get estimatedCost(): number {
    // Calculate estimated cost based on token usage
    return 0; // Implement cost calculation logic here
  }
}

// class EmbeddingResponse {
//     public embedding: NDArray<Float32Array>; // The actual embedding vector

//     constructor(
//         embedding: Float32Array | number[],
//         public tokens: number,
//         public model: string
//     ) {
//         // Convert list to NDArray if needed
//         if (Array.isArray(embedding)) {
//             this.embedding = new Float32Array(embedding);
//         } else {
//             this.embedding = embedding;
//         }
//     }

//     get estimatedCost(): number {
//         const costPer1kTokens = 0.0001; // $0.0001 per 1K tokens
//         return (this.tokens / 1000) * costPer1kTokens;
//     }

//     get length(): number {
//         return this.embedding.length;
//     }
// }

export class LLMResponse {
  constructor(
    public content: string,
    public usage: UsageStats,
    public model: string,
    public finishReason?: string
  ) {}

  get wasTruncated(): boolean {
    // Check if response was truncated due to length
    return this.finishReason === 'length';
  }
}

// Abstract class for LLMProvider
export abstract class LLMProvider {
  abstract generate(
    messages: Array<Message>,
    temperature: number,
    maxTokens?: number,
    stopSequences?: Array<string>
  ): Promise<LLMResponse>;

  abstract countTokens(text: string): Promise<{
    tokens: number;
  }>;

  abstract get maxContextTokens(): number;

  // To do: implement such that the fitting doesn't happen according to context length but performance
  // This needs to be done because model performance drops if the input is too large
  abstract fitCommentArgsCount(): Promise<number>;
}
