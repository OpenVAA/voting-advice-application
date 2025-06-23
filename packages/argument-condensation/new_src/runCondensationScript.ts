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
import { MapOperationParams, ReduceOperationParams, GroundingOperationParams } from './core/types/condensation/processParams';

// Configure the file to use
const fileToUse = 'kaivoshommia.json';

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

  // Get the prompts for the MAP → REDUCE → GROUND pipeline
  const mapPrompt = promptRegistry.getPrompt('map_likertPros_condensation_v1') as CondensationPrompt;
  const reducePrompt = promptRegistry.getPrompt('reduce_likertPros_coalescing_v1') as CondensationPrompt;
  const groundingPrompt = promptRegistry.getPrompt('ground_likertPros_grounding_v1') as CondensationPrompt;

  if (!mapPrompt || !reducePrompt || !groundingPrompt) {
    console.error('❌ Error: Required prompts not found in registry');
    console.error('Available prompts:', promptRegistry.listPrompts());
    process.exit(1);
  }

  // Create mock input data
  const parsedData = JSON.parse(fs.readFileSync(path.join(__dirname, `./testData/${fileToUse}`), 'utf8'));
  const comments = parsedData.comments;
  const topic = parsedData.topic;

  // Define the condensation configuration
  const config: CondensationPlan = {
    outputType: CONDENSATION_TYPE.LIKERT.PROS,
    steps: [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 20, // Process 20 comments per batch
          condensationPrompt: mapPrompt.promptText
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 3, // Coalesce 3 argument lists into 1
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      },
      {
        operation: CondensationOperations.GROUND,
        params: {
          groundingPrompt: groundingPrompt.promptText,
          batchSize: 25 // Use 15 comments for grounding evidence
        } as GroundingOperationParams
      }
    ],
    nOutputArgs: 3,
    language: 'en'
  };

  // Create the condensation input
  const input: CondensationRunInput = {
    runId: 'map-reduce-ground-test-001',
    electionId: 'test-election',
    question: {
      id: 'kaivoshommia tai jotain',
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

  const mapParams = config.steps[0].params as MapOperationParams;
  const reduceParams = config.steps[1].params as ReduceOperationParams;
  const groundParams = config.steps[2].params as GroundingOperationParams;

  try {
    console.log('📋 Configuration:');
    console.log(`- Pipeline: ${config.steps.map(s => s.operation).join(' → ')}`);
    console.log(`- MAP Batch Size: ${mapParams.batchSize}`);
    console.log(`- REDUCE Denominator: ${reduceParams.denominator}`);
    console.log(`- GROUND Batch Size: ${groundParams.batchSize}`);
    console.log(`- Output Type: ${config.outputType}`);
    console.log(`- Target Arguments: ${config.nOutputArgs}`);
    console.log(`- Total Comments: ${comments.length}`);
    console.log(`- Expected MAP Batches: ${Math.ceil(comments.length / mapParams.batchSize)}`);
    console.log(`- REDUCE will coalesce ${reduceParams.denominator} lists at a time`);
    console.log(`- GROUND will use ${groundParams.batchSize} comments for evidence\n`);

    // Create and run the condenser
    const condenser = new Condenser(input);
    
    console.log('\n\n 🔄 Running condensation process...\n');
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