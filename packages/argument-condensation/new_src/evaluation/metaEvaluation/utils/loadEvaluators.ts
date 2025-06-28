import { BaseEvaluator } from '../../evaluators/abstractEvaluator';
import { OpenAIProvider } from '@openvaa/llm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Dynamically loads all evaluators from the evaluators directory,
 * excluding stubEvaluator.ts and abstractEvaluator.ts
 * 
 * All evaluators are expected to require an LLM provider.
 * 
 * @returns Promise<BaseEvaluator[]> - Array of instantiated evaluators
 */
export async function loadEvaluators(): Promise<BaseEvaluator[]> {
  // Get current directory - works with both CommonJS and ES modules
  const currentFile = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const evaluatorsPath = path.resolve(currentDir, '../../evaluators');
  
  const files = await fs.readdir(evaluatorsPath);
  
  // Filter for TypeScript files, excluding stub and abstract evaluators
  const evaluatorFiles = files.filter(file => 
    file.endsWith('.ts') && 
    !file.includes('stubEvaluator') && 
    !file.includes('abstractEvaluator')
  );
  
  const evaluators: BaseEvaluator[] = [];
  
  // Create LLM provider for evaluators
  const apiKey = process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('No OpenAI API key found in environment variables (LLM_OPENAI_API_KEY or OPENAI_API_KEY). All evaluators require an LLM provider.');
  }
  
  const llmProvider = new OpenAIProvider({ 
    apiKey,
    model: 'gpt-4o-mini' // Use a cost-effective model for evaluation
  });
  
  for (const file of evaluatorFiles) {
    try {
      const modulePath = path.join(evaluatorsPath, file);
      const module = await import(modulePath);
      
      // Look for exported classes that extend BaseEvaluator
      for (const exportName of Object.keys(module)) {
        const ExportedClass = module[exportName];
        
        // Check if it's a class constructor and if it extends BaseEvaluator
        if (typeof ExportedClass === 'function' && 
            ExportedClass.prototype instanceof BaseEvaluator) {
          
          try {
            // All evaluators are expected to require an LLM provider
            const evaluator = new ExportedClass(llmProvider);
            evaluators.push(evaluator);
            console.log(`Loaded evaluator: ${evaluator.getName()}`);
          } catch (error) {
            console.warn(`Could not instantiate ${exportName} from ${file}: ${error}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load evaluator from ${file}: ${error}`);
    }
  }
  
  if (evaluators.length === 0) {
    throw new Error('No evaluators were successfully loaded. Make sure evaluator files are properly implemented and dependencies are available.');
  }
  
  return evaluators;
} 