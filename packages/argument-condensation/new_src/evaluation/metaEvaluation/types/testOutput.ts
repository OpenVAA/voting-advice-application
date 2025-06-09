/**
 * The result of running metaevaluation on a dataset of test cases.
 * 
 * @property methodName - The name of the evaluation method.
 * @property methodDescription - A description of the evaluation method.
 * @property correlationWithHuman - How well this method's scores correlate with human scores.
 * @property testResults - The results of running the evaluation method on each test case.
 */
export interface MetaEvaluationResult {
  methodName: string;
  methodDescription: string;
  correlationWithHuman: number;
  testResults: Array<{
    topic: string; // Corresponds exactly to the topic field of the test case
    humanScore: number;
    scoreByEvaluator: number;
    difference: number;
    analysisOfDifference: string;
  }>;
}