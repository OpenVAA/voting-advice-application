import type { StrapiContext } from '../../types/customStrapiTypes';

/**
 * A policy for debugging that always returns `true` and logs the context.
 */
export default function debug({ params, request, state, ...rest }: StrapiContext): true {
  console.info('Policy: global::debug called with ctx:', { params, request, state, ...rest });
  return true;
}
