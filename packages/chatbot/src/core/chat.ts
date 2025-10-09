import { LLMProvider } from '@openvaa/llm-refactor';
import { OpenAIEmbedder } from '@openvaa/vector-store';
import { type ModelMessage, stepCountIs } from 'ai';
import { ChromaClient } from 'chromadb';
import { getTools } from './tools/tools';
import { OPENAI_API_KEY } from '../apiKey';
import { embedPromptVars, loadPrompt } from '../utils/promptLoader';
import type { Collection } from 'chromadb';
import type { ChatbotAPIInput } from '../api.type';
import type { LoadedPrompt } from '../types/prompt.type';

// Main chat engine for OpenVAA chatbot with RAG capabilities
export class ChatEngine {
  private static systemPrompt: LoadedPrompt | null = null;
  private static userQueryPrompt: LoadedPrompt | null = null;
  private static chromaCollection: Collection | null = null;
  private static embedder: OpenAIEmbedder | null = null;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the ChatEngine (loads prompts and connects to vector store)
   * This is called automatically on first use but can be called explicitly
   */
  private static async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.systemPrompt && this.userQueryPrompt && this.chromaCollection && this.embedder) {
      return;
    }

    this.initializationPromise = (async () => {
      console.info('Initializing ChatEngine...');

      // Load prompts
      console.info('Loading prompts...');
      this.systemPrompt = await loadPrompt({ promptFileName: 'systemPrompt_v0' });
      this.userQueryPrompt = await loadPrompt({ promptFileName: 'userQueryWithContext' });
      console.info('✓ Prompts loaded');

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

      console.info('✓ ChatEngine initialization complete\n');
    })();

    return this.initializationPromise;
  }

  /**
   * Search the vector store for relevant context
   */
  private static async searchContext(query: string, topK: number = 3): Promise<string> {
    if (!this.chromaCollection || !this.embedder) {
      throw new Error('ChatEngine not initialized');
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
      return 'No relevant context found.';
    }

    // Combine the top results into a context string
    const contextParts = results.documents[0]
      .filter((doc): doc is string => doc !== null && doc !== undefined)
      .map((doc, idx) => {
        const sourceId = results.metadatas?.[0]?.[idx]?.sourceId || 'Unknown';
        return `### Source: ${sourceId}\n${doc}`;
      });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Process user messages with RAG context
   */
  private static async enhanceMessagesWithContext(
    messages: ChatbotAPIInput['messages'],
    enableRAG: boolean = true
  ): Promise<ChatbotAPIInput['messages']> {
    if (!enableRAG || !this.userQueryPrompt) {
      return messages;
    }

    // Get the last user message to search for context
    // Using reverse iteration instead of findLast for compatibility
    let lastUserMessage: ModelMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }

    if (!lastUserMessage || typeof lastUserMessage.content !== 'string') {
      return messages;
    }

    // Search for relevant context
    const context = await this.searchContext(lastUserMessage.content);

    // Wrap the user query with context using the userQueryWithContext prompt
    const enhancedContent = embedPromptVars({
      promptText: this.userQueryPrompt.prompt,
      variables: {
        query: lastUserMessage.content,
        context
      }
    });

    // Replace the last user message with the enhanced version
    const enhancedMessages = [...messages];
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex !== -1) {
      enhancedMessages[lastUserMessageIndex] = {
        role: 'user',
        content: enhancedContent
      };
    }

    return enhancedMessages;
  }

  /**
   * Create a streaming chat response with RAG capabilities
   */
  static async createStream(input: ChatbotAPIInput) {
    // Initialize on first use
    await this.initialize();

    if (!this.systemPrompt) {
      throw new Error('System prompt not loaded');
    }

    // Determine if RAG should be enabled (default to true unless explicitly disabled)
    const enableRAG = input.getToolsOptions?.includeVectorSearch !== false;

    // Enhance messages with RAG context if enabled
    const messages = await this.enhanceMessagesWithContext(input.messages, enableRAG);

    // Use the loaded system prompt
    const systemMessage = this.systemPrompt.prompt;

    const llmProvider = new LLMProvider({
      provider: 'openai',
      apiKey: OPENAI_API_KEY,
      modelConfig: { primary: 'gpt-4o-mini' }
    });

    const result = llmProvider.streamText({
      modelConfig: { primary: 'gpt-4o-mini' },
      system: systemMessage,
      messages,
      tools: getTools(input.getToolsOptions?.dataProvider, input.getToolsOptions),
      stopWhen: stepCountIs(input.nSteps ?? 5)
    });

    return result;
  }
}
