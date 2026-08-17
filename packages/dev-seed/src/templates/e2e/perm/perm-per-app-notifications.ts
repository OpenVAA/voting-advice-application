/**
 * perm-per-app-notifications minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates. The under-test setting
 * is `notifications.voterApp` + `notifications.candidateApp`, each set to a
 * DISTINCT visible notification (show: true with distinct title/content
 * markers `[notif-voter]` / `[notif-cand]`). The spec asserts each app's
 * notification renders ONLY on its own route — strict cross-route absence
 * enforcement.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-notif-'` (distinct from
 * every other perm template, enabling parallel-safe execution across the
 * wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS (helper default), then
 * overrides `notifications` with BOTH voterApp + candidateApp NotificationData
 * payloads (per packages/app-shared/src/settings/dynamicSettings.type.ts:303-312
 * + NotificationData shape at :397-415).
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-notif-';

export const permPerAppNotificationsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 2,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    notifications: {
      voterApp: {
        show: true,
        title: { en: '[notif-voter] Voter-only notification.' },
        content: { en: '[notif-voter-content] voter content body' }
      },
      candidateApp: {
        show: true,
        title: { en: '[notif-cand] Candidate-only notification.' },
        content: { en: '[notif-cand-content] candidate content body' }
      }
    }
  }
});

export default permPerAppNotificationsTemplate;
