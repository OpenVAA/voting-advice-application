import { Argument } from "../../../core/types";

/**
 * A single test case for metaevaluation. 
 * 
 * @property topic - The unique identifier for the test case.
 * @property systemArguments - The "system output" we're testing evaluation on.
 * @property goldenArguments - The golden output to compare against.
 * @property humanScore - The score the human gave the system output.
 * @property humanRationale - The explanation of why this score was given by the human.
 */
export interface MetaEvaluationCase {
  topic: string;
  systemArguments: Argument[];
  goldenArguments: Argument[];
  humanScore: number;
  humanRationale: string;
}