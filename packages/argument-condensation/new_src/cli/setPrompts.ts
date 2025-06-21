import { PromptRegistry } from '../core/prompts/promptRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CondensationOperations } from '../core/types/condensation/operation';
import { CONDENSATION_TYPE } from '../core/types/condensationType';
import { ProcessingStep, CondensationPlan } from '../core/types/condensation/processDefinition';
import { RefineOperationParams, MapOperationParams, ReduceOperationParams, GroundingOperationParams } from '../core/types/condensation/processParams';
import { CliArgs } from './types/cliArgs';

/**
 * Parses command line arguments.
 * 
 * @returns The parsed arguments.
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-h':
      case '--help':
        result.help = true;
        break;
      case '-s':
      case '--show':
        result.showAvailable = true;
        break;
      case '--show-refine':
        result.showRefine = true;
        break;
      case '--show-map':
        result.showMap = true;
        break;
      case '--show-reduce':
        result.showReduce = true;
        break;
      case '--show-ground':
        result.showGround = true;
        break;
      case '--show-pros':
        result.showPros = true;
        break;
      case '--show-cons':
        result.showCons = true;
        break;
      case '--refine':
        result.refine = args[++i];
        break;
      case '--map':
        result.map = args[++i];
        break;
      case '--reduce':
        result.reduce = args[++i];
        break;
      case '--ground':
        result.ground = args[++i];
        break;
      case '--output-type':
        result.outputType = args[++i] as 'likertPros' | 'likertCons';
        break;
    }
  }
  
  return result;
}

function showHelp() {
  console.log(`
🎯 Operation-Based Prompt Management Tool

Usage: yarn tsx new_src/cli/setPrompts.ts [options]

Options:
  -h, --help              Show this help message
  -s, --show              Show all available prompts
  --show-refine           Show all REFINE prompts
  --show-map              Show all MAP prompts
  --show-reduce           Show all REDUCE prompts
  --show-ground           Show all GROUND prompts
  --show-pros             Show all likertPros prompts
  --show-cons             Show all likertCons prompts
  --refine <promptId>     Set REFINE prompt for current config
  --map <promptId>        Set MAP prompt for current config
  --reduce <promptId>     Set REDUCE prompt for current config
  --ground <promptId>     Set GROUND prompt for current config
  --output-type <type>    Specify output type (likertPros or likertCons)

Examples:
  yarn tsx new_src/cli/setPrompts.ts --show
  yarn tsx new_src/cli/setPrompts.ts --show-refine
  yarn tsx new_src/cli/setPrompts.ts --refine refine_likertPros_initial_v1 --output-type likertPros
  yarn tsx new_src/cli/setPrompts.ts --map map_likertPros_condensation_v1 --reduce reduce_likertPros_coalescing_v1 --output-type likertPros
`);
}

/**
 * Shows all available prompts for a given operation or output type.
 * 
 * @param registry The prompt registry.
 * @param filter The filter to apply to the prompts.
 */
function showAvailablePrompts(registry: PromptRegistry, filter?: 'refine' | 'map' | 'reduce' | 'ground' | 'pros' | 'cons') {
  const availablePrompts = registry.listPrompts();
  
  if (filter) {
    const filteredPrompts = availablePrompts.filter(p => {
      switch (filter) {
        case 'refine': return p.operation === CondensationOperations.REFINE;
        case 'map': return p.operation === CondensationOperations.MAP;
        case 'reduce': return p.operation === CondensationOperations.REDUCE;
        case 'ground': return p.operation === CondensationOperations.GROUND;
        case 'pros': return p.outputType === CONDENSATION_TYPE.LIKERT.PROS;
        case 'cons': return p.outputType === CONDENSATION_TYPE.LIKERT.CONS;
        default: return true;
      }
    });
    
    if (filteredPrompts.length === 0) {
      console.log(`📋 No ${filter} prompts available.`);
      return;
    }
    
    console.log(`📋 Available ${filter} prompts:`);
    filteredPrompts.forEach(p => {
      console.log(`   ${p.promptId} (${p.operation}/${p.outputType})`);
    });
  } else {
    console.log('📋 Available prompts:');
    const organized = registry.getPromptsByOperationAndTypeMap();
    
    Object.entries(organized).forEach(([operation, typeMap]) => {
      console.log(`\n   ${operation}:`);
      Object.entries(typeMap).forEach(([outputType, prompts]) => {
        console.log(`     ${outputType}:`);
        prompts.forEach(p => {
          console.log(`       ${p.promptId}`);
        });
      });
    });
  }
}

/**
 * Updates the current evaluation configuration with the provided prompt IDs.
 * 
 * @param promptIds The prompt IDs to update.
 * @param outputType The output type for the configuration.
 */
async function updateConfig(promptIds: { refine?: string; map?: string; reduce?: string; ground?: string }, outputType: string) {
  const configPath = path.join(__dirname, '..', 'config', 'currentEvalConfig.ts');
  let configContent = await fs.readFile(configPath, 'utf-8');
  
  const registry = new PromptRegistry();
  await registry.loadPrompts();
  
  // Create a new plan with the specified prompts
  const steps: ProcessingStep[] = [];
  
  if (promptIds.refine) {
    const prompt = registry.getPrompt(promptIds.refine);
    if (prompt) {
      const params: RefineOperationParams = {
        batchSize: (prompt.params as any).batchSize || 10,
        initialBatchPrompt: prompt.promptText,
        refinementPrompt: prompt.promptText // For now, using same prompt for both
      };
      steps.push({
        operation: CondensationOperations.REFINE,
        params
      });
    }
  }
  
  if (promptIds.map) {
    const prompt = registry.getPrompt(promptIds.map);
    if (prompt) {
      const params: MapOperationParams = {
        batchSize: (prompt.params as any).batchSize || 15,
        condensationPrompt: prompt.promptText
      };
      steps.push({
        operation: CondensationOperations.MAP,
        params
      });
    }
  }
  
  if (promptIds.reduce) {
    const prompt = registry.getPrompt(promptIds.reduce);
    if (prompt) {
      const params: ReduceOperationParams = {
        denominator: (prompt.params as any).denominator || 3,
        coalescingPrompt: prompt.promptText
      };
      steps.push({
        operation: CondensationOperations.REDUCE,
        params
      });
    }
  }
  
  if (promptIds.ground) {
    const prompt = registry.getPrompt(promptIds.ground);
    if (prompt) {
      const params: GroundingOperationParams = {
        batchSize: (prompt.params as any).batchSize || 10,
        groundingPrompt: prompt.promptText
      };
      steps.push({
        operation: CondensationOperations.GROUND,
        params
      });
    }
  }
  
  // Update the config with the new plan
  const newPlan: CondensationPlan = {
    outputType: outputType === 'likertPros' ? CONDENSATION_TYPE.LIKERT.PROS : CONDENSATION_TYPE.LIKERT.CONS,
    steps,
    nOutputArgs: 10,
    language: "fi"
  };
  
  // Replace the plan in the config
  const planRegex = /plan:\s*{[^}]*}/s;
  const newPlanString = `plan: ${JSON.stringify(newPlan, null, 2).replace(/"/g, "'")}`;
  
  if (planRegex.test(configContent)) {
    configContent = configContent.replace(planRegex, newPlanString);
  } else {
    // If no plan exists, add it
    configContent = configContent.replace(
      /const currentEvalConfig: BatchCondensationConfig = {/,
      `const currentEvalConfig: BatchCondensationConfig = {
  plan: ${newPlanString},`
    );
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
  if (args.showAvailable || args.showRefine || args.showMap || args.showReduce || args.showGround || args.showPros || args.showCons) {
    if (args.showRefine) {
      showAvailablePrompts(registry, 'refine');
    } else if (args.showMap) {
      showAvailablePrompts(registry, 'map');
    } else if (args.showReduce) {
      showAvailablePrompts(registry, 'reduce');
    } else if (args.showGround) {
      showAvailablePrompts(registry, 'ground');
    } else if (args.showPros) {
      showAvailablePrompts(registry, 'pros');
    } else if (args.showCons) {
      showAvailablePrompts(registry, 'cons');
    } else {
      showAvailablePrompts(registry);
    }
    return;
  }
  
  if (!args.refine && !args.map && !args.reduce && !args.ground) {
    console.log('❌ No prompt IDs provided. Use -h for help.');
    return;
  }
  
  if (!args.outputType) {
    console.log('❌ Output type must be specified with --output-type (likertPros or likertCons)');
    return;
  }
  
  try {
    // Validate provided prompt IDs
    const validationErrors: string[] = [];
    
    if (args.refine && !registry.getPrompt(args.refine)) {
      validationErrors.push(`REFINE prompt "${args.refine}" not found`);
    }
    
    if (args.map && !registry.getPrompt(args.map)) {
      validationErrors.push(`MAP prompt "${args.map}" not found`);
    }
    
    if (args.reduce && !registry.getPrompt(args.reduce)) {
      validationErrors.push(`REDUCE prompt "${args.reduce}" not found`);
    }
    
    if (args.ground && !registry.getPrompt(args.ground)) {
      validationErrors.push(`GROUND prompt "${args.ground}" not found`);
    }
    
    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:');
      validationErrors.forEach(error => console.log(`   ${error}`));
      return;
    }
    
    // Update config
    await updateConfig(args, args.outputType);
    
    console.log('\n🎯 Updated prompts:');
    if (args.refine) console.log(`   REFINE: ${args.refine}`);
    if (args.map) console.log(`   MAP: ${args.map}`);
    if (args.reduce) console.log(`   REDUCE: ${args.reduce}`);
    if (args.ground) console.log(`   GROUND: ${args.ground}`);
    console.log(`   Output Type: ${args.outputType}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error); 