/**
 * The two statements of a grant set at home in one app alone: an admin-only set holds a grant that opens the Admin App and none that opens the Contestant App, and a contestant-only set the other way round.
 *
 * `isContestantOnlyInProject` reads the project's grants only for a token that holds a contestant grant, answers on those grants, and answers `false`, logged, for a read that fails.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAdminOnly, isContestantOnly, isContestantOnlyInProject } from './homeApp';
import type { GrantClaim } from './roles';

const PROJECT_ADMIN: GrantClaim = { scope: 'project', target_type: null, target_id: 'project-1', role: 'admin' };
const ACCOUNT_ADMIN: GrantClaim = { scope: 'account', target_type: null, target_id: 'account-1', role: 'admin' };
const GLOBAL_ADMIN: GrantClaim = { scope: 'global', target_type: null, target_id: null, role: 'admin' };
const CANDIDATE_EDITOR: GrantClaim = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };
const ORGANIZATION_EDITOR: GrantClaim = {
  scope: 'entity',
  target_type: 'organization',
  target_id: 'org-1',
  role: 'editor'
};
const PROJECT_EDITOR: GrantClaim = { scope: 'project', target_type: null, target_id: 'project-1', role: 'editor' };
const ENTITY_ADMIN: GrantClaim = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'admin' };

describe('isAdminOnly', () => {
  it.each([
    ['a project admin grant', [PROJECT_ADMIN]],
    ['an account admin grant', [ACCOUNT_ADMIN]],
    ['a global admin grant', [GLOBAL_ADMIN]],
    ['a project editor grant', [PROJECT_EDITOR]],
    ['an admin grant and a project editor grant', [PROJECT_ADMIN, PROJECT_EDITOR]],
    ['an admin grant and a grant that opens neither app', [PROJECT_ADMIN, ENTITY_ADMIN]]
  ])('is true for %s', (_kind, grants) => {
    expect(isAdminOnly(grants)).toBe(true);
  });

  it.each([
    ['an admin grant and a candidate editor grant', [PROJECT_ADMIN, CANDIDATE_EDITOR]],
    ['an admin grant and an organization editor grant', [GLOBAL_ADMIN, ORGANIZATION_EDITOR]],
    ['a project editor grant and a candidate editor grant', [PROJECT_EDITOR, CANDIDATE_EDITOR]],
    ['an editor grant alone', [CANDIDATE_EDITOR]],
    ['an entity-scope admin grant, which opens nothing', [ENTITY_ADMIN]],
    ['no grant', []]
  ])('is false for %s', (_kind, grants) => {
    expect(isAdminOnly(grants)).toBe(false);
  });
});

describe('isContestantOnly', () => {
  it.each([
    ['a candidate editor grant', [CANDIDATE_EDITOR]],
    ['an organization editor grant', [ORGANIZATION_EDITOR]],
    ['an editor grant and a grant that opens neither app', [CANDIDATE_EDITOR, ENTITY_ADMIN]]
  ])('is true for %s', (_kind, grants) => {
    expect(isContestantOnly(grants)).toBe(true);
  });

  it.each([
    ['an admin grant and a candidate editor grant', [PROJECT_ADMIN, CANDIDATE_EDITOR]],
    ['a global admin grant and an organization editor grant', [GLOBAL_ADMIN, ORGANIZATION_EDITOR]],
    ['an admin grant alone', [ACCOUNT_ADMIN]],
    ['a project editor grant alone', [PROJECT_EDITOR]],
    ['a project editor grant and a candidate editor grant', [PROJECT_EDITOR, CANDIDATE_EDITOR]],
    ['an entity-scope admin grant, which opens nothing', [ENTITY_ADMIN]],
    ['no grant', []]
  ])('is false for %s', (_kind, grants) => {
    expect(isContestantOnly(grants)).toBe(false);
  });

  it('is never true of a set isAdminOnly is true of', () => {
    for (const grants of [
      [PROJECT_ADMIN],
      [GLOBAL_ADMIN, PROJECT_EDITOR],
      [PROJECT_EDITOR],
      [CANDIDATE_EDITOR],
      [PROJECT_ADMIN, CANDIDATE_EDITOR],
      []
    ])
      expect(isAdminOnly(grants) && isContestantOnly(grants)).toBe(false);
  });
});

/**
 * A session whose well-formed access token carries the given grants. Its signature is meaningless: the grants are read of a session already verified.
 * @param grants - The grants the token claims.
 * @returns The session.
 */
function sessionWith(grants: ReadonlyArray<GrantClaim>): { access_token: string } {
  return { access_token: `header.${btoa(JSON.stringify({ grants }))}.signature` };
}

describe('isContestantOnlyInProject', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is false for a token with no contestant grant, and reads nothing', async () => {
    const read = vi.fn(async () => [CANDIDATE_EDITOR]);

    await expect(isContestantOnlyInProject(sessionWith([PROJECT_ADMIN]), read, 'test')).resolves.toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it('is true when the grants that reach this project are contestant-only', async () => {
    const read = vi.fn(async () => [CANDIDATE_EDITOR]);

    await expect(isContestantOnlyInProject(sessionWith([CANDIDATE_EDITOR]), read, 'test')).resolves.toBe(true);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('is false when the grants that reach this project also open the Admin App, or open nothing', async () => {
    const session = sessionWith([CANDIDATE_EDITOR, PROJECT_ADMIN]);

    await expect(
      isContestantOnlyInProject(session, async () => [CANDIDATE_EDITOR, PROJECT_ADMIN], 'test')
    ).resolves.toBe(false);
    await expect(isContestantOnlyInProject(session, async () => [], 'test')).resolves.toBe(false);
  });

  it('is false, and logs the caller, when the read fails', async () => {
    const logged = vi.spyOn(log, 'error').mockImplementation(() => undefined);

    await expect(
      isContestantOnlyInProject(sessionWith([ORGANIZATION_EDITOR]), () => Promise.reject(new Error('down')), 'caller')
    ).resolves.toBe(false);
    expect(logged).toHaveBeenCalledTimes(1);
    expect(String(logged.mock.calls[0][0])).toContain('caller');
  });
});
