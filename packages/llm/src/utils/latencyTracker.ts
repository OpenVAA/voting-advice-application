import type { Logger } from '@openvaa/core';
import type { LatencyMeasurement } from '../types';

/**
 * A simple latency tracker that measures execution time for operations
 *
 * @param logger - Optional logger for warning messages about unstarted operations
 */
export class LatencyTracker {
  private measurements: Map<string, LatencyMeasurement> = new Map();
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Start tracking time for a specific operation
   *
   * @param operationId - Unique identifier for the operation
   * @returns The start time in milliseconds
   */
  start(operationId: string): number {
    const startTime = performance.now();
    this.measurements.set(operationId, { startTime });
    return startTime;
  }

  /**
   * Stop tracking time for a specific operation and calculate duration
   *
   * @param operationId - Unique identifier for the operation
   * @returns The duration in milliseconds, or null if operation wasn't started
   */
  stop(operationId: string): number | null {
    const measurement = this.measurements.get(operationId);
    if (!measurement) {
      this.logger?.warning(`LatencyTracker: Operation "${operationId}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;

    // Update the measurement with end time and duration
    measurement.endTime = endTime;
    measurement.duration = duration;

    return duration;
  }

  /**
   * Get the duration for a completed operation
   *
   * @param operationId - Unique identifier for the operation
   * @returns The duration in milliseconds, or null if not found or not completed
   */
  getDuration(operationId: string): number | null {
    const measurement = this.measurements.get(operationId);
    return measurement?.duration ?? null;
  }

  /**
   * Get all measurements
   *
   * @returns Map of all latency measurements
   */
  getAllMeasurements(): Map<string, LatencyMeasurement> {
    return new Map(this.measurements);
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }

  /**
   * Clear a specific measurement
   *
   * @param operationId - Unique identifier for the operation
   */
  clearOperation(operationId: string): void {
    this.measurements.delete(operationId);
  }

  /**
   * Check if an operation is currently being tracked
   *
   * @param operationId - Unique identifier for the operation
   * @returns True if the operation is being tracked
   */
  isTracking(operationId: string): boolean {
    const measurement = this.measurements.get(operationId);
    return measurement !== undefined && measurement.endTime === undefined;
  }

  /**
   * Measure the execution time of a function
   *
   * @param operationId - Unique identifier for the operation
   * @param fn - Function to measure
   * @returns Tuple of [result, duration in milliseconds]
   */
  async measure<TResult>(operationId: string, fn: () => Promise<TResult>): Promise<[TResult, number]> {
    this.start(operationId);
    try {
      const result = await fn();
      const duration = this.stop(operationId);
      return [result, duration ?? 0];
    } catch (error) {
      this.stop(operationId);
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   *
   * @param operationId - Unique identifier for the operation
   * @param fn - Synchronous function to measure
   * @returns Tuple of [result, duration in milliseconds]
   */
  measureSync<TResult>(operationId: string, fn: () => TResult): [TResult, number] {
    this.start(operationId);
    try {
      const result = fn();
      const duration = this.stop(operationId);
      return [result, duration ?? 0];
    } catch (error) {
      this.stop(operationId);
      throw error;
    }
  }
}

/**
 * Create a global latency tracker instance for convenience
 */
export const globalLatencyTracker = new LatencyTracker();

/**
 * Convenience function to measure async operations using the global tracker
 *
 * @param operationId - Unique identifier for the operation
 * @param fn - Function to measure
 * @returns Tuple of [result, duration in milliseconds]
 */
export async function measureLatency<TResult>(
  operationId: string,
  fn: () => Promise<TResult>
): Promise<[TResult, number]> {
  return globalLatencyTracker.measure(operationId, fn);
}

/**
 * Convenience function to measure sync operations using the global tracker
 *
 * @param operationId - Unique identifier for the operation
 * @param fn - Synchronous function to measure
 * @returns Tuple of [result, duration in milliseconds]
 */
export function measureLatencySync<TResult>(operationId: string, fn: () => TResult): [TResult, number] {
  return globalLatencyTracker.measureSync(operationId, fn);
}
