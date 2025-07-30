import type { DefaultLoggerOptions, Logger, LogLevel } from './logger.type';

/**
 * A simple implementation of the `Logger` interface, which can be provided overrides for the default functions.
 */
export class DefaultLogger implements Logger {
  onMessage: DefaultLoggerOptions['onMessage'];
  onProgress: DefaultLoggerOptions['onProgress'];

  /**
   * @param options - Optional overrides for the default log methods.
   */
  constructor({ onProgress, onMessage }: DefaultLoggerOptions = {}) {
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
}
