import { Argument } from './argument';
import { VAAComment } from '../condensation/condensationInput';
import { CondensationOperation } from '../condensation/operation';

/**
 * Represents a single operation node in the condensation tree.
 *
 * @param id - Unique identifier for this operation instance
 * @param operation - Type of operation performed
 * @param stepIndex - Step index in the overall plan
 * @param batchIndex - Batch index within the step (for parallel operations)
 * @param input - Input data for this operation
 * @param output - Output data from this operation
 * @param children - References to child operations (operations that use this output as input)
 * @param parents - References to parent operations (operations that produced this input) - can have multiple parents for REDUCE operations
 * @param parent - Use parents array instead. Kept for backward compatibility
 * @param metadata - Metadata about the operation execution
 */
export interface OperationNode {
  id: string;
  operation: CondensationOperation;
  stepIndex: number;
  batchIndex?: number;
  input: {
    comments?: Array<VAAComment>;
    arguments?: Array<Argument>;
    argumentLists?: Array<Array<Argument>>;
  };
  output: {
    arguments?: Array<Argument>;
    argumentLists?: Array<Array<Argument>>;
  };
  children: Array<string>;
  parents?: Array<string>;
  parent?: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    llmCalls: number;
    success: boolean;
    error?: string;
  };
}

/**
 * Complete tree structure for a condensation run.
 *
 * @param createdAt - Date and time as a string (e.g. 1746_28_6_2025)
 * @param runId - Run identifier
 * @param roots - Root operation nodes (operations that start with comments)
 * @param nodes - All operation nodes indexed by their ID
 * @param finalArguments - Final output arguments
 * @param metadata - Overall tree metadata
 */
export interface OperationTree {
  createdAt: string;
  runId: string;
  roots: Array<string>;
  nodes: Record<string, OperationNode>;
  finalArguments: Array<Argument>;
  metadata: {
    totalOperations: number;
    maxDepth: number;
    totalDuration: number;
    totalLlmCalls: number;
  };
}