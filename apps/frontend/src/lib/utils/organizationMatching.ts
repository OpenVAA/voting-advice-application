import { dynamicSettings, log } from '@openvaa/app-shared';
import type { OrganizationMatchingMethod } from '@openvaa/app-shared';

/**
 * Every value `matching.organizationMatching` may take.
 */
const ORGANIZATION_MATCHING_METHODS: ReadonlyArray<OrganizationMatchingMethod> = ['none', 'answersOnly', 'impute'];

/**
 * The out-of-vocabulary values already logged, so each is logged once rather than on every recomputation.
 */
const reported = new Set<string>();

/**
 * Resolve a stored `matching.organizationMatching` to a method the matcher supports.
 *
 * A missing or empty value falls back to the shipped default: the settings merge replaces `matching` as a whole, so a stored `matching` object without the key would otherwise switch party matching off. A value outside the vocabulary also falls back, and is logged once. An explicit `'none'` is kept, and means no party gets a match score.
 * @param value - The stored value.
 * @returns The method to match with.
 */
export function resolveOrganizationMatching(value: unknown): OrganizationMatchingMethod {
  if (ORGANIZATION_MATCHING_METHODS.includes(value as OrganizationMatchingMethod))
    return value as OrganizationMatchingMethod;
  const fallback = dynamicSettings.matching.organizationMatching;
  if (value != null && value !== '') {
    const key = String(value);
    if (!reported.has(key)) {
      reported.add(key);
      log.warn(`Unknown matching.organizationMatching value "${key}", using "${fallback}".`);
    }
  }
  return fallback;
}
