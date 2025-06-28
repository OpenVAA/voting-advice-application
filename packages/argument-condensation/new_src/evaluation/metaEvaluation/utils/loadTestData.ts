import { MetaEvaluationCase } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Loads test cases from the specified directories for a given language
 * 
 * @param language - Language code (e.g., 'fi', 'en')
 * @returns Promise<MetaEvaluationCase[]> - Array of all test cases from both directories
 */
export async function loadTestCases(language: string): Promise<MetaEvaluationCase[]> {
  const testCases: MetaEvaluationCase[] = [];
  
  // Define the directories to load from
  const directories = [
    `testData/likertCons/${language}`,
    `testData/likertPros/${language}`
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    
    try {
      const files = await fs.readdir(dirPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(dirPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const testCase: MetaEvaluationCase = JSON.parse(fileContent);
        testCases.push(testCase);
      }
    } catch (error) {
      console.warn(`Failed to load test cases from ${dir}: ${error}`);
    }
  }
  
  return testCases;
} 