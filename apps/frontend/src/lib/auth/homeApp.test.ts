/**
 * The two statements of a grant set at home in one app alone: an admin-only set holds a grant that opens the Admin App and none that opens the Contestant App, and a contestant-only set the other way round.
 */

import { describe, expect, it } from 'vitest';
import { isAdminOnly, isContestantOnly } from './homeApp';
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
    ['an admin grant and a grant that opens neither app', [PROJECT_ADMIN, PROJECT_EDITOR]]
  ])('is true for %s', (_kind, grants) => {
    expect(isAdminOnly(grants)).toBe(true);
  });

  it.each([
    ['an admin grant and a candidate editor grant', [PROJECT_ADMIN, CANDIDATE_EDITOR]],
    ['an admin grant and an organization editor grant', [GLOBAL_ADMIN, ORGANIZATION_EDITOR]],
    ['an editor grant alone', [CANDIDATE_EDITOR]],
    ['a project editor grant alone', [PROJECT_EDITOR]],
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
    ['an editor grant and a grant that opens neither app', [CANDIDATE_EDITOR, PROJECT_EDITOR]]
  ])('is true for %s', (_kind, grants) => {
    expect(isContestantOnly(grants)).toBe(true);
  });

  it.each([
    ['an admin grant and a candidate editor grant', [PROJECT_ADMIN, CANDIDATE_EDITOR]],
    ['a global admin grant and an organization editor grant', [GLOBAL_ADMIN, ORGANIZATION_EDITOR]],
    ['an admin grant alone', [ACCOUNT_ADMIN]],
    ['a project editor grant alone', [PROJECT_EDITOR]],
    ['an entity-scope admin grant, which opens nothing', [ENTITY_ADMIN]],
    ['no grant', []]
  ])('is false for %s', (_kind, grants) => {
    expect(isContestantOnly(grants)).toBe(false);
  });

  it('is never true of a set isAdminOnly is true of', () => {
    for (const grants of [
      [PROJECT_ADMIN],
      [GLOBAL_ADMIN, PROJECT_EDITOR],
      [CANDIDATE_EDITOR],
      [PROJECT_ADMIN, CANDIDATE_EDITOR],
      []
    ])
      expect(isAdminOnly(grants) && isContestantOnly(grants)).toBe(false);
  });
});
