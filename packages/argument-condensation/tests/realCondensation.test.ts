import * as dotenv from 'dotenv';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { Condenser } from '../new_src/core/condensation/condenser';
import { PromptRegistry } from '../new_src/core/condensation/prompts/promptRegistry';
import {
  CONDENSATION_TYPE,
  CondensationOperations,
  type CondensationPrompt,
  type CondensationRunInput,
  type MapOperationParams,
  type ProcessingStep,
  type ReduceOperationParams
} from '../new_src/core/types';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Define the condensation configuration (mirroring runCondensation.ts)
function createCondensationConfig(
  mapPrompt: CondensationPrompt,
  reducePrompt: CondensationPrompt,
  iterationPrompt: CondensationPrompt
): Array<ProcessingStep> {
  return [
    {
      operation: CondensationOperations.MAP,
      params: {
        batchSize: 2,
        condensationPrompt: mapPrompt.promptText,
        iterationPrompt: iterationPrompt.promptText
      } as MapOperationParams
    },
    {
      operation: CondensationOperations.REDUCE,
      params: {
        denominator: 2,
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
  ];
}

// Mock question object (minimal structure to avoid workspace dependencies)
const mockQuestion = {
  id: 'voting-age-question',
  type: 'singleChoiceOrdinal' as const,
  text: 'Äänestysikärajaa tulee laskea 16 ikävuoteen kunta- ja aluevaaleissa.',
  answerType: 'number' as const
};

// Test comments (similar to the parsed file format in runCondensation.ts)
const mockComments = [
  {
    id: 'comment-1',
    candidateID: 'candidate-827',
    candidateAnswer: 5,
    text: 'Nuorten tulisi saada äänioikeus, koska he ovat tulevaisuuden päätöksentekijöitä.'
  },
  {
    id: 'comment-2',
    candidateID: 'candidate-425',
    candidateAnswer: 5,
    text: 'Äänestysikärajan laskeminen lisäisi nuorten osallistumista demokraattiseen prosessiin.'
  },
  {
    id: 'comment-3',
    candidateID: 'candidate-331',
    candidateAnswer: 4,
    text: 'Nuoret ovat hyvin perillä paikallisista asioista koulujen opetuksen kautta.'
  },
  {
    id: 'comment-4',
    candidateID: 'candidate-192',
    candidateAnswer: 1,
    text: 'Nuorilla ei ole vielä riittävää kypsyyttä tehdä tietoisia päätöksiä äänestämisessä.'
  },
  {
    id: 'comment-5',
    candidateID: 'candidate-558',
    candidateAnswer: 2,
    text: 'Kuusitoistavuotiaat eivät ole vielä kognitiivisesti täysin kehittyneitä tällaisiin päätöksiin.'
  },
  {
    id: 'comment-6',
    candidateID: 'candidate-712',
    candidateAnswer: 5,
    text: 'Nuoret maksavat veroja ja heidän tulisi saada vaikuttaa verovarojen käyttöön.'
  },
  {
    id: 'comment-7',
    candidateID: 'candidate-893',
    candidateAnswer: 4,
    text: 'Kunnallispolitiikka vaikuttaa nuorten arkeen, joten heillä tulisi olla sananvalta.'
  },
  {
    id: 'comment-8',
    candidateID: 'candidate-456',
    candidateAnswer: 1,
    text: 'Äänestäminen vaatii elämänkokemusta, jota 16-vuotiailla ei vielä ole.'
  }
];

describe('Real Condensation Test', () => {
  it('should run real condensation with OpenAI provider (if API key available)', async () => {
    // Check for API key
    const apiKey = process.env.LLM_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Skipping real condensation test - LLM_OPENAI_API_KEY not found');
      return;
    }

    // Configuration (mirroring runCondensation.ts)
    const condensationType = CONDENSATION_TYPE.LIKERT.PROS;
    const mapPromptId = `map_${condensationType}_condensation_v1`;
    const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
    const iterationPromptId = `map_${condensationType}_feedback_v1`;

    // Initialize prompt registry
    const promptRegistry = await PromptRegistry.create('fi');

    // Get prompts for the MAP → REDUCE → REDUCE pipeline
    const mapPrompt = promptRegistry.getPrompt(mapPromptId) as CondensationPrompt;
    const reducePrompt = promptRegistry.getPrompt(reducePromptId) as CondensationPrompt;
    const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as CondensationPrompt;

    if (!mapPrompt || !reducePrompt || !iterationPrompt) {
      throw new Error('Required prompts not found in registry');
    }

    // Create condensation configuration
    const config = createCondensationConfig(mapPrompt, reducePrompt, iterationPrompt);

    // Filter comments for PROS (candidateAnswer >= 4)
    const prosComments = mockComments.filter((c) => c.candidateAnswer >= 4);

    // Dynamic import of OpenAI provider to avoid workspace issues
    const { OpenAIProvider } = await import('@openvaa/llm');

    // Create condensation input (mirroring runCondensation.ts structure)
    const input = {
      question: mockQuestion,
      comments: prosComments,
      options: {
        runId: 'real-test-1',
        electionId: '2025_test_election',
        maxCommentsPerGroup: 200,
        model: 'gpt-4o-mini', // Use cheaper model for testing
        language: 'fi',
        processingSteps: config,
        llmProvider: new OpenAIProvider({
          apiKey: apiKey,
          model: 'gpt-4o-mini',
          fallbackModel: 'gpt-4'
        }),
        outputType: condensationType
      }
    };

    // Run condensation
    const condenser = new Condenser(input as unknown as CondensationRunInput);
    const result = await condenser.run();

    // Verify results
    expect(result).toBeDefined();
    expect(result.condensationType).toBe(CONDENSATION_TYPE.LIKERT.PROS);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.nLlmCalls).toBeGreaterThan(0);
    expect(result.metrics.duration).toBeGreaterThan(0);
    expect(result.metrics.tokensUsed.total).toBeGreaterThan(0);
    expect(result.metrics.cost).toBeGreaterThan(0);

    // Verify we got actual arguments
    expect(result.arguments).toBeDefined();
    expect(Array.isArray(result.arguments)).toBe(true);

    // Log real results for inspection
    console.info('\n🎉 Real Condensation Results:');
    console.info(`- Condensation Type: ${result.condensationType}`);
    console.info(`- Input Comments: ${prosComments.length}`);
    console.info(`- Generated Arguments: ${result.arguments?.length || 0}`);
    console.info(`- LLM Calls: ${result.metrics.nLlmCalls}`);
    console.info(`- Duration: ${result.metrics.duration.toFixed(3)}s`);
    console.info(`- Tokens Used: ${result.metrics.tokensUsed.total}`);
    console.info(`- Cost: $${result.metrics.cost.toFixed(6)}`);

    if (result.arguments && result.arguments.length > 0) {
      console.info('\n📝 Generated Arguments:');
      result.arguments.forEach((arg, i) => {
        console.info(`${i + 1}. ${arg.text}`);
      });
    }
  }, 60000); // 60 second timeout for real LLM calls

  it('should handle CONS condensation with real LLM', async () => {
    const apiKey = process.env.LLM_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Skipping CONS condensation test - LLM_OPENAI_API_KEY not found');
      return;
    }

    const condensationType = CONDENSATION_TYPE.LIKERT.CONS;
    const mapPromptId = `map_${condensationType}_condensation_v1`;
    const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
    const iterationPromptId = `map_${condensationType}_feedback_v1`;

    const promptRegistry = await PromptRegistry.create('fi');
    const mapPrompt = promptRegistry.getPrompt(mapPromptId) as CondensationPrompt;
    const reducePrompt = promptRegistry.getPrompt(reducePromptId) as CondensationPrompt;
    const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as CondensationPrompt;

    if (!mapPrompt || !reducePrompt || !iterationPrompt) {
      throw new Error('Required CONS prompts not found in registry');
    }

    const config = createCondensationConfig(mapPrompt, reducePrompt, iterationPrompt);

    // Filter comments for CONS (candidateAnswer <= 2)
    const consComments = mockComments.filter((c) => c.candidateAnswer <= 2);

    const { OpenAIProvider } = await import('@openvaa/llm');

    const input = {
      question: mockQuestion,
      comments: consComments,
      options: {
        runId: 'real-cons-test-1',
        electionId: '2025_test_election',
        maxCommentsPerGroup: 200,
        model: 'gpt-4o-mini',
        language: 'fi',
        processingSteps: config,
        llmProvider: new OpenAIProvider({
          apiKey: apiKey,
          model: 'gpt-4o-mini',
          fallbackModel: 'gpt-4'
        }),
        outputType: condensationType
      }
    };

    const condenser = new Condenser(input as unknown as CondensationRunInput);
    const result = await condenser.run();

    expect(result.condensationType).toBe(CONDENSATION_TYPE.LIKERT.CONS);
    expect(result.metrics.nLlmCalls).toBeGreaterThan(0);
    expect(result.arguments).toBeDefined();

    console.info(`\n🔄 CONS condensation completed with ${result.arguments?.length || 0} arguments`);
  }, 60000);
});
