import type { CondensationOutputType } from './condensationType';
import type { CondensationMethod } from './condensationMethod';
import { CondensationPhase } from './condensationPhase';

/**
 * Describes a prompt used in the condensation process.
 * 
 * @param promptText - The main prompt text or template
 * @param method - The condensation method this prompt is associated with (e.g., 'map-reduce', 'refine', etc.)
 * @param outputType - The type of output this prompt is designed to produce
 * @param phase - The phase of the condensation process this prompt is associated with
 * @param promptId - Unique identifier for this prompt
 */
export interface CondensationPrompt {
  promptText: string;
  method: CondensationMethod;
  outputType: CondensationOutputType;
  phase: CondensationPhase;
  promptId: string;
}