import { BatchCondensationConfig } from "../evaluation/types/performanceEvalConfig";
import { CONDENSATION_METHOD } from "../core/types/condensationMethod";

const currentEvalConfig: BatchCondensationConfig = {
  batchRunId: "batch-run-id-001",
  testCases: [],
  pipelineSignature: {
    initialCondensationPrompt: {
      promptId: "initializePros_v0",
      promptText: "...",
      method: CONDENSATION_METHOD.SEQUENTIAL,
      outputType: "likertPros",
      phase: "initialCondensation"
    },
    mainCondensationPrompt: {
      promptId: "refinePros_v0",
      promptText: "...",
      method: CONDENSATION_METHOD.SEQUENTIAL,
      outputType: "likertPros",
      phase: "mainCondensation"
    },
    argumentImprovementPrompt: {
      promptId: "improvePros_v0",
      promptText: "...",
      method: CONDENSATION_METHOD.SEQUENTIAL,
      outputType: "likertPros",
      phase: "full"
    }
  },
  batchSize: 20,
  nOutputArgs: 10,
  language: "fi"
};

export default currentEvalConfig;