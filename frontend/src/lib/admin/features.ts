import { type Route } from '$lib/utils/route';

/** A type that lists all features that are available in the Admin App */
export type AdminFeature = 'ArgumentCondensation' | 'QuestionInfoGeneration';

/** Central registry for all feature-related info. Used as a source of truth for feature routes, admin job names, etc.
 * 
 * @example
 * ```ts
 * import { ADMIN_FEATURE } from '$lib/admin/features';
 * 
 * const argCond = ADMIN_FEATURE.ArgumentCondensation;
 * const argCondRoute = argCond.route;     // used to navigate to the feature in the Admin App
 * const argCondJobName = argCond.jobName; // used to identify the job in the jobs database
 * ```
*/
export const ADMIN_FEATURE: Record<AdminFeature, { route: Route; jobName: string }> = {
  ArgumentCondensation: {
    route: 'AdminAppArgumentCondensation',
    jobName: 'argument-condensation'
  },
  QuestionInfoGeneration: {
    route: 'AdminAppQuestionInfo',
    jobName: 'question-info-generation'
  }
} as const;
