/**
 * The rule by which `account-access` and `send-email` serve the one project their deployment names.
 */

import { describe, expect, it } from 'vitest';
import { isDeploymentProject } from './deploymentProject.ts';

const PROJECT = '00000000-0000-0000-0000-000000000001';

describe('isDeploymentProject', () => {
  it("accepts the deployment's project, whatever the case of either value", () => {
    expect(isDeploymentProject(PROJECT, PROJECT)).toBe(true);
    expect(isDeploymentProject('abcdef00-0000-0000-0000-000000000001', 'ABCDEF00-0000-0000-0000-000000000001')).toBe(
      true
    );
    expect(isDeploymentProject('ABCDEF00-0000-0000-0000-000000000001', 'abcdef00-0000-0000-0000-000000000001')).toBe(
      true
    );
  });

  it('accepts the project named with surrounding white space', () => {
    expect(isDeploymentProject(` ${PROJECT}\n`, PROJECT)).toBe(true);
  });

  it('refuses another project', () => {
    expect(isDeploymentProject('00000000-0000-0000-0000-000000000002', PROJECT)).toBe(false);
  });

  it.each([[undefined], [null], [1], [''], ['   '], [{ id: PROJECT }]])('refuses the named project %j', (projectId) => {
    expect(isDeploymentProject(projectId, PROJECT)).toBe(false);
  });

  it.each([[''], ['not-a-uuid'], [`${PROJECT} `]])(
    'refuses every project under the configured value %j',
    (configured) => {
      expect(isDeploymentProject(PROJECT, configured)).toBe(false);
    }
  );
});
