import { MetaEvaluationDataset, MetaEvaluationCase } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Loads a specific meta-evaluation dataset from a category folder.
 * 
 * @param category - Category name (e.g., 'contrarianArguments', 'supportingArguments')
 * @returns Promise<MetaEvaluationDataset> - The loaded dataset with all test cases from that category
 */
export async function loadMetaEvaluationDataFromDir(
  category: string
): Promise<MetaEvaluationCase[]> {
  const categoryPath = path.join(__dirname, 'testData', category);
  const files = await fs.readdir(categoryPath);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  const testCases: MetaEvaluationCase[] = [];
  
  for (const file of jsonFiles) {
    const filePath = path.join(categoryPath, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const testCase: MetaEvaluationCase = JSON.parse(fileContent);
    testCases.push(testCase);
  }
  
  return testCases;
}

/**
 * Loads the available meta-evaluation dataset by loading all data from multiple directories.
 * 
 * @returns Promise<MetaEvaluationDataset[]> - Array of all available meta-evaluation test cases
 */
export async function loadMetaEvaluationDataset(): Promise<MetaEvaluationDataset[]> {
  const testDataPath = path.join(__dirname, 'testData');
  const categories = await fs.readdir(testDataPath);
  
  const testCasesByCategory: MetaEvaluationDataset[] = [];
  
  for (const category of categories) {
    const data = await loadMetaEvaluationDataFromDir(category);
    testCasesByCategory.push({
      description: `Meta-evaluation data for ${category}`,
      testCases: data
    });
  }
  
  return testCasesByCategory;
}