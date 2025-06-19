import * as fs from 'fs/promises';
import * as path from 'path';
import { PartialCondensationRunRecord, FullCondensationRunRecord } from './types/analytics/runRecord';
import { PipelineSignature } from '../core/types/pipelineSignature';

/**
 * Manages saving and loading cached condensation results.
 * Handles the directory structure: savedResults/electionID/condensationType/questionId/
 */
export class CacheManager {
  private readonly baseDir: string;
  private deprecatedPrompts: Set<string> = new Set();

  constructor(electionId: string = 'election1') {
    this.baseDir = path.join(__dirname, 'savedResults', 'singleRuns', electionId);
  }

  /**
   * Load the list of deprecated prompts
   */
  async loadDeprecatedPrompts(): Promise<void> {
    try {
      const deprecatedPath = path.join(__dirname, '../core/prompts/deprecatedPrompts.json');
      const content = await fs.readFile(deprecatedPath, 'utf-8');
      const deprecated = JSON.parse(content) as string[];
      this.deprecatedPrompts = new Set(deprecated);
    } catch (error) {
      console.warn('No deprecated prompts file found, using empty set');
      this.deprecatedPrompts = new Set();
    }
  }

  /**
   * Check if a pipeline signature contains any deprecated prompts
   */
  private hasDeprecatedPrompts(pipelineSignature: PipelineSignature): boolean {
    return pipelineSignature.some(step => this.deprecatedPrompts.has(step.promptId));
  }

  /**
   * Get the directory path for a specific result
   */
  private getResultPath(condensationType: string, questionId: string, runId: string, phase: string): string {
    return path.join(this.baseDir, condensationType, questionId, `${runId}`, `${phase}.json`);
  }

  /**
   * Save a partial result (after each phase)
   */
  async savePartialResult(record: PartialCondensationRunRecord): Promise<void> {
    const filePath = this.getResultPath(record.outputType, record.questionId, record.runId, record.phase);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save the record
    await fs.writeFile(filePath, JSON.stringify(record, null, 2));
    console.log(`Saved partial result: ${filePath}`);
  }

  /**
   * Save a final result (after full pipeline)
   */
  async saveFinalResult(record: FullCondensationRunRecord): Promise<void> {
    const filePath = this.getResultPath(record.outputType, record.questionId, record.runId, record.phase);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save the record
    await fs.writeFile(filePath, JSON.stringify(record, null, 2));
    console.log(`Saved final result: ${filePath}`);
  }

  /**
   * Load a cached result for a specific pipeline and phase
   */
  async loadCachedPhaseResult(
    condensationType: string,
    questionId: string,
    runId: string,
    phase: string
  ): Promise<PartialCondensationRunRecord | FullCondensationRunRecord | null> {
    try {
      const filePath = this.getResultPath(condensationType, questionId, runId, phase);
      const content = await fs.readFile(filePath, 'utf-8');
      const record = JSON.parse(content) as PartialCondensationRunRecord | FullCondensationRunRecord;
      
      // Check if this result contains deprecated prompts
      if (this.hasDeprecatedPrompts(record.pipelineSignature)) {
        console.log(`Skipping cached result with deprecated prompts: ${filePath}`);
        return null;
      }
      
      console.log(`Loaded cached result: ${filePath}`);
      return record;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Find all cached results for a question, filtering out deprecated prompts
   */
  async findCachedResultsForQuestion(
    condensationType: string,
    questionId: string
  ): Promise<(PartialCondensationRunRecord | FullCondensationRunRecord)[]> {
    try {
      const questionDir = path.join(this.baseDir, condensationType, questionId);
      const files = await fs.readdir(questionDir);
      
      const results: (PartialCondensationRunRecord | FullCondensationRunRecord)[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(questionDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const record = JSON.parse(content) as PartialCondensationRunRecord | FullCondensationRunRecord;
            
            // Filter out results with deprecated prompts
            if (!this.hasDeprecatedPrompts(record.pipelineSignature)) {
              results.push(record);
            }
          } catch (error) {
            console.warn(`Failed to load cached result from ${file}:`, error);
          }
        }
      }
      
      return results;
    } catch (error) {
      // Directory doesn't exist
      return [];
    }
  }

  /**
   * Get all available question IDs for a condensation type
   */
  async getQuestionIds(condensationType: string): Promise<string[]> {
    try {
      const typeDir = path.join(this.baseDir, condensationType);
      const items = await fs.readdir(typeDir);
      
      const questionIds: string[] = [];
      for (const item of items) {
        const itemPath = path.join(typeDir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          questionIds.push(item);
        }
      }
      
      return questionIds;
    } catch (error) {
      // Directory doesn't exist
      return [];
    }
  }

  /**
   * Get all available condensation types
   */
  async getCondensationTypes(): Promise<string[]> {
    try {
      const items = await fs.readdir(this.baseDir);
      
      const types: string[] = [];
      for (const item of items) {
        const itemPath = path.join(this.baseDir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          types.push(item);
        }
      }
      
      return types;
    } catch (error) {
      // Base directory doesn't exist
      return [];
    }
  }
} 