import { CondensationPlan } from "../../core/types/condensation/processDefinition";
import { GoldenTestCase } from "./goldenTestCase";

/**
 * Configuration for a batch of condensation runs.
 * @param batchRunId - The unique identifier for the batch run
 * @param plan - The condensation plan for the batch run
 * @param testCases - The test cases for the batch run
 * @param promptIds - Mapping operation types to prompt IDs from the registry
 */
export interface BatchCondensationConfig {
  batchRunId: string;
  plan: CondensationPlan;
  testCases: GoldenTestCase[];
  promptIds: {
    refine?: {
      initial: string;
      refining: string;
    }  
    map?: string;    
    reduce?: string;  
    ground?: string;  
  };
}