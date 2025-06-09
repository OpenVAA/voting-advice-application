import { MetaEvaluationDataset, MetaEvaluationCase } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Loads a specific meta-evaluation dataset from a category folder.
 * 
 * @param category - Category name (e.g., 'contrarianArguments', 'supportingArguments')
 * @returns Promise<MetaEvaluationDataset> - The loaded dataset with all test cases from that category
 */
export async function loadMetaEvaluationDataset(
  category: string
): Promise<MetaEvaluationDataset> {
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
  
  return {
    description: `Meta-evaluation dataset for ${category}`,
    testCases
  };
}

/**
 * Loads all available meta-evaluation datasets.
 * 
 * @returns Promise<MetaEvaluationDataset[]> - Array of all available datasets
 */
export async function loadAllMetaEvaluationDatasets(): Promise<MetaEvaluationDataset[]> {
  const testDataPath = path.join(__dirname, 'testData');
  const categories = await fs.readdir(testDataPath);
  
  const datasets: MetaEvaluationDataset[] = [];
  
  for (const category of categories) {
    const dataset = await loadMetaEvaluationDataset(category);
    datasets.push(dataset);
  }
  
  return datasets;
}