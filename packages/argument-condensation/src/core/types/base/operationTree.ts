import type { Argument } from '../condensation/argument';
import type { Comment } from '../condensation/condensationInput';
import type { CondensationOperation } from '../condensation/operation';

/**
 * Represents a single operation node in the condensation tree.
 */
export interface OperationNode {
  /** The unique identifier for this operation node */
  id: string;
  /** The type of operation performed */
  operation: CondensationOperation;
  /** The step index in the overall plan */
  stepIndex: number;
  /** The batch index within the step (for parallel operations) */
  batchIndex?: number;
  /** The input data for this operation */
  input: {
    comments?: Array<Comment>;
    arguments?: Array<Argument>;
    argumentLists?: Array<Array<Argument>>;
  };
  /** The output data from this operation */
  output: {
    arguments?: Array<Argument>;
    argumentLists?: Array<Array<Argument>>;
  };
  /** References to child operations (operations that use this output as input) */
  children: Array<string>;
  /** References to parent operations (operations that produced this input) - can have multiple parents for reduce operations */
  parents: Array<string>;
  /** Metadata about the operation execution */
  metadata: {
    /** When this operation started */
    startTime: Date;
    /** When this operation ended */
    endTime: Date;
    /** The duration of the operation (ms) */
    duration: number;
    /** The number of LLM calls made */
    llmCalls: number;
    /** Whether the operation was successful */
    success: boolean;
    /** Error message if the operation failed */
    error?: string;
  };
}

/**
 * Complete visualization of the tree structure for a condensation run.
 */
export interface OperationTree {
  /** The date and time as a string (e.g. 1746_28_6_2025) */
  createdAt: string;
  /** The run identifier */
  runId: string;
  /** The root operation nodes (operations that start with comments) */
  roots: Array<string>;
  /** All operation nodes indexed by their ID */
  nodes: Record<string, OperationNode>;
  /** The final output arguments */
  finalArguments: Array<Argument>;
  /** Overall tree metadata */
  metadata: {
    /** Total number of operations in the tree */
    totalOperations: number;
    /** Maximum depth of the tree */
    maxDepth: number;
    /** Total duration of all operations (ms) */
    totalDuration: number;
    /** Total number of LLM calls made */
    totalLlmCalls: number;
  };
}
