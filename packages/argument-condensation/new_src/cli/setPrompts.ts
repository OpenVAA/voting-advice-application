#!/usr/bin/env node

import { PromptRegistry } from '../core/prompts/promptRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CliArgs } from './types/cliArgs';

/**
 * Parses command line arguments.
 * 
 * @returns The parsed arguments.
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-i':
      case '--initial':
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          parsed.initial = args[++i];
        } else {
          parsed.showInitial = true;
        }
        break;
      case '-m':
      case '--main':
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          parsed.main = args[++i];
        } else {
          parsed.showMain = true;
        }
        break;
      case '-f':
      case '--improve':
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          parsed.improve = args[++i];
        } else {
          parsed.showImprove = true;
        }
        break;
      case '-h':
      case '--help':
        parsed.help = true;
        break;
      case 'showAvailable':
        parsed.showAvailable = true;
        break;
    }
  }
  
  return parsed;
}

function showHelp() {
  console.log(`
🔧 Set Prompts CLI Tool

Usage: yarn tsx new_src/cli/setPrompts.ts [options]

Options:
  -i, --initial <promptId>    Set initial condensation prompt
  -m, --main <promptId>       Set main condensation prompt  
  -f, --improve <promptId>    Set argument improvement prompt
  -h, --help                  Show this help message

Commands:
  showAvailable               Show all available prompts
  -i, --initial               Show only initial condensation prompts
  -m, --main                  Show only main condensation prompts
  -f, --improve               Show only argument improvement prompts

Examples:
  yarn tsx new_src/cli/setPrompts.ts --i initializePros_v0
  yarn tsx new_src/cli/setPrompts.ts showAvailable
  yarn tsx new_src/cli/setPrompts.ts -i
  yarn tsx new_src/cli/setPrompts.ts -m
`);
}

/**
 * Shows all available prompts for a given phase or all phases.
 * 
 * @param registry The prompt registry.
 * @param filter The filter to apply to the prompts.
 */
function showAvailablePrompts(registry: PromptRegistry, filter?: 'initial' | 'main' | 'improve') {
  const availablePrompts = registry.listPrompts();
  
  if (filter) {
    const filteredPrompts = availablePrompts.filter(p => {
      switch (filter) {
        case 'initial': return p.phase === 'initialCondensation';
        case 'main': return p.phase === 'mainCondensation';
        case 'improve': return p.phase === 'finalImprovements';
        default: return true;
      }
    });
    
    if (filteredPrompts.length === 0) {
      console.log(`📋 No ${filter} prompts available.`);
      return;
    }
    
    console.log(`📋 Available ${filter} prompts:`);
    filteredPrompts.forEach(p => {
      if (p.phase === 'initialCondensation') {
        console.log(`   ${p.promptId} (${p.phase}/${p.outputType})`);
      } else {
        console.log(`   ${p.promptId} (${p.phase}/${p.outputType}/${p.method})`);
      }
    });
  } else {
    console.log('📋 Available prompts:');
    const byPhase = {
      initialCondensation: availablePrompts.filter(p => p.phase === 'initialCondensation'),
      mainCondensation: availablePrompts.filter(p => p.phase === 'mainCondensation'),
      finalImprovements: availablePrompts.filter(p => p.phase === 'finalImprovements')
    };
    
    Object.entries(byPhase).forEach(([phase, prompts]) => {
      if (prompts.length > 0) {
        console.log(`\n   ${phase}:`);
        prompts.forEach(p => {
          if (p.phase === 'initialCondensation') {
            console.log(`     ${p.promptId} (${p.phase}/${p.outputType})`);
          } else {
            console.log(`     ${p.promptId} (${p.phase}/${p.outputType}/${p.method})`);
          }
        });
      }
    });
  }
}

/**
 * Updates the current evaluation configuration with the provided prompt IDs.
 * 
 * @param promptIds The prompt IDs to update.
 */
async function updateConfig(promptIds: { initial?: string; main?: string; improve?: string }) {
  const configPath = path.join(__dirname, '..', 'config', 'currentEvalConfig.ts');
  let configContent = await fs.readFile(configPath, 'utf-8');
  
  const registry = new PromptRegistry();
  await registry.loadPrompts();
  
  // Update each prompt if provided
  if (promptIds.initial) {
    const prompt = registry.getPrompt(promptIds.initial);
    if (prompt) {
      const promptObject = `{
      promptId: "${prompt.promptId}",
      promptText: \`${prompt.promptText.replace(/`/g, '\\`')}\`,
      method: "${prompt.method}",
      outputType: "${prompt.outputType}",
      phase: "${prompt.phase}"
    }`;
      
      configContent = configContent.replace(
        /initialCondensationPrompt:\s*{[^}]*}/s,
        `initialCondensationPrompt: ${promptObject}`
      );
    }
  }
  
  if (promptIds.main) {
    const prompt = registry.getPrompt(promptIds.main);
    if (prompt) {
      const promptObject = `{
      promptId: "${prompt.promptId}",
      promptText: \`${prompt.promptText.replace(/`/g, '\\`')}\`,
      method: "${prompt.method}",
      outputType: "${prompt.outputType}",
      phase: "${prompt.phase}"
    }`;
      
      configContent = configContent.replace(
        /mainCondensationPrompt:\s*{[^}]*}/s,
        `mainCondensationPrompt: ${promptObject}`
      );
    }
  }
  
  if (promptIds.improve) {
    const prompt = registry.getPrompt(promptIds.improve);
    if (prompt) {
      const promptObject = `{
      promptId: "${prompt.promptId}",
      promptText: \`${prompt.promptText.replace(/`/g, '\\`')}\`,
      method: "${prompt.method}",
      outputType: "${prompt.outputType}",
      phase: "${prompt.phase}"
    }`;
      
      configContent = configContent.replace(
        /argumentImprovementPrompt:\s*{[^}]*}/s,
        `argumentImprovementPrompt: ${promptObject}`
      );
    }
  }
  
  await fs.writeFile(configPath, configContent);
  console.log('✅ Config updated successfully!');
}

/**
 * Main function to run the CLI tool.
 */
async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    return;
  }
  
  // Load prompt registry
  const registry = new PromptRegistry();
  await registry.loadPrompts();
  
  // Handle show commands
  if (args.showAvailable || args.showInitial || args.showMain || args.showImprove) {
    if (args.showInitial) {
      showAvailablePrompts(registry, 'initial');
    } else if (args.showMain) {
      showAvailablePrompts(registry, 'main');
    } else if (args.showImprove) {
      showAvailablePrompts(registry, 'improve');
    } else {
      showAvailablePrompts(registry);
    }
    return;
  }
  
  if (!args.initial && !args.main && !args.improve) {
    console.log('❌ No prompt IDs provided. Use -h for help.');
    return;
  }
  
  try {
    // Validate provided prompt IDs
    const validationErrors: string[] = [];
    
    if (args.initial && !registry.getPrompt(args.initial)) {
      validationErrors.push(`Initial prompt "${args.initial}" not found`);
    }
    
    if (args.main && !registry.getPrompt(args.main)) {
      validationErrors.push(`Main prompt "${args.main}" not found`);
    }
    
    if (args.improve && !registry.getPrompt(args.improve)) {
      validationErrors.push(`Improve prompt "${args.improve}" not found`);
    }
    
    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:');
      validationErrors.forEach(error => console.log(`   ${error}`));
      return;
    }
    
    // Update config
    await updateConfig(args);
    
    console.log('\n🎯 Updated prompts:');
    if (args.initial) console.log(`   Initial: ${args.initial}`);
    if (args.main) console.log(`   Main: ${args.main}`);
    if (args.improve) console.log(`   Improve: ${args.improve}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error); 