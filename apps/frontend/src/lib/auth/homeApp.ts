import { log } from '@openvaa/app-shared';
import { ADMIN_GRANTS, CONTESTANT_GRANTS, hasAnyGrant, readSessionGrants } from './roles';
import type { GrantClaim } from './roles';

/**
 * Whether a grant set opens the Admin App and not the Contestant App: it holds a shape of `ADMIN_GRANTS` and none of `CONTESTANT_GRANTS`.
 *
 * Such a user's home is the Admin App's. A user who holds both kinds is at home in either app, and the Contestant App is the one a link that names no app lands in.
 *
 * @param grants - The grants that reach this project, as the data writer's `getProjectGrants` answers them.
 * @returns `true` for an admin-only grant set.
 */
export function isAdminOnly(grants: ReadonlyArray<GrantClaim>): boolean {
  return hasAnyGrant(grants, ADMIN_GRANTS) && !hasAnyGrant(grants, CONTESTANT_GRANTS);
}

/**
 * Whether a grant set opens the Contestant App and not the Admin App: it holds a shape of `CONTESTANT_GRANTS` and none of `ADMIN_GRANTS`. The mirror of {@link isAdminOnly}; no set is both.
 *
 * Such a user's home is the Contestant App's, so a mailed link the Admin App asked for lands them there.
 *
 * @param grants - The grants that reach this project, as the data writer's `getProjectGrants` answers them.
 * @returns `true` for a contestant-only grant set.
 */
export function isContestantOnly(grants: ReadonlyArray<GrantClaim>): boolean {
  return hasAnyGrant(grants, CONTESTANT_GRANTS) && !hasAnyGrant(grants, ADMIN_GRANTS);
}

/**
 * Whether a verified session's grants in this project are admin-only, as {@link isAdminOnly} reads them.
 *
 * The grants that reach this project are read only when the session's token holds an admin grant somewhere: the token lists the user's grants in every project, so a token without one holds none here either. A read that fails is logged and answered `false`, so it sends nobody to the Admin App.
 *
 * @param session - A session `safeGetSession` verified.
 * @param readProjectGrants - The read of the grants that reach this project, the data writer's `getProjectGrants`.
 * @param logLabel - Names the caller in the log line of a read that failed.
 * @returns `true` when the session's grants in this project are admin-only.
 */
export async function isAdminOnlyInProject(
  session: { access_token: string },
  readProjectGrants: () => Promise<Array<GrantClaim>>,
  logLabel: string
): Promise<boolean> {
  if (!hasAnyGrant(readSessionGrants(session), ADMIN_GRANTS)) return false;
  const grants = await readProjectGrants().catch((e: Error | undefined) => {
    log.error(`${logLabel}: reading the grants that reach this project failed: ${e?.message ?? '-'}`);
    return undefined;
  });
  return grants !== undefined && isAdminOnly(grants);
}

/**
 * Whether a verified session's grants in this project are contestant-only, as {@link isContestantOnly} reads them. The mirror of {@link isAdminOnlyInProject}.
 *
 * The grants that reach this project are read only when the session's token holds a contestant grant somewhere: the token lists the user's grants in every project, so a token without one holds none here either. A read that fails is logged and answered `false`, so it sends nobody to the Contestant App.
 *
 * @param session - A session `safeGetSession` verified.
 * @param readProjectGrants - The read of the grants that reach this project, the data writer's `getProjectGrants`.
 * @param logLabel - Names the caller in the log line of a read that failed.
 * @returns `true` when the session's grants in this project are contestant-only.
 */
export async function isContestantOnlyInProject(
  session: { access_token: string },
  readProjectGrants: () => Promise<Array<GrantClaim>>,
  logLabel: string
): Promise<boolean> {
  if (!hasAnyGrant(readSessionGrants(session), CONTESTANT_GRANTS)) return false;
  const grants = await readProjectGrants().catch((e: Error | undefined) => {
    log.error(`${logLabel}: reading the grants that reach this project failed: ${e?.message ?? '-'}`);
    return undefined;
  });
  return grants !== undefined && isContestantOnly(grants);
}
