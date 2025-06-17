import type { CondensationOutputType } from './condensationType';
import type { CondensationMethod } from './condensationMethod';

/**
 * Describes a prompt used in the condensation process.
 * 
 * @param promptText - The main prompt text or template
 * @param condensationOutputType - The type of output this prompt is designed to produce
 * @param condensationMethod - The condensation method this prompt is associated with (e.g., 'map-reduce', 'refine', etc.)
 * @param promptId - Optional: unique identifier for this prompt (for caching, analytics, etc.)
 */
export interface CondensationPrompt {
  /** The main prompt text or template */
  promptText: string;

  /** The type of output this prompt is designed to produce */
  condensationOutputType: CondensationOutputType;

  /** The condensation method this prompt is associated with (e.g., 'map-reduce', 'refine', etc.) */
  condensationMethod: CondensationMethod;

  /** Optional: unique identifier for this prompt (for caching, analytics, etc.) */
  promptId: string;
}