import { type HasAnswers } from '@openvaa/core';
import { DataRoot, QUESTION_TYPE, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import { OpenAIProvider } from '@openvaa/llm';
import { config } from 'dotenv';
import fs from 'fs'; // <-- Import the fs module
import path from 'path';
import { describe, expect, it } from 'vitest';
import { handleQuestion } from '../new_src/core/main.ts';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../../.env') });
const openaiApiKey = process.env.LLM_OPENAI_API_KEY;

// Manually read and parse the JSON file to guarantee an array
const jsonPath = path.resolve(__dirname, './stressTest/aanestysikaraja.json');
const jsonString = fs.readFileSync(jsonPath, 'utf-8');
const entities: Array<HasAnswers> = JSON.parse(jsonString);

describe('Stress Test', () => {
  // This test will only run if an OpenAI API key is available in the environment
  it.runIf(openaiApiKey)(
    'should condense a large number of comments with a real LLM provider',
    async () => {
      // 1. Define the question that matches the data
      const question = new SingleChoiceOrdinalQuestion({
        data: {
          id: 'stress-test-question',
          type: QUESTION_TYPE.SingleChoiceOrdinal,
          name: 'Äänestysikärajaa tulee laskea 16 ikävuoteen kunta- ja aluevaaleissa.',
          categoryId: 'stress-test-category',
          choices: [
            { id: '1', label: 'Strongly disagree', normalizableValue: -0.5 },
            { id: '2', label: 'Disagree', normalizableValue: -0.25 },
            { id: '3', label: 'Neutral', normalizableValue: 0 },
            { id: '4', label: 'Agree', normalizableValue: 0.25 },
            { id: '5', label: 'Strongly agree', normalizableValue: 0.5 }
          ]
        },
        root: new DataRoot()
      });

      // 2. Instantiate a real LLM provider
      const llmProvider = new OpenAIProvider({
        apiKey: openaiApiKey as string,
        model: 'gpt-4o'
      });

      // 3. Run the condensation
      console.info(`Starting stress test with ${entities.length} comments...`);
      const startTime = Date.now();

      const results = await handleQuestion({
        question,
        entities,
        llmProvider,
        language: 'fi', // The comments are in Finnish
        llmModel: 'gpt-4o', 
        maxCommentsPerGroup: 300
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.info(`Stress test finished in ${duration.toFixed(2)} seconds.`);

      // 4. Log the results for manual inspection
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      console.info('--- Condensation Stress Test Results ---');
      results.forEach((result) => {
        console.info(`\n--- Arguments for: ${result.condensationType} ---`);
        if (result.arguments.length > 0) {
          result.arguments.forEach((arg, index) => {
            console.info(`${index + 1}. ${arg.text}`);
          });
        } else {
          console.info('No arguments were generated for this group.');
        }
        console.info('--- Metrics ---');
        console.info(`Duration: ${result.metrics.duration.toFixed(2)}s`);
        console.info(`LLM Calls: ${result.metrics.nLlmCalls}`);
        console.info(`Total Tokens: ${result.metrics.tokensUsed.total}`);
        console.info(`Cost (EUR): €${result.metrics.cost.toFixed(4)}`);
        console.info('---------------');
      });
      console.info('--- End of Stress Test Results ---');
    },
    { timeout: 1500000 } // 25 minutes
  ); 
});
