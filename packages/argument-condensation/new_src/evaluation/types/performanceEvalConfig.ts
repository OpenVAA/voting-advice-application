import { CondensationPrompt } from "../../core/types/prompt";
import { GoldenTestCase } from "./goldenTestCase";

/**
 * Configuration for a batch of condensation runs.
 * @param batchRunId - The unique identifier for the batch run
 * @param pipelineSignature - The pipeline signature for the batch run
 * @param testCases - The test cases for the batch run
 * @param batchSize - The number of runs in the batch
 * @param nOutputArgs - The number of output arguments for the batch run
 * @param language - The language of the batch run
 */
export interface BatchCondensationConfig {
  batchRunId: string;
  pipelineSignature: {
    initialCondensationPrompt: CondensationPrompt;
    mainCondensationPrompt: CondensationPrompt;
    argumentImprovementPrompt: CondensationPrompt;
  };
  testCases: GoldenTestCase[];
  batchSize: number;
  nOutputArgs: number;
  language: string;
}