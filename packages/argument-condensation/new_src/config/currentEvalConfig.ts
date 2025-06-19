import { BatchCondensationConfig } from "../evaluation/types/performanceEvalConfig";
import { CONDENSATION_METHOD } from "../core/types/condensationMethod";

const currentEvalConfig: BatchCondensationConfig = {
  batchRunId: "batch-run-id-001",
  testCases: [],
  pipelineSignature: {
    initialCondensationPrompt: {
      promptId: "init-v1",
      promptText: "...",
      condensationOutputType: "likertPros",
      condensationMethod: CONDENSATION_METHOD.SEQUENTIAL
    },
    mainCondensationPrompt: {
      promptId: "main-v1",
      promptText: "...",
      condensationOutputType: "likertPros",
      condensationMethod: CONDENSATION_METHOD.SEQUENTIAL
    },
    argumentImprovementPrompt: {
      promptId: "improve-v1",
      promptText: "...",
      condensationOutputType: "likertPros",
      condensationMethod: CONDENSATION_METHOD.SEQUENTIAL
    }
  },
  batchSize: 20,
  nOutputArgs: 10,
  language: "fi"
};

export default currentEvalConfig;