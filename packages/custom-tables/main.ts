import { OpenAIProvider, setPromptVars } from '@openvaa/llm';
import { exec } from 'child_process';
import { config } from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { promisify } from 'util';
import { TABLE_JSON_FORMAT_NO_EVICENCE } from './src/types';
import type { TableJsonData } from './src/types';

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

const response = await llm.generateAndValidateWithRetry({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: dataPromptWithCandidates }
  ],
  responseContract: TABLE_JSON_FORMAT_NO_EVICENCE
});

// Ensure the outputs directory exists
const outputDir = join(__dirname, 'src', 'data', 'outputs');
try {
  mkdirSync(outputDir, { recursive: true });
} catch {
  // Directory might already exist, which is fine
}

// Save the parsed result to the specified file
const outputPath = join(outputDir, `${outputFileName}`);
writeFileSync(outputPath, JSON.stringify(response.parsed, null, 2), 'utf8');

// -------------------------------------------------------------------------
// ---------------- Visualization: Static HTML + auto-open -----------------
// -------------------------------------------------------------------------

const execAsync = promisify(exec);

/**
 * Escape a string for safe HTML rendering.
 * @param param0.value The input string to escape
 * @returns The escaped HTML-safe string
 */
function escapeHtml({ value }: { value: string }): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate a self-contained HTML visualization for the table JSON data.
 * The result is a responsive table with categories as rows and candidates as columns.
 *
 * @param param0.data The parsed JSON data following the `TableJsonData` contract
 * @returns The complete HTML document as a string
 */
function generateVisualizationHTML({ data }: { data: TableJsonData }): string {
  const candidates: Array<string> = Object.keys(data.candidate_positions ?? {});
  const categories = data.categories ?? [];

  const tableHead = `
    <thead>
      <tr>
        <th class="sticky-col">Theme</th>
        ${candidates.map((c) => `<th>${escapeHtml({ value: c })}</th>`).join('')}
      </tr>
    </thead>`;

  const tableBody = `
    <tbody>
      ${categories
        .map((category) => {
          const categoryLabel = escapeHtml({ value: category.label });
          const categoryDescription = escapeHtml({ value: category.description ?? '' });
          const rowCells = candidates
            .map((candidate) => {
              const value = data.candidate_positions?.[candidate]?.[category.label] ?? '—';
              return `<td>${escapeHtml({ value: String(value) })}</td>`;
            })
            .join('');
          return `
            <tr>
              <td class="sticky-col" title="${categoryDescription}">
                <div class="category">
                  <div class="label">${categoryLabel}</div>
                  ${categoryDescription ? `<div class="description">${categoryDescription}</div>` : ''}
                </div>
              </td>
              ${rowCells}
            </tr>`;
        })
        .join('')}
    </tbody>`;

  const reasoning = escapeHtml({ value: data.reasoning ?? '' });

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custom Tables Visualization</title>
    <style>
      :root {
        --border: #e5e7eb;
        --bg: #ffffff;
        --bg-alt: #f9fafb;
        --text: #111827;
        --muted: #6b7280;
        --sticky-bg: #f3f4f6;
      }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 0; padding: 16px; color: var(--text); background: var(--bg); }
      header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
      h1 { font-size: 18px; margin: 0; }
      .controls { display: flex; gap: 8px; }
      button { border: 1px solid var(--border); background: var(--bg); padding: 6px 10px; border-radius: 6px; cursor: pointer; }
      button:hover { background: var(--bg-alt); }
      details { margin-bottom: 12px; }
      summary { cursor: pointer; color: var(--muted); }
      .table-wrapper { overflow: auto; border: 1px solid var(--border); border-radius: 8px; }
      table { border-collapse: separate; border-spacing: 0; width: 100%; }
      thead th { position: sticky; top: 0; background: var(--sticky-bg); z-index: 1; text-align: left; font-weight: 600; }
      th, td { border-bottom: 1px solid var(--border); padding: 8px 10px; vertical-align: top; white-space: nowrap; }
      tbody tr:nth-child(odd) { background: var(--bg-alt); }
      .sticky-col { position: sticky; left: 0; background: var(--sticky-bg); z-index: 2; min-width: 240px; max-width: 480px; }
      .category .label { font-weight: 600; }
      .category .description { color: var(--muted); font-size: 12px; margin-top: 2px; white-space: normal; }
      footer { margin-top: 12px; color: var(--muted); font-size: 12px; }
    </style>
    <script>
      function exportTableToCSV() {
        const rows = Array.from(document.querySelectorAll('table tr'));
        const csv = rows.map(row => Array.from(row.querySelectorAll('th,td')).map(cell => {
          // Escape quotes and commas
          const text = cell.innerText.replace(/"/g, '""');
          return '"' + text + '"';
        }).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'table.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    </script>
  </head>
  <body>
    <header>
      <h1>Custom Tables Visualization</h1>
      <div class="controls">
        <button onclick="exportTableToCSV()">Export CSV</button>
        <button onclick="window.print()">Print</button>
      </div>
    </header>
    ${reasoning ? `<details><summary>Reasoning</summary><div style="margin-top:8px; white-space: pre-wrap;">${reasoning}</div></details>` : ''}
    <div class="table-wrapper">
      <table>
        ${tableHead}
        ${tableBody}
      </table>
    </div>
    <footer>
      Generated at ${new Date().toLocaleString()}
    </footer>
  </body>
  </html>`;
}

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
const htmlContent = generateVisualizationHTML({ data: response.parsed as TableJsonData });
const htmlPath = join(outputDir, `${outputFileName}.html`);
writeFileSync(htmlPath, htmlContent, 'utf8');
await openFileInDefaultBrowser({ filePath: htmlPath });
