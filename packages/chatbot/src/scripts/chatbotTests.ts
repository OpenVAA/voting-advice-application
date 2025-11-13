/**
 * Chatbot E2E Evaluation Script using Promptfoo
 *
 * Runs promptfoo evaluation tests against the full chatbot pipeline.
 * Uses real API calls to LLMs and vector stores (no mocking).
 *
 * Usage:
 *   bun run src/scripts/chatbotTests.ts [test_file.yaml ...]
 *
 * Examples:
 *   bun run src/scripts/chatbotTests.ts                        # run ALL .yaml files in scripts directory
 *   bun run src/scripts/chatbotTests.ts conversationTests.yaml # run only conversationTests.yaml
 *   bun run src/scripts/chatbotTests.ts singleMessageTests.yaml conversationTests.yaml # run specific files
 */

import { config } from 'dotenv';
import { readdirSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import promptfoo from 'promptfoo';
import { ChatbotController } from '../controller/chatbotController';
import { getChatbotConfiguration } from '../defaultConfig/config';
import type { ModelMessage } from 'ai';
import type { ProviderResponse } from 'promptfoo';

// Load environment variables from project root
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });

async function runChatbotEvaluation() {
  // Determine which test files to run
  const testFilenames =
    process.argv.length > 2
      ? process.argv.slice(2) // Use specified files
      : discoverTestFiles(); // Auto-discover all YAML files

  if (testFilenames.length === 0) {
    console.error('No test files found in scripts directory');
    process.exit(1);
  }

  console.info(`Running tests from ${testFilenames.length} file(s): ${testFilenames.join(', ')}\n`);

  // Initialize chatbot configuration once (shared across all test files)
  const { vectorStore, queryRoutingProvider, phaseRouterProvider } = await getChatbotConfiguration();

  // Track aggregate statistics
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  // Run tests for each file
  for (const testFilename of testFilenames) {
    console.info(`\n${'='.repeat(60)}`);
    console.info(`Running: ${testFilename}`);
    console.info('='.repeat(60));

    // Load test configuration from YAML
    const testConfig = loadTests(testFilename);

    // Run promptfoo evaluation with inline provider function
    const results = await promptfoo.evaluate({
      // Extract query from last message in vars.messages
      prompts: [
        (context) => {
          const messages = context.vars.messages as Array<ModelMessage> | undefined;

          // Handle legacy single-message format (vars.query)
          if (!messages && context.vars.query) {
            return context.vars.query as string;
          }

          // Validate messages array exists
          if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.warn('⚠️  Skipping test: vars.messages is missing or empty');
            return '';
          }

          // Extract last message
          const lastMessage = messages[messages.length - 1];

          // Validate it's a user message
          if (lastMessage.role !== 'user') {
            console.warn(`⚠️  Skipping test: last message has role '${lastMessage.role}' (expected 'user')`);
            return '';
          }

          return lastMessage.content as string;
        }
      ],

      // Inline provider function that calls handleQuery
      providers: [
        async (prompt: string, context): Promise<ProviderResponse> => {
          try {
            // Skip if prompt is empty (validation failed)
            if (!prompt) {
              return {
                output: '',
                error: 'Test skipped: invalid message format'
              };
            }

            const startTime = Date.now();

            // Get full message history from context
            const messages = (context?.vars?.messages as Array<ModelMessage>) || [{ role: 'user', content: prompt }];

            // Call the chatbot controller
            const response = await ChatbotController.handleQuery({
              locale: 'en',
              vectorStore,
              queryRoutingProvider,
              phaseRouterProvider,
              state: {
                sessionId: crypto.randomUUID(),
                messages,
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

    console.info(`\n--- Results for ${testFilename} ---\n`);
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

    // Update aggregate statistics
    const fileTests = results.results.length;
    const filePassed = results.results.filter((r) => r.success).length;
    const fileFailed = fileTests - filePassed;

    totalTests += fileTests;
    totalPassed += filePassed;
    totalFailed += fileFailed;

    console.info(
      `${testFilename}: ${filePassed}/${fileTests} passed (${((filePassed / fileTests) * 100).toFixed(1)}%)\n`
    );
  }

  // Display aggregate summary
  console.info(`\n${'='.repeat(60)}`);
  console.info('AGGREGATE RESULTS');
  console.info('='.repeat(60));
  console.info(`Total tests: ${totalTests}`);
  console.info(`Passed: ${totalPassed}`);
  console.info(`Failed: ${totalFailed}`);
  console.info(`SUCCESS RATE: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run the evaluation
runChatbotEvaluation().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// ------------------------------------------------------------
// Utils and types
// ------------------------------------------------------------

/**
 * Test configuration structure from YAML files
 */
interface TestConfig {
  tests: Array<Record<string, unknown>>;
  defaultTest?: Record<string, unknown>;
}

/**
 * Load test configuration from YAML file in scripts directory
 * @param filename - Name of YAML file (e.g., 'singleMessageTests.yaml')
 * @returns Parsed test configuration
 */
function loadTests(filename: string): TestConfig {
  const configPath = join(__dirname, filename);
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    return load(configContent) as TestConfig;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Test file not found: ${filename}\nLooked in: ${__dirname}`);
    }
    throw error;
  }
}

/**
 * Discover all YAML test files in the scripts directory
 * @returns Array of YAML filenames
 */
function discoverTestFiles(): Array<string> {
  const files = readdirSync(__dirname);
  return files.filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));
}
