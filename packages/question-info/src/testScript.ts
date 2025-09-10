// packages/question-info/scripts/test-generation.ts
import { OpenAIProvider } from '@openvaa/llm';
import dotenv from 'dotenv';
import path from 'path';
import { generateQuestionInfo } from '../src/api.js';
import { QUESTION_INFO_OPERATION } from '../src/types/generationOptions.js';
import type { AnyQuestionVariant } from '@openvaa/data';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ===== CONFIGURATION =====
// Change this to test different operations
const TEST_OPERATION: 'terms' | 'infoSections' | 'both' = 'infoSections'; // 'terms' | 'infoSections' | 'both'

// Test question
const TEST_QUESTION = {
  id: 'test-1',
  name: 'The electorates should increase the minimum wage.'
};

// ===== SCRIPT =====

async function runTest() {
  console.info('🚀 Starting Question Info Generation Test');
  console.info('=====================================');
  console.info(`Operation: ${TEST_OPERATION}`);
  console.info(`Question: ${TEST_QUESTION.name}`);
  console.info('');

  // Determine operations based on config
  let operations;
  switch (TEST_OPERATION) {
    case 'terms':
      operations = [QUESTION_INFO_OPERATION.Terms];
      break;
    case 'infoSections':
      operations = [QUESTION_INFO_OPERATION.InfoSections];
      break;
    case 'both':
      operations = [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections];
      break;
    default:
      throw new Error(`Invalid TEST_OPERATION: ${TEST_OPERATION}`);
  }

  // Check if the API key is set
  if (!process.env.LLM_OPENAI_API_KEY) {
    throw new Error('LLM_OPENAI_API_KEY is not set');
  }

  // Set up LLM provider
  const llmProvider = new OpenAIProvider({
    apiKey: process.env.LLM_OPENAI_API_KEY || 'your-api-key-here'
  });

  // Generate question info
  const startTime = Date.now();
  const results = await generateQuestionInfo({
    questions: [TEST_QUESTION as unknown as AnyQuestionVariant],
    options: {
      runId: 'test-1',
      operations,
      language: 'en',
      llmProvider,
      llmModel: 'gpt-4o-mini',
      questionContext: 'This election is held in Finland in 2025.',
      sectionTopics: ['Background', 'Current situation', 'Huplaah!']
    }
  });

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.info('📊 RESULTS');
  console.info('==========');
  console.info(`Total generation time: ${totalTime}ms`);
  console.info('');

  // Log the complete result object
  console.info('📋 Complete Question Info Result:');
  console.info(JSON.stringify(results[0], null, 2));
  console.info('');

  // Log metrics
  if (results[0].metrics) {
    console.info('📈 Metrics:');
    console.info(`- Success: ${results[0].success}`);
    console.info(`- Model: ${results[0].metadata.llmModel}`);
    console.info(`- Language: ${results[0].metadata.language}`);
    console.info(`- Start time: ${results[0].metadata.startTime}`);
    console.info(`- End time: ${results[0].metadata.endTime}`);
    console.info(`- Input tokens: ${results[0].metrics.tokensUsed.inputs}`);
    console.info(`- Output tokens: ${results[0].metrics.tokensUsed.outputs}`);
    console.info(`- Total tokens: ${results[0].metrics.tokensUsed.total}`);
    console.info(`- Cost: $${results[0].metrics.cost}`);
    console.info('');
  }

  // Log generated content
  if (results[0].terms && results[0].terms.length > 0) {
    console.info('🔤 Generated Terms:');
    results[0].terms.forEach((term, index) => {
      console.info(`${index + 1}. ${term.title}`);
      console.info(`   Triggers: ${term.triggers.join(', ')}`);
      console.info(`   Content: ${term.content}`);
      console.info('');
    });
  }

  if (results[0].infoSections && results[0].infoSections.length > 0) {
    console.info('📄 Generated Info Sections:');
    results[0].infoSections.forEach((section, index) => {
      console.info(`${index + 1}. ${section.title}`);
      console.info(`   Content: ${section.content}`);
      console.info('');
    });
  }

  console.info('✅ Test completed successfully!');
}

// Run the test
runTest().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
