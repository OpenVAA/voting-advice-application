import { GoldenTestCase } from './goldenTestCase';

/**
 * A collection of golden test cases for evaluation.
 * @param description - A description of the dataset
 * @param testCases - An array of golden test cases
 */
export interface GoldenDataset {
  description: string;
  testCases: GoldenTestCase[];
}
