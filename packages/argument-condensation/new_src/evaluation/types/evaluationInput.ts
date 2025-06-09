import { Argument } from '../../core/types';

/**
 * Input for evaluating a single test case: system output vs expected output.
 * @param topic - The topic of the test case
 * @param systemArguments - The arguments produced by the system
 * @param expectedArguments - The expected arguments (golden standard)
 */
export interface SingleEvaluationInput {
  topic: string;
  systemArguments: Argument[]; // What our system produced
  expectedArguments: Argument[]; // What we expected (golden standard)
}

/**
 * Input for evaluating the condensation system across multiple test cases.
 * @param description - Description of the evaluation
 * @param inputs - Array of individual test case inputs
 */
export interface SystemEvaluationInput {
  description: string;
  inputs: SingleEvaluationInput[];
}
