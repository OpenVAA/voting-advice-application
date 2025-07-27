import * as fs from 'fs';
import * as path from 'path';
import type { HasAnswers, Id } from '@openvaa/core';
import type { Answer } from '@openvaa/data';

const QUESTION_ID = 'stress-test-question';

async function generateStressTestData() {
  const inputFile = path.join(__dirname, '../../new_src/data/comments/aanestysikaraja.txt');
  const outputDir = path.join(__dirname);
  const outputFile = path.join(outputDir, 'aanestysikaraja.json');

  console.info(`Reading comments from: ${inputFile}`);
  const fileContent = await fs.promises.readFile(inputFile, 'utf-8');

  const lines = fileContent.split('\n');
  const entities: Array<HasAnswers> = [];
  let currentLikertValue: string | null = null;

  for (const line of lines) {
    // Check for header line to update the current Likert value
    const headerMatch = line.match(/^===\sLIKERT_VALUE:(\d+)/);
    if (headerMatch && headerMatch[1]) {
      currentLikertValue = headerMatch[1];
      continue; // Move to the next line after processing header
    }

    // Match comment lines
    const commentMatch = line.match(/^\[\d+\]\sCANDIDATE_ID:\d+\s+"(.+)"$/);
    if (commentMatch && commentMatch[1] && currentLikertValue) {
      const commentText = commentMatch[1];

      const answer: Answer<Id> = {
        value: currentLikertValue,
        info: commentText
      };

      const entity: HasAnswers = {
        answers: {
          [QUESTION_ID]: answer
        }
      };

      entities.push(entity);
    }
  }

  console.info(`Successfully parsed ${entities.length} comments.`);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    console.info(`Creating output directory: ${outputDir}`);
    await fs.promises.mkdir(outputDir, { recursive: true });
  }

  // Write the JSON file
  console.info(`Writing stress test data to: ${outputFile}`);
  await fs.promises.writeFile(outputFile, JSON.stringify(entities, null, 2), 'utf-8');

  console.info('Stress test data generation complete!');
}

generateStressTestData().catch((error) => {
  console.error('An error occurred during stress test data generation:', error);
  process.exit(1);
});
