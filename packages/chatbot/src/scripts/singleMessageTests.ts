/**
 * Chatbot E2E Evaluation Script using Promptfoo
 *
 * Runs promptfoo evaluation tests against the full chatbot pipeline.
 * Uses real API calls to LLMs and vector stores (no mocking).
 *
 * Usage: bun run src/scripts/test.ts
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import promptfoo from 'promptfoo';
import { ChatbotController } from '../controller/chatbotController';
import { getChatbotConfiguration } from '../defaultConfig';
import type { ProviderResponse } from 'promptfoo';

// Load environment variables from project root
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });

async function runChatbotEvaluation() {
  console.info('Initializing chatbot configuration...');

  // Initialize chatbot configuration once
  const chatbotConfig = getChatbotConfiguration();
  const vectorStore = await chatbotConfig.vectorStore;
  const queryRoutingProvider = await chatbotConfig.queryRoutingProvider;
  const phaseRouterProvider = await chatbotConfig.phaseRouterProvider;

  console.info('Loading test configuration...');

  // Load test configuration from YAML
  const configPath = join(__dirname, 'singleMessageTests.yaml');
  const configContent = readFileSync(configPath, 'utf-8');
  const testConfig = load(configContent) as {
    tests: Array<Record<string, unknown>>;
    defaultTest?: Record<string, unknown>;
  };

  console.info('Running evaluation...\n');

  // Run promptfoo evaluation with inline provider function
  const results = await promptfoo.evaluate({
    // Pass through the query variable as-is
    prompts: [(context) => (context.vars.query as string) || ''],

    // Inline provider function that calls handleQuery
    providers: [
      async (prompt: string): Promise<ProviderResponse> => {
        try {
          const startTime = Date.now();

          // Call the chatbot controller
          const response = await ChatbotController.handleQuery({
            messages: [{ role: 'user', content: prompt }],
            locale: 'en',
            vectorStore,
            queryRoutingProvider,
            phaseRouterProvider,
            conversationState: {
              sessionId: crypto.randomUUID(),
              phase: 'intent_resolution', // Use intent_resolution to enable RAG
              workingMemory: [],
              forgottenMessages: [],
              lossyHistorySummary: '',
              locale: 'en'
            }
          });

          // Consume the stream to get full text output
          const fullText = await response.stream.text;

          const latency = Date.now() - startTime;

          // Return output + metadata for assertions
          return {
            output: fullText,
            metadata: {
              ...response.metadata,
              latency // Total latency including streaming
            }
          };
        } catch (error) {
          console.error('Error in provider function:', error);
          return {
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    ],

    // Load tests from config
    tests: testConfig.tests,

    // Use default test settings
    defaultTest: testConfig.defaultTest
  });
  console.info('\n=== TEST RESULTS ===\n');
  results.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.info(`${status} Test ${index + 1}: ${result.testCase.description || 'Unnamed test'}`);
    // TODO: add phase to the chatbot controller response
    // console.info(`  Phase: ${result.metadata?.phase}`);

    // Print success or failure
    if (!result.success) {
      const isUnder333 = result.response?.output?.length < 333;
      if (isUnder333) {
        console.info(`  Output: ${result.response?.output}\n`);
      } else {
        console.info(`  Output: ${result.response?.output?.substring(0, 333)}...\n`);
      }
      console.info('  What failed:');
      result.gradingResult?.componentResults?.forEach((comp) => {
        if (!comp.pass) {
          console.info(`    - ${comp.assertion?.type}: ${comp.reason}`);
        }
      });
    }
    console.info('');
  });

  // Display summary
  const totalTests = results.results.length;
  const passedTests = results.results.filter((r) => r.success).length;
  const failedTests = totalTests - passedTests;

  console.info(`SUCCESS RATE: ${((passedTests / totalTests) * 100).toFixed(1)} %`);

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the evaluation
runChatbotEvaluation().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
