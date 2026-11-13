/**
 * The choice of analytics provider from the resolved configuration. It is the only code that names a provider; every consumer calls `capture` on the interface.
 */
import { createLogProvider } from './log';
import { createNoneProvider } from './none';
import { createPostHogProvider } from './posthog';
import type { AnalyticsConfig } from '../config';
import type { AnalyticsProvider, ProviderDeps } from './provider.type';

export type { AnalyticsProvider, ProviderDeps } from './provider.type';

/**
 * Create the provider the configuration names. Anything not recognised, and `posthog` without its settings, gives the provider that keeps nothing.
 *
 * @param config - The resolved analytics configuration.
 * @param deps - The output stream, the `fetch` and the random id function the provider may use; the caller supplies the real ones.
 * @returns The provider.
 */
export function createProvider(config: AnalyticsConfig, deps: ProviderDeps): AnalyticsProvider {
  switch (config.provider) {
    case 'log':
      return createLogProvider({ write: deps.write });
    case 'posthog':
      if (!config.posthog) return createNoneProvider();
      return createPostHogProvider({ ...config.posthog, fetch: deps.fetch, randomId: deps.randomId });
    default:
      return createNoneProvider();
  }
}
