import { OpenAIEmbedder } from '@openvaa/vector-store';
import { type ModelMessage } from 'ai';
import { ChromaClient } from 'chromadb';
import { OPENAI_API_KEY } from '../apiKey';
import { embedPromptVars, loadPrompt } from '../utils/promptLoader';
import type { Collection } from 'chromadb';
import type { LoadedPrompt } from '../types/prompt.type';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles vector store operations and context enrichment for chatbot messages
 */
export class RAGService {
  private static userQueryPrompt: LoadedPrompt | null = null;
  private static chromaCollection: Collection | null = null;
  private static embedder: OpenAIEmbedder | null = null;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the RAGService (loads prompts and connects to vector store)
   * This is called automatically on first use but can be called explicitly
   */
  static async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.userQueryPrompt && this.chromaCollection && this.embedder) {
      return;
    }

    this.initializationPromise = (async () => {
      console.info('Initializing RAGService...');

      // Load user query prompt for context wrapping
      console.info('Loading RAG prompts...');
      this.userQueryPrompt = await loadPrompt({ promptFileName: 'userQueryWithContext' });
      console.info('✓ RAG prompts loaded');

      // Initialize embedder (using same config as embeddingScript)
      this.embedder = new OpenAIEmbedder({
        model: 'text-embedding-3-small',
        dimensions: 1536,
        apiKey: OPENAI_API_KEY
      });
      console.info('✓ Embedder initialized');

      // Connect to Chroma vector store (assumes it's running on localhost:8000)
      console.info('Connecting to Chroma vector store...');
      const chromaClient = new ChromaClient({
        path: 'http://host.docker.internal:8000'
      });

      try {
        // Use the same collection name as the embedding script
        // Note: We use getOrCreateCollection to avoid embeddingFunction requirement
        this.chromaCollection = await chromaClient.getOrCreateCollection({
          name: 'hello_vector_store',
          metadata: { 'hnsw:space': 'cosine' }
        });
        console.info('✓ Connected to Chroma vector store');
      } catch (error) {
        console.error('Failed to connect to Chroma vector store:', error);
        console.error('Make sure Chroma is running on http://localhost:8000');
        throw error;
      }

      console.info('✓ RAGService initialization complete\n');
    })();

    return this.initializationPromise;
  }

  /**
   * Search the vector store for relevant context (returns structured data)
   * @param query - The search query
   * @param topK - Number of results to return (default: 3)
   * @returns Structured array of search results
   */
  static async searchContextStructured(
    query: string,
    topK: number = 3
  ): Promise<
    Array<{
      source: string;
      content: string;
      distance?: number;
    }>
  > {
    if (!this.chromaCollection || !this.embedder) {
      throw new Error('RAGService not initialized. Call RAGService.initialize() first.');
    }

    // Generate query embedding
    const queryEmbedding = await this.embedder.embed(query);

    // Search the vector store
    const results = await this.chromaCollection.query({
      queryEmbeddings: [queryEmbedding.embedding],
      nResults: topK
    });

    // Format the context from search results
    if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
      return [];
    }

    // Return structured results
    return results.documents[0]
      .filter((doc): doc is string => doc !== null && doc !== undefined)
      .map((doc, idx) => ({
        source: (results.metadatas?.[0]?.[idx]?.sourceId as string) || 'Unknown',
        content: doc,
        distance: results.distances?.[0]?.[idx]
      }));
  }

  /**
   * Search the vector store for relevant context
   * @param query - The search query
   * @param topK - Number of results to return (default: 3)
   * @returns Formatted context string from search results
   */
  static async searchContext(query: string, topK: number = 3): Promise<string> {
    const structuredResults = await this.searchContextStructured(query, topK);

    if (structuredResults.length === 0) {
      return 'No relevant context found.';
    }

    // Format structured results into a context string
    const contextParts = structuredResults.map((result) => `### Source: ${result.source}\n${result.content}`);

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Enhance message with RAG context
   * Takes the user message, searches for relevant context, and wraps it with the context
   *
   * @param message - Message to enhance
   * @param enableRAG - Whether to enable RAG enrichment (default: true)
   * @param topK - Number of context results to retrieve (default: 3)
   * @returns Enhanced messages array with context added to the last user message
   */
  static async enhanceMessageWithContext(
    message: ModelMessage,
    enableRAG: boolean = true,
    topK: number = 3
  ): Promise<ModelMessage> {
    if (!enableRAG || !this.userQueryPrompt || !message || typeof message.content !== 'string') {
      return message;
    }

    // Search for relevant context
    const context = await this.searchContext(message.content, topK);

    // Wrap the user query with context using the userQueryWithContext prompt
    const enhancedContent = embedPromptVars({
      promptText: this.userQueryPrompt.prompt,
      variables: {
        query: message.content,
        context
      }
    });

    return {
      role: 'user',
      content: enhancedContent
    };
  }
}
