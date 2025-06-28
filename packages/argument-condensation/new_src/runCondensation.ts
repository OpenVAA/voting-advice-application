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

// Configure the file path to use - user can modify this path
const INPUT_FILE_PATH = 'evaluation/metaEvaluation/testData/comments/hiilineutraalius_succinct.txt';
const runId = 'first_cons_run'; 

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Function to parse the metaevaluation test data format
function parseMetaEvaluationFile(filePath: string): { topic: string; comments: Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }> } {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const topic = 'Kunnassani ja hyvinvointialueellani tulee pyrkiä hiilineutraaliuteen.';
  const comments: Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }> = [];
  
  let currentLikertValue = 0;
  let commentIndex = 0;
  
  for (const line of lines) { 
    // Parse section headers like "=== LIKERT_VALUE:1 LABEL:Täysin eri mieltä COUNT:47 ==="
    const sectionMatch = line.match(/=== LIKERT_VALUE:(\d+) LABEL:(.+?) COUNT:(\d+) ===/);
    if (sectionMatch) {
      currentLikertValue = parseInt(sectionMatch[1]);
      continue;
    }
    
    // Parse comment lines like '[1] CANDIDATE_ID:827 "En kannata uusien veromuotojen luomista."'
    const commentMatch = line.match(/^\[(\d+)\] CANDIDATE_ID:(\d+) "(.+)"$/);
    if (commentMatch) {
      commentIndex++;
      comments.push({
        id: `comment-${commentIndex}`,
        candidateID: commentMatch[2],
        candidateAnswer: currentLikertValue,
        text: commentMatch[3]
      });
    }
  }
  
  return { topic, comments };
}

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
  const mapPrompt = promptRegistry.getPrompt('map_likertCons_condensation_v1') as CondensationPrompt;
  const reducePrompt = promptRegistry.getPrompt('reduce_likertCons_coalescing_v1') as CondensationPrompt;
  const groundingPrompt = promptRegistry.getPrompt('ground_likertCons_grounding_v1') as CondensationPrompt;

  if (!mapPrompt || !reducePrompt || !groundingPrompt) {
    console.error('❌ Error: Required prompts not found in registry');
    console.error('Available prompts:', promptRegistry.listPrompts());
    process.exit(1);
  }

  // Parse the metaevaluation test data file
  const inputFilePath = path.join(__dirname, INPUT_FILE_PATH);
  
  if (!fs.existsSync(inputFilePath)) {
    console.error(`❌ Error: Input file not found at ${inputFilePath}`);
    console.error('Please check the INPUT_FILE_PATH constant in the script');
    process.exit(1);
  }

  console.log(`📁 Loading data from: ${INPUT_FILE_PATH}`);
  const parsedData = parseMetaEvaluationFile(inputFilePath);
  const comments = parsedData.comments;
  const topic = parsedData.topic;

  console.log(`📋 Parsed ${comments.length} comments for topic: "${topic}"`);

  // Define the condensation configuration
  const config: CondensationPlan = {
    outputType: CONDENSATION_TYPE.LIKERT.CONS,
    steps: [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 46,
          condensationPrompt: mapPrompt.promptText
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 3, 
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 2, 
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      }
    ],
    nOutputArgs: 3,
    language: 'fi'
  };

  // Create the condensation input
  const input: CondensationRunInput = {
    runId: runId,
    electionId: 'test-election',
    question: {
      id: path.basename(INPUT_FILE_PATH, '.txt'),
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
    console.log(`- Input File: ${INPUT_FILE_PATH}`);
    console.log(`- Topic: ${topic}`);
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