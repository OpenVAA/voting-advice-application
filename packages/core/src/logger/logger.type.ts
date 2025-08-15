/**
 * A callback passed to admin or other operations that take long to complete.
 *
 * @usage
 * ```ts
 * // In the backend
 *
 * import { DefaultLogger, type Logger } from '@openvaa/core';
 *
 * export function longOperation({ logger }: { logger?: Logger } = {}): Promise<void> {
 *   logger ??= new DefaultLogger();
 *   for (let i = 0; i < 100; i++) {
 *     try {
 *       // Perform a long-running operation
 *     } catch (error) {
 *       logger.error(`Error during long operation ${i}: ${error?.message ?? '-'});`);
 *     }
 *     if (i % 10 === 0) logger.progress(i / 100);
 *   }
 * }
 *
 * // In the Admin UI
 *
 * import { DefaultLogger } from '@openvaa/core';
 *
 * const logger = new DefaultLogger({
 *   onProgess: (value: number) => console.info(`Custom progress: ${value * 100}%`)
 * });
 *
 * longOperation(); // Progress will be logged to the console.
 * ```
 */
export interface Logger {
  /**
   * Called when the progress of an operation is updated.
   * @param value - A number between 0 and 1 representing the progress of the operation.
   */
  progress: (value: number) => unknown;
  /**
   * Called for info messages. Used for transient status updates (e.g. estimate of time of completion), metrics (e.g. current cost), or info on auto-recovered issues (e.g. call for operation X failed - retrying).
   */
  info: (message: string) => unknown;
  /**
   * Called for warnings. Used for strategic issues that require admin awareness but do not stop the process (e.g. data quality issues or performance degradation).
   */
  warning: (message: string) => unknown;
  /**
   * Called for error messages. Used for critical, iteration-stopping issues. Note that a normal `Error` should be thrown by the process in case of unrecoverable errors.
   */
  error: (message: string) => unknown;

  /**
   * Optional method for hierarchical progress tracking.
   * Defines sub-operations for a specific operation to enable granular progress tracking.
   * @param operationId - The ID of the operation to break down
   * @param subOperations - Array of sub-operations with their weights
   */
  defineSubOperations?: (operationId: string, subOperations: Array<{ id: string; weight?: number }>) => void;

  /**
   * Optional method for getting the current operation.
   */
  getCurrentOperation?: () => { id: string; index: number; total: number } | null;
}

/**
 * Constructor parameters for the `DefaultLogger` class, overriding the default log methods. The default methods are used if the corresponding option is nullish. Pass a noop `() => void` function, if the even the default methods should not be used.
 */
export type DefaultLoggerOptions = {
  /**
   * Called when the progress of an operation is updated.
   * @param value - A number between 0 and 1 representing the progress of the operation.
   */
  onProgress?: (value: number) => unknown;
  /**
   * Called when the status of an operation changes.
   * @param message - A message describing the current status of the operation.
   * @param type - Optional, a level of severity for the message. Defaults to 'info'. See {@link Logger} for the available levels.
   */
  onMessage?: (message: string, type?: LogLevel) => unknown;
};

/**
 * The log level for messages. See the associated methods in {@link Logger} for descriptions of the levels.
 */
export type LogLevel = 'warning' | 'error' | 'info';
