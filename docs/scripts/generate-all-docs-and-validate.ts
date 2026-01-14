#!/usr/bin/env tsx

/**
 * Main script to generate all documentation
 * This orchestrates TypeDoc, component extraction, and route mapping
 */
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import { promisify } from 'util';
import { GENERATED_DIR, GENERATED_OUTPUT } from './docs-scripts.config';

const execAsync = promisify(exec);

/**
 * Main function
 */
async function main() {
  console.info('='.repeat(60));
  console.info('OpenVAA Documentation Generator');
  console.info('='.repeat(60));

  try {
    // Ensure output directories exist
    await ensureDirectories();

    await runCommand('tsx scripts/generate-component-docs.ts', 'Extracting component documentation');
    await runCommand('tsx scripts/generate-route-map.ts', 'Generating route map');
    await runCommand('tsx scripts/move-generated.ts', 'Moving generated files');
    await runCommand('tsx scripts/generate-navigation-config.ts', 'Generating navigation configuration');
    await runCommand('tsx scripts/validate-links.ts', 'Validating documentation links');

    console.info('\n' + '='.repeat(60));
    console.info('✓ Documentation generation complete!');
    console.info('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Documentation generation failed');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Ensure output directory structure exists
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [GENERATED_DIR, GENERATED_OUTPUT.components, GENERATED_OUTPUT.routes];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  console.info('✓ Created output directories');
}

/**
 * Run a command and log output
 */
async function runCommand(command: string, description: string): Promise<void> {
  console.info(`\n${description}...`);
  console.info(`$ ${command}\n`);

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.info(stdout);
    if (stderr) console.error(stderr);
    console.info(`✓ ${description} complete`);
  } catch (error) {
    console.error(
      `✗ ${description} failed:`,
      error && typeof error === 'object' && 'message' in error ? error.message : `${error}`
    );
    throw error;
  }
}

main();
