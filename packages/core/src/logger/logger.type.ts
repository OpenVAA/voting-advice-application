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
   * Called for info messages.
   */
  info: (message: string) => unknown;
  /**
   * Called for warnings.
   */
  warning: (message: string) => unknown;
  /**
   * Called for error messages.
   */
  error: (message: string) => unknown;
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
   * @param type - Optional, a level of severity for the message. Defaults to 'info'.
   */
  onInfo?: (message: string, type?: LogLevel) => unknown;
};

/**
 * The log level for messages.
 */
export type LogLevel = 'warning' | 'error' | 'info';
