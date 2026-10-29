/** The consent modes a deployment can run in: `gated` asks the visitor before any event other than the pageview is sent, `free` sends without asking and keeps no visit id on sensitive events. */
export const CONSENT_MODES = ['gated', 'free'] as const;

/** One of {@link CONSENT_MODES}. */
export type ConsentMode = (typeof CONSENT_MODES)[number];

/** The visit-id modes a deployment can run in: `memory` keeps one visit id in memory for the life of the page, `none` sends no visit id at all. */
export const VISIT_ID_MODES = ['memory', 'none'] as const;

/** One of {@link VISIT_ID_MODES}. */
export type VisitIdMode = (typeof VISIT_ID_MODES)[number];

/** The apps an event can belong to. */
export const ANALYTICS_APPS = ['voter', 'contestant', 'admin'] as const;

/** One of {@link ANALYTICS_APPS}. */
export type AnalyticsApp = (typeof ANALYTICS_APPS)[number];

/** What the server tells the browser about analytics. The provider itself is never part of it. */
export type AnalyticsProjection = {
  /** Whether a provider is configured, i.e. whether anything the browser sends is kept. */
  active: boolean;
  /** The consent mode of the deployment. */
  consentMode: ConsentMode;
  /** The visit-id mode of the deployment. */
  visitIdMode: VisitIdMode;
};

/** The projection of a deployment with no provider: nothing is kept, and the modes hold their defaults. */
export const INACTIVE_PROJECTION: AnalyticsProjection = { active: false, consentMode: 'gated', visitIdMode: 'memory' };
