/**
 * Custom logger that integrates with the job store directly
 * This logger can be used to track progress of a sequential pipeline of operations
 * This way we can track progress of long running jobs more granularly
 *
 * NEW: Supports hierarchical operations where operations can be broken down into
 * sub-operations at execution time for more granular progress tracking.
 */

import { DefaultLogger } from '@openvaa/core';
import {
  addJobErrorMessage,
  addJobInfoMessage,
  addJobWarningMessage,
  completeJob,
  failJob,
  updateJobProgress
} from './jobStore';
import type { Logger } from '@openvaa/core';

/**
 * An operation is a step in a pipeline that can be tracked separately
 * This way we can track progress of long running jobs more granularly
 */
interface Operation {
  id: string;
  weight: number;
  progress: number;
}

/**
 * A logger that can be used to track progress of a sequential pipeline of operations
 * This way we can track progress of long running jobs more granularly
 *
 * NEW: Supports hierarchical operations where operations can be broken down into
 * sub-operations at execution time for more granular progress tracking.
 */
export class PipelineLogger extends DefaultLogger implements Logger {
  private jobId: string;
  private operations: Array<Operation> = [];
  private currentOperationIndex: number = 0;
  private totalProgress: number = 0;
  private totalWeight: number = 0;
  private isInitialized: boolean = false;

  // NEW: Map from operation ID to array of sub-operations (recursive structure)
  private subOperationsMap: Map<string, Array<Operation>> = new Map();
  // NEW: Current sub-operation index for the current operation
  private currentSubOperationIndex: number = 0;

  constructor(jobId: string) {
    super();
    this.jobId = jobId;
  }

  /**
   * Initialize the pipeline with operations
   * This can be called after construction when the pipeline is known
   */
  initializePipeline(pipeline: Array<{ id: string; weight?: number }>): void {
    this.operations = pipeline.map((op) => ({
      id: op.id,
      weight: op.weight || 1,
      progress: 0
    }));

    this.totalWeight = this.operations.reduce((sum, op) => sum + op.weight, 0);
    this.currentOperationIndex = 0;
    this.currentSubOperationIndex = 0;
    this.isInitialized = true;
  }

  /**
   * Define sub-operations for a specific operation
   * This allows the caller to break down an operation into more granular steps
   * at execution time when they know the specific breakdown
   *
   * @param operationId - The ID of the operation to break down
   * @param subOperations - Array of sub-operations with their weights
   */
  defineSubOperations(operationId: string, subOperations: Array<{ id: string; weight?: number }>): void {
    if (!this.isInitialized) {
      this.warning('Cannot define sub-operations: pipeline not initialized');
      return;
    }

    const opIndex = this.operations.findIndex((op) => op.id === operationId);
    if (opIndex === -1) {
      this.warning(`Cannot define sub-operations: operation '${operationId}' not found`);
      return;
    }

    // Convert to Operation objects (recursive structure)
    const subOps = subOperations.map((op) => ({
      id: op.id,
      weight: op.weight || 1,
      progress: 0
    }));

    this.subOperationsMap.set(operationId, subOps);
    this.currentSubOperationIndex = 0;
  }

  /**
   * Update progress for the current operation
   * Automatically determines whether to update sub-operations or the main operation
   * based on the current state
   */
  progress(value: number): void {
    // Call parent logger first
    super.progress(value);

    // If pipeline not initialized, just update job progress directly
    if (!this.isInitialized) {
      this.updateJobProgress(value);
      return;
    }

    const currentOp = this.operations[this.currentOperationIndex];
    const hasSubOps = this.hasSubOperations(currentOp.id);

    if (hasSubOps) {
      // Update the current sub-operation and recalculate global progress
      const subOps = this.subOperationsMap.get(currentOp.id)!;
      const currentSubOp = subOps[this.currentSubOperationIndex];

      // Update the current sub-operation progress
      currentSubOp.progress = Math.max(0, Math.min(1, value));

      // Calculate overall progress for the parent operation based on sub-operations
      const totalWeight = subOps.reduce((sum, op) => sum + op.weight, 0);
      const weightedProgress = subOps.reduce((sum, op) => sum + op.progress * op.weight, 0);
      const overallProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;

      // Update the parent operation progress
      this.operations[this.currentOperationIndex].progress = overallProgress;

      // Auto-advance to next sub-operation if current reaches 100%
      if (value >= 1.0 && this.currentSubOperationIndex < subOps.length - 1) {
        this.currentSubOperationIndex++;
      }
    } else {
      // Update the main operation progress directly
      this.operations[this.currentOperationIndex].progress = Math.max(0, Math.min(1, value));
    }

    // Update total progress
    this.updateTotalProgress();

    // Auto-advance to next main operation when current reaches 100%
    if (
      this.operations[this.currentOperationIndex].progress >= 1.0 &&
      this.currentOperationIndex < this.operations.length - 1
    ) {
      this.currentOperationIndex++;
      this.operations[this.currentOperationIndex].progress = 0;
      this.currentSubOperationIndex = 0; // Reset sub-operation index
    }
  }

  /**
   * Update progress for a specific operation by ID
   * This avoids confusion with multiple progress(1.0) calls
   * Ignores the update if the operation is not the current operation
   * @param id - The operation ID to update
   * @param value - Progress value between 0 and 1
   */
  updateOperation(id: string, value: number): void {
    // If pipeline not initialized, just update job progress directly
    if (!this.isInitialized) {
      this.updateJobProgress(value);
      return;
    }

    const opIndex = this.operations.findIndex((op) => op.id === id);
    if (opIndex === -1) {
      throw new Error(`Operation '${id}' not found in pipeline`);
    }
    if (opIndex !== this.currentOperationIndex) {
      return;
    }

    // Check if this operation has sub-operations defined
    const hasSubOps = this.hasSubOperations(id);

    if (hasSubOps) {
      // If sub-operations are defined, we should use updateSubOperation instead
      this.warning(
        `Operation '${id}' has sub-operations defined. Use updateSubOperation() or progress() for granular updates.`
      );
      return;
    }

    // Update the specific operation progress
    this.operations[opIndex].progress = Math.max(0, Math.min(1, value));

    // Update total progress
    this.updateTotalProgress();

    // Auto-advance to next operation if this one is complete
    if (value >= 1.0 && opIndex < this.operations.length - 1) {
      this.currentOperationIndex = opIndex + 1;
      this.operations[this.currentOperationIndex].progress = 0;
      this.currentSubOperationIndex = 0; // Reset sub-operation index
    }
  }

  /**
   * NEW: Update progress for a specific sub-operation
   * This allows granular progress tracking within an operation
   * @param operationId - The ID of the parent operation
   * @param subOperationId - The ID of the sub-operation to update
   * @param value - Progress value between 0 and 1
   */
  updateSubOperation(operationId: string, subOperationId: string, value: number): void {
    if (!this.isInitialized) {
      this.warning('Cannot update sub-operation: pipeline not initialized');
      return;
    }

    const subOps = this.subOperationsMap.get(operationId);
    if (!subOps) {
      this.warning(`Cannot update sub-operation: no sub-operations defined for '${operationId}'`);
      return;
    }

    const subOpIndex = subOps.findIndex((op) => op.id === subOperationId);
    if (subOpIndex === -1) {
      this.warning(`Sub-operation '${subOperationId}' not found in '${operationId}'`);
      return;
    }

    // Update the sub-operation progress
    subOps[subOpIndex].progress = Math.max(0, Math.min(1, value));

    // Calculate overall progress for the parent operation based on sub-operations
    const totalWeight = subOps.reduce((sum, op) => sum + op.weight, 0);
    const weightedProgress = subOps.reduce((sum, op) => sum + op.progress * op.weight, 0);
    const overallProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;

    // Update the parent operation progress
    this.updateOperation(operationId, overallProgress);

    // Auto-advance to next sub-operation if current reaches 100%
    if (value >= 1.0 && subOpIndex < subOps.length - 1) {
      this.currentSubOperationIndex = subOpIndex + 1;
    }
  }

  /**
   * Manually move to the next operation (optional, since progress(1.0) auto-advances)
   */
  nextOperation(): void {
    if (!this.isInitialized) {
      this.warning('Cannot move to next operation: pipeline not initialized');
      return;
    }

    if (this.currentOperationIndex < this.operations.length - 1) {
      this.currentOperationIndex++;
      this.operations[this.currentOperationIndex].progress = 0;
      this.currentSubOperationIndex = 0; // Reset sub-operation index
    }
  }

  /**
   * Get current operation info
   */
  getCurrentOperation(): { id: string; index: number; total: number } | null {
    if (!this.isInitialized) {
      return null;
    }

    return {
      id: this.operations[this.currentOperationIndex].id,
      index: this.currentOperationIndex + 1,
      total: this.operations.length
    };
  }

  /**
   * NEW: Get current sub-operation info for the current operation
   */
  getCurrentSubOperation(): { id: string; index: number; total: number } | null {
    if (!this.isInitialized) {
      return null;
    }

    const currentOp = this.operations[this.currentOperationIndex];
    const subOps = this.subOperationsMap.get(currentOp.id);

    if (!subOps || subOps.length === 0) {
      return null;
    }

    return {
      id: subOps[this.currentSubOperationIndex].id,
      index: this.currentSubOperationIndex + 1,
      total: subOps.length
    };
  }

  /**
   * Get progress for a specific operation
   */
  getOperationProgress(id: string): number | undefined {
    if (!this.isInitialized) {
      return undefined;
    }

    const op = this.operations.find((op) => op.id === id);
    return op?.progress;
  }

  /**
   * NEW: Get progress for a specific sub-operation
   */
  getSubOperationProgress(operationId: string, subOperationId: string): number | undefined {
    if (!this.isInitialized) {
      return undefined;
    }

    const subOps = this.subOperationsMap.get(operationId);
    if (!subOps) {
      return undefined;
    }

    const subOp = subOps.find((op) => op.id === subOperationId);
    return subOp?.progress;
  }

  /**
   * NEW: Get all sub-operations for a specific operation
   */
  getSubOperations(operationId: string): Array<{ id: string; progress: number; weight: number }> | undefined {
    if (!this.isInitialized) {
      return undefined;
    }

    const subOps = this.subOperationsMap.get(operationId);
    if (!subOps) {
      return undefined;
    }

    return subOps.map((op) => ({
      id: op.id,
      progress: op.progress,
      weight: op.weight
    }));
  }

  /**
   * NEW: Check if an operation has sub-operations defined
   */
  hasSubOperations(operationId: string): boolean {
    return this.subOperationsMap.has(operationId) && (this.subOperationsMap.get(operationId)?.length ?? 0) > 0;
  }

  /**
   * Update total progress based on current state
   */
  private updateTotalProgress(): void {
    let progressSum = 0;

    for (const op of this.operations) {
      progressSum += op.progress * op.weight;
    }

    this.totalProgress = this.totalWeight > 0 ? progressSum / this.totalWeight : 0;

    // Update job store
    this.updateJobProgress(this.totalProgress);
  }

  private updateJobProgress(progress: number): void {
    // Update job store directly instead of making HTTP call
    updateJobProgress(this.jobId, progress);
  }

  /**
   * Override info to also update job store
   */
  async info(message: string): Promise<void> {
    // Call parent logger first
    super.info(message);

    // Then update job store directly
    addJobInfoMessage(this.jobId, message);
  }

  /**
   * Override warning to also update job store
   */
  async warning(message: string): Promise<void> {
    // Call parent logger first
    super.warning(message);

    // Then update job store directly
    addJobWarningMessage(this.jobId, message);
  }

  /**
   * Override error to also update job store
   */
  async error(message: string): Promise<void> {
    // Call parent logger first
    super.error(message);

    // Then update job store directly
    addJobErrorMessage(this.jobId, message);
  }

  /**
   * Mark job as completed
   */
  async complete(): Promise<void> {
    completeJob(this.jobId);
  }

  /**
   * Mark job as failed
   */
  async fail(errorMessage?: string): Promise<void> {
    if (errorMessage) {
      addJobErrorMessage(this.jobId, errorMessage);
    }
    failJob(this.jobId);
  }
}
