/**
 * perm-closed-project minimal-data template: a project that is NOT open for voters.
 *
 * Purpose: the closed-project state for PERMFU-04/05. Before this template every seeded project was open, so no spec could see the closed state (discharges WINDOWS.md 268, 162.1 D-21). The `openForVoters: false` slot makes the writer's final pass set `projects.open_for_voters = false` on the target project.
 *
 * Why `access.voterApp` stays `true`: a maintenance page seen against this template can then only have been caused by the project being closed, never by the access flag.
 *
 * ⚠ `yarn db:seed --template perm-closed-project` closes the DEFAULT project (`00000000-0000-0000-0000-000000000001`), which is what a local `yarn dev` serves; `yarn db:seed:teardown --prefix e2e-perm-closed-project-` reopens it (D-19). The E2E setup targets the E2E project instead.
 *
 * Topology: 1 election, 1 CG with 1 CO, 1 candidate, 1 opinion Likert-5 question, via `buildMinimal`.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-closed-project-'`, distinct from every other perm template.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-closed-project-';

export const permClosedProjectTemplate: Template = {
  ...buildMinimal({
    externalIdPrefix: P,
    candidates: 1,
    opinionQuestions: 1,
    infoQuestions: 0,
    settingsOverlay: {
      access: { voterApp: true, candidateApp: true, underMaintenance: false }
    }
  }),
  openForVoters: false
};

export default permClosedProjectTemplate;
