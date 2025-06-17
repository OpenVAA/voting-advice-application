/**
 * Represents a flexible pipeline signature as an ordered list of phase/prompt pairs.
 * Allows for partial or full pipelines.
 */
import type { CondensationPhase } from './condensationPhase';

/**
 * A single step in the pipeline: which phase, and which prompt was used.
 */
export interface PipelineStep {
  phase: CondensationPhase;
  promptId: string;
}

/**
 * The signature of a pipeline: an ordered list of steps (can be partial or full).
 */
export type PipelineSignature = PipelineStep[];

/**
 * Converts the pipeline signature to a string (e.g. "initialCondensation:A1-mainCondensation:B2").
 * Useful for filenames or analytics keys.
 */
export function pipelineSignatureToString(sig: PipelineSignature): string {
  return sig.map(step => `${step.phase}:${step.promptId}`).join('-');
}