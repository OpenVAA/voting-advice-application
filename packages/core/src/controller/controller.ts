import type { BaseControllerOptions, Controller, LogLevel } from './controller.type';

/**
 * A simple implementation of the `Controller` interface, which can be provided overrides for the default functions.
 */
export class BaseController implements Controller {
  onMessage: BaseControllerOptions['onMessage'];
  onProgress: BaseControllerOptions['onProgress'];

  /**
   * @param options - Optional overrides for the default log methods.
   */
  constructor({ onProgress, onMessage }: BaseControllerOptions = {}) {
    this.onProgress = onProgress;
    this.onMessage = onMessage;
  }

  info(message: string): void {
    this.handleInfo(message, 'info');
  }

  warning(message: string): void {
    this.handleInfo(message, 'warning');
  }

  error(message: string): void {
    this.handleInfo(message, 'error');
  }

  progress(value: number): unknown {
    if (this.onProgress) return this.onProgress(value);
    this.defaultLogProgress(value);
  }

  protected handleInfo(message: string, type: LogLevel = 'info'): unknown {
    if (this.onMessage) return this.onMessage(message, type);
    this.defaultLogInfo(message, type);
  }

  protected defaultLogInfo(message: string, type: LogLevel = 'info'): void {
    switch (type) {
      case 'warning':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      default:
        console.info(message);
        break;
    }
  }

  protected defaultLogProgress(progress: number): void {
    console.info(`Progress: ${Math.round(progress * 100)}%`);
  }

  /////////////////////////////////////////////////////////
  // Overridable methods
  /////////////////////////////////////////////////////////

  /**
   * Override in subclasses to implement aborting the operation.
   */
  checkAbort(): void {
    // No-op by default
  }

  /**
   * Override in subclasses to implement sub-operation progress logging.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineSubOperations(operationId: string, subOperations: Array<{ id: string; weight?: number }>): void {
    // No-op by default
  }

  /**
   * Override in subclasses to implement sub-operation progress logging.
   */
  getCurrentOperation(): { id: string; index: number; total: number } | null {
    // No-op by default
    return null;
  }
}
