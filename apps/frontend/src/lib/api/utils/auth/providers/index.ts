/**
 * Provider factory.
 *
 * Returns the active identity provider based on the `PUBLIC_IDENTITY_PROVIDER_TYPE`
 * environment variable. Defaults to `'signicat'` for backward compatibility with
 * existing deployments.
 *
 * Usage:
 * ```typescript
 * import { getActiveProvider } from '$lib/api/utils/auth/providers';
 * const provider = getActiveProvider();
 * const result = await provider.getAuthorizeUrl({ redirectUri });
 * ```
 */

import { constants } from '$lib/utils/constants';
import type { IdentityProvider, ProviderType } from './types';
import { signicatProvider } from './signicat';
import { iduraProvider } from './idura';

/**
 * Get the active identity provider based on environment configuration.
 *
 * Reads `PUBLIC_IDENTITY_PROVIDER_TYPE` from public constants and returns the
 * corresponding provider implementation. Defaults to `'signicat'` when the
 * env var is unset or empty.
 *
 * @throws {Error} If `PUBLIC_IDENTITY_PROVIDER_TYPE` contains an unsupported value.
 */
export function getActiveProvider(): IdentityProvider {
  const providerType = (constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat') as ProviderType;
  switch (providerType) {
    case 'idura':
      return iduraProvider;
    case 'signicat':
      return signicatProvider;
    default:
      throw new Error(`Unknown identity provider type: ${providerType}. Expected 'signicat' or 'idura'.`);
  }
}

export type { IdentityProvider, AuthConfig, ProviderType } from './types';
