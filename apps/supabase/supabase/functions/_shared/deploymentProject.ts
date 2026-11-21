/**
 * Whether a request names the project a deployment serves.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. `account-access` and `send-email` each serve the one project `PUBLIC_PROJECT_ID` names, by this one rule, and import it by relative path (`../_shared/deploymentProject.ts`).
 */

import { isUuid } from './guards.ts';

/**
 * Whether the project a request names is the deployment's.
 *
 * @param projectId - The project the request names, of any type
 * @param configured - The deployment's `PUBLIC_PROJECT_ID`
 * @returns True only when `configured` is a uuid and `projectId` is a string that, trimmed, names the same project, compared without case
 */
export function isDeploymentProject(projectId: unknown, configured: string): boolean {
  return (
    isUuid(configured) && typeof projectId === 'string' && projectId.trim().toLowerCase() === configured.toLowerCase()
  );
}
