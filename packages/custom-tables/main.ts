import { OpenAIProvider, setPromptVars } from '@openvaa/llm';
import { exec } from 'child_process';
import { config } from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { promisify } from 'util';
import {
  TABLE_JSON_MINIMAL,
  TABLE_JSON_WITH_CONFIDENCE,
  type TableJsonMinimal,
  type TableJsonWithConfidence
} from './src/types';
import { generateVisualizationHTML } from './src/utils';

config({ path: '../../.env' });
const apiKey = process.env.LLM_OPENAI_API_KEY ?? '';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: bun run main.ts <promptFileName> <outputFileName>');
  console.error('Example: bun run main.ts v0.yaml test-results');
  process.exit(1);
}

const promptFileName = args[0];
const outputFileName = args[1];

// Read and parse the YAML file dynamically based on promptId
const yamlContent = readFileSync(join(__dirname, 'src', 'prompts', `${promptFileName}`), 'utf8');
const promptData = yaml.load(yamlContent) as {
  promptId: string;
  params: Array<{ [key: string]: string }>;
  description: string;
  dataPrompt: string;
  systemPrompt: string;
};

// Read the test candidates data
const candidatesInformation = readFileSync(join(__dirname, 'src', 'data', 'inputs', 'testSet0.txt'), 'utf8');

// Embed the candidates information into the data prompt using setPromptVars
const dataPromptWithCandidates = setPromptVars({
  promptText: promptData.dataPrompt,
  variables: { candidatesInformation }
});

// Extract the system prompt from the parsed YAML
const systemPrompt = promptData.systemPrompt;

const llm = new OpenAIProvider({
  apiKey,
  model: 'gpt-4o'
});

const useWithConfidence = /v2_withConfidence/i.test(promptFileName); // For now assume only this is the one with confidence

let parsedData: TableJsonMinimal | TableJsonWithConfidence;
if (useWithConfidence) {
  const response = await llm.generateAndValidateWithRetry<TableJsonWithConfidence>({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dataPromptWithCandidates }
    ],
    responseContract: TABLE_JSON_WITH_CONFIDENCE
  });
  parsedData = response.parsed;
} else {
  const response = await llm.generateAndValidateWithRetry<TableJsonMinimal>({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dataPromptWithCandidates }
    ],
    responseContract: TABLE_JSON_MINIMAL
  });
  parsedData = response.parsed;
}

// Ensure the outputs directory exists
const outputDir = join(__dirname, 'src', 'data', 'outputs');
try {
  mkdirSync(outputDir, { recursive: true });
} catch {
  // Directory might already exist, which is fine
}

// Save the parsed result to the specified file
const outputPath = join(outputDir, `${outputFileName}`);
writeFileSync(outputPath, JSON.stringify(parsedData, null, 2), 'utf8');

// -------------------------------------------------------------------------
// ---------------- Visualization: Static HTML + auto-open -----------------
// -------------------------------------------------------------------------

const execAsync = promisify(exec);

/**
 * Open a local file in the OS default browser.
 * @param param0.filePath Absolute path to the file to open
 */
async function openFileInDefaultBrowser({ filePath }: { filePath: string }): Promise<void> {
  const platform = process.platform;
  const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start ""' : 'xdg-open';
  try {
    await execAsync(`${openCommand} "${filePath}"`);
    console.info('Opened visualization in default browser');
  } catch (error) {
    console.error('Could not auto-open browser:', error);
  }
}

// Generate HTML visualization and open it
const htmlContent = generateVisualizationHTML({ data: parsedData });
const htmlPath = join(outputDir, `${outputFileName}.html`);
writeFileSync(htmlPath, htmlContent, 'utf8');
await openFileInDefaultBrowser({ filePath: htmlPath });
