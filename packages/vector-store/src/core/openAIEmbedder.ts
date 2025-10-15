import OpenAI from 'openai';
import { Embedder, type EmbedderOptions, type EmbedderResponse } from './embedder.type';

export class OpenAIEmbedder extends Embedder {
  private client: OpenAI;

  constructor(options: EmbedderOptions) {
    super(options);
    this.client = new OpenAI({
      apiKey: options.apiKey
    });
  }

  async embed(text: string): Promise<EmbedderResponse> {
    const model = this.model;
    const dimensions = this.dimensions;

    console.info(`Embedding text: ${text}`);
    const response = await this.client.embeddings.create({
      model,
      input: text,
      dimensions
    });
    console.info('Got response from OpenAI embedder.');

    return {
      embedding: response.data[0].embedding
    };
  }

  async batchEmbed(texts: Array<string>): Promise<Array<EmbedderResponse>> {
    const model = this.model;
    const dimensions = this.dimensions;

    const response = await this.client.embeddings.create({
      model,
      input: texts,
      dimensions
    });

    return response.data.map((data) => ({
      embedding: data.embedding
    }));
  }

  getDimension(): number {
    return this.dimensions;
  }
}
