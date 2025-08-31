import { BooleanQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { OpenAIProvider } from '@openvaa/llm';
import { config } from 'dotenv';
import path from 'path';
import { generateQuestionInfo } from './src/api';
import { QUESTION_INFO_OPERATION } from './src/types';

config({ path: path.resolve(__dirname, '../../.env') });

async function runExample() {
  try {
    // Check for API key
    const apiKey = process.env.LLM_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      console.info('💡 Set it with: export OPENAI_API_KEY="your-api-key-here"');
      return;
    }

    // Create OpenAI provider
    const llmProvider = new OpenAIProvider({
      apiKey,
      model: 'gpt-4o-mini', // Use a more cost-effective model for testing
      maxContextTokens: 4096
    });

    // Create a data root
    const root = new DataRoot();

    // Create the question from your data
    const question = new BooleanQuestion({
      data: {
        id: '48',
        type: QUESTION_TYPE.Boolean,
        name: 'Wellbeing services counties should have taxation rights.',
        categoryId: 'governance-category',
        info: 'The funding for wellbeing services counties primarily comes from the state budget, and they do not have taxation rights.'
      },
      root
    });

    // Configure options for generating both info sections and terms
    const options = {
      runId: 'example-run-001',
      operations: [QUESTION_INFO_OPERATION.InfoSections, QUESTION_INFO_OPERATION.Terms],
      language: 'en',
      llmModel: 'gpt-4o-mini',
      llmProvider,
      questionContext: 'Election in Finland, 2025',
      sectionTopics: ['Background', 'Current Status', 'Why should I care?']
    };

    console.info('🤔 Question:', question.name);
    console.info('📋 Operations:', options.operations);
    console.info('🌐 Language:', options.language);
    console.info(' LLM Provider:', llmProvider.name);
    console.info('🧠 Model:', options.llmModel);
    console.info('\n--- Generating Question Info ---\n');

    // Generate the question info
    const results = await generateQuestionInfo({ questions: [question], options });

    // Display results
    results.forEach((result, index) => {
      console.info(`\n\nResult ${index + 1} (Run ID: ${result.runId}):`);
      console.info(`   Question: ${result.questionName} (ID: ${result.questionId})`);
      console.info(`   Duration: ${result.metrics.duration} s`);

      if (!result.success) {
        console.info('   ❌ Error');
      }

      console.info('\n\nInfo Sections:\n\n', result.infoSections);
      console.info('\n\nTerms:\n\n', result.terms);

      console.info('\n' + '─'.repeat(50) + '\n');
      console.info('Usage:', result.metrics);
    });
  } catch (error) {
    console.error('❌ Error running example:', error);
  }
}

// Run the example
runExample();
