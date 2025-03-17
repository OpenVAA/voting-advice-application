import fs from 'fs';
import csvParser from 'csv-parser';
import { processComments, finnishConfig } from '../src';
import { OpenAIProvider } from '@openvaa/llm';
import { config } from 'dotenv';
import path from 'path';
import { CondensationType } from '../src/types/CondensationType';

// Load environment variables
const envPath = path.join(__dirname, '../../../.env');
config({ path: envPath });

// Initialize OpenAI provider with API key from environment
const llmProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4o-mini'
});

/**
 * Uses the argument condensation logic to condense multiple explanations into a summary
 */
async function condenseExplanations(explanations: string[]): Promise<string> {
  if (explanations.length === 0) {
    return "No explanations available to condense.";
  }

  // Process the explanations using the condensation logic
  const condensedArguments = await processComments(
    llmProvider,
    finnishConfig,
    explanations,
    "Kaikille vanhuksille on taattava oikeus palvelukotipaikkaan.",
    30, // batch size
    CondensationType.SUPPORTING // condensation type
  );

  // Return the condensed argument(s)
  return condensedArguments.map(arg => arg.argument).join("\n\n");
}

/**
 * Function to condense specific questions based on provided indices
 */
async function condenseQuestionsByIndices(questionIndices: number[]) {
  const allExplanations = await extractAllExplanations();
  
  for (const index of questionIndices) {
    if (index < 1 || index > 23) {
      console.log(`Question index ${index} is out of range (valid range: 1-23)`);
      continue;
    }
    
    const questionExplanations = allExplanations[index - 1];
    console.log(`\nQuestion ${index} (${questionExplanations.length} explanations):`);
    
    // Display the first 2 explanations as examples
    for (let i = 0; i < Math.min(2, questionExplanations.length); i++) {
      console.log(`  Example ${i + 1}: ${questionExplanations[i].substring(0, 100)}...`);
    }
    
    // Condense the explanations
    const testSet = questionExplanations.slice(0, 300);
    const condensed = await condenseExplanations(testSet);
    console.log(`\nCondensed result: ${condensed}`);
    console.log('-'.repeat(80));
  }
}

/**
 * Test function to extract explanations from the kuntavaalit2021.csv file
 * and format them into an array of arrays based on the specified structure.
 */
async function extractAllExplanations(): Promise<string[][]> {
  const results: string[][] = Array.from({ length: 23 }, () => []); // Initialize array for 23 questions

  const filePath = path.join(__dirname, '../data/sources/kuntavaalit2021.csv');

  return new Promise<string[][]>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: Record<string, string>) => {
        for (let i = 1; i <= 23; i++) {
          const explanationKey = `q${i}.explanation_fi`;
          if (row[explanationKey]) {
            results[i - 1].push(row[explanationKey]); // Push explanation to the corresponding question index
          }
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

// Run the condensation function for questions 1, 5, and 10
condenseQuestionsByIndices([8]).catch(console.error);
