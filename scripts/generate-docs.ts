#!/usr/bin/env tsx
/**
 * Main script to generate all documentation
 * This orchestrates TypeDoc, component extraction, and route mapping
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const OUTPUT_DIR = 'docs/generated';
const INDEX_FILE = path.join(OUTPUT_DIR, 'README.md');

/**
 * Run a command and log output
 */
async function runCommand(command: string, description: string): Promise<void> {
  console.log(`\n${description}...`);
  console.log(`$ ${command}\n`);

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✓ ${description} complete`);
  } catch (error: any) {
    console.error(`✗ ${description} failed:`, error.message);
    throw error;
  }
}

/**
 * Create main index file
 */
async function createIndex(): Promise<void> {
  const lines: string[] = [];

  lines.push(`# OpenVAA Documentation\n`);
  lines.push(`> Auto-generated documentation for the OpenVAA project\n`);
  lines.push(`## Contents\n`);
  lines.push(`### API Documentation\n`);
  lines.push(`TypeDoc-generated API documentation for TypeScript packages and frontend libraries.\n`);
  lines.push(`- [API Reference](./api/README.md)\n`);
  lines.push(`### Component Documentation\n`);
  lines.push(`Documentation extracted from Svelte component \`@component\` docstrings.\n`);
  lines.push(`- [Component Reference](./components/README.md)\n`);
  lines.push(`### Route Map\n`);
  lines.push(`Map of all SvelteKit routes in the frontend application.\n`);
  lines.push(`- [Route Map](./routes/README.md)\n`);
  lines.push(`### Frontend Library Documentation\n`);
  lines.push(`TypeDoc documentation for non-component frontend code.\n`);
  lines.push(`- [Contexts](./api/frontend/contexts/README.md) - Svelte contexts`);
  lines.push(`- [Utils](./api/frontend/utils/README.md) - Utility functions`);
  lines.push(`- [API](./api/frontend/api/README.md) - API adapters and data providers\n`);
  lines.push(`### Package Documentation\n`);
  lines.push(`TypeDoc documentation for shared packages.\n`);
  lines.push(`- [@openvaa/core](./api/packages/core/README.md) - Core types and interfaces`);
  lines.push(`- [@openvaa/data](./api/packages/data/README.md) - Universal data model`);
  lines.push(`- [@openvaa/matching](./api/packages/matching/README.md) - Matching algorithms`);
  lines.push(`- [@openvaa/filters](./api/packages/filters/README.md) - Entity filtering`);
  lines.push(`- [@openvaa/app-shared](./api/packages/app-shared/README.md) - Shared application code`);
  lines.push(`- [@openvaa/llm](./api/packages/llm/README.md) - LLM integrations`);
  lines.push(`- [@openvaa/argument-condensation](./api/packages/argument-condensation/README.md) - Argument processing`);
  lines.push(`- [@openvaa/question-info](./api/packages/question-info/README.md) - Question metadata\n`);
  lines.push(`---\n`);
  lines.push(`*Documentation generated on ${new Date().toISOString()}*\n`);

  await fs.writeFile(INDEX_FILE, lines.join('\n'), 'utf-8');
  console.log(`✓ Created index: ${INDEX_FILE}`);
}

/**
 * Create a TypeDoc configuration for frontend-only documentation
 */
async function createFrontendTypedocConfig(): Promise<void> {
  const config = {
    $schema: 'https://typedoc.org/schema.json',
    name: 'Frontend Library Documentation',
    entryPointStrategy: 'expand',
    entryPoints: [
      'frontend/src/lib/contexts',
      'frontend/src/lib/utils',
      'frontend/src/lib/api'
    ],
    exclude: [
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/testUtils/**',
      '**/*.d.ts',
      '**/components/**'
    ],
    out: 'docs/generated/api/frontend',
    plugin: ['typedoc-plugin-markdown'],
    readme: 'none',
    excludePrivate: true,
    githubPages: false,
    sourceLinkTemplate:
      'https://github.com/OpenVAA/voting-advice-application/blob/{gitRevision}/{path}#L{line}'
  };

  await fs.writeFile(
    'typedoc.frontend.json',
    JSON.stringify(config, null, 2),
    'utf-8'
  );
  console.log('✓ Created frontend TypeDoc config');
}

/**
 * Ensure output directory structure exists
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'api'),
    path.join(OUTPUT_DIR, 'components'),
    path.join(OUTPUT_DIR, 'routes')
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  console.log('✓ Created output directories');
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('OpenVAA Documentation Generator');
  console.log('='.repeat(60));

  try {
    // Ensure output directories exist
    await ensureDirectories();

    // Step 1: Generate TypeDoc for packages and frontend libs
    await runCommand('yarn docs:typedoc', 'Generating TypeDoc for packages');

    // Step 2: Generate TypeDoc for frontend libraries
    await createFrontendTypedocConfig();
    await runCommand(
      'typedoc --options typedoc.frontend.json',
      'Generating TypeDoc for frontend libraries'
    );

    // Step 3: Extract Svelte component documentation
    await runCommand('yarn docs:components', 'Extracting component documentation');

    // Step 4: Generate route map
    await runCommand('yarn docs:routes', 'Generating route map');

    // Step 5: Create main index
    await createIndex();

    console.log('\n' + '='.repeat(60));
    console.log('✓ Documentation generation complete!');
    console.log('='.repeat(60));
    console.log(`\nGenerated documentation in: ${OUTPUT_DIR}`);
    console.log(`Main index: ${INDEX_FILE}\n`);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Documentation generation failed');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

main();
