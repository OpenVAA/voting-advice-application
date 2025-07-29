// This const has been empirically derived from testing OpenAI's API with 30 Finnish VAA comments per call. 
// The estimate is conviniently conservative for cases where the batch size is < 30. AS of July 2025, batch 
// size is constrained to 30 in the utility function defineCondensationSteps. 
const TOKENS_PER_CALL_ESTIMATE = 4000;

/**
 * Calculates a reasonable number of parallel batches based on the LLM model's TPM limit.
 * Uses an internal tokens per call estimate for argument condensation tasks of 30 comments. 
 * 
 * For future improvements, please derive your own estimate for the tokens per call for your use case.
 * 
 * You may also want to consider optimizing the parallel factor calculation done in this utility function.
 * 
 * @param modelTPMLimit - The TPM limit of the LLM model.
 * @returns The number of parallel batches to use.
 */
export function getParallelFactor(modelTPMLimit: number): number {
  // Aim for about one third of the TPM limit. The slowest call per parallel batch is usually something like 10-20 seconds.
  // This is definitely not optimized to the tee, but it provides most of the available parallelism benefits even without complexity. 
  // Note that some calls fail contract validation (wrong answer format) and are retried as a new batch, which slows things down quite a bit.
  // So this is a 'natural' throttle, which may very well become less relevant as model response reliability improves with time. 
  const theoreticalMaxFactor = modelTPMLimit / TOKENS_PER_CALL_ESTIMATE;
  console.info(`Parallel factor: ${Math.ceil(theoreticalMaxFactor / 3)}`);
  return Math.ceil(theoreticalMaxFactor / 3);
}
