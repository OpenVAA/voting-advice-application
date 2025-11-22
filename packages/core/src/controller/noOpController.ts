import type { Controller } from './controller.type';

/**
 * A no-op controller that does not log or do anything. Useful for tests.
 */
export const noOpController: Controller = {
  info: () => {},
  warning: () => {},
  error: () => {},
  progress: () => {},
  checkAbort: () => {},
  defineSubOperations: () => {},
  getCurrentOperation: () => null
};