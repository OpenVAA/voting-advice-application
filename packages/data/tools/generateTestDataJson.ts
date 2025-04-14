/**
 * Generate json files from the test data.
 * @argument - The output folder where the JSON files will be saved. @default 'tools/output'
 */

import fs from 'fs';
import path from 'path';
import { getTestData } from '../src/testUtils/getTestData';

main();

function main(): void {
  const outputFolder = process.argv[2] || undefined;
  console.info('Generating test data JSON files...');
  generateTestDataJson(outputFolder);
  console.info('Done!');
  process.exit(0);
}

/**
 * Generate json files from the test data.
 * @param outputFolder - The output folder where the JSON files will be saved. @default 'output'
 */
export function generateTestDataJson(outputFolder: string = 'tools/output'): void {
  const data = getTestData();
  const folder = path.join('.', outputFolder);
  fs.mkdirSync(folder, { recursive: true });
  for (const [key, value] of Object.entries(data)) {
    const filePath = path.join(folder, `${key}.json`);
    console.info(`-- Writing ${filePath}...`);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  }
}
