/**
 * Provider factory.
 *
 * Returns the active identity provider based on the `PUBLIC_IDENTITY_PROVIDER_TYPE` environment variable. The `'signicat-ftn'` default for an unset variable is applied once, at `$lib/utils/constants`; this module applies none of its own.
 *
 * Usage:
 * ```typescript
 * import { getActiveProvider } from '$lib/api/utils/auth/providers';
 * const provider = getActiveProvider();
 * const result = await provider.getAuthorizeUrl({ redirectUri });
 * ```
 */

import { constants } from '$lib/utils/constants';
import { iduraProvider } from './idura';
import { signicatProvider } from './signicat';
import type { IdentityProvider, ProviderType } from './types';

/**
 * Get the active identity provider based on environment configuration.
 *
 * Reads `PUBLIC_IDENTITY_PROVIDER_TYPE` from public constants and returns the corresponding provider implementation. The constant is already defaulted to `'signicat-ftn'` when the env var is unset, so an explicitly empty value, an unknown value or a keyword without its `-ftn` suffix is a misconfiguration and throws rather than silently selecting a provider.
 *
 * @throws {Error} If `PUBLIC_IDENTITY_PROVIDER_TYPE` contains an unsupported value.
 */
export function getActiveProvider(): IdentityProvider {
  const providerType = constants.PUBLIC_IDENTITY_PROVIDER_TYPE as ProviderType;
  switch (providerType) {
    case 'idura-ftn':
      return iduraProvider;
    case 'signicat-ftn':
      return signicatProvider;
    default:
      throw new Error(`Unknown identity provider type: ${providerType}. Expected 'signicat-ftn' or 'idura-ftn'.`);
  }
}

export type { AuthConfig, IdentityProvider, ProviderType } from './types';
