import { Condenser } from '../../core/condenser';
import { CondensationRunInput, VAAComment, CondensationOutputType } from '../../core/types';
import { CondensationPlan } from '../../core/types/condensation/processDefinition';
import { CondensationOperations } from '../../core/types/condensation/operation';
import { CONDENSATION_TYPE } from '../../core/types/condensationType';
import { OpenAIProvider } from '@openvaa/llm';
import { PromptRegistry } from '../../core/prompts/promptRegistry';
import { MapOperationParams, ReduceOperationParams, GroundingOperationParams } from '../../core/types/condensation/processParams';
import { MetaEvaluationCase } from './types/testCase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../../../../.env') });
console.log('🔧 Loading environment variables from the path:', path.join(__dirname, '../../../../../.env'));

// ================================
// CONFIGURATION - Modify these values
// ================================
const CONFIG = {
  // File paths
  commentFilePath: 'testData/comments/hiilineutraalius.txt',
  jsonFilePath: 'testData/likertPros/fi/hiilineutraalius_v0.json',
  
  // Output configuration
  outputType: CONDENSATION_TYPE.LIKERT.PROS as CondensationOutputType,
  language: 'fi',
  
  // Set to null or undefined to include all Likert values
  includeLikertValues: [5] as number[] | null,
  
  // Prompt IDs to use - modify these to test different prompts
  prompts: {
    mapPromptId: 'map_likertPros_condensation_v1',
    reducePromptId: 'reduce_likertPros_coalescing_v1',
    groundPromptId: 'ground_likertPros_grounding_v1'
  },
  
  // Pipeline parameters
  pipeline: {
    mapBatchSize: 44,
    reduceDenominator: 3, 
    groundBatchSize: 40
  }
} as const;

const OPENAI_API_KEY = process.env.LLM_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: LLM_OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Validation regex patterns for the standardized output format
 */
const VALIDATION_PATTERNS = {
  header: /^=== LIKERT_VALUE:(\d+) LABEL:(.+?) COUNT:(\d+) ===/,
  comment: /^\[(\d+)\] CANDIDATE_ID:(\d+) "(.+)"$/,
  simpleComment: /^\[(\d+)\] "(.+)"$/
};

/**
 * Parses comments from the new standardized text file format
 * Extracts comments with their associated Likert values and candidate IDs
 */
function parseCommentsFromFile(filePath: string, includeLikertValues?: number[] | null): VAAComment[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const comments: VAAComment[] = [];
  const lines = content.split('\n');
  
  let currentLikertValue: string | null = null;
  let currentLikertLabel: string | null = null;
  let commentCounter = 0;
  let filteredCounter = 0; // Track how many comments were filtered out
  
  console.log('📖 Parsing comments with standardized format validation...');
  if (includeLikertValues && includeLikertValues.length > 0) {
    console.log(`🔍 Filtering to only include Likert values: ${includeLikertValues.join(', ')}`);
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and metadata
    if (!line || line.startsWith('='.repeat(100)) || line.startsWith('QUESTION:') || line.startsWith('INFO:') || line.startsWith('Total comments')) {
      continue;
    }
    
    // Check for Likert header
    const headerMatch = line.match(VALIDATION_PATTERNS.header);
    if (headerMatch) {
      currentLikertValue = headerMatch[1];
      currentLikertLabel = headerMatch[2];
      console.log(`📊 Found Likert section: ${currentLikertValue} (${currentLikertLabel})`);
      continue;
    }
    
    // Check for comment with candidate ID
    const commentMatch = line.match(VALIDATION_PATTERNS.comment);
    if (commentMatch && currentLikertValue) {
      const [, commentNumber, candidateId, commentText] = commentMatch;
      
      // Apply Likert value filter if specified
      if (includeLikertValues && includeLikertValues.length > 0) {
        const likertNum = parseInt(currentLikertValue);
        if (!includeLikertValues.includes(likertNum)) {
          filteredCounter++;
          continue; // Skip this comment if its Likert value is not in the include list
        }
      }
      
      commentCounter++;
      
      comments.push({
        id: `comment_${commentCounter}`,
        text: commentText,
        candidateID: candidateId,
        candidateAnswer: currentLikertValue // Store the Likert value as the answer
      });
      continue;
    }
    
    // Check for simple comment format (without candidate ID)
    const simpleCommentMatch = line.match(VALIDATION_PATTERNS.simpleComment);
    if (simpleCommentMatch && currentLikertValue) {
      const [, commentNumber, commentText] = simpleCommentMatch;
      
      // Apply Likert value filter if specified
      if (includeLikertValues && includeLikertValues.length > 0) {
        const likertNum = parseInt(currentLikertValue);
        if (!includeLikertValues.includes(likertNum)) {
          filteredCounter++;
          continue; // Skip this comment if its Likert value is not in the include list
        }
      }
      
      commentCounter++;
      
      comments.push({
        id: `comment_${commentCounter}`,
        text: commentText,
        candidateID: `candidate_${commentNumber}`, // Generate a placeholder ID
        candidateAnswer: currentLikertValue // Store the Likert value as the answer
      });
      continue;
    }
    
    // Log unrecognized lines for debugging
    if (line && !line.startsWith('...')) {
      console.warn(`⚠️  Line ${i + 1}: Unrecognized format: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
    }
  }
  
  console.log(`✅ Parsed ${comments.length} comments from ${commentCounter} entries`);
  if (filteredCounter > 0) {
    console.log(`🚫 Filtered out ${filteredCounter} comments due to Likert value restriction`);
  }
  
  // Group comments by Likert value for summary
  const likertGroups: Record<string, number> = {};
  comments.forEach(comment => {
    const likert = comment.candidateAnswer;
    likertGroups[likert] = (likertGroups[likert] || 0) + 1;
  });
  
  console.log('📊 Comments by Likert value (after filtering):');
  Object.entries(likertGroups).sort().forEach(([likert, count]) => {
    console.log(`   ${likert}: ${count} comments`);
  });
  
  return comments;
}

/**
 * Validates that the input file follows the expected format
 */
function validateInputFormat(filePath: string): { isValid: boolean; errors: string[] } {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors: string[] = [];
  
  let foundHeader = false;
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and metadata
    if (!line || line.startsWith('='.repeat(100)) || line.startsWith('QUESTION:') || line.startsWith('INFO:') || line.startsWith('Total comments')) {
      continue;
    }
    
    if (line.startsWith('===') && line.endsWith('===')) {
      const match = line.match(VALIDATION_PATTERNS.header);
      if (!match) {
        errors.push(`Line ${i + 1}: Invalid header format: ${line}`);
      } else {
        foundHeader = true;
        currentSection = `LIKERT_VALUE:${match[1]}`;
      }
    } else if (line.startsWith('[') && line.includes(']')) {
      const commentMatch = line.match(VALIDATION_PATTERNS.comment);
      const simpleCommentMatch = line.match(VALIDATION_PATTERNS.simpleComment);
      
      if (!commentMatch && !simpleCommentMatch) {
        errors.push(`Line ${i + 1}: Invalid comment format in ${currentSection}: ${line}`);
      }
    } else if (line && !line.startsWith('...')) {
      // Only warn about unrecognized lines that aren't continuation markers
      errors.push(`Line ${i + 1}: Unrecognized format: ${line}`);
    }
  }
  
  if (!foundHeader) {
    errors.push('No valid Likert headers found in file');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Main script function
 */
async function generateSystemArguments() {
  console.log('🚀 Starting System Arguments Generation...\n');

  // Construct file paths relative to this script
  const commentsPath = path.join(__dirname, CONFIG.commentFilePath);
  const jsonPath = path.join(__dirname, CONFIG.jsonFilePath);

  // Check if comment file exists
  if (!fs.existsSync(commentsPath)) {
    console.error(`❌ Error: Comment file not found: ${commentsPath}`);
    console.error('Please update CONFIG.commentFilePath to point to the correct file');
    process.exit(1);
  }

  // Check if JSON file exists
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: JSON test case file not found: ${jsonPath}`);
    console.error('Please update CONFIG.jsonFilePath to point to the correct file');
    process.exit(1);
  }

  // Validate input format
  console.log('🔍 Validating input format...');
  const validation = validateInputFormat(commentsPath);
  if (!validation.isValid) {
    console.error('❌ Input file format validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nExpected format:');
    console.error('  Headers: === LIKERT_VALUE:1 LABEL:Täysin eri mieltä COUNT:207 ===');
    console.error('  Comments: [1] CANDIDATE_ID:5897 "comment text"');
    console.error('  Simple: [1] "comment text"');
    process.exit(1);
  }
  console.log('✅ Input format validation passed');

  // Parse comments from file
  console.log(`\n📖 Parsing comments from: ${CONFIG.commentFilePath}`);
  const comments = parseCommentsFromFile(commentsPath, CONFIG.includeLikertValues);
  
  if (comments.length === 0) {
    console.error('❌ Error: No comments parsed from file');
    process.exit(1);
  }

  // Load existing JSON test case
  console.log(`📋 Loading test case from: ${CONFIG.jsonFilePath}`);
  const testCase: MetaEvaluationCase = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Topic: ${testCase.topic}`);

  // Initialize and load the prompt registry
  console.log('🔧 Loading prompt registry...');
  const promptRegistry = new PromptRegistry();
  await promptRegistry.loadPrompts();

  // Get the prompts from registry using configured IDs
  const mapPrompt = promptRegistry.getPrompt(CONFIG.prompts.mapPromptId);
  const reducePrompt = promptRegistry.getPrompt(CONFIG.prompts.reducePromptId);
  const groundPrompt = promptRegistry.getPrompt(CONFIG.prompts.groundPromptId);

  if (!mapPrompt || !reducePrompt || !groundPrompt) {
    console.error('❌ Error: Required prompts not found in registry');
    console.error(`Missing prompts:`);
    if (!mapPrompt) console.error(`  - MAP: ${CONFIG.prompts.mapPromptId}`);
    if (!reducePrompt) console.error(`  - REDUCE: ${CONFIG.prompts.reducePromptId}`);
    if (!groundPrompt) console.error(`  - GROUND: ${CONFIG.prompts.groundPromptId}`);
    console.error('\nAvailable prompts:');
    promptRegistry.listPrompts().forEach(p => console.error(`  - ${p.promptId} (${p.operation}/${p.outputType})`));
    process.exit(1);
  }

  console.log('🎯 Using prompts:');
  console.log(`  - MAP: ${CONFIG.prompts.mapPromptId}`);
  console.log(`  - REDUCE: ${CONFIG.prompts.reducePromptId}`);
  console.log(`  - GROUND: ${CONFIG.prompts.groundPromptId}`);

  // Define the condensation configuration
  const condensationConfig: CondensationPlan = {
    outputType: CONFIG.outputType,
    steps: [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: CONFIG.pipeline.mapBatchSize,
          condensationPrompt: mapPrompt.promptText
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: CONFIG.pipeline.reduceDenominator,
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      },
      {
        operation: CondensationOperations.GROUND,
        params: {
          groundingPrompt: groundPrompt.promptText,
          batchSize: CONFIG.pipeline.groundBatchSize
        } as GroundingOperationParams
      }
    ],
    nOutputArgs: testCase.goldenArguments.length, // Match number of golden arguments
    language: CONFIG.language
  };

  // Create the condensation input
  const input: CondensationRunInput = {
    runId: `metaeval-kuntavaaalit2025-${Date.now()}`,
    electionId: 'kuntavaaalit2025',
    question: {
      id: 'MOCK QUESTION ID',
      topic: testCase.topic,
      answerType: 'likert-5'
    },
    model: 'gpt-4o',
    comments: comments,
    config: condensationConfig,
    llmProvider: new OpenAIProvider({ 
      apiKey: OPENAI_API_KEY!,
      model: 'gpt-4o'
    })
  };

  try {
    console.log('\n🔧 Configuration:');
    console.log(`- Output Type: ${CONFIG.outputType}`);
    console.log(`- Language: ${CONFIG.language}`);
    console.log(`- Likert Filter: ${CONFIG.includeLikertValues ? CONFIG.includeLikertValues.join(', ') : 'All values'}`);
    console.log(`- Pipeline: ${condensationConfig.steps.map(s => s.operation).join(' → ')}`);
    console.log(`- Target Arguments: ${condensationConfig.nOutputArgs}`);
    console.log(`- Total Comments: ${comments.length}`);

    // Create and run the condenser
    const condenser = new Condenser(input);
    
    console.log('\n🔄 Running condensation process...\n');
    const result = await condenser.run();

    console.log('✅ Condensation completed successfully!');
    console.log('\n📊 Generated Arguments:');
    result.arguments.forEach((arg, index) => {
      console.log(`${index + 1}. ${arg.text}`);
    });

    // Update the test case with system arguments
    testCase.systemArguments = result.arguments;

    // Save the updated test case
    fs.writeFileSync(jsonPath, JSON.stringify(testCase, null, 2));
    console.log(`\n💾 Updated test case saved to: ${jsonPath}`);

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
  generateSystemArguments().catch(console.error);
}

export { generateSystemArguments, parseCommentsFromFile, validateInputFormat }; 