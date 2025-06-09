import { MetaEvaluationCase } from "./testCase";

/**
 * A dataset of test cases for metaevaluation. 
 * 
 * @property description - A description of the dataset.
 * @property testCases - An array of test cases.
 */
export interface MetaEvaluationDataset {
  description: string;
  testCases: MetaEvaluationCase[];
}