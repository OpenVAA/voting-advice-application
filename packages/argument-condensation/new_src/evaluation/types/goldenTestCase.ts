import { Argument, CondensationType } from '../../core/types';

/**
 * A single test case for evaluating the condensation system.
 * Contains input comments and expected output arguments to compare against.
 * @param topic - The topic of the test case
 * @param comments - The input comments to condense
 * @param expectedArguments - The golden standard output
 * @param condensationType - The type of condensation to evaluate
 */
export interface GoldenTestCase {
  topic: string;
  comments: Comment[];
  expectedArguments: Argument[];
  condensationType: CondensationType;
}
