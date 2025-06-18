import { CondensationRunInput, CondensationRunResult } from './types';
import { Condenser } from './condenser';

/**
 * Main entry point for argument condensation.
 * Takes input comments and configuration, returns condensed arguments with metrics.
 * 
 * @param input - Complete input configuration including comments, topic, and strategy config
 * @returns Promise resolving to session result with arguments and evaluation metrics
 */
export async function condenseArguments(
  input: CondensationRunInput
): Promise<CondensationRunResult> {
  // Create and run the condenser
  const condenser = new Condenser(input);
  return await condenser.run();
}