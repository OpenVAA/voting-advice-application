import { OpenAIProvider } from '@openvaa/llm';
import * as dotenv from 'dotenv';
import fs from 'fs';
import * as path from 'path';
import { Condenser } from '../core/condenser';
import { PromptRegistry } from '../core/prompts/promptRegistry';
import {
  CONDENSATION_TYPE,
  CondensationOperations,
  CondensationPlan,
  CondensationPrompt,
  CondensationRunInput,
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams} from '../core/types';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Configure the run
const condensationType = CONDENSATION_TYPE.LIKERT.PROS;
const runId = 'battre_test_v1';
const topic = 'Äänestysikärajaa tulee laskea 16 ikävuoteen kunta- ja aluevaaleissa.';
const INPUT_FILE_PATH = '../data/comments/aanestysikaraja.txt';
const nCommentsPerLikert = new Map<number, number>([
  [1, 0], // Include max 15 comments with Likert value 1
  [2, 0], // Include max 12 comments with Likert value 2
  [3, 0], // Include max 10 comments with Likert value 3
  [4, 150], // Include max 12 comments with Likert value 4
  [5, 300] // Include max 15 comments with Likert value 5
]);

// Get prompts according to the condensation type
const mapPromptId = `map_${condensationType}_condensation_v1`;
const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
const iterationPromptId = `map_${condensationType}_feedback_v1`; // Dynamic ID based on condensation type

// Define the condensation configuration here (in a function because top-level definition of the prompt registry is not allowed)
function createCondensationConfig(
  mapPrompt: CondensationPrompt,
  reducePrompt: CondensationPrompt,
  iterationPrompt: CondensationPrompt
): CondensationPlan {
  return {
    outputType: condensationType,
    steps: [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 15,
          condensationPrompt: mapPrompt.promptText,
          iterationPrompt: iterationPrompt.promptText
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 5,
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 6,
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      }
    ],
    nOutputArgs: 3,
    language: 'fi'
  };
}

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Function to parse the metaevaluation test data format
function parseMetaEvaluationFile(filePath: string): {
  topic: string;
  comments: Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }>;
} {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

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

/**
 * Filter comments based on the nCommentsPerLikert configuration.
 * For each Likert value, randomly selects up to the specified number of comments.
 * @param comments Array of all comments
 * @param nCommentsPerLikert Map of Likert value to max number of comments
 * @returns Filtered array of comments
 */
function filterCommentsByLikert(
  comments: Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }>,
  nCommentsPerLikert: Map<number, number>
): Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }> {
  // Group comments by Likert value
  const commentsByLikert = new Map<
    number,
    Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }>
  >();

  for (const comment of comments) {
    const likertValue = comment.candidateAnswer;
    if (!commentsByLikert.has(likertValue)) {
      commentsByLikert.set(likertValue, []);
    }
    commentsByLikert.get(likertValue)!.push(comment);
  }

  // Filter comments for each Likert value
  const filteredComments: Array<{ id: string; candidateID: string; candidateAnswer: number; text: string }> = [];
  const likertStats: Array<{ likert: number; original: number; filtered: number }> = [];

  for (const [likertValue, likertComments] of commentsByLikert.entries()) {
    const maxComments = nCommentsPerLikert.get(likertValue);
    let selectedComments = likertComments;

    if (maxComments !== undefined && likertComments.length > maxComments) {
      // Randomly shuffle and select the specified number of comments
      const shuffled = [...likertComments].sort(() => Math.random() - 0.5);
      selectedComments = shuffled.slice(0, maxComments);
    }

    filteredComments.push(...selectedComments);
    likertStats.push({
      likert: likertValue,
      original: likertComments.length,
      filtered: selectedComments.length
    });
  }

  // Sort stats by Likert value for consistent output
  likertStats.sort((a, b) => a.likert - b.likert);

  // Log filtering statistics
  console.info('📊 Comment Filtering Statistics:');
  for (const stat of likertStats) {
    const wasFiltered = stat.original > stat.filtered;
    const status = wasFiltered ? `(filtered from ${stat.original})` : '(all included)';
    console.info(`   Likert ${stat.likert}: ${stat.filtered} comments ${status}`);
  }
  console.info(`   Total: ${filteredComments.length} comments (from ${comments.length} original)\n`);

  return filteredComments;
}

async function runCondensationScript() {
  console.info('🚀 Starting Argument Condensation Script...\n');

  // Check for required environment variables
  const apiKey = process.env.LLM_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: LLM_OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  // Initialize and load the prompt registry
  const promptRegistry = await PromptRegistry.create('fi');
  console.info('condensation script: prompt registry created and loaded successfully');

  // Get the prompts for the MAP → REDUCE → GROUND pipeline
  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as CondensationPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as CondensationPrompt;
  const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as CondensationPrompt;

  if (!mapPrompt || !reducePrompt || !iterationPrompt) {
    console.error('❌ Error: Required prompts not found in registry');
    console.error('Available prompts:', promptRegistry.listPrompts());
    process.exit(1);
  }

  // Create the condensation configuration
  const config = createCondensationConfig(mapPrompt, reducePrompt, iterationPrompt);

  // Parse the metaevaluation test data file
  const inputFilePath = path.join(__dirname, INPUT_FILE_PATH);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`❌ Error: Input file not found at ${inputFilePath}`);
    console.error('Please check the INPUT_FILE_PATH constant in the script');
    process.exit(1);
  }

  console.info(`📁 Loading data from: ${INPUT_FILE_PATH}`);
  const parsedData = parseMetaEvaluationFile(inputFilePath);
  const comments = parsedData.comments;
  const topic = parsedData.topic;

  console.info(`📋 Parsed ${comments.length} comments for topic: "${topic}"`);

  // Filter comments based on the nCommentsPerLikert configuration
  const filteredComments = filterCommentsByLikert(comments, nCommentsPerLikert);

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
    comments: filteredComments,
    config: config,
    llmProvider: new OpenAIProvider({
      apiKey: apiKey,
      model: 'gpt-4o',
      fallbackModel: 'gpt-4.1'
    })
  };

  const mapParams = config.steps[0].params as MapOperationParams;
  const reduceParams = config.steps[1].params as ReduceOperationParams;
  const groundStep = config.steps.find((step) => step.operation === CondensationOperations.GROUND);
  const groundParams = groundStep?.params as GroundingOperationParams | undefined;

  try {
    console.info('📋 Configuration:');
    console.info(`- Input File: ${INPUT_FILE_PATH}`);
    console.info(`- Topic: ${topic}`);
    console.info('- Comment Filtering: ');
    for (const [likert, maxComments] of nCommentsPerLikert.entries()) {
      console.info(`  • Likert ${likert}: max ${maxComments} comments`);
    }
    console.info(`- Pipeline: ${config.steps.map((s) => s.operation).join(' → ')}`);
    console.info(`- MAP Batch Size: ${mapParams.batchSize}`);
    console.info(`- REDUCE Denominator: ${reduceParams.denominator}`);
    if (groundParams) {
      console.info(`- GROUND Batch Size: ${groundParams.batchSize}`);
    }
    console.info(`- Output Type: ${config.outputType}`);
    console.info(`- Target Arguments: ${config.nOutputArgs}`);
    console.info(`- Total Comments (after filtering): ${filteredComments.length}`);
    console.info(`- Expected MAP Batches: ${Math.ceil(filteredComments.length / mapParams.batchSize)}`);
    console.info(`- REDUCE will coalesce ${reduceParams.denominator} lists at a time`);
    if (groundParams) {
      console.info(`- GROUND will use ${groundParams.batchSize} comments for evidence`);
    }
    console.info('');

    // Create and run the condenser
    const condenser = new Condenser(input);

    console.info('\n\n 🔄 Running condensation process...\n');
    const result = await condenser.run();

    console.info('✅ Condensation completed successfully!');
    console.info('\n📈 Metrics:');
    console.info(`- LLM Calls: ${result.metrics.nLlmCalls}`);
    console.info(`- Duration: ${result.metrics.duration}s`);
    console.info(`- Tokens Used: ${result.metrics.tokensUsed.total}`);
    console.info(`- Estimated Cost: $${result.metrics.cost}`);
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
