export function getParallelFactor(modelTPMLimit: number): number {
  // Calculate a reasonable number of parallel batches based on the LLM model's TPM limit
  return 10;
}
