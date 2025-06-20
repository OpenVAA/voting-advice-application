import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CondensationPrompt } from '../types/prompt';
import { CondensationPhase } from '../types/condensationPhase';

/**
 * Manages condensation prompts
 */
export class PromptRegistry {
  private promptsDir = path.join(__dirname);
  private registry: Map<string, CondensationPrompt> = new Map();

  /**
   * Recursively find all YAML files under a directory
   */
  private async findYamlFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(await this.findYamlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
          results.push(fullPath);
        }
      }
    } catch (e) {
      // Directory may not exist, skip
    }
    return results;
  }

  /**
   * Load all prompts from the registry. 
   * 
   */
  async loadPrompts(): Promise<void> {
    const phases = await fs.readdir(this.promptsDir);
    for (const phase of phases) {
      const phaseDir = path.join(this.promptsDir, phase);
      const phaseStat = await fs.stat(phaseDir).catch(() => null);
      if (!phaseStat || !phaseStat.isDirectory()) continue;
      
      const typeDirs = await fs.readdir(phaseDir);
      for (const type of typeDirs) {
        const typeDir = path.join(phaseDir, type);
        const typeStat = await fs.stat(typeDir).catch(() => null);
        if (!typeStat || !typeStat.isDirectory()) continue;
        
        if (phase === 'initialCondensation') {
          // Two-level structure for initial condensation (doesn't need a condensation method)
          const yamlFiles = await this.findYamlFiles(typeDir);
          for (const yamlFile of yamlFiles) {
            const content = await fs.readFile(yamlFile, 'utf-8');
            const promptData = yaml.load(content) as CondensationPrompt;
            const prompt: CondensationPrompt = {
              promptId: promptData.promptId,
              promptText: promptData.promptText,
              method: promptData.method as any,
              outputType: type as any,
              phase: phase as CondensationPhase
            };
            this.registry.set(prompt.promptId, prompt);
          }
        } else {
          // Three-level structure for other phases
          const methodDirs = await fs.readdir(typeDir);
          for (const method of methodDirs) {
            const methodDir = path.join(typeDir, method);
            const methodStat = await fs.stat(methodDir).catch(() => null);
            if (!methodStat || !methodStat.isDirectory()) continue;
            const yamlFiles = await this.findYamlFiles(methodDir);
            for (const yamlFile of yamlFiles) {
              const content = await fs.readFile(yamlFile, 'utf-8');
              const promptData = yaml.load(content) as CondensationPrompt;
              const prompt: CondensationPrompt = {
                promptId: promptData.promptId,
                promptText: promptData.promptText,
                method: method as any,
                outputType: type as any,
                phase: phase as CondensationPhase
              };
              this.registry.set(prompt.promptId, prompt);
            }
          }
        }
      }
    }
  }

  /**
   * Get a prompt by ID
   */
  getPrompt(promptId: string): CondensationPrompt | undefined {
    return this.registry.get(promptId);
  }

  /**
   * Get all prompts for a specific phase
   */
  getPromptsByPhase(phase: CondensationPhase): CondensationPrompt[] {
    return Array.from(this.registry.values()).filter(p => p.phase === phase);
  }

  /**
   * Get the latest version of a prompt by base ID (without version)
   */
  getLatestPrompt(baseId: string): CondensationPrompt | undefined {
    const matchingPrompts = Array.from(this.registry.values())
      .filter(p => p.promptId.startsWith(baseId))
      .sort((a, b) => b.promptId.localeCompare(a.promptId));
    
    return matchingPrompts[0];
  }

  /**
   * Render a prompt template with variables
   */
  renderPrompt(promptId: string, variables: Record<string, any>): string {
    const prompt = this.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    let renderedText = prompt.promptText;
    
    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      renderedText = renderedText.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return renderedText;
  }

  /**
   * List all available prompts
   */
  listPrompts(): { promptId: string; phase: string; method: string; outputType: string }[] {
    return Array.from(this.registry.values()).map(p => ({
      promptId: p.promptId,
      phase: p.phase,
      method: p.method,
      outputType: p.outputType
    }));
  }
} 