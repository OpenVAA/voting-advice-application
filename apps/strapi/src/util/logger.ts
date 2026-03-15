/**
 * Log a debug message to the console.
 */
export function warn(...args: Array<unknown>): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.warn(...args);
}

/**
 * Log an error message to the console and throw an error.
 */
export function error(msg: string, ...args: Array<unknown>): never {
  warn(msg, ...args);
  throw new Error(msg);
}
