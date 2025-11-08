/**
 * Chatbot E2E Evaluation Script
 *
 * Runs promptfoo evaluation tests against the full chatbot pipeline.
 * Uses real API calls to LLMs and vector stores (no mocking).
 *
 * Usage: bun run src/scripts/chatbotEvaluation.ts
 */

import { config } from 'dotenv';
import { join } from 'path';
import { ChatbotController } from '../controller/chatbotController';
import { getChatbotConfiguration } from '../defaultConfig';
// Load environment variables from project root
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });
console.info('Getting Cohere API key from: ' + process.env.COHERE_API_KEY);

async function runChatbotEvaluation() {
  const config = getChatbotConfiguration();
  const vectorStore = await config.vectorStore;
  const queryRoutingProvider = await config.queryRoutingProvider;
  const phaseRouterProvider = await config.phaseRouterProvider;

  const response = await ChatbotController.handleQuery({
    messages: [],
    locale: 'en',
    vectorStore,
    queryRoutingProvider,
    phaseRouterProvider,
    conversationState: {
      sessionId: crypto.randomUUID(),
      phase: 'intro_to_chatbot_use',
      workingMemory: [],
      forgottenMessages: [],
      lossyHistorySummary: '',
      locale: 'en'
    }
  });
  console.log(response);
}

// Run the evaluation
runChatbotEvaluation().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
