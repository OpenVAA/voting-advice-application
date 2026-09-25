/** @example
 * ```typescript
 * {
 *   model: 'text-embedding-3-small',
 *   apiKey: 'your-api-key',
 *   dimensions: 1536
 * }
 * ```
 */
export interface EmbedderOptions {
  model: string;
  dimensions: number;
  apiKey?: string;
}

/** @example
 * ```typescript
 * {
 *   embedding: [0.1, 0.2, 0.3]
 * }
 * ```
 */
export interface EmbedderResponse {
  embedding: Array<number>;
}

/** @example
 * ```typescript
 * const embedder = new OpenAIEmbedder({
 *   model: 'text-embedding-3-small',
 *   apiKey: 'your-api-key',
 *   dimensions: 1536
 * });
 * const embedding = await embedder.embed('Hello, world!');
 * ```
 */
export abstract class Embedder {
  protected model: string;
  protected dimensions: number;

  constructor(options: EmbedderOptions) {
    this.model = options.model;
    this.dimensions = options.dimensions;
  }

  abstract embed(text: string): Promise<EmbedderResponse>;
  abstract batchEmbed(texts: Array<string>): Promise<Array<EmbedderResponse>>;
  abstract getDimension(): number;
}
