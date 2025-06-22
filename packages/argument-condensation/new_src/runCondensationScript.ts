import { Condenser } from './core/condenser';
import { CondensationRunInput } from './core/types';
import { CondensationPlan } from './core/types/condensation/processDefinition';
import { CondensationOperations } from './core/types/condensation/operation';
import { CONDENSATION_TYPE } from './core/types/condensationType';
import { OpenAIProvider } from '@openvaa/llm';
import { PromptRegistry } from './core/prompts/promptRegistry';
import * as dotenv from 'dotenv';
import * as path from 'path';
import fs from 'fs';
import { CondensationPrompt } from './core/types/prompt';
import { RefineOperationParams } from './core/types/condensation/processParams';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function runCondensationScript() {
  console.log('🚀 Starting Argument Condensation Script...\n');

  // Check for required environment variables
  const apiKey = process.env.LLM_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: LLM_OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  // Initialize and load the prompt registry
  const promptRegistry = new PromptRegistry();
  await promptRegistry.loadPrompts();

  // Get the refine prompts for pros
  const initialBatchPrompt = promptRegistry.getPrompt('refine_likertPros_initial_v1') as CondensationPrompt;
  const refinementPrompt = promptRegistry.getPrompt('refine_likertPros_refinement_v1') as CondensationPrompt;

  if (!initialBatchPrompt || !refinementPrompt) {
    console.error('❌ Error: Required prompts not found in registry');
    console.error('Available prompts:', promptRegistry.listPrompts());
    process.exit(1);
  }

  // Create mock input data
  const parsedData = JSON.parse(fs.readFileSync(path.join(__dirname, './testData/kaivoshommia.json'), 'utf8'));
  const comments = parsedData.comments;
  const topic = parsedData.topic;

  // Define the condensation configuration
  const config: CondensationPlan = {
    outputType: CONDENSATION_TYPE.LIKERT.PROS,
    steps: [
      {
        operation: CondensationOperations.REFINE,
        params: {
          batchSize: 15, // Process 15 comments at a time
          initialBatchPrompt: initialBatchPrompt.promptText,
          refinementPrompt: refinementPrompt.promptText
        }
      }
    ],
    nOutputArgs: 3,
    language: 'en'
  };

  // Create the condensation input
  const input: CondensationRunInput = {
    runId: 'refine-test-001',
    electionId: 'test-election',
    question: {
      id: 'env-policy-question',
      topic: topic,
      answerType: 'likert-5'
    },
    model: 'gpt-4o',
    comments: comments,
    config: config,
    llmProvider: new OpenAIProvider({ 
      apiKey: apiKey,
      model: 'gpt-4o'
    })
  };

  const refineParams = config.steps[0].params as RefineOperationParams;

  try {
    console.log('📋 Configuration:');
    console.log(`- Operation: ${config.steps[0].operation}`);
    console.log(`- Batch Size: ${refineParams.batchSize}`);
    console.log(`- Output Type: ${config.outputType}`);
    console.log(`- Target Arguments: ${config.nOutputArgs}`);
    console.log(`- Total Comments: ${comments.length}`);
    console.log(`- Expected Batches: ${Math.ceil(comments.length / refineParams.batchSize)}\n`);

    // Create and run the condenser
    const condenser = new Condenser(input);
    
    console.log('🔄 Running condensation process...\n');
    const result = await condenser.run();

    console.log('✅ Condensation completed successfully!');
    console.log('\n📊 Final Results:');
    console.log('Arguments:', JSON.stringify(result.arguments, null, 2));
    console.log('\n📈 Metrics:');
    console.log(`- LLM Calls: ${result.metrics.nLlmCalls}`);
    console.log(`- Duration: ${result.metrics.duration}s`);
    console.log(`- Tokens Used: ${result.metrics.tokensUsed.total}`);
    console.log(`- Estimated Cost: $${result.metrics.cost}`);

  } catch (error) {
    console.error('❌ Error running condensation:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  runCondensationScript().catch(console.error);
}

export { runCondensationScript }; 