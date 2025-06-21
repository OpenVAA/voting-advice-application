import * as fs from 'fs/promises';
import * as path from 'path';
import { PartialCondensationRunRecord, FullCondensationRunRecord } from './types/analytics/runRecord';

/**
 * Manages saving and loading cached condensation results.
 * Handles the directory structure: savedResults/singleRuns/electionID/condensationType/questionId/
 */
export class CacheManager {
  private readonly baseDir: string;

  constructor(electionId: string = 'election1') {
    this.baseDir = path.join(__dirname, 'savedResults', 'singleRuns', electionId);
  }

  /**
   * Get the directory path for a specific result
   */
  private getResultPath(condensationType: string, questionId: string, runId: string): string {
    return path.join(this.baseDir, condensationType, questionId, `${runId}.json`);
  }

  /**
   * Save a partial result (after each step) - appends to existing file
   */
  async savePartialResult(record: PartialCondensationRunRecord): Promise<void> {
    const filePath = this.getResultPath(record.outputType, record.questionId, record.runId);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Read existing content if file exists
    let existingContent: any = { steps: [], finalResult: null };
    try {
      const existingData = await fs.readFile(filePath, 'utf-8');
      existingContent = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    // Add the new step result
    const stepResult = {
      stepIndex: existingContent.steps.length,
      timestamp: record.timestamp,
      outputType: record.outputType,
      plan: record.plan,
      promptCalls: record.promptCalls
    };
    
    existingContent.steps.push(stepResult);
    
    // Save the updated content
    await fs.writeFile(filePath, JSON.stringify(existingContent, null, 2));
    console.log(`Appended step ${stepResult.stepIndex} to: ${filePath}`);
  }

  /**
   * Save a final result (after full pipeline) - updates the same file
   */
  async saveFinalResult(record: FullCondensationRunRecord): Promise<void> {
    const filePath = this.getResultPath(record.outputType, record.questionId, record.runId);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Read existing content if file exists
    let existingContent: any = { steps: [], finalResult: null };
    try {
      const existingData = await fs.readFile(filePath, 'utf-8');
      existingContent = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    // Add the final result
    existingContent.finalResult = {
      timestamp: record.timestamp,
      outputType: record.outputType,
      plan: record.plan,
      promptCalls: record.promptCalls,
      evaluation: record.evaluation
    };
    
    // Save the updated content
    await fs.writeFile(filePath, JSON.stringify(existingContent, null, 2));
    console.log(`Saved final result to: ${filePath}`);
  }

  /**
   * Load a cached result for a specific run
   */
  async loadCachedResult(
    condensationType: string,
    questionId: string,
    runId: string
  ): Promise<{ steps: any[], finalResult: any } | null> {
    try {
      const filePath = this.getResultPath(condensationType, questionId, runId);
      const content = await fs.readFile(filePath, 'utf-8');
      const record = JSON.parse(content);
      
      console.log(`Loaded cached result: ${filePath}`);
      return record;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Find all cached results for a question
   */
  async findCachedResultsForQuestion(
    condensationType: string,
    questionId: string
  ): Promise<{ runId: string, steps: any[], finalResult: any }[]> {
    try {
      const questionDir = path.join(this.baseDir, condensationType, questionId);
      const files = await fs.readdir(questionDir);
      
      const results: { runId: string, steps: any[], finalResult: any }[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(questionDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const record = JSON.parse(content);
            const runId = file.replace('.json', '');
            results.push({ runId, ...record });
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