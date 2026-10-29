import type { AnalyticsProvider } from './provider.type';

/**
 * The provider that keeps nothing.
 *
 * @returns A provider whose `capture` resolves and does nothing.
 */
export function createNoneProvider(): AnalyticsProvider {
  return {
    name: 'none',
    capture: () => Promise.resolve()
  };
}
